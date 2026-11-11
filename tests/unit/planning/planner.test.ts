import { describe, expect, it } from "vitest";
import { WeekInputSchema } from "../../../src/domain/input";
import { computeLoad, replan } from "../../../src/planning/capacity";
import { estimateEffort } from "../../../src/planning/effort";
import { createWeeklyPlan } from "../../../src/planning/planner";
import { describeEvidence } from "../../../src/planning/scoring";
import { sampleInput } from "../../support/fixtures";

describe("Wochenplan", () => {
  it("enthält fünf Ideen: drei Prioritäten und zwei Reserven mit allen Pflichtfeldern", () => {
    const plan = createWeeklyPlan(sampleInput());

    expect(plan.ideas).toHaveLength(5);
    expect(plan.ideas.filter((i) => i.role === "priority")).toHaveLength(3);
    expect(plan.ideas.filter((i) => i.role === "reserve")).toHaveLength(2);
    for (const idea of plan.ideas) {
      expect(idea.id).toBeTruthy();
      expect(idea.channels.length).toBeGreaterThan(0);
      expect(idea.owner).toMatch(/^[AB]$/);
      expect(idea.publishDate).toMatch(/^2026-11-(1[7-9]|2[01])$/);
      expect(idea.effort.total).toBeGreaterThan(0);
      expect(idea.rationale).not.toBe("");
    }
  });

  it("bezeichnet Inspirationsfunde nie als bestätigten Trend", () => {
    const plan = createWeeklyPlan(sampleInput());

    for (const idea of plan.ideas) {
      expect(idea.evidence).not.toMatch(/(?<!kein )bestätigter Trend/);
    }
    expect(
      describeEvidence([{ id: "F", channel: "tiktok", sourceId: "s", topicId: "T", note: "", views: 5 }]),
    ).toBe("Einzelfund – kein bestätigter Trend");
  });

  it("lässt Reichweite unbekannt, wenn eine Kennzahl fehlt", () => {
    const plan = createWeeklyPlan(sampleInput());
    const t1 = plan.ideas.find((i) => i.topicId === "T1")!;

    // F1 hat keine Aufrufzahl, F2 schon – die Summe wäre irreführend.
    expect(t1.knownViews).toBeNull();
    expect(t1.rationale).toContain("Reichweite der Funde: unbekannt");
  });

  it("schätzt Aufwand nachvollziehbar aus Format und Kanalzahl", () => {
    expect(estimateEffort("reel", 2)).toEqual({
      production: 60,
      variants: 10,
      coordination: 10,
      approval: 5,
      total: 85,
    });
  });
});

describe("Kapazitätsprüfung", () => {
  it("Testfall 4: Überlastung erzeugt Warnung und nachvollziehbare Umplanung, Budget bleibt gleich", () => {
    const input = sampleInput();
    const plan = createWeeklyPlan(input);

    const before = plan.loadBeforeReplan.find((l) => l.personId === "B")!;
    expect(before).toMatchObject({ planned: 155, budget: 150, overloaded: true });
    expect(plan.warnings[0]).toEqual({
      personName: "Person B",
      planned: 155,
      budget: 150,
      afterReplan: false,
    });
    expect(plan.replanSteps[0]).toMatchObject({
      kind: "swap",
      ideaId: "2026-W47-03",
      reserveId: "2026-W47-05",
      person: "Person B",
    });

    expect(plan.load.every((l) => !l.overloaded)).toBe(true);
    expect(plan.load.map((l) => l.budget)).toEqual([90, 150]);
    expect(input.people.map((p) => p.minutesPerWeek)).toEqual([90, 150]);
  });

  it("gibt eine Idee an eine andere Person ab, wenn dort Zeit frei ist", () => {
    const input = sampleInput();
    const people = [
      { id: "A", name: "Person A", minutesPerWeek: 300 },
      { id: "B", name: "Person B", minutesPerWeek: 150 },
    ];
    // Alles liegt bei B (z. B. von Hand so geplant), A hat reichlich Zeit
    const { ideas } = createWeeklyPlan({ ...input, people });
    for (const idea of ideas) idea.owner = "B";
    expect(computeLoad(ideas, people)[1]?.overloaded).toBe(true);

    const steps = replan(ideas, people);

    expect(steps[0]).toMatchObject({ kind: "reassign", from: "Person B", to: "Person A" });
    expect(computeLoad(ideas, people).every((l) => !l.overloaded)).toBe(true);
    expect(ideas.filter((i) => i.role === "priority")).toHaveLength(3);
  });

  it("warnt weiter, wenn keine Umplanung reicht, statt Zeit zu erfinden", () => {
    const input = sampleInput();
    input.people = [
      { id: "A", name: "Person A", minutesPerWeek: 10 },
      { id: "B", name: "Person B", minutesPerWeek: 10 },
    ];
    const plan = createWeeklyPlan(input);

    expect(plan.warnings.some((w) => w.afterReplan)).toBe(true);
    expect(plan.load.map((l) => l.budget)).toEqual([10, 10]);
  });
});

describe("Eingabeprüfung", () => {
  it("lehnt Funde mit unbekanntem Thema ab", () => {
    const raw = { ...sampleInput(), inspirationFinds: [...sampleInput().inspirationFinds] };
    raw.inspirationFinds[0] = { ...raw.inspirationFinds[0]!, topicId: "T99" };

    const result = WeekInputSchema.safeParse(raw);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("T99");
  });

  it("lehnt negative oder fehlende Zeitbudgets ab", () => {
    const raw = { ...sampleInput(), people: [{ id: "A", name: "Person A", minutesPerWeek: -5 }] };
    expect(WeekInputSchema.safeParse(raw).success).toBe(false);
  });

  it("lehnt doppelte Themen-IDs ab", () => {
    const input = sampleInput();
    const raw = { ...input, topics: [...input.topics, { ...input.topics[0]! }] };

    const result = WeekInputSchema.safeParse(raw);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toContain("Thema T1 ist doppelt vorhanden");
  });

  it("lehnt Medienreferenzen für unbekannte Themen ab", () => {
    const raw = { ...sampleInput(), media: { T99: "media/x.mp4" } };

    const result = WeekInputSchema.safeParse(raw);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("T99");
  });

  it("verlangt mindestens drei Inspirationsfunde", () => {
    const raw = { ...sampleInput(), inspirationFinds: sampleInput().inspirationFinds.slice(0, 2) };
    expect(WeekInputSchema.safeParse(raw).success).toBe(false);
  });
});

describe("Themenauswahl", () => {
  it("bewertet alle Themen nachvollziehbar und wählt die besten fünf", () => {
    const { ranking } = createWeeklyPlan(sampleInput());

    expect(ranking).toHaveLength(7);
    expect(ranking[0]).toMatchObject({
      topicId: "T1",
      seasonalPoints: 2,
      findPoints: 2,
      score: 4,
      initialRole: "priority",
    });
    expect(ranking.map((s) => s.topicId)).toEqual(["T1", "T6", "T2", "T3", "T5", "T4", "T7"]);
    expect(ranking.filter((s) => s.initialRole === "priority")).toHaveLength(3);
    expect(ranking.filter((s) => s.initialRole === "reserve")).toHaveLength(2);
    expect(ranking.slice(5).every((s) => s.initialRole === null && s.ideaId === null)).toBe(true);
    for (const s of ranking) expect(s.score).toBe(s.seasonalPoints + s.findPoints);
  });
});

describe("Quellen", () => {
  it("führt jeden Fund mit Quellenkennung, Kanal und Aufrufen (oder null) auf", () => {
    const t1 = createWeeklyPlan(sampleInput()).ideas.find((i) => i.topicId === "T1")!;

    expect(t1.finds).toEqual([
      { sourceId: "sim-tiktok-0001", channel: "tiktok", views: null },
      { sourceId: "sim-ig-0042", channel: "instagram", views: 1800 },
    ]);
  });
});

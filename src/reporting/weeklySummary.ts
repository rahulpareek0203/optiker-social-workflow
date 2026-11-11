import type { Briefing } from "../content/briefing";
import type { WeekInput } from "../domain/input";
import type { WeeklyPlan } from "../domain/plan";
import type { Post } from "../domain/post";
import type { HandoffResult } from "../handoff/handoff";
import { TEXTS } from "../i18n";
import { formatDate } from "../shared/dates";

export function describeResult(result: HandoffResult): string {
  switch (result.outcome) {
    case "handed_off":
      return `ÜBERGEBEN (simuliert) -> ${result.reference}`;
    case "already_handed_off":
      return "Diese Version wurde bereits übergeben – keine erneute Übergabe";
    case "blocked":
      return `BLOCKIERT: ${result.reasons.map((r) => TEXTS.de.reason[r]).join("; ")}`;
    case "failed":
      return `FEHLER bei der Übergabe, nichts übergeben: ${result.error}`;
  }
}

/** Wochenübersicht als Klartext, z. B. für den späteren E-Mail-Versand. */
export function buildWeeklySummary(args: {
  input: WeekInput;
  plan: WeeklyPlan;
  briefing: Briefing;
  posts: Post[];
  results: HandoffResult[];
  invalidated: string[];
  now: Date;
}): string {
  const { input, plan, briefing, posts, results, invalidated, now } = args;
  const personName = (id: string) => input.people.find((p) => p.id === id)?.name ?? id;
  const out: string[] = [];

  out.push(`Wochenübersicht ${plan.week} – ${input.brand}`);
  out.push(`Erstellt: ${now.toISOString().slice(0, 16).replace("T", " ")} UTC`);
  out.push("");
  out.push("Hinweis: Prototyp. Texte stammen aus festen Testantworten (simuliert). Übergaben sind");
  out.push("simuliert, es wurde nichts veröffentlicht und diese Übersicht wurde nicht versendet.");
  out.push("");

  out.push("THEMENAUSWAHL (Punkte: +2 saisonaler Anlass, +1 je Inspirationsfund)");
  for (const s of plan.ranking) {
    const role =
      s.initialRole === "priority"
        ? `Priorität ${s.ideaId}`
        : s.initialRole === "reserve"
          ? `Reserve ${s.ideaId}`
          : "nicht ausgewählt";
    out.push(
      `  ${s.rank}. ${s.topicId} ${s.title}: ${s.seasonalPoints} + ${s.findPoints} = ${s.score} Punkte -> ${role}`,
    );
  }
  out.push("  Bei Punktgleichheit entscheidet die Reihenfolge der Eingabe. Umplanungen siehe unten.");
  out.push("");

  const loadLine = (l: WeeklyPlan["load"][number], ideas: WeeklyPlan["ideas"]) =>
    `    ${l.name}: ${l.planned} von ${l.budget} Min. (` +
    (ideas
      .filter((i) => i.owner === l.personId)
      .map((i) => `${i.id} ${i.effort.total}`)
      .join(" + ") || "keine") +
    ")" +
    (l.overloaded ? ` – ÜBERLASTET (${l.planned - l.budget} Min. zu viel)` : `, ${l.remaining} Min. frei`);

  out.push("KAPAZITÄTSPRÜFUNG (nur Prioritäten, das Budget wird nie erhöht)");
  if (plan.warnings.length > 0 || plan.replanSteps.length > 0) {
    out.push("  1. Erster Entwurf (vor der Umplanung)");
    out.push(...plan.loadBeforeReplan.map((l) => loadLine(l, plan.draft)));
    for (const w of plan.warnings.filter((x) => !x.afterReplan))
      out.push(`  WARNUNG: ${TEXTS.de.warning(w)}`);
    for (const st of plan.replanSteps) out.push(`  UMPLANUNG: ${TEXTS.de.replan(st)}`);
    out.push("  2. Nach der Umplanung (endgültig)");
  }
  out.push(
    ...plan.load.map((l) =>
      loadLine(
        l,
        plan.ideas.filter((i) => i.role === "priority"),
      ),
    ),
  );
  for (const w of plan.warnings.filter((x) => x.afterReplan)) out.push(`  WARNUNG: ${TEXTS.de.warning(w)}`);
  out.push("");

  out.push("WOCHENPLAN");
  for (const role of ["priority", "reserve"] as const) {
    out.push(role === "priority" ? "Prioritäten:" : "Reserven:");
    for (const idea of plan.ideas.filter((i) => i.role === role)) {
      out.push(
        `  ${idea.id}  ${formatDate(idea.publishDate, TEXTS.de.weekdays)}  ${idea.topic}`,
        `      ${idea.format} auf ${idea.channels.join(", ")} | ${personName(idea.owner)} | ${idea.effort.total} Min. | Status: ${idea.status}`,
        `      Begründung: ${idea.rationale}`,
      );
    }
  }
  out.push("");

  out.push("BRIEFING");
  out.push(
    `  Vollständiges Produktionsbriefing für ${briefing.ideaId} („${briefing.topic}“) in briefing.md.`,
  );
  out.push("");

  out.push("FREIGABE UND ÜBERGABE");
  for (const post of posts) {
    const result = results.find((r) => r.postId === post.id);
    out.push(`  ${post.id} [${TEXTS.de.status[post.status]}] ${post.title}`);
    if (result) out.push(`      ${describeResult(result)}`);
  }
  for (const id of invalidated) out.push(`  ${TEXTS.de.invalidated(id)}`);
  out.push("");

  const waiting = posts.filter((p) => p.status === "in_review");
  if (waiting.length > 0) {
    out.push("OFFEN");
    out.push(
      `  ${waiting.length} Beitrag/Beiträge warten auf Freigabe: ${waiting.map((p) => p.id).join(", ")}`,
    );
    out.push("");
  }

  return out.join("\n");
}

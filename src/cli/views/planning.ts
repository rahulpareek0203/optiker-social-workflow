import type { WeekInput } from "../../domain/input";
import type { Idea, PersonLoad, WeeklyPlan } from "../../domain/plan";
import type { Texts } from "../../i18n/types";
import { formatDate } from "../../shared/dates";
import {
  type Column,
  WIDTH,
  bar,
  bold,
  cells,
  cyan,
  dim,
  field,
  green,
  red,
  section,
  truncate,
  wrap,
  yellow,
} from "../format";

const SELECTION_COLUMNS: Column[] = [
  { width: 4, right: true },
  { width: 34 },
  { width: 6, right: true },
  { width: 5, right: true },
  { width: 6, right: true },
];

/** `showReplan` = false zeigt nur die erste Auswahl, ohne das Ergebnis der Kapazitätsprüfung. */
export function renderSelection(t: Texts, plan: WeeklyPlan, showReplan = true): string {
  const [rank, topic, season, finds, score, result] = t.ui.selectionColumns;
  const out = [
    section(t.ui.selection),
    dim(`  ${cells(SELECTION_COLUMNS, [rank, topic, season, finds, score])}  ${result}`),
  ];
  const points = (n: number) => (n === 0 ? "–" : `+${n}`);

  for (const s of plan.ranking) {
    const row = `  ${cells(SELECTION_COLUMNS, [
      String(s.rank),
      `${s.topicId} ${s.title}`,
      points(s.seasonalPoints),
      points(s.findPoints),
      String(s.score),
    ])}  `;
    if (!s.initialRole || !s.ideaId) {
      out.push(dim(row) + red(`✖ ${t.ui.notSelected}`));
      continue;
    }
    const finalRole = plan.ideas.find((i) => i.id === s.ideaId)?.role ?? s.initialRole;
    const role = s.initialRole === "priority" ? `${yellow("★")} ${t.ui.priority}` : `○ ${t.ui.reserve}`;
    const moved =
      !showReplan || finalRole === s.initialRole
        ? ""
        : cyan(`  ${finalRole === "priority" ? t.ui.nowPriority : t.ui.nowReserve}`);
    out.push(`${row}${s.ideaId.slice(-2)} ${role}${moved}`);
  }
  out.push("", dim(t.ui.selectionNote));
  return out.join("\n");
}

const PLAN_COLUMNS: Column[] = [
  { width: 2 },
  { width: 10 },
  { width: 8 },
  { width: 4, right: true },
  { width: 8 },
  { width: 19 },
  { width: 34 },
];

function planHeader(t: Texts): string {
  return dim(`     ${cells(PLAN_COLUMNS, t.ui.planColumns)}`);
}

function ideaRow(t: Texts, plan: WeeklyPlan, idea: Idea): string {
  const owner = plan.load.find((l) => l.personId === idea.owner)?.name ?? idea.owner;
  const isPriority = idea.role === "priority";
  const row = cells(PLAN_COLUMNS, [
    idea.id.slice(-2),
    formatDate(idea.publishDate, t.weekdays),
    owner,
    String(idea.effort.total),
    idea.format,
    idea.channels.join(", "),
    idea.topic,
  ]);
  return isPriority ? `  ${yellow("★")}  ${row}` : dim(`  ○  ${row}`);
}

export function renderPlan(t: Texts, plan: WeeklyPlan): string {
  const out = [section(t.ui.plan(plan.week)), planHeader(t)];
  const ordered = [...plan.ideas].sort((a, b) => (a.role === b.role ? 0 : a.role === "priority" ? -1 : 1));

  for (const idea of ordered) {
    out.push(ideaRow(t, plan, idea));
    const views = idea.knownViews === null ? t.ui.unknown : String(idea.knownViews);
    const initialRole = plan.ranking.find((r) => r.ideaId === idea.id)?.initialRole;
    const moved =
      initialRole && initialRole !== idea.role
        ? `  ${cyan(idea.role === "priority" ? t.ui.movedUp : t.ui.demoted)}`
        : "";
    out.push(`${dim(`         ↳ ${t.evidence(idea.findCount)} · ${t.ui.reach}: ${views}`)}${moved}`);
    if (idea.finds.length > 0) {
      const sources = idea.finds
        .map(
          (f) => `${f.sourceId} (${f.channel}, ${t.ui.views}: ${f.views === null ? t.ui.unknown : f.views})`,
        )
        .join(", ");
      out.push(dim(`           ${t.ui.sources}: ${sources}`));
    }
  }
  out.push("", dim(t.ui.legend));
  return out.join("\n");
}

/** Je Person: Balken, Minuten, aus welchen Ideen sich die Summe ergibt, Status. */
function loadRows(t: Texts, loads: PersonLoad[], priorities: Idea[]): string[] {
  return loads.map((l) => {
    const parts = priorities.filter((i) => i.owner === l.personId).map((i) => i.id.slice(-2));
    const status = l.overloaded
      ? red(t.ui.overloadedBy(l.planned - l.budget))
      : green(t.ui.free(l.remaining));
    return (
      `     ${l.name.padEnd(9)} ${bar(l.planned, l.budget, l.overloaded)}  ` +
      `${`${l.planned}/${l.budget} ${t.ui.min}`.padEnd(13)} ${dim(`= ${parts.join(" + ") || "–"}`.padEnd(10))}  ${status}`
    );
  });
}

/** Zeigt den Ablauf der Prüfung: Entwurf, Warnung, Umplanung, Endstand. */
export function renderCapacity(t: Texts, plan: WeeklyPlan): string {
  const out = [section(t.ui.capacity)];
  const finalPriorities = plan.ideas.filter((i) => i.role === "priority");
  const replanned = plan.warnings.length > 0 || plan.replanSteps.length > 0;
  if (!replanned) {
    out.push(planHeader(t), ...finalPriorities.map((i) => ideaRow(t, plan, i)), "");
    out.push(...loadRows(t, plan.load, finalPriorities));
    return out.join("\n");
  }

  const label = (text: string, color: (s: string) => string) => `     ${bold(color(text))} `;
  const indent = " ".repeat(17);
  out.push(bold(t.ui.draft), planHeader(t), ...plan.draft.map((i) => ideaRow(t, plan, i)), "");
  out.push(...loadRows(t, plan.loadBeforeReplan, plan.draft), "");
  for (const w of plan.warnings.filter((x) => !x.afterReplan)) {
    out.push(label(t.ui.warningLabel, yellow) + wrap(t.warning(w), WIDTH - 18, indent));
  }
  for (const s of plan.replanSteps) {
    out.push(label(t.ui.replanLabel, cyan) + wrap(t.replan(s), WIDTH - 18, indent));
  }
  out.push("", bold(t.ui.final), ...loadRows(t, plan.load, finalPriorities));
  for (const w of plan.warnings.filter((x) => x.afterReplan)) {
    out.push("", label(t.ui.warningLabel, yellow) + wrap(t.warning(w), WIDTH - 18, indent));
  }
  return out.join("\n");
}

export function renderInput(t: Texts, input: WeekInput, file: string): string {
  const out = [section(t.ui.input(file))];
  out.push(field(t.ui.brand, `${input.brand} · ${input.week} (${input.weekStart})`));
  out.push(field(t.ui.tone, input.tone));
  out.push(field(t.ui.occasion, input.seasonalOccasion));
  out.push(
    field(t.ui.people, input.people.map((p) => `${p.name} ${p.minutesPerWeek} ${t.ui.min}`).join(" · ")),
  );

  out.push("", bold(`  ${t.ui.topics(input.topics.length)}`));
  for (const topic of input.topics) {
    const tag = topic.seasonal ? yellow(t.ui.seasonalTag.padEnd(9)) : " ".repeat(9);
    out.push(
      `    ${topic.id.padEnd(3)} ${topic.format.padEnd(9)} ${topic.channels.join(", ").padEnd(20)} ${tag} ${truncate(topic.title, 46)}`,
    );
  }

  out.push("", bold(`  ${t.ui.finds(input.inspirationFinds.length)}`));
  for (const f of input.inspirationFinds) {
    const views = `${t.ui.views}: ${f.views === null ? t.ui.unknown : f.views}`;
    out.push(
      `    ${f.id.padEnd(3)} ${f.sourceId.padEnd(16)} ${f.channel.padEnd(10)} → ${f.topicId.padEnd(3)} ${views.padEnd(18)} ${dim(truncate(f.note, 34))}`,
    );
  }

  const media = Object.entries(input.media);
  out.push("", bold(`  ${t.ui.media(media.length)}`));
  for (const [topicId, ref] of media) out.push(`    ${topicId.padEnd(3)} ${ref}`);
  return out.join("\n");
}

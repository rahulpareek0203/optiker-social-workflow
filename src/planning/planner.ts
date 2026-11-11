import type { InspirationFind, Topic, WeekInput } from "../domain/input";
import type { CapacityWarning, Idea, PersonLoad, TopicScore, WeeklyPlan } from "../domain/plan";
import { addDays } from "../shared/dates";
import { computeLoad, replan } from "./capacity";
import { estimateEffort } from "./effort";
import {
  POINTS_PER_FIND,
  SEASONAL_POINTS,
  buildRationale,
  describeEvidence,
  score,
  sumKnownViews,
} from "./scoring";

// Wochentag-Offsets ab Montag: Prioritäten Di/Do/Sa, Reserven Mi/Fr.
const PRIORITY_DAY_OFFSETS = [1, 3, 5];
const RESERVE_DAY_OFFSETS = [2, 4];

/**
 * Erstellt den Wochenplan: fünf Ideen (3 Prioritäten, 2 Reserven), Zuständigkeit,
 * Termine, Aufwand und Kapazitätsprüfung inkl. Umplanungsvorschlag.
 */
export function createWeeklyPlan(input: WeekInput): WeeklyPlan {
  const findsByTopic = new Map<string, InspirationFind[]>();
  for (const find of input.inspirationFinds) {
    findsByTopic.set(find.topicId, [...(findsByTopic.get(find.topicId) ?? []), find]);
  }
  const findsFor = (topic: Topic) => findsByTopic.get(topic.id) ?? [];

  // Array.sort ist stabil: bei Gleichstand gilt die Reihenfolge der Eingabe.
  const ranked = [...input.topics].sort((a, b) => score(b, findsFor(b)) - score(a, findsFor(a)));
  const selected = ranked.slice(0, 5);
  const ideaIdFor = (index: number) => `${input.week}-${String(index + 1).padStart(2, "0")}`;

  const ranking: TopicScore[] = ranked.map((topic, index) => ({
    rank: index + 1,
    topicId: topic.id,
    title: topic.title,
    seasonalPoints: topic.seasonal ? SEASONAL_POINTS : 0,
    findPoints: findsFor(topic).length * POINTS_PER_FIND,
    score: score(topic, findsFor(topic)),
    ideaId: index < 5 ? ideaIdFor(index) : null,
    initialRole: index < 3 ? "priority" : index < 5 ? "reserve" : null,
  }));

  const remaining = new Map(input.people.map((p) => [p.id, p.minutesPerWeek]));
  const personWithMostTime = () => [...remaining.entries()].sort((a, b) => b[1] - a[1])[0]![0];

  const ideas: Idea[] = selected.map((topic, index) => {
    const isPriority = index < 3;
    const finds = findsFor(topic);
    const effort = estimateEffort(topic.format, topic.channels.length);
    const owner = personWithMostTime();
    if (isPriority) remaining.set(owner, remaining.get(owner)! - effort.total);
    const dayOffset = isPriority ? PRIORITY_DAY_OFFSETS[index]! : RESERVE_DAY_OFFSETS[index - 3]!;

    return {
      id: ideaIdFor(index),
      topicId: topic.id,
      topic: topic.title,
      audience: topic.audience,
      channels: topic.channels,
      format: topic.format,
      owner,
      publishDate: addDays(input.weekStart, dayOffset),
      effort,
      role: isPriority ? "priority" : "reserve",
      status: isPriority ? "geplant" : "reserve",
      evidence: describeEvidence(finds),
      findCount: finds.length,
      finds: finds.map((f) => ({ sourceId: f.sourceId, channel: f.channel, views: f.views })),
      knownViews: sumKnownViews(finds),
      rationale: buildRationale(topic, finds, input.seasonalOccasion),
    };
  });

  const draft = structuredClone(ideas.filter((i) => i.role === "priority"));
  const loadBeforeReplan = computeLoad(ideas, input.people);
  const toWarning = (l: PersonLoad, afterReplan: boolean): CapacityWarning => ({
    personName: l.name,
    planned: l.planned,
    budget: l.budget,
    afterReplan,
  });
  const warnings = loadBeforeReplan.filter((l) => l.overloaded).map((l) => toWarning(l, false));
  const replanSteps = warnings.length > 0 ? replan(ideas, input.people) : [];
  const load = computeLoad(ideas, input.people);
  warnings.push(...load.filter((l) => l.overloaded).map((l) => toWarning(l, true)));

  return { week: input.week, ranking, draft, ideas, loadBeforeReplan, load, warnings, replanSteps };
}

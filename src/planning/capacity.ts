import type { Person } from "../domain/input";
import type { Idea, PersonLoad, ReplanStep } from "../domain/plan";

export function computeLoad(ideas: Idea[], people: Person[]): PersonLoad[] {
  return people.map((person) => {
    // Reserven binden keine Zeit, solange sie nicht nachrücken.
    const planned = ideas
      .filter((i) => i.role === "priority" && i.owner === person.id)
      .reduce((sum, i) => sum + i.effort.total, 0);
    return {
      personId: person.id,
      name: person.name,
      budget: person.minutesPerWeek,
      planned,
      remaining: person.minutesPerWeek - planned,
      overloaded: planned > person.minutesPerWeek,
    };
  });
}

/**
 * Löst Überlastung auf, ohne Budgets zu verändern: erst an eine Person mit
 * freier Zeit abgeben, sonst gegen eine kleinere Reserve tauschen.
 * Verändert `ideas` direkt und gibt die Schritte als Begründung zurück.
 */
export function replan(ideas: Idea[], people: Person[]): ReplanStep[] {
  const steps: ReplanStep[] = [];
  const loadOf = (id: string) => computeLoad(ideas, people).find((l) => l.personId === id)!;

  for (const person of people) {
    // Jeder Schritt entfernt eine Priorität dieser Person; damit endet die Schleife sicher.
    for (let guard = 0; guard < ideas.length && loadOf(person.id).overloaded; guard++) {
      // `ideas` ist nach Rang sortiert: die am niedrigsten bewertete Priorität weicht zuerst.
      const idea = ideas.filter((i) => i.role === "priority" && i.owner === person.id).at(-1);
      if (!idea) break;

      const other = people.find((p) => p.id !== person.id && loadOf(p.id).remaining >= idea.effort.total);
      if (other) {
        idea.owner = other.id;
        idea.rationale += `; Umplanung: von ${person.name} an ${other.name} übergeben`;
        steps.push({
          kind: "reassign",
          ideaId: idea.id,
          topic: idea.topic,
          minutes: idea.effort.total,
          from: person.name,
          to: other.name,
          freeMinutes: loadOf(other.id).remaining + idea.effort.total,
        });
        continue;
      }

      const freed = loadOf(person.id).remaining + idea.effort.total;
      const reserve = ideas
        .filter((i) => i.role === "reserve" && i.effort.total <= freed)
        .sort((a, b) => a.effort.total - b.effort.total)[0];
      if (reserve) {
        const priorityDate = idea.publishDate;
        idea.role = "reserve";
        idea.status = "reserve";
        idea.publishDate = reserve.publishDate;
        idea.rationale += "; Umplanung: wegen Kapazität zur Reserve zurückgestuft";
        reserve.role = "priority";
        reserve.status = "geplant";
        reserve.owner = person.id;
        reserve.publishDate = priorityDate;
        reserve.rationale += `; Umplanung: als kleinere Alternative nachgerückt (${reserve.effort.total} Min.)`;
        steps.push({
          kind: "swap",
          ideaId: idea.id,
          topic: idea.topic,
          minutes: idea.effort.total,
          reserveId: reserve.id,
          reserveTopic: reserve.topic,
          reserveMinutes: reserve.effort.total,
          person: person.name,
        });
        continue;
      }

      steps.push({ kind: "unresolved", person: person.name });
      break;
    }
  }
  return steps;
}

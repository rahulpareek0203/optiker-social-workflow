// Ergebnis der Wochenplanung.

import type { Channel, Format } from "./input";

export interface Effort {
  production: number;
  variants: number;
  coordination: number;
  approval: number;
  total: number;
}

export interface Idea {
  id: string;
  topicId: string;
  topic: string;
  audience: string;
  channels: Channel[];
  format: Format;
  owner: string;
  publishDate: string;
  effort: Effort;
  role: "priority" | "reserve";
  status: "geplant" | "reserve";
  evidence: string;
  findCount: number;
  finds: { sourceId: string; channel: Channel; views: number | null }[];
  /** Summierte Aufrufe der Funde; null, sobald eine Kennzahl fehlt. */
  knownViews: number | null;
  rationale: string;
}

export interface PersonLoad {
  personId: string;
  name: string;
  budget: number;
  planned: number;
  remaining: number;
  overloaded: boolean;
}

/** Überlastung einer Person; `afterReplan` = auch nach der Umplanung nicht gelöst. */
export interface CapacityWarning {
  personName: string;
  planned: number;
  budget: number;
  afterReplan: boolean;
}

export type ReplanStep =
  | {
      kind: "reassign";
      ideaId: string;
      topic: string;
      minutes: number;
      from: string;
      to: string;
      freeMinutes: number;
    }
  | {
      kind: "swap";
      ideaId: string;
      topic: string;
      minutes: number;
      reserveId: string;
      reserveTopic: string;
      reserveMinutes: number;
      person: string;
    }
  | { kind: "unresolved"; person: string };

/** Bewertung eines Themas; `initialRole` ist die Rolle vor einer möglichen Umplanung. */
export interface TopicScore {
  rank: number;
  topicId: string;
  title: string;
  seasonalPoints: number;
  findPoints: number;
  score: number;
  ideaId: string | null;
  initialRole: "priority" | "reserve" | null;
}

export interface WeeklyPlan {
  week: string;
  ranking: TopicScore[];
  /** Prioritäten im ersten Entwurf, vor einer Umplanung. */
  draft: Idea[];
  ideas: Idea[];
  loadBeforeReplan: PersonLoad[];
  load: PersonLoad[];
  warnings: CapacityWarning[];
  replanSteps: ReplanStep[];
}

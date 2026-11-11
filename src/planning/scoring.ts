import type { InspirationFind, Topic } from "../domain/input";
import { TEXTS } from "../i18n";

export const SEASONAL_POINTS = 2;
export const POINTS_PER_FIND = 1;

/** Beschreibt die Beleglage. Einzelne Funde werden nie als bestätigter Trend ausgegeben. */
export function describeEvidence(finds: InspirationFind[]): string {
  return TEXTS.de.evidence(finds.length);
}

export function sumKnownViews(finds: InspirationFind[]): number | null {
  if (finds.length === 0 || finds.some((f) => f.views === null)) return null;
  return finds.reduce((sum, f) => sum + (f.views ?? 0), 0);
}

export function score(topic: Topic, finds: InspirationFind[]): number {
  return (topic.seasonal ? SEASONAL_POINTS : 0) + finds.length * POINTS_PER_FIND;
}

export function buildRationale(topic: Topic, finds: InspirationFind[], seasonalOccasion: string): string {
  const parts: string[] = [];
  if (topic.seasonal) parts.push(`passt zum saisonalen Anlass „${seasonalOccasion}“`);
  const sources = finds.length > 0 ? ` (${finds.map((f) => f.sourceId).join(", ")})` : "";
  parts.push(`${describeEvidence(finds)}${sources}`);
  parts.push(`Zielgruppe: ${topic.audience}`);
  const views = sumKnownViews(finds);
  parts.push(`Reichweite der Funde: ${views === null ? "unbekannt" : views}`);
  return parts.join("; ");
}

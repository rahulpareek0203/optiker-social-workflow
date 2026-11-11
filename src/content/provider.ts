import type { Idea } from "../domain/plan";

export interface ContentContext {
  brand: string;
  tone: string;
  seasonalOccasion: string;
}

/**
 * Schnittstelle zur Texterzeugung. Rückgaben sind bewusst `unknown`:
 * Alles, was ein Provider liefert, wird hier gegen ein Schema geprüft,
 * egal ob feste Testantwort oder echtes Sprachmodell.
 */
export interface ContentProvider {
  readonly name: string;
  readonly simulated: boolean;
  generateBriefing(idea: Idea, context: ContentContext): Promise<unknown>;
  generatePostText(idea: Idea, context: ContentContext): Promise<unknown>;
}

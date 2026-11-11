import type { Idea } from "../domain/plan";
import type { ContentContext, ContentProvider } from "./provider";

/**
 * Platzhalter für einen echten Sprachmodell-Anbieter. Nicht implementiert.
 *
 * Einbau: Prompt aus Idee + Kontext bauen, Antwort als JSON anfordern und
 * unverändert zurückgeben – die Schema-Prüfung in briefing.ts bleibt gleich.
 * Der API-Schlüssel käme aus einer Umgebungsvariable bzw. einem Secret-Store.
 */
export class LlmContentProvider implements ContentProvider {
  readonly name = "LlmContentProvider";
  readonly simulated = false;

  constructor(private readonly apiKey: string) {}

  async generateBriefing(_idea: Idea, _context: ContentContext): Promise<unknown> {
    throw new Error(`${this.name} ist nicht implementiert (Schlüssel gesetzt: ${this.apiKey.length > 0})`);
  }

  async generatePostText(_idea: Idea, _context: ContentContext): Promise<unknown> {
    throw new Error(`${this.name} ist nicht implementiert`);
  }
}

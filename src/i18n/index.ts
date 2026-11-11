import { de } from "./de";
import { en } from "./en";
import type { Lang, Texts } from "./types";

export const TEXTS: Record<Lang, Texts> = { de, en };

/** Sprache der Terminalausgabe: Deutsch, mit APP_LANG=en Englisch (z. B. APP_LANG=en npm start). */
export function terminalTexts(): Texts {
  return TEXTS[process.env.APP_LANG === "en" ? "en" : "de"];
}

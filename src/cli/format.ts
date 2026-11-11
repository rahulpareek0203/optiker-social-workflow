// Bausteine für die Terminalausgabe. Farben werden von Node automatisch entfernt,
// wenn die Ausgabe nicht in ein Terminal geht (z. B. in eine Datei).

import { styleText } from "node:util";
import type { Texts } from "../i18n/types";

// Darstellung für das Terminal. Farben werden von Node automatisch entfernt,
// wenn die Ausgabe nicht in ein Terminal geht (z. B. in eine Datei).
export const WIDTH = 78;
export const bold = (t: string) => styleText("bold", t);
export const dim = (t: string) => styleText("dim", t);
export const green = (t: string) => styleText("green", t);
export const red = (t: string) => styleText("red", t);
export const yellow = (t: string) => styleText("yellow", t);
export const cyan = (t: string) => styleText("cyan", t);

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export function wrap(text: string, width: number, indent: string): string {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ")) {
    if (current && current.length + word.length + 1 > width) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  lines.push(current);
  return lines.join(`\n${indent}`);
}

export function banner(t: Texts, step: string, [title, explanation]: [string, string]): string {
  const line = cyan("═".repeat(WIDTH));
  const label = ` ${t.demo.whatHappens} `;
  return [
    "",
    line,
    ` ${bold(cyan(step))}  ${bold(title)}`,
    line,
    dim(`${label}${wrap(explanation, WIDTH - label.length, " ".repeat(label.length))}`),
  ].join("\n");
}

export function section(title: string): string {
  return `\n${bold(title)}\n${dim("─".repeat(WIDTH))}`;
}

export interface Column {
  width: number;
  right?: boolean;
}

/** Füllt jede Zelle auf ihre Breite auf; Kopf- und Datenzeilen nutzen dieselben Spalten. */
export function cells(columns: Column[], values: string[]): string {
  return columns
    .map((col, i) => {
      const text = truncate(values[i] ?? "", col.width);
      return col.right ? text.padStart(col.width) : text.padEnd(col.width);
    })
    .join("  ")
    .trimEnd();
}

export const LABEL_WIDTH = 22;

export const field = (label: string, value: string) =>
  `  ${dim(`${label}:`.padEnd(LABEL_WIDTH))}${wrap(value, WIDTH - LABEL_WIDTH - 2, " ".repeat(LABEL_WIDTH + 2))}`;

export function bar(planned: number, budget: number, overloaded: boolean): string {
  const width = 20;
  const filled = Math.min(width, Math.round((planned / budget) * width));
  const text = "█".repeat(filled) + "░".repeat(width - filled);
  return overloaded ? red(text) : green(text);
}

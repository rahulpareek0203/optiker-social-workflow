import { copyFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type WeekInput, WeekInputSchema } from "../../src/domain/input";
import type { Post } from "../../src/domain/post";
import { readJson } from "../../src/storage/files";
import { type WorkflowPaths, defaultPaths } from "../../src/workflow/paths";

export const NOW = new Date("2026-11-12T09:00:00Z");

export function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: "post-test-01",
    ideaId: "test-01",
    title: "Testbeitrag",
    text: "Nachts geblendet? Drei Tipps für Ihre Brille.",
    mediaRef: "media/test/reel-v1.mp4",
    channels: ["instagram", "facebook"],
    publishDate: "2026-11-17",
    status: "in_review",
    approval: null,
    history: [],
    ...overrides,
  };
}

/** Die echte Beispiel-Eingabe aus data/input, als frisches Objekt. */
export function sampleInput(): WeekInput {
  return WeekInputSchema.parse(readJson(join(process.cwd(), "data", "input", "week-input.json")));
}

/** Arbeitsverzeichnis in /tmp mit Kopie der Beispiel-Eingabe. */
export function tempWorkspace(): WorkflowPaths {
  const root = mkdtempSync(join(tmpdir(), "socialflow-"));
  const paths = defaultPaths(root);
  mkdirSync(join(root, "data", "input"), { recursive: true });
  copyFileSync(join(process.cwd(), "data", "input", "week-input.json"), paths.inputFile);
  return paths;
}

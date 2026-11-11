import { existsSync } from "node:fs";
import { z } from "zod";
import { type Post, PostSchema } from "../domain/post";
import { readJson, writeJson } from "./files";

/** Liest die Beitragsdatei (simulierter Freigabeordner). Fehlt sie, gibt es noch keine Beiträge. */
export function loadPosts(file: string): Post[] {
  if (!existsSync(file)) return [];
  const parsed = z.array(PostSchema).safeParse(readJson(file));
  if (!parsed.success) {
    throw new Error(`${file} ist ungültig:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

export function savePosts(file: string, posts: Post[]): void {
  writeJson(file, posts);
}

import { createHash } from "node:crypto";
import type { Post } from "../domain/post";

/**
 * SHA-256 über die freigaberelevanten Felder. Kanäle werden sortiert, damit
 * eine andere Reihenfolge nicht als inhaltliche Änderung zählt.
 */
export function fingerprint(post: Pick<Post, "text" | "mediaRef" | "channels" | "publishDate">): string {
  const canonical = JSON.stringify({
    text: post.text,
    mediaRef: post.mediaRef,
    channels: [...post.channels].sort(),
    publishDate: post.publishDate,
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

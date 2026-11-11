import type { Post, PostStatus } from "../domain/post";
import { TEXTS } from "../i18n";
import { fingerprint } from "./fingerprint";

const ALLOWED_TRANSITIONS: Record<PostStatus, PostStatus[]> = {
  draft: ["in_review"],
  in_review: ["approved", "draft"],
  approved: ["handed_off", "in_review"],
  handed_off: [],
};

export class InvalidTransitionError extends Error {
  constructor(
    readonly postId: string,
    readonly from: PostStatus,
    readonly to: PostStatus,
  ) {
    super(TEXTS.de.transitionError(postId, from, to));
    this.name = "InvalidTransitionError";
  }
}

export function transition(post: Post, to: PostStatus, now: Date, note = ""): void {
  if (!ALLOWED_TRANSITIONS[post.status].includes(to)) {
    throw new InvalidTransitionError(post.id, post.status, to);
  }
  post.history.push(`${now.toISOString()} ${post.status} -> ${to}${note ? ` (${note})` : ""}`);
  post.status = to;
}

export function submitForReview(post: Post, now: Date): void {
  transition(post, "in_review", now);
}

/** Bindet die Freigabe an die aktuelle Version des Beitrags. */
export function approve(post: Post, approvedBy: string, now: Date): void {
  if (!approvedBy.trim()) throw new Error("Freigabe braucht den Namen der freigebenden Person");
  transition(post, "approved", now, `freigegeben von ${approvedBy}`);
  post.approval = { fingerprint: fingerprint(post), approvedBy, approvedAt: now.toISOString() };
}

type EditableFields = Partial<Pick<Post, "text" | "mediaRef" | "channels" | "publishDate">>;

/** Ändert einen Beitrag; eine bestehende Freigabe verfällt dabei. */
export function editPost(post: Post, changes: EditableFields, now: Date): void {
  if (post.status === "handed_off") {
    throw new InvalidTransitionError(post.id, post.status, "in_review");
  }
  Object.assign(post, changes);
  revalidateApproval(post, now);
}

/**
 * Prüft, ob die Freigabe noch zur aktuellen Version passt – auch wenn posts.json
 * von Hand geändert wurde. Bei Abweichung zurück in die Prüfung.
 * @returns true, wenn eine Freigabe verfallen ist
 */
export function revalidateApproval(post: Post, now: Date): boolean {
  if (post.status !== "approved") return false;
  if (post.approval?.fingerprint === fingerprint(post)) return false;
  transition(post, "in_review", now, "Inhalt nach Freigabe geändert, erneute Prüfung nötig");
  post.approval = null;
  return true;
}

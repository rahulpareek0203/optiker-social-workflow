import { fingerprint } from "../approval/fingerprint";
import { transition } from "../approval/stateMachine";
import type { Post } from "../domain/post";
import type { HandoffLedger } from "./ledger";
import type { HandoffPayload, Publisher } from "./publisher";

export type BlockReason =
  | "changed_after_handoff"
  | "no_approval"
  | "approval_outdated"
  | "missing_media"
  | "missing_text"
  | "missing_channels"
  | "missing_date";

export type HandoffResult =
  | { postId: string; outcome: "handed_off"; reference: string }
  | { postId: string; outcome: "already_handed_off" }
  | { postId: string; outcome: "blocked"; reasons: BlockReason[] }
  | { postId: string; outcome: "failed"; error: string };

export function findBlockingReasons(post: Post): BlockReason[] {
  const reasons: BlockReason[] = [];
  if (post.status === "handed_off") {
    reasons.push("changed_after_handoff");
  } else if (post.status !== "approved" || !post.approval) {
    reasons.push("no_approval");
  } else if (post.approval.fingerprint !== fingerprint(post)) {
    reasons.push("approval_outdated");
  }
  if (!post.mediaRef?.trim()) reasons.push("missing_media");
  if (!post.text.trim()) reasons.push("missing_text");
  if (post.channels.length === 0) reasons.push("missing_channels");
  if (!post.publishDate) reasons.push("missing_date");
  return reasons;
}

/**
 * Übergibt einen Beitrag an den Publisher – nur wenn er vollständig, freigegeben
 * und genau diese Version noch nicht übergeben ist.
 */
export async function handOff(
  post: Post,
  ledger: HandoffLedger,
  publisher: Publisher,
  now: Date,
): Promise<HandoffResult> {
  const fp = fingerprint(post);
  if (ledger.has(post.id, fp)) {
    return { postId: post.id, outcome: "already_handed_off" };
  }

  const reasons = findBlockingReasons(post);
  if (reasons.length > 0) {
    return { postId: post.id, outcome: "blocked", reasons };
  }

  const approval = post.approval!;
  const payload: HandoffPayload = {
    simulated: true,
    notice: "SIMULIERTE ÜBERGABE – es wurde nichts veröffentlicht",
    postId: post.id,
    fingerprint: fp,
    text: post.text,
    mediaRef: post.mediaRef!,
    channels: post.channels,
    publishDate: post.publishDate,
    approvedBy: approval.approvedBy,
    approvedAt: approval.approvedAt,
    handedOffAt: now.toISOString(),
  };

  let reference: string;
  try {
    reference = await publisher.publish(payload);
  } catch (err) {
    // Kein Ledger-Eintrag und kein Statuswechsel: der nächste Lauf versucht es erneut.
    return { postId: post.id, outcome: "failed", error: err instanceof Error ? err.message : String(err) };
  }

  // Erst nach erfolgreicher Übergabe eintragen. Bricht der Prozess genau dazwischen ab,
  // würde erneut übergeben – der Dateiname je Version macht das hier unschädlich.
  ledger.record({ postId: post.id, fingerprint: fp, handedOffAt: now.toISOString(), reference });
  transition(post, "handed_off", now);
  return { postId: post.id, outcome: "handed_off", reference };
}

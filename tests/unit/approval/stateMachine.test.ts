import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  InvalidTransitionError,
  approve,
  editPost,
  revalidateApproval,
  submitForReview,
  transition,
} from "../../../src/approval/stateMachine";
import { handOff } from "../../../src/handoff/handoff";
import { HandoffLedger } from "../../../src/handoff/ledger";
import { SimulatedPublisher } from "../../../src/handoff/publisher";
import { NOW, makePost } from "../../support/fixtures";

describe("Freigabe", () => {
  it("Testfall 3: Textänderung nach Freigabe erfordert erneute Freigabe", async () => {
    const dir = mkdtempSync(join(tmpdir(), "approval-"));
    const ledger = new HandoffLedger(join(dir, "ledger.json"));
    const publisher = new SimulatedPublisher(join(dir, "handoff"));
    const post = makePost();
    approve(post, "Person B", NOW);

    editPost(post, { text: "Neuer Text nach der Freigabe" }, NOW);

    expect(post.status).toBe("in_review");
    expect(post.approval).toBeNull();
    const blocked = await handOff(post, ledger, publisher, NOW);
    expect(blocked).toMatchObject({ outcome: "blocked", reasons: ["no_approval"] });

    approve(post, "Person B", NOW);
    expect((await handOff(post, ledger, publisher, NOW)).outcome).toBe("handed_off");
  });

  it("erkennt auch direkte Änderungen (z. B. von Hand in posts.json)", () => {
    const post = makePost();
    approve(post, "Person A", NOW);

    post.mediaRef = "media/test/reel-v2.mp4";

    expect(revalidateApproval(post, NOW)).toBe(true);
    expect(post.status).toBe("in_review");
    expect(post.history.at(-1)).toContain("erneute Prüfung");
  });

  it("lässt eine unveränderte Freigabe bestehen", () => {
    const post = makePost();
    approve(post, "Person A", NOW);

    expect(revalidateApproval(post, NOW)).toBe(false);
    expect(post.status).toBe("approved");
  });

  it("verlangt den Namen der freigebenden Person", () => {
    expect(() => approve(makePost(), "  ", NOW)).toThrow("Namen");
  });
});

describe("Statusübergänge", () => {
  it("durchläuft Entwurf -> zur Prüfung -> freigegeben", () => {
    const post = makePost({ status: "draft" });
    submitForReview(post, NOW);
    approve(post, "Person B", NOW);
    expect(post.status).toBe("approved");
    expect(post.history).toHaveLength(2);
  });

  it.each([
    ["draft", "approved"],
    ["draft", "handed_off"],
    ["in_review", "handed_off"],
    ["handed_off", "in_review"],
    ["handed_off", "draft"],
  ] as const)("verbietet %s -> %s", (from, to) => {
    expect(() => transition(makePost({ status: from }), to, NOW)).toThrow(InvalidTransitionError);
  });

  it("verbietet eine doppelte Freigabe", () => {
    const post = makePost();
    approve(post, "Person B", NOW);
    expect(() => approve(post, "Person B", NOW)).toThrow(InvalidTransitionError);
  });

  it("verbietet Änderungen über editPost nach der Übergabe", () => {
    const post = makePost({ status: "handed_off" });
    expect(() => editPost(post, { text: "neu" }, NOW)).toThrow(InvalidTransitionError);
  });
});

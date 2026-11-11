import { mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { approve } from "../../../src/approval/stateMachine";
import { handOff } from "../../../src/handoff/handoff";
import { HandoffLedger } from "../../../src/handoff/ledger";
import { type Publisher, SimulatedPublisher } from "../../../src/handoff/publisher";
import { readJson } from "../../../src/storage/files";
import { NOW, makePost } from "../../support/fixtures";

function setup() {
  const dir = mkdtempSync(join(tmpdir(), "handoff-"));
  const handoffDir = join(dir, "handoff");
  return {
    handoffDir,
    ledger: () => new HandoffLedger(join(dir, "ledger.json")),
    publisher: new SimulatedPublisher(handoffDir),
  };
}

describe("Übergabe", () => {
  it("Testfall 1: freigegebener, vollständiger Beitrag wird genau einmal übergeben", async () => {
    const { ledger, publisher, handoffDir } = setup();
    const post = makePost();
    approve(post, "Person B", NOW);

    const first = await handOff(post, ledger(), publisher, NOW);
    // Neues Ledger-Objekt aus derselben Datei = zweiter Programmlauf
    const second = await handOff(post, ledger(), publisher, NOW);

    expect(first.outcome).toBe("handed_off");
    expect(second.outcome).toBe("already_handed_off");
    expect(readdirSync(handoffDir)).toHaveLength(1);
    expect(post.status).toBe("handed_off");
  });

  it("Testfall 2a: ohne Freigabe wird nicht übergeben", async () => {
    const { ledger, handoffDir } = setup();
    const publisher: Publisher = { publish: vi.fn() };
    const post = makePost({ status: "in_review" });

    const result = await handOff(post, ledger(), publisher, NOW);

    expect(result).toEqual({ postId: post.id, outcome: "blocked", reasons: ["no_approval"] });
    expect(publisher.publish).not.toHaveBeenCalled();
    expect(post.status).toBe("in_review");
    expect(() => readdirSync(handoffDir)).toThrow();
  });

  it("Testfall 2b: ohne Medienreferenz wird nicht übergeben, auch wenn freigegeben", async () => {
    const { ledger } = setup();
    const publisher: Publisher = { publish: vi.fn() };
    const post = makePost({ mediaRef: null });
    approve(post, "Person B", NOW);

    const result = await handOff(post, ledger(), publisher, NOW);

    expect(result).toEqual({ postId: post.id, outcome: "blocked", reasons: ["missing_media"] });
    expect(publisher.publish).not.toHaveBeenCalled();
    expect(post.status).toBe("approved");
  });

  it("meldet einen Fehler des Publishers als Fehler, nicht als Übergabe, und erlaubt einen neuen Versuch", async () => {
    const { ledger, publisher } = setup();
    const broken: Publisher = {
      publish: vi.fn().mockRejectedValue(new Error("Schnittstelle nicht erreichbar")),
    };
    const post = makePost();
    approve(post, "Person B", NOW);

    const failed = await handOff(post, ledger(), broken, NOW);
    expect(failed).toEqual({ postId: post.id, outcome: "failed", error: "Schnittstelle nicht erreichbar" });
    expect(post.status).toBe("approved");

    const retry = await handOff(post, ledger(), publisher, NOW);
    expect(retry.outcome).toBe("handed_off");
  });

  it("blockiert einen bereits übergebenen Beitrag, der danach von Hand geändert wurde", async () => {
    const { ledger, publisher } = setup();
    const post = makePost();
    approve(post, "Person B", NOW);
    await handOff(post, ledger(), publisher, NOW);

    post.text = "Nachträglich geänderter Text";
    const result = await handOff(post, ledger(), publisher, NOW);

    expect(result.outcome).toBe("blocked");
  });

  it("listet alle fehlenden Pflichtangaben auf", async () => {
    const { ledger, publisher } = setup();
    const post = makePost({ text: " ", channels: [], publishDate: "", mediaRef: null });

    const result = await handOff(post, ledger(), publisher, NOW);

    expect(result.outcome === "blocked" && result.reasons).toEqual([
      "no_approval",
      "missing_media",
      "missing_text",
      "missing_channels",
      "missing_date",
    ]);
  });

  it("kennzeichnet das Payload als simuliert", async () => {
    const { ledger, publisher, handoffDir } = setup();
    const post = makePost();
    approve(post, "Person B", NOW);
    await handOff(post, ledger(), publisher, NOW);

    const payload = readJson(join(handoffDir, readdirSync(handoffDir)[0]!)) as Record<string, unknown>;
    expect(payload.simulated).toBe(true);
    expect(payload.fingerprint).toBe(post.approval?.fingerprint);
  });

  it("bricht bei beschädigtem Ledger ab, statt es als leer zu behandeln", () => {
    const dir = mkdtempSync(join(tmpdir(), "ledger-"));
    const file = join(dir, "ledger.json");
    writeFileSync(file, JSON.stringify([{ postId: "post-1" }]));

    expect(() => new HandoffLedger(file)).toThrow("ungültig");
  });
});

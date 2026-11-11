import { describe, expect, it } from "vitest";
import { fingerprint } from "../../../src/approval/fingerprint";
import { makePost } from "../../support/fixtures";

describe("Fingerprint", () => {
  it("ist stabil und unabhängig von der Reihenfolge der Kanäle", () => {
    const a = makePost({ channels: ["instagram", "facebook"] });
    const b = makePost({ channels: ["facebook", "instagram"] });

    expect(fingerprint(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(fingerprint(a)).toBe(fingerprint(b));
  });

  it.each([
    ["der Text", { text: "anders" }],
    ["die Medienreferenz", { mediaRef: "media/test/anders.mp4" }],
    ["der Kanal", { channels: ["tiktok" as const] }],
    ["der Termin", { publishDate: "2026-11-18" }],
  ])("ändert sich, wenn sich %s ändert", (_label, change) => {
    expect(fingerprint(makePost(change))).not.toBe(fingerprint(makePost()));
  });

  it("ignoriert Felder, die nicht zur Freigabe gehören", () => {
    expect(fingerprint(makePost({ title: "Anderer Titel" }))).toBe(fingerprint(makePost()));
  });
});

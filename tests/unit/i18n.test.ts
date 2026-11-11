import { describe, expect, it } from "vitest";
import { TEXTS } from "../../src/i18n";

describe("Texte", () => {
  it("haben für jeden Code eine deutsche und eine englische Fassung", () => {
    for (const t of [TEXTS.de, TEXTS.en]) {
      expect(Object.values(t.reason).every((s) => s.length > 0)).toBe(true);
      expect(t.warning({ personName: "Person B", planned: 155, budget: 150, afterReplan: false })).toContain(
        "155",
      );
    }
    expect(TEXTS.de.reason.no_approval).toBe("Keine Freigabe vorhanden");
    expect(TEXTS.en.reason.no_approval).toBe("No approval");
  });
});

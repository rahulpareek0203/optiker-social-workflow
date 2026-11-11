import { existsSync } from "node:fs";
import { z } from "zod";
import { readJson, writeJson } from "../storage/files";

const LedgerEntrySchema = z.object({
  postId: z.string().min(1),
  fingerprint: z.string().length(64),
  handedOffAt: z.string(),
  reference: z.string(),
});
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

/** Merkt sich jede übergebene Version (Beitrag + Fingerprint) über Läufe hinweg. */
export class HandoffLedger {
  private entries: LedgerEntry[];

  constructor(private readonly file: string) {
    if (!existsSync(file)) {
      this.entries = [];
      return;
    }
    // Ein beschädigtes Ledger darf nicht als „nichts übergeben“ gelesen werden – sonst drohen Doppelübergaben.
    const parsed = z.array(LedgerEntrySchema).safeParse(readJson(file));
    if (!parsed.success) throw new Error(`${file} ist ungültig:\n${z.prettifyError(parsed.error)}`);
    this.entries = parsed.data;
  }

  has(postId: string, fp: string): boolean {
    return this.entries.some((e) => e.postId === postId && e.fingerprint === fp);
  }

  record(entry: LedgerEntry): void {
    this.entries.push(entry);
    writeJson(this.file, this.entries);
  }
}

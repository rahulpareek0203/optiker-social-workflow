import { join, relative } from "node:path";
import type { Channel } from "../domain/input";
import { writeJson } from "../storage/files";

export interface HandoffPayload {
  simulated: true;
  notice: string;
  postId: string;
  fingerprint: string;
  text: string;
  mediaRef: string;
  channels: Channel[];
  publishDate: string;
  approvedBy: string;
  approvedAt: string;
  handedOffAt: string;
}

export interface Publisher {
  /** @returns Referenz auf die Übergabe (hier: Dateipfad) */
  publish(payload: HandoffPayload): Promise<string>;
}

/** Schreibt das Payload als JSON-Datei. Es wird nichts veröffentlicht. */
export class SimulatedPublisher implements Publisher {
  constructor(private readonly outputDir: string) {}

  async publish(payload: HandoffPayload): Promise<string> {
    const file = join(this.outputDir, `${payload.postId}_${payload.fingerprint.slice(0, 12)}.json`);
    writeJson(file, payload);
    return relative(process.cwd(), file);
  }
}

import { join } from "node:path";

export interface WorkflowPaths {
  inputFile: string;
  outputDir: string;
  /** Simulierter Freigabeordner: Beiträge inkl. Status und Freigabe. */
  postsFile: string;
  ledgerFile: string;
  handoffDir: string;
}

export function defaultPaths(root: string): WorkflowPaths {
  const outputDir = join(root, "data", "output");
  return {
    inputFile: join(root, "data", "input", "week-input.json"),
    outputDir,
    postsFile: join(outputDir, "freigabeordner", "posts.json"),
    ledgerFile: join(outputDir, "handoff-ledger.json"),
    handoffDir: join(outputDir, "handoff"),
  };
}

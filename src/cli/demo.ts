// Geführter Durchlauf aller Prüffälle.
//   npm run demo        – alles am Stück
//   npm run demo:step   – hält nach jedem Schritt an (Enter = weiter)
// APP_LANG=en für englische Ausgabe.

import { readdirSync, rmSync } from "node:fs";
import { relative } from "node:path";
import { createInterface } from "node:readline/promises";
import { approve } from "../approval/stateMachine";
import { FakeContentProvider } from "../content/fakeProvider";
import { terminalTexts } from "../i18n";
import { loadPosts, savePosts } from "../storage/posts";
import { defaultPaths } from "../workflow/paths";
import { type StageEvent, type WorkflowResult, runWorkflow } from "../workflow/workflow";
import { banner, bold, dim, green, red, section, yellow } from "./format";
import { renderCapacity, renderInput, renderPlan, renderSelection } from "./views/planning";
import { renderBriefingPreview, renderHandoffs, renderPosts } from "./views/publishing";

const t = terminalTexts();
const paths = defaultPaths(process.cwd());
const provider = new FakeContentProvider();
const rel = (file: string) => relative(process.cwd(), file);
const P01 = "post-2026-W47-01";
const P02 = "post-2026-W47-02";
const P05 = "post-2026-W47-05";
const TOTAL_STEPS = 12;

// Ohne Terminal (z. B. in eine Datei umgeleitet) läuft der Schrittmodus ohne Pausen durch.
const rl =
  process.argv.includes("--step") && process.stdin.isTTY
    ? createInterface({ input: process.stdin, output: process.stdout })
    : null;

async function pause(): Promise<void> {
  if (!rl) return;
  const answer = await rl.question(dim(`\n  ${t.demo.pause} `));
  if (answer.trim().toLowerCase() === "q") {
    rl.close();
    process.exit(0);
  }
}

let stepNumber = 0;
function step(texts: [string, string]): void {
  stepNumber += 1;
  console.log(banner(t, `${t.demo.stepWord} ${stepNumber}/${TOTAL_STEPS}`, texts));
}

const run = (onStage?: (event: StageEvent) => Promise<void>) =>
  runWorkflow({ paths, provider, ...(onStage ? { onStage } : {}) });

function approveNow(postId: string, by: string): void {
  const posts = loadPosts(paths.postsFile);
  const post = posts.find((p) => p.id === postId)!;
  approve(post, by, new Date());
  savePosts(paths.postsFile, posts);
  console.log(
    `  ${green(t.ui.approved)}  ${t.ui.approvedBy(postId, by)} ${dim(`(${t.ui.version} ${post.approval?.fingerprint.slice(0, 12)})`)}`,
  );
}

const outcomeOf = (result: WorkflowResult, postId: string) => result.results.find((r) => r.postId === postId);

rmSync(paths.outputDir, { recursive: true, force: true });
console.log(`\n${bold(t.ui.title("2026-W47"))}\n${dim(t.ui.simulationNote)}`);

// Lauf 1: nach jeder Stufe der Pipeline anhalten
const run1 = await run(async (event) => {
  switch (event.stage) {
    case "input":
      step(t.demo.input);
      console.log(renderInput(t, event.input, rel(paths.inputFile)));
      break;
    case "plan":
      step(t.demo.selection);
      console.log(renderSelection(t, event.plan, false));
      await pause();
      step(t.demo.capacity);
      console.log(renderCapacity(t, event.plan));
      await pause();
      step(t.demo.plan);
      console.log(renderPlan(t, event.plan));
      break;
    case "briefing":
      step(t.demo.briefing);
      console.log(renderBriefingPreview(t, event.briefing));
      break;
    case "posts":
      step(t.demo.posts);
      console.log(renderPosts(t, event.posts, event.created, rel(paths.postsFile)));
      break;
  }
  await pause();
});
step(t.demo.handoff);
console.log(renderHandoffs(t, run1));
await pause();

step(t.demo.step2);
console.log();
approveNow(P01, "Person B");
approveNow(P05, "Person B");
await pause();

step(t.demo.step3);
const run2 = await run();
console.log(renderHandoffs(t, run2));
await pause();

step(t.demo.step4);
const run3 = await run();
console.log(renderHandoffs(t, run3));
await pause();

step(t.demo.step5);
console.log();
approveNow(P02, "Person A");
const posts = loadPosts(paths.postsFile);
posts.find((p) => p.id === P02)!.text += " Neu: jetzt auch samstags.";
savePosts(paths.postsFile, posts);
console.log(`  ${yellow("✎")}  ${t.demo.edited(P02)}`);
const run5 = await run();
console.log(renderHandoffs(t, run5));
await pause();

const plan = run1.plan;
const checks: [string, boolean][] = [
  [
    t.demo.checks[0],
    outcomeOf(run2, P01)?.outcome === "handed_off" &&
      outcomeOf(run3, P01)?.outcome === "already_handed_off" &&
      readdirSync(paths.handoffDir).length === 1,
  ],
  [t.demo.checks[1], JSON.stringify(outcomeOf(run2, P02)).includes("no_approval")],
  [t.demo.checks[2], JSON.stringify(outcomeOf(run2, P05)).includes("missing_media")],
  [t.demo.checks[3], run5.invalidated.includes(P02) && outcomeOf(run5, P02)?.outcome === "blocked"],
  [
    t.demo.checks[4],
    plan.warnings.length > 0 &&
      plan.replanSteps.length > 0 &&
      plan.load.every((l) => !l.overloaded) &&
      plan.load.map((l) => l.budget).join() === "90,150",
  ],
];

step(t.demo.result);
console.log(section(t.demo.checksTitle));
for (const [label, ok] of checks) {
  console.log(`  ${ok ? bold(green(t.demo.ok)) : bold(red(t.demo.fail))}  ${label}`);
}
console.log(dim(`\n${t.demo.outputs}\n`));

rl?.close();
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;

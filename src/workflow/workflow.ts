import { join } from "node:path";
import { z } from "zod";
import { revalidateApproval, submitForReview } from "../approval/stateMachine";
import { type Briefing, contextFrom, createBriefing, createPostText } from "../content/briefing";
import { briefingToMarkdown } from "../content/markdown";
import type { ContentProvider } from "../content/provider";
import { type WeekInput, WeekInputSchema } from "../domain/input";
import type { WeeklyPlan } from "../domain/plan";
import type { Post } from "../domain/post";
import { type HandoffResult, handOff } from "../handoff/handoff";
import { HandoffLedger } from "../handoff/ledger";
import { type Publisher, SimulatedPublisher } from "../handoff/publisher";
import { createWeeklyPlan } from "../planning/planner";
import { buildWeeklySummary } from "../reporting/weeklySummary";
import { readJson, writeJson, writeText } from "../storage/files";
import { loadPosts, savePosts } from "../storage/posts";
import type { WorkflowPaths } from "./paths";

/** Zwischenstände eines Laufs, z. B. für die Schritt-für-Schritt-Demo. */
export type StageEvent =
  | { stage: "input"; input: WeekInput }
  | { stage: "plan"; plan: WeeklyPlan }
  | { stage: "briefing"; briefing: Briefing }
  | { stage: "posts"; posts: Post[]; created: string[] };

export interface WorkflowResult {
  plan: WeeklyPlan;
  briefing: Briefing;
  posts: Post[];
  results: HandoffResult[];
  /** Beiträge, deren Freigabe in diesem Lauf wegen einer Änderung verfallen ist. */
  invalidated: string[];
  summary: string;
}

export function loadInput(file: string): WeekInput {
  const parsed = WeekInputSchema.safeParse(readJson(file));
  if (!parsed.success) {
    throw new Error(`Eingabe ${file} ist ungültig:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

function postIdFor(ideaId: string): string {
  return `post-${ideaId}`;
}

/**
 * Ein kompletter Lauf: planen, Briefing erzeugen, neue Entwürfe zur Prüfung
 * geben, Freigaben prüfen, freigegebene Beiträge übergeben, Übersicht schreiben.
 * Mehrfach ausführbar – bestehende Beiträge und Freigaben bleiben erhalten.
 */
export async function runWorkflow(options: {
  paths: WorkflowPaths;
  provider: ContentProvider;
  publisher?: Publisher;
  now?: Date;
  /** Wird nach jeder Stufe abgewartet; Dateien der Stufe sind dann bereits geschrieben. */
  onStage?: (event: StageEvent) => Promise<void> | void;
}): Promise<WorkflowResult> {
  const { paths, provider } = options;
  const now = options.now ?? new Date();
  const publisher = options.publisher ?? new SimulatedPublisher(paths.handoffDir);
  const onStage = options.onStage ?? (() => undefined);

  const input = loadInput(paths.inputFile);
  await onStage({ stage: "input", input });
  const context = contextFrom(input);
  const plan = createWeeklyPlan(input);
  writeJson(join(paths.outputDir, "weekly-plan.json"), plan);
  await onStage({ stage: "plan", plan });

  const priorities = plan.ideas.filter((i) => i.role === "priority");
  const briefing = await createBriefing(provider, priorities[0]!, context);
  writeJson(join(paths.outputDir, "briefing.json"), briefing);
  writeText(join(paths.outputDir, "briefing.md"), briefingToMarkdown(briefing));
  await onStage({ stage: "briefing", briefing });

  const posts = loadPosts(paths.postsFile);
  const created: string[] = [];
  for (const idea of priorities) {
    if (posts.some((p) => p.ideaId === idea.id)) continue;
    const post: Post = {
      id: postIdFor(idea.id),
      ideaId: idea.id,
      title: idea.topic,
      text:
        idea.id === briefing.ideaId
          ? `${briefing.hook}\n\n${briefing.postText}\n\n${briefing.callToAction.text} ${briefing.callToAction.url}`
          : await createPostText(provider, idea, context),
      mediaRef: input.media[idea.topicId] ?? null,
      channels: idea.channels,
      publishDate: idea.publishDate,
      status: "draft",
      approval: null,
      history: [],
    };
    submitForReview(post, now);
    posts.push(post);
    created.push(post.id);
  }
  savePosts(paths.postsFile, posts);
  await onStage({ stage: "posts", posts, created });

  const invalidated = posts.filter((post) => revalidateApproval(post, now)).map((post) => post.id);

  const ledger = new HandoffLedger(paths.ledgerFile);
  const results: HandoffResult[] = [];
  for (const post of posts) {
    results.push(await handOff(post, ledger, publisher, now));
  }
  savePosts(paths.postsFile, posts);

  const summary = buildWeeklySummary({ input, plan, briefing, posts, results, invalidated, now });
  writeText(join(paths.outputDir, "weekly-summary.txt"), summary);

  return { plan, briefing, posts, results, invalidated, summary };
}

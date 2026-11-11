import type { Briefing } from "../../content/briefing";
import type { Post } from "../../domain/post";
import type { HandoffResult } from "../../handoff/handoff";
import type { Texts } from "../../i18n/types";
import { formatDate } from "../../shared/dates";
import type { WorkflowResult } from "../../workflow/workflow";
import { LABEL_WIDTH, bold, cyan, dim, field, green, red, section, truncate, yellow } from "../format";

const INDENT = " ".repeat(21);

function renderResult(t: Texts, post: Post, result: HandoffResult | undefined): string[] {
  const head = (label: string, color: (s: string) => string) =>
    `  ${bold(color(label.padEnd(18)))} ${post.id}  ${truncate(post.title, 34)} ${dim(`[${t.status[post.status]}]`)}`;
  if (!result) return [head("", dim)];

  switch (result.outcome) {
    case "handed_off":
      return [head(t.ui.handedOff, green), dim(`${INDENT}→ ${result.reference} ${t.ui.handedOffNote}`)];
    case "already_handed_off":
      return [head(t.ui.alreadyHandedOff, cyan), dim(`${INDENT}${t.ui.alreadyNote}`)];
    case "blocked":
      return [head(t.ui.blocked, red), ...result.reasons.map((r) => `${INDENT}${red("•")} ${t.reason[r]}`)];
    case "failed":
      return [head(t.ui.failed, red), `${INDENT}${red("•")} ${result.error}`];
  }
}

export function renderHandoffs(t: Texts, result: WorkflowResult): string {
  const out = [section(t.ui.handoff)];
  for (const id of result.invalidated) {
    out.push(`  ${bold(yellow(t.ui.invalidatedLabel))} ${t.invalidated(id)}`);
  }
  for (const post of result.posts) {
    out.push(
      ...renderResult(
        t,
        post,
        result.results.find((r) => r.postId === post.id),
      ),
    );
  }
  return out.join("\n");
}

export function renderNextSteps(t: Texts, result: WorkflowResult): string {
  const waiting = result.posts.filter((p) => p.status === "in_review");
  const out = [section(t.ui.nextSteps)];
  out.push(`  ${dim(t.ui.briefingFile)} data/output/briefing.md`);
  out.push(`  ${dim(t.ui.summaryFile)} data/output/weekly-summary.txt`);
  if (waiting.length > 0) {
    out.push("", `  ${t.ui.waiting(waiting.length)}`);
    for (const p of waiting) out.push(cyan(`    npm run approve -- ${p.id} "Person B"`));
    out.push(dim(t.ui.runAgain));
  }
  return out.join("\n");
}

export function renderBriefingPreview(t: Texts, b: Briefing): string {
  const out = [section(t.ui.briefingPreview)];
  out.push(field(t.ui.hook, b.hook));
  out.push(field(t.ui.shotPlan(b.shotPlan.length), truncate(b.shotPlan[0] ?? "", 90)));
  out.push(field(t.ui.overlays, b.textOverlays.map((o) => `„${o}“`).join(" · ")));
  out.push(field(t.ui.thumbnail, b.thumbnailIdea));
  out.push(field(t.ui.booking, b.callToAction.url));
  out.push(field(t.ui.variants, b.variants.map((v) => `${v.channel} (${v.format})`).join("  vs.  ")));
  for (const v of b.variants)
    out.push(dim(`${" ".repeat(LABEL_WIDTH + 2)}↳ ${v.channel}: ${truncate(v.differences, 70)}`));
  out.push(field(t.ui.effortLabel, t.ui.effort(b.effort)));
  out.push(field(t.ui.fullBriefing, "data/output/briefing.md"));
  return out.join("\n");
}

export function renderPosts(t: Texts, posts: Post[], created: string[], file: string): string {
  const out = [section(t.ui.posts(file))];
  for (const post of posts) {
    const isNew = created.includes(post.id) ? `  ${green(t.ui.newPost)}` : "";
    out.push(`  ${bold(post.id)}  ${dim(`[${t.status[post.status]}]`)}${isNew}`);
    out.push(
      field(
        `  ${t.ui.date}`,
        `${formatDate(post.publishDate, t.weekdays)} · ${t.ui.channels}: ${post.channels.join(", ")}`,
      ),
    );
    out.push(field(`  ${t.ui.mediaLabel}`, post.mediaRef ?? red(t.ui.missing)));
    out.push(field(`  ${t.ui.text}`, truncate(post.text.replace(/\s+/g, " "), 150)));
    out.push("");
  }
  return out.join("\n").trimEnd();
}

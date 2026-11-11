import type { Texts } from "./types";

export const en: Texts = {
  weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  status: { draft: "Draft", in_review: "In review", approved: "Approved", handed_off: "Handed off" },
  reason: {
    changed_after_handoff: "Post was already handed off and changed afterwards – needs manual clarification",
    no_approval: "No approval",
    approval_outdated: "Approval belongs to a different version – needs review again",
    missing_media: "Media reference missing",
    missing_text: "Post text missing",
    missing_channels: "No channel assigned",
    missing_date: "Publish date missing",
  },
  evidence: (n) =>
    n === 0
      ? "No inspiration finds"
      : n === 1
        ? "Single find – not a confirmed trend"
        : `${n} single finds – a hint, but not a confirmed trend`,
  warning: (w) =>
    w.afterReplan
      ? `${w.personName} is still overloaded after replanning (${w.planned}/${w.budget} min). Manual decision needed.`
      : `${w.personName} is planned for ${w.planned} of ${w.budget} minutes (${w.planned - w.budget} minutes too many). The budget is not increased.`,
  replan: (s) => {
    switch (s.kind) {
      case "reassign":
        return `${s.ideaId} ("${s.topic}", ${s.minutes} min) moved from ${s.from} to ${s.to}, who still had ${s.freeMinutes} min free.`;
      case "swap":
        return `${s.ideaId} ("${s.topic}", ${s.minutes} min) demoted to reserve; ${s.reserveId} ("${s.reserveTopic}", ${s.reserveMinutes} min) moves up for ${s.person}. Nobody else had enough free time.`;
      case "unresolved":
        return `No automatic solution for ${s.person} – please postpone a topic or reduce channels.`;
    }
  },
  invalidated: (id) => `${id}: changed after approval – approval revoked, back to review`,
  transitionError: (id, from, to) =>
    `Post ${id}: change from "${en.status[from]}" to "${en.status[to]}" is not allowed`,
  ui: {
    title: (week) => `Social media workflow · week ${week}`,
    simulationNote:
      "Texts = fixed test responses (simulated) · handoff = JSON file (simulated) · nothing is published",
    selection: "TOPIC SELECTION  (score = +2 seasonal occasion · +1 per inspiration find)",
    selectionColumns: ["Rank", "Topic", "Season", "Finds", "Score", "Result"],
    seasonal: "Season",
    priority: "priority",
    reserve: "reserve",
    notSelected: "not selected",
    nowPriority: "↻ now priority",
    nowReserve: "↻ now reserve",
    selectionNote:
      "  Ranks 1–3 = priorities, 4–5 = reserves, the rest is dropped. On equal scores, input order decides.",
    plan: (week) => `WEEKLY PLAN ${week}`,
    planColumns: ["No", "Date", "Owner", "Min.", "Format", "Channels", "Topic (German content)"],
    reach: "Reach",
    sources: "Sources",
    views: "views",
    unknown: "unknown",
    legend: "  ★ Priority (produced this week)   ○ Reserve (only if something drops out)",
    min: "min",
    capacity: "CAPACITY CHECK  (priorities only · the budget is never increased)",
    draft: "  1. First draft (before replan)",
    final: "  2. After replan (final)",
    free: (m) => `✔ ${m} min free`,
    overloadedBy: (m) => `✖ ${m} min over budget`,
    movedUp: "↻ moved up by replan",
    demoted: "↻ demoted to reserve by replan",
    warningLabel: "⚠ WARNING  ",
    replanLabel: "↻ REPLAN   ",
    briefing: "BRIEFING",
    briefingDone: (nr, topic) => `Full briefing for ${nr} "${topic}" → data/output/briefing.md`,
    handoff: "APPROVAL AND HANDOFF",
    handedOff: "✔ HANDED OFF",
    alreadyHandedOff: "↺ ALREADY SENT",
    blocked: "✖ BLOCKED",
    failed: "✖ FAILED",
    handedOffNote: "(simulated, nothing published)",
    alreadyNote: "→ this exact version was already sent, no second handoff",
    invalidatedLabel: "⚠ APPROVAL REVOKED",
    nextSteps: "WHAT NEXT?",
    briefingFile: "Briefing:      ",
    summaryFile: "Weekly summary:",
    waiting: (n) => `${n} post(s) waiting for approval. Approve with:`,
    runAgain: "  then run again: npm start",
    approved: "✔ APPROVED",
    approvedBy: (id, by) => `${id} by ${by}`,
    version: "version",
    aborted: "✖ Run aborted:",
    resetDone: "data/output/ deleted.",
    usage: 'Usage: npm run approve -- <postId> "<name>"',
    notFound: (id, existing) => `Post ${id} not found. Available: ${existing || "none"}`,
    input: (file) => `INPUT  ${file}`,
    brand: "Brand",
    tone: "Tone",
    occasion: "Occasion",
    people: "People",
    topics: (n) => `Topics (${n})`,
    finds: (n) => `Inspiration finds (${n})`,
    media: (n) => `Media references (${n})`,
    seasonalTag: "seasonal",
    briefingPreview: "BRIEFING  (preview · simulated AI response)",
    hook: "Hook",
    shotPlan: (n) => `Shot plan (${n} steps)`,
    overlays: "Overlays",
    thumbnail: "Thumbnail",
    booking: "Booking link",
    variants: "Variants",
    effortLabel: "Effort",
    effort: (e) =>
      `production ${e.production} + variants ${e.variants} + coordination ${e.coordination} + approval ${e.approval} = ${e.total} min`,
    fullBriefing: "Full text",
    posts: (file) => `POSTS  ${file}`,
    newPost: "new",
    date: "Date",
    channels: "Channels",
    text: "Text",
    mediaLabel: "Media",
    missing: "✖ missing",
  },
  demo: {
    stepWord: "STEP",
    pause: "↵ Enter = next step · q + Enter = quit",
    input: [
      "Run 1 · Read and validate the input",
      "Everything starts from one file: data/input/week-input.json. It is checked first – if anything is invalid, the run stops here.",
    ],
    selection: [
      "Run 1 · Score and rank topics",
      "Every topic gets points: +2 for the seasonal occasion, +1 per inspiration find. Ranks 1–3 become priorities, 4–5 reserves.",
    ],
    capacity: [
      "Run 1 · Capacity check",
      "The minutes of all priorities are added up per person and compared with the budget. On overload: warning, then replan – the budget is never raised.",
    ],
    plan: [
      "Run 1 · Final weekly plan",
      "The plan after the capacity check. Saved to data/output/weekly-plan.json.",
    ],
    briefing: [
      "Run 1 · Production briefing",
      "The (simulated) AI provider writes the full briefing for the top priority. Its answer is validated against a schema before it is used.",
    ],
    posts: [
      "Run 1 · Create posts",
      "For each priority a post is created (text, media file, channels, date) and put into review. Saved to the approval folder.",
    ],
    handoff: [
      "Run 1 · Handoff attempt",
      "Every post is checked before handoff. Nobody has approved anything yet – so everything is blocked.",
    ],
    whatHappens: "What happens:",
    step2: [
      "A human approves",
      "Person B approves post-2026-W47-01 (complete) and post-2026-W47-05 (no media reference). post-2026-W47-02 stays unapproved.",
    ],
    step3: [
      "Second run: handoff",
      "Only posts that are approved AND complete are handed off. Expected: 01 goes out, 02 lacks approval, 05 lacks a media reference.",
    ],
    step4: [
      "Third run: nothing twice",
      "The workflow runs again. 01 was already handed off and must not go out a second time.",
    ],
    step5: [
      "Change after approval",
      "post-2026-W47-02 is approved, then someone edits its text. The approval belongs to the old version and is revoked – the post needs review again.",
    ],
    edited: (id) => `Text of ${id} edited after approval`,
    result: ["The four required test cases", "Each check is computed from the real results of this run."],
    checksTitle: "TEST CASES",
    ok: "✔ OK  ",
    fail: "✖ FAIL",
    checks: [
      "Case 1   Approved post handed off exactly once, even when run again",
      "Case 2a  Missing approval blocks the handoff",
      "Case 2b  Missing media reference blocks the handoff",
      "Case 3   Text change after approval requires new approval",
      "Case 4   Overload leads to warning and replan, budget unchanged",
    ],
    outputs: "  Outputs: data/output/  (plan, briefing, approval folder, handoffs, weekly summary)",
  },
};

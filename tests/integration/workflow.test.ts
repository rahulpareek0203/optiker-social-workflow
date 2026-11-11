import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { approve } from "../../src/approval/stateMachine";
import { FakeContentProvider } from "../../src/content/fakeProvider";
import { LlmContentProvider } from "../../src/content/llmProvider";
import { loadPosts, savePosts } from "../../src/storage/posts";
import { runWorkflow } from "../../src/workflow/workflow";
import { NOW, tempWorkspace } from "../support/fixtures";

const provider = new FakeContentProvider();
const FIRST_POST = "post-2026-W47-01";

function approveInFile(postsFile: string, postId: string) {
  const posts = loadPosts(postsFile);
  approve(
    posts.find((p) => p.id === postId)!,
    "Person B",
    NOW,
  );
  savePosts(postsFile, posts);
}

describe("Gesamtablauf", () => {
  it("erster Lauf legt drei Beiträge zur Prüfung an und übergibt nichts", async () => {
    const paths = tempWorkspace();

    const run = await runWorkflow({ paths, provider, now: NOW });

    expect(run.posts.map((p) => p.status)).toEqual(["in_review", "in_review", "in_review"]);
    expect(run.results.every((r) => r.outcome === "blocked")).toBe(true);
  });

  it("Testfall 1 (Ablaufebene): ein freigegebener Beitrag wird über zwei Läufe genau einmal übergeben", async () => {
    const paths = tempWorkspace();
    await runWorkflow({ paths, provider, now: NOW });
    approveInFile(paths.postsFile, FIRST_POST);

    const second = await runWorkflow({ paths, provider, now: NOW });
    const third = await runWorkflow({ paths, provider, now: NOW });

    expect(second.results.find((r) => r.postId === FIRST_POST)?.outcome).toBe("handed_off");
    expect(third.results.find((r) => r.postId === FIRST_POST)?.outcome).toBe("already_handed_off");
    expect(readdirSync(paths.handoffDir)).toHaveLength(1);
    expect(JSON.parse(readFileSync(paths.ledgerFile, "utf8"))).toHaveLength(1);
  });

  it("Testfall 3 (Ablaufebene): von Hand geänderter Text hebt die Freigabe beim nächsten Lauf auf", async () => {
    const paths = tempWorkspace();
    await runWorkflow({ paths, provider, now: NOW });
    approveInFile(paths.postsFile, FIRST_POST);
    const posts = loadPosts(paths.postsFile);
    posts.find((p) => p.id === FIRST_POST)!.text += " Neu: jetzt auch samstags.";
    savePosts(paths.postsFile, posts);

    const run = await runWorkflow({ paths, provider, now: NOW });

    expect(run.invalidated).toEqual([FIRST_POST]);
    expect(run.results.find((r) => r.postId === FIRST_POST)?.outcome).toBe("blocked");
    expect(run.summary).toContain("[Zur Prüfung]");
  });

  it("Wochenübersicht zeigt Warnung, Umplanung, Blockaden und Simulationshinweis", async () => {
    const paths = tempWorkspace();
    const run = await runWorkflow({ paths, provider, now: NOW });
    const file = readFileSync(join(paths.outputDir, "weekly-summary.txt"), "utf8");

    expect(file).toBe(run.summary);
    expect(file).toContain("WARNUNG: Person B");
    expect(file).toContain("Umplanung:");
    expect(file).toContain("BLOCKIERT: Keine Freigabe vorhanden; Medienreferenz fehlt");
    expect(file).toContain("es wurde nichts veröffentlicht");
  });

  it("Briefing enthält alle geforderten Bestandteile", async () => {
    const { briefing } = await runWorkflow({ paths: tempWorkspace(), provider, now: NOW });

    expect(briefing.simulated).toBe(true);
    expect(briefing.shotPlan.length).toBeGreaterThanOrEqual(3);
    expect(briefing.textOverlays.length).toBeGreaterThan(0);
    expect(briefing.thumbnailIdea).not.toBe("");
    expect(new URL(briefing.callToAction.url).hostname).toBe("www.example.com");
    expect(new Set(briefing.variants.map((v) => v.channel)).size).toBe(2);
    const e = briefing.effort;
    expect(e.production + e.variants + e.coordination + e.approval).toBe(e.total);
  });

  it("bricht mit dem nicht implementierten LLM-Provider ab, statt etwas vorzutäuschen", async () => {
    await expect(
      runWorkflow({ paths: tempWorkspace(), provider: new LlmContentProvider("dummy"), now: NOW }),
    ).rejects.toThrow("nicht implementiert");
  });
});

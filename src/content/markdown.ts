import type { Briefing } from "./briefing";

export function briefingToMarkdown(b: Briefing): string {
  const lines = [
    `# Produktionsbriefing ${b.ideaId}: ${b.topic}`,
    "",
    b.simulated
      ? `> SIMULIERT: Inhalte stammen aus festen Testantworten (${b.generatedBy}), nicht aus einem Sprachmodell.`
      : `> Erzeugt von ${b.generatedBy}. Vor Veröffentlichung menschlich prüfen.`,
    "",
    "## Einstieg",
    b.hook,
    "",
    "## Beitragstext",
    b.postText,
    "",
    "## Dreh- und Gestaltungsplan",
    ...b.shotPlan.map((s, i) => `${i + 1}. ${s}`),
    "",
    `Technik/Ort: ${b.equipment}`,
    "",
    "## Texteinblendungen",
    ...b.textOverlays.map((t) => `- ${t}`),
    "",
    "## Titelbild",
    b.thumbnailIdea,
    "",
    "## Einladung zur Terminvereinbarung",
    `${b.callToAction.text} ${b.callToAction.url}`,
    "",
    "## Kanalvarianten",
    ...b.variants.flatMap((v) => [
      `### ${v.channel} (${v.format})`,
      `Unterschied: ${v.differences}`,
      "",
      v.text,
      "",
    ]),
    "## Aufwand (Minuten)",
    "| Produktion | Varianten | Abstimmung | Freigabe | Gesamt |",
    "|---|---|---|---|---|",
    `| ${b.effort.production} | ${b.effort.variants} | ${b.effort.coordination} | ${b.effort.approval} | ${b.effort.total} |`,
    "",
  ];
  return lines.join("\n");
}

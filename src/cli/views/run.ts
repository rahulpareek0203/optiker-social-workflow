import type { Texts } from "../../i18n/types";
import type { WorkflowResult } from "../../workflow/workflow";
import { bold, dim, green, section } from "../format";
import { renderCapacity, renderPlan, renderSelection } from "./planning";
import { renderHandoffs } from "./publishing";

export function renderRun(t: Texts, result: WorkflowResult): string {
  return [
    "",
    bold(t.ui.title(result.plan.week)),
    dim(t.ui.simulationNote),
    renderSelection(t, result.plan),
    renderCapacity(t, result.plan),
    renderPlan(t, result.plan),
    section(t.ui.briefing),
    `  ${green("✔")} ${t.ui.briefingDone(result.briefing.ideaId.slice(-2), result.briefing.topic)}`,
    renderHandoffs(t, result),
  ].join("\n");
}

import { FakeContentProvider } from "../content/fakeProvider";
import { terminalTexts } from "../i18n";
import { defaultPaths } from "../workflow/paths";
import { runWorkflow } from "../workflow/workflow";
import { red } from "./format";
import { renderNextSteps } from "./views/publishing";
import { renderRun } from "./views/run";

const t = terminalTexts();

try {
  const result = await runWorkflow({
    paths: defaultPaths(process.cwd()),
    provider: new FakeContentProvider(),
  });
  console.log(renderRun(t, result));
  console.log(renderNextSteps(t, result));

  if (result.results.some((r) => r.outcome === "failed")) process.exitCode = 2;
} catch (err) {
  console.error(red(`${t.ui.aborted} ${err instanceof Error ? err.message : String(err)}`));
  process.exitCode = 1;
}

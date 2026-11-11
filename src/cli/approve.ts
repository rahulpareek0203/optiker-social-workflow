// Simuliert die menschliche Freigabe: npm run approve -- <postId> "<Name>"

import { InvalidTransitionError, approve } from "../approval/stateMachine";
import { terminalTexts } from "../i18n";
import { loadPosts, savePosts } from "../storage/posts";
import { defaultPaths } from "../workflow/paths";
import { dim, green, red } from "./format";

const t = terminalTexts();
const [postId, approvedBy] = process.argv.slice(2);
const { postsFile } = defaultPaths(process.cwd());

try {
  if (!postId || !approvedBy) throw new Error(t.ui.usage);
  const posts = loadPosts(postsFile);
  const post = posts.find((p) => p.id === postId);
  if (!post) throw new Error(t.ui.notFound(postId, posts.map((p) => p.id).join(", ")));
  approve(post, approvedBy, new Date());
  savePosts(postsFile, posts);
  console.log(
    `${green(t.ui.approved)}  ${t.ui.approvedBy(post.id, approvedBy)} ${dim(`(${t.ui.version} ${post.approval?.fingerprint.slice(0, 12)})`)}`,
  );
} catch (err) {
  const message =
    err instanceof InvalidTransitionError
      ? t.transitionError(err.postId, err.from, err.to)
      : err instanceof Error
        ? err.message
        : String(err);
  console.error(red(`✖ ${message}`));
  process.exitCode = 1;
}

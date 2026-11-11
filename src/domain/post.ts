// Beiträge im Freigabeordner. Wird aus einer von Menschen bearbeiteten Datei gelesen, daher validiert.

import { z } from "zod";
import { ChannelSchema } from "./input";

export const PostStatusSchema = z.enum(["draft", "in_review", "approved", "handed_off"]);
export type PostStatus = z.infer<typeof PostStatusSchema>;

export const ApprovalSchema = z.object({
  fingerprint: z.string().length(64),
  approvedBy: z.string().min(1),
  approvedAt: z.string(),
});
export type Approval = z.infer<typeof ApprovalSchema>;

// Wird aus posts.json gelesen, das Menschen von Hand bearbeiten – daher validiert.
export const PostSchema = z.object({
  id: z.string().min(1),
  ideaId: z.string().min(1),
  title: z.string(),
  text: z.string(),
  mediaRef: z.string().nullable(),
  channels: z.array(ChannelSchema),
  publishDate: z.string(),
  status: PostStatusSchema,
  approval: ApprovalSchema.nullable(),
  history: z.array(z.string()),
});
export type Post = z.infer<typeof PostSchema>;

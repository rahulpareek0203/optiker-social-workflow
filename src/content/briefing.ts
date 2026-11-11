import { z } from "zod";
import { ChannelSchema, FormatSchema, type WeekInput } from "../domain/input";
import type { Idea } from "../domain/plan";
import type { ContentContext, ContentProvider } from "./provider";

const ChannelVariantSchema = z.object({
  channel: ChannelSchema,
  format: FormatSchema,
  text: z.string().min(1),
  differences: z.string().min(1),
});

const ProviderBriefingSchema = z.object({
  hook: z.string().min(1),
  postText: z.string().min(1),
  shotPlan: z.array(z.string().min(1)).min(3),
  equipment: z.string().min(1),
  textOverlays: z.array(z.string().min(1)).min(1),
  thumbnailIdea: z.string().min(1),
  callToAction: z.object({
    text: z.string().min(1),
    url: z.url().refine((u) => new URL(u).hostname.endsWith("example.com"), {
      message: "Nur fiktive Links unter example.com erlaubt",
    }),
  }),
  variants: z
    .array(ChannelVariantSchema)
    .length(2)
    .refine((v) => v[0]?.channel !== v[1]?.channel, {
      message: "Varianten brauchen zwei verschiedene Kanäle",
    }),
});

const PostTextSchema = z.object({ text: z.string().min(1) });

export type Briefing = z.infer<typeof ProviderBriefingSchema> & {
  ideaId: string;
  topic: string;
  effort: Idea["effort"];
  generatedBy: string;
  simulated: boolean;
};

export function contextFrom(input: WeekInput): ContentContext {
  return { brand: input.brand, tone: input.tone, seasonalOccasion: input.seasonalOccasion };
}

export async function createBriefing(
  provider: ContentProvider,
  idea: Idea,
  context: ContentContext,
): Promise<Briefing> {
  const raw = await provider.generateBriefing(idea, context);
  const parsed = ProviderBriefingSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Briefing von ${provider.name} ist ungültig: ${z.prettifyError(parsed.error)}`);
  }
  // Der Aufwand kommt aus der Planung, nicht vom Provider, damit beide Zahlen übereinstimmen.
  return {
    ...parsed.data,
    ideaId: idea.id,
    topic: idea.topic,
    effort: idea.effort,
    generatedBy: provider.name,
    simulated: provider.simulated,
  };
}

export async function createPostText(
  provider: ContentProvider,
  idea: Idea,
  context: ContentContext,
): Promise<string> {
  const parsed = PostTextSchema.safeParse(await provider.generatePostText(idea, context));
  if (!parsed.success) {
    throw new Error(`Beitragstext von ${provider.name} ist ungültig: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data.text;
}

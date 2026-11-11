// Eingabe der Wochenplanung (data/input/*.json), mit zod validiert.

import { z } from "zod";

export const ChannelSchema = z.enum(["instagram", "facebook", "tiktok", "linkedin"]);
export type Channel = z.infer<typeof ChannelSchema>;

export const FormatSchema = z.enum(["reel", "carousel", "image", "story"]);
export type Format = z.infer<typeof FormatSchema>;

export const PersonSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  minutesPerWeek: z.number().int().positive(),
});
export type Person = z.infer<typeof PersonSchema>;

export const TopicSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  audience: z.string().min(1),
  format: FormatSchema,
  channels: z.array(ChannelSchema).min(1),
  seasonal: z.boolean().default(false),
});
export type Topic = z.infer<typeof TopicSchema>;

export const InspirationFindSchema = z.object({
  id: z.string().min(1),
  channel: ChannelSchema,
  sourceId: z.string().min(1),
  topicId: z.string().min(1),
  note: z.string(),
  // Kennzahlen werden nicht geschätzt: unbekannt bleibt null.
  views: z.number().int().nonnegative().nullable().default(null),
});
export type InspirationFind = z.infer<typeof InspirationFindSchema>;

export const WeekInputSchema = z
  .object({
    week: z.string().regex(/^\d{4}-W\d{2}$/, "Format JJJJ-Www erwartet"),
    weekStart: z.iso.date(),
    brand: z.string().min(1),
    tone: z.string().min(1),
    audiences: z.array(z.string().min(1)).min(1),
    seasonalOccasion: z.string().min(1),
    people: z.array(PersonSchema).min(1),
    topics: z.array(TopicSchema).min(5, "Mindestens fünf Themen nötig für 3 Prioritäten + 2 Reserven"),
    inspirationFinds: z.array(InspirationFindSchema).min(3),
    // Medienreferenzen je Thema, vom Team selbst produziert
    media: z.record(z.string(), z.string().min(1)).default({}),
  })
  .superRefine((input, ctx) => {
    for (const [label, ids] of [
      ["Thema", input.topics.map((t) => t.id)],
      ["Person", input.people.map((p) => p.id)],
      ["Fund", input.inspirationFinds.map((f) => f.id)],
    ] as const) {
      const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
      for (const id of new Set(duplicates)) {
        ctx.addIssue({ code: "custom", message: `${label} ${id} ist doppelt vorhanden` });
      }
    }
    const topicIds = new Set(input.topics.map((t) => t.id));
    for (const find of input.inspirationFinds) {
      if (!topicIds.has(find.topicId)) {
        ctx.addIssue({
          code: "custom",
          message: `Fund ${find.id} verweist auf unbekanntes Thema ${find.topicId}`,
        });
      }
    }
    for (const topicId of Object.keys(input.media)) {
      if (!topicIds.has(topicId)) {
        ctx.addIssue({ code: "custom", message: `Medienreferenz verweist auf unbekanntes Thema ${topicId}` });
      }
    }
  });
export type WeekInput = z.infer<typeof WeekInputSchema>;

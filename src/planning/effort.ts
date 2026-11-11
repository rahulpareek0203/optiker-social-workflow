import type { Format } from "../domain/input";
import type { Effort } from "../domain/plan";

// Grobe Erfahrungswerte in Minuten, inkl. Varianten, Abstimmung und Freigabe.
const PRODUCTION_MINUTES: Record<Format, number> = { reel: 60, carousel: 45, image: 25, story: 15 };
const MINUTES_PER_EXTRA_CHANNEL = 10;
const COORDINATION_MINUTES = 10;
const APPROVAL_MINUTES = 5;

export function estimateEffort(format: Format, channelCount: number): Effort {
  const production = PRODUCTION_MINUTES[format];
  const variants = Math.max(0, channelCount - 1) * MINUTES_PER_EXTRA_CHANNEL;
  const total = production + variants + COORDINATION_MINUTES + APPROVAL_MINUTES;
  return { production, variants, coordination: COORDINATION_MINUTES, approval: APPROVAL_MINUTES, total };
}

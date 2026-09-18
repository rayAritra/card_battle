import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db/client";
import { log, errorMessage } from "@/lib/log";
import { isRecord } from "@/lib/chain/shared";
import type { Card } from "@/types";
import { marginBucket, staticCommentary, taglineFor } from "./templates";

/**
 * LLM flavor text, cached by SHAPE rather than by wallet.
 *
 * The cache key is `${archetype}:${abilityId}:${levelBucket}`, never the
 * address: there are only ~2400 possible strings, so after a few hundred users
 * this costs effectively nothing and every wallet gets an instant response.
 *
 * Every failure path — no key, HTTP error, malformed JSON, wrong shape —
 * falls back to the static templates, which are written to stand on their own.
 */

const MODEL = "claude-opus-5";
const MAX_TOKENS = 512;

export interface Flavor {
  tagline: string;
  abilityFlavor: string;
}

/** Level rounded to the nearest 20, which is the third component of the key. */
export const levelBucket = (level: number): number => Math.round(level / 20) * 20;

export const flavorKey = (card: Card): string =>
  `${card.archetype}:${card.ability.id}:${levelBucket(card.level)}`;

const SYSTEM_PROMPT = `You write flavor text for onchain trading cards. Terse, confident, slightly mythic. Crypto-native but never cringe. No emoji, no exclamation marks, no financial advice, no price talk, no second person.`;

function userPrompt(card: Card): string {
  return [
    `Archetype: ${card.archetype} | Level: ${card.level} | Ability: ${card.ability.name}`,
    `Ability fact: ${card.ability.flavor}`,
    `Return ONLY this JSON, no markdown fences:`,
    `{"tagline":"<=8 words","abilityFlavor":"<=14 words, must incorporate the ability fact"}`,
  ].join("\n");
}

/** Strips markdown fences and any prose around the JSON object. */
function parseFlavorJson(raw: string): Flavor | null {
  const withoutFences = raw
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  try {
    const parsed: unknown = JSON.parse(withoutFences.slice(start, end + 1));
    if (!isRecord(parsed)) return null;

    const { tagline, abilityFlavor } = parsed;
    if (typeof tagline !== "string" || typeof abilityFlavor !== "string") return null;
    if (tagline.trim() === "" || abilityFlavor.trim() === "") return null;

    return { tagline: tagline.trim(), abilityFlavor: abilityFlavor.trim() };
  } catch {
    return null;
  }
}

async function readCache(key: string): Promise<Flavor | null> {
  const client = db();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("flavor_cache")
      .select("text")
      .eq("cache_key", key)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const value: unknown = data.text;
    if (!isRecord(value)) return null;
    if (typeof value.tagline !== "string" || typeof value.abilityFlavor !== "string") return null;

    return { tagline: value.tagline, abilityFlavor: value.abilityFlavor };
  } catch (error) {
    log("warn", "flavor.cache.read", { key, error: errorMessage(error) });
    return null;
  }
}

async function writeCache(key: string, flavor: Flavor): Promise<void> {
  const client = db();
  if (!client) return;

  try {
    const { error } = await client
      .from("flavor_cache")
      .upsert({ cache_key: key, text: flavor }, { onConflict: "cache_key" });
    if (error) throw error;
  } catch (error) {
    log("warn", "flavor.cache.write", { key, error: errorMessage(error) });
  }
}

async function callModel(card: Card): Promise<Flavor | null> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      output_config: { effort: "low" },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt(card) }],
    });

    if (response.stop_reason === "refusal") {
      log("warn", "flavor.refused", { archetype: card.archetype });
      return null;
    }

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return parseFlavorJson(text);
  } catch (error) {
    log("warn", "flavor.unavailable", { error: errorMessage(error) });
    return null;
  }
}

/** The static flavor a card falls back to. Always valid. */
export function staticFlavor(card: Card): Flavor {
  return { tagline: taglineFor(card.archetype), abilityFlavor: card.ability.flavor };
}

/**
 * Flavor for a card: cache, then model, then static templates.
 * Never throws and never leaves a card without usable text.
 */
export async function generateFlavor(card: Card): Promise<Flavor> {
  const key = flavorKey(card);

  const cached = await readCache(key);
  if (cached) return cached;

  const generated = await callModel(card);
  if (!generated) return staticFlavor(card);

  await writeCache(key, generated);
  return generated;
}

/**
 * One line of commentary on a finished battle, cached by
 * `${winnerArchetype}:${loserArchetype}:${marginBucket}` — again never by address.
 */
export async function generateBattleCommentary(
  winnerArchetype: string,
  loserArchetype: string,
  margin: number,
): Promise<string> {
  const key = `battle:${winnerArchetype}:${loserArchetype}:${marginBucket(margin)}`;
  const fallback = staticCommentary(winnerArchetype, loserArchetype, margin);

  const cached = await readCache(key);
  if (cached) return cached.tagline;

  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) return fallback;

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      output_config: { effort: "low" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            `A ${winnerArchetype} defeated a ${loserArchetype} by a ${marginBucket(margin)} margin.`,
            `Return ONLY this JSON, no markdown fences:`,
            `{"tagline":"<=12 words describing the match","abilityFlavor":"<=12 words"}`,
          ].join("\n"),
        },
      ],
    });

    if (response.stop_reason === "refusal") return fallback;

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    const parsed = parseFlavorJson(text);
    if (!parsed) return fallback;

    await writeCache(key, parsed);
    return parsed.tagline;
  } catch (error) {
    log("warn", "flavor.battle.unavailable", { error: errorMessage(error) });
    return fallback;
  }
}

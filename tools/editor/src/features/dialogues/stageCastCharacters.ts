import type { ResourceRecord, ResourceSummary } from "../../types";
import { normalizeTimelineCharacterId } from "./stageCastTimeline";

export function characterLabel(characterId: string, character: ResourceRecord | undefined, summaries: ResourceSummary[]) {
  if (characterId === "mystery") return "???";
  return String(character?.display_name || summaries.find((entry) => entry.id === characterId)?.title || characterId);
}

export function characterIsProtagonist(characterId: string, characters: ResourceSummary[]) {
  return Boolean(characters.find((character) => character.id === characterId)?.isProtagonist);
}

export function stageCastAllowsCharacter(characterId: string, characters: ResourceSummary[]) {
  const normalizedId = normalizeTimelineCharacterId(characterId);
  return Boolean(normalizedId) && !characterIsProtagonist(normalizedId, characters);
}

export function filterStageCastCharacterIds(characterIds: string[], characters: ResourceSummary[]) {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const rawId of characterIds) {
    const characterId = normalizeTimelineCharacterId(rawId);
    if (!characterId || seen.has(characterId) || characterIsProtagonist(characterId, characters)) continue;
    seen.add(characterId);
    result.push(characterId);
  }
  return result;
}

export function removeProtagonistStageCastEntries(stageCast: Record<string, ResourceRecord>, characters: ResourceSummary[]) {
  const nextStageCast = { ...stageCast };
  let removedCount = 0;
  for (const rawId of Object.keys(nextStageCast)) {
    const characterId = normalizeTimelineCharacterId(rawId);
    if (!characterId || !characterIsProtagonist(characterId, characters)) continue;
    delete nextStageCast[rawId];
    removedCount += 1;
  }
  return { stageCast: nextStageCast, removedCount, changed: removedCount > 0 };
}

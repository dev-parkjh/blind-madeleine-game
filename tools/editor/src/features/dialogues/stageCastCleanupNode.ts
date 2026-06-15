import type { ResourceRecord, ResourceSummary } from "../../types";
import { isCutsceneNode, isStageNode } from "./dialogueNodeModel";
import {
  characterIsProtagonist,
  filterStageCastCharacterIds,
  removeProtagonistStageCastEntries
} from "./stageCastCharacters";
import {
  buildInheritedStageCastEntry,
  fillStageCastDefaults,
  getNodeSpeakerMystery,
  portraitRigStageCastDefaultsForCharacterId,
  withStageCastRecord
} from "./stageCastDefaults";
import { stageCastAnimationOrderDefault } from "./stageCastLayout";
import {
  computeStageCharacterIdsAtNode,
  getStageCastRecord,
  normalizeEditorSpeakerId,
  normalizeTimelineCharacterId
} from "./stageCastTimeline";

export function pruneStageCastToAllowed(
  node: ResourceRecord,
  allowed: Set<string>,
  characters: ResourceSummary[] = [],
  options: { removeManualExtras?: boolean } = {}
) {
  const removeManualExtras = options.removeManualExtras ?? true;
  const cast = getStageCastRecord(node.stage_cast);
  if (Object.keys(cast).length === 0) {
    return { node, removedCount: 0, changed: false };
  }

  const nextCast: Record<string, ResourceRecord> = {};
  let removedCount = 0;
  for (const [rawId, entry] of Object.entries(cast)) {
    const characterId = normalizeEditorSpeakerId(rawId);
    const isProtagonist = characterId && characterId !== "mystery" && characterIsProtagonist(characterId, characters);
    const keepEntry = !characterId || characterId === "mystery" || (!isProtagonist && (!removeManualExtras || allowed.has(characterId)));
    if (keepEntry) {
      nextCast[rawId] = entry;
      continue;
    }
    removedCount += 1;
  }

  if (removedCount === 0) return { node, removedCount: 0, changed: false };
  const nextNode = { ...node };
  if (Object.keys(nextCast).length > 0 || isStageNode(node)) nextNode.stage_cast = nextCast;
  else delete nextNode.stage_cast;
  return { node: nextNode, removedCount, changed: true };
}

export function ensureStageCastForNode(
  node: ResourceRecord,
  requiredIds: string[],
  speakerId: string,
  nodeIndex: number,
  nodes: ResourceRecord[],
  options: { removeManualExtras?: boolean; characters?: ResourceSummary[] } = {}
) {
  const removeManualExtras = options.removeManualExtras ?? true;
  const characters = options.characters ?? [];
  const stageCastRequiredIds = filterStageCastCharacterIds(requiredIds, characters);
  const stageCast = { ...getStageCastRecord(node.stage_cast) };
  let addedCount = 0;
  let removedCount = 0;
  let changed = false;

  stageCastRequiredIds.forEach((characterId) => {
    const isSpeaker = characterId === speakerId;
    const existing = stageCast[characterId];
    const nextEntry = fillStageCastDefaults(
      existing && typeof existing === "object"
        ? { ...existing, character_exit: false }
        : buildInheritedStageCastEntry(nodes, nodeIndex, characterId),
      isSpeaker && getNodeSpeakerMystery(node),
      stageCastAnimationOrderDefault,
      portraitRigStageCastDefaultsForCharacterId(characterId, characters)
    );
    if (!existing) addedCount += 1;
    if (!existing || JSON.stringify(existing) !== JSON.stringify(nextEntry)) {
      stageCast[characterId] = nextEntry;
      changed = true;
    }
  });

  for (const rawId of Object.keys(stageCast)) {
    const characterId = normalizeTimelineCharacterId(rawId);
    if (characterId && characterIsProtagonist(characterId, characters)) {
      delete stageCast[rawId];
      removedCount += 1;
      changed = true;
      continue;
    }
    if (!removeManualExtras || !characterId || stageCastRequiredIds.includes(characterId)) continue;
    delete stageCast[rawId];
    removedCount += 1;
    changed = true;
  }

  if (!changed) {
    return { node, addedCount: 0, removedCount: 0, changed: false };
  }

  const nextNode = { ...node };
  if (Object.keys(stageCast).length > 0) nextNode.stage_cast = stageCast;
  else delete nextNode.stage_cast;
  return { node: nextNode, addedCount, removedCount, changed: true };
}

export function applyInheritedStageCastDefaults(
  node: ResourceRecord,
  nodeIndex: number,
  nodes: ResourceRecord[],
  characters: ResourceSummary[] = []
): ResourceRecord {
  if (isCutsceneNode(node)) return node;
  const speakerId = normalizeTimelineCharacterId(node.speaker);
  const pruned = removeProtagonistStageCastEntries(getStageCastRecord(node.stage_cast), characters);
  const nextNode = pruned.changed ? withStageCastRecord(node, pruned.stageCast) : node;
  const stageIds = filterStageCastCharacterIds(computeStageCharacterIdsAtNode(nodeIndex, nodes), characters);
  if (stageIds.length === 0) return nextNode;
  return ensureStageCastForNode(nextNode, stageIds, speakerId, nodeIndex, nodes, { characters }).node;
}

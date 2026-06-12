import type { ResourceRecord, ResourceSummary } from "../../types";
import { isCutsceneNode, isStageNode } from "./dialogueNodeModel";
import { characterIsProtagonist, stageCastAllowsCharacter } from "./stageCastCharacters";
import { ensureStageCastForNode, pruneStageCastToAllowed } from "./stageCastCleanupNode";
import {
  defaultFocusTargetsForSpeaker,
  nodeHasExplicitFocusTargets,
  withNodeFocusTargets
} from "./stageCastFocus";
import {
  getExitIdsFromNode,
  getStageCastRecord,
  getStageTextEventIdsFromNode,
  normalizeTimelineCharacterId
} from "./stageCastTimeline";

export type DialogueSpeakerStageCastCleanResult = {
  nodes: ResourceRecord[];
  changedNodeCount: number;
  removedCastCount: number;
  addedCastCount: number;
};

export function countManualStageCastRemovals(nodes: ResourceRecord[], characters: ResourceSummary[] = []) {
  const active = new Set<string>();
  let count = 0;

  for (const node of nodes) {
    if (isCutsceneNode(node)) continue;

    const speakerId = normalizeTimelineCharacterId(node.speaker);
    const enterIds = getStageTextEventIdsFromNode(node, "enter");
    const requiredCast = new Set(active);
    if (stageCastAllowsCharacter(speakerId, characters)) requiredCast.add(speakerId);
    enterIds.forEach((characterId) => {
      if (stageCastAllowsCharacter(characterId, characters)) requiredCast.add(characterId);
    });

    for (const rawId of Object.keys(getStageCastRecord(node.stage_cast))) {
      const characterId = normalizeTimelineCharacterId(rawId);
      if (characterId && !characterIsProtagonist(characterId, characters) && !requiredCast.has(characterId)) count += 1;
    }

    const nextSpeakerId = normalizeTimelineCharacterId(node.speaker);
    if (stageCastAllowsCharacter(nextSpeakerId, characters)) active.add(nextSpeakerId);
    getStageTextEventIdsFromNode(node, "enter").forEach((characterId) => {
      if (stageCastAllowsCharacter(characterId, characters)) active.add(characterId);
    });
    Object.keys(getStageCastRecord(node.stage_cast)).forEach((rawId) => {
      const characterId = normalizeTimelineCharacterId(rawId);
      if (stageCastAllowsCharacter(characterId, characters)) active.add(characterId);
    });
    getExitIdsFromNode(node).forEach((characterId) => active.delete(characterId));
  }

  return count;
}

export function cleanDialogueSpeakerStageCast(
  nodes: ResourceRecord[],
  characters: ResourceSummary[],
  options: { removeManualExtras?: boolean } = {}
): DialogueSpeakerStageCastCleanResult {
  const removeManualExtras = options.removeManualExtras ?? true;
  const active = new Set<string>();
  let changedNodeCount = 0;
  let removedCastCount = 0;
  let addedCastCount = 0;

  const cleanedNodes = nodes.reduce<ResourceRecord[]>((accumulator, node, index) => {
    if (isCutsceneNode(node)) {
      accumulator.push(node);
      return accumulator;
    }

    const speakerId = normalizeTimelineCharacterId(node.speaker);
    const enterIds = getStageTextEventIdsFromNode(node, "enter");
    const requiredCast = new Set(active);
    if (stageCastAllowsCharacter(speakerId, characters)) requiredCast.add(speakerId);
    enterIds.forEach((characterId) => {
      if (stageCastAllowsCharacter(characterId, characters)) requiredCast.add(characterId);
    });

    let nextNode = node;
    let nodeChanged = false;

    if (requiredCast.size > 0) {
      const ensured = ensureStageCastForNode(
        node,
        [...requiredCast].sort((a, b) => a.localeCompare(b)),
        speakerId,
        index,
        accumulator,
        { removeManualExtras, characters }
      );
      nextNode = ensured.node;
      if (ensured.changed) {
        nodeChanged = true;
        addedCastCount += ensured.addedCount;
        removedCastCount += ensured.removedCount;
      }
    } else {
      const pruned = pruneStageCastToAllowed(node, requiredCast, characters, { removeManualExtras });
      nextNode = pruned.node;
      if (pruned.changed) {
        nodeChanged = true;
        removedCastCount += pruned.removedCount;
      }
    }

    const nextSpeakerId = normalizeTimelineCharacterId(nextNode.speaker);
    if (!isStageNode(nextNode) && (nextSpeakerId || nodeHasExplicitFocusTargets(nextNode))) {
      const focusedNode = withNodeFocusTargets(
        nextNode,
        defaultFocusTargetsForSpeaker(nextSpeakerId, characters)
      );
      if (JSON.stringify(focusedNode) !== JSON.stringify(nextNode)) {
        nextNode = focusedNode;
        nodeChanged = true;
      }
    }

    if (stageCastAllowsCharacter(nextSpeakerId, characters)) active.add(nextSpeakerId);
    getStageTextEventIdsFromNode(nextNode, "enter").forEach((characterId) => {
      if (stageCastAllowsCharacter(characterId, characters)) active.add(characterId);
    });
    Object.keys(getStageCastRecord(nextNode.stage_cast)).forEach((rawId) => {
      const characterId = normalizeTimelineCharacterId(rawId);
      if (stageCastAllowsCharacter(characterId, characters)) active.add(characterId);
    });
    getExitIdsFromNode(nextNode).forEach((characterId) => active.delete(characterId));

    if (nodeChanged) changedNodeCount += 1;
    accumulator.push(nextNode);
    return accumulator;
  }, []);

  return { nodes: cleanedNodes, changedNodeCount, removedCastCount, addedCastCount };
}

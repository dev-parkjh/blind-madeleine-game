import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord, ResourceSummary } from "../../types";
import {
  filterStageCastCharacterIds,
  removeProtagonistStageCastEntries
} from "./stageCastCharacters";
import {
  buildInheritedStageCastEntry,
  fillStageCastDefaults,
  getNodeSpeakerMystery,
  live2dStageCastDefaultsForCharacterId,
  withStageCastRecord
} from "./stageCastDefaults";
import {
  defaultFocusTargetsForSpeaker,
  withNodeFocusTargets
} from "./stageCastFocus";
import { stageCastAnimationOrderDefault } from "./stageCastLayout";
import {
  computeStageCharacterIdsAtNode,
  computeStageCharacterIdsBeforeNode,
  getStageCastRecord,
  normalizeEditorSpeakerId
} from "./stageCastTimeline";

export function isStageCastOnlyNode(node: ResourceRecord) {
  const cast = getStageCastRecord(node.stage_cast);
  if (Object.keys(cast).length === 0) return false;
  if (normalizeEditorSpeakerId(node.speaker)) return false;
  if (String(node.text || "").trim()) return false;
  return asArray(node.choices).length === 0;
}

export function withSpeakerStageCastDefaults(
  node: ResourceRecord,
  speaker: string,
  nodes: ResourceRecord[],
  nodeIndex: number,
  characters: ResourceSummary[] = []
) {
  const speakerId = normalizeEditorSpeakerId(speaker);
  const nextNode: ResourceRecord = withNodeFocusTargets(
    { ...node, speaker },
    defaultFocusTargetsForSpeaker(speakerId, characters)
  );
  const oldSpeakerId = normalizeEditorSpeakerId(node.speaker);
  const nodesWithNext = nodes.map((entry, index) => index === nodeIndex ? nextNode : entry);
  const stageIds = filterStageCastCharacterIds(computeStageCharacterIdsAtNode(nodeIndex, nodesWithNext), characters);

  let stageCast = removeProtagonistStageCastEntries(getStageCastRecord(node.stage_cast), characters).stageCast;
  const previousStageIds = new Set(computeStageCharacterIdsBeforeNode(nodeIndex, nodes));
  if (oldSpeakerId && oldSpeakerId !== speakerId && !previousStageIds.has(oldSpeakerId)) {
    delete stageCast[oldSpeakerId];
  }

  if (stageIds.length === 0) return withStageCastRecord(nextNode, stageCast);

  const speakerMystery = getNodeSpeakerMystery(nextNode);
  for (const castId of stageIds) {
    if (!castId || castId === "mystery") continue;
    const existing = stageCast[castId];
    const isSpeaker = Boolean(speakerId) && castId === speakerId;
    stageCast[castId] = fillStageCastDefaults(
      existing && typeof existing === "object"
        ? { ...existing, character_exit: false }
        : buildInheritedStageCastEntry(nodes, nodeIndex, castId),
      isSpeaker && speakerMystery,
      stageCastAnimationOrderDefault,
      live2dStageCastDefaultsForCharacterId(castId, characters)
    );
  }

  return withStageCastRecord(nextNode, stageCast);
}

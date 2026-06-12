import { normalizeSingleId } from "../../lib/ids";
import { isEmptyPlainRecord, normalizeJsonObject } from "../../lib/records";
import type { ResourceRecord, ResourceSummary } from "../../types";
import { getResourceChapterScopeIds } from "../resources/resourceScope";
import { normalizeDialogueChoiceForSave } from "./dialogueChoiceModel";
import { isCutsceneNode, isStageNode } from "./dialogueNodeModel";
import { getDialogueDefaultStartId } from "./dialogueNodeOptions";
import {
  characterIsProtagonist,
  getNodeFocusTargets,
  getStageCastRecord,
  normalizeEditorSpeakerId,
  normalizeTimelineCharacterId,
  nodeHasExplicitFocusTargets,
  portraitZoomDefault,
  snapPortraitZoomPercent,
  withNodeFocusTargets
} from "./stageCastModel";

export function normalizeDialogueDraftForSave(dialogue: ResourceRecord, characters: ResourceSummary[] = []): ResourceRecord {
  const chapters = getResourceChapterScopeIds(dialogue);
  const metadata = normalizeJsonObject(dialogue.metadata);
  const start = normalizeSingleId(dialogue.start);
  const defaultStart = getDialogueDefaultStartId(dialogue);
  const next: ResourceRecord = { ...dialogue };
  if (Array.isArray(dialogue.nodes)) {
    next.nodes = normalizeDialogueNodeSequenceForSave(dialogue.nodes, characters);
  }
  if (Array.isArray(dialogue.statement_nodes)) {
    next.statement_nodes = normalizeDialogueNodeSequenceForSave(dialogue.statement_nodes, characters);
  }
  if (chapters.length > 0) next.chapters = chapters;
  else delete next.chapters;
  delete next.chapter_ids;
  if (start && start !== defaultStart) next.start = start;
  else delete next.start;
  if (Object.keys(metadata).length > 0) next.metadata = metadata;
  else delete next.metadata;
  return next;
}

function normalizeDialogueNodeSequenceForSave(nodes: ResourceRecord[], characters: ResourceSummary[] = []): ResourceRecord[] {
  return nodes.map((node, index) => {
    let next = normalizeDialogueNodeForSave(node, characters);
    if (shouldInferDialogueNodeCameraZoom(node, characters)) {
      next = withNodeCameraZoomPercent(next, resolveNearestDialogueCameraZoomPercent(nodes, index, characters));
    }
    return next;
  });
}

function normalizeDialogueNodeForSave(node: ResourceRecord, characters: ResourceSummary[] = []): ResourceRecord {
  let next = nodeHasExplicitFocusTargets(node) ? withNodeFocusTargets(node, getNodeFocusTargets(node)) : { ...node };
  const explicitCameraZoom = getNodeCameraZoomPercent(next);
  if (explicitCameraZoom !== null) {
    next = withNodeCameraZoomPercent(next, explicitCameraZoom);
  }
  if (Array.isArray(next.nodes)) {
    next = { ...next, nodes: normalizeDialogueNodeSequenceForSave(next.nodes, characters) };
  }
  if (Array.isArray(next.choices)) {
    next = { ...next, choices: next.choices.map((choice) => normalizeDialogueChoiceForSave(choice)) };
  }
  if (Array.isArray(next.lies)) {
    next = { ...next, lies: normalizeStatementLiesForSave(next.lies, characters) };
  }
  if (Array.isArray(next.statement_lies)) {
    next = { ...next, statement_lies: normalizeStatementLiesForSave(next.statement_lies, characters) };
  }
  if (isEmptyPlainRecord(next.set_flags_on_complete)) delete next.set_flags_on_complete;
  return next;
}

function normalizeStatementLiesForSave(lies: unknown[], characters: ResourceSummary[] = []) {
  return lies.map((lie) => {
    if (!lie || typeof lie !== "object") return lie;
    const lieRecord = lie as ResourceRecord;
    if (!Array.isArray(lieRecord.reactions)) return lieRecord;
    return {
      ...lieRecord,
      reactions: lieRecord.reactions.map((reaction) => {
        if (!reaction || typeof reaction !== "object") return reaction;
        const reactionRecord = reaction as ResourceRecord;
        if (!Array.isArray(reactionRecord.nodes)) return reactionRecord;
        return {
          ...reactionRecord,
          nodes: normalizeDialogueNodeSequenceForSave(reactionRecord.nodes, characters)
        };
      })
    };
  });
}

function shouldInferDialogueNodeCameraZoom(node: ResourceRecord, characters: ResourceSummary[] = []) {
  if (isCutsceneNode(node) || isStageNode(node)) return false;
  if (getNodeCameraZoomPercent(node) !== null) return false;
  if (getDialogueNodeFocusZoomPercent(node, characters) !== null) return false;

  const speakerId = normalizeEditorSpeakerId(node.speaker);
  return !speakerId || characterIsProtagonist(speakerId, characters);
}

function resolveNearestDialogueCameraZoomPercent(nodes: ResourceRecord[], nodeIndex: number, characters: ResourceSummary[] = []) {
  for (let index = nodeIndex - 1; index >= 0; index -= 1) {
    const zoom = getDialogueNodeFocusZoomPercent(nodes[index], characters);
    if (zoom !== null) return zoom;
  }
  for (let index = nodeIndex + 1; index < nodes.length; index += 1) {
    const zoom = getDialogueNodeFocusZoomPercent(nodes[index], characters);
    if (zoom !== null) return zoom;
  }
  return portraitZoomDefault;
}

function getDialogueNodeFocusZoomPercent(node: ResourceRecord | undefined, characters: ResourceSummary[] = []): number | null {
  if (!node || isCutsceneNode(node) || isStageNode(node)) return null;

  const explicitCameraZoom = getNodeCameraZoomPercent(node);
  if (explicitCameraZoom !== null) return explicitCameraZoom;

  const cast = getStageCastRecord(node.stage_cast);
  const focusTargets = getNodeFocusTargets(node);
  const speakerId = normalizeTimelineCharacterId(node.speaker);
  const candidates = focusTargets.length > 0
    ? focusTargets
    : [
      ...(speakerId ? [speakerId] : []),
      ...Object.keys(cast)
    ];

  for (const rawId of candidates) {
    const characterId = normalizeTimelineCharacterId(rawId);
    if (!characterId) continue;
    const entry = cast[characterId];
    if (!entry || typeof entry !== "object") continue;
    if (!String(entry.portrait || "").trim()) continue;
    const zoom = getStageCastEntryZoomPercent(entry);
    if (zoom !== null) return zoom;
  }

  return null;
}

const dialogueCameraZoomKeys = ["camera_zoom_percent", "focus_zoom_percent", "dialogue_zoom_percent"];

function getNodeCameraZoomPercent(node: ResourceRecord | undefined): number | null {
  if (!node) return null;
  const metadata = normalizeJsonObject(node.metadata);
  for (const key of dialogueCameraZoomKeys) {
    const zoom = parsePortraitZoomPercent(node[key] ?? metadata[key]);
    if (zoom !== null) return zoom;
  }
  return null;
}

function getStageCastEntryZoomPercent(entry: ResourceRecord): number | null {
  return parsePortraitZoomPercent(entry.portrait_zoom ?? entry.zoom_percent ?? entry.camera_zoom_percent);
}

function parsePortraitZoomPercent(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const numberValue = Number(String(value).trim().replace(/%$/, ""));
  if (!Number.isFinite(numberValue)) return null;
  return snapPortraitZoomPercent(numberValue);
}

function withNodeCameraZoomPercent(node: ResourceRecord, zoomPercent: unknown) {
  const next: ResourceRecord = { ...node };
  const metadata = { ...normalizeJsonObject(next.metadata) };
  for (const key of dialogueCameraZoomKeys) {
    delete next[key];
    delete metadata[key];
  }
  next.camera_zoom_percent = parsePortraitZoomPercent(zoomPercent) ?? portraitZoomDefault;
  if (Object.keys(metadata).length > 0) next.metadata = metadata;
  else delete next.metadata;
  return next;
}

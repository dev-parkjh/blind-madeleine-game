import { cloneJsonValue } from "../../lib/records";
import type { ResourceRecord, ResourceSummary } from "../../types";
import { isStageNode } from "./dialogueNodeModel";
import {
  normalizeCastPosition,
  parseCastOffset,
  portraitZoomDefault,
  stageCastAnimationOrderDefault,
  stageCastDefaultAnimationSpeed,
  stageCastDefaultOpacity
} from "./stageCastLayout";
import { removeProtagonistStageCastEntries, stageCastAllowsCharacter } from "./stageCastCharacters";
import { getStageCastRecord, normalizeEditorSpeakerId } from "./stageCastTimeline";

export function findPreviousCastEntry(nodes: ResourceRecord[], selectedNodeIndex: number, characterId: string) {
  for (let index = selectedNodeIndex - 1; index >= 0; index -= 1) {
    const previousCast = nodes[index]?.stage_cast;
    if (!previousCast || typeof previousCast !== "object") continue;
    const entry = (previousCast as Record<string, ResourceRecord>)[characterId];
    if (entry && typeof entry === "object") return { index, entry };
  }
  return null;
}

export function withStageCastRecord(node: ResourceRecord, stageCast: Record<string, ResourceRecord>) {
  const nextNode = { ...node };
  if (Object.keys(stageCast).length > 0 || isStageNode(node)) nextNode.stage_cast = stageCast;
  else delete nextNode.stage_cast;
  return nextNode;
}

export function buildInheritedStageCastEntry(nodes: ResourceRecord[], nodeIndex: number, speakerId: string) {
  const inherited = findPreviousCastEntry(nodes, nodeIndex, speakerId)?.entry;
  if (!inherited || typeof inherited !== "object") return {};
  const next = cloneJsonValue(inherited);
  delete next.character_exit;
  delete next.exit;
  return next;
}

export function fillStageCastDefaults(entry: ResourceRecord, mystery: boolean, animationOrder: number) {
  const next: ResourceRecord = { ...entry };
  const position = normalizeCastPosition(next.portrait_position ?? next.position ?? "center");
  next.portrait = String(next.portrait || "");
  next.portrait_position = position;
  if (position === "custom") {
    const offset = parseCastOffset(next.portrait_offset);
    next.portrait_offset = [offset.x, offset.y];
  } else if (next.portrait_offset === undefined) {
    next.portrait_offset = null;
  }
  if (next.portrait_zoom === undefined || next.portrait_zoom === null || next.portrait_zoom === "") {
    next.portrait_zoom = portraitZoomDefault;
  }
  if (next.portrait_angle === undefined || next.portrait_angle === null || next.portrait_angle === "") {
    next.portrait_angle = 0;
  }
  if (next.pose_state === undefined || next.pose_state === null || next.pose_state === "") {
    next.pose_state = "default";
  }
  if (next.pose_transition === undefined || next.pose_transition === null || next.pose_transition === "") {
    next.pose_transition = 0.45;
  }
  if (next.animation_order === undefined || next.animation_order === null || next.animation_order === "") {
    next.animation_order = animationOrder;
  }
  if (next.animation_speed === undefined || next.animation_speed === null || next.animation_speed === "") {
    next.animation_speed = stageCastDefaultAnimationSpeed;
  }
  if (next.portrait_opacity === undefined || next.portrait_opacity === null || next.portrait_opacity === "") {
    next.portrait_opacity = stageCastDefaultOpacity;
  }
  if (next.mystery === undefined || next.mystery === null) {
    next.mystery = Boolean(mystery);
  }
  delete next.exit;
  return next;
}

export function getNodeSpeakerMystery(node: ResourceRecord) {
  return Boolean(node.speaker_mystery ?? node.mystery_speaker);
}

export function withNodeSpeakerMystery(node: ResourceRecord, value: boolean, characters: ResourceSummary[] = []) {
  const next: ResourceRecord = { ...node };
  delete next.mystery_speaker;
  if (value) next.speaker_mystery = true;
  else delete next.speaker_mystery;
  const speakerId = normalizeEditorSpeakerId(next.speaker);
  let stageCast = removeProtagonistStageCastEntries(getStageCastRecord(next.stage_cast), characters).stageCast;
  if (value && stageCastAllowsCharacter(speakerId, characters)) {
    stageCast[speakerId] = fillStageCastDefaults(
      stageCast[speakerId] && typeof stageCast[speakerId] === "object" ? { ...stageCast[speakerId] } : {},
      true,
      stageCastAnimationOrderDefault
    );
  }
  return withStageCastRecord(next, stageCast);
}

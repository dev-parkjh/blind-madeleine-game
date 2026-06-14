import type { ResourceRecord, ValidationIssue } from "../../types";
import {
  collectLive2dPoseHintTagsFromRecord,
  expandLive2dPoseHintTags,
  normalizeLive2dPoseTag
} from "../live2dPoseTags";
import {
  characterIsProtagonist,
  dialogueCameraZoomKeys,
  getCharacterLive2dDialogueMotionSummary,
  getCharacterLive2dMotionClipIds,
  getCharacterLive2dPoseTags,
  getCharacterPortraitKeys,
  imagePathExtensions,
  isPlainRecord,
  normalizeSingleId,
  stageCastPositions,
  textSoundMutedKeys,
  validateNumberRange,
  validatePathExtension,
  validatePointArray,
  validateResPath,
  type ResourceMaps
} from "./shared";
import { extractStageTextEvents, getStageCastPortraitIds } from "./dialogueText";

const live2dBooleanKeys = [
  "adaptive_live2d_pose",
  "live2d_auto_pose",
  "adaptive_pose",
  "auto_pose",
  "live2d_motion_loop",
  "live2d_motion_play",
  "live2d_motion_autoplay",
  "live2d_loop",
  "motion_loop",
  "motion_play",
  "live2d_dialogue_motion",
  "live2d_auto_dialogue_motion",
  "dialogue_motion",
  "auto_dialogue_motion"
];

const live2dPoseHintStringKeys = ["live2d_pose_hint", "pose_hint", "live2d_pose_tag", "pose_tag", "emotion", "mood", "tone", "expression"];
const live2dPoseTagsArrayKeys = ["live2d_pose_tags", "pose_tags"];
const live2dMotionClipKeys = ["live2d_motion_clip", "motion_clip", "clip_id"];
const live2dIdleMotionClipKeys = ["live2d_idle_motion_clip", "idle_motion_clip", "idle_clip"];
const live2dTalkMotionClipKeys = ["live2d_talk_motion_clip", "talk_motion_clip", "talk_clip"];
const live2dVisemeMotionClipKeys = ["live2d_viseme_motion_clip", "viseme_motion_clip", "viseme_clip"];

export function validateDialogueCameraZoom(node: ResourceRecord, path: string, issues: ValidationIssue[]) {
  const metadata = isPlainRecord(node.metadata) ? node.metadata : {};
  for (const key of dialogueCameraZoomKeys) {
    validateNumberRange(node[key], `${path}.${key}`, issues, { min: 100, max: 500, optional: true });
    validateNumberRange(metadata[key], `${path}.metadata.${key}`, issues, { min: 100, max: 500, optional: true });
  }
}

export function validateCutscene(cutscene: ResourceRecord, path: string, issues: ValidationIssue[]) {
  validateNumberRange(cutscene.fade_in, `${path}.cutscene.fade_in`, issues, { min: 0, optional: true });
  validateNumberRange(cutscene.hold, `${path}.cutscene.hold`, issues, { min: 0, optional: true });
  validateNumberRange(cutscene.fade_out, `${path}.cutscene.fade_out`, issues, { min: 0, optional: true });
  validateResPath(cutscene.image, `${path}.cutscene.image`, issues, false);
  validatePathExtension(cutscene.image, `${path}.cutscene.image`, imagePathExtensions, issues);
}

export function isCutsceneValidationNode(node: ResourceRecord) {
  const mode = String(node.mode ?? node.type ?? "").trim().toLowerCase();
  if (["cutscene", "blackout", "dark", "fade_black", "fade-to-black", "암전", "컷씬"].includes(mode)) return true;
  return Boolean(node.blackout_enabled ?? node.is_blackout);
}

export function isStageValidationNode(node: ResourceRecord) {
  const mode = String(node.mode ?? node.type ?? "").trim().toLowerCase();
  return ["stage", "stage_cast", "stagecast", "character_motion", "character_movement", "motion", "move", "무대", "캐릭터 이동", "캐릭터이동"].includes(mode);
}

export function validateStageNodeHold(node: ResourceRecord, path: string, issues: ValidationIssue[]) {
  for (const key of ["stage_hold", "stage_wait", "hold", "wait", "duration"]) {
    if (node[key] !== undefined) {
      validateNumberRange(node[key], `${path}.${key}`, issues, { min: 0, optional: true });
    }
  }

  const stage = isPlainRecord(node.stage) ? node.stage : {};
  for (const key of ["hold", "wait", "duration"]) {
    if (stage[key] !== undefined) {
      validateNumberRange(stage[key], `${path}.stage.${key}`, issues, { min: 0, optional: true });
    }
  }
}

export function getNodeCutsceneValidationConfig(node: ResourceRecord) {
  const cutscene = isPlainRecord(node.cutscene) ? node.cutscene : {};
  const blackout = isPlainRecord(node.blackout) ? node.blackout : {};
  return {
    image: cutscene.image
      ?? cutscene.path
      ?? cutscene.src
      ?? cutscene.file
      ?? blackout.image
      ?? blackout.path
      ?? blackout.src
      ?? blackout.file
      ?? node.cutscene_image
      ?? node.cutscene_image_path
      ?? node.blackout_image
      ?? node.image
      ?? node.path,
    fade_in: cutscene.fade_in
      ?? cutscene.fade_in_duration
      ?? cutscene.fadeIn
      ?? cutscene.in
      ?? blackout.fade_in
      ?? blackout.fade_in_duration
      ?? blackout.fadeIn
      ?? blackout.in
      ?? node.blackout_fade_in
      ?? node.blackout_fade_in_duration
      ?? node.fade_in_duration,
    hold: cutscene.hold
      ?? cutscene.hold_duration
      ?? cutscene.duration
      ?? cutscene.wait
      ?? blackout.hold
      ?? blackout.hold_duration
      ?? blackout.duration
      ?? blackout.wait
      ?? node.blackout_hold
      ?? node.blackout_hold_duration
      ?? node.hold_duration,
    fade_out: cutscene.fade_out
      ?? cutscene.fade_out_duration
      ?? cutscene.fadeOut
      ?? cutscene.out
      ?? blackout.fade_out
      ?? blackout.fade_out_duration
      ?? blackout.fadeOut
      ?? blackout.out
      ?? node.blackout_fade_out
      ?? node.blackout_fade_out_duration
      ?? node.fade_out_duration
  };
}

export function buildResolvedNodeIdSet(nodes: ResourceRecord[], autoPrefix: string) {
  return new Set(nodes.map((node, index) => resolveNodeId(node, index, autoPrefix)));
}

export function buildStatementResolvedNodeIdSet(nodes: unknown[]) {
  return new Set(nodes.map((node, index) => {
    if (typeof node === "string") return normalizeSingleId(node) || `@statement_${index}`;
    return isPlainRecord(node) ? resolveNodeId(node, index, "@statement_") : `@statement_${index}`;
  }));
}

export function validateStatementReaction(reaction: ResourceRecord, path: string, issues: ValidationIssue[], maps: ResourceMaps) {
  const kind = String(reaction.kind || "default");
  const targetId = String(reaction.target_id || "");
  if (kind === "character" && targetId && !maps.characters.has(targetId)) {
    issues.push({ severity: "warning", message: `${path}: 존재하지 않는 인물 reaction target입니다: ${targetId}` });
  }
  if (kind === "item" && targetId && !maps.items.has(targetId)) {
    issues.push({ severity: "warning", message: `${path}: 존재하지 않는 아이템 reaction target입니다: ${targetId}` });
  }
  if ((kind === "character" || kind === "item") && !targetId) {
    issues.push({ severity: "warning", message: `${path}: ${kind} reaction target이 비어 있습니다.` });
  }
}

export function validateStageCast(value: unknown, path: string, issues: ValidationIssue[], maps: ResourceMaps) {
  if (!value || typeof value !== "object") return;

  for (const [characterId, cast] of Object.entries(value)) {
    if (characterId !== "mystery" && !maps.characters.has(characterId)) {
      issues.push({ severity: "warning", message: `${path}: stage_cast에 없는 캐릭터가 있습니다: ${characterId}` });
    }
    if (characterId !== "mystery" && characterIsProtagonist(characterId, maps)) {
      issues.push({ severity: "warning", message: `${path}: 주인공은 stage_cast에 넣지 않습니다: ${characterId}` });
    }

    const record = cast as ResourceRecord;
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      issues.push({ severity: "warning", message: `${path}: stage_cast.${characterId}는 객체여야 합니다.` });
      continue;
    }

    const castPath = `${path}.stage_cast.${characterId}`;
    const position = String(record.portrait_position ?? record.position ?? "center");
    if (!stageCastPositions.has(position)) {
      issues.push({ severity: "warning", message: `${castPath}.portrait_position이 지원 범위가 아닙니다: ${position}` });
    }
    if (position === "custom") {
      validatePointArray(record.portrait_offset, `${castPath}.portrait_offset`, issues, { length: 2, min: -1, max: 1 });
    } else if (record.portrait_offset !== undefined && record.portrait_offset !== null) {
      validatePointArray(record.portrait_offset, `${castPath}.portrait_offset`, issues, { length: 2, min: -1, max: 1, optional: true });
    }
    validateNumberRange(record.portrait_position_order ?? record.position_order, `${castPath}.portrait_position_order`, issues, { min: 1, optional: true });
    validateNumberRange(record.animation_order ?? record.order, `${castPath}.animation_order`, issues, { min: 1, optional: true });
    validateNumberRange(record.animation_speed, `${castPath}.animation_speed`, issues, { min: 0.5, max: 2, optional: true });
    validateNumberRange(record.portrait_opacity ?? record.opacity, `${castPath}.portrait_opacity`, issues, { min: 0, max: 1, optional: true });
    validateNumberRange(record.portrait_zoom, `${castPath}.portrait_zoom`, issues, { min: 100, max: 500, optional: true });
    validateLive2dMotionControlRecord(record, castPath, issues);
    validateLive2dDialogueMotionReadiness(record, characterId, castPath, issues, maps);
    validateLive2dCastPoseHintReference(record, characterId, castPath, issues, maps);
    validateLive2dCastMotionClipReference(record, characterId, castPath, issues, maps, live2dMotionClipKeys);
    validateLive2dCastMotionClipReference(record, characterId, castPath, issues, maps, live2dIdleMotionClipKeys);
    validateLive2dCastMotionClipReference(record, characterId, castPath, issues, maps, live2dTalkMotionClipKeys);
    validateLive2dCastMotionClipReference(record, characterId, castPath, issues, maps, live2dVisemeMotionClipKeys);
    const portraitKey = String(record.portrait || "").trim();
    if (portraitKey && !portraitKey.startsWith("res://")) {
      const validKeys = getCharacterPortraitKeys(characterId, maps);
      if (validKeys.length > 0 && !validKeys.includes(portraitKey)) {
        issues.push({ severity: "warning", message: `${castPath}.portrait가 캐릭터 portrait key에 없습니다: ${portraitKey}` });
      }
    }
  }
}

export function validateLive2dNodeMetadataDefaults(node: ResourceRecord, path: string, issues: ValidationIssue[], maps: ResourceMaps) {
  if (node.metadata === undefined || node.metadata === null || node.metadata === "") return;
  if (!isPlainRecord(node.metadata)) {
    issues.push({ severity: "warning", message: `${path}.metadata는 객체 JSON이어야 합니다.` });
    return;
  }

  const metadata = node.metadata;
  validateLive2dMotionControlRecord(metadata, `${path}.metadata`, issues);

  const speakerId = String(node.speaker || "").trim();
  if (!speakerId || speakerId === "narrator" || !maps.characters.has(speakerId)) return;
  validateLive2dDialogueMotionReadiness(metadata, speakerId, `${path}.metadata`, issues, maps);
  validateLive2dCastPoseHintReference(metadata, speakerId, `${path}.metadata`, issues, maps);
  validateLive2dCastMotionClipReference(metadata, speakerId, `${path}.metadata`, issues, maps, live2dMotionClipKeys);
  validateLive2dCastMotionClipReference(metadata, speakerId, `${path}.metadata`, issues, maps, live2dIdleMotionClipKeys);
  validateLive2dCastMotionClipReference(metadata, speakerId, `${path}.metadata`, issues, maps, live2dTalkMotionClipKeys);
  validateLive2dCastMotionClipReference(metadata, speakerId, `${path}.metadata`, issues, maps, live2dVisemeMotionClipKeys);
}

function validateLive2dMotionControlRecord(record: ResourceRecord, path: string, issues: ValidationIssue[]) {
  for (const key of live2dBooleanKeys) {
    if (record[key] !== undefined && !isBooleanLike(record[key])) {
      issues.push({ severity: "warning", message: `${path}.${key}는 boolean 값이어야 합니다.` });
    }
  }
  for (const key of ["live2d_motion_speed", "motion_speed"]) {
    validateNumberRange(record[key], `${path}.${key}`, issues, { min: 0.1, max: 4, optional: true });
  }
  for (const key of ["live2d_motion_blend_duration", "motion_blend_duration", "pose_blend_duration"]) {
    validateNumberRange(record[key], `${path}.${key}`, issues, { min: 0, max: 1, optional: true });
  }
  for (const key of ["live2d_motion_time", "motion_time", "pose_time"]) {
    validateNumberRange(record[key], `${path}.${key}`, issues, { min: 0, max: 600, optional: true });
  }
  for (const key of ["live2d_motion_progress", "motion_progress", "pose_progress"]) {
    validateNumberRange(record[key], `${path}.${key}`, issues, { min: 0, max: 1, optional: true });
  }
  for (const key of live2dPoseHintStringKeys) {
    if (record[key] !== undefined && typeof record[key] !== "string") {
      issues.push({ severity: "warning", message: `${path}.${key}는 문자열이어야 합니다.` });
    }
  }
  for (const key of live2dPoseTagsArrayKeys) {
    if (record[key] === undefined) continue;
    if (!Array.isArray(record[key]) || !(record[key] as unknown[]).every((entry) => typeof entry === "string")) {
      issues.push({ severity: "warning", message: `${path}.${key}는 문자열 배열이어야 합니다.` });
    }
  }
}

function validateLive2dCastPoseHintReference(
  record: ResourceRecord,
  characterId: string,
  castPath: string,
  issues: ValidationIssue[],
  maps: ResourceMaps
) {
  if (!maps.characters.has(characterId)) return;
  const availableTags = new Set(getCharacterLive2dPoseTags(characterId, maps).map(normalizeLive2dPoseTag).filter(Boolean));
  if (availableTags.size === 0) return;
  const requestedTags = collectLive2dPoseHintTagsFromRecord(record);
  if (requestedTags.length === 0) return;
  const expandedTags = expandLive2dPoseHintTags(requestedTags);
  if (expandedTags.some((tag) => availableTags.has(tag))) return;
  issues.push({
    severity: "warning",
    message: `${castPath}의 Live2D pose hint/tag가 캐릭터의 exported Live2D pose tag와 맞지 않습니다: ${requestedTags.slice(0, 4).join(", ")}`
  });
}

function validateLive2dCastMotionClipReference(
  record: ResourceRecord,
  characterId: string,
  castPath: string,
  issues: ValidationIssue[],
  maps: ResourceMaps,
  keys: string[]
) {
  for (const key of keys) {
    if (record[key] === undefined) continue;
    if (typeof record[key] !== "string") {
      issues.push({ severity: "warning", message: `${castPath}.${key}는 문자열이어야 합니다.` });
      return;
    }
    const clipId = String(record[key]).trim();
    if (!clipId || !maps.characters.has(characterId)) return;
    const clipIds = getCharacterLive2dMotionClipIds(characterId, maps);
    if (clipIds.length > 0 && !clipIds.includes(clipId)) {
      issues.push({ severity: "warning", message: `${castPath}.${key}를 캐릭터 Live2D motion clip에서 찾을 수 없습니다: ${clipId}` });
    }
    return;
  }
}

function validateLive2dDialogueMotionReadiness(
  record: ResourceRecord,
  characterId: string,
  path: string,
  issues: ValidationIssue[],
  maps: ResourceMaps
) {
  if (!maps.characters.has(characterId) || !recordRequestsLive2dDialogueMotion(record)) return;
  const summary = getCharacterLive2dDialogueMotionSummary(characterId, maps);
  if (Object.keys(summary).length === 0 || summary.ready === true) return;
  const missing = Array.isArray(summary.missingExportedClipIds)
    ? summary.missingExportedClipIds.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  const detail = missing.length > 0 ? ` 누락 clip: ${missing.slice(0, 4).join(", ")}` : "";
  issues.push({
    severity: "warning",
    message: `${path}.live2d_dialogue_motion은 캐릭터의 Live2D dialogue motion export가 완료된 뒤 사용하는 것을 권장합니다.${detail}`
  });
}

function recordRequestsLive2dDialogueMotion(record: ResourceRecord) {
  for (const key of ["live2d_dialogue_motion", "live2d_auto_dialogue_motion", "dialogue_motion", "auto_dialogue_motion"]) {
    if (record[key] !== undefined && isTrueLike(record[key])) return true;
  }
  return false;
}

export function validateFocusTargets(node: ResourceRecord, path: string, issues: ValidationIssue[], maps: ResourceMaps) {
  const rawValue = node.focus_targets ?? node.focus_characters ?? node.spotlight_targets ?? node.attention_targets ?? node.camera_focus_targets;
  if (rawValue === undefined) return;
  if (!Array.isArray(rawValue) && typeof rawValue !== "string") {
    issues.push({ severity: "warning", message: `${path}.focus_targets는 캐릭터 ID 배열이어야 합니다.` });
    return;
  }
  for (const characterId of normalizeFocusTargetIds(rawValue)) {
    if (characterId !== "mystery" && !maps.characters.has(characterId)) {
      issues.push({ severity: "warning", message: `${path}.focus_targets에 없는 캐릭터가 있습니다: ${characterId}` });
    }
  }
}

export function validateStageEventTimeline(nodes: ResourceRecord[], path: string, issues: ValidationIssue[], maps: ResourceMaps) {
  const visible = new Set<string>();
  nodes.forEach((node, index) => {
    if (isCutsceneValidationNode(node)) return;

    const nodePath = `${path}[${index}]`;
    const stageCastPortraitIds = getStageCastPortraitIds(node, maps);
    const events = extractStageTextEvents(String(node.text || ""));
    const delayedEnterIds = new Set(events.filter((event) => event.tag === "enter").flatMap((event) => event.ids));

    for (const characterId of stageCastPortraitIds) {
      if (!visible.has(characterId) && !delayedEnterIds.has(characterId)) {
        visible.add(characterId);
      }
    }

    const exitIds = new Set<string>();
    for (const event of events) {
      for (const characterId of event.ids) {
        if (event.tag === "enter") {
          if (!stageCastPortraitIds.has(characterId)) {
            issues.push({ severity: "warning", message: `${nodePath}: [enter] 대상은 같은 노드의 stage_cast 초상이 필요합니다: ${characterId}` });
          }
          if (visible.has(characterId)) {
            issues.push({ severity: "warning", message: `${nodePath}: 이미 무대에 있는 캐릭터를 다시 [enter]합니다: ${characterId}` });
          }
          if (exitIds.has(characterId)) {
            issues.push({ severity: "warning", message: `${nodePath}: 같은 노드에서 [exit] 뒤에 [enter]가 있습니다: ${characterId}` });
          }
          if (stageCastPortraitIds.has(characterId)) visible.add(characterId);
          continue;
        }

        if (!visible.has(characterId)) {
          issues.push({ severity: "warning", message: `${nodePath}: 무대에 없는 캐릭터를 [exit]합니다: ${characterId}` });
        }
        exitIds.add(characterId);
      }
    }

    for (const characterId of exitIds) visible.delete(characterId);
  });
}

export function validateTextSoundMutedAliases(node: ResourceRecord, path: string, issues: ValidationIssue[]) {
  const metadata = isPlainRecord(node.metadata) ? node.metadata : {};
  for (const key of textSoundMutedKeys) {
    if (node[key] !== undefined && !isBooleanLike(node[key])) {
      issues.push({ severity: "warning", message: `${path}.${key}는 boolean 값이어야 합니다.` });
    }
    if (metadata[key] !== undefined && !isBooleanLike(metadata[key])) {
      issues.push({ severity: "warning", message: `${path}.metadata.${key}는 boolean 값이어야 합니다.` });
    }
  }
}

function resolveNodeId(node: ResourceRecord, index: number, autoPrefix: string) {
  const raw = String(node.id || "").trim();
  return raw || `${autoPrefix}${index}`;
}

function normalizeFocusTargetIds(value: unknown) {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\s,;]+/)
      : [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const raw of source) {
    const id = String(raw || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function isBooleanLike(value: unknown) {
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return value === 0 || value === 1;
  if (typeof value === "string") return ["true", "false", "1", "0", "yes", "no", "on", "off"].includes(value.trim().toLowerCase());
  return false;
}

function isTrueLike(value: unknown) {
  if (value === true || value === 1) return true;
  if (typeof value === "string") return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
  return false;
}

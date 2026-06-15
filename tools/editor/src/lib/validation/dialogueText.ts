import type { ResourceRecord, ValidationIssue } from "../../types";
import {
  appendPortraitRigPoseTags,
  expandPortraitRigPoseHintTags,
  portraitRigTextPoseTagKeys,
  normalizePortraitRigPoseTag
} from "../portraitRigPoseTags";
import type { ResourceMaps } from "./shared";
import { getCharacterPortraitRigMotionClipIds, getCharacterPortraitRigPoseTags, getCharacterPortraitKeys, isPlainRecord, validateNumberRange } from "./shared";

export function scanDialogueText(
  text: string,
  path: string,
  issues: ValidationIssue[],
  maps: ResourceMaps,
  options: { defaultSpeakerId?: string } = {}
) {
  const eventTagPattern = /\[(bgm|sfx|se|bg)\s+([^\]]+)\]/gi;
  let match: RegExpExecArray | null;
  while ((match = eventTagPattern.exec(text))) {
    const tag = match[1].toLowerCase();
    const attrs = match[2];
    const idMatch = attrs.match(/\bid\s*=\s*"([^"]+)"/i);
    if (!idMatch) continue;

    const assetId = idMatch[1];
    if (!maps.story_assets.has(assetId)) {
      issues.push({ severity: "warning", message: `${path}: [${tag}] 태그의 에셋 ID를 찾을 수 없습니다: ${assetId}` });
    }
  }

  for (const event of extractStageTextEvents(text)) {
    if (event.ids.length === 0) {
      issues.push({ severity: "warning", message: `${path}: [${event.tag}] 태그에는 id가 필요합니다.` });
      continue;
    }
    for (const characterId of event.ids) {
      if (!maps.characters.has(characterId)) {
        issues.push({ severity: "warning", message: `${path}: [${event.tag}] 태그의 캐릭터 ID를 찾을 수 없습니다: ${characterId}` });
      }
    }
  }

  for (const event of extractPortraitRigTextEvents(text)) {
    validatePortraitRigTextEvent(event, path, issues, maps, options.defaultSpeakerId);
  }
}

export function extractStageTextEvents(text: string) {
  const events: Array<{ tag: "enter" | "exit"; ids: string[] }> = [];
  const pattern = /\[(enter|exit)(?:\s+([^\]]*))?\]/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    events.push({
      tag: match[1].toLowerCase() as "enter" | "exit",
      ids: extractStageEventIds(match[2] || "")
    });
  }
  return events;
}

function extractStageEventIds(attrs: string) {
  const ids: string[] = [];
  const parsed = parseDialogueEventAttributes(attrs);
  for (const key of eventTargetKeys) {
    appendEventIds(ids, parsed[key]);
  }
  return ids;
}

type PortraitRigTextEvent = {
  tag: "portraitRig" | "portrait_rig_pose" | "portrait_rig_motion";
  attrs: Record<string, string | boolean>;
};

const eventTargetKeys = ["id", "ids", "character", "characters", "character_id", "character_ids", "speaker", "speaker_id", "target", "targets"];

function extractPortraitRigTextEvents(text: string) {
  const events: PortraitRigTextEvent[] = [];
  const pattern = /\[(portrait_rig_motion|portrait_rig_pose|portraitRig)([^\]]*)\]/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    events.push({
      tag: match[1].toLowerCase() as PortraitRigTextEvent["tag"],
      attrs: parseDialogueEventAttributes(match[2] || "")
    });
  }
  return events;
}

function validatePortraitRigTextEvent(
  event: PortraitRigTextEvent,
  path: string,
  issues: ValidationIssue[],
  maps: ResourceMaps,
  defaultSpeakerId = ""
) {
  const targetIds = portraitRigEventTargetIds(event, defaultSpeakerId);
  if (targetIds.length === 0) {
    issues.push({ severity: "warning", message: `${path}: [${event.tag}] 태그는 speaker가 없으면 id 또는 target이 필요합니다.` });
  }
  for (const characterId of targetIds) {
    if (!maps.characters.has(characterId)) {
      issues.push({ severity: "warning", message: `${path}: [${event.tag}] 태그의 캐릭터 ID를 찾을 수 없습니다: ${characterId}` });
    }
  }

  const motionClips = portraitRigEventMotionClips(event);
  for (const motionClip of motionClips) {
    for (const characterId of targetIds) {
      if (!maps.characters.has(characterId)) continue;
      const clipIds = getCharacterPortraitRigMotionClipIds(characterId, maps);
      if (clipIds.length > 0 && !clipIds.includes(motionClip)) {
        issues.push({ severity: "warning", message: `${path}: [${event.tag}] motion clip을 캐릭터에서 찾을 수 없습니다: ${characterId}.${motionClip}` });
      }
    }
  }

  const poseTags = portraitRigEventPoseTags(event);
  if (poseTags.length > 0) {
    for (const characterId of targetIds) {
      if (!maps.characters.has(characterId)) continue;
      const availableTags = new Set(getCharacterPortraitRigPoseTags(characterId, maps).map(normalizePortraitRigPoseTag).filter(Boolean));
      if (availableTags.size === 0) continue;
      const expandedTags = expandPortraitRigPoseHintTags(poseTags);
      if (expandedTags.some((tag) => availableTags.has(tag))) continue;
      issues.push({ severity: "warning", message: `${path}: [${event.tag}] pose tag가 캐릭터 Portrait Rig export와 맞지 않습니다: ${characterId}.${poseTags.slice(0, 4).join(",")}` });
    }
  }

  const portraitKey = firstEventString(event.attrs, ["portrait", "portrait_key", "state", "pose_state"]);
  if (portraitKey && !portraitKey.startsWith("res://")) {
    for (const characterId of targetIds) {
      if (!maps.characters.has(characterId)) continue;
      const portraitKeys = getCharacterPortraitKeys(characterId, maps);
      if (portraitKeys.length > 0 && !portraitKeys.includes(portraitKey)) {
        issues.push({ severity: "warning", message: `${path}: [${event.tag}] portrait가 캐릭터 portrait key에 없습니다: ${characterId}.${portraitKey}` });
      }
    }
  }

  for (const key of ["time", "motion_time", "pose_time", "portrait_rig_motion_time"]) {
    validateNumberRange(event.attrs[key], `${path}.[${event.tag}].${key}`, issues, { min: 0, max: 600, optional: true });
  }
  for (const key of ["progress", "motion_progress", "pose_progress", "portrait_rig_motion_progress"]) {
    validateNumberRange(event.attrs[key], `${path}.[${event.tag}].${key}`, issues, { min: 0, max: 1, optional: true });
  }
  for (const key of ["speed", "motion_speed", "portrait_rig_motion_speed"]) {
    validateNumberRange(event.attrs[key], `${path}.[${event.tag}].${key}`, issues, { min: 0.1, max: 4, optional: true });
  }
  for (const key of ["blend", "blend_duration", "motion_blend", "motion_blend_duration", "portrait_rig_motion_blend", "portrait_rig_motion_blend_duration", "pose_blend_duration", "portrait_rig_pose_blend_duration"]) {
    validateNumberRange(event.attrs[key], `${path}.[${event.tag}].${key}`, issues, { min: 0, max: 1, optional: true });
  }
  for (const key of ["animation_speed", "transition_speed"]) {
    validateNumberRange(event.attrs[key], `${path}.[${event.tag}].${key}`, issues, { min: 0.5, max: 2, optional: true });
  }
  for (const key of [
    "loop",
    "motion_loop",
    "play",
    "motion_play",
    "portrait_rig_motion_loop",
    "portrait_rig_motion_play",
    "portrait_rig_motion_autoplay",
    "portrait_rig_loop",
    "dialogue_motion",
    "auto_dialogue_motion",
    "portrait_rig_dialogue_motion",
    "portrait_rig_auto_dialogue_motion"
  ]) {
    if (event.attrs[key] !== undefined && !isBooleanLikeEventValue(event.attrs[key])) {
      issues.push({ severity: "warning", message: `${path}.[${event.tag}].${key}는 boolean 값이어야 합니다.` });
    }
  }
}

function portraitRigEventTargetIds(event: PortraitRigTextEvent, defaultSpeakerId: string) {
  const ids: string[] = [];
  for (const key of eventTargetKeys) {
    appendEventIds(ids, event.attrs[key]);
  }
  const fallback = String(defaultSpeakerId || "").trim();
  if (ids.length === 0 && fallback && fallback !== "narrator") ids.push(fallback);
  return ids;
}

function portraitRigEventMotionClips(event: PortraitRigTextEvent) {
  const clips: string[] = [];
  const append = (value: string) => {
    if (value && !clips.includes(value)) clips.push(value);
  };
  append(firstEventString(event.attrs, ["clip", "clip_id", "motion", "motion_clip", "portrait_rig_motion_clip"]));
  append(firstEventString(event.attrs, ["idle_clip", "idle_motion_clip", "portrait_rig_idle_motion_clip"]));
  append(firstEventString(event.attrs, ["talk_clip", "talk_motion_clip", "portrait_rig_talk_motion_clip"]));
  append(firstEventString(event.attrs, ["viseme_clip", "viseme_motion_clip", "portrait_rig_viseme_motion_clip"]));
  const shorthand = firstEventString(event.attrs, ["value", "path"]);
  if (event.tag === "portrait_rig_motion" && shorthand && !looksLikeResourcePath(shorthand)) append(shorthand);
  return clips;
}

function portraitRigEventPoseTags(event: PortraitRigTextEvent) {
  const tags: string[] = [];
  for (const key of portraitRigTextPoseTagKeys) {
    appendPortraitRigPoseTags(tags, event.attrs[key]);
  }
  if (event.tag !== "portrait_rig_motion") {
    appendPortraitRigPoseTags(tags, event.attrs.value);
  }
  return tags;
}

function parseDialogueEventAttributes(source: string) {
  const attrs: Record<string, string | boolean> = {};
  const text = String(source || "").trim();
  if (!text) return attrs;
  if (text.startsWith("=")) {
    attrs.value = unquoteEventValue(text.slice(1));
    return attrs;
  }
  for (const token of tokenizeDialogueEventAttributes(text)) {
    const separatorIndex = token.indexOf("=");
    if (separatorIndex >= 0) {
      const key = token.slice(0, separatorIndex).trim().toLowerCase();
      if (key) attrs[key] = unquoteEventValue(token.slice(separatorIndex + 1));
      continue;
    }
    const clean = unquoteEventValue(token);
    if (clean) attrs[clean.toLowerCase()] = true;
  }
  return attrs;
}

function tokenizeDialogueEventAttributes(text: string) {
  const tokens: string[] = [];
  let current = "";
  let quote = "";
  for (const character of text) {
    if (quote) {
      current += character;
      if (character === quote) quote = "";
      continue;
    }
    if (character === "\"" || character === "'") {
      quote = character;
      current += character;
      continue;
    }
    if (/\s/.test(character)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += character;
  }
  if (current) tokens.push(current);
  return tokens;
}

function unquoteEventValue(value: unknown) {
  const clean = String(value ?? "").trim();
  if (clean.length >= 2) {
    const first = clean[0];
    const last = clean[clean.length - 1];
    if ((first === "\"" && last === "\"") || (first === "'" && last === "'")) {
      return clean.slice(1, -1);
    }
  }
  return clean;
}

function appendEventIds(ids: string[], value: unknown) {
  if (typeof value === "boolean") return;
  for (const rawId of String(value ?? "").split(/[\s,;]+/)) {
    const id = rawId.trim();
    if (id && !ids.includes(id)) ids.push(id);
  }
}

function firstEventString(attrs: Record<string, string | boolean>, keys: string[]) {
  for (const key of keys) {
    const value = attrs[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function looksLikeResourcePath(value: string) {
  return value.startsWith("res://") || value.startsWith("user://") || value.startsWith("/");
}

function isBooleanLikeEventValue(value: unknown) {
  if (typeof value === "boolean") return true;
  const text = String(value ?? "").trim().toLowerCase();
  return ["true", "false", "1", "0", "yes", "no", "on", "off"].includes(text);
}

export function getStageCastPortraitIds(node: ResourceRecord, maps?: ResourceMaps) {
  const ids = new Set<string>();
  if (!isPlainRecord(node.stage_cast)) return ids;
  for (const [characterId, rawEntry] of Object.entries(node.stage_cast)) {
    if (characterId === "mystery" || !isPlainRecord(rawEntry)) continue;
    if (String(rawEntry.portrait || "").trim() || stageCastEntryCanResolvePortraitRigPortrait(characterId, rawEntry, maps)) {
      ids.add(characterId);
    }
  }
  return ids;
}

function stageCastEntryCanResolvePortraitRigPortrait(characterId: string, entry: ResourceRecord, maps?: ResourceMaps) {
  if (portraitRigAdaptivePoseDisabled(entry)) return false;
  if (hasAnyPortraitRigStageCastControl(entry)) return true;
  if (!maps) return false;
  return (
    getCharacterPortraitRigMotionClipIds(characterId, maps).length > 0
    || getCharacterPortraitRigPoseTags(characterId, maps).length > 0
  );
}

function portraitRigAdaptivePoseDisabled(entry: ResourceRecord) {
  for (const key of ["adaptive_portrait_rig_pose", "portrait_rig_auto_pose", "adaptive_pose", "auto_pose"]) {
    if (entry[key] === undefined || entry[key] === null || entry[key] === "") continue;
    if (typeof entry[key] === "boolean") return !entry[key];
    if (["false", "0", "no", "off"].includes(String(entry[key]).trim().toLowerCase())) return true;
    return false;
  }
  return false;
}

function hasAnyPortraitRigStageCastControl(entry: ResourceRecord) {
  return [
    "portrait_rig_motion_loop",
    "portrait_rig_motion_play",
    "portrait_rig_motion_autoplay",
    "portrait_rig_loop",
    "motion_loop",
    "motion_play",
    "portrait_rig_dialogue_motion",
    "portrait_rig_auto_dialogue_motion",
    "dialogue_motion",
    "auto_dialogue_motion",
    "portrait_rig_motion_clip",
    "motion_clip",
    "clip_id",
    "portrait_rig_motion_time",
    "motion_time",
    "pose_time",
    "portrait_rig_motion_progress",
    "motion_progress",
    "pose_progress",
    "portrait_rig_motion_speed",
    "motion_speed",
    "portrait_rig_motion_blend_duration",
    "motion_blend_duration",
    "pose_blend_duration",
    "portrait_rig_idle_motion_clip",
    "idle_motion_clip",
    "idle_clip",
    "portrait_rig_talk_motion_clip",
    "talk_motion_clip",
    "talk_clip",
    "portrait_rig_viseme_motion_clip",
    "viseme_motion_clip",
    "viseme_clip",
    "portrait_rig_pose_hint",
    "pose_hint",
    "portrait_rig_pose_tag",
    "pose_tag",
    "portrait_rig_pose_tags",
    "pose_tags",
    "emotion",
    "mood",
    "tone",
    "expression"
  ].some((key) => entry[key] !== undefined && entry[key] !== null && entry[key] !== "");
}

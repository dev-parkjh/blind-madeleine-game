import type { ResourceRecord, ValidationIssue } from "../../types";
import {
  appendLive2dPoseTags,
  expandLive2dPoseHintTags,
  live2dTextPoseTagKeys,
  normalizeLive2dPoseTag
} from "../live2dPoseTags";
import type { ResourceMaps } from "./shared";
import { getCharacterLive2dMotionClipIds, getCharacterLive2dPoseTags, getCharacterPortraitKeys, isPlainRecord, validateNumberRange } from "./shared";

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

  for (const event of extractLive2dTextEvents(text)) {
    validateLive2dTextEvent(event, path, issues, maps, options.defaultSpeakerId);
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

type Live2dTextEvent = {
  tag: "live2d" | "live2d_pose" | "live2d_motion";
  attrs: Record<string, string | boolean>;
};

const eventTargetKeys = ["id", "ids", "character", "characters", "character_id", "character_ids", "speaker", "speaker_id", "target", "targets"];

function extractLive2dTextEvents(text: string) {
  const events: Live2dTextEvent[] = [];
  const pattern = /\[(live2d_motion|live2d_pose|live2d)([^\]]*)\]/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    events.push({
      tag: match[1].toLowerCase() as Live2dTextEvent["tag"],
      attrs: parseDialogueEventAttributes(match[2] || "")
    });
  }
  return events;
}

function validateLive2dTextEvent(
  event: Live2dTextEvent,
  path: string,
  issues: ValidationIssue[],
  maps: ResourceMaps,
  defaultSpeakerId = ""
) {
  const targetIds = live2dEventTargetIds(event, defaultSpeakerId);
  if (targetIds.length === 0) {
    issues.push({ severity: "warning", message: `${path}: [${event.tag}] 태그는 speaker가 없으면 id 또는 target이 필요합니다.` });
  }
  for (const characterId of targetIds) {
    if (!maps.characters.has(characterId)) {
      issues.push({ severity: "warning", message: `${path}: [${event.tag}] 태그의 캐릭터 ID를 찾을 수 없습니다: ${characterId}` });
    }
  }

  const motionClips = live2dEventMotionClips(event);
  for (const motionClip of motionClips) {
    for (const characterId of targetIds) {
      if (!maps.characters.has(characterId)) continue;
      const clipIds = getCharacterLive2dMotionClipIds(characterId, maps);
      if (clipIds.length > 0 && !clipIds.includes(motionClip)) {
        issues.push({ severity: "warning", message: `${path}: [${event.tag}] motion clip을 캐릭터에서 찾을 수 없습니다: ${characterId}.${motionClip}` });
      }
    }
  }

  const poseTags = live2dEventPoseTags(event);
  if (poseTags.length > 0) {
    for (const characterId of targetIds) {
      if (!maps.characters.has(characterId)) continue;
      const availableTags = new Set(getCharacterLive2dPoseTags(characterId, maps).map(normalizeLive2dPoseTag).filter(Boolean));
      if (availableTags.size === 0) continue;
      const expandedTags = expandLive2dPoseHintTags(poseTags);
      if (expandedTags.some((tag) => availableTags.has(tag))) continue;
      issues.push({ severity: "warning", message: `${path}: [${event.tag}] pose tag가 캐릭터 Live2D export와 맞지 않습니다: ${characterId}.${poseTags.slice(0, 4).join(",")}` });
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

  for (const key of ["time", "motion_time", "pose_time", "live2d_motion_time"]) {
    validateNumberRange(event.attrs[key], `${path}.[${event.tag}].${key}`, issues, { min: 0, max: 600, optional: true });
  }
  for (const key of ["progress", "motion_progress", "pose_progress", "live2d_motion_progress"]) {
    validateNumberRange(event.attrs[key], `${path}.[${event.tag}].${key}`, issues, { min: 0, max: 1, optional: true });
  }
  for (const key of ["speed", "motion_speed", "live2d_motion_speed"]) {
    validateNumberRange(event.attrs[key], `${path}.[${event.tag}].${key}`, issues, { min: 0.1, max: 4, optional: true });
  }
  for (const key of ["blend", "blend_duration", "motion_blend", "motion_blend_duration", "live2d_motion_blend", "live2d_motion_blend_duration", "pose_blend_duration", "live2d_pose_blend_duration"]) {
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
    "live2d_motion_loop",
    "live2d_motion_play",
    "live2d_motion_autoplay",
    "live2d_loop",
    "dialogue_motion",
    "auto_dialogue_motion",
    "live2d_dialogue_motion",
    "live2d_auto_dialogue_motion"
  ]) {
    if (event.attrs[key] !== undefined && !isBooleanLikeEventValue(event.attrs[key])) {
      issues.push({ severity: "warning", message: `${path}.[${event.tag}].${key}는 boolean 값이어야 합니다.` });
    }
  }
}

function live2dEventTargetIds(event: Live2dTextEvent, defaultSpeakerId: string) {
  const ids: string[] = [];
  for (const key of eventTargetKeys) {
    appendEventIds(ids, event.attrs[key]);
  }
  const fallback = String(defaultSpeakerId || "").trim();
  if (ids.length === 0 && fallback && fallback !== "narrator") ids.push(fallback);
  return ids;
}

function live2dEventMotionClips(event: Live2dTextEvent) {
  const clips: string[] = [];
  const append = (value: string) => {
    if (value && !clips.includes(value)) clips.push(value);
  };
  append(firstEventString(event.attrs, ["clip", "clip_id", "motion", "motion_clip", "live2d_motion_clip"]));
  append(firstEventString(event.attrs, ["idle_clip", "idle_motion_clip", "live2d_idle_motion_clip"]));
  append(firstEventString(event.attrs, ["talk_clip", "talk_motion_clip", "live2d_talk_motion_clip"]));
  append(firstEventString(event.attrs, ["viseme_clip", "viseme_motion_clip", "live2d_viseme_motion_clip"]));
  const shorthand = firstEventString(event.attrs, ["value", "path"]);
  if (event.tag === "live2d_motion" && shorthand && !looksLikeResourcePath(shorthand)) append(shorthand);
  return clips;
}

function live2dEventPoseTags(event: Live2dTextEvent) {
  const tags: string[] = [];
  for (const key of live2dTextPoseTagKeys) {
    appendLive2dPoseTags(tags, event.attrs[key]);
  }
  if (event.tag !== "live2d_motion") {
    appendLive2dPoseTags(tags, event.attrs.value);
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
    if (String(rawEntry.portrait || "").trim() || stageCastEntryCanResolveLive2dPortrait(characterId, rawEntry, maps)) {
      ids.add(characterId);
    }
  }
  return ids;
}

function stageCastEntryCanResolveLive2dPortrait(characterId: string, entry: ResourceRecord, maps?: ResourceMaps) {
  if (live2dAdaptivePoseDisabled(entry)) return false;
  if (hasAnyLive2dStageCastControl(entry)) return true;
  if (!maps) return false;
  return (
    getCharacterLive2dMotionClipIds(characterId, maps).length > 0
    || getCharacterLive2dPoseTags(characterId, maps).length > 0
  );
}

function live2dAdaptivePoseDisabled(entry: ResourceRecord) {
  for (const key of ["adaptive_live2d_pose", "live2d_auto_pose", "adaptive_pose", "auto_pose"]) {
    if (entry[key] === undefined || entry[key] === null || entry[key] === "") continue;
    if (typeof entry[key] === "boolean") return !entry[key];
    if (["false", "0", "no", "off"].includes(String(entry[key]).trim().toLowerCase())) return true;
    return false;
  }
  return false;
}

function hasAnyLive2dStageCastControl(entry: ResourceRecord) {
  return [
    "live2d_motion_loop",
    "live2d_motion_play",
    "live2d_motion_autoplay",
    "live2d_loop",
    "motion_loop",
    "motion_play",
    "live2d_dialogue_motion",
    "live2d_auto_dialogue_motion",
    "dialogue_motion",
    "auto_dialogue_motion",
    "live2d_motion_clip",
    "motion_clip",
    "clip_id",
    "live2d_motion_time",
    "motion_time",
    "pose_time",
    "live2d_motion_progress",
    "motion_progress",
    "pose_progress",
    "live2d_motion_speed",
    "motion_speed",
    "live2d_motion_blend_duration",
    "motion_blend_duration",
    "pose_blend_duration",
    "live2d_idle_motion_clip",
    "idle_motion_clip",
    "idle_clip",
    "live2d_talk_motion_clip",
    "talk_motion_clip",
    "talk_clip",
    "live2d_viseme_motion_clip",
    "viseme_motion_clip",
    "viseme_clip",
    "live2d_pose_hint",
    "pose_hint",
    "live2d_pose_tag",
    "pose_tag",
    "live2d_pose_tags",
    "pose_tags",
    "emotion",
    "mood",
    "tone",
    "expression"
  ].some((key) => entry[key] !== undefined && entry[key] !== null && entry[key] !== "");
}

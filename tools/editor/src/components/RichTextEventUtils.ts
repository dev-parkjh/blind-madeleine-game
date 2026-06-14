import type { ReferenceResources } from "../editorTypes";
import type { ResourceSummary } from "../types";
import type { BbcodeAttributes } from "./RichTextPreviewParser";

export function formatEventAttrSummary(tagName: string, attrs: BbcodeAttributes, references?: ReferenceResources) {
  const targetLabel = resolveEventTargetLabel(tagName, attrs, references);
  if (targetLabel) return targetLabel;

  for (const key of ["hint", "pose", "emotion", "clip", "clip_id", "motion_clip", "idle_clip", "talk_clip", "viseme_clip", "time", "progress", "path", "value", "delay", "volume", "volume_db", "fade", "transition"]) {
    const value = attrs[key];
    if (typeof value === "string" && value.trim()) {
      return compactPreviewNote(value);
    }
  }
  return "";
}

export function getEventTargetIds(attrs: BbcodeAttributes) {
  const ids: string[] = [];
  for (const key of ["id", "ids", "asset", "asset_id", "story_asset", "character", "characters", "character_id", "character_ids", "speaker", "speaker_id", "target", "targets"]) {
    const value = attrs[key];
    if (typeof value !== "string" || !value.trim()) continue;
    for (const id of value.split(/[\s,;]+/).map((entry) => entry.trim()).filter(Boolean)) {
      if (!ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}

export function eventTagLabel(tagName: string) {
  return {
    sfx: "SFX",
    sound: "SFX",
    se: "SFX",
    bgm: "BGM",
    music: "BGM",
    bgm_stop: "BGM stop",
    music_stop: "BGM stop",
    bgm_volume: "BGM vol",
    music_volume: "BGM vol",
    bg: "BG",
    background: "BG",
    bg_clear: "BG clear",
    background_clear: "BG clear",
    bg_remove: "BG clear",
    background_remove: "BG clear",
    auto_next: "AUTO",
    auto_advance: "AUTO",
    advance: "AUTO",
    enter: "ENTER",
    exit: "EXIT",
    live2d: "L2D",
    live2d_pose: "L2D pose",
    live2d_motion: "L2D motion"
  }[tagName] || tagName.toUpperCase();
}

function resolveEventTargetLabel(tagName: string, attrs: BbcodeAttributes, references?: ReferenceResources) {
  const normalizedTag = tagName.toLowerCase();
  const ids = getEventTargetIds(attrs);
  if (ids.length === 0) return "";

  const resourceType = eventTargetResourceType(normalizedTag);
  const labels = ids.map((id) => {
    if (resourceType === "characters") return resolveReferenceLabel(references?.characters, id);
    if (resourceType === "storyAssets") return resolveReferenceLabel(references?.storyAssets, id);
    return shortId(id);
  }).filter(Boolean);
  return compactPreviewNote(labels.join(", "));
}

function eventTargetResourceType(tagName: string) {
  if (["enter", "exit", "live2d", "live2d_pose", "live2d_motion"].includes(tagName)) return "characters";
  if (["sfx", "sound", "se", "bgm", "music", "bgm_stop", "music_stop", "bgm_volume", "music_volume", "bg", "background"].includes(tagName)) return "storyAssets";
  return "";
}

function resolveReferenceLabel(resources: ResourceSummary[] | undefined, id: string) {
  const summary = resources?.find((entry) => entry.id === id);
  return summary?.title || shortId(id);
}

function shortId(id: string) {
  return id.length > 18 ? `${id.slice(0, 8)}...${id.slice(-6)}` : id;
}

function compactPreviewNote(value: string) {
  const clean = value.trim();
  return clean.length > 28 ? `${clean.slice(0, 27)}…` : clean;
}

import type { ProjectSummary, ResourceRecord, ResourceSummary, ResourceType, ValidationIssue } from "../../types";

export type ResourceMaps = {
  characters: Map<string, ResourceSummary>;
  chapters: Map<string, ResourceSummary>;
  dialogues: Map<string, ResourceSummary>;
  items: Map<string, ResourceSummary>;
  story_assets: Map<string, ResourceSummary>;
};

export type NodeValidationContext = {
  idSet: Set<string>;
  locationIds?: Set<string>;
  listName: "nodes" | "statement" | "reaction" | "choice";
  nodeIndex: number;
  autoPrefix: string;
};

export const imagePathExtensions = new Set(["png", "jpg", "jpeg", "webp", "gif"]);
export const audioPathExtensions = new Set(["mp3", "ogg", "opus", "wav", "m4a", "aac", "flac", "webm"]);
export const resourceIdPattern = /^[a-zA-Z0-9_-]+$/;
export const topicIdPattern = /^[a-zA-Z0-9_.:-]+$/;
export const storyConditionKinds = new Set([
  "flag",
  "not_flag",
  "item",
  "not_item",
  "character",
  "not_character",
  "topic_heard",
  "topic_unheard",
  "node_seen",
  "node_unseen",
  "dialogue_seen",
  "dialogue_unseen"
]);
export const popupSources = new Set(["character_profile", "item", "image"]);
export const textSoundMutedKeys = ["text_sound_muted", "typewriter_sound_muted", "dialogue_text_sound_muted"];
export const popupSourceAliases: Record<string, string> = {
  character: "character_profile",
  profile: "character_profile",
  portrait_profile: "character_profile",
  item_image: "item",
  path: "image",
  direct: "image"
};
export const popupPositions = new Set(["left", "center", "right", "top_left", "top_right", "custom"]);
export const stageCastPositions = new Set(["far_left", "left", "center", "right", "far_right", "custom"]);
export const popupTransitions = new Set(["fade", "pop", "slide", "none"]);
export const popupImageModes = new Set(["fit", "cover", "crop"]);
export const dialogueCameraZoomKeys = ["camera_zoom_percent", "focus_zoom_percent", "dialogue_zoom_percent"];

export function buildMaps(summary: ProjectSummary | null): ResourceMaps {
  const make = (type: ResourceType) => new Map((summary?.resources[type]?.resources || []).map((entry) => [entry.id, entry]));
  return {
    characters: make("characters"),
    chapters: make("chapters"),
    dialogues: make("dialogues"),
    items: make("items"),
    story_assets: make("story_assets")
  };
}

export function getSummaryValidation(summary: ResourceSummary | undefined): ResourceRecord {
  return summary?.validation && typeof summary.validation === "object" && !Array.isArray(summary.validation)
    ? summary.validation
    : {};
}

export function getCharacterPortraitKeys(characterId: string, maps: ResourceMaps) {
  return asArray(getSummaryValidation(maps.characters.get(characterId)).portraitKeys).map(String);
}

export function getCharacterPortraitRigMotionClipIds(characterId: string, maps: ResourceMaps) {
  return asArray(getSummaryValidation(maps.characters.get(characterId)).portraitRigMotionClipIds).map(String);
}

export function getCharacterPortraitRigPoseTags(characterId: string, maps: ResourceMaps) {
  return asArray(getSummaryValidation(maps.characters.get(characterId)).portraitRigPoseTags).map(String);
}

export function getCharacterPortraitRigDialogueMotionSummary(characterId: string, maps: ResourceMaps): ResourceRecord {
  const value = getSummaryValidation(maps.characters.get(characterId)).portraitRigDialogueMotion;
  return isPlainRecord(value) ? value : {};
}

export function characterIsProtagonist(characterId: string, maps: ResourceMaps) {
  return Boolean(maps.characters.get(characterId)?.isProtagonist);
}

export function validateChapterScope(value: unknown, issues: ValidationIssue[], maps: ResourceMaps) {
  for (const chapterId of normalizeIdList(value)) {
    if (!maps.chapters.has(String(chapterId))) {
      issues.push({ severity: "warning", message: `chapters에 없는 챕터 ID가 있습니다: ${chapterId}` });
    }
  }
}

export function getResourceChapterScopeValidationValue(data: ResourceRecord) {
  const metadata = isPlainRecord(data.metadata) ? data.metadata : {};
  return data.chapters ?? data.chapter_ids ?? metadata.chapters ?? metadata.chapter_ids;
}

export function normalizeSingleId(value: unknown) {
  return String(value || "").trim();
}

export function normalizeIdList(value: unknown) {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? [value]
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

export function validatePointArray(
  value: unknown,
  label: string,
  issues: ValidationIssue[],
  options: { length: number; min?: number; max?: number; optional?: boolean }
) {
  if (value === undefined || value === null || value === "") {
    if (!options.optional) issues.push({ severity: "warning", message: `${label}가 비어 있습니다.` });
    return;
  }
  if (!Array.isArray(value) || value.length < options.length) {
    issues.push({ severity: "warning", message: `${label}는 ${options.length}개 숫자 배열이어야 합니다.` });
    return;
  }
  value.slice(0, options.length).forEach((entry, index) => {
    validateNumberRange(entry, `${label}[${index}]`, issues, { min: options.min, max: options.max });
  });
}

export function validateVector2(
  value: unknown,
  label: string,
  issues: ValidationIssue[],
  options: {
    min?: number;
    max?: number;
    optional?: boolean;
    objectKeys?: [[string, string?], [string, string?]];
  } = {}
) {
  if (value === undefined || value === null || value === "") {
    if (!options.optional) issues.push({ severity: "warning", message: `${label}가 비어 있습니다.` });
    return;
  }

  const objectKeys = options.objectKeys || [["x"], ["y"]];
  let entries: unknown[] | null = null;
  if (Array.isArray(value)) {
    if (value.length < 2) {
      issues.push({ severity: "warning", message: `${label}는 2개 숫자 배열이어야 합니다.` });
      return;
    }
    entries = [value[0], value[1]];
  } else if (isPlainRecord(value)) {
    entries = objectKeys.map(([primary, fallback], index) => (
      value[primary] ?? (fallback ? value[fallback] : undefined) ?? value[index]
    ));
  }

  if (!entries) {
    issues.push({ severity: "warning", message: `${label}는 2개 숫자 배열 또는 객체여야 합니다.` });
    return;
  }

  entries.forEach((entry, index) => {
    validateNumberRange(entry, `${label}[${index}]`, issues, { min: options.min, max: options.max });
  });
}

export function validateNumberRange(
  value: unknown,
  label: string,
  issues: ValidationIssue[],
  options: { min?: number; max?: number; optional?: boolean } = {}
) {
  if (value === undefined || value === null || value === "") {
    if (!options.optional) issues.push({ severity: "warning", message: `${label}가 비어 있습니다.` });
    return;
  }
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    issues.push({ severity: "warning", message: `${label}는 숫자여야 합니다.` });
    return;
  }
  if (options.min !== undefined && numberValue < options.min) {
    issues.push({ severity: "warning", message: `${label}는 ${options.min} 이상이어야 합니다.` });
  }
  if (options.max !== undefined && numberValue > options.max) {
    issues.push({ severity: "warning", message: `${label}는 ${options.max} 이하여야 합니다.` });
  }
}

export function validateResPath(value: unknown, label: string, issues: ValidationIssue[], required: boolean) {
  const text = String(value || "").trim();
  if (!text) {
    if (required) issues.push({ severity: "warning", message: `${label}가 비어 있습니다.` });
    return;
  }

  if (!text.startsWith("res://")) {
    issues.push({ severity: "warning", message: `${label}는 res:// 경로를 권장합니다: ${text}` });
  }
}

export function validatePathExtension(value: unknown, label: string, allowedExtensions: Set<string>, issues: ValidationIssue[]) {
  const text = String(value || "").trim();
  if (!text) return;
  const extension = pathExtension(text);
  if (!extension) {
    issues.push({ severity: "warning", message: `${label} 경로에 확장자가 없습니다: ${text}` });
    return;
  }
  if (!allowedExtensions.has(extension)) {
    issues.push({
      severity: "warning",
      message: `${label} 확장자가 미리보기/업로드 지원 범위와 다릅니다: .${extension}`
    });
  }
}

export function isPlainRecord(value: unknown): value is ResourceRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function pathExtension(path: string) {
  const cleanPath = path.split(/[?#]/)[0] || "";
  const lastSegment = cleanPath.split("/").pop() || "";
  const dotIndex = lastSegment.lastIndexOf(".");
  if (dotIndex < 0 || dotIndex === lastSegment.length - 1) return "";
  return lastSegment.slice(dotIndex + 1).toLowerCase();
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

import { asArray } from "../resourceConfig";
import type { ResourceRecord, ValidationIssue } from "../../types";
import type { ResourceMaps } from "./shared";
import {
  imagePathExtensions,
  isPlainRecord,
  normalizeIdList,
  normalizeSingleId,
  validateNumberRange,
  validatePathExtension,
  validatePointArray,
  validateResPath
} from "./shared";

export function validateChapter(data: ResourceRecord, issues: ValidationIssue[], maps: ResourceMaps) {
  const title = normalizeSingleId(data.title ?? data.name ?? data.display_name);
  const startDialogue = getChapterStartDialogueValidationValue(data);
  const bgm = getChapterBgmValidationValue(data);
  const chapterDialogueIds = new Set(getChapterDialogueIdsValidationValue(data));
  if (!title) issues.push({ severity: "error", message: "챕터 title이 비어 있습니다." });
  if (data.metadata !== undefined && !isPlainRecord(data.metadata)) {
    issues.push({ severity: "warning", message: "챕터 metadata는 객체 JSON이어야 합니다." });
  }
  validateResPath(data.image, "챕터 썸네일", issues, false);
  validatePathExtension(data.image, "챕터 썸네일", imagePathExtensions, issues);
  if (startDialogue && !maps.dialogues.has(startDialogue)) {
    issues.push({ severity: "warning", message: `start_dialogue가 존재하지 않는 대사를 가리킵니다: ${startDialogue}` });
  } else if (startDialogue && !chapterDialogueIds.has(startDialogue)) {
    issues.push({ severity: "warning", message: `start_dialogue가 챕터 dialogues에 포함되어 있지 않습니다: ${startDialogue}` });
  }

  for (const dialogueId of chapterDialogueIds) {
    if (!maps.dialogues.has(String(dialogueId))) {
      issues.push({ severity: "warning", message: `챕터 dialogues에 없는 대사 ID가 있습니다: ${dialogueId}` });
    }
  }

  const layout = data.layout && typeof data.layout === "object" && !Array.isArray(data.layout) ? data.layout as ResourceRecord : {};
  const positions = layout.positions && typeof layout.positions === "object" && !Array.isArray(layout.positions)
    ? layout.positions as Record<string, unknown>
    : {};
  for (const dialogueId of chapterDialogueIds) {
    const position = asArray(positions[dialogueId]);
    if (position.length === 0) {
      issues.push({ severity: "info", message: `챕터 그래프 위치가 없는 대화입니다: ${dialogueId}` });
      continue;
    }
    const x = Number(position[0]);
    const y = Number(position[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      issues.push({ severity: "warning", message: `챕터 그래프 위치가 숫자가 아닙니다: ${dialogueId}` });
    }
  }
  for (const positionedId of Object.keys(positions)) {
    if (!chapterDialogueIds.has(positionedId)) {
      issues.push({ severity: "info", message: `layout.positions에 챕터에 포함되지 않은 대화 위치가 남아 있습니다: ${positionedId}` });
    }
  }

  if (bgm && !maps.story_assets.has(bgm)) {
    issues.push({ severity: "warning", message: `챕터 BGM 에셋을 찾을 수 없습니다: ${bgm}` });
  }

  validateChapterParallax(data, issues);
}

function getChapterDialogueIdsValidationValue(data: ResourceRecord) {
  return normalizeIdList(data.dialogues ?? data.dialogue_ids);
}

function getChapterStartDialogueValidationValue(data: ResourceRecord) {
  return normalizeSingleId(data.start_dialogue ?? data.dialogue_id ?? data.first_dialogue);
}

function getChapterBgmValidationValue(data: ResourceRecord) {
  return normalizeSingleId(data.bgm ?? data.bgm_id ?? data.chapter_bgm ?? data.chapter_select_bgm);
}

function validateChapterParallax(data: ResourceRecord, issues: ValidationIssue[]) {
  const parallax = data.parallax && typeof data.parallax === "object" && !Array.isArray(data.parallax)
    ? data.parallax as ResourceRecord
    : null;
  if (!parallax) {
    if (data.hasParallax) issues.push({ severity: "warning", message: "hasParallax가 true지만 parallax 설정이 없습니다." });
    return;
  }

  const layers = asArray<ResourceRecord>(parallax.layers);
  if ((parallax.enabled || data.hasParallax) && layers.length === 0) {
    issues.push({ severity: "warning", message: "패럴랙스가 활성화되어 있지만 layers가 비어 있습니다." });
  }

  validateNumberRange(parallax.strength, "parallax.strength", issues, { min: 0, optional: true });
  validateChapterParallaxOverlay(parallax.overlay, issues);
  validateChapterParallaxTitle(parallax.title, issues);
  layers.forEach((layer, index) => validateChapterParallaxLayer(layer, index, issues));
}

function validateChapterParallaxOverlay(value: unknown, issues: ValidationIssue[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const overlay = value as ResourceRecord;
  if (overlay.enabled && !overlay.path) {
    issues.push({ severity: "warning", message: "parallax.overlay가 활성화되어 있지만 path가 없습니다." });
  }
  validateResPath(overlay.path, "parallax.overlay.path", issues, false);
  validatePathExtension(overlay.path, "parallax.overlay.path", imagePathExtensions, issues);
  validateNumberRange(overlay.opacity, "parallax.overlay.opacity", issues, { min: 0, max: 1, optional: true });
}

function validateChapterParallaxTitle(value: unknown, issues: ValidationIssue[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const title = value as ResourceRecord;
  if (title.enabled && !title.image) {
    issues.push({ severity: "warning", message: "parallax.title이 활성화되어 있지만 image가 없습니다." });
  }
  validateResPath(title.image, "parallax.title.image", issues, false);
  validatePathExtension(title.image, "parallax.title.image", imagePathExtensions, issues);
  validatePointArray(title.position, "parallax.title.position", issues, { length: 2, optional: true });
  validateNumberRange(title.scale, "parallax.title.scale", issues, { min: 0.01, optional: true });
  validateNumberRange(title.scale_x, "parallax.title.scale_x", issues, { min: 0.01, optional: true });
  validateNumberRange(title.scale_y, "parallax.title.scale_y", issues, { min: 0.01, optional: true });
  validateNumberRange(title.opacity, "parallax.title.opacity", issues, { min: 0, max: 1, optional: true });
  validateNumberRange(title.order, "parallax.title.order", issues, { optional: true });
  validateNumberRange(title.depth, "parallax.title.depth", issues, { min: -2, max: 2, optional: true });
  validateNumberRange(title.perspective, "parallax.title.perspective", issues, { min: -1, max: 1, optional: true });
}

function validateChapterParallaxLayer(layer: ResourceRecord, index: number, issues: ValidationIssue[]) {
  const path = `parallax.layers[${index}]`;
  const kind = String(layer.kind ?? layer.type ?? "sprite").trim().toLowerCase();
  if (!["background", "sprite", "overlay", "title"].includes(kind)) {
    const kindField = layer.kind !== undefined ? "kind" : layer.type !== undefined ? "type" : "kind";
    issues.push({ severity: "warning", message: `${path}.${kindField}가 알려진 값이 아닙니다: ${kind}` });
  }
  const layerPath = getParallaxLayerValidationPath(layer);
  const layerPathField = layer.path !== undefined ? "path" : layer.image !== undefined ? "image" : layer.texture !== undefined ? "texture" : "path";
  if (layer.visible !== false && !layerPath) {
    issues.push({ severity: "warning", message: `${path}: visible layer에 path가 없습니다.` });
  }
  validateResPath(layerPath, `${path}.${layerPathField}`, issues, false);
  validatePathExtension(layerPath, `${path}.${layerPathField}`, imagePathExtensions, issues);
  validateParallaxLayerPosition(layer, path, issues);
  validateParallaxLayerAnchor(layer, path, issues);
  validateNumberRange(layer.order, `${path}.order`, issues, { optional: true });
  validateNumberRange(layer.scale, `${path}.scale`, issues, { min: 0.01, optional: true });
  validateNumberRange(layer.scale_x ?? layer.scaleX ?? layer.width_scale ?? layer.widthScale, `${path}.scale_x`, issues, { min: 0.01, optional: true });
  validateNumberRange(layer.scale_y ?? layer.scaleY ?? layer.height_scale ?? layer.heightScale, `${path}.scale_y`, issues, { min: 0.01, optional: true });
  validateNumberRange(layer.rotation, `${path}.rotation`, issues, { optional: true });
  validateNumberRange(layer.depth, `${path}.depth`, issues, { min: -2, max: 2, optional: true });
  validateNumberRange(layer.perspective, `${path}.perspective`, issues, { min: -1, max: 1, optional: true });
  validateNumberRange(layer.opacity, `${path}.opacity`, issues, { min: 0, max: 1, optional: true });
  validateNumberRange(
    layer.motion_strength ?? layer.motionStrength ?? layer.motion ?? layer.shake_strength ?? layer.shakeStrength ?? layer.shake ?? layer.floating_strength ?? layer.floatingStrength,
    `${path}.motion_strength`,
    issues,
    { min: 0, optional: true }
  );
}

function getParallaxLayerValidationPath(layer: ResourceRecord) {
  return layer.path ?? layer.image ?? layer.texture;
}

function validateParallaxLayerPosition(layer: ResourceRecord, path: string, issues: ValidationIssue[]) {
  if (layer.position !== undefined) {
    validatePointArray(layer.position, `${path}.position`, issues, { length: 2, optional: true });
    return;
  }
  validateNumberRange(layer.x, `${path}.x`, issues, { min: -0.5, max: 1.5, optional: true });
  validateNumberRange(layer.y, `${path}.y`, issues, { min: -0.5, max: 1.5, optional: true });
}

function validateParallaxLayerAnchor(layer: ResourceRecord, path: string, issues: ValidationIssue[]) {
  const arrayValue = layer.anchor ?? layer.center ?? layer.focus ?? layer.pivot;
  if (arrayValue !== undefined) {
    const field = layer.anchor !== undefined ? "anchor" : layer.center !== undefined ? "center" : layer.focus !== undefined ? "focus" : "pivot";
    validatePointArray(arrayValue, `${path}.${field}`, issues, { length: 2, min: 0, max: 1, optional: true });
    return;
  }
  validateNumberRange(layer.anchor_x ?? layer.center_x ?? layer.focus_x ?? layer.pivot_x, `${path}.anchor_x`, issues, { min: 0, max: 1, optional: true });
  validateNumberRange(layer.anchor_y ?? layer.center_y ?? layer.focus_y ?? layer.pivot_y, `${path}.anchor_y`, issues, { min: 0, max: 1, optional: true });
}

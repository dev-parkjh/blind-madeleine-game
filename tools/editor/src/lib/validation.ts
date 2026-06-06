import type { ProjectSummary, ResourceRecord, ResourceSummary, ResourceType, ValidationIssue } from "../types";
import { asArray, normalizeKind } from "./resourceConfig";

type ResourceMaps = {
  characters: Map<string, ResourceSummary>;
  chapters: Map<string, ResourceSummary>;
  dialogues: Map<string, ResourceSummary>;
  items: Map<string, ResourceSummary>;
  story_assets: Map<string, ResourceSummary>;
};
type NodeValidationContext = {
  idSet: Set<string>;
  listName: "nodes" | "statement" | "reaction" | "choice";
  nodeIndex: number;
  autoPrefix: string;
};

const imagePathExtensions = new Set(["png", "jpg", "jpeg", "webp", "gif"]);
const audioPathExtensions = new Set(["mp3", "ogg", "opus", "wav", "m4a", "aac", "flac", "webm"]);
const resourceIdPattern = /^[a-zA-Z0-9_-]+$/;
const popupSources = new Set(["character_profile", "item", "image"]);
const textSoundMutedKeys = ["text_sound_muted", "typewriter_sound_muted", "dialogue_text_sound_muted"];
const popupSourceAliases: Record<string, string> = {
  character: "character_profile",
  profile: "character_profile",
  portrait_profile: "character_profile",
  item_image: "item",
  path: "image",
  direct: "image"
};
const popupPositions = new Set(["left", "center", "right", "top_left", "top_right", "custom"]);
const stageCastPositions = new Set(["far_left", "left", "center", "right", "far_right", "custom"]);
const popupTransitions = new Set(["fade", "pop", "slide", "none"]);
const popupImageModes = new Set(["fit", "cover", "crop"]);

export function collectValidationIssues(
  type: ResourceType,
  data: ResourceRecord | null,
  selectedId: string,
  summary: ProjectSummary | null
): ValidationIssue[] {
  if (!data) return [{ severity: "info", message: "왼쪽 목록에서 편집할 항목을 선택하세요." }];

  const issues: ValidationIssue[] = [];
  const maps = buildMaps(summary);

  if (!data.id) {
    issues.push({ severity: "error", message: "JSON에 id 필드가 없습니다." });
  } else if (!resourceIdPattern.test(String(data.id))) {
    issues.push({ severity: "error", message: "id/파일명은 영문, 숫자, 밑줄, 하이픈만 사용할 수 있습니다." });
  } else if (selectedId && data.id !== selectedId) {
    issues.push({ severity: "warning", message: `파일명 ID와 JSON ID가 다릅니다. 파일명: ${selectedId}, JSON: ${data.id}` });
  }

  if (type === "characters") validateCharacter(data, issues);
  if (type === "items") validateItem(data, issues, maps);
  if (type === "chapters") validateChapter(data, issues, maps);
  if (type === "story_assets") validateStoryAsset(data, issues, maps);
  if (type === "dialogues") validateDialogue(data, issues, maps);

  if (issues.length === 0) {
    issues.push({ severity: "info", message: "현재 선택 항목의 기본 검증을 통과했습니다." });
  }

  return issues;
}

function buildMaps(summary: ProjectSummary | null): ResourceMaps {
  const make = (type: ResourceType) => new Map((summary?.resources[type]?.resources || []).map((entry) => [entry.id, entry]));
  return {
    characters: make("characters"),
    chapters: make("chapters"),
    dialogues: make("dialogues"),
    items: make("items"),
    story_assets: make("story_assets")
  };
}

function getSummaryValidation(summary: ResourceSummary | undefined): ResourceRecord {
  return summary?.validation && typeof summary.validation === "object" && !Array.isArray(summary.validation)
    ? summary.validation
    : {};
}

function getCharacterPortraitKeys(characterId: string, maps: ResourceMaps) {
  return asArray(getSummaryValidation(maps.characters.get(characterId)).portraitKeys).map(String);
}

function validateCharacter(data: ResourceRecord, issues: ValidationIssue[]) {
  if (!data.display_name) issues.push({ severity: "error", message: "캐릭터 display_name이 비어 있습니다." });
  if (data.name_color && !/^#[0-9a-f]{6}$/i.test(String(data.name_color))) {
    issues.push({ severity: "warning", message: "name_color는 #RRGGBB 형식을 권장합니다." });
  }
  if (data.metadata !== undefined && !isPlainRecord(data.metadata)) {
    issues.push({ severity: "warning", message: "캐릭터 metadata는 객체 JSON이어야 합니다." });
  }
  validateVector2(data.spectrum_offset, "spectrum_offset", issues, { min: -1, max: 1, optional: true });

  const portraits = data.portraits;
  if (portraits && typeof portraits === "object" && !Array.isArray(portraits)) {
    for (const [key, portrait] of Object.entries(portraits)) {
      validateCharacterPortrait(key, portrait, issues);
    }
  } else if (portraits !== undefined) {
    issues.push({ severity: "warning", message: "캐릭터 portraits는 객체 JSON이어야 합니다." });
  }
}

function validateCharacterPortrait(key: string, portrait: unknown, issues: ValidationIssue[]) {
  const path = typeof portrait === "string"
    ? portrait
    : isPlainRecord(portrait)
      ? portrait.path
      : "";
  if (!path) {
    issues.push({ severity: "warning", message: `초상 ${key}에 path가 없습니다.` });
    return;
  }
  validateResPath(path, `초상 ${key}`, issues, false);
  validatePathExtension(path, `초상 ${key}`, imagePathExtensions, issues);
  if (!isPlainRecord(portrait)) return;
  validatePointArray(portrait.center, `초상 ${key}.center`, issues, { length: 2, min: 0, max: 1, optional: true });
  if (portrait.profile !== undefined && !isPlainRecord(portrait.profile)) {
    issues.push({ severity: "warning", message: `초상 ${key}.profile은 객체 JSON이어야 합니다.` });
    return;
  }
  if (isPlainRecord(portrait.profile)) {
    validatePointArray(portrait.profile.center, `초상 ${key}.profile.center`, issues, { length: 2, min: 0, max: 1, optional: true });
    validateNumberRange(portrait.profile.zoom, `초상 ${key}.profile.zoom`, issues, { min: 1, max: 6, optional: true });
    validateVector2(portrait.profile.offset, `초상 ${key}.profile.offset`, issues, { min: -1, max: 1, optional: true });
  }
}

function validateItem(data: ResourceRecord, issues: ValidationIssue[], maps: ResourceMaps) {
  if (!data.name) issues.push({ severity: "error", message: "아이템 name이 비어 있습니다." });
  validateChapterScope(getResourceChapterScopeValidationValue(data), issues, maps);
  validateResPath(data.image, "아이템 이미지", issues, false);
  validatePathExtension(data.image, "아이템 이미지", imagePathExtensions, issues);
}

function validateChapter(data: ResourceRecord, issues: ValidationIssue[], maps: ResourceMaps) {
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

function validateStoryAsset(data: ResourceRecord, issues: ValidationIssue[], maps: ResourceMaps) {
  const kind = normalizeKind(data.kind);
  if (!["bgm", "sfx", "background"].includes(kind)) {
    issues.push({ severity: "warning", message: `스토리 에셋 kind가 알려진 값이 아닙니다: ${data.kind}` });
  }
  validateChapterScope(getResourceChapterScopeValidationValue(data), issues, maps);
  validateResPath(data.path, "스토리 에셋 경로", issues, true);
  if (kind === "background") {
    validatePathExtension(data.path, "스토리 배경 에셋", imagePathExtensions, issues);
  } else if (kind === "bgm" || kind === "sfx") {
    validatePathExtension(data.path, "스토리 오디오 에셋", audioPathExtensions, issues);
  }

  if (data.volume !== undefined) {
    const volume = Number(data.volume);
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
      issues.push({ severity: "warning", message: "volume은 0에서 1 사이 값을 권장합니다." });
    }
  }
}

function validateDialogue(data: ResourceRecord, issues: ValidationIssue[], maps: ResourceMaps) {
  if (!data.label) issues.push({ severity: "warning", message: "대사 label이 비어 있습니다." });
  if (data.metadata !== undefined && !isPlainRecord(data.metadata)) {
    issues.push({ severity: "warning", message: "대사 metadata는 객체 JSON이어야 합니다." });
  }
  validateChapterScope(getResourceChapterScopeValidationValue(data), issues, maps);
  const metadata = data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata) ? data.metadata as ResourceRecord : {};
  if (metadata.next_dialogue && !maps.dialogues.has(String(metadata.next_dialogue))) {
    issues.push({ severity: "warning", message: `metadata.next_dialogue 대상이 없습니다: ${metadata.next_dialogue}` });
  }
  if (metadata.next_dialogue_blackout && !metadata.next_dialogue) {
    issues.push({ severity: "warning", message: "metadata.next_dialogue_blackout은 next_dialogue가 있을 때만 의미가 있습니다." });
  }
  if (metadata.presentation_mode !== undefined && !["normal", "statement"].includes(String(metadata.presentation_mode))) {
    issues.push({ severity: "warning", message: `metadata.presentation_mode가 지원 범위가 아닙니다: ${metadata.presentation_mode}` });
  }
  validateStatementNotebookScope(metadata.statement_notebook, issues, maps);
  for (const field of ["next_dialogue_blackout_fade_duration", "next_dialogue_blackout_hold_duration"]) {
    if (metadata[field] !== undefined) {
      const duration = Number(metadata[field]);
      if (!Number.isFinite(duration) || duration < 0) {
        issues.push({ severity: "warning", message: `metadata.${field}는 0 이상 숫자여야 합니다.` });
      }
    }
  }

  const nodes = asArray<ResourceRecord>(data.nodes);
  const statementNodes = asArray<unknown>(data.statement_nodes);
  if (nodes.length === 0 && statementNodes.length === 0) {
    issues.push({ severity: "warning", message: "대사 nodes와 statement_nodes가 모두 비어 있습니다." });
  }

  const nodeIds = buildResolvedNodeIdSet(nodes, "@");
  const statementNodeIds = buildStatementResolvedNodeIdSet(statementNodes);
  const startNodeIds = new Set([...nodeIds, ...statementNodeIds]);
  const start = normalizeSingleId(data.start);
  if (start && !startNodeIds.has(start)) {
    issues.push({ severity: "warning", message: `start가 존재하지 않는 노드를 가리킵니다: ${start}` });
  }

  nodes.forEach((node, index) => validateDialogueNode(node, `nodes[${index}]`, issues, maps, {
    idSet: nodeIds,
    listName: "nodes",
    nodeIndex: index,
    autoPrefix: "@"
  }));
  validateStageEventTimeline(nodes, "nodes", issues);
  statementNodes.forEach((entry, index) => {
    if (typeof entry === "string") {
      const linkedId = normalizeSingleId(entry);
      if (!linkedId) {
        issues.push({ severity: "warning", message: `statement_nodes[${index}] 문자열 링크가 비어 있습니다.` });
      } else if (!nodeIds.has(linkedId)) {
        issues.push({ severity: "warning", message: `statement_nodes[${index}]가 없는 nodes ID를 가리킵니다: ${linkedId}` });
      }
      return;
    }
    if (!isPlainRecord(entry)) {
      issues.push({ severity: "warning", message: `statement_nodes[${index}]는 노드 객체 또는 nodes ID 문자열이어야 합니다.` });
      return;
    }
    validateDialogueNode(entry, `statement_nodes[${index}]`, issues, maps, {
      idSet: statementNodeIds,
      listName: "statement",
      nodeIndex: index,
      autoPrefix: "@statement_"
    });
  });
}

function validateDialogueNode(node: ResourceRecord, path: string, issues: ValidationIssue[], maps: ResourceMaps, context: NodeValidationContext) {
  if (isCutsceneValidationNode(node)) {
    validateCutscene(getNodeCutsceneValidationConfig(node), path, issues);
    return;
  }

  if (node.speaker && node.speaker !== "narrator" && !maps.characters.has(String(node.speaker))) {
    issues.push({ severity: "warning", message: `${path}: 존재하지 않는 speaker입니다: ${node.speaker}` });
  }
  validateTextSoundMutedAliases(node, path, issues);

  if (node.choices !== undefined && !Array.isArray(node.choices)) {
    issues.push({ severity: "warning", message: `${path}.choices는 배열이어야 합니다.` });
  }
  const choices = asArray<ResourceRecord>(node.choices);
  const hasChoiceContent = choices.some((choice) => choice.text || choice.label || choice.next);
  const acquireInfo = readAcquireInfo(getNodeAcquireInfoValue(node));
  const hasAcquireInfo = acquireInfo.characters.length > 0 || acquireInfo.items.length > 0;
  if (!node.text && !hasChoiceContent && !hasAcquireInfo) {
    issues.push({ severity: "warning", message: `${path}: text나 choices가 없습니다.` });
  }

  const next = String(node.next || "").trim();
  if (next && !context.idSet.has(next)) {
    issues.push({ severity: "warning", message: `${path}: next '${next}'를 현재 노드 목록에서 찾을 수 없습니다.` });
  }

  validateStageCast(node.stage_cast, path, issues, maps);
  validateAcquireInfo(getNodeAcquireInfoValue(node), path, issues, maps);
  scanDialogueText(String(node.text || ""), path, issues, maps);

  if (node.popups !== undefined && node.popup_images !== undefined) {
    issues.push({ severity: "warning", message: `${path}: popups와 popup_images가 동시에 있습니다. popups가 우선됩니다.` });
  }
  if (node.popups !== undefined && !Array.isArray(node.popups)) {
    issues.push({ severity: "warning", message: `${path}.popups는 배열이어야 합니다.` });
  }
  if (node.popup_images !== undefined && !Array.isArray(node.popup_images)) {
    issues.push({ severity: "warning", message: `${path}.popup_images는 배열이어야 합니다.` });
  }
  const popupField = node.popups !== undefined ? "popups" : "popup_images";
  const popupValues = node.popups !== undefined ? node.popups : node.popup_images;
  for (const [popupIndex, popup] of asArray<unknown>(popupValues).entries()) {
    validateNodePopup(popup, `${path}.${popupField}[${popupIndex}]`, node, issues, maps);
  }

  choices.forEach((choice, choiceIndex) => {
    const choicePath = `${path}.choices[${choiceIndex}]`;
    if (!isPlainRecord(choice)) {
      issues.push({ severity: "warning", message: `${choicePath}는 객체여야 합니다.` });
      return;
    }
    if (!choice.text && !choice.label && !choice.next) {
      issues.push({ severity: "warning", message: `${choicePath}: label, text, next가 모두 비어 있습니다.` });
    }
    if (choice.next && !context.idSet.has(String(choice.next))) {
      issues.push({ severity: "warning", message: `${choicePath}: next '${choice.next}'를 현재 노드 목록에서 찾을 수 없습니다.` });
    }
    if (choice.set_flags !== undefined && (!choice.set_flags || typeof choice.set_flags !== "object" || Array.isArray(choice.set_flags))) {
      issues.push({ severity: "warning", message: `${choicePath}: set_flags는 객체 JSON이어야 합니다.` });
    }
    if (choice.conditions !== undefined && !Array.isArray(choice.conditions)) {
      issues.push({ severity: "warning", message: `${choicePath}: conditions는 배열 JSON이어야 합니다.` });
    }
    if (choice.nodes !== undefined && !Array.isArray(choice.nodes)) {
      issues.push({ severity: "warning", message: `${choicePath}.nodes는 배열이어야 합니다.` });
    }
    scanDialogueText(String(choice.label || ""), `${choicePath}.label`, issues, maps);
    scanDialogueText(String(choice.text || ""), `${choicePath}.text`, issues, maps);

    const nestedNodes = asArray<ResourceRecord>(choice.nodes);
    const choiceAutoPrefix = `${context.autoPrefix}choice_${choiceIndex}_`;
    const choiceIds = buildResolvedNodeIdSet(nestedNodes, choiceAutoPrefix);
    for (const [nestedIndex, nested] of nestedNodes.entries()) {
      validateDialogueNode(nested, `${choicePath}.nodes[${nestedIndex}]`, issues, maps, {
        idSet: choiceIds,
        listName: "choice",
        nodeIndex: nestedIndex,
        autoPrefix: choiceAutoPrefix
      });
    }
  });

  if (node.statement_lies !== undefined && node.lies !== undefined) {
    issues.push({ severity: "warning", message: `${path}: statement_lies와 lies가 동시에 있습니다. statement_lies가 우선됩니다.` });
  }
  if (node.statement_lies !== undefined && !Array.isArray(node.statement_lies)) {
    issues.push({ severity: "warning", message: `${path}.statement_lies는 배열이어야 합니다.` });
  }
  if (node.lies !== undefined && !Array.isArray(node.lies)) {
    issues.push({ severity: "warning", message: `${path}.lies는 배열이어야 합니다.` });
  }
  const statementLiesField = node.statement_lies !== undefined ? "statement_lies" : "lies";
  const statementLiesValue = node.statement_lies !== undefined ? node.statement_lies : node.lies;
  for (const [lieIndex, lie] of asArray<ResourceRecord>(statementLiesValue).entries()) {
    const liePath = `${path}.${statementLiesField}[${lieIndex}]`;
    if (!isPlainRecord(lie)) {
      issues.push({ severity: "warning", message: `${liePath}는 객체여야 합니다.` });
      continue;
    }
    if (lie.reactions !== undefined && !Array.isArray(lie.reactions)) {
      issues.push({ severity: "warning", message: `${liePath}.reactions는 배열이어야 합니다.` });
    }
    for (const [reactionIndex, reaction] of asArray<ResourceRecord>(lie.reactions).entries()) {
      validateStatementReaction(reaction, `${liePath}.reactions[${reactionIndex}]`, issues, maps);
      const nestedNodes = asArray<ResourceRecord>(reaction.nodes);
      const reactionAutoPrefix = context.listName === "statement"
        ? `@reaction_${context.nodeIndex}_${lieIndex}_${reactionIndex}_`
        : "@reaction_";
      const reactionIds = buildResolvedNodeIdSet(nestedNodes, reactionAutoPrefix);
      for (const [nestedIndex, nested] of nestedNodes.entries()) {
        validateDialogueNode(nested, `${liePath}.reactions[${reactionIndex}].nodes[${nestedIndex}]`, issues, maps, {
          idSet: reactionIds,
          listName: "reaction",
          nodeIndex: nestedIndex,
          autoPrefix: reactionAutoPrefix
        });
      }
    }
  }
}

function validateCutscene(cutscene: ResourceRecord, path: string, issues: ValidationIssue[]) {
  validateNumberRange(cutscene.fade_in, `${path}.cutscene.fade_in`, issues, { min: 0, optional: true });
  validateNumberRange(cutscene.hold, `${path}.cutscene.hold`, issues, { min: 0, optional: true });
  validateNumberRange(cutscene.fade_out, `${path}.cutscene.fade_out`, issues, { min: 0, optional: true });
  validateResPath(cutscene.image, `${path}.cutscene.image`, issues, false);
  validatePathExtension(cutscene.image, `${path}.cutscene.image`, imagePathExtensions, issues);
}

function isCutsceneValidationNode(node: ResourceRecord) {
  const mode = String(node.mode ?? node.type ?? "").trim().toLowerCase();
  if (["cutscene", "blackout", "dark", "fade_black", "fade-to-black", "암전", "컷씬"].includes(mode)) return true;
  return Boolean(node.blackout_enabled ?? node.is_blackout);
}

function getNodeCutsceneValidationConfig(node: ResourceRecord) {
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

function resolveNodeId(node: ResourceRecord, index: number, autoPrefix: string) {
  const raw = String(node.id || "").trim();
  return raw || `${autoPrefix}${index}`;
}

function buildResolvedNodeIdSet(nodes: ResourceRecord[], autoPrefix: string) {
  return new Set(nodes.map((node, index) => resolveNodeId(node, index, autoPrefix)));
}

function buildStatementResolvedNodeIdSet(nodes: unknown[]) {
  return new Set(nodes.map((node, index) => {
    if (typeof node === "string") return normalizeSingleId(node) || `@statement_${index}`;
    return isPlainRecord(node) ? resolveNodeId(node, index, "@statement_") : `@statement_${index}`;
  }));
}

function validateStatementReaction(reaction: ResourceRecord, path: string, issues: ValidationIssue[], maps: ResourceMaps) {
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

function validateStageCast(value: unknown, path: string, issues: ValidationIssue[], maps: ResourceMaps) {
  if (!value || typeof value !== "object") return;

  for (const [characterId, cast] of Object.entries(value)) {
    if (characterId !== "mystery" && !maps.characters.has(characterId)) {
      issues.push({ severity: "warning", message: `${path}: stage_cast에 없는 캐릭터가 있습니다: ${characterId}` });
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
    const portraitKey = String(record.portrait || "").trim();
    if (portraitKey && !portraitKey.startsWith("res://")) {
      const validKeys = getCharacterPortraitKeys(characterId, maps);
      if (validKeys.length > 0 && !validKeys.includes(portraitKey)) {
        issues.push({ severity: "warning", message: `${castPath}.portrait가 캐릭터 portrait key에 없습니다: ${portraitKey}` });
      }
    }
  }
}

function validateStageEventTimeline(nodes: ResourceRecord[], path: string, issues: ValidationIssue[]) {
  const visible = new Set<string>();
  nodes.forEach((node, index) => {
    if (isCutsceneValidationNode(node)) return;

    const nodePath = `${path}[${index}]`;
    const stageCastPortraitIds = getStageCastPortraitIds(node);
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

function validateNodePopup(
  value: unknown,
  path: string,
  node: ResourceRecord,
  issues: ValidationIssue[],
  maps: ResourceMaps
) {
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `${path}는 객체여야 합니다.` });
    return;
  }

  const popup = value;
  const sourceInfo = normalizePopupSource(popup.source ?? popup.kind);
  if (!sourceInfo.recognized) {
    issues.push({ severity: "warning", message: `${path}.source가 지원 범위가 아닙니다: ${String(popup.source ?? popup.kind)}` });
  }

  if (sourceInfo.source === "character_profile") {
    const targetId = String(popup.target_id ?? popup.character_id ?? "").trim()
      || (String(node.speaker || "").trim() !== "narrator" ? String(node.speaker || "").trim() : "");
    if (!targetId || targetId === "narrator" || !maps.characters.has(targetId)) {
      issues.push({ severity: "warning", message: `${path}: character_profile 팝업 대상 인물을 찾을 수 없습니다: ${targetId || "(없음)"}` });
    } else if (popup.portrait) {
      const portraitKey = String(popup.portrait).trim();
      const validKeys = getCharacterPortraitKeys(targetId, maps);
      if (validKeys.length > 0 && !validKeys.includes(portraitKey)) {
        issues.push({ severity: "warning", message: `${path}.portrait가 캐릭터 portrait key에 없습니다: ${portraitKey}` });
      }
    }
  } else if (sourceInfo.source === "item") {
    const targetId = String(popup.target_id ?? popup.item_id ?? "").trim();
    if (!targetId || !maps.items.has(targetId)) {
      issues.push({ severity: "warning", message: `${path}: item 팝업 대상 아이템을 찾을 수 없습니다: ${targetId || "(없음)"}` });
    } else if (!String(getSummaryValidation(maps.items.get(targetId)).image || "").trim()) {
      issues.push({ severity: "warning", message: `${path}: item 팝업 대상 아이템에 image가 없습니다: ${targetId}` });
    }
  } else {
    const imagePath = popup.path ?? popup.image;
    validateResPath(imagePath, `${path}.path`, issues, true);
    validatePathExtension(imagePath, `${path}.path`, imagePathExtensions, issues);
  }

  const position = String(popup.position ?? "center").trim();
  if (popup.position !== undefined && !popupPositions.has(position)) {
    issues.push({ severity: "warning", message: `${path}.position이 지원 범위가 아닙니다: ${position}` });
  }
  validateVector2(popup.offset, `${path}.offset`, issues, { optional: true });
  validatePopupSize(popup, path, issues);
  validateNumberRange(popup.scale, `${path}.scale`, issues, { min: 0.25, max: 3, optional: true });
  validateNumberRange(popup.opacity, `${path}.opacity`, issues, { min: 0, max: 1, optional: true });

  const transition = String(popup.transition ?? "fade").trim();
  if (popup.transition !== undefined && !popupTransitions.has(transition)) {
    issues.push({ severity: "warning", message: `${path}.transition이 지원 범위가 아닙니다: ${transition}` });
  }

  const imageMode = String(popup.image_mode ?? popup.fit ?? "fit").trim();
  if ((popup.image_mode !== undefined || popup.fit !== undefined) && !popupImageModes.has(imageMode)) {
    issues.push({ severity: "warning", message: `${path}.image_mode가 지원 범위가 아닙니다: ${imageMode}` });
  }
  validateNumberRange(popup.image_zoom, `${path}.image_zoom`, issues, { min: 0.25, max: 6, optional: true });
}

function validatePopupSize(popup: ResourceRecord, path: string, issues: ValidationIssue[]) {
  if (popup.size !== undefined) {
    validateVector2(popup.size, `${path}.size`, issues, {
      min: 1,
      optional: false,
      objectKeys: [["x", "width"], ["y", "height"]]
    });
    return;
  }
  validateNumberRange(popup.width, `${path}.width`, issues, { min: 1, optional: true });
  validateNumberRange(popup.height, `${path}.height`, issues, { min: 1, optional: true });
}

function normalizePopupSource(value: unknown): { source: string; recognized: boolean } {
  const raw = String(value || "character_profile").trim();
  const key = raw.toLowerCase();
  if (popupSources.has(key)) return { source: key, recognized: true };
  if (popupSourceAliases[key]) return { source: popupSourceAliases[key], recognized: true };
  return { source: "character_profile", recognized: false };
}

function validateAcquireInfo(value: unknown, path: string, issues: ValidationIssue[], maps: ResourceMaps) {
  if (value === undefined || value === null || value === "") return;
  if (!Array.isArray(value) && !isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `${path}: acquire_info는 객체 또는 보상 배열이어야 합니다.` });
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      if (!isPlainRecord(entry)) {
        issues.push({ severity: "warning", message: `${path}: acquire_info[${index}]는 객체여야 합니다.` });
        return;
      }
      const kind = String(entry.kind || entry.type || "").trim();
      const targetId = String(entry.target_id || entry.id || entry.target || "").trim();
      if (!["character", "item"].includes(normalizeAcquireKind(kind))) {
        issues.push({ severity: "warning", message: `${path}: acquire_info[${index}].kind는 character 또는 item이어야 합니다.` });
      }
      if (!targetId) {
        issues.push({ severity: "warning", message: `${path}: acquire_info[${index}] target_id가 비어 있습니다.` });
      }
    });
  } else {
    const record = value;
    const characterField = record.characters ?? record.character_ids;
    const itemField = record.items ?? record.item_ids;
    if (characterField !== undefined && !Array.isArray(characterField) && typeof characterField !== "string") {
      issues.push({ severity: "warning", message: `${path}: acquire_info.characters는 문자열 또는 배열이어야 합니다.` });
    }
    if (itemField !== undefined && !Array.isArray(itemField) && typeof itemField !== "string") {
      issues.push({ severity: "warning", message: `${path}: acquire_info.items는 문자열 또는 배열이어야 합니다.` });
    }
    if (record.entries !== undefined && !Array.isArray(record.entries)) {
      issues.push({ severity: "warning", message: `${path}: acquire_info.entries는 배열이어야 합니다.` });
    }
  }

  const info = readAcquireInfo(value);
  const characterIds = new Set<string>();
  for (const rawCharacterId of info.characters) {
    const characterId = String(rawCharacterId || "").trim();
    if (!characterId) {
      issues.push({ severity: "warning", message: `${path}: acquire_info.characters에 빈 ID가 있습니다.` });
      continue;
    }
    if (characterIds.has(characterId)) {
      issues.push({ severity: "warning", message: `${path}: acquire_info.characters가 중복되었습니다: ${characterId}` });
    }
    characterIds.add(characterId);
    if (characterId === "narrator" || !maps.characters.has(characterId)) {
      issues.push({ severity: "warning", message: `${path}: acquire_info.characters에 없는 캐릭터가 있습니다: ${characterId}` });
    }
  }

  const itemIds = new Set<string>();
  for (const rawItemId of info.items) {
    const itemId = String(rawItemId || "").trim();
    if (!itemId) {
      issues.push({ severity: "warning", message: `${path}: acquire_info.items에 빈 ID가 있습니다.` });
      continue;
    }
    if (itemIds.has(itemId)) {
      issues.push({ severity: "warning", message: `${path}: acquire_info.items가 중복되었습니다: ${itemId}` });
    }
    itemIds.add(itemId);
    if (!maps.items.has(itemId)) {
      issues.push({ severity: "warning", message: `${path}: acquire_info.items에 없는 아이템이 있습니다: ${itemId}` });
    }
  }
}

function validateStatementNotebookScope(value: unknown, issues: ValidationIssue[], maps: ResourceMaps) {
  if (value === undefined || value === null || value === "") return;
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: "metadata.statement_notebook은 객체 JSON이어야 합니다." });
    return;
  }
  const characters = normalizeIdList(value.characters ?? value.character_ids);
  const items = normalizeIdList(value.items ?? value.item_ids);
  for (const characterId of characters) {
    if (characterId === "narrator" || !maps.characters.has(characterId)) {
      issues.push({ severity: "warning", message: `metadata.statement_notebook.characters에 없는 캐릭터가 있습니다: ${characterId}` });
    }
  }
  for (const itemId of items) {
    if (!maps.items.has(itemId)) {
      issues.push({ severity: "warning", message: `metadata.statement_notebook.items에 없는 아이템이 있습니다: ${itemId}` });
    }
  }
}

function validateTextSoundMutedAliases(node: ResourceRecord, path: string, issues: ValidationIssue[]) {
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

function isBooleanLike(value: unknown) {
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return value === 0 || value === 1;
  if (typeof value === "string") return ["true", "false", "1", "0", "yes", "no", "on", "off"].includes(value.trim().toLowerCase());
  return false;
}

function getNodeAcquireInfoValue(node: ResourceRecord): unknown {
  const metadata = isPlainRecord(node.metadata) ? node.metadata : {};
  return node.acquire_info
    ?? node.acquired_info
    ?? node.acquire_on_complete
    ?? node.rewards
    ?? metadata.acquire_info
    ?? metadata.acquired_info
    ?? metadata.acquire_on_complete
    ?? metadata.rewards;
}

function readAcquireInfo(value: unknown): { characters: unknown[]; items: unknown[] } {
  const characters: unknown[] = [];
  const items: unknown[] = [];

  function append(target: unknown[], raw: unknown) {
    if (Array.isArray(raw)) {
      raw.forEach((entry) => {
        if (isPlainRecord(entry)) {
          append(target, entry.target_id ?? entry.id ?? entry.target);
          return;
        }
        append(target, entry);
      });
      return;
    }
    const id = String(raw || "").trim();
    if (id && !target.includes(id)) target.push(id);
  }

  function appendEntry(entry: unknown) {
    if (!isPlainRecord(entry)) return;
    const kind = normalizeAcquireKind(entry.kind || entry.type);
    const targetId = entry.target_id ?? entry.id ?? entry.target;
    if (kind === "character") append(characters, targetId);
    if (kind === "item") append(items, targetId);
  }

  if (Array.isArray(value)) {
    value.forEach(appendEntry);
    return { characters, items };
  }
  if (!isPlainRecord(value)) return { characters: [], items: [] };
  append(characters, value.characters ?? value.character_ids);
  append(items, value.items ?? value.item_ids);
  asArray(value.entries).forEach(appendEntry);
  return { characters, items };
}

function normalizeAcquireKind(value: unknown) {
  const kind = String(value || "").trim().toLowerCase();
  if (["characters", "character_info", "person"].includes(kind)) return "character";
  if (["items", "item_info"].includes(kind)) return "item";
  return kind;
}

function scanDialogueText(text: string, path: string, issues: ValidationIssue[], maps: ResourceMaps) {
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
}

function extractStageTextEvents(text: string) {
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
  const attrPattern = /\b(?:id|ids|character|characters|character_id|character_ids|speaker|speaker_id|target|targets)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+))/gi;
  let attrMatch: RegExpExecArray | null;
  while ((attrMatch = attrPattern.exec(attrs))) {
    const rawIds = attrMatch[1] ?? attrMatch[2] ?? attrMatch[3] ?? "";
    for (const value of rawIds.split(/[\s,;]+/)) {
      const id = value.trim();
      if (id && !ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}

function getStageCastPortraitIds(node: ResourceRecord) {
  const ids = new Set<string>();
  if (!isPlainRecord(node.stage_cast)) return ids;
  for (const [characterId, rawEntry] of Object.entries(node.stage_cast)) {
    if (characterId === "mystery" || !isPlainRecord(rawEntry)) continue;
    if (String(rawEntry.portrait || "").trim()) ids.add(characterId);
  }
  return ids;
}

function validateChapterScope(value: unknown, issues: ValidationIssue[], maps: ResourceMaps) {
  for (const chapterId of normalizeIdList(value)) {
    if (!maps.chapters.has(String(chapterId))) {
      issues.push({ severity: "warning", message: `chapters에 없는 챕터 ID가 있습니다: ${chapterId}` });
    }
  }
}

function getResourceChapterScopeValidationValue(data: ResourceRecord) {
  const metadata = isPlainRecord(data.metadata) ? data.metadata : {};
  return data.chapters ?? data.chapter_ids ?? metadata.chapters ?? metadata.chapter_ids;
}

function normalizeSingleId(value: unknown) {
  return String(value || "").trim();
}

function normalizeIdList(value: unknown) {
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

function validatePointArray(
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

function validateVector2(
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

function validateNumberRange(
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

function validateResPath(value: unknown, label: string, issues: ValidationIssue[], required: boolean) {
  const text = String(value || "").trim();
  if (!text) {
    if (required) issues.push({ severity: "warning", message: `${label}가 비어 있습니다.` });
    return;
  }

  if (!text.startsWith("res://")) {
    issues.push({ severity: "warning", message: `${label}는 res:// 경로를 권장합니다: ${text}` });
  }
}

function validatePathExtension(value: unknown, label: string, allowedExtensions: Set<string>, issues: ValidationIssue[]) {
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

function pathExtension(path: string) {
  const cleanPath = path.split(/[?#]/)[0] || "";
  const lastSegment = cleanPath.split("/").pop() || "";
  const dotIndex = lastSegment.lastIndexOf(".");
  if (dotIndex < 0 || dotIndex === lastSegment.length - 1) return "";
  return lastSegment.slice(dotIndex + 1).toLowerCase();
}

function isPlainRecord(value: unknown): value is ResourceRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

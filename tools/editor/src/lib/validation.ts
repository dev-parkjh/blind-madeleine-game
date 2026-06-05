import type { ProjectSummary, ResourceRecord, ResourceSummary, ResourceType, ValidationIssue } from "../types";
import { asArray, normalizeKind } from "./resourceConfig";

type ResourceMaps = {
  characters: Map<string, ResourceSummary>;
  chapters: Map<string, ResourceSummary>;
  dialogues: Map<string, ResourceSummary>;
  items: Map<string, ResourceSummary>;
  story_assets: Map<string, ResourceSummary>;
};

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
  } else if (selectedId && data.id !== selectedId) {
    issues.push({ severity: "warning", message: `파일명 ID와 JSON ID가 다릅니다. 파일명: ${selectedId}, JSON: ${data.id}` });
  }

  if (type === "characters") validateCharacter(data, issues);
  if (type === "items") validateItem(data, issues, maps);
  if (type === "chapters") validateChapter(data, issues, maps);
  if (type === "story_assets") validateStoryAsset(data, issues);
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

function validateCharacter(data: ResourceRecord, issues: ValidationIssue[]) {
  if (!data.display_name) issues.push({ severity: "error", message: "캐릭터 display_name이 비어 있습니다." });
  if (data.name_color && !/^#[0-9a-f]{6}$/i.test(String(data.name_color))) {
    issues.push({ severity: "warning", message: "name_color는 #RRGGBB 형식을 권장합니다." });
  }

  const portraits = data.portraits;
  if (portraits && typeof portraits === "object") {
    for (const [key, portrait] of Object.entries(portraits)) {
      const path = (portrait as ResourceRecord)?.path;
      if (!path) issues.push({ severity: "warning", message: `초상 ${key}에 path가 없습니다.` });
    }
  }
}

function validateItem(data: ResourceRecord, issues: ValidationIssue[], maps: ResourceMaps) {
  if (!data.name) issues.push({ severity: "error", message: "아이템 name이 비어 있습니다." });
  validateChapterScope(data.chapters, issues, maps);
  validateResPath(data.image, "아이템 이미지", issues, false);
}

function validateChapter(data: ResourceRecord, issues: ValidationIssue[], maps: ResourceMaps) {
  if (!data.title) issues.push({ severity: "error", message: "챕터 title이 비어 있습니다." });
  if (data.start_dialogue && !maps.dialogues.has(String(data.start_dialogue))) {
    issues.push({ severity: "warning", message: `start_dialogue가 존재하지 않는 대사를 가리킵니다: ${data.start_dialogue}` });
  }

  for (const dialogueId of asArray(data.dialogues)) {
    if (!maps.dialogues.has(String(dialogueId))) {
      issues.push({ severity: "warning", message: `챕터 dialogues에 없는 대사 ID가 있습니다: ${dialogueId}` });
    }
  }

  if (data.bgm && !maps.story_assets.has(String(data.bgm))) {
    issues.push({ severity: "warning", message: `챕터 BGM 에셋을 찾을 수 없습니다: ${data.bgm}` });
  }
}

function validateStoryAsset(data: ResourceRecord, issues: ValidationIssue[]) {
  const kind = normalizeKind(data.kind);
  if (!["bgm", "sfx", "background"].includes(kind)) {
    issues.push({ severity: "warning", message: `스토리 에셋 kind가 알려진 값이 아닙니다: ${data.kind}` });
  }
  validateResPath(data.path, "스토리 에셋 경로", issues, true);

  if (data.volume !== undefined) {
    const volume = Number(data.volume);
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
      issues.push({ severity: "warning", message: "volume은 0에서 1 사이 값을 권장합니다." });
    }
  }
}

function validateDialogue(data: ResourceRecord, issues: ValidationIssue[], maps: ResourceMaps) {
  if (!data.label) issues.push({ severity: "warning", message: "대사 label이 비어 있습니다." });
  validateChapterScope(data.chapters, issues, maps);

  const nodes = asArray<ResourceRecord>(data.nodes);
  const statementNodes = asArray<ResourceRecord>(data.statement_nodes);
  if (nodes.length === 0 && statementNodes.length === 0) {
    issues.push({ severity: "warning", message: "대사 nodes와 statement_nodes가 모두 비어 있습니다." });
  }

  nodes.forEach((node, index) => validateDialogueNode(node, `nodes[${index}]`, issues, maps));
  statementNodes.forEach((node, index) => validateDialogueNode(node, `statement_nodes[${index}]`, issues, maps));
}

function validateDialogueNode(node: ResourceRecord, path: string, issues: ValidationIssue[], maps: ResourceMaps) {
  const mode = String(node.mode || "").trim();
  if (mode === "cutscene") {
    if (!node.cutscene || typeof node.cutscene !== "object") {
      issues.push({ severity: "warning", message: `${path}: cutscene 노드는 cutscene 설정 객체가 필요합니다.` });
    }
    return;
  }

  if (node.speaker && node.speaker !== "narrator" && !maps.characters.has(String(node.speaker))) {
    issues.push({ severity: "warning", message: `${path}: 존재하지 않는 speaker입니다: ${node.speaker}` });
  }

  if (!node.text && !Array.isArray(node.choices)) {
    issues.push({ severity: "warning", message: `${path}: text나 choices가 없습니다.` });
  }

  validateStageCast(node.stage_cast, path, issues, maps);
  validateAcquireInfo(node.acquire_info, path, issues, maps);
  scanDialogueText(String(node.text || ""), path, issues, maps);

  for (const popup of asArray<ResourceRecord>(node.popups)) {
    validateResPath(popup.image || popup.path, `${path} popup 이미지`, issues, false);
  }

  for (const choice of asArray<ResourceRecord>(node.choices)) {
    for (const nested of asArray<ResourceRecord>(choice.nodes)) {
      validateDialogueNode(nested, `${path}.choices[].nodes[]`, issues, maps);
    }
  }

  for (const lie of asArray<ResourceRecord>(node.statement_lies)) {
    for (const [reactionIndex, reaction] of asArray<ResourceRecord>(lie.reactions).entries()) {
      validateStatementReaction(reaction, `${path}.statement_lies[].reactions[${reactionIndex}]`, issues, maps);
      for (const nested of asArray<ResourceRecord>(reaction.nodes)) {
        validateDialogueNode(nested, `${path}.statement_lies[].reactions[].nodes[]`, issues, maps);
      }
    }
  }
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
    if (record.portrait_zoom !== undefined && Number(record.portrait_zoom) < 0) {
      issues.push({ severity: "warning", message: `${path}: portrait_zoom은 0 이상이어야 합니다.` });
    }
  }
}

function validateAcquireInfo(value: unknown, path: string, issues: ValidationIssue[], maps: ResourceMaps) {
  if (!value || typeof value !== "object") return;
  const record = value as ResourceRecord;

  for (const characterId of asArray(record.characters)) {
    if (!maps.characters.has(String(characterId))) {
      issues.push({ severity: "warning", message: `${path}: acquire_info.characters에 없는 캐릭터가 있습니다: ${characterId}` });
    }
  }

  for (const itemId of asArray(record.items)) {
    if (!maps.items.has(String(itemId))) {
      issues.push({ severity: "warning", message: `${path}: acquire_info.items에 없는 아이템이 있습니다: ${itemId}` });
    }
  }
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
}

function validateChapterScope(value: unknown, issues: ValidationIssue[], maps: ResourceMaps) {
  for (const chapterId of asArray(value)) {
    if (!maps.chapters.has(String(chapterId))) {
      issues.push({ severity: "warning", message: `chapters에 없는 챕터 ID가 있습니다: ${chapterId}` });
    }
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

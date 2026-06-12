import type { ResourceRecord, ValidationIssue } from "../../types";
import type { NodeValidationContext, ResourceMaps } from "./shared";
import { isPlainRecord, normalizeSingleId, storyConditionKinds, topicIdPattern } from "./shared";

function isBooleanLike(value: unknown) {
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return value === 0 || value === 1;
  if (typeof value === "string") return ["true", "false", "1", "0", "yes", "no", "on", "off"].includes(value.trim().toLowerCase());
  return false;
}

export function validateOptionalBoolean(value: unknown, path: string, issues: ValidationIssue[]) {
  if (value === undefined) return;
  if (!isBooleanLike(value)) {
    issues.push({ severity: "warning", message: `${path}는 boolean 값이어야 합니다.` });
  }
}

export function validateSetFlags(value: unknown, path: string, issues: ValidationIssue[]) {
  if (value === undefined) return;
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `${path}는 객체 JSON이어야 합니다.` });
    return;
  }
  for (const key of Object.keys(value)) {
    if (!key.trim()) {
      issues.push({ severity: "warning", message: `${path}: 빈 플래그 키가 있습니다.` });
    }
  }
}

export function validateStoryConditions(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  maps: ResourceMaps,
  context: NodeValidationContext
) {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    issues.push({ severity: "warning", message: `${path}는 배열 JSON이어야 합니다.` });
    return;
  }
  value.forEach((condition, index) => validateStoryCondition(condition, `${path}[${index}]`, issues, maps, context));
}

function validateStoryCondition(
  condition: unknown,
  path: string,
  issues: ValidationIssue[],
  maps: ResourceMaps,
  context: NodeValidationContext
) {
  if (typeof condition === "string") {
    if (!condition.trim()) issues.push({ severity: "warning", message: `${path}: 빈 문자열 조건입니다.` });
    return;
  }
  if (!isPlainRecord(condition)) {
    issues.push({ severity: "warning", message: `${path}는 문자열 또는 객체여야 합니다.` });
    return;
  }
  if (Array.isArray(condition.all)) validateStoryConditions(condition.all, `${path}.all`, issues, maps, context);
  if (Array.isArray(condition.any)) validateStoryConditions(condition.any, `${path}.any`, issues, maps, context);
  if (condition.not !== undefined && typeof condition.not !== "boolean") {
    validateStoryCondition(condition.not, `${path}.not`, issues, maps, context);
  }
  if (condition.all !== undefined || condition.any !== undefined || (condition.not !== undefined && typeof condition.not !== "boolean")) {
    return;
  }

  const kind = normalizeStoryConditionKind(condition.kind ?? condition.type ?? condition.check ?? inferStoryConditionKind(condition));
  if (!kind) {
    issues.push({ severity: "warning", message: `${path}: 조건 kind를 알 수 없습니다.` });
    return;
  }
  if (!storyConditionKinds.has(kind)) {
    issues.push({ severity: "warning", message: `${path}: 지원하지 않는 조건 kind입니다: ${kind}` });
    return;
  }

  if (kind === "flag" || kind === "not_flag") {
    if (!conditionId(condition, ["key", "flag", "id", "name", "target"])) {
      issues.push({ severity: "warning", message: `${path}: flag 조건에는 key가 필요합니다.` });
    }
    return;
  }
  if (kind === "item" || kind === "not_item") {
    const id = conditionId(condition, ["target_id", "item_id", "id", "item", "target"]);
    if (!id) issues.push({ severity: "warning", message: `${path}: item 조건에는 id가 필요합니다.` });
    else if (!maps.items.has(id)) issues.push({ severity: "warning", message: `${path}: 없는 아이템 ID입니다: ${id}` });
    return;
  }
  if (kind === "character" || kind === "not_character") {
    const id = conditionId(condition, ["target_id", "character_id", "id", "character", "target"]);
    if (!id) issues.push({ severity: "warning", message: `${path}: character 조건에는 id가 필요합니다.` });
    else if (!maps.characters.has(id)) issues.push({ severity: "warning", message: `${path}: 없는 캐릭터 ID입니다: ${id}` });
    return;
  }
  if (kind === "topic_heard" || kind === "topic_unheard") {
    const id = conditionId(condition, ["topic_id", "choice_id", "id", "topic", "target_id", "target"]);
    if (!id) issues.push({ severity: "warning", message: `${path}: topic 조건에는 topic_id가 필요합니다.` });
    else if (!topicIdPattern.test(id)) issues.push({ severity: "warning", message: `${path}: topic_id 형식을 확인하세요: ${id}` });
    return;
  }
  if (kind === "node_seen" || kind === "node_unseen") {
    const id = conditionId(condition, ["node_id", "node", "line_id", "line", "id"]);
    const dialogueId = conditionId(condition, ["dialogue_id", "dialogue"]);
    if (!id) issues.push({ severity: "warning", message: `${path}: node 조건에는 node_id가 필요합니다.` });
    else if (!dialogueId && !context.idSet.has(id)) issues.push({ severity: "warning", message: `${path}: 현재 노드 목록에 없는 node_id입니다: ${id}` });
    return;
  }
  if (kind === "dialogue_seen" || kind === "dialogue_unseen") {
    const id = conditionId(condition, ["dialogue_id", "dialogue", "id", "target_id", "target"]);
    if (!id) issues.push({ severity: "warning", message: `${path}: dialogue 조건에는 dialogue_id가 필요합니다.` });
    else if (!maps.dialogues.has(id)) issues.push({ severity: "warning", message: `${path}: 없는 대사 ID입니다: ${id}` });
  }
}

function normalizeStoryConditionKind(value: unknown) {
  const kind = String(value || "").trim().toLowerCase();
  if (["flag", "story_flag", "has_flag"].includes(kind)) return "flag";
  if (["not_flag", "flag_not", "missing_flag"].includes(kind)) return "not_flag";
  if (["item", "item_acquired", "acquired_item", "clue", "evidence"].includes(kind)) return "item";
  if (["not_item", "item_missing", "unacquired_item", "no_item"].includes(kind)) return "not_item";
  if (["character", "character_acquired", "acquired_character", "profile"].includes(kind)) return "character";
  if (["not_character", "character_missing", "unacquired_character", "no_character"].includes(kind)) return "not_character";
  if (["topic", "topic_heard", "choice_heard", "conversation_heard", "heard"].includes(kind)) return "topic_heard";
  if (["topic_unheard", "choice_unheard", "conversation_unheard", "unheard"].includes(kind)) return "topic_unheard";
  if (["node", "node_seen", "line_seen"].includes(kind)) return "node_seen";
  if (["node_unseen", "line_unseen"].includes(kind)) return "node_unseen";
  if (["dialogue", "dialogue_seen"].includes(kind)) return "dialogue_seen";
  if (kind === "dialogue_unseen") return "dialogue_unseen";
  return kind;
}

function inferStoryConditionKind(condition: ResourceRecord) {
  if (condition.flag !== undefined || condition.key !== undefined) return "flag";
  if (condition.item !== undefined || condition.item_id !== undefined) return "item";
  if (condition.character !== undefined || condition.character_id !== undefined) return "character";
  if (condition.topic !== undefined || condition.topic_id !== undefined || condition.choice_id !== undefined) return "topic_heard";
  if (condition.node !== undefined || condition.node_id !== undefined) return "node_seen";
  if (condition.dialogue !== undefined || condition.dialogue_id !== undefined) return "dialogue_seen";
  return "";
}

function conditionId(condition: ResourceRecord, keys: string[]) {
  for (const key of keys) {
    const value = normalizeSingleId(condition[key]);
    if (value) return value;
  }
  return "";
}

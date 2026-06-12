import { asArray } from "../resourceConfig";
import type { ResourceRecord, ValidationIssue } from "../../types";
import type { ResourceMaps } from "./shared";
import { isPlainRecord, normalizeIdList } from "./shared";

export function validateAcquireInfo(value: unknown, path: string, issues: ValidationIssue[], maps: ResourceMaps) {
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

export function validateStatementNotebookScope(value: unknown, issues: ValidationIssue[], maps: ResourceMaps) {
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

export function getNodeAcquireInfoValue(node: ResourceRecord): unknown {
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

export function readAcquireInfo(value: unknown): { characters: unknown[]; items: unknown[] } {
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

import type { ResourceRecord, ValidationIssue } from "../../types";
import type { ResourceMaps } from "./shared";
import { getSummaryValidation, isPlainRecord } from "./shared";

export function scanDialogueText(text: string, path: string, issues: ValidationIssue[], maps: ResourceMaps) {
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

export function getStageCastPortraitIds(node: ResourceRecord, maps?: ResourceMaps) {
  const ids = new Set<string>();
  if (!isPlainRecord(node.stage_cast)) return ids;
  for (const [characterId, rawEntry] of Object.entries(node.stage_cast)) {
    if (characterId === "mystery" || !isPlainRecord(rawEntry)) continue;
    if (String(rawEntry.portrait || "").trim() || characterHasRig(characterId, maps)) ids.add(characterId);
  }
  return ids;
}

function characterHasRig(characterId: string, maps?: ResourceMaps) {
  if (!maps) return false;
  const character = maps.characters.get(characterId);
  const rigId = String(getSummaryValidation(character).rigId || "").trim();
  if (rigId && maps.character_rigs.has(rigId)) return true;
  for (const rig of maps.character_rigs.values()) {
    if (String(getSummaryValidation(rig).characterId || "").trim() === characterId) return true;
  }
  return false;
}

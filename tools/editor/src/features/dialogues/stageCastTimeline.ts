import { getEventTargetIds } from "../../components/RichTextEventUtils";
import {
  parseRichTextPreviewAst,
  type RichTextAstNode
} from "../../components/RichTextPreviewParser";
import { normalizeBooleanFlag } from "../../lib/numeric";
import type { ResourceRecord } from "../../types";
import { isCutsceneNode } from "./dialogueNodeModel";

export function normalizeEditorSpeakerId(value: unknown) {
  const speakerId = String(value || "").trim();
  return speakerId && speakerId !== "narrator" ? speakerId : "";
}

export function normalizeTimelineCharacterId(value: unknown) {
  const characterId = normalizeEditorSpeakerId(value);
  return characterId && characterId !== "mystery" ? characterId : "";
}

export function normalizeCharacterIdList(value: unknown) {
  const ids = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.replace(/[,;]/g, " ").split(/\s+/)
      : [];
  const seen = new Set<string>();
  const result: string[] = [];
  ids.forEach((rawId) => {
    const characterId = normalizeTimelineCharacterId(rawId);
    if (!characterId || seen.has(characterId)) return;
    seen.add(characterId);
    result.push(characterId);
  });
  return result;
}

export function getStageCastRecord(value: unknown): Record<string, ResourceRecord> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, ResourceRecord>
    : {};
}

export function getEnterIdsAtNode(index: number, nodes: ResourceRecord[]) {
  const before = new Set(computeStageCharacterIdsBeforeNode(index, nodes));
  return computeStageCharacterIdsAtNode(index, nodes)
    .filter((characterId) => !before.has(characterId));
}

export function computeStageCharacterIdsBeforeNode(nodeIndex: number, nodes: ResourceRecord[]) {
  const onStage = new Set<string>();
  const maxIndex = Math.min(Math.max(0, nodeIndex), nodes.length);
  for (let index = 0; index < maxIndex; index += 1) {
    const node = nodes[index];
    addNodeStagePresenceIds(onStage, node);
    getExitIdsFromNode(node).forEach((characterId) => onStage.delete(characterId));
  }
  return [...onStage].sort((a, b) => a.localeCompare(b));
}

export function computeStageCharacterIdsAtNode(nodeIndex: number, nodes: ResourceRecord[]) {
  const onStage = new Set(computeStageCharacterIdsBeforeNode(nodeIndex, nodes));
  addNodeStagePresenceIds(onStage, nodes[nodeIndex]);
  return [...onStage].sort((a, b) => a.localeCompare(b));
}

export function addNodeStagePresenceIds(target: Set<string>, node: ResourceRecord | undefined) {
  if (!node || isCutsceneNode(node)) return;
  const speakerId = normalizeTimelineCharacterId(node.speaker);
  if (speakerId) target.add(speakerId);
  getStageTextEventIdsFromNode(node, "enter").forEach((characterId) => target.add(characterId));
  getStageCastIdsFromNode(node).forEach((characterId) => target.add(characterId));
}

export function getStageCastIdsFromNode(node: ResourceRecord | undefined) {
  if (!node || isCutsceneNode(node)) return [];
  const ids: string[] = [];
  for (const [rawId, entry] of Object.entries(getStageCastRecord(node.stage_cast))) {
    const characterId = normalizeTimelineCharacterId(rawId);
    if (!characterId || ids.includes(characterId)) continue;
    if (!entry || typeof entry !== "object") continue;
    if (!String(entry.portrait || "").trim()) continue;
    ids.push(characterId);
  }
  return ids;
}

export function getExitIdsFromNode(node: ResourceRecord | undefined) {
  if (!node || isCutsceneNode(node)) return [];
  const ids = new Set<string>();
  getStageTextEventIdsFromNode(node, "exit").forEach((characterId) => ids.add(characterId));
  for (const [rawId, entry] of Object.entries(getStageCastRecord(node.stage_cast))) {
    const characterId = normalizeTimelineCharacterId(rawId);
    if (characterId && normalizeBooleanFlag(entry?.character_exit ?? entry?.exit)) ids.add(characterId);
  }
  const speakerId = normalizeTimelineCharacterId(node.speaker);
  if (speakerId && normalizeBooleanFlag(node.character_exit)) ids.add(speakerId);
  return [...ids].sort((a, b) => a.localeCompare(b));
}

export function getStageTextEventIdsFromNode(node: ResourceRecord | undefined, tagName: "enter" | "exit") {
  const ids: string[] = [];
  const seen = new Set<string>();
  const appendId = (rawId: unknown) => {
    const characterId = normalizeTimelineCharacterId(rawId);
    if (!characterId || seen.has(characterId)) return;
    seen.add(characterId);
    ids.push(characterId);
  };
  const visit = (entry: RichTextAstNode) => {
    if (entry.type === "event" && entry.tagName === tagName) {
      getEventTargetIds(entry.attrs).forEach(appendId);
    }
    if (entry.type === "span") entry.children.forEach(visit);
  };
  parseRichTextPreviewAst(String(node?.text || "")).forEach(visit);
  return ids;
}

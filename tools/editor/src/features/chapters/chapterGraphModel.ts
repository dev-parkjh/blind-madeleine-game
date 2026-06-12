import type { PointerPoint } from "../../editorTypes";
import { clampNumber, roundForInput } from "../../lib/numeric";
import type { ResourceRecord } from "../../types";
import {
  chapterGraphHeight,
  chapterGraphNodeHeight,
  chapterGraphNodeWidth,
  chapterGraphWidth
} from "./chapterModel";

export const chapterGraphDragThreshold = 4;
export const chapterGraphGridX = 410;
export const chapterGraphGridY = 230;
export const chapterGraphFitMargin = 96;
export const chapterGraphFitMaxZoom = 1.15;

export function autoChapterGraphPosition(index: number) {
  const column = index % 5;
  const row = Math.floor(index / 5);
  return {
    x: 80 + column * 320,
    y: 80 + row * 165
  };
}

export function chapterGraphNodePosition(positionMap: Record<string, [number, number]>, id: string, index: number) {
  const raw = positionMap[id];
  const fallback = autoChapterGraphPosition(index);
  return {
    x: clampNumber(Array.isArray(raw) ? raw[0] : undefined, 0, chapterGraphWidth - chapterGraphNodeWidth, fallback.x),
    y: clampNumber(Array.isArray(raw) ? raw[1] : undefined, 0, chapterGraphHeight - chapterGraphNodeHeight, fallback.y)
  };
}

export function clampChapterGraphNodePosition(x: number, y: number): [number, number] {
  return [
    Math.round(clampNumber(x, 0, chapterGraphWidth - chapterGraphNodeWidth, 0)),
    Math.round(clampNumber(y, 0, chapterGraphHeight - chapterGraphNodeHeight, 0))
  ];
}

export function autoLayoutChapterGraphPositions(
  placedIds: string[],
  dialogueData: Record<string, ResourceRecord>,
  positionMap: Record<string, [number, number]>
) {
  const incoming = new Map<string, number>();
  placedIds.forEach((id) => incoming.set(id, 0));
  placedIds.forEach((id) => {
    const next = getChapterGraphNext(dialogueData[id]);
    if (incoming.has(next)) incoming.set(next, (incoming.get(next) || 0) + 1);
  });

  const roots = placedIds.filter((id) => (incoming.get(id) || 0) === 0);
  const ordered: Array<{ id: string; depth: number }> = [];
  const seen = new Set<string>();
  const walk = (id: string, depth: number) => {
    if (!id || seen.has(id) || !placedIds.includes(id)) return;
    seen.add(id);
    ordered.push({ id, depth });
    const next = getChapterGraphNext(dialogueData[id]);
    if (next && placedIds.includes(next)) walk(next, depth + 1);
  };
  roots.forEach((id) => walk(id, 0));
  placedIds.forEach((id) => walk(id, 0));

  const rowsByDepth = new Map<number, number>();
  const nextPositions: Record<string, [number, number]> = { ...positionMap };
  ordered.forEach(({ id, depth }) => {
    const row = rowsByDepth.get(depth) || 0;
    rowsByDepth.set(depth, row + 1);
    nextPositions[id] = [120 + depth * chapterGraphGridX, 100 + row * chapterGraphGridY];
  });
  return nextPositions;
}

export function getChapterGraphMetadata(dialogue: ResourceRecord | undefined) {
  return dialogue?.metadata && typeof dialogue.metadata === "object" && !Array.isArray(dialogue.metadata)
    ? dialogue.metadata as ResourceRecord
    : {};
}

export function getChapterGraphNext(dialogue: ResourceRecord | undefined) {
  return String(getChapterGraphMetadata(dialogue).next_dialogue || "").trim();
}

export function getChapterGraphBlackout(dialogue: ResourceRecord | undefined) {
  return Boolean(getChapterGraphMetadata(dialogue).next_dialogue_blackout);
}

export function getChapterGraphBlackoutFade(dialogue: ResourceRecord | undefined) {
  return normalizeBlackoutDuration(getChapterGraphMetadata(dialogue).next_dialogue_blackout_fade_duration, 0.35);
}

export function getChapterGraphBlackoutHold(dialogue: ResourceRecord | undefined) {
  return normalizeBlackoutDuration(getChapterGraphMetadata(dialogue).next_dialogue_blackout_hold_duration, 0.3);
}

export function normalizeBlackoutDuration(value: unknown, fallback: number) {
  return roundForInput(clampNumber(value, 0, 30, fallback));
}

export function patchChapterGraphMetadata(current: ResourceRecord, patch: ResourceRecord) {
  const metadata = current.metadata && typeof current.metadata === "object" && !Array.isArray(current.metadata)
    ? { ...(current.metadata as ResourceRecord) }
    : {};
  const targetId = Object.prototype.hasOwnProperty.call(patch, "next_dialogue")
    ? String(patch.next_dialogue || "")
    : String(metadata.next_dialogue || "");

  if (Object.prototype.hasOwnProperty.call(patch, "next_dialogue")) {
    if (targetId) metadata.next_dialogue = targetId;
    else delete metadata.next_dialogue;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "next_dialogue_blackout")) {
    if (targetId && patch.next_dialogue_blackout) metadata.next_dialogue_blackout = true;
    else delete metadata.next_dialogue_blackout;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "next_dialogue_blackout_fade_duration")) {
    if (targetId) metadata.next_dialogue_blackout_fade_duration = normalizeBlackoutDuration(patch.next_dialogue_blackout_fade_duration, 0.35);
  }
  if (Object.prototype.hasOwnProperty.call(patch, "next_dialogue_blackout_hold_duration")) {
    if (targetId) metadata.next_dialogue_blackout_hold_duration = normalizeBlackoutDuration(patch.next_dialogue_blackout_hold_duration, 0.3);
  }
  if (!targetId || !metadata.next_dialogue_blackout) {
    delete metadata.next_dialogue_blackout;
    delete metadata.next_dialogue_blackout_fade_duration;
    delete metadata.next_dialogue_blackout_hold_duration;
  } else {
    metadata.next_dialogue_blackout_fade_duration = normalizeBlackoutDuration(metadata.next_dialogue_blackout_fade_duration, 0.35);
    metadata.next_dialogue_blackout_hold_duration = normalizeBlackoutDuration(metadata.next_dialogue_blackout_hold_duration, 0.3);
  }

  return {
    nextData: { ...current, metadata },
    targetId
  };
}

export function chapterGraphEdgePath(source: PointerPoint, target: PointerPoint) {
  const startX = source.x + chapterGraphNodeWidth;
  const startY = source.y + chapterGraphNodeHeight * 0.5;
  const endX = target.x;
  const endY = target.y + chapterGraphNodeHeight * 0.5;
  const handle = Math.max(80, Math.abs(endX - startX) * 0.45);
  return `M ${startX} ${startY} C ${startX + handle} ${startY}, ${endX - handle} ${endY}, ${endX} ${endY}`;
}

export function chapterGraphPreviewEdgePath(source: PointerPoint, target: PointerPoint) {
  const startX = source.x + chapterGraphNodeWidth;
  const startY = source.y + chapterGraphNodeHeight * 0.5;
  const endX = target.x;
  const endY = target.y;
  const handle = Math.max(80, Math.abs(endX - startX) * 0.45);
  return `M ${startX} ${startY} C ${startX + handle} ${startY}, ${endX - handle} ${endY}, ${endX} ${endY}`;
}

export function chapterGraphEdgeMenuPoint(source: PointerPoint, target: PointerPoint) {
  return {
    x: (source.x + chapterGraphNodeWidth + target.x) * 0.5,
    y: (source.y + chapterGraphNodeHeight * 0.5 + target.y + chapterGraphNodeHeight * 0.5) * 0.5
  };
}

export function getChapterGraphNodeBounds(position: PointerPoint) {
  return {
    minX: position.x,
    minY: position.y,
    maxX: position.x + chapterGraphNodeWidth,
    maxY: position.y + chapterGraphNodeHeight
  };
}

export function getChapterGraphBounds(placedIds: string[], positionFor: (id: string, index: number) => PointerPoint) {
  if (placedIds.length === 0) return null;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  placedIds.forEach((id, index) => {
    const position = positionFor(id, index);
    minX = Math.min(minX, position.x);
    minY = Math.min(minY, position.y);
    maxX = Math.max(maxX, position.x + chapterGraphNodeWidth);
    maxY = Math.max(maxY, position.y + chapterGraphNodeHeight);
  });
  return { minX, minY, maxX, maxY };
}

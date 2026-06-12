import { normalizeIdList, normalizeSingleId } from "../../lib/ids";
import { clampNumber } from "../../lib/numeric";
import { normalizeJsonObject } from "../../lib/records";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord } from "../../types";

export const chapterGraphWidth = 1800;
export const chapterGraphHeight = 1080;
export const chapterGraphNodeWidth = 250;
export const chapterGraphNodeHeight = 104;

export function getChapterTitleEditorValue(chapter: ResourceRecord) {
  return String(chapter.title || chapter.name || chapter.display_name || chapter.id || "").trim();
}

export function getChapterDialogueIds(chapter: ResourceRecord) {
  return normalizeIdList(chapter.dialogues ?? chapter.dialogue_ids);
}

export function toggleChapterDialogueId(chapter: ResourceRecord, id: string) {
  const current = new Set(getChapterDialogueIds(chapter));
  if (current.has(id)) current.delete(id);
  else current.add(id);
  return {
    ...chapter,
    dialogues: [...current]
  };
}

export function getChapterStartDialogueId(chapter: ResourceRecord) {
  return normalizeSingleId(chapter.start_dialogue ?? chapter.dialogue_id ?? chapter.first_dialogue);
}

export function getChapterBgmId(chapter: ResourceRecord) {
  return normalizeSingleId(chapter.bgm ?? chapter.bgm_id ?? chapter.chapter_bgm ?? chapter.chapter_select_bgm);
}

export function getChapterGraphPositionMap(chapter: ResourceRecord) {
  const layout = chapter.layout && typeof chapter.layout === "object" && !Array.isArray(chapter.layout) ? chapter.layout as ResourceRecord : {};
  const positions = layout.positions && typeof layout.positions === "object" && !Array.isArray(layout.positions)
    ? layout.positions as Record<string, unknown>
    : {};
  const normalized: Record<string, [number, number]> = {};
  for (const [id, value] of Object.entries(positions)) {
    const raw = asArray<number>(value);
    normalized[id] = [
      Math.round(clampNumber(raw[0], 0, chapterGraphWidth - chapterGraphNodeWidth, 80)),
      Math.round(clampNumber(raw[1], 0, chapterGraphHeight - chapterGraphNodeHeight, 80))
    ];
  }
  return normalized;
}

export function normalizeChapterDraftForSave(chapter: ResourceRecord): ResourceRecord {
  const dialogueIds = getChapterDialogueIds(chapter);
  const positions = getChapterGraphPositionMap(chapter);
  const exportPositions: Record<string, [number, number]> = {};
  for (const id of dialogueIds) {
    if (Array.isArray(positions[id])) exportPositions[id] = positions[id];
  }
  const layout = chapter.layout && typeof chapter.layout === "object" && !Array.isArray(chapter.layout) ? chapter.layout as ResourceRecord : {};
  const next: ResourceRecord = {
    ...chapter,
    id: normalizeSingleId(chapter.id),
    title: getChapterTitleEditorValue(chapter),
    order: Number.isFinite(Number(chapter.order)) ? Math.max(0, Math.round(Number(chapter.order))) : 0,
    start_dialogue: getChapterStartDialogueId(chapter),
    description: String(chapter.description || ""),
    dialogues: dialogueIds,
    layout: {
      ...layout,
      positions: exportPositions
    },
    metadata: normalizeJsonObject(chapter.metadata)
  };
  const image = String(chapter.image || "").trim();
  if (image) next.image = image;
  else delete next.image;
  const bgm = getChapterBgmId(chapter);
  if (bgm) next.bgm = bgm;
  else delete next.bgm;
  delete next.bgm_id;
  delete next.chapter_bgm;
  delete next.chapter_select_bgm;
  if (!chapter.parallax || typeof chapter.parallax !== "object" || Array.isArray(chapter.parallax)) {
    delete next.parallax;
  }
  return next;
}

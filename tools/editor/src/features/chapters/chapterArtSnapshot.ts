import type { ResourceRecord } from "../../types";

export type ChapterArtSnapshot = {
  chapterId: string;
  payload: ResourceRecord;
  serialized: string;
};

export function getChapterArtSnapshotPayload(chapter: ResourceRecord) {
  const payload: ResourceRecord = {
    image: String(chapter?.image || "")
  };
  if (Object.prototype.hasOwnProperty.call(chapter, "hasParallax")) {
    payload.hasParallax = cloneJsonValue(chapter.hasParallax);
  }
  if (Object.prototype.hasOwnProperty.call(chapter, "parallax")) {
    payload.parallax = cloneJsonValue(chapter.parallax);
  }
  return payload;
}

export function createChapterArtSnapshot(chapter: ResourceRecord): ChapterArtSnapshot {
  const payload = getChapterArtSnapshotPayload(chapter);
  return {
    chapterId: String(chapter.id || ""),
    payload,
    serialized: JSON.stringify(payload)
  };
}

export function applyChapterArtSnapshot(chapter: ResourceRecord, payload: ResourceRecord) {
  const next: ResourceRecord = { ...chapter, image: String(payload.image || "") };
  if (Object.prototype.hasOwnProperty.call(payload, "hasParallax")) {
    next.hasParallax = cloneJsonValue(payload.hasParallax);
  } else {
    delete next.hasParallax;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "parallax")) {
    next.parallax = cloneJsonValue(payload.parallax);
  } else {
    delete next.parallax;
  }
  return next;
}

function cloneJsonValue<T>(value: T): T {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

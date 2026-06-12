import { getResourceChapterScopeIds } from "../resources/resourceScope";
import { fileExtension, safeSegment } from "../../lib/files";
import { clampNumber } from "../../lib/numeric";
import { normalizeJsonObject } from "../../lib/records";
import { normalizeKind } from "../../lib/resourceConfig";
import type { ResourceRecord } from "../../types";

export function storyAssetUploadPath(asset: ResourceRecord, file: File) {
  const kind = normalizeKind(asset.kind || "sfx");
  const folder = kind === "bgm" ? "bgm" : kind === "background" ? "background" : "sfx";
  return `assets/story_assets/${folder}/${safeSegment(asset.id || "asset")}.${fileExtension(file)}`;
}

export function normalizeStoryAssetDraftForKind(asset: ResourceRecord, rawKind: unknown = asset.kind): ResourceRecord {
  const kind = normalizeKind(rawKind);
  const chapters = getResourceChapterScopeIds(asset);
  const next: ResourceRecord = {
    ...asset,
    kind,
    metadata: normalizeJsonObject(asset.metadata)
  };
  if (chapters.length > 0) next.chapters = chapters;
  else delete next.chapters;
  delete next.chapter_ids;
  if (kind === "background") {
    next.fixed = Boolean(asset.fixed ?? asset.background_fixed ?? next.metadata.fixed);
    delete next.volume;
    delete next.loop;
    delete next.background_fixed;
    return next;
  }
  next.volume = clampNumber(asset.volume, 0, 1, 1);
  delete next.fixed;
  delete next.background_fixed;
  delete next.loop;
  return next;
}

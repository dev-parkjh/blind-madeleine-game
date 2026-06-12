import { getResourceChapterScopeIds } from "../resources/resourceScope";
import { normalizeJsonObject } from "../../lib/records";
import type { ResourceRecord } from "../../types";

export function normalizeItemDraftForSave(item: ResourceRecord): ResourceRecord {
  const chapters = getResourceChapterScopeIds(item);
  const next: ResourceRecord = {
    ...item,
    name: String(item.name || item.display_name || item.id || "").trim(),
    description: String(item.description || ""),
    metadata: normalizeJsonObject(item.metadata)
  };
  if (chapters.length > 0) next.chapters = chapters;
  else delete next.chapters;
  delete next.chapter_ids;
  return next;
}

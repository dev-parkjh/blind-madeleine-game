import type { EditorLanguage } from "../../editorTypes";
import { normalizeIdList } from "../../lib/ids";
import { normalizeJsonObject } from "../../lib/records";
import type { ResourceRecord, ResourceSummary, ResourceType } from "../../types";

export function getResourceChapterScopeIds(resource: ResourceRecord) {
  const metadata = normalizeJsonObject(resource.metadata);
  return normalizeIdList(resource.chapters ?? resource.chapter_ids ?? metadata.chapters ?? metadata.chapter_ids);
}

export function getActiveDialogueChapterIds(draft: ResourceRecord | null, resourceChapterFilters: string[]) {
  const chapterFilter = resourceChapterFilters.find((filter) => filter.startsWith("chapter:"));
  if (chapterFilter) return [chapterFilter.slice("chapter:".length)];
  if (!draft) return [];
  return getResourceChapterScopeIds(draft);
}

export function toggleResourceChapterScope(resource: ResourceRecord, id: string) {
  const current = new Set(getResourceChapterScopeIds(resource));
  if (current.has(id)) current.delete(id);
  else current.add(id);
  return {
    ...resource,
    chapters: [...current]
  };
}

export function hasResourceChapterFilter(type: ResourceType) {
  return type === "dialogues" || type === "characters" || type === "items" || type === "story_assets";
}

export function buildResourceChapterFilterOptions(resources: ResourceSummary[], chapters: ResourceSummary[], language: EditorLanguage) {
  const chapterCounts = new Map<string, number>();
  let unassignedCount = 0;
  for (const resource of resources) {
    const chapterIds = resourceChapterIds(resource);
    if (chapterIds.length === 0) {
      unassignedCount += 1;
      continue;
    }
    for (const id of chapterIds) {
      chapterCounts.set(id, (chapterCounts.get(id) || 0) + 1);
    }
  }

  const unit = language === "ko" ? "개" : "";
  const formatCount = (count: number) => language === "ko" ? `${count}${unit}` : String(count);
  return [
    { value: "all", label: language === "ko" ? `전체 ${formatCount(resources.length)}` : `All ${formatCount(resources.length)}` },
    ...chapters.map((chapter) => ({
      value: `chapter:${chapter.id}`,
      label: `${chapter.title} ${formatCount(chapterCounts.get(chapter.id) || 0)}`
    })),
    { value: "unassigned", label: language === "ko" ? `미지정 ${formatCount(unassignedCount)}` : `Unassigned ${formatCount(unassignedCount)}` }
  ];
}

export function formatResourceChapterFilterLabel(selected: string[], options: Array<{ value: string; label: string }>, totalCount: number, language: EditorLanguage) {
  if (selected.length === 0) return language === "ko" ? `전체 ${totalCount}개` : `All ${totalCount}`;
  if (selected.length === 1) {
    const option = options.find((entry) => entry.value === selected[0]);
    return option?.label || (language === "ko" ? "필터 1" : "1 filter");
  }
  return language === "ko" ? `${selected.length}개 선택` : `${selected.length} selected`;
}

export function resourceMatchesChapterFilters(resource: ResourceSummary, filters: string[]) {
  if (filters.length === 0) return true;
  const chapterIds = resourceChapterIds(resource);
  return filters.some((filter) => {
    if (filter === "unassigned") return chapterIds.length === 0;
    if (filter.startsWith("chapter:")) return chapterIds.includes(filter.slice("chapter:".length));
    return false;
  });
}

export function resourceChapterIds(resource: ResourceSummary) {
  return Array.isArray(resource.chapterIds)
    ? resource.chapterIds.map((id) => String(id || "").trim()).filter(Boolean)
    : [];
}

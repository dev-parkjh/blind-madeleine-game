import { useMemo, useState } from "react";
import type { EditorLanguage } from "../../editorTypes";
import type { ResourceSummary, ResourceType } from "../../types";
import {
  buildResourceChapterFilterOptions,
  formatResourceChapterFilterLabel,
  hasResourceChapterFilter,
  resourceMatchesChapterFilters
} from "./resourceScope";

export function useResourceFilters({
  chapters,
  language,
  resources,
  type
}: {
  chapters: ResourceSummary[];
  language: EditorLanguage;
  resources: ResourceSummary[];
  type: ResourceType;
}) {
  const [search, setSearch] = useState("");
  const [resourceChapterFilters, setResourceChapterFilters] = useState<string[]>([]);

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesQuery = !query || [resource.id, resource.title, resource.subtitle]
        .some((value) => String(value || "").toLowerCase().includes(query));
      const matchesChapter = !hasResourceChapterFilter(type) || resourceMatchesChapterFilters(resource, resourceChapterFilters);
      return matchesQuery && matchesChapter;
    });
  }, [resourceChapterFilters, resources, search, type]);

  const resourceChapterFilterOptions = useMemo(
    () => buildResourceChapterFilterOptions(resources, chapters, language),
    [language, chapters, resources]
  );

  const resourceChapterFilterLabel = useMemo(
    () => formatResourceChapterFilterLabel(resourceChapterFilters, resourceChapterFilterOptions, resources.length, language),
    [language, resourceChapterFilterOptions, resourceChapterFilters, resources.length]
  );

  function toggleResourceChapterFilter(value: string) {
    if (value === "all") {
      setResourceChapterFilters([]);
      return;
    }
    setResourceChapterFilters((selected) => selected.includes(value)
      ? selected.filter((entry) => entry !== value)
      : [...selected, value]);
  }

  return {
    filteredResources,
    resourceChapterFilterLabel,
    resourceChapterFilterOptions,
    resourceChapterFilters,
    search,
    setResourceChapterFilters,
    setSearch,
    toggleResourceChapterFilter
  };
}

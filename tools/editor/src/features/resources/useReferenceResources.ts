import { useMemo } from "react";
import type { ReferenceResources } from "../../editorTypes";
import type { ProjectSummary } from "../../types";

export function useReferenceResources(summary: ProjectSummary | null): ReferenceResources {
  return useMemo(() => ({
    chapters: summary?.resources?.chapters?.resources || [],
    dialogues: summary?.resources?.dialogues?.resources || [],
    characters: summary?.resources?.characters?.resources || [],
    characterRigs: summary?.resources?.character_rigs?.resources || [],
    items: summary?.resources?.items?.resources || [],
    storyAssets: summary?.resources?.story_assets?.resources || []
  }), [summary]);
}

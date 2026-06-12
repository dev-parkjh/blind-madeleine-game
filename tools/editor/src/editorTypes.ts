import type { ResourceSummary } from "./types";

export type EditorTab = "form" | "nodes" | "graph" | "json" | "preview";
export type MobilePanel = "library" | "workspace" | "inspector";
export type EditorLanguage = "ko" | "en";
export type EditorThemeMode = "dark" | "light";
export type EditorThemeAccent = "green" | "blue" | "rose" | "amber" | "custom";
export type DialogueNodeMode = "dialogue" | "stage" | "cutscene";
export type PreviewMode = "web" | "pc" | "fold7" | "fold7-open";
export type PointerPoint = { x: number; y: number };

export type ReferenceResources = {
  chapters: ResourceSummary[];
  dialogues: ResourceSummary[];
  characters: ResourceSummary[];
  characterRigs: ResourceSummary[];
  items: ResourceSummary[];
  storyAssets: ResourceSummary[];
};

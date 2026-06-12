import type { EditorCopy } from "../../editorText";
import type { EditorTab } from "../../editorTypes";
import type { ResourceType } from "../../types";

export function editorTabsForResource(type: ResourceType): EditorTab[] {
  if (type === "dialogues") return ["form", "nodes", "json", "preview"];
  if (type === "chapters") return ["form", "graph", "json", "preview"];
  return ["form", "json", "preview"];
}

export function defaultEditorTabForResource(type: ResourceType): EditorTab {
  if (type === "dialogues") return "nodes";
  if (type === "chapters") return "graph";
  return "form";
}

export function tabLabel(tab: EditorTab, ui: EditorCopy): string {
  return ui.tabs[tab];
}

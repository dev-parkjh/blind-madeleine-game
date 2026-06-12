import type { EditorLanguage, EditorTab } from "../../editorTypes";
import { editorText } from "../../editorText";
import { describeResourceForLanguage } from "../../lib/editorPreferences";
import { titleFor } from "../../lib/resourceConfig";
import type { ResourceRecord, ResourceType, ValidationIssue } from "../../types";

export function useEditorViewState({
  activeTab,
  dirty,
  draft,
  isAppBusy,
  issues,
  jsonError,
  language,
  pendingTaskLabel,
  selectedId,
  type
}: {
  activeTab: EditorTab;
  dirty: boolean;
  draft: ResourceRecord | null;
  isAppBusy: boolean;
  issues: ValidationIssue[];
  jsonError: unknown;
  language: EditorLanguage;
  pendingTaskLabel: string;
  selectedId: string;
  type: ResourceType;
}) {
  const ui = editorText[language];
  return {
    canRunGame: Boolean(!jsonError && !isAppBusy && (!dirty || (selectedId && draft))),
    canSave: Boolean(selectedId && draft && dirty && !jsonError && !isAppBusy),
    currentDescription: describeResourceForLanguage(type, draft, language),
    currentTitle: titleFor(type, draft, selectedId),
    dirtyBadgeClass: isAppBusy ? "pending" : jsonError ? "error" : dirty ? "dirty" : "clean",
    dirtyBadgeText: isAppBusy ? pendingTaskLabel : jsonError ? ui.status.jsonError : dirty ? ui.status.dirty : ui.status.clean,
    issueCount: issues.filter((issue) => issue.severity !== "info").length,
    showPortraitTabAction: type === "characters" && activeTab === "form" && Boolean(draft)
  };
}

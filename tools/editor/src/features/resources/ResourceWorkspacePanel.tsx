import { useEffect, useRef, useState } from "react";
import type { EditorView } from "@codemirror/view";
import type { EditorTab, ReferenceResources } from "../../editorTypes";
import type { JsonEditorError } from "../../components/JsonEditor";
import type { ResourceRecord, ResourceType, ValidationIssue } from "../../types";
import { useCharacterPortraitActions } from "../characters/useCharacterPortraitActions";
import { useDialogueNodeActions } from "../dialogues/useDialogueNodeActions";
import { ResourceWorkspaceContent } from "./ResourceWorkspaceContent";

export function ResourceWorkspacePanel({
  activeTab,
  bridgeEndpoint,
  currentDescription,
  currentTitle,
  dirtyBadgeClass,
  dirtyBadgeText,
  draft,
  isAppBusy,
  issues,
  jsonError,
  jsonText,
  referenceResources,
  resourceChapterFilters,
  savedJsonText,
  selectedId,
  showPortraitTabAction,
  type,
  visibleTabs,
  notify,
  onFormatJson,
  onJsonChange,
  onJumpJsonError,
  onNavigateToStoryAssets,
  onOpenDialogue,
  onReplaceDraft,
  onSetJsonEditorView,
  onSetTab,
  onUpdateField,
  onUpdateMetadataField,
  uploadFile
}: {
  activeTab: EditorTab;
  bridgeEndpoint: string;
  currentDescription: string;
  currentTitle: string;
  dirtyBadgeClass: string;
  dirtyBadgeText: string;
  draft: ResourceRecord | null;
  isAppBusy: boolean;
  issues: ValidationIssue[];
  jsonError: JsonEditorError | null;
  jsonText: string;
  referenceResources: ReferenceResources;
  resourceChapterFilters: string[];
  savedJsonText: string;
  selectedId: string;
  showPortraitTabAction: boolean;
  type: ResourceType;
  visibleTabs: EditorTab[];
  notify: (message: string) => void;
  onFormatJson: () => void;
  onJsonChange: (text: string) => void;
  onJumpJsonError: () => void;
  onNavigateToStoryAssets: () => void;
  onOpenDialogue: (dialogueId: string) => void;
  onReplaceDraft: (nextDraft: ResourceRecord) => void;
  onSetJsonEditorView: (view: EditorView | null) => void;
  onSetTab: (tab: EditorTab) => void;
  onUpdateField: (field: string, value: unknown) => void;
  onUpdateMetadataField: (field: string, value: unknown) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  const nodeTextRef = useRef<HTMLTextAreaElement | null>(null);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);
  const { addCharacterPortrait } = useCharacterPortraitActions({
    draft,
    type,
    updateField: onUpdateField
  });

  const dialogueNodeActions = useDialogueNodeActions({
    draft,
    type,
    characters: referenceResources.characters,
    selectedNodeIndex,
    nodeTextRef,
    applyDraft: onReplaceDraft,
    setSelectedNodeIndex,
    setTab: onSetTab
  });

  useEffect(() => {
    setSelectedNodeIndex(0);
  }, [selectedId, type]);

  return (
    <ResourceWorkspaceContent
      activeTab={activeTab}
      bridgeEndpoint={bridgeEndpoint}
      currentDescription={currentDescription}
      currentTitle={currentTitle}
      dialogueNodeActions={dialogueNodeActions}
      dirtyBadgeClass={dirtyBadgeClass}
      dirtyBadgeText={dirtyBadgeText}
      draft={draft}
      isAppBusy={isAppBusy}
      issues={issues}
      jsonError={jsonError}
      jsonText={jsonText}
      nodeTextRef={nodeTextRef}
      referenceResources={referenceResources}
      resourceChapterFilters={resourceChapterFilters}
      savedJsonText={savedJsonText}
      selectedId={selectedId}
      selectedNodeIndex={selectedNodeIndex}
      showPortraitTabAction={showPortraitTabAction}
      type={type}
      visibleTabs={visibleTabs}
      notify={notify}
      onAddCharacterPortrait={addCharacterPortrait}
      onFormatJson={onFormatJson}
      onJsonChange={onJsonChange}
      onJumpJsonError={onJumpJsonError}
      onNavigateToStoryAssets={onNavigateToStoryAssets}
      onOpenDialogue={onOpenDialogue}
      onReplaceDraft={onReplaceDraft}
      onSetJsonEditorView={onSetJsonEditorView}
      onSetSelectedNodeIndex={setSelectedNodeIndex}
      onSetStartDialogue={(dialogueId) => onUpdateField("start_dialogue", dialogueId)}
      onSetTab={onSetTab}
      onUpdateField={onUpdateField}
      onUpdateMetadataField={onUpdateMetadataField}
      uploadFile={uploadFile}
    />
  );
}

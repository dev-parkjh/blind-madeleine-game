import type { MutableRefObject } from "react";
import type { EditorView } from "@codemirror/view";
import { Icon } from "../../components/EditorControls";
import {
  JsonCodeEditor,
  JsonErrorPanel,
  type JsonEditorError
} from "../../components/JsonEditor";
import { useUiText } from "../../editorText";
import type { EditorTab, ReferenceResources } from "../../editorTypes";
import type { ResourceRecord, ResourceType, ValidationIssue } from "../../types";
import { ChapterGraphEditor } from "../chapters/ChapterGraphEditor";
import { DialogueNodesPanel } from "../dialogues/DialogueNodesPanel";
import type { DialogueNodeActions } from "../dialogues/useDialogueNodeActions";
import { getDialogueFirstTextPreview } from "../dialogues/dialogueNodeOptions";
import { ResourceFormPanel } from "./ResourceFormPanel";
import { ResourcePreviewPanel } from "./ResourcePreviewPanel";
import { tabLabel } from "./editorTabs";

export function ResourceWorkspaceContent({
  activeTab,
  bridgeEndpoint,
  currentDescription,
  currentTitle,
  dialogueNodeActions,
  dirtyBadgeClass,
  dirtyBadgeText,
  draft,
  isAppBusy,
  issues,
  jsonError,
  jsonText,
  nodeTextRef,
  referenceResources,
  resourceChapterFilters,
  savedJsonText,
  selectedId,
  selectedNodeIndex,
  showPortraitTabAction,
  type,
  visibleTabs,
  notify,
  onAddCharacterPortrait,
  onFormatJson,
  onJsonChange,
  onJumpJsonError,
  onNavigateToStoryAssets,
  onOpenDialogue,
  onReplaceDraft,
  onSetJsonEditorView,
  onSetSelectedNodeIndex,
  onSetStartDialogue,
  onSetTab,
  onUpdateField,
  onUpdateMetadataField,
  uploadFile
}: {
  activeTab: EditorTab;
  bridgeEndpoint: string;
  currentDescription: string;
  currentTitle: string;
  dialogueNodeActions: DialogueNodeActions;
  dirtyBadgeClass: string;
  dirtyBadgeText: string;
  draft: ResourceRecord | null;
  isAppBusy: boolean;
  issues: ValidationIssue[];
  jsonError: JsonEditorError | null;
  jsonText: string;
  nodeTextRef: MutableRefObject<HTMLTextAreaElement | null>;
  referenceResources: ReferenceResources;
  resourceChapterFilters: string[];
  savedJsonText: string;
  selectedId: string;
  selectedNodeIndex: number;
  showPortraitTabAction: boolean;
  type: ResourceType;
  visibleTabs: EditorTab[];
  notify: (message: string) => void;
  onAddCharacterPortrait: () => void;
  onFormatJson: () => void;
  onJsonChange: (text: string) => void;
  onJumpJsonError: () => void;
  onNavigateToStoryAssets: () => void;
  onOpenDialogue: (dialogueId: string) => void;
  onReplaceDraft: (nextDraft: ResourceRecord) => void;
  onSetJsonEditorView: (view: EditorView | null) => void;
  onSetSelectedNodeIndex: (index: number) => void;
  onSetStartDialogue: (dialogueId: string) => void;
  onSetTab: (tab: EditorTab) => void;
  onUpdateField: (field: string, value: unknown) => void;
  onUpdateMetadataField: (field: string, value: unknown) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  const ui = useUiText();

  return (
    <section className="workspace-panel" aria-label={ui.panels.workspace}>
      <div className="workspace-header">
        <div>
          <p>{ui.resources[type]}</p>
          <h2>{currentTitle}</h2>
          <span>{currentDescription}</span>
        </div>
        <div className={`dirty-badge ${dirtyBadgeClass}`} aria-live="polite">
          {dirtyBadgeText}
        </div>
      </div>

      <div className="workspace-tab-row">
        <div className="tab-bar" role="tablist">
          {visibleTabs.map((entry) => (
            <button className={activeTab === entry ? "active" : ""} key={entry} type="button" onClick={() => onSetTab(entry)}>
              {tabLabel(entry, ui)}
            </button>
          ))}
        </div>
        {showPortraitTabAction && (
          <button className="tab-row-action" disabled={isAppBusy || !draft} type="button" onClick={onAddCharacterPortrait}>
            <Icon name="Add" />
            <span>{ui.form.addPortrait}</span>
          </button>
        )}
      </div>

      <div className={`workspace-body workspace-body-${activeTab} ${isAppBusy ? "busy" : ""}`} aria-busy={isAppBusy}>
        {activeTab === "form" && (
          <ResourceFormPanel
            disabled={isAppBusy}
            draft={draft}
            type={type}
            references={referenceResources}
            updateField={onUpdateField}
            updateMetadataField={onUpdateMetadataField}
            uploadFile={uploadFile}
            replaceDraft={onReplaceDraft}
            savedJsonText={savedJsonText}
            notify={notify}
          />
        )}
        {type === "chapters" && activeTab === "graph" && (
          draft ? (
            <ChapterGraphEditor
              disabled={isAppBusy}
              draft={draft}
              dialogues={referenceResources.dialogues}
              notify={notify}
              onOpenDialogue={onOpenDialogue}
              replaceDraft={onReplaceDraft}
              setStartDialogue={onSetStartDialogue}
              getDialoguePreview={getDialogueFirstTextPreview}
            />
          ) : (
            <p className="empty-state">{ui.common.selectItem}</p>
          )
        )}
        {type === "dialogues" && activeTab === "nodes" && (
          <DialogueNodesPanel
            draft={draft}
            references={referenceResources}
            resourceChapterFilters={resourceChapterFilters}
            selectedNodeIndex={selectedNodeIndex}
            nodeTextRef={nodeTextRef}
            setSelectedNodeIndex={onSetSelectedNodeIndex}
            {...dialogueNodeActions}
            onNavigateToStoryAssets={onNavigateToStoryAssets}
            bridgeEndpoint={bridgeEndpoint}
            notify={notify}
            selectedId={selectedId}
          />
        )}
        {activeTab === "json" && (
          <div className="json-editor">
            <div className="json-editor-header">
              JSON
              <button className="inline-text-action" type="button" onClick={onFormatJson}>{ui.common.format}</button>
            </div>
            {jsonError && <JsonErrorPanel error={jsonError} onJump={onJumpJsonError} />}
            <JsonCodeEditor
              invalid={Boolean(jsonError)}
              label="JSON"
              value={jsonText}
              onChange={onJsonChange}
              onView={onSetJsonEditorView}
              placeholderText={ui.form.empty}
              placeholder="목록에서 항목을 선택하세요."
            />
          </div>
        )}
        {activeTab === "preview" && (
          <ResourcePreviewPanel draft={draft} type={type} issues={issues} />
        )}
      </div>
    </section>
  );
}

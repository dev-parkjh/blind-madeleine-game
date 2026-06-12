import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { EditorView } from "@codemirror/view";
import type { EditorLanguage, EditorTab, MobilePanel, ReferenceResources } from "../../editorTypes";
import type { JsonEditorError } from "../../components/JsonEditor";
import type { ProjectSummary, ResourceRecord, ResourceSummary, ResourceType, ValidationIssue } from "../../types";
import { ResourceCollectionPanel } from "./ResourceCollectionPanel";
import { ResourceInspectorPanel } from "./ResourceInspectorPanel";
import { ResourceWorkspacePanel } from "./ResourceWorkspacePanel";

type ChapterFilterOption = {
  value: string;
  label: string;
};

export function ResourceEditorGrid({
  activeTab,
  bridgeEndpoint,
  collectionPanelOpen,
  currentDescription,
  currentTitle,
  dirtyBadgeClass,
  dirtyBadgeText,
  draft,
  filteredResources,
  inspectorPanelOpen,
  isAppBusy,
  issues,
  jsonError,
  jsonText,
  language,
  mobilePanel,
  notify,
  referenceResources,
  resourceChapterFilterLabel,
  resourceChapterFilterOptions,
  resourceChapterFilters,
  resourceFilterMenuRef,
  savedJsonText,
  search,
  selectedId,
  setCollectionPanelOpen,
  setInspectorPanelOpen,
  setSearch,
  showPortraitTabAction,
  summary,
  type,
  visibleTabs,
  onFormatJson,
  onJsonChange,
  onJumpJsonError,
  onNavigateToStoryAssets,
  onOpenDialogue,
  onReplaceDraft,
  onSelectResource,
  onSetJsonEditorView,
  onSetTab,
  onToggleResourceChapterFilter,
  onUpdateField,
  onUpdateMetadataField,
  uploadFile
}: {
  activeTab: EditorTab;
  bridgeEndpoint: string;
  collectionPanelOpen: boolean;
  currentDescription: string;
  currentTitle: string;
  dirtyBadgeClass: string;
  dirtyBadgeText: string;
  draft: ResourceRecord | null;
  filteredResources: ResourceSummary[];
  inspectorPanelOpen: boolean;
  isAppBusy: boolean;
  issues: ValidationIssue[];
  jsonError: JsonEditorError | null;
  jsonText: string;
  language: EditorLanguage;
  mobilePanel: MobilePanel;
  notify: (message: string) => void;
  referenceResources: ReferenceResources;
  resourceChapterFilterLabel: string;
  resourceChapterFilterOptions: ChapterFilterOption[];
  resourceChapterFilters: string[];
  resourceFilterMenuRef: MutableRefObject<HTMLDetailsElement | null>;
  savedJsonText: string;
  search: string;
  selectedId: string;
  setCollectionPanelOpen: Dispatch<SetStateAction<boolean>>;
  setInspectorPanelOpen: Dispatch<SetStateAction<boolean>>;
  setSearch: (search: string) => void;
  showPortraitTabAction: boolean;
  summary: ProjectSummary | null;
  type: ResourceType;
  visibleTabs: EditorTab[];
  onFormatJson: () => void;
  onJsonChange: (text: string) => void;
  onJumpJsonError: () => void;
  onNavigateToStoryAssets: () => void;
  onOpenDialogue: (dialogueId: string) => void;
  onReplaceDraft: (nextDraft: ResourceRecord) => void;
  onSelectResource: (resourceId: string) => void;
  onSetJsonEditorView: (view: EditorView | null) => void;
  onSetTab: (tab: EditorTab) => void;
  onToggleResourceChapterFilter: (value: string) => void;
  onUpdateField: (field: string, value: unknown) => void;
  onUpdateMetadataField: (field: string, value: unknown) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  return (
    <main className={`editor-grid mobile-${mobilePanel} ${collectionPanelOpen ? "collection-expanded" : "collection-collapsed"} ${inspectorPanelOpen ? "inspector-expanded" : "inspector-collapsed"}`}>
      <ResourceCollectionPanel
        collectionPanelOpen={collectionPanelOpen}
        filteredResources={filteredResources}
        language={language}
        resourceChapterFilterLabel={resourceChapterFilterLabel}
        resourceChapterFilterOptions={resourceChapterFilterOptions}
        resourceChapterFilters={resourceChapterFilters}
        resourceFilterMenuRef={resourceFilterMenuRef}
        search={search}
        selectedId={selectedId}
        setCollectionPanelOpen={setCollectionPanelOpen}
        setSearch={setSearch}
        type={type}
        onSelectResource={onSelectResource}
        onToggleResourceChapterFilter={onToggleResourceChapterFilter}
      />

      <ResourceWorkspacePanel
        activeTab={activeTab}
        bridgeEndpoint={bridgeEndpoint}
        currentDescription={currentDescription}
        currentTitle={currentTitle}
        dirtyBadgeClass={dirtyBadgeClass}
        dirtyBadgeText={dirtyBadgeText}
        draft={draft}
        isAppBusy={isAppBusy}
        issues={issues}
        jsonError={jsonError}
        jsonText={jsonText}
        referenceResources={referenceResources}
        resourceChapterFilters={resourceChapterFilters}
        savedJsonText={savedJsonText}
        selectedId={selectedId}
        showPortraitTabAction={showPortraitTabAction}
        type={type}
        visibleTabs={visibleTabs}
        notify={notify}
        onFormatJson={onFormatJson}
        onJsonChange={onJsonChange}
        onJumpJsonError={onJumpJsonError}
        onNavigateToStoryAssets={onNavigateToStoryAssets}
        onOpenDialogue={onOpenDialogue}
        onReplaceDraft={onReplaceDraft}
        onSetJsonEditorView={onSetJsonEditorView}
        onSetTab={onSetTab}
        onUpdateField={onUpdateField}
        onUpdateMetadataField={onUpdateMetadataField}
        uploadFile={uploadFile}
      />

      <ResourceInspectorPanel
        inspectorPanelOpen={inspectorPanelOpen}
        language={language}
        setInspectorPanelOpen={setInspectorPanelOpen}
        summary={summary}
        issues={issues}
      />
    </main>
  );
}

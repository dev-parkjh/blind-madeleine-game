import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type { EditorLanguage, MobilePanel } from "../../editorTypes";
import { editorText } from "../../editorText";
import { isMobileEditorLayout } from "../../lib/editorLayout";
import { useGameRunner } from "../../lib/useGameRunner";
import { useProjectFileUpload } from "../../lib/useProjectFileUpload";
import type { ProjectSummary, ResourceSummary, ResourceType } from "../../types";
import { useEditorDraft } from "./useEditorDraft";
import { useEditorIssues } from "./useEditorIssues";
import { useEditorTabs } from "./useEditorTabs";
import { useEditorViewState } from "./useEditorViewState";
import { useReferenceResources } from "./useReferenceResources";
import { useResourceCommands } from "./useResourceCommands";
import { useResourceFilters } from "./useResourceFilters";

export function useResourceEditorController({
  bridgeEndpoint,
  isAppBusy,
  language,
  notify,
  pendingTaskLabel,
  pendingTaskRef,
  runPendingTask
}: {
  bridgeEndpoint: string;
  isAppBusy: boolean;
  language: EditorLanguage;
  notify: (message: string) => void;
  pendingTaskLabel: string;
  pendingTaskRef: MutableRefObject<boolean>;
  runPendingTask: <T>(label: string, task: () => Promise<T>) => Promise<T>;
}) {
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [type, setType] = useState<ResourceType>("dialogues");
  const [resources, setResources] = useState<ResourceSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(() => isMobileEditorLayout() ? "library" : "workspace");
  const [mobileFabOpen, setMobileFabOpen] = useState(false);
  const [collectionPanelOpen, setCollectionPanelOpen] = useState(() => !isMobileEditorLayout());
  const [inspectorPanelOpen, setInspectorPanelOpen] = useState(() => !isMobileEditorLayout());
  const resourceFilterMenuRef = useRef<HTMLDetailsElement | null>(null);
  const {
    applyDraft,
    clearDraft,
    dirty,
    draft,
    formatJsonText,
    jsonError,
    jsonText,
    jumpToJsonError,
    loadDraft,
    onJsonChange,
    savedJsonText,
    setJsonEditorView,
    updateField,
    updateMetadataField
  } = useEditorDraft();
  const { activeTab, setTab, visibleTabs } = useEditorTabs(type);
  const issues = useEditorIssues({ draft, jsonError, selectedId, summary, type });
  const referenceResources = useReferenceResources(summary);
  const {
    filteredResources,
    resourceChapterFilterLabel,
    resourceChapterFilterOptions,
    resourceChapterFilters,
    search,
    setResourceChapterFilters,
    setSearch,
    toggleResourceChapterFilter
  } = useResourceFilters({
    chapters: referenceResources.chapters,
    language,
    resources,
    type
  });
  const { uploadFile, uploadFileAndImport } = useProjectFileUpload({
    bridgeEndpoint,
    notify,
    pendingTaskRef,
    runPendingTask
  });
  const {
    boot,
    changeType,
    createCurrent,
    deleteCurrent,
    openDialogueInEditor,
    refreshAll,
    saveCurrent,
    saveSelectedDraft,
    selectResource
  } = useResourceCommands({
    clearDraft,
    dirty,
    draft,
    jsonError,
    language,
    loadDraft,
    notify,
    pendingTaskRef,
    referenceResources,
    runPendingTask,
    selectedId,
    setMobileFabOpen,
    setMobilePanel,
    setResourceChapterFilters,
    setResources,
    setSearch,
    setSelectedId,
    setSummary,
    setTab,
    setType,
    type,
    uploadFileAndImport
  });
  const { runGameFromEditor } = useGameRunner({
    bridgeEndpoint,
    bridgeRequiredMessage: editorText[language].preview.bridgeRequired,
    dirty,
    jsonError,
    language,
    notify,
    pendingTaskRef,
    runPendingTask,
    saveSelectedDraft
  });

  useEffect(() => {
    void boot();
  }, []);

  const {
    canRunGame,
    canSave,
    currentDescription,
    currentTitle,
    dirtyBadgeClass,
    dirtyBadgeText,
    issueCount,
    showPortraitTabAction
  } = useEditorViewState({
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
  });

  return {
    dirty,
    resourceFilterMenuRef,
    topBarProps: {
      canRunGame,
      canSave,
      isAppBusy,
      selectedId,
      summary,
      type,
      onChangeType: (nextType: ResourceType) => void changeType(nextType),
      onCreate: () => void createCurrent(),
      onDelete: () => void deleteCurrent(),
      onRefresh: () => void refreshAll(),
      onRunGame: () => void runGameFromEditor(),
      onSave: () => void saveCurrent()
    },
    gridProps: {
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
      notify,
      onFormatJson: formatJsonText,
      onJsonChange,
      onJumpJsonError: jumpToJsonError,
      onNavigateToStoryAssets: () => setType("story_assets"),
      onOpenDialogue: (dialogueId: string) => void openDialogueInEditor(dialogueId),
      onReplaceDraft: applyDraft,
      onSelectResource: (resourceId: string) => void selectResource(type, resourceId),
      onSetJsonEditorView: setJsonEditorView,
      onSetTab: setTab,
      onToggleResourceChapterFilter: toggleResourceChapterFilter,
      onUpdateField: updateField,
      onUpdateMetadataField: updateMetadataField,
      uploadFile
    },
    mobileFabProps: {
      canSave,
      isAppBusy,
      issueCount,
      mobileFabOpen,
      mobilePanel,
      setMobileFabOpen,
      setMobilePanel,
      onCreate: () => void createCurrent(),
      onSave: () => void saveCurrent()
    }
  };
}

import type { MutableRefObject } from "react";
import type { EditorLanguage, EditorTab, MobilePanel, ReferenceResources } from "../../editorTypes";
import { uploadChapterThumbnailForDraft } from "../chapters/chapterThumbnail";
import { defaultEditorTabForResource } from "./editorTabs";
import { prepareDraftForSave } from "./resourceSave";
import {
  createResource,
  deleteResource,
  getProjectSummary,
  listResources,
  loadResource,
  saveResource
} from "../../lib/api";
import { isMobileEditorLayout } from "../../lib/editorLayout";
import { formatGodotImportStatus, type ProjectAssetUploadResult } from "../../lib/godotBridge";
import { makeUuid, resourceConfig } from "../../lib/resourceConfig";
import type { ProjectSummary, ResourceRecord, ResourceSummary, ResourceType } from "../../types";

export function useResourceCommands({
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
}: {
  clearDraft: () => void;
  dirty: boolean;
  draft: ResourceRecord | null;
  jsonError: unknown;
  language: EditorLanguage;
  loadDraft: (nextDraft: ResourceRecord) => void;
  notify: (message: string) => void;
  pendingTaskRef: MutableRefObject<boolean>;
  referenceResources: ReferenceResources;
  runPendingTask: <T>(label: string, task: () => Promise<T>) => Promise<T>;
  selectedId: string;
  setMobileFabOpen: (open: boolean) => void;
  setMobilePanel: (panel: MobilePanel) => void;
  setResourceChapterFilters: (filters: string[]) => void;
  setResources: (resources: ResourceSummary[]) => void;
  setSearch: (search: string) => void;
  setSelectedId: (id: string) => void;
  setSummary: (summary: ProjectSummary | null) => void;
  setTab: (tab: EditorTab) => void;
  setType: (type: ResourceType) => void;
  type: ResourceType;
  uploadFileAndImport: (relativePath: string, file: File) => Promise<ProjectAssetUploadResult>;
}) {
  function confirmDiscard() {
    if (!dirty) return true;
    return window.confirm("저장하지 않은 변경이 있습니다. 계속할까요?");
  }

  async function refreshSummary() {
    const nextSummary = await getProjectSummary();
    setSummary(nextSummary);
    return nextSummary;
  }

  async function refreshList(nextType = type, selectFirst = false) {
    const body = await listResources(nextType);
    setResources(body.resources);
    if (selectFirst && body.resources.length > 0) {
      await selectResource(nextType, body.resources[0].id, true);
    }
  }

  async function boot() {
    try {
      await refreshSummary();
      await refreshList("dialogues", !isMobileEditorLayout());
      if (isMobileEditorLayout()) setMobilePanel("library");
      notify("프로젝트 데이터 로드 완료");
    } catch (error) {
      notify((error as Error).message);
    }
  }

  async function changeType(nextType: ResourceType) {
    if (pendingTaskRef.current) return;
    if (nextType === type) {
      setTab(defaultEditorTabForResource(nextType));
      setMobilePanel("library");
      setMobileFabOpen(false);
      return;
    }
    if (!confirmDiscard()) return;
    setType(nextType);
    setSelectedId("");
    clearDraft();
    setSearch("");
    setResourceChapterFilters([]);
    setResources([]);
    setTab(defaultEditorTabForResource(nextType));
    setMobilePanel("library");
    setMobileFabOpen(false);
    await refreshList(nextType, false);
  }

  async function openDialogueInEditor(dialogueId: string) {
    if (!dialogueId) return;
    await selectResource("dialogues", dialogueId);
    setTab("nodes");
  }

  async function selectResource(nextType: ResourceType, id: string, force = false) {
    if (pendingTaskRef.current && !force) return;
    if (!force && nextType === type && id === selectedId) {
      setMobilePanel("workspace");
      setMobileFabOpen(false);
      return;
    }
    if (!force && !confirmDiscard()) return;
    if (nextType !== type) {
      setType(nextType);
      await refreshList(nextType, false);
    }
    const body = await loadResource(nextType, id);
    setSelectedId(id);
    loadDraft(body.data);
    setTab(defaultEditorTabForResource(nextType));
    setMobilePanel("workspace");
  }

  async function refreshAll() {
    if (pendingTaskRef.current || !confirmDiscard()) return;
    try {
      await runPendingTask("새로고침 중", async () => {
        await refreshSummary();
        await refreshList(type, false);
        if (selectedId) await selectResource(type, selectedId, true);
        notify("새로고침 완료");
      });
    } catch (error) {
      notify(`새로고침 실패: ${(error as Error).message}`);
    }
  }

  async function createCurrent() {
    if (pendingTaskRef.current || !confirmDiscard()) return;
    try {
      await runPendingTask("새 항목 생성 중", async () => {
        const id = makeUuid();
        const body = await createResource(type, resourceConfig[type].empty(id));
        await refreshSummary();
        await refreshList(type, false);
        setSelectedId(body.summary.id);
        loadDraft(body.data);
        setTab(defaultEditorTabForResource(type));
        setMobilePanel("workspace");
        setMobileFabOpen(false);
        notify("새 항목 생성 완료");
      });
    } catch (error) {
      notify(`새 항목 생성 실패: ${(error as Error).message}`);
    }
  }

  async function deleteCurrent() {
    if (pendingTaskRef.current || !selectedId || !window.confirm(`${resourceConfig[type].singularLabel} ${selectedId} 파일을 삭제할까요?`)) return;
    try {
      await runPendingTask("삭제 중", async () => {
        await deleteResource(type, selectedId);
        setSelectedId("");
        clearDraft();
        await refreshSummary();
        await refreshList(type, !isMobileEditorLayout());
        if (isMobileEditorLayout()) setMobilePanel("library");
        notify("삭제 완료");
      });
    } catch (error) {
      notify(`삭제 실패: ${(error as Error).message}`);
    }
  }

  async function saveSelectedDraft(notifySuccess = true) {
    if (!selectedId || !draft || jsonError) {
      throw new Error(language === "ko" ? "저장할 항목이 없습니다." : "There is no item to save.");
    }
    const thumbnailResult = type === "chapters" ? await uploadChapterThumbnailForDraft(draft, uploadFileAndImport) : null;
    const nextDraft = prepareDraftForSave(type, thumbnailResult?.draft || draft, referenceResources);
    const body = await saveResource(type, selectedId, nextDraft);
    setSelectedId(body.summary.id);
    loadDraft(body.data);
    await refreshSummary();
    await refreshList(type, false);
    if (notifySuccess) {
      notify(thumbnailResult && !thumbnailResult.skipped
        ? `저장 완료 · 썸네일 ${thumbnailResult.resPath} · ${formatGodotImportStatus(thumbnailResult.importStatus)}`
        : "저장 완료");
    }
    return { data: body.data, id: body.summary.id };
  }

  async function saveCurrent() {
    if (pendingTaskRef.current || !selectedId || !draft || jsonError) return;
    try {
      await runPendingTask("저장 중", async () => {
        await saveSelectedDraft(true);
      });
    } catch (error) {
      notify(`저장 실패: ${(error as Error).message}`);
    }
  }

  return {
    boot,
    changeType,
    createCurrent,
    deleteCurrent,
    openDialogueInEditor,
    refreshAll,
    saveCurrent,
    saveSelectedDraft,
    selectResource
  };
}

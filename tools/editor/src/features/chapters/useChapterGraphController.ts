import type { PointerEvent as ReactPointerEvent } from "react";
import { useMemo, useState } from "react";
import type { PointerPoint } from "../../editorTypes";
import { loadResource, saveResource } from "../../lib/api";
import type { ResourceRecord, ResourceSummary } from "../../types";
import {
  getChapterDialogueIds,
  getChapterGraphPositionMap,
  getChapterStartDialogueId
} from "./chapterModel";
import {
  autoChapterGraphPosition,
  autoLayoutChapterGraphPositions,
  chapterGraphNodePosition,
  clampChapterGraphNodePosition,
  getChapterGraphNext,
  patchChapterGraphMetadata
} from "./chapterGraphModel";
import {
  buildNextDialogueSelectOptions,
  filterChapterDialogues,
  getIncomingChapterGraphIds,
  getSelectedChapterGraphEdgeMenuPoint
} from "./chapterGraphControllerModel";
import { useChapterGraphDragController } from "./useChapterGraphDragController";
import { useChapterGraphDialogueData } from "./useChapterGraphDialogueData";
import { useChapterGraphViewport } from "./useChapterGraphViewport";

export function useChapterGraphController({
  disabled,
  dialogues,
  draft,
  notify,
  replaceDraft
}: {
  disabled: boolean;
  dialogues: ResourceSummary[];
  draft: ResourceRecord;
  notify: (message: string) => void;
  replaceDraft: (nextDraft: ResourceRecord) => void;
}) {
  const placedIds = useMemo(() => getChapterDialogueIds(draft), [draft.dialogues, draft.dialogue_ids]);
  const positionMap = getChapterGraphPositionMap(draft);
  const dialogueSummaryMap = useMemo(() => new Map(dialogues.map((dialogue) => [dialogue.id, dialogue])), [dialogues]);
  const unplacedDialogues = useMemo(() => dialogues.filter((dialogue) => !placedIds.includes(dialogue.id)), [dialogues, placedIds]);
  const { dialogueData, loading, setDialogueData } = useChapterGraphDialogueData(placedIds);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [dialogueSearch, setDialogueSearch] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [selectedEdgeFromId, setSelectedEdgeFromId] = useState("");
  const [edgeSourceId, setEdgeSourceId] = useState("");
  const [dialogueToPlaceId, setDialogueToPlaceId] = useState("");
  const [connectionPointer, setConnectionPointer] = useState<PointerPoint | null>(null);
  const selectedEdge = selectedEdgeFromId ? getChapterGraphNext(dialogueData[selectedEdgeFromId]) : "";
  const incomingIds = getIncomingChapterGraphIds(placedIds, selectedNodeId, dialogueData);
  const filteredDialogues = useMemo(() => filterChapterDialogues(dialogues, dialogueSearch), [dialogues, dialogueSearch]);
  const startDialogueId = getChapterStartDialogueId(draft);

  function nodePosition(id: string, index: number) {
    return chapterGraphNodePosition(positionMap, id, index);
  }

  const {
    fitGraphToView,
    graphPointFromPointer,
    graphZoom,
    setGraphZoom,
    stageRef
  } = useChapterGraphViewport({ placedIds, nodePosition });

  function replaceChapterGraph(nextIds: string[], nextPositions: Record<string, [number, number]>) {
    const layout = draft.layout && typeof draft.layout === "object" && !Array.isArray(draft.layout) ? draft.layout as ResourceRecord : {};
    const startDialogue = getChapterStartDialogueId(draft);
    replaceDraft({
      ...draft,
      dialogues: nextIds,
      layout: {
        ...layout,
        positions: nextPositions
      },
      start_dialogue: nextIds.includes(startDialogue) ? startDialogue : (nextIds[0] || "")
    });
  }

  function setNodePosition(id: string, x: number, y: number) {
    replaceChapterGraph(placedIds, {
      ...positionMap,
      [id]: clampChapterGraphNodePosition(x, y)
    });
  }

  function autoLayoutAllDialogues() {
    if (placedIds.length === 0) return;
    replaceChapterGraph(placedIds, autoLayoutChapterGraphPositions(placedIds, dialogueData, positionMap));
    window.setTimeout(() => fitGraphToView(), 0);
  }

  function focusDialogueOnGraph(id: string) {
    if (!id) return;
    if (!placedIds.includes(id)) {
      addDialogueToGraph(id);
      window.setTimeout(() => fitGraphToView(id), 0);
      return;
    }
    setSelectedNodeId(id);
    setSelectedEdgeFromId("");
    window.setTimeout(() => fitGraphToView(id), 0);
  }

  function addDialogueToGraph(id: string) {
    const nextId = id || unplacedDialogues[0]?.id || "";
    if (!nextId || placedIds.includes(nextId)) return;
    const nextIds = [...placedIds, nextId];
    const position = autoChapterGraphPosition(nextIds.length - 1);
    replaceChapterGraph(nextIds, {
      ...positionMap,
      [nextId]: [position.x, position.y]
    });
    setSelectedNodeId(nextId);
    setDialogueToPlaceId("");
  }

  function removePlacedDialogue(id: string) {
    const nextPositions = { ...positionMap };
    delete nextPositions[id];
    replaceChapterGraph(placedIds.filter((entry) => entry !== id), nextPositions);
    if (selectedNodeId === id) setSelectedNodeId("");
    if (selectedEdgeFromId === id) setSelectedEdgeFromId("");
    if (edgeSourceId === id) {
      setEdgeSourceId("");
      setConnectionPointer(null);
    }
  }

  function startConnectionFromPort(event: ReactPointerEvent<HTMLElement>, id: string) {
    if (disabled || busy) return;
    event.stopPropagation();
    setEdgeSourceId(edgeSourceId === id ? "" : id);
    setSelectedNodeId(id);
    setSelectedEdgeFromId("");
    setConnectionPointer(graphPointFromPointer(event));
  }

  function connectToInputPort(event: ReactPointerEvent<HTMLElement>, id: string) {
    event.stopPropagation();
    if (edgeSourceId && edgeSourceId !== id) {
      connectToTarget(id);
      return;
    }
    setSelectedNodeId(id);
    setSelectedEdgeFromId("");
  }

  function updateConnectionPointer(event: ReactPointerEvent<HTMLElement>) {
    if (!edgeSourceId) return;
    const point = graphPointFromPointer(event);
    if (point) setConnectionPointer(point);
  }

  async function saveDialogueGraphMetadata(sourceId: string, patch: ResourceRecord) {
    if (disabled || busy) return;
    setBusy(true);
    setStatus("");
    try {
      const current = dialogueData[sourceId] || (await loadResource("dialogues", sourceId)).data;
      const { nextData, targetId } = patchChapterGraphMetadata(current, patch);
      const saved = await saveResource("dialogues", sourceId, nextData);
      setDialogueData((data) => ({ ...data, [sourceId]: saved.data }));
      setStatus(targetId ? `${sourceId} -> ${targetId} 저장됨` : `${sourceId} 연결 해제됨`);
      notify("챕터 그래프 연결 저장 완료");
    } catch (error) {
      const message = `챕터 그래프 저장 실패: ${(error as Error).message}`;
      setStatus(message);
      notify(message);
    } finally {
      setBusy(false);
    }
  }

  function connectToTarget(targetId: string) {
    if (!edgeSourceId || edgeSourceId === targetId) return;
    void saveDialogueGraphMetadata(edgeSourceId, {
      next_dialogue: targetId,
      next_dialogue_blackout: false
    });
    setSelectedEdgeFromId(edgeSourceId);
    setEdgeSourceId("");
    setConnectionPointer(null);
  }

  function clearSelectedConnection() {
    if (selectedEdgeFromId) {
      void saveDialogueGraphMetadata(selectedEdgeFromId, { next_dialogue: "" });
      return;
    }
    if (selectedNodeId) {
      void saveDialogueGraphMetadata(selectedNodeId, { next_dialogue: "" });
    }
  }

  function cancelConnection() {
    setEdgeSourceId("");
    setConnectionPointer(null);
  }

  function selectEdge(sourceId: string) {
    setSelectedEdgeFromId(sourceId);
    setSelectedNodeId("");
  }

  function selectIncomingEdge(sourceId: string) {
    selectEdge(sourceId);
  }

  function toggleConnectionSource(dialogueId: string) {
    setEdgeSourceId(edgeSourceId === dialogueId ? "" : dialogueId);
    setSelectedNodeId(dialogueId);
    setSelectedEdgeFromId("");
  }

  const graphDrag = useChapterGraphDragController({
    connectToTarget,
    disabled,
    edgeSourceId,
    graphZoom,
    nodePosition,
    setNodePosition,
    setSelectedEdgeFromId,
    setSelectedNodeId,
    stageRef,
    updateConnectionPointer
  });

  const selectedEdgeMenuPoint = getSelectedChapterGraphEdgeMenuPoint({
    nodePosition,
    placedIds,
    selectedEdge,
    selectedEdgeFromId
  });
  const selectedNodeData = selectedNodeId ? dialogueData[selectedNodeId] : undefined;
  const selectedNodeNext = getChapterGraphNext(selectedNodeData);
  const nextDialogueSelectOptions = buildNextDialogueSelectOptions(placedIds, selectedNodeId, dialogueSummaryMap);

  return {
    addDialogueToGraph,
    autoLayoutAllDialogues,
    busy,
    cancelConnection,
    clearGraphSelectionFromStage: graphDrag.clearGraphSelectionFromStage,
    clearSelectedConnection,
    connectToInputPort,
    connectionPointer,
    dialogueData,
    dialogueSearch,
    dialogueSummaryMap,
    dialogueToPlaceId,
    edgeSourceId,
    filteredDialogues,
    fitGraphToView,
    focusDialogueOnGraph,
    graphZoom,
    incomingIds,
    loading,
    nextDialogueSelectOptions,
    nodePosition,
    placedIds,
    pointerMoveOnCanvas: graphDrag.pointerMoveOnCanvas,
    removePlacedDialogue,
    saveDialogueGraphMetadata,
    selectEdge,
    selectIncomingEdge,
    selectedEdge,
    selectedEdgeFromId,
    selectedEdgeMenuPoint,
    selectedNodeData,
    selectedNodeId,
    selectedNodeNext,
    setDialogueSearch,
    setDialogueToPlaceId,
    setGraphZoom,
    setSelectedEdgeFromId,
    setSelectedNodeId,
    setConnectionPointer,
    stageRef,
    startConnectionFromPort,
    startDialogueId,
    startNodeDrag: graphDrag.startNodeDrag,
    status,
    stopNodeDrag: graphDrag.stopNodeDrag,
    toggleConnectionSource,
    unplacedDialogues
  };
}

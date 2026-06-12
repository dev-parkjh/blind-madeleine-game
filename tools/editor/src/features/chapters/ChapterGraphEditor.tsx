import { useUiText } from "../../editorText";
import type { ResourceRecord, ResourceSummary } from "../../types";
import { ChapterGraphCanvas } from "./ChapterGraphCanvas";
import { ChapterGraphDialogueList } from "./ChapterGraphDialogueList";
import { ChapterGraphInspector } from "./ChapterGraphInspector";
import { ChapterGraphToolbar } from "./ChapterGraphToolbar";
import { useChapterGraphController } from "./useChapterGraphController";

export function ChapterGraphEditor({
  disabled,
  draft,
  dialogues,
  notify,
  onOpenDialogue,
  replaceDraft,
  setStartDialogue,
  getDialoguePreview
}: {
  disabled: boolean;
  draft: ResourceRecord;
  dialogues: ResourceSummary[];
  notify: (message: string) => void;
  onOpenDialogue: (dialogueId: string) => void;
  replaceDraft: (nextDraft: ResourceRecord) => void;
  setStartDialogue: (dialogueId: string) => void;
  getDialoguePreview: (dialogue: ResourceRecord | undefined) => string;
}) {
  const ui = useUiText();
  const graph = useChapterGraphController({
    disabled,
    dialogues,
    draft,
    notify,
    replaceDraft
  });

  return (
    <section className="chapter-graph-editor chapter-graph-workspace-root">
      <ChapterGraphDialogueList
        dialogues={graph.filteredDialogues}
        emptyLabel={ui.common.emptyList}
        onFocusDialogue={graph.focusDialogueOnGraph}
        onSearchChange={graph.setDialogueSearch}
        placedIds={graph.placedIds}
        searchLabel={ui.common.search}
        searchValue={graph.dialogueSearch}
        selectedNodeId={graph.selectedNodeId}
        startDialogueId={graph.startDialogueId}
      />

      <div className="chapter-graph-main">
        <ChapterGraphToolbar
          busy={graph.busy}
          disabled={disabled}
          dialogueToPlaceId={graph.dialogueToPlaceId}
          edgeSourceId={graph.edgeSourceId}
          graphZoom={graph.graphZoom}
          loading={graph.loading}
          onAddDialogue={graph.addDialogueToGraph}
          onAutoLayout={graph.autoLayoutAllDialogues}
          onCancelConnection={graph.cancelConnection}
          onClearConnection={graph.clearSelectedConnection}
          onFitGraph={() => graph.fitGraphToView(graph.selectedNodeId || undefined)}
          onSelectDialogueToPlace={graph.setDialogueToPlaceId}
          onZoomChange={graph.setGraphZoom}
          placedCount={graph.placedIds.length}
          selectedEdgeFromId={graph.selectedEdgeFromId}
          selectedNodeId={graph.selectedNodeId}
          status={graph.status}
          unplacedDialogues={graph.unplacedDialogues}
        />
        <ChapterGraphCanvas
          busy={graph.busy}
          connectionPointer={graph.connectionPointer}
          dialogueData={graph.dialogueData}
          dialogueSummaryMap={graph.dialogueSummaryMap}
          disabled={disabled}
          edgeSourceId={graph.edgeSourceId}
          getDialoguePreview={getDialoguePreview}
          graphZoom={graph.graphZoom}
          loading={graph.loading}
          nodePosition={graph.nodePosition}
          onClearSelectedEdge={() => void graph.saveDialogueGraphMetadata(graph.selectedEdgeFromId, { next_dialogue: "" })}
          onCloseSelectedEdge={() => graph.setSelectedEdgeFromId("")}
          onConnectToInputPort={graph.connectToInputPort}
          onPointerMove={graph.pointerMoveOnCanvas}
          onPointerUp={graph.stopNodeDrag}
          onRemovePlacedDialogue={graph.removePlacedDialogue}
          onSelectEdge={graph.selectEdge}
          onShowSelectedEdgeDetails={() => graph.setSelectedNodeId("")}
          onStageClick={graph.clearGraphSelectionFromStage}
          onStagePointerLeave={() => graph.setConnectionPointer(null)}
          onStartConnectionFromPort={graph.startConnectionFromPort}
          onStartNodeDrag={graph.startNodeDrag}
          onToggleConnectionSource={graph.toggleConnectionSource}
          placedIds={graph.placedIds}
          selectedEdgeFromId={graph.selectedEdgeFromId}
          selectedEdgeMenuPoint={graph.selectedEdgeMenuPoint}
          selectedNodeId={graph.selectedNodeId}
          stageRef={graph.stageRef}
          startDialogueId={graph.startDialogueId}
        />
      </div>

      <ChapterGraphInspector
        busy={graph.busy}
        disabled={disabled}
        getDialoguePreview={getDialoguePreview}
        incomingIds={graph.incomingIds}
        nextDialogueSelectOptions={graph.nextDialogueSelectOptions}
        onOpenDialogue={onOpenDialogue}
        onRemovePlacedDialogue={graph.removePlacedDialogue}
        onSaveMetadata={(sourceId, patch) => void graph.saveDialogueGraphMetadata(sourceId, patch)}
        onSelectIncomingEdge={graph.selectIncomingEdge}
        onSetStartDialogue={setStartDialogue}
        selectedEdge={graph.selectedEdge}
        selectedEdgeData={graph.selectedEdgeFromId ? graph.dialogueData[graph.selectedEdgeFromId] : undefined}
        selectedEdgeFromId={graph.selectedEdgeFromId}
        selectedNodeData={graph.selectedNodeData}
        selectedNodeId={graph.selectedNodeId}
        selectedNodeNext={graph.selectedNodeNext}
        startDialogueId={graph.startDialogueId}
        titleForDialogue={(dialogueId) => graph.dialogueSummaryMap.get(dialogueId)?.title || dialogueId}
      />
    </section>
  );
}

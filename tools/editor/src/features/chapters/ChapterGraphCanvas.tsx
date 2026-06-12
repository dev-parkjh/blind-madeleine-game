import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, RefObject } from "react";
import { Icon } from "../../components/EditorControls";
import type { PointerPoint } from "../../editorTypes";
import type { ResourceRecord, ResourceSummary } from "../../types";
import {
  chapterGraphHeight,
  chapterGraphWidth
} from "./chapterModel";
import {
  chapterGraphEdgePath,
  chapterGraphPreviewEdgePath,
  getChapterGraphBlackout,
  getChapterGraphNext
} from "./chapterGraphModel";

export function ChapterGraphCanvas({
  busy,
  connectionPointer,
  dialogueData,
  dialogueSummaryMap,
  disabled,
  edgeSourceId,
  getDialoguePreview,
  graphZoom,
  loading,
  onClearSelectedEdge,
  onCloseSelectedEdge,
  onConnectToInputPort,
  onPointerMove,
  onPointerUp,
  onRemovePlacedDialogue,
  onSelectEdge,
  onShowSelectedEdgeDetails,
  onStageClick,
  onStagePointerLeave,
  onStartConnectionFromPort,
  onStartNodeDrag,
  onToggleConnectionSource,
  placedIds,
  selectedEdgeFromId,
  selectedEdgeMenuPoint,
  selectedNodeId,
  stageRef,
  startDialogueId,
  nodePosition
}: {
  busy: boolean;
  connectionPointer: PointerPoint | null;
  dialogueData: Record<string, ResourceRecord>;
  dialogueSummaryMap: Map<string, ResourceSummary>;
  disabled: boolean;
  edgeSourceId: string;
  getDialoguePreview: (dialogue: ResourceRecord | undefined) => string;
  graphZoom: number;
  loading: boolean;
  onClearSelectedEdge: () => void;
  onCloseSelectedEdge: () => void;
  onConnectToInputPort: (event: ReactPointerEvent<HTMLElement>, dialogueId: string) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onRemovePlacedDialogue: (dialogueId: string) => void;
  onSelectEdge: (sourceId: string) => void;
  onShowSelectedEdgeDetails: () => void;
  onStageClick: (event: ReactMouseEvent<HTMLElement>) => void;
  onStagePointerLeave: () => void;
  onStartConnectionFromPort: (event: ReactPointerEvent<HTMLElement>, dialogueId: string) => void;
  onStartNodeDrag: (event: ReactPointerEvent<HTMLElement>, dialogueId: string, index: number) => void;
  onToggleConnectionSource: (dialogueId: string) => void;
  placedIds: string[];
  selectedEdgeFromId: string;
  selectedEdgeMenuPoint: PointerPoint | null;
  selectedNodeId: string;
  stageRef: RefObject<HTMLDivElement | null>;
  startDialogueId: string;
  nodePosition: (dialogueId: string, index: number) => PointerPoint;
}) {
  return (
    <div
      className="chapter-graph-stage"
      onClick={onStageClick}
      onPointerLeave={onStagePointerLeave}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      ref={stageRef}
    >
      <div className="chapter-graph-world" style={{ width: chapterGraphWidth * graphZoom, height: chapterGraphHeight * graphZoom }}>
        <div className="chapter-graph-world-content" style={{ transform: `scale(${graphZoom})` }}>
          <svg className="chapter-graph-connections" viewBox={`0 0 ${chapterGraphWidth} ${chapterGraphHeight}`} aria-hidden="true">
            {placedIds.map((sourceId, index) => {
              const nextId = getChapterGraphNext(dialogueData[sourceId]);
              const targetIndex = placedIds.indexOf(nextId);
              if (!nextId || targetIndex < 0) return null;
              const source = nodePosition(sourceId, index);
              const target = nodePosition(nextId, targetIndex);
              const selected = selectedEdgeFromId === sourceId;
              return (
                <path
                  className={`chapter-graph-edge ${selected ? "selected" : ""} ${getChapterGraphBlackout(dialogueData[sourceId]) ? "blackout" : ""}`}
                  d={chapterGraphEdgePath(source, target)}
                  key={`${sourceId}-${nextId}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectEdge(sourceId);
                  }}
                />
              );
            })}
            {edgeSourceId && connectionPointer && placedIds.includes(edgeSourceId) && (
              <path
                className="chapter-graph-edge preview"
                d={chapterGraphPreviewEdgePath(nodePosition(edgeSourceId, placedIds.indexOf(edgeSourceId)), connectionPointer)}
              />
            )}
          </svg>
          {placedIds.length === 0 && <p className="chapter-graph-empty">챕터에 배치된 대화가 없습니다. 목록에서 대화를 선택하거나 위에서 추가하세요.</p>}
          {placedIds.map((id, index) => {
            const position = nodePosition(id, index);
            const summary = dialogueSummaryMap.get(id);
            const data = dialogueData[id];
            const nextId = getChapterGraphNext(data);
            const isStart = id === startDialogueId;
            const isSource = id === edgeSourceId;
            const isTargetCandidate = Boolean(edgeSourceId && edgeSourceId !== id);
            return (
              <article
                className={`chapter-graph-node ${selectedNodeId === id ? "selected" : ""} ${isSource ? "edge-source" : ""} ${isTargetCandidate ? "target-candidate" : ""}`}
                key={id}
                onClick={(event) => {
                  event.stopPropagation();
                }}
                onPointerDown={(event) => onStartNodeDrag(event, id, index)}
                style={{ left: position.x, top: position.y }}
              >
                <button
                  aria-label={`${id} input port`}
                  className="chapter-graph-port port-in"
                  disabled={disabled || busy}
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => onConnectToInputPort(event, id)}
                  type="button"
                />
                <button
                  aria-label={`${id} output port`}
                  className="chapter-graph-port port-out"
                  disabled={disabled || busy}
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => onStartConnectionFromPort(event, id)}
                  type="button"
                />
                <div className="chapter-graph-node-header">
                  <strong>{summary?.title || data?.label || id}</strong>
                  {isStart && <span>start</span>}
                </div>
                <code>{id}</code>
                <p>{summary?.subtitle || getDialoguePreview(data) || (loading ? "불러오는 중..." : "미리보기 없음")}</p>
                <div className="chapter-graph-node-actions">
                  <button disabled={disabled || busy} type="button" onClick={(event) => {
                    event.stopPropagation();
                    onToggleConnectionSource(id);
                  }}>
                    <Icon name="ForkRight" />연결
                  </button>
                  <button disabled={disabled || busy || !nextId} type="button" onClick={(event) => {
                    event.stopPropagation();
                    onSelectEdge(id);
                  }}>
                    <Icon name="Timeline" />edge
                  </button>
                  <button className="danger-action" disabled={disabled} type="button" onClick={(event) => {
                    event.stopPropagation();
                    onRemovePlacedDialogue(id);
                  }}>
                    <Icon name="Delete" />제거
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        {selectedEdgeMenuPoint && (
          <div
            className="chapter-graph-edge-menu"
            role="menu"
            style={{ left: selectedEdgeMenuPoint.x * graphZoom, top: selectedEdgeMenuPoint.y * graphZoom }}
          >
            <button aria-label="Edge details" type="button" onClick={onShowSelectedEdgeDetails}><Icon name="Timeline" /></button>
            <button aria-label="Delete edge" className="danger-action" disabled={disabled || busy} type="button" onClick={onClearSelectedEdge}><Icon name="Delete" /></button>
            <button aria-label="Close edge menu" type="button" onClick={onCloseSelectedEdge}><Icon name="Close" /></button>
          </div>
        )}
      </div>
    </div>
  );
}

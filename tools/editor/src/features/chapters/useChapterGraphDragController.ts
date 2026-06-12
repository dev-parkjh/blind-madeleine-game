import type {
  MouseEvent as ReactMouseEvent,
  MutableRefObject,
  PointerEvent as ReactPointerEvent
} from "react";
import { useRef } from "react";
import {
  chapterGraphDragThreshold
} from "./chapterGraphModel";

type ChapterGraphDrag = {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  originalX: number;
  originalY: number;
  active: boolean;
};

export function useChapterGraphDragController({
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
}: {
  connectToTarget: (targetId: string) => void;
  disabled: boolean;
  edgeSourceId: string;
  graphZoom: number;
  nodePosition: (id: string, index: number) => { x: number; y: number };
  setNodePosition: (id: string, x: number, y: number) => void;
  setSelectedEdgeFromId: (id: string) => void;
  setSelectedNodeId: (id: string) => void;
  stageRef: MutableRefObject<HTMLDivElement | null>;
  updateConnectionPointer: (event: ReactPointerEvent<HTMLElement>) => void;
}) {
  const dragRef = useRef<ChapterGraphDrag | null>(null);
  const suppressStageClickRef = useRef(false);

  function startNodeDrag(event: ReactPointerEvent<HTMLElement>, id: string, index: number) {
    if (disabled || event.button !== 0 || (event.target instanceof Element && event.target.closest("button, input, select"))) return;
    const position = nodePosition(id, index);
    stageRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originalX: position.x,
      originalY: position.y,
      active: false
    };
    setSelectedNodeId(id);
    setSelectedEdgeFromId("");
    suppressStageClickRef.current = true;
    event.stopPropagation();
    event.preventDefault();
  }

  function moveNodeDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.active) {
      if (Math.hypot(deltaX, deltaY) < chapterGraphDragThreshold) return;
      drag.active = true;
    }
    setNodePosition(drag.id, drag.originalX + deltaX / graphZoom, drag.originalY + deltaY / graphZoom);
    event.preventDefault();
  }

  function stopNodeDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const nodeId = drag.id;
    const wasClick = !drag.active;
    dragRef.current = null;
    if (wasClick && edgeSourceId && edgeSourceId !== nodeId) {
      connectToTarget(nodeId);
    }
  }

  function clearGraphSelectionFromStage(event: ReactMouseEvent<HTMLElement>) {
    if (suppressStageClickRef.current) {
      suppressStageClickRef.current = false;
      return;
    }
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest(".chapter-graph-node")) return;
    if (target.closest(".chapter-graph-edge-menu")) return;
    if (target.classList.contains("chapter-graph-edge")) return;
    setSelectedNodeId("");
    setSelectedEdgeFromId("");
  }

  function pointerMoveOnCanvas(event: ReactPointerEvent<HTMLElement>) {
    moveNodeDrag(event);
    updateConnectionPointer(event);
  }

  return {
    clearGraphSelectionFromStage,
    pointerMoveOnCanvas,
    startNodeDrag,
    stopNodeDrag
  };
}

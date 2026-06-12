import type { PointerEvent as ReactPointerEvent } from "react";
import { useRef, useState } from "react";
import type { PointerPoint } from "../../editorTypes";
import { clampNumber, roundForInput } from "../../lib/numeric";
import {
  chapterGraphHeight,
  chapterGraphNodeHeight,
  chapterGraphNodeWidth,
  chapterGraphWidth
} from "./chapterModel";
import {
  chapterGraphFitMargin,
  chapterGraphFitMaxZoom,
  getChapterGraphBounds,
  getChapterGraphNodeBounds
} from "./chapterGraphModel";

export function useChapterGraphViewport({
  nodePosition,
  placedIds
}: {
  nodePosition: (id: string, index: number) => PointerPoint;
  placedIds: string[];
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [graphZoom, setGraphZoom] = useState(1);

  function fitGraphToView(focusId?: string) {
    const stage = stageRef.current;
    if (!stage) return;
    const bounds = focusId && placedIds.includes(focusId)
      ? getChapterGraphNodeBounds(nodePosition(focusId, placedIds.indexOf(focusId)))
      : getChapterGraphBounds(placedIds, (id, index) => nodePosition(id, index));
    if (!bounds) return;

    const width = Math.max(bounds.maxX - bounds.minX, chapterGraphNodeWidth);
    const height = Math.max(bounds.maxY - bounds.minY, chapterGraphNodeHeight);
    const availableWidth = Math.max(240, stage.clientWidth - chapterGraphFitMargin);
    const availableHeight = Math.max(180, stage.clientHeight - chapterGraphFitMargin);
    const widthZoom = availableWidth / width;
    const heightZoom = availableHeight / height;
    const nextZoom = roundForInput(clampNumber(Math.min(widthZoom, heightZoom, chapterGraphFitMaxZoom), 0.5, 1.8, 1));
    setGraphZoom(nextZoom);
    stage.scrollTo({
      left: Math.max(0, (bounds.minX + width * 0.5) * nextZoom - stage.clientWidth * 0.5),
      top: Math.max(0, (bounds.minY + height * 0.5) * nextZoom - stage.clientHeight * 0.5),
      behavior: "smooth"
    });
  }

  function graphPointFromPointer(event: ReactPointerEvent<HTMLElement>) {
    const stage = stageRef.current;
    const rect = stage?.getBoundingClientRect();
    if (!stage || !rect || rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: clampNumber((event.clientX - rect.left + stage.scrollLeft) / graphZoom, 0, chapterGraphWidth, 0),
      y: clampNumber((event.clientY - rect.top + stage.scrollTop) / graphZoom, 0, chapterGraphHeight, 0)
    };
  }

  return {
    fitGraphToView,
    graphPointFromPointer,
    graphZoom,
    setGraphZoom,
    stageRef
  };
}

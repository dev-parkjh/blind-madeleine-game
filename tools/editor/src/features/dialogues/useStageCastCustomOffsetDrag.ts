import type {
  PointerEvent as ReactPointerEvent,
  RefObject
} from "react";
import { useRef } from "react";
import { useMobileDragLock } from "../../components/DragLock";
import type { PointerPoint } from "../../editorTypes";
import { clampNumber, round4Number } from "../../lib/numeric";
import {
  gameCharacterLayerHeight,
  gameCharacterLayerWidth
} from "./stageCastModel";
import type { StageCastPreviewEntry } from "./stageCastPreviewTypes";

type StageCastSceneDrag = {
  pointerId: number;
  characterId: string;
  startX: number;
  startY: number;
  startOffset: PointerPoint;
};

export function useStageCastCustomOffsetDrag({
  onMoveCustomOffset,
  selectedEntry,
  stageRef
}: {
  onMoveCustomOffset?: (characterId: string, offset: PointerPoint) => void;
  selectedEntry: StageCastPreviewEntry | null;
  stageRef: RefObject<HTMLDivElement | null>;
}) {
  const dragRef = useRef<StageCastSceneDrag | null>(null);
  const dragLock = useMobileDragLock();

  function stagePoint(event: ReactPointerEvent<HTMLElement>) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: (event.clientX - rect.left) / rect.width * gameCharacterLayerWidth,
      y: (event.clientY - rect.top) / rect.height * gameCharacterLayerHeight
    };
  }

  function startCustomOffsetDrag(event: ReactPointerEvent<HTMLElement>, entry: StageCastPreviewEntry) {
    if (event.button !== 0 || entry.position !== "custom" || !onMoveCustomOffset) return;
    if (dragLock.locked) return;
    const point = stagePoint(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      characterId: entry.characterId,
      startX: point.x,
      startY: point.y,
      startOffset: entry.offset
    };
    event.preventDefault();
  }

  function moveCustomOffsetDrag(event: ReactPointerEvent<HTMLElement>) {
    if (dragLock.locked) return;
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !onMoveCustomOffset) return;
    const point = stagePoint(event);
    if (!point) return;
    onMoveCustomOffset(drag.characterId, {
      x: round4Number(drag.startOffset.x + (point.x - drag.startX) / gameCharacterLayerWidth),
      y: round4Number(drag.startOffset.y + (point.y - drag.startY) / gameCharacterLayerHeight)
    });
    event.preventDefault();
  }

  function stopCustomOffsetDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore release failures from interrupted pointer streams.
    }
  }

  function updateSelectedCustomOffset(nextX: number, nextY: number) {
    if (!selectedEntry || selectedEntry.position !== "custom" || !onMoveCustomOffset) return;
    onMoveCustomOffset(selectedEntry.characterId, {
      x: round4Number(clampNumber(nextX, -1, 1, selectedEntry.offset.x)),
      y: round4Number(clampNumber(nextY, -1, 1, selectedEntry.offset.y))
    });
  }

  return {
    dragLock,
    moveCustomOffsetDrag,
    startCustomOffsetDrag,
    stopCustomOffsetDrag,
    updateSelectedCustomOffset
  };
}

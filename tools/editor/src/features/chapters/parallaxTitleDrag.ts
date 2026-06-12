import { clampNumber, pointerDistance, roundForInput, roundParallaxCoordinate } from "../../lib/numeric";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord } from "../../types";
import type {
  ParallaxPointerEvent,
  ParallaxVisualDrag,
  ParallaxVisualDragContext
} from "./parallaxVisualDragTypes";

export function startTitlePositionDrag(event: ParallaxPointerEvent, title: ResourceRecord, context: ParallaxVisualDragContext) {
  if (event.button !== 0) return;
  if (context.dragLocked) {
    context.setSelectedVisualTarget("title");
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (context.selectedVisualTarget !== "title") {
    context.setSelectedVisualTarget("title");
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  const position = asArray<number>(title.position);
  event.currentTarget.setPointerCapture(event.pointerId);
  context.dragRef.current = {
    mode: "title-position",
    startX: event.clientX,
    startY: event.clientY,
    originalX: clampNumber(position[0], -0.5, 1.5, 0.08),
    originalY: clampNumber(position[1], -0.5, 1.5, 0.18)
  };
  event.preventDefault();
  event.stopPropagation();
}

export function startTitleScaleDrag(event: ParallaxPointerEvent, title: ResourceRecord, context: ParallaxVisualDragContext) {
  if (event.button !== 0) return;
  if (context.dragLocked) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  const stageRect = context.stageRef.current?.getBoundingClientRect();
  if (!stageRect) return;
  const position = asArray<number>(title.position);
  const pivot = {
    x: stageRect.left + stageRect.width * clampNumber(position[0], -0.5, 1.5, 0.08),
    y: stageRect.top + stageRect.height * clampNumber(position[1], -0.5, 1.5, 0.18)
  };
  event.currentTarget.setPointerCapture(event.pointerId);
  context.setSelectedVisualTarget("title");
  context.dragRef.current = {
    mode: "title-scale",
    pivot,
    startDistance: Math.max(1, pointerDistance(pivot, event)),
    originalScale: clampNumber(title.scale, 0.2, 2.4, 1),
    originalScaleX: clampNumber(title.scale_x, 0.2, 2.4, 1),
    originalScaleY: clampNumber(title.scale_y, 0.2, 2.4, 1)
  };
  event.preventDefault();
  event.stopPropagation();
}

export function handleTitleDragMove(event: ParallaxPointerEvent, drag: ParallaxVisualDrag, context: ParallaxVisualDragContext) {
  if (drag.mode === "title-position") {
    const rect = context.stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return true;
    const nextX = roundParallaxCoordinate(drag.originalX + (event.clientX - drag.startX) / rect.width);
    const nextY = roundParallaxCoordinate(drag.originalY + (event.clientY - drag.startY) / rect.height);
    context.onChangeTitleLayout({
      position: [
        context.axisLock === "y" ? drag.originalX : nextX,
        context.axisLock === "x" ? drag.originalY : nextY
      ]
    });
    return true;
  }

  if (drag.mode === "title-scale") {
    const nextDistance = Math.max(1, pointerDistance(drag.pivot, event));
    const ratio = nextDistance / drag.startDistance;
    const nextScaleX = roundForInput(clampNumber(drag.originalScaleX * ratio, 0.2, 2.4));
    const nextScaleY = roundForInput(clampNumber(drag.originalScaleY * ratio, 0.2, 2.4));
    context.onChangeTitleLayout({
      scale: roundForInput(clampNumber(drag.originalScale * ratio, 0.2, 2.4)),
      scale_x: nextScaleX,
      scale_y: nextScaleY
    });
    return true;
  }

  return false;
}

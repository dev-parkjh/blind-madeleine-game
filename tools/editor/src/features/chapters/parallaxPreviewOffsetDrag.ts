import { clampNumber } from "../../lib/numeric";
import type {
  ParallaxPointerEvent,
  ParallaxVisualDrag,
  ParallaxVisualDragContext
} from "./parallaxVisualDragTypes";

export function startPreviewOffsetDrag(event: ParallaxPointerEvent, context: ParallaxVisualDragContext) {
  if (event.button !== 2) return;
  event.currentTarget.setPointerCapture(event.pointerId);
  context.dragRef.current = {
    mode: "preview-offset",
    startX: event.clientX,
    startY: event.clientY,
    originalX: context.previewOffset.x,
    originalY: context.previewOffset.y
  };
  event.preventDefault();
}

export function handlePreviewOffsetDragMove(event: ParallaxPointerEvent, drag: ParallaxVisualDrag, context: ParallaxVisualDragContext) {
  if (drag.mode !== "preview-offset") return false;
  const rect = context.stageRef.current?.getBoundingClientRect();
  if (!rect || rect.width === 0 || rect.height === 0) return true;
  context.setPreviewOffset({
    x: clampNumber(drag.originalX + ((event.clientX - drag.startX) / rect.width) * 2.2, -1, 1, 0),
    y: clampNumber(drag.originalY + ((event.clientY - drag.startY) / rect.height) * 2.2, -1, 1, 0)
  });
  return true;
}

export function stopPreviewOffsetDrag(context: ParallaxVisualDragContext) {
  if (context.dragRef.current?.mode === "preview-offset") {
    context.setPreviewOffset({ x: 0, y: 0 });
  }
}

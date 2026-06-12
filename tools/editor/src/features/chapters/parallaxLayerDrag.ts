import {
  clamp01Number,
  clampNumber,
  normalizeRotationDegrees,
  pointerAngle,
  pointerDistance,
  rotateParallaxPoint,
  round4Number,
  roundForInput,
  roundParallaxCoordinate
} from "../../lib/numeric";
import {
  getParallaxLayerAnchor,
  getParallaxLayerKind,
  getParallaxLayerPosition,
  getParallaxLayerScale,
  getParallaxLayerScaleX,
  getParallaxLayerScaleY,
  getParallaxLayerVisualSize,
  parallaxVisualLayerKey
} from "./chapterArtModel";
import type {
  ParallaxPointerEvent,
  ParallaxVisualDrag,
  ParallaxVisualDragContext
} from "./parallaxVisualDragTypes";

export function startLayerPositionDrag(event: ParallaxPointerEvent, index: number, context: ParallaxVisualDragContext) {
  if (event.button !== 0) return;
  if (context.dragLocked) {
    context.onSelectLayer(index);
    context.setSelectedVisualTarget("layer");
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  const layer = context.layers[index];
  if (!layer) return;
  const position = getParallaxLayerPosition(layer);
  event.currentTarget.setPointerCapture(event.pointerId);
  context.dragRef.current = {
    mode: "position",
    index,
    startX: event.clientX,
    startY: event.clientY,
    originalX: position[0],
    originalY: position[1]
  };
  context.onSelectLayer(index);
  context.setSelectedVisualTarget("layer");
  event.preventDefault();
  event.stopPropagation();
}

export function startLayerAnchorDrag(event: ParallaxPointerEvent, index: number, context: ParallaxVisualDragContext) {
  if (event.button !== 0) return;
  if (context.dragLocked) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  const stageRect = context.stageRef.current?.getBoundingClientRect();
  if (!stageRect || stageRect.width === 0 || stageRect.height === 0) return;
  const layer = context.layers[index];
  const position = getParallaxLayerPosition(layer);
  const anchor = getParallaxLayerAnchor(layer);
  const aspectRatio = context.layerAspectRatios[parallaxVisualLayerKey(layer, index)];
  const size = getParallaxLayerVisualSize(layer, aspectRatio);
  const anchorX = clamp01Number(anchor[0], 0.5);
  const anchorY = clamp01Number(anchor[1], 0.5);
  const rotation = getParallaxLayerKind(layer) === "background" ? 0 : normalizeRotationDegrees(layer?.rotation);
  event.currentTarget.setPointerCapture(event.pointerId);
  const drag: Extract<ParallaxVisualDrag, { mode: "anchor" }> = {
    mode: "anchor",
    index,
    stageRect,
    centerX: stageRect.left + stageRect.width * position[0],
    centerY: stageRect.top + stageRect.height * position[1],
    width: Math.max(1, size.width * stageRect.width),
    height: Math.max(1, size.height * stageRect.height),
    anchorX,
    anchorY,
    rotation
  };
  context.dragRef.current = drag;
  context.onSelectLayer(index);
  context.setSelectedVisualTarget("layer");
  updateAnchorFromPointer(event, drag, context);
  event.preventDefault();
  event.stopPropagation();
}

export function startLayerScaleDrag(event: ParallaxPointerEvent, index: number, context: ParallaxVisualDragContext) {
  if (event.button !== 0) return;
  if (context.dragLocked) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  const stageRect = context.stageRef.current?.getBoundingClientRect();
  if (!stageRect) return;
  const layer = context.layers[index];
  const position = getParallaxLayerPosition(layer);
  const pivot = {
    x: stageRect.left + stageRect.width * position[0],
    y: stageRect.top + stageRect.height * position[1]
  };
  event.currentTarget.setPointerCapture(event.pointerId);
  context.dragRef.current = {
    mode: "scale",
    index,
    pivot,
    startDistance: Math.max(1, pointerDistance(pivot, event)),
    originalScale: getParallaxLayerScale(layer),
    originalScaleX: getParallaxLayerScaleX(layer),
    originalScaleY: getParallaxLayerScaleY(layer)
  };
  context.onSelectLayer(index);
  context.setSelectedVisualTarget("layer");
  event.preventDefault();
  event.stopPropagation();
}

export function startLayerRotationDrag(event: ParallaxPointerEvent, index: number, context: ParallaxVisualDragContext) {
  if (event.button !== 0) return;
  if (context.dragLocked) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  const stageRect = context.stageRef.current?.getBoundingClientRect();
  if (!stageRect) return;
  const layer = context.layers[index];
  const position = getParallaxLayerPosition(layer);
  const pivot = {
    x: stageRect.left + stageRect.width * position[0],
    y: stageRect.top + stageRect.height * position[1]
  };
  event.currentTarget.setPointerCapture(event.pointerId);
  context.dragRef.current = {
    mode: "rotation",
    index,
    pivot,
    startAngle: pointerAngle(pivot, event),
    originalRotation: normalizeRotationDegrees(layer?.rotation)
  };
  context.onSelectLayer(index);
  context.setSelectedVisualTarget("layer");
  event.preventDefault();
  event.stopPropagation();
}

export function handleLayerDragMove(event: ParallaxPointerEvent, drag: ParallaxVisualDrag, context: ParallaxVisualDragContext) {
  if (drag.mode === "position") {
    const rect = context.stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return true;
    const nextX = roundParallaxCoordinate(drag.originalX + (event.clientX - drag.startX) / rect.width);
    const nextY = roundParallaxCoordinate(drag.originalY + (event.clientY - drag.startY) / rect.height);
    context.onChangeLayer(drag.index, {
      position: [
        context.axisLock === "y" ? drag.originalX : nextX,
        context.axisLock === "x" ? drag.originalY : nextY
      ]
    });
    return true;
  }

  if (drag.mode === "anchor") {
    updateAnchorFromPointer(event, drag, context);
    return true;
  }

  if (drag.mode === "scale") {
    const nextDistance = Math.max(1, pointerDistance(drag.pivot, event));
    const ratio = nextDistance / drag.startDistance;
    context.onChangeLayer(drag.index, {
      scale: roundForInput(clampNumber(drag.originalScale * ratio, 0.05, 3)),
      scale_x: roundForInput(clampNumber(drag.originalScaleX * ratio, 0.05, 3)),
      scale_y: roundForInput(clampNumber(drag.originalScaleY * ratio, 0.05, 3))
    });
    return true;
  }

  if (drag.mode === "rotation") {
    const nextAngle = pointerAngle(drag.pivot, event);
    const nextRotation = normalizeRotationDegrees(drag.originalRotation + nextAngle - drag.startAngle);
    context.onChangeLayer(drag.index, { rotation: event.shiftKey ? Math.round(nextRotation / 15) * 15 : roundForInput(nextRotation) });
    return true;
  }

  return false;
}

function updateAnchorFromPointer(
  event: ParallaxPointerEvent,
  drag: Extract<ParallaxVisualDrag, { mode: "anchor" }>,
  context: ParallaxVisualDragContext
) {
  if (drag.stageRect.width === 0 || drag.stageRect.height === 0 || drag.width === 0 || drag.height === 0) return;
  const inversePoint = rotateParallaxPoint({
    x: event.clientX - drag.centerX,
    y: event.clientY - drag.centerY
  }, -drag.rotation);
  const originalAnchorX = drag.anchorX * drag.width;
  const originalAnchorY = drag.anchorY * drag.height;
  const localX = clampNumber(originalAnchorX + inversePoint.x, 0, drag.width, originalAnchorX);
  const localY = clampNumber(originalAnchorY + inversePoint.y, 0, drag.height, originalAnchorY);
  const anchor = {
    x: localX / drag.width,
    y: localY / drag.height
  };
  const rotatedAnchorDelta = rotateParallaxPoint({
    x: localX - originalAnchorX,
    y: localY - originalAnchorY
  }, drag.rotation);
  const nextCenterX = drag.centerX + rotatedAnchorDelta.x;
  const nextCenterY = drag.centerY + rotatedAnchorDelta.y;
  context.onChangeLayer(drag.index, {
    anchor: [
      round4Number(anchor.x),
      round4Number(anchor.y)
    ],
    position: [
      roundParallaxCoordinate((nextCenterX - drag.stageRect.left) / drag.stageRect.width),
      roundParallaxCoordinate((nextCenterY - drag.stageRect.top) / drag.stageRect.height)
    ]
  });
}

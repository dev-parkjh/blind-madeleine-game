import type { CSSProperties } from "react";
import type { PointerPoint } from "../../editorTypes";
import {
  clamp01Number,
  clampNumber,
  normalizeRotationDegrees
} from "../../lib/numeric";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord } from "../../types";
import {
  chapterThumbnailHeight,
  chapterThumbnailWidth,
  getParallaxLayerAnchor,
  getParallaxLayerKind,
  getParallaxLayerMotionDepth,
  getParallaxLayerMotionPerspective,
  getParallaxLayerPath,
  getParallaxLayerPosition,
  getParallaxLayerScaleX,
  getParallaxLayerScaleY
} from "./parallaxLayerModel";

export function parallaxVisualLayerKey(layer: ResourceRecord, index: number) {
  return `${String(layer.id || index)}:${getParallaxLayerPath(layer)}`;
}

export function getParallaxLayerVisualSize(layer: ResourceRecord, aspectRatio = 1) {
  const kind = getParallaxLayerKind(layer);
  const stageAspectRatio = chapterThumbnailWidth / chapterThumbnailHeight;
  const safeAspectRatio = clampNumber(aspectRatio, 0.05, 20, 1);
  const scaleX = getParallaxLayerScaleX(layer);
  const scaleY = getParallaxLayerScaleY(layer);
  if (kind !== "background") {
    return {
      width: scaleX * safeAspectRatio / stageAspectRatio,
      height: scaleY
    };
  }
  if (safeAspectRatio >= stageAspectRatio) {
    return {
      width: scaleX * safeAspectRatio / stageAspectRatio,
      height: scaleY
    };
  }
  return {
    width: scaleX,
    height: scaleY * stageAspectRatio / safeAspectRatio
  };
}

export function getParallaxLayerPreviewStyle(
  layer: ResourceRecord,
  index: number,
  aspectRatio: number | undefined,
  visualIndex: number,
  previewOffset: PointerPoint = { x: 0, y: 0 },
  strengthValue: unknown = 0,
  stageScale = 1
) {
  const position = getParallaxLayerPosition(layer);
  const x = position[0];
  const y = position[1];
  const anchor = getParallaxLayerAnchor(layer);
  const anchorX = anchor[0];
  const anchorY = anchor[1];
  const size = getParallaxLayerVisualSize(layer, aspectRatio);
  const kind = getParallaxLayerKind(layer);
  const strength = clampNumber(strengthValue, 0, 120, 0);
  const motionDepth = getParallaxLayerMotionDepth(layer);
  const perspective = getParallaxLayerMotionPerspective(layer);
  const shiftX = -previewOffset.x * strength * motionDepth * stageScale;
  const shiftY = -previewOffset.y * strength * motionDepth * stageScale;
  return {
    "--layer-x": `${x * 100}%`,
    "--layer-y": `${y * 100}%`,
    "--layer-anchor-x": `${anchorX * 100}%`,
    "--layer-anchor-y": `${anchorY * 100}%`,
    "--layer-translate-x": `${anchorX * -100}%`,
    "--layer-translate-y": `${anchorY * -100}%`,
    "--layer-width": `${size.width * 100}%`,
    "--layer-height": `${size.height * 100}%`,
    "--layer-rotation": `${kind === "background" ? 0 : normalizeRotationDegrees(layer.rotation)}deg`,
    "--layer-preview-shift-x": `${shiftX.toFixed(2)}px`,
    "--layer-preview-shift-y": `${shiftY.toFixed(2)}px`,
    "--layer-perspective-rotation": `rotateY(${perspective * previewOffset.x * 8}deg) rotateX(${-perspective * previewOffset.y * 4}deg)`,
    "--layer-opacity": String(clampNumber(layer.opacity, 0, 1, 1)),
    zIndex: visualIndex
  } as CSSProperties;
}

export function getParallaxMarkerStyle(layer: ResourceRecord, index: number, visualIndex: number) {
  const position = getParallaxLayerPosition(layer);
  return {
    left: `${position[0] * 100}%`,
    top: `${position[1] * 100}%`,
    zIndex: visualIndex
  } as CSSProperties;
}

export function getParallaxTitlePreviewStyle(
  title: ResourceRecord,
  visualIndex: number,
  previewOffset: PointerPoint = { x: 0, y: 0 },
  strengthValue: unknown = 0,
  stageScale = 1
) {
  const position = asArray<number>(title.position);
  const x = clampNumber(position[0], -0.5, 1.5, 0.08);
  const y = clampNumber(position[1], -0.5, 1.5, 0.18);
  const strength = clampNumber(strengthValue, 0, 120, 0);
  const depth = title.floating === false ? 0 : clampNumber(title.depth, -2, 2, 0.1);
  const perspective = title.floating === false ? 0 : clampNumber(title.perspective, -1, 1, 0);
  const shiftX = -previewOffset.x * strength * depth * stageScale;
  const shiftY = -previewOffset.y * strength * depth * stageScale;
  return {
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    opacity: clampNumber(title.opacity, 0, 1, 1),
    zIndex: visualIndex,
    transform: `translate(${shiftX.toFixed(2)}px, ${shiftY.toFixed(2)}px) scale(${clampNumber(title.scale_x, 0.2, 2.4, 1)}, ${clampNumber(title.scale_y, 0.2, 2.4, 1)}) rotateY(${perspective * previewOffset.x * 8}deg) rotateX(${-perspective * previewOffset.y * 4}deg)`
  } as CSSProperties;
}

import type { SyntheticEvent } from "react";
import { useRef, useState } from "react";
import type { PointerPoint } from "../../editorTypes";
import {
  clampNumber,
  roundForInput
} from "../../lib/numeric";
import { resPathToAssetUrl } from "../../lib/resourcePaths";
import type { ResourceRecord } from "../../types";
import {
  chapterThumbnailWidth,
  getParallaxLayerPath,
  getParallaxOverlayLayout,
  getParallaxVisualEntries,
  parallaxVisualLayerKey
} from "./chapterArtModel";
import { useParallaxVisualDragController } from "./useParallaxVisualDragController";

export function useParallaxVisualController({
  layers,
  onChangeLayer,
  onChangeTitleLayout,
  onSelectLayer,
  parallax,
  selectedLayerIndex
}: {
  layers: ResourceRecord[];
  onChangeLayer: (index: number, patch: ResourceRecord) => void;
  onChangeTitleLayout: (patch: ResourceRecord) => void;
  onSelectLayer: (index: number) => void;
  parallax: ResourceRecord;
  selectedLayerIndex: number;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [selectedVisualTarget, setSelectedVisualTarget] = useState<"layer" | "title">("layer");
  const [axisLock, setAxisLock] = useState<"free" | "x" | "y">("free");
  const [layerAspectRatios, setLayerAspectRatios] = useState<Record<string, number>>({});
  const [previewOffset, setPreviewOffset] = useState<PointerPoint>({ x: 0, y: 0 });
  const entries = getParallaxVisualEntries(layers, parallax);
  const hasImage = entries.some((entry) => entry.type === "layer" && resPathToAssetUrl(getParallaxLayerPath(entry.layer)));
  const overlay = getParallaxOverlayLayout(parallax);
  const overlayUrl = overlay.enabled ? resPathToAssetUrl(overlay.path) : "";
  const stageScale = clampNumber((stageRef.current?.clientWidth || chapterThumbnailWidth) / chapterThumbnailWidth, 0.05, 4, 1);
  const dragController = useParallaxVisualDragController({
    axisLock,
    layerAspectRatios,
    layers,
    onChangeLayer,
    onChangeTitleLayout,
    onSelectLayer,
    parallax,
    previewOffset,
    selectedLayerIndex,
    selectedVisualTarget,
    setPreviewOffset,
    setSelectedVisualTarget,
    stageRef
  });

  function rememberLayerAspectRatio(layer: ResourceRecord, index: number, event: SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    const width = image.naturalWidth || image.width || 1;
    const height = image.naturalHeight || image.height || 1;
    if (width <= 0 || height <= 0) return;
    const key = parallaxVisualLayerKey(layer, index);
    const nextRatio = roundForInput(width / height);
    if (layerAspectRatios[key] === nextRatio) return;
    setLayerAspectRatios((current) => ({ ...current, [key]: nextRatio }));
  }

  return {
    axisLock,
    dragLock: dragController.dragLock,
    entries,
    handlePointerMove: dragController.handlePointerMove,
    handleStageWheel: dragController.handleStageWheel,
    hasImage,
    layerAspectRatios,
    overlay,
    overlayUrl,
    previewOffset,
    rememberLayerAspectRatio,
    selectedVisualTarget,
    setAxisLock,
    stageRef,
    stageScale,
    startAnchorDrag: dragController.startAnchorDrag,
    startPositionDrag: dragController.startPositionDrag,
    startPreviewOffsetDrag: dragController.startPreviewOffsetDrag,
    startRotationDrag: dragController.startRotationDrag,
    startScaleDrag: dragController.startScaleDrag,
    startTitlePositionDrag: dragController.startTitlePositionDrag,
    startTitleScaleDrag: dragController.startTitleScaleDrag,
    stopDrag: dragController.stopDrag
  };
}

import type { Dispatch, MutableRefObject, SetStateAction, WheelEvent as ReactWheelEvent } from "react";
import { useRef } from "react";
import { useMobileDragLock } from "../../components/DragLock";
import type { PointerPoint } from "../../editorTypes";
import type { ResourceRecord } from "../../types";
import { handleParallaxStageWheel } from "./parallaxDragWheel";
import {
  handleLayerDragMove,
  startLayerAnchorDrag,
  startLayerPositionDrag,
  startLayerRotationDrag,
  startLayerScaleDrag
} from "./parallaxLayerDrag";
import {
  handlePreviewOffsetDragMove,
  startPreviewOffsetDrag as startPreviewOffsetDragHelper,
  stopPreviewOffsetDrag
} from "./parallaxPreviewOffsetDrag";
import {
  handleTitleDragMove,
  startTitlePositionDrag as startTitlePositionDragHelper,
  startTitleScaleDrag as startTitleScaleDragHelper
} from "./parallaxTitleDrag";
import type {
  ParallaxAxisLock,
  ParallaxPointerEvent,
  ParallaxVisualDrag,
  ParallaxVisualDragContext,
  ParallaxVisualTarget
} from "./parallaxVisualDragTypes";

export function useParallaxVisualDragController({
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
}: {
  axisLock: ParallaxAxisLock;
  layerAspectRatios: Record<string, number>;
  layers: ResourceRecord[];
  onChangeLayer: (index: number, patch: ResourceRecord) => void;
  onChangeTitleLayout: (patch: ResourceRecord) => void;
  onSelectLayer: (index: number) => void;
  parallax: ResourceRecord;
  previewOffset: PointerPoint;
  selectedLayerIndex: number;
  selectedVisualTarget: ParallaxVisualTarget;
  setPreviewOffset: Dispatch<SetStateAction<PointerPoint>>;
  setSelectedVisualTarget: (target: ParallaxVisualTarget) => void;
  stageRef: MutableRefObject<HTMLDivElement | null>;
}) {
  const dragRef = useRef<ParallaxVisualDrag | null>(null);
  const dragLock = useMobileDragLock();
  const context: ParallaxVisualDragContext = {
    axisLock,
    dragLocked: dragLock.locked,
    dragRef,
    layerAspectRatios,
    layers,
    onChangeLayer,
    onChangeTitleLayout,
    onSelectLayer,
    previewOffset,
    selectedLayerIndex,
    selectedVisualTarget,
    setPreviewOffset,
    setSelectedVisualTarget,
    stageRef
  };

  function startPositionDrag(event: ParallaxPointerEvent, index: number) {
    startLayerPositionDrag(event, index, context);
  }

  function startAnchorDrag(event: ParallaxPointerEvent, index: number) {
    startLayerAnchorDrag(event, index, context);
  }

  function startScaleDrag(event: ParallaxPointerEvent, index: number) {
    startLayerScaleDrag(event, index, context);
  }

  function startRotationDrag(event: ParallaxPointerEvent, index: number) {
    startLayerRotationDrag(event, index, context);
  }

  function startTitlePositionDrag(event: ParallaxPointerEvent, title: ResourceRecord) {
    startTitlePositionDragHelper(event, title, context);
  }

  function startTitleScaleDrag(event: ParallaxPointerEvent, title: ResourceRecord) {
    startTitleScaleDragHelper(event, title, context);
  }

  function handleStageWheel(event: ReactWheelEvent<HTMLElement>) {
    handleParallaxStageWheel(event, parallax, context);
  }

  function startPreviewOffsetDrag(event: ParallaxPointerEvent) {
    startPreviewOffsetDragHelper(event, context);
  }

  function handlePointerMove(event: ParallaxPointerEvent) {
    if (dragLock.locked) return;
    const drag = dragRef.current;
    if (!drag) return;
    const handled = (
      handleLayerDragMove(event, drag, context) ||
      handleTitleDragMove(event, drag, context) ||
      handlePreviewOffsetDragMove(event, drag, context)
    );
    if (handled) event.preventDefault();
  }

  function stopDrag() {
    stopPreviewOffsetDrag(context);
    dragRef.current = null;
  }

  return {
    dragLock,
    handlePointerMove,
    handleStageWheel,
    startAnchorDrag,
    startPositionDrag,
    startPreviewOffsetDrag,
    startRotationDrag,
    startScaleDrag,
    startTitlePositionDrag,
    startTitleScaleDrag,
    stopDrag
  };
}

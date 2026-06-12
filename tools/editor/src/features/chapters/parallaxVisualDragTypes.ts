import type {
  Dispatch,
  MutableRefObject,
  PointerEvent as ReactPointerEvent,
  SetStateAction
} from "react";
import type { PointerPoint } from "../../editorTypes";
import type { ResourceRecord } from "../../types";

export type ParallaxVisualTarget = "layer" | "title";
export type ParallaxAxisLock = "free" | "x" | "y";

export type ParallaxVisualDrag =
  | { mode: "position"; index: number; startX: number; startY: number; originalX: number; originalY: number }
  | { mode: "anchor"; index: number; stageRect: DOMRect; centerX: number; centerY: number; width: number; height: number; anchorX: number; anchorY: number; rotation: number }
  | { mode: "scale"; index: number; pivot: PointerPoint; startDistance: number; originalScale: number; originalScaleX: number; originalScaleY: number }
  | { mode: "rotation"; index: number; pivot: PointerPoint; startAngle: number; originalRotation: number }
  | { mode: "title-position"; startX: number; startY: number; originalX: number; originalY: number }
  | { mode: "title-scale"; pivot: PointerPoint; startDistance: number; originalScale: number; originalScaleX: number; originalScaleY: number }
  | { mode: "preview-offset"; startX: number; startY: number; originalX: number; originalY: number };

export type ParallaxVisualDragContext = {
  axisLock: ParallaxAxisLock;
  dragLocked: boolean;
  dragRef: MutableRefObject<ParallaxVisualDrag | null>;
  layerAspectRatios: Record<string, number>;
  layers: ResourceRecord[];
  onChangeLayer: (index: number, patch: ResourceRecord) => void;
  onChangeTitleLayout: (patch: ResourceRecord) => void;
  onSelectLayer: (index: number) => void;
  previewOffset: PointerPoint;
  selectedLayerIndex: number;
  selectedVisualTarget: ParallaxVisualTarget;
  setPreviewOffset: Dispatch<SetStateAction<PointerPoint>>;
  setSelectedVisualTarget: (target: ParallaxVisualTarget) => void;
  stageRef: MutableRefObject<HTMLDivElement | null>;
};

export type ParallaxPointerEvent = ReactPointerEvent<HTMLElement>;

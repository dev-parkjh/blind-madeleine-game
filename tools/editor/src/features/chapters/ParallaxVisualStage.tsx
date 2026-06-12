import type {
  PointerEvent as ReactPointerEvent,
  RefObject,
  SyntheticEvent,
  WheelEvent as ReactWheelEvent
} from "react";
import { DragLockHint } from "../../components/DragLock";
import type { PointerPoint } from "../../editorTypes";
import { clampNumber, normalizeNumber } from "../../lib/numeric";
import { resPathToAssetUrl } from "../../lib/resourcePaths";
import type { ResourceRecord } from "../../types";
import {
  getParallaxLayerAnchor,
  getParallaxLayerKind,
  getParallaxLayerPath,
  getParallaxLayerPreviewStyle,
  getParallaxMarkerStyle,
  getParallaxTitlePreviewStyle,
  parallaxVisualLayerKey,
  type ParallaxVisualEntry
} from "./chapterArtModel";

export function ParallaxVisualStage({
  draft,
  dragLockAvailable,
  dragLocked,
  entries,
  hasImage,
  layerAspectRatios,
  overlay,
  overlayUrl,
  parallax,
  previewOffset,
  selectedLayerIndex,
  selectedVisualTarget,
  stageRef,
  stageScale,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onRememberLayerAspectRatio,
  onStageWheel,
  onStartAnchorDrag,
  onStartPositionDrag,
  onStartRotationDrag,
  onStartScaleDrag,
  onStartTitlePositionDrag,
  onStartTitleScaleDrag,
  onToggleDragLock
}: {
  draft: ResourceRecord;
  dragLockAvailable: boolean;
  dragLocked: boolean;
  entries: ParallaxVisualEntry[];
  hasImage: boolean;
  layerAspectRatios: Record<string, number>;
  overlay: ResourceRecord;
  overlayUrl: string;
  parallax: ResourceRecord;
  previewOffset: PointerPoint;
  selectedLayerIndex: number;
  selectedVisualTarget: "layer" | "title";
  stageRef: RefObject<HTMLDivElement | null>;
  stageScale: number;
  onPointerCancel: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onRememberLayerAspectRatio: (layer: ResourceRecord, index: number, event: SyntheticEvent<HTMLImageElement>) => void;
  onStageWheel: (event: ReactWheelEvent<HTMLElement>) => void;
  onStartAnchorDrag: (event: ReactPointerEvent<HTMLElement>, index: number) => void;
  onStartPositionDrag: (event: ReactPointerEvent<HTMLElement>, index: number) => void;
  onStartRotationDrag: (event: ReactPointerEvent<HTMLElement>, index: number) => void;
  onStartScaleDrag: (event: ReactPointerEvent<HTMLElement>, index: number) => void;
  onStartTitlePositionDrag: (event: ReactPointerEvent<HTMLElement>, title: ResourceRecord) => void;
  onStartTitleScaleDrag: (event: ReactPointerEvent<HTMLElement>, title: ResourceRecord) => void;
  onToggleDragLock: () => void;
}) {
  return (
    <div
      className={`parallax-stage ${hasImage ? "has-image" : ""} ${dragLocked ? "drag-locked" : ""}`}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onContextMenu={(event) => event.preventDefault()}
      onWheel={onStageWheel}
      ref={stageRef}
    >
      <DragLockHint available={dragLockAvailable} locked={dragLocked} onToggle={onToggleDragLock} />
      {entries.length === 0 && <span className="parallax-stage-empty">레이어 없음</span>}
      {entries.map((entry, visualIndex) => {
        if (entry.type === "title") {
          const titleStyle = getParallaxTitlePreviewStyle(entry.title, visualIndex, previewOffset, parallax.strength, stageScale);
          const titleImageUrl = resPathToAssetUrl(entry.title.image);
          const chapterOrder = normalizeNumber(draft.order, 1, 1);
          const chapterTitle = String(draft.title || draft.id || "제목 없음").trim() || "제목 없음";
          const description = String(draft.description || "").trim() || "챕터 설명이 아직 없습니다.";
          const isTitleSelected = selectedVisualTarget === "title";
          return (
            <div
              className={`parallax-title-preview ${isTitleSelected ? "selected" : ""}`}
              key="parallax-title-preview"
              onPointerDown={(event) => onStartTitlePositionDrag(event, entry.title)}
              style={titleStyle}
            >
              {titleImageUrl ? (
                <img alt={chapterTitle} src={titleImageUrl} />
              ) : (
                <>
                  <div className="eyebrow"><span>챕터 {Math.max(1, chapterOrder)}</span></div>
                  <strong>{chapterTitle}</strong>
                  <div className="divider" />
                  <p>{description}</p>
                </>
              )}
              {isTitleSelected && (
                <button
                  aria-label="Title scale"
                  className="parallax-title-scale-handle"
                  onPointerDown={(event) => onStartTitleScaleDrag(event, entry.title)}
                  type="button"
                />
              )}
            </div>
          );
        }

        const layer = entry.layer;
        const index = entry.index;
        const imageUrl = resPathToAssetUrl(getParallaxLayerPath(layer));
        const isSelected = index === selectedLayerIndex;
        const anchor = getParallaxLayerAnchor(layer);
        const anchorX = anchor[0];
        const anchorY = anchor[1];
        const kind = getParallaxLayerKind(layer);
        const previewStyle = getParallaxLayerPreviewStyle(
          layer,
          index,
          layerAspectRatios[parallaxVisualLayerKey(layer, index)],
          visualIndex,
          previewOffset,
          parallax.strength,
          stageScale
        );
        return (
          imageUrl ? (
            <div
              className={`parallax-layer-preview ${isSelected ? "selected" : ""}`}
              key={`${layer.id || "layer"}-${index}`}
              onPointerDown={(event) => onStartPositionDrag(event, index)}
              style={previewStyle}
            >
              <img alt="" onLoad={(event) => onRememberLayerAspectRatio(layer, index, event)} src={imageUrl} />
              <button
                aria-label={`Layer ${index + 1} position`}
                className="parallax-marker layer-index"
                onPointerDown={(event) => onStartPositionDrag(event, index)}
                type="button"
              >
                <span>{index + 1}</span>
              </button>
              {isSelected && (
                <>
                  <button
                    aria-label={`Layer ${index + 1} anchor`}
                    className="parallax-anchor-handle"
                    onPointerDown={(event) => onStartAnchorDrag(event, index)}
                    style={{ left: `${anchorX * 100}%`, top: `${anchorY * 100}%` }}
                    type="button"
                  />
                  <button
                    aria-label={`Layer ${index + 1} scale`}
                    className="parallax-scale-handle"
                    onPointerDown={(event) => onStartScaleDrag(event, index)}
                    type="button"
                  />
                  {kind !== "background" && (
                    <button
                      aria-label={`Layer ${index + 1} rotation`}
                      className="parallax-rotation-handle"
                      onPointerDown={(event) => onStartRotationDrag(event, index)}
                      type="button"
                    />
                  )}
                </>
              )}
            </div>
          ) : (
            <button
              aria-label={`Layer ${index + 1} position`}
              className={`parallax-marker ${isSelected ? "selected" : ""}`}
              key={`${layer.id || "layer"}-${index}`}
              onPointerDown={(event) => onStartPositionDrag(event, index)}
              style={getParallaxMarkerStyle(layer, index, visualIndex)}
              type="button"
            >
              <span>{index + 1}</span>
            </button>
          )
        );
      })}
      {overlay.enabled && overlayUrl && (
        <div
          className="parallax-overlay-preview"
          style={{ backgroundImage: `url("${overlayUrl}")`, opacity: clampNumber(overlay.opacity, 0, 1, 1) }}
        />
      )}
    </div>
  );
}

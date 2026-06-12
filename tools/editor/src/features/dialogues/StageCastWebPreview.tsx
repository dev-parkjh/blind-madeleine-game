import type { CSSProperties, PointerEvent as ReactPointerEvent, RefObject, SyntheticEvent } from "react";
import { CoordinateNudgeToolbar } from "../../components/CoordinateNudgeToolbar";
import { DragLockHint, DragLockToggle } from "../../components/DragLock";
import type { EditorCopy } from "../../editorText";
import { clamp01Number, clampNumber } from "../../lib/numeric";
import { asArray } from "../../lib/resourceConfig";
import { resPathToAssetUrl } from "../../lib/resourcePaths";
import {
  applyCastPositionStackSpread,
  gameCharacterLayerHeight,
  gameCharacterLayerWidth,
  getPortraitAnchorRatios,
  isStackableCastPosition,
  portraitFitPadding,
  portraitPositionPresets,
  snapPortraitZoomPercent,
  stageCastUnfocusedOpacity
} from "./stageCastModel";
import type { StageCastPreviewEntry } from "./stageCastPreviewTypes";

export function StageCastWebPreview({
  dragLockAvailable,
  dragLocked,
  entries,
  imageSizes,
  onPointerCancel,
  onPointerMove,
  onPointerUp,
  onRememberImageSize,
  onStartCustomOffsetDrag,
  onToggleDragLock,
  onUpdateSelectedCustomOffset,
  selectedCastId,
  selectedEntry,
  stageRef,
  ui,
  visibleEntries
}: {
  dragLockAvailable: boolean;
  dragLocked: boolean;
  entries: StageCastPreviewEntry[];
  imageSizes: Record<string, { w: number; h: number }>;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onRememberImageSize: (entry: StageCastPreviewEntry, event: SyntheticEvent<HTMLImageElement>) => void;
  onStartCustomOffsetDrag: (event: ReactPointerEvent<HTMLElement>, entry: StageCastPreviewEntry) => void;
  onToggleDragLock: () => void;
  onUpdateSelectedCustomOffset: (nextX: number, nextY: number) => void;
  selectedCastId: string;
  selectedEntry: StageCastPreviewEntry | null;
  stageRef: RefObject<HTMLDivElement | null>;
  ui: EditorCopy;
  visibleEntries: StageCastPreviewEntry[];
}) {
  return (
    <div className="stage-cast-scene-preview">
      <div
        className={`stage-cast-stage-area ${dragLocked ? "drag-locked" : ""}`}
        onPointerCancel={onPointerCancel}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        ref={stageRef}
      >
        <DragLockHint available={dragLockAvailable} locked={dragLocked} onToggle={onToggleDragLock} />
        <div className="stage-cast-center-line" />
        <div className="stage-cast-face-anchor" />
        {visibleEntries.map((entry, index) => {
          const imageKey = stageCastImageKey(entry);
          const style = getStageCastSpriteStyle(entry, entries, imageSizes[imageKey], index);
          return (
            <div
              className={`stage-cast-sprite ${entry.position === "custom" ? "custom-offset" : ""} ${dragLocked ? "drag-locked" : ""} ${selectedCastId === entry.characterId ? "selected" : ""} ${entry.flipH ? "flipped" : ""} ${entry.mystery ? "mystery" : ""}`}
              key={entry.characterId}
              onPointerDown={(event) => onStartCustomOffsetDrag(event, entry)}
              style={style}
            >
              <img alt="" onLoad={(event) => onRememberImageSize(entry, event)} src={resPathToAssetUrl(entry.portrait?.path)} />
              <span>{entry.label}</span>
            </div>
          );
        })}
      </div>
      <div className="stage-cast-dialogue-band">
        <div className="stage-cast-dialogue-copy">
          <strong>{ui.form.stagePreview}</strong>
          <span>{visibleEntries.length} {ui.form.visible}</span>
        </div>
        {selectedEntry?.position === "custom" && (
          <DragLockToggle
            available={dragLockAvailable}
            locked={dragLocked}
            onToggle={onToggleDragLock}
          />
        )}
        {selectedEntry?.position === "custom" && (
          <div className="stage-cast-nudge-panel">
            <CoordinateNudgeToolbar
              label={`${selectedEntry.label} ${ui.form.offset}`}
              min={-1}
              max={1}
              onChange={onUpdateSelectedCustomOffset}
              resetX={0}
              resetY={0}
              x={selectedEntry.offset.x}
              y={selectedEntry.offset.y}
            />
          </div>
        )}
      </div>
      {visibleEntries.length === 0 && <span className="stage-cast-preview-empty">{ui.form.previewEmpty}</span>}
    </div>
  );
}

export function stageCastImageKey(entry: StageCastPreviewEntry) {
  return `${entry.characterId}:${String(entry.portrait?.path || "")}`;
}

function stageCastPreviewOffset(entry: StageCastPreviewEntry, allEntries: StageCastPreviewEntry[]) {
  if (entry.position === "custom") return entry.offset;
  const base = portraitPositionPresets[entry.position] || portraitPositionPresets.center;

  const group = allEntries
    .filter((candidate) => candidate.position === entry.position && candidate.portrait && isStackableCastPosition(candidate.position))
    .sort((a, b) => a.positionOrder === b.positionOrder ? a.index - b.index : a.positionOrder - b.positionOrder);
  const stackIndex = Math.max(0, group.findIndex((candidate) => candidate.characterId === entry.characterId));
  return applyCastPositionStackSpread(base, stackIndex, group.length);
}

function getStageCastSpriteStyle(entry: StageCastPreviewEntry, allEntries: StageCastPreviewEntry[], imageSize: { w: number; h: number } | undefined, index: number) {
  const textureW = Math.max(1, imageSize?.w || 900);
  const textureH = Math.max(1, imageSize?.h || 1400);
  const center = asArray<number>(entry.portrait?.center);
  const faceCenter = {
    x: clamp01Number(center[0], 0.5),
    y: clamp01Number(center[1], 0.5)
  };
  const zoom = snapPortraitZoomPercent(entry.portraitZoom);
  const baseScale = Math.min(
    (gameCharacterLayerWidth * portraitFitPadding) / textureW,
    (gameCharacterLayerHeight * portraitFitPadding) / textureH
  );
  const scale = baseScale * (zoom / 100);
  const visualScale = entry.isFocused ? 1 : 0.9;
  const width = textureW * scale * visualScale;
  const height = textureH * scale * visualScale;
  const anchor = getPortraitAnchorRatios(zoom);
  const offset = stageCastPreviewOffset(entry, allEntries);
  const anchorX = gameCharacterLayerWidth * anchor.x + offset.x * gameCharacterLayerWidth;
  const anchorY = gameCharacterLayerHeight * anchor.y + offset.y * gameCharacterLayerHeight;
  return {
    left: `${((anchorX - faceCenter.x * width) / gameCharacterLayerWidth) * 100}%`,
    top: `${((anchorY - faceCenter.y * height) / gameCharacterLayerHeight) * 100}%`,
    width: `${(width / gameCharacterLayerWidth) * 100}%`,
    height: `${(height / gameCharacterLayerHeight) * 100}%`,
    opacity: entry.isFocused ? clampNumber(entry.portraitOpacity, 0, 1, 1) : stageCastUnfocusedOpacity,
    zIndex: index + 1
  } as CSSProperties;
}

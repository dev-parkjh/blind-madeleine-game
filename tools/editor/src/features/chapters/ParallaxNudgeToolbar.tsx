import { Icon } from "../../components/EditorControls";
import {
  clampNumber,
  normalizeRotationDegrees,
  roundForInput,
  roundParallaxCoordinate
} from "../../lib/numeric";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord } from "../../types";
import {
  getParallaxLayerDefaultLayout,
  getParallaxLayerKind,
  getParallaxLayerPosition,
  getParallaxLayerScale
} from "./chapterArtModel";

export function ParallaxNudgeToolbar({
  axisLock,
  layers,
  selectedLayerIndex,
  selectedVisualTarget,
  title,
  onSetAxisLock,
  onChangeLayer,
  onChangeTitleLayout
}: {
  axisLock: "free" | "x" | "y";
  layers: ResourceRecord[];
  selectedLayerIndex: number;
  selectedVisualTarget: "layer" | "title";
  title: ResourceRecord;
  onSetAxisLock: (next: "free" | "x" | "y") => void;
  onChangeLayer: (index: number, patch: ResourceRecord) => void;
  onChangeTitleLayout: (patch: ResourceRecord) => void;
}) {
  const layer = layers[selectedLayerIndex];
  const isTitle = selectedVisualTarget === "title";
  if (!isTitle && !layer) return null;

  const targetLabel = isTitle ? "Title" : String(layer.name || layer.id || `Layer ${selectedLayerIndex + 1}`);
  const position = isTitle ? asArray<number>(title.position) : getParallaxLayerPosition(layer);
  const x = isTitle ? clampNumber(position[0], -0.5, 1.5, 0.08) : position[0];
  const y = isTitle ? clampNumber(position[1], -0.5, 1.5, 0.18) : position[1];
  const rotation = isTitle ? 0 : normalizeRotationDegrees(layer.rotation);
  const scale = isTitle ? clampNumber(title.scale, 0.2, 2.4, 1) : getParallaxLayerScale(layer);
  const resetLayout = isTitle ? { x: 0.08, y: 0.18, scale: 1 } : getParallaxLayerDefaultLayout(getParallaxLayerKind(layer));
  const canRotate = !isTitle && getParallaxLayerKind(layer) !== "background";

  function updatePosition(nextX: number, nextY: number) {
    const nextPosition = [roundParallaxCoordinate(nextX), roundParallaxCoordinate(nextY)];
    if (isTitle) onChangeTitleLayout({ position: nextPosition });
    else onChangeLayer(selectedLayerIndex, { position: nextPosition });
  }

  function updateScale(nextValue: number) {
    if (isTitle) {
      const nextScale = roundForInput(clampNumber(nextValue, 0.2, 2.4, 1));
      onChangeTitleLayout({ scale: nextScale, scale_x: nextScale, scale_y: nextScale });
      return;
    }
    const nextScale = roundForInput(clampNumber(nextValue, 0.05, 4, 1));
    onChangeLayer(selectedLayerIndex, { scale: nextScale, scale_x: nextScale, scale_y: nextScale });
  }

  return (
    <div className="transform-nudge-panel">
      <div className="nudge-panel-header">
        <strong>{targetLabel}</strong>
        <code>{isTitle ? "title" : "layer"} · {axisLock === "free" ? "free" : `${axisLock.toUpperCase()} axis`}</code>
      </div>
      <div className="nudge-toolbar">
        <button aria-label="Move left" type="button" onClick={() => updatePosition(x - 0.01, y)}><Icon name="West" /></button>
        <button aria-label="Move up" type="button" onClick={() => updatePosition(x, y - 0.01)}><Icon name="North" /></button>
        <button aria-label="Move down" type="button" onClick={() => updatePosition(x, y + 0.01)}><Icon name="South" /></button>
        <button aria-label="Move right" type="button" onClick={() => updatePosition(x + 0.01, y)}><Icon name="East" /></button>
        <button aria-label="Center position" type="button" onClick={() => updatePosition(0.5, 0.5)}><Icon name="CenterFocusStrong" /></button>
        <button aria-label="Reset position" type="button" onClick={() => updatePosition(resetLayout.x, resetLayout.y)}><Icon name="Restore" /></button>
      </div>
      <div className="nudge-toolbar">
        <button aria-label="Scale down" type="button" onClick={() => updateScale(scale - 0.05)}><Icon name="ZoomOut" /></button>
        <button aria-label="Reset scale" type="button" onClick={() => updateScale(resetLayout.scale)}><Icon name="SettingsBackupRestore" /></button>
        <button aria-label="Scale up" type="button" onClick={() => updateScale(scale + 0.05)}><Icon name="ZoomIn" /></button>
        {canRotate && (
          <>
            <button aria-label="Rotate left 1 degree" type="button" onClick={() => onChangeLayer(selectedLayerIndex, { rotation: normalizeRotationDegrees(rotation - 1) })}><Icon name="RotateLeft" /></button>
            <button aria-label="Rotate right 1 degree" type="button" onClick={() => onChangeLayer(selectedLayerIndex, { rotation: normalizeRotationDegrees(rotation + 1) })}><Icon name="RotateRight" /></button>
            <button aria-label="Rotate left 15 degrees" type="button" onClick={() => onChangeLayer(selectedLayerIndex, { rotation: normalizeRotationDegrees(rotation - 15) })}>-15</button>
            <button aria-label="Rotate right 15 degrees" type="button" onClick={() => onChangeLayer(selectedLayerIndex, { rotation: normalizeRotationDegrees(rotation + 15) })}>+15</button>
          </>
        )}
      </div>
      <div className="axis-lock-control" role="group" aria-label="Axis lock">
        {(["free", "x", "y"] as const).map((value) => (
          <button className={axisLock === value ? "active" : ""} key={value} type="button" onClick={() => onSetAxisLock(value)}>
            {value === "free" ? "Free" : `${value.toUpperCase()} lock`}
          </button>
        ))}
      </div>
    </div>
  );
}

import { DragLockToggle } from "../../components/DragLock";
import type { ResourceRecord } from "../../types";
import {
  getParallaxTitleLayout,
  parallaxLayerTransformSummary
} from "./chapterArtModel";
import { ParallaxNudgeToolbar } from "./ParallaxNudgeToolbar";
import { ParallaxVisualStage } from "./ParallaxVisualStage";
import { useParallaxVisualController } from "./useParallaxVisualController";

export function ParallaxVisualEditor({
  draft,
  layers,
  parallax,
  selectedLayerIndex,
  onSelectLayer,
  onChangeLayer,
  onChangeTitleLayout
}: {
  draft: ResourceRecord;
  layers: ResourceRecord[];
  parallax: ResourceRecord;
  selectedLayerIndex: number;
  onSelectLayer: (index: number) => void;
  onChangeLayer: (index: number, patch: ResourceRecord) => void;
  onChangeTitleLayout: (patch: ResourceRecord) => void;
}) {
  const visual = useParallaxVisualController({
    layers,
    onChangeLayer,
    onChangeTitleLayout,
    onSelectLayer,
    parallax,
    selectedLayerIndex
  });

  return (
    <section className="parallax-visual-editor">
      <div className="coordinate-editor-header">
        <span>Layer position</span>
        <div className="coordinate-editor-meta">
          <code>{layers.length} layers</code>
          <DragLockToggle
            available={visual.dragLock.available}
            locked={visual.dragLock.locked}
            onToggle={visual.dragLock.toggle}
          />
        </div>
      </div>
      <ParallaxVisualStage
        draft={draft}
        dragLockAvailable={visual.dragLock.available}
        dragLocked={visual.dragLock.locked}
        entries={visual.entries}
        hasImage={visual.hasImage}
        layerAspectRatios={visual.layerAspectRatios}
        onPointerCancel={visual.stopDrag}
        onPointerDown={visual.startPreviewOffsetDrag}
        onPointerMove={visual.handlePointerMove}
        onPointerUp={visual.stopDrag}
        onRememberLayerAspectRatio={visual.rememberLayerAspectRatio}
        onStageWheel={visual.handleStageWheel}
        onStartAnchorDrag={visual.startAnchorDrag}
        onStartPositionDrag={visual.startPositionDrag}
        onStartRotationDrag={visual.startRotationDrag}
        onStartScaleDrag={visual.startScaleDrag}
        onStartTitlePositionDrag={visual.startTitlePositionDrag}
        onStartTitleScaleDrag={visual.startTitleScaleDrag}
        onToggleDragLock={visual.dragLock.toggle}
        overlay={visual.overlay}
        overlayUrl={visual.overlayUrl}
        parallax={parallax}
        previewOffset={visual.previewOffset}
        selectedLayerIndex={selectedLayerIndex}
        selectedVisualTarget={visual.selectedVisualTarget}
        stageRef={visual.stageRef}
        stageScale={visual.stageScale}
      />
      {layers.length > 0 && (
        <div className="parallax-selected-summary">
          <strong>{String(layers[selectedLayerIndex]?.name || layers[selectedLayerIndex]?.id || `Layer ${selectedLayerIndex + 1}`)}</strong>
          <span>{String(layers[selectedLayerIndex]?.kind || "sprite")}</span>
          <code>{parallaxLayerTransformSummary(layers[selectedLayerIndex])}</code>
        </div>
      )}
      <ParallaxNudgeToolbar
        axisLock={visual.axisLock}
        layers={layers}
        onChangeLayer={onChangeLayer}
        onChangeTitleLayout={onChangeTitleLayout}
        onSetAxisLock={visual.setAxisLock}
        selectedLayerIndex={selectedLayerIndex}
        selectedVisualTarget={visual.selectedVisualTarget}
        title={getParallaxTitleLayout(parallax)}
      />
    </section>
  );
}

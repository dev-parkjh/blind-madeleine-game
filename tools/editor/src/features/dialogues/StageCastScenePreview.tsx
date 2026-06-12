import type { SyntheticEvent } from "react";
import { useRef, useState } from "react";
import { useUiText } from "../../editorText";
import type { PointerPoint } from "../../editorTypes";
import {
  StageCastActualPreviewControls,
  StageCastActualPreviewFrame
} from "./StageCastActualPreviewPanel";
import type {
  StageCastActualPreviewContext,
  StageCastPreviewEntry
} from "./stageCastPreviewTypes";
import { StageCastWebPreview, stageCastImageKey } from "./StageCastWebPreview";
import { useStageCastActualPreviewController } from "./useStageCastActualPreviewController";
import { useStageCastCustomOffsetDrag } from "./useStageCastCustomOffsetDrag";

export type { StageCastActualPreviewContext, StageCastPreviewEntry } from "./stageCastPreviewTypes";

export function StageCastScenePreview({
  actualPreview,
  entries,
  onMoveCustomOffset,
  selectedCastId
}: {
  actualPreview?: StageCastActualPreviewContext;
  entries: StageCastPreviewEntry[];
  onMoveCustomOffset?: (characterId: string, offset: PointerPoint) => void;
  selectedCastId: string;
}) {
  const ui = useUiText();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [imageSizes, setImageSizes] = useState<Record<string, { w: number; h: number }>>({});
  const visibleEntries = entries
    .filter((entry) => entry.portrait?.path)
    .sort((a, b) => a.animationOrder === b.animationOrder ? a.index - b.index : a.animationOrder - b.animationOrder);
  const selectedEntry = selectedCastId ? visibleEntries.find((entry) => entry.characterId === selectedCastId) || null : null;
  const actualPreviewController = useStageCastActualPreviewController({ actualPreview, ui });
  const customOffsetDrag = useStageCastCustomOffsetDrag({
    onMoveCustomOffset,
    selectedEntry,
    stageRef
  });

  function rememberImageSize(entry: StageCastPreviewEntry, event: SyntheticEvent<HTMLImageElement>) {
    const imageKey = stageCastImageKey(entry);
    const image = event.currentTarget;
    if (!imageKey || image.naturalWidth <= 0 || image.naturalHeight <= 0) return;
    setImageSizes((previous) => {
      const current = previous[imageKey];
      if (current?.w === image.naturalWidth && current.h === image.naturalHeight) return previous;
      return { ...previous, [imageKey]: { w: image.naturalWidth, h: image.naturalHeight } };
    });
  }

  return (
    <div className="stage-cast-preview-wrapper">
      <StageCastActualPreviewControls
        actualPreview={actualPreview}
        actualPreviewBusy={actualPreviewController.actualPreviewBusy}
        godotLaunchMenuOpen={actualPreviewController.godotLaunchMenuOpen}
        hasActualPreviewContext={actualPreviewController.hasActualPreviewContext}
        onLaunchNativePreview={(kind) => void actualPreviewController.launchNativePreview(kind)}
        onSwitchPreviewMode={actualPreviewController.switchPreviewMode}
        onToggleLaunchMenu={actualPreviewController.toggleGodotLaunchMenu}
        previewMode={actualPreviewController.previewMode}
        ui={ui}
      />
      {actualPreviewController.previewMode === "web" && (
        <StageCastWebPreview
          dragLockAvailable={customOffsetDrag.dragLock.available}
          dragLocked={customOffsetDrag.dragLock.locked}
          entries={entries}
          imageSizes={imageSizes}
          onPointerCancel={customOffsetDrag.stopCustomOffsetDrag}
          onPointerMove={customOffsetDrag.moveCustomOffsetDrag}
          onPointerUp={customOffsetDrag.stopCustomOffsetDrag}
          onRememberImageSize={rememberImageSize}
          onStartCustomOffsetDrag={customOffsetDrag.startCustomOffsetDrag}
          onToggleDragLock={customOffsetDrag.dragLock.toggle}
          onUpdateSelectedCustomOffset={customOffsetDrag.updateSelectedCustomOffset}
          selectedCastId={selectedCastId}
          selectedEntry={selectedEntry}
          stageRef={stageRef}
          ui={ui}
          visibleEntries={visibleEntries}
        />
      )}
      <StageCastActualPreviewFrame
        actualPreview={actualPreview}
        actualPreviewBusy={actualPreviewController.actualPreviewBusy}
        actualPreviewBusyKind={actualPreviewController.actualPreviewBusyKind}
        actualPreviewCoverMessage={actualPreviewController.actualPreviewCoverMessage}
        actualPreviewFrameRef={actualPreviewController.actualPreviewFrameRef}
        actualPreviewLoadCover={actualPreviewController.actualPreviewLoadCover}
        actualPreviewOpenUrl={actualPreviewController.actualPreviewOpenUrl}
        actualPreviewStatus={actualPreviewController.actualPreviewStatus}
        actualPreviewUrl={actualPreviewController.actualPreviewUrl}
        activeModeConfig={actualPreviewController.activeModeConfig}
        hasActualPreviewContext={actualPreviewController.hasActualPreviewContext}
        onBuildPreview={() => void actualPreviewController.prepareActualPreview(actualPreviewController.previewMode, true)}
        onFrameLoad={actualPreviewController.handleActualPreviewFrameLoad}
        onRefreshPreview={() => void actualPreviewController.prepareActualPreview(actualPreviewController.previewMode)}
        previewMode={actualPreviewController.previewMode}
        ui={ui}
      />
    </div>
  );
}

import type { CSSProperties, RefObject } from "react";
import { Icon } from "../../components/EditorControls";
import type { EditorCopy } from "../../editorText";
import type { PreviewMode } from "../../editorTypes";
import type { StageCastActualPreviewContext } from "./stageCastPreviewTypes";

export type GodotWebPreviewModeConfig = {
  id: PreviewMode;
  width: number;
  height: number;
  device: string;
};

export const godotWebPreviewModes: GodotWebPreviewModeConfig[] = [
  { id: "web", width: 16, height: 9, device: "" },
  { id: "pc", width: 16, height: 9, device: "pc" },
  { id: "fold7", width: 2520, height: 1080, device: "fold7" },
  { id: "fold7-open", width: 2184, height: 1968, device: "fold7_open" }
];

export function previewModeLabel(mode: PreviewMode, ui: EditorCopy) {
  if (mode === "pc") return ui.preview.pc;
  if (mode === "fold7") return ui.preview.fold7;
  if (mode === "fold7-open") return ui.preview.fold7Open;
  return ui.preview.web;
}

export function StageCastActualPreviewControls({
  actualPreview,
  actualPreviewBusy,
  godotLaunchMenuOpen,
  hasActualPreviewContext,
  previewMode,
  ui,
  onLaunchNativePreview,
  onSwitchPreviewMode,
  onToggleLaunchMenu
}: {
  actualPreview: StageCastActualPreviewContext | undefined;
  actualPreviewBusy: boolean;
  godotLaunchMenuOpen: boolean;
  hasActualPreviewContext: boolean;
  previewMode: PreviewMode;
  ui: EditorCopy;
  onLaunchNativePreview: (kind: "current" | "previous") => void;
  onSwitchPreviewMode: (mode: PreviewMode) => void;
  onToggleLaunchMenu: () => void;
}) {
  if (!actualPreview) return null;

  return (
    <div className="stage-cast-preview-controls">
      <div className="preview-mode-bar stage-cast-preview-mode-bar" role="tablist" aria-label={ui.preview.actualPreview}>
        {godotWebPreviewModes.map((entry) => (
          <button
            aria-selected={previewMode === entry.id}
            className={previewMode === entry.id ? "active" : ""}
            key={entry.id}
            role="tab"
            type="button"
            onClick={() => onSwitchPreviewMode(entry.id)}
          >
            {previewModeLabel(entry.id, ui)}
          </button>
        ))}
      </div>
      <div className="godot-launch-menu">
        <button
          aria-expanded={godotLaunchMenuOpen}
          className="godot-launch-trigger"
          disabled={actualPreviewBusy || !hasActualPreviewContext}
          type="button"
          onClick={onToggleLaunchMenu}
        >
          <Icon name="SmartToy" />
          {ui.preview.godotRun}
        </button>
        {godotLaunchMenuOpen && (
          <div className="godot-launch-options" role="menu">
            <button type="button" role="menuitem" onClick={() => onLaunchNativePreview("current")}>
              {ui.preview.currentDialogue}
            </button>
            <button
              disabled={!actualPreview.previousNodeId}
              type="button"
              role="menuitem"
              onClick={() => onLaunchNativePreview("previous")}
            >
              {ui.preview.previousDialogue}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function StageCastActualPreviewFrame({
  actualPreview,
  actualPreviewBusy,
  actualPreviewBusyKind,
  actualPreviewCoverMessage,
  actualPreviewFrameRef,
  actualPreviewLoadCover,
  actualPreviewOpenUrl,
  actualPreviewStatus,
  actualPreviewUrl,
  activeModeConfig,
  hasActualPreviewContext,
  previewMode,
  ui,
  onBuildPreview,
  onFrameLoad,
  onRefreshPreview
}: {
  actualPreview: StageCastActualPreviewContext | undefined;
  actualPreviewBusy: boolean;
  actualPreviewBusyKind: "" | "prepare" | "build";
  actualPreviewCoverMessage: string;
  actualPreviewFrameRef: RefObject<HTMLIFrameElement | null>;
  actualPreviewLoadCover: boolean;
  actualPreviewOpenUrl: string;
  actualPreviewStatus: string;
  actualPreviewUrl: string;
  activeModeConfig: GodotWebPreviewModeConfig;
  hasActualPreviewContext: boolean;
  previewMode: PreviewMode;
  ui: EditorCopy;
  onBuildPreview: () => void;
  onFrameLoad: () => void;
  onRefreshPreview: () => void;
}) {
  if (!actualPreview) return null;

  return (
    <section
      aria-hidden={previewMode === "web"}
      aria-label={ui.preview.actualPreview}
      className={`actual-preview-panel stage-cast-actual-preview ${previewMode === "web" ? "hidden" : ""}`}
    >
      <div className="actual-preview-toolbar">
        <strong>{previewModeLabel(previewMode, ui)}</strong>
        <span>{activeModeConfig.width} x {activeModeConfig.height}</span>
        <button disabled={actualPreviewBusy || !hasActualPreviewContext} type="button" onClick={onRefreshPreview}>
          {ui.preview.refresh}
        </button>
        <button disabled={actualPreviewBusy || !hasActualPreviewContext} type="button" onClick={onBuildPreview}>
          {ui.preview.actualPreviewBuild}
        </button>
        {actualPreviewOpenUrl && (
          <a href={actualPreviewOpenUrl} rel="noreferrer" target="_blank">
            {ui.preview.openInNewTab}
          </a>
        )}
      </div>
      <div
        className="actual-preview-frame"
        style={{ "--actual-preview-aspect": `${activeModeConfig.width} / ${activeModeConfig.height}` } as CSSProperties}
      >
        {actualPreviewUrl ? (
          <iframe
            allow="fullscreen; gamepad"
            onLoad={onFrameLoad}
            ref={actualPreviewFrameRef}
            src={actualPreviewUrl}
            title={`${ui.preview.actualPreview} ${previewModeLabel(previewMode, ui)}`}
          />
        ) : (
          <div className="actual-preview-placeholder">
            <Icon name="PlayCircle" />
            <span>{hasActualPreviewContext ? (actualPreviewStatus || ui.preview.bridgeRequired) : ui.preview.actualPreviewUnavailable}</span>
          </div>
        )}
        {actualPreviewUrl && (actualPreviewLoadCover || actualPreviewBusyKind === "build") && (
          <div className="actual-preview-placeholder actual-preview-cover" role="status">
            <Icon name={actualPreviewBusyKind === "build" ? "Build" : "PlayCircle"} />
            <span>{actualPreviewCoverMessage}</span>
          </div>
        )}
      </div>
      {actualPreviewStatus && <p className="actual-preview-status">{actualPreviewStatus}</p>}
    </section>
  );
}

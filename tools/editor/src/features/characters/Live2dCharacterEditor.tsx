import { Icon, NumberField, SelectLiteralField, TextField, ToggleField } from "../../components/EditorControls";
import { safeSegment } from "../../lib/files";
import { normalizeBooleanFlag } from "../../lib/numeric";
import type { ResourceRecord } from "../../types";
import { Live2dAngleRigEditor } from "./Live2dAngleRigEditor";
import { Live2dMotionEditor } from "./Live2dMotionEditor";
import { Live2dPartRow } from "./Live2dPartRow";
import { Live2dPartsPreview } from "./Live2dPartsPreview";
import {
  getLive2dAngleMax,
  live2dCanvasHeightDefault,
  live2dCanvasWidthDefault
} from "./live2dModel";
import { useLive2dCharacterController } from "./useLive2dCharacterController";

export function Live2dCharacterEditor({
  disabled,
  draft,
  updateField,
  uploadFile
}: {
  disabled: boolean;
  draft: ResourceRecord;
  updateField: (field: string, value: unknown) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  const {
    activeTab,
    addMotion,
    addPart,
    angleRig,
    canvasSize,
    center,
    copy,
    defaultMotionKey,
    live2d,
    live2dTabs,
    motionEntries,
    motionKeys,
    parts,
    patchAngleRig,
    patchLive2d,
    previewAngle,
    previewMotion,
    previewMotionKey,
    previewParts,
    previewPlaying,
    previewResetToken,
    removeMotion,
    removePart,
    renameMotion,
    renamePart,
    setActiveTab,
    setPreviewAngle,
    setPreviewMotionKey,
    setPreviewPlaying,
    setPreviewResetToken,
    setSettingsOpen,
    settingsOpen,
    updateAnglePart,
    updateMotion,
    updateMotionPart,
    updatePart
  } = useLive2dCharacterController({ draft, updateField });

  return (
    <div className="wide structured-editor live2d-editor live2d-launcher">
      <div className="structured-header">
        <span>{copy.title}</span>
        <button disabled={disabled} type="button" onClick={() => setSettingsOpen(true)}>
          <Icon name="Tune" />{copy.openSettings}
        </button>
      </div>
      <div className="live2d-summary-grid">
        <div>
          <strong>{parts.length}</strong>
          <span>{copy.parts}</span>
        </div>
        <div>
          <strong>{motionEntries.length}</strong>
          <span>{copy.motions}</span>
        </div>
        <div>
          <strong>{getLive2dAngleMax(angleRig)}°</strong>
          <span>{copy.angleRig}</span>
        </div>
        <div>
          <strong>{normalizeBooleanFlag(live2d.enabled) ? copy.enabledOn : copy.enabledOff}</strong>
          <span>{copy.enabled}</span>
        </div>
        <div>
          <strong>{defaultMotionKey || "-"}</strong>
          <span>{copy.defaultMotion}</span>
        </div>
      </div>

      {settingsOpen && (
        <div className="live2d-modal-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSettingsOpen(false);
        }}>
          <section className="live2d-modal" aria-modal="true" role="dialog" aria-label={copy.title}>
            <header className="live2d-modal-header">
              <div>
                <strong>{copy.title}</strong>
                <span>{String(draft.display_name || draft.id || "")}</span>
              </div>
              <button className="icon-only-action" type="button" onClick={() => setSettingsOpen(false)} aria-label={copy.close}>
                <Icon name="Close" />
              </button>
            </header>

            <div className="live2d-modal-tabs" role="tablist">
              {live2dTabs.map((entry) => (
                <button
                  aria-selected={activeTab === entry.id}
                  className={activeTab === entry.id ? "active" : ""}
                  key={entry.id}
                  role="tab"
                  type="button"
                  onClick={() => setActiveTab(entry.id)}
                >
                  {entry.label}
                </button>
              ))}
            </div>

            <div className="live2d-modal-body">
              {activeTab === "preview" && (
                <div className="live2d-preview-workspace">
                  <Live2dPartsPreview
                    canvasSize={canvasSize}
                    motion={previewMotion}
                    motionKey={previewMotionKey}
                    parts={previewParts}
                    playing={previewPlaying}
                    resetToken={previewResetToken}
                  />
                  <div className="live2d-preview-controls">
                    {motionKeys.length > 0 && (
                      <SelectLiteralField
                        label={copy.previewMotion}
                        value={previewMotionKey}
                        options={motionKeys}
                        onChange={setPreviewMotionKey}
                      />
                    )}
                    <NumberField
                      label={copy.previewAngle}
                      value={previewAngle}
                      min={-45}
                      max={45}
                      step={5}
                      resetValue={0}
                      onChange={setPreviewAngle}
                    />
                    <button type="button" onClick={() => setPreviewPlaying((playing) => !playing)}>
                      <Icon name={previewPlaying ? "PauseCircle" : "PlayCircle"} />
                      {previewPlaying ? copy.pause : copy.play}
                    </button>
                    <button type="button" onClick={() => setPreviewResetToken((value) => value + 1)}>
                      <Icon name="RestartAlt" />
                      {copy.resetPreview}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "setup" && (
                <div className="live2d-settings-grid">
                  <ToggleField label={copy.enabled} checked={normalizeBooleanFlag(live2d.enabled)} onChange={(checked) => patchLive2d({ enabled: checked })} />
                  <TextField label={copy.defaultMotion} value={live2d.default_motion || ""} onChange={(value) => patchLive2d({ default_motion: safeSegment(value, "default") })} />
                  <NumberField label={copy.canvasWidth} value={canvasSize.x} min={100} max={4000} step={50} resetValue={live2dCanvasWidthDefault} onChange={(value) => patchLive2d({ canvas_size: [value, canvasSize.y] })} />
                  <NumberField label={copy.canvasHeight} value={canvasSize.y} min={100} max={5000} step={50} resetValue={live2dCanvasHeightDefault} onChange={(value) => patchLive2d({ canvas_size: [canvasSize.x, value] })} />
                  <NumberField label={copy.centerX} value={center.x} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => patchLive2d({ center: [value, center.y] })} />
                  <NumberField label={copy.centerY} value={center.y} min={0} max={1} step={0.01} resetValue={0.34} onChange={(value) => patchLive2d({ center: [center.x, value] })} />
                </div>
              )}

              {activeTab === "parts" && (
                <div className="live2d-section">
                  <div className="structured-header">
                    <span>{copy.parts}</span>
                    <button disabled={disabled} type="button" onClick={addPart}><Icon name="Add" />{copy.addPart}</button>
                  </div>
                  {parts.length === 0 && <p className="empty-state">{copy.noParts}</p>}
                  {parts.map((part, index) => (
                    <Live2dPartRow
                      canvasSize={canvasSize}
                      characterId={String(draft.id || "character")}
                      copy={copy}
                      disabled={disabled}
                      key={`live2d-part-${index}`}
                      onRemove={() => removePart(index)}
                      onRename={(nextId) => renamePart(index, nextId)}
                      onUpdate={(patch) => updatePart(index, patch)}
                      part={part}
                      uploadFile={uploadFile}
                    />
                  ))}
                </div>
              )}

              {activeTab === "angle" && (
                <div className="live2d-section">
                  <div className="structured-header">
                    <span>{copy.angleRig}</span>
                  </div>
                  <Live2dAngleRigEditor
                    angleRig={angleRig}
                    copy={copy}
                    onUpdate={patchAngleRig}
                    onUpdatePart={updateAnglePart}
                    parts={parts}
                  />
                </div>
              )}

              {activeTab === "motions" && (
                <div className="live2d-section">
                  <div className="structured-header">
                    <span>{copy.motions}</span>
                    <button disabled={disabled} type="button" onClick={addMotion}><Icon name="Add" />{copy.addMotion}</button>
                  </div>
                  {motionEntries.length === 0 && <p className="empty-state">{copy.noMotions}</p>}
                  {motionEntries.map(([motionKey, motion]) => (
                    <Live2dMotionEditor
                      copy={copy}
                      disabled={disabled}
                      key={`live2d-motion-${motionKey}`}
                      motion={motion}
                      motionKey={motionKey}
                      parts={parts}
                      onRemove={() => removeMotion(motionKey)}
                      onRename={(nextKey) => renameMotion(motionKey, nextKey)}
                      onUpdate={(patch) => updateMotion(motionKey, patch)}
                      onUpdatePart={(partId, patch) => updateMotionPart(motionKey, partId, patch)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

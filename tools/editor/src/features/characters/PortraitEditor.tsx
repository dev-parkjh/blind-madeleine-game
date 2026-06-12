import { useEffect, useState } from "react";
import { Icon, NumberField, TextField, UploadField } from "../../components/EditorControls";
import { useUiText } from "../../editorText";
import { fileExtension, safeSegment } from "../../lib/files";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord } from "../../types";
import { PortraitCenterEditor } from "./PortraitCenterEditor";
import { ProfileCropEditor } from "./ProfileCropEditor";
import {
  getPortraitCenterPoint,
  getProfileOffset,
  getProfileZoom,
  portraitRecordForEditor,
  profileZoomDefault,
  profileZoomMax,
  profileZoomMin,
  profileZoomStep,
  withProfileOffset,
  withProfileZoom
} from "./portraitModel";

export function PortraitEditor({
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
  const ui = useUiText();
  const portraits = draft.portraits && typeof draft.portraits === "object" ? draft.portraits as Record<string, ResourceRecord | string> : {};
  const entries = Object.entries(portraits);

  function setPortraits(next: Record<string, ResourceRecord | string>) {
    updateField("portraits", next);
  }

  function renamePortrait(oldKey: string, nextKey: string) {
    const clean = safeSegment(nextKey || oldKey, "default");
    if (clean === oldKey) return;
    const next: Record<string, ResourceRecord | string> = {};
    for (const [key, value] of entries) {
      if (key === oldKey) {
        if (Object.prototype.hasOwnProperty.call(next, clean)) continue;
        next[clean] = value;
      } else if (!Object.prototype.hasOwnProperty.call(next, key)) {
        next[key] = value;
      }
    }
    setPortraits(next);
  }

  function updatePortrait(key: string, patch: ResourceRecord) {
    setPortraits({ ...portraits, [key]: { ...portraitRecordForEditor(portraits[key]), ...patch } });
  }

  function removePortrait(key: string) {
    const next = { ...portraits };
    delete next[key];
    setPortraits(next);
  }

  return (
    <div className="wide structured-editor portrait-editor">
      <div className="structured-header">
        <span>{ui.form.portraits}</span>
      </div>
      {entries.length === 0 && <p className="empty-state">{ui.form.noPortraits}</p>}
      {entries.map(([key, portrait], index) => (
        <PortraitRowEditor
          characterId={String(draft.id || "character")}
          disabled={disabled}
          key={`portrait-row-${index}`}
          onRemove={() => removePortrait(key)}
          onRename={(nextKey) => renamePortrait(key, nextKey)}
          onUpdate={(patch) => updatePortrait(key, patch)}
          portrait={portrait}
          portraitKey={key}
          uploadFile={uploadFile}
        />
      ))}
    </div>
  );
}

function PortraitRowEditor({
  characterId,
  disabled,
  onRemove,
  onRename,
  onUpdate,
  portrait,
  portraitKey,
  uploadFile
}: {
  characterId: string;
  disabled: boolean;
  onRemove: () => void;
  onRename: (nextKey: string) => void;
  onUpdate: (patch: ResourceRecord) => void;
  portrait: ResourceRecord | string;
  portraitKey: string;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  const ui = useUiText();
  const [draftKey, setDraftKey] = useState(portraitKey);
  const portraitRecord = portraitRecordForEditor(portrait);
  const center = asArray<number>(portraitRecord.center);
  const profile = portraitRecord.profile && typeof portraitRecord.profile === "object" ? portraitRecord.profile as ResourceRecord : {};
  const profileOffset = getProfileOffset(profile);
  const centerPoint = getPortraitCenterPoint(center);

  useEffect(() => {
    setDraftKey(portraitKey);
  }, [portraitKey]);

  function commitPortraitKey() {
    const clean = safeSegment(draftKey || portraitKey, "default");
    setDraftKey(clean);
    if (clean !== portraitKey) onRename(clean);
  }

  return (
    <article className="structured-row portrait-row">
      <div className="portrait-entry-fields">
        <TextField
          label={ui.form.key}
          value={draftKey}
          onBlur={commitPortraitKey}
          onChange={setDraftKey}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
        <TextField label={ui.form.path} value={portraitRecord.path || ""} onChange={(value) => onUpdate({ path: value })} />
        <UploadField
          disabled={disabled}
          label={ui.form.uploadPortrait}
          accept="image/png,image/jpeg,image/webp,image/gif"
          onUpload={async (file) => {
            const path = await uploadFile(`assets/characters/${safeSegment(characterId)}/${safeSegment(portraitKey)}.${fileExtension(file)}`, file);
            onUpdate({ path });
            return path;
          }}
        />
      </div>
      <div className="portrait-visual-area">
        <PortraitCenterEditor
          label={ui.form.center}
          imagePath={portraitRecord.path}
          x={centerPoint.x}
          y={centerPoint.y}
          onChange={(x, y) => onUpdate({ center: [x, y] })}
        />
        <ProfileCropEditor
          faceCenter={centerPoint}
          imagePath={portraitRecord.path}
          profile={profile}
          onChangeProfile={(nextProfile) => onUpdate({ profile: nextProfile })}
        />
      </div>
      <div className="portrait-controls-panel">
        <NumberField label={ui.form.centerX} value={center[0] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => onUpdate({ center: [value, center[1] ?? 0.5] })} />
        <NumberField label={ui.form.centerY} value={center[1] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => onUpdate({ center: [center[0] ?? 0.5, value] })} />
        <NumberField label={ui.form.profileZoom} value={getProfileZoom(profile.zoom)} min={profileZoomMin} max={profileZoomMax} step={profileZoomStep} resetValue={profileZoomDefault} onChange={(value) => onUpdate({ profile: withProfileZoom(profile, value) })} />
        <NumberField label={ui.form.profileOffsetX} value={profileOffset.x} min={-1} max={1} step={0.01} resetValue={0} onChange={(value) => onUpdate({ profile: withProfileOffset(profile, { x: value, y: profileOffset.y }) })} />
        <NumberField label={ui.form.profileOffsetY} value={profileOffset.y} min={-1} max={1} step={0.01} resetValue={0} onChange={(value) => onUpdate({ profile: withProfileOffset(profile, { x: profileOffset.x, y: value }) })} />
        <button className="danger-action" disabled={disabled} type="button" onClick={onRemove}><Icon name="Delete" />{ui.common.delete}</button>
      </div>
    </article>
  );
}

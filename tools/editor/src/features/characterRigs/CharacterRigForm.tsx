import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Icon, NumberField, SelectField, TextField, ToggleField, UploadField } from "../../components/EditorControls";
import { resPathToAssetUrl } from "../../lib/resourcePaths";
import { safeSegment } from "../../lib/files";
import type { ResourceFormCommonProps } from "../resources/resourceFormTypes";
import { ChoiceJsonField } from "../dialogues/ChoiceJsonField";
import {
  characterRigGuideUploadPath,
  characterRigPartUploadPath,
  normalizeGuide,
  normalizeMotionTracks,
  normalizePhysics,
  normalizeRigCanvas,
  normalizeRigEditorData,
  normalizeRigParts,
  normalizeRigStates,
  normalizeTransform,
  normalizeVector,
  rigAngleMax,
  rigAngleMin,
  rigDefaultStateId
} from "./characterRigModel";
import type { ResourceRecord } from "../../types";
import { clampNumber, normalizeNumber, roundForInput } from "../../lib/numeric";

type RigEditMode = "base" | "angle" | "state";

type CharacterRigFormProps = ResourceFormCommonProps & {
  embedded?: boolean;
};

export function CharacterRigForm({
  disabled,
  draft,
  references,
  updateField,
  uploadFile,
  replaceDraft,
  embedded = false
}: CharacterRigFormProps) {
  const [mode, setMode] = useState<RigEditMode>("base");
  const [angle, setAngle] = useState(0);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [stateId, setStateId] = useState(rigDefaultStateId);
  const canvas = normalizeRigCanvas(draft.canvas);
  const parts = normalizeRigParts(draft.parts);
  const states = normalizeRigStates(draft.states);
  const motionTracks = normalizeMotionTracks(draft.motion_tracks);
  const editorData = normalizeRigEditorData(draft.editor);
  const selectedPart = parts.find((part) => part.id === selectedPartId) || parts[0] || null;
  const selectedPartStableId = selectedPart?.id ? String(selectedPart.id) : "";
  const resolvedStateId = states[stateId] ? stateId : rigDefaultStateId;
  const previewParts = useMemo(() => buildPreviewParts(parts, draft.angle_tracks, states, mode, angle, resolvedStateId), [parts, draft.angle_tracks, states, mode, angle, resolvedStateId]);

  function patchDraft(patch: ResourceRecord) {
    replaceDraft({ ...draft, ...patch });
  }

  function setParts(nextParts: ResourceRecord[]) {
    updateField("parts", nextParts);
  }

  function updatePart(partId: string, patch: ResourceRecord) {
    setParts(parts.map((part) => part.id === partId ? { ...part, ...patch } : part));
  }

  function updatePartTransform(partId: string, patch: ResourceRecord) {
    const part = parts.find((entry) => entry.id === partId);
    if (!part) return;
    updatePart(partId, { base_transform: { ...normalizeTransform(part.base_transform), ...patch } });
  }

  function addPart() {
    const id = nextUniquePartId(parts);
    setParts([
      ...parts,
      {
        id,
        name: id,
        path: "",
        z_index: parts.length,
        pivot: [0, 0],
        base_transform: normalizeTransform({}),
        physics: { enabled: false, mass: 1, stiffness: 24, damping: 8, gravity: 18, weight: 1 }
      }
    ]);
    setSelectedPartId(id);
  }

  function removePart(partId: string) {
    setParts(parts.filter((part) => part.id !== partId));
    if (selectedPartId === partId) setSelectedPartId("");
  }

  function updateGuide(scope: "base" | "angle", patch: ResourceRecord) {
    const nextEditor = normalizeRigEditorData(draft.editor);
    if (scope === "base") {
      nextEditor.guides.base = { ...normalizeGuide(nextEditor.guides.base), ...patch };
    } else {
      const key = String(angle);
      const angles = nextEditor.guides.angles && typeof nextEditor.guides.angles === "object" ? nextEditor.guides.angles as ResourceRecord : {};
      angles[key] = { ...normalizeGuide(angles[key]), ...patch };
      nextEditor.guides.angles = angles;
    }
    updateField("editor", nextEditor);
  }

  function getPreviewPartTransform(partId: string) {
    const previewPart = previewParts.find((part) => String(part.id || "") === partId) as ResourceRecord | undefined;
    return normalizeTransform(previewPart?.preview_transform || previewPart?.base_transform || {});
  }

  function seedTransformForPart(partId: string, current: unknown) {
    const currentRecord = current && typeof current === "object" && !Array.isArray(current) ? current as ResourceRecord : {};
    return Object.keys(currentRecord).length > 0
      ? normalizeTransform(currentRecord)
      : getPreviewPartTransform(partId);
  }

  function updateActivePartPosition(partId: string, position: [number, number]) {
    const patch = { position: [roundForInput(position[0]), roundForInput(position[1])] };
    if (mode === "angle") updateAngleKey(partId, patch);
    else if (mode === "state") updateStateOverride(partId, patch);
    else updatePartTransform(partId, patch);
  }

  function updateAngleKey(partId: string, patch: ResourceRecord) {
    const tracks = draft.angle_tracks && typeof draft.angle_tracks === "object" ? { ...draft.angle_tracks } as ResourceRecord : {};
    const stateTracks = tracks[resolvedStateId] && typeof tracks[resolvedStateId] === "object" ? { ...tracks[resolvedStateId] } as ResourceRecord : {};
    const partTracks = stateTracks[partId] && typeof stateTracks[partId] === "object" ? { ...stateTracks[partId] } as ResourceRecord : {};
    const key = String(angle);
    partTracks[key] = { ...seedTransformForPart(partId, partTracks[key]), ...patch };
    stateTracks[partId] = partTracks;
    tracks[resolvedStateId] = stateTracks;
    updateField("angle_tracks", tracks);
  }

  function addCurrentAngleKey() {
    if (!selectedPartStableId) return;
    updateAngleKey(selectedPartStableId, getPreviewPartTransform(selectedPartStableId));
  }

  function setPresetAngleKey(nextAngle: number) {
    if (!selectedPartStableId) return;
    setAngle(nextAngle);
    const transform = getPreviewPartTransform(selectedPartStableId);
    const tracks = draft.angle_tracks && typeof draft.angle_tracks === "object" ? { ...draft.angle_tracks } as ResourceRecord : {};
    const stateTracks = tracks[resolvedStateId] && typeof tracks[resolvedStateId] === "object" ? { ...tracks[resolvedStateId] } as ResourceRecord : {};
    const partTracks = stateTracks[selectedPartStableId] && typeof stateTracks[selectedPartStableId] === "object" ? { ...stateTracks[selectedPartStableId] } as ResourceRecord : {};
    partTracks[String(nextAngle)] = { ...seedTransformForPart(selectedPartStableId, partTracks[String(nextAngle)]), ...transform };
    stateTracks[selectedPartStableId] = partTracks;
    tracks[resolvedStateId] = stateTracks;
    updateField("angle_tracks", tracks);
  }

  function deleteCurrentAngleKey() {
    if (!selectedPartStableId || Math.abs(angle) < 0.001) return;
    const key = String(roundForInput(angle));
    const tracks = draft.angle_tracks && typeof draft.angle_tracks === "object" ? { ...draft.angle_tracks } as ResourceRecord : {};
    const stateTracks = tracks[resolvedStateId] && typeof tracks[resolvedStateId] === "object" ? { ...tracks[resolvedStateId] } as ResourceRecord : {};
    const partTracks = stateTracks[selectedPartStableId] && typeof stateTracks[selectedPartStableId] === "object" ? { ...stateTracks[selectedPartStableId] } as ResourceRecord : {};
    if (!partTracks[key]) return;
    delete partTracks[key];
    stateTracks[selectedPartStableId] = partTracks;
    tracks[resolvedStateId] = stateTracks;
    updateField("angle_tracks", tracks);
  }

  function updateStateOverride(partId: string, patch: ResourceRecord) {
    const nextStates = { ...states };
    const state = { ...(nextStates[resolvedStateId] as ResourceRecord) };
    const overrides = state.part_overrides && typeof state.part_overrides === "object" ? { ...state.part_overrides } as ResourceRecord : {};
    overrides[partId] = { ...seedTransformForPart(partId, overrides[partId]), ...patch };
    state.part_overrides = overrides;
    nextStates[resolvedStateId] = state;
    updateField("states", nextStates);
  }

  function addState() {
    const id = nextUniqueStateId(states);
    updateField("states", { ...states, [id]: { label: id, part_overrides: {} } });
    setStateId(id);
  }

  const guide = mode === "angle"
    ? normalizeGuide((editorData.guides.angles as ResourceRecord)[String(angle)])
    : normalizeGuide(editorData.guides.base);

  return (
    <div className={`form-grid character-rig-editor ${embedded ? "embedded" : ""}`}>
      {!embedded && (
        <section className="wide rig-identity-strip">
          <TextField label="ID / filename" value={draft.id || ""} onChange={(value) => updateField("id", value)} readOnly />
          <TextField label="Display name" value={draft.display_name || ""} onChange={(value) => updateField("display_name", value)} />
          <SelectField label="Character" value={draft.character_id || ""} options={references.characters} onChange={(value) => updateField("character_id", value)} />
        </section>
      )}
      <section className="wide rig-studio-shell">
        <aside className="rig-studio-panel rig-left-panel">
          <div className="rig-panel-title">
            <span>Mode</span>
            <code>{mode === "angle" ? `${angle}deg` : mode === "state" ? resolvedStateId : "0deg"}</code>
          </div>
          <div className="rig-mode-bar">
            {(["base", "angle", "state"] as RigEditMode[]).map((entry) => (
              <button className={mode === entry ? "active" : ""} key={entry} type="button" onClick={() => setMode(entry)}>
                {entry === "base" ? "Base" : entry === "angle" ? "Angle" : "State"}
              </button>
            ))}
          </div>
          {mode === "angle" && (
            <label className="field-block rig-angle-control">
              <span>View angle</span>
              <input min={rigAngleMin} max={rigAngleMax} step={1} type="range" value={angle} onChange={(event) => setAngle(Number(event.target.value))} />
              <code>{angle}deg</code>
            </label>
          )}
          {mode === "state" && (
            <label className="field-block">
              <span>State</span>
              <select value={resolvedStateId} onChange={(event) => setStateId(event.target.value)}>
                {Object.keys(states).map((id) => <option key={id} value={id}>{id}</option>)}
              </select>
            </label>
          )}
          <fieldset className="structured-editor rig-compact-editor">
            <legend>Canvas</legend>
            <NumberField label="Width" value={canvas.width} min={1} step={10} resetValue={1200} onChange={(value) => patchDraft({ canvas: { ...canvas, width: value } })} />
            <NumberField label="Height" value={canvas.height} min={1} step={10} resetValue={1800} onChange={(value) => patchDraft({ canvas: { ...canvas, height: value } })} />
            <NumberField label="Origin X" value={canvas.origin[0]} step={10} resetValue={600} onChange={(value) => patchDraft({ canvas: { ...canvas, origin: [value, canvas.origin[1]] } })} />
            <NumberField label="Origin Y" value={canvas.origin[1]} step={10} resetValue={900} onChange={(value) => patchDraft({ canvas: { ...canvas, origin: [canvas.origin[0], value] } })} />
          </fieldset>
          <section className="structured-editor rig-parts-panel">
            <div className="structured-header">
              <span>Parts</span>
              <button type="button" onClick={addPart}><Icon name="Add" />Part</button>
            </div>
            {parts.length === 0 && <p className="empty-state">Add separated character parts.</p>}
            <div className="rig-part-list">
              {parts.map((part) => {
                const partId = String(part.id || "");
                return (
                  <article className={`structured-row rig-part-row ${selectedPartStableId === partId ? "active" : ""}`} key={partId} onClick={() => setSelectedPartId(partId)}>
                    <button className="inline-text-action" type="button" onClick={() => setSelectedPartId(partId)}>Select</button>
                    <strong>{part.name || partId}</strong>
                    <code>{partId}</code>
                    <span>{part.path || "No image"}</span>
                    <button className="danger-action" type="button" onClick={(event) => { event.stopPropagation(); removePart(partId); }}><Icon name="Delete" />Delete</button>
                  </article>
                );
              })}
            </div>
          </section>
        </aside>
        <section className="rig-canvas-panel">
          <div className="rig-canvas-toolbar">
            <strong>{selectedPart ? selectedPart.name || selectedPartStableId : "No part selected"}</strong>
            <span>{mode === "base" ? "Base transform" : mode === "angle" ? `Angle key ${angle}deg` : `State ${resolvedStateId}`}</span>
          </div>
          <RigPreview
            canvas={canvas}
            disabled={disabled}
            guide={guide}
            onMovePart={updateActivePartPosition}
            onSelectPart={setSelectedPartId}
            parts={previewParts}
            selectedPartId={selectedPartStableId}
          />
          <RigTimelinePanel
            angle={angle}
            currentAngleHasKey={selectedPartStableId ? Object.keys(getAngleKey(draft.angle_tracks, resolvedStateId, selectedPartStableId, angle)).length > 0 : false}
            mode={mode}
            onAddCurrentAngleKey={addCurrentAngleKey}
            onDeleteCurrentAngleKey={deleteCurrentAngleKey}
            onSetAngle={setAngle}
            onSetPresetAngleKey={setPresetAngleKey}
            selectedPartId={selectedPartStableId}
            selectedPartName={selectedPart ? String(selectedPart.name || selectedPartStableId) : ""}
            stateId={resolvedStateId}
            keyedAngles={selectedPartStableId ? getAngleKeys(draft.angle_tracks, resolvedStateId, selectedPartStableId) : []}
          />
        </section>
        <aside className="rig-studio-panel rig-right-panel">
          {mode !== "state" && (
            <GuideEditor
              disabled={disabled}
              guide={guide}
              guideId={mode === "angle" ? `angle_${angle}` : "base"}
              rigId={draft.id}
              onChange={(patch) => updateGuide(mode === "angle" ? "angle" : "base", patch)}
              uploadFile={uploadFile}
            />
          )}
          {selectedPart && selectedPartStableId && (
            <PartInspector
              disabled={disabled}
              mode={mode}
              angle={angle}
              part={{ ...selectedPart, preview_transform: getPreviewPartTransform(selectedPartStableId) }}
              rigId={draft.id}
              stateId={resolvedStateId}
              stateOverride={getStateOverride(states, resolvedStateId, selectedPartStableId)}
              angleKey={getAngleKey(draft.angle_tracks, resolvedStateId, selectedPartStableId, angle)}
              onUpdatePart={(patch) => updatePart(selectedPartStableId, patch)}
              onUpdateBaseTransform={(patch) => updatePartTransform(selectedPartStableId, patch)}
              onUpdateAngleKey={(patch) => updateAngleKey(selectedPartStableId, patch)}
              onUpdateStateOverride={(patch) => updateStateOverride(selectedPartStableId, patch)}
              uploadFile={uploadFile}
            />
          )}
          <fieldset className="structured-editor">
            <legend>Motion tracks</legend>
            <ToggleField label="Idle enabled" checked={Boolean(motionTracks.idle.enabled)} onChange={(checked) => updateField("motion_tracks", { ...motionTracks, idle: { ...motionTracks.idle, enabled: checked } })} />
            <NumberField label="Idle amplitude" value={motionTracks.idle.amplitude} min={0} max={100} step={1} resetValue={4} onChange={(value) => updateField("motion_tracks", { ...motionTracks, idle: { ...motionTracks.idle, amplitude: value } })} />
            <NumberField label="Idle frequency" value={motionTracks.idle.frequency} min={0} max={20} step={0.05} resetValue={0.45} onChange={(value) => updateField("motion_tracks", { ...motionTracks, idle: { ...motionTracks.idle, frequency: value } })} />
            <ToggleField label="Blink enabled" checked={Boolean(motionTracks.blink.enabled)} onChange={(checked) => updateField("motion_tracks", { ...motionTracks, blink: { ...motionTracks.blink, enabled: checked } })} />
            <NumberField label="Blink interval" value={motionTracks.blink.interval} min={0.1} max={60} step={0.1} resetValue={4} onChange={(value) => updateField("motion_tracks", { ...motionTracks, blink: { ...motionTracks.blink, interval: value } })} />
            <NumberField label="Blink duration" value={motionTracks.blink.duration} min={0.01} max={5} step={0.01} resetValue={0.14} onChange={(value) => updateField("motion_tracks", { ...motionTracks, blink: { ...motionTracks.blink, duration: value } })} />
            <TextField label="Closed eye part" value={motionTracks.blink.closed} onChange={(value) => updateField("motion_tracks", { ...motionTracks, blink: { ...motionTracks.blink, closed: value } })} />
            <TextField label="Open eye part" value={motionTracks.blink.open} onChange={(value) => updateField("motion_tracks", { ...motionTracks, blink: { ...motionTracks.blink, open: value } })} />
            <ToggleField label="Mouth enabled" checked={Boolean(motionTracks.mouth.enabled)} onChange={(checked) => updateField("motion_tracks", { ...motionTracks, mouth: { ...motionTracks.mouth, enabled: checked } })} />
            <TextField label="Closed mouth part" value={motionTracks.mouth.closed} onChange={(value) => updateField("motion_tracks", { ...motionTracks, mouth: { ...motionTracks.mouth, closed: value } })} />
            <TextField label="Open mouth part" value={motionTracks.mouth.open} onChange={(value) => updateField("motion_tracks", { ...motionTracks, mouth: { ...motionTracks.mouth, open: value } })} />
          </fieldset>
          {mode === "state" && (
            <section className="structured-editor">
              <div className="structured-header">
                <span>States</span>
                <button type="button" onClick={addState}><Icon name="Add" />State</button>
              </div>
              {Object.entries(states).map(([id, state]) => (
                <article className="structured-row" key={id}>
                  <strong>{id}</strong>
                  <TextField label="Label" value={(state as ResourceRecord).label || id} onChange={(value) => updateField("states", { ...states, [id]: { ...(state as ResourceRecord), label: value } })} />
                </article>
              ))}
            </section>
          )}
        </aside>
      </section>
    </div>
  );
}

function GuideEditor({
  disabled,
  guide,
  guideId,
  rigId,
  onChange,
  uploadFile
}: {
  disabled: boolean;
  guide: ResourceRecord;
  guideId: string;
  rigId: unknown;
  onChange: (patch: ResourceRecord) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  const position = normalizeVector(guide.position, [0.5, 0.5], -2, 3);
  return (
    <fieldset className="structured-editor rig-guide-editor">
      <legend>Guide overlay</legend>
      <ToggleField label="Enabled" checked={Boolean(guide.enabled)} onChange={(checked) => onChange({ enabled: checked })} />
      <TextField label="Path" value={guide.path || ""} onChange={(value) => onChange({ path: value })} />
      <UploadField
        disabled={disabled}
        label="Upload guide"
        accept="image/png,image/jpeg,image/webp"
        onUpload={async (file) => {
          const path = await uploadFile(characterRigGuideUploadPath(rigId, guideId, file), file);
          onChange({ path, enabled: true });
          return path;
        }}
      />
      <NumberField label="Guide X" value={position[0]} min={-2} max={3} step={0.01} resetValue={0.5} onChange={(value) => onChange({ position: [value, position[1]] })} />
      <NumberField label="Guide Y" value={position[1]} min={-2} max={3} step={0.01} resetValue={0.5} onChange={(value) => onChange({ position: [position[0], value] })} />
      <NumberField label="Rotation" value={guide.rotation ?? 0} min={-360} max={360} step={1} resetValue={0} onChange={(value) => onChange({ rotation: value })} />
      <NumberField label="Opacity" value={guide.opacity ?? 0.55} min={0} max={1} step={0.05} resetValue={0.55} onChange={(value) => onChange({ opacity: value })} />
      <NumberField label="Scale" value={guide.scale ?? 1} min={0.01} max={20} step={0.05} resetValue={1} onChange={(value) => onChange({ scale: value })} />
    </fieldset>
  );
}

function RigTimelinePanel({
  angle,
  currentAngleHasKey,
  keyedAngles,
  mode,
  onAddCurrentAngleKey,
  onDeleteCurrentAngleKey,
  onSetAngle,
  onSetPresetAngleKey,
  selectedPartId,
  selectedPartName,
  stateId
}: {
  angle: number;
  currentAngleHasKey: boolean;
  keyedAngles: number[];
  mode: RigEditMode;
  onAddCurrentAngleKey: () => void;
  onDeleteCurrentAngleKey: () => void;
  onSetAngle: (angle: number) => void;
  onSetPresetAngleKey: (angle: number) => void;
  selectedPartId: string;
  selectedPartName: string;
  stateId: string;
}) {
  const markerAngles = [-45, 0, 45];
  const keyed = new Set([0, ...keyedAngles]);
  return (
    <section className="rig-timeline-panel" aria-label="Rig parameters">
      <div className="rig-timeline-header">
        <div>
          <strong>{selectedPartName || "No part selected"}</strong>
          <span>{mode === "angle" ? `${stateId} / ${angle}deg` : mode === "state" ? `${stateId} pose override` : "Base transform"}</span>
        </div>
        <div className="rig-key-actions">
          <button disabled={!selectedPartId} type="button" onClick={() => onSetPresetAngleKey(-45)}><Icon name="KeyboardArrowLeft" />-45</button>
          <button disabled={!selectedPartId} type="button" onClick={onAddCurrentAngleKey}><Icon name="Add" />Key</button>
          <button disabled={!selectedPartId || !currentAngleHasKey || Math.abs(angle) < 0.001} type="button" onClick={onDeleteCurrentAngleKey}><Icon name="Delete" />Key</button>
          <button disabled={!selectedPartId} type="button" onClick={() => onSetPresetAngleKey(45)}>45<Icon name="KeyboardArrowRight" /></button>
        </div>
      </div>
      <div className="rig-angle-ruler">
        {markerAngles.map((marker) => (
          <button
            className={`rig-angle-marker ${Math.abs(angle - marker) < 0.001 ? "active" : ""} ${keyed.has(marker) ? "keyed" : ""}`}
            key={marker}
            style={{ left: `${((marker - rigAngleMin) / (rigAngleMax - rigAngleMin)) * 100}%` }}
            type="button"
            onClick={() => onSetAngle(marker)}
          >
            <span>{marker}deg</span>
          </button>
        ))}
        {keyedAngles.filter((marker) => !markerAngles.includes(marker)).map((marker) => (
          <button
            className={`rig-angle-marker keyed custom ${Math.abs(angle - marker) < 0.001 ? "active" : ""}`}
            key={marker}
            style={{ left: `${((marker - rigAngleMin) / (rigAngleMax - rigAngleMin)) * 100}%` }}
            type="button"
            onClick={() => onSetAngle(marker)}
          >
            <span>{marker}deg</span>
          </button>
        ))}
        <div className="rig-angle-playhead" style={{ left: `${((angle - rigAngleMin) / (rigAngleMax - rigAngleMin)) * 100}%` }} />
      </div>
    </section>
  );
}

function PartInspector({
  disabled,
  mode,
  angle,
  part,
  rigId,
  stateId,
  stateOverride,
  angleKey,
  onUpdatePart,
  onUpdateBaseTransform,
  onUpdateAngleKey,
  onUpdateStateOverride,
  uploadFile
}: {
  disabled: boolean;
  mode: RigEditMode;
  angle: number;
  part: ResourceRecord;
  rigId: unknown;
  stateId: string;
  stateOverride: ResourceRecord;
  angleKey: ResourceRecord;
  onUpdatePart: (patch: ResourceRecord) => void;
  onUpdateBaseTransform: (patch: ResourceRecord) => void;
  onUpdateAngleKey: (patch: ResourceRecord) => void;
  onUpdateStateOverride: (patch: ResourceRecord) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  const baseTransform = normalizeTransform(part.base_transform);
  const pivot = normalizeVector(part.pivot, [0, 0], -10000, 10000);
  const physics = normalizePhysics(part.physics);
  const activeTransform = mode === "base" ? baseTransform : normalizeTransform(part.preview_transform || baseTransform);
  const updateActive = mode === "angle" ? onUpdateAngleKey : mode === "state" ? onUpdateStateOverride : onUpdateBaseTransform;
  return (
    <section className="wide structured-editor rig-part-inspector">
      <div className="structured-header">
        <span>{mode === "angle" ? `Angle key ${angle}deg` : mode === "state" ? `State override: ${stateId}` : "Base part"}</span>
      </div>
      <TextField label="Part id" value={part.id || ""} onChange={(value) => onUpdatePart({ id: safeSegment(value, part.id || "part") })} />
      <TextField label="Name" value={part.name || ""} onChange={(value) => onUpdatePart({ name: value })} />
      <TextField label="Path" value={part.path || ""} onChange={(value) => onUpdatePart({ path: value })} />
      <UploadField
        disabled={disabled}
        label="Upload part"
        accept="image/png,image/jpeg,image/webp"
        onUpload={async (file) => {
          const path = await uploadFile(characterRigPartUploadPath(rigId, part.id, file), file);
          onUpdatePart({ path });
          return path;
        }}
      />
      <TextField label="Parent part id" value={part.parent_id || ""} onChange={(value) => onUpdatePart({ parent_id: value })} />
      <TextField label="Role" value={part.role || ""} onChange={(value) => onUpdatePart({ role: value })} />
      <NumberField label="Z index" value={part.z_index ?? 0} step={1} resetValue={0} onChange={(value) => onUpdatePart({ z_index: value })} />
      <NumberField label="Pivot X" value={pivot[0]} step={1} resetValue={0} onChange={(value) => onUpdatePart({ pivot: [value, pivot[1]] })} />
      <NumberField label="Pivot Y" value={pivot[1]} step={1} resetValue={0} onChange={(value) => onUpdatePart({ pivot: [pivot[0], value] })} />
      <TransformFields transform={activeTransform} onChange={updateActive} />
      <fieldset className="wide structured-editor">
        <legend>Physics</legend>
        <ToggleField label="Enabled" checked={Boolean(physics.enabled)} onChange={(checked) => onUpdatePart({ physics: { ...physics, enabled: checked } })} />
        <NumberField label="Mass" value={physics.mass ?? 1} min={0} max={100} step={0.1} resetValue={1} onChange={(value) => onUpdatePart({ physics: { ...physics, mass: value } })} />
        <NumberField label="Stiffness" value={physics.stiffness ?? 24} min={0} max={1000} step={1} resetValue={24} onChange={(value) => onUpdatePart({ physics: { ...physics, stiffness: value } })} />
        <NumberField label="Damping" value={physics.damping ?? 8} min={0} max={100} step={0.5} resetValue={8} onChange={(value) => onUpdatePart({ physics: { ...physics, damping: value } })} />
        <NumberField label="Gravity" value={physics.gravity ?? 18} min={-1000} max={1000} step={1} resetValue={18} onChange={(value) => onUpdatePart({ physics: { ...physics, gravity: value } })} />
        <NumberField label="Weight" value={physics.weight ?? 1} min={0} max={100} step={0.1} resetValue={1} onChange={(value) => onUpdatePart({ physics: { ...physics, weight: value } })} />
      </fieldset>
      <ChoiceJsonField label="Mesh" value={part.mesh || {}} expected="object" onChange={(value) => onUpdatePart({ mesh: value })} />
    </section>
  );
}

function TransformFields({ transform, onChange }: { transform: ResourceRecord; onChange: (patch: ResourceRecord) => void }) {
  const position = normalizeVector(transform.position, [0, 0], -10000, 10000);
  const scale = normalizeVector(transform.scale, [1, 1], -20, 20);
  return (
    <fieldset className="wide structured-editor">
      <legend>Transform</legend>
      <NumberField label="X" value={position[0]} step={1} resetValue={0} onChange={(value) => onChange({ position: [value, position[1]] })} />
      <NumberField label="Y" value={position[1]} step={1} resetValue={0} onChange={(value) => onChange({ position: [position[0], value] })} />
      <NumberField label="Rotation" value={transform.rotation ?? 0} min={-360} max={360} step={1} resetValue={0} onChange={(value) => onChange({ rotation: value })} />
      <NumberField label="Scale X" value={scale[0]} min={-20} max={20} step={0.05} resetValue={1} onChange={(value) => onChange({ scale: [value, scale[1]] })} />
      <NumberField label="Scale Y" value={scale[1]} min={-20} max={20} step={0.05} resetValue={1} onChange={(value) => onChange({ scale: [scale[0], value] })} />
      <NumberField label="Opacity" value={transform.opacity ?? 1} min={0} max={1} step={0.05} resetValue={1} onChange={(value) => onChange({ opacity: value })} />
    </fieldset>
  );
}

function RigPreview({
  canvas,
  disabled,
  guide,
  onMovePart,
  onSelectPart,
  parts,
  selectedPartId
}: {
  canvas: ResourceRecord;
  disabled: boolean;
  guide: ResourceRecord;
  onMovePart: (partId: string, position: [number, number]) => void;
  onSelectPart: (partId: string) => void;
  parts: ResourceRecord[];
  selectedPartId: string;
}) {
  const width = normalizeNumber(canvas.width, 1200, 1, 10000);
  const height = normalizeNumber(canvas.height, 1800, 1, 10000);
  const aspect = `${width} / ${height}`;
  const frameRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    partId: string;
    pointerId: number;
    startPointer: [number, number];
    startPosition: [number, number];
  } | null>(null);
  const [stageScale, setStageScale] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const updateScale = () => {
      const rect = frame.getBoundingClientRect();
      setStageScale(Math.max(0.001, Math.min(rect.width / width, rect.height / height)));
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [height, width]);

  function clientToCanvasPoint(event: PointerEvent<HTMLElement>): [number, number] {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return [0, 0];
    return [
      roundForInput((event.clientX - rect.left) / stageScale),
      roundForInput((event.clientY - rect.top) / stageScale)
    ];
  }

  function startPartDrag(event: PointerEvent<HTMLImageElement>, part: ResourceRecord) {
    if (disabled) return;
    const partId = String(part.id || "");
    if (!partId) return;
    event.preventDefault();
    event.stopPropagation();
    onSelectPart(partId);
    const transform = normalizeTransform(part.preview_transform || part.base_transform);
    dragRef.current = {
      partId,
      pointerId: event.pointerId,
      startPointer: clientToCanvasPoint(event),
      startPosition: normalizeVector(transform.position, [0, 0], -10000, 10000)
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function updatePartDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const point = clientToCanvasPoint(event);
    onMovePart(drag.partId, [
      drag.startPosition[0] + point[0] - drag.startPointer[0],
      drag.startPosition[1] + point[1] - drag.startPointer[1]
    ]);
  }

  function endPartDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
  }

  return (
    <div
      className="rig-preview-frame"
      onPointerCancel={endPartDrag}
      onPointerMove={updatePartDrag}
      onPointerUp={endPartDrag}
      ref={frameRef}
      style={{
        aspectRatio: aspect,
        maxWidth: `min(100%, calc(var(--rig-preview-height-budget, 100vh - 220px) * ${width / height}))`
      }}
    >
      <div
        className="rig-preview-stage"
        style={{
          height,
          transform: `scale(${stageScale})`,
          width
        }}
      >
        {guide.enabled && guide.path && (
          <img
            alt=""
            className="rig-guide-preview"
            src={resPathToAssetUrl(guide.path)}
            style={{
              left: `${normalizeVector(guide.position, [0.5, 0.5], -2, 3)[0] * width}px`,
              top: `${normalizeVector(guide.position, [0.5, 0.5], -2, 3)[1] * height}px`,
              opacity: clampNumber(guide.opacity, 0, 1, 0.55),
              transform: `translate(-50%, -50%) rotate(${normalizeNumber(guide.rotation, 0)}deg) scale(${normalizeNumber(guide.scale, 1, 0.01, 20)})`,
              width
            }}
          />
        )}
        {parts.map((part) => (
          <RigPreviewPart
            key={part.id}
            onPointerDown={(event) => startPartDrag(event, part)}
            part={part}
            selected={selectedPartId === String(part.id || "")}
          />
        ))}
      </div>
    </div>
  );
}

function RigPreviewPart({
  onPointerDown,
  part,
  selected
}: {
  onPointerDown: (event: PointerEvent<HTMLImageElement>) => void;
  part: ResourceRecord;
  selected: boolean;
}) {
  const transform = normalizeTransform(part.preview_transform || part.base_transform);
  const position = normalizeVector(transform.position, [0, 0], -10000, 10000);
  const pivot = normalizeVector(part.pivot, [0, 0], -10000, 10000);
  const scale = normalizeVector(transform.scale, [1, 1], -20, 20);
  const imageUrl = resPathToAssetUrl(part.path);
  if (!imageUrl) return null;
  return (
    <img
      alt=""
      className={`rig-part-preview ${selected ? "selected" : ""}`}
      onPointerDown={onPointerDown}
      src={imageUrl}
      style={{
        left: `${position[0] + pivot[0]}px`,
        top: `${position[1] + pivot[1]}px`,
        opacity: clampNumber(transform.opacity, 0, 1, 1),
        zIndex: normalizeNumber(part.z_index, 0),
        transform: `translate(${-pivot[0]}px, ${-pivot[1]}px) rotate(${normalizeNumber(transform.rotation, 0)}deg) scale(${scale[0]}, ${scale[1]})`
      }}
    />
  );
}

function buildPreviewParts(parts: ResourceRecord[], angleTracks: unknown, states: ResourceRecord, mode: RigEditMode, angle: number, stateId: string) {
  return [...parts]
    .sort((a, b) => normalizeNumber(a.z_index, 0) - normalizeNumber(b.z_index, 0))
    .map((part) => {
      const partId = String(part.id || "");
      const baseTransform = normalizeTransform(part.base_transform);
      return {
        ...part,
        preview_transform: mergeTransforms(
          baseTransform,
          mode === "angle" ? sampleAngleTransform(angleTracks, stateId, partId, angle, baseTransform) : {},
          mode === "state" ? getStateOverride(states, stateId, partId) : {}
        )
      };
    });
}

function sampleAngleTransform(angleTracks: unknown, stateId: string, partId: string, angle: number, baseTransform: ResourceRecord): ResourceRecord {
  const tracks = angleTracks && typeof angleTracks === "object" ? angleTracks as ResourceRecord : {};
  const stateTracks = tracks[stateId] && typeof tracks[stateId] === "object"
    ? tracks[stateId] as ResourceRecord
    : tracks[rigDefaultStateId] && typeof tracks[rigDefaultStateId] === "object"
      ? tracks[rigDefaultStateId] as ResourceRecord
      : {};
  const partTracks = stateTracks[partId] && typeof stateTracks[partId] === "object" ? stateTracks[partId] as ResourceRecord : {};
  const keys = [0, ...Object.keys(partTracks).map((key) => Number(key)).filter((key) => Number.isFinite(key))].sort((a, b) => a - b);
  if (keys.length === 1) return {};
  let lower = keys[0];
  let upper = keys[keys.length - 1];
  for (const key of keys) {
    if (key <= angle) lower = key;
    if (key >= angle) {
      upper = key;
      break;
    }
  }
  const lowerTransform = transformAtAngleKey(partTracks, lower, baseTransform);
  const upperTransform = transformAtAngleKey(partTracks, upper, baseTransform);
  if (lower === upper) return lowerTransform;
  return interpolateTransform(lowerTransform, upperTransform, (angle - lower) / (upper - lower));
}

function transformAtAngleKey(partTracks: ResourceRecord, angle: number, baseTransform: ResourceRecord): ResourceRecord {
  if (Math.abs(angle) < 0.001) return baseTransform;
  const rounded = roundForInput(angle);
  const candidates = [String(rounded), String(Math.round(rounded))];
  const key = candidates.find((candidate) => partTracks[candidate] && typeof partTracks[candidate] === "object");
  return key ? normalizeTransform(partTracks[key]) : baseTransform;
}

function interpolateTransform(a: ResourceRecord, b: ResourceRecord, amount: number): ResourceRecord {
  const t = clampNumber(amount, 0, 1, 0);
  const positionA = normalizeVector(a.position, [0, 0], -10000, 10000);
  const positionB = normalizeVector(b.position, [0, 0], -10000, 10000);
  const scaleA = normalizeVector(a.scale, [1, 1], -20, 20);
  const scaleB = normalizeVector(b.scale, [1, 1], -20, 20);
  return {
    position: [
      roundForInput(positionA[0] + (positionB[0] - positionA[0]) * t),
      roundForInput(positionA[1] + (positionB[1] - positionA[1]) * t)
    ],
    rotation: roundForInput(normalizeNumber(a.rotation, 0) + (normalizeNumber(b.rotation, 0) - normalizeNumber(a.rotation, 0)) * t),
    scale: [
      roundForInput(scaleA[0] + (scaleB[0] - scaleA[0]) * t),
      roundForInput(scaleA[1] + (scaleB[1] - scaleA[1]) * t)
    ],
    opacity: roundForInput(clampNumber(a.opacity, 0, 1, 1) + (clampNumber(b.opacity, 0, 1, 1) - clampNumber(a.opacity, 0, 1, 1)) * t)
  };
}

function mergeTransforms(base: ResourceRecord, ...patches: ResourceRecord[]) {
  let current = normalizeTransform(base);
  for (const patch of patches) {
    if (!patch || Object.keys(patch).length === 0) continue;
    const next = normalizeTransform(patch);
    current = {
      ...current,
      position: next.position,
      rotation: next.rotation,
      scale: next.scale,
      opacity: next.opacity
    };
  }
  return current;
}

function getAngleKey(angleTracks: unknown, stateId: string, partId: string, angle: number): ResourceRecord {
  const tracks = angleTracks && typeof angleTracks === "object" ? angleTracks as ResourceRecord : {};
  const stateTracks = tracks[stateId] && typeof tracks[stateId] === "object" ? tracks[stateId] as ResourceRecord : {};
  const partTracks = stateTracks[partId] && typeof stateTracks[partId] === "object" ? stateTracks[partId] as ResourceRecord : {};
  return partTracks[String(roundForInput(angle))] && typeof partTracks[String(roundForInput(angle))] === "object"
    ? partTracks[String(roundForInput(angle))] as ResourceRecord
    : {};
}

function getAngleKeys(angleTracks: unknown, stateId: string, partId: string): number[] {
  const tracks = angleTracks && typeof angleTracks === "object" ? angleTracks as ResourceRecord : {};
  const stateTracks = tracks[stateId] && typeof tracks[stateId] === "object" ? tracks[stateId] as ResourceRecord : {};
  const partTracks = stateTracks[partId] && typeof stateTracks[partId] === "object" ? stateTracks[partId] as ResourceRecord : {};
  return Object.keys(partTracks)
    .map((key) => Number(key))
    .filter((key) => Number.isFinite(key) && key >= rigAngleMin && key <= rigAngleMax)
    .sort((a, b) => a - b);
}

function getStateOverride(states: ResourceRecord, stateId: string, partId: string): ResourceRecord {
  const state = states[stateId] && typeof states[stateId] === "object" ? states[stateId] as ResourceRecord : {};
  const overrides = state.part_overrides && typeof state.part_overrides === "object" ? state.part_overrides as ResourceRecord : {};
  return overrides[partId] && typeof overrides[partId] === "object" ? overrides[partId] as ResourceRecord : {};
}

function nextUniquePartId(parts: ResourceRecord[]) {
  let index = parts.length + 1;
  const existing = new Set(parts.map((part) => String(part.id || "")));
  while (existing.has(`part_${index}`)) index += 1;
  return `part_${index}`;
}

function nextUniqueStateId(states: ResourceRecord) {
  let index = Object.keys(states).length + 1;
  while (states[`state_${index}`]) index += 1;
  return `state_${index}`;
}

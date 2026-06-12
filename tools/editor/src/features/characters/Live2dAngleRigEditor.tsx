import { NumberField, ToggleField } from "../../components/EditorControls";
import { normalizeBooleanFlag } from "../../lib/numeric";
import type { ResourceRecord } from "../../types";
import type { Live2dEditorCopy } from "./live2dEditorCopy";
import {
  getLive2dAngleMax,
  getLive2dAnglePartEntry,
  live2dAngleFieldDefaults,
  live2dAngleFieldLimits,
  live2dAngleFields
} from "./live2dModel";

export function Live2dAngleRigEditor({
  angleRig,
  copy,
  onUpdate,
  onUpdatePart,
  parts
}: {
  angleRig: ResourceRecord;
  copy: Live2dEditorCopy;
  onUpdate: (patch: ResourceRecord) => void;
  onUpdatePart: (partId: string, patch: ResourceRecord) => void;
  parts: ResourceRecord[];
}) {
  const maxAngle = getLive2dAngleMax(angleRig);
  return (
    <div className="live2d-angle-card">
      <div className="live2d-angle-grid">
        <ToggleField label={copy.angleEnabled} checked={normalizeBooleanFlag(angleRig.enabled)} onChange={(checked) => onUpdate({ enabled: checked })} />
        <NumberField label={copy.angleMax} value={maxAngle} min={1} max={45} step={1} resetValue={45} onChange={(value) => onUpdate({ max_angle: value })} />
        <ToggleField label={copy.angleMirror} checked={normalizeBooleanFlag(angleRig.mirror_x ?? angleRig.mirror, true)} onChange={(checked) => onUpdate({ mirror_x: checked })} />
      </div>
      <div className="live2d-angle-parts">
        {parts.length === 0 && <span className="muted">{copy.angleNeedsParts}</span>}
        {parts.map((part) => {
          const partId = String(part.id || "").trim();
          if (!partId) return null;
          const entry = getLive2dAnglePartEntry(angleRig, partId);
          return (
            <div className="live2d-angle-part" key={`angle-${partId}`}>
              <strong>{partId}</strong>
              {live2dAngleFields.map((field) => {
                const limits = live2dAngleFieldLimits[field];
                return (
                  <NumberField
                    key={field}
                    label={copy.angleFields[field]}
                    max={limits.max}
                    min={limits.min}
                    resetValue={live2dAngleFieldDefaults[field]}
                    step={limits.step}
                    value={entry[field] ?? live2dAngleFieldDefaults[field]}
                    onChange={(value) => onUpdatePart(partId, { [field]: value })}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

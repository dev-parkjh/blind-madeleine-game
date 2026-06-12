import { useEffect, useState } from "react";
import { Icon, NumberField, TextField } from "../../components/EditorControls";
import { safeSegment } from "../../lib/files";
import type { ResourceRecord } from "../../types";
import type { Live2dEditorCopy } from "./live2dEditorCopy";
import {
  getLive2dMotionPartEntry,
  live2dMotionFieldDefaults,
  live2dMotionFieldLimits,
  live2dMotionFields,
  live2dMotionSpeedDefault
} from "./live2dModel";

export function Live2dMotionEditor({
  copy,
  disabled,
  motion,
  motionKey,
  onRemove,
  onRename,
  onUpdate,
  onUpdatePart,
  parts
}: {
  copy: Live2dEditorCopy;
  disabled: boolean;
  motion: ResourceRecord;
  motionKey: string;
  onRemove: () => void;
  onRename: (nextKey: string) => void;
  onUpdate: (patch: ResourceRecord) => void;
  onUpdatePart: (partId: string, patch: ResourceRecord) => void;
  parts: ResourceRecord[];
}) {
  const [draftKey, setDraftKey] = useState(motionKey);

  useEffect(() => {
    setDraftKey(motionKey);
  }, [motionKey]);

  function commitMotionKey() {
    const clean = safeSegment(draftKey || motionKey, "default");
    setDraftKey(clean);
    if (clean !== motionKey) onRename(clean);
  }

  return (
    <details className="live2d-motion-card" open>
      <summary>
        <strong>{motionKey}</strong>
        <span>{copy.motionSummary}</span>
      </summary>
      <div className="live2d-motion-grid">
        <TextField
          label={copy.motionKey}
          value={draftKey}
          onBlur={commitMotionKey}
          onChange={setDraftKey}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
        <NumberField label={copy.speed} value={motion.speed ?? live2dMotionSpeedDefault} min={0.1} max={5} step={0.05} resetValue={live2dMotionSpeedDefault} onChange={(value) => onUpdate({ speed: value })} />
        <button className="danger-action" disabled={disabled} type="button" onClick={onRemove}><Icon name="Delete" />{copy.deleteMotion}</button>
      </div>
      <div className="live2d-motion-parts">
        {parts.length === 0 && <span className="muted">{copy.motionNeedsParts}</span>}
        {parts.map((part) => {
          const partId = String(part.id || "").trim();
          if (!partId) return null;
          const entry = getLive2dMotionPartEntry(motion, partId);
          return (
            <div className="live2d-motion-part" key={`${motionKey}-${partId}`}>
              <strong>{partId}</strong>
              {live2dMotionFields.map((field) => {
                const limits = live2dMotionFieldLimits[field];
                return (
                  <NumberField
                    key={field}
                    label={copy.motionFields[field]}
                    max={limits.max}
                    min={limits.min}
                    resetValue={live2dMotionFieldDefaults[field]}
                    step={limits.step}
                    value={entry[field] ?? live2dMotionFieldDefaults[field]}
                    onChange={(value) => onUpdatePart(partId, { [field]: value })}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </details>
  );
}

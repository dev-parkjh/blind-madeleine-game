import { useRef } from "react";
import { useUiText } from "../../editorText";
import { CheckboxList, Icon, NumberField, SelectLiteralField, TextField, ToggleField } from "../../components/EditorControls";
import { shortId } from "../../lib/ids";
import type { ResourceRecord, ResourceSummary } from "../../types";
import {
  portraitZoomDefault,
  stageCastDefaultAnimationSpeed,
  stageCastDefaultOpacity,
  stageCastPositionOptions,
  stageCastAnimationOrderDefault
} from "./stageCastModel";
import { CastPortraitPreview } from "./StageCastPortraitPreview";
import { StageCastScenePreview, type StageCastActualPreviewContext } from "./StageCastScenePreview";
import {
  portraitKeys,
  stageCastPositionLabels
} from "./stageCastEditorModel";
import { useStageCastEditorController } from "./useStageCastEditorController";

export type { StageCastActualPreviewContext } from "./StageCastScenePreview";

export function StageCastEditor({
  actualPreview,
  characters,
  nodes,
  selectedNodeIndex,
  speakerId,
  speakerMystery,
  focusTargets,
  stageCast,
  onFocusTargetsChange,
  onChange
}: {
  actualPreview?: StageCastActualPreviewContext;
  characters: ResourceSummary[];
  nodes: ResourceRecord[];
  selectedNodeIndex: number;
  speakerId: string;
  speakerMystery: boolean;
  focusTargets?: unknown;
  stageCast: unknown;
  onFocusTargetsChange?: (focusTargets: string[]) => void;
  onChange: (stageCast: Record<string, ResourceRecord>) => void;
}) {
  const ui = useUiText();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const controller = useStageCastEditorController({
    characters,
    focusTargets,
    nodes,
    onChange,
    onFocusTargetsChange,
    selectedNodeIndex,
    speakerId,
    speakerMystery,
    stageCast
  });

  return (
    <div className="stage-cast-editor" ref={editorRef}>
      <div className="structured-header">
        <span>{ui.form.stageCast}</span>
        <select value="" onChange={(event) => controller.addCast(event.target.value)}>
          <option value="">{ui.form.addCharacter}</option>
          <option value="mystery">{ui.form.mystery}</option>
          {controller.stageCastCharacterOptions.map((character) => <option key={character.id} value={character.id}>{character.title}</option>)}
        </select>
      </div>
      {onFocusTargetsChange && (
        <CheckboxList
          label={ui.form.focusTargets}
          values={controller.focusTargetIds}
          options={controller.focusTargetOptions}
          onToggle={controller.toggleFocusTarget}
        />
      )}
      {controller.entries.length === 0 && <p className="empty-state">{ui.form.noStageCast}</p>}
      {controller.stageEntries.length > 0 && (
        <StageCastScenePreview
          actualPreview={actualPreview}
          entries={controller.stageEntries}
          onMoveCustomOffset={(characterId, offset) => controller.updateCast(characterId, { portrait_offset: [offset.x, offset.y] })}
          selectedCastId={controller.selectedCastId}
        />
      )}
      {controller.stageEntries.map((entry) => {
        const value = controller.cast[entry.characterId] || {};
        const portraitOptions = portraitKeys(entry.character);
        const isCustomPosition = entry.position === "custom";
        return (
          <article
            className={`stage-cast-row ${controller.selectedCastId === entry.characterId ? "active" : ""}`}
            data-stage-cast-target={entry.characterId}
            key={entry.characterId}
          >
            <div className="stage-cast-identity">
              <CastPortraitPreview entry={entry} />
              <div>
                <strong>{entry.label}</strong>
                <code title={entry.characterId}>{shortId(entry.characterId)}</code>
                <div className="stage-cast-badges">
                  {entry.isSpeaker && <span>화자</span>}
                  {entry.isFocused && <span>주목</span>}
                  {entry.inherited && <span>{entry.inherited.index + 1}번 상속</span>}
                  {entry.mystery && <span>수수께끼</span>}
                </div>
              </div>
            </div>
            {portraitOptions.length > 0 ? (
              <label className="field-block">
                <span>{ui.form.portrait}</span>
                <select value={String(value.portrait || "")} onChange={(event) => controller.updateCast(entry.characterId, { portrait: event.target.value })}>
                  <option value="">{ui.common.unspecified}</option>
                  {portraitOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            ) : (
              <TextField label={ui.form.portrait} value={value.portrait || ""} onChange={(next) => controller.updateCast(entry.characterId, { portrait: next })} />
            )}
            <SelectLiteralField
              label={ui.form.position}
              value={entry.position}
              options={[...stageCastPositionOptions]}
              labels={stageCastPositionLabels(ui)}
              onChange={(next) => controller.updatePosition(entry.characterId, next)}
            />
            {isCustomPosition && (
              <>
                <NumberField
                  label={ui.form.offsetX}
                  value={entry.offset.x}
                  step={0.01}
                  resetValue={0}
                  onChange={(next) => controller.updateCast(entry.characterId, { portrait_offset: [next, entry.offset.y] })}
                />
                <NumberField
                  label={ui.form.offsetY}
                  value={entry.offset.y}
                  step={0.01}
                  resetValue={0}
                  onChange={(next) => controller.updateCast(entry.characterId, { portrait_offset: [entry.offset.x, next] })}
                />
              </>
            )}
            <NumberField label={ui.form.positionOrder} value={entry.positionOrder} min={1} step={1} resetValue={entry.index + 1} onChange={(next) => controller.updateCast(entry.characterId, { portrait_position_order: next })} />
            <NumberField label={ui.form.animationOrder} value={entry.animationOrder} min={1} step={1} resetValue={stageCastAnimationOrderDefault} onChange={(next) => controller.updateCast(entry.characterId, { animation_order: next })} />
            <NumberField label={ui.form.zoom} value={entry.portraitZoom} min={100} max={500} step={50} resetValue={portraitZoomDefault} onChange={(next) => controller.updateCast(entry.characterId, { portrait_zoom: next })} />
            <NumberField label="Portrait angle" value={entry.portraitAngle} min={-45} max={45} step={1} resetValue={0} onChange={(next) => controller.updateCast(entry.characterId, { portrait_angle: next })} />
            <TextField label="Pose state" value={entry.poseState} onChange={(next) => controller.updateCast(entry.characterId, { pose_state: next || "default" })} />
            <NumberField label="Pose transition" value={entry.poseTransition} min={0} max={10} step={0.05} resetValue={0.45} onChange={(next) => controller.updateCast(entry.characterId, { pose_transition: next })} />
            <NumberField label={ui.form.opacity} value={entry.portraitOpacity} min={0} max={1} step={0.1} resetValue={stageCastDefaultOpacity} onChange={(next) => controller.updateCast(entry.characterId, { portrait_opacity: next })} />
            <NumberField label={ui.form.animationSpeed} value={entry.animationSpeed} min={0.5} max={2} step={0.25} resetValue={stageCastDefaultAnimationSpeed} onChange={(next) => controller.updateCast(entry.characterId, { animation_speed: next })} />
            <ToggleField label={ui.form.flipX} checked={entry.flipH} onChange={(checked) => controller.updateCast(entry.characterId, { portrait_flip_h: checked })} />
            <ToggleField label={ui.form.mystery} checked={entry.mystery} onChange={(checked) => controller.updateCast(entry.characterId, { mystery: checked })} />
            <button className="danger-action" type="button" onClick={() => controller.removeCast(entry.characterId)}><Icon name="Delete" />{ui.common.delete}</button>
          </article>
        );
      })}
    </div>
  );
}

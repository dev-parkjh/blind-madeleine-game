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
  adaptivePortraitRigPoseKeys,
  portraitRigDialogueMotionKeys,
  portraitRigIdleMotionClipKeys,
  portraitRigMotionBlendDurationKeys,
  portraitRigMotionClipKeys,
  portraitRigMotionLoopKeys,
  portraitRigMotionProgressKeys,
  portraitRigMotionSpeedKeys,
  portraitRigMotionTimeKeys,
  portraitRigPoseHintKeys,
  portraitRigStageCastMetadataKeys,
  portraitRigTalkMotionClipKeys,
  portraitRigVisemeMotionClipKeys,
  portraitKeys,
  stageCastPositionLabels
} from "./stageCastEditorModel";
import { useStageCastEditorController } from "./useStageCastEditorController";

export type { StageCastActualPreviewContext } from "./StageCastScenePreview";

const portraitRigPoseHintPresets = [
  "happy",
  "sad",
  "angry",
  "surprised",
  "curious",
  "talk",
  "blink",
  "squint",
  "serious",
  "worried",
  "motion",
  "look_left",
  "look_right",
  "look_up",
  "look_down",
  "tilt_left",
  "tilt_right",
  "open_mouth",
  "closed_mouth",
  "viseme",
  "phoneme",
  "viseme_a",
  "viseme_i",
  "viseme_o",
  "viseme_u",
  "viseme_closed",
  "neutral"
];

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
                  {entry.hasPortraitRigControls && entry.adaptivePortraitRigPose && <span>Portrait Rig 자동</span>}
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
            {entry.hasPortraitRigControls && (
              <div className="stage-cast-rig-controls">
                <ToggleField
                  label={ui.form.portraitRigAutoPose}
                  checked={entry.adaptivePortraitRigPose}
                  onChange={(checked) => controller.updateCastPortraitRig(entry.characterId, { adaptive_portrait_rig_pose: checked }, adaptivePortraitRigPoseKeys)}
                />
                <PortraitRigPoseHintField
                  customLabel={ui.form.portraitRigPoseHintCustom}
                  currentMissingLabel={ui.common.currentMissing}
                  portraitRigPoseHint={entry.portraitRigPoseHint}
                  missingLabel={ui.common.missing}
                  presetLabel={ui.form.portraitRigPoseHintPreset}
                  availablePoseHints={entry.portraitRigPoseTags}
                  unspecifiedLabel={ui.common.unspecified}
                  onChange={(next) => controller.updateCastPortraitRig(entry.characterId, { portrait_rig_pose_hint: next }, portraitRigPoseHintKeys)}
                />
                <ToggleField
                  label={ui.form.portraitRigMotionLoop}
                  checked={entry.portraitRigMotionLoop}
                  onChange={(checked) => controller.updateCastPortraitRig(entry.characterId, { portrait_rig_motion_loop: checked }, portraitRigMotionLoopKeys)}
                />
                <ToggleField
                  label={ui.form.portraitRigDialogueMotion}
                  checked={entry.portraitRigDialogueMotion}
                  onChange={(checked) => controller.updateCastPortraitRig(entry.characterId, { portrait_rig_dialogue_motion: checked }, portraitRigDialogueMotionKeys)}
                />
                {entry.portraitRigMotionClips.length > 0 && (
                  <button
                    className="tool-button stage-cast-rig-defaults"
                    type="button"
                    onClick={() => controller.updateCastPortraitRig(entry.characterId, buildPortraitRigDialogueDefaults(entry), [
                      ...adaptivePortraitRigPoseKeys,
                      ...portraitRigDialogueMotionKeys,
                      ...portraitRigIdleMotionClipKeys,
                      ...portraitRigTalkMotionClipKeys,
                      ...portraitRigVisemeMotionClipKeys,
                      ...portraitRigMotionSpeedKeys,
                      ...portraitRigMotionBlendDurationKeys
                    ])}
                  >
                    <Icon name="AutoFixHigh" />{ui.form.portraitRigDialogueDefaults}
                  </button>
                )}
                {entry.portraitRigMotionClips.length > 0 ? (
                  <label className="field-block">
                    <span>{ui.form.portraitRigMotionClip}</span>
                    <select
                      value={entry.portraitRigMotionClip}
                      onChange={(event) => controller.updateCastPortraitRig(entry.characterId, { portrait_rig_motion_clip: event.target.value }, portraitRigMotionClipKeys)}
                    >
                      <option value="">{ui.common.unspecified}</option>
                      {entry.portraitRigMotionClips.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                ) : (
                  <TextField
                    label={ui.form.portraitRigMotionClip}
                    value={entry.portraitRigMotionClip}
                    onChange={(next) => controller.updateCastPortraitRig(entry.characterId, { portrait_rig_motion_clip: next }, portraitRigMotionClipKeys)}
                  />
                )}
                {entry.portraitRigDialogueMotion && entry.portraitRigMotionClips.length > 0 && (
                  <>
                    <label className="field-block">
                      <span>{ui.form.portraitRigIdleMotionClip}</span>
                      <select
                        value={entry.portraitRigIdleMotionClip}
                        onChange={(event) => controller.updateCastPortraitRig(entry.characterId, { portrait_rig_idle_motion_clip: event.target.value }, portraitRigIdleMotionClipKeys)}
                      >
                        <option value="">{ui.common.unspecified}</option>
                        {entry.portraitRigMotionClips.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <label className="field-block">
                      <span>{ui.form.portraitRigTalkMotionClip}</span>
                      <select
                        value={entry.portraitRigTalkMotionClip}
                        onChange={(event) => controller.updateCastPortraitRig(entry.characterId, { portrait_rig_talk_motion_clip: event.target.value }, portraitRigTalkMotionClipKeys)}
                      >
                        <option value="">{ui.common.unspecified}</option>
                        {entry.portraitRigMotionClips.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <label className="field-block">
                      <span>{ui.form.portraitRigVisemeMotionClip}</span>
                      <select
                        value={entry.portraitRigVisemeMotionClip}
                        onChange={(event) => controller.updateCastPortraitRig(entry.characterId, { portrait_rig_viseme_motion_clip: event.target.value }, portraitRigVisemeMotionClipKeys)}
                      >
                        <option value="">{ui.common.unspecified}</option>
                        {entry.portraitRigMotionClips.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                  </>
                )}
                <NumberField
                  label={ui.form.portraitRigMotionTime}
                  value={entry.portraitRigMotionTime}
                  min={0}
                  max={600}
                  step={0.1}
                  resetValue={0}
                  onChange={(next) => controller.updateCastPortraitRig(entry.characterId, { portrait_rig_motion_time: next }, [...portraitRigMotionTimeKeys, ...portraitRigMotionProgressKeys])}
                />
                <NumberField
                  label={ui.form.portraitRigMotionProgress}
                  value={entry.portraitRigMotionProgress}
                  min={0}
                  max={1}
                  step={0.05}
                  resetValue={0}
                  onChange={(next) => controller.updateCastPortraitRig(entry.characterId, { portrait_rig_motion_progress: next }, [...portraitRigMotionProgressKeys, ...portraitRigMotionTimeKeys])}
                />
                <NumberField
                  label={ui.form.portraitRigMotionSpeed}
                  value={entry.portraitRigMotionSpeed}
                  min={0.1}
                  max={4}
                  step={0.1}
                  resetValue={1}
                  onChange={(next) => controller.updateCastPortraitRig(entry.characterId, { portrait_rig_motion_speed: next }, portraitRigMotionSpeedKeys)}
                />
                <NumberField
                  label={ui.form.portraitRigMotionBlendDuration}
                  value={entry.portraitRigMotionBlendDuration}
                  min={0}
                  max={1}
                  step={0.01}
                  resetValue={0.14}
                  onChange={(next) => controller.updateCastPortraitRig(entry.characterId, { portrait_rig_motion_blend_duration: next }, portraitRigMotionBlendDurationKeys)}
                />
                {(entry.hasPortraitRigMotionTime || entry.hasPortraitRigMotionProgress || entry.hasPortraitRigMotionBlendDuration || entry.portraitRigPoseHint || entry.portraitRigMotionClip || entry.portraitRigMotionLoop || entry.portraitRigDialogueMotion || entry.portraitRigIdleMotionClip || entry.portraitRigTalkMotionClip || entry.portraitRigVisemeMotionClip) && (
                  <button
                    className="tool-button stage-cast-rig-reset"
                    type="button"
                    onClick={() => controller.updateCastPortraitRig(entry.characterId, {}, portraitRigStageCastMetadataKeys)}
                  >
                    <Icon name="RestartAlt" />{ui.form.portraitRigMotionAutoCycle}
                  </button>
                )}
              </div>
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

function PortraitRigPoseHintField({
  customLabel,
  currentMissingLabel,
  portraitRigPoseHint,
  missingLabel,
  presetLabel,
  availablePoseHints,
  unspecifiedLabel,
  onChange
}: {
  customLabel: string;
  currentMissingLabel: string;
  portraitRigPoseHint: string;
  missingLabel: string;
  presetLabel: string;
  availablePoseHints: string[];
  unspecifiedLabel: string;
  onChange: (value: string) => void;
}) {
  const currentValue = portraitRigPoseHint.trim();
  const poseHintOptions = mergedPortraitRigPoseHintOptions(availablePoseHints);
  const presetValues = new Set(poseHintOptions);
  const hasCustomValue = currentValue.length > 0 && !presetValues.has(currentValue);
  return (
    <div className="stage-cast-rig-hint">
      <label className="field-block">
        <span>{presetLabel}</span>
        <select value={currentValue} onChange={(event) => onChange(event.target.value)}>
          <option value="">{unspecifiedLabel}</option>
          {hasCustomValue && <option value={currentValue}>{currentMissingLabel}: {currentValue} · {missingLabel}</option>}
          {poseHintOptions.map((preset) => <option key={preset} value={preset}>{preset}</option>)}
        </select>
      </label>
      <TextField
        label={customLabel}
        value={portraitRigPoseHint}
        onChange={onChange}
      />
      {availablePoseHints.length > 0 && (
        <div className="stage-cast-rig-tags">
          {availablePoseHints.slice(0, 12).map((tag) => (
            <button className={tag === currentValue ? "active" : ""} key={tag} type="button" onClick={() => onChange(tag)}>
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function mergedPortraitRigPoseHintOptions(availablePoseHints: string[]) {
  const options = [...portraitRigPoseHintPresets];
  for (const hint of availablePoseHints) {
    if (hint && !options.includes(hint)) options.push(hint);
  }
  return options;
}

function buildPortraitRigDialogueDefaults(entry: {
  portraitRigDialogueMotionReady: boolean;
  portraitRigSuggestedIdleMotionClip: string;
  portraitRigSuggestedTalkMotionClip: string;
  portraitRigSuggestedVisemeMotionClip: string;
  portraitRigMotionSpeed: number;
  portraitRigMotionBlendDuration: number;
}) {
  const patch: ResourceRecord = {
    adaptive_portrait_rig_pose: true
  };
  if (entry.portraitRigDialogueMotionReady) {
    patch.portrait_rig_dialogue_motion = true;
    patch.portrait_rig_motion_speed = entry.portraitRigMotionSpeed || 1;
    patch.portrait_rig_motion_blend_duration = entry.portraitRigMotionBlendDuration ?? 0.14;
    if (entry.portraitRigSuggestedIdleMotionClip) patch.portrait_rig_idle_motion_clip = entry.portraitRigSuggestedIdleMotionClip;
    if (entry.portraitRigSuggestedTalkMotionClip) patch.portrait_rig_talk_motion_clip = entry.portraitRigSuggestedTalkMotionClip;
    if (entry.portraitRigSuggestedVisemeMotionClip) patch.portrait_rig_viseme_motion_clip = entry.portraitRigSuggestedVisemeMotionClip;
  }
  return patch;
}

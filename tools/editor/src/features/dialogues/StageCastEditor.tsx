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
  adaptiveLive2dPoseKeys,
  live2dDialogueMotionKeys,
  live2dIdleMotionClipKeys,
  live2dMotionBlendDurationKeys,
  live2dMotionClipKeys,
  live2dMotionLoopKeys,
  live2dMotionProgressKeys,
  live2dMotionSpeedKeys,
  live2dMotionTimeKeys,
  live2dPoseHintKeys,
  live2dStageCastMetadataKeys,
  live2dTalkMotionClipKeys,
  live2dVisemeMotionClipKeys,
  portraitKeys,
  stageCastPositionLabels
} from "./stageCastEditorModel";
import { useStageCastEditorController } from "./useStageCastEditorController";

export type { StageCastActualPreviewContext } from "./StageCastScenePreview";

const live2dPoseHintPresets = [
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
                  {entry.hasLive2dControls && entry.adaptiveLive2dPose && <span>Live2D 자동</span>}
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
            {entry.hasLive2dControls && (
              <div className="stage-cast-live2d-controls">
                <ToggleField
                  label={ui.form.live2dAutoPose}
                  checked={entry.adaptiveLive2dPose}
                  onChange={(checked) => controller.updateCastLive2d(entry.characterId, { adaptive_live2d_pose: checked }, adaptiveLive2dPoseKeys)}
                />
                <Live2dPoseHintField
                  customLabel={ui.form.live2dPoseHintCustom}
                  currentMissingLabel={ui.common.currentMissing}
                  live2dPoseHint={entry.live2dPoseHint}
                  missingLabel={ui.common.missing}
                  presetLabel={ui.form.live2dPoseHintPreset}
                  availablePoseHints={entry.live2dPoseTags}
                  unspecifiedLabel={ui.common.unspecified}
                  onChange={(next) => controller.updateCastLive2d(entry.characterId, { live2d_pose_hint: next }, live2dPoseHintKeys)}
                />
                <ToggleField
                  label={ui.form.live2dMotionLoop}
                  checked={entry.live2dMotionLoop}
                  onChange={(checked) => controller.updateCastLive2d(entry.characterId, { live2d_motion_loop: checked }, live2dMotionLoopKeys)}
                />
                <ToggleField
                  label={ui.form.live2dDialogueMotion}
                  checked={entry.live2dDialogueMotion}
                  onChange={(checked) => controller.updateCastLive2d(entry.characterId, { live2d_dialogue_motion: checked }, live2dDialogueMotionKeys)}
                />
                {entry.live2dMotionClips.length > 0 && (
                  <button
                    className="tool-button stage-cast-live2d-defaults"
                    type="button"
                    onClick={() => controller.updateCastLive2d(entry.characterId, buildLive2dDialogueDefaults(entry), [
                      ...adaptiveLive2dPoseKeys,
                      ...live2dDialogueMotionKeys,
                      ...live2dIdleMotionClipKeys,
                      ...live2dTalkMotionClipKeys,
                      ...live2dVisemeMotionClipKeys,
                      ...live2dMotionSpeedKeys,
                      ...live2dMotionBlendDurationKeys
                    ])}
                  >
                    <Icon name="AutoFixHigh" />{ui.form.live2dDialogueDefaults}
                  </button>
                )}
                {entry.live2dMotionClips.length > 0 ? (
                  <label className="field-block">
                    <span>{ui.form.live2dMotionClip}</span>
                    <select
                      value={entry.live2dMotionClip}
                      onChange={(event) => controller.updateCastLive2d(entry.characterId, { live2d_motion_clip: event.target.value }, live2dMotionClipKeys)}
                    >
                      <option value="">{ui.common.unspecified}</option>
                      {entry.live2dMotionClips.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                ) : (
                  <TextField
                    label={ui.form.live2dMotionClip}
                    value={entry.live2dMotionClip}
                    onChange={(next) => controller.updateCastLive2d(entry.characterId, { live2d_motion_clip: next }, live2dMotionClipKeys)}
                  />
                )}
                {entry.live2dDialogueMotion && entry.live2dMotionClips.length > 0 && (
                  <>
                    <label className="field-block">
                      <span>{ui.form.live2dIdleMotionClip}</span>
                      <select
                        value={entry.live2dIdleMotionClip}
                        onChange={(event) => controller.updateCastLive2d(entry.characterId, { live2d_idle_motion_clip: event.target.value }, live2dIdleMotionClipKeys)}
                      >
                        <option value="">{ui.common.unspecified}</option>
                        {entry.live2dMotionClips.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <label className="field-block">
                      <span>{ui.form.live2dTalkMotionClip}</span>
                      <select
                        value={entry.live2dTalkMotionClip}
                        onChange={(event) => controller.updateCastLive2d(entry.characterId, { live2d_talk_motion_clip: event.target.value }, live2dTalkMotionClipKeys)}
                      >
                        <option value="">{ui.common.unspecified}</option>
                        {entry.live2dMotionClips.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                    <label className="field-block">
                      <span>{ui.form.live2dVisemeMotionClip}</span>
                      <select
                        value={entry.live2dVisemeMotionClip}
                        onChange={(event) => controller.updateCastLive2d(entry.characterId, { live2d_viseme_motion_clip: event.target.value }, live2dVisemeMotionClipKeys)}
                      >
                        <option value="">{ui.common.unspecified}</option>
                        {entry.live2dMotionClips.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                  </>
                )}
                <NumberField
                  label={ui.form.live2dMotionTime}
                  value={entry.live2dMotionTime}
                  min={0}
                  max={600}
                  step={0.1}
                  resetValue={0}
                  onChange={(next) => controller.updateCastLive2d(entry.characterId, { live2d_motion_time: next }, [...live2dMotionTimeKeys, ...live2dMotionProgressKeys])}
                />
                <NumberField
                  label={ui.form.live2dMotionProgress}
                  value={entry.live2dMotionProgress}
                  min={0}
                  max={1}
                  step={0.05}
                  resetValue={0}
                  onChange={(next) => controller.updateCastLive2d(entry.characterId, { live2d_motion_progress: next }, [...live2dMotionProgressKeys, ...live2dMotionTimeKeys])}
                />
                <NumberField
                  label={ui.form.live2dMotionSpeed}
                  value={entry.live2dMotionSpeed}
                  min={0.1}
                  max={4}
                  step={0.1}
                  resetValue={1}
                  onChange={(next) => controller.updateCastLive2d(entry.characterId, { live2d_motion_speed: next }, live2dMotionSpeedKeys)}
                />
                <NumberField
                  label={ui.form.live2dMotionBlendDuration}
                  value={entry.live2dMotionBlendDuration}
                  min={0}
                  max={1}
                  step={0.01}
                  resetValue={0.14}
                  onChange={(next) => controller.updateCastLive2d(entry.characterId, { live2d_motion_blend_duration: next }, live2dMotionBlendDurationKeys)}
                />
                {(entry.hasLive2dMotionTime || entry.hasLive2dMotionProgress || entry.hasLive2dMotionBlendDuration || entry.live2dPoseHint || entry.live2dMotionClip || entry.live2dMotionLoop || entry.live2dDialogueMotion || entry.live2dIdleMotionClip || entry.live2dTalkMotionClip || entry.live2dVisemeMotionClip) && (
                  <button
                    className="tool-button stage-cast-live2d-reset"
                    type="button"
                    onClick={() => controller.updateCastLive2d(entry.characterId, {}, live2dStageCastMetadataKeys)}
                  >
                    <Icon name="RestartAlt" />{ui.form.live2dMotionAutoCycle}
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

function Live2dPoseHintField({
  customLabel,
  currentMissingLabel,
  live2dPoseHint,
  missingLabel,
  presetLabel,
  availablePoseHints,
  unspecifiedLabel,
  onChange
}: {
  customLabel: string;
  currentMissingLabel: string;
  live2dPoseHint: string;
  missingLabel: string;
  presetLabel: string;
  availablePoseHints: string[];
  unspecifiedLabel: string;
  onChange: (value: string) => void;
}) {
  const currentValue = live2dPoseHint.trim();
  const poseHintOptions = mergedLive2dPoseHintOptions(availablePoseHints);
  const presetValues = new Set(poseHintOptions);
  const hasCustomValue = currentValue.length > 0 && !presetValues.has(currentValue);
  return (
    <div className="stage-cast-live2d-hint">
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
        value={live2dPoseHint}
        onChange={onChange}
      />
      {availablePoseHints.length > 0 && (
        <div className="stage-cast-live2d-tags">
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

function mergedLive2dPoseHintOptions(availablePoseHints: string[]) {
  const options = [...live2dPoseHintPresets];
  for (const hint of availablePoseHints) {
    if (hint && !options.includes(hint)) options.push(hint);
  }
  return options;
}

function buildLive2dDialogueDefaults(entry: {
  live2dDialogueMotionReady: boolean;
  live2dSuggestedIdleMotionClip: string;
  live2dSuggestedTalkMotionClip: string;
  live2dSuggestedVisemeMotionClip: string;
  live2dMotionSpeed: number;
  live2dMotionBlendDuration: number;
}) {
  const patch: ResourceRecord = {
    adaptive_live2d_pose: true
  };
  if (entry.live2dDialogueMotionReady) {
    patch.live2d_dialogue_motion = true;
    patch.live2d_motion_speed = entry.live2dMotionSpeed || 1;
    patch.live2d_motion_blend_duration = entry.live2dMotionBlendDuration ?? 0.14;
    if (entry.live2dSuggestedIdleMotionClip) patch.live2d_idle_motion_clip = entry.live2dSuggestedIdleMotionClip;
    if (entry.live2dSuggestedTalkMotionClip) patch.live2d_talk_motion_clip = entry.live2dSuggestedTalkMotionClip;
    if (entry.live2dSuggestedVisemeMotionClip) patch.live2d_viseme_motion_clip = entry.live2dSuggestedVisemeMotionClip;
  }
  return patch;
}

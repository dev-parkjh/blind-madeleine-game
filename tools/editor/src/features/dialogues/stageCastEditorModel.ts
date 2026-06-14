import type { EditorCopy } from "../../editorText";
import { asArray } from "../../lib/resourceConfig";
import { normalizeBooleanFlag, normalizeNumber } from "../../lib/numeric";
import {
  collectLive2dPoseHintTagsFromRecord,
  expandLive2dPoseHintTags,
  firstLive2dPoseHintValue,
  normalizeLive2dPoseScore,
  normalizeLive2dPoseTags
} from "../../lib/live2dPoseTags";
import type { ResourceRecord, ResourceSummary } from "../../types";
import { portraitRecordForEditor } from "../characters/portraitModel";
import {
  normalizeCastPosition,
  parseCastOffset,
  portraitZoomDefault,
  stageCastAnimationOrderDefault,
  stageCastDefaultAnimationSpeed,
  stageCastDefaultOpacity
} from "./stageCastLayout";
import type { StageCastLive2dMotionPreviewFrame, StageCastPreviewEntry } from "./stageCastPreviewTypes";

export function stageCastPositionLabels(ui: EditorCopy): Record<string, string> {
  return {
    far_left: ui.form.positionFarLeft,
    left: ui.form.positionLeft,
    center: ui.form.positionCenter,
    right: ui.form.positionRight,
    far_right: ui.form.positionFarRight,
    custom: ui.form.positionCustom
  };
}

export function getStageCastPositionLabel(value: string, ui: EditorCopy) {
  return stageCastPositionLabels(ui)[value] || value;
}

export const adaptiveLive2dPoseKeys = [
  "adaptive_live2d_pose",
  "adaptiveLive2dPose",
  "live2d_auto_pose",
  "live2dAutoPose",
  "adaptive_pose",
  "adaptivePose",
  "auto_pose",
  "autoPose"
];

export const live2dMotionLoopKeys = [
  "live2d_motion_loop",
  "live2dMotionLoop",
  "live2d_motion_play",
  "live2dMotionPlay",
  "live2d_motion_autoplay",
  "live2dMotionAutoplay",
  "live2d_loop",
  "live2dLoop",
  "motion_loop",
  "motionLoop",
  "motion_play",
  "motionPlay"
];

export const live2dDialogueMotionKeys = [
  "live2d_dialogue_motion",
  "live2dDialogueMotion",
  "live2d_auto_dialogue_motion",
  "live2dAutoDialogueMotion",
  "dialogue_motion",
  "dialogueMotion",
  "auto_dialogue_motion",
  "autoDialogueMotion"
];

export const live2dMotionSpeedKeys = [
  "live2d_motion_speed",
  "live2dMotionSpeed",
  "motion_speed",
  "motionSpeed"
];

export const live2dMotionBlendDurationKeys = [
  "live2d_motion_blend_duration",
  "live2dMotionBlendDuration",
  "motion_blend_duration",
  "motionBlendDuration",
  "pose_blend_duration",
  "poseBlendDuration"
];

export const live2dIdleMotionClipKeys = [
  "live2d_idle_motion_clip",
  "live2dIdleMotionClip",
  "idle_motion_clip",
  "idleMotionClip",
  "idle_clip",
  "idleClip"
];

export const live2dTalkMotionClipKeys = [
  "live2d_talk_motion_clip",
  "live2dTalkMotionClip",
  "talk_motion_clip",
  "talkMotionClip",
  "talk_clip",
  "talkClip"
];

export const live2dVisemeMotionClipKeys = [
  "live2d_viseme_motion_clip",
  "live2dVisemeMotionClip",
  "viseme_motion_clip",
  "visemeMotionClip",
  "viseme_clip",
  "visemeClip"
];

export const live2dMotionClipKeys = [
  "live2d_motion_clip",
  "live2dMotionClip",
  "motion_clip",
  "motionClip",
  "clip_id",
  "clipId"
];

export const live2dMotionTimeKeys = [
  "live2d_motion_time",
  "live2dMotionTime",
  "motion_time",
  "motionTime",
  "pose_time",
  "poseTime"
];

export const live2dMotionProgressKeys = [
  "live2d_motion_progress",
  "live2dMotionProgress",
  "motion_progress",
  "motionProgress",
  "pose_progress",
  "poseProgress"
];

export const live2dPoseHintKeys = [
  "live2d_pose_hint",
  "live2dPoseHint",
  "pose_hint",
  "poseHint",
  "live2d_pose_tag",
  "live2dPoseTag",
  "pose_tag",
  "poseTag",
  "live2d_pose_tags",
  "live2dPoseTags",
  "pose_tags",
  "poseTags",
  "emotion",
  "mood",
  "tone",
  "expression"
];

export const live2dStageCastMetadataKeys = uniqueStageCastKeys([
  ...adaptiveLive2dPoseKeys,
  ...live2dMotionLoopKeys,
  ...live2dDialogueMotionKeys,
  ...live2dMotionSpeedKeys,
  ...live2dMotionBlendDurationKeys,
  ...live2dIdleMotionClipKeys,
  ...live2dTalkMotionClipKeys,
  ...live2dVisemeMotionClipKeys,
  ...live2dMotionClipKeys,
  ...live2dMotionTimeKeys,
  ...live2dMotionProgressKeys,
  ...live2dPoseHintKeys
]);

function uniqueStageCastKeys(keys: string[]) {
  return [...new Set(keys)];
}

function stageCastValue(source: ResourceRecord, keys: string[]) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }
  return undefined;
}

function stageCastString(source: ResourceRecord, keys: string[]) {
  return String(stageCastValue(source, keys) ?? "").trim();
}

function stageCastBoolean(source: ResourceRecord, keys: string[], fallback = false) {
  return normalizeBooleanFlag(stageCastValue(source, keys), fallback);
}

function stageCastNumber(source: ResourceRecord, keys: string[], fallback = 0, min?: number, max?: number) {
  return normalizeNumber(stageCastValue(source, keys), fallback, min, max);
}

export function buildStageCastPreviewEntries({
  cast,
  characterDetails,
  characters,
  focusTargets,
  nodes,
  selectedNodeIndex,
  speakerId,
  speakerMystery
}: {
  cast: Record<string, ResourceRecord>;
  characterDetails: Record<string, ResourceRecord>;
  characters: ResourceSummary[];
  focusTargets?: unknown;
  nodes: ResourceRecord[];
  selectedNodeIndex: number;
  speakerId: string;
  speakerMystery: boolean;
}): StageCastPreviewEntry[] {
  const focusTargetIds = getNodeFocusTargets({ focus_targets: focusTargets });
  const selectedNode = nodes[selectedNodeIndex] || {};
  return Object.entries(cast).map(([characterId, value], index) => {
    const character = characterDetails[characterId];
    const inherited = findPreviousCastEntry(nodes, selectedNodeIndex, characterId);
    const effectiveLive2dEntry = mergeLive2dPreviewPoseMetadata(value, selectedNode, characterId === speakerId);
    const live2dMotionClips = buildLive2dMotionClipOptions(character);
    const live2dPoseTags = buildLive2dPoseTagOptions(character);
    const dialogueMotionSet = live2dDialogueMotionSet(character);
    const live2dSuggestedIdleMotionClip = dialogueMotionSet.idleClipId
      || preferredLive2dMotionClip(live2dMotionClips, ["idle_loop", "idle", "breath"], live2dMotionClips[0]?.value || "");
    const live2dSuggestedTalkMotionClip = preferredLive2dMotionClip(
      live2dMotionClips,
      ["talk_loop", "talk", "speak", "mouth"],
      dialogueMotionSet.talkClipId
        || live2dMotionClips.find((option) => option.value !== live2dSuggestedIdleMotionClip)?.value
        || live2dSuggestedIdleMotionClip
    );
    const live2dSuggestedVisemeMotionClip = dialogueMotionSet.visemeClipId
      || preferredLive2dMotionClip(live2dMotionClips, ["viseme_set", "viseme", "phoneme", "lip"], "");
    const live2dMotionPreview = buildLive2dMotionPreview(character, effectiveLive2dEntry);
    const hasLive2dControls = live2dMotionClips.length > 0 || hasAnyStageCastValue(value, live2dStageCastMetadataKeys);
    return {
      characterId,
      character,
      index,
      inherited,
      isSpeaker: characterId === speakerId,
      isFocused: focusTargetIds.includes(characterId),
      label: characterLabel(characterId, character, characters),
      portrait: resolveCastPortrait(character, effectiveLive2dEntry),
      position: normalizeCastPosition(value.portrait_position ?? value.position),
      offset: parseCastOffset(value.portrait_offset),
      positionOrder: normalizeNumber(value.portrait_position_order ?? value.position_order, index + 1, 1),
      animationOrder: normalizeNumber(value.animation_order ?? value.order, stageCastAnimationOrderDefault, 1),
      animationSpeed: normalizeNumber(value.animation_speed, stageCastDefaultAnimationSpeed, 0.5, 2),
      portraitOpacity: normalizeNumber(value.portrait_opacity ?? value.opacity, stageCastDefaultOpacity, 0, 1),
      portraitZoom: normalizeNumber(value.portrait_zoom, portraitZoomDefault, 100, 500),
      flipH: normalizeBooleanFlag(value.portrait_flip_h ?? value.flip_h ?? value.flip_x),
      mystery: normalizeBooleanFlag(value.mystery ?? value.portrait_mystery, characterId === speakerId && speakerMystery),
      hasLive2dControls,
      adaptiveLive2dPose: stageCastBoolean(effectiveLive2dEntry, adaptiveLive2dPoseKeys, true),
      live2dPoseHint: firstLive2dPoseHintValue(effectiveLive2dEntry),
      live2dMotionLoop: stageCastBoolean(effectiveLive2dEntry, live2dMotionLoopKeys, false),
      live2dDialogueMotion: stageCastBoolean(effectiveLive2dEntry, live2dDialogueMotionKeys, false),
      live2dDialogueMotionReady: dialogueMotionSet.ready,
      live2dMotionClip: stageCastString(effectiveLive2dEntry, live2dMotionClipKeys),
      live2dIdleMotionClip: stageCastString(effectiveLive2dEntry, live2dIdleMotionClipKeys),
      live2dTalkMotionClip: stageCastString(effectiveLive2dEntry, live2dTalkMotionClipKeys),
      live2dVisemeMotionClip: stageCastString(effectiveLive2dEntry, live2dVisemeMotionClipKeys),
      live2dSuggestedIdleMotionClip,
      live2dSuggestedTalkMotionClip,
      live2dSuggestedVisemeMotionClip,
      live2dMotionClips,
      live2dMotionPreviewFrames: live2dMotionPreview.frames,
      live2dMotionPreviewDuration: live2dMotionPreview.duration,
      live2dPoseTags,
      live2dMotionTime: stageCastNumber(effectiveLive2dEntry, live2dMotionTimeKeys, 0, 0, 600),
      live2dMotionProgress: stageCastNumber(effectiveLive2dEntry, live2dMotionProgressKeys, 0, 0, 1),
      live2dMotionSpeed: stageCastNumber(effectiveLive2dEntry, live2dMotionSpeedKeys, 1, 0.1, 4),
      live2dMotionBlendDuration: stageCastNumber(effectiveLive2dEntry, live2dMotionBlendDurationKeys, 0.14, 0, 1),
      hasLive2dMotionTime: hasAnyStageCastValue(effectiveLive2dEntry, live2dMotionTimeKeys),
      hasLive2dMotionProgress: hasAnyStageCastValue(effectiveLive2dEntry, live2dMotionProgressKeys),
      hasLive2dMotionBlendDuration: hasAnyStageCastValue(effectiveLive2dEntry, live2dMotionBlendDurationKeys)
    };
  });
}

function mergeLive2dPreviewPoseMetadata(castEntry: ResourceRecord, node: ResourceRecord, isSpeaker: boolean) {
  const merged = { ...castEntry };
  const metadata = node.metadata && typeof node.metadata === "object" && !Array.isArray(node.metadata)
    ? node.metadata as ResourceRecord
    : {};
  if (isSpeaker) {
    for (const key of live2dStageCastMetadataKeys) {
      if (merged[key] === undefined && metadata[key] !== undefined) merged[key] = metadata[key];
    }
  }
  if (!hasAnyStageCastValue(merged, live2dPoseHintKeys) && isSpeaker) {
    const inferredHint = inferLive2dPoseHintFromText(String(node.text || ""));
    if (inferredHint) merged.live2d_pose_hint = inferredHint;
  }
  if (isSpeaker) {
    const previewText = String(node.text || "").trim();
    if (previewText) merged.__live2d_preview_text = previewText;
  }
  return merged;
}

function preferredLive2dMotionClip(
  options: Array<{ value: string; label: string }>,
  keywords: string[],
  fallback: string
) {
  for (const keyword of keywords) {
    const exact = options.find((option) => option.value.toLowerCase() === keyword);
    if (exact) return exact.value;
  }
  for (const keyword of keywords) {
    const match = options.find((option) => `${option.value} ${option.label}`.toLowerCase().includes(keyword));
    if (match) return match.value;
  }
  return fallback;
}

export function portraitKeys(character: ResourceRecord | undefined) {
  const portraits = character?.portraits && typeof character.portraits === "object"
    ? character.portraits as Record<string, ResourceRecord | string>
    : {};
  return Object.keys(portraits);
}

function resolveCastPortrait(character: ResourceRecord | undefined, castEntry: ResourceRecord): StageCastPreviewEntry["portrait"] {
  const portraits = character?.portraits && typeof character.portraits === "object"
    ? character.portraits as Record<string, ResourceRecord | string>
    : {};
  const keyOrPath = castEntry.portrait;
  const key = String(keyOrPath || "").trim();
  if (key.startsWith("res://")) {
    return { key, path: key, center: [0.5, 0.34], profile: {} };
  }

  const portraitKey = key || resolveAdaptiveLive2dPortraitKey(character, castEntry);
  const rawPortrait = portraitKey ? portraits[portraitKey] : null;
  const fallbackPortrait = portraitKey ? resolveLive2dMotionFrameSetPortrait(character, portraitKey) : null;
  if (!rawPortrait) return fallbackPortrait;
  const portrait = portraitRecordForEditor(rawPortrait);
  const path = String(portrait.path || fallbackPortrait?.path || "");
  const canUseFallbackMetadata = Boolean(fallbackPortrait && path && path === fallbackPortrait.path);
  const center = asArray<number>(portrait.center);
  const profile = portrait.profile && typeof portrait.profile === "object" ? portrait.profile as ResourceRecord : {};
  return {
    key: portraitKey,
    path,
    center: center.length >= 2 ? center : (canUseFallbackMetadata ? fallbackPortrait?.center || [] : center),
    profile: Object.keys(profile).length > 0 ? profile : (canUseFallbackMetadata ? fallbackPortrait?.profile || {} : profile)
  };
}

function buildLive2dMotionClipOptions(character: ResourceRecord | undefined) {
  const clips = new Map<string, string>();
  for (const clip of collectLive2dMetadataClips(character)) {
    if (!clip.clipId || clips.has(clip.clipId)) continue;
    clips.set(clip.clipId, formatLive2dMotionClipOptionLabel(clip.clipLabel || clip.clipId, clip.frameCount));
  }
  for (const frameSet of collectLive2dMotionFrameSets(character)) {
    if (!frameSet.clipId || clips.has(frameSet.clipId)) continue;
    clips.set(frameSet.clipId, formatLive2dMotionClipOptionLabel(frameSet.clipLabel || frameSet.clipId, frameSet.frameCount));
  }
  for (const frame of collectLive2dMotionFrames(character)) {
    if (!frame.clipId || clips.has(frame.clipId)) continue;
    clips.set(frame.clipId, formatLive2dMotionClipOptionLabel(frame.clipLabel || frame.clipId, frame.frameCount));
  }
  return [...clips.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function collectLive2dMetadataClips(character: ResourceRecord | undefined) {
  const clips = live2dWebMetadata(character).clips;
  if (!Array.isArray(clips)) return [];
  return clips.flatMap((rawClip): Array<{ clipId: string; clipLabel: string; frameCount: number }> => {
    if (!rawClip || typeof rawClip !== "object" || Array.isArray(rawClip)) return [];
    const clip = rawClip as ResourceRecord;
    const clipId = String(clip.id || clip.clip_id || clip.clipId || "").trim();
    if (!clipId) return [];
    return [{
      clipId,
      clipLabel: String(clip.label || clip.name || clipId).trim() || clipId,
      frameCount: normalizeNumber(clip.export_frame_count ?? clip.exportFrameCount ?? clip.frame_count ?? clip.frameCount, 0, 0)
    }];
  });
}

function formatLive2dMotionClipOptionLabel(label: string, frameCount: number) {
  return frameCount > 0 ? `${label} · ${frameCount}f` : label;
}

function buildLive2dPoseTagOptions(character: ResourceRecord | undefined) {
  const tags = new Set<string>();
  for (const frame of collectLive2dMotionFrames(character)) {
    frame.poseTags.forEach((tag) => tags.add(tag));
    Object.keys(frame.poseScore).forEach((tag) => tags.add(tag));
  }
  for (const preset of collectLive2dExpressionPresetSummaries(character)) {
    preset.poseTags.forEach((tag) => tags.add(tag));
    Object.keys(preset.poseScore).forEach((tag) => tags.add(tag));
  }
  return [...tags].filter(Boolean).sort((a, b) => a.localeCompare(b)).slice(0, 64);
}

function collectLive2dExpressionPresetSummaries(character: ResourceRecord | undefined) {
  const live2d = live2dWebMetadata(character);
  const presets = [
    ...(Array.isArray(live2d.expression_presets) ? live2d.expression_presets : []),
    ...(Array.isArray(live2d.expressionPresets) ? live2d.expressionPresets : [])
  ];
  return presets.flatMap((rawPreset): Array<{ poseTags: string[]; poseScore: Record<string, number> }> => {
    if (!rawPreset || typeof rawPreset !== "object" || Array.isArray(rawPreset)) return [];
    const preset = rawPreset as ResourceRecord;
    return [{
      poseTags: normalizePoseTags(preset.pose_tags ?? preset.poseTags),
      poseScore: normalizePoseScore(preset.pose_score ?? preset.poseScore)
    }];
  });
}

function collectLive2dMotionFrames(character: ResourceRecord | undefined) {
  const portraits = character?.portraits && typeof character.portraits === "object"
    ? character.portraits as Record<string, ResourceRecord | string>
    : {};
  const frames: Live2dMotionFrame[] = [];
  const seen = new Set<string>();
  for (const [key, rawPortrait] of Object.entries(portraits)) {
    if (!rawPortrait || typeof rawPortrait !== "object" || Array.isArray(rawPortrait)) continue;
    const frame = live2dMotionFrameFromPortraitLike(rawPortrait);
    const clipId = String(frame.clip_id || frame.clipId || "").trim();
    if (!clipId) continue;
    frames.push({
      key,
      clipId,
      clipLabel: String(frame.clip_label || frame.clipLabel || frame.label || clipId).trim() || clipId,
      time: normalizeNumber(frame.time, 0, 0),
      frameIndex: normalizeNumber(frame.frame_index ?? frame.frameIndex, 0, 0),
      clipDuration: positiveMotionMetadataNumber(frame, ["clip_duration", "clipDuration", "duration"]),
      frameCount: normalizeNumber(frame.frame_count ?? frame.frameCount, 0, 0),
      poseTags: normalizePoseTags(frame.pose_tags ?? frame.poseTags),
      poseScore: normalizePoseScore(frame.pose_score ?? frame.poseScore),
      parameterValues: normalizeParameterValues(frame.parameter_values ?? frame.parameterValues),
      path: String(rawPortrait.path || ""),
      center: asArray<number>(rawPortrait.center),
      profile: rawPortrait.profile && typeof rawPortrait.profile === "object" && !Array.isArray(rawPortrait.profile) ? rawPortrait.profile as ResourceRecord : {}
    });
    seen.add(`${key}:${clipId}`);
  }
  for (const [key, rawPortrait] of Object.entries(live2dMetadataPortraits(character))) {
    if (!rawPortrait || typeof rawPortrait !== "object" || Array.isArray(rawPortrait)) continue;
    const frame = live2dMotionFrameFromPortraitLike(rawPortrait);
    const clipId = String(frame.clip_id || frame.clipId || "").trim();
    if (!clipId || seen.has(`${key}:${clipId}`)) continue;
    frames.push({
      key,
      clipId,
      clipLabel: String(frame.clip_label || frame.clipLabel || frame.label || clipId).trim() || clipId,
      time: normalizeNumber(frame.time, 0, 0),
      frameIndex: normalizeNumber(frame.frame_index ?? frame.frameIndex, 0, 0),
      clipDuration: positiveMotionMetadataNumber(frame, ["clip_duration", "clipDuration", "duration"]),
      frameCount: normalizeNumber(frame.frame_count ?? frame.frameCount, 0, 0),
      poseTags: normalizePoseTags(frame.pose_tags ?? frame.poseTags),
      poseScore: normalizePoseScore(frame.pose_score ?? frame.poseScore),
      parameterValues: normalizeParameterValues(frame.parameter_values ?? frame.parameterValues),
      path: String(rawPortrait.image_path || rawPortrait.imagePath || rawPortrait.path || ""),
      center: asArray<number>(rawPortrait.center),
      profile: rawPortrait.profile && typeof rawPortrait.profile === "object" && !Array.isArray(rawPortrait.profile) ? rawPortrait.profile as ResourceRecord : {}
    });
    seen.add(`${key}:${clipId}`);
  }
  const metadataPortraits = live2dMetadataPortraits(character);
  for (const frameSet of collectLive2dMotionFrameSets(character)) {
    for (const state of frameSet.states) {
      const key = state.key;
      const metadataPortrait = metadataPortraits[key];
      const metadataPath = metadataPortrait && typeof metadataPortrait === "object" && !Array.isArray(metadataPortrait)
        ? String(metadataPortrait.image_path || metadataPortrait.imagePath || metadataPortrait.path || "")
        : "";
      if (!key || seen.has(`${key}:${frameSet.clipId}`) || (!portraits[key] && !metadataPath && !state.path)) continue;
      frames.push({
        key,
        clipId: frameSet.clipId,
        clipLabel: frameSet.clipLabel || frameSet.clipId,
        time: state.time,
        frameIndex: state.frameIndex,
        clipDuration: frameSet.clipDuration,
        frameCount: frameSet.frameCount,
        poseTags: state.poseTags,
        poseScore: state.poseScore,
        parameterValues: state.parameterValues,
        path: state.path || metadataPath,
        center: state.center.length >= 2 ? state.center : asArray<number>(metadataPortrait?.center),
        profile: Object.keys(state.profile).length > 0
          ? state.profile
          : (metadataPortrait?.profile && typeof metadataPortrait.profile === "object" && !Array.isArray(metadataPortrait.profile) ? metadataPortrait.profile as ResourceRecord : {})
      });
      seen.add(`${key}:${frameSet.clipId}`);
    }
  }
  return frames.sort((a, b) => a.clipId === b.clipId
    ? a.time === b.time ? a.frameIndex - b.frameIndex : a.time - b.time
    : a.clipId.localeCompare(b.clipId));
}

function collectLive2dMotionFrameSets(character: ResourceRecord | undefined): Live2dMotionFrameSet[] {
  const live2d = live2dWebMetadata(character);
  const sets = [
    ...(Array.isArray(live2d.motion_frame_sets) ? live2d.motion_frame_sets : []),
    ...(Array.isArray(live2d.motionFrameSets) ? live2d.motionFrameSets : [])
  ];
  return sets.flatMap((rawSet): Live2dMotionFrameSet[] => {
    if (!rawSet || typeof rawSet !== "object" || Array.isArray(rawSet)) return [];
    const frameSet = rawSet as ResourceRecord;
    const clipId = String(frameSet.clip_id || frameSet.clipId || "").trim();
    if (!clipId) return [];
    const states = Array.isArray(frameSet.states) ? frameSet.states : [];
    return [{
      clipId,
      clipLabel: String(frameSet.clip_label || frameSet.clipLabel || frameSet.label || clipId).trim() || clipId,
      clipDuration: positiveMotionMetadataNumber(frameSet, ["clip_duration", "clipDuration", "duration"]),
      frameCount: normalizeNumber(frameSet.frame_count ?? frameSet.frameCount ?? frameSet.expected_frame_count ?? frameSet.expectedFrameCount, states.length, 0),
      states: states.flatMap((rawState): Live2dMotionFrameSetState[] => {
        if (!rawState || typeof rawState !== "object" || Array.isArray(rawState)) return [];
        const state = rawState as ResourceRecord;
        const frame = live2dMotionFrameFromPortraitLike(state);
        const key = String(state.state || state.key || "").trim();
        if (!key) return [];
        return [{
          key,
          path: String(state.image_path || state.imagePath || state.path || ""),
          center: asArray<number>(state.center).length >= 2 ? asArray<number>(state.center) : [0.5, 0.5],
          profile: state.profile && typeof state.profile === "object" && !Array.isArray(state.profile) ? state.profile as ResourceRecord : {},
          time: normalizeNumber(state.time, 0, 0),
          frameIndex: normalizeNumber(state.frame_index ?? state.frameIndex, 0, 0),
          poseTags: normalizePoseTags(state.pose_tags ?? state.poseTags ?? frame.pose_tags ?? frame.poseTags),
          poseScore: normalizePoseScore(state.pose_score ?? state.poseScore ?? frame.pose_score ?? frame.poseScore),
          parameterValues: normalizeParameterValues(state.parameter_values ?? state.parameterValues ?? frame.parameter_values ?? frame.parameterValues)
        }];
      })
    }];
  });
}

function resolveLive2dMotionFrameSetPortrait(character: ResourceRecord | undefined, key: string): StageCastPreviewEntry["portrait"] {
  const frameSetState = collectLive2dMotionFrameSets(character)
    .flatMap((frameSet) => frameSet.states)
    .find((state) => state.key === key && state.path);
  if (!frameSetState) {
    const frame = collectLive2dMotionFrames(character).find((entry) => entry.key === key && entry.path);
    if (!frame) return null;
    return {
      key,
      path: frame.path || "",
      center: frame.center.length >= 2 ? frame.center : [0.5, 0.5],
      profile: frame.profile
    };
  }
  return {
    key,
    path: frameSetState.path,
    center: frameSetState.center,
    profile: frameSetState.profile
  };
}

function resolveAdaptiveLive2dPortraitKey(character: ResourceRecord | undefined, castEntry: ResourceRecord) {
  if (!stageCastBoolean(castEntry, adaptiveLive2dPoseKeys, true)) {
    return "";
  }
  const frames = collectLive2dMotionFrames(character);
  if (frames.length === 0) return "";
  const clipOptions = buildLive2dMotionClipOptions(character);
  const dialogueMotionSet = live2dDialogueMotionSet(character);
  const dialogueMotion = stageCastBoolean(castEntry, live2dDialogueMotionKeys, false);
  const explicitClip = stageCastString(castEntry, live2dMotionClipKeys);
  const idleClip = stageCastString(castEntry, live2dIdleMotionClipKeys)
    || dialogueMotionSet.idleClipId
    || preferredLive2dMotionClip(clipOptions, ["idle_loop", "idle", "breath"], "");
  const requestedClip = dialogueMotion
    ? idleClip
    : explicitClip;
  const fallbackClip = explicitClip
    || dialogueMotionSet.adaptiveClipId
    || preferredAdaptiveLive2dMotionClip(frames);
  const clipId = requestedClip || fallbackClip;
  const clipFrames = frames.filter((frame) => frame.clipId === clipId);
  if (clipFrames.length === 0 && clipId !== fallbackClip) {
    const fallbackFrames = frames.filter((frame) => frame.clipId === fallbackClip);
    if (fallbackFrames.length > 0) return resolveLive2dFrameKeyFromMotionSettings(fallbackFrames, castEntry);
  }
  if (clipFrames.length === 0) return "";

  return resolveLive2dFrameKeyFromMotionSettings(clipFrames, castEntry);
}

function buildLive2dMotionPreview(character: ResourceRecord | undefined, castEntry: ResourceRecord): {
  frames: StageCastLive2dMotionPreviewFrame[];
  duration: number;
} {
  const frames = collectLive2dMotionFrames(character).filter((frame) => frame.path);
  if (frames.length < 2) return { frames: [], duration: 0 };

  const clipOptions = buildLive2dMotionClipOptions(character);
  const dialogueMotionSet = live2dDialogueMotionSet(character);
  const dialogueMotion = stageCastBoolean(castEntry, live2dDialogueMotionKeys, false);
  const motionLoop = stageCastBoolean(castEntry, live2dMotionLoopKeys, false);
  if (!dialogueMotion && !motionLoop) return { frames: [], duration: 0 };

  const explicitClip = stageCastString(castEntry, live2dMotionClipKeys);
  const idleClip = stageCastString(castEntry, live2dIdleMotionClipKeys)
    || dialogueMotionSet.idleClipId
    || preferredLive2dMotionClip(clipOptions, ["idle_loop", "idle", "breath"], "");
  const talkClip = stageCastString(castEntry, live2dTalkMotionClipKeys)
    || dialogueMotionSet.talkClipId
    || preferredLive2dMotionClip(clipOptions, ["talk_loop", "talk", "speak", "mouth"], "");
  const visemeClip = stageCastString(castEntry, live2dVisemeMotionClipKeys)
    || dialogueMotionSet.visemeClipId
    || preferredLive2dMotionClip(clipOptions, ["viseme_set", "viseme", "phoneme", "lip"], "");
  const previewText = String(castEntry.__live2d_preview_text || "").trim();
  const previewPoseTags = dialoguePreviewPoseTagsFromCastEntry(castEntry, previewText);
  const requestedClip = dialogueMotion
    ? preferredDialogueLive2dMotionPreviewClip(frames, {
      explicitClip,
      idleClip,
      talkClip,
      visemeClip,
      hasDialogueText: previewText.length > 0,
      poseTags: previewPoseTags
    })
    : explicitClip || dialogueMotionSet.adaptiveClipId || preferredAdaptiveLive2dMotionClip(frames);
  const clipId = requestedClip || dialogueMotionSet.adaptiveClipId || preferredAdaptiveLive2dMotionClip(frames);
  const clipFrames = frames.filter((frame) => frame.clipId === clipId);
  if (clipFrames.length < 2) return { frames: [], duration: 0 };

  const sortedFrames = clipFrames.slice().sort((left, right) => (
    left.time === right.time ? left.frameIndex - right.frameIndex : left.time - right.time
  ));
  const duration = Math.max(live2dMotionClipDuration(sortedFrames), sortedFrames.length / 6, 0.1);
  return {
    duration,
    frames: sortedFrames.map((frame) => ({
      key: frame.key,
      path: frame.path,
      center: frame.center,
      profile: frame.profile,
      time: frame.time,
      clipId: frame.clipId
    }))
  };
}

function resolveLive2dFrameKeyFromMotionSettings(
  clipFrames: Live2dMotionFrame[],
  castEntry: ResourceRecord
) {
  const requestedTime = getOptionalMotionNumber(castEntry, live2dMotionTimeKeys);
  if (requestedTime !== null) return nearestLive2dMotionFrameKey(clipFrames, requestedTime);

  const requestedProgress = getOptionalMotionNumber(castEntry, live2dMotionProgressKeys);
  if (requestedProgress !== null) {
    const duration = live2dMotionClipDuration(clipFrames);
    return nearestLive2dMotionFrameKey(clipFrames, Math.min(1, Math.max(0, requestedProgress)) * duration);
  }

  const poseTags = poseHintTagsFromCastEntry(castEntry);
  if (poseTags.length > 0) {
    const taggedKey = bestLive2dMotionFrameKeyForPoseTags(clipFrames, poseTags);
    if (taggedKey) return taggedKey;
  }

  return clipFrames[0]?.key || "";
}

function nearestLive2dMotionFrameKey(
  frames: Array<{ key: string; time: number }>,
  targetTime: number
) {
  let best = frames[0];
  let bestDistance = Math.abs(best.time - targetTime);
  for (const frame of frames.slice(1)) {
    const distance = Math.abs(frame.time - targetTime);
    if (distance >= bestDistance) continue;
    best = frame;
    bestDistance = distance;
  }
  return best?.key || "";
}

function live2dMotionClipDuration(frames: Live2dMotionFrame[]) {
  const declaredDuration = frames.reduce((duration, frame) => Math.max(duration, frame.clipDuration), 0);
  if (declaredDuration > 0) return declaredDuration;
  return frames.reduce((maxTime, frame) => Math.max(maxTime, frame.time), 0);
}

function poseHintTagsFromCastEntry(castEntry: ResourceRecord) {
  return expandLive2dPoseHintTags(collectLive2dPoseHintTagsFromRecord(castEntry));
}

function dialoguePreviewPoseTagsFromCastEntry(castEntry: ResourceRecord, previewText: string) {
  const poseTags = poseHintTagsFromCastEntry(castEntry);
  const textHint = inferLive2dPoseHintFromText(previewText);
  if (!textHint) return poseTags;
  const textTags = collectLive2dPoseHintTagsFromRecord({ live2d_pose_hint: textHint });
  return expandLive2dPoseHintTags([...poseTags, ...textTags]);
}

function preferredDialogueLive2dMotionPreviewClip(
  frames: Live2dMotionFrame[],
  {
    explicitClip,
    idleClip,
    talkClip,
    visemeClip,
    hasDialogueText,
    poseTags
  }: {
    explicitClip: string;
    idleClip: string;
    talkClip: string;
    visemeClip: string;
    hasDialogueText: boolean;
    poseTags: string[];
  }
) {
  const hasVisemeHint = poseTags.some((tag) => tag === "viseme" || tag === "phoneme" || tag.startsWith("viseme_"));
  if (hasVisemeHint && hasLive2dMotionPreviewClipFrames(frames, visemeClip)) return visemeClip;
  if (hasDialogueText && hasLive2dMotionPreviewClipFrames(frames, talkClip)) return talkClip;
  if (hasLive2dMotionPreviewClipFrames(frames, idleClip)) return idleClip;
  if (hasLive2dMotionPreviewClipFrames(frames, explicitClip)) return explicitClip;
  if (hasLive2dMotionPreviewClipFrames(frames, talkClip)) return talkClip;
  if (hasLive2dMotionPreviewClipFrames(frames, visemeClip)) return visemeClip;
  return idleClip || explicitClip || talkClip || visemeClip;
}

function hasLive2dMotionPreviewClipFrames(frames: Live2dMotionFrame[], clipId: string) {
  if (!clipId) return false;
  return frames.filter((frame) => frame.clipId === clipId && frame.path).length >= 2;
}

function bestLive2dMotionFrameKeyForPoseTags(frames: Live2dMotionFrame[], requestedTags: string[]) {
  let bestKey = "";
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestMatchScore = 0;
  for (const frame of frames) {
    const matchScore = requestedTags.reduce((total, tag) => (
      total
      + (frame.poseTags.includes(tag) ? 3 : 0)
      + ((frame.poseScore[tag] || 0) * 2)
    ), 0);
    const score = matchScore + frameParameterEnergy(frame) * 0.18 + stableFrameTieBreak(frame.key) * 0.12;
    if (score > bestScore) {
      bestKey = frame.key;
      bestScore = score;
      bestMatchScore = matchScore;
    }
  }
  return bestMatchScore > 0.05 ? bestKey : "";
}

function stableFrameTieBreak(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash = ((hash ^ character.charCodeAt(0)) * 16777619) >>> 0;
  }
  return (hash % 1000) / 1000;
}

function frameParameterEnergy(frame: Live2dMotionFrame) {
  const values = Object.values(frame.parameterValues || {});
  if (values.length === 0) return 0;
  const total = values.reduce((sum, value) => sum + Math.min(1, Math.abs(value) / 100), 0);
  return total / values.length;
}

function preferredAdaptiveLive2dMotionClip(frames: Live2dMotionFrame[]) {
  const priorities = ["adaptive_pose", "dialogue_pose", "idle_loop", "idle", "breath", "talk_loop", "talk"];
  for (const priority of priorities) {
    const exact = frames.find((frame) => frame.clipId.toLowerCase() === priority);
    if (exact) return exact.clipId;
    const partial = frames.find((frame) => `${frame.clipId} ${frame.clipLabel}`.toLowerCase().includes(priority));
    if (partial) return partial.clipId;
  }
  return frames[0]?.clipId || "";
}

function positiveMotionMetadataNumber(source: ResourceRecord, keys: string[]) {
  for (const key of keys) {
    const value = Number(source[key]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return 0;
}

function live2dDialogueMotionSet(character: ResourceRecord | undefined): Live2dDialogueMotionSet {
  const live2d = live2dWebMetadata(character);
  const source = live2d.dialogue_motion_set ?? live2d.dialogueMotionSet;
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return emptyLive2dDialogueMotionSet();
  }
  const record = source as ResourceRecord;
  return {
    ready: live2dDialogueMotionSetReady(record),
    adaptiveClipId: String(record.adaptive_clip_id || record.adaptiveClipId || "").trim(),
    idleClipId: String(record.idle_clip_id || record.idleClipId || "").trim(),
    talkClipId: String(record.talk_clip_id || record.talkClipId || "").trim(),
    visemeClipId: String(record.viseme_clip_id || record.visemeClipId || "").trim()
  };
}

function emptyLive2dDialogueMotionSet(): Live2dDialogueMotionSet {
  return {
    ready: false,
    adaptiveClipId: "",
    idleClipId: "",
    talkClipId: "",
    visemeClipId: ""
  };
}

function live2dDialogueMotionSetReady(record: ResourceRecord) {
  if (record.ready !== undefined) return record.ready === true;
  const adaptiveClipId = String(record.adaptive_clip_id || record.adaptiveClipId || "").trim();
  const idleClipId = String(record.idle_clip_id || record.idleClipId || "").trim();
  const talkClipId = String(record.talk_clip_id || record.talkClipId || "").trim();
  if (!adaptiveClipId || !idleClipId || !talkClipId) return false;
  if (
    record.has_complete_adaptive_pose === true
    && record.has_complete_idle_loop === true
    && record.has_complete_talk_loop === true
  ) {
    return true;
  }
  if (
    record.hasCompleteAdaptivePose === true
    && record.hasCompleteIdleLoop === true
    && record.hasCompleteTalkLoop === true
  ) {
    return true;
  }
  const completeClipIds = Array.isArray(record.complete_exported_clip_ids)
    ? record.complete_exported_clip_ids
    : (Array.isArray(record.completeExportedClipIds) ? record.completeExportedClipIds : []);
  return [adaptiveClipId, idleClipId, talkClipId].every((clipId) => completeClipIds.map((entry) => String(entry || "").trim()).includes(clipId));
}

function live2dWebMetadata(character: ResourceRecord | undefined): ResourceRecord {
  const metadata = character?.metadata && typeof character.metadata === "object" && !Array.isArray(character.metadata)
    ? character.metadata as ResourceRecord
    : {};
  const source = metadata.live2d_web_model ?? metadata.live2dWebModel;
  const live2d = source && typeof source === "object" && !Array.isArray(source)
    ? source as ResourceRecord
    : {};
  return live2d;
}

function normalizePoseTags(value: unknown) {
  return normalizeLive2dPoseTags(value, 64);
}

function normalizePoseScore(value: unknown) {
  return normalizeLive2dPoseScore(value, 32);
}

function normalizeParameterValues(value: unknown) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as ResourceRecord : {};
  return Object.fromEntries(
    Object.entries(source)
      .map(([key, rawValue]) => [String(key).trim(), Number(rawValue)] as const)
      .filter(([key, numberValue]) => key && Number.isFinite(numberValue))
      .slice(0, 128)
      .map(([key, numberValue]) => [key, Math.min(10000, Math.max(-10000, numberValue))])
  );
}

function live2dMetadataPortraits(character: ResourceRecord | undefined): Record<string, ResourceRecord> {
  const live2d = live2dWebMetadata(character);
  return live2d.portraits && typeof live2d.portraits === "object" && !Array.isArray(live2d.portraits)
    ? live2d.portraits as Record<string, ResourceRecord>
    : {};
}

function live2dMotionFrameFromPortraitLike(value: ResourceRecord) {
  const frame = value.live2d_motion_frame ?? value.live2dMotionFrame ?? value.motion_frame ?? value.motionFrame;
  return frame && typeof frame === "object" && !Array.isArray(frame) ? frame as ResourceRecord : {};
}

function inferLive2dPoseHintFromText(value: string) {
  const text = value.trim().toLowerCase();
  if (!text) return "";
  const hints: string[] = [];
  const add = (tag: string) => {
    if (!hints.includes(tag) && hints.length < 6) hints.push(tag);
  };
  if (/(하하|ㅎㅎ|웃|기쁘|좋아|고마|다행|happy|smile|laugh)/.test(text)) add("happy");
  if (/(미안|슬프|눈물|외로|아파|sad|sorry)/.test(text)) add("sad");
  if (/(화|짜증|싫|그만|angry|mad)/.test(text)) add("angry");
  if (/(걱정|불안|무서|떨|worried|afraid|scared)/.test(text)) add("worried");
  if (text.includes("?") || /(왜|뭐|어째서|정말|혹시|question|why)/.test(text)) add("curious");
  if (text.includes("!") || /(놀라|잠깐|뭐라고|surprise|shock)/.test(text)) add("surprised");
  if (text.includes("...") || text.includes("…")) add("serious");
  if (containsLive2dSpeechCodepoint(value)) {
    add("talk");
    add("open_mouth");
  }
  const visemeHint = dominantLive2dVisemeHint(value);
  if (visemeHint) add(visemeHint);
  return hints.join(",");
}

function containsLive2dSpeechCodepoint(value: string) {
  for (const character of value) {
    const code = character.codePointAt(0) || 0;
    if ((code >= 0xAC00 && code <= 0xD7A3) || /[a-zA-Z0-9]/.test(character)) return true;
  }
  return false;
}

function dominantLive2dVisemeHint(value: string) {
  const counts = new Map<string, number>();
  for (const character of value) {
    const viseme = live2dVisemeNameForCharacter(character);
    if (!viseme) continue;
    counts.set(viseme, (counts.get(viseme) || 0) + 1);
  }
  let best = "";
  let bestCount = 0;
  for (const [viseme, count] of counts.entries()) {
    if (count > bestCount) {
      best = viseme;
      bestCount = count;
    }
  }
  return best ? `viseme_${best}` : "";
}

function live2dVisemeNameForCharacter(character: string) {
  if (!character) return "";
  const code = character.codePointAt(0) || 0;
  if (isLive2dVisemeSilentCodepoint(code)) return "";
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const syllableIndex = code - 0xAC00;
    const medialIndex = Math.floor(syllableIndex / 28) % 21;
    if ([0, 1, 2, 3, 4, 5, 6, 7].includes(medialIndex)) return "a";
    if ([8, 9, 10, 11, 12].includes(medialIndex)) return "o";
    if ([13, 14, 15, 16, 17, 18].includes(medialIndex)) return "u";
    if ([19, 20].includes(medialIndex)) return "i";
    return "a";
  }
  const lower = character.toLowerCase();
  if (["a", "e"].includes(lower)) return "a";
  if (["i", "y"].includes(lower)) return "i";
  if (lower === "o") return "o";
  if (["u", "w"].includes(lower)) return "u";
  if (["b", "m", "p"].includes(lower)) return "closed";
  return "";
}

function isLive2dVisemeSilentCodepoint(code: number) {
  if (code <= 32) return true;
  return [
    33, 34, 39, 40, 41, 44, 45, 46, 58, 59, 63,
    0x3000, 0x3001, 0x3002, 0xFF01, 0xFF0C, 0xFF0E, 0xFF1F
  ].includes(code);
}

type Live2dMotionFrame = {
  key: string;
  clipId: string;
  clipLabel: string;
  time: number;
  frameIndex: number;
  clipDuration: number;
  frameCount: number;
  poseTags: string[];
  poseScore: Record<string, number>;
  parameterValues: Record<string, number>;
  path: string;
  center: number[];
  profile: ResourceRecord;
};

type Live2dMotionFrameSet = {
  clipId: string;
  clipLabel: string;
  clipDuration: number;
  frameCount: number;
  states: Live2dMotionFrameSetState[];
};

type Live2dMotionFrameSetState = {
  key: string;
  path: string;
  center: number[];
  profile: ResourceRecord;
  time: number;
  frameIndex: number;
  poseTags: string[];
  poseScore: Record<string, number>;
  parameterValues: Record<string, number>;
};

type Live2dDialogueMotionSet = {
  ready: boolean;
  adaptiveClipId: string;
  idleClipId: string;
  talkClipId: string;
  visemeClipId: string;
};

function getOptionalMotionNumber(value: ResourceRecord, keys: string[]) {
  for (const key of keys) {
    if (value[key] === undefined || value[key] === null || value[key] === "") continue;
    const numberValue = Number(value[key]);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return null;
}

function hasAnyStageCastValue(value: ResourceRecord, keys: string[]) {
  return keys.some((key) => value[key] !== undefined && value[key] !== null && value[key] !== "");
}

function characterLabel(characterId: string, character: ResourceRecord | undefined, summaries: ResourceSummary[]) {
  if (characterId === "mystery") return "???";
  return String(character?.display_name || summaries.find((entry) => entry.id === characterId)?.title || characterId);
}

function findPreviousCastEntry(nodes: ResourceRecord[], selectedNodeIndex: number, characterId: string) {
  for (let index = selectedNodeIndex - 1; index >= 0; index -= 1) {
    const previousCast = nodes[index]?.stage_cast;
    if (!previousCast || typeof previousCast !== "object" || Array.isArray(previousCast)) continue;
    const entry = (previousCast as Record<string, ResourceRecord>)[characterId];
    if (entry && typeof entry === "object" && !Array.isArray(entry)) return { index, entry };
  }
  return null;
}

function getNodeFocusTargets(node: ResourceRecord | undefined) {
  if (!node) return [];
  return normalizeCharacterIdList(node.focus_targets ?? node.focus_characters ?? node.spotlight_targets ?? node.attention_targets ?? node.camera_focus_targets);
}

function normalizeCharacterIdList(value: unknown) {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\s,;]+/)
      : [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const rawId of source) {
    const characterId = String(rawId || "").trim();
    if (!characterId || seen.has(characterId)) continue;
    seen.add(characterId);
    ids.push(characterId);
  }
  return ids;
}

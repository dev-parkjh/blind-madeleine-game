import type { ResourceRecord, ValidationIssue } from "../../types";
import {
  imagePathExtensions,
  isPlainRecord,
  validateNumberRange,
  validatePathExtension,
  validatePointArray,
  validateResPath,
  validateVector2
} from "./shared";

const rigPathExtensions = new Set(["json"]);

export function validateCharacter(data: ResourceRecord, issues: ValidationIssue[]) {
  if (!data.display_name) issues.push({ severity: "error", message: "캐릭터 display_name이 비어 있습니다." });
  if (data.name_color && !/^#[0-9a-f]{6}$/i.test(String(data.name_color))) {
    issues.push({ severity: "warning", message: "name_color는 #RRGGBB 형식을 권장합니다." });
  }
  if (data.metadata !== undefined && !isPlainRecord(data.metadata)) {
    issues.push({ severity: "warning", message: "캐릭터 metadata는 객체 JSON이어야 합니다." });
  }
  const portraitKeys = data.portraits && typeof data.portraits === "object" && !Array.isArray(data.portraits)
    ? new Set(Object.keys(data.portraits))
    : new Set<string>();
  if (isPlainRecord(data.metadata)) {
    validateLive2dWebMetadata(data.metadata.live2d_web_model ?? data.metadata.live2dWebModel, issues, portraitKeys);
  }
  validateVector2(data.spectrum_offset, "spectrum_offset", issues, { min: -1, max: 1, optional: true });

  const portraits = data.portraits;
  if (portraits && typeof portraits === "object" && !Array.isArray(portraits)) {
    for (const [key, portrait] of Object.entries(portraits)) {
      validateCharacterPortrait(key, portrait, issues);
    }
  } else if (portraits !== undefined) {
    issues.push({ severity: "warning", message: "캐릭터 portraits는 객체 JSON이어야 합니다." });
  }
}

function validateCharacterPortrait(key: string, portrait: unknown, issues: ValidationIssue[]) {
  const path = typeof portrait === "string"
    ? portrait
    : isPlainRecord(portrait)
      ? portrait.path ?? portrait.image_path ?? portrait.imagePath
      : "";
  if (!path) {
    issues.push({ severity: "warning", message: `초상 ${key}에 path가 없습니다.` });
    return;
  }
  validateResPath(path, `초상 ${key}`, issues, false);
  validatePathExtension(path, `초상 ${key}`, imagePathExtensions, issues);
  if (!isPlainRecord(portrait)) return;
  validatePointArray(portrait.center, `초상 ${key}.center`, issues, { length: 2, min: 0, max: 1, optional: true });
  const live2dModel = portrait.live2d_model ?? portrait.live2dModel ?? portrait.model_path ?? portrait.modelPath;
  if (live2dModel !== undefined) {
    validateResPath(live2dModel, `초상 ${key}.live2d_model`, issues, false);
    validatePathExtension(live2dModel, `초상 ${key}.live2d_model`, rigPathExtensions, issues);
  }
  const generatedBy = portrait.generated_by ?? portrait.generatedBy;
  if (generatedBy !== undefined && typeof generatedBy !== "string") {
    issues.push({ severity: "warning", message: `초상 ${key}.generated_by는 문자열이어야 합니다.` });
  }
  const motionFrame = portrait.live2d_motion_frame ?? portrait.live2dMotionFrame ?? portrait.motion_frame ?? portrait.motionFrame;
  if (motionFrame !== undefined) {
    validateLive2dMotionFrame(key, motionFrame, issues);
  }
  const expressionPreset = portrait.live2d_expression_preset ?? portrait.live2dExpressionPreset ?? portrait.expression_preset ?? portrait.expressionPreset;
  if (expressionPreset !== undefined) {
    validateLive2dExpressionPreset(`초상 ${key}.live2d_expression_preset`, expressionPreset, issues);
  }
  if (portrait.profile !== undefined && !isPlainRecord(portrait.profile)) {
    issues.push({ severity: "warning", message: `초상 ${key}.profile은 객체 JSON이어야 합니다.` });
    return;
  }
  if (isPlainRecord(portrait.profile)) {
    validateNumberRange(portrait.profile.zoom, `초상 ${key}.profile.zoom`, issues, { min: 1, max: 8, optional: true });
    validateVector2(portrait.profile.offset, `초상 ${key}.profile.offset`, issues, { min: -1, max: 1, optional: true });
  }
}

function validateLive2dMotionFrame(key: string, value: unknown, issues: ValidationIssue[]) {
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `초상 ${key}.live2d_motion_frame은 객체 JSON이어야 합니다.` });
    return;
  }
  const clipId = value.clip_id ?? value.clipId;
  if (!clipId || typeof clipId !== "string") {
    issues.push({ severity: "warning", message: `초상 ${key}.live2d_motion_frame.clip_id가 필요합니다.` });
  }
  validateNumberRange(value.time, `초상 ${key}.live2d_motion_frame.time`, issues, { min: 0, max: 600, optional: true });
  validateNumberRange(value.frame_index ?? value.frameIndex, `초상 ${key}.live2d_motion_frame.frame_index`, issues, { min: 0, max: 1000000, optional: true });
  validateNumberRange(value.clip_duration ?? value.clipDuration ?? value.duration, `초상 ${key}.live2d_motion_frame.clip_duration`, issues, { min: 0, max: 600, optional: true });
  validateNumberRange(value.frame_count ?? value.frameCount, `초상 ${key}.live2d_motion_frame.frame_count`, issues, { min: 1, max: 10000, optional: true });
  const physicsSampled = value.physics_sampled ?? value.physicsSampled;
  if (physicsSampled !== undefined && typeof physicsSampled !== "boolean") {
    issues.push({ severity: "warning", message: `초상 ${key}.live2d_motion_frame.physics_sampled는 boolean이어야 합니다.` });
  }
  const poseTags = value.pose_tags ?? value.poseTags;
  if (poseTags !== undefined) validateStringArray(poseTags, `초상 ${key}.live2d_motion_frame.pose_tags`, issues);
  const poseScore = value.pose_score ?? value.poseScore;
  if (poseScore !== undefined) validateNumberMap(poseScore, `초상 ${key}.live2d_motion_frame.pose_score`, issues, { min: 0, max: 1 });
  const parameterValues = value.parameter_values ?? value.parameterValues;
  if (parameterValues !== undefined) validateNumberMap(parameterValues, `초상 ${key}.live2d_motion_frame.parameter_values`, issues, { min: -10000, max: 10000 });
}

function validateLive2dExpressionPreset(label: string, value: unknown, issues: ValidationIssue[]) {
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `${label}은 객체 JSON이어야 합니다.` });
    return;
  }
  const id = value.id ?? value.preset_id ?? value.presetId;
  if (!id || typeof id !== "string") {
    issues.push({ severity: "warning", message: `${label}.id가 필요합니다.` });
  }
  if (value.label !== undefined && typeof value.label !== "string") {
    issues.push({ severity: "warning", message: `${label}.label은 문자열이어야 합니다.` });
  }
  const autoGenerated = value.auto_generated ?? value.autoGenerated;
  if (autoGenerated !== undefined && typeof autoGenerated !== "boolean") {
    issues.push({ severity: "warning", message: `${label}.auto_generated는 boolean 값이어야 합니다.` });
  }
  const autoExpressionKind = value.auto_expression_kind ?? value.autoExpressionKind;
  if (autoExpressionKind !== undefined && typeof autoExpressionKind !== "string") {
    issues.push({ severity: "warning", message: `${label}.auto_expression_kind는 문자열이어야 합니다.` });
  }
  const poseTags = value.pose_tags ?? value.poseTags;
  if (poseTags !== undefined) validateStringArray(poseTags, `${label}.pose_tags`, issues);
  const poseScore = value.pose_score ?? value.poseScore;
  if (poseScore !== undefined) validateNumberMap(poseScore, `${label}.pose_score`, issues, { min: 0, max: 1 });
  const parameterValues = value.parameter_values ?? value.parameterValues;
  if (parameterValues !== undefined) validateNumberMap(parameterValues, `${label}.parameter_values`, issues, { min: -10000, max: 10000 });
}

function validateLive2dWebMetadata(value: unknown, issues: ValidationIssue[], portraitKeys: Set<string>) {
  if (value === undefined || value === null || value === "") return;
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: "metadata.live2d_web_model은 객체 JSON이어야 합니다." });
    return;
  }
  const motionFrameSets = value.motion_frame_sets ?? value.motionFrameSets;
  const completeMotionFrameSetClipIds = completeLive2dMotionFrameSetClipIds(motionFrameSets);
  validateNumberRange(value.portrait_count, "metadata.live2d_web_model.portrait_count", issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.motion_clip_count, "metadata.live2d_web_model.motion_clip_count", issues, { min: 0, max: 1000, optional: true });
  validateNumberRange(value.motion_frame_set_count, "metadata.live2d_web_model.motion_frame_set_count", issues, { min: 0, max: 1000, optional: true });
  validateNumberRange(value.image_part_count, "metadata.live2d_web_model.image_part_count", issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.deformer_group_count, "metadata.live2d_web_model.deformer_group_count", issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.auto_deformer_group_count, "metadata.live2d_web_model.auto_deformer_group_count", issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.deformer_parent_count, "metadata.live2d_web_model.deformer_parent_count", issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.warp_deformer_count, "metadata.live2d_web_model.warp_deformer_count", issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.visibility_gate_count, "metadata.live2d_web_model.visibility_gate_count", issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.locked_part_count, "metadata.live2d_web_model.locked_part_count", issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.hit_area_count, "metadata.live2d_web_model.hit_area_count", issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.parameter_count, "metadata.live2d_web_model.parameter_count", issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.rig_binding_count, "metadata.live2d_web_model.rig_binding_count", issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.semantic_parameter_count, "metadata.live2d_web_model.semantic_parameter_count", issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.expression_preset_count, "metadata.live2d_web_model.expression_preset_count", issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.auto_expression_preset_count, "metadata.live2d_web_model.auto_expression_preset_count", issues, { min: 0, max: 10000, optional: true });
  const sourceModelPath = value.source_model_path ?? value.sourceModelPath;
  if (sourceModelPath !== undefined) {
    validateResPath(sourceModelPath, "metadata.live2d_web_model.source_model_path", issues, false);
    validatePathExtension(sourceModelPath, "metadata.live2d_web_model.source_model_path", rigPathExtensions, issues);
  }

  if (value.portraits !== undefined) {
    if (!isPlainRecord(value.portraits)) {
      issues.push({ severity: "warning", message: "metadata.live2d_web_model.portraits는 객체 JSON이어야 합니다." });
    } else {
      for (const [state, portrait] of Object.entries(value.portraits)) {
        validateLive2dWebMetadataPortrait(state, portrait, issues);
      }
    }
  }

  if (value.clips !== undefined) {
    if (!Array.isArray(value.clips)) {
      issues.push({ severity: "warning", message: "metadata.live2d_web_model.clips는 배열이어야 합니다." });
    } else {
      value.clips.forEach((clip, index) => validateLive2dWebMetadataClip(index, clip, issues));
    }
  }
  const expressionPresets = value.expression_presets ?? value.expressionPresets;
  if (expressionPresets !== undefined) {
    if (!Array.isArray(expressionPresets)) {
      issues.push({ severity: "warning", message: "metadata.live2d_web_model.expression_presets는 배열이어야 합니다." });
    } else {
      expressionPresets.forEach((preset, index) => validateLive2dWebMetadataExpressionPreset(index, preset, issues));
    }
  }
  if (motionFrameSets !== undefined) {
    if (!Array.isArray(motionFrameSets)) {
      issues.push({ severity: "warning", message: "metadata.live2d_web_model.motion_frame_sets는 배열이어야 합니다." });
    } else {
      motionFrameSets.forEach((frameSet, index) => validateLive2dWebMetadataMotionFrameSet(index, frameSet, issues, portraitKeys));
    }
  }
  const adaptivePoseTuning = value.adaptive_pose_tuning ?? value.adaptivePoseTuning;
  if (adaptivePoseTuning !== undefined) {
    validateLive2dWebMetadataAdaptivePoseTuning(adaptivePoseTuning, issues);
  }
  const dialogueMotionSet = value.dialogue_motion_set ?? value.dialogueMotionSet;
  if (dialogueMotionSet !== undefined) {
    validateLive2dWebMetadataDialogueMotionSet(dialogueMotionSet, issues, completeMotionFrameSetClipIds);
  }
  const runtimeReadiness = value.runtime_readiness ?? value.runtimeReadiness;
  if (runtimeReadiness !== undefined) {
    validateLive2dWebMetadataRuntimeReadiness(runtimeReadiness, issues);
  }
  const hitAreas = value.hit_areas ?? value.hitAreas;
  if (hitAreas !== undefined) {
    if (!Array.isArray(hitAreas)) {
      issues.push({ severity: "warning", message: "metadata.live2d_web_model.hit_areas는 배열이어야 합니다." });
    } else {
      hitAreas.forEach((hitArea, index) => validateLive2dWebMetadataHitArea(index, hitArea, issues));
    }
  }
  const parameterRoles = value.parameter_roles ?? value.parameterRoles;
  if (parameterRoles !== undefined) {
    if (!Array.isArray(parameterRoles)) {
      issues.push({ severity: "warning", message: "metadata.live2d_web_model.parameter_roles는 배열이어야 합니다." });
    } else {
      parameterRoles.forEach((role, index) => validateLive2dWebMetadataParameterRole(index, role, issues));
    }
  }
  const parameterBindings = value.parameter_bindings ?? value.parameterBindings;
  if (parameterBindings !== undefined) {
    if (!Array.isArray(parameterBindings)) {
      issues.push({ severity: "warning", message: "metadata.live2d_web_model.parameter_bindings는 배열이어야 합니다." });
    } else {
      parameterBindings.forEach((binding, index) => validateLive2dWebMetadataParameterBinding(index, binding, issues));
    }
  }
}

function validateLive2dWebMetadataRuntimeReadiness(value: unknown, issues: ValidationIssue[]) {
  const label = "metadata.live2d_web_model.runtime_readiness";
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `${label}은 객체 JSON이어야 합니다.` });
    return;
  }
  for (const key of ["ready", "dialogue_motion_ready", "interaction_ready", "adaptive_pose_ready"]) {
    if (value[key] !== undefined && typeof value[key] !== "boolean") {
      issues.push({ severity: "warning", message: `${label}.${key}는 boolean이어야 합니다.` });
    }
  }
  validateNumberRange(value.version, `${label}.version`, issues, { min: 1, max: 100, optional: true });
  for (const key of [
    "portrait_count",
    "motion_frame_set_count",
    "complete_motion_frame_set_count",
    "exported_frame_count",
    "expected_frame_count",
    "pose_tag_count",
    "parameter_role_count",
    "semantic_parameter_count",
    "parameter_binding_count",
    "hit_area_count",
    "expression_preset_count"
  ]) {
    validateNumberRange(value[key], `${label}.${key}`, issues, { min: 0, max: 100000, optional: true });
  }
  if (value.missing !== undefined) validateStringArray(value.missing, `${label}.missing`, issues);
  const missingDialogueMotion = value.missing_dialogue_motion ?? value.missingDialogueMotion;
  if (missingDialogueMotion !== undefined) validateStringArray(missingDialogueMotion, `${label}.missing_dialogue_motion`, issues);
  const incompleteMotionFrameSets = value.incomplete_motion_frame_sets ?? value.incompleteMotionFrameSets;
  if (incompleteMotionFrameSets !== undefined) {
    if (!Array.isArray(incompleteMotionFrameSets)) {
      issues.push({ severity: "warning", message: `${label}.incomplete_motion_frame_sets는 배열이어야 합니다.` });
    } else {
      incompleteMotionFrameSets.forEach((entry, index) => validateLive2dRuntimeIncompleteMotionFrameSet(index, entry, issues));
    }
  }
}

function validateLive2dRuntimeIncompleteMotionFrameSet(index: number, value: unknown, issues: ValidationIssue[]) {
  const label = `metadata.live2d_web_model.runtime_readiness.incomplete_motion_frame_sets[${index}]`;
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `${label}는 객체 JSON이어야 합니다.` });
    return;
  }
  if (!value.clip_id || typeof value.clip_id !== "string") {
    issues.push({ severity: "warning", message: `${label}.clip_id가 필요합니다.` });
  }
  validateNumberRange(value.frame_count, `${label}.frame_count`, issues, { min: 0, max: 100000, optional: true });
  validateNumberRange(value.expected_frame_count, `${label}.expected_frame_count`, issues, { min: 0, max: 100000, optional: true });
}

function validateLive2dWebMetadataAdaptivePoseTuning(value: unknown, issues: ValidationIssue[]) {
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: "metadata.live2d_web_model.adaptive_pose_tuning은 객체 JSON이어야 합니다." });
    return;
  }
  validateNumberRange(value.intensity, "metadata.live2d_web_model.adaptive_pose_tuning.intensity", issues, { min: 0.25, max: 2, optional: true });
  validateNumberRange(value.enabled_parameter_count, "metadata.live2d_web_model.adaptive_pose_tuning.enabled_parameter_count", issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.disabled_parameter_count, "metadata.live2d_web_model.adaptive_pose_tuning.disabled_parameter_count", issues, { min: 0, max: 10000, optional: true });
  if (value.disabled_parameters !== undefined) {
    validateStringArray(value.disabled_parameters, "metadata.live2d_web_model.adaptive_pose_tuning.disabled_parameters", issues);
  }
}

function validateLive2dWebMetadataDialogueMotionSet(
  value: unknown,
  issues: ValidationIssue[],
  completeMotionFrameSetClipIds: Set<string>
) {
  const label = "metadata.live2d_web_model.dialogue_motion_set";
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `${label}은 객체 JSON이어야 합니다.` });
    return;
  }
  for (const pair of [["adaptive_clip_id", "adaptiveClipId"], ["idle_clip_id", "idleClipId"], ["talk_clip_id", "talkClipId"], ["viseme_clip_id", "visemeClipId"]]) {
    for (const key of pair) {
      if (value[key] !== undefined && typeof value[key] !== "string") {
        issues.push({ severity: "warning", message: `${label}.${pair[0]}는 문자열이어야 합니다.` });
      }
    }
  }
  const clipIds = value.clip_ids ?? value.clipIds;
  if (clipIds !== undefined) validateStringArray(clipIds, `${label}.clip_ids`, issues);
  const exportedClipIds = value.exported_clip_ids ?? value.exportedClipIds;
  if (exportedClipIds !== undefined) validateStringArray(exportedClipIds, `${label}.exported_clip_ids`, issues);
  const completeExportedClipIds = value.complete_exported_clip_ids ?? value.completeExportedClipIds;
  if (completeExportedClipIds !== undefined) validateStringArray(completeExportedClipIds, `${label}.complete_exported_clip_ids`, issues);
  const incompleteClipIds = value.incomplete_clip_ids ?? value.incompleteClipIds;
  if (incompleteClipIds !== undefined) validateStringArray(incompleteClipIds, `${label}.incomplete_clip_ids`, issues);
  const sourceClipIds = value.source_clip_ids ?? value.sourceClipIds;
  if (sourceClipIds !== undefined) validateStringArray(sourceClipIds, `${label}.source_clip_ids`, issues);
  for (const key of [
    "ready",
    "has_exported_adaptive_pose",
    "has_exported_idle_loop",
    "has_exported_talk_loop",
    "has_exported_viseme_set",
    "has_complete_adaptive_pose",
    "has_complete_idle_loop",
    "has_complete_talk_loop",
    "has_complete_viseme_set"
  ]) {
    if (value[key] !== undefined && typeof value[key] !== "boolean") {
      issues.push({ severity: "warning", message: `${label}.${key}는 boolean이어야 합니다.` });
    }
  }
  validateNumberRange(value.version, `${label}.version`, issues, { min: 1, max: 100, optional: true });
  validateNumberRange(value.motion_frame_set_count ?? value.motionFrameSetCount, `${label}.motion_frame_set_count`, issues, { min: 0, max: 1000, optional: true });
  validateNumberRange(value.exported_frame_count ?? value.exportedFrameCount, `${label}.exported_frame_count`, issues, { min: 0, max: 100000, optional: true });
  validateNumberRange(value.expected_frame_count ?? value.expectedFrameCount, `${label}.expected_frame_count`, issues, { min: 0, max: 100000, optional: true });
  validateLive2dDialogueMotionReadyConsistency(value, label, issues, completeMotionFrameSetClipIds);
}

function validateLive2dDialogueMotionReadyConsistency(
  value: ResourceRecord,
  label: string,
  issues: ValidationIssue[],
  completeMotionFrameSetClipIds: Set<string>
) {
  if (value.ready !== true) return;
  const requiredClips = [
    { label: "adaptive_clip_id", id: String(value.adaptive_clip_id ?? value.adaptiveClipId ?? "").trim(), completeFlagKeys: ["has_complete_adaptive_pose", "hasCompleteAdaptivePose"] },
    { label: "idle_clip_id", id: String(value.idle_clip_id ?? value.idleClipId ?? "").trim(), completeFlagKeys: ["has_complete_idle_loop", "hasCompleteIdleLoop"] },
    { label: "talk_clip_id", id: String(value.talk_clip_id ?? value.talkClipId ?? "").trim(), completeFlagKeys: ["has_complete_talk_loop", "hasCompleteTalkLoop"] }
  ];
  const missingRequiredIds = requiredClips.filter((entry) => !entry.id).map((entry) => entry.label);
  if (missingRequiredIds.length > 0) {
    issues.push({
      severity: "warning",
      message: `${label}.ready=true이면 필수 clip id가 필요합니다: ${missingRequiredIds.join(", ")}`
    });
  }
  const completeClipIds = new Set([
    ...stringArrayFromUnknown(value.complete_exported_clip_ids ?? value.completeExportedClipIds),
    ...completeMotionFrameSetClipIds
  ]);
  const incompleteRequiredClipIds = requiredClips
    .filter((entry) => entry.id)
    .filter((entry) => !completeClipIds.has(entry.id) && !entry.completeFlagKeys.some((key) => value[key] === true))
    .map((entry) => entry.id);
  if (incompleteRequiredClipIds.length > 0) {
    issues.push({
      severity: "warning",
      message: `${label}.ready=true이지만 완료된 dialogue motion clip이 부족합니다: ${incompleteRequiredClipIds.join(", ")}`
    });
  }
}

function validateLive2dWebMetadataPortrait(state: string, value: unknown, issues: ValidationIssue[]) {
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.portraits.${state}는 객체 JSON이어야 합니다.` });
    return;
  }
  const imagePath = value.image_path ?? value.imagePath ?? value.path;
  if (imagePath !== undefined) {
    validateResPath(imagePath, `metadata.live2d_web_model.portraits.${state}.image_path`, issues, false);
    validatePathExtension(imagePath, `metadata.live2d_web_model.portraits.${state}.image_path`, imagePathExtensions, issues);
  }
  const modelPath = value.model_path ?? value.modelPath ?? value.live2d_model ?? value.live2dModel;
  if (modelPath !== undefined) {
    validateResPath(modelPath, `metadata.live2d_web_model.portraits.${state}.model_path`, issues, false);
    validatePathExtension(modelPath, `metadata.live2d_web_model.portraits.${state}.model_path`, rigPathExtensions, issues);
  }
  const motionFrame = value.motion_frame ?? value.motionFrame ?? value.live2d_motion_frame ?? value.live2dMotionFrame;
  if (motionFrame !== undefined) {
    validateLive2dMotionFrame(`metadata.live2d_web_model.portraits.${state}`, motionFrame, issues);
  }
  const expressionPreset = value.expression_preset ?? value.expressionPreset ?? value.live2d_expression_preset ?? value.live2dExpressionPreset;
  if (expressionPreset !== undefined) {
    validateLive2dExpressionPreset(`metadata.live2d_web_model.portraits.${state}.expression_preset`, expressionPreset, issues);
  }
  validatePointArray(value.center, `metadata.live2d_web_model.portraits.${state}.center`, issues, { length: 2, min: 0, max: 1, optional: true });
  if (value.profile !== undefined) {
    if (!isPlainRecord(value.profile)) {
      issues.push({ severity: "warning", message: `metadata.live2d_web_model.portraits.${state}.profile은 객체 JSON이어야 합니다.` });
    } else {
      validateNumberRange(value.profile.zoom, `metadata.live2d_web_model.portraits.${state}.profile.zoom`, issues, { min: 1, max: 8, optional: true });
      validateVector2(value.profile.offset, `metadata.live2d_web_model.portraits.${state}.profile.offset`, issues, { min: -1, max: 1, optional: true });
    }
  }
}

function validateLive2dWebMetadataClip(index: number, value: unknown, issues: ValidationIssue[]) {
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.clips[${index}]는 객체 JSON이어야 합니다.` });
    return;
  }
  if (!value.id || typeof value.id !== "string") {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.clips[${index}].id가 필요합니다.` });
  }
  validateNumberRange(value.duration, `metadata.live2d_web_model.clips[${index}].duration`, issues, { min: 0, max: 600, optional: true });
  validateNumberRange(value.keyframe_count, `metadata.live2d_web_model.clips[${index}].keyframe_count`, issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.export_frame_count, `metadata.live2d_web_model.clips[${index}].export_frame_count`, issues, { min: 1, max: 10000, optional: true });
}

function validateLive2dWebMetadataExpressionPreset(index: number, value: unknown, issues: ValidationIssue[]) {
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.expression_presets[${index}]는 객체 JSON이어야 합니다.` });
    return;
  }
  if (!value.id || typeof value.id !== "string") {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.expression_presets[${index}].id가 필요합니다.` });
  }
  if (value.label !== undefined && typeof value.label !== "string") {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.expression_presets[${index}].label은 문자열이어야 합니다.` });
  }
  validateNumberRange(value.parameter_count, `metadata.live2d_web_model.expression_presets[${index}].parameter_count`, issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.mesh_snapshot_count, `metadata.live2d_web_model.expression_presets[${index}].mesh_snapshot_count`, issues, { min: 0, max: 10000, optional: true });
  const autoGenerated = value.auto_generated ?? value.autoGenerated;
  if (autoGenerated !== undefined && typeof autoGenerated !== "boolean") {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.expression_presets[${index}].auto_generated는 boolean 값이어야 합니다.` });
  }
  const autoExpressionKind = value.auto_expression_kind ?? value.autoExpressionKind;
  if (autoExpressionKind !== undefined && typeof autoExpressionKind !== "string") {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.expression_presets[${index}].auto_expression_kind는 문자열이어야 합니다.` });
  }
  const poseTags = value.pose_tags ?? value.poseTags;
  if (poseTags !== undefined) validateStringArray(poseTags, `metadata.live2d_web_model.expression_presets[${index}].pose_tags`, issues);
  const poseScore = value.pose_score ?? value.poseScore;
  if (poseScore !== undefined) validateNumberMap(poseScore, `metadata.live2d_web_model.expression_presets[${index}].pose_score`, issues, { min: 0, max: 1 });
  const parameterValues = value.parameter_values ?? value.parameterValues;
  if (parameterValues !== undefined) validateNumberMap(parameterValues, `metadata.live2d_web_model.expression_presets[${index}].parameter_values`, issues, { min: -10000, max: 10000 });
}

function validateLive2dWebMetadataMotionFrameSet(index: number, value: unknown, issues: ValidationIssue[], portraitKeys: Set<string>) {
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.motion_frame_sets[${index}]는 객체 JSON이어야 합니다.` });
    return;
  }
  const clipId = value.clip_id ?? value.clipId;
  if (!clipId || typeof clipId !== "string") {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.motion_frame_sets[${index}].clip_id가 필요합니다.` });
  }
  validateNumberRange(value.frame_count ?? value.frameCount, `metadata.live2d_web_model.motion_frame_sets[${index}].frame_count`, issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.expected_frame_count ?? value.expectedFrameCount, `metadata.live2d_web_model.motion_frame_sets[${index}].expected_frame_count`, issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.clip_duration ?? value.clipDuration ?? value.duration, `metadata.live2d_web_model.motion_frame_sets[${index}].clip_duration`, issues, { min: 0, max: 600, optional: true });
  const physicsSampled = value.physics_sampled ?? value.physicsSampled;
  if (physicsSampled !== undefined && typeof physicsSampled !== "boolean") {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.motion_frame_sets[${index}].physics_sampled는 boolean이어야 합니다.` });
  }
  const poseTags = value.pose_tags ?? value.poseTags;
  if (poseTags !== undefined) validateStringArray(poseTags, `metadata.live2d_web_model.motion_frame_sets[${index}].pose_tags`, issues);
  const poseScore = value.pose_score ?? value.poseScore;
  if (poseScore !== undefined) validateNumberMap(poseScore, `metadata.live2d_web_model.motion_frame_sets[${index}].pose_score`, issues, { min: 0, max: 1 });
  if (value.states !== undefined) {
    if (!Array.isArray(value.states)) {
      issues.push({ severity: "warning", message: `metadata.live2d_web_model.motion_frame_sets[${index}].states는 배열이어야 합니다.` });
    } else {
      value.states.forEach((state, stateIndex) => validateLive2dWebMetadataMotionFrameSetState(index, stateIndex, state, issues, portraitKeys));
    }
  }
}

function validateLive2dWebMetadataMotionFrameSetState(setIndex: number, stateIndex: number, value: unknown, issues: ValidationIssue[], portraitKeys: Set<string>) {
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.motion_frame_sets[${setIndex}].states[${stateIndex}]는 객체 JSON이어야 합니다.` });
    return;
  }
  const stateKey = value.state ?? value.key;
  if (!stateKey || typeof stateKey !== "string") {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.motion_frame_sets[${setIndex}].states[${stateIndex}].state가 필요합니다.` });
  }
  validateNumberRange(value.time, `metadata.live2d_web_model.motion_frame_sets[${setIndex}].states[${stateIndex}].time`, issues, { min: 0, max: 600, optional: true });
  validateNumberRange(value.frame_index ?? value.frameIndex, `metadata.live2d_web_model.motion_frame_sets[${setIndex}].states[${stateIndex}].frame_index`, issues, { min: 0, max: 1000000, optional: true });
  const poseTags = value.pose_tags ?? value.poseTags;
  if (poseTags !== undefined) validateStringArray(poseTags, `metadata.live2d_web_model.motion_frame_sets[${setIndex}].states[${stateIndex}].pose_tags`, issues);
  const poseScore = value.pose_score ?? value.poseScore;
  if (poseScore !== undefined) validateNumberMap(poseScore, `metadata.live2d_web_model.motion_frame_sets[${setIndex}].states[${stateIndex}].pose_score`, issues, { min: 0, max: 1 });
  const parameterValues = value.parameter_values ?? value.parameterValues;
  if (parameterValues !== undefined) validateNumberMap(parameterValues, `metadata.live2d_web_model.motion_frame_sets[${setIndex}].states[${stateIndex}].parameter_values`, issues, { min: -10000, max: 10000 });
  const expressionPreset = value.expression_preset ?? value.expressionPreset ?? value.live2d_expression_preset ?? value.live2dExpressionPreset;
  if (expressionPreset !== undefined) {
    validateLive2dExpressionPreset(`metadata.live2d_web_model.motion_frame_sets[${setIndex}].states[${stateIndex}].expression_preset`, expressionPreset, issues);
  }
  const imagePath = value.image_path ?? value.imagePath ?? value.path;
  if (imagePath !== undefined) {
    validateResPath(imagePath, `metadata.live2d_web_model.motion_frame_sets[${setIndex}].states[${stateIndex}].image_path`, issues, false);
    validatePathExtension(imagePath, `metadata.live2d_web_model.motion_frame_sets[${setIndex}].states[${stateIndex}].image_path`, imagePathExtensions, issues);
  }
  if (typeof stateKey === "string" && stateKey.trim() && imagePath === undefined && !portraitKeys.has(stateKey.trim())) {
    issues.push({
      severity: "warning",
      message: `metadata.live2d_web_model.motion_frame_sets[${setIndex}].states[${stateIndex}]는 portraits.${stateKey} 또는 image_path가 필요합니다.`
    });
  }
  const modelPath = value.model_path ?? value.modelPath ?? value.live2d_model ?? value.live2dModel;
  if (modelPath !== undefined) {
    validateResPath(modelPath, `metadata.live2d_web_model.motion_frame_sets[${setIndex}].states[${stateIndex}].model_path`, issues, false);
    validatePathExtension(modelPath, `metadata.live2d_web_model.motion_frame_sets[${setIndex}].states[${stateIndex}].model_path`, rigPathExtensions, issues);
  }
  validatePointArray(value.center, `metadata.live2d_web_model.motion_frame_sets[${setIndex}].states[${stateIndex}].center`, issues, { length: 2, min: 0, max: 1, optional: true });
  if (value.profile !== undefined) {
    if (!isPlainRecord(value.profile)) {
      issues.push({ severity: "warning", message: `metadata.live2d_web_model.motion_frame_sets[${setIndex}].states[${stateIndex}].profile은 객체 JSON이어야 합니다.` });
    } else {
      validateNumberRange(value.profile.zoom, `metadata.live2d_web_model.motion_frame_sets[${setIndex}].states[${stateIndex}].profile.zoom`, issues, { min: 1, max: 8, optional: true });
      validateVector2(value.profile.offset, `metadata.live2d_web_model.motion_frame_sets[${setIndex}].states[${stateIndex}].profile.offset`, issues, { min: -1, max: 1, optional: true });
    }
  }
}

function validateLive2dWebMetadataHitArea(index: number, value: unknown, issues: ValidationIssue[]) {
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.hit_areas[${index}]는 객체 JSON이어야 합니다.` });
    return;
  }
  if (!value.id || typeof value.id !== "string") {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.hit_areas[${index}].id가 필요합니다.` });
  }
  const partId = value.part_id ?? value.partId;
  if (partId !== undefined && typeof partId !== "string") {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.hit_areas[${index}].part_id는 문자열이어야 합니다.` });
  }
  const bounds = value.bounds ?? value.rect;
  if (bounds !== undefined) {
    validateHitAreaBounds(bounds, `metadata.live2d_web_model.hit_areas[${index}].bounds`, issues, false);
  }
  const normalizedBounds = value.normalized_bounds ?? value.normalizedBounds ?? value.normalized_rect ?? value.normalizedRect;
  if (normalizedBounds !== undefined) {
    validateHitAreaBounds(normalizedBounds, `metadata.live2d_web_model.hit_areas[${index}].normalized_bounds`, issues, true);
  }
  const points = value.points ?? value.polygon;
  if (points !== undefined) {
    validateHitAreaPoints(points, `metadata.live2d_web_model.hit_areas[${index}].points`, issues, false);
  }
  const normalizedPoints = value.normalized_points ?? value.normalizedPoints ?? value.normalized_polygon ?? value.normalizedPolygon;
  if (normalizedPoints !== undefined) {
    validateHitAreaPoints(normalizedPoints, `metadata.live2d_web_model.hit_areas[${index}].normalized_points`, issues, true);
  }
}

function validateHitAreaBounds(value: unknown, label: string, issues: ValidationIssue[], normalized: boolean) {
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `${label}는 객체 JSON이어야 합니다.` });
    return;
  }
  const limit = normalized ? 4 : 10000;
  validateNumberRange(value.x, `${label}.x`, issues, { min: -limit, max: limit, optional: false });
  validateNumberRange(value.y, `${label}.y`, issues, { min: -limit, max: limit, optional: false });
  validateNumberRange(value.width, `${label}.width`, issues, { min: 0, max: limit, optional: false });
  validateNumberRange(value.height, `${label}.height`, issues, { min: 0, max: limit, optional: false });
}

function validateHitAreaPoints(value: unknown, label: string, issues: ValidationIssue[], normalized: boolean) {
  if (!Array.isArray(value)) {
    issues.push({ severity: "warning", message: `${label}는 배열이어야 합니다.` });
    return;
  }
  const limit = normalized ? 4 : 10000;
  value.forEach((point, pointIndex) => {
    if (Array.isArray(point)) {
      validateNumberRange(point[0], `${label}[${pointIndex}].x`, issues, { min: -limit, max: limit, optional: false });
      validateNumberRange(point[1], `${label}[${pointIndex}].y`, issues, { min: -limit, max: limit, optional: false });
      return;
    }
    if (!isPlainRecord(point)) {
      issues.push({ severity: "warning", message: `${label}[${pointIndex}]는 객체 JSON이어야 합니다.` });
      return;
    }
    validateNumberRange(point.x, `${label}[${pointIndex}].x`, issues, { min: -limit, max: limit, optional: false });
    validateNumberRange(point.y, `${label}[${pointIndex}].y`, issues, { min: -limit, max: limit, optional: false });
  });
}

function validateLive2dWebMetadataParameterRole(index: number, value: unknown, issues: ValidationIssue[]) {
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.parameter_roles[${index}]는 객체 JSON이어야 합니다.` });
    return;
  }
  if (!value.parameter || typeof value.parameter !== "string") {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.parameter_roles[${index}].parameter가 필요합니다.` });
  }
  if (value.label !== undefined && typeof value.label !== "string") {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.parameter_roles[${index}].label은 문자열이어야 합니다.` });
  }
  if (value.role !== undefined && typeof value.role !== "string") {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.parameter_roles[${index}].role은 문자열이어야 합니다.` });
  }
}

function validateLive2dWebMetadataParameterBinding(index: number, value: unknown, issues: ValidationIssue[]) {
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.parameter_bindings[${index}]는 객체 JSON이어야 합니다.` });
    return;
  }
  if (!value.parameter || typeof value.parameter !== "string") {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.parameter_bindings[${index}].parameter가 필요합니다.` });
  }
  if (value.label !== undefined && typeof value.label !== "string") {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.parameter_bindings[${index}].label은 문자열이어야 합니다.` });
  }
  if (value.role !== undefined && typeof value.role !== "string") {
    issues.push({ severity: "warning", message: `metadata.live2d_web_model.parameter_bindings[${index}].role은 문자열이어야 합니다.` });
  }
  validateNumberRange(value.direct_binding_count, `metadata.live2d_web_model.parameter_bindings[${index}].direct_binding_count`, issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.visibility_gate_count, `metadata.live2d_web_model.parameter_bindings[${index}].visibility_gate_count`, issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.transform_key_count, `metadata.live2d_web_model.parameter_bindings[${index}].transform_key_count`, issues, { min: 0, max: 1000000, optional: true });
  validateNumberRange(value.draw_order_key_count, `metadata.live2d_web_model.parameter_bindings[${index}].draw_order_key_count`, issues, { min: 0, max: 1000000, optional: true });
  validateNumberRange(value.deformer_group_count, `metadata.live2d_web_model.parameter_bindings[${index}].deformer_group_count`, issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.warp_deformer_count, `metadata.live2d_web_model.parameter_bindings[${index}].warp_deformer_count`, issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.warp_key_count, `metadata.live2d_web_model.parameter_bindings[${index}].warp_key_count`, issues, { min: 0, max: 1000000, optional: true });
  validateNumberRange(value.mesh_deformer_count, `metadata.live2d_web_model.parameter_bindings[${index}].mesh_deformer_count`, issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.mesh_key_count, `metadata.live2d_web_model.parameter_bindings[${index}].mesh_key_count`, issues, { min: 0, max: 1000000, optional: true });
  validateNumberRange(value.physics_rule_count, `metadata.live2d_web_model.parameter_bindings[${index}].physics_rule_count`, issues, { min: 0, max: 10000, optional: true });
  validateNumberRange(value.motion_key_count, `metadata.live2d_web_model.parameter_bindings[${index}].motion_key_count`, issues, { min: 0, max: 1000000, optional: true });
  if (value.channels !== undefined) validateStringArray(value.channels, `metadata.live2d_web_model.parameter_bindings[${index}].channels`, issues);
  const motionClipIds = value.motion_clip_ids ?? value.motionClipIds;
  if (motionClipIds !== undefined) validateStringArray(motionClipIds, `metadata.live2d_web_model.parameter_bindings[${index}].motion_clip_ids`, issues);
  const affectedParts = value.affected_parts ?? value.affectedParts;
  if (affectedParts !== undefined) {
    if (!Array.isArray(affectedParts)) {
      issues.push({ severity: "warning", message: `metadata.live2d_web_model.parameter_bindings[${index}].affected_parts는 배열이어야 합니다.` });
    } else {
      affectedParts.forEach((part, partIndex) => {
        if (!isPlainRecord(part)) {
          issues.push({ severity: "warning", message: `metadata.live2d_web_model.parameter_bindings[${index}].affected_parts[${partIndex}]는 객체 JSON이어야 합니다.` });
          return;
        }
        const partId = part.part_id ?? part.partId;
        if (!partId || typeof partId !== "string") {
          issues.push({ severity: "warning", message: `metadata.live2d_web_model.parameter_bindings[${index}].affected_parts[${partIndex}].part_id가 필요합니다.` });
        }
        if (part.label !== undefined && typeof part.label !== "string") {
          issues.push({ severity: "warning", message: `metadata.live2d_web_model.parameter_bindings[${index}].affected_parts[${partIndex}].label은 문자열이어야 합니다.` });
        }
        if (part.channels !== undefined) validateStringArray(part.channels, `metadata.live2d_web_model.parameter_bindings[${index}].affected_parts[${partIndex}].channels`, issues);
      });
    }
  }
}

function validateStringArray(value: unknown, label: string, issues: ValidationIssue[]) {
  if (!Array.isArray(value)) {
    issues.push({ severity: "warning", message: `${label}는 배열이어야 합니다.` });
    return;
  }
  value.forEach((entry, index) => {
    if (typeof entry !== "string") {
      issues.push({ severity: "warning", message: `${label}[${index}]는 문자열이어야 합니다.` });
    }
  });
}

function completeLive2dMotionFrameSetClipIds(value: unknown) {
  const clipIds = new Set<string>();
  if (!Array.isArray(value)) return clipIds;
  for (const rawFrameSet of value) {
    if (!isPlainRecord(rawFrameSet)) continue;
    const clipId = String(rawFrameSet.clip_id ?? rawFrameSet.clipId ?? "").trim();
    if (!clipId) continue;
    const states = Array.isArray(rawFrameSet.states) ? rawFrameSet.states : [];
    const frameCount = positiveInteger(rawFrameSet.frame_count ?? rawFrameSet.frameCount) || states.length;
    const expectedFrameCount = positiveInteger(rawFrameSet.expected_frame_count ?? rawFrameSet.expectedFrameCount)
      || positiveInteger(rawFrameSet.frame_count ?? rawFrameSet.frameCount)
      || states.length;
    if (frameCount > 0 && frameCount >= expectedFrameCount) clipIds.add(clipId);
  }
  return clipIds;
}

function stringArrayFromUnknown(value: unknown) {
  return Array.isArray(value)
    ? value.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
}

function positiveInteger(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.round(numberValue) : 0;
}

function validateNumberMap(
  value: unknown,
  label: string,
  issues: ValidationIssue[],
  { min, max }: { min: number; max: number }
) {
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `${label}는 객체 JSON이어야 합니다.` });
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    validateNumberRange(entry, `${label}.${key}`, issues, { min, max, optional: false });
  }
}

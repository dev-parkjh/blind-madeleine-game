import type { PointerPoint } from "../../editorTypes";
import { normalizePortraitRigPoseScore, normalizePortraitRigPoseTags } from "../../lib/portraitRigPoseTags";
import { normalizeBooleanFlag, round4Number } from "../../lib/numeric";
import { normalizeJsonObject } from "../../lib/records";
import type { ResourceRecord } from "../../types";
import { getResourceChapterScopeIds } from "../resources/resourceScope";
import { mergePortraitRigPortraitExports } from "./portraitRigPortraitSync";
import {
  getPortraitCenterPoint,
  getProfileOffset,
  getProfileZoom,
  getSpectrumOffset,
  isDefaultPortraitCenterPoint,
  profileZoomDefault
} from "./portraitModel";

export function normalizeCharacterDraftForSave(character: ResourceRecord): ResourceRecord {
  const chapters = getResourceChapterScopeIds(character);
  const metadata = normalizeJsonObject(character.metadata);
  const normalizedPortraits = normalizeCharacterPortraitsForSave(character.portraits);
  const portraits = normalizeCharacterPortraitsForSave(
    mergePortraitRigPortraitExports(normalizedPortraits, {}, metadata, { pruneStale: false }).portraits
  );
  const next: ResourceRecord = {
    ...character,
    display_name: String(character.display_name || character.id || "").trim(),
    description: String(character.description || ""),
    name_color: String(character.name_color || "#ffffff").trim() || "#ffffff",
    protagonist: normalizeBooleanFlag(character.protagonist ?? character.is_protagonist ?? character.main_character),
    portraits,
    metadata
  };
  delete next["live" + "2d"];
  delete next.is_protagonist;
  delete next.main_character;
  if (chapters.length > 0) next.chapters = chapters;
  else delete next.chapters;
  delete next.chapter_ids;
  const spectrumOffset = getSpectrumOffset(character.spectrum_offset);
  if (Math.abs(spectrumOffset.x) >= 0.0001 || Math.abs(spectrumOffset.y) >= 0.0001) {
    next.spectrum_offset = [round4Number(spectrumOffset.x), round4Number(spectrumOffset.y)];
  } else {
    delete next.spectrum_offset;
  }
  return next;
}

function normalizeCharacterPortraitsForSave(value: unknown) {
  const portraits = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, ResourceRecord | string>
    : {};
  const next: Record<string, ResourceRecord | string> = {};
  for (const [key, portrait] of Object.entries(portraits)) {
    const cleanKey = String(key || "").trim();
    if (!cleanKey) continue;
    const normalized = normalizeCharacterPortraitForSave(portrait);
    if (normalized !== null) next[cleanKey] = normalized;
  }
  return next;
}

function normalizeCharacterPortraitForSave(value: ResourceRecord | string) {
  if (typeof value === "string") return value.trim() || null;
  if (!value || typeof value !== "object") return null;
  const path = String(value.path ?? value.image_path ?? value.imagePath ?? "").trim();
  if (!path) return null;
  const center = getPortraitCenterPoint(value.center);
  const profile = normalizePortraitProfileForSave(value.profile, center);
  const next: ResourceRecord = { path };
  if (!isDefaultPortraitCenterPoint(center)) next.center = [round4Number(center.x), round4Number(center.y)];
  if (profile !== null) next.profile = profile;
  const portraitRigModel = String(value.portrait_rig_model ?? value.portraitRigModel ?? value.model_path ?? value.modelPath ?? "").trim();
  const generatedBy = String(value.generated_by ?? value.generatedBy ?? "").trim();
  const motionFrame = normalizePortraitRigMotionFrameForSave(
    value.portrait_rig_motion_frame ?? value.portraitRigMotionFrame ?? value.motion_frame ?? value.motionFrame
  );
  const expressionPreset = normalizePortraitRigExpressionPresetForSave(
    value.portrait_rig_expression_preset ?? value.portraitRigExpressionPreset ?? value.expression_preset ?? value.expressionPreset
  );
  if (portraitRigModel) next.portrait_rig_model = portraitRigModel;
  if (generatedBy) next.generated_by = generatedBy;
  if (motionFrame) next.portrait_rig_motion_frame = motionFrame;
  if (expressionPreset) next.portrait_rig_expression_preset = expressionPreset;
  if (Object.keys(next).length === 1) return path;
  return next;
}

function normalizePortraitRigMotionFrameForSave(value: unknown) {
  const source = normalizeJsonObject(value);
  const clipId = String(source.clip_id || source.clipId || "").trim();
  if (!clipId) return null;
  const next: ResourceRecord = {
    clip_id: clipId
  };
  const clipLabel = String(source.clip_label || source.clipLabel || source.label || "").trim();
  if (clipLabel) next.clip_label = clipLabel;
  const time = Number(source.time);
  if (Number.isFinite(time)) next.time = round4Number(Math.max(0, time));
  const frameIndex = Number(source.frame_index ?? source.frameIndex);
  if (Number.isFinite(frameIndex)) next.frame_index = Math.max(0, Math.round(frameIndex));
  const frameCount = Number(source.frame_count ?? source.frameCount);
  if (Number.isFinite(frameCount) && frameCount > 0) next.frame_count = Math.max(1, Math.round(frameCount));
  const clipDuration = Number(source.clip_duration ?? source.clipDuration ?? source.duration);
  if (Number.isFinite(clipDuration) && clipDuration > 0) next.clip_duration = round4Number(clipDuration);
  if (source.physics_sampled !== undefined || source.physicsSampled !== undefined) {
    next.physics_sampled = normalizeBooleanFlag(source.physics_sampled ?? source.physicsSampled);
  }
  const poseTags = normalizePortraitRigPoseTags(source.pose_tags ?? source.poseTags, 64);
  if (poseTags.length > 0) next.pose_tags = poseTags;
  const poseScore = normalizePortraitRigPoseScore(source.pose_score ?? source.poseScore, 64);
  if (Object.keys(poseScore).length > 0) next.pose_score = poseScore;
  const parameterValues = normalizePortraitRigNumberMapForSave(source.parameter_values ?? source.parameterValues, -10000, 10000, 128);
  if (Object.keys(parameterValues).length > 0) next.parameter_values = parameterValues;
  return next;
}

function normalizePortraitRigExpressionPresetForSave(value: unknown) {
  const source = normalizeJsonObject(value);
  const id = String(source.id || source.preset_id || source.presetId || "").trim();
  if (!id) return null;
  const next: ResourceRecord = { id };
  const label = String(source.label || source.name || "").trim();
  if (label) next.label = label;
  if (source.auto_generated !== undefined || source.autoGenerated !== undefined) {
    next.auto_generated = normalizeBooleanFlag(source.auto_generated ?? source.autoGenerated);
  }
  const kind = String(source.auto_expression_kind || source.autoExpressionKind || "").trim();
  if (kind) next.auto_expression_kind = kind;
  const poseTags = normalizePortraitRigPoseTags(source.pose_tags ?? source.poseTags, 64);
  if (poseTags.length > 0) next.pose_tags = poseTags;
  const poseScore = normalizePortraitRigPoseScore(source.pose_score ?? source.poseScore, 64);
  if (Object.keys(poseScore).length > 0) next.pose_score = poseScore;
  const parameterValues = normalizePortraitRigNumberMapForSave(source.parameter_values ?? source.parameterValues, -10000, 10000, 128);
  if (Object.keys(parameterValues).length > 0) next.parameter_values = parameterValues;
  return next;
}

function normalizePortraitRigNumberMapForSave(value: unknown, min: number, max: number, limit: number) {
  const source = normalizeJsonObject(value);
  const next: ResourceRecord = {};
  for (const [rawKey, rawValue] of Object.entries(source)) {
    if (Object.keys(next).length >= limit) break;
    const key = String(rawKey || "").trim();
    const numberValue = Number(rawValue);
    if (!key || !Number.isFinite(numberValue)) continue;
    next[key] = round4Number(Math.min(max, Math.max(min, numberValue)));
  }
  return next;
}

function normalizePortraitProfileForSave(value: unknown, _fallbackCenter: PointerPoint) {
  const profile = value && typeof value === "object" ? value as ResourceRecord : {};
  const zoom = getProfileZoom(profile.zoom);
  const offset = getProfileOffset(profile);
  const next: ResourceRecord = {};
  if (Math.abs(zoom - profileZoomDefault) >= 0.001) next.zoom = zoom;
  if (Math.abs(offset.x) >= 0.0001 || Math.abs(offset.y) >= 0.0001) {
    next.offset = [round4Number(offset.x), round4Number(offset.y)];
  }
  return Object.keys(next).length > 0 ? next : null;
}

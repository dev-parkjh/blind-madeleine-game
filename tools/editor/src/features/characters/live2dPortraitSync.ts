import type { ResourceRecord } from "../../types";

export type PortraitValue = ResourceRecord | string;

export function mergeLive2dPortraitExports(
  currentPortraits: Record<string, PortraitValue>,
  remotePortraitsValue: unknown,
  remoteMetadataValue?: unknown,
  options: { pruneStale?: boolean } = {}
) {
  const remotePortraits = remotePortraitsValue && typeof remotePortraitsValue === "object" && !Array.isArray(remotePortraitsValue)
    ? remotePortraitsValue as Record<string, PortraitValue>
    : {};
  const next = { ...currentPortraits };
  let count = 0;
  let removedCount = 0;
  const explicitGeneratedKeys = new Set<string>();
  const authoritativeGeneratedKeys = new Set<string>();
  for (const [key, remotePortrait] of Object.entries(remotePortraits)) {
    if (!isLive2dGeneratedPortrait(remotePortrait)) continue;
    explicitGeneratedKeys.add(key);
    authoritativeGeneratedKeys.add(key);
    if (recordsEqual(next[key], remotePortrait)) continue;
    next[key] = remotePortrait;
    count += 1;
  }
  const metadataPortraits = live2dMetadataPortraitExports(remoteMetadataValue);
  for (const [key, remotePortrait] of Object.entries(metadataPortraits)) {
    authoritativeGeneratedKeys.add(key);
    if (explicitGeneratedKeys.has(key)) continue;
    if (next[key] !== undefined && !isLive2dGeneratedPortrait(next[key])) continue;
    if (recordsEqual(next[key], remotePortrait)) continue;
    next[key] = remotePortrait;
    count += 1;
  }
  if (options.pruneStale !== false && authoritativeGeneratedKeys.size > 0) {
    for (const [key, portrait] of Object.entries(next)) {
      if (authoritativeGeneratedKeys.has(key)) continue;
      if (!isLive2dGeneratedPortrait(portrait)) continue;
      delete next[key];
      removedCount += 1;
    }
  }
  return { portraits: next, count, removedCount };
}

export function getLive2dSyncChange(currentDraft: ResourceRecord, remoteDraft: ResourceRecord | undefined) {
  const currentPortraits = currentDraft.portraits && typeof currentDraft.portraits === "object" && !Array.isArray(currentDraft.portraits)
    ? currentDraft.portraits as Record<string, PortraitValue>
    : {};
  const portraitMerge = mergeLive2dPortraitExports(currentPortraits, remoteDraft?.portraits, remoteDraft?.metadata);
  return {
    portraitCount: portraitMerge.count,
    removedPortraitCount: portraitMerge.removedCount,
    metadataChanged: Boolean(mergeLive2dMetadata(currentDraft.metadata, remoteDraft?.metadata))
  };
}

export function live2dMetadataPortraitExports(remoteMetadataValue: unknown) {
  const live2d = live2dMetadataFromMetadata(remoteMetadataValue) ?? {};
  const portraits: Record<string, PortraitValue> = {};
  const metadataPortraits = plainRecord(live2d.portraits);
  for (const [key, rawPortrait] of Object.entries(metadataPortraits)) {
    const portrait = portraitFromLive2dMetadataRecord(rawPortrait);
    if (portrait) portraits[key] = portrait;
  }

  const frameSets = [
    ...(Array.isArray(live2d.motion_frame_sets) ? live2d.motion_frame_sets : []),
    ...(Array.isArray(live2d.motionFrameSets) ? live2d.motionFrameSets : [])
  ];
  for (const rawFrameSet of frameSets) {
    const frameSet = plainRecord(rawFrameSet);
    const clipId = String(frameSet.clip_id ?? frameSet.clipId ?? "").trim();
    if (!clipId) continue;
    const states = Array.isArray(frameSet.states) ? frameSet.states : [];
    for (const rawState of states) {
      const state = plainRecord(rawState);
      const key = String(state.state ?? state.key ?? "").trim();
      if (!key || portraits[key]) continue;
      const motionFrame = motionFrameFromRecord(state) || {
        clip_id: clipId,
        clip_label: String(frameSet.clip_label ?? frameSet.clipLabel ?? frameSet.label ?? clipId).trim() || clipId,
        time: Number(state.time) || 0,
        frame_index: Number(state.frame_index ?? state.frameIndex ?? 0) || 0,
        frame_count: Number(frameSet.frame_count ?? frameSet.frameCount ?? frameSet.expected_frame_count ?? frameSet.expectedFrameCount ?? states.length) || states.length,
        clip_duration: Number(frameSet.clip_duration ?? frameSet.clipDuration ?? frameSet.duration ?? 0) || 0,
        physics_sampled: Boolean(frameSet.physics_sampled ?? frameSet.physicsSampled),
        ...(Array.isArray(state.pose_tags ?? state.poseTags) ? { pose_tags: state.pose_tags ?? state.poseTags } : {}),
        ...(plainRecord(state.pose_score ?? state.poseScore) ? { pose_score: plainRecord(state.pose_score ?? state.poseScore) } : {}),
        ...(plainRecord(state.parameter_values ?? state.parameterValues) ? { parameter_values: plainRecord(state.parameter_values ?? state.parameterValues) } : {})
      };
      const portrait = portraitFromLive2dMetadataRecord({
        image_path: state.image_path ?? state.imagePath ?? state.path,
        model_path: state.model_path ?? state.modelPath ?? state.live2d_model ?? state.live2dModel,
        center: state.center,
        profile: state.profile,
        motion_frame: motionFrame,
        expression_preset: state.expression_preset ?? state.expressionPreset ?? state.live2d_expression_preset ?? state.live2dExpressionPreset
      });
      if (portrait) portraits[key] = portrait;
    }
  }
  return portraits;
}

export function mergeLive2dMetadata(currentMetadataValue: unknown, remoteMetadataValue: unknown) {
  const remoteLive2d = live2dMetadataFromMetadata(remoteMetadataValue);
  if (!remoteLive2d) return null;

  const currentMetadata = currentMetadataValue && typeof currentMetadataValue === "object" && !Array.isArray(currentMetadataValue)
    ? currentMetadataValue as ResourceRecord
    : {};
  if (recordsEqual(currentMetadata.live2d_web_model, remoteLive2d) && !("live2dWebModel" in currentMetadata)) return null;
  const nextMetadata = { ...currentMetadata };
  delete nextMetadata.live2dWebModel;
  nextMetadata.live2d_web_model = remoteLive2d;
  return nextMetadata;
}

export function isLive2dGeneratedPortrait(portrait: PortraitValue) {
  if (!portrait || typeof portrait !== "object" || Array.isArray(portrait)) return false;
  if (String(portrait.generated_by || "") === "tools/live2d-editor") return true;
  if (String(portrait.live2d_model ?? portrait.live2dModel ?? "").trim()) return true;
  const motionFrame = portrait.live2d_motion_frame ?? portrait.live2dMotionFrame ?? portrait.motion_frame ?? portrait.motionFrame;
  return Boolean(motionFrame && typeof motionFrame === "object" && !Array.isArray(motionFrame));
}

function portraitFromLive2dMetadataRecord(rawPortrait: unknown): PortraitValue | null {
  const source = plainRecord(rawPortrait);
  const path = String(source.image_path ?? source.imagePath ?? source.path ?? "").trim();
  if (!path) return null;
  const portrait: ResourceRecord = {
    path,
    generated_by: "tools/live2d-editor"
  };
  const modelPath = String(source.model_path ?? source.modelPath ?? source.live2d_model ?? source.live2dModel ?? "").trim();
  if (modelPath) portrait.live2d_model = modelPath;
  if (Array.isArray(source.center) && source.center.length >= 2) portrait.center = source.center;
  const profile = plainRecord(source.profile);
  if (Object.keys(profile).length > 0) portrait.profile = profile;
  const motionFrame = motionFrameFromRecord(source);
  if (motionFrame) portrait.live2d_motion_frame = motionFrame;
  const expressionPreset = expressionPresetFromRecord(source);
  if (expressionPreset) portrait.live2d_expression_preset = expressionPreset;
  return portrait;
}

function motionFrameFromRecord(source: ResourceRecord) {
  const frame = source.live2d_motion_frame ?? source.live2dMotionFrame ?? source.motion_frame ?? source.motionFrame;
  if (!frame || typeof frame !== "object" || Array.isArray(frame)) return null;
  return frame as ResourceRecord;
}

function expressionPresetFromRecord(source: ResourceRecord) {
  const preset = source.live2d_expression_preset ?? source.live2dExpressionPreset ?? source.expression_preset ?? source.expressionPreset;
  if (!preset || typeof preset !== "object" || Array.isArray(preset)) return null;
  return preset as ResourceRecord;
}

function live2dMetadataFromMetadata(metadataValue: unknown) {
  const metadata = plainRecord(metadataValue);
  const live2d = metadata.live2d_web_model ?? metadata.live2dWebModel;
  return live2d && typeof live2d === "object" && !Array.isArray(live2d) ? live2d as ResourceRecord : null;
}

function plainRecord(value: unknown): ResourceRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ResourceRecord : {};
}

export function recordsEqual(left: unknown, right: unknown) {
  return canonicalJson(left) === canonicalJson(right);
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalValue(value));
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as ResourceRecord)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalValue(entry)])
  );
}

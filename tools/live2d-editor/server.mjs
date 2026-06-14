import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(projectRoot, "..", "..");
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 5187);
const maxBodyBytes = Math.max(40, Number(process.env.LIVE2D_MAX_BODY_MB || 160)) * 1024 * 1024;
const godotPreviewBridgeTarget = (process.env.GODOT_PREVIEW_ENDPOINT || process.env.GODOT_PREVIEW_BRIDGE_ENDPOINT || "http://127.0.0.1:51234").replace(/\/+$/, "");
const godotImportAuto = readBooleanEnv(process.env.LIVE2D_GODOT_IMPORT_AUTO, true);

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"]
]);

const idPattern = /^[a-zA-Z0-9_-]+$/;
const parameterRoleValues = new Set([
  "generic",
  "gaze_x",
  "gaze_y",
  "tilt",
  "eye_open",
  "mouth_open",
  "smile",
  "brow",
  "hair",
  "breath",
  "body",
  "prop"
]);
const builtInParameterRoles = new Map([
  ["angleX", "gaze_x"],
  ["angleY", "gaze_y"],
  ["angleZ", "tilt"],
  ["eyeOpen", "eye_open"],
  ["mouthOpen", "mouth_open"],
  ["smile", "smile"],
  ["brow", "brow"],
  ["hairSway", "hair"],
  ["breath", "breath"]
]);

function readBooleanEnv(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return !["0", "false", "no", "off"].includes(String(value).trim().toLowerCase());
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(body, null, 2));
}

function sendError(response, error) {
  sendJson(response, error.statusCode || 500, {
    error: {
      message: error.statusCode ? error.message : "Internal server error",
      detail: error.statusCode ? undefined : error.message
    }
  });
}

function makeHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertSafeId(value, label = "id") {
  const id = String(value || "").trim();
  if (!idPattern.test(id)) {
    throw makeHttpError(400, `${label} can only contain letters, numbers, underscores, and hyphens.`);
  }
  return id;
}

function safeSegment(value, fallback = "asset") {
  const clean = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return clean || fallback;
}

function normalizeParameterRole(value) {
  const key = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!key) return "";
  const aliases = {
    angle_x: "gaze_x",
    look_x: "gaze_x",
    turn_x: "gaze_x",
    angle_y: "gaze_y",
    look_y: "gaze_y",
    angle_z: "tilt",
    roll: "tilt",
    eye: "eye_open",
    blink: "eye_open",
    mouth: "mouth_open",
    lip: "mouth_open",
    emotion: "smile",
    expression: "smile",
    eyebrow: "brow",
    sway: "hair",
    breathing: "breath",
    accessory: "prop",
    visibility: "prop",
    none: "generic"
  };
  const normalized = aliases[key] || key;
  return parameterRoleValues.has(normalized) ? normalized : "";
}

function inferParameterRoleFromText(value) {
  const text = String(value || "").toLowerCase().replace(/[^a-z0-9가-힣]+/g, " ");
  if (/\b(angle|look|gaze|turn|head|face|body)\s*x\b|\bx\s*(angle|look|gaze|turn)\b|좌우|왼쪽|오른쪽/.test(text)) return "gaze_x";
  if (/\b(angle|look|gaze|head|face|body)\s*y\b|\by\s*(angle|look|gaze)\b|상하|위|아래/.test(text)) return "gaze_y";
  if (/\b(angle|tilt|roll)\s*z\b|\bz\s*(angle|tilt|roll)\b|기울|회전/.test(text)) return "tilt";
  if (/eye|blink|lid|iris|pupil|눈|깜빡|동공/.test(text)) return "eye_open";
  if (/mouth|lip|jaw|talk|speak|phoneme|입|말|립싱크/.test(text)) return "mouth_open";
  if (/smile|happy|sad|laugh|frown|emotion|기쁨|웃|슬픔|감정/.test(text)) return "smile";
  if (/brow|eyebrow|angry|serious|worried|눈썹|화남|걱정/.test(text)) return "brow";
  if (/hair|bang|sway|strand|머리|헤어|흔들/.test(text)) return "hair";
  if (/breath|breathe|chest|숨|호흡/.test(text)) return "breath";
  if (/body|torso|shoulder|arm|hand|몸|상체|어깨|팔|손/.test(text)) return "body";
  if (/prop|item|accessory|weapon|tail|wing|소품|아이템|장식/.test(text)) return "prop";
  return "generic";
}

function resolveRepoPath(...segments) {
  const resolved = path.resolve(repoRoot, ...segments);
  if (resolved !== repoRoot && !resolved.startsWith(`${repoRoot}${path.sep}`)) {
    throw makeHttpError(400, "Resolved path is outside the repository.");
  }
  return resolved;
}

function characterFile(id) {
  return resolveRepoPath("data", "characters", `${assertSafeId(id, "character id")}.json`);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJsonAtomic(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  await writeFile(tmpPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(tmpPath, filePath);
}

function titleFromCharacter(data, id) {
  return data?.display_name || data?.name || data?.label || id;
}

function summarizeCharacter(id, data) {
  const portraits = data?.portraits && typeof data.portraits === "object" && !Array.isArray(data.portraits)
    ? data.portraits
    : {};
  const metadata = data?.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
    ? data.metadata
    : {};
  const live2dMetadata = live2dMetadataFromMetadata(metadata);
  return {
    id,
    title: titleFromCharacter(data, id),
    nameColor: String(data?.name_color || "").trim() || "#ffffff",
    portraitKeys: Object.keys(portraits),
    hasWebRig: Boolean(live2dMetadata)
  };
}

function live2dMetadataFromMetadata(metadata) {
  const source = metadata?.live2d_web_model ?? metadata?.live2dWebModel;
  return source && typeof source === "object" && !Array.isArray(source) ? source : null;
}

async function listCharacters() {
  const dir = resolveRepoPath("data", "characters");
  const entries = await readdir(dir, { withFileTypes: true }).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
  const characters = await Promise.all(files.map(async (name) => {
    const id = path.basename(name, ".json");
    const data = await readJson(path.join(dir, name));
    return summarizeCharacter(id, data);
  }));
  return characters;
}

async function loadCharacter(id) {
  const filePath = characterFile(id);
  try {
    return await readJson(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw makeHttpError(404, `Character not found: ${id}`);
    }
    throw error;
  }
}

async function createCharacter(body) {
  const id = assertSafeId(body.id || randomUUID(), "character id");
  const filePath = characterFile(id);
  const data = {
    id,
    display_name: String(body.display_name || body.name || "New Character"),
    description: "",
    name_color: String(body.name_color || "#8FD8B8"),
    portraits: {},
    metadata: {}
  };
  try {
    await stat(filePath);
    throw makeHttpError(409, `Character already exists: ${id}`);
  } catch (error) {
    if (error.statusCode) throw error;
    if (error.code !== "ENOENT") throw error;
  }
  await writeJsonAtomic(filePath, data);
  return { summary: summarizeCharacter(id, data), data };
}

function decodePngDataUrl(value) {
  const match = String(value || "").match(/^data:image\/png;base64,([a-zA-Z0-9+/=\s]+)$/);
  if (!match) throw makeHttpError(400, "imageDataUrl must be a PNG data URL.");
  const buffer = Buffer.from(match[1].replace(/\s+/g, ""), "base64");
  if (buffer.byteLength === 0) throw makeHttpError(400, "Decoded image is empty.");
  return buffer;
}

function decodeImageDataUrl(value) {
  const match = String(value || "").match(/^data:image\/(png|jpeg|webp);base64,([a-zA-Z0-9+/=\s]+)$/);
  if (!match) throw makeHttpError(400, "dataUrl must be a PNG, JPEG, or WebP data URL.");
  const mimeSubtype = match[1];
  const buffer = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
  if (buffer.byteLength === 0) throw makeHttpError(400, "Decoded image is empty.");
  return {
    buffer,
    extension: mimeSubtype === "jpeg" ? "jpg" : mimeSubtype
  };
}

function normalizePoint(value, fallback) {
  if (!Array.isArray(value) || value.length < 2) return fallback;
  const x = Number(value[0]);
  const y = Number(value[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return fallback;
  return [
    Math.min(1, Math.max(0, Number(x.toFixed(4)))),
    Math.min(1, Math.max(0, Number(y.toFixed(4))))
  ];
}

function normalizeProfile(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const zoom = Number(source.zoom);
  const offset = normalizePoint(source.offset, [0, 0]);
  return {
    zoom: Number.isFinite(zoom) ? Math.min(8, Math.max(1, Number(zoom.toFixed(3)))) : 3,
    offset
  };
}

function normalizeMotionFrameMetadata(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : null;
  if (!source) return null;
  const clipId = safeSegment(source.clipId || source.clip_id || "", "");
  if (!clipId) return null;
  const time = Number(source.time);
  const frameIndex = Number(source.frameIndex ?? source.frame_index);
  const frameCount = Number(source.frameCount ?? source.frame_count);
  const clipDuration = Number(source.clipDuration ?? source.clip_duration ?? source.duration);
  const metadata = {
    clip_id: clipId,
    clip_label: String(source.clipLabel || source.clip_label || source.label || clipId),
    time: Number.isFinite(time) ? Number(time.toFixed(3)) : 0,
    frame_index: Number.isFinite(frameIndex) ? Math.max(0, Math.round(frameIndex)) : 0
  };
  if (Number.isFinite(frameCount) && frameCount > 0) {
    metadata.frame_count = Math.max(1, Math.round(frameCount));
  }
  if (Number.isFinite(clipDuration) && clipDuration > 0) {
    metadata.clip_duration = Number(clipDuration.toFixed(3));
  }
  if (source.physicsSampled !== undefined || source.physics_sampled !== undefined) {
    metadata.physics_sampled = Boolean(source.physicsSampled ?? source.physics_sampled);
  }
  const poseTags = normalizeStringList(source.poseTags ?? source.pose_tags, 24);
  if (poseTags.length > 0) metadata.pose_tags = poseTags;
  const poseScore = normalizeNumberMap(source.poseScore ?? source.pose_score, { min: 0, max: 1, limit: 32 });
  if (Object.keys(poseScore).length > 0) metadata.pose_score = poseScore;
  const parameterValues = normalizeNumberMap(source.parameterValues ?? source.parameter_values, { min: -10000, max: 10000, limit: 128 });
  if (Object.keys(parameterValues).length > 0) metadata.parameter_values = parameterValues;
  return metadata;
}

function normalizeExpressionPresetMetadata(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : null;
  if (!source) return null;
  const id = safeSegment(source.id || source.preset_id || source.presetId || source.label || "", "");
  if (!id) return null;
  const metadata = {
    id,
    label: String(source.label || source.name || id),
    auto_generated: Boolean(source.autoGenerated ?? source.auto_generated),
    parameter_values: normalizeNumberMap(source.parameterValues ?? source.parameter_values, { min: -10000, max: 10000, limit: 128 })
  };
  const autoExpressionKind = safeSegment(source.autoExpressionKind || source.auto_expression_kind || source.kind || "", "");
  if (autoExpressionKind) metadata.auto_expression_kind = autoExpressionKind;
  const poseTags = normalizeStringList(source.poseTags ?? source.pose_tags, 24);
  if (poseTags.length > 0) metadata.pose_tags = poseTags;
  const poseScore = normalizeNumberMap(source.poseScore ?? source.pose_score, { min: 0, max: 1, limit: 32 });
  if (Object.keys(poseScore).length > 0) metadata.pose_score = poseScore;
  if (Object.keys(metadata.parameter_values).length === 0) delete metadata.parameter_values;
  return metadata;
}

function normalizeStringList(value, limit = 64) {
  if (!Array.isArray(value)) return [];
  const result = [];
  const seen = new Set();
  for (const entry of value) {
    if (result.length >= limit) break;
    const clean = safeSegment(entry, "");
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    result.push(clean);
  }
  return result;
}

function normalizeNumberMap(value, { min = -Infinity, max = Infinity, limit = 128 } = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const result = {};
  for (const [rawKey, rawValue] of Object.entries(source)) {
    if (Object.keys(result).length >= limit) break;
    const key = safeSegment(rawKey, "");
    const valueNumber = Number(rawValue);
    if (!key || !Number.isFinite(valueNumber)) continue;
    result[key] = Number(Math.min(max, Math.max(min, valueNumber)).toFixed(3));
  }
  return result;
}

function summarizeMotionClipsForMetadata(model) {
  const source = Array.isArray(model?.motionClips) ? model.motionClips : Array.isArray(model?.motions) ? model.motions : [];
  return source.slice(0, 64).map((clip) => {
    const id = safeSegment(clip?.id || clip?.label || clip?.name || "", "");
    if (!id) return null;
    const duration = Number(clip?.duration);
    const keyframes = Array.isArray(clip?.keyframes) ? clip.keyframes : Array.isArray(clip?.keys) ? clip.keys : [];
    const exportFrames = Number(clip?.exportFrames ?? clip?.export_frames ?? clip?.frameCount ?? clip?.frame_count);
    return {
      id,
      label: String(clip?.label || clip?.name || id),
      duration: Number.isFinite(duration) ? Number(Math.max(0, duration).toFixed(3)) : 0,
      keyframe_count: keyframes.length,
      ...(Number.isFinite(exportFrames) && exportFrames > 0
        ? { export_frame_count: Math.min(24, Math.max(1, Math.round(exportFrames))) }
        : {})
    };
  }).filter(Boolean);
}

function summarizeExpressionPresetsForMetadata(model) {
  const source = Array.isArray(model?.expressionPresets)
    ? model.expressionPresets
    : (Array.isArray(model?.expressions) ? model.expressions : []);
  return source.slice(0, 128).map((preset, index) => {
    const id = safeSegment(preset?.id || preset?.label || preset?.name || `expression_${index + 1}`, "");
    if (!id) return null;
    const params = preset?.params && typeof preset.params === "object" && !Array.isArray(preset.params)
      ? preset.params
      : (preset?.parameterValues && typeof preset.parameterValues === "object" && !Array.isArray(preset.parameterValues)
        ? preset.parameterValues
        : (preset?.parameter_values && typeof preset.parameter_values === "object" && !Array.isArray(preset.parameter_values) ? preset.parameter_values : {}));
    const meshes = Array.isArray(preset?.meshes)
      ? preset.meshes
      : (Array.isArray(preset?.meshSnapshots) ? preset.meshSnapshots : []);
    const autoExpressionKind = safeSegment(preset?.autoExpressionKind || preset?.auto_expression_kind || preset?.kind || "", "");
    const poseTags = normalizeStringList(preset?.poseTags || preset?.pose_tags, 24);
    const poseScore = normalizeNumberMap(preset?.poseScore || preset?.pose_score, { min: 0, max: 1, limit: 32 });
    for (const tag of poseTags) {
      poseScore[tag] = Math.max(Number(poseScore[tag] || 0), 1);
    }
    const parameterValues = normalizeNumberMap(params, { min: -10000, max: 10000, limit: 128 });
    return {
      id,
      label: String(preset?.label || preset?.name || id),
      parameter_count: Object.keys(params).filter((key) => safeSegment(key, "")).length,
      mesh_snapshot_count: meshes.length,
      auto_generated: preset?.autoGenerated === true || preset?.auto_generated === true || Boolean(autoExpressionKind),
      ...(autoExpressionKind ? { auto_expression_kind: autoExpressionKind } : {}),
      ...(poseTags.length > 0 ? { pose_tags: poseTags } : {}),
      ...(Object.keys(poseScore).length > 0 ? { pose_score: poseScore } : {}),
      ...(Object.keys(parameterValues).length > 0 ? { parameter_values: parameterValues } : {})
    };
  }).filter(Boolean);
}

function summarizeAdaptivePoseTuningForMetadata(model) {
  const source = model?.adaptivePose && typeof model.adaptivePose === "object" && !Array.isArray(model.adaptivePose)
    ? model.adaptivePose
    : {};
  const params = model?.params && typeof model.params === "object" && !Array.isArray(model.params) ? model.params : {};
  const customParameters = Array.isArray(model?.customParameters) ? model.customParameters : [];
  const knownKeys = new Set(Object.keys(params).map((key) => safeSegment(key, "")).filter(Boolean));
  for (const parameter of customParameters) {
    const key = safeSegment(parameter?.key || parameter?.id || parameter?.label || "", "");
    if (key) knownKeys.add(key);
  }
  const disabledSource = Array.isArray(source.disabledParameters)
    ? source.disabledParameters
    : (Array.isArray(source.disabled_parameters) ? source.disabled_parameters : []);
  const disabledParameters = [];
  for (const rawKey of disabledSource) {
    const key = safeSegment(rawKey, "");
    if (!key || !knownKeys.has(key) || disabledParameters.includes(key)) continue;
    disabledParameters.push(key);
  }
  return {
    intensity: Number(Math.min(2, Math.max(0.25, Number(source.intensity ?? source.energy ?? 1))).toFixed(2)),
    disabled_parameters: disabledParameters.sort().slice(0, 128),
    enabled_parameter_count: Math.max(0, knownKeys.size - disabledParameters.length),
    disabled_parameter_count: disabledParameters.length
  };
}

function summarizeMotionFrameSetsForMetadata(live2dPortraits) {
  const source = live2dPortraits && typeof live2dPortraits === "object" && !Array.isArray(live2dPortraits)
    ? live2dPortraits
    : {};
  const groups = new Map();
  for (const [state, entry] of Object.entries(source)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const frame = normalizeMotionFrameMetadata(entry.motion_frame || entry.motionFrame || entry.live2d_motion_frame || entry.live2dMotionFrame);
    if (!frame) continue;
    const existing = groups.get(frame.clip_id) || {
      clip_id: frame.clip_id,
      clip_label: frame.clip_label || frame.clip_id,
      expected_frame_count: 0,
      clip_duration: 0,
      physics_sampled: false,
      pose_tags: new Set(),
      states: []
    };
    existing.clip_label = frame.clip_label || existing.clip_label;
    existing.expected_frame_count = Math.max(existing.expected_frame_count, Number(frame.frame_count || 0));
    existing.clip_duration = Math.max(existing.clip_duration, Number(frame.clip_duration || 0));
    existing.physics_sampled = existing.physics_sampled || Boolean(frame.physics_sampled);
    for (const tag of frame.pose_tags || []) existing.pose_tags.add(tag);
    const expressionPreset = normalizeExpressionPresetMetadata(entry.expression_preset || entry.expressionPreset || entry.live2d_expression_preset || entry.live2dExpressionPreset);
    existing.states.push({
      state,
      time: Number(frame.time || 0),
      frame_index: Number(frame.frame_index || 0),
      image_path: String(entry.image_path || entry.imagePath || entry.path || ""),
      model_path: String(entry.model_path || entry.modelPath || entry.live2d_model || entry.live2dModel || ""),
      center: Array.isArray(entry.center) ? entry.center : null,
      profile: entry.profile && typeof entry.profile === "object" && !Array.isArray(entry.profile) ? entry.profile : null,
      pose_tags: frame.pose_tags || [],
      pose_score: frame.pose_score || {},
      parameter_values: frame.parameter_values || {},
      expression_preset: expressionPreset
    });
    groups.set(frame.clip_id, existing);
  }

  return Array.from(groups.values())
    .map((group) => {
      const states = group.states
        .slice()
        .sort((left, right) => {
          if (left.frame_index !== right.frame_index) return left.frame_index - right.frame_index;
          if (left.time !== right.time) return left.time - right.time;
          return left.state.localeCompare(right.state);
        })
        .slice(0, 128)
        .map((frame) => ({
          state: safeSegment(frame.state, "frame"),
          time: Number(frame.time.toFixed(3)),
          frame_index: Math.max(0, Math.round(frame.frame_index)),
          image_path: frame.image_path,
          model_path: frame.model_path,
          ...(Array.isArray(frame.center) ? { center: frame.center } : {}),
          ...(frame.profile && typeof frame.profile === "object" && !Array.isArray(frame.profile) ? { profile: frame.profile } : {}),
          ...(Array.isArray(frame.pose_tags) && frame.pose_tags.length > 0 ? { pose_tags: frame.pose_tags } : {}),
          ...(frame.pose_score && typeof frame.pose_score === "object" && !Array.isArray(frame.pose_score) && Object.keys(frame.pose_score).length > 0 ? { pose_score: frame.pose_score } : {}),
          ...(frame.parameter_values && typeof frame.parameter_values === "object" && !Array.isArray(frame.parameter_values) && Object.keys(frame.parameter_values).length > 0 ? { parameter_values: frame.parameter_values } : {}),
          ...(frame.expression_preset && typeof frame.expression_preset === "object" && !Array.isArray(frame.expression_preset) ? { expression_preset: frame.expression_preset } : {})
        }));
      return {
        clip_id: group.clip_id,
        clip_label: group.clip_label,
        frame_count: states.length,
        expected_frame_count: Math.max(group.expected_frame_count, states.length),
        clip_duration: Number(group.clip_duration.toFixed(3)),
        physics_sampled: group.physics_sampled,
        ...(group.pose_tags.size > 0 ? { pose_tags: [...group.pose_tags].sort().slice(0, 32) } : {}),
        states
      };
    })
    .sort((left, right) => {
      if (left.clip_id === "adaptive_pose") return -1;
      if (right.clip_id === "adaptive_pose") return 1;
      return left.clip_id.localeCompare(right.clip_id);
    })
    .slice(0, 64);
}

function mergeMotionFrameSetStatesIntoPortraitsForSave(live2dPortraits, live2dMetadata) {
  const next = live2dPortraits && typeof live2dPortraits === "object" && !Array.isArray(live2dPortraits)
    ? { ...live2dPortraits }
    : {};
  const frameSets = [
    ...(Array.isArray(live2dMetadata?.motion_frame_sets) ? live2dMetadata.motion_frame_sets : []),
    ...(Array.isArray(live2dMetadata?.motionFrameSets) ? live2dMetadata.motionFrameSets : [])
  ];
  for (const rawFrameSet of frameSets) {
    if (!rawFrameSet || typeof rawFrameSet !== "object" || Array.isArray(rawFrameSet)) continue;
    const frameSet = rawFrameSet;
    const clipId = safeSegment(frameSet.clip_id || frameSet.clipId || "", "");
    if (!clipId) continue;
    const states = Array.isArray(frameSet.states) ? frameSet.states : [];
    for (const rawState of states) {
      if (!rawState || typeof rawState !== "object" || Array.isArray(rawState)) continue;
      const sourceState = rawState;
      const state = safeSegment(sourceState.state || sourceState.key || "", "");
      if (!state) continue;

      const current = next[state] && typeof next[state] === "object" && !Array.isArray(next[state])
        ? { ...next[state] }
        : {};
      const imagePath = String(sourceState.image_path || sourceState.imagePath || sourceState.path || "").trim();
      const modelPath = String(sourceState.model_path || sourceState.modelPath || sourceState.live2d_model || sourceState.live2dModel || "").trim();
      if (!String(current.image_path || current.imagePath || current.path || "").trim() && imagePath) {
        current.image_path = imagePath;
      }
      if (!String(current.model_path || current.modelPath || current.live2d_model || current.live2dModel || "").trim() && modelPath) {
        current.model_path = modelPath;
      }
      if (!Array.isArray(current.center) && Array.isArray(sourceState.center)) {
        current.center = sourceState.center;
      }
      if (!current.profile && sourceState.profile && typeof sourceState.profile === "object" && !Array.isArray(sourceState.profile)) {
        current.profile = sourceState.profile;
      }

      const currentFrame = normalizeMotionFrameMetadata(current.motion_frame || current.motionFrame || current.live2d_motion_frame || current.live2dMotionFrame);
      if (!currentFrame) {
        const fallbackFrame = normalizeMotionFrameMetadata(sourceState.motion_frame || sourceState.motionFrame || sourceState.live2d_motion_frame || sourceState.live2dMotionFrame || {
          clip_id: clipId,
          clip_label: frameSet.clip_label || frameSet.clipLabel || frameSet.label || clipId,
          time: sourceState.time,
          frame_index: sourceState.frame_index ?? sourceState.frameIndex,
          frame_count: sourceState.frame_count ?? sourceState.frameCount ?? frameSet.expected_frame_count ?? frameSet.expectedFrameCount ?? frameSet.frame_count ?? frameSet.frameCount,
          clip_duration: frameSet.clip_duration ?? frameSet.clipDuration ?? frameSet.duration,
          physics_sampled: frameSet.physics_sampled ?? frameSet.physicsSampled,
          pose_tags: sourceState.pose_tags ?? sourceState.poseTags ?? frameSet.pose_tags ?? frameSet.poseTags,
          pose_score: sourceState.pose_score ?? sourceState.poseScore,
          parameter_values: sourceState.parameter_values ?? sourceState.parameterValues
        });
        if (fallbackFrame) current.motion_frame = fallbackFrame;
      }

      const currentExpression = normalizeExpressionPresetMetadata(current.expression_preset || current.expressionPreset || current.live2d_expression_preset || current.live2dExpressionPreset);
      if (!currentExpression) {
        const expressionPreset = normalizeExpressionPresetMetadata(sourceState.expression_preset || sourceState.expressionPreset || sourceState.live2d_expression_preset || sourceState.live2dExpressionPreset);
        if (expressionPreset) current.expression_preset = expressionPreset;
      }

      if (String(current.image_path || current.imagePath || current.path || "").trim()) {
        next[state] = current;
      }
    }
  }
  return next;
}

function normalizeLive2dMetadataPortraitsForSave(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return Object.fromEntries(Object.entries(source).flatMap(([state, rawEntry]) => {
    if (!rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) return [];
    const entry = { ...rawEntry };
    const imagePath = String(entry.image_path || entry.imagePath || entry.path || "").trim();
    const modelPath = String(entry.model_path || entry.modelPath || entry.live2d_model || entry.live2dModel || "").trim();
    if (imagePath) entry.image_path = imagePath;
    if (modelPath) entry.model_path = modelPath;
    const motionFrame = normalizeMotionFrameMetadata(entry.motion_frame || entry.motionFrame || entry.live2d_motion_frame || entry.live2dMotionFrame);
    if (motionFrame) entry.motion_frame = motionFrame;
    const expressionPreset = normalizeExpressionPresetMetadata(entry.expression_preset || entry.expressionPreset || entry.live2d_expression_preset || entry.live2dExpressionPreset);
    if (expressionPreset) entry.expression_preset = expressionPreset;
    return [[state, entry]];
  }));
}

function preferredAdaptiveClipId(clips) {
  const priorities = ["adaptive_pose", "dialogue_pose", "idle_loop", "idle", "breath", "talk_loop", "talk"];
  return preferredMotionClipId(clips, priorities, clips[0]?.id || "");
}

function preferredMotionClipId(clips, priorities, fallback = "") {
  for (const priority of priorities) {
    const match = clips.find((clip) => {
      const haystack = `${clip.id} ${clip.label}`.toLowerCase();
      return clip.id.toLowerCase() === priority || haystack.includes(priority);
    });
    if (match) return match.id;
  }
  return fallback;
}

function summarizeDialogueMotionSetForMetadata(motionClips, motionFrameSets) {
  const clipIds = motionClips.map((clip) => clip.id).filter(Boolean);
  const exportedClipIds = new Set(motionFrameSets.map((frameSet) => String(frameSet.clip_id || "").trim()).filter(Boolean));
  const frameSetByClip = new Map(motionFrameSets.map((frameSet) => [String(frameSet.clip_id || "").trim(), frameSet]));
  const hasCompleteFrameSet = (clipId) => {
    const frameSet = frameSetByClip.get(String(clipId || "").trim());
    if (!frameSet) return false;
    const frameCount = Math.max(0, Number(frameSet.frame_count || 0));
    const expectedFrameCount = Math.max(0, Number(frameSet.expected_frame_count || frameSet.frame_count || 0));
    return frameCount > 0 && (expectedFrameCount <= 0 || frameCount >= expectedFrameCount);
  };
  const adaptiveClipId = preferredMotionClipId(motionClips, ["adaptive_pose", "dialogue_pose"], preferredAdaptiveClipId(motionClips));
  const idleClipId = preferredMotionClipId(motionClips, ["idle_loop", "idle", "breath"], "");
  const talkClipId = preferredMotionClipId(motionClips, ["talk_loop", "talk", "speak", "mouth"], "");
  const visemeClipId = preferredMotionClipId(motionClips, ["viseme_set", "viseme", "phoneme", "lip"], "");
  const dialogueClipIds = [...new Set([adaptiveClipId, idleClipId, talkClipId, visemeClipId].filter(Boolean))];
  const completeExportedClipIds = dialogueClipIds.filter(hasCompleteFrameSet);
  const incompleteClipIds = dialogueClipIds.filter((clipId) => exportedClipIds.has(clipId) && !hasCompleteFrameSet(clipId));
  const requiredClipIds = [adaptiveClipId, idleClipId, talkClipId].filter(Boolean);
  const ready = requiredClipIds.length === 3 && requiredClipIds.every(hasCompleteFrameSet);
  return {
    version: 1,
    ready,
    adaptive_clip_id: adaptiveClipId,
    idle_clip_id: idleClipId,
    talk_clip_id: talkClipId,
    viseme_clip_id: visemeClipId,
    clip_ids: dialogueClipIds,
    exported_clip_ids: dialogueClipIds.filter((clipId) => exportedClipIds.has(clipId)),
    complete_exported_clip_ids: completeExportedClipIds,
    incomplete_clip_ids: incompleteClipIds,
    source_clip_ids: [...new Set(clipIds)].slice(0, 64),
    motion_frame_set_count: motionFrameSets.length,
    exported_frame_count: motionFrameSets.reduce((total, frameSet) => total + Math.max(0, Number(frameSet.frame_count || 0)), 0),
    expected_frame_count: motionFrameSets.reduce((total, frameSet) => total + Math.max(0, Number(frameSet.expected_frame_count || frameSet.frame_count || 0)), 0),
    has_exported_adaptive_pose: exportedClipIds.has(adaptiveClipId),
    has_exported_idle_loop: exportedClipIds.has(idleClipId),
    has_exported_talk_loop: exportedClipIds.has(talkClipId),
    has_exported_viseme_set: exportedClipIds.has(visemeClipId),
    has_complete_adaptive_pose: hasCompleteFrameSet(adaptiveClipId),
    has_complete_idle_loop: hasCompleteFrameSet(idleClipId),
    has_complete_talk_loop: hasCompleteFrameSet(talkClipId),
    has_complete_viseme_set: hasCompleteFrameSet(visemeClipId)
  };
}

function summarizeRuntimeReadinessForMetadata({
  dialogueMotionSet,
  motionFrameSets,
  hitAreas,
  parameterBindings,
  parameterRoles = [],
  expressionPresets,
  sourceCounts
}) {
  const exportedFrameCount = motionFrameSets.reduce((total, frameSet) => total + Math.max(0, Number(frameSet.frame_count || 0)), 0);
  const expectedFrameCount = motionFrameSets.reduce((total, frameSet) => total + Math.max(0, Number(frameSet.expected_frame_count || frameSet.frame_count || 0)), 0);
  const frameSetReadiness = motionFrameSets.map((frameSet) => {
    const frameCount = Math.max(0, Number(frameSet.frame_count || 0));
    const expected = Math.max(0, Number(frameSet.expected_frame_count || frameSet.frame_count || 0));
    return {
      clip_id: String(frameSet.clip_id || "").trim(),
      frame_count: frameCount,
      expected_frame_count: expected,
      complete: frameCount > 0 && (expected <= 0 || frameCount >= expected)
    };
  }).filter((entry) => entry.clip_id);
  const frameSetReadinessByClip = new Map(frameSetReadiness.map((entry) => [entry.clip_id, entry]));
  const hasCompleteFrameSet = (clipId) => {
    const readiness = frameSetReadinessByClip.get(String(clipId || "").trim());
    return Boolean(readiness?.complete);
  };
  const poseTags = new Set();
  for (const frameSet of motionFrameSets) {
    for (const tag of normalizeStringList(frameSet.pose_tags || [], 64)) poseTags.add(tag);
    for (const state of Array.isArray(frameSet.states) ? frameSet.states : []) {
      for (const tag of normalizeStringList(state?.pose_tags || [], 64)) poseTags.add(tag);
    }
  }
  for (const preset of expressionPresets) {
    for (const tag of normalizeStringList(preset?.pose_tags || [], 64)) poseTags.add(tag);
  }
  const parameterRoleCount = parameterRoles.length || Number(sourceCounts?.parameter_count || 0);
  const semanticParameterCount = parameterRoles.filter((entry) => normalizeParameterRole(entry?.role) !== "generic").length
    || Number(sourceCounts?.semantic_parameter_count || 0);

  const missing = [];
  const addMissing = (condition, key) => {
    if (!condition && !missing.includes(key)) missing.push(key);
  };
  addMissing(Number(sourceCounts?.image_part_count || 0) > 0, "image_parts");
  addMissing(Number(sourceCounts?.parameter_count || 0) > 0, "parameters");
  addMissing(semanticParameterCount > 0, "semantic_parameter_roles");
  addMissing(parameterBindings.length > 0, "parameter_bindings");
  addMissing(motionFrameSets.length > 0, "motion_frame_sets");
  addMissing(exportedFrameCount > 0, "exported_motion_frames");
  addMissing(hasCompleteFrameSet(dialogueMotionSet?.adaptive_clip_id), "adaptive_pose_frames");
  addMissing(poseTags.size > 0, "pose_tags");

  const missingDialogue = [];
  if (!hasCompleteFrameSet(dialogueMotionSet?.idle_clip_id)) missingDialogue.push("idle_loop_frames");
  if (!hasCompleteFrameSet(dialogueMotionSet?.talk_clip_id)) missingDialogue.push("talk_loop_frames");
  if (dialogueMotionSet?.viseme_clip_id && !hasCompleteFrameSet(dialogueMotionSet?.viseme_clip_id)) {
    missingDialogue.push("viseme_set_frames");
  }
  const incompleteMotionFrameSets = frameSetReadiness
    .filter((entry) => !entry.complete)
    .map(({ clip_id, frame_count, expected_frame_count }) => ({ clip_id, frame_count, expected_frame_count }));

  return {
    version: 1,
    ready: missing.length === 0,
    dialogue_motion_ready: missing.length === 0 && missingDialogue.length === 0,
    interaction_ready: hitAreas.length > 0,
    adaptive_pose_ready: hasCompleteFrameSet(dialogueMotionSet?.adaptive_clip_id),
    portrait_count: Number(sourceCounts?.portrait_count || 0),
    motion_frame_set_count: motionFrameSets.length,
    complete_motion_frame_set_count: frameSetReadiness.length - incompleteMotionFrameSets.length,
    exported_frame_count: exportedFrameCount,
    expected_frame_count: expectedFrameCount,
    pose_tag_count: poseTags.size,
    parameter_role_count: parameterRoleCount,
    semantic_parameter_count: semanticParameterCount,
    parameter_binding_count: parameterBindings.length,
    hit_area_count: hitAreas.length,
    expression_preset_count: expressionPresets.length,
    missing,
    missing_dialogue_motion: missingDialogue,
    incomplete_motion_frame_sets: incompleteMotionFrameSets
  };
}

function rigSourceCounts(model) {
  const imageParts = Array.isArray(model?.imageParts) ? model.imageParts : [];
  const layers = Array.isArray(model?.layers) ? model.layers : [];
  const customParameters = Array.isArray(model?.customParameters) ? model.customParameters : [];
  const params = model?.params && typeof model.params === "object" && !Array.isArray(model.params) ? model.params : {};
  const expressionPresets = Array.isArray(model?.expressionPresets) ? model.expressionPresets : [];
  const deformerGroups = Array.isArray(model?.deformerGroups) ? model.deformerGroups : Array.isArray(model?.deformers) ? model.deformers : [];
  const parameterBindings = summarizeParameterBindings(model);
  const parameterRoles = summarizeParameterRolesForMetadata(model);
  const parameterKeys = new Set(Object.keys(params));
  for (const parameter of customParameters) {
    const key = safeSegment(parameter?.key || parameter?.id || parameter?.label || "", "");
    if (key) parameterKeys.add(key);
  }
  return {
    image_part_count: imageParts.length,
    deformer_group_count: deformerGroups.length,
    auto_deformer_group_count: deformerGroups.filter((group) => group?.autoGenerated === true || group?.auto_generated === true || String(group?.id || "").startsWith("auto_")).length,
    deformer_parent_count: deformerGroups.filter((group) => safeSegment(group?.parentGroupId || group?.parentId || group?.parent || "", "")).length,
    warp_deformer_count: deformerGroups.filter((group) => group?.enabled !== false && group?.warp?.enabled === true).length,
    visibility_gate_count: imageParts.filter((part) => part?.visibilityGate?.enabled === true).length,
    locked_part_count: imageParts.filter((part) => part?.locked === true).length,
    hit_area_count: summarizeHitAreas(model).length,
    procedural_layer_count: layers.length,
    parameter_count: parameterKeys.size,
    rig_binding_count: parameterBindings.length,
    custom_parameter_count: customParameters.length,
    semantic_parameter_count: parameterRoles.filter((entry) => entry.role !== "generic").length,
    expression_preset_count: expressionPresets.length,
    auto_expression_preset_count: expressionPresets.filter((preset) => (
      preset?.autoGenerated === true
      || preset?.auto_generated === true
      || Boolean(safeSegment(preset?.autoExpressionKind || preset?.auto_expression_kind || "", ""))
    )).length
  };
}

function summarizeParameterRolesForMetadata(model) {
  const labels = parameterLabelMap(model);
  const roleMap = parameterRoleMap(model);
  const keys = new Set([...labels.keys()]);
  const params = model?.params && typeof model.params === "object" && !Array.isArray(model.params) ? model.params : {};
  for (const key of Object.keys(params)) keys.add(safeSegment(key, ""));
  for (const binding of summarizeParameterBindings(model)) {
    const key = safeSegment(binding?.parameter || "", "");
    if (key) keys.add(key);
  }
  return [...keys]
    .filter(Boolean)
    .map((key) => ({
      parameter: key,
      label: labels.get(key) || key,
      role: roleMap.get(key) || inferParameterRoleFromText(`${key} ${labels.get(key) || ""}`)
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(0, 128);
}

function summarizeHitAreas(model) {
  const imageParts = Array.isArray(model?.imageParts) ? model.imageParts : [];
  return imageParts
    .map((part) => {
      const source = part?.hitArea && typeof part.hitArea === "object" && !Array.isArray(part.hitArea) ? part.hitArea : {};
      if (!source.enabled) return null;
      const id = safeSegment(source.id || source.key || source.name || part?.id || "", "");
      if (!id) return null;
      return {
        id,
        label: String(source.label || part?.label || id),
        kind: String(source.kind || source.type || "generic"),
        part_id: safeSegment(part?.id || "", ""),
        source: "image_part",
        ...summarizeHitAreaGeometry(source)
      };
    })
    .filter(Boolean)
    .slice(0, 128);
}

function summarizeHitAreaGeometry(source) {
  const bounds = normalizeBounds(source.bounds || source.rect);
  const normalizedBounds = normalizeBounds(source.normalizedBounds || source.normalized_bounds || source.normalizedRect || source.normalized_rect);
  const points = normalizePoints(source.points || source.polygon);
  const normalizedPoints = normalizePoints(source.normalizedPoints || source.normalized_points || source.normalizedPolygon || source.normalized_polygon);
  return {
    ...(bounds ? { bounds } : {}),
    ...(normalizedBounds ? { normalized_bounds: normalizedBounds } : {}),
    ...(points.length > 0 ? { points } : {}),
    ...(normalizedPoints.length > 0 ? { normalized_points: normalizedPoints } : {})
  };
}

function normalizeBounds(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const x = Number(source.x);
  const y = Number(source.y);
  const width = Number(source.width ?? source.w);
  const height = Number(source.height ?? source.h);
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
  return {
    x: Number(x.toFixed(4)),
    y: Number(y.toFixed(4)),
    width: Number(width.toFixed(4)),
    height: Number(height.toFixed(4))
  };
}

function normalizePoints(value) {
  const source = Array.isArray(value) ? value : [];
  return source
    .map((point) => {
      const x = Number(Array.isArray(point) ? point[0] : point?.x);
      const y = Number(Array.isArray(point) ? point[1] : point?.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return {
        x: Number(x.toFixed(4)),
        y: Number(y.toFixed(4))
      };
    })
    .filter(Boolean)
    .slice(0, 32);
}

const directBindingFields = [
  ["bindX", "x"],
  ["bindY", "y"],
  ["bindRotation", "rotation"],
  ["bindScaleX", "scale_x"],
  ["bindScaleY", "scale_y"],
  ["bindOpacity", "opacity"]
];

function summarizeParameterBindings(model) {
  const bindings = new Map();
  const parameterLabels = parameterLabelMap(model);
  const parameterRoles = parameterRoleMap(model);

  function ensureBinding(parameter) {
    const cleanParameter = safeSegment(parameter, "");
    if (!cleanParameter) return null;
    if (!bindings.has(cleanParameter)) {
      bindings.set(cleanParameter, {
        parameter: cleanParameter,
        label: parameterLabels.get(cleanParameter) || cleanParameter,
        role: parameterRoles.get(cleanParameter) || inferParameterRoleFromText(`${cleanParameter} ${parameterLabels.get(cleanParameter) || ""}`),
        channels: new Set(),
        motion_clip_ids: new Set(),
        affected_parts: new Map(),
        direct_binding_count: 0,
        visibility_gate_count: 0,
        transform_key_count: 0,
        draw_order_key_count: 0,
        deformer_group_count: 0,
        warp_deformer_count: 0,
        warp_key_count: 0,
        mesh_deformer_count: 0,
        mesh_key_count: 0,
        physics_rule_count: 0,
        motion_key_count: 0
      });
    }
    return bindings.get(cleanParameter);
  }

  function addAffectedPart(binding, part, channel) {
    if (!binding || !part) return;
    const partId = safeSegment(part?.id || "", "");
    if (!partId) return;
    if (!binding.affected_parts.has(partId)) {
      binding.affected_parts.set(partId, {
        part_id: partId,
        label: String(part?.label || part?.name || partId),
        channels: new Set()
      });
    }
    binding.affected_parts.get(partId).channels.add(channel);
  }

  const imageParts = Array.isArray(model?.imageParts) ? model.imageParts : [];
  const imagePartMap = new Map(imageParts.map((part) => [safeSegment(part?.id || "", ""), part]));
  for (const part of imageParts) {
    for (const [field, channel] of directBindingFields) {
      const binding = ensureBinding(part?.[field]);
      if (!binding) continue;
      binding.channels.add(channel);
      binding.direct_binding_count += 1;
      addAffectedPart(binding, part, channel);
    }

    const visibilityGate = part?.visibilityGate && typeof part.visibilityGate === "object" && !Array.isArray(part.visibilityGate)
      ? part.visibilityGate
      : {};
    if (visibilityGate.enabled === true) {
      const binding = ensureBinding(visibilityGate.parameter || visibilityGate.param || visibilityGate.key);
      if (binding) {
        binding.channels.add("visibility");
        binding.visibility_gate_count += 1;
        addAffectedPart(binding, part, "visibility");
      }
    }

    const transformDeformers = Array.isArray(part?.transformDeformers) ? part.transformDeformers : [];
    for (const deformer of transformDeformers) {
      const binding = ensureBinding(deformer?.parameter || deformer?.param);
      if (!binding) continue;
      const keyframes = Array.isArray(deformer?.keyframes) ? deformer.keyframes : Array.isArray(deformer?.keys) ? deformer.keys : [];
      const transformChannels = new Set();
      for (const keyframe of keyframes) {
        const transform = keyframe?.transform && typeof keyframe.transform === "object" && !Array.isArray(keyframe.transform)
          ? keyframe.transform
          : keyframe;
        for (const key of ["x", "y", "rotation", "scaleX", "scaleY", "opacity"]) {
          if (Number.isFinite(Number(transform?.[key]))) {
            transformChannels.add(key.replace("scaleX", "scale_x").replace("scaleY", "scale_y"));
          }
        }
      }
      binding.channels.add("transform_key");
      for (const channel of transformChannels) binding.channels.add(channel);
      binding.transform_key_count += keyframes.length;
      addAffectedPart(binding, part, "transform_key");
    }

    const drawOrderDeformers = Array.isArray(part?.drawOrderDeformers) ? part.drawOrderDeformers : Array.isArray(part?.drawOrderKeys) ? part.drawOrderKeys : [];
    for (const deformer of drawOrderDeformers) {
      const binding = ensureBinding(deformer?.parameter || deformer?.param);
      if (!binding) continue;
      const keyframes = Array.isArray(deformer?.keyframes) ? deformer.keyframes : Array.isArray(deformer?.keys) ? deformer.keys : [];
      binding.channels.add("draw_order");
      binding.draw_order_key_count += keyframes.length;
      addAffectedPart(binding, part, "draw_order");
    }

    const mesh = part?.mesh && typeof part.mesh === "object" && !Array.isArray(part.mesh) ? part.mesh : {};
    if (mesh.enabled !== false) {
      const deformers = Array.isArray(mesh.deformers) ? mesh.deformers : [];
      for (const deformer of deformers) {
        const binding = ensureBinding(deformer?.parameter || deformer?.param);
        if (!binding) continue;
        const keyframes = Array.isArray(deformer?.keyframes) ? deformer.keyframes : Array.isArray(deformer?.keys) ? deformer.keys : [];
        binding.channels.add("mesh");
        binding.mesh_deformer_count += 1;
        binding.mesh_key_count += keyframes.length;
        addAffectedPart(binding, part, "mesh");
      }
    }
  }

  const deformerGroups = Array.isArray(model?.deformerGroups) ? model.deformerGroups : Array.isArray(model?.deformers) ? model.deformers : [];
  const deformerGroupsById = new Map(deformerGroups.map((group) => [safeSegment(group?.id || "", ""), group]).filter(([id]) => id));
  function deformerGroupAffectedPartIds(group, visited = new Set()) {
    const groupId = safeSegment(group?.id || "", "");
    if (!groupId || visited.has(groupId)) return [];
    visited.add(groupId);
    const directPartIds = Array.isArray(group?.partIds) ? group.partIds : Array.isArray(group?.parts) ? group.parts : [];
    const result = directPartIds
      .map((rawPartId) => safeSegment(typeof rawPartId === "object" ? rawPartId?.id : rawPartId, ""))
      .filter(Boolean);
    for (const child of deformerGroups) {
      if (child?.enabled === false) continue;
      const parentId = safeSegment(child?.parentGroupId || child?.parentId || child?.parent || "", "");
      const childId = safeSegment(child?.id || "", "");
      if (!childId || parentId !== groupId || !deformerGroupsById.has(childId)) continue;
      result.push(...deformerGroupAffectedPartIds(child, new Set(visited)));
    }
    return [...new Set(result)];
  }
  for (const group of deformerGroups) {
    if (group?.enabled === false) continue;
    const binding = ensureBinding(group?.parameter || group?.param);
    if (!binding) continue;
    const partIds = deformerGroupAffectedPartIds(group);
    const keyframes = Array.isArray(group?.keyframes) ? group.keyframes : Array.isArray(group?.keys) ? group.keys : [];
    const warp = group?.warp && typeof group.warp === "object" && !Array.isArray(group.warp) ? group.warp : {};
    const warpKeyframes = Array.isArray(warp?.keyframes) ? warp.keyframes : Array.isArray(warp?.keys) ? warp.keys : [];
    binding.channels.add("deformer_group");
    binding.deformer_group_count += 1;
    binding.transform_key_count += keyframes.length;
    if (warp.enabled === true) {
      binding.channels.add("warp");
      binding.warp_deformer_count += 1;
      binding.warp_key_count += warpKeyframes.length;
    }
    for (const rawPartId of partIds) {
      const partId = safeSegment(rawPartId, "");
      if (!partId || !imagePartMap.has(partId)) continue;
      addAffectedPart(binding, imagePartMap.get(partId), warp.enabled === true ? "warp" : "deformer_group");
    }
  }

  const physics = model?.physics && typeof model.physics === "object" && !Array.isArray(model.physics) ? model.physics : {};
  const physicsRules = Array.isArray(physics.rules) ? physics.rules : [];
  for (const rule of physicsRules) {
    if (rule?.enabled === false) continue;
    const binding = ensureBinding(rule?.param || rule?.parameter || rule?.target);
    if (!binding) continue;
    binding.channels.add("physics");
    binding.physics_rule_count += 1;
  }

  const motionClips = Array.isArray(model?.motionClips) ? model.motionClips : Array.isArray(model?.motions) ? model.motions : [];
  for (const clip of motionClips) {
    const clipId = safeSegment(clip?.id || clip?.label || clip?.name || "", "");
    const keyframes = Array.isArray(clip?.keyframes) ? clip.keyframes : Array.isArray(clip?.keys) ? clip.keys : [];
    for (const keyframe of keyframes) {
      const params = keyframe?.params && typeof keyframe.params === "object" && !Array.isArray(keyframe.params)
        ? keyframe.params
        : {};
      for (const parameter of Object.keys(params)) {
        const binding = ensureBinding(parameter);
        if (!binding) continue;
        binding.channels.add("motion");
        binding.motion_key_count += 1;
        if (clipId) binding.motion_clip_ids.add(clipId);
      }
    }
  }

  return [...bindings.values()]
    .map((binding) => ({
      parameter: binding.parameter,
      label: binding.label,
      role: binding.role,
      channels: [...binding.channels].sort().slice(0, 32),
      direct_binding_count: binding.direct_binding_count,
      visibility_gate_count: binding.visibility_gate_count,
      transform_key_count: binding.transform_key_count,
      draw_order_key_count: binding.draw_order_key_count,
      deformer_group_count: binding.deformer_group_count,
      warp_deformer_count: binding.warp_deformer_count,
      warp_key_count: binding.warp_key_count,
      mesh_deformer_count: binding.mesh_deformer_count,
      mesh_key_count: binding.mesh_key_count,
      physics_rule_count: binding.physics_rule_count,
      motion_key_count: binding.motion_key_count,
      motion_clip_ids: [...binding.motion_clip_ids].sort().slice(0, 32),
      affected_parts: [...binding.affected_parts.values()]
        .map((part) => ({
          part_id: part.part_id,
          label: part.label,
          channels: [...part.channels].sort().slice(0, 16)
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
        .slice(0, 64)
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(0, 128);
}

function parameterLabelMap(model) {
  const labels = new Map();
  const params = model?.params && typeof model.params === "object" && !Array.isArray(model.params) ? model.params : {};
  for (const key of Object.keys(params)) labels.set(safeSegment(key, ""), key);
  const customParameters = Array.isArray(model?.customParameters) ? model.customParameters : [];
  for (const parameter of customParameters) {
    const key = safeSegment(parameter?.key || parameter?.id || parameter?.label || "", "");
    if (!key) continue;
    labels.set(key, String(parameter?.label || parameter?.name || key));
  }
  return labels;
}

function parameterRoleMap(model) {
  const roles = new Map(builtInParameterRoles);
  const customParameters = Array.isArray(model?.customParameters) ? model.customParameters : [];
  for (const parameter of customParameters) {
    const key = safeSegment(parameter?.key || parameter?.id || parameter?.label || "", "");
    if (!key) continue;
    const label = String(parameter?.label || parameter?.name || key);
    roles.set(key, normalizeParameterRole(parameter?.role || parameter?.semanticRole || parameter?.semantic_role || parameter?.kind) || inferParameterRoleFromText(`${key} ${label}`));
  }
  return roles;
}

function godotPreviewTargetUrl(pathname = "/import") {
  return new URL(pathname, `${godotPreviewBridgeTarget}/`);
}

async function triggerGodotImport(paths) {
  if (!godotImportAuto) {
    return { ok: false, skipped: true, error: "disabled" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 125000);
  try {
    const response = await fetch(godotPreviewTargetUrl("/import"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paths, timeout_seconds: 120 }),
      signal: controller.signal
    });
    const responseText = await response.text();
    let body = {};
    try {
      body = responseText ? JSON.parse(responseText) : {};
    } catch {
      body = {};
    }

    if (!response.ok || body.ok === false) {
      return { ok: false, error: String(body.error || responseText || `HTTP ${response.status}`) };
    }
    return { ok: true, error: "" };
  } catch (error) {
    return {
      ok: false,
      error: error.name === "AbortError" ? "timeout" : error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function prepareLive2dPortraitSave(id, character, body, savedAt = new Date().toISOString()) {
  const state = safeSegment(body.state || "default", "default");
  const imageBuffer = decodePngDataUrl(body.imageDataUrl);
  const model = body.model && typeof body.model === "object" && !Array.isArray(body.model)
    ? body.model
    : {};
  const center = normalizePoint(body.center, [0.5, 0.18]);
  const profile = normalizeProfile(body.profile);
  const relativeDir = path.posix.join("assets", "characters", id);
  const imageRelativePath = path.posix.join(relativeDir, `${state}.png`);
  const modelRelativePath = path.posix.join(relativeDir, `${state}.live2d-web.json`);
  const imagePath = resolveRepoPath(...imageRelativePath.split("/"));
  const modelPath = resolveRepoPath(...modelRelativePath.split("/"));
  const rigDocument = {
    ...model,
    saved_at: savedAt,
    target_character_id: id,
    target_portrait_state: state,
    exported_portrait_path: `res://${imageRelativePath}`
  };
  const motionFrame = normalizeMotionFrameMetadata(model?.metadata?.motionFrame || model?.metadata?.motion_frame);

  await mkdir(path.dirname(imagePath), { recursive: true });
  await writeFile(imagePath, imageBuffer);
  await writeJsonAtomic(modelPath, rigDocument);

  const portraits = character.portraits && typeof character.portraits === "object" && !Array.isArray(character.portraits)
    ? { ...character.portraits }
    : {};
  portraits[state] = {
    path: `res://${imageRelativePath}`,
    center,
    profile,
    live2d_model: `res://${modelRelativePath}`,
    generated_by: "tools/live2d-editor"
  };
  if (motionFrame) portraits[state].live2d_motion_frame = motionFrame;
  const expressionPreset = normalizeExpressionPresetMetadata(model?.metadata?.expressionPreset || model?.metadata?.expression_preset);
  if (expressionPreset) portraits[state].live2d_expression_preset = expressionPreset;

  const metadata = character.metadata && typeof character.metadata === "object" && !Array.isArray(character.metadata)
    ? { ...character.metadata }
    : {};
  const sourceLive2dMetadata = live2dMetadataFromMetadata(metadata);
  const live2dMetadata = sourceLive2dMetadata ? { ...sourceLive2dMetadata } : {};
  const live2dPortraits = mergeMotionFrameSetStatesIntoPortraitsForSave(
    normalizeLive2dMetadataPortraitsForSave(live2dMetadata.portraits),
    live2dMetadata
  );
  live2dPortraits[state] = {
    image_path: `res://${imageRelativePath}`,
    model_path: `res://${modelRelativePath}`,
    center,
    profile,
    updated_at: savedAt
  };
  if (motionFrame) live2dPortraits[state].motion_frame = motionFrame;
  if (expressionPreset) live2dPortraits[state].expression_preset = expressionPreset;
  const motionClips = summarizeMotionClipsForMetadata(model);
  const hitAreas = summarizeHitAreas(model);
  const parameterBindings = summarizeParameterBindings(model);
  const parameterRoles = summarizeParameterRolesForMetadata(model);
  const adaptivePoseTuning = summarizeAdaptivePoseTuningForMetadata(model);
  const expressionPresets = summarizeExpressionPresetsForMetadata(model);
  const sourceCounts = rigSourceCounts(model);
  const motionFrameSets = summarizeMotionFrameSetsForMetadata(live2dPortraits);
  const dialogueMotionSet = summarizeDialogueMotionSetForMetadata(motionClips, motionFrameSets);
  const runtimeReadiness = summarizeRuntimeReadinessForMetadata({
    dialogueMotionSet,
    motionFrameSets,
    hitAreas,
    parameterBindings,
    parameterRoles,
    expressionPresets,
    sourceCounts: {
      ...sourceCounts,
      portrait_count: Object.keys(live2dPortraits).length
    }
  });
  delete metadata.live2dWebModel;
  metadata.live2d_web_model = {
    ...live2dMetadata,
    version: 1,
    app: "tools/live2d-editor",
    updated_at: savedAt,
    source_model_path: `res://${modelRelativePath}`,
    source_portrait_state: state,
    adaptive_clip_id: preferredAdaptiveClipId(motionClips),
    dialogue_motion_set: dialogueMotionSet,
    runtime_readiness: runtimeReadiness,
    portrait_count: Object.keys(live2dPortraits).length,
    motion_clip_count: motionClips.length,
    motion_frame_set_count: motionFrameSets.length,
    expression_preset_count: expressionPresets.length,
    auto_expression_preset_count: expressionPresets.filter((preset) => preset.auto_generated === true).length,
    ...sourceCounts,
    clips: motionClips,
    expression_presets: expressionPresets,
    motion_frame_sets: motionFrameSets,
    adaptive_pose_tuning: adaptivePoseTuning,
    hit_areas: hitAreas,
    parameter_roles: parameterRoles,
    parameter_bindings: parameterBindings,
    portraits: live2dPortraits
  };

  const nextCharacter = {
    ...character,
    id,
    display_name: String(model?.character?.displayName || character.display_name || character.name || id),
    name_color: String(model?.character?.nameColor || character.name_color || "#ffffff"),
    portraits,
    metadata
  };

  return {
    nextCharacter,
    state,
    portrait: portraits[state],
    imagePath: `res://${imageRelativePath}`,
    modelPath: `res://${modelRelativePath}`
  };
}

async function saveLive2dPortrait(characterId, body) {
  const id = assertSafeId(characterId, "character id");
  const character = await loadCharacter(id);
  const prepared = await prepareLive2dPortraitSave(id, character, body);
  await writeJsonAtomic(characterFile(id), prepared.nextCharacter);
  const importStatus = await triggerGodotImport([prepared.imagePath]);

  return {
    character: summarizeCharacter(id, prepared.nextCharacter),
    data: prepared.nextCharacter,
    portrait: prepared.portrait,
    imagePath: prepared.imagePath,
    modelPath: prepared.modelPath,
    importStatus
  };
}

async function saveLive2dPortraitBatch(characterId, body) {
  const id = assertSafeId(characterId, "character id");
  const frames = Array.isArray(body.frames) ? body.frames : [];
  if (frames.length === 0) throw makeHttpError(400, "frames must contain at least one portrait frame.");
  if (frames.length > 256) throw makeHttpError(400, "frames can contain at most 256 portrait frames.");

  let character = await loadCharacter(id);
  const savedAt = new Date().toISOString();
  const results = [];
  for (let index = 0; index < frames.length; index += 1) {
    const frameBody = frames[index];
    if (!frameBody || typeof frameBody !== "object" || Array.isArray(frameBody)) {
      throw makeHttpError(400, `frames[${index}] must be an object.`);
    }
    const prepared = await prepareLive2dPortraitSave(id, character, frameBody, savedAt);
    character = prepared.nextCharacter;
    results.push({
      state: prepared.state,
      portrait: prepared.portrait,
      imagePath: prepared.imagePath,
      modelPath: prepared.modelPath
    });
  }

  await writeJsonAtomic(characterFile(id), character);
  const importPaths = [...new Set(results.map((entry) => entry.imagePath))];
  const importStatus = await triggerGodotImport(importPaths);

  return {
    character: summarizeCharacter(id, character),
    data: character,
    count: results.length,
    frames: results,
    imagePaths: results.map((entry) => entry.imagePath),
    modelPaths: results.map((entry) => entry.modelPath),
    importStatus
  };
}

async function saveLive2dPart(characterId, body) {
  const id = assertSafeId(characterId, "character id");
  await loadCharacter(id);
  const { buffer, extension } = decodeImageDataUrl(body.dataUrl);
  const label = safeSegment(body.label || body.name || "part", "part");
  const partId = safeSegment(body.partId || `${label}_${randomUUID().slice(0, 8)}`, "part");
  const relativePath = path.posix.join("assets", "characters", id, "live2d_parts", `${partId}.${extension}`);
  const filePath = resolveRepoPath(...relativePath.split("/"));
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
  return {
    id: partId,
    label,
    path: `res://${relativePath}`,
    bytes: buffer.byteLength
  };
}

async function readJsonBody(request) {
  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of request) {
    totalBytes += chunk.byteLength;
    if (totalBytes > maxBodyBytes) throw makeHttpError(413, "Request body is too large.");
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw makeHttpError(400, "Request body must be valid JSON.");
  }
}

function safeJoin(root, requestPath) {
  const decoded = decodeURIComponent(requestPath).replace(/^\/+/, "");
  const resolved = path.resolve(root, decoded);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw makeHttpError(400, "Static path is outside the allowed root.");
  }
  return resolved;
}

async function serveFile(response, filePath) {
  const fileStats = await stat(filePath);
  if (!fileStats.isFile()) throw makeHttpError(404, "Not found");
  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "content-type": mimeTypes.get(extension) || "application/octet-stream",
    "content-length": fileStats.size,
    "cache-control": extension === ".html" ? "no-store" : "public, max-age=60"
  });
  createReadStream(filePath).pipe(response);
}

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      repoRoot,
      projectRoot,
      port,
      godotPreviewBridgeTarget,
      godotImportAuto
    });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/characters") {
    sendJson(response, 200, { characters: await listCharacters() });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/characters") {
    sendJson(response, 201, await createCharacter(await readJsonBody(request)));
    return true;
  }

  const batchSaveMatch = url.pathname.match(/^\/api\/characters\/([^/]+)\/live2d-portrait-batch$/);
  if (batchSaveMatch && request.method === "POST") {
    sendJson(response, 200, await saveLive2dPortraitBatch(batchSaveMatch[1], await readJsonBody(request)));
    return true;
  }

  const saveMatch = url.pathname.match(/^\/api\/characters\/([^/]+)\/live2d-portrait$/);
  if (saveMatch && request.method === "POST") {
    sendJson(response, 200, await saveLive2dPortrait(saveMatch[1], await readJsonBody(request)));
    return true;
  }

  const partMatch = url.pathname.match(/^\/api\/characters\/([^/]+)\/live2d-part$/);
  if (partMatch && request.method === "POST") {
    sendJson(response, 201, await saveLive2dPart(partMatch[1], await readJsonBody(request)));
    return true;
  }

  const characterMatch = url.pathname.match(/^\/api\/characters\/([^/]+)$/);
  if (characterMatch && request.method === "GET") {
    const id = assertSafeId(characterMatch[1], "character id");
    const data = await loadCharacter(id);
    sendJson(response, 200, { id, data, summary: summarizeCharacter(id, data) });
    return true;
  }

  return false;
}

async function handleStatic(request, response, url) {
  if (url.pathname.startsWith("/repo/assets/")) {
    const filePath = safeJoin(resolveRepoPath("assets"), url.pathname.slice("/repo/assets/".length));
    await serveFile(response, filePath);
    return;
  }

  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  try {
    await serveFile(response, safeJoin(projectRoot, requestedPath));
  } catch (error) {
    if (error.statusCode === 404 || error.code === "ENOENT") {
      await serveFile(response, path.join(projectRoot, "index.html"));
      return;
    }
    throw error;
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);
    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type"
      });
      response.end();
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      const handled = await handleApi(request, response, url);
      if (!handled) sendJson(response, 404, { error: { message: "API route not found." } });
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: { message: "Method not allowed." } });
      return;
    }
    await handleStatic(request, response, url);
  } catch (error) {
    if (error.code === "ENOENT") error = makeHttpError(404, "Not found");
    sendError(response, error);
  }
});

server.listen(port, host, () => {
  console.log(`Blind Madeleine web rig editor running at http://127.0.0.1:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => server.close(() => process.exit(0)));
}

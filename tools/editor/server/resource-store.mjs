import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = path.dirname(fileURLToPath(import.meta.url));

export const editorRoot = path.resolve(serverRoot, "..");
export const repoRoot = path.resolve(editorRoot, "..", "..");

export const resourceTypes = Object.freeze({
  characters: {
    label: "캐릭터",
    singularLabel: "캐릭터",
    dataDir: ["data", "characters"],
    empty: (id) => ({
      id,
      display_name: "새 캐릭터",
      description: "",
      name_color: "#8FD8B8",
      portraits: {},
      metadata: {}
    })
  },
  items: {
    label: "아이템",
    singularLabel: "아이템",
    dataDir: ["data", "items"],
    empty: (id) => ({
      id,
      name: "새 아이템",
      description: "",
      metadata: {},
      chapters: []
    })
  },
  chapters: {
    label: "챕터",
    singularLabel: "챕터",
    dataDir: ["data", "chapters"],
    empty: (id) => ({
      id,
      title: "새 챕터",
      order: 0,
      start_dialogue: "",
      description: "",
      dialogues: [],
      layout: { positions: {} },
      metadata: {}
    })
  },
  dialogues: {
    label: "대사",
    singularLabel: "대사",
    dataDir: ["data", "dialogues"],
    empty: (id) => ({
      id,
      label: "새 대사",
      chapters: [],
      nodes: []
    })
  },
  story_assets: {
    label: "스토리 에셋",
    singularLabel: "스토리 에셋",
    dataDir: ["data", "story_assets"],
    empty: (id) => ({
      id,
      kind: "sfx",
      display_name: "새 스토리 에셋",
      description: "",
      path: "",
      metadata: {},
      volume: 1
    })
  }
});

const resourceIdPattern = /^[a-zA-Z0-9_-]+$/;
const allowedAssetRoots = [
  "assets/characters",
  "assets/items",
  "assets/chapters",
  "assets/story_assets",
  "assets/sfx"
];

export function getResourceMeta(type) {
  const meta = resourceTypes[type];
  if (!meta) {
    const error = new Error(`Unknown resource type: ${type}`);
    error.statusCode = 404;
    throw error;
  }
  return meta;
}

export function assertSafeResourceId(id) {
  if (typeof id !== "string" || !resourceIdPattern.test(id)) {
    const error = new Error("Resource id can only contain letters, numbers, underscores, and hyphens.");
    error.statusCode = 400;
    throw error;
  }
  return id;
}

export function resolveRepoPath(...segments) {
  const resolved = path.resolve(repoRoot, ...segments);
  if (resolved !== repoRoot && !resolved.startsWith(`${repoRoot}${path.sep}`)) {
    const error = new Error("Resolved path is outside the repository.");
    error.statusCode = 400;
    throw error;
  }
  return resolved;
}

export function normalizeAssetRelativePath(value) {
  const raw = String(value || "")
    .replace(/^res:\/\//, "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
  const normalized = path.posix.normalize(raw);

  if (!normalized || normalized === "." || normalized === ".." || normalized.startsWith("../")) {
    const error = new Error("Asset path must stay inside the repository.");
    error.statusCode = 400;
    throw error;
  }

  const allowed = allowedAssetRoots.some((root) => normalized === root || normalized.startsWith(`${root}/`));
  if (!allowed) {
    const error = new Error(`Asset uploads are only allowed under: ${allowedAssetRoots.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  return normalized;
}

function resourceDir(type) {
  const meta = getResourceMeta(type);
  return resolveRepoPath(...meta.dataDir);
}

function resourceFile(type, id) {
  assertSafeResourceId(id);
  return path.join(resourceDir(type), `${id}.json`);
}

async function readJson(filePath) {
  const contents = await fs.readFile(filePath, "utf8");
  return JSON.parse(contents);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function titleFrom(data, id) {
  return data?.label
    || data?.display_name
    || data?.title
    || data?.name
    || data?.path
    || id;
}

function subtitleFrom(type, data) {
  if (!data || typeof data !== "object") return "JSON";

  if (type === "dialogues") {
    const nodeCount = Array.isArray(data.nodes) ? data.nodes.length : 0;
    const chapterCount = countIdList(readChapterScope(data));
    return `${nodeCount} nodes · ${chapterCount} chapters`;
  }

  if (type === "chapters") {
    const order = Number.isFinite(data.order) ? `order ${data.order}` : "no order";
    const dialogueCount = countIdList(data.dialogues ?? data.dialogue_ids);
    return `${order} · ${dialogueCount} dialogues`;
  }

  if (type === "characters") {
    const portraitCount = data.portraits && typeof data.portraits === "object"
      ? Object.keys(data.portraits).length
      : 0;
    return `${portraitCount} portraits`;
  }

  if (type === "story_assets") {
    return [data.kind, data.path].filter(Boolean).join(" · ") || "asset";
  }

  if (type === "items") {
    return `${countIdList(readChapterScope(data))} chapters`;
  }

  const chapterCount = countIdList(readChapterScope(data));
  if (chapterCount > 0) return `${chapterCount} chapters`;

  return "JSON";
}

function readChapterScope(data) {
  const metadata = data?.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
    ? data.metadata
    : {};
  return data?.chapters ?? data?.chapter_ids ?? metadata.chapters ?? metadata.chapter_ids;
}

function readChapterScopeIds(data) {
  const value = readChapterScope(data);
  const rawIds = Array.isArray(value) ? value : (typeof value === "string" ? [value] : []);
  return [...new Set(rawIds.map((entry) => String(entry || "").trim()).filter(Boolean))];
}

function countIdList(value) {
  if (Array.isArray(value)) return value.filter((entry) => String(entry || "").trim()).length;
  if (typeof value === "string" && value.trim()) return 1;
  return 0;
}

function stringValue(value) {
  return String(value || "").trim();
}

function uniqueStringList(value) {
  const source = Array.isArray(value) ? value : [value];
  return [...new Set(source.map(stringValue).filter(Boolean))];
}

function positiveInteger(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.round(numberValue) : 0;
}

function validationSummaryFrom(type, data) {
  if (!data || typeof data !== "object") return {};

  if (type === "characters") {
    return {
      portraitKeys: data.portraits && typeof data.portraits === "object" && !Array.isArray(data.portraits)
        ? Object.keys(data.portraits)
        : [],
      portraitRigMotionClipIds: collectPortraitRigMotionClipIds(data),
      portraitRigPoseTags: collectPortraitRigPoseTags(data),
      portraitRigDialogueMotion: collectPortraitRigDialogueMotionSummary(data)
    };
  }

  if (type === "items") {
    return {
      image: typeof data.image === "string" ? data.image : ""
    };
  }

  return {};
}

function collectPortraitRigMotionClipIds(data) {
  const ids = new Set();
  const add = (value) => {
    const id = String(value || "").trim();
    if (id) ids.add(id);
  };

  const portraits = data?.portraits && typeof data.portraits === "object" && !Array.isArray(data.portraits)
    ? data.portraits
    : {};
  for (const portrait of Object.values(portraits)) {
    const frame = portraitRigMotionFrameFromPortraitLike(portrait);
    add(frame.clip_id ?? frame.clipId);
  }

  const portraitRig = portraitRigMetadataFromCharacterData(data);
  add(portraitRig.adaptive_clip_id ?? portraitRig.adaptiveClipId);
  const rawDialogueMotion = portraitRig.dialogue_motion_set ?? portraitRig.dialogueMotionSet;
  const dialogueMotion = rawDialogueMotion && typeof rawDialogueMotion === "object" && !Array.isArray(rawDialogueMotion)
    ? rawDialogueMotion
    : {};
  for (const key of ["adaptive_clip_id", "idle_clip_id", "talk_clip_id", "viseme_clip_id"]) {
    add(dialogueMotion[key]);
  }
  for (const key of ["adaptiveClipId", "idleClipId", "talkClipId", "visemeClipId"]) {
    add(dialogueMotion[key]);
  }
  if (Array.isArray(dialogueMotion.clip_ids)) dialogueMotion.clip_ids.forEach(add);
  if (Array.isArray(dialogueMotion.clipIds)) dialogueMotion.clipIds.forEach(add);
  if (Array.isArray(dialogueMotion.source_clip_ids)) dialogueMotion.source_clip_ids.forEach(add);
  if (Array.isArray(dialogueMotion.sourceClipIds)) dialogueMotion.sourceClipIds.forEach(add);
  for (const clip of Array.isArray(portraitRig.clips) ? portraitRig.clips : []) {
    if (!clip || typeof clip !== "object" || Array.isArray(clip)) continue;
    add(clip.id ?? clip.clip_id ?? clip.clipId);
  }
  const portraitRigPortraits = portraitRig.portraits && typeof portraitRig.portraits === "object" && !Array.isArray(portraitRig.portraits)
    ? portraitRig.portraits
    : {};
  for (const portrait of Object.values(portraitRigPortraits)) {
    const frame = portraitRigMotionFrameFromPortraitLike(portrait);
    add(frame.clip_id ?? frame.clipId);
  }
  for (const frameSet of portraitRigMotionFrameSetsFromMetadata(portraitRig)) {
    if (!frameSet || typeof frameSet !== "object" || Array.isArray(frameSet)) continue;
    add(frameSet.clip_id ?? frameSet.clipId);
  }

  return [...ids].sort((a, b) => a.localeCompare(b));
}

function collectPortraitRigDialogueMotionSummary(data) {
  const portraitRig = portraitRigMetadataFromCharacterData(data);
  const rawDialogueMotion = portraitRig.dialogue_motion_set ?? portraitRig.dialogueMotionSet;
  const source = rawDialogueMotion && typeof rawDialogueMotion === "object" && !Array.isArray(rawDialogueMotion)
    ? rawDialogueMotion
    : null;
  if (!source) return inferPortraitRigDialogueMotionSummary(data, portraitRig);
  const motionFrameSets = portraitRigMotionFrameSetsFromMetadata(portraitRig);

  const adaptiveClipId = stringValue(source.adaptive_clip_id ?? source.adaptiveClipId);
  const idleClipId = stringValue(source.idle_clip_id ?? source.idleClipId);
  const talkClipId = stringValue(source.talk_clip_id ?? source.talkClipId);
  const visemeClipId = stringValue(source.viseme_clip_id ?? source.visemeClipId);
  const exportedClipIds = uniqueStringList(source.exported_clip_ids ?? source.exportedClipIds);
  const fallbackExportedClipIds = uniqueStringList(motionFrameSets.flatMap((frameSet) => [frameSet.clip_id ?? frameSet.clipId]));
  const effectiveExportedClipIds = exportedClipIds.length > 0 ? exportedClipIds : fallbackExportedClipIds;
  const completeClipIds = uniqueStringList(source.complete_exported_clip_ids ?? source.completeExportedClipIds);
  const incompleteClipIds = uniqueStringList(source.incomplete_clip_ids ?? source.incompleteClipIds);
  const hasCompleteClipMetadata = source.complete_exported_clip_ids !== undefined
    || source.completeExportedClipIds !== undefined
    || source.incomplete_clip_ids !== undefined
    || source.incompleteClipIds !== undefined;
  const fallbackCompleteClipIds = uniqueStringList(motionFrameSets.flatMap((frameSet) => {
    const states = Array.isArray(frameSet.states) ? frameSet.states : [];
    const frameCount = positiveInteger(frameSet.frame_count ?? frameSet.frameCount) || states.length;
    const expectedFrameCount = positiveInteger(frameSet.expected_frame_count ?? frameSet.expectedFrameCount)
      || positiveInteger(frameSet.frame_count ?? frameSet.frameCount)
      || states.length;
    const clipId = frameSet.clip_id ?? frameSet.clipId;
    return frameCount > 0 && frameCount >= expectedFrameCount ? [clipId] : [];
  }));
  const effectiveCompleteClipIds = hasCompleteClipMetadata
    ? completeClipIds
    : (fallbackCompleteClipIds.length > 0 ? fallbackCompleteClipIds : effectiveExportedClipIds);
  const clipIds = uniqueStringList(source.clip_ids ?? source.clipIds);
  const sourceClipIds = uniqueStringList(source.source_clip_ids ?? source.sourceClipIds);
  const preferredClipIds = uniqueStringList([adaptiveClipId, idleClipId, talkClipId, visemeClipId]);
  const requiredClipIds = uniqueStringList([adaptiveClipId, idleClipId, talkClipId]);
  const missingExportedClipIds = requiredClipIds.filter((clipId) => !effectiveCompleteClipIds.includes(clipId));
  const fallbackExportedFrameCount = motionFrameSets.reduce((total, frameSet) => {
    const states = Array.isArray(frameSet.states) ? frameSet.states : [];
    return total + (positiveInteger(frameSet.frame_count ?? frameSet.frameCount) || states.length);
  }, 0);
  const fallbackExpectedFrameCount = motionFrameSets.reduce((total, frameSet) => {
    const states = Array.isArray(frameSet.states) ? frameSet.states : [];
    return total + (
      positiveInteger(frameSet.expected_frame_count ?? frameSet.expectedFrameCount)
      || positiveInteger(frameSet.frame_count ?? frameSet.frameCount)
      || states.length
    );
  }, 0);

  return {
    ready: Boolean(adaptiveClipId && idleClipId && talkClipId && missingExportedClipIds.length === 0),
    adaptiveClipId,
    idleClipId,
    talkClipId,
    visemeClipId,
    clipIds: clipIds.length > 0 ? clipIds : preferredClipIds,
    sourceClipIds,
    exportedClipIds: effectiveExportedClipIds,
    completeExportedClipIds: effectiveCompleteClipIds,
    incompleteClipIds,
    missingExportedClipIds,
    exportedFrameCount: positiveInteger(source.exported_frame_count ?? source.exportedFrameCount) || fallbackExportedFrameCount,
    expectedFrameCount: positiveInteger(source.expected_frame_count ?? source.expectedFrameCount) || fallbackExpectedFrameCount,
    motionFrameSetCount: positiveInteger(source.motion_frame_set_count ?? source.motionFrameSetCount) || motionFrameSets.length
  };
}

function inferPortraitRigDialogueMotionSummary(data, portraitRig) {
  const frameSummary = collectPortraitRigMotionFrameClipSummary(data, portraitRig);
  if (frameSummary.clipIds.length === 0) return {};
  const adaptiveClipId = preferredPortraitRigMotionClipId(
    frameSummary.clipIds,
    frameSummary.clipLabels,
    ["adaptive_pose", "dialogue_pose"],
    preferredPortraitRigMotionClipId(frameSummary.clipIds, frameSummary.clipLabels, ["adaptive_pose", "dialogue_pose", "idle_loop", "idle", "breath", "talk_loop", "talk"], frameSummary.clipIds[0] || "")
  );
  const idleClipId = preferredPortraitRigMotionClipId(frameSummary.clipIds, frameSummary.clipLabels, ["idle_loop", "idle", "breath"], "");
  const talkClipId = preferredPortraitRigMotionClipId(frameSummary.clipIds, frameSummary.clipLabels, ["talk_loop", "talk", "speak", "mouth"], "");
  const visemeClipId = preferredPortraitRigMotionClipId(frameSummary.clipIds, frameSummary.clipLabels, ["viseme_set", "viseme", "phoneme", "lip"], "");
  const preferredClipIds = uniqueStringList([adaptiveClipId, idleClipId, talkClipId, visemeClipId]);
  const requiredClipIds = uniqueStringList([adaptiveClipId, idleClipId, talkClipId]);
  const missingExportedClipIds = requiredClipIds.filter((clipId) => !frameSummary.completeClipIds.includes(clipId));
  return {
    ready: Boolean(adaptiveClipId && idleClipId && talkClipId && missingExportedClipIds.length === 0),
    inferredFromMotionFrames: true,
    adaptiveClipId,
    idleClipId,
    talkClipId,
    visemeClipId,
    clipIds: preferredClipIds,
    sourceClipIds: frameSummary.clipIds,
    exportedClipIds: preferredClipIds.filter((clipId) => frameSummary.clipIds.includes(clipId)),
    completeExportedClipIds: preferredClipIds.filter((clipId) => frameSummary.completeClipIds.includes(clipId)),
    incompleteClipIds: preferredClipIds.filter((clipId) => frameSummary.incompleteClipIds.includes(clipId)),
    missingExportedClipIds,
    exportedFrameCount: frameSummary.exportedFrameCount,
    expectedFrameCount: frameSummary.expectedFrameCount,
    motionFrameSetCount: frameSummary.motionFrameSetCount
  };
}

function collectPortraitRigMotionFrameClipSummary(data, portraitRig) {
  const clipStats = new Map();
  const clipLabels = new Map();
  const seenFrames = new Set();
  let motionFrameSetCount = 0;

  const addFrame = (state, frameValue, fallback = {}) => {
    const frame = frameValue && typeof frameValue === "object" && !Array.isArray(frameValue) ? frameValue : {};
    const clipId = stringValue(frame.clip_id ?? frame.clipId ?? fallback.clip_id ?? fallback.clipId);
    if (!clipId) return;
    const key = `${stringValue(state) || "frame"}:${clipId}`;
    if (seenFrames.has(key)) return;
    seenFrames.add(key);
    const label = stringValue(frame.clip_label ?? frame.clipLabel ?? frame.label ?? fallback.clip_label ?? fallback.clipLabel ?? fallback.label ?? clipId);
    if (label && !clipLabels.has(clipId)) clipLabels.set(clipId, label);
    const existing = clipStats.get(clipId) || { count: 0, expected: 0 };
    existing.count += 1;
    existing.expected = Math.max(
      existing.expected,
      positiveInteger(frame.frame_count ?? frame.frameCount),
      positiveInteger(fallback.expected_frame_count ?? fallback.expectedFrameCount),
      positiveInteger(fallback.frame_count ?? fallback.frameCount)
    );
    clipStats.set(clipId, existing);
  };

  const portraits = data?.portraits && typeof data.portraits === "object" && !Array.isArray(data.portraits)
    ? data.portraits
    : {};
  for (const [state, portrait] of Object.entries(portraits)) {
    addFrame(state, portraitRigMotionFrameFromPortraitLike(portrait));
  }

  const portraitRigPortraits = portraitRig?.portraits && typeof portraitRig.portraits === "object" && !Array.isArray(portraitRig.portraits)
    ? portraitRig.portraits
    : {};
  for (const [state, portrait] of Object.entries(portraitRigPortraits)) {
    addFrame(state, portraitRigMotionFrameFromPortraitLike(portrait));
  }

  for (const frameSet of portraitRigMotionFrameSetsFromMetadata(portraitRig)) {
    if (!frameSet || typeof frameSet !== "object" || Array.isArray(frameSet)) continue;
    const clipId = stringValue(frameSet.clip_id ?? frameSet.clipId);
    if (!clipId) continue;
    motionFrameSetCount += 1;
    const states = Array.isArray(frameSet.states) ? frameSet.states : [];
    const fallback = {
      clip_id: clipId,
      clip_label: frameSet.clip_label ?? frameSet.clipLabel ?? frameSet.label ?? clipId,
      expected_frame_count: frameSet.expected_frame_count ?? frameSet.expectedFrameCount,
      frame_count: frameSet.frame_count ?? frameSet.frameCount ?? states.length
    };
    states.forEach((state, index) => {
      if (!state || typeof state !== "object" || Array.isArray(state)) return;
      addFrame(state.state ?? state.key ?? `frame_${index + 1}`, portraitRigMotionFrameFromPortraitLike(state), fallback);
    });
  }

  const clipIds = [...clipStats.keys()].sort((a, b) => a.localeCompare(b));
  const completeClipIds = [];
  const incompleteClipIds = [];
  let expectedFrameCount = 0;
  for (const clipId of clipIds) {
    const stats = clipStats.get(clipId);
    const expected = Math.max(stats.expected, stats.count);
    expectedFrameCount += expected;
    if (stats.count > 0 && stats.count >= expected) completeClipIds.push(clipId);
    else incompleteClipIds.push(clipId);
  }
  return {
    clipIds,
    clipLabels,
    completeClipIds,
    incompleteClipIds,
    exportedFrameCount: seenFrames.size,
    expectedFrameCount,
    motionFrameSetCount: Math.max(motionFrameSetCount, clipIds.length)
  };
}

function preferredPortraitRigMotionClipId(clipIds, clipLabels, keywords, fallback = "") {
  for (const keyword of keywords) {
    const exact = clipIds.find((clipId) => clipId.toLowerCase() === keyword);
    if (exact) return exact;
  }
  for (const keyword of keywords) {
    const match = clipIds.find((clipId) => `${clipId} ${clipLabels.get(clipId) || ""}`.toLowerCase().includes(keyword));
    if (match) return match;
  }
  return fallback;
}

function collectPortraitRigPoseTags(data) {
  const tags = new Set();
  const add = (value) => {
    const tag = String(value || "").trim();
    if (tag) tags.add(tag);
  };
  const addList = (value) => {
    if (Array.isArray(value)) value.forEach(add);
  };
  const addScoreKeys = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    Object.keys(value).forEach(add);
  };

  const portraits = data?.portraits && typeof data.portraits === "object" && !Array.isArray(data.portraits)
    ? data.portraits
    : {};
  for (const portrait of Object.values(portraits)) {
    const frame = portraitRigMotionFrameFromPortraitLike(portrait);
    addList(frame.pose_tags ?? frame.poseTags);
    addScoreKeys(frame.pose_score ?? frame.poseScore);
    const expressionPreset = portraitRigExpressionPresetFromPortraitLike(portrait);
    addList(expressionPreset.pose_tags ?? expressionPreset.poseTags);
    addScoreKeys(expressionPreset.pose_score ?? expressionPreset.poseScore);
  }

  const portraitRig = portraitRigMetadataFromCharacterData(data);
  const portraitRigPortraits = portraitRig.portraits && typeof portraitRig.portraits === "object" && !Array.isArray(portraitRig.portraits)
    ? portraitRig.portraits
    : {};
  for (const portrait of Object.values(portraitRigPortraits)) {
    const frame = portraitRigMotionFrameFromPortraitLike(portrait);
    addList(frame.pose_tags ?? frame.poseTags);
    addScoreKeys(frame.pose_score ?? frame.poseScore);
    const expressionPreset = portraitRigExpressionPresetFromPortraitLike(portrait);
    addList(expressionPreset.pose_tags ?? expressionPreset.poseTags);
    addScoreKeys(expressionPreset.pose_score ?? expressionPreset.poseScore);
  }
  for (const preset of [
    ...(Array.isArray(portraitRig.expression_presets) ? portraitRig.expression_presets : []),
    ...(Array.isArray(portraitRig.expressionPresets) ? portraitRig.expressionPresets : [])
  ]) {
    if (!preset || typeof preset !== "object" || Array.isArray(preset)) continue;
    addList(preset.pose_tags ?? preset.poseTags);
    addScoreKeys(preset.pose_score ?? preset.poseScore);
  }
  for (const frameSet of portraitRigMotionFrameSetsFromMetadata(portraitRig)) {
    if (!frameSet || typeof frameSet !== "object" || Array.isArray(frameSet)) continue;
    addList(frameSet.pose_tags ?? frameSet.poseTags);
    for (const state of Array.isArray(frameSet.states) ? frameSet.states : []) {
      if (!state || typeof state !== "object" || Array.isArray(state)) continue;
      addList(state.pose_tags ?? state.poseTags);
      addScoreKeys(state.pose_score ?? state.poseScore);
      const expressionPreset = portraitRigExpressionPresetFromPortraitLike(state);
      addList(expressionPreset.pose_tags ?? expressionPreset.poseTags);
      addScoreKeys(expressionPreset.pose_score ?? expressionPreset.poseScore);
    }
  }

  return [...tags].sort((a, b) => a.localeCompare(b)).slice(0, 128);
}

function portraitRigMotionFrameFromPortraitLike(portrait) {
  if (!portrait || typeof portrait !== "object" || Array.isArray(portrait)) return {};
  const frame = portrait.portrait_rig_motion_frame ?? portrait.portraitRigMotionFrame ?? portrait.motion_frame ?? portrait.motionFrame;
  return frame && typeof frame === "object" && !Array.isArray(frame) ? frame : {};
}

function portraitRigExpressionPresetFromPortraitLike(portrait) {
  if (!portrait || typeof portrait !== "object" || Array.isArray(portrait)) return {};
  const preset = portrait.portrait_rig_expression_preset ?? portrait.portraitRigExpressionPreset ?? portrait.expression_preset ?? portrait.expressionPreset;
  return preset && typeof preset === "object" && !Array.isArray(preset) ? preset : {};
}

function portraitRigMetadataFromCharacterData(data) {
  const metadata = data?.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata) ? data.metadata : {};
  const portraitRig = metadata.portrait_rig ?? metadata.portraitRig;
  return portraitRig && typeof portraitRig === "object" && !Array.isArray(portraitRig) ? portraitRig : {};
}

function portraitRigMotionFrameSetsFromMetadata(portraitRig) {
  if (!portraitRig || typeof portraitRig !== "object" || Array.isArray(portraitRig)) return [];
  return [
    ...(Array.isArray(portraitRig.motion_frame_sets) ? portraitRig.motion_frame_sets : []),
    ...(Array.isArray(portraitRig.motionFrameSets) ? portraitRig.motionFrameSets : [])
  ].filter((frameSet) => frameSet && typeof frameSet === "object" && !Array.isArray(frameSet));
}

export function summarizeResource(type, id, data) {
  const summary = {
    id,
    type,
    title: titleFrom(data, id),
    subtitle: subtitleFrom(type, data),
    chapterIds: readChapterScopeIds(data),
    validation: validationSummaryFrom(type, data),
    hasIdMismatch: data?.id && data.id !== id
  };
  if (type === "characters") {
    summary.nameColor = String(data?.name_color || "").trim() || "#ffffff";
  }
  return summary;
}

export async function listResources(type) {
  const dir = resourceDir(type);
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });

  const summaries = await Promise.all(entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith(".") && name.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b))
    .map(async (name) => {
      const id = path.basename(name, ".json");
      const data = await readJson(path.join(dir, name));
      return summarizeResource(type, id, data);
    }));

  return summaries;
}

export async function loadResource(type, id) {
  const filePath = resourceFile(type, id);
  try {
    return await readJson(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      error.statusCode = 404;
      error.message = `Resource not found: ${type}/${id}`;
    }
    throw error;
  }
}

export async function saveResource(type, id, data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    const error = new Error("Resource body must be a JSON object.");
    error.statusCode = 400;
    throw error;
  }

  const dir = resourceDir(type);
  const filePath = resourceFile(type, id);
  const nextId = assertSafeResourceId(String(data.id || id));
  const nextFilePath = resourceFile(type, nextId);
  const nextData = { ...data, id: nextId };
  const tmpPath = path.join(dir, `.${nextId}.${process.pid}.${Date.now()}.tmp`);

  if (nextId !== id) {
    if (!(await fileExists(filePath))) {
      const error = new Error(`Resource not found: ${type}/${id}`);
      error.statusCode = 404;
      throw error;
    }
    if (await fileExists(nextFilePath)) {
      const error = new Error(`Resource already exists: ${type}/${nextId}`);
      error.statusCode = 409;
      throw error;
    }
  }

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(tmpPath, `${JSON.stringify(nextData, null, 2)}\n`, "utf8");
  await fs.rename(tmpPath, nextFilePath);
  if (nextId !== id) {
    await fs.unlink(filePath);
  }

  return summarizeResource(type, nextId, nextData);
}

export async function deleteResource(type, id) {
  const filePath = resourceFile(type, id);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      error.statusCode = 404;
      error.message = `Resource not found: ${type}/${id}`;
    }
    throw error;
  }

  return { id, type };
}

export async function writeProjectAsset(relativePath, dataBase64) {
  const normalized = normalizeAssetRelativePath(relativePath);
  if (typeof dataBase64 !== "string" || !dataBase64.trim()) {
    const error = new Error("dataBase64 is required.");
    error.statusCode = 400;
    throw error;
  }

  const filePath = resolveRepoPath(...normalized.split("/"));
  const buffer = Buffer.from(dataBase64, "base64");
  if (buffer.byteLength === 0) {
    const error = new Error("Uploaded file is empty.");
    error.statusCode = 400;
    throw error;
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tmpPath, buffer);
  await fs.rename(tmpPath, filePath);

  return {
    relativePath: normalized,
    resPath: `res://${normalized}`,
    bytes: buffer.byteLength
  };
}

export async function createResource(type, data = {}) {
  const id = assertSafeResourceId(data.id || randomUUID());
  const filePath = resourceFile(type, id);

  if (await fileExists(filePath)) {
    const error = new Error(`Resource already exists: ${type}/${id}`);
    error.statusCode = 409;
    throw error;
  }

  const meta = getResourceMeta(type);
  const nextData = { ...meta.empty(id), ...data, id };
  const summary = await saveResource(type, id, nextData);

  return { summary, data: nextData };
}

export async function projectSummary() {
  const entries = await Promise.all(Object.entries(resourceTypes).map(async ([type, meta]) => {
    const resources = await listResources(type);
    return [type, {
      type,
      label: meta.label,
      singularLabel: meta.singularLabel,
      count: resources.length,
      resources
    }];
  }));

  return {
    repoRoot,
    editorRoot,
    generatedAt: new Date().toISOString(),
    resources: Object.fromEntries(entries)
  };
}

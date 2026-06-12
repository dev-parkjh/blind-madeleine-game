import { asArray } from "../../lib/resourceConfig";
import { fileExtension, safeSegment } from "../../lib/files";
import { clampNumber, normalizeBooleanFlag, normalizeNumber, normalizeRotationDegrees, round4Number } from "../../lib/numeric";
import { normalizeJsonObject } from "../../lib/records";
import type { ResourceRecord } from "../../types";

export const rigAngleMin = -45;
export const rigAngleMax = 45;
export const rigDefaultStateId = "default";

export function characterRigPartUploadPath(rigId: unknown, partId: unknown, file: File) {
  return `assets/character_rigs/${safeSegment(rigId, "rig")}/parts/${safeSegment(partId, "part")}.${fileExtension(file)}`;
}

export function characterRigGuideUploadPath(rigId: unknown, guideId: unknown, file: File) {
  return `assets/character_rigs/${safeSegment(rigId, "rig")}/guides/${safeSegment(guideId, "guide")}.${fileExtension(file)}`;
}

export function normalizeCharacterRigDraftForSave(rig: ResourceRecord): ResourceRecord {
  const next: ResourceRecord = {
    ...rig,
    display_name: String(rig.display_name || rig.id || "Character rig").trim(),
    character_id: String(rig.character_id || "").trim(),
    canvas: normalizeRigCanvas(rig.canvas),
    parts: normalizeRigParts(rig.parts),
    states: normalizeRigStates(rig.states),
    angle_tracks: normalizeTrackRecord(rig.angle_tracks),
    motion_tracks: normalizeMotionTracks(rig.motion_tracks),
    editor: normalizeRigEditorData(rig.editor),
    metadata: normalizeJsonObject(rig.metadata)
  };
  if (!next.character_id) delete next.character_id;
  return next;
}

export function normalizeRigCanvas(value: unknown): ResourceRecord {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as ResourceRecord : {};
  return {
    width: normalizeNumber(source.width, 1200, 1, 10000),
    height: normalizeNumber(source.height, 1800, 1, 10000),
    origin: normalizeVector(source.origin, [600, 900], -10000, 10000)
  };
}

export function normalizeRigParts(value: unknown): ResourceRecord[] {
  return asArray<ResourceRecord>(value)
    .filter((part) => part && typeof part === "object")
    .map((part, index) => {
      const id = safeSegment(part.id || `part_${index + 1}`, `part_${index + 1}`);
      const next: ResourceRecord = {
        id,
        name: String(part.name || id),
        path: String(part.path || "").trim(),
        parent_id: String(part.parent_id || "").trim(),
        z_index: normalizeNumber(part.z_index, index, -10000, 10000),
        pivot: normalizeVector(part.pivot, [0, 0], -10000, 10000),
        base_transform: normalizeTransform(part.base_transform),
        mesh: normalizeMesh(part.mesh),
        physics: normalizePhysics(part.physics),
        role: String(part.role || "").trim()
      };
      if (!next.parent_id) delete next.parent_id;
      if (!next.role) delete next.role;
      if (Object.keys(next.mesh).length === 0) delete next.mesh;
      if (Object.keys(next.physics).length === 0) delete next.physics;
      return next;
    });
}

export function normalizeTransform(value: unknown): ResourceRecord {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as ResourceRecord : {};
  return {
    position: normalizeVector(source.position, [0, 0], -10000, 10000),
    rotation: normalizeRotationDegrees(source.rotation),
    scale: normalizeVector(source.scale, [1, 1], -20, 20),
    opacity: clampNumber(source.opacity, 0, 1, 1)
  };
}

export function normalizeMesh(value: unknown): ResourceRecord {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as ResourceRecord : {};
  const vertices = asArray<unknown>(source.vertices).map((point) => normalizeVector(point, [0, 0], -10000, 10000));
  const uvs = asArray<unknown>(source.uvs).map((point) => normalizeVector(point, [0, 0], -10000, 10000));
  const triangles = asArray<unknown>(source.triangles)
    .map((triangle) => Array.isArray(triangle) ? triangle.slice(0, 3).map((entry) => normalizeNumber(entry, 0, 0)) : [])
    .filter((triangle) => triangle.length === 3);
  const next: ResourceRecord = {};
  if (vertices.length > 0) next.vertices = vertices;
  if (uvs.length > 0) next.uvs = uvs;
  if (triangles.length > 0) next.triangles = triangles;
  return next;
}

export function normalizePhysics(value: unknown): ResourceRecord {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as ResourceRecord : {};
  const enabled = normalizeBooleanFlag(source.enabled, false);
  const next: ResourceRecord = {};
  if (enabled) next.enabled = true;
  for (const [key, fallback] of Object.entries({ mass: 1, stiffness: 24, damping: 8, gravity: 18, weight: 1 })) {
    const current = normalizeNumber(source[key], fallback, key === "gravity" ? -1000 : 0, key === "stiffness" ? 1000 : 100);
    if (enabled || Math.abs(current - fallback) > 0.0001) next[key] = current;
  }
  return next;
}

export function normalizeRigStates(value: unknown): ResourceRecord {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const next: ResourceRecord = {};
  for (const [rawKey, rawState] of Object.entries(source)) {
    const key = safeSegment(rawKey, rigDefaultStateId);
    const state = rawState && typeof rawState === "object" && !Array.isArray(rawState) ? rawState as ResourceRecord : {};
    next[key] = {
      label: String(state.label || key),
      part_overrides: normalizeTrackRecord(state.part_overrides)
    };
  }
  if (!next[rigDefaultStateId]) next[rigDefaultStateId] = { label: rigDefaultStateId, part_overrides: {} };
  return next;
}

export function normalizeTrackRecord(value: unknown): ResourceRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? JSON.parse(JSON.stringify(value)) as ResourceRecord
    : {};
}

export function normalizeMotionTracks(value: unknown): ResourceRecord {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as ResourceRecord : {};
  return {
    idle: {
      enabled: normalizeBooleanFlag(source.idle?.enabled, true),
      amplitude: normalizeNumber(source.idle?.amplitude, 4, 0, 100),
      frequency: normalizeNumber(source.idle?.frequency, 0.45, 0, 20)
    },
    blink: {
      enabled: normalizeBooleanFlag(source.blink?.enabled, true),
      interval: normalizeNumber(source.blink?.interval, 4, 0.1, 60),
      duration: normalizeNumber(source.blink?.duration, 0.14, 0.01, 5),
      closed: String(source.blink?.closed || "eye_closed"),
      open: String(source.blink?.open || "eye_open")
    },
    mouth: {
      enabled: normalizeBooleanFlag(source.mouth?.enabled, true),
      closed: String(source.mouth?.closed || "mouth_closed"),
      open: String(source.mouth?.open || "mouth_open"),
      amplitude: normalizeNumber(source.mouth?.amplitude, 1, 0, 10)
    }
  };
}

export function normalizeRigEditorData(value: unknown): ResourceRecord {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as ResourceRecord : {};
  const guides = source.guides && typeof source.guides === "object" && !Array.isArray(source.guides)
    ? source.guides as ResourceRecord
    : {};
  return {
    guides: {
      base: normalizeGuide(guides.base),
      angles: normalizeGuideMap(guides.angles)
    }
  };
}

export function normalizeGuideMap(value: unknown): ResourceRecord {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const next: ResourceRecord = {};
  for (const [key, guide] of Object.entries(source)) {
    const angle = clampNumber(key, rigAngleMin, rigAngleMax, 0);
    next[String(angle)] = normalizeGuide(guide);
  }
  return next;
}

export function normalizeGuide(value: unknown): ResourceRecord {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as ResourceRecord : {};
  return {
    enabled: normalizeBooleanFlag(source.enabled, false),
    path: String(source.path || "").trim(),
    position: normalizeVector(source.position, [0.5, 0.5], -2, 3),
    rotation: normalizeRotationDegrees(source.rotation),
    opacity: clampNumber(source.opacity, 0, 1, 0.55),
    scale: normalizeNumber(source.scale, 1, 0.01, 20)
  };
}

export function normalizeVector(value: unknown, fallback: [number, number], min?: number, max?: number): [number, number] {
  const source = Array.isArray(value)
    ? value
    : value && typeof value === "object"
      ? [(value as ResourceRecord).x ?? (value as ResourceRecord)[0], (value as ResourceRecord).y ?? (value as ResourceRecord)[1]]
      : fallback;
  return [
    round4Number(normalizeNumber(source[0], fallback[0], min, max)),
    round4Number(normalizeNumber(source[1], fallback[1], min, max))
  ];
}

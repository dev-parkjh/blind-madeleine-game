import { safeSegment } from "../../lib/files";
import { normalizeBooleanFlag, normalizeNumber, round4Number, roundForInput } from "../../lib/numeric";
import type { ResourceRecord } from "../../types";
import { getPortraitCenterPoint } from "./portraitModel";
import {
  getLive2dCanvasSize,
  getLive2dParts,
  getLive2dPoint,
  live2dCanvasHeightDefault,
  live2dCanvasWidthDefault,
  live2dRecordForEditor
} from "./live2dModelCore";
import {
  getLive2dMotionParts,
  getLive2dMotions,
  live2dMotionFieldDefaults,
  live2dMotionFieldLimits,
  live2dMotionFields,
  live2dMotionSpeedDefault
} from "./live2dMotionModel";
import {
  getLive2dAngleMax,
  getLive2dAngleParts,
  getLive2dAngleRig,
  live2dAngleFieldDefaults,
  live2dAngleFieldLimits,
  live2dAngleFields
} from "./live2dAngleModel";

export function normalizeLive2dForSave(value: unknown): ResourceRecord | null {
  const source = live2dRecordForEditor(value);
  const parts = getLive2dParts(source.parts)
    .map(normalizeLive2dPartForSave)
    .filter((part): part is ResourceRecord => part !== null);
  const motions = normalizeLive2dMotionsForSave(source.motions, parts);
  const angleRig = normalizeLive2dAngleRigForSave(source.angle_rig, parts);
  const canvasSize = getLive2dCanvasSize(source.canvas_size);
  const center = getPortraitCenterPoint(source.center ?? source.face_center ?? [0.5, 0.34]);
  const enabled = normalizeBooleanFlag(source.enabled);
  const defaultMotion = String(source.default_motion || "").trim();

  if (!enabled && parts.length === 0 && Object.keys(motions).length === 0 && angleRig === null && !defaultMotion) {
    return null;
  }

  const next: ResourceRecord = {
    enabled,
    canvas_size: [roundForInput(canvasSize.x), roundForInput(canvasSize.y)],
    center: [round4Number(center.x), round4Number(center.y)],
    parts
  };
  if (defaultMotion) next.default_motion = safeSegment(defaultMotion, "default");
  if (angleRig !== null) next.angle_rig = angleRig;
  if (Object.keys(motions).length > 0) next.motions = motions;
  return next;
}

export function normalizeLive2dPartForSave(value: ResourceRecord): ResourceRecord | null {
  const id = safeSegment(value.id || "", "");
  const path = String(value.path || "").trim();
  if (!id || !path) return null;
  const position = getLive2dPoint(value.position, live2dCanvasWidthDefault * 0.5, live2dCanvasHeightDefault * 0.5);
  const anchor = getLive2dPoint(value.anchor, 0.5, 0.5);
  const scale = getLive2dPoint(value.scale, 1, 1);
  const skew = getLive2dPoint(value.skew, 0, 0);
  const next: ResourceRecord = {
    id,
    path,
    position: [roundForInput(position.x), roundForInput(position.y)],
    anchor: [round4Number(anchor.x), round4Number(anchor.y)],
    scale: [round4Number(scale.x), round4Number(scale.y)],
    skew: [roundForInput(skew.x), roundForInput(skew.y)],
    rotation: roundForInput(normalizeNumber(value.rotation, 0)),
    opacity: round4Number(normalizeNumber(value.opacity ?? value.alpha, 1, 0, 1)),
    z_index: Math.round(normalizeNumber(value.z_index ?? value.order, 0, -100, 100))
  };
  return next;
}

export function normalizeLive2dMotionsForSave(value: unknown, parts: ResourceRecord[]) {
  const motions = getLive2dMotions(value);
  const knownPartIds = new Set(parts.map((part) => String(part.id || "")).filter(Boolean));
  const next: Record<string, ResourceRecord> = {};
  for (const [key, motion] of Object.entries(motions)) {
    const cleanKey = safeSegment(key, "");
    if (!cleanKey) continue;
    const speed = normalizeNumber(motion.speed, live2dMotionSpeedDefault, 0.1, 5);
    const motionParts = getLive2dMotionParts(motion.parts);
    const nextParts: Record<string, ResourceRecord> = {};
    for (const [partId, entry] of Object.entries(motionParts)) {
      const cleanPartId = safeSegment(partId, "");
      if (!cleanPartId || !knownPartIds.has(cleanPartId)) continue;
      const normalized = normalizeLive2dMotionPartForSave(entry);
      if (Object.keys(normalized).length > 0) nextParts[cleanPartId] = normalized;
    }
    if (Object.keys(nextParts).length === 0 && Math.abs(speed - live2dMotionSpeedDefault) < 0.0001) continue;
    next[cleanKey] = { speed, parts: nextParts };
  }
  return next;
}

export function normalizeLive2dMotionPartForSave(value: ResourceRecord) {
  const next: ResourceRecord = {};
  for (const field of live2dMotionFields) {
    const limits = live2dMotionFieldLimits[field];
    const normalized = normalizeNumber(value[field], live2dMotionFieldDefaults[field], limits.min, limits.max);
    const defaultValue = live2dMotionFieldDefaults[field];
    if (Math.abs(normalized - defaultValue) >= 0.0001) {
      next[field] = field === "frequency" || field === "phase" || field === "scale" || field === "opacity"
        ? round4Number(normalized)
        : roundForInput(normalized);
    }
  }
  return next;
}

export function normalizeLive2dAngleRigForSave(value: unknown, parts: ResourceRecord[]): ResourceRecord | null {
  const rig = getLive2dAngleRig(value);
  const enabled = normalizeBooleanFlag(rig.enabled, false);
  const maxAngle = getLive2dAngleMax(rig);
  const mirrorX = normalizeBooleanFlag(rig.mirror_x ?? rig.mirror, true);
  const knownPartIds = new Set(parts.map((part) => String(part.id || "").trim()).filter(Boolean));
  const angleParts = getLive2dAngleParts(rig.parts);
  const nextParts: Record<string, ResourceRecord> = {};
  for (const [partId, entry] of Object.entries(angleParts)) {
    const cleanPartId = safeSegment(partId, "");
    if (!cleanPartId || !knownPartIds.has(cleanPartId)) continue;
    const normalized = normalizeLive2dAnglePartForSave(entry);
    if (Object.keys(normalized).length > 0) nextParts[cleanPartId] = normalized;
  }

  if (!enabled && Object.keys(nextParts).length === 0 && Math.abs(maxAngle - 45) < 0.0001 && mirrorX) {
    return null;
  }

  const next: ResourceRecord = {
    enabled,
    max_angle: roundForInput(maxAngle),
    mirror_x: mirrorX
  };
  if (Object.keys(nextParts).length > 0) next.parts = nextParts;
  return next;
}

export function normalizeLive2dAnglePartForSave(value: ResourceRecord) {
  const next: ResourceRecord = {};
  for (const field of live2dAngleFields) {
    const limits = live2dAngleFieldLimits[field];
    const normalized = normalizeNumber(value[field], live2dAngleFieldDefaults[field], limits.min, limits.max);
    const defaultValue = live2dAngleFieldDefaults[field];
    if (Math.abs(normalized - defaultValue) < 0.0001) continue;
    const outputKey = field === "scaleX" ? "scale_x" : field === "scaleY" ? "scale_y" : field === "skewX" ? "skew_x" : field === "skewY" ? "skew_y" : field;
    next[outputKey] = field === "scaleX" || field === "scaleY" || field === "opacity"
      ? round4Number(normalized)
      : roundForInput(normalized);
  }
  const positive = normalizeLive2dAngleDirectionForSave(value.positive);
  const negative = normalizeLive2dAngleDirectionForSave(value.negative);
  if (positive !== null) next.positive = positive;
  if (negative !== null) next.negative = negative;
  return next;
}

export function normalizeLive2dAngleDirectionForSave(value: unknown): ResourceRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const normalized = normalizeLive2dAnglePartForSave(value as ResourceRecord);
  return Object.keys(normalized).length > 0 ? normalized : null;
}

import { clampNumber, normalizeBooleanFlag, normalizeNumber, round4Number, roundForInput } from "../../lib/numeric";
import type { ResourceRecord } from "../../types";
import {
  getLive2dPoint,
  live2dCanvasHeightDefault,
  live2dCanvasWidthDefault
} from "./live2dModelCore";

export const live2dAngleFields = ["x", "y", "rotation", "scaleX", "scaleY", "skewX", "skewY", "opacity"] as const;
export type Live2dAngleField = typeof live2dAngleFields[number];

export const live2dAngleFieldDefaults: Record<Live2dAngleField, number> = {
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 0,
  scaleY: 0,
  skewX: 0,
  skewY: 0,
  opacity: 0
};

export const live2dAngleFieldLimits: Record<Live2dAngleField, { min: number; max: number; step: number }> = {
  x: { min: -500, max: 500, step: 1 },
  y: { min: -500, max: 500, step: 1 },
  rotation: { min: -60, max: 60, step: 0.5 },
  scaleX: { min: -0.75, max: 0.75, step: 0.01 },
  scaleY: { min: -0.75, max: 0.75, step: 0.01 },
  skewX: { min: -45, max: 45, step: 0.5 },
  skewY: { min: -45, max: 45, step: 0.5 },
  opacity: { min: -1, max: 1, step: 0.01 }
};

export function getLive2dAngleRig(value: unknown): ResourceRecord {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as ResourceRecord
    : {};
  return {
    enabled: normalizeBooleanFlag(source.enabled, false),
    max_angle: getLive2dAngleMax(source),
    mirror_x: normalizeBooleanFlag(source.mirror_x ?? source.mirror, true),
    parts: getLive2dAngleParts(source.parts)
  };
}

export function getLive2dAngleParts(value: unknown): Record<string, ResourceRecord> {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const result: Record<string, ResourceRecord> = {};
  for (const [key, entry] of Object.entries(source)) {
    const cleanKey = String(key || "").trim();
    if (!cleanKey || !entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    result[cleanKey] = normalizeLive2dAngleEntryForEditor(entry as ResourceRecord);
  }
  return result;
}

export function normalizeLive2dAngleEntryForEditor(entry: ResourceRecord): ResourceRecord {
  const next = normalizeLive2dAngleFlatEntryForEditor(entry);
  const positive = normalizeLive2dAngleDirectionForEditor(entry.positive ?? entry.right);
  const negative = normalizeLive2dAngleDirectionForEditor(entry.negative ?? entry.left);
  if (positive !== null) next.positive = positive;
  if (negative !== null) next.negative = negative;
  return next;
}

export function normalizeLive2dAngleDirectionForEditor(entry: unknown): ResourceRecord | null {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
  return normalizeLive2dAngleFlatEntryForEditor(entry as ResourceRecord);
}

export function normalizeLive2dAngleFlatEntryForEditor(entry: ResourceRecord): ResourceRecord {
  const scale = getLive2dPoint(
    entry.scale,
    normalizeNumber(entry.scale_x ?? entry.scaleX ?? entry.sx, 0, live2dAngleFieldLimits.scaleX.min, live2dAngleFieldLimits.scaleX.max),
    normalizeNumber(entry.scale_y ?? entry.scaleY ?? entry.sy, 0, live2dAngleFieldLimits.scaleY.min, live2dAngleFieldLimits.scaleY.max)
  );
  const skew = getLive2dPoint(
    entry.skew,
    normalizeNumber(entry.skew_x ?? entry.skewX, 0, live2dAngleFieldLimits.skewX.min, live2dAngleFieldLimits.skewX.max),
    normalizeNumber(entry.skew_y ?? entry.skewY, 0, live2dAngleFieldLimits.skewY.min, live2dAngleFieldLimits.skewY.max)
  );
  return {
    x: normalizeNumber(entry.x ?? entry.offset_x, 0, live2dAngleFieldLimits.x.min, live2dAngleFieldLimits.x.max),
    y: normalizeNumber(entry.y ?? entry.offset_y, 0, live2dAngleFieldLimits.y.min, live2dAngleFieldLimits.y.max),
    rotation: normalizeNumber(entry.rotation ?? entry.rotation_degrees, 0, live2dAngleFieldLimits.rotation.min, live2dAngleFieldLimits.rotation.max),
    scaleX: normalizeNumber(scale.x, 0, live2dAngleFieldLimits.scaleX.min, live2dAngleFieldLimits.scaleX.max),
    scaleY: normalizeNumber(scale.y, 0, live2dAngleFieldLimits.scaleY.min, live2dAngleFieldLimits.scaleY.max),
    skewX: normalizeNumber(skew.x, 0, live2dAngleFieldLimits.skewX.min, live2dAngleFieldLimits.skewX.max),
    skewY: normalizeNumber(skew.y, 0, live2dAngleFieldLimits.skewY.min, live2dAngleFieldLimits.skewY.max),
    opacity: normalizeNumber(entry.opacity ?? entry.alpha, 0, live2dAngleFieldLimits.opacity.min, live2dAngleFieldLimits.opacity.max)
  };
}

export function getLive2dAnglePartEntry(angleRig: ResourceRecord, partId: string): ResourceRecord {
  const parts = getLive2dAngleParts(angleRig.parts);
  return parts[partId] || {};
}

export function getLive2dAngleMax(angleRig: ResourceRecord): number {
  return normalizeNumber(angleRig.max_angle ?? angleRig.max, 45, 1, 45);
}

export function applyLive2dAngleRigToEditorParts(parts: ResourceRecord[], angleRig: ResourceRecord, angle: number): ResourceRecord[] {
  if (!normalizeBooleanFlag(angleRig.enabled, false)) return parts;
  const angleParts = getLive2dAngleParts(angleRig.parts);
  if (Object.keys(angleParts).length === 0) return parts;
  const maxAngle = getLive2dAngleMax(angleRig);
  const amount = clampNumber(angle / Math.max(maxAngle, 1), -1, 1, 0);
  if (Math.abs(amount) < 0.0001) return parts;
  const magnitude = Math.abs(amount);
  const signedAmount = normalizeBooleanFlag(angleRig.mirror_x ?? angleRig.mirror, true) ? amount : magnitude;
  return parts.map((part) => {
    const partId = String(part.id || "").trim();
    const entry = partId ? angleParts[partId] : null;
    if (!entry) return part;
    const position = getLive2dPoint(part.position, live2dCanvasWidthDefault * 0.5, live2dCanvasHeightDefault * 0.5);
    const scale = getLive2dPoint(part.scale, 1, 1);
    const skew = getLive2dPoint(part.skew, 0, 0);
    const directionEntry = entry[signedAmount >= 0 ? "positive" : "negative"];
    const direction = directionEntry && typeof directionEntry === "object" && !Array.isArray(directionEntry)
      ? directionEntry as ResourceRecord
      : null;
    const nextPosition = [
      position.x + normalizeNumber(entry.x, 0) * signedAmount,
      position.y + normalizeNumber(entry.y, 0) * magnitude
    ];
    const nextScale = [
      Math.max(0.01, scale.x + normalizeNumber(entry.scaleX, 0) * magnitude),
      Math.max(0.01, scale.y + normalizeNumber(entry.scaleY, 0) * magnitude)
    ];
    const nextSkew = [
      skew.x + normalizeNumber(entry.skewX, 0) * signedAmount,
      skew.y + normalizeNumber(entry.skewY, 0) * signedAmount
    ];
    let nextRotation = normalizeNumber(part.rotation, 0) + normalizeNumber(entry.rotation, 0) * signedAmount;
    let nextOpacity = normalizeNumber(part.opacity ?? part.alpha, 1, 0, 1) + normalizeNumber(entry.opacity, 0) * magnitude;
    if (direction) {
      nextPosition[0] += normalizeNumber(direction.x, 0) * magnitude;
      nextPosition[1] += normalizeNumber(direction.y, 0) * magnitude;
      nextScale[0] = Math.max(0.01, nextScale[0] + normalizeNumber(direction.scaleX, 0) * magnitude);
      nextScale[1] = Math.max(0.01, nextScale[1] + normalizeNumber(direction.scaleY, 0) * magnitude);
      nextSkew[0] += normalizeNumber(direction.skewX, 0) * magnitude;
      nextSkew[1] += normalizeNumber(direction.skewY, 0) * magnitude;
      nextRotation += normalizeNumber(direction.rotation, 0) * magnitude;
      nextOpacity += normalizeNumber(direction.opacity, 0) * magnitude;
    }
    return {
      ...part,
      position: [
        roundForInput(nextPosition[0]),
        roundForInput(nextPosition[1])
      ],
      scale: [
        round4Number(nextScale[0]),
        round4Number(nextScale[1])
      ],
      skew: [
        roundForInput(nextSkew[0]),
        roundForInput(nextSkew[1])
      ],
      rotation: roundForInput(nextRotation),
      opacity: round4Number(clampNumber(nextOpacity, 0, 1, 1))
    };
  });
}

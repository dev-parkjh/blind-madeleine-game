import type { ResourceRecord } from "../../types";

export const live2dMotionSpeedDefault = 1;
export const live2dMotionFrequencyDefault = 1;

export const live2dMotionFields = ["x", "y", "rotation", "scale", "opacity", "frequency", "phase"] as const;
export type Live2dMotionField = typeof live2dMotionFields[number];

export const live2dMotionFieldDefaults: Record<Live2dMotionField, number> = {
  x: 0,
  y: 0,
  rotation: 0,
  scale: 0,
  opacity: 0,
  frequency: live2dMotionFrequencyDefault,
  phase: 0
};

export const live2dMotionFieldLimits: Record<Live2dMotionField, { min: number; max: number; step: number }> = {
  x: { min: -300, max: 300, step: 1 },
  y: { min: -300, max: 300, step: 1 },
  rotation: { min: -45, max: 45, step: 0.5 },
  scale: { min: 0, max: 0.5, step: 0.01 },
  opacity: { min: -1, max: 1, step: 0.01 },
  frequency: { min: 0.1, max: 5, step: 0.05 },
  phase: { min: 0, max: 6.283, step: 0.05 }
};

export function getLive2dMotions(value: unknown): Record<string, ResourceRecord> {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const result: Record<string, ResourceRecord> = {};
  for (const [key, motion] of Object.entries(source)) {
    if (!key.trim() || !motion || typeof motion !== "object" || Array.isArray(motion)) continue;
    result[key] = motion as ResourceRecord;
  }
  return result;
}

export function getLive2dMotionParts(value: unknown): Record<string, ResourceRecord> {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const result: Record<string, ResourceRecord> = {};
  for (const [key, entry] of Object.entries(source)) {
    if (!key.trim() || !entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    result[key] = entry as ResourceRecord;
  }
  return result;
}

export function getLive2dMotionPartEntry(motion: ResourceRecord, partId: string): ResourceRecord {
  const parts = getLive2dMotionParts(motion.parts);
  return parts[partId] || {};
}

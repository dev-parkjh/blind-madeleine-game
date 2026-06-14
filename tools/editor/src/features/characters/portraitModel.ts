import type { PointerPoint } from "../../editorTypes";
import { clamp01Number, clampNumber, round4Number } from "../../lib/numeric";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord } from "../../types";

export const profileZoomDefault = 3;
export const profileZoomMin = 1;
export const profileZoomMax = 8;
export const profileZoomStep = 0.5;

export function portraitRecordForEditor(value: ResourceRecord | string | undefined) {
  if (typeof value === "string") return { path: value };
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function getProfileZoom(value: unknown) {
  return clampNumber(value, profileZoomMin, profileZoomMax, profileZoomDefault);
}

export function getProfileOffset(profile: unknown): PointerPoint {
  const raw = profile && typeof profile === "object" ? (profile as ResourceRecord).offset : null;
  if (Array.isArray(raw)) {
    return { x: round4Number(Number(raw[0]) || 0), y: round4Number(Number(raw[1]) || 0) };
  }
  if (raw && typeof raw === "object") {
    const record = raw as ResourceRecord;
    return { x: round4Number(Number(record.x ?? record[0]) || 0), y: round4Number(Number(record.y ?? record[1]) || 0) };
  }
  return { x: 0, y: 0 };
}

export function getPortraitCenterPoint(value: unknown): PointerPoint {
  const raw = asArray<number>(value);
  if (raw.length >= 2) {
    return { x: clamp01Number(raw[0], 0.5), y: clamp01Number(raw[1], 0.5) };
  }
  if (value && typeof value === "object") {
    const record = value as ResourceRecord;
    return {
      x: clamp01Number(record.x ?? record[0], 0.5),
      y: clamp01Number(record.y ?? record[1], 0.5)
    };
  }
  return { x: 0.5, y: 0.5 };
}

export function isDefaultPortraitCenterPoint(point: PointerPoint) {
  return Math.abs(point.x - 0.5) < 0.001 && Math.abs(point.y - 0.5) < 0.001;
}

export function withProfileZoom(profile: ResourceRecord, zoom: unknown): ResourceRecord {
  const { center: _center, ...rest } = profile;
  return {
    ...rest,
    zoom: getProfileZoom(zoom)
  };
}

export function withProfileOffset(profile: ResourceRecord, offset: PointerPoint): ResourceRecord {
  const { center: _center, ...rest } = profile;
  return {
    ...rest,
    offset: [round4Number(offset.x), round4Number(offset.y)]
  };
}

export function profileCropSummary(profile: ResourceRecord) {
  const offset = getProfileOffset(profile);
  return `zoom ${Math.round(getProfileZoom(profile.zoom) * 100)}% · offset ${offset.x.toFixed(4)}, ${offset.y.toFixed(4)}`;
}

export function getSpectrumOffset(value: unknown): PointerPoint {
  if (Array.isArray(value)) {
    return { x: round4Number(Number(value[0]) || 0), y: round4Number(Number(value[1]) || 0) };
  }
  if (value && typeof value === "object") {
    const record = value as ResourceRecord;
    return { x: round4Number(Number(record.x ?? record[0]) || 0), y: round4Number(Number(record.y ?? record[1]) || 0) };
  }
  return { x: 0, y: 0 };
}

export function getDefaultSpectrumPortrait(value: unknown) {
  const portraits = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, ResourceRecord | string>
    : {};
  const entries = Object.entries(portraits).map(([key, entry]) => normalizeSpectrumPortraitEntry(key, entry));
  return entries.find((entry) => entry.key.toLowerCase() === "default" && entry.path)
    || entries.find((entry) => entry.path)
    || null;
}

export function normalizeSpectrumPortraitEntry(key: string, entry: ResourceRecord | string) {
  if (typeof entry === "string") {
    return { key, path: entry, center: { x: 0.5, y: 0.5 } };
  }
  return {
    key,
    path: String(entry?.path || ""),
    center: getPortraitCenterPoint(entry?.center)
  };
}

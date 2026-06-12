import type { PointerPoint } from "../editorTypes";

export function clamp01Number(value: unknown, fallback = 0.5) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(1, Math.max(0, number));
}

export function normalizeNumber(value: unknown, fallback = 0, min?: number, max?: number) {
  const parsed = Number(value);
  let next = Number.isFinite(parsed) ? parsed : fallback;
  if (min !== undefined) next = Math.max(min, next);
  if (max !== undefined) next = Math.min(max, next);
  return roundForInput(next);
}

export function normalizeBooleanFlag(value: unknown, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const text = String(value).trim().toLowerCase();
  if (["false", "0", "no", "off", "n"].includes(text)) return false;
  if (["true", "1", "yes", "on", "y"].includes(text)) return true;
  return Boolean(value);
}

export function clampNumber(value: unknown, min: number, max: number, fallback = min) {
  const parsed = Number(value);
  const next = Number.isFinite(parsed) ? parsed : fallback;
  return Math.min(max, Math.max(min, next));
}

export function roundCoordinate(value: number) {
  return Math.round(clamp01Number(value) * 1000) / 1000;
}

export function roundParallaxCoordinate(value: number) {
  return Math.round(clampNumber(value, -0.5, 1.5, 0.5) * 1000) / 1000;
}

export function roundForInput(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function round4Number(value: number) {
  return Math.round(value * 10000) / 10000;
}

export function normalizeRotationDegrees(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  let rotation = ((parsed + 180) % 360 + 360) % 360 - 180;
  if (Math.abs(rotation) < 0.001) rotation = 0;
  return roundForInput(rotation);
}

export function pointerDistance(point: PointerPoint, event: { clientX: number; clientY: number }) {
  return Math.hypot(event.clientX - point.x, event.clientY - point.y);
}

export function pointerAngle(point: PointerPoint, event: { clientX: number; clientY: number }) {
  return Math.atan2(event.clientY - point.y, event.clientX - point.x) * 180 / Math.PI;
}

export function rotateParallaxPoint(point: PointerPoint, degrees: number) {
  const radians = degrees * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos
  };
}

export function getParallaxWheelScaleDelta(deltaY: unknown) {
  const rawDelta = Number(deltaY) || 0;
  if (rawDelta === 0) return 0;
  const tickCount = Math.max(1, Math.round(Math.abs(rawDelta) / 100));
  return -Math.sign(rawDelta) * tickCount * 0.01;
}

export function formatNumberInput(value: number) {
  if (Number.isInteger(value)) return String(value);
  return String(roundForInput(value));
}

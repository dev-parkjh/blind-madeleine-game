import type { PointerPoint } from "../../editorTypes";
import { normalizeNumber } from "../../lib/numeric";
import type { ResourceRecord } from "../../types";

export const live2dCanvasWidthDefault = 1000;
export const live2dCanvasHeightDefault = 1400;

export function live2dRecordForEditor(value: unknown): ResourceRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ResourceRecord : {};
}

export function getLive2dParts(value: unknown): ResourceRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is ResourceRecord => Boolean(entry && typeof entry === "object" && !Array.isArray(entry)));
}

export function getLive2dCanvasSize(value: unknown): PointerPoint {
  const point = getLive2dPoint(value, live2dCanvasWidthDefault, live2dCanvasHeightDefault);
  return {
    x: normalizeNumber(point.x, live2dCanvasWidthDefault, 100, 4000),
    y: normalizeNumber(point.y, live2dCanvasHeightDefault, 100, 5000)
  };
}

export function getLive2dPoint(value: unknown, fallbackX: number, fallbackY: number): PointerPoint {
  if (Array.isArray(value)) {
    return {
      x: Number.isFinite(Number(value[0])) ? Number(value[0]) : fallbackX,
      y: Number.isFinite(Number(value[1])) ? Number(value[1]) : fallbackY
    };
  }
  if (value && typeof value === "object") {
    const record = value as ResourceRecord;
    return {
      x: Number.isFinite(Number(record.x ?? record[0])) ? Number(record.x ?? record[0]) : fallbackX,
      y: Number.isFinite(Number(record.y ?? record[1])) ? Number(record.y ?? record[1]) : fallbackY
    };
  }
  return { x: fallbackX, y: fallbackY };
}

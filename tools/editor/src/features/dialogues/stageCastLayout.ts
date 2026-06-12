import type { PointerPoint } from "../../editorTypes";
import { clampNumber, normalizeNumber, round4Number } from "../../lib/numeric";
import type { ResourceRecord } from "../../types";

export const gameReferenceWidth = 1920;
export const gameReferenceHeight = 1080;
export const gameDialoguePanelMinHeight = 285;
export const gameStageGapHeight = 18;
export const gameCharacterLayerWidth = gameReferenceWidth;
export const gameCharacterLayerHeight = gameReferenceHeight - gameDialoguePanelMinHeight - gameStageGapHeight;
export const portraitFitPadding = 0.92;
export const portraitZoomMin = 100;
export const portraitZoomMax = 500;
export const portraitZoomStep = 50;
export const portraitZoomDefault = 300;
export const stageCastDefaultOpacity = 1;
export const stageCastUnfocusedOpacity = 0.7;
export const stageCastDefaultAnimationSpeed = 1;
export const stageCastAnimationOrderDefault = 1;
export const portraitFaceAnchor = { x: 0.5, y: 0.34 };
export const portraitZoomOutBodyAnchor = { x: 0.5, y: 0.3709 };
export const portraitZoomOutBodyBlendStart = 300;
export const portraitZoomOutBodyBlendEnd = 250;
export const portraitPositionPresets: Record<string, PointerPoint> = {
  far_left: { x: -0.32, y: 0 },
  left: { x: -0.18, y: 0 },
  center: { x: 0, y: 0 },
  right: { x: 0.18, y: 0 },
  far_right: { x: 0.32, y: 0 }
};
export const stageCastPositionOptions = ["far_left", "left", "center", "right", "far_right", "custom"] as const;
export const portraitPositionStackSpreadStep = 0.16;
export const portraitPositionStackMinX = -0.42;
export const portraitPositionStackMaxX = 0.42;

export function normalizeCastPosition(value: unknown) {
  const text = String(value || "center").trim().toLowerCase();
  if ((stageCastPositionOptions as readonly string[]).includes(text)) return text;
  return "center";
}

export function parseCastOffset(value: unknown) {
  if (Array.isArray(value)) {
    return { x: normalizeNumber(value[0], 0), y: normalizeNumber(value[1], 0) };
  }
  if (value && typeof value === "object") {
    const record = value as ResourceRecord;
    return { x: normalizeNumber(record.x ?? record[0], 0), y: normalizeNumber(record.y ?? record[1], 0) };
  }
  return { x: 0, y: 0 };
}

export function snapPortraitZoomPercent(value: unknown) {
  const clamped = clampNumber(value, portraitZoomMin, portraitZoomMax, portraitZoomDefault);
  return Math.round(clamped / portraitZoomStep) * portraitZoomStep;
}

export function isStackableCastPosition(position: string) {
  return Object.prototype.hasOwnProperty.call(portraitPositionPresets, position);
}

export function applyCastPositionStackSpread(baseOffset: PointerPoint, stackIndex: number, stackCount: number) {
  if (stackCount <= 1) return { x: round4Number(baseOffset.x), y: round4Number(baseOffset.y) };
  const safeCount = Math.max(1, Math.round(stackCount) || 1);
  const safeIndex = Math.min(Math.max(0, Math.round(stackIndex) || 0), safeCount - 1);
  const spread = safeIndex - (safeCount - 1) * 0.5;
  return {
    x: round4Number(clampNumber(baseOffset.x + spread * portraitPositionStackSpreadStep, portraitPositionStackMinX, portraitPositionStackMaxX, baseOffset.x)),
    y: round4Number(baseOffset.y)
  };
}

export function getPortraitAnchorRatios(zoomPercent: unknown) {
  const zoom = Number.isFinite(Number(zoomPercent)) ? Number(zoomPercent) : portraitZoomDefault;
  const span = Math.max(portraitZoomOutBodyBlendStart - portraitZoomOutBodyBlendEnd, 0.001);
  const blend = clampNumber((portraitZoomOutBodyBlendStart - zoom) / span, 0, 1, 0);
  return {
    x: portraitFaceAnchor.x + (portraitZoomOutBodyAnchor.x - portraitFaceAnchor.x) * blend,
    y: portraitFaceAnchor.y + (portraitZoomOutBodyAnchor.y - portraitFaceAnchor.y) * blend
  };
}

export function getStageCastRecordLayoutOffset(characterId: string, entry: ResourceRecord, stageCast: Record<string, ResourceRecord>) {
  const position = normalizeCastPosition(entry.portrait_position ?? entry.position);
  if (position === "custom") return parseCastOffset(entry.portrait_offset);
  const baseOffset = portraitPositionPresets[position] || portraitPositionPresets.center;
  if (!characterId || !isStackableCastPosition(position)) return baseOffset;
  const group = Object.entries(stageCast)
    .map(([candidateId, candidate], index) => ({
      characterId: candidateId,
      index,
      position: normalizeCastPosition(candidate?.portrait_position ?? candidate?.position),
      order: normalizeNumber(candidate?.portrait_position_order ?? candidate?.position_order, index + 1, 1),
      visible: Boolean(candidate?.portrait)
    }))
    .filter((candidate) => candidate.position === position && candidate.visible)
    .sort((a, b) => a.order === b.order ? a.index - b.index : a.order - b.order);
  const stackIndex = Math.max(0, group.findIndex((candidate) => candidate.characterId === characterId));
  return applyCastPositionStackSpread(baseOffset, stackIndex, group.length);
}

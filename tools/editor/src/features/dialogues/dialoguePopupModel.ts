import type { PointerPoint } from "../../editorTypes";
import { normalizeNumber } from "../../lib/numeric";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord } from "../../types";

export const popupDefaultSize = { x: 320, y: 320 };
export const popupPositionPresets: Record<string, PointerPoint> = {
  left: { x: 0.24, y: 0.38 },
  center: { x: 0.5, y: 0.36 },
  right: { x: 0.76, y: 0.38 },
  top_left: { x: 0.22, y: 0.22 },
  top_right: { x: 0.78, y: 0.22 },
  custom: { x: 0.5, y: 0.36 }
};

export function getNodePopupsEditorValue(node: ResourceRecord) {
  return asArray<ResourceRecord>(node.popups ?? node.popup_images);
}

export function withNodePopups(node: ResourceRecord, popups: ResourceRecord[]) {
  const next: ResourceRecord = { ...node };
  delete next.popup_images;
  if (popups.length === 0) {
    delete next.popups;
    return next;
  }
  next.popups = popups;
  return next;
}

export function normalizePopupSourceForEditor(value: unknown) {
  const text = String(value || "character_profile").trim().toLowerCase();
  if (["character", "profile", "portrait_profile"].includes(text)) return "character_profile";
  if (["item", "item_image"].includes(text)) return "item";
  if (["image", "path", "direct"].includes(text)) return "image";
  if (["character_profile", "item", "image"].includes(text)) return text;
  return "character_profile";
}

export function getPopupCharacterId(popup: ResourceRecord, node: ResourceRecord) {
  const targetId = String(popup.target_id || popup.character_id || "").trim();
  if (targetId) return targetId;
  const speakerId = String(node.speaker || "").trim();
  return speakerId && speakerId !== "narrator" ? speakerId : "";
}

export function parsePopupOffset(value: unknown) {
  return parsePopupPoint(value, { x: 0, y: 0 });
}

export function parsePopupSizePoint(popup: ResourceRecord) {
  if (popup.size !== undefined) return parsePopupPoint(popup.size, popupDefaultSize, 1);
  return {
    x: normalizeNumber(popup.width, popupDefaultSize.x, 1),
    y: normalizeNumber(popup.height, popupDefaultSize.y, 1)
  };
}

function parsePopupPoint(value: unknown, fallback: PointerPoint, min?: number) {
  if (Array.isArray(value)) {
    return { x: normalizeNumber(value[0], fallback.x, min), y: normalizeNumber(value[1], fallback.y, min) };
  }
  if (value && typeof value === "object") {
    const record = value as ResourceRecord;
    return {
      x: normalizeNumber(record.x ?? record.width ?? record[0], fallback.x, min),
      y: normalizeNumber(record.y ?? record.height ?? record[1], fallback.y, min)
    };
  }
  return fallback;
}

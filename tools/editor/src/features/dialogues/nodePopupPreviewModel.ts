import type { CSSProperties } from "react";
import type { PointerPoint } from "../../editorTypes";
import { clamp01Number, normalizeNumber } from "../../lib/numeric";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord } from "../../types";
import {
  getPopupCharacterId,
  normalizePopupSourceForEditor,
  parsePopupOffset,
  parsePopupSizePoint,
  popupPositionPresets
} from "./dialoguePopupModel";

export const gameReferenceWidth = 1920;
export const gameReferenceHeight = 1080;

export type PopupPreviewEntry = {
  index: number;
  source: string;
  label: string;
  imagePath: string;
  center: PointerPoint;
  profile: ResourceRecord;
  position: string;
  offset: PointerPoint;
  size: PointerPoint;
  scale: number;
  opacity: number;
  imageMode: string;
  imageZoom: number;
};

export function buildPopupPreviewEntry(
  popup: ResourceRecord,
  index: number,
  node: ResourceRecord,
  characterDetails: Record<string, ResourceRecord>,
  itemDetails: Record<string, ResourceRecord>
): PopupPreviewEntry {
  const source = normalizePopupSourceForEditor(popup.source || popup.kind);
  const offset = parsePopupOffset(popup.offset);
  const size = parsePopupSizePoint(popup);
  const position = popupPositionPresets[String(popup.position || "center")] ? String(popup.position || "center") : "center";
  const scale = normalizeNumber(popup.scale, 1, 0.25, 3);
  const opacity = normalizeNumber(popup.opacity, 1, 0, 1);
  const imageMode = ["fit", "cover", "crop"].includes(String(popup.image_mode || popup.fit || "fit")) ? String(popup.image_mode || popup.fit || "fit") : "fit";
  const imageZoom = normalizeNumber(popup.image_zoom, 1, 0.25, 6);
  if (source === "item") {
    const itemId = String(popup.target_id || popup.item_id || "").trim();
    const item = itemDetails[itemId];
    return {
      index,
      source,
      label: item?.name || item?.display_name || item?.title || itemId || `Popup ${index + 1}`,
      imagePath: String(item?.image || ""),
      center: { x: 0.5, y: 0.5 },
      profile: {},
      position,
      offset,
      size,
      scale,
      opacity,
      imageMode,
      imageZoom
    };
  }
  if (source === "image") {
    return {
      index,
      source,
      label: String(popup.id || popup.path || popup.image || `Popup ${index + 1}`),
      imagePath: String(popup.path || popup.image || ""),
      center: { x: 0.5, y: 0.5 },
      profile: {},
      position,
      offset,
      size,
      scale,
      opacity,
      imageMode,
      imageZoom
    };
  }

  const characterId = getPopupCharacterId(popup, node);
  const character = characterDetails[characterId];
  const profileInfo = resolvePopupCharacterProfileInfo(popup, character);
  return {
    index,
    source,
    label: popupCharacterLabel(characterId, character),
    imagePath: profileInfo.path,
    center: profileInfo.center,
    profile: profileInfo.profile,
    position,
    offset,
    size,
    scale,
    opacity,
    imageMode,
    imageZoom
  };
}

function resolvePopupCharacterProfileInfo(popup: ResourceRecord, character: ResourceRecord | undefined) {
  if (!character) return { path: "", center: { x: 0.5, y: 0.5 }, profile: {} };
  const portraits = character.portraits && typeof character.portraits === "object"
    ? character.portraits as Record<string, ResourceRecord | string>
    : {};
  let portraitKey = String(popup.portrait || character.profile?.portrait || "").trim();
  if (!portraitKey && portraits.default) portraitKey = "default";
  if (!portraitKey) {
    portraitKey = Object.keys(portraits).find((key) => {
      const entry = portraits[key];
      return typeof entry === "string" || Boolean((entry as ResourceRecord)?.path);
    }) || "";
  }
  const entry = portraitKey ? portraits[portraitKey] : null;
  if (!entry) return { path: "", center: { x: 0.5, y: 0.5 }, profile: character.profile && typeof character.profile === "object" ? character.profile as ResourceRecord : {} };
  if (typeof entry === "string") {
    return {
      path: entry,
      center: { x: 0.5, y: 0.5 },
      profile: character.profile && typeof character.profile === "object" ? character.profile as ResourceRecord : {}
    };
  }
  return {
    path: String(entry.path || ""),
    center: {
      x: clamp01Number(asArray<number>(entry.center)[0], 0.5),
      y: clamp01Number(asArray<number>(entry.center)[1], 0.5)
    },
    profile: entry.profile && typeof entry.profile === "object"
      ? entry.profile as ResourceRecord
      : (character.profile && typeof character.profile === "object" ? character.profile as ResourceRecord : {})
  };
}

export function getPopupPreviewCenter(entry: PopupPreviewEntry) {
  const anchor = popupPositionPresets[entry.position] || popupPositionPresets.center;
  return {
    x: anchor.x + entry.offset.x,
    y: anchor.y + entry.offset.y
  };
}

export function getPopupPreviewFrameStyle(entry: PopupPreviewEntry) {
  const center = getPopupPreviewCenter(entry);
  const width = Math.max(1, entry.size.x * entry.scale);
  const height = Math.max(1, entry.size.y * entry.scale);
  return {
    left: `${center.x * 100}%`,
    top: `${center.y * 100}%`,
    width: `${width / gameReferenceWidth * 100}%`,
    height: `${height / gameReferenceHeight * 100}%`,
    opacity: entry.opacity,
    zIndex: entry.index + 1
  } as CSSProperties;
}

function popupCharacterLabel(characterId: string, character: ResourceRecord | undefined) {
  if (characterId === "mystery") return "???";
  return String(character?.display_name || character?.name || character?.title || characterId);
}

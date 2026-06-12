import type { ResourceRecord, ValidationIssue } from "../../types";
import type { ResourceMaps } from "./shared";
import {
  getCharacterPortraitKeys,
  getSummaryValidation,
  imagePathExtensions,
  isPlainRecord,
  popupImageModes,
  popupPositions,
  popupSourceAliases,
  popupSources,
  popupTransitions,
  validateNumberRange,
  validatePathExtension,
  validateResPath,
  validateVector2
} from "./shared";

export function validateNodePopup(
  value: unknown,
  path: string,
  node: ResourceRecord,
  issues: ValidationIssue[],
  maps: ResourceMaps
) {
  if (!isPlainRecord(value)) {
    issues.push({ severity: "warning", message: `${path}는 객체여야 합니다.` });
    return;
  }

  const popup = value;
  const sourceInfo = normalizePopupSource(popup.source ?? popup.kind);
  if (!sourceInfo.recognized) {
    issues.push({ severity: "warning", message: `${path}.source가 지원 범위가 아닙니다: ${String(popup.source ?? popup.kind)}` });
  }

  if (sourceInfo.source === "character_profile") {
    const targetId = String(popup.target_id ?? popup.character_id ?? "").trim()
      || (String(node.speaker || "").trim() !== "narrator" ? String(node.speaker || "").trim() : "");
    if (!targetId || targetId === "narrator" || !maps.characters.has(targetId)) {
      issues.push({ severity: "warning", message: `${path}: character_profile 팝업 대상 인물을 찾을 수 없습니다: ${targetId || "(없음)"}` });
    } else if (popup.portrait) {
      const portraitKey = String(popup.portrait).trim();
      const validKeys = getCharacterPortraitKeys(targetId, maps);
      if (validKeys.length > 0 && !validKeys.includes(portraitKey)) {
        issues.push({ severity: "warning", message: `${path}.portrait가 캐릭터 portrait key에 없습니다: ${portraitKey}` });
      }
    }
  } else if (sourceInfo.source === "item") {
    const targetId = String(popup.target_id ?? popup.item_id ?? "").trim();
    if (!targetId || !maps.items.has(targetId)) {
      issues.push({ severity: "warning", message: `${path}: item 팝업 대상 아이템을 찾을 수 없습니다: ${targetId || "(없음)"}` });
    } else if (!String(getSummaryValidation(maps.items.get(targetId)).image || "").trim()) {
      issues.push({ severity: "warning", message: `${path}: item 팝업 대상 아이템에 image가 없습니다: ${targetId}` });
    }
  } else {
    const imagePath = popup.path ?? popup.image;
    validateResPath(imagePath, `${path}.path`, issues, true);
    validatePathExtension(imagePath, `${path}.path`, imagePathExtensions, issues);
  }

  const position = String(popup.position ?? "center").trim();
  if (popup.position !== undefined && !popupPositions.has(position)) {
    issues.push({ severity: "warning", message: `${path}.position이 지원 범위가 아닙니다: ${position}` });
  }
  validateVector2(popup.offset, `${path}.offset`, issues, { optional: true });
  validatePopupSize(popup, path, issues);
  validateNumberRange(popup.scale, `${path}.scale`, issues, { min: 0.25, max: 3, optional: true });
  validateNumberRange(popup.opacity, `${path}.opacity`, issues, { min: 0, max: 1, optional: true });

  const transition = String(popup.transition ?? "fade").trim();
  if (popup.transition !== undefined && !popupTransitions.has(transition)) {
    issues.push({ severity: "warning", message: `${path}.transition이 지원 범위가 아닙니다: ${transition}` });
  }

  const imageMode = String(popup.image_mode ?? popup.fit ?? "fit").trim();
  if ((popup.image_mode !== undefined || popup.fit !== undefined) && !popupImageModes.has(imageMode)) {
    issues.push({ severity: "warning", message: `${path}.image_mode가 지원 범위가 아닙니다: ${imageMode}` });
  }
  validateNumberRange(popup.image_zoom, `${path}.image_zoom`, issues, { min: 0.25, max: 6, optional: true });
}

function validatePopupSize(popup: ResourceRecord, path: string, issues: ValidationIssue[]) {
  if (popup.size !== undefined) {
    validateVector2(popup.size, `${path}.size`, issues, {
      min: 1,
      optional: false,
      objectKeys: [["x", "width"], ["y", "height"]]
    });
    return;
  }
  validateNumberRange(popup.width, `${path}.width`, issues, { min: 1, optional: true });
  validateNumberRange(popup.height, `${path}.height`, issues, { min: 1, optional: true });
}

function normalizePopupSource(value: unknown): { source: string; recognized: boolean } {
  const raw = String(value || "character_profile").trim();
  const key = raw.toLowerCase();
  if (popupSources.has(key)) return { source: key, recognized: true };
  if (popupSourceAliases[key]) return { source: popupSourceAliases[key], recognized: true };
  return { source: "character_profile", recognized: false };
}

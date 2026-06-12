import type { ResourceRecord, ValidationIssue } from "../../types";
import {
  imagePathExtensions,
  isPlainRecord,
  validateNumberRange,
  validatePathExtension,
  validatePointArray,
  validateResPath,
  validateVector2
} from "./shared";

export function validateCharacter(data: ResourceRecord, issues: ValidationIssue[]) {
  if (!data.display_name) issues.push({ severity: "error", message: "캐릭터 display_name이 비어 있습니다." });
  if (data.name_color && !/^#[0-9a-f]{6}$/i.test(String(data.name_color))) {
    issues.push({ severity: "warning", message: "name_color는 #RRGGBB 형식을 권장합니다." });
  }
  if (data.metadata !== undefined && !isPlainRecord(data.metadata)) {
    issues.push({ severity: "warning", message: "캐릭터 metadata는 객체 JSON이어야 합니다." });
  }
  validateVector2(data.spectrum_offset, "spectrum_offset", issues, { min: -1, max: 1, optional: true });

  const portraits = data.portraits;
  if (portraits && typeof portraits === "object" && !Array.isArray(portraits)) {
    for (const [key, portrait] of Object.entries(portraits)) {
      validateCharacterPortrait(key, portrait, issues);
    }
  } else if (portraits !== undefined) {
    issues.push({ severity: "warning", message: "캐릭터 portraits는 객체 JSON이어야 합니다." });
  }
}

function validateCharacterPortrait(key: string, portrait: unknown, issues: ValidationIssue[]) {
  const path = typeof portrait === "string"
    ? portrait
    : isPlainRecord(portrait)
      ? portrait.path
      : "";
  if (!path) {
    issues.push({ severity: "warning", message: `초상 ${key}에 path가 없습니다.` });
    return;
  }
  validateResPath(path, `초상 ${key}`, issues, false);
  validatePathExtension(path, `초상 ${key}`, imagePathExtensions, issues);
  if (!isPlainRecord(portrait)) return;
  validatePointArray(portrait.center, `초상 ${key}.center`, issues, { length: 2, min: 0, max: 1, optional: true });
  if (portrait.profile !== undefined && !isPlainRecord(portrait.profile)) {
    issues.push({ severity: "warning", message: `초상 ${key}.profile은 객체 JSON이어야 합니다.` });
    return;
  }
  if (isPlainRecord(portrait.profile)) {
    validateNumberRange(portrait.profile.zoom, `초상 ${key}.profile.zoom`, issues, { min: 1, max: 6, optional: true });
    validateVector2(portrait.profile.offset, `초상 ${key}.profile.offset`, issues, { min: -1, max: 1, optional: true });
  }
}

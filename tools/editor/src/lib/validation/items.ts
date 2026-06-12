import type { ResourceRecord, ValidationIssue } from "../../types";
import type { ResourceMaps } from "./shared";
import {
  getResourceChapterScopeValidationValue,
  imagePathExtensions,
  validateChapterScope,
  validatePathExtension,
  validateResPath
} from "./shared";

export function validateItem(data: ResourceRecord, issues: ValidationIssue[], maps: ResourceMaps) {
  if (!data.name) issues.push({ severity: "error", message: "아이템 name이 비어 있습니다." });
  validateChapterScope(getResourceChapterScopeValidationValue(data), issues, maps);
  validateResPath(data.image, "아이템 이미지", issues, false);
  validatePathExtension(data.image, "아이템 이미지", imagePathExtensions, issues);
}

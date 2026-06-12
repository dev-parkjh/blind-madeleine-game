import type { ResourceRecord, ValidationIssue } from "../../types";
import { normalizeKind } from "../resourceConfig";
import type { ResourceMaps } from "./shared";
import {
  audioPathExtensions,
  getResourceChapterScopeValidationValue,
  imagePathExtensions,
  validateChapterScope,
  validatePathExtension,
  validateResPath
} from "./shared";

export function validateStoryAsset(data: ResourceRecord, issues: ValidationIssue[], maps: ResourceMaps) {
  const kind = normalizeKind(data.kind);
  if (!["bgm", "sfx", "background"].includes(kind)) {
    issues.push({ severity: "warning", message: `스토리 에셋 kind가 알려진 값이 아닙니다: ${data.kind}` });
  }
  validateChapterScope(getResourceChapterScopeValidationValue(data), issues, maps);
  validateResPath(data.path, "스토리 에셋 경로", issues, true);
  if (kind === "background") {
    validatePathExtension(data.path, "스토리 배경 에셋", imagePathExtensions, issues);
  } else if (kind === "bgm" || kind === "sfx") {
    validatePathExtension(data.path, "스토리 오디오 에셋", audioPathExtensions, issues);
  }

  if (data.volume !== undefined) {
    const volume = Number(data.volume);
    if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
      issues.push({ severity: "warning", message: "volume은 0에서 1 사이 값을 권장합니다." });
    }
  }
}

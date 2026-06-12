import type { ProjectSummary, ResourceRecord, ResourceType, ValidationIssue } from "../types";
import { validateChapter } from "./validation/chapters";
import { validateCharacter } from "./validation/characters";
import { validateDialogue } from "./validation/dialogues";
import { validateItem } from "./validation/items";
import { validateStoryAsset } from "./validation/storyAssets";
import { buildMaps, resourceIdPattern } from "./validation/shared";

export function collectValidationIssues(
  type: ResourceType,
  data: ResourceRecord | null,
  selectedId: string,
  summary: ProjectSummary | null
): ValidationIssue[] {
  if (!data) return [{ severity: "info", message: "왼쪽 목록에서 편집할 항목을 선택하세요." }];

  const issues: ValidationIssue[] = [];
  const maps = buildMaps(summary);

  if (!data.id) {
    issues.push({ severity: "error", message: "JSON에 id 필드가 없습니다." });
  } else if (!resourceIdPattern.test(String(data.id))) {
    issues.push({ severity: "error", message: "id/파일명은 영문, 숫자, 밑줄, 하이픈만 사용할 수 있습니다." });
  } else if (selectedId && data.id !== selectedId) {
    issues.push({ severity: "warning", message: `파일명 ID와 JSON ID가 다릅니다. 파일명: ${selectedId}, JSON: ${data.id}` });
  }

  if (type === "characters") validateCharacter(data, issues);
  if (type === "items") validateItem(data, issues, maps);
  if (type === "chapters") validateChapter(data, issues, maps);
  if (type === "story_assets") validateStoryAsset(data, issues, maps);
  if (type === "dialogues") validateDialogue(data, issues, maps);

  if (issues.length === 0) {
    issues.push({ severity: "info", message: "현재 선택 항목의 기본 검증을 통과했습니다." });
  }

  return issues;
}

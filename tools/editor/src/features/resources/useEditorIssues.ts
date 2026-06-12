import { useMemo } from "react";
import { formatJsonEditorError, type JsonEditorError } from "../../components/JsonEditor";
import { collectValidationIssues } from "../../lib/validation";
import type { ProjectSummary, ResourceRecord, ResourceType, ValidationIssue } from "../../types";

export function useEditorIssues({
  draft,
  jsonError,
  selectedId,
  summary,
  type
}: {
  draft: ResourceRecord | null;
  jsonError: JsonEditorError | null;
  selectedId: string;
  summary: ProjectSummary | null;
  type: ResourceType;
}) {
  return useMemo(
    () => collectValidationIssues(type, draft, selectedId, summary).concat(jsonError
      ? [{ severity: "error", message: `JSON 오류: ${formatJsonEditorError(jsonError)}` } satisfies ValidationIssue]
      : []),
    [draft, jsonError, selectedId, summary, type]
  );
}

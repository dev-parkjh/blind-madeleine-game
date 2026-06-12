import type { PointerPoint } from "../../editorTypes";
import type { ResourceRecord, ResourceSummary } from "../../types";
import { chapterGraphEdgeMenuPoint, getChapterGraphNext } from "./chapterGraphModel";

export function filterChapterDialogues(dialogues: ResourceSummary[], queryText: string) {
  const query = queryText.trim().toLowerCase();
  if (!query) return dialogues;
  return dialogues.filter((dialogue) => {
    const haystack = `${dialogue.id} ${dialogue.title} ${dialogue.subtitle || ""}`.toLowerCase();
    return haystack.includes(query);
  });
}

export function getIncomingChapterGraphIds(
  placedIds: string[],
  selectedNodeId: string,
  dialogueData: Record<string, ResourceRecord>
) {
  return selectedNodeId
    ? placedIds.filter((id) => id !== selectedNodeId && getChapterGraphNext(dialogueData[id]) === selectedNodeId)
    : [];
}

export function buildNextDialogueSelectOptions(
  placedIds: string[],
  selectedNodeId: string,
  dialogueSummaryMap: Map<string, ResourceSummary>
): ResourceSummary[] {
  return placedIds
    .filter((id) => id !== selectedNodeId)
    .map((id) => ({
      id,
      type: "dialogues" as const,
      title: dialogueSummaryMap.get(id)?.title || id,
      subtitle: id
    }));
}

export function getSelectedChapterGraphEdgeMenuPoint({
  nodePosition,
  placedIds,
  selectedEdge,
  selectedEdgeFromId
}: {
  nodePosition: (id: string, index: number) => PointerPoint;
  placedIds: string[];
  selectedEdge: string;
  selectedEdgeFromId: string;
}) {
  const selectedEdgeSourceIndex = selectedEdgeFromId ? placedIds.indexOf(selectedEdgeFromId) : -1;
  const selectedEdgeTargetIndex = selectedEdge ? placedIds.indexOf(selectedEdge) : -1;
  return selectedEdgeSourceIndex >= 0 && selectedEdgeTargetIndex >= 0
    ? chapterGraphEdgeMenuPoint(
      nodePosition(selectedEdgeFromId, selectedEdgeSourceIndex),
      nodePosition(selectedEdge, selectedEdgeTargetIndex)
    )
    : null;
}

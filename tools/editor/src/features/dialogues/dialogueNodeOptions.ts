import { getDialogueVisiblePreviewText } from "../../components/RichTextPreview";
import type { ReferenceResources } from "../../editorTypes";
import { normalizeSingleId } from "../../lib/ids";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord, ResourceSummary } from "../../types";
import {
  cutsceneSummary,
  getDialogueNodeMode,
  getNodeCutsceneEditorValue,
  getStageNodeHoldEditorValue,
  isCutsceneNode,
  isStageNode,
  speakerLabel
} from "./dialogueNodeModel";
import { characterLabel, getStageCastRecord } from "./stageCastModel";

export function buildDialogueStartOptions(dialogue: ResourceRecord, characters: ResourceSummary[]) {
  const nodeOptions = buildNodeSelectOptions(asArray<ResourceRecord>(dialogue.nodes), "@", characters);
  const statementOptions = asArray<unknown>(dialogue.statement_nodes).map((entry, index) => {
    if (typeof entry === "string") {
      const id = normalizeSingleId(entry);
      return {
        id,
        title: id || `@statement_${index}`,
        subtitle: "statement link",
        type: "dialogues"
      } as ResourceSummary;
    }
    const node = entry && typeof entry === "object" && !Array.isArray(entry) ? entry as ResourceRecord : {};
    const id = resolveNodeId(node, index, "@statement_");
    return {
      id,
      title: `${id} · statement`,
      subtitle: getDialogueVisiblePreviewText(node.text).slice(0, 72),
      type: "dialogues"
    } as ResourceSummary;
  }).filter((option) => option.id);
  return [...nodeOptions, ...statementOptions];
}

export function getDialogueDefaultStartId(dialogue: ResourceRecord) {
  const nodes = asArray<ResourceRecord>(dialogue.nodes);
  if (nodes.length > 0) return resolveNodeId(nodes[0], 0, "@");
  const statementNodes = asArray<unknown>(dialogue.statement_nodes);
  if (statementNodes.length === 0) return "";
  const firstStatement = statementNodes[0];
  if (typeof firstStatement === "string") return normalizeSingleId(firstStatement);
  const node = firstStatement && typeof firstStatement === "object" && !Array.isArray(firstStatement) ? firstStatement as ResourceRecord : {};
  return resolveNodeId(node, 0, "@statement_");
}

export function dialogueNodeSummary(node: ResourceRecord, references: ReferenceResources) {
  const mode = getDialogueNodeMode(node);
  if (mode === "cutscene") return cutsceneSummary(node);
  if (mode === "stage") return stageNodeSummary(node, references);
  return getDialogueVisiblePreviewText(node.text).slice(0, 72) || "빈 대사";
}

export function stageNodeSummary(node: ResourceRecord, references: ReferenceResources) {
  const cast = getStageCastRecord(node.stage_cast);
  const labels = Object.keys(cast)
    .slice(0, 3)
    .map((characterId) => characterLabel(characterId, undefined, references.characters));
  const hold = getStageNodeHoldEditorValue(node);
  const holdText = hold > 0 ? ` · 대기 ${hold}s` : "";
  if (labels.length === 0) return `캐릭터 움직임 없음${holdText}`;
  const suffix = Object.keys(cast).length > labels.length ? ` 외 ${Object.keys(cast).length - labels.length}명` : "";
  return `캐릭터 움직임 · ${labels.join(", ")}${suffix}${holdText}`;
}

export function getDialogueFirstTextPreview(dialogue: ResourceRecord | undefined) {
  if (!dialogue || dialogue.__load_error) return String(dialogue?.__load_error || "");
  const firstNode = asArray<ResourceRecord>(dialogue.nodes)[0] || asArray<ResourceRecord>(dialogue.statement_nodes)[0];
  if (!firstNode) return "";
  if (isCutsceneNode(firstNode)) return `cutscene ${getNodeCutsceneEditorValue(firstNode).image || ""}`.trim();
  if (isStageNode(firstNode)) return stageNodeSummary(firstNode, { characters: [], characterRigs: [], chapters: [], dialogues: [], items: [], storyAssets: [] });
  return getDialogueVisiblePreviewText(String(firstNode.text || "")).slice(0, 80);
}

export function resolveNodeId(node: ResourceRecord, index: number, autoPrefix = "@") {
  const raw = String(node.id || "").trim();
  return raw || `${autoPrefix}${index}`;
}

export function resolvePreviousPreviewNodeId(nodes: ResourceRecord[], selectedIndex: number) {
  const selectedNode = nodes[selectedIndex];
  if (!selectedNode) return "";
  const selectedNodeId = resolveNodeId(selectedNode, selectedIndex, "@");
  const linkedPreviousIndex = nodes.findIndex((node, index) => (
    index !== selectedIndex && String(node.next || "").trim() === selectedNodeId
  ));
  if (linkedPreviousIndex >= 0) return resolveNodeId(nodes[linkedPreviousIndex], linkedPreviousIndex, "@");
  return selectedIndex > 0 ? resolveNodeId(nodes[selectedIndex - 1], selectedIndex - 1, "@") : "";
}

export function buildNodeSelectOptions(nodes: ResourceRecord[], autoPrefix: string, characters: ResourceSummary[]): ResourceSummary[] {
  return nodes.map((node, index) => {
    const id = resolveNodeId(node, index, autoPrefix);
    const mode = getDialogueNodeMode(node);
    const references = { characters, characterRigs: [], chapters: [], dialogues: [], items: [], storyAssets: [] };
    const title = mode === "cutscene"
      ? `${id} · 컷씬`
      : mode === "stage"
        ? `${id} · 무대`
        : `${id} · ${speakerLabel(node.speaker, characters)}`;
    return {
      id,
      title,
      subtitle: mode === "dialogue" ? getDialogueVisiblePreviewText(node.text).slice(0, 72) : dialogueNodeSummary(node, references),
      type: "dialogues"
    } as ResourceSummary;
  });
}

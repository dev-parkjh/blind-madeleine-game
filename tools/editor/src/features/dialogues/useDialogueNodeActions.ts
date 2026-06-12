import type { MutableRefObject } from "react";
import type { TagAction } from "../../components/RichTextPreview";
import type { DialogueNodeMode, EditorTab } from "../../editorTypes";
import { asArray } from "../../lib/resourceConfig";
import { cloneJsonValue } from "../../lib/records";
import type { ResourceRecord, ResourceSummary, ResourceType } from "../../types";
import { defaultNestedNode } from "./dialogueNodeModel";
import { insertTextWithTextareaUndo } from "./dialogueTextEditing";
import { applyInheritedStageCastDefaults } from "./stageCastModel";

export function useDialogueNodeActions({
  draft,
  type,
  characters,
  selectedNodeIndex,
  nodeTextRef,
  applyDraft,
  setSelectedNodeIndex,
  setTab
}: {
  draft: ResourceRecord | null;
  type: ResourceType;
  characters: ResourceSummary[];
  selectedNodeIndex: number;
  nodeTextRef: MutableRefObject<HTMLTextAreaElement | null>;
  applyDraft: (nextDraft: ResourceRecord) => void;
  setSelectedNodeIndex: (index: number) => void;
  setTab: (tab: EditorTab) => void;
}) {
  function addDialogueNode(mode: DialogueNodeMode) {
    if (!draft || type !== "dialogues") return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    const newIndex = nodes.length;
    const nextNode = defaultNestedNode(mode);
    const inheritedNode = applyInheritedStageCastDefaults(nextNode, newIndex, [...nodes, nextNode], characters);
    applyDraft({ ...draft, nodes: [...nodes, inheritedNode] });
    setSelectedNodeIndex(newIndex);
    setTab("nodes");
  }

  function insertDialogueNodeAfter(index: number, mode: DialogueNodeMode) {
    if (!draft || type !== "dialogues") return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    const insertIndex = Math.max(0, Math.min(index + 1, nodes.length));
    const nextNode = defaultNestedNode(mode);
    const inheritedNode = applyInheritedStageCastDefaults(nextNode, insertIndex, [
      ...nodes.slice(0, insertIndex),
      nextNode,
      ...nodes.slice(insertIndex)
    ], characters);
    applyDraft({ ...draft, nodes: [...nodes.slice(0, insertIndex), inheritedNode, ...nodes.slice(insertIndex)] });
    setSelectedNodeIndex(insertIndex);
    setTab("nodes");
  }

  function duplicateDialogueNode(index: number) {
    if (!draft || type !== "dialogues") return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    const sourceNode = nodes[index];
    if (!sourceNode) return;
    const insertIndex = Math.max(0, Math.min(index + 1, nodes.length));
    const nextNode = cloneJsonValue(sourceNode);
    delete nextNode.id;
    applyDraft({ ...draft, nodes: [...nodes.slice(0, insertIndex), nextNode, ...nodes.slice(insertIndex)] });
    setSelectedNodeIndex(insertIndex);
    setTab("nodes");
  }

  function addStatementNode() {
    if (!draft || type !== "dialogues") return;
    const statementNodes = asArray<ResourceRecord>(draft.statement_nodes);
    const newIndex = statementNodes.length;
    const nextNode = {
      speaker: "narrator",
      text: "[lie]거짓[/lie]",
      statement_lies: [{ phrase: "거짓", reactions: [{ label: "제시", nodes: [] }] }]
    };
    const inheritedNode = applyInheritedStageCastDefaults(nextNode, newIndex, [...statementNodes, nextNode], characters);
    applyDraft({ ...draft, statement_nodes: [...statementNodes, inheritedNode] });
    setTab("nodes");
  }

  function updateStatementNode(index: number, nextNode: ResourceRecord) {
    if (!draft || type !== "dialogues") return;
    const statementNodes = asArray<ResourceRecord>(draft.statement_nodes);
    applyDraft({
      ...draft,
      statement_nodes: statementNodes.map((node, nodeIndex) => nodeIndex === index ? nextNode : node)
    });
  }

  function replaceStatementNodes(nextNodes: ResourceRecord[]) {
    if (!draft || type !== "dialogues") return;
    applyDraft({ ...draft, statement_nodes: nextNodes });
  }

  function removeStatementNode(index: number) {
    if (!draft || type !== "dialogues") return;
    const statementNodes = asArray<ResourceRecord>(draft.statement_nodes);
    applyDraft({ ...draft, statement_nodes: statementNodes.filter((_, nodeIndex) => nodeIndex !== index) });
  }

  function updateDialogueNode(index: number, nextNode: ResourceRecord) {
    if (!draft || type !== "dialogues") return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    const nextNodes = nodes.map((node, nodeIndex) => nodeIndex === index ? nextNode : node);
    applyDraft({ ...draft, nodes: nextNodes });
  }

  function replaceDialogueNodes(nextNodes: ResourceRecord[]) {
    if (!draft || type !== "dialogues") return;
    applyDraft({ ...draft, nodes: nextNodes });
  }

  function removeDialogueNode(index: number) {
    if (!draft || type !== "dialogues") return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    applyDraft({ ...draft, nodes: nodes.filter((_, nodeIndex) => nodeIndex !== index) });
    setSelectedNodeIndex(Math.max(0, index - 1));
  }

  function insertWrappedNodeText(open: string, close: string, fallbackText = "text") {
    if (!draft || type !== "dialogues") return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    const node = nodes[selectedNodeIndex];
    if (!node) return;

    const currentText = String(node.text || "");
    const textarea = nodeTextRef.current;
    const start = textarea?.selectionStart ?? currentText.length;
    const end = textarea?.selectionEnd ?? currentText.length;
    const selected = currentText.slice(start, end);
    const inserted = `${open}${selected || fallbackText}${close}`;
    insertTextWithTextareaUndo(textarea, currentText, inserted, (nextText) => {
      updateDialogueNode(selectedNodeIndex, { ...node, text: nextText });
    });
  }

  function insertTag(action: TagAction) {
    if (action.insert) {
      if (!draft || type !== "dialogues") return;
      const nodes = asArray<ResourceRecord>(draft.nodes);
      const node = nodes[selectedNodeIndex];
      if (!node) return;
      const currentText = String(node.text || "");
      insertTextWithTextareaUndo(nodeTextRef.current, currentText, action.insert, (nextText) => {
        updateDialogueNode(selectedNodeIndex, { ...node, text: nextText });
      });
      return;
    }
    if (action.open && action.close) insertWrappedNodeText(action.open, action.close);
  }

  function insertColorTag(color: string) {
    insertWrappedNodeText(`[color=${color}]`, "[/color]");
  }

  return {
    addDialogueNode,
    insertDialogueNodeAfter,
    duplicateDialogueNode,
    addStatementNode,
    updateDialogueNode,
    replaceDialogueNodes,
    removeDialogueNode,
    updateStatementNode,
    replaceStatementNodes,
    removeStatementNode,
    insertTag,
    insertColorTag
  };
}

export type DialogueNodeActions = ReturnType<typeof useDialogueNodeActions>;

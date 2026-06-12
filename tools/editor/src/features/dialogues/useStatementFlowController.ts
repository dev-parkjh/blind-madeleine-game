import { useEffect, useRef, useState } from "react";
import type { ResourceRecord, ResourceSummary } from "../../types";
import { asArray } from "../../lib/resourceConfig";
import { defaultNestedNode } from "./dialogueNodeModel";
import {
  clampListIndex,
  getStatementLies,
  getStatementReactionAtPath,
  moveArrayItem,
  normalizeStatementReactionNodePath,
  normalizeStatementReactionPath,
  remapMovedIndex,
  statementReactionPathFromNodePath,
  statementScrollSelector,
  withStatementLies,
  type StatementReactionNodePath,
  type StatementReactionPath,
  type StatementScrollTarget
} from "./dialogueStatementModel";
import { applyInheritedStageCastDefaults } from "./stageCastModel";

export function useStatementFlowController({
  addStatementNode,
  characters,
  replaceStatementNodes,
  statementNodes,
  updateStatementNode
}: {
  addStatementNode: () => void;
  characters: ResourceSummary[];
  replaceStatementNodes: (nodes: ResourceRecord[]) => void;
  statementNodes: ResourceRecord[];
  updateStatementNode: (index: number, node: ResourceRecord) => void;
}) {
  const [selectedStatementIndex, setSelectedStatementIndex] = useState(0);
  const [activeReactionPath, setActiveReactionPath] = useState<StatementReactionPath | null>(null);
  const [selectedReactionNodePath, setSelectedReactionNodePath] = useState<StatementReactionNodePath | null>(null);
  const [statementScrollTarget, setStatementScrollTarget] = useState<StatementScrollTarget | null>(null);
  const statementFlowRef = useRef<HTMLDivElement | null>(null);
  const statementDetailRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (statementNodes.length === 0) {
      setSelectedStatementIndex(0);
      setActiveReactionPath(null);
      setSelectedReactionNodePath(null);
      return;
    }
    setSelectedStatementIndex((index) => clampListIndex(index, statementNodes.length));
    setActiveReactionPath((path) => normalizeStatementReactionPath(statementNodes, path));
    setSelectedReactionNodePath((path) => normalizeStatementReactionNodePath(statementNodes, path));
  }, [statementNodes]);

  useEffect(() => {
    if (!statementScrollTarget) return;
    const selector = statementScrollSelector(statementScrollTarget);
    window.requestAnimationFrame(() => {
      statementFlowRef.current?.querySelector<HTMLElement>(selector)?.scrollIntoView({ block: "nearest", inline: "nearest" });
      statementDetailRef.current?.querySelector<HTMLElement>(selector)?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }, [statementScrollTarget, statementNodes]);

  function selectStatement(index: number) {
    const nextIndex = clampListIndex(index, statementNodes.length);
    setSelectedStatementIndex(nextIndex);
    setActiveReactionPath(null);
    setSelectedReactionNodePath(null);
    setStatementScrollTarget({ kind: "statement", statementIndex: nextIndex });
  }

  function selectReaction(path: StatementReactionPath) {
    const normalized = normalizeStatementReactionPath(statementNodes, path);
    if (!normalized) return;
    setSelectedStatementIndex(normalized.statementIndex);
    setActiveReactionPath(normalized);
    setSelectedReactionNodePath(null);
    setStatementScrollTarget({ kind: "reaction", path: normalized });
  }

  function selectReactionChild(path: StatementReactionNodePath) {
    const normalized = normalizeStatementReactionNodePath(statementNodes, path);
    if (!normalized) return;
    const reactionPath = statementReactionPathFromNodePath(normalized);
    setSelectedStatementIndex(normalized.statementIndex);
    setActiveReactionPath(reactionPath);
    setSelectedReactionNodePath(normalized);
    setStatementScrollTarget({ kind: "child", path: normalized });
  }

  function addStatementAndSelect() {
    const nextIndex = statementNodes.length;
    addStatementNode();
    setSelectedStatementIndex(nextIndex);
    setActiveReactionPath(null);
    setSelectedReactionNodePath(null);
    setStatementScrollTarget({ kind: "statement", statementIndex: nextIndex });
  }

  function moveStatementNode(fromIndex: number, toIndex: number) {
    const nextIndex = clampListIndex(toIndex, statementNodes.length);
    if (fromIndex === nextIndex || fromIndex < 0 || fromIndex >= statementNodes.length) return;
    replaceStatementNodes(moveArrayItem(statementNodes, fromIndex, nextIndex));
    setSelectedStatementIndex((index) => remapMovedIndex(index, fromIndex, nextIndex));
    setActiveReactionPath((path) => path ? { ...path, statementIndex: remapMovedIndex(path.statementIndex, fromIndex, nextIndex) } : null);
    setSelectedReactionNodePath((path) => path ? { ...path, statementIndex: remapMovedIndex(path.statementIndex, fromIndex, nextIndex) } : null);
    setStatementScrollTarget({ kind: "statement", statementIndex: remapMovedIndex(selectedStatementIndex, fromIndex, nextIndex) });
  }

  function updateReactionAtPath(path: StatementReactionPath, nextReaction: ResourceRecord) {
    const statementNode = statementNodes[path.statementIndex];
    if (!statementNode) return;
    const lies = getStatementLies(statementNode);
    const lie = lies[path.lieIndex];
    if (!lie) return;
    const reactions = asArray<ResourceRecord>(lie.reactions);
    if (!reactions[path.reactionIndex]) return;
    updateStatementNode(path.statementIndex, withStatementLies(
      statementNode,
      lies.map((entry, lieIndex) => lieIndex === path.lieIndex
        ? {
          ...entry,
          reactions: reactions.map((reaction, reactionIndex) => reactionIndex === path.reactionIndex ? nextReaction : reaction)
        }
        : entry)
    ));
  }

  function toggleReactionEnd(path: StatementReactionPath, checked: boolean) {
    const reaction = getStatementReactionAtPath(statementNodes, path);
    if (!reaction) return;
    updateReactionAtPath(path, { ...reaction, statement_end: checked });
    selectReaction(path);
  }

  function addReactionChildFromFlow(path: StatementReactionPath) {
    const reaction = getStatementReactionAtPath(statementNodes, path);
    if (!reaction) return;
    const childNodes = asArray<ResourceRecord>(reaction.nodes);
    const childIndex = childNodes.length;
    const nextNode = defaultNestedNode("dialogue");
    const inheritedNode = applyInheritedStageCastDefaults(nextNode, childIndex, [...childNodes, nextNode], characters);
    updateReactionAtPath(path, { ...reaction, nodes: [...childNodes, inheritedNode] });
    selectReactionChild({ ...path, childIndex });
  }

  return {
    activeReactionPath,
    addReactionChildFromFlow,
    addStatementAndSelect,
    moveStatementNode,
    selectedReactionNodePath,
    selectedStatementIndex,
    selectReaction,
    selectReactionChild,
    selectStatement,
    statementDetailRef,
    statementFlowRef,
    toggleReactionEnd
  };
}

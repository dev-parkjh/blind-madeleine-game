import type { MouseEvent as ReactMouseEvent, MutableRefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DialogueNodeMode, ReferenceResources } from "../../editorTypes";
import { useUiText } from "../../editorText";
import { parseRichTextPreviewAst, renderRichTextNodes } from "../../components/RichTextPreview";
import type { ResourceRecord } from "../../types";
import { isMobileEditorLayout } from "../../lib/editorLayout";
import { normalizeJsonObject } from "../../lib/records";
import { asArray } from "../../lib/resourceConfig";
import type { StoryAssetPickerState } from "../../lib/storyAssetPicker";
import {
  openDialogueTextContextMenu,
  useDialogueTextContextMenuDismiss,
  type DialogueEventContextAction,
  type DialogueTextContextMenuState,
  type DialogueTextContextTarget
} from "../../lib/dialogueTextContextMenu";
import { getActiveDialogueChapterIds } from "../resources/resourceScope";
import { characterBadgeColor, type DialogueStageTagTarget } from "./DialogueNodeBadges";
import type { TagAction } from "./DialogueTagPalette";
import type { StageCastActualPreviewContext } from "./StageCastEditor";
import { buildDialogueLocationOptions } from "./dialogueChoiceModel";
import { normalizeDialoguePresentationMode } from "./dialogueMetadata";
import {
  buildNodeSelectOptions,
  resolveNodeId,
  resolvePreviousPreviewNodeId
} from "./dialogueNodeOptions";
import {
  clampListIndex,
  escapeBbcodeAttribute
} from "./dialogueStatementModel";
import { insertTextWithTextareaUndo } from "./dialogueTextEditing";
import {
  characterIsProtagonist,
  characterLabel,
  cleanDialogueSpeakerStageCast,
  computeStageCharacterIdsAtNode,
  countManualStageCastRemovals,
  getStageCastRecord,
  normalizeEditorSpeakerId
} from "./stageCastModel";
import { useStatementFlowController } from "./useStatementFlowController";

export type DialogueNodesPanelProps = {
  draft: ResourceRecord | null;
  references: ReferenceResources;
  resourceChapterFilters: string[];
  selectedNodeIndex: number;
  nodeTextRef: MutableRefObject<HTMLTextAreaElement | null>;
  setSelectedNodeIndex: (index: number) => void;
  addDialogueNode: (mode: DialogueNodeMode) => void;
  insertDialogueNodeAfter: (index: number, mode: DialogueNodeMode) => void;
  duplicateDialogueNode: (index: number) => void;
  addStatementNode: () => void;
  updateDialogueNode: (index: number, node: ResourceRecord) => void;
  replaceDialogueNodes: (nodes: ResourceRecord[]) => void;
  removeDialogueNode: (index: number) => void;
  updateStatementNode: (index: number, node: ResourceRecord) => void;
  replaceStatementNodes: (nodes: ResourceRecord[]) => void;
  removeStatementNode: (index: number) => void;
  insertTag: (action: TagAction) => void;
  insertColorTag: (color: string) => void;
  onNavigateToStoryAssets?: () => void;
  bridgeEndpoint: string;
  notify: (message: string) => void;
  selectedId: string;
};

export function useDialogueNodesPanelController({
  addDialogueNode,
  addStatementNode,
  bridgeEndpoint,
  draft,
  nodeTextRef,
  notify,
  references,
  replaceDialogueNodes,
  replaceStatementNodes,
  resourceChapterFilters,
  selectedId,
  selectedNodeIndex,
  setSelectedNodeIndex,
  updateDialogueNode,
  updateStatementNode
}: DialogueNodesPanelProps) {
  const nodes = draft ? asArray<ResourceRecord>(draft.nodes) : [];
  const statementNodes = draft ? asArray<ResourceRecord>(draft.statement_nodes) : [];
  const selectedNode = nodes[selectedNodeIndex];
  const [mobileNodeListOpen, setMobileNodeListOpen] = useState(false);
  const [textContextMenu, setTextContextMenu] = useState<DialogueTextContextMenuState | null>(null);
  const [storyAssetPicker, setStoryAssetPicker] = useState<StoryAssetPickerState | null>(null);
  const nodeEditorRef = useRef<HTMLDivElement | null>(null);
  const draftId = draft ? String(draft.id || "") : "";
  const metadata = draft ? normalizeJsonObject(draft.metadata) : {};
  const presentationMode = normalizeDialoguePresentationMode(metadata.presentation_mode);
  const statementMode = presentationMode === "statement";
  const talkMode = presentationMode === "talk";
  const investigationMode = presentationMode === "investigation";
  const locationOptions = buildDialogueLocationOptions(metadata.locations ?? metadata.places, nodes);
  const ui = useUiText();
  const nodeOptions = useMemo(
    () => buildNodeSelectOptions(nodes, "@", references.characters),
    [nodes, references.characters]
  );
  const statementFlow = useStatementFlowController({
    addStatementNode,
    characters: references.characters,
    replaceStatementNodes,
    statementNodes,
    updateStatementNode
  });

  useEffect(() => {
    setMobileNodeListOpen(Boolean(draft) && !statementMode && nodes.length === 0);
  }, [draft, draftId, nodes.length, statementMode]);

  useDialogueTextContextMenuDismiss(textContextMenu, () => setTextContextMenu(null));

  const activeDialogueChapterIds = useMemo(
    () => getActiveDialogueChapterIds(draft, resourceChapterFilters),
    [draft, resourceChapterFilters]
  );

  function selectDialogueNode(index: number) {
    setSelectedNodeIndex(index);
    if (isMobileEditorLayout()) setMobileNodeListOpen(false);
  }

  function addDialogueNodeAndOpenEditor(mode: DialogueNodeMode) {
    addDialogueNode(mode);
    if (isMobileEditorLayout()) setMobileNodeListOpen(false);
  }

  function addStatementAndOpenEditor() {
    statementFlow.addStatementAndSelect();
    if (isMobileEditorLayout()) setMobileNodeListOpen(false);
  }

  function autoCleanSpeakerStageCast() {
    const manualRemovals = countManualStageCastRemovals(nodes, references.characters);
    const removeManualExtras = manualRemovals > 0
      ? window.confirm(ui.form.speakerAutoCleanConfirmManualRemove)
      : true;
    const result = cleanDialogueSpeakerStageCast(nodes, references.characters, { removeManualExtras });
    if (result.changedNodeCount === 0) {
      notify("화자 자동정리: 정리할 무대 캐스트가 없습니다.");
      return;
    }
    replaceDialogueNodes(result.nodes);
    setSelectedNodeIndex(clampListIndex(selectedNodeIndex, result.nodes.length));
    const summary = [
      result.addedCastCount > 0 ? `${result.addedCastCount}개 추가` : "",
      result.removedCastCount > 0 ? `${result.removedCastCount}개 제거` : ""
    ].filter(Boolean).join(" · ");
    notify(`화자 자동정리: ${result.changedNodeCount}개 노드에서 ${summary || "캐스트를 정리"}했습니다.`);
  }

  function handleOpenDialogueTextContextMenu(
    event: ReactMouseEvent<HTMLTextAreaElement | HTMLInputElement>,
    config: Omit<DialogueTextContextTarget, "textarea">
  ) {
    setTextContextMenu(openDialogueTextContextMenu(event, config));
  }

  function handleOpenStoryAssetPicker(action: DialogueEventContextAction, target: DialogueTextContextTarget) {
    setTextContextMenu(null);
    setStoryAssetPicker({ action, target });
  }

  function insertTextAtNodeCursor(inserted: string) {
    if (!selectedNode) return;
    const currentText = String(selectedNode.text || "");
    insertTextWithTextareaUndo(nodeTextRef.current, currentText, inserted, (nextText) => {
      updateDialogueNode(selectedNodeIndex, { ...selectedNode, text: nextText });
    });
  }

  function dialogueStageTagTargets() {
    if (!selectedNode) return [];
    const targets = new Map<string, DialogueStageTagTarget>();
    const appendTarget = (rawId: unknown) => {
      const characterId = normalizeEditorSpeakerId(rawId);
      if (!characterId || characterId === "mystery" || characterIsProtagonist(characterId, references.characters)) return;
      targets.set(characterId, {
        id: characterId,
        label: characterLabel(characterId, undefined, references.characters),
        color: characterBadgeColor(characterId, references.characters)
      });
    };
    appendTarget(selectedNode.speaker);
    Object.keys(getStageCastRecord(selectedNode.stage_cast)).forEach(appendTarget);
    computeStageCharacterIdsAtNode(selectedNodeIndex, nodes).forEach(appendTarget);
    return Array.from(targets.values());
  }

  function insertEnterTag(characterId: string) {
    insertTextAtNodeCursor(`[enter id="${escapeBbcodeAttribute(characterId)}"]`);
  }

  function insertExitTag(characterId: string) {
    insertTextAtNodeCursor(`[exit id="${escapeBbcodeAttribute(characterId)}"]`);
  }

  const showMobileNodeList = mobileNodeListOpen || (!statementMode && nodes.length === 0);
  const stageTagTargets = dialogueStageTagTargets();
  const stageCastPreviewContext: StageCastActualPreviewContext | undefined = selectedNode && draft
    ? {
      bridgeEndpoint,
      dialogueDraft: draft,
      dialogueId: String(draft.id || selectedId),
      nodeId: resolveNodeId(selectedNode, selectedNodeIndex, "@"),
      previousNodeId: resolvePreviousPreviewNodeId(nodes, selectedNodeIndex),
      notify
    }
    : undefined;

  return {
    activeDialogueChapterIds,
    activeReactionPath: statementFlow.activeReactionPath,
    addDialogueNodeAndOpenEditor,
    addReactionChildFromFlow: statementFlow.addReactionChildFromFlow,
    addStatementAndOpenEditor,
    autoCleanSpeakerStageCast,
    handleOpenDialogueTextContextMenu,
    handleOpenStoryAssetPicker,
    insertEnterTag,
    insertExitTag,
    investigationMode,
    locationOptions,
    moveStatementNode: statementFlow.moveStatementNode,
    nodeEditorRef,
    nodeOptions,
    nodes,
    selectedNode,
    selectedReactionNodePath: statementFlow.selectedReactionNodePath,
    selectedStatementIndex: statementFlow.selectedStatementIndex,
    selectDialogueNode,
    selectReaction: statementFlow.selectReaction,
    selectReactionChild: statementFlow.selectReactionChild,
    selectStatement: statementFlow.selectStatement,
    setMobileNodeListOpen,
    setStoryAssetPicker,
    setTextContextMenu,
    showMobileNodeList,
    stageCastPreviewContext,
    stageTagTargets,
    statementDetailRef: statementFlow.statementDetailRef,
    statementFlowRef: statementFlow.statementFlowRef,
    statementMode,
    statementNodes,
    storyAssetPicker,
    talkMode,
    textContextMenu,
    toggleReactionEnd: statementFlow.toggleReactionEnd,
    renderContextEffectPreview: (text: string) => renderRichTextNodes(parseRichTextPreviewAst(text), "context-preview", references)
  };
}

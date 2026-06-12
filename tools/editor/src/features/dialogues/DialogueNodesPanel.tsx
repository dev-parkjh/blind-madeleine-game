import { Icon } from "../../components/EditorControls";
import { blurFocusedFieldForContainerWheel } from "../../lib/focusWithoutScroll";
import { StoryAssetPickerOverlay } from "../../lib/storyAssetPicker";
import { DialogueBbcodeContextMenu } from "../../lib/dialogueTextContextMenu";
import { DialogueNodeEditorPane } from "./DialogueNodeEditorPane";
import { DialogueNodeListPanel } from "./DialogueNodeListPanel";
import { StatementNodesEditor } from "./StatementNodesEditor";
import {
  useDialogueNodesPanelController,
  type DialogueNodesPanelProps
} from "./useDialogueNodesPanelController";

export function DialogueNodesPanel(props: DialogueNodesPanelProps) {
  const {
    draft,
    duplicateDialogueNode,
    insertColorTag,
    insertDialogueNodeAfter,
    insertTag,
    nodeTextRef,
    onNavigateToStoryAssets,
    references,
    removeDialogueNode,
    removeStatementNode,
    selectedNodeIndex,
    setSelectedNodeIndex,
    updateDialogueNode,
    updateStatementNode
  } = props;
  const controller = useDialogueNodesPanelController(props);

  if (!draft) return <p className="empty-state">편집할 대사를 선택하세요.</p>;

  return (
    <div className={`nodes-layout ${controller.statementMode ? "statement-mode" : ""} ${controller.showMobileNodeList ? "mobile-list-open" : "mobile-editor-open"}`}>
      <DialogueNodeListPanel
        activeReactionPath={controller.activeReactionPath}
        nodes={controller.nodes}
        onAddDialogueNode={controller.addDialogueNodeAndOpenEditor}
        onAddReactionChild={controller.addReactionChildFromFlow}
        onAddStatementNode={controller.addStatementAndOpenEditor}
        onAutoCleanSpeakerStageCast={controller.autoCleanSpeakerStageCast}
        onClose={() => controller.setMobileNodeListOpen(false)}
        onMoveStatement={controller.moveStatementNode}
        onOpenDialogueTextContextMenu={controller.handleOpenDialogueTextContextMenu}
        onSelectDialogueNode={controller.selectDialogueNode}
        onSelectReaction={controller.selectReaction}
        onSelectReactionChild={controller.selectReactionChild}
        onSelectStatement={controller.selectStatement}
        onToggleReactionEnd={controller.toggleReactionEnd}
        references={references}
        removeStatementNode={removeStatementNode}
        selectedNode={controller.selectedNode}
        selectedNodeIndex={selectedNodeIndex}
        selectedReactionNodePath={controller.selectedReactionNodePath}
        selectedStatementIndex={controller.selectedStatementIndex}
        statementDetailRef={controller.statementDetailRef}
        statementFlowRef={controller.statementFlowRef}
        statementMode={controller.statementMode}
        statementNodes={controller.statementNodes}
        updateStatementNode={updateStatementNode}
      />

      <button className="node-list-scrim" aria-label="노드 목록 닫기" type="button" onClick={() => controller.setMobileNodeListOpen(false)} />
      <button
        className="node-list-floating-button"
        aria-controls="dialogue-node-list"
        aria-expanded={controller.showMobileNodeList}
        aria-label="노드 목록 열기"
        type="button"
        onClick={() => controller.setMobileNodeListOpen(true)}
      >
        <Icon name="FormatListBulleted" />
        <span>노드</span>
      </button>

      <div
        className="node-editor"
        ref={controller.nodeEditorRef}
        onWheel={(event) => {
          if (!controller.nodeEditorRef.current) return;
          blurFocusedFieldForContainerWheel(controller.nodeEditorRef.current, event.deltaY);
        }}
      >
        {controller.statementMode ? (
          <div className="statement-detail-scroll statement-detail-pane" ref={controller.statementDetailRef}>
            {controller.statementNodes.length === 0 ? (
              <p className="empty-state">진술 노드를 추가하세요.</p>
            ) : (
              <StatementNodesEditor
                activeReactionPath={controller.activeReactionPath}
                onOpenDialogueTextContextMenu={controller.handleOpenDialogueTextContextMenu}
                onSelectReaction={controller.selectReaction}
                onSelectReactionChild={controller.selectReactionChild}
                onSelectStatement={controller.selectStatement}
                references={references}
                selectedReactionNodePath={controller.selectedReactionNodePath}
                statementNodes={controller.statementNodes}
                updateStatementNode={updateStatementNode}
                removeStatementNode={removeStatementNode}
                visibleStatementIndex={controller.selectedStatementIndex}
                visibleReactionNodePath={controller.selectedReactionNodePath}
                visibleReactionPath={controller.activeReactionPath}
              />
            )}
          </div>
        ) : (
          <DialogueNodeEditorPane
            investigationMode={controller.investigationMode}
            locationOptions={controller.locationOptions}
            nodeOptions={controller.nodeOptions}
            nodes={controller.nodes}
            nodeTextRef={nodeTextRef}
            onDuplicateNode={duplicateDialogueNode}
            onInsertColorTag={insertColorTag}
            onInsertEnterTag={controller.insertEnterTag}
            onInsertExitTag={controller.insertExitTag}
            onInsertNodeAfter={insertDialogueNodeAfter}
            onInsertTag={insertTag}
            onOpenDialogueTextContextMenu={controller.handleOpenDialogueTextContextMenu}
            onOpenNodeList={() => controller.setMobileNodeListOpen(true)}
            onRemoveNode={removeDialogueNode}
            onSelectNodeIndex={setSelectedNodeIndex}
            onUpdateNode={updateDialogueNode}
            references={references}
            selectedNode={controller.selectedNode}
            selectedNodeIndex={selectedNodeIndex}
            stageCastPreviewContext={controller.stageCastPreviewContext}
            stageTagTargets={controller.stageTagTargets}
            talkMode={controller.talkMode}
          />
        )}
      </div>
      {controller.textContextMenu && (
        <DialogueBbcodeContextMenu
          characters={references.characters}
          menu={controller.textContextMenu}
          onClose={() => controller.setTextContextMenu(null)}
          onOpenStoryAssetPicker={controller.handleOpenStoryAssetPicker}
          renderEffectPreview={controller.renderContextEffectPreview}
        />
      )}
      {controller.storyAssetPicker && (
        <StoryAssetPickerOverlay
          activeChapterIds={controller.activeDialogueChapterIds}
          chapters={references.chapters}
          onClose={() => controller.setStoryAssetPicker(null)}
          onOpenStoryAssetsEditor={() => {
            controller.setStoryAssetPicker(null);
            onNavigateToStoryAssets?.();
          }}
          picker={controller.storyAssetPicker}
          storyAssetSummaries={references.storyAssets}
        />
      )}
    </div>
  );
}

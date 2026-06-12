import type { MouseEvent as ReactMouseEvent, MutableRefObject } from "react";
import type { DialogueNodeMode, ReferenceResources } from "../../editorTypes";
import { useUiText } from "../../editorText";
import { Icon } from "../../components/EditorControls";
import type { DialogueTextContextTarget } from "../../lib/dialogueTextContextMenu";
import type { ResourceRecord } from "../../types";
import { NodeRowBadgeStrip, nodeBgmBadges, nodeCastBadges } from "./DialogueNodeBadges";
import { StatementFlowNavigator } from "./StatementFlowNavigator";
import { StatementNodesEditor } from "./StatementNodesEditor";
import { dialogueNodeTitle } from "./dialogueNodeModel";
import { dialogueNodeSummary } from "./dialogueNodeOptions";
import type { StatementReactionNodePath, StatementReactionPath } from "./dialogueStatementModel";

export function DialogueNodeListPanel({
  activeReactionPath,
  nodes,
  onAddDialogueNode,
  onAddReactionChild,
  onAddStatementNode,
  onAutoCleanSpeakerStageCast,
  onClose,
  onMoveStatement,
  onOpenDialogueTextContextMenu,
  onSelectDialogueNode,
  onSelectReaction,
  onSelectReactionChild,
  onSelectStatement,
  onToggleReactionEnd,
  references,
  removeStatementNode,
  selectedNode,
  selectedNodeIndex,
  selectedReactionNodePath,
  selectedStatementIndex,
  statementDetailRef,
  statementFlowRef,
  statementMode,
  statementNodes,
  updateStatementNode
}: {
  activeReactionPath: StatementReactionPath | null;
  nodes: ResourceRecord[];
  onAddDialogueNode: (mode: DialogueNodeMode) => void;
  onAddReactionChild: (path: StatementReactionPath) => void;
  onAddStatementNode: () => void;
  onAutoCleanSpeakerStageCast: () => void;
  onClose: () => void;
  onMoveStatement: (fromIndex: number, toIndex: number) => void;
  onOpenDialogueTextContextMenu: (
    event: ReactMouseEvent<HTMLTextAreaElement | HTMLInputElement>,
    config: Omit<DialogueTextContextTarget, "textarea">
  ) => void;
  onSelectDialogueNode: (index: number) => void;
  onSelectReaction: (path: StatementReactionPath) => void;
  onSelectReactionChild: (path: StatementReactionNodePath) => void;
  onSelectStatement: (index: number) => void;
  onToggleReactionEnd: (path: StatementReactionPath, checked: boolean) => void;
  references: ReferenceResources;
  removeStatementNode: (index: number) => void;
  selectedNode: ResourceRecord | undefined;
  selectedNodeIndex: number;
  selectedReactionNodePath: StatementReactionNodePath | null;
  selectedStatementIndex: number;
  statementDetailRef: MutableRefObject<HTMLDivElement | null>;
  statementFlowRef: MutableRefObject<HTMLDivElement | null>;
  statementMode: boolean;
  statementNodes: ResourceRecord[];
  updateStatementNode: (index: number, node: ResourceRecord) => void;
}) {
  const ui = useUiText();

  return (
    <div className="node-list" id="dialogue-node-list">
      <div className="node-drawer-header">
        <strong><Icon name="FormatListBulleted" />노드 목록</strong>
        <button aria-label="노드 목록 닫기" type="button" onClick={onClose}>
          <Icon name="Close" />
        </button>
      </div>
      <div className="node-list-scroll">
        <div className="inline-actions">
          <button type="button" onClick={() => onAddDialogueNode("dialogue")}><Icon name="Add" />대사</button>
          <button type="button" onClick={() => onAddDialogueNode("stage")}><Icon name="Add" />무대</button>
          <button type="button" onClick={() => onAddDialogueNode("cutscene")}><Icon name="Add" />컷씬</button>
          <button type="button" onClick={onAddStatementNode}><Icon name="Add" />진술</button>
          <button className="node-auto-clean-button" disabled={nodes.length === 0} type="button" onClick={onAutoCleanSpeakerStageCast}>
            <Icon name="AutoFixHigh" />{ui.form.speakerAutoClean}
          </button>
        </div>
        {selectedNode && (
          <button className="node-editor-return-button" type="button" onClick={onClose}>
            <Icon name="Edit" />현재 노드 편집
          </button>
        )}
        {nodes.map((node, index) => {
          const castBadges = nodeCastBadges(node, index, nodes, references);
          const bgmBadges = nodeBgmBadges(node, references);
          const hasRowBadges = castBadges.length > 0 || bgmBadges.length > 0;
          return (
            <button
              className={`node-row ${index === selectedNodeIndex ? "active" : ""} ${hasRowBadges ? "has-cast-badges" : ""}`}
              key={index}
              type="button"
              onClick={() => onSelectDialogueNode(index)}
            >
              <strong>{index + 1}. {dialogueNodeTitle(node, references, ui)}</strong>
              <span className="node-row-summary">{dialogueNodeSummary(node, references)}</span>
              <NodeRowBadgeStrip bgmBadges={bgmBadges} castBadges={castBadges} />
            </button>
          );
        })}
        <div className="statement-summary">
          <b>Statement nodes</b>
          <span>{statementNodes.length}개</span>
        </div>
        <StatementFlowNavigator
          activeReactionPath={activeReactionPath}
          onAddReactionChild={onAddReactionChild}
          onMoveStatement={onMoveStatement}
          onSelectReaction={onSelectReaction}
          onSelectReactionChild={onSelectReactionChild}
          onSelectStatement={onSelectStatement}
          onToggleReactionEnd={onToggleReactionEnd}
          references={references}
          selectedReactionNodePath={selectedReactionNodePath}
          selectedStatementIndex={selectedStatementIndex}
          statementNodes={statementNodes}
          statementFlowRef={statementFlowRef}
        />
        {!statementMode && (
          <div className="statement-detail-scroll" ref={statementDetailRef}>
            <StatementNodesEditor
              activeReactionPath={activeReactionPath}
              onOpenDialogueTextContextMenu={onOpenDialogueTextContextMenu}
              onSelectReaction={onSelectReaction}
              onSelectReactionChild={onSelectReactionChild}
              onSelectStatement={onSelectStatement}
              references={references}
              selectedReactionNodePath={selectedReactionNodePath}
              statementNodes={statementNodes}
              updateStatementNode={updateStatementNode}
              removeStatementNode={removeStatementNode}
            />
          </div>
        )}
      </div>
    </div>
  );
}

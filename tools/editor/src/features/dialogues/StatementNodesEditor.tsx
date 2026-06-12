import type { MouseEvent as ReactMouseEvent } from "react";
import type { ReferenceResources } from "../../editorTypes";
import type { DialogueTextContextTarget } from "../../lib/dialogueTextContextMenu";
import type { ResourceRecord } from "../../types";
import type {
  StatementReactionNodePath,
  StatementReactionPath
} from "./dialogueStatementModel";
import { StatementNodeEditor } from "./StatementNodeEditor";

export function StatementNodesEditor({
  activeReactionPath,
  onSelectReaction,
  onSelectReactionChild,
  onSelectStatement,
  references,
  selectedReactionNodePath,
  statementNodes,
  updateStatementNode,
  removeStatementNode,
  onOpenDialogueTextContextMenu,
  visibleReactionNodePath,
  visibleReactionPath,
  visibleStatementIndex
}: {
  activeReactionPath: StatementReactionPath | null;
  onSelectReaction: (path: StatementReactionPath) => void;
  onSelectReactionChild: (path: StatementReactionNodePath) => void;
  onSelectStatement: (index: number) => void;
  references: ReferenceResources;
  selectedReactionNodePath: StatementReactionNodePath | null;
  statementNodes: ResourceRecord[];
  updateStatementNode: (index: number, node: ResourceRecord) => void;
  removeStatementNode: (index: number) => void;
  onOpenDialogueTextContextMenu?: (
    event: ReactMouseEvent<HTMLTextAreaElement | HTMLInputElement>,
    config: Omit<DialogueTextContextTarget, "textarea">
  ) => void;
  visibleReactionNodePath?: StatementReactionNodePath | null;
  visibleReactionPath?: StatementReactionPath | null;
  visibleStatementIndex?: number;
}) {
  if (statementNodes.length === 0) return null;
  const visibleStatements = statementNodes
    .map((node, index) => ({ node, index }))
    .filter(({ index }) => visibleStatementIndex === undefined || index === visibleStatementIndex);
  if (visibleStatements.length === 0) return null;

  return (
    <div className="statement-editor-list">
      {visibleStatements.map(({ node, index }) => (
        <StatementNodeEditor
          activeReactionPath={activeReactionPath}
          index={index}
          key={index}
          node={node}
          onOpenDialogueTextContextMenu={onOpenDialogueTextContextMenu}
          onRemove={() => removeStatementNode(index)}
          onSelectReaction={onSelectReaction}
          onSelectReactionChild={onSelectReactionChild}
          onSelectStatement={() => onSelectStatement(index)}
          references={references}
          selectedReactionNodePath={selectedReactionNodePath}
          statementNodes={statementNodes}
          updateNode={(nextNode) => updateStatementNode(index, nextNode)}
          visibleReactionNodePath={visibleReactionNodePath}
          visibleReactionPath={visibleReactionPath?.statementIndex === index ? visibleReactionPath : null}
        />
      ))}
    </div>
  );
}

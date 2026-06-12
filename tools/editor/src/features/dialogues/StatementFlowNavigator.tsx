import type { DragEvent as ReactDragEvent, MutableRefObject } from "react";
import { useState } from "react";
import type { ReferenceResources } from "../../editorTypes";
import { Icon } from "../../components/EditorControls";
import { getDialogueVisiblePreviewText } from "../../components/RichTextPreview";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord } from "../../types";
import { speakerLabel } from "./dialogueNodeModel";
import { dialogueNodeSummary } from "./dialogueNodeOptions";
import {
  clampListIndex,
  getStatementLies,
  isSameStatementReactionNodePath,
  isSameStatementReactionPath,
  statementReactionDisplayLabel,
  statementReactionNodePathKey,
  statementReactionPathKey,
  type StatementReactionNodePath,
  type StatementReactionPath
} from "./dialogueStatementModel";

export function StatementFlowNavigator({
  activeReactionPath,
  onAddReactionChild,
  onMoveStatement,
  onSelectReaction,
  onSelectReactionChild,
  onSelectStatement,
  onToggleReactionEnd,
  references,
  selectedReactionNodePath,
  selectedStatementIndex,
  statementFlowRef,
  statementNodes
}: {
  activeReactionPath: StatementReactionPath | null;
  onAddReactionChild: (path: StatementReactionPath) => void;
  onMoveStatement: (fromIndex: number, toIndex: number) => void;
  onSelectReaction: (path: StatementReactionPath) => void;
  onSelectReactionChild: (path: StatementReactionNodePath) => void;
  onSelectStatement: (index: number) => void;
  onToggleReactionEnd: (path: StatementReactionPath, checked: boolean) => void;
  references: ReferenceResources;
  selectedReactionNodePath: StatementReactionNodePath | null;
  selectedStatementIndex: number;
  statementFlowRef: MutableRefObject<HTMLDivElement | null>;
  statementNodes: ResourceRecord[];
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function dropStatement(event: ReactDragEvent<HTMLElement>, targetIndex: number) {
    event.preventDefault();
    if (dragIndex == null) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;
    let nextIndex = targetIndex + (after ? 1 : 0);
    if (dragIndex < nextIndex) nextIndex -= 1;
    onMoveStatement(dragIndex, clampListIndex(nextIndex, statementNodes.length));
    setDragIndex(null);
  }

  if (statementNodes.length === 0) {
    return <p className="empty-state">진술 목록이 비어 있습니다.</p>;
  }

  return (
    <section className="statement-flow-navigator" ref={statementFlowRef}>
      <div className="statement-flow-title">
        <b>Statement flow</b>
        <span>{statementNodes.length} nodes</span>
      </div>
      <div className="statement-flow-list">
        {statementNodes.map((node, index) => {
          const activeStatement = selectedStatementIndex === index || activeReactionPath?.statementIndex === index;
          const previewText = getDialogueVisiblePreviewText(node.text).slice(0, 52) || "빈 대사";
          const statementTarget = `statement:${index}`;
          return (
            <article
              className={`statement-flow-row ${activeStatement ? "active" : ""} ${dragIndex === index ? "dragging" : ""}`}
              data-statement-target={statementTarget}
              draggable
              key={index}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => setDragIndex(index)}
              onDrop={(event) => dropStatement(event, index)}
            >
              <div className="statement-flow-card">
                <button className="statement-flow-card-main" type="button" onClick={() => onSelectStatement(index)}>
                  <span className="statement-flow-index">{index + 1}</span>
                  <span>
                    <strong>{speakerLabel(node.speaker, references.characters)}</strong>
                    <small>{previewText}</small>
                  </span>
                </button>
                <div className="statement-flow-card-actions">
                  <button aria-label="Move statement up" disabled={index === 0} type="button" onClick={() => onMoveStatement(index, index - 1)}><Icon name="KeyboardArrowUp" /></button>
                  <button aria-label="Move statement down" disabled={index >= statementNodes.length - 1} type="button" onClick={() => onMoveStatement(index, index + 1)}><Icon name="KeyboardArrowDown" /></button>
                </div>
              </div>
              <div className="statement-flow-reactions">
                {getStatementLies(node).flatMap((lie, lieIndex) => (
                  asArray<ResourceRecord>(lie.reactions).map((reaction, reactionIndex) => {
                    const path = { statementIndex: index, lieIndex, reactionIndex };
                    const reactionKey = statementReactionPathKey(path);
                    const activeReaction = isSameStatementReactionPath(activeReactionPath, path);
                    const childNodes = asArray<ResourceRecord>(reaction.nodes);
                    return (
                      <article
                        className={`statement-flow-reaction ${activeReaction ? "active" : ""}`}
                        data-statement-target={`reaction:${reactionKey}`}
                        key={reactionKey}
                      >
                        <div className="statement-flow-reaction-header">
                          <button type="button" onClick={() => onSelectReaction(path)}>
                            <Icon name="SubdirectoryArrowRight" />
                            <span>{statementReactionDisplayLabel(reaction, lie, reactionIndex, references)}</span>
                            <small>{lie.phrase || `lie ${lieIndex + 1}`}</small>
                          </button>
                          <label title="이 반응 후 진술을 종료">
                            <input
                              checked={Boolean(reaction.statement_end)}
                              onChange={(event) => onToggleReactionEnd(path, event.target.checked)}
                              type="checkbox"
                            />
                            <span>종료</span>
                          </label>
                          <button aria-label="Add reaction node" type="button" onClick={() => onAddReactionChild(path)}><Icon name="Add" /></button>
                        </div>
                        <div className="statement-flow-child-list">
                          {childNodes.length === 0 && <span className="statement-flow-empty">반응 대사 없음</span>}
                          {childNodes.map((childNode, childIndex) => {
                            const childPath = { ...path, childIndex };
                            const childKey = statementReactionNodePathKey(childPath);
                            const childActive = isSameStatementReactionNodePath(selectedReactionNodePath, childPath);
                            return (
                              <button
                                className={`statement-flow-child ${childActive ? "active" : ""}`}
                                data-statement-target={`child:${childKey}`}
                                key={childKey}
                                type="button"
                                onClick={() => onSelectReactionChild(childPath)}
                              >
                                <span className="statement-flow-child-index">{childIndex + 1}</span>
                                <span>{dialogueNodeSummary(childNode, references)}</span>
                              </button>
                            );
                          })}
                          {childNodes.length > 0 && !reaction.statement_end && <span className="statement-flow-return">진술로 복귀</span>}
                        </div>
                      </article>
                    );
                  })
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

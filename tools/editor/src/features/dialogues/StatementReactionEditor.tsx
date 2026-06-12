import type { MouseEvent as ReactMouseEvent } from "react";
import { Icon, SelectField, SelectLiteralField, TextField, ToggleField } from "../../components/EditorControls";
import type { DialogueNodeMode, ReferenceResources } from "../../editorTypes";
import type { DialogueTextContextTarget } from "../../lib/dialogueTextContextMenu";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord } from "../../types";
import { defaultNestedNode } from "./dialogueNodeModel";
import {
  isSameStatementReactionNodePath,
  isSameStatementReactionPath,
  statementReactionPathKey,
  type StatementReactionNodePath,
  type StatementReactionPath
} from "./dialogueStatementModel";
import { NestedDialogueNodeEditor } from "./NestedDialogueNodeEditor";
import { applyInheritedStageCastDefaults } from "./stageCastModel";

export function StatementReactionEditor({
  activeReactionPath,
  lie,
  lieIndex,
  onOpenDialogueTextContextMenu,
  onSelectReaction,
  onSelectReactionChild,
  reaction,
  reactionIndex,
  references,
  selectedReactionNodePath,
  statementIndex,
  visibleChildIndex,
  updateReaction,
  removeReaction
}: {
  activeReactionPath: StatementReactionPath | null;
  lie: ResourceRecord;
  lieIndex: number;
  onOpenDialogueTextContextMenu?: (
    event: ReactMouseEvent<HTMLTextAreaElement | HTMLInputElement>,
    config: Omit<DialogueTextContextTarget, "textarea">
  ) => void;
  onSelectReaction: (path: StatementReactionPath) => void;
  onSelectReactionChild: (path: StatementReactionNodePath) => void;
  reaction: ResourceRecord;
  reactionIndex: number;
  references: ReferenceResources;
  selectedReactionNodePath: StatementReactionNodePath | null;
  statementIndex: number;
  visibleChildIndex?: number;
  updateReaction: (reaction: ResourceRecord) => void;
  removeReaction: () => void;
}) {
  const kind = String(reaction.kind || "default");
  const childNodes = asArray<ResourceRecord>(reaction.nodes);
  const visibleChildNodes = childNodes
    .map((childNode, childIndex) => ({ childNode, childIndex }))
    .filter(({ childIndex }) => visibleChildIndex === undefined || childIndex === visibleChildIndex);
  const targetOptions = kind === "item" ? references.items : references.characters;
  const childNodeAutoPrefix = `@reaction_${statementIndex}_${lieIndex}_${reactionIndex}_`;
  const reactionPath = { statementIndex, lieIndex, reactionIndex };
  const active = isSameStatementReactionPath(activeReactionPath, reactionPath);

  function updateChildNode(childIndex: number, nextNode: ResourceRecord) {
    updateReaction({
      ...reaction,
      nodes: childNodes.map((node, index) => index === childIndex ? nextNode : node)
    });
  }

  function removeChildNode(childIndex: number) {
    updateReaction({ ...reaction, nodes: childNodes.filter((_, index) => index !== childIndex) });
  }

  function addChildNode(mode: DialogueNodeMode) {
    const childIndex = childNodes.length;
    const nextNode = defaultNestedNode(mode);
    const inheritedNode = applyInheritedStageCastDefaults(nextNode, childIndex, [...childNodes, nextNode], references.characters);
    updateReaction({ ...reaction, nodes: [...childNodes, inheritedNode] });
  }

  function updateKind(nextKind: string) {
    updateReaction({
      ...reaction,
      kind: nextKind,
      target_id: nextKind === "default" ? "" : reaction.target_id || "",
      label: nextKind === "default" ? reaction.label || "잘못된 연결" : reaction.label || ""
    });
  }

  return (
    <article
      className={`statement-reaction-editor ${active ? "active" : ""}`}
      data-statement-target={`reaction:${statementReactionPathKey(reactionPath)}`}
    >
      <div className="structured-header">
        <button className="statement-select-button" type="button" onClick={() => onSelectReaction(reactionPath)}>
          Reaction {lieIndex + 1}-{reactionIndex + 1}
        </button>
        <button className="danger-action" type="button" onClick={removeReaction}><Icon name="Delete" />삭제</button>
      </div>
      <div className="form-grid compact statement-form-grid">
        <SelectLiteralField label="Kind" value={kind} options={["default", "character", "item"]} onChange={updateKind} />
        {kind === "default" ? (
          <label className="field-block">
            <span>Target</span>
            <input disabled readOnly type="text" value="대상 없음" />
          </label>
        ) : (
          <SelectField label={kind === "item" ? "Item" : "Character"} value={reaction.target_id || ""} options={targetOptions} onChange={(value) => updateReaction({ ...reaction, target_id: value })} />
        )}
        <TextField label="Label" value={reaction.label || ""} onChange={(value) => updateReaction({ ...reaction, label: value })} />
        <TextField label="Next" value={reaction.next || ""} onChange={(value) => updateReaction({ ...reaction, next: value })} />
        <ToggleField label="Statement end" checked={Boolean(reaction.statement_end)} onChange={(checked) => updateReaction({ ...reaction, statement_end: checked })} />
      </div>
      <div className="structured-header">
        <span>Reaction nodes</span>
        <div className="inline-actions">
          <button type="button" onClick={() => addChildNode("dialogue")}><Icon name="Add" />대사</button>
          <button type="button" onClick={() => addChildNode("stage")}><Icon name="Add" />무대</button>
          <button type="button" onClick={() => addChildNode("cutscene")}><Icon name="Add" />컷씬</button>
        </div>
      </div>
      {childNodes.length === 0 && <p className="empty-state">반응 대사 없음</p>}
      <div className="statement-child-node-list">
        {visibleChildNodes.map(({ childNode, childIndex }) => (
          <NestedDialogueNodeEditor
            active={isSameStatementReactionNodePath(selectedReactionNodePath, { ...reactionPath, childIndex })}
            key={childIndex}
            index={childIndex}
            node={childNode}
            nodeAutoPrefix={childNodeAutoPrefix}
            nodes={childNodes}
            onOpenDialogueTextContextMenu={onOpenDialogueTextContextMenu}
            onSelect={() => onSelectReactionChild({ ...reactionPath, childIndex })}
            references={references}
            removeNode={() => removeChildNode(childIndex)}
            statementTargetKey={`child:${statementReactionPathKey(reactionPath)}:${childIndex}`}
            updateNode={(nextNode) => updateChildNode(childIndex, nextNode)}
          />
        ))}
      </div>
      {childNodes.length > 0 && !reaction.statement_end && <p className="statement-reaction-return">진술로 복귀</p>}
      <span className="muted">Phrase: {lie.phrase || "미지정"}</span>
    </article>
  );
}

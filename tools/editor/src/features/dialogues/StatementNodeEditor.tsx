import type { MouseEvent as ReactMouseEvent } from "react";
import { Icon, SelectField, TextField, ToggleField } from "../../components/EditorControls";
import { RichTextPreview } from "../../components/RichTextPreview";
import type { ReferenceResources } from "../../editorTypes";
import type { DialogueTextContextTarget } from "../../lib/dialogueTextContextMenu";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord, ResourceSummary } from "../../types";
import { AcquireInfoEditor, getNodeAcquireInfoEditorValue, withNodeAcquireInfo } from "./AcquireInfoEditor";
import { ChoiceLayoutPreview } from "./ChoiceLayoutPreview";
import { DialogueChoicesEditor } from "./DialogueChoicesEditor";
import { buildNodeSelectOptions } from "./dialogueNodeOptions";
import { getNodePopupsEditorValue, withNodePopups } from "./dialoguePopupModel";
import {
  defaultStatementReactionRecord,
  getStatementLies,
  isSameStatementReactionPath,
  statementReactionPathKey,
  syncStatementLiesForText,
  withStatementLies,
  type StatementReactionNodePath,
  type StatementReactionPath
} from "./dialogueStatementModel";
import { NodePopupsEditor } from "./NodePopupsEditor";
import { StageCastEditor } from "./StageCastEditor";
import {
  getNodeFocusTargets,
  getNodeSpeakerMystery,
  withNodeFocusTargets,
  withSpeakerStageCastDefaults
} from "./stageCastModel";
import { StatementLieList } from "./StatementLieList";
import { StatementReactionEditor } from "./StatementReactionEditor";

export function StatementNodeEditor({
  activeReactionPath,
  index,
  node,
  onOpenDialogueTextContextMenu,
  onRemove,
  onSelectReaction,
  onSelectReactionChild,
  onSelectStatement,
  references,
  selectedReactionNodePath,
  statementNodes,
  updateNode,
  visibleReactionNodePath,
  visibleReactionPath
}: {
  activeReactionPath: StatementReactionPath | null;
  index: number;
  node: ResourceRecord;
  onOpenDialogueTextContextMenu?: (
    event: ReactMouseEvent<HTMLTextAreaElement | HTMLInputElement>,
    config: Omit<DialogueTextContextTarget, "textarea">
  ) => void;
  onRemove: () => void;
  onSelectReaction: (path: StatementReactionPath) => void;
  onSelectReactionChild: (path: StatementReactionNodePath) => void;
  onSelectStatement: () => void;
  references: ReferenceResources;
  selectedReactionNodePath: StatementReactionNodePath | null;
  statementNodes: ResourceRecord[];
  updateNode: (node: ResourceRecord) => void;
  visibleReactionNodePath?: StatementReactionNodePath | null;
  visibleReactionPath: StatementReactionPath | null;
}) {
  const lies = getStatementLies(node);

  function updateText(text: string) {
    updateNode(withStatementLies({ ...node, text }, syncStatementLiesForText(text, lies)));
  }

  function updateLie(lieIndex: number, nextLie: ResourceRecord) {
    updateNode(withStatementLies(
      node,
      lies.map((lie, entryIndex) => entryIndex === lieIndex ? nextLie : lie)
    ));
  }

  function addReaction(lieIndex: number) {
    const nextLies = lies.map((lie, entryIndex) => entryIndex === lieIndex
      ? { ...lie, reactions: [...asArray<ResourceRecord>(lie.reactions), defaultStatementReactionRecord("character")] }
      : lie);
    updateNode(withStatementLies(node, nextLies));
  }

  function removeReaction(lieIndex: number, reactionIndex: number) {
    const nextLies = lies.map((lie, entryIndex) => {
      if (entryIndex !== lieIndex) return lie;
      const nextReactions = asArray<ResourceRecord>(lie.reactions).filter((_, indexToRemove) => indexToRemove !== reactionIndex);
      return { ...lie, reactions: nextReactions.length > 0 ? nextReactions : [defaultStatementReactionRecord()] };
    });
    updateNode(withStatementLies(node, nextLies));
  }

  if (visibleReactionPath) {
    const lie = lies[visibleReactionPath.lieIndex];
    const reaction = asArray<ResourceRecord>(lie?.reactions)[visibleReactionPath.reactionIndex];
    if (!lie || !reaction) return null;
    return (
      <StatementReactionEditor
        activeReactionPath={activeReactionPath}
        key={`reaction-detail-${statementReactionPathKey(visibleReactionPath)}`}
        lie={lie}
        lieIndex={visibleReactionPath.lieIndex}
        onOpenDialogueTextContextMenu={onOpenDialogueTextContextMenu}
        onSelectReaction={onSelectReaction}
        onSelectReactionChild={onSelectReactionChild}
        reaction={reaction}
        reactionIndex={visibleReactionPath.reactionIndex}
        references={references}
        selectedReactionNodePath={selectedReactionNodePath}
        statementIndex={index}
        visibleChildIndex={isSameStatementReactionPath(visibleReactionNodePath, visibleReactionPath) ? visibleReactionNodePath?.childIndex : undefined}
        removeReaction={() => removeReaction(visibleReactionPath.lieIndex, visibleReactionPath.reactionIndex)}
        updateReaction={(nextReaction) => {
          const reactions = asArray<ResourceRecord>(lie.reactions);
          updateLie(visibleReactionPath.lieIndex, {
            ...lie,
            reactions: reactions.map((entry, entryIndex) => entryIndex === visibleReactionPath.reactionIndex ? nextReaction : entry)
          });
        }}
      />
    );
  }

  return (
    <article
      className="statement-editor"
      data-statement-target={`statement:${index}`}
    >
      <div className="structured-header">
        <button className="statement-select-button" type="button" onClick={onSelectStatement}>
          Statement {index + 1}
        </button>
        <button className="danger-action" type="button" onClick={onRemove}>
          <Icon name="Delete" />삭제
        </button>
      </div>
      <div className="form-grid compact statement-form-grid">
        <SelectField
          label="Speaker"
          value={node.speaker || "narrator"}
          options={[{ id: "narrator", title: "narrator", subtitle: "built-in", type: "characters", isProtagonist: true } as ResourceSummary, ...references.characters]}
          onChange={(value) => updateNode(withSpeakerStageCastDefaults(node, value, statementNodes, index, references.characters))}
        />
        <ToggleField label="Statement end" checked={Boolean(node.statement_end)} onChange={(checked) => updateNode({ ...node, statement_end: checked })} />
      </div>
      <TextField
        label="Text"
        multiline
        value={node.text || ""}
        onChange={updateText}
        onContextMenu={onOpenDialogueTextContextMenu ? (event) => onOpenDialogueTextContextMenu(event, {
          kind: "statement",
          showStatementLie: true,
          getText: () => String(node.text || ""),
          onTextChange: updateText
        }) : undefined}
      />
      <RichTextPreview compact references={references} text={node.text || ""} />
      <DialogueChoicesEditor
        compact
        node={node}
        nodeOptions={buildNodeSelectOptions(statementNodes, "@statement_", references.characters)}
        renderLayoutPreview={(choices, choiceNode) => <ChoiceLayoutPreview choices={choices} node={choiceNode} />}
        onOpenDialogueTextContextMenu={onOpenDialogueTextContextMenu}
        references={references}
        updateNode={updateNode}
      />
      <StageCastEditor
        characters={references.characters}
        nodes={statementNodes}
        selectedNodeIndex={index}
        speakerId={String(node.speaker || "")}
        speakerMystery={getNodeSpeakerMystery(node)}
        focusTargets={getNodeFocusTargets(node)}
        stageCast={node.stage_cast}
        onFocusTargetsChange={(focusTargets) => updateNode(withNodeFocusTargets(node, focusTargets))}
        onChange={(stageCast) => updateNode({ ...node, stage_cast: stageCast })}
      />
      <AcquireInfoEditor
        references={references}
        value={getNodeAcquireInfoEditorValue(node)}
        onChange={(acquireInfo) => updateNode(withNodeAcquireInfo(node, acquireInfo))}
      />
      <NodePopupsEditor
        node={node}
        popups={getNodePopupsEditorValue(node)}
        references={references}
        onChange={(popups) => updateNode(withNodePopups(node, popups))}
      />
      <StatementLieList
        activeReactionPath={activeReactionPath}
        lies={lies}
        onAddReaction={addReaction}
        onOpenDialogueTextContextMenu={onOpenDialogueTextContextMenu}
        onRemoveReaction={removeReaction}
        onSelectReaction={onSelectReaction}
        onSelectReactionChild={onSelectReactionChild}
        onUpdateLie={updateLie}
        references={references}
        selectedReactionNodePath={selectedReactionNodePath}
        statementIndex={index}
      />
    </article>
  );
}

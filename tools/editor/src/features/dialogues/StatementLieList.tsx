import type { MouseEvent as ReactMouseEvent } from "react";
import { Icon, TextField } from "../../components/EditorControls";
import type { ReferenceResources } from "../../editorTypes";
import type { DialogueTextContextTarget } from "../../lib/dialogueTextContextMenu";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord } from "../../types";
import type {
  StatementReactionNodePath,
  StatementReactionPath
} from "./dialogueStatementModel";
import { StatementReactionEditor } from "./StatementReactionEditor";

export function StatementLieList({
  activeReactionPath,
  lies,
  onAddReaction,
  onOpenDialogueTextContextMenu,
  onRemoveReaction,
  onSelectReaction,
  onSelectReactionChild,
  onUpdateLie,
  references,
  selectedReactionNodePath,
  statementIndex
}: {
  activeReactionPath: StatementReactionPath | null;
  lies: ResourceRecord[];
  onAddReaction: (lieIndex: number) => void;
  onOpenDialogueTextContextMenu?: (
    event: ReactMouseEvent<HTMLTextAreaElement | HTMLInputElement>,
    config: Omit<DialogueTextContextTarget, "textarea">
  ) => void;
  onRemoveReaction: (lieIndex: number, reactionIndex: number) => void;
  onSelectReaction: (path: StatementReactionPath) => void;
  onSelectReactionChild: (path: StatementReactionNodePath) => void;
  onUpdateLie: (lieIndex: number, lie: ResourceRecord) => void;
  references: ReferenceResources;
  selectedReactionNodePath: StatementReactionNodePath | null;
  statementIndex: number;
}) {
  return (
    <div className="reaction-list">
      {lies.length === 0 && <span className="muted">[lie] 문구 없음</span>}
      {lies.map((lie, lieIndex) => (
        <details className="statement-lie-card" key={`${lie.id || "lie"}-${lieIndex}`} open>
          <summary>
            <b>[lie] {lie.phrase || `#${lieIndex + 1}`}</b>
            <span>{asArray(lie.reactions).length} reactions</span>
            <button type="button" onClick={(event) => {
              event.preventDefault();
              onAddReaction(lieIndex);
            }}>
              <Icon name="Add" />반응
            </button>
          </summary>
          <div className="statement-reaction-stack">
            <TextField label="Lie ID" value={lie.id || `lie_${lieIndex}`} onChange={(value) => onUpdateLie(lieIndex, { ...lie, id: value })} />
            <TextField label="Phrase" value={lie.phrase || ""} onChange={(value) => onUpdateLie(lieIndex, { ...lie, phrase: value })} />
            {asArray<ResourceRecord>(lie.reactions).map((reaction, reactionIndex) => (
              <StatementReactionEditor
                activeReactionPath={activeReactionPath}
                key={`${reaction.kind || "reaction"}-${reactionIndex}`}
                lie={lie}
                lieIndex={lieIndex}
                onOpenDialogueTextContextMenu={onOpenDialogueTextContextMenu}
                onSelectReaction={onSelectReaction}
                onSelectReactionChild={onSelectReactionChild}
                reaction={reaction}
                reactionIndex={reactionIndex}
                references={references}
                selectedReactionNodePath={selectedReactionNodePath}
                statementIndex={statementIndex}
                removeReaction={() => onRemoveReaction(lieIndex, reactionIndex)}
                updateReaction={(nextReaction) => {
                  const reactions = asArray<ResourceRecord>(lie.reactions);
                  onUpdateLie(lieIndex, {
                    ...lie,
                    reactions: reactions.map((entry, entryIndex) => entryIndex === reactionIndex ? nextReaction : entry)
                  });
                }}
              />
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

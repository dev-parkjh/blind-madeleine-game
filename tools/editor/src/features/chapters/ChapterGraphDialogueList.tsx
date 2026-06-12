import type { ResourceSummary } from "../../types";

export function ChapterGraphDialogueList({
  dialogues,
  emptyLabel,
  onFocusDialogue,
  onSearchChange,
  placedIds,
  searchLabel,
  searchValue,
  selectedNodeId,
  startDialogueId
}: {
  dialogues: ResourceSummary[];
  emptyLabel: string;
  onFocusDialogue: (dialogueId: string) => void;
  onSearchChange: (value: string) => void;
  placedIds: string[];
  searchLabel: string;
  searchValue: string;
  selectedNodeId: string;
  startDialogueId: string;
}) {
  return (
    <aside className="chapter-graph-dialogue-list" aria-label="대화 목록">
      <div className="chapter-graph-dialogue-list-header">
        <strong>대화 목록</strong>
        <code>{dialogues.length}</code>
      </div>
      <input
        aria-label={searchLabel}
        className="chapter-graph-dialogue-search"
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={`${searchLabel} (id, 제목)`}
        type="search"
        value={searchValue}
      />
      <div className="chapter-graph-dialogue-items" role="list">
        {dialogues.length === 0 && <p className="empty-state">{emptyLabel}</p>}
        {dialogues.map((dialogue) => {
          const placed = placedIds.includes(dialogue.id);
          const isStart = dialogue.id === startDialogueId;
          return (
            <button
              className={`chapter-graph-dialogue-item ${selectedNodeId === dialogue.id ? "selected" : ""} ${placed ? "placed" : "unplaced"}`}
              key={dialogue.id}
              type="button"
              onClick={() => onFocusDialogue(dialogue.id)}
            >
              <span>{dialogue.title || dialogue.id}</span>
              <code>{dialogue.id}{isStart ? " · start" : ""}{placed ? "" : " · 미배치"}</code>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

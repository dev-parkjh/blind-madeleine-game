import { Icon, NumberField, SelectField, ToggleField } from "../../components/EditorControls";
import type { ResourceRecord, ResourceSummary } from "../../types";
import {
  getChapterGraphBlackout,
  getChapterGraphBlackoutFade,
  getChapterGraphBlackoutHold
} from "./chapterGraphModel";

export function ChapterGraphInspector({
  busy,
  disabled,
  getDialoguePreview,
  incomingIds,
  nextDialogueSelectOptions,
  onOpenDialogue,
  onRemovePlacedDialogue,
  onSaveMetadata,
  onSelectIncomingEdge,
  onSetStartDialogue,
  selectedEdge,
  selectedEdgeData,
  selectedEdgeFromId,
  selectedNodeData,
  selectedNodeId,
  selectedNodeNext,
  startDialogueId,
  titleForDialogue
}: {
  busy: boolean;
  disabled: boolean;
  getDialoguePreview: (dialogue: ResourceRecord | undefined) => string;
  incomingIds: string[];
  nextDialogueSelectOptions: ResourceSummary[];
  onOpenDialogue: (dialogueId: string) => void;
  onRemovePlacedDialogue: (dialogueId: string) => void;
  onSaveMetadata: (sourceId: string, patch: ResourceRecord) => void;
  onSelectIncomingEdge: (sourceId: string) => void;
  onSetStartDialogue: (dialogueId: string) => void;
  selectedEdge: string;
  selectedEdgeData: ResourceRecord | undefined;
  selectedEdgeFromId: string;
  selectedNodeData: ResourceRecord | undefined;
  selectedNodeId: string;
  selectedNodeNext: string;
  startDialogueId: string;
  titleForDialogue: (dialogueId: string) => string;
}) {
  return (
    <aside className="chapter-graph-inspector" aria-label="그래프 검사">
      {selectedEdgeFromId && selectedEdge ? (
        <div className="chapter-graph-edge-panel">
          <strong>{selectedEdgeFromId} {"->"} {selectedEdge}</strong>
          <ToggleField
            label="암전 후 다음 대화"
            checked={getChapterGraphBlackout(selectedEdgeData)}
            onChange={(checked) => onSaveMetadata(selectedEdgeFromId, { next_dialogue_blackout: checked })}
          />
          <NumberField
            label="Fade duration"
            value={getChapterGraphBlackoutFade(selectedEdgeData)}
            min={0}
            step={0.05}
            resetValue={0.35}
            onChange={(value) => onSaveMetadata(selectedEdgeFromId, { next_dialogue_blackout_fade_duration: value })}
          />
          <NumberField
            label="Hold duration"
            value={getChapterGraphBlackoutHold(selectedEdgeData)}
            min={0}
            step={0.05}
            resetValue={0.3}
            onChange={(value) => onSaveMetadata(selectedEdgeFromId, { next_dialogue_blackout_hold_duration: value })}
          />
          <button className="danger-action" disabled={disabled || busy} type="button" onClick={() => onSaveMetadata(selectedEdgeFromId, { next_dialogue: "" })}>
            <Icon name="Delete" />연결 해제
          </button>
        </div>
      ) : selectedNodeId ? (
        <div className="chapter-graph-node-panel">
          <div className="chapter-graph-node-panel-header">
            <strong>{titleForDialogue(selectedNodeId)}</strong>
            <code>{selectedNodeId}</code>
          </div>
          <SelectField
            label="다음 대화"
            options={nextDialogueSelectOptions}
            value={selectedNodeNext}
            onChange={(value) => onSaveMetadata(selectedNodeId, { next_dialogue: value, next_dialogue_blackout: false })}
          />
          <ToggleField
            label="암전 후 다음 대화"
            checked={Boolean(selectedNodeNext && getChapterGraphBlackout(selectedNodeData))}
            onChange={(checked) => onSaveMetadata(selectedNodeId, { next_dialogue_blackout: checked })}
          />
          <NumberField
            label="Fade duration"
            value={getChapterGraphBlackoutFade(selectedNodeData)}
            min={0}
            step={0.05}
            resetValue={0.35}
            onChange={(value) => onSaveMetadata(selectedNodeId, { next_dialogue_blackout_fade_duration: value })}
          />
          <NumberField
            label="Hold duration"
            value={getChapterGraphBlackoutHold(selectedNodeData)}
            min={0}
            step={0.05}
            resetValue={0.3}
            onChange={(value) => onSaveMetadata(selectedNodeId, { next_dialogue_blackout_hold_duration: value })}
          />
          <div className="chapter-graph-node-panel-actions">
            <button disabled={disabled || startDialogueId === selectedNodeId} type="button" onClick={() => onSetStartDialogue(selectedNodeId)}>
              <Icon name="PlayArrow" />시작 대화로 지정
            </button>
            <button type="button" onClick={() => onOpenDialogue(selectedNodeId)}>
              <Icon name="OpenInNew" />대사 에디터에서 열기
            </button>
            <button className="danger-action" disabled={disabled || !selectedNodeNext} type="button" onClick={() => onSaveMetadata(selectedNodeId, { next_dialogue: "" })}>
              <Icon name="LinkOff" />연결 해제
            </button>
            <button className="danger-action" disabled={disabled} type="button" onClick={() => onRemovePlacedDialogue(selectedNodeId)}>
              <Icon name="Delete" />캔버스에서 제거
            </button>
          </div>
          <div className="chapter-graph-node-preview">
            <span className="field-label">첫 대사</span>
            <pre>{getDialoguePreview(selectedNodeData) || "미리보기 없음"}</pre>
          </div>
          <div className="incoming-list">
            <span className="field-label">들어오는 연결 {incomingIds.length}</span>
            {incomingIds.length === 0 ? (
              <span className="hint">없음</span>
            ) : incomingIds.map((id) => (
              <button key={id} type="button" onClick={() => onSelectIncomingEdge(id)}>
                {titleForDialogue(id)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="empty-state">캔버스의 대화 또는 연결선을 선택하세요.</p>
      )}
    </aside>
  );
}

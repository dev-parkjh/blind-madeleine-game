import { Icon } from "../../components/EditorControls";
import { clampNumber, roundForInput } from "../../lib/numeric";
import type { ResourceSummary } from "../../types";

export function ChapterGraphToolbar({
  busy,
  disabled,
  dialogueToPlaceId,
  edgeSourceId,
  graphZoom,
  loading,
  onAddDialogue,
  onAutoLayout,
  onCancelConnection,
  onClearConnection,
  onFitGraph,
  onSelectDialogueToPlace,
  onZoomChange,
  placedCount,
  selectedEdgeFromId,
  selectedNodeId,
  status,
  unplacedDialogues
}: {
  busy: boolean;
  disabled: boolean;
  dialogueToPlaceId: string;
  edgeSourceId: string;
  graphZoom: number;
  loading: boolean;
  onAddDialogue: (dialogueId: string) => void;
  onAutoLayout: () => void;
  onCancelConnection: () => void;
  onClearConnection: () => void;
  onFitGraph: () => void;
  onSelectDialogueToPlace: (dialogueId: string) => void;
  onZoomChange: (zoom: number) => void;
  placedCount: number;
  selectedEdgeFromId: string;
  selectedNodeId: string;
  status: string;
  unplacedDialogues: ResourceSummary[];
}) {
  return (
    <>
      <div className="structured-header">
        <span>Chapter Graph</span>
        <div className="chapter-art-actions">
          <button disabled={disabled || placedCount === 0} type="button" onClick={onAutoLayout}><Icon name="AutoGraph" />자동 배치</button>
          <button disabled={disabled || placedCount === 0} type="button" onClick={onFitGraph}><Icon name="ZoomInMap" />전체 보기</button>
          <button disabled={disabled || (!selectedEdgeFromId && !selectedNodeId)} type="button" onClick={onClearConnection}><Icon name="LinkOff" />연결 해제</button>
          <button disabled={disabled || !edgeSourceId} type="button" onClick={onCancelConnection}><Icon name="Close" />연결 취소</button>
        </div>
      </div>
      <div className="chapter-graph-meta">
        <code>{placedCount} dialogues</code>
        {loading && <span>대화 메타데이터 불러오는 중</span>}
        {busy && <span>연결 저장 중</span>}
        {status && <span>{status}</span>}
        {edgeSourceId && <strong>{edgeSourceId} 연결 대상 선택</strong>}
      </div>
      <div className="chapter-graph-add-row">
        <select
          disabled={disabled || unplacedDialogues.length === 0}
          onChange={(event) => onSelectDialogueToPlace(event.target.value)}
          value={dialogueToPlaceId}
        >
          <option value="">미배치 대화 선택</option>
          {unplacedDialogues.map((dialogue) => (
            <option key={dialogue.id} value={dialogue.id}>{dialogue.title} ({dialogue.id})</option>
          ))}
        </select>
        <button disabled={disabled || unplacedDialogues.length === 0} type="button" onClick={() => onAddDialogue(dialogueToPlaceId)}>
          <Icon name="Add" />캔버스에 추가
        </button>
      </div>
      <div className="chapter-graph-zoom-row">
        <button type="button" onClick={() => onZoomChange(roundForInput(clampNumber(graphZoom - 0.1, 0.5, 1.8, 1)))}><Icon name="ZoomOut" />축소</button>
        <input
          aria-label="Graph zoom"
          max={1.8}
          min={0.5}
          onChange={(event) => onZoomChange(Number(event.target.value))}
          step={0.05}
          type="range"
          value={graphZoom}
        />
        <button type="button" onClick={() => onZoomChange(roundForInput(clampNumber(graphZoom + 0.1, 0.5, 1.8, 1)))}><Icon name="ZoomIn" />확대</button>
        <code>{Math.round(graphZoom * 100)}%</code>
      </div>
    </>
  );
}

import type { PointerEvent as ReactPointerEvent } from "react";
import { useRef } from "react";
import { CoordinateNudgeToolbar } from "../../components/CoordinateNudgeToolbar";
import { DragLockHint, DragLockToggle, useMobileDragLock } from "../../components/DragLock";
import type { PointerPoint } from "../../editorTypes";
import { formatNumberInput, round4Number } from "../../lib/numeric";
import type { ResourceRecord } from "../../types";
import { popupPositionPresets } from "./dialoguePopupModel";
import {
  buildPopupPreviewEntry,
  gameReferenceHeight,
  gameReferenceWidth,
  getPopupPreviewCenter,
  getPopupPreviewFrameStyle,
  type PopupPreviewEntry
} from "./nodePopupPreviewModel";
import { PopupPreviewCanvas } from "./PopupPreviewCanvas";

type PopupLayoutDrag = {
  pointerId: number;
  index: number;
  target: HTMLElement;
  startX: number;
  startY: number;
  centerX: number;
  centerY: number;
};

export function NodePopupLayoutPreview({
  characterDetails,
  itemDetails,
  node,
  onMove,
  onSelect,
  popups,
  selectedIndex
}: {
  characterDetails: Record<string, ResourceRecord>;
  itemDetails: Record<string, ResourceRecord>;
  node: ResourceRecord;
  onMove: (index: number, offset: PointerPoint, position?: string) => void;
  onSelect: (index: number) => void;
  popups: ResourceRecord[];
  selectedIndex: number;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<PopupLayoutDrag | null>(null);
  const dragLock = useMobileDragLock();
  const entries = popups.map((popup, index) => buildPopupPreviewEntry(popup, index, node, characterDetails, itemDetails));
  const selectedEntry = entries[selectedIndex];

  function stagePoint(event: ReactPointerEvent<HTMLElement>) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: (event.clientX - rect.left) / rect.width * gameReferenceWidth,
      y: (event.clientY - rect.top) / rect.height * gameReferenceHeight
    };
  }

  function startDrag(event: ReactPointerEvent<HTMLElement>, entry: PopupPreviewEntry) {
    onSelect(entry.index);
    if (event.button !== 0) return;
    if (dragLock.locked) return;
    const point = stagePoint(event);
    if (!point) return;
    const center = getPopupPreviewCenter(entry);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      index: entry.index,
      target: event.currentTarget,
      startX: point.x,
      startY: point.y,
      centerX: center.x * gameReferenceWidth,
      centerY: center.y * gameReferenceHeight
    };
    event.preventDefault();
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    if (dragLock.locked) return;
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const point = stagePoint(event);
    if (!point) return;
    const nextCenter = {
      x: (drag.centerX + point.x - drag.startX) / gameReferenceWidth,
      y: (drag.centerY + point.y - drag.startY) / gameReferenceHeight
    };
    onMove(drag.index, {
      x: round4Number(nextCenter.x - popupPositionPresets.custom.x),
      y: round4Number(nextCenter.y - popupPositionPresets.custom.y)
    }, "custom");
    event.preventDefault();
  }

  function stopDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    try {
      drag.target.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may be released by the browser first.
    }
  }

  return (
    <div className="node-popup-layout-preview">
      <div className="coordinate-editor-header">
        <span>Popup layout</span>
        <div className="coordinate-editor-meta">
          <DragLockToggle
            available={dragLock.available}
            locked={dragLock.locked}
            onToggle={dragLock.toggle}
          />
        </div>
      </div>
      <div
        className={`node-popup-preview-stage ${dragLock.locked ? "drag-locked" : ""}`}
        onPointerCancel={stopDrag}
        onPointerMove={moveDrag}
        onPointerUp={stopDrag}
        ref={stageRef}
      >
        <DragLockHint available={dragLock.available} locked={dragLock.locked} onToggle={dragLock.toggle} />
        <div className="node-popup-preview-playfield" />
        <div className="node-popup-preview-dialogue-panel">
          <strong>{String(node.speaker || "narrator")}</strong>
          <span>{String(node.text || "")}</span>
        </div>
        {entries.map((entry) => (
          <div
            className={`node-popup-frame ${selectedIndex === entry.index ? "selected" : ""}`}
            key={entry.index}
            onPointerDown={(event) => startDrag(event, entry)}
            style={getPopupPreviewFrameStyle(entry)}
          >
            <PopupPreviewCanvas entry={entry} />
            <span>{entry.label}</span>
          </div>
        ))}
      </div>
      <div className="node-popup-preview-meta">
        <code>{selectedEntry ? `Popup ${selectedEntry.index + 1} · ${selectedEntry.position} · offset ${formatNumberInput(selectedEntry.offset.x)},${formatNumberInput(selectedEntry.offset.y)}` : "popup 없음"}</code>
        {selectedEntry && (
          <CoordinateNudgeToolbar
            label="Popup offset"
            min={-1}
            max={1}
            onChange={(x, y) => onMove(selectedEntry.index, { x: round4Number(x), y: round4Number(y) })}
            resetX={0}
            resetY={0}
            x={selectedEntry.offset.x}
            y={selectedEntry.offset.y}
          />
        )}
      </div>
    </div>
  );
}

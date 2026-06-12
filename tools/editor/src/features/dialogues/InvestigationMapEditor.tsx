import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { NumberField, TextField } from "../../components/EditorControls";
import type { PointerPoint } from "../../editorTypes";
import { normalizeSingleId } from "../../lib/ids";
import { clamp01Number, clampNumber, roundForInput } from "../../lib/numeric";
import { normalizeJsonObject } from "../../lib/records";
import { resPathToAssetUrl } from "../../lib/resourcePaths";
import type { ResourceRecord } from "../../types";

function resolveDialogueNodeId(node: ResourceRecord, index: number, autoPrefix = "@") {
  const raw = String(node.id || "").trim();
  return raw || `${autoPrefix}${index}`;
}

type DialogueMapLocationEntry = {
  id: string;
  label: string;
  node: string;
  position: PointerPoint;
  missingNode: boolean;
};

export function InvestigationMapEditor({
  locations,
  map,
  nodes,
  onLocationsChange,
  onMapChange
}: {
  locations: unknown;
  map: unknown;
  nodes: ResourceRecord[];
  onLocationsChange: (value: ResourceRecord[]) => void;
  onMapChange: (value: ResourceRecord) => void;
}) {
  const entries = useMemo(() => buildDialogueMapLocationEntries(locations, nodes), [locations, nodes]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (entries.length === 0) {
      if (selectedId) setSelectedId("");
      return;
    }
    if (!entries.some((entry) => entry.id === selectedId)) {
      setSelectedId(entries[0].id);
    }
  }, [entries, selectedId]);

  const selected = entries.find((entry) => entry.id === selectedId) || entries[0];
  const imagePath = getInvestigationMapImagePath(map);
  const imageUrl = resPathToAssetUrl(imagePath);

  function updateSelectedPosition(x: number, y: number) {
    if (!selected) return;
    onLocationsChange(withDialogueLocationPinPosition(locations, selected.id, x, y));
  }

  function handleStageClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (!selected) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    updateSelectedPosition(
      roundForInput(clampNumber((event.clientX - rect.left) / rect.width, 0, 0, 1)),
      roundForInput(clampNumber((event.clientY - rect.top) / rect.height, 0, 0, 1))
    );
  }

  return (
    <section className="investigation-map-editor wide">
      <div className="section-heading">
        <h3>MAP</h3>
        <span>{entries.length} pins</span>
      </div>
      <TextField label="map.image" value={imagePath} onChange={(value) => onMapChange(withInvestigationMapImage(map, value))} />
      <div
        className={`investigation-map-stage ${imageUrl ? "has-image" : ""}`}
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
        onClick={handleStageClick}
      >
        <svg aria-hidden="true" className="investigation-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          {entries.flatMap((source, sourceIndex) => entries.slice(sourceIndex + 1).map((target) => (
            <line
              key={`${source.id}-${target.id}`}
              x1={source.position.x * 100}
              x2={target.position.x * 100}
              y1={source.position.y * 100}
              y2={target.position.y * 100}
            />
          )))}
        </svg>
        {entries.length === 0 && <span className="investigation-map-empty">locations를 먼저 추가하세요.</span>}
        {entries.map((entry) => (
          <button
            key={entry.id}
            className={`investigation-map-pin ${entry.id === selected?.id ? "selected" : ""}`}
            style={getInvestigationMapPinStyle(entry.position)}
            title={`${entry.label}${entry.missingNode ? " · missing node" : ""}`}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedId(entry.id);
            }}
          />
        ))}
        {entries.map((entry) => (
          <span key={`${entry.id}-label`} className="investigation-map-pin-label" style={getInvestigationMapPinLabelStyle(entry.position)}>
            {entry.label}
          </span>
        ))}
      </div>
      {selected && (
        <div className="investigation-map-pin-controls">
          <div className="investigation-map-selected">
            <strong>{selected.label}</strong>
            <code>{selected.node || "node 미지정"}</code>
          </div>
          <NumberField label="Pin X" min={0} max={1} step={0.01} value={selected.position.x} onChange={(value) => updateSelectedPosition(value, selected.position.y)} />
          <NumberField label="Pin Y" min={0} max={1} step={0.01} value={selected.position.y} onChange={(value) => updateSelectedPosition(selected.position.x, value)} />
        </div>
      )}
    </section>
  );
}

function buildDialogueMapLocationEntries(value: unknown, nodes: ResourceRecord[]): DialogueMapLocationEntry[] {
  const records = normalizeDialogueLocationEditorRecords(value);
  const nodeIds = new Set(nodes.map((node, index) => resolveDialogueNodeId(node, index, "@")));
  return records.map((record, index) => {
    const id = getDialogueLocationId(record, `location_${index + 1}`);
    const node = getDialogueLocationNodeId(record);
    return {
      id,
      label: getDialogueLocationLabel(record, id),
      node,
      position: getDialogueLocationPinPosition(record, index, records.length),
      missingNode: Boolean(node) && !nodeIds.has(node)
    };
  });
}

function normalizeDialogueLocationEditorRecords(value: unknown): ResourceRecord[] {
  const records: ResourceRecord[] = [];
  const appendRecord = (idValue: unknown, locationValue: unknown) => {
    const id = normalizeSingleId(idValue);
    if (!id) return;
    if (typeof locationValue === "string") {
      records.push({ id, node: locationValue.trim() });
      return;
    }
    const record = normalizeJsonObject(locationValue);
    records.push({ ...record, id: getDialogueLocationId(record, id) });
  };

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return;
      const record = normalizeJsonObject(entry);
      appendRecord(record.id ?? record.location_id ?? record.place_id ?? record.key ?? `location_${index + 1}`, record);
    });
  } else if (value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([id, entry]) => appendRecord(id, entry));
  }
  return records;
}

function getDialogueLocationId(location: ResourceRecord, fallback = "") {
  return normalizeSingleId(location.id ?? location.location_id ?? location.place_id ?? location.key) || fallback;
}

function getDialogueLocationLabel(location: ResourceRecord, fallback: string) {
  return normalizeSingleId(location.label ?? location.name ?? location.title) || fallback;
}

function getDialogueLocationNodeId(location: ResourceRecord) {
  return normalizeSingleId(location.node ?? location.node_id ?? location.start_node ?? location.start ?? location.target ?? location.next);
}

function getDialogueLocationPinPosition(location: ResourceRecord, index: number, count: number): PointerPoint {
  for (const key of ["position", "pin", "map_position", "point", "coords"]) {
    const point = readNormalizedMapPoint(location[key]);
    if (point) return point;
  }
  const fieldPoint = readNormalizedMapPoint(location);
  if (fieldPoint) return fieldPoint;
  const safeCount = Math.max(1, count);
  const angle = -Math.PI * 0.5 + Math.PI * 2 * index / safeCount;
  return {
    x: roundForInput(clampNumber(0.5 + Math.cos(angle) * 0.32, 0.5, 0.12, 0.88)),
    y: roundForInput(clampNumber(0.5 + Math.sin(angle) * 0.26, 0.5, 0.16, 0.84))
  };
}

function readNormalizedMapPoint(value: unknown): PointerPoint | null {
  if (Array.isArray(value) && value.length >= 2) {
    return {
      x: roundForInput(clamp01Number(value[0], 0.5)),
      y: roundForInput(clamp01Number(value[1], 0.5))
    };
  }
  if (value && typeof value === "object") {
    const record = value as ResourceRecord;
    const hasX = Object.prototype.hasOwnProperty.call(record, "x") || Object.prototype.hasOwnProperty.call(record, "left");
    const hasY = Object.prototype.hasOwnProperty.call(record, "y") || Object.prototype.hasOwnProperty.call(record, "top");
    if (hasX && hasY) {
      return {
        x: roundForInput(clamp01Number(record.x ?? record.left, 0.5)),
        y: roundForInput(clamp01Number(record.y ?? record.top, 0.5))
      };
    }
  }
  return null;
}

function withDialogueLocationPinPosition(value: unknown, id: string, x: number, y: number): ResourceRecord[] {
  const cleanId = normalizeSingleId(id);
  const records = normalizeDialogueLocationEditorRecords(value);
  const next = records.map((record) => {
    if (getDialogueLocationId(record) !== cleanId) return record;
    return {
      ...record,
      position: [roundForInput(clamp01Number(x, 0.5)), roundForInput(clamp01Number(y, 0.5))]
    };
  });
  if (cleanId && !next.some((record) => getDialogueLocationId(record) === cleanId)) {
    next.push({ id: cleanId, position: [roundForInput(clamp01Number(x, 0.5)), roundForInput(clamp01Number(y, 0.5))] });
  }
  return next;
}

function getInvestigationMapImagePath(value: unknown) {
  if (typeof value === "string") return value.trim();
  const record = normalizeJsonObject(value);
  return normalizeSingleId(record.image ?? record.path ?? record.background ?? record.map_image);
}

function withInvestigationMapImage(value: unknown, imagePath: string): ResourceRecord {
  const next = normalizeJsonObject(value);
  const cleanPath = imagePath.trim();
  if (cleanPath) next.image = cleanPath;
  else delete next.image;
  return next;
}

function getInvestigationMapPinStyle(position: PointerPoint): CSSProperties {
  return {
    left: `${clamp01Number(position.x, 0.5) * 100}%`,
    top: `${clamp01Number(position.y, 0.5) * 100}%`
  };
}

function getInvestigationMapPinLabelStyle(position: PointerPoint): CSSProperties {
  return {
    left: `${clamp01Number(position.x, 0.5) * 100}%`,
    top: `${clamp01Number(position.y, 0.5) * 100}%`
  };
}

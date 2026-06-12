import { normalizeSingleId } from "../../lib/ids";
import { normalizeJsonObject } from "../../lib/records";
import type { ResourceRecord, ResourceSummary } from "../../types";

function resolveDialogueNodeId(node: ResourceRecord, index: number, autoPrefix = "@") {
  const raw = String(node.id || "").trim();
  return raw || `${autoPrefix}${index}`;
}

export function buildDialogueLocationOptions(value: unknown, nodes: ResourceRecord[]): ResourceSummary[] {
  const entries: Array<{ id: string; label: string; node: string }> = [];
  const appendLocation = (idValue: unknown, locationValue: unknown) => {
    const id = normalizeSingleId(idValue);
    if (!id) return;
    if (typeof locationValue === "string") {
      entries.push({ id, label: id, node: locationValue.trim() });
      return;
    }
    const location = normalizeJsonObject(locationValue);
    const label = normalizeSingleId(location.label ?? location.name ?? location.title) || id;
    const node = normalizeSingleId(location.node ?? location.node_id ?? location.start_node ?? location.start ?? location.target ?? location.next);
    entries.push({ id, label, node });
  };

  if (Array.isArray(value)) {
    value.forEach((location) => {
      const record = normalizeJsonObject(location);
      appendLocation(record.id ?? record.location_id ?? record.place_id ?? record.key, record);
    });
  } else if (value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([id, location]) => appendLocation(id, location));
  }

  const nodeIds = new Set(nodes.map((node, index) => resolveDialogueNodeId(node, index, "@")));
  return entries.map((entry) => ({
    id: entry.id,
    type: "dialogues",
    title: entry.label,
    subtitle: entry.node
      ? nodeIds.has(entry.node)
        ? `node: ${entry.node}`
        : `missing node: ${entry.node}`
      : "node 미지정"
  }));
}

export function getChoiceMoveToLocationId(choice: ResourceRecord) {
  return normalizeSingleId(
    choice.move_to
      ?? choice.move_location
      ?? choice.travel_to
      ?? choice.to_location
      ?? choice.destination_location
      ?? choice.place_id
      ?? choice.location_id
  );
}

export function withChoiceMoveToLocation(choice: ResourceRecord, value: string): ResourceRecord {
  const next = { ...choice };
  const cleanValue = value.trim();
  delete next.move_location;
  delete next.travel_to;
  delete next.to_location;
  delete next.destination_location;
  delete next.place_id;
  delete next.location_id;
  if (cleanValue) next.move_to = cleanValue;
  else delete next.move_to;
  return next;
}

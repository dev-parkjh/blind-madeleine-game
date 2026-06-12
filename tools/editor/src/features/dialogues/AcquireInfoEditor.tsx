import type { ReferenceResources } from "../../editorTypes";
import { CheckboxList } from "../../components/EditorControls";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord } from "../../types";

export function getNodeAcquireInfoEditorValue(node: ResourceRecord) {
  const metadata = node.metadata && typeof node.metadata === "object" && !Array.isArray(node.metadata) ? node.metadata as ResourceRecord : {};
  return readAcquireInfoEditorValue(
    node.acquire_info
      ?? node.acquired_info
      ?? node.acquire_on_complete
      ?? node.rewards
      ?? metadata.acquire_info
      ?? metadata.acquired_info
      ?? metadata.acquire_on_complete
      ?? metadata.rewards
  );
}

export function withNodeAcquireInfo(node: ResourceRecord, value: ResourceRecord) {
  const info = readAcquireInfoEditorValue(value);
  const next: ResourceRecord = { ...node };
  delete next.acquired_info;
  delete next.acquire_on_complete;
  delete next.rewards;
  if (next.metadata && typeof next.metadata === "object" && !Array.isArray(next.metadata)) {
    const metadata = { ...next.metadata };
    delete metadata.acquire_info;
    delete metadata.acquired_info;
    delete metadata.acquire_on_complete;
    delete metadata.rewards;
    if (Object.keys(metadata).length > 0) next.metadata = metadata;
    else delete next.metadata;
  }
  if (info.characters.length === 0 && info.items.length === 0) {
    delete next.acquire_info;
    return next;
  }
  next.acquire_info = info;
  return next;
}

export function readAcquireInfoEditorValue(value: unknown): { characters: string[]; items: string[] } {
  const characters: string[] = [];
  const items: string[] = [];

  function append(target: string[], raw: unknown) {
    if (Array.isArray(raw)) {
      raw.forEach((entry) => {
        if (entry && typeof entry === "object" && !Array.isArray(entry)) {
          const record = entry as ResourceRecord;
          append(target, record.target_id ?? record.id ?? record.target);
          return;
        }
        append(target, entry);
      });
      return;
    }
    const id = String(raw || "").trim();
    if (id && !target.includes(id)) target.push(id);
  }

  function appendEntry(rawEntry: unknown) {
    if (!rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) return;
    const entry = rawEntry as ResourceRecord;
    const kind = normalizeAcquireKindForEditor(entry.kind ?? entry.type);
    const target = entry.target_id ?? entry.id ?? entry.target;
    if (kind === "character") append(characters, target);
    if (kind === "item") append(items, target);
  }

  if (Array.isArray(value)) {
    value.forEach(appendEntry);
    return { characters, items };
  }
  if (!value || typeof value !== "object") return { characters, items };
  const record = value as ResourceRecord;
  append(characters, record.characters ?? record.character_ids);
  append(items, record.items ?? record.item_ids);
  asArray(record.entries).forEach(appendEntry);
  return { characters, items };
}

function normalizeAcquireKindForEditor(value: unknown) {
  const kind = String(value || "").trim().toLowerCase();
  if (["characters", "character_info", "person"].includes(kind)) return "character";
  if (["items", "item_info"].includes(kind)) return "item";
  return kind;
}

export function AcquireInfoEditor({
  value,
  references,
  onChange
}: {
  value: unknown;
  references: ReferenceResources;
  onChange: (value: ResourceRecord) => void;
}) {
  const info = value && typeof value === "object" ? value as ResourceRecord : {};
  const characters = asArray(info.characters).map(String);
  const items = asArray(info.items).map(String);
  const hasValues = characters.length > 0 || items.length > 0;

  function toggle(field: "characters" | "items", id: string) {
    const values = field === "characters" ? characters : items;
    const nextValues = values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
    onChange({ ...info, characters, items, [field]: nextValues });
  }

  return (
    <details className="node-addon-editor" open={hasValues}>
      <summary>
        <strong>Acquire info</strong>
        <span>{characters.length} characters · {items.length} items</span>
      </summary>
      <div className="form-grid">
        <CheckboxList label="Characters" values={characters} options={references.characters} onToggle={(id) => toggle("characters", id)} />
        <CheckboxList label="Items" values={items} options={references.items} onToggle={(id) => toggle("items", id)} />
      </div>
    </details>
  );
}

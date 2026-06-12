import { normalizeIdList, normalizeSingleId } from "../../lib/ids";
import { normalizeJsonObject } from "../../lib/records";
import type { ResourceRecord, ResourceSummary } from "../../types";

export function normalizeDialoguePresentationMode(value: unknown) {
  const mode = String(value || "").trim().toLowerCase();
  if (mode === "statement" || mode === "진술") return "statement";
  if (["investigation", "investigate", "search", "조사", "조사모드"].includes(mode)) return "investigation";
  if (["talk", "conversation", "dialogue_topics", "대화", "자율대화"].includes(mode)) return "talk";
  return "normal";
}

export function withDialogueMetadataEntry(dialogue: ResourceRecord, key: string, value: unknown) {
  const metadata = { ...normalizeJsonObject(dialogue.metadata) };
  const cleanValue = normalizeSingleId(value);
  if (cleanValue) metadata[key] = cleanValue;
  else delete metadata[key];
  return withDialogueMetadata(dialogue, metadata);
}

export function withDialoguePresentationMode(dialogue: ResourceRecord, value: unknown) {
  const metadata = { ...normalizeJsonObject(dialogue.metadata) };
  const mode = normalizeDialoguePresentationMode(value);
  if (mode === "statement") metadata.presentation_mode = "statement";
  else if (mode === "investigation") metadata.presentation_mode = "investigation";
  else if (mode === "talk") metadata.presentation_mode = "talk";
  else delete metadata.presentation_mode;
  return withDialogueMetadata(dialogue, metadata);
}

export function withDialogueMetadata(dialogue: ResourceRecord, metadata: ResourceRecord) {
  const next = { ...dialogue };
  if (Object.keys(metadata).length > 0) next.metadata = metadata;
  else delete next.metadata;
  return next;
}

export function isStatementNotebookScopeConfigured(metadata: ResourceRecord) {
  return metadata.statement_notebook && typeof metadata.statement_notebook === "object" && !Array.isArray(metadata.statement_notebook);
}

export function getStatementNotebookScope(metadata: ResourceRecord) {
  const scope = isStatementNotebookScopeConfigured(metadata) ? metadata.statement_notebook as ResourceRecord : {};
  return {
    characters: normalizeIdList(scope.characters ?? scope.character_ids),
    items: normalizeIdList(scope.items ?? scope.item_ids)
  };
}

export function defaultStatementNotebookScope(characters: ResourceSummary[], items: ResourceSummary[]) {
  return {
    characters: characters.map((entry) => entry.id).filter(Boolean),
    items: items.map((entry) => entry.id).filter(Boolean)
  };
}

export function toggleNotebookScopeId(
  scope: { characters: string[]; items: string[] },
  field: "characters" | "items",
  id: string
) {
  const current = new Set(scope[field]);
  if (current.has(id)) current.delete(id);
  else current.add(id);
  return {
    ...scope,
    [field]: [...current]
  };
}

export function withStatementNotebookScope(dialogue: ResourceRecord, scope: { characters: string[]; items: string[] }) {
  const metadata = { ...normalizeJsonObject(dialogue.metadata) };
  metadata.statement_notebook = {
    characters: normalizeIdList(scope.characters),
    items: normalizeIdList(scope.items)
  };
  return withDialogueMetadata(dialogue, metadata);
}

export function withoutStatementNotebookScope(dialogue: ResourceRecord) {
  const metadata = { ...normalizeJsonObject(dialogue.metadata) };
  delete metadata.statement_notebook;
  return withDialogueMetadata(dialogue, metadata);
}

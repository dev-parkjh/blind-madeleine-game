import { normalizeSingleId } from "../../lib/ids";
import type { ResourceRecord } from "../../types";

export type ChoicePresentKind = "item" | "character";
export type ChoicePresentTarget = { kind: ChoicePresentKind | ""; id: string };

export function getChoicePresentTarget(choice: ResourceRecord): ChoicePresentTarget {
  const direct = choice.present ?? choice.presentation ?? choice.present_target;
  if (direct && typeof direct === "object" && !Array.isArray(direct)) {
    const record = direct as ResourceRecord;
    const kind = normalizeChoicePresentKind(record.kind ?? record.type ?? record.target_type);
    const id = normalizeSingleId(record.target_id ?? record.id ?? record.target);
    if (kind && id) return { kind, id };
  } else if (typeof direct === "string") {
    const id = normalizeSingleId(direct);
    if (id) return { kind: "item", id };
  }

  const itemId = normalizeSingleId(
    choice.present_item
      ?? choice.present_item_id
      ?? choice.present_evidence
      ?? choice.present_evidence_id
      ?? choice.evidence_id
      ?? choice.clue_id
  );
  if (itemId) return { kind: "item", id: itemId };

  const characterId = normalizeSingleId(
    choice.present_character
      ?? choice.present_character_id
      ?? choice.present_profile
      ?? choice.present_profile_id
  );
  if (characterId) return { kind: "character", id: characterId };

  const kind = normalizeChoicePresentKind(choice.present_kind ?? choice.presentation_kind);
  const id = normalizeSingleId(choice.present_id ?? choice.presentation_id);
  return kind && id ? { kind, id } : { kind: "", id: "" };
}

export function normalizeChoicePresentKind(value: unknown): ChoicePresentKind | "" {
  const kind = normalizeSingleId(value).toLowerCase();
  if (["item", "evidence", "clue", "자료"].includes(kind)) return "item";
  if (["character", "person", "profile", "인물"].includes(kind)) return "character";
  return "";
}

export function withChoicePresentTarget(choice: ResourceRecord, kind: ChoicePresentKind | "", value: string): ResourceRecord {
  const next = stripChoicePresentTargetFields(choice);
  const id = normalizeSingleId(value);
  if (!kind || !id) return next;
  if (kind === "item") next.present_item = id;
  else next.present_character = id;
  return next;
}

export function stripChoicePresentTargetFields(choice: ResourceRecord): ResourceRecord {
  const next = { ...choice };
  delete next.present;
  delete next.presentation;
  delete next.present_target;
  delete next.present_item;
  delete next.present_item_id;
  delete next.present_evidence;
  delete next.present_evidence_id;
  delete next.evidence_id;
  delete next.clue_id;
  delete next.present_character;
  delete next.present_character_id;
  delete next.present_profile;
  delete next.present_profile_id;
  delete next.present_kind;
  delete next.presentation_kind;
  delete next.present_id;
  delete next.presentation_id;
  return next;
}

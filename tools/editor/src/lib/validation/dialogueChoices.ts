import type { ResourceRecord } from "../../types";
import { isPlainRecord, normalizeSingleId } from "./shared";

export function readChoiceMoveToLocationId(choice: ResourceRecord) {
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

export type ChoicePresentKind = "item" | "character";
export type ChoicePresentTarget = { kind: ChoicePresentKind | ""; id: string };

export function readChoicePresentTarget(choice: ResourceRecord): ChoicePresentTarget {
  const direct = choice.present ?? choice.presentation ?? choice.present_target;
  if (isPlainRecord(direct)) {
    const kind = normalizeChoicePresentKind(direct.kind ?? direct.type ?? direct.target_type);
    const id = normalizeSingleId(direct.target_id ?? direct.id ?? direct.target);
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

function normalizeChoicePresentKind(value: unknown): ChoicePresentKind | "" {
  const kind = normalizeSingleId(value).toLowerCase();
  if (["item", "evidence", "clue", "자료"].includes(kind)) return "item";
  if (["character", "person", "profile", "인물"].includes(kind)) return "character";
  return "";
}

export function choiceIsPresentDefault(choice: ResourceRecord) {
  return choice.present_default === true || choice.default_present === true || choice.wrong_present === true;
}

import { isEmptyPlainRecord } from "../../lib/records";
import type { ResourceRecord } from "../../types";
import { getChoicePresentTarget, stripChoicePresentTargetFields } from "./dialogueChoicePresentModel";

export function normalizeDialogueChoiceForSave(choice: unknown): unknown {
  if (!choice || typeof choice !== "object" || Array.isArray(choice)) return choice;
  let next: ResourceRecord = { ...(choice as ResourceRecord) };
  if (next.topic_id !== undefined) {
    const topicId = String(next.topic_id || "").trim();
    if (topicId) next.topic_id = topicId;
    else delete next.topic_id;
  }
  if (next.choice_id !== undefined && !String(next.choice_id || "").trim()) delete next.choice_id;
  if (next.id !== undefined && !String(next.id || "").trim()) delete next.id;
  if (next.move_to !== undefined) {
    const moveTo = String(next.move_to || "").trim();
    if (moveTo) next.move_to = moveTo;
    else delete next.move_to;
  }
  const presentTarget = getChoicePresentTarget(next);
  next = stripChoicePresentTargetFields(next);
  if (presentTarget.kind === "item" && presentTarget.id) next.present_item = presentTarget.id;
  if (presentTarget.kind === "character" && presentTarget.id) next.present_character = presentTarget.id;
  if (next.default_present === true || next.wrong_present === true) next.present_default = true;
  delete next.default_present;
  delete next.wrong_present;
  if (next.present_default === false) delete next.present_default;
  if (next.track_heard === true) delete next.track_heard;
  if (next.show_heard_check === true) delete next.show_heard_check;
  if (next.exit_talk === false) delete next.exit_talk;
  if (isEmptyPlainRecord(next.set_flags)) delete next.set_flags;
  if (Array.isArray(next.conditions) && next.conditions.length === 0) delete next.conditions;
  return next;
}

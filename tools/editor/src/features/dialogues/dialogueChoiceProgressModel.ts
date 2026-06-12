import { asArray } from "../../lib/resourceConfig";
import { normalizeJsonObject } from "../../lib/records";
import type { ResourceRecord } from "../../types";

export function getChoiceTopicIdEditorValue(choice: ResourceRecord) {
  return String(choice.topic_id ?? choice.choice_id ?? choice.id ?? "").trim();
}

export function withChoiceTopicId(choice: ResourceRecord, value: string): ResourceRecord {
  const next = { ...choice };
  const cleanValue = value.trim();
  if (cleanValue) next.topic_id = cleanValue;
  else delete next.topic_id;
  return next;
}

export function getChoiceTrackHeard(choice: ResourceRecord) {
  return choice.track_heard !== false && choice.track_topic !== false;
}

export function withChoiceTrackHeard(choice: ResourceRecord, checked: boolean): ResourceRecord {
  const next = { ...choice };
  delete next.track_topic;
  if (checked) delete next.track_heard;
  else next.track_heard = false;
  return next;
}

export function getChoiceShowHeardCheck(choice: ResourceRecord) {
  return choice.show_heard_check !== false && choice.show_check !== false;
}

export function withChoiceShowHeardCheck(choice: ResourceRecord, checked: boolean): ResourceRecord {
  const next = { ...choice };
  delete next.show_check;
  if (checked) delete next.show_heard_check;
  else next.show_heard_check = false;
  return next;
}

export function getChoiceExitTalk(choice: ResourceRecord) {
  return Boolean(choice.exit_talk ?? choice.talk_end ?? choice.end_talk);
}

export function withChoiceExitTalk(choice: ResourceRecord, checked: boolean): ResourceRecord {
  const next = { ...choice };
  delete next.talk_end;
  delete next.end_talk;
  if (checked) next.exit_talk = true;
  else delete next.exit_talk;
  return next;
}

export function withChoiceCondition(choice: ResourceRecord, condition: ResourceRecord): ResourceRecord {
  return {
    ...choice,
    conditions: [...asArray(choice.conditions), condition]
  };
}

export function withChoiceSetFlag(choice: ResourceRecord, key: string, value: unknown): ResourceRecord {
  const cleanKey = key.trim();
  if (!cleanKey) return choice;
  return {
    ...choice,
    set_flags: {
      ...normalizeJsonObject(choice.set_flags),
      [cleanKey]: value
    }
  };
}

export function defaultChoiceRecord(): ResourceRecord {
  return {
    label: "",
    text: "",
    next: "",
    set_flags: {},
    conditions: []
  };
}

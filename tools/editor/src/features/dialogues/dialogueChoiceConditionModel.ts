import type { ReferenceResources } from "../../editorTypes";
import type { ResourceRecord, ResourceSummary } from "../../types";

export type ChoiceConditionKind = "item" | "character" | "topic_heard" | "topic_unheard" | "node_seen" | "dialogue_seen" | "flag";

export const choiceConditionKinds: ChoiceConditionKind[] = ["item", "character", "topic_heard", "topic_unheard", "node_seen", "dialogue_seen", "flag"];
export const choiceConditionKindLabels: Record<ChoiceConditionKind, string> = {
  item: "아이템 단서",
  character: "캐릭터 정보",
  topic_heard: "토픽 들음",
  topic_unheard: "토픽 미청취",
  node_seen: "노드 봄",
  dialogue_seen: "대사 봄",
  flag: "플래그"
};

export function getChoiceConditionTargetOptions(kind: ChoiceConditionKind, references: ReferenceResources, nodeOptions: ResourceSummary[]) {
  if (kind === "item") return references.items;
  if (kind === "character") return references.characters;
  if (kind === "node_seen") return nodeOptions;
  if (kind === "dialogue_seen") return references.dialogues;
  return [];
}

export function buildChoiceConditionRecord(kind: ChoiceConditionKind, target: string, flagValue: unknown): ResourceRecord {
  const cleanTarget = target.trim();
  if (kind === "flag") return { kind: "flag", key: cleanTarget, value: flagValue };
  if (kind === "item") return { kind: "item", id: cleanTarget };
  if (kind === "character") return { kind: "character", id: cleanTarget };
  if (kind === "topic_heard") return { kind: "topic_heard", topic_id: cleanTarget };
  if (kind === "topic_unheard") return { kind: "topic_unheard", topic_id: cleanTarget };
  if (kind === "node_seen") return { kind: "node_seen", node_id: cleanTarget };
  if (kind === "dialogue_seen") return { kind: "dialogue_seen", dialogue_id: cleanTarget };
  return { kind, id: cleanTarget };
}

export function parseStoryFlagEditorValue(value: unknown): unknown {
  const text = String(value ?? "").trim();
  if (text === "") return true;
  const lowered = text.toLowerCase();
  if (["true", "yes", "on"].includes(lowered)) return true;
  if (["false", "no", "off"].includes(lowered)) return false;
  if (lowered === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  return text;
}

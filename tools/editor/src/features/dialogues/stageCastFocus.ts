import type { ResourceRecord, ResourceSummary } from "../../types";
import { characterIsProtagonist } from "./stageCastCharacters";
import { normalizeCharacterIdList } from "./stageCastTimeline";

export function defaultFocusTargetsForSpeaker(speakerId: string, characters: ResourceSummary[]) {
  if (!speakerId || speakerId === "mystery" || characterIsProtagonist(speakerId, characters)) return [];
  return [speakerId];
}

export function getNodeFocusTargets(node: ResourceRecord | undefined) {
  if (!node) return [];
  const rawValue = node.focus_targets ?? node.focus_characters ?? node.spotlight_targets ?? node.attention_targets ?? node.camera_focus_targets;
  return normalizeCharacterIdList(rawValue);
}

export function nodeHasExplicitFocusTargets(node: ResourceRecord | undefined) {
  return Boolean(
    node
    && (
      Object.prototype.hasOwnProperty.call(node, "focus_targets")
      || Object.prototype.hasOwnProperty.call(node, "focus_characters")
      || Object.prototype.hasOwnProperty.call(node, "spotlight_targets")
      || Object.prototype.hasOwnProperty.call(node, "attention_targets")
      || Object.prototype.hasOwnProperty.call(node, "camera_focus_targets")
    )
  );
}

export function withNodeFocusTargets(node: ResourceRecord, focusTargets: string[]) {
  const next: ResourceRecord = { ...node, focus_targets: normalizeCharacterIdList(focusTargets) };
  delete next.focus_characters;
  delete next.spotlight_targets;
  delete next.attention_targets;
  delete next.camera_focus_targets;
  return next;
}

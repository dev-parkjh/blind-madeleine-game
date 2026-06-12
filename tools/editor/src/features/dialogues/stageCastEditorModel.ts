import type { EditorCopy } from "../../editorText";
import { asArray } from "../../lib/resourceConfig";
import { normalizeBooleanFlag, normalizeNumber } from "../../lib/numeric";
import type { ResourceRecord, ResourceSummary } from "../../types";
import { portraitRecordForEditor } from "../characters/portraitModel";
import {
  characterLabel,
  findPreviousCastEntry,
  getNodeFocusTargets,
  normalizeCastPosition,
  parseCastOffset,
  portraitZoomDefault,
  stageCastDefaultAnimationSpeed,
  stageCastDefaultOpacity,
  stageCastAnimationOrderDefault
} from "./stageCastModel";
import type { StageCastPreviewEntry } from "./StageCastScenePreview";

export function stageCastPositionLabels(ui: EditorCopy): Record<string, string> {
  return {
    far_left: ui.form.positionFarLeft,
    left: ui.form.positionLeft,
    center: ui.form.positionCenter,
    right: ui.form.positionRight,
    far_right: ui.form.positionFarRight,
    custom: ui.form.positionCustom
  };
}

export function getStageCastPositionLabel(value: string, ui: EditorCopy) {
  return stageCastPositionLabels(ui)[value] || value;
}

export function buildStageCastPreviewEntries({
  cast,
  characterDetails,
  characters,
  focusTargets,
  nodes,
  selectedNodeIndex,
  speakerId,
  speakerMystery
}: {
  cast: Record<string, ResourceRecord>;
  characterDetails: Record<string, ResourceRecord>;
  characters: ResourceSummary[];
  focusTargets?: unknown;
  nodes: ResourceRecord[];
  selectedNodeIndex: number;
  speakerId: string;
  speakerMystery: boolean;
}): StageCastPreviewEntry[] {
  const focusTargetIds = getNodeFocusTargets({ focus_targets: focusTargets });
  return Object.entries(cast).map(([characterId, value], index) => {
    const character = characterDetails[characterId];
    const inherited = findPreviousCastEntry(nodes, selectedNodeIndex, characterId);
    return {
      characterId,
      character,
      index,
      inherited,
      isSpeaker: characterId === speakerId,
      isFocused: focusTargetIds.includes(characterId),
      label: characterLabel(characterId, character, characters),
      portrait: resolveCastPortrait(character, value.portrait),
      position: normalizeCastPosition(value.portrait_position ?? value.position),
      offset: parseCastOffset(value.portrait_offset),
      positionOrder: normalizeNumber(value.portrait_position_order ?? value.position_order, index + 1, 1),
      animationOrder: normalizeNumber(value.animation_order ?? value.order, stageCastAnimationOrderDefault, 1),
      animationSpeed: normalizeNumber(value.animation_speed, stageCastDefaultAnimationSpeed, 0.5, 2),
      portraitOpacity: normalizeNumber(value.portrait_opacity ?? value.opacity, stageCastDefaultOpacity, 0, 1),
      portraitZoom: normalizeNumber(value.portrait_zoom, portraitZoomDefault, 100, 500),
      flipH: normalizeBooleanFlag(value.portrait_flip_h ?? value.flip_h ?? value.flip_x),
      mystery: normalizeBooleanFlag(value.mystery ?? value.portrait_mystery, characterId === speakerId && speakerMystery)
    };
  });
}

export function portraitKeys(character: ResourceRecord | undefined) {
  const portraits = character?.portraits && typeof character.portraits === "object"
    ? character.portraits as Record<string, ResourceRecord | string>
    : {};
  return Object.keys(portraits);
}

function resolveCastPortrait(character: ResourceRecord | undefined, keyOrPath: unknown): StageCastPreviewEntry["portrait"] {
  const portraits = character?.portraits && typeof character.portraits === "object"
    ? character.portraits as Record<string, ResourceRecord | string>
    : {};
  const key = String(keyOrPath || "").trim();
  if (!key) return null;
  if (key.startsWith("res://")) {
    return { key, path: key, center: [0.5, 0.34], profile: {} };
  }

  const portraitKey = portraits[key] ? key : "";
  const rawPortrait = portraitKey ? portraits[portraitKey] : null;
  if (!rawPortrait) return null;
  const portrait = portraitRecordForEditor(rawPortrait);
  return {
    key: portraitKey,
    path: String(portrait.path || ""),
    center: asArray<number>(portrait.center),
    profile: portrait.profile && typeof portrait.profile === "object" ? portrait.profile as ResourceRecord : {}
  };
}

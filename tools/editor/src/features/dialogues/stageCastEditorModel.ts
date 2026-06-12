import type { EditorCopy } from "../../editorText";
import { asArray } from "../../lib/resourceConfig";
import { normalizeBooleanFlag, normalizeNumber } from "../../lib/numeric";
import type { ResourceRecord, ResourceSummary } from "../../types";
import { getLive2dMotions, getLive2dParts, live2dRecordForEditor } from "../characters/live2dModel";
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
      live2dEnabled: characterHasLive2dRig(character),
      live2dAngle: normalizeNumber(value.live2d_angle ?? value.view_angle ?? value.angle, 0, -45, 45),
      flipH: normalizeBooleanFlag(value.portrait_flip_h ?? value.flip_h ?? value.flip_x),
      mystery: normalizeBooleanFlag(value.mystery ?? value.portrait_mystery, characterId === speakerId && speakerMystery)
    };
  });
}

export function portraitKeys(character: ResourceRecord | undefined) {
  const portraits = character?.portraits && typeof character.portraits === "object"
    ? character.portraits as Record<string, ResourceRecord | string>
    : {};
  const live2d = live2dRecordForEditor(character?.live2d);
  const motionKeys = Object.keys(getLive2dMotions(live2d.motions));
  return Array.from(new Set([...Object.keys(portraits), ...motionKeys]));
}

function characterHasLive2dRig(character: ResourceRecord | undefined) {
  const live2d = live2dRecordForEditor(character?.live2d);
  return normalizeBooleanFlag(live2d.enabled, false) && getLive2dParts(live2d.parts).length > 0;
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
  if (!rawPortrait) {
    const live2d = live2dRecordForEditor(character?.live2d);
    if (!key || !getLive2dMotions(live2d.motions)[key]) return null;
    const fallbackRawPortrait = portraits.default || Object.values(portraits)[0];
    if (!fallbackRawPortrait) return null;
    const fallbackPortrait = portraitRecordForEditor(fallbackRawPortrait);
    return {
      key,
      path: String(fallbackPortrait.path || ""),
      center: asArray<number>(fallbackPortrait.center),
      profile: fallbackPortrait.profile && typeof fallbackPortrait.profile === "object" ? fallbackPortrait.profile as ResourceRecord : {}
    };
  }
  const portrait = portraitRecordForEditor(rawPortrait);
  return {
    key: portraitKey,
    path: String(portrait.path || ""),
    center: asArray<number>(portrait.center),
    profile: portrait.profile && typeof portrait.profile === "object" ? portrait.profile as ResourceRecord : {}
  };
}

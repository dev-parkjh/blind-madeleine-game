import { useEffect, useState } from "react";
import { loadResource } from "../../lib/api";
import type { ResourceRecord, ResourceSummary } from "../../types";
import {
  buildInheritedStageCastEntry,
  characterIsProtagonist,
  fillStageCastDefaults,
  getNodeFocusTargets,
  live2dStageCastDefaultsForCharacterId,
  normalizeCastPosition,
  normalizeTimelineCharacterId,
  parseCastOffset,
  removeProtagonistStageCastEntries,
  stageCastAnimationOrderDefault
} from "./stageCastModel";
import { buildStageCastPreviewEntries } from "./stageCastEditorModel";

export function useStageCastEditorController({
  characters,
  focusTargets,
  nodes,
  onChange,
  onFocusTargetsChange,
  selectedNodeIndex,
  speakerId,
  speakerMystery,
  stageCast
}: {
  characters: ResourceSummary[];
  focusTargets?: unknown;
  nodes: ResourceRecord[];
  onChange: (stageCast: Record<string, ResourceRecord>) => void;
  onFocusTargetsChange?: (focusTargets: string[]) => void;
  selectedNodeIndex: number;
  speakerId: string;
  speakerMystery: boolean;
  stageCast: unknown;
}) {
  const cast = stageCast && typeof stageCast === "object" ? stageCast as Record<string, ResourceRecord> : {};
  const entries = Object.entries(cast);
  const castIds = entries.map(([characterId]) => characterId);
  const focusTargetIds = getNodeFocusTargets({ focus_targets: focusTargets });
  const focusTargetOptions = characters.filter((character) => castIds.includes(character.id) || focusTargetIds.includes(character.id));
  const stageCastCharacterOptions = characters.filter((character) => !character.isProtagonist);
  const [characterDetails, setCharacterDetails] = useState<Record<string, ResourceRecord>>({});
  const [selectedCastId, setSelectedCastId] = useState("");
  const castIdsKey = [...castIds].sort((a, b) => a.localeCompare(b)).join("|");

  useEffect(() => {
    const ids = castIds.filter((characterId) => characterId && characterId !== "mystery" && !characterDetails[characterId]);
    if (ids.length === 0) return undefined;

    let cancelled = false;
    void Promise.all(ids.map(async (characterId) => {
      try {
        const result = await loadResource("characters", characterId);
        return [characterId, result.data] as const;
      } catch {
        return [characterId, null] as const;
      }
    })).then((loaded) => {
      if (cancelled) return;
      setCharacterDetails((previous) => {
        const next = { ...previous };
        for (const [characterId, data] of loaded) {
          if (data) next[characterId] = data;
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [castIdsKey, characterDetails]);

  useEffect(() => {
    if (selectedCastId && !cast[selectedCastId]) setSelectedCastId("");
  }, [cast, selectedCastId]);

  function emitStageCastChange(nextCast: Record<string, ResourceRecord>) {
    onChange(removeProtagonistStageCastEntries(nextCast, characters).stageCast);
  }

  function updateCast(characterId: string, patch: ResourceRecord) {
    emitStageCastChange({ ...cast, [characterId]: { ...(cast[characterId] || {}), ...patch } });
  }

  function updateCastLive2d(characterId: string, patch: ResourceRecord, deleteKeys: string[] = []) {
    const nextEntry: ResourceRecord = { ...(cast[characterId] || {}) };
    for (const key of deleteKeys) delete nextEntry[key];
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === null || value === "") delete nextEntry[key];
      else nextEntry[key] = value;
    }
    emitStageCastChange({ ...cast, [characterId]: nextEntry });
  }

  function removeCast(characterId: string) {
    const next = { ...cast };
    delete next[characterId];
    emitStageCastChange(next);
    if (selectedCastId === characterId) setSelectedCastId("");
  }

  function addCast(characterId: string) {
    if (!characterId || cast[characterId] || characterIsProtagonist(characterId, characters)) return;
    const isSpeaker = characterId === speakerId;
    const inherited = buildInheritedStageCastEntry(nodes, selectedNodeIndex, characterId);
    emitStageCastChange({
      ...cast,
      [characterId]: fillStageCastDefaults(
        inherited && typeof inherited === "object" ? inherited : {},
        isSpeaker && speakerMystery,
        stageCastAnimationOrderDefault,
        live2dStageCastDefaultsForCharacterId(characterId, characters)
      )
    });
    setSelectedCastId(characterId);
  }

  function toggleFocusTarget(characterId: string) {
    if (!onFocusTargetsChange) return;
    const cleanId = normalizeTimelineCharacterId(characterId);
    if (!cleanId) return;
    onFocusTargetsChange(
      focusTargetIds.includes(cleanId)
        ? focusTargetIds.filter((id) => id !== cleanId)
        : [...focusTargetIds, cleanId]
    );
  }

  function updatePosition(characterId: string, value: string) {
    const position = normalizeCastPosition(value);
    const previousOffset = parseCastOffset(cast[characterId]?.portrait_offset);
    updateCast(characterId, {
      portrait_position: position,
      portrait_offset: position === "custom" ? [previousOffset.x, previousOffset.y] : null
    });
  }

  const stageEntries = buildStageCastPreviewEntries({
    cast,
    characterDetails,
    characters,
    focusTargets,
    nodes,
    selectedNodeIndex,
    speakerId,
    speakerMystery
  });

  return {
    addCast,
    cast,
    entries,
    focusTargetIds,
    focusTargetOptions,
    removeCast,
    selectedCastId,
    setSelectedCastId,
    stageCastCharacterOptions,
    stageEntries,
    toggleFocusTarget,
    updateCast,
    updateCastLive2d,
    updatePosition
  };
}

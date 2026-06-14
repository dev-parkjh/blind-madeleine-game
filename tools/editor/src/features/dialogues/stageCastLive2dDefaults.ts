import type { ResourceRecord, ResourceSummary } from "../../types";

export function live2dStageCastDefaultsForCharacterId(characterId: string, characters: ResourceSummary[] = []) {
  const cleanId = String(characterId || "").trim();
  if (!cleanId || cleanId === "mystery") return {};
  return live2dStageCastDefaultsForCharacter(characters.find((character) => character.id === cleanId));
}

export function live2dStageCastDefaultsForCharacter(character: ResourceSummary | undefined) {
  const validation = character?.validation && typeof character.validation === "object" && !Array.isArray(character.validation)
    ? character.validation as ResourceRecord
    : {};
  const motion = validation.live2dDialogueMotion && typeof validation.live2dDialogueMotion === "object" && !Array.isArray(validation.live2dDialogueMotion)
    ? validation.live2dDialogueMotion as ResourceRecord
    : {};
  const clipIds = Array.isArray(validation.live2dMotionClipIds)
    ? validation.live2dMotionClipIds.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  const poseTags = Array.isArray(validation.live2dPoseTags)
    ? validation.live2dPoseTags.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  const hasLive2d = clipIds.length > 0 || poseTags.length > 0 || Object.keys(motion).length > 0;
  if (!hasLive2d) return {};

  const idleClipId = String(motion.idleClipId || motion.idle_clip_id || "").trim();
  const talkClipId = String(motion.talkClipId || motion.talk_clip_id || "").trim();
  const visemeClipId = String(motion.visemeClipId || motion.viseme_clip_id || "").trim();
  const defaults: ResourceRecord = {
    adaptive_live2d_pose: true
  };
  if (motion.ready === true) {
    defaults.live2d_dialogue_motion = true;
    if (idleClipId) defaults.live2d_idle_motion_clip = idleClipId;
    if (talkClipId) defaults.live2d_talk_motion_clip = talkClipId;
    if (visemeClipId) defaults.live2d_viseme_motion_clip = visemeClipId;
  }
  return defaults;
}

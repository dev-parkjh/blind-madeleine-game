import type { ResourceRecord, ResourceSummary } from "../../types";

export function portraitRigStageCastDefaultsForCharacterId(characterId: string, characters: ResourceSummary[] = []) {
  const cleanId = String(characterId || "").trim();
  if (!cleanId || cleanId === "mystery") return {};
  return portraitRigStageCastDefaultsForCharacter(characters.find((character) => character.id === cleanId));
}

export function portraitRigStageCastDefaultsForCharacter(character: ResourceSummary | undefined) {
  const validation = character?.validation && typeof character.validation === "object" && !Array.isArray(character.validation)
    ? character.validation as ResourceRecord
    : {};
  const motion = validation.portraitRigDialogueMotion && typeof validation.portraitRigDialogueMotion === "object" && !Array.isArray(validation.portraitRigDialogueMotion)
    ? validation.portraitRigDialogueMotion as ResourceRecord
    : {};
  const clipIds = Array.isArray(validation.portraitRigMotionClipIds)
    ? validation.portraitRigMotionClipIds.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  const poseTags = Array.isArray(validation.portraitRigPoseTags)
    ? validation.portraitRigPoseTags.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  const hasPortraitRig = clipIds.length > 0 || poseTags.length > 0 || Object.keys(motion).length > 0;
  if (!hasPortraitRig) return {};

  const idleClipId = String(motion.idleClipId || motion.idle_clip_id || "").trim();
  const talkClipId = String(motion.talkClipId || motion.talk_clip_id || "").trim();
  const visemeClipId = String(motion.visemeClipId || motion.viseme_clip_id || "").trim();
  const defaults: ResourceRecord = {
    adaptive_portrait_rig_pose: true
  };
  if (motion.ready === true) {
    defaults.portrait_rig_dialogue_motion = true;
    if (idleClipId) defaults.portrait_rig_idle_motion_clip = idleClipId;
    if (talkClipId) defaults.portrait_rig_talk_motion_clip = talkClipId;
    if (visemeClipId) defaults.portrait_rig_viseme_motion_clip = visemeClipId;
  }
  return defaults;
}

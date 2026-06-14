import assert from "node:assert/strict";
import { buildStageCastPreviewEntries } from "../src/features/dialogues/stageCastEditorModel.ts";
import { ensureStageCastForNode } from "../src/features/dialogues/stageCastCleanupNode.ts";
import { live2dStageCastDefaultsForCharacterId } from "../src/features/dialogues/stageCastLive2dDefaults.ts";
import { withSpeakerStageCastDefaults } from "../src/features/dialogues/stageCastSpeakerDefaults.ts";

const characterId = "madeleine";
const camelCharacterId = "camel_madeleine";
const character = {
  id: characterId,
  display_name: "Madeleine",
  portraits: {},
  metadata: {
    live2d_web_model: {
      adaptive_clip_id: "adaptive_pose",
      dialogue_motion_set: {
        ready: true,
        adaptive_clip_id: "adaptive_pose",
        idle_clip_id: "idle_loop",
        talk_clip_id: "talk_loop",
        viseme_clip_id: "viseme_set",
        complete_exported_clip_ids: ["adaptive_pose", "idle_loop", "talk_loop", "viseme_set"],
        has_complete_adaptive_pose: true,
        has_complete_idle_loop: true,
        has_complete_talk_loop: true,
        has_complete_viseme_set: true
      },
      clips: [
        { id: "adaptive_pose", label: "Adaptive Pose", export_frame_count: 3 },
        { id: "idle_loop", label: "Idle Loop", export_frame_count: 2 },
        { id: "talk_loop", label: "Talk Loop", export_frame_count: 2 },
        { id: "viseme_set", label: "Viseme Set", export_frame_count: 4 }
      ],
      expression_presets: [
        {
          id: "worried",
          label: "Worried",
          pose_tags: ["worried", "anxious"],
          pose_score: { worried: 1, anxious: 0.85 }
        }
      ],
      motion_frame_sets: [
        {
          clip_id: "adaptive_pose",
          clip_label: "Adaptive Pose",
          frame_count: 3,
          clip_duration: 1.2,
          states: [
            frameState("neutral", "adaptive_pose", 0, 0, ["neutral", "closed_mouth"], { neutral: 1, closed_mouth: 0.9 }, { mouthOpen: 0 }),
            frameState("surprised", "adaptive_pose", 1, 0.6, ["surprised", "open_mouth"], { surprised: 0.98, open_mouth: 0.78 }, { mouthOpen: 0.75 }),
            frameState("talk", "adaptive_pose", 2, 1.1, ["talk", "open_mouth"], { talk: 0.95, open_mouth: 0.72 }, { mouthOpen: 0.55 })
          ]
        },
        {
          clip_id: "idle_loop",
          clip_label: "Idle Loop",
          frame_count: 2,
          clip_duration: 1,
          states: [
            frameState("idle_01", "idle_loop", 0, 0, ["neutral", "closed_mouth"], { neutral: 1 }, { mouthOpen: 0 }),
            frameState("idle_02", "idle_loop", 1, 0.5, ["neutral", "closed_mouth"], { neutral: 0.95 }, { mouthOpen: 0 })
          ]
        },
        {
          clip_id: "talk_loop",
          clip_label: "Talk Loop",
          frame_count: 2,
          clip_duration: 0.8,
          states: [
            frameState("talk_closed", "talk_loop", 0, 0, ["talk", "closed_mouth", "viseme_closed"], { talk: 0.8, viseme_closed: 1 }, { mouthOpen: 0 }),
            frameState("talk_open", "talk_loop", 1, 0.4, ["talk", "open_mouth", "viseme_a"], { talk: 1, open_mouth: 0.9, viseme_a: 0.7 }, { mouthOpen: 0.68 })
          ]
        },
        {
          clip_id: "viseme_set",
          clip_label: "Viseme Set",
          frame_count: 4,
          clip_duration: 1.2,
          states: [
            frameState("viseme_closed", "viseme_set", 0, 0, ["viseme", "phoneme", "viseme_closed", "closed_mouth"], { viseme_closed: 1 }, { mouthOpen: 0 }),
            frameState("viseme_a", "viseme_set", 1, 0.3, ["viseme", "phoneme", "viseme_a", "open_mouth"], { viseme_a: 1, open_mouth: 0.75 }, { mouthOpen: 0.72 }),
            frameState("viseme_o", "viseme_set", 2, 0.6, ["viseme", "phoneme", "viseme_o", "open_mouth"], { viseme_o: 1, open_mouth: 0.62 }, { mouthOpen: 0.56 }),
            frameState("viseme_u", "viseme_set", 3, 0.9, ["viseme", "phoneme", "viseme_u"], { viseme_u: 1 }, { mouthOpen: 0.42 })
          ]
        }
      ]
    }
  }
};

const incompleteCharacter = {
  id: "incomplete_madeleine",
  display_name: "Incomplete Madeleine",
  portraits: {},
  metadata: {
    live2d_web_model: {
      dialogue_motion_set: {
        ready: false,
        adaptive_clip_id: "adaptive_pose",
        idle_clip_id: "idle_loop",
        talk_clip_id: "talk_loop",
        complete_exported_clip_ids: ["adaptive_pose"],
        missing_exported_clip_ids: ["idle_loop", "talk_loop"],
        has_complete_adaptive_pose: true,
        has_complete_idle_loop: false,
        has_complete_talk_loop: false
      },
      motion_frame_sets: [
        {
          clip_id: "adaptive_pose",
          frame_count: 1,
          expected_frame_count: 1,
          states: [
            frameState("incomplete_neutral", "adaptive_pose", 0, 0, ["neutral"], { neutral: 1 }, { mouthOpen: 0 })
          ]
        }
      ]
    }
  }
};

const camelCharacter = {
  id: camelCharacterId,
  display_name: "Camel Madeleine",
  portraits: {},
  metadata: {
    live2dWebModel: {
      dialogueMotionSet: {
        adaptiveClipId: "camel_adaptive",
        idleClipId: "camel_idle",
        talkClipId: "camel_talk",
        visemeClipId: "camel_viseme"
      },
      expressionPresets: [
        {
          id: "curious",
          label: "Curious",
          poseTags: ["curious"],
          poseScore: { curious: 1 }
        }
      ],
      motionFrameSets: [
        {
          clipId: "camel_idle",
          clipLabel: "Camel Idle",
          frameCount: 2,
          clipDuration: 1,
          states: [
            camelFrameState("camel_idle_01", "camel_idle", 0, 0, ["neutral"], { neutral: 1 }, { angleX: 0 }),
            camelFrameState("camel_idle_02", "camel_idle", 1, 0.5, ["curious"], { curious: 1 }, { angleX: 0.2 })
          ]
        }
      ]
    }
  }
};

const characters = [{
  id: characterId,
  type: "characters",
  title: "Madeleine",
  subtitle: "Live2D",
  validation: {
    live2dMotionClipIds: ["adaptive_pose", "idle_loop", "talk_loop", "viseme_set"],
    live2dPoseTags: ["neutral", "talk", "surprised", "viseme_a"],
    live2dDialogueMotion: {
      ready: true,
      adaptiveClipId: "adaptive_pose",
      idleClipId: "idle_loop",
      talkClipId: "talk_loop",
      visemeClipId: "viseme_set"
    }
  }
}];

const camelCharacters = [{
  id: camelCharacterId,
  type: "characters",
  title: "Camel Madeleine",
  subtitle: "Live2D",
  validation: {
    live2dMotionClipIds: ["camel_adaptive", "camel_idle", "camel_talk", "camel_viseme"],
    live2dPoseTags: ["neutral", "curious"],
    live2dDialogueMotion: {
      ready: true,
      adaptiveClipId: "camel_adaptive",
      idleClipId: "camel_idle",
      talkClipId: "camel_talk",
      visemeClipId: "camel_viseme"
    }
  }
}];

const incompleteCharacters = [{
  id: "incomplete_madeleine",
  type: "characters",
  title: "Incomplete Madeleine",
  subtitle: "Live2D",
  validation: {
    live2dMotionClipIds: ["adaptive_pose", "idle_loop", "talk_loop"],
    live2dPoseTags: ["neutral"],
    live2dDialogueMotion: {
      ready: false,
      adaptiveClipId: "adaptive_pose",
      idleClipId: "idle_loop",
      talkClipId: "talk_loop",
      missingExportedClipIds: ["idle_loop", "talk_loop"]
    }
  }
}];

const live2dDefaults = live2dStageCastDefaultsForCharacterId(characterId, characters);
assert.deepEqual(live2dDefaults, {
  adaptive_live2d_pose: true,
  live2d_dialogue_motion: true,
  live2d_idle_motion_clip: "idle_loop",
  live2d_talk_motion_clip: "talk_loop",
  live2d_viseme_motion_clip: "viseme_set"
});
assert.deepEqual(live2dStageCastDefaultsForCharacterId("incomplete_madeleine", incompleteCharacters), {
  adaptive_live2d_pose: true
});

const readySpeakerNode = withSpeakerStageCastDefaults(
  { id: "ready_node", speaker: "", text: "" },
  characterId,
  [{ id: "ready_node", speaker: "", text: "" }],
  0,
  characters
);
assert.equal(readySpeakerNode.stage_cast[characterId].adaptive_live2d_pose, true);
assert.equal(readySpeakerNode.stage_cast[characterId].live2d_dialogue_motion, true);
assert.equal(readySpeakerNode.stage_cast[characterId].live2d_idle_motion_clip, "idle_loop");

const incompleteSpeakerNode = withSpeakerStageCastDefaults(
  { id: "incomplete_node", speaker: "", text: "" },
  "incomplete_madeleine",
  [{ id: "incomplete_node", speaker: "", text: "" }],
  0,
  incompleteCharacters
);
assert.equal(incompleteSpeakerNode.stage_cast.incomplete_madeleine.adaptive_live2d_pose, true);
assert.equal(incompleteSpeakerNode.stage_cast.incomplete_madeleine.live2d_dialogue_motion, undefined);
assert.equal(incompleteSpeakerNode.stage_cast.incomplete_madeleine.live2d_idle_motion_clip, undefined);

const incompleteCleanup = ensureStageCastForNode(
  { id: "cleanup_node", speaker: "incomplete_madeleine", text: "" },
  ["incomplete_madeleine"],
  "incomplete_madeleine",
  0,
  [{ id: "cleanup_node", speaker: "incomplete_madeleine", text: "" }],
  { characters: incompleteCharacters }
);
assert.equal(incompleteCleanup.node.stage_cast.incomplete_madeleine.adaptive_live2d_pose, true);
assert.equal(incompleteCleanup.node.stage_cast.incomplete_madeleine.live2d_dialogue_motion, undefined);

const incompleteEntry = buildEntryFor(
  "incomplete_madeleine",
  incompleteCharacter,
  incompleteCharacters,
  { incomplete_madeleine: {} },
  { speaker: "incomplete_madeleine", text: "" }
);
assert.equal(incompleteEntry.live2dDialogueMotionReady, false);

const metadataHintEntry = buildEntry(
  { [characterId]: {} },
  { speaker: characterId, metadata: { live2d_pose_hint: "surprised" }, text: "" }
);
assert.equal(metadataHintEntry.live2dPoseHint, "surprised");
assert.equal(metadataHintEntry.portrait?.key, "surprised");

const inferredHintEntry = buildEntry(
  { [characterId]: {} },
  { speaker: characterId, text: "뭐라고!" }
);
assert.equal(inferredHintEntry.live2dPoseHint.includes("surprised"), true);
assert.equal(inferredHintEntry.live2dPoseHint.includes("talk"), true);
assert.equal(inferredHintEntry.live2dPoseHint.includes("viseme_u"), true);
assert.equal(inferredHintEntry.portrait?.key, "surprised");

const motionLoopEntry = buildEntry(
  { [characterId]: { live2d_motion_loop: true } },
  { speaker: characterId, text: "" }
);
assert.deepEqual(motionLoopEntry.live2dMotionPreviewFrames.map((frame) => frame.key), ["neutral", "surprised", "talk"]);
assert.equal(motionLoopEntry.live2dMotionPreviewDuration, 1.2);

const dialogueMotionEntry = buildEntry(
  { [characterId]: { live2d_dialogue_motion: true } },
  { speaker: characterId, text: "" }
);
assert.deepEqual(dialogueMotionEntry.live2dMotionPreviewFrames.map((frame) => frame.key), ["idle_01", "idle_02"]);
assert.equal(dialogueMotionEntry.live2dMotionPreviewDuration, 1);
assert.equal(dialogueMotionEntry.live2dDialogueMotionReady, true);
assert.equal(dialogueMotionEntry.live2dSuggestedIdleMotionClip, "idle_loop");
assert.equal(dialogueMotionEntry.live2dSuggestedTalkMotionClip, "talk_loop");
assert.equal(dialogueMotionEntry.live2dSuggestedVisemeMotionClip, "viseme_set");
assert.equal(dialogueMotionEntry.live2dMotionClips.some((clip) => clip.value === "talk_loop"), true);
assert.equal(dialogueMotionEntry.live2dMotionClips.some((clip) => clip.value === "viseme_set"), true);
assert.equal(dialogueMotionEntry.live2dPoseTags.includes("worried"), true);
assert.equal(dialogueMotionEntry.live2dPoseTags.includes("anxious"), true);

const camelDialogueMotionEntry = buildEntryFor(
  camelCharacterId,
  camelCharacter,
  camelCharacters,
  { [camelCharacterId]: { live2d_dialogue_motion: true } },
  { speaker: camelCharacterId, text: "" }
);
assert.equal(camelDialogueMotionEntry.live2dSuggestedIdleMotionClip, "camel_idle");
assert.deepEqual(camelDialogueMotionEntry.live2dMotionPreviewFrames.map((frame) => frame.key), ["camel_idle_01", "camel_idle_02"]);
assert.equal(camelDialogueMotionEntry.live2dPoseTags.includes("curious"), true);

const camelStageCastAliasEntry = buildEntryFor(
  camelCharacterId,
  camelCharacter,
  camelCharacters,
  {
    [camelCharacterId]: {
      dialogueMotion: true,
      idleClip: "camel_idle",
      poseHint: "curious",
      motionProgress: 0.5,
      motionSpeed: 1.7,
      motionBlendDuration: 0.22
    }
  },
  { speaker: camelCharacterId, text: "" }
);
assert.equal(camelStageCastAliasEntry.live2dDialogueMotion, true);
assert.equal(camelStageCastAliasEntry.live2dIdleMotionClip, "camel_idle");
assert.equal(camelStageCastAliasEntry.live2dPoseHint, "curious");
assert.equal(camelStageCastAliasEntry.live2dMotionProgress, 0.5);
assert.equal(camelStageCastAliasEntry.live2dMotionSpeed, 1.7);
assert.equal(camelStageCastAliasEntry.live2dMotionBlendDuration, 0.22);
assert.equal(camelStageCastAliasEntry.portrait?.key, "camel_idle_02");
assert.deepEqual(camelStageCastAliasEntry.live2dMotionPreviewFrames.map((frame) => frame.key), ["camel_idle_01", "camel_idle_02"]);

const camelMotionLoopAliasEntry = buildEntryFor(
  camelCharacterId,
  camelCharacter,
  camelCharacters,
  { [camelCharacterId]: { motionLoop: true, live2dMotionClip: "camel_idle", motionTime: 0.5 } },
  { speaker: camelCharacterId, text: "" }
);
assert.equal(camelMotionLoopAliasEntry.live2dMotionLoop, true);
assert.equal(camelMotionLoopAliasEntry.live2dMotionClip, "camel_idle");
assert.equal(camelMotionLoopAliasEntry.live2dMotionTime, 0.5);
assert.equal(camelMotionLoopAliasEntry.portrait?.key, "camel_idle_02");
assert.deepEqual(camelMotionLoopAliasEntry.live2dMotionPreviewFrames.map((frame) => frame.key), ["camel_idle_01", "camel_idle_02"]);

const camelMetadataAliasEntry = buildEntryFor(
  camelCharacterId,
  camelCharacter,
  camelCharacters,
  { [camelCharacterId]: {} },
  { speaker: camelCharacterId, metadata: { dialogueMotion: true, idleClip: "camel_idle", poseHint: "curious", motionProgress: 0.5 }, text: "" }
);
assert.equal(camelMetadataAliasEntry.live2dDialogueMotion, true);
assert.equal(camelMetadataAliasEntry.live2dIdleMotionClip, "camel_idle");
assert.equal(camelMetadataAliasEntry.live2dPoseHint, "curious");
assert.equal(camelMetadataAliasEntry.portrait?.key, "camel_idle_02");
assert.deepEqual(camelMetadataAliasEntry.live2dMotionPreviewFrames.map((frame) => frame.key), ["camel_idle_01", "camel_idle_02"]);

const dialogueVisemeMotionEntry = buildEntry(
  { [characterId]: { live2d_dialogue_motion: true } },
  { speaker: characterId, text: "오오!" }
);
assert.deepEqual(dialogueVisemeMotionEntry.live2dMotionPreviewFrames.map((frame) => frame.key), [
  "viseme_closed",
  "viseme_a",
  "viseme_o",
  "viseme_u"
]);
assert.equal(dialogueVisemeMotionEntry.live2dMotionPreviewFrames.every((frame) => frame.clipId === "viseme_set"), true);
assert.equal(dialogueVisemeMotionEntry.live2dMotionPreviewDuration, 1.2);

console.log("Stage cast Live2D preview smoke test passed.");

function buildEntry(cast, node) {
  return buildEntryFor(characterId, character, characters, cast, node);
}

function buildEntryFor(id, detail, characterSummaries, cast, node) {
  const entries = buildStageCastPreviewEntries({
    cast,
    characterDetails: { [id]: detail },
    characters: characterSummaries,
    focusTargets: [id],
    nodes: [node],
    selectedNodeIndex: 0,
    speakerId: id,
    speakerMystery: false
  });
  assert.equal(entries.length, 1);
  return entries[0];
}

function frameState(state, clipId, frameIndex, time, poseTags, poseScore, parameterValues) {
  return {
    state,
    time,
    frame_index: frameIndex,
    image_path: `res://assets/characters/${characterId}/${state}.png`,
    model_path: `res://assets/characters/${characterId}/${state}.live2d-web.json`,
    center: [0.5, 0.22],
    profile: { zoom: 3, offset: [0, 0] },
    live2d_motion_frame: {
      clip_id: clipId,
      clip_label: clipId,
      time,
      frame_index: frameIndex,
      frame_count: clipId === "idle_loop" ? 2 : 3,
      clip_duration: clipId === "idle_loop" ? 1 : 1.2,
      pose_tags: poseTags,
      pose_score: poseScore,
      parameter_values: parameterValues
    },
    pose_tags: poseTags,
    pose_score: poseScore,
    parameter_values: parameterValues
  };
}

function camelFrameState(state, clipId, frameIndex, time, poseTags, poseScore, parameterValues) {
  return {
    key: state,
    time,
    frameIndex,
    imagePath: `res://assets/characters/${camelCharacterId}/${state}.png`,
    modelPath: `res://assets/characters/${camelCharacterId}/${state}.live2d-web.json`,
    center: [0.5, 0.22],
    motionFrame: {
      clipId,
      clipLabel: clipId,
      time,
      frameIndex,
      frameCount: 2,
      clipDuration: 1,
      poseTags,
      poseScore,
      parameterValues
    },
    poseTags,
    poseScore,
    parameterValues
  };
}

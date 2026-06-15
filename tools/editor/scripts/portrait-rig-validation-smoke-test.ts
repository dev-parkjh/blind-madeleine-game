import assert from "node:assert/strict";
import { expandPortraitRigPoseHintTags } from "../src/lib/portraitRigPoseTags.ts";
import { collectValidationIssues } from "../src/lib/validation.ts";

const characterId = "madeleine";
const incompleteCharacterId = "madeleine_incomplete";
const plainCharacterId = "plain_character";
const summary = {
  repoRoot: "",
  editorRoot: "",
  generatedAt: new Date(0).toISOString(),
  resources: {
    characters: resourceGroup("characters", [
      {
        id: characterId,
        type: "characters",
        title: "Madeleine",
        subtitle: "Portrait Rig",
        validation: {
          portraitKeys: ["neutral", "talk"],
          portraitRigMotionClipIds: ["idle_loop", "talk_loop", "viseme_set"],
          portraitRigPoseTags: ["happy", "neutral", "talk"],
          portraitRigDialogueMotion: {
            ready: true,
            adaptiveClipId: "adaptive_pose",
            idleClipId: "idle_loop",
            talkClipId: "talk_loop",
            visemeClipId: "viseme_set",
            missingExportedClipIds: []
          }
        }
      },
      {
        id: incompleteCharacterId,
        type: "characters",
        title: "Madeleine Incomplete",
        subtitle: "Portrait Rig incomplete",
        validation: {
          portraitKeys: ["neutral"],
          portraitRigMotionClipIds: ["adaptive_pose", "idle_loop", "talk_loop"],
          portraitRigPoseTags: ["neutral", "talk"],
          portraitRigDialogueMotion: {
            ready: false,
            adaptiveClipId: "adaptive_pose",
            idleClipId: "idle_loop",
            talkClipId: "talk_loop",
            visemeClipId: "viseme_set",
            missingExportedClipIds: ["idle_loop", "talk_loop"]
          }
        }
      },
      {
        id: plainCharacterId,
        type: "characters",
        title: "Plain Character",
        subtitle: "No Portrait Rig",
        validation: {
          portraitKeys: ["neutral"],
          portraitRigMotionClipIds: [],
          portraitRigPoseTags: []
        }
      }
    ]),
    chapters: resourceGroup("chapters", []),
    dialogues: resourceGroup("dialogues", []),
    items: resourceGroup("items", []),
    story_assets: resourceGroup("story_assets", [])
  }
};

const validDialogue = {
  id: "portrait_rig_validation_valid",
  label: "Portrait Rig validation valid",
  nodes: [
    {
      id: "start",
      speaker: characterId,
      text: "[portrait_rig_motion clip=\"idle_loop\" viseme_clip=\"viseme_set\" portrait_rig_motion_blend_duration=0.2 portrait_rig_motion_autoplay=true portrait_rig_auto_dialogue_motion=true]",
      metadata: {
        portrait_rig_motion_clip: "idle_loop",
        portrait_rig_idle_motion_clip: "idle_loop",
        portrait_rig_talk_motion_clip: "talk_loop",
        portrait_rig_viseme_motion_clip: "viseme_set",
        portrait_rig_pose_hint: "happy",
        portrait_rig_dialogue_motion: true,
        portrait_rig_motion_speed: 1.2
      }
    }
  ]
};

const validIssues = collectValidationIssues("dialogues", validDialogue, validDialogue.id, summary);
assert.equal(hasMessage(validIssues, "Portrait Rig motion clip에서 찾을 수 없습니다"), false);
assert.equal(hasMessage(validIssues, "pose hint/tag가 캐릭터의 exported Portrait Rig pose tag와 맞지 않습니다"), false);
assert.equal(hasMessage(validIssues, "boolean 값이어야 합니다"), false);
assert.equal(expandPortraitRigPoseHintTags(["angry"]).includes("angry"), true);
assert.equal(expandPortraitRigPoseHintTags(["curious"]).includes("curious"), true);

const validPortraitRigEnterDialogue = {
  id: "portrait_rig_validation_enter",
  label: "Portrait Rig validation enter",
  nodes: [
    {
      id: "start",
      speaker: characterId,
      text: "[enter id=\"madeleine\"]안녕.",
      stage_cast: {
        [characterId]: {
          portrait_position: "center",
          portrait_rig_dialogue_motion: true
        }
      }
    }
  ]
};
const validPortraitRigEnterIssues = collectValidationIssues("dialogues", validPortraitRigEnterDialogue, validPortraitRigEnterDialogue.id, summary);
assert.equal(hasMessage(validPortraitRigEnterIssues, "[enter] 대상은 같은 노드의 stage_cast 초상이 필요합니다"), false);

const invalidPlainEnterDialogue = {
  id: "portrait_rig_validation_plain_enter",
  label: "Portrait Rig validation plain enter",
  nodes: [
    {
      id: "start",
      speaker: plainCharacterId,
      text: "[enter id=\"plain_character\"]안녕.",
      stage_cast: {
        [plainCharacterId]: {
          portrait_position: "center"
        }
      }
    }
  ]
};
const invalidPlainEnterIssues = collectValidationIssues("dialogues", invalidPlainEnterDialogue, invalidPlainEnterDialogue.id, summary);
assert.ok(hasMessage(invalidPlainEnterIssues, "nodes[0]: [enter] 대상은 같은 노드의 stage_cast 초상이 필요합니다: plain_character"));

const incompleteDialogueMotion = {
  id: "portrait_rig_validation_incomplete_dialogue_motion",
  label: "Portrait Rig incomplete dialogue motion",
  nodes: [
    {
      id: "start",
      speaker: incompleteCharacterId,
      text: "",
      metadata: {
        portrait_rig_dialogue_motion: true,
        portrait_rig_idle_motion_clip: "idle_loop",
        portrait_rig_talk_motion_clip: "talk_loop"
      }
    }
  ]
};
const incompleteDialogueMotionIssues = collectValidationIssues("dialogues", incompleteDialogueMotion, incompleteDialogueMotion.id, summary);
assert.ok(hasMessage(incompleteDialogueMotionIssues, "nodes[0].metadata.portrait_rig_dialogue_motion은 캐릭터의 Portrait Rig dialogue motion export가 완료된 뒤 사용하는 것을 권장합니다."));
assert.ok(hasMessage(incompleteDialogueMotionIssues, "누락 clip: idle_loop, talk_loop"));

const validCharacter = {
  id: characterId,
  display_name: "Madeleine",
  portraits: {
    neutral: {
      path: "res://assets/characters/madeleine/neutral.png",
      center: [0.5, 0.32],
      portrait_rig_model: "res://assets/characters/madeleine/neutral.portrait-rig.json",
      portrait_rig_motion_frame: {
        clip_id: "adaptive_pose",
        time: 0,
        frame_index: 0,
        frame_count: 3,
        clip_duration: 1.2,
        physics_sampled: true,
        pose_tags: ["neutral"],
        pose_score: { neutral: 1 },
        parameter_values: { mouthOpen: 0 }
      },
      portrait_rig_expression_preset: {
        id: "neutral",
        label: "Neutral",
        auto_generated: true,
        auto_expression_kind: "neutral",
        pose_tags: ["neutral"],
        pose_score: { neutral: 1 },
        parameter_values: { mouthOpen: 0, smile: 0 }
      }
    },
    talk: {
      path: "res://assets/characters/madeleine/talk.png",
      center: [0.5, 0.32],
      portrait_rig_model: "res://assets/characters/madeleine/talk.portrait-rig.json"
    }
  },
  metadata: {
    portrait_rig: {
      app: "tools/portrait-rig-editor",
      source_model_path: "res://assets/characters/madeleine/neutral.portrait-rig.json",
      adaptive_clip_id: "adaptive_pose",
      portrait_count: 2,
      motion_clip_count: 4,
      motion_frame_set_count: 1,
      expression_preset_count: 2,
      auto_expression_preset_count: 1,
      expression_presets: [
        {
          id: "happy",
          label: "Happy",
          parameter_count: 3,
          mesh_snapshot_count: 0,
          auto_generated: true,
          auto_expression_kind: "happy",
          pose_tags: ["happy", "smile"]
        },
        {
          id: "custom_pose",
          label: "Custom Pose",
          parameter_count: 2,
          mesh_snapshot_count: 1,
          auto_generated: false
        }
      ],
      dialogue_motion_set: {
        version: 1,
        ready: false,
        adaptive_clip_id: "adaptive_pose",
        idle_clip_id: "idle_loop",
        talk_clip_id: "talk_loop",
        viseme_clip_id: "viseme_set",
        clip_ids: ["adaptive_pose", "idle_loop", "talk_loop", "viseme_set"],
        exported_clip_ids: ["adaptive_pose"],
        complete_exported_clip_ids: [],
        incomplete_clip_ids: ["adaptive_pose"],
        source_clip_ids: ["adaptive_pose", "idle_loop", "talk_loop", "viseme_set"],
        motion_frame_set_count: 1,
        exported_frame_count: 1,
        expected_frame_count: 3,
        has_exported_adaptive_pose: true,
        has_exported_idle_loop: false,
        has_exported_talk_loop: false,
        has_exported_viseme_set: false,
        has_complete_adaptive_pose: false,
        has_complete_idle_loop: false,
        has_complete_talk_loop: false,
        has_complete_viseme_set: false
      },
      runtime_readiness: {
        version: 1,
        ready: false,
        dialogue_motion_ready: false,
        interaction_ready: true,
        adaptive_pose_ready: false,
        portrait_count: 2,
        motion_frame_set_count: 1,
        complete_motion_frame_set_count: 0,
        exported_frame_count: 1,
        expected_frame_count: 3,
        pose_tag_count: 3,
        parameter_role_count: 2,
        semantic_parameter_count: 2,
        parameter_binding_count: 1,
        hit_area_count: 1,
        expression_preset_count: 2,
        missing: ["adaptive_pose_frames"],
        missing_dialogue_motion: ["idle_loop_frames", "talk_loop_frames", "viseme_set_frames"],
        incomplete_motion_frame_sets: [
          { clip_id: "adaptive_pose", frame_count: 1, expected_frame_count: 3 }
        ]
      },
      clips: [
        { id: "adaptive_pose", label: "Adaptive Pose", duration: 1.2, keyframe_count: 2, export_frame_count: 3 },
        { id: "idle_loop", label: "Idle Loop", duration: 2.4, keyframe_count: 2, export_frame_count: 4 },
        { id: "talk_loop", label: "Talk Loop", duration: 1.2, keyframe_count: 2, export_frame_count: 4 },
        { id: "viseme_set", label: "Viseme Set", duration: 1, keyframe_count: 2, export_frame_count: 4 }
      ],
      motion_frame_sets: [
        {
          clip_id: "adaptive_pose",
          frame_count: 1,
          expected_frame_count: 3,
          clip_duration: 1.2,
          physics_sampled: true,
          states: [
            {
              state: "neutral",
              time: 0,
              frame_index: 0,
              image_path: "res://assets/characters/madeleine/neutral.png",
              model_path: "res://assets/characters/madeleine/neutral.portrait-rig.json",
              center: [0.5, 0.32],
              pose_tags: ["neutral"],
              pose_score: { neutral: 1 },
              parameter_values: { mouthOpen: 0 },
              expression_preset: {
                id: "neutral",
                label: "Neutral",
                auto_generated: true,
                auto_expression_kind: "neutral",
                pose_tags: ["neutral"],
                pose_score: { neutral: 1 },
                parameter_values: { mouthOpen: 0, smile: 0 }
              }
            }
          ]
        }
      ],
      hit_areas: [
        {
          id: "face",
          label: "Face",
          kind: "face",
          normalized_bounds: { x: 0.2, y: 0.12, width: 0.32, height: 0.42 }
        }
      ],
      parameter_bindings: [
        {
          parameter: "mouthOpen",
          label: "Mouth Open",
          role: "mouth_open",
          channels: ["opacity"],
          direct_binding_count: 1,
          affected_parts: [
            {
              part_id: "face",
              label: "Face",
              channels: ["opacity"]
            }
          ]
        }
      ]
    }
  }
};
const characterIssues = collectValidationIssues("characters", validCharacter, validCharacter.id, summary);
assert.equal(characterIssues.some((issue) => issue.severity !== "info"), false, JSON.stringify(characterIssues, null, 2));

const inconsistentReadyCharacter = JSON.parse(JSON.stringify(validCharacter));
inconsistentReadyCharacter.id = "madeleine_inconsistent_ready";
inconsistentReadyCharacter.metadata.portrait_rig.dialogue_motion_set.ready = true;
const inconsistentReadyIssues = collectValidationIssues("characters", inconsistentReadyCharacter, inconsistentReadyCharacter.id, summary);
assert.ok(hasMessage(inconsistentReadyIssues, "metadata.portrait_rig.dialogue_motion_set.ready=true이지만 완료된 dialogue motion clip이 부족합니다: adaptive_pose, idle_loop, talk_loop"));

const missingReadyClipCharacter = JSON.parse(JSON.stringify(validCharacter));
missingReadyClipCharacter.id = "madeleine_missing_ready_clip";
missingReadyClipCharacter.metadata.portrait_rig.dialogue_motion_set = {
  ready: true,
  adaptive_clip_id: "adaptive_pose",
  complete_exported_clip_ids: ["adaptive_pose"]
};
const missingReadyClipIssues = collectValidationIssues("characters", missingReadyClipCharacter, missingReadyClipCharacter.id, summary);
assert.ok(hasMessage(missingReadyClipIssues, "metadata.portrait_rig.dialogue_motion_set.ready=true이면 필수 clip id가 필요합니다: idle_clip_id, talk_clip_id"));

const camelCaseCharacter = {
  id: "camel_portraitRig",
  display_name: "Camel Portrait Rig",
  portraits: {
    camel_explicit: {
      imagePath: "res://assets/characters/camel/camel_explicit.png",
      portraitRigModel: "res://assets/characters/camel/camel_explicit.portrait-rig.json",
      generatedBy: "tools/portrait-rig-editor",
      portraitRigMotionFrame: {
        clipId: "camel_adaptive",
        clipLabel: "Camel Adaptive",
        frameIndex: 0,
        frameCount: 1,
        poseTags: ["curious"],
        poseScore: { curious: 1 },
        parameterValues: { angleX: 0.2 }
      },
      portraitRigExpressionPreset: {
        id: "curious",
        label: "Curious",
        autoGenerated: true,
        autoExpressionKind: "curious",
        poseTags: ["curious"],
        parameterValues: { angleX: 0.2 }
      }
    }
  },
  metadata: {
    portraitRig: {
      sourceModelPath: "res://assets/characters/camel/camel_pose.portrait-rig.json",
      expressionPresets: [
        {
          id: "curious",
          label: "Curious",
          autoGenerated: true,
          autoExpressionKind: "curious",
          poseTags: ["curious"],
          parameterValues: { angleX: 0.2 }
        }
      ],
      dialogueMotionSet: {
        ready: true,
        adaptiveClipId: "camel_adaptive",
        idleClipId: "camel_idle",
        talkClipId: "camel_talk",
        clipIds: ["camel_adaptive", "camel_idle", "camel_talk"],
        exportedClipIds: ["camel_adaptive", "camel_idle", "camel_talk"],
        completeExportedClipIds: ["camel_adaptive", "camel_idle", "camel_talk"],
        motionFrameSetCount: 1,
        exportedFrameCount: 1,
        expectedFrameCount: 1
      },
      motionFrameSets: [
        {
          clipId: "camel_adaptive",
          frameCount: 1,
          expectedFrameCount: 1,
          clipDuration: 0.8,
          physicsSampled: true,
          states: [
            {
              key: "camel_pose",
              time: 0,
              frameIndex: 0,
              imagePath: "res://assets/characters/camel/camel_pose.png",
              modelPath: "res://assets/characters/camel/camel_pose.portrait-rig.json",
              poseTags: ["curious"],
              parameterValues: { angleX: 0.2 }
            }
          ]
        }
      ],
      hitAreas: [
        {
          id: "face",
          kind: "face",
          partId: "face",
          normalizedBounds: { x: 0.2, y: 0.12, width: 0.32, height: 0.42 },
          normalizedPolygon: [
            [0.2, 0.12],
            [0.52, 0.12],
            [0.52, 0.54],
            [0.2, 0.54]
          ]
        }
      ],
      parameterBindings: [
        {
          parameter: "angleX",
          label: "Angle X",
          role: "gaze_x",
          channels: ["motion"],
          direct_binding_count: 1,
          motionClipIds: ["camel_adaptive"],
          affectedParts: [
            {
              partId: "face",
              label: "Face",
              channels: ["x"]
            }
          ]
        }
      ]
    }
  }
};
const camelCaseCharacterIssues = collectValidationIssues("characters", camelCaseCharacter, camelCaseCharacter.id, summary);
assert.equal(camelCaseCharacterIssues.some((issue) => issue.severity !== "info"), false, JSON.stringify(camelCaseCharacterIssues, null, 2));

const invalidDialogue = {
  id: "portrait_rig_validation_invalid",
  label: "Portrait Rig validation invalid",
  nodes: [
    {
      id: "start",
      speaker: characterId,
      text: "[portrait_rig_motion clip=\"missing_clip\" portrait_rig_motion_blend_duration=2 portrait_rig_loop=maybe portrait_rig_auto_dialogue_motion=maybe]",
      metadata: {
        portrait_rig_motion_clip: "missing_clip",
        portrait_rig_pose_hint: "angry",
        portrait_rig_dialogue_motion: "definitely",
        portrait_rig_motion_progress: 2,
        portrait_rig_pose_tags: "sleepy"
      }
    }
  ]
};

const invalidIssues = collectValidationIssues("dialogues", invalidDialogue, invalidDialogue.id, summary);
assert.ok(hasMessage(invalidIssues, "nodes[0].metadata.portrait_rig_dialogue_motion는 boolean 값이어야 합니다."));
assert.ok(hasMessage(invalidIssues, "nodes[0].metadata.portrait_rig_motion_progress는 1 이하여야 합니다."));
assert.ok(hasMessage(invalidIssues, "nodes[0].metadata.portrait_rig_pose_tags는 문자열 배열이어야 합니다."));
assert.ok(hasMessage(invalidIssues, "nodes[0].metadata.portrait_rig_motion_clip를 캐릭터 Portrait Rig motion clip에서 찾을 수 없습니다: missing_clip"));
assert.ok(hasMessage(invalidIssues, "nodes[0].metadata의 Portrait Rig pose hint/tag가 캐릭터의 exported Portrait Rig pose tag와 맞지 않습니다"));
assert.ok(hasMessage(invalidIssues, "nodes[0].[portrait_rig_motion].portrait_rig_loop는 boolean 값이어야 합니다."));
assert.ok(hasMessage(invalidIssues, "nodes[0].[portrait_rig_motion].portrait_rig_auto_dialogue_motion는 boolean 값이어야 합니다."));
assert.ok(hasMessage(invalidIssues, "nodes[0].[portrait_rig_motion].portrait_rig_motion_blend_duration는 1 이하여야 합니다."));

console.log("Portrait Rig validation smoke test passed.");

function resourceGroup(type, resources) {
  return {
    type,
    label: type,
    singularLabel: type,
    count: resources.length,
    resources
  };
}

function hasMessage(issues, snippet) {
  return issues.some((issue) => issue.message.includes(snippet));
}

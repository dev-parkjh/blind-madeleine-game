import assert from "node:assert/strict";
import {
  canonicalJson,
  getLive2dSyncChange,
  isLive2dGeneratedPortrait,
  live2dMetadataPortraitExports,
  mergeLive2dMetadata,
  mergeLive2dPortraitExports,
  recordsEqual
} from "../src/features/characters/live2dPortraitSync.ts";
import { normalizeCharacterDraftForSave } from "../src/features/characters/characterSaveModel.ts";
import { summarizeResource } from "../server/resource-store.mjs";

const currentDraft = {
  id: "madeleine",
  portraits: {
    manual: {
      path: "res://assets/characters/madeleine/manual.png",
      center: [0.4, 0.3]
    },
    old_live2d: {
      path: "res://assets/characters/madeleine/old_live2d.png",
      live2d_model: "res://assets/characters/madeleine/old_live2d.live2d-web.json"
    },
    unchanged: {
      path: "res://assets/characters/madeleine/unchanged.png",
      live2d_model: "res://assets/characters/madeleine/unchanged.live2d-web.json",
      live2d_motion_frame: {
        clip_id: "adaptive_pose",
        frame_index: 0
      }
    },
    stale_live2d: {
      path: "res://assets/characters/madeleine/stale_live2d.png",
      generated_by: "tools/live2d-editor",
      live2d_model: "res://assets/characters/madeleine/stale_live2d.live2d-web.json",
      live2d_motion_frame: {
        clip_id: "old_pose",
        frame_index: 8
      }
    },
    metadata_manual_conflict: {
      path: "res://assets/characters/madeleine/manual_conflict.png",
      center: [0.3, 0.2]
    }
  },
  metadata: {
    keep: "manual metadata",
    live2d_web_model: {
      source_model_path: "res://assets/characters/madeleine/old.live2d-web.json",
      portrait_count: 1
    }
  }
};

const remoteDraft = {
  id: "madeleine",
  portraits: {
    manual: {
      path: "res://assets/characters/madeleine/manual_remote_should_not_merge.png",
      center: [0.9, 0.9]
    },
    old_live2d: {
      path: "res://assets/characters/madeleine/new_live2d.png",
      live2d_model: "res://assets/characters/madeleine/new_live2d.live2d-web.json",
      generated_by: "tools/live2d-editor"
    },
    unchanged: {
      live2d_motion_frame: {
        frame_index: 0,
        clip_id: "adaptive_pose"
      },
      live2d_model: "res://assets/characters/madeleine/unchanged.live2d-web.json",
      path: "res://assets/characters/madeleine/unchanged.png"
    },
    motion_only: {
      path: "res://assets/characters/madeleine/motion_only.png",
      live2d_motion_frame: {
        clip_id: "talk_loop",
        frame_index: 2
      }
    }
  },
  metadata: {
    live2d_web_model: {
      app: "tools/live2d-editor",
      source_model_path: "res://assets/characters/madeleine/new_live2d.live2d-web.json",
      portrait_count: 3,
      portraits: {
        metadata_only: {
          image_path: "res://assets/characters/madeleine/metadata_only.png",
          model_path: "res://assets/characters/madeleine/metadata_only.live2d-web.json",
          center: [0.51, 0.19],
          profile: {
            zoom: 3.4,
            offset: [0.01, -0.02]
          },
          motion_frame: {
            clip_id: "adaptive_pose",
            frame_index: 3,
            pose_tags: ["surprised"]
          }
        },
        camel_metadata_only: {
          imagePath: "res://assets/characters/madeleine/camel_metadata_only.png",
          modelPath: "res://assets/characters/madeleine/camel_metadata_only.live2d-web.json",
          motionFrame: {
            clipId: "adaptive_pose",
            frameIndex: 6,
            poseTags: ["curious"],
            parameterValues: {
              angleX: 0.2
            }
          },
          expressionPreset: {
            id: "curious",
            parameterValues: {
              angleX: 0.2
            }
          }
        },
        metadata_manual_conflict: {
          image_path: "res://assets/characters/madeleine/metadata_conflict.png",
          model_path: "res://assets/characters/madeleine/metadata_conflict.live2d-web.json",
          motion_frame: {
            clip_id: "adaptive_pose",
            frame_index: 4
          }
        }
      },
      motion_frame_sets: [
        {
          clip_id: "adaptive_pose",
          states: [
            {
              state: "unchanged",
              time: 0,
              pose_tags: ["neutral"]
            },
            {
              state: "frame_set_only",
              time: 0.5,
              frame_index: 5,
              image_path: "res://assets/characters/madeleine/frame_set_only.png",
              model_path: "res://assets/characters/madeleine/frame_set_only.live2d-web.json",
              pose_tags: ["talk"],
              pose_score: {
                talk: 0.95
              },
              parameter_values: {
                mouthOpen: 0.7
              },
              expression_preset: {
                id: "talk",
                label: "Talk",
                auto_generated: true,
                auto_expression_kind: "talk",
                pose_tags: ["talk"],
                pose_score: {
                  talk: 1
                },
                parameter_values: {
                  mouthOpen: 0.7
                }
              }
            }
          ]
        }
      ],
      motionFrameSets: [
        {
          clipId: "talk_loop",
          clipLabel: "Talk Loop",
          frameCount: 2,
          clipDuration: 0.8,
          physicsSampled: true,
          states: [
            {
              key: "camel_frame_set",
              time: 0.4,
              frameIndex: 1,
              imagePath: "res://assets/characters/madeleine/camel_frame_set.png",
              modelPath: "res://assets/characters/madeleine/camel_frame_set.live2d-web.json",
              poseTags: ["talk"],
              poseScore: {
                talk: 0.9
              },
              parameterValues: {
                mouthOpen: 0.6
              },
              expressionPreset: {
                id: "talk_camel",
                parameterValues: {
                  mouthOpen: 0.6
                }
              }
            }
          ]
        }
      ]
    }
  }
};

const camelTopLevelRemoteDraft = {
  id: "camel_top_level",
  portraits: {
    camel_explicit: {
      path: "res://assets/characters/camel/camel_explicit.png",
      live2dModel: "res://assets/characters/camel/camel_explicit.live2d-web.json",
      live2dMotionFrame: {
        clipId: "camel_top_idle",
        frameIndex: 0,
        poseTags: ["idle"]
      },
      live2dExpressionPreset: {
        id: "camel_idle_expr",
        poseTags: ["idle"],
        parameterValues: {
          angleX: 0.15
        }
      }
    }
  },
  metadata: {
    keep_remote: "remote metadata",
    live2dWebModel: {
      app: "tools/live2d-editor",
      sourceModelPath: "res://assets/characters/camel/camel_source.live2d-web.json",
      dialogueMotionSet: {
        adaptiveClipId: "camel_top_adaptive",
        idleClipId: "camel_top_idle",
        talkClipId: "camel_top_talk",
        completeExportedClipIds: ["camel_top_adaptive", "camel_top_idle", "camel_top_talk"],
        exportedClipIds: ["camel_top_adaptive", "camel_top_idle", "camel_top_talk"],
        sourceClipIds: ["camel_top_adaptive", "camel_top_idle", "camel_top_talk"]
      },
      portraits: {
        camel_top_metadata: {
          imagePath: "res://assets/characters/camel/camel_top_metadata.png",
          modelPath: "res://assets/characters/camel/camel_top_metadata.live2d-web.json",
          live2dMotionFrame: {
            clipId: "camel_top_adaptive",
            frameIndex: 1,
            poseTags: ["curious"],
            poseScore: {
              curious: 1
            },
            parameterValues: {
              angleX: 0.1
            }
          },
          live2dExpressionPreset: {
            id: "camel_expr",
            poseTags: ["curious"],
            parameterValues: {
              angleX: 0.1
            }
          }
        }
      },
      motionFrameSets: [
        {
          clipId: "camel_top_talk",
          clipLabel: "Camel Top Talk",
          frameCount: 1,
          expectedFrameCount: 1,
          states: [
            {
              key: "camel_top_frame_set",
              imagePath: "res://assets/characters/camel/camel_top_frame_set.png",
              modelPath: "res://assets/characters/camel/camel_top_frame_set.live2d-web.json",
              live2dMotionFrame: {
                clipId: "camel_top_talk",
                frameIndex: 0,
                frameCount: 1,
                poseTags: ["talk"],
                parameterValues: {
                  mouthOpen: 0.8
                }
              },
              live2dExpressionPreset: {
                id: "camel_state_expr",
                poseTags: ["talk"],
                parameterValues: {
                  mouthOpen: 0.8
                }
              }
            }
          ]
        }
      ],
      expressionPresets: [
        {
          id: "camel_expr",
          poseTags: ["curious"]
        }
      ]
    }
  }
};

const metadataExports = live2dMetadataPortraitExports(remoteDraft.metadata);
assert.equal(metadataExports.metadata_only.path, "res://assets/characters/madeleine/metadata_only.png");
assert.equal(metadataExports.metadata_only.live2d_model, "res://assets/characters/madeleine/metadata_only.live2d-web.json");
assert.deepEqual(metadataExports.metadata_only.center, [0.51, 0.19]);
assert.equal(metadataExports.camel_metadata_only.path, "res://assets/characters/madeleine/camel_metadata_only.png");
assert.equal(metadataExports.camel_metadata_only.live2d_model, "res://assets/characters/madeleine/camel_metadata_only.live2d-web.json");
assert.equal(metadataExports.camel_metadata_only.live2d_motion_frame.clipId, "adaptive_pose");
assert.equal(metadataExports.camel_metadata_only.live2d_expression_preset.id, "curious");
assert.equal(metadataExports.frame_set_only.path, "res://assets/characters/madeleine/frame_set_only.png");
assert.equal(metadataExports.frame_set_only.live2d_motion_frame.clip_id, "adaptive_pose");
assert.equal(metadataExports.frame_set_only.live2d_motion_frame.parameter_values.mouthOpen, 0.7);
assert.equal(metadataExports.frame_set_only.live2d_expression_preset.id, "talk");
assert.equal(metadataExports.frame_set_only.live2d_expression_preset.parameter_values.mouthOpen, 0.7);
assert.equal(metadataExports.camel_frame_set.path, "res://assets/characters/madeleine/camel_frame_set.png");
assert.equal(metadataExports.camel_frame_set.live2d_model, "res://assets/characters/madeleine/camel_frame_set.live2d-web.json");
assert.equal(metadataExports.camel_frame_set.live2d_motion_frame.clip_id, "talk_loop");
assert.equal(metadataExports.camel_frame_set.live2d_motion_frame.parameter_values.mouthOpen, 0.6);
assert.equal(metadataExports.camel_frame_set.live2d_expression_preset.id, "talk_camel");

const camelTopExports = live2dMetadataPortraitExports(camelTopLevelRemoteDraft.metadata);
assert.equal(camelTopExports.camel_top_metadata.path, "res://assets/characters/camel/camel_top_metadata.png");
assert.equal(camelTopExports.camel_top_metadata.live2d_model, "res://assets/characters/camel/camel_top_metadata.live2d-web.json");
assert.equal(camelTopExports.camel_top_metadata.live2d_motion_frame.clipId, "camel_top_adaptive");
assert.equal(camelTopExports.camel_top_metadata.live2d_expression_preset.id, "camel_expr");
assert.equal(camelTopExports.camel_top_frame_set.path, "res://assets/characters/camel/camel_top_frame_set.png");
assert.equal(camelTopExports.camel_top_frame_set.live2d_motion_frame.clipId, "camel_top_talk");
assert.equal(camelTopExports.camel_top_frame_set.live2d_expression_preset.id, "camel_state_expr");

const merged = mergeLive2dPortraitExports(currentDraft.portraits, remoteDraft.portraits, remoteDraft.metadata);
assert.equal(merged.count, 6);
assert.equal(merged.portraits.manual.path, currentDraft.portraits.manual.path);
assert.equal(merged.portraits.old_live2d.path, remoteDraft.portraits.old_live2d.path);
assert.equal(merged.portraits.motion_only.path, remoteDraft.portraits.motion_only.path);
assert.equal(merged.portraits.metadata_only.path, "res://assets/characters/madeleine/metadata_only.png");
assert.equal(merged.portraits.camel_metadata_only.path, "res://assets/characters/madeleine/camel_metadata_only.png");
assert.equal(merged.portraits.frame_set_only.path, "res://assets/characters/madeleine/frame_set_only.png");
assert.equal(merged.portraits.camel_frame_set.path, "res://assets/characters/madeleine/camel_frame_set.png");
assert.equal(merged.portraits.metadata_manual_conflict.path, currentDraft.portraits.metadata_manual_conflict.path);
assert.equal(merged.portraits.unchanged.path, currentDraft.portraits.unchanged.path);
assert.equal(merged.portraits.stale_live2d, undefined);
assert.equal(merged.removedCount, 1);

assert.equal(isLive2dGeneratedPortrait(remoteDraft.portraits.manual), false);
assert.equal(isLive2dGeneratedPortrait(remoteDraft.portraits.old_live2d), true);
assert.equal(isLive2dGeneratedPortrait(remoteDraft.portraits.motion_only), true);
assert.equal(isLive2dGeneratedPortrait(camelTopLevelRemoteDraft.portraits.camel_explicit), true);
assert.equal(isLive2dGeneratedPortrait("res://assets/characters/madeleine/string.png"), false);
assert.equal(
  mergeLive2dPortraitExports(currentDraft.portraits, {}, {}).portraits.stale_live2d,
  currentDraft.portraits.stale_live2d
);

const metadata = mergeLive2dMetadata(currentDraft.metadata, remoteDraft.metadata);
assert.equal(metadata?.keep, "manual metadata");
assert.equal(metadata?.live2d_web_model.source_model_path, remoteDraft.metadata.live2d_web_model.source_model_path);
assert.equal(mergeLive2dMetadata(metadata, remoteDraft.metadata), null);

const camelTopMetadata = mergeLive2dMetadata({
  keep: "local metadata",
  live2dWebModel: camelTopLevelRemoteDraft.metadata.live2dWebModel
}, camelTopLevelRemoteDraft.metadata);
assert.equal(camelTopMetadata?.keep, "local metadata");
assert.equal(camelTopMetadata?.live2dWebModel, undefined);
assert.equal(camelTopMetadata?.live2d_web_model.sourceModelPath, camelTopLevelRemoteDraft.metadata.live2dWebModel.sourceModelPath);
assert.equal(mergeLive2dMetadata(camelTopMetadata, camelTopLevelRemoteDraft.metadata), null);

const remoteSummary = summarizeResource("characters", "madeleine", remoteDraft);
assert.equal(remoteSummary.validation.live2dMotionClipIds.includes("talk_loop"), true);
assert.equal(remoteSummary.validation.live2dPoseTags.includes("talk"), true);
assert.equal(remoteSummary.validation.live2dDialogueMotion.sourceClipIds.includes("talk_loop"), true);
assert.equal(remoteSummary.validation.live2dDialogueMotion.exportedClipIds.includes("talk_loop"), true);

const camelOnlySummary = summarizeResource("characters", "camel_only", {
  id: "camel_only",
  metadata: {
    live2d_web_model: {
      dialogueMotionSet: {
        adaptiveClipId: "camel_adaptive",
        idleClipId: "camel_idle",
        talkClipId: "camel_talk",
        completeExportedClipIds: ["camel_adaptive", "camel_idle", "camel_talk"]
      },
      motionFrameSets: [
        {
          clipId: "camel_adaptive",
          frameCount: 1,
          expectedFrameCount: 1,
          states: [
            {
              key: "camel_pose",
              imagePath: "res://assets/characters/camel/camel_pose.png",
              modelPath: "res://assets/characters/camel/camel_pose.live2d-web.json",
              poseTags: ["curious"],
              parameterValues: { angleX: 0.2 }
            }
          ]
        }
      ],
      expressionPresets: [
        {
          id: "curious",
          poseTags: ["curious"]
        }
      ]
    }
  }
});
assert.equal(camelOnlySummary.validation.live2dMotionClipIds.includes("camel_adaptive"), true);
assert.equal(camelOnlySummary.validation.live2dMotionClipIds.includes("camel_idle"), true);
assert.equal(camelOnlySummary.validation.live2dMotionClipIds.includes("camel_talk"), true);
assert.equal(camelOnlySummary.validation.live2dPoseTags.includes("curious"), true);
assert.equal(camelOnlySummary.validation.live2dDialogueMotion.ready, true);
assert.equal(camelOnlySummary.validation.live2dDialogueMotion.adaptiveClipId, "camel_adaptive");

const camelTopMerged = mergeLive2dPortraitExports({}, camelTopLevelRemoteDraft.portraits, camelTopLevelRemoteDraft.metadata);
assert.equal(camelTopMerged.count, 3);
assert.equal(camelTopMerged.portraits.camel_explicit.path, "res://assets/characters/camel/camel_explicit.png");
assert.equal(camelTopMerged.portraits.camel_top_metadata.path, "res://assets/characters/camel/camel_top_metadata.png");
assert.equal(camelTopMerged.portraits.camel_top_frame_set.path, "res://assets/characters/camel/camel_top_frame_set.png");

const savedCamelTop = normalizeCharacterDraftForSave({
  id: "camel_top_level",
  portraits: camelTopMerged.portraits,
  metadata: camelTopLevelRemoteDraft.metadata
});
assert.equal(savedCamelTop.portraits.camel_explicit.live2d_model, "res://assets/characters/camel/camel_explicit.live2d-web.json");
assert.equal(savedCamelTop.portraits.camel_explicit.live2d_motion_frame.clip_id, "camel_top_idle");
assert.deepEqual(savedCamelTop.portraits.camel_explicit.live2d_motion_frame.pose_tags, ["idle"]);
assert.equal(savedCamelTop.portraits.camel_explicit.live2d_expression_preset.id, "camel_idle_expr");
assert.equal(savedCamelTop.portraits.camel_explicit.live2d_expression_preset.parameter_values.angleX, 0.15);

const savedMetadataOnly = normalizeCharacterDraftForSave({
  id: "metadata_only_save",
  portraits: {
    metadata_manual_conflict: currentDraft.portraits.metadata_manual_conflict,
    stale_live2d: currentDraft.portraits.stale_live2d
  },
  metadata: remoteDraft.metadata
});
assert.equal(savedMetadataOnly.portraits.metadata_only.path, "res://assets/characters/madeleine/metadata_only.png");
assert.equal(savedMetadataOnly.portraits.metadata_only.live2d_model, "res://assets/characters/madeleine/metadata_only.live2d-web.json");
assert.equal(savedMetadataOnly.portraits.metadata_only.live2d_motion_frame.clip_id, "adaptive_pose");
assert.deepEqual(savedMetadataOnly.portraits.metadata_only.live2d_motion_frame.pose_tags, ["surprised"]);
assert.equal(savedMetadataOnly.portraits.camel_metadata_only.live2d_motion_frame.clip_id, "adaptive_pose");
assert.equal(savedMetadataOnly.portraits.camel_metadata_only.live2d_motion_frame.parameter_values.angleX, 0.2);
assert.equal(savedMetadataOnly.portraits.camel_metadata_only.live2d_expression_preset.parameter_values.angleX, 0.2);
assert.equal(savedMetadataOnly.portraits.frame_set_only.live2d_motion_frame.clip_id, "adaptive_pose");
assert.equal(savedMetadataOnly.portraits.frame_set_only.live2d_motion_frame.parameter_values.mouthOpen, 0.7);
assert.equal(savedMetadataOnly.portraits.camel_frame_set.live2d_motion_frame.clip_id, "talk_loop");
assert.equal(savedMetadataOnly.portraits.camel_frame_set.live2d_expression_preset.id, "talk_camel");
assert.equal(savedMetadataOnly.portraits.metadata_manual_conflict.path, currentDraft.portraits.metadata_manual_conflict.path);
assert.equal(savedMetadataOnly.portraits.stale_live2d.path, currentDraft.portraits.stale_live2d.path);

const camelTopSummary = summarizeResource("characters", "camel_top_level", camelTopLevelRemoteDraft);
assert.equal(camelTopSummary.validation.live2dMotionClipIds.includes("camel_top_adaptive"), true);
assert.equal(camelTopSummary.validation.live2dMotionClipIds.includes("camel_top_idle"), true);
assert.equal(camelTopSummary.validation.live2dMotionClipIds.includes("camel_top_talk"), true);
assert.equal(camelTopSummary.validation.live2dPoseTags.includes("curious"), true);
assert.equal(camelTopSummary.validation.live2dPoseTags.includes("talk"), true);
assert.equal(camelTopSummary.validation.live2dDialogueMotion.ready, true);
assert.equal(camelTopSummary.validation.live2dDialogueMotion.adaptiveClipId, "camel_top_adaptive");

const change = getLive2dSyncChange(currentDraft, remoteDraft);
assert.deepEqual(change, {
  portraitCount: 6,
  removedPortraitCount: 1,
  metadataChanged: true
});
assert.deepEqual(getLive2dSyncChange({ ...currentDraft, portraits: merged.portraits, metadata }, remoteDraft), {
  portraitCount: 0,
  removedPortraitCount: 0,
  metadataChanged: false
});
assert.deepEqual(getLive2dSyncChange({}, camelTopLevelRemoteDraft), {
  portraitCount: 3,
  removedPortraitCount: 0,
  metadataChanged: true
});

assert.equal(
  recordsEqual(
    { b: 2, a: { y: 2, x: 1 } },
    { a: { x: 1, y: 2 }, b: 2 }
  ),
  true
);
assert.equal(canonicalJson({ z: 1, a: 2 }), "{\"a\":2,\"z\":1}");

const portraitOnlySummary = summarizeResource("characters", "portrait_only", {
  id: "portrait_only",
  display_name: "Portrait Only",
  portraits: {
    adaptive_01: portraitMotion("adaptive_01", "adaptive_pose", 0, 2),
    adaptive_02: portraitMotion("adaptive_02", "adaptive_pose", 1, 2),
    idle_01: portraitMotion("idle_01", "idle_loop", 0, 2),
    idle_02: portraitMotion("idle_02", "idle_loop", 1, 2),
    talk_closed: portraitMotion("talk_closed", "talk_loop", 0, 2),
    talk_open: portraitMotion("talk_open", "talk_loop", 1, 2),
    viseme_closed: portraitMotion("viseme_closed", "viseme_set", 0, 2),
    viseme_o: portraitMotion("viseme_o", "viseme_set", 1, 2)
  }
});
assert.equal(portraitOnlySummary.validation.live2dDialogueMotion.inferredFromMotionFrames, true);
assert.equal(portraitOnlySummary.validation.live2dDialogueMotion.ready, true);
assert.equal(portraitOnlySummary.validation.live2dDialogueMotion.adaptiveClipId, "adaptive_pose");
assert.equal(portraitOnlySummary.validation.live2dDialogueMotion.idleClipId, "idle_loop");
assert.equal(portraitOnlySummary.validation.live2dDialogueMotion.talkClipId, "talk_loop");
assert.equal(portraitOnlySummary.validation.live2dDialogueMotion.visemeClipId, "viseme_set");
assert.deepEqual(portraitOnlySummary.validation.live2dDialogueMotion.missingExportedClipIds, []);

console.log("Live2D portrait sync smoke test passed.");

function portraitMotion(state, clipId, frameIndex, frameCount) {
  return {
    path: `res://assets/characters/portrait_only/${state}.png`,
    live2d_model: `res://assets/characters/portrait_only/${state}.live2d-web.json`,
    live2d_motion_frame: {
      clip_id: clipId,
      clip_label: clipId,
      time: frameIndex / Math.max(1, frameCount),
      frame_index: frameIndex,
      frame_count: frameCount,
      clip_duration: 1,
      pose_tags: clipId === "viseme_set" ? ["viseme", state] : [clipId.replace(/_loop$/, "")],
      pose_score: { [clipId.replace(/_loop$/, "")]: 1 },
      parameter_values: { mouthOpen: frameIndex / Math.max(1, frameCount - 1) }
    }
  };
}

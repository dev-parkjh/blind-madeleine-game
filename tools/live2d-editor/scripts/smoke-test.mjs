import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptRoot, "..");
const repoRoot = path.resolve(projectRoot, "..", "..");
const characterId = `live2d_smoke_${process.pid}_${Date.now()}`;
const camelCharacterId = `${characterId}_camel`;
const state = "adaptive_pose_f01";
const pngDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
const characterFile = path.join(repoRoot, "data", "characters", `${characterId}.json`);
const camelCharacterFile = path.join(repoRoot, "data", "characters", `${camelCharacterId}.json`);
const characterAssetDir = path.join(repoRoot, "assets", "characters", characterId);
const camelCharacterAssetDir = path.join(repoRoot, "assets", "characters", camelCharacterId);

let serverProcess = null;
let serverOutput = "";

try {
  await cleanupSmokeFiles();
  const port = await getOpenPort();
  serverProcess = spawn(process.execPath, ["server.mjs"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      LIVE2D_GODOT_IMPORT_AUTO: "0"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  serverProcess.stdout.setEncoding("utf8");
  serverProcess.stderr.setEncoding("utf8");
  serverProcess.stdout.on("data", (chunk) => {
    serverOutput += chunk;
  });
  serverProcess.stderr.on("data", (chunk) => {
    serverOutput += chunk;
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForHealth(baseUrl);

  await requestJson(baseUrl, "/api/characters", {
    method: "POST",
    body: {
      id: characterId,
      display_name: "Smoke Rig",
      name_color: "#abcdef"
    }
  });

  const partResult = await requestJson(baseUrl, `/api/characters/${characterId}/live2d-part`, {
    method: "POST",
    body: {
      partId: "head",
      label: "Head",
      dataUrl: pngDataUrl
    }
  });
  assert.equal(partResult.id, "head");
  assert.equal(partResult.label, "Head");
  assert.equal(partResult.path, `res://assets/characters/${characterId}/live2d_parts/head.png`);
  assert.equal(partResult.bytes > 0, true);

  const saveResult = await requestJson(baseUrl, `/api/characters/${characterId}/live2d-portrait`, {
    method: "POST",
    body: buildSavePayload()
  });

  assert.equal(saveResult.imagePath, `res://assets/characters/${characterId}/${state}.png`);
  assert.equal(saveResult.modelPath, `res://assets/characters/${characterId}/${state}.live2d-web.json`);
  assert.equal(saveResult.portrait.live2d_motion_frame.clip_id, "adaptive_pose");
  assert.equal(saveResult.portrait.live2d_motion_frame.frame_count, 7);
  assert.deepEqual(saveResult.portrait.live2d_motion_frame.pose_tags, ["surprised", "talk"]);
  assert.equal(saveResult.portrait.live2d_expression_preset.id, "happy");
  assert.deepEqual(saveResult.portrait.live2d_expression_preset.pose_tags, ["happy", "smile"]);
  assert.equal(saveResult.importStatus.skipped, true);

  const loaded = await requestJson(baseUrl, `/api/characters/${characterId}`);
  const character = loaded.data;
  const portrait = character.portraits[state];
  assert.equal(portrait.path, `res://assets/characters/${characterId}/${state}.png`);
  assert.equal(portrait.live2d_model, `res://assets/characters/${characterId}/${state}.live2d-web.json`);
  assert.equal(portrait.live2d_motion_frame.clip_id, "adaptive_pose");
  assert.equal(portrait.live2d_expression_preset.id, "happy");
  assert.equal(portrait.live2d_expression_preset.parameter_values.mouthOpen, 24);

  const live2d = character.metadata.live2d_web_model;
  assert.equal(live2d.app, "tools/live2d-editor");
  assert.equal(live2d.source_portrait_state, state);
  assert.equal(live2d.adaptive_clip_id, "adaptive_pose");
  assert.equal(live2d.motion_clip_count, 4);
  assert.equal(live2d.expression_preset_count, 2);
  assert.equal(live2d.auto_expression_preset_count, 1);
  assert.deepEqual(live2d.expression_presets.map((preset) => preset.id), ["happy", "custom_pose"]);
  assert.equal(live2d.expression_presets[0].auto_generated, true);
  assert.deepEqual(live2d.expression_presets[0].pose_tags, ["happy", "smile"]);
  assert.deepEqual(live2d.clips.map((clip) => clip.id), ["adaptive_pose", "idle_loop", "talk_loop", "viseme_set"]);
  assert.equal(live2d.dialogue_motion_set.ready, false);
  assert.equal(live2d.dialogue_motion_set.adaptive_clip_id, "adaptive_pose");
  assert.equal(live2d.dialogue_motion_set.idle_clip_id, "idle_loop");
  assert.equal(live2d.dialogue_motion_set.talk_clip_id, "talk_loop");
  assert.equal(live2d.dialogue_motion_set.viseme_clip_id, "viseme_set");
  assert.deepEqual(live2d.dialogue_motion_set.clip_ids, ["adaptive_pose", "idle_loop", "talk_loop", "viseme_set"]);
  assert.deepEqual(live2d.dialogue_motion_set.exported_clip_ids, ["adaptive_pose"]);
  assert.deepEqual(live2d.dialogue_motion_set.complete_exported_clip_ids, []);
  assert.deepEqual(live2d.dialogue_motion_set.incomplete_clip_ids, ["adaptive_pose"]);
  assert.equal(live2d.dialogue_motion_set.has_exported_adaptive_pose, true);
  assert.equal(live2d.dialogue_motion_set.has_exported_idle_loop, false);
  assert.equal(live2d.dialogue_motion_set.has_complete_adaptive_pose, false);
  assert.equal(live2d.runtime_readiness.ready, false);
  assert.equal(live2d.runtime_readiness.adaptive_pose_ready, false);
  assert.equal(live2d.runtime_readiness.dialogue_motion_ready, false);
  assert.equal(live2d.runtime_readiness.interaction_ready, true);
  assert.equal(live2d.runtime_readiness.exported_frame_count, 1);
  assert.equal(live2d.runtime_readiness.expected_frame_count, 7);
  assert.equal(live2d.runtime_readiness.parameter_binding_count > 0, true);
  assert.deepEqual(live2d.runtime_readiness.missing, ["adaptive_pose_frames"]);
  assert.deepEqual(live2d.runtime_readiness.missing_dialogue_motion, ["idle_loop_frames", "talk_loop_frames", "viseme_set_frames"]);
  assert.deepEqual(live2d.runtime_readiness.incomplete_motion_frame_sets, [
    { clip_id: "adaptive_pose", frame_count: 1, expected_frame_count: 7 }
  ]);
  assert.equal(live2d.motion_frame_set_count, 1);
  assert.equal(live2d.hit_area_count, 1);
  assert.equal(live2d.parameter_bindings.some((entry) => entry.parameter === "mouthOpen" && entry.channels.includes("opacity")), true);
  assert.equal(live2d.parameter_roles.some((entry) => entry.parameter === "mouthOpen" && entry.role === "mouth_open"), true);
  assert.deepEqual(live2d.adaptive_pose_tuning.disabled_parameters, ["hairSway"]);
  assert.equal(live2d.portraits[state].motion_frame.clip_id, "adaptive_pose");
  assert.equal(live2d.portraits[state].expression_preset.id, "happy");
  assert.equal(live2d.portraits[state].expression_preset.pose_score.happy, 1);
  assert.equal(live2d.hit_areas[0].id, "head");
  assert.equal(live2d.hit_areas[0].normalized_bounds.width, 0.3);

  const frameSet = live2d.motion_frame_sets.find((entry) => entry.clip_id === "adaptive_pose");
  assert.ok(frameSet, "adaptive_pose frame set should be exported");
  assert.equal(frameSet.frame_count, 1);
  assert.equal(frameSet.expected_frame_count, 7);
  assert.equal(frameSet.states[0].state, state);
  assert.equal(frameSet.states[0].parameter_values.mouthOpen, 0.65);
  assert.equal(frameSet.states[0].pose_score.surprised, 0.95);
  assert.equal(frameSet.states[0].expression_preset.id, "happy");

  const savedModel = JSON.parse(await fs.readFile(path.join(characterAssetDir, `${state}.live2d-web.json`), "utf8"));
  assert.equal(savedModel.target_character_id, characterId);
  assert.equal(savedModel.target_portrait_state, state);
  assert.equal(savedModel.exported_portrait_path, `res://assets/characters/${characterId}/${state}.png`);
  await fs.stat(path.join(characterAssetDir, `${state}.png`));

  const servedModel = await requestJson(baseUrl, `/repo/assets/characters/${characterId}/${state}.live2d-web.json`);
  assert.equal(servedModel.target_character_id, characterId);
  assert.equal(servedModel.target_portrait_state, state);
  assert.equal(servedModel.exported_portrait_path, `res://assets/characters/${characterId}/${state}.png`);

  await writeCamelCaseLive2dCharacter();
  const listedCharacters = await requestJson(baseUrl, "/api/characters");
  const listedCamelCharacter = listedCharacters.characters.find((entry) => entry.id === camelCharacterId);
  assert.equal(listedCamelCharacter?.hasWebRig, true);
  const camelSaveResult = await requestJson(baseUrl, `/api/characters/${camelCharacterId}/live2d-portrait`, {
    method: "POST",
    body: buildSavePayload({
      state: "camel_new",
      clipId: "camel_new_clip",
      clipLabel: "Camel New Clip",
      frameIndex: 0,
      frameCount: 1,
      clipDuration: 0.8,
      poseTags: ["curious"],
      poseScore: { curious: 1 },
      parameterValues: { angleX: 0.2, mouthOpen: 0.1, smile: 0.2 }
    })
  });
  const camelLive2d = camelSaveResult.data.metadata.live2d_web_model;
  assert.equal(camelSaveResult.data.metadata.live2dWebModel, undefined);
  assert.equal(camelLive2d.portraits.legacy_pose.motion_frame.clip_id, "legacy_clip");
  assert.equal(camelLive2d.portraits.frame_set_only.image_path, `res://assets/characters/${camelCharacterId}/frame_set_only.png`);
  assert.equal(camelLive2d.portraits.frame_set_only.motion_frame.clip_id, "frame_set_clip");
  assert.equal(camelLive2d.portraits.camel_new.motion_frame.clip_id, "camel_new_clip");
  assert.equal(camelLive2d.motion_frame_sets.some((entry) => entry.clip_id === "legacy_clip"), true);
  const frameSetOnly = camelLive2d.motion_frame_sets.find((entry) => entry.clip_id === "frame_set_clip");
  assert.equal(frameSetOnly?.states[0]?.state, "frame_set_only");
  assert.equal(frameSetOnly?.states[0]?.model_path, `res://assets/characters/${camelCharacterId}/frame_set_only.live2d-web.json`);
  assert.equal(camelLive2d.motion_frame_sets.some((entry) => entry.clip_id === "camel_new_clip"), true);

  const dialogueReadyCharacter = await saveDialogueReadyFrames(baseUrl);
  const dialogueReadyLive2d = dialogueReadyCharacter.metadata.live2d_web_model;
  assert.deepEqual(dialogueReadyLive2d.dialogue_motion_set.exported_clip_ids, ["adaptive_pose", "idle_loop", "talk_loop", "viseme_set"]);
  assert.equal(dialogueReadyLive2d.dialogue_motion_set.ready, true);
  assert.deepEqual(dialogueReadyLive2d.dialogue_motion_set.complete_exported_clip_ids, ["adaptive_pose", "idle_loop", "talk_loop", "viseme_set"]);
  assert.deepEqual(dialogueReadyLive2d.dialogue_motion_set.incomplete_clip_ids, []);
  assert.equal(dialogueReadyLive2d.dialogue_motion_set.has_complete_adaptive_pose, true);
  assert.equal(dialogueReadyLive2d.dialogue_motion_set.has_complete_idle_loop, true);
  assert.equal(dialogueReadyLive2d.dialogue_motion_set.has_complete_talk_loop, true);
  assert.equal(dialogueReadyLive2d.dialogue_motion_set.has_complete_viseme_set, true);
  assert.equal(dialogueReadyLive2d.runtime_readiness.ready, true);
  assert.equal(dialogueReadyLive2d.runtime_readiness.adaptive_pose_ready, true);
  assert.equal(dialogueReadyLive2d.runtime_readiness.dialogue_motion_ready, true);
  assert.equal(dialogueReadyLive2d.runtime_readiness.complete_motion_frame_set_count, 4);
  assert.equal(dialogueReadyLive2d.runtime_readiness.exported_frame_count, 27);
  assert.equal(dialogueReadyLive2d.runtime_readiness.expected_frame_count, 27);
  assert.deepEqual(dialogueReadyLive2d.runtime_readiness.missing, []);
  assert.deepEqual(dialogueReadyLive2d.runtime_readiness.missing_dialogue_motion, []);
  assert.deepEqual(dialogueReadyLive2d.runtime_readiness.incomplete_motion_frame_sets, []);
  assert.equal(dialogueReadyLive2d.motion_frame_set_count, 4);
  const dialogueFrameSets = new Map(dialogueReadyLive2d.motion_frame_sets.map((entry) => [entry.clip_id, entry]));
  assert.equal(dialogueFrameSets.get("adaptive_pose").frame_count, 7);
  assert.equal(dialogueFrameSets.get("idle_loop").frame_count, 6);
  assert.equal(dialogueFrameSets.get("talk_loop").frame_count, 8);
  assert.equal(dialogueFrameSets.get("viseme_set").frame_count, 6);
  assert.equal(dialogueReadyLive2d.portrait_count, 27);
  await fs.stat(path.join(characterAssetDir, "talk_loop_f07.png"));
  await fs.stat(path.join(characterAssetDir, "viseme_set_f05.live2d-web.json"));

  console.log("Live2D editor smoke test passed.");
} finally {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill("SIGTERM");
    await new Promise((resolve) => serverProcess.once("close", resolve));
  }
  await cleanupSmokeFiles();
}

async function saveDialogueReadyFrames(baseUrl) {
  const frameSpecs = [
    ...motionFrameSpecsForClip({
      clipId: "adaptive_pose",
      clipLabel: "Adaptive Pose",
      duration: 1.4,
      frameCount: 7,
      tagsByIndex: [
        ["neutral"],
        ["surprised", "talk"],
        ["happy", "smile"],
        ["blink", "neutral"],
        ["curious"],
        ["serious"],
        ["calm"]
      ]
    }),
    ...motionFrameSpecsForClip({
      clipId: "idle_loop",
      clipLabel: "Idle Loop",
      duration: 3.2,
      frameCount: 6,
      tagsByIndex: [["idle", "calm"], ["idle"], ["breath"], ["idle", "blink"], ["idle"], ["idle", "calm"]]
    }),
    ...motionFrameSpecsForClip({
      clipId: "talk_loop",
      clipLabel: "Talk Loop",
      duration: 1.6,
      frameCount: 8,
      tagsByIndex: [["talk"], ["talk", "open_mouth"], ["talk"], ["talk", "smile"], ["talk"], ["talk", "open_mouth"], ["talk"], ["talk"]]
    }),
    ...motionFrameSpecsForClip({
      clipId: "viseme_set",
      clipLabel: "Viseme Set",
      duration: 1.2,
      frameCount: 6,
      tagsByIndex: [["viseme", "viseme_closed"], ["viseme", "viseme_a"], ["viseme", "viseme_i"], ["viseme", "viseme_o"], ["viseme", "viseme_u"], ["viseme", "viseme_closed"]]
    })
  ].filter((spec) => spec.state !== state);

  const result = await requestJson(baseUrl, `/api/characters/${characterId}/live2d-portrait-batch`, {
    method: "POST",
    body: {
      frames: frameSpecs.map((spec) => buildSavePayload(spec))
    }
  });
  assert.equal(result.count, frameSpecs.length);
  assert.equal(result.frames.length, frameSpecs.length);
  assert.equal(result.importStatus.skipped, true);
  assert.equal(result.frames.some((entry) => entry.state === "talk_loop_f07"), true);
  return result.data;
}

async function writeCamelCaseLive2dCharacter() {
  const character = {
    id: camelCharacterId,
    display_name: "Camel Smoke Rig",
    metadata: {
      live2dWebModel: {
        app: "tools/live2d-editor",
        sourceModelPath: `res://assets/characters/${camelCharacterId}/legacy_pose.live2d-web.json`,
        portraits: {
          legacy_pose: {
            imagePath: `res://assets/characters/${camelCharacterId}/legacy_pose.png`,
            modelPath: `res://assets/characters/${camelCharacterId}/legacy_pose.live2d-web.json`,
            motionFrame: {
              clipId: "legacy_clip",
              clipLabel: "Legacy Clip",
              time: 0,
              frameIndex: 0,
              frameCount: 1,
              clipDuration: 0.8,
              poseTags: ["legacy"],
              poseScore: { legacy: 1 },
              parameterValues: { angleX: 0.1 }
            }
          }
        },
        motionFrameSets: [
          {
            clipId: "frame_set_clip",
            clipLabel: "Frame Set Clip",
            frameCount: 1,
            expectedFrameCount: 1,
            clipDuration: 0.8,
            physicsSampled: true,
            states: [
              {
                state: "frame_set_only",
                time: 0,
                frameIndex: 0,
                imagePath: `res://assets/characters/${camelCharacterId}/frame_set_only.png`,
                modelPath: `res://assets/characters/${camelCharacterId}/frame_set_only.live2d-web.json`,
                center: [0.48, 0.2],
                poseTags: ["frame_set"],
                poseScore: { frame_set: 1 },
                parameterValues: { angleX: -0.2 },
                expressionPreset: {
                  id: "frame_set_expr",
                  label: "Frame Set Expr",
                  parameterValues: { angleX: -0.2 }
                }
              }
            ]
          }
        ]
      }
    }
  };
  await fs.mkdir(path.dirname(camelCharacterFile), { recursive: true });
  await fs.writeFile(camelCharacterFile, `${JSON.stringify(character, null, 2)}\n`, "utf8");
}

function motionFrameSpecsForClip({ clipId, clipLabel, duration, frameCount, tagsByIndex }) {
  return Array.from({ length: frameCount }, (_, index) => {
    const poseTags = tagsByIndex[index] || [clipId];
    return {
      state: `${clipId}_f${String(index).padStart(2, "0")}`,
      clipId,
      clipLabel,
      time: frameCount <= 1 ? 0 : Number(((duration * index) / (frameCount - 1)).toFixed(3)),
      frameIndex: index,
      frameCount,
      clipDuration: duration,
      poseTags,
      poseScore: poseScoreFromTags(poseTags),
      parameterValues: {
        mouthOpen: Number((index / Math.max(1, frameCount - 1)).toFixed(3)),
        smile: Number(((frameCount - index) / Math.max(1, frameCount)).toFixed(3)),
        angleX: Number(((index % 3) * 0.1 - 0.1).toFixed(3))
      }
    };
  });
}

function poseScoreFromTags(tags) {
  return Object.fromEntries(tags.map((tag, index) => [tag, Number(Math.max(0.2, 1 - index * 0.15).toFixed(2))]));
}

function buildSavePayload(overrides = {}) {
  const payload = {
    state: overrides.state || state,
    imageDataUrl: pngDataUrl,
    center: [0.51, 0.22],
    profile: {
      zoom: 3.5,
      offset: [0.04, 0.02]
    },
    model: {
      version: 1,
      character: {
        displayName: "Smoke Rig Saved",
        nameColor: "#123456"
      },
      params: {
        angleX: 0,
        mouthOpen: 0,
        smile: 0,
        hairSway: 0
      },
      adaptivePose: {
        intensity: 1.35,
        disabledParameters: ["hairSway"]
      },
      imageParts: [
        {
          id: "head",
          label: "Head",
          path: `res://assets/characters/${characterId}/live2d_parts/head.png`,
          bindX: "angleX",
          bindOpacity: "mouthOpen",
          visibilityGate: {
            enabled: true,
            parameter: "smile",
            min: 0.2,
            max: 1,
            fade: 0.1
          },
          hitArea: {
            enabled: true,
            id: "head",
            label: "Head",
            kind: "face",
            bounds: { x: 10, y: 20, width: 100, height: 120 },
            normalizedBounds: { x: 0.2, y: 0.1, width: 0.3, height: 0.4 },
            normalizedPoints: [
              [0.2, 0.1],
              [0.5, 0.1],
              [0.5, 0.5],
              [0.2, 0.5]
            ]
          },
          mesh: {
            enabled: true,
            deformers: [
              {
                parameter: "angleX",
                keyframes: [
                  { value: -1, vertices: [{ x: -2, y: 0 }] },
                  { value: 1, vertices: [{ x: 2, y: 0 }] }
                ]
              }
            ]
          }
        }
      ],
      deformerGroups: [
        {
          id: "head_group",
          label: "Head Group",
          parameter: "angleX",
          partIds: ["head"],
          keyframes: [
            { value: -1, transform: { x: -6, y: 0, rotation: -4 } },
            { value: 1, transform: { x: 6, y: 0, rotation: 4 } }
          ],
          warp: {
            enabled: true,
            keyframes: [
              { value: -1, vertices: [{ x: -3, y: 0 }] },
              { value: 1, vertices: [{ x: 3, y: 0 }] }
            ]
          }
        }
      ],
      physics: {
        rules: [
          { target: "hairSway", amplitude: 0.2, frequency: 1.2, phase: 0 }
        ]
      },
      expressionPresets: [
        {
          id: "happy",
          label: "Happy",
          params: {
            mouthOpen: 24,
            smile: 72,
            brow: 18
          },
          autoGenerated: true,
          autoExpressionKind: "happy",
          poseTags: ["happy", "smile"]
        },
        {
          id: "custom_pose",
          label: "Custom Pose",
          params: {
            angleX: -12,
            smile: -24
          }
        }
      ],
      motionClips: [
        {
          id: "adaptive_pose",
          label: "Adaptive Pose",
          duration: 1.4,
          exportFrames: 7,
          keyframes: [
            { time: 0, params: { mouthOpen: 0.1, smile: 0.2, angleX: 0 } },
            { time: 0.6, params: { mouthOpen: 0.65, smile: 0.85, angleX: -0.2 } }
          ]
        },
        {
          id: "idle_loop",
          label: "Idle Loop",
          duration: 3.2,
          exportFrames: 6,
          keyframes: [
            { time: 0, params: { mouthOpen: 0, smile: 0, hairSway: 0 } },
            { time: 1.6, params: { mouthOpen: 0.05, smile: 0.1, hairSway: 0.3 } }
          ]
        },
        {
          id: "talk_loop",
          label: "Talk Loop",
          duration: 1.6,
          exportFrames: 8,
          keyframes: [
            { time: 0, params: { mouthOpen: 0.1, smile: 0.2 } },
            { time: 0.5, params: { mouthOpen: 0.7, smile: 0.35 } }
          ]
        },
        {
          id: "viseme_set",
          label: "Viseme Set",
          duration: 1.2,
          exportFrames: 6,
          keyframes: [
            { time: 0, params: { mouthOpen: 0, smile: 0 } },
            { time: 0.6, params: { mouthOpen: 0.58, smile: -0.2 } }
          ]
        }
      ],
      metadata: {
        motionFrame: {
          clipId: overrides.clipId || "adaptive_pose",
          clipLabel: overrides.clipLabel || "Adaptive Pose",
          time: Number(overrides.time ?? 0.6),
          frameIndex: Number(overrides.frameIndex ?? 1),
          frameCount: Number(overrides.frameCount ?? 7),
          clipDuration: Number(overrides.clipDuration ?? 1.4),
          physicsSampled: true,
          poseTags: overrides.poseTags || ["surprised", "talk"],
          poseScore: overrides.poseScore || {
            surprised: 0.95,
            talk: 0.75
          },
          parameterValues: overrides.parameterValues || {
            mouthOpen: 0.65,
            smile: 0.85,
            angleX: -0.2
          }
        },
        expressionPreset: {
          id: "happy",
          label: "Happy",
          autoGenerated: true,
          autoExpressionKind: "happy",
          poseTags: ["happy", "smile"],
          poseScore: {
            happy: 1,
            smile: 1
          },
          parameterValues: {
            mouthOpen: 24,
            smile: 72
          }
        }
      }
    }
  };
  payload.model.params = {
    ...payload.model.params,
    ...payload.model.metadata.motionFrame.parameterValues
  };
  return payload;
}

async function requestJson(baseUrl, pathname, { method = "GET", body } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`${method} ${pathname} failed with ${response.status}: ${JSON.stringify(data)}\n${serverOutput}`);
  }
  return data;
}

async function waitForHealth(baseUrl) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 5000) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`Live2D editor server exited before health check passed.\n${serverOutput}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  throw new Error(`Timed out waiting for Live2D editor health check.\n${serverOutput}`);
}

async function getOpenPort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

async function cleanupSmokeFiles() {
  await Promise.all([
    fs.rm(characterFile, { force: true }),
    fs.rm(camelCharacterFile, { force: true }),
    fs.rm(characterAssetDir, { force: true, recursive: true }),
    fs.rm(camelCharacterAssetDir, { force: true, recursive: true })
  ]);
}

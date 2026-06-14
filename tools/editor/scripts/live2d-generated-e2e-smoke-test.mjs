import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = path.dirname(fileURLToPath(import.meta.url));
const editorRoot = path.resolve(scriptRoot, "..");
const repoRoot = path.resolve(editorRoot, "..", "..");
const characterId = `live2d_e2e_${process.pid}_${Date.now()}`;
const state = "surprised_pose";
const pngDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
const characterFile = path.join(repoRoot, "data", "characters", `${characterId}.json`);
const characterAssetDir = path.join(repoRoot, "assets", "characters", characterId);

const managedProcesses = [];

try {
  await cleanupSmokeFiles();

  const live2dPort = await getOpenPort();
  const live2dUrl = `http://127.0.0.1:${live2dPort}`;
  const editorPort = await getOpenPort();
  const editorServer = startServer({
    command: process.execPath,
    args: ["server/server.mjs"],
    cwd: editorRoot,
    env: {
      HOST: "127.0.0.1",
      PORT: String(editorPort),
      GODOT_PREVIEW_AUTO_START: "0",
      GODOT_PREVIEW_AUTO_BUILD: "0",
      LIVE2D_EDITOR_ENDPOINT: live2dUrl,
      LIVE2D_EDITOR_AUTO_START: "1",
      LIVE2D_GODOT_IMPORT_AUTO: "0"
    },
    label: "main-editor"
  });
  const editorUrl = `http://127.0.0.1:${editorPort}`;
  const health = await waitForHealth(editorServer, `${editorUrl}/api/health`);
  assert.equal(health.live2dEditorUrl, live2dUrl);
  assert.equal(health.live2dEditorAutoStart, true);
  assert.ok(
    ["started", "already-running"].includes(health.live2dEditorAutoStartStatus),
    `Expected Live2D auto-start, got ${health.live2dEditorAutoStartStatus}`
  );
  await waitForHealth(editorServer, `${live2dUrl}/api/health`);

  await requestJson(editorServer, live2dUrl, "/api/characters", {
    method: "POST",
    body: {
      id: characterId,
      display_name: "E2E Live2D",
      name_color: "#cc8844"
    }
  });

  const saveResult = await requestJson(editorServer, live2dUrl, `/api/characters/${characterId}/live2d-portrait`, {
    method: "POST",
    body: buildLive2dSavePayload()
  });
  assert.equal(saveResult.imagePath, `res://assets/characters/${characterId}/${state}.png`);
  assert.equal(saveResult.modelPath, `res://assets/characters/${characterId}/${state}.live2d-web.json`);
  assert.equal(saveResult.portrait.generated_by, "tools/live2d-editor");
  assert.equal(saveResult.portrait.live2d_motion_frame.clip_id, "adaptive_pose");

  const loaded = await requestJson(editorServer, editorUrl, `/api/resources/characters/${characterId}`);
  assert.equal(loaded.id, characterId);
  assert.equal(loaded.data.portraits[state].path, `res://assets/characters/${characterId}/${state}.png`);
  assert.equal(loaded.data.portraits[state].live2d_model, `res://assets/characters/${characterId}/${state}.live2d-web.json`);
  assert.equal(loaded.data.portraits[state].live2d_motion_frame.parameter_values.mouthOpen, 0.72);
  assert.equal(loaded.data.metadata.live2d_web_model.app, "tools/live2d-editor");
  assert.equal(loaded.data.metadata.live2d_web_model.source_portrait_state, state);
  assert.equal(loaded.data.metadata.live2d_web_model.motion_frame_sets[0].states[0].state, state);
  assert.equal(loaded.data.metadata.live2d_web_model.hit_areas[0].id, "face");
  assert.equal(loaded.data.metadata.live2d_web_model.parameter_bindings.some((entry) => entry.parameter === "mouthOpen"), true);
  assert.equal(loaded.data.metadata.live2d_web_model.expression_presets[0].pose_score.surprised, 1);
  assert.equal(loaded.data.metadata.live2d_web_model.expression_presets[0].parameter_values.mouthOpen, 0.72);
  assert.equal(loaded.data.metadata.live2d_web_model.runtime_readiness.ready, false);
  assert.equal(loaded.data.metadata.live2d_web_model.runtime_readiness.adaptive_pose_ready, false);
  assert.equal(loaded.data.metadata.live2d_web_model.runtime_readiness.dialogue_motion_ready, false);
  assert.equal(loaded.data.metadata.live2d_web_model.runtime_readiness.parameter_role_count, 3);
  assert.equal(loaded.data.metadata.live2d_web_model.runtime_readiness.semantic_parameter_count, 3);
  assert.equal(loaded.data.metadata.live2d_web_model.runtime_readiness.exported_frame_count, 1);
  assert.equal(loaded.data.metadata.live2d_web_model.runtime_readiness.expected_frame_count, 5);
  assert.deepEqual(loaded.data.metadata.live2d_web_model.runtime_readiness.missing, ["adaptive_pose_frames"]);
  assert.deepEqual(loaded.data.metadata.live2d_web_model.runtime_readiness.missing_dialogue_motion, ["idle_loop_frames", "talk_loop_frames"]);
  assert.deepEqual(loaded.data.metadata.live2d_web_model.runtime_readiness.incomplete_motion_frame_sets, [
    { clip_id: "adaptive_pose", frame_count: 1, expected_frame_count: 5 }
  ]);

  const listed = await requestJson(editorServer, editorUrl, "/api/resources/characters");
  const listedCharacter = listed.resources.find((entry) => entry.id === characterId);
  assert.ok(listedCharacter, "Live2D-generated character should be visible to the main editor");
  assert.equal(listedCharacter.subtitle, "1 portraits");
  assert.deepEqual(listedCharacter.validation.portraitKeys, [state]);
  assert.deepEqual(listedCharacter.validation.live2dMotionClipIds, ["adaptive_pose"]);
  assert.deepEqual(listedCharacter.validation.live2dPoseTags, ["open_mouth", "surprised", "talk"]);

  const batchFrames = buildDialogueReadyBatchFrames();
  const batchResult = await requestJson(editorServer, live2dUrl, `/api/characters/${characterId}/live2d-portrait-batch`, {
    method: "POST",
    body: { frames: batchFrames }
  });
  assert.equal(batchResult.count, 16);
  assert.equal(batchResult.importStatus.skipped, true);
  assert.equal(batchResult.frames.some((entry) => entry.state === "talk_loop_f03"), true);

  const loadedReady = await requestJson(editorServer, editorUrl, `/api/resources/characters/${characterId}`);
  const readyLive2d = loadedReady.data.metadata.live2d_web_model;
  assert.equal(Object.keys(loadedReady.data.portraits).length, 17);
  assert.equal(loadedReady.data.portraits[state].live2d_motion_frame.clip_id, "adaptive_pose");
  assert.deepEqual(readyLive2d.dialogue_motion_set.exported_clip_ids, ["adaptive_pose", "idle_loop", "talk_loop", "viseme_set"]);
  assert.deepEqual(readyLive2d.dialogue_motion_set.complete_exported_clip_ids, ["adaptive_pose", "idle_loop", "talk_loop", "viseme_set"]);
  assert.deepEqual(readyLive2d.dialogue_motion_set.incomplete_clip_ids, []);
  assert.equal(readyLive2d.runtime_readiness.ready, true);
  assert.equal(readyLive2d.runtime_readiness.adaptive_pose_ready, true);
  assert.equal(readyLive2d.runtime_readiness.dialogue_motion_ready, true);
  assert.equal(readyLive2d.runtime_readiness.parameter_role_count, 3);
  assert.equal(readyLive2d.runtime_readiness.semantic_parameter_count, 3);
  assert.equal(readyLive2d.runtime_readiness.exported_frame_count, 17);
  assert.equal(readyLive2d.runtime_readiness.expected_frame_count, 17);
  assert.deepEqual(readyLive2d.runtime_readiness.missing, []);
  assert.deepEqual(readyLive2d.runtime_readiness.missing_dialogue_motion, []);
  assert.deepEqual(readyLive2d.runtime_readiness.incomplete_motion_frame_sets, []);
  const readyFrameSets = new Map(readyLive2d.motion_frame_sets.map((entry) => [entry.clip_id, entry]));
  assert.equal(readyFrameSets.get("adaptive_pose").frame_count, 5);
  assert.equal(readyFrameSets.get("idle_loop").frame_count, 4);
  assert.equal(readyFrameSets.get("talk_loop").frame_count, 4);
  assert.equal(readyFrameSets.get("viseme_set").frame_count, 4);

  const listedReady = await requestJson(editorServer, editorUrl, "/api/resources/characters");
  const listedReadyCharacter = listedReady.resources.find((entry) => entry.id === characterId);
  assert.ok(listedReadyCharacter, "Batch-exported Live2D character should still be visible");
  assert.equal(listedReadyCharacter.subtitle, "17 portraits");
  assert.deepEqual(listedReadyCharacter.validation.live2dMotionClipIds, ["adaptive_pose", "idle_loop", "talk_loop", "viseme_set"]);
  assert.equal(listedReadyCharacter.validation.live2dDialogueMotion.ready, true);
  assert.deepEqual(listedReadyCharacter.validation.live2dDialogueMotion.missingExportedClipIds, []);
  assert.equal(listedReadyCharacter.validation.live2dDialogueMotion.exportedFrameCount, 17);
  assert.equal(listedReadyCharacter.validation.live2dDialogueMotion.expectedFrameCount, 17);
  assert.equal(listedReadyCharacter.validation.live2dPoseTags.includes("viseme_o"), true);

  await fs.stat(path.join(characterAssetDir, `${state}.png`));
  await fs.stat(path.join(characterAssetDir, `${state}.live2d-web.json`));
  await fs.stat(path.join(characterAssetDir, "talk_loop_f03.png"));
  await fs.stat(path.join(characterAssetDir, "viseme_set_f03.live2d-web.json"));

  console.log("Live2D generated portrait e2e smoke test passed.");
} finally {
  await stopManagedProcesses();
  await cleanupSmokeFiles();
}

function buildLive2dSavePayload() {
  return {
    state,
    imageDataUrl: pngDataUrl,
    center: [0.52, 0.2],
    profile: {
      zoom: 3.2,
      offset: [0.01, -0.02]
    },
    model: {
      version: 1,
      character: {
        displayName: "E2E Live2D Saved",
        nameColor: "#cc8844"
      },
      params: {
        angleX: 0,
        mouthOpen: 0,
        smile: 0
      },
      imageParts: [
        {
          id: "face",
          label: "Face",
          path: `res://assets/characters/${characterId}/live2d_parts/face.png`,
          bindX: "angleX",
          bindOpacity: "mouthOpen",
          hitArea: {
            enabled: true,
            id: "face",
            label: "Face",
            kind: "face",
            normalizedBounds: {
              x: 0.2,
              y: 0.12,
              width: 0.32,
              height: 0.42
            }
          }
        }
      ],
      motionClips: [
        {
          id: "adaptive_pose",
          label: "Adaptive Pose",
          duration: 1.3,
          exportFrames: 5,
          keyframes: [
            { time: 0, params: { mouthOpen: 0.1, smile: 0.1, angleX: 0 } },
            { time: 0.5, params: { mouthOpen: 0.72, smile: 0.65, angleX: -0.12 } }
          ]
        }
      ],
      expressionPresets: [
        {
          id: "surprised_preset",
          label: "Surprised Preset",
          params: {
            mouthOpen: 0.72,
            smile: 0.65,
            angleX: -0.12
          },
          poseTags: ["surprised", "open_mouth"],
          poseScore: {
            surprised: 0.92,
            open_mouth: 0.86
          }
        }
      ],
      metadata: {
        motionFrame: {
          clipId: "adaptive_pose",
          clipLabel: "Adaptive Pose",
          time: 0.5,
          frameIndex: 2,
          frameCount: 5,
          clipDuration: 1.3,
          poseTags: ["surprised", "talk", "open_mouth"],
          poseScore: {
            surprised: 0.94,
            talk: 0.7,
            open_mouth: 0.85
          },
          parameterValues: {
            mouthOpen: 0.72,
            smile: 0.65,
            angleX: -0.12
          }
        }
      }
    }
  };
}

function buildDialogueReadyBatchFrames() {
  return [
    ...motionFrameSpecsForClip({
      clipId: "adaptive_pose",
      clipLabel: "Adaptive Pose",
      duration: 1.3,
      frameCount: 5,
      tagsByIndex: [
        ["neutral", "closed_mouth"],
        ["curious"],
        ["surprised", "talk", "open_mouth"],
        ["happy", "smile"],
        ["calm"]
      ]
    }).filter((spec) => spec.frameIndex !== 2),
    ...motionFrameSpecsForClip({
      clipId: "idle_loop",
      clipLabel: "Idle Loop",
      duration: 2,
      frameCount: 4,
      tagsByIndex: [["idle", "calm"], ["idle", "breath"], ["idle", "blink"], ["idle", "calm"]]
    }),
    ...motionFrameSpecsForClip({
      clipId: "talk_loop",
      clipLabel: "Talk Loop",
      duration: 1.2,
      frameCount: 4,
      tagsByIndex: [["talk"], ["talk", "open_mouth"], ["talk", "smile"], ["talk", "open_mouth"]]
    }),
    ...motionFrameSpecsForClip({
      clipId: "viseme_set",
      clipLabel: "Viseme Set",
      duration: 1,
      frameCount: 4,
      tagsByIndex: [["viseme", "viseme_closed"], ["viseme", "viseme_a"], ["viseme", "viseme_o"], ["viseme", "viseme_u"]]
    })
  ].map(buildLive2dBatchFramePayload);
}

function buildLive2dBatchFramePayload(spec) {
  const payload = buildLive2dSavePayload();
  payload.state = spec.state;
  payload.model.params = {
    ...payload.model.params,
    ...spec.parameterValues
  };
  payload.model.motionClips = dialogueReadyMotionClips();
  payload.model.metadata.motionFrame = {
    clipId: spec.clipId,
    clipLabel: spec.clipLabel,
    time: spec.time,
    frameIndex: spec.frameIndex,
    frameCount: spec.frameCount,
    clipDuration: spec.clipDuration,
    poseTags: spec.poseTags,
    poseScore: spec.poseScore,
    parameterValues: spec.parameterValues
  };
  return payload;
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
        angleX: Number(((index % 3) * 0.12 - 0.12).toFixed(3))
      }
    };
  });
}

function poseScoreFromTags(tags) {
  return Object.fromEntries(tags.map((tag, index) => [tag, Number(Math.max(0.2, 1 - index * 0.15).toFixed(2))]));
}

function dialogueReadyMotionClips() {
  return [
    {
      id: "adaptive_pose",
      label: "Adaptive Pose",
      duration: 1.3,
      exportFrames: 5,
      keyframes: [
        { time: 0, params: { mouthOpen: 0.1, smile: 0.1, angleX: 0 } },
        { time: 0.5, params: { mouthOpen: 0.72, smile: 0.65, angleX: -0.12 } }
      ]
    },
    {
      id: "idle_loop",
      label: "Idle Loop",
      duration: 2,
      exportFrames: 4,
      keyframes: [
        { time: 0, params: { mouthOpen: 0, smile: 0.1, angleX: 0 } },
        { time: 1, params: { mouthOpen: 0.05, smile: 0.18, angleX: 0.05 } }
      ]
    },
    {
      id: "talk_loop",
      label: "Talk Loop",
      duration: 1.2,
      exportFrames: 4,
      keyframes: [
        { time: 0, params: { mouthOpen: 0.1, smile: 0.15, angleX: 0 } },
        { time: 0.6, params: { mouthOpen: 0.82, smile: 0.36, angleX: -0.08 } }
      ]
    },
    {
      id: "viseme_set",
      label: "Viseme Set",
      duration: 1,
      exportFrames: 4,
      keyframes: [
        { time: 0, params: { mouthOpen: 0, smile: 0 } },
        { time: 0.5, params: { mouthOpen: 0.9, smile: -0.25 } }
      ]
    }
  ];
}

function startServer({ command, args, cwd, env, label }) {
  const child = spawn(command, args, {
    cwd,
    env: {
      ...process.env,
      ...env
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  const managed = {
    child,
    label,
    output: ""
  };
  managedProcesses.push(managed);
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    managed.output += chunk;
  });
  child.stderr.on("data", (chunk) => {
    managed.output += chunk;
  });
  return managed;
}

async function stopManagedProcesses() {
  await Promise.all(managedProcesses.splice(0).map(async (managed) => {
    if (managed.child.killed || managed.child.exitCode !== null) return;
    managed.child.kill("SIGTERM");
    await new Promise((resolve) => managed.child.once("close", resolve));
  }));
}

async function requestJson(server, baseUrl, pathname, { method = "GET", body } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`${server.label} ${method} ${pathname} failed with ${response.status}: ${JSON.stringify(data)}\n${server.output}`);
  }
  return data;
}

async function waitForHealth(server, url) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 5000) {
    if (server.child.exitCode !== null) {
      throw new Error(`${server.label} exited before health check passed.\n${server.output}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  throw new Error(`Timed out waiting for ${server.label} health check.\n${server.output}`);
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
    fs.rm(characterAssetDir, { force: true, recursive: true })
  ]);
}

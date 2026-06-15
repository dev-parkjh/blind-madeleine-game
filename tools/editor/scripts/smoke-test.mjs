import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = path.dirname(fileURLToPath(import.meta.url));
const editorRoot = path.resolve(scriptRoot, "..");
const repoRoot = path.resolve(editorRoot, "..", "..");
const characterId = `editor_portrait_rig_smoke_${process.pid}_${Date.now()}`;
const legacyCharacterId = `${characterId}_legacy`;
const characterFile = path.join(repoRoot, "data", "characters", `${characterId}.json`);
const legacyCharacterFile = path.join(repoRoot, "data", "characters", `${legacyCharacterId}.json`);

let serverProcess = null;
let serverOutput = "";

try {
  await cleanupSmokeFiles();
  const port = await getOpenPort();
  serverProcess = spawn(process.execPath, ["server/server.mjs"], {
    cwd: editorRoot,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      GODOT_PREVIEW_AUTO_START: "0",
      GODOT_PREVIEW_AUTO_BUILD: "0",
      PORTRAIT_RIG_EDITOR_AUTO_START: "0"
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
  const health = await waitForHealth(baseUrl);
  assert.equal(health.portraitRigEditorAutoStart, false);
  assert.equal(health.godotPreviewBridgeAutoStart, false);
  assert.equal(health.godotPreviewAutoBuild, false);

  const created = await requestJson(baseUrl, "/api/resources/characters", {
    method: "POST",
    body: {
      data: buildCharacter()
    }
  });
  assert.equal(created.summary.id, characterId);
  assert.equal(created.summary.subtitle, "3 portraits");
  assert.deepEqual(created.summary.validation.portraitKeys.sort(), ["neutral", "surprised", "talk"]);
  assert.deepEqual(created.summary.validation.portraitRigMotionClipIds, ["adaptive_pose", "idle_loop", "talk_loop", "viseme_set"]);
  assert.deepEqual(created.summary.validation.portraitRigPoseTags, ["closed_mouth", "neutral", "open_mouth", "surprised", "talk"]);
  assert.equal(created.summary.validation.portraitRigDialogueMotion.ready, false);
  assert.equal(created.summary.validation.portraitRigDialogueMotion.adaptiveClipId, "adaptive_pose");
  assert.equal(created.summary.validation.portraitRigDialogueMotion.idleClipId, "idle_loop");
  assert.equal(created.summary.validation.portraitRigDialogueMotion.talkClipId, "talk_loop");
  assert.equal(created.summary.validation.portraitRigDialogueMotion.visemeClipId, "viseme_set");
  assert.deepEqual(created.summary.validation.portraitRigDialogueMotion.missingExportedClipIds, ["idle_loop", "talk_loop"]);

  const legacyCreated = await requestJson(baseUrl, "/api/resources/characters", {
    method: "POST",
    body: {
      data: buildLegacyFrameSetOnlyCharacter()
    }
  });
  assert.equal(legacyCreated.summary.validation.portraitRigDialogueMotion.ready, true);
  assert.deepEqual(legacyCreated.summary.validation.portraitRigDialogueMotion.exportedClipIds, ["adaptive_pose", "idle_loop", "talk_loop"]);
  assert.deepEqual(legacyCreated.summary.validation.portraitRigDialogueMotion.missingExportedClipIds, []);
  assert.equal(legacyCreated.summary.validation.portraitRigDialogueMotion.motionFrameSetCount, 3);
  assert.equal(legacyCreated.summary.validation.portraitRigDialogueMotion.exportedFrameCount, 6);
  assert.equal(legacyCreated.summary.validation.portraitRigDialogueMotion.expectedFrameCount, 6);

  const listed = await requestJson(baseUrl, "/api/resources/characters");
  const listedSummary = listed.resources.find((entry) => entry.id === characterId);
  assert.ok(listedSummary, "created Portrait Rig character should appear in character list");
  assert.equal(listedSummary.validation.portraitRigMotionClipIds.includes("adaptive_pose"), true);
  assert.equal(listedSummary.validation.portraitRigPoseTags.includes("surprised"), true);

  const loaded = await requestJson(baseUrl, `/api/resources/characters/${characterId}`);
  const character = loaded.data;
  assert.equal(character.portraits.surprised.path, `res://assets/characters/${characterId}/surprised.png`);
  assert.equal(character.portraits.surprised.portrait_rig_model, `res://assets/characters/${characterId}/surprised.portrait-rig.json`);
  assert.equal(character.portraits.surprised.portrait_rig_motion_frame.clip_id, "adaptive_pose");
  assert.equal(character.portraits.surprised.portrait_rig_motion_frame.parameter_values.mouthOpen, 0.75);
  assert.equal(character.metadata.portrait_rig.app, "tools/portrait-rig-editor");
  assert.equal(character.metadata.portrait_rig.portraits.surprised.motion_frame.clip_id, "adaptive_pose");
  assert.equal(character.metadata.portrait_rig.motion_frame_sets[0].states[1].state, "surprised");
  assert.equal(character.metadata.portrait_rig.hit_areas[0].id, "head");
  assert.equal(character.metadata.portrait_rig.parameter_bindings[0].parameter, "mouthOpen");

  const project = await requestJson(baseUrl, "/api/project/summary");
  const projectSummary = project.resources.characters.resources.find((entry) => entry.id === characterId);
  assert.ok(projectSummary, "project summary should include Portrait Rig character");
  assert.equal(projectSummary.validation.portraitRigMotionClipIds.includes("talk_loop"), true);
  assert.equal(projectSummary.validation.portraitRigMotionClipIds.includes("viseme_set"), true);
  assert.equal(projectSummary.validation.portraitRigDialogueMotion.ready, false);
  assert.equal(projectSummary.validation.portraitRigPoseTags.includes("open_mouth"), true);
  const legacyProjectSummary = project.resources.characters.resources.find((entry) => entry.id === legacyCharacterId);
  assert.ok(legacyProjectSummary, "project summary should include legacy frame-set-only Portrait Rig character");
  assert.deepEqual(legacyProjectSummary.validation.portraitRigDialogueMotion.missingExportedClipIds, []);
  assert.equal(legacyProjectSummary.validation.portraitRigDialogueMotion.exportedFrameCount, 6);

  await requestJson(baseUrl, `/api/resources/characters/${legacyCharacterId}`, { method: "DELETE" });
  await requestJson(baseUrl, `/api/resources/characters/${characterId}`, { method: "DELETE" });
  console.log("Main editor Portrait Rig smoke test passed.");
} finally {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill("SIGTERM");
    await new Promise((resolve) => serverProcess.once("close", resolve));
  }
  await cleanupSmokeFiles();
}

function buildCharacter() {
  const base = `res://assets/characters/${characterId}`;
  return {
    id: characterId,
    display_name: "Editor Portrait Rig Smoke",
    description: "",
    name_color: "#8FD8B8",
    portraits: {
      neutral: portraitRigPortrait(base, "neutral", 0, 0.0, ["neutral", "closed_mouth"], { neutral: 1, closed_mouth: 0.85 }, { mouthOpen: 0, angleX: 0 }),
      surprised: portraitRigPortrait(base, "surprised", 1, 0.6, ["surprised", "open_mouth"], { surprised: 0.98, open_mouth: 0.75 }, { mouthOpen: 0.75, angleX: -0.18 }),
      talk: portraitRigPortrait(base, "talk", 2, 1.1, ["talk", "open_mouth"], { talk: 0.96, open_mouth: 0.65 }, { mouthOpen: 0.55, angleX: 0.2 })
    },
    metadata: {
      portrait_rig: {
        version: 1,
        app: "tools/portrait-rig-editor",
        source_model_path: `${base}/talk.portrait-rig.json`,
        source_portrait_state: "talk",
        adaptive_clip_id: "adaptive_pose",
        portrait_count: 3,
        image_part_count: 2,
        parameter_count: 2,
        rig_binding_count: 2,
        motion_clip_count: 4,
        motion_frame_set_count: 1,
        dialogue_motion_set: {
          version: 1,
          ready: true,
          adaptive_clip_id: "adaptive_pose",
          idle_clip_id: "idle_loop",
          talk_clip_id: "talk_loop",
          viseme_clip_id: "viseme_set",
          clip_ids: ["adaptive_pose", "idle_loop", "talk_loop", "viseme_set"],
          exported_clip_ids: ["adaptive_pose"],
          source_clip_ids: ["adaptive_pose", "idle_loop", "talk_loop", "viseme_set"],
          motion_frame_set_count: 1,
          exported_frame_count: 3,
          expected_frame_count: 19,
          has_exported_adaptive_pose: true,
          has_exported_idle_loop: false,
          has_exported_talk_loop: false,
          has_exported_viseme_set: false
        },
        clips: [
          { id: "adaptive_pose", label: "Adaptive Pose", duration: 1.2, keyframe_count: 3, export_frame_count: 3 },
          { id: "idle_loop", label: "Idle Loop", duration: 2.0, keyframe_count: 4, export_frame_count: 6 },
          { id: "talk_loop", label: "Talk Loop", duration: 1.0, keyframe_count: 4, export_frame_count: 6 },
          { id: "viseme_set", label: "Viseme Set", duration: 1.0, keyframe_count: 4, export_frame_count: 4 }
        ],
        hit_areas: [
          {
            id: "head",
            label: "Head",
            kind: "face",
            part_id: "head",
            normalized_bounds: { x: 0.2, y: 0.1, width: 0.3, height: 0.4 },
            normalized_points: [
              [0.2, 0.1],
              [0.5, 0.1],
              [0.5, 0.5],
              [0.2, 0.5]
            ]
          }
        ],
        parameter_bindings: [
          {
            parameter: "mouthOpen",
            label: "Mouth Open",
            role: "mouth_open",
            channels: ["opacity", "motion"],
            direct_binding_count: 1,
            motion_key_count: 3,
            affected_parts: [
              { part_id: "mouth", label: "Mouth", channels: ["opacity"] }
            ]
          },
          {
            parameter: "angleX",
            label: "Angle X",
            role: "gaze_x",
            channels: ["x", "motion"],
            direct_binding_count: 1,
            motion_key_count: 3
          }
        ],
        portraits: {
          neutral: metadataPortrait(base, "neutral", 0, 0.0, ["neutral", "closed_mouth"], { neutral: 1, closed_mouth: 0.85 }, { mouthOpen: 0, angleX: 0 }),
          surprised: metadataPortrait(base, "surprised", 1, 0.6, ["surprised", "open_mouth"], { surprised: 0.98, open_mouth: 0.75 }, { mouthOpen: 0.75, angleX: -0.18 }),
          talk: metadataPortrait(base, "talk", 2, 1.1, ["talk", "open_mouth"], { talk: 0.96, open_mouth: 0.65 }, { mouthOpen: 0.55, angleX: 0.2 })
        },
        motion_frame_sets: [
          {
            clip_id: "adaptive_pose",
            clip_label: "Adaptive Pose",
            frame_count: 3,
            expected_frame_count: 3,
            clip_duration: 1.2,
            physics_sampled: true,
            pose_tags: ["closed_mouth", "neutral", "open_mouth", "surprised", "talk"],
            states: [
              frameSetState(base, "neutral", 0, 0.0, ["neutral", "closed_mouth"], { neutral: 1, closed_mouth: 0.85 }, { mouthOpen: 0, angleX: 0 }),
              frameSetState(base, "surprised", 1, 0.6, ["surprised", "open_mouth"], { surprised: 0.98, open_mouth: 0.75 }, { mouthOpen: 0.75, angleX: -0.18 }),
              frameSetState(base, "talk", 2, 1.1, ["talk", "open_mouth"], { talk: 0.96, open_mouth: 0.65 }, { mouthOpen: 0.55, angleX: 0.2 })
            ]
          }
        ]
      }
    }
  };
}

function buildLegacyFrameSetOnlyCharacter() {
  const base = `res://assets/characters/${legacyCharacterId}`;
  return {
    id: legacyCharacterId,
    display_name: "Legacy Portrait Rig Frame Sets",
    description: "",
    name_color: "#8FD8B8",
    portraits: {},
    metadata: {
      portrait_rig: {
        version: 1,
        app: "tools/portrait-rig-editor",
        adaptive_clip_id: "adaptive_pose",
        dialogue_motion_set: {
          version: 1,
          ready: true,
          adaptive_clip_id: "adaptive_pose",
          idle_clip_id: "idle_loop",
          talk_clip_id: "talk_loop",
          viseme_clip_id: "viseme_set",
          clip_ids: ["adaptive_pose", "idle_loop", "talk_loop", "viseme_set"],
          source_clip_ids: ["adaptive_pose", "idle_loop", "talk_loop", "viseme_set"]
        },
        motion_frame_sets: [
          legacyFrameSet(base, "adaptive_pose", ["neutral", "surprised"]),
          legacyFrameSet(base, "idle_loop", ["idle_01", "idle_02"]),
          legacyFrameSet(base, "talk_loop", ["talk_01", "talk_02"])
        ]
      }
    }
  };
}

function legacyFrameSet(base, clipId, states) {
  return {
    clip_id: clipId,
    clip_label: clipId,
    frame_count: states.length,
    expected_frame_count: states.length,
    clip_duration: 1,
    states: states.map((state, index) => ({
      state,
      time: index / Math.max(states.length, 1),
      frame_index: index,
      image_path: `${base}/${state}.png`,
      model_path: `${base}/${state}.portrait-rig.json`,
      pose_tags: index === 0 ? ["neutral"] : ["talk"],
      pose_score: index === 0 ? { neutral: 1 } : { talk: 1 },
      parameter_values: { mouthOpen: index === 0 ? 0 : 0.6 }
    }))
  };
}

function portraitRigPortrait(base, state, frameIndex, time, poseTags, poseScore, parameterValues) {
  return {
    path: `${base}/${state}.png`,
    center: [0.5, 0.22],
    profile: { zoom: 3, offset: [0, 0] },
    portrait_rig_model: `${base}/${state}.portrait-rig.json`,
    generated_by: "tools/portrait-rig-editor",
    portrait_rig_motion_frame: motionFrame(frameIndex, time, poseTags, poseScore, parameterValues)
  };
}

function metadataPortrait(base, state, frameIndex, time, poseTags, poseScore, parameterValues) {
  return {
    image_path: `${base}/${state}.png`,
    model_path: `${base}/${state}.portrait-rig.json`,
    center: [0.5, 0.22],
    profile: { zoom: 3, offset: [0, 0] },
    motion_frame: motionFrame(frameIndex, time, poseTags, poseScore, parameterValues)
  };
}

function frameSetState(base, state, frameIndex, time, poseTags, poseScore, parameterValues) {
  return {
    state,
    time,
    frame_index: frameIndex,
    image_path: `${base}/${state}.png`,
    model_path: `${base}/${state}.portrait-rig.json`,
    center: [0.5, 0.22],
    profile: { zoom: 3, offset: [0, 0] },
    pose_tags: poseTags,
    pose_score: poseScore,
    parameter_values: parameterValues
  };
}

function motionFrame(frameIndex, time, poseTags, poseScore, parameterValues) {
  return {
    clip_id: "adaptive_pose",
    clip_label: "Adaptive Pose",
    time,
    frame_index: frameIndex,
    frame_count: 3,
    clip_duration: 1.2,
    physics_sampled: true,
    pose_tags: poseTags,
    pose_score: poseScore,
    parameter_values: parameterValues
  };
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
      throw new Error(`Main editor server exited before health check passed.\n${serverOutput}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return await response.json();
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  throw new Error(`Timed out waiting for main editor health check.\n${serverOutput}`);
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
  await fs.rm(characterFile, { force: true });
  await fs.rm(legacyCharacterFile, { force: true });
}

import type { EditorCopy } from "../../editorText";
import type { DialogueNodeMode, ReferenceResources } from "../../editorTypes";
import { clampNumber, roundForInput } from "../../lib/numeric";
import type { ResourceRecord, ResourceSummary } from "../../types";

export const dialogueNodeModeOptions: DialogueNodeMode[] = ["dialogue", "stage", "cutscene"];

export function dialogueNodeModeLabels(ui: EditorCopy): Record<DialogueNodeMode, string> {
  return {
    dialogue: ui.form.modeDialogue,
    stage: ui.form.modeStage,
    cutscene: ui.form.modeCutscene
  };
}

export function dialogueNodeModeLabel(mode: DialogueNodeMode, ui: EditorCopy) {
  return dialogueNodeModeLabels(ui)[mode];
}

export function speakerLabel(value: unknown, characters: ResourceSummary[]) {
  const id = String(value || "narrator");
  if (id === "narrator") return "narrator";
  return characters.find((entry) => entry.id === id)?.title || id;
}

export function getDialogueNodeMode(node: ResourceRecord): DialogueNodeMode {
  const mode = String(node.mode ?? node.type ?? "dialogue").trim().toLowerCase();
  if (["cutscene", "blackout", "dark", "fade_black", "fade-to-black", "암전", "컷씬"].includes(mode)) return "cutscene";
  if (["stage", "stage_cast", "stagecast", "character_motion", "character_movement", "motion", "move", "무대", "캐릭터 이동", "캐릭터이동"].includes(mode)) return "stage";
  if (Boolean(node.blackout_enabled ?? node.is_blackout)) return "cutscene";
  return "dialogue";
}

export function isCutsceneNode(node: ResourceRecord) {
  return getDialogueNodeMode(node) === "cutscene";
}

export function isStageNode(node: ResourceRecord) {
  return getDialogueNodeMode(node) === "stage";
}

export function dialogueNodeTitle(node: ResourceRecord, references: ReferenceResources, ui: EditorCopy) {
  const mode = getDialogueNodeMode(node);
  if (mode === "cutscene") return dialogueNodeModeLabel(mode, ui);
  if (mode === "stage") return dialogueNodeModeLabel(mode, ui);
  return speakerLabel(node.speaker, references.characters);
}

export function getNodeCutsceneEditorValue(node: ResourceRecord) {
  const cutscene = node.cutscene && typeof node.cutscene === "object" && !Array.isArray(node.cutscene) ? node.cutscene as ResourceRecord : {};
  const blackout = node.blackout && typeof node.blackout === "object" && !Array.isArray(node.blackout) ? node.blackout as ResourceRecord : {};
  return normalizeCutsceneEditorConfig({
    image: node.cutscene_image ?? node.cutscene_image_path ?? node.blackout_image ?? node.image ?? node.path,
    fade_in: node.blackout_fade_in ?? node.blackout_fade_in_duration ?? node.fade_in_duration,
    hold: node.blackout_hold ?? node.blackout_hold_duration ?? node.hold_duration,
    fade_out: node.blackout_fade_out ?? node.blackout_fade_out_duration ?? node.fade_out_duration,
    ...blackout,
    ...cutscene
  });
}

export function normalizeCutsceneEditorConfig(value: ResourceRecord) {
  return {
    image: String(value.image ?? value.path ?? value.src ?? value.file ?? "").trim(),
    fade_in: roundForInput(clampNumber(value.fade_in ?? value.fade_in_duration ?? value.fadeIn ?? value.in, 0, 30, 0)),
    hold: roundForInput(clampNumber(value.hold ?? value.hold_duration ?? value.duration ?? value.wait, 0, 30, 1)),
    fade_out: roundForInput(clampNumber(value.fade_out ?? value.fade_out_duration ?? value.fadeOut ?? value.out, 0, 30, 1))
  };
}

export function withNodeCutscene(node: ResourceRecord, cutsceneValue: ResourceRecord) {
  const next: ResourceRecord = { ...node };
  delete next.type;
  delete next.blackout;
  delete next.blackout_enabled;
  delete next.is_blackout;
  delete next.cutscene_image;
  delete next.cutscene_image_path;
  delete next.blackout_image;
  delete next.image;
  delete next.path;
  delete next.blackout_fade_in;
  delete next.blackout_fade_in_duration;
  delete next.fade_in_duration;
  delete next.blackout_hold;
  delete next.blackout_hold_duration;
  delete next.hold_duration;
  delete next.blackout_fade_out;
  delete next.blackout_fade_out_duration;
  delete next.fade_out_duration;
  next.mode = "cutscene";
  next.cutscene = normalizeCutsceneEditorConfig(cutsceneValue);
  return next;
}

export function withDialogueMode(node: ResourceRecord) {
  const next: ResourceRecord = { ...node };
  delete next.mode;
  delete next.type;
  delete next.cutscene;
  delete next.blackout;
  delete next.blackout_enabled;
  delete next.is_blackout;
  delete next.cutscene_image;
  delete next.cutscene_image_path;
  delete next.blackout_image;
  delete next.image;
  delete next.path;
  return next;
}

export function withStageMode(node: ResourceRecord) {
  const next: ResourceRecord = { ...node };
  next.mode = "stage";
  delete next.type;
  delete next.cutscene;
  delete next.blackout;
  delete next.blackout_enabled;
  delete next.is_blackout;
  delete next.cutscene_image;
  delete next.cutscene_image_path;
  delete next.blackout_image;
  delete next.image;
  delete next.path;
  return next;
}

export function getStageNodeHoldEditorValue(node: ResourceRecord) {
  return roundForInput(clampNumber(node.stage_hold ?? node.stage_wait ?? node.hold ?? node.wait ?? node.duration, 0, 30, 0));
}

export function patchStageHold(node: ResourceRecord, value: unknown) {
  const next: ResourceRecord = { ...node };
  delete next.stage_hold;
  delete next.stage_wait;
  delete next.wait;
  delete next.duration;
  next.hold = roundForInput(clampNumber(value, 0, 30, 0));
  return next;
}

export function cutsceneSummary(node: ResourceRecord) {
  const cutscene = getNodeCutsceneEditorValue(node);
  return `fade ${cutscene.fade_in ?? 0}/${cutscene.fade_out ?? 1} · hold ${cutscene.hold ?? 1}`;
}

export function patchCutscene(node: ResourceRecord, field: string, value: unknown) {
  return withNodeCutscene(node, { ...getNodeCutsceneEditorValue(node), [field]: value });
}

export function countEventTags(nodes: ResourceRecord[]) {
  return nodes.reduce((total, node) => total + (String(node.text || "").match(/\[(bgm|sfx|se|bg|auto_next|enter|exit|live2d|live2d_pose|live2d_motion)\b/gi)?.length || 0), 0);
}

export function defaultNestedNode(mode: DialogueNodeMode): ResourceRecord {
  if (mode === "cutscene") return { mode: "cutscene", cutscene: { fade_in: 0, hold: 1, fade_out: 1 } };
  if (mode === "stage") return { mode: "stage", stage_cast: {}, hold: 0, next: "" };
  return { speaker: "narrator", text: "" };
}

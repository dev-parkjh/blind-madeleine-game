import type { ResourceRecord } from "../types";

export const portraitRigPoseTagKeys = [
  "portrait_rig_pose_tag",
  "portraitRigPoseTag",
  "pose_tag",
  "poseTag",
  "portrait_rig_pose_tags",
  "portraitRigPoseTags",
  "pose_tags",
  "poseTags"
];
export const portraitRigPoseHintKeys = [
  "portrait_rig_pose_hint",
  "portraitRigPoseHint",
  "pose_hint",
  "poseHint",
  "emotion",
  "mood",
  "tone",
  "expression"
];
export const portraitRigTextPoseTagKeys = [
  "tag",
  "tags",
  "pose",
  "hint",
  "pose_hint",
  "poseHint",
  "pose_tag",
  "poseTag",
  "pose_tags",
  "poseTags",
  "portrait_rig_pose_tag",
  "portraitRigPoseTag",
  "portrait_rig_pose_tags",
  "portraitRigPoseTags",
  "portrait_rig_pose_hint",
  "portraitRigPoseHint",
  "emotion",
  "mood",
  "tone",
  "expression"
];

export function normalizePortraitRigPoseTag(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/기쁨|행복/g, "happy")
    .replace(/웃음/g, "smile")
    .replace(/슬픔/g, "sad")
    .replace(/화남/g, "angry")
    .replace(/놀람/g, "surprised")
    .replace(/의문/g, "curious")
    .replace(/말하기|대화/g, "talk")
    .replace(/깜빡|감기/g, "blink")
    .replace(/진지/g, "serious")
    .replace(/걱정/g, "worried")
    .replace(/움직임/g, "motion")
    .replace(/음소/g, "phoneme")
    .replace(/입모양/g, "viseme")
    .replace(/[^a-z0-9_]+/g, "");
}

export function appendPortraitRigPoseTags(tags: string[], value: unknown) {
  if (Array.isArray(value)) {
    value.forEach((entry) => appendPortraitRigPoseTags(tags, entry));
    return;
  }
  if (typeof value === "boolean") return;
  String(value || "")
    .toLowerCase()
    .replace(/[;/|]+/g, ",")
    .split(",")
    .flatMap((chunk) => chunk.split(/\s+/))
    .map(normalizePortraitRigPoseTag)
    .filter(Boolean)
    .forEach((tag) => {
      if (!tags.includes(tag)) tags.push(tag);
    });
}

export function collectPortraitRigPoseHintTagsFromRecord(record: ResourceRecord) {
  const tags: string[] = [];
  for (const key of portraitRigPoseTagKeys) appendPortraitRigPoseTags(tags, record[key]);
  for (const key of portraitRigPoseHintKeys) appendPortraitRigPoseTags(tags, record[key]);
  return tags;
}

export function collectPortraitRigPoseTagsFromValues(values: unknown[]) {
  const tags: string[] = [];
  values.forEach((value) => appendPortraitRigPoseTags(tags, value));
  return tags;
}

export function firstPortraitRigPoseHintValue(record: ResourceRecord) {
  for (const key of ["portrait_rig_pose_hint", "portraitRigPoseHint", "pose_hint", "poseHint", "portrait_rig_pose_tag", "portraitRigPoseTag", "pose_tag", "poseTag", ...portraitRigPoseHintKeys.slice(4)]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  for (const key of ["portrait_rig_pose_tags", "portraitRigPoseTags", "pose_tags", "poseTags"]) {
    const tags = normalizePortraitRigPoseTags(record[key], 8);
    if (tags.length > 0) return tags.join(",");
  }
  return "";
}

export function normalizePortraitRigPoseTags(value: unknown, limit = 64) {
  if (!Array.isArray(value)) return [];
  const tags: string[] = [];
  value.forEach((entry) => appendPortraitRigPoseTags(tags, entry));
  return tags.slice(0, limit);
}

export function normalizePortraitRigPoseScore(value: unknown, limit = 32) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as ResourceRecord : {};
  return Object.fromEntries(
    Object.entries(source)
      .map(([key, rawValue]) => [normalizePortraitRigPoseTag(key), Number(rawValue)] as const)
      .filter(([key, numberValue]) => key && Number.isFinite(numberValue))
      .slice(0, limit)
      .map(([key, numberValue]) => [key, Math.min(1, Math.max(0, numberValue))])
  );
}

export function expandPortraitRigPoseHintTags(tags: string[]) {
  const expanded: string[] = [];
  const add = (values: string[]) => {
    values.forEach((value) => {
      if (expanded.length < 32 && value && !expanded.includes(value)) expanded.push(value);
    });
  };
  tags.forEach((tag) => {
    add([tag]);
    if (tag === "happy" || tag === "joy" || tag === "smile") add(["happy", "smile", "laugh"]);
    else if (tag === "laugh") add(["laugh", "happy", "smile", "open_mouth"]);
    else if (tag === "sad") add(["sad", "worried", "serious"]);
    else if (tag === "angry" || tag === "mad") add(["serious", "worried", "look_down"]);
    else if (tag === "surprise" || tag === "surprised" || tag === "shock") add(["surprised", "open_mouth"]);
    else if (tag === "question" || tag === "curious" || tag === "doubt") add(["squint", "look_left", "look_right", "serious"]);
    else if (tag === "talk" || tag === "speak") add(["talk", "open_mouth"]);
    else if (tag === "open_mouth") add(["open_mouth", "talk", "surprised"]);
    else if (tag === "closed_mouth") add(["closed_mouth", "viseme_closed", "neutral"]);
    else if (tag === "viseme" || tag === "phoneme") add(["viseme", "phoneme", "talk"]);
    else if (tag === "viseme_a") add(["viseme_a", "viseme", "phoneme", "talk", "open_mouth"]);
    else if (tag === "viseme_i") add(["viseme_i", "viseme", "phoneme", "talk", "smile"]);
    else if (tag === "viseme_o") add(["viseme_o", "viseme", "phoneme", "talk", "open_mouth"]);
    else if (tag === "viseme_u") add(["viseme_u", "viseme", "phoneme", "talk"]);
    else if (tag === "viseme_closed") add(["viseme_closed", "closed_mouth", "viseme", "phoneme"]);
    else if (tag === "blink") add(["blink", "squint"]);
    else if (tag === "squint") add(["squint", "blink", "curious"]);
    else if (tag === "serious") add(["serious", "worried", "look_down"]);
    else if (tag === "worried") add(["worried", "serious", "sad"]);
    else if (tag === "motion") add(["motion", "look_left", "look_right", "tilt_left", "tilt_right"]);
    else if (tag === "look_left") add(["look_left", "motion"]);
    else if (tag === "look_right") add(["look_right", "motion"]);
    else if (tag === "look_up") add(["look_up", "motion", "surprised"]);
    else if (tag === "look_down") add(["look_down", "serious", "motion"]);
    else if (tag === "tilt_left") add(["tilt_left", "motion"]);
    else if (tag === "tilt_right") add(["tilt_right", "motion"]);
    else add([tag]);
  });
  return expanded;
}

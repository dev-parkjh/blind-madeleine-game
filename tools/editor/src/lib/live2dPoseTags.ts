import type { ResourceRecord } from "../types";

export const live2dPoseTagKeys = [
  "live2d_pose_tag",
  "live2dPoseTag",
  "pose_tag",
  "poseTag",
  "live2d_pose_tags",
  "live2dPoseTags",
  "pose_tags",
  "poseTags"
];
export const live2dPoseHintKeys = [
  "live2d_pose_hint",
  "live2dPoseHint",
  "pose_hint",
  "poseHint",
  "emotion",
  "mood",
  "tone",
  "expression"
];
export const live2dTextPoseTagKeys = [
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
  "live2d_pose_tag",
  "live2dPoseTag",
  "live2d_pose_tags",
  "live2dPoseTags",
  "live2d_pose_hint",
  "live2dPoseHint",
  "emotion",
  "mood",
  "tone",
  "expression"
];

export function normalizeLive2dPoseTag(value: unknown) {
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

export function appendLive2dPoseTags(tags: string[], value: unknown) {
  if (Array.isArray(value)) {
    value.forEach((entry) => appendLive2dPoseTags(tags, entry));
    return;
  }
  if (typeof value === "boolean") return;
  String(value || "")
    .toLowerCase()
    .replace(/[;/|]+/g, ",")
    .split(",")
    .flatMap((chunk) => chunk.split(/\s+/))
    .map(normalizeLive2dPoseTag)
    .filter(Boolean)
    .forEach((tag) => {
      if (!tags.includes(tag)) tags.push(tag);
    });
}

export function collectLive2dPoseHintTagsFromRecord(record: ResourceRecord) {
  const tags: string[] = [];
  for (const key of live2dPoseTagKeys) appendLive2dPoseTags(tags, record[key]);
  for (const key of live2dPoseHintKeys) appendLive2dPoseTags(tags, record[key]);
  return tags;
}

export function collectLive2dPoseTagsFromValues(values: unknown[]) {
  const tags: string[] = [];
  values.forEach((value) => appendLive2dPoseTags(tags, value));
  return tags;
}

export function firstLive2dPoseHintValue(record: ResourceRecord) {
  for (const key of ["live2d_pose_hint", "live2dPoseHint", "pose_hint", "poseHint", "live2d_pose_tag", "live2dPoseTag", "pose_tag", "poseTag", ...live2dPoseHintKeys.slice(4)]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  for (const key of ["live2d_pose_tags", "live2dPoseTags", "pose_tags", "poseTags"]) {
    const tags = normalizeLive2dPoseTags(record[key], 8);
    if (tags.length > 0) return tags.join(",");
  }
  return "";
}

export function normalizeLive2dPoseTags(value: unknown, limit = 64) {
  if (!Array.isArray(value)) return [];
  const tags: string[] = [];
  value.forEach((entry) => appendLive2dPoseTags(tags, entry));
  return tags.slice(0, limit);
}

export function normalizeLive2dPoseScore(value: unknown, limit = 32) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as ResourceRecord : {};
  return Object.fromEntries(
    Object.entries(source)
      .map(([key, rawValue]) => [normalizeLive2dPoseTag(key), Number(rawValue)] as const)
      .filter(([key, numberValue]) => key && Number.isFinite(numberValue))
      .slice(0, limit)
      .map(([key, numberValue]) => [key, Math.min(1, Math.max(0, numberValue))])
  );
}

export function expandLive2dPoseHintTags(tags: string[]) {
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

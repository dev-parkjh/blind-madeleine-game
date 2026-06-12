import type { CSSProperties } from "react";
import {
  firstDefinedBbcodeAttr,
  parseRichTextPreviewAst,
  type BbcodeAttributes,
  type RichTextAstNode,
  type RichTextSourceRange
} from "../../components/RichTextPreview";
import { clamp01Number, clampNumber, formatNumberInput, normalizeNumber } from "../../lib/numeric";
import { normalizeKind } from "../../lib/resourceConfig";
import { resPathToAssetUrl } from "../../lib/resourcePaths";
import type { ResourceSummary } from "../../types";

export type DialogueBackgroundEditorValue = {
  enabled: boolean;
  range?: RichTextSourceRange;
  id: string;
  path: string;
  transition: string;
  duration: number;
  opacity: number;
  blur: number;
  brightness: number;
  saturate: number;
  dim: number;
  fixed: boolean;
  zoom: number;
  x: number;
  y: number;
};

export function getDialogueBackgroundEditorValue(text: string): DialogueBackgroundEditorValue {
  const event = findDialogueBackgroundEvent(text);
  const attrs = event?.attrs || {};
  return {
    enabled: Boolean(event),
    range: event?.range,
    id: dialogueBackgroundAttrString(attrs, ["id", "asset", "asset_id"]),
    path: dialogueBackgroundAttrString(attrs, ["path", "image", "src", "file"]),
    transition: dialogueBackgroundAttrString(attrs, ["transition"], "fade"),
    duration: normalizeNumber(firstDefinedBbcodeAttr(attrs, ["duration", "fade", "time"]), 0.5, 0, 10),
    opacity: normalizeNumber(firstDefinedBbcodeAttr(attrs, ["opacity", "alpha"]), 1, 0, 1),
    blur: normalizeNumber(firstDefinedBbcodeAttr(attrs, ["blur", "blur_px", "background_blur", "filter_blur"]), 3, 0, 12),
    brightness: normalizeNumber(firstDefinedBbcodeAttr(attrs, ["brightness", "bright", "filter_brightness"]), 0.75, 0, 2),
    saturate: normalizeNumber(firstDefinedBbcodeAttr(attrs, ["saturate", "saturation", "filter_saturate", "filter_saturation"]), 0.8, 0, 2),
    dim: normalizeNumber(firstDefinedBbcodeAttr(attrs, ["dim", "darkness", "darken", "overlay", "overlay_opacity", "black_overlay"]), 0.15, 0, 1),
    fixed: readDialogueBackgroundFixed(attrs),
    zoom: normalizeNumber(firstDefinedBbcodeAttr(attrs, ["zoom", "scale", "background_zoom"]), 1, 1, 6),
    x: normalizeNumber(firstDefinedBbcodeAttr(attrs, ["x", "focus_x", "center_x", "offset_x"]), 0.5, 0, 1),
    y: normalizeNumber(firstDefinedBbcodeAttr(attrs, ["y", "focus_y", "center_y", "offset_y"]), 0.5, 0, 1)
  };
}

export function upsertDialogueBackgroundEvent(text: string, value: DialogueBackgroundEditorValue) {
  const tag = buildDialogueBackgroundEventTag(value);
  if (value.range) {
    return `${text.slice(0, value.range.start)}${tag}${text.slice(value.range.end)}`;
  }
  return `${tag}${text}`;
}

export function removeDialogueBackgroundEvent(text: string, value: DialogueBackgroundEditorValue) {
  if (!value.range) return text;
  return `${text.slice(0, value.range.start)}${text.slice(value.range.end)}`;
}

export function getBackgroundStoryAssetOptions(storyAssets: ResourceSummary[]) {
  const emptyOption = { id: "", title: "직접 경로", subtitle: "path", type: "story_assets" } as ResourceSummary;
  const backgroundAssets = storyAssets.filter((asset) => normalizeKind(String(asset.subtitle || "").split(" · ")[0]) === "background");
  return [emptyOption, ...backgroundAssets];
}

export function getDialogueBackgroundPreviewUrl(value: DialogueBackgroundEditorValue, storyAssets: ResourceSummary[]) {
  if (value.path) return resPathToAssetUrl(value.path);
  const asset = storyAssets.find((entry) => entry.id === value.id);
  if (!asset) return "";
  return resPathToAssetUrl(String(asset.subtitle || "").split(" · ").slice(1).join(" · "));
}

export function getDialogueBackgroundPreviewImageSize(stageWidth: number, stageHeight: number, zoom: number, imageAspect: number) {
  const stageAspect = stageWidth / Math.max(1, stageHeight);
  const safeAspect = clampNumber(imageAspect, 0.05, 20, 16 / 9);
  const safeZoom = clampNumber(zoom, 1, 6, 1);
  if (safeAspect >= stageAspect) {
    const height = stageHeight * safeZoom;
    return { width: height * safeAspect, height };
  }
  const width = stageWidth * safeZoom;
  return { width, height: width / safeAspect };
}

export function getDialogueBackgroundPreviewImageStyle(value: DialogueBackgroundEditorValue, imageAspect: number) {
  const stageAspect = 16 / 9;
  const safeAspect = clampNumber(imageAspect, 0.05, 20, stageAspect);
  const safeZoom = clampNumber(value.zoom, 1, 6, 1);
  let widthPercent: number;
  let heightPercent: number;
  if (safeAspect >= stageAspect) {
    heightPercent = safeZoom * 100;
    widthPercent = heightPercent * safeAspect / stageAspect;
  } else {
    widthPercent = safeZoom * 100;
    heightPercent = widthPercent * stageAspect / safeAspect;
  }
  return {
    width: `${widthPercent}%`,
    height: `${heightPercent}%`,
    left: `${50 - clamp01Number(value.x, 0.5) * widthPercent}%`,
    top: `${50 - clamp01Number(value.y, 0.5) * heightPercent}%`
  } as CSSProperties;
}

function findDialogueBackgroundEvent(text: string): Extract<RichTextAstNode, { type: "event" }> | null {
  let found: Extract<RichTextAstNode, { type: "event" }> | null = null;
  const visit = (node: RichTextAstNode) => {
    if (found) return;
    if (node.type === "event" && (node.tagName === "bg" || node.tagName === "background")) {
      found = node;
      return;
    }
    if (node.type === "span") node.children.forEach(visit);
  };
  parseRichTextPreviewAst(text).forEach(visit);
  return found;
}

function dialogueBackgroundAttrString(attrs: BbcodeAttributes, keys: string[], fallback = "") {
  const value = firstDefinedBbcodeAttr(attrs, keys);
  if (value === undefined || value === true || value === false) return fallback;
  return String(value || "").trim() || fallback;
}

function readDialogueBackgroundFixed(attrs: BbcodeAttributes) {
  const fixedValue = firstDefinedBbcodeAttr(attrs, ["fixed", "background_fixed", "static", "locked"]);
  if (fixedValue !== undefined) return readEditorBoolean(fixedValue, true);
  const parallaxValue = firstDefinedBbcodeAttr(attrs, ["parallax", "parallax_enabled", "floating"]);
  if (parallaxValue !== undefined) return !readEditorBoolean(parallaxValue, true);
  return true;
}

function readEditorBoolean(value: unknown, fallback = false) {
  if (value === true || value === false) return value;
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return fallback;
  if (["true", "1", "yes", "on"].includes(text)) return true;
  if (["false", "0", "no", "off"].includes(text)) return false;
  return fallback;
}

function buildDialogueBackgroundEventTag(value: DialogueBackgroundEditorValue) {
  const attrs: string[] = [];
  if (value.id.trim()) {
    attrs.push(`id="${escapeBbcodeAttribute(value.id.trim())}"`);
  } else if (value.path.trim()) {
    attrs.push(`path="${escapeBbcodeAttribute(value.path.trim())}"`);
  }
  attrs.push(`transition=${value.transition || "fade"}`);
  attrs.push(`duration=${formatNumberInput(normalizeNumber(value.duration, 0.5, 0, 10))}`);
  attrs.push(`opacity=${formatNumberInput(normalizeNumber(value.opacity, 1, 0, 1))}`);
  attrs.push(`blur=${formatNumberInput(normalizeNumber(value.blur, 3, 0, 12))}`);
  attrs.push(`brightness=${formatNumberInput(normalizeNumber(value.brightness, 0.75, 0, 2))}`);
  attrs.push(`saturate=${formatNumberInput(normalizeNumber(value.saturate, 0.8, 0, 2))}`);
  attrs.push(`dim=${formatNumberInput(normalizeNumber(value.dim, 0.15, 0, 1))}`);
  attrs.push(`fixed=${value.fixed ? "true" : "false"}`);
  attrs.push(`zoom=${formatNumberInput(normalizeNumber(value.zoom, 1, 1, 6))}`);
  attrs.push(`x=${formatNumberInput(normalizeNumber(value.x, 0.5, 0, 1))}`);
  attrs.push(`y=${formatNumberInput(normalizeNumber(value.y, 0.5, 0, 1))}`);
  return `[bg ${attrs.join(" ")}]`;
}

function escapeBbcodeAttribute(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

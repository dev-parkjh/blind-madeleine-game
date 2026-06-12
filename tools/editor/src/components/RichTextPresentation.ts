import type { CSSProperties } from "react";
import type { ReferenceResources } from "../editorTypes";
import type { BbcodeAttributes, RichTextAstNode } from "./RichTextPreviewParser";

export type RichTextTagPresentation = {
  classNames: string[];
  style: CSSProperties;
  title?: string;
  dataNote?: string;
};

export type RichTextMotionConfig = {
  tagName: string;
  variableName: "--rich-text-shake-level" | "--rich-text-wave-amp" | "--rich-text-tornado-radius";
  amount: number;
  duration: number;
  phaseStep: number;
};

export function getRichTextMotionConfig(tagName: string, attrs: BbcodeAttributes): RichTextMotionConfig {
  if (tagName === "wave") {
    const amp = getBbcodeAttrNumber(attrs, "amp", 14, 2, 60);
    const freq = getBbcodeAttrNumber(attrs, "freq", 3, 0.1, 12);
    return {
      tagName,
      variableName: "--rich-text-wave-amp",
      amount: amp * 0.14,
      duration: Math.max(0.28, 1 / freq),
      phaseStep: 0.075
    };
  }
  if (tagName === "tornado") {
    const radius = getBbcodeAttrNumber(attrs, "radius", 5, 1, 30);
    const freq = getBbcodeAttrNumber(attrs, "freq", 0.85, 0.1, 6);
    return {
      tagName,
      variableName: "--rich-text-tornado-radius",
      amount: radius * 0.34,
      duration: Math.max(0.6, 1 / freq),
      phaseStep: 0.06
    };
  }
  const level = getBbcodeAttrNumber(attrs, "level", 3, 1, 12);
  const rate = getBbcodeAttrNumber(attrs, "rate", 18, 1, 40);
  return {
    tagName: "shake",
    variableName: "--rich-text-shake-level",
    amount: level * 0.32,
    duration: Math.max(0.08, 1 / rate),
    phaseStep: 0.025
  };
}

export function getRichTextTagPresentation(tagName: string, attrs: BbcodeAttributes, references?: ReferenceResources): RichTextTagPresentation {
  const classNames: string[] = [];
  const style: CSSProperties = {};
  const customStyle = style as CSSProperties & Record<string, string>;
  let title: string | undefined;
  let dataNote: string | undefined;

  switch (tagName) {
    case "b":
      style.fontWeight = 800;
      break;
    case "i":
      style.fontStyle = "italic";
      break;
    case "u":
      classNames.push("rich-text-underline");
      break;
    case "s":
      classNames.push("rich-text-strike");
      break;
    case "code":
      classNames.push("rich-text-code");
      break;
    case "font_size": {
      const size = clampPreviewNumber(attrs.value, 10, 96, 32);
      style.fontSize = `${size}px`;
      break;
    }
    case "font_scale":
      if (isFontScaleGradientAttrs(attrs)) {
        classNames.push("rich-text-font-gradient");
      } else {
        style.fontSize = `${formatDialogueFontScale(getDialogueFontScaleFromAttrs(attrs, 1))}em`;
      }
      break;
    case "color":
      style.color = resolveRichTextPreviewColor(attrs.value, references);
      break;
    case "bgcolor":
    case "fgcolor":
      style.backgroundColor = resolveRichTextPreviewColor(attrs.value, references);
      classNames.push("rich-text-bgcolor");
      break;
    case "outline_size": {
      classNames.push("rich-text-outline");
      const size = clampPreviewNumber(attrs.value, 1, 5, 2);
      customStyle["--rich-text-outline-size"] = `${size}px`;
      break;
    }
    case "outline_color":
      classNames.push("rich-text-outline");
      customStyle["--rich-text-outline-color"] = resolveRichTextPreviewColor(attrs.value, references) || "rgba(0, 0, 0, 0.9)";
      break;
    case "shake": {
      classNames.push("rich-text-motion", "rich-text-shake");
      const config = getRichTextMotionConfig(tagName, attrs);
      customStyle["--rich-text-shake-level"] = `${config.amount}px`;
      style.animationDuration = `${config.duration}s`;
      break;
    }
    case "wave": {
      classNames.push("rich-text-motion", "rich-text-wave");
      const config = getRichTextMotionConfig(tagName, attrs);
      customStyle["--rich-text-wave-amp"] = `${config.amount}px`;
      style.animationDuration = `${config.duration}s`;
      break;
    }
    case "tornado": {
      classNames.push("rich-text-motion", "rich-text-tornado");
      const config = getRichTextMotionConfig(tagName, attrs);
      customStyle["--rich-text-tornado-radius"] = `${config.amount}px`;
      style.animationDuration = `${config.duration}s`;
      break;
    }
    case "pulse": {
      classNames.push("rich-text-motion", "rich-text-pulse");
      const freq = getBbcodeAttrNumber(attrs, "freq", 1, 0.1, 6);
      style.animationDuration = `${Math.max(0.2, 2 / freq)}s`;
      break;
    }
    case "fade":
      break;
    case "rainbow": {
      classNames.push("rich-text-motion", "rich-text-rainbow");
      const speed = Math.abs(getBbcodeAttrNumber(attrs, "speed", 1, -8, 8)) || 1;
      style.animationDuration = `${Math.max(0.2, 1 / speed)}s`;
      break;
    }
    case "grow": {
      break;
    }
    case "blink": {
      classNames.push("rich-text-motion", "rich-text-blink");
      const frequency = getBbcodeAttrNumber(attrs, "freq", 3.4, 0.1, 12);
      const minAlpha = getBbcodeAttrNumber(attrs, "min", 0.12, 0, 1);
      customStyle["--rich-text-blink-min"] = String(minAlpha);
      style.animationDuration = `${Math.max(0.06, 1 / frequency)}s`;
      break;
    }
    case "alpha": {
      const alpha = getBbcodeAttrNumber(attrs, ["value", "amount"], 0.45, 0, 1);
      style.opacity = alpha;
      break;
    }
    case "lie":
      classNames.push("rich-text-lie");
      title = "[lie]";
      break;
    case "speed":
    case "text_speed":
    case "type_speed":
    case "typewriter_speed": {
      const speed = getBbcodeAttrNumber(attrs, "value", 1, 0.01, 10);
      classNames.push("rich-text-speed");
      dataNote = `x${formatDialogueFontScale(speed)}`;
      title = `typewriter speed ${dataNote}`;
      break;
    }
    default:
      break;
  }

  return { classNames, style, title, dataNote };
}

export function getBbcodeAttrNumber(attrs: BbcodeAttributes, names: string | string[], fallback: number, min = -Infinity, max = Infinity) {
  const keys = Array.isArray(names) ? names : [names];
  for (const key of keys) {
    if (attrs[key] !== undefined) {
      return clampPreviewNumber(attrs[key], min, max, fallback);
    }
  }
  return fallback;
}

export function normalizeDialogueFontScale(value: unknown, fallback = 1) {
  const raw = String(value ?? "").trim().replace(/^x/i, "").replace(/배$/, "");
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(4, Math.max(0.25, parsed));
}

export function formatDialogueFontScale(value: number) {
  const rounded = Math.round(Number(value) * 1000) / 1000;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

export function getDialogueFontScaleFromAttrs(attrs: BbcodeAttributes, fallback = 1) {
  for (const key of ["value", "scale", "multiplier", "ratio", "x"]) {
    if (attrs[key] !== undefined) {
      return normalizeDialogueFontScale(attrs[key], fallback);
    }
  }
  return fallback;
}

export function isFontScaleGradientTag(node: RichTextAstNode) {
  return node.type === "span" && node.tagName === "font_scale" && isFontScaleGradientAttrs(node.attrs);
}

export function isFontScaleGradientAttrs(attrs: BbcodeAttributes) {
  return firstDefinedBbcodeAttr(attrs, ["from", "from_scale", "start"]) !== undefined
    || firstDefinedBbcodeAttr(attrs, ["to", "to_scale", "end"]) !== undefined;
}

export function firstDefinedBbcodeAttr(attrs: BbcodeAttributes, keys: string[]) {
  for (const key of keys) {
    if (attrs[key] !== undefined) return attrs[key];
  }
  return undefined;
}

export function countRichTextVisibleCharacters(nodes: RichTextAstNode[]): number {
  return nodes.reduce((total, node) => {
    if (node.type === "text") return total + Array.from(node.text).length;
    if (node.type === "span") return total + countRichTextVisibleCharacters(node.children);
    return total;
  }, 0);
}

function clampPreviewNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function resolveRichTextPreviewColor(value: unknown, references?: ReferenceResources) {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  const characterPrefix = "character:";
  if (raw.toLowerCase().startsWith(characterPrefix)) {
    const characterId = raw.slice(characterPrefix.length).trim();
    const character = references?.characters.find((entry) => entry.id === characterId);
    return character?.nameColor || "#ffffff";
  }
  return raw;
}

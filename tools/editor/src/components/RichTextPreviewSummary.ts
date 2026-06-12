import {
  parseRichTextPreviewAst,
  type RichTextAstNode
} from "./RichTextPreviewParser";

export function getDialogueVisiblePreviewText(text: unknown) {
  const nodes = parseRichTextPreviewAst(String(text || ""));
  return collectRichTextPlainText(nodes).replace(/\s+/g, " ").trim();
}

export function collectRichTextPlainText(nodes: RichTextAstNode[]): string {
  return nodes.map((node) => {
    if (node.type === "text") return node.text;
    if (node.type === "span") return collectRichTextPlainText(node.children);
    return "";
  }).join("");
}

export function detectTextTags(text: string) {
  const tags = new Set<string>();
  const patterns: Array<[string, RegExp]> = [
    ["style", /\[(b|i|u|s|code)\b/i],
    ["lie", /\[lie\b/i],
    ["shake", /\[shake\b/i],
    ["wave", /\[wave\b/i],
    ["motion", /\[(tornado|pulse|fade|rainbow|grow|blink)\b/i],
    ["alpha", /\[alpha\b/i],
    ["font", /\[font_scale\b/i],
    ["speed", /\[speed\b/i],
    ["color", /\[color=/i],
    ["color", /\[(bgcolor|fgcolor|outline_size|outline_color)\b/i],
    ["bgm", /\[bgm\b/i],
    ["bgm", /\[(bgm_stop|music_stop|bgm_volume|music_volume)\b/i],
    ["sfx", /\[(sfx|se)\b/i],
    ["bg", /\[(bg|background|bg_clear|background_clear|bg_remove|background_remove)\b/i],
    ["auto", /\[(auto_next|auto_advance|advance)\b/i],
    ["enter", /\[enter\b/i],
    ["exit", /\[exit\b/i]
  ];
  for (const [tag, pattern] of patterns) {
    if (pattern.test(text)) tags.add(tag);
  }
  return [...tags];
}

export function tagPreviewLabel(tag: string) {
  return {
    style: "서식",
    lie: "거짓",
    shake: "흔들림",
    wave: "물결",
    motion: "움직임",
    alpha: "반투명",
    font: "크기 변화",
    speed: "속도",
    color: "색상",
    bgm: "BGM",
    sfx: "SFX",
    bg: "배경",
    auto: "자동",
    enter: "등장",
    exit: "퇴장"
  }[tag] || tag;
}

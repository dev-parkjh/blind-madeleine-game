export type BbcodeAttributes = Record<string, string | boolean>;
export type RichTextSourceRange = { start: number; end: number };
export type RichTextAstNode =
  | { type: "text"; text: string }
  | { type: "span"; tagName: string; attrs: BbcodeAttributes; children: RichTextAstNode[]; range?: RichTextSourceRange }
  | { type: "event"; tagName: string; attrs: BbcodeAttributes; raw: string; range: RichTextSourceRange };

const dialogueBbcodeTagNames = new Set([
  "b", "i", "u", "s", "code", "font", "font_size", "font_scale", "color", "bgcolor", "fgcolor",
  "outline_size", "outline_color", "shake", "wave", "tornado", "pulse", "fade",
  "rainbow", "grow", "blink", "alpha", "lie",
  "speed", "text_speed", "type_speed", "typewriter_speed",
  "sfx", "sound", "se", "bgm", "music", "bgm_stop", "music_stop", "bgm_volume", "music_volume",
  "bg", "background", "bg_clear", "background_clear", "bg_remove", "background_remove",
  "auto_next", "auto_advance", "advance", "enter", "exit",
  "portraitRig", "portrait_rig_pose", "portrait_rig_motion", "lb", "rb"
]);

const dialogueEventTagNames = new Set([
  "sfx", "sound", "se", "bgm", "music", "bgm_stop", "music_stop", "bgm_volume", "music_volume",
  "bg", "background", "bg_clear", "background_clear", "bg_remove", "background_remove",
  "auto_next", "auto_advance", "advance", "enter", "exit",
  "portraitRig", "portrait_rig_pose", "portrait_rig_motion"
]);

export function parseRichTextPreviewAst(text: string): RichTextAstNode[] {
  const root: RichTextAstNode[] = [];
  const stack: Array<{ tagName: string; children: RichTextAstNode[]; node?: Extract<RichTextAstNode, { type: "span" }> }> = [{ tagName: "", children: root }];
  const raw = String(text || "");
  let buffer = "";
  let index = 0;

  const flushBuffer = () => {
    if (!buffer) return;
    const cleanText = stripDialoguePreviewPauses(buffer);
    if (cleanText) {
      stack[stack.length - 1].children.push({ type: "text", text: cleanText });
    }
    buffer = "";
  };

  while (index < raw.length) {
    const openIndex = raw.indexOf("[", index);
    if (openIndex < 0) {
      buffer += raw.slice(index);
      break;
    }

    buffer += raw.slice(index, openIndex);
    const closeIndex = raw.indexOf("]", openIndex + 1);
    if (closeIndex < 0) {
      buffer += raw.slice(openIndex);
      break;
    }

    const tagBody = raw.slice(openIndex + 1, closeIndex);
    const tagName = getBbcodeTagName(tagBody);
    const isClosing = tagBody.trim().startsWith("/");

    if (tagName === "lb" || tagName === "rb") {
      flushBuffer();
      stack[stack.length - 1].children.push({ type: "text", text: tagName === "lb" ? "[" : "]" });
      index = closeIndex + 1;
      continue;
    }

    if (dialogueEventTagNames.has(tagName)) {
      flushBuffer();
      if (!isClosing) {
        stack[stack.length - 1].children.push({
          type: "event",
          tagName,
          attrs: parseBbcodeAttributes(tagBody),
          raw: `[${tagBody}]`,
          range: { start: openIndex, end: closeIndex + 1 }
        });
      }
      index = closeIndex + 1;
      continue;
    }

    if (!dialogueBbcodeTagNames.has(tagName)) {
      buffer += raw.slice(openIndex, closeIndex + 1);
      index = closeIndex + 1;
      continue;
    }

    flushBuffer();
    if (isClosing) {
      closeRichTextPreviewTag(stack, tagName, closeIndex + 1);
    } else {
      const span: RichTextAstNode = {
        type: "span",
        tagName,
        attrs: parseBbcodeAttributes(tagBody),
        children: [],
        range: { start: openIndex, end: closeIndex + 1 }
      };
      stack[stack.length - 1].children.push(span);
      stack.push({ tagName, children: span.children, node: span });
    }
    index = closeIndex + 1;
  }

  flushBuffer();
  return root;
}

export function getBbcodeTagName(rawTag: string) {
  let tag = String(rawTag || "").trim().toLowerCase();
  if (!tag) return "";
  if (tag.startsWith("/")) tag = tag.slice(1).trim();
  const separatorIndexes = [" ", "=", "\t", "\n"].map((character) => tag.indexOf(character)).filter((position) => position >= 0);
  if (separatorIndexes.length > 0) tag = tag.slice(0, Math.min(...separatorIndexes));
  return tag.replace(/[^a-z0-9_]/g, "");
}

export function parseBbcodeAttributes(rawTag: string): BbcodeAttributes {
  const attrs: BbcodeAttributes = {};
  const payload = getBbcodeTagPayload(rawTag);
  if (!payload) return attrs;
  if (payload.startsWith("=")) {
    attrs.value = unquoteBbcodeValue(payload.slice(1));
    return attrs;
  }
  for (const token of tokenizeBbcodeAttributes(payload)) {
    const separatorIndex = token.indexOf("=");
    if (separatorIndex >= 0) {
      const key = token.slice(0, separatorIndex).trim().toLowerCase();
      if (key) attrs[key] = unquoteBbcodeValue(token.slice(separatorIndex + 1));
    } else if (token) {
      attrs[token.toLowerCase()] = true;
    }
  }
  return attrs;
}

export function getBbcodeTagPayload(rawTag: string) {
  let body = String(rawTag || "").trim();
  if (body.startsWith("/")) body = body.slice(1).trim();
  const tagName = getBbcodeTagName(body);
  return tagName ? body.slice(tagName.length).trim() : "";
}

export function stripDialoguePreviewPauses(text: string) {
  const raw = String(text || "");
  let out = "";
  let index = 0;
  while (index < raw.length) {
    const character = raw[index];
    if (character === "\\" && index + 1 < raw.length) {
      const next = raw[index + 1];
      if (next === "|" || next === "\\") {
        out += next;
        index += 2;
        continue;
      }
    }
    if (character === "|") {
      index += 1;
      continue;
    }
    out += character;
    index += 1;
  }
  return out;
}

function tokenizeBbcodeAttributes(text: string) {
  const tokens: string[] = [];
  let current = "";
  let quote = "";
  for (const character of String(text || "")) {
    if (quote) {
      current += character;
      if (character === quote) quote = "";
      continue;
    }
    if (character === "\"" || character === "'") {
      quote = character;
      current += character;
      continue;
    }
    if (/\s/.test(character)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += character;
  }
  if (current) tokens.push(current);
  return tokens;
}

function unquoteBbcodeValue(value: unknown) {
  const clean = String(value ?? "").trim();
  if (clean.length >= 2) {
    const first = clean[0];
    const last = clean[clean.length - 1];
    if ((first === "\"" && last === "\"") || (first === "'" && last === "'")) {
      return clean.slice(1, -1);
    }
  }
  return clean;
}

function closeRichTextPreviewTag(
  stack: Array<{ tagName: string; children: RichTextAstNode[]; node?: Extract<RichTextAstNode, { type: "span" }> }>,
  tagName: string,
  endIndex: number
) {
  for (let index = stack.length - 1; index > 0; index -= 1) {
    if (stack[index].tagName === tagName) {
      const node = stack[index].node;
      if (node?.range) node.range.end = endIndex;
      stack.length = index;
      return;
    }
  }
}

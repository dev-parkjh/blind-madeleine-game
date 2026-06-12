import { focusWithoutScroll } from "./focusWithoutScroll";
import type { DialogueTextContextTarget } from "./dialogueTextContextTypes";

const dialogueBbcodeTagNames = new Set([
  "b", "i", "u", "s", "code", "font", "font_size", "font_scale", "color", "bgcolor", "fgcolor",
  "outline_size", "outline_color", "shake", "wave", "tornado", "pulse", "fade",
  "rainbow", "grow", "blink", "alpha", "lie",
  "speed", "text_speed", "type_speed", "typewriter_speed",
  "lb", "rb"
]);

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

function getDialogueBbcodeTagName(body: string) {
  const clean = String(body || "").trim();
  const slashIndex = clean.indexOf("/");
  const head = slashIndex >= 0 ? clean.slice(0, slashIndex) : clean;
  const spaceIndex = head.indexOf(" ");
  const name = (spaceIndex >= 0 ? head.slice(0, spaceIndex) : head).trim().toLowerCase();
  const equalIndex = name.indexOf("=");
  return equalIndex >= 0 ? name.slice(0, equalIndex) : name;
}

function tokenizeDialogueFontScaleGradientText(text: string) {
  const raw = String(text || "");
  const tokens: Array<{ text: string; visible: boolean }> = [];
  let index = 0;
  while (index < raw.length) {
    const char = raw[index];
    if (char === "[") {
      const closeIndex = raw.indexOf("]", index + 1);
      if (closeIndex >= 0) {
        const tag = raw.slice(index, closeIndex + 1);
        const tagName = getDialogueBbcodeTagName(tag.slice(1, -1));
        if (tagName === "lb" || tagName === "rb") {
          tokens.push({ text: tag, visible: true });
          index = closeIndex + 1;
          continue;
        }
        if (dialogueBbcodeTagNames.has(tagName)) {
          tokens.push({ text: tag, visible: false });
          index = closeIndex + 1;
          continue;
        }
      }
    }
    if (char === "\\" && index + 1 < raw.length) {
      const nextChar = raw[index + 1];
      if (nextChar === "|" || nextChar === "\\") {
        tokens.push({ text: raw.slice(index, index + 2), visible: true });
        index += 2;
        continue;
      }
    }
    if (char === "|") {
      tokens.push({ text: char, visible: false });
      index += 1;
      continue;
    }
    const [character] = Array.from(raw.slice(index));
    tokens.push({ text: character, visible: true });
    index += character.length;
  }
  return tokens;
}

export function buildDialogueFontScaleGradientText(text: string, fromScale = 1, toScale = 0.3) {
  const tokens = tokenizeDialogueFontScaleGradientText(text);
  const visibleCount = tokens.reduce((count, token) => count + (token.visible ? 1 : 0), 0);
  if (visibleCount <= 0) return String(text || "");
  const normalizedFrom = normalizeDialogueFontScale(fromScale, 1);
  const normalizedTo = normalizeDialogueFontScale(toScale, 0.3);
  let visibleIndex = 0;
  return tokens.map((token) => {
    if (!token.visible) return token.text;
    const amount = visibleCount <= 1 ? 0 : visibleIndex / (visibleCount - 1);
    visibleIndex += 1;
    const scale = normalizedFrom + (normalizedTo - normalizedFrom) * amount;
    return `[font_scale=${formatDialogueFontScale(scale)}]${token.text}[/font_scale]`;
  }).join("");
}

export function stripDialoguePreviewPauses(text: string) {
  return String(text || "").replace(/\|/g, "").replace(/\\[|\\]/g, "");
}

function dispatchTextareaInput(textarea: HTMLTextAreaElement | HTMLInputElement, inserted: string) {
  const event = typeof InputEvent === "function"
    ? new InputEvent("input", { bubbles: true, data: inserted, inputType: "insertText" })
    : new Event("input", { bubbles: true });
  textarea.dispatchEvent(event);
}

function insertTextWithTextareaUndo(
  textarea: HTMLTextAreaElement | HTMLInputElement | null,
  currentText: string,
  inserted: string,
  onFallbackChange: (nextText: string) => void
) {
  const sourceText = textarea?.value ?? currentText;
  const start = Math.max(0, Math.min(textarea?.selectionStart ?? sourceText.length, sourceText.length));
  const end = Math.max(start, Math.min(textarea?.selectionEnd ?? sourceText.length, sourceText.length));
  const nextText = `${sourceText.slice(0, start)}${inserted}${sourceText.slice(end)}`;
  const caret = start + inserted.length;

  if (!textarea) {
    onFallbackChange(nextText);
    return;
  }

  focusWithoutScroll(textarea);
  textarea.setSelectionRange(start, end);
  const before = textarea.value;
  const canUseNativeUndo = typeof document !== "undefined" && typeof document.execCommand === "function";
  if (canUseNativeUndo && document.execCommand("insertText", false, inserted) && textarea.value !== before) {
    dispatchTextareaInput(textarea, inserted);
    return;
  }

  textarea.setRangeText(inserted, start, end, "end");
  dispatchTextareaInput(textarea, inserted);
  onFallbackChange(nextText);
  window.requestAnimationFrame(() => {
    focusWithoutScroll(textarea);
    textarea.setSelectionRange(caret, caret);
  });
}

export function wrapTextareaSelection(
  target: DialogueTextContextTarget,
  openTag: string,
  closeTag: string,
  onClose: () => void
) {
  const textarea = target.textarea;
  const currentText = target.getText();
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const selectedText = currentText.slice(start, end);
  const replacement = `${openTag}${selectedText}${closeTag}`;
  insertTextWithTextareaUndo(textarea, currentText, replacement, target.onTextChange);
  const selectionStart = start + openTag.length;
  window.requestAnimationFrame(() => {
    focusWithoutScroll(textarea);
    textarea.setSelectionRange(selectionStart, selectionStart + selectedText.length);
  });
  onClose();
}

export function insertDialogueTextAtTarget(target: DialogueTextContextTarget, text: string) {
  insertTextWithTextareaUndo(target.textarea, target.getText(), text, target.onTextChange);
}

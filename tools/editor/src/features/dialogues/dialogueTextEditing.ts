import type { RichTextSourceRange } from "../../components/RichTextPreview";
import { focusWithoutScroll } from "../../lib/focusWithoutScroll";

export function insertTextWithTextareaUndo(
  textarea: HTMLTextAreaElement | null,
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

export function removeTextRangeWithTextareaUndo(
  textarea: HTMLTextAreaElement | null,
  currentText: string,
  range: RichTextSourceRange,
  onFallbackChange: (nextText: string) => void
) {
  const sourceText = textarea?.value ?? currentText;
  const start = Math.max(0, Math.min(range.start, sourceText.length));
  const end = Math.max(start, Math.min(range.end, sourceText.length));
  const nextText = `${sourceText.slice(0, start)}${sourceText.slice(end)}`;

  if (!textarea) {
    onFallbackChange(nextText);
    return;
  }

  focusWithoutScroll(textarea);
  textarea.setSelectionRange(start, end);
  const before = textarea.value;
  const canUseNativeUndo = typeof document !== "undefined" && typeof document.execCommand === "function";
  if (canUseNativeUndo && document.execCommand("delete", false) && textarea.value !== before) {
    dispatchTextareaInput(textarea, "", "deleteContentBackward");
    return;
  }

  textarea.setRangeText("", start, end, "start");
  dispatchTextareaInput(textarea, "", "deleteContentBackward");
  onFallbackChange(nextText);
  window.requestAnimationFrame(() => {
    focusWithoutScroll(textarea);
    textarea.setSelectionRange(start, start);
  });
}

function dispatchTextareaInput(textarea: HTMLTextAreaElement, inserted: string, inputType = "insertText") {
  const event = typeof InputEvent === "function"
    ? new InputEvent("input", { bubbles: true, data: inserted, inputType })
    : new Event("input", { bubbles: true });
  textarea.dispatchEvent(event);
}

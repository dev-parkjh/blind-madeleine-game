import type { EditorLanguage } from "./editorTypes";
import { enEditorCopy } from "./editorCopyEn";
import { koEditorCopy } from "./editorCopyKo";
import type { EditorCopy } from "./editorTextTypes";

export const editorText: Record<EditorLanguage, EditorCopy> = {
  ko: koEditorCopy,
  en: enEditorCopy
};

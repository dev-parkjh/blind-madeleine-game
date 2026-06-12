import { createContext, useContext } from "react";
import type { EditorLanguage } from "./editorTypes";
import { editorText } from "./editorCopies";

export { editorText } from "./editorCopies";
export type { EditorCopy } from "./editorTextTypes";

export const LanguageContext = createContext<EditorLanguage>("ko");

export function useUiText() {
  return editorText[useContext(LanguageContext)];
}

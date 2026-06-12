import { useEffect } from "react";
import type { EditorLanguage, EditorThemeAccent, EditorThemeMode } from "../editorTypes";
import {
  applyEditorAppearance,
  defaultCustomAccent,
  editorCustomAccentStorageKey,
  editorLanguageStorageKey,
  editorThemeAccentStorageKey,
  editorThemeModeStorageKey,
  sanitizeHexColor,
  saveLocalSetting
} from "./editorPreferences";

export function useEditorAppearance({
  customAccent,
  language,
  themeAccent,
  themeMode
}: {
  customAccent: string;
  language: EditorLanguage;
  themeAccent: EditorThemeAccent;
  themeMode: EditorThemeMode;
}) {
  useEffect(() => {
    applyEditorAppearance(language, themeMode, themeAccent, customAccent);
    saveLocalSetting(editorLanguageStorageKey, language);
    saveLocalSetting(editorThemeModeStorageKey, themeMode);
    saveLocalSetting(editorThemeAccentStorageKey, themeAccent);
    saveLocalSetting(editorCustomAccentStorageKey, sanitizeHexColor(customAccent, defaultCustomAccent));
  }, [customAccent, language, themeAccent, themeMode]);
}

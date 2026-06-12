import { useCallback, useRef, useState } from "react";
import type { EditorView } from "@codemirror/view";
import {
  jsonPositionFromLineColumn,
  parseJsonEditorError,
  type JsonEditorError
} from "../../components/JsonEditor";
import { clampNumber } from "../../lib/numeric";
import { formatJson } from "../../lib/resourceConfig";
import type { ResourceRecord } from "../../types";

export function useEditorDraft() {
  const [draft, setDraft] = useState<ResourceRecord | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [savedJsonText, setSavedJsonText] = useState("");
  const [jsonError, setJsonError] = useState<JsonEditorError | null>(null);
  const [dirty, setDirty] = useState(false);
  const jsonEditorViewRef = useRef<EditorView | null>(null);
  const setJsonEditorView = useCallback((view: EditorView | null) => {
    jsonEditorViewRef.current = view;
  }, []);

  function loadDraft(nextDraft: ResourceRecord) {
    const formatted = formatJson(nextDraft);
    setDraft(nextDraft);
    setJsonText(formatted);
    setSavedJsonText(formatted);
    setJsonError(null);
    setDirty(false);
  }

  function clearDraft() {
    setDraft(null);
    setJsonText("");
    setSavedJsonText("");
    setJsonError(null);
    setDirty(false);
  }

  function applyDraft(nextDraft: ResourceRecord) {
    const formatted = formatJson(nextDraft);
    setDraft(nextDraft);
    setJsonText(formatted);
    setJsonError(null);
    setDirty(formatted !== savedJsonText);
  }

  function updateField(field: string, value: unknown) {
    if (!draft) return;
    applyDraft({ ...draft, [field]: value });
  }

  function updateMetadataField(field: string, value: unknown) {
    if (!draft) return;
    const metadata = draft.metadata && typeof draft.metadata === "object" ? draft.metadata : {};
    applyDraft({ ...draft, metadata: { ...metadata, [field]: value } });
  }

  function onJsonChange(text: string) {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setDraft(parsed);
      setJsonError(null);
      setDirty(formatJson(parsed) !== savedJsonText);
    } catch (error) {
      setJsonError(parseJsonEditorError(error, text));
      setDirty(true);
    }
  }

  function formatJsonText() {
    if (!draft) return;
    const formatted = formatJson(draft);
    setJsonText(formatted);
    setJsonError(null);
    setDirty(formatted !== savedJsonText);
  }

  function jumpToJsonError() {
    const editor = jsonEditorViewRef.current;
    if (!editor || !jsonError) return;
    const rawPosition = jsonError.position ?? (
      jsonError.line && jsonError.column
        ? jsonPositionFromLineColumn(jsonText, jsonError.line, jsonError.column)
        : undefined
    );
    if (rawPosition === undefined) return;
    const position = Math.round(clampNumber(rawPosition, 0, editor.state.doc.length, 0));
    editor.focus();
    editor.dispatch({ selection: { anchor: position }, scrollIntoView: true });
  }

  return {
    applyDraft,
    clearDraft,
    dirty,
    draft,
    formatJsonText,
    jsonError,
    jsonText,
    jumpToJsonError,
    loadDraft,
    onJsonChange,
    savedJsonText,
    setJsonEditorView,
    updateField,
    updateMetadataField
  };
}

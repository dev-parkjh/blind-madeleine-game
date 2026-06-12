import { useEffect, useRef } from "react";
import { json } from "@codemirror/lang-json";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as highlightTags } from "@lezer/highlight";
import { basicSetup } from "codemirror";
import { EditorView, placeholder as editorPlaceholder } from "@codemirror/view";
import { useUiText } from "../editorText";

const jsonEditorHighlightStyle = HighlightStyle.define([
  { tag: highlightTags.propertyName, color: "var(--json-token-key)" },
  { tag: highlightTags.string, color: "var(--json-token-string)" },
  { tag: highlightTags.number, color: "var(--json-token-number)" },
  { tag: [highlightTags.bool, highlightTags.null], color: "var(--json-token-literal)" },
  { tag: highlightTags.punctuation, color: "var(--json-token-punctuation)" },
  { tag: highlightTags.invalid, color: "var(--error)" }
]);

export type JsonEditorError = {
  message: string;
  line?: number;
  column?: number;
  position?: number;
  excerpt?: string;
  pointerOffset?: number;
};

export function parseJsonEditorError(error: unknown, text: string): JsonEditorError {
  const message = error instanceof Error ? error.message : String(error || "JSON parse error");
  const positionMatch = message.match(/position\s+(\d+)/i);
  const lineColumnMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  let position = positionMatch ? Number(positionMatch[1]) : undefined;
  let line = lineColumnMatch ? Number(lineColumnMatch[1]) : undefined;
  let column = lineColumnMatch ? Number(lineColumnMatch[2]) : undefined;

  if (position !== undefined && Number.isFinite(position) && (line === undefined || column === undefined)) {
    const location = jsonLineColumnFromPosition(text, position);
    line = location.line;
    column = location.column;
  }
  if ((position === undefined || !Number.isFinite(position)) && line !== undefined && column !== undefined) {
    position = jsonPositionFromLineColumn(text, line, column);
  }

  const excerpt = line !== undefined && column !== undefined ? jsonLineExcerpt(text, line, column) : undefined;
  return {
    message,
    line: Number.isFinite(line) ? line : undefined,
    column: Number.isFinite(column) ? column : undefined,
    position: Number.isFinite(position) ? position : undefined,
    excerpt: excerpt?.text,
    pointerOffset: excerpt?.pointerOffset
  };
}

function jsonLineColumnFromPosition(text: string, position: number) {
  const clampedPosition = Math.max(0, Math.min(Math.round(position), text.length));
  let line = 1;
  let column = 1;
  for (let index = 0; index < clampedPosition; index += 1) {
    if (text[index] === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}

export function jsonPositionFromLineColumn(text: string, line: number, column: number) {
  const safeLine = Math.max(1, Math.round(line));
  const safeColumn = Math.max(1, Math.round(column));
  let currentLine = 1;
  let position = 0;
  while (position < text.length && currentLine < safeLine) {
    if (text[position] === "\n") currentLine += 1;
    position += 1;
  }
  return Math.max(0, Math.min(position + safeColumn - 1, text.length));
}

function jsonLineExcerpt(text: string, line: number, column: number) {
  const lines = text.split("\n");
  const lineText = (lines[Math.max(0, line - 1)] || "").replace(/\r$/, "");
  const pointerOffset = Math.max(0, Math.min(column - 1, lineText.length));
  return {
    text: `${lineText}\n${" ".repeat(pointerOffset)}^`,
    pointerOffset
  };
}

export function formatJsonEditorError(error: JsonEditorError) {
  const location = error.line && error.column
    ? `${error.line}줄 ${error.column}열`
    : error.position !== undefined
      ? `position ${error.position}`
      : "";
  return location ? `${location}: ${error.message}` : error.message;
}


export function JsonCodeEditor({
  value,
  invalid,
  label,
  placeholder,
  placeholderText,
  onChange,
  onView
}: {
  value: string;
  invalid: boolean;
  label: string;
  placeholder?: string;
  placeholderText?: string;
  onChange: (value: string) => void;
  onView: (view: EditorView | null) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const applyingExternalChangeRef = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!hostRef.current) return undefined;
    const view = new EditorView({
      doc: value,
      parent: hostRef.current,
      extensions: [
        basicSetup,
        json(),
        syntaxHighlighting(jsonEditorHighlightStyle),
        editorPlaceholder(placeholderText || placeholder || ""),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (!update.docChanged || applyingExternalChangeRef.current) return;
          onChangeRef.current(update.state.doc.toString());
        })
      ]
    });

    viewRef.current = view;
    onView(view);
    return () => {
      onView(null);
      view.destroy();
      viewRef.current = null;
    };
  }, [label, onView, placeholder, placeholderText]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value === current) return;
    applyingExternalChangeRef.current = true;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value }
    });
    applyingExternalChangeRef.current = false;
  }, [value]);

  return (
    <div
      aria-invalid={invalid}
      aria-label={label}
      className="json-code-editor"
      ref={hostRef}
    />
  );
}

export function JsonErrorPanel({ error, onJump }: { error: JsonEditorError; onJump: () => void }) {
  const ui = useUiText();
  const location = error.line && error.column
    ? `${error.line}줄 ${error.column}열`
    : error.position !== undefined
      ? `position ${error.position}`
      : "위치 확인 불가";
  return (
    <div className="json-error-panel" role="alert">
      <div className="json-error-panel-header">
        <div>
          <strong>{location}</strong>
          <span>{error.message}</span>
        </div>
        <button disabled={error.position === undefined && (!error.line || !error.column)} type="button" onClick={onJump}>
          {ui.common.goToPosition}
        </button>
      </div>
      {error.excerpt && <pre><code>{error.excerpt}</code></pre>}
    </div>
  );
}

import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import { sanitizeHexColor } from "../../lib/editorPreferences";

export function TextField({
  label,
  value,
  onChange,
  multiline,
  previewText,
  type = "text",
  readOnly = false,
  onBlur,
  onKeyDown,
  onContextMenu
}: {
  label: string;
  value: unknown;
  onChange: (value: string) => void;
  multiline?: boolean;
  previewText?: string;
  type?: "text" | "number" | "color-text";
  readOnly?: boolean;
  onBlur?: () => void;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onContextMenu?: (event: ReactMouseEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
}) {
  const stringValue = value === undefined || value === null ? "" : String(value);
  if (type === "color-text") {
    return (
      <ColorTextField
        label={label}
        previewText={previewText}
        readOnly={readOnly}
        value={stringValue}
        onChange={onChange}
      />
    );
  }

  return (
    <label className={`field-block ${multiline ? "wide" : ""} ${readOnly ? "read-only" : ""}`}>
      <span>{label}</span>
      {multiline ? (
        <textarea readOnly={readOnly} spellCheck={false} value={stringValue} onBlur={onBlur} onChange={(event) => onChange(event.target.value)} onContextMenu={onContextMenu} onKeyDown={onKeyDown} />
      ) : (
        <input readOnly={readOnly} spellCheck={false} value={stringValue} onBlur={onBlur} onChange={(event) => onChange(event.target.value)} onContextMenu={onContextMenu} onKeyDown={onKeyDown} type={type === "number" ? "number" : "text"} />
      )}
    </label>
  );
}

export function ColorTextField({
  label,
  value,
  onChange,
  previewText,
  readOnly = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  previewText?: string;
  readOnly?: boolean;
}) {
  const cleanValue = value.trim();
  const hasValue = cleanValue.length > 0;
  const isValid = !hasValue || isHexColorText(cleanValue);
  const previewColor = isValid ? sanitizeHexColor(cleanValue, "#ffffff") : "#ffffff";
  const previewLabel = previewText?.trim() || label;
  const previewStyle = { "--name-color-preview": previewColor } as CSSProperties & Record<string, string>;

  return (
    <label className={`field-block color-field ${readOnly ? "read-only" : ""} ${isValid ? "" : "invalid"}`}>
      <span>{label}</span>
      <div className="color-field-preview" style={previewStyle}>
        <span className="color-preview-swatch" aria-hidden="true" />
        <strong>{previewLabel}</strong>
      </div>
      <div className="color-field-control">
        <input
          aria-invalid={!isValid}
          pattern="#?[0-9a-fA-F]{6}"
          readOnly={readOnly}
          spellCheck={false}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          aria-label={`${label} color picker`}
          className="color-picker-input"
          disabled={readOnly}
          type="color"
          value={sanitizeHexColor(cleanValue, "#ffffff").toLowerCase()}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
      </div>
    </label>
  );
}

function isHexColorText(value: unknown) {
  const text = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(text) || /^[0-9a-f]{6}$/i.test(text);
}

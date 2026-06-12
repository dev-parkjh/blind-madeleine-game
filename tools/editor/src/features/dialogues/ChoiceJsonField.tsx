import { useEffect, useState } from "react";
import { asArray } from "../../lib/resourceConfig";
import { normalizeJsonObject } from "../../lib/records";
import type { ResourceRecord } from "../../types";

export function ChoiceJsonField({
  label,
  value,
  expected,
  onChange
}: {
  label: string;
  value: unknown;
  expected: "object" | "array" | "object_or_array";
  onChange: (value: ResourceRecord | unknown[]) => void;
}) {
  const normalized = expected === "array"
    ? asArray(value)
    : expected === "object_or_array"
      ? Array.isArray(value) || (value && typeof value === "object")
        ? value
        : []
      : normalizeJsonObject(value);
  const serialized = JSON.stringify(normalized, null, 2);
  const [text, setText] = useState(serialized);
  const [error, setError] = useState("");

  useEffect(() => {
    setText(serialized);
    setError("");
  }, [serialized]);

  function commit(nextText = text) {
    try {
      const parsed = JSON.parse(nextText || (expected === "array" ? "[]" : "{}"));
      if (expected === "array" && !Array.isArray(parsed)) {
        setError("배열 JSON이어야 합니다.");
        return;
      }
      if (expected === "object_or_array" && (!parsed || typeof parsed !== "object")) {
        setError("배열 또는 객체 JSON이어야 합니다.");
        return;
      }
      if (expected === "object" && (!parsed || typeof parsed !== "object" || Array.isArray(parsed))) {
        setError("객체 JSON이어야 합니다.");
        return;
      }
      setError("");
      onChange(parsed as ResourceRecord | unknown[]);
    } catch (error) {
      setError((error as Error).message);
    }
  }

  return (
    <label className="field-block choice-json-field wide">
      <span>{label}</span>
      <textarea
        className={error ? "invalid" : ""}
        onBlur={() => commit()}
        onChange={(event) => {
          setText(event.target.value);
          if (error) setError("");
        }}
        spellCheck={false}
        value={text}
      />
      <button type="button" onClick={() => commit()}>JSON 적용</button>
      {error && <p className="json-error">{error}</p>}
    </label>
  );
}

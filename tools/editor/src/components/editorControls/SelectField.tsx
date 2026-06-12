import { useUiText } from "../../editorText";
import type { ResourceSummary } from "../../types";

export function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: unknown;
  options: ResourceSummary[];
  onChange: (value: string) => void;
}) {
  const currentValue = String(value || "");
  const optionIds = new Set(options.map((option) => option.id));
  const ui = useUiText();
  return (
    <label className="field-block">
      <span>{label}</span>
      <select value={currentValue} onChange={(event) => onChange(event.target.value)}>
        <option value="">{ui.common.unspecified}</option>
        {currentValue && !optionIds.has(currentValue) && <option value={currentValue}>{ui.common.currentMissing}: {currentValue} · {ui.common.missing}</option>}
        {options.map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}
      </select>
    </label>
  );
}

export function SelectLiteralField({
  label,
  value,
  options,
  labels,
  onChange
}: {
  label: string;
  value: unknown;
  options: string[];
  labels?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field-block">
      <span>{label}</span>
      <select value={String(value || "")} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{labels?.[option] || option}</option>)}
      </select>
    </label>
  );
}

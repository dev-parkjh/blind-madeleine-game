import { useUiText } from "../../editorText";
import type { ResourceSummary } from "../../types";

export function CheckboxList({
  label,
  values,
  options,
  onToggle
}: {
  label: string;
  values: string[];
  options: ResourceSummary[];
  onToggle: (id: string) => void;
}) {
  const optionIds = new Set(options.map((option) => option.id));
  const missingValues = values.filter((value) => value && !optionIds.has(value));
  const ui = useUiText();
  return (
    <fieldset className="wide checkbox-list">
      <legend>{label}</legend>
      {options.length === 0 && missingValues.length === 0 && <span className="muted">{ui.common.noneAvailable}</span>}
      {options.map((option) => (
        <label key={option.id}>
          <input checked={values.includes(option.id)} onChange={() => onToggle(option.id)} type="checkbox" />
          <span>{option.title}</span>
        </label>
      ))}
      {missingValues.map((id) => (
        <label className="missing" key={id}>
          <input checked onChange={() => onToggle(id)} type="checkbox" />
          <span>{id} · {ui.common.missing}</span>
        </label>
      ))}
    </fieldset>
  );
}

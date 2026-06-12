export function ToggleField({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="field-block toggle-field">
      <span>{label}</span>
      <div className="toggle-control">
        <input aria-label={label} checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      </div>
    </label>
  );
}

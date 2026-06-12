import { formatNumberInput, normalizeNumber, roundForInput } from "../../lib/numeric";
import { Icon } from "./Icon";

export function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  resetValue
}: {
  label: string;
  value: unknown;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  resetValue?: number;
}) {
  const numericValue = normalizeNumber(value, resetValue ?? 0, min, max);

  function commit(nextValue: number) {
    onChange(normalizeNumber(nextValue, numericValue, min, max));
  }

  return (
    <div className="field-block number-field">
      <span>{label}</span>
      <div className="number-control">
        <button aria-label={`${label} decrease`} type="button" onClick={() => commit(roundForInput(numericValue - step))}>
          <Icon name="Remove" />
        </button>
        <input
          inputMode="decimal"
          max={max}
          min={min}
          onChange={(event) => commit(Number(event.target.value))}
          step={step}
          type="number"
          value={formatNumberInput(numericValue)}
        />
        <button aria-label={`${label} increase`} type="button" onClick={() => commit(roundForInput(numericValue + step))}>
          <Icon name="Add" />
        </button>
        {resetValue !== undefined && (
          <button aria-label={`${label} reset`} className="number-reset" type="button" onClick={() => commit(resetValue)}>
            <Icon name="RestartAlt" />
          </button>
        )}
      </div>
    </div>
  );
}

import { Icon } from "./Icon";

export function IconButton({
  icon,
  label,
  onClick,
  disabled,
  filled,
  danger
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  filled?: boolean;
  danger?: boolean;
}) {
  return (
    <button aria-label={label} className={`tool-button ${filled ? "filled" : ""} ${danger ? "danger" : ""}`} disabled={disabled} title={label} type="button" onClick={onClick}>
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  );
}

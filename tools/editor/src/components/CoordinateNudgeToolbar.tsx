import { Icon } from "./EditorControls";
import { clampNumber, round4Number } from "../lib/numeric";

export function CoordinateNudgeToolbar({
  label,
  x,
  y,
  resetX,
  resetY,
  min = 0,
  max = 1,
  step = 0.01,
  onChange
}: {
  label: string;
  x: number;
  y: number;
  resetX: number;
  resetY: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (x: number, y: number) => void;
}) {
  const next = (nextX: number, nextY: number) => onChange(
    round4Number(clampNumber(nextX, min, max, x)),
    round4Number(clampNumber(nextY, min, max, y))
  );
  return (
    <div className="nudge-toolbar" aria-label={`${label} nudge controls`}>
      <button aria-label={`${label} left`} type="button" onClick={() => next(x - step, y)}><Icon name="West" /></button>
      <button aria-label={`${label} up`} type="button" onClick={() => next(x, y - step)}><Icon name="North" /></button>
      <button aria-label={`${label} down`} type="button" onClick={() => next(x, y + step)}><Icon name="South" /></button>
      <button aria-label={`${label} right`} type="button" onClick={() => next(x + step, y)}><Icon name="East" /></button>
      <button aria-label={`${label} reset`} type="button" onClick={() => next(resetX, resetY)}><Icon name="CenterFocusStrong" /></button>
    </div>
  );
}

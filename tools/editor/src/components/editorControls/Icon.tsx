import { iconPath } from "../../lib/resourceConfig";

export function Icon({ name }: { name: string }) {
  return <img aria-hidden="true" className="app-icon" src={iconPath(name)} />;
}

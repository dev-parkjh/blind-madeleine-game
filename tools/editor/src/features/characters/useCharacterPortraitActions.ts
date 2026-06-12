import type { ResourceRecord, ResourceType } from "../../types";
import { profileZoomDefault } from "./portraitModel";

export function useCharacterPortraitActions({
  draft,
  type,
  updateField
}: {
  draft: ResourceRecord | null;
  type: ResourceType;
  updateField: (field: string, value: unknown) => void;
}) {
  function addCharacterPortrait() {
    if (type !== "characters" || !draft) return;
    const portraits = draft.portraits && typeof draft.portraits === "object" && !Array.isArray(draft.portraits)
      ? draft.portraits as Record<string, ResourceRecord | string>
      : {};
    const entries = Object.entries(portraits);
    const key = portraits.default ? `portrait_${entries.length + 1}` : "default";
    updateField("portraits", {
      ...portraits,
      [key]: { path: "", center: [0.5, 0.5], profile: { zoom: profileZoomDefault, offset: [0, 0] } }
    });
  }

  return { addCharacterPortrait };
}

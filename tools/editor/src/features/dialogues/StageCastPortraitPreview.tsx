import { resPathToAssetUrl } from "../../lib/resourcePaths";
import { getPortraitCenterPoint } from "../characters/portraitModel";
import { ProfileCropFrame } from "../characters/ProfileCropFrame";
import type { StageCastPreviewEntry } from "./StageCastScenePreview";

export function CastPortraitPreview({ entry }: { entry: StageCastPreviewEntry }) {
  const imageUrl = resPathToAssetUrl(entry.portrait?.path);
  const faceCenter = getPortraitCenterPoint(entry.portrait?.center || []);
  return (
    <div className={`cast-portrait-preview ${entry.mystery ? "mystery" : ""}`}>
      {imageUrl ? (
        <ProfileCropFrame
          compact
          faceCenter={faceCenter}
          imagePath={entry.portrait?.path}
          profile={entry.portrait?.profile || {}}
        />
      ) : <span>{entry.characterId === "mystery" ? "???" : "NO"}</span>}
    </div>
  );
}

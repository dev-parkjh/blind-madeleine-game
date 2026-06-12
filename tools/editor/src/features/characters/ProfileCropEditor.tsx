import { CoordinateNudgeToolbar } from "../../components/CoordinateNudgeToolbar";
import { DragLockToggle, useMobileDragLock } from "../../components/DragLock";
import { Icon } from "../../components/EditorControls";
import type { PointerPoint } from "../../editorTypes";
import type { ResourceRecord } from "../../types";
import { ProfileCropFrame } from "./ProfileCropFrame";
import {
  getProfileOffset,
  getProfileZoom,
  profileCropSummary,
  profileZoomDefault,
  profileZoomStep,
  withProfileOffset,
  withProfileZoom
} from "./portraitModel";

export function ProfileCropEditor({
  faceCenter,
  imagePath,
  profile,
  onChangeProfile
}: {
  faceCenter: PointerPoint;
  imagePath: unknown;
  profile: ResourceRecord;
  onChangeProfile: (nextProfile: ResourceRecord) => void;
}) {
  const dragLock = useMobileDragLock();
  const offset = getProfileOffset(profile);

  return (
    <div className="profile-crop-editor">
      <div className="coordinate-editor-header">
        <span>Profile crop</span>
        <div className="coordinate-editor-meta">
          <code>{profileCropSummary(profile)}</code>
          <DragLockToggle
            available={dragLock.available}
            locked={dragLock.locked}
            onToggle={dragLock.toggle}
          />
        </div>
      </div>
      <ProfileCropFrame
        dragLocked={dragLock.locked}
        faceCenter={faceCenter}
        imagePath={imagePath}
        profile={profile}
        onChangeProfile={onChangeProfile}
      />
      <div className="profile-crop-actions">
        <button type="button" onClick={() => onChangeProfile(withProfileZoom(profile, getProfileZoom(profile.zoom) - profileZoomStep))}><Icon name="ZoomOut" />축소</button>
        <button type="button" onClick={() => onChangeProfile(withProfileOffset(withProfileZoom(profile, profileZoomDefault), { x: 0, y: 0 }))}><Icon name="Restore" />리셋</button>
        <button type="button" onClick={() => onChangeProfile(withProfileZoom(profile, getProfileZoom(profile.zoom) + profileZoomStep))}><Icon name="ZoomIn" />확대</button>
      </div>
      <CoordinateNudgeToolbar
        label="Profile crop offset"
        max={1}
        min={-1}
        onChange={(x, y) => onChangeProfile(withProfileOffset(profile, { x, y }))}
        resetX={0}
        resetY={0}
        step={0.01}
        x={offset.x}
        y={offset.y}
      />
    </div>
  );
}

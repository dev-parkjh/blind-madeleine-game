import type { EditorLanguage } from "../../editorTypes";
import type { Live2dAngleField, Live2dMotionField } from "./live2dModel";

export function live2dEditorCopy(language: EditorLanguage) {
  const ko = language === "ko";
  return {
    title: ko ? "Live2D 파츠 애니메이션" : "Live2D-style parts animation",
    openSettings: ko ? "설정 열기" : "Open settings",
    close: ko ? "닫기" : "Close",
    previewTab: ko ? "미리보기" : "Preview",
    setupTab: ko ? "기본 설정" : "Setup",
    partsTab: ko ? "파츠" : "Parts",
    angleTab: ko ? "각도 리그" : "Angle rig",
    motionsTab: ko ? "모션" : "Motions",
    enabled: ko ? "게임에서 파츠 표시" : "Render parts in game",
    enabledOn: ko ? "켜짐" : "On",
    enabledOff: ko ? "꺼짐" : "Off",
    defaultMotion: ko ? "기본 모션" : "Default motion",
    previewMotion: ko ? "시뮬레이션 모션" : "Simulation motion",
    previewAngle: ko ? "시뮬레이션 각도" : "Simulation angle",
    play: ko ? "재생" : "Play",
    pause: ko ? "정지" : "Pause",
    resetPreview: ko ? "처음으로" : "Reset",
    canvasWidth: ko ? "캔버스 폭" : "Canvas width",
    canvasHeight: ko ? "캔버스 높이" : "Canvas height",
    centerX: ko ? "중심 X" : "Center X",
    centerY: ko ? "중심 Y" : "Center Y",
    addPart: ko ? "파츠" : "Part",
    addMotion: ko ? "모션" : "Motion",
    parts: ko ? "파츠" : "Parts",
    noParts: ko ? "등록된 파츠가 없습니다." : "No parts configured.",
    motions: ko ? "모션" : "Motions",
    noMotions: ko ? "등록된 모션이 없습니다." : "No motions configured.",
    angleRig: ko ? "각도 리그" : "Angle rig",
    angleEnabled: ko ? "각도 리그 사용" : "Use angle rig",
    angleMax: ko ? "최대 각도" : "Max angle",
    angleMirror: ko ? "좌우 자동 반전" : "Mirror left/right",
    angleNeedsParts: ko ? "각도 리그를 편집하려면 파츠를 먼저 추가하세요." : "Add parts before editing the angle rig.",
    partId: ko ? "파츠 ID" : "Part ID",
    path: ko ? "경로" : "Path",
    uploadPart: ko ? "파츠 업로드" : "Upload part",
    zIndex: ko ? "Z 순서" : "Z order",
    x: "X",
    y: "Y",
    anchorX: ko ? "앵커 X" : "Anchor X",
    anchorY: ko ? "앵커 Y" : "Anchor Y",
    scaleX: ko ? "스케일 X" : "Scale X",
    scaleY: ko ? "스케일 Y" : "Scale Y",
    rotation: ko ? "회전" : "Rotation",
    opacity: ko ? "투명도" : "Opacity",
    deletePart: ko ? "파츠 삭제" : "Delete part",
    motionKey: ko ? "모션 키" : "Motion key",
    motionSummary: ko ? "파츠별 흔들림" : "Per-part motion",
    speed: ko ? "속도" : "Speed",
    deleteMotion: ko ? "모션 삭제" : "Delete motion",
    motionNeedsParts: ko ? "모션을 편집하려면 파츠를 먼저 추가하세요." : "Add parts before editing motion.",
    motionFields: {
      x: ko ? "흔들림 X" : "Move X",
      y: ko ? "흔들림 Y" : "Move Y",
      rotation: ko ? "회전폭" : "Rotate",
      scale: ko ? "스케일폭" : "Scale",
      opacity: ko ? "알파폭" : "Alpha",
      frequency: ko ? "주기" : "Frequency",
      phase: ko ? "위상" : "Phase"
    } satisfies Record<Live2dMotionField, string>,
    angleFields: {
      x: ko ? "45도 X" : "45° X",
      y: ko ? "45도 Y" : "45° Y",
      rotation: ko ? "45도 회전" : "45° rotation",
      scaleX: ko ? "45도 스케일 X" : "45° scale X",
      scaleY: ko ? "45도 스케일 Y" : "45° scale Y",
      skewX: ko ? "45도 기울기 X" : "45° skew X",
      skewY: ko ? "45도 기울기 Y" : "45° skew Y",
      opacity: ko ? "45도 알파" : "45° alpha"
    } satisfies Record<Live2dAngleField, string>
  };
}

export type Live2dEditorCopy = ReturnType<typeof live2dEditorCopy>;

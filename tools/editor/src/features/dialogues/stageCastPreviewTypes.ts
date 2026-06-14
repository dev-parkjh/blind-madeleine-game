import type { PointerPoint } from "../../editorTypes";
import type { ResourceRecord } from "../../types";

export type StageCastActualPreviewContext = {
  bridgeEndpoint: string;
  dialogueDraft: ResourceRecord;
  dialogueId: string;
  nodeId: string;
  previousNodeId: string;
  notify: (message: string) => void;
};

export type StageCastPreviewEntry = {
  characterId: string;
  character: ResourceRecord | undefined;
  index: number;
  inherited: { index: number; entry: ResourceRecord } | null;
  isSpeaker: boolean;
  isFocused: boolean;
  label: string;
  portrait: { key: string; path: string; center: number[]; profile: ResourceRecord } | null;
  position: string;
  offset: PointerPoint;
  positionOrder: number;
  animationOrder: number;
  animationSpeed: number;
  portraitOpacity: number;
  portraitZoom: number;
  flipH: boolean;
  mystery: boolean;
  hasLive2dControls: boolean;
  adaptiveLive2dPose: boolean;
  live2dPoseHint: string;
  live2dMotionLoop: boolean;
  live2dDialogueMotion: boolean;
  live2dDialogueMotionReady: boolean;
  live2dMotionClip: string;
  live2dIdleMotionClip: string;
  live2dTalkMotionClip: string;
  live2dVisemeMotionClip: string;
  live2dSuggestedIdleMotionClip: string;
  live2dSuggestedTalkMotionClip: string;
  live2dSuggestedVisemeMotionClip: string;
  live2dMotionClips: Array<{ value: string; label: string }>;
  live2dMotionPreviewFrames: StageCastLive2dMotionPreviewFrame[];
  live2dMotionPreviewDuration: number;
  live2dPoseTags: string[];
  live2dMotionTime: number;
  live2dMotionProgress: number;
  live2dMotionSpeed: number;
  live2dMotionBlendDuration: number;
  hasLive2dMotionTime: boolean;
  hasLive2dMotionProgress: boolean;
  hasLive2dMotionBlendDuration: boolean;
};

export type StageCastLive2dMotionPreviewFrame = {
  key: string;
  path: string;
  center: number[];
  profile: ResourceRecord;
  time: number;
  clipId: string;
};

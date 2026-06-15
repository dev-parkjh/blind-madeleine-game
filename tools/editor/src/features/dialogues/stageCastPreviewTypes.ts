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
  hasPortraitRigControls: boolean;
  adaptivePortraitRigPose: boolean;
  portraitRigPoseHint: string;
  portraitRigMotionLoop: boolean;
  portraitRigDialogueMotion: boolean;
  portraitRigDialogueMotionReady: boolean;
  portraitRigMotionClip: string;
  portraitRigIdleMotionClip: string;
  portraitRigTalkMotionClip: string;
  portraitRigVisemeMotionClip: string;
  portraitRigSuggestedIdleMotionClip: string;
  portraitRigSuggestedTalkMotionClip: string;
  portraitRigSuggestedVisemeMotionClip: string;
  portraitRigMotionClips: Array<{ value: string; label: string }>;
  portraitRigMotionPreviewFrames: StageCastPortraitRigMotionPreviewFrame[];
  portraitRigMotionPreviewDuration: number;
  portraitRigPoseTags: string[];
  portraitRigMotionTime: number;
  portraitRigMotionProgress: number;
  portraitRigMotionSpeed: number;
  portraitRigMotionBlendDuration: number;
  hasPortraitRigMotionTime: boolean;
  hasPortraitRigMotionProgress: boolean;
  hasPortraitRigMotionBlendDuration: boolean;
};

export type StageCastPortraitRigMotionPreviewFrame = {
  key: string;
  path: string;
  center: number[];
  profile: ResourceRecord;
  time: number;
  clipId: string;
};

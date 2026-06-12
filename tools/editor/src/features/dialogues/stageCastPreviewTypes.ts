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
};

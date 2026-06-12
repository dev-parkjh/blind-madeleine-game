import type { ChangeEvent, CSSProperties, DragEvent as ReactDragEvent, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, MutableRefObject, PointerEvent as ReactPointerEvent, ReactNode, SyntheticEvent, WheelEvent as ReactWheelEvent } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { json } from "@codemirror/lang-json";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as highlightTags } from "@lezer/highlight";
import { basicSetup } from "codemirror";
import { EditorView, placeholder as editorPlaceholder } from "@codemirror/view";
import {
  createResource,
  deleteResource,
  getProjectSummary,
  listResources,
  loadResource,
  saveResource,
  uploadProjectFile
} from "./lib/api";
import {
  DialogueBbcodeContextMenu,
  openDialogueTextContextMenu,
  useDialogueTextContextMenuDismiss,
  type DialogueEventContextAction,
  type DialogueTextContextMenuState,
  type DialogueTextContextTarget
} from "./lib/dialogueTextContextMenu";
import { blurFocusedFieldForContainerWheel, focusWithoutScroll } from "./lib/focusWithoutScroll";
import {
  StoryAssetPickerOverlay,
  type StoryAssetPickerState
} from "./lib/storyAssetPicker";
import {
  asArray,
  countArray,
  formatJson,
  iconPath,
  makeUuid,
  normalizeKind,
  resourceConfig,
  resourceOrder,
  titleFor
} from "./lib/resourceConfig";
import { collectValidationIssues } from "./lib/validation";
import type { ProjectSummary, ResourceRecord, ResourceSummary, ResourceType, ValidationIssue } from "./types";

type EditorTab = "form" | "nodes" | "graph" | "json" | "preview";
type MobilePanel = "library" | "workspace" | "inspector";
type EditorLanguage = "ko" | "en";
type EditorThemeMode = "dark" | "light";
type EditorThemeAccent = "green" | "blue" | "rose" | "amber" | "custom";
type DialogueNodeMode = "dialogue" | "stage" | "cutscene";
type PreviewMode = "web" | "pc" | "fold7" | "fold7-open";
type PointerPoint = { x: number; y: number };
type StatementReactionPath = { statementIndex: number; lieIndex: number; reactionIndex: number };
type StatementReactionNodePath = StatementReactionPath & { childIndex: number };
type StatementScrollTarget =
  | { kind: "statement"; statementIndex: number }
  | { kind: "reaction"; path: StatementReactionPath }
  | { kind: "child"; path: StatementReactionNodePath };
type JsonEditorError = {
  message: string;
  line?: number;
  column?: number;
  position?: number;
  excerpt?: string;
  pointerOffset?: number;
};
type BbcodeAttributes = Record<string, string | boolean>;
type RichTextSourceRange = { start: number; end: number };
type RichTextAstNode =
  | { type: "text"; text: string }
  | { type: "span"; tagName: string; attrs: BbcodeAttributes; children: RichTextAstNode[]; range?: RichTextSourceRange }
  | { type: "event"; tagName: string; attrs: BbcodeAttributes; raw: string; range: RichTextSourceRange };
type RichTextTagPresentation = {
  classNames: string[];
  style: CSSProperties;
  title?: string;
  dataNote?: string;
};
type TagActionCategory = "format" | "color" | "motion" | "typing" | "media" | "flow";
type TagAction = {
  label: string;
  hint: string;
  category: TagActionCategory;
  open?: string;
  close?: string;
  insert?: string;
  previewText?: string;
  badge?: string;
};
type RichTextMotionConfig = {
  tagName: string;
  variableName: "--rich-text-shake-level" | "--rich-text-wave-amp" | "--rich-text-tornado-radius";
  amount: number;
  duration: number;
  phaseStep: number;
};
type GodotImportStatus = { ok: boolean; error: string };
type ProjectAssetUploadResult = {
  relativePath?: string;
  resPath: string;
  bytes?: number;
  importStatus?: GodotImportStatus;
};
type ProjectAssetUploader = (relativePath: string, file: File) => Promise<ProjectAssetUploadResult>;
type StageCastActualPreviewContext = {
  bridgeEndpoint: string;
  dialogueDraft: ResourceRecord;
  dialogueId: string;
  nodeId: string;
  previousNodeId: string;
  notify: (message: string) => void;
};
type ChapterArtSnapshot = {
  chapterId: string;
  payload: ResourceRecord;
  serialized: string;
};
type DialogueBackgroundEditorValue = {
  enabled: boolean;
  range?: RichTextSourceRange;
  id: string;
  path: string;
  transition: string;
  duration: number;
  opacity: number;
  blur: number;
  brightness: number;
  saturate: number;
  dim: number;
  fixed: boolean;
  zoom: number;
  x: number;
  y: number;
};
type ParallaxVisualDrag =
  | { mode: "position"; index: number; startX: number; startY: number; originalX: number; originalY: number }
  | { mode: "anchor"; index: number; stageRect: DOMRect; centerX: number; centerY: number; width: number; height: number; anchorX: number; anchorY: number; rotation: number }
  | { mode: "scale"; index: number; pivot: PointerPoint; startDistance: number; originalScale: number; originalScaleX: number; originalScaleY: number }
  | { mode: "rotation"; index: number; pivot: PointerPoint; startAngle: number; originalRotation: number }
  | { mode: "title-position"; startX: number; startY: number; originalX: number; originalY: number }
  | { mode: "title-scale"; pivot: PointerPoint; startDistance: number; originalScale: number; originalScaleX: number; originalScaleY: number }
  | { mode: "preview-offset"; startX: number; startY: number; originalX: number; originalY: number };
type ParallaxVisualEntry =
  | { type: "layer"; layer: ResourceRecord; index: number; order: number; depth: number }
  | { type: "title"; title: ResourceRecord; order: number; depth: number };

const chapterThumbnailWidth = 1920;
const chapterThumbnailHeight = 1080;
const profileCropCanvasSize = 220;
const profileZoomDefault = 3;
const profileZoomMin = 1;
const profileZoomMax = 6;
const profileZoomStep = 0.5;
const portraitCenterCanvasWidth = 300;
const portraitCenterCanvasHeight = 380;
const portraitCenterZoomDefault = 1;
const portraitCenterZoomMin = 0.5;
const portraitCenterZoomMax = 5;
const portraitCenterZoomStep = 0.5;
const portraitCenterAnchorX = 0.5;
const portraitCenterAnchorYAt100 = 0.2;
const portraitCenterAnchorYAt500 = 0.5;
const portraitCenterAnchorYZoomLo = 1;
const portraitCenterAnchorYZoomHi = 5;
const portraitEditorCanvasWidth = 300;
const portraitEditorCanvasHeight = 380;
const live2dCanvasWidthDefault = 1000;
const live2dCanvasHeightDefault = 1400;
const live2dMotionSpeedDefault = 1;
const live2dMotionFrequencyDefault = 1;
const godotWebPreviewModes: Array<{ id: PreviewMode; width: number; height: number; device: string }> = [
  { id: "web", width: 16, height: 9, device: "" },
  { id: "pc", width: 16, height: 9, device: "pc" },
  { id: "fold7", width: 2520, height: 1080, device: "fold7" },
  { id: "fold7-open", width: 2184, height: 1968, device: "fold7_open" }
];
const gameFaceAnchorX = 0.5;
const gameFaceAnchorY = 0.34;
const gamePortraitZoomPercent = 300;
const spectrumPreviewWidthRatio = 0.76;
const gameReferenceWidth = 1920;
const gameReferenceHeight = 1080;
const gameDialoguePanelMinHeight = 285;
const gameStageGapHeight = 18;
const gameCharacterLayerWidth = gameReferenceWidth;
const gameCharacterLayerHeight = gameReferenceHeight - gameDialoguePanelMinHeight - gameStageGapHeight;
const popupDefaultSize = { x: 320, y: 320 };
const popupPositionPresets: Record<string, PointerPoint> = {
  left: { x: 0.24, y: 0.38 },
  center: { x: 0.5, y: 0.36 },
  right: { x: 0.76, y: 0.38 },
  top_left: { x: 0.22, y: 0.22 },
  top_right: { x: 0.78, y: 0.22 },
  custom: { x: 0.5, y: 0.36 }
};
const portraitFitPadding = 0.92;
const portraitZoomMin = 100;
const portraitZoomMax = 500;
const portraitZoomStep = 50;
const portraitZoomDefault = 300;
const stageCastDefaultOpacity = 1;
const stageCastUnfocusedOpacity = 0.7;
const stageCastDefaultAnimationSpeed = 1;
const stageCastAnimationOrderDefault = 1;
const portraitFaceAnchor = { x: 0.5, y: 0.34 };
const portraitZoomOutBodyAnchor = { x: 0.5, y: 0.3709 };
const portraitZoomOutBodyBlendStart = 300;
const portraitZoomOutBodyBlendEnd = 250;
const portraitPositionPresets: Record<string, PointerPoint> = {
  far_left: { x: -0.36, y: 0 },
  left: { x: -0.22, y: 0 },
  center: { x: 0, y: 0 },
  right: { x: 0.22, y: 0 },
  far_right: { x: 0.36, y: 0 }
};
const stageCastPositionOptions = ["far_left", "left", "center", "right", "far_right", "custom"] as const;
const portraitPositionStackSpreadStep = 0.16;
const portraitPositionStackMinX = -0.42;
const portraitPositionStackMaxX = 0.42;
const choicePreviewPanelWidth = 540;
const choicePreviewPanelMinWidth = 420;
const choicePreviewPanelMaxWidth = 620;
const choicePreviewButtonHeight = 78;
const choicePreviewGap = 18;
const choicePreviewDialogueWidthMinScale = 0.46;
const choicePreviewHeightMinScale = 0.52;
const choicePreviewMarginX = 64;
const choicePreviewMarginTop = 64;
const choicePreviewMarginBottom = 96;
const choicePreviewCenterDeadzone = 0.08;
const choicePreviewAnchorGapMinSmallX = 48;
const choicePreviewAnchorGapMinLargeX = 140;
const choicePreviewAnchorGapMaxSmallX = 120;
const choicePreviewAnchorGapMaxLargeX = 420;
const choicePreviewBoundaryWeightSmall = 0.44;
const choicePreviewBoundaryWeightAtDefault = 0.64;
const choicePreviewBoundaryWeightLarge = 0.74;
const choicePreviewVerticalStackCenterY = 345;
const choicePreviewSpeakerScaleBlend = 0.45;
const choicePreviewSpeakerScaleMin = 0.70;
const choicePreviewSpeakerScaleMax = 1.0;
const choicePreviewCharacterEdgePaddingX = 24;
const choicePreviewFaceReferenceHalfWidth = 120;
const godotPreviewEndpointStorageKey = "blind-madeleine-godot-preview-endpoint";
const editorLanguageStorageKey = "blind-madeleine-editor-language";
const editorThemeModeStorageKey = "blind-madeleine-editor-theme-mode";
const editorThemeAccentStorageKey = "blind-madeleine-editor-theme-accent";
const editorCustomAccentStorageKey = "blind-madeleine-editor-custom-accent";
const editorBackGuardStateKey = "blind-madeleine-editor-back-guard";
const godotPreviewDefaultEndpoint = "/api/godot-preview";
const godotPreviewLegacyLoopbackPorts = new Set(["51234"]);
const defaultCustomAccent = "#9bdcb9";
const dialogueNodeModeOptions: DialogueNodeMode[] = ["dialogue", "stage", "cutscene"];
const jsonEditorHighlightStyle = HighlightStyle.define([
  { tag: highlightTags.propertyName, color: "var(--json-token-key)" },
  { tag: highlightTags.string, color: "var(--json-token-string)" },
  { tag: highlightTags.number, color: "var(--json-token-number)" },
  { tag: [highlightTags.bool, highlightTags.null], color: "var(--json-token-literal)" },
  { tag: highlightTags.punctuation, color: "var(--json-token-punctuation)" },
  { tag: highlightTags.invalid, color: "var(--error)" }
]);

type EditorCopy = {
  brandTitle: string;
  brandSubtitle: string;
  toolbar: Record<"refresh" | "create" | "delete" | "save" | "play", string>;
  settings: Record<
    | "label"
    | "language"
    | "korean"
    | "english"
    | "theme"
    | "themeMode"
    | "dark"
    | "light"
    | "accent"
    | "green"
    | "blue"
    | "rose"
    | "amber"
    | "custom"
    | "customColor",
    string
  >;
  mobile: Record<MobilePanel, string>;
  resources: Record<ResourceType, string>;
  panels: Record<"resourceNav" | "collection" | "library" | "workspace" | "inspector" | "project" | "validation", string>;
  tabs: Record<EditorTab, string>;
  presentationModes: Record<"normal" | "talk" | "investigation" | "statement", string>;
  status: Record<"jsonError" | "dirty" | "clean", string>;
  common: Record<"search" | "emptyList" | "format" | "unspecified" | "currentMissing" | "noneAvailable" | "missing" | "uploading" | "delete" | "selectItem" | "goToPosition", string>;
  form: Record<
    | "empty"
    | "id"
    | "label"
    | "description"
    | "chapters"
    | "startNode"
    | "presentationMode"
    | "nextDialogue"
    | "metadata"
    | "displayName"
    | "nameColor"
    | "protagonist"
    | "voiceProfile"
    | "title"
    | "order"
    | "startDialogue"
    | "dialogues"
    | "name"
    | "image"
    | "uploadItemImage"
    | "kind"
    | "path"
    | "uploadAssetFile"
    | "volume"
    | "fixedBackground"
    | "mode"
    | "modeDialogue"
    | "modeStage"
    | "modeCutscene"
    | "speaker"
    | "speakerAutoClean"
    | "speakerAutoCleanConfirmManualRemove"
    | "nextNode"
    | "speakerMystery"
    | "textSoundMuted"
    | "text"
    | "fadeIn"
    | "hold"
    | "fadeOut"
    | "statementNotebook"
    | "customStatementScope"
    | "defaultStatementScope"
    | "notebookCharacters"
    | "notebookItems"
    | "portraits"
    | "addPortrait"
    | "noPortraits"
    | "key"
    | "uploadPortrait"
    | "center"
    | "centerX"
    | "centerY"
    | "profileZoom"
    | "profileOffsetX"
    | "profileOffsetY"
    | "stageCast"
    | "focusTargets"
    | "addCharacter"
    | "noStageCast"
    | "portrait"
    | "live2dAngle"
    | "position"
    | "positionFarLeft"
    | "positionLeft"
    | "positionCenter"
    | "positionRight"
    | "positionFarRight"
    | "positionCustom"
    | "offsetX"
    | "offsetY"
    | "positionOrder"
    | "animationOrder"
    | "zoom"
    | "opacity"
    | "animationSpeed"
    | "flipX"
    | "mystery"
    | "exit"
    | "stagePreview"
    | "visible"
    | "previewEmpty"
    | "offset"
    | "popups"
    | "addPopup"
    | "noPopups"
    | "popupKind"
    | "popupCharacter"
    | "popupItem"
    | "popupImagePath"
    | "popupPortraitDefault"
    | "popupWidth"
    | "popupHeight"
    | "popupScale"
    | "popupTransition"
    | "popupPositionTopLeft"
    | "popupPositionTopRight"
    | "popupSourceCharacterProfile"
    | "popupSourceItem"
    | "popupSourceImage"
    | "popupTransitionFade"
    | "popupTransitionPop"
    | "popupTransitionSlide"
    | "popupTransitionNone"
    | "popupImageMode"
    | "popupImageZoom"
    | "popupImageModeFit"
    | "popupImageModeCover"
    | "popupImageModeCrop",
    string
  >;
  preview: Record<
    | "select"
    | "title"
    | "summary"
    | "eventTags"
    | "parallaxLayers"
    | "web"
    | "pc"
    | "fold7"
    | "fold7Open"
    | "actualPreview"
    | "actualPreviewUnavailable"
    | "actualPreviewReady"
    | "actualPreviewPreparing"
    | "actualPreviewBuilding"
    | "actualPreviewBuild"
    | "godotRun"
    | "currentDialogue"
    | "previousDialogue"
    | "refresh"
    | "openInNewTab"
    | "bridgeRequired",
    string
  >;
};

const editorText: Record<EditorLanguage, EditorCopy> = {
  ko: {
    brandTitle: "Blind Madeleine 에디터",
    brandSubtitle: "로컬 데이터 서버",
    toolbar: {
      refresh: "새로고침",
      create: "새 항목",
      delete: "삭제",
      save: "저장",
      play: "실행"
    },
    settings: {
      label: "환경 설정",
      language: "언어",
      korean: "한국어",
      english: "English",
      theme: "테마",
      themeMode: "화면 모드",
      dark: "다크",
      light: "라이트",
      accent: "색상",
      green: "그린",
      blue: "블루",
      rose: "로즈",
      amber: "앰버",
      custom: "사용자",
      customColor: "사용자 색상"
    },
    mobile: {
      library: "목록",
      workspace: "편집",
      inspector: "검증"
    },
    resources: {
      dialogues: "대사",
      characters: "캐릭터",
      chapters: "챕터",
      items: "아이템",
      story_assets: "스토리 에셋"
    },
    panels: {
      resourceNav: "데이터 타입",
      collection: "데이터 목록",
      library: "라이브러리",
      workspace: "편집 영역",
      inspector: "검증 패널",
      project: "프로젝트",
      validation: "검증"
    },
    tabs: {
      form: "폼",
      nodes: "노드",
      graph: "그래프",
      json: "JSON",
      preview: "미리보기"
    },
    presentationModes: {
      normal: "일반",
      talk: "대화",
      investigation: "조사",
      statement: "진술"
    },
    status: {
      jsonError: "JSON 오류",
      dirty: "수정됨",
      clean: "저장됨"
    },
    common: {
      search: "검색",
      emptyList: "표시할 항목이 없습니다.",
      format: "정렬",
      unspecified: "미지정",
      currentMissing: "현재 값",
      noneAvailable: "선택 가능한 항목이 없습니다.",
      missing: "없음",
      uploading: "업로드 중...",
      delete: "삭제",
      selectItem: "항목을 선택하세요.",
      goToPosition: "위치로 이동"
    },
    form: {
      empty: "편집할 항목을 선택하세요.",
      id: "ID / 파일명",
      label: "라벨",
      description: "설명",
      chapters: "챕터",
      startNode: "시작 노드",
      presentationMode: "표시 모드",
      nextDialogue: "다음 대사",
      metadata: "메타데이터",
      displayName: "표시 이름",
      nameColor: "이름 색상",
      protagonist: "주인공",
      voiceProfile: "보이스 프로필 메타데이터",
      title: "제목",
      order: "순서",
      startDialogue: "시작 대사",
      dialogues: "대사",
      name: "이름",
      image: "이미지",
      uploadItemImage: "아이템 이미지 업로드",
      kind: "종류",
      path: "경로",
      uploadAssetFile: "에셋 파일 업로드",
      volume: "볼륨",
      fixedBackground: "고정 배경",
      mode: "모드",
      modeDialogue: "대사",
      modeStage: "무대",
      modeCutscene: "컷씬",
      speaker: "화자",
      speakerAutoClean: "화자 자동정리",
      speakerAutoCleanConfirmManualRemove: "사용자가 직접 추가한 무대 캐릭터도 제거할까요?",
      nextNode: "다음 노드",
      speakerMystery: "화자 숨김",
      textSoundMuted: "대사음 음소거",
      text: "본문",
      fadeIn: "페이드 인",
      hold: "유지",
      fadeOut: "페이드 아웃",
      statementNotebook: "진술 노트",
      customStatementScope: "진술 노트 범위 직접 지정",
      defaultStatementScope: "기본 진술 노트 범위를 사용합니다.",
      notebookCharacters: "노트 캐릭터",
      notebookItems: "노트 아이템",
      portraits: "초상",
      addPortrait: "초상",
      noPortraits: "초상 없음",
      key: "키",
      uploadPortrait: "초상 업로드",
      center: "중심",
      centerX: "중심 X",
      centerY: "중심 Y",
      profileZoom: "프로필 확대",
      profileOffsetX: "프로필 오프셋 X",
      profileOffsetY: "프로필 오프셋 Y",
      stageCast: "무대 캐스트",
      focusTargets: "주목 목록",
      addCharacter: "캐릭터 추가",
      noStageCast: "무대 캐스트 없음",
      portrait: "초상",
      live2dAngle: "Live2D 각도",
      position: "위치",
      positionFarLeft: "먼 왼쪽",
      positionLeft: "왼쪽",
      positionCenter: "가운데",
      positionRight: "오른쪽",
      positionFarRight: "먼 오른쪽",
      positionCustom: "직접 지정",
      offsetX: "오프셋 X",
      offsetY: "오프셋 Y",
      positionOrder: "위치 순서",
      animationOrder: "애니메이션 순서",
      zoom: "확대",
      opacity: "불투명도",
      animationSpeed: "애니메이션 속도",
      flipX: "좌우 반전",
      mystery: "수수께끼",
      exit: "퇴장",
      stagePreview: "무대 미리보기",
      visible: "표시 중",
      previewEmpty: "미리보기 없음",
      offset: "오프셋",
      popups: "팝업",
      addPopup: "팝업",
      noPopups: "팝업 이미지 없음",
      popupKind: "종류",
      popupCharacter: "인물",
      popupItem: "아이템",
      popupImagePath: "이미지 경로",
      popupPortraitDefault: "프로필 기본",
      popupWidth: "폭",
      popupHeight: "높이",
      popupScale: "스케일",
      popupTransition: "전환",
      popupPositionTopLeft: "좌상단",
      popupPositionTopRight: "우상단",
      popupSourceCharacterProfile: "인물 프로필",
      popupSourceItem: "아이템",
      popupSourceImage: "직접 이미지",
      popupTransitionFade: "페이드",
      popupTransitionPop: "팝",
      popupTransitionSlide: "슬라이드",
      popupTransitionNone: "없음",
      popupImageMode: "이미지 모드",
      popupImageZoom: "이미지 확대",
      popupImageModeFit: "맞춤",
      popupImageModeCover: "채우기",
      popupImageModeCrop: "자르기"
    },
    preview: {
      select: "미리볼 항목을 선택하세요.",
      title: "제목",
      summary: "요약",
      eventTags: "이벤트 태그",
      parallaxLayers: "패럴랙스 레이어",
      web: "웹",
      pc: "PC",
      fold7: "Fold7",
      fold7Open: "Fold7 펼침",
      actualPreview: "실제 화면 미리보기",
      actualPreviewUnavailable: "대사 리소스에서만 실제 화면 미리보기를 사용할 수 있습니다.",
      actualPreviewReady: "실제 화면 프리뷰 준비 완료",
      actualPreviewPreparing: "실제 화면 프리뷰 준비 중",
      actualPreviewBuilding: "Godot 웹 프리뷰 빌드 중",
      actualPreviewBuild: "웹 빌드",
      godotRun: "Godot 실행",
      currentDialogue: "현재 대화",
      previousDialogue: "이전 대화",
      refresh: "새로고침",
      openInNewTab: "새 탭",
      bridgeRequired: "Godot preview bridge가 실행 중이어야 합니다."
    }
  },
  en: {
    brandTitle: "Blind Madeleine Editor",
    brandSubtitle: "Local data server",
    toolbar: {
      refresh: "Refresh",
      create: "New",
      delete: "Delete",
      save: "Save",
      play: "Play"
    },
    settings: {
      label: "Preferences",
      language: "Language",
      korean: "한국어",
      english: "English",
      theme: "Theme",
      themeMode: "Mode",
      dark: "Dark",
      light: "Light",
      accent: "Color",
      green: "Green",
      blue: "Blue",
      rose: "Rose",
      amber: "Amber",
      custom: "Custom",
      customColor: "Custom color"
    },
    mobile: {
      library: "Library",
      workspace: "Edit",
      inspector: "Inspect"
    },
    resources: {
      dialogues: "Dialogues",
      characters: "Characters",
      chapters: "Chapters",
      items: "Items",
      story_assets: "Story assets"
    },
    panels: {
      resourceNav: "Data type",
      collection: "Data list",
      library: "Library",
      workspace: "Workspace",
      inspector: "Inspector",
      project: "Project",
      validation: "Validation"
    },
    tabs: {
      form: "Form",
      nodes: "Nodes",
      graph: "Graph",
      json: "JSON",
      preview: "Preview"
    },
    presentationModes: {
      normal: "Normal",
      talk: "Talk",
      investigation: "Investigation",
      statement: "Statement"
    },
    status: {
      jsonError: "JSON error",
      dirty: "Unsaved",
      clean: "Saved"
    },
    common: {
      search: "Search",
      emptyList: "No items to display.",
      format: "Format",
      unspecified: "Unspecified",
      currentMissing: "Current value",
      noneAvailable: "No selectable items.",
      missing: "Missing",
      uploading: "Uploading...",
      delete: "Delete",
      selectItem: "Select an item.",
      goToPosition: "Go to position"
    },
    form: {
      empty: "Select an item to edit.",
      id: "ID / filename",
      label: "Label",
      description: "Description",
      chapters: "Chapters",
      startNode: "Start node",
      presentationMode: "Presentation mode",
      nextDialogue: "Next dialogue",
      metadata: "Metadata",
      displayName: "Display name",
      nameColor: "Name color",
      protagonist: "Protagonist",
      voiceProfile: "Voice profile metadata",
      title: "Title",
      order: "Order",
      startDialogue: "Start dialogue",
      dialogues: "Dialogues",
      name: "Name",
      image: "Image",
      uploadItemImage: "Upload item image",
      kind: "Kind",
      path: "Path",
      uploadAssetFile: "Upload asset file",
      volume: "Volume",
      fixedBackground: "Fixed background",
      mode: "Mode",
      modeDialogue: "Dialogue",
      modeStage: "Stage",
      modeCutscene: "Cutscene",
      speaker: "Speaker",
      speakerAutoClean: "Clean speakers",
      speakerAutoCleanConfirmManualRemove: "Also remove manually added stage characters?",
      nextNode: "Next node",
      speakerMystery: "Speaker mystery",
      textSoundMuted: "Text sound muted",
      text: "Text",
      fadeIn: "Fade in",
      hold: "Hold",
      fadeOut: "Fade out",
      statementNotebook: "Statement notebook",
      customStatementScope: "Custom statement notebook scope",
      defaultStatementScope: "Using the default statement notebook scope.",
      notebookCharacters: "Notebook characters",
      notebookItems: "Notebook items",
      portraits: "Portraits",
      addPortrait: "Portrait",
      noPortraits: "No portraits",
      key: "Key",
      uploadPortrait: "Upload portrait",
      center: "Center",
      centerX: "Center X",
      centerY: "Center Y",
      profileZoom: "Profile zoom",
      profileOffsetX: "Profile offset X",
      profileOffsetY: "Profile offset Y",
      stageCast: "Stage cast",
      focusTargets: "Focus targets",
      addCharacter: "Add character",
      noStageCast: "No stage cast",
      portrait: "Portrait",
      live2dAngle: "Live2D angle",
      position: "Position",
      positionFarLeft: "Far left",
      positionLeft: "Left",
      positionCenter: "Center",
      positionRight: "Right",
      positionFarRight: "Far right",
      positionCustom: "Custom",
      offsetX: "Offset X",
      offsetY: "Offset Y",
      positionOrder: "Position order",
      animationOrder: "Animation order",
      zoom: "Zoom",
      opacity: "Opacity",
      animationSpeed: "Animation speed",
      flipX: "Flip X",
      mystery: "Mystery",
      exit: "Exit",
      stagePreview: "Stage Preview",
      visible: "visible",
      previewEmpty: "preview empty",
      offset: "offset",
      popups: "Popups",
      addPopup: "Popup",
      noPopups: "No popup images",
      popupKind: "Source",
      popupCharacter: "Character",
      popupItem: "Item",
      popupImagePath: "Image path",
      popupPortraitDefault: "Profile default",
      popupWidth: "Width",
      popupHeight: "Height",
      popupScale: "Scale",
      popupTransition: "Transition",
      popupPositionTopLeft: "Top left",
      popupPositionTopRight: "Top right",
      popupSourceCharacterProfile: "Character profile",
      popupSourceItem: "Item",
      popupSourceImage: "Direct image",
      popupTransitionFade: "Fade",
      popupTransitionPop: "Pop",
      popupTransitionSlide: "Slide",
      popupTransitionNone: "None",
      popupImageMode: "Image mode",
      popupImageZoom: "Image zoom",
      popupImageModeFit: "Fit",
      popupImageModeCover: "Cover",
      popupImageModeCrop: "Crop"
    },
    preview: {
      select: "Select an item to preview.",
      title: "Title",
      summary: "Summary",
      eventTags: "Event tags",
      parallaxLayers: "Parallax layers",
      web: "Web",
      pc: "PC",
      fold7: "Fold7",
      fold7Open: "Fold7 open",
      actualPreview: "Runtime preview",
      actualPreviewUnavailable: "Runtime preview is available for dialogue resources only.",
      actualPreviewReady: "Runtime preview is ready",
      actualPreviewPreparing: "Preparing runtime preview",
      actualPreviewBuilding: "Building Godot web preview",
      actualPreviewBuild: "Build web",
      godotRun: "Run Godot",
      currentDialogue: "Current dialogue",
      previousDialogue: "Previous dialogue",
      refresh: "Refresh",
      openInNewTab: "New tab",
      bridgeRequired: "Godot preview bridge must be running."
    }
  }
};

const LanguageContext = createContext<EditorLanguage>("ko");
const RichTextRemoveContext = createContext<((range: RichTextSourceRange) => void) | null>(null);

function useUiText(): EditorCopy {
  return editorText[useContext(LanguageContext)];
}
const dialogueBbcodeTagNames = new Set([
  "b", "i", "u", "s", "code", "font", "font_size", "font_scale", "color", "bgcolor", "fgcolor",
  "outline_size", "outline_color", "shake", "wave", "tornado", "pulse", "fade",
  "rainbow", "grow", "blink", "alpha", "lie",
  "speed", "text_speed", "type_speed", "typewriter_speed",
  "sfx", "sound", "se", "bgm", "music", "bgm_stop", "music_stop", "bgm_volume", "music_volume",
  "bg", "background", "bg_clear", "background_clear", "bg_remove", "background_remove",
  "auto_next", "auto_advance", "advance", "enter", "exit", "lb", "rb"
]);
const dialogueEventTagNames = new Set([
  "sfx", "sound", "se", "bgm", "music", "bgm_stop", "music_stop", "bgm_volume", "music_volume",
  "bg", "background", "bg_clear", "background_clear", "bg_remove", "background_remove",
  "auto_next", "auto_advance", "advance", "enter", "exit"
]);

const tagActions = [
  { label: "굵게", hint: "b", category: "format", open: "[b]", close: "[/b]" },
  { label: "기울임", hint: "i", category: "format", open: "[i]", close: "[/i]" },
  { label: "밑줄", hint: "u", category: "format", open: "[u]", close: "[/u]" },
  { label: "취소선", hint: "s", category: "format", open: "[s]", close: "[/s]" },
  { label: "거짓", hint: "lie", category: "format", open: "[lie]", close: "[/lie]" },
  { label: "색상", hint: "palette", category: "color", open: "[color=#7ee7d8]", close: "[/color]", previewText: "[color=#7ee7d8]색상[/color]" },
  { label: "배경 강조", hint: "bgcolor", category: "color", open: "[bgcolor=#2f2438]", close: "[/bgcolor]" },
  { label: "윤곽선", hint: "outline", category: "color", open: "[outline_size=2][outline_color=#000000]", close: "[/outline_color][/outline_size]" },
  { label: "반투명", hint: "alpha", category: "color", open: "[alpha value=0.45]", close: "[/alpha]" },
  { label: "흔들림", hint: "shake", category: "motion", open: "[shake rate=18.0 level=3 connected=0]", close: "[/shake]" },
  { label: "물결", hint: "wave", category: "motion", open: "[wave amp=14.0 freq=3.0 connected=0]", close: "[/wave]" },
  { label: "회오리", hint: "tornado", category: "motion", open: "[tornado radius=5.0 freq=0.85 connected=0]", close: "[/tornado]" },
  { label: "맥박", hint: "pulse", category: "motion", open: "[pulse freq=1.2 color=#ffffff40 ease=-2.0]", close: "[/pulse]" },
  { label: "희미해짐", hint: "fade", category: "motion", open: "[fade]", close: "[/fade]" },
  { label: "무지개", hint: "rainbow", category: "motion", open: "[rainbow freq=1.0 sat=0.75 val=0.95 speed=0.7]", close: "[/rainbow]" },
  { label: "점점커짐", hint: "grow", category: "motion", open: "[grow duration=1.05 from=0.78 to=1.34]", close: "[/grow]" },
  { label: "깜빡임", hint: "blink", category: "motion", open: "[blink freq=3.4 min=0.12]", close: "[/blink]" },
  { label: "느리게", hint: "speed", category: "typing", open: "[speed=0.6]", close: "[/speed]", badge: "x0.6" },
  { label: "빠르게", hint: "speed", category: "typing", open: "[speed=1.8]", close: "[/speed]", badge: "x1.8" },
  { label: "글자 배율", hint: "scale", category: "typing", open: "[font_scale=2]", close: "[/font_scale]", previewText: "[font_scale=1.35]글자 배율[/font_scale]", badge: "x2" },
  { label: "글자 작아짐", hint: "font_scale", category: "typing", open: "[font_scale from=1 to=0.3]", close: "[/font_scale]", badge: "1->0.3" },
  { label: "글자 커짐", hint: "font_scale", category: "typing", open: "[font_scale from=0.3 to=1]", close: "[/font_scale]", badge: "0.3->1" },
  { label: "BGM", hint: "bgm", category: "media", insert: "[bgm id=\"\" fade=0.5]" },
  { label: "BGM 볼륨", hint: "bgm_volume", category: "media", insert: "[bgm_volume volume=0.5 fade=0.5]" },
  { label: "BGM 종료", hint: "bgm_stop", category: "media", insert: "[bgm_stop fade=0.5]" },
  { label: "SFX", hint: "sfx", category: "media", insert: "[sfx id=\"\"]" },
  { label: "배경", hint: "bg", category: "media", insert: "[bg id=\"\" transition=fade duration=0.5 opacity=1 blur=3 brightness=0.75 saturate=0.8 dim=0.15]" },
  { label: "배경 제거", hint: "bg_clear", category: "media", insert: "[bg_clear transition=fade duration=0.5]" },
  { label: "등장", hint: "enter", category: "flow", insert: "[enter id=\"\"]" },
  { label: "퇴장", hint: "exit", category: "flow", insert: "[exit id=\"\"]" },
  { label: "자동 넘김", hint: "auto", category: "flow", insert: "[auto_next delay=0.35]" }
] satisfies TagAction[];

const tagActionGroups: Array<{ id: TagActionCategory; label: string }> = [
  { id: "format", label: "기본 서식" },
  { id: "color", label: "색상" },
  { id: "motion", label: "움직임" },
  { id: "typing", label: "타이핑 / 배율" },
  { id: "media", label: "사운드 / 배경" },
  { id: "flow", label: "흐름" }
];

const dialogueColorPalette = [
  { label: "마들렌 골드", color: "#d8c18f" },
  { label: "장미", color: "#ff7aa8" },
  { label: "진홍", color: "#d45a6a" },
  { label: "호박", color: "#ffc857" },
  { label: "청록", color: "#7ee7d8" },
  { label: "라벤더", color: "#c7a8ff" },
  { label: "속삭임", color: "#a0a0a0" },
  { label: "흰색", color: "#f5efe3" },
  { label: "초록", color: "#74d77f" },
  { label: "라임", color: "#b7e76f" },
  { label: "파랑", color: "#6aa8ff" },
  { label: "남색", color: "#5f78ff" }
];

function insertTextWithTextareaUndo(
  textarea: HTMLTextAreaElement | null,
  currentText: string,
  inserted: string,
  onFallbackChange: (nextText: string) => void
) {
  const sourceText = textarea?.value ?? currentText;
  const start = Math.max(0, Math.min(textarea?.selectionStart ?? sourceText.length, sourceText.length));
  const end = Math.max(start, Math.min(textarea?.selectionEnd ?? sourceText.length, sourceText.length));
  const nextText = `${sourceText.slice(0, start)}${inserted}${sourceText.slice(end)}`;
  const caret = start + inserted.length;

  if (!textarea) {
    onFallbackChange(nextText);
    return;
  }

  focusWithoutScroll(textarea);
  textarea.setSelectionRange(start, end);
  const before = textarea.value;
  const canUseNativeUndo = typeof document !== "undefined" && typeof document.execCommand === "function";
  if (canUseNativeUndo && document.execCommand("insertText", false, inserted) && textarea.value !== before) {
    dispatchTextareaInput(textarea, inserted);
    return;
  }

  textarea.setRangeText(inserted, start, end, "end");
  dispatchTextareaInput(textarea, inserted);
  onFallbackChange(nextText);
  window.requestAnimationFrame(() => {
    focusWithoutScroll(textarea);
    textarea.setSelectionRange(caret, caret);
  });
}

function removeTextRangeWithTextareaUndo(
  textarea: HTMLTextAreaElement | null,
  currentText: string,
  range: RichTextSourceRange,
  onFallbackChange: (nextText: string) => void
) {
  const sourceText = textarea?.value ?? currentText;
  const start = Math.max(0, Math.min(range.start, sourceText.length));
  const end = Math.max(start, Math.min(range.end, sourceText.length));
  const nextText = `${sourceText.slice(0, start)}${sourceText.slice(end)}`;

  if (!textarea) {
    onFallbackChange(nextText);
    return;
  }

  focusWithoutScroll(textarea);
  textarea.setSelectionRange(start, end);
  const before = textarea.value;
  const canUseNativeUndo = typeof document !== "undefined" && typeof document.execCommand === "function";
  if (canUseNativeUndo && document.execCommand("delete", false) && textarea.value !== before) {
    dispatchTextareaInput(textarea, "", "deleteContentBackward");
    return;
  }

  textarea.setRangeText("", start, end, "start");
  dispatchTextareaInput(textarea, "", "deleteContentBackward");
  onFallbackChange(nextText);
  window.requestAnimationFrame(() => {
    focusWithoutScroll(textarea);
    textarea.setSelectionRange(start, start);
  });
}

function dispatchTextareaInput(textarea: HTMLTextAreaElement, inserted: string, inputType = "insertText") {
  const event = typeof InputEvent === "function"
    ? new InputEvent("input", { bubbles: true, data: inserted, inputType })
    : new Event("input", { bubbles: true });
  textarea.dispatchEvent(event);
}

function parseJsonEditorError(error: unknown, text: string): JsonEditorError {
  const message = error instanceof Error ? error.message : String(error || "JSON parse error");
  const positionMatch = message.match(/position\s+(\d+)/i);
  const lineColumnMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  let position = positionMatch ? Number(positionMatch[1]) : undefined;
  let line = lineColumnMatch ? Number(lineColumnMatch[1]) : undefined;
  let column = lineColumnMatch ? Number(lineColumnMatch[2]) : undefined;

  if (position !== undefined && Number.isFinite(position) && (line === undefined || column === undefined)) {
    const location = jsonLineColumnFromPosition(text, position);
    line = location.line;
    column = location.column;
  }
  if ((position === undefined || !Number.isFinite(position)) && line !== undefined && column !== undefined) {
    position = jsonPositionFromLineColumn(text, line, column);
  }

  const excerpt = line !== undefined && column !== undefined ? jsonLineExcerpt(text, line, column) : undefined;
  return {
    message,
    line: Number.isFinite(line) ? line : undefined,
    column: Number.isFinite(column) ? column : undefined,
    position: Number.isFinite(position) ? position : undefined,
    excerpt: excerpt?.text,
    pointerOffset: excerpt?.pointerOffset
  };
}

function jsonLineColumnFromPosition(text: string, position: number) {
  const clampedPosition = Math.max(0, Math.min(Math.round(position), text.length));
  let line = 1;
  let column = 1;
  for (let index = 0; index < clampedPosition; index += 1) {
    if (text[index] === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}

function jsonPositionFromLineColumn(text: string, line: number, column: number) {
  const safeLine = Math.max(1, Math.round(line));
  const safeColumn = Math.max(1, Math.round(column));
  let currentLine = 1;
  let position = 0;
  while (position < text.length && currentLine < safeLine) {
    if (text[position] === "\n") currentLine += 1;
    position += 1;
  }
  return Math.max(0, Math.min(position + safeColumn - 1, text.length));
}

function jsonLineExcerpt(text: string, line: number, column: number) {
  const lines = text.split("\n");
  const lineText = (lines[Math.max(0, line - 1)] || "").replace(/\r$/, "");
  const pointerOffset = Math.max(0, Math.min(column - 1, lineText.length));
  return {
    text: `${lineText}\n${" ".repeat(pointerOffset)}^`,
    pointerOffset
  };
}

function formatJsonEditorError(error: JsonEditorError) {
  const location = error.line && error.column
    ? `${error.line}줄 ${error.column}열`
    : error.position !== undefined
      ? `position ${error.position}`
      : "";
  return location ? `${location}: ${error.message}` : error.message;
}

function isMobileEditorLayout() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 860px)").matches;
}

function App() {
  const [language, setLanguage] = useState<EditorLanguage>(readEditorLanguage);
  const [themeMode, setThemeMode] = useState<EditorThemeMode>(readEditorThemeMode);
  const [themeAccent, setThemeAccent] = useState<EditorThemeAccent>(readEditorThemeAccent);
  const [customAccent, setCustomAccent] = useState(readEditorCustomAccent);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [type, setType] = useState<ResourceType>("dialogues");
  const [resources, setResources] = useState<ResourceSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<ResourceRecord | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [savedJsonText, setSavedJsonText] = useState("");
  const [jsonError, setJsonError] = useState<JsonEditorError | null>(null);
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState("");
  const [resourceChapterFilters, setResourceChapterFilters] = useState<string[]>([]);
  const [tab, setTab] = useState<EditorTab>(() => defaultEditorTabForResource("dialogues"));
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(() => isMobileEditorLayout() ? "library" : "workspace");
  const [mobileFabOpen, setMobileFabOpen] = useState(false);
  const [collectionPanelOpen, setCollectionPanelOpen] = useState(() => !isMobileEditorLayout());
  const [inspectorPanelOpen, setInspectorPanelOpen] = useState(() => !isMobileEditorLayout());
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);
  const [bridgeEndpoint] = useState(readGodotPreviewEndpoint);
  const [toast, setToast] = useState("");
  const nodeTextRef = useRef<HTMLTextAreaElement | null>(null);
  const jsonEditorViewRef = useRef<EditorView | null>(null);
  const settingsMenuRef = useRef<HTMLDetailsElement | null>(null);
  const resourceFilterMenuRef = useRef<HTMLDetailsElement | null>(null);
  const pendingTaskRef = useRef(false);
  const dirtyRef = useRef(false);
  const [pendingTaskLabel, setPendingTaskLabel] = useState("");
  const ui = editorText[language];
  const setJsonEditorView = useCallback((view: EditorView | null) => {
    jsonEditorViewRef.current = view;
  }, []);

  const issues = useMemo(
    () => collectValidationIssues(type, draft, selectedId, summary).concat(jsonError
      ? [{ severity: "error", message: `JSON 오류: ${formatJsonEditorError(jsonError)}` } satisfies ValidationIssue]
      : []),
    [draft, jsonError, selectedId, summary, type]
  );

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    return resources.filter((resource) => {
      const matchesQuery = !query || [resource.id, resource.title, resource.subtitle]
        .some((value) => String(value || "").toLowerCase().includes(query));
      const matchesChapter = !hasResourceChapterFilter(type) || resourceMatchesChapterFilters(resource, resourceChapterFilters);
      return matchesQuery && matchesChapter;
    });
  }, [resourceChapterFilters, resources, search, type]);

  const referenceResources = useMemo(() => ({
    chapters: summary?.resources.chapters.resources || [],
    dialogues: summary?.resources.dialogues.resources || [],
    characters: summary?.resources.characters.resources || [],
    items: summary?.resources.items.resources || [],
    storyAssets: summary?.resources.story_assets.resources || []
  }), [summary]);
  const resourceChapterFilterOptions = useMemo(
    () => buildResourceChapterFilterOptions(resources, referenceResources.chapters, language),
    [language, referenceResources.chapters, resources]
  );
  const resourceChapterFilterLabel = useMemo(
    () => formatResourceChapterFilterLabel(resourceChapterFilters, resourceChapterFilterOptions, resources.length, language),
    [language, resourceChapterFilterOptions, resourceChapterFilters, resources.length]
  );
  const isAppBusy = Boolean(pendingTaskLabel);

  useEffect(() => {
    void boot();
  }, []);

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  useEffect(() => {
    return installBrowserNavigationGuard();
  }, []);

  useEffect(() => {
    function closeSettingsMenu() {
      if (settingsMenuRef.current?.open) settingsMenuRef.current.open = false;
    }

    function closeDialogueFilterMenu() {
      if (resourceFilterMenuRef.current?.open) resourceFilterMenuRef.current.open = false;
    }

    function closeFloatingMenus() {
      closeSettingsMenu();
      closeDialogueFilterMenu();
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const settingsMenu = settingsMenuRef.current;
      const dialogueFilterMenu = resourceFilterMenuRef.current;
      if (settingsMenu?.open && !settingsMenu.contains(target)) closeSettingsMenu();
      if (dialogueFilterMenu?.open && !dialogueFilterMenu.contains(target)) closeDialogueFilterMenu();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeFloatingMenus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", closeFloatingMenus, true);
    window.addEventListener("wheel", closeFloatingMenus, { capture: true, passive: true });
    window.addEventListener("touchmove", closeFloatingMenus, { capture: true, passive: true });
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", closeFloatingMenus, true);
      window.removeEventListener("wheel", closeFloatingMenus, true);
      window.removeEventListener("touchmove", closeFloatingMenus, true);
    };
  }, []);

  useEffect(() => {
    applyEditorAppearance(language, themeMode, themeAccent, customAccent);
    saveLocalSetting(editorLanguageStorageKey, language);
    saveLocalSetting(editorThemeModeStorageKey, themeMode);
    saveLocalSetting(editorThemeAccentStorageKey, themeAccent);
    saveLocalSetting(editorCustomAccentStorageKey, sanitizeHexColor(customAccent, defaultCustomAccent));
  }, [customAccent, language, themeAccent, themeMode]);

  useEffect(() => {
    setSelectedNodeIndex(0);
  }, [selectedId, type]);

  useEffect(() => {
    if (!editorTabsForResource(type).includes(tab)) setTab(defaultEditorTabForResource(type));
  }, [tab, type]);

  useEffect(() => {
    saveLocalSetting(godotPreviewEndpointStorageKey, bridgeEndpoint);
  }, [bridgeEndpoint]);

  async function boot() {
    try {
      await refreshSummary();
      await refreshList("dialogues", !isMobileEditorLayout());
      if (isMobileEditorLayout()) setMobilePanel("library");
      notify("프로젝트 데이터 로드 완료");
    } catch (error) {
      notify((error as Error).message);
    }
  }

  async function refreshSummary() {
    const nextSummary = await getProjectSummary();
    setSummary(nextSummary);
    return nextSummary;
  }

  async function refreshList(nextType = type, selectFirst = false) {
    const body = await listResources(nextType);
    setResources(body.resources);
    if (selectFirst && body.resources.length > 0) {
      await selectResource(nextType, body.resources[0].id, true);
    }
  }

  async function changeType(nextType: ResourceType) {
    if (pendingTaskRef.current) return;
    if (nextType === type) {
      setTab(defaultEditorTabForResource(nextType));
      setMobilePanel("library");
      setMobileFabOpen(false);
      return;
    }
    if (!confirmDiscard()) return;
    setType(nextType);
    setSelectedId("");
    setDraft(null);
    setJsonText("");
    setSavedJsonText("");
    setJsonError(null);
    setSearch("");
    setResourceChapterFilters([]);
    setResources([]);
    setSelectedNodeIndex(0);
    setTab(defaultEditorTabForResource(nextType));
    setMobilePanel("library");
    setMobileFabOpen(false);
    await refreshList(nextType, false);
  }

  async function openDialogueInEditor(dialogueId: string) {
    if (!dialogueId) return;
    await selectResource("dialogues", dialogueId);
    setTab("nodes");
  }

  async function selectResource(nextType: ResourceType, id: string, force = false) {
    if (pendingTaskRef.current && !force) return;
    if (!force && nextType === type && id === selectedId) {
      setMobilePanel("workspace");
      setMobileFabOpen(false);
      return;
    }
    if (!force && !confirmDiscard()) return;
    if (nextType !== type) {
      setType(nextType);
      await refreshList(nextType, false);
    }
    const body = await loadResource(nextType, id);
    const formatted = formatJson(body.data);
    setSelectedNodeIndex(0);
    setSelectedId(id);
    setDraft(body.data);
    setJsonText(formatted);
    setSavedJsonText(formatted);
    setJsonError(null);
    setDirty(false);
    setTab(defaultEditorTabForResource(nextType));
    setMobilePanel("workspace");
  }

  async function refreshAll() {
    if (pendingTaskRef.current || !confirmDiscard()) return;
    try {
      await runPendingTask("새로고침 중", async () => {
        await refreshSummary();
        await refreshList(type, false);
        if (selectedId) await selectResource(type, selectedId, true);
        notify("새로고침 완료");
      });
    } catch (error) {
      notify(`새로고침 실패: ${(error as Error).message}`);
    }
  }

  async function createCurrent() {
    if (pendingTaskRef.current || !confirmDiscard()) return;
    try {
      await runPendingTask("새 항목 생성 중", async () => {
        const id = makeUuid();
        const body = await createResource(type, resourceConfig[type].empty(id));
        await refreshSummary();
        await refreshList(type, false);
        const formatted = formatJson(body.data);
        setSelectedNodeIndex(0);
        setSelectedId(body.summary.id);
        setDraft(body.data);
        setJsonText(formatted);
        setSavedJsonText(formatted);
        setJsonError(null);
        setDirty(false);
        setTab(defaultEditorTabForResource(type));
        setMobilePanel("workspace");
        setMobileFabOpen(false);
        notify("새 항목 생성 완료");
      });
    } catch (error) {
      notify(`새 항목 생성 실패: ${(error as Error).message}`);
    }
  }

  async function deleteCurrent() {
    if (pendingTaskRef.current || !selectedId || !window.confirm(`${resourceConfig[type].singularLabel} ${selectedId} 파일을 삭제할까요?`)) return;
    try {
      await runPendingTask("삭제 중", async () => {
        await deleteResource(type, selectedId);
        setSelectedId("");
        setDraft(null);
        setJsonText("");
        setSavedJsonText("");
        setDirty(false);
        await refreshSummary();
        await refreshList(type, !isMobileEditorLayout());
        if (isMobileEditorLayout()) setMobilePanel("library");
        notify("삭제 완료");
      });
    } catch (error) {
      notify(`삭제 실패: ${(error as Error).message}`);
    }
  }

  async function saveSelectedDraft(notifySuccess = true) {
    if (!selectedId || !draft || jsonError) {
      throw new Error(language === "ko" ? "저장할 항목이 없습니다." : "There is no item to save.");
    }
    const thumbnailResult = type === "chapters" ? await uploadChapterThumbnailForDraft(draft, uploadFileAndImport) : null;
    const nextDraft = prepareDraftForSave(type, thumbnailResult?.draft || draft, referenceResources);
    const body = await saveResource(type, selectedId, nextDraft);
    const formatted = formatJson(body.data);
    setSelectedId(body.summary.id);
    setDraft(body.data);
    setJsonText(formatted);
    setSavedJsonText(formatted);
    setDirty(false);
    await refreshSummary();
    await refreshList(type, false);
    if (notifySuccess) {
      notify(thumbnailResult && !thumbnailResult.skipped
        ? `저장 완료 · 썸네일 ${thumbnailResult.resPath} · ${formatGodotImportStatus(thumbnailResult.importStatus)}`
        : "저장 완료");
    }
    return { data: body.data, id: body.summary.id };
  }

  async function saveCurrent() {
    if (pendingTaskRef.current || !selectedId || !draft || jsonError) return;
    try {
      await runPendingTask("저장 중", async () => {
        await saveSelectedDraft(true);
      });
    } catch (error) {
      notify(`저장 실패: ${(error as Error).message}`);
    }
  }

  function confirmDiscard() {
    if (!dirty) return true;
    return window.confirm("저장하지 않은 변경이 있습니다. 계속할까요?");
  }

  function confirmLeaveEditor() {
    if (pendingTaskRef.current) {
      return window.confirm("작업이 진행 중입니다. 페이지를 나갈까요?");
    }
    if (dirtyRef.current) {
      return window.confirm("저장하지 않은 변경이 있습니다. 페이지를 나갈까요?");
    }
    return window.confirm("에디터 페이지를 나갈까요?");
  }

  function installBrowserNavigationGuard() {
    const pushGuardState = () => {
      const currentState = window.history.state && typeof window.history.state === "object"
        ? window.history.state as Record<string, unknown>
        : {};
      window.history.pushState({ ...currentState, [editorBackGuardStateKey]: true }, "", window.location.href);
    };

    if (!(window.history.state && typeof window.history.state === "object" && window.history.state[editorBackGuardStateKey])) {
      pushGuardState();
    }

    const onPopState = () => {
      if (confirmLeaveEditor()) {
        window.removeEventListener("popstate", onPopState);
        window.history.back();
        return;
      }
      pushGuardState();
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current && !pendingTaskRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast((current) => current === message ? "" : current), 2200);
  }

  async function runPendingTask<T>(label: string, task: () => Promise<T>) {
    if (pendingTaskRef.current) {
      throw new Error("다른 작업이 진행 중입니다.");
    }
    pendingTaskRef.current = true;
    setPendingTaskLabel(label);
    try {
      return await task();
    } finally {
      pendingTaskRef.current = false;
      setPendingTaskLabel("");
    }
  }

  function openPlayWindow() {
    const screenInfo = window.screen as Screen & { availLeft?: number; availTop?: number };
    const width = Math.min(1280, Math.max(900, Math.round((screenInfo.availWidth || window.outerWidth || 1280) * 0.82)));
    const height = Math.min(820, Math.max(620, Math.round((screenInfo.availHeight || window.outerHeight || 820) * 0.82)));
    const left = Math.max(0, Math.round((screenInfo.availLeft || 0) + ((screenInfo.availWidth || width) - width) / 2));
    const top = Math.max(0, Math.round((screenInfo.availTop || 0) + ((screenInfo.availHeight || height) - height) / 2));
    const features = [
      "popup=yes",
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      "resizable=yes",
      "scrollbars=no"
    ].join(",");
    const playWindow = window.open("", `blind-madeleine-play-${Date.now()}`, features);
    if (!playWindow || playWindow === window) {
      notify(language === "ko" ? "팝업이 차단되어 게임 창을 열 수 없습니다." : "Popup was blocked, so the game window could not open.");
      return null;
    }
    writePlayWindowStatus(
      playWindow,
      language === "ko" ? "Blind Madeleine 실행 준비 중" : "Preparing Blind Madeleine",
      language === "ko" ? "게임 화면을 준비하고 있습니다." : "Preparing the game window."
    );
    playWindow.focus();
    return playWindow;
  }

  function writePlayWindowStatus(playWindow: Window, title: string, message: string, error = false) {
    try {
      const statusDocument = playWindow.document;
      statusDocument.open();
      statusDocument.write(`<!doctype html>
<html lang="${language === "ko" ? "ko" : "en"}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Blind Madeleine</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#101417;color:#eef4fa;font:600 16px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
main{display:grid;gap:10px;text-align:center;padding:24px}
strong{font-size:20px}
span{color:#aab6c4}
.error{color:#ffb4ab}
</style>
</head>
<body><main><strong id="status-title"></strong><span id="status-message"></span></main></body>
</html>`);
      statusDocument.close();
      const titleElement = statusDocument.getElementById("status-title");
      const messageElement = statusDocument.getElementById("status-message");
      if (titleElement) titleElement.textContent = title;
      if (messageElement) {
        messageElement.textContent = message;
        if (error) messageElement.classList.add("error");
      }
    } catch {
      // The popup may have already navigated away.
    }
  }

  async function postEditorPreviewBridge(path: string, payload: ResourceRecord = {}) {
    const response = await fetch(godotPreviewUrl(bridgeEndpoint, path), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok) {
      throw new Error(bridgeErrorMessage(body, ui.preview.bridgeRequired));
    }
    return body as ResourceRecord;
  }

  async function prepareFullGamePlayUrl() {
    await postEditorPreviewBridge("web-preview/build", { timeout_seconds: 300 });
    return resolveGodotPreviewBridgeUrl(bridgeEndpoint, `/web-preview/index.html?play_nonce=${Date.now()}`);
  }

  function finishPlayWindow(playWindow: Window, url: string) {
    playWindow.location.href = url;
    playWindow.focus();
  }

  function reportPlayFailure(playWindow: Window, error: unknown) {
    const message = error instanceof Error ? error.message : String(error || "");
    writePlayWindowStatus(
      playWindow,
      language === "ko" ? "실행 실패" : "Play failed",
      message,
      true
    );
    notify(`${language === "ko" ? "실행 실패" : "Play failed"}: ${message}`);
  }

  async function runGameFromEditor() {
    if (pendingTaskRef.current || jsonError) return;
    if (dirty) {
      const confirmed = window.confirm(language === "ko"
        ? "저장하지 않은 편집 내용이 있습니다. 저장 후 1회 빌드하여 게임을 실행할까요?"
        : "There are unsaved editor changes. Save them, build once, and run the game?");
      if (!confirmed) return;
    }
    const playWindow = openPlayWindow();
    if (!playWindow) return;
    try {
      await runPendingTask(language === "ko" ? "저장 후 빌드 중" : "Saving and building", async () => {
        if (dirty) await saveSelectedDraft(false);
        const url = await prepareFullGamePlayUrl();
        finishPlayWindow(playWindow, url);
        notify(language === "ko" ? "게임 창을 열었습니다." : "Opened the game window.");
      });
    } catch (error) {
      reportPlayFailure(playWindow, error);
    }
  }

  function applyDraft(nextDraft: ResourceRecord) {
    const formatted = formatJson(nextDraft);
    setDraft(nextDraft);
    setJsonText(formatted);
    setJsonError(null);
    setDirty(formatted !== savedJsonText);
  }

  function updateField(field: string, value: unknown) {
    if (!draft) return;
    applyDraft({ ...draft, [field]: value });
  }

  function updateMetadataField(field: string, value: unknown) {
    if (!draft) return;
    const metadata = draft.metadata && typeof draft.metadata === "object" ? draft.metadata : {};
    applyDraft({ ...draft, metadata: { ...metadata, [field]: value } });
  }

  function toggleArrayField(field: string, id: string) {
    if (!draft) return;
    const current = asArray<string>(draft[field]).map(String);
    const next = current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id];
    applyDraft({ ...draft, [field]: next });
  }

  function onJsonChange(text: string) {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setDraft(parsed);
      setJsonError(null);
      setDirty(formatJson(parsed) !== savedJsonText);
    } catch (error) {
      setJsonError(parseJsonEditorError(error, text));
      setDirty(true);
    }
  }

  function formatJsonText() {
    if (!draft) return;
    const formatted = formatJson(draft);
    setJsonText(formatted);
    setJsonError(null);
    setDirty(formatted !== savedJsonText);
  }

  function jumpToJsonError() {
    const editor = jsonEditorViewRef.current;
    if (!editor || !jsonError) return;
    const rawPosition = jsonError.position ?? (
      jsonError.line && jsonError.column
        ? jsonPositionFromLineColumn(jsonText, jsonError.line, jsonError.column)
        : undefined
    );
    if (rawPosition === undefined) return;
    const position = Math.round(clampNumber(rawPosition, 0, editor.state.doc.length, 0));
    editor.focus();
    editor.dispatch({ selection: { anchor: position }, scrollIntoView: true });
  }

  function addDialogueNode(mode: DialogueNodeMode) {
    if (!draft || type !== "dialogues") return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    const newIndex = nodes.length;
    const nextNode = defaultNestedNode(mode);
    const inheritedNode = applyInheritedStageCastDefaults(nextNode, newIndex, [...nodes, nextNode], referenceResources.characters);
    applyDraft({ ...draft, nodes: [...nodes, inheritedNode] });
    setSelectedNodeIndex(newIndex);
    setTab("nodes");
  }

  function insertDialogueNodeAfter(index: number, mode: DialogueNodeMode) {
    if (!draft || type !== "dialogues") return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    const insertIndex = Math.max(0, Math.min(index + 1, nodes.length));
    const nextNode = defaultNestedNode(mode);
    const inheritedNode = applyInheritedStageCastDefaults(nextNode, insertIndex, [
      ...nodes.slice(0, insertIndex),
      nextNode,
      ...nodes.slice(insertIndex)
    ], referenceResources.characters);
    applyDraft({ ...draft, nodes: [...nodes.slice(0, insertIndex), inheritedNode, ...nodes.slice(insertIndex)] });
    setSelectedNodeIndex(insertIndex);
    setTab("nodes");
  }

  function duplicateDialogueNode(index: number) {
    if (!draft || type !== "dialogues") return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    const sourceNode = nodes[index];
    if (!sourceNode) return;
    const insertIndex = Math.max(0, Math.min(index + 1, nodes.length));
    const nextNode = cloneJsonValue(sourceNode);
    delete nextNode.id;
    applyDraft({ ...draft, nodes: [...nodes.slice(0, insertIndex), nextNode, ...nodes.slice(insertIndex)] });
    setSelectedNodeIndex(insertIndex);
    setTab("nodes");
  }

  function addStatementNode() {
    if (!draft || type !== "dialogues") return;
    const statementNodes = asArray<ResourceRecord>(draft.statement_nodes);
    const newIndex = statementNodes.length;
    const nextNode = {
      speaker: "narrator",
      text: "[lie]거짓[/lie]",
      statement_lies: [{ phrase: "거짓", reactions: [{ label: "제시", nodes: [] }] }]
    };
    const inheritedNode = applyInheritedStageCastDefaults(nextNode, newIndex, [...statementNodes, nextNode], referenceResources.characters);
    applyDraft({ ...draft, statement_nodes: [...statementNodes, inheritedNode] });
    setTab("nodes");
  }

  function updateStatementNode(index: number, nextNode: ResourceRecord) {
    if (!draft || type !== "dialogues") return;
    const statementNodes = asArray<ResourceRecord>(draft.statement_nodes);
    applyDraft({
      ...draft,
      statement_nodes: statementNodes.map((node, nodeIndex) => nodeIndex === index ? nextNode : node)
    });
  }

  function replaceStatementNodes(nextNodes: ResourceRecord[]) {
    if (!draft || type !== "dialogues") return;
    applyDraft({ ...draft, statement_nodes: nextNodes });
  }

  function removeStatementNode(index: number) {
    if (!draft || type !== "dialogues") return;
    const statementNodes = asArray<ResourceRecord>(draft.statement_nodes);
    applyDraft({ ...draft, statement_nodes: statementNodes.filter((_, nodeIndex) => nodeIndex !== index) });
  }

  function updateDialogueNode(index: number, nextNode: ResourceRecord) {
    if (!draft || type !== "dialogues") return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    const nextNodes = nodes.map((node, nodeIndex) => nodeIndex === index ? nextNode : node);
    applyDraft({ ...draft, nodes: nextNodes });
  }

  function replaceDialogueNodes(nextNodes: ResourceRecord[]) {
    if (!draft || type !== "dialogues") return;
    applyDraft({ ...draft, nodes: nextNodes });
  }

  function removeDialogueNode(index: number) {
    if (!draft || type !== "dialogues") return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    applyDraft({ ...draft, nodes: nodes.filter((_, nodeIndex) => nodeIndex !== index) });
    setSelectedNodeIndex(Math.max(0, index - 1));
  }

  function insertWrappedNodeText(open: string, close: string, fallbackText = "text") {
    if (!draft || type !== "dialogues") return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    const node = nodes[selectedNodeIndex];
    if (!node) return;

    const currentText = String(node.text || "");
    const textarea = nodeTextRef.current;
    const start = textarea?.selectionStart ?? currentText.length;
    const end = textarea?.selectionEnd ?? currentText.length;
    const selected = currentText.slice(start, end);
    const inserted = `${open}${selected || fallbackText}${close}`;
    insertTextWithTextareaUndo(textarea, currentText, inserted, (nextText) => {
      updateDialogueNode(selectedNodeIndex, { ...node, text: nextText });
    });
  }

  function insertTag(action: TagAction) {
    if (action.insert) {
      if (!draft || type !== "dialogues") return;
      const nodes = asArray<ResourceRecord>(draft.nodes);
      const node = nodes[selectedNodeIndex];
      if (!node) return;
      const currentText = String(node.text || "");
      insertTextWithTextareaUndo(nodeTextRef.current, currentText, action.insert, (nextText) => {
        updateDialogueNode(selectedNodeIndex, { ...node, text: nextText });
      });
      return;
    }
    if (action.open && action.close) insertWrappedNodeText(action.open, action.close);
  }

  function insertColorTag(color: string) {
    insertWrappedNodeText(`[color=${color}]`, "[/color]");
  }

  async function uploadFile(relativePath: string, file: File) {
    if (pendingTaskRef.current) {
      throw new Error("다른 작업이 진행 중입니다.");
    }
    const result = await runPendingTask("업로드/import 중", async () => uploadFileAndImport(relativePath, file));
    notify(`업로드 완료: ${result.resPath} · ${formatGodotImportStatus(result.importStatus)}`);
    return result.resPath;
  }

  async function uploadFileAndImport(relativePath: string, file: File): Promise<ProjectAssetUploadResult> {
    const result = await uploadProjectFile(relativePath, file);
    const importStatus = await triggerGodotImport([result.resPath]);
    return { ...result, importStatus };
  }

  async function triggerGodotImport(paths: string[]) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 125000);
    try {
      const response = await fetch(godotPreviewUrl(bridgeEndpoint, "import"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paths, timeout_seconds: 120 }),
        signal: controller.signal
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.ok) {
        throw new Error(bridgeErrorMessage(body, "bridge import unavailable"));
      }
      return { ok: true, error: "" };
    } catch (error) {
      const message = error instanceof DOMException && error.name === "AbortError"
        ? "timeout"
        : (error as Error).message;
      return { ok: false, error: message };
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function formatGodotImportStatus(status: GodotImportStatus | undefined) {
    if (!status) return "Godot import 미확인";
    return status.ok ? "Godot import 완료" : `Godot import 대기: ${status.error}`;
  }

  const canSave = Boolean(selectedId && draft && dirty && !jsonError && !isAppBusy);
  const canRunGame = Boolean(!jsonError && !isAppBusy && (!dirty || (selectedId && draft)));
  const currentTitle = titleFor(type, draft, selectedId);
  const currentDescription = describeResourceForLanguage(type, draft, language);
  const issueCount = issues.filter((issue) => issue.severity !== "info").length;
  const dirtyBadgeClass = isAppBusy ? "pending" : jsonError ? "error" : dirty ? "dirty" : "clean";
  const dirtyBadgeText = isAppBusy ? pendingTaskLabel : jsonError ? ui.status.jsonError : dirty ? ui.status.dirty : ui.status.clean;
  const mobileActionMenuLabel = language === "ko" ? "모바일 작업 메뉴" : "Mobile action menu";
  const collapseActionLabel = language === "ko" ? "접기" : "collapse";
  const expandActionLabel = language === "ko" ? "펼치기" : "expand";
  const visibleTabs = editorTabsForResource(type);
  const activeTab = visibleTabs.includes(tab) ? tab : defaultEditorTabForResource(type);
  const showPortraitTabAction = type === "characters" && activeTab === "form" && Boolean(draft);

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

  function toggleResourceChapterFilter(value: string) {
    if (value === "all") {
      setResourceChapterFilters([]);
      return;
    }
    setResourceChapterFilters((selected) => selected.includes(value)
      ? selected.filter((entry) => entry !== value)
      : [...selected, value]);
  }

  function runMobileFabAction(action: () => void) {
    setMobileFabOpen(false);
    action();
  }

  return (
    <LanguageContext.Provider value={language}>
      <div className="app-shell">
        <header className="top-app-bar">
          <div className="brand-area">
            <div className="brand-mark">BM</div>
            <div className="brand-copy">
              <div className="brand-title-row">
                <strong>{ui.brandTitle}</strong>
                <button className="brand-play-button" disabled={!canRunGame} type="button" onClick={() => void runGameFromEditor()} title={ui.toolbar.play}>
                  <Icon name="PlayCircle" />
                  <span>{ui.toolbar.play}</span>
                </button>
              </div>
              <span>{ui.brandSubtitle}</span>
            </div>
          </div>
          <nav className="navigation-rail" aria-label={ui.panels.resourceNav}>
            {resourceOrder.map((entry) => (
              <button
                className={`rail-item ${entry === type ? "active" : ""}`}
                key={entry}
                type="button"
                onClick={() => void changeType(entry)}
              >
                <Icon name={resourceConfig[entry].icon} />
                <span>{ui.resources[entry]}</span>
                <small>{summary?.resources[entry]?.count ?? 0}</small>
              </button>
            ))}
          </nav>
          <div className="header-actions">
            <div className="toolbar-actions">
              <IconButton icon="Refresh" label={ui.toolbar.refresh} onClick={refreshAll} disabled={isAppBusy} />
              <IconButton icon="Add" label={ui.toolbar.create} onClick={createCurrent} disabled={isAppBusy} />
              <IconButton icon="Delete" label={ui.toolbar.delete} onClick={deleteCurrent} disabled={isAppBusy || !selectedId} danger />
              <IconButton icon="Save" label={ui.toolbar.save} onClick={saveCurrent} disabled={!canSave} filled />
            </div>
            <details className="settings-menu" ref={settingsMenuRef}>
              <summary aria-label={ui.settings.label}>
                <Icon name="Settings" />
                <span>{ui.settings.label}</span>
              </summary>
              <div className="settings-popover">
                <strong>{ui.settings.label}</strong>
                <div className="preference-controls" aria-label={ui.settings.label}>
                  <label className="preference-field">
                    <span>{ui.settings.language}</span>
                    <select value={language} onChange={(event) => setLanguage(event.target.value === "en" ? "en" : "ko")}>
                      <option value="ko">{ui.settings.korean}</option>
                      <option value="en">{ui.settings.english}</option>
                    </select>
                  </label>
                  <section className="theme-preference-group" aria-label={ui.settings.theme}>
                    <span className="theme-preference-title">{ui.settings.theme}</span>
                    <div className="segmented-control" role="group" aria-label={ui.settings.themeMode}>
                      <button className={themeMode === "dark" ? "active" : ""} type="button" onClick={() => setThemeMode("dark")}>
                        {ui.settings.dark}
                      </button>
                      <button className={themeMode === "light" ? "active" : ""} type="button" onClick={() => setThemeMode("light")}>
                        {ui.settings.light}
                      </button>
                    </div>
                    <label className="preference-field">
                      <span>{ui.settings.accent}</span>
                      <div className="accent-control-row">
                        <select value={themeAccent} onChange={(event) => setThemeAccent(normalizeEditorThemeAccent(event.target.value))}>
                          <option value="green">{ui.settings.green}</option>
                          <option value="blue">{ui.settings.blue}</option>
                          <option value="rose">{ui.settings.rose}</option>
                          <option value="amber">{ui.settings.amber}</option>
                          <option value="custom">{ui.settings.custom}</option>
                        </select>
                        {themeAccent === "custom" && (
                          <input
                            aria-label={ui.settings.customColor}
                            className="custom-color-input"
                            value={sanitizeHexColor(customAccent, defaultCustomAccent)}
                            onChange={(event) => setCustomAccent(event.target.value)}
                            title={ui.settings.customColor}
                            type="color"
                          />
                        )}
                      </div>
                    </label>
                  </section>
                </div>
              </div>
            </details>
          </div>
        </header>

      <main className={`editor-grid mobile-${mobilePanel} ${collectionPanelOpen ? "collection-expanded" : "collection-collapsed"} ${inspectorPanelOpen ? "inspector-expanded" : "inspector-collapsed"}`}>
        <section className={`collection-panel ${collectionPanelOpen ? "expanded" : "collapsed"}`} aria-label={ui.panels.collection}>
          <button
            aria-expanded={collectionPanelOpen}
            aria-label={`${ui.panels.library} ${collectionPanelOpen ? collapseActionLabel : expandActionLabel}`}
            className="side-panel-toggle"
            type="button"
            onClick={() => setCollectionPanelOpen((open) => !open)}
          >
            <Icon name={collectionPanelOpen ? "ChevronLeft" : "ChevronRight"} />
            <span>{ui.panels.library}</span>
          </button>
          <div className="side-panel-content collection-content">
            <div className="panel-title">
              <div className="panel-title-copy">
                <p>{ui.panels.library}</p>
                <h1>{ui.resources[type]}</h1>
              </div>
              {hasResourceChapterFilter(type) && (
                <details className="chapter-filter-menu" ref={resourceFilterMenuRef}>
                  <summary aria-label={language === "ko" ? "챕터 필터" : "Chapter filter"}>
                    <Icon name="FilterList" />
                    <span>{resourceChapterFilterLabel}</span>
                    <Icon name="KeyboardArrowDown" />
                  </summary>
                  <div className="chapter-filter-popover">
                    {resourceChapterFilterOptions.map((option) => (
                      <label className="chapter-filter-option" key={option.value}>
                        <input
                          checked={option.value === "all" ? resourceChapterFilters.length === 0 : resourceChapterFilters.includes(option.value)}
                          type="checkbox"
                          onChange={() => toggleResourceChapterFilter(option.value)}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </details>
              )}
            </div>
            <div className="collection-filter-row">
              <label className="search-field">
                <Icon name="Search" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={ui.common.search} type="search" />
              </label>
            </div>
            <div className="resource-list">
              {filteredResources.length === 0 && <p className="empty-state">{ui.common.emptyList}</p>}
              {filteredResources.map((resource) => (
                <button
                  className={`resource-row ${resource.id === selectedId ? "active" : ""}`}
                  key={resource.id}
                  type="button"
                  onClick={() => void selectResource(type, resource.id)}
                >
                  <strong>{resource.title}</strong>
                  <span>{resource.subtitle}</span>
                  <code>{shortId(resource.id)}</code>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="workspace-panel" aria-label={ui.panels.workspace}>
          <div className="workspace-header">
            <div>
              <p>{ui.resources[type]}</p>
              <h2>{currentTitle}</h2>
              <span>{currentDescription}</span>
            </div>
            <div className={`dirty-badge ${dirtyBadgeClass}`} aria-live="polite">
              {dirtyBadgeText}
            </div>
          </div>

          <div className="workspace-tab-row">
            <div className="tab-bar" role="tablist">
              {visibleTabs.map((entry) => (
                <button className={activeTab === entry ? "active" : ""} key={entry} type="button" onClick={() => setTab(entry)}>
                  {tabLabel(entry, ui)}
                </button>
              ))}
            </div>
            {showPortraitTabAction && (
              <button className="tab-row-action" disabled={isAppBusy || !draft} type="button" onClick={addCharacterPortrait}>
                <Icon name="Add" />
                <span>{ui.form.addPortrait}</span>
              </button>
            )}
          </div>

          <div className={`workspace-body workspace-body-${activeTab} ${isAppBusy ? "busy" : ""}`} aria-busy={isAppBusy}>
            {activeTab === "form" && (
              <FormPanel
                disabled={isAppBusy}
                draft={draft}
                type={type}
                references={referenceResources}
                updateField={updateField}
                updateMetadataField={updateMetadataField}
                toggleArrayField={toggleArrayField}
                uploadFile={uploadFile}
                replaceDraft={applyDraft}
                savedJsonText={savedJsonText}
                notify={notify}
              />
            )}
            {type === "chapters" && activeTab === "graph" && (
              draft ? (
                <ChapterGraphEditor
                  disabled={isAppBusy}
                  draft={draft}
                  dialogues={referenceResources.dialogues}
                  notify={notify}
                  onOpenDialogue={(dialogueId) => void openDialogueInEditor(dialogueId)}
                  replaceDraft={applyDraft}
                  setStartDialogue={(dialogueId) => updateField("start_dialogue", dialogueId)}
                />
              ) : (
                <p className="empty-state">{ui.common.selectItem}</p>
              )
            )}
            {type === "dialogues" && activeTab === "nodes" && (
              <DialogueNodesPanel
                draft={draft}
                references={referenceResources}
                resourceChapterFilters={resourceChapterFilters}
                selectedNodeIndex={selectedNodeIndex}
                nodeTextRef={nodeTextRef}
                setSelectedNodeIndex={setSelectedNodeIndex}
                addDialogueNode={addDialogueNode}
                insertDialogueNodeAfter={insertDialogueNodeAfter}
                duplicateDialogueNode={duplicateDialogueNode}
                addStatementNode={addStatementNode}
                updateDialogueNode={updateDialogueNode}
                replaceDialogueNodes={replaceDialogueNodes}
                removeDialogueNode={removeDialogueNode}
                updateStatementNode={updateStatementNode}
                replaceStatementNodes={replaceStatementNodes}
                removeStatementNode={removeStatementNode}
                insertTag={insertTag}
                insertColorTag={insertColorTag}
                onNavigateToStoryAssets={() => setType("story_assets")}
                bridgeEndpoint={bridgeEndpoint}
                notify={notify}
                selectedId={selectedId}
              />
            )}
            {activeTab === "json" && (
              <div className="json-editor">
                <div className="json-editor-header">
                  JSON
                  <button className="inline-text-action" type="button" onClick={formatJsonText}>{ui.common.format}</button>
                </div>
                {jsonError && <JsonErrorPanel error={jsonError} onJump={jumpToJsonError} />}
                <JsonCodeEditor
                  invalid={Boolean(jsonError)}
                  label="JSON"
                  value={jsonText}
                  onChange={onJsonChange}
                  onView={setJsonEditorView}
                  placeholderText={ui.form.empty}
                  placeholder="목록에서 항목을 선택하세요."
                />
              </div>
            )}
            {activeTab === "preview" && (
              <PreviewPanel draft={draft} type={type} issues={issues} />
            )}
          </div>
        </section>

        <aside className={`inspector-panel ${inspectorPanelOpen ? "expanded" : "collapsed"}`} aria-label={ui.panels.inspector}>
          <button
            aria-expanded={inspectorPanelOpen}
            aria-label={`${ui.panels.inspector} ${inspectorPanelOpen ? collapseActionLabel : expandActionLabel}`}
            className="side-panel-toggle"
            type="button"
            onClick={() => setInspectorPanelOpen((open) => !open)}
          >
            <Icon name={inspectorPanelOpen ? "ChevronRight" : "ChevronLeft"} />
            <span>{ui.panels.inspector}</span>
          </button>
          <div className="side-panel-content inspector-content">
            <section>
              <p className="section-label">{ui.panels.project}</p>
              <div className="metric-grid">
                {resourceOrder.map((entry) => (
                  <article className="metric" key={entry}>
                    <b>{summary?.resources[entry]?.count ?? 0}</b>
                    <span>{ui.resources[entry]}</span>
                  </article>
                ))}
              </div>
            </section>
            <section>
              <p className="section-label">{ui.panels.validation}</p>
              <div className="issue-list">
                {issues.map((issue, index) => (
                  <article className={`issue ${issue.severity}`} key={`${issue.message}-${index}`}>
                    <Icon name={issue.severity === "error" ? "Warning" : issue.severity === "warning" ? "Warning" : "CheckCircle"} />
                    <span>{issue.message}</span>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </aside>
      </main>

      <div className={`toast ${toast ? "visible" : ""}`}>{toast}</div>
      <div className={`mobile-fab-menu ${mobileFabOpen ? "open" : ""}`}>
        <button
          className="mobile-fab-scrim"
          aria-label={language === "ko" ? "모바일 작업 메뉴 닫기" : "Close mobile action menu"}
          type="button"
          onClick={() => setMobileFabOpen(false)}
        />
        <div className="mobile-fab-actions" role="menu" aria-label={mobileActionMenuLabel}>
          <button className={mobilePanel === "library" ? "active" : ""} role="menuitem" type="button" onClick={() => runMobileFabAction(() => setMobilePanel("library"))}>
            <Icon name="FolderOpen" />
            <span>{ui.mobile.library}</span>
          </button>
          <button className={mobilePanel === "workspace" ? "active" : ""} role="menuitem" type="button" onClick={() => runMobileFabAction(() => setMobilePanel("workspace"))}>
            <Icon name="Edit" />
            <span>{ui.mobile.workspace}</span>
          </button>
          <button className={mobilePanel === "inspector" ? "active" : ""} role="menuitem" type="button" onClick={() => runMobileFabAction(() => setMobilePanel("inspector"))}>
            <Icon name={issueCount > 0 ? "Warning" : "CheckCircle"} />
            <span>{ui.mobile.inspector}</span>
            {issueCount > 0 && <b>{issueCount}</b>}
          </button>
          <button role="menuitem" type="button" onClick={() => runMobileFabAction(() => void createCurrent())} disabled={isAppBusy}>
            <Icon name="Add" />
            <span>{ui.toolbar.create}</span>
          </button>
          <button role="menuitem" type="button" onClick={() => runMobileFabAction(() => void saveCurrent())} disabled={!canSave}>
            <Icon name="Save" />
            <span>{ui.toolbar.save}</span>
          </button>
        </div>
        <button
          className="mobile-fab-toggle"
          aria-expanded={mobileFabOpen}
          aria-label={mobileActionMenuLabel}
          type="button"
          onClick={() => setMobileFabOpen((open) => !open)}
        >
          <Icon name={mobileFabOpen ? "Close" : "DashboardCustomize"} />
        </button>
      </div>
      </div>
    </LanguageContext.Provider>
  );
}

type ReferenceResources = {
  chapters: ResourceSummary[];
  dialogues: ResourceSummary[];
  characters: ResourceSummary[];
  items: ResourceSummary[];
  storyAssets: ResourceSummary[];
};

function FormPanel({
  disabled,
  draft,
  type,
  references,
  updateField,
  updateMetadataField,
  toggleArrayField,
  uploadFile,
  replaceDraft,
  savedJsonText,
  notify
}: {
  disabled: boolean;
  draft: ResourceRecord | null;
  type: ResourceType;
  references: ReferenceResources;
  updateField: (field: string, value: unknown) => void;
  updateMetadataField: (field: string, value: unknown) => void;
  toggleArrayField: (field: string, id: string) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
  replaceDraft: (nextDraft: ResourceRecord) => void;
  savedJsonText: string;
  notify: (message: string) => void;
}) {
  const ui = useUiText();
  if (!draft) return <p className="empty-state">{ui.form.empty}</p>;

  if (type === "dialogues") {
    const metadata = normalizeJsonObject(draft.metadata);
    const presentationMode = normalizeDialoguePresentationMode(metadata.presentation_mode);
    return (
      <div className="form-grid">
        <TextField label={ui.form.id} value={draft.id || ""} onChange={(value) => updateField("id", value)} readOnly />
        <TextField label={ui.form.label} value={draft.label} onChange={(value) => updateField("label", value)} />
        <TextField label={ui.form.description} value={draft.description} onChange={(value) => updateField("description", value)} multiline />
        <CheckboxList label={ui.form.chapters} values={getResourceChapterScopeIds(draft)} options={references.chapters} onToggle={(id) => replaceDraft(toggleResourceChapterScope(draft, id))} />
        <SelectField label={ui.form.startNode} value={draft.start || ""} options={buildDialogueStartOptions(draft, references.characters)} onChange={(value) => updateField("start", value)} />
        <SelectLiteralField label={ui.form.presentationMode} value={presentationMode} options={["normal", "talk", "investigation", "statement"]} labels={ui.presentationModes} onChange={(value) => replaceDraft(withDialoguePresentationMode(draft, value))} />
        <SelectField label={ui.form.nextDialogue} value={metadata.next_dialogue || ""} options={references.dialogues.filter((dialogue) => dialogue.id !== String(draft.id || ""))} onChange={(value) => replaceDraft(withDialogueMetadataEntry(draft, "next_dialogue", value))} />
        {(presentationMode === "talk" || presentationMode === "investigation") && (
          <>
            <ChoiceJsonField label="locations" value={metadata.locations} expected="object_or_array" onChange={(value) => updateMetadataField("locations", value)} />
            {presentationMode === "investigation" && (
              <InvestigationMapEditor
                locations={metadata.locations ?? metadata.places}
                map={metadata.map ?? metadata.investigation_map}
                nodes={asArray<ResourceRecord>(draft.nodes)}
                onLocationsChange={(value) => updateMetadataField("locations", value)}
                onMapChange={(value) => updateMetadataField("map", value)}
              />
            )}
          </>
        )}
        {(presentationMode === "statement" || isStatementNotebookScopeConfigured(metadata)) && (
          <StatementNotebookScopeEditor
            draft={draft}
            items={references.items}
            characters={references.characters}
            replaceDraft={replaceDraft}
          />
        )}
        <ChoiceJsonField label={ui.form.metadata} value={draft.metadata} expected="object" onChange={(value) => updateField("metadata", value)} />
      </div>
    );
  }

  if (type === "characters") {
    return (
      <div className="form-grid">
        <TextField label={ui.form.id} value={draft.id || ""} onChange={(value) => updateField("id", value)} readOnly />
        <TextField label={ui.form.displayName} value={draft.display_name} onChange={(value) => updateField("display_name", value)} />
        <TextField
          label={ui.form.nameColor}
          previewText={String(draft.display_name || draft.id || "")}
          value={draft.name_color}
          onChange={(value) => updateField("name_color", value)}
          type="color-text"
        />
        <ToggleField label={ui.form.protagonist} checked={normalizeBooleanFlag(draft.protagonist ?? draft.is_protagonist ?? draft.main_character)} onChange={(checked) => updateField("protagonist", checked)} />
        <TextField label={ui.form.description} value={draft.description} onChange={(value) => updateField("description", value)} multiline />
        <TextField label={ui.form.voiceProfile} value={draft.metadata?.voice_profile || ""} onChange={(value) => updateMetadataField("voice_profile", value)} />
        <CheckboxList label={ui.form.chapters} values={getResourceChapterScopeIds(draft)} options={references.chapters} onToggle={(id) => replaceDraft(toggleResourceChapterScope(draft, id))} />
        <PortraitEditor disabled={disabled} draft={draft} updateField={updateField} uploadFile={uploadFile} />
        <Live2dCharacterEditor disabled={disabled} draft={draft} updateField={updateField} uploadFile={uploadFile} />
        <SpectrumOffsetEditor draft={draft} updateField={updateField} />
        <ChoiceJsonField label={ui.form.metadata} value={draft.metadata} expected="object" onChange={(value) => updateField("metadata", value)} />
      </div>
    );
  }

  if (type === "chapters") {
    return (
      <div className="form-grid">
        <TextField label={ui.form.id} value={draft.id || ""} onChange={(value) => updateField("id", value)} readOnly />
        <TextField label={ui.form.title} value={getChapterTitleEditorValue(draft)} onChange={(value) => updateField("title", value)} />
        <TextField label={ui.form.order} value={draft.order} onChange={(value) => updateField("order", Number(value) || 0)} type="number" />
        <SelectField label={ui.form.startDialogue} value={getChapterStartDialogueId(draft)} options={references.dialogues} onChange={(value) => updateField("start_dialogue", value)} />
        <SelectField label="BGM" value={getChapterBgmId(draft)} options={references.storyAssets} onChange={(value) => updateField("bgm", value)} />
        <TextField label={ui.form.description} value={draft.description} onChange={(value) => updateField("description", value)} multiline />
        <CheckboxList label={ui.form.dialogues} values={getChapterDialogueIds(draft)} options={references.dialogues} onToggle={(id) => replaceDraft(toggleChapterDialogueId(draft, id))} />
        <ChoiceJsonField label={ui.form.metadata} value={draft.metadata} expected="object" onChange={(value) => updateField("metadata", value)} />
        <ChapterArtEditor
          disabled={disabled}
          draft={draft}
          notify={notify}
          replaceDraft={replaceDraft}
          savedJsonText={savedJsonText}
          updateField={updateField}
          uploadFile={uploadFile}
        />
      </div>
    );
  }

  if (type === "items") {
    return (
      <div className="form-grid">
        <TextField label={ui.form.id} value={draft.id || ""} onChange={(value) => updateField("id", value)} readOnly />
        <TextField label={ui.form.name} value={draft.name} onChange={(value) => updateField("name", value)} />
        <TextField label={ui.form.image} value={draft.image} onChange={(value) => updateField("image", value)} />
        <UploadField
          disabled={disabled}
          label={ui.form.uploadItemImage}
          accept="image/png,image/jpeg,image/webp,image/gif"
          onUpload={async (file) => {
            const path = await uploadFile(`assets/items/${safeSegment(draft.id || "item")}/image.${fileExtension(file)}`, file);
            updateField("image", path);
            return path;
          }}
        />
        <ItemImagePreview imagePath={draft.image} />
        <TextField label={ui.form.description} value={draft.description} onChange={(value) => updateField("description", value)} multiline />
        <CheckboxList label={ui.form.chapters} values={getResourceChapterScopeIds(draft)} options={references.chapters} onToggle={(id) => replaceDraft(toggleResourceChapterScope(draft, id))} />
        <ChoiceJsonField label={ui.form.metadata} value={draft.metadata} expected="object" onChange={(value) => updateField("metadata", value)} />
      </div>
    );
  }

  const storyAssetKind = normalizeKind(draft.kind || "sfx");

  return (
    <div className="form-grid">
      <TextField label={ui.form.id} value={draft.id || ""} onChange={(value) => updateField("id", value)} readOnly />
      <TextField label={ui.form.displayName} value={draft.display_name} onChange={(value) => updateField("display_name", value)} />
      <SelectLiteralField
        label={ui.form.kind}
        value={storyAssetKind}
        options={["sfx", "bgm", "background"]}
        onChange={(value) => replaceDraft(normalizeStoryAssetDraftForKind({ ...draft, kind: value }, value))}
      />
      <TextField label={ui.form.path} value={draft.path} onChange={(value) => updateField("path", value)} />
      <UploadField
        disabled={disabled}
        label={ui.form.uploadAssetFile}
        accept={storyAssetKind === "background" ? "image/png,image/jpeg,image/webp,image/gif" : "audio/mpeg,audio/ogg,audio/wav,audio/mp4,audio/aac,audio/flac,audio/webm"}
        onUpload={async (file) => {
          const path = await uploadFile(storyAssetUploadPath(draft, file), file);
          updateField("path", path);
          return path;
        }}
      />
      <StoryAssetMediaPreview asset={draft} kind={storyAssetKind} />
      {storyAssetKind !== "background" && <NumberField label={ui.form.volume} value={normalizeNumber(draft.volume, 1, 0, 1)} min={0} max={1} step={0.05} resetValue={1} onChange={(value) => updateField("volume", value)} />}
      {storyAssetKind === "background" && <ToggleField label={ui.form.fixedBackground} checked={Boolean(draft.fixed ?? draft.background_fixed ?? draft.metadata?.fixed)} onChange={(checked) => updateField("fixed", checked)} />}
      <TextField label={ui.form.description} value={draft.description} onChange={(value) => updateField("description", value)} multiline />
      <CheckboxList label={ui.form.chapters} values={getResourceChapterScopeIds(draft)} options={references.chapters} onToggle={(id) => replaceDraft(toggleResourceChapterScope(draft, id))} />
      <ChoiceJsonField label={ui.form.metadata} value={draft.metadata} expected="object" onChange={(value) => updateField("metadata", value)} />
    </div>
  );
}

function StatementNotebookScopeEditor({
  draft,
  characters,
  items,
  replaceDraft
}: {
  draft: ResourceRecord;
  characters: ResourceSummary[];
  items: ResourceSummary[];
  replaceDraft: (nextDraft: ResourceRecord) => void;
}) {
  const ui = useUiText();
  const metadata = normalizeJsonObject(draft.metadata);
  const configured = isStatementNotebookScopeConfigured(metadata);
  const scope = getStatementNotebookScope(metadata);
  return (
    <fieldset className="wide checkbox-list">
      <legend>{ui.form.statementNotebook}</legend>
      <ToggleField
        label={ui.form.customStatementScope}
        checked={configured}
        onChange={(checked) => replaceDraft(checked
          ? withStatementNotebookScope(draft, defaultStatementNotebookScope(characters, items))
          : withoutStatementNotebookScope(draft))}
      />
      {!configured && <span className="muted">{ui.form.defaultStatementScope}</span>}
      {configured && (
        <>
          <CheckboxList
            label={ui.form.notebookCharacters}
            values={scope.characters}
            options={characters}
            onToggle={(id) => replaceDraft(withStatementNotebookScope(draft, toggleNotebookScopeId(scope, "characters", id)))}
          />
          <CheckboxList
            label={ui.form.notebookItems}
            values={scope.items}
            options={items}
            onToggle={(id) => replaceDraft(withStatementNotebookScope(draft, toggleNotebookScopeId(scope, "items", id)))}
          />
        </>
      )}
    </fieldset>
  );
}

function portraitRecordForEditor(value: ResourceRecord | string | undefined) {
  if (typeof value === "string") return { path: value };
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function PortraitEditor({
  disabled,
  draft,
  updateField,
  uploadFile
}: {
  disabled: boolean;
  draft: ResourceRecord;
  updateField: (field: string, value: unknown) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  const ui = useUiText();
  const portraits = draft.portraits && typeof draft.portraits === "object" ? draft.portraits as Record<string, ResourceRecord | string> : {};
  const entries = Object.entries(portraits);

  function setPortraits(next: Record<string, ResourceRecord | string>) {
    updateField("portraits", next);
  }

  function renamePortrait(oldKey: string, nextKey: string) {
    const clean = safeSegment(nextKey || oldKey, "default");
    if (clean === oldKey) return;
    const next: Record<string, ResourceRecord | string> = {};
    for (const [key, value] of entries) {
      if (key === oldKey) {
        if (Object.prototype.hasOwnProperty.call(next, clean)) continue;
        next[clean] = value;
      } else if (!Object.prototype.hasOwnProperty.call(next, key)) {
        next[key] = value;
      }
    }
    setPortraits(next);
  }

  function updatePortrait(key: string, patch: ResourceRecord) {
    setPortraits({ ...portraits, [key]: { ...portraitRecordForEditor(portraits[key]), ...patch } });
  }

  function removePortrait(key: string) {
    const next = { ...portraits };
    delete next[key];
    setPortraits(next);
  }

  return (
    <div className="wide structured-editor portrait-editor">
      <div className="structured-header">
        <span>{ui.form.portraits}</span>
      </div>
      {entries.length === 0 && <p className="empty-state">{ui.form.noPortraits}</p>}
      {entries.map(([key, portrait], index) => (
        <PortraitRowEditor
          characterId={String(draft.id || "character")}
          disabled={disabled}
          key={`portrait-row-${index}`}
          onRemove={() => removePortrait(key)}
          onRename={(nextKey) => renamePortrait(key, nextKey)}
          onUpdate={(patch) => updatePortrait(key, patch)}
          portrait={portrait}
          portraitKey={key}
          uploadFile={uploadFile}
        />
      ))}
    </div>
  );
}

function PortraitRowEditor({
  characterId,
  disabled,
  onRemove,
  onRename,
  onUpdate,
  portrait,
  portraitKey,
  uploadFile
}: {
  characterId: string;
  disabled: boolean;
  onRemove: () => void;
  onRename: (nextKey: string) => void;
  onUpdate: (patch: ResourceRecord) => void;
  portrait: ResourceRecord | string;
  portraitKey: string;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  const ui = useUiText();
  const [draftKey, setDraftKey] = useState(portraitKey);
  const portraitRecord = portraitRecordForEditor(portrait);
  const center = asArray<number>(portraitRecord.center);
  const profile = portraitRecord.profile && typeof portraitRecord.profile === "object" ? portraitRecord.profile as ResourceRecord : {};
  const profileOffset = getProfileOffset(profile);
  const centerPoint = getPortraitCenterPoint(center);

  useEffect(() => {
    setDraftKey(portraitKey);
  }, [portraitKey]);

  function commitPortraitKey() {
    const clean = safeSegment(draftKey || portraitKey, "default");
    setDraftKey(clean);
    if (clean !== portraitKey) onRename(clean);
  }

  return (
    <article className="structured-row portrait-row">
      <div className="portrait-entry-fields">
        <TextField
          label={ui.form.key}
          value={draftKey}
          onBlur={commitPortraitKey}
          onChange={setDraftKey}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
        <TextField label={ui.form.path} value={portraitRecord.path || ""} onChange={(value) => onUpdate({ path: value })} />
        <UploadField
          disabled={disabled}
          label={ui.form.uploadPortrait}
          accept="image/png,image/jpeg,image/webp,image/gif"
          onUpload={async (file) => {
            const path = await uploadFile(`assets/characters/${safeSegment(characterId)}/${safeSegment(portraitKey)}.${fileExtension(file)}`, file);
            onUpdate({ path });
            return path;
          }}
        />
      </div>
      <div className="portrait-visual-area">
        <PortraitCenterEditor
          label={ui.form.center}
          imagePath={portraitRecord.path}
          x={centerPoint.x}
          y={centerPoint.y}
          onChange={(x, y) => onUpdate({ center: [x, y] })}
        />
        <ProfileCropEditor
          faceCenter={centerPoint}
          imagePath={portraitRecord.path}
          profile={profile}
          onChangeProfile={(nextProfile) => onUpdate({ profile: nextProfile })}
        />
      </div>
      <div className="portrait-controls-panel">
        <NumberField label={ui.form.centerX} value={center[0] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => onUpdate({ center: [value, center[1] ?? 0.5] })} />
        <NumberField label={ui.form.centerY} value={center[1] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => onUpdate({ center: [center[0] ?? 0.5, value] })} />
        <NumberField label={ui.form.profileZoom} value={getProfileZoom(profile.zoom)} min={profileZoomMin} max={profileZoomMax} step={profileZoomStep} resetValue={profileZoomDefault} onChange={(value) => onUpdate({ profile: withProfileZoom(profile, value) })} />
        <NumberField label={ui.form.profileOffsetX} value={profileOffset.x} min={-1} max={1} step={0.01} resetValue={0} onChange={(value) => onUpdate({ profile: withProfileOffset(profile, { x: value, y: profileOffset.y }) })} />
        <NumberField label={ui.form.profileOffsetY} value={profileOffset.y} min={-1} max={1} step={0.01} resetValue={0} onChange={(value) => onUpdate({ profile: withProfileOffset(profile, { x: profileOffset.x, y: value }) })} />
        <button className="danger-action" disabled={disabled} type="button" onClick={onRemove}><Icon name="Delete" />{ui.common.delete}</button>
      </div>
    </article>
  );
}

const live2dMotionFields = ["x", "y", "rotation", "scale", "opacity", "frequency", "phase"] as const;
type Live2dMotionField = typeof live2dMotionFields[number];
const live2dAngleFields = ["x", "y", "rotation", "scaleX", "scaleY", "skewX", "skewY", "opacity"] as const;
type Live2dAngleField = typeof live2dAngleFields[number];
type Live2dEditorTab = "preview" | "setup" | "parts" | "angle" | "motions";

const live2dMotionFieldDefaults: Record<Live2dMotionField, number> = {
  x: 0,
  y: 0,
  rotation: 0,
  scale: 0,
  opacity: 0,
  frequency: live2dMotionFrequencyDefault,
  phase: 0
};

const live2dMotionFieldLimits: Record<Live2dMotionField, { min: number; max: number; step: number }> = {
  x: { min: -300, max: 300, step: 1 },
  y: { min: -300, max: 300, step: 1 },
  rotation: { min: -45, max: 45, step: 0.5 },
  scale: { min: 0, max: 0.5, step: 0.01 },
  opacity: { min: -1, max: 1, step: 0.01 },
  frequency: { min: 0.1, max: 5, step: 0.05 },
  phase: { min: 0, max: 6.283, step: 0.05 }
};

const live2dAngleFieldDefaults: Record<Live2dAngleField, number> = {
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 0,
  scaleY: 0,
  skewX: 0,
  skewY: 0,
  opacity: 0
};

const live2dAngleFieldLimits: Record<Live2dAngleField, { min: number; max: number; step: number }> = {
  x: { min: -500, max: 500, step: 1 },
  y: { min: -500, max: 500, step: 1 },
  rotation: { min: -60, max: 60, step: 0.5 },
  scaleX: { min: -0.75, max: 0.75, step: 0.01 },
  scaleY: { min: -0.75, max: 0.75, step: 0.01 },
  skewX: { min: -45, max: 45, step: 0.5 },
  skewY: { min: -45, max: 45, step: 0.5 },
  opacity: { min: -1, max: 1, step: 0.01 }
};

function Live2dCharacterEditor({
  disabled,
  draft,
  updateField,
  uploadFile
}: {
  disabled: boolean;
  draft: ResourceRecord;
  updateField: (field: string, value: unknown) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  const language = useContext(LanguageContext);
  const copy = live2dEditorCopy(language);
  const live2d = live2dRecordForEditor(draft.live2d);
  const parts = getLive2dParts(live2d.parts);
  const motions = getLive2dMotions(live2d.motions);
  const angleRig = getLive2dAngleRig(live2d.angle_rig);
  const motionKeys = Object.keys(motions);
  const motionEntries = Object.entries(motions);
  const canvasSize = getLive2dCanvasSize(live2d.canvas_size);
  const center = getPortraitCenterPoint(live2d.center ?? live2d.face_center);
  const defaultMotionKey = String(live2d.default_motion || "").trim();
  const initialPreviewMotion = defaultMotionKey && motions[defaultMotionKey] ? defaultMotionKey : (motionKeys[0] || "");
  const motionKeysSignature = motionKeys.join("\u0000");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Live2dEditorTab>("preview");
  const [previewMotionKey, setPreviewMotionKey] = useState(initialPreviewMotion);
  const [previewAngle, setPreviewAngle] = useState(0);
  const [previewPlaying, setPreviewPlaying] = useState(true);
  const [previewResetToken, setPreviewResetToken] = useState(0);

  useEffect(() => {
    if (!settingsOpen) return;
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setSettingsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [settingsOpen]);

  useEffect(() => {
    if (!motionKeys.length) {
      if (previewMotionKey) setPreviewMotionKey("");
      return;
    }
    if (!previewMotionKey || !motions[previewMotionKey]) {
      setPreviewMotionKey(initialPreviewMotion);
    }
  }, [initialPreviewMotion, motionKeysSignature, previewMotionKey]);

  function setLive2d(next: ResourceRecord) {
    updateField("live2d", next);
  }

  function patchLive2d(patch: ResourceRecord) {
    setLive2d({ ...live2d, ...patch });
  }

  function setParts(nextParts: ResourceRecord[]) {
    setLive2d({ ...live2d, parts: nextParts });
  }

  function updatePart(index: number, patch: ResourceRecord) {
    setParts(parts.map((part, partIndex) => partIndex === index ? { ...part, ...patch } : part));
  }

  function renamePart(index: number, nextId: string) {
    const current = parts[index];
    if (!current) return;
    const oldId = String(current.id || "").trim();
    const clean = nextUniqueId(parts.map((part, partIndex) => partIndex === index ? "" : String(part.id || "")), safeSegment(nextId || oldId || "part", "part"));
    const nextParts = parts.map((part, partIndex) => partIndex === index ? { ...part, id: clean } : part);
    const nextMotions = { ...motions };
    const nextAngleRig = { ...angleRig, parts: { ...getLive2dAngleParts(angleRig.parts) } };
    if (oldId && oldId !== clean) {
      for (const [motionKey, motion] of Object.entries(nextMotions)) {
        const motionParts = getLive2dMotionParts(motion.parts);
        if (!motionParts[oldId] || motionParts[clean]) continue;
        motionParts[clean] = motionParts[oldId];
        delete motionParts[oldId];
        nextMotions[motionKey] = { ...motion, parts: motionParts };
      }
      const angleParts = getLive2dAngleParts(nextAngleRig.parts);
      if (angleParts[oldId] && !angleParts[clean]) {
        angleParts[clean] = angleParts[oldId];
        delete angleParts[oldId];
        nextAngleRig.parts = angleParts;
      }
    }
    setLive2d({ ...live2d, parts: nextParts, motions: nextMotions, angle_rig: nextAngleRig });
  }

  function addPart() {
    const partId = nextUniqueId(parts.map((part) => String(part.id || "")), "part");
    setParts([
      ...parts,
      {
        id: partId,
        path: "",
        position: [roundForInput(canvasSize.x * 0.5), roundForInput(canvasSize.y * 0.5)],
        anchor: [0.5, 0.5],
        scale: [1, 1],
        rotation: 0,
        opacity: 1,
        z_index: parts.length
      }
    ]);
  }

  function removePart(index: number) {
    const partId = String(parts[index]?.id || "").trim();
    const nextParts = parts.filter((_, partIndex) => partIndex !== index);
    const nextMotions = { ...motions };
    const nextAngleRig = { ...angleRig, parts: { ...getLive2dAngleParts(angleRig.parts) } };
    if (partId) {
      for (const [motionKey, motion] of Object.entries(nextMotions)) {
        const motionParts = getLive2dMotionParts(motion.parts);
        if (!motionParts[partId]) continue;
        delete motionParts[partId];
        nextMotions[motionKey] = { ...motion, parts: motionParts };
      }
      const angleParts = getLive2dAngleParts(nextAngleRig.parts);
      delete angleParts[partId];
      nextAngleRig.parts = angleParts;
    }
    setLive2d({ ...live2d, parts: nextParts, motions: nextMotions, angle_rig: nextAngleRig });
  }

  function setMotions(nextMotions: Record<string, ResourceRecord>) {
    setLive2d({ ...live2d, motions: nextMotions });
  }

  function addMotion() {
    const key = nextUniqueId(Object.keys(motions), "default");
    setMotions({ ...motions, [key]: { speed: live2dMotionSpeedDefault, parts: {} } });
    if (!String(live2d.default_motion || "").trim()) {
      patchLive2d({ default_motion: key, motions: { ...motions, [key]: { speed: live2dMotionSpeedDefault, parts: {} } } });
    }
  }

  function renameMotion(oldKey: string, nextKey: string) {
    const clean = nextUniqueId(Object.keys(motions).filter((key) => key !== oldKey), safeSegment(nextKey || oldKey, "default"));
    if (clean === oldKey) return;
    const nextMotions: Record<string, ResourceRecord> = {};
    for (const [key, value] of Object.entries(motions)) {
      nextMotions[key === oldKey ? clean : key] = value;
    }
    setLive2d({
      ...live2d,
      default_motion: String(live2d.default_motion || "") === oldKey ? clean : live2d.default_motion,
      motions: nextMotions
    });
  }

  function removeMotion(key: string) {
    const nextMotions = { ...motions };
    delete nextMotions[key];
    setLive2d({
      ...live2d,
      default_motion: String(live2d.default_motion || "") === key ? "" : live2d.default_motion,
      motions: nextMotions
    });
  }

  function updateMotion(key: string, patch: ResourceRecord) {
    setMotions({ ...motions, [key]: { ...motions[key], ...patch } });
  }

  function updateMotionPart(motionKey: string, partId: string, patch: ResourceRecord) {
    const motion = motions[motionKey] || {};
    const motionParts = getLive2dMotionParts(motion.parts);
    motionParts[partId] = { ...motionParts[partId], ...patch };
    updateMotion(motionKey, { parts: motionParts });
  }

  function patchAngleRig(patch: ResourceRecord) {
    setLive2d({ ...live2d, angle_rig: { ...angleRig, ...patch } });
  }

  function updateAnglePart(partId: string, patch: ResourceRecord) {
    const angleParts = getLive2dAngleParts(angleRig.parts);
    angleParts[partId] = { ...angleParts[partId], ...patch };
    patchAngleRig({ parts: angleParts });
  }

  const previewMotion = previewMotionKey ? motions[previewMotionKey] || {} : {};
  const previewParts = applyLive2dAngleRigToEditorParts(parts, angleRig, previewAngle);
  const live2dTabs: Array<{ id: Live2dEditorTab; label: string }> = [
    { id: "preview", label: copy.previewTab },
    { id: "setup", label: copy.setupTab },
    { id: "parts", label: copy.partsTab },
    { id: "angle", label: copy.angleTab },
    { id: "motions", label: copy.motionsTab }
  ];

  return (
    <div className="wide structured-editor live2d-editor live2d-launcher">
      <div className="structured-header">
        <span>{copy.title}</span>
        <button disabled={disabled} type="button" onClick={() => setSettingsOpen(true)}>
          <Icon name="Tune" />{copy.openSettings}
        </button>
      </div>
      <div className="live2d-summary-grid">
        <div>
          <strong>{parts.length}</strong>
          <span>{copy.parts}</span>
        </div>
        <div>
          <strong>{motionEntries.length}</strong>
          <span>{copy.motions}</span>
        </div>
        <div>
          <strong>{getLive2dAngleMax(angleRig)}°</strong>
          <span>{copy.angleRig}</span>
        </div>
        <div>
          <strong>{normalizeBooleanFlag(live2d.enabled) ? copy.enabledOn : copy.enabledOff}</strong>
          <span>{copy.enabled}</span>
        </div>
        <div>
          <strong>{defaultMotionKey || "-"}</strong>
          <span>{copy.defaultMotion}</span>
        </div>
      </div>

      {settingsOpen && (
        <div className="live2d-modal-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSettingsOpen(false);
        }}>
          <section className="live2d-modal" aria-modal="true" role="dialog" aria-label={copy.title}>
            <header className="live2d-modal-header">
              <div>
                <strong>{copy.title}</strong>
                <span>{String(draft.display_name || draft.id || "")}</span>
              </div>
              <button className="icon-only-action" type="button" onClick={() => setSettingsOpen(false)} aria-label={copy.close}>
                <Icon name="Close" />
              </button>
            </header>

            <div className="live2d-modal-tabs" role="tablist">
              {live2dTabs.map((entry) => (
                <button
                  aria-selected={activeTab === entry.id}
                  className={activeTab === entry.id ? "active" : ""}
                  key={entry.id}
                  role="tab"
                  type="button"
                  onClick={() => setActiveTab(entry.id)}
                >
                  {entry.label}
                </button>
              ))}
            </div>

            <div className="live2d-modal-body">
              {activeTab === "preview" && (
                <div className="live2d-preview-workspace">
                  <Live2dPartsPreview
                    canvasSize={canvasSize}
                    motion={previewMotion}
                    motionKey={previewMotionKey}
                    parts={previewParts}
                    playing={previewPlaying}
                    resetToken={previewResetToken}
                  />
                  <div className="live2d-preview-controls">
                    {motionKeys.length > 0 && (
                      <SelectLiteralField
                        label={copy.previewMotion}
                        value={previewMotionKey}
                        options={motionKeys}
                        onChange={setPreviewMotionKey}
                      />
                    )}
                    <NumberField
                      label={copy.previewAngle}
                      value={previewAngle}
                      min={-45}
                      max={45}
                      step={5}
                      resetValue={0}
                      onChange={setPreviewAngle}
                    />
                    <button type="button" onClick={() => setPreviewPlaying((playing) => !playing)}>
                      <Icon name={previewPlaying ? "PauseCircle" : "PlayCircle"} />
                      {previewPlaying ? copy.pause : copy.play}
                    </button>
                    <button type="button" onClick={() => setPreviewResetToken((value) => value + 1)}>
                      <Icon name="RestartAlt" />
                      {copy.resetPreview}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "setup" && (
                <div className="live2d-settings-grid">
                  <ToggleField label={copy.enabled} checked={normalizeBooleanFlag(live2d.enabled)} onChange={(checked) => patchLive2d({ enabled: checked })} />
                  <TextField label={copy.defaultMotion} value={live2d.default_motion || ""} onChange={(value) => patchLive2d({ default_motion: safeSegment(value, "default") })} />
                  <NumberField label={copy.canvasWidth} value={canvasSize.x} min={100} max={4000} step={50} resetValue={live2dCanvasWidthDefault} onChange={(value) => patchLive2d({ canvas_size: [value, canvasSize.y] })} />
                  <NumberField label={copy.canvasHeight} value={canvasSize.y} min={100} max={5000} step={50} resetValue={live2dCanvasHeightDefault} onChange={(value) => patchLive2d({ canvas_size: [canvasSize.x, value] })} />
                  <NumberField label={copy.centerX} value={center.x} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => patchLive2d({ center: [value, center.y] })} />
                  <NumberField label={copy.centerY} value={center.y} min={0} max={1} step={0.01} resetValue={0.34} onChange={(value) => patchLive2d({ center: [center.x, value] })} />
                </div>
              )}

              {activeTab === "parts" && (
                <div className="live2d-section">
                  <div className="structured-header">
                    <span>{copy.parts}</span>
                    <button disabled={disabled} type="button" onClick={addPart}><Icon name="Add" />{copy.addPart}</button>
                  </div>
                  {parts.length === 0 && <p className="empty-state">{copy.noParts}</p>}
                  {parts.map((part, index) => (
                    <Live2dPartRow
                      canvasSize={canvasSize}
                      characterId={String(draft.id || "character")}
                      copy={copy}
                      disabled={disabled}
                      key={`live2d-part-${index}`}
                      onRemove={() => removePart(index)}
                      onRename={(nextId) => renamePart(index, nextId)}
                      onUpdate={(patch) => updatePart(index, patch)}
                      part={part}
                      uploadFile={uploadFile}
                    />
                  ))}
                </div>
              )}

              {activeTab === "angle" && (
                <div className="live2d-section">
                  <div className="structured-header">
                    <span>{copy.angleRig}</span>
                  </div>
                  <Live2dAngleRigEditor
                    angleRig={angleRig}
                    copy={copy}
                    onUpdate={patchAngleRig}
                    onUpdatePart={updateAnglePart}
                    parts={parts}
                  />
                </div>
              )}

              {activeTab === "motions" && (
                <div className="live2d-section">
                  <div className="structured-header">
                    <span>{copy.motions}</span>
                    <button disabled={disabled} type="button" onClick={addMotion}><Icon name="Add" />{copy.addMotion}</button>
                  </div>
                  {motionEntries.length === 0 && <p className="empty-state">{copy.noMotions}</p>}
                  {motionEntries.map(([motionKey, motion]) => (
                    <Live2dMotionEditor
                      copy={copy}
                      disabled={disabled}
                      key={`live2d-motion-${motionKey}`}
                      motion={motion}
                      motionKey={motionKey}
                      parts={parts}
                      onRemove={() => removeMotion(motionKey)}
                      onRename={(nextKey) => renameMotion(motionKey, nextKey)}
                      onUpdate={(patch) => updateMotion(motionKey, patch)}
                      onUpdatePart={(partId, patch) => updateMotionPart(motionKey, partId, patch)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Live2dPartRow({
  canvasSize,
  characterId,
  copy,
  disabled,
  onRemove,
  onRename,
  onUpdate,
  part,
  uploadFile
}: {
  canvasSize: PointerPoint;
  characterId: string;
  copy: ReturnType<typeof live2dEditorCopy>;
  disabled: boolean;
  onRemove: () => void;
  onRename: (nextId: string) => void;
  onUpdate: (patch: ResourceRecord) => void;
  part: ResourceRecord;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  const [draftId, setDraftId] = useState(String(part.id || ""));
  const position = getLive2dPoint(part.position, canvasSize.x * 0.5, canvasSize.y * 0.5);
  const anchor = getLive2dPoint(part.anchor, 0.5, 0.5);
  const scale = getLive2dPoint(part.scale, 1, 1);

  useEffect(() => {
    setDraftId(String(part.id || ""));
  }, [part.id]);

  function commitPartId() {
    const clean = safeSegment(draftId || part.id || "part", "part");
    setDraftId(clean);
    if (clean !== part.id) onRename(clean);
  }

  return (
    <article className="structured-row live2d-part-row">
      <div className="live2d-part-main">
        <TextField
          label={copy.partId}
          value={draftId}
          onBlur={commitPartId}
          onChange={setDraftId}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
        <TextField label={copy.path} value={part.path || ""} onChange={(value) => onUpdate({ path: value })} />
        <UploadField
          disabled={disabled}
          label={copy.uploadPart}
          accept="image/png,image/jpeg,image/webp,image/gif"
          onUpload={async (file) => {
            const path = await uploadFile(`assets/characters/${safeSegment(characterId)}/live2d/${safeSegment(part.id || "part")}.${fileExtension(file)}`, file);
            onUpdate({ path });
            return path;
          }}
        />
      </div>
      <div className="live2d-part-controls">
        <NumberField label={copy.zIndex} value={part.z_index ?? part.order ?? 0} min={-100} max={100} step={1} resetValue={0} onChange={(value) => onUpdate({ z_index: value })} />
        <NumberField label={copy.x} value={position.x} min={-canvasSize.x} max={canvasSize.x * 2} step={1} resetValue={canvasSize.x * 0.5} onChange={(value) => onUpdate({ position: [value, position.y] })} />
        <NumberField label={copy.y} value={position.y} min={-canvasSize.y} max={canvasSize.y * 2} step={1} resetValue={canvasSize.y * 0.5} onChange={(value) => onUpdate({ position: [position.x, value] })} />
        <NumberField label={copy.anchorX} value={anchor.x} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => onUpdate({ anchor: [value, anchor.y] })} />
        <NumberField label={copy.anchorY} value={anchor.y} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => onUpdate({ anchor: [anchor.x, value] })} />
        <NumberField label={copy.scaleX} value={scale.x} min={0.01} max={5} step={0.01} resetValue={1} onChange={(value) => onUpdate({ scale: [value, scale.y] })} />
        <NumberField label={copy.scaleY} value={scale.y} min={0.01} max={5} step={0.01} resetValue={1} onChange={(value) => onUpdate({ scale: [scale.x, value] })} />
        <NumberField label={copy.rotation} value={part.rotation ?? 0} min={-360} max={360} step={1} resetValue={0} onChange={(value) => onUpdate({ rotation: value })} />
        <NumberField label={copy.opacity} value={part.opacity ?? part.alpha ?? 1} min={0} max={1} step={0.01} resetValue={1} onChange={(value) => onUpdate({ opacity: value })} />
        <button className="danger-action" disabled={disabled} type="button" onClick={onRemove}><Icon name="Delete" />{copy.deletePart}</button>
      </div>
    </article>
  );
}

function Live2dAngleRigEditor({
  angleRig,
  copy,
  onUpdate,
  onUpdatePart,
  parts
}: {
  angleRig: ResourceRecord;
  copy: ReturnType<typeof live2dEditorCopy>;
  onUpdate: (patch: ResourceRecord) => void;
  onUpdatePart: (partId: string, patch: ResourceRecord) => void;
  parts: ResourceRecord[];
}) {
  const maxAngle = getLive2dAngleMax(angleRig);
  return (
    <div className="live2d-angle-card">
      <div className="live2d-angle-grid">
        <ToggleField label={copy.angleEnabled} checked={normalizeBooleanFlag(angleRig.enabled)} onChange={(checked) => onUpdate({ enabled: checked })} />
        <NumberField label={copy.angleMax} value={maxAngle} min={1} max={45} step={1} resetValue={45} onChange={(value) => onUpdate({ max_angle: value })} />
        <ToggleField label={copy.angleMirror} checked={normalizeBooleanFlag(angleRig.mirror_x ?? angleRig.mirror, true)} onChange={(checked) => onUpdate({ mirror_x: checked })} />
      </div>
      <div className="live2d-angle-parts">
        {parts.length === 0 && <span className="muted">{copy.angleNeedsParts}</span>}
        {parts.map((part) => {
          const partId = String(part.id || "").trim();
          if (!partId) return null;
          const entry = getLive2dAnglePartEntry(angleRig, partId);
          return (
            <div className="live2d-angle-part" key={`angle-${partId}`}>
              <strong>{partId}</strong>
              {live2dAngleFields.map((field) => {
                const limits = live2dAngleFieldLimits[field];
                return (
                  <NumberField
                    key={field}
                    label={copy.angleFields[field]}
                    max={limits.max}
                    min={limits.min}
                    resetValue={live2dAngleFieldDefaults[field]}
                    step={limits.step}
                    value={entry[field] ?? live2dAngleFieldDefaults[field]}
                    onChange={(value) => onUpdatePart(partId, { [field]: value })}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Live2dMotionEditor({
  copy,
  disabled,
  motion,
  motionKey,
  onRemove,
  onRename,
  onUpdate,
  onUpdatePart,
  parts
}: {
  copy: ReturnType<typeof live2dEditorCopy>;
  disabled: boolean;
  motion: ResourceRecord;
  motionKey: string;
  onRemove: () => void;
  onRename: (nextKey: string) => void;
  onUpdate: (patch: ResourceRecord) => void;
  onUpdatePart: (partId: string, patch: ResourceRecord) => void;
  parts: ResourceRecord[];
}) {
  const [draftKey, setDraftKey] = useState(motionKey);

  useEffect(() => {
    setDraftKey(motionKey);
  }, [motionKey]);

  function commitMotionKey() {
    const clean = safeSegment(draftKey || motionKey, "default");
    setDraftKey(clean);
    if (clean !== motionKey) onRename(clean);
  }

  return (
    <details className="live2d-motion-card" open>
      <summary>
        <strong>{motionKey}</strong>
        <span>{copy.motionSummary}</span>
      </summary>
      <div className="live2d-motion-grid">
        <TextField
          label={copy.motionKey}
          value={draftKey}
          onBlur={commitMotionKey}
          onChange={setDraftKey}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
        <NumberField label={copy.speed} value={motion.speed ?? live2dMotionSpeedDefault} min={0.1} max={5} step={0.05} resetValue={live2dMotionSpeedDefault} onChange={(value) => onUpdate({ speed: value })} />
        <button className="danger-action" disabled={disabled} type="button" onClick={onRemove}><Icon name="Delete" />{copy.deleteMotion}</button>
      </div>
      <div className="live2d-motion-parts">
        {parts.length === 0 && <span className="muted">{copy.motionNeedsParts}</span>}
        {parts.map((part) => {
          const partId = String(part.id || "").trim();
          if (!partId) return null;
          const entry = getLive2dMotionPartEntry(motion, partId);
          return (
            <div className="live2d-motion-part" key={`${motionKey}-${partId}`}>
              <strong>{partId}</strong>
              {live2dMotionFields.map((field) => {
                const limits = live2dMotionFieldLimits[field];
                return (
                  <NumberField
                    key={field}
                    label={copy.motionFields[field]}
                    max={limits.max}
                    min={limits.min}
                    resetValue={live2dMotionFieldDefaults[field]}
                    step={limits.step}
                    value={entry[field] ?? live2dMotionFieldDefaults[field]}
                    onChange={(value) => onUpdatePart(partId, { [field]: value })}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </details>
  );
}

function Live2dPartsPreview({
  canvasSize,
  motion = {},
  motionKey = "",
  parts,
  playing = false,
  resetToken = 0
}: {
  canvasSize: PointerPoint;
  motion?: ResourceRecord;
  motionKey?: string;
  parts: ResourceRecord[];
  playing?: boolean;
  resetToken?: number;
}) {
  const [time, setTime] = useState(0);
  const [imageSizes, setImageSizes] = useState<Record<string, PointerPoint>>({});
  const visibleParts = [...parts]
    .filter((part) => String(part.path || "").trim())
    .sort((a, b) => Number(a.z_index ?? a.order ?? 0) - Number(b.z_index ?? b.order ?? 0));
  const frameStyle = {
    aspectRatio: `${Math.max(canvasSize.x, 1)} / ${Math.max(canvasSize.y, 1)}`
  } as CSSProperties;
  const motionParts = getLive2dMotionParts(motion.parts);
  const speed = normalizeNumber(motion.speed, live2dMotionSpeedDefault, 0.1, 5);

  useEffect(() => {
    setTime(0);
  }, [motionKey, resetToken]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let cancelled = false;
    const start = performance.now();
    const initialTime = time;
    function tick(now: number) {
      if (cancelled) return;
      setTime(initialTime + ((now - start) / 1000) * speed);
      frame = window.requestAnimationFrame(tick);
    }
    frame = window.requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [playing, speed, motionKey, resetToken]);

  function rememberImageSize(path: string, image: HTMLImageElement) {
    if (!path || image.naturalWidth <= 0 || image.naturalHeight <= 0) return;
    const current = imageSizes[path];
    if (current?.x === image.naturalWidth && current?.y === image.naturalHeight) return;
    setImageSizes((sizes) => ({
      ...sizes,
      [path]: { x: image.naturalWidth, y: image.naturalHeight }
    }));
  }

  return (
    <div className="live2d-preview">
      <div className="live2d-preview-frame" style={frameStyle}>
        {visibleParts.length === 0 && <span>Live2D parts preview</span>}
        {visibleParts.map((part, index) => {
          const path = String(part.path || "");
          const position = getLive2dPoint(part.position, canvasSize.x * 0.5, canvasSize.y * 0.5);
          const anchor = getLive2dPoint(part.anchor, 0.5, 0.5);
          const scale = getLive2dPoint(part.scale, 1, 1);
          const skew = getLive2dPoint(part.skew, 0, 0);
          const partId = String(part.id || "").trim();
          const entry = getLive2dMotionPartEntry({ parts: motionParts }, partId);
          const frequency = normalizeNumber(entry.frequency, live2dMotionFrequencyDefault, 0.1, 5);
          const phase = normalizeNumber(entry.phase, 0, 0, Math.PI * 2);
          const wave = Math.sin(time * Math.PI * 2 * frequency + phase);
          const motionX = normalizeNumber(entry.x, 0, -300, 300) * wave;
          const motionY = normalizeNumber(entry.y, 0, -300, 300) * wave;
          const motionRotation = normalizeNumber(entry.rotation, 0, -45, 45) * wave;
          const motionScale = normalizeNumber(entry.scale, 0, 0, 0.5) * wave;
          const opacity = clampNumber(
            normalizeNumber(part.opacity ?? part.alpha, 1, 0, 1) + normalizeNumber(entry.opacity, 0, -1, 1) * wave,
            0,
            1,
            1
          );
          const imageSize = imageSizes[path];
          const left = `${((position.x + motionX) / Math.max(canvasSize.x, 1)) * 100}%`;
          const top = `${((position.y + motionY) / Math.max(canvasSize.y, 1)) * 100}%`;
          const transform = `translate(${-anchor.x * 100}%, ${-anchor.y * 100}%) rotate(${normalizeNumber(part.rotation, 0) + motionRotation}deg) skew(${normalizeNumber(skew.x, 0)}deg, ${normalizeNumber(skew.y, 0)}deg) scale(${Math.max(0.01, scale.x + motionScale)}, ${Math.max(0.01, scale.y + motionScale)})`;
          return (
            <img
              alt=""
              key={`${part.id || "part"}-${index}`}
              src={resPathToAssetUrl(path)}
              onLoad={(event) => rememberImageSize(path, event.currentTarget)}
              style={{
                height: imageSize ? "auto" : undefined,
                left,
                opacity,
                top,
                transform,
                width: imageSize ? `${(imageSize.x / Math.max(canvasSize.x, 1)) * 100}%` : undefined,
                zIndex: Number(part.z_index ?? part.order ?? index)
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

const chapterGraphWidth = 1800;
const chapterGraphHeight = 1080;
const chapterGraphNodeWidth = 250;
const chapterGraphNodeHeight = 104;

type ChapterGraphDrag = {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  originalX: number;
  originalY: number;
  active: boolean;
};

const chapterGraphDragThreshold = 4;

const chapterGraphGridX = 410;
const chapterGraphGridY = 230;
const chapterGraphFitMargin = 96;
const chapterGraphFitMaxZoom = 1.15;

function ChapterGraphEditor({
  disabled,
  draft,
  dialogues,
  notify,
  onOpenDialogue,
  replaceDraft,
  setStartDialogue
}: {
  disabled: boolean;
  draft: ResourceRecord;
  dialogues: ResourceSummary[];
  notify: (message: string) => void;
  onOpenDialogue: (dialogueId: string) => void;
  replaceDraft: (nextDraft: ResourceRecord) => void;
  setStartDialogue: (dialogueId: string) => void;
}) {
  const ui = useUiText();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<ChapterGraphDrag | null>(null);
  const suppressStageClickRef = useRef(false);
  const placedIds = useMemo(() => getChapterDialogueIds(draft), [draft.dialogues, draft.dialogue_ids]);
  const positionMap = getChapterGraphPositionMap(draft);
  const dialogueSummaryMap = useMemo(() => new Map(dialogues.map((dialogue) => [dialogue.id, dialogue])), [dialogues]);
  const unplacedDialogues = useMemo(() => dialogues.filter((dialogue) => !placedIds.includes(dialogue.id)), [dialogues, placedIds]);
  const [dialogueData, setDialogueData] = useState<Record<string, ResourceRecord>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [dialogueSearch, setDialogueSearch] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [selectedEdgeFromId, setSelectedEdgeFromId] = useState("");
  const [edgeSourceId, setEdgeSourceId] = useState("");
  const [dialogueToPlaceId, setDialogueToPlaceId] = useState("");
  const [graphZoom, setGraphZoom] = useState(1);
  const [connectionPointer, setConnectionPointer] = useState<PointerPoint | null>(null);
  const selectedEdge = selectedEdgeFromId ? getChapterGraphNext(dialogueData[selectedEdgeFromId]) : "";
  const incomingIds = selectedNodeId
    ? placedIds.filter((id) => id !== selectedNodeId && getChapterGraphNext(dialogueData[id]) === selectedNodeId)
    : [];
  const filteredDialogues = useMemo(() => {
    const query = dialogueSearch.trim().toLowerCase();
    if (!query) return dialogues;
    return dialogues.filter((dialogue) => {
      const haystack = `${dialogue.id} ${dialogue.title} ${dialogue.subtitle || ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [dialogues, dialogueSearch]);
  const startDialogueId = getChapterStartDialogueId(draft);

  useEffect(() => {
    let cancelled = false;
    if (placedIds.length === 0) {
      setDialogueData({});
      setLoading(false);
      return () => { cancelled = true; };
    }

    setLoading(true);
    Promise.all(placedIds.map(async (id) => {
      try {
        const body = await loadResource("dialogues", id);
        return [id, body.data] as const;
      } catch (error) {
        return [id, { id, metadata: {}, __load_error: (error as Error).message }] as const;
      }
    })).then((entries) => {
      if (cancelled) return;
      const nextData: Record<string, ResourceRecord> = {};
      for (const [id, data] of entries) nextData[id] = data;
      setDialogueData(nextData);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [placedIds.join("|")]);

  function nodePosition(id: string, index: number) {
    const raw = positionMap[id];
    const fallback = autoChapterGraphPosition(index);
    return {
      x: clampNumber(Array.isArray(raw) ? raw[0] : undefined, 0, chapterGraphWidth - chapterGraphNodeWidth, fallback.x),
      y: clampNumber(Array.isArray(raw) ? raw[1] : undefined, 0, chapterGraphHeight - chapterGraphNodeHeight, fallback.y)
    };
  }

  function replaceChapterGraph(nextIds: string[], nextPositions: Record<string, [number, number]>) {
    const layout = draft.layout && typeof draft.layout === "object" && !Array.isArray(draft.layout) ? draft.layout as ResourceRecord : {};
    const startDialogue = getChapterStartDialogueId(draft);
    replaceDraft({
      ...draft,
      dialogues: nextIds,
      layout: {
        ...layout,
        positions: nextPositions
      },
      start_dialogue: nextIds.includes(startDialogue) ? startDialogue : (nextIds[0] || "")
    });
  }

  function setNodePosition(id: string, x: number, y: number) {
    replaceChapterGraph(placedIds, {
      ...positionMap,
      [id]: [
        Math.round(clampNumber(x, 0, chapterGraphWidth - chapterGraphNodeWidth, 0)),
        Math.round(clampNumber(y, 0, chapterGraphHeight - chapterGraphNodeHeight, 0))
      ]
    });
  }

  function autoArrangeMissingPositions() {
    const nextPositions: Record<string, [number, number]> = { ...positionMap };
    placedIds.forEach((id, index) => {
      if (Array.isArray(nextPositions[id])) return;
      const position = autoChapterGraphPosition(index);
      nextPositions[id] = [position.x, position.y];
    });
    replaceChapterGraph(placedIds, nextPositions);
  }

  function autoLayoutAllDialogues() {
    if (placedIds.length === 0) return;
    const incoming = new Map<string, number>();
    placedIds.forEach((id) => incoming.set(id, 0));
    placedIds.forEach((id) => {
      const next = getChapterGraphNext(dialogueData[id]);
      if (incoming.has(next)) incoming.set(next, (incoming.get(next) || 0) + 1);
    });

    const roots = placedIds.filter((id) => (incoming.get(id) || 0) === 0);
    const ordered: Array<{ id: string; depth: number }> = [];
    const seen = new Set<string>();
    const walk = (id: string, depth: number) => {
      if (!id || seen.has(id) || !placedIds.includes(id)) return;
      seen.add(id);
      ordered.push({ id, depth });
      const next = getChapterGraphNext(dialogueData[id]);
      if (next && placedIds.includes(next)) walk(next, depth + 1);
    };
    roots.forEach((id) => walk(id, 0));
    placedIds.forEach((id) => walk(id, 0));

    const rowsByDepth = new Map<number, number>();
    const nextPositions: Record<string, [number, number]> = { ...positionMap };
    ordered.forEach(({ id, depth }) => {
      const row = rowsByDepth.get(depth) || 0;
      rowsByDepth.set(depth, row + 1);
      nextPositions[id] = [120 + depth * chapterGraphGridX, 100 + row * chapterGraphGridY];
    });
    replaceChapterGraph(placedIds, nextPositions);
    window.setTimeout(() => fitGraphToView(), 0);
  }

  function fitGraphToView(focusId?: string) {
    const stage = stageRef.current;
    if (!stage) return;
    let bounds = focusId && placedIds.includes(focusId)
      ? getChapterGraphNodeBounds(nodePosition(focusId, placedIds.indexOf(focusId)))
      : getChapterGraphBounds(placedIds, (id, index) => nodePosition(id, index));
    if (!bounds) return;

    const width = Math.max(bounds.maxX - bounds.minX, chapterGraphNodeWidth);
    const height = Math.max(bounds.maxY - bounds.minY, chapterGraphNodeHeight);
    const availableWidth = Math.max(240, stage.clientWidth - chapterGraphFitMargin);
    const availableHeight = Math.max(180, stage.clientHeight - chapterGraphFitMargin);
    const widthZoom = availableWidth / width;
    const heightZoom = availableHeight / height;
    const nextZoom = roundForInput(clampNumber(Math.min(widthZoom, heightZoom, chapterGraphFitMaxZoom), 0.5, 1.8, 1));
    setGraphZoom(nextZoom);
    stage.scrollTo({
      left: Math.max(0, (bounds.minX + width * 0.5) * nextZoom - stage.clientWidth * 0.5),
      top: Math.max(0, (bounds.minY + height * 0.5) * nextZoom - stage.clientHeight * 0.5),
      behavior: "smooth"
    });
  }

  function focusDialogueOnGraph(id: string) {
    if (!id) return;
    if (!placedIds.includes(id)) {
      addDialogueToGraph(id);
      window.setTimeout(() => fitGraphToView(id), 0);
      return;
    }
    setSelectedNodeId(id);
    setSelectedEdgeFromId("");
    window.setTimeout(() => fitGraphToView(id), 0);
  }

  function addDialogueToGraph(id: string) {
    const nextId = id || unplacedDialogues[0]?.id || "";
    if (!nextId || placedIds.includes(nextId)) return;
    const nextIds = [...placedIds, nextId];
    const position = autoChapterGraphPosition(nextIds.length - 1);
    replaceChapterGraph(nextIds, {
      ...positionMap,
      [nextId]: [position.x, position.y]
    });
    setSelectedNodeId(nextId);
    setDialogueToPlaceId("");
  }

  function removePlacedDialogue(id: string) {
    const nextPositions = { ...positionMap };
    delete nextPositions[id];
    replaceChapterGraph(placedIds.filter((entry) => entry !== id), nextPositions);
    if (selectedNodeId === id) setSelectedNodeId("");
    if (selectedEdgeFromId === id) setSelectedEdgeFromId("");
    if (edgeSourceId === id) {
      setEdgeSourceId("");
      setConnectionPointer(null);
    }
  }

  function graphPointFromPointer(event: ReactPointerEvent<HTMLElement>) {
    const stage = stageRef.current;
    const rect = stage?.getBoundingClientRect();
    if (!stage || !rect || rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: clampNumber((event.clientX - rect.left + stage.scrollLeft) / graphZoom, 0, chapterGraphWidth, 0),
      y: clampNumber((event.clientY - rect.top + stage.scrollTop) / graphZoom, 0, chapterGraphHeight, 0)
    };
  }

  function startConnectionFromPort(event: ReactPointerEvent<HTMLElement>, id: string) {
    if (disabled || busy) return;
    event.stopPropagation();
    setEdgeSourceId(edgeSourceId === id ? "" : id);
    setSelectedNodeId(id);
    setSelectedEdgeFromId("");
    setConnectionPointer(graphPointFromPointer(event));
  }

  function connectToInputPort(event: ReactPointerEvent<HTMLElement>, id: string) {
    event.stopPropagation();
    if (edgeSourceId && edgeSourceId !== id) {
      connectToTarget(id);
      return;
    }
    setSelectedNodeId(id);
    setSelectedEdgeFromId("");
  }

  function startNodeDrag(event: ReactPointerEvent<HTMLElement>, id: string, index: number) {
    if (disabled || event.button !== 0 || event.target instanceof Element && event.target.closest("button, input, select")) return;
    const position = nodePosition(id, index);
    stageRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originalX: position.x,
      originalY: position.y,
      active: false
    };
    setSelectedNodeId(id);
    setSelectedEdgeFromId("");
    suppressStageClickRef.current = true;
    event.stopPropagation();
    event.preventDefault();
  }

  function moveNodeDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.active) {
      if (Math.hypot(deltaX, deltaY) < chapterGraphDragThreshold) return;
      drag.active = true;
    }
    setNodePosition(drag.id, drag.originalX + deltaX / graphZoom, drag.originalY + deltaY / graphZoom);
    event.preventDefault();
  }

  function updateConnectionPointer(event: React.PointerEvent<HTMLElement>) {
    if (!edgeSourceId) return;
    const point = graphPointFromPointer(event);
    if (point) setConnectionPointer(point);
  }

  function stopNodeDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const nodeId = drag.id;
    const wasClick = !drag.active;
    dragRef.current = null;
    if (wasClick && edgeSourceId && edgeSourceId !== nodeId) {
      connectToTarget(nodeId);
    }
  }

  function clearGraphSelectionFromStage(event: ReactMouseEvent<HTMLElement>) {
    if (suppressStageClickRef.current) {
      suppressStageClickRef.current = false;
      return;
    }
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest(".chapter-graph-node")) return;
    if (target.closest(".chapter-graph-edge-menu")) return;
    if (target.classList.contains("chapter-graph-edge")) return;
    setSelectedNodeId("");
    setSelectedEdgeFromId("");
  }

  async function saveDialogueGraphMetadata(sourceId: string, patch: ResourceRecord) {
    if (disabled || busy) return;
    setBusy(true);
    setStatus("");
    try {
      const current = dialogueData[sourceId] || (await loadResource("dialogues", sourceId)).data;
      const metadata = current.metadata && typeof current.metadata === "object" && !Array.isArray(current.metadata)
        ? { ...current.metadata }
        : {};
      const targetId = Object.prototype.hasOwnProperty.call(patch, "next_dialogue")
        ? String(patch.next_dialogue || "")
        : String(metadata.next_dialogue || "");

      if (Object.prototype.hasOwnProperty.call(patch, "next_dialogue")) {
        if (targetId) metadata.next_dialogue = targetId;
        else delete metadata.next_dialogue;
      }
      if (Object.prototype.hasOwnProperty.call(patch, "next_dialogue_blackout")) {
        if (targetId && patch.next_dialogue_blackout) metadata.next_dialogue_blackout = true;
        else delete metadata.next_dialogue_blackout;
      }
      if (Object.prototype.hasOwnProperty.call(patch, "next_dialogue_blackout_fade_duration")) {
        if (targetId) metadata.next_dialogue_blackout_fade_duration = normalizeBlackoutDuration(patch.next_dialogue_blackout_fade_duration, 0.35);
      }
      if (Object.prototype.hasOwnProperty.call(patch, "next_dialogue_blackout_hold_duration")) {
        if (targetId) metadata.next_dialogue_blackout_hold_duration = normalizeBlackoutDuration(patch.next_dialogue_blackout_hold_duration, 0.3);
      }
      if (!targetId || !metadata.next_dialogue_blackout) {
        delete metadata.next_dialogue_blackout;
        delete metadata.next_dialogue_blackout_fade_duration;
        delete metadata.next_dialogue_blackout_hold_duration;
      } else {
        metadata.next_dialogue_blackout_fade_duration = normalizeBlackoutDuration(metadata.next_dialogue_blackout_fade_duration, 0.35);
        metadata.next_dialogue_blackout_hold_duration = normalizeBlackoutDuration(metadata.next_dialogue_blackout_hold_duration, 0.3);
      }

      const nextData = { ...current, metadata };
      const saved = await saveResource("dialogues", sourceId, nextData);
      setDialogueData((data) => ({ ...data, [sourceId]: saved.data }));
      setStatus(targetId ? `${sourceId} -> ${targetId} 저장됨` : `${sourceId} 연결 해제됨`);
      notify("챕터 그래프 연결 저장 완료");
    } catch (error) {
      const message = `챕터 그래프 저장 실패: ${(error as Error).message}`;
      setStatus(message);
      notify(message);
    } finally {
      setBusy(false);
    }
  }

  function connectToTarget(targetId: string) {
    if (!edgeSourceId || edgeSourceId === targetId) return;
    void saveDialogueGraphMetadata(edgeSourceId, {
      next_dialogue: targetId,
      next_dialogue_blackout: false
    });
    setSelectedEdgeFromId(edgeSourceId);
    setEdgeSourceId("");
    setConnectionPointer(null);
  }

  function clearSelectedConnection() {
    if (selectedEdgeFromId) {
      void saveDialogueGraphMetadata(selectedEdgeFromId, { next_dialogue: "" });
      return;
    }
    if (selectedNodeId) {
      void saveDialogueGraphMetadata(selectedNodeId, { next_dialogue: "" });
    }
  }

  const selectedEdgeSourceIndex = selectedEdgeFromId ? placedIds.indexOf(selectedEdgeFromId) : -1;
  const selectedEdgeTargetIndex = selectedEdge ? placedIds.indexOf(selectedEdge) : -1;
  const selectedEdgeMenuPoint = selectedEdgeSourceIndex >= 0 && selectedEdgeTargetIndex >= 0
    ? chapterGraphEdgeMenuPoint(
      nodePosition(selectedEdgeFromId, selectedEdgeSourceIndex),
      nodePosition(selectedEdge, selectedEdgeTargetIndex)
    )
    : null;
  const selectedNodeData = selectedNodeId ? dialogueData[selectedNodeId] : undefined;
  const selectedNodeNext = getChapterGraphNext(selectedNodeData);
  const nextDialogueSelectOptions: ResourceSummary[] = placedIds
    .filter((id) => id !== selectedNodeId)
    .map((id) => ({
      id,
      type: "dialogues" as const,
      title: dialogueSummaryMap.get(id)?.title || id,
      subtitle: id
    }));

  return (
    <section className="chapter-graph-editor chapter-graph-workspace-root">
      <aside className="chapter-graph-dialogue-list" aria-label="대화 목록">
        <div className="chapter-graph-dialogue-list-header">
          <strong>대화 목록</strong>
          <code>{filteredDialogues.length}</code>
        </div>
        <input
          aria-label={ui.common.search}
          className="chapter-graph-dialogue-search"
          onChange={(event) => setDialogueSearch(event.target.value)}
          placeholder={`${ui.common.search} (id, 제목)`}
          type="search"
          value={dialogueSearch}
        />
        <div className="chapter-graph-dialogue-items" role="list">
          {filteredDialogues.length === 0 && <p className="empty-state">{ui.common.emptyList}</p>}
          {filteredDialogues.map((dialogue) => {
            const placed = placedIds.includes(dialogue.id);
            const isStart = dialogue.id === startDialogueId;
            return (
              <button
                className={`chapter-graph-dialogue-item ${selectedNodeId === dialogue.id ? "selected" : ""} ${placed ? "placed" : "unplaced"}`}
                key={dialogue.id}
                type="button"
                onClick={() => focusDialogueOnGraph(dialogue.id)}
              >
                <span>{dialogue.title || dialogue.id}</span>
                <code>{dialogue.id}{isStart ? " · start" : ""}{placed ? "" : " · 미배치"}</code>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="chapter-graph-main">
        <div className="structured-header">
          <span>Chapter Graph</span>
          <div className="chapter-art-actions">
            <button disabled={disabled || placedIds.length === 0} type="button" onClick={autoLayoutAllDialogues}><Icon name="AutoGraph" />자동 배치</button>
            <button disabled={disabled || placedIds.length === 0} type="button" onClick={() => fitGraphToView(selectedNodeId || undefined)}><Icon name="ZoomInMap" />전체 보기</button>
            <button disabled={disabled || (!selectedEdgeFromId && !selectedNodeId)} type="button" onClick={clearSelectedConnection}><Icon name="LinkOff" />연결 해제</button>
            <button disabled={disabled || !edgeSourceId} type="button" onClick={() => {
              setEdgeSourceId("");
              setConnectionPointer(null);
            }}><Icon name="Close" />연결 취소</button>
          </div>
        </div>
        <div className="chapter-graph-meta">
          <code>{placedIds.length} dialogues</code>
          {loading && <span>대화 메타데이터 불러오는 중</span>}
          {busy && <span>연결 저장 중</span>}
          {status && <span>{status}</span>}
          {edgeSourceId && <strong>{edgeSourceId} 연결 대상 선택</strong>}
        </div>
        <div className="chapter-graph-add-row">
          <select
            disabled={disabled || unplacedDialogues.length === 0}
            onChange={(event) => setDialogueToPlaceId(event.target.value)}
            value={dialogueToPlaceId}
          >
            <option value="">미배치 대화 선택</option>
            {unplacedDialogues.map((dialogue) => (
              <option key={dialogue.id} value={dialogue.id}>{dialogue.title} ({dialogue.id})</option>
            ))}
          </select>
          <button disabled={disabled || unplacedDialogues.length === 0} type="button" onClick={() => addDialogueToGraph(dialogueToPlaceId)}>
            <Icon name="Add" />캔버스에 추가
          </button>
        </div>
        <div className="chapter-graph-zoom-row">
          <button type="button" onClick={() => setGraphZoom((value) => roundForInput(clampNumber(value - 0.1, 0.5, 1.8, 1)))}><Icon name="ZoomOut" />축소</button>
          <input
            aria-label="Graph zoom"
            max={1.8}
            min={0.5}
            onChange={(event) => setGraphZoom(Number(event.target.value))}
            step={0.05}
            type="range"
            value={graphZoom}
          />
          <button type="button" onClick={() => setGraphZoom((value) => roundForInput(clampNumber(value + 0.1, 0.5, 1.8, 1)))}><Icon name="ZoomIn" />확대</button>
          <code>{Math.round(graphZoom * 100)}%</code>
        </div>
        <div
          className="chapter-graph-stage"
          onClick={clearGraphSelectionFromStage}
          onPointerLeave={() => setConnectionPointer(null)}
          onPointerMove={(event) => {
            moveNodeDrag(event);
            updateConnectionPointer(event);
          }}
          onPointerUp={stopNodeDrag}
          ref={stageRef}
        >
          <div className="chapter-graph-world" style={{ width: chapterGraphWidth * graphZoom, height: chapterGraphHeight * graphZoom }}>
            <div className="chapter-graph-world-content" style={{ transform: `scale(${graphZoom})` }}>
              <svg className="chapter-graph-connections" viewBox={`0 0 ${chapterGraphWidth} ${chapterGraphHeight}`} aria-hidden="true">
                {placedIds.map((sourceId, index) => {
                  const nextId = getChapterGraphNext(dialogueData[sourceId]);
                  const targetIndex = placedIds.indexOf(nextId);
                  if (!nextId || targetIndex < 0) return null;
                  const source = nodePosition(sourceId, index);
                  const target = nodePosition(nextId, targetIndex);
                  const selected = selectedEdgeFromId === sourceId;
                  return (
                    <path
                      className={`chapter-graph-edge ${selected ? "selected" : ""} ${getChapterGraphBlackout(dialogueData[sourceId]) ? "blackout" : ""}`}
                      d={chapterGraphEdgePath(source, target)}
                      key={`${sourceId}-${nextId}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedEdgeFromId(sourceId);
                        setSelectedNodeId("");
                      }}
                    />
                  );
                })}
                {edgeSourceId && connectionPointer && placedIds.includes(edgeSourceId) && (
                  <path
                    className="chapter-graph-edge preview"
                    d={chapterGraphPreviewEdgePath(nodePosition(edgeSourceId, placedIds.indexOf(edgeSourceId)), connectionPointer)}
                  />
                )}
              </svg>
              {placedIds.length === 0 && <p className="chapter-graph-empty">챕터에 배치된 대화가 없습니다. 목록에서 대화를 선택하거나 위에서 추가하세요.</p>}
              {placedIds.map((id, index) => {
                const position = nodePosition(id, index);
                const summary = dialogueSummaryMap.get(id);
                const data = dialogueData[id];
                const nextId = getChapterGraphNext(data);
                const isStart = id === startDialogueId;
                const isSource = id === edgeSourceId;
                const isTargetCandidate = Boolean(edgeSourceId && edgeSourceId !== id);
                return (
                  <article
                    className={`chapter-graph-node ${selectedNodeId === id ? "selected" : ""} ${isSource ? "edge-source" : ""} ${isTargetCandidate ? "target-candidate" : ""}`}
                    key={id}
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                    onPointerDown={(event) => startNodeDrag(event, id, index)}
                    style={{ left: position.x, top: position.y }}
                  >
                    <button
                      aria-label={`${id} input port`}
                      className="chapter-graph-port port-in"
                      disabled={disabled || busy}
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => connectToInputPort(event, id)}
                      type="button"
                    />
                    <button
                      aria-label={`${id} output port`}
                      className="chapter-graph-port port-out"
                      disabled={disabled || busy}
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => startConnectionFromPort(event, id)}
                      type="button"
                    />
                    <div className="chapter-graph-node-header">
                      <strong>{summary?.title || data?.label || id}</strong>
                      {isStart && <span>start</span>}
                    </div>
                    <code>{id}</code>
                    <p>{summary?.subtitle || getDialogueFirstTextPreview(data) || (loading ? "불러오는 중..." : "미리보기 없음")}</p>
                    <div className="chapter-graph-node-actions">
                      <button disabled={disabled || busy} type="button" onClick={(event) => {
                        event.stopPropagation();
                        setEdgeSourceId(isSource ? "" : id);
                        setSelectedNodeId(id);
                        setSelectedEdgeFromId("");
                      }}><Icon name="ForkRight" />연결</button>
                      <button disabled={disabled || busy || !nextId} type="button" onClick={(event) => {
                        event.stopPropagation();
                        setSelectedEdgeFromId(id);
                        setSelectedNodeId("");
                      }}><Icon name="Timeline" />edge</button>
                      <button className="danger-action" disabled={disabled} type="button" onClick={(event) => {
                        event.stopPropagation();
                        removePlacedDialogue(id);
                      }}><Icon name="Delete" />제거</button>
                    </div>
                  </article>
                );
              })}
            </div>
            {selectedEdgeMenuPoint && (
              <div
                className="chapter-graph-edge-menu"
                role="menu"
                style={{ left: selectedEdgeMenuPoint.x * graphZoom, top: selectedEdgeMenuPoint.y * graphZoom }}
              >
                <button aria-label="Edge details" type="button" onClick={() => setSelectedNodeId("")}><Icon name="Timeline" /></button>
                <button aria-label="Delete edge" className="danger-action" disabled={disabled || busy} type="button" onClick={() => void saveDialogueGraphMetadata(selectedEdgeFromId, { next_dialogue: "" })}><Icon name="Delete" /></button>
                <button aria-label="Close edge menu" type="button" onClick={() => setSelectedEdgeFromId("")}><Icon name="Close" /></button>
              </div>
            )}
          </div>
        </div>
      </div>

      <aside className="chapter-graph-inspector" aria-label="그래프 검사">
        {selectedEdgeFromId && selectedEdge ? (
          <div className="chapter-graph-edge-panel">
            <strong>{selectedEdgeFromId} {"->"} {selectedEdge}</strong>
            <ToggleField label="암전 후 다음 대화" checked={getChapterGraphBlackout(dialogueData[selectedEdgeFromId])} onChange={(checked) => void saveDialogueGraphMetadata(selectedEdgeFromId, { next_dialogue_blackout: checked })} />
            <NumberField label="Fade duration" value={getChapterGraphBlackoutFade(dialogueData[selectedEdgeFromId])} min={0} step={0.05} resetValue={0.35} onChange={(value) => void saveDialogueGraphMetadata(selectedEdgeFromId, { next_dialogue_blackout_fade_duration: value })} />
            <NumberField label="Hold duration" value={getChapterGraphBlackoutHold(dialogueData[selectedEdgeFromId])} min={0} step={0.05} resetValue={0.3} onChange={(value) => void saveDialogueGraphMetadata(selectedEdgeFromId, { next_dialogue_blackout_hold_duration: value })} />
            <button className="danger-action" disabled={disabled || busy} type="button" onClick={() => void saveDialogueGraphMetadata(selectedEdgeFromId, { next_dialogue: "" })}><Icon name="Delete" />연결 해제</button>
          </div>
        ) : selectedNodeId ? (
          <div className="chapter-graph-node-panel">
            <div className="chapter-graph-node-panel-header">
              <strong>{dialogueSummaryMap.get(selectedNodeId)?.title || selectedNodeId}</strong>
              <code>{selectedNodeId}</code>
            </div>
            <SelectField
              label="다음 대화"
              options={nextDialogueSelectOptions}
              value={selectedNodeNext}
              onChange={(value) => void saveDialogueGraphMetadata(selectedNodeId, { next_dialogue: value, next_dialogue_blackout: false })}
            />
            <ToggleField
              label="암전 후 다음 대화"
              checked={Boolean(selectedNodeNext && getChapterGraphBlackout(selectedNodeData))}
              onChange={(checked) => void saveDialogueGraphMetadata(selectedNodeId, { next_dialogue_blackout: checked })}
            />
            <NumberField
              label="Fade duration"
              value={getChapterGraphBlackoutFade(selectedNodeData)}
              min={0}
              step={0.05}
              resetValue={0.35}
              onChange={(value) => void saveDialogueGraphMetadata(selectedNodeId, { next_dialogue_blackout_fade_duration: value })}
            />
            <NumberField
              label="Hold duration"
              value={getChapterGraphBlackoutHold(selectedNodeData)}
              min={0}
              step={0.05}
              resetValue={0.3}
              onChange={(value) => void saveDialogueGraphMetadata(selectedNodeId, { next_dialogue_blackout_hold_duration: value })}
            />
            <div className="chapter-graph-node-panel-actions">
              <button disabled={disabled || startDialogueId === selectedNodeId} type="button" onClick={() => setStartDialogue(selectedNodeId)}>
                <Icon name="PlayArrow" />시작 대화로 지정
              </button>
              <button type="button" onClick={() => onOpenDialogue(selectedNodeId)}>
                <Icon name="OpenInNew" />대사 에디터에서 열기
              </button>
              <button className="danger-action" disabled={disabled || !selectedNodeNext} type="button" onClick={() => void saveDialogueGraphMetadata(selectedNodeId, { next_dialogue: "" })}>
                <Icon name="LinkOff" />연결 해제
              </button>
              <button className="danger-action" disabled={disabled} type="button" onClick={() => removePlacedDialogue(selectedNodeId)}>
                <Icon name="Delete" />캔버스에서 제거
              </button>
            </div>
            <div className="chapter-graph-node-preview">
              <span className="field-label">첫 대사</span>
              <pre>{getDialogueFirstTextPreview(selectedNodeData) || "미리보기 없음"}</pre>
            </div>
            <div className="incoming-list">
              <span className="field-label">들어오는 연결 {incomingIds.length}</span>
              {incomingIds.length === 0 ? (
                <span className="hint">없음</span>
              ) : incomingIds.map((id) => (
                <button key={id} type="button" onClick={() => {
                  setSelectedEdgeFromId(id);
                  setSelectedNodeId("");
                }}>
                  {dialogueSummaryMap.get(id)?.title || id}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="empty-state">캔버스의 대화 또는 연결선을 선택하세요.</p>
        )}
      </aside>
    </section>
  );
}

function ChapterArtEditor({
  disabled,
  draft,
  notify,
  replaceDraft,
  savedJsonText,
  updateField,
  uploadFile
}: {
  disabled: boolean;
  draft: ResourceRecord;
  notify: (message: string) => void;
  replaceDraft: (nextDraft: ResourceRecord) => void;
  savedJsonText: string;
  updateField: (field: string, value: unknown) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  const parallax = draft.parallax && typeof draft.parallax === "object" ? draft.parallax as ResourceRecord : { enabled: false, strength: 42, layers: [] };
  const layers = asArray<ResourceRecord>(parallax.layers);
  const overlay = getParallaxOverlayLayout(parallax);
  const titleLayout = getParallaxTitleLayout(parallax);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const [snapshot, setSnapshot] = useState<ChapterArtSnapshot | null>(() => createChapterArtSnapshot(draft));
  const [thumbnailBusy, setThumbnailBusy] = useState(false);
  const [artStatus, setArtStatus] = useState("");
  const safeSelectedLayerIndex = Math.min(Math.max(selectedLayerIndex, 0), Math.max(layers.length - 1, 0));
  const selectedLayer = layers[safeSelectedLayerIndex];
  const hasSnapshotChanges = snapshot
    ? JSON.stringify(getChapterArtSnapshotPayload(draft)) !== snapshot.serialized
    : false;

  useEffect(() => {
    setSnapshot(createChapterArtSnapshot(draft));
    setArtStatus("");
  }, [draft.id, savedJsonText]);

  function updateParallax(patch: ResourceRecord) {
    updateField("parallax", { ...parallax, ...patch });
  }

  function updateLayer(index: number, patch: ResourceRecord) {
    updateParallax({
      layers: layers.map((layer, layerIndex) => layerIndex === index ? { ...layer, ...patch } : layer)
    });
  }

  function updateOverlay(patch: ResourceRecord) {
    updateParallax({ overlay: { ...overlay, ...patch } });
  }

  function updateTitleLayout(patch: ResourceRecord) {
    updateParallax({ title: { ...titleLayout, ...patch } });
  }

  function selectLayer(index: number) {
    setSelectedLayerIndex(clampListIndex(index, layers.length));
  }

  function addLayer() {
    updateParallax({
      enabled: true,
      layers: [
        ...layers,
        {
          id: `sprite_${layers.length + 1}`,
          name: "새 레이어",
          kind: "sprite",
          path: "",
          position: [0.5, 0.5],
          anchor: [0.5, 0.5],
          order: layers.length,
          scale: 1,
          rotation: 0,
          depth: 0.3,
          perspective: 0,
          opacity: 1,
          floating: true,
          motion_strength: 1,
          visible: true
        }
      ]
    });
    setSelectedLayerIndex(layers.length);
  }

  function removeLayer(index: number) {
    updateParallax({ layers: layers.filter((_, layerIndex) => layerIndex !== index) });
    setSelectedLayerIndex(Math.max(0, Math.min(index - 1, layers.length - 2)));
  }

  function restoreSnapshot() {
    if (!snapshot) return;
    replaceDraft(applyChapterArtSnapshot(draft, snapshot.payload));
    setArtStatus("챕터 아트 설정을 스냅샷으로 복원했습니다.");
  }

  async function generateThumbnail() {
    if (disabled || thumbnailBusy) return;
    setThumbnailBusy(true);
    setArtStatus("");
    try {
      const result = await uploadChapterThumbnailForDraft(draft, async (relativePath, file) => ({
        resPath: await uploadFile(relativePath, file)
      }));
      if (result.skipped) {
        setArtStatus("썸네일로 저장할 패럴랙스 레이어가 없습니다.");
        return;
      }
      replaceDraft(result.draft);
      setArtStatus(`썸네일 생성: ${result.resPath}`);
      notify(`썸네일 생성 완료: ${result.resPath}`);
    } catch (error) {
      const message = `썸네일 생성 실패: ${(error as Error).message}`;
      setArtStatus(message);
      notify(message);
    } finally {
      setThumbnailBusy(false);
    }
  }

  function renderLayerInspector() {
    const layer = selectedLayer;
    const index = safeSelectedLayerIndex;
    if (!layer) {
      return (
        <aside className="chapter-layer-inspector empty" aria-label="Selected parallax layer options">
          <p className="empty-state">선택된 레이어가 없습니다.</p>
        </aside>
      );
    }

    const position = getParallaxLayerPosition(layer);
    const anchor = getParallaxLayerAnchor(layer);
    const scale = getParallaxLayerScale(layer);
    const layerLabel = String(layer.name || layer.id || `Layer ${index + 1}`);

    return (
      <aside className="chapter-layer-inspector" aria-label="Selected parallax layer options" data-parallax-layer-target={index}>
        <div className="chapter-layer-inspector-header">
          <span>{index + 1}</span>
          <div>
            <strong>{layerLabel}</strong>
            <code>{String(layer.kind || "sprite")} · {parallaxLayerTransformSummary(layer)}</code>
          </div>
        </div>
        <div className="chapter-layer-inspector-grid">
          <TextField label="ID" value={layer.id || ""} onChange={(value) => updateLayer(index, { id: safeSegment(value, `layer_${index + 1}`) })} />
          <TextField label="Name" value={layer.name || ""} onChange={(value) => updateLayer(index, { name: value })} />
          <SelectLiteralField label="Kind" value={getParallaxLayerEditorKind(layer)} options={["background", "sprite", "overlay", "title"]} onChange={(value) => updateLayer(index, { kind: value })} />
          <NumberField label="Order" value={layer.order ?? index} step={1} resetValue={index} onChange={(value) => updateLayer(index, { order: value })} />
          <div className="chapter-layer-inspector-wide">
            <TextField label="Path" value={getParallaxLayerPath(layer)} onChange={(value) => updateLayer(index, { path: value })} />
          </div>
          <UploadField
            disabled={disabled}
            label="Upload layer"
            accept="image/png,image/jpeg,image/webp"
            onUpload={async (file) => {
              const path = await uploadFile(`assets/chapters/${safeSegment(draft.id || "chapter")}/${safeSegment(layer.id || `layer_${index + 1}`)}.${fileExtension(file)}`, file);
              updateLayer(index, { path });
              return path;
            }}
          />
          <NumberField label="X" value={position[0] ?? 0.5} min={-0.5} max={1.5} step={0.01} resetValue={0.5} onChange={(value) => updateLayer(index, { position: [value, position[1] ?? 0.5] })} />
          <NumberField label="Y" value={position[1] ?? 0.5} min={-0.5} max={1.5} step={0.01} resetValue={0.5} onChange={(value) => updateLayer(index, { position: [position[0] ?? 0.5, value] })} />
          <NumberField label="Anchor X" value={anchor[0] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => updateLayer(index, { anchor: [value, anchor[1] ?? 0.5] })} />
          <NumberField label="Anchor Y" value={anchor[1] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => updateLayer(index, { anchor: [anchor[0] ?? 0.5, value] })} />
          <NumberField label="Scale" value={layer.scale ?? 1} min={0} step={0.05} resetValue={1} onChange={(value) => updateLayer(index, { scale: value, scale_x: value, scale_y: value })} />
          <NumberField label="Scale X" value={getParallaxLayerScaleX(layer)} min={0.05} max={3} step={0.01} resetValue={scale} onChange={(value) => updateLayer(index, { scale_x: value })} />
          <NumberField label="Scale Y" value={getParallaxLayerScaleY(layer)} min={0.05} max={3} step={0.01} resetValue={scale} onChange={(value) => updateLayer(index, { scale_y: value })} />
          <NumberField label="Rotation" value={layer.rotation ?? 0} step={1} resetValue={0} onChange={(value) => updateLayer(index, { rotation: value })} />
          <NumberField label="Depth" value={layer.depth ?? 0.3} step={0.05} resetValue={0.3} onChange={(value) => updateLayer(index, { depth: value })} />
          <NumberField label="Perspective" value={layer.perspective ?? 0} step={0.05} resetValue={0} onChange={(value) => updateLayer(index, { perspective: value })} />
          <NumberField label="Motion strength" value={getParallaxLayerMotionStrength(layer)} min={0} max={4} step={0.05} resetValue={1} onChange={(value) => updateLayer(index, { motion_strength: value })} />
          <NumberField label="Opacity" value={layer.opacity ?? 1} min={0} max={1} step={0.05} resetValue={1} onChange={(value) => updateLayer(index, { opacity: value })} />
          <ToggleField label="Visible" checked={layer.visible !== false} onChange={(checked) => updateLayer(index, { visible: checked })} />
          <ToggleField label="Floating" checked={layer.floating !== false} onChange={(checked) => updateLayer(index, { floating: checked })} />
          <ToggleField label="Thumbnail excluded" checked={Boolean(layer.thumbnail_excluded)} onChange={(checked) => updateLayer(index, { thumbnail_excluded: checked })} />
          <button className="danger-action" disabled={disabled} type="button" onClick={() => removeLayer(index)}><Icon name="Delete" />삭제</button>
        </div>
      </aside>
    );
  }

  return (
    <div className="wide structured-editor">
      <div className="structured-header">
        <span>Chapter Art / Parallax</span>
        <div className="chapter-art-actions">
          <button disabled={disabled || thumbnailBusy} type="button" onClick={() => void generateThumbnail()}><Icon name="AddPhotoAlternate" />썸네일</button>
          <button disabled={disabled || !hasSnapshotChanges} type="button" onClick={restoreSnapshot}><Icon name="Restore" />복원</button>
          <button disabled={disabled} type="button" onClick={addLayer}><Icon name="Add" />레이어</button>
        </div>
      </div>
      <div className="form-grid compact">
        <TextField label="Thumbnail" value={draft.image || ""} onChange={(value) => updateField("image", value)} />
        <UploadField
          disabled={disabled}
          label="Upload thumbnail"
          accept="image/png,image/jpeg,image/webp"
          onUpload={async (file) => {
            const path = await uploadFile(`assets/chapters/${safeSegment(draft.id || "chapter")}/thumbnail.${fileExtension(file)}`, file);
            updateField("image", path);
            return path;
          }}
        />
        <NumberField label="Parallax strength" value={parallax.strength ?? 42} min={0} step={1} resetValue={42} onChange={(value) => updateParallax({ strength: value })} />
        <ToggleField label="Parallax enabled" checked={Boolean(parallax.enabled)} onChange={(checked) => updateParallax({ enabled: checked })} />
      </div>
      <details className="chapter-layer-details" open={Boolean(overlay.enabled)}>
        <summary>
          <span>O</span>
          <strong>Overlay reference</strong>
          <code>{overlay.enabled ? "enabled" : "disabled"}</code>
        </summary>
        <div className="structured-row chapter-layer-row">
          <ToggleField label="Overlay enabled" checked={Boolean(overlay.enabled)} onChange={(checked) => updateOverlay({ enabled: checked })} />
          <TextField label="Overlay path" value={overlay.path} onChange={(value) => updateOverlay({ path: value })} />
          <UploadField
            disabled={disabled}
            label="Upload overlay"
            accept="image/png,image/jpeg,image/webp"
            onUpload={async (file) => {
              const path = await uploadFile(`assets/chapters/${safeSegment(draft.id || "chapter")}/overlay.${fileExtension(file)}`, file);
              updateOverlay({ enabled: true, path });
              return path;
            }}
          />
          <NumberField label="Overlay opacity" value={overlay.opacity} min={0} max={1} step={0.05} resetValue={0.55} onChange={(value) => updateOverlay({ opacity: value })} />
        </div>
      </details>
      <details className="chapter-layer-details" open={Boolean(titleLayout.enabled)}>
        <summary>
          <span>T</span>
          <strong>Title layer</strong>
          <code>{titleLayout.enabled ? "enabled" : "disabled"}</code>
        </summary>
        <div className="structured-row chapter-layer-row">
          <ToggleField label="Title enabled" checked={Boolean(titleLayout.enabled)} onChange={(checked) => updateTitleLayout({ enabled: checked })} />
          <TextField label="Title image" value={titleLayout.image || ""} onChange={(value) => updateTitleLayout({ image: value })} />
          <UploadField
            disabled={disabled}
            label="Upload title"
            accept="image/png,image/jpeg,image/webp"
            onUpload={async (file) => {
              const path = await uploadFile(`assets/chapters/${safeSegment(draft.id || "chapter")}/title.${fileExtension(file)}`, file);
              updateTitleLayout({ enabled: true, image: path });
              return path;
            }}
          />
          <NumberField label="Title X" value={asArray<number>(titleLayout.position)[0] ?? 0.08} min={-0.5} max={1.5} step={0.01} resetValue={0.08} onChange={(value) => updateTitleLayout({ position: [value, asArray<number>(titleLayout.position)[1] ?? 0.18] })} />
          <NumberField label="Title Y" value={asArray<number>(titleLayout.position)[1] ?? 0.18} min={-0.5} max={1.5} step={0.01} resetValue={0.18} onChange={(value) => updateTitleLayout({ position: [asArray<number>(titleLayout.position)[0] ?? 0.08, value] })} />
          <NumberField label="Title scale" value={titleLayout.scale ?? 1} min={0.2} max={2.4} step={0.05} resetValue={1} onChange={(value) => updateTitleLayout({ scale: value, scale_x: value, scale_y: value })} />
          <NumberField label="Title scale X" value={titleLayout.scale_x ?? titleLayout.scale ?? 1} min={0.2} max={2.4} step={0.01} resetValue={titleLayout.scale ?? 1} onChange={(value) => updateTitleLayout({ scale_x: value })} />
          <NumberField label="Title scale Y" value={titleLayout.scale_y ?? titleLayout.scale ?? 1} min={0.2} max={2.4} step={0.01} resetValue={titleLayout.scale ?? 1} onChange={(value) => updateTitleLayout({ scale_y: value })} />
          <NumberField label="Title opacity" value={titleLayout.opacity ?? 1} min={0} max={1} step={0.05} resetValue={1} onChange={(value) => updateTitleLayout({ opacity: value })} />
          <NumberField label="Title order" value={titleLayout.order ?? layers.length} step={1} resetValue={layers.length} onChange={(value) => updateTitleLayout({ order: value })} />
          <ToggleField label="Title floating" checked={titleLayout.floating !== false} onChange={(checked) => updateTitleLayout({ floating: checked })} />
          <NumberField label="Title depth" value={titleLayout.depth ?? 0.1} min={-2} max={2} step={0.05} resetValue={0.1} onChange={(value) => updateTitleLayout({ depth: value })} />
          <NumberField label="Title perspective" value={titleLayout.perspective ?? 0} min={-1} max={1} step={0.05} resetValue={0} onChange={(value) => updateTitleLayout({ perspective: value })} />
        </div>
      </details>
      {artStatus && <p className="art-status">{artStatus}</p>}
      {layers.length > 0 && (
        <div className="parallax-layer-mini-index" role="list" aria-label="parallax layer index">
          {layers.map((layer, index) => (
            <button
              className={index === safeSelectedLayerIndex ? "active" : ""}
              key={`${layer.id || "layer"}-${index}`}
              type="button"
              onClick={() => selectLayer(index)}
            >
              <span>{index + 1}. {String(layer.name || layer.id || `Layer ${index + 1}`)}</span>
              <code>{String(layer.kind || "sprite")}{layer.visible === false ? " · hidden" : ""}{layer.thumbnail_excluded ? " · no-thumb" : ""}</code>
            </button>
          ))}
        </div>
      )}
      <div className="chapter-art-workspace">
        <ParallaxVisualEditor
          draft={draft}
          layers={layers}
          parallax={parallax}
          selectedLayerIndex={safeSelectedLayerIndex}
          onSelectLayer={selectLayer}
          onChangeLayer={(index, patch) => updateLayer(index, patch)}
          onChangeTitleLayout={updateTitleLayout}
        />
        {renderLayerInspector()}
      </div>
    </div>
  );
}

function PortraitCenterEditor({
  label,
  imagePath,
  x,
  y,
  onChange
}: {
  label: string;
  imagePath: unknown;
  x: unknown;
  y: unknown;
  onChange: (x: number, y: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const imageOffsetRef = useRef<PointerPoint>({ x: 0, y: 0 });
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
  const [viewZoom, setViewZoom] = useState(portraitCenterZoomDefault);
  const [displayCenter, setDisplayCenter] = useState<PointerPoint>(() => ({
    x: clamp01Number(x, 0.5),
    y: clamp01Number(y, 0.5)
  }));
  const displayCenterRef = useRef(displayCenter);
  const imageUrl = resPathToAssetUrl(imagePath);
  const dragLock = useMobileDragLock();
  const safeCenter = {
    x: clamp01Number(x, 0.5),
    y: clamp01Number(y, 0.5)
  };

  function redraw(center = displayCenter) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawPortraitCenterCanvas(canvas, imageRef.current, imageOffsetRef.current, center, viewZoom);
  }

  function updateDisplayCenter(center: PointerPoint) {
    displayCenterRef.current = center;
    setDisplayCenter(center);
  }

  function setOffsetForCenter(center: PointerPoint) {
    const image = imageRef.current;
    imageOffsetRef.current = image ? portraitCenterOffsetFromCenter(image, center, viewZoom) : { x: 0, y: 0 };
  }

  useEffect(() => {
    const center = { x: safeCenter.x, y: safeCenter.y };
    if (!dragRef.current) {
      updateDisplayCenter(center);
      setOffsetForCenter(center);
    }
    redraw(center);
  }, [safeCenter.x, safeCenter.y, viewZoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    imageRef.current = null;
    setOffsetForCenter(safeCenter);
    redraw(safeCenter);

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => redraw());
      resizeObserver.observe(canvas);
    }

    if (imageUrl) {
      loadImageElement(imageUrl)
        .then((image) => {
          if (cancelled) return;
          imageRef.current = image;
          setOffsetForCenter(safeCenter);
          redraw(safeCenter);
        })
        .catch(() => {
          if (cancelled) return;
          imageRef.current = null;
          setOffsetForCenter(safeCenter);
          redraw(safeCenter);
        });
    }

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, [imageUrl]);

  function canvasPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (portraitCenterCanvasWidth / rect.width),
      y: (event.clientY - rect.top) * (portraitCenterCanvasHeight / rect.height)
    };
  }

  function commitCenter(center: PointerPoint) {
    onChange(roundCoordinate(center.x), roundCoordinate(center.y));
  }

  function updateZoom(nextZoom: number) {
    setViewZoom(clampPortraitCenterZoom(nextZoom));
  }

  function stopDrag(event?: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (event && drag.pointerId === event.pointerId) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture can already be released by the browser.
      }
    }
    commitCenter(displayCenterRef.current);
  }

  return (
    <div className="portrait-center-editor">
      <div className="coordinate-editor-header">
        <span>{label}</span>
        <div className="coordinate-editor-meta">
          <code>{displayCenter.x.toFixed(3)}, {displayCenter.y.toFixed(3)}</code>
          <DragLockToggle
            available={dragLock.available}
            locked={dragLock.locked}
            onToggle={dragLock.toggle}
          />
        </div>
      </div>
      <div className="portrait-center-frame">
        <canvas
          aria-label={`${label} preview`}
          className={dragLock.locked ? "drag-locked" : ""}
          height={portraitCenterCanvasHeight}
          onPointerCancel={(event) => stopDrag(event)}
          onPointerDown={(event) => {
            if (dragLock.locked || !imageRef.current) return;
            const point = canvasPoint(event);
            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = {
              pointerId: event.pointerId,
              startX: point.x,
              startY: point.y,
              offsetX: imageOffsetRef.current.x,
              offsetY: imageOffsetRef.current.y
            };
            event.preventDefault();
          }}
          onPointerMove={(event) => {
            if (dragLock.locked) return;
            const drag = dragRef.current;
            if (!drag || drag.pointerId !== event.pointerId) return;
            const point = canvasPoint(event);
            imageOffsetRef.current = {
              x: drag.offsetX + point.x - drag.startX,
              y: drag.offsetY + point.y - drag.startY
            };
            const nextCenter = portraitCenterFromOffset(imageRef.current, imageOffsetRef.current, viewZoom);
            updateDisplayCenter(nextCenter);
            drawPortraitCenterCanvas(event.currentTarget, imageRef.current, imageOffsetRef.current, nextCenter, viewZoom);
            event.preventDefault();
          }}
          onPointerUp={(event) => stopDrag(event)}
          ref={canvasRef}
          width={portraitCenterCanvasWidth}
        />
      </div>
      <div className="profile-crop-actions portrait-center-actions">
        <button type="button" onClick={() => updateZoom(viewZoom - portraitCenterZoomStep)}><Icon name="ZoomOut" />축소</button>
        <button type="button" onClick={() => updateZoom(portraitCenterZoomDefault)}><Icon name="SettingsBackupRestore" />줌 초기화</button>
        <button type="button" onClick={() => updateZoom(viewZoom + portraitCenterZoomStep)}><Icon name="ZoomIn" />확대</button>
      </div>
      <CoordinateNudgeToolbar
        label={label}
        onChange={onChange}
        resetX={0.5}
        resetY={0.5}
        x={displayCenter.x}
        y={displayCenter.y}
      />
    </div>
  );
}

function CoordinateNudgeToolbar({
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

function SpectrumOffsetEditor({
  draft,
  updateField
}: {
  draft: ResourceRecord;
  updateField: (field: string, value: unknown) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState("");
  const portrait = getDefaultSpectrumPortrait(draft.portraits);
  const imageUrl = resPathToAssetUrl(portrait?.path);
  const faceCenter = getPortraitCenterPoint(portrait?.center);
  const offset = getSpectrumOffset(draft.spectrum_offset);
  const nameColor = String(draft.name_color || "#ffffff");
  const dragLock = useMobileDragLock();

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    if (!imageUrl) {
      drawSpectrumOffsetCanvas(canvas, null, faceCenter, offset, nameColor);
      setStatus("default 초상 또는 경로가 있는 초상이 필요합니다.");
      return undefined;
    }

    setStatus("이미지 로딩 중");
    loadImageElement(imageUrl)
      .then((image) => {
        if (cancelled) return;
        drawSpectrumOffsetCanvas(canvas, image, faceCenter, offset, nameColor);
        setStatus("");
      })
      .catch(() => {
        if (cancelled) return;
        drawSpectrumOffsetCanvas(canvas, null, faceCenter, offset, nameColor);
        setStatus("이미지를 불러올 수 없습니다.");
      });

    return () => {
      cancelled = true;
    };
  }, [faceCenter.x, faceCenter.y, imageUrl, nameColor, offset.x, offset.y]);

  function updateOffset(nextX: number, nextY: number) {
    updateField("spectrum_offset", [round4Number(nextX), round4Number(nextY)]);
  }

  function updateFromPointer(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const canvasX = (event.clientX - rect.left) * (portraitEditorCanvasWidth / rect.width);
    const canvasY = (event.clientY - rect.top) * (portraitEditorCanvasHeight / rect.height);
    const face = getGameFacePosition();
    updateOffset(
      clampNumber((canvasX - face.x) / portraitEditorCanvasWidth, -1, 1, offset.x),
      clampNumber((canvasY - face.y) / portraitEditorCanvasHeight, -1, 1, offset.y)
    );
  }

  return (
    <div className="spectrum-offset-editor wide">
      <div className="coordinate-editor-header">
        <span>Spectrum offset</span>
        <div className="coordinate-editor-meta">
          <code>{offset.x.toFixed(4)}, {offset.y.toFixed(4)}</code>
          <DragLockToggle
            available={dragLock.available}
            locked={dragLock.locked}
            onToggle={dragLock.toggle}
          />
        </div>
      </div>
      <div className="drag-lock-surface">
        <canvas
          className={`spectrum-offset-canvas ${dragLock.locked ? "drag-locked" : ""}`}
          height={portraitEditorCanvasHeight}
          onPointerDown={(event) => {
            if (dragLock.locked) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            updateFromPointer(event);
          }}
          onPointerMove={(event) => {
            if (dragLock.locked) return;
            if (event.buttons !== 1) return;
            updateFromPointer(event);
          }}
          ref={canvasRef}
          width={portraitEditorCanvasWidth}
        />
        <DragLockHint available={dragLock.available} locked={dragLock.locked} onToggle={dragLock.toggle} />
      </div>
      <CoordinateNudgeToolbar
        label="Spectrum offset"
        max={1}
        min={-1}
        onChange={updateOffset}
        resetX={0}
        resetY={0}
        step={0.01}
        x={offset.x}
        y={offset.y}
      />
      <div className="form-grid compact">
        <NumberField label="Spectrum X" value={offset.x} min={-1} max={1} step={0.01} resetValue={0} onChange={(value) => updateOffset(value, offset.y)} />
        <NumberField label="Spectrum Y" value={offset.y} min={-1} max={1} step={0.01} resetValue={0} onChange={(value) => updateOffset(offset.x, value)} />
      </div>
      {status && <p className="media-preview-status">{status}</p>}
    </div>
  );
}

function ProfileCropEditor({
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

function ProfileCropFrame({
  compact,
  dragLocked = false,
  faceCenter,
  imagePath,
  profile,
  onChangeProfile
}: {
  compact?: boolean;
  dragLocked?: boolean;
  faceCenter: PointerPoint;
  imagePath: unknown;
  profile: ResourceRecord;
  onChangeProfile?: (nextProfile: ResourceRecord) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
  const imageUrl = resPathToAssetUrl(imagePath);
  const offset = getProfileOffset(profile);
  const zoom = getProfileZoom(profile.zoom);
  const frameStateRef = useRef({ faceCenter, offset, zoom });

  useEffect(() => {
    const canvas = canvasRef.current;
    frameStateRef.current = { faceCenter, offset, zoom };
    if (canvas) drawProfileCropCanvas(canvas, imageRef.current, faceCenter, { zoom, offset });
  }, [faceCenter.x, faceCenter.y, offset.x, offset.y, zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let cancelled = false;

    imageRef.current = null;
    drawProfileCropCanvas(canvas, null, frameStateRef.current.faceCenter, {
      zoom: frameStateRef.current.zoom,
      offset: frameStateRef.current.offset
    });

    if (!imageUrl) return () => {
      cancelled = true;
    };

    loadImageElement(imageUrl)
      .then((image) => {
        if (cancelled) return;
        imageRef.current = image;
        drawProfileCropCanvas(canvas, image, frameStateRef.current.faceCenter, {
          zoom: frameStateRef.current.zoom,
          offset: frameStateRef.current.offset
        });
      })
      .catch(() => {
        if (cancelled) return;
        imageRef.current = null;
        drawProfileCropCanvas(canvas, null, frameStateRef.current.faceCenter, {
          zoom: frameStateRef.current.zoom,
          offset: frameStateRef.current.offset
        });
      });

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return undefined;
    const redraw = () => drawProfileCropCanvas(canvas, imageRef.current, frameStateRef.current.faceCenter, {
      zoom: frameStateRef.current.zoom,
      offset: frameStateRef.current.offset
    });
    const resizeObserver = new ResizeObserver(redraw);
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, []);

  function canvasPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (profileCropCanvasSize / rect.width),
      y: (event.clientY - rect.top) * (profileCropCanvasSize / rect.height)
    };
  }

  function updateOffset(nextOffset: PointerPoint) {
    if (!onChangeProfile) return;
    const nextProfile = withProfileOffset(profile, nextOffset);
    const canvas = canvasRef.current;
    if (canvas) {
      drawProfileCropCanvas(canvas, imageRef.current, faceCenter, {
        zoom: getProfileZoom(nextProfile.zoom),
        offset: getProfileOffset(nextProfile)
      });
    }
    onChangeProfile(nextProfile);
  }

  function stopDrag() {
    dragRef.current = null;
  }

  return (
    <div className={`profile-crop-frame ${compact ? "compact" : ""}`}>
      <canvas
        aria-label="Profile crop preview"
        className={`${onChangeProfile ? "editable" : ""} ${dragLocked ? "drag-locked" : ""}`}
        height={profileCropCanvasSize}
        onPointerCancel={stopDrag}
        onPointerDown={(event) => {
          if (dragLocked || !onChangeProfile || !imageRef.current) return;
          const point = canvasPoint(event);
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = {
            pointerId: event.pointerId,
            startX: point.x,
            startY: point.y,
            offsetX: offset.x,
            offsetY: offset.y
          };
          event.preventDefault();
        }}
        onPointerMove={(event) => {
          if (dragLocked) return;
          const drag = dragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;
          const point = canvasPoint(event);
          updateOffset({
            x: round4Number(drag.offsetX + (point.x - drag.startX) / profileCropCanvasSize),
            y: round4Number(drag.offsetY + (point.y - drag.startY) / profileCropCanvasSize)
          });
          event.preventDefault();
        }}
        onPointerUp={(event) => {
          if (dragRef.current?.pointerId === event.pointerId) {
            try {
              event.currentTarget.releasePointerCapture(event.pointerId);
            } catch {
              // Pointer capture can already be released by the browser.
            }
          }
          stopDrag();
        }}
        ref={canvasRef}
        width={profileCropCanvasSize}
      />
    </div>
  );
}

function useMobileDragLock() {
  const manuallyChangedRef = useRef(false);
  const [available, setAvailable] = useState(false);
  const [rawLocked, setRawLocked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const query = window.matchMedia("(pointer: coarse), (max-width: 860px)");
    const sync = () => {
      setAvailable(query.matches);
      setRawLocked((current) => manuallyChangedRef.current ? current : query.matches);
    };
    sync();
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", sync);
      return () => query.removeEventListener("change", sync);
    }
    query.addListener(sync);
    return () => query.removeListener(sync);
  }, []);

  return {
    available,
    locked: available && rawLocked,
    toggle: () => {
      manuallyChangedRef.current = true;
      setRawLocked((current) => !current);
    }
  };
}

function DragLockToggle({
  available,
  locked,
  onToggle
}: {
  available: boolean;
  locked: boolean;
  onToggle: () => void;
}) {
  if (!available) return null;
  return (
    <button
      aria-label={locked ? "드래그 이동 잠금 켜짐" : "드래그 이동 잠금 꺼짐"}
      aria-pressed={locked}
      className={`drag-lock-toggle ${locked ? "locked" : "unlocked"}`}
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <Icon name={locked ? "Lock" : "LockOpen"} />
      <span>이동 잠금</span>
    </button>
  );
}

function DragLockHint({
  available,
  locked,
  onToggle
}: {
  available: boolean;
  locked: boolean;
  onToggle: () => void;
}) {
  if (!available || !locked) return null;
  return (
    <button
      aria-label="드래그 이동 잠금 켜짐"
      aria-pressed={true}
      className="drag-lock-hint"
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <Icon name="Lock" />
      이동 잠금
    </button>
  );
}

function ParallaxVisualEditor({
  draft,
  layers,
  parallax,
  selectedLayerIndex,
  onSelectLayer,
  onChangeLayer,
  onChangeTitleLayout
}: {
  draft: ResourceRecord;
  layers: ResourceRecord[];
  parallax: ResourceRecord;
  selectedLayerIndex: number;
  onSelectLayer: (index: number) => void;
  onChangeLayer: (index: number, patch: ResourceRecord) => void;
  onChangeTitleLayout: (patch: ResourceRecord) => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<ParallaxVisualDrag | null>(null);
  const [selectedVisualTarget, setSelectedVisualTarget] = useState<"layer" | "title">("layer");
  const [axisLock, setAxisLock] = useState<"free" | "x" | "y">("free");
  const [layerAspectRatios, setLayerAspectRatios] = useState<Record<string, number>>({});
  const [previewOffset, setPreviewOffset] = useState<PointerPoint>({ x: 0, y: 0 });
  const dragLock = useMobileDragLock();
  const entries = getParallaxVisualEntries(layers, parallax);
  const hasImage = entries.some((entry) => entry.type === "layer" && resPathToAssetUrl(getParallaxLayerPath(entry.layer)));
  const overlay = getParallaxOverlayLayout(parallax);
  const overlayUrl = overlay.enabled ? resPathToAssetUrl(overlay.path) : "";
  const stageScale = clampNumber((stageRef.current?.clientWidth || chapterThumbnailWidth) / chapterThumbnailWidth, 0.05, 4, 1);

  function startPositionDrag(event: ReactPointerEvent<HTMLElement>, index: number) {
    if (event.button !== 0) return;
    if (dragLock.locked) {
      onSelectLayer(index);
      setSelectedVisualTarget("layer");
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const layer = layers[index];
    if (!layer) return;
    const position = getParallaxLayerPosition(layer);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode: "position",
      index,
      startX: event.clientX,
      startY: event.clientY,
      originalX: position[0],
      originalY: position[1]
    };
    onSelectLayer(index);
    setSelectedVisualTarget("layer");
    event.preventDefault();
    event.stopPropagation();
  }

  function startAnchorDrag(event: ReactPointerEvent<HTMLElement>, index: number) {
    if (event.button !== 0) return;
    if (dragLock.locked) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const stageRect = stageRef.current?.getBoundingClientRect();
    if (!stageRect || stageRect.width === 0 || stageRect.height === 0) return;
    const layer = layers[index];
    const position = getParallaxLayerPosition(layer);
    const anchor = getParallaxLayerAnchor(layer);
    const aspectRatio = layerAspectRatios[parallaxVisualLayerKey(layer, index)];
    const size = getParallaxLayerVisualSize(layer, aspectRatio);
    const anchorX = clamp01Number(anchor[0], 0.5);
    const anchorY = clamp01Number(anchor[1], 0.5);
    const rotation = getParallaxLayerKind(layer) === "background" ? 0 : normalizeRotationDegrees(layer?.rotation);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode: "anchor",
      index,
      stageRect,
      centerX: stageRect.left + stageRect.width * position[0],
      centerY: stageRect.top + stageRect.height * position[1],
      width: Math.max(1, size.width * stageRect.width),
      height: Math.max(1, size.height * stageRect.height),
      anchorX,
      anchorY,
      rotation
    };
    onSelectLayer(index);
    setSelectedVisualTarget("layer");
    updateAnchorFromPointer(event, dragRef.current);
    event.preventDefault();
    event.stopPropagation();
  }

  function updateAnchorFromPointer(event: ReactPointerEvent<HTMLElement>, drag: Extract<ParallaxVisualDrag, { mode: "anchor" }>) {
    if (drag.stageRect.width === 0 || drag.stageRect.height === 0 || drag.width === 0 || drag.height === 0) return;
    const inversePoint = rotateParallaxPoint({
      x: event.clientX - drag.centerX,
      y: event.clientY - drag.centerY
    }, -drag.rotation);
    const originalAnchorX = drag.anchorX * drag.width;
    const originalAnchorY = drag.anchorY * drag.height;
    const localX = clampNumber(originalAnchorX + inversePoint.x, 0, drag.width, originalAnchorX);
    const localY = clampNumber(originalAnchorY + inversePoint.y, 0, drag.height, originalAnchorY);
    const anchor = {
      x: localX / drag.width,
      y: localY / drag.height
    };
    const rotatedAnchorDelta = rotateParallaxPoint({
      x: localX - originalAnchorX,
      y: localY - originalAnchorY
    }, drag.rotation);
    const nextCenterX = drag.centerX + rotatedAnchorDelta.x;
    const nextCenterY = drag.centerY + rotatedAnchorDelta.y;
    onChangeLayer(drag.index, {
      anchor: [
        round4Number(anchor.x),
        round4Number(anchor.y)
      ],
      position: [
        roundParallaxCoordinate((nextCenterX - drag.stageRect.left) / drag.stageRect.width),
        roundParallaxCoordinate((nextCenterY - drag.stageRect.top) / drag.stageRect.height)
      ]
    });
  }

  function startScaleDrag(event: ReactPointerEvent<HTMLElement>, index: number) {
    if (event.button !== 0) return;
    if (dragLock.locked) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const stageRect = stageRef.current?.getBoundingClientRect();
    if (!stageRect) return;
    const layer = layers[index];
    const position = getParallaxLayerPosition(layer);
    const pivot = {
      x: stageRect.left + stageRect.width * position[0],
      y: stageRect.top + stageRect.height * position[1]
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode: "scale",
      index,
      pivot,
      startDistance: Math.max(1, pointerDistance(pivot, event)),
      originalScale: getParallaxLayerScale(layer),
      originalScaleX: getParallaxLayerScaleX(layer),
      originalScaleY: getParallaxLayerScaleY(layer)
    };
    onSelectLayer(index);
    setSelectedVisualTarget("layer");
    event.preventDefault();
    event.stopPropagation();
  }

  function startRotationDrag(event: ReactPointerEvent<HTMLElement>, index: number) {
    if (event.button !== 0) return;
    if (dragLock.locked) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const stageRect = stageRef.current?.getBoundingClientRect();
    if (!stageRect) return;
    const layer = layers[index];
    const position = getParallaxLayerPosition(layer);
    const pivot = {
      x: stageRect.left + stageRect.width * position[0],
      y: stageRect.top + stageRect.height * position[1]
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode: "rotation",
      index,
      pivot,
      startAngle: pointerAngle(pivot, event),
      originalRotation: normalizeRotationDegrees(layer?.rotation)
    };
    onSelectLayer(index);
    setSelectedVisualTarget("layer");
    event.preventDefault();
    event.stopPropagation();
  }

  function startTitlePositionDrag(event: ReactPointerEvent<HTMLElement>, title: ResourceRecord) {
    if (event.button !== 0) return;
    if (dragLock.locked) {
      setSelectedVisualTarget("title");
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (selectedVisualTarget !== "title") {
      setSelectedVisualTarget("title");
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const position = asArray<number>(title.position);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode: "title-position",
      startX: event.clientX,
      startY: event.clientY,
      originalX: clampNumber(position[0], -0.5, 1.5, 0.08),
      originalY: clampNumber(position[1], -0.5, 1.5, 0.18)
    };
    event.preventDefault();
    event.stopPropagation();
  }

  function startTitleScaleDrag(event: ReactPointerEvent<HTMLElement>, title: ResourceRecord) {
    if (event.button !== 0) return;
    if (dragLock.locked) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const stageRect = stageRef.current?.getBoundingClientRect();
    if (!stageRect) return;
    const position = asArray<number>(title.position);
    const pivot = {
      x: stageRect.left + stageRect.width * clampNumber(position[0], -0.5, 1.5, 0.08),
      y: stageRect.top + stageRect.height * clampNumber(position[1], -0.5, 1.5, 0.18)
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedVisualTarget("title");
    dragRef.current = {
      mode: "title-scale",
      pivot,
      startDistance: Math.max(1, pointerDistance(pivot, event)),
      originalScale: clampNumber(title.scale, 0.2, 2.4, 1),
      originalScaleX: clampNumber(title.scale_x, 0.2, 2.4, 1),
      originalScaleY: clampNumber(title.scale_y, 0.2, 2.4, 1)
    };
    event.preventDefault();
    event.stopPropagation();
  }

  function handleStageWheel(event: ReactWheelEvent<HTMLElement>) {
    if (!event.ctrlKey) return;
    const scaleDelta = getParallaxWheelScaleDelta(event.deltaY);
    if (scaleDelta === 0) return;
    if (selectedVisualTarget === "title") {
      const title = getParallaxTitleLayout(parallax);
      const nextScale = roundForInput(clampNumber(clampNumber(title.scale, 0.2, 2.4, 1) + scaleDelta, 0.2, 2.4));
      onChangeTitleLayout({ scale: nextScale, scale_x: nextScale, scale_y: nextScale });
    } else {
      const layer = layers[selectedLayerIndex];
      if (!layer) return;
      const nextScale = roundForInput(clampNumber(getParallaxLayerScale(layer) + scaleDelta, 0.05, 3));
      onChangeLayer(selectedLayerIndex, { scale: nextScale, scale_x: nextScale, scale_y: nextScale });
    }
    event.preventDefault();
    event.stopPropagation();
  }

  function startPreviewOffsetDrag(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 2) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode: "preview-offset",
      startX: event.clientX,
      startY: event.clientY,
      originalX: previewOffset.x,
      originalY: previewOffset.y
    };
    event.preventDefault();
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (dragLock.locked) return;
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.mode === "position") {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;
      const nextX = roundParallaxCoordinate(drag.originalX + (event.clientX - drag.startX) / rect.width);
      const nextY = roundParallaxCoordinate(drag.originalY + (event.clientY - drag.startY) / rect.height);
      onChangeLayer(drag.index, {
        position: [
          axisLock === "y" ? drag.originalX : nextX,
          axisLock === "x" ? drag.originalY : nextY
        ]
      });
    } else if (drag.mode === "anchor") {
      updateAnchorFromPointer(event, drag);
    } else if (drag.mode === "scale") {
      const nextDistance = Math.max(1, pointerDistance(drag.pivot, event));
      const ratio = nextDistance / drag.startDistance;
      onChangeLayer(drag.index, {
        scale: roundForInput(clampNumber(drag.originalScale * ratio, 0.05, 3)),
        scale_x: roundForInput(clampNumber(drag.originalScaleX * ratio, 0.05, 3)),
        scale_y: roundForInput(clampNumber(drag.originalScaleY * ratio, 0.05, 3))
      });
    } else if (drag.mode === "rotation") {
      const nextAngle = pointerAngle(drag.pivot, event);
      const nextRotation = normalizeRotationDegrees(drag.originalRotation + nextAngle - drag.startAngle);
      onChangeLayer(drag.index, { rotation: event.shiftKey ? Math.round(nextRotation / 15) * 15 : roundForInput(nextRotation) });
    } else if (drag.mode === "title-position") {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;
      const nextX = roundParallaxCoordinate(drag.originalX + (event.clientX - drag.startX) / rect.width);
      const nextY = roundParallaxCoordinate(drag.originalY + (event.clientY - drag.startY) / rect.height);
      onChangeTitleLayout({
        position: [
          axisLock === "y" ? drag.originalX : nextX,
          axisLock === "x" ? drag.originalY : nextY
        ]
      });
    } else if (drag.mode === "title-scale") {
      const nextDistance = Math.max(1, pointerDistance(drag.pivot, event));
      const ratio = nextDistance / drag.startDistance;
      const nextScaleX = roundForInput(clampNumber(drag.originalScaleX * ratio, 0.2, 2.4));
      const nextScaleY = roundForInput(clampNumber(drag.originalScaleY * ratio, 0.2, 2.4));
      onChangeTitleLayout({
        scale: roundForInput(clampNumber(drag.originalScale * ratio, 0.2, 2.4)),
        scale_x: nextScaleX,
        scale_y: nextScaleY
      });
    } else if (drag.mode === "preview-offset") {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;
      setPreviewOffset({
        x: clampNumber(drag.originalX + ((event.clientX - drag.startX) / rect.width) * 2.2, -1, 1, 0),
        y: clampNumber(drag.originalY + ((event.clientY - drag.startY) / rect.height) * 2.2, -1, 1, 0)
      });
    }
    event.preventDefault();
  }

  function stopDrag() {
    if (dragRef.current?.mode === "preview-offset") {
      setPreviewOffset({ x: 0, y: 0 });
    }
    dragRef.current = null;
  }

  function rememberLayerAspectRatio(layer: ResourceRecord, index: number, event: SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    const width = image.naturalWidth || image.width || 1;
    const height = image.naturalHeight || image.height || 1;
    if (width <= 0 || height <= 0) return;
    const key = parallaxVisualLayerKey(layer, index);
    const nextRatio = roundForInput(width / height);
    if (layerAspectRatios[key] === nextRatio) return;
    setLayerAspectRatios((current) => ({ ...current, [key]: nextRatio }));
  }

  return (
    <section className="parallax-visual-editor">
      <div className="coordinate-editor-header">
        <span>Layer position</span>
        <div className="coordinate-editor-meta">
          <code>{layers.length} layers</code>
          <DragLockToggle
            available={dragLock.available}
            locked={dragLock.locked}
            onToggle={dragLock.toggle}
          />
        </div>
      </div>
      <div
        className={`parallax-stage ${hasImage ? "has-image" : ""} ${dragLock.locked ? "drag-locked" : ""}`}
        onPointerCancel={stopDrag}
        onPointerDown={startPreviewOffsetDrag}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onContextMenu={(event) => event.preventDefault()}
        onWheel={handleStageWheel}
        ref={stageRef}
      >
        <DragLockHint available={dragLock.available} locked={dragLock.locked} onToggle={dragLock.toggle} />
        {entries.length === 0 && <span className="parallax-stage-empty">레이어 없음</span>}
        {entries.map((entry, visualIndex) => {
          if (entry.type === "title") {
            const titleStyle = getParallaxTitlePreviewStyle(entry.title, visualIndex, previewOffset, parallax.strength, stageScale);
            const titleImageUrl = resPathToAssetUrl(entry.title.image);
            const chapterOrder = normalizeNumber(draft.order, 1, 1);
            const chapterTitle = String(draft.title || draft.id || "제목 없음").trim() || "제목 없음";
            const description = String(draft.description || "").trim() || "챕터 설명이 아직 없습니다.";
            const isTitleSelected = selectedVisualTarget === "title";
            return (
              <div
                className={`parallax-title-preview ${isTitleSelected ? "selected" : ""}`}
                key="parallax-title-preview"
                onPointerDown={(event) => startTitlePositionDrag(event, entry.title)}
                style={titleStyle}
              >
                {titleImageUrl ? (
                  <img alt={chapterTitle} src={titleImageUrl} />
                ) : (
                  <>
                    <div className="eyebrow"><span>챕터 {Math.max(1, chapterOrder)}</span></div>
                    <strong>{chapterTitle}</strong>
                    <div className="divider" />
                    <p>{description}</p>
                  </>
                )}
                {isTitleSelected && (
                  <button
                    aria-label="Title scale"
                    className="parallax-title-scale-handle"
                    onPointerDown={(event) => startTitleScaleDrag(event, entry.title)}
                    type="button"
                  />
                )}
              </div>
            );
          }

          const layer = entry.layer;
          const index = entry.index;
          const imageUrl = resPathToAssetUrl(getParallaxLayerPath(layer));
          const isSelected = index === selectedLayerIndex;
          const anchor = getParallaxLayerAnchor(layer);
          const anchorX = anchor[0];
          const anchorY = anchor[1];
          const kind = getParallaxLayerKind(layer);
          const previewStyle = getParallaxLayerPreviewStyle(
            layer,
            index,
            layerAspectRatios[parallaxVisualLayerKey(layer, index)],
            visualIndex,
            previewOffset,
            parallax.strength,
            stageScale
          );
          return (
            imageUrl ? (
              <div
                className={`parallax-layer-preview ${isSelected ? "selected" : ""}`}
                key={`${layer.id || "layer"}-${index}`}
                onPointerDown={(event) => startPositionDrag(event, index)}
                style={previewStyle}
              >
                <img alt="" onLoad={(event) => rememberLayerAspectRatio(layer, index, event)} src={imageUrl} />
                <button
                  aria-label={`Layer ${index + 1} position`}
                  className="parallax-marker layer-index"
                  onPointerDown={(event) => startPositionDrag(event, index)}
                  type="button"
                >
                  <span>{index + 1}</span>
                </button>
                {isSelected && (
                  <>
                    <button
                      aria-label={`Layer ${index + 1} anchor`}
                      className="parallax-anchor-handle"
                      onPointerDown={(event) => startAnchorDrag(event, index)}
                      style={{ left: `${anchorX * 100}%`, top: `${anchorY * 100}%` }}
                      type="button"
                    />
                    <button
                      aria-label={`Layer ${index + 1} scale`}
                      className="parallax-scale-handle"
                      onPointerDown={(event) => startScaleDrag(event, index)}
                      type="button"
                    />
                    {kind !== "background" && (
                      <button
                        aria-label={`Layer ${index + 1} rotation`}
                        className="parallax-rotation-handle"
                        onPointerDown={(event) => startRotationDrag(event, index)}
                        type="button"
                      />
                    )}
                  </>
                )}
              </div>
            ) : (
              <button
                aria-label={`Layer ${index + 1} position`}
                className={`parallax-marker ${isSelected ? "selected" : ""}`}
                key={`${layer.id || "layer"}-${index}`}
                onPointerDown={(event) => startPositionDrag(event, index)}
                style={getParallaxMarkerStyle(layer, index, visualIndex)}
                type="button"
              >
                <span>{index + 1}</span>
              </button>
            )
          );
        })}
        {overlay.enabled && overlayUrl && (
          <div
            className="parallax-overlay-preview"
            style={{ backgroundImage: `url("${overlayUrl}")`, opacity: clampNumber(overlay.opacity, 0, 1, 1) }}
          />
        )}
      </div>
      {layers.length > 0 && (
        <div className="parallax-selected-summary">
          <strong>{String(layers[selectedLayerIndex]?.name || layers[selectedLayerIndex]?.id || `Layer ${selectedLayerIndex + 1}`)}</strong>
          <span>{String(layers[selectedLayerIndex]?.kind || "sprite")}</span>
          <code>{parallaxLayerTransformSummary(layers[selectedLayerIndex])}</code>
        </div>
      )}
      <ParallaxNudgeToolbar
        axisLock={axisLock}
        layers={layers}
        onChangeLayer={onChangeLayer}
        onChangeTitleLayout={onChangeTitleLayout}
        onSetAxisLock={setAxisLock}
        selectedLayerIndex={selectedLayerIndex}
        selectedVisualTarget={selectedVisualTarget}
        title={getParallaxTitleLayout(parallax)}
      />
    </section>
  );
}

function ParallaxNudgeToolbar({
  axisLock,
  layers,
  selectedLayerIndex,
  selectedVisualTarget,
  title,
  onSetAxisLock,
  onChangeLayer,
  onChangeTitleLayout
}: {
  axisLock: "free" | "x" | "y";
  layers: ResourceRecord[];
  selectedLayerIndex: number;
  selectedVisualTarget: "layer" | "title";
  title: ResourceRecord;
  onSetAxisLock: (next: "free" | "x" | "y") => void;
  onChangeLayer: (index: number, patch: ResourceRecord) => void;
  onChangeTitleLayout: (patch: ResourceRecord) => void;
}) {
  const layer = layers[selectedLayerIndex];
  const isTitle = selectedVisualTarget === "title";
  if (!isTitle && !layer) return null;

  const targetLabel = isTitle ? "Title" : String(layer.name || layer.id || `Layer ${selectedLayerIndex + 1}`);
  const position = isTitle ? asArray<number>(title.position) : getParallaxLayerPosition(layer);
  const x = isTitle ? clampNumber(position[0], -0.5, 1.5, 0.08) : position[0];
  const y = isTitle ? clampNumber(position[1], -0.5, 1.5, 0.18) : position[1];
  const rotation = isTitle ? 0 : normalizeRotationDegrees(layer.rotation);
  const scale = isTitle ? clampNumber(title.scale, 0.2, 2.4, 1) : getParallaxLayerScale(layer);
  const resetLayout = isTitle ? { x: 0.08, y: 0.18, scale: 1 } : getParallaxLayerDefaultLayout(getParallaxLayerKind(layer));
  const canRotate = !isTitle && getParallaxLayerKind(layer) !== "background";

  function updatePosition(nextX: number, nextY: number) {
    const nextPosition = [roundParallaxCoordinate(nextX), roundParallaxCoordinate(nextY)];
    if (isTitle) onChangeTitleLayout({ position: nextPosition });
    else onChangeLayer(selectedLayerIndex, { position: nextPosition });
  }

  function updateScale(nextValue: number) {
    if (isTitle) {
      const nextScale = roundForInput(clampNumber(nextValue, 0.2, 2.4, 1));
      onChangeTitleLayout({ scale: nextScale, scale_x: nextScale, scale_y: nextScale });
      return;
    }
    const nextScale = roundForInput(clampNumber(nextValue, 0.05, 4, 1));
    onChangeLayer(selectedLayerIndex, { scale: nextScale, scale_x: nextScale, scale_y: nextScale });
  }

  return (
    <div className="transform-nudge-panel">
      <div className="nudge-panel-header">
        <strong>{targetLabel}</strong>
        <code>{isTitle ? "title" : "layer"} · {axisLock === "free" ? "free" : `${axisLock.toUpperCase()} axis`}</code>
      </div>
      <div className="nudge-toolbar">
        <button aria-label="Move left" type="button" onClick={() => updatePosition(x - 0.01, y)}><Icon name="West" /></button>
        <button aria-label="Move up" type="button" onClick={() => updatePosition(x, y - 0.01)}><Icon name="North" /></button>
        <button aria-label="Move down" type="button" onClick={() => updatePosition(x, y + 0.01)}><Icon name="South" /></button>
        <button aria-label="Move right" type="button" onClick={() => updatePosition(x + 0.01, y)}><Icon name="East" /></button>
        <button aria-label="Center position" type="button" onClick={() => updatePosition(0.5, 0.5)}><Icon name="CenterFocusStrong" /></button>
        <button aria-label="Reset position" type="button" onClick={() => updatePosition(resetLayout.x, resetLayout.y)}><Icon name="Restore" /></button>
      </div>
      <div className="nudge-toolbar">
        <button aria-label="Scale down" type="button" onClick={() => updateScale(scale - 0.05)}><Icon name="ZoomOut" /></button>
        <button aria-label="Reset scale" type="button" onClick={() => updateScale(resetLayout.scale)}><Icon name="SettingsBackupRestore" /></button>
        <button aria-label="Scale up" type="button" onClick={() => updateScale(scale + 0.05)}><Icon name="ZoomIn" /></button>
        {canRotate && (
          <>
            <button aria-label="Rotate left 1 degree" type="button" onClick={() => onChangeLayer(selectedLayerIndex, { rotation: normalizeRotationDegrees(rotation - 1) })}><Icon name="RotateLeft" /></button>
            <button aria-label="Rotate right 1 degree" type="button" onClick={() => onChangeLayer(selectedLayerIndex, { rotation: normalizeRotationDegrees(rotation + 1) })}><Icon name="RotateRight" /></button>
            <button aria-label="Rotate left 15 degrees" type="button" onClick={() => onChangeLayer(selectedLayerIndex, { rotation: normalizeRotationDegrees(rotation - 15) })}>-15</button>
            <button aria-label="Rotate right 15 degrees" type="button" onClick={() => onChangeLayer(selectedLayerIndex, { rotation: normalizeRotationDegrees(rotation + 15) })}>+15</button>
          </>
        )}
      </div>
      <div className="axis-lock-control" role="group" aria-label="Axis lock">
        {(["free", "x", "y"] as const).map((value) => (
          <button className={axisLock === value ? "active" : ""} key={value} type="button" onClick={() => onSetAxisLock(value)}>
            {value === "free" ? "Free" : `${value.toUpperCase()} lock`}
          </button>
        ))}
      </div>
    </div>
  );
}

function DialogueNodesPanel({
  draft,
  references,
  resourceChapterFilters,
  selectedNodeIndex,
  nodeTextRef,
  setSelectedNodeIndex,
  addDialogueNode,
  insertDialogueNodeAfter,
  duplicateDialogueNode,
  addStatementNode,
  updateDialogueNode,
  replaceDialogueNodes,
  removeDialogueNode,
  updateStatementNode,
  replaceStatementNodes,
  removeStatementNode,
  insertTag,
  insertColorTag,
  onNavigateToStoryAssets,
  bridgeEndpoint,
  notify,
  selectedId
}: {
  draft: ResourceRecord | null;
  references: ReferenceResources;
  resourceChapterFilters: string[];
  selectedNodeIndex: number;
  nodeTextRef: MutableRefObject<HTMLTextAreaElement | null>;
  setSelectedNodeIndex: (index: number) => void;
  addDialogueNode: (mode: DialogueNodeMode) => void;
  insertDialogueNodeAfter: (index: number, mode: DialogueNodeMode) => void;
  duplicateDialogueNode: (index: number) => void;
  addStatementNode: () => void;
  updateDialogueNode: (index: number, node: ResourceRecord) => void;
  replaceDialogueNodes: (nodes: ResourceRecord[]) => void;
  removeDialogueNode: (index: number) => void;
  updateStatementNode: (index: number, node: ResourceRecord) => void;
  replaceStatementNodes: (nodes: ResourceRecord[]) => void;
  removeStatementNode: (index: number) => void;
  insertTag: (action: TagAction) => void;
  insertColorTag: (color: string) => void;
  onNavigateToStoryAssets?: () => void;
  bridgeEndpoint: string;
  notify: (message: string) => void;
  selectedId: string;
}) {
  const nodes = draft ? asArray<ResourceRecord>(draft.nodes) : [];
  const statementNodes = draft ? asArray<ResourceRecord>(draft.statement_nodes) : [];
  const selectedNode = nodes[selectedNodeIndex];
  const [mobileNodeListOpen, setMobileNodeListOpen] = useState(false);
  const [selectedStatementIndex, setSelectedStatementIndex] = useState(0);
  const [activeReactionPath, setActiveReactionPath] = useState<StatementReactionPath | null>(null);
  const [selectedReactionNodePath, setSelectedReactionNodePath] = useState<StatementReactionNodePath | null>(null);
  const [statementScrollTarget, setStatementScrollTarget] = useState<StatementScrollTarget | null>(null);
  const [textContextMenu, setTextContextMenu] = useState<DialogueTextContextMenuState | null>(null);
  const [storyAssetPicker, setStoryAssetPicker] = useState<StoryAssetPickerState | null>(null);
  const statementFlowRef = useRef<HTMLDivElement | null>(null);
  const statementDetailRef = useRef<HTMLDivElement | null>(null);
  const nodeEditorRef = useRef<HTMLDivElement | null>(null);
  const draftId = draft ? String(draft.id || "") : "";
  const metadata = draft ? normalizeJsonObject(draft.metadata) : {};
  const presentationMode = normalizeDialoguePresentationMode(metadata.presentation_mode);
  const statementMode = presentationMode === "statement";
  const talkMode = presentationMode === "talk";
  const investigationMode = presentationMode === "investigation";
  const locationOptions = buildDialogueLocationOptions(metadata.locations ?? metadata.places, nodes);
  const ui = useUiText();
  const nodeOptions = useMemo(
    () => buildNodeSelectOptions(nodes, "@", references.characters),
    [nodes, references.characters]
  );

  useEffect(() => {
    setMobileNodeListOpen(Boolean(draft) && !statementMode && nodes.length === 0);
  }, [draftId, nodes.length, statementMode]);

  useEffect(() => {
    if (statementNodes.length === 0) {
      setSelectedStatementIndex(0);
      setActiveReactionPath(null);
      setSelectedReactionNodePath(null);
      return;
    }
    setSelectedStatementIndex((index) => clampListIndex(index, statementNodes.length));
    setActiveReactionPath((path) => normalizeStatementReactionPath(statementNodes, path));
    setSelectedReactionNodePath((path) => normalizeStatementReactionNodePath(statementNodes, path));
  }, [statementNodes]);

  useEffect(() => {
    if (!statementScrollTarget) return;
    const selector = statementScrollSelector(statementScrollTarget);
    window.requestAnimationFrame(() => {
      statementFlowRef.current?.querySelector<HTMLElement>(selector)?.scrollIntoView({ block: "nearest", inline: "nearest" });
      statementDetailRef.current?.querySelector<HTMLElement>(selector)?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }, [statementScrollTarget, statementNodes]);

  useDialogueTextContextMenuDismiss(textContextMenu, () => setTextContextMenu(null));

  const activeDialogueChapterIds = useMemo(
    () => getActiveDialogueChapterIds(draft, resourceChapterFilters),
    [draft, resourceChapterFilters]
  );

  function selectStatement(index: number) {
    const nextIndex = clampListIndex(index, statementNodes.length);
    setSelectedStatementIndex(nextIndex);
    setActiveReactionPath(null);
    setSelectedReactionNodePath(null);
    setStatementScrollTarget({ kind: "statement", statementIndex: nextIndex });
  }

  function selectReaction(path: StatementReactionPath) {
    const normalized = normalizeStatementReactionPath(statementNodes, path);
    if (!normalized) return;
    setSelectedStatementIndex(normalized.statementIndex);
    setActiveReactionPath(normalized);
    setSelectedReactionNodePath(null);
    setStatementScrollTarget({ kind: "reaction", path: normalized });
  }

  function selectReactionChild(path: StatementReactionNodePath) {
    const normalized = normalizeStatementReactionNodePath(statementNodes, path);
    if (!normalized) return;
    const reactionPath = statementReactionPathFromNodePath(normalized);
    setSelectedStatementIndex(normalized.statementIndex);
    setActiveReactionPath(reactionPath);
    setSelectedReactionNodePath(normalized);
    setStatementScrollTarget({ kind: "child", path: normalized });
  }

  function addStatementAndSelect() {
    const nextIndex = statementNodes.length;
    addStatementNode();
    setSelectedStatementIndex(nextIndex);
    setActiveReactionPath(null);
    setSelectedReactionNodePath(null);
    setStatementScrollTarget({ kind: "statement", statementIndex: nextIndex });
  }

  function moveStatementNode(fromIndex: number, toIndex: number) {
    const nextIndex = clampListIndex(toIndex, statementNodes.length);
    if (fromIndex === nextIndex || fromIndex < 0 || fromIndex >= statementNodes.length) return;
    replaceStatementNodes(moveArrayItem(statementNodes, fromIndex, nextIndex));
    setSelectedStatementIndex((index) => remapMovedIndex(index, fromIndex, nextIndex));
    setActiveReactionPath((path) => path ? { ...path, statementIndex: remapMovedIndex(path.statementIndex, fromIndex, nextIndex) } : null);
    setSelectedReactionNodePath((path) => path ? { ...path, statementIndex: remapMovedIndex(path.statementIndex, fromIndex, nextIndex) } : null);
    setStatementScrollTarget({ kind: "statement", statementIndex: remapMovedIndex(selectedStatementIndex, fromIndex, nextIndex) });
  }

  function updateReactionAtPath(path: StatementReactionPath, nextReaction: ResourceRecord) {
    const statementNode = statementNodes[path.statementIndex];
    if (!statementNode) return;
    const lies = getStatementLies(statementNode);
    const lie = lies[path.lieIndex];
    if (!lie) return;
    const reactions = asArray<ResourceRecord>(lie.reactions);
    if (!reactions[path.reactionIndex]) return;
    updateStatementNode(path.statementIndex, withStatementLies(
      statementNode,
      lies.map((entry, lieIndex) => lieIndex === path.lieIndex
        ? {
          ...entry,
          reactions: reactions.map((reaction, reactionIndex) => reactionIndex === path.reactionIndex ? nextReaction : reaction)
        }
        : entry)
    ));
  }

  function toggleReactionEnd(path: StatementReactionPath, checked: boolean) {
    const reaction = getStatementReactionAtPath(statementNodes, path);
    if (!reaction) return;
    updateReactionAtPath(path, { ...reaction, statement_end: checked });
    selectReaction(path);
  }

  function addReactionChildFromFlow(path: StatementReactionPath) {
    const reaction = getStatementReactionAtPath(statementNodes, path);
    if (!reaction) return;
    const childNodes = asArray<ResourceRecord>(reaction.nodes);
    const childIndex = childNodes.length;
    const nextNode = defaultNestedNode("dialogue");
    const inheritedNode = applyInheritedStageCastDefaults(nextNode, childIndex, [...childNodes, nextNode], references.characters);
    updateReactionAtPath(path, { ...reaction, nodes: [...childNodes, inheritedNode] });
    selectReactionChild({ ...path, childIndex });
  }

  if (!draft) return <p className="empty-state">편집할 대사를 선택하세요.</p>;

  function selectDialogueNode(index: number) {
    setSelectedNodeIndex(index);
    if (isMobileEditorLayout()) setMobileNodeListOpen(false);
  }

  function addDialogueNodeAndOpenEditor(mode: DialogueNodeMode) {
    addDialogueNode(mode);
    if (isMobileEditorLayout()) setMobileNodeListOpen(false);
  }

  function addStatementAndOpenEditor() {
    addStatementAndSelect();
    if (isMobileEditorLayout()) setMobileNodeListOpen(false);
  }

  function autoCleanSpeakerStageCast() {
    const manualRemovals = countManualStageCastRemovals(nodes, references.characters);
    const removeManualExtras = manualRemovals > 0
      ? window.confirm(ui.form.speakerAutoCleanConfirmManualRemove)
      : true;
    const result = cleanDialogueSpeakerStageCast(nodes, references.characters, { removeManualExtras });
    if (result.changedNodeCount === 0) {
      notify("화자 자동정리: 정리할 무대 캐스트가 없습니다.");
      return;
    }
    replaceDialogueNodes(result.nodes);
    setSelectedNodeIndex(clampListIndex(selectedNodeIndex, result.nodes.length));
    const summary = [
      result.addedCastCount > 0 ? `${result.addedCastCount}개 추가` : "",
      result.removedCastCount > 0 ? `${result.removedCastCount}개 제거` : ""
    ].filter(Boolean).join(" · ");
    notify(`화자 자동정리: ${result.changedNodeCount}개 노드에서 ${summary || "캐스트를 정리"}했습니다.`);
  }

  function handleOpenDialogueTextContextMenu(
    event: ReactMouseEvent<HTMLTextAreaElement | HTMLInputElement>,
    config: Omit<DialogueTextContextTarget, "textarea">
  ) {
    setTextContextMenu(openDialogueTextContextMenu(event, config));
  }

  function handleOpenStoryAssetPicker(action: DialogueEventContextAction, target: DialogueTextContextTarget) {
    setTextContextMenu(null);
    setStoryAssetPicker({ action, target });
  }

  function insertTextAtNodeCursor(inserted: string) {
    if (!selectedNode) return;
    const currentText = String(selectedNode.text || "");
    insertTextWithTextareaUndo(nodeTextRef.current, currentText, inserted, (nextText) => {
      updateDialogueNode(selectedNodeIndex, { ...selectedNode, text: nextText });
    });
  }

  function dialogueStageTagTargets() {
    if (!selectedNode) return [];
    const targets = new Map<string, DialogueStageTagTarget>();
    const appendTarget = (rawId: unknown) => {
      const characterId = normalizeEditorSpeakerId(rawId);
      if (!characterId || characterId === "mystery" || characterIsProtagonist(characterId, references.characters)) return;
      targets.set(characterId, {
        id: characterId,
        label: characterLabel(characterId, undefined, references.characters),
        color: characterBadgeColor(characterId, references.characters)
      });
    };
    appendTarget(selectedNode.speaker);
    Object.keys(getStageCastRecord(selectedNode.stage_cast)).forEach(appendTarget);
    computeStageCharacterIdsAtNode(selectedNodeIndex, nodes).forEach(appendTarget);
    return Array.from(targets.values());
  }

  function insertEnterTag(characterId: string) {
    insertTextAtNodeCursor(`[enter id="${escapeBbcodeAttribute(characterId)}"]`);
  }

  function insertExitTag(characterId: string) {
    insertTextAtNodeCursor(`[exit id="${escapeBbcodeAttribute(characterId)}"]`);
  }

  const showMobileNodeList = mobileNodeListOpen || (!statementMode && nodes.length === 0);
  const stageTagTargets = dialogueStageTagTargets();
  const stageCastPreviewContext: StageCastActualPreviewContext | undefined = selectedNode && draft
    ? {
      bridgeEndpoint,
      dialogueDraft: draft,
      dialogueId: String(draft.id || selectedId),
      nodeId: resolveNodeId(selectedNode, selectedNodeIndex, "@"),
      previousNodeId: resolvePreviousPreviewNodeId(nodes, selectedNodeIndex),
      notify
    }
    : undefined;

  return (
    <div className={`nodes-layout ${statementMode ? "statement-mode" : ""} ${showMobileNodeList ? "mobile-list-open" : "mobile-editor-open"}`}>
      <div className="node-list" id="dialogue-node-list">
        <div className="node-drawer-header">
          <strong><Icon name="FormatListBulleted" />노드 목록</strong>
          <button aria-label="노드 목록 닫기" type="button" onClick={() => setMobileNodeListOpen(false)}>
            <Icon name="Close" />
          </button>
        </div>
        <div className="node-list-scroll">
          <div className="inline-actions">
            <button type="button" onClick={() => addDialogueNodeAndOpenEditor("dialogue")}><Icon name="Add" />대사</button>
            <button type="button" onClick={() => addDialogueNodeAndOpenEditor("stage")}><Icon name="Add" />무대</button>
            <button type="button" onClick={() => addDialogueNodeAndOpenEditor("cutscene")}><Icon name="Add" />컷씬</button>
            <button type="button" onClick={addStatementAndOpenEditor}><Icon name="Add" />진술</button>
            <button className="node-auto-clean-button" disabled={nodes.length === 0} type="button" onClick={autoCleanSpeakerStageCast}>
              <Icon name="AutoFixHigh" />{ui.form.speakerAutoClean}
            </button>
          </div>
          {selectedNode && (
            <button className="node-editor-return-button" type="button" onClick={() => setMobileNodeListOpen(false)}>
              <Icon name="Edit" />현재 노드 편집
            </button>
          )}
          {nodes.map((node, index) => {
            const castBadges = nodeCastBadges(node, index, nodes, references);
            const bgmBadges = nodeBgmBadges(node, references);
            const hasRowBadges = castBadges.length > 0 || bgmBadges.length > 0;
            return (
              <button
                className={`node-row ${index === selectedNodeIndex ? "active" : ""} ${hasRowBadges ? "has-cast-badges" : ""}`}
                key={index}
                type="button"
                onClick={() => selectDialogueNode(index)}
              >
                <strong>{index + 1}. {dialogueNodeTitle(node, references, ui)}</strong>
                <span className="node-row-summary">{dialogueNodeSummary(node, references)}</span>
                <NodeRowBadgeStrip bgmBadges={bgmBadges} castBadges={castBadges} />
              </button>
            );
          })}
          <div className="statement-summary">
            <b>Statement nodes</b>
            <span>{statementNodes.length}개</span>
          </div>
          <StatementFlowNavigator
            activeReactionPath={activeReactionPath}
            onAddReactionChild={addReactionChildFromFlow}
            onMoveStatement={moveStatementNode}
            onSelectReaction={selectReaction}
            onSelectReactionChild={selectReactionChild}
            onSelectStatement={selectStatement}
            onToggleReactionEnd={toggleReactionEnd}
            references={references}
            selectedReactionNodePath={selectedReactionNodePath}
            selectedStatementIndex={selectedStatementIndex}
            statementNodes={statementNodes}
            statementFlowRef={statementFlowRef}
          />
          {!statementMode && (
            <div className="statement-detail-scroll" ref={statementDetailRef}>
              <StatementNodesEditor
                activeReactionPath={activeReactionPath}
                onOpenDialogueTextContextMenu={handleOpenDialogueTextContextMenu}
                onSelectReaction={selectReaction}
                onSelectReactionChild={selectReactionChild}
                onSelectStatement={selectStatement}
                references={references}
                selectedReactionNodePath={selectedReactionNodePath}
                statementNodes={statementNodes}
                updateStatementNode={updateStatementNode}
                removeStatementNode={removeStatementNode}
              />
            </div>
          )}
        </div>
      </div>

      <button className="node-list-scrim" aria-label="노드 목록 닫기" type="button" onClick={() => setMobileNodeListOpen(false)} />
      <button
        className="node-list-floating-button"
        aria-controls="dialogue-node-list"
        aria-expanded={showMobileNodeList}
        aria-label="노드 목록 열기"
        type="button"
        onClick={() => setMobileNodeListOpen(true)}
      >
        <Icon name="FormatListBulleted" />
        <span>노드</span>
      </button>

      <div
        className="node-editor"
        ref={nodeEditorRef}
        onWheel={(event) => {
          if (!nodeEditorRef.current) return;
          blurFocusedFieldForContainerWheel(nodeEditorRef.current, event.deltaY);
        }}
      >
        {statementMode ? (
          <div className="statement-detail-scroll statement-detail-pane" ref={statementDetailRef}>
            {statementNodes.length === 0 ? (
              <p className="empty-state">진술 노드를 추가하세요.</p>
            ) : (
              <StatementNodesEditor
                activeReactionPath={activeReactionPath}
                onOpenDialogueTextContextMenu={handleOpenDialogueTextContextMenu}
                onSelectReaction={selectReaction}
                onSelectReactionChild={selectReactionChild}
                onSelectStatement={selectStatement}
                references={references}
                selectedReactionNodePath={selectedReactionNodePath}
                statementNodes={statementNodes}
                updateStatementNode={updateStatementNode}
                removeStatementNode={removeStatementNode}
                visibleStatementIndex={selectedStatementIndex}
                visibleReactionNodePath={selectedReactionNodePath}
                visibleReactionPath={activeReactionPath}
              />
            )}
          </div>
        ) : (
          <>
            {!selectedNode && <p className="empty-state">노드를 추가하거나 선택하세요.</p>}
            {selectedNode && (
              <>
              <div className="node-editor-toolbar">
              <button className="node-list-toggle-button" type="button" onClick={() => setMobileNodeListOpen(true)}>
                <Icon name="Menu" />노드 목록
              </button>
              <div className="node-stepper" aria-label="노드 이동">
                <button type="button" disabled={selectedNodeIndex <= 0} onClick={() => setSelectedNodeIndex(Math.max(0, selectedNodeIndex - 1))}>
                  이전
                </button>
                <span>{selectedNodeIndex + 1} / {nodes.length}</span>
                <button type="button" disabled={selectedNodeIndex >= nodes.length - 1} onClick={() => setSelectedNodeIndex(Math.min(nodes.length - 1, selectedNodeIndex + 1))}>
                  다음
                </button>
                <button type="button" onClick={() => insertDialogueNodeAfter(selectedNodeIndex, getDialogueNodeMode(selectedNode))}>
                  <Icon name="Add" />추가
                </button>
                <button type="button" onClick={() => duplicateDialogueNode(selectedNodeIndex)}>
                  <Icon name="ContentCopy" />복사
                </button>
              </div>
              <SelectLiteralField
                label={ui.form.mode}
                value={getDialogueNodeMode(selectedNode)}
                options={dialogueNodeModeOptions}
                labels={dialogueNodeModeLabels(ui)}
                onChange={(value) => {
                  const nextMode = value as DialogueNodeMode;
                  updateDialogueNode(selectedNodeIndex, nextMode === "cutscene"
                    ? withNodeCutscene(selectedNode, getNodeCutsceneEditorValue(selectedNode))
                    : nextMode === "stage"
                      ? withStageMode(selectedNode)
                      : withDialogueMode(selectedNode));
                }}
              />
              <button className="danger-action" type="button" onClick={() => removeDialogueNode(selectedNodeIndex)}>
                <Icon name="Delete" />삭제
              </button>
            </div>

            {isCutsceneNode(selectedNode) ? (
              <div className="form-grid compact">
                <TextField label={ui.form.fadeIn} value={getNodeCutsceneEditorValue(selectedNode).fade_in} type="number" onChange={(value) => updateDialogueNode(selectedNodeIndex, patchCutscene(selectedNode, "fade_in", Number(value)))} />
                <TextField label={ui.form.hold} value={getNodeCutsceneEditorValue(selectedNode).hold} type="number" onChange={(value) => updateDialogueNode(selectedNodeIndex, patchCutscene(selectedNode, "hold", Number(value)))} />
                <TextField label={ui.form.fadeOut} value={getNodeCutsceneEditorValue(selectedNode).fade_out} type="number" onChange={(value) => updateDialogueNode(selectedNodeIndex, patchCutscene(selectedNode, "fade_out", Number(value)))} />
                <TextField label={ui.form.image} value={getNodeCutsceneEditorValue(selectedNode).image} onChange={(value) => updateDialogueNode(selectedNodeIndex, patchCutscene(selectedNode, "image", value))} />
              </div>
            ) : isStageNode(selectedNode) ? (
              <>
                <div className="form-grid compact">
                  <SelectField label={ui.form.nextNode} value={selectedNode.next || ""} options={nodeOptions} onChange={(value) => updateDialogueNode(selectedNodeIndex, { ...selectedNode, next: value })} />
                  <NumberField label={ui.form.hold} value={getStageNodeHoldEditorValue(selectedNode)} min={0} step={0.1} resetValue={0} onChange={(value) => updateDialogueNode(selectedNodeIndex, patchStageHold(selectedNode, value))} />
                </div>
                <StageCastEditor
                  actualPreview={stageCastPreviewContext}
                  characters={references.characters}
                  nodes={nodes}
                  selectedNodeIndex={selectedNodeIndex}
                  speakerId=""
                  speakerMystery={false}
                  focusTargets={getNodeFocusTargets(selectedNode)}
                  stageCast={selectedNode.stage_cast}
                  onFocusTargetsChange={(focusTargets) => updateDialogueNode(selectedNodeIndex, withNodeFocusTargets(selectedNode, focusTargets))}
                  onChange={(stageCast) => updateDialogueNode(selectedNodeIndex, { ...selectedNode, stage_cast: stageCast })}
                />
              </>
            ) : (
              <>
                <div className="form-grid compact">
                  <SelectField
                    label={ui.form.speaker}
                    value={selectedNode.speaker || "narrator"}
                    options={[{ id: "narrator", title: "narrator", subtitle: "built-in", type: "characters", isProtagonist: true } as ResourceSummary, ...references.characters]}
                    onChange={(value) => updateDialogueNode(selectedNodeIndex, withSpeakerStageCastDefaults(selectedNode, value, nodes, selectedNodeIndex, references.characters))}
                  />
                  <SelectField label={ui.form.nextNode} value={selectedNode.next || ""} options={nodeOptions} onChange={(value) => updateDialogueNode(selectedNodeIndex, { ...selectedNode, next: value })} />
                  <ToggleField label={ui.form.speakerMystery} checked={getNodeSpeakerMystery(selectedNode)} onChange={(checked) => updateDialogueNode(selectedNodeIndex, withNodeSpeakerMystery(selectedNode, checked, references.characters))} />
                  <ToggleField label={ui.form.textSoundMuted} checked={getNodeTextSoundMuted(selectedNode)} onChange={(checked) => updateDialogueNode(selectedNodeIndex, withNodeTextSoundMuted(selectedNode, checked))} />
                </div>
                <DialogueNodeBackgroundEditor
                  node={selectedNode}
                  references={references}
                  onTextChange={(nextText) => updateDialogueNode(selectedNodeIndex, { ...selectedNode, text: nextText })}
                />
                <RichTextPreview
                  references={references}
                  text={selectedNode.text || ""}
                  onRemoveRange={(range) => {
                    const currentText = String(selectedNode.text || "");
                    removeTextRangeWithTextareaUndo(nodeTextRef.current, currentText, range, (nextText) => {
                      updateDialogueNode(selectedNodeIndex, { ...selectedNode, text: nextText });
                    });
                  }}
                />
                <DialogueStageTagQuickInsert
                  targets={stageTagTargets}
                  onEnter={insertEnterTag}
                  onExit={insertExitTag}
                />
                <label className="node-textarea">
                  <span>{ui.form.text}</span>
                  <textarea
                    ref={nodeTextRef}
                    value={selectedNode.text || ""}
                    onChange={(event) => updateDialogueNode(selectedNodeIndex, { ...selectedNode, text: event.target.value })}
                    onContextMenu={(event) => handleOpenDialogueTextContextMenu(event, {
                      kind: "dialogue",
                      getText: () => String(selectedNode.text || ""),
                      onTextChange: (nextText) => updateDialogueNode(selectedNodeIndex, { ...selectedNode, text: nextText })
                    })}
                    spellCheck={false}
                  />
                </label>
                <div className="tag-palette" aria-label="대사 효과">
                  {tagActionGroups.map((group) => {
                    const actions = tagActions.filter((action) => action.category === group.id);
                    return (
                      <section className={`tag-action-group ${group.id}`} key={group.id}>
                        <div className="tag-action-group-header">
                          <strong>{group.label}</strong>
                        </div>
                        <div className="tag-action-grid">
                          {actions.map((action) => (
                            <button className={`tag-action-button ${action.category}`} key={`${action.category}-${action.label}-${action.hint}`} type="button" onClick={() => insertTag(action)}>
                              <span className="tag-action-label">
                                <span className="tag-action-label-base">{action.label}</span>
                                <span className="tag-action-label-effect" aria-hidden="true">
                                  {renderTagActionHoverPreview(action)}
                                </span>
                              </span>
                              <span className="tag-action-meta">
                                <span className="tag-action-hint">{action.hint}</span>
                                {action.badge ? <span className={`tag-action-badge ${action.category}`}>{action.badge}</span> : null}
                              </span>
                            </button>
                          ))}
                        </div>
                        {group.id === "color" && (
                          <div className="tag-color-tools">
                            <div className="tag-color-swatch-grid" aria-label="색상 팔레트">
                              {dialogueColorPalette.map((item) => (
                                <button
                                  className="tag-color-swatch-button"
                                  key={item.color}
                                  style={{ "--tag-color": item.color } as CSSProperties}
                                  title={item.label}
                                  type="button"
                                  onClick={() => insertColorTag(item.color)}
                                >
                                  <span className="tag-color-swatch" />
                                  <span>{item.label}</span>
                                </button>
                              ))}
                            </div>
                            <div className="tag-character-color-list" aria-label="캐릭터 색상">
                              {references.characters.length > 0 ? references.characters.map((character) => {
                                const color = String(character.nameColor || "#ffffff");
                                return (
                                  <button
                                    className="tag-character-color-button"
                                    key={character.id}
                                    style={{ "--tag-color": color } as CSSProperties}
                                    title={character.id}
                                    type="button"
                                    onClick={() => insertColorTag(`character:${character.id}`)}
                                  >
                                    <span className="tag-color-swatch" />
                                    <span>{character.title}</span>
                                  </button>
                                );
                              }) : (
                                <span className="tag-character-color-empty">캐릭터 색상 없음</span>
                              )}
                            </div>
                          </div>
                        )}
                      </section>
                    );
                  })}
                </div>
                <DialogueChoicesEditor
                  node={selectedNode}
                  nodeAutoPrefix="@"
                  nodes={nodes}
                  locationOptions={locationOptions}
                  onOpenDialogueTextContextMenu={handleOpenDialogueTextContextMenu}
                  references={references}
                  topicMode={talkMode || investigationMode}
                  updateNode={(nextNode) => updateDialogueNode(selectedNodeIndex, nextNode)}
                />
                <StageCastEditor
                  actualPreview={stageCastPreviewContext}
                  characters={references.characters}
                  nodes={nodes}
                  selectedNodeIndex={selectedNodeIndex}
                  speakerId={String(selectedNode.speaker || "")}
                  speakerMystery={getNodeSpeakerMystery(selectedNode)}
                  focusTargets={getNodeFocusTargets(selectedNode)}
                  stageCast={selectedNode.stage_cast}
                  onFocusTargetsChange={(focusTargets) => updateDialogueNode(selectedNodeIndex, withNodeFocusTargets(selectedNode, focusTargets))}
                  onChange={(stageCast) => updateDialogueNode(selectedNodeIndex, { ...selectedNode, stage_cast: stageCast })}
                />
                <AcquireInfoEditor
                  references={references}
                  value={getNodeAcquireInfoEditorValue(selectedNode)}
                  onChange={(acquireInfo) => updateDialogueNode(selectedNodeIndex, withNodeAcquireInfo(selectedNode, acquireInfo))}
                />
                <div className="form-grid">
                  <ChoiceJsonField
                    label="set_flags_on_complete"
                    value={selectedNode.set_flags_on_complete}
                    expected="object"
                    onChange={(value) => updateDialogueNode(selectedNodeIndex, { ...selectedNode, set_flags_on_complete: value })}
                  />
                </div>
                <NodePopupsEditor
                  node={selectedNode}
                  popups={getNodePopupsEditorValue(selectedNode)}
                  references={references}
                  onChange={(popups) => updateDialogueNode(selectedNodeIndex, withNodePopups(selectedNode, popups))}
                />
              </>
            )}
              </>
            )}
          </>
        )}
      </div>
      {textContextMenu && (
        <DialogueBbcodeContextMenu
          characters={references.characters}
          menu={textContextMenu}
          onClose={() => setTextContextMenu(null)}
          onOpenStoryAssetPicker={handleOpenStoryAssetPicker}
          renderEffectPreview={(text) => renderRichTextNodes(parseRichTextPreviewAst(text), "context-preview", references)}
        />
      )}
      {storyAssetPicker && (
        <StoryAssetPickerOverlay
          activeChapterIds={activeDialogueChapterIds}
          chapters={references.chapters}
          onClose={() => setStoryAssetPicker(null)}
          onOpenStoryAssetsEditor={() => {
            setStoryAssetPicker(null);
            onNavigateToStoryAssets?.();
          }}
          picker={storyAssetPicker}
          storyAssetSummaries={references.storyAssets}
        />
      )}
    </div>
  );
}

type DialogueStageTagTarget = {
  id: string;
  label: string;
  color: string;
};

function DialogueStageTagQuickInsert({
  targets,
  onEnter,
  onExit
}: {
  targets: DialogueStageTagTarget[];
  onEnter: (characterId: string) => void;
  onExit: (characterId: string) => void;
}) {
  if (targets.length === 0) return null;

  return (
    <section className="dialogue-stage-tag-quick-insert" aria-label="등장/퇴장 태그">
      <div className="dialogue-stage-tag-title">
        <Icon name="Groups" />
        <span>등장/퇴장</span>
      </div>
      <div className="dialogue-stage-tag-list">
        {targets.map((target) => (
          <div
            className="dialogue-stage-tag-target"
            key={target.id}
            style={{ "--stage-tag-color": target.color } as CSSProperties}
          >
            <span className="dialogue-stage-tag-name">
              <span className="dialogue-stage-tag-swatch" />
              <span>{target.label}</span>
            </span>
            <button type="button" onClick={() => onEnter(target.id)}>
              <Icon name="Login" />
              등장
            </button>
            <button type="button" onClick={() => onExit(target.id)}>
              <Icon name="Logout" />
              퇴장
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function DialogueNodeBackgroundEditor({
  node,
  references,
  onTextChange
}: {
  node: ResourceRecord;
  references: ReferenceResources;
  onTextChange: (nextText: string) => void;
}) {
  const text = String(node.text || "");
  const value = getDialogueBackgroundEditorValue(text);
  const backgroundAssetOptions = getBackgroundStoryAssetOptions(references.storyAssets);
  const previewUrl = getDialogueBackgroundPreviewUrl(value, references.storyAssets);
  const [imageAspect, setImageAspect] = useState(16 / 9);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; originalX: number; originalY: number; imageWidth: number; imageHeight: number } | null>(null);
  const dragLock = useMobileDragLock();

  function commit(nextValue: DialogueBackgroundEditorValue) {
    onTextChange(upsertDialogueBackgroundEvent(text, nextValue));
  }

  function toggleBackground(checked: boolean) {
    if (!checked) {
      onTextChange(removeDialogueBackgroundEvent(text, value));
      return;
    }
    commit({ ...value, enabled: true });
  }

  function patch(patchValue: Partial<DialogueBackgroundEditorValue>) {
    commit({ ...value, enabled: true, ...patchValue });
  }

  function setZoom(nextZoom: number) {
    patch({ zoom: roundForInput(clampNumber(nextZoom, 1, 6, 1)) });
  }

  function setFocus(nextX: number, nextY: number) {
    patch({
      x: round4Number(clamp01Number(nextX, 0.5)),
      y: round4Number(clamp01Number(nextY, 0.5))
    });
  }

  function startDrag(event: ReactPointerEvent<HTMLElement>) {
    if (!value.enabled || !previewUrl || event.button !== 0 || dragLock.locked) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    const imageSize = getDialogueBackgroundPreviewImageSize(rect.width, rect.height, value.zoom, imageAspect);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originalX: value.x,
      originalY: value.y,
      imageWidth: imageSize.width,
      imageHeight: imageSize.height
    };
    event.preventDefault();
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    if (dragLock.locked) return;
    const drag = dragRef.current;
    if (!drag) return;
    setFocus(
      drag.originalX - (event.clientX - drag.startX) / Math.max(1, drag.imageWidth),
      drag.originalY - (event.clientY - drag.startY) / Math.max(1, drag.imageHeight)
    );
    event.preventDefault();
  }

  function stopDrag() {
    dragRef.current = null;
  }

  return (
    <section className={`dialogue-background-editor ${value.enabled ? "enabled" : ""}`}>
      <div className="dialogue-background-toggle-row">
        <ToggleField label="배경 조정" checked={value.enabled} onChange={toggleBackground} />
        {value.enabled && (
          <code>{value.id ? `id ${value.id}` : value.path || "배경 미지정"} · zoom {value.zoom.toFixed(2)} · {value.x.toFixed(2)}, {value.y.toFixed(2)}</code>
        )}
      </div>
      {value.enabled && (
        <div className="dialogue-background-workspace">
          <div className="dialogue-background-preview-wrap">
            <div className="coordinate-editor-header">
              <span>배경 위치</span>
              <div className="coordinate-editor-meta">
                <code>drag</code>
                <DragLockToggle
                  available={dragLock.available}
                  locked={dragLock.locked}
                  onToggle={dragLock.toggle}
                />
              </div>
            </div>
            <div
              className={`dialogue-background-preview-stage ${previewUrl ? "has-image" : ""} ${dragLock.locked ? "drag-locked" : ""}`}
              onPointerCancel={stopDrag}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={stopDrag}
              ref={stageRef}
            >
              <DragLockHint available={dragLock.available} locked={dragLock.locked} onToggle={dragLock.toggle} />
              {previewUrl ? (
                <img
                  alt=""
                  draggable={false}
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    const width = image.naturalWidth || image.width || 16;
                    const height = image.naturalHeight || image.height || 9;
                    if (width > 0 && height > 0) setImageAspect(width / height);
                  }}
                  src={previewUrl}
                  style={getDialogueBackgroundPreviewImageStyle(value, imageAspect)}
                />
              ) : (
                <span>배경 에셋이나 경로를 선택하세요.</span>
              )}
            </div>
          </div>
          <div className="background-adjust-panel dialogue-background-controls">
            <div className="background-adjust-grid">
              <SelectField
                label="배경 에셋"
                value={value.id}
                options={backgroundAssetOptions}
                onChange={(id) => patch({ id, path: id ? "" : value.path })}
              />
              <div className="background-adjust-wide">
                <TextField label="직접 경로" value={value.path} onChange={(path) => patch({ id: "", path })} />
              </div>
              <NumberField label="X" value={value.x} min={0} max={1} step={0.01} resetValue={0.5} onChange={(x) => setFocus(x, value.y)} />
              <NumberField label="Y" value={value.y} min={0} max={1} step={0.01} resetValue={0.5} onChange={(y) => setFocus(value.x, y)} />
              <NumberField label="줌" value={value.zoom} min={1} max={6} step={0.05} resetValue={1} onChange={setZoom} />
              <div className="background-adjust-actions">
                <button aria-label="배경 줌아웃" type="button" onClick={() => setZoom(value.zoom - 0.05)}><Icon name="ZoomOut" /></button>
                <button aria-label="배경 줌 초기화" type="button" onClick={() => setZoom(1)}><Icon name="SettingsBackupRestore" /></button>
                <button aria-label="배경 줌인" type="button" onClick={() => setZoom(value.zoom + 0.05)}><Icon name="ZoomIn" /></button>
                <button aria-label="배경 가운데 정렬" type="button" onClick={() => setFocus(0.5, 0.5)}><Icon name="CenterFocusStrong" /></button>
              </div>
              <NumberField label="전환 시간" value={value.duration} min={0} max={10} step={0.1} resetValue={0.5} onChange={(duration) => patch({ duration })} />
              <NumberField label="흐림" value={value.blur} min={0} max={12} step={0.5} resetValue={3} onChange={(blur) => patch({ blur })} />
              <NumberField label="어둡게" value={value.dim} min={0} max={1} step={0.05} resetValue={0.15} onChange={(dim) => patch({ dim })} />
              <ToggleField label="고정" checked={value.fixed} onChange={(fixed) => patch({ fixed })} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function textEventCastBadges(text: string, references: ReferenceResources): NodeCastBadge[] {
  const badges: NodeCastBadge[] = [];
  const append = (node: RichTextAstNode) => {
    if (node.type === "event" && (node.tagName === "enter" || node.tagName === "exit")) {
      for (const characterId of getEventTargetIds(node.attrs).map(normalizeEditorSpeakerId).filter(Boolean)) {
        const badge: NodeCastBadge = {
          kind: node.tagName,
          characterId,
          label: characterLabel(characterId, undefined, references.characters),
          color: characterBadgeColor(characterId, references.characters)
        };
        if (!badges.some((entry) => entry.kind === badge.kind && entry.characterId === badge.characterId)) {
          badges.push(badge);
        }
      }
    }
    if (node.type === "span") node.children.forEach(append);
  };
  parseRichTextPreviewAst(text).forEach(append);
  return badges;
}

function RichTextPreview({
  text,
  compact = false,
  references,
  onRemoveRange
}: {
  text: string;
  compact?: boolean;
  references?: ReferenceResources;
  onRemoveRange?: (range: RichTextSourceRange) => void;
}) {
  const nodes = useMemo(() => parseRichTextPreviewAst(text), [text]);
  const tags = detectTextTags(text);
  return (
    <RichTextRemoveContext.Provider value={onRemoveRange || null}>
      <section className={`rich-text-preview ${compact ? "compact" : ""}`}>
        <div className="rich-text-preview-header">
          <span>Preview</span>
          <code>{tags.length > 0 ? tags.map(tagPreviewLabel).join(" · ") : "plain"}</code>
        </div>
        <div className="rich-text-preview-body">
          {nodes.length > 0 ? renderRichTextNodes(nodes, "rich", references) : <span className="rich-text-empty">보이는 텍스트 없음</span>}
        </div>
      </section>
    </RichTextRemoveContext.Provider>
  );
}

function renderTagActionHoverPreview(action: TagAction) {
  if (action.category === "typing" && action.open?.startsWith("[speed")) {
    const speed = extractTagActionSpeed(action);
    const previewText = action.label;
    const cycleDuration = speed < 1 ? 4.2 : 2.35;
    return (
      <span
        className={`tag-typing-preview ${speed < 1 ? "slow" : "fast"}`}
        style={{ "--tag-speed-cycle": `${cycleDuration}s` } as CSSProperties}
      >
        {Array.from(previewText).map((letter, index) => (
          <span
            className="tag-typing-letter"
            key={`${action.hint}-${letter}-${index}`}
          >
            {letter}
          </span>
        ))}
      </span>
    );
  }
  const previewText = action.previewText
    ? action.previewText
    : action.open && action.close
    ? `${action.open}${action.label}${action.close}`
    : action.label;
  return renderRichTextNodes(parseRichTextPreviewAst(previewText), `tag-action-${action.hint}-${action.label}`);
}

function extractTagActionSpeed(action: TagAction) {
  const match = String(action.open || "").match(/\[speed=([0-9.]+)/);
  const speed = match ? Number(match[1]) : 1;
  return Number.isFinite(speed) && speed > 0 ? speed : 1;
}

function DialogueChoicesEditor({
  node,
  nodes,
  references,
  nodeAutoPrefix,
  locationOptions = [],
  updateNode,
  onOpenDialogueTextContextMenu,
  topicMode = false,
  compact = false
}: {
  node: ResourceRecord;
  nodes: ResourceRecord[];
  references: ReferenceResources;
  nodeAutoPrefix: string;
  locationOptions?: ResourceSummary[];
  updateNode: (node: ResourceRecord) => void;
  onOpenDialogueTextContextMenu?: (
    event: ReactMouseEvent<HTMLTextAreaElement | HTMLInputElement>,
    config: Omit<DialogueTextContextTarget, "textarea">
  ) => void;
  topicMode?: boolean;
  compact?: boolean;
}) {
  const choices = asArray<ResourceRecord>(node.choices);
  const [choiceDragIndex, setChoiceDragIndex] = useState<number | null>(null);
  const [choiceDropTarget, setChoiceDropTarget] = useState<{ index: number; position: "before" | "after" } | null>(null);
  const nodeOptions = useMemo(
    () => buildNodeSelectOptions(nodes, nodeAutoPrefix, references.characters),
    [nodeAutoPrefix, nodes, references.characters]
  );

  function setChoices(nextChoices: ResourceRecord[]) {
    updateNode({ ...node, choices: nextChoices });
  }

  function updateChoice(index: number, nextChoice: ResourceRecord) {
    setChoices(choices.map((choice, choiceIndex) => choiceIndex === index ? nextChoice : choice));
  }

  function addChoice() {
    setChoices([...choices, defaultChoiceRecord()]);
  }

  function removeChoice(index: number) {
    setChoices(choices.filter((_, choiceIndex) => choiceIndex !== index));
  }

  function moveChoiceTo(fromIndex: number, toIndex: number) {
    if (fromIndex < 0 || fromIndex >= choices.length) return;
    const clampedTo = Math.max(0, Math.min(toIndex, choices.length - 1));
    if (fromIndex === clampedTo) return;
    const nextChoices = [...choices];
    const [choice] = nextChoices.splice(fromIndex, 1);
    nextChoices.splice(clampedTo, 0, choice);
    setChoices(nextChoices);
  }

  function moveChoice(index: number, direction: -1 | 1) {
    moveChoiceTo(index, index + direction);
  }

  function handleChoiceDragStart(event: ReactDragEvent<HTMLElement>, index: number) {
    setChoiceDragIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  function handleChoiceDragOver(event: ReactDragEvent<HTMLElement>, index: number) {
    event.preventDefault();
    if (choiceDragIndex === null || index === choiceDragIndex) {
      setChoiceDropTarget(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const position = event.clientY < rect.top + rect.height * 0.5 ? "before" : "after";
    setChoiceDropTarget({ index, position });
    event.dataTransfer.dropEffect = "move";
  }

  function clearChoiceDrag() {
    setChoiceDragIndex(null);
    setChoiceDropTarget(null);
  }

  function handleChoiceDrop(event: ReactDragEvent<HTMLElement>, index: number) {
    event.preventDefault();
    const fromIndex = choiceDragIndex ?? Number(event.dataTransfer.getData("text/plain"));
    if (!Number.isFinite(fromIndex) || fromIndex < 0) {
      clearChoiceDrag();
      return;
    }
    let toIndex = index;
    if (choiceDropTarget?.position === "after") toIndex += 1;
    if (fromIndex < toIndex) toIndex -= 1;
    clearChoiceDrag();
    moveChoiceTo(fromIndex, toIndex);
  }

  const editorTitle = topicMode ? "대화 주제" : "Choices";
  const addLabel = topicMode ? "주제" : "선택지";
  const emptyText = topicMode
    ? "대화 주제 없음 — 주제를 추가하면 들은 항목 체크와 조건 해금이 작동합니다."
    : "선택지 없음 — next 또는 순차 흐름을 사용합니다.";
  const countText = choices.length > 0
    ? (topicMode ? `${choices.length} topics` : `${choices.length} branches`)
    : "단일 흐름";

  return (
    <details className={`choices-editor ${topicMode ? "topic-mode" : ""} ${compact ? "compact" : ""}`} open={choices.length > 0}>
      <summary>
        <strong>{editorTitle}</strong>
        <span>{countText}</span>
        <button type="button" onClick={(event) => {
          event.preventDefault();
          addChoice();
        }}>
          <Icon name="Add" />{addLabel}
        </button>
      </summary>
      <div className="choices-editor-body">
        {choices.length === 0 ? (
          <p className="empty-state">{emptyText}</p>
        ) : (
          <>
            <ChoiceLayoutPreview choices={choices} node={node} />
            <div className="choice-card-list">
              {choices.map((choice, index) => (
                <article
                  className={[
                    "choice-editor-card",
                    choiceDragIndex === index ? "dragging" : "",
                    choiceDropTarget?.index === index ? `drop-${choiceDropTarget.position}` : ""
                  ].filter(Boolean).join(" ")}
                  key={index}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setChoiceDropTarget(null);
                  }}
                  onDragOver={(event) => handleChoiceDragOver(event, index)}
                  onDrop={(event) => handleChoiceDrop(event, index)}
                >
                  <div className="structured-header">
                    <div className="choice-title-group">
                      <button
                        aria-label={`Choice ${index + 1} drag reorder`}
                        className="choice-drag-handle"
                        draggable
                        onDragEnd={clearChoiceDrag}
                        onDragStart={(event) => handleChoiceDragStart(event, index)}
                        type="button"
                      >
                        <Icon name="DragIndicator" />
                      </button>
                      <span>Choice {index + 1}</span>
                    </div>
                    <div className="inline-actions">
                      <button aria-label={`Choice ${index + 1} up`} disabled={index === 0} type="button" onClick={() => moveChoice(index, -1)}>
                        <Icon name="KeyboardArrowUp" />
                      </button>
                      <button aria-label={`Choice ${index + 1} down`} disabled={index >= choices.length - 1} type="button" onClick={() => moveChoice(index, 1)}>
                        <Icon name="KeyboardArrowDown" />
                      </button>
                      <button className="danger-action" type="button" onClick={() => removeChoice(index)}>
                        <Icon name="Delete" />삭제
                      </button>
                    </div>
                  </div>
                  <div className="form-grid compact">
                    <TextField
                      label="Topic ID"
                      value={getChoiceTopicIdEditorValue(choice)}
                      onChange={(value) => updateChoice(index, withChoiceTopicId(choice, value))}
                    />
                    <ToggleField
                      label="들은 상태 추적"
                      checked={getChoiceTrackHeard(choice)}
                      onChange={(checked) => updateChoice(index, withChoiceTrackHeard(choice, checked))}
                    />
                    <ToggleField
                      label="체크 표시"
                      checked={getChoiceShowHeardCheck(choice)}
                      onChange={(checked) => updateChoice(index, withChoiceShowHeardCheck(choice, checked))}
                    />
                    {topicMode && (
                      <ToggleField
                        label="대화 종료"
                        checked={getChoiceExitTalk(choice)}
                        onChange={(checked) => updateChoice(index, withChoiceExitTalk(choice, checked))}
                      />
                    )}
                    <TextField
                      label="Label"
                      value={choice.label || ""}
                      onChange={(value) => updateChoice(index, { ...choice, label: value })}
                      onContextMenu={onOpenDialogueTextContextMenu ? (event) => onOpenDialogueTextContextMenu(event, {
                        kind: "choice",
                        getText: () => String(choice.label || ""),
                        onTextChange: (nextText) => updateChoice(index, { ...choice, label: nextText })
                      }) : undefined}
                    />
                    <TextField
                      label="Text"
                      value={choice.text || ""}
                      onChange={(value) => updateChoice(index, { ...choice, text: value })}
                      onContextMenu={onOpenDialogueTextContextMenu ? (event) => onOpenDialogueTextContextMenu(event, {
                        kind: "choice",
                        getText: () => String(choice.text || ""),
                        onTextChange: (nextText) => updateChoice(index, { ...choice, text: nextText })
                      }) : undefined}
                    />
                    <SelectField label="Next" value={choice.next || ""} options={nodeOptions} onChange={(value) => updateChoice(index, { ...choice, next: value })} />
                    {locationOptions.length > 0 && (
                      <SelectField
                        label="Move to"
                        value={getChoiceMoveToLocationId(choice)}
                        options={locationOptions}
                        onChange={(value) => updateChoice(index, withChoiceMoveToLocation(choice, value))}
                      />
                    )}
                    <SelectField
                      label="Present item"
                      value={getChoicePresentTarget(choice).kind === "item" ? getChoicePresentTarget(choice).id : ""}
                      options={references.items}
                      onChange={(value) => updateChoice(index, withChoicePresentTarget(choice, value ? "item" : "", value))}
                    />
                    <SelectField
                      label="Present character"
                      value={getChoicePresentTarget(choice).kind === "character" ? getChoicePresentTarget(choice).id : ""}
                      options={references.characters}
                      onChange={(value) => updateChoice(index, withChoicePresentTarget(choice, value ? "character" : "", value))}
                    />
                  </div>
                  <div className="choice-rich-preview-grid">
                    <RichTextPreview compact references={references} text={String(choice.label || "")} />
                    <RichTextPreview compact references={references} text={String(choice.text || "")} />
                  </div>
                  <ChoiceProgressionTools
                    choice={choice}
                    nodeOptions={nodeOptions}
                    references={references}
                    onAddCondition={(condition) => updateChoice(index, withChoiceCondition(choice, condition))}
                    onSetFlag={(key, value) => updateChoice(index, withChoiceSetFlag(choice, key, value))}
                  />
                  <div className="form-grid">
                    <ChoiceJsonField
                      label="set_flags"
                      value={choice.set_flags}
                      expected="object"
                      onChange={(value) => updateChoice(index, { ...choice, set_flags: value })}
                    />
                    <ChoiceJsonField
                      label="conditions"
                      value={choice.conditions}
                      expected="array"
                      onChange={(value) => updateChoice(index, { ...choice, conditions: value })}
                    />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </details>
  );
}

type ChoiceConditionKind = "item" | "character" | "topic_heard" | "topic_unheard" | "node_seen" | "dialogue_seen" | "flag";

const choiceConditionKinds: ChoiceConditionKind[] = ["item", "character", "topic_heard", "topic_unheard", "node_seen", "dialogue_seen", "flag"];
const choiceConditionKindLabels: Record<ChoiceConditionKind, string> = {
  item: "아이템 단서",
  character: "캐릭터 정보",
  topic_heard: "토픽 들음",
  topic_unheard: "토픽 미청취",
  node_seen: "노드 봄",
  dialogue_seen: "대사 봄",
  flag: "플래그"
};

function buildDialogueLocationOptions(value: unknown, nodes: ResourceRecord[]): ResourceSummary[] {
  const entries: Array<{ id: string; label: string; node: string }> = [];
  const appendLocation = (idValue: unknown, locationValue: unknown) => {
    const id = normalizeSingleId(idValue);
    if (!id) return;
    if (typeof locationValue === "string") {
      entries.push({ id, label: id, node: locationValue.trim() });
      return;
    }
    const location = normalizeJsonObject(locationValue);
    const label = normalizeSingleId(location.label ?? location.name ?? location.title) || id;
    const node = normalizeSingleId(location.node ?? location.node_id ?? location.start_node ?? location.start ?? location.target ?? location.next);
    entries.push({ id, label, node });
  };

  if (Array.isArray(value)) {
    value.forEach((location) => {
      const record = normalizeJsonObject(location);
      appendLocation(record.id ?? record.location_id ?? record.place_id ?? record.key, record);
    });
  } else if (value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([id, location]) => appendLocation(id, location));
  }

  const nodeIds = new Set(nodes.map((node, index) => resolveNodeId(node, index, "@")));
  return entries.map((entry) => ({
    id: entry.id,
    type: "dialogues",
    title: entry.label,
    subtitle: entry.node
      ? nodeIds.has(entry.node)
        ? `node: ${entry.node}`
        : `missing node: ${entry.node}`
      : "node 미지정"
  }));
}

function getChoiceMoveToLocationId(choice: ResourceRecord) {
  return normalizeSingleId(
    choice.move_to
      ?? choice.move_location
      ?? choice.travel_to
      ?? choice.to_location
      ?? choice.destination_location
      ?? choice.place_id
      ?? choice.location_id
  );
}

function withChoiceMoveToLocation(choice: ResourceRecord, value: string): ResourceRecord {
  const next = { ...choice };
  const cleanValue = value.trim();
  delete next.move_location;
  delete next.travel_to;
  delete next.to_location;
  delete next.destination_location;
  delete next.place_id;
  delete next.location_id;
  if (cleanValue) next.move_to = cleanValue;
  else delete next.move_to;
  return next;
}

type ChoicePresentKind = "item" | "character";
type ChoicePresentTarget = { kind: ChoicePresentKind | ""; id: string };

function getChoicePresentTarget(choice: ResourceRecord): ChoicePresentTarget {
  const direct = choice.present ?? choice.presentation ?? choice.present_target;
  if (direct && typeof direct === "object" && !Array.isArray(direct)) {
    const record = direct as ResourceRecord;
    const kind = normalizeChoicePresentKind(record.kind ?? record.type ?? record.target_type);
    const id = normalizeSingleId(record.target_id ?? record.id ?? record.target);
    if (kind && id) return { kind, id };
  } else if (typeof direct === "string") {
    const id = normalizeSingleId(direct);
    if (id) return { kind: "item", id };
  }

  const itemId = normalizeSingleId(
    choice.present_item
      ?? choice.present_item_id
      ?? choice.present_evidence
      ?? choice.present_evidence_id
      ?? choice.evidence_id
      ?? choice.clue_id
  );
  if (itemId) return { kind: "item", id: itemId };

  const characterId = normalizeSingleId(
    choice.present_character
      ?? choice.present_character_id
      ?? choice.present_profile
      ?? choice.present_profile_id
  );
  if (characterId) return { kind: "character", id: characterId };

  const kind = normalizeChoicePresentKind(choice.present_kind ?? choice.presentation_kind);
  const id = normalizeSingleId(choice.present_id ?? choice.presentation_id);
  return kind && id ? { kind, id } : { kind: "", id: "" };
}

function normalizeChoicePresentKind(value: unknown): ChoicePresentKind | "" {
  const kind = normalizeSingleId(value).toLowerCase();
  if (["item", "evidence", "clue", "자료"].includes(kind)) return "item";
  if (["character", "person", "profile", "인물"].includes(kind)) return "character";
  return "";
}

function withChoicePresentTarget(choice: ResourceRecord, kind: ChoicePresentKind | "", value: string): ResourceRecord {
  const next = stripChoicePresentTargetFields(choice);
  const id = normalizeSingleId(value);
  if (!kind || !id) return next;
  if (kind === "item") next.present_item = id;
  else next.present_character = id;
  return next;
}

function stripChoicePresentTargetFields(choice: ResourceRecord): ResourceRecord {
  const next = { ...choice };
  delete next.present;
  delete next.presentation;
  delete next.present_target;
  delete next.present_item;
  delete next.present_item_id;
  delete next.present_evidence;
  delete next.present_evidence_id;
  delete next.evidence_id;
  delete next.clue_id;
  delete next.present_character;
  delete next.present_character_id;
  delete next.present_profile;
  delete next.present_profile_id;
  delete next.present_kind;
  delete next.presentation_kind;
  delete next.present_id;
  delete next.presentation_id;
  return next;
}

type DialogueMapLocationEntry = {
  id: string;
  label: string;
  node: string;
  position: PointerPoint;
  missingNode: boolean;
};

function InvestigationMapEditor({
  locations,
  map,
  nodes,
  onLocationsChange,
  onMapChange
}: {
  locations: unknown;
  map: unknown;
  nodes: ResourceRecord[];
  onLocationsChange: (value: ResourceRecord[]) => void;
  onMapChange: (value: ResourceRecord) => void;
}) {
  const entries = useMemo(() => buildDialogueMapLocationEntries(locations, nodes), [locations, nodes]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (entries.length === 0) {
      if (selectedId) setSelectedId("");
      return;
    }
    if (!entries.some((entry) => entry.id === selectedId)) {
      setSelectedId(entries[0].id);
    }
  }, [entries, selectedId]);

  const selected = entries.find((entry) => entry.id === selectedId) || entries[0];
  const imagePath = getInvestigationMapImagePath(map);
  const imageUrl = resPathToAssetUrl(imagePath);

  function updateSelectedPosition(x: number, y: number) {
    if (!selected) return;
    onLocationsChange(withDialogueLocationPinPosition(locations, selected.id, x, y));
  }

  function handleStageClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (!selected) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    updateSelectedPosition(
      roundForInput(clampNumber((event.clientX - rect.left) / rect.width, 0, 0, 1)),
      roundForInput(clampNumber((event.clientY - rect.top) / rect.height, 0, 0, 1))
    );
  }

  return (
    <section className="investigation-map-editor wide">
      <div className="section-heading">
        <h3>MAP</h3>
        <span>{entries.length} pins</span>
      </div>
      <TextField label="map.image" value={imagePath} onChange={(value) => onMapChange(withInvestigationMapImage(map, value))} />
      <div
        className={`investigation-map-stage ${imageUrl ? "has-image" : ""}`}
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
        onClick={handleStageClick}
      >
        <svg aria-hidden="true" className="investigation-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          {entries.flatMap((source, sourceIndex) => entries.slice(sourceIndex + 1).map((target) => (
            <line
              key={`${source.id}-${target.id}`}
              x1={source.position.x * 100}
              x2={target.position.x * 100}
              y1={source.position.y * 100}
              y2={target.position.y * 100}
            />
          )))}
        </svg>
        {entries.length === 0 && <span className="investigation-map-empty">locations를 먼저 추가하세요.</span>}
        {entries.map((entry) => (
          <button
            key={entry.id}
            className={`investigation-map-pin ${entry.id === selected?.id ? "selected" : ""}`}
            style={getInvestigationMapPinStyle(entry.position)}
            title={`${entry.label}${entry.missingNode ? " · missing node" : ""}`}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedId(entry.id);
            }}
          />
        ))}
        {entries.map((entry) => (
          <span key={`${entry.id}-label`} className="investigation-map-pin-label" style={getInvestigationMapPinLabelStyle(entry.position)}>
            {entry.label}
          </span>
        ))}
      </div>
      {selected && (
        <div className="investigation-map-pin-controls">
          <div className="investigation-map-selected">
            <strong>{selected.label}</strong>
            <code>{selected.node || "node 미지정"}</code>
          </div>
          <NumberField label="Pin X" min={0} max={1} step={0.01} value={selected.position.x} onChange={(value) => updateSelectedPosition(value, selected.position.y)} />
          <NumberField label="Pin Y" min={0} max={1} step={0.01} value={selected.position.y} onChange={(value) => updateSelectedPosition(selected.position.x, value)} />
        </div>
      )}
    </section>
  );
}

function buildDialogueMapLocationEntries(value: unknown, nodes: ResourceRecord[]): DialogueMapLocationEntry[] {
  const records = normalizeDialogueLocationEditorRecords(value);
  const nodeIds = new Set(nodes.map((node, index) => resolveNodeId(node, index, "@")));
  return records.map((record, index) => {
    const id = getDialogueLocationId(record, `location_${index + 1}`);
    const node = getDialogueLocationNodeId(record);
    return {
      id,
      label: getDialogueLocationLabel(record, id),
      node,
      position: getDialogueLocationPinPosition(record, index, records.length),
      missingNode: Boolean(node) && !nodeIds.has(node)
    };
  });
}

function normalizeDialogueLocationEditorRecords(value: unknown): ResourceRecord[] {
  const records: ResourceRecord[] = [];
  const appendRecord = (idValue: unknown, locationValue: unknown) => {
    const id = normalizeSingleId(idValue);
    if (!id) return;
    if (typeof locationValue === "string") {
      records.push({ id, node: locationValue.trim() });
      return;
    }
    const record = normalizeJsonObject(locationValue);
    records.push({ ...record, id: getDialogueLocationId(record, id) });
  };

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return;
      const record = normalizeJsonObject(entry);
      appendRecord(record.id ?? record.location_id ?? record.place_id ?? record.key ?? `location_${index + 1}`, record);
    });
  } else if (value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([id, entry]) => appendRecord(id, entry));
  }
  return records;
}

function getDialogueLocationId(location: ResourceRecord, fallback = "") {
  return normalizeSingleId(location.id ?? location.location_id ?? location.place_id ?? location.key) || fallback;
}

function getDialogueLocationLabel(location: ResourceRecord, fallback: string) {
  return normalizeSingleId(location.label ?? location.name ?? location.title) || fallback;
}

function getDialogueLocationNodeId(location: ResourceRecord) {
  return normalizeSingleId(location.node ?? location.node_id ?? location.start_node ?? location.start ?? location.target ?? location.next);
}

function getDialogueLocationPinPosition(location: ResourceRecord, index: number, count: number): PointerPoint {
  for (const key of ["position", "pin", "map_position", "point", "coords"]) {
    const point = readNormalizedMapPoint(location[key]);
    if (point) return point;
  }
  const fieldPoint = readNormalizedMapPoint(location);
  if (fieldPoint) return fieldPoint;
  const safeCount = Math.max(1, count);
  const angle = -Math.PI * 0.5 + Math.PI * 2 * index / safeCount;
  return {
    x: roundForInput(clampNumber(0.5 + Math.cos(angle) * 0.32, 0.5, 0.12, 0.88)),
    y: roundForInput(clampNumber(0.5 + Math.sin(angle) * 0.26, 0.5, 0.16, 0.84))
  };
}

function readNormalizedMapPoint(value: unknown): PointerPoint | null {
  if (Array.isArray(value) && value.length >= 2) {
    return {
      x: roundForInput(clamp01Number(value[0], 0.5)),
      y: roundForInput(clamp01Number(value[1], 0.5))
    };
  }
  if (value && typeof value === "object") {
    const record = value as ResourceRecord;
    const hasX = Object.prototype.hasOwnProperty.call(record, "x") || Object.prototype.hasOwnProperty.call(record, "left");
    const hasY = Object.prototype.hasOwnProperty.call(record, "y") || Object.prototype.hasOwnProperty.call(record, "top");
    if (hasX && hasY) {
      return {
        x: roundForInput(clamp01Number(record.x ?? record.left, 0.5)),
        y: roundForInput(clamp01Number(record.y ?? record.top, 0.5))
      };
    }
  }
  return null;
}

function withDialogueLocationPinPosition(value: unknown, id: string, x: number, y: number): ResourceRecord[] {
  const cleanId = normalizeSingleId(id);
  const records = normalizeDialogueLocationEditorRecords(value);
  const next = records.map((record) => {
    if (getDialogueLocationId(record) !== cleanId) return record;
    return {
      ...record,
      position: [roundForInput(clamp01Number(x, 0.5)), roundForInput(clamp01Number(y, 0.5))]
    };
  });
  if (cleanId && !next.some((record) => getDialogueLocationId(record) === cleanId)) {
    next.push({ id: cleanId, position: [roundForInput(clamp01Number(x, 0.5)), roundForInput(clamp01Number(y, 0.5))] });
  }
  return next;
}

function getInvestigationMapImagePath(value: unknown) {
  if (typeof value === "string") return value.trim();
  const record = normalizeJsonObject(value);
  return normalizeSingleId(record.image ?? record.path ?? record.background ?? record.map_image);
}

function withInvestigationMapImage(value: unknown, imagePath: string): ResourceRecord {
  const next = normalizeJsonObject(value);
  const cleanPath = imagePath.trim();
  if (cleanPath) next.image = cleanPath;
  else delete next.image;
  return next;
}

function getInvestigationMapPinStyle(position: PointerPoint): CSSProperties {
  return {
    left: `${clamp01Number(position.x, 0.5) * 100}%`,
    top: `${clamp01Number(position.y, 0.5) * 100}%`
  };
}

function getInvestigationMapPinLabelStyle(position: PointerPoint): CSSProperties {
  return {
    left: `${clamp01Number(position.x, 0.5) * 100}%`,
    top: `${clamp01Number(position.y, 0.5) * 100}%`
  };
}

function ChoiceProgressionTools({
  choice,
  references,
  nodeOptions,
  onAddCondition,
  onSetFlag
}: {
  choice: ResourceRecord;
  references: ReferenceResources;
  nodeOptions: ResourceSummary[];
  onAddCondition: (condition: ResourceRecord) => void;
  onSetFlag: (key: string, value: unknown) => void;
}) {
  const [conditionKind, setConditionKind] = useState<ChoiceConditionKind>("item");
  const [conditionTarget, setConditionTarget] = useState("");
  const [conditionFlagValue, setConditionFlagValue] = useState("true");
  const [flagKey, setFlagKey] = useState("");
  const [flagValue, setFlagValue] = useState("true");
  const conditionTargetOptions = getChoiceConditionTargetOptions(conditionKind, references, nodeOptions);
  const usesSelectTarget = conditionTargetOptions.length > 0;
  const conditionCount = asArray(choice.conditions).length;
  const flagCount = Object.keys(normalizeJsonObject(choice.set_flags)).length;
  const canAddCondition = conditionTarget.trim().length > 0;
  const canSetFlag = flagKey.trim().length > 0;

  function addCondition() {
    if (!canAddCondition) return;
    onAddCondition(buildChoiceConditionRecord(conditionKind, conditionTarget, parseStoryFlagEditorValue(conditionFlagValue)));
    setConditionTarget("");
  }

  function setFlag() {
    if (!canSetFlag) return;
    onSetFlag(flagKey, parseStoryFlagEditorValue(flagValue));
    setFlagKey("");
  }

  return (
    <section className="choice-progression-tools">
      <div className="choice-progression-header">
        <strong><Icon name="Rule" />진행 조건</strong>
        <span>조건 {conditionCount}개 · 플래그 {flagCount}개</span>
      </div>
      <div className="choice-progression-grid">
        <SelectLiteralField
          label="조건"
          value={conditionKind}
          options={choiceConditionKinds}
          labels={choiceConditionKindLabels}
          onChange={(value) => {
            setConditionKind(value as ChoiceConditionKind);
            setConditionTarget("");
          }}
        />
        {usesSelectTarget ? (
          <SelectField label="대상" value={conditionTarget} options={conditionTargetOptions} onChange={setConditionTarget} />
        ) : (
          <TextField label={conditionKind === "flag" ? "Flag key" : "Topic ID"} value={conditionTarget} onChange={setConditionTarget} />
        )}
        {conditionKind === "flag" && (
          <TextField label="값" value={conditionFlagValue} onChange={setConditionFlagValue} />
        )}
        <div className="choice-progression-actions">
          <button type="button" disabled={!canAddCondition} onClick={addCondition}>
            <Icon name="AddTask" />조건 추가
          </button>
        </div>
      </div>
      <div className="choice-progression-grid flag-grid">
        <TextField label="Set flag" value={flagKey} onChange={setFlagKey} />
        <TextField label="값" value={flagValue} onChange={setFlagValue} />
        <div className="choice-progression-actions">
          <button type="button" disabled={!canSetFlag} onClick={setFlag}>
            <Icon name="OutlinedFlag" />플래그 설정
          </button>
        </div>
      </div>
    </section>
  );
}

function getChoiceConditionTargetOptions(kind: ChoiceConditionKind, references: ReferenceResources, nodeOptions: ResourceSummary[]) {
  if (kind === "item") return references.items;
  if (kind === "character") return references.characters;
  if (kind === "node_seen") return nodeOptions;
  if (kind === "dialogue_seen") return references.dialogues;
  return [];
}

function buildChoiceConditionRecord(kind: ChoiceConditionKind, target: string, flagValue: unknown): ResourceRecord {
  const cleanTarget = target.trim();
  if (kind === "flag") return { kind: "flag", key: cleanTarget, value: flagValue };
  if (kind === "item") return { kind: "item", id: cleanTarget };
  if (kind === "character") return { kind: "character", id: cleanTarget };
  if (kind === "topic_heard") return { kind: "topic_heard", topic_id: cleanTarget };
  if (kind === "topic_unheard") return { kind: "topic_unheard", topic_id: cleanTarget };
  if (kind === "node_seen") return { kind: "node_seen", node_id: cleanTarget };
  if (kind === "dialogue_seen") return { kind: "dialogue_seen", dialogue_id: cleanTarget };
  return { kind, id: cleanTarget };
}

function parseStoryFlagEditorValue(value: unknown): unknown {
  const text = String(value ?? "").trim();
  if (text === "") return true;
  const lowered = text.toLowerCase();
  if (["true", "yes", "on"].includes(lowered)) return true;
  if (["false", "no", "off"].includes(lowered)) return false;
  if (lowered === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  return text;
}

function getChoiceTopicIdEditorValue(choice: ResourceRecord) {
  return String(choice.topic_id ?? choice.choice_id ?? choice.id ?? "").trim();
}

function withChoiceTopicId(choice: ResourceRecord, value: string): ResourceRecord {
  const next = { ...choice };
  const cleanValue = value.trim();
  if (cleanValue) next.topic_id = cleanValue;
  else delete next.topic_id;
  return next;
}

function getChoiceTrackHeard(choice: ResourceRecord) {
  return choice.track_heard !== false && choice.track_topic !== false;
}

function withChoiceTrackHeard(choice: ResourceRecord, checked: boolean): ResourceRecord {
  const next = { ...choice };
  delete next.track_topic;
  if (checked) delete next.track_heard;
  else next.track_heard = false;
  return next;
}

function getChoiceShowHeardCheck(choice: ResourceRecord) {
  return choice.show_heard_check !== false && choice.show_check !== false;
}

function withChoiceShowHeardCheck(choice: ResourceRecord, checked: boolean): ResourceRecord {
  const next = { ...choice };
  delete next.show_check;
  if (checked) delete next.show_heard_check;
  else next.show_heard_check = false;
  return next;
}

function getChoiceExitTalk(choice: ResourceRecord) {
  return Boolean(choice.exit_talk ?? choice.talk_end ?? choice.end_talk);
}

function withChoiceExitTalk(choice: ResourceRecord, checked: boolean): ResourceRecord {
  const next = { ...choice };
  delete next.talk_end;
  delete next.end_talk;
  if (checked) next.exit_talk = true;
  else delete next.exit_talk;
  return next;
}

function withChoiceCondition(choice: ResourceRecord, condition: ResourceRecord): ResourceRecord {
  return {
    ...choice,
    conditions: [...asArray(choice.conditions), condition]
  };
}

function withChoiceSetFlag(choice: ResourceRecord, key: string, value: unknown): ResourceRecord {
  const cleanKey = key.trim();
  if (!cleanKey) return choice;
  return {
    ...choice,
    set_flags: {
      ...normalizeJsonObject(choice.set_flags),
      [cleanKey]: value
    }
  };
}

function ChoiceJsonField({
  label,
  value,
  expected,
  onChange
}: {
  label: string;
  value: unknown;
  expected: "object" | "array" | "object_or_array";
  onChange: (value: ResourceRecord | unknown[]) => void;
}) {
  const normalized = expected === "array"
    ? asArray(value)
    : expected === "object_or_array"
      ? Array.isArray(value) || (value && typeof value === "object")
        ? value
        : []
      : normalizeJsonObject(value);
  const serialized = JSON.stringify(normalized, null, 2);
  const [text, setText] = useState(serialized);
  const [error, setError] = useState("");

  useEffect(() => {
    setText(serialized);
    setError("");
  }, [serialized]);

  function commit(nextText = text) {
    try {
      const parsed = JSON.parse(nextText || (expected === "array" ? "[]" : "{}"));
      if (expected === "array" && !Array.isArray(parsed)) {
        setError("배열 JSON이어야 합니다.");
        return;
      }
      if (expected === "object_or_array" && (!parsed || typeof parsed !== "object")) {
        setError("배열 또는 객체 JSON이어야 합니다.");
        return;
      }
      if (expected === "object" && (!parsed || typeof parsed !== "object" || Array.isArray(parsed))) {
        setError("객체 JSON이어야 합니다.");
        return;
      }
      setError("");
      onChange(parsed as ResourceRecord | unknown[]);
    } catch (error) {
      setError((error as Error).message);
    }
  }

  return (
    <label className="field-block choice-json-field wide">
      <span>{label}</span>
      <textarea
        className={error ? "invalid" : ""}
        onBlur={() => commit()}
        onChange={(event) => {
          setText(event.target.value);
          if (error) setError("");
        }}
        spellCheck={false}
        value={text}
      />
      <button type="button" onClick={() => commit()}>JSON 적용</button>
      {error && <p className="json-error">{error}</p>}
    </label>
  );
}

function ChoiceLayoutPreview({ choices, node }: { choices: ResourceRecord[]; node: ResourceRecord }) {
  const layout = getChoicePreviewLayout(node, choices.length);
  const speakerText = layout.hasSpeakerAnchor ? `${layout.speakerPosition} · ${layout.characterSide}` : "narrator";

  return (
    <section className={`choice-layout-preview-react column-${layout.columnSide}`}>
      <div className="choice-layout-stage">
        <div className="choice-layout-playfield">
          <div className="choice-layout-anchor" style={getChoicePreviewAnchorStyle(layout)}>
            {speakerText}
          </div>
          {choices.map((choice, index) => (
            <div className="choice-layout-button" key={index} style={getChoicePreviewButtonStyle(layout.slots[index], layout.buttonSize, layout.speakerScale)}>
              {choice.label ? <span>{getDialogueVisiblePreviewText(choice.label).slice(0, 24)}</span> : null}
              <b>{getDialogueVisiblePreviewText(choice.text).slice(0, 34) || `선택지 ${index + 1}`}</b>
            </div>
          ))}
        </div>
        <div className="choice-layout-dialogue-panel">
          <strong>{layout.speakerId && layout.speakerId !== "narrator" ? layout.speakerId : ""}</strong>
          <span>{getDialogueVisiblePreviewText(node.text).slice(0, 68) || "대사 미리보기..."}</span>
        </div>
      </div>
      <code>{layout.columnSide === "left" ? "왼쪽 선택지 열" : layout.columnSide === "right" ? "오른쪽 선택지 열" : "중앙 선택지 열"} · {choices.length}개 · anchor {formatNumberInput(layout.anchorX)}, {formatNumberInput(layout.anchorY)}</code>
    </section>
  );
}

function getChoicePreviewLayout(node: ResourceRecord, choiceCount: number) {
  const speakerId = String(node.speaker || "");
  const speakerLayout = getChoicePreviewSpeakerLayout(node, speakerId);
  const hasSpeakerAnchor = hasChoicePreviewCharacterAnchor(speakerId);
  const speakerScale = hasSpeakerAnchor ? getChoicePreviewSpeakerScale(speakerLayout.zoom) : 1;
  const buttonSize = getChoicePreviewButtonSize(speakerScale, choiceCount);
  const characterSide = getChoicePreviewCharacterSide(speakerLayout.anchorX);
  const columnSide = getChoicePreviewColumnSide(characterSide, buttonSize, speakerLayout, speakerId);
  return {
    ...speakerLayout,
    speakerId,
    hasSpeakerAnchor,
    speakerScale,
    buttonSize,
    characterSide,
    columnSide,
    slots: resolveChoicePreviewSlots(choiceCount, buttonSize, speakerLayout, speakerId)
  };
}

function getChoicePreviewSpeakerLayout(node: ResourceRecord, speakerId: string) {
  const stageCast = node.stage_cast && typeof node.stage_cast === "object" ? node.stage_cast as Record<string, ResourceRecord> : {};
  const speakerCast = speakerId && stageCast[speakerId] && typeof stageCast[speakerId] === "object" ? stageCast[speakerId] : {};
  const position = normalizeCastPosition(speakerCast.portrait_position ?? speakerCast.position ?? "center");
  const offset = getStageCastRecordLayoutOffset(speakerId, speakerCast, stageCast);
  const zoom = snapPortraitZoomPercent(speakerCast.portrait_zoom ?? portraitZoomDefault);
  const anchor = getPortraitAnchorRatios(zoom);
  return {
    speakerPosition: position,
    offset,
    zoom,
    anchorX: gameCharacterLayerWidth * anchor.x + offset.x * gameCharacterLayerWidth,
    anchorY: gameCharacterLayerHeight * anchor.y + offset.y * gameCharacterLayerHeight
  };
}

function hasChoicePreviewCharacterAnchor(speakerId: string) {
  return Boolean(speakerId && speakerId !== "narrator");
}

function getChoicePreviewSpeakerScale(zoom = portraitZoomDefault) {
  const zoomScale = (Number(zoom) || portraitZoomDefault) / portraitZoomDefault;
  return clampNumber(1 + (zoomScale - 1) * choicePreviewSpeakerScaleBlend, choicePreviewSpeakerScaleMin, choicePreviewSpeakerScaleMax, 1);
}

function getChoicePreviewButtonSize(speakerScale = 1, choiceCount = 1) {
  const resolutionScale = getChoicePreviewResolutionScale();
  const widthScale = speakerScale * resolutionScale;
  const availableWidth = Math.max(1, gameCharacterLayerWidth - choicePreviewMarginX * 2);
  const availableHeight = Math.max(1, gameCharacterLayerHeight - choicePreviewMarginTop - choicePreviewMarginBottom);
  const minWidth = Math.min(choicePreviewPanelMinWidth * widthScale, availableWidth);
  const maxWidth = Math.max(minWidth, Math.min(choicePreviewPanelMaxWidth * widthScale, availableWidth));
  const targetWidth = Math.min(choicePreviewPanelWidth * widthScale, availableWidth);
  const count = Math.max(1, choiceCount);
  const maxHeight = Math.max(1, (availableHeight - Math.max(count - 1, 0) * choicePreviewGap) / count);
  return {
    w: Math.max(minWidth, Math.min(targetWidth, maxWidth)),
    h: Math.min(choicePreviewButtonHeight * speakerScale, maxHeight)
  };
}

function getChoicePreviewDialogueRange() {
  const width = Math.min(gameCharacterLayerWidth, 1600);
  const left = Math.max(0, (gameCharacterLayerWidth - width) * 0.5);
  return { left, right: left + width, width };
}

function getChoicePreviewResolutionScale() {
  const dialogueRange = getChoicePreviewDialogueRange();
  const widthScale = clampNumber(dialogueRange.width / 1600, choicePreviewDialogueWidthMinScale, 1, 1);
  const heightScale = clampNumber(gameCharacterLayerHeight / (gameReferenceHeight - gameDialoguePanelMinHeight - gameStageGapHeight), choicePreviewHeightMinScale, 1, 1);
  return Math.min(widthScale, heightScale);
}

function clampChoicePreviewSlot(point: PointerPoint, buttonSize: { w: number; h: number }) {
  return {
    x: Math.min(
      Math.max(point.x, choicePreviewMarginX),
      Math.max(choicePreviewMarginX, gameCharacterLayerWidth - choicePreviewMarginX - buttonSize.w)
    ),
    y: Math.min(
      Math.max(point.y, choicePreviewMarginTop),
      Math.max(choicePreviewMarginTop, gameCharacterLayerHeight - choicePreviewMarginBottom - buttonSize.h)
    )
  };
}

function getChoicePreviewCharacterSide(anchorX: number) {
  const ratio = anchorX / Math.max(gameCharacterLayerWidth, 1);
  if (ratio < 0.5 - choicePreviewCenterDeadzone) return "left";
  if (ratio > 0.5 + choicePreviewCenterDeadzone) return "right";
  return "center";
}

function getChoicePreviewCharacterEdgeX(columnSide: string, layout: { anchorX: number; zoom: number }) {
  const zoomScale = (Number(layout.zoom) || portraitZoomDefault) / portraitZoomDefault;
  const halfWidth = choicePreviewFaceReferenceHalfWidth * zoomScale;
  if (columnSide === "left") return layout.anchorX - halfWidth - choicePreviewCharacterEdgePaddingX;
  return layout.anchorX + halfWidth + choicePreviewCharacterEdgePaddingX;
}

function getChoicePreviewSideBoundaryX(columnSide: string) {
  const dialogueRange = getChoicePreviewDialogueRange();
  return columnSide === "left" ? dialogueRange.left : dialogueRange.right;
}

function getChoicePreviewAnchorGapBounds(zoom = portraitZoomDefault) {
  const zoomValue = clampNumber(zoom, portraitZoomMin, portraitZoomMax, portraitZoomDefault);
  const zoomT = (zoomValue - portraitZoomMin) / Math.max(1, portraitZoomMax - portraitZoomMin);
  const minGap = choicePreviewAnchorGapMinSmallX + (choicePreviewAnchorGapMinLargeX - choicePreviewAnchorGapMinSmallX) * zoomT;
  let maxGap = choicePreviewAnchorGapMaxSmallX + (choicePreviewAnchorGapMaxLargeX - choicePreviewAnchorGapMaxSmallX) * zoomT;
  if (maxGap < minGap) maxGap = minGap;
  return { min: minGap, max: maxGap };
}

function getChoicePreviewBoundaryCenterWeight(zoom = portraitZoomDefault) {
  const zoomValue = clampNumber(zoom, portraitZoomMin, portraitZoomMax, portraitZoomDefault);
  if (zoomValue <= portraitZoomDefault) {
    const t = (zoomValue - portraitZoomMin) / Math.max(1, portraitZoomDefault - portraitZoomMin);
    return choicePreviewBoundaryWeightSmall + (choicePreviewBoundaryWeightAtDefault - choicePreviewBoundaryWeightSmall) * t;
  }
  const t = (zoomValue - portraitZoomDefault) / Math.max(1, portraitZoomMax - portraitZoomDefault);
  return choicePreviewBoundaryWeightAtDefault + (choicePreviewBoundaryWeightLarge - choicePreviewBoundaryWeightAtDefault) * t;
}

function getChoicePreviewSideCapacity(columnSide: string, layout: { anchorX: number; zoom: number }) {
  const characterEdgeX = getChoicePreviewCharacterEdgeX(columnSide, layout);
  const boundaryX = getChoicePreviewSideBoundaryX(columnSide);
  const gap = getChoicePreviewAnchorGapBounds(layout.zoom);
  return columnSide === "left"
    ? characterEdgeX - gap.min - boundaryX
    : boundaryX - characterEdgeX - gap.min;
}

function getChoicePreviewColumnSide(characterSide: string, buttonSize: { w: number; h: number }, layout: { anchorX: number; zoom: number }, speakerId: string) {
  if (!hasChoicePreviewCharacterAnchor(speakerId)) return "center";
  const preferredSide = characterSide === "right" ? "left" : "right";
  const fallbackSide = preferredSide === "left" ? "right" : "left";
  const preferredCapacity = getChoicePreviewSideCapacity(preferredSide, layout);
  const fallbackCapacity = getChoicePreviewSideCapacity(fallbackSide, layout);
  const minWidth = Math.min(choicePreviewPanelMinWidth, buttonSize.w);
  if (preferredCapacity < minWidth && fallbackCapacity >= minWidth) return fallbackSide;
  return preferredSide;
}

function getChoicePreviewColumnX(columnSide: string, buttonSize: { w: number; h: number }, layout: { anchorX: number; zoom: number }) {
  if (columnSide === "center") {
    return clampChoicePreviewSlot({ x: gameCharacterLayerWidth * 0.5 - buttonSize.w * 0.5, y: 0 }, buttonSize).x;
  }
  const characterEdgeX = getChoicePreviewCharacterEdgeX(columnSide, layout);
  const boundaryX = getChoicePreviewSideBoundaryX(columnSide);
  const gap = getChoicePreviewAnchorGapBounds(layout.zoom);
  const targetCenterX = layout.anchorX + (boundaryX - layout.anchorX) * getChoicePreviewBoundaryCenterWeight(layout.zoom);
  let x = targetCenterX - buttonSize.w * 0.5;
  if (columnSide === "left") {
    const minX = Math.max(boundaryX, characterEdgeX - gap.max - buttonSize.w);
    const maxX = characterEdgeX - gap.min - buttonSize.w;
    x = Math.max(minX, Math.min(x, Math.max(minX, maxX)));
  } else {
    const minX = characterEdgeX + gap.min;
    const maxX = Math.min(boundaryX - buttonSize.w, characterEdgeX + gap.max);
    x = Math.max(minX, Math.min(x, Math.max(minX, maxX)));
  }
  return clampChoicePreviewSlot({ x, y: 0 }, buttonSize).x;
}

function buildChoicePreviewVerticalSlots(x: number, count: number, buttonSize: { w: number; h: number }, centerY = choicePreviewVerticalStackCenterY) {
  const totalHeight = count * buttonSize.h + Math.max(count - 1, 0) * choicePreviewGap;
  const minY = choicePreviewMarginTop;
  const maxY = Math.max(minY, gameCharacterLayerHeight - choicePreviewMarginBottom - totalHeight);
  const startY = Math.max(minY, Math.min(centerY - totalHeight * 0.5, maxY));
  return Array.from({ length: count }, (_, index) => clampChoicePreviewSlot({
    x,
    y: startY + index * (buttonSize.h + choicePreviewGap)
  }, buttonSize));
}

function resolveChoicePreviewSlots(count: number, buttonSize: { w: number; h: number }, layout: { anchorX: number; anchorY: number; zoom: number }, speakerId: string) {
  if (count <= 0) return [];
  const characterSide = getChoicePreviewCharacterSide(layout.anchorX);
  const columnSide = getChoicePreviewColumnSide(characterSide, buttonSize, layout, speakerId);
  const x = getChoicePreviewColumnX(columnSide, buttonSize, layout);
  const centerY = hasChoicePreviewCharacterAnchor(speakerId) ? layout.anchorY : choicePreviewVerticalStackCenterY;
  return buildChoicePreviewVerticalSlots(x, count, buttonSize, centerY);
}

function getChoicePreviewAnchorStyle(layout: ReturnType<typeof getChoicePreviewLayout>) {
  return {
    left: `${layout.anchorX / gameCharacterLayerWidth * 100}%`,
    top: `${layout.anchorY / gameCharacterLayerHeight * 100}%`,
    "--choice-speaker-scale": String(layout.speakerScale)
  } as CSSProperties;
}

function getChoicePreviewButtonStyle(slot: PointerPoint | undefined, buttonSize: { w: number; h: number }, speakerScale: number) {
  const safeSlot = slot || { x: gameCharacterLayerWidth * 0.5 - buttonSize.w * 0.5, y: choicePreviewVerticalStackCenterY };
  return {
    left: `${safeSlot.x / gameCharacterLayerWidth * 100}%`,
    top: `${safeSlot.y / gameCharacterLayerHeight * 100}%`,
    width: `${buttonSize.w / gameCharacterLayerWidth * 100}%`,
    aspectRatio: `${buttonSize.w} / ${buttonSize.h}`,
    "--choice-font-scale": String(speakerScale)
  } as CSSProperties;
}

function stageCastPositionLabels(ui: EditorCopy): Record<string, string> {
  return {
    far_left: ui.form.positionFarLeft,
    left: ui.form.positionLeft,
    center: ui.form.positionCenter,
    right: ui.form.positionRight,
    far_right: ui.form.positionFarRight,
    custom: ui.form.positionCustom
  };
}

function getStageCastPositionLabel(value: string, ui: EditorCopy) {
  return stageCastPositionLabels(ui)[value] || value;
}

function StageCastEditor({
  actualPreview,
  characters,
  nodes,
  selectedNodeIndex,
  speakerId,
  speakerMystery,
  focusTargets,
  stageCast,
  onFocusTargetsChange,
  onChange
}: {
  actualPreview?: StageCastActualPreviewContext;
  characters: ResourceSummary[];
  nodes: ResourceRecord[];
  selectedNodeIndex: number;
  speakerId: string;
  speakerMystery: boolean;
  focusTargets?: unknown;
  stageCast: unknown;
  onFocusTargetsChange?: (focusTargets: string[]) => void;
  onChange: (stageCast: Record<string, ResourceRecord>) => void;
}) {
  const ui = useUiText();
  const cast = stageCast && typeof stageCast === "object" ? stageCast as Record<string, ResourceRecord> : {};
  const entries = Object.entries(cast);
  const castIds = entries.map(([characterId]) => characterId);
  const focusTargetIds = getNodeFocusTargets({ focus_targets: focusTargets });
  const focusTargetOptions = characters.filter((character) => castIds.includes(character.id) || focusTargetIds.includes(character.id));
  const stageCastCharacterOptions = characters.filter((character) => !character.isProtagonist);
  const [characterDetails, setCharacterDetails] = useState<Record<string, ResourceRecord>>({});
  const [selectedCastId, setSelectedCastId] = useState("");
  const editorRef = useRef<HTMLDivElement | null>(null);
  const castIdsKey = [...castIds].sort((a, b) => a.localeCompare(b)).join("|");

  useEffect(() => {
    const ids = castIds.filter((characterId) => characterId && characterId !== "mystery" && !characterDetails[characterId]);
    if (ids.length === 0) return undefined;

    let cancelled = false;
    void Promise.all(ids.map(async (characterId) => {
      try {
        const result = await loadResource("characters", characterId);
        return [characterId, result.data] as const;
      } catch {
        return [characterId, null] as const;
      }
    })).then((loaded) => {
      if (cancelled) return;
      setCharacterDetails((previous) => {
        const next = { ...previous };
        for (const [characterId, data] of loaded) {
          if (data) next[characterId] = data;
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [castIdsKey, characterDetails]);

  useEffect(() => {
    if (selectedCastId && !cast[selectedCastId]) setSelectedCastId("");
  }, [cast, selectedCastId]);

  function emitStageCastChange(nextCast: Record<string, ResourceRecord>) {
    onChange(removeProtagonistStageCastEntries(nextCast, characters).stageCast);
  }

  function updateCast(characterId: string, patch: ResourceRecord) {
    emitStageCastChange({ ...cast, [characterId]: { ...(cast[characterId] || {}), ...patch } });
  }

  function removeCast(characterId: string) {
    const next = { ...cast };
    delete next[characterId];
    emitStageCastChange(next);
    if (selectedCastId === characterId) setSelectedCastId("");
  }

  function addCast(characterId: string) {
    if (!characterId || cast[characterId] || characterIsProtagonist(characterId, characters)) return;
    const isSpeaker = characterId === speakerId;
    const inherited = buildInheritedStageCastEntry(nodes, selectedNodeIndex, characterId);
    emitStageCastChange({
      ...cast,
      [characterId]: fillStageCastDefaults(
        inherited && typeof inherited === "object" ? inherited : {},
        isSpeaker && speakerMystery,
        stageCastAnimationOrderDefault
      )
    });
    setSelectedCastId(characterId);
  }

  function toggleFocusTarget(characterId: string) {
    if (!onFocusTargetsChange) return;
    const cleanId = normalizeTimelineCharacterId(characterId);
    if (!cleanId) return;
    onFocusTargetsChange(
      focusTargetIds.includes(cleanId)
        ? focusTargetIds.filter((id) => id !== cleanId)
        : [...focusTargetIds, cleanId]
    );
  }

  function updatePosition(characterId: string, value: string) {
    const position = normalizeCastPosition(value);
    const previousOffset = parseCastOffset(cast[characterId]?.portrait_offset);
    updateCast(characterId, {
      portrait_position: position,
      portrait_offset: position === "custom" ? [previousOffset.x, previousOffset.y] : null
    });
  }

  const stageEntries = entries.map(([characterId, value], index) => {
    const character = characterDetails[characterId];
    const inherited = findPreviousCastEntry(nodes, selectedNodeIndex, characterId);
    return {
      characterId,
      character,
      index,
      inherited,
      isSpeaker: characterId === speakerId,
      isFocused: focusTargetIds.includes(characterId),
      label: characterLabel(characterId, character, characters),
      portrait: resolveCastPortrait(character, value.portrait),
      position: normalizeCastPosition(value.portrait_position ?? value.position),
      offset: parseCastOffset(value.portrait_offset),
      positionOrder: normalizeNumber(value.portrait_position_order ?? value.position_order, index + 1, 1),
      animationOrder: normalizeNumber(value.animation_order ?? value.order, stageCastAnimationOrderDefault, 1),
      animationSpeed: normalizeNumber(value.animation_speed, stageCastDefaultAnimationSpeed, 0.5, 2),
      portraitOpacity: normalizeNumber(value.portrait_opacity ?? value.opacity, stageCastDefaultOpacity, 0, 1),
      portraitZoom: normalizeNumber(value.portrait_zoom, portraitZoomDefault, 100, 500),
      live2dEnabled: characterHasLive2dRig(character),
      live2dAngle: normalizeNumber(value.live2d_angle ?? value.view_angle ?? value.angle, 0, -45, 45),
      flipH: normalizeBooleanFlag(value.portrait_flip_h ?? value.flip_h ?? value.flip_x),
      mystery: normalizeBooleanFlag(value.mystery ?? value.portrait_mystery, characterId === speakerId && speakerMystery)
    };
  });

  return (
    <div className="stage-cast-editor" ref={editorRef}>
      <div className="structured-header">
        <span>{ui.form.stageCast}</span>
        <select value="" onChange={(event) => addCast(event.target.value)}>
          <option value="">{ui.form.addCharacter}</option>
          <option value="mystery">{ui.form.mystery}</option>
          {stageCastCharacterOptions.map((character) => <option key={character.id} value={character.id}>{character.title}</option>)}
        </select>
      </div>
      {onFocusTargetsChange && (
        <CheckboxList
          label={ui.form.focusTargets}
          values={focusTargetIds}
          options={focusTargetOptions}
          onToggle={toggleFocusTarget}
        />
      )}
      {entries.length === 0 && <p className="empty-state">{ui.form.noStageCast}</p>}
      {stageEntries.length > 0 && (
        <StageCastScenePreview
          actualPreview={actualPreview}
          entries={stageEntries}
          onMoveCustomOffset={(characterId, offset) => updateCast(characterId, { portrait_offset: [offset.x, offset.y] })}
          selectedCastId={selectedCastId}
        />
      )}
      {stageEntries.map((entry) => {
        const value = cast[entry.characterId] || {};
        const portraitOptions = portraitKeys(entry.character);
        const isCustomPosition = entry.position === "custom";
        return (
          <article
            className={`stage-cast-row ${selectedCastId === entry.characterId ? "active" : ""}`}
            data-stage-cast-target={entry.characterId}
            key={entry.characterId}
          >
            <div className="stage-cast-identity">
              <CastPortraitPreview entry={entry} />
              <div>
                <strong>{entry.label}</strong>
                <code title={entry.characterId}>{shortId(entry.characterId)}</code>
                <div className="stage-cast-badges">
                  {entry.isSpeaker && <span>화자</span>}
                  {entry.isFocused && <span>주목</span>}
                  {entry.inherited && <span>{entry.inherited.index + 1}번 상속</span>}
                  {entry.mystery && <span>수수께끼</span>}
                </div>
              </div>
            </div>
            {portraitOptions.length > 0 ? (
              <label className="field-block">
                <span>{ui.form.portrait}</span>
                <select value={String(value.portrait || "")} onChange={(event) => updateCast(entry.characterId, { portrait: event.target.value })}>
                  <option value="">{ui.common.unspecified}</option>
                  {portraitOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            ) : (
              <TextField label={ui.form.portrait} value={value.portrait || ""} onChange={(next) => updateCast(entry.characterId, { portrait: next })} />
            )}
            {entry.live2dEnabled && (
              <NumberField
                label={ui.form.live2dAngle}
                value={entry.live2dAngle}
                min={-45}
                max={45}
                step={5}
                resetValue={0}
                onChange={(next) => updateCast(entry.characterId, { live2d_angle: next })}
              />
            )}
            <SelectLiteralField
              label={ui.form.position}
              value={entry.position}
              options={[...stageCastPositionOptions]}
              labels={stageCastPositionLabels(ui)}
              onChange={(next) => updatePosition(entry.characterId, next)}
            />
            {isCustomPosition && (
              <>
                <NumberField
                  label={ui.form.offsetX}
                  value={entry.offset.x}
                  step={0.01}
                  resetValue={0}
                  onChange={(next) => updateCast(entry.characterId, { portrait_offset: [next, entry.offset.y] })}
                />
                <NumberField
                  label={ui.form.offsetY}
                  value={entry.offset.y}
                  step={0.01}
                  resetValue={0}
                  onChange={(next) => updateCast(entry.characterId, { portrait_offset: [entry.offset.x, next] })}
                />
              </>
            )}
            <NumberField label={ui.form.positionOrder} value={entry.positionOrder} min={1} step={1} resetValue={entry.index + 1} onChange={(next) => updateCast(entry.characterId, { portrait_position_order: next })} />
            <NumberField label={ui.form.animationOrder} value={entry.animationOrder} min={1} step={1} resetValue={stageCastAnimationOrderDefault} onChange={(next) => updateCast(entry.characterId, { animation_order: next })} />
            <NumberField label={ui.form.zoom} value={entry.portraitZoom} min={100} max={500} step={50} resetValue={portraitZoomDefault} onChange={(next) => updateCast(entry.characterId, { portrait_zoom: next })} />
            <NumberField label={ui.form.opacity} value={entry.portraitOpacity} min={0} max={1} step={0.1} resetValue={stageCastDefaultOpacity} onChange={(next) => updateCast(entry.characterId, { portrait_opacity: next })} />
            <NumberField label={ui.form.animationSpeed} value={entry.animationSpeed} min={0.5} max={2} step={0.25} resetValue={stageCastDefaultAnimationSpeed} onChange={(next) => updateCast(entry.characterId, { animation_speed: next })} />
            <ToggleField label={ui.form.flipX} checked={entry.flipH} onChange={(checked) => updateCast(entry.characterId, { portrait_flip_h: checked })} />
            <ToggleField label={ui.form.mystery} checked={entry.mystery} onChange={(checked) => updateCast(entry.characterId, { mystery: checked })} />
            <button className="danger-action" type="button" onClick={() => removeCast(entry.characterId)}><Icon name="Delete" />{ui.common.delete}</button>
          </article>
        );
      })}
    </div>
  );
}

type StageCastPreviewEntry = {
  characterId: string;
  character: ResourceRecord | undefined;
  index: number;
  inherited: { index: number; entry: ResourceRecord } | null;
  isSpeaker: boolean;
  isFocused: boolean;
  label: string;
  portrait: { key: string; path: string; center: number[]; profile: ResourceRecord } | null;
  position: string;
  offset: { x: number; y: number };
  positionOrder: number;
  animationOrder: number;
  animationSpeed: number;
  portraitOpacity: number;
  portraitZoom: number;
  live2dEnabled: boolean;
  live2dAngle: number;
  flipH: boolean;
  mystery: boolean;
};
type StageCastSceneDrag = {
  pointerId: number;
  characterId: string;
  startX: number;
  startY: number;
  startOffset: PointerPoint;
};

function StageCastScenePreview({
  actualPreview,
  entries,
  onMoveCustomOffset,
  selectedCastId
}: {
  actualPreview?: StageCastActualPreviewContext;
  entries: StageCastPreviewEntry[];
  onMoveCustomOffset?: (characterId: string, offset: PointerPoint) => void;
  selectedCastId: string;
}) {
  const ui = useUiText();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<StageCastSceneDrag | null>(null);
  const actualPreviewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const pendingActualPreviewMessageRef = useRef<ResourceRecord | null>(null);
  const actualPreviewUrlRef = useRef("");
  const [imageSizes, setImageSizes] = useState<Record<string, { w: number; h: number }>>({});
  const [previewMode, setPreviewMode] = useState<PreviewMode>("web");
  const [actualPreviewUrl, setActualPreviewUrl] = useState("");
  const [actualPreviewOpenUrl, setActualPreviewOpenUrl] = useState("");
  const [actualPreviewStatus, setActualPreviewStatus] = useState("");
  const [actualPreviewBusy, setActualPreviewBusy] = useState(false);
  const [actualPreviewBusyKind, setActualPreviewBusyKind] = useState<"" | "prepare" | "build">("");
  const [actualPreviewLoadCover, setActualPreviewLoadCover] = useState(false);
  const [godotLaunchMenuOpen, setGodotLaunchMenuOpen] = useState(false);
  const dragLock = useMobileDragLock();
  const visibleEntries = entries
    .filter((entry) => entry.portrait?.path)
    .sort((a, b) => a.animationOrder === b.animationOrder ? a.index - b.index : a.animationOrder - b.animationOrder);
  const selectedEntry = selectedCastId ? visibleEntries.find((entry) => entry.characterId === selectedCastId) : null;
  const activeModeConfig = godotWebPreviewModes.find((entry) => entry.id === previewMode) || godotWebPreviewModes[0];
  const hasActualPreviewContext = Boolean(actualPreview?.dialogueId);
  const actualPreviewCoverMessage = actualPreviewBusyKind === "build"
    ? ui.preview.actualPreviewBuilding
    : actualPreviewStatus || ui.preview.actualPreviewPreparing;

  useEffect(() => {
    actualPreviewUrlRef.current = actualPreviewUrl;
  }, [actualPreviewUrl]);

  useEffect(() => {
    const handleReady = (event: MessageEvent) => {
      const data = event.data && typeof event.data === "object" ? event.data as ResourceRecord : {};
      if (data.type !== "blind-madeleine-editor-preview-ready") return;
      setActualPreviewLoadCover(false);
      setActualPreviewBusyKind("");
      setActualPreviewStatus(ui.preview.actualPreviewReady);
    };
    window.addEventListener("message", handleReady);
    return () => window.removeEventListener("message", handleReady);
  }, [ui.preview.actualPreviewReady]);

  useEffect(() => {
    if (!actualPreview) {
      setPreviewMode("web");
      setActualPreviewUrl("");
      setActualPreviewOpenUrl("");
    }
    setActualPreviewUrl("");
    setActualPreviewOpenUrl("");
    setActualPreviewStatus("");
    setActualPreviewBusyKind("");
    setActualPreviewLoadCover(false);
    setGodotLaunchMenuOpen(false);
  }, [actualPreview?.dialogueId]);

  useEffect(() => {
    setPreviewMode("web");
    setGodotLaunchMenuOpen(false);
  }, [actualPreview?.nodeId]);

  async function postBridge(endpoint: string, path: string, payload: ResourceRecord) {
    const response = await fetch(godotPreviewUrl(endpoint, path), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok) {
      throw new Error(bridgeErrorMessage(body, ui.preview.bridgeRequired));
    }
    return body as ResourceRecord;
  }

  function postActualPreviewMessage(message: ResourceRecord) {
    pendingActualPreviewMessageRef.current = message;
    const contentWindow = actualPreviewFrameRef.current?.contentWindow;
    if (!contentWindow) return;

    contentWindow.postMessage(message, "*");
    window.setTimeout(() => contentWindow.postMessage(message, "*"), 250);
    window.setTimeout(() => contentWindow.postMessage(message, "*"), 900);
  }

  function handleActualPreviewFrameLoad() {
    const pendingMessage = pendingActualPreviewMessageRef.current;
    if (pendingMessage) postActualPreviewMessage(pendingMessage);
    window.setTimeout(() => {
      setActualPreviewLoadCover(false);
      setActualPreviewBusyKind("");
    }, 4500);
  }

  async function prepareActualPreview(mode = previewMode, buildFirst = false) {
    const config = godotWebPreviewModes.find((entry) => entry.id === mode);
    const previewContext = actualPreview;
    if (!config || mode === "web") return;
    if (!previewContext || !hasActualPreviewContext) {
      setActualPreviewStatus(ui.preview.actualPreviewUnavailable);
      return;
    }

    setPreviewMode(mode);
    setActualPreviewBusy(true);
    setActualPreviewBusyKind(buildFirst ? "build" : "prepare");
    try {
      if (buildFirst) {
        setActualPreviewLoadCover(true);
        setActualPreviewStatus(ui.preview.actualPreviewBuilding);
        await postBridge(previewContext.bridgeEndpoint, "web-preview/build", { timeout_seconds: 300 });
      }
      setActualPreviewStatus(ui.preview.actualPreviewPreparing);
      const body = await postBridge(previewContext.bridgeEndpoint, "web-preview/prepare", {
        dialogue_id: previewContext.dialogueId,
        dialogue_json: JSON.stringify(previewContext.dialogueDraft, null, 2),
        node_id: previewContext.nodeId,
        device: config.device
      });
      const url = String(body.url || "");
      const nextUrl = resolveGodotPreviewBridgeUrl(previewContext.bridgeEndpoint, url);
      const rawPayloadUrl = String(body.payload_url || "");
      if (!rawPayloadUrl) throw new Error("Godot web preview payload URL is missing.");
      const payloadUrl = resolveGodotPreviewBridgeUrl(previewContext.bridgeEndpoint, rawPayloadUrl);
      const nextMessage = {
        type: "blind-madeleine-editor-preview",
        dialogueId: previewContext.dialogueId,
        nodeId: previewContext.nodeId,
        device: config.device,
        payloadUrl
      };
      setActualPreviewOpenUrl(nextUrl);
      if (!actualPreviewUrlRef.current || buildFirst) {
        pendingActualPreviewMessageRef.current = nextMessage;
        setActualPreviewLoadCover(true);
        setActualPreviewUrl(nextUrl);
      } else {
        postActualPreviewMessage(nextMessage);
        setActualPreviewLoadCover(false);
      }
      setActualPreviewStatus(ui.preview.actualPreviewReady);
    } catch (error) {
      const message = (error as Error).message;
      setActualPreviewStatus(message);
      setActualPreviewBusyKind("");
      setActualPreviewLoadCover(false);
      previewContext.notify(`${ui.preview.actualPreview}: ${message}`);
    } finally {
      setActualPreviewBusy(false);
      if (!buildFirst) setActualPreviewBusyKind("");
    }
  }

  function switchPreviewMode(mode: PreviewMode) {
    setPreviewMode(mode);
    if (mode !== "web") void prepareActualPreview(mode);
  }

  async function launchNativePreview(kind: "current" | "previous") {
    const previewContext = actualPreview;
    if (!previewContext || !hasActualPreviewContext) {
      setActualPreviewStatus(ui.preview.actualPreviewUnavailable);
      return;
    }
    const nodeId = kind === "previous" ? previewContext.previousNodeId : previewContext.nodeId;
    if (!nodeId) return;

    const label = kind === "previous" ? ui.preview.previousDialogue : ui.preview.currentDialogue;
    setActualPreviewBusy(true);
    try {
      const body = await postBridge(previewContext.bridgeEndpoint, "preview", {
        dialogue_id: previewContext.dialogueId,
        dialogue_file: `${previewContext.dialogueId}.json`,
        dialogue_json: JSON.stringify(previewContext.dialogueDraft, null, 2),
        node_id: nodeId
      });
      const pid = body.pid ? ` · PID ${String(body.pid)}` : "";
      setGodotLaunchMenuOpen(false);
      setActualPreviewStatus(`${ui.preview.godotRun}: ${label}`);
      previewContext.notify(`${ui.preview.godotRun}: ${label}${pid}`);
    } catch (error) {
      const message = (error as Error).message;
      setActualPreviewStatus(message);
      previewContext.notify(`${ui.preview.godotRun}: ${message}`);
    } finally {
      setActualPreviewBusy(false);
    }
  }

  function rememberImageSize(entry: StageCastPreviewEntry, event: SyntheticEvent<HTMLImageElement>) {
    const imageKey = stageCastImageKey(entry);
    const image = event.currentTarget;
    if (!imageKey || image.naturalWidth <= 0 || image.naturalHeight <= 0) return;
    setImageSizes((previous) => {
      const current = previous[imageKey];
      if (current?.w === image.naturalWidth && current.h === image.naturalHeight) return previous;
      return { ...previous, [imageKey]: { w: image.naturalWidth, h: image.naturalHeight } };
    });
  }

  function stagePoint(event: ReactPointerEvent<HTMLElement>) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: (event.clientX - rect.left) / rect.width * gameCharacterLayerWidth,
      y: (event.clientY - rect.top) / rect.height * gameCharacterLayerHeight
    };
  }

  function startCustomOffsetDrag(event: ReactPointerEvent<HTMLElement>, entry: StageCastPreviewEntry) {
    if (event.button !== 0 || entry.position !== "custom" || !onMoveCustomOffset) return;
    if (dragLock.locked) return;
    const point = stagePoint(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      characterId: entry.characterId,
      startX: point.x,
      startY: point.y,
      startOffset: entry.offset
    };
    event.preventDefault();
  }

  function moveCustomOffsetDrag(event: ReactPointerEvent<HTMLElement>) {
    if (dragLock.locked) return;
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !onMoveCustomOffset) return;
    const point = stagePoint(event);
    if (!point) return;
    onMoveCustomOffset(drag.characterId, {
      x: round4Number(drag.startOffset.x + (point.x - drag.startX) / gameCharacterLayerWidth),
      y: round4Number(drag.startOffset.y + (point.y - drag.startY) / gameCharacterLayerHeight)
    });
    event.preventDefault();
  }

  function stopCustomOffsetDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore release failures from interrupted pointer streams.
    }
  }

  function updateSelectedCustomOffset(nextX: number, nextY: number) {
    if (!selectedEntry || selectedEntry.position !== "custom" || !onMoveCustomOffset) return;
    onMoveCustomOffset(selectedEntry.characterId, {
      x: round4Number(clampNumber(nextX, -1, 1, selectedEntry.offset.x)),
      y: round4Number(clampNumber(nextY, -1, 1, selectedEntry.offset.y))
    });
  }

  return (
    <div className="stage-cast-preview-wrapper">
      {actualPreview && (
        <div className="stage-cast-preview-controls">
          <div className="preview-mode-bar stage-cast-preview-mode-bar" role="tablist" aria-label={ui.preview.actualPreview}>
            {godotWebPreviewModes.map((entry) => (
              <button
                aria-selected={previewMode === entry.id}
                className={previewMode === entry.id ? "active" : ""}
                key={entry.id}
                role="tab"
                type="button"
                onClick={() => switchPreviewMode(entry.id)}
              >
                {previewModeLabel(entry.id, ui)}
              </button>
            ))}
          </div>
          <div className="godot-launch-menu">
            <button
              aria-expanded={godotLaunchMenuOpen}
              className="godot-launch-trigger"
              disabled={actualPreviewBusy || !hasActualPreviewContext}
              type="button"
              onClick={() => setGodotLaunchMenuOpen((open) => !open)}
            >
              <Icon name="SmartToy" />
              {ui.preview.godotRun}
            </button>
            {godotLaunchMenuOpen && (
              <div className="godot-launch-options" role="menu">
                <button type="button" role="menuitem" onClick={() => void launchNativePreview("current")}>
                  {ui.preview.currentDialogue}
                </button>
                <button
                  disabled={!actualPreview.previousNodeId}
                  type="button"
                  role="menuitem"
                  onClick={() => void launchNativePreview("previous")}
                >
                  {ui.preview.previousDialogue}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {previewMode === "web" && (
        <div className="stage-cast-scene-preview">
          <div
            className={`stage-cast-stage-area ${dragLock.locked ? "drag-locked" : ""}`}
            onPointerCancel={stopCustomOffsetDrag}
            onPointerMove={moveCustomOffsetDrag}
            onPointerUp={stopCustomOffsetDrag}
            ref={stageRef}
          >
            <DragLockHint available={dragLock.available} locked={dragLock.locked} onToggle={dragLock.toggle} />
            <div className="stage-cast-center-line" />
            <div className="stage-cast-face-anchor" />
            {visibleEntries.map((entry, index) => {
              const imageKey = stageCastImageKey(entry);
              const style = getStageCastSpriteStyle(entry, entries, imageSizes[imageKey], index);
              return (
                <div
                  className={`stage-cast-sprite ${entry.position === "custom" ? "custom-offset" : ""} ${dragLock.locked ? "drag-locked" : ""} ${selectedCastId === entry.characterId ? "selected" : ""} ${entry.flipH ? "flipped" : ""} ${entry.mystery ? "mystery" : ""}`}
                  key={entry.characterId}
                  onPointerDown={(event) => startCustomOffsetDrag(event, entry)}
                  style={style}
                >
                  <img alt="" onLoad={(event) => rememberImageSize(entry, event)} src={resPathToAssetUrl(entry.portrait?.path)} />
                  <span>{entry.label}</span>
                </div>
              );
            })}
          </div>
          <div className="stage-cast-dialogue-band">
            <div className="stage-cast-dialogue-copy">
              <strong>{ui.form.stagePreview}</strong>
              <span>{visibleEntries.length} {ui.form.visible}</span>
            </div>
            {selectedEntry?.position === "custom" && (
              <DragLockToggle
                available={dragLock.available}
                locked={dragLock.locked}
                onToggle={dragLock.toggle}
              />
            )}
            {selectedEntry?.position === "custom" && (
              <div className="stage-cast-nudge-panel">
                <CoordinateNudgeToolbar
                  label={`${selectedEntry.label} ${ui.form.offset}`}
                  min={-1}
                  max={1}
                  onChange={updateSelectedCustomOffset}
                  resetX={0}
                  resetY={0}
                  x={selectedEntry.offset.x}
                  y={selectedEntry.offset.y}
                />
              </div>
            )}
          </div>
          {visibleEntries.length === 0 && <span className="stage-cast-preview-empty">{ui.form.previewEmpty}</span>}
        </div>
      )}
      {actualPreview && (
        <section
          aria-hidden={previewMode === "web"}
          aria-label={ui.preview.actualPreview}
          className={`actual-preview-panel stage-cast-actual-preview ${previewMode === "web" ? "hidden" : ""}`}
        >
          <div className="actual-preview-toolbar">
            <strong>{previewModeLabel(previewMode, ui)}</strong>
            <span>{activeModeConfig.width} x {activeModeConfig.height}</span>
            <button disabled={actualPreviewBusy || !hasActualPreviewContext} type="button" onClick={() => void prepareActualPreview(previewMode)}>
              {ui.preview.refresh}
            </button>
            <button disabled={actualPreviewBusy || !hasActualPreviewContext} type="button" onClick={() => void prepareActualPreview(previewMode, true)}>
              {ui.preview.actualPreviewBuild}
            </button>
            {actualPreviewOpenUrl && (
              <a href={actualPreviewOpenUrl} rel="noreferrer" target="_blank">
                {ui.preview.openInNewTab}
              </a>
            )}
          </div>
          <div
            className="actual-preview-frame"
            style={{ "--actual-preview-aspect": `${activeModeConfig.width} / ${activeModeConfig.height}` } as CSSProperties}
          >
            {actualPreviewUrl ? (
              <iframe
                allow="fullscreen; gamepad"
                onLoad={handleActualPreviewFrameLoad}
                ref={actualPreviewFrameRef}
                src={actualPreviewUrl}
                title={`${ui.preview.actualPreview} ${previewModeLabel(previewMode, ui)}`}
              />
            ) : (
              <div className="actual-preview-placeholder">
                <Icon name="PlayCircle" />
                <span>{hasActualPreviewContext ? (actualPreviewStatus || ui.preview.bridgeRequired) : ui.preview.actualPreviewUnavailable}</span>
              </div>
            )}
            {actualPreviewUrl && (actualPreviewLoadCover || actualPreviewBusyKind === "build") && (
              <div className="actual-preview-placeholder actual-preview-cover" role="status">
                <Icon name={actualPreviewBusyKind === "build" ? "Build" : "PlayCircle"} />
                <span>{actualPreviewCoverMessage}</span>
              </div>
            )}
          </div>
          {actualPreviewStatus && <p className="actual-preview-status">{actualPreviewStatus}</p>}
        </section>
      )}
    </div>
  );
}

function CastPortraitPreview({ entry }: { entry: StageCastPreviewEntry }) {
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

function portraitKeys(character: ResourceRecord | undefined) {
  const portraits = character?.portraits && typeof character.portraits === "object"
    ? character.portraits as Record<string, ResourceRecord | string>
    : {};
  const live2d = live2dRecordForEditor(character?.live2d);
  const motionKeys = Object.keys(getLive2dMotions(live2d.motions));
  return Array.from(new Set([...Object.keys(portraits), ...motionKeys]));
}

function characterHasLive2dRig(character: ResourceRecord | undefined) {
  const live2d = live2dRecordForEditor(character?.live2d);
  return normalizeBooleanFlag(live2d.enabled, false) && getLive2dParts(live2d.parts).length > 0;
}

function popupPortraitSelectOptions(character: ResourceRecord | undefined, selected: string) {
  const keys = portraitKeys(character);
  if (selected && !keys.includes(selected)) return [selected, ...keys];
  return keys;
}

function popupSourceLabels(ui: EditorCopy) {
  return {
    character_profile: ui.form.popupSourceCharacterProfile,
    item: ui.form.popupSourceItem,
    image: ui.form.popupSourceImage
  };
}

function popupPositionLabels(ui: EditorCopy) {
  return {
    left: ui.form.positionLeft,
    center: ui.form.positionCenter,
    right: ui.form.positionRight,
    top_left: ui.form.popupPositionTopLeft,
    top_right: ui.form.popupPositionTopRight,
    custom: ui.form.positionCustom
  };
}

function popupTransitionLabels(ui: EditorCopy) {
  return {
    fade: ui.form.popupTransitionFade,
    pop: ui.form.popupTransitionPop,
    slide: ui.form.popupTransitionSlide,
    none: ui.form.popupTransitionNone
  };
}

function popupImageModeLabels(ui: EditorCopy) {
  return {
    fit: ui.form.popupImageModeFit,
    cover: ui.form.popupImageModeCover,
    crop: ui.form.popupImageModeCrop
  };
}

function resolveCastPortrait(character: ResourceRecord | undefined, keyOrPath: unknown): StageCastPreviewEntry["portrait"] {
  const portraits = character?.portraits && typeof character.portraits === "object"
    ? character.portraits as Record<string, ResourceRecord | string>
    : {};
  const key = String(keyOrPath || "").trim();
  if (!key) return null;
  if (key.startsWith("res://")) {
    return { key, path: key, center: [0.5, 0.34], profile: {} };
  }

  const portraitKey = portraits[key] ? key : "";
  const rawPortrait = portraitKey ? portraits[portraitKey] : null;
  if (!rawPortrait) {
    const live2d = live2dRecordForEditor(character?.live2d);
    if (!key || !getLive2dMotions(live2d.motions)[key]) return null;
    const fallbackRawPortrait = portraits.default || Object.values(portraits)[0];
    if (!fallbackRawPortrait) return null;
    const fallbackPortrait = portraitRecordForEditor(fallbackRawPortrait);
    return {
      key,
      path: String(fallbackPortrait.path || ""),
      center: asArray<number>(fallbackPortrait.center),
      profile: fallbackPortrait.profile && typeof fallbackPortrait.profile === "object" ? fallbackPortrait.profile as ResourceRecord : {}
    };
  }
  const portrait = portraitRecordForEditor(rawPortrait);
  return {
    key: portraitKey,
    path: String(portrait.path || ""),
    center: asArray<number>(portrait.center),
    profile: portrait.profile && typeof portrait.profile === "object" ? portrait.profile as ResourceRecord : {}
  };
}

function characterLabel(characterId: string, character: ResourceRecord | undefined, summaries: ResourceSummary[]) {
  if (characterId === "mystery") return "???";
  return String(character?.display_name || summaries.find((entry) => entry.id === characterId)?.title || characterId);
}

type NodeCastBadge = { kind: "enter" | "exit"; characterId: string; label: string; color: string };
type NodeBgmBadge = { kind: "start" | "stop"; detail: string };

function NodeRowBadgeStrip({
  castBadges,
  bgmBadges
}: {
  castBadges: NodeCastBadge[];
  bgmBadges: NodeBgmBadge[];
}) {
  if (castBadges.length === 0 && bgmBadges.length === 0) return null;
  return (
    <span className="node-cast-badge-strip">
      {bgmBadges.map((badge, index) => (
        <span
          className={`node-cast-badge bgm-${badge.kind}`}
          key={`bgm-${badge.kind}-${badge.detail || index}`}
          style={castBadgeColorStyle(badge.kind === "start" ? "#ffc857" : "#a0a0a0")}
          title={badge.kind === "start"
            ? (badge.detail ? `이 노드에서 BGM 재생: ${badge.detail}` : "이 노드에서 BGM 재생")
            : "이 노드에서 BGM 종료"}
        >
          {nodeBgmBadgeLabel(badge)}
        </span>
      ))}
      {castBadges.map((badge) => (
        <span
          className={`node-cast-badge ${badge.kind}`}
          key={`${badge.kind}-${badge.characterId}`}
          style={castBadgeColorStyle(badge.color)}
          title={badge.kind === "enter" ? "이 노드에서 무대에 등장" : "다음 노드에서 퇴장"}
        >
          {badge.label} {badge.kind === "enter" ? "등장" : "퇴장"}
        </span>
      ))}
    </span>
  );
}

function nodeBgmBadgeLabel(badge: NodeBgmBadge) {
  if (badge.kind === "stop") return "BGM 종료";
  return badge.detail ? `BGM · ${badge.detail}` : "BGM 시작";
}

function nodeBgmBadges(node: ResourceRecord, references: ReferenceResources): NodeBgmBadge[] {
  if (isCutsceneNode(node) || isStageNode(node)) return [];
  return collectBgmBadgesFromAst(parseRichTextPreviewAst(String(node.text || "")), references);
}

function collectBgmBadgesFromAst(nodes: RichTextAstNode[], references: ReferenceResources): NodeBgmBadge[] {
  const badges: NodeBgmBadge[] = [];
  const seen = new Set<string>();

  const visit = (node: RichTextAstNode) => {
    if (node.type === "event") {
      const tag = node.tagName.toLowerCase();
      if (tag === "bgm" || tag === "music") {
        const detail = formatEventAttrSummary(tag, node.attrs, references);
        const key = `start|${detail}`;
        if (!seen.has(key)) {
          seen.add(key);
          badges.push({ kind: "start", detail });
        }
      } else if (tag === "bgm_stop" || tag === "music_stop") {
        if (!seen.has("stop")) {
          seen.add("stop");
          badges.push({ kind: "stop", detail: "" });
        }
      }
      return;
    }
    if (node.type === "span") node.children.forEach(visit);
  };

  nodes.forEach(visit);
  return badges;
}

function castBadgeColorStyle(color: string) {
  return { "--cast-badge-color": color } as CSSProperties & Record<string, string>;
}

function characterBadgeColor(characterId: string, characters: ResourceSummary[]) {
  return sanitizeHexColor(characters.find((entry) => entry.id === characterId)?.nameColor, "#ffffff");
}

function findPreviousCastEntry(nodes: ResourceRecord[], selectedNodeIndex: number, characterId: string) {
  for (let index = selectedNodeIndex - 1; index >= 0; index -= 1) {
    const previousCast = nodes[index]?.stage_cast;
    if (!previousCast || typeof previousCast !== "object") continue;
    const entry = (previousCast as Record<string, ResourceRecord>)[characterId];
    if (entry && typeof entry === "object") return { index, entry };
  }
  return null;
}

function normalizeEditorSpeakerId(value: unknown) {
  const speakerId = String(value || "").trim();
  return speakerId && speakerId !== "narrator" ? speakerId : "";
}

function characterIsProtagonist(characterId: string, characters: ResourceSummary[]) {
  return Boolean(characters.find((character) => character.id === characterId)?.isProtagonist);
}

function stageCastAllowsCharacter(characterId: string, characters: ResourceSummary[]) {
  const normalizedId = normalizeTimelineCharacterId(characterId);
  return Boolean(normalizedId) && !characterIsProtagonist(normalizedId, characters);
}

function filterStageCastCharacterIds(characterIds: string[], characters: ResourceSummary[]) {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const rawId of characterIds) {
    const characterId = normalizeTimelineCharacterId(rawId);
    if (!characterId || seen.has(characterId) || characterIsProtagonist(characterId, characters)) continue;
    seen.add(characterId);
    result.push(characterId);
  }
  return result;
}

function removeProtagonistStageCastEntries(stageCast: Record<string, ResourceRecord>, characters: ResourceSummary[]) {
  const nextStageCast = { ...stageCast };
  let removedCount = 0;
  for (const rawId of Object.keys(nextStageCast)) {
    const characterId = normalizeTimelineCharacterId(rawId);
    if (!characterId || !characterIsProtagonist(characterId, characters)) continue;
    delete nextStageCast[rawId];
    removedCount += 1;
  }
  return { stageCast: nextStageCast, removedCount, changed: removedCount > 0 };
}

function withStageCastRecord(node: ResourceRecord, stageCast: Record<string, ResourceRecord>) {
  const nextNode = { ...node };
  if (Object.keys(stageCast).length > 0 || isStageNode(node)) nextNode.stage_cast = stageCast;
  else delete nextNode.stage_cast;
  return nextNode;
}

function defaultFocusTargetsForSpeaker(speakerId: string, characters: ResourceSummary[]) {
  if (!speakerId || speakerId === "mystery" || characterIsProtagonist(speakerId, characters)) return [];
  return [speakerId];
}

function getNodeFocusTargets(node: ResourceRecord | undefined) {
  if (!node) return [];
  const rawValue = node.focus_targets ?? node.focus_characters ?? node.spotlight_targets ?? node.attention_targets ?? node.camera_focus_targets;
  return normalizeCharacterIdList(rawValue);
}

function nodeHasExplicitFocusTargets(node: ResourceRecord | undefined) {
  return Boolean(
    node
    && (
      Object.prototype.hasOwnProperty.call(node, "focus_targets")
      || Object.prototype.hasOwnProperty.call(node, "focus_characters")
      || Object.prototype.hasOwnProperty.call(node, "spotlight_targets")
      || Object.prototype.hasOwnProperty.call(node, "attention_targets")
      || Object.prototype.hasOwnProperty.call(node, "camera_focus_targets")
    )
  );
}

function normalizeCharacterIdList(value: unknown) {
  const ids = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.replace(/[,;]/g, " ").split(/\s+/)
      : [];
  const seen = new Set<string>();
  const result: string[] = [];
  ids.forEach((rawId) => {
    const characterId = normalizeTimelineCharacterId(rawId);
    if (!characterId || seen.has(characterId)) return;
    seen.add(characterId);
    result.push(characterId);
  });
  return result;
}

function withNodeFocusTargets(node: ResourceRecord, focusTargets: string[]) {
  const next: ResourceRecord = { ...node, focus_targets: normalizeCharacterIdList(focusTargets) };
  delete next.focus_characters;
  delete next.spotlight_targets;
  delete next.attention_targets;
  delete next.camera_focus_targets;
  return next;
}

function getStageCastRecord(value: unknown): Record<string, ResourceRecord> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, ResourceRecord>
    : {};
}

function nodeCastBadges(node: ResourceRecord, index: number, nodes: ResourceRecord[], references: ReferenceResources): NodeCastBadge[] {
  const badges: NodeCastBadge[] = [];
  const appendBadge = (badge: NodeCastBadge) => {
    if (!badges.some((entry) => entry.kind === badge.kind && entry.characterId === badge.characterId)) badges.push(badge);
  };

  getEnterIdsAtNode(index, nodes).forEach((characterId) => appendBadge({
      kind: "enter" as const,
      characterId,
      label: characterLabel(characterId, undefined, references.characters),
      color: characterBadgeColor(characterId, references.characters)
    }));
  textEventCastBadges(String(node.text || ""), references).forEach(appendBadge);
  getExitIdsFromNode(node).forEach((characterId) => appendBadge({
      kind: "exit" as const,
      characterId,
      label: characterLabel(characterId, undefined, references.characters),
      color: characterBadgeColor(characterId, references.characters)
    }));

  return badges;
}

function getEnterIdsAtNode(index: number, nodes: ResourceRecord[]) {
  const before = new Set(computeStageCharacterIdsBeforeNode(index, nodes));
  return computeStageCharacterIdsAtNode(index, nodes)
    .filter((characterId) => !before.has(characterId));
}

function computeStageCharacterIdsBeforeNode(nodeIndex: number, nodes: ResourceRecord[]) {
  const onStage = new Set<string>();
  const maxIndex = Math.min(Math.max(0, nodeIndex), nodes.length);
  for (let index = 0; index < maxIndex; index += 1) {
    const node = nodes[index];
    addNodeStagePresenceIds(onStage, node);
    getExitIdsFromNode(node).forEach((characterId) => onStage.delete(characterId));
  }
  return [...onStage].sort((a, b) => a.localeCompare(b));
}

function computeStageCharacterIdsAtNode(nodeIndex: number, nodes: ResourceRecord[]) {
  const onStage = new Set(computeStageCharacterIdsBeforeNode(nodeIndex, nodes));
  addNodeStagePresenceIds(onStage, nodes[nodeIndex]);
  return [...onStage].sort((a, b) => a.localeCompare(b));
}

function addNodeStagePresenceIds(target: Set<string>, node: ResourceRecord | undefined) {
  if (!node || isCutsceneNode(node)) return;
  const speakerId = normalizeTimelineCharacterId(node.speaker);
  if (speakerId) target.add(speakerId);
  getStageTextEventIdsFromNode(node, "enter").forEach((characterId) => target.add(characterId));
  getStageCastIdsFromNode(node).forEach((characterId) => target.add(characterId));
}

function getStageCastIdsFromNode(node: ResourceRecord | undefined) {
  if (!node || isCutsceneNode(node)) return [];
  const ids: string[] = [];
  for (const [rawId, entry] of Object.entries(getStageCastRecord(node.stage_cast))) {
    const characterId = normalizeTimelineCharacterId(rawId);
    if (!characterId || ids.includes(characterId)) continue;
    if (!entry || typeof entry !== "object") continue;
    if (!String(entry.portrait || "").trim()) continue;
    ids.push(characterId);
  }
  return ids;
}

function getExitIdsFromNode(node: ResourceRecord | undefined) {
  if (!node || isCutsceneNode(node)) return [];
  const ids = new Set<string>();
  getStageTextEventIdsFromNode(node, "exit").forEach((characterId) => ids.add(characterId));
  for (const [rawId, entry] of Object.entries(getStageCastRecord(node.stage_cast))) {
    const characterId = normalizeTimelineCharacterId(rawId);
    if (characterId && normalizeBooleanFlag(entry?.character_exit ?? entry?.exit)) ids.add(characterId);
  }
  const speakerId = normalizeTimelineCharacterId(node.speaker);
  if (speakerId && normalizeBooleanFlag(node.character_exit)) ids.add(speakerId);
  return [...ids].sort((a, b) => a.localeCompare(b));
}

function getStageTextEventIdsFromNode(node: ResourceRecord | undefined, tagName: "enter" | "exit") {
  const ids: string[] = [];
  const seen = new Set<string>();
  const appendId = (rawId: unknown) => {
    const characterId = normalizeTimelineCharacterId(rawId);
    if (!characterId || seen.has(characterId)) return;
    seen.add(characterId);
    ids.push(characterId);
  };
  const visit = (entry: RichTextAstNode) => {
    if (entry.type === "event" && entry.tagName === tagName) {
      getEventTargetIds(entry.attrs).forEach(appendId);
    }
    if (entry.type === "span") entry.children.forEach(visit);
  };
  parseRichTextPreviewAst(String(node?.text || "")).forEach(visit);
  return ids;
}

function normalizeTimelineCharacterId(value: unknown) {
  const characterId = normalizeEditorSpeakerId(value);
  return characterId && characterId !== "mystery" ? characterId : "";
}

type DialogueSpeakerStageCastCleanResult = {
  nodes: ResourceRecord[];
  changedNodeCount: number;
  removedCastCount: number;
  addedCastCount: number;
};

function pruneStageCastToAllowed(
  node: ResourceRecord,
  allowed: Set<string>,
  characters: ResourceSummary[] = [],
  options: { removeManualExtras?: boolean } = {}
) {
  const removeManualExtras = options.removeManualExtras ?? true;
  const cast = getStageCastRecord(node.stage_cast);
  if (Object.keys(cast).length === 0) {
    return { node, removedCount: 0, changed: false };
  }

  const nextCast: Record<string, ResourceRecord> = {};
  let removedCount = 0;
  for (const [rawId, entry] of Object.entries(cast)) {
    const characterId = normalizeEditorSpeakerId(rawId);
    const isProtagonist = characterId && characterId !== "mystery" && characterIsProtagonist(characterId, characters);
    const keepEntry = !characterId || characterId === "mystery" || (!isProtagonist && (!removeManualExtras || allowed.has(characterId)));
    if (keepEntry) {
      nextCast[rawId] = entry;
      continue;
    }
    removedCount += 1;
  }

  if (removedCount === 0) return { node, removedCount: 0, changed: false };
  const nextNode = { ...node };
  if (Object.keys(nextCast).length > 0 || isStageNode(node)) nextNode.stage_cast = nextCast;
  else delete nextNode.stage_cast;
  return { node: nextNode, removedCount, changed: true };
}

function ensureStageCastForNode(
  node: ResourceRecord,
  requiredIds: string[],
  speakerId: string,
  nodeIndex: number,
  nodes: ResourceRecord[],
  options: { removeManualExtras?: boolean; characters?: ResourceSummary[] } = {}
) {
  const removeManualExtras = options.removeManualExtras ?? true;
  const characters = options.characters ?? [];
  const stageCastRequiredIds = filterStageCastCharacterIds(requiredIds, characters);
  const stageCast = { ...getStageCastRecord(node.stage_cast) };
  let addedCount = 0;
  let removedCount = 0;
  let changed = false;

  stageCastRequiredIds.forEach((characterId) => {
    const isSpeaker = characterId === speakerId;
    const existing = stageCast[characterId];
    const nextEntry = fillStageCastDefaults(
      existing && typeof existing === "object"
        ? { ...existing, character_exit: false }
        : buildInheritedStageCastEntry(nodes, nodeIndex, characterId),
      isSpeaker && getNodeSpeakerMystery(node),
      stageCastAnimationOrderDefault
    );
    if (!existing) addedCount += 1;
    if (!existing || JSON.stringify(existing) !== JSON.stringify(nextEntry)) {
      stageCast[characterId] = nextEntry;
      changed = true;
    }
  });

  for (const rawId of Object.keys(stageCast)) {
    const characterId = normalizeTimelineCharacterId(rawId);
    if (characterId && characterIsProtagonist(characterId, characters)) {
      delete stageCast[rawId];
      removedCount += 1;
      changed = true;
      continue;
    }
    if (!removeManualExtras || !characterId || stageCastRequiredIds.includes(characterId)) continue;
    delete stageCast[rawId];
    removedCount += 1;
    changed = true;
  }

  if (!changed) {
    return { node, addedCount: 0, removedCount: 0, changed: false };
  }

  const nextNode = { ...node };
  if (Object.keys(stageCast).length > 0) nextNode.stage_cast = stageCast;
  else delete nextNode.stage_cast;
  return { node: nextNode, addedCount, removedCount, changed: true };
}

function applyInheritedStageCastDefaults(
  node: ResourceRecord,
  nodeIndex: number,
  nodes: ResourceRecord[],
  characters: ResourceSummary[] = []
): ResourceRecord {
  if (isCutsceneNode(node)) return node;
  const speakerId = normalizeTimelineCharacterId(node.speaker);
  const pruned = removeProtagonistStageCastEntries(getStageCastRecord(node.stage_cast), characters);
  const nextNode = pruned.changed ? withStageCastRecord(node, pruned.stageCast) : node;
  const stageIds = filterStageCastCharacterIds(computeStageCharacterIdsAtNode(nodeIndex, nodes), characters);
  if (stageIds.length === 0) return nextNode;
  return ensureStageCastForNode(nextNode, stageIds, speakerId, nodeIndex, nodes, { characters }).node;
}

function countManualStageCastRemovals(nodes: ResourceRecord[], characters: ResourceSummary[] = []) {
  const active = new Set<string>();
  let count = 0;

  for (const node of nodes) {
    if (isCutsceneNode(node)) continue;

    const speakerId = normalizeTimelineCharacterId(node.speaker);
    const enterIds = getStageTextEventIdsFromNode(node, "enter");
    const requiredCast = new Set(active);
    if (stageCastAllowsCharacter(speakerId, characters)) requiredCast.add(speakerId);
    enterIds.forEach((characterId) => {
      if (stageCastAllowsCharacter(characterId, characters)) requiredCast.add(characterId);
    });

    for (const rawId of Object.keys(getStageCastRecord(node.stage_cast))) {
      const characterId = normalizeTimelineCharacterId(rawId);
      if (characterId && !characterIsProtagonist(characterId, characters) && !requiredCast.has(characterId)) count += 1;
    }

    const nextSpeakerId = normalizeTimelineCharacterId(node.speaker);
    if (stageCastAllowsCharacter(nextSpeakerId, characters)) active.add(nextSpeakerId);
    getStageTextEventIdsFromNode(node, "enter").forEach((characterId) => {
      if (stageCastAllowsCharacter(characterId, characters)) active.add(characterId);
    });
    Object.keys(getStageCastRecord(node.stage_cast)).forEach((rawId) => {
      const characterId = normalizeTimelineCharacterId(rawId);
      if (stageCastAllowsCharacter(characterId, characters)) active.add(characterId);
    });
    getExitIdsFromNode(node).forEach((characterId) => active.delete(characterId));
  }

  return count;
}

function cleanDialogueSpeakerStageCast(
  nodes: ResourceRecord[],
  characters: ResourceSummary[],
  options: { removeManualExtras?: boolean } = {}
): DialogueSpeakerStageCastCleanResult {
  const removeManualExtras = options.removeManualExtras ?? true;
  const active = new Set<string>();
  let changedNodeCount = 0;
  let removedCastCount = 0;
  let addedCastCount = 0;

  const cleanedNodes = nodes.reduce<ResourceRecord[]>((accumulator, node, index) => {
    if (isCutsceneNode(node)) {
      accumulator.push(node);
      return accumulator;
    }

    const speakerId = normalizeTimelineCharacterId(node.speaker);
    const enterIds = getStageTextEventIdsFromNode(node, "enter");
    const requiredCast = new Set(active);
    if (stageCastAllowsCharacter(speakerId, characters)) requiredCast.add(speakerId);
    enterIds.forEach((characterId) => {
      if (stageCastAllowsCharacter(characterId, characters)) requiredCast.add(characterId);
    });

    let nextNode = node;
    let nodeChanged = false;

    if (requiredCast.size > 0) {
      const ensured = ensureStageCastForNode(
        node,
        [...requiredCast].sort((a, b) => a.localeCompare(b)),
        speakerId,
        index,
        accumulator,
        { removeManualExtras, characters }
      );
      nextNode = ensured.node;
      if (ensured.changed) {
        nodeChanged = true;
        addedCastCount += ensured.addedCount;
        removedCastCount += ensured.removedCount;
      }
    } else {
      const pruned = pruneStageCastToAllowed(node, requiredCast, characters, { removeManualExtras });
      nextNode = pruned.node;
      if (pruned.changed) {
        nodeChanged = true;
        removedCastCount += pruned.removedCount;
      }
    }

    const nextSpeakerId = normalizeTimelineCharacterId(nextNode.speaker);
    if (!isStageNode(nextNode) && (nextSpeakerId || nodeHasExplicitFocusTargets(nextNode))) {
      const focusedNode = withNodeFocusTargets(
        nextNode,
        defaultFocusTargetsForSpeaker(nextSpeakerId, characters)
      );
      if (JSON.stringify(focusedNode) !== JSON.stringify(nextNode)) {
        nextNode = focusedNode;
        nodeChanged = true;
      }
    }

    if (stageCastAllowsCharacter(nextSpeakerId, characters)) active.add(nextSpeakerId);
    getStageTextEventIdsFromNode(nextNode, "enter").forEach((characterId) => {
      if (stageCastAllowsCharacter(characterId, characters)) active.add(characterId);
    });
    Object.keys(getStageCastRecord(nextNode.stage_cast)).forEach((rawId) => {
      const characterId = normalizeTimelineCharacterId(rawId);
      if (stageCastAllowsCharacter(characterId, characters)) active.add(characterId);
    });
    getExitIdsFromNode(nextNode).forEach((characterId) => active.delete(characterId));

    if (nodeChanged) changedNodeCount += 1;
    accumulator.push(nextNode);
    return accumulator;
  }, []);

  return { nodes: cleanedNodes, changedNodeCount, removedCastCount, addedCastCount };
}

function isStageCastOnlyNode(node: ResourceRecord) {
  const cast = getStageCastRecord(node.stage_cast);
  if (Object.keys(cast).length === 0) return false;
  if (normalizeEditorSpeakerId(node.speaker)) return false;
  if (String(node.text || "").trim()) return false;
  return asArray(node.choices).length === 0;
}

function withSpeakerStageCastDefaults(
  node: ResourceRecord,
  speaker: string,
  nodes: ResourceRecord[],
  nodeIndex: number,
  characters: ResourceSummary[] = []
) {
  const speakerId = normalizeEditorSpeakerId(speaker);
  const nextNode: ResourceRecord = withNodeFocusTargets(
    { ...node, speaker },
    defaultFocusTargetsForSpeaker(speakerId, characters)
  );
  const oldSpeakerId = normalizeEditorSpeakerId(node.speaker);
  const nodesWithNext = nodes.map((entry, index) => index === nodeIndex ? nextNode : entry);
  const stageIds = filterStageCastCharacterIds(computeStageCharacterIdsAtNode(nodeIndex, nodesWithNext), characters);

  let stageCast = removeProtagonistStageCastEntries(getStageCastRecord(node.stage_cast), characters).stageCast;
  const previousStageIds = new Set(computeStageCharacterIdsBeforeNode(nodeIndex, nodes));
  if (oldSpeakerId && oldSpeakerId !== speakerId && !previousStageIds.has(oldSpeakerId)) {
    delete stageCast[oldSpeakerId];
  }

  if (stageIds.length === 0) return withStageCastRecord(nextNode, stageCast);

  const speakerMystery = getNodeSpeakerMystery(nextNode);
  for (const castId of stageIds) {
    if (!castId || castId === "mystery") continue;
    const existing = stageCast[castId];
    const isSpeaker = Boolean(speakerId) && castId === speakerId;
    stageCast[castId] = fillStageCastDefaults(
      existing && typeof existing === "object"
        ? { ...existing, character_exit: false }
        : buildInheritedStageCastEntry(nodes, nodeIndex, castId),
      isSpeaker && speakerMystery,
      stageCastAnimationOrderDefault
    );
  }

  return withStageCastRecord(nextNode, stageCast);
}

function buildInheritedStageCastEntry(nodes: ResourceRecord[], nodeIndex: number, speakerId: string) {
  const inherited = findPreviousCastEntry(nodes, nodeIndex, speakerId)?.entry;
  if (!inherited || typeof inherited !== "object") return {};
  const next = cloneJsonValue(inherited);
  delete next.character_exit;
  delete next.exit;
  return next;
}

function fillStageCastDefaults(entry: ResourceRecord, mystery: boolean, animationOrder: number) {
  const next: ResourceRecord = { ...entry };
  const position = normalizeCastPosition(next.portrait_position ?? next.position ?? "center");
  next.portrait = String(next.portrait || "");
  next.portrait_position = position;
  if (position === "custom") {
    const offset = parseCastOffset(next.portrait_offset);
    next.portrait_offset = [offset.x, offset.y];
  } else if (next.portrait_offset === undefined) {
    next.portrait_offset = null;
  }
  if (next.portrait_zoom === undefined || next.portrait_zoom === null || next.portrait_zoom === "") {
    next.portrait_zoom = portraitZoomDefault;
  }
  if (next.animation_order === undefined || next.animation_order === null || next.animation_order === "") {
    next.animation_order = animationOrder;
  }
  if (next.animation_speed === undefined || next.animation_speed === null || next.animation_speed === "") {
    next.animation_speed = stageCastDefaultAnimationSpeed;
  }
  if (next.portrait_opacity === undefined || next.portrait_opacity === null || next.portrait_opacity === "") {
    next.portrait_opacity = stageCastDefaultOpacity;
  }
  if (next.mystery === undefined || next.mystery === null) {
    next.mystery = Boolean(mystery);
  }
  delete next.exit;
  return next;
}

function normalizeCastPosition(value: unknown) {
  const text = String(value || "center").trim().toLowerCase();
  if ((stageCastPositionOptions as readonly string[]).includes(text)) return text;
  return "center";
}

function parseCastOffset(value: unknown) {
  if (Array.isArray(value)) {
    return { x: normalizeNumber(value[0], 0), y: normalizeNumber(value[1], 0) };
  }
  if (value && typeof value === "object") {
    const record = value as ResourceRecord;
    return { x: normalizeNumber(record.x ?? record[0], 0), y: normalizeNumber(record.y ?? record[1], 0) };
  }
  return { x: 0, y: 0 };
}

function parseSizePoint(value: unknown, fallback: { x: number; y: number }) {
  if (Array.isArray(value)) {
    return { x: normalizeNumber(value[0], fallback.x, 1), y: normalizeNumber(value[1], fallback.y, 1) };
  }
  if (value && typeof value === "object") {
    const record = value as ResourceRecord;
    return {
      x: normalizeNumber(record.x ?? record.width ?? record[0], fallback.x, 1),
      y: normalizeNumber(record.y ?? record.height ?? record[1], fallback.y, 1)
    };
  }
  return fallback;
}

function snapPortraitZoomPercent(value: unknown) {
  const clamped = clampNumber(value, portraitZoomMin, portraitZoomMax, portraitZoomDefault);
  return Math.round(clamped / portraitZoomStep) * portraitZoomStep;
}

function isStackableCastPosition(position: string) {
  return Object.prototype.hasOwnProperty.call(portraitPositionPresets, position);
}

function applyCastPositionStackSpread(baseOffset: PointerPoint, stackIndex: number, stackCount: number) {
  if (stackCount <= 1) return { x: round4Number(baseOffset.x), y: round4Number(baseOffset.y) };
  const safeCount = Math.max(1, Math.round(stackCount) || 1);
  const safeIndex = Math.min(Math.max(0, Math.round(stackIndex) || 0), safeCount - 1);
  const spread = safeIndex - (safeCount - 1) * 0.5;
  return {
    x: round4Number(clampNumber(baseOffset.x + spread * portraitPositionStackSpreadStep, portraitPositionStackMinX, portraitPositionStackMaxX, baseOffset.x)),
    y: round4Number(baseOffset.y)
  };
}

function getPortraitAnchorRatios(zoomPercent: unknown) {
  const zoom = Number.isFinite(Number(zoomPercent)) ? Number(zoomPercent) : portraitZoomDefault;
  const span = Math.max(portraitZoomOutBodyBlendStart - portraitZoomOutBodyBlendEnd, 0.001);
  const blend = clampNumber((portraitZoomOutBodyBlendStart - zoom) / span, 0, 1, 0);
  return {
    x: portraitFaceAnchor.x + (portraitZoomOutBodyAnchor.x - portraitFaceAnchor.x) * blend,
    y: portraitFaceAnchor.y + (portraitZoomOutBodyAnchor.y - portraitFaceAnchor.y) * blend
  };
}

function getStageCastRecordLayoutOffset(characterId: string, entry: ResourceRecord, stageCast: Record<string, ResourceRecord>) {
  const position = normalizeCastPosition(entry.portrait_position ?? entry.position);
  if (position === "custom") return parseCastOffset(entry.portrait_offset);
  const baseOffset = portraitPositionPresets[position] || portraitPositionPresets.center;
  if (!characterId || !isStackableCastPosition(position)) return baseOffset;
  const group = Object.entries(stageCast)
    .map(([candidateId, candidate], index) => ({
      characterId: candidateId,
      index,
      position: normalizeCastPosition(candidate?.portrait_position ?? candidate?.position),
      order: normalizeNumber(candidate?.portrait_position_order ?? candidate?.position_order, index + 1, 1),
      visible: Boolean(candidate?.portrait)
    }))
    .filter((candidate) => candidate.position === position && candidate.visible)
    .sort((a, b) => a.order === b.order ? a.index - b.index : a.order - b.order);
  const stackIndex = Math.max(0, group.findIndex((candidate) => candidate.characterId === characterId));
  return applyCastPositionStackSpread(baseOffset, stackIndex, group.length);
}

function stageCastPreviewOffset(entry: StageCastPreviewEntry, allEntries: StageCastPreviewEntry[]) {
  if (entry.position === "custom") return entry.offset;
  const base = portraitPositionPresets[entry.position] || portraitPositionPresets.center;

  const group = allEntries
    .filter((candidate) => candidate.position === entry.position && candidate.portrait && isStackableCastPosition(candidate.position))
    .sort((a, b) => a.positionOrder === b.positionOrder ? a.index - b.index : a.positionOrder - b.positionOrder);
  const stackIndex = Math.max(0, group.findIndex((candidate) => candidate.characterId === entry.characterId));
  return applyCastPositionStackSpread(base, stackIndex, group.length);
}

function stageCastImageKey(entry: StageCastPreviewEntry) {
  return `${entry.characterId}:${String(entry.portrait?.path || "")}`;
}

function getStageCastSpriteStyle(entry: StageCastPreviewEntry, allEntries: StageCastPreviewEntry[], imageSize: { w: number; h: number } | undefined, index: number) {
  const textureW = Math.max(1, imageSize?.w || 900);
  const textureH = Math.max(1, imageSize?.h || 1400);
  const center = asArray<number>(entry.portrait?.center);
  const faceCenter = {
    x: clamp01Number(center[0], 0.5),
    y: clamp01Number(center[1], 0.5)
  };
  const zoom = snapPortraitZoomPercent(entry.portraitZoom);
  const baseScale = Math.min(
    (gameCharacterLayerWidth * portraitFitPadding) / textureW,
    (gameCharacterLayerHeight * portraitFitPadding) / textureH
  );
  const scale = baseScale * (zoom / 100);
  const visualScale = entry.isFocused ? 1 : 0.9;
  const width = textureW * scale * visualScale;
  const height = textureH * scale * visualScale;
  const anchor = getPortraitAnchorRatios(zoom);
  const offset = stageCastPreviewOffset(entry, allEntries);
  const anchorX = gameCharacterLayerWidth * anchor.x + offset.x * gameCharacterLayerWidth;
  const anchorY = gameCharacterLayerHeight * anchor.y + offset.y * gameCharacterLayerHeight;
  return {
    left: `${(anchorX - faceCenter.x * width) / gameCharacterLayerWidth * 100}%`,
    top: `${(anchorY - faceCenter.y * height) / gameCharacterLayerHeight * 100}%`,
    width: `${width / gameCharacterLayerWidth * 100}%`,
    height: `${height / gameCharacterLayerHeight * 100}%`,
    opacity: entry.isFocused ? clampNumber(entry.portraitOpacity, 0, 1, 1) : stageCastUnfocusedOpacity,
    zIndex: index + 1
  } as CSSProperties;
}

function defaultStatementReactionRecord(kind = "default"): ResourceRecord {
  return {
    kind,
    target_id: "",
    label: kind === "default" ? "잘못된 연결" : "",
    next: "",
    statement_end: false,
    nodes: []
  };
}

function defaultNestedNode(mode: DialogueNodeMode): ResourceRecord {
  if (mode === "cutscene") return { mode: "cutscene", cutscene: { fade_in: 0, hold: 1, fade_out: 1 } };
  if (mode === "stage") return { mode: "stage", stage_cast: {}, hold: 0, next: "" };
  return { speaker: "narrator", text: "" };
}

function syncStatementLiesForText(text: string, currentLies: ResourceRecord[]) {
  const phrases = extractStatementLiePhrases(text);
  if (phrases.length === 0) return currentLies;
  const used = new Set<number>();
  return phrases.map((phrase, index) => {
    const existingIndex = currentLies.findIndex((lie, lieIndex) => !used.has(lieIndex) && String(lie.phrase || "") === phrase);
    const fallbackIndex = existingIndex >= 0 ? existingIndex : index;
    const existing = currentLies[fallbackIndex] || {};
    used.add(fallbackIndex);
    const reactions = asArray<ResourceRecord>(existing.reactions);
    return {
      ...existing,
      id: existing.id || `lie_${index}`,
      phrase,
      reactions: reactions.length > 0 ? reactions : [defaultStatementReactionRecord()]
    };
  });
}

function getStatementLies(node: ResourceRecord | undefined) {
  return asArray<ResourceRecord>(node?.statement_lies ?? node?.lies);
}

function withStatementLies(node: ResourceRecord, lies: ResourceRecord[]) {
  const next: ResourceRecord = { ...node };
  delete next.lies;
  next.statement_lies = lies;
  return next;
}

function getNodeSpeakerMystery(node: ResourceRecord) {
  return Boolean(node.speaker_mystery ?? node.mystery_speaker);
}

const textSoundMutedMetadataKeys = ["text_sound_muted", "typewriter_sound_muted", "dialogue_text_sound_muted"];

function getNodeTextSoundMuted(node: ResourceRecord) {
  const metadata = normalizeJsonObject(node.metadata);
  for (const key of textSoundMutedMetadataKeys) {
    if (Object.prototype.hasOwnProperty.call(metadata, key)) return Boolean(metadata[key]);
  }
  for (const key of textSoundMutedMetadataKeys) {
    if (Object.prototype.hasOwnProperty.call(node, key)) return Boolean(node[key]);
  }
  return false;
}

function withNodeTextSoundMuted(node: ResourceRecord, value: boolean) {
  const next: ResourceRecord = { ...node };
  const metadata = { ...normalizeJsonObject(next.metadata) };
  for (const key of textSoundMutedMetadataKeys) {
    delete metadata[key];
    delete next[key];
  }
  if (value) metadata.text_sound_muted = true;
  if (Object.keys(metadata).length > 0) next.metadata = metadata;
  else delete next.metadata;
  return next;
}

function withNodeSpeakerMystery(node: ResourceRecord, value: boolean, characters: ResourceSummary[] = []) {
  const next: ResourceRecord = { ...node };
  delete next.mystery_speaker;
  if (value) next.speaker_mystery = true;
  else delete next.speaker_mystery;
  const speakerId = normalizeEditorSpeakerId(next.speaker);
  let stageCast = removeProtagonistStageCastEntries(getStageCastRecord(next.stage_cast), characters).stageCast;
  if (value && stageCastAllowsCharacter(speakerId, characters)) {
    stageCast[speakerId] = fillStageCastDefaults(
      stageCast[speakerId] && typeof stageCast[speakerId] === "object" ? { ...stageCast[speakerId] } : {},
      true,
      stageCastAnimationOrderDefault
    );
  }
  return withStageCastRecord(next, stageCast);
}

function extractStatementLiePhrases(text: string) {
  const phrases: string[] = [];
  const pattern = /\[lie[^\]]*\]([\s\S]*?)\[\/lie\]/gi;
  let match: RegExpExecArray | null = null;
  while ((match = pattern.exec(text)) !== null) {
    const phrase = stripInlineTags(match[1]).trim();
    if (phrase) phrases.push(phrase);
  }
  if (phrases.length > 0) return phrases;

  const bracketPattern = /\[([^\[\]]+)\]/g;
  while ((match = bracketPattern.exec(text)) !== null) {
    const body = String(match[1] || "").trim();
    if (!body || body.startsWith("/") || /[\s=]/.test(body)) continue;
    if (["lie", "color", "shake", "wave", "speed", "font_scale", "alpha", "bgm", "sfx", "se", "bg", "auto_next", "enter", "exit"].includes(body.toLowerCase())) continue;
    const phrase = stripInlineTags(body).trim();
    if (phrase) phrases.push(phrase);
  }
  return phrases;
}

function stripInlineTags(text: string) {
  return text
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\|+/g, "")
    .replace(/\s+/g, " ");
}

function escapeBbcodeAttribute(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

function getDialogueBackgroundEditorValue(text: string): DialogueBackgroundEditorValue {
  const event = findDialogueBackgroundEvent(text);
  const attrs = event?.attrs || {};
  return {
    enabled: Boolean(event),
    range: event?.range,
    id: dialogueBackgroundAttrString(attrs, ["id", "asset", "asset_id"]),
    path: dialogueBackgroundAttrString(attrs, ["path", "image", "src", "file"]),
    transition: dialogueBackgroundAttrString(attrs, ["transition"], "fade"),
    duration: normalizeNumber(firstDefinedBbcodeAttr(attrs, ["duration", "fade", "time"]), 0.5, 0, 10),
    opacity: normalizeNumber(firstDefinedBbcodeAttr(attrs, ["opacity", "alpha"]), 1, 0, 1),
    blur: normalizeNumber(firstDefinedBbcodeAttr(attrs, ["blur", "blur_px", "background_blur", "filter_blur"]), 3, 0, 12),
    brightness: normalizeNumber(firstDefinedBbcodeAttr(attrs, ["brightness", "bright", "filter_brightness"]), 0.75, 0, 2),
    saturate: normalizeNumber(firstDefinedBbcodeAttr(attrs, ["saturate", "saturation", "filter_saturate", "filter_saturation"]), 0.8, 0, 2),
    dim: normalizeNumber(firstDefinedBbcodeAttr(attrs, ["dim", "darkness", "darken", "overlay", "overlay_opacity", "black_overlay"]), 0.15, 0, 1),
    fixed: readDialogueBackgroundFixed(attrs),
    zoom: normalizeNumber(firstDefinedBbcodeAttr(attrs, ["zoom", "scale", "background_zoom"]), 1, 1, 6),
    x: normalizeNumber(firstDefinedBbcodeAttr(attrs, ["x", "focus_x", "center_x", "offset_x"]), 0.5, 0, 1),
    y: normalizeNumber(firstDefinedBbcodeAttr(attrs, ["y", "focus_y", "center_y", "offset_y"]), 0.5, 0, 1)
  };
}

function findDialogueBackgroundEvent(text: string): Extract<RichTextAstNode, { type: "event" }> | null {
  let found: Extract<RichTextAstNode, { type: "event" }> | null = null;
  const visit = (node: RichTextAstNode) => {
    if (found) return;
    if (node.type === "event" && (node.tagName === "bg" || node.tagName === "background")) {
      found = node;
      return;
    }
    if (node.type === "span") node.children.forEach(visit);
  };
  parseRichTextPreviewAst(text).forEach(visit);
  return found;
}

function dialogueBackgroundAttrString(attrs: BbcodeAttributes, keys: string[], fallback = "") {
  const value = firstDefinedBbcodeAttr(attrs, keys);
  if (value === undefined || value === true || value === false) return fallback;
  return String(value || "").trim() || fallback;
}

function readDialogueBackgroundFixed(attrs: BbcodeAttributes) {
  const fixedValue = firstDefinedBbcodeAttr(attrs, ["fixed", "background_fixed", "static", "locked"]);
  if (fixedValue !== undefined) return readEditorBoolean(fixedValue, true);
  const parallaxValue = firstDefinedBbcodeAttr(attrs, ["parallax", "parallax_enabled", "floating"]);
  if (parallaxValue !== undefined) return !readEditorBoolean(parallaxValue, true);
  return true;
}

function readEditorBoolean(value: unknown, fallback = false) {
  if (value === true || value === false) return value;
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return fallback;
  if (["true", "1", "yes", "on"].includes(text)) return true;
  if (["false", "0", "no", "off"].includes(text)) return false;
  return fallback;
}

function upsertDialogueBackgroundEvent(text: string, value: DialogueBackgroundEditorValue) {
  const tag = buildDialogueBackgroundEventTag(value);
  if (value.range) {
    return `${text.slice(0, value.range.start)}${tag}${text.slice(value.range.end)}`;
  }
  return `${tag}${text}`;
}

function removeDialogueBackgroundEvent(text: string, value: DialogueBackgroundEditorValue) {
  if (!value.range) return text;
  return `${text.slice(0, value.range.start)}${text.slice(value.range.end)}`;
}

function buildDialogueBackgroundEventTag(value: DialogueBackgroundEditorValue) {
  const attrs: string[] = [];
  if (value.id.trim()) {
    attrs.push(`id="${escapeBbcodeAttribute(value.id.trim())}"`);
  } else if (value.path.trim()) {
    attrs.push(`path="${escapeBbcodeAttribute(value.path.trim())}"`);
  }
  attrs.push(`transition=${value.transition || "fade"}`);
  attrs.push(`duration=${formatNumberInput(normalizeNumber(value.duration, 0.5, 0, 10))}`);
  attrs.push(`opacity=${formatNumberInput(normalizeNumber(value.opacity, 1, 0, 1))}`);
  attrs.push(`blur=${formatNumberInput(normalizeNumber(value.blur, 3, 0, 12))}`);
  attrs.push(`brightness=${formatNumberInput(normalizeNumber(value.brightness, 0.75, 0, 2))}`);
  attrs.push(`saturate=${formatNumberInput(normalizeNumber(value.saturate, 0.8, 0, 2))}`);
  attrs.push(`dim=${formatNumberInput(normalizeNumber(value.dim, 0.15, 0, 1))}`);
  attrs.push(`fixed=${value.fixed ? "true" : "false"}`);
  attrs.push(`zoom=${formatNumberInput(normalizeNumber(value.zoom, 1, 1, 6))}`);
  attrs.push(`x=${formatNumberInput(normalizeNumber(value.x, 0.5, 0, 1))}`);
  attrs.push(`y=${formatNumberInput(normalizeNumber(value.y, 0.5, 0, 1))}`);
  return `[bg ${attrs.join(" ")}]`;
}

function getBackgroundStoryAssetOptions(storyAssets: ResourceSummary[]) {
  const emptyOption = { id: "", title: "직접 경로", subtitle: "path", type: "story_assets" } as ResourceSummary;
  const backgroundAssets = storyAssets.filter((asset) => normalizeKind(String(asset.subtitle || "").split(" · ")[0]) === "background");
  return [emptyOption, ...backgroundAssets];
}

function getDialogueBackgroundPreviewUrl(value: DialogueBackgroundEditorValue, storyAssets: ResourceSummary[]) {
  if (value.path) return resPathToAssetUrl(value.path);
  const asset = storyAssets.find((entry) => entry.id === value.id);
  if (!asset) return "";
  return resPathToAssetUrl(String(asset.subtitle || "").split(" · ").slice(1).join(" · "));
}

function getDialogueBackgroundPreviewImageSize(stageWidth: number, stageHeight: number, zoom: number, imageAspect: number) {
  const stageAspect = stageWidth / Math.max(1, stageHeight);
  const safeAspect = clampNumber(imageAspect, 0.05, 20, 16 / 9);
  const safeZoom = clampNumber(zoom, 1, 6, 1);
  if (safeAspect >= stageAspect) {
    const height = stageHeight * safeZoom;
    return { width: height * safeAspect, height };
  }
  const width = stageWidth * safeZoom;
  return { width, height: width / safeAspect };
}

function getDialogueBackgroundPreviewImageStyle(value: DialogueBackgroundEditorValue, imageAspect: number) {
  const stageAspect = 16 / 9;
  const safeAspect = clampNumber(imageAspect, 0.05, 20, stageAspect);
  const safeZoom = clampNumber(value.zoom, 1, 6, 1);
  let widthPercent: number;
  let heightPercent: number;
  if (safeAspect >= stageAspect) {
    heightPercent = safeZoom * 100;
    widthPercent = heightPercent * safeAspect / stageAspect;
  } else {
    widthPercent = safeZoom * 100;
    heightPercent = widthPercent * stageAspect / safeAspect;
  }
  return {
    width: `${widthPercent}%`,
    height: `${heightPercent}%`,
    left: `${50 - clamp01Number(value.x, 0.5) * widthPercent}%`,
    top: `${50 - clamp01Number(value.y, 0.5) * heightPercent}%`
  } as CSSProperties;
}

function clampListIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, Number.isFinite(index) ? Math.round(index) : 0));
}

function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, item);
  return nextItems;
}

function remapMovedIndex(index: number, fromIndex: number, toIndex: number) {
  if (index === fromIndex) return toIndex;
  if (fromIndex < toIndex && index > fromIndex && index <= toIndex) return index - 1;
  if (fromIndex > toIndex && index >= toIndex && index < fromIndex) return index + 1;
  return index;
}

function statementReactionPathKey(path: StatementReactionPath | null | undefined) {
  if (!path) return "";
  return `${path.statementIndex}:${path.lieIndex}:${path.reactionIndex}`;
}

function statementReactionNodePathKey(path: StatementReactionNodePath | null | undefined) {
  if (!path) return "";
  return `${statementReactionPathKey(path)}:${path.childIndex}`;
}

function statementReactionPathFromNodePath(path: StatementReactionNodePath): StatementReactionPath {
  return {
    statementIndex: path.statementIndex,
    lieIndex: path.lieIndex,
    reactionIndex: path.reactionIndex
  };
}

function isSameStatementReactionPath(a: StatementReactionPath | null | undefined, b: StatementReactionPath | null | undefined) {
  return Boolean(a && b && statementReactionPathKey(a) === statementReactionPathKey(b));
}

function isSameStatementReactionNodePath(a: StatementReactionNodePath | null | undefined, b: StatementReactionNodePath | null | undefined) {
  return Boolean(a && b && statementReactionNodePathKey(a) === statementReactionNodePathKey(b));
}

function getStatementReactionAtPath(statementNodes: ResourceRecord[], path: StatementReactionPath | null | undefined) {
  if (!path) return null;
  const statementNode = statementNodes[path.statementIndex];
  const lie = getStatementLies(statementNode)[path.lieIndex];
  return asArray<ResourceRecord>(lie?.reactions)[path.reactionIndex] || null;
}

function findFirstStatementReactionPath(statementNodes: ResourceRecord[], statementIndex: number): StatementReactionPath | null {
  const statementNode = statementNodes[statementIndex];
  if (!statementNode) return null;
  const lies = getStatementLies(statementNode);
  for (let lieIndex = 0; lieIndex < lies.length; lieIndex += 1) {
    const reactions = asArray<ResourceRecord>(lies[lieIndex]?.reactions);
    if (reactions.length > 0) return { statementIndex, lieIndex, reactionIndex: 0 };
  }
  return null;
}

function normalizeStatementReactionPath(statementNodes: ResourceRecord[], path: StatementReactionPath | null): StatementReactionPath | null {
  if (!path || statementNodes.length === 0) return null;
  const statementIndex = clampListIndex(path.statementIndex, statementNodes.length);
  const lies = getStatementLies(statementNodes[statementIndex]);
  const lieIndex = clampListIndex(path.lieIndex, lies.length);
  const reactions = asArray<ResourceRecord>(lies[lieIndex]?.reactions);
  if (reactions.length === 0) return findFirstStatementReactionPath(statementNodes, statementIndex);
  return { statementIndex, lieIndex, reactionIndex: clampListIndex(path.reactionIndex, reactions.length) };
}

function normalizeStatementReactionNodePath(statementNodes: ResourceRecord[], path: StatementReactionNodePath | null): StatementReactionNodePath | null {
  if (!path) return null;
  const reactionPath = normalizeStatementReactionPath(statementNodes, path);
  if (!reactionPath) return null;
  const reaction = getStatementReactionAtPath(statementNodes, reactionPath);
  const childNodes = asArray<ResourceRecord>(reaction?.nodes);
  if (childNodes.length === 0) return null;
  return { ...reactionPath, childIndex: clampListIndex(path.childIndex, childNodes.length) };
}

function statementScrollSelector(target: StatementScrollTarget) {
  if (target.kind === "statement") return `[data-statement-target="statement:${target.statementIndex}"]`;
  if (target.kind === "reaction") return `[data-statement-target="reaction:${statementReactionPathKey(target.path)}"]`;
  return `[data-statement-target="child:${statementReactionNodePathKey(target.path)}"]`;
}

function statementReactionDisplayLabel(reaction: ResourceRecord, lie: ResourceRecord, reactionIndex: number, references: ReferenceResources) {
  if (reaction.label) return String(reaction.label);
  const kind = String(reaction.kind || "default");
  const targetId = String(reaction.target_id || "");
  if (kind === "character" && targetId) return speakerLabel(targetId, references.characters);
  if (kind === "item" && targetId) return references.items.find((item) => item.id === targetId)?.title || targetId;
  if (kind === "default") return "잘못된 연결";
  return `${lie.phrase || "반응"} ${reactionIndex + 1}`;
}

function StatementFlowNavigator({
  activeReactionPath,
  onAddReactionChild,
  onMoveStatement,
  onSelectReaction,
  onSelectReactionChild,
  onSelectStatement,
  onToggleReactionEnd,
  references,
  selectedReactionNodePath,
  selectedStatementIndex,
  statementFlowRef,
  statementNodes
}: {
  activeReactionPath: StatementReactionPath | null;
  onAddReactionChild: (path: StatementReactionPath) => void;
  onMoveStatement: (fromIndex: number, toIndex: number) => void;
  onSelectReaction: (path: StatementReactionPath) => void;
  onSelectReactionChild: (path: StatementReactionNodePath) => void;
  onSelectStatement: (index: number) => void;
  onToggleReactionEnd: (path: StatementReactionPath, checked: boolean) => void;
  references: ReferenceResources;
  selectedReactionNodePath: StatementReactionNodePath | null;
  selectedStatementIndex: number;
  statementFlowRef: MutableRefObject<HTMLDivElement | null>;
  statementNodes: ResourceRecord[];
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function dropStatement(event: ReactDragEvent<HTMLElement>, targetIndex: number) {
    event.preventDefault();
    if (dragIndex == null) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;
    let nextIndex = targetIndex + (after ? 1 : 0);
    if (dragIndex < nextIndex) nextIndex -= 1;
    onMoveStatement(dragIndex, clampListIndex(nextIndex, statementNodes.length));
    setDragIndex(null);
  }

  if (statementNodes.length === 0) {
    return <p className="empty-state">진술 목록이 비어 있습니다.</p>;
  }

  return (
    <section className="statement-flow-navigator" ref={statementFlowRef}>
      <div className="statement-flow-title">
        <b>Statement flow</b>
        <span>{statementNodes.length} nodes</span>
      </div>
      <div className="statement-flow-list">
        {statementNodes.map((node, index) => {
          const activeStatement = selectedStatementIndex === index || activeReactionPath?.statementIndex === index;
          const previewText = getDialogueVisiblePreviewText(node.text).slice(0, 52) || "빈 대사";
          const statementTarget = `statement:${index}`;
          return (
            <article
              className={`statement-flow-row ${activeStatement ? "active" : ""} ${dragIndex === index ? "dragging" : ""}`}
              data-statement-target={statementTarget}
              draggable
              key={index}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => setDragIndex(index)}
              onDrop={(event) => dropStatement(event, index)}
            >
              <div className="statement-flow-card">
                <button className="statement-flow-card-main" type="button" onClick={() => onSelectStatement(index)}>
                  <span className="statement-flow-index">{index + 1}</span>
                  <span>
                    <strong>{speakerLabel(node.speaker, references.characters)}</strong>
                    <small>{previewText}</small>
                  </span>
                </button>
                <div className="statement-flow-card-actions">
                  <button aria-label="Move statement up" disabled={index === 0} type="button" onClick={() => onMoveStatement(index, index - 1)}><Icon name="KeyboardArrowUp" /></button>
                  <button aria-label="Move statement down" disabled={index >= statementNodes.length - 1} type="button" onClick={() => onMoveStatement(index, index + 1)}><Icon name="KeyboardArrowDown" /></button>
                </div>
              </div>
              <div className="statement-flow-reactions">
                {getStatementLies(node).flatMap((lie, lieIndex) => (
                  asArray<ResourceRecord>(lie.reactions).map((reaction, reactionIndex) => {
                    const path = { statementIndex: index, lieIndex, reactionIndex };
                    const reactionKey = statementReactionPathKey(path);
                    const activeReaction = isSameStatementReactionPath(activeReactionPath, path);
                    const childNodes = asArray<ResourceRecord>(reaction.nodes);
                    return (
                      <article
                        className={`statement-flow-reaction ${activeReaction ? "active" : ""}`}
                        data-statement-target={`reaction:${reactionKey}`}
                        key={reactionKey}
                      >
                        <div className="statement-flow-reaction-header">
                          <button type="button" onClick={() => onSelectReaction(path)}>
                            <Icon name="SubdirectoryArrowRight" />
                            <span>{statementReactionDisplayLabel(reaction, lie, reactionIndex, references)}</span>
                            <small>{lie.phrase || `lie ${lieIndex + 1}`}</small>
                          </button>
                          <label title="이 반응 후 진술을 종료">
                            <input
                              checked={Boolean(reaction.statement_end)}
                              onChange={(event) => onToggleReactionEnd(path, event.target.checked)}
                              type="checkbox"
                            />
                            <span>종료</span>
                          </label>
                          <button aria-label="Add reaction node" type="button" onClick={() => onAddReactionChild(path)}><Icon name="Add" /></button>
                        </div>
                        <div className="statement-flow-child-list">
                          {childNodes.length === 0 && <span className="statement-flow-empty">반응 대사 없음</span>}
                          {childNodes.map((childNode, childIndex) => {
                            const childPath = { ...path, childIndex };
                            const childKey = statementReactionNodePathKey(childPath);
                            const childActive = isSameStatementReactionNodePath(selectedReactionNodePath, childPath);
                            return (
                              <button
                                className={`statement-flow-child ${childActive ? "active" : ""}`}
                                data-statement-target={`child:${childKey}`}
                                key={childKey}
                                type="button"
                                onClick={() => onSelectReactionChild(childPath)}
                              >
                                <span className="statement-flow-child-index">{childIndex + 1}</span>
                                <span>{dialogueNodeSummary(childNode, references)}</span>
                              </button>
                            );
                          })}
                          {childNodes.length > 0 && !reaction.statement_end && <span className="statement-flow-return">진술로 복귀</span>}
                        </div>
                      </article>
                    );
                  })
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function StatementNodesEditor({
  activeReactionPath,
  onSelectReaction,
  onSelectReactionChild,
  onSelectStatement,
  references,
  selectedReactionNodePath,
  statementNodes,
  updateStatementNode,
  removeStatementNode,
  onOpenDialogueTextContextMenu,
  visibleReactionNodePath,
  visibleReactionPath,
  visibleStatementIndex
}: {
  activeReactionPath: StatementReactionPath | null;
  onSelectReaction: (path: StatementReactionPath) => void;
  onSelectReactionChild: (path: StatementReactionNodePath) => void;
  onSelectStatement: (index: number) => void;
  references: ReferenceResources;
  selectedReactionNodePath: StatementReactionNodePath | null;
  statementNodes: ResourceRecord[];
  updateStatementNode: (index: number, node: ResourceRecord) => void;
  removeStatementNode: (index: number) => void;
  onOpenDialogueTextContextMenu?: (
    event: ReactMouseEvent<HTMLTextAreaElement | HTMLInputElement>,
    config: Omit<DialogueTextContextTarget, "textarea">
  ) => void;
  visibleReactionNodePath?: StatementReactionNodePath | null;
  visibleReactionPath?: StatementReactionPath | null;
  visibleStatementIndex?: number;
}) {
  if (statementNodes.length === 0) return null;
  const visibleStatements = statementNodes
    .map((node, index) => ({ node, index }))
    .filter(({ index }) => visibleStatementIndex === undefined || index === visibleStatementIndex);
  if (visibleStatements.length === 0) return null;

  return (
    <div className="statement-editor-list">
      {visibleStatements.map(({ node, index }) => {
        const lies = getStatementLies(node);
        const updateNode = (nextNode: ResourceRecord) => updateStatementNode(index, nextNode);
        const updateText = (text: string) => updateNode(withStatementLies({ ...node, text }, syncStatementLiesForText(text, lies)));
        const updateLie = (lieIndex: number, nextLie: ResourceRecord) => updateNode(withStatementLies(
          node,
          lies.map((lie, entryIndex) => entryIndex === lieIndex ? nextLie : lie)
        ));
        const addReaction = (lieIndex: number) => {
          const nextLies = lies.map((lie, entryIndex) => entryIndex === lieIndex
            ? { ...lie, reactions: [...asArray<ResourceRecord>(lie.reactions), defaultStatementReactionRecord("character")] }
            : lie);
          updateNode(withStatementLies(node, nextLies));
        };
        const removeReaction = (lieIndex: number, reactionIndex: number) => {
          const nextLies = lies.map((lie, entryIndex) => {
            if (entryIndex !== lieIndex) return lie;
            const nextReactions = asArray<ResourceRecord>(lie.reactions).filter((_, indexToRemove) => indexToRemove !== reactionIndex);
            return { ...lie, reactions: nextReactions.length > 0 ? nextReactions : [defaultStatementReactionRecord()] };
          });
          updateNode(withStatementLies(node, nextLies));
        };
        const visibleReaction = visibleReactionPath?.statementIndex === index ? visibleReactionPath : null;
        if (visibleReaction) {
          const lie = lies[visibleReaction.lieIndex];
          const reaction = asArray<ResourceRecord>(lie?.reactions)[visibleReaction.reactionIndex];
          if (!lie || !reaction) return null;
          return (
            <StatementReactionEditor
              activeReactionPath={activeReactionPath}
              key={`reaction-detail-${statementReactionPathKey(visibleReaction)}`}
              lie={lie}
              lieIndex={visibleReaction.lieIndex}
              onOpenDialogueTextContextMenu={onOpenDialogueTextContextMenu}
              onSelectReaction={onSelectReaction}
              onSelectReactionChild={onSelectReactionChild}
              reaction={reaction}
              reactionIndex={visibleReaction.reactionIndex}
              references={references}
              selectedReactionNodePath={selectedReactionNodePath}
              statementIndex={index}
              visibleChildIndex={isSameStatementReactionPath(visibleReactionNodePath, visibleReaction) ? visibleReactionNodePath?.childIndex : undefined}
              removeReaction={() => removeReaction(visibleReaction.lieIndex, visibleReaction.reactionIndex)}
              updateReaction={(nextReaction) => {
                const reactions = asArray<ResourceRecord>(lie.reactions);
                updateLie(visibleReaction.lieIndex, {
                  ...lie,
                  reactions: reactions.map((entry, entryIndex) => entryIndex === visibleReaction.reactionIndex ? nextReaction : entry)
                });
              }}
            />
          );
        }
        return (
          <article
            className="statement-editor"
            data-statement-target={`statement:${index}`}
            key={index}
          >
            <div className="structured-header">
              <button className="statement-select-button" type="button" onClick={() => onSelectStatement(index)}>
                Statement {index + 1}
              </button>
              <button className="danger-action" type="button" onClick={() => removeStatementNode(index)}>
                <Icon name="Delete" />삭제
              </button>
            </div>
            <div className="form-grid compact statement-form-grid">
              <SelectField
                label="Speaker"
                value={node.speaker || "narrator"}
                options={[{ id: "narrator", title: "narrator", subtitle: "built-in", type: "characters", isProtagonist: true } as ResourceSummary, ...references.characters]}
                onChange={(value) => updateNode(withSpeakerStageCastDefaults(node, value, statementNodes, index, references.characters))}
              />
              <ToggleField label="Statement end" checked={Boolean(node.statement_end)} onChange={(checked) => updateNode({ ...node, statement_end: checked })} />
            </div>
            <TextField
              label="Text"
              multiline
              value={node.text || ""}
              onChange={updateText}
              onContextMenu={onOpenDialogueTextContextMenu ? (event) => onOpenDialogueTextContextMenu(event, {
                kind: "statement",
                showStatementLie: true,
                getText: () => String(node.text || ""),
                onTextChange: updateText
              }) : undefined}
            />
            <RichTextPreview compact references={references} text={node.text || ""} />
            <DialogueChoicesEditor
              compact
              node={node}
              nodeAutoPrefix="@statement_"
              nodes={statementNodes}
              onOpenDialogueTextContextMenu={onOpenDialogueTextContextMenu}
              references={references}
              updateNode={updateNode}
            />
            <StageCastEditor
              characters={references.characters}
              nodes={statementNodes}
              selectedNodeIndex={index}
              speakerId={String(node.speaker || "")}
              speakerMystery={getNodeSpeakerMystery(node)}
              focusTargets={getNodeFocusTargets(node)}
              stageCast={node.stage_cast}
              onFocusTargetsChange={(focusTargets) => updateNode(withNodeFocusTargets(node, focusTargets))}
              onChange={(stageCast) => updateNode({ ...node, stage_cast: stageCast })}
            />
            <AcquireInfoEditor
              references={references}
              value={getNodeAcquireInfoEditorValue(node)}
              onChange={(acquireInfo) => updateNode(withNodeAcquireInfo(node, acquireInfo))}
            />
            <NodePopupsEditor
              node={node}
              popups={getNodePopupsEditorValue(node)}
              references={references}
              onChange={(popups) => updateNode(withNodePopups(node, popups))}
            />
            <div className="reaction-list">
              {lies.length === 0 && <span className="muted">[lie] 문구 없음</span>}
              {lies.map((lie, lieIndex) => (
                <details className="statement-lie-card" key={`${lie.id || "lie"}-${lieIndex}`} open>
                  <summary>
                    <b>[lie] {lie.phrase || `#${lieIndex + 1}`}</b>
                    <span>{asArray(lie.reactions).length} reactions</span>
                    <button type="button" onClick={(event) => {
                      event.preventDefault();
                      addReaction(lieIndex);
                    }}>
                      <Icon name="Add" />반응
                    </button>
                  </summary>
                  <div className="statement-reaction-stack">
                    <TextField label="Lie ID" value={lie.id || `lie_${lieIndex}`} onChange={(value) => updateLie(lieIndex, { ...lie, id: value })} />
                    <TextField label="Phrase" value={lie.phrase || ""} onChange={(value) => updateLie(lieIndex, { ...lie, phrase: value })} />
                    {asArray<ResourceRecord>(lie.reactions).map((reaction, reactionIndex) => (
                      <StatementReactionEditor
                        activeReactionPath={activeReactionPath}
                        key={`${reaction.kind || "reaction"}-${reactionIndex}`}
                        lie={lie}
                        lieIndex={lieIndex}
                        onOpenDialogueTextContextMenu={onOpenDialogueTextContextMenu}
                        onSelectReaction={onSelectReaction}
                        onSelectReactionChild={onSelectReactionChild}
                        reaction={reaction}
                        reactionIndex={reactionIndex}
                        references={references}
                        selectedReactionNodePath={selectedReactionNodePath}
                        statementIndex={index}
                        removeReaction={() => removeReaction(lieIndex, reactionIndex)}
                        updateReaction={(nextReaction) => {
                          const reactions = asArray<ResourceRecord>(lie.reactions);
                          updateLie(lieIndex, {
                            ...lie,
                            reactions: reactions.map((entry, entryIndex) => entryIndex === reactionIndex ? nextReaction : entry)
                          });
                        }}
                      />
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function StatementReactionEditor({
  activeReactionPath,
  lie,
  lieIndex,
  onOpenDialogueTextContextMenu,
  onSelectReaction,
  onSelectReactionChild,
  reaction,
  reactionIndex,
  references,
  selectedReactionNodePath,
  statementIndex,
  visibleChildIndex,
  updateReaction,
  removeReaction
}: {
  activeReactionPath: StatementReactionPath | null;
  lie: ResourceRecord;
  lieIndex: number;
  onOpenDialogueTextContextMenu?: (
    event: ReactMouseEvent<HTMLTextAreaElement | HTMLInputElement>,
    config: Omit<DialogueTextContextTarget, "textarea">
  ) => void;
  onSelectReaction: (path: StatementReactionPath) => void;
  onSelectReactionChild: (path: StatementReactionNodePath) => void;
  reaction: ResourceRecord;
  reactionIndex: number;
  references: ReferenceResources;
  selectedReactionNodePath: StatementReactionNodePath | null;
  statementIndex: number;
  visibleChildIndex?: number;
  updateReaction: (reaction: ResourceRecord) => void;
  removeReaction: () => void;
}) {
  const kind = String(reaction.kind || "default");
  const childNodes = asArray<ResourceRecord>(reaction.nodes);
  const visibleChildNodes = childNodes
    .map((childNode, childIndex) => ({ childNode, childIndex }))
    .filter(({ childIndex }) => visibleChildIndex === undefined || childIndex === visibleChildIndex);
  const targetOptions = kind === "item" ? references.items : references.characters;
  const childNodeAutoPrefix = `@reaction_${statementIndex}_${lieIndex}_${reactionIndex}_`;
  const reactionPath = { statementIndex, lieIndex, reactionIndex };
  const active = isSameStatementReactionPath(activeReactionPath, reactionPath);

  function updateChildNode(childIndex: number, nextNode: ResourceRecord) {
    updateReaction({
      ...reaction,
      nodes: childNodes.map((node, index) => index === childIndex ? nextNode : node)
    });
  }

  function removeChildNode(childIndex: number) {
    updateReaction({ ...reaction, nodes: childNodes.filter((_, index) => index !== childIndex) });
  }

  function addChildNode(mode: DialogueNodeMode) {
    const childIndex = childNodes.length;
    const nextNode = defaultNestedNode(mode);
    const inheritedNode = applyInheritedStageCastDefaults(nextNode, childIndex, [...childNodes, nextNode], references.characters);
    updateReaction({ ...reaction, nodes: [...childNodes, inheritedNode] });
  }

  function updateKind(nextKind: string) {
    updateReaction({
      ...reaction,
      kind: nextKind,
      target_id: nextKind === "default" ? "" : reaction.target_id || "",
      label: nextKind === "default" ? reaction.label || "잘못된 연결" : reaction.label || ""
    });
  }

  return (
    <article
      className={`statement-reaction-editor ${active ? "active" : ""}`}
      data-statement-target={`reaction:${statementReactionPathKey(reactionPath)}`}
    >
      <div className="structured-header">
        <button className="statement-select-button" type="button" onClick={() => onSelectReaction(reactionPath)}>
          Reaction {lieIndex + 1}-{reactionIndex + 1}
        </button>
        <button className="danger-action" type="button" onClick={removeReaction}><Icon name="Delete" />삭제</button>
      </div>
      <div className="form-grid compact statement-form-grid">
        <SelectLiteralField label="Kind" value={kind} options={["default", "character", "item"]} onChange={updateKind} />
        {kind === "default" ? (
          <label className="field-block">
            <span>Target</span>
            <input disabled readOnly type="text" value="대상 없음" />
          </label>
        ) : (
          <SelectField label={kind === "item" ? "Item" : "Character"} value={reaction.target_id || ""} options={targetOptions} onChange={(value) => updateReaction({ ...reaction, target_id: value })} />
        )}
        <TextField label="Label" value={reaction.label || ""} onChange={(value) => updateReaction({ ...reaction, label: value })} />
        <TextField label="Next" value={reaction.next || ""} onChange={(value) => updateReaction({ ...reaction, next: value })} />
        <ToggleField label="Statement end" checked={Boolean(reaction.statement_end)} onChange={(checked) => updateReaction({ ...reaction, statement_end: checked })} />
      </div>
      <div className="structured-header">
        <span>Reaction nodes</span>
        <div className="inline-actions">
          <button type="button" onClick={() => addChildNode("dialogue")}><Icon name="Add" />대사</button>
          <button type="button" onClick={() => addChildNode("stage")}><Icon name="Add" />무대</button>
          <button type="button" onClick={() => addChildNode("cutscene")}><Icon name="Add" />컷씬</button>
        </div>
      </div>
      {childNodes.length === 0 && <p className="empty-state">반응 대사 없음</p>}
      <div className="statement-child-node-list">
        {visibleChildNodes.map(({ childNode, childIndex }) => (
          <NestedDialogueNodeEditor
            active={isSameStatementReactionNodePath(selectedReactionNodePath, { ...reactionPath, childIndex })}
            key={childIndex}
            index={childIndex}
            node={childNode}
            nodeAutoPrefix={childNodeAutoPrefix}
            nodes={childNodes}
            onOpenDialogueTextContextMenu={onOpenDialogueTextContextMenu}
            onSelect={() => onSelectReactionChild({ ...reactionPath, childIndex })}
            references={references}
            removeNode={() => removeChildNode(childIndex)}
            statementTargetKey={`child:${statementReactionPathKey(reactionPath)}:${childIndex}`}
            updateNode={(nextNode) => updateChildNode(childIndex, nextNode)}
          />
        ))}
      </div>
      {childNodes.length > 0 && !reaction.statement_end && <p className="statement-reaction-return">진술로 복귀</p>}
      <span className="muted">Phrase: {lie.phrase || "미지정"}</span>
    </article>
  );
}

function NestedDialogueNodeEditor({
  active,
  index,
  node,
  nodeAutoPrefix,
  nodes,
  onSelect,
  onOpenDialogueTextContextMenu,
  references,
  updateNode,
  removeNode,
  statementTargetKey
}: {
  active?: boolean;
  index: number;
  node: ResourceRecord;
  nodeAutoPrefix: string;
  nodes: ResourceRecord[];
  onSelect?: () => void;
  onOpenDialogueTextContextMenu?: (
    event: ReactMouseEvent<HTMLTextAreaElement | HTMLInputElement>,
    config: Omit<DialogueTextContextTarget, "textarea">
  ) => void;
  references: ReferenceResources;
  updateNode: (node: ResourceRecord) => void;
  removeNode: () => void;
  statementTargetKey?: string;
}) {
  const ui = useUiText();
  const mode = getDialogueNodeMode(node);
  const cutscene = getNodeCutsceneEditorValue(node);
  const nodeOptions = useMemo(
    () => buildNodeSelectOptions(nodes, nodeAutoPrefix, references.characters),
    [nodeAutoPrefix, nodes, references.characters]
  );
  return (
    <details
      className={`statement-child-node ${active ? "active" : ""}`}
      data-statement-target={statementTargetKey}
      open={active || index === 0}
    >
      <summary onClick={onSelect}>
        <strong>{index + 1}. {dialogueNodeTitle(node, references, ui)}</strong>
        <span>{mode === "dialogue" ? getDialogueVisiblePreviewText(node.text).slice(0, 52) || "빈 대사" : dialogueNodeSummary(node, references)}</span>
      </summary>
      <div className="nested-node-grid">
        <div className="structured-header">
          <span>Nested node</span>
          <button className="danger-action" type="button" onClick={removeNode}><Icon name="Delete" />삭제</button>
        </div>
        <div className="form-grid compact">
          <SelectLiteralField
            label={ui.form.mode}
            value={mode}
            options={dialogueNodeModeOptions}
            labels={dialogueNodeModeLabels(ui)}
            onChange={(value) => {
              const nextMode = value as DialogueNodeMode;
              updateNode(nextMode === "cutscene"
                ? withNodeCutscene(node, getNodeCutsceneEditorValue(node))
                : nextMode === "stage"
                  ? withStageMode(node)
                  : withDialogueMode(node));
            }}
          />
          {mode === "dialogue" && (
            <SelectField
              label={ui.form.speaker}
              value={node.speaker || "narrator"}
              options={[{ id: "narrator", title: "narrator", subtitle: "built-in", type: "characters", isProtagonist: true } as ResourceSummary, ...references.characters]}
              onChange={(value) => updateNode(withSpeakerStageCastDefaults(node, value, nodes, index, references.characters))}
            />
          )}
        </div>
        {mode === "cutscene" ? (
          <div className="form-grid compact">
            <NumberField label={ui.form.fadeIn} value={cutscene.fade_in} min={0} step={0.1} resetValue={0} onChange={(value) => updateNode(patchCutscene(node, "fade_in", value))} />
            <NumberField label={ui.form.hold} value={cutscene.hold} min={0} step={0.1} resetValue={1} onChange={(value) => updateNode(patchCutscene(node, "hold", value))} />
            <NumberField label={ui.form.fadeOut} value={cutscene.fade_out} min={0} step={0.1} resetValue={1} onChange={(value) => updateNode(patchCutscene(node, "fade_out", value))} />
            <TextField label={ui.form.image} value={cutscene.image} onChange={(value) => updateNode(patchCutscene(node, "image", value))} />
          </div>
        ) : mode === "stage" ? (
          <>
            <div className="form-grid compact">
              <SelectField label={ui.form.nextNode} value={node.next || ""} options={nodeOptions} onChange={(value) => updateNode({ ...node, next: value })} />
              <NumberField label={ui.form.hold} value={getStageNodeHoldEditorValue(node)} min={0} step={0.1} resetValue={0} onChange={(value) => updateNode(patchStageHold(node, value))} />
            </div>
            <StageCastEditor
              characters={references.characters}
              nodes={nodes}
              selectedNodeIndex={index}
              speakerId=""
              speakerMystery={false}
              focusTargets={getNodeFocusTargets(node)}
              stageCast={node.stage_cast}
              onFocusTargetsChange={(focusTargets) => updateNode(withNodeFocusTargets(node, focusTargets))}
              onChange={(stageCast) => updateNode({ ...node, stage_cast: stageCast })}
            />
          </>
        ) : (
          <>
            <div className="form-grid compact">
              <SelectField label={ui.form.nextNode} value={node.next || ""} options={nodeOptions} onChange={(value) => updateNode({ ...node, next: value })} />
              <ToggleField label={ui.form.speakerMystery} checked={getNodeSpeakerMystery(node)} onChange={(checked) => updateNode(withNodeSpeakerMystery(node, checked, references.characters))} />
            </div>
            <TextField
              label={ui.form.text}
              multiline
              value={node.text || ""}
              onChange={(value) => updateNode({ ...node, text: value })}
              onContextMenu={onOpenDialogueTextContextMenu ? (event) => onOpenDialogueTextContextMenu(event, {
                kind: "dialogue",
                getText: () => String(node.text || ""),
                onTextChange: (nextText) => updateNode({ ...node, text: nextText })
              }) : undefined}
            />
            <RichTextPreview compact references={references} text={node.text || ""} />
            <DialogueChoicesEditor
              compact
              node={node}
              nodeAutoPrefix={nodeAutoPrefix}
              nodes={nodes}
              onOpenDialogueTextContextMenu={onOpenDialogueTextContextMenu}
              references={references}
              updateNode={updateNode}
            />
            <StageCastEditor
              characters={references.characters}
              nodes={nodes}
              selectedNodeIndex={index}
              speakerId={String(node.speaker || "")}
              speakerMystery={getNodeSpeakerMystery(node)}
              focusTargets={getNodeFocusTargets(node)}
              stageCast={node.stage_cast}
              onFocusTargetsChange={(focusTargets) => updateNode(withNodeFocusTargets(node, focusTargets))}
              onChange={(stageCast) => updateNode({ ...node, stage_cast: stageCast })}
            />
            <AcquireInfoEditor
              references={references}
              value={getNodeAcquireInfoEditorValue(node)}
              onChange={(acquireInfo) => updateNode(withNodeAcquireInfo(node, acquireInfo))}
            />
            <NodePopupsEditor
              node={node}
              popups={getNodePopupsEditorValue(node)}
              references={references}
              onChange={(popups) => updateNode(withNodePopups(node, popups))}
            />
          </>
        )}
      </div>
    </details>
  );
}

function getNodeAcquireInfoEditorValue(node: ResourceRecord) {
  const metadata = node.metadata && typeof node.metadata === "object" && !Array.isArray(node.metadata) ? node.metadata as ResourceRecord : {};
  return readAcquireInfoEditorValue(
    node.acquire_info
      ?? node.acquired_info
      ?? node.acquire_on_complete
      ?? node.rewards
      ?? metadata.acquire_info
      ?? metadata.acquired_info
      ?? metadata.acquire_on_complete
      ?? metadata.rewards
  );
}

function withNodeAcquireInfo(node: ResourceRecord, value: ResourceRecord) {
  const info = readAcquireInfoEditorValue(value);
  const next: ResourceRecord = { ...node };
  delete next.acquired_info;
  delete next.acquire_on_complete;
  delete next.rewards;
  if (next.metadata && typeof next.metadata === "object" && !Array.isArray(next.metadata)) {
    const metadata = { ...next.metadata };
    delete metadata.acquire_info;
    delete metadata.acquired_info;
    delete metadata.acquire_on_complete;
    delete metadata.rewards;
    if (Object.keys(metadata).length > 0) next.metadata = metadata;
    else delete next.metadata;
  }
  if (info.characters.length === 0 && info.items.length === 0) {
    delete next.acquire_info;
    return next;
  }
  next.acquire_info = info;
  return next;
}

function readAcquireInfoEditorValue(value: unknown): { characters: string[]; items: string[] } {
  const characters: string[] = [];
  const items: string[] = [];

  function append(target: string[], raw: unknown) {
    if (Array.isArray(raw)) {
      raw.forEach((entry) => {
        if (entry && typeof entry === "object" && !Array.isArray(entry)) {
          const record = entry as ResourceRecord;
          append(target, record.target_id ?? record.id ?? record.target);
          return;
        }
        append(target, entry);
      });
      return;
    }
    const id = String(raw || "").trim();
    if (id && !target.includes(id)) target.push(id);
  }

  function appendEntry(rawEntry: unknown) {
    if (!rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) return;
    const entry = rawEntry as ResourceRecord;
    const kind = normalizeAcquireKindForEditor(entry.kind ?? entry.type);
    const target = entry.target_id ?? entry.id ?? entry.target;
    if (kind === "character") append(characters, target);
    if (kind === "item") append(items, target);
  }

  if (Array.isArray(value)) {
    value.forEach(appendEntry);
    return { characters, items };
  }
  if (!value || typeof value !== "object") return { characters, items };
  const record = value as ResourceRecord;
  append(characters, record.characters ?? record.character_ids);
  append(items, record.items ?? record.item_ids);
  asArray(record.entries).forEach(appendEntry);
  return { characters, items };
}

function normalizeAcquireKindForEditor(value: unknown) {
  const kind = String(value || "").trim().toLowerCase();
  if (["characters", "character_info", "person"].includes(kind)) return "character";
  if (["items", "item_info"].includes(kind)) return "item";
  return kind;
}

function getNodePopupsEditorValue(node: ResourceRecord) {
  return asArray<ResourceRecord>(node.popups ?? node.popup_images);
}

function withNodePopups(node: ResourceRecord, popups: ResourceRecord[]) {
  const next: ResourceRecord = { ...node };
  delete next.popup_images;
  if (popups.length === 0) {
    delete next.popups;
    return next;
  }
  next.popups = popups;
  return next;
}

function AcquireInfoEditor({
  value,
  references,
  onChange
}: {
  value: unknown;
  references: ReferenceResources;
  onChange: (value: ResourceRecord) => void;
}) {
  const info = value && typeof value === "object" ? value as ResourceRecord : {};
  const characters = asArray(info.characters).map(String);
  const items = asArray(info.items).map(String);
  const hasValues = characters.length > 0 || items.length > 0;

  function toggle(field: "characters" | "items", id: string) {
    const values = field === "characters" ? characters : items;
    const nextValues = values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
    onChange({ ...info, characters, items, [field]: nextValues });
  }

  return (
    <details className="node-addon-editor" open={hasValues}>
      <summary>
        <strong>Acquire info</strong>
        <span>{characters.length} characters · {items.length} items</span>
      </summary>
      <div className="form-grid">
        <CheckboxList label="Characters" values={characters} options={references.characters} onToggle={(id) => toggle("characters", id)} />
        <CheckboxList label="Items" values={items} options={references.items} onToggle={(id) => toggle("items", id)} />
      </div>
    </details>
  );
}

function NodePopupsEditor({
  node,
  popups,
  references,
  onChange
}: {
  node: ResourceRecord;
  popups: unknown;
  references: ReferenceResources;
  onChange: (popups: ResourceRecord[]) => void;
}) {
  const ui = useUiText();
  const popupList = asArray<ResourceRecord>(popups ?? node.popup_images);
  const [characterDetails, setCharacterDetails] = useState<Record<string, ResourceRecord>>({});
  const [itemDetails, setItemDetails] = useState<Record<string, ResourceRecord>>({});
  const [selectedPopupIndex, setSelectedPopupIndex] = useState(0);
  const characterIdsKey = popupList
    .map((popup) => normalizePopupSourceForEditor(popup.source || popup.kind) === "character_profile" ? getPopupCharacterId(popup, node) : "")
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .join("|");
  const itemIdsKey = popupList
    .map((popup) => normalizePopupSourceForEditor(popup.source || popup.kind) === "item" ? String(popup.target_id || popup.item_id || "").trim() : "")
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .join("|");

  useEffect(() => {
    if (popupList.length === 0) {
      setSelectedPopupIndex(0);
      return;
    }
    if (selectedPopupIndex >= popupList.length) setSelectedPopupIndex(popupList.length - 1);
  }, [popupList.length, selectedPopupIndex]);

  useEffect(() => {
    const ids = characterIdsKey.split("|").filter((id) => id && !characterDetails[id]);
    if (ids.length === 0) return undefined;

    let cancelled = false;
    void Promise.all(ids.map(async (id) => {
      try {
        const result = await loadResource("characters", id);
        return [id, result.data] as const;
      } catch {
        return [id, null] as const;
      }
    })).then((loaded) => {
      if (cancelled) return;
      setCharacterDetails((previous) => {
        const next = { ...previous };
        loaded.forEach(([id, data]) => {
          if (data) next[id] = data;
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [characterDetails, characterIdsKey]);

  useEffect(() => {
    const ids = itemIdsKey.split("|").filter((id) => id && !itemDetails[id]);
    if (ids.length === 0) return undefined;

    let cancelled = false;
    void Promise.all(ids.map(async (id) => {
      try {
        const result = await loadResource("items", id);
        return [id, result.data] as const;
      } catch {
        return [id, null] as const;
      }
    })).then((loaded) => {
      if (cancelled) return;
      setItemDetails((previous) => {
        const next = { ...previous };
        loaded.forEach(([id, data]) => {
          if (data) next[id] = data;
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [itemDetails, itemIdsKey]);

  function updatePopup(index: number, patch: ResourceRecord) {
    onChange(popupList.map((popup, popupIndex) => popupIndex === index ? { ...popup, ...patch } : popup));
  }

  function addPopup() {
    onChange([
      ...popupList,
      {
        source: "character_profile",
        target_id: references.characters[0]?.id || "",
        position: "right",
        offset: [0, 0],
        size: [320, 320],
        scale: 1,
        opacity: 1,
          transition: "fade"
      }
    ]);
    setSelectedPopupIndex(popupList.length);
  }

  return (
    <details className="node-addon-editor" open={popupList.length > 0}>
      <summary>
        <strong>{ui.form.popups}</strong>
        <span>{popupList.length}개</span>
        <button type="button" onClick={(event) => {
          event.preventDefault();
          addPopup();
        }}>
          <Icon name="Add" />{ui.form.addPopup}
        </button>
      </summary>
      {popupList.length === 0 && <p className="empty-state">{ui.form.noPopups}</p>}
      {popupList.length > 0 && (
        <NodePopupLayoutPreview
          characterDetails={characterDetails}
          itemDetails={itemDetails}
          node={node}
          onMove={(index, offset, position = undefined) => updatePopup(index, { offset: [offset.x, offset.y], ...(position ? { position } : {}) })}
          onSelect={setSelectedPopupIndex}
          popups={popupList}
          selectedIndex={selectedPopupIndex}
        />
      )}
      <div className="popup-editor-list">
        {popupList.map((popup, index) => {
          const source = normalizePopupSourceForEditor(popup.source || popup.kind);
          const offset = parseCastOffset(popup.offset);
          const size = parsePopupSizePoint(popup);
          const characterId = String(popup.target_id || "").trim();
          const character = characterDetails[characterId];
          const portraitOptions = source === "character_profile" ? popupPortraitSelectOptions(character, String(popup.portrait || "")) : [];
          return (
            <article className={`popup-editor-card ${selectedPopupIndex === index ? "active" : ""}`} key={index} onFocus={() => setSelectedPopupIndex(index)} onClick={() => setSelectedPopupIndex(index)}>
              <div className="structured-header">
                <span>{ui.form.popups} {index + 1}</span>
                <button className="danger-action" type="button" onClick={() => onChange(popupList.filter((_, popupIndex) => popupIndex !== index))}>
                  <Icon name="Delete" />{ui.common.delete}
                </button>
              </div>
              <div className="form-grid compact">
                <SelectLiteralField
                  label={ui.form.popupKind}
                  value={source}
                  options={["character_profile", "item", "image"]}
                  labels={popupSourceLabels(ui)}
                  onChange={(value) => updatePopup(index, { source: value, target_id: "", path: "", portrait: "" })}
                />
                {source === "image" ? (
                  <TextField label={ui.form.popupImagePath} value={popup.path || popup.image || ""} onChange={(value) => updatePopup(index, { path: value })} />
                ) : (
                  <SelectField
                    label={source === "item" ? ui.form.popupItem : ui.form.popupCharacter}
                    value={popup.target_id || ""}
                    options={source === "item" ? references.items : references.characters}
                    onChange={(value) => updatePopup(index, { target_id: value, portrait: "" })}
                  />
                )}
                {source === "character_profile" && (
                  portraitOptions.length > 0 ? (
                    <label className="field-block">
                      <span>{ui.form.portrait}</span>
                      <select value={String(popup.portrait || "")} onChange={(event) => updatePopup(index, { portrait: event.target.value })}>
                        <option value="">{ui.form.popupPortraitDefault}</option>
                        {portraitOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                  ) : (
                    <TextField label={ui.form.portrait} value={popup.portrait || ""} onChange={(value) => updatePopup(index, { portrait: value })} />
                  )
                )}
                <SelectLiteralField
                  label={ui.form.position}
                  value={popup.position || "center"}
                  options={["left", "center", "right", "top_left", "top_right", "custom"]}
                  labels={popupPositionLabels(ui)}
                  onChange={(value) => updatePopup(index, { position: value })}
                />
                <NumberField label={ui.form.offsetX} value={offset.x} step={0.01} resetValue={0} onChange={(value) => updatePopup(index, { offset: [value, offset.y] })} />
                <NumberField label={ui.form.offsetY} value={offset.y} step={0.01} resetValue={0} onChange={(value) => updatePopup(index, { offset: [offset.x, value] })} />
                <NumberField label={ui.form.popupWidth} value={size.x} min={1} step={10} resetValue={320} onChange={(value) => updatePopup(index, { size: [value, size.y] })} />
                <NumberField label={ui.form.popupHeight} value={size.y} min={1} step={10} resetValue={320} onChange={(value) => updatePopup(index, { size: [size.x, value] })} />
                <NumberField label={ui.form.popupScale} value={popup.scale ?? 1} min={0.25} max={3} step={0.05} resetValue={1} onChange={(value) => updatePopup(index, { scale: value })} />
                <NumberField label={ui.form.opacity} value={popup.opacity ?? 1} min={0} max={1} step={0.05} resetValue={1} onChange={(value) => updatePopup(index, { opacity: value })} />
                <SelectLiteralField
                  label={ui.form.popupTransition}
                  value={popup.transition || "fade"}
                  options={["fade", "pop", "slide", "none"]}
                  labels={popupTransitionLabels(ui)}
                  onChange={(value) => updatePopup(index, { transition: value })}
                />
                {source === "image" && (
                  <>
                    <SelectLiteralField
                      label={ui.form.popupImageMode}
                      value={popup.image_mode || "fit"}
                      options={["fit", "cover", "crop"]}
                      labels={popupImageModeLabels(ui)}
                      onChange={(value) => updatePopup(index, { image_mode: value })}
                    />
                    <NumberField label={ui.form.popupImageZoom} value={popup.image_zoom ?? 1} min={0.25} max={6} step={0.05} resetValue={1} onChange={(value) => updatePopup(index, { image_zoom: value })} />
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </details>
  );
}

type PopupPreviewEntry = {
  index: number;
  source: string;
  label: string;
  imagePath: string;
  center: PointerPoint;
  profile: ResourceRecord;
  position: string;
  offset: PointerPoint;
  size: PointerPoint;
  scale: number;
  opacity: number;
  imageMode: string;
  imageZoom: number;
};
type PopupLayoutDrag = {
  pointerId: number;
  index: number;
  target: HTMLElement;
  startX: number;
  startY: number;
  centerX: number;
  centerY: number;
};

function NodePopupLayoutPreview({
  characterDetails,
  itemDetails,
  node,
  onMove,
  onSelect,
  popups,
  selectedIndex
}: {
  characterDetails: Record<string, ResourceRecord>;
  itemDetails: Record<string, ResourceRecord>;
  node: ResourceRecord;
  onMove: (index: number, offset: PointerPoint, position?: string) => void;
  onSelect: (index: number) => void;
  popups: ResourceRecord[];
  selectedIndex: number;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<PopupLayoutDrag | null>(null);
  const dragLock = useMobileDragLock();
  const entries = popups.map((popup, index) => buildPopupPreviewEntry(popup, index, node, characterDetails, itemDetails));
  const selectedEntry = entries[selectedIndex];

  function stagePoint(event: ReactPointerEvent<HTMLElement>) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: (event.clientX - rect.left) / rect.width * gameReferenceWidth,
      y: (event.clientY - rect.top) / rect.height * gameReferenceHeight
    };
  }

  function startDrag(event: ReactPointerEvent<HTMLElement>, entry: PopupPreviewEntry) {
    onSelect(entry.index);
    if (event.button !== 0) return;
    if (dragLock.locked) return;
    const point = stagePoint(event);
    if (!point) return;
    const center = getPopupPreviewCenter(entry);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      index: entry.index,
      target: event.currentTarget,
      startX: point.x,
      startY: point.y,
      centerX: center.x * gameReferenceWidth,
      centerY: center.y * gameReferenceHeight
    };
    event.preventDefault();
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    if (dragLock.locked) return;
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const point = stagePoint(event);
    if (!point) return;
    const nextCenter = {
      x: (drag.centerX + point.x - drag.startX) / gameReferenceWidth,
      y: (drag.centerY + point.y - drag.startY) / gameReferenceHeight
    };
    onMove(drag.index, {
      x: round4Number(nextCenter.x - popupPositionPresets.custom.x),
      y: round4Number(nextCenter.y - popupPositionPresets.custom.y)
    }, "custom");
    event.preventDefault();
  }

  function stopDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    try {
      drag.target.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may be released by the browser first.
    }
  }

  return (
    <div className="node-popup-layout-preview">
      <div className="coordinate-editor-header">
        <span>Popup layout</span>
        <div className="coordinate-editor-meta">
          <DragLockToggle
            available={dragLock.available}
            locked={dragLock.locked}
            onToggle={dragLock.toggle}
          />
        </div>
      </div>
      <div
        className={`node-popup-preview-stage ${dragLock.locked ? "drag-locked" : ""}`}
        onPointerCancel={stopDrag}
        onPointerMove={moveDrag}
        onPointerUp={stopDrag}
        ref={stageRef}
      >
        <DragLockHint available={dragLock.available} locked={dragLock.locked} onToggle={dragLock.toggle} />
        <div className="node-popup-preview-playfield" />
        <div className="node-popup-preview-dialogue-panel">
          <strong>{String(node.speaker || "narrator")}</strong>
          <span>{String(node.text || "")}</span>
        </div>
        {entries.map((entry) => (
          <div
            className={`node-popup-frame ${selectedIndex === entry.index ? "selected" : ""}`}
            key={entry.index}
            onPointerDown={(event) => startDrag(event, entry)}
            style={getPopupPreviewFrameStyle(entry)}
          >
            <PopupPreviewCanvas entry={entry} />
            <span>{entry.label}</span>
          </div>
        ))}
      </div>
      <div className="node-popup-preview-meta">
        <code>{selectedEntry ? `Popup ${selectedEntry.index + 1} · ${selectedEntry.position} · offset ${formatNumberInput(selectedEntry.offset.x)},${formatNumberInput(selectedEntry.offset.y)}` : "popup 없음"}</code>
        {selectedEntry && (
          <CoordinateNudgeToolbar
            label="Popup offset"
            min={-1}
            max={1}
            onChange={(x, y) => onMove(selectedEntry.index, { x: round4Number(x), y: round4Number(y) })}
            resetX={0}
            resetY={0}
            x={selectedEntry.offset.x}
            y={selectedEntry.offset.y}
          />
        )}
      </div>
    </div>
  );
}

function PopupPreviewCanvas({ entry }: { entry: PopupPreviewEntry }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageUrl = resPathToAssetUrl(entry.imagePath);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let image: HTMLImageElement | null = null;

    function redraw() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width || entry.size.x));
      const height = Math.max(1, Math.round(rect.height || entry.size.y));
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(9, 8, 8, 0.86)";
      ctx.fillRect(0, 0, width, height);
      if (!image) {
        ctx.fillStyle = "rgba(203, 211, 224, 0.72)";
        ctx.font = "700 12px Pretendard, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("이미지 없음", width * 0.5, height * 0.5);
        return;
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.clip();
      if (entry.source === "character_profile") {
        const profileOffset = getProfileOffset(entry.profile);
        const baseScale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
        const drawW = image.naturalWidth * baseScale * getProfileZoom(entry.profile.zoom);
        const drawH = image.naturalHeight * baseScale * getProfileZoom(entry.profile.zoom);
        const anchorX = width * 0.5 + profileOffset.x * width;
        const anchorY = height * 0.5 + profileOffset.y * height;
        ctx.drawImage(
          image,
          Math.round(anchorX - entry.center.x * drawW),
          Math.round(anchorY - entry.center.y * drawH),
          Math.max(1, Math.round(drawW)),
          Math.max(1, Math.round(drawH))
        );
      } else {
        const mode = entry.imageMode === "cover" || entry.imageMode === "crop" ? "cover" : "fit";
        const baseScale = mode === "cover"
          ? Math.max(width / image.naturalWidth, height / image.naturalHeight)
          : Math.min(width / image.naturalWidth, height / image.naturalHeight);
        const drawW = image.naturalWidth * baseScale * entry.imageZoom;
        const drawH = image.naturalHeight * baseScale * entry.imageZoom;
        ctx.drawImage(
          image,
          Math.round(width * 0.5 - drawW * 0.5),
          Math.round(height * 0.5 - drawH * 0.5),
          Math.max(1, Math.round(drawW)),
          Math.max(1, Math.round(drawH))
        );
      }
      ctx.restore();
    }

    redraw();
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(redraw);
      resizeObserver.observe(canvas);
    }
    if (imageUrl) {
      loadImageElement(imageUrl)
        .then((loaded) => {
          if (cancelled) return;
          image = loaded;
          redraw();
        })
        .catch(() => {
          if (cancelled) return;
          image = null;
          redraw();
        });
    }

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, [entry.center.x, entry.center.y, entry.imageMode, entry.imagePath, entry.imageZoom, entry.profile, entry.size.x, entry.size.y, entry.source, imageUrl]);

  return <canvas aria-hidden="true" ref={canvasRef} />;
}

function normalizePopupSourceForEditor(value: unknown) {
  const text = String(value || "character_profile").trim().toLowerCase();
  if (["character", "profile", "portrait_profile"].includes(text)) return "character_profile";
  if (["item", "item_image"].includes(text)) return "item";
  if (["image", "path", "direct"].includes(text)) return "image";
  if (["character_profile", "item", "image"].includes(text)) return text;
  return "character_profile";
}

function getPopupCharacterId(popup: ResourceRecord, node: ResourceRecord) {
  const targetId = String(popup.target_id || popup.character_id || "").trim();
  if (targetId) return targetId;
  const speakerId = String(node.speaker || "").trim();
  return speakerId && speakerId !== "narrator" ? speakerId : "";
}

function buildPopupPreviewEntry(
  popup: ResourceRecord,
  index: number,
  node: ResourceRecord,
  characterDetails: Record<string, ResourceRecord>,
  itemDetails: Record<string, ResourceRecord>
): PopupPreviewEntry {
  const source = normalizePopupSourceForEditor(popup.source || popup.kind);
  const offset = parseCastOffset(popup.offset);
  const size = parsePopupSizePoint(popup);
  const position = popupPositionPresets[String(popup.position || "center")] ? String(popup.position || "center") : "center";
  const scale = normalizeNumber(popup.scale, 1, 0.25, 3);
  const opacity = normalizeNumber(popup.opacity, 1, 0, 1);
  const imageMode = ["fit", "cover", "crop"].includes(String(popup.image_mode || popup.fit || "fit")) ? String(popup.image_mode || popup.fit || "fit") : "fit";
  const imageZoom = normalizeNumber(popup.image_zoom, 1, 0.25, 6);
  if (source === "item") {
    const itemId = String(popup.target_id || popup.item_id || "").trim();
    const item = itemDetails[itemId];
    return {
      index,
      source,
      label: item?.name || item?.display_name || item?.title || itemId || `Popup ${index + 1}`,
      imagePath: String(item?.image || ""),
      center: { x: 0.5, y: 0.5 },
      profile: {},
      position,
      offset,
      size,
      scale,
      opacity,
      imageMode,
      imageZoom
    };
  }
  if (source === "image") {
    return {
      index,
      source,
      label: String(popup.id || popup.path || popup.image || `Popup ${index + 1}`),
      imagePath: String(popup.path || popup.image || ""),
      center: { x: 0.5, y: 0.5 },
      profile: {},
      position,
      offset,
      size,
      scale,
      opacity,
      imageMode,
      imageZoom
    };
  }

  const characterId = getPopupCharacterId(popup, node);
  const character = characterDetails[characterId];
  const profileInfo = resolvePopupCharacterProfileInfo(popup, character);
  return {
    index,
    source,
    label: characterLabel(characterId, character, []),
    imagePath: profileInfo.path,
    center: profileInfo.center,
    profile: profileInfo.profile,
    position,
    offset,
    size,
    scale,
    opacity,
    imageMode,
    imageZoom
  };
}

function resolvePopupCharacterProfileInfo(popup: ResourceRecord, character: ResourceRecord | undefined) {
  if (!character) return { path: "", center: { x: 0.5, y: 0.5 }, profile: {} };
  const portraits = character.portraits && typeof character.portraits === "object"
    ? character.portraits as Record<string, ResourceRecord | string>
    : {};
  let portraitKey = String(popup.portrait || character.profile?.portrait || "").trim();
  if (!portraitKey && portraits.default) portraitKey = "default";
  if (!portraitKey) {
    portraitKey = Object.keys(portraits).find((key) => {
      const entry = portraits[key];
      return typeof entry === "string" || Boolean((entry as ResourceRecord)?.path);
    }) || "";
  }
  const entry = portraitKey ? portraits[portraitKey] : null;
  if (!entry) return { path: "", center: { x: 0.5, y: 0.5 }, profile: character.profile && typeof character.profile === "object" ? character.profile as ResourceRecord : {} };
  if (typeof entry === "string") {
    return {
      path: entry,
      center: { x: 0.5, y: 0.5 },
      profile: character.profile && typeof character.profile === "object" ? character.profile as ResourceRecord : {}
    };
  }
  return {
    path: String(entry.path || ""),
    center: {
      x: clamp01Number(asArray<number>(entry.center)[0], 0.5),
      y: clamp01Number(asArray<number>(entry.center)[1], 0.5)
    },
    profile: entry.profile && typeof entry.profile === "object"
      ? entry.profile as ResourceRecord
      : (character.profile && typeof character.profile === "object" ? character.profile as ResourceRecord : {})
  };
}

function parsePopupSizePoint(popup: ResourceRecord) {
  if (popup.size !== undefined) return parseSizePoint(popup.size, popupDefaultSize);
  return {
    x: normalizeNumber(popup.width, popupDefaultSize.x, 1),
    y: normalizeNumber(popup.height, popupDefaultSize.y, 1)
  };
}

function getPopupPreviewCenter(entry: PopupPreviewEntry) {
  const anchor = popupPositionPresets[entry.position] || popupPositionPresets.center;
  return {
    x: anchor.x + entry.offset.x,
    y: anchor.y + entry.offset.y
  };
}

function getPopupPreviewFrameStyle(entry: PopupPreviewEntry) {
  const center = getPopupPreviewCenter(entry);
  const width = Math.max(1, entry.size.x * entry.scale);
  const height = Math.max(1, entry.size.y * entry.scale);
  return {
    left: `${center.x * 100}%`,
    top: `${center.y * 100}%`,
    width: `${width / gameReferenceWidth * 100}%`,
    height: `${height / gameReferenceHeight * 100}%`,
    opacity: entry.opacity,
    zIndex: entry.index + 1
  } as CSSProperties;
}

function PreviewPanel({
  draft,
  issues,
  type
}: {
  draft: ResourceRecord | null;
  issues: ValidationIssue[];
  type: ResourceType;
}) {
  const ui = useUiText();
  const language = useContext(LanguageContext);
  if (!draft) return <p className="empty-state">{ui.preview.select}</p>;

  const cards = [
    { label: ui.preview.title, value: titleFor(type, draft, draft.id || "") },
    { label: ui.preview.summary, value: describeResourceForLanguage(type, draft, language) },
    { label: "ID", value: draft.id || "-" }
  ];

  if (type === "dialogues") {
    cards.push({ label: ui.preview.eventTags, value: String(countEventTags(asArray<ResourceRecord>(draft.nodes))) });
  }
  if (type === "chapters") {
    cards.push({ label: ui.preview.parallaxLayers, value: String(asArray(draft.parallax?.layers).length) });
  }

  return (
    <div className="preview-panel">
      <div className="preview-grid">
        {cards.map((card) => (
          <article className="preview-tile" key={card.label}>
            <b>{card.label}</b>
            <span>{card.value}</span>
          </article>
        ))}
      </div>
      <div className="issue-list embedded">
        {issues.map((issue, index) => (
          <article className={`issue ${issue.severity}`} key={`${issue.message}-${index}`}>
            <Icon name={issue.severity === "info" ? "CheckCircle" : "Warning"} />
            <span>{issue.message}</span>
          </article>
        ))}
      </div>
    </div>
  );
}

function previewModeLabel(mode: PreviewMode, ui: EditorCopy) {
  if (mode === "pc") return ui.preview.pc;
  if (mode === "fold7") return ui.preview.fold7;
  if (mode === "fold7-open") return ui.preview.fold7Open;
  return ui.preview.web;
}

function TextField({
  label,
  value,
  onChange,
  multiline,
  previewText,
  type = "text",
  readOnly = false,
  onBlur,
  onKeyDown,
  onContextMenu
}: {
  label: string;
  value: unknown;
  onChange: (value: string) => void;
  multiline?: boolean;
  previewText?: string;
  type?: "text" | "number" | "color-text";
  readOnly?: boolean;
  onBlur?: () => void;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onContextMenu?: (event: ReactMouseEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
}) {
  const stringValue = value === undefined || value === null ? "" : String(value);
  if (type === "color-text") {
    return (
      <ColorTextField
        label={label}
        previewText={previewText}
        readOnly={readOnly}
        value={stringValue}
        onChange={onChange}
      />
    );
  }

  return (
    <label className={`field-block ${multiline ? "wide" : ""} ${readOnly ? "read-only" : ""}`}>
      <span>{label}</span>
      {multiline ? (
        <textarea readOnly={readOnly} spellCheck={false} value={stringValue} onBlur={onBlur} onChange={(event) => onChange(event.target.value)} onContextMenu={onContextMenu} onKeyDown={onKeyDown} />
      ) : (
        <input readOnly={readOnly} spellCheck={false} value={stringValue} onBlur={onBlur} onChange={(event) => onChange(event.target.value)} onContextMenu={onContextMenu} onKeyDown={onKeyDown} type={type === "number" ? "number" : "text"} />
      )}
    </label>
  );
}

function ColorTextField({
  label,
  value,
  onChange,
  previewText,
  readOnly = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  previewText?: string;
  readOnly?: boolean;
}) {
  const cleanValue = value.trim();
  const hasValue = cleanValue.length > 0;
  const isValid = !hasValue || isHexColorText(cleanValue);
  const previewColor = isValid ? sanitizeHexColor(cleanValue, "#ffffff") : "#ffffff";
  const previewLabel = previewText?.trim() || label;
  const previewStyle = { "--name-color-preview": previewColor } as CSSProperties & Record<string, string>;

  return (
    <label className={`field-block color-field ${readOnly ? "read-only" : ""} ${isValid ? "" : "invalid"}`}>
      <span>{label}</span>
      <div className="color-field-preview" style={previewStyle}>
        <span className="color-preview-swatch" aria-hidden="true" />
        <strong>{previewLabel}</strong>
      </div>
      <div className="color-field-control">
        <input
          aria-invalid={!isValid}
          pattern="#?[0-9a-fA-F]{6}"
          readOnly={readOnly}
          spellCheck={false}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          aria-label={`${label} color picker`}
          className="color-picker-input"
          disabled={readOnly}
          type="color"
          value={sanitizeHexColor(cleanValue, "#ffffff").toLowerCase()}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
      </div>
    </label>
  );
}

function isHexColorText(value: unknown) {
  const text = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(text) || /^[0-9a-f]{6}$/i.test(text);
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  resetValue
}: {
  label: string;
  value: unknown;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  resetValue?: number;
}) {
  const numericValue = normalizeNumber(value, resetValue ?? 0, min, max);

  function commit(nextValue: number) {
    onChange(normalizeNumber(nextValue, numericValue, min, max));
  }

  return (
    <div className="field-block number-field">
      <span>{label}</span>
      <div className="number-control">
        <button aria-label={`${label} decrease`} type="button" onClick={() => commit(roundForInput(numericValue - step))}>
          <Icon name="Remove" />
        </button>
        <input
          inputMode="decimal"
          max={max}
          min={min}
          onChange={(event) => commit(Number(event.target.value))}
          step={step}
          type="number"
          value={formatNumberInput(numericValue)}
        />
        <button aria-label={`${label} increase`} type="button" onClick={() => commit(roundForInput(numericValue + step))}>
          <Icon name="Add" />
        </button>
        {resetValue !== undefined && (
          <button aria-label={`${label} reset`} className="number-reset" type="button" onClick={() => commit(resetValue)}>
            <Icon name="RestartAlt" />
          </button>
        )}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: unknown;
  options: ResourceSummary[];
  onChange: (value: string) => void;
}) {
  const currentValue = String(value || "");
  const optionIds = new Set(options.map((option) => option.id));
  const ui = useUiText();
  return (
    <label className="field-block">
      <span>{label}</span>
      <select value={currentValue} onChange={(event) => onChange(event.target.value)}>
        <option value="">{ui.common.unspecified}</option>
        {currentValue && !optionIds.has(currentValue) && <option value={currentValue}>{ui.common.currentMissing}: {currentValue} · {ui.common.missing}</option>}
        {options.map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}
      </select>
    </label>
  );
}

function SelectLiteralField({
  label,
  value,
  options,
  labels,
  onChange
}: {
  label: string;
  value: unknown;
  options: string[];
  labels?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field-block">
      <span>{label}</span>
      <select value={String(value || "")} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{labels?.[option] || option}</option>)}
      </select>
    </label>
  );
}

function JsonCodeEditor({
  value,
  invalid,
  label,
  placeholder,
  placeholderText,
  onChange,
  onView
}: {
  value: string;
  invalid: boolean;
  label: string;
  placeholder?: string;
  placeholderText?: string;
  onChange: (value: string) => void;
  onView: (view: EditorView | null) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const applyingExternalChangeRef = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!hostRef.current) return undefined;
    const view = new EditorView({
      doc: value,
      parent: hostRef.current,
      extensions: [
        basicSetup,
        json(),
        syntaxHighlighting(jsonEditorHighlightStyle),
        editorPlaceholder(placeholderText || placeholder || ""),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (!update.docChanged || applyingExternalChangeRef.current) return;
          onChangeRef.current(update.state.doc.toString());
        })
      ]
    });

    viewRef.current = view;
    onView(view);
    return () => {
      onView(null);
      view.destroy();
      viewRef.current = null;
    };
  }, [label, onView, placeholder, placeholderText]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value === current) return;
    applyingExternalChangeRef.current = true;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value }
    });
    applyingExternalChangeRef.current = false;
  }, [value]);

  return (
    <div
      aria-invalid={invalid}
      aria-label={label}
      className="json-code-editor"
      ref={hostRef}
    />
  );
}

function JsonErrorPanel({ error, onJump }: { error: JsonEditorError; onJump: () => void }) {
  const ui = useUiText();
  const location = error.line && error.column
    ? `${error.line}줄 ${error.column}열`
    : error.position !== undefined
      ? `position ${error.position}`
      : "위치 확인 불가";
  return (
    <div className="json-error-panel" role="alert">
      <div className="json-error-panel-header">
        <div>
          <strong>{location}</strong>
          <span>{error.message}</span>
        </div>
        <button disabled={error.position === undefined && (!error.line || !error.column)} type="button" onClick={onJump}>
          {ui.common.goToPosition}
        </button>
      </div>
      {error.excerpt && <pre><code>{error.excerpt}</code></pre>}
    </div>
  );
}

function CheckboxList({
  label,
  values,
  options,
  onToggle
}: {
  label: string;
  values: string[];
  options: ResourceSummary[];
  onToggle: (id: string) => void;
}) {
  const optionIds = new Set(options.map((option) => option.id));
  const missingValues = values.filter((value) => value && !optionIds.has(value));
  const ui = useUiText();
  return (
    <fieldset className="wide checkbox-list">
      <legend>{label}</legend>
      {options.length === 0 && missingValues.length === 0 && <span className="muted">{ui.common.noneAvailable}</span>}
      {options.map((option) => (
        <label key={option.id}>
          <input checked={values.includes(option.id)} onChange={() => onToggle(option.id)} type="checkbox" />
          <span>{option.title}</span>
        </label>
      ))}
      {missingValues.map((id) => (
        <label className="missing" key={id}>
          <input checked onChange={() => onToggle(id)} type="checkbox" />
          <span>{id} · {ui.common.missing}</span>
        </label>
      ))}
    </fieldset>
  );
}

function UploadField({
  disabled = false,
  label,
  accept,
  onUpload
}: {
  disabled?: boolean;
  label: string;
  accept: string;
  onUpload: (file: File) => Promise<string | void>;
}) {
  const ui = useUiText();
  const [busy, setBusy] = useState(false);
  const [lastPath, setLastPath] = useState("");

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || disabled) return;

    setBusy(true);
    setLastPath("");
    try {
      const path = await onUpload(file);
      if (path) setLastPath(path);
    } catch (error) {
      setLastPath(`오류: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  const hasError = lastPath.startsWith("오류:");

  return (
    <label className={`upload-field ${disabled ? "disabled" : ""} ${busy ? "busy" : ""}`}>
      <span>{busy ? ui.common.uploading : label}</span>
      <input accept={accept} disabled={disabled || busy} onChange={handleChange} type="file" />
      {lastPath && <code className={`upload-result ${hasError ? "error" : ""}`}>{lastPath}</code>}
    </label>
  );
}

function ItemImagePreview({ imagePath }: { imagePath: unknown }) {
  const imageUrl = resPathToAssetUrl(imagePath);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">(imageUrl ? "loading" : "idle");

  useEffect(() => {
    setStatus(imageUrl ? "loading" : "idle");
  }, [imageUrl]);

  return (
    <div className={`wide asset-preview-box square ${status === "error" ? "error" : ""}`}>
      {imageUrl && status !== "error" ? (
        <img alt="" onError={() => setStatus("error")} onLoad={() => setStatus("loaded")} src={imageUrl} />
      ) : (
        <span>{imagePath ? "이미지를 불러올 수 없습니다" : "아이템 사진 없음"}</span>
      )}
      {imageUrl && <span className={`asset-preview-status ${status}`}>{mediaPreviewStatusLabel(status, "image")}</span>}
    </div>
  );
}

function StoryAssetMediaPreview({ asset, kind }: { asset: ResourceRecord; kind: string }) {
  const url = resPathToAssetUrl(asset.path);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">(url ? "loading" : "idle");

  useEffect(() => {
    setStatus(url ? "loading" : "idle");
  }, [url, kind]);

  return (
    <div className={`wide asset-preview-box ${status === "error" ? "error" : ""}`}>
      {!url ? (
        <span>{asset.path ? "에셋 경로 확인 필요" : "에셋 없음"}</span>
      ) : kind === "background" ? (
        status === "error" ? (
          <span>배경 이미지를 불러올 수 없습니다</span>
        ) : (
          <img alt="" onError={() => setStatus("error")} onLoad={() => setStatus("loaded")} src={url} />
        )
      ) : (
        <div className="asset-audio-preview">
          <span>{kind === "bgm" ? "BGM 미리듣기" : "SFX 미리듣기"}</span>
          <audio controls onError={() => setStatus("error")} onLoadedMetadata={() => setStatus("loaded")} preload="metadata" src={url} />
          {status === "error" && <b>오디오를 불러올 수 없습니다</b>}
        </div>
      )}
      {url && <span className={`asset-preview-status ${status}`}>{mediaPreviewStatusLabel(status, kind === "background" ? "image" : "audio")}</span>}
    </div>
  );
}

function mediaPreviewStatusLabel(status: "idle" | "loading" | "loaded" | "error", mediaType: "image" | "audio") {
  if (status === "loading") return mediaType === "image" ? "이미지 불러오는 중..." : "오디오 메타데이터 확인 중...";
  if (status === "loaded") return mediaType === "image" ? "이미지 로드됨" : "오디오 로드됨";
  if (status === "error") return mediaType === "image" ? "이미지 로드 실패" : "오디오 로드 실패";
  return "";
}

function getResourceChapterScopeIds(resource: ResourceRecord) {
  const metadata = normalizeJsonObject(resource.metadata);
  return normalizeIdList(resource.chapters ?? resource.chapter_ids ?? metadata.chapters ?? metadata.chapter_ids);
}

function getActiveDialogueChapterIds(draft: ResourceRecord | null, resourceChapterFilters: string[]) {
  const chapterFilter = resourceChapterFilters.find((filter) => filter.startsWith("chapter:"));
  if (chapterFilter) return [chapterFilter.slice("chapter:".length)];
  if (!draft) return [];
  return getResourceChapterScopeIds(draft);
}

function buildDialogueStartOptions(dialogue: ResourceRecord, characters: ResourceSummary[]) {
  const nodeOptions = buildNodeSelectOptions(asArray<ResourceRecord>(dialogue.nodes), "@", characters);
  const statementOptions = asArray<unknown>(dialogue.statement_nodes).map((entry, index) => {
    if (typeof entry === "string") {
      const id = normalizeSingleId(entry);
      return {
        id,
        title: id || `@statement_${index}`,
        subtitle: "statement link",
        type: "dialogues"
      } as ResourceSummary;
    }
    const node = entry && typeof entry === "object" && !Array.isArray(entry) ? entry as ResourceRecord : {};
    const id = resolveNodeId(node, index, "@statement_");
    return {
      id,
      title: `${id} · statement`,
      subtitle: getDialogueVisiblePreviewText(node.text).slice(0, 72),
      type: "dialogues"
    } as ResourceSummary;
  }).filter((option) => option.id);
  return [...nodeOptions, ...statementOptions];
}

function getDialogueDefaultStartId(dialogue: ResourceRecord) {
  const nodes = asArray<ResourceRecord>(dialogue.nodes);
  if (nodes.length > 0) return resolveNodeId(nodes[0], 0, "@");
  const statementNodes = asArray<unknown>(dialogue.statement_nodes);
  if (statementNodes.length === 0) return "";
  const firstStatement = statementNodes[0];
  if (typeof firstStatement === "string") return normalizeSingleId(firstStatement);
  const node = firstStatement && typeof firstStatement === "object" && !Array.isArray(firstStatement) ? firstStatement as ResourceRecord : {};
  return resolveNodeId(node, 0, "@statement_");
}

function normalizeDialoguePresentationMode(value: unknown) {
  const mode = String(value || "").trim().toLowerCase();
  if (mode === "statement" || mode === "진술") return "statement";
  if (["investigation", "investigate", "search", "조사", "조사모드"].includes(mode)) return "investigation";
  if (["talk", "conversation", "dialogue_topics", "대화", "자율대화"].includes(mode)) return "talk";
  return "normal";
}

function withDialogueMetadataEntry(dialogue: ResourceRecord, key: string, value: unknown) {
  const metadata = { ...normalizeJsonObject(dialogue.metadata) };
  const cleanValue = normalizeSingleId(value);
  if (cleanValue) metadata[key] = cleanValue;
  else delete metadata[key];
  return withDialogueMetadata(dialogue, metadata);
}

function withDialoguePresentationMode(dialogue: ResourceRecord, value: unknown) {
  const metadata = { ...normalizeJsonObject(dialogue.metadata) };
  const mode = normalizeDialoguePresentationMode(value);
  if (mode === "statement") metadata.presentation_mode = "statement";
  else if (mode === "investigation") metadata.presentation_mode = "investigation";
  else if (mode === "talk") metadata.presentation_mode = "talk";
  else delete metadata.presentation_mode;
  return withDialogueMetadata(dialogue, metadata);
}

function withDialogueMetadata(dialogue: ResourceRecord, metadata: ResourceRecord) {
  const next = { ...dialogue };
  if (Object.keys(metadata).length > 0) next.metadata = metadata;
  else delete next.metadata;
  return next;
}

function isStatementNotebookScopeConfigured(metadata: ResourceRecord) {
  return metadata.statement_notebook && typeof metadata.statement_notebook === "object" && !Array.isArray(metadata.statement_notebook);
}

function getStatementNotebookScope(metadata: ResourceRecord) {
  const scope = isStatementNotebookScopeConfigured(metadata) ? metadata.statement_notebook as ResourceRecord : {};
  return {
    characters: normalizeIdList(scope.characters ?? scope.character_ids),
    items: normalizeIdList(scope.items ?? scope.item_ids)
  };
}

function defaultStatementNotebookScope(characters: ResourceSummary[], items: ResourceSummary[]) {
  return {
    characters: characters.map((entry) => entry.id).filter(Boolean),
    items: items.map((entry) => entry.id).filter(Boolean)
  };
}

function toggleNotebookScopeId(
  scope: { characters: string[]; items: string[] },
  field: "characters" | "items",
  id: string
) {
  const current = new Set(scope[field]);
  if (current.has(id)) current.delete(id);
  else current.add(id);
  return {
    ...scope,
    [field]: [...current]
  };
}

function withStatementNotebookScope(dialogue: ResourceRecord, scope: { characters: string[]; items: string[] }) {
  const metadata = { ...normalizeJsonObject(dialogue.metadata) };
  metadata.statement_notebook = {
    characters: normalizeIdList(scope.characters),
    items: normalizeIdList(scope.items)
  };
  return withDialogueMetadata(dialogue, metadata);
}

function withoutStatementNotebookScope(dialogue: ResourceRecord) {
  const metadata = { ...normalizeJsonObject(dialogue.metadata) };
  delete metadata.statement_notebook;
  return withDialogueMetadata(dialogue, metadata);
}

function getChapterTitleEditorValue(chapter: ResourceRecord) {
  return String(chapter.title || chapter.name || chapter.display_name || chapter.id || "").trim();
}

function getChapterDialogueIds(chapter: ResourceRecord) {
  return normalizeIdList(chapter.dialogues ?? chapter.dialogue_ids);
}

function toggleChapterDialogueId(chapter: ResourceRecord, id: string) {
  const current = new Set(getChapterDialogueIds(chapter));
  if (current.has(id)) current.delete(id);
  else current.add(id);
  return {
    ...chapter,
    dialogues: [...current]
  };
}

function getChapterStartDialogueId(chapter: ResourceRecord) {
  return normalizeSingleId(chapter.start_dialogue ?? chapter.dialogue_id ?? chapter.first_dialogue);
}

function getChapterBgmId(chapter: ResourceRecord) {
  return normalizeSingleId(chapter.bgm ?? chapter.bgm_id ?? chapter.chapter_bgm ?? chapter.chapter_select_bgm);
}

function toggleResourceChapterScope(resource: ResourceRecord, id: string) {
  const current = new Set(getResourceChapterScopeIds(resource));
  if (current.has(id)) current.delete(id);
  else current.add(id);
  return {
    ...resource,
    chapters: [...current]
  };
}

function normalizeSingleId(value: unknown) {
  return String(value || "").trim();
}

function normalizeIdList(value: unknown) {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? [value]
      : [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const raw of source) {
    const id = String(raw || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function ToggleField({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="field-block toggle-field">
      <span>{label}</span>
      <div className="toggle-control">
        <input aria-label={label} checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      </div>
    </label>
  );
}

function IconButton({
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

function Icon({ name }: { name: string }) {
  return <img aria-hidden="true" className="app-icon" src={iconPath(name)} />;
}

function editorTabsForResource(type: ResourceType): EditorTab[] {
  if (type === "dialogues") return ["form", "nodes", "json", "preview"];
  if (type === "chapters") return ["form", "graph", "json", "preview"];
  return ["form", "json", "preview"];
}

function defaultEditorTabForResource(type: ResourceType): EditorTab {
  if (type === "dialogues") return "nodes";
  if (type === "chapters") return "graph";
  return "form";
}

function tabLabel(tab: EditorTab, ui: EditorCopy): string {
  return ui.tabs[tab];
}

function hasResourceChapterFilter(type: ResourceType) {
  return type === "dialogues" || type === "characters" || type === "items" || type === "story_assets";
}

function buildResourceChapterFilterOptions(resources: ResourceSummary[], chapters: ResourceSummary[], language: EditorLanguage) {
  const chapterCounts = new Map<string, number>();
  let unassignedCount = 0;
  for (const resource of resources) {
    const chapterIds = resourceChapterIds(resource);
    if (chapterIds.length === 0) {
      unassignedCount += 1;
      continue;
    }
    for (const id of chapterIds) {
      chapterCounts.set(id, (chapterCounts.get(id) || 0) + 1);
    }
  }

  const unit = language === "ko" ? "개" : "";
  const formatCount = (count: number) => language === "ko" ? `${count}${unit}` : String(count);
  return [
    { value: "all", label: language === "ko" ? `전체 ${formatCount(resources.length)}` : `All ${formatCount(resources.length)}` },
    ...chapters.map((chapter) => ({
      value: `chapter:${chapter.id}`,
      label: `${chapter.title} ${formatCount(chapterCounts.get(chapter.id) || 0)}`
    })),
    { value: "unassigned", label: language === "ko" ? `미지정 ${formatCount(unassignedCount)}` : `Unassigned ${formatCount(unassignedCount)}` }
  ];
}

function formatResourceChapterFilterLabel(selected: string[], options: Array<{ value: string; label: string }>, totalCount: number, language: EditorLanguage) {
  if (selected.length === 0) return language === "ko" ? `전체 ${totalCount}개` : `All ${totalCount}`;
  if (selected.length === 1) {
    const option = options.find((entry) => entry.value === selected[0]);
    return option?.label || (language === "ko" ? "필터 1" : "1 filter");
  }
  return language === "ko" ? `${selected.length}개 선택` : `${selected.length} selected`;
}

function resourceMatchesChapterFilters(resource: ResourceSummary, filters: string[]) {
  if (filters.length === 0) return true;
  const chapterIds = resourceChapterIds(resource);
  return filters.some((filter) => {
    if (filter === "unassigned") return chapterIds.length === 0;
    if (filter.startsWith("chapter:")) return chapterIds.includes(filter.slice("chapter:".length));
    return false;
  });
}

function resourceChapterIds(resource: ResourceSummary) {
  return Array.isArray(resource.chapterIds)
    ? resource.chapterIds.map((id) => String(id || "").trim()).filter(Boolean)
    : [];
}

function dialogueNodeModeLabels(ui: EditorCopy): Record<DialogueNodeMode, string> {
  return {
    dialogue: ui.form.modeDialogue,
    stage: ui.form.modeStage,
    cutscene: ui.form.modeCutscene
  };
}

function dialogueNodeModeLabel(mode: DialogueNodeMode, ui: EditorCopy) {
  return dialogueNodeModeLabels(ui)[mode];
}

function speakerLabel(value: unknown, characters: ResourceSummary[]) {
  const id = String(value || "narrator");
  if (id === "narrator") return "narrator";
  return characters.find((entry) => entry.id === id)?.title || id;
}

function getDialogueNodeMode(node: ResourceRecord): DialogueNodeMode {
  const mode = String(node.mode ?? node.type ?? "dialogue").trim().toLowerCase();
  if (["cutscene", "blackout", "dark", "fade_black", "fade-to-black", "암전", "컷씬"].includes(mode)) return "cutscene";
  if (["stage", "stage_cast", "stagecast", "character_motion", "character_movement", "motion", "move", "무대", "캐릭터 이동", "캐릭터이동"].includes(mode)) return "stage";
  if (Boolean(node.blackout_enabled ?? node.is_blackout)) return "cutscene";
  return "dialogue";
}

function isCutsceneNode(node: ResourceRecord) {
  return getDialogueNodeMode(node) === "cutscene";
}

function isStageNode(node: ResourceRecord) {
  return getDialogueNodeMode(node) === "stage";
}

function dialogueNodeTitle(node: ResourceRecord, references: ReferenceResources, ui: EditorCopy) {
  const mode = getDialogueNodeMode(node);
  if (mode === "cutscene") return dialogueNodeModeLabel(mode, ui);
  if (mode === "stage") return dialogueNodeModeLabel(mode, ui);
  return speakerLabel(node.speaker, references.characters);
}

function dialogueNodeSummary(node: ResourceRecord, references: ReferenceResources) {
  const mode = getDialogueNodeMode(node);
  if (mode === "cutscene") return cutsceneSummary(node);
  if (mode === "stage") return stageNodeSummary(node, references);
  return getDialogueVisiblePreviewText(node.text).slice(0, 72) || "빈 대사";
}

function stageNodeSummary(node: ResourceRecord, references: ReferenceResources) {
  const cast = getStageCastRecord(node.stage_cast);
  const labels = Object.keys(cast)
    .slice(0, 3)
    .map((characterId) => characterLabel(characterId, undefined, references.characters));
  const hold = getStageNodeHoldEditorValue(node);
  const holdText = hold > 0 ? ` · 대기 ${hold}s` : "";
  if (labels.length === 0) return `캐릭터 움직임 없음${holdText}`;
  const suffix = Object.keys(cast).length > labels.length ? ` 외 ${Object.keys(cast).length - labels.length}명` : "";
  return `캐릭터 움직임 · ${labels.join(", ")}${suffix}${holdText}`;
}

function getNodeCutsceneEditorValue(node: ResourceRecord) {
  const cutscene = node.cutscene && typeof node.cutscene === "object" && !Array.isArray(node.cutscene) ? node.cutscene as ResourceRecord : {};
  const blackout = node.blackout && typeof node.blackout === "object" && !Array.isArray(node.blackout) ? node.blackout as ResourceRecord : {};
  return normalizeCutsceneEditorConfig({
    image: node.cutscene_image ?? node.cutscene_image_path ?? node.blackout_image ?? node.image ?? node.path,
    fade_in: node.blackout_fade_in ?? node.blackout_fade_in_duration ?? node.fade_in_duration,
    hold: node.blackout_hold ?? node.blackout_hold_duration ?? node.hold_duration,
    fade_out: node.blackout_fade_out ?? node.blackout_fade_out_duration ?? node.fade_out_duration,
    ...blackout,
    ...cutscene
  });
}

function normalizeCutsceneEditorConfig(value: ResourceRecord) {
  return {
    image: String(value.image ?? value.path ?? value.src ?? value.file ?? "").trim(),
    fade_in: roundForInput(clampNumber(value.fade_in ?? value.fade_in_duration ?? value.fadeIn ?? value.in, 0, 30, 0)),
    hold: roundForInput(clampNumber(value.hold ?? value.hold_duration ?? value.duration ?? value.wait, 0, 30, 1)),
    fade_out: roundForInput(clampNumber(value.fade_out ?? value.fade_out_duration ?? value.fadeOut ?? value.out, 0, 30, 1))
  };
}

function withNodeCutscene(node: ResourceRecord, cutsceneValue: ResourceRecord) {
  const next: ResourceRecord = { ...node };
  delete next.type;
  delete next.blackout;
  delete next.blackout_enabled;
  delete next.is_blackout;
  delete next.cutscene_image;
  delete next.cutscene_image_path;
  delete next.blackout_image;
  delete next.image;
  delete next.path;
  delete next.blackout_fade_in;
  delete next.blackout_fade_in_duration;
  delete next.fade_in_duration;
  delete next.blackout_hold;
  delete next.blackout_hold_duration;
  delete next.hold_duration;
  delete next.blackout_fade_out;
  delete next.blackout_fade_out_duration;
  delete next.fade_out_duration;
  next.mode = "cutscene";
  next.cutscene = normalizeCutsceneEditorConfig(cutsceneValue);
  return next;
}

function withDialogueMode(node: ResourceRecord) {
  const next: ResourceRecord = { ...node };
  delete next.mode;
  delete next.type;
  delete next.cutscene;
  delete next.blackout;
  delete next.blackout_enabled;
  delete next.is_blackout;
  delete next.cutscene_image;
  delete next.cutscene_image_path;
  delete next.blackout_image;
  delete next.image;
  delete next.path;
  return next;
}

function withStageMode(node: ResourceRecord) {
  const next: ResourceRecord = { ...node };
  next.mode = "stage";
  delete next.type;
  delete next.cutscene;
  delete next.blackout;
  delete next.blackout_enabled;
  delete next.is_blackout;
  delete next.cutscene_image;
  delete next.cutscene_image_path;
  delete next.blackout_image;
  delete next.image;
  delete next.path;
  return next;
}

function getStageNodeHoldEditorValue(node: ResourceRecord) {
  return roundForInput(clampNumber(node.stage_hold ?? node.stage_wait ?? node.hold ?? node.wait ?? node.duration, 0, 30, 0));
}

function patchStageHold(node: ResourceRecord, value: unknown) {
  const next: ResourceRecord = { ...node };
  delete next.stage_hold;
  delete next.stage_wait;
  delete next.wait;
  delete next.duration;
  next.hold = roundForInput(clampNumber(value, 0, 30, 0));
  return next;
}

function cutsceneSummary(node: ResourceRecord) {
  const cutscene = getNodeCutsceneEditorValue(node);
  return `fade ${cutscene.fade_in ?? 0}/${cutscene.fade_out ?? 1} · hold ${cutscene.hold ?? 1}`;
}

function patchCutscene(node: ResourceRecord, field: string, value: unknown) {
  return withNodeCutscene(node, { ...getNodeCutsceneEditorValue(node), [field]: value });
}

function countEventTags(nodes: ResourceRecord[]) {
  return nodes.reduce((total, node) => total + (String(node.text || "").match(/\[(bgm|sfx|se|bg|auto_next|enter|exit)\b/gi)?.length || 0), 0);
}

function shortId(id: string) {
  return id.length > 14 ? `${id.slice(0, 8)}...` : id;
}

function fileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  if (file.type === "audio/mpeg") return "mp3";
  if (file.type === "audio/ogg") return "ogg";
  if (file.type === "audio/wav") return "wav";
  return "bin";
}

function safeSegment(value: unknown, fallback = "asset") {
  const clean = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return clean || fallback;
}

function live2dRecordForEditor(value: unknown): ResourceRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ResourceRecord : {};
}

function getLive2dParts(value: unknown): ResourceRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is ResourceRecord => Boolean(entry && typeof entry === "object" && !Array.isArray(entry)));
}

function getLive2dMotions(value: unknown): Record<string, ResourceRecord> {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const result: Record<string, ResourceRecord> = {};
  for (const [key, motion] of Object.entries(source)) {
    if (!key.trim() || !motion || typeof motion !== "object" || Array.isArray(motion)) continue;
    result[key] = motion as ResourceRecord;
  }
  return result;
}

function getLive2dMotionParts(value: unknown): Record<string, ResourceRecord> {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const result: Record<string, ResourceRecord> = {};
  for (const [key, entry] of Object.entries(source)) {
    if (!key.trim() || !entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    result[key] = entry as ResourceRecord;
  }
  return result;
}

function getLive2dMotionPartEntry(motion: ResourceRecord, partId: string): ResourceRecord {
  const parts = getLive2dMotionParts(motion.parts);
  return parts[partId] || {};
}

function getLive2dAngleRig(value: unknown): ResourceRecord {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as ResourceRecord
    : {};
  return {
    enabled: normalizeBooleanFlag(source.enabled, false),
    max_angle: getLive2dAngleMax(source),
    mirror_x: normalizeBooleanFlag(source.mirror_x ?? source.mirror, true),
    parts: getLive2dAngleParts(source.parts)
  };
}

function getLive2dAngleParts(value: unknown): Record<string, ResourceRecord> {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const result: Record<string, ResourceRecord> = {};
  for (const [key, entry] of Object.entries(source)) {
    const cleanKey = String(key || "").trim();
    if (!cleanKey || !entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    result[cleanKey] = normalizeLive2dAngleEntryForEditor(entry as ResourceRecord);
  }
  return result;
}

function normalizeLive2dAngleEntryForEditor(entry: ResourceRecord): ResourceRecord {
  const next = normalizeLive2dAngleFlatEntryForEditor(entry);
  const positive = normalizeLive2dAngleDirectionForEditor(entry.positive ?? entry.right);
  const negative = normalizeLive2dAngleDirectionForEditor(entry.negative ?? entry.left);
  if (positive !== null) next.positive = positive;
  if (negative !== null) next.negative = negative;
  return next;
}

function normalizeLive2dAngleDirectionForEditor(entry: unknown): ResourceRecord | null {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
  return normalizeLive2dAngleFlatEntryForEditor(entry as ResourceRecord);
}

function normalizeLive2dAngleFlatEntryForEditor(entry: ResourceRecord): ResourceRecord {
  const scale = getLive2dPoint(
    entry.scale,
    normalizeNumber(entry.scale_x ?? entry.scaleX ?? entry.sx, 0, live2dAngleFieldLimits.scaleX.min, live2dAngleFieldLimits.scaleX.max),
    normalizeNumber(entry.scale_y ?? entry.scaleY ?? entry.sy, 0, live2dAngleFieldLimits.scaleY.min, live2dAngleFieldLimits.scaleY.max)
  );
  const skew = getLive2dPoint(
    entry.skew,
    normalizeNumber(entry.skew_x ?? entry.skewX, 0, live2dAngleFieldLimits.skewX.min, live2dAngleFieldLimits.skewX.max),
    normalizeNumber(entry.skew_y ?? entry.skewY, 0, live2dAngleFieldLimits.skewY.min, live2dAngleFieldLimits.skewY.max)
  );
  return {
    x: normalizeNumber(entry.x ?? entry.offset_x, 0, live2dAngleFieldLimits.x.min, live2dAngleFieldLimits.x.max),
    y: normalizeNumber(entry.y ?? entry.offset_y, 0, live2dAngleFieldLimits.y.min, live2dAngleFieldLimits.y.max),
    rotation: normalizeNumber(entry.rotation ?? entry.rotation_degrees, 0, live2dAngleFieldLimits.rotation.min, live2dAngleFieldLimits.rotation.max),
    scaleX: normalizeNumber(scale.x, 0, live2dAngleFieldLimits.scaleX.min, live2dAngleFieldLimits.scaleX.max),
    scaleY: normalizeNumber(scale.y, 0, live2dAngleFieldLimits.scaleY.min, live2dAngleFieldLimits.scaleY.max),
    skewX: normalizeNumber(skew.x, 0, live2dAngleFieldLimits.skewX.min, live2dAngleFieldLimits.skewX.max),
    skewY: normalizeNumber(skew.y, 0, live2dAngleFieldLimits.skewY.min, live2dAngleFieldLimits.skewY.max),
    opacity: normalizeNumber(entry.opacity ?? entry.alpha, 0, live2dAngleFieldLimits.opacity.min, live2dAngleFieldLimits.opacity.max)
  };
}

function getLive2dAnglePartEntry(angleRig: ResourceRecord, partId: string): ResourceRecord {
  const parts = getLive2dAngleParts(angleRig.parts);
  return parts[partId] || {};
}

function getLive2dAngleMax(angleRig: ResourceRecord): number {
  return normalizeNumber(angleRig.max_angle ?? angleRig.max, 45, 1, 45);
}

function applyLive2dAngleRigToEditorParts(parts: ResourceRecord[], angleRig: ResourceRecord, angle: number): ResourceRecord[] {
  if (!normalizeBooleanFlag(angleRig.enabled, false)) return parts;
  const angleParts = getLive2dAngleParts(angleRig.parts);
  if (Object.keys(angleParts).length === 0) return parts;
  const maxAngle = getLive2dAngleMax(angleRig);
  const amount = clampNumber(angle / Math.max(maxAngle, 1), -1, 1, 0);
  if (Math.abs(amount) < 0.0001) return parts;
  const magnitude = Math.abs(amount);
  const signedAmount = normalizeBooleanFlag(angleRig.mirror_x ?? angleRig.mirror, true) ? amount : magnitude;
  return parts.map((part) => {
    const partId = String(part.id || "").trim();
    const entry = partId ? angleParts[partId] : null;
    if (!entry) return part;
    const position = getLive2dPoint(part.position, live2dCanvasWidthDefault * 0.5, live2dCanvasHeightDefault * 0.5);
    const scale = getLive2dPoint(part.scale, 1, 1);
    const skew = getLive2dPoint(part.skew, 0, 0);
    const directionEntry = entry[signedAmount >= 0 ? "positive" : "negative"];
    const direction = directionEntry && typeof directionEntry === "object" && !Array.isArray(directionEntry)
      ? directionEntry as ResourceRecord
      : null;
    const nextPosition = [
      position.x + normalizeNumber(entry.x, 0) * signedAmount,
      position.y + normalizeNumber(entry.y, 0) * magnitude
    ];
    const nextScale = [
      Math.max(0.01, scale.x + normalizeNumber(entry.scaleX, 0) * magnitude),
      Math.max(0.01, scale.y + normalizeNumber(entry.scaleY, 0) * magnitude)
    ];
    const nextSkew = [
      skew.x + normalizeNumber(entry.skewX, 0) * signedAmount,
      skew.y + normalizeNumber(entry.skewY, 0) * signedAmount
    ];
    let nextRotation = normalizeNumber(part.rotation, 0) + normalizeNumber(entry.rotation, 0) * signedAmount;
    let nextOpacity = normalizeNumber(part.opacity ?? part.alpha, 1, 0, 1) + normalizeNumber(entry.opacity, 0) * magnitude;
    if (direction) {
      nextPosition[0] += normalizeNumber(direction.x, 0) * magnitude;
      nextPosition[1] += normalizeNumber(direction.y, 0) * magnitude;
      nextScale[0] = Math.max(0.01, nextScale[0] + normalizeNumber(direction.scaleX, 0) * magnitude);
      nextScale[1] = Math.max(0.01, nextScale[1] + normalizeNumber(direction.scaleY, 0) * magnitude);
      nextSkew[0] += normalizeNumber(direction.skewX, 0) * magnitude;
      nextSkew[1] += normalizeNumber(direction.skewY, 0) * magnitude;
      nextRotation += normalizeNumber(direction.rotation, 0) * magnitude;
      nextOpacity += normalizeNumber(direction.opacity, 0) * magnitude;
    }
    return {
      ...part,
      position: [
        roundForInput(nextPosition[0]),
        roundForInput(nextPosition[1])
      ],
      scale: [
        round4Number(nextScale[0]),
        round4Number(nextScale[1])
      ],
      skew: [
        roundForInput(nextSkew[0]),
        roundForInput(nextSkew[1])
      ],
      rotation: roundForInput(nextRotation),
      opacity: round4Number(clampNumber(nextOpacity, 0, 1, 1))
    };
  });
}

function getLive2dCanvasSize(value: unknown): PointerPoint {
  const point = getLive2dPoint(value, live2dCanvasWidthDefault, live2dCanvasHeightDefault);
  return {
    x: normalizeNumber(point.x, live2dCanvasWidthDefault, 100, 4000),
    y: normalizeNumber(point.y, live2dCanvasHeightDefault, 100, 5000)
  };
}

function getLive2dPoint(value: unknown, fallbackX: number, fallbackY: number): PointerPoint {
  if (Array.isArray(value)) {
    return {
      x: Number.isFinite(Number(value[0])) ? Number(value[0]) : fallbackX,
      y: Number.isFinite(Number(value[1])) ? Number(value[1]) : fallbackY
    };
  }
  if (value && typeof value === "object") {
    const record = value as ResourceRecord;
    return {
      x: Number.isFinite(Number(record.x ?? record[0])) ? Number(record.x ?? record[0]) : fallbackX,
      y: Number.isFinite(Number(record.y ?? record[1])) ? Number(record.y ?? record[1]) : fallbackY
    };
  }
  return { x: fallbackX, y: fallbackY };
}

function nextUniqueId(existingIds: string[], requested: string) {
  const taken = new Set(existingIds.map((id) => String(id || "").trim()).filter(Boolean));
  const base = safeSegment(requested, "item");
  if (!taken.has(base)) return base;
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base}_${index}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}_${Date.now()}`;
}

function live2dEditorCopy(language: EditorLanguage) {
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

function storyAssetUploadPath(asset: ResourceRecord, file: File) {
  const kind = normalizeKind(asset.kind || "sfx");
  const folder = kind === "bgm" ? "bgm" : kind === "background" ? "background" : "sfx";
  return `assets/story_assets/${folder}/${safeSegment(asset.id || "asset")}.${fileExtension(file)}`;
}

function normalizeDialogueDraftForSave(dialogue: ResourceRecord, characters: ResourceSummary[] = []): ResourceRecord {
  const chapters = getResourceChapterScopeIds(dialogue);
  const metadata = normalizeJsonObject(dialogue.metadata);
  const start = normalizeSingleId(dialogue.start);
  const defaultStart = getDialogueDefaultStartId(dialogue);
  const next: ResourceRecord = { ...dialogue };
  if (Array.isArray(dialogue.nodes)) {
    next.nodes = normalizeDialogueNodeSequenceForSave(dialogue.nodes, characters);
  }
  if (Array.isArray(dialogue.statement_nodes)) {
    next.statement_nodes = normalizeDialogueNodeSequenceForSave(dialogue.statement_nodes, characters);
  }
  if (chapters.length > 0) next.chapters = chapters;
  else delete next.chapters;
  delete next.chapter_ids;
  if (start && start !== defaultStart) next.start = start;
  else delete next.start;
  if (Object.keys(metadata).length > 0) next.metadata = metadata;
  else delete next.metadata;
  return next;
}

function normalizeDialogueNodeSequenceForSave(nodes: ResourceRecord[], characters: ResourceSummary[] = []): ResourceRecord[] {
  return nodes.map((node, index) => {
    let next = normalizeDialogueNodeForSave(node, characters);
    if (shouldInferDialogueNodeCameraZoom(node, characters)) {
      next = withNodeCameraZoomPercent(next, resolveNearestDialogueCameraZoomPercent(nodes, index, characters));
    }
    return next;
  });
}

function normalizeDialogueNodeForSave(node: ResourceRecord, characters: ResourceSummary[] = []): ResourceRecord {
  let next = nodeHasExplicitFocusTargets(node) ? withNodeFocusTargets(node, getNodeFocusTargets(node)) : { ...node };
  const explicitCameraZoom = getNodeCameraZoomPercent(next);
  if (explicitCameraZoom !== null) {
    next = withNodeCameraZoomPercent(next, explicitCameraZoom);
  }
  if (Array.isArray(next.nodes)) {
    next = { ...next, nodes: normalizeDialogueNodeSequenceForSave(next.nodes, characters) };
  }
  if (Array.isArray(next.choices)) {
    next = { ...next, choices: next.choices.map((choice) => normalizeDialogueChoiceForSave(choice)) };
  }
  if (Array.isArray(next.lies)) {
    next = { ...next, lies: normalizeStatementLiesForSave(next.lies, characters) };
  }
  if (Array.isArray(next.statement_lies)) {
    next = { ...next, statement_lies: normalizeStatementLiesForSave(next.statement_lies, characters) };
  }
  if (isEmptyPlainRecord(next.set_flags_on_complete)) delete next.set_flags_on_complete;
  return next;
}

function normalizeDialogueChoiceForSave(choice: unknown): unknown {
  if (!choice || typeof choice !== "object" || Array.isArray(choice)) return choice;
  let next: ResourceRecord = { ...(choice as ResourceRecord) };
  if (next.topic_id !== undefined) {
    const topicId = String(next.topic_id || "").trim();
    if (topicId) next.topic_id = topicId;
    else delete next.topic_id;
  }
  if (next.choice_id !== undefined && !String(next.choice_id || "").trim()) delete next.choice_id;
  if (next.id !== undefined && !String(next.id || "").trim()) delete next.id;
  if (next.move_to !== undefined) {
    const moveTo = String(next.move_to || "").trim();
    if (moveTo) next.move_to = moveTo;
    else delete next.move_to;
  }
  const presentTarget = getChoicePresentTarget(next);
  next = stripChoicePresentTargetFields(next);
  if (presentTarget.kind === "item" && presentTarget.id) next.present_item = presentTarget.id;
  if (presentTarget.kind === "character" && presentTarget.id) next.present_character = presentTarget.id;
  if (next.default_present === true || next.wrong_present === true) next.present_default = true;
  delete next.default_present;
  delete next.wrong_present;
  if (next.present_default === false) delete next.present_default;
  if (next.track_heard === true) delete next.track_heard;
  if (next.show_heard_check === true) delete next.show_heard_check;
  if (next.exit_talk === false) delete next.exit_talk;
  if (isEmptyPlainRecord(next.set_flags)) delete next.set_flags;
  if (Array.isArray(next.conditions) && next.conditions.length === 0) delete next.conditions;
  return next;
}

function normalizeStatementLiesForSave(lies: unknown[], characters: ResourceSummary[] = []) {
  return lies.map((lie) => {
    if (!lie || typeof lie !== "object") return lie;
    const lieRecord = lie as ResourceRecord;
    if (!Array.isArray(lieRecord.reactions)) return lieRecord;
    return {
      ...lieRecord,
      reactions: lieRecord.reactions.map((reaction) => {
        if (!reaction || typeof reaction !== "object") return reaction;
        const reactionRecord = reaction as ResourceRecord;
        if (!Array.isArray(reactionRecord.nodes)) return reactionRecord;
        return {
          ...reactionRecord,
          nodes: normalizeDialogueNodeSequenceForSave(reactionRecord.nodes, characters)
        };
      })
    };
  });
}

function shouldInferDialogueNodeCameraZoom(node: ResourceRecord, characters: ResourceSummary[] = []) {
  if (isCutsceneNode(node) || isStageNode(node)) return false;
  if (getNodeCameraZoomPercent(node) !== null) return false;
  if (getDialogueNodeFocusZoomPercent(node, characters) !== null) return false;

  const speakerId = normalizeEditorSpeakerId(node.speaker);
  return !speakerId || characterIsProtagonist(speakerId, characters);
}

function resolveNearestDialogueCameraZoomPercent(nodes: ResourceRecord[], nodeIndex: number, characters: ResourceSummary[] = []) {
  for (let index = nodeIndex - 1; index >= 0; index -= 1) {
    const zoom = getDialogueNodeFocusZoomPercent(nodes[index], characters);
    if (zoom !== null) return zoom;
  }
  for (let index = nodeIndex + 1; index < nodes.length; index += 1) {
    const zoom = getDialogueNodeFocusZoomPercent(nodes[index], characters);
    if (zoom !== null) return zoom;
  }
  return portraitZoomDefault;
}

function getDialogueNodeFocusZoomPercent(node: ResourceRecord | undefined, characters: ResourceSummary[] = []): number | null {
  if (!node || isCutsceneNode(node) || isStageNode(node)) return null;

  const explicitCameraZoom = getNodeCameraZoomPercent(node);
  if (explicitCameraZoom !== null) return explicitCameraZoom;

  const cast = getStageCastRecord(node.stage_cast);
  const focusTargets = getNodeFocusTargets(node);
  const speakerId = normalizeTimelineCharacterId(node.speaker);
  const candidates = focusTargets.length > 0
    ? focusTargets
    : [
      ...(speakerId ? [speakerId] : []),
      ...Object.keys(cast)
    ];

  for (const rawId of candidates) {
    const characterId = normalizeTimelineCharacterId(rawId);
    if (!characterId) continue;
    const entry = cast[characterId];
    if (!entry || typeof entry !== "object") continue;
    if (!String(entry.portrait || "").trim()) continue;
    const zoom = getStageCastEntryZoomPercent(entry);
    if (zoom !== null) return zoom;
  }

  return null;
}

const dialogueCameraZoomKeys = ["camera_zoom_percent", "focus_zoom_percent", "dialogue_zoom_percent"];

function getNodeCameraZoomPercent(node: ResourceRecord | undefined): number | null {
  if (!node) return null;
  const metadata = normalizeJsonObject(node.metadata);
  for (const key of dialogueCameraZoomKeys) {
    const zoom = parsePortraitZoomPercent(node[key] ?? metadata[key]);
    if (zoom !== null) return zoom;
  }
  return null;
}

function getStageCastEntryZoomPercent(entry: ResourceRecord): number | null {
  return parsePortraitZoomPercent(entry.portrait_zoom ?? entry.zoom_percent ?? entry.camera_zoom_percent);
}

function parsePortraitZoomPercent(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const numberValue = Number(String(value).trim().replace(/%$/, ""));
  if (!Number.isFinite(numberValue)) return null;
  return snapPortraitZoomPercent(numberValue);
}

function withNodeCameraZoomPercent(node: ResourceRecord, zoomPercent: unknown) {
  const next: ResourceRecord = { ...node };
  const metadata = { ...normalizeJsonObject(next.metadata) };
  for (const key of dialogueCameraZoomKeys) {
    delete next[key];
    delete metadata[key];
  }
  next.camera_zoom_percent = parsePortraitZoomPercent(zoomPercent) ?? portraitZoomDefault;
  if (Object.keys(metadata).length > 0) next.metadata = metadata;
  else delete next.metadata;
  return next;
}

function normalizeChapterDraftForSave(chapter: ResourceRecord): ResourceRecord {
  const dialogueIds = getChapterDialogueIds(chapter);
  const positions = getChapterGraphPositionMap(chapter);
  const exportPositions: Record<string, [number, number]> = {};
  for (const id of dialogueIds) {
    if (Array.isArray(positions[id])) exportPositions[id] = positions[id];
  }
  const layout = chapter.layout && typeof chapter.layout === "object" && !Array.isArray(chapter.layout) ? chapter.layout as ResourceRecord : {};
  const next: ResourceRecord = {
    ...chapter,
    id: normalizeSingleId(chapter.id),
    title: getChapterTitleEditorValue(chapter),
    order: Number.isFinite(Number(chapter.order)) ? Math.max(0, Math.round(Number(chapter.order))) : 0,
    start_dialogue: getChapterStartDialogueId(chapter),
    description: String(chapter.description || ""),
    dialogues: dialogueIds,
    layout: {
      ...layout,
      positions: exportPositions
    },
    metadata: normalizeJsonObject(chapter.metadata)
  };
  const image = String(chapter.image || "").trim();
  if (image) next.image = image;
  else delete next.image;
  const bgm = getChapterBgmId(chapter);
  if (bgm) next.bgm = bgm;
  else delete next.bgm;
  delete next.bgm_id;
  delete next.chapter_bgm;
  delete next.chapter_select_bgm;
  if (!chapter.parallax || typeof chapter.parallax !== "object" || Array.isArray(chapter.parallax)) {
    delete next.parallax;
  }
  return next;
}

function normalizeStoryAssetDraftForKind(asset: ResourceRecord, rawKind: unknown = asset.kind): ResourceRecord {
  const kind = normalizeKind(rawKind);
  const chapters = getResourceChapterScopeIds(asset);
  const next: ResourceRecord = {
    ...asset,
    kind,
    metadata: normalizeJsonObject(asset.metadata)
  };
  if (chapters.length > 0) next.chapters = chapters;
  else delete next.chapters;
  delete next.chapter_ids;
  if (kind === "background") {
    next.fixed = Boolean(asset.fixed ?? asset.background_fixed ?? next.metadata.fixed);
    delete next.volume;
    delete next.loop;
    delete next.background_fixed;
    return next;
  }
  next.volume = clampNumber(asset.volume, 0, 1, 1);
  delete next.fixed;
  delete next.background_fixed;
  delete next.loop;
  return next;
}

function normalizeItemDraftForSave(item: ResourceRecord): ResourceRecord {
  const chapters = getResourceChapterScopeIds(item);
  const next: ResourceRecord = {
    ...item,
    name: String(item.name || item.display_name || item.id || "").trim(),
    description: String(item.description || ""),
    metadata: normalizeJsonObject(item.metadata)
  };
  if (chapters.length > 0) next.chapters = chapters;
  else delete next.chapters;
  delete next.chapter_ids;
  return next;
}

function normalizeCharacterDraftForSave(character: ResourceRecord): ResourceRecord {
  const chapters = getResourceChapterScopeIds(character);
  const live2d = normalizeLive2dForSave(character.live2d);
  const next: ResourceRecord = {
    ...character,
    display_name: String(character.display_name || character.id || "").trim(),
    description: String(character.description || ""),
    name_color: String(character.name_color || "#ffffff").trim() || "#ffffff",
    protagonist: normalizeBooleanFlag(character.protagonist ?? character.is_protagonist ?? character.main_character),
    portraits: normalizeCharacterPortraitsForSave(character.portraits),
    metadata: normalizeJsonObject(character.metadata)
  };
  if (live2d !== null) next.live2d = live2d;
  else delete next.live2d;
  delete next.is_protagonist;
  delete next.main_character;
  if (chapters.length > 0) next.chapters = chapters;
  else delete next.chapters;
  delete next.chapter_ids;
  const spectrumOffset = getSpectrumOffset(character.spectrum_offset);
  if (Math.abs(spectrumOffset.x) >= 0.0001 || Math.abs(spectrumOffset.y) >= 0.0001) {
    next.spectrum_offset = [round4Number(spectrumOffset.x), round4Number(spectrumOffset.y)];
  } else {
    delete next.spectrum_offset;
  }
  return next;
}

function normalizeCharacterPortraitsForSave(value: unknown) {
  const portraits = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, ResourceRecord | string>
    : {};
  const next: Record<string, ResourceRecord | string> = {};
  for (const [key, portrait] of Object.entries(portraits)) {
    const cleanKey = String(key || "").trim();
    if (!cleanKey) continue;
    const normalized = normalizeCharacterPortraitForSave(portrait);
    if (normalized !== null) next[cleanKey] = normalized;
  }
  return next;
}

function normalizeCharacterPortraitForSave(value: ResourceRecord | string) {
  if (typeof value === "string") return value.trim() || null;
  if (!value || typeof value !== "object") return null;
  const path = String(value.path || "").trim();
  if (!path) return null;
  const center = getPortraitCenterPoint(value.center);
  const profile = normalizePortraitProfileForSave(value.profile, center);
  if (isDefaultPortraitCenterPoint(center) && profile === null) return path;
  const next: ResourceRecord = { path };
  if (!isDefaultPortraitCenterPoint(center)) next.center = [round4Number(center.x), round4Number(center.y)];
  if (profile !== null) next.profile = profile;
  return next;
}

function normalizePortraitProfileForSave(value: unknown, _fallbackCenter: PointerPoint) {
  const profile = value && typeof value === "object" ? value as ResourceRecord : {};
  const zoom = getProfileZoom(profile.zoom);
  const offset = getProfileOffset(profile);
  const next: ResourceRecord = {};
  if (Math.abs(zoom - profileZoomDefault) >= 0.001) next.zoom = zoom;
  if (Math.abs(offset.x) >= 0.0001 || Math.abs(offset.y) >= 0.0001) {
    next.offset = [round4Number(offset.x), round4Number(offset.y)];
  }
  return Object.keys(next).length > 0 ? next : null;
}

function normalizeLive2dForSave(value: unknown): ResourceRecord | null {
  const source = live2dRecordForEditor(value);
  const parts = getLive2dParts(source.parts)
    .map(normalizeLive2dPartForSave)
    .filter((part): part is ResourceRecord => part !== null);
  const motions = normalizeLive2dMotionsForSave(source.motions, parts);
  const angleRig = normalizeLive2dAngleRigForSave(source.angle_rig, parts);
  const canvasSize = getLive2dCanvasSize(source.canvas_size);
  const center = getPortraitCenterPoint(source.center ?? source.face_center ?? [0.5, 0.34]);
  const enabled = normalizeBooleanFlag(source.enabled);
  const defaultMotion = String(source.default_motion || "").trim();

  if (!enabled && parts.length === 0 && Object.keys(motions).length === 0 && angleRig === null && !defaultMotion) {
    return null;
  }

  const next: ResourceRecord = {
    enabled,
    canvas_size: [roundForInput(canvasSize.x), roundForInput(canvasSize.y)],
    center: [round4Number(center.x), round4Number(center.y)],
    parts
  };
  if (defaultMotion) next.default_motion = safeSegment(defaultMotion, "default");
  if (angleRig !== null) next.angle_rig = angleRig;
  if (Object.keys(motions).length > 0) next.motions = motions;
  return next;
}

function normalizeLive2dPartForSave(value: ResourceRecord): ResourceRecord | null {
  const id = safeSegment(value.id || "", "");
  const path = String(value.path || "").trim();
  if (!id || !path) return null;
  const position = getLive2dPoint(value.position, live2dCanvasWidthDefault * 0.5, live2dCanvasHeightDefault * 0.5);
  const anchor = getLive2dPoint(value.anchor, 0.5, 0.5);
  const scale = getLive2dPoint(value.scale, 1, 1);
  const skew = getLive2dPoint(value.skew, 0, 0);
  const next: ResourceRecord = {
    id,
    path,
    position: [roundForInput(position.x), roundForInput(position.y)],
    anchor: [round4Number(anchor.x), round4Number(anchor.y)],
    scale: [round4Number(scale.x), round4Number(scale.y)],
    skew: [roundForInput(skew.x), roundForInput(skew.y)],
    rotation: roundForInput(normalizeNumber(value.rotation, 0)),
    opacity: round4Number(normalizeNumber(value.opacity ?? value.alpha, 1, 0, 1)),
    z_index: Math.round(normalizeNumber(value.z_index ?? value.order, 0, -100, 100))
  };
  return next;
}

function normalizeLive2dMotionsForSave(value: unknown, parts: ResourceRecord[]) {
  const motions = getLive2dMotions(value);
  const knownPartIds = new Set(parts.map((part) => String(part.id || "")).filter(Boolean));
  const next: Record<string, ResourceRecord> = {};
  for (const [key, motion] of Object.entries(motions)) {
    const cleanKey = safeSegment(key, "");
    if (!cleanKey) continue;
    const speed = normalizeNumber(motion.speed, live2dMotionSpeedDefault, 0.1, 5);
    const motionParts = getLive2dMotionParts(motion.parts);
    const nextParts: Record<string, ResourceRecord> = {};
    for (const [partId, entry] of Object.entries(motionParts)) {
      const cleanPartId = safeSegment(partId, "");
      if (!cleanPartId || !knownPartIds.has(cleanPartId)) continue;
      const normalized = normalizeLive2dMotionPartForSave(entry);
      if (Object.keys(normalized).length > 0) nextParts[cleanPartId] = normalized;
    }
    if (Object.keys(nextParts).length === 0 && Math.abs(speed - live2dMotionSpeedDefault) < 0.0001) continue;
    next[cleanKey] = { speed, parts: nextParts };
  }
  return next;
}

function normalizeLive2dMotionPartForSave(value: ResourceRecord) {
  const next: ResourceRecord = {};
  for (const field of live2dMotionFields) {
    const limits = live2dMotionFieldLimits[field];
    const normalized = normalizeNumber(value[field], live2dMotionFieldDefaults[field], limits.min, limits.max);
    const defaultValue = live2dMotionFieldDefaults[field];
    if (Math.abs(normalized - defaultValue) >= 0.0001) {
      next[field] = field === "frequency" || field === "phase" || field === "scale" || field === "opacity"
        ? round4Number(normalized)
        : roundForInput(normalized);
    }
  }
  return next;
}

function normalizeLive2dAngleRigForSave(value: unknown, parts: ResourceRecord[]): ResourceRecord | null {
  const rig = getLive2dAngleRig(value);
  const enabled = normalizeBooleanFlag(rig.enabled, false);
  const maxAngle = getLive2dAngleMax(rig);
  const mirrorX = normalizeBooleanFlag(rig.mirror_x ?? rig.mirror, true);
  const knownPartIds = new Set(parts.map((part) => String(part.id || "").trim()).filter(Boolean));
  const angleParts = getLive2dAngleParts(rig.parts);
  const nextParts: Record<string, ResourceRecord> = {};
  for (const [partId, entry] of Object.entries(angleParts)) {
    const cleanPartId = safeSegment(partId, "");
    if (!cleanPartId || !knownPartIds.has(cleanPartId)) continue;
    const normalized = normalizeLive2dAnglePartForSave(entry);
    if (Object.keys(normalized).length > 0) nextParts[cleanPartId] = normalized;
  }

  if (!enabled && Object.keys(nextParts).length === 0 && Math.abs(maxAngle - 45) < 0.0001 && mirrorX) {
    return null;
  }

  const next: ResourceRecord = {
    enabled,
    max_angle: roundForInput(maxAngle),
    mirror_x: mirrorX
  };
  if (Object.keys(nextParts).length > 0) next.parts = nextParts;
  return next;
}

function normalizeLive2dAnglePartForSave(value: ResourceRecord) {
  const next: ResourceRecord = {};
  for (const field of live2dAngleFields) {
    const limits = live2dAngleFieldLimits[field];
    const normalized = normalizeNumber(value[field], live2dAngleFieldDefaults[field], limits.min, limits.max);
    const defaultValue = live2dAngleFieldDefaults[field];
    if (Math.abs(normalized - defaultValue) < 0.0001) continue;
    const outputKey = field === "scaleX" ? "scale_x" : field === "scaleY" ? "scale_y" : field === "skewX" ? "skew_x" : field === "skewY" ? "skew_y" : field;
    next[outputKey] = field === "scaleX" || field === "scaleY" || field === "opacity"
      ? round4Number(normalized)
      : roundForInput(normalized);
  }
  const positive = normalizeLive2dAngleDirectionForSave(value.positive);
  const negative = normalizeLive2dAngleDirectionForSave(value.negative);
  if (positive !== null) next.positive = positive;
  if (negative !== null) next.negative = negative;
  return next;
}

function normalizeLive2dAngleDirectionForSave(value: unknown): ResourceRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const normalized = normalizeLive2dAnglePartForSave(value as ResourceRecord);
  return Object.keys(normalized).length > 0 ? normalized : null;
}

function prepareDraftForSave(type: ResourceType, draft: ResourceRecord, references?: ReferenceResources): ResourceRecord {
  if (type === "dialogues") return normalizeDialogueDraftForSave(draft, references?.characters || []);
  if (type === "characters") return normalizeCharacterDraftForSave(draft);
  if (type === "chapters") return normalizeChapterDraftForSave(draft);
  if (type === "items") return normalizeItemDraftForSave(draft);
  if (type === "story_assets") return normalizeStoryAssetDraftForKind(draft);
  return draft;
}

function readEditorLanguage(): EditorLanguage {
  const saved = readLocalSetting(editorLanguageStorageKey);
  return saved === "en" ? "en" : "ko";
}

function readEditorThemeMode(): EditorThemeMode {
  const saved = readLocalSetting(editorThemeModeStorageKey);
  return saved === "light" ? "light" : "dark";
}

function readEditorThemeAccent(): EditorThemeAccent {
  return normalizeEditorThemeAccent(readLocalSetting(editorThemeAccentStorageKey));
}

function readEditorCustomAccent(): string {
  return sanitizeHexColor(readLocalSetting(editorCustomAccentStorageKey), defaultCustomAccent);
}

function readLocalSetting(key: string): string {
  try {
    return localStorage.getItem(key)?.trim() || "";
  } catch {
    return "";
  }
}

function normalizeEditorThemeAccent(value: unknown): EditorThemeAccent {
  const clean = String(value || "").trim();
  if (clean === "blue" || clean === "rose" || clean === "amber" || clean === "custom") return clean;
  return "blue";
}

function applyEditorAppearance(
  language: EditorLanguage,
  themeMode: EditorThemeMode,
  themeAccent: EditorThemeAccent,
  customAccent: string
) {
  const root = document.documentElement;
  root.lang = language === "ko" ? "ko" : "en";
  root.dataset.theme = themeMode;
  root.dataset.accent = themeAccent;

  const primary = sanitizeHexColor(customAccent, defaultCustomAccent);
  const containerMixTarget = themeMode === "dark" ? "#000000" : "#ffffff";
  const containerWeight = themeMode === "dark" ? 0.6 : 0.74;
  root.style.setProperty("--custom-primary", primary);
  root.style.setProperty("--custom-on-primary", readableTextColor(primary));
  root.style.setProperty("--custom-primary-container", mixHex(primary, containerMixTarget, containerWeight));
  root.style.setProperty("--custom-state-focus", hexToRgba(primary, themeMode === "dark" ? 0.24 : 0.28));
}

function readGodotPreviewEndpoint() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("godot_preview_endpoint")?.trim();
    if (fromUrl) {
      saveLocalSetting(godotPreviewEndpointStorageKey, fromUrl);
      return normalizeGodotPreviewEndpoint(fromUrl);
    }
    const saved = localStorage.getItem(godotPreviewEndpointStorageKey)?.trim();
    if (saved && !isLegacyLoopbackGodotPreviewEndpoint(saved)) return normalizeGodotPreviewEndpoint(saved);
    if (saved) saveLocalSetting(godotPreviewEndpointStorageKey, godotPreviewDefaultEndpoint);
  } catch {
    // Fall through to the local bridge default.
  }
  return godotPreviewDefaultEndpoint;
}

function saveLocalSetting(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing or blocked storage should not break editing.
  }
}

function describeResourceForLanguage(type: ResourceType, data: ResourceRecord | null | undefined, language: EditorLanguage): string {
  if (!data) return language === "ko" ? "선택 없음" : "No selection";

  if (type === "dialogues") {
    const nodeCount = countArray(data.nodes);
    const statementCount = countArray(data.statement_nodes);
    const chapterCount = countChapterScopeForDescription(data);
    return language === "ko"
      ? `노드 ${nodeCount}개 · 진술 ${statementCount}개 · 챕터 ${chapterCount}개`
      : `${nodeCount} nodes · ${statementCount} statements · ${chapterCount} chapters`;
  }

  if (type === "chapters") {
    const dialogueCount = countArray(data.dialogues ?? data.dialogue_ids);
    return language === "ko"
      ? `순서 ${data.order ?? "-"} · 대사 ${dialogueCount}개`
      : `order ${data.order ?? "-"} · ${dialogueCount} dialogues`;
  }

  if (type === "characters") {
    const portraitCount = data.portraits && typeof data.portraits === "object" ? Object.keys(data.portraits).length : 0;
    return language === "ko" ? `초상 ${portraitCount}개` : `${portraitCount} portraits`;
  }

  if (type === "story_assets") {
    return [data.kind || (language === "ko" ? "에셋" : "asset"), data.path || ""].filter(Boolean).join(" · ");
  }

  const chapterCount = countChapterScopeForDescription(data);
  return language === "ko" ? `챕터 ${chapterCount}개` : `${chapterCount} chapters`;
}

function countChapterScopeForDescription(data: ResourceRecord): number {
  const metadata = data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
    ? data.metadata as ResourceRecord
    : {};
  const value = data.chapters ?? data.chapter_ids ?? metadata.chapters ?? metadata.chapter_ids;
  if (Array.isArray(value)) return value.length;
  if (typeof value === "string" && value.trim()) return 1;
  return 0;
}

function sanitizeHexColor(value: unknown, fallback: string): string {
  const text = String(value || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(text)) return text;
  if (/^[0-9a-f]{6}$/i.test(text)) return `#${text}`;
  return fallback;
}

function hexToRgb(value: string): { r: number; g: number; b: number } {
  const hex = sanitizeHexColor(value, defaultCustomAccent).slice(1);
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  };
}

function mixHex(source: string, target: string, targetWeight: number): string {
  const a = hexToRgb(source);
  const b = hexToRgb(target);
  const weight = clampNumber(targetWeight, 0, 1, 0.5);
  const channel = (from: number, to: number) => Math.round(from * (1 - weight) + to * weight);
  return `#${[channel(a.r, b.r), channel(a.g, b.g), channel(a.b, b.b)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function hexToRgba(value: string, alpha: number): string {
  const color = hexToRgb(value);
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${clampNumber(alpha, 0, 1, 0.24)})`;
}

function readableTextColor(background: string): string {
  const { r, g, b } = hexToRgb(background);
  const luminance = [r, g, b]
    .map((channel) => {
      const srgb = channel / 255;
      return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  return luminance > 0.48 ? "#101417" : "#ffffff";
}

function normalizeGodotPreviewEndpoint(value: string) {
  const trimmed = String(value || "").trim();
  return (trimmed || godotPreviewDefaultEndpoint).replace(/\/+$/, "");
}

function godotPreviewUrl(endpoint: string, path: string) {
  return `${normalizeGodotPreviewEndpoint(endpoint)}/${String(path || "").replace(/^\/+/, "")}`;
}

function resolveGodotPreviewBridgeUrl(endpoint: string, path: string) {
  const resolved = path.startsWith("http") ? path : godotPreviewUrl(endpoint, path);
  if (typeof window === "undefined") return resolved;
  try {
    const url = new URL(resolved, window.location.origin);
    const payloadUrl = url.searchParams.get("editor_preview_payload");
    if (payloadUrl) {
      url.searchParams.set("editor_preview_payload", payloadUrl.startsWith("http") ? payloadUrl : godotPreviewUrl(endpoint, payloadUrl));
    }
    if (resolved.startsWith("http")) return url.toString();
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return resolved;
  }
}

function bridgeErrorMessage(body: unknown, fallback: string) {
  const record = body && typeof body === "object" ? body as ResourceRecord : {};
  const error = record.error;
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const message = String((error as ResourceRecord).message || (error as ResourceRecord).detail || "").trim();
    if (message) return message;
  }
  const message = String(record.message || "").trim();
  return message || fallback;
}

function isLegacyLoopbackGodotPreviewEndpoint(value: string) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    return ["127.0.0.1", "localhost", "::1", "[::1]"].includes(host) && godotPreviewLegacyLoopbackPorts.has(parsed.port || "80");
  } catch {
    return false;
  }
}

function clampPortraitCenterZoom(value: unknown) {
  const step = portraitCenterZoomStep;
  const raw = Number(value);
  const clamped = clampNumber(Number.isFinite(raw) ? raw : portraitCenterZoomDefault, portraitCenterZoomMin, portraitCenterZoomMax, portraitCenterZoomDefault);
  return roundForInput(Math.round(clamped / step) * step);
}

function portraitCenterAnchorYForZoom(viewZoom: number) {
  const t = clamp01Number(
    (viewZoom - portraitCenterAnchorYZoomLo) / (portraitCenterAnchorYZoomHi - portraitCenterAnchorYZoomLo),
    0
  );
  return portraitCenterAnchorYAt100 + t * (portraitCenterAnchorYAt500 - portraitCenterAnchorYAt100);
}

function portraitCenterAnchor(viewZoom: number): PointerPoint {
  return {
    x: portraitCenterCanvasWidth * portraitCenterAnchorX,
    y: portraitCenterCanvasHeight * portraitCenterAnchorYForZoom(viewZoom)
  };
}

function portraitCenterImageSize(image: HTMLImageElement, viewZoom: number) {
  const sourceWidth = image.naturalWidth || image.width || 1;
  const sourceHeight = image.naturalHeight || image.height || 1;
  const baseScale = Math.min(
    (portraitCenterCanvasWidth * 0.88) / sourceWidth,
    (portraitCenterCanvasHeight * 0.88) / sourceHeight,
    2
  );
  const scale = baseScale * clampPortraitCenterZoom(viewZoom);
  return {
    width: Math.max(1, sourceWidth * scale),
    height: Math.max(1, sourceHeight * scale)
  };
}

function portraitCenterOffsetFromCenter(image: HTMLImageElement, center: PointerPoint, viewZoom: number): PointerPoint {
  const size = portraitCenterImageSize(image, viewZoom);
  const anchor = portraitCenterAnchor(viewZoom);
  return {
    x: anchor.x - clamp01Number(center.x, 0.5) * size.width,
    y: anchor.y - clamp01Number(center.y, 0.5) * size.height
  };
}

function portraitCenterFromOffset(image: HTMLImageElement | null, offset: PointerPoint, viewZoom: number): PointerPoint {
  if (!image) return { x: 0.5, y: 0.5 };
  const size = portraitCenterImageSize(image, viewZoom);
  const anchor = portraitCenterAnchor(viewZoom);
  return {
    x: round4Number(clamp01Number((anchor.x - offset.x) / size.width, 0.5)),
    y: round4Number(clamp01Number((anchor.y - offset.y) / size.height, 0.5))
  };
}

function getProfileZoom(value: unknown) {
  return clampNumber(value, profileZoomMin, profileZoomMax, profileZoomDefault);
}

function getProfileOffset(profile: unknown): PointerPoint {
  const raw = profile && typeof profile === "object" ? (profile as ResourceRecord).offset : null;
  if (Array.isArray(raw)) {
    return { x: round4Number(Number(raw[0]) || 0), y: round4Number(Number(raw[1]) || 0) };
  }
  if (raw && typeof raw === "object") {
    const record = raw as ResourceRecord;
    return { x: round4Number(Number(record.x ?? record[0]) || 0), y: round4Number(Number(record.y ?? record[1]) || 0) };
  }
  return { x: 0, y: 0 };
}

function getPortraitCenterPoint(value: unknown): PointerPoint {
  const raw = asArray<number>(value);
  if (raw.length >= 2) {
    return { x: clamp01Number(raw[0], 0.5), y: clamp01Number(raw[1], 0.5) };
  }
  if (value && typeof value === "object") {
    const record = value as ResourceRecord;
    return {
      x: clamp01Number(record.x ?? record[0], 0.5),
      y: clamp01Number(record.y ?? record[1], 0.5)
    };
  }
  return { x: 0.5, y: 0.5 };
}

function isDefaultPortraitCenterPoint(point: PointerPoint) {
  return Math.abs(point.x - 0.5) < 0.001 && Math.abs(point.y - 0.5) < 0.001;
}

function withProfileZoom(profile: ResourceRecord, zoom: unknown): ResourceRecord {
  const { center: _center, ...rest } = profile;
  return {
    ...rest,
    zoom: getProfileZoom(zoom)
  };
}

function withProfileOffset(profile: ResourceRecord, offset: PointerPoint): ResourceRecord {
  const { center: _center, ...rest } = profile;
  return {
    ...rest,
    offset: [round4Number(offset.x), round4Number(offset.y)]
  };
}

function profileCropSummary(profile: ResourceRecord) {
  const offset = getProfileOffset(profile);
  return `zoom ${Math.round(getProfileZoom(profile.zoom) * 100)}% · offset ${offset.x.toFixed(4)}, ${offset.y.toFixed(4)}`;
}

function getSpectrumOffset(value: unknown): PointerPoint {
  if (Array.isArray(value)) {
    return { x: round4Number(Number(value[0]) || 0), y: round4Number(Number(value[1]) || 0) };
  }
  if (value && typeof value === "object") {
    const record = value as ResourceRecord;
    return { x: round4Number(Number(record.x ?? record[0]) || 0), y: round4Number(Number(record.y ?? record[1]) || 0) };
  }
  return { x: 0, y: 0 };
}

function getDefaultSpectrumPortrait(value: unknown) {
  const portraits = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, ResourceRecord | string>
    : {};
  const entries = Object.entries(portraits).map(([key, entry]) => normalizeSpectrumPortraitEntry(key, entry));
  return entries.find((entry) => entry.key.toLowerCase() === "default" && entry.path)
    || entries.find((entry) => entry.path)
    || null;
}

function normalizeSpectrumPortraitEntry(key: string, entry: ResourceRecord | string) {
  if (typeof entry === "string") {
    return { key, path: entry, center: { x: 0.5, y: 0.5 } };
  }
  return {
    key,
    path: String(entry?.path || ""),
    center: getPortraitCenterPoint(entry?.center)
  };
}

function getGameFacePosition() {
  return {
    x: portraitEditorCanvasWidth * gameFaceAnchorX,
    y: portraitEditorCanvasHeight * gameFaceAnchorY
  };
}

function drawSpectrumOffsetCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | null,
  faceCenter: PointerPoint,
  offset: PointerPoint,
  nameColor: string
) {
  const context = setupFixedCanvas(canvas, portraitEditorCanvasWidth, portraitEditorCanvasHeight);
  context.fillStyle = "#0f0d14";
  context.fillRect(0, 0, portraitEditorCanvasWidth, portraitEditorCanvasHeight);
  drawSpectrumGrid(context);

  const facePosition = getGameFacePosition();
  if (image) {
    const sourceWidth = Math.max(1, image.naturalWidth || image.width);
    const sourceHeight = Math.max(1, image.naturalHeight || image.height);
    const baseScale = Math.min(
      (portraitEditorCanvasWidth * 0.92) / sourceWidth,
      (portraitEditorCanvasHeight * 0.92) / sourceHeight
    );
    const scale = baseScale * (gamePortraitZoomPercent / 100);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    context.drawImage(
      image,
      facePosition.x - faceCenter.x * width,
      facePosition.y - faceCenter.y * height,
      width,
      height
    );
  }

  drawSpectrumFaceCrosshair(context, facePosition);
  drawSpectrumPreview(context, {
    x: facePosition.x + offset.x * portraitEditorCanvasWidth,
    y: facePosition.y + offset.y * portraitEditorCanvasHeight
  }, nameColor);
}

function drawSpectrumFaceCrosshair(context: CanvasRenderingContext2D, facePosition: PointerPoint) {
  context.strokeStyle = "rgba(120, 220, 255, 0.35)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(facePosition.x + 0.5, 0);
  context.lineTo(facePosition.x + 0.5, portraitEditorCanvasHeight);
  context.moveTo(0, facePosition.y + 0.5);
  context.lineTo(portraitEditorCanvasWidth, facePosition.y + 0.5);
  context.stroke();

  context.strokeStyle = "rgba(120, 220, 255, 0.85)";
  const size = 10;
  context.beginPath();
  context.moveTo(facePosition.x - size, facePosition.y);
  context.lineTo(facePosition.x + size, facePosition.y);
  context.moveTo(facePosition.x, facePosition.y - size);
  context.lineTo(facePosition.x, facePosition.y + size);
  context.stroke();
}

function drawSpectrumPreview(context: CanvasRenderingContext2D, point: PointerPoint, nameColor: string) {
  const span = portraitEditorCanvasWidth * spectrumPreviewWidthRatio;
  const barCount = Math.max(28, Math.round(span / 7));
  const barWidth = Math.max(2, Math.min(4, span / barCount * 0.46));
  const step = span / Math.max(1, barCount - 1);
  const startX = point.x - span / 2;
  const baseHeight = 10;
  const spectrumColor = normalizeCanvasColor(nameColor, "#ffffff");

  context.strokeStyle = "rgba(255, 255, 255, 0.7)";
  context.lineWidth = 1;
  context.setLineDash([4, 3]);
  context.beginPath();
  context.moveTo(point.x - span / 2, point.y);
  context.lineTo(point.x + span / 2, point.y);
  context.stroke();
  context.setLineDash([]);

  context.save();
  context.fillStyle = spectrumColor;
  context.globalAlpha = 0.55;
  for (let index = 0; index < barCount; index += 1) {
    const ratio = index / Math.max(1, barCount - 1);
    const wave = Math.sin(ratio * Math.PI * 4.2) * 0.52 + Math.sin(ratio * Math.PI * 10.4) * 0.18;
    const envelope = 0.74 + Math.sin(ratio * Math.PI) * 0.28;
    const height = Math.max(6, baseHeight + (wave + 1) * 7 * envelope);
    const x = startX + step * index - barWidth / 2;
    context.fillRect(x, point.y - height, barWidth, height);
  }
  context.restore();

  context.fillStyle = "rgba(255, 79, 168, 0.25)";
  context.strokeStyle = "#ff4fa8";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(point.x, point.y, 10, 0, Math.PI * 2);
  context.fill();
  context.stroke();
}

function drawSpectrumGrid(context: CanvasRenderingContext2D) {
  context.strokeStyle = "rgba(255, 255, 255, 0.05)";
  context.lineWidth = 1;
  for (let x = 0; x <= portraitEditorCanvasWidth; x += 20) {
    context.beginPath();
    context.moveTo(x + 0.5, 0);
    context.lineTo(x + 0.5, portraitEditorCanvasHeight);
    context.stroke();
  }
  for (let y = 0; y <= portraitEditorCanvasHeight; y += 20) {
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(portraitEditorCanvasWidth, y + 0.5);
    context.stroke();
  }
}

function normalizeCanvasColor(value: string, fallback: string) {
  return /^#[0-9a-f]{3,8}$/i.test(String(value || "").trim()) ? String(value).trim() : fallback;
}

function drawPortraitCenterCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | null,
  imageOffset: PointerPoint,
  center: PointerPoint,
  viewZoom: number
) {
  const context = setupFixedCanvas(canvas, portraitCenterCanvasWidth, portraitCenterCanvasHeight);
  drawPortraitCenterBackground(context);

  if (image) {
    const size = portraitCenterImageSize(image, viewZoom);
    context.drawImage(
      image,
      Math.round(imageOffset.x),
      Math.round(imageOffset.y),
      Math.max(1, Math.round(size.width)),
      Math.max(1, Math.round(size.height))
    );
  }

  drawPortraitCenterCrosshair(context, center, viewZoom);
}

function drawPortraitCenterBackground(context: CanvasRenderingContext2D) {
  context.clearRect(0, 0, portraitCenterCanvasWidth, portraitCenterCanvasHeight);
  context.fillStyle = "#0d1115";
  context.fillRect(0, 0, portraitCenterCanvasWidth, portraitCenterCanvasHeight);
  context.strokeStyle = "rgba(255, 255, 255, 0.06)";
  context.lineWidth = 1;
  for (let x = 0; x <= portraitCenterCanvasWidth; x += 20) {
    context.beginPath();
    context.moveTo(x + 0.5, 0);
    context.lineTo(x + 0.5, portraitCenterCanvasHeight);
    context.stroke();
  }
  for (let y = 0; y <= portraitCenterCanvasHeight; y += 20) {
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(portraitCenterCanvasWidth, y + 0.5);
    context.stroke();
  }
}

function drawPortraitCenterCrosshair(context: CanvasRenderingContext2D, center: PointerPoint, viewZoom: number) {
  const anchor = portraitCenterAnchor(viewZoom);
  const ax = Math.round(anchor.x) + 0.5;
  const ay = Math.round(anchor.y) + 0.5;
  context.strokeStyle = "rgba(126, 231, 216, 0.72)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(ax, 0);
  context.lineTo(ax, portraitCenterCanvasHeight);
  context.moveTo(0, ay);
  context.lineTo(portraitCenterCanvasWidth, ay);
  context.stroke();

  context.fillStyle = "rgba(126, 231, 216, 0.22)";
  context.strokeStyle = "#7ee7d8";
  context.beginPath();
  context.arc(anchor.x, anchor.y, 8, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.fillStyle = "rgba(228, 234, 239, 0.74)";
  context.font = "700 11px Pretendard, system-ui, sans-serif";
  context.textAlign = "right";
  context.textBaseline = "top";
  context.fillText(`${center.x.toFixed(3)}, ${center.y.toFixed(3)}`, portraitCenterCanvasWidth - 8, 8);
}

function drawProfileCropCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | null,
  faceCenter: PointerPoint,
  profile: { zoom: number; offset: PointerPoint }
) {
  const context = setupSquareCanvas(canvas, profileCropCanvasSize);
  context.clearRect(0, 0, profileCropCanvasSize, profileCropCanvasSize);
  drawProfileCropBackground(context);

  if (image) {
    const sourceWidth = image.naturalWidth || image.width || 1;
    const sourceHeight = image.naturalHeight || image.height || 1;
    const baseScale = Math.max(profileCropCanvasSize / sourceWidth, profileCropCanvasSize / sourceHeight);
    const scale = baseScale * getProfileZoom(profile.zoom);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    const anchor = profileCropAnchor(profile.offset);
    context.drawImage(
      image,
      Math.round(anchor.x - faceCenter.x * width),
      Math.round(anchor.y - faceCenter.y * height),
      Math.max(1, Math.round(width)),
      Math.max(1, Math.round(height))
    );
  }

  drawProfileCropGuides(context, profile.offset);
}

function setupSquareCanvas(canvas: HTMLCanvasElement, logicalSize: number) {
  const cssWidth = Math.max(1, Math.round(canvas.clientWidth || logicalSize));
  const pixelRatio = window.devicePixelRatio || 1;
  const backingSize = Math.max(1, Math.round(cssWidth * pixelRatio));
  if (canvas.width !== backingSize || canvas.height !== backingSize) {
    canvas.width = backingSize;
    canvas.height = backingSize;
  }
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context를 생성할 수 없습니다.");
  const scale = backingSize / logicalSize;
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.imageSmoothingEnabled = false;
  return context;
}

function setupFixedCanvas(canvas: HTMLCanvasElement, logicalWidth: number, logicalHeight: number) {
  const cssWidth = Math.max(1, Math.round(canvas.clientWidth || logicalWidth));
  const cssHeight = Math.max(1, Math.round(canvas.clientHeight || cssWidth * (logicalHeight / logicalWidth)));
  const pixelRatio = window.devicePixelRatio || 1;
  const backingWidth = Math.max(1, Math.round(cssWidth * pixelRatio));
  const backingHeight = Math.max(1, Math.round(cssHeight * pixelRatio));
  if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
    canvas.width = backingWidth;
    canvas.height = backingHeight;
  }
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context를 생성할 수 없습니다.");
  context.setTransform(backingWidth / logicalWidth, 0, 0, backingHeight / logicalHeight, 0, 0);
  context.imageSmoothingEnabled = false;
  return context;
}

function drawProfileCropBackground(context: CanvasRenderingContext2D) {
  context.fillStyle = "#0d1115";
  context.fillRect(0, 0, profileCropCanvasSize, profileCropCanvasSize);
}

function drawProfileCropGuides(context: CanvasRenderingContext2D, offset: PointerPoint) {
  const center = profileCropCanvasSize / 2;
  const anchor = profileCropAnchor(offset);

  context.strokeStyle = "rgba(126, 231, 216, 0.54)";
  context.lineWidth = 1;
  context.setLineDash([6, 6]);
  context.beginPath();
  context.moveTo(center + 0.5, 0);
  context.lineTo(center + 0.5, profileCropCanvasSize);
  context.moveTo(0, center + 0.5);
  context.lineTo(profileCropCanvasSize, center + 0.5);
  context.stroke();
  context.setLineDash([]);

  context.strokeStyle = "#7ee7d8";
  context.fillStyle = "rgba(126, 231, 216, 0.22)";
  context.beginPath();
  context.arc(anchor.x, anchor.y, 8, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(anchor.x - 14, anchor.y);
  context.lineTo(anchor.x - 5, anchor.y);
  context.moveTo(anchor.x + 5, anchor.y);
  context.lineTo(anchor.x + 14, anchor.y);
  context.moveTo(anchor.x, anchor.y - 14);
  context.lineTo(anchor.x, anchor.y - 5);
  context.moveTo(anchor.x, anchor.y + 5);
  context.lineTo(anchor.x, anchor.y + 14);
  context.stroke();
}

function profileCropAnchor(offset: PointerPoint) {
  return {
    x: profileCropCanvasSize * 0.5 + offset.x * profileCropCanvasSize,
    y: profileCropCanvasSize * 0.5 + offset.y * profileCropCanvasSize
  };
}

function chapterThumbnailRelativePath(chapter: ResourceRecord) {
  return `assets/chapters/${safeSegment(chapter.id || "chapter", "chapter")}/thumbnail.png`;
}

async function uploadChapterThumbnailForDraft(
  chapter: ResourceRecord,
  uploadAsset: ProjectAssetUploader = uploadProjectFile
) {
  const layers = getChapterThumbnailLayers(chapter);
  if (layers.length === 0) {
    return { skipped: true, draft: chapter, resPath: "" };
  }

  const blob = await renderChapterThumbnailBlob(layers);
  const file = new File([blob], "thumbnail.png", { type: "image/png" });
  const result = await uploadAsset(chapterThumbnailRelativePath(chapter), file);
  return {
    skipped: false,
    draft: { ...chapter, image: result.resPath },
    resPath: result.resPath,
    importStatus: result.importStatus
  };
}

function getChapterThumbnailLayers(chapter: ResourceRecord) {
  const parallax = chapter.parallax && typeof chapter.parallax === "object" ? chapter.parallax as ResourceRecord : null;
  return asArray<ResourceRecord>(parallax?.layers)
    .map((layer, index) => ({ layer, index }))
    .sort((a, b) => {
      const depthDelta = getParallaxLayerDepth(a.layer) - getParallaxLayerDepth(b.layer);
      if (Math.abs(depthDelta) > 0.0001) return depthDelta;
      const orderDelta = normalizeNumber(a.layer.order, a.index) - normalizeNumber(b.layer.order, b.index);
      return orderDelta !== 0 ? orderDelta : a.index - b.index;
    })
    .map((entry) => entry.layer);
}

async function renderChapterThumbnailBlob(layers: ResourceRecord[]) {
  const canvas = document.createElement("canvas");
  canvas.width = chapterThumbnailWidth;
  canvas.height = chapterThumbnailHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context를 생성할 수 없습니다.");

  context.clearRect(0, 0, canvas.width, canvas.height);

  for (const layer of layers) {
    const layerPath = getParallaxLayerPath(layer);
    if (layer.visible === false || layer.thumbnail_excluded === true || !layerPath) continue;
    const url = resPathToAssetUrl(layerPath);
    if (!url) continue;

    const image = await loadImageElement(url);
    const kind = getParallaxLayerKind(layer);
    const position = getParallaxLayerPosition(layer);
    const anchor = getParallaxLayerAnchor(layer);
    const defaultLayout = getParallaxLayerDefaultLayout(kind);
    const px = position[0];
    const py = position[1];
    const anchorX = anchor[0];
    const anchorY = anchor[1];
    const scaleX = getParallaxLayerScaleX(layer);
    const scaleY = getParallaxLayerScaleY(layer);
    const sourceWidth = image.naturalWidth || image.width || 1;
    const sourceHeight = image.naturalHeight || image.height || 1;
    let width: number;
    let height: number;

    if (kind === "background") {
      const coverScale = Math.max(canvas.width / sourceWidth, canvas.height / sourceHeight);
      width = sourceWidth * coverScale * scaleX;
      height = sourceHeight * coverScale * scaleY;
    } else {
      height = canvas.height * scaleY;
      width = canvas.height * scaleX * (sourceWidth / sourceHeight);
    }

    context.save();
    context.globalAlpha = clampNumber(layer.opacity, 0, 1, 1);
    context.translate(canvas.width * px, canvas.height * py);
    context.rotate((kind === "background" ? 0 : normalizeRotationDegrees(layer.rotation)) * Math.PI / 180);
    context.drawImage(image, -width * anchorX, -height * anchorY, width, height);
    context.restore();
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("썸네일 이미지를 생성할 수 없습니다."));
    }, "image/png");
  });
}

function loadImageElement(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`이미지를 불러올 수 없습니다: ${url}`));
    image.src = url;
  });
}

function getParallaxLayerKind(layer: ResourceRecord) {
  return String(layer.kind ?? layer.type ?? "").trim().toLowerCase() === "background" ? "background" : "sprite";
}

function getParallaxLayerEditorKind(layer: ResourceRecord) {
  const kind = String(layer.kind ?? layer.type ?? "sprite").trim().toLowerCase();
  return ["background", "sprite", "overlay", "title"].includes(kind) ? kind : "sprite";
}

function getParallaxLayerDefaultLayout(kind: string) {
  return kind === "background"
    ? { x: 0.5, y: 0.5, scale: 1.08 }
    : { x: 0.64, y: 0.58, scale: 0.72 };
}

function getParallaxLayerPath(layer: ResourceRecord) {
  return String(layer.path ?? layer.image ?? layer.texture ?? "");
}

function getParallaxLayerPosition(layer: ResourceRecord): [number, number] {
  const raw = asArray<number>(layer.position);
  const defaults = getParallaxLayerDefaultLayout(getParallaxLayerKind(layer));
  const x = raw.length >= 2 ? raw[0] : layer.x;
  const y = raw.length >= 2 ? raw[1] : layer.y;
  return [
    clampNumber(x, -0.5, 1.5, defaults.x),
    clampNumber(y, -0.5, 1.5, defaults.y)
  ];
}

function getParallaxLayerAnchor(layer: ResourceRecord): [number, number] {
  const raw = Array.isArray(layer.anchor)
    ? layer.anchor
    : (Array.isArray(layer.center)
      ? layer.center
      : (Array.isArray(layer.focus)
        ? layer.focus
        : (Array.isArray(layer.pivot) ? layer.pivot : [])));
  const x = raw.length >= 2 ? raw[0] : layer.anchor_x ?? layer.center_x ?? layer.focus_x ?? layer.pivot_x;
  const y = raw.length >= 2 ? raw[1] : layer.anchor_y ?? layer.center_y ?? layer.focus_y ?? layer.pivot_y;
  return [
    clamp01Number(x, 0.5),
    clamp01Number(y, 0.5)
  ];
}

function getParallaxLayerScale(layer: ResourceRecord) {
  return clampNumber(layer.scale, 0.05, 3, getParallaxLayerDefaultLayout(getParallaxLayerKind(layer)).scale);
}

function getParallaxLayerScaleX(layer: ResourceRecord) {
  const scale = getParallaxLayerScale(layer);
  return clampNumber(layer.scale_x ?? layer.scaleX ?? layer.width_scale ?? layer.widthScale, 0.05, 3, scale);
}

function getParallaxLayerScaleY(layer: ResourceRecord) {
  const scale = getParallaxLayerScale(layer);
  return clampNumber(layer.scale_y ?? layer.scaleY ?? layer.height_scale ?? layer.heightScale, 0.05, 3, scale);
}

function getParallaxLayerDepth(layer: ResourceRecord) {
  return clampNumber(layer.depth ?? layer.parallax, -2, 2, 0);
}

function getParallaxLayerMotionStrength(layer: ResourceRecord) {
  return clampNumber(
    layer.motion_strength ?? layer.motionStrength ?? layer.motion ?? layer.shake_strength ?? layer.shakeStrength ?? layer.shake ?? layer.floating_strength ?? layer.floatingStrength,
    0,
    4,
    1
  );
}

function getParallaxLayerMotionDepth(layer: ResourceRecord) {
  return layer.floating === false ? 0 : getParallaxLayerDepth(layer) * getParallaxLayerMotionStrength(layer);
}

function getParallaxLayerMotionPerspective(layer: ResourceRecord) {
  return layer.floating === false ? 0 : clampNumber(layer.perspective, -1, 1, 0);
}

function getParallaxTitleDepth(title: ResourceRecord) {
  return Boolean(title.floating) ? clampNumber(title.depth, -2, 2, 0.1) : 0;
}

function getParallaxVisualEntries(layers: ResourceRecord[], parallax: ResourceRecord) {
  const entries: ParallaxVisualEntry[] = layers
    .map((layer, index) => ({
      type: "layer" as const,
      layer,
      index,
      order: normalizeNumber(layer.order, index),
      depth: getParallaxLayerDepth(layer)
    }))
    .filter((entry) => entry.layer.visible !== false);
  const title = getParallaxTitleLayout(parallax);
  if (title.enabled) {
    entries.push({
      type: "title",
      title,
      order: normalizeNumber(title.order, entries.length),
      depth: getParallaxTitleDepth(title)
    });
  }
  return entries.sort((a, b) => {
    const depthDelta = a.depth - b.depth;
    if (Math.abs(depthDelta) > 0.0001) return depthDelta;
    const orderDelta = a.order - b.order;
    return orderDelta !== 0 ? orderDelta : ("index" in a ? a.index : layers.length) - ("index" in b ? b.index : layers.length);
  });
}

function getParallaxOverlayLayout(parallax: ResourceRecord) {
  const overlay = parallax.overlay && typeof parallax.overlay === "object" ? parallax.overlay as ResourceRecord : {};
  return {
    enabled: Boolean(overlay.enabled),
    path: String(overlay.path || ""),
    opacity: clampNumber(overlay.opacity, 0, 1, 0.55)
  };
}

function getParallaxTitleLayout(parallax: ResourceRecord) {
  const source = parallax.title && typeof parallax.title === "object" ? parallax.title as ResourceRecord : {};
  const position = asArray<number>(source.position);
  const scale = clampNumber(source.scale, 0.2, 2.4, 1);
  return {
    enabled: Boolean(source.enabled),
    image: String(source.image || ""),
    position: [
      clampNumber(position[0], -0.5, 1.5, 0.08),
      clampNumber(position[1], -0.5, 1.5, 0.18)
    ],
    scale,
    scale_x: clampNumber(source.scale_x ?? source.scaleX ?? source.width_scale ?? source.widthScale, 0.2, 2.4, scale),
    scale_y: clampNumber(source.scale_y ?? source.scaleY ?? source.height_scale ?? source.heightScale, 0.2, 2.4, scale),
    opacity: clampNumber(source.opacity, 0, 1, 1),
    order: normalizeNumber(source.order, 0),
    floating: source.floating !== false,
    depth: clampNumber(source.depth, -2, 2, 0.1),
    perspective: clampNumber(source.perspective, -1, 1, 0)
  } as ResourceRecord;
}

function parallaxVisualLayerKey(layer: ResourceRecord, index: number) {
  return `${String(layer.id || index)}:${getParallaxLayerPath(layer)}`;
}

function getParallaxLayerVisualSize(layer: ResourceRecord, aspectRatio = 1) {
  const kind = getParallaxLayerKind(layer);
  const stageAspectRatio = chapterThumbnailWidth / chapterThumbnailHeight;
  const safeAspectRatio = clampNumber(aspectRatio, 0.05, 20, 1);
  const scaleX = getParallaxLayerScaleX(layer);
  const scaleY = getParallaxLayerScaleY(layer);
  if (kind !== "background") {
    return {
      width: scaleX * safeAspectRatio / stageAspectRatio,
      height: scaleY
    };
  }
  if (safeAspectRatio >= stageAspectRatio) {
    return {
      width: scaleX * safeAspectRatio / stageAspectRatio,
      height: scaleY
    };
  }
  return {
    width: scaleX,
    height: scaleY * stageAspectRatio / safeAspectRatio
  };
}

function getParallaxLayerPreviewStyle(
  layer: ResourceRecord,
  index: number,
  aspectRatio: number | undefined,
  visualIndex: number,
  previewOffset: PointerPoint = { x: 0, y: 0 },
  strengthValue: unknown = 0,
  stageScale = 1
) {
  const position = getParallaxLayerPosition(layer);
  const x = position[0];
  const y = position[1];
  const anchor = getParallaxLayerAnchor(layer);
  const anchorX = anchor[0];
  const anchorY = anchor[1];
  const size = getParallaxLayerVisualSize(layer, aspectRatio);
  const kind = getParallaxLayerKind(layer);
  const strength = clampNumber(strengthValue, 0, 120, 0);
  const motionDepth = getParallaxLayerMotionDepth(layer);
  const perspective = getParallaxLayerMotionPerspective(layer);
  const shiftX = -previewOffset.x * strength * motionDepth * stageScale;
  const shiftY = -previewOffset.y * strength * motionDepth * stageScale;
  return {
    "--layer-x": `${x * 100}%`,
    "--layer-y": `${y * 100}%`,
    "--layer-anchor-x": `${anchorX * 100}%`,
    "--layer-anchor-y": `${anchorY * 100}%`,
    "--layer-translate-x": `${anchorX * -100}%`,
    "--layer-translate-y": `${anchorY * -100}%`,
    "--layer-width": `${size.width * 100}%`,
    "--layer-height": `${size.height * 100}%`,
    "--layer-rotation": `${kind === "background" ? 0 : normalizeRotationDegrees(layer.rotation)}deg`,
    "--layer-preview-shift-x": `${shiftX.toFixed(2)}px`,
    "--layer-preview-shift-y": `${shiftY.toFixed(2)}px`,
    "--layer-perspective-rotation": `rotateY(${perspective * previewOffset.x * 8}deg) rotateX(${-perspective * previewOffset.y * 4}deg)`,
    "--layer-opacity": String(clampNumber(layer.opacity, 0, 1, 1)),
    zIndex: visualIndex
  } as CSSProperties;
}

function getParallaxMarkerStyle(layer: ResourceRecord, index: number, visualIndex: number) {
  const position = getParallaxLayerPosition(layer);
  return {
    left: `${position[0] * 100}%`,
    top: `${position[1] * 100}%`,
    zIndex: visualIndex
  } as CSSProperties;
}

function getParallaxTitlePreviewStyle(
  title: ResourceRecord,
  visualIndex: number,
  previewOffset: PointerPoint = { x: 0, y: 0 },
  strengthValue: unknown = 0,
  stageScale = 1
) {
  const position = asArray<number>(title.position);
  const x = clampNumber(position[0], -0.5, 1.5, 0.08);
  const y = clampNumber(position[1], -0.5, 1.5, 0.18);
  const strength = clampNumber(strengthValue, 0, 120, 0);
  const depth = title.floating === false ? 0 : clampNumber(title.depth, -2, 2, 0.1);
  const perspective = title.floating === false ? 0 : clampNumber(title.perspective, -1, 1, 0);
  const shiftX = -previewOffset.x * strength * depth * stageScale;
  const shiftY = -previewOffset.y * strength * depth * stageScale;
  return {
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    opacity: clampNumber(title.opacity, 0, 1, 1),
    zIndex: visualIndex,
    transform: `translate(${shiftX.toFixed(2)}px, ${shiftY.toFixed(2)}px) scale(${clampNumber(title.scale_x, 0.2, 2.4, 1)}, ${clampNumber(title.scale_y, 0.2, 2.4, 1)}) rotateY(${perspective * previewOffset.x * 8}deg) rotateX(${-perspective * previewOffset.y * 4}deg)`
  } as CSSProperties;
}

function cloneJsonValue<T>(value: T): T {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function getChapterArtSnapshotPayload(chapter: ResourceRecord) {
  const payload: ResourceRecord = {
    image: String(chapter?.image || "")
  };
  if (Object.prototype.hasOwnProperty.call(chapter, "hasParallax")) {
    payload.hasParallax = cloneJsonValue(chapter.hasParallax);
  }
  if (Object.prototype.hasOwnProperty.call(chapter, "parallax")) {
    payload.parallax = cloneJsonValue(chapter.parallax);
  }
  return payload;
}

function createChapterArtSnapshot(chapter: ResourceRecord): ChapterArtSnapshot {
  const payload = getChapterArtSnapshotPayload(chapter);
  return {
    chapterId: String(chapter.id || ""),
    payload,
    serialized: JSON.stringify(payload)
  };
}

function applyChapterArtSnapshot(chapter: ResourceRecord, payload: ResourceRecord) {
  const next: ResourceRecord = { ...chapter, image: String(payload.image || "") };
  if (Object.prototype.hasOwnProperty.call(payload, "hasParallax")) {
    next.hasParallax = cloneJsonValue(payload.hasParallax);
  } else {
    delete next.hasParallax;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "parallax")) {
    next.parallax = cloneJsonValue(payload.parallax);
  } else {
    delete next.parallax;
  }
  return next;
}

function resPathToAssetUrl(value: unknown) {
  const path = String(value || "").trim();
  if (!path.startsWith("res://assets/")) return "";
  return `/repo/${path.replace(/^res:\/\//, "")}`;
}

function getChapterGraphPositionMap(chapter: ResourceRecord) {
  const layout = chapter.layout && typeof chapter.layout === "object" && !Array.isArray(chapter.layout) ? chapter.layout as ResourceRecord : {};
  const positions = layout.positions && typeof layout.positions === "object" && !Array.isArray(layout.positions)
    ? layout.positions as Record<string, unknown>
    : {};
  const normalized: Record<string, [number, number]> = {};
  for (const [id, value] of Object.entries(positions)) {
    const raw = asArray<number>(value);
    normalized[id] = [
      Math.round(clampNumber(raw[0], 0, chapterGraphWidth - chapterGraphNodeWidth, 80)),
      Math.round(clampNumber(raw[1], 0, chapterGraphHeight - chapterGraphNodeHeight, 80))
    ];
  }
  return normalized;
}

function autoChapterGraphPosition(index: number) {
  const column = index % 5;
  const row = Math.floor(index / 5);
  return {
    x: 80 + column * 320,
    y: 80 + row * 165
  };
}

function getChapterGraphMetadata(dialogue: ResourceRecord | undefined) {
  return dialogue?.metadata && typeof dialogue.metadata === "object" && !Array.isArray(dialogue.metadata)
    ? dialogue.metadata as ResourceRecord
    : {};
}

function getChapterGraphNext(dialogue: ResourceRecord | undefined) {
  return String(getChapterGraphMetadata(dialogue).next_dialogue || "").trim();
}

function getChapterGraphBlackout(dialogue: ResourceRecord | undefined) {
  return Boolean(getChapterGraphMetadata(dialogue).next_dialogue_blackout);
}

function getChapterGraphBlackoutFade(dialogue: ResourceRecord | undefined) {
  return normalizeBlackoutDuration(getChapterGraphMetadata(dialogue).next_dialogue_blackout_fade_duration, 0.35);
}

function getChapterGraphBlackoutHold(dialogue: ResourceRecord | undefined) {
  return normalizeBlackoutDuration(getChapterGraphMetadata(dialogue).next_dialogue_blackout_hold_duration, 0.3);
}

function normalizeBlackoutDuration(value: unknown, fallback: number) {
  return roundForInput(clampNumber(value, 0, 30, fallback));
}

function chapterGraphEdgePath(source: PointerPoint, target: PointerPoint) {
  const startX = source.x + chapterGraphNodeWidth;
  const startY = source.y + chapterGraphNodeHeight * 0.5;
  const endX = target.x;
  const endY = target.y + chapterGraphNodeHeight * 0.5;
  const handle = Math.max(80, Math.abs(endX - startX) * 0.45);
  return `M ${startX} ${startY} C ${startX + handle} ${startY}, ${endX - handle} ${endY}, ${endX} ${endY}`;
}

function chapterGraphPreviewEdgePath(source: PointerPoint, target: PointerPoint) {
  const startX = source.x + chapterGraphNodeWidth;
  const startY = source.y + chapterGraphNodeHeight * 0.5;
  const endX = target.x;
  const endY = target.y;
  const handle = Math.max(80, Math.abs(endX - startX) * 0.45);
  return `M ${startX} ${startY} C ${startX + handle} ${startY}, ${endX - handle} ${endY}, ${endX} ${endY}`;
}

function chapterGraphEdgeMenuPoint(source: PointerPoint, target: PointerPoint) {
  return {
    x: (source.x + chapterGraphNodeWidth + target.x) * 0.5,
    y: (source.y + chapterGraphNodeHeight * 0.5 + target.y + chapterGraphNodeHeight * 0.5) * 0.5
  };
}

function getChapterGraphNodeBounds(position: PointerPoint) {
  return {
    minX: position.x,
    minY: position.y,
    maxX: position.x + chapterGraphNodeWidth,
    maxY: position.y + chapterGraphNodeHeight
  };
}

function getChapterGraphBounds(placedIds: string[], positionFor: (id: string, index: number) => PointerPoint) {
  if (placedIds.length === 0) return null;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  placedIds.forEach((id, index) => {
    const position = positionFor(id, index);
    minX = Math.min(minX, position.x);
    minY = Math.min(minY, position.y);
    maxX = Math.max(maxX, position.x + chapterGraphNodeWidth);
    maxY = Math.max(maxY, position.y + chapterGraphNodeHeight);
  });
  return { minX, minY, maxX, maxY };
}

function getDialogueFirstTextPreview(dialogue: ResourceRecord | undefined) {
  if (!dialogue || dialogue.__load_error) return String(dialogue?.__load_error || "");
  const firstNode = asArray<ResourceRecord>(dialogue.nodes)[0] || asArray<ResourceRecord>(dialogue.statement_nodes)[0];
  if (!firstNode) return "";
  if (isCutsceneNode(firstNode)) return `cutscene ${getNodeCutsceneEditorValue(firstNode).image || ""}`.trim();
  if (isStageNode(firstNode)) return stageNodeSummary(firstNode, { characters: [], chapters: [], dialogues: [], items: [], storyAssets: [] });
  return getDialogueVisiblePreviewText(String(firstNode.text || "")).slice(0, 80);
}

function clamp01Number(value: unknown, fallback = 0.5) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(1, Math.max(0, number));
}

function normalizeNumber(value: unknown, fallback = 0, min?: number, max?: number) {
  const parsed = Number(value);
  let next = Number.isFinite(parsed) ? parsed : fallback;
  if (min !== undefined) next = Math.max(min, next);
  if (max !== undefined) next = Math.min(max, next);
  return roundForInput(next);
}

function normalizeBooleanFlag(value: unknown, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const text = String(value).trim().toLowerCase();
  if (["false", "0", "no", "off", "n"].includes(text)) return false;
  if (["true", "1", "yes", "on", "y"].includes(text)) return true;
  return Boolean(value);
}

function clampNumber(value: unknown, min: number, max: number, fallback = min) {
  const parsed = Number(value);
  const next = Number.isFinite(parsed) ? parsed : fallback;
  return Math.min(max, Math.max(min, next));
}

function roundCoordinate(value: number) {
  return Math.round(clamp01Number(value) * 1000) / 1000;
}

function roundParallaxCoordinate(value: number) {
  return Math.round(clampNumber(value, -0.5, 1.5, 0.5) * 1000) / 1000;
}

function roundForInput(value: number) {
  return Math.round(value * 1000) / 1000;
}

function round4Number(value: number) {
  return Math.round(value * 10000) / 10000;
}

function normalizeRotationDegrees(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  let rotation = ((parsed + 180) % 360 + 360) % 360 - 180;
  if (Math.abs(rotation) < 0.001) rotation = 0;
  return roundForInput(rotation);
}

function pointerDistance(point: PointerPoint, event: ReactPointerEvent<HTMLElement>) {
  return Math.hypot(event.clientX - point.x, event.clientY - point.y);
}

function pointerAngle(point: PointerPoint, event: ReactPointerEvent<HTMLElement>) {
  return Math.atan2(event.clientY - point.y, event.clientX - point.x) * 180 / Math.PI;
}

function rotateParallaxPoint(point: PointerPoint, degrees: number) {
  const radians = degrees * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos
  };
}

function getParallaxWheelScaleDelta(deltaY: unknown) {
  const rawDelta = Number(deltaY) || 0;
  if (rawDelta === 0) return 0;
  const tickCount = Math.max(1, Math.round(Math.abs(rawDelta) / 100));
  return -Math.sign(rawDelta) * tickCount * 0.01;
}

function layerPreviewWidthPercent(layer: ResourceRecord) {
  const kind = String(layer.kind || "sprite");
  const scale = normalizeNumber(layer.scale, 1, 0.05, 4);
  if (kind === "background") return clampNumber(scale * 100, 20, 240, 100);
  if (kind === "overlay") return clampNumber(scale * 70, 10, 180, 70);
  if (kind === "title") return clampNumber(scale * 38, 8, 120, 38);
  return clampNumber(scale * 28, 8, 120, 28);
}

function parallaxLayerTransformSummary(layer: ResourceRecord | undefined) {
  if (!layer) return "no layer";
  const anchor = getParallaxLayerAnchor(layer);
  return [
    `anchor ${anchor[0].toFixed(2)},${anchor[1].toFixed(2)}`,
    `scale ${normalizeNumber(layer.scale, 1, 0.05, 4).toFixed(2)}`,
    `rot ${normalizeRotationDegrees(layer.rotation).toFixed(1)}deg`
  ].join(" · ");
}

function formatNumberInput(value: number) {
  if (Number.isInteger(value)) return String(value);
  return String(roundForInput(value));
}

function defaultChoiceRecord(): ResourceRecord {
  return {
    label: "",
    text: "",
    next: "",
    set_flags: {},
    conditions: []
  };
}

function resolveNodeId(node: ResourceRecord, index: number, autoPrefix = "@") {
  const raw = String(node.id || "").trim();
  return raw || `${autoPrefix}${index}`;
}

function resolvePreviousPreviewNodeId(nodes: ResourceRecord[], selectedIndex: number) {
  const selectedNode = nodes[selectedIndex];
  if (!selectedNode) return "";
  const selectedNodeId = resolveNodeId(selectedNode, selectedIndex, "@");
  const linkedPreviousIndex = nodes.findIndex((node, index) => (
    index !== selectedIndex && String(node.next || "").trim() === selectedNodeId
  ));
  if (linkedPreviousIndex >= 0) return resolveNodeId(nodes[linkedPreviousIndex], linkedPreviousIndex, "@");
  return selectedIndex > 0 ? resolveNodeId(nodes[selectedIndex - 1], selectedIndex - 1, "@") : "";
}

function buildNodeSelectOptions(nodes: ResourceRecord[], autoPrefix: string, characters: ResourceSummary[]): ResourceSummary[] {
  return nodes.map((node, index) => {
    const id = resolveNodeId(node, index, autoPrefix);
    const mode = getDialogueNodeMode(node);
    const references = { characters, chapters: [], dialogues: [], items: [], storyAssets: [] };
    const title = mode === "cutscene"
      ? `${id} · 컷씬`
      : mode === "stage"
        ? `${id} · 무대`
        : `${id} · ${speakerLabel(node.speaker, characters)}`;
    return {
      id,
      title,
      subtitle: mode === "dialogue" ? getDialogueVisiblePreviewText(node.text).slice(0, 72) : dialogueNodeSummary(node, references),
      type: "dialogues"
    } as ResourceSummary;
  });
}

function normalizeJsonObject(value: unknown): ResourceRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ResourceRecord : {};
}

function isEmptyPlainRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0;
}

function normalizePortraitPositionValue(value: unknown) {
  const position = String(value || "center").trim();
  return (stageCastPositionOptions as readonly string[]).includes(position) ? position : "center";
}

function parseRichTextPreviewAst(text: string): RichTextAstNode[] {
  const root: RichTextAstNode[] = [];
  const stack: Array<{ tagName: string; children: RichTextAstNode[]; node?: Extract<RichTextAstNode, { type: "span" }> }> = [{ tagName: "", children: root }];
  const raw = String(text || "");
  let buffer = "";
  let index = 0;

  const flushBuffer = () => {
    if (!buffer) return;
    const cleanText = stripDialoguePreviewPauses(buffer);
    if (cleanText) {
      stack[stack.length - 1].children.push({ type: "text", text: cleanText });
    }
    buffer = "";
  };

  while (index < raw.length) {
    const openIndex = raw.indexOf("[", index);
    if (openIndex < 0) {
      buffer += raw.slice(index);
      break;
    }

    buffer += raw.slice(index, openIndex);
    const closeIndex = raw.indexOf("]", openIndex + 1);
    if (closeIndex < 0) {
      buffer += raw.slice(openIndex);
      break;
    }

    const tagBody = raw.slice(openIndex + 1, closeIndex);
    const tagName = getBbcodeTagName(tagBody);
    const isClosing = tagBody.trim().startsWith("/");

    if (tagName === "lb" || tagName === "rb") {
      flushBuffer();
      stack[stack.length - 1].children.push({ type: "text", text: tagName === "lb" ? "[" : "]" });
      index = closeIndex + 1;
      continue;
    }

    if (dialogueEventTagNames.has(tagName)) {
      flushBuffer();
      if (!isClosing) {
        stack[stack.length - 1].children.push({
          type: "event",
          tagName,
          attrs: parseBbcodeAttributes(tagBody),
          raw: `[${tagBody}]`,
          range: { start: openIndex, end: closeIndex + 1 }
        });
      }
      index = closeIndex + 1;
      continue;
    }

    if (!dialogueBbcodeTagNames.has(tagName)) {
      buffer += raw.slice(openIndex, closeIndex + 1);
      index = closeIndex + 1;
      continue;
    }

    flushBuffer();
    if (isClosing) {
      closeRichTextPreviewTag(stack, tagName, closeIndex + 1);
    } else {
      const span: RichTextAstNode = {
        type: "span",
        tagName,
        attrs: parseBbcodeAttributes(tagBody),
        children: [],
        range: { start: openIndex, end: closeIndex + 1 }
      };
      stack[stack.length - 1].children.push(span);
      stack.push({ tagName, children: span.children, node: span });
    }
    index = closeIndex + 1;
  }

  flushBuffer();
  return root;
}

function renderRichTextNodes(nodes: RichTextAstNode[], keyPrefix: string, references?: ReferenceResources): ReactNode[] {
  return nodes.map((node, index) => renderRichTextNode(node, `${keyPrefix}-${index}`, references));
}

function renderRichTextNode(node: RichTextAstNode, key: string, references?: ReferenceResources): ReactNode {
  if (node.type === "text") {
    return <span key={key}>{node.text}</span>;
  }

  if (node.type === "event") {
    return renderRichTextEventMarker(node, key, references);
  }

  const presentation = getRichTextTagPresentation(node.tagName, node.attrs, references);
  const perCharacterMotion = ["blink", "shake", "wave", "tornado"].includes(node.tagName);
  const presentationClassNames = perCharacterMotion
    ? presentation.classNames.filter((className) => !["rich-text-motion", "rich-text-blink", "rich-text-shake", "rich-text-wave", "rich-text-tornado"].includes(className))
    : presentation.classNames;
  const className = ["rich-text-token", ...presentationClassNames].filter(Boolean).join(" ");
  const children = node.tagName === "fade"
    ? renderStaticFadeNodes(node.children, node.attrs, `${key}-fade`, references)
    : node.tagName === "grow"
      ? renderGrowEffectNodes(node.children, node.attrs, `${key}-grow`, references)
      : node.tagName === "blink"
        ? renderBlinkEffectNodes(node.children, node.attrs, `${key}-blink`, references)
        : ["shake", "wave", "tornado"].includes(node.tagName)
          ? renderMotionEffectNodes(node.children, node.tagName, node.attrs, `${key}-motion`, references)
          : isFontScaleGradientTag(node)
            ? renderFontScaleGradientNodes(node.children, node.attrs, `${key}-gradient`, references)
            : renderRichTextNodes(node.children, key, references);

  return (
    <span
      className={className}
      data-rich-text-note={presentation.dataNote}
      key={key}
      style={presentation.style}
      title={presentation.title}
    >
      {children}
    </span>
  );
}

function renderStaticFadeNodes(nodes: RichTextAstNode[], attrs: BbcodeAttributes, keyPrefix: string, references?: ReferenceResources): ReactNode[] {
  const visibleCount = countRichTextVisibleCharacters(nodes);
  const fadeStart = Math.min(visibleCount, Math.max(0, Math.round(getBbcodeAttrNumber(attrs, ["start", "from_index", "offset"], 0))));
  const defaultLength = Math.max(visibleCount - fadeStart, 0);
  const fadeLength = Math.max(0, Math.round(getBbcodeAttrNumber(attrs, ["length", "len", "count"], defaultLength)));
  const fadeEnd = Math.min(visibleCount, Math.max(fadeStart, fadeStart + fadeLength));
  const fromAlpha = getBbcodeAttrNumber(attrs, ["from", "from_alpha", "start_alpha"], 1, 0, 1);
  const toAlpha = getBbcodeAttrNumber(attrs, ["to", "to_alpha", "end_alpha", "min"], 0.3, 0, 1);
  const cursor = { index: 0 };
  return nodes.flatMap((node, index) => renderStaticFadeNode(node, `${keyPrefix}-${index}`, cursor, fadeStart, fadeEnd, fromAlpha, toAlpha, references));
}

function renderStaticFadeNode(
  node: RichTextAstNode,
  key: string,
  cursor: { index: number },
  fadeStart: number,
  fadeEnd: number,
  fromAlpha: number,
  toAlpha: number,
  references?: ReferenceResources
): ReactNode[] {
  if (node.type === "event") {
    return cursor.index < fadeEnd ? [renderRichTextEventMarker(node, key, references)] : [];
  }

  if (node.type === "text") {
    const rendered: ReactNode[] = [];
    for (const [index, character] of Array.from(node.text).entries()) {
      if (cursor.index >= fadeEnd) break;
      const alpha = staticFadeAlphaForIndex(cursor.index, fadeStart, fadeEnd, fromAlpha, toAlpha);
      cursor.index += 1;
      rendered.push(
        <span className="rich-text-static-fade-char" key={`${key}-${index}`} style={{ opacity: alpha }}>
          {character}
        </span>
      );
    }
    return rendered;
  }

  if (cursor.index >= fadeEnd) return [];
  const presentation = getRichTextTagPresentation(node.tagName, node.attrs, references);
  const children = renderStaticFadeNodesWithCursor(node.children, `${key}-nested`, cursor, fadeStart, fadeEnd, fromAlpha, toAlpha, references);
  if (children.length === 0) return [];
  return [
    <span
      className={["rich-text-token", ...presentation.classNames].filter(Boolean).join(" ")}
      data-rich-text-note={presentation.dataNote}
      key={key}
      style={presentation.style}
      title={presentation.title}
    >
      {children}
    </span>
  ];
}

function renderStaticFadeNodesWithCursor(
  nodes: RichTextAstNode[],
  keyPrefix: string,
  cursor: { index: number },
  fadeStart: number,
  fadeEnd: number,
  fromAlpha: number,
  toAlpha: number,
  references?: ReferenceResources
): ReactNode[] {
  return nodes.flatMap((node, index) => renderStaticFadeNode(node, `${keyPrefix}-${index}`, cursor, fadeStart, fadeEnd, fromAlpha, toAlpha, references));
}

function staticFadeAlphaForIndex(index: number, fadeStart: number, fadeEnd: number, fromAlpha: number, toAlpha: number) {
  if (index < fadeStart || fadeEnd <= fadeStart) return 1;
  const fadeCount = fadeEnd - fadeStart;
  const amount = fadeCount > 1 ? (index - fadeStart) / (fadeCount - 1) : 0;
  return fromAlpha + (toAlpha - fromAlpha) * Math.min(1, Math.max(0, amount));
}

function renderGrowEffectNodes(nodes: RichTextAstNode[], attrs: BbcodeAttributes, keyPrefix: string, references?: ReferenceResources): ReactNode[] {
  const cursor = { index: 0 };
  const from = getBbcodeAttrNumber(attrs, "from", 0.78, 0.05, 4);
  const to = getBbcodeAttrNumber(attrs, "to", 1.34, 0.05, 4);
  const duration = getBbcodeAttrNumber(attrs, "duration", 1.05, 0.05, 8);
  const delay = getBbcodeAttrNumber(attrs, "delay", 0.018, 0, 0.5);
  return nodes.flatMap((node, index) => renderGrowEffectNode(node, `${keyPrefix}-${index}`, cursor, from, to, duration, delay, references));
}

function renderGrowEffectNode(
  node: RichTextAstNode,
  key: string,
  cursor: { index: number },
  from: number,
  to: number,
  duration: number,
  delay: number,
  references?: ReferenceResources
): ReactNode[] {
  if (node.type === "event") {
    return [renderRichTextEventMarker(node, key, references)];
  }

  if (node.type === "text") {
    return Array.from(node.text).map((character, index) => {
      const charIndex = cursor.index;
      cursor.index += 1;
      return (
        <span
          className="rich-text-grow-char"
          key={`${key}-${index}`}
          style={{
            "--rich-text-grow-from": String(from),
            "--rich-text-grow-to": String(to),
            "--rich-text-grow-lift": `${-9 * (to - 1)}px`,
            animationDelay: `${charIndex * delay}s`,
            animationDuration: `${duration}s`
          } as CSSProperties}
        >
          {character}
        </span>
      );
    });
  }

  const presentation = getRichTextTagPresentation(node.tagName, node.attrs, references);
  return [
    <span
      className={["rich-text-token", ...presentation.classNames].filter(Boolean).join(" ")}
      data-rich-text-note={presentation.dataNote}
      key={key}
      style={presentation.style}
      title={presentation.title}
    >
      {renderGrowEffectNodesWithCursor(node.children, `${key}-nested`, cursor, from, to, duration, delay, references)}
    </span>
  ];
}

function renderGrowEffectNodesWithCursor(
  nodes: RichTextAstNode[],
  keyPrefix: string,
  cursor: { index: number },
  from: number,
  to: number,
  duration: number,
  delay: number,
  references?: ReferenceResources
): ReactNode[] {
  return nodes.flatMap((node, index) => renderGrowEffectNode(node, `${keyPrefix}-${index}`, cursor, from, to, duration, delay, references));
}

function renderMotionEffectNodes(nodes: RichTextAstNode[], tagName: string, attrs: BbcodeAttributes, keyPrefix: string, references?: ReferenceResources): ReactNode[] {
  const cursor = { index: 0 };
  const config = getRichTextMotionConfig(tagName, attrs);
  return nodes.flatMap((node, index) => renderMotionEffectNode(node, `${keyPrefix}-${index}`, cursor, config, references));
}

function renderMotionEffectNode(
  node: RichTextAstNode,
  key: string,
  cursor: { index: number },
  config: RichTextMotionConfig,
  references?: ReferenceResources
): ReactNode[] {
  if (node.type === "event") {
    return [renderRichTextEventMarker(node, key, references)];
  }

  if (node.type === "text") {
    return Array.from(node.text).map((character, index) => {
      const charIndex = cursor.index;
      cursor.index += 1;
      return (
        <span
          className={`rich-text-motion-char rich-text-${config.tagName}-char`}
          key={`${key}-${index}`}
          style={{
            [config.variableName]: `${config.amount}px`,
            animationDelay: `${-charIndex * config.phaseStep}s`,
            animationDuration: `${config.duration}s`
          } as CSSProperties}
        >
          {character}
        </span>
      );
    });
  }

  const presentation = getRichTextTagPresentation(node.tagName, node.attrs, references);
  return [
    <span
      className={["rich-text-token", ...presentation.classNames].filter(Boolean).join(" ")}
      data-rich-text-note={presentation.dataNote}
      key={key}
      style={presentation.style}
      title={presentation.title}
    >
      {renderMotionEffectNodesWithCursor(node.children, `${key}-nested`, cursor, config, references)}
    </span>
  ];
}

function renderMotionEffectNodesWithCursor(
  nodes: RichTextAstNode[],
  keyPrefix: string,
  cursor: { index: number },
  config: RichTextMotionConfig,
  references?: ReferenceResources
): ReactNode[] {
  return nodes.flatMap((node, index) => renderMotionEffectNode(node, `${keyPrefix}-${index}`, cursor, config, references));
}

function renderBlinkEffectNodes(nodes: RichTextAstNode[], attrs: BbcodeAttributes, keyPrefix: string, references?: ReferenceResources): ReactNode[] {
  const cursor = { index: 0 };
  const frequency = getBbcodeAttrNumber(attrs, "freq", 3.4, 0.1, 12);
  const minAlpha = getBbcodeAttrNumber(attrs, "min", 0.12, 0, 1);
  return nodes.flatMap((node, index) => renderBlinkEffectNode(node, `${keyPrefix}-${index}`, cursor, frequency, minAlpha, references));
}

function renderBlinkEffectNode(
  node: RichTextAstNode,
  key: string,
  cursor: { index: number },
  frequency: number,
  minAlpha: number,
  references?: ReferenceResources
): ReactNode[] {
  if (node.type === "event") {
    return [renderRichTextEventMarker(node, key, references)];
  }

  if (node.type === "text") {
    return Array.from(node.text).map((character, index) => {
      const charIndex = cursor.index;
      cursor.index += 1;
      const phaseDelay = -(charIndex * 0.08) / (Math.PI * 2 * frequency);
      return (
        <span
          className="rich-text-blink-char"
          key={`${key}-${index}`}
          style={{
            "--rich-text-blink-min": String(minAlpha),
            animationDelay: `${phaseDelay}s`,
            animationDuration: `${1 / frequency}s`
          } as CSSProperties}
        >
          {character}
        </span>
      );
    });
  }

  const presentation = getRichTextTagPresentation(node.tagName, node.attrs, references);
  return [
    <span
      className={["rich-text-token", ...presentation.classNames].filter(Boolean).join(" ")}
      data-rich-text-note={presentation.dataNote}
      key={key}
      style={presentation.style}
      title={presentation.title}
    >
      {renderBlinkEffectNodesWithCursor(node.children, `${key}-nested`, cursor, frequency, minAlpha, references)}
    </span>
  ];
}

function renderBlinkEffectNodesWithCursor(
  nodes: RichTextAstNode[],
  keyPrefix: string,
  cursor: { index: number },
  frequency: number,
  minAlpha: number,
  references?: ReferenceResources
): ReactNode[] {
  return nodes.flatMap((node, index) => renderBlinkEffectNode(node, `${keyPrefix}-${index}`, cursor, frequency, minAlpha, references));
}

function renderFontScaleGradientNodes(nodes: RichTextAstNode[], attrs: BbcodeAttributes, keyPrefix: string, references?: ReferenceResources): ReactNode[] {
  const visibleCount = countRichTextVisibleCharacters(nodes);
  const cursor = { index: 0 };
  const from = normalizeDialogueFontScale(firstDefinedBbcodeAttr(attrs, ["from", "from_scale", "start"]), 1);
  const to = normalizeDialogueFontScale(firstDefinedBbcodeAttr(attrs, ["to", "to_scale", "end"]), 0.3);
  return nodes.flatMap((node, index) => renderFontScaleGradientNode(node, `${keyPrefix}-${index}`, cursor, visibleCount, from, to, references));
}

function renderFontScaleGradientNode(
  node: RichTextAstNode,
  key: string,
  cursor: { index: number },
  visibleCount: number,
  from: number,
  to: number,
  references?: ReferenceResources
): ReactNode[] {
  if (node.type === "event") {
    return [renderRichTextEventMarker(node, key, references)];
  }

  if (node.type === "text") {
    return Array.from(node.text).map((character, index) => {
      const amount = visibleCount <= 1 ? 0 : cursor.index / (visibleCount - 1);
      cursor.index += 1;
      const scale = from + (to - from) * amount;
      return (
        <span className="rich-text-font-gradient-char" key={`${key}-${index}`} style={{ fontSize: `${formatDialogueFontScale(scale)}em` }}>
          {character}
        </span>
      );
    });
  }

  const presentation = getRichTextTagPresentation(node.tagName, node.attrs, references);
  const className = ["rich-text-token", ...presentation.classNames].filter(Boolean).join(" ");
  return [
    <span
      className={className}
      data-rich-text-note={presentation.dataNote}
      key={key}
      style={presentation.style}
      title={presentation.title}
    >
      {renderFontScaleGradientNodesWithCursor(node.children, `${key}-nested`, cursor, visibleCount, from, to, references)}
    </span>
  ];
}

function renderFontScaleGradientNodesWithCursor(
  nodes: RichTextAstNode[],
  keyPrefix: string,
  cursor: { index: number },
  visibleCount: number,
  from: number,
  to: number,
  references?: ReferenceResources
): ReactNode[] {
  return nodes.flatMap((node, index) => renderFontScaleGradientNode(node, `${keyPrefix}-${index}`, cursor, visibleCount, from, to, references));
}

function renderRichTextEventMarker(node: Extract<RichTextAstNode, { type: "event" }>, key: string, references?: ReferenceResources) {
  return <RichTextEventMarker key={key} node={node} references={references} />;
}

function RichTextEventMarker({ node, references }: { node: Extract<RichTextAstNode, { type: "event" }>; references?: ReferenceResources }) {
  const onRemoveRange = useContext(RichTextRemoveContext);
  const note = formatEventAttrSummary(node.tagName, node.attrs, references);
  const canRemove = Boolean(onRemoveRange && isValidRichTextSourceRange(node.range));
  const label = eventTagLabel(node.tagName);
  return (
    <span className={`rich-text-event-marker ${canRemove ? "removable" : ""}`} title={node.raw}>
      {label}
      {note ? <small>{note}</small> : null}
      {canRemove && (
        <button
          aria-label={`${label} 태그 제거`}
          className="rich-text-remove-button"
          title="태그 제거"
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (isValidRichTextSourceRange(node.range)) onRemoveRange?.(node.range);
          }}
        >
          x
        </button>
      )}
    </span>
  );
}

function isValidRichTextSourceRange(range: RichTextSourceRange | undefined): range is RichTextSourceRange {
  return Boolean(range && Number.isFinite(range.start) && Number.isFinite(range.end) && range.end > range.start);
}

function getRichTextMotionConfig(tagName: string, attrs: BbcodeAttributes): RichTextMotionConfig {
  if (tagName === "wave") {
    const amp = getBbcodeAttrNumber(attrs, "amp", 14, 2, 60);
    const freq = getBbcodeAttrNumber(attrs, "freq", 3, 0.1, 12);
    return {
      tagName,
      variableName: "--rich-text-wave-amp",
      amount: amp * 0.14,
      duration: Math.max(0.28, 1 / freq),
      phaseStep: 0.075
    };
  }
  if (tagName === "tornado") {
    const radius = getBbcodeAttrNumber(attrs, "radius", 5, 1, 30);
    const freq = getBbcodeAttrNumber(attrs, "freq", 0.85, 0.1, 6);
    return {
      tagName,
      variableName: "--rich-text-tornado-radius",
      amount: radius * 0.34,
      duration: Math.max(0.6, 1 / freq),
      phaseStep: 0.06
    };
  }
  const level = getBbcodeAttrNumber(attrs, "level", 3, 1, 12);
  const rate = getBbcodeAttrNumber(attrs, "rate", 18, 1, 40);
  return {
    tagName: "shake",
    variableName: "--rich-text-shake-level",
    amount: level * 0.32,
    duration: Math.max(0.08, 1 / rate),
    phaseStep: 0.025
  };
}

function getRichTextTagPresentation(tagName: string, attrs: BbcodeAttributes, references?: ReferenceResources): RichTextTagPresentation {
  const classNames: string[] = [];
  const style: CSSProperties = {};
  const customStyle = style as CSSProperties & Record<string, string>;
  let title: string | undefined;
  let dataNote: string | undefined;

  switch (tagName) {
    case "b":
      style.fontWeight = 800;
      break;
    case "i":
      style.fontStyle = "italic";
      break;
    case "u":
      classNames.push("rich-text-underline");
      break;
    case "s":
      classNames.push("rich-text-strike");
      break;
    case "code":
      classNames.push("rich-text-code");
      break;
    case "font_size": {
      const size = clampPreviewNumber(attrs.value, 10, 96, 32);
      style.fontSize = `${size}px`;
      break;
    }
    case "font_scale":
      if (isFontScaleGradientAttrs(attrs)) {
        classNames.push("rich-text-font-gradient");
      } else {
        style.fontSize = `${formatDialogueFontScale(getDialogueFontScaleFromAttrs(attrs, 1))}em`;
      }
      break;
    case "color":
      style.color = resolveRichTextPreviewColor(attrs.value, references);
      break;
    case "bgcolor":
    case "fgcolor":
      style.backgroundColor = resolveRichTextPreviewColor(attrs.value, references);
      classNames.push("rich-text-bgcolor");
      break;
    case "outline_size": {
      classNames.push("rich-text-outline");
      const size = clampPreviewNumber(attrs.value, 1, 5, 2);
      customStyle["--rich-text-outline-size"] = `${size}px`;
      break;
    }
    case "outline_color":
      classNames.push("rich-text-outline");
      customStyle["--rich-text-outline-color"] = resolveRichTextPreviewColor(attrs.value, references) || "rgba(0, 0, 0, 0.9)";
      break;
    case "shake": {
      classNames.push("rich-text-motion", "rich-text-shake");
      const config = getRichTextMotionConfig(tagName, attrs);
      customStyle["--rich-text-shake-level"] = `${config.amount}px`;
      style.animationDuration = `${config.duration}s`;
      break;
    }
    case "wave": {
      classNames.push("rich-text-motion", "rich-text-wave");
      const config = getRichTextMotionConfig(tagName, attrs);
      customStyle["--rich-text-wave-amp"] = `${config.amount}px`;
      style.animationDuration = `${config.duration}s`;
      break;
    }
    case "tornado": {
      classNames.push("rich-text-motion", "rich-text-tornado");
      const config = getRichTextMotionConfig(tagName, attrs);
      customStyle["--rich-text-tornado-radius"] = `${config.amount}px`;
      style.animationDuration = `${config.duration}s`;
      break;
    }
    case "pulse": {
      classNames.push("rich-text-motion", "rich-text-pulse");
      const freq = getBbcodeAttrNumber(attrs, "freq", 1, 0.1, 6);
      style.animationDuration = `${Math.max(0.2, 2 / freq)}s`;
      break;
    }
    case "fade":
      break;
    case "rainbow": {
      classNames.push("rich-text-motion", "rich-text-rainbow");
      const speed = Math.abs(getBbcodeAttrNumber(attrs, "speed", 1, -8, 8)) || 1;
      style.animationDuration = `${Math.max(0.2, 1 / speed)}s`;
      break;
    }
    case "grow": {
      break;
    }
    case "blink": {
      classNames.push("rich-text-motion", "rich-text-blink");
      const frequency = getBbcodeAttrNumber(attrs, "freq", 3.4, 0.1, 12);
      const minAlpha = getBbcodeAttrNumber(attrs, "min", 0.12, 0, 1);
      customStyle["--rich-text-blink-min"] = String(minAlpha);
      style.animationDuration = `${Math.max(0.06, 1 / frequency)}s`;
      break;
    }
    case "alpha": {
      const alpha = getBbcodeAttrNumber(attrs, ["value", "amount"], 0.45, 0, 1);
      style.opacity = alpha;
      break;
    }
    case "lie":
      classNames.push("rich-text-lie");
      title = "[lie]";
      break;
    case "speed":
    case "text_speed":
    case "type_speed":
    case "typewriter_speed": {
      const speed = getBbcodeAttrNumber(attrs, "value", 1, 0.01, 10);
      classNames.push("rich-text-speed");
      dataNote = `x${formatDialogueFontScale(speed)}`;
      title = `typewriter speed ${dataNote}`;
      break;
    }
    default:
      break;
  }

  return { classNames, style, title, dataNote };
}

function getBbcodeTagName(rawTag: string) {
  let tag = String(rawTag || "").trim().toLowerCase();
  if (!tag) return "";
  if (tag.startsWith("/")) tag = tag.slice(1).trim();
  const separatorIndexes = [" ", "=", "\t", "\n"].map((character) => tag.indexOf(character)).filter((position) => position >= 0);
  if (separatorIndexes.length > 0) tag = tag.slice(0, Math.min(...separatorIndexes));
  return tag.replace(/[^a-z0-9_]/g, "");
}

function parseBbcodeAttributes(rawTag: string): BbcodeAttributes {
  const attrs: BbcodeAttributes = {};
  const payload = getBbcodeTagPayload(rawTag);
  if (!payload) return attrs;
  if (payload.startsWith("=")) {
    attrs.value = unquoteBbcodeValue(payload.slice(1));
    return attrs;
  }
  for (const token of tokenizeBbcodeAttributes(payload)) {
    const separatorIndex = token.indexOf("=");
    if (separatorIndex >= 0) {
      const key = token.slice(0, separatorIndex).trim().toLowerCase();
      if (key) attrs[key] = unquoteBbcodeValue(token.slice(separatorIndex + 1));
    } else if (token) {
      attrs[token.toLowerCase()] = true;
    }
  }
  return attrs;
}

function getBbcodeTagPayload(rawTag: string) {
  let body = String(rawTag || "").trim();
  if (body.startsWith("/")) body = body.slice(1).trim();
  const tagName = getBbcodeTagName(body);
  return tagName ? body.slice(tagName.length).trim() : "";
}

function tokenizeBbcodeAttributes(text: string) {
  const tokens: string[] = [];
  let current = "";
  let quote = "";
  for (const character of String(text || "")) {
    if (quote) {
      current += character;
      if (character === quote) quote = "";
      continue;
    }
    if (character === "\"" || character === "'") {
      quote = character;
      current += character;
      continue;
    }
    if (/\s/.test(character)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += character;
  }
  if (current) tokens.push(current);
  return tokens;
}

function unquoteBbcodeValue(value: unknown) {
  const clean = String(value ?? "").trim();
  if (clean.length >= 2) {
    const first = clean[0];
    const last = clean[clean.length - 1];
    if ((first === "\"" && last === "\"") || (first === "'" && last === "'")) {
      return clean.slice(1, -1);
    }
  }
  return clean;
}

function closeRichTextPreviewTag(
  stack: Array<{ tagName: string; children: RichTextAstNode[]; node?: Extract<RichTextAstNode, { type: "span" }> }>,
  tagName: string,
  endIndex: number
) {
  for (let index = stack.length - 1; index > 0; index -= 1) {
    if (stack[index].tagName === tagName) {
      const node = stack[index].node;
      if (node?.range) node.range.end = endIndex;
      stack.length = index;
      return;
    }
  }
}

function stripDialoguePreviewPauses(text: string) {
  const raw = String(text || "");
  let out = "";
  let index = 0;
  while (index < raw.length) {
    const character = raw[index];
    if (character === "\\" && index + 1 < raw.length) {
      const next = raw[index + 1];
      if (next === "|" || next === "\\") {
        out += next;
        index += 2;
        continue;
      }
    }
    if (character === "|") {
      index += 1;
      continue;
    }
    out += character;
    index += 1;
  }
  return out;
}

function clampPreviewNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function getBbcodeAttrNumber(attrs: BbcodeAttributes, names: string | string[], fallback: number, min = -Infinity, max = Infinity) {
  const keys = Array.isArray(names) ? names : [names];
  for (const key of keys) {
    if (attrs[key] !== undefined) {
      return clampPreviewNumber(attrs[key], min, max, fallback);
    }
  }
  return fallback;
}

function normalizeDialogueFontScale(value: unknown, fallback = 1) {
  const raw = String(value ?? "").trim().replace(/^x/i, "").replace(/배$/, "");
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(4, Math.max(0.25, parsed));
}

function formatDialogueFontScale(value: number) {
  const rounded = Math.round(Number(value) * 1000) / 1000;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function getDialogueFontScaleFromAttrs(attrs: BbcodeAttributes, fallback = 1) {
  for (const key of ["value", "scale", "multiplier", "ratio", "x"]) {
    if (attrs[key] !== undefined) {
      return normalizeDialogueFontScale(attrs[key], fallback);
    }
  }
  return fallback;
}

function isFontScaleGradientTag(node: RichTextAstNode) {
  return node.type === "span" && node.tagName === "font_scale" && isFontScaleGradientAttrs(node.attrs);
}

function isFontScaleGradientAttrs(attrs: BbcodeAttributes) {
  return firstDefinedBbcodeAttr(attrs, ["from", "from_scale", "start"]) !== undefined
    || firstDefinedBbcodeAttr(attrs, ["to", "to_scale", "end"]) !== undefined;
}

function firstDefinedBbcodeAttr(attrs: BbcodeAttributes, keys: string[]) {
  for (const key of keys) {
    if (attrs[key] !== undefined) return attrs[key];
  }
  return undefined;
}

function countRichTextVisibleCharacters(nodes: RichTextAstNode[]): number {
  return nodes.reduce((total, node) => {
    if (node.type === "text") return total + Array.from(node.text).length;
    if (node.type === "span") return total + countRichTextVisibleCharacters(node.children);
    return total;
  }, 0);
}

function resolveRichTextPreviewColor(value: unknown, references?: ReferenceResources) {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  const characterPrefix = "character:";
  if (raw.toLowerCase().startsWith(characterPrefix)) {
    const characterId = raw.slice(characterPrefix.length).trim();
    const character = references?.characters.find((entry) => entry.id === characterId);
    return character?.nameColor || "#ffffff";
  }
  return raw;
}

function formatEventAttrSummary(tagName: string, attrs: BbcodeAttributes, references?: ReferenceResources) {
  const targetLabel = resolveEventTargetLabel(tagName, attrs, references);
  if (targetLabel) return targetLabel;

  for (const key of ["path", "delay", "volume", "volume_db", "fade", "transition"]) {
    const value = attrs[key];
    if (typeof value === "string" && value.trim()) {
      return compactPreviewNote(value);
    }
  }
  return "";
}

function resolveEventTargetLabel(tagName: string, attrs: BbcodeAttributes, references?: ReferenceResources) {
  const normalizedTag = tagName.toLowerCase();
  const ids = getEventTargetIds(attrs);
  if (ids.length === 0) return "";

  const resourceType = eventTargetResourceType(normalizedTag);
  const labels = ids.map((id) => {
    if (resourceType === "characters") return resolveReferenceLabel(references?.characters, id);
    if (resourceType === "storyAssets") return resolveReferenceLabel(references?.storyAssets, id);
    return shortId(id);
  }).filter(Boolean);
  return compactPreviewNote(labels.join(", "));
}

function eventTargetResourceType(tagName: string) {
  if (["enter", "exit"].includes(tagName)) return "characters";
  if (["sfx", "sound", "se", "bgm", "music", "bgm_stop", "music_stop", "bgm_volume", "music_volume", "bg", "background"].includes(tagName)) return "storyAssets";
  return "";
}

function getEventTargetIds(attrs: BbcodeAttributes) {
  const ids: string[] = [];
  for (const key of ["id", "ids", "asset", "asset_id", "story_asset", "character", "characters", "character_id", "character_ids", "speaker", "speaker_id", "target", "targets"]) {
    const value = attrs[key];
    if (typeof value !== "string" || !value.trim()) continue;
    for (const id of value.split(/[\s,;]+/).map((entry) => entry.trim()).filter(Boolean)) {
      if (!ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}

function resolveReferenceLabel(resources: ResourceSummary[] | undefined, id: string) {
  const summary = resources?.find((entry) => entry.id === id);
  return summary?.title || shortId(id);
}

function compactPreviewNote(value: string) {
  const clean = value.trim();
  return clean.length > 28 ? `${clean.slice(0, 27)}…` : clean;
}

function eventTagLabel(tagName: string) {
  return {
    sfx: "SFX",
    sound: "SFX",
    se: "SFX",
    bgm: "BGM",
    music: "BGM",
    bgm_stop: "BGM stop",
    music_stop: "BGM stop",
    bgm_volume: "BGM vol",
    music_volume: "BGM vol",
    bg: "BG",
    background: "BG",
    bg_clear: "BG clear",
    background_clear: "BG clear",
    bg_remove: "BG clear",
    background_remove: "BG clear",
    auto_next: "AUTO",
    auto_advance: "AUTO",
    advance: "AUTO",
    enter: "ENTER",
    exit: "EXIT"
  }[tagName] || tagName.toUpperCase();
}

function getDialogueVisiblePreviewText(text: unknown) {
  const nodes = parseRichTextPreviewAst(String(text || ""));
  return collectRichTextPlainText(nodes).replace(/\s+/g, " ").trim();
}

function collectRichTextPlainText(nodes: RichTextAstNode[]): string {
  return nodes.map((node) => {
    if (node.type === "text") return node.text;
    if (node.type === "span") return collectRichTextPlainText(node.children);
    return "";
  }).join("");
}

function detectTextTags(text: string) {
  const tags = new Set<string>();
  const patterns: Array<[string, RegExp]> = [
    ["style", /\[(b|i|u|s|code)\b/i],
    ["lie", /\[lie\b/i],
    ["shake", /\[shake\b/i],
    ["wave", /\[wave\b/i],
    ["motion", /\[(tornado|pulse|fade|rainbow|grow|blink)\b/i],
    ["alpha", /\[alpha\b/i],
    ["font", /\[font_scale\b/i],
    ["speed", /\[speed\b/i],
    ["color", /\[color=/i],
    ["color", /\[(bgcolor|fgcolor|outline_size|outline_color)\b/i],
    ["bgm", /\[bgm\b/i],
    ["bgm", /\[(bgm_stop|music_stop|bgm_volume|music_volume)\b/i],
    ["sfx", /\[(sfx|se)\b/i],
    ["bg", /\[(bg|background|bg_clear|background_clear|bg_remove|background_remove)\b/i],
    ["auto", /\[(auto_next|auto_advance|advance)\b/i],
    ["enter", /\[enter\b/i],
    ["exit", /\[exit\b/i]
  ];
  for (const [tag, pattern] of patterns) {
    if (pattern.test(text)) tags.add(tag);
  }
  return [...tags];
}

function tagPreviewLabel(tag: string) {
  return {
    style: "서식",
    lie: "거짓",
    shake: "흔들림",
    wave: "물결",
    motion: "움직임",
    alpha: "반투명",
    font: "크기 변화",
    speed: "속도",
    color: "색상",
    bgm: "BGM",
    sfx: "SFX",
    bg: "배경",
    auto: "자동",
    enter: "등장",
    exit: "퇴장"
  }[tag] || tag;
}

export default App;

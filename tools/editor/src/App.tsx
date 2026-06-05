import type { ChangeEvent, CSSProperties, DragEvent as ReactDragEvent, MutableRefObject, PointerEvent as ReactPointerEvent, ReactNode, SyntheticEvent, WheelEvent as ReactWheelEvent } from "react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
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

type EditorTab = "form" | "nodes" | "json" | "preview";
type MobilePanel = "library" | "workspace" | "inspector";
type EditorLanguage = "ko" | "en";
type EditorThemeMode = "dark" | "light";
type EditorThemeAccent = "green" | "blue" | "rose" | "amber" | "custom";
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
type RichTextAstNode =
  | { type: "text"; text: string }
  | { type: "span"; tagName: string; attrs: BbcodeAttributes; children: RichTextAstNode[] }
  | { type: "event"; tagName: string; attrs: BbcodeAttributes; raw: string };
type RichTextTagPresentation = {
  classNames: string[];
  style: CSSProperties;
  title?: string;
  dataNote?: string;
};
type GodotImportStatus = { ok: boolean; error: string };
type ProjectAssetUploadResult = {
  relativePath?: string;
  resPath: string;
  bytes?: number;
  importStatus?: GodotImportStatus;
};
type ProjectAssetUploader = (relativePath: string, file: File) => Promise<ProjectAssetUploadResult>;
type ChapterArtSnapshot = {
  chapterId: string;
  payload: ResourceRecord;
  serialized: string;
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
const portraitEditorCanvasWidth = 300;
const portraitEditorCanvasHeight = 380;
const gameFaceAnchorX = 0.5;
const gameFaceAnchorY = 0.34;
const gamePortraitZoomPercent = 300;
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
const portraitZoomBystanderDefault = 250;
const portraitFaceAnchor = { x: 0.5, y: 0.34 };
const portraitZoomOutBodyAnchor = { x: 0.5, y: 0.3709 };
const portraitZoomOutBodyBlendStart = 300;
const portraitZoomOutBodyBlendEnd = 250;
const portraitPositionPresets: Record<string, PointerPoint> = {
  left: { x: -0.22, y: 0 },
  center: { x: 0, y: 0 },
  right: { x: 0.22, y: 0 }
};
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
const godotPreviewGodotPathStorageKey = "blind-madeleine-godot-preview-godot-path";
const editorLanguageStorageKey = "blind-madeleine-editor-language";
const editorThemeModeStorageKey = "blind-madeleine-editor-theme-mode";
const editorThemeAccentStorageKey = "blind-madeleine-editor-theme-accent";
const editorCustomAccentStorageKey = "blind-madeleine-editor-custom-accent";
const godotPreviewDefaultEndpoint = "http://127.0.0.1:51234";
const defaultCustomAccent = "#9bdcb9";

type EditorCopy = {
  brandTitle: string;
  brandSubtitle: string;
  toolbar: Record<"refresh" | "create" | "delete" | "save", string>;
  settings: Record<
    | "label"
    | "language"
    | "korean"
    | "english"
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
  panels: Record<"resourceNav" | "collection" | "library" | "workspace" | "inspector" | "project" | "validation" | "historyCoverage", string>;
  tabs: Record<EditorTab, string>;
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
    | "profileFaceCenter"
    | "centerX"
    | "centerY"
    | "profileZoom"
    | "profileCenterX"
    | "profileCenterY"
    | "profileOffsetX"
    | "profileOffsetY",
    string
  >;
  preview: Record<"select" | "title" | "summary" | "eventTags" | "parallaxLayers", string>;
};

const editorText: Record<EditorLanguage, EditorCopy> = {
  ko: {
    brandTitle: "Blind Madeleine 에디터",
    brandSubtitle: "로컬 데이터 서버",
    toolbar: {
      refresh: "새로고침",
      create: "새 항목",
      delete: "삭제",
      save: "저장"
    },
    settings: {
      label: "환경 설정",
      language: "언어",
      korean: "한국어",
      english: "English",
      themeMode: "화면 모드",
      dark: "다크",
      light: "라이트",
      accent: "테마 색상",
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
      validation: "검증",
      historyCoverage: "레거시 대응 범위"
    },
    tabs: {
      form: "폼",
      nodes: "노드",
      json: "JSON",
      preview: "미리보기"
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
      profileFaceCenter: "프로필 얼굴 중심",
      centerX: "중심 X",
      centerY: "중심 Y",
      profileZoom: "프로필 확대",
      profileCenterX: "프로필 중심 X",
      profileCenterY: "프로필 중심 Y",
      profileOffsetX: "프로필 오프셋 X",
      profileOffsetY: "프로필 오프셋 Y"
    },
    preview: {
      select: "미리볼 항목을 선택하세요.",
      title: "제목",
      summary: "요약",
      eventTags: "이벤트 태그",
      parallaxLayers: "패럴랙스 레이어"
    }
  },
  en: {
    brandTitle: "Blind Madeleine Editor",
    brandSubtitle: "Local data server",
    toolbar: {
      refresh: "Refresh",
      create: "New",
      delete: "Delete",
      save: "Save"
    },
    settings: {
      label: "Preferences",
      language: "Language",
      korean: "한국어",
      english: "English",
      themeMode: "Mode",
      dark: "Dark",
      light: "Light",
      accent: "Theme color",
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
      validation: "Validation",
      historyCoverage: "Legacy Coverage"
    },
    tabs: {
      form: "Form",
      nodes: "Nodes",
      json: "JSON",
      preview: "Preview"
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
      profileFaceCenter: "Profile face center",
      centerX: "Center X",
      centerY: "Center Y",
      profileZoom: "Profile zoom",
      profileCenterX: "Profile center X",
      profileCenterY: "Profile center Y",
      profileOffsetX: "Profile offset X",
      profileOffsetY: "Profile offset Y"
    },
    preview: {
      select: "Select an item to preview.",
      title: "Title",
      summary: "Summary",
      eventTags: "Event tags",
      parallaxLayers: "Parallax layers"
    }
  }
};

const LanguageContext = createContext<EditorLanguage>("ko");

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
  "auto_next", "auto_advance", "advance", "lb", "rb"
]);
const dialogueEventTagNames = new Set([
  "sfx", "sound", "se", "bgm", "music", "bgm_stop", "music_stop", "bgm_volume", "music_volume",
  "bg", "background", "bg_clear", "background_clear", "bg_remove", "background_remove",
  "auto_next", "auto_advance", "advance"
]);

const tagActions = [
  { label: "굵게", hint: "b", open: "[b]", close: "[/b]" },
  { label: "기울임", hint: "i", open: "[i]", close: "[/i]" },
  { label: "밑줄", hint: "u", open: "[u]", close: "[/u]" },
  { label: "취소선", hint: "s", open: "[s]", close: "[/s]" },
  { label: "색상", hint: "color", open: "[color=#7ee7d8]", close: "[/color]" },
  { label: "배경 강조", hint: "bgcolor", open: "[bgcolor=#2f2438]", close: "[/bgcolor]" },
  { label: "윤곽선", hint: "outline", open: "[outline_size=2][outline_color=#000000]", close: "[/outline_color][/outline_size]" },
  { label: "거짓", hint: "lie", open: "[lie]", close: "[/lie]" },
  { label: "흔들림", hint: "shake", open: "[shake rate=22.0 level=6 connected=1]", close: "[/shake]" },
  { label: "물결", hint: "wave", open: "[wave amp=28.0 freq=5.0 connected=1]", close: "[/wave]" },
  { label: "회오리", hint: "tornado", open: "[tornado radius=10.0 freq=1.0 connected=1]", close: "[/tornado]" },
  { label: "맥박", hint: "pulse", open: "[pulse freq=1.2 color=#ffffff40 ease=-2.0]", close: "[/pulse]" },
  { label: "희미해짐", hint: "fade", open: "[fade]", close: "[/fade]" },
  { label: "무지개", hint: "rainbow", open: "[rainbow freq=1.0 sat=0.75 val=0.95 speed=0.7]", close: "[/rainbow]" },
  { label: "점점커짐", hint: "grow", open: "[grow duration=1.05 from=0.78 to=1.34]", close: "[/grow]" },
  { label: "깜빡임", hint: "blink", open: "[blink freq=3.4 min=0.14]", close: "[/blink]" },
  { label: "반투명", hint: "alpha", open: "[alpha value=0.45]", close: "[/alpha]" },
  { label: "느리게", hint: "speed", open: "[speed=0.6]", close: "[/speed]" },
  { label: "빠르게", hint: "speed", open: "[speed=1.8]", close: "[/speed]" },
  { label: "글자 배율", hint: "scale", open: "[font_scale=2]", close: "[/font_scale]" },
  { label: "글자 작아짐", hint: "1->0.3", open: "[font_scale from=1 to=0.3]", close: "[/font_scale]" },
  { label: "글자 커짐", hint: "0.3->1", open: "[font_scale from=0.3 to=1]", close: "[/font_scale]" },
  { label: "BGM", hint: "bgm", insert: "[bgm id=\"\" fade=0.5]" },
  { label: "BGM 볼륨", hint: "bgm_volume", insert: "[bgm_volume volume=0.5 fade=0.5]" },
  { label: "BGM 종료", hint: "bgm_stop", insert: "[bgm_stop fade=0.5]" },
  { label: "SFX", hint: "sfx", insert: "[sfx id=\"\"]" },
  { label: "배경", hint: "bg", insert: "[bg id=\"\" transition=fade duration=0.5 opacity=1 blur=3 brightness=0.75 saturate=0.8 dim=0.15]" },
  { label: "배경 제거", hint: "bg_clear", insert: "[bg_clear transition=fade duration=0.5]" },
  { label: "자동 넘김", hint: "auto", insert: "[auto_next delay=0.35]" }
];

const historyMilestones = [
  "대사 에디터: speaker, choices, portrait, stage_cast, statement_nodes, acquire_info, popups",
  "캐릭터 에디터: display_name, name_color, portraits, profile crop, spectrum_offset",
  "아이템/챕터 에디터: chapters scope, graph layout, chapter BGM, parallax layers",
  "스토리 에셋: bgm, sfx, background, volume, loop, fixed",
  "연출 태그: BBCode effects, bgm/sfx/bg events, auto_next, cutscene"
];

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
  const [tab, setTab] = useState<EditorTab>("form");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("workspace");
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);
  const [bridgeStatus, setBridgeStatus] = useState("미확인");
  const [bridgeEndpoint, setBridgeEndpoint] = useState(readGodotPreviewEndpoint);
  const [godotPath, setGodotPath] = useState(readGodotPathSetting);
  const [toast, setToast] = useState("");
  const nodeTextRef = useRef<HTMLTextAreaElement | null>(null);
  const jsonTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingTaskRef = useRef(false);
  const [pendingTaskLabel, setPendingTaskLabel] = useState("");
  const ui = editorText[language];

  const issues = useMemo(
    () => collectValidationIssues(type, draft, selectedId, summary).concat(jsonError
      ? [{ severity: "error", message: `JSON 오류: ${formatJsonEditorError(jsonError)}` } satisfies ValidationIssue]
      : []),
    [draft, jsonError, selectedId, summary, type]
  );

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return resources;
    return resources.filter((resource) => [resource.id, resource.title, resource.subtitle]
      .some((value) => String(value || "").toLowerCase().includes(query)));
  }, [resources, search]);

  const referenceResources = useMemo(() => ({
    chapters: summary?.resources.chapters.resources || [],
    dialogues: summary?.resources.dialogues.resources || [],
    characters: summary?.resources.characters.resources || [],
    items: summary?.resources.items.resources || [],
    storyAssets: summary?.resources.story_assets.resources || []
  }), [summary]);
  const isAppBusy = Boolean(pendingTaskLabel);

  useEffect(() => {
    void boot();
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
    saveLocalSetting(godotPreviewEndpointStorageKey, bridgeEndpoint);
  }, [bridgeEndpoint]);

  useEffect(() => {
    saveLocalSetting(godotPreviewGodotPathStorageKey, godotPath);
  }, [godotPath]);

  async function boot() {
    try {
      await refreshSummary();
      await refreshList("dialogues", true);
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
    if (pendingTaskRef.current || nextType === type || !confirmDiscard()) return;
    setType(nextType);
    setSelectedId("");
    setDraft(null);
    setJsonText("");
    setSavedJsonText("");
    setJsonError(null);
    setSearch("");
    setTab(nextType === "dialogues" ? "nodes" : "form");
    setMobilePanel("library");
    await refreshList(nextType, true);
  }

  async function selectResource(nextType: ResourceType, id: string, force = false) {
    if (!force && (pendingTaskRef.current || id === selectedId || !confirmDiscard())) return;
    const body = await loadResource(nextType, id);
    const formatted = formatJson(body.data);
    setSelectedId(id);
    setDraft(body.data);
    setJsonText(formatted);
    setSavedJsonText(formatted);
    setJsonError(null);
    setDirty(false);
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
        await selectResource(type, body.summary.id, true);
        setMobilePanel("workspace");
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
        await refreshList(type, true);
        notify("삭제 완료");
      });
    } catch (error) {
      notify(`삭제 실패: ${(error as Error).message}`);
    }
  }

  async function saveCurrent() {
    if (pendingTaskRef.current || !selectedId || !draft || jsonError) return;
    await runPendingTask("저장 중", async () => {
      try {
        const thumbnailResult = type === "chapters" ? await uploadChapterThumbnailForDraft(draft, uploadFileAndImport) : null;
        const nextDraft = prepareDraftForSave(type, thumbnailResult?.draft || draft);
        const body = await saveResource(type, selectedId, nextDraft);
        const formatted = formatJson(body.data);
        setSelectedId(body.summary.id);
        setDraft(body.data);
        setJsonText(formatted);
        setSavedJsonText(formatted);
        setDirty(false);
        await refreshSummary();
        await refreshList(type, false);
        notify(thumbnailResult && !thumbnailResult.skipped
          ? `저장 완료 · 썸네일 ${thumbnailResult.resPath} · ${formatGodotImportStatus(thumbnailResult.importStatus)}`
          : "저장 완료");
      } catch (error) {
        notify(`저장 실패: ${(error as Error).message}`);
      }
    });
  }

  function confirmDiscard() {
    if (!dirty) return true;
    return window.confirm("저장하지 않은 변경이 있습니다. 계속할까요?");
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

  function onJsonChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const text = event.target.value;
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
    if (!jsonTextareaRef.current || !jsonError) return;
    const position = jsonError.position ?? (
      jsonError.line && jsonError.column
        ? jsonPositionFromLineColumn(jsonText, jsonError.line, jsonError.column)
        : undefined
    );
    if (position === undefined) return;
    jsonTextareaRef.current.focus();
    jsonTextareaRef.current.setSelectionRange(position, position);
  }

  function addDialogueNode(mode: "dialogue" | "cutscene") {
    if (!draft) return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    const nextNode = mode === "cutscene"
      ? { mode: "cutscene", cutscene: { fade_in: 0, hold: 1, fade_out: 1 } }
      : { speaker: "narrator", text: "" };
    applyDraft({ ...draft, nodes: [...nodes, nextNode] });
    setSelectedNodeIndex(nodes.length);
    setTab("nodes");
  }

  function addStatementNode() {
    if (!draft) return;
    const statementNodes = asArray<ResourceRecord>(draft.statement_nodes);
    const nextNode = {
      speaker: "narrator",
      text: "[lie]거짓[/lie]",
      statement_lies: [{ phrase: "거짓", reactions: [{ label: "제시", nodes: [] }] }]
    };
    applyDraft({ ...draft, statement_nodes: [...statementNodes, nextNode] });
    setTab("nodes");
  }

  function updateStatementNode(index: number, nextNode: ResourceRecord) {
    if (!draft) return;
    const statementNodes = asArray<ResourceRecord>(draft.statement_nodes);
    applyDraft({
      ...draft,
      statement_nodes: statementNodes.map((node, nodeIndex) => nodeIndex === index ? nextNode : node)
    });
  }

  function replaceStatementNodes(nextNodes: ResourceRecord[]) {
    if (!draft) return;
    applyDraft({ ...draft, statement_nodes: nextNodes });
  }

  function removeStatementNode(index: number) {
    if (!draft) return;
    const statementNodes = asArray<ResourceRecord>(draft.statement_nodes);
    applyDraft({ ...draft, statement_nodes: statementNodes.filter((_, nodeIndex) => nodeIndex !== index) });
  }

  function updateDialogueNode(index: number, nextNode: ResourceRecord) {
    if (!draft) return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    const nextNodes = nodes.map((node, nodeIndex) => nodeIndex === index ? nextNode : node);
    applyDraft({ ...draft, nodes: nextNodes });
  }

  function removeDialogueNode(index: number) {
    if (!draft) return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    applyDraft({ ...draft, nodes: nodes.filter((_, nodeIndex) => nodeIndex !== index) });
    setSelectedNodeIndex(Math.max(0, index - 1));
  }

  function insertTag(action: typeof tagActions[number]) {
    if (!draft) return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    const node = nodes[selectedNodeIndex];
    if (!node) return;

    const currentText = String(node.text || "");
    const textarea = nodeTextRef.current;
    const start = textarea?.selectionStart ?? currentText.length;
    const end = textarea?.selectionEnd ?? currentText.length;
    const selected = currentText.slice(start, end);
    const inserted = action.insert || `${action.open}${selected || "text"}${action.close}`;
    const nextText = `${currentText.slice(0, start)}${inserted}${currentText.slice(end)}`;
    updateDialogueNode(selectedNodeIndex, { ...node, text: nextText });
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
        throw new Error(body.error || "bridge import unavailable");
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

  async function launchGodotPreview() {
    if (type !== "dialogues" || !draft || !selectedId) return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    const node = nodes[selectedNodeIndex];
    const response = await fetch(godotPreviewUrl(bridgeEndpoint, "preview"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        dialogue_id: draft.id || selectedId,
        dialogue_file: `${draft.id || selectedId}.json`,
        dialogue_json: JSON.stringify(draft, null, 2),
        node_id: node?.id || ""
      })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok) {
      throw new Error(body.error || "Godot preview bridge 호출에 실패했습니다.");
    }
    notify(`Godot preview 실행: PID ${body.pid}`);
  }

  async function configureGodotBridge() {
    try {
      const response = await fetch(godotPreviewUrl(bridgeEndpoint, "config"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ godot_path: godotPath.trim() })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "bridge config unavailable");
      }
      const godot = body.godot ? String(body.godot).split(/[\\/]/).pop() : "Godot";
      setBridgeStatus(`설정됨 · ${godot}`);
      notify("Godot preview bridge 설정 저장됨");
    } catch (error) {
      setBridgeStatus(`오류 · ${(error as Error).message}`);
      notify("Godot preview bridge 설정 실패");
    }
  }

  async function checkGodotBridge() {
    try {
      const response = await fetch(godotPreviewUrl(bridgeEndpoint, "health"));
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "bridge unavailable");
      }
      const godot = body.godot ? String(body.godot).split(/[\\/]/).pop() : "Godot";
      setBridgeStatus(`연결됨 · ${godot}`);
      notify("Godot preview bridge 연결됨");
    } catch (error) {
      setBridgeStatus(`오류 · ${(error as Error).message}`);
      notify("Godot preview bridge 연결 실패");
    }
  }

  const canSave = Boolean(selectedId && draft && dirty && !jsonError && !isAppBusy);
  const currentTitle = titleFor(type, draft, selectedId);
  const currentDescription = describeResourceForLanguage(type, draft, language);
  const issueCount = issues.filter((issue) => issue.severity !== "info").length;
  const dirtyBadgeClass = isAppBusy ? "pending" : jsonError ? "error" : dirty ? "dirty" : "clean";
  const dirtyBadgeText = isAppBusy ? pendingTaskLabel : jsonError ? ui.status.jsonError : dirty ? ui.status.dirty : ui.status.clean;

  return (
    <LanguageContext.Provider value={language}>
      <div className="app-shell">
        <header className="top-app-bar">
          <div className="brand-mark">BM</div>
          <div className="brand-copy">
            <strong>{ui.brandTitle}</strong>
            <span>{ui.brandSubtitle}</span>
          </div>
          <div className="toolbar-actions">
            <IconButton icon="Refresh" label={ui.toolbar.refresh} onClick={refreshAll} disabled={isAppBusy} />
            <IconButton icon="Add" label={ui.toolbar.create} onClick={createCurrent} disabled={isAppBusy} />
            <IconButton icon="Delete" label={ui.toolbar.delete} onClick={deleteCurrent} disabled={isAppBusy || !selectedId} danger />
            <IconButton icon="Save" label={ui.toolbar.save} onClick={saveCurrent} disabled={!canSave} filled />
          </div>
          <details className="settings-menu">
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
                  <select value={themeAccent} onChange={(event) => setThemeAccent(normalizeEditorThemeAccent(event.target.value))}>
                    <option value="green">{ui.settings.green}</option>
                    <option value="blue">{ui.settings.blue}</option>
                    <option value="rose">{ui.settings.rose}</option>
                    <option value="amber">{ui.settings.amber}</option>
                    <option value="custom">{ui.settings.custom}</option>
                  </select>
                </label>
                {themeAccent === "custom" && (
                  <label className="color-preference" title={ui.settings.customColor}>
                    <span>{ui.settings.customColor}</span>
                    <input value={sanitizeHexColor(customAccent, defaultCustomAccent)} onChange={(event) => setCustomAccent(event.target.value)} type="color" />
                  </label>
                )}
              </div>
            </div>
          </details>
        </header>

      <div className="mobile-panel-switch" role="tablist" aria-label="모바일 패널">
        <button className={mobilePanel === "library" ? "active" : ""} type="button" onClick={() => setMobilePanel("library")}>
          {ui.mobile.library}
        </button>
        <button className={mobilePanel === "workspace" ? "active" : ""} type="button" onClick={() => setMobilePanel("workspace")}>
          {ui.mobile.workspace}
        </button>
        <button className={mobilePanel === "inspector" ? "active" : ""} type="button" onClick={() => setMobilePanel("inspector")}>
          {ui.mobile.inspector} {issueCount > 0 ? issueCount : ""}
        </button>
      </div>

      <main className={`editor-grid mobile-${mobilePanel}`}>
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

        <section className="collection-panel" aria-label={ui.panels.collection}>
          <div className="panel-title">
            <p>{ui.panels.library}</p>
            <h1>{ui.resources[type]}</h1>
          </div>
          <label className="search-field">
            <Icon name="Search" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={ui.common.search} type="search" />
          </label>
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

          <div className="tab-bar" role="tablist">
            {(["form", "nodes", "json", "preview"] as EditorTab[]).map((entry) => (
              <button className={tab === entry ? "active" : ""} key={entry} type="button" onClick={() => setTab(entry)}>
                {tabLabel(entry, ui)}
              </button>
            ))}
          </div>

          <div className={`workspace-body ${isAppBusy ? "busy" : ""}`} aria-busy={isAppBusy}>
            {tab === "form" && (
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
            {tab === "nodes" && (
              <DialogueNodesPanel
                draft={draft}
                references={referenceResources}
                selectedNodeIndex={selectedNodeIndex}
                nodeTextRef={nodeTextRef}
                setSelectedNodeIndex={setSelectedNodeIndex}
                addDialogueNode={addDialogueNode}
                addStatementNode={addStatementNode}
                updateDialogueNode={updateDialogueNode}
                removeDialogueNode={removeDialogueNode}
                updateStatementNode={updateStatementNode}
                replaceStatementNodes={replaceStatementNodes}
                removeStatementNode={removeStatementNode}
                insertTag={insertTag}
                launchGodotPreview={launchGodotPreview}
                checkGodotBridge={checkGodotBridge}
                configureGodotBridge={configureGodotBridge}
                bridgeStatus={bridgeStatus}
                bridgeEndpoint={bridgeEndpoint}
                godotPath={godotPath}
                setBridgeEndpoint={setBridgeEndpoint}
                setGodotPath={setGodotPath}
              />
            )}
            {tab === "json" && (
              <label className="json-editor">
                <span>
                  JSON
                  <button className="inline-text-action" type="button" onClick={formatJsonText}>{ui.common.format}</button>
                </span>
                {jsonError && <JsonErrorPanel error={jsonError} onJump={jumpToJsonError} />}
                <textarea
                  aria-invalid={Boolean(jsonError)}
                  ref={jsonTextareaRef}
                  value={jsonText}
                  onChange={onJsonChange}
                  spellCheck={false}
                  placeholder="목록에서 항목을 선택하세요."
                />
              </label>
            )}
            {tab === "preview" && (
              <PreviewPanel draft={draft} type={type} issues={issues} />
            )}
          </div>
        </section>

        <aside className="inspector-panel" aria-label={ui.panels.inspector}>
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
          <section>
            <p className="section-label">{ui.panels.historyCoverage}</p>
            <div className="coverage-list">
              {historyMilestones.map((milestone) => <span key={milestone}>{milestone}</span>)}
            </div>
          </section>
        </aside>
      </main>

      <div className={`toast ${toast ? "visible" : ""}`}>{toast}</div>
      <div className="mobile-action-bar">
        <button type="button" onClick={() => setMobilePanel("library")}><Icon name="FolderOpen" />{ui.mobile.library}</button>
        <button type="button" onClick={() => setMobilePanel("inspector")}><Icon name={issueCount > 0 ? "Warning" : "CheckCircle"} />{ui.mobile.inspector}</button>
        <button type="button" onClick={createCurrent} disabled={isAppBusy}><Icon name="Add" />{ui.toolbar.create}</button>
        <button type="button" onClick={saveCurrent} disabled={!canSave}><Icon name="Save" />{ui.toolbar.save}</button>
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
    return (
      <div className="form-grid">
        <TextField label={ui.form.id} value={draft.id || ""} onChange={(value) => updateField("id", value)} readOnly />
        <TextField label={ui.form.label} value={draft.label} onChange={(value) => updateField("label", value)} />
        <TextField label={ui.form.description} value={draft.description} onChange={(value) => updateField("description", value)} multiline />
        <CheckboxList label={ui.form.chapters} values={getResourceChapterScopeIds(draft)} options={references.chapters} onToggle={(id) => replaceDraft(toggleResourceChapterScope(draft, id))} />
        <SelectField label={ui.form.startNode} value={draft.start || ""} options={buildDialogueStartOptions(draft, references.characters)} onChange={(value) => updateField("start", value)} />
        <SelectLiteralField label={ui.form.presentationMode} value={normalizeDialoguePresentationMode(metadata.presentation_mode)} options={["normal", "statement"]} onChange={(value) => replaceDraft(withDialoguePresentationMode(draft, value))} />
        <SelectField label={ui.form.nextDialogue} value={metadata.next_dialogue || ""} options={references.dialogues.filter((dialogue) => dialogue.id !== String(draft.id || ""))} onChange={(value) => replaceDraft(withDialogueMetadataEntry(draft, "next_dialogue", value))} />
        {(normalizeDialoguePresentationMode(metadata.presentation_mode) === "statement" || isStatementNotebookScopeConfigured(metadata)) && (
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
        <TextField label={ui.form.nameColor} value={draft.name_color} onChange={(value) => updateField("name_color", value)} type="color-text" />
        <TextField label={ui.form.description} value={draft.description} onChange={(value) => updateField("description", value)} multiline />
        <TextField label={ui.form.voiceProfile} value={draft.metadata?.voice_profile || ""} onChange={(value) => updateMetadataField("voice_profile", value)} />
        <PortraitEditor disabled={disabled} draft={draft} updateField={updateField} uploadFile={uploadFile} />
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
        <ChapterGraphEditor
          disabled={disabled}
          draft={draft}
          dialogues={references.dialogues}
          notify={notify}
          replaceDraft={replaceDraft}
        />
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

  function addPortrait() {
    const key = portraits.default ? `portrait_${entries.length + 1}` : "default";
    setPortraits({
      ...portraits,
      [key]: { path: "", center: [0.5, 0.5], profile: { center: [0.5, 0.5], zoom: 1 } }
    });
  }

  function renamePortrait(oldKey: string, nextKey: string) {
    const clean = safeSegment(nextKey || oldKey, "default");
    const next: Record<string, ResourceRecord | string> = {};
    for (const [key, value] of entries) {
      next[key === oldKey ? clean : key] = value;
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
    <div className="wide structured-editor">
      <div className="structured-header">
        <span>{ui.form.portraits}</span>
        <button disabled={disabled} type="button" onClick={addPortrait}><Icon name="Add" />{ui.form.addPortrait}</button>
      </div>
      {entries.length === 0 && <p className="empty-state">{ui.form.noPortraits}</p>}
      {entries.map(([key, portrait]) => {
        const portraitRecord = portraitRecordForEditor(portrait);
        const center = asArray<number>(portraitRecord.center);
        const profile = portraitRecord.profile && typeof portraitRecord.profile === "object" ? portraitRecord.profile as ResourceRecord : {};
        const profileFaceCenter = getProfileFaceCenter(profile, center);
        const profileOffset = getProfileOffset(profile);
        return (
          <article className="structured-row" key={key}>
            <TextField label={ui.form.key} value={key} onChange={(value) => renamePortrait(key, value)} />
            <TextField label={ui.form.path} value={portraitRecord.path || ""} onChange={(value) => updatePortrait(key, { path: value })} />
            <UploadField
              disabled={disabled}
              label={ui.form.uploadPortrait}
              accept="image/png,image/jpeg,image/webp,image/gif"
              onUpload={async (file) => {
                const path = await uploadFile(`assets/characters/${safeSegment(draft.id || "character")}/${safeSegment(key)}.${fileExtension(file)}`, file);
                updatePortrait(key, { path });
                return path;
              }}
            />
            <ImageCoordinateEditor
              label={ui.form.center}
              imagePath={portraitRecord.path}
              x={center[0] ?? 0.5}
              y={center[1] ?? 0.5}
              onChange={(x, y) => updatePortrait(key, { center: [x, y] })}
            />
            <ImageCoordinateEditor
              label={ui.form.profileFaceCenter}
              imagePath={portraitRecord.path}
              x={profileFaceCenter.x}
              y={profileFaceCenter.y}
              onChange={(x, y) => updatePortrait(key, { profile: { ...profile, center: [x, y] } })}
            />
            <ProfileCropEditor
              faceCenter={profileFaceCenter}
              imagePath={portraitRecord.path}
              profile={profile}
              onChangeProfile={(nextProfile) => updatePortrait(key, { profile: nextProfile })}
            />
            <NumberField label={ui.form.centerX} value={center[0] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => updatePortrait(key, { center: [value, center[1] ?? 0.5] })} />
            <NumberField label={ui.form.centerY} value={center[1] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => updatePortrait(key, { center: [center[0] ?? 0.5, value] })} />
            <NumberField label={ui.form.profileZoom} value={getProfileZoom(profile.zoom)} min={profileZoomMin} max={profileZoomMax} step={profileZoomStep} resetValue={profileZoomDefault} onChange={(value) => updatePortrait(key, { profile: withProfileZoom(profile, value) })} />
            <NumberField label={ui.form.profileCenterX} value={profileFaceCenter.x} min={0} max={1} step={0.01} resetValue={center[0] ?? 0.5} onChange={(value) => updatePortrait(key, { profile: { ...profile, center: [value, profileFaceCenter.y] } })} />
            <NumberField label={ui.form.profileCenterY} value={profileFaceCenter.y} min={0} max={1} step={0.01} resetValue={center[1] ?? 0.5} onChange={(value) => updatePortrait(key, { profile: { ...profile, center: [profileFaceCenter.x, value] } })} />
            <NumberField label={ui.form.profileOffsetX} value={profileOffset.x} min={-1} max={1} step={0.01} resetValue={0} onChange={(value) => updatePortrait(key, { profile: withProfileOffset(profile, { x: value, y: profileOffset.y }) })} />
            <NumberField label={ui.form.profileOffsetY} value={profileOffset.y} min={-1} max={1} step={0.01} resetValue={0} onChange={(value) => updatePortrait(key, { profile: withProfileOffset(profile, { x: profileOffset.x, y: value }) })} />
            <button className="danger-action" disabled={disabled} type="button" onClick={() => removePortrait(key)}><Icon name="Delete" />{ui.common.delete}</button>
          </article>
        );
      })}
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
};

function ChapterGraphEditor({
  disabled,
  draft,
  dialogues,
  notify,
  replaceDraft
}: {
  disabled: boolean;
  draft: ResourceRecord;
  dialogues: ResourceSummary[];
  notify: (message: string) => void;
  replaceDraft: (nextDraft: ResourceRecord) => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<ChapterGraphDrag | null>(null);
  const placedIds = useMemo(() => getChapterDialogueIds(draft), [draft.dialogues, draft.dialogue_ids]);
  const positionMap = getChapterGraphPositionMap(draft);
  const dialogueSummaryMap = useMemo(() => new Map(dialogues.map((dialogue) => [dialogue.id, dialogue])), [dialogues]);
  const unplacedDialogues = useMemo(() => dialogues.filter((dialogue) => !placedIds.includes(dialogue.id)), [dialogues, placedIds]);
  const [dialogueData, setDialogueData] = useState<Record<string, ResourceRecord>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
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
      originalY: position.y
    };
    setSelectedNodeId(id);
    setSelectedEdgeFromId("");
    event.preventDefault();
  }

  function moveNodeDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setNodePosition(drag.id, drag.originalX + (event.clientX - drag.startX) / graphZoom, drag.originalY + (event.clientY - drag.startY) / graphZoom);
    event.preventDefault();
  }

  function updateConnectionPointer(event: ReactPointerEvent<HTMLElement>) {
    if (!edgeSourceId) return;
    const point = graphPointFromPointer(event);
    if (point) setConnectionPointer(point);
  }

  function stopNodeDrag(event: ReactPointerEvent<HTMLElement>) {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current = null;
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

  const selectedEdgeSourceIndex = selectedEdgeFromId ? placedIds.indexOf(selectedEdgeFromId) : -1;
  const selectedEdgeTargetIndex = selectedEdge ? placedIds.indexOf(selectedEdge) : -1;
  const selectedEdgeMenuPoint = selectedEdgeSourceIndex >= 0 && selectedEdgeTargetIndex >= 0
    ? chapterGraphEdgeMenuPoint(
      nodePosition(selectedEdgeFromId, selectedEdgeSourceIndex),
      nodePosition(selectedEdge, selectedEdgeTargetIndex)
    )
    : null;

  return (
    <section className="wide structured-editor chapter-graph-editor">
      <div className="structured-header">
        <span>Chapter Graph</span>
        <div className="chapter-art-actions">
          <button disabled={disabled || placedIds.length === 0} type="button" onClick={autoArrangeMissingPositions}><Icon name="AutoGraph" />자동 배치</button>
          <button disabled={disabled || !edgeSourceId} type="button" onClick={() => {
            setEdgeSourceId("");
            setConnectionPointer(null);
          }}><Icon name="Close" />연결 취소</button>
        </div>
      </div>
      <div className="chapter-graph-meta">
        <code>{placedIds.length} dialogues</code>
        {loading && <span>loading dialogue metadata</span>}
        {busy && <span>saving edge</span>}
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
            {placedIds.length === 0 && <p className="chapter-graph-empty">챕터에 포함된 대화가 없습니다.</p>}
            {placedIds.map((id, index) => {
              const position = nodePosition(id, index);
              const summary = dialogueSummaryMap.get(id);
              const data = dialogueData[id];
              const nextId = getChapterGraphNext(data);
              const isStart = id === getChapterStartDialogueId(draft);
              const isSource = id === edgeSourceId;
              const isTargetCandidate = Boolean(edgeSourceId && edgeSourceId !== id);
              return (
                <article
                  className={`chapter-graph-node ${selectedNodeId === id ? "selected" : ""} ${isSource ? "edge-source" : ""} ${isTargetCandidate ? "target-candidate" : ""}`}
                  key={id}
                  onClick={() => {
                    if (isTargetCandidate) connectToTarget(id);
                    else {
                      setSelectedNodeId(id);
                      setSelectedEdgeFromId("");
                    }
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
                  <p>{summary?.subtitle || getDialogueFirstTextPreview(data) || "metadata loading"}</p>
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
      {selectedEdgeFromId && selectedEdge && (
        <div className="chapter-graph-edge-panel">
          <strong>{selectedEdgeFromId} {"->"} {selectedEdge}</strong>
          <ToggleField label="Blackout edge" checked={getChapterGraphBlackout(dialogueData[selectedEdgeFromId])} onChange={(checked) => void saveDialogueGraphMetadata(selectedEdgeFromId, { next_dialogue_blackout: checked })} />
          <NumberField label="Fade duration" value={getChapterGraphBlackoutFade(dialogueData[selectedEdgeFromId])} min={0} step={0.05} resetValue={0.35} onChange={(value) => void saveDialogueGraphMetadata(selectedEdgeFromId, { next_dialogue_blackout_fade_duration: value })} />
          <NumberField label="Hold duration" value={getChapterGraphBlackoutHold(dialogueData[selectedEdgeFromId])} min={0} step={0.05} resetValue={0.3} onChange={(value) => void saveDialogueGraphMetadata(selectedEdgeFromId, { next_dialogue_blackout_hold_duration: value })} />
          <button className="danger-action" disabled={disabled || busy} type="button" onClick={() => void saveDialogueGraphMetadata(selectedEdgeFromId, { next_dialogue: "" })}><Icon name="Delete" />연결 해제</button>
        </div>
      )}
      {selectedNodeId && (
        <div className="chapter-graph-node-panel">
          <strong>{selectedNodeId}</strong>
          <span>Incoming {incomingIds.length}</span>
          <div className="incoming-list">
            {incomingIds.length === 0 ? (
              <span className="hint">들어오는 연결 없음</span>
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
      )}
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
  const layerListRef = useRef<HTMLDivElement | null>(null);
  const [snapshot, setSnapshot] = useState<ChapterArtSnapshot | null>(() => createChapterArtSnapshot(draft));
  const [thumbnailBusy, setThumbnailBusy] = useState(false);
  const [artStatus, setArtStatus] = useState("");
  const safeSelectedLayerIndex = Math.min(Math.max(selectedLayerIndex, 0), Math.max(layers.length - 1, 0));
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
    const nextIndex = clampListIndex(index, layers.length);
    setSelectedLayerIndex(nextIndex);
    window.requestAnimationFrame(() => {
      layerListRef.current
        ?.querySelector<HTMLElement>(`[data-parallax-layer-target="${nextIndex}"]`)
        ?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
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

  return (
    <div className="wide structured-editor" ref={layerListRef}>
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
      <ParallaxVisualEditor
        draft={draft}
        layers={layers}
        parallax={parallax}
        selectedLayerIndex={safeSelectedLayerIndex}
        onSelectLayer={selectLayer}
        onChangeLayer={(index, patch) => updateLayer(index, patch)}
        onChangeTitleLayout={updateTitleLayout}
      />
      {layers.length === 0 && <p className="empty-state">패럴랙스 레이어 없음</p>}
      {layers.map((layer, index) => {
        const position = getParallaxLayerPosition(layer);
        const anchor = getParallaxLayerAnchor(layer);
        const scale = getParallaxLayerScale(layer);
        return (
          <details className={`chapter-layer-details ${index === safeSelectedLayerIndex ? "selected" : ""}`} data-parallax-layer-target={index} key={`${layer.id}-${index}`} open={index === safeSelectedLayerIndex}>
            <summary onClick={(event) => {
              event.preventDefault();
              selectLayer(index);
            }}>
              <span>{index + 1}</span>
              <strong>{String(layer.name || layer.id || `Layer ${index + 1}`)}</strong>
              <code>{String(layer.kind || "sprite")}</code>
            </summary>
            <div className="structured-row chapter-layer-row">
              <TextField label="ID" value={layer.id || ""} onChange={(value) => updateLayer(index, { id: safeSegment(value, `layer_${index + 1}`) })} />
              <TextField label="Name" value={layer.name || ""} onChange={(value) => updateLayer(index, { name: value })} />
              <SelectLiteralField label="Kind" value={getParallaxLayerEditorKind(layer)} options={["background", "sprite", "overlay", "title"]} onChange={(value) => updateLayer(index, { kind: value })} />
              <TextField label="Path" value={getParallaxLayerPath(layer)} onChange={(value) => updateLayer(index, { path: value })} />
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
              <NumberField label="Order" value={layer.order ?? index} step={1} resetValue={index} onChange={(value) => updateLayer(index, { order: value })} />
              <NumberField label="Scale" value={layer.scale ?? 1} min={0} step={0.05} resetValue={1} onChange={(value) => updateLayer(index, { scale: value, scale_x: value, scale_y: value })} />
              <NumberField label="Scale X" value={getParallaxLayerScaleX(layer)} min={0.05} max={3} step={0.01} resetValue={scale} onChange={(value) => updateLayer(index, { scale_x: value })} />
              <NumberField label="Scale Y" value={getParallaxLayerScaleY(layer)} min={0.05} max={3} step={0.01} resetValue={scale} onChange={(value) => updateLayer(index, { scale_y: value })} />
              <NumberField label="Rotation" value={layer.rotation ?? 0} step={1} resetValue={0} onChange={(value) => updateLayer(index, { rotation: value })} />
              <NumberField label="Depth" value={layer.depth ?? 0.3} step={0.05} resetValue={0.3} onChange={(value) => updateLayer(index, { depth: value })} />
              <NumberField label="Perspective" value={layer.perspective ?? 0} step={0.05} resetValue={0} onChange={(value) => updateLayer(index, { perspective: value })} />
              <NumberField label="Motion strength" value={getParallaxLayerMotionStrength(layer)} min={0} max={4} step={0.05} resetValue={1} onChange={(value) => updateLayer(index, { motion_strength: value })} />
              <NumberField label="Opacity" value={layer.opacity ?? 1} min={0} max={1} step={0.05} resetValue={1} onChange={(value) => updateLayer(index, { opacity: value })} />
              <ToggleField label="Visible" checked={layer.visible !== false} onChange={(checked) => updateLayer(index, { visible: checked })} />
              <ToggleField label="Floating" checked={Boolean(layer.floating)} onChange={(checked) => updateLayer(index, { floating: checked })} />
              <ToggleField label="Thumbnail excluded" checked={Boolean(layer.thumbnail_excluded)} onChange={(checked) => updateLayer(index, { thumbnail_excluded: checked })} />
              <button type="button" onClick={() => selectLayer(index)}><Icon name="Edit" />선택</button>
              <button className="danger-action" disabled={disabled} type="button" onClick={() => removeLayer(index)}><Icon name="Delete" />삭제</button>
            </div>
          </details>
        );
      })}
    </div>
  );
}

function ImageCoordinateEditor({
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
  const stageRef = useRef<HTMLDivElement | null>(null);
  const safeX = clamp01Number(x, 0.5);
  const safeY = clamp01Number(y, 0.5);
  const imageUrl = resPathToAssetUrl(imagePath);

  function updateFromPointer(event: ReactPointerEvent<HTMLElement>) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const nextX = roundCoordinate((event.clientX - rect.left) / rect.width);
    const nextY = roundCoordinate((event.clientY - rect.top) / rect.height);
    onChange(nextX, nextY);
  }

  return (
    <div className="coordinate-editor">
      <div className="coordinate-editor-header">
        <span>{label}</span>
        <code>{safeX.toFixed(3)}, {safeY.toFixed(3)}</code>
      </div>
      <div
        className={`coordinate-stage ${imageUrl ? "has-image" : ""}`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (event.buttons !== 1) return;
          updateFromPointer(event);
        }}
        ref={stageRef}
        style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}
      >
        <button
          aria-label={`${label} coordinate`}
          className="coordinate-marker"
          style={{ left: `${safeX * 100}%`, top: `${safeY * 100}%` }}
          type="button"
        />
      </div>
      <CoordinateNudgeToolbar
        label={label}
        onChange={onChange}
        resetX={0.5}
        resetY={0.5}
        x={safeX}
        y={safeY}
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
        <code>{offset.x.toFixed(4)}, {offset.y.toFixed(4)}</code>
      </div>
      <canvas
        className="spectrum-offset-canvas"
        height={portraitEditorCanvasHeight}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (event.buttons !== 1) return;
          updateFromPointer(event);
        }}
        ref={canvasRef}
        width={portraitEditorCanvasWidth}
      />
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
  return (
    <div className="profile-crop-editor">
      <div className="coordinate-editor-header">
        <span>Profile crop</span>
        <code>{profileCropSummary(profile)}</code>
      </div>
      <ProfileCropFrame
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
    </div>
  );
}

function ProfileCropFrame({
  compact,
  faceCenter,
  imagePath,
  profile,
  onChangeProfile
}: {
  compact?: boolean;
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    function redraw() {
      if (!canvas) return;
      drawProfileCropCanvas(canvas, imageRef.current, faceCenter, { zoom, offset });
    }

    imageRef.current = null;
    redraw();

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(redraw);
      resizeObserver.observe(canvas);
    }

    if (imageUrl) {
      loadImageElement(imageUrl)
        .then((image) => {
          if (cancelled) return;
          imageRef.current = image;
          redraw();
        })
        .catch(() => {
          if (cancelled) return;
          imageRef.current = null;
          redraw();
        });
    }

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, [faceCenter.x, faceCenter.y, imageUrl, offset.x, offset.y, zoom]);

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
        className={onChangeProfile ? "editable" : ""}
        height={profileCropCanvasSize}
        onPointerCancel={stopDrag}
        onPointerDown={(event) => {
          if (!onChangeProfile || !imageRef.current) return;
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
  const entries = getParallaxVisualEntries(layers, parallax);
  const hasImage = entries.some((entry) => entry.type === "layer" && resPathToAssetUrl(getParallaxLayerPath(entry.layer)));
  const overlay = getParallaxOverlayLayout(parallax);
  const overlayUrl = overlay.enabled ? resPathToAssetUrl(overlay.path) : "";
  const stageScale = clampNumber((stageRef.current?.clientWidth || chapterThumbnailWidth) / chapterThumbnailWidth, 0.05, 4, 1);

  function startPositionDrag(event: ReactPointerEvent<HTMLElement>, index: number) {
    if (event.button !== 0) return;
    if (index !== selectedLayerIndex) {
      onSelectLayer(index);
      setSelectedVisualTarget("layer");
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const layer = layers[index];
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
        <code>{layers.length} layers</code>
      </div>
      <div
        className={`parallax-stage ${hasImage ? "has-image" : ""}`}
        onPointerCancel={stopDrag}
        onPointerDown={startPreviewOffsetDrag}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        onContextMenu={(event) => event.preventDefault()}
        onWheel={handleStageWheel}
        ref={stageRef}
      >
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
  selectedNodeIndex,
  nodeTextRef,
  setSelectedNodeIndex,
  addDialogueNode,
  addStatementNode,
  updateDialogueNode,
  removeDialogueNode,
  updateStatementNode,
  replaceStatementNodes,
  removeStatementNode,
  insertTag,
  launchGodotPreview,
  checkGodotBridge,
  configureGodotBridge,
  bridgeStatus,
  bridgeEndpoint,
  godotPath,
  setBridgeEndpoint,
  setGodotPath
}: {
  draft: ResourceRecord | null;
  references: ReferenceResources;
  selectedNodeIndex: number;
  nodeTextRef: MutableRefObject<HTMLTextAreaElement | null>;
  setSelectedNodeIndex: (index: number) => void;
  addDialogueNode: (mode: "dialogue" | "cutscene") => void;
  addStatementNode: () => void;
  updateDialogueNode: (index: number, node: ResourceRecord) => void;
  removeDialogueNode: (index: number) => void;
  updateStatementNode: (index: number, node: ResourceRecord) => void;
  replaceStatementNodes: (nodes: ResourceRecord[]) => void;
  removeStatementNode: (index: number) => void;
  insertTag: (action: typeof tagActions[number]) => void;
  launchGodotPreview: () => Promise<void>;
  checkGodotBridge: () => Promise<void>;
  configureGodotBridge: () => Promise<void>;
  bridgeStatus: string;
  bridgeEndpoint: string;
  godotPath: string;
  setBridgeEndpoint: (value: string) => void;
  setGodotPath: (value: string) => void;
}) {
  const nodes = draft ? asArray<ResourceRecord>(draft.nodes) : [];
  const statementNodes = draft ? asArray<ResourceRecord>(draft.statement_nodes) : [];
  const selectedNode = nodes[selectedNodeIndex];
  const [mobileNodeListOpen, setMobileNodeListOpen] = useState(true);
  const [selectedStatementIndex, setSelectedStatementIndex] = useState(0);
  const [activeReactionPath, setActiveReactionPath] = useState<StatementReactionPath | null>(null);
  const [selectedReactionNodePath, setSelectedReactionNodePath] = useState<StatementReactionNodePath | null>(null);
  const [statementScrollTarget, setStatementScrollTarget] = useState<StatementScrollTarget | null>(null);
  const statementFlowRef = useRef<HTMLDivElement | null>(null);
  const statementDetailRef = useRef<HTMLDivElement | null>(null);
  const draftId = draft ? String(draft.id || "") : "";

  useEffect(() => {
    setMobileNodeListOpen(true);
  }, [draftId]);

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

  function selectStatement(index: number) {
    const nextIndex = clampListIndex(index, statementNodes.length);
    setSelectedStatementIndex(nextIndex);
    setActiveReactionPath(findFirstStatementReactionPath(statementNodes, nextIndex));
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
    setActiveReactionPath({ statementIndex: nextIndex, lieIndex: 0, reactionIndex: 0 });
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
    updateReactionAtPath(path, { ...reaction, nodes: [...childNodes, defaultNestedNode("dialogue")] });
    selectReactionChild({ ...path, childIndex });
  }

  if (!draft) return <p className="empty-state">편집할 대사를 선택하세요.</p>;

  function isMobileNodeLayout() {
    return typeof window !== "undefined" && window.matchMedia("(max-width: 860px)").matches;
  }

  function selectDialogueNode(index: number) {
    setSelectedNodeIndex(index);
    if (isMobileNodeLayout()) setMobileNodeListOpen(false);
  }

  function addDialogueNodeAndOpenEditor(mode: "dialogue" | "cutscene") {
    addDialogueNode(mode);
    if (isMobileNodeLayout()) setMobileNodeListOpen(false);
  }

  function addStatementAndOpenEditor() {
    addStatementAndSelect();
    if (isMobileNodeLayout()) setMobileNodeListOpen(false);
  }

  const showMobileNodeList = mobileNodeListOpen || !selectedNode;

  return (
    <div className={`nodes-layout ${showMobileNodeList ? "mobile-list-open" : "mobile-editor-open"}`}>
      <div className="node-list">
        <div className="node-drawer-header">
          <strong><Icon name="FormatListBulleted" />노드 목록</strong>
          <button aria-label="노드 목록 닫기" type="button" onClick={() => setMobileNodeListOpen(false)}>
            <Icon name="Close" />
          </button>
        </div>
        <div className="inline-actions">
          <button type="button" onClick={() => addDialogueNodeAndOpenEditor("dialogue")}><Icon name="Add" />대사</button>
          <button type="button" onClick={() => addDialogueNodeAndOpenEditor("cutscene")}><Icon name="Add" />컷씬</button>
          <button type="button" onClick={addStatementAndOpenEditor}><Icon name="Add" />진술</button>
          <button type="button" onClick={() => void checkGodotBridge()}><Icon name="CheckCircle" />Bridge</button>
          <button type="button" onClick={() => void launchGodotPreview()}><Icon name="SmartToy" />Godot</button>
        </div>
        {selectedNode && (
          <button className="node-editor-return-button" type="button" onClick={() => setMobileNodeListOpen(false)}>
            <Icon name="Edit" />현재 노드 편집
          </button>
        )}
        <div className={`bridge-status ${bridgeStatus.startsWith("오류") ? "error" : bridgeStatus.startsWith("연결됨") || bridgeStatus.startsWith("설정됨") ? "ok" : ""}`}>
          {bridgeStatus}
        </div>
        <details className="bridge-settings">
          <summary>Godot preview 설정</summary>
          <TextField label="Bridge endpoint" value={bridgeEndpoint} onChange={setBridgeEndpoint} />
          <TextField label="Godot executable path" value={godotPath} onChange={setGodotPath} />
          <div className="inline-actions">
            <button type="button" onClick={() => void configureGodotBridge()}><Icon name="Settings" />설정</button>
            <button type="button" onClick={() => void checkGodotBridge()}><Icon name="CheckCircle" />확인</button>
          </div>
          <code>{godotBridgeCommandHint(godotPath)}</code>
        </details>
        {nodes.map((node, index) => (
          <button
            className={`node-row ${index === selectedNodeIndex ? "active" : ""}`}
            key={index}
            type="button"
            onClick={() => selectDialogueNode(index)}
          >
            <strong>{index + 1}. {isCutsceneNode(node) ? "컷씬" : speakerLabel(node.speaker, references.characters)}</strong>
            <span>{isCutsceneNode(node) ? cutsceneSummary(node) : getDialogueVisiblePreviewText(node.text).slice(0, 72) || "빈 대사"}</span>
          </button>
        ))}
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
        <div className="statement-detail-scroll" ref={statementDetailRef}>
          <StatementNodesEditor
            activeReactionPath={activeReactionPath}
            onSelectReaction={selectReaction}
            onSelectReactionChild={selectReactionChild}
            onSelectStatement={selectStatement}
            references={references}
            selectedReactionNodePath={selectedReactionNodePath}
            selectedStatementIndex={selectedStatementIndex}
            statementNodes={statementNodes}
            updateStatementNode={updateStatementNode}
            removeStatementNode={removeStatementNode}
          />
        </div>
      </div>

      <button className="node-list-scrim" aria-label="노드 목록 닫기" type="button" onClick={() => setMobileNodeListOpen(false)} />

      <div className="node-editor">
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
              </div>
              <SelectLiteralField
                label="Mode"
                value={isCutsceneNode(selectedNode) ? "cutscene" : "dialogue"}
                options={["dialogue", "cutscene"]}
                onChange={(value) => {
                  updateDialogueNode(selectedNodeIndex, value === "cutscene"
                    ? withNodeCutscene(selectedNode, getNodeCutsceneEditorValue(selectedNode))
                    : withDialogueMode(selectedNode));
                }}
              />
              <button className="danger-action" type="button" onClick={() => removeDialogueNode(selectedNodeIndex)}>
                <Icon name="Delete" />삭제
              </button>
            </div>

            {isCutsceneNode(selectedNode) ? (
              <div className="form-grid compact">
                <TextField label="Fade in" value={getNodeCutsceneEditorValue(selectedNode).fade_in} type="number" onChange={(value) => updateDialogueNode(selectedNodeIndex, patchCutscene(selectedNode, "fade_in", Number(value)))} />
                <TextField label="Hold" value={getNodeCutsceneEditorValue(selectedNode).hold} type="number" onChange={(value) => updateDialogueNode(selectedNodeIndex, patchCutscene(selectedNode, "hold", Number(value)))} />
                <TextField label="Fade out" value={getNodeCutsceneEditorValue(selectedNode).fade_out} type="number" onChange={(value) => updateDialogueNode(selectedNodeIndex, patchCutscene(selectedNode, "fade_out", Number(value)))} />
                <TextField label="Image" value={getNodeCutsceneEditorValue(selectedNode).image} onChange={(value) => updateDialogueNode(selectedNodeIndex, patchCutscene(selectedNode, "image", value))} />
              </div>
            ) : (
              <>
                <div className="form-grid compact">
                  <SelectField
                    label="Speaker"
                    value={selectedNode.speaker || "narrator"}
                    options={[{ id: "narrator", title: "narrator", subtitle: "built-in", type: "characters" } as ResourceSummary, ...references.characters]}
                    onChange={(value) => updateDialogueNode(selectedNodeIndex, withSpeakerStageCastDefaults(selectedNode, value, nodes, selectedNodeIndex))}
                  />
                  <TextField label="Next" value={selectedNode.next || ""} onChange={(value) => updateDialogueNode(selectedNodeIndex, { ...selectedNode, next: value })} />
                  <TextField label="Speaker mystery" value={getNodeSpeakerMystery(selectedNode) ? "true" : "false"} onChange={(value) => updateDialogueNode(selectedNodeIndex, withNodeSpeakerMystery(selectedNode, value === "true"))} />
                  <ToggleField label="Text sound muted" checked={getNodeTextSoundMuted(selectedNode)} onChange={(checked) => updateDialogueNode(selectedNodeIndex, withNodeTextSoundMuted(selectedNode, checked))} />
                </div>
                <label className="node-textarea">
                  <span>Text</span>
                  <textarea
                    ref={nodeTextRef}
                    value={selectedNode.text || ""}
                    onChange={(event) => updateDialogueNode(selectedNodeIndex, { ...selectedNode, text: event.target.value })}
                    spellCheck={false}
                  />
                </label>
                <div className="tag-palette">
                  {tagActions.map((action) => (
                    <button key={action.label} type="button" onClick={() => insertTag(action)}>
                      <b>{action.label}</b>
                      <span>{action.hint}</span>
                    </button>
                  ))}
                </div>
                <RichTextPreview text={selectedNode.text || ""} />
                <EffectPreviewStrip text={selectedNode.text || ""} />
                <DialogueChoicesEditor
                  node={selectedNode}
                  nodeAutoPrefix="@"
                  nodes={nodes}
                  references={references}
                  updateNode={(nextNode) => updateDialogueNode(selectedNodeIndex, nextNode)}
                />
                <StageCastEditor
                  characters={references.characters}
                  nodes={nodes}
                  selectedNodeIndex={selectedNodeIndex}
                  speakerId={String(selectedNode.speaker || "")}
                  speakerMystery={getNodeSpeakerMystery(selectedNode)}
                  stageCast={selectedNode.stage_cast}
                  onChange={(stageCast) => updateDialogueNode(selectedNodeIndex, { ...selectedNode, stage_cast: stageCast })}
                />
                <AcquireInfoEditor
                  references={references}
                  value={getNodeAcquireInfoEditorValue(selectedNode)}
                  onChange={(acquireInfo) => updateDialogueNode(selectedNodeIndex, withNodeAcquireInfo(selectedNode, acquireInfo))}
                />
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
      </div>
    </div>
  );
}

function EffectPreviewStrip({ text }: { text: string }) {
  const tags = detectTextTags(text);
  if (tags.length === 0) {
    return <div className="effect-preview-strip"><span>BBCode / 이벤트 태그 없음</span></div>;
  }

  return (
    <div className="effect-preview-strip">
      {tags.map((tag) => (
        <span className={`effect-chip ${tag}`} key={tag}>
          {tagPreviewLabel(tag)}
        </span>
      ))}
    </div>
  );
}

function RichTextPreview({ text, compact = false }: { text: string; compact?: boolean }) {
  const nodes = useMemo(() => parseRichTextPreviewAst(text), [text]);
  const tags = detectTextTags(text);
  return (
    <section className={`rich-text-preview ${compact ? "compact" : ""}`}>
      <div className="rich-text-preview-header">
        <span>Preview</span>
        <code>{tags.length > 0 ? tags.map(tagPreviewLabel).join(" · ") : "plain"}</code>
      </div>
      <div className="rich-text-preview-body">
        {nodes.length > 0 ? renderRichTextNodes(nodes, "rich") : <span className="rich-text-empty">보이는 텍스트 없음</span>}
      </div>
    </section>
  );
}

function DialogueChoicesEditor({
  node,
  nodes,
  references,
  nodeAutoPrefix,
  updateNode,
  compact = false
}: {
  node: ResourceRecord;
  nodes: ResourceRecord[];
  references: ReferenceResources;
  nodeAutoPrefix: string;
  updateNode: (node: ResourceRecord) => void;
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

  return (
    <details className={`choices-editor ${compact ? "compact" : ""}`} open={choices.length > 0}>
      <summary>
        <strong>Choices</strong>
        <span>{choices.length > 0 ? `${choices.length} branches` : "단일 흐름"}</span>
        <button type="button" onClick={(event) => {
          event.preventDefault();
          addChoice();
        }}>
          <Icon name="Add" />선택지
        </button>
      </summary>
      <div className="choices-editor-body">
        {choices.length === 0 ? (
          <p className="empty-state">선택지 없음 — next 또는 순차 흐름을 사용합니다.</p>
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
                    <TextField label="Label" value={choice.label || ""} onChange={(value) => updateChoice(index, { ...choice, label: value })} />
                    <TextField label="Text" value={choice.text || ""} onChange={(value) => updateChoice(index, { ...choice, text: value })} />
                    <SelectField label="Next" value={choice.next || ""} options={nodeOptions} onChange={(value) => updateChoice(index, { ...choice, next: value })} />
                  </div>
                  <div className="choice-rich-preview-grid">
                    <RichTextPreview compact text={String(choice.label || "")} />
                    <RichTextPreview compact text={String(choice.text || "")} />
                  </div>
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

function ChoiceJsonField({
  label,
  value,
  expected,
  onChange
}: {
  label: string;
  value: unknown;
  expected: "object" | "array";
  onChange: (value: ResourceRecord | unknown[]) => void;
}) {
  const normalized = expected === "array" ? asArray(value) : normalizeJsonObject(value);
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

function StageCastEditor({
  characters,
  nodes,
  selectedNodeIndex,
  speakerId,
  speakerMystery,
  stageCast,
  onChange
}: {
  characters: ResourceSummary[];
  nodes: ResourceRecord[];
  selectedNodeIndex: number;
  speakerId: string;
  speakerMystery: boolean;
  stageCast: unknown;
  onChange: (stageCast: Record<string, ResourceRecord>) => void;
}) {
  const cast = stageCast && typeof stageCast === "object" ? stageCast as Record<string, ResourceRecord> : {};
  const entries = Object.entries(cast);
  const castIds = entries.map(([characterId]) => characterId);
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

  function selectCast(characterId: string) {
    setSelectedCastId(characterId);
    window.requestAnimationFrame(() => {
      const target = Array.from(editorRef.current?.querySelectorAll<HTMLElement>("[data-stage-cast-target]") || [])
        .find((element) => element.dataset.stageCastTarget === characterId);
      target?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }

  function updateCast(characterId: string, patch: ResourceRecord) {
    onChange({ ...cast, [characterId]: { ...(cast[characterId] || {}), ...patch } });
  }

  function removeCast(characterId: string) {
    const next = { ...cast };
    delete next[characterId];
    onChange(next);
    if (selectedCastId === characterId) setSelectedCastId("");
  }

  function addCast(characterId: string) {
    if (!characterId || cast[characterId]) return;
    const isSpeaker = characterId === speakerId;
    onChange({
      ...cast,
      [characterId]: {
        portrait: "",
        portrait_position: "center",
        animation_order: entries.length + 1,
        animation_speed: isSpeaker ? 1 : 1.25,
        portrait_opacity: isSpeaker ? 1 : 0.7,
        portrait_zoom: isSpeaker ? 300 : 250,
        character_exit: false,
        mystery: isSpeaker && speakerMystery
      }
    });
    setSelectedCastId(characterId);
  }

  function updatePosition(characterId: string, value: string) {
    const position = normalizeCastPosition(value);
    const previousOffset = parseCastOffset(cast[characterId]?.portrait_offset);
    updateCast(characterId, {
      portrait_position: position,
      portrait_offset: position === "custom" ? [previousOffset.x, previousOffset.y] : null
    });
  }

  function applyPreset(characterId: string, preset: "speaker" | "bystander") {
    updateCast(characterId, preset === "speaker"
      ? { portrait_zoom: 300, animation_speed: 1, portrait_opacity: 1 }
      : { portrait_zoom: 250, animation_speed: 1.25, portrait_opacity: 0.7 });
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
      label: characterLabel(characterId, character, characters),
      portrait: resolveCastPortrait(character, value.portrait),
      position: normalizeCastPosition(value.portrait_position ?? value.position),
      offset: parseCastOffset(value.portrait_offset),
      positionOrder: normalizeNumber(value.portrait_position_order ?? value.position_order, index + 1, 1),
      animationOrder: normalizeNumber(value.animation_order ?? value.order, index + 1, 1),
      animationSpeed: normalizeNumber(value.animation_speed, characterId === speakerId ? 1 : 1.25, 0.5, 2),
      portraitOpacity: normalizeNumber(value.portrait_opacity ?? value.opacity, characterId === speakerId ? 1 : 0.7, 0, 1),
      portraitZoom: normalizeNumber(value.portrait_zoom, characterId === speakerId ? 300 : 250, 100, 500),
      flipH: Boolean(value.portrait_flip_h ?? value.flip_h ?? value.flip_x),
      characterExit: Boolean(value.character_exit ?? value.exit),
      mystery: Boolean(value.mystery ?? value.portrait_mystery ?? (characterId === speakerId && speakerMystery))
    };
  });

  return (
    <div className="stage-cast-editor" ref={editorRef}>
      <div className="structured-header">
        <span>stage_cast</span>
        <select value="" onChange={(event) => addCast(event.target.value)}>
          <option value="">캐릭터 추가</option>
          <option value="mystery">mystery</option>
          {characters.map((character) => <option key={character.id} value={character.id}>{character.title}</option>)}
        </select>
      </div>
      {entries.length === 0 && <p className="empty-state">무대 캐스트 없음</p>}
      {stageEntries.length > 0 && (
        <>
          <div className="stage-cast-mini-index" role="list" aria-label="stage_cast index">
            {stageEntries.map((entry) => (
              <button
                className={selectedCastId === entry.characterId ? "active" : ""}
                key={entry.characterId}
                type="button"
                onClick={() => selectCast(entry.characterId)}
              >
                <span>{entry.label}</span>
                <code>{entry.position}</code>
              </button>
            ))}
          </div>
          <StageCastScenePreview
            entries={stageEntries}
            onMoveCustomOffset={(characterId, offset) => updateCast(characterId, { portrait_offset: [offset.x, offset.y] })}
            onSelectCast={selectCast}
            selectedCastId={selectedCastId}
          />
        </>
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
                <code>{entry.characterId}</code>
                <div className="stage-cast-badges">
                  {entry.isSpeaker && <span>화자</span>}
                  {entry.inherited && <span>{entry.inherited.index + 1}번 상속</span>}
                  {entry.mystery && <span>수수께끼</span>}
                  {entry.characterExit && <span>퇴장</span>}
                </div>
              </div>
            </div>
            {portraitOptions.length > 0 ? (
              <label className="field-block">
                <span>Portrait</span>
                <select value={String(value.portrait || "")} onChange={(event) => updateCast(entry.characterId, { portrait: event.target.value })}>
                  <option value="">미지정</option>
                  {portraitOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            ) : (
              <TextField label="Portrait" value={value.portrait || ""} onChange={(next) => updateCast(entry.characterId, { portrait: next })} />
            )}
            <SelectLiteralField
              label="Position"
              value={entry.position}
              options={["left", "center", "right", "custom"]}
              onChange={(next) => updatePosition(entry.characterId, next)}
            />
            {isCustomPosition && (
              <>
                <NumberField
                  label="Offset X"
                  value={entry.offset.x}
                  step={0.01}
                  resetValue={0}
                  onChange={(next) => updateCast(entry.characterId, { portrait_offset: [next, entry.offset.y] })}
                />
                <NumberField
                  label="Offset Y"
                  value={entry.offset.y}
                  step={0.01}
                  resetValue={0}
                  onChange={(next) => updateCast(entry.characterId, { portrait_offset: [entry.offset.x, next] })}
                />
              </>
            )}
            <NumberField label="Position order" value={entry.positionOrder} min={1} step={1} resetValue={entry.index + 1} onChange={(next) => updateCast(entry.characterId, { portrait_position_order: next })} />
            <NumberField label="Animation order" value={entry.animationOrder} min={1} step={1} resetValue={entry.index + 1} onChange={(next) => updateCast(entry.characterId, { animation_order: next })} />
            <NumberField label="Zoom" value={entry.portraitZoom} min={100} max={500} step={50} resetValue={entry.isSpeaker ? 300 : 250} onChange={(next) => updateCast(entry.characterId, { portrait_zoom: next })} />
            <NumberField label="Opacity" value={entry.portraitOpacity} min={0} max={1} step={0.1} resetValue={entry.isSpeaker ? 1 : 0.7} onChange={(next) => updateCast(entry.characterId, { portrait_opacity: next })} />
            <NumberField label="Animation speed" value={entry.animationSpeed} min={0.5} max={2} step={0.25} resetValue={entry.isSpeaker ? 1 : 1.25} onChange={(next) => updateCast(entry.characterId, { animation_speed: next })} />
            <ToggleField label="Flip X" checked={entry.flipH} onChange={(checked) => updateCast(entry.characterId, { portrait_flip_h: checked })} />
            <ToggleField label="Mystery" checked={entry.mystery} onChange={(checked) => updateCast(entry.characterId, { mystery: checked })} />
            <ToggleField label="Exit" checked={entry.characterExit} onChange={(checked) => updateCast(entry.characterId, { character_exit: checked })} />
            <div className="stage-cast-presets">
              <button type="button" onClick={() => applyPreset(entry.characterId, "speaker")}>발화자</button>
              <button type="button" onClick={() => applyPreset(entry.characterId, "bystander")}>비발화자</button>
            </div>
            <button className="danger-action" type="button" onClick={() => removeCast(entry.characterId)}><Icon name="Delete" />삭제</button>
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
  label: string;
  portrait: { key: string; path: string; center: number[]; profile: ResourceRecord } | null;
  position: string;
  offset: { x: number; y: number };
  positionOrder: number;
  animationOrder: number;
  animationSpeed: number;
  portraitOpacity: number;
  portraitZoom: number;
  flipH: boolean;
  characterExit: boolean;
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
  entries,
  onMoveCustomOffset,
  onSelectCast,
  selectedCastId
}: {
  entries: StageCastPreviewEntry[];
  onMoveCustomOffset?: (characterId: string, offset: PointerPoint) => void;
  onSelectCast: (characterId: string) => void;
  selectedCastId: string;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<StageCastSceneDrag | null>(null);
  const [imageSizes, setImageSizes] = useState<Record<string, { w: number; h: number }>>({});
  const visibleEntries = entries
    .filter((entry) => entry.portrait?.path && !entry.characterExit)
    .sort((a, b) => a.animationOrder === b.animationOrder ? a.index - b.index : a.animationOrder - b.animationOrder);
  const selectedEntry = selectedCastId ? visibleEntries.find((entry) => entry.characterId === selectedCastId) : null;

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
    onSelectCast(entry.characterId);
    if (event.button !== 0 || entry.position !== "custom" || !onMoveCustomOffset) return;
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
    <div className="stage-cast-scene-preview">
      <div
        className="stage-cast-stage-area"
        onPointerCancel={stopCustomOffsetDrag}
        onPointerMove={moveCustomOffsetDrag}
        onPointerUp={stopCustomOffsetDrag}
        ref={stageRef}
      >
        <div className="stage-cast-center-line" />
        <div className="stage-cast-face-anchor" />
        {visibleEntries.map((entry, index) => {
          const imageKey = stageCastImageKey(entry);
          const style = getStageCastSpriteStyle(entry, entries, imageSizes[imageKey], index);
          return (
            <div
              className={`stage-cast-sprite ${entry.position === "custom" ? "custom-offset" : ""} ${selectedCastId === entry.characterId ? "selected" : ""} ${entry.flipH ? "flipped" : ""} ${entry.mystery ? "mystery" : ""}`}
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
        <strong>Stage Preview</strong>
        <span>{visibleEntries.length} visible</span>
      </div>
      {selectedEntry?.position === "custom" && (
        <div className="stage-cast-nudge-panel">
          <CoordinateNudgeToolbar
            label={`${selectedEntry.label} offset`}
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
      {visibleEntries.length === 0 && <span className="stage-cast-preview-empty">preview empty</span>}
    </div>
  );
}

function CastPortraitPreview({ entry }: { entry: StageCastPreviewEntry }) {
  const imageUrl = resPathToAssetUrl(entry.portrait?.path);
  const faceCenter = getProfileFaceCenter(entry.portrait?.profile, entry.portrait?.center || []);
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
  return Object.keys(portraits);
}

function resolveCastPortrait(character: ResourceRecord | undefined, keyOrPath: unknown): StageCastPreviewEntry["portrait"] {
  const portraits = character?.portraits && typeof character.portraits === "object"
    ? character.portraits as Record<string, ResourceRecord | string>
    : {};
  const key = String(keyOrPath || "");
  if (key.startsWith("res://")) {
    return { key, path: key, center: [0.5, 0.34], profile: {} };
  }

  const portraitKey = key && portraits[key] ? key : Object.keys(portraits)[0];
  const rawPortrait = portraitKey ? portraits[portraitKey] : null;
  if (!rawPortrait) return null;
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

function getStageCastRecord(value: unknown): Record<string, ResourceRecord> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, ResourceRecord>
    : {};
}

function withSpeakerStageCastDefaults(node: ResourceRecord, speaker: string, nodes: ResourceRecord[], nodeIndex: number) {
  const nextNode: ResourceRecord = { ...node, speaker };
  const speakerId = normalizeEditorSpeakerId(speaker);
  if (!speakerId) return nextNode;

  const stageCast = { ...getStageCastRecord(node.stage_cast) };
  const existingEntry = stageCast[speakerId];
  stageCast[speakerId] = fillStageCastRoleDefaults(
    existingEntry && typeof existingEntry === "object"
      ? { ...existingEntry }
      : buildInheritedStageCastEntry(nodes, nodeIndex, speakerId),
    true,
    getNodeSpeakerMystery(nextNode),
    Math.max(1, Object.keys(stageCast).length + 1)
  );
  nextNode.stage_cast = stageCast;
  return nextNode;
}

function buildInheritedStageCastEntry(nodes: ResourceRecord[], nodeIndex: number, speakerId: string) {
  const inherited = findPreviousCastEntry(nodes, nodeIndex, speakerId)?.entry;
  return inherited && typeof inherited === "object" ? cloneJsonValue(inherited) : {};
}

function fillStageCastRoleDefaults(entry: ResourceRecord, isSpeaker: boolean, mystery: boolean, animationOrder: number) {
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
    next.portrait_zoom = isSpeaker ? portraitZoomDefault : portraitZoomBystanderDefault;
  }
  if (next.animation_order === undefined || next.animation_order === null || next.animation_order === "") {
    next.animation_order = animationOrder;
  }
  if (next.animation_speed === undefined || next.animation_speed === null || next.animation_speed === "") {
    next.animation_speed = isSpeaker ? 1 : 1.25;
  }
  if (next.portrait_opacity === undefined || next.portrait_opacity === null || next.portrait_opacity === "") {
    next.portrait_opacity = isSpeaker ? 1 : 0.7;
  }
  if (next.mystery === undefined || next.mystery === null) {
    next.mystery = Boolean(mystery);
  }
  next.character_exit = false;
  return next;
}

function normalizeCastPosition(value: unknown) {
  const text = String(value || "center").trim().toLowerCase();
  if (["left", "center", "right", "custom"].includes(text)) return text;
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
  return position === "left" || position === "center" || position === "right";
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
      visible: Boolean(candidate?.portrait) && !Boolean(candidate?.character_exit ?? candidate?.exit)
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
    .filter((candidate) => candidate.position === entry.position && candidate.portrait && !candidate.characterExit && isStackableCastPosition(candidate.position))
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
  const width = textureW * scale;
  const height = textureH * scale;
  const anchor = getPortraitAnchorRatios(zoom);
  const offset = stageCastPreviewOffset(entry, allEntries);
  const anchorX = gameCharacterLayerWidth * anchor.x + offset.x * gameCharacterLayerWidth;
  const anchorY = gameCharacterLayerHeight * anchor.y + offset.y * gameCharacterLayerHeight;
  return {
    left: `${(anchorX - faceCenter.x * width) / gameCharacterLayerWidth * 100}%`,
    top: `${(anchorY - faceCenter.y * height) / gameCharacterLayerHeight * 100}%`,
    width: `${width / gameCharacterLayerWidth * 100}%`,
    height: `${height / gameCharacterLayerHeight * 100}%`,
    opacity: clampNumber(entry.portraitOpacity, 0, 1, 1),
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

function defaultNestedNode(mode: "dialogue" | "cutscene"): ResourceRecord {
  return mode === "cutscene"
    ? { mode: "cutscene", cutscene: { fade_in: 0, hold: 1, fade_out: 1 } }
    : { speaker: "narrator", text: "" };
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

function withNodeSpeakerMystery(node: ResourceRecord, value: boolean) {
  const next: ResourceRecord = { ...node };
  delete next.mystery_speaker;
  if (value) next.speaker_mystery = true;
  else delete next.speaker_mystery;
  const speakerId = normalizeEditorSpeakerId(next.speaker);
  if (value && speakerId) {
    const stageCast = { ...getStageCastRecord(next.stage_cast) };
    stageCast[speakerId] = fillStageCastRoleDefaults(
      stageCast[speakerId] && typeof stageCast[speakerId] === "object" ? { ...stageCast[speakerId] } : {},
      true,
      true,
      Math.max(1, Object.keys(stageCast).length + 1)
    );
    next.stage_cast = stageCast;
  }
  return next;
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
    if (["lie", "color", "shake", "wave", "speed", "font_scale", "alpha", "bgm", "sfx", "se", "bg", "auto_next"].includes(body.toLowerCase())) continue;
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

function resolveStatementNodeId(node: ResourceRecord, index: number) {
  return String(node.id || `@statement_${index}`);
}

function resolveNestedNodeId(node: ResourceRecord, index: number, autoPrefix: string) {
  return String(node.id || `${autoPrefix}${index}`);
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
                  <code>{resolveStatementNodeId(node, index)}</code>
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
                    const childPrefix = `@reaction_${index}_${lieIndex}_${reactionIndex}_`;
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
                                <span>{isCutsceneNode(childNode) ? cutsceneSummary(childNode) : getDialogueVisiblePreviewText(childNode.text).slice(0, 42) || "빈 대사"}</span>
                                <code>{resolveNestedNodeId(childNode, childIndex, childPrefix)}</code>
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
  selectedStatementIndex,
  statementNodes,
  updateStatementNode,
  removeStatementNode
}: {
  activeReactionPath: StatementReactionPath | null;
  onSelectReaction: (path: StatementReactionPath) => void;
  onSelectReactionChild: (path: StatementReactionNodePath) => void;
  onSelectStatement: (index: number) => void;
  references: ReferenceResources;
  selectedReactionNodePath: StatementReactionNodePath | null;
  selectedStatementIndex: number;
  statementNodes: ResourceRecord[];
  updateStatementNode: (index: number, node: ResourceRecord) => void;
  removeStatementNode: (index: number) => void;
}) {
  if (statementNodes.length === 0) return null;

  return (
    <div className="statement-editor-list">
      {statementNodes.map((node, index) => {
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
        return (
          <article
            className={`statement-editor ${selectedStatementIndex === index ? "active" : ""}`}
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
            <div className="form-grid compact">
              <TextField label="ID" value={node.id || ""} onChange={(value) => updateNode({ ...node, id: value })} />
              <SelectField
                label="Speaker"
                value={node.speaker || "narrator"}
                options={[{ id: "narrator", title: "narrator", subtitle: "built-in", type: "characters" } as ResourceSummary, ...references.characters]}
                onChange={(value) => updateNode(withSpeakerStageCastDefaults(node, value, statementNodes, index))}
              />
              <ToggleField label="Statement end" checked={Boolean(node.statement_end)} onChange={(checked) => updateNode({ ...node, statement_end: checked })} />
            </div>
            <TextField label="Text" value={node.text || ""} multiline onChange={updateText} />
            <RichTextPreview compact text={node.text || ""} />
            <DialogueChoicesEditor
              compact
              node={node}
              nodeAutoPrefix="@statement_"
              nodes={statementNodes}
              references={references}
              updateNode={updateNode}
            />
            <StageCastEditor
              characters={references.characters}
              nodes={statementNodes}
              selectedNodeIndex={index}
              speakerId={String(node.speaker || "")}
              speakerMystery={getNodeSpeakerMystery(node)}
              stageCast={node.stage_cast}
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
  onSelectReaction,
  onSelectReactionChild,
  reaction,
  reactionIndex,
  references,
  selectedReactionNodePath,
  statementIndex,
  updateReaction,
  removeReaction
}: {
  activeReactionPath: StatementReactionPath | null;
  lie: ResourceRecord;
  lieIndex: number;
  onSelectReaction: (path: StatementReactionPath) => void;
  onSelectReactionChild: (path: StatementReactionNodePath) => void;
  reaction: ResourceRecord;
  reactionIndex: number;
  references: ReferenceResources;
  selectedReactionNodePath: StatementReactionNodePath | null;
  statementIndex: number;
  updateReaction: (reaction: ResourceRecord) => void;
  removeReaction: () => void;
}) {
  const kind = String(reaction.kind || "default");
  const childNodes = asArray<ResourceRecord>(reaction.nodes);
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

  function addChildNode(mode: "dialogue" | "cutscene") {
    updateReaction({ ...reaction, nodes: [...childNodes, defaultNestedNode(mode)] });
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
      <div className="form-grid compact">
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
          <button type="button" onClick={() => addChildNode("cutscene")}><Icon name="Add" />컷씬</button>
        </div>
      </div>
      {childNodes.length === 0 && <p className="empty-state">반응 대사 없음</p>}
      <div className="statement-child-node-list">
        {childNodes.map((childNode, childIndex) => (
          <NestedDialogueNodeEditor
            active={isSameStatementReactionNodePath(selectedReactionNodePath, { ...reactionPath, childIndex })}
            key={childIndex}
            index={childIndex}
            node={childNode}
            nodeAutoPrefix={childNodeAutoPrefix}
            nodes={childNodes}
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
  references: ReferenceResources;
  updateNode: (node: ResourceRecord) => void;
  removeNode: () => void;
  statementTargetKey?: string;
}) {
  const cutsceneMode = isCutsceneNode(node);
  const mode = cutsceneMode ? "cutscene" : "dialogue";
  const cutscene = getNodeCutsceneEditorValue(node);
  return (
    <details
      className={`statement-child-node ${active ? "active" : ""}`}
      data-statement-target={statementTargetKey}
      open={active || index === 0}
    >
      <summary onClick={onSelect}>
        <strong>{index + 1}. {mode === "cutscene" ? "컷씬" : speakerLabel(node.speaker, references.characters)}</strong>
        <span>{mode === "cutscene" ? cutsceneSummary(node) : getDialogueVisiblePreviewText(node.text).slice(0, 52) || "빈 대사"}</span>
      </summary>
      <div className="nested-node-grid">
        <div className="structured-header">
          <span>Nested node</span>
          <button className="danger-action" type="button" onClick={removeNode}><Icon name="Delete" />삭제</button>
        </div>
        <div className="form-grid compact">
          <TextField label="ID" value={node.id || ""} onChange={(value) => updateNode({ ...node, id: value })} />
          <SelectLiteralField
            label="Mode"
            value={mode}
            options={["dialogue", "cutscene"]}
            onChange={(value) => updateNode(value === "cutscene"
              ? withNodeCutscene(node, getNodeCutsceneEditorValue(node))
              : withDialogueMode(node))}
          />
          {mode !== "cutscene" && (
            <SelectField
              label="Speaker"
              value={node.speaker || "narrator"}
              options={[{ id: "narrator", title: "narrator", subtitle: "built-in", type: "characters" } as ResourceSummary, ...references.characters]}
              onChange={(value) => updateNode(withSpeakerStageCastDefaults(node, value, nodes, index))}
            />
          )}
        </div>
        {mode === "cutscene" ? (
          <div className="form-grid compact">
            <NumberField label="Fade in" value={cutscene.fade_in} min={0} step={0.1} resetValue={0} onChange={(value) => updateNode(patchCutscene(node, "fade_in", value))} />
            <NumberField label="Hold" value={cutscene.hold} min={0} step={0.1} resetValue={1} onChange={(value) => updateNode(patchCutscene(node, "hold", value))} />
            <NumberField label="Fade out" value={cutscene.fade_out} min={0} step={0.1} resetValue={1} onChange={(value) => updateNode(patchCutscene(node, "fade_out", value))} />
            <TextField label="Image" value={cutscene.image} onChange={(value) => updateNode(patchCutscene(node, "image", value))} />
          </div>
        ) : (
          <>
            <div className="form-grid compact">
              <TextField label="Next" value={node.next || ""} onChange={(value) => updateNode({ ...node, next: value })} />
              <ToggleField label="Speaker mystery" checked={getNodeSpeakerMystery(node)} onChange={(checked) => updateNode(withNodeSpeakerMystery(node, checked))} />
            </div>
            <TextField label="Text" value={node.text || ""} multiline onChange={(value) => updateNode({ ...node, text: value })} />
            <RichTextPreview compact text={node.text || ""} />
            <DialogueChoicesEditor
              compact
              node={node}
              nodeAutoPrefix={nodeAutoPrefix}
              nodes={nodes}
              references={references}
              updateNode={updateNode}
            />
            <StageCastEditor
              characters={references.characters}
              nodes={nodes}
              selectedNodeIndex={index}
              speakerId={String(node.speaker || "")}
              speakerMystery={getNodeSpeakerMystery(node)}
              stageCast={node.stage_cast}
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
        <strong>Popups</strong>
        <span>{popupList.length}개</span>
        <button type="button" onClick={(event) => {
          event.preventDefault();
          addPopup();
        }}>
          <Icon name="Add" />팝업
        </button>
      </summary>
      {popupList.length === 0 && <p className="empty-state">팝업 이미지 없음</p>}
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
          return (
            <article className={`popup-editor-card ${selectedPopupIndex === index ? "active" : ""}`} key={index} onFocus={() => setSelectedPopupIndex(index)} onClick={() => setSelectedPopupIndex(index)}>
              <div className="structured-header">
                <span>Popup {index + 1}</span>
                <button className="danger-action" type="button" onClick={() => onChange(popupList.filter((_, popupIndex) => popupIndex !== index))}>
                  <Icon name="Delete" />삭제
                </button>
              </div>
              <div className="form-grid compact">
                <SelectLiteralField label="Source" value={source} options={["character_profile", "item", "image"]} onChange={(value) => updatePopup(index, { source: value, target_id: "", path: "", portrait: "" })} />
                {source === "image" ? (
                  <TextField label="Image path" value={popup.path || popup.image || ""} onChange={(value) => updatePopup(index, { path: value })} />
                ) : (
                  <SelectField label={source === "item" ? "Item" : "Character"} value={popup.target_id || ""} options={source === "item" ? references.items : references.characters} onChange={(value) => updatePopup(index, { target_id: value })} />
                )}
                {source === "character_profile" && <TextField label="Portrait" value={popup.portrait || ""} onChange={(value) => updatePopup(index, { portrait: value })} />}
                <SelectLiteralField label="Position" value={popup.position || "center"} options={["left", "center", "right", "top_left", "top_right", "custom"]} onChange={(value) => updatePopup(index, { position: value })} />
                <NumberField label="Offset X" value={offset.x} step={0.01} resetValue={0} onChange={(value) => updatePopup(index, { offset: [value, offset.y] })} />
                <NumberField label="Offset Y" value={offset.y} step={0.01} resetValue={0} onChange={(value) => updatePopup(index, { offset: [offset.x, value] })} />
                <NumberField label="Width" value={size.x} min={1} step={10} resetValue={320} onChange={(value) => updatePopup(index, { size: [value, size.y] })} />
                <NumberField label="Height" value={size.y} min={1} step={10} resetValue={320} onChange={(value) => updatePopup(index, { size: [size.x, value] })} />
                <NumberField label="Scale" value={popup.scale ?? 1} min={0.25} max={3} step={0.05} resetValue={1} onChange={(value) => updatePopup(index, { scale: value })} />
                <NumberField label="Opacity" value={popup.opacity ?? 1} min={0} max={1} step={0.05} resetValue={1} onChange={(value) => updatePopup(index, { opacity: value })} />
                <SelectLiteralField label="Transition" value={popup.transition || "fade"} options={["fade", "pop", "slide", "none"]} onChange={(value) => updatePopup(index, { transition: value })} />
                {source === "image" && (
                  <>
                    <SelectLiteralField label="Image mode" value={popup.image_mode || "fit"} options={["fit", "cover", "crop"]} onChange={(value) => updatePopup(index, { image_mode: value })} />
                    <NumberField label="Image zoom" value={popup.image_zoom ?? 1} min={0.25} max={6} step={0.05} resetValue={1} onChange={(value) => updatePopup(index, { image_zoom: value })} />
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
      <div
        className="node-popup-preview-stage"
        onPointerCancel={stopDrag}
        onPointerMove={moveDrag}
        onPointerUp={stopDrag}
        ref={stageRef}
      >
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

function PreviewPanel({ draft, type, issues }: { draft: ResourceRecord | null; type: ResourceType; issues: ValidationIssue[] }) {
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

function TextField({
  label,
  value,
  onChange,
  multiline,
  type = "text",
  readOnly = false
}: {
  label: string;
  value: unknown;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: "text" | "number" | "color-text";
  readOnly?: boolean;
}) {
  const stringValue = value === undefined || value === null ? "" : String(value);
  return (
    <label className={`field-block ${multiline ? "wide" : ""} ${readOnly ? "read-only" : ""}`}>
      <span>{label}</span>
      {multiline ? (
        <textarea readOnly={readOnly} value={stringValue} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input readOnly={readOnly} value={stringValue} onChange={(event) => onChange(event.target.value)} type={type === "number" ? "number" : "text"} />
      )}
    </label>
  );
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
  onChange
}: {
  label: string;
  value: unknown;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="field-block">
      <span>{label}</span>
      <select value={String(value || "")} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
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
  return String(value || "").trim() === "statement" ? "statement" : "normal";
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
    <label className="toggle-field">
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <span>{label}</span>
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
    <button className={`tool-button ${filled ? "filled" : ""} ${danger ? "danger" : ""}`} disabled={disabled} type="button" onClick={onClick}>
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  );
}

function Icon({ name }: { name: string }) {
  return <img aria-hidden="true" src={iconPath(name)} />;
}

function tabLabel(tab: EditorTab, ui: EditorCopy): string {
  return ui.tabs[tab];
}

function speakerLabel(value: unknown, characters: ResourceSummary[]) {
  const id = String(value || "narrator");
  if (id === "narrator") return "narrator";
  return characters.find((entry) => entry.id === id)?.title || id;
}

function isCutsceneNode(node: ResourceRecord) {
  const mode = String(node.mode ?? node.type ?? "dialogue").trim().toLowerCase();
  if (["cutscene", "blackout", "dark", "fade_black", "fade-to-black", "암전", "컷씬"].includes(mode)) return true;
  return Boolean(node.blackout_enabled ?? node.is_blackout);
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

function cutsceneSummary(node: ResourceRecord) {
  const cutscene = getNodeCutsceneEditorValue(node);
  return `fade ${cutscene.fade_in ?? 0}/${cutscene.fade_out ?? 1} · hold ${cutscene.hold ?? 1}`;
}

function patchCutscene(node: ResourceRecord, field: string, value: unknown) {
  return withNodeCutscene(node, { ...getNodeCutsceneEditorValue(node), [field]: value });
}

function countEventTags(nodes: ResourceRecord[]) {
  return nodes.reduce((total, node) => total + (String(node.text || "").match(/\[(bgm|sfx|se|bg|auto_next)\b/gi)?.length || 0), 0);
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

function storyAssetUploadPath(asset: ResourceRecord, file: File) {
  const kind = normalizeKind(asset.kind || "sfx");
  const folder = kind === "bgm" ? "bgm" : kind === "background" ? "background" : "sfx";
  return `assets/story_assets/${folder}/${safeSegment(asset.id || "asset")}.${fileExtension(file)}`;
}

function normalizeDialogueDraftForSave(dialogue: ResourceRecord): ResourceRecord {
  const chapters = getResourceChapterScopeIds(dialogue);
  const metadata = normalizeJsonObject(dialogue.metadata);
  const start = normalizeSingleId(dialogue.start);
  const defaultStart = getDialogueDefaultStartId(dialogue);
  const next: ResourceRecord = { ...dialogue };
  if (chapters.length > 0) next.chapters = chapters;
  else delete next.chapters;
  delete next.chapter_ids;
  if (start && start !== defaultStart) next.start = start;
  else delete next.start;
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
  const next: ResourceRecord = {
    ...character,
    display_name: String(character.display_name || character.id || "").trim(),
    description: String(character.description || ""),
    name_color: String(character.name_color || "#ffffff").trim() || "#ffffff",
    portraits: normalizeCharacterPortraitsForSave(character.portraits),
    metadata: normalizeJsonObject(character.metadata)
  };
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

function normalizePortraitProfileForSave(value: unknown, fallbackCenter: PointerPoint) {
  const profile = value && typeof value === "object" ? value as ResourceRecord : {};
  const center = getProfileFaceCenter(profile, [fallbackCenter.x, fallbackCenter.y]);
  const zoom = getProfileZoom(profile.zoom);
  const offset = getProfileOffset(profile);
  const next: ResourceRecord = {};
  if (Math.abs(center.x - fallbackCenter.x) >= 0.001 || Math.abs(center.y - fallbackCenter.y) >= 0.001) {
    next.center = [round4Number(center.x), round4Number(center.y)];
  }
  if (Math.abs(zoom - profileZoomDefault) >= 0.001) next.zoom = zoom;
  if (Math.abs(offset.x) >= 0.0001 || Math.abs(offset.y) >= 0.0001) {
    next.offset = [round4Number(offset.x), round4Number(offset.y)];
  }
  return Object.keys(next).length > 0 ? next : null;
}

function prepareDraftForSave(type: ResourceType, draft: ResourceRecord): ResourceRecord {
  if (type === "dialogues") return normalizeDialogueDraftForSave(draft);
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
  return "green";
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
    if (saved) return normalizeGodotPreviewEndpoint(saved);
  } catch {
    // Fall through to the local bridge default.
  }
  return godotPreviewDefaultEndpoint;
}

function readGodotPathSetting() {
  try {
    return localStorage.getItem(godotPreviewGodotPathStorageKey)?.trim() || "";
  } catch {
    return "";
  }
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

function godotBridgeCommandHint(godotPath: string) {
  const path = godotPath.trim();
  return path
    ? `tools\\run_godot_preview_bridge.bat "${path}"`
    : "tools\\run_godot_preview_bridge.bat";
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

function getProfileFaceCenter(profile: unknown, fallbackCenter: unknown): PointerPoint {
  const profileRecord = profile && typeof profile === "object" ? profile as ResourceRecord : {};
  const profileCenter = asArray<number>(profileRecord.center);
  const fallback = asArray<number>(fallbackCenter);
  return {
    x: clamp01Number(profileCenter[0] ?? fallback[0], 0.5),
    y: clamp01Number(profileCenter[1] ?? fallback[1], 0.5)
  };
}

function withProfileZoom(profile: ResourceRecord, zoom: unknown): ResourceRecord {
  return {
    ...profile,
    zoom: getProfileZoom(zoom)
  };
}

function withProfileOffset(profile: ResourceRecord, offset: PointerPoint): ResourceRecord {
  return {
    ...profile,
    offset: [round4Number(offset.x), round4Number(offset.y)]
  };
}

function profileCropSummary(profile: ResourceRecord) {
  const offset = getProfileOffset(profile);
  return `zoom ${getProfileZoom(profile.zoom).toFixed(1)} · offset ${offset.x.toFixed(3)},${offset.y.toFixed(3)}`;
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
  context.fillStyle = "#10141a";
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

  const spectrumPoint = {
    x: facePosition.x + offset.x * portraitEditorCanvasWidth,
    y: facePosition.y + offset.y * portraitEditorCanvasHeight
  };

  context.strokeStyle = "rgba(255, 255, 255, 0.42)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(facePosition.x + 0.5, 0);
  context.lineTo(facePosition.x + 0.5, portraitEditorCanvasHeight);
  context.moveTo(0, facePosition.y + 0.5);
  context.lineTo(portraitEditorCanvasWidth, facePosition.y + 0.5);
  context.stroke();

  context.strokeStyle = normalizeCanvasColor(nameColor, "#8fd8b8");
  context.lineWidth = 2;
  const span = portraitEditorCanvasWidth * 0.66;
  context.beginPath();
  context.moveTo(spectrumPoint.x - span * 0.5, spectrumPoint.y);
  context.lineTo(spectrumPoint.x + span * 0.5, spectrumPoint.y);
  context.stroke();

  context.fillStyle = normalizeCanvasColor(nameColor, "#8fd8b8");
  context.strokeStyle = "#10141a";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(spectrumPoint.x, spectrumPoint.y, 9, 0, Math.PI * 2);
  context.fill();
  context.stroke();
}

function drawSpectrumGrid(context: CanvasRenderingContext2D) {
  context.strokeStyle = "rgba(255, 255, 255, 0.07)";
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
  context.strokeStyle = "rgba(255, 255, 255, 0.06)";
  context.lineWidth = 1;
  for (let line = 0; line <= profileCropCanvasSize; line += 20) {
    context.beginPath();
    context.moveTo(line + 0.5, 0);
    context.lineTo(line + 0.5, profileCropCanvasSize);
    context.moveTo(0, line + 0.5);
    context.lineTo(profileCropCanvasSize, line + 0.5);
    context.stroke();
  }
}

function drawProfileCropGuides(context: CanvasRenderingContext2D, offset: PointerPoint) {
  const center = profileCropCanvasSize / 2;
  const anchor = profileCropAnchor(offset);
  context.strokeStyle = "rgba(126, 231, 216, 0.36)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(center + 0.5, 0);
  context.lineTo(center + 0.5, profileCropCanvasSize);
  context.moveTo(0, center + 0.5);
  context.lineTo(profileCropCanvasSize, center + 0.5);
  context.stroke();

  context.strokeStyle = "#7ee7d8";
  context.fillStyle = "rgba(126, 231, 216, 0.22)";
  context.beginPath();
  context.arc(anchor.x, anchor.y, 7, 0, Math.PI * 2);
  context.fill();
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

function getDialogueFirstTextPreview(dialogue: ResourceRecord | undefined) {
  if (!dialogue || dialogue.__load_error) return String(dialogue?.__load_error || "");
  const firstNode = asArray<ResourceRecord>(dialogue.nodes)[0] || asArray<ResourceRecord>(dialogue.statement_nodes)[0];
  if (!firstNode) return "";
  if (isCutsceneNode(firstNode)) return `cutscene ${getNodeCutsceneEditorValue(firstNode).image || ""}`.trim();
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

function buildNodeSelectOptions(nodes: ResourceRecord[], autoPrefix: string, characters: ResourceSummary[]): ResourceSummary[] {
  return nodes.map((node, index) => {
    const id = resolveNodeId(node, index, autoPrefix);
    const cutsceneMode = isCutsceneNode(node);
    const title = cutsceneMode
      ? `${id} · 컷씬`
      : `${id} · ${speakerLabel(node.speaker, characters)}`;
    return {
      id,
      title,
      subtitle: cutsceneMode ? cutsceneSummary(node) : getDialogueVisiblePreviewText(node.text).slice(0, 72),
      type: "dialogues"
    } as ResourceSummary;
  });
}

function normalizeJsonObject(value: unknown): ResourceRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ResourceRecord : {};
}

function normalizePortraitPositionValue(value: unknown) {
  const position = String(value || "center").trim();
  return ["left", "right", "center", "custom"].includes(position) ? position : "center";
}

function parseRichTextPreviewAst(text: string): RichTextAstNode[] {
  const root: RichTextAstNode[] = [];
  const stack: Array<{ tagName: string; children: RichTextAstNode[] }> = [{ tagName: "", children: root }];
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
          raw: `[${tagBody}]`
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
      closeRichTextPreviewTag(stack, tagName);
    } else {
      const span: RichTextAstNode = {
        type: "span",
        tagName,
        attrs: parseBbcodeAttributes(tagBody),
        children: []
      };
      stack[stack.length - 1].children.push(span);
      stack.push({ tagName, children: span.children });
    }
    index = closeIndex + 1;
  }

  flushBuffer();
  return root;
}

function renderRichTextNodes(nodes: RichTextAstNode[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => renderRichTextNode(node, `${keyPrefix}-${index}`));
}

function renderRichTextNode(node: RichTextAstNode, key: string): ReactNode {
  if (node.type === "text") {
    return <span key={key}>{node.text}</span>;
  }

  if (node.type === "event") {
    return renderRichTextEventMarker(node, key);
  }

  const presentation = getRichTextTagPresentation(node.tagName, node.attrs);
  const className = ["rich-text-token", ...presentation.classNames].filter(Boolean).join(" ");
  const children = isFontScaleGradientTag(node)
    ? renderFontScaleGradientNodes(node.children, node.attrs, `${key}-gradient`)
    : renderRichTextNodes(node.children, key);

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

function renderFontScaleGradientNodes(nodes: RichTextAstNode[], attrs: BbcodeAttributes, keyPrefix: string): ReactNode[] {
  const visibleCount = countRichTextVisibleCharacters(nodes);
  const cursor = { index: 0 };
  const from = normalizeDialogueFontScale(attrs.from, 1);
  const to = normalizeDialogueFontScale(attrs.to, 0.3);
  return nodes.flatMap((node, index) => renderFontScaleGradientNode(node, `${keyPrefix}-${index}`, cursor, visibleCount, from, to));
}

function renderFontScaleGradientNode(
  node: RichTextAstNode,
  key: string,
  cursor: { index: number },
  visibleCount: number,
  from: number,
  to: number
): ReactNode[] {
  if (node.type === "event") {
    return [renderRichTextEventMarker(node, key)];
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

  const presentation = getRichTextTagPresentation(node.tagName, node.attrs);
  const className = ["rich-text-token", ...presentation.classNames].filter(Boolean).join(" ");
  return [
    <span
      className={className}
      data-rich-text-note={presentation.dataNote}
      key={key}
      style={presentation.style}
      title={presentation.title}
    >
      {renderFontScaleGradientNodesWithCursor(node.children, `${key}-nested`, cursor, visibleCount, from, to)}
    </span>
  ];
}

function renderFontScaleGradientNodesWithCursor(
  nodes: RichTextAstNode[],
  keyPrefix: string,
  cursor: { index: number },
  visibleCount: number,
  from: number,
  to: number
): ReactNode[] {
  return nodes.flatMap((node, index) => renderFontScaleGradientNode(node, `${keyPrefix}-${index}`, cursor, visibleCount, from, to));
}

function renderRichTextEventMarker(node: Extract<RichTextAstNode, { type: "event" }>, key: string) {
  const note = formatEventAttrSummary(node.attrs);
  return (
    <span className="rich-text-event-marker" key={key} title={node.raw}>
      {eventTagLabel(node.tagName)}
      {note ? <small>{note}</small> : null}
    </span>
  );
}

function getRichTextTagPresentation(tagName: string, attrs: BbcodeAttributes): RichTextTagPresentation {
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
      style.color = resolveRichTextPreviewColor(attrs.value);
      break;
    case "bgcolor":
    case "fgcolor":
      style.backgroundColor = resolveRichTextPreviewColor(attrs.value);
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
      customStyle["--rich-text-outline-color"] = resolveRichTextPreviewColor(attrs.value) || "rgba(0, 0, 0, 0.9)";
      break;
    case "shake": {
      classNames.push("rich-text-motion", "rich-text-shake");
      const level = getBbcodeAttrNumber(attrs, "level", 5, 1, 12);
      const rate = getBbcodeAttrNumber(attrs, "rate", 20, 1, 40);
      customStyle["--rich-text-shake-level"] = `${level * 0.55}px`;
      style.animationDuration = `${Math.max(0.035, 1 / rate)}s`;
      break;
    }
    case "wave": {
      classNames.push("rich-text-motion", "rich-text-wave");
      const amp = getBbcodeAttrNumber(attrs, "amp", 28, 2, 60);
      const freq = getBbcodeAttrNumber(attrs, "freq", 5, 0.1, 12);
      customStyle["--rich-text-wave-amp"] = `${amp * 0.24}px`;
      style.animationDuration = `${Math.max(0.12, 1 / freq)}s`;
      break;
    }
    case "tornado": {
      classNames.push("rich-text-motion", "rich-text-tornado");
      const radius = getBbcodeAttrNumber(attrs, "radius", 10, 1, 30);
      const freq = getBbcodeAttrNumber(attrs, "freq", 1, 0.1, 6);
      customStyle["--rich-text-tornado-radius"] = `${radius * 0.45}px`;
      style.animationDuration = `${Math.max(0.12, 1 / freq)}s`;
      break;
    }
    case "pulse": {
      classNames.push("rich-text-motion", "rich-text-pulse");
      const freq = getBbcodeAttrNumber(attrs, "freq", 1, 0.1, 6);
      style.animationDuration = `${Math.max(0.2, 2 / freq)}s`;
      break;
    }
    case "fade":
      classNames.push("rich-text-fade");
      break;
    case "rainbow": {
      classNames.push("rich-text-motion", "rich-text-rainbow");
      const speed = Math.abs(getBbcodeAttrNumber(attrs, "speed", 1, -8, 8)) || 1;
      style.animationDuration = `${Math.max(0.2, 1 / speed)}s`;
      break;
    }
    case "grow": {
      classNames.push("rich-text-motion", "rich-text-grow");
      const from = getBbcodeAttrNumber(attrs, "from", 0.78, 0.2, 2);
      const to = getBbcodeAttrNumber(attrs, "to", 1.34, 0.2, 2.5);
      const duration = getBbcodeAttrNumber(attrs, "duration", 1.05, 0.1, 4);
      customStyle["--rich-text-grow-from"] = String(from);
      customStyle["--rich-text-grow-to"] = String(to);
      style.animationDuration = `${duration}s`;
      break;
    }
    case "blink": {
      classNames.push("rich-text-motion", "rich-text-blink");
      const frequency = getBbcodeAttrNumber(attrs, "freq", 3.4, 0.1, 12);
      const minAlpha = getBbcodeAttrNumber(attrs, "min", 0.14, 0, 1);
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

function closeRichTextPreviewTag(stack: Array<{ tagName: string; children: RichTextAstNode[] }>, tagName: string) {
  for (let index = stack.length - 1; index > 0; index -= 1) {
    if (stack[index].tagName === tagName) {
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
  return attrs.from !== undefined && attrs.to !== undefined;
}

function countRichTextVisibleCharacters(nodes: RichTextAstNode[]): number {
  return nodes.reduce((total, node) => {
    if (node.type === "text") return total + Array.from(node.text).length;
    if (node.type === "span") return total + countRichTextVisibleCharacters(node.children);
    return total;
  }, 0);
}

function resolveRichTextPreviewColor(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  return raw;
}

function formatEventAttrSummary(attrs: BbcodeAttributes) {
  for (const key of ["id", "path", "delay", "volume", "volume_db", "fade", "transition"]) {
    const value = attrs[key];
    if (typeof value === "string" && value.trim()) {
      return value.length > 28 ? `${value.slice(0, 27)}…` : value;
    }
  }
  return "";
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
    advance: "AUTO"
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
    ["auto", /\[(auto_next|auto_advance|advance)\b/i]
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
    auto: "자동"
  }[tag] || tag;
}

export default App;

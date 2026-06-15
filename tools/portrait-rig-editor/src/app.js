const canvas = document.querySelector("#stageCanvas");
const ctx = canvas.getContext("2d");

const elements = {
  characterSelect: document.querySelector("#characterSelect"),
  refreshCharacters: document.querySelector("#refreshCharacters"),
  newCharacter: document.querySelector("#newCharacter"),
  undoAction: document.querySelector("#undoAction"),
  redoAction: document.querySelector("#redoAction"),
  restoreDraft: document.querySelector("#restoreDraft"),
  savePortrait: document.querySelector("#savePortrait"),
  connectionStatus: document.querySelector("#connectionStatus"),
  characterName: document.querySelector("#characterName"),
  nameColor: document.querySelector("#nameColor"),
  portraitState: document.querySelector("#portraitState"),
  portraitStateSelect: document.querySelector("#portraitStateSelect"),
  faceCenterX: document.querySelector("#faceCenterX"),
  faceCenterY: document.querySelector("#faceCenterY"),
  profileZoom: document.querySelector("#profileZoom"),
  outputScale: document.querySelector("#outputScale"),
  loadPortraitRig: document.querySelector("#loadPortraitRig"),
  exportRig: document.querySelector("#exportRig"),
  importRig: document.querySelector("#importRig"),
  exportProjectBundle: document.querySelector("#exportProjectBundle"),
  importProjectBundle: document.querySelector("#importProjectBundle"),
  refreshRigValidation: document.querySelector("#refreshRigValidation"),
  rigValidation: document.querySelector("#rigValidation"),
  saveExpressionPreset: document.querySelector("#saveExpressionPreset"),
  autoExpressionPresets: document.querySelector("#autoExpressionPresets"),
  exportExpressionPresetJson: document.querySelector("#exportExpressionPresetJson"),
  importExpressionPresetJsonButton: document.querySelector("#importExpressionPresetJsonButton"),
  importExpressionPresetJson: document.querySelector("#importExpressionPresetJson"),
  exportExpressionPresets: document.querySelector("#exportExpressionPresets"),
  expressionGrid: document.querySelector("#expressionGrid"),
  motionClipSelect: document.querySelector("#motionClipSelect"),
  newMotionClip: document.querySelector("#newMotionClip"),
  renameMotionClip: document.querySelector("#renameMotionClip"),
  duplicateMotionClip: document.querySelector("#duplicateMotionClip"),
  deleteMotionClip: document.querySelector("#deleteMotionClip"),
  exportMotionClipJson: document.querySelector("#exportMotionClipJson"),
  exportAllMotionClipsJson: document.querySelector("#exportAllMotionClipsJson"),
  importMotionClipsButton: document.querySelector("#importMotionClipsButton"),
  importMotionClips: document.querySelector("#importMotionClips"),
  motionDuration: document.querySelector("#motionDuration"),
  motionTime: document.querySelector("#motionTime"),
  motionTimeLabel: document.querySelector("#motionTimeLabel"),
  motionOnionSkin: document.querySelector("#motionOnionSkin"),
  motionOnionStep: document.querySelector("#motionOnionStep"),
  autoIdleMotion: document.querySelector("#autoIdleMotion"),
  autoTalkMotion: document.querySelector("#autoTalkMotion"),
  autoVisemeMotion: document.querySelector("#autoVisemeMotion"),
  addMotionKey: document.querySelector("#addMotionKey"),
  pasteMotionKey: document.querySelector("#pasteMotionKey"),
  playMotion: document.querySelector("#playMotion"),
  stopMotion: document.querySelector("#stopMotion"),
  motionFrameCount: document.querySelector("#motionFrameCount"),
  exportCurrentMotionFrame: document.querySelector("#exportCurrentMotionFrame"),
  exportMotionFrames: document.querySelector("#exportMotionFrames"),
  exportAllMotionFrames: document.querySelector("#exportAllMotionFrames"),
  exportAdaptivePoseSet: document.querySelector("#exportAdaptivePoseSet"),
  exportDialogueMotionSet: document.querySelector("#exportDialogueMotionSet"),
  buildAdaptivePose: document.querySelector("#buildAdaptivePose"),
  dialoguePoseHint: document.querySelector("#dialoguePoseHint"),
  dialoguePoseText: document.querySelector("#dialoguePoseText"),
  dialoguePoseTextHints: document.querySelector("#dialoguePoseTextHints"),
  previewDialoguePoseHint: document.querySelector("#previewDialoguePoseHint"),
  previewDialogueTextPose: document.querySelector("#previewDialogueTextPose"),
  previewDialoguePosePrev: document.querySelector("#previewDialoguePosePrev"),
  previewDialoguePoseNext: document.querySelector("#previewDialoguePoseNext"),
  resetDialoguePosePreview: document.querySelector("#resetDialoguePosePreview"),
  dialoguePosePreviewStatus: document.querySelector("#dialoguePosePreviewStatus"),
  adaptivePoseIntensity: document.querySelector("#adaptivePoseIntensity"),
  adaptivePoseIntensityLabel: document.querySelector("#adaptivePoseIntensityLabel"),
  resetAdaptivePoseTuning: document.querySelector("#resetAdaptivePoseTuning"),
  adaptiveRigMap: document.querySelector("#adaptiveRigMap"),
  dialoguePoseFrameList: document.querySelector("#dialoguePoseFrameList"),
  motionTimeline: document.querySelector("#motionTimeline"),
  motionCurvePanel: document.querySelector("#motionCurvePanel"),
  motionKeyList: document.querySelector("#motionKeyList"),
  addPhysicsRule: document.querySelector("#addPhysicsRule"),
  autoPhysicsRules: document.querySelector("#autoPhysicsRules"),
  physicsEnabled: document.querySelector("#physicsEnabled"),
  physicsRuleList: document.querySelector("#physicsRuleList"),
  autoMotion: document.querySelector("#autoMotion"),
  stageFrame: document.querySelector(".stage-frame"),
  stageZoom: document.querySelector("#stageZoom"),
  stageZoomLabel: document.querySelector("#stageZoomLabel"),
  stageZoomFit: document.querySelector("#stageZoomFit"),
  showStageGrid: document.querySelector("#showStageGrid"),
  snapStageGrid: document.querySelector("#snapStageGrid"),
  stageGridSize: document.querySelector("#stageGridSize"),
  showHitAreas: document.querySelector("#showHitAreas"),
  addParameter: document.querySelector("#addParameter"),
  resetParams: document.querySelector("#resetParams"),
  parameterGrid: document.querySelector("#parameterGrid"),
  parameterInfluenceSelect: document.querySelector("#parameterInfluenceSelect"),
  parameterInfluencePanel: document.querySelector("#parameterInfluencePanel"),
  showParameterInfluence: document.querySelector("#showParameterInfluence"),
  addImagePart: document.querySelector("#addImagePart"),
  importLayerBundle: document.querySelector("#importLayerBundle"),
  exportLayerManifest: document.querySelector("#exportLayerManifest"),
  autoBindImageParts: document.querySelector("#autoBindImageParts"),
  autoPlaceImageParts: document.querySelector("#autoPlaceImageParts"),
  autoParentImageParts: document.querySelector("#autoParentImageParts"),
  autoVisibilityGates: document.querySelector("#autoVisibilityGates"),
  addDeformerGroup: document.querySelector("#addDeformerGroup"),
  autoDeformerGroups: document.querySelector("#autoDeformerGroups"),
  autoMeshImageParts: document.querySelector("#autoMeshImageParts"),
  autoDeformImageParts: document.querySelector("#autoDeformImageParts"),
  resetRig: document.querySelector("#resetRig"),
  layerList: document.querySelector("#layerList"),
  selectedLayerName: document.querySelector("#selectedLayerName"),
  layerControls: document.querySelector("#layerControls"),
  paletteControls: document.querySelector("#paletteControls"),
  toast: document.querySelector("#toast")
};

const koLabels = new Map([
  ["Loading", "불러오는 중"],
  ["Ready", "준비됨"],
  ["Error", "오류"],
  ["New Character", "새 캐릭터"],
  ["Custom state", "직접 입력 상태"],
  ["None", "없음"],
  ["Normal", "일반"],
  ["Multiply", "곱하기"],
  ["Screen", "스크린"],
  ["Overlay", "오버레이"],
  ["Darken", "어둡게"],
  ["Lighten", "밝게"],
  ["Add", "더하기"],
  ["Rectangle", "사각형"],
  ["Rounded Rect", "둥근 사각형"],
  ["Ellipse", "타원"],
  ["Linear", "선형"],
  ["Smooth", "부드럽게"],
  ["Ease In", "천천히 시작"],
  ["Ease Out", "천천히 끝"],
  ["Ease In Out", "부드러운 시작/끝"],
  ["Hold", "고정"],
  ["Generic", "일반"],
  ["Gaze X", "시선 X"],
  ["Gaze Y", "시선 Y"],
  ["Tilt", "기울기"],
  ["Eye Open", "눈 뜸"],
  ["Mouth Open", "입 열림"],
  ["Smile", "미소"],
  ["Brow", "눈썹"],
  ["Hair", "머리"],
  ["Breath", "호흡"],
  ["Body", "몸"],
  ["Prop", "소품"],
  ["Angle X", "좌우 각도"],
  ["Angle Y", "상하 각도"],
  ["Angle Z", "기울기"],
  ["Mouth", "입"],
  ["Hair Sway", "머리 흔들림"],
  ["Back Hair", "뒷머리"],
  ["Neck", "목"],
  ["Ears", "귀"],
  ["Head", "머리"],
  ["Blush", "홍조"],
  ["Eyes", "눈"],
  ["Brows", "눈썹"],
  ["Front Hair", "앞머리"],
  ["Highlights", "하이라이트"],
  ["Skin", "피부"],
  ["Outfit", "의상"],
  ["Line", "선"],
  ["Shadow", "그림자"],
  ["Highlight", "하이라이트"],
  ["Neutral", "기본"],
  ["Sad", "슬픔"],
  ["Surprise", "놀람"],
  ["Doubt", "의심"],
  ["Laugh", "웃음"],
  ["Happy", "기쁨"],
  ["Angry", "화남"],
  ["Surprised", "놀람"],
  ["Worried", "걱정"],
  ["Curious", "궁금함"],
  ["Talk", "말하기"],
  ["Blink", "깜빡임"],
  ["Saved", "저장됨"],
  ["Key", "키"],
  ["Delete", "삭제"],
  ["Apply", "적용"],
  ["Update", "갱신"],
  ["Copy", "복사"],
  ["Mirror", "미러"],
  ["Params", "파라미터"],
  ["No motion clips", "모션 클립 없음"],
  ["Not generated", "아직 생성되지 않음"],
  ["No pose frames", "포즈 프레임 없음"],
  ["Pose frames", "포즈 프레임"],
  ["No driven parameters", "구동되는 파라미터 없음"],
  ["Adaptive rig map", "적응형 리그 맵"],
  ["No keys", "키 없음"],
  ["No parameter curves", "파라미터 곡선 없음"],
  ["No keyed parameters", "키가 지정된 파라미터 없음"],
  ["No motion timeline", "모션 타임라인 없음"],
  ["No physics rules", "물리 규칙 없음"],
  ["Param", "파라미터"],
  ["Offset", "오프셋"],
  ["Amp", "진폭"],
  ["Hz", "Hz"],
  ["Phase", "위상"],
  ["Remove", "제거"],
  ["No parameter selected.", "선택한 파라미터가 없습니다."],
  ["Direct bindings", "직접 바인딩"],
  ["Visibility gates", "표시 게이트"],
  ["Transform keys", "트랜스폼 키"],
  ["Draw order", "그리기 순서"],
  ["Deformer groups", "디포머 그룹"],
  ["Mesh keys", "메시 키"],
  ["Stage parts", "스테이지 파츠"],
  ["Physics", "물리"],
  ["Motion clips", "모션 클립"],
  ["Deformer Groups", "디포머 그룹"],
  ["Image Parts", "이미지 파츠"],
  ["Clear", "해제"],
  ["Image Part", "이미지 파츠"],
  ["Deformer Group", "디포머 그룹"],
  ["Opacity", "불투명도"],
  ["Offset X", "오프셋 X"],
  ["Offset Y", "오프셋 Y"],
  ["Scale", "배율"],
  ["Scale X", "X 배율"],
  ["Scale Y", "Y 배율"],
  ["Rotation", "회전"],
  ["Color", "색상"],
  ["Name", "이름"],
  ["Lock canvas editing", "캔버스 편집 잠금"],
  ["Solo in preview", "미리보기 단독 표시"],
  ["Parent", "부모"],
  ["Slot", "슬롯"],
  ["Behind generated model", "생성 모델 뒤"],
  ["In front of generated model", "생성 모델 앞"],
  ["X", "X"],
  ["Y", "Y"],
  ["Anchor X", "앵커 X"],
  ["Anchor Y", "앵커 Y"],
  ["Blend Mode", "블렌드 모드"],
  ["Clip Shape", "클립 모양"],
  ["Clip Inset", "클립 안쪽 여백"],
  ["Clip Radius", "클립 반경"],
  ["Clip Part", "클립 파츠"],
  ["Use visibility gate", "표시 게이트 사용"],
  ["Gate Param", "게이트 파라미터"],
  ["Visible Min", "표시 최솟값"],
  ["Visible Max", "표시 최댓값"],
  ["Gate Fade", "게이트 페이드"],
  ["Hit Area", "히트 영역"],
  ["Use as hit area", "히트 영역으로 사용"],
  ["Hit Id", "히트 ID"],
  ["Hit ID", "히트 ID"],
  ["Hit Label", "히트 라벨"],
  ["Hit Kind", "히트 종류"],
  ["Face", "얼굴"],
  ["Hand", "손"],
  ["Lock canvas editing", "캔버스 편집 잠금"],
  ["Draw Order", "그리기 순서"],
  ["Blend", "블렌드"],
  ["Clip Mask", "클립 마스크"],
  ["Bind X", "X 바인딩"],
  ["Bind X Amt", "X 바인딩 양"],
  ["Bind Y", "Y 바인딩"],
  ["Bind Y Amt", "Y 바인딩 양"],
  ["Bind Rot", "회전 바인딩"],
  ["Bind Rot Amt", "회전 바인딩 양"],
  ["Bind Scale X", "X 배율 바인딩"],
  ["Bind Scale X Amt", "X 배율 바인딩 양"],
  ["Bind Scale Y", "Y 배율 바인딩"],
  ["Bind Scale Y Amt", "Y 배율 바인딩 양"],
  ["Bind Opacity", "불투명도 바인딩"],
  ["Bind Opacity Amt", "불투명도 바인딩 양"],
  ["Auto Bind from Name", "이름으로 자동 바인딩"],
  ["Auto Place from Name", "이름으로 자동 배치"],
  ["Auto Parent from Name", "이름으로 자동 부모"],
  ["Auto Gate from Name", "이름으로 자동 게이트"],
  ["Transform Keys", "트랜스폼 키"],
  ["Key Param", "키 파라미터"],
  ["Set Transform Key at Current Param", "현재 파라미터로 트랜스폼 키 설정"],
  ["Clear Transform Keys", "트랜스폼 키 지우기"],
  ["Draw Order Keys", "그리기 순서 키"],
  ["Order Key Param", "순서 키 파라미터"],
  ["Set Draw Order Key at Current Param", "현재 파라미터로 그리기 순서 키 설정"],
  ["Clear Draw Order Keys", "그리기 순서 키 지우기"],
  ["Mesh Deformer", "메시 디포머"],
  ["Auto Mesh from Name", "이름으로 자동 메시"],
  ["Auto Deform from Name", "이름으로 자동 변형"],
  ["Export Rig Template", "리그 템플릿 내보내기"],
  ["Import Rig Template", "리그 템플릿 가져오기"],
  ["Create 3 x 3 Mesh", "3 x 3 메시 만들기"],
  ["Columns", "열"],
  ["Rows", "행"],
  ["Edit vertices on canvas", "캔버스에서 정점 편집"],
  ["Mesh Key Param", "메시 키 파라미터"],
  ["Set Mesh Key at Current Param", "현재 파라미터로 메시 키 설정"],
  ["Clear Mesh Keys", "메시 키 지우기"],
  ["Reset Mesh Shape", "메시 형태 초기화"],
  ["Duplicate", "복제"],
  ["Mirror Duplicate", "미러 복제"],
  ["Remove Image Part", "이미지 파츠 제거"],
  ["Parent Deformer", "부모 디포머"],
  ["Enabled", "사용"],
  ["Warp Deformer", "워프 디포머"],
  ["Use warp grid", "워프 격자 사용"],
  ["Warp Width", "워프 너비"],
  ["Warp Height", "워프 높이"],
  ["Warp Columns", "워프 열"],
  ["Warp Rows", "워프 행"],
  ["Edit warp on canvas", "캔버스에서 워프 편집"],
  ["Fit Bounds", "경계에 맞춤"],
  ["Reset Warp", "워프 초기화"],
  ["Set Warp Key at Current Param", "현재 파라미터로 워프 키 설정"],
  ["Clear Warp Keys", "워프 키 지우기"],
  ["Affected Parts", "영향받는 파츠"],
  ["Select Visible", "보이는 파츠 선택"],
  ["Clear Parts", "파츠 선택 해제"],
  ["Group Transform Keys", "그룹 트랜스폼 키"],
  ["Set Group Key at Current Param", "현재 파라미터로 그룹 키 설정"],
  ["Clear Group Keys", "그룹 키 지우기"],
  ["Remove Deformer Group", "디포머 그룹 제거"],
  ["No image parts.", "이미지 파츠가 없습니다."],
  ["To Back", "맨 뒤로"],
  ["Down", "아래로"],
  ["Up", "위로"],
  ["To Front", "맨 앞으로"],
  ["Load", "불러오기"],
  ["Ready for export", "내보내기 준비됨"],
  ["No draft found.", "복원할 임시 저장본이 없습니다."],
  ["Create a motion clip first.", "먼저 모션 클립을 만들어 주세요."],
  ["Preset has no parameter values to key.", "키로 저장할 프리셋 파라미터 값이 없습니다."],
  ["No parameters available for auto presets.", "자동 프리셋에 사용할 파라미터가 없습니다."],
  ["No saved presets to export.", "내보낼 저장 프리셋이 없습니다."],
  ["No expression presets found in JSON.", "JSON에서 표정 프리셋을 찾지 못했습니다."],
  ["Select or create a character first.", "먼저 캐릭터를 선택하거나 만들어 주세요."],
  ["Add motion keys before exporting a pose.", "포즈를 내보내기 전에 모션 키를 추가해 주세요."],
  ["Add motion keys before exporting frames.", "프레임을 내보내기 전에 모션 키를 추가해 주세요."],
  ["Add motion keys before exporting clips.", "클립을 내보내기 전에 모션 키를 추가해 주세요."],
  ["Copy a motion key first.", "먼저 모션 키를 복사해 주세요."],
  ["No motion clips found in JSON.", "JSON에서 모션 클립을 찾지 못했습니다."],
  ["No adaptive pose frames to preview.", "미리볼 적응형 포즈 프레임이 없습니다."],
  ["Enter a dialogue line to preview.", "미리볼 대사를 입력해 주세요."],
  ["Add at least one motion key first.", "먼저 모션 키를 하나 이상 추가해 주세요."],
  ["No physics-ready parameters found.", "물리에 사용할 수 있는 파라미터를 찾지 못했습니다."],
  ["Adaptive pose tuning reset.", "적응형 포즈 튜닝을 초기화했습니다."],
  ["No image parts to bind.", "바인딩할 이미지 파츠가 없습니다."],
  ["No image parts to gate.", "표시 게이트를 적용할 이미지 파츠가 없습니다."],
  ["No image parts to place.", "배치할 이미지 파츠가 없습니다."],
  ["No image parts to parent.", "부모를 지정할 이미지 파츠가 없습니다."],
  ["No image parts to group.", "그룹화할 이미지 파츠가 없습니다."],
  ["No image parts to mesh.", "메시를 만들 이미지 파츠가 없습니다."],
  ["No image parts to deform.", "변형할 이미지 파츠가 없습니다."],
  ["No image-part rig template found.", "이미지 파츠 리그 템플릿을 찾지 못했습니다."],
  ["Solo preview cleared.", "단독 미리보기를 해제했습니다."],
  ["Select or create a character before importing a project.", "프로젝트를 가져오기 전에 캐릭터를 선택하거나 만들어 주세요."],
  ["No rig found in project bundle.", "프로젝트 번들에서 리그를 찾지 못했습니다."],
  ["Character created.", "캐릭터를 만들었습니다."],
  ["Adaptive pose tuning updated.", "적응형 포즈 튜닝을 갱신했습니다."],
  ["Export is blocked", "내보내기가 차단됨"],
  ["Export allowed with notes", "주의와 함께 내보내기 가능"],
  ["Export gates clear", "내보내기 조건 통과"],
  ["Rig", "리그"],
  ["Parts", "파츠"],
  ["Parameters", "파라미터"],
  ["Deformers", "디포머"],
  ["Motions", "모션"],
  ["Dialogue", "대화"],
  ["clean", "정상"],
  ["adaptive_pose missing", "adaptive_pose 없음"],
  ["adaptive/idle/talk/viseme ready", "적응형/대기/말하기/입모양 준비됨"]
]);

function ko(value) {
  const text = String(value ?? "");
  return koLabels.get(text) || text;
}

const initialQuery = new URLSearchParams(window.location.search);
const initialCharacterId = safeSegment(initialQuery.get("character") || "", "");
const initialPortraitState = safeSegment(initialQuery.get("portrait") || "default", "default");
elements.portraitState.value = initialPortraitState;

const parameterDefs = [
  { key: "angleX", label: "Angle X", min: -100, max: 100, step: 1, role: "gaze_x" },
  { key: "angleY", label: "Angle Y", min: -100, max: 100, step: 1, role: "gaze_y" },
  { key: "angleZ", label: "Angle Z", min: -45, max: 45, step: 1, role: "tilt" },
  { key: "eyeOpen", label: "Eye Open", min: 0, max: 100, step: 1, role: "eye_open" },
  { key: "mouthOpen", label: "Mouth", min: 0, max: 100, step: 1, role: "mouth_open" },
  { key: "smile", label: "Smile", min: -100, max: 100, step: 1, role: "smile" },
  { key: "brow", label: "Brow", min: -100, max: 100, step: 1, role: "brow" },
  { key: "hairSway", label: "Hair Sway", min: -100, max: 100, step: 1, role: "hair" },
  { key: "breath", label: "Breath", min: 0, max: 100, step: 1, role: "breath" }
];

const layerDefs = [
  { id: "backHair", label: "Back Hair", colorKey: "hair" },
  { id: "body", label: "Body", colorKey: "outfit" },
  { id: "neck", label: "Neck", colorKey: "skin" },
  { id: "ears", label: "Ears", colorKey: "skin" },
  { id: "head", label: "Head", colorKey: "skin" },
  { id: "blush", label: "Blush", colorKey: "blush" },
  { id: "eyes", label: "Eyes", colorKey: "eye" },
  { id: "brows", label: "Brows", colorKey: "hair" },
  { id: "mouth", label: "Mouth", colorKey: "mouth" },
  { id: "frontHair", label: "Front Hair", colorKey: "hair" },
  { id: "highlight", label: "Highlights", colorKey: "highlight" }
];

const paletteDefs = [
  ["skin", "Skin"],
  ["hair", "Hair"],
  ["eye", "Eyes"],
  ["outfit", "Outfit"],
  ["line", "Line"],
  ["shadow", "Shadow"],
  ["blush", "Blush"],
  ["mouth", "Mouth"],
  ["highlight", "Highlight"]
];

const imagePartBlendModes = [
  ["source-over", "Normal"],
  ["multiply", "Multiply"],
  ["screen", "Screen"],
  ["overlay", "Overlay"],
  ["darken", "Darken"],
  ["lighten", "Lighten"],
  ["lighter", "Add"]
];

const imagePartClipShapes = [
  ["none", "None"],
  ["rect", "Rectangle"],
  ["rounded", "Rounded Rect"],
  ["ellipse", "Ellipse"]
];

const imagePartTransformKeys = [
  ["x", "X"],
  ["y", "Y"],
  ["scaleX", "Scale X"],
  ["scaleY", "Scale Y"],
  ["rotation", "Rotation"],
  ["opacity", "Opacity"]
];

const imagePartBindingFields = [
  ["bindX", "bindXStrength", "x"],
  ["bindY", "bindYStrength", "y"],
  ["bindRotation", "bindRotationStrength", "rotation"],
  ["bindScaleX", "bindScaleXStrength", "scaleX"],
  ["bindScaleY", "bindScaleYStrength", "scaleY"],
  ["bindOpacity", "bindOpacityStrength", "opacity"]
];

const motionEasingOptions = [
  ["linear", "Linear"],
  ["smoothstep", "Smooth"],
  ["ease_in", "Ease In"],
  ["ease_out", "Ease Out"],
  ["ease_in_out", "Ease In Out"],
  ["hold", "Hold"]
];

const parameterRoleOptions = [
  ["generic", "Generic"],
  ["gaze_x", "Gaze X"],
  ["gaze_y", "Gaze Y"],
  ["tilt", "Tilt"],
  ["eye_open", "Eye Open"],
  ["mouth_open", "Mouth Open"],
  ["smile", "Smile"],
  ["brow", "Brow"],
  ["hair", "Hair"],
  ["breath", "Breath"],
  ["body", "Body"],
  ["prop", "Prop"]
];

const expressions = [
  { key: "neutral", label: "Neutral", params: { angleX: 0, angleY: 0, angleZ: 0, eyeOpen: 88, mouthOpen: 8, smile: 0, brow: 0 } },
  { key: "smile", label: "Smile", params: { angleX: 6, angleY: -4, angleZ: 2, eyeOpen: 84, mouthOpen: 22, smile: 72, brow: 20 } },
  { key: "sad", label: "Sad", params: { angleX: -8, angleY: 14, angleZ: -3, eyeOpen: 70, mouthOpen: 6, smile: -68, brow: -62 } },
  { key: "surprise", label: "Surprise", params: { angleX: 0, angleY: -12, angleZ: 0, eyeOpen: 100, mouthOpen: 72, smile: 4, brow: 74 } },
  { key: "doubt", label: "Doubt", params: { angleX: -18, angleY: 2, angleZ: -6, eyeOpen: 62, mouthOpen: 4, smile: -18, brow: 38 } },
  { key: "laugh", label: "Laugh", params: { angleX: 10, angleY: -8, angleZ: 5, eyeOpen: 34, mouthOpen: 58, smile: 100, brow: 24 } }
];

let characters = [];
let currentCharacter = null;
let rig = createDefaultRig();
let selectedLayerId = "frontHair";
let toastTimer = 0;
let animationFrame = 0;
let animationStartedAt = performance.now();
let motionPlaybackFrame = 0;
let motionPlaybackStartedAt = 0;
let motionPlaybackBaseTime = 0;
let motionKeyDragState = null;
let motionTimelineScrubState = null;
let motionKeyClipboard = null;
let dialoguePosePreviewIndex = -1;
let meshDragState = null;
let deformerGroupWarpDragState = null;
let imagePartTransformDragState = null;
let imagePartDragState = null;
let historyStack = [];
let redoStack = [];
let historySuspend = false;
let draftSaveTimer = 0;
let stageViewportZoom = 1;
let soloImagePartIds = new Set();
const imageCache = new Map();
const imageAlphaCache = new WeakMap();
const draftStorageKey = "blind-madeleine-portrait-rig-editor-draft";

function createDefaultRig(character = {}) {
  const layers = {};
  for (const layer of layerDefs) {
    layers[layer.id] = {
      visible: true,
      opacity: layer.id === "highlight" ? 0.38 : 1,
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      rotation: 0
    };
  }
  return {
    version: 1,
    app: "tools/portrait-rig-editor",
    canvas: { width: 900, height: 1400, transparent: true },
    character: {
      id: character.id || "",
      displayName: character.display_name || character.name || "New Character",
      nameColor: character.name_color || "#7DB7FF"
    },
    portrait: {
      state: initialPortraitState,
      center: [0.5, 0.18],
      profile: { zoom: 3, offset: [0, 0] }
    },
    palette: {
      skin: "#f1c9b7",
      hair: "#26384f",
      eye: "#79b7ff",
      outfit: "#315d94",
      line: "#142033",
      shadow: "#6f8bbb",
      blush: "#d891b4",
      mouth: "#7d4c70",
      highlight: "#ffffff"
    },
    params: defaultParams(),
    customParameters: [],
    layers,
    imageParts: [],
    deformerGroups: [],
    expressionPresets: [],
    motionClips: [],
    adaptivePose: defaultAdaptivePoseSettings(),
    physics: defaultPhysics()
  };
}

function defaultParams() {
  return {
    angleX: 0,
    angleY: 0,
    angleZ: 0,
    eyeOpen: 88,
    mouthOpen: 8,
    smile: 0,
    brow: 0,
    hairSway: 0,
    breath: 36
  };
}

function defaultPhysics() {
  return {
    enabled: true,
    rules: [
      { id: "breath_loop", label: "Breath", param: "breath", offset: 42, amplitude: 30, frequency: 0.286, phase: 0, enabled: true, autoGenerated: true, autoPhysicsKind: "breath" },
      { id: "hair_sway_loop", label: "Hair Sway", param: "hairSway", offset: 0, amplitude: 18, frequency: 0.183, phase: 0, enabled: true, autoGenerated: true, autoPhysicsKind: "hair" },
      { id: "angle_x_loop", label: "Angle X", param: "angleX", offset: 0, amplitude: 8, frequency: 0.115, phase: 0, enabled: true, autoGenerated: true, autoPhysicsKind: "gaze_x" }
    ]
  };
}

function defaultAdaptivePoseSettings() {
  return {
    intensity: 1,
    disabledParameters: []
  };
}

function allParameterDefs() {
  const seen = new Set(parameterDefs.map((param) => param.key));
  const custom = getCustomParameters()
    .filter((param) => {
      if (!param.key || seen.has(param.key)) return false;
      seen.add(param.key);
      return true;
    });
  return [...parameterDefs, ...custom];
}

function parameterDefinitionForKey(value) {
  const key = String(value || "");
  return allParameterDefs().find((param) => param.key === key) || null;
}

function getCustomParameters() {
  if (!Array.isArray(rig.customParameters)) rig.customParameters = [];
  rig.customParameters = normalizeCustomParameters(rig.customParameters);
  return rig.customParameters;
}

function normalizeCustomParameter(value) {
  const key = safeSegment(value?.key || value?.id || value?.label || "", "");
  if (!key) return { key: "", label: "", min: -100, max: 100, step: 1 };
  const label = String(value?.label || value?.name || key);
  const min = Number.isFinite(Number(value?.min)) ? Number(value.min) : -100;
  const max = Number.isFinite(Number(value?.max)) ? Number(value.max) : 100;
  return {
    key,
    label,
    min: Math.min(min, max),
    max: Math.max(min, max),
    step: Number.isFinite(Number(value?.step)) && Number(value.step) > 0 ? Number(value.step) : 1,
    role: normalizeParameterRole(value?.role || value?.semanticRole || value?.semantic_role || value?.kind) || inferParameterRoleFromText(`${key} ${label}`)
  };
}

function normalizeParameterRole(value) {
  const key = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!key) return "";
  const aliases = {
    angle_x: "gaze_x",
    look_x: "gaze_x",
    turn_x: "gaze_x",
    angle_y: "gaze_y",
    look_y: "gaze_y",
    angle_z: "tilt",
    roll: "tilt",
    eye: "eye_open",
    blink: "eye_open",
    mouth: "mouth_open",
    lip: "mouth_open",
    emotion: "smile",
    expression: "smile",
    eyebrow: "brow",
    sway: "hair",
    breathing: "breath",
    accessory: "prop",
    visibility: "prop",
    none: "generic"
  };
  const normalized = aliases[key] || key;
  return parameterRoleOptions.some(([candidate]) => candidate === normalized) ? normalized : "";
}

function inferParameterRoleFromText(value) {
  const text = String(value || "").toLowerCase().replace(/[^a-z0-9가-힣]+/g, " ");
  if (/\b(angle|look|gaze|turn|head|face|body)\s*x\b|\bx\s*(angle|look|gaze|turn)\b|좌우|왼쪽|오른쪽/.test(text)) return "gaze_x";
  if (/\b(angle|look|gaze|head|face|body)\s*y\b|\by\s*(angle|look|gaze)\b|상하|위|아래/.test(text)) return "gaze_y";
  if (/\b(angle|tilt|roll)\s*z\b|\bz\s*(angle|tilt|roll)\b|기울|회전/.test(text)) return "tilt";
  if (/eye|blink|lid|iris|pupil|눈|깜빡|동공/.test(text)) return "eye_open";
  if (/mouth|lip|jaw|talk|speak|phoneme|입|말|립싱크/.test(text)) return "mouth_open";
  if (/smile|happy|sad|laugh|frown|emotion|기쁨|웃|슬픔|감정/.test(text)) return "smile";
  if (/brow|eyebrow|angry|serious|worried|눈썹|화남|걱정/.test(text)) return "brow";
  if (/hair|bang|sway|strand|머리|헤어|흔들/.test(text)) return "hair";
  if (/breath|breathe|chest|숨|호흡/.test(text)) return "breath";
  if (/body|torso|shoulder|arm|hand|몸|상체|어깨|팔|손/.test(text)) return "body";
  if (/prop|item|accessory|weapon|tail|wing|소품|아이템|장식/.test(text)) return "prop";
  return "generic";
}

function parameterSemanticRole(param) {
  return normalizeParameterRole(param?.role || param?.semanticRole || param?.semantic_role || param?.kind)
    || inferParameterRoleFromText(`${param?.key || ""} ${param?.label || ""}`)
    || "generic";
}

function parameterRoleLabel(role) {
  const cleanRole = normalizeParameterRole(role) || "generic";
  return ko(parameterRoleOptions.find(([value]) => value === cleanRole)?.[1] || "Generic");
}

function normalized(value, max = 100) {
  return Math.max(-1, Math.min(1, Number(value || 0) / max));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}

async function requestJson(pathname, options = {}) {
  const response = await fetch(pathname, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message || `Request failed: ${response.status}`);
  }
  return body;
}

async function loadCharacters(selectId = "") {
  setStatus("Loading", "");
  const result = await requestJson("/api/characters");
  characters = result.characters || [];
  renderCharacterOptions(selectId);
  const nextId = selectId || elements.characterSelect.value || characters[0]?.id || "";
  if (nextId) {
    await loadCharacter(nextId);
  } else {
    currentCharacter = null;
    rig = createDefaultRig();
    syncFormFromRig();
    draw();
    resetHistory("empty");
  }
  setStatus("Ready", "ok");
}

async function loadCharacter(id) {
  if (!id) return;
  stopMotionPlayback(false);
  const result = await requestJson(`/api/characters/${encodeURIComponent(id)}`);
  currentCharacter = result.data;
  rig = createDefaultRig(currentCharacter);
  const requestedState = safeSegment(elements.portraitState.value || rig.portrait?.state || initialPortraitState || "default", "default");
  const modelPath = findSavedRigModelPath(currentCharacter, requestedState, true);
  if (modelPath) {
    try {
      rig = mergeImportedRig(await requestJson(resPathToRepoUrl(modelPath)));
      rig.portrait = {
        ...(rig.portrait || {}),
        state: requestedState
      };
    } catch (error) {
      showToast(`Saved rig could not be loaded: ${error.message}`);
    }
  }
  rig.character.id = currentCharacter.id || id;
  rig.character.displayName = currentCharacter.display_name || rig.character.displayName;
  rig.character.nameColor = currentCharacter.name_color || rig.character.nameColor;
  syncFormFromRig();
  updateUrlForSelection();
  draw();
  resetHistory("load");
}

function findSavedRigModelPath(character, preferredState = "", allowFallback = true) {
  const state = safeSegment(preferredState || elements.portraitState.value || "default", "default");
  const portraitRigMetadata = portraitRigMetadataFromCharacter(character);
  const portraits = portraitRigMetadata.portraits;
  if (portraits && typeof portraits === "object" && !Array.isArray(portraits)) {
    const preferred = modelPathFromPortraitRigPortrait(portraits[state]);
    if (preferred) return preferred;
    if (allowFallback) {
      const sourceModelPath = String(portraitRigMetadata.source_model_path || portraitRigMetadata.sourceModelPath || "").trim();
      if (sourceModelPath) return sourceModelPath;
      const defaultPath = modelPathFromPortraitRigPortrait(portraits.default);
      if (defaultPath) return defaultPath;
      for (const entry of Object.values(portraits)) {
        const modelPath = modelPathFromPortraitRigPortrait(entry);
        if (modelPath) return modelPath;
      }
    }
  }
  const frameSetStateModelPath = modelPathFromPortraitRigMotionFrameSets(portraitRigMetadata, state, false);
  if (frameSetStateModelPath) return frameSetStateModelPath;
  if (allowFallback) {
    const sourceModelPath = String(portraitRigMetadata.source_model_path || portraitRigMetadata.sourceModelPath || "").trim();
    if (sourceModelPath) return sourceModelPath;
    const fallbackFrameSetModelPath = modelPathFromPortraitRigMotionFrameSets(portraitRigMetadata, state, true);
    if (fallbackFrameSetModelPath) return fallbackFrameSetModelPath;
  }

  const characterPortraits = character?.portraits;
  if (characterPortraits && typeof characterPortraits === "object" && !Array.isArray(characterPortraits)) {
    const preferredEntry = characterPortraits[state];
    const preferredModelPath = modelPathFromPortraitRigPortrait(preferredEntry);
    if (preferredModelPath) return preferredModelPath;
    if (allowFallback) {
      for (const entry of Object.values(characterPortraits)) {
        const modelPath = modelPathFromPortraitRigPortrait(entry);
        if (modelPath) return modelPath;
      }
    }
  }
  return "";
}

function portraitRigMetadataFromCharacter(character) {
  const metadata = character?.metadata && typeof character.metadata === "object" && !Array.isArray(character.metadata)
    ? character.metadata
    : {};
  const source = metadata.portrait_rig ?? metadata.portraitRig;
  return source && typeof source === "object" && !Array.isArray(source) ? source : {};
}

function modelPathFromPortraitRigPortrait(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return "";
  return String(entry.model_path || entry.modelPath || entry.portrait_rig_model || entry.portraitRigModel || "").trim();
}

function modelPathFromPortraitRigMotionFrameSets(portraitRigMetadata, preferredState = "", allowFallback = false) {
  const states = portraitRigMotionFrameSetStates(portraitRigMetadata);
  const state = safeSegment(preferredState || "", "");
  if (state) {
    const preferred = states.find((entry) => entry.state === state);
    if (preferred?.modelPath) return preferred.modelPath;
  }
  if (!allowFallback) return "";
  const defaultState = states.find((entry) => entry.state === "default");
  if (defaultState?.modelPath) return defaultState.modelPath;
  return states.find((entry) => entry.modelPath)?.modelPath || "";
}

function portraitRigMotionFrameSetStates(portraitRigMetadata) {
  const frameSets = [
    ...(Array.isArray(portraitRigMetadata?.motion_frame_sets) ? portraitRigMetadata.motion_frame_sets : []),
    ...(Array.isArray(portraitRigMetadata?.motionFrameSets) ? portraitRigMetadata.motionFrameSets : [])
  ];
  const states = [];
  for (const frameSet of frameSets) {
    const sourceStates = Array.isArray(frameSet?.states) ? frameSet.states : [];
    for (const entry of sourceStates) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
      const state = safeSegment(entry.state || entry.key || "", "");
      if (!state) continue;
      states.push({
        state,
        modelPath: String(entry.model_path || entry.modelPath || entry.portrait_rig_model || entry.portraitRigModel || "").trim()
      });
    }
  }
  return states;
}

function resPathToRepoUrl(resPath) {
  const clean = String(resPath || "").replace(/^res:\/\//, "").replace(/^\/+/, "");
  if (!clean.startsWith("assets/")) throw new Error(`Unsupported rig path: ${resPath}`);
  return `/repo/assets/${clean.slice("assets/".length)}`;
}

function renderCharacterOptions(selectedId = "") {
  elements.characterSelect.innerHTML = "";
  for (const character of characters) {
    const option = document.createElement("option");
    option.value = character.id;
    option.textContent = `${character.title} (${character.portraitKeys.length})`;
    elements.characterSelect.append(option);
  }
  if (selectedId) elements.characterSelect.value = selectedId;
}

function portraitStateKeys(character = currentCharacter) {
  const keys = new Set();
  const portraits = character?.portraits && typeof character.portraits === "object" && !Array.isArray(character.portraits)
    ? character.portraits
    : {};
  for (const key of Object.keys(portraits)) keys.add(key);
  const portraitRigMetadata = portraitRigMetadataFromCharacter(character);
  const rigPortraits = portraitRigMetadata.portraits;
  if (rigPortraits && typeof rigPortraits === "object" && !Array.isArray(rigPortraits)) {
    for (const key of Object.keys(rigPortraits)) keys.add(key);
  }
  for (const entry of portraitRigMotionFrameSetStates(portraitRigMetadata)) {
    keys.add(entry.state);
  }
  const currentState = safeSegment(elements.portraitState?.value || rig.portrait?.state || initialPortraitState, "");
  if (currentState) keys.add(currentState);
  return Array.from(keys).sort((a, b) => a.localeCompare(b));
}

function renderPortraitStateOptions(selectedState = "") {
  if (!elements.portraitStateSelect) return;
  const state = safeSegment(selectedState || elements.portraitState.value || rig.portrait.state || "default", "default");
  const keys = portraitStateKeys();
  elements.portraitStateSelect.innerHTML = "";
  const custom = document.createElement("option");
  custom.value = "";
  custom.textContent = ko("Custom state");
  elements.portraitStateSelect.append(custom);
  for (const key of keys) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    elements.portraitStateSelect.append(option);
  }
  elements.portraitStateSelect.value = keys.includes(state) ? state : "";
}

function setStatus(text, className) {
  elements.connectionStatus.textContent = ko(text);
  elements.connectionStatus.className = `status-pill ${className || ""}`.trim();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = ko(message);
  elements.toast.classList.add("visible");
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 2800);
}

function updateUrlForSelection() {
  if (!currentCharacter?.id || !window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.set("character", currentCharacter.id);
  url.searchParams.set("portrait", rig.portrait.state || "default");
  window.history.replaceState(null, "", url);
}

function rigSnapshot() {
  return JSON.stringify(rig);
}

function cloneRigFromSnapshot(snapshot) {
  return JSON.parse(snapshot);
}

function resetHistory(label = "initial") {
  historyStack = [{ label, snapshot: rigSnapshot() }];
  redoStack = [];
  scheduleDraftSave();
  updateHistoryButtons();
  renderRigValidation();
}

function commitHistory(label = "change") {
  if (historySuspend) return;
  const snapshot = rigSnapshot();
  if (historyStack.length > 0 && historyStack[historyStack.length - 1].snapshot === snapshot) return;
  historyStack.push({ label, snapshot });
  if (historyStack.length > 80) historyStack.shift();
  redoStack = [];
  scheduleDraftSave();
  updateHistoryButtons();
  renderRigValidation();
}

function restoreRigSnapshot(snapshot, label = "restore") {
  stopMotionPlayback(false);
  historySuspend = true;
  rig = mergeImportedRig(cloneRigFromSnapshot(snapshot));
  syncFormFromRig();
  updateUrlForSelection();
  draw();
  historySuspend = false;
  scheduleDraftSave();
  updateHistoryButtons();
  renderRigValidation();
  if (label) showToast(label);
}

function undoRig() {
  if (historyStack.length <= 1) return;
  const current = historyStack.pop();
  if (current) redoStack.push(current);
  const previous = historyStack[historyStack.length - 1];
  restoreRigSnapshot(previous.snapshot, `Undo: ${current?.label || "change"}`);
}

function redoRig() {
  const next = redoStack.pop();
  if (!next) return;
  historyStack.push(next);
  restoreRigSnapshot(next.snapshot, `Redo: ${next.label || "change"}`);
}

function updateHistoryButtons() {
  elements.undoAction.disabled = historyStack.length <= 1;
  elements.redoAction.disabled = redoStack.length === 0;
  elements.restoreDraft.disabled = !readDraftEnvelope();
}

function scheduleDraftSave() {
  window.clearTimeout(draftSaveTimer);
  draftSaveTimer = window.setTimeout(saveDraftNow, 350);
}

function saveDraftNow() {
  try {
    localStorage.setItem(draftStorageKey, JSON.stringify({
      savedAt: new Date().toISOString(),
      characterId: currentCharacter?.id || "",
      rig
    }));
  } catch {
    // Draft persistence is best-effort.
  }
  updateHistoryButtons();
}

function readDraftEnvelope() {
  try {
    const raw = localStorage.getItem(draftStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.rig || typeof parsed.rig !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function restoreDraft() {
  const draft = readDraftEnvelope();
  if (!draft) {
    showToast("No draft found.");
    return;
  }
  stopMotionPlayback(false);
  rig = mergeImportedRig(draft.rig);
  if (currentCharacter?.id) rig.character.id = currentCharacter.id;
  syncFormFromRig();
  draw();
  resetHistory("draft restore");
  showToast(`Draft restored${draft.savedAt ? `: ${draft.savedAt}` : ""}`);
}

function syncFormFromRig() {
  elements.characterName.value = rig.character.displayName || "";
  elements.nameColor.value = rig.character.nameColor || "#7DB7FF";
  elements.portraitState.value = rig.portrait.state || "default";
  elements.faceCenterX.value = String(rig.portrait.center?.[0] ?? 0.5);
  elements.faceCenterY.value = String(rig.portrait.center?.[1] ?? 0.18);
  elements.profileZoom.value = String(rig.portrait.profile?.zoom ?? 3);
  renderPortraitStateOptions(rig.portrait.state || "default");
  renderParameterControls();
  renderLayerList();
  renderLayerControls();
  renderPaletteControls();
  renderExpressions();
  renderMotionControls();
  renderPhysicsControls();
  renderRigValidation();
}

function updateRigFromForm() {
  rig.character.displayName = elements.characterName.value.trim() || "New Character";
  rig.character.nameColor = elements.nameColor.value || "#7DB7FF";
  rig.portrait.state = safeSegment(elements.portraitState.value || "default", "default");
  rig.portrait.center = [
    clamp(elements.faceCenterX.value, 0, 1),
    clamp(elements.faceCenterY.value, 0, 1)
  ];
  rig.portrait.profile = {
    ...(rig.portrait.profile || {}),
    zoom: clamp(elements.profileZoom.value, 1, 8)
  };
}

function stageViewportFitScale() {
  const frame = elements.stageFrame;
  const frameRect = frame?.getBoundingClientRect?.();
  const frameWidth = Math.max(240, Number(frameRect?.width || 0) - 32);
  const frameHeight = Math.max(320, Number(frameRect?.height || 0) - 80);
  const canvasWidth = Math.max(1, Number(rig.canvas?.width || canvas.width || 900));
  const canvasHeight = Math.max(1, Number(rig.canvas?.height || canvas.height || 1400));
  return clamp(Math.min(frameWidth / canvasWidth, frameHeight / canvasHeight), 0.1, 2);
}

function applyStageViewportZoom() {
  const zoom = clamp(stageViewportZoom, 0.5, 2.5);
  stageViewportZoom = zoom;
  const fitScale = stageViewportFitScale();
  const displayWidth = Math.max(1, Math.round(Number(canvas.width || rig.canvas?.width || 900) * fitScale * zoom));
  const displayHeight = Math.max(1, Math.round(Number(canvas.height || rig.canvas?.height || 1400) * fitScale * zoom));
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;
  if (elements.stageZoom) elements.stageZoom.value = String(zoom);
  if (elements.stageZoomLabel) elements.stageZoomLabel.textContent = `${Math.round(zoom * 100)}%`;
}

function setStageViewportZoom(value, preserveScroll = true) {
  const frame = elements.stageFrame;
  const previousCenter = frame && preserveScroll
    ? {
        x: (frame.scrollLeft + frame.clientWidth * 0.5) / Math.max(1, frame.scrollWidth),
        y: (frame.scrollTop + frame.clientHeight * 0.5) / Math.max(1, frame.scrollHeight)
      }
    : null;
  stageViewportZoom = clamp(Number(value), 0.5, 2.5);
  applyStageViewportZoom();
  if (frame && previousCenter) {
    window.requestAnimationFrame(() => {
      frame.scrollLeft = Math.max(0, frame.scrollWidth * previousCenter.x - frame.clientWidth * 0.5);
      frame.scrollTop = Math.max(0, frame.scrollHeight * previousCenter.y - frame.clientHeight * 0.5);
    });
  }
}

function resetStageViewportZoom() {
  setStageViewportZoom(1, false);
  const frame = elements.stageFrame;
  if (frame) {
    window.requestAnimationFrame(() => {
      frame.scrollLeft = Math.max(0, (frame.scrollWidth - frame.clientWidth) * 0.5);
      frame.scrollTop = Math.max(0, (frame.scrollHeight - frame.clientHeight) * 0.5);
    });
  }
}

function handleStageViewportWheel(event) {
  if (!event.metaKey && !event.ctrlKey) return;
  event.preventDefault();
  const direction = event.deltaY > 0 ? -1 : 1;
  setStageViewportZoom(stageViewportZoom + direction * 0.1);
}

function stageGridSizeValue() {
  return Math.round(clamp(Number(elements.stageGridSize?.value || 50), 8, 200));
}

function shouldSnapToStageGrid(event = null) {
  const enabled = Boolean(elements.snapStageGrid?.checked);
  return event?.altKey ? !enabled : enabled;
}

function snapCanvasCoordinateToStageGrid(value) {
  const step = stageGridSizeValue();
  return Number((Math.round(Number(value || 0) / step) * step).toFixed(3));
}

function snapCanvasPointToStageGrid(point, event = null) {
  if (!shouldSnapToStageGrid(event)) return point;
  return {
    x: snapCanvasCoordinateToStageGrid(point.x),
    y: snapCanvasCoordinateToStageGrid(point.y)
  };
}

function snapWorldTransformToStageGrid(transform, event = null) {
  const snapped = snapCanvasPointToStageGrid({ x: transform.x, y: transform.y }, event);
  return {
    ...transform,
    x: snapped.x,
    y: snapped.y
  };
}

function renderRigValidation() {
  if (!elements.rigValidation) return;
  const issues = validateRigForExport();
  const report = buildRigQualityReport(issues);
  elements.rigValidation.innerHTML = "";
  const summary = document.createElement("div");
  summary.className = `validation-summary ${issues.some((issue) => issue.severity === "error") ? "error" : issues.length > 0 ? "warn" : "ok"}`;
  summary.textContent = issues.length === 0
    ? ko("Ready for export")
    : `${issues.filter((issue) => issue.severity === "error").length} 오류 · ${issues.filter((issue) => issue.severity === "warning").length} 경고`;
  elements.rigValidation.append(summary);
  elements.rigValidation.append(renderRigQualityReport(report));
  if (issues.length === 0) return;
  const list = document.createElement("div");
  list.className = "validation-list";
  for (const issue of issues.slice(0, 12)) {
    const row = document.createElement("div");
    row.className = `validation-row ${issue.severity}`;
    row.textContent = issue.message;
    list.append(row);
  }
  if (issues.length > 12) {
    const more = document.createElement("div");
    more.className = "validation-row warning";
    more.textContent = `${issues.length - 12}개 항목 더 있음`;
    list.append(more);
  }
  elements.rigValidation.append(list);
}

function renderRigQualityReport(report) {
  const grid = document.createElement("div");
  grid.className = "rig-quality-grid";
  for (const metric of report.metrics) {
    const card = document.createElement("div");
    card.className = `rig-quality-card ${metric.status || "neutral"}`;
    const label = document.createElement("span");
    label.className = "rig-quality-label";
    label.textContent = ko(metric.label);
    const value = document.createElement("strong");
    value.textContent = ko(metric.value);
    const detail = document.createElement("span");
    detail.className = "rig-quality-detail";
    detail.textContent = ko(metric.detail);
    card.append(label, value, detail);
    grid.append(card);
  }
  return grid;
}

function buildRigQualityReport(issues = []) {
  const parts = getImageParts();
  const groups = getDeformerGroups();
  const clips = getMotionClips();
  const issueErrors = issues.filter((issue) => issue.severity === "error").length;
  const issueWarnings = issues.filter((issue) => issue.severity === "warning").length;
  const boundParts = parts.filter((part) => imagePartHasRigBehavior(part)).length;
  const visibleParts = parts.filter((part) => part.visible !== false).length;
  const meshParts = parts.filter((part) => part.mesh?.enabled).length;
  const gatedParts = parts.filter((part) => normalizeImagePartVisibilityGate(part).enabled).length;
  const hitAreas = parts.filter((part) => normalizeImagePartHitArea(part).enabled).length;
  const warpGroups = groups.filter((group) => normalizeDeformerGroupWarp(group.warp || {}, group, rig).enabled).length;
  const nestedGroups = groups.filter((group) => normalizeDeformerGroupParentId(group.parentGroupId || group.parent || group.parentId, group.id)).length;
  const adaptiveClip = clips.find((clip) => clip.id === "adaptive_pose") || null;
  const adaptiveFrameCount = adaptiveClip ? recommendedMotionFrameCount(adaptiveClip) : 0;
  const adaptiveTagCount = adaptiveClip ? adaptivePoseTagDiversity(adaptiveClip) : 0;
  const keyedClips = clips.filter((clip) => Array.isArray(clip.keyframes) && clip.keyframes.length > 0).length;
  const dialogueReadiness = dialogueMotionClipReadiness(clips);
  const drivenParameters = adaptiveRigInfluenceMap().size;
  const totalParameters = allParameterDefs().length;

  return {
    metrics: [
      {
        label: "Rig",
        value: issueErrors > 0 ? `${issueErrors} errors` : (issueWarnings > 0 ? `${issueWarnings} warnings` : "clean"),
        detail: issueErrors > 0 ? "Export is blocked" : (issueWarnings > 0 ? "Export allowed with notes" : "Export gates clear"),
        status: issueErrors > 0 ? "error" : (issueWarnings > 0 ? "warn" : "ok")
      },
      {
        label: "Parts",
        value: `${visibleParts}/${parts.length}`,
        detail: `${boundParts} rigged · ${meshParts} mesh · ${gatedParts} gated · ${hitAreas} hit`,
        status: parts.length === 0 ? "warn" : (boundParts > 0 || groups.length > 0 ? "ok" : "warn")
      },
      {
        label: "Parameters",
        value: `${drivenParameters}/${totalParameters}`,
        detail: `${getCustomParameters().length} custom · ${adaptivePoseParameterPlan().filter((entry) => entry.enabled).length} adaptive`,
        status: drivenParameters > 0 ? "ok" : "warn"
      },
      {
        label: "Deformers",
        value: `${groups.length}`,
        detail: `${warpGroups} warp · ${nestedGroups} nested`,
        status: groups.length > 0 || meshParts > 0 ? "ok" : "warn"
      },
      {
        label: "Motions",
        value: `${keyedClips}/${clips.length}`,
        detail: adaptiveClip ? `adaptive ${adaptiveFrameCount} frames · ${adaptiveTagCount} tags` : "adaptive_pose missing",
        status: adaptiveClip && adaptiveFrameCount >= 4 && adaptiveTagCount >= 3 ? "ok" : "warn"
      },
      {
        label: "Dialogue",
        value: `${dialogueReadiness.readyCount}/4`,
        detail: dialogueReadiness.missing.length > 0 ? `missing ${dialogueReadiness.missing.join(", ")}` : "adaptive/idle/talk/viseme ready",
        status: dialogueReadiness.missing.length === 0 ? "ok" : "warn"
      }
    ]
  };
}

function imagePartHasRigBehavior(part) {
  if (!part) return false;
  for (const [field, strengthField] of imagePartBindingFields) {
    if (knownParameterKey(part[field]) && Math.abs(Number(part[strengthField] || 0)) > 0.0001) return true;
  }
  if (normalizeImagePartVisibilityGate(part).enabled) return true;
  if (Array.isArray(part.transformDeformers) && part.transformDeformers.length > 0) return true;
  if (Array.isArray(part.drawOrderDeformers) && part.drawOrderDeformers.length > 0) return true;
  if (part.mesh?.enabled) return true;
  if (normalizeImagePartHitArea(part).enabled) return true;
  return false;
}

function adaptivePoseTagDiversity(clip) {
  if (!clip || !Array.isArray(clip.keyframes) || clip.keyframes.length === 0) return 0;
  const frameTimes = motionFrameTimesForClip(clip, recommendedMotionFrameCount(clip));
  const tags = new Set();
  for (const time of frameTimes) {
    const metadata = semanticPoseMetadata(interpolatedMotionParams(clip, time), clip, time);
    for (const tag of metadata.poseTags || []) tags.add(tag);
  }
  return tags.size;
}

function dialogueMotionClipReadiness(clips = getMotionClips()) {
  const ids = new Set(clips.map((clip) => clip.id));
  const required = ["adaptive_pose", "idle_loop", "talk_loop", "viseme_set"];
  const missing = required.filter((id) => !ids.has(id));
  return {
    missing,
    readyCount: required.length - missing.length
  };
}

function validateRigForExport() {
  const issues = [];
  const add = (severity, message) => issues.push({ severity, message });
  const state = safeSegment(elements.portraitState?.value || rig.portrait?.state || "", "");
  if (!currentCharacter?.id) add("warning", "No character selected.");
  if (!state) add("error", "Portrait state is empty.");
  const parts = getImageParts();
  const partIds = new Set(parts.map((part) => part.id));
  const paramKeys = new Set(allParameterDefs().map((param) => param.key));
  addDuplicateIdIssues(add, "Image part", parts, (part) => part.id);
  addDuplicateIdIssues(add, "Deformer group", getDeformerGroups(), (group) => group.id);
  addDuplicateIdIssues(add, "Custom parameter", getCustomParameters(), (param) => param.key);
  addDuplicateIdIssues(add, "Motion clip", getMotionClips(), (clip) => clip.id);
  addDuplicateIdIssues(add, "Physics rule", getPhysics().rules, (rule) => rule.id);
  addDuplicateIdIssues(add, "Expression preset", getExpressionPresets(), (preset) => preset.id);
  addDuplicateIdIssues(
    add,
    "Hit area",
    parts.filter((part) => part.hitArea?.enabled),
    (part) => normalizeImagePartHitArea(part).id
  );

  parts.forEach((part) => {
    const label = part.label || part.id;
    if (!part.id) add("error", "Image part has no id.");
    if (!String(part.path || "").startsWith("res://assets/")) add("error", `${label}: image path must be a res://assets path.`);
    for (const key of ["bindX", "bindY", "bindRotation", "bindScaleX", "bindScaleY", "bindOpacity"]) {
      if (part[key] && !paramKeys.has(part[key])) add("error", `${label}: ${key} references missing parameter ${part[key]}.`);
    }
    if (part.parentPartId && !partIds.has(part.parentPartId)) add("error", `${label}: parent part is missing.`);
    if (part.clipPartId && !partIds.has(part.clipPartId)) add("error", `${label}: clip mask part is missing.`);
    if (imagePartParentCreatesCycle(parts, part)) add("error", `${label}: parent chain contains a cycle.`);
    const visibilityGate = normalizeImagePartVisibilityGate(part);
    if (visibilityGate.enabled) {
      if (!paramKeys.has(visibilityGate.parameter)) add("error", `${label}: visibility gate references missing parameter ${visibilityGate.parameter}.`);
      if (!Number.isFinite(Number(visibilityGate.min)) || !Number.isFinite(Number(visibilityGate.max))) add("error", `${label}: visibility gate range is invalid.`);
      if (!Number.isFinite(Number(visibilityGate.fade)) || Number(visibilityGate.fade) < 0) add("error", `${label}: visibility gate fade is invalid.`);
    }
    if (part.mesh?.enabled) {
      const columns = Math.round(clamp(part.mesh.columns || 3, 2, 8));
      const rows = Math.round(clamp(part.mesh.rows || 3, 2, 8));
      const expected = columns * rows;
      if (!Array.isArray(part.mesh.vertices) || part.mesh.vertices.length !== expected) {
        add("error", `${label}: mesh vertex count does not match ${columns} x ${rows}.`);
      }
      for (const deformer of part.mesh.deformers || []) {
        if (!paramKeys.has(deformer.parameter)) add("error", `${label}: mesh deformer references missing parameter ${deformer.parameter}.`);
      }
    }
    for (const deformer of part.transformDeformers || []) {
      if (!paramKeys.has(deformer.parameter)) add("error", `${label}: transform key references missing parameter ${deformer.parameter}.`);
    }
    for (const deformer of part.drawOrderDeformers || []) {
      if (!paramKeys.has(deformer.parameter)) add("error", `${label}: draw order key references missing parameter ${deformer.parameter}.`);
      for (const keyframe of deformer.keyframes || []) {
        if (!Number.isFinite(Number(keyframe.value))) add("error", `${label}: draw order key value is invalid.`);
        if (!Number.isFinite(Number(keyframe.order))) add("error", `${label}: draw order key order is invalid.`);
      }
    }
    if (part.hitArea?.enabled) {
      if (!part.hitArea.id) add("error", `${label}: hit area id is empty.`);
      if (!part.hitArea.label) add("warning", `${label}: hit area label is empty.`);
    }
  });

  for (const group of getDeformerGroups()) {
    const label = group.label || group.id;
    if (!group.id) add("error", "Deformer group has no id.");
    if (!paramKeys.has(group.parameter)) add("error", `${label}: deformer group references missing parameter ${group.parameter}.`);
    if (group.parentGroupId && !getDeformerGroups().some((entry) => entry.id === group.parentGroupId)) {
      add("error", `${label}: parent deformer group is missing.`);
    }
    if (deformerGroupParentCreatesCycle(getDeformerGroups(), group)) {
      add("error", `${label}: parent deformer chain contains a cycle.`);
    }
    const partIds = normalizeDeformerGroupPartIds(group);
    if (partIds.length === 0) add("warning", `${label}: deformer group affects no image parts.`);
    for (const keyframe of group.keyframes || []) {
      if (!Number.isFinite(Number(keyframe.value))) add("error", `${label}: deformer key value is invalid.`);
      if (!keyframe.transform || typeof keyframe.transform !== "object") add("error", `${label}: deformer key has no transform.`);
    }
    const warp = normalizeDeformerGroupWarp(group.warp || {}, group, rig);
    if (warp.enabled) {
      if (!Array.isArray(warp.vertices) || warp.vertices.length !== warp.columns * warp.rows) {
        add("error", `${label}: warp vertex count does not match ${warp.columns} x ${warp.rows}.`);
      }
      for (const keyframe of warp.keyframes || []) {
        if (!Number.isFinite(Number(keyframe.value))) add("error", `${label}: warp key value is invalid.`);
        if (!Array.isArray(keyframe.vertices) || keyframe.vertices.length !== warp.columns * warp.rows) {
          add("error", `${label}: warp key vertex count does not match ${warp.columns} x ${warp.rows}.`);
        }
      }
    }
  }

  for (const clip of getMotionClips()) {
    if (!clip.keyframes.length) add("warning", `${clip.label || clip.id}: motion clip has no keyframes.`);
    if (Number(clip.duration || 0) <= 0) add("error", `${clip.label || clip.id}: motion duration must be positive.`);
  }
  validateRuntimePoseReadiness(add);

  for (const rule of getPhysics().rules) {
    if (!paramKeys.has(rule.param)) add("error", `${rule.label || rule.id}: physics rule references missing parameter ${rule.param}.`);
  }

  return issues;
}

function addDuplicateIdIssues(add, label, entries, getId) {
  const seen = new Set();
  const duplicates = new Set();
  for (const entry of Array.isArray(entries) ? entries : []) {
    const id = safeSegment(getId(entry), "");
    if (!id) continue;
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  for (const id of duplicates) {
    add("error", `${label} id is duplicated: ${id}.`);
  }
}

function validateRuntimePoseReadiness(add) {
  const clips = getMotionClips();
  const adaptiveClip = clips.find((clip) => clip.id === "adaptive_pose") || null;
  const plan = adaptivePoseParameterPlan();
  const hasDrivenAdaptiveParams = plan.some((entry) => entry.enabled && entry.totalAmplitude > 0);
  if (clips.length === 0) {
    add("warning", "No motion clips: game dialogue will use only the static portrait.");
    return;
  }
  const dialogueReadiness = dialogueMotionClipReadiness(clips);
  if (dialogueReadiness.missing.length > 0) {
    add("warning", `Export Dialogue Set before game testing: missing ${dialogueReadiness.missing.join(", ")}.`);
  }
  if (!adaptiveClip) {
    if (hasDrivenAdaptiveParams) {
      add("warning", "Build adaptive_pose before exporting dialogue poses: driven rig parameters are available but no adaptive clip exists.");
    }
    return;
  }

  if (plan.length > 0 && !plan.some((entry) => entry.enabled)) {
    add("warning", "All adaptive pose parameters are disabled.");
  }
  if (adaptiveClip.keyframes.length < 2) {
    add("warning", "adaptive_pose needs at least two keyframes for dialogue pose cycling.");
    return;
  }

  const frameCount = recommendedMotionFrameCount(adaptiveClip);
  const frameTimes = motionFrameTimesForClip(adaptiveClip, frameCount);
  if (frameTimes.length < 4) {
    add("warning", "adaptive_pose exports fewer than four frames; dialogue pose variation may repeat too quickly.");
  }

  const metadataByFrame = frameTimes.map((time) => {
    const params = interpolatedMotionParams(adaptiveClip, time);
    return semanticPoseMetadata(params, adaptiveClip, time);
  });
  const poseTags = new Set(metadataByFrame.flatMap((metadata) => metadata.poseTags || []));
  if (poseTags.size < 3) {
    add("warning", "adaptive_pose has low pose tag diversity; add stronger keys or tune Pose energy before dialogue export.");
  }

  const weakHints = [];
  for (const hint of ["happy", "sad", "angry", "curious", "worried", "surprised", "talk", "blink", "motion"]) {
    const bestScore = Math.max(...metadataByFrame.map((metadata, index) => dialoguePoseHintScore(metadata, hint, index, -1)));
    if (!Number.isFinite(bestScore) || bestScore < 0.35) weakHints.push(hint);
  }
  if (weakHints.length > 0) {
    add("warning", `adaptive_pose has weak hint matches for ${weakHints.slice(0, 4).join(", ")}${weakHints.length > 4 ? ", ..." : ""}.`);
  }
}

function ensureRigCanExport(actionLabel = "export") {
  updateRigFromForm();
  const issues = validateRigForExport();
  renderRigValidation();
  const errors = issues.filter((issue) => issue.severity === "error");
  if (errors.length === 0) return true;
  showToast(`Fix ${errors.length} rig error${errors.length === 1 ? "" : "s"} before ${actionLabel}.`);
  return false;
}

function safeSegment(value, fallback = "asset") {
  const clean = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return clean || fallback;
}

function assetUrlFromResPath(resPath) {
  const clean = String(resPath || "").replace(/^res:\/\//, "").replace(/^\/+/, "");
  if (!clean.startsWith("assets/")) return "";
  return `/repo/assets/${clean.slice("assets/".length)}`;
}

function imageForPath(resPath) {
  const url = assetUrlFromResPath(resPath);
  if (!url) return null;
  if (imageCache.has(url)) return imageCache.get(url);
  const image = new Image();
  image.onload = () => draw();
  image.onerror = () => showToast(`Image could not be loaded: ${resPath}`);
  image.src = url;
  imageCache.set(url, image);
  return image;
}

async function preloadRigImages(sourceRig) {
  const parts = Array.isArray(sourceRig.imageParts) ? sourceRig.imageParts : [];
  await Promise.all(parts.map((part) => new Promise((resolve) => {
    const image = imageForPath(part.path);
    if (!image || image.complete) {
      resolve();
      return;
    }
    const settle = () => resolve();
    image.addEventListener("load", settle, { once: true });
    image.addEventListener("error", settle, { once: true });
  })));
}

function renderExpressions() {
  elements.expressionGrid.innerHTML = "";
  for (const expression of expressions) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = ko(expression.label);
    button.addEventListener("click", () => {
      applyExpressionPreset(expression);
      commitHistory(`expression ${expression.label}`);
    });
    elements.expressionGrid.append(button);
  }
  const presets = getExpressionPresets();
  if (presets.length > 0) {
    const heading = document.createElement("div");
    heading.className = "expression-group-title";
    heading.textContent = ko("Saved");
    elements.expressionGrid.append(heading);
  }
  for (const preset of presets) {
    const wrapper = document.createElement("div");
    wrapper.className = "expression-preset-row";
    const applyButton = document.createElement("button");
    applyButton.type = "button";
    applyButton.textContent = ko(preset.label || preset.id);
    applyButton.addEventListener("click", () => {
      applyExpressionPreset(preset);
      commitHistory(`preset ${preset.label || preset.id}`);
    });
    const keyButton = document.createElement("button");
    keyButton.type = "button";
    keyButton.textContent = ko("Key");
    keyButton.addEventListener("click", () => keyExpressionPresetAtCurrentTime(preset));
    const deleteButton = document.createElement("button");
    deleteButton.className = "expression-delete";
    deleteButton.type = "button";
    deleteButton.textContent = ko("Delete");
    deleteButton.addEventListener("click", () => {
      rig.expressionPresets = getExpressionPresets().filter((entry) => entry.id !== preset.id);
      renderExpressions();
      commitHistory(`delete preset ${preset.label || preset.id}`);
      showToast(`Preset deleted: ${preset.label || preset.id}`);
    });
    wrapper.append(applyButton, keyButton, deleteButton);
    elements.expressionGrid.append(wrapper);
  }
}

function getExpressionPresets() {
  if (!Array.isArray(rig.expressionPresets)) rig.expressionPresets = [];
  return rig.expressionPresets;
}

function applyExpressionPreset(preset) {
  rig.params = { ...rig.params, ...(preset.params || {}) };
  applyPresetMeshesToParts(getImageParts(), preset);
  renderParameterControls();
  renderLayerControls();
  draw();
}

function keyExpressionPresetAtCurrentTime(preset) {
  const clip = activeMotionClip();
  if (!clip) {
    showToast("Create a motion clip first.");
    return;
  }
  const params = normalizePresetParams(preset?.params || {});
  if (Object.keys(params).length === 0) {
    showToast("Preset has no parameter values to key.");
    return;
  }
  const time = Number(clamp(elements.motionTime.value || 0, 0, clip.duration).toFixed(3));
  upsertMotionKeyframe(clip, {
    time,
    easing: "smoothstep",
    params
  });
  renderMotionControls(clip.id);
  setMotionTime(time, true, clip);
  commitHistory(`key expression preset ${preset.label || preset.id || clip.id}`);
  showToast(`Keyed ${preset.label || preset.id || "preset"} at ${formatMotionTime(time)}.`);
}

function applyPresetMeshesToParts(parts, preset) {
  if (!Array.isArray(preset.meshes)) return;
  for (const meshSnapshot of preset.meshes) {
    const part = parts.find((entry) => entry.id === meshSnapshot.partId);
    if (!part?.mesh?.enabled) continue;
    const mesh = normalizePartMesh(part);
    if (!Array.isArray(meshSnapshot.vertices) || meshSnapshot.vertices.length !== mesh.vertices.length) continue;
    mesh.vertices = mesh.vertices.map((vertex, index) => ({
      ...vertex,
      dx: Number.isFinite(Number(meshSnapshot.vertices[index]?.dx)) ? Number(meshSnapshot.vertices[index].dx) : Number(vertex.dx || 0),
      dy: Number.isFinite(Number(meshSnapshot.vertices[index]?.dy)) ? Number(meshSnapshot.vertices[index].dy) : Number(vertex.dy || 0)
    }));
  }
}

function saveCurrentExpressionPreset() {
  const label = window.prompt("프리셋 이름", "새 표정");
  if (label === null) return;
  const cleanLabel = label.trim() || "새 표정";
  const id = safeSegment(cleanLabel, "expression");
  const preset = {
    id: uniqueExpressionPresetId(id),
    label: cleanLabel,
    params: snapshotParams(),
    meshes: snapshotMeshVertices()
  };
  rig.expressionPresets = [...getExpressionPresets(), preset];
  renderExpressions();
  commitHistory(`save preset ${cleanLabel}`);
  showToast(`Preset saved: ${cleanLabel}`);
}

function autoExpressionPresets({ confirmReplace = true } = {}) {
  const generated = buildAutoExpressionPresets();
  if (generated.length === 0) {
    showToast("No parameters available for auto presets.");
    return;
  }
  const existing = getExpressionPresets();
  const replaceCount = existing.filter(isAutoExpressionPreset).length;
  if (confirmReplace && replaceCount > 0 && !window.confirm(`자동 생성 표정 프리셋 ${replaceCount}개를 교체할까요? 수동 프리셋은 유지됩니다.`)) {
    return;
  }
  const manualPresets = existing.filter((preset) => !isAutoExpressionPreset(preset));
  const nextPresets = [...manualPresets];
  for (const preset of generated) {
    nextPresets.push({
      ...preset,
      id: uniqueExpressionPresetId(preset.id, nextPresets)
    });
  }
  rig.expressionPresets = nextPresets;
  renderExpressions();
  renderRigValidation();
  commitHistory("auto expression presets");
  showToast(`Auto expression presets generated: ${generated.length}.`);
}

function buildAutoExpressionPresets() {
  const templates = autoExpressionPresetTemplates();
  return templates.map((template) => ({
    id: safeSegment(template.id, "expression"),
    label: template.label,
    params: autoExpressionParams(template),
    meshes: [],
    autoGenerated: true,
    autoExpressionKind: template.id,
    poseTags: template.poseTags
  }));
}

function autoExpressionPresetTemplates() {
  return [
    { id: "neutral", label: "Neutral", poseTags: ["neutral"], roles: { gaze_x: 0, gaze_y: 0, tilt: 0, eye_open: 0.88, mouth_open: 0.08, smile: 0, brow: 0, breath: 0.42, hair: 0, body: 0 } },
    { id: "happy", label: "Happy", poseTags: ["happy", "smile"], roles: { gaze_x: 0.08, gaze_y: -0.05, tilt: 0.08, eye_open: 0.84, mouth_open: 0.26, smile: 0.76, brow: 0.2, breath: 0.48, hair: 0.12, body: 0.04 } },
    { id: "sad", label: "Sad", poseTags: ["sad"], roles: { gaze_x: -0.08, gaze_y: 0.14, tilt: -0.07, eye_open: 0.66, mouth_open: 0.06, smile: -0.68, brow: -0.58, breath: 0.34, hair: -0.08, body: -0.05 } },
    { id: "angry", label: "Angry", poseTags: ["angry", "serious"], roles: { gaze_x: 0.05, gaze_y: 0.05, tilt: -0.05, eye_open: 0.62, mouth_open: 0.1, smile: -0.42, brow: -0.78, breath: 0.46, hair: 0.08, body: 0.05 } },
    { id: "surprised", label: "Surprised", poseTags: ["surprised"], roles: { gaze_x: 0, gaze_y: -0.14, tilt: 0, eye_open: 1, mouth_open: 0.74, smile: 0.04, brow: 0.78, breath: 0.54, hair: 0.14, body: 0.03 } },
    { id: "worried", label: "Worried", poseTags: ["worried", "sad"], roles: { gaze_x: -0.12, gaze_y: 0.08, tilt: -0.1, eye_open: 0.72, mouth_open: 0.12, smile: -0.48, brow: -0.42, breath: 0.4, hair: -0.06, body: -0.03 } },
    { id: "curious", label: "Curious", poseTags: ["curious"], roles: { gaze_x: 0.18, gaze_y: -0.04, tilt: 0.13, eye_open: 0.82, mouth_open: 0.14, smile: 0.2, brow: 0.28, breath: 0.44, hair: 0.1, body: 0.02 } },
    { id: "talk", label: "Talk", poseTags: ["talk"], roles: { gaze_x: 0.04, gaze_y: -0.02, tilt: 0.02, eye_open: 0.86, mouth_open: 0.62, smile: 0.12, brow: 0.08, breath: 0.48, hair: 0.06, body: 0.02 } },
    { id: "blink", label: "Blink", poseTags: ["blink"], roles: { gaze_x: 0, gaze_y: 0, tilt: 0, eye_open: 0.02, mouth_open: 0.06, smile: 0.02, brow: -0.04, breath: 0.42, hair: 0, body: 0 } },
    { id: "laugh", label: "Laugh", poseTags: ["happy", "laugh", "talk"], roles: { gaze_x: 0.1, gaze_y: -0.1, tilt: 0.12, eye_open: 0.34, mouth_open: 0.64, smile: 1, brow: 0.24, breath: 0.58, hair: 0.18, body: 0.06 } }
  ];
}

function autoExpressionParams(template) {
  const influence = adaptiveRigInfluenceMap();
  const params = {};
  for (const param of allParameterDefs()) {
    const role = parameterSemanticRole(param);
    if (!Object.prototype.hasOwnProperty.call(template.roles, role)) {
      params[param.key] = currentOrDefaultParamValue(param);
      continue;
    }
    const hasInfluence = influence.has(param.key) || parameterDefs.some((entry) => entry.key === param.key);
    params[param.key] = hasInfluence
      ? autoExpressionValueForRole(param, role, template.roles[role])
      : currentOrDefaultParamValue(param);
  }
  return params;
}

function autoExpressionValueForRole(param, role, target) {
  const min = Number(param.min);
  const max = Number(param.max);
  const span = Math.max(0.001, max - min);
  const safeTarget = Number(target);
  if (!Number.isFinite(safeTarget)) return currentOrDefaultParamValue(param);
  if (["eye_open", "mouth_open", "breath"].includes(role)) {
    return Number(clamp(min + span * clamp(safeTarget, 0, 1), min, max).toFixed(3));
  }
  const center = min + span * 0.5;
  return Number(clamp(center + clamp(safeTarget, -1, 1) * span * 0.5, min, max).toFixed(3));
}

function currentOrDefaultParamValue(param) {
  const value = Number(rig.params?.[param.key]);
  if (Number.isFinite(value)) return Number(clamp(value, param.min, param.max).toFixed(3));
  const defaults = defaultParams();
  const fallback = Number(defaults[param.key]);
  if (Number.isFinite(fallback)) return Number(clamp(fallback, param.min, param.max).toFixed(3));
  return Number((Number(param.min) + (Number(param.max) - Number(param.min)) * 0.5).toFixed(3));
}

function isAutoExpressionPreset(preset) {
  return preset?.autoGenerated === true || preset?.auto_generated === true || Boolean(preset?.autoExpressionKind || preset?.auto_expression_kind);
}

function exportExpressionPresetJson() {
  const presets = getExpressionPresets();
  if (presets.length === 0) {
    showToast("No saved presets to export.");
    return;
  }
  downloadJson(
    `${safeSegment(rig.character.displayName, "character")}.expression-presets.json`,
    {
      app: "tools/portrait-rig-editor",
      kind: "expression_preset_set",
      version: 1,
      exportedAt: new Date().toISOString(),
      presets: presets.map(expressionPresetForJsonExport)
    }
  );
  showToast(`Exported ${presets.length} expression presets.`);
}

function expressionPresetForJsonExport(preset) {
  const poseMetadata = expressionPresetPoseMetadata(preset, preset?.params || {});
  const poseTags = normalizePresetPoseTags([...(preset?.poseTags || preset?.pose_tags || []), ...poseMetadata.poseTags]);
  const poseScore = normalizePresetPoseScore({
    ...poseMetadata.poseScore,
    ...(preset?.poseScore || preset?.pose_score || {})
  });
  return {
    id: safeSegment(preset?.id || preset?.label || "expression", "expression"),
    label: String(preset?.label || preset?.name || preset?.id || "Expression"),
    params: normalizePresetParams(preset?.params || {}),
    meshes: normalizePresetMeshes(preset?.meshes || preset?.meshSnapshots || []),
    poseTags,
    poseScore,
    parameterValues: poseMetadata.parameterValues,
    ...(isAutoExpressionPreset(preset)
      ? {
        autoGenerated: true,
        autoExpressionKind: safeSegment(preset.autoExpressionKind || preset.auto_expression_kind || preset.id || "", "")
      }
      : {})
  };
}

async function importExpressionPresetsFromFiles(files) {
  const fileList = Array.from(files || []);
  if (fileList.length === 0) return;
  const imported = [];
  for (const file of fileList) {
    const data = JSON.parse(await file.text());
    imported.push(...expressionPresetsFromImportedJson(data));
  }
  const presets = normalizeExpressionPresets(imported);
  if (presets.length === 0) {
    showToast("No expression presets found in JSON.");
    return;
  }
  const existing = getExpressionPresets();
  const nextPresets = [...existing];
  for (const preset of presets) {
    const baseId = safeSegment(preset.id || preset.label || "expression", "expression");
    nextPresets.push({
      ...preset,
      id: uniqueExpressionPresetId(baseId, nextPresets)
    });
  }
  rig.expressionPresets = nextPresets;
  renderExpressions();
  commitHistory(`import ${presets.length} expression presets`);
  showToast(`Imported ${presets.length} expression preset${presets.length === 1 ? "" : "s"}.`);
}

function expressionPresetsFromImportedJson(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.presets)) return data.presets;
  if (Array.isArray(data.expressionPresets)) return data.expressionPresets;
  if (Array.isArray(data.expressions)) return data.expressions;
  if (data.kind === "expression_preset" || data.preset || data.expressionPreset) {
    return [data.preset || data.expressionPreset || data];
  }
  return [];
}

function uniqueExpressionPresetId(baseId, presets = getExpressionPresets()) {
  if (!presets.some((entry) => entry.id === baseId)) return baseId;
  let index = 2;
  while (presets.some((entry) => entry.id === `${baseId}_${index}`)) index += 1;
  return `${baseId}_${index}`;
}

function snapshotParams() {
  const params = {};
  for (const param of allParameterDefs()) {
    params[param.key] = Number(rig.params?.[param.key] ?? 0);
  }
  return params;
}

function snapshotMeshVertices() {
  return getImageParts()
    .filter((part) => part.mesh?.enabled)
    .map((part) => {
      const mesh = normalizePartMesh(part);
      return {
        partId: part.id,
        vertices: mesh.vertices.map((vertex) => ({
          dx: Number(Number(vertex.dx || 0).toFixed(3)),
          dy: Number(Number(vertex.dy || 0).toFixed(3))
        }))
      };
    });
}

function modelForExpressionPreset(preset, frameIndex = 0, frameCount = 0) {
  const model = rigForSave();
  model.params = { ...(model.params || {}), ...(preset.params || {}) };
  model.portrait = {
    ...(model.portrait || {}),
    state: safeSegment(preset.id || preset.label || "expression", "expression")
  };
  const parts = Array.isArray(model.imageParts) ? model.imageParts : [];
  applyPresetMeshesToParts(parts, preset);
  const poseMetadata = expressionPresetPoseMetadata(preset, model.params);
  model.metadata = {
    ...(model.metadata || {}),
    expressionPreset: {
      id: safeSegment(preset.id || preset.label || "expression", "expression"),
      label: String(preset.label || preset.name || preset.id || "Expression"),
      autoGenerated: isAutoExpressionPreset(preset),
      autoExpressionKind: safeSegment(preset.autoExpressionKind || preset.auto_expression_kind || "", ""),
      poseTags: poseMetadata.poseTags,
      poseScore: poseMetadata.poseScore,
      parameterValues: poseMetadata.parameterValues
    },
    motionFrame: {
      clipId: "expression_presets",
      clipLabel: "Expression Presets",
      time: Number(frameIndex),
      frameIndex,
      frameCount: Math.max(1, Math.round(Number(frameCount) || 1)),
      clipDuration: Math.max(1, Math.round(Number(frameCount) || 1)),
      physicsSampled: false,
      poseTags: poseMetadata.poseTags,
      poseScore: poseMetadata.poseScore,
      parameterValues: poseMetadata.parameterValues
    }
  };
  return model;
}

function expressionPresetPoseMetadata(preset, params) {
  const presetTags = normalizePresetPoseTags(preset.poseTags || preset.pose_tags || []);
  const presetScore = normalizePresetPoseScore(preset.poseScore || preset.pose_score || {});
  const semantic = semanticPoseMetadata(params, {
    id: safeSegment(preset.id || preset.label || "expression", "expression"),
    label: String(preset.label || preset.name || preset.id || "Expression")
  }, 0);
  const poseTags = [...presetTags];
  for (const tag of semantic.poseTags || []) {
    if (!poseTags.includes(tag)) poseTags.push(tag);
  }
  const poseScore = { ...(semantic.poseScore || {}) };
  for (const [tag, score] of Object.entries(presetScore)) {
    poseScore[tag] = Math.max(Number(poseScore[tag] || 0), Number(score || 0));
    if (Number(score || 0) >= 0.5 && !poseTags.includes(tag)) poseTags.push(tag);
  }
  for (const tag of presetTags) {
    poseScore[tag] = Math.max(Number(poseScore[tag] || 0), 1);
  }
  return {
    poseTags: poseTags.slice(0, 24),
    poseScore,
    parameterValues: normalizePresetParams(params || {})
  };
}

async function exportExpressionPresetsAsPortraits() {
  const presets = getExpressionPresets();
  if (!currentCharacter?.id) {
    showToast("Select or create a character first.");
    return;
  }
  if (presets.length === 0) {
    showToast("No saved presets to export.");
    return;
  }
  if (!ensureRigCanExport("exporting presets")) return;

  elements.savePortrait.disabled = true;
  elements.exportExpressionPresets.disabled = true;
  try {
    let lastCharacter = currentCharacter;
    for (const [index, preset] of presets.entries()) {
      const model = modelForExpressionPreset(preset, index, presets.length);
      const result = await requestJson(`/api/characters/${encodeURIComponent(currentCharacter.id)}/portraitRig-portrait`, {
        method: "POST",
        body: JSON.stringify({
          state: model.portrait.state,
          imageDataUrl: await renderPngDataUrl(model),
          model,
          center: model.portrait.center,
          profile: model.portrait.profile
        })
      });
      lastCharacter = result.data;
    }
    currentCharacter = lastCharacter;
    await loadCharacters(currentCharacter.id);
    showToast(`Exported ${presets.length} preset portraits.`);
  } catch (error) {
    showToast(error.message);
  } finally {
    elements.savePortrait.disabled = false;
    elements.exportExpressionPresets.disabled = false;
  }
}

function modelForMotionFrame(clip, time, frameIndex, stateOverride = "", frameCount = 0) {
  const model = rigForSave();
  const frameId = stateOverride || `${safeSegment(clip.id || clip.label || "motion", "motion")}_f${String(frameIndex + 1).padStart(2, "0")}`;
  const clipDuration = Math.max(0.1, Number(clip.duration || 2));
  const motionParams = { ...(model.params || {}), ...interpolatedMotionParams(clip, time) };
  model.params = samplePhysicsParams(model, time, motionParams);
  const poseMetadata = semanticPoseMetadata(model.params, clip, time);
  model.portrait = {
    ...(model.portrait || {}),
    state: frameId
  };
  model.metadata = {
    ...(model.metadata || {}),
    motionFrame: {
      clipId: clip.id,
      clipLabel: clip.label || clip.id,
      time: Number(time.toFixed(3)),
      frameIndex,
      frameCount: Math.max(0, Math.round(Number(frameCount) || 0)),
      clipDuration: Number(clipDuration.toFixed(3)),
      physicsSampled: model.physics?.enabled !== false,
      poseTags: poseMetadata.poseTags,
      poseScore: poseMetadata.poseScore,
      parameterValues: poseMetadata.parameterValues
    }
  };
  return model;
}

function semanticPoseMetadata(params, clip, time = null) {
  const parameterValues = compactParameterValues(params);
  return {
    parameterValues,
    poseTags: inferPoseTags(parameterValues, clip, time),
    poseScore: inferPoseScore(parameterValues, clip, time)
  };
}

function compactParameterValues(params) {
  const source = params && typeof params === "object" && !Array.isArray(params) ? params : {};
  const values = {};
  for (const param of allParameterDefs()) {
    const value = Number(source[param.key]);
    if (!Number.isFinite(value)) continue;
    values[param.key] = Number(value.toFixed(3));
  }
  return values;
}

function inferPoseTags(params, clip, time = null) {
  const tags = new Set();
  const clipText = `${clip?.id || ""} ${clip?.label || ""}`.toLowerCase();
  const smile = Number(params.smile || 0);
  const mouthOpen = Number(params.mouthOpen || 0);
  const eyeOpen = Number(params.eyeOpen ?? 88);
  const brow = Number(params.brow || 0);
  const angleX = Number(params.angleX || 0);
  const angleY = Number(params.angleY || 0);
  const angleZ = Number(params.angleZ || 0);
  const hairSway = Number(params.hairSway || 0);
  const breath = Number(params.breath ?? 36);

  if (clipText.includes("talk") || clipText.includes("speak") || mouthOpen >= 34) tags.add("talk");
  if (mouthOpen >= 54) tags.add("open_mouth");
  if (smile >= 34) tags.add("smile");
  if (smile >= 62) tags.add("happy");
  if (smile >= 78 && eyeOpen <= 62) tags.add("laugh");
  if (smile <= -28) tags.add("sad");
  if (brow <= -42 && smile <= 10) tags.add("angry");
  if (brow <= -36) tags.add("serious");
  if (brow <= -28 && smile <= -18) tags.add("worried");
  if (brow >= 42 || (mouthOpen >= 58 && eyeOpen >= 86)) tags.add("surprised");
  if (eyeOpen <= 26) tags.add("blink");
  else if (eyeOpen <= 58) tags.add("squint");
  if ((eyeOpen <= 64 && Math.abs(angleX) >= 5) || (brow <= -18 && Math.abs(angleX) >= 6)) tags.add("curious");
  if (angleX <= -7) tags.add("look_left");
  if (angleX >= 7) tags.add("look_right");
  if (angleY <= -7) tags.add("look_up");
  if (angleY >= 7) tags.add("look_down");
  if (angleZ <= -3) tags.add("tilt_left");
  if (angleZ >= 3) tags.add("tilt_right");
  if (Math.abs(hairSway) >= 12 || Math.abs(angleX) >= 8 || Math.abs(angleZ) >= 5) tags.add("motion");
  if (breath >= 62) tags.add("inhale");
  if (breath <= 18) tags.add("exhale");
  addVisemePoseTags(tags, clip, time);
  addSemanticRolePoseTags(tags, params);
  if (tags.size === 0) tags.add("neutral");
  return [...tags].slice(0, 16);
}

function inferPoseScore(params, clip, time = null) {
  const smile = Number(params.smile || 0);
  const mouthOpen = Number(params.mouthOpen || 0);
  const eyeOpen = Number(params.eyeOpen ?? 88);
  const brow = Number(params.brow || 0);
  const angleX = Number(params.angleX || 0);
  const angleY = Number(params.angleY || 0);
  const angleZ = Number(params.angleZ || 0);
  const hairSway = Number(params.hairSway || 0);
  const clipText = `${clip?.id || ""} ${clip?.label || ""}`.toLowerCase();
  const roleScore = semanticRolePoseScore(params);
  const happy = Math.max(roundPoseScore(smile / 82), roleScore.happy);
  const sad = Math.max(roundPoseScore((-smile / 78) + Math.max(0, -brow / 160)), roleScore.sad);
  const serious = Math.max(roundPoseScore((-brow / 72) + Math.max(0, -smile / 180)), roleScore.serious);
  const surprised = Math.max(roundPoseScore(((mouthOpen - 34) / 62) + Math.max(0, brow / 160) + Math.max(0, (eyeOpen - 82) / 80)), roleScore.surprised);
  const talk = Math.max(roundPoseScore((clipText.includes("talk") || clipText.includes("speak") ? 0.4 : 0) + ((mouthOpen - 12) / 60)), roleScore.talk);
  const blink = Math.max(roundPoseScore((64 - eyeOpen) / 64), roleScore.blink);
  const motion = Math.max(roundPoseScore((Math.abs(angleX) + Math.abs(angleZ) * 2 + Math.abs(hairSway) * 0.45) / 70), roleScore.motion);
  const openMouth = roundPoseScore((mouthOpen - 28) / 48);
  const squint = roundPoseScore((70 - eyeOpen) / 44);
  const lookLeft = roundPoseScore(-angleX / 12);
  const lookRight = roundPoseScore(angleX / 12);
  const lookUp = roundPoseScore(-angleY / 12);
  const lookDown = roundPoseScore(angleY / 12);
  const tiltLeft = roundPoseScore(-angleZ / 7);
  const tiltRight = roundPoseScore(angleZ / 7);
  const angry = Math.max(roundPoseScore((-brow / 72) + Math.max(0, -smile / 160) + Math.max(0, angleY / 80)), roleScore.angry);
  const worried = Math.max(roundPoseScore((-brow / 86) + Math.max(0, -smile / 120) + squint * 0.22), roleScore.worried);
  const curious = Math.max(roundPoseScore(Math.max(lookLeft, lookRight) * 0.72 + squint * 0.35 + serious * 0.12), roleScore.curious);
  const closedMouth = roundPoseScore((18 - mouthOpen) / 22);
  const neutral = roundPoseScore(1 - (
    Math.abs(smile) / 86
    + Math.abs(mouthOpen) / 76
    + Math.abs(brow) / 80
    + Math.abs(angleX) / 18
    + Math.abs(angleY) / 18
    + Math.abs(angleZ) / 10
  ) / 6);
  return {
    happy,
    sad,
    angry,
    curious,
    worried,
    serious,
    surprised,
    talk,
    open_mouth: openMouth,
    closed_mouth: closedMouth,
    blink,
    squint,
    look_left: lookLeft,
    look_right: lookRight,
    look_up: lookUp,
    look_down: lookDown,
    tilt_left: tiltLeft,
    tilt_right: tiltRight,
    neutral,
    motion,
    ...visemePoseScore(clip, time)
  };
}

function addVisemePoseTags(tags, clip, time) {
  const viseme = visemeNameForMotionTime(clip, time);
  if (!viseme) return;
  tags.add("viseme");
  tags.add("phoneme");
  tags.add(`viseme_${viseme}`);
  if (viseme === "closed") tags.add("closed_mouth");
  else tags.add("talk");
}

function visemePoseScore(clip, time) {
  const viseme = visemeNameForMotionTime(clip, time);
  if (!viseme) return {};
  return {
    viseme: 1,
    phoneme: 1,
    [`viseme_${viseme}`]: 1,
    ...(viseme === "closed" ? { closed_mouth: 1 } : {})
  };
}

function visemeNameForMotionTime(clip, time) {
  const clipText = `${clip?.id || ""} ${clip?.label || ""}`.toLowerCase();
  if (!/viseme|phoneme|lip/.test(clipText) || !Number.isFinite(Number(time))) return "";
  const duration = Math.max(0.1, Number(clip?.duration || 1.2));
  const step = duration / 6;
  const index = Math.round(clamp(Number(time), 0, duration) / Math.max(0.001, step));
  return ["closed", "a", "i", "o", "u", "closed"][clamp(index, 0, 5)] || "";
}

function addSemanticRolePoseTags(tags, params) {
  for (const entry of customParameterPoseSignals(params)) {
    const { role, signed, level } = entry;
    if (role === "mouth_open") {
      if (level >= 0.34) tags.add("talk");
      if (level >= 0.58) tags.add("open_mouth");
    } else if (role === "eye_open") {
      if (level <= 0.24) tags.add("blink");
      else if (level <= 0.58) tags.add("squint");
      if (level >= 0.88) tags.add("surprised");
    } else if (role === "smile") {
      if (signed >= 0.28) tags.add("smile");
      if (signed >= 0.58) tags.add("happy");
      if (signed <= -0.28) tags.add("sad");
    } else if (role === "brow") {
      if (signed <= -0.34) tags.add("serious");
      if (signed <= -0.26) tags.add("worried");
      if (signed >= 0.42) tags.add("surprised");
    } else if (role === "gaze_x") {
      if (signed <= -0.16) tags.add("look_left");
      if (signed >= 0.16) tags.add("look_right");
    } else if (role === "gaze_y") {
      if (signed <= -0.16) tags.add("look_up");
      if (signed >= 0.16) tags.add("look_down");
    } else if (role === "tilt") {
      if (signed <= -0.12) tags.add("tilt_left");
      if (signed >= 0.12) tags.add("tilt_right");
    } else if (["hair", "body", "prop"].includes(role) && Math.abs(signed) >= 0.18) {
      tags.add("motion");
    } else if (role === "breath") {
      if (level >= 0.62) tags.add("inhale");
      if (level <= 0.18) tags.add("exhale");
    }
  }
}

function semanticRolePoseScore(params) {
  const score = {
    happy: 0,
    sad: 0,
    angry: 0,
    curious: 0,
    worried: 0,
    serious: 0,
    surprised: 0,
    talk: 0,
    blink: 0,
    motion: 0
  };
  for (const entry of customParameterPoseSignals(params)) {
    const { role, signed, level } = entry;
    if (role === "mouth_open") {
      score.talk = Math.max(score.talk, roundPoseScore((level - 0.12) / 0.68));
      score.surprised = Math.max(score.surprised, roundPoseScore((level - 0.62) / 0.34));
    } else if (role === "eye_open") {
      score.blink = Math.max(score.blink, roundPoseScore((0.64 - level) / 0.64));
      score.surprised = Math.max(score.surprised, roundPoseScore((level - 0.82) / 0.18));
    } else if (role === "smile") {
      score.happy = Math.max(score.happy, roundPoseScore(signed / 0.82));
      score.sad = Math.max(score.sad, roundPoseScore(-signed / 0.78));
      score.worried = Math.max(score.worried, roundPoseScore(-signed / 0.88));
    } else if (role === "brow") {
      score.serious = Math.max(score.serious, roundPoseScore(-signed / 0.72));
      score.angry = Math.max(score.angry, roundPoseScore(-signed / 0.76));
      score.worried = Math.max(score.worried, roundPoseScore(-signed / 0.92));
      score.surprised = Math.max(score.surprised, roundPoseScore(signed / 0.72));
    } else if (role === "gaze_x") {
      score.curious = Math.max(score.curious, roundPoseScore(Math.abs(signed) / 0.62));
      score.motion = Math.max(score.motion, roundPoseScore(Math.abs(signed) / 0.72));
    } else if (role === "gaze_y") {
      score.curious = Math.max(score.curious, roundPoseScore(Math.abs(signed) / 0.72));
      score.motion = Math.max(score.motion, roundPoseScore(Math.abs(signed) / 0.72));
    } else if (["tilt", "hair", "body", "prop"].includes(role)) {
      score.motion = Math.max(score.motion, roundPoseScore(Math.abs(signed) / 0.72));
    }
  }
  return score;
}

function customParameterPoseSignals(params) {
  const source = params && typeof params === "object" && !Array.isArray(params) ? params : {};
  const builtInKeys = new Set(parameterDefs.map((param) => param.key));
  return allParameterDefs()
    .filter((param) => !builtInKeys.has(param.key))
    .map((param) => {
      const value = Number(source[param.key]);
      if (!Number.isFinite(value)) return null;
      return {
        param,
        value,
        role: parameterSemanticRole(param),
        signed: normalizedParameterSigned(param, value),
        level: normalizedParameterLevel(param, value)
      };
    })
    .filter(Boolean);
}

function normalizedParameterSigned(param, value) {
  const min = Number.isFinite(Number(param?.min)) ? Number(param.min) : -100;
  const max = Number.isFinite(Number(param?.max)) ? Number(param.max) : 100;
  const safeMax = Math.max(max, min + 0.001);
  const clamped = clamp(value, min, safeMax);
  if (min < 0 && safeMax > 0) return clamp(clamped / Math.max(Math.abs(min), Math.abs(safeMax), 1), -1, 1);
  return clamp(((clamped - min) / Math.max(0.001, safeMax - min)) * 2 - 1, -1, 1);
}

function normalizedParameterLevel(param, value) {
  const min = Number.isFinite(Number(param?.min)) ? Number(param.min) : -100;
  const max = Number.isFinite(Number(param?.max)) ? Number(param.max) : 100;
  return clamp((Number(value) - min) / Math.max(0.001, max - min), 0, 1);
}

function roundPoseScore(value) {
  return Number(clamp(Number(value) || 0, 0, 1).toFixed(3));
}

function motionPoseStateId(clip, time) {
  const clipId = safeSegment(clip?.id || clip?.label || "motion", "motion");
  const milliseconds = String(Math.round(Number(time || 0) * 1000)).padStart(4, "0");
  return `${clipId}_t${milliseconds}`;
}

async function exportCurrentMotionFrameAsPortrait() {
  const clip = activeMotionClip();
  if (!currentCharacter?.id) {
    showToast("Select or create a character first.");
    return;
  }
  if (!clip || clip.keyframes.length === 0) {
    showToast("Add motion keys before exporting a pose.");
    return;
  }
  if (!ensureRigCanExport("exporting the current motion pose")) return;
  const duration = Math.max(0.1, Number(clip.duration || 2));
  const time = Number(clamp(elements.motionTime.value || 0, 0, duration).toFixed(3));
  const defaultState = motionPoseStateId(clip, time);
  const label = window.prompt("초상화 상태", defaultState);
  if (label === null) return;
  const state = safeSegment(label, defaultState);
  const frameIndex = Math.round(time * 1000);

  stopMotionPlayback(false);
  elements.savePortrait.disabled = true;
  elements.exportCurrentMotionFrame.disabled = true;
  elements.exportMotionFrames.disabled = true;
  elements.exportAllMotionFrames.disabled = true;
  elements.playMotion.disabled = true;
  try {
    const model = modelForMotionFrame(clip, time, frameIndex, state, 1);
    const result = await requestJson(`/api/characters/${encodeURIComponent(currentCharacter.id)}/portraitRig-portrait`, {
      method: "POST",
      body: JSON.stringify({
        state: model.portrait.state,
        imageDataUrl: await renderPngDataUrl(model),
        model,
        center: model.portrait.center,
        profile: model.portrait.profile
      })
    });
    currentCharacter = result.data;
    elements.portraitState.value = state;
    await loadCharacters(currentCharacter.id);
    showToast(`Exported motion pose: ${state}`);
  } catch (error) {
    showToast(error.message);
  } finally {
    elements.savePortrait.disabled = false;
    elements.exportCurrentMotionFrame.disabled = false;
    elements.exportMotionFrames.disabled = false;
    elements.exportAllMotionFrames.disabled = false;
    elements.playMotion.disabled = false;
    renderMotionControls(clip.id);
  }
}

async function savePortraitRigPortraitFrameModels(models) {
  if (!currentCharacter?.id) throw new Error("Select or create a character first.");
  if (!Array.isArray(models) || models.length === 0) throw new Error("No motion frames to export.");
  const frames = [];
  for (const model of models) {
    frames.push({
      state: model.portrait.state,
      imageDataUrl: await renderPngDataUrl(model),
      model,
      center: model.portrait.center,
      profile: model.portrait.profile
    });
  }
  return requestJson(`/api/characters/${encodeURIComponent(currentCharacter.id)}/portraitRig-portrait-batch`, {
    method: "POST",
    body: JSON.stringify({ frames })
  });
}

async function exportMotionFramesAsPortraits() {
  const clip = activeMotionClip();
  if (!currentCharacter?.id) {
    showToast("Select or create a character first.");
    return;
  }
  if (!clip || clip.keyframes.length === 0) {
    showToast("Add motion keys before exporting frames.");
    return;
  }
  if (!ensureRigCanExport("exporting motion frames")) return;
  const frameCount = normalizeMotionFrameCount(elements.motionFrameCount.value || 4, 4);
  clip.exportFrames = frameCount;
  elements.motionFrameCount.value = String(frameCount);
  const frameTimes = motionFrameTimesForClip(clip, frameCount);

  stopMotionPlayback(false);
  elements.savePortrait.disabled = true;
  elements.exportMotionFrames.disabled = true;
  elements.exportAllMotionFrames.disabled = true;
  elements.playMotion.disabled = true;
  try {
    const result = await savePortraitRigPortraitFrameModels(frameTimes.map((time, index) => modelForMotionFrame(clip, time, index, "", frameCount)));
    currentCharacter = result.data;
    await loadCharacters(currentCharacter.id);
    showToast(`Exported ${result.count || frameCount} motion frames.`);
  } catch (error) {
    showToast(error.message);
  } finally {
    elements.savePortrait.disabled = false;
    elements.exportMotionFrames.disabled = false;
    elements.exportAllMotionFrames.disabled = false;
    elements.playMotion.disabled = false;
    renderMotionControls(clip.id);
  }
}

async function exportAllMotionFramesAsPortraits() {
  if (!currentCharacter?.id) {
    showToast("Select or create a character first.");
    return;
  }
  const clips = getMotionClips().filter((clip) => clip.keyframes.length > 0);
  if (clips.length === 0) {
    showToast("Add motion keys before exporting clips.");
    return;
  }
  const estimatedFrameCount = clips.reduce((total, clip) => total + recommendedMotionFrameCount(clip), 0);
  if (!window.confirm(`모션 클립 ${clips.length}개에서 ${estimatedFrameCount}프레임을 내보낼까요?`)) return;
  if (!ensureRigCanExport("exporting all motion clips")) return;

  stopMotionPlayback(false);
  const selectedClipId = activeMotionClip()?.id || clips[0]?.id || "";
  elements.savePortrait.disabled = true;
  elements.exportCurrentMotionFrame.disabled = true;
  elements.exportMotionFrames.disabled = true;
  elements.exportAllMotionFrames.disabled = true;
  elements.exportAdaptivePoseSet.disabled = true;
  elements.exportDialogueMotionSet.disabled = true;
  elements.playMotion.disabled = true;
  try {
    let exportedClipCount = 0;
    const models = [];
    for (const clip of clips) {
      const frameCount = recommendedMotionFrameCount(clip);
      const frameTimes = motionFrameTimesForClip(clip, frameCount);
      if (frameTimes.length === 0) continue;
      for (let index = 0; index < frameTimes.length; index += 1) {
        models.push(modelForMotionFrame(clip, frameTimes[index], index, "", frameCount));
      }
      exportedClipCount += 1;
    }
    const result = await savePortraitRigPortraitFrameModels(models);
    currentCharacter = result.data;
    await loadCharacters(currentCharacter.id);
    showToast(`Exported ${result.count || models.length} frames from ${exportedClipCount} clips.`);
  } catch (error) {
    showToast(error.message);
  } finally {
    elements.savePortrait.disabled = false;
    elements.exportCurrentMotionFrame.disabled = false;
    elements.exportMotionFrames.disabled = false;
    elements.exportAllMotionFrames.disabled = false;
    elements.exportAdaptivePoseSet.disabled = false;
    elements.exportDialogueMotionSet.disabled = false;
    elements.playMotion.disabled = false;
    renderMotionControls(selectedClipId);
  }
}

async function exportDialogueMotionSetAsPortraits() {
  if (!currentCharacter?.id) {
    showToast("Select or create a character first.");
    return;
  }
  if (!window.confirm("adaptive_pose, idle_loop, talk_loop, viseme_set을 생성한 뒤 대화용 초상화 프레임을 내보낼까요?")) return;

  stopMotionPlayback(false);
  const recipes = [];
  const clips = [];
  for (const recipe of [autoIdleMotionRecipe(), autoTalkMotionRecipe(), autoVisemeMotionRecipe()]) {
    const clip = upsertAutoMotionRecipe(recipe, { confirmReplace: false });
    if (!clip) continue;
    recipes.push(recipe);
    clips.push(clip);
  }
  const adaptiveRecipe = autoAdaptivePoseRecipe();
  const adaptiveClip = upsertAutoMotionRecipe(adaptiveRecipe, { confirmReplace: false });
  if (adaptiveClip) {
    recipes.push(adaptiveRecipe);
    clips.push(adaptiveClip);
  }
  if (!ensureRigCanExport("exporting the dialogue motion set")) return;

  elements.savePortrait.disabled = true;
  elements.exportCurrentMotionFrame.disabled = true;
  elements.exportMotionFrames.disabled = true;
  elements.exportAllMotionFrames.disabled = true;
  elements.exportAdaptivePoseSet.disabled = true;
  elements.exportDialogueMotionSet.disabled = true;
  elements.playMotion.disabled = true;
  try {
    const models = [];
    for (const clip of clips) {
      const recipe = recipes.find((entry) => entry.id === clip.id);
      const frameCount = recommendedMotionFrameCount(clip, recipe?.exportFrames || 6);
      const frameTimes = motionFrameTimesForClip(clip, frameCount);
      for (let index = 0; index < frameTimes.length; index += 1) {
        models.push(modelForMotionFrame(clip, frameTimes[index], index, "", frameCount));
      }
    }
    const result = await savePortraitRigPortraitFrameModels(models);
    currentCharacter = result.data;
    await loadCharacters(currentCharacter.id);
    renderMotionControls(adaptiveClip?.id || clips[0]?.id || "");
    showToast(`Exported ${result.count || models.length} dialogue-ready frames from ${clips.length} clips.`);
  } catch (error) {
    showToast(error.message);
  } finally {
    elements.savePortrait.disabled = false;
    elements.exportCurrentMotionFrame.disabled = false;
    elements.exportMotionFrames.disabled = false;
    elements.exportAllMotionFrames.disabled = false;
    elements.exportAdaptivePoseSet.disabled = false;
    elements.exportDialogueMotionSet.disabled = false;
    elements.playMotion.disabled = false;
    renderMotionControls(adaptiveClip?.id || clips[0]?.id || "");
  }
}

async function exportAdaptivePoseSetAsPortraits() {
  if (!currentCharacter?.id) {
    showToast("Select or create a character first.");
    return;
  }
  if (!window.confirm("adaptive_pose를 생성한 뒤 대화용 포즈 프레임을 내보낼까요?")) return;

  stopMotionPlayback(false);
  const recipe = autoAdaptivePoseRecipe();
  const clip = upsertAutoMotionRecipe(recipe, { confirmReplace: false });
  if (!clip || !ensureRigCanExport("exporting adaptive pose frames")) return;

  elements.savePortrait.disabled = true;
  elements.exportCurrentMotionFrame.disabled = true;
  elements.exportMotionFrames.disabled = true;
  elements.exportAllMotionFrames.disabled = true;
  elements.exportAdaptivePoseSet.disabled = true;
  elements.exportDialogueMotionSet.disabled = true;
  elements.playMotion.disabled = true;
  try {
    const frameCount = recommendedMotionFrameCount(clip, recipe.exportFrames);
    const frameTimes = motionFrameTimesForClip(clip, frameCount);
    const result = await savePortraitRigPortraitFrameModels(frameTimes.map((time, index) => modelForMotionFrame(clip, time, index, "", frameCount)));
    currentCharacter = result.data;
    await loadCharacters(currentCharacter.id);
    elements.motionFrameCount.value = String(frameCount);
    renderMotionControls(clip.id);
    showToast(`Exported ${result.count || frameCount} adaptive pose frames.`);
  } catch (error) {
    showToast(error.message);
  } finally {
    elements.savePortrait.disabled = false;
    elements.exportCurrentMotionFrame.disabled = false;
    elements.exportMotionFrames.disabled = false;
    elements.exportAllMotionFrames.disabled = false;
    elements.exportAdaptivePoseSet.disabled = false;
    elements.exportDialogueMotionSet.disabled = false;
    elements.playMotion.disabled = false;
    renderMotionControls(clip.id);
  }
}

function getMotionClips() {
  if (!Array.isArray(rig.motionClips)) rig.motionClips = [];
  rig.motionClips = normalizeMotionClips(rig.motionClips);
  return rig.motionClips;
}

function activeMotionClip() {
  const clips = getMotionClips();
  const selectedId = elements.motionClipSelect.value;
  return clips.find((clip) => clip.id === selectedId) || clips[0] || null;
}

function renderMotionControls(preferredId = "") {
  const clips = getMotionClips();
  const selectedId = preferredId || elements.motionClipSelect.value;
  elements.motionClipSelect.innerHTML = "";

  if (clips.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = ko("No motion clips");
    elements.motionClipSelect.append(option);
    elements.motionDuration.value = "2";
    elements.motionTime.max = "2";
    elements.motionTime.value = "0";
    elements.motionTimeLabel.textContent = "0.00s";
    elements.motionFrameCount.value = elements.motionFrameCount.value || "4";
    setMotionControlsDisabled(true);
    elements.exportAdaptivePoseSet.disabled = false;
    renderMotionTimeline(null);
    renderMotionCurvePanel(null);
    renderMotionKeyList(null);
    renderDialoguePosePreviewStatus();
    renderAdaptivePoseControls();
    return;
  }

  for (const clip of clips) {
    const option = document.createElement("option");
    option.value = clip.id;
    option.textContent = ko(clip.label || clip.id);
    elements.motionClipSelect.append(option);
  }

  const nextSelectedId = clips.some((clip) => clip.id === selectedId) ? selectedId : clips[0].id;
  elements.motionClipSelect.value = nextSelectedId;
  const clip = activeMotionClip();
  const duration = clamp(clip.duration || 2, 0.1, 30);
  clip.duration = duration;
  const currentTime = clamp(elements.motionTime.value || 0, 0, duration);
  elements.motionDuration.value = String(Number(duration.toFixed(3)));
  elements.motionTime.max = String(duration);
  elements.motionTime.value = String(currentTime);
  elements.motionTimeLabel.textContent = formatMotionTime(currentTime);
  elements.motionFrameCount.value = String(recommendedMotionFrameCount(clip));
  setMotionControlsDisabled(false);
  elements.playMotion.disabled = motionPlaybackFrame !== 0 || clip.keyframes.length === 0;
  elements.stopMotion.disabled = motionPlaybackFrame === 0;
  elements.exportCurrentMotionFrame.disabled = clip.keyframes.length === 0;
  elements.exportMotionFrames.disabled = clip.keyframes.length === 0;
  elements.exportAllMotionFrames.disabled = !clips.some((entry) => entry.keyframes.length > 0);
  elements.exportMotionClipJson.disabled = false;
  elements.exportAllMotionClipsJson.disabled = clips.length === 0;
  elements.exportAdaptivePoseSet.disabled = false;
  renderMotionTimeline(clip);
  renderMotionCurvePanel(clip);
  renderMotionKeyList(clip);
  renderDialoguePosePreviewStatus();
  renderAdaptivePoseControls();
}

function setMotionControlsDisabled(disabled) {
  elements.renameMotionClip.disabled = disabled;
  elements.duplicateMotionClip.disabled = disabled;
  elements.deleteMotionClip.disabled = disabled;
  elements.exportMotionClipJson.disabled = disabled;
  elements.exportAllMotionClipsJson.disabled = disabled;
  elements.importMotionClipsButton.disabled = false;
  elements.motionDuration.disabled = disabled;
  elements.motionTime.disabled = disabled;
  elements.motionOnionSkin.disabled = disabled;
  elements.motionOnionStep.disabled = disabled;
  elements.addMotionKey.disabled = disabled;
  elements.pasteMotionKey.disabled = disabled || !motionKeyClipboard;
  elements.autoVisemeMotion.disabled = false;
  elements.playMotion.disabled = disabled;
  elements.motionFrameCount.disabled = disabled;
  elements.exportCurrentMotionFrame.disabled = disabled;
  elements.exportMotionFrames.disabled = disabled;
  elements.exportAllMotionFrames.disabled = disabled;
  elements.exportAdaptivePoseSet.disabled = disabled;
  elements.previewDialogueTextPose.disabled = disabled;
  elements.stopMotion.disabled = true;
}

function renderDialoguePosePreviewStatus() {
  const clip = getMotionClips().find((entry) => entry.id === "adaptive_pose") || null;
  if (!clip) {
    elements.previewDialoguePosePrev.disabled = true;
    elements.previewDialoguePoseNext.disabled = true;
    elements.previewDialoguePoseHint.disabled = true;
    elements.previewDialogueTextPose.disabled = true;
    elements.resetDialoguePosePreview.disabled = true;
    elements.dialoguePosePreviewStatus.textContent = ko("Not generated");
    renderDialoguePoseTextHints();
    renderDialoguePoseFrameList(null, []);
    return;
  }
  const frameTimes = motionFrameTimesForClip(clip, recommendedMotionFrameCount(clip));
  const canPreview = frameTimes.length > 0 && clip.keyframes.length > 0;
  elements.previewDialoguePosePrev.disabled = !canPreview;
  elements.previewDialoguePoseNext.disabled = !canPreview;
  elements.previewDialoguePoseHint.disabled = !canPreview;
  elements.previewDialogueTextPose.disabled = !canPreview;
  elements.resetDialoguePosePreview.disabled = !canPreview || dialoguePosePreviewIndex < 0;
  const activeHints = activeDialoguePoseHintSet();
  const activeText = dialoguePosePreviewIndex >= 0
    ? `포즈 ${dialoguePosePreviewIndex + 1}/${frameTimes.length} · ${formatMotionTime(frameTimes[dialoguePosePreviewIndex] || 0)} · ${formatDialoguePoseHintSet(activeHints)}`
    : `${frameTimes.length}개 포즈 준비됨`;
  elements.dialoguePosePreviewStatus.textContent = activeText;
  renderDialoguePoseTextHints(activeHints);
  renderDialoguePoseFrameList(clip, frameTimes, canPreview);
}

function renderDialoguePoseFrameList(clip, frameTimes, canPreview = false) {
  elements.dialoguePoseFrameList.innerHTML = "";
  if (!clip || !canPreview) {
    const empty = document.createElement("div");
    empty.className = "dialogue-pose-frame-empty";
    empty.textContent = ko("No pose frames");
    elements.dialoguePoseFrameList.append(empty);
    return;
  }

  const hints = activeDialoguePoseHintSet();
  const currentIndex = dialoguePosePreviewIndex >= 0 ? dialoguePosePreviewIndex : -1;
  const summaries = frameTimes.map((time, index) => {
    const params = interpolatedMotionParams(clip, time);
    const metadata = semanticPoseMetadata(params, clip, time);
    const score = dialoguePoseHintScoreForHints(metadata, hints, index, currentIndex);
    return { index, time, metadata, score };
  });
  const bestScore = Math.max(...summaries.map((entry) => Number(entry.score) || 0));

  const heading = document.createElement("div");
  heading.className = "dialogue-pose-frame-heading";
  heading.textContent = `${ko("Pose frames")} · ${formatDialoguePoseHintSet(hints)}`;
  elements.dialoguePoseFrameList.append(heading);

  for (const entry of summaries) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "dialogue-pose-frame-row";
    row.classList.toggle("active", entry.index === currentIndex);
    row.classList.toggle("best", Math.abs(entry.score - bestScore) <= 0.0001);
    row.addEventListener("click", () => previewDialoguePoseFrame(clip.id, entry.index, entry.time));

    const title = document.createElement("span");
    title.className = "dialogue-pose-frame-title";
    title.textContent = `#${entry.index + 1} · ${formatMotionTime(entry.time)}`;
    const score = document.createElement("span");
    score.className = "dialogue-pose-frame-score";
    score.textContent = formatCompactNumber(entry.score);

    const tags = document.createElement("span");
    tags.className = "dialogue-pose-frame-tags";
    for (const tag of (entry.metadata.poseTags || []).slice(0, 5)) {
      const chip = document.createElement("span");
      chip.textContent = tag;
      tags.append(chip);
    }

    row.append(title, score, tags);
    elements.dialoguePoseFrameList.append(row);
  }
}

function activeDialoguePoseHintSet() {
  const lineHints = inferDialoguePoseHintsFromText(elements.dialoguePoseText?.value || "");
  if (lineHints.length > 0) return lineHints;
  const selectedHint = normalizeDialoguePoseHint(elements.dialoguePoseHint?.value || "happy");
  return selectedHint ? [selectedHint] : ["happy"];
}

function formatDialoguePoseHintSet(hints) {
  const source = Array.isArray(hints) ? hints : [];
  return source.length > 0 ? source.slice(0, 4).join(", ") : "hint";
}

function renderDialoguePoseTextHints(hints = activeDialoguePoseHintSet()) {
  if (!elements.dialoguePoseTextHints) return;
  elements.dialoguePoseTextHints.innerHTML = "";
  for (const hint of hints.slice(0, 6)) {
    const chip = document.createElement("span");
    chip.textContent = hint;
    elements.dialoguePoseTextHints.append(chip);
  }
}

function previewDialoguePoseFrame(clipId, index, time) {
  const clip = getMotionClips().find((entry) => entry.id === clipId);
  if (!clip) return;
  stopMotionPlayback(false);
  dialoguePosePreviewIndex = index;
  renderMotionControls(clip.id);
  setMotionTime(time, true, clip);
  renderDialoguePosePreviewStatus();
}

function renderAdaptivePoseControls() {
  const settings = getAdaptivePoseSettings();
  elements.adaptivePoseIntensity.value = String(settings.intensity);
  elements.adaptivePoseIntensityLabel.textContent = `${settings.intensity.toFixed(2)}x`;
  renderAdaptiveRigMap();
}

function renderAdaptiveRigMap() {
  const plan = adaptivePoseParameterPlan();
  elements.adaptiveRigMap.innerHTML = "";
  if (plan.length === 0) {
    const empty = document.createElement("div");
    empty.className = "adaptive-rig-map-empty";
    empty.textContent = ko("No driven parameters");
    elements.adaptiveRigMap.append(empty);
    return;
  }

  const heading = document.createElement("div");
  heading.className = "adaptive-rig-map-heading";
  heading.textContent = ko("Adaptive rig map");
  elements.adaptiveRigMap.append(heading);

  const maxAmplitude = Math.max(1, ...plan.map((entry) => entry.totalAmplitude));
  for (const entry of plan.slice(0, 12)) {
    const row = document.createElement("label");
    row.className = "adaptive-rig-map-row";
    row.classList.toggle("disabled", !entry.enabled);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = entry.enabled;
    checkbox.addEventListener("change", () => setAdaptivePoseParameterEnabled(entry.key, checkbox.checked));

    const body = document.createElement("div");
    body.className = "adaptive-rig-map-body";
    const title = document.createElement("div");
    title.className = "adaptive-rig-map-title";
    title.textContent = `${ko(entry.label)} · ${ko(parameterRoleLabel(entry.role))}`;
    const meta = document.createElement("div");
    meta.className = "adaptive-rig-map-meta";
    meta.textContent = `진폭 ${formatCompactNumber(entry.totalAmplitude)} · 점수 ${formatCompactNumber(entry.score)}`;
    const bar = document.createElement("div");
    bar.className = "adaptive-rig-map-bar";
    const fill = document.createElement("span");
    fill.style.width = `${clamp((entry.totalAmplitude / maxAmplitude) * 100, 2, 100)}%`;
    bar.append(fill);
    const channels = document.createElement("div");
    channels.className = "adaptive-rig-map-channels";
    for (const channel of entry.channels.slice(0, 5)) {
      const chip = document.createElement("span");
      chip.textContent = channel;
      channels.append(chip);
    }
    body.append(title, meta, bar, channels);
    row.append(checkbox, body);
    elements.adaptiveRigMap.append(row);
  }
}

function renderMotionKeyList(clip) {
  elements.motionKeyList.innerHTML = "";
  if (!clip || clip.keyframes.length === 0) {
    const empty = document.createElement("div");
    empty.className = "motion-empty";
    empty.textContent = ko("No keys");
    elements.motionKeyList.append(empty);
    return;
  }

  const currentTime = clamp(elements.motionTime.value || 0, 0, clip.duration || 2);
  clip.keyframes.forEach((keyframe, index) => {
    const row = document.createElement("div");
    row.className = "motion-key-row";
    row.dataset.time = String(keyframe.time);
    if (Math.abs(Number(keyframe.time || 0) - currentTime) <= 0.015) row.classList.add("active");
    const summary = document.createElement("span");
    summary.textContent = `파라미터 ${Object.keys(keyframe.params || {}).length}개`;
    const timeInput = document.createElement("input");
    timeInput.className = "motion-key-time-input";
    timeInput.type = "number";
    timeInput.min = "0";
    timeInput.max = String(clamp(clip.duration || 2, 0.1, 30));
    timeInput.step = "0.01";
    timeInput.value = Number(keyframe.time || 0).toFixed(2);
    timeInput.setAttribute("aria-label", "모션 키 시간");
    timeInput.addEventListener("change", () => updateMotionKeyframeTime(clip, index, Number(timeInput.value || 0)));
    const easingSelect = document.createElement("select");
    easingSelect.className = "motion-easing-select";
    for (const [value, label] of motionEasingOptions) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = ko(label);
      easingSelect.append(option);
    }
    easingSelect.value = normalizeMotionEasing(keyframe.easing);
    easingSelect.addEventListener("change", () => {
      keyframe.easing = normalizeMotionEasing(easingSelect.value);
      commitHistory(`motion easing ${clip.id}`);
    });
    const applyButton = document.createElement("button");
    applyButton.type = "button";
    applyButton.textContent = ko("Apply");
    applyButton.addEventListener("click", () => setMotionTime(keyframe.time, true));
    const updateButton = document.createElement("button");
    updateButton.type = "button";
    updateButton.textContent = ko("Update");
    updateButton.addEventListener("click", () => updateMotionKeyframeFromCurrent(clip, index));
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.textContent = ko("Copy");
    copyButton.addEventListener("click", () => copyMotionKeyframe(clip, index));
    const mirrorButton = document.createElement("button");
    mirrorButton.type = "button";
    mirrorButton.textContent = ko("Mirror");
    mirrorButton.addEventListener("click", () => mirrorMotionKeyframe(clip, index));
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = ko("Delete");
    deleteButton.className = "expression-delete";
    deleteButton.addEventListener("click", () => deleteMotionKeyframe(index));
    const inspector = createMotionKeyInspector(clip, keyframe, summary);
    row.append(summary, timeInput, easingSelect, applyButton, updateButton, copyButton, mirrorButton, deleteButton, inspector);
    elements.motionKeyList.append(row);
  });
}

function createMotionKeyInspector(clip, keyframe, summary) {
  const details = document.createElement("details");
  details.className = "motion-key-inspector";
  details.open = Math.abs(Number(keyframe.time || 0) - Number(elements.motionTime.value || 0)) <= 0.015;
  const label = document.createElement("summary");
  label.textContent = ko("Params");
  const grid = document.createElement("div");
  grid.className = "motion-key-param-grid";

  for (const param of allParameterDefs()) {
    const wrapper = document.createElement("label");
    wrapper.className = "motion-key-param";
    const name = document.createElement("span");
    name.textContent = ko(param.label);
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(param.min);
    input.max = String(param.max);
    input.step = String(param.step || 1);
    const value = motionKeyParamValue(keyframe, param);
    input.value = String(value);
    const output = document.createElement("output");
    output.textContent = formatParamValue(value, param);
    input.addEventListener("input", () => {
      const nextValue = clamp(Number(input.value), param.min, param.max);
      keyframe.params[param.key] = nextValue;
      output.textContent = formatParamValue(nextValue, param);
      summary.textContent = `파라미터 ${Object.keys(keyframe.params || {}).length}개`;
      setMotionTime(keyframe.time, true, clip);
      renderMotionCurvePanel(clip);
    });
    input.addEventListener("change", () => {
      commitHistory(`motion key param ${clip.id} ${param.key}`);
    });
    wrapper.append(name, input, output);
    grid.append(wrapper);
  }

  details.append(label, grid);
  return details;
}

function motionKeyParamValue(keyframe, param) {
  const keyValue = Number(keyframe.params?.[param.key]);
  const fallbackValue = Number(rig.params?.[param.key] ?? 0);
  const value = Number.isFinite(keyValue) ? keyValue : fallbackValue;
  return clamp(value, param.min, param.max);
}

function formatParamValue(value, param) {
  return Number(value || 0).toFixed(Number(param.step || 1) < 1 ? 2 : 0);
}

function updateMotionKeyframeFromCurrent(clip, index) {
  const keyframe = clip?.keyframes?.[index];
  if (!clip || !keyframe) return;
  const time = Number(keyframe.time || 0);
  keyframe.params = snapshotParams();
  clip.keyframes = normalizeMotionKeyframes(clip.keyframes, clip.duration);
  renderMotionControls(clip.id);
  setMotionTime(time, true);
  commitHistory(`update motion key ${clip.id}`);
}

function updateMotionKeyframeTime(clip, index, nextTime) {
  const keyframe = clip?.keyframes?.[index];
  if (!clip || !keyframe) return;
  const duration = clamp(clip.duration || 2, 0.1, 30);
  const time = Number(clamp(nextTime, 0, duration).toFixed(3));
  keyframe.time = time;
  clip.keyframes = normalizeMotionKeyframes(clip.keyframes, duration);
  renderMotionControls(clip.id);
  setMotionTime(time, true, clip);
  commitHistory(`motion key time ${clip.id}`);
}

function mirrorMotionKeyframe(clip, index) {
  const keyframe = clip?.keyframes?.[index];
  if (!clip || !keyframe) return;
  keyframe.params = mirrorMotionKeyParams(keyframe.params || {});
  const time = Number(keyframe.time || 0);
  clip.keyframes = normalizeMotionKeyframes(clip.keyframes, clip.duration);
  renderMotionControls(clip.id);
  setMotionTime(time, true, clip);
  commitHistory(`mirror motion key ${clip.id}`);
  showToast(`Mirrored motion key at ${formatMotionTime(time)}.`);
}

function mirrorMotionKeyParams(params) {
  const source = normalizePresetParams(params || {});
  const mirrored = {};
  for (const param of allParameterDefs()) {
    if (!Number.isFinite(Number(source[param.key]))) continue;
    mirrored[param.key] = mirrorMotionParameterValue(param, source[param.key]);
  }
  return mirrored;
}

function mirrorMotionParameterValue(param, value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return value;
  const role = parameterSemanticRole(param);
  if (role === "gaze_x" || role === "tilt") return Number((-numberValue).toFixed(4));
  return mirrorParameterKeyValue(param?.key, numberValue);
}

function copyMotionKeyframe(clip, index) {
  const keyframe = clip?.keyframes?.[index];
  if (!clip || !keyframe) return;
  const params = normalizePresetParams(keyframe.params || {});
  motionKeyClipboard = {
    easing: normalizeMotionEasing(keyframe.easing),
    params
  };
  elements.pasteMotionKey.disabled = false;
  showToast(`Copied motion key at ${formatMotionTime(keyframe.time)}.`);
}

function pasteMotionKeyframeAtCurrent() {
  const clip = activeMotionClip();
  if (!clip) {
    showToast("Create a motion clip first.");
    return;
  }
  if (!motionKeyClipboard) {
    showToast("Copy a motion key first.");
    return;
  }
  const time = Number(clamp(elements.motionTime.value || 0, 0, clip.duration).toFixed(3));
  const index = clip.keyframes.findIndex((entry) => Math.abs(Number(entry.time) - time) <= 0.005);
  const nextKeyframe = {
    time,
    easing: normalizeMotionEasing(motionKeyClipboard.easing),
    params: normalizePresetParams(motionKeyClipboard.params || {})
  };
  upsertMotionKeyframe(clip, nextKeyframe, index);
  renderMotionControls(clip.id);
  setMotionTime(time, true, clip);
  commitHistory(`paste motion key ${clip.id}`);
  showToast(`Pasted motion key at ${formatMotionTime(time)}.`);
}

function renderMotionTimeline(clip) {
  elements.motionTimeline.innerHTML = "";
  if (!clip) {
    elements.motionTimeline.classList.add("disabled");
    const empty = document.createElement("div");
    empty.className = "motion-timeline-empty";
    empty.textContent = ko("No motion timeline");
    elements.motionTimeline.append(empty);
    return;
  }

  elements.motionTimeline.classList.remove("disabled");
  const duration = clamp(clip.duration || 2, 0.1, 30);
  const currentTime = clamp(elements.motionTime.value || 0, 0, duration);
  const track = document.createElement("div");
  track.className = "motion-timeline-track";
  track.addEventListener("pointerdown", startMotionTimelineScrub);

  for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
    const tick = document.createElement("div");
    tick.className = "motion-timeline-tick";
    tick.style.left = `${ratio * 100}%`;
    tick.textContent = ratio === 0 || ratio === 1 ? formatMotionTime(duration * ratio) : "";
    track.append(tick);
  }

  const scrubber = document.createElement("div");
  scrubber.className = "motion-timeline-scrubber";
  track.append(scrubber);

  clip.keyframes.forEach((keyframe, index) => {
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "motion-timeline-key";
    marker.dataset.time = String(keyframe.time);
    marker.dataset.keyIndex = String(index);
    marker.style.left = `${motionTimelinePercent(keyframe.time, duration)}%`;
    marker.title = `${formatMotionTime(keyframe.time)} · ${ko(normalizeMotionEasing(keyframe.easing))}`;
    marker.setAttribute("aria-label", `모션 키 ${formatMotionTime(keyframe.time)}`);
    marker.addEventListener("pointerdown", (event) => startMotionKeyTimelineDrag(event, clip.id, index));
    track.append(marker);
  });

  elements.motionTimeline.append(track);
  updateMotionTimelineSelection(clip, currentTime);
}

function motionTimelinePercent(time, duration) {
  return clamp(Number(time || 0) / Math.max(0.001, Number(duration || 1)), 0, 1) * 100;
}

function updateMotionTimelineSelection(clip, time) {
  const duration = clip ? clamp(clip.duration || 2, 0.1, 30) : 2;
  const currentTime = clamp(time || 0, 0, duration);
  const scrubber = elements.motionTimeline.querySelector(".motion-timeline-scrubber");
  if (scrubber) scrubber.style.left = `${motionTimelinePercent(currentTime, duration)}%`;
  for (const marker of elements.motionTimeline.querySelectorAll(".motion-timeline-key")) {
    const keyTime = Number(marker.dataset.time || 0);
    marker.classList.toggle("active", Math.abs(keyTime - currentTime) <= 0.015);
  }
  for (const row of elements.motionKeyList.querySelectorAll(".motion-key-row")) {
    const keyTime = Number(row.dataset.time || 0);
    row.classList.toggle("active", Math.abs(keyTime - currentTime) <= 0.015);
  }
  updateMotionCurveSelection(clip, currentTime);
}

function renderMotionCurvePanel(clip) {
  elements.motionCurvePanel.innerHTML = "";
  if (!clip || !Array.isArray(clip.keyframes) || clip.keyframes.length === 0) {
    elements.motionCurvePanel.classList.add("disabled");
    const empty = document.createElement("div");
    empty.className = "motion-curve-empty";
    empty.textContent = ko("No parameter curves");
    elements.motionCurvePanel.append(empty);
    return;
  }

  const params = motionCurveParameters(clip);
  if (params.length === 0) {
    elements.motionCurvePanel.classList.add("disabled");
    const empty = document.createElement("div");
    empty.className = "motion-curve-empty";
    empty.textContent = ko("No keyed parameters");
    elements.motionCurvePanel.append(empty);
    return;
  }

  elements.motionCurvePanel.classList.remove("disabled");
  const duration = clamp(clip.duration || 2, 0.1, 30);
  const width = 720;
  const left = 120;
  const right = 18;
  const top = 18;
  const laneHeight = 36;
  const height = top + params.length * laneHeight + 16;
  const sampleCount = Math.max(24, Math.min(96, Math.round(duration * 32)));
  const svg = createSvgElement("svg");
  svg.classList.add("motion-curve-svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.style.height = `${height}px`;
  svg.setAttribute("preserveAspectRatio", "none");

  for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
    const x = left + (width - left - right) * ratio;
    const tick = createSvgElement("line");
    tick.classList.add("motion-curve-tick");
    tick.setAttribute("x1", String(x));
    tick.setAttribute("x2", String(x));
    tick.setAttribute("y1", "6");
    tick.setAttribute("y2", String(height - 8));
    svg.append(tick);
    if (ratio === 0 || ratio === 1) {
      const label = createSvgElement("text");
      label.classList.add("motion-curve-time-label");
      label.setAttribute("x", String(x));
      label.setAttribute("y", "12");
      label.setAttribute("text-anchor", ratio === 0 ? "start" : "end");
      label.textContent = formatMotionTime(duration * ratio);
      svg.append(label);
    }
  }

  params.forEach((param, index) => {
    const yMid = top + index * laneHeight + laneHeight / 2;
    const lane = createSvgElement("line");
    lane.classList.add("motion-curve-lane");
    lane.setAttribute("x1", String(left));
    lane.setAttribute("x2", String(width - right));
    lane.setAttribute("y1", String(yMid));
    lane.setAttribute("y2", String(yMid));
    svg.append(lane);

    const label = createSvgElement("text");
    label.classList.add("motion-curve-param-label");
    label.setAttribute("x", "10");
    label.setAttribute("y", String(yMid - 4));
    label.textContent = ko(param.label || param.key);
    svg.append(label);

    const range = createSvgElement("text");
    range.classList.add("motion-curve-range-label");
    range.setAttribute("x", "10");
    range.setAttribute("y", String(yMid + 10));
    range.textContent = `${formatParamValue(param.min, param)} / ${formatParamValue(param.max, param)}`;
    svg.append(range);

    const points = [];
    for (let sampleIndex = 0; sampleIndex <= sampleCount; sampleIndex += 1) {
      const sampleTime = duration * (sampleIndex / sampleCount);
      const sampleParams = interpolatedMotionParams(clip, sampleTime);
      const value = motionCurveSampleValue(param, sampleParams);
      const x = left + (width - left - right) * (sampleTime / duration);
      const y = motionCurveY(param, value, yMid, laneHeight);
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }

    const path = createSvgElement("polyline");
    path.classList.add("motion-curve-line");
    path.setAttribute("points", points.join(" "));
    svg.append(path);

    for (const keyframe of clip.keyframes) {
      const value = Number(keyframe.params?.[param.key]);
      if (!Number.isFinite(value)) continue;
      const dot = createSvgElement("circle");
      dot.classList.add("motion-curve-key");
      dot.setAttribute("cx", String(left + (width - left - right) * (clamp(keyframe.time || 0, 0, duration) / duration)));
      dot.setAttribute("cy", String(motionCurveY(param, value, yMid, laneHeight)));
      dot.setAttribute("r", "3");
      svg.append(dot);
    }
  });

  const current = createSvgElement("line");
  current.classList.add("motion-curve-current");
  current.setAttribute("y1", "6");
  current.setAttribute("y2", String(height - 8));
  svg.append(current);

  elements.motionCurvePanel.append(svg);
  updateMotionCurveSelection(clip, Number(elements.motionTime.value || 0));
}

function motionCurveParameters(clip) {
  const keyed = new Map();
  for (const keyframe of normalizeMotionKeyframes(clip.keyframes, clip.duration)) {
    for (const [key, value] of Object.entries(keyframe.params || {})) {
      const numberValue = Number(value);
      if (!Number.isFinite(numberValue)) continue;
      if (!keyed.has(key)) keyed.set(key, []);
      keyed.get(key).push(numberValue);
    }
  }
  return allParameterDefs()
    .filter((param) => keyed.has(param.key))
    .map((param) => {
      const values = keyed.get(param.key) || [];
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      return {
        ...param,
        variation: Math.abs(maxValue - minValue),
        keyCount: values.length
      };
    })
    .sort((a, b) => (b.variation - a.variation) || (b.keyCount - a.keyCount) || String(a.label).localeCompare(String(b.label)))
    .slice(0, 10);
}

function motionCurveSampleValue(param, params) {
  const value = Number(params?.[param.key]);
  if (Number.isFinite(value)) return value;
  const fallback = Number(rig.params?.[param.key] ?? 0);
  return Number.isFinite(fallback) ? fallback : 0;
}

function motionCurveY(param, value, yMid, laneHeight) {
  const min = Number.isFinite(Number(param.min)) ? Number(param.min) : -100;
  const max = Number.isFinite(Number(param.max)) ? Number(param.max) : 100;
  const span = Math.max(0.001, max - min);
  const ratio = clamp((Number(value || 0) - min) / span, 0, 1);
  return yMid + ((0.5 - ratio) * Math.max(12, laneHeight - 12));
}

function updateMotionCurveSelection(clip, time) {
  const marker = elements.motionCurvePanel.querySelector(".motion-curve-current");
  if (!marker) return;
  const duration = clip ? clamp(clip.duration || 2, 0.1, 30) : 2;
  const x = 120 + (720 - 120 - 18) * (clamp(time || 0, 0, duration) / duration);
  marker.setAttribute("x1", String(x));
  marker.setAttribute("x2", String(x));
}

function createSvgElement(tagName) {
  return document.createElementNS("http://www.w3.org/2000/svg", tagName);
}

function startMotionTimelineScrub(event) {
  if (event.target.closest(".motion-timeline-key")) return false;
  const clip = activeMotionClip();
  if (!clip) return false;
  motionTimelineScrubState = {
    clipId: clip.id,
    track: event.currentTarget,
    duration: clamp(clip.duration || 2, 0.1, 30),
    pointerId: event.pointerId
  };
  event.currentTarget.setPointerCapture?.(event.pointerId);
  updateMotionTimelineScrub(event);
  event.preventDefault();
  return true;
}

function startMotionKeyTimelineDrag(event, clipId, keyIndex) {
  const clip = activeMotionClip();
  if (!clip || clip.id !== clipId) return false;
  const keyframe = clip.keyframes[keyIndex];
  if (!keyframe) return false;
  const marker = event.currentTarget;
  const track = marker.closest(".motion-timeline-track");
  motionKeyDragState = {
    clipId,
    clip,
    keyframe,
    marker,
    track,
    duration: clamp(clip.duration || 2, 0.1, 30),
    startTime: Number(keyframe.time || 0),
    pointerId: event.pointerId,
    moved: false
  };
  marker.setPointerCapture?.(event.pointerId);
  setMotionTime(keyframe.time, true, clip);
  event.preventDefault();
  event.stopPropagation();
  return true;
}

function updateMotionTimelineDrag(event) {
  if (motionKeyDragState) {
    updateMotionKeyTimelineDrag(event);
    return;
  }
  if (motionTimelineScrubState) updateMotionTimelineScrub(event);
}

function updateMotionTimelineScrub(event) {
  if (!motionTimelineScrubState) return false;
  const clip = getMotionClips().find((entry) => entry.id === motionTimelineScrubState.clipId);
  if (!clip) return false;
  const time = timelineTimeFromEvent(event, motionTimelineScrubState.track, motionTimelineScrubState.duration);
  setMotionTime(time, true);
  event.preventDefault();
  return true;
}

function updateMotionKeyTimelineDrag(event) {
  if (!motionKeyDragState) return false;
  const clip = motionKeyDragState.clip;
  if (!clip) return false;
  const time = timelineTimeFromEvent(event, motionKeyDragState.track, motionKeyDragState.duration);
  if (Math.abs(time - motionKeyDragState.startTime) > 0.005) motionKeyDragState.moved = true;
  motionKeyDragState.keyframe.time = time;
  motionKeyDragState.marker.dataset.time = String(time);
  motionKeyDragState.marker.style.left = `${motionTimelinePercent(time, motionKeyDragState.duration)}%`;
  motionKeyDragState.marker.title = `${formatMotionTime(time)} · ${normalizeMotionEasing(motionKeyDragState.keyframe.easing)}`;
  setMotionTime(time, true, clip);
  event.preventDefault();
  return true;
}

function endMotionTimelineDrag(event) {
  if (motionKeyDragState) {
    const { clip, clipId, moved, marker, pointerId } = motionKeyDragState;
    marker.releasePointerCapture?.(pointerId);
    motionKeyDragState = null;
    if (clip) {
      clip.keyframes = normalizeMotionKeyframes(clip.keyframes, clip.duration);
      renderMotionControls(clip.id);
      if (moved) commitHistory(`move motion key ${clip.id}`);
    }
    event.preventDefault();
    return true;
  }
  if (motionTimelineScrubState) {
    const { track, pointerId } = motionTimelineScrubState;
    track.releasePointerCapture?.(pointerId);
    motionTimelineScrubState = null;
    event.preventDefault();
    return true;
  }
  return false;
}

function timelineTimeFromEvent(event, track, duration) {
  const rect = track.getBoundingClientRect();
  const ratio = (event.clientX - rect.left) / Math.max(1, rect.width);
  return Number(clamp(ratio * duration, 0, duration).toFixed(3));
}

function formatMotionTime(value) {
  return `${Number(value || 0).toFixed(2)}s`;
}

function motionOnionSkinStep() {
  return Number(clamp(Number(elements.motionOnionStep.value || 0.18), 0.02, 5).toFixed(3));
}

function wrappedMotionTime(time, duration) {
  const safeDuration = Math.max(0.001, Number(duration || 0));
  return ((Number(time || 0) % safeDuration) + safeDuration) % safeDuration;
}

function normalizeMotionFrameCount(value, fallback = 4) {
  const source = Number.isFinite(Number(value)) ? Number(value) : fallback;
  return Math.round(clamp(source, 1, 24));
}

function recommendedMotionFrameCount(clip, fallback = elements.motionFrameCount.value || 4) {
  if (Number.isFinite(Number(clip?.exportFrames))) {
    return normalizeMotionFrameCount(clip.exportFrames, fallback);
  }
  if (clip?.id === "adaptive_pose") return 7;
  if (clip?.id === "idle_loop") return 6;
  if (clip?.id === "talk_loop") return 8;
  return normalizeMotionFrameCount(fallback, 4);
}

function motionFrameTimesForClip(clip, frameCount = recommendedMotionFrameCount(clip)) {
  if (!clip || !Array.isArray(clip.keyframes) || clip.keyframes.length === 0) return [];
  const count = normalizeMotionFrameCount(frameCount, 4);
  const duration = Math.max(0.1, Number(clip.duration || 2));
  return Array.from({ length: count }, (_, index) => Number(((duration * index) / count).toFixed(3)));
}

function createMotionClip() {
  const label = window.prompt("모션 클립 이름", "대기");
  if (label === null) return;
  const cleanLabel = label.trim() || "Idle";
  const clips = getMotionClips();
  const id = uniqueMotionClipId(safeSegment(cleanLabel, "motion"), clips);
  const clip = {
    id,
    label: cleanLabel,
    duration: 2,
    keyframes: [{ time: 0, easing: "smoothstep", params: snapshotParams() }]
  };
  rig.motionClips = [...clips, clip];
  renderMotionControls(id);
  commitHistory(`create motion ${id}`);
  showToast(`Motion clip created: ${cleanLabel}`);
}

function renameCurrentMotionClip() {
  const selectedId = elements.motionClipSelect.value;
  const clips = getMotionClips();
  const clipIndex = Math.max(0, clips.findIndex((entry) => entry.id === selectedId));
  const clip = clips[clipIndex] || null;
  if (!clip) return;
  const currentLabel = clip.label || clip.id || "Motion";
  const label = window.prompt("모션 클립 표시 이름", currentLabel);
  if (label === null) return;
  const cleanLabel = label.trim() || currentLabel;
  const idValue = window.prompt("모션 클립 ID", clip.id || safeSegment(cleanLabel, "motion"));
  if (idValue === null) return;
  const oldId = clip.id;
  const siblingClips = clips.filter((_, index) => index !== clipIndex);
  const nextId = uniqueMotionClipId(safeSegment(idValue, oldId || safeSegment(cleanLabel, "motion")), siblingClips);
  stopMotionPlayback(false);
  clip.id = nextId;
  clip.label = cleanLabel;
  if (oldId === "adaptive_pose" || nextId === "adaptive_pose") dialoguePosePreviewIndex = -1;
  rig.motionClips = normalizeMotionClips(clips);
  renderMotionControls(nextId);
  commitHistory(`rename motion ${oldId || nextId}`);
  showToast(`Motion renamed: ${cleanLabel} · ${nextId}`);
}

function duplicateCurrentMotionClip() {
  const selectedId = elements.motionClipSelect.value;
  const clips = getMotionClips();
  const clip = clips.find((entry) => entry.id === selectedId) || clips[0] || null;
  if (!clip) return;
  const label = window.prompt("복제할 모션 이름", `${clip.label || clip.id || "Motion"} 복사`);
  if (label === null) return;
  const cleanLabel = label.trim() || `${clip.label || clip.id || "Motion"} Copy`;
  const duration = clamp(clip.duration || 2, 0.1, 30);
  const clone = {
    id: uniqueMotionClipId(safeSegment(`${clip.id || cleanLabel}_copy`, "motion_copy"), clips),
    label: cleanLabel,
    duration,
    keyframes: cloneMotionKeyframes(clip.keyframes, duration)
  };
  if (Number.isFinite(Number(clip.exportFrames))) {
    clone.exportFrames = normalizeMotionFrameCount(clip.exportFrames, recommendedMotionFrameCount(clip));
  }
  stopMotionPlayback(false);
  rig.motionClips = [...clips, clone];
  renderMotionControls(clone.id);
  setMotionTime(clamp(elements.motionTime.value || 0, 0, duration), true, clone);
  commitHistory(`duplicate motion ${clip.id}`);
  showToast(`Motion duplicated: ${cleanLabel}`);
}

function exportCurrentMotionClipJson() {
  const clip = activeMotionClip();
  if (!clip) {
    showToast("Create a motion clip first.");
    return;
  }
  downloadJson(
    `${safeSegment(rig.character.displayName, "character")}.${safeSegment(clip.id, "motion")}.motion-clip.json`,
    {
      app: "tools/portrait-rig-editor",
      kind: "motion_clip",
      version: 1,
      exportedAt: new Date().toISOString(),
      clip: motionClipForJsonExport(clip)
    }
  );
  showToast(`Exported motion clip JSON: ${clip.label || clip.id}`);
}

function exportAllMotionClipsJson() {
  const clips = getMotionClips();
  if (clips.length === 0) {
    showToast("Create a motion clip first.");
    return;
  }
  downloadJson(
    `${safeSegment(rig.character.displayName, "character")}.motion-clips.json`,
    {
      app: "tools/portrait-rig-editor",
      kind: "motion_clip_set",
      version: 1,
      exportedAt: new Date().toISOString(),
      clips: clips.map(motionClipForJsonExport)
    }
  );
  showToast(`Exported ${clips.length} motion clip JSON entries.`);
}

function motionClipForJsonExport(clip) {
  const duration = clamp(clip?.duration || 2, 0.1, 30);
  const exported = {
    id: safeSegment(clip?.id || clip?.label || "motion", "motion"),
    label: String(clip?.label || clip?.id || "Motion"),
    duration: Number(duration.toFixed(3)),
    keyframes: cloneMotionKeyframes(clip?.keyframes || [], duration)
  };
  if (Number.isFinite(Number(clip?.exportFrames))) {
    exported.exportFrames = normalizeMotionFrameCount(clip.exportFrames, recommendedMotionFrameCount(clip));
  }
  return exported;
}

function downloadJson(filename, payload) {
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function importMotionClipsFromFiles(files) {
  const fileList = Array.from(files || []);
  if (fileList.length === 0) return;
  const imported = [];
  for (const file of fileList) {
    const parsed = JSON.parse(await file.text());
    imported.push(...motionClipsFromImportPayload(parsed));
  }
  const normalized = normalizeMotionClips(imported);
  if (normalized.length === 0) {
    showToast("No motion clips found in JSON.");
    return;
  }

  stopMotionPlayback(false);
  const nextClips = [...getMotionClips()];
  const importedIds = [];
  for (const clip of normalized) {
    const duration = clamp(clip.duration || 2, 0.1, 30);
    const nextId = uniqueMotionClipId(safeSegment(clip.id || clip.label || "motion", "motion"), nextClips);
    const nextClip = {
      id: nextId,
      label: clip.label || nextId,
      duration,
      keyframes: cloneMotionKeyframes(clip.keyframes || [], duration)
    };
    if (Number.isFinite(Number(clip.exportFrames))) {
      nextClip.exportFrames = normalizeMotionFrameCount(clip.exportFrames, recommendedMotionFrameCount(clip));
    }
    nextClips.push(nextClip);
    importedIds.push(nextId);
  }

  rig.motionClips = normalizeMotionClips(nextClips);
  const selectedId = importedIds[importedIds.length - 1] || rig.motionClips[0]?.id || "";
  renderMotionControls(selectedId);
  const selectedClip = activeMotionClip();
  setMotionTime(0, true, selectedClip);
  commitHistory(`import motion clips ${importedIds.join(",")}`);
  showToast(`Imported ${importedIds.length} motion clip${importedIds.length === 1 ? "" : "s"}.`);
}

function motionClipsFromImportPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.clips)) return payload.clips;
  if (Array.isArray(payload.motionClips)) return payload.motionClips;
  if (Array.isArray(payload.motions)) return payload.motions;
  if (payload.clip && typeof payload.clip === "object" && !Array.isArray(payload.clip)) return [payload.clip];
  if (payload.motionClip && typeof payload.motionClip === "object" && !Array.isArray(payload.motionClip)) return [payload.motionClip];
  if (Array.isArray(payload.keyframes) || Array.isArray(payload.keys)) return [payload];
  return [];
}

function cloneMotionKeyframes(keyframes, duration) {
  return normalizeMotionKeyframes((Array.isArray(keyframes) ? keyframes : []).map((keyframe) => ({
    time: keyframe.time,
    easing: keyframe.easing,
    params: { ...(keyframe.params || {}) }
  })), duration);
}

function uniqueMotionClipId(baseId, clips = getMotionClips()) {
  if (!clips.some((entry) => entry.id === baseId)) return baseId;
  let index = 2;
  while (clips.some((entry) => entry.id === `${baseId}_${index}`)) index += 1;
  return `${baseId}_${index}`;
}

function generateAutoMotionClip(kind) {
  const recipe = kind === "talk"
    ? autoTalkMotionRecipe()
    : (kind === "viseme" ? autoVisemeMotionRecipe() : autoIdleMotionRecipe());
  const clip = upsertAutoMotionRecipe(recipe, { confirmReplace: true });
  if (!clip) return;
  stopMotionPlayback(false);
  elements.motionFrameCount.value = String(recipe.exportFrames);
  renderMotionControls(recipe.id);
  setMotionTime(0, true);
  commitHistory(`auto motion ${recipe.id}`);
  showToast(`${recipe.label} generated. Export ${recipe.exportFrames} frames for adaptive dialogue poses.`);
}

function buildAdaptivePoseClip() {
  const recipe = autoAdaptivePoseRecipe();
  const clip = upsertAutoMotionRecipe(recipe, { confirmReplace: true });
  if (!clip) return;
  stopMotionPlayback(false);
  dialoguePosePreviewIndex = -1;
  elements.motionFrameCount.value = String(recipe.exportFrames);
  renderMotionControls(clip.id);
  setMotionTime(0, true, clip);
  commitHistory("adaptive pose clip");
  showToast(`${recipe.label} generated. Use Next Pose to preview dialogue advance.`);
}

function previewDialoguePoseStep(direction) {
  const { clip, createdClip } = ensureAdaptivePosePreviewClip();
  if (!clip) return;
  const frameTimes = motionFrameTimesForClip(clip, recommendedMotionFrameCount(clip));
  if (frameTimes.length === 0) {
    showToast("No adaptive pose frames to preview.");
    return;
  }
  stopMotionPlayback(false);
  if (dialoguePosePreviewIndex < 0) {
    dialoguePosePreviewIndex = direction < 0 ? frameTimes.length - 1 : 0;
  } else {
    dialoguePosePreviewIndex = (dialoguePosePreviewIndex + direction + frameTimes.length) % frameTimes.length;
  }
  renderMotionControls(clip.id);
  setMotionTime(frameTimes[dialoguePosePreviewIndex], true, clip);
  renderDialoguePosePreviewStatus();
  if (createdClip) commitHistory("adaptive pose clip");
}

function previewDialoguePoseHint() {
  const hint = safeSegment(elements.dialoguePoseHint.value || "happy", "happy");
  const { clip, createdClip } = ensureAdaptivePosePreviewClip();
  if (!clip) return;
  const frameTimes = motionFrameTimesForClip(clip, recommendedMotionFrameCount(clip));
  const match = bestDialoguePoseFrameForHint(clip, frameTimes, hint);
  if (!match) {
    showToast("No adaptive pose frames to preview.");
    return;
  }
  stopMotionPlayback(false);
  dialoguePosePreviewIndex = match.index;
  renderMotionControls(clip.id);
  setMotionTime(match.time, true, clip);
  renderDialoguePosePreviewStatus();
  if (createdClip) commitHistory("adaptive pose clip");
  showToast(`Best ${hint}: pose ${match.index + 1} · score ${formatCompactNumber(match.score)}`);
}

function previewDialogueTextPose() {
  const hints = inferDialoguePoseHintsFromText(elements.dialoguePoseText?.value || "");
  if (hints.length === 0) {
    showToast("Enter a dialogue line to preview.");
    return;
  }
  const { clip, createdClip } = ensureAdaptivePosePreviewClip();
  if (!clip) return;
  const frameTimes = motionFrameTimesForClip(clip, recommendedMotionFrameCount(clip));
  const match = bestDialoguePoseFrameForHints(clip, frameTimes, hints);
  if (!match) {
    showToast("No adaptive pose frames to preview.");
    return;
  }
  stopMotionPlayback(false);
  dialoguePosePreviewIndex = match.index;
  renderMotionControls(clip.id);
  setMotionTime(match.time, true, clip);
  renderDialoguePosePreviewStatus();
  if (createdClip) commitHistory("adaptive pose clip");
  showToast(`Line pose: ${formatDialoguePoseHintSet(hints)} · pose ${match.index + 1}`);
}

function ensureAdaptivePosePreviewClip() {
  let clip = getMotionClips().find((entry) => entry.id === "adaptive_pose") || null;
  let createdClip = false;
  if (!clip) {
    const recipe = autoAdaptivePoseRecipe();
    clip = upsertAutoMotionRecipe(recipe, { confirmReplace: false });
    if (!clip) return { clip: null, createdClip: false };
    createdClip = true;
    elements.motionFrameCount.value = String(recipe.exportFrames);
  }
  return { clip, createdClip };
}

function bestDialoguePoseFrameForHint(clip, frameTimes, hint) {
  return bestDialoguePoseFrameForHints(clip, frameTimes, [hint]);
}

function bestDialoguePoseFrameForHints(clip, frameTimes, hints) {
  const cleanHints = normalizeDialoguePoseHints(hints);
  const currentIndex = dialoguePosePreviewIndex >= 0 ? dialoguePosePreviewIndex : -1;
  const candidates = frameTimes.map((time, index) => {
    const params = interpolatedMotionParams(clip, time);
    const metadata = semanticPoseMetadata(params, clip, time);
    const score = dialoguePoseHintScoreForHints(metadata, cleanHints, index, currentIndex);
    return { index, time, score, metadata };
  });
  return candidates
    .filter((candidate) => Number.isFinite(candidate.score))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      const leftDistance = currentIndex >= 0 ? Math.abs(left.index - currentIndex) : left.index;
      const rightDistance = currentIndex >= 0 ? Math.abs(right.index - currentIndex) : right.index;
      if (leftDistance !== rightDistance) return rightDistance - leftDistance;
      return left.index - right.index;
    })[0] || null;
}

function dialoguePoseHintScoreForHints(metadata, hints, index, currentIndex) {
  const cleanHints = normalizeDialoguePoseHints(hints);
  if (cleanHints.length === 0) return 0;
  let total = 0;
  cleanHints.forEach((hint, hintIndex) => {
    const weight = hintIndex === 0 ? 1 : Math.max(0.38, 0.82 - hintIndex * 0.11);
    total += dialoguePoseHintScore(metadata, hint, index, currentIndex) * weight;
  });
  return Number(total.toFixed(4));
}

function dialoguePoseHintScore(metadata, hint, index, currentIndex) {
  const cleanHint = normalizeDialoguePoseHint(hint);
  if (!cleanHint) return 0;
  const tags = Array.isArray(metadata?.poseTags) ? metadata.poseTags : [];
  const scores = metadata?.poseScore && typeof metadata.poseScore === "object" && !Array.isArray(metadata.poseScore)
    ? metadata.poseScore
    : {};
  const requestedTags = expandedDialoguePoseHintTags([cleanHint]);
  const matchScore = requestedTags.reduce((total, tag) => (
    total
    + (tags.includes(tag) ? 0.55 : 0)
    + Number(scores[tag] || 0)
  ), 0);
  const energyScore = Number(scores.motion || 0) * (cleanHint === "motion" ? 0.45 : 0.03);
  const indexPenalty = index === currentIndex ? 0.08 : 0;
  return Number((matchScore + energyScore - indexPenalty).toFixed(4));
}

function inferDialoguePoseHintsFromText(text) {
  const source = String(text || "").trim();
  if (!source) return [];
  const lower = source.toLowerCase();
  const hints = [];
  const add = (...values) => {
    for (const value of values) {
      const hint = normalizeDialoguePoseHint(value);
      if (hint && !hints.includes(hint)) hints.push(hint);
    }
  };

  if (containsSpeechCodepoint(source)) add("talk", "open_mouth");
  if (textContainsAny(lower, ["하하", "ㅎㅎ", "웃", "기쁘", "좋아", "고마", "다행", "happy", "smile", "laugh"])) add("happy", "smile");
  if (textContainsAny(lower, ["미안", "슬프", "눈물", "외로", "아파", "sad", "sorry"])) add("sad");
  if (textContainsAny(lower, ["화", "짜증", "싫", "그만", "angry", "mad"])) add("angry", "serious");
  if (textContainsAny(lower, ["걱정", "불안", "무서", "떨", "worried", "afraid", "scared"])) add("worried", "serious");
  if (textContainsAny(lower, ["놀라", "잠깐", "뭐라고", "surprise", "surprised", "shock"]) || /!|！/.test(source)) add("surprised");
  if (textContainsAny(lower, ["왜", "뭐", "어째서", "정말", "혹시", "question", "why"]) || /\?|？/.test(source)) add("curious");
  if (textContainsAny(lower, ["진지", "조용", "생각", "serious"]) || source.includes("...") || source.includes("…")) add("serious");

  const visemeHint = dominantDialogueVisemeHint(source);
  if (visemeHint) add(visemeHint);
  if (hints.length === 0) add("neutral");
  return hints.slice(0, 6);
}

function normalizeDialoguePoseHints(values) {
  const result = [];
  const source = Array.isArray(values) ? values : [values];
  for (const value of source) {
    const hint = normalizeDialoguePoseHint(value);
    if (hint && !result.includes(hint)) result.push(hint);
  }
  return result;
}

function normalizeDialoguePoseHint(value) {
  const lower = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return safeSegment(lower, "");
}

function textContainsAny(text, needles) {
  return needles.some((needle) => text.includes(String(needle).toLowerCase()));
}

function containsSpeechCodepoint(text) {
  for (const character of String(text || "")) {
    const code = character.codePointAt(0) || 0;
    if ((code >= 0xAC00 && code <= 0xD7A3) || /[a-zA-Z0-9]/.test(character)) return true;
  }
  return false;
}

function dominantDialogueVisemeHint(text) {
  const counts = new Map();
  for (const character of String(text || "")) {
    const viseme = dialogueVisemeNameForCharacter(character);
    if (!viseme) continue;
    counts.set(viseme, (counts.get(viseme) || 0) + 1);
  }
  let best = "";
  let bestCount = 0;
  for (const [viseme, count] of counts.entries()) {
    if (count > bestCount) {
      best = viseme;
      bestCount = count;
    }
  }
  return best ? `viseme_${best}` : "";
}

function dialogueVisemeNameForCharacter(character) {
  if (!character) return "";
  const code = character.codePointAt(0) || 0;
  if (isDialogueVisemeSilentCodepoint(code)) return "";
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const syllableIndex = code - 0xAC00;
    const medialIndex = Math.floor(syllableIndex / 28) % 21;
    if ([0, 1, 2, 3, 4, 5, 6, 7].includes(medialIndex)) return "a";
    if ([8, 9, 10, 11, 12].includes(medialIndex)) return "o";
    if ([13, 14, 15, 16, 17, 18].includes(medialIndex)) return "u";
    if ([19, 20].includes(medialIndex)) return "i";
    return "a";
  }
  const lower = character.toLowerCase();
  if (["a", "e"].includes(lower)) return "a";
  if (["i", "y"].includes(lower)) return "i";
  if (lower === "o") return "o";
  if (["u", "w"].includes(lower)) return "u";
  if (["b", "m", "p"].includes(lower)) return "closed";
  return "";
}

function isDialogueVisemeSilentCodepoint(code) {
  if (code <= 32) return true;
  return [
    33, 34, 39, 40, 41, 44, 45, 46, 58, 59, 63,
    0x3000, 0x3001, 0x3002, 0xFF01, 0xFF0C, 0xFF0E, 0xFF1F
  ].includes(code);
}

function expandedDialoguePoseHintTags(tags) {
  const expanded = [];
  const add = (values) => {
    for (const value of values) {
      if (expanded.length >= 32) return;
      const tag = safeSegment(value, "");
      if (tag && !expanded.includes(tag)) expanded.push(tag);
    }
  };
  for (const tag of tags) {
    add([tag]);
    switch (tag) {
      case "happy":
      case "joy":
      case "smile":
        add(["happy", "smile", "laugh"]);
        break;
      case "laugh":
        add(["laugh", "happy", "smile", "open_mouth"]);
        break;
      case "sad":
        add(["sad", "worried", "serious"]);
        break;
      case "angry":
      case "mad":
        add(["serious", "worried", "look_down"]);
        break;
      case "surprise":
      case "surprised":
      case "shock":
        add(["surprised", "open_mouth"]);
        break;
      case "question":
      case "curious":
      case "doubt":
        add(["squint", "look_left", "look_right", "serious"]);
        break;
      case "talk":
      case "speak":
        add(["talk", "open_mouth"]);
        break;
      case "open_mouth":
        add(["open_mouth", "talk", "surprised"]);
        break;
      case "closed_mouth":
        add(["closed_mouth", "viseme_closed", "neutral"]);
        break;
      case "viseme":
      case "phoneme":
        add(["viseme", "phoneme", "talk"]);
        break;
      case "viseme_a":
        add(["viseme_a", "viseme", "phoneme", "talk", "open_mouth"]);
        break;
      case "viseme_i":
        add(["viseme_i", "viseme", "phoneme", "talk", "smile"]);
        break;
      case "viseme_o":
        add(["viseme_o", "viseme", "phoneme", "talk", "open_mouth"]);
        break;
      case "viseme_u":
        add(["viseme_u", "viseme", "phoneme", "talk"]);
        break;
      case "viseme_closed":
        add(["viseme_closed", "closed_mouth", "viseme", "phoneme"]);
        break;
      case "blink":
        add(["blink", "squint"]);
        break;
      case "squint":
        add(["squint", "blink", "curious"]);
        break;
      case "serious":
        add(["serious", "worried", "look_down"]);
        break;
      case "worried":
        add(["worried", "serious", "sad"]);
        break;
      case "motion":
        add(["motion", "look_left", "look_right", "tilt_left", "tilt_right"]);
        break;
      case "look_left":
        add(["look_left", "motion"]);
        break;
      case "look_right":
        add(["look_right", "motion"]);
        break;
      case "look_up":
        add(["look_up", "motion", "surprised"]);
        break;
      case "look_down":
        add(["look_down", "serious", "motion"]);
        break;
      case "tilt_left":
        add(["tilt_left", "motion"]);
        break;
      case "tilt_right":
        add(["tilt_right", "motion"]);
        break;
      default:
        add([tag]);
        break;
    }
  }
  return expanded;
}

function resetDialoguePosePreview() {
  dialoguePosePreviewIndex = -1;
  const clip = getMotionClips().find((entry) => entry.id === "adaptive_pose") || activeMotionClip();
  if (clip) {
    renderMotionControls(clip.id);
    setMotionTime(0, true, clip);
  } else {
    renderMotionControls();
  }
  renderDialoguePosePreviewStatus();
}

function upsertAutoMotionRecipe(recipe, { confirmReplace = true } = {}) {
  const clips = getMotionClips();
  const existingIndex = clips.findIndex((clip) => clip.id === recipe.id);
  if (existingIndex >= 0 && confirmReplace && !window.confirm(`기존 "${ko(recipe.label)}" 모션 클립을 교체할까요?`)) return null;

  const clip = {
    id: recipe.id,
    label: recipe.label,
    duration: recipe.duration,
    exportFrames: normalizeMotionFrameCount(recipe.exportFrames, 4),
    keyframes: normalizeMotionKeyframes(recipe.keyframes, recipe.duration)
  };
  if (existingIndex >= 0) clips[existingIndex] = clip;
  else clips.push(clip);
  rig.motionClips = clips;
  return clip;
}

function autoIdleMotionRecipe() {
  const base = snapshotParams();
  return {
    id: "idle_loop",
    label: "Idle Loop",
    duration: 3.2,
    exportFrames: 6,
    keyframes: [
      autoMotionKey(0, base, {}, "smoothstep"),
      autoMotionKey(0.8, base, { breath: 12, hairSway: 14, angleX: 2, angleY: -3, angleZ: 1, eyeOpen: 2 }, "smoothstep"),
      autoMotionKey(1.46, base, { breath: 6, hairSway: 5, eyeOpen: -70, mouthOpen: -4 }, "ease_out"),
      autoMotionKey(1.62, base, { breath: 8, hairSway: 4, eyeOpen: 0, mouthOpen: -2 }, "ease_in"),
      autoMotionKey(2.4, base, { breath: -9, hairSway: -12, angleX: -2, angleY: 3, angleZ: -1, eyeOpen: -2 }, "smoothstep"),
      autoMotionKey(3.2, base, {}, "smoothstep")
    ]
  };
}

function autoTalkMotionRecipe() {
  const base = snapshotParams();
  return {
    id: "talk_loop",
    label: "Talk Loop",
    duration: 1.6,
    exportFrames: 8,
    keyframes: [
      autoMotionKey(0, base, { mouthOpen: 4, smile: 2 }, "ease_out"),
      autoMotionKey(0.16, base, { mouthOpen: 48, smile: 5, brow: 3, angleY: -2, hairSway: 8 }, "ease_in_out"),
      autoMotionKey(0.32, base, { mouthOpen: 18, smile: 4, angleX: 2, angleZ: -1 }, "ease_out"),
      autoMotionKey(0.5, base, { mouthOpen: 62, smile: 7, brow: 5, angleY: 2, hairSway: 5 }, "ease_in_out"),
      autoMotionKey(0.7, base, { mouthOpen: 10, smile: 3, eyeOpen: -8, angleX: 1 }, "ease_out"),
      autoMotionKey(0.9, base, { mouthOpen: 55, smile: 6, angleX: -2, angleZ: 1, hairSway: -8 }, "ease_in_out"),
      autoMotionKey(1.14, base, { mouthOpen: 22, smile: 4, brow: -2, angleY: -1 }, "ease_out"),
      autoMotionKey(1.36, base, { mouthOpen: 40, smile: 5, angleX: 1, hairSway: -3 }, "smoothstep"),
      autoMotionKey(1.6, base, { mouthOpen: 4, smile: 2 }, "smoothstep")
    ]
  };
}

function autoVisemeMotionRecipe() {
  const base = snapshotParams();
  const frames = [
    { time: 0, name: "closed", deltas: { mouthOpen: -8, smile: 0, brow: 0, angleY: 0 }, easing: "hold" },
    { time: 0.2, name: "a", deltas: { mouthOpen: 72, smile: 8, brow: 3, angleY: -2 }, easing: "ease_out" },
    { time: 0.4, name: "i", deltas: { mouthOpen: 30, smile: 42, brow: 1, angleX: 1 }, easing: "ease_in_out" },
    { time: 0.6, name: "o", deltas: { mouthOpen: 58, smile: -24, brow: 4, angleY: -1 }, easing: "ease_in_out" },
    { time: 0.8, name: "u", deltas: { mouthOpen: 38, smile: -46, brow: 2, angleX: -1 }, easing: "ease_in_out" },
    { time: 1, name: "closed", deltas: { mouthOpen: -8, smile: 0, brow: 0, angleY: 0 }, easing: "ease_out" },
    { time: 1.2, name: "closed", deltas: { mouthOpen: -8, smile: 0, brow: 0, angleY: 0 }, easing: "hold" }
  ];
  return {
    id: "viseme_set",
    label: "Viseme Set",
    duration: 1.2,
    exportFrames: 6,
    keyframes: frames.map((frame) => autoMotionKey(
      frame.time,
      base,
      visemeDeltasForRig(frame.name, frame.deltas),
      frame.easing
    ))
  };
}

function visemeDeltasForRig(viseme, baseDeltas) {
  const deltas = { ...baseDeltas };
  for (const param of allParameterDefs()) {
    if (Object.prototype.hasOwnProperty.call(deltas, param.key)) continue;
    const text = `${param.key} ${param.label || ""}`.toLowerCase();
    const role = parameterSemanticRole(param);
    const span = Math.max(0.001, Number(param.max) - Number(param.min));
    const scale = span * 0.28;
    if (role === "mouth_open") {
      deltas[param.key] = viseme === "closed" ? -scale * 0.35 : scale * visemeMouthOpenWeight(viseme);
    } else if (/round|pucker|pout|o_|u_|오|우/.test(text)) {
      deltas[param.key] = ["o", "u"].includes(viseme) ? scale * 0.9 : -scale * 0.45;
    } else if (/wide|stretch|smile|corner|i_|e_|이|에/.test(text)) {
      deltas[param.key] = ["i"].includes(viseme) ? scale * 0.75 : (["o", "u"].includes(viseme) ? -scale * 0.45 : 0);
    } else if (/jaw|chin|아|입벌/.test(text)) {
      deltas[param.key] = viseme === "closed" ? -scale * 0.25 : (viseme === "a" ? scale : (["o"].includes(viseme) ? scale * 0.7 : scale * 0.35));
    }
  }
  return deltas;
}

function visemeMouthOpenWeight(viseme) {
  switch (viseme) {
    case "a": return 1;
    case "o": return 0.78;
    case "u": return 0.54;
    case "i": return 0.38;
    default: return 0;
  }
}

function autoAdaptivePoseRecipe() {
  const base = snapshotParams();
  const adaptiveFrames = adaptivePoseFrameRecipe();
  return {
    id: "adaptive_pose",
    label: "Adaptive Pose Set",
    duration: 2.8,
    exportFrames: 7,
    keyframes: adaptiveFrames.map((frame, index) => autoMotionKey(
      frame.time,
      base,
      adaptivePoseDeltasForRig(frame.deltas, index, adaptiveFrames.length),
      frame.easing
    ))
  };
}

function adaptivePoseFrameRecipe() {
  return [
    { time: 0, deltas: { mouthOpen: -4, smile: 0, eyeOpen: 0 }, easing: "smoothstep" },
    { time: 0.4, deltas: { angleX: -8, angleY: 4, angleZ: -2, eyeOpen: 3, smile: 6, brow: 2, hairSway: -14, breath: 10 }, easing: "smoothstep" },
    { time: 0.82, deltas: { angleX: 6, angleY: -3, angleZ: 1, eyeOpen: -5, smile: -2, brow: -5, mouthOpen: 4, hairSway: 9, breath: -4 }, easing: "ease_in_out" },
    { time: 1.18, deltas: { angleX: 2, angleY: 1, angleZ: 0, eyeOpen: -70, smile: 2, brow: 0, mouthOpen: -6, hairSway: 2, breath: 4 }, easing: "ease_out" },
    { time: 1.42, deltas: { angleX: -3, angleY: -6, angleZ: -1, eyeOpen: 0, smile: 8, brow: 5, mouthOpen: 2, hairSway: -7, breath: 12 }, easing: "smoothstep" },
    { time: 1.92, deltas: { angleX: 9, angleY: 3, angleZ: 2, eyeOpen: 4, smile: -4, brow: -3, mouthOpen: 6, hairSway: 13, breath: -8 }, easing: "ease_in_out" },
    { time: 2.36, deltas: { angleX: -4, angleY: 2, angleZ: -1, eyeOpen: -2, smile: 4, brow: 1, mouthOpen: 0, hairSway: -5, breath: 6 }, easing: "smoothstep" },
    { time: 2.8, deltas: { mouthOpen: -4, smile: 0, eyeOpen: 0 }, easing: "smoothstep" }
  ];
}

function adaptivePoseDeltasForRig(baseDeltas, frameIndex, frameCount) {
  const settings = getAdaptivePoseSettings();
  const disabled = new Set(settings.disabledParameters);
  const deltas = scaledAdaptiveBaseDeltas(baseDeltas, settings, disabled);
  const influence = adaptiveRigInfluenceMap();
  if (influence.size === 0) return deltas;

  const isLoopEdge = frameIndex === 0 || frameIndex === frameCount - 1;
  const progress = frameIndex / Math.max(1, frameCount - 1);
  for (const param of allParameterDefs()) {
    if (Object.prototype.hasOwnProperty.call(deltas, param.key)) continue;
    if (disabled.has(param.key)) continue;
    const entry = influence.get(param.key);
    if (!entry) continue;
    if (isLoopEdge) {
      deltas[param.key] = 0;
      continue;
    }
    const amplitude = adaptiveGeneratedAmplitude(param, entry, settings);
    const role = parameterSemanticRole(param);
    const wave = adaptiveRoleWave(role, progress, param.key);
    deltas[param.key] = Number((wave * amplitude).toFixed(3));
  }
  return deltas;
}

function scaledAdaptiveBaseDeltas(baseDeltas, settings = getAdaptivePoseSettings(), disabled = new Set()) {
  const intensity = adaptivePoseIntensity(settings);
  const deltas = {};
  for (const [key, value] of Object.entries(baseDeltas || {})) {
    const parameterKey = knownParameterKey(key);
    if (!parameterKey || disabled.has(parameterKey)) continue;
    deltas[parameterKey] = Number((Number(value || 0) * intensity).toFixed(3));
  }
  return deltas;
}

function adaptiveGeneratedAmplitude(param, entry, settings = getAdaptivePoseSettings()) {
  if (!entry) return 0;
  const span = Math.max(0.001, Number(param.max) - Number(param.min));
  const score = Math.min(16, Math.max(1, Number(entry.score || 1)));
  const role = parameterSemanticRole(param);
  const baseAmplitude = clamp(
    span * (0.055 + score * 0.006) * adaptiveRoleAmplitudeMultiplier(role),
    Math.max(Number(param.step || 1) * 2, span * 0.025),
    span * adaptiveRoleAmplitudeLimit(role)
  );
  return Number((baseAmplitude * adaptivePoseIntensity(settings)).toFixed(3));
}

function adaptivePoseIntensity(settings = getAdaptivePoseSettings()) {
  return clamp(Number(settings?.intensity || 1), 0.25, 2);
}

function adaptivePoseParameterPlan() {
  const settings = getAdaptivePoseSettings();
  const disabled = new Set(settings.disabledParameters);
  const influence = adaptiveRigInfluenceMap();
  const baseRanges = adaptiveBaseDeltaRanges(settings);
  const potentialBaseRanges = adaptiveBaseDeltaRanges({ ...settings, disabledParameters: [] });
  return allParameterDefs()
    .map((param) => {
      const entry = influence.get(param.key);
      const baseAmplitude = baseRanges.get(param.key) || 0;
      const generatedAmplitude = disabled.has(param.key) ? 0 : adaptiveGeneratedAmplitude(param, entry, settings);
      const potentialAmplitude = (potentialBaseRanges.get(param.key) || 0) + adaptiveGeneratedAmplitude(param, entry, settings);
      const channels = new Set(entry ? [...entry.channels] : []);
      if ((potentialBaseRanges.get(param.key) || 0) > 0) channels.add("base_pose");
      return {
        key: param.key,
        label: param.label || param.key,
        role: parameterSemanticRole(param),
        enabled: !disabled.has(param.key),
        score: Number((entry?.score || 0).toFixed(3)),
        totalAmplitude: Number((disabled.has(param.key) ? potentialAmplitude : baseAmplitude + generatedAmplitude).toFixed(3)),
        channels: [...channels].sort()
      };
    })
    .filter((entry) => entry.score > 0 || entry.totalAmplitude > 0)
    .sort((left, right) => (right.totalAmplitude - left.totalAmplitude) || (right.score - left.score) || left.label.localeCompare(right.label));
}

function adaptiveBaseDeltaRanges(settings = getAdaptivePoseSettings()) {
  const disabled = new Set(settings.disabledParameters);
  const ranges = new Map();
  for (const frame of adaptivePoseFrameRecipe()) {
    const deltas = scaledAdaptiveBaseDeltas(frame.deltas, settings, disabled);
    for (const [key, value] of Object.entries(deltas)) {
      ranges.set(key, Math.max(ranges.get(key) || 0, Math.abs(Number(value) || 0)));
    }
  }
  return ranges;
}

function adaptiveRoleWave(role, progress, key) {
  const phase = (Math.PI * 2 * progress) + deterministicPhaseOffset(key);
  switch (role) {
    case "mouth_open":
      return Math.sin(progress * Math.PI * 6 - 0.45) * 0.72 + Math.sin(progress * Math.PI * 12) * 0.22;
    case "eye_open":
      return progress > 0.34 && progress < 0.48 ? -1.08 : Math.sin(phase) * 0.18;
    case "smile":
      return Math.sin(phase * 0.75 + 0.55) * 0.54 + Math.cos(progress * Math.PI * 2) * 0.14;
    case "brow":
      return Math.cos(phase * 0.85 + 0.3) * 0.52;
    case "gaze_x":
      return Math.sin(phase) * 0.74;
    case "gaze_y":
      return Math.cos(phase + 0.65) * 0.56;
    case "tilt":
      return Math.sin(phase + 0.4) * 0.46;
    case "hair":
      return Math.sin(phase * 1.15) * 0.92 + Math.cos(phase * 0.55) * 0.18;
    case "breath":
      return Math.sin(progress * Math.PI * 2 - Math.PI / 3) * 0.68;
    case "body":
      return Math.sin(phase * 0.7 + 0.2) * 0.44;
    case "prop":
      return Math.sin(phase * 0.9 + 0.8) * 0.5;
    default:
      return Math.sin(phase) + Math.cos(phase * 0.5 + 0.75) * 0.32;
  }
}

function adaptiveRoleAmplitudeMultiplier(role) {
  if (role === "mouth_open") return 1.2;
  if (role === "eye_open") return 1.55;
  if (role === "hair") return 1.15;
  if (role === "breath") return 0.9;
  if (["gaze_x", "gaze_y", "tilt", "body"].includes(role)) return 0.82;
  return 1;
}

function adaptiveRoleAmplitudeLimit(role) {
  if (role === "eye_open") return 0.38;
  if (role === "mouth_open") return 0.32;
  if (["gaze_x", "gaze_y", "tilt", "body"].includes(role)) return 0.18;
  return 0.22;
}

function adaptiveRigInfluenceMap() {
  const influence = new Map();
  const addInfluence = (parameterKey, score, channel = "") => {
    const key = knownParameterKey(parameterKey);
    if (!key) return;
    const existing = influence.get(key) || { score: 0, channels: new Set() };
    existing.score += Math.max(0, Number(score) || 0);
    if (channel) existing.channels.add(channel);
    influence.set(key, existing);
  };

  for (const part of getImageParts()) {
    for (const [field, strengthField, channel] of imagePartBindingFields) {
      const strength = Math.abs(Number(part?.[strengthField] || 0));
      if (strength > 0.0001) addInfluence(part?.[field], 1 + Math.min(6, strength / 24), channel);
    }
    for (const deformer of part.transformDeformers || []) {
      const keyframes = Array.isArray(deformer?.keyframes) ? deformer.keyframes : [];
      addInfluence(deformer?.parameter, 1 + Math.min(8, keyframes.length), "transform_key");
    }
    for (const deformer of normalizeDrawOrderDeformers(part)) {
      const keyframes = Array.isArray(deformer?.keyframes) ? deformer.keyframes : [];
      addInfluence(deformer?.parameter, 1 + Math.min(6, keyframes.length), "draw_order");
    }
    const visibilityGate = normalizeImagePartVisibilityGate(part);
    if (visibilityGate.enabled) addInfluence(visibilityGate.parameter, 2, "visibility");
    if (part.mesh?.enabled) {
      const mesh = normalizePartMesh(part);
      for (const deformer of mesh.deformers || []) {
        const keyframes = Array.isArray(deformer?.keyframes) ? deformer.keyframes : [];
        addInfluence(deformer?.parameter, 2 + Math.min(12, keyframes.length + meshDeformerMagnitude(deformer) / 24), "mesh");
      }
    }
  }

  for (const group of getDeformerGroups()) {
    if (group.enabled === false) continue;
    const keyframes = Array.isArray(group.keyframes) ? group.keyframes : [];
    const warp = normalizeDeformerGroupWarp(group.warp || {}, group, rig);
    const warpKeyframes = warp.enabled ? warp.keyframes : [];
    const partCount = deformerGroupAffectedPartIds(group).length;
    addInfluence(group.parameter, 2 + Math.min(12, keyframes.length * 1.5 + warpKeyframes.length * 2 + partCount * 0.4), warp.enabled ? "warp" : "deformer_group");
  }

  const physics = getPhysics();
  if (physics.enabled !== false) {
    for (const rule of physics.rules || []) {
      if (rule.enabled === false) continue;
      addInfluence(rule.param, 1 + Math.min(6, Math.abs(Number(rule.amplitude || 0)) / 12), "physics");
    }
  }

  for (const clip of getMotionClips()) {
    if (clip.id === "adaptive_pose") continue;
    for (const [key, range] of motionParameterRanges(clip)) {
      addInfluence(key, 1 + Math.min(8, range / 12), "motion");
    }
  }
  return influence;
}

function meshDeformerMagnitude(deformer) {
  let magnitude = 0;
  for (const keyframe of deformer?.keyframes || []) {
    for (const vertex of keyframe?.vertices || []) {
      magnitude = Math.max(magnitude, Math.abs(Number(vertex?.dx || 0)), Math.abs(Number(vertex?.dy || 0)));
    }
  }
  return magnitude;
}

function motionParameterRanges(clip) {
  const ranges = new Map();
  for (const keyframe of clip?.keyframes || []) {
    const params = keyframe?.params && typeof keyframe.params === "object" ? keyframe.params : {};
    for (const [key, value] of Object.entries(params)) {
      if (!knownParameterKey(key) || !Number.isFinite(Number(value))) continue;
      const current = ranges.get(key) || { min: Number(value), max: Number(value) };
      current.min = Math.min(current.min, Number(value));
      current.max = Math.max(current.max, Number(value));
      ranges.set(key, current);
    }
  }
  return [...ranges.entries()]
    .map(([key, range]) => [key, Math.abs(range.max - range.min)])
    .filter(([, range]) => range > 0.001);
}

function deterministicPhaseOffset(value) {
  let hash = 0;
  for (const character of String(value || "")) {
    hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  }
  return (Math.abs(hash) % 6283) / 1000;
}

function autoMotionKey(time, baseParams, deltas, easing) {
  return {
    time,
    easing,
    params: autoMotionParams(baseParams, deltas)
  };
}

function autoMotionParams(baseParams, deltas) {
  const params = {};
  for (const param of allParameterDefs()) {
    const baseValue = Number(baseParams[param.key] ?? rig.params?.[param.key] ?? 0);
    const delta = Number(deltas[param.key] || 0);
    params[param.key] = Number(clamp(baseValue + delta, param.min, param.max).toFixed(3));
  }
  return params;
}

function deleteCurrentMotionClip() {
  const clip = activeMotionClip();
  if (!clip) return;
  if (!window.confirm(`모션 클립 "${ko(clip.label || clip.id)}"을 삭제할까요?`)) return;
  stopMotionPlayback(false);
  if (clip.id === "adaptive_pose") dialoguePosePreviewIndex = -1;
  rig.motionClips = getMotionClips().filter((entry) => entry.id !== clip.id);
  renderMotionControls();
  commitHistory(`delete motion ${clip.id}`);
  showToast(`Motion clip deleted: ${clip.label || clip.id}`);
}

function updateMotionDuration() {
  const clip = activeMotionClip();
  if (!clip) return;
  clip.duration = clamp(elements.motionDuration.value, 0.1, 30);
  clip.keyframes = normalizeMotionKeyframes(clip.keyframes, clip.duration);
  renderMotionControls(clip.id);
  commitHistory(`motion duration ${clip.id}`);
}

function updateMotionExportFrameCount() {
  const clip = activeMotionClip();
  if (!clip) return;
  clip.exportFrames = normalizeMotionFrameCount(elements.motionFrameCount.value || recommendedMotionFrameCount(clip), recommendedMotionFrameCount(clip));
  elements.motionFrameCount.value = String(clip.exportFrames);
  renderMotionControls(clip.id);
  commitHistory(`motion export frames ${clip.id}`);
}

function addMotionKeyframe() {
  const clip = activeMotionClip();
  if (!clip) {
    showToast("Create a motion clip first.");
    return;
  }
  const time = Number(clamp(elements.motionTime.value || 0, 0, clip.duration).toFixed(3));
  const index = clip.keyframes.findIndex((entry) => Math.abs(Number(entry.time) - time) <= 0.005);
  const nextKeyframe = {
    time,
    easing: normalizeMotionEasing(index >= 0 ? clip.keyframes[index].easing : "smoothstep"),
    params: snapshotParams()
  };
  upsertMotionKeyframe(clip, nextKeyframe, index);
  renderMotionControls(clip.id);
  commitHistory(`motion key ${clip.id}`);
  showToast(`Motion key saved at ${formatMotionTime(time)}.`);
}

function upsertMotionKeyframe(clip, keyframe, existingIndex = -1) {
  if (!clip || !keyframe) return;
  const duration = clamp(clip.duration || 2, 0.1, 30);
  const time = Number(clamp(keyframe.time, 0, duration).toFixed(3));
  const index = existingIndex >= 0
    ? existingIndex
    : clip.keyframes.findIndex((entry) => Math.abs(Number(entry.time) - time) <= 0.005);
  const nextKeyframe = {
    time,
    easing: normalizeMotionEasing(keyframe.easing),
    params: normalizePresetParams(keyframe.params || {})
  };
  if (index >= 0) clip.keyframes[index] = nextKeyframe;
  else clip.keyframes.push(nextKeyframe);
  clip.keyframes = normalizeMotionKeyframes(clip.keyframes, duration);
}

function deleteMotionKeyframe(index) {
  const clip = activeMotionClip();
  if (!clip) return;
  clip.keyframes = clip.keyframes.filter((_, keyIndex) => keyIndex !== index);
  renderMotionControls(clip.id);
  commitHistory(`delete motion key ${clip.id}`);
}

function setMotionTime(time, shouldApply, clipOverride = null) {
  const clip = clipOverride || activeMotionClip();
  const duration = clip ? clip.duration : 2;
  const currentTime = clamp(time, 0, duration);
  elements.motionTime.value = String(currentTime);
  elements.motionTimeLabel.textContent = formatMotionTime(currentTime);
  updateMotionTimelineSelection(clip, currentTime);
  if (shouldApply) applyMotionAt(currentTime, clip);
}

function applyMotionAt(time, clip = activeMotionClip()) {
  if (!clip) return;
  const currentTime = clamp(time, 0, clip.duration);
  const params = interpolatedMotionParams(clip, currentTime);
  for (const param of allParameterDefs()) {
    if (Number.isFinite(Number(params[param.key]))) {
      rig.params[param.key] = clamp(Number(params[param.key]), param.min, param.max);
    }
  }
  elements.motionTime.value = String(currentTime);
  elements.motionTimeLabel.textContent = formatMotionTime(currentTime);
  updateMotionTimelineSelection(clip, currentTime);
  renderParameterControls();
  draw();
}

function interpolatedMotionParams(clip, time) {
  const keyframes = normalizeMotionKeyframes(clip.keyframes, clip.duration);
  if (keyframes.length === 0) return {};
  if (time <= keyframes[0].time) return { ...keyframes[0].params };
  const last = keyframes[keyframes.length - 1];
  if (time >= last.time) return { ...last.params };

  let previous = keyframes[0];
  let next = last;
  for (let index = 1; index < keyframes.length; index += 1) {
    if (keyframes[index].time >= time) {
      next = keyframes[index];
      previous = keyframes[index - 1];
      break;
    }
  }

  const span = Math.max(0.001, next.time - previous.time);
  const ratio = applyMotionEasing(clamp((time - previous.time) / span, 0, 1), previous.easing);
  const params = {};
  for (const param of allParameterDefs()) {
    const previousValue = Number(previous.params?.[param.key]);
    const nextValue = Number(next.params?.[param.key]);
    if (Number.isFinite(previousValue) && Number.isFinite(nextValue)) {
      params[param.key] = previousValue + (nextValue - previousValue) * ratio;
    } else if (Number.isFinite(previousValue)) {
      params[param.key] = previousValue;
    } else if (Number.isFinite(nextValue)) {
      params[param.key] = nextValue;
    }
  }
  return params;
}

function normalizeMotionEasing(value) {
  const easing = String(value || "linear").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (motionEasingOptions.some(([candidate]) => candidate === easing)) return easing;
  if (easing === "easein") return "ease_in";
  if (easing === "easeout") return "ease_out";
  if (easing === "easeinout") return "ease_in_out";
  return "linear";
}

function applyMotionEasing(ratio, easing) {
  const t = clamp(ratio, 0, 1);
  switch (normalizeMotionEasing(easing)) {
    case "hold":
      return 0;
    case "ease_in":
      return t * t;
    case "ease_out":
      return 1 - ((1 - t) * (1 - t));
    case "ease_in_out":
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    case "smoothstep":
      return t * t * (3 - 2 * t);
    case "linear":
    default:
      return t;
  }
}

function startMotionPlayback() {
  const clip = activeMotionClip();
  if (!clip || clip.keyframes.length === 0) {
    showToast("Add at least one motion key first.");
    return;
  }
  stopMotionPlayback(false);
  if (elements.autoMotion.checked) {
    elements.autoMotion.checked = false;
  }
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }
  motionPlaybackBaseTime = clamp(elements.motionTime.value || 0, 0, clip.duration);
  motionPlaybackStartedAt = performance.now();
  motionPlaybackFrame = requestAnimationFrame(tickMotionPlayback);
  renderMotionControls(clip.id);
}

function tickMotionPlayback(now) {
  const clip = activeMotionClip();
  if (!clip) {
    stopMotionPlayback(false);
    return;
  }
  const duration = Math.max(0.1, Number(clip.duration || 2));
  const elapsed = (now - motionPlaybackStartedAt) / 1000;
  const time = (motionPlaybackBaseTime + elapsed) % duration;
  applyMotionAt(time, clip);
  motionPlaybackFrame = requestAnimationFrame(tickMotionPlayback);
}

function stopMotionPlayback(shouldRender = true) {
  if (motionPlaybackFrame) {
    cancelAnimationFrame(motionPlaybackFrame);
    motionPlaybackFrame = 0;
  }
  if (shouldRender) renderMotionControls();
}

function getPhysics() {
  if (!rig.physics || typeof rig.physics !== "object" || Array.isArray(rig.physics)) {
    rig.physics = defaultPhysics();
  }
  rig.physics = normalizePhysics(rig.physics);
  return rig.physics;
}

function renderPhysicsControls() {
  const physics = getPhysics();
  elements.physicsEnabled.checked = physics.enabled !== false;
  elements.physicsRuleList.innerHTML = "";
  if (physics.rules.length === 0) {
    const empty = document.createElement("div");
    empty.className = "motion-empty";
    empty.textContent = ko("No physics rules");
    elements.physicsRuleList.append(empty);
    return;
  }

  for (const rule of physics.rules) {
    const row = document.createElement("div");
    row.className = "physics-rule-row";

    const header = document.createElement("div");
    header.className = "physics-rule-header";
    const enabled = document.createElement("input");
    enabled.type = "checkbox";
    enabled.checked = rule.enabled !== false;
    enabled.addEventListener("change", () => {
      rule.enabled = enabled.checked;
      commitHistory(`physics ${rule.id} enabled`);
    });
    const name = document.createElement("input");
    name.type = "text";
    name.value = rule.label || rule.id;
    name.addEventListener("input", () => {
      rule.label = name.value.trim() || rule.id;
      commitHistory(`physics ${rule.id} label`);
    });
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "expression-delete";
    remove.textContent = ko("Delete");
    remove.addEventListener("click", () => deletePhysicsRule(rule.id));
    header.append(enabled, name, remove);

    const fields = document.createElement("div");
    fields.className = "physics-rule-fields";
    fields.append(
      physicsSelectField(rule, "Param", "param", bindingOptions().filter(([value]) => value)),
      physicsNumberField(rule, "Offset", "offset", -100, 100, 1),
      physicsNumberField(rule, "Amp", "amplitude", -100, 100, 1),
      physicsNumberField(rule, "Hz", "frequency", 0, 5, 0.001),
      physicsNumberField(rule, "Phase", "phase", -6.283, 6.283, 0.001)
    );

    row.append(header, fields);
    elements.physicsRuleList.append(row);
  }
}

function physicsSelectField(rule, labelText, key, options) {
  const label = document.createElement("label");
  label.className = "field physics-field";
  const span = document.createElement("span");
  span.textContent = ko(labelText);
  const select = document.createElement("select");
  for (const [value, optionLabel] of options) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = ko(optionLabel);
    select.append(option);
  }
  select.value = rule[key] || options[0]?.[0] || "";
  select.addEventListener("change", () => {
    rule[key] = knownParameterKey(select.value) || "breath";
    commitHistory(`physics ${rule.id} ${key}`);
  });
  label.append(span, select);
  return label;
}

function physicsNumberField(rule, labelText, key, min, max, step) {
  const label = document.createElement("label");
  label.className = "field physics-field";
  const span = document.createElement("span");
  span.textContent = ko(labelText);
  const input = document.createElement("input");
  input.type = "number";
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(Number(rule[key] || 0));
  input.addEventListener("input", () => {
    rule[key] = clamp(input.value, min, max);
    commitHistory(`physics ${rule.id} ${key}`);
  });
  label.append(span, input);
  return label;
}

function addPhysicsRule() {
  const physics = getPhysics();
  const baseId = "physics_rule";
  let index = physics.rules.length + 1;
  let id = `${baseId}_${index}`;
  while (physics.rules.some((rule) => rule.id === id)) {
    index += 1;
    id = `${baseId}_${index}`;
  }
  const defaultParam = allParameterDefs().find((param) => param.key !== "breath")?.key || "breath";
  physics.rules.push(normalizePhysicsRule({
    id,
    label: `Rule ${index}`,
    param: defaultParam,
    offset: Number(rig.params?.[defaultParam] || 0),
    amplitude: 10,
    frequency: 0.5,
    phase: 0,
    enabled: true
  }, physics.rules.length));
  renderPhysicsControls();
  commitHistory(`add physics ${id}`);
}

function autoPhysicsRules({ confirmReplace = true } = {}) {
  const physics = getPhysics();
  const generated = buildAutoPhysicsRules();
  if (generated.length === 0) {
    showToast("No physics-ready parameters found.");
    return;
  }
  const replaceCount = physics.rules.filter(isAutoPhysicsRule).length;
  if (confirmReplace && replaceCount > 0 && !window.confirm(`자동 생성 물리 규칙 ${replaceCount}개를 교체할까요? 수동 규칙은 유지됩니다.`)) {
    return;
  }
  const manualRules = physics.rules.filter((rule) => !isAutoPhysicsRule(rule));
  physics.enabled = true;
  physics.rules = normalizePhysicsRules([...manualRules, ...generated]);
  renderPhysicsControls();
  renderParameterInfluenceInspector();
  renderRigValidation();
  draw();
  commitHistory("auto physics rules");
  showToast(`Auto physics generated: ${generated.length} rule${generated.length === 1 ? "" : "s"}.`);
}

function buildAutoPhysicsRules() {
  const influence = adaptiveRigInfluenceMap();
  const candidates = [];
  for (const param of allParameterDefs()) {
    const role = parameterSemanticRole(param);
    const spec = autoPhysicsRoleSpec(param, role, influence.get(param.key));
    if (!spec) continue;
    candidates.push(spec);
  }
  candidates.sort((left, right) => {
    if (left.priority !== right.priority) return left.priority - right.priority;
    if (right.influenceScore !== left.influenceScore) return right.influenceScore - left.influenceScore;
    return left.label.localeCompare(right.label);
  });
  const usedParams = new Set();
  return candidates.filter((spec) => {
    if (usedParams.has(spec.param)) return false;
    usedParams.add(spec.param);
    return true;
  }).slice(0, 8).map((spec, index) => normalizePhysicsRule({
    id: spec.id,
    label: spec.label,
    param: spec.param,
    offset: spec.offset,
    amplitude: spec.amplitude,
    frequency: spec.frequency,
    phase: spec.phase,
    enabled: true,
    autoGenerated: true,
    autoPhysicsKind: spec.kind
  }, index));
}

function autoPhysicsRoleSpec(param, role, influenceEntry) {
  const cleanRole = normalizeParameterRole(role) || "generic";
  const influenceScore = Math.max(0, Number(influenceEntry?.score || 0));
  const hasRigInfluence = influenceScore > 0.0001 || ["breath", "hairSway", "angleX"].includes(param.key);
  const template = autoPhysicsTemplateForRole(cleanRole);
  if (!template || !hasRigInfluence) return null;
  const span = Math.max(1, Number(param.max) - Number(param.min));
  const current = Number.isFinite(Number(rig.params?.[param.key])) ? Number(rig.params[param.key]) : (Number(param.min) + span * 0.5);
  const offset = template.offsetRatio === null
    ? current
    : Number(param.min) + span * template.offsetRatio;
  const influenceBoost = 1 + Math.min(0.35, influenceScore / 60);
  const amplitude = clamp(span * template.amplitudeRatio * influenceBoost, template.minAmplitude, template.maxAmplitude);
  return {
    id: safeSegment(`${param.key}_${template.kind}_loop`, "auto_physics"),
    label: `${param.label || param.key} ${template.label}`,
    param: param.key,
    kind: template.kind,
    offset: Number(clamp(offset, param.min, param.max).toFixed(3)),
    amplitude: Number(amplitude.toFixed(3)),
    frequency: template.frequency,
    phase: template.phase,
    priority: template.priority,
    influenceScore
  };
}

function autoPhysicsTemplateForRole(role) {
  switch (role) {
    case "breath":
      return { kind: "breath", label: "Breathing", offsetRatio: 0.42, amplitudeRatio: 0.28, minAmplitude: 8, maxAmplitude: 34, frequency: 0.286, phase: 0, priority: 1 };
    case "hair":
      return { kind: "hair", label: "Sway", offsetRatio: null, amplitudeRatio: 0.09, minAmplitude: 5, maxAmplitude: 22, frequency: 0.183, phase: 0.72, priority: 2 };
    case "body":
      return { kind: "body", label: "Body Drift", offsetRatio: null, amplitudeRatio: 0.04, minAmplitude: 3, maxAmplitude: 10, frequency: 0.236, phase: 1.18, priority: 3 };
    case "gaze_x":
      return { kind: "gaze_x", label: "Look Drift", offsetRatio: null, amplitudeRatio: 0.035, minAmplitude: 2, maxAmplitude: 8, frequency: 0.115, phase: 1.57, priority: 4 };
    case "gaze_y":
      return { kind: "gaze_y", label: "Look Drift", offsetRatio: null, amplitudeRatio: 0.025, minAmplitude: 2, maxAmplitude: 6, frequency: 0.093, phase: 2.12, priority: 5 };
    case "tilt":
      return { kind: "tilt", label: "Tilt Drift", offsetRatio: null, amplitudeRatio: 0.055, minAmplitude: 1.5, maxAmplitude: 5, frequency: 0.132, phase: 2.74, priority: 6 };
    case "prop":
      return { kind: "prop", label: "Secondary Motion", offsetRatio: null, amplitudeRatio: 0.045, minAmplitude: 2, maxAmplitude: 8, frequency: 0.211, phase: 0.38, priority: 7 };
    default:
      return null;
  }
}

function isAutoPhysicsRule(rule) {
  if (rule?.autoGenerated === true || rule?.auto_generated === true) return true;
  return ["breath_loop", "hair_sway_loop", "angle_x_loop"].includes(String(rule?.id || ""));
}

function deletePhysicsRule(id) {
  const physics = getPhysics();
  physics.rules = physics.rules.filter((rule) => rule.id !== id);
  renderPhysicsControls();
  commitHistory(`delete physics ${id}`);
}

function samplePhysicsParams(sourceRig, time, baseParams = {}) {
  const physics = normalizePhysics(sourceRig.physics || {});
  const result = { ...baseParams };
  if (physics.enabled === false) return result;
  const sampleTime = Math.max(0, Number(time || 0));
  for (const rule of physics.rules) {
    if (rule.enabled === false) continue;
    const param = allParameterDefs().find((entry) => entry.key === rule.param);
    if (!param) continue;
    const wave = Math.sin((sampleTime * rule.frequency * Math.PI * 2) + rule.phase);
    result[rule.param] = clamp(rule.offset + wave * rule.amplitude, param.min, param.max);
  }
  return result;
}

function applyPhysicsAt(time) {
  const physics = getPhysics();
  if (physics.enabled === false) return;
  for (const rule of physics.rules) {
    if (rule.enabled === false) continue;
    const param = allParameterDefs().find((entry) => entry.key === rule.param);
    if (!param) continue;
    const wave = Math.sin((time * rule.frequency * Math.PI * 2) + rule.phase);
    rig.params[rule.param] = clamp(rule.offset + wave * rule.amplitude, param.min, param.max);
  }
}

function renderParameterControls() {
  elements.parameterGrid.innerHTML = "";
  const customKeys = new Set(getCustomParameters().map((param) => param.key));
  const params = allParameterDefs();
  for (const param of params) {
    const wrapper = document.createElement("label");
    wrapper.className = "range-field";
    const label = document.createElement("span");
    label.textContent = ko(param.label);
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(param.min);
    input.max = String(param.max);
    input.step = String(param.step);
    input.value = String(rig.params[param.key] ?? 0);
    const output = document.createElement("output");
    output.textContent = input.value;
    input.addEventListener("input", () => {
      rig.params[param.key] = Number(input.value);
      output.textContent = input.value;
      draw();
      renderParameterInfluenceInspector();
      commitHistory(`param ${param.key}`);
    });
    wrapper.append(label, input, output);
    if (customKeys.has(param.key)) {
      const actions = document.createElement("div");
      actions.className = "parameter-actions";
      const roleSelect = document.createElement("select");
      roleSelect.className = "parameter-role-select";
      roleSelect.title = "의미 역할";
      for (const [value, roleLabel] of parameterRoleOptions) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = ko(roleLabel);
        roleSelect.append(option);
      }
      roleSelect.value = parameterSemanticRole(param);
      roleSelect.addEventListener("change", (event) => {
        event.preventDefault();
        updateCustomParameterRole(param.key, roleSelect.value);
      });
      const removeButton = document.createElement("button");
      removeButton.className = "parameter-remove";
      removeButton.type = "button";
      removeButton.textContent = ko("Remove");
      removeButton.addEventListener("click", (event) => {
        event.preventDefault();
        removeCustomParameter(param.key);
      });
      actions.append(roleSelect, removeButton);
      wrapper.append(actions);
    }
    elements.parameterGrid.append(wrapper);
  }
  renderParameterInfluenceInspector();
}

function renderParameterInfluenceInspector() {
  const params = allParameterDefs();
  const previousSelection = elements.parameterInfluenceSelect.value;
  const nextSelection = params.some((param) => param.key === previousSelection)
    ? previousSelection
    : params[0]?.key || "";
  elements.parameterInfluenceSelect.innerHTML = "";
  for (const param of params) {
    const option = document.createElement("option");
    option.value = param.key;
    option.textContent = ko(param.label);
    elements.parameterInfluenceSelect.append(option);
  }
  elements.parameterInfluenceSelect.value = nextSelection;
  renderParameterInfluencePanel(nextSelection);
}

function renderParameterInfluencePanel(parameterKey = elements.parameterInfluenceSelect.value) {
  elements.parameterInfluencePanel.innerHTML = "";
  const param = allParameterDefs().find((entry) => entry.key === parameterKey);
  if (!param) {
    elements.parameterInfluencePanel.textContent = ko("No parameter selected.");
    return;
  }
  const influence = collectParameterInfluence(parameterKey);
  const role = parameterSemanticRole(param);
  const header = document.createElement("div");
  header.className = "parameter-influence-summary";
  header.textContent = `${param.key} · ${parameterRoleLabel(role)} · 현재 ${formatCompactNumber(rig.params?.[param.key] ?? 0)} · 연결 ${influence.total}개`;
  elements.parameterInfluencePanel.append(header);

  for (const section of [
    ["Direct bindings", influence.direct],
    ["Visibility gates", influence.visibility],
    ["Transform keys", influence.transforms],
    ["Draw order", influence.drawOrders],
    ["Deformer groups", influence.groups],
    ["Mesh keys", influence.meshes],
    ["Stage parts", influence.stageParts],
    ["Physics", influence.physics],
    ["Motion clips", influence.motions]
  ]) {
    const [title, rows] = section;
    elements.parameterInfluencePanel.append(createInfluenceSection(title, rows));
  }
}

function createInfluenceSection(title, rows) {
  const section = document.createElement("div");
  section.className = "parameter-influence-section";
  const heading = document.createElement("div");
  heading.className = "parameter-influence-heading";
  heading.textContent = `${ko(title)} · ${rows.length}`;
  section.append(heading);
  if (rows.length === 0) {
    const empty = document.createElement("div");
    empty.className = "parameter-influence-empty";
    empty.textContent = ko("None");
    section.append(empty);
    return section;
  }
  for (const row of rows) {
    const item = document.createElement("div");
    item.className = "parameter-influence-row";
    item.textContent = row;
    section.append(item);
  }
  return section;
}

function collectParameterInfluence(parameterKey) {
  const direct = [];
  const visibility = [];
  const transforms = [];
  const drawOrders = [];
  const groups = [];
  const meshes = [];
  const physics = [];
  const motions = [];
  const stageParts = [];

  for (const part of getImageParts()) {
    const label = part.label || part.id;
    for (const [field, strengthField, channel] of imagePartBindingFields) {
      if (part?.[field] !== parameterKey) continue;
      const strength = Number(part?.[strengthField] || 0);
      if (Math.abs(strength) <= 0.0001) continue;
      direct.push(`${label} · ${channel} ${formatCompactNumber(strength)}`);
    }
    const visibilityGate = normalizeImagePartVisibilityGate(part);
    if (visibilityGate.enabled && visibilityGate.parameter === parameterKey) {
      const fadeText = visibilityGate.fade > 0 ? ` · fade ${formatCompactNumber(visibilityGate.fade)}` : "";
      visibility.push(`${label} · ${formatCompactNumber(visibilityGate.min)}..${formatCompactNumber(visibilityGate.max)}${fadeText}`);
    }
    for (const deformer of normalizePartTransformDeformers(part)) {
      if (deformer.parameter !== parameterKey) continue;
      transforms.push(`${label} · ${deformer.keyframes.length} keys`);
    }
    for (const deformer of normalizeDrawOrderDeformers(part)) {
      if (deformer.parameter !== parameterKey) continue;
      drawOrders.push(`${label} · ${deformer.keyframes.length} keys · current ${formatCompactNumber(effectiveImagePartOrder(rig, part))}`);
    }
    if (part.mesh?.enabled) {
      const mesh = normalizePartMesh(part);
      for (const deformer of mesh.deformers || []) {
        if (deformer.parameter !== parameterKey) continue;
        meshes.push(`${label} · ${deformer.keyframes.length} keys`);
      }
    }
  }

  for (const group of getDeformerGroups()) {
    if (group.parameter !== parameterKey || group.enabled === false) continue;
    const warp = normalizeDeformerGroupWarp(group.warp || {}, group, rig);
    const warpText = warp.enabled ? ` · ${warp.columns}x${warp.rows} warp · ${warp.keyframes.length} warp keys` : "";
    groups.push(`${group.label || group.id} · ${deformerGroupAffectedPartIds(group).length} parts · ${group.keyframes.length} keys${warpText}`);
  }

  const physicsState = getPhysics();
  for (const rule of physicsState.rules || []) {
    if (rule.param !== parameterKey || rule.enabled === false) continue;
    physics.push(`${rule.label || rule.id} · amp ${formatCompactNumber(rule.amplitude)} freq ${formatCompactNumber(rule.frequency)}`);
  }

  for (const clip of getMotionClips()) {
    const range = motionParameterRanges(clip).find(([key]) => key === parameterKey);
    if (!range) continue;
    motions.push(`${clip.label || clip.id} · range ${formatCompactNumber(range[1])}`);
  }

  for (const entry of collectParameterInfluencedParts(parameterKey)) {
    const label = entry.part.label || entry.part.id;
    stageParts.push(`${label} · ${entry.channels.join(", ")}`);
  }

  return {
    direct,
    visibility,
    transforms,
    drawOrders,
    groups,
    meshes,
    stageParts,
    physics,
    motions,
    total: direct.length + visibility.length + transforms.length + drawOrders.length + groups.length + meshes.length + stageParts.length + physics.length + motions.length
  };
}

function collectParameterInfluencedParts(parameterKey) {
  const parameter = knownParameterKey(parameterKey);
  if (!parameter) return [];
  const parts = getImageParts();
  const byId = new Map();
  const add = (part, channel) => {
    if (!part?.id) return;
    const entry = byId.get(part.id) || { part, channels: [] };
    if (!entry.channels.includes(channel)) entry.channels.push(channel);
    byId.set(part.id, entry);
  };

  for (const part of parts) {
    for (const [field, strengthField, channel] of imagePartBindingFields) {
      if (part?.[field] !== parameter) continue;
      const strength = Number(part?.[strengthField] || 0);
      if (Math.abs(strength) > 0.0001) add(part, channel);
    }
    for (const deformer of normalizePartTransformDeformers(part)) {
      if (deformer.parameter === parameter) add(part, "transform");
    }
    for (const deformer of normalizeDrawOrderDeformers(part)) {
      if (deformer.parameter === parameter) add(part, "draw_order");
    }
    const visibilityGate = normalizeImagePartVisibilityGate(part);
    if (visibilityGate.enabled && visibilityGate.parameter === parameter) add(part, "visibility");
    if (!part.mesh?.enabled) continue;
    const mesh = normalizePartMesh(part);
    for (const deformer of mesh.deformers || []) {
      if (deformer.parameter === parameter) add(part, "mesh");
    }
  }

  for (const group of getDeformerGroups()) {
    if (group.enabled === false || group.parameter !== parameter) continue;
    const warp = normalizeDeformerGroupWarp(group.warp || {}, group, rig);
    for (const partId of deformerGroupAffectedPartIds(group)) {
      const part = parts.find((entry) => entry.id === partId);
      if (part) add(part, warp.enabled ? "warp" : "group");
    }
  }

  const directlyDrivenIds = new Set(byId.keys());
  for (const part of parts) {
    if (byId.has(part.id)) continue;
    for (const drivenId of directlyDrivenIds) {
      if (!imagePartHasAncestor(part, drivenId)) continue;
      add(part, "parent");
      break;
    }
  }

  return Array.from(byId.values()).sort((left, right) => {
    const leftOrder = Number(left.part.order ?? 0);
    const rightOrder = Number(right.part.order ?? 0);
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return String(left.part.label || left.part.id).localeCompare(String(right.part.label || right.part.id));
  });
}

function addCustomParameter() {
  const label = window.prompt("파라미터 이름", "커스텀 파라미터");
  if (label === null) return;
  const key = safeSegment(label, "param");
  if (!key) return;
  if (allParameterDefs().some((param) => param.key === key)) {
    showToast(`Parameter already exists: ${key}`);
    return;
  }
  const min = Number(window.prompt("최솟값", "-100"));
  const max = Number(window.prompt("최댓값", "100"));
  const step = Number(window.prompt("간격", "1"));
  const param = normalizeCustomParameter({
    key,
    label: label.trim() || key,
    min: Number.isFinite(min) ? min : -100,
    max: Number.isFinite(max) ? max : 100,
    step: Number.isFinite(step) && step > 0 ? step : 1,
    role: inferParameterRoleFromText(`${key} ${label}`)
  });
  rig.customParameters = [...getCustomParameters(), param];
  rig.params[param.key] = Number.isFinite(Number(rig.params[param.key])) ? Number(rig.params[param.key]) : 0;
  renderParameterControls();
  renderLayerControls();
  renderExpressions();
  renderPhysicsControls();
  commitHistory(`add parameter ${param.key}`);
  showToast(`Parameter added: ${param.label}`);
}

function updateCustomParameterRole(key, role) {
  const cleanKey = safeSegment(key, "");
  const cleanRole = normalizeParameterRole(role) || "generic";
  rig.customParameters = getCustomParameters().map((param) => (
    param.key === cleanKey ? { ...param, role: cleanRole } : param
  ));
  renderParameterControls();
  renderMotionControls();
  commitHistory(`parameter ${cleanKey} role`);
  showToast(`Parameter role: ${cleanKey} · ${parameterRoleLabel(cleanRole)}`);
}

function updateAdaptivePoseIntensity() {
  const settings = getAdaptivePoseSettings();
  settings.intensity = Number(clamp(Number(elements.adaptivePoseIntensity.value || 1), 0.25, 2).toFixed(2));
  renderAdaptivePoseControls();
  renderRigValidation();
}

function setAdaptivePoseParameterEnabled(key, enabled) {
  const parameterKey = knownParameterKey(key);
  if (!parameterKey) return;
  const settings = getAdaptivePoseSettings();
  const disabled = new Set(settings.disabledParameters);
  if (enabled) disabled.delete(parameterKey);
  else disabled.add(parameterKey);
  settings.disabledParameters = [...disabled].sort();
  renderAdaptivePoseControls();
  renderRigValidation();
  commitHistory(`adaptive pose parameter ${parameterKey}`);
  showToast(`${enabled ? "Enabled" : "Disabled"} adaptive pose parameter: ${parameterKey}`);
}

function resetAdaptivePoseTuning() {
  rig.adaptivePose = defaultAdaptivePoseSettings();
  renderAdaptivePoseControls();
  renderRigValidation();
  commitHistory("reset adaptive pose tuning");
  showToast("Adaptive pose tuning reset.");
}

function removeCustomParameter(key) {
  rig.customParameters = getCustomParameters().filter((param) => param.key !== key);
  delete rig.params[key];
  renderParameterControls();
  renderLayerControls();
  renderPhysicsControls();
  commitHistory(`remove parameter ${key}`);
  showToast(`Parameter removed: ${key}`);
}

function renderLayerList() {
  elements.layerList.innerHTML = "";
  for (const layer of layerDefs) {
    const config = getLayer(layer.id);
    const row = document.createElement("div");
    row.className = `layer-row ${selectedLayerId === layer.id ? "selected" : ""}`;
    const visible = document.createElement("input");
    visible.type = "checkbox";
    visible.checked = config.visible !== false;
    visible.addEventListener("change", () => {
      config.visible = visible.checked;
      draw();
      commitHistory(`toggle layer ${layer.id}`);
    });
    const name = document.createElement("button");
    name.type = "button";
    name.className = "layer-name";
    name.textContent = ko(layer.label);
    name.addEventListener("click", () => {
      selectedLayerId = layer.id;
      renderLayerList();
      renderLayerControls();
    });
    const opacity = document.createElement("span");
    opacity.className = "muted";
    opacity.textContent = `${Math.round((config.opacity ?? 1) * 100)}%`;
    row.append(visible, name, opacity);
    elements.layerList.append(row);
  }
  const deformerGroups = getDeformerGroups();
  if (deformerGroups.length > 0) {
    const heading = document.createElement("div");
    heading.className = "layer-group-title";
    heading.textContent = ko("Deformer Groups");
    elements.layerList.append(heading);
  }
  for (const group of deformerGroups) {
    const row = document.createElement("div");
    row.className = `layer-row deformer-group ${selectedLayerId === deformerGroupSelectionId(group.id) ? "selected" : ""}`;
    const enabled = document.createElement("input");
    enabled.type = "checkbox";
    enabled.checked = group.enabled !== false;
    enabled.addEventListener("change", () => {
      group.enabled = enabled.checked;
      draw();
      renderLayerList();
      commitHistory(`toggle deformer group ${group.id}`);
    });
    const name = document.createElement("button");
    name.type = "button";
    name.className = "layer-name";
    name.textContent = group.label || group.id;
    name.addEventListener("click", () => {
      selectedLayerId = deformerGroupSelectionId(group.id);
      renderLayerList();
      renderLayerControls();
    });
    const count = document.createElement("span");
    count.className = "muted";
    count.textContent = `${normalizeDeformerGroupPartIds(group).length} 파츠${group.parentGroupId ? " · 자식" : ""}`;
    row.append(enabled, name, count);
    elements.layerList.append(row);
  }
  const imageParts = sortedImagePartsForList();
  if (imageParts.length > 0) {
    const activeSoloIds = activeSoloImagePartIds(rig);
    const heading = document.createElement("div");
    heading.className = "layer-group-title";
    heading.textContent = ko("Image Parts");
    elements.layerList.append(heading);
    if (activeSoloIds.size > 0) {
      const soloNotice = document.createElement("div");
      soloNotice.className = "layer-solo-notice";
      const soloText = document.createElement("span");
      soloText.textContent = `단독 미리보기 활성: ${activeSoloIds.size}`;
      const clearSolo = document.createElement("button");
      clearSolo.type = "button";
      clearSolo.textContent = ko("Clear");
      clearSolo.addEventListener("click", clearImagePartSolo);
      soloNotice.append(soloText, clearSolo);
      elements.layerList.append(soloNotice);
    }
  }
  const activeSoloIds = activeSoloImagePartIds(rig);
  for (const part of imageParts) {
    const soloActive = activeSoloIds.has(part.id);
    const soloMuted = activeSoloIds.size > 0 && !soloActive;
    const row = document.createElement("div");
    row.className = `layer-row image-part ${part.parentPartId ? "child-part" : ""} ${part.locked ? "locked-part" : ""} ${soloActive ? "solo-part" : ""} ${soloMuted ? "solo-muted" : ""} ${selectedLayerId === partSelectionId(part.id) ? "selected" : ""}`;
    const visible = document.createElement("input");
    visible.type = "checkbox";
    visible.title = "이미지 파츠 표시";
    visible.checked = part.visible !== false;
    visible.addEventListener("change", () => {
      part.visible = visible.checked;
      draw();
      commitHistory(`toggle image part ${part.id}`);
    });
    const locked = document.createElement("input");
    locked.type = "checkbox";
    locked.title = "캔버스에서 이미지 파츠 잠금";
    locked.checked = part.locked === true;
    locked.addEventListener("change", () => {
      part.locked = locked.checked;
      renderLayerList();
      renderLayerControls();
      draw();
      commitHistory(`lock image part ${part.id}`);
    });
    const solo = document.createElement("button");
    solo.type = "button";
    solo.className = `layer-solo-button ${soloActive ? "active" : ""}`;
    solo.title = soloActive ? "단독 미리보기 해제" : "단독 미리보기";
    solo.textContent = "S";
    solo.addEventListener("click", () => setImagePartSolo(part.id, !soloActive));
    const name = document.createElement("button");
    name.type = "button";
    name.className = "layer-name";
    name.textContent = `${part.parentPartId ? "> " : ""}${part.label || part.id}`;
    name.addEventListener("click", () => {
      selectedLayerId = partSelectionId(part.id);
      renderLayerList();
      renderLayerControls();
    });
    const opacity = document.createElement("span");
    opacity.className = "muted";
    const baseOrder = Number(part.order ?? 0);
    const currentOrder = effectiveImagePartOrder(rig, part);
    opacity.textContent = Math.abs(currentOrder - baseOrder) > 0.001
      ? `${part.slot === "back" ? "B" : "F"}:${formatCompactNumber(baseOrder)}>${formatCompactNumber(currentOrder)}`
      : `${part.slot === "back" ? "B" : "F"}:${formatCompactNumber(baseOrder)}`;
    if (part.locked === true) opacity.textContent = `L · ${opacity.textContent}`;
    row.append(visible, locked, solo, name, opacity);
    elements.layerList.append(row);
  }
}

function renderLayerControls() {
  const selectedGroup = selectedDeformerGroup();
  if (selectedGroup) {
    renderDeformerGroupControls(selectedGroup);
    return;
  }
  const selectedPart = selectedImagePart();
  if (selectedPart) {
    renderImagePartControls(selectedPart);
    return;
  }
  const def = layerDefs.find((entry) => entry.id === selectedLayerId);
  const config = getLayer(selectedLayerId);
  elements.selectedLayerName.textContent = def?.label ? ko(def.label) : ko("None");
  elements.layerControls.innerHTML = "";
  if (!def) return;

  addRangeControl(elements.layerControls, "Opacity", config.opacity ?? 1, 0, 1, 0.01, (value) => {
    config.opacity = value;
    renderLayerList();
    draw();
  }, `layer ${selectedLayerId} opacity`);
  addRangeControl(elements.layerControls, "Offset X", config.offsetX ?? 0, -240, 240, 1, (value) => {
    config.offsetX = value;
    draw();
  }, `layer ${selectedLayerId} x`);
  addRangeControl(elements.layerControls, "Offset Y", config.offsetY ?? 0, -240, 240, 1, (value) => {
    config.offsetY = value;
    draw();
  }, `layer ${selectedLayerId} y`);
  addRangeControl(elements.layerControls, "Scale", config.scale ?? 1, 0.2, 2.2, 0.01, (value) => {
    config.scale = value;
    draw();
  }, `layer ${selectedLayerId} scale`);
  addRangeControl(elements.layerControls, "Rotation", config.rotation ?? 0, -60, 60, 1, (value) => {
    config.rotation = value;
    draw();
  }, `layer ${selectedLayerId} rotation`);

  if (def.colorKey) {
    const field = document.createElement("label");
    field.className = "field";
    const label = document.createElement("span");
    label.textContent = ko("Color");
    const input = document.createElement("input");
    input.type = "color";
    input.value = rig.palette[def.colorKey] || "#ffffff";
    input.addEventListener("input", () => {
      rig.palette[def.colorKey] = input.value;
      renderPaletteControls();
      draw();
      commitHistory(`palette ${def.colorKey}`);
    });
    field.append(label, input);
    elements.layerControls.append(field);
  }
}

function renderImagePartControls(part) {
  elements.selectedLayerName.textContent = ko(part.label || part.id || "Image Part");
  elements.layerControls.innerHTML = "";

  addTextControl(elements.layerControls, "Name", part.label || "", (value) => {
    part.label = value.trim() || part.id;
    renderLayerList();
  }, `rename image part ${part.id}`);
  addToggleControl(elements.layerControls, "Lock canvas editing", part.locked === true, (checked) => {
    part.locked = checked;
    renderLayerList();
    draw();
  }, `image part ${part.id} lock`);
  addToggleControl(elements.layerControls, "Solo in preview", activeSoloImagePartIds(rig).has(part.id), (checked) => {
    setImagePartSolo(part.id, checked);
  });
  addSelectControl(elements.layerControls, "Parent", normalizeImagePartParentId(part.parentPartId, part.id), imagePartParentOptions(part), (value) => {
    setImagePartParentKeepWorld(part, value);
    renderLayerList();
    renderLayerControls();
    draw();
  }, `image part ${part.id} parent`);
  addSelectControl(elements.layerControls, "Slot", part.slot || "front", [
    ["back", "Behind generated model"],
    ["front", "In front of generated model"]
  ], (value) => {
    part.slot = value;
    part.order = nextImagePartOrder(value);
    normalizeImagePartOrders(value);
    renderLayerList();
    renderLayerControls();
    draw();
  }, `image part ${part.id} slot`);
  addRangeControl(elements.layerControls, "Draw Order", part.order ?? 0, -50, 50, 1, (value) => {
    part.order = value;
    renderLayerList();
    draw();
  }, `image part ${part.id} order`);
  elements.layerControls.append(createImagePartOrderControls(part));
  addSelectControl(elements.layerControls, "Blend", normalizeImagePartBlendMode(part.blendMode), imagePartBlendModes, (value) => {
    part.blendMode = normalizeImagePartBlendMode(value);
    draw();
  }, `image part ${part.id} blend`);
  addSelectControl(elements.layerControls, "Clip Shape", normalizeImagePartClipShape(part.clipShape), imagePartClipShapes, (value) => {
    part.clipShape = normalizeImagePartClipShape(value);
    draw();
  }, `image part ${part.id} clip`);
  addSelectControl(elements.layerControls, "Clip Mask", part.clipPartId || "", imagePartMaskOptions(part), (value) => {
    part.clipPartId = normalizeImagePartClipPartId(value, part.id);
    draw();
  }, `image part ${part.id} mask`);
  addRangeControl(elements.layerControls, "Clip Inset", part.clipInset ?? 0, 0, 0.45, 0.01, (value) => {
    part.clipInset = value;
    draw();
  }, `image part ${part.id} clip inset`);
  addRangeControl(elements.layerControls, "Clip Radius", part.clipRadius ?? 0.12, 0, 0.5, 0.01, (value) => {
    part.clipRadius = value;
    draw();
  }, `image part ${part.id} clip radius`);
  addRangeControl(elements.layerControls, "Opacity", part.opacity ?? 1, 0, 1, 0.01, (value) => {
    part.opacity = value;
    renderLayerList();
    draw();
  }, `image part ${part.id} opacity`);

  const visibilityGate = normalizeImagePartVisibilityGate(part);
  addToggleControl(elements.layerControls, "Use visibility gate", visibilityGate.enabled, (checked) => {
    part.visibilityGate = {
      ...normalizeImagePartVisibilityGate(part),
      enabled: checked
    };
    renderLayerControls();
    draw();
  }, `image part ${part.id} visibility gate`);
  if (visibilityGate.enabled) {
    const gateDefinition = parameterDefinitionForKey(visibilityGate.parameter) || allParameterDefs()[0] || { key: "angleX", label: "Angle X", min: -100, max: 100, step: 1 };
    const gateMin = Number.isFinite(Number(visibilityGate.min)) ? Number(visibilityGate.min) : Number(gateDefinition.min);
    const gateMax = Number.isFinite(Number(visibilityGate.max)) ? Number(visibilityGate.max) : Number(gateDefinition.max);
    const gateRange = Math.max(1, Number(gateDefinition.max) - Number(gateDefinition.min));
    addSelectControl(elements.layerControls, "Gate Param", visibilityGate.parameter, allParameterDefs().map((param) => [param.key, param.label]), (value) => {
      const nextParam = knownParameterKey(value) || "angleX";
      const nextDefinition = parameterDefinitionForKey(nextParam) || gateDefinition;
      part.visibilityGate = {
        ...normalizeImagePartVisibilityGate(part),
        parameter: nextParam,
        min: Number(nextDefinition.min),
        max: Number(nextDefinition.max)
      };
      renderLayerControls();
      draw();
    }, `image part ${part.id} visibility param`);
    addRangeControl(elements.layerControls, "Visible Min", gateMin, Number(gateDefinition.min), Number(gateDefinition.max), Number(gateDefinition.step || 1), (value) => {
      part.visibilityGate = {
        ...normalizeImagePartVisibilityGate(part),
        min: value
      };
      draw();
    }, `image part ${part.id} visibility min`);
    addRangeControl(elements.layerControls, "Visible Max", gateMax, Number(gateDefinition.min), Number(gateDefinition.max), Number(gateDefinition.step || 1), (value) => {
      part.visibilityGate = {
        ...normalizeImagePartVisibilityGate(part),
        max: value
      };
      draw();
    }, `image part ${part.id} visibility max`);
    addRangeControl(elements.layerControls, "Gate Fade", visibilityGate.fade ?? 0, 0, gateRange * 0.5, Number(gateDefinition.step || 1), (value) => {
      part.visibilityGate = {
        ...normalizeImagePartVisibilityGate(part),
        fade: value
      };
      draw();
    }, `image part ${part.id} visibility fade`);
    const gateSummary = document.createElement("div");
    gateSummary.className = "mesh-key-summary";
    gateSummary.textContent = visibilityGateSummary(part);
    elements.layerControls.append(gateSummary);
  }
  addRangeControl(elements.layerControls, "X", part.x ?? rig.canvas.width * 0.5, -400, rig.canvas.width + 400, 1, (value) => {
    part.x = value;
    draw();
  }, `image part ${part.id} x`);
  addRangeControl(elements.layerControls, "Y", part.y ?? rig.canvas.height * 0.5, -400, rig.canvas.height + 400, 1, (value) => {
    part.y = value;
    draw();
  }, `image part ${part.id} y`);
  addRangeControl(elements.layerControls, "Scale X", part.scaleX ?? 1, -3, 3, 0.01, (value) => {
    part.scaleX = value;
    draw();
  }, `image part ${part.id} scaleX`);
  addRangeControl(elements.layerControls, "Scale Y", part.scaleY ?? 1, -3, 3, 0.01, (value) => {
    part.scaleY = value;
    draw();
  }, `image part ${part.id} scaleY`);
  addRangeControl(elements.layerControls, "Rotation", part.rotation ?? 0, -180, 180, 1, (value) => {
    part.rotation = value;
    draw();
  }, `image part ${part.id} rotation`);
  addRangeControl(elements.layerControls, "Anchor X", part.anchorX ?? 0.5, 0, 1, 0.01, (value) => {
    part.anchorX = value;
    draw();
  }, `image part ${part.id} anchorX`);
  addRangeControl(elements.layerControls, "Anchor Y", part.anchorY ?? 0.5, 0, 1, 0.01, (value) => {
    part.anchorY = value;
    draw();
  }, `image part ${part.id} anchorY`);

  const hitAreaHeader = document.createElement("div");
  hitAreaHeader.className = "control-subheading";
  hitAreaHeader.textContent = ko("Hit Area");
  elements.layerControls.append(hitAreaHeader);
  addToggleControl(elements.layerControls, "Use as hit area", normalizeImagePartHitArea(part).enabled, (checked) => {
    part.hitArea = {
      ...normalizeImagePartHitArea(part),
      enabled: checked
    };
    renderLayerControls();
    draw();
  }, `image part ${part.id} hit area`);
  if (normalizeImagePartHitArea(part).enabled) {
    addTextControl(elements.layerControls, "Hit ID", normalizeImagePartHitArea(part).id, (value) => {
      part.hitArea = {
        ...normalizeImagePartHitArea(part),
        id: safeSegment(value, normalizeImagePartHitArea(part).id)
      };
    }, `image part ${part.id} hit id`);
    addTextControl(elements.layerControls, "Hit Label", normalizeImagePartHitArea(part).label, (value) => {
      part.hitArea = {
        ...normalizeImagePartHitArea(part),
        label: value.trim() || normalizeImagePartHitArea(part).label
      };
    }, `image part ${part.id} hit label`);
    addSelectControl(elements.layerControls, "Hit Kind", normalizeImagePartHitArea(part).kind, [
      ["generic", "Generic"],
      ["head", "Head"],
      ["face", "Face"],
      ["body", "Body"],
      ["hand", "Hand"],
      ["prop", "Prop"]
    ], (value) => {
      part.hitArea = {
        ...normalizeImagePartHitArea(part),
        kind: normalizeHitAreaKind(value)
      };
    }, `image part ${part.id} hit kind`);
  }

  const autoBindButton = document.createElement("button");
  autoBindButton.type = "button";
  autoBindButton.textContent = ko("Auto Bind from Name");
  autoBindButton.addEventListener("click", () => {
    const profile = applyAutoImagePartBinding(part, { assignOrder: true });
    normalizeImagePartOrders();
    renderLayerList();
    renderLayerControls();
    draw();
    commitHistory(`auto bind ${part.id}`);
    showToast(`Auto bound ${part.label || part.id}: ${profile.label}`);
  });
  elements.layerControls.append(autoBindButton);
  const autoPlaceButton = document.createElement("button");
  autoPlaceButton.type = "button";
  autoPlaceButton.textContent = ko("Auto Place from Name");
  autoPlaceButton.addEventListener("click", () => {
    const profile = applyAutoImagePartPlacement(part, { assignOrder: true });
    normalizeImagePartOrders();
    renderLayerList();
    renderLayerControls();
    draw();
    commitHistory(`auto place ${part.id}`);
    showToast(`Auto placed ${part.label || part.id}: ${profile.label}`);
  });
  elements.layerControls.append(autoPlaceButton);
  const autoParentButton = document.createElement("button");
  autoParentButton.type = "button";
  autoParentButton.textContent = ko("Auto Parent from Name");
  autoParentButton.addEventListener("click", () => {
    const profile = applyAutoImagePartParent(part);
    renderLayerList();
    renderLayerControls();
    draw();
    commitHistory(`auto parent ${part.id}`);
    showToast(`Auto parent ${part.label || part.id}: ${profile.parentLabel || "None"}`);
  });
  elements.layerControls.append(autoParentButton);
  const autoGateButton = document.createElement("button");
  autoGateButton.type = "button";
  autoGateButton.textContent = ko("Auto Gate from Name");
  autoGateButton.addEventListener("click", () => {
    const profile = applyAutoImagePartVisibilityGate(part, { clearWhenMissing: true });
    renderLayerControls();
    renderParameterInfluenceInspector();
    draw();
    commitHistory(`auto visibility gate ${part.id}`);
    showToast(`Auto gate ${part.label || part.id}: ${profile.enabled ? `${profile.label} ${profile.parameter}` : "None"}`);
  });
  elements.layerControls.append(autoGateButton);
  addSelectControl(elements.layerControls, "Bind X", part.bindX || "", bindingOptions(), (value) => {
    part.bindX = value;
    draw();
  }, `image part ${part.id} bindX`);
  addRangeControl(elements.layerControls, "Bind X Amt", part.bindXStrength ?? 0, -300, 300, 1, (value) => {
    part.bindXStrength = value;
    draw();
  }, `image part ${part.id} bindX amount`);
  addSelectControl(elements.layerControls, "Bind Y", part.bindY || "", bindingOptions(), (value) => {
    part.bindY = value;
    draw();
  }, `image part ${part.id} bindY`);
  addRangeControl(elements.layerControls, "Bind Y Amt", part.bindYStrength ?? 0, -300, 300, 1, (value) => {
    part.bindYStrength = value;
    draw();
  }, `image part ${part.id} bindY amount`);
  addSelectControl(elements.layerControls, "Bind Rot", part.bindRotation || "", bindingOptions(), (value) => {
    part.bindRotation = value;
    draw();
  }, `image part ${part.id} bindRotation`);
  addRangeControl(elements.layerControls, "Bind Rot Amt", part.bindRotationStrength ?? 0, -90, 90, 1, (value) => {
    part.bindRotationStrength = value;
    draw();
  }, `image part ${part.id} bindRotation amount`);
  addSelectControl(elements.layerControls, "Bind Scale X", part.bindScaleX || "", bindingOptions(), (value) => {
    part.bindScaleX = value;
    draw();
  }, `image part ${part.id} bindScaleX`);
  addRangeControl(elements.layerControls, "Bind Scale X Amt", part.bindScaleXStrength ?? 0, -2, 2, 0.01, (value) => {
    part.bindScaleXStrength = value;
    draw();
  }, `image part ${part.id} bindScaleX amount`);
  addSelectControl(elements.layerControls, "Bind Scale Y", part.bindScaleY || "", bindingOptions(), (value) => {
    part.bindScaleY = value;
    draw();
  }, `image part ${part.id} bindScaleY`);
  addRangeControl(elements.layerControls, "Bind Scale Y Amt", part.bindScaleYStrength ?? 0, -2, 2, 0.01, (value) => {
    part.bindScaleYStrength = value;
    draw();
  }, `image part ${part.id} bindScaleY amount`);
  addSelectControl(elements.layerControls, "Bind Opacity", part.bindOpacity || "", bindingOptions(), (value) => {
    part.bindOpacity = value;
    draw();
  }, `image part ${part.id} bindOpacity`);
  addRangeControl(elements.layerControls, "Bind Opacity Amt", part.bindOpacityStrength ?? 0, -1, 1, 0.01, (value) => {
    part.bindOpacityStrength = value;
    draw();
  }, `image part ${part.id} bindOpacity amount`);

  const transformHeader = document.createElement("div");
  transformHeader.className = "control-subheading";
  transformHeader.textContent = ko("Transform Keys");
  elements.layerControls.append(transformHeader);

  addSelectControl(elements.layerControls, "Key Param", part.transformKeyParam || "angleX", allParameterDefs().map((param) => [param.key, param.label]), (value) => {
    part.transformKeyParam = value || "angleX";
    renderLayerControls();
    draw();
  }, `transform key ${part.id} param`);

  const transformSummary = document.createElement("div");
  transformSummary.className = "mesh-key-summary";
  transformSummary.textContent = transformKeySummary(part);
  elements.layerControls.append(transformSummary);

  elements.layerControls.append(createTransformKeyframeList(part));

  const transformKeyButton = document.createElement("button");
  transformKeyButton.type = "button";
  transformKeyButton.textContent = ko("Set Transform Key at Current Param");
  transformKeyButton.addEventListener("click", () => {
    setPartTransformKeyframe(part);
    renderLayerControls();
    draw();
    commitHistory(`transform key ${part.id}`);
  });
  elements.layerControls.append(transformKeyButton);

  const clearTransformKeysButton = document.createElement("button");
  clearTransformKeysButton.type = "button";
  clearTransformKeysButton.textContent = ko("Clear Transform Keys");
  clearTransformKeysButton.addEventListener("click", () => {
    part.transformDeformers = [];
    renderLayerControls();
    draw();
    commitHistory(`clear transform keys ${part.id}`);
  });
  elements.layerControls.append(clearTransformKeysButton);

  const drawOrderHeader = document.createElement("div");
  drawOrderHeader.className = "control-subheading";
  drawOrderHeader.textContent = ko("Draw Order Keys");
  elements.layerControls.append(drawOrderHeader);

  addSelectControl(elements.layerControls, "Order Key Param", part.drawOrderKeyParam || "angleX", allParameterDefs().map((param) => [param.key, param.label]), (value) => {
    part.drawOrderKeyParam = value || "angleX";
    renderLayerControls();
    draw();
  }, `draw order key ${part.id} param`);

  const drawOrderSummary = document.createElement("div");
  drawOrderSummary.className = "mesh-key-summary";
  drawOrderSummary.textContent = drawOrderKeySummary(part);
  elements.layerControls.append(drawOrderSummary);

  elements.layerControls.append(createDrawOrderKeyframeList(part));

  const drawOrderKeyButton = document.createElement("button");
  drawOrderKeyButton.type = "button";
  drawOrderKeyButton.textContent = ko("Set Draw Order Key at Current Param");
  drawOrderKeyButton.addEventListener("click", () => {
    setDrawOrderKeyframe(part);
    renderLayerList();
    renderLayerControls();
    draw();
    commitHistory(`draw order key ${part.id}`);
  });
  elements.layerControls.append(drawOrderKeyButton);

  const clearDrawOrderKeysButton = document.createElement("button");
  clearDrawOrderKeysButton.type = "button";
  clearDrawOrderKeysButton.textContent = ko("Clear Draw Order Keys");
  clearDrawOrderKeysButton.addEventListener("click", () => {
    part.drawOrderDeformers = [];
    renderLayerList();
    renderLayerControls();
    draw();
    commitHistory(`clear draw order keys ${part.id}`);
  });
  elements.layerControls.append(clearDrawOrderKeysButton);

  const meshHeader = document.createElement("div");
  meshHeader.className = "control-subheading";
  meshHeader.textContent = ko("Mesh Deformer");
  elements.layerControls.append(meshHeader);

  const autoMeshButton = document.createElement("button");
  autoMeshButton.type = "button";
  autoMeshButton.textContent = ko("Auto Mesh from Name");
  autoMeshButton.addEventListener("click", () => {
    const profile = applyAutoImagePartMesh(part);
    renderLayerControls();
    draw();
    commitHistory(`auto mesh ${part.id}`);
    showToast(`Auto mesh ${part.label || part.id}: ${profile.columns} x ${profile.rows}`);
  });
  elements.layerControls.append(autoMeshButton);
  const autoDeformButton = document.createElement("button");
  autoDeformButton.type = "button";
  autoDeformButton.textContent = ko("Auto Deform from Name");
  autoDeformButton.addEventListener("click", () => {
    const profile = applyAutoImagePartDeform(part);
    renderLayerControls();
    draw();
    commitHistory(`auto deform ${part.id}`);
    showToast(`Auto deform ${part.label || part.id}: ${profile.parameter}`);
  });
  elements.layerControls.append(autoDeformButton);

  const templateRow = document.createElement("div");
  templateRow.className = "part-order-buttons";
  const exportTemplateButton = document.createElement("button");
  exportTemplateButton.type = "button";
  exportTemplateButton.textContent = ko("Export Rig Template");
  exportTemplateButton.addEventListener("click", () => exportImagePartRigTemplate(part));
  const importTemplateButton = document.createElement("button");
  importTemplateButton.type = "button";
  importTemplateButton.textContent = ko("Import Rig Template");
  importTemplateButton.addEventListener("click", () => requestImagePartRigTemplateImport(part));
  templateRow.append(exportTemplateButton, importTemplateButton);
  elements.layerControls.append(templateRow);

  if (!part.mesh?.enabled) {
    const createMeshButton = document.createElement("button");
    createMeshButton.type = "button";
    createMeshButton.textContent = ko("Create 3 x 3 Mesh");
    createMeshButton.addEventListener("click", () => {
      part.mesh = createPartMesh(part, 3, 3);
      renderLayerControls();
      draw();
      commitHistory(`create mesh ${part.id}`);
    });
    elements.layerControls.append(createMeshButton);
  } else {
    const mesh = normalizePartMesh(part);
    addRangeControl(elements.layerControls, "Columns", mesh.columns, 2, 8, 1, (value) => {
      part.mesh = createPartMesh(part, Math.round(value), mesh.rows);
      renderLayerControls();
      draw();
    }, `mesh ${part.id} columns`);
    addRangeControl(elements.layerControls, "Rows", mesh.rows, 2, 8, 1, (value) => {
      part.mesh = createPartMesh(part, mesh.columns, Math.round(value));
      renderLayerControls();
      draw();
    }, `mesh ${part.id} rows`);
    addToggleControl(elements.layerControls, "Edit vertices on canvas", mesh.editing !== false, (checked) => {
      part.mesh.editing = checked;
      draw();
    }, `mesh ${part.id} editing`);
    addSelectControl(elements.layerControls, "Mesh Key Param", mesh.deformerParam || "angleX", allParameterDefs().map((param) => [param.key, param.label]), (value) => {
      part.mesh.deformerParam = value || "angleX";
      renderLayerControls();
      draw();
    }, `mesh ${part.id} key param`);

    const keySummary = document.createElement("div");
    keySummary.className = "mesh-key-summary";
    keySummary.textContent = meshKeySummary(mesh);
    elements.layerControls.append(keySummary);

    elements.layerControls.append(createMeshKeyframeList(part));

    const keyButton = document.createElement("button");
    keyButton.type = "button";
    keyButton.textContent = ko("Set Mesh Key at Current Param");
    keyButton.addEventListener("click", () => {
      setMeshKeyframe(part);
      renderLayerControls();
      draw();
      commitHistory(`mesh key ${part.id}`);
    });
    elements.layerControls.append(keyButton);

    const clearKeysButton = document.createElement("button");
    clearKeysButton.type = "button";
    clearKeysButton.textContent = ko("Clear Mesh Keys");
    clearKeysButton.addEventListener("click", () => {
      part.mesh.deformers = [];
      renderLayerControls();
      draw();
      commitHistory(`clear mesh keys ${part.id}`);
    });
    elements.layerControls.append(clearKeysButton);

    const resetMeshButton = document.createElement("button");
    resetMeshButton.type = "button";
    resetMeshButton.textContent = ko("Reset Mesh Shape");
    resetMeshButton.addEventListener("click", () => {
      part.mesh = createPartMesh(part, mesh.columns, mesh.rows);
      draw();
      commitHistory(`reset mesh ${part.id}`);
    });
    elements.layerControls.append(resetMeshButton);
  }

  const duplicateRow = document.createElement("div");
  duplicateRow.className = "part-order-buttons";
  const duplicateButton = document.createElement("button");
  duplicateButton.type = "button";
  duplicateButton.textContent = ko("Duplicate");
  duplicateButton.addEventListener("click", () => duplicateImagePart(part, false));
  const mirrorButton = document.createElement("button");
  mirrorButton.type = "button";
  mirrorButton.textContent = ko("Mirror Duplicate");
  mirrorButton.addEventListener("click", () => duplicateImagePart(part, true));
  duplicateRow.append(duplicateButton, mirrorButton);
  elements.layerControls.append(duplicateRow);

  const removeButton = document.createElement("button");
  removeButton.className = "danger-button";
  removeButton.type = "button";
  removeButton.textContent = ko("Remove Image Part");
  removeButton.addEventListener("click", () => {
    rig.imageParts = getImageParts().filter((entry) => entry.id !== part.id);
    selectedLayerId = "frontHair";
    renderLayerList();
    renderLayerControls();
    draw();
    commitHistory(`remove image part ${part.id}`);
  });
  elements.layerControls.append(removeButton);
}

function renderDeformerGroupControls(group) {
  elements.selectedLayerName.textContent = ko(group.label || group.id || "Deformer Group");
  elements.layerControls.innerHTML = "";
  group.warp = normalizeDeformerGroupWarp(group.warp || {}, group, rig);

  addTextControl(elements.layerControls, "Name", group.label || "", (value) => {
    group.label = value.trim() || group.id;
    renderLayerList();
  }, `rename deformer group ${group.id}`);
  addSelectControl(elements.layerControls, "Parent Deformer", normalizeDeformerGroupParentId(group.parentGroupId, group.id), deformerGroupParentOptions(group), (value) => {
    setDeformerGroupParentKeepWorld(group, value);
    renderLayerList();
    renderLayerControls();
    draw();
  }, `deformer group ${group.id} parent`);
  addToggleControl(elements.layerControls, "Enabled", group.enabled !== false, (checked) => {
    group.enabled = checked;
    renderLayerList();
    draw();
  }, `deformer group ${group.id} enabled`);
  addSelectControl(elements.layerControls, "Key Param", group.parameter || "angleX", bindingOptions().filter(([value]) => value), (value) => {
    group.parameter = knownParameterKey(value) || "angleX";
    renderLayerControls();
    draw();
  }, `deformer group ${group.id} param`);
  addRangeControl(elements.layerControls, "X", group.x ?? rig.canvas.width * 0.5, -400, rig.canvas.width + 400, 1, (value) => {
    group.x = value;
    draw();
  }, `deformer group ${group.id} x`);
  addRangeControl(elements.layerControls, "Y", group.y ?? rig.canvas.height * 0.5, -400, rig.canvas.height + 400, 1, (value) => {
    group.y = value;
    draw();
  }, `deformer group ${group.id} y`);
  addRangeControl(elements.layerControls, "Scale X", group.scaleX ?? 1, -3, 3, 0.01, (value) => {
    group.scaleX = value;
    draw();
  }, `deformer group ${group.id} scaleX`);
  addRangeControl(elements.layerControls, "Scale Y", group.scaleY ?? 1, -3, 3, 0.01, (value) => {
    group.scaleY = value;
    draw();
  }, `deformer group ${group.id} scaleY`);
  addRangeControl(elements.layerControls, "Rotation", group.rotation ?? 0, -180, 180, 1, (value) => {
    group.rotation = value;
    draw();
  }, `deformer group ${group.id} rotation`);
  addRangeControl(elements.layerControls, "Opacity", group.opacity ?? 1, 0, 1, 0.01, (value) => {
    group.opacity = value;
    draw();
  }, `deformer group ${group.id} opacity`);

  const warpHeader = document.createElement("div");
  warpHeader.className = "control-subheading";
  warpHeader.textContent = ko("Warp Deformer");
  elements.layerControls.append(warpHeader);
  addToggleControl(elements.layerControls, "Use warp grid", group.warp.enabled === true, (checked) => {
    group.warp.enabled = checked;
    renderLayerControls();
    draw();
  }, `deformer group ${group.id} warp`);
  if (group.warp.enabled) {
    addRangeControl(elements.layerControls, "Warp Width", group.warp.width, 24, rig.canvas.width * 1.5, 1, (value) => {
      group.warp.width = value;
      draw();
    }, `deformer group ${group.id} warp width`);
    addRangeControl(elements.layerControls, "Warp Height", group.warp.height, 24, rig.canvas.height * 1.5, 1, (value) => {
      group.warp.height = value;
      draw();
    }, `deformer group ${group.id} warp height`);
    addRangeControl(elements.layerControls, "Warp Columns", group.warp.columns, 2, 6, 1, (value) => {
      group.warp = resizeDeformerGroupWarp(group.warp, Math.round(value), group.warp.rows);
      renderLayerControls();
      draw();
    }, `deformer group ${group.id} warp columns`);
    addRangeControl(elements.layerControls, "Warp Rows", group.warp.rows, 2, 6, 1, (value) => {
      group.warp = resizeDeformerGroupWarp(group.warp, group.warp.columns, Math.round(value));
      renderLayerControls();
      draw();
    }, `deformer group ${group.id} warp rows`);
    addToggleControl(elements.layerControls, "Edit warp on canvas", group.warp.editing !== false, (checked) => {
      group.warp.editing = checked;
      draw();
    }, `deformer group ${group.id} warp editing`);

    const warpButtonRow = document.createElement("div");
    warpButtonRow.className = "part-order-buttons";
    const fitWarpButton = document.createElement("button");
    fitWarpButton.type = "button";
    fitWarpButton.textContent = ko("Fit Bounds");
    fitWarpButton.addEventListener("click", () => {
      fitDeformerGroupWarpToAffectedParts(group);
      renderLayerControls();
      draw();
      commitHistory(`fit deformer warp ${group.id}`);
    });
    const resetWarpButton = document.createElement("button");
    resetWarpButton.type = "button";
    resetWarpButton.textContent = ko("Reset Warp");
    resetWarpButton.addEventListener("click", () => {
      group.warp.vertices = createWarpGrid(group.warp.columns, group.warp.rows).vertices;
      renderLayerControls();
      draw();
      commitHistory(`reset deformer warp ${group.id}`);
    });
    warpButtonRow.append(fitWarpButton, resetWarpButton);
    elements.layerControls.append(warpButtonRow);

    const warpSummary = document.createElement("div");
    warpSummary.className = "mesh-key-summary";
    warpSummary.textContent = warpKeySummary(group);
    elements.layerControls.append(warpSummary);
    elements.layerControls.append(createDeformerGroupWarpKeyframeList(group));

    const warpKeyButton = document.createElement("button");
    warpKeyButton.type = "button";
    warpKeyButton.textContent = ko("Set Warp Key at Current Param");
    warpKeyButton.addEventListener("click", () => {
      setDeformerGroupWarpKeyframe(group);
      renderLayerControls();
      draw();
      commitHistory(`deformer group warp key ${group.id}`);
    });
    elements.layerControls.append(warpKeyButton);

    const clearWarpKeysButton = document.createElement("button");
    clearWarpKeysButton.type = "button";
    clearWarpKeysButton.textContent = ko("Clear Warp Keys");
    clearWarpKeysButton.addEventListener("click", () => {
      group.warp.keyframes = [];
      renderLayerControls();
      draw();
      commitHistory(`clear deformer warp keys ${group.id}`);
    });
    elements.layerControls.append(clearWarpKeysButton);
  }

  const partsHeader = document.createElement("div");
  partsHeader.className = "control-subheading";
  partsHeader.textContent = ko("Affected Parts");
  elements.layerControls.append(partsHeader);
  elements.layerControls.append(createDeformerGroupPartList(group));

  const partButtonRow = document.createElement("div");
  partButtonRow.className = "part-order-buttons";
  const selectVisibleButton = document.createElement("button");
  selectVisibleButton.type = "button";
  selectVisibleButton.textContent = ko("Select Visible");
  selectVisibleButton.addEventListener("click", () => {
    group.partIds = getImageParts().filter((part) => part.visible !== false).map((part) => part.id);
    renderLayerList();
    renderLayerControls();
    draw();
    commitHistory(`deformer group ${group.id} visible parts`);
  });
  const clearPartsButton = document.createElement("button");
  clearPartsButton.type = "button";
  clearPartsButton.textContent = ko("Clear Parts");
  clearPartsButton.addEventListener("click", () => {
    group.partIds = [];
    renderLayerList();
    renderLayerControls();
    draw();
    commitHistory(`deformer group ${group.id} clear parts`);
  });
  partButtonRow.append(selectVisibleButton, clearPartsButton);
  elements.layerControls.append(partButtonRow);

  const keyHeader = document.createElement("div");
  keyHeader.className = "control-subheading";
  keyHeader.textContent = ko("Group Transform Keys");
  elements.layerControls.append(keyHeader);
  const summary = document.createElement("div");
  summary.className = "mesh-key-summary";
  summary.textContent = deformerGroupKeySummary(group);
  elements.layerControls.append(summary);
  elements.layerControls.append(createDeformerGroupKeyframeList(group));

  const keyButton = document.createElement("button");
  keyButton.type = "button";
  keyButton.textContent = ko("Set Group Key at Current Param");
  keyButton.addEventListener("click", () => {
    setDeformerGroupKeyframe(group);
    renderLayerControls();
    draw();
    commitHistory(`deformer group key ${group.id}`);
  });
  elements.layerControls.append(keyButton);

  const clearKeysButton = document.createElement("button");
  clearKeysButton.type = "button";
  clearKeysButton.textContent = ko("Clear Group Keys");
  clearKeysButton.addEventListener("click", () => {
    group.keyframes = [];
    renderLayerControls();
    draw();
    commitHistory(`clear deformer group keys ${group.id}`);
  });
  elements.layerControls.append(clearKeysButton);

  const duplicateRow = document.createElement("div");
  duplicateRow.className = "part-order-buttons";
  const duplicateButton = document.createElement("button");
  duplicateButton.type = "button";
  duplicateButton.textContent = ko("Duplicate");
  duplicateButton.addEventListener("click", () => duplicateDeformerGroup(group, false));
  const mirrorButton = document.createElement("button");
  mirrorButton.type = "button";
  mirrorButton.textContent = ko("Mirror Duplicate");
  mirrorButton.addEventListener("click", () => duplicateDeformerGroup(group, true));
  duplicateRow.append(duplicateButton, mirrorButton);
  elements.layerControls.append(duplicateRow);

  const removeButton = document.createElement("button");
  removeButton.className = "danger-button";
  removeButton.type = "button";
  removeButton.textContent = ko("Remove Deformer Group");
  removeButton.addEventListener("click", () => {
    rig.deformerGroups = getDeformerGroups().filter((entry) => entry.id !== group.id);
    selectedLayerId = "frontHair";
    renderLayerList();
    renderLayerControls();
    draw();
    commitHistory(`remove deformer group ${group.id}`);
  });
  elements.layerControls.append(removeButton);
}

function createDeformerGroupPartList(group) {
  const list = document.createElement("div");
  list.className = "deformer-part-list";
  const selectedIds = new Set(normalizeDeformerGroupPartIds(group));
  const parts = sortedImagePartsForList();
  if (parts.length === 0) {
    const empty = document.createElement("div");
    empty.className = "part-keyframe-empty";
    empty.textContent = ko("No image parts.");
    list.append(empty);
    return list;
  }
  for (const part of parts) {
    const label = document.createElement("label");
    label.className = "toggle-line compact";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = selectedIds.has(part.id);
    input.addEventListener("change", () => {
      const next = new Set(normalizeDeformerGroupPartIds(group));
      if (input.checked) next.add(part.id);
      else next.delete(part.id);
      group.partIds = [...next];
      renderLayerList();
      draw();
      commitHistory(`deformer group ${group.id} parts`);
    });
    const text = document.createElement("span");
    text.textContent = part.label || part.id;
    label.append(input, text);
    list.append(label);
  }
  return list;
}

function renderPaletteControls() {
  elements.paletteControls.innerHTML = "";
  for (const [key, labelText] of paletteDefs) {
    const field = document.createElement("label");
    field.className = "field";
    const label = document.createElement("span");
    label.textContent = ko(labelText);
    const input = document.createElement("input");
    input.type = "color";
    input.value = rig.palette[key] || "#ffffff";
    input.addEventListener("input", () => {
      rig.palette[key] = input.value;
      renderLayerControls();
      draw();
      commitHistory(`palette ${key}`);
    });
    field.append(label, input);
    elements.paletteControls.append(field);
  }
}

function addRangeControl(parent, labelText, value, min, max, step, onInput, historyLabel = "") {
  const wrapper = document.createElement("label");
  wrapper.className = "range-field";
  const label = document.createElement("span");
  label.textContent = ko(labelText);
  label.title = label.textContent;
  const input = document.createElement("input");
  input.type = "range";
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  const output = document.createElement("output");
  output.textContent = Number(value).toFixed(step < 1 ? 2 : 0);
  input.addEventListener("input", () => {
    const next = Number(input.value);
    output.textContent = next.toFixed(step < 1 ? 2 : 0);
    onInput(next);
    if (historyLabel) commitHistory(historyLabel);
  });
  wrapper.append(label, input, output);
  parent.append(wrapper);
}

function addTextControl(parent, labelText, value, onInput, historyLabel = "") {
  const wrapper = document.createElement("label");
  wrapper.className = "field";
  const label = document.createElement("span");
  label.textContent = ko(labelText);
  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.addEventListener("input", () => {
    onInput(input.value);
    if (historyLabel) commitHistory(historyLabel);
  });
  wrapper.append(label, input);
  parent.append(wrapper);
}

function addSelectControl(parent, labelText, value, options, onInput, historyLabel = "") {
  const wrapper = document.createElement("label");
  wrapper.className = "field";
  const label = document.createElement("span");
  label.textContent = ko(labelText);
  const select = document.createElement("select");
  select.value = value;
  for (const [optionValue, optionLabel] of options) {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = ko(optionLabel);
    select.append(option);
  }
  select.value = value;
  select.addEventListener("change", () => {
    onInput(select.value);
    if (historyLabel) commitHistory(historyLabel);
  });
  wrapper.append(label, select);
  parent.append(wrapper);
}

function addToggleControl(parent, labelText, value, onInput, historyLabel = "") {
  const wrapper = document.createElement("label");
  wrapper.className = "toggle-line";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = Boolean(value);
  input.addEventListener("change", () => {
    onInput(input.checked);
    if (historyLabel) commitHistory(historyLabel);
  });
  const label = document.createElement("span");
  label.textContent = ko(labelText);
  wrapper.append(input, label);
  parent.append(wrapper);
}

function bindingOptions() {
  return [["", "None"], ...allParameterDefs().map((param) => [param.key, ko(param.label)])];
}

function autoBindAllImageParts() {
  const parts = getImageParts();
  if (parts.length === 0) {
    showToast("No image parts to bind.");
    return;
  }
  const counts = new Map();
  for (const part of parts) {
    const profile = applyAutoImagePartBinding(part);
    counts.set(profile.label, (counts.get(profile.label) || 0) + 1);
  }
  normalizeImagePartOrders();
  renderLayerList();
  renderLayerControls();
  draw();
  commitHistory("auto bind image parts");
  const summary = [...counts.entries()].map(([label, count]) => `${label} ${count}`).join(", ");
  showToast(`Auto bound ${parts.length} image parts: ${summary}`);
}

function applyAutoImagePartBinding(part, { assignOrder = false } = {}) {
  const profile = imagePartAutoBindProfile(part);
  const previousSlot = part.slot === "back" ? "back" : "front";
  part.slot = profile.slot;
  if (assignOrder && previousSlot !== profile.slot) {
    part.order = nextImagePartOrder(profile.slot);
  }
  part.bindX = knownParameterKey(profile.bindX) || "";
  part.bindXStrength = profile.bindXStrength || 0;
  part.bindY = knownParameterKey(profile.bindY) || "";
  part.bindYStrength = profile.bindYStrength || 0;
  part.bindRotation = knownParameterKey(profile.bindRotation) || "";
  part.bindRotationStrength = profile.bindRotationStrength || 0;
  part.bindScaleX = knownParameterKey(profile.bindScaleX) || "";
  part.bindScaleXStrength = profile.bindScaleXStrength || 0;
  part.bindScaleY = knownParameterKey(profile.bindScaleY) || "";
  part.bindScaleYStrength = profile.bindScaleYStrength || 0;
  part.bindOpacity = knownParameterKey(profile.bindOpacity) || "";
  part.bindOpacityStrength = profile.bindOpacityStrength || 0;
  if (profile.opacity !== undefined) part.opacity = profile.opacity;
  if (profile.transformKeyParam) part.transformKeyParam = knownParameterKey(profile.transformKeyParam) || part.transformKeyParam || "angleX";
  if (profile.hitAreaKind) {
    part.hitArea = {
      ...normalizeImagePartHitArea(part),
      enabled: true,
      kind: normalizeHitAreaKind(profile.hitAreaKind),
      id: safeSegment(profile.hitAreaId || `${profile.hitAreaKind}_${part.id}`, "hit_area"),
      label: profile.hitAreaLabel || part.label || profile.label
    };
  }
  return profile;
}

function imagePartAutoBindProfile(part) {
  const text = imagePartSearchText(part);
  const has = (...patterns) => patterns.some((pattern) => pattern.test(text));
  const profile = {
    label: "generic",
    slot: "front",
    bindX: "angleX",
    bindXStrength: 12,
    bindY: "angleY",
    bindYStrength: 8,
    bindRotation: "angleZ",
    bindRotationStrength: 4,
    bindScaleX: "",
    bindScaleXStrength: 0,
    bindScaleY: "",
    bindScaleYStrength: 0,
    bindOpacity: "",
    bindOpacityStrength: 0,
    transformKeyParam: "angleX"
  };

  if (has(/\b(body|torso|outfit|cloth|clothes|dress|shirt|jacket|neck|arm|shoulder)\b/)) {
    Object.assign(profile, {
      label: "body",
      slot: "back",
      bindXStrength: 6,
      bindYStrength: 4,
      bindRotationStrength: 2,
      bindScaleY: "breath",
      bindScaleYStrength: 0.035,
      transformKeyParam: "breath",
      hitAreaKind: "body",
      hitAreaId: "body",
      hitAreaLabel: "Body"
    });
  }

  if (has(/\b(hair|bang|bangs|fringe|sideburn|ponytail|twin|braid|tail)\b/)) {
    Object.assign(profile, {
      label: "hair",
      slot: has(/\b(back|rear|behind|under|tail|ponytail)\b/) ? "back" : "front",
      bindXStrength: 18,
      bindYStrength: 10,
      bindRotation: "hairSway",
      bindRotationStrength: 12,
      transformKeyParam: "hairSway"
    });
  }

  if (has(/\b(head|face|skin|ear|nose|cheek)\b/)) {
    Object.assign(profile, {
      label: "head",
      slot: "front",
      bindXStrength: 18,
      bindYStrength: 12,
      bindRotation: "angleZ",
      bindRotationStrength: 6,
      transformKeyParam: "angleX",
      hitAreaKind: has(/\b(face|nose|cheek)\b/) ? "face" : "head",
      hitAreaId: has(/\b(face|nose|cheek)\b/) ? "face" : "head",
      hitAreaLabel: has(/\b(face|nose|cheek)\b/) ? "Face" : "Head"
    });
  }

  if (has(/\b(eye|iris|pupil|eyeball|highlight|catchlight)\b/)) {
    Object.assign(profile, {
      label: "eye",
      slot: "front",
      bindXStrength: 10,
      bindYStrength: 6,
      bindRotation: "angleZ",
      bindRotationStrength: 2,
      transformKeyParam: "angleX"
    });
  }

  if (has(/\b(eyelid|blink|closed eye|eye closed|close eye|closed)\b/)) {
    Object.assign(profile, {
      label: "closed eye",
      slot: "front",
      opacity: 1,
      bindXStrength: 10,
      bindYStrength: 6,
      bindOpacity: "eyeOpen",
      bindOpacityStrength: -1.2,
      transformKeyParam: "eyeOpen"
    });
  }

  if (has(/\b(brow|eyebrow|eyelash|lash)\b/)) {
    Object.assign(profile, {
      label: "brow",
      slot: "front",
      bindXStrength: 10,
      bindY: "brow",
      bindYStrength: -16,
      bindRotation: "brow",
      bindRotationStrength: 7,
      transformKeyParam: "brow"
    });
  }

  if (has(/\b(mouth|lip|lips|teeth|tongue)\b/)) {
    Object.assign(profile, {
      label: "mouth",
      slot: "front",
      bindXStrength: 7,
      bindY: "mouthOpen",
      bindYStrength: 7,
      bindRotation: "smile",
      bindRotationStrength: 2,
      bindScaleY: "mouthOpen",
      bindScaleYStrength: 0.22,
      transformKeyParam: "mouthOpen"
    });
    if (has(/\b(open|inside|teeth|tongue)\b/)) {
      profile.opacity = 0;
      profile.bindOpacity = "mouthOpen";
      profile.bindOpacityStrength = 1.2;
    } else if (has(/\b(close|closed|line)\b/)) {
      profile.opacity = 1;
      profile.bindOpacity = "mouthOpen";
      profile.bindOpacityStrength = -1.1;
    }
  }

  if (has(/\b(blush|cheek red|flush)\b/)) {
    Object.assign(profile, {
      label: "blush",
      slot: "front",
      bindXStrength: 8,
      bindYStrength: 5,
      bindRotationStrength: 0,
      bindOpacity: "smile",
      bindOpacityStrength: 0.22,
      transformKeyParam: "smile"
    });
  }

  if (has(/\b(shadow|shade|highlight|light|shine)\b/) && !has(/\b(eye|iris|pupil|catchlight)\b/)) {
    Object.assign(profile, {
      label: "lighting",
      bindXStrength: 6,
      bindYStrength: 4,
      bindRotationStrength: 1,
      transformKeyParam: "angleX"
    });
  }

  return profile;
}

function imagePartSearchText(part) {
  return `${part.label || ""} ${part.id || ""} ${part.path || ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function autoVisibilityGateAllImageParts({ confirmReplace = true } = {}) {
  const parts = getImageParts();
  if (parts.length === 0) {
    showToast("No image parts to gate.");
    return;
  }
  if (confirmReplace && parts.some((part) => normalizeImagePartVisibilityGate(part).enabled)) {
    if (!window.confirm("기존 이미지 파츠 표시 게이트를 이름 기반 게이트로 교체할까요?")) return;
  }
  const counts = new Map();
  let enabledCount = 0;
  for (const part of parts) {
    const profile = applyAutoImagePartVisibilityGate(part, { clearWhenMissing: confirmReplace });
    counts.set(profile.label, (counts.get(profile.label) || 0) + 1);
    if (profile.enabled) enabledCount += 1;
  }
  renderLayerList();
  renderLayerControls();
  renderParameterInfluenceInspector();
  draw();
  commitHistory("auto visibility gates");
  const summary = [...counts.entries()].map(([label, count]) => `${label} ${count}`).join(", ");
  showToast(`Auto gated ${enabledCount}/${parts.length} image parts: ${summary}`);
}

function applyAutoImagePartVisibilityGate(part, { clearWhenMissing = false } = {}) {
  const profile = imagePartVisibilityGateProfile(part);
  if (!profile.enabled) {
    if (clearWhenMissing) {
      part.visibilityGate = {
        ...normalizeImagePartVisibilityGate(part),
        enabled: false
      };
    }
    return profile;
  }
  part.visibilityGate = {
    enabled: true,
    parameter: knownParameterKey(profile.parameter) || "angleX",
    min: Number(profile.min),
    max: Number(profile.max),
    fade: Math.max(0, Number(profile.fade || 0))
  };
  return profile;
}

function imagePartVisibilityGateProfile(part) {
  const text = imagePartSearchText(part);
  const has = (...patterns) => patterns.some((pattern) => pattern.test(text));
  const profile = {
    label: "none",
    enabled: false,
    parameter: "angleX",
    min: -100,
    max: 100,
    fade: 0
  };

  if (has(/\b(eyelid|blink|closed eye|eye closed|close eye|closed)\b/)) {
    Object.assign(profile, {
      label: "closed eye",
      enabled: true,
      parameter: "eyeOpen",
      min: 0,
      max: 42,
      fade: 12
    });
  } else if (has(/\b(open eye|eye open|iris|pupil|eyeball|catchlight)\b/)) {
    Object.assign(profile, {
      label: "open eye",
      enabled: true,
      parameter: "eyeOpen",
      min: 18,
      max: 100,
      fade: 14
    });
  } else if (has(/\b(eye)\b/) && !has(/\b(brow|eyebrow|lash|shadow|highlight)\b/)) {
    Object.assign(profile, {
      label: "open eye",
      enabled: true,
      parameter: "eyeOpen",
      min: 12,
      max: 100,
      fade: 14
    });
  }

  if (has(/\b(mouth|lip|lips|teeth|tongue)\b/)) {
    if (has(/\b(open|inside|teeth|tongue|ah|aa|oh|o mouth|wide)\b/)) {
      Object.assign(profile, {
        label: "open mouth",
        enabled: true,
        parameter: "mouthOpen",
        min: 16,
        max: 100,
        fade: 12
      });
    } else if (has(/\b(close|closed|line|shut|neutral)\b/)) {
      Object.assign(profile, {
        label: "closed mouth",
        enabled: true,
        parameter: "mouthOpen",
        min: -100,
        max: 24,
        fade: 10
      });
    } else if (has(/\b(smile|grin|laugh|happy)\b/)) {
      Object.assign(profile, {
        label: "smile mouth",
        enabled: true,
        parameter: "smile",
        min: 24,
        max: 100,
        fade: 18
      });
    } else if (has(/\b(frown|sad|down)\b/)) {
      Object.assign(profile, {
        label: "sad mouth",
        enabled: true,
        parameter: "smile",
        min: -100,
        max: -18,
        fade: 18
      });
    }
  }

  if (has(/\b(blush|cheek red|flush)\b/)) {
    Object.assign(profile, {
      label: "blush",
      enabled: true,
      parameter: "smile",
      min: 18,
      max: 100,
      fade: 24
    });
  }

  if (has(/\b(tear|cry|crying)\b/)) {
    Object.assign(profile, {
      label: "tear",
      enabled: true,
      parameter: "smile",
      min: -100,
      max: -28,
      fade: 20
    });
  }

  if (has(/\b(sweat|shock|surprise|surprised)\b/)) {
    Object.assign(profile, {
      label: "surprise mark",
      enabled: true,
      parameter: "brow",
      min: 28,
      max: 100,
      fade: 18
    });
  }

  return profile;
}

function autoPlaceAllImageParts() {
  const parts = getImageParts();
  if (parts.length === 0) {
    showToast("No image parts to place.");
    return;
  }
  const counts = new Map();
  for (const part of parts) {
    const profile = applyAutoImagePartPlacement(part);
    counts.set(profile.label, (counts.get(profile.label) || 0) + 1);
  }
  normalizeImagePartOrders();
  renderLayerList();
  renderLayerControls();
  draw();
  commitHistory("auto place image parts");
  const summary = [...counts.entries()].map(([label, count]) => `${label} ${count}`).join(", ");
  showToast(`Auto placed ${parts.length} image parts: ${summary}`);
}

function applyAutoImagePartPlacement(part, { assignOrder = false } = {}) {
  const profile = imagePartPlacementProfile(part);
  const previousSlot = part.slot === "back" ? "back" : "front";
  if (profile.slot) part.slot = profile.slot;
  if (assignOrder && previousSlot !== part.slot) {
    part.order = nextImagePartOrder(part.slot);
  }
  part.x = Number(profile.x.toFixed(3));
  part.y = Number(profile.y.toFixed(3));
  part.anchorX = profile.anchorX;
  part.anchorY = profile.anchorY;
  const image = imageForPath(part.path);
  if (image && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
    if (imagePartLooksCanvasSized(image)) {
      part.x = rig.canvas.width * 0.5;
      part.y = rig.canvas.height * 0.5;
      part.anchorX = 0.5;
      part.anchorY = 0.5;
      part.scaleX = part.scaleX < 0 ? -1 : 1;
      part.scaleY = 1;
      profile.label = `${profile.label} canvas`;
    } else {
      const scale = clamp(profile.targetWidth / image.naturalWidth, 0.05, 4);
      part.scaleX = Number(((part.scaleX < 0 ? -1 : 1) * scale).toFixed(4));
      part.scaleY = Number(scale.toFixed(4));
    }
  }
  return profile;
}

function imagePartPlacementProfile(part) {
  const text = imagePartSearchText(part);
  const has = (...patterns) => patterns.some((pattern) => pattern.test(text));
  const side = imagePartSide(text);
  const width = Number(rig.canvas?.width || 900);
  const height = Number(rig.canvas?.height || 1400);
  const sideX = side === "left" ? 0.392 : side === "right" ? 0.608 : 0.5;
  const profile = {
    label: "generic",
    slot: "",
    x: width * 0.5,
    y: height * 0.48,
    targetWidth: width * 0.42,
    anchorX: 0.5,
    anchorY: 0.5
  };

  if (has(/\b(body|torso|outfit|cloth|clothes|dress|shirt|jacket|arm|shoulder)\b/)) {
    Object.assign(profile, {
      label: "body",
      slot: "back",
      x: width * 0.5,
      y: height * 0.76,
      targetWidth: width * 0.52
    });
  }
  if (has(/\b(neck)\b/)) {
    Object.assign(profile, {
      label: "neck",
      slot: "back",
      x: width * 0.5,
      y: height * 0.59,
      targetWidth: width * 0.18
    });
  }
  if (has(/\b(hair|bang|bangs|fringe|sideburn|ponytail|twin|braid|tail)\b/)) {
    Object.assign(profile, {
      label: "hair",
      slot: has(/\b(back|rear|behind|under|tail|ponytail)\b/) ? "back" : "front",
      x: side === "left" ? width * 0.38 : side === "right" ? width * 0.62 : width * 0.5,
      y: has(/\b(back|rear|behind|under|tail|ponytail)\b/) ? height * 0.42 : height * 0.27,
      targetWidth: side ? width * 0.24 : width * 0.48
    });
  }
  if (has(/\b(head|face|skin)\b/)) {
    Object.assign(profile, {
      label: "head",
      slot: "front",
      x: width * 0.5,
      y: height * 0.34,
      targetWidth: width * 0.4
    });
  }
  if (has(/\b(ear)\b/)) {
    Object.assign(profile, {
      label: "ear",
      slot: "front",
      x: side === "right" ? width * 0.695 : width * 0.305,
      y: height * 0.35,
      targetWidth: width * 0.08
    });
  }
  if (has(/\b(eye|iris|pupil|eyeball|catchlight)\b/)) {
    Object.assign(profile, {
      label: "eye",
      slot: "front",
      x: width * sideX,
      y: height * 0.335,
      targetWidth: width * 0.13
    });
  }
  if (has(/\b(eyelid|blink|closed eye|eye closed|close eye|closed)\b/)) {
    Object.assign(profile, {
      label: "closed eye",
      slot: "front",
      x: width * sideX,
      y: height * 0.335,
      targetWidth: width * 0.14
    });
  }
  if (has(/\b(brow|eyebrow|eyelash|lash)\b/)) {
    Object.assign(profile, {
      label: "brow",
      slot: "front",
      x: width * sideX,
      y: height * 0.29,
      targetWidth: width * 0.14
    });
  }
  if (has(/\b(mouth|lip|lips|teeth|tongue)\b/)) {
    Object.assign(profile, {
      label: "mouth",
      slot: "front",
      x: width * 0.5,
      y: height * 0.435,
      targetWidth: width * 0.15
    });
  }
  if (has(/\b(nose)\b/)) {
    Object.assign(profile, {
      label: "nose",
      slot: "front",
      x: width * 0.5,
      y: height * 0.385,
      targetWidth: width * 0.055
    });
  }
  if (has(/\b(blush|cheek red|flush)\b/)) {
    Object.assign(profile, {
      label: "blush",
      slot: "front",
      x: side === "right" ? width * 0.635 : width * 0.365,
      y: height * 0.392,
      targetWidth: width * 0.105
    });
  }
  if (has(/\b(shadow|shade|highlight|light|shine)\b/) && !has(/\b(eye|iris|pupil|catchlight)\b/)) {
    Object.assign(profile, {
      label: "lighting",
      slot: "front",
      x: width * 0.5,
      y: height * 0.315,
      targetWidth: width * 0.36
    });
  }

  return profile;
}

function imagePartSide(text) {
  if (/\b(left|l)\b/.test(text)) return "left";
  if (/\b(right|r)\b/.test(text)) return "right";
  return "";
}

function imagePartLooksCanvasSized(image) {
  const width = Number(rig.canvas?.width || 900);
  const height = Number(rig.canvas?.height || 1400);
  return image.naturalWidth >= width * 0.82 && image.naturalHeight >= height * 0.82;
}

function autoParentAllImageParts({ confirmReplace = true } = {}) {
  const parts = getImageParts();
  if (parts.length === 0) {
    showToast("No image parts to parent.");
    return;
  }
  if (confirmReplace && parts.some((part) => normalizeImagePartParentId(part.parentPartId, part.id))) {
    if (!window.confirm("기존 이미지 파츠 부모 설정을 이름 기반 자동 부모로 교체할까요?")) return;
  }
  const counts = new Map();
  for (const part of parts) {
    const profile = applyAutoImagePartParent(part, { parts });
    const key = profile.parentLabel || "none";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  renderLayerList();
  renderLayerControls();
  draw();
  commitHistory("auto parent image parts");
  const summary = [...counts.entries()].map(([label, count]) => `${label} ${count}`).join(", ");
  showToast(`Auto parented ${parts.length} image parts: ${summary}`);
}

function applyAutoImagePartParent(part, { parts = getImageParts(), clearWhenMissing = true } = {}) {
  const profile = imagePartParentTarget(part, parts);
  if (!profile.parentId && !clearWhenMissing) return profile;
  setImagePartParentKeepWorld(part, profile.parentId);
  return profile;
}

function imagePartParentTarget(part, parts = getImageParts()) {
  const label = imagePartSemanticLabel(part);
  let candidate = null;
  if (["hair", "eye", "closed eye", "brow", "mouth", "nose", "ear", "blush", "small", "lighting"].includes(label)) {
    candidate = findImagePartParentCandidate(part, parts, ["head"]);
  } else if (label === "neck") {
    candidate = findImagePartParentCandidate(part, parts, ["body"]);
  }
  return {
    label,
    parentId: candidate?.id || "",
    parentLabel: candidate ? (candidate.label || candidate.id) : ""
  };
}

function findImagePartParentCandidate(part, parts, targetLabels) {
  const candidates = parts.filter((candidate) => {
    if (!candidate || candidate.id === part.id) return false;
    if (imagePartHasAncestor(candidate, part.id)) return false;
    return targetLabels.includes(imagePartSemanticLabel(candidate));
  });
  return candidates.sort((a, b) => imagePartParentCandidateScore(b, targetLabels) - imagePartParentCandidateScore(a, targetLabels))[0] || null;
}

function imagePartParentCandidateScore(part, targetLabels) {
  const label = imagePartSemanticLabel(part);
  let score = targetLabels.includes(label) ? 100 : 0;
  const text = imagePartSearchText(part);
  if (/\b(face|head)\b/.test(text)) score += 20;
  if (/\b(skin)\b/.test(text)) score += 10;
  if (/\b(body|torso)\b/.test(text)) score += 20;
  if (/\b(outfit|cloth|clothes|dress|shirt|jacket)\b/.test(text)) score += 8;
  return score;
}

function imagePartSemanticLabel(part) {
  const placement = imagePartPlacementProfile(part).label;
  if (placement && placement !== "generic") return placement;
  const mesh = imagePartMeshProfile(part).label;
  if (mesh && mesh !== "generic") return mesh;
  return imagePartAutoBindProfile(part).label || "generic";
}

function autoGroupImageParts({ confirmReplace = true, silent = false } = {}) {
  const parts = getImageParts();
  if (parts.length === 0) {
    if (!silent) showToast("No image parts to group.");
    return { created: [], specs: [] };
  }
  const existingGroups = getDeformerGroups();
  const existingAutoGroups = existingGroups.filter((group) => isAutoDeformerGroup(group));
  if (confirmReplace && existingAutoGroups.length > 0) {
    if (!window.confirm("기존 자동 생성 디포머 그룹을 교체할까요? 수동 그룹은 유지됩니다.")) return { created: [], specs: [] };
  }

  const manualGroups = existingGroups.filter((group) => !isAutoDeformerGroup(group));
  rig.deformerGroups = manualGroups;
  const specs = autoDeformerGroupSpecs(parts);
  const created = specs.map((spec) => createAutoDeformerGroup(spec)).filter(Boolean);
  const byKind = new Map(created.map((group) => [group.autoGroupKind, group]));
  for (const group of created) {
    const spec = specs.find((entry) => entry.kind === group.autoGroupKind);
    const parent = spec?.parentKind ? byKind.get(spec.parentKind) : null;
    group.parentGroupId = parent ? parent.id : "";
  }

  rig.deformerGroups = normalizeDeformerGroups([...manualGroups, ...created], rig);
  if (silent) return { created, specs };
  if (created.length > 0) selectedLayerId = deformerGroupSelectionId(created[0].id);
  renderLayerList();
  renderLayerControls();
  renderParameterInfluenceInspector();
  draw();
  commitHistory("auto deformer groups");
  const summary = specs.map((spec) => `${spec.label} ${spec.partIds.length}`).join(", ");
  showToast(created.length > 0 ? `Auto grouped ${created.length} deformers: ${summary}` : "No image parts matched auto groups.");
  return { created, specs };
}

function isAutoDeformerGroup(group) {
  return group?.autoGenerated === true || String(group?.id || "").startsWith("auto_");
}

function autoDeformerGroupSpecs(parts) {
  const entries = parts.map((part) => ({
    part,
    label: imagePartSemanticLabel(part),
    side: imagePartSide(imagePartSearchText(part)),
    slot: part.slot === "back" ? "back" : "front",
    text: imagePartSearchText(part)
  }));
  const hasKind = (kind) => entries.some((entry) => entry.label === kind);
  const hasHead = hasKind("head") || hasKind("ear") || hasKind("nose");
  const specs = [];
  const addSpec = (kind, label, labels, options = {}) => {
    const matched = entries.filter((entry) => (
      labels.includes(entry.label)
      && (!options.side || entry.side === options.side)
      && (!options.noSide || !entry.side)
      && (!options.slot || entry.slot === options.slot)
      && (!options.excludeText || !options.excludeText.test(entry.text))
      && (!options.includeText || options.includeText.test(entry.text))
    ));
    if (matched.length === 0) return;
    specs.push({
      kind,
      label,
      parameter: options.parameter || "angleX",
      parentKind: options.parentKind || "",
      warp: options.warp === true,
      columns: options.columns || 3,
      rows: options.rows || 3,
      strength: options.strength || 8,
      partIds: matched.map((entry) => entry.part.id),
      parts: matched.map((entry) => entry.part),
      motionLabel: options.motionLabel || labels[0] || "generic"
    });
  };

  addSpec("body", "Auto Body Deformer", ["body", "neck"], { parameter: "breath", motionLabel: "body", strength: 8 });
  addSpec("head", "Auto Head Deformer", ["head", "ear", "nose"], { parameter: "angleX", motionLabel: "head", strength: 8 });
  addSpec("back_hair", "Auto Back Hair Deformer", ["hair"], { parameter: "hairSway", slot: "back", warp: true, columns: 4, rows: 4, motionLabel: "hair", strength: 18, parentKind: hasHead ? "head" : "" });
  addSpec("front_hair", "Auto Front Hair Deformer", ["hair"], { parameter: "hairSway", slot: "front", warp: true, columns: 4, rows: 4, motionLabel: "hair", strength: 18, parentKind: hasHead ? "head" : "" });

  const leftEyeParts = entries.filter((entry) => ["eye", "closed eye"].includes(entry.label) && entry.side === "left");
  const rightEyeParts = entries.filter((entry) => ["eye", "closed eye"].includes(entry.label) && entry.side === "right");
  const centerEyeParts = entries.filter((entry) => ["eye", "closed eye"].includes(entry.label) && !entry.side);
  if (leftEyeParts.length > 0 || rightEyeParts.length > 0) {
    addSpec("left_eye", "Auto Left Eye Deformer", ["eye", "closed eye"], { parameter: "angleX", side: "left", warp: true, columns: 3, rows: 2, motionLabel: "eye", strength: 7, parentKind: hasHead ? "head" : "" });
    addSpec("right_eye", "Auto Right Eye Deformer", ["eye", "closed eye"], { parameter: "angleX", side: "right", warp: true, columns: 3, rows: 2, motionLabel: "eye", strength: 7, parentKind: hasHead ? "head" : "" });
    if (centerEyeParts.length > 0) addSpec("eyes", "Auto Eye Deformer", ["eye", "closed eye"], { parameter: "angleX", noSide: true, warp: true, columns: 3, rows: 2, motionLabel: "eye", strength: 7, parentKind: hasHead ? "head" : "" });
  } else {
    addSpec("eyes", "Auto Eye Deformer", ["eye", "closed eye"], { parameter: "angleX", warp: true, columns: 3, rows: 2, motionLabel: "eye", strength: 7, parentKind: hasHead ? "head" : "" });
  }

  addSpec("left_brow", "Auto Left Brow Deformer", ["brow"], { parameter: "brow", side: "left", motionLabel: "brow", strength: 7, parentKind: hasHead ? "head" : "" });
  addSpec("right_brow", "Auto Right Brow Deformer", ["brow"], { parameter: "brow", side: "right", motionLabel: "brow", strength: 7, parentKind: hasHead ? "head" : "" });
  const centerBrowParts = entries.filter((entry) => entry.label === "brow" && !entry.side);
  if (centerBrowParts.length > 0 && specs.some((spec) => spec.kind === "left_brow" || spec.kind === "right_brow")) {
    addSpec("brows", "Auto Brow Deformer", ["brow"], { parameter: "brow", noSide: true, motionLabel: "brow", strength: 7, parentKind: hasHead ? "head" : "" });
  }
  if (!specs.some((spec) => spec.kind === "left_brow" || spec.kind === "right_brow")) {
    addSpec("brows", "Auto Brow Deformer", ["brow"], { parameter: "brow", motionLabel: "brow", strength: 7, parentKind: hasHead ? "head" : "" });
  }
  addSpec("mouth", "Auto Mouth Deformer", ["mouth"], { parameter: "mouthOpen", warp: true, columns: 4, rows: 3, motionLabel: "mouth", strength: 14, parentKind: hasHead ? "head" : "" });
  addSpec("blush", "Auto Blush Deformer", ["blush"], { parameter: "smile", motionLabel: "blush", strength: 6, parentKind: hasHead ? "head" : "" });
  return specs.filter((spec) => spec.partIds.length > 0);
}

function createAutoDeformerGroup(spec) {
  const bounds = autoDeformerGroupBounds(spec.parts);
  const id = uniqueDeformerGroupId(safeSegment(`auto_${spec.kind}_group`, "auto_group"));
  const warpWidth = Math.max(48, Number((bounds.width * 1.14).toFixed(3)));
  const warpHeight = Math.max(48, Number((bounds.height * 1.18).toFixed(3)));
  const group = createDeformerGroup({
    id,
    label: spec.label,
    parameter: spec.parameter,
    partIds: spec.partIds,
    x: bounds.x + bounds.width * 0.5,
    y: bounds.y + bounds.height * 0.5,
    autoGenerated: true,
    autoGroupKind: spec.kind,
    warp: {
      enabled: spec.warp,
      editing: false,
      columns: spec.columns,
      rows: spec.rows,
      width: warpWidth,
      height: warpHeight
    }
  });
  group.autoGenerated = true;
  group.autoGroupKind = spec.kind;
  group.keyframes = autoDeformerGroupTransformKeyframes(group, spec);
  if (spec.warp) {
    group.warp = normalizeDeformerGroupWarp(group.warp || {}, group, rig);
    group.warp.enabled = true;
    group.warp.editing = false;
    group.warp.keyframes = autoDeformerGroupWarpKeyframes(group, spec);
  }
  return group;
}

function autoDeformerGroupBounds(parts) {
  const points = parts.flatMap((part) => imagePartTransformGeometry(part)?.corners || []);
  const bounds = pointBounds(points);
  if (bounds && bounds.width > 0 && bounds.height > 0) return bounds;
  const width = Number(rig.canvas?.width || 900);
  const height = Number(rig.canvas?.height || 1400);
  if (parts.length === 0) {
    return { x: width * 0.3, y: height * 0.3, width: width * 0.4, height: height * 0.25 };
  }
  const xs = parts.map((part) => Number(part.x)).filter(Number.isFinite);
  const ys = parts.map((part) => Number(part.y)).filter(Number.isFinite);
  const centerX = xs.length > 0 ? xs.reduce((sum, value) => sum + value, 0) / xs.length : width * 0.5;
  const centerY = ys.length > 0 ? ys.reduce((sum, value) => sum + value, 0) / ys.length : height * 0.45;
  return { x: centerX - width * 0.12, y: centerY - height * 0.055, width: width * 0.24, height: height * 0.11 };
}

function autoDeformerGroupTransformKeyframes(group, spec) {
  return normalizePartTransformKeyframes(autoDeformParameterValues(spec.parameter).map(({ value, amount }) => ({
    value,
    transform: autoDeformerGroupTransformSnapshot(group, spec, amount)
  })));
}

function autoDeformerGroupTransformSnapshot(group, spec, amount) {
  const base = snapshotDeformerGroupTransform(group, rig);
  const positive = Math.max(0, amount);
  const magnitude = Math.abs(amount);
  const transform = { ...base };
  switch (spec.motionLabel) {
    case "body":
      transform.y = base.y - positive * 8;
      transform.scaleY = base.scaleY + positive * 0.035;
      break;
    case "head":
      transform.x = base.x + amount * 10;
      transform.y = base.y - magnitude * 3;
      transform.rotation = base.rotation + amount * 2.4;
      break;
    case "hair":
      transform.x = base.x + amount * 12;
      transform.y = base.y + magnitude * 3;
      transform.rotation = base.rotation + amount * 5.5;
      break;
    case "eye":
      transform.x = base.x + amount * 7;
      transform.y = base.y + amount * 1.5;
      transform.scaleY = base.scaleY - magnitude * 0.035;
      break;
    case "brow":
      transform.y = base.y - amount * 11;
      transform.rotation = base.rotation - amount * 4.5;
      break;
    case "mouth":
      transform.y = base.y + positive * 5;
      transform.scaleX = base.scaleX + positive * 0.035;
      transform.scaleY = base.scaleY + positive * 0.18;
      break;
    case "blush":
      transform.scaleX = base.scaleX + positive * 0.045;
      transform.scaleY = base.scaleY + positive * 0.045;
      transform.opacity = clamp(base.opacity + amount * 0.18, 0.18, 1);
      break;
    default:
      transform.x = base.x + amount * 5;
      transform.rotation = base.rotation + amount * 1.5;
      break;
  }
  return normalizePartTransformSnapshot(transform);
}

function autoDeformerGroupWarpKeyframes(group, spec) {
  const warp = normalizeDeformerGroupWarp(group.warp || {}, group, rig);
  const profile = {
    label: spec.motionLabel || "generic",
    strength: spec.strength || autoDeformStrengthForLabel(spec.motionLabel || "generic")
  };
  return normalizeWarpKeyframes(autoDeformParameterValues(spec.parameter).map(({ value, amount }) => ({
    value,
    vertices: warp.vertices.map((vertex) => autoDeformVertex(vertex, profile, amount))
  })), warp.vertices);
}

function autoMeshAllImageParts({ confirmReplace = true } = {}) {
  const parts = getImageParts();
  if (parts.length === 0) {
    showToast("No image parts to mesh.");
    return;
  }
  if (confirmReplace && parts.some((part) => part.mesh?.enabled)) {
    if (!window.confirm("기존 이미지 파츠 메시를 이름 기반 자동 메시로 교체할까요?")) return;
  }
  const counts = new Map();
  for (const part of parts) {
    const profile = applyAutoImagePartMesh(part);
    const key = `${profile.columns}x${profile.rows}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  renderLayerControls();
  draw();
  commitHistory("auto mesh image parts");
  const summary = [...counts.entries()].map(([label, count]) => `${label} ${count}`).join(", ");
  showToast(`Auto meshed ${parts.length} image parts: ${summary}`);
}

function applyAutoImagePartMesh(part) {
  const profile = imagePartMeshProfile(part);
  part.mesh = createPartMesh(part, profile.columns, profile.rows);
  part.mesh.editing = false;
  part.mesh.deformerParam = knownParameterKey(profile.deformerParam) || "angleX";
  normalizePartMesh(part);
  return profile;
}

function autoDeformAllImageParts({ confirmReplace = true } = {}) {
  const parts = getImageParts();
  if (parts.length === 0) {
    showToast("No image parts to deform.");
    return;
  }
  if (confirmReplace && parts.some((part) => Array.isArray(part.mesh?.deformers) && part.mesh.deformers.length > 0)) {
    if (!window.confirm("기존 이미지 파츠 메시 디포머를 이름 기반 자동 디포머로 교체할까요?")) return;
  }
  const counts = new Map();
  for (const part of parts) {
    const profile = applyAutoImagePartDeform(part);
    counts.set(profile.parameter, (counts.get(profile.parameter) || 0) + 1);
  }
  renderLayerControls();
  draw();
  commitHistory("auto deform image parts");
  const summary = [...counts.entries()].map(([label, count]) => `${label} ${count}`).join(", ");
  showToast(`Auto deformed ${parts.length} image parts: ${summary}`);
}

function applyAutoImagePartDeform(part) {
  if (!part.mesh?.enabled) applyAutoImagePartMesh(part);
  const mesh = normalizePartMesh(part);
  const profile = imagePartDeformProfile(part, mesh);
  mesh.deformerParam = profile.parameter;
  mesh.deformers = mesh.deformers.filter((entry) => entry.parameter !== profile.parameter);
  mesh.deformers.push({
    parameter: profile.parameter,
    keyframes: autoMeshDeformerKeyframes(mesh, profile)
  });
  normalizePartMesh(part);
  return profile;
}

function imagePartDeformProfile(part, mesh) {
  const meshProfile = imagePartMeshProfile(part);
  const parameter = knownParameterKey(meshProfile.deformerParam || mesh.deformerParam) || "angleX";
  return {
    label: meshProfile.label || imagePartAutoBindProfile(part).label || "generic",
    parameter,
    strength: autoDeformStrengthForLabel(meshProfile.label || "generic")
  };
}

function autoDeformStrengthForLabel(label) {
  switch (label) {
    case "hair": return 18;
    case "body": return 10;
    case "head": return 8;
    case "mouth": return 14;
    case "eye":
    case "closed eye":
    case "brow": return 7;
    default: return 5;
  }
}

function autoMeshDeformerKeyframes(mesh, profile) {
  return autoDeformParameterValues(profile.parameter).map(({ value, amount }) => ({
    value,
    vertices: mesh.vertices.map((vertex) => autoDeformVertex(vertex, profile, amount))
  }));
}

function autoDeformParameterValues(parameter) {
  const def = allParameterDefs().find((entry) => entry.key === parameter) || { min: -100, max: 100 };
  const defaults = defaultParams();
  const center = clamp(defaults[parameter] ?? 0, def.min, def.max);
  const rawValues = [def.min, center, def.max]
    .map((value) => Number(Number(value).toFixed(3)))
    .filter((value, index, values) => values.indexOf(value) === index);
  return rawValues.map((value) => {
    const denominator = value >= center
      ? Math.max(0.001, def.max - center)
      : Math.max(0.001, center - def.min);
    return {
      value,
      amount: clamp((value - center) / denominator, -1, 1)
    };
  });
}

function autoDeformVertex(vertex, profile, amount) {
  const u = Number(vertex.u || 0);
  const v = Number(vertex.v || 0);
  const centeredX = u - 0.5;
  const centeredY = v - 0.5;
  const strength = Number(profile.strength || 5);
  let dx = 0;
  let dy = 0;

  switch (profile.label) {
    case "hair":
      dx = amount * strength * Math.pow(v, 1.35);
      dy = Math.abs(amount) * strength * 0.18 * v;
      break;
    case "body":
      dx = centeredX * amount * strength * 0.8 * (0.4 + v);
      dy = -amount * strength * 0.65 * (1 - v);
      break;
    case "head":
      dx = amount * strength * (0.35 + v * 0.65);
      dy = centeredY * Math.abs(amount) * strength * 0.25;
      break;
    case "mouth":
      dx = centeredX * amount * strength * 0.25;
      dy = amount * strength * (v - 0.28);
      break;
    case "eye":
    case "closed eye":
      dy = amount * strength * centeredY;
      dx = centeredX * amount * strength * 0.15;
      break;
    case "brow":
      dy = -amount * strength * 0.85;
      dx = centeredX * amount * strength * 0.35;
      break;
    default:
      dx = amount * strength * 0.45 * (0.2 + v);
      dy = centeredY * Math.abs(amount) * strength * 0.2;
      break;
  }

  return {
    dx: Number(dx.toFixed(3)),
    dy: Number(dy.toFixed(3))
  };
}

function imagePartMeshProfile(part) {
  const text = imagePartSearchText(part);
  const has = (...patterns) => patterns.some((pattern) => pattern.test(text));
  const profile = { label: "generic", columns: 3, rows: 3, deformerParam: "angleX" };
  if (has(/\b(body|torso|outfit|cloth|clothes|dress|shirt|jacket|arm|shoulder)\b/)) {
    Object.assign(profile, { label: "body", columns: 4, rows: 4, deformerParam: "breath" });
  }
  if (has(/\b(hair|bang|bangs|fringe|sideburn|ponytail|twin|braid|tail)\b/)) {
    Object.assign(profile, { label: "hair", columns: 5, rows: 6, deformerParam: "hairSway" });
  }
  if (has(/\b(head|face|skin)\b/)) {
    Object.assign(profile, { label: "head", columns: 4, rows: 5, deformerParam: "angleX" });
  }
  if (has(/\b(eye|iris|pupil|eyeball|catchlight|brow|eyebrow|eyelash|lash)\b/)) {
    Object.assign(profile, { label: has(/\b(brow|eyebrow)\b/) ? "brow" : "eye", columns: 3, rows: 2, deformerParam: has(/\b(brow|eyebrow)\b/) ? "brow" : "angleX" });
  }
  if (has(/\b(eyelid|blink|closed eye|eye closed|close eye|closed)\b/)) {
    Object.assign(profile, { label: "closed eye", columns: 3, rows: 2, deformerParam: "eyeOpen" });
  }
  if (has(/\b(mouth|lip|lips|teeth|tongue)\b/)) {
    Object.assign(profile, { label: "mouth", columns: 4, rows: 3, deformerParam: "mouthOpen" });
  }
  if (has(/\b(blush|cheek red|flush|nose|ear)\b/)) {
    Object.assign(profile, { label: "small", columns: 2, rows: 2, deformerParam: "angleX" });
  }
  if (has(/\b(shadow|shade|highlight|light|shine)\b/) && !has(/\b(eye|iris|pupil|catchlight)\b/)) {
    Object.assign(profile, { label: "lighting", columns: 3, rows: 3, deformerParam: "angleX" });
  }
  return profile;
}

function getLayer(id) {
  if (!rig.layers[id]) {
    rig.layers[id] = { visible: true, opacity: 1, offsetX: 0, offsetY: 0, scale: 1, rotation: 0 };
  }
  return rig.layers[id];
}

function getImageParts() {
  if (!Array.isArray(rig.imageParts)) rig.imageParts = [];
  return rig.imageParts;
}

function sortedImagePartsForList() {
  return getImageParts()
    .slice()
    .sort((a, b) => {
      const slotA = a.slot === "back" ? 0 : 1;
      const slotB = b.slot === "back" ? 0 : 1;
      if (slotA !== slotB) return slotA - slotB;
      const orderA = Number.isFinite(Number(a.order)) ? Number(a.order) : 0;
      const orderB = Number.isFinite(Number(b.order)) ? Number(b.order) : 0;
      if (orderA !== orderB) return orderA - orderB;
      return String(a.label || a.id).localeCompare(String(b.label || b.id));
    });
}

function sortedImagePartsInSlot(slot) {
  const cleanSlot = slot === "back" ? "back" : "front";
  return getImageParts()
    .filter((part) => (part.slot || "front") === cleanSlot)
    .slice()
    .sort((a, b) => {
      const orderA = Number.isFinite(Number(a.order)) ? Number(a.order) : 0;
      const orderB = Number.isFinite(Number(b.order)) ? Number(b.order) : 0;
      if (orderA !== orderB) return orderA - orderB;
      return String(a.label || a.id).localeCompare(String(b.label || b.id));
    });
}

function effectiveImagePartOrder(sourceRig, part) {
  const baseOrder = Number.isFinite(Number(part.order)) ? Number(part.order) : 0;
  let order = baseOrder;
  for (const deformer of normalizeDrawOrderDeformers(part)) {
    const keyed = interpolateDrawOrderKeyframes(deformer, sourceRig);
    if (!keyed) continue;
    order += Number(keyed.order) - baseOrder;
  }
  return Number.isFinite(order) ? order : baseOrder;
}

function normalizeImagePartOrders(slot = "") {
  const slots = slot ? [slot === "back" ? "back" : "front"] : ["back", "front"];
  for (const targetSlot of slots) {
    sortedImagePartsInSlot(targetSlot).forEach((part, index) => {
      part.order = index;
    });
  }
}

function createImagePartOrderControls(part) {
  const row = document.createElement("div");
  row.className = "part-order-buttons";
  for (const [action, label] of [
    ["back", "To Back"],
    ["down", "Down"],
    ["up", "Up"],
    ["front", "To Front"]
  ]) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => moveImagePartOrder(part, action));
    row.append(button);
  }
  return row;
}

function moveImagePartOrder(part, action) {
  const slot = part.slot === "back" ? "back" : "front";
  const parts = sortedImagePartsInSlot(slot);
  const currentIndex = parts.findIndex((entry) => entry.id === part.id);
  if (currentIndex < 0) return;
  let nextIndex = currentIndex;
  if (action === "back") nextIndex = 0;
  else if (action === "front") nextIndex = parts.length - 1;
  else if (action === "down") nextIndex = Math.max(0, currentIndex - 1);
  else if (action === "up") nextIndex = Math.min(parts.length - 1, currentIndex + 1);
  if (nextIndex === currentIndex) return;
  const [moved] = parts.splice(currentIndex, 1);
  parts.splice(nextIndex, 0, moved);
  parts.forEach((entry, index) => {
    entry.order = index;
  });
  renderLayerList();
  renderLayerControls();
  draw();
  commitHistory(`image part ${part.id} order ${action}`);
}

function exportImagePartRigTemplate(part) {
  if (!part) return;
  downloadJson(
    `${safeSegment(part.label || part.id || "image_part", "image_part")}.image-part-rig-template.json`,
    {
      app: "tools/portrait-rig-editor",
      kind: "image_part_rig_template",
      version: 1,
      exportedAt: new Date().toISOString(),
      source: {
        partId: part.id || "",
        label: part.label || part.id || "Image Part"
      },
      template: imagePartRigTemplateFromPart(part)
    }
  );
  showToast(`Exported rig template: ${part.label || part.id}`);
}

function requestImagePartRigTemplateImport(part) {
  if (!part) return;
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.addEventListener("change", () => {
    importImagePartRigTemplate(part, input.files?.[0]).catch((error) => showToast(error.message));
  }, { once: true });
  input.click();
}

async function importImagePartRigTemplate(part, file) {
  if (!part || !file) return;
  const payload = JSON.parse(await file.text());
  const templates = imagePartRigTemplatesFromImportedJson(payload);
  if (templates.length === 0) {
    showToast("No image-part rig template found.");
    return;
  }
  applyImagePartRigTemplate(part, templates[0]);
  renderLayerList();
  renderLayerControls();
  renderParameterInfluenceInspector();
  draw();
  commitHistory(`import image part rig template ${part.id}`);
  showToast(`Imported rig template to ${part.label || part.id}.`);
}

function imagePartRigTemplatesFromImportedJson(data) {
  if (Array.isArray(data)) return data.flatMap(imagePartRigTemplatesFromImportedJson);
  if (!data || typeof data !== "object") return [];
  if (data.kind === "image_part_rig_template" && data.template) return [data.template];
  if (data.template && typeof data.template === "object" && !Array.isArray(data.template)) return [data.template];
  if (data.part && typeof data.part === "object" && !Array.isArray(data.part)) return [imagePartRigTemplateFromPart(data.part)];
  if (data.imagePart && typeof data.imagePart === "object" && !Array.isArray(data.imagePart)) return [imagePartRigTemplateFromPart(data.imagePart)];
  if (Array.isArray(data.imageParts)) return data.imageParts.map(imagePartRigTemplateFromPart);
  if (Array.isArray(data.parts)) return data.parts.map(imagePartRigTemplateFromPart);
  if (data.bindX || data.bindY || data.visibilityGate || data.mesh || data.transformDeformers || data.drawOrderDeformers) {
    return [data];
  }
  return [];
}

function imagePartRigTemplateFromPart(part) {
  const source = normalizedImagePartTemplateSource(part);
  return {
    opacity: clamp(Number(source.opacity ?? 1), 0, 1),
    blendMode: normalizeImagePartBlendMode(source.blendMode),
    clipShape: normalizeImagePartClipShape(source.clipShape),
    clipInset: clamp(Number(source.clipInset ?? 0), 0, 0.45),
    clipRadius: clamp(Number(source.clipRadius ?? 0.12), 0, 0.5),
    bindX: source.bindX || "",
    bindXStrength: Number(source.bindXStrength || 0),
    bindY: source.bindY || "",
    bindYStrength: Number(source.bindYStrength || 0),
    bindRotation: source.bindRotation || "",
    bindRotationStrength: Number(source.bindRotationStrength || 0),
    bindScaleX: source.bindScaleX || "",
    bindScaleXStrength: Number(source.bindScaleXStrength || 0),
    bindScaleY: source.bindScaleY || "",
    bindScaleYStrength: Number(source.bindScaleYStrength || 0),
    bindOpacity: source.bindOpacity || "",
    bindOpacityStrength: Number(source.bindOpacityStrength || 0),
    visibilityGate: source.visibilityGate,
    hitArea: source.hitArea,
    transformKeyParam: source.transformKeyParam || "angleX",
    transformDeformers: JSON.parse(JSON.stringify(source.transformDeformers || [])),
    drawOrderKeyParam: source.drawOrderKeyParam || "angleX",
    drawOrderDeformers: JSON.parse(JSON.stringify(source.drawOrderDeformers || [])),
    mesh: source.mesh?.enabled ? JSON.parse(JSON.stringify(source.mesh)) : null
  };
}

function normalizedImagePartTemplateSource(part) {
  const source = JSON.parse(JSON.stringify(part || {}));
  const bindings = source.bindings && typeof source.bindings === "object" && !Array.isArray(source.bindings)
    ? source.bindings
    : {};
  for (const [field, strengthField] of imagePartBindingFields) {
    if (source[field] === undefined && bindings[field] !== undefined) source[field] = bindings[field];
    if (source[strengthField] === undefined && bindings[strengthField] !== undefined) source[strengthField] = bindings[strengthField];
  }
  const normalized = normalizeImageParts([{
    id: "template_part",
    label: "Template Part",
    path: "res://assets/template.png",
    ...source
  }])[0];
  normalized.visibilityGate = normalizeImagePartVisibilityGate(normalized);
  normalized.hitArea = normalizeImagePartHitArea(normalized);
  normalizePartTransformDeformers(normalized);
  normalizeDrawOrderDeformers(normalized);
  if (normalized.mesh?.enabled) normalizePartMesh(normalized);
  return normalized;
}

function applyImagePartRigTemplate(part, rawTemplate) {
  const template = imagePartRigTemplateFromPart(rawTemplate || {});
  part.opacity = template.opacity;
  part.blendMode = template.blendMode;
  part.clipShape = template.clipShape;
  part.clipInset = template.clipInset;
  part.clipRadius = template.clipRadius;
  part.bindX = template.bindX;
  part.bindXStrength = template.bindXStrength;
  part.bindY = template.bindY;
  part.bindYStrength = template.bindYStrength;
  part.bindRotation = template.bindRotation;
  part.bindRotationStrength = template.bindRotationStrength;
  part.bindScaleX = template.bindScaleX;
  part.bindScaleXStrength = template.bindScaleXStrength;
  part.bindScaleY = template.bindScaleY;
  part.bindScaleYStrength = template.bindScaleYStrength;
  part.bindOpacity = template.bindOpacity;
  part.bindOpacityStrength = template.bindOpacityStrength;
  part.visibilityGate = JSON.parse(JSON.stringify(template.visibilityGate));
  part.hitArea = JSON.parse(JSON.stringify(template.hitArea));
  part.transformKeyParam = template.transformKeyParam;
  part.transformDeformers = JSON.parse(JSON.stringify(template.transformDeformers || []));
  part.drawOrderKeyParam = template.drawOrderKeyParam;
  part.drawOrderDeformers = JSON.parse(JSON.stringify(template.drawOrderDeformers || []));
  if (template.mesh) {
    part.mesh = JSON.parse(JSON.stringify(template.mesh));
    normalizePartMesh(part);
  } else {
    delete part.mesh;
  }
}

function duplicateImagePart(part, mirrored = false) {
  const clone = JSON.parse(JSON.stringify(part));
  const baseId = safeSegment(`${part.id || "image_part"}_${mirrored ? "mirror" : "copy"}`, "image_part_copy");
  clone.id = uniqueImagePartId(baseId);
  clone.label = uniqueImagePartLabel(`${part.label || part.id || "Image Part"} ${mirrored ? "Mirror" : "Copy"}`);
  clone.parentPartId = normalizeImagePartParentId(clone.parentPartId, clone.id);
  clone.clipPartId = normalizeImagePartClipPartId(clone.clipPartId, clone.id);
  clone.order = nextImagePartOrder(clone.slot || "front");
  if (mirrored) mirrorImagePartClone(clone);
  getImageParts().push(clone);
  selectedLayerId = partSelectionId(clone.id);
  renderLayerList();
  renderLayerControls();
  draw();
  commitHistory(`${mirrored ? "mirror duplicate" : "duplicate"} image part ${part.id}`);
}

function mirrorImagePartClone(part) {
  const hasParent = Boolean(part.parentPartId);
  part.id = uniqueImagePartId(safeSegment(mirrorSideText(part.id || ""), part.id || "image_part"));
  part.label = uniqueImagePartLabel(mirrorSideText(part.label || part.id || "Image Part"));
  part.x = Number((hasParent ? -Number(part.x || 0) : Number(rig.canvas.width || 900) - Number(part.x || 0)).toFixed(3));
  part.scaleX = Number((-Number(part.scaleX ?? 1)).toFixed(4));
  part.rotation = Number((-Number(part.rotation || 0)).toFixed(3));
  part.bindXStrength = -Number(part.bindXStrength || 0);
  part.bindRotationStrength = -Number(part.bindRotationStrength || 0);
  if (Array.isArray(part.transformDeformers)) {
    for (const deformer of part.transformDeformers) {
      for (const keyframe of deformer.keyframes || []) {
        if (keyframe.transform && typeof keyframe.transform === "object") {
          mirrorTransformSnapshot(keyframe.transform, hasParent);
        }
        keyframe.value = mirrorParameterKeyValue(deformer.parameter, keyframe.value);
      }
      deformer.keyframes = normalizeMirroredKeyframes(deformer.keyframes);
    }
  }
  if (Array.isArray(part.drawOrderDeformers)) {
    for (const deformer of part.drawOrderDeformers) {
      for (const keyframe of deformer.keyframes || []) {
        keyframe.value = mirrorParameterKeyValue(deformer.parameter, keyframe.value);
      }
      deformer.keyframes = normalizeMirroredKeyframes(deformer.keyframes);
    }
  }
  if (part.mesh?.enabled && Array.isArray(part.mesh.deformers)) {
    for (const deformer of part.mesh.deformers) {
      for (const keyframe of deformer.keyframes || []) {
        keyframe.value = mirrorParameterKeyValue(deformer.parameter, keyframe.value);
      }
      deformer.keyframes = normalizeMirroredKeyframes(deformer.keyframes);
    }
  }
  part.visibilityGate = mirrorVisibilityGate(part.visibilityGate);
}

function duplicateDeformerGroup(group, mirrored = false) {
  const source = JSON.parse(JSON.stringify(group));
  const clone = createDeformerGroup(source);
  const baseId = safeSegment(`${group.id || "deformer_group"}_${mirrored ? "mirror" : "copy"}`, "deformer_group_copy");
  clone.id = uniqueDeformerGroupId(baseId);
  clone.label = uniqueDeformerGroupLabel(`${group.label || group.id || "Deformer Group"} ${mirrored ? "Mirror" : "Copy"}`);
  clone.parentGroupId = normalizeDeformerGroupParentId(clone.parentGroupId, clone.id);
  if (mirrored) mirrorDeformerGroupClone(clone);
  getDeformerGroups().push(clone);
  selectedLayerId = deformerGroupSelectionId(clone.id);
  renderLayerList();
  renderLayerControls();
  draw();
  commitHistory(`${mirrored ? "mirror duplicate" : "duplicate"} deformer group ${group.id}`);
}

function mirrorDeformerGroupClone(group) {
  const hasParent = Boolean(normalizeDeformerGroupParentId(group.parentGroupId, group.id));
  group.id = uniqueDeformerGroupId(safeSegment(mirrorSideText(group.id || ""), group.id || "deformer_group"));
  group.label = uniqueDeformerGroupLabel(mirrorSideText(group.label || group.id || "Deformer Group"));
  group.parentGroupId = normalizeDeformerGroupParentId(mirroredDeformerGroupId(group.parentGroupId), group.id);
  group.partIds = normalizeMirroredDeformerGroupPartIds(group.partIds);
  group.x = Number((hasParent ? -Number(group.x || 0) : Number(rig.canvas.width || 900) - Number(group.x || 0)).toFixed(3));
  group.scaleX = Number((-Number(group.scaleX ?? 1)).toFixed(4));
  group.rotation = Number((-Number(group.rotation || 0)).toFixed(3));
  for (const keyframe of group.keyframes || []) {
    if (keyframe.transform && typeof keyframe.transform === "object") {
      mirrorTransformSnapshot(keyframe.transform, hasParent);
    }
    keyframe.value = mirrorParameterKeyValue(group.parameter, keyframe.value);
  }
  group.keyframes = normalizePartTransformKeyframes(group.keyframes);
  if (group.warp && Array.isArray(group.warp.keyframes)) {
    for (const keyframe of group.warp.keyframes) {
      keyframe.value = mirrorParameterKeyValue(group.parameter, keyframe.value);
    }
    group.warp.keyframes = normalizeWarpKeyframes(group.warp.keyframes, group.warp.vertices || []);
  }
}

function normalizeMirroredDeformerGroupPartIds(partIds) {
  const mapped = [];
  for (const partId of Array.isArray(partIds) ? partIds : []) {
    const mirroredId = mirroredImagePartId(partId);
    if (mirroredId && !mapped.includes(mirroredId)) mapped.push(mirroredId);
  }
  return normalizeDeformerGroupPartIds({ partIds: mapped });
}

function mirroredImagePartId(partId) {
  const sourceId = safeSegment(partId, "");
  if (!sourceId) return "";
  const directId = safeSegment(mirrorSideText(sourceId), "");
  if (directId && directId !== sourceId && imagePartById(rig, directId)) return directId;
  const sourcePart = imagePartById(rig, sourceId);
  const mirroredLabel = mirrorSideText(sourcePart?.label || "");
  if (sourcePart && mirroredLabel && mirroredLabel !== sourcePart.label) {
    const labelMatch = getImageParts().find((part) => part.id !== sourceId && String(part.label || "") === mirroredLabel);
    if (labelMatch) return labelMatch.id;
  }
  return sourceId;
}

function mirroredDeformerGroupId(groupId) {
  const sourceId = safeSegment(groupId, "");
  if (!sourceId) return "";
  const directId = safeSegment(mirrorSideText(sourceId), "");
  if (directId && directId !== sourceId && deformerGroupById(rig, directId)) return directId;
  const sourceGroup = deformerGroupById(rig, sourceId);
  const mirroredLabel = mirrorSideText(sourceGroup?.label || "");
  if (sourceGroup && mirroredLabel && mirroredLabel !== sourceGroup.label) {
    const labelMatch = getDeformerGroups().find((group) => group.id !== sourceId && String(group.label || "") === mirroredLabel);
    if (labelMatch) return labelMatch.id;
  }
  return sourceId;
}

function mirrorSideText(value) {
  const text = String(value || "");
  if (!text) return text;
  return text
    .replace(/\bleft\b/gi, "__mirror_left__")
    .replace(/\bright\b/gi, "left")
    .replace(/__mirror_left__/gi, "right")
    .replace(/(^|[_\-\s])l($|[_\-\s])/gi, "$1__mirror_l__$2")
    .replace(/(^|[_\-\s])r($|[_\-\s])/gi, "$1l$2")
    .replace(/__mirror_l__/gi, "r");
}

function mirrorTransformSnapshot(transform, hasParent) {
  if (Number.isFinite(Number(transform.x))) {
    transform.x = Number((hasParent ? -Number(transform.x) : Number(rig.canvas.width || 900) - Number(transform.x)).toFixed(3));
  }
  if (Number.isFinite(Number(transform.scaleX))) {
    transform.scaleX = Number((-Number(transform.scaleX)).toFixed(4));
  }
  if (Number.isFinite(Number(transform.rotation))) {
    transform.rotation = Number((-Number(transform.rotation)).toFixed(3));
  }
}

function normalizeMirroredKeyframes(value) {
  return Array.isArray(value)
    ? value
      .filter((keyframe) => Number.isFinite(Number(keyframe?.value)))
      .sort((left, right) => Number(left.value) - Number(right.value))
    : [];
}

function mirrorParameterKeyValue(parameter, value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || !shouldMirrorParameterKey(parameter)) return value;
  return Number((-numberValue).toFixed(4));
}

function shouldMirrorParameterKey(parameter) {
  const key = String(parameter || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (!key) return false;
  if (["anglex", "anglez", "lookx", "bodyx", "headx", "turnx", "tilt", "roll", "hairsway"].includes(key)) return true;
  if (key.endsWith("z") && (key.includes("angle") || key.includes("tilt") || key.includes("roll"))) return true;
  return key.endsWith("x") && (key.includes("angle") || key.includes("look") || key.includes("turn") || key.includes("sway"));
}

function mirrorVisibilityGate(value) {
  const gate = value && typeof value === "object" && !Array.isArray(value)
    ? { ...value }
    : normalizeImagePartVisibilityGate({ visibilityGate: value });
  if (!gate.enabled || !shouldMirrorParameterKey(gate.parameter || gate.param || gate.key)) return gate;
  const min = Number(gate.min ?? gate.minimum);
  const max = Number(gate.max ?? gate.maximum);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return gate;
  return {
    ...gate,
    min: Number((-Math.max(min, max)).toFixed(4)),
    max: Number((-Math.min(min, max)).toFixed(4))
  };
}

function uniqueImagePartId(baseId) {
  const ids = new Set(getImageParts().map((part) => part.id));
  if (!ids.has(baseId)) return baseId;
  let index = 2;
  while (ids.has(`${baseId}_${index}`)) index += 1;
  return `${baseId}_${index}`;
}

function uniqueImagePartLabel(baseLabel) {
  const labels = new Set(getImageParts().map((part) => part.label));
  if (!labels.has(baseLabel)) return baseLabel;
  let index = 2;
  while (labels.has(`${baseLabel} ${index}`)) index += 1;
  return `${baseLabel} ${index}`;
}

function uniqueDeformerGroupLabel(baseLabel) {
  const labels = new Set(getDeformerGroups().map((group) => group.label));
  if (!labels.has(baseLabel)) return baseLabel;
  let index = 2;
  while (labels.has(`${baseLabel} ${index}`)) index += 1;
  return `${baseLabel} ${index}`;
}

function partSelectionId(id) {
  return `part:${id}`;
}

function deformerGroupSelectionId(id) {
  return `group:${id}`;
}

function selectedImagePart() {
  if (!selectedLayerId.startsWith("part:")) return null;
  const id = selectedLayerId.slice("part:".length);
  return getImageParts().find((part) => part.id === id) || null;
}

function selectedDeformerGroup() {
  if (!selectedLayerId.startsWith("group:")) return null;
  const id = selectedLayerId.slice("group:".length);
  return getDeformerGroups().find((group) => group.id === id) || null;
}

function getDeformerGroups(sourceRig = rig) {
  if (!Array.isArray(sourceRig.deformerGroups)) sourceRig.deformerGroups = [];
  sourceRig.deformerGroups = normalizeDeformerGroups(sourceRig.deformerGroups, sourceRig);
  return sourceRig.deformerGroups;
}

function addDeformerGroup() {
  const selectedPart = selectedImagePart();
  const transform = selectedPart ? effectivePartTransform(rig, selectedPart) : null;
  const selectedBounds = selectedPart ? pointBounds(imagePartTransformGeometry(selectedPart)?.corners || []) : null;
  const id = uniqueDeformerGroupId("deformer_group");
  const group = createDeformerGroup({
    id,
    label: selectedPart ? `${selectedPart.label || selectedPart.id} Deformer` : "Deformer Group",
    x: transform?.x ?? Number(rig.canvas?.width || 900) * 0.5,
    y: transform?.y ?? Number(rig.canvas?.height || 1400) * 0.5,
    partIds: selectedPart ? [selectedPart.id] : [],
    warp: {
      width: selectedBounds?.width || 360,
      height: selectedBounds?.height || 360
    }
  });
  getDeformerGroups().push(group);
  selectedLayerId = deformerGroupSelectionId(group.id);
  renderLayerList();
  renderLayerControls();
  draw();
  commitHistory(`add deformer group ${group.id}`);
}

function createDeformerGroup(source = {}) {
  return {
    id: safeSegment(source.id || "deformer_group", "deformer_group"),
    label: String(source.label || source.name || source.id || "Deformer Group"),
    enabled: source.enabled !== false,
    autoGenerated: source.autoGenerated === true || source.auto_generated === true,
    autoGroupKind: safeSegment(source.autoGroupKind || source.auto_group_kind || "", ""),
    parameter: knownParameterKey(source.parameter || source.param) || "angleX",
    parentGroupId: normalizeDeformerGroupParentId(source.parentGroupId || source.parentId || source.parent, source.id || "deformer_group"),
    partIds: normalizeDeformerGroupPartIds(source),
    x: Number.isFinite(Number(source.x)) ? Number(source.x) : Number(rig.canvas?.width || 900) * 0.5,
    y: Number.isFinite(Number(source.y)) ? Number(source.y) : Number(rig.canvas?.height || 1400) * 0.5,
    scaleX: Number.isFinite(Number(source.scaleX)) ? Number(source.scaleX) : 1,
    scaleY: Number.isFinite(Number(source.scaleY)) ? Number(source.scaleY) : 1,
    rotation: Number.isFinite(Number(source.rotation)) ? Number(source.rotation) : 0,
    opacity: Number.isFinite(Number(source.opacity)) ? Number(source.opacity) : 1,
    keyframes: normalizePartTransformKeyframes(source.keyframes || source.keys || []),
    warp: normalizeDeformerGroupWarp(source.warp || source.warpDeformer || {}, source, rig)
  };
}

function uniqueDeformerGroupId(baseId) {
  const ids = new Set(getDeformerGroups().map((group) => group.id));
  if (!ids.has(baseId)) return baseId;
  let index = 2;
  while (ids.has(`${baseId}_${index}`)) index += 1;
  return `${baseId}_${index}`;
}

function normalizeDeformerGroupPartIds(group, sourceRig = rig) {
  const source = Array.isArray(group?.partIds)
    ? group.partIds
    : Array.isArray(group?.parts)
      ? group.parts
      : [];
  const sourceParts = Array.isArray(sourceRig?.imageParts) ? sourceRig.imageParts : getImageParts();
  const ids = new Set(sourceParts.map((part) => part.id));
  const result = [];
  for (const rawId of source) {
    const id = safeSegment(typeof rawId === "object" ? rawId?.id : rawId, "");
    if (!id || !ids.has(id) || result.includes(id)) continue;
    result.push(id);
  }
  return result;
}

function normalizeDeformerGroupParentId(value, selfId = "", sourceRig = rig) {
  const id = safeSegment(value, "");
  const self = safeSegment(selfId, "");
  if (!id || id === self) return "";
  const groups = Array.isArray(sourceRig?.deformerGroups) ? sourceRig.deformerGroups : [];
  if (groups.length > 0 && !groups.some((group) => group.id === id)) return "";
  return id;
}

function deformerGroupParentOptions(group) {
  const groupId = safeSegment(group?.id, "");
  return [
    ["", "None"],
    ...getDeformerGroups()
      .filter((entry) => entry.id !== groupId && !deformerGroupHasAncestor(entry, groupId))
      .map((entry) => [entry.id, entry.label || entry.id])
  ];
}

function deformerGroupById(sourceRig, id) {
  const cleanId = safeSegment(id, "");
  if (!cleanId) return null;
  const groups = Array.isArray(sourceRig?.deformerGroups) ? sourceRig.deformerGroups : [];
  return groups.find((entry) => entry.id === cleanId) || null;
}

function deformerGroupHasAncestor(group, ancestorId, sourceRig = rig, visited = new Set()) {
  const parentId = normalizeDeformerGroupParentId(group?.parentGroupId, group?.id || "", sourceRig);
  if (!parentId || visited.has(parentId)) return false;
  if (parentId === ancestorId) return true;
  visited.add(parentId);
  const parent = deformerGroupById(sourceRig, parentId);
  return parent ? deformerGroupHasAncestor(parent, ancestorId, sourceRig, visited) : false;
}

function deformerGroupParentCreatesCycle(groups, group) {
  const groupId = safeSegment(group?.id, "");
  if (!groupId) return false;
  const visited = new Set([groupId]);
  let parentId = normalizeDeformerGroupParentId(group?.parentGroupId, groupId, { deformerGroups: groups });
  while (parentId) {
    if (visited.has(parentId)) return true;
    visited.add(parentId);
    const parent = groups.find((entry) => entry.id === parentId);
    if (!parent) return false;
    parentId = normalizeDeformerGroupParentId(parent.parentGroupId, parent.id, { deformerGroups: groups });
  }
  return false;
}

function deformerGroupAffectedPartIds(group, sourceRig = rig, visited = new Set()) {
  const groupId = safeSegment(group?.id, "");
  if (!groupId || visited.has(groupId)) return [];
  visited.add(groupId);
  const result = [...normalizeDeformerGroupPartIds(group, sourceRig)];
  const groups = Array.isArray(sourceRig?.deformerGroups) ? sourceRig.deformerGroups : getDeformerGroups(sourceRig);
  for (const child of groups) {
    if (child.enabled === false) continue;
    if (normalizeDeformerGroupParentId(child.parentGroupId, child.id, sourceRig) !== groupId) continue;
    result.push(...deformerGroupAffectedPartIds(child, sourceRig, new Set(visited)));
  }
  return [...new Set(result)];
}

function createWarpGrid(columns = 3, rows = 3) {
  const cleanColumns = Math.round(clamp(columns, 2, 6));
  const cleanRows = Math.round(clamp(rows, 2, 6));
  const vertices = [];
  for (let row = 0; row < cleanRows; row += 1) {
    for (let column = 0; column < cleanColumns; column += 1) {
      vertices.push({
        u: cleanColumns <= 1 ? 0 : Number((column / (cleanColumns - 1)).toFixed(4)),
        v: cleanRows <= 1 ? 0 : Number((row / (cleanRows - 1)).toFixed(4)),
        dx: 0,
        dy: 0
      });
    }
  }
  return { columns: cleanColumns, rows: cleanRows, vertices };
}

function normalizeDeformerGroupWarp(value = {}, group = {}, sourceRig = rig) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const columns = Math.round(clamp(source.columns || source.cols || 3, 2, 6));
  const rows = Math.round(clamp(source.rows || 3, 2, 6));
  const fallback = createWarpGrid(columns, rows);
  const sourceVertices = Array.isArray(source.vertices) ? source.vertices : [];
  const canvasWidth = Number(sourceRig?.canvas?.width || 900);
  const canvasHeight = Number(sourceRig?.canvas?.height || 1400);
  const width = Number.isFinite(Number(source.width ?? group?.warpWidth))
    ? Number(source.width ?? group?.warpWidth)
    : Math.min(canvasWidth, 360);
  const height = Number.isFinite(Number(source.height ?? group?.warpHeight))
    ? Number(source.height ?? group?.warpHeight)
    : Math.min(canvasHeight, 360);
  const vertices = fallback.vertices.map((vertex, index) => ({
    u: Number.isFinite(Number(sourceVertices[index]?.u)) ? Number(sourceVertices[index].u) : vertex.u,
    v: Number.isFinite(Number(sourceVertices[index]?.v)) ? Number(sourceVertices[index].v) : vertex.v,
    dx: Number.isFinite(Number(sourceVertices[index]?.dx)) ? Number(sourceVertices[index].dx) : 0,
    dy: Number.isFinite(Number(sourceVertices[index]?.dy)) ? Number(sourceVertices[index].dy) : 0
  }));
  return {
    enabled: source.enabled === true,
    editing: source.editing !== false,
    columns,
    rows,
    width: Math.max(24, Number(width.toFixed(3))),
    height: Math.max(24, Number(height.toFixed(3))),
    vertices,
    keyframes: normalizeWarpKeyframes(source.keyframes || source.keys || [], vertices)
  };
}

function resizeDeformerGroupWarp(warp, columns, rows) {
  const previous = normalizeDeformerGroupWarp(warp || {});
  const next = normalizeDeformerGroupWarp({
    ...previous,
    columns,
    rows,
    vertices: createWarpGrid(columns, rows).vertices,
    keyframes: []
  });
  return {
    ...next,
    enabled: previous.enabled,
    editing: previous.editing,
    width: previous.width,
    height: previous.height
  };
}

function normalizeWarpKeyframes(value, baseVertices) {
  const source = Array.isArray(value) ? value : [];
  const keyframes = source
    .map((keyframe) => ({
      value: Number(keyframe?.value ?? keyframe?.paramValue),
      vertices: normalizeKeyframeVertices(keyframe?.vertices, baseVertices)
    }))
    .filter((keyframe) => Number.isFinite(keyframe.value))
    .sort((a, b) => a.value - b.value);
  const deduped = [];
  for (const keyframe of keyframes) {
    const previous = deduped[deduped.length - 1];
    if (previous && Math.abs(previous.value - keyframe.value) <= 0.001) {
      deduped[deduped.length - 1] = keyframe;
    } else {
      deduped.push(keyframe);
    }
  }
  return deduped;
}

function fitDeformerGroupWarpToAffectedParts(group) {
  group.warp = normalizeDeformerGroupWarp(group.warp || {}, group, rig);
  const partIds = new Set(normalizeDeformerGroupPartIds(group));
  const points = getImageParts()
    .filter((part) => partIds.has(part.id))
    .flatMap((part) => imagePartTransformGeometry(part)?.corners || []);
  const bounds = pointBounds(points);
  if (!bounds) return;
  group.x = Number((bounds.x + bounds.width * 0.5).toFixed(3));
  group.y = Number((bounds.y + bounds.height * 0.5).toFixed(3));
  group.warp.width = Math.max(24, Number(bounds.width.toFixed(3)));
  group.warp.height = Math.max(24, Number(bounds.height.toFixed(3)));
}

function imagePartMaskOptions(part) {
  return [
    ["", "None"],
    ...getImageParts()
      .filter((entry) => entry.id !== part.id)
      .map((entry) => [entry.id, entry.label || entry.id])
  ];
}

function imagePartParentOptions(part) {
  return [
    ["", "None"],
    ...getImageParts()
      .filter((entry) => entry.id !== part.id && !imagePartHasAncestor(entry, part.id))
      .map((entry) => [entry.id, entry.label || entry.id])
  ];
}

function imagePartHasAncestor(part, ancestorId, visited = new Set()) {
  const parentId = normalizeImagePartParentId(part?.parentPartId, part?.id || "");
  if (!parentId || visited.has(parentId)) return false;
  if (parentId === ancestorId) return true;
  visited.add(parentId);
  const parent = imagePartById(rig, parentId);
  return parent ? imagePartHasAncestor(parent, ancestorId, visited) : false;
}

function imagePartById(sourceRig, id) {
  const cleanId = safeSegment(id, "");
  if (!cleanId) return null;
  const parts = Array.isArray(sourceRig.imageParts) ? sourceRig.imageParts : [];
  return parts.find((entry) => entry.id === cleanId) || null;
}

function activeSoloImagePartIds(sourceRig = rig) {
  const available = new Set((Array.isArray(sourceRig?.imageParts) ? sourceRig.imageParts : [])
    .map((part) => safeSegment(part?.id || "", ""))
    .filter(Boolean));
  const active = new Set([...soloImagePartIds].filter((id) => available.has(id)));
  if (sourceRig === rig && active.size !== soloImagePartIds.size) {
    soloImagePartIds = active;
  }
  return active;
}

function imagePartMutedByEditorSolo(sourceRig, part, options = {}) {
  if (!options.editorPreview || options.ignoreEditorSolo) return false;
  const activeSoloIds = activeSoloImagePartIds(sourceRig);
  return activeSoloIds.size > 0 && !activeSoloIds.has(part?.id || "");
}

function imagePartVisibleInEditorPreview(sourceRig, part) {
  return part?.visible !== false
    && imagePartVisibilityFactor(sourceRig, part) > 0.001
    && !imagePartMutedByEditorSolo(sourceRig, part, { editorPreview: true });
}

function setImagePartSolo(partId, enabled) {
  const cleanId = safeSegment(partId || "", "");
  if (!cleanId) return;
  const nextSoloIds = activeSoloImagePartIds(rig);
  if (enabled) nextSoloIds.add(cleanId);
  else nextSoloIds.delete(cleanId);
  soloImagePartIds = nextSoloIds;
  renderLayerList();
  renderLayerControls();
  draw();
  showToast(soloImagePartIds.size > 0
    ? `Solo preview: ${soloImagePartIds.size} image part${soloImagePartIds.size === 1 ? "" : "s"}`
    : "Solo preview cleared.");
}

function clearImagePartSolo() {
  if (soloImagePartIds.size === 0) return;
  soloImagePartIds = new Set();
  renderLayerList();
  renderLayerControls();
  draw();
  showToast("Solo preview cleared.");
}

function imagePartMaskPart(sourceRig, part) {
  const clipPartId = normalizeImagePartClipPartId(part.clipPartId, part.id);
  if (!clipPartId) return null;
  return imagePartById(sourceRig, clipPartId);
}

function draw(targetCanvas = canvas, targetRig = rig, scale = 1) {
  const targetContext = targetCanvas.getContext("2d");
  const width = targetRig.canvas.width * scale;
  const height = targetRig.canvas.height * scale;
  if (targetCanvas.width !== width) targetCanvas.width = width;
  if (targetCanvas.height !== height) targetCanvas.height = height;
  targetContext.setTransform(scale, 0, 0, scale, 0, 0);
  const isMainPreview = targetCanvas === canvas && targetRig === rig;
  if (isMainPreview && shouldDrawMotionOnionSkin()) {
    targetContext.clearRect(0, 0, targetRig.canvas.width, targetRig.canvas.height);
    drawMotionOnionSkins(targetContext);
    drawRig(targetContext, targetRig, { clear: false, editorPreview: true });
  } else {
    drawRig(targetContext, targetRig, { editorPreview: isMainPreview });
  }
  if (targetCanvas === canvas && targetRig === rig) {
    drawStageGridOverlay(targetContext, targetRig);
    drawParameterInfluenceOverlay(targetContext);
    drawHitAreaOverlay(targetContext);
    drawSelectedMeshOverlay(targetContext);
    drawSelectedDeformerGroupOverlay(targetContext);
    drawSelectedImagePartTransformOverlay(targetContext);
    applyStageViewportZoom();
  }
}

function drawStageGridOverlay(context, sourceRig = rig) {
  if (!elements.showStageGrid?.checked) return;
  const width = Number(sourceRig.canvas?.width || canvas.width || 900);
  const height = Number(sourceRig.canvas?.height || canvas.height || 1400);
  const step = stageGridSizeValue();
  if (width <= 0 || height <= 0 || step <= 0) return;
  context.save();
  context.lineWidth = 1;
  context.strokeStyle = "rgba(157, 204, 255, 0.16)";
  context.beginPath();
  for (let x = 0; x <= width; x += step) {
    context.moveTo(x + 0.5, 0);
    context.lineTo(x + 0.5, height);
  }
  for (let y = 0; y <= height; y += step) {
    context.moveTo(0, y + 0.5);
    context.lineTo(width, y + 0.5);
  }
  context.stroke();
  context.strokeStyle = "rgba(157, 204, 255, 0.34)";
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(width * 0.5, 0);
  context.lineTo(width * 0.5, height);
  context.moveTo(0, height * 0.5);
  context.lineTo(width, height * 0.5);
  context.stroke();
  context.restore();
}

function shouldDrawMotionOnionSkin() {
  const clip = activeMotionClip();
  return Boolean(elements.motionOnionSkin.checked && clip && Array.isArray(clip.keyframes) && clip.keyframes.length > 0);
}

function drawMotionOnionSkins(context) {
  const clip = activeMotionClip();
  if (!clip) return;
  const duration = clamp(clip.duration || 2, 0.1, 30);
  const currentTime = clamp(elements.motionTime.value || 0, 0, duration);
  const step = Math.min(motionOnionSkinStep(), duration);
  const samples = [
    { time: wrappedMotionTime(currentTime - step, duration), alpha: 0.22 },
    { time: wrappedMotionTime(currentTime + step, duration), alpha: 0.16 }
  ];
  for (const sample of samples) {
    const params = interpolatedMotionParams(clip, sample.time);
    if (Object.keys(params).length === 0) continue;
    context.save();
    context.globalAlpha = sample.alpha;
    drawRig(context, { ...rig, params: { ...rig.params, ...params } }, { clear: false, editorPreview: true });
    context.restore();
  }
}

function drawRig(context, sourceRig, options = {}) {
  const { width, height } = sourceRig.canvas;
  if (options.clear !== false) context.clearRect(0, 0, width, height);
  const p = sourceRig.params;
  const angleX = normalized(p.angleX);
  const angleY = normalized(p.angleY);
  const angleZ = normalized(p.angleZ, 45);
  const breath = Math.max(0, Number(p.breath || 0)) / 100;
  const hairSway = normalized(p.hairSway);
  const head = {
    x: width * 0.5 + angleX * 28,
    y: height * 0.335 + angleY * 18,
    rotation: angleZ * 0.18,
    scaleX: 1 - Math.abs(angleX) * 0.035,
    scaleY: 1 + angleY * 0.02
  };
  const palette = sourceRig.palette;

  drawImageParts(context, sourceRig, "back", options);

  withLayer(context, sourceRig, "backHair", head.x, head.y + 20, () => {
    context.fillStyle = palette.hair;
    context.strokeStyle = palette.line;
    context.lineWidth = 8;
    ellipse(context, head.x, head.y + 42 + hairSway * 10, 210, 275, 0, true, true);
    context.fillStyle = shade(palette.hair, -26);
    ellipse(context, head.x - 95 - angleX * 22, head.y + 88, 62, 250, -0.18 + hairSway * 0.08, true, false);
    ellipse(context, head.x + 95 - angleX * 22, head.y + 88, 62, 250, 0.18 + hairSway * 0.08, true, false);
  });

  withLayer(context, sourceRig, "body", width * 0.5, height * 0.78, () => {
    const lift = breath * -10;
    context.fillStyle = palette.outfit;
    context.strokeStyle = palette.line;
    context.lineWidth = 8;
    roundedRect(context, width * 0.5 - 220, height * 0.685 + lift, 440, 410, 96, true, true);
    context.fillStyle = shade(palette.outfit, 24);
    roundedRect(context, width * 0.5 - 128, height * 0.685 + lift, 256, 122, 42, true, false);
  });

  withLayer(context, sourceRig, "neck", width * 0.5, height * 0.57, () => {
    context.fillStyle = shade(palette.skin, -8);
    context.strokeStyle = palette.line;
    context.lineWidth = 7;
    roundedRect(context, width * 0.5 - 64, height * 0.515, 128, 178, 42, true, true);
  });

  context.save();
  context.translate(head.x, head.y);
  context.rotate(head.rotation);
  context.scale(head.scaleX, head.scaleY);
  context.translate(-head.x, -head.y);

  withLayer(context, sourceRig, "ears", head.x, head.y, () => {
    context.fillStyle = palette.skin;
    context.strokeStyle = palette.line;
    context.lineWidth = 7;
    ellipse(context, head.x - 174, head.y + 16, 42, 70, -0.18, true, true);
    ellipse(context, head.x + 174, head.y + 16, 42, 70, 0.18, true, true);
  });

  withLayer(context, sourceRig, "head", head.x, head.y, () => {
    context.fillStyle = palette.skin;
    context.strokeStyle = palette.line;
    context.lineWidth = 8;
    ellipse(context, head.x, head.y, 178, 214, 0, true, true);
    context.fillStyle = hexToRgba(palette.shadow, 0.16);
    ellipse(context, head.x - 58 + angleX * 24, head.y + 62, 82, 64, -0.08, true, false);
  });

  withLayer(context, sourceRig, "blush", head.x, head.y, () => {
    context.fillStyle = hexToRgba(palette.blush, 0.34 + Math.max(0, normalized(p.smile)) * 0.18);
    ellipse(context, head.x - 92 + angleX * 20, head.y + 44, 38, 20, 0, true, false);
    ellipse(context, head.x + 92 + angleX * 20, head.y + 44, 38, 20, 0, true, false);
  });

  withLayer(context, sourceRig, "eyes", head.x, head.y, () => drawEyes(context, sourceRig, head));
  withLayer(context, sourceRig, "brows", head.x, head.y, () => drawBrows(context, sourceRig, head));
  withLayer(context, sourceRig, "mouth", head.x, head.y, () => drawMouth(context, sourceRig, head));

  context.restore();

  withLayer(context, sourceRig, "frontHair", head.x, head.y - 122, () => {
    context.fillStyle = palette.hair;
    context.strokeStyle = palette.line;
    context.lineWidth = 8;
    drawHairCap(context, head, hairSway, angleX);
  });

  withLayer(context, sourceRig, "highlight", head.x, head.y - 160, () => {
    context.strokeStyle = palette.highlight;
    context.lineWidth = 12;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(head.x - 92, head.y - 186);
    context.quadraticCurveTo(head.x - 36, head.y - 224, head.x + 46, head.y - 196);
    context.stroke();
  });

  drawImageParts(context, sourceRig, "front", options);
}

function drawImageParts(context, sourceRig, slot, options = {}) {
  const parts = Array.isArray(sourceRig.imageParts) ? sourceRig.imageParts : [];
  const sortedParts = parts
    .filter((part) => (part.slot || "front") === slot)
    .slice()
    .sort((a, b) => {
      const orderA = effectiveImagePartOrder(sourceRig, a);
      const orderB = effectiveImagePartOrder(sourceRig, b);
      if (orderA !== orderB) return orderA - orderB;
      return String(a.label || a.id).localeCompare(String(b.label || b.id));
    });
  for (const part of sortedParts) drawImagePart(context, sourceRig, part, options);
}

function drawImagePart(context, sourceRig, part, options = {}) {
  if (imagePartMutedByEditorSolo(sourceRig, part, options)) return;
  const maskPart = imagePartMaskPart(sourceRig, part);
  if (maskPart) {
    drawMaskedImagePart(context, sourceRig, part, maskPart, options);
    return;
  }
  drawImagePartDirect(context, sourceRig, part, options);
}

function drawMaskedImagePart(context, sourceRig, part, maskPart, options = {}) {
  if (imagePartMutedByEditorSolo(sourceRig, part, options)) return;
  if (part.visible === false || imagePartVisibilityFactor(sourceRig, part) <= 0.001) return;
  const image = imageForPath(part.path);
  const maskImage = imageForPath(maskPart.path);
  if (!image || !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) return;
  if (!maskImage || !maskImage.complete || maskImage.naturalWidth <= 0 || maskImage.naturalHeight <= 0) return;
  const width = Number(sourceRig.canvas?.width || 900);
  const height = Number(sourceRig.canvas?.height || 1400);
  const buffer = document.createElement("canvas");
  buffer.width = width;
  buffer.height = height;
  const bufferContext = buffer.getContext("2d");
  drawImagePartDirect(bufferContext, sourceRig, part, {
    ...options,
    compositeOperation: "source-over",
    ignoreAlphaMask: true
  });
  drawImagePartDirect(bufferContext, sourceRig, maskPart, {
    ...options,
    compositeOperation: "destination-in",
    ignoreAlphaMask: true,
    ignoreVisibility: true,
    ignoreEditorSolo: true
  });
  context.save();
  context.globalCompositeOperation = normalizeImagePartBlendMode(part.blendMode);
  context.drawImage(buffer, 0, 0);
  context.restore();
}

function drawImagePartDirect(context, sourceRig, part, options = {}) {
  if (imagePartMutedByEditorSolo(sourceRig, part, options)) return;
  const visibilityFactor = options.ignoreVisibility ? 1 : imagePartVisibilityFactor(sourceRig, part);
  if ((part.visible === false && !options.ignoreVisibility) || visibilityFactor <= 0.001) return;
  const image = imageForPath(part.path);
  if (!image || !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) return;
  const transform = effectivePartTransform(sourceRig, part);
  const warpGroups = options.ignoreWarp ? [] : activeWarpGroupsForPart(sourceRig, part);
  context.save();
  context.globalAlpha *= transform.opacity * visibilityFactor;
  context.globalCompositeOperation = options.compositeOperation || normalizeImagePartBlendMode(part.blendMode);
  if (warpGroups.length > 0) {
    applyWarpedImagePartClip(context, image, part, transform, sourceRig, warpGroups);
    drawImagePartWarped(context, image, part, transform, sourceRig, warpGroups);
    context.restore();
    return;
  }
  context.translate(transform.x, transform.y);
  context.rotate(transform.rotation);
  context.scale(transform.scaleX, transform.scaleY);
  applyImagePartClip(context, image, part, transform.anchorX, transform.anchorY);
  if (part.mesh?.enabled) {
    drawImagePartMesh(context, image, normalizePartMesh(part), transform.anchorX, transform.anchorY, sourceRig);
  } else {
    context.drawImage(image, -image.naturalWidth * transform.anchorX, -image.naturalHeight * transform.anchorY);
  }
  context.restore();
}

function activeWarpGroupsForPart(sourceRig, part) {
  const groups = getDeformerGroups(sourceRig);
  const byId = new Map();
  for (const group of groups) {
    if (group.enabled === false || !normalizeDeformerGroupPartIds(group, sourceRig).includes(part.id)) continue;
    let current = group;
    const visited = new Set();
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      const warp = normalizeDeformerGroupWarp(current.warp || {}, current, sourceRig);
      current.warp = warp;
      if (warp.enabled === true && current.enabled !== false) {
        byId.set(current.id, current);
      }
      current = deformerGroupParent(sourceRig, current);
    }
  }
  return [...byId.values()].sort((left, right) => deformerGroupDepth(left, sourceRig) - deformerGroupDepth(right, sourceRig));
}

function applyImagePartClip(context, image, part, anchorX, anchorY) {
  const shape = normalizeImagePartClipShape(part.clipShape);
  if (shape === "none") return;
  const inset = clamp(part.clipInset ?? 0, 0, 0.45);
  const width = image.naturalWidth * Math.max(0.05, 1 - inset * 2);
  const height = image.naturalHeight * Math.max(0.05, 1 - inset * 2);
  const x = -image.naturalWidth * anchorX + image.naturalWidth * inset;
  const y = -image.naturalHeight * anchorY + image.naturalHeight * inset;
  context.beginPath();
  if (shape === "ellipse") {
    context.ellipse(x + width * 0.5, y + height * 0.5, width * 0.5, height * 0.5, 0, 0, Math.PI * 2);
  } else if (shape === "rounded") {
    const radius = Math.min(width, height) * clamp(part.clipRadius ?? 0.12, 0, 0.5);
    roundedRectPath(context, x, y, width, height, radius);
  } else {
    context.rect(x, y, width, height);
  }
  context.clip();
}

function effectivePartTransform(sourceRig, part) {
  const transform = effectivePartTransformWithoutGroups(sourceRig, part);
  return applyDeformerGroupsToPartTransform(sourceRig, part, transform);
}

function effectivePartTransformWithoutGroups(sourceRig, part) {
  const transform = localPartTransform(sourceRig, part);
  const parentId = normalizeImagePartParentId(part.parentPartId, part.id);
  if (!parentId) return transform;
  const parent = imagePartById(sourceRig, parentId);
  if (!parent) return transform;
  return composePartTransforms(effectivePartTransformWithoutGroups(sourceRig, parent), transform);
}

function applyDeformerGroupsToPartTransform(sourceRig, part, transform) {
  let result = transform;
  const groups = deformerGroupsForPartTransform(sourceRig, part);
  for (const group of groups) {
    const base = deformerGroupBaseTransform(group, sourceRig);
    const keyed = effectiveDeformerGroupTransform(sourceRig, group);
    const local = localTransformFromWorldTransform(base, result);
    result = composePartTransforms(keyed, local);
  }
  return result;
}

function deformerGroupsForPartTransform(sourceRig, part) {
  const directGroups = getDeformerGroups(sourceRig).filter((group) => (
    group.enabled !== false
    && normalizeDeformerGroupPartIds(group, sourceRig).includes(part.id)
  ));
  return directGroups
    .filter((group) => !directGroups.some((other) => (
      other.id !== group.id
      && deformerGroupHasAncestor(other, group.id, sourceRig)
    )))
    .sort((left, right) => deformerGroupDepth(left, sourceRig) - deformerGroupDepth(right, sourceRig));
}

function setImagePartParentKeepWorld(part, nextParentId) {
  const previousWorld = effectivePartTransform(rig, part);
  const previousLocal = localPartTransform(rig, part);
  const parentId = normalizeImagePartParentId(nextParentId, part.id);
  part.parentPartId = parentId;
  const parent = parentId ? imagePartById(rig, parentId) : null;
  const desiredLocal = parent
    ? localTransformFromWorldTransform(effectivePartTransform(rig, parent), previousWorld)
    : previousWorld;
  applyLocalTransformDeltaToPart(part, previousLocal, desiredLocal);
}

function setDeformerGroupParentKeepWorld(group, nextParentId) {
  const previousWorld = effectiveDeformerGroupTransform(rig, group);
  const previousLocal = localDeformerGroupCurrentTransform(rig, group);
  const parentId = normalizeDeformerGroupParentId(nextParentId, group.id);
  group.parentGroupId = parentId;
  const parent = parentId ? deformerGroupById(rig, parentId) : null;
  const desiredLocal = parent
    ? localTransformFromWorldTransform(effectiveDeformerGroupTransform(rig, parent), previousWorld)
    : previousWorld;
  applyLocalTransformDeltaToDeformerGroup(group, previousLocal, desiredLocal);
}

function localPartTransform(sourceRig, part) {
  const base = snapshotPartTransform(part, sourceRig);
  const transform = { ...base };
  for (const deformer of normalizePartTransformDeformers(part)) {
    const keyed = interpolatePartTransformKeyframes(deformer, sourceRig);
    if (!keyed) continue;
    for (const [key] of imagePartTransformKeys) {
      transform[key] += Number(keyed[key] ?? base[key]) - Number(base[key]);
    }
  }

  transform.x += paramBindingValue(sourceRig, part.bindX) * Number(part.bindXStrength || 0);
  transform.y += paramBindingValue(sourceRig, part.bindY) * Number(part.bindYStrength || 0);
  transform.rotation += paramBindingValue(sourceRig, part.bindRotation) * Number(part.bindRotationStrength || 0);
  transform.scaleX += paramBindingValue(sourceRig, part.bindScaleX) * Number(part.bindScaleXStrength || 0);
  transform.scaleY += paramBindingValue(sourceRig, part.bindScaleY) * Number(part.bindScaleYStrength || 0);
  transform.opacity += paramBindingValue(sourceRig, part.bindOpacity) * Number(part.bindOpacityStrength || 0);
  transform.scaleX = clamp(transform.scaleX, -3, 3) || 1;
  transform.scaleY = clamp(transform.scaleY, -3, 3) || 1;
  transform.rotation = transform.rotation * Math.PI / 180;
  transform.opacity = clamp(transform.opacity, 0, 1);
  transform.anchorX = clamp(transform.anchorX, 0, 1);
  transform.anchorY = clamp(transform.anchorY, 0, 1);
  return transform;
}

function deformerGroupBaseTransform(group, sourceRig = rig) {
  const local = localDeformerGroupBaseTransform(group, sourceRig);
  const parent = deformerGroupParent(sourceRig, group);
  return parent ? composePartTransforms(deformerGroupBaseTransform(parent, sourceRig), local) : local;
}

function localDeformerGroupBaseTransform(group, sourceRig = rig) {
  return {
    x: Number.isFinite(Number(group.x)) ? Number(group.x) : Number(sourceRig.canvas?.width || 900) * 0.5,
    y: Number.isFinite(Number(group.y)) ? Number(group.y) : Number(sourceRig.canvas?.height || 1400) * 0.5,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
    anchorX: 0.5,
    anchorY: 0.5
  };
}

function effectiveDeformerGroupTransform(sourceRig, group) {
  const local = localDeformerGroupCurrentTransform(sourceRig, group);
  const parent = deformerGroupParent(sourceRig, group);
  return parent ? composePartTransforms(effectiveDeformerGroupTransform(sourceRig, parent), local) : local;
}

function localDeformerGroupCurrentTransform(sourceRig, group) {
  const base = snapshotDeformerGroupTransform(group, sourceRig);
  const transform = { ...base };
  const keyed = interpolateDeformerGroupKeyframes(group, sourceRig);
  if (keyed) {
    for (const [key] of imagePartTransformKeys) {
      transform[key] += Number(keyed[key] ?? base[key]) - Number(base[key]);
    }
  }
  transform.scaleX = clamp(transform.scaleX, -3, 3) || 1;
  transform.scaleY = clamp(transform.scaleY, -3, 3) || 1;
  transform.rotation = transform.rotation * Math.PI / 180;
  transform.opacity = clamp(transform.opacity, 0, 1);
  transform.anchorX = 0.5;
  transform.anchorY = 0.5;
  return transform;
}

function deformerGroupParent(sourceRig, group) {
  const parentId = normalizeDeformerGroupParentId(group?.parentGroupId, group?.id || "", sourceRig);
  if (!parentId) return null;
  const parent = deformerGroupById(sourceRig, parentId);
  return parent && parent.enabled !== false ? parent : null;
}

function deformerGroupDepth(group, sourceRig = rig) {
  let depth = 0;
  let current = group;
  const visited = new Set();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    current = deformerGroupParent(sourceRig, current);
    if (current) depth += 1;
  }
  return depth;
}

function snapshotDeformerGroupTransform(group, sourceRig = rig) {
  return {
    x: Number.isFinite(Number(group.x)) ? Number(group.x) : Number(sourceRig.canvas?.width || 900) * 0.5,
    y: Number.isFinite(Number(group.y)) ? Number(group.y) : Number(sourceRig.canvas?.height || 1400) * 0.5,
    scaleX: Number.isFinite(Number(group.scaleX)) ? Number(group.scaleX) : 1,
    scaleY: Number.isFinite(Number(group.scaleY)) ? Number(group.scaleY) : 1,
    rotation: Number.isFinite(Number(group.rotation)) ? Number(group.rotation) : 0,
    opacity: Number.isFinite(Number(group.opacity)) ? Number(group.opacity) : 1
  };
}

function composePartTransforms(parent, child) {
  const cos = Math.cos(parent.rotation);
  const sin = Math.sin(parent.rotation);
  const scaledX = child.x * parent.scaleX;
  const scaledY = child.y * parent.scaleY;
  return {
    ...child,
    x: parent.x + scaledX * cos - scaledY * sin,
    y: parent.y + scaledX * sin + scaledY * cos,
    rotation: parent.rotation + child.rotation,
    scaleX: parent.scaleX * child.scaleX,
    scaleY: parent.scaleY * child.scaleY,
    opacity: parent.opacity * child.opacity
  };
}

function localTransformFromWorldTransform(parent, world) {
  const dx = world.x - parent.x;
  const dy = world.y - parent.y;
  const cos = Math.cos(parent.rotation);
  const sin = Math.sin(parent.rotation);
  const scaledX = dx * cos + dy * sin;
  const scaledY = -dx * sin + dy * cos;
  return {
    ...world,
    x: scaledX / safeScale(parent.scaleX),
    y: scaledY / safeScale(parent.scaleY),
    rotation: world.rotation - parent.rotation,
    scaleX: world.scaleX / safeScale(parent.scaleX),
    scaleY: world.scaleY / safeScale(parent.scaleY),
    opacity: parent.opacity > 0.0001 ? world.opacity / parent.opacity : world.opacity
  };
}

function applyLocalTransformDeltaToPart(part, previousLocal, desiredLocal) {
  part.x = Number((Number(part.x || 0) + (desiredLocal.x - previousLocal.x)).toFixed(3));
  part.y = Number((Number(part.y || 0) + (desiredLocal.y - previousLocal.y)).toFixed(3));
  part.scaleX = Number((Number(part.scaleX ?? 1) + (desiredLocal.scaleX - previousLocal.scaleX)).toFixed(4));
  part.scaleY = Number((Number(part.scaleY ?? 1) + (desiredLocal.scaleY - previousLocal.scaleY)).toFixed(4));
  part.rotation = Number((Number(part.rotation || 0) + ((desiredLocal.rotation - previousLocal.rotation) * 180 / Math.PI)).toFixed(3));
  part.opacity = clamp(Number(part.opacity ?? 1) + (desiredLocal.opacity - previousLocal.opacity), 0, 1);
}

function applyLocalTransformDeltaToDeformerGroup(group, previousLocal, desiredLocal) {
  group.x = Number((Number(group.x || 0) + (desiredLocal.x - previousLocal.x)).toFixed(3));
  group.y = Number((Number(group.y || 0) + (desiredLocal.y - previousLocal.y)).toFixed(3));
  group.scaleX = Number((Number(group.scaleX ?? 1) + (desiredLocal.scaleX - previousLocal.scaleX)).toFixed(4));
  group.scaleY = Number((Number(group.scaleY ?? 1) + (desiredLocal.scaleY - previousLocal.scaleY)).toFixed(4));
  group.rotation = Number((Number(group.rotation || 0) + ((desiredLocal.rotation - previousLocal.rotation) * 180 / Math.PI)).toFixed(3));
  group.opacity = clamp(Number(group.opacity ?? 1) + (desiredLocal.opacity - previousLocal.opacity), 0, 1);
}

function safeScale(value) {
  const scale = Number(value);
  if (!Number.isFinite(scale)) return 1;
  return Math.abs(scale) < 0.0001 ? (scale < 0 ? -0.0001 : 0.0001) : scale;
}

function snapshotPartTransform(part, sourceRig = rig) {
  return {
    x: Number.isFinite(Number(part.x)) ? Number(part.x) : Number(sourceRig.canvas?.width || 900) * 0.5,
    y: Number.isFinite(Number(part.y)) ? Number(part.y) : Number(sourceRig.canvas?.height || 1400) * 0.5,
    scaleX: Number.isFinite(Number(part.scaleX)) ? Number(part.scaleX) : 1,
    scaleY: Number.isFinite(Number(part.scaleY)) ? Number(part.scaleY) : 1,
    rotation: Number.isFinite(Number(part.rotation)) ? Number(part.rotation) : 0,
    opacity: Number.isFinite(Number(part.opacity)) ? Number(part.opacity) : 1,
    anchorX: Number.isFinite(Number(part.anchorX)) ? Number(part.anchorX) : 0.5,
    anchorY: Number.isFinite(Number(part.anchorY)) ? Number(part.anchorY) : 0.5
  };
}

function normalizePartTransformDeformers(part) {
  if (!Array.isArray(part.transformDeformers)) part.transformDeformers = [];
  const normalized = [];
  for (const deformer of part.transformDeformers) {
    const parameter = knownParameterKey(deformer?.parameter || deformer?.param);
    if (!parameter) continue;
    const keyframes = normalizePartTransformKeyframes(deformer?.keyframes || deformer?.keys || []);
    normalized.push({ parameter, keyframes });
  }
  part.transformDeformers = normalized.filter((deformer) => deformer.keyframes.length > 0);
  return part.transformDeformers;
}

function normalizeDrawOrderDeformers(part) {
  if (!Array.isArray(part.drawOrderDeformers)) part.drawOrderDeformers = [];
  const normalized = [];
  for (const deformer of part.drawOrderDeformers) {
    const parameter = knownParameterKey(deformer?.parameter || deformer?.param);
    if (!parameter) continue;
    const keyframes = normalizeDrawOrderKeyframes(deformer?.keyframes || deformer?.keys || []);
    normalized.push({ parameter, keyframes });
  }
  part.drawOrderDeformers = normalized.filter((deformer) => deformer.keyframes.length > 0);
  return part.drawOrderDeformers;
}

function normalizeDrawOrderKeyframes(value) {
  const source = Array.isArray(value) ? value : [];
  const keyframes = source
    .map((keyframe) => ({
      value: Number(keyframe?.value ?? keyframe?.paramValue),
      order: Number(keyframe?.order ?? keyframe?.drawOrder ?? keyframe?.draw_order)
    }))
    .filter((keyframe) => Number.isFinite(keyframe.value) && Number.isFinite(keyframe.order))
    .sort((a, b) => a.value - b.value);
  const deduped = [];
  for (const keyframe of keyframes) {
    const previous = deduped[deduped.length - 1];
    if (previous && Math.abs(previous.value - keyframe.value) <= 0.001) {
      deduped[deduped.length - 1] = keyframe;
    } else {
      deduped.push(keyframe);
    }
  }
  return deduped;
}

function normalizePartTransformKeyframes(value) {
  const source = Array.isArray(value) ? value : [];
  const keyframes = source
    .map((keyframe) => {
      const rawTransform = keyframe?.transform && typeof keyframe.transform === "object"
        ? keyframe.transform
        : keyframe;
      return {
        value: Number(keyframe?.value ?? keyframe?.paramValue),
        transform: normalizePartTransformSnapshot(rawTransform)
      };
    })
    .filter((keyframe) => Number.isFinite(keyframe.value))
    .sort((a, b) => a.value - b.value);
  const deduped = [];
  for (const keyframe of keyframes) {
    const previous = deduped[deduped.length - 1];
    if (previous && Math.abs(previous.value - keyframe.value) <= 0.001) {
      deduped[deduped.length - 1] = keyframe;
    } else {
      deduped.push(keyframe);
    }
  }
  return deduped;
}

function normalizePartTransformSnapshot(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const normalized = {};
  for (const [key] of imagePartTransformKeys) {
    if (Number.isFinite(Number(source[key]))) {
      normalized[key] = Number(source[key]);
    }
  }
  return normalized;
}

function interpolatePartTransformKeyframes(deformer, sourceRig) {
  const keyframes = Array.isArray(deformer.keyframes)
    ? deformer.keyframes.filter((keyframe) => keyframe.transform && typeof keyframe.transform === "object").slice().sort((a, b) => a.value - b.value)
    : [];
  if (keyframes.length === 0) return null;
  const value = Number(sourceRig.params?.[deformer.parameter] || 0);
  if (keyframes.length === 1 || value <= keyframes[0].value) return keyframes[0].transform;
  const last = keyframes[keyframes.length - 1];
  if (value >= last.value) return last.transform;
  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const left = keyframes[index];
    const right = keyframes[index + 1];
    if (value < left.value || value > right.value) continue;
    const amount = (value - left.value) / Math.max(0.0001, right.value - left.value);
    const transform = {};
    for (const [key] of imagePartTransformKeys) {
      const leftValue = Number(left.transform?.[key]);
      const rightValue = Number(right.transform?.[key]);
      if (Number.isFinite(leftValue) && Number.isFinite(rightValue)) {
        transform[key] = Number((leftValue + (rightValue - leftValue) * amount).toFixed(4));
      } else if (Number.isFinite(leftValue)) {
        transform[key] = leftValue;
      } else if (Number.isFinite(rightValue)) {
        transform[key] = rightValue;
      }
    }
    return transform;
  }
  return null;
}

function interpolateDrawOrderKeyframes(deformer, sourceRig) {
  const keyframes = Array.isArray(deformer.keyframes)
    ? deformer.keyframes.filter((keyframe) => Number.isFinite(Number(keyframe.order))).slice().sort((a, b) => a.value - b.value)
    : [];
  if (keyframes.length === 0) return null;
  const value = Number(sourceRig.params?.[deformer.parameter] || 0);
  if (keyframes.length === 1 || value <= keyframes[0].value) return keyframes[0];
  const last = keyframes[keyframes.length - 1];
  if (value >= last.value) return last;
  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const left = keyframes[index];
    const right = keyframes[index + 1];
    if (value < left.value || value > right.value) continue;
    const amount = (value - left.value) / Math.max(0.0001, right.value - left.value);
    return {
      value,
      order: Number((Number(left.order || 0) + (Number(right.order || 0) - Number(left.order || 0)) * amount).toFixed(4))
    };
  }
  return null;
}

function interpolateDeformerGroupKeyframes(group, sourceRig) {
  return interpolatePartTransformKeyframes({
    parameter: knownParameterKey(group?.parameter) || "angleX",
    keyframes: normalizePartTransformKeyframes(group?.keyframes || [])
  }, sourceRig);
}

function effectiveDeformerGroupWarpVertices(group, sourceRig) {
  const warp = normalizeDeformerGroupWarp(group?.warp || {}, group, sourceRig);
  group.warp = warp;
  const base = warp.vertices.map((vertex) => ({ ...vertex }));
  const effective = warp.vertices.map((vertex) => ({ ...vertex }));
  const keyedVertices = interpolateWarpKeyframes(group, sourceRig);
  if (keyedVertices) {
    for (let index = 0; index < effective.length; index += 1) {
      effective[index].dx = Number((effective[index].dx + (Number(keyedVertices[index]?.dx || 0) - Number(base[index]?.dx || 0))).toFixed(3));
      effective[index].dy = Number((effective[index].dy + (Number(keyedVertices[index]?.dy || 0) - Number(base[index]?.dy || 0))).toFixed(3));
    }
  }
  return effective;
}

function interpolateWarpKeyframes(group, sourceRig) {
  const warp = normalizeDeformerGroupWarp(group?.warp || {}, group, sourceRig);
  const keyframes = Array.isArray(warp.keyframes)
    ? warp.keyframes.filter((keyframe) => Array.isArray(keyframe.vertices)).slice().sort((a, b) => a.value - b.value)
    : [];
  if (keyframes.length === 0) return null;
  const parameter = knownParameterKey(group?.parameter) || "angleX";
  const value = Number(sourceRig.params?.[parameter] || 0);
  if (keyframes.length === 1 || value <= keyframes[0].value) return keyframes[0].vertices;
  const last = keyframes[keyframes.length - 1];
  if (value >= last.value) return last.vertices;
  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const left = keyframes[index];
    const right = keyframes[index + 1];
    if (value < left.value || value > right.value) continue;
    const amount = (value - left.value) / Math.max(0.0001, right.value - left.value);
    return left.vertices.map((vertex, vertexIndex) => ({
      dx: Number((Number(vertex.dx || 0) + (Number(right.vertices[vertexIndex]?.dx || 0) - Number(vertex.dx || 0)) * amount).toFixed(3)),
      dy: Number((Number(vertex.dy || 0) + (Number(right.vertices[vertexIndex]?.dy || 0) - Number(vertex.dy || 0)) * amount).toFixed(3))
    }));
  }
  return null;
}

function applyWarpGroupsToCanvasPoint(sourceRig, point, groups) {
  let result = point;
  for (const group of groups) {
    result = applyDeformerGroupWarpToCanvasPoint(sourceRig, group, result);
  }
  return result;
}

function applyDeformerGroupWarpToCanvasPoint(sourceRig, group, point) {
  const warp = normalizeDeformerGroupWarp(group.warp || {}, group, sourceRig);
  if (warp.enabled !== true) return point;
  const transform = effectiveDeformerGroupTransform(sourceRig, group);
  const local = globalPointToTransformLocal(point, transform);
  const u = local.x / Math.max(1, warp.width) + 0.5;
  const v = local.y / Math.max(1, warp.height) + 0.5;
  if (u < 0 || u > 1 || v < 0 || v > 1) return point;
  const offset = sampleDeformerGroupWarpOffset(group, sourceRig, u, v);
  return transformLocalPointToCanvas({
    x: local.x + offset.dx,
    y: local.y + offset.dy
  }, transform);
}

function globalPointToTransformLocal(point, transform) {
  const dx = Number(point.x) - Number(transform.x);
  const dy = Number(point.y) - Number(transform.y);
  const cos = Math.cos(transform.rotation);
  const sin = Math.sin(transform.rotation);
  return {
    x: (cos * dx + sin * dy) / safeScale(transform.scaleX),
    y: (-sin * dx + cos * dy) / safeScale(transform.scaleY)
  };
}

function sampleDeformerGroupWarpOffset(group, sourceRig, u, v) {
  const warp = normalizeDeformerGroupWarp(group.warp || {}, group, sourceRig);
  const vertices = effectiveDeformerGroupWarpVertices(group, sourceRig);
  const x = clamp(u, 0, 1) * (warp.columns - 1);
  const y = clamp(v, 0, 1) * (warp.rows - 1);
  const left = Math.min(warp.columns - 2, Math.max(0, Math.floor(x)));
  const top = Math.min(warp.rows - 2, Math.max(0, Math.floor(y)));
  const tx = x - left;
  const ty = y - top;
  const topLeft = vertices[top * warp.columns + left] || {};
  const topRight = vertices[top * warp.columns + left + 1] || topLeft;
  const bottomLeft = vertices[(top + 1) * warp.columns + left] || topLeft;
  const bottomRight = vertices[(top + 1) * warp.columns + left + 1] || bottomLeft;
  const dxTop = Number(topLeft.dx || 0) + (Number(topRight.dx || 0) - Number(topLeft.dx || 0)) * tx;
  const dxBottom = Number(bottomLeft.dx || 0) + (Number(bottomRight.dx || 0) - Number(bottomLeft.dx || 0)) * tx;
  const dyTop = Number(topLeft.dy || 0) + (Number(topRight.dy || 0) - Number(topLeft.dy || 0)) * tx;
  const dyBottom = Number(bottomLeft.dy || 0) + (Number(bottomRight.dy || 0) - Number(bottomLeft.dy || 0)) * tx;
  return {
    dx: dxTop + (dxBottom - dxTop) * ty,
    dy: dyTop + (dyBottom - dyTop) * ty
  };
}

function drawImagePartMesh(context, image, mesh, anchorX, anchorY, sourceRig) {
  const vertices = effectiveMeshVertices(mesh, sourceRig);
  const columns = mesh.columns;
  const rows = mesh.rows;
  for (let row = 0; row < rows - 1; row += 1) {
    for (let column = 0; column < columns - 1; column += 1) {
      const topLeft = meshVertexAt(vertices, columns, rows, row, column, image, anchorX, anchorY);
      const topRight = meshVertexAt(vertices, columns, rows, row, column + 1, image, anchorX, anchorY);
      const bottomLeft = meshVertexAt(vertices, columns, rows, row + 1, column, image, anchorX, anchorY);
      const bottomRight = meshVertexAt(vertices, columns, rows, row + 1, column + 1, image, anchorX, anchorY);
      drawTexturedTriangle(context, image, topLeft, topRight, bottomRight);
      drawTexturedTriangle(context, image, topLeft, bottomRight, bottomLeft);
    }
  }
}

function drawImagePartWarped(context, image, part, transform, sourceRig, warpGroups) {
  const renderMesh = imagePartRenderMesh(part, image, transform, sourceRig);
  for (let row = 0; row < renderMesh.rows - 1; row += 1) {
    for (let column = 0; column < renderMesh.columns - 1; column += 1) {
      const topLeft = warpedImagePartVertex(renderMesh, row, column, transform, sourceRig, warpGroups);
      const topRight = warpedImagePartVertex(renderMesh, row, column + 1, transform, sourceRig, warpGroups);
      const bottomLeft = warpedImagePartVertex(renderMesh, row + 1, column, transform, sourceRig, warpGroups);
      const bottomRight = warpedImagePartVertex(renderMesh, row + 1, column + 1, transform, sourceRig, warpGroups);
      drawTexturedTriangle(context, image, topLeft, topRight, bottomRight);
      drawTexturedTriangle(context, image, topLeft, bottomRight, bottomLeft);
    }
  }
}

function imagePartRenderMesh(part, image, transform, sourceRig) {
  if (part.mesh?.enabled) {
    const mesh = normalizePartMesh(part);
    return {
      columns: mesh.columns,
      rows: mesh.rows,
      vertices: effectiveMeshVertices(mesh, sourceRig).map((vertex) => ({
        ...meshVertexAt([vertex], 1, 1, 0, 0, image, transform.anchorX, transform.anchorY)
      }))
    };
  }
  const columns = 6;
  const rows = 6;
  const vertices = createWarpGrid(columns, rows).vertices.map((vertex) => meshVertexAt([vertex], 1, 1, 0, 0, image, transform.anchorX, transform.anchorY));
  return { columns, rows, vertices };
}

function warpedImagePartVertex(renderMesh, row, column, transform, sourceRig, warpGroups) {
  const vertex = renderMesh.vertices[row * renderMesh.columns + column];
  let point = transformLocalPointToCanvas({ x: vertex.x, y: vertex.y }, transform);
  point = applyWarpGroupsToCanvasPoint(sourceRig, point, warpGroups);
  return {
    sx: vertex.sx,
    sy: vertex.sy,
    x: point.x,
    y: point.y
  };
}

function applyWarpedImagePartClip(context, image, part, transform, sourceRig, warpGroups) {
  const shape = normalizeImagePartClipShape(part.clipShape);
  if (shape === "none") return;
  const inset = clamp(part.clipInset ?? 0, 0, 0.45);
  const left = -image.naturalWidth * transform.anchorX + image.naturalWidth * inset;
  const top = -image.naturalHeight * transform.anchorY + image.naturalHeight * inset;
  const width = image.naturalWidth * Math.max(0.05, 1 - inset * 2);
  const height = image.naturalHeight * Math.max(0.05, 1 - inset * 2);
  const corners = [
    { x: left, y: top },
    { x: left + width, y: top },
    { x: left + width, y: top + height },
    { x: left, y: top + height }
  ].map((point) => applyWarpGroupsToCanvasPoint(sourceRig, transformLocalPointToCanvas(point, transform), warpGroups));
  context.beginPath();
  corners.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.closePath();
  context.clip();
}

function meshVertexAt(vertices, columns, rows, row, column, image, anchorX, anchorY) {
  const vertex = vertices[row * columns + column];
  const u = Number(vertex?.u ?? (columns <= 1 ? 0 : column / (columns - 1)));
  const v = Number(vertex?.v ?? (rows <= 1 ? 0 : row / (rows - 1)));
  const sx = u * image.naturalWidth;
  const sy = v * image.naturalHeight;
  return {
    sx,
    sy,
    x: sx - image.naturalWidth * anchorX + Number(vertex?.dx || 0),
    y: sy - image.naturalHeight * anchorY + Number(vertex?.dy || 0)
  };
}

function drawTexturedTriangle(context, image, p0, p1, p2) {
  const denominator = p0.sx * (p1.sy - p2.sy) + p1.sx * (p2.sy - p0.sy) + p2.sx * (p0.sy - p1.sy);
  if (Math.abs(denominator) < 0.00001) return;

  const a = (p0.x * (p1.sy - p2.sy) + p1.x * (p2.sy - p0.sy) + p2.x * (p0.sy - p1.sy)) / denominator;
  const b = (p0.y * (p1.sy - p2.sy) + p1.y * (p2.sy - p0.sy) + p2.y * (p0.sy - p1.sy)) / denominator;
  const c = (p0.x * (p2.sx - p1.sx) + p1.x * (p0.sx - p2.sx) + p2.x * (p1.sx - p0.sx)) / denominator;
  const d = (p0.y * (p2.sx - p1.sx) + p1.y * (p0.sx - p2.sx) + p2.y * (p1.sx - p0.sx)) / denominator;
  const e = (p0.x * (p1.sx * p2.sy - p2.sx * p1.sy) + p1.x * (p2.sx * p0.sy - p0.sx * p2.sy) + p2.x * (p0.sx * p1.sy - p1.sx * p0.sy)) / denominator;
  const f = (p0.y * (p1.sx * p2.sy - p2.sx * p1.sy) + p1.y * (p2.sx * p0.sy - p0.sx * p2.sy) + p2.y * (p0.sx * p1.sy - p1.sx * p0.sy)) / denominator;

  context.save();
  context.beginPath();
  context.moveTo(p0.x, p0.y);
  context.lineTo(p1.x, p1.y);
  context.lineTo(p2.x, p2.y);
  context.closePath();
  context.clip();
  context.transform(a, b, c, d, e, f);
  context.drawImage(image, 0, 0);
  context.restore();
}

function paramBindingValue(sourceRig, key) {
  if (!key) return 0;
  const def = allParameterDefs().find((param) => param.key === key);
  if (!def) return 0;
  const value = Number(sourceRig.params?.[key] || 0);
  if (def.min >= 0) {
    return (value - def.min) / Math.max(1, def.max - def.min);
  }
  return value / Math.max(Math.abs(def.min), Math.abs(def.max), 1);
}

function createPartMesh(part, columns = 3, rows = 3) {
  const cleanColumns = Math.round(clamp(columns, 2, 8));
  const cleanRows = Math.round(clamp(rows, 2, 8));
  const vertices = [];
  for (let row = 0; row < cleanRows; row += 1) {
    for (let column = 0; column < cleanColumns; column += 1) {
      vertices.push({
        u: cleanColumns <= 1 ? 0 : Number((column / (cleanColumns - 1)).toFixed(4)),
        v: cleanRows <= 1 ? 0 : Number((row / (cleanRows - 1)).toFixed(4)),
        dx: 0,
        dy: 0
      });
    }
  }
  return {
    enabled: true,
    editing: true,
    deformerParam: "angleX",
    deformers: [],
    columns: cleanColumns,
    rows: cleanRows,
    vertices
  };
}

function normalizePartMesh(part) {
  if (!part.mesh || typeof part.mesh !== "object") {
    part.mesh = createPartMesh(part, 3, 3);
  }
  const columns = Math.round(clamp(part.mesh.columns || 3, 2, 8));
  const rows = Math.round(clamp(part.mesh.rows || 3, 2, 8));
  const fallback = createPartMesh(part, columns, rows);
  const sourceVertices = Array.isArray(part.mesh.vertices) ? part.mesh.vertices : [];
  const vertices = fallback.vertices.map((vertex, index) => ({
    u: Number.isFinite(Number(sourceVertices[index]?.u)) ? Number(sourceVertices[index].u) : vertex.u,
    v: Number.isFinite(Number(sourceVertices[index]?.v)) ? Number(sourceVertices[index].v) : vertex.v,
    dx: Number.isFinite(Number(sourceVertices[index]?.dx)) ? Number(sourceVertices[index].dx) : 0,
    dy: Number.isFinite(Number(sourceVertices[index]?.dy)) ? Number(sourceVertices[index].dy) : 0
  }));
  const deformerParam = knownParameterKey(part.mesh.deformerParam) || "angleX";
  part.mesh = {
    enabled: part.mesh.enabled !== false,
    editing: part.mesh.editing !== false,
    deformerParam,
    deformers: normalizeMeshDeformers(part.mesh.deformers, vertices),
    columns,
    rows,
    vertices
  };
  return part.mesh;
}

function knownParameterKey(value) {
  const key = String(value || "");
  return allParameterDefs().some((param) => param.key === key) ? key : "";
}

function normalizeMeshDeformers(value, baseVertices) {
  const source = Array.isArray(value) ? value : [];
  const normalized = [];
  for (const deformer of source) {
    const parameter = knownParameterKey(deformer?.parameter);
    if (!parameter) continue;
    const keyframes = Array.isArray(deformer.keyframes)
      ? deformer.keyframes
        .map((keyframe) => ({
          value: Number(keyframe?.value),
          vertices: normalizeKeyframeVertices(keyframe?.vertices, baseVertices)
        }))
        .filter((keyframe) => Number.isFinite(keyframe.value))
        .sort((a, b) => a.value - b.value)
      : [];
    normalized.push({ parameter, keyframes });
  }
  return normalized;
}

function normalizeKeyframeVertices(value, baseVertices) {
  const source = Array.isArray(value) ? value : [];
  return baseVertices.map((vertex, index) => ({
    dx: Number.isFinite(Number(source[index]?.dx)) ? Number(source[index].dx) : Number(vertex.dx || 0),
    dy: Number.isFinite(Number(source[index]?.dy)) ? Number(source[index].dy) : Number(vertex.dy || 0)
  }));
}

function effectiveMeshVertices(mesh, sourceRig) {
  const base = mesh.vertices.map((vertex) => ({ ...vertex }));
  const effective = mesh.vertices.map((vertex) => ({ ...vertex }));
  for (const deformer of mesh.deformers || []) {
    const keyedVertices = interpolateMeshKeyframes(deformer, sourceRig);
    if (!keyedVertices) continue;
    for (let index = 0; index < effective.length; index += 1) {
      effective[index].dx = Number((effective[index].dx + (Number(keyedVertices[index]?.dx || 0) - Number(base[index]?.dx || 0))).toFixed(3));
      effective[index].dy = Number((effective[index].dy + (Number(keyedVertices[index]?.dy || 0) - Number(base[index]?.dy || 0))).toFixed(3));
    }
  }
  return effective;
}

function interpolateMeshKeyframes(deformer, sourceRig) {
  const keyframes = Array.isArray(deformer.keyframes)
    ? deformer.keyframes.filter((keyframe) => Array.isArray(keyframe.vertices)).slice().sort((a, b) => a.value - b.value)
    : [];
  if (keyframes.length === 0) return null;
  const value = Number(sourceRig.params?.[deformer.parameter] || 0);
  if (keyframes.length === 1 || value <= keyframes[0].value) return keyframes[0].vertices;
  const last = keyframes[keyframes.length - 1];
  if (value >= last.value) return last.vertices;
  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const left = keyframes[index];
    const right = keyframes[index + 1];
    if (value < left.value || value > right.value) continue;
    const amount = (value - left.value) / Math.max(0.0001, right.value - left.value);
    return left.vertices.map((vertex, vertexIndex) => ({
      dx: Number((Number(vertex.dx || 0) + (Number(right.vertices[vertexIndex]?.dx || 0) - Number(vertex.dx || 0)) * amount).toFixed(3)),
      dy: Number((Number(vertex.dy || 0) + (Number(right.vertices[vertexIndex]?.dy || 0) - Number(vertex.dy || 0)) * amount).toFixed(3))
    }));
  }
  return null;
}

function setMeshKeyframe(part) {
  const mesh = normalizePartMesh(part);
  const parameter = knownParameterKey(mesh.deformerParam) || "angleX";
  const value = Number(Number(rig.params?.[parameter] || 0).toFixed(3));
  let deformer = mesh.deformers.find((entry) => entry.parameter === parameter);
  if (!deformer) {
    deformer = { parameter, keyframes: [] };
    mesh.deformers.push(deformer);
  }
  const snapshot = mesh.vertices.map((vertex) => ({
    dx: Number(Number(vertex.dx || 0).toFixed(3)),
    dy: Number(Number(vertex.dy || 0).toFixed(3))
  }));
  const existingIndex = deformer.keyframes.findIndex((keyframe) => Math.abs(Number(keyframe.value) - value) < 0.001);
  const keyframe = { value, vertices: snapshot };
  if (existingIndex >= 0) deformer.keyframes[existingIndex] = keyframe;
  else deformer.keyframes.push(keyframe);
  deformer.keyframes.sort((a, b) => a.value - b.value);
  showToast(`Mesh key saved: ${parameter}=${value}`);
}

function setPartTransformKeyframe(part) {
  const parameter = knownParameterKey(part.transformKeyParam) || "angleX";
  part.transformKeyParam = parameter;
  const value = Number(Number(rig.params?.[parameter] || 0).toFixed(3));
  let deformer = normalizePartTransformDeformers(part).find((entry) => entry.parameter === parameter);
  if (!deformer) {
    deformer = { parameter, keyframes: [] };
    part.transformDeformers.push(deformer);
  }
  const snapshot = normalizePartTransformSnapshot(snapshotPartTransform(part, rig));
  const existingIndex = deformer.keyframes.findIndex((keyframe) => Math.abs(Number(keyframe.value) - value) < 0.001);
  const keyframe = { value, transform: snapshot };
  if (existingIndex >= 0) deformer.keyframes[existingIndex] = keyframe;
  else deformer.keyframes.push(keyframe);
  deformer.keyframes.sort((a, b) => a.value - b.value);
  showToast(`Transform key saved: ${parameter}=${value}`);
}

function setDrawOrderKeyframe(part) {
  const parameter = knownParameterKey(part.drawOrderKeyParam) || "angleX";
  part.drawOrderKeyParam = parameter;
  const value = Number(Number(rig.params?.[parameter] || 0).toFixed(3));
  let deformer = normalizeDrawOrderDeformers(part).find((entry) => entry.parameter === parameter);
  if (!deformer) {
    deformer = { parameter, keyframes: [] };
    part.drawOrderDeformers.push(deformer);
  }
  const keyframe = {
    value,
    order: Number(Number(part.order ?? 0).toFixed(3))
  };
  const existingIndex = deformer.keyframes.findIndex((entry) => Math.abs(Number(entry.value) - value) < 0.001);
  if (existingIndex >= 0) deformer.keyframes[existingIndex] = keyframe;
  else deformer.keyframes.push(keyframe);
  deformer.keyframes = normalizeDrawOrderKeyframes(deformer.keyframes);
  showToast(`Draw order key saved: ${parameter}=${value}`);
}

function setDeformerGroupKeyframe(group) {
  const parameter = knownParameterKey(group.parameter) || "angleX";
  group.parameter = parameter;
  const value = Number(Number(rig.params?.[parameter] || 0).toFixed(3));
  if (!Array.isArray(group.keyframes)) group.keyframes = [];
  const snapshot = normalizePartTransformSnapshot(snapshotDeformerGroupTransform(group, rig));
  const existingIndex = group.keyframes.findIndex((keyframe) => Math.abs(Number(keyframe.value) - value) < 0.001);
  const keyframe = { value, transform: snapshot };
  if (existingIndex >= 0) group.keyframes[existingIndex] = keyframe;
  else group.keyframes.push(keyframe);
  group.keyframes = normalizePartTransformKeyframes(group.keyframes);
  showToast(`Group key saved: ${parameter}=${value}`);
}

function setDeformerGroupWarpKeyframe(group) {
  group.warp = normalizeDeformerGroupWarp(group.warp || {}, group, rig);
  const parameter = knownParameterKey(group.parameter) || "angleX";
  group.parameter = parameter;
  const value = Number(Number(rig.params?.[parameter] || 0).toFixed(3));
  const snapshot = group.warp.vertices.map((vertex) => ({
    dx: Number(Number(vertex.dx || 0).toFixed(3)),
    dy: Number(Number(vertex.dy || 0).toFixed(3))
  }));
  const existingIndex = group.warp.keyframes.findIndex((keyframe) => Math.abs(Number(keyframe.value) - value) < 0.001);
  const keyframe = { value, vertices: snapshot };
  if (existingIndex >= 0) group.warp.keyframes[existingIndex] = keyframe;
  else group.warp.keyframes.push(keyframe);
  group.warp.keyframes = normalizeWarpKeyframes(group.warp.keyframes, group.warp.vertices);
  showToast(`Warp key saved: ${parameter}=${value}`);
}

function createTransformKeyframeList(part) {
  const parameter = knownParameterKey(part.transformKeyParam) || "angleX";
  const deformer = normalizePartTransformDeformers(part).find((entry) => entry.parameter === parameter);
  const keyframes = Array.isArray(deformer?.keyframes) ? deformer.keyframes : [];
  return createPartKeyframeList({
    emptyText: "No transform keys for selected parameter.",
    keyframes,
    labelForKeyframe: (keyframe) => {
      const transform = normalizePartTransformSnapshot(keyframe.transform);
      return `${formatKeyframeValue(keyframe.value)} · x ${formatCompactNumber(transform.x)} y ${formatCompactNumber(transform.y)} rot ${formatCompactNumber(transform.rotation)}`;
    },
    onLoad: (keyframe) => loadTransformKeyframe(part, parameter, keyframe),
    onDelete: (_keyframe, index) => deleteTransformKeyframe(part, parameter, index)
  });
}

function createDrawOrderKeyframeList(part) {
  const parameter = knownParameterKey(part.drawOrderKeyParam) || "angleX";
  const deformer = normalizeDrawOrderDeformers(part).find((entry) => entry.parameter === parameter);
  const keyframes = Array.isArray(deformer?.keyframes) ? deformer.keyframes : [];
  return createPartKeyframeList({
    emptyText: "No draw order keys for selected parameter.",
    keyframes,
    labelForKeyframe: (keyframe) => `${formatKeyframeValue(keyframe.value)} · order ${formatCompactNumber(keyframe.order)}`,
    onLoad: (keyframe) => loadDrawOrderKeyframe(part, parameter, keyframe),
    onDelete: (_keyframe, index) => deleteDrawOrderKeyframe(part, parameter, index)
  });
}

function createDeformerGroupKeyframeList(group) {
  const keyframes = normalizePartTransformKeyframes(group.keyframes || []);
  group.keyframes = keyframes;
  return createPartKeyframeList({
    emptyText: "No group keys for selected parameter.",
    keyframes,
    labelForKeyframe: (keyframe) => {
      const transform = normalizePartTransformSnapshot(keyframe.transform);
      return `${formatKeyframeValue(keyframe.value)} · x ${formatCompactNumber(transform.x)} y ${formatCompactNumber(transform.y)} rot ${formatCompactNumber(transform.rotation)}`;
    },
    onLoad: (keyframe) => loadDeformerGroupKeyframe(group, keyframe),
    onDelete: (_keyframe, index) => deleteDeformerGroupKeyframe(group, index)
  });
}

function createDeformerGroupWarpKeyframeList(group) {
  group.warp = normalizeDeformerGroupWarp(group.warp || {}, group, rig);
  return createPartKeyframeList({
    emptyText: "No warp keys for selected parameter.",
    keyframes: group.warp.keyframes,
    labelForKeyframe: (keyframe) => `${formatKeyframeValue(keyframe.value)} · ${Array.isArray(keyframe.vertices) ? keyframe.vertices.length : 0} warp vertices`,
    onLoad: (keyframe) => loadDeformerGroupWarpKeyframe(group, keyframe),
    onDelete: (_keyframe, index) => deleteDeformerGroupWarpKeyframe(group, index)
  });
}

function createMeshKeyframeList(part) {
  const mesh = normalizePartMesh(part);
  const parameter = knownParameterKey(mesh.deformerParam) || "angleX";
  const deformer = mesh.deformers.find((entry) => entry.parameter === parameter);
  const keyframes = Array.isArray(deformer?.keyframes) ? deformer.keyframes : [];
  return createPartKeyframeList({
    emptyText: "No mesh keys for selected parameter.",
    keyframes,
    labelForKeyframe: (keyframe) => `${formatKeyframeValue(keyframe.value)} · ${Array.isArray(keyframe.vertices) ? keyframe.vertices.length : 0} vertices`,
    onLoad: (keyframe) => loadMeshKeyframe(part, parameter, keyframe),
    onDelete: (_keyframe, index) => deleteMeshKeyframe(part, parameter, index)
  });
}

function createPartKeyframeList({ emptyText, keyframes, labelForKeyframe, onLoad, onDelete }) {
  const list = document.createElement("div");
  list.className = "part-keyframe-list";
  if (!Array.isArray(keyframes) || keyframes.length === 0) {
    const empty = document.createElement("div");
    empty.className = "part-keyframe-empty";
    empty.textContent = emptyText;
    list.append(empty);
    return list;
  }

  keyframes.forEach((keyframe, index) => {
    const row = document.createElement("div");
    row.className = "part-keyframe-row";
    const label = document.createElement("span");
    label.textContent = labelForKeyframe(keyframe, index);
    const loadButton = document.createElement("button");
    loadButton.type = "button";
    loadButton.textContent = ko("Load");
    loadButton.addEventListener("click", () => onLoad(keyframe, index));
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = ko("Delete");
    deleteButton.className = "danger-mini";
    deleteButton.addEventListener("click", () => onDelete(keyframe, index));
    row.append(label, loadButton, deleteButton);
    list.append(row);
  });
  return list;
}

function loadDeformerGroupKeyframe(group, keyframe) {
  const parameter = knownParameterKey(group.parameter) || "angleX";
  setRigParameterToKeyframeValue(parameter, keyframe.value);
  const transform = normalizePartTransformSnapshot(keyframe.transform);
  for (const [key] of imagePartTransformKeys) {
    if (Number.isFinite(Number(transform[key]))) group[key] = Number(transform[key]);
  }
  renderParameterControls();
  renderLayerControls();
  draw();
  commitHistory(`load deformer group key ${group.id}`);
}

function loadDeformerGroupWarpKeyframe(group, keyframe) {
  group.warp = normalizeDeformerGroupWarp(group.warp || {}, group, rig);
  const parameter = knownParameterKey(group.parameter) || "angleX";
  setRigParameterToKeyframeValue(parameter, keyframe.value);
  const vertices = normalizeKeyframeVertices(keyframe.vertices, group.warp.vertices);
  group.warp.vertices = group.warp.vertices.map((vertex, index) => ({
    ...vertex,
    dx: Number(Number(vertices[index]?.dx || 0).toFixed(3)),
    dy: Number(Number(vertices[index]?.dy || 0).toFixed(3))
  }));
  renderParameterControls();
  renderLayerControls();
  draw();
  commitHistory(`load deformer warp key ${group.id}`);
}

function deleteDeformerGroupKeyframe(group, index) {
  group.keyframes = normalizePartTransformKeyframes(group.keyframes || []);
  group.keyframes.splice(index, 1);
  renderLayerControls();
  draw();
  commitHistory(`delete deformer group key ${group.id}`);
}

function deleteDeformerGroupWarpKeyframe(group, index) {
  group.warp = normalizeDeformerGroupWarp(group.warp || {}, group, rig);
  group.warp.keyframes.splice(index, 1);
  renderLayerControls();
  draw();
  commitHistory(`delete deformer warp key ${group.id}`);
}

function loadTransformKeyframe(part, parameter, keyframe) {
  setRigParameterToKeyframeValue(parameter, keyframe.value);
  const transform = normalizePartTransformSnapshot(keyframe.transform);
  for (const [key] of imagePartTransformKeys) {
    if (Number.isFinite(Number(transform[key]))) part[key] = Number(transform[key]);
  }
  renderParameterControls();
  renderLayerControls();
  draw();
  commitHistory(`load transform key ${part.id}`);
}

function loadDrawOrderKeyframe(part, parameter, keyframe) {
  setRigParameterToKeyframeValue(parameter, keyframe.value);
  if (Number.isFinite(Number(keyframe.order))) {
    part.order = Number(Number(keyframe.order).toFixed(3));
  }
  renderParameterControls();
  renderLayerList();
  renderLayerControls();
  draw();
  commitHistory(`load draw order key ${part.id}`);
}

function loadMeshKeyframe(part, parameter, keyframe) {
  const mesh = normalizePartMesh(part);
  setRigParameterToKeyframeValue(parameter, keyframe.value);
  const vertices = normalizeKeyframeVertices(keyframe.vertices, mesh.vertices);
  mesh.vertices = mesh.vertices.map((vertex, index) => ({
    ...vertex,
    dx: Number(Number(vertices[index]?.dx || 0).toFixed(3)),
    dy: Number(Number(vertices[index]?.dy || 0).toFixed(3))
  }));
  renderParameterControls();
  renderLayerControls();
  draw();
  commitHistory(`load mesh key ${part.id}`);
}

function deleteTransformKeyframe(part, parameter, index) {
  const deformer = normalizePartTransformDeformers(part).find((entry) => entry.parameter === parameter);
  if (!deformer) return;
  deformer.keyframes.splice(index, 1);
  part.transformDeformers = normalizePartTransformDeformers(part).filter((entry) => entry.keyframes.length > 0);
  renderLayerControls();
  draw();
  commitHistory(`delete transform key ${part.id}`);
}

function deleteDrawOrderKeyframe(part, parameter, index) {
  const deformer = normalizeDrawOrderDeformers(part).find((entry) => entry.parameter === parameter);
  if (!deformer) return;
  deformer.keyframes.splice(index, 1);
  part.drawOrderDeformers = normalizeDrawOrderDeformers(part).filter((entry) => entry.keyframes.length > 0);
  renderLayerList();
  renderLayerControls();
  draw();
  commitHistory(`delete draw order key ${part.id}`);
}

function deleteMeshKeyframe(part, parameter, index) {
  const mesh = normalizePartMesh(part);
  const deformer = mesh.deformers.find((entry) => entry.parameter === parameter);
  if (!deformer) return;
  deformer.keyframes.splice(index, 1);
  mesh.deformers = mesh.deformers.filter((entry) => entry.keyframes.length > 0);
  renderLayerControls();
  draw();
  commitHistory(`delete mesh key ${part.id}`);
}

function setRigParameterToKeyframeValue(parameter, value) {
  const definition = allParameterDefs().find((entry) => entry.key === parameter);
  if (!definition) return;
  rig.params[parameter] = clamp(value, definition.min, definition.max);
}

function formatKeyframeValue(value) {
  return Number(value || 0).toFixed(2);
}

function formatCompactNumber(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "-";
  return Number(numberValue.toFixed(Math.abs(numberValue) < 10 ? 2 : 1)).toString();
}

function pointBounds(points) {
  if (!Array.isArray(points) || points.length === 0) return null;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const point of points) {
    const x = Number(point.x);
    const y = Number(point.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) return null;
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function transformKeySummary(part) {
  const parameter = knownParameterKey(part.transformKeyParam) || "angleX";
  const deformer = normalizePartTransformDeformers(part).find((entry) => entry.parameter === parameter);
  const keyValues = Array.isArray(deformer?.keyframes)
    ? deformer.keyframes.map((keyframe) => Number(keyframe.value).toFixed(0)).join(", ")
    : "";
  const current = Number(rig.params?.[parameter] || 0).toFixed(0);
  return keyValues
    ? `${parameter} current ${current} · keys ${keyValues}`
    : `${parameter} current ${current} · no keys`;
}

function drawOrderKeySummary(part) {
  const parameter = knownParameterKey(part.drawOrderKeyParam) || "angleX";
  const deformer = normalizeDrawOrderDeformers(part).find((entry) => entry.parameter === parameter);
  const keyValues = Array.isArray(deformer?.keyframes)
    ? deformer.keyframes.map((keyframe) => `${Number(keyframe.value).toFixed(0)}:${formatCompactNumber(keyframe.order)}`).join(", ")
    : "";
  const current = Number(rig.params?.[parameter] || 0).toFixed(0);
  const effectiveOrder = effectiveImagePartOrder(rig, part);
  return keyValues
    ? `${parameter} current ${current} · order ${formatCompactNumber(effectiveOrder)} · keys ${keyValues}`
    : `${parameter} current ${current} · order ${formatCompactNumber(effectiveOrder)} · no keys`;
}

function deformerGroupKeySummary(group) {
  const parameter = knownParameterKey(group.parameter) || "angleX";
  const keyValues = Array.isArray(group.keyframes)
    ? group.keyframes.map((keyframe) => Number(keyframe.value).toFixed(0)).join(", ")
    : "";
  const current = Number(rig.params?.[parameter] || 0).toFixed(0);
  return keyValues
    ? `${parameter} current ${current} · keys ${keyValues}`
    : `${parameter} current ${current} · no keys`;
}

function warpKeySummary(group) {
  group.warp = normalizeDeformerGroupWarp(group.warp || {}, group, rig);
  const parameter = knownParameterKey(group.parameter) || "angleX";
  const keyValues = Array.isArray(group.warp.keyframes)
    ? group.warp.keyframes.map((keyframe) => Number(keyframe.value).toFixed(0)).join(", ")
    : "";
  const current = Number(rig.params?.[parameter] || 0).toFixed(0);
  return keyValues
    ? `${parameter} current ${current} · warp keys ${keyValues}`
    : `${parameter} current ${current} · no warp keys`;
}

function meshKeySummary(mesh) {
  const parameter = knownParameterKey(mesh.deformerParam) || "angleX";
  const deformer = (mesh.deformers || []).find((entry) => entry.parameter === parameter);
  const keyValues = Array.isArray(deformer?.keyframes)
    ? deformer.keyframes.map((keyframe) => Number(keyframe.value).toFixed(0)).join(", ")
    : "";
  const current = Number(rig.params?.[parameter] || 0).toFixed(0);
  return keyValues
    ? `${parameter} current ${current} · keys ${keyValues}`
    : `${parameter} current ${current} · no keys`;
}

function drawParameterInfluenceOverlay(context) {
  if (!elements.showParameterInfluence?.checked) return;
  const parameter = elements.parameterInfluenceSelect?.value || "";
  if (!parameter) return;
  const entries = collectParameterInfluencedParts(parameter)
    .filter((entry) => imagePartVisibleInEditorPreview(rig, entry.part));
  if (entries.length === 0) return;

  context.save();
  context.font = "12px Inter, ui-sans-serif, system-ui, sans-serif";
  context.textBaseline = "top";
  for (const entry of entries) {
    const geometry = imagePartTransformGeometry(entry.part);
    if (!geometry) continue;
    drawParameterInfluencePartGeometry(context, geometry, entry);
  }
  context.restore();
}

function drawParameterInfluencePartGeometry(context, geometry, entry) {
  const inherited = entry.channels.includes("parent");
  const stroke = inherited ? "rgba(255, 211, 112, 0.9)" : "rgba(116, 199, 255, 0.95)";
  const fill = inherited ? "rgba(255, 211, 112, 0.12)" : "rgba(116, 199, 255, 0.13)";
  const labelFill = inherited ? "rgba(58, 42, 10, 0.92)" : "rgba(8, 33, 52, 0.92)";
  const labelText = inherited ? "#ffe8ad" : "#d8f0ff";

  context.beginPath();
  geometry.corners.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = stroke;
  context.lineWidth = inherited ? 1.4 : 2;
  context.setLineDash(inherited ? [5, 5] : []);
  context.stroke();
  context.setLineDash([]);

  const bounds = pointBounds(geometry.corners);
  if (!bounds) return;
  const channels = entry.channels.slice(0, 4).join(", ");
  const suffix = entry.channels.length > 4 ? "..." : "";
  const label = `${entry.part.label || entry.part.id} · ${channels}${suffix}`;
  const maxWidth = 220;
  const metrics = context.measureText(label);
  const paddingX = 7;
  const labelHeight = 20;
  const labelWidth = Math.min(maxWidth, metrics.width + paddingX * 2);
  const labelX = Math.max(8, Math.min(bounds.x, Number(rig.canvas?.width || 900) - labelWidth - 8));
  const labelY = Math.max(8, bounds.y - labelHeight - 5);
  context.fillStyle = labelFill;
  roundedRectPath(context, labelX, labelY, labelWidth, labelHeight, 7);
  context.fill();
  context.fillStyle = labelText;
  context.save();
  context.beginPath();
  context.rect(labelX + paddingX, labelY, labelWidth - paddingX * 2, labelHeight);
  context.clip();
  context.fillText(label, labelX + paddingX, labelY + 4);
  context.restore();
}

function drawHitAreaOverlay(context) {
  if (!elements.showHitAreas?.checked) return;
  const selectedPartId = selectedImagePart()?.id || "";
  const parts = sortedImagePartsForList()
    .filter((part) => normalizeImagePartHitArea(part).enabled && imagePartVisibleInEditorPreview(rig, part));
  if (parts.length === 0) return;

  context.save();
  context.font = "13px Inter, ui-sans-serif, system-ui, sans-serif";
  context.textBaseline = "top";
  for (const part of parts) {
    const hitArea = normalizeImagePartHitArea(part);
    const geometry = hitAreaBoundsForPart(rig, part);
    if (!geometry) continue;
    const selected = part.id === selectedPartId;
    drawHitAreaGeometry(context, geometry, hitArea, selected);
  }
  context.restore();
}

function drawHitAreaGeometry(context, geometry, hitArea, selected) {
  const stroke = selected ? "rgba(255, 180, 168, 0.94)" : "rgba(157, 204, 255, 0.82)";
  const fill = selected ? "rgba(255, 180, 168, 0.16)" : "rgba(106, 169, 255, 0.12)";
  const labelFill = selected ? "rgba(75, 39, 31, 0.92)" : "rgba(6, 26, 51, 0.9)";
  const labelText = selected ? "#ffd9d4" : "#d8ecff";

  if (Array.isArray(geometry.points) && geometry.points.length >= 3) {
    context.beginPath();
    geometry.points.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.closePath();
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = stroke;
    context.lineWidth = selected ? 2.4 : 1.6;
    context.setLineDash(selected ? [] : [7, 5]);
    context.stroke();
  }

  const bounds = geometry.bounds;
  if (!bounds) return;
  context.setLineDash([4, 4]);
  context.strokeStyle = stroke;
  context.lineWidth = selected ? 1.8 : 1.1;
  context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  context.setLineDash([]);

  const label = `${hitArea.label || hitArea.id} · ${hitArea.kind}`;
  const metrics = context.measureText(label);
  const paddingX = 7;
  const labelHeight = 21;
  const labelWidth = metrics.width + paddingX * 2;
  const labelX = Math.max(8, Math.min(bounds.x, Number(rig.canvas?.width || 900) - labelWidth - 8));
  const labelY = Math.max(8, bounds.y - labelHeight - 5);
  context.fillStyle = labelFill;
  roundedRectPath(context, labelX, labelY, labelWidth, labelHeight, 7);
  context.fill();
  context.fillStyle = labelText;
  context.fillText(label, labelX + paddingX, labelY + 4);
}

function drawSelectedImagePartTransformOverlay(context) {
  const part = selectedImagePart();
  if (!part) return;
  if (imagePartMutedByEditorSolo(rig, part, { editorPreview: true })) return;
  const geometry = imagePartTransformGeometry(part);
  if (!geometry) return;

  context.save();
  context.lineWidth = 1.8;
  const locked = part.locked === true;
  context.strokeStyle = locked ? "rgba(255, 211, 112, 0.9)" : "rgba(255, 180, 168, 0.92)";
  context.fillStyle = locked ? "rgba(255, 211, 112, 0.08)" : "rgba(255, 180, 168, 0.12)";
  context.beginPath();
  geometry.corners.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.closePath();
  context.fill();
  context.stroke();
  if (locked) {
    context.setLineDash([6, 5]);
    context.strokeStyle = "rgba(255, 211, 112, 0.72)";
    context.stroke();
    context.restore();
    return;
  }

  context.setLineDash([5, 5]);
  context.beginPath();
  context.moveTo(geometry.topMid.x, geometry.topMid.y);
  context.lineTo(geometry.rotateHandle.x, geometry.rotateHandle.y);
  context.stroke();
  context.setLineDash([]);

  context.fillStyle = "#ffd9d4";
  context.strokeStyle = "rgba(75, 39, 31, 0.9)";
  for (const handle of geometry.scaleHandles) {
    context.beginPath();
    context.rect(handle.x - 5, handle.y - 5, 10, 10);
    context.fill();
    context.stroke();
  }

  context.beginPath();
  context.arc(geometry.rotateHandle.x, geometry.rotateHandle.y, 7, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.strokeStyle = "rgba(255, 255, 255, 0.9)";
  context.lineWidth = 1.2;
  context.beginPath();
  context.moveTo(geometry.anchor.x - 7, geometry.anchor.y);
  context.lineTo(geometry.anchor.x + 7, geometry.anchor.y);
  context.moveTo(geometry.anchor.x, geometry.anchor.y - 7);
  context.lineTo(geometry.anchor.x, geometry.anchor.y + 7);
  context.stroke();
  context.restore();
}

function drawSelectedDeformerGroupOverlay(context) {
  const group = selectedDeformerGroup();
  if (!group) return;
  const partIds = new Set(normalizeDeformerGroupPartIds(group));
  const geometries = getImageParts()
    .filter((part) => partIds.has(part.id) && imagePartVisibleInEditorPreview(rig, part))
    .map((part) => imagePartTransformGeometry(part))
    .filter(Boolean);
  const bounds = pointBounds(geometries.flatMap((geometry) => geometry.corners));
  const transform = effectiveDeformerGroupTransform(rig, group);

  context.save();
  context.font = "12px Inter, ui-sans-serif, system-ui, sans-serif";
  context.textBaseline = "top";
  context.strokeStyle = "rgba(116, 199, 255, 0.95)";
  context.fillStyle = "rgba(116, 199, 255, 0.09)";
  context.lineWidth = 1.6;
  context.setLineDash([8, 5]);
  for (const geometry of geometries) {
    context.beginPath();
    geometry.corners.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.closePath();
    context.fill();
    context.stroke();
  }

  if (bounds) {
    context.setLineDash([]);
    context.lineWidth = 2;
    context.strokeStyle = "rgba(116, 199, 255, 0.95)";
    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  }

  context.setLineDash([]);
  context.strokeStyle = "rgba(216, 240, 255, 0.95)";
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(transform.x, transform.y, 12, 0, Math.PI * 2);
  context.moveTo(transform.x - 18, transform.y);
  context.lineTo(transform.x + 18, transform.y);
  context.moveTo(transform.x, transform.y - 18);
  context.lineTo(transform.x, transform.y + 18);
  context.stroke();

  drawDeformerGroupWarpOverlay(context, group);

  const label = `${group.label || group.id} · ${partIds.size} parts`;
  const paddingX = 7;
  const labelHeight = 21;
  const labelWidth = Math.min(240, context.measureText(label).width + paddingX * 2);
  const labelBaseX = bounds ? bounds.x : transform.x + 16;
  const labelBaseY = bounds ? bounds.y - labelHeight - 5 : transform.y + 16;
  const labelX = Math.max(8, Math.min(labelBaseX, Number(rig.canvas?.width || 900) - labelWidth - 8));
  const labelY = Math.max(8, Math.min(labelBaseY, Number(rig.canvas?.height || 1400) - labelHeight - 8));
  context.fillStyle = "rgba(8, 33, 52, 0.92)";
  roundedRectPath(context, labelX, labelY, labelWidth, labelHeight, 7);
  context.fill();
  context.fillStyle = "#d8f0ff";
  context.save();
  context.beginPath();
  context.rect(labelX + paddingX, labelY, labelWidth - paddingX * 2, labelHeight);
  context.clip();
  context.fillText(label, labelX + paddingX, labelY + 4);
  context.restore();
  context.restore();
}

function drawDeformerGroupWarpOverlay(context, group) {
  const geometry = deformerGroupWarpGridGeometry(group);
  if (!geometry) return;
  context.save();
  context.strokeStyle = "rgba(157, 204, 255, 0.82)";
  context.fillStyle = "#9dccff";
  context.lineWidth = 1.4;
  context.setLineDash([]);
  for (let row = 0; row < geometry.rows; row += 1) {
    context.beginPath();
    for (let column = 0; column < geometry.columns; column += 1) {
      const point = geometry.points[row * geometry.columns + column];
      if (!point) continue;
      if (column === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    }
    context.stroke();
  }
  for (let column = 0; column < geometry.columns; column += 1) {
    context.beginPath();
    for (let row = 0; row < geometry.rows; row += 1) {
      const point = geometry.points[row * geometry.columns + column];
      if (!point) continue;
      if (row === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    }
    context.stroke();
  }
  for (const point of geometry.points) {
    context.beginPath();
    context.arc(point.x, point.y, 5.5, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(6, 26, 51, 0.8)";
    context.stroke();
    context.strokeStyle = "rgba(157, 204, 255, 0.82)";
  }
  context.restore();
}

function imagePartTransformGeometry(part) {
  const image = imageForPath(part.path);
  if (!image || !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) return null;
  const transform = effectivePartTransform(rig, part);
  const localCorners = imagePartLocalCorners(image, transform);
  const corners = localCorners.map((point) => transformLocalPointToCanvas(point, transform));
  const topMid = midpoint(corners[0], corners[1]);
  const center = midpoint(midpoint(corners[0], corners[2]), midpoint(corners[1], corners[3]));
  const outward = normalizedVector({
    x: topMid.x - center.x,
    y: topMid.y - center.y
  }, { x: 0, y: -1 });
  const rotateHandle = {
    kind: "rotate",
    x: topMid.x + outward.x * 42,
    y: topMid.y + outward.y * 42
  };
  return {
    transform,
    corners,
    localCorners,
    topMid,
    center,
    anchor: { x: transform.x, y: transform.y },
    rotateHandle,
    scaleHandles: corners.map((point, index) => ({
      kind: "scale",
      cornerIndex: index,
      localPoint: localCorners[index],
      x: point.x,
      y: point.y
    })),
    handles: [
      rotateHandle,
      ...corners.map((point, index) => ({
        kind: "scale",
        cornerIndex: index,
        localPoint: localCorners[index],
        x: point.x,
        y: point.y
      }))
    ]
  };
}

function imagePartLocalCorners(image, transform) {
  const left = -image.naturalWidth * transform.anchorX;
  const top = -image.naturalHeight * transform.anchorY;
  const right = left + image.naturalWidth;
  const bottom = top + image.naturalHeight;
  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom }
  ];
}

function midpoint(a, b) {
  return {
    x: (Number(a.x) + Number(b.x)) * 0.5,
    y: (Number(a.y) + Number(b.y)) * 0.5
  };
}

function normalizedVector(vector, fallback) {
  const length = Math.hypot(vector.x, vector.y);
  if (length < 0.0001) return fallback;
  return {
    x: vector.x / length,
    y: vector.y / length
  };
}

function drawSelectedMeshOverlay(context) {
  const part = selectedImagePart();
  if (!part?.mesh?.enabled || part.mesh.editing === false) return;
  if (imagePartMutedByEditorSolo(rig, part, { editorPreview: true })) return;
  const image = imageForPath(part.path);
  if (!image || !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) return;

  const mesh = normalizePartMesh(part);
  const vertices = effectiveMeshVertices(mesh, rig);
  const transform = partCanvasTransform(rig, part);
  context.save();
  context.translate(transform.x, transform.y);
  context.rotate(transform.rotation);
  context.scale(transform.scaleX, transform.scaleY);
  context.lineWidth = 1.5 / Math.max(Math.abs(transform.scaleX), Math.abs(transform.scaleY), 0.1);
  context.strokeStyle = "rgba(157, 204, 255, 0.82)";
  context.fillStyle = "#9dccff";

  for (let row = 0; row < mesh.rows; row += 1) {
    context.beginPath();
    for (let column = 0; column < mesh.columns; column += 1) {
      const point = meshVertexAt(vertices, mesh.columns, mesh.rows, row, column, image, transform.anchorX, transform.anchorY);
      if (column === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    }
    context.stroke();
  }
  for (let column = 0; column < mesh.columns; column += 1) {
    context.beginPath();
    for (let row = 0; row < mesh.rows; row += 1) {
      const point = meshVertexAt(vertices, mesh.columns, mesh.rows, row, column, image, transform.anchorX, transform.anchorY);
      if (row === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    }
    context.stroke();
  }
  mesh.vertices.forEach((vertex, index) => {
    const column = index % mesh.columns;
    const row = Math.floor(index / mesh.columns);
    const point = meshVertexAt(vertices, mesh.columns, mesh.rows, row, column, image, transform.anchorX, transform.anchorY);
    context.beginPath();
    context.arc(point.x, point.y, 6 / Math.max(Math.abs(transform.scaleX), Math.abs(transform.scaleY), 0.1), 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(6, 26, 51, 0.8)";
    context.stroke();
    context.strokeStyle = "rgba(157, 204, 255, 0.82)";
  });
  context.restore();
}

function partCanvasTransform(sourceRig, part) {
  return effectivePartTransform(sourceRig, part);
}

function canvasPointerPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * canvas.width / Math.max(1, rect.width),
    y: (event.clientY - rect.top) * canvas.height / Math.max(1, rect.height)
  };
}

function globalToPartLocal(point, part) {
  const transform = partCanvasTransform(rig, part);
  const dx = point.x - transform.x;
  const dy = point.y - transform.y;
  const cos = Math.cos(transform.rotation);
  const sin = Math.sin(transform.rotation);
  return {
    x: (cos * dx + sin * dy) / (transform.scaleX || 1),
    y: (-sin * dx + cos * dy) / (transform.scaleY || 1)
  };
}

function imagePartsInPickOrder() {
  return [
    ...sortedImagePartsInSlot("front").reverse(),
    ...sortedImagePartsInSlot("back").reverse()
  ].filter((part) => part.locked !== true && !imagePartMutedByEditorSolo(rig, part, { editorPreview: true }));
}

function pickImagePartAtCanvasPoint(point) {
  for (const part of imagePartsInPickOrder()) {
    if (imagePartContainsCanvasPoint(rig, part, point, { editorPreview: true })) return part;
  }
  return null;
}

function imagePartContainsCanvasPoint(sourceRig, part, point, options = {}) {
  if (imagePartMutedByEditorSolo(sourceRig, part, options)) return false;
  const visibilityFactor = options.ignoreVisibility ? 1 : imagePartVisibilityFactor(sourceRig, part);
  if ((part.visible === false && !options.ignoreVisibility) || visibilityFactor <= 0.001) return false;
  const image = imageForPath(part.path);
  if (!image || !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) return false;

  const transform = effectivePartTransform(sourceRig, part);
  const localPoint = globalPointToPartLocal(point, transform);
  if (!localPointInsideImageClip(image, part, transform, localPoint)) return false;

  const hit = part.mesh?.enabled
    ? imagePartMeshContainsLocalPoint(sourceRig, part, image, transform, localPoint)
    : imagePartImageContainsLocalPoint(image, transform, localPoint);
  if (!hit) return false;

  if (options.checkMask !== false) {
    const maskPart = imagePartMaskPart(sourceRig, part);
    if (maskPart && !imagePartContainsCanvasPoint(sourceRig, maskPart, point, {
      checkMask: false,
      ignoreVisibility: true,
      ignoreEditorSolo: true,
      editorPreview: options.editorPreview
    })) {
      return false;
    }
  }
  return true;
}

function globalPointToPartLocal(point, transform) {
  const dx = point.x - transform.x;
  const dy = point.y - transform.y;
  const cos = Math.cos(transform.rotation);
  const sin = Math.sin(transform.rotation);
  return {
    x: (cos * dx + sin * dy) / safePartScale(transform.scaleX),
    y: (-sin * dx + cos * dy) / safePartScale(transform.scaleY)
  };
}

function safePartScale(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || Math.abs(numberValue) < 0.0001) return 1;
  return numberValue;
}

function localPointInsideImageClip(image, part, transform, point) {
  const shape = normalizeImagePartClipShape(part.clipShape);
  if (shape === "none") return true;
  const inset = clamp(part.clipInset ?? 0, 0, 0.45);
  const width = image.naturalWidth * Math.max(0.05, 1 - inset * 2);
  const height = image.naturalHeight * Math.max(0.05, 1 - inset * 2);
  const x = -image.naturalWidth * transform.anchorX + image.naturalWidth * inset;
  const y = -image.naturalHeight * transform.anchorY + image.naturalHeight * inset;
  if (point.x < x || point.x >= x + width || point.y < y || point.y >= y + height) return false;
  if (shape === "ellipse") {
    const rx = width * 0.5;
    const ry = height * 0.5;
    const nx = (point.x - (x + rx)) / Math.max(0.0001, rx);
    const ny = (point.y - (y + ry)) / Math.max(0.0001, ry);
    return nx * nx + ny * ny <= 1;
  }
  if (shape !== "rounded") return true;
  const radius = Math.min(width, height) * clamp(part.clipRadius ?? 0.12, 0, 0.5);
  const nearestX = Math.max(x + radius, Math.min(point.x, x + width - radius));
  const nearestY = Math.max(y + radius, Math.min(point.y, y + height - radius));
  return Math.hypot(point.x - nearestX, point.y - nearestY) <= radius;
}

function imagePartImageContainsLocalPoint(image, transform, point) {
  const left = -image.naturalWidth * transform.anchorX;
  const top = -image.naturalHeight * transform.anchorY;
  const sourceX = point.x - left;
  const sourceY = point.y - top;
  return imageAlphaAt(image, sourceX, sourceY) > 8;
}

function imagePartMeshContainsLocalPoint(sourceRig, part, image, transform, point) {
  const mesh = normalizePartMesh(part);
  const vertices = effectiveMeshVertices(mesh, sourceRig);
  for (let row = 0; row < mesh.rows - 1; row += 1) {
    for (let column = 0; column < mesh.columns - 1; column += 1) {
      const topLeft = meshVertexAt(vertices, mesh.columns, mesh.rows, row, column, image, transform.anchorX, transform.anchorY);
      const topRight = meshVertexAt(vertices, mesh.columns, mesh.rows, row, column + 1, image, transform.anchorX, transform.anchorY);
      const bottomLeft = meshVertexAt(vertices, mesh.columns, mesh.rows, row + 1, column, image, transform.anchorX, transform.anchorY);
      const bottomRight = meshVertexAt(vertices, mesh.columns, mesh.rows, row + 1, column + 1, image, transform.anchorX, transform.anchorY);
      if (meshTriangleContainsOpaquePoint(image, point, topLeft, topRight, bottomRight)) return true;
      if (meshTriangleContainsOpaquePoint(image, point, topLeft, bottomRight, bottomLeft)) return true;
    }
  }
  return false;
}

function meshTriangleContainsOpaquePoint(image, point, p0, p1, p2) {
  const weights = barycentricWeights(point, p0, p1, p2);
  if (!weights) return false;
  const sourceX = weights.a * p0.sx + weights.b * p1.sx + weights.c * p2.sx;
  const sourceY = weights.a * p0.sy + weights.b * p1.sy + weights.c * p2.sy;
  return imageAlphaAt(image, sourceX, sourceY) > 8;
}

function barycentricWeights(point, p0, p1, p2) {
  const denominator = (p1.y - p2.y) * (p0.x - p2.x) + (p2.x - p1.x) * (p0.y - p2.y);
  if (Math.abs(denominator) < 0.00001) return null;
  const a = ((p1.y - p2.y) * (point.x - p2.x) + (p2.x - p1.x) * (point.y - p2.y)) / denominator;
  const b = ((p2.y - p0.y) * (point.x - p2.x) + (p0.x - p2.x) * (point.y - p2.y)) / denominator;
  const c = 1 - a - b;
  const tolerance = -0.001;
  return a >= tolerance && b >= tolerance && c >= tolerance ? { a, b, c } : null;
}

function imageAlphaAt(image, sourceX, sourceY) {
  const x = Math.floor(Number(sourceX));
  const y = Math.floor(Number(sourceY));
  if (x < 0 || y < 0 || x >= image.naturalWidth || y >= image.naturalHeight) return 0;
  const cached = imageAlphaCache.get(image);
  if (cached?.failed) return 255;
  let context = cached?.context || null;
  if (!context) {
    const buffer = document.createElement("canvas");
    buffer.width = image.naturalWidth;
    buffer.height = image.naturalHeight;
    context = buffer.getContext("2d", { willReadFrequently: true });
    try {
      context.drawImage(image, 0, 0);
      imageAlphaCache.set(image, { context });
    } catch {
      imageAlphaCache.set(image, { failed: true });
      return 255;
    }
  }
  try {
    return context.getImageData(x, y, 1, 1).data[3];
  } catch {
    imageAlphaCache.set(image, { failed: true });
    return 255;
  }
}

function deformerGroupWarpGridGeometry(group) {
  group.warp = normalizeDeformerGroupWarp(group.warp || {}, group, rig);
  if (group.warp.enabled !== true) return null;
  const transform = effectiveDeformerGroupTransform(rig, group);
  const vertices = effectiveDeformerGroupWarpVertices(group, rig);
  const points = vertices.map((vertex, index) => {
    const column = index % group.warp.columns;
    const row = Math.floor(index / group.warp.columns);
    const u = Number.isFinite(Number(vertex.u)) ? Number(vertex.u) : (group.warp.columns <= 1 ? 0 : column / (group.warp.columns - 1));
    const v = Number.isFinite(Number(vertex.v)) ? Number(vertex.v) : (group.warp.rows <= 1 ? 0 : row / (group.warp.rows - 1));
    return {
      index,
      column,
      row,
      ...transformLocalPointToCanvas({
        x: (u - 0.5) * group.warp.width + Number(vertex.dx || 0),
        y: (v - 0.5) * group.warp.height + Number(vertex.dy || 0)
      }, transform)
    };
  });
  return {
    columns: group.warp.columns,
    rows: group.warp.rows,
    points
  };
}

function nearestDeformerGroupWarpVertex(group, point) {
  const geometry = deformerGroupWarpGridGeometry(group);
  if (!geometry) return null;
  let best = null;
  for (const vertex of geometry.points) {
    const distance = Math.hypot(point.x - vertex.x, point.y - vertex.y);
    if (!best || distance < best.distance) best = { index: vertex.index, distance };
  }
  return best && best.distance <= 18 ? best : null;
}

function nearestMeshVertex(part, point) {
  const image = imageForPath(part.path);
  if (!image || !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) return null;
  const mesh = normalizePartMesh(part);
  const vertices = effectiveMeshVertices(mesh, rig);
  const transform = partCanvasTransform(rig, part);
  const localPoint = globalToPartLocal(point, part);
  let best = null;
  mesh.vertices.forEach((vertex, index) => {
    const column = index % mesh.columns;
    const row = Math.floor(index / mesh.columns);
    const vertexPoint = meshVertexAt(vertices, mesh.columns, mesh.rows, row, column, image, transform.anchorX, transform.anchorY);
    const distance = Math.hypot(localPoint.x - vertexPoint.x, localPoint.y - vertexPoint.y);
    if (!best || distance < best.distance) {
      best = { index, distance };
    }
  });
  return best && best.distance <= 18 ? best : null;
}

function handleCanvasPointerDown(event) {
  if (startDeformerGroupWarpDrag(event)) return;
  if (startMeshVertexDrag(event)) return;
  if (startImagePartTransformDrag(event)) return;
  startImagePartDrag(event);
}

function handleCanvasPointerMove(event) {
  if (deformerGroupWarpDragState) {
    updateDeformerGroupWarpDrag(event);
    return;
  }
  if (meshDragState) {
    updateMeshVertexDrag(event);
    return;
  }
  if (imagePartTransformDragState) {
    updateImagePartTransformDrag(event);
    return;
  }
  updateImagePartDrag(event);
}

function handleCanvasPointerUp(event) {
  if (deformerGroupWarpDragState) {
    endDeformerGroupWarpDrag(event);
    return;
  }
  if (meshDragState) {
    endMeshVertexDrag(event);
    return;
  }
  if (imagePartTransformDragState) {
    endImagePartTransformDrag(event);
    return;
  }
  endImagePartDrag(event);
}

function selectImagePart(part) {
  const nextSelectionId = partSelectionId(part.id);
  if (selectedLayerId === nextSelectionId) return false;
  selectedLayerId = nextSelectionId;
  renderLayerList();
  renderLayerControls();
  draw();
  return true;
}

function pickImagePartTransformHandle(part, point) {
  const geometry = imagePartTransformGeometry(part);
  if (!geometry) return null;
  const handles = geometry.handles.slice().sort((a, b) => (a.kind === "rotate" ? -1 : 0) - (b.kind === "rotate" ? -1 : 0));
  return handles.find((handle) => Math.hypot(point.x - handle.x, point.y - handle.y) <= 16) || null;
}

function startImagePartTransformDrag(event) {
  if (event.button !== undefined && event.button !== 0) return false;
  const part = selectedImagePart();
  if (!part || part.locked === true) return false;
  const point = canvasPointerPoint(event);
  const handle = pickImagePartTransformHandle(part, point);
  if (!handle) return false;
  const startWorld = effectivePartTransform(rig, part);
  imagePartTransformDragState = {
    partId: part.id,
    handle,
    pointerStart: point,
    startLocal: localPartTransform(rig, part),
    startWorld,
    startPart: snapshotPartTransform(part, rig),
    startAngle: Math.atan2(point.y - startWorld.y, point.x - startWorld.x),
    moved: false
  };
  canvas.classList.add("dragging-part");
  canvas.setPointerCapture?.(event.pointerId);
  event.preventDefault();
  return true;
}

function updateImagePartTransformDrag(event) {
  if (!imagePartTransformDragState) return false;
  const part = getImageParts().find((entry) => entry.id === imagePartTransformDragState.partId);
  if (!part) return false;
  const point = canvasPointerPoint(event);
  if (!imagePartTransformDragState.moved && Math.hypot(
    point.x - imagePartTransformDragState.pointerStart.x,
    point.y - imagePartTransformDragState.pointerStart.y
  ) < 1) {
    event.preventDefault();
    return true;
  }
  imagePartTransformDragState.moved = true;
  const desiredWorld = imagePartTransformDragState.handle.kind === "rotate"
    ? desiredWorldTransformFromRotationHandle(imagePartTransformDragState, point, event)
    : desiredWorldTransformFromScaleHandle(imagePartTransformDragState, point, event);
  applyWorldTransformDragToPart(part, imagePartTransformDragState, desiredWorld);
  draw();
  event.preventDefault();
  return true;
}

function desiredWorldTransformFromRotationHandle(state, point, event) {
  const angle = Math.atan2(point.y - state.startWorld.y, point.x - state.startWorld.x);
  let delta = angle - state.startAngle;
  if (event.shiftKey) {
    const snap = Math.PI / 12;
    delta = Math.round(delta / snap) * snap;
  }
  return {
    ...state.startWorld,
    rotation: state.startWorld.rotation + delta
  };
}

function desiredWorldTransformFromScaleHandle(state, point, event) {
  const handlePoint = state.handle.localPoint || { x: 1, y: 1 };
  const dx = point.x - state.startWorld.x;
  const dy = point.y - state.startWorld.y;
  const cos = Math.cos(state.startWorld.rotation);
  const sin = Math.sin(state.startWorld.rotation);
  const rotated = {
    x: cos * dx + sin * dy,
    y: -sin * dx + cos * dy
  };
  let scaleX = Math.abs(handlePoint.x) > 0.0001
    ? rotated.x / handlePoint.x
    : state.startWorld.scaleX;
  let scaleY = Math.abs(handlePoint.y) > 0.0001
    ? rotated.y / handlePoint.y
    : state.startWorld.scaleY;
  if (event.shiftKey) {
    const ratioX = Math.abs(scaleX / safeScale(state.startWorld.scaleX));
    const ratioY = Math.abs(scaleY / safeScale(state.startWorld.scaleY));
    const ratio = Math.max(0.05, (ratioX + ratioY) * 0.5);
    scaleX = Math.sign(scaleX || state.startWorld.scaleX || 1) * Math.abs(state.startWorld.scaleX) * ratio;
    scaleY = Math.sign(scaleY || state.startWorld.scaleY || 1) * Math.abs(state.startWorld.scaleY) * ratio;
  }
  return {
    ...state.startWorld,
    scaleX: clampSignedScale(scaleX),
    scaleY: clampSignedScale(scaleY)
  };
}

function applyWorldTransformDragToPart(part, state, desiredWorld) {
  const parentId = normalizeImagePartParentId(part.parentPartId, part.id);
  const parent = parentId ? imagePartById(rig, parentId) : null;
  const desiredLocal = parent
    ? localTransformFromWorldTransform(effectivePartTransform(rig, parent), desiredWorld)
    : desiredWorld;
  applyLocalTransformDeltaToPart(part, state.startLocal, desiredLocal);
  part.scaleX = clampSignedScale(part.scaleX);
  part.scaleY = clampSignedScale(part.scaleY);
}

function clampSignedScale(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 1;
  const scale = clamp(numberValue, -3, 3);
  if (Math.abs(scale) < 0.05) return scale < 0 ? -0.05 : 0.05;
  return Number(scale.toFixed(4));
}

function endImagePartTransformDrag(event) {
  if (!imagePartTransformDragState) return false;
  const { partId, moved, handle } = imagePartTransformDragState;
  imagePartTransformDragState = null;
  canvas.classList.remove("dragging-part");
  canvas.releasePointerCapture?.(event.pointerId);
  if (moved) {
    renderLayerControls();
    commitHistory(`${handle.kind} image part ${partId}`);
  }
  event.preventDefault();
  return true;
}

function startImagePartDrag(event) {
  if (event.button !== undefined && event.button !== 0) return false;
  const point = canvasPointerPoint(event);
  const part = pickImagePartAtCanvasPoint(point);
  if (!part || part.locked === true) return false;
  selectImagePart(part);
  imagePartDragState = {
    partId: part.id,
    pointerStart: point,
    startLocal: localPartTransform(rig, part),
    startWorld: effectivePartTransform(rig, part),
    startPart: snapshotPartTransform(part, rig),
    moved: false
  };
  canvas.classList.add("dragging-part");
  canvas.setPointerCapture?.(event.pointerId);
  event.preventDefault();
  return true;
}

function updateImagePartDrag(event) {
  if (!imagePartDragState) return false;
  const part = getImageParts().find((entry) => entry.id === imagePartDragState.partId);
  if (!part) return false;
  const point = canvasPointerPoint(event);
  const dx = point.x - imagePartDragState.pointerStart.x;
  const dy = point.y - imagePartDragState.pointerStart.y;
  if (!imagePartDragState.moved && Math.hypot(dx, dy) < 1) {
    event.preventDefault();
    return true;
  }
  imagePartDragState.moved = true;
  const desiredWorld = snapWorldTransformToStageGrid({
    ...imagePartDragState.startWorld,
    x: imagePartDragState.startWorld.x + dx,
    y: imagePartDragState.startWorld.y + dy
  }, event);
  const parentId = normalizeImagePartParentId(part.parentPartId, part.id);
  const parent = parentId ? imagePartById(rig, parentId) : null;
  const desiredLocal = parent
    ? localTransformFromWorldTransform(effectivePartTransform(rig, parent), desiredWorld)
    : desiredWorld;
  part.x = Number((imagePartDragState.startPart.x + (desiredLocal.x - imagePartDragState.startLocal.x)).toFixed(3));
  part.y = Number((imagePartDragState.startPart.y + (desiredLocal.y - imagePartDragState.startLocal.y)).toFixed(3));
  draw();
  event.preventDefault();
  return true;
}

function endImagePartDrag(event) {
  if (!imagePartDragState) return false;
  const { partId, moved } = imagePartDragState;
  imagePartDragState = null;
  canvas.classList.remove("dragging-part");
  canvas.releasePointerCapture?.(event.pointerId);
  if (moved) {
    renderLayerControls();
    commitHistory(`move image part ${partId}`);
  }
  event.preventDefault();
  return true;
}

function startDeformerGroupWarpDrag(event) {
  if (event.button !== undefined && event.button !== 0) return false;
  const group = selectedDeformerGroup();
  if (!group) return false;
  group.warp = normalizeDeformerGroupWarp(group.warp || {}, group, rig);
  if (group.warp.enabled !== true || group.warp.editing === false) return false;
  const point = canvasPointerPoint(event);
  const nearest = nearestDeformerGroupWarpVertex(group, point);
  if (!nearest) return false;
  deformerGroupWarpDragState = {
    groupId: group.id,
    vertexIndex: nearest.index
  };
  canvas.classList.add("dragging-part");
  canvas.setPointerCapture?.(event.pointerId);
  event.preventDefault();
  return true;
}

function updateDeformerGroupWarpDrag(event) {
  if (!deformerGroupWarpDragState) return false;
  const group = getDeformerGroups().find((entry) => entry.id === deformerGroupWarpDragState.groupId);
  if (!group) return false;
  group.warp = normalizeDeformerGroupWarp(group.warp || {}, group, rig);
  const vertex = group.warp.vertices[deformerGroupWarpDragState.vertexIndex];
  if (!vertex) return false;
  const transform = effectiveDeformerGroupTransform(rig, group);
  const local = globalPointToTransformLocal(snapCanvasPointToStageGrid(canvasPointerPoint(event), event), transform);
  vertex.dx = Number((local.x - (Number(vertex.u || 0) - 0.5) * group.warp.width).toFixed(2));
  vertex.dy = Number((local.y - (Number(vertex.v || 0) - 0.5) * group.warp.height).toFixed(2));
  draw();
  event.preventDefault();
  return true;
}

function endDeformerGroupWarpDrag(event) {
  if (!deformerGroupWarpDragState) return false;
  const groupId = deformerGroupWarpDragState.groupId;
  deformerGroupWarpDragState = null;
  canvas.classList.remove("dragging-part");
  canvas.releasePointerCapture?.(event.pointerId);
  renderLayerControls();
  commitHistory(`warp deformer vertex ${groupId}`);
  event.preventDefault();
  return true;
}

function startMeshVertexDrag(event) {
  const part = selectedImagePart();
  if (!part?.mesh?.enabled || part.mesh.editing === false || part.locked === true) return false;
  const point = canvasPointerPoint(event);
  const nearest = nearestMeshVertex(part, point);
  if (!nearest) return false;
  meshDragState = {
    partId: part.id,
    vertexIndex: nearest.index
  };
  canvas.setPointerCapture?.(event.pointerId);
  event.preventDefault();
  return true;
}

function updateMeshVertexDrag(event) {
  if (!meshDragState) return;
  const part = getImageParts().find((entry) => entry.id === meshDragState.partId);
  const image = part ? imageForPath(part.path) : null;
  if (!part || !image || !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) return;
  const mesh = normalizePartMesh(part);
  const vertex = mesh.vertices[meshDragState.vertexIndex];
  if (!vertex) return;
  const transform = partCanvasTransform(rig, part);
  const point = globalToPartLocal(snapCanvasPointToStageGrid(canvasPointerPoint(event), event), part);
  vertex.dx = Number((point.x - (vertex.u * image.naturalWidth - image.naturalWidth * transform.anchorX)).toFixed(2));
  vertex.dy = Number((point.y - (vertex.v * image.naturalHeight - image.naturalHeight * transform.anchorY)).toFixed(2));
  draw();
  event.preventDefault();
}

function endMeshVertexDrag(event) {
  if (!meshDragState) return;
  const partId = meshDragState.partId;
  meshDragState = null;
  canvas.releasePointerCapture?.(event.pointerId);
  commitHistory(`mesh vertex ${partId}`);
}

function withLayer(context, sourceRig, id, pivotX, pivotY, drawLayer) {
  const layer = sourceRig.layers[id] || {};
  if (layer.visible === false) return;
  context.save();
  context.globalAlpha *= clamp(layer.opacity ?? 1, 0, 1);
  context.translate(pivotX + Number(layer.offsetX || 0), pivotY + Number(layer.offsetY || 0));
  context.rotate(Number(layer.rotation || 0) * Math.PI / 180);
  const scale = Math.max(0.05, Number(layer.scale || 1));
  context.scale(scale, scale);
  context.translate(-pivotX, -pivotY);
  drawLayer();
  context.restore();
}

function drawEyes(context, sourceRig, head) {
  const p = sourceRig.params;
  const palette = sourceRig.palette;
  const eyeOpen = clamp(p.eyeOpen ?? 88, 0, 100) / 100;
  const smile = normalized(p.smile);
  const angleX = normalized(p.angleX);
  const eyeHeight = Math.max(5, 42 * eyeOpen * (1 - Math.max(0, smile) * 0.32));
  const leftX = head.x - 68 + angleX * 28;
  const rightX = head.x + 68 + angleX * 28;
  const y = head.y - 26 + normalized(p.angleY) * 8;
  context.strokeStyle = palette.line;
  context.fillStyle = "#f8fbff";
  context.lineWidth = 7;
  drawEye(context, leftX, y, 54, eyeHeight, palette.eye, angleX);
  drawEye(context, rightX, y, 54, eyeHeight, palette.eye, angleX);
}

function drawEye(context, x, y, width, height, color, angleX) {
  context.save();
  context.beginPath();
  context.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.clip();
  context.fillStyle = color;
  context.beginPath();
  context.ellipse(x + angleX * 11, y + 2, Math.max(8, height * 0.72), Math.max(8, height * 0.92), 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#11151a";
  context.beginPath();
  context.ellipse(x + angleX * 14, y + 3, Math.max(5, height * 0.34), Math.max(5, height * 0.48), 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(255,255,255,0.86)";
  context.beginPath();
  context.ellipse(x + angleX * 10 - 8, y - height * 0.25, 7, 10, 0.2, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawBrows(context, sourceRig, head) {
  const p = sourceRig.params;
  const palette = sourceRig.palette;
  const brow = normalized(p.brow);
  const angleX = normalized(p.angleX);
  const y = head.y - 94 - brow * 20;
  context.strokeStyle = shade(palette.hair, -18);
  context.lineWidth = 10;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(head.x - 116 + angleX * 18, y + brow * 12);
  context.quadraticCurveTo(head.x - 72 + angleX * 24, y - 15, head.x - 28 + angleX * 20, y + brow * -8);
  context.moveTo(head.x + 28 + angleX * 20, y + brow * -8);
  context.quadraticCurveTo(head.x + 72 + angleX * 24, y - 15, head.x + 116 + angleX * 18, y + brow * 12);
  context.stroke();
}

function drawMouth(context, sourceRig, head) {
  const p = sourceRig.params;
  const palette = sourceRig.palette;
  const open = clamp(p.mouthOpen ?? 0, 0, 100) / 100;
  const smile = normalized(p.smile);
  const y = head.y + 96;
  context.strokeStyle = palette.mouth;
  context.fillStyle = hexToRgba(palette.mouth, 0.78);
  context.lineWidth = 8;
  context.lineCap = "round";
  if (open > 0.18) {
    context.beginPath();
    context.ellipse(head.x, y + smile * -10, 34 + open * 24, 10 + open * 42, 0, 0, Math.PI * 2);
    context.fill();
  }
  context.beginPath();
  context.moveTo(head.x - 46, y);
  context.quadraticCurveTo(head.x, y + 22 + smile * -56, head.x + 46, y);
  context.stroke();
}

function drawHairCap(context, head, hairSway, angleX) {
  context.beginPath();
  context.moveTo(head.x - 178, head.y - 72);
  context.quadraticCurveTo(head.x - 126, head.y - 240, head.x + 8, head.y - 236);
  context.quadraticCurveTo(head.x + 146, head.y - 228, head.x + 178, head.y - 70);
  context.quadraticCurveTo(head.x + 90, head.y - 118, head.x + 24, head.y - 74);
  context.quadraticCurveTo(head.x - 56, head.y - 132, head.x - 178, head.y - 72);
  context.closePath();
  context.fill();
  context.stroke();

  const strands = [
    [-94, -178, -134, -52, -52, -84],
    [-18, -214, -38, -42, 32, -88],
    [62, -194, 84, -42, 120, -82]
  ];
  context.fillStyle = shade(context.fillStyle, 14);
  for (const [sx, sy, cx, cy, ex, ey] of strands) {
    context.beginPath();
    context.moveTo(head.x + sx + angleX * -16, head.y + sy);
    context.quadraticCurveTo(head.x + cx + hairSway * 14, head.y + cy, head.x + ex + hairSway * 18, head.y + ey);
    context.quadraticCurveTo(head.x + cx + 16 + hairSway * 10, head.y + cy + 20, head.x + sx + 20, head.y + sy + 6);
    context.closePath();
    context.fill();
  }
}

function ellipse(context, x, y, radiusX, radiusY, rotation, fill, stroke) {
  context.beginPath();
  context.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);
  if (fill) context.fill();
  if (stroke) context.stroke();
}

function roundedRect(context, x, y, width, height, radius, fill, stroke) {
  roundedRectPath(context, x, y, width, height, radius);
  if (fill) context.fill();
  if (stroke) context.stroke();
}

function roundedRectPath(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function hexToRgba(hex, alpha) {
  const value = String(hex || "#000000").replace("#", "");
  const normalizedHex = value.length === 3
    ? value.split("").map((part) => `${part}${part}`).join("")
    : value.padEnd(6, "0").slice(0, 6);
  const intValue = Number.parseInt(normalizedHex, 16);
  const r = (intValue >> 16) & 255;
  const g = (intValue >> 8) & 255;
  const b = intValue & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shade(hex, amount) {
  const value = String(hex || "#000000").replace("#", "").padEnd(6, "0").slice(0, 6);
  const intValue = Number.parseInt(value, 16);
  const r = clamp(((intValue >> 16) & 255) + amount, 0, 255);
  const g = clamp(((intValue >> 8) & 255) + amount, 0, 255);
  const b = clamp((intValue & 255) + amount, 0, 255);
  return `#${[r, g, b].map((entry) => Math.round(entry).toString(16).padStart(2, "0")).join("")}`;
}

function rigForSave() {
  updateRigFromForm();
  return annotateHitAreaBounds(JSON.parse(JSON.stringify(rig)));
}

async function renderPngDataUrl(model) {
  const outputScale = Number(elements.outputScale.value || 1);
  const output = document.createElement("canvas");
  await preloadRigImages(model);
  annotateHitAreaBounds(model);
  draw(output, model, outputScale);
  return output.toDataURL("image/png");
}

function annotateHitAreaBounds(sourceRig) {
  const parts = Array.isArray(sourceRig.imageParts) ? sourceRig.imageParts : [];
  for (const part of parts) {
    const hitArea = normalizeImagePartHitArea(part);
    if (!hitArea.enabled) {
      part.hitArea = hitArea;
      continue;
    }
    const bounds = hitAreaBoundsForPart(sourceRig, part);
    if (bounds) {
      hitArea.bounds = bounds.bounds;
      hitArea.normalizedBounds = bounds.normalizedBounds;
      hitArea.points = bounds.points;
      hitArea.normalizedPoints = bounds.normalizedPoints;
    }
    part.hitArea = hitArea;
  }
  return sourceRig;
}

function hitAreaBoundsForPart(sourceRig, part) {
  const image = imageForPath(part.path);
  if (!image || !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) return null;
  const transform = effectivePartTransform(sourceRig, part);
  const localPoints = part.mesh?.enabled
    ? hitAreaLocalPointsFromMesh(sourceRig, part, image, transform)
    : hitAreaLocalPointsFromImage(image, transform);
  if (localPoints.length === 0) return null;
  const warpGroups = activeWarpGroupsForPart(sourceRig, part);
  const points = localPoints.map((point) => {
    const canvasPoint = transformLocalPointToCanvas(point, transform);
    return warpGroups.length > 0 ? applyWarpGroupsToCanvasPoint(sourceRig, canvasPoint, warpGroups) : canvasPoint;
  });
  const bounds = boundsFromPoints(points);
  if (!bounds) return null;
  const canvasWidth = Number(sourceRig.canvas?.width || 900);
  const canvasHeight = Number(sourceRig.canvas?.height || 1400);
  return {
    bounds,
    normalizedBounds: normalizeBoundsToCanvas(bounds, canvasWidth, canvasHeight),
    points: points.map(roundPoint),
    normalizedPoints: points.map((point) => ({
      x: round4(point.x / Math.max(1, canvasWidth)),
      y: round4(point.y / Math.max(1, canvasHeight))
    }))
  };
}

function hitAreaLocalPointsFromImage(image, transform) {
  const left = -image.naturalWidth * transform.anchorX;
  const top = -image.naturalHeight * transform.anchorY;
  const right = left + image.naturalWidth;
  const bottom = top + image.naturalHeight;
  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom }
  ];
}

function hitAreaLocalPointsFromMesh(sourceRig, part, image, transform) {
  const mesh = normalizePartMesh(part);
  return effectiveMeshVertices(mesh, sourceRig).map((vertex) => ({
    x: Number(vertex.u || 0) * image.naturalWidth - image.naturalWidth * transform.anchorX + Number(vertex.dx || 0),
    y: Number(vertex.v || 0) * image.naturalHeight - image.naturalHeight * transform.anchorY + Number(vertex.dy || 0)
  }));
}

function transformLocalPointToCanvas(point, transform) {
  const scaledX = point.x * transform.scaleX;
  const scaledY = point.y * transform.scaleY;
  const cos = Math.cos(transform.rotation);
  const sin = Math.sin(transform.rotation);
  return {
    x: transform.x + scaledX * cos - scaledY * sin,
    y: transform.y + scaledX * sin + scaledY * cos
  };
}

function boundsFromPoints(points) {
  if (!Array.isArray(points) || points.length === 0) return null;
  const xs = points.map((point) => Number(point.x)).filter(Number.isFinite);
  const ys = points.map((point) => Number(point.y)).filter(Number.isFinite);
  if (xs.length === 0 || ys.length === 0) return null;
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  if (maxX <= minX || maxY <= minY) return null;
  return {
    x: round4(minX),
    y: round4(minY),
    width: round4(maxX - minX),
    height: round4(maxY - minY)
  };
}

function normalizeBoundsToCanvas(bounds, canvasWidth, canvasHeight) {
  return {
    x: round4(bounds.x / Math.max(1, canvasWidth)),
    y: round4(bounds.y / Math.max(1, canvasHeight)),
    width: round4(bounds.width / Math.max(1, canvasWidth)),
    height: round4(bounds.height / Math.max(1, canvasHeight))
  };
}

function roundPoint(point) {
  return {
    x: round4(point.x),
    y: round4(point.y)
  };
}

function round4(value) {
  return Number(Number(value || 0).toFixed(4));
}

async function savePortrait() {
  if (!currentCharacter?.id) {
    showToast("Select or create a character first.");
    return;
  }
  if (!ensureRigCanExport("saving the portrait")) return;
  elements.savePortrait.disabled = true;
  try {
    const model = rigForSave();
    const result = await requestJson(`/api/characters/${encodeURIComponent(currentCharacter.id)}/portraitRig-portrait`, {
      method: "POST",
      body: JSON.stringify({
        state: model.portrait.state,
        imageDataUrl: await renderPngDataUrl(model),
        model,
        center: model.portrait.center,
        profile: model.portrait.profile
      })
    });
    currentCharacter = result.data;
    await loadCharacters(currentCharacter.id);
    showToast(`Saved ${result.imagePath} · ${formatImportStatus(result.importStatus)}`);
  } catch (error) {
    showToast(error.message);
  } finally {
    elements.savePortrait.disabled = false;
  }
}

function formatImportStatus(status) {
  if (!status) return "Godot import not checked";
  if (status.ok) return "Godot import complete";
  if (status.skipped) return "Godot import skipped";
  return `Godot import pending: ${status.error || "bridge unavailable"}`;
}

async function exportRig() {
  if (!ensureRigCanExport("exporting the rig")) return;
  const model = rigForSave();
  await preloadRigImages(model);
  annotateHitAreaBounds(model);
  downloadJson(
    `${safeSegment(rig.character.displayName, "character")}.${safeSegment(rig.portrait.state, "default")}.portrait-rig.json`,
    model
  );
}

async function exportProjectBundle() {
  updateRigFromForm();
  const model = rigForSave();
  await preloadRigImages(model);
  annotateHitAreaBounds(model);
  const assets = await imagePartProjectAssets(model);
  downloadJson(
    `${safeSegment(rig.character.displayName, "character")}.${safeSegment(rig.portrait.state, "default")}.portrait-rig-project.json`,
    {
      app: "tools/portrait-rig-editor",
      kind: "portrait_rig_web_project",
      version: 1,
      exportedAt: new Date().toISOString(),
      character: {
        id: rig.character.id || currentCharacter?.id || "",
        displayName: rig.character.displayName || "",
        portraitState: rig.portrait.state || "default"
      },
      rig: model,
      layerManifest: imagePartLayerManifest(model),
      assets
    }
  );
  showToast(`Exported project bundle: ${assets.length} image asset${assets.length === 1 ? "" : "s"}.`);
}

async function exportLayerManifest() {
  updateRigFromForm();
  const model = rigForSave();
  await preloadRigImages(model);
  downloadJson(
    `${safeSegment(rig.character.displayName, "character")}.${safeSegment(rig.portrait.state, "default")}.layers.json`,
    imagePartLayerManifest(model)
  );
  showToast(`Exported layer manifest: ${(model.imageParts || []).length} part${(model.imageParts || []).length === 1 ? "" : "s"}.`);
}

function imagePartLayerManifest(model) {
  const sourceModel = model && typeof model === "object" && !Array.isArray(model) ? model : rig;
  const parts = Array.isArray(sourceModel.imageParts) ? sourceModel.imageParts : [];
  return {
    app: "tools/portrait-rig-editor",
    kind: "portrait_rig_web_layer_manifest",
    version: 1,
    exportedAt: new Date().toISOString(),
    canvas: {
      width: Number(sourceModel.canvas?.width || rig.canvas.width || 900),
      height: Number(sourceModel.canvas?.height || rig.canvas.height || 1400),
      coordinateSpace: "pixels"
    },
    character: {
      id: sourceModel.character?.id || rig.character.id || currentCharacter?.id || "",
      displayName: sourceModel.character?.displayName || rig.character.displayName || "",
      portraitState: sourceModel.portrait?.state || rig.portrait.state || "default"
    },
    layers: parts.map((part, index) => imagePartLayerManifestRecord(part, index))
  };
}

function imagePartLayerManifestRecord(part, index) {
  const path = String(part.path || "");
  const record = {
    id: part.id || `image_part_${index + 1}`,
    label: part.label || part.id || `Image Part ${index + 1}`,
    file: imagePartLayerFileName(path, part),
    sourcePath: path,
    slot: part.slot === "back" ? "back" : "front",
    order: Number.isFinite(Number(part.order)) ? Number(part.order) : index,
    visible: part.visible !== false,
    locked: part.locked === true,
    opacity: clamp(Number(part.opacity ?? 1), 0, 1),
    blendMode: normalizeImagePartBlendMode(part.blendMode),
    clipShape: normalizeImagePartClipShape(part.clipShape),
    clipInset: clamp(Number(part.clipInset ?? 0), 0, 0.45),
    clipRadius: clamp(Number(part.clipRadius ?? 0.12), 0, 0.5),
    x: Number(Number(part.x ?? rig.canvas.width * 0.5).toFixed(3)),
    y: Number(Number(part.y ?? rig.canvas.height * 0.5).toFixed(3)),
    scaleX: Number(Number(part.scaleX ?? 1).toFixed(4)),
    scaleY: Number(Number(part.scaleY ?? 1).toFixed(4)),
    rotation: Number(Number(part.rotation ?? 0).toFixed(3)),
    anchorX: clamp(Number(part.anchorX ?? 0.5), 0, 1),
    anchorY: clamp(Number(part.anchorY ?? 0.5), 0, 1),
    bindings: imagePartLayerManifestBindings(part)
  };
  if (part.parentPartId) record.parent = part.parentPartId;
  if (part.clipPartId) record.clipMask = part.clipPartId;
  const bounds = imagePartLayerManifestBounds(part);
  if (bounds) record.bounds = bounds;
  const visibilityGate = normalizeImagePartVisibilityGate(part);
  if (visibilityGate.enabled) record.visibilityGate = visibilityGate;
  const hitArea = normalizeImagePartHitArea(part);
  if (hitArea.enabled) record.hitArea = hitArea;
  if (part.transformKeyParam) record.transformKeyParam = part.transformKeyParam;
  if (Array.isArray(part.transformDeformers) && part.transformDeformers.length > 0) {
    record.transformDeformers = JSON.parse(JSON.stringify(part.transformDeformers));
  }
  if (part.drawOrderKeyParam) record.drawOrderKeyParam = part.drawOrderKeyParam;
  if (Array.isArray(part.drawOrderDeformers) && part.drawOrderDeformers.length > 0) {
    record.drawOrderDeformers = JSON.parse(JSON.stringify(part.drawOrderDeformers));
  }
  if (part.mesh?.enabled) record.mesh = JSON.parse(JSON.stringify(part.mesh));
  return record;
}

function imagePartLayerFileName(path, part) {
  const filename = String(path || "").replace(/\\/g, "/").split("/").pop();
  if (filename) return filename;
  return `${safeSegment(part?.label || part?.id || "image_part", "image_part")}.png`;
}

function imagePartLayerManifestBindings(part) {
  const bindings = {};
  for (const [field, strengthField] of imagePartBindingFields) {
    const parameter = String(part[field] || "").trim();
    const strength = Number(part[strengthField] || 0);
    if (!parameter && Math.abs(strength) <= 0.0001) continue;
    bindings[field] = parameter;
    bindings[strengthField] = Number(strength.toFixed(4));
  }
  return bindings;
}

function imagePartLayerManifestBounds(part) {
  const image = imageForPath(part.path || "");
  if (!image || !image.naturalWidth || !image.naturalHeight) return null;
  const width = Math.abs(Number(part.scaleX ?? 1)) * image.naturalWidth;
  const height = Math.abs(Number(part.scaleY ?? 1)) * image.naturalHeight;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  const x = Number(part.x ?? rig.canvas.width * 0.5) - width * clamp(Number(part.anchorX ?? 0.5), 0, 1);
  const y = Number(part.y ?? rig.canvas.height * 0.5) - height * clamp(Number(part.anchorY ?? 0.5), 0, 1);
  return {
    x: Number(x.toFixed(3)),
    y: Number(y.toFixed(3)),
    width: Number(width.toFixed(3)),
    height: Number(height.toFixed(3))
  };
}

async function imagePartProjectAssets(model) {
  const parts = Array.isArray(model.imageParts) ? model.imageParts : [];
  const assets = [];
  for (const part of parts) {
    const path = String(part.path || "").trim();
    if (!path) continue;
    assets.push({
      partId: safeSegment(part.id || part.label || "part", "part"),
      label: String(part.label || part.id || "part"),
      path,
      dataUrl: await resAssetToDataUrl(path)
    });
  }
  return assets;
}

async function resAssetToDataUrl(resPath) {
  const response = await fetch(resPathToRepoUrl(resPath), { cache: "no-store" });
  if (!response.ok) throw new Error(`Project asset could not be read: ${resPath}`);
  return blobToDataUrl(await response.blob());
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Blob could not be read."));
    reader.readAsDataURL(blob);
  });
}

async function importRig(file) {
  if (!file) return;
  stopMotionPlayback(false);
  const imported = JSON.parse(await file.text());
  rig = mergeImportedRig(imported);
  if (currentCharacter?.id) {
    rig.character.id = currentCharacter.id;
    rig.character.displayName = currentCharacter.display_name || rig.character.displayName;
    rig.character.nameColor = currentCharacter.name_color || rig.character.nameColor;
  }
  syncFormFromRig();
  draw();
  resetHistory("import");
}

async function importProjectBundle(file) {
  if (!file) return;
  if (!currentCharacter?.id) {
    showToast("Select or create a character before importing a project.");
    return;
  }
  stopMotionPlayback(false);
  const bundle = JSON.parse(await file.text());
  const model = projectBundleRig(bundle);
  if (!model) {
    showToast("No rig found in project bundle.");
    return;
  }
  const restoredModel = await restoreProjectBundleAssets(bundle, model);
  rig = mergeImportedRig(restoredModel);
  rig.character.id = currentCharacter.id;
  rig.character.displayName = currentCharacter.display_name || rig.character.displayName;
  rig.character.nameColor = currentCharacter.name_color || rig.character.nameColor;
  syncFormFromRig();
  updateUrlForSelection();
  draw();
  resetHistory("project import");
  showToast(`Project imported: ${getImageParts().length} image part${getImageParts().length === 1 ? "" : "s"}.`);
}

function projectBundleRig(bundle) {
  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) return null;
  if (bundle.kind === "portrait_rig_web_project" && bundle.rig && typeof bundle.rig === "object" && !Array.isArray(bundle.rig)) {
    return JSON.parse(JSON.stringify(bundle.rig));
  }
  if (bundle.model && typeof bundle.model === "object" && !Array.isArray(bundle.model)) {
    return JSON.parse(JSON.stringify(bundle.model));
  }
  if (Array.isArray(bundle.imageParts) || Array.isArray(bundle.parts)) {
    return JSON.parse(JSON.stringify(bundle));
  }
  return null;
}

async function restoreProjectBundleAssets(bundle, model) {
  const assets = projectBundleAssets(bundle);
  if (assets.length === 0) return model;
  const parts = Array.isArray(model.imageParts) ? model.imageParts : [];
  for (const asset of assets) {
    const partId = safeSegment(asset.partId || asset.part_id || asset.id || "", "");
    const dataUrl = String(asset.dataUrl || asset.data_url || "").trim();
    if (!partId || !dataUrl) continue;
    const result = await requestJson(`/api/characters/${encodeURIComponent(currentCharacter.id)}/portraitRig-part`, {
      method: "POST",
      body: JSON.stringify({
        partId,
        label: String(asset.label || asset.name || partId),
        dataUrl
      })
    });
    for (const part of parts) {
      if (part.id === partId) part.path = result.path;
    }
  }
  return model;
}

function projectBundleAssets(bundle) {
  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) return [];
  if (Array.isArray(bundle.assets)) return bundle.assets;
  if (Array.isArray(bundle.imageAssets)) return bundle.imageAssets;
  if (Array.isArray(bundle.image_assets)) return bundle.image_assets;
  return [];
}

async function loadCurrentPortraitRig() {
  if (!currentCharacter?.id) {
    showToast("Select or create a character first.");
    return;
  }
  stopMotionPlayback(false);
  updateRigFromForm();
  const state = safeSegment(elements.portraitState.value || rig.portrait.state || "default", "default");
  const modelPath = findSavedRigModelPath(currentCharacter, state, false);
  if (!modelPath) {
    showToast(`No saved rig for portrait state: ${state}`);
    return;
  }
  const imported = await requestJson(resPathToRepoUrl(modelPath));
  rig = mergeImportedRig(imported);
  rig.character.id = currentCharacter.id;
  rig.character.displayName = currentCharacter.display_name || rig.character.displayName;
  rig.character.nameColor = currentCharacter.name_color || rig.character.nameColor;
  rig.portrait.state = state;
  syncFormFromRig();
  updateUrlForSelection();
  draw();
  resetHistory(`load ${state}`);
  showToast(`Loaded rig: ${modelPath}`);
}

async function selectExistingPortraitState() {
  const state = safeSegment(elements.portraitStateSelect.value || "", "");
  if (!state) return;
  stopMotionPlayback(false);
  elements.portraitState.value = state;
  updateRigFromForm();
  updateUrlForSelection();
  renderPortraitStateOptions(state);
  const modelPath = currentCharacter ? findSavedRigModelPath(currentCharacter, state, false) : "";
  if (!modelPath) {
    showToast(`Selected portrait state: ${state}`);
    draw();
    commitHistory(`select portrait ${state}`);
    return;
  }
  await loadCurrentPortraitRig();
}

function mergeImportedRig(imported) {
  const base = createDefaultRig(currentCharacter || {});
  const customParameters = normalizeCustomParameters(imported.customParameters || imported.parameters || []);
  const previousRig = rig;
  rig = { ...base, customParameters };
  const merged = {
    ...base,
    ...imported,
    canvas: { ...base.canvas, ...(imported.canvas || {}) },
    character: { ...base.character, ...(imported.character || {}) },
    portrait: { ...base.portrait, ...(imported.portrait || {}) },
    customParameters,
    palette: { ...base.palette, ...(imported.palette || {}) },
    params: { ...base.params, ...(imported.params || {}) },
    layers: {
      ...base.layers,
      ...(imported.layers || {})
    },
    imageParts: normalizeImageParts(imported.imageParts || imported.parts || []),
    deformerGroups: normalizeDeformerGroups(imported.deformerGroups || imported.deformers || [], {
      ...base,
      imageParts: normalizeImageParts(imported.imageParts || imported.parts || [])
    }),
    expressionPresets: normalizeExpressionPresets(imported.expressionPresets || imported.expressions || []),
    motionClips: normalizeMotionClips(imported.motionClips || imported.motions || []),
    adaptivePose: normalizeAdaptivePoseSettings(imported.adaptivePose || imported.adaptive_pose || base.adaptivePose),
    physics: normalizePhysics(imported.physics || imported.physicsSettings || base.physics)
  };
  rig = previousRig;
  return merged;
}

function getAdaptivePoseSettings() {
  rig.adaptivePose = normalizeAdaptivePoseSettings(rig.adaptivePose);
  return rig.adaptivePose;
}

function normalizeAdaptivePoseSettings(value) {
  const fallback = defaultAdaptivePoseSettings();
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
  const disabledSource = source.disabledParameters || source.disabled_parameters || source.excludedParameters || [];
  const disabledParameters = [];
  for (const rawKey of Array.isArray(disabledSource) ? disabledSource : []) {
    const key = knownParameterKey(rawKey);
    if (key && !disabledParameters.includes(key)) disabledParameters.push(key);
  }
  return {
    intensity: Number(clamp(Number(source.intensity ?? source.energy ?? fallback.intensity), 0.25, 2).toFixed(2)),
    disabledParameters
  };
}

function normalizeCustomParameters(value) {
  const source = Array.isArray(value) ? value : [];
  const seen = new Set(parameterDefs.map((param) => param.key));
  const params = [];
  for (const entry of source) {
    const param = normalizeCustomParameter(entry);
    if (!param.key || seen.has(param.key)) continue;
    seen.add(param.key);
    params.push(param);
  }
  return params;
}

function normalizeExpressionPresets(value) {
  const source = Array.isArray(value) ? value : [];
  return source
    .map((preset, index) => {
      if (!preset || typeof preset !== "object" || Array.isArray(preset)) return null;
      return {
        id: safeSegment(preset.id || preset.label || `expression_${index + 1}`, `expression_${index + 1}`),
        label: String(preset.label || preset.name || preset.id || `Expression ${index + 1}`),
        params: normalizePresetParams(preset.params || preset.parameterValues || preset.parameter_values || {}),
        meshes: normalizePresetMeshes(preset.meshes || preset.meshSnapshots || []),
        autoGenerated: preset.autoGenerated === true || preset.auto_generated === true,
        autoExpressionKind: safeSegment(preset.autoExpressionKind || preset.auto_expression_kind || preset.kind || "", ""),
        poseTags: normalizePresetPoseTags(preset.poseTags || preset.pose_tags || []),
        poseScore: normalizePresetPoseScore(preset.poseScore || preset.pose_score || {})
      };
    })
    .filter(Boolean);
}

function normalizeMotionClips(value) {
  const source = Array.isArray(value) ? value : [];
  const clips = [];
  for (const [index, clip] of source.entries()) {
    const baseId = safeSegment(clip?.id || clip?.label || clip?.name || `motion_${index + 1}`, `motion_${index + 1}`);
    const id = uniqueMotionClipId(baseId, clips);
    const duration = clamp(Number.isFinite(Number(clip?.duration)) ? Number(clip.duration) : 2, 0.1, 30);
    const rawExportFrames = clip?.exportFrames ?? clip?.export_frames ?? clip?.frameCount ?? clip?.frame_count;
    clips.push({
      id,
      label: String(clip?.label || clip?.name || clip?.id || `Motion ${index + 1}`),
      duration,
      exportFrames: Number.isFinite(Number(rawExportFrames)) ? normalizeMotionFrameCount(rawExportFrames, 4) : undefined,
      keyframes: normalizeMotionKeyframes(clip?.keyframes || clip?.keys || [], duration)
    });
  }
  return clips;
}

function normalizeMotionKeyframes(value, duration = 2) {
  const source = Array.isArray(value) ? value : [];
  const keyframes = source
    .map((keyframe, index) => ({
      time: Number(clamp(Number.isFinite(Number(keyframe?.time ?? keyframe?.t)) ? Number(keyframe.time ?? keyframe.t) : index, 0, duration).toFixed(3)),
      easing: normalizeMotionEasing(keyframe?.easing || keyframe?.curve || keyframe?.interpolation),
      params: normalizePresetParams(keyframe?.params || keyframe?.values || {})
    }))
    .filter((keyframe) => Object.keys(keyframe.params).length > 0)
    .sort((left, right) => left.time - right.time);
  const deduped = [];
  for (const keyframe of keyframes) {
    const previous = deduped[deduped.length - 1];
    if (previous && Math.abs(previous.time - keyframe.time) <= 0.005) {
      deduped[deduped.length - 1] = keyframe;
    } else {
      deduped.push(keyframe);
    }
  }
  return deduped;
}

function normalizePhysics(value) {
  const fallback = defaultPhysics();
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
  return {
    enabled: source.enabled !== false,
    rules: normalizePhysicsRules(source.rules || source.outputs || fallback.rules)
  };
}

function normalizePhysicsRules(value) {
  const source = Array.isArray(value) ? value : [];
  const rules = [];
  for (const [index, rule] of source.entries()) {
    const normalized = normalizePhysicsRule(rule, index);
    if (!normalized.param) continue;
    const baseId = normalized.id;
    let nextId = baseId;
    let suffix = 2;
    while (rules.some((entry) => entry.id === nextId)) {
      nextId = `${baseId}_${suffix}`;
      suffix += 1;
    }
    rules.push({ ...normalized, id: nextId });
  }
  return rules;
}

function normalizePhysicsRule(rule, index = 0) {
  const param = knownParameterKey(rule?.param || rule?.parameter || rule?.target) || "breath";
  const def = allParameterDefs().find((entry) => entry.key === param) || parameterDefs[0];
  return {
    id: safeSegment(rule?.id || rule?.label || `physics_${index + 1}`, `physics_${index + 1}`),
    label: String(rule?.label || rule?.name || rule?.id || `Physics ${index + 1}`),
    param,
    offset: clamp(Number.isFinite(Number(rule?.offset ?? rule?.center)) ? Number(rule.offset ?? rule.center) : Number(rig.params?.[param] ?? 0), def.min, def.max),
    amplitude: clamp(Number.isFinite(Number(rule?.amplitude ?? rule?.scale)) ? Number(rule.amplitude ?? rule.scale) : 0, -100, 100),
    frequency: clamp(Number.isFinite(Number(rule?.frequency ?? rule?.hz)) ? Number(rule.frequency ?? rule.hz) : 0.5, 0, 5),
    phase: clamp(Number.isFinite(Number(rule?.phase)) ? Number(rule.phase) : 0, -6.283, 6.283),
    enabled: rule?.enabled !== false,
    autoGenerated: rule?.autoGenerated === true || rule?.auto_generated === true,
    autoPhysicsKind: safeSegment(rule?.autoPhysicsKind || rule?.auto_physics_kind || rule?.kind || "", "")
  };
}

function normalizePresetParams(value) {
  const params = {};
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  for (const param of allParameterDefs()) {
    if (Number.isFinite(Number(source[param.key]))) {
      params[param.key] = clamp(Number(source[param.key]), param.min, param.max);
    }
  }
  return params;
}

function normalizePresetMeshes(value) {
  const source = Array.isArray(value) ? value : [];
  return source.map((entry) => ({
    partId: safeSegment(entry.partId || entry.id || "", ""),
    vertices: Array.isArray(entry.vertices)
      ? entry.vertices.map((vertex) => ({
        dx: Number.isFinite(Number(vertex?.dx)) ? Number(vertex.dx) : 0,
        dy: Number.isFinite(Number(vertex?.dy)) ? Number(vertex.dy) : 0
      }))
      : []
  })).filter((entry) => entry.partId);
}

function normalizePresetPoseTags(value) {
  const source = Array.isArray(value) ? value : [];
  const tags = [];
  for (const entry of source) {
    const tag = safeSegment(entry, "");
    if (tag && !tags.includes(tag)) tags.push(tag);
  }
  return tags.slice(0, 16);
}

function normalizePresetPoseScore(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const score = {};
  for (const [rawKey, rawValue] of Object.entries(source)) {
    const key = safeSegment(rawKey, "");
    const valueNumber = Number(rawValue);
    if (!key || !Number.isFinite(valueNumber)) continue;
    score[key] = Number(clamp(valueNumber, 0, 1).toFixed(3));
  }
  return score;
}

function normalizeImagePartBlendMode(value) {
  const mode = String(value || "source-over");
  return imagePartBlendModes.some(([candidate]) => candidate === mode) ? mode : "source-over";
}

function normalizeImagePartClipShape(value) {
  const shape = String(value || "none");
  return imagePartClipShapes.some(([candidate]) => candidate === shape) ? shape : "none";
}

function normalizeImagePartClipPartId(value, selfId = "") {
  const id = safeSegment(value || "", "");
  return id && id !== selfId ? id : "";
}

function normalizeHitAreaKind(value) {
  const kind = String(value || "").trim().toLowerCase();
  return ["head", "face", "body", "hand", "prop", "generic"].includes(kind) ? kind : "generic";
}

function normalizeImagePartHitArea(part) {
  const source = part?.hitArea && typeof part.hitArea === "object" && !Array.isArray(part.hitArea)
    ? part.hitArea
    : {};
  const label = String(source.label || part?.label || part?.name || part?.id || "Hit Area").trim() || "Hit Area";
  const hitArea = {
    enabled: Boolean(source.enabled),
    id: safeSegment(source.id || source.key || source.name || label, "hit_area"),
    label,
    kind: normalizeHitAreaKind(source.kind || source.type)
  };
  const bounds = normalizeHitAreaBounds(source.bounds || source.rect);
  if (bounds) hitArea.bounds = bounds;
  const normalizedBounds = normalizeHitAreaBounds(source.normalizedBounds || source.normalized_bounds || source.normalizedRect || source.normalized_rect);
  if (normalizedBounds) hitArea.normalizedBounds = normalizedBounds;
  const points = normalizeHitAreaPoints(source.points || source.polygon);
  if (points.length > 0) hitArea.points = points;
  const normalizedPoints = normalizeHitAreaPoints(source.normalizedPoints || source.normalized_points || source.normalizedPolygon || source.normalized_polygon);
  if (normalizedPoints.length > 0) hitArea.normalizedPoints = normalizedPoints;
  return hitArea;
}

function normalizeImagePartVisibilityGate(part) {
  const source = part?.visibilityGate && typeof part.visibilityGate === "object" && !Array.isArray(part.visibilityGate)
    ? part.visibilityGate
    : {};
  const parameter = knownParameterKey(source.parameter || source.param || source.key) || "angleX";
  const definition = parameterDefinitionForKey(parameter) || { min: -100, max: 100 };
  const min = Number.isFinite(Number(source.min ?? source.minimum))
    ? Number(source.min ?? source.minimum)
    : Number(definition.min);
  const max = Number.isFinite(Number(source.max ?? source.maximum))
    ? Number(source.max ?? source.maximum)
    : Number(definition.max);
  const fade = Number.isFinite(Number(source.fade ?? source.softness))
    ? Math.max(0, Number(source.fade ?? source.softness))
    : 0;
  const safeMin = Number.isFinite(min) ? min : -100;
  const safeMax = Number.isFinite(max) ? max : 100;
  return {
    enabled: source.enabled === true,
    parameter,
    min: Number(safeMin.toFixed(4)),
    max: Number(safeMax.toFixed(4)),
    fade: Number(fade.toFixed(4))
  };
}

function imagePartVisibilityFactor(sourceRig, part) {
  const gate = normalizeImagePartVisibilityGate(part);
  if (!gate.enabled) return 1;
  const value = Number(sourceRig?.params?.[gate.parameter] ?? rig.params?.[gate.parameter] ?? 0);
  if (!Number.isFinite(value)) return 1;
  const min = Math.min(Number(gate.min), Number(gate.max));
  const max = Math.max(Number(gate.min), Number(gate.max));
  const fade = Math.max(0, Number(gate.fade || 0));
  if (value >= min && value <= max) return 1;
  if (fade <= 0) return 0;
  if (value < min) return clamp((value - (min - fade)) / fade, 0, 1);
  return clamp(((max + fade) - value) / fade, 0, 1);
}

function visibilityGateSummary(part) {
  const gate = normalizeImagePartVisibilityGate(part);
  const value = Number(rig.params?.[gate.parameter] ?? 0);
  const factor = imagePartVisibilityFactor(rig, part);
  const fadeText = gate.fade > 0 ? ` · fade ${formatCompactNumber(gate.fade)}` : "";
  return `${gate.parameter} current ${formatCompactNumber(value)} · visible ${formatCompactNumber(gate.min)}..${formatCompactNumber(gate.max)}${fadeText} · ${Math.round(factor * 100)}%`;
}

function normalizeHitAreaBounds(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const x = Number(source.x);
  const y = Number(source.y);
  const width = Number(source.width ?? source.w);
  const height = Number(source.height ?? source.h);
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
  return {
    x: Number(x.toFixed(4)),
    y: Number(y.toFixed(4)),
    width: Number(width.toFixed(4)),
    height: Number(height.toFixed(4))
  };
}

function normalizeHitAreaPoints(value) {
  const source = Array.isArray(value) ? value : [];
  return source
    .map((point) => {
      const x = Number(Array.isArray(point) ? point[0] : point?.x);
      const y = Number(Array.isArray(point) ? point[1] : point?.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return { x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) };
    })
    .filter(Boolean)
    .slice(0, 32);
}

function normalizeImagePartParentId(value, selfId = "") {
  const id = safeSegment(value || "", "");
  return id && id !== selfId ? id : "";
}

function normalizeImageParts(value) {
  const source = Array.isArray(value) ? value : [];
  const normalizedParts = source.map((part, index) => {
    const normalized = {
      id: safeSegment(part.id || `image_part_${index + 1}`, `image_part_${index + 1}`),
      label: String(part.label || part.name || `Image Part ${index + 1}`),
      path: String(part.path || ""),
      slot: part.slot === "back" ? "back" : "front",
      parentPartId: normalizeImagePartParentId(part.parentPartId || part.parent || part.parentId, safeSegment(part.id || `image_part_${index + 1}`, `image_part_${index + 1}`)),
      visible: part.visible !== false,
      locked: part.locked === true,
      opacity: Number.isFinite(Number(part.opacity)) ? Number(part.opacity) : 1,
      blendMode: normalizeImagePartBlendMode(part.blendMode || part.compositeOperation),
      clipShape: normalizeImagePartClipShape(part.clipShape || part.clip),
      clipPartId: normalizeImagePartClipPartId(part.clipPartId || part.clipMask || part.maskPartId, safeSegment(part.id || `image_part_${index + 1}`, `image_part_${index + 1}`)),
      clipInset: clamp(Number.isFinite(Number(part.clipInset)) ? Number(part.clipInset) : 0, 0, 0.45),
      clipRadius: clamp(Number.isFinite(Number(part.clipRadius)) ? Number(part.clipRadius) : 0.12, 0, 0.5),
      visibilityGate: normalizeImagePartVisibilityGate(part),
      x: Number.isFinite(Number(part.x)) ? Number(part.x) : 450,
      y: Number.isFinite(Number(part.y)) ? Number(part.y) : 700,
      scaleX: Number.isFinite(Number(part.scaleX)) ? Number(part.scaleX) : 1,
      scaleY: Number.isFinite(Number(part.scaleY)) ? Number(part.scaleY) : 1,
      rotation: Number.isFinite(Number(part.rotation)) ? Number(part.rotation) : 0,
      anchorX: Number.isFinite(Number(part.anchorX)) ? Number(part.anchorX) : 0.5,
      anchorY: Number.isFinite(Number(part.anchorY)) ? Number(part.anchorY) : 0.5,
      order: Number.isFinite(Number(part.order)) ? Number(part.order) : index,
      bindX: String(part.bindX || ""),
      bindXStrength: Number.isFinite(Number(part.bindXStrength)) ? Number(part.bindXStrength) : 0,
      bindY: String(part.bindY || ""),
      bindYStrength: Number.isFinite(Number(part.bindYStrength)) ? Number(part.bindYStrength) : 0,
      bindRotation: String(part.bindRotation || ""),
      bindRotationStrength: Number.isFinite(Number(part.bindRotationStrength)) ? Number(part.bindRotationStrength) : 0,
      bindScaleX: String(part.bindScaleX || ""),
      bindScaleXStrength: Number.isFinite(Number(part.bindScaleXStrength)) ? Number(part.bindScaleXStrength) : 0,
      bindScaleY: String(part.bindScaleY || ""),
      bindScaleYStrength: Number.isFinite(Number(part.bindScaleYStrength)) ? Number(part.bindScaleYStrength) : 0,
      bindOpacity: String(part.bindOpacity || ""),
      bindOpacityStrength: Number.isFinite(Number(part.bindOpacityStrength)) ? Number(part.bindOpacityStrength) : 0,
      hitArea: normalizeImagePartHitArea(part),
      transformKeyParam: knownParameterKey(part.transformKeyParam || part.keyParam) || "angleX",
      transformDeformers: Array.isArray(part.transformDeformers)
        ? part.transformDeformers
        : (Array.isArray(part.transformKeys) ? part.transformKeys : []),
      drawOrderKeyParam: knownParameterKey(part.drawOrderKeyParam || part.orderKeyParam) || "angleX",
      drawOrderDeformers: Array.isArray(part.drawOrderDeformers)
        ? part.drawOrderDeformers
        : (Array.isArray(part.drawOrderKeys) ? part.drawOrderKeys : [])
    };
    normalizePartTransformDeformers(normalized);
    normalizeDrawOrderDeformers(normalized);
    if (part.mesh?.enabled) {
      normalized.mesh = part.mesh;
      normalizePartMesh(normalized);
    }
    return normalized;
  });
  for (const part of normalizedParts) {
    if (imagePartParentCreatesCycle(normalizedParts, part)) {
      part.parentPartId = "";
    }
  }
  return normalizedParts;
}

function normalizeDeformerGroups(value, sourceRig = rig) {
  const source = Array.isArray(value) ? value : [];
  const groups = [];
  for (const [index, group] of source.entries()) {
    const baseId = safeSegment(group?.id || group?.label || group?.name || `deformer_group_${index + 1}`, `deformer_group_${index + 1}`);
    let id = baseId;
    let suffix = 2;
    while (groups.some((entry) => entry.id === id)) {
      id = `${baseId}_${suffix}`;
      suffix += 1;
    }
    const canvasWidth = Number(sourceRig?.canvas?.width || 900);
    const canvasHeight = Number(sourceRig?.canvas?.height || 1400);
    groups.push({
      id,
      label: String(group?.label || group?.name || group?.id || `Deformer Group ${index + 1}`),
      enabled: group?.enabled !== false,
      autoGenerated: group?.autoGenerated === true || group?.auto_generated === true,
      autoGroupKind: safeSegment(group?.autoGroupKind || group?.auto_group_kind || "", ""),
      parameter: knownParameterKey(group?.parameter || group?.param) || "angleX",
      parentGroupId: safeSegment(group?.parentGroupId || group?.parentId || group?.parent || "", ""),
      partIds: normalizeDeformerGroupPartIds(group, sourceRig),
      x: Number.isFinite(Number(group?.x)) ? Number(group.x) : canvasWidth * 0.5,
      y: Number.isFinite(Number(group?.y)) ? Number(group.y) : canvasHeight * 0.5,
      scaleX: Number.isFinite(Number(group?.scaleX)) ? Number(group.scaleX) : 1,
      scaleY: Number.isFinite(Number(group?.scaleY)) ? Number(group.scaleY) : 1,
      rotation: Number.isFinite(Number(group?.rotation)) ? Number(group.rotation) : 0,
      opacity: Number.isFinite(Number(group?.opacity)) ? Number(group.opacity) : 1,
      keyframes: normalizePartTransformKeyframes(group?.keyframes || group?.keys || []),
      warp: normalizeDeformerGroupWarp(group?.warp || group?.warpDeformer || {}, group, sourceRig)
    });
  }
  for (const group of groups) {
    group.parentGroupId = normalizeDeformerGroupParentId(group.parentGroupId, group.id, { deformerGroups: groups });
  }
  for (const group of groups) {
    if (deformerGroupParentCreatesCycle(groups, group)) {
      group.parentGroupId = "";
    }
  }
  return groups;
}

function imagePartParentCreatesCycle(parts, part) {
  const visited = new Set([part.id]);
  let parentId = normalizeImagePartParentId(part.parentPartId, part.id);
  while (parentId) {
    if (visited.has(parentId)) return true;
    visited.add(parentId);
    const parent = parts.find((entry) => entry.id === parentId);
    if (!parent) return false;
    parentId = normalizeImagePartParentId(parent.parentPartId, parent.id);
  }
  return false;
}

async function addImagePart(file) {
  await addImageParts(file ? [file] : []);
}

async function importLayerBundleFiles(files) {
  const selectedFiles = Array.from(files || []).filter(Boolean);
  if (selectedFiles.length === 0) return;
  if (!currentCharacter?.id) {
    showToast("Select or create a character first.");
    return;
  }
  const imageFiles = selectedFiles.filter(isLayerBundleImageFile);
  const manifestFile = selectedFiles.find(isLayerBundleManifestFile);
  if (!manifestFile) {
    await addImageParts(imageFiles);
    return;
  }
  const manifest = JSON.parse(await manifestFile.text());
  const records = layerBundleRecordsFromManifest(manifest)
    .map((record, index) => ({ ...record, importIndex: index }))
    .filter((record) => layerBundleImageFileForRecord(record, imageFiles));
  if (records.length === 0) {
    throw new Error("No layer manifest entries matched the selected image files.");
  }

  const usedPartIds = new Set(getImageParts().map((part) => part.id));
  const createdEntries = [];
  const partReferenceMap = new Map();
  const baseOrder = nextImagePartOrder("front");
  showToast(`Importing ${records.length} manifest layer${records.length === 1 ? "" : "s"}...`);
  for (const record of records) {
    const file = layerBundleImageFileForRecord(record, imageFiles);
    const label = layerBundleRecordLabel(record, file);
    const baseId = safeSegment(record.partId || record.id || record.layerId || label, "layer");
    const partId = uniqueImagePartIdForImport(baseId, usedPartIds);
    usedPartIds.add(partId);
    const part = await uploadImagePart(file, baseOrder + createdEntries.length, { partId, label });
    createdEntries.push({ part, record, file });
    for (const key of layerBundleReferenceKeys(record, file, label, partId)) {
      partReferenceMap.set(key, partId);
    }
  }

  getImageParts().push(...createdEntries.map((entry) => entry.part));
  for (const entry of createdEntries) applyAutoImagePartBinding(entry.part);
  await preloadRigImages(rig);
  for (const entry of createdEntries) applyAutoImagePartPlacement(entry.part);
  for (const entry of createdEntries) applyAutoImagePartVisibilityGate(entry.part);
  for (const entry of createdEntries) applyAutoImagePartMesh(entry.part);
  for (const entry of createdEntries) applyAutoImagePartDeform(entry.part);
  for (const entry of createdEntries) applyAutoImagePartParent(entry.part, { clearWhenMissing: false });
  for (const entry of createdEntries) {
    applyLayerBundleRecordToPart(entry.part, entry.record, partReferenceMap);
  }

  rig.imageParts = normalizeImageParts(getImageParts());
  normalizeImagePartOrders();
  selectedLayerId = partSelectionId(createdEntries[createdEntries.length - 1].part.id);
  const previousSelection = selectedLayerId;
  const groupResult = autoGroupImageParts({ confirmReplace: false, silent: true });
  selectedLayerId = previousSelection;
  renderLayerList();
  renderLayerControls();
  draw();
  commitHistory(`import layer manifest ${createdEntries.length} parts`);
  showToast(`Layer manifest imported: ${createdEntries.length} part${createdEntries.length === 1 ? "" : "s"}${groupResult.created.length > 0 ? ` · ${groupResult.created.length} groups` : ""}.`);
}

function isLayerBundleImageFile(file) {
  return /^image\/(png|jpeg|webp)$/i.test(file?.type || "") || /\.(png|jpe?g|webp)$/i.test(file?.name || "");
}

function isLayerBundleManifestFile(file) {
  return /(^|\/)(layers|manifest|portraitRig|rig)[^/]*\.json$/i.test(layerBundleFilePath(file)) || /\.json$/i.test(file?.name || "");
}

function layerBundleRecordsFromManifest(data) {
  const manifest = data && typeof data === "object" && !Array.isArray(data) ? data : {};
  const canvas = manifest.canvas && typeof manifest.canvas === "object" && !Array.isArray(manifest.canvas)
    ? manifest.canvas
    : manifest;
  const canvasWidth = Number(canvas.width ?? canvas.w);
  const canvasHeight = Number(canvas.height ?? canvas.h);
  const records = flattenLayerBundleEntries(data)
    .map((entry, index) => normalizeLayerBundleRecord(entry, index, {
      canvasWidth: Number.isFinite(canvasWidth) ? canvasWidth : 0,
      canvasHeight: Number.isFinite(canvasHeight) ? canvasHeight : 0
    }))
    .filter(Boolean);
  return records.sort((left, right) => {
    if (left.order !== right.order) return left.order - right.order;
    return left.importIndex - right.importIndex;
  });
}

function flattenLayerBundleEntries(value, parentReference = "") {
  if (Array.isArray(value)) return value.flatMap((entry) => flattenLayerBundleEntries(entry, parentReference));
  if (!value || typeof value !== "object") return [];
  const source = value;
  const children = Array.isArray(source.layers)
    ? source.layers
    : Array.isArray(source.imageParts)
    ? source.imageParts
    : Array.isArray(source.parts)
    ? source.parts
    : Array.isArray(source.children)
    ? source.children
    : [];
  if (children.length > 0) {
    const groupReference = String(source.id || source.layerId || source.name || source.label || parentReference || "").trim();
    const flattened = [];
    if (layerBundleRecordFileName(source)) flattened.push({ ...source, parent: source.parent || source.parentId || parentReference });
    flattened.push(...children.flatMap((entry) => flattenLayerBundleEntries(entry, groupReference)));
    return flattened;
  }
  return [parentReference && !source.parent && !source.parentId ? { ...source, parent: parentReference } : source];
}

function normalizeLayerBundleRecord(entry, index, canvasInfo) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
  const fileName = layerBundleRecordFileName(entry);
  const label = String(entry.label || entry.name || entry.title || fileName.replace(/\.[^.]+$/, "") || `Layer ${index + 1}`).trim();
  const order = optionalNumber(entry.order ?? entry.index ?? entry.zIndex ?? entry.z_index);
  return {
    ...entry,
    fileName,
    label: label || `Layer ${index + 1}`,
    importIndex: index,
    order: Number.isFinite(order) ? order : index,
    manifestCanvasWidth: canvasInfo.canvasWidth,
    manifestCanvasHeight: canvasInfo.canvasHeight
  };
}

function layerBundleRecordFileName(record) {
  return String(record?.file || record?.filename || record?.fileName || record?.image || record?.imagePath || record?.path || record?.src || "").trim();
}

function layerBundleImageFileForRecord(record, imageFiles) {
  const candidates = new Set();
  const fileName = layerBundleRecordFileName(record);
  if (fileName) {
    candidates.add(layerBundleFileKey(fileName));
    candidates.add(layerBundleFileBaseKey(fileName));
  }
  for (const value of [record?.id, record?.layerId, record?.name, record?.label]) {
    if (!value) continue;
    candidates.add(layerBundleFileKey(value));
    candidates.add(layerBundleFileBaseKey(value));
  }
  return imageFiles.find((file) => {
    const fullKey = layerBundleFileKey(layerBundleFilePath(file));
    const nameKey = layerBundleFileKey(file.name);
    const baseKey = layerBundleFileBaseKey(file.name);
    return candidates.has(fullKey) || candidates.has(nameKey) || candidates.has(baseKey);
  }) || null;
}

function layerBundleRecordLabel(record, file) {
  return String(record?.label || record?.name || record?.title || file?.name?.replace(/\.[^.]+$/, "") || "Layer").trim() || "Layer";
}

function layerBundleReferenceKeys(record, file, label, partId) {
  const keys = new Set([partId]);
  for (const value of [record?.id, record?.layerId, record?.name, record?.label, record?.fileName, layerBundleRecordFileName(record), file?.name, layerBundleFilePath(file), label]) {
    const clean = layerBundleReferenceKey(value);
    if (clean) keys.add(clean);
    const segment = safeSegment(value || "", "");
    if (segment) keys.add(segment);
  }
  return [...keys];
}

function layerBundleReferenceKey(value) {
  return layerBundleFileBaseKey(value).replace(/[^a-z0-9가-힣_-]+/gi, "_").replace(/^_+|_+$/g, "");
}

function layerBundleFilePath(file) {
  return String(file?.webkitRelativePath || file?.name || file || "").replace(/\\/g, "/");
}

function layerBundleFileKey(value) {
  return String(value || "").replace(/\\/g, "/").split("/").pop().toLowerCase();
}

function layerBundleFileBaseKey(value) {
  return layerBundleFileKey(value).replace(/\.(png|jpe?g|webp|json)$/i, "");
}

function uniqueImagePartIdForImport(baseId, usedIds) {
  let id = safeSegment(baseId, "layer");
  if (!usedIds.has(id)) return id;
  let index = 2;
  while (usedIds.has(`${id}_${index}`)) index += 1;
  return `${id}_${index}`;
}

function applyLayerBundleRecordToPart(part, record, partReferenceMap = new Map()) {
  part.label = layerBundleRecordLabel(record, { name: layerBundleRecordFileName(record) }) || part.label;
  part.slot = normalizeLayerBundleSlot(record.slot || record.drawSlot || record.group || record.kind) || part.slot;
  part.visible = record.visible !== false && record.hidden !== true;
  if (record.locked !== undefined) part.locked = record.locked === true;
  if (Number.isFinite(Number(record.opacity))) part.opacity = clamp(Number(record.opacity), 0, 1);
  if (record.blendMode || record.compositeOperation) part.blendMode = normalizeImagePartBlendMode(record.blendMode || record.compositeOperation);
  if (record.clipShape || record.clip) part.clipShape = normalizeImagePartClipShape(record.clipShape || record.clip);
  if (Number.isFinite(Number(record.clipInset))) part.clipInset = clamp(Number(record.clipInset), 0, 0.45);
  if (Number.isFinite(Number(record.clipRadius))) part.clipRadius = clamp(Number(record.clipRadius), 0, 0.5);
  if (Number.isFinite(Number(record.order))) part.order = Number(record.order);

  const parentReference = record.parentPartId || record.parentId || record.parent || "";
  if (parentReference) {
    part.parentPartId = normalizeImagePartParentId(resolveLayerBundlePartReference(parentReference, partReferenceMap), part.id);
  }
  const clipReference = record.clipPartId || record.clipMask || record.maskPartId || record.mask || "";
  if (clipReference) {
    part.clipPartId = normalizeImagePartClipPartId(resolveLayerBundlePartReference(clipReference, partReferenceMap), part.id);
  }

  applyLayerBundleTransform(part, record);
  applyLayerBundleBindings(part, record);
  if (record.visibilityGate || record.visibility_gate) {
    part.visibilityGate = normalizeImagePartVisibilityGate({ visibilityGate: record.visibilityGate || record.visibility_gate });
  }
  if (record.hitArea || record.hit_area) {
    part.hitArea = normalizeImagePartHitArea({ ...part, hitArea: record.hitArea || record.hit_area });
  }
  if (record.transformKeyParam || record.keyParam) part.transformKeyParam = knownParameterKey(record.transformKeyParam || record.keyParam) || part.transformKeyParam;
  if (Array.isArray(record.transformDeformers) || Array.isArray(record.transformKeys)) {
    part.transformDeformers = JSON.parse(JSON.stringify(record.transformDeformers || record.transformKeys || []));
    normalizePartTransformDeformers(part);
  }
  if (record.drawOrderKeyParam || record.orderKeyParam) part.drawOrderKeyParam = knownParameterKey(record.drawOrderKeyParam || record.orderKeyParam) || part.drawOrderKeyParam;
  if (Array.isArray(record.drawOrderDeformers) || Array.isArray(record.drawOrderKeys)) {
    part.drawOrderDeformers = JSON.parse(JSON.stringify(record.drawOrderDeformers || record.drawOrderKeys || []));
    normalizeDrawOrderDeformers(part);
  }
  if (record.mesh && typeof record.mesh === "object" && !Array.isArray(record.mesh)) {
    part.mesh = JSON.parse(JSON.stringify(record.mesh));
    normalizePartMesh(part);
  }
}

function normalizeLayerBundleSlot(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "";
  if (/(back|behind|rear|under|body|background)/.test(text)) return "back";
  return "front";
}

function resolveLayerBundlePartReference(value, partReferenceMap) {
  const direct = safeSegment(value || "", "");
  if (direct && imagePartById(rig, direct)) return direct;
  return partReferenceMap.get(layerBundleReferenceKey(value)) || partReferenceMap.get(direct) || direct;
}

function applyLayerBundleTransform(part, record) {
  const bounds = layerBundleRecordBounds(record);
  const anchor = layerBundleRecordAnchor(record, part);
  part.anchorX = anchor.x;
  part.anchorY = anchor.y;
  if (bounds) {
    part.x = Number((bounds.x + bounds.width * part.anchorX).toFixed(3));
    part.y = Number((bounds.y + bounds.height * part.anchorY).toFixed(3));
    const image = imageForPath(part.path);
    if (image && image.naturalWidth > 0 && image.naturalHeight > 0) {
      part.scaleX = Number((bounds.width / image.naturalWidth).toFixed(4));
      part.scaleY = Number((bounds.height / image.naturalHeight).toFixed(4));
    }
  }
  const centerX = optionalNumber(record.centerX ?? record.center_x ?? record.cx);
  const centerY = optionalNumber(record.centerY ?? record.center_y ?? record.cy);
  if (Number.isFinite(centerX)) part.x = scaledLayerBundleNumber(centerX, "x", record);
  if (Number.isFinite(centerY)) part.y = scaledLayerBundleNumber(centerY, "y", record);
  if (!bounds) {
    const x = optionalNumber(record.x);
    const y = optionalNumber(record.y);
    if (Number.isFinite(x)) part.x = scaledLayerBundleNumber(x, "x", record);
    if (Number.isFinite(y)) part.y = scaledLayerBundleNumber(y, "y", record);
  }
  const scale = layerBundleRecordScale(record);
  if (Number.isFinite(scale.x)) part.scaleX = scale.x;
  if (Number.isFinite(scale.y)) part.scaleY = scale.y;
  if (Number.isFinite(Number(record.rotation ?? record.rotate))) part.rotation = Number(record.rotation ?? record.rotate);
}

function layerBundleRecordBounds(record) {
  const source = record.bounds || record.rect || record.frame || {};
  const left = optionalNumber(source.left ?? source.x ?? record.left ?? record.topLeftX ?? record.top_left_x);
  const top = optionalNumber(source.top ?? source.y ?? record.top ?? record.topLeftY ?? record.top_left_y);
  const width = optionalNumber(source.width ?? source.w ?? record.width ?? record.w);
  const height = optionalNumber(source.height ?? source.h ?? record.height ?? record.h);
  if (![left, top, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
  return {
    x: scaledLayerBundleNumber(left, "x", record),
    y: scaledLayerBundleNumber(top, "y", record),
    width: scaledLayerBundleNumber(width, "x", record),
    height: scaledLayerBundleNumber(height, "y", record)
  };
}

function layerBundleRecordAnchor(record, part) {
  const anchor = record.anchor && typeof record.anchor === "object" && !Array.isArray(record.anchor) ? record.anchor : {};
  return {
    x: clamp(optionalNumber(record.anchorX ?? record.anchor_x ?? anchor.x) ?? part.anchorX ?? 0.5, 0, 1),
    y: clamp(optionalNumber(record.anchorY ?? record.anchor_y ?? anchor.y) ?? part.anchorY ?? 0.5, 0, 1)
  };
}

function layerBundleRecordScale(record) {
  const scale = record.scale && typeof record.scale === "object" && !Array.isArray(record.scale) ? record.scale : {};
  const scalarScale = optionalNumber(record.scale);
  return {
    x: optionalNumber(record.scaleX ?? record.scale_x ?? scale.x) ?? scalarScale,
    y: optionalNumber(record.scaleY ?? record.scale_y ?? scale.y) ?? scalarScale
  };
}

function scaledLayerBundleNumber(value, axis, record) {
  const number = Number(value);
  if (!Number.isFinite(number)) return number;
  const targetSize = Number(axis === "x" ? rig.canvas.width : rig.canvas.height) || 1;
  if (layerBundleUsesNormalizedCoordinates(record)) return Number((number * targetSize).toFixed(3));
  const sourceSize = Number(axis === "x" ? record.manifestCanvasWidth : record.manifestCanvasHeight);
  if (Number.isFinite(sourceSize) && sourceSize > 0 && Math.abs(sourceSize - targetSize) > 0.001) {
    return Number((number * targetSize / sourceSize).toFixed(3));
  }
  return Number(number.toFixed(3));
}

function layerBundleUsesNormalizedCoordinates(record) {
  const unit = String(record.coordinateSpace || record.coordinate_space || record.units || record.unit || "").toLowerCase();
  return record.normalized === true || /(normalized|normalised|ratio|percent)/.test(unit);
}

function applyLayerBundleBindings(part, record) {
  const bindings = record.bindings && typeof record.bindings === "object" && !Array.isArray(record.bindings) ? record.bindings : {};
  for (const [field, strengthField] of imagePartBindingFields) {
    const parameter = record[field] ?? bindings[field];
    const strength = record[strengthField] ?? bindings[strengthField];
    if (parameter !== undefined) part[field] = knownParameterKey(parameter) || "";
    if (strength !== undefined && Number.isFinite(Number(strength))) part[strengthField] = Number(strength);
  }
}

function optionalNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

async function addImageParts(files) {
  const uploadFiles = Array.from(files || []).filter(Boolean);
  if (uploadFiles.length === 0) return;
  if (!currentCharacter?.id) {
    showToast("Select or create a character first.");
    return;
  }
  const createdParts = [];
  const baseOrder = nextImagePartOrder("front");
  let failedMessage = "";
  showToast(`Importing ${uploadFiles.length} image part${uploadFiles.length === 1 ? "" : "s"}...`);
  for (const [index, file] of uploadFiles.entries()) {
    try {
      const part = await uploadImagePart(file, baseOrder + index);
      createdParts.push(part);
    } catch (error) {
      failedMessage = `${file.name}: ${error.message}`;
      break;
    }
  }
  if (createdParts.length === 0) {
    throw new Error(failedMessage || "No image parts were imported.");
  }
  getImageParts().push(...createdParts);
  for (const part of createdParts) applyAutoImagePartBinding(part);
  normalizeImagePartOrders();
  selectedLayerId = partSelectionId(createdParts[createdParts.length - 1].id);
  await preloadRigImages(rig);
  for (const part of createdParts) applyAutoImagePartPlacement(part);
  let gateCount = 0;
  for (const part of createdParts) {
    if (applyAutoImagePartVisibilityGate(part).enabled) gateCount += 1;
  }
  for (const part of createdParts) applyAutoImagePartMesh(part);
  for (const part of createdParts) applyAutoImagePartDeform(part);
  for (const part of createdParts) applyAutoImagePartParent(part, { clearWhenMissing: false });
  const previousSelection = selectedLayerId;
  const groupResult = autoGroupImageParts({ confirmReplace: false, silent: true });
  selectedLayerId = previousSelection;
  normalizeImagePartOrders();
  renderLayerList();
  renderLayerControls();
  draw();
  commitHistory(`add ${createdParts.length} image part${createdParts.length === 1 ? "" : "s"}`);
  showToast(failedMessage
    ? `Imported ${createdParts.length}; failed ${failedMessage}`
    : createdParts.length === 1
    ? `Image part added: ${createdParts[0].path}${gateCount > 0 ? " · gated" : ""}${groupResult.created.length > 0 ? ` · ${groupResult.created.length} groups` : ""}`
    : `Image parts added: ${createdParts.length}${gateCount > 0 ? ` · ${gateCount} gated` : ""}${groupResult.created.length > 0 ? ` · ${groupResult.created.length} groups` : ""}`);
}

async function uploadImagePart(file, order, options = {}) {
  const dataUrl = await fileToDataUrl(file);
  const label = String(options.label || file.name.replace(/\.[^.]+$/, "") || "Layer").trim() || "Layer";
  const partId = safeSegment(options.partId || "", "");
  const body = {
    label,
    dataUrl
  };
  if (partId) body.partId = partId;
  const result = await requestJson(`/api/characters/${encodeURIComponent(currentCharacter.id)}/portraitRig-part`, {
    method: "POST",
    body: JSON.stringify(body)
  });
  return {
    id: result.id,
    label: result.label,
    path: result.path,
    slot: "front",
    parentPartId: "",
    visible: true,
    opacity: 1,
    blendMode: "source-over",
    clipShape: "none",
    clipPartId: "",
    clipInset: 0,
    clipRadius: 0.12,
    x: rig.canvas.width * 0.5,
    y: rig.canvas.height * 0.5,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    anchorX: 0.5,
    anchorY: 0.5,
    order,
    bindX: "",
    bindXStrength: 0,
    bindY: "",
    bindYStrength: 0,
    bindRotation: "",
    bindRotationStrength: 0,
    bindScaleX: "",
    bindScaleXStrength: 0,
    bindScaleY: "",
    bindScaleYStrength: 0,
    bindOpacity: "",
    bindOpacityStrength: 0,
    transformKeyParam: "angleX",
    transformDeformers: [],
    drawOrderKeyParam: "angleX",
    drawOrderDeformers: []
  };
}

function nextImagePartOrder(slot = "") {
  const cleanSlot = slot === "back" ? "back" : (slot === "front" ? "front" : "");
  return getImageParts().reduce((maxOrder, part) => {
    if (cleanSlot && (part.slot || "front") !== cleanSlot) return maxOrder;
    const order = Number(part.order);
    return Number.isFinite(order) ? Math.max(maxOrder, order) : maxOrder;
  }, -1) + 1;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("File could not be read."));
    reader.readAsDataURL(file);
  });
}

function tick(now) {
  if (!elements.autoMotion.checked) {
    animationFrame = 0;
    return;
  }
  const t = (now - animationStartedAt) / 1000;
  applyPhysicsAt(t);
  renderParameterControls();
  draw();
  animationFrame = requestAnimationFrame(tick);
}

function bindEvents() {
  canvas.addEventListener("pointerdown", handleCanvasPointerDown);
  canvas.addEventListener("pointermove", handleCanvasPointerMove);
  canvas.addEventListener("pointerup", handleCanvasPointerUp);
  canvas.addEventListener("pointercancel", handleCanvasPointerUp);
  window.addEventListener("pointermove", updateMotionTimelineDrag);
  window.addEventListener("pointerup", endMotionTimelineDrag);
  window.addEventListener("pointercancel", endMotionTimelineDrag);
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if ((event.metaKey || event.ctrlKey) && key === "z" && !event.shiftKey) {
      event.preventDefault();
      undoRig();
    } else if ((event.metaKey || event.ctrlKey) && (key === "y" || (key === "z" && event.shiftKey))) {
      event.preventDefault();
      redoRig();
    }
  });
  elements.undoAction.addEventListener("click", undoRig);
  elements.redoAction.addEventListener("click", redoRig);
  elements.restoreDraft.addEventListener("click", restoreDraft);
  elements.stageZoom.addEventListener("input", () => setStageViewportZoom(elements.stageZoom.value));
  elements.stageZoomFit.addEventListener("click", resetStageViewportZoom);
  elements.stageFrame.addEventListener("wheel", handleStageViewportWheel, { passive: false });
  window.addEventListener("resize", () => applyStageViewportZoom());
  elements.showStageGrid.addEventListener("change", draw);
  elements.snapStageGrid.addEventListener("change", draw);
  elements.stageGridSize.addEventListener("input", () => {
    elements.stageGridSize.value = String(stageGridSizeValue());
    draw();
  });
  elements.refreshRigValidation.addEventListener("click", renderRigValidation);
  elements.refreshCharacters.addEventListener("click", () => loadCharacters(elements.characterSelect.value).catch((error) => {
    setStatus("Error", "error");
    showToast(error.message);
  }));
  elements.characterSelect.addEventListener("change", () => loadCharacter(elements.characterSelect.value).catch((error) => showToast(error.message)));
  elements.portraitStateSelect.addEventListener("change", () => {
    selectExistingPortraitState().catch((error) => showToast(error.message));
  });
  elements.newCharacter.addEventListener("click", async () => {
    const displayName = window.prompt("캐릭터 표시 이름", "새 캐릭터");
    if (displayName === null) return;
    try {
      const result = await requestJson("/api/characters", {
        method: "POST",
        body: JSON.stringify({ display_name: displayName.trim() || "새 캐릭터" })
      });
      await loadCharacters(result.summary.id);
      showToast("Character created.");
    } catch (error) {
      showToast(error.message);
    }
  });
  elements.savePortrait.addEventListener("click", () => void savePortrait());
  elements.loadPortraitRig.addEventListener("click", () => {
    loadCurrentPortraitRig().catch((error) => showToast(error.message));
  });
  elements.saveExpressionPreset.addEventListener("click", saveCurrentExpressionPreset);
  elements.autoExpressionPresets.addEventListener("click", () => autoExpressionPresets({ confirmReplace: true }));
  elements.exportExpressionPresetJson.addEventListener("click", exportExpressionPresetJson);
  elements.importExpressionPresetJsonButton.addEventListener("click", () => elements.importExpressionPresetJson.click());
  elements.importExpressionPresetJson.addEventListener("change", () => {
    importExpressionPresetsFromFiles(elements.importExpressionPresetJson.files).catch((error) => showToast(error.message));
    elements.importExpressionPresetJson.value = "";
  });
  elements.exportExpressionPresets.addEventListener("click", () => void exportExpressionPresetsAsPortraits());
  elements.motionClipSelect.addEventListener("change", () => renderMotionControls(elements.motionClipSelect.value));
  elements.newMotionClip.addEventListener("click", createMotionClip);
  elements.renameMotionClip.addEventListener("click", renameCurrentMotionClip);
  elements.duplicateMotionClip.addEventListener("click", duplicateCurrentMotionClip);
  elements.deleteMotionClip.addEventListener("click", deleteCurrentMotionClip);
  elements.exportMotionClipJson.addEventListener("click", exportCurrentMotionClipJson);
  elements.exportAllMotionClipsJson.addEventListener("click", exportAllMotionClipsJson);
  elements.importMotionClipsButton.addEventListener("click", () => elements.importMotionClips.click());
  elements.importMotionClips.addEventListener("change", () => {
    importMotionClipsFromFiles(elements.importMotionClips.files).catch((error) => showToast(error.message));
    elements.importMotionClips.value = "";
  });
  elements.motionDuration.addEventListener("change", updateMotionDuration);
  elements.motionFrameCount.addEventListener("change", updateMotionExportFrameCount);
  elements.motionTime.addEventListener("input", () => setMotionTime(Number(elements.motionTime.value || 0), true));
  elements.motionOnionSkin.addEventListener("change", draw);
  elements.motionOnionStep.addEventListener("input", draw);
  elements.autoIdleMotion.addEventListener("click", () => generateAutoMotionClip("idle"));
  elements.autoTalkMotion.addEventListener("click", () => generateAutoMotionClip("talk"));
  elements.autoVisemeMotion.addEventListener("click", () => generateAutoMotionClip("viseme"));
  elements.addMotionKey.addEventListener("click", addMotionKeyframe);
  elements.pasteMotionKey.addEventListener("click", pasteMotionKeyframeAtCurrent);
  elements.playMotion.addEventListener("click", startMotionPlayback);
  elements.stopMotion.addEventListener("click", () => stopMotionPlayback(true));
  elements.exportCurrentMotionFrame.addEventListener("click", () => void exportCurrentMotionFrameAsPortrait());
  elements.exportMotionFrames.addEventListener("click", () => void exportMotionFramesAsPortraits());
  elements.exportAllMotionFrames.addEventListener("click", () => void exportAllMotionFramesAsPortraits());
  elements.exportAdaptivePoseSet.addEventListener("click", () => void exportAdaptivePoseSetAsPortraits());
  elements.exportDialogueMotionSet.addEventListener("click", () => void exportDialogueMotionSetAsPortraits());
  elements.buildAdaptivePose.addEventListener("click", buildAdaptivePoseClip);
  elements.dialoguePoseHint.addEventListener("change", renderDialoguePosePreviewStatus);
  elements.dialoguePoseText.addEventListener("input", renderDialoguePosePreviewStatus);
  elements.previewDialoguePoseHint.addEventListener("click", previewDialoguePoseHint);
  elements.previewDialogueTextPose.addEventListener("click", previewDialogueTextPose);
  elements.previewDialoguePosePrev.addEventListener("click", () => previewDialoguePoseStep(-1));
  elements.previewDialoguePoseNext.addEventListener("click", () => previewDialoguePoseStep(1));
  elements.resetDialoguePosePreview.addEventListener("click", resetDialoguePosePreview);
  elements.adaptivePoseIntensity.addEventListener("input", updateAdaptivePoseIntensity);
  elements.adaptivePoseIntensity.addEventListener("change", () => {
    commitHistory("adaptive pose intensity");
    showToast("Adaptive pose tuning updated.");
  });
  elements.resetAdaptivePoseTuning.addEventListener("click", resetAdaptivePoseTuning);
  elements.addPhysicsRule.addEventListener("click", addPhysicsRule);
  elements.autoPhysicsRules.addEventListener("click", () => autoPhysicsRules({ confirmReplace: true }));
  elements.physicsEnabled.addEventListener("change", () => {
    getPhysics().enabled = elements.physicsEnabled.checked;
    commitHistory("physics enabled");
  });
  elements.exportRig.addEventListener("click", () => void exportRig());
  elements.importRig.addEventListener("change", () => {
    importRig(elements.importRig.files?.[0]).catch((error) => showToast(error.message));
    elements.importRig.value = "";
  });
  elements.exportProjectBundle.addEventListener("click", () => {
    exportProjectBundle().catch((error) => showToast(error.message));
  });
  elements.importProjectBundle.addEventListener("change", () => {
    importProjectBundle(elements.importProjectBundle.files?.[0]).catch((error) => showToast(error.message));
    elements.importProjectBundle.value = "";
  });
  elements.addImagePart.addEventListener("change", () => {
    addImageParts(elements.addImagePart.files).catch((error) => showToast(error.message));
    elements.addImagePart.value = "";
  });
  elements.importLayerBundle.addEventListener("change", () => {
    importLayerBundleFiles(elements.importLayerBundle.files).catch((error) => showToast(error.message));
    elements.importLayerBundle.value = "";
  });
  elements.exportLayerManifest.addEventListener("click", () => {
    exportLayerManifest().catch((error) => showToast(error.message));
  });
  elements.autoBindImageParts.addEventListener("click", autoBindAllImageParts);
  elements.autoPlaceImageParts.addEventListener("click", autoPlaceAllImageParts);
  elements.autoParentImageParts.addEventListener("click", () => autoParentAllImageParts({ confirmReplace: true }));
  elements.autoVisibilityGates.addEventListener("click", () => autoVisibilityGateAllImageParts({ confirmReplace: true }));
  elements.addDeformerGroup.addEventListener("click", addDeformerGroup);
  elements.autoDeformerGroups.addEventListener("click", () => autoGroupImageParts({ confirmReplace: true }));
  elements.autoMeshImageParts.addEventListener("click", () => autoMeshAllImageParts({ confirmReplace: true }));
  elements.autoDeformImageParts.addEventListener("click", () => autoDeformAllImageParts({ confirmReplace: true }));
  elements.addParameter.addEventListener("click", addCustomParameter);
  elements.parameterInfluenceSelect.addEventListener("change", () => {
    renderParameterInfluencePanel(elements.parameterInfluenceSelect.value);
    draw();
  });
  elements.showParameterInfluence.addEventListener("change", draw);
  elements.resetParams.addEventListener("click", () => {
    rig.params = { ...defaultParams() };
    for (const param of getCustomParameters()) {
      rig.params[param.key] = 0;
    }
    renderParameterControls();
    draw();
    commitHistory("reset params");
  });
  elements.resetRig.addEventListener("click", () => {
    stopMotionPlayback(false);
    rig = createDefaultRig(currentCharacter || {});
    syncFormFromRig();
    draw();
    commitHistory("reset rig");
  });
  elements.autoMotion.addEventListener("change", () => {
    if (elements.autoMotion.checked) stopMotionPlayback(true);
    if (elements.autoMotion.checked && !animationFrame) {
      animationStartedAt = performance.now();
      animationFrame = requestAnimationFrame(tick);
    }
  });
  elements.showHitAreas.addEventListener("change", draw);
  for (const input of [
    elements.characterName,
    elements.nameColor,
    elements.portraitState,
    elements.faceCenterX,
    elements.faceCenterY,
    elements.profileZoom
  ]) {
    input.addEventListener("input", () => {
      updateRigFromForm();
      updateUrlForSelection();
      if (input === elements.portraitState) renderPortraitStateOptions(rig.portrait.state);
      draw();
      commitHistory("character settings");
    });
  }
  updateHistoryButtons();
}

bindEvents();
syncFormFromRig();
loadCharacters(initialCharacterId).catch((error) => {
  setStatus("Error", "error");
  showToast(error.message);
  draw();
});

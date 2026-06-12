export type BbcodeContextAction = {
  label: string;
  hint: string;
  open?: string;
  close?: string;
  kind?: "font_scale" | "font_scale_gradient";
  defaultScale?: number;
  fromScale?: number;
  toScale?: number;
  previewOpen?: string;
  previewClose?: string;
};

export type SpeedContextAction = {
  label: string;
  hint: string;
  open: string;
  close: string;
};

export type DialogueEventContextAction = {
  label: string;
  hint: string;
  insert?: string;
  fallback?: string;
  section?: "end";
  kind?: "sfx" | "bgm" | "background";
  tag?: "sfx" | "bgm" | "bg";
};

export const bbcodeContextActions: BbcodeContextAction[] = [
  { label: "볼드", hint: "b", open: "[b]", close: "[/b]" },
  { label: "이탤릭", hint: "i", open: "[i]", close: "[/i]" },
  { label: "밑줄", hint: "u", open: "[u]", close: "[/u]" },
  { label: "취소선", hint: "s", open: "[s]", close: "[/s]" },
  { label: "흔들림", hint: "shake", open: "[shake rate=22.0 level=6 connected=1]", close: "[/shake]" },
  { label: "반투명", hint: "alpha", open: "[alpha value=0.45]", close: "[/alpha]" },
  { label: "맥박", hint: "pulse", open: "[pulse freq=1.2 color=#ffffff40 ease=-2.0]", close: "[/pulse]" },
  { label: "점점커짐", hint: "grow", open: "[grow duration=1.05 from=0.78 to=1.34]", close: "[/grow]" },
  { label: "글자 작아짐", hint: "1->0.3", kind: "font_scale_gradient", fromScale: 1, toScale: 0.3 },
  { label: "글자 커짐", hint: "0.3->1", kind: "font_scale_gradient", fromScale: 0.3, toScale: 1 },
  { label: "커졌다 작아짐", hint: "grow 2x", open: "[grow duration=1.2 from=2.0 to=1.0]", close: "[/grow]", previewOpen: "[grow duration=1.2 from=1.55 to=1.0]" },
  { label: "깜빡임", hint: "blink", open: "[blink freq=3.4 min=0.14]", close: "[/blink]" },
  { label: "물결", hint: "wave", open: "[wave amp=28.0 freq=5.0 connected=1]", close: "[/wave]" },
  { label: "회오리", hint: "tornado", open: "[tornado radius=10.0 freq=1.0 connected=1]", close: "[/tornado]" },
  { label: "글자 배율", hint: "scale", kind: "font_scale", defaultScale: 2, previewOpen: "[font_scale=1.6]", previewClose: "[/font_scale]" },
  { label: "윤곽선", hint: "outline", open: "[outline_size=2][outline_color=#000000]", close: "[/outline_color][/outline_size]" },
  { label: "배경 강조", hint: "bgcolor", open: "[bgcolor=#2f2438]", close: "[/bgcolor]" },
  { label: "희미해짐", hint: "fade", open: "[fade]", close: "[/fade]" },
  { label: "무지개", hint: "rainbow", open: "[rainbow freq=1.0 sat=0.75 val=0.95 speed=0.7]", close: "[/rainbow]" }
];

export const speedContextActions: SpeedContextAction[] = [
  { label: "아주 느리게", hint: "x0.35", open: "[speed=0.35]", close: "[/speed]" },
  { label: "느리게", hint: "x0.6", open: "[speed=0.6]", close: "[/speed]" },
  { label: "빠르게", hint: "x1.8", open: "[speed=1.8]", close: "[/speed]" },
  { label: "아주 빠르게", hint: "x3.0", open: "[speed=3.0]", close: "[/speed]" }
];

export const eventContextActions: DialogueEventContextAction[] = [
  { label: "효과음 추가", hint: "sfx", kind: "sfx", tag: "sfx", fallback: '[sfx path="res://assets/story_assets/sfx/effect.wav"]' },
  { label: "배경음 시작", hint: "bgm", kind: "bgm", tag: "bgm", fallback: '[bgm path="res://assets/story_assets/bgm/music.ogg" fade=0.5]' },
  { label: "배경음 볼륨 조절", hint: "bgm_volume", insert: "[bgm_volume volume=0.5 fade=0.5]" },
  { label: "배경음 종료", hint: "bgm_stop", insert: "[bgm_stop fade=0.5]" },
  { label: "배경이미지 등장", hint: "bg", kind: "background", tag: "bg", fallback: '[bg path="res://assets/story_assets/background/background.png" transition=fade duration=0.5 opacity=1 blur=3 brightness=0.75 saturate=0.8 dim=0.15]' },
  { label: "배경이미지 변경", hint: "bg", kind: "background", tag: "bg", fallback: '[bg path="res://assets/story_assets/background/background_2.png" transition=fade duration=0.5 opacity=1 blur=3 brightness=0.75 saturate=0.8 dim=0.15]' },
  { label: "배경이미지 제거", hint: "bg_clear", insert: "[bg_clear transition=fade duration=0.5]" },
  { label: "대사 자동 넘기기", hint: "auto_next", insert: "[auto_next delay=0.35]", section: "end" }
];

export const dialogueContextColorPalette = [
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

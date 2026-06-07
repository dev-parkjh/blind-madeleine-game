import { useEffect, useMemo, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import type { ResourceSummary } from "../types";

export type DialogueTextContextKind = "dialogue" | "choice" | "statement";

export type DialogueTextContextTarget = {
  kind: DialogueTextContextKind;
  textarea: HTMLTextAreaElement | HTMLInputElement;
  getText: () => string;
  onTextChange: (nextText: string) => void;
  showStatementLie?: boolean;
};

export type DialogueTextContextMenuState = {
  x: number;
  y: number;
  target: DialogueTextContextTarget;
};

type BbcodeContextAction = {
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

type SpeedContextAction = {
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

const bbcodeContextActions: BbcodeContextAction[] = [
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

const speedContextActions: SpeedContextAction[] = [
  { label: "아주 느리게", hint: "x0.35", open: "[speed=0.35]", close: "[/speed]" },
  { label: "느리게", hint: "x0.6", open: "[speed=0.6]", close: "[/speed]" },
  { label: "빠르게", hint: "x1.8", open: "[speed=1.8]", close: "[/speed]" },
  { label: "아주 빠르게", hint: "x3.0", open: "[speed=3.0]", close: "[/speed]" }
];

const eventContextActions: DialogueEventContextAction[] = [
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

const dialogueBbcodeTagNames = new Set([
  "b", "i", "u", "s", "code", "font", "font_size", "font_scale", "color", "bgcolor", "fgcolor",
  "outline_size", "outline_color", "shake", "wave", "tornado", "pulse", "fade",
  "rainbow", "grow", "blink", "alpha", "lie",
  "speed", "text_speed", "type_speed", "typewriter_speed",
  "lb", "rb"
]);

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

function getDialogueBbcodeTagName(body: string) {
  const clean = String(body || "").trim();
  const slashIndex = clean.indexOf("/");
  const head = slashIndex >= 0 ? clean.slice(0, slashIndex) : clean;
  const spaceIndex = head.indexOf(" ");
  const name = (spaceIndex >= 0 ? head.slice(0, spaceIndex) : head).trim().toLowerCase();
  const equalIndex = name.indexOf("=");
  return equalIndex >= 0 ? name.slice(0, equalIndex) : name;
}

function tokenizeDialogueFontScaleGradientText(text: string) {
  const raw = String(text || "");
  const tokens: Array<{ text: string; visible: boolean }> = [];
  let index = 0;
  while (index < raw.length) {
    const char = raw[index];
    if (char === "[") {
      const closeIndex = raw.indexOf("]", index + 1);
      if (closeIndex >= 0) {
        const tag = raw.slice(index, closeIndex + 1);
        const tagName = getDialogueBbcodeTagName(tag.slice(1, -1));
        if (tagName === "lb" || tagName === "rb") {
          tokens.push({ text: tag, visible: true });
          index = closeIndex + 1;
          continue;
        }
        if (dialogueBbcodeTagNames.has(tagName)) {
          tokens.push({ text: tag, visible: false });
          index = closeIndex + 1;
          continue;
        }
      }
    }
    if (char === "\\" && index + 1 < raw.length) {
      const nextChar = raw[index + 1];
      if (nextChar === "|" || nextChar === "\\") {
        tokens.push({ text: raw.slice(index, index + 2), visible: true });
        index += 2;
        continue;
      }
    }
    if (char === "|") {
      tokens.push({ text: char, visible: false });
      index += 1;
      continue;
    }
    const [character] = Array.from(raw.slice(index));
    tokens.push({ text: character, visible: true });
    index += character.length;
  }
  return tokens;
}

function buildDialogueFontScaleGradientText(text: string, fromScale = 1, toScale = 0.3) {
  const tokens = tokenizeDialogueFontScaleGradientText(text);
  const visibleCount = tokens.reduce((count, token) => count + (token.visible ? 1 : 0), 0);
  if (visibleCount <= 0) return String(text || "");
  const normalizedFrom = normalizeDialogueFontScale(fromScale, 1);
  const normalizedTo = normalizeDialogueFontScale(toScale, 0.3);
  let visibleIndex = 0;
  return tokens.map((token) => {
    if (!token.visible) return token.text;
    const amount = visibleCount <= 1 ? 0 : visibleIndex / (visibleCount - 1);
    visibleIndex += 1;
    const scale = normalizedFrom + (normalizedTo - normalizedFrom) * amount;
    return `[font_scale=${formatDialogueFontScale(scale)}]${token.text}[/font_scale]`;
  }).join("");
}

function stripDialoguePreviewPauses(text: string) {
  return String(text || "").replace(/\|/g, "").replace(/\\[|\\]/g, "");
}

function dispatchTextareaInput(textarea: HTMLTextAreaElement | HTMLInputElement, inserted: string) {
  const event = typeof InputEvent === "function"
    ? new InputEvent("input", { bubbles: true, data: inserted, inputType: "insertText" })
    : new Event("input", { bubbles: true });
  textarea.dispatchEvent(event);
}

function insertTextWithTextareaUndo(
  textarea: HTMLTextAreaElement | HTMLInputElement | null,
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

  textarea.focus();
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
    textarea.focus();
    textarea.setSelectionRange(caret, caret);
  });
}

function wrapTextareaSelection(
  target: DialogueTextContextTarget,
  openTag: string,
  closeTag: string,
  onClose: () => void
) {
  const textarea = target.textarea;
  const currentText = target.getText();
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const selectedText = currentText.slice(start, end);
  const replacement = `${openTag}${selectedText}${closeTag}`;
  insertTextWithTextareaUndo(textarea, currentText, replacement, target.onTextChange);
  const selectionStart = start + openTag.length;
  window.requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(selectionStart, selectionStart + selectedText.length);
  });
  onClose();
}

export function insertDialogueTextAtTarget(target: DialogueTextContextTarget, text: string) {
  insertTextWithTextareaUndo(target.textarea, target.getText(), text, target.onTextChange);
}

function insertAtTextareaCursor(target: DialogueTextContextTarget, text: string, onClose: () => void) {
  insertDialogueTextAtTarget(target, text);
  onClose();
}

function handleEventContextAction(
  action: DialogueEventContextAction,
  target: DialogueTextContextTarget,
  onClose: () => void,
  onOpenStoryAssetPicker?: (action: DialogueEventContextAction, target: DialogueTextContextTarget) => void
) {
  if (action.kind && action.tag && onOpenStoryAssetPicker) {
    onOpenStoryAssetPicker(action, target);
    onClose();
    return;
  }
  insertAtTextareaCursor(target, action.insert || action.fallback || "", onClose);
}

function wrapTextareaSelectionWithFontScale(target: DialogueTextContextTarget, defaultScale = 2, onClose: () => void) {
  const fallback = Number.isFinite(Number(defaultScale)) ? Number(defaultScale) : 2;
  const raw = window.prompt("글자 배율을 입력하세요. 예: 2 = 두 배", formatDialogueFontScale(fallback));
  if (raw === null) return;
  const scale = normalizeDialogueFontScale(raw, fallback);
  wrapTextareaSelection(target, `[font_scale=${formatDialogueFontScale(scale)}]`, "[/font_scale]", onClose);
}

function wrapTextareaSelectionWithFontScaleGradient(
  target: DialogueTextContextTarget,
  fromScale = 1,
  toScale = 0.3,
  onClose: () => void
) {
  const from = formatDialogueFontScale(normalizeDialogueFontScale(fromScale, 1));
  const to = formatDialogueFontScale(normalizeDialogueFontScale(toScale, 0.3));
  wrapTextareaSelection(target, `[font_scale from=${from} to=${to}]`, "[/font_scale]", onClose);
}

function getTextareaSelectionState(target: DialogueTextContextTarget) {
  const textarea = target.textarea;
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  return {
    start,
    end,
    hasSelection: start !== end,
    selectedText: target.getText().slice(start, end)
  };
}

function positionContextMenu(clientX: number, clientY: number, menuWidth: number, menuHeight: number) {
  const margin = 10;
  return {
    x: Math.max(margin, Math.min(clientX, window.innerWidth - menuWidth - margin)),
    y: Math.max(margin, Math.min(clientY, window.innerHeight - menuHeight - margin))
  };
}

export function openDialogueTextContextMenu(
  event: ReactMouseEvent<HTMLTextAreaElement | HTMLInputElement>,
  target: Omit<DialogueTextContextTarget, "textarea">
) {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.focus();
  const textarea = event.currentTarget;
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const hasSelection = start !== end;
  const isEventOnlyMenu = target.kind !== "choice" && !hasSelection;
  const menuWidth = isEventOnlyMenu
    ? Math.min(320, window.innerWidth - 20)
    : Math.min(680, window.innerWidth - 20);
  const menuHeight = Math.min(window.innerHeight - 20, isEventOnlyMenu ? 360 : 520);
  const position = positionContextMenu(event.clientX, event.clientY, menuWidth, menuHeight);
  return {
    ...position,
    target: {
      ...target,
      textarea: event.currentTarget
    }
  } satisfies DialogueTextContextMenuState;
}

function isNarratorSpeaker(characterId: string) {
  const id = String(characterId || "").trim().toLowerCase();
  return !id || id === "narrator";
}

function buildEffectPreviewText(action: BbcodeContextAction, selectedText: string) {
  const sampleText = stripDialoguePreviewPauses(String(selectedText || "").trim()) || "샘플";
  if (action.kind === "font_scale_gradient") {
    return buildDialogueFontScaleGradientText(sampleText, action.fromScale, action.toScale);
  }
  const openTag = action.previewOpen || action.open || "";
  const closeTag = action.previewClose || action.close || "";
  return `${openTag}${sampleText}${closeTag}`;
}

export function useDialogueTextContextMenuDismiss(
  menu: DialogueTextContextMenuState | null,
  onClose: () => void
) {
  useEffect(() => {
    if (!menu) return undefined;

    const closeFromPointer = (event: PointerEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest(".dialogue-bbcode-context-menu")) return;
      onClose();
    };
    const closeFromKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const closeFromScroll = (event: Event) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest(".dialogue-bbcode-context-menu")) return;
      onClose();
    };

    window.addEventListener("pointerdown", closeFromPointer);
    window.addEventListener("keydown", closeFromKey);
    window.addEventListener("scroll", closeFromScroll, true);
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("pointerdown", closeFromPointer);
      window.removeEventListener("keydown", closeFromKey);
      window.removeEventListener("scroll", closeFromScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [menu, onClose]);
}

export function DialogueBbcodeContextMenu({
  menu,
  characters,
  renderEffectPreview,
  onClose,
  onOpenStoryAssetPicker
}: {
  menu: DialogueTextContextMenuState;
  characters: ResourceSummary[];
  renderEffectPreview: (text: string) => ReactNode;
  onClose: () => void;
  onOpenStoryAssetPicker?: (action: DialogueEventContextAction, target: DialogueTextContextTarget) => void;
}) {
  const { target } = menu;
  const selection = getTextareaSelectionState(target);
  const isChoiceTarget = target.kind === "choice";
  const showSelectionMenu = selection.hasSelection || isChoiceTarget;
  const showStatementLieAction = Boolean(selection.hasSelection && !isChoiceTarget && target.showStatementLie);
  const showEventMenu = !isChoiceTarget && !selection.hasSelection;

  const characterColorOptions = useMemo(
    () => characters
      .filter((character) => character.id && !isNarratorSpeaker(character.id))
      .slice()
      .sort((a, b) => String(a.title || a.id).localeCompare(String(b.title || b.id))),
    [characters]
  );

  const productionActions = eventContextActions.filter((action) => action.section !== "end");
  const endActions = eventContextActions.filter((action) => action.section === "end");

  const isEventOnlyMenu = showEventMenu && !showSelectionMenu;

  return (
    <div
      className={`dialogue-bbcode-context-menu${isEventOnlyMenu ? " event-only" : ""}`}
      role="menu"
      style={{ left: menu.x, top: menu.y }}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      <div className={`dialogue-bbcode-context-layout${isEventOnlyMenu ? " single-column" : ""}`}>
        <div className="dialogue-bbcode-context-primary">
          {showSelectionMenu && (
            <div className="dialogue-bbcode-context-section">
              {bbcodeContextActions.map((action) => (
                <button
                  className="dialogue-bbcode-context-item dialogue-bbcode-context-item--effect"
                  key={`${action.label}-${action.hint}`}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    if (action.kind === "font_scale") {
                      wrapTextareaSelectionWithFontScale(target, action.defaultScale, onClose);
                      return;
                    }
                    if (action.kind === "font_scale_gradient") {
                      wrapTextareaSelectionWithFontScaleGradient(target, action.fromScale, action.toScale, onClose);
                      return;
                    }
                    if (action.open && action.close) {
                      wrapTextareaSelection(target, action.open, action.close, onClose);
                    }
                  }}
                >
                  <span>{action.label}</span>
                  <span className="dialogue-bbcode-context-effect-preview" aria-hidden="true">
                    {renderEffectPreview(buildEffectPreviewText(action, selection.selectedText))}
                  </span>
                  <span className="dialogue-bbcode-context-hint">[{action.hint}]</span>
                </button>
              ))}
              {showStatementLieAction && (
                <>
                  <div className="dialogue-bbcode-context-separator" aria-hidden="true" />
                  <div className="dialogue-bbcode-context-section-label">진술</div>
                  <button
                    className="dialogue-bbcode-context-item"
                    role="menuitem"
                    type="button"
                    onClick={() => wrapTextareaSelection(target, "[lie]", "[/lie]", onClose)}
                  >
                    <span>거짓진술</span>
                    <span className="dialogue-bbcode-context-hint">[lie]</span>
                  </button>
                </>
              )}
              {!isChoiceTarget && (
                <>
                  <div className="dialogue-bbcode-context-separator" aria-hidden="true" />
                  <div className="dialogue-bbcode-context-section-label">대사 속도</div>
                  {speedContextActions.map((action) => (
                    <button
                      className="dialogue-bbcode-context-item"
                      key={`${action.label}-${action.hint}`}
                      role="menuitem"
                      type="button"
                      onClick={() => wrapTextareaSelection(target, action.open, action.close, onClose)}
                    >
                      <span>{action.label}</span>
                      <span className="dialogue-bbcode-context-hint">{action.hint}</span>
                    </button>
                  ))}
                </>
              )}
              <div className="dialogue-bbcode-context-separator" aria-hidden="true" />
              <div className="dialogue-bbcode-context-section-label">색상</div>
              <div className="dialogue-bbcode-color-grid">
                {dialogueContextColorPalette.map((item) => (
                  <button
                    className="dialogue-bbcode-color-button"
                    key={item.color}
                    role="menuitem"
                    title={item.label}
                    type="button"
                    onClick={() => wrapTextareaSelection(target, `[color=${item.color}]`, "[/color]", onClose)}
                  >
                    <span className="dialogue-bbcode-color-swatch" style={{ background: item.color }} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {showEventMenu && (
            <div className="dialogue-bbcode-context-section">
              <div className="dialogue-bbcode-context-section-label">연출</div>
              {productionActions.map((action) => (
                <button
                  className="dialogue-bbcode-context-item"
                  key={`${action.label}-${action.hint}`}
                  role="menuitem"
                  type="button"
                  onClick={() => handleEventContextAction(action, target, onClose, onOpenStoryAssetPicker)}
                >
                  <span>{action.label}</span>
                  <span className="dialogue-bbcode-context-hint">[{action.hint}]</span>
                </button>
              ))}
              <div className="dialogue-bbcode-context-separator" aria-hidden="true" />
              <div className="dialogue-bbcode-context-section-label">대사 종료</div>
              {endActions.map((action) => (
                <button
                  className="dialogue-bbcode-context-item"
                  key={`${action.label}-${action.hint}`}
                  role="menuitem"
                  type="button"
                  onClick={() => handleEventContextAction(action, target, onClose, onOpenStoryAssetPicker)}
                >
                  <span>{action.label}</span>
                  <span className="dialogue-bbcode-context-hint">[{action.hint}]</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {showSelectionMenu && (
          <div className="dialogue-bbcode-context-secondary">
            <div className="dialogue-bbcode-context-section-label">캐릭터 색상</div>
            <div className="dialogue-bbcode-character-color-list">
              {characterColorOptions.length > 0 ? characterColorOptions.map((character) => {
                const shortId = character.id.length > 8 ? `${character.id.slice(0, 8)}` : character.id;
                const color = String(character.nameColor || "#888888");
                return (
                  <button
                    className="dialogue-bbcode-character-color-button"
                    key={character.id}
                    role="menuitem"
                    title={character.id}
                    type="button"
                    onClick={() => wrapTextareaSelection(target, `[color=character:${character.id}]`, "[/color]", onClose)}
                  >
                    <span className="dialogue-bbcode-color-swatch" style={{ background: color }} />
                    <span className="dialogue-bbcode-character-color-name">{character.title}</span>
                    <span className="dialogue-bbcode-context-hint">{shortId}</span>
                  </button>
                );
              }) : (
                <div className="dialogue-bbcode-character-color-empty">캐릭터 없음</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

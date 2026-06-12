import { useMemo, type ReactNode } from "react";
import type { ResourceSummary } from "../types";
import {
  bbcodeContextActions,
  dialogueContextColorPalette,
  eventContextActions,
  speedContextActions,
  type BbcodeContextAction,
  type DialogueEventContextAction
} from "./dialogueTextContextActions";
import {
  buildDialogueFontScaleGradientText,
  formatDialogueFontScale,
  insertDialogueTextAtTarget,
  normalizeDialogueFontScale,
  stripDialoguePreviewPauses,
  wrapTextareaSelection
} from "./dialogueTextContextEditing";
import type {
  DialogueTextContextMenuState,
  DialogueTextContextTarget
} from "./dialogueTextContextTypes";

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

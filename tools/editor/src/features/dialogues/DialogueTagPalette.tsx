import type { CSSProperties } from "react";
import type { ReferenceResources } from "../../editorTypes";
import {
  parseRichTextPreviewAst,
  renderRichTextNodes,
  type TagAction,
  type TagActionCategory
} from "../../components/RichTextPreview";

export type { TagAction };

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
  { label: "Live2D 표정", hint: "live2d_pose", category: "motion", insert: "[live2d_pose tag=\"happy\"]" },
  { label: "Live2D 모션", hint: "live2d_motion", category: "motion", insert: "[live2d_motion clip=\"idle_loop\" loop=true]" },
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

export function DialogueTagPalette({
  references,
  onInsertColorTag,
  onInsertTag
}: {
  references: ReferenceResources;
  onInsertColorTag: (color: string) => void;
  onInsertTag: (action: TagAction) => void;
}) {
  return (
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
                <button className={`tag-action-button ${action.category}`} key={`${action.category}-${action.label}-${action.hint}`} type="button" onClick={() => onInsertTag(action)}>
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
                      onClick={() => onInsertColorTag(item.color)}
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
                        onClick={() => onInsertColorTag(`character:${character.id}`)}
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

import { useEffect, useState } from "react";
import { Icon, NumberField, SelectField, SelectLiteralField, TextField } from "../../components/EditorControls";
import { useUiText, type EditorCopy } from "../../editorText";
import type { ReferenceResources } from "../../editorTypes";
import { loadResource } from "../../lib/api";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord } from "../../types";
import { getLive2dMotions, live2dRecordForEditor } from "../characters/live2dModel";
import { NodePopupLayoutPreview } from "./NodePopupLayoutPreview";
import {
  getPopupCharacterId,
  normalizePopupSourceForEditor,
  parsePopupOffset,
  parsePopupSizePoint
} from "./dialoguePopupModel";

function portraitKeys(character: ResourceRecord | undefined): string[] {
  const portraits = character?.portraits && typeof character.portraits === "object"
    ? character.portraits as Record<string, ResourceRecord | string>
    : {};
  const live2d = live2dRecordForEditor(character?.live2d);
  const motionKeys = Object.keys(getLive2dMotions(live2d.motions));
  return Array.from(new Set([...Object.keys(portraits), ...motionKeys]));
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

export function NodePopupsEditor({
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
          const offset = parsePopupOffset(popup.offset);
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

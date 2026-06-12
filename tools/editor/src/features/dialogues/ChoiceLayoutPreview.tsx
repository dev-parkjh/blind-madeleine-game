import type { CSSProperties } from "react";
import type { PointerPoint } from "../../editorTypes";
import { getDialogueVisiblePreviewText } from "../../components/RichTextPreview";
import { clampNumber, formatNumberInput } from "../../lib/numeric";
import type { ResourceRecord } from "../../types";
import {
  gameCharacterLayerHeight,
  gameCharacterLayerWidth,
  gameDialoguePanelMinHeight,
  gameReferenceHeight,
  gameStageGapHeight,
  getPortraitAnchorRatios,
  getStageCastRecordLayoutOffset,
  normalizeCastPosition,
  portraitZoomDefault,
  portraitZoomMax,
  portraitZoomMin,
  snapPortraitZoomPercent
} from "./stageCastModel";

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

export function ChoiceLayoutPreview({ choices, node }: { choices: ResourceRecord[]; node: ResourceRecord }) {
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

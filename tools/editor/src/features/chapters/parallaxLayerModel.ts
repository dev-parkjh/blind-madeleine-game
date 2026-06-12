import {
  clamp01Number,
  clampNumber,
  normalizeNumber,
  normalizeRotationDegrees
} from "../../lib/numeric";
import { asArray } from "../../lib/resourceConfig";
import type { ResourceRecord } from "../../types";

export type ParallaxVisualEntry =
  | { type: "layer"; layer: ResourceRecord; index: number; order: number; depth: number }
  | { type: "title"; title: ResourceRecord; order: number; depth: number };

export const chapterThumbnailWidth = 1920;
export const chapterThumbnailHeight = 1080;

export function getParallaxLayerKind(layer: ResourceRecord) {
  return String(layer.kind ?? layer.type ?? "").trim().toLowerCase() === "background" ? "background" : "sprite";
}

export function getParallaxLayerEditorKind(layer: ResourceRecord) {
  const kind = String(layer.kind ?? layer.type ?? "sprite").trim().toLowerCase();
  return ["background", "sprite", "overlay", "title"].includes(kind) ? kind : "sprite";
}

export function getParallaxLayerDefaultLayout(kind: string) {
  return kind === "background"
    ? { x: 0.5, y: 0.5, scale: 1.08 }
    : { x: 0.64, y: 0.58, scale: 0.72 };
}

export function getParallaxLayerPath(layer: ResourceRecord) {
  return String(layer.path ?? layer.image ?? layer.texture ?? "");
}

export function getParallaxLayerPosition(layer: ResourceRecord): [number, number] {
  const raw = asArray<number>(layer.position);
  const defaults = getParallaxLayerDefaultLayout(getParallaxLayerKind(layer));
  const x = raw.length >= 2 ? raw[0] : layer.x;
  const y = raw.length >= 2 ? raw[1] : layer.y;
  return [
    clampNumber(x, -0.5, 1.5, defaults.x),
    clampNumber(y, -0.5, 1.5, defaults.y)
  ];
}

export function getParallaxLayerAnchor(layer: ResourceRecord): [number, number] {
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

export function getParallaxLayerScale(layer: ResourceRecord) {
  return clampNumber(layer.scale, 0.05, 3, getParallaxLayerDefaultLayout(getParallaxLayerKind(layer)).scale);
}

export function getParallaxLayerScaleX(layer: ResourceRecord) {
  const scale = getParallaxLayerScale(layer);
  return clampNumber(layer.scale_x ?? layer.scaleX ?? layer.width_scale ?? layer.widthScale, 0.05, 3, scale);
}

export function getParallaxLayerScaleY(layer: ResourceRecord) {
  const scale = getParallaxLayerScale(layer);
  return clampNumber(layer.scale_y ?? layer.scaleY ?? layer.height_scale ?? layer.heightScale, 0.05, 3, scale);
}

export function getParallaxLayerDepth(layer: ResourceRecord) {
  return clampNumber(layer.depth ?? layer.parallax, -2, 2, 0);
}

export function getParallaxLayerMotionStrength(layer: ResourceRecord) {
  return clampNumber(
    layer.motion_strength ?? layer.motionStrength ?? layer.motion ?? layer.shake_strength ?? layer.shakeStrength ?? layer.shake ?? layer.floating_strength ?? layer.floatingStrength,
    0,
    4,
    1
  );
}

export function getParallaxLayerMotionDepth(layer: ResourceRecord) {
  return layer.floating === false ? 0 : getParallaxLayerDepth(layer) * getParallaxLayerMotionStrength(layer);
}

export function getParallaxLayerMotionPerspective(layer: ResourceRecord) {
  return layer.floating === false ? 0 : clampNumber(layer.perspective, -1, 1, 0);
}

export function getParallaxTitleDepth(title: ResourceRecord) {
  return Boolean(title.floating) ? clampNumber(title.depth, -2, 2, 0.1) : 0;
}

export function getParallaxVisualEntries(layers: ResourceRecord[], parallax: ResourceRecord) {
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

export function getParallaxOverlayLayout(parallax: ResourceRecord) {
  const overlay = parallax.overlay && typeof parallax.overlay === "object" ? parallax.overlay as ResourceRecord : {};
  return {
    enabled: Boolean(overlay.enabled),
    path: String(overlay.path || ""),
    opacity: clampNumber(overlay.opacity, 0, 1, 0.55)
  };
}

export function getParallaxTitleLayout(parallax: ResourceRecord) {
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

export function parallaxLayerTransformSummary(layer: ResourceRecord | undefined) {
  if (!layer) return "no layer";
  const anchor = getParallaxLayerAnchor(layer);
  return [
    `anchor ${anchor[0].toFixed(2)},${anchor[1].toFixed(2)}`,
    `scale ${normalizeNumber(layer.scale, 1, 0.05, 4).toFixed(2)}`,
    `rot ${normalizeRotationDegrees(layer.rotation).toFixed(1)}deg`
  ].join(" · ");
}

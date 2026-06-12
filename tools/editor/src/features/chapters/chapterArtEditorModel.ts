import type { ResourceRecord } from "../../types";

export function clampListIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, Number.isFinite(index) ? Math.round(index) : 0));
}

export function createDefaultParallaxLayer(index: number): ResourceRecord {
  return {
    id: `sprite_${index + 1}`,
    name: "새 레이어",
    kind: "sprite",
    path: "",
    position: [0.5, 0.5],
    anchor: [0.5, 0.5],
    order: index,
    scale: 1,
    rotation: 0,
    depth: 0.3,
    perspective: 0,
    opacity: 1,
    floating: true,
    motion_strength: 1,
    visible: true
  };
}

import type { WheelEvent as ReactWheelEvent } from "react";
import { clampNumber, getParallaxWheelScaleDelta, roundForInput } from "../../lib/numeric";
import type { ResourceRecord } from "../../types";
import { getParallaxLayerScale, getParallaxTitleLayout } from "./chapterArtModel";
import type { ParallaxVisualDragContext } from "./parallaxVisualDragTypes";

export function handleParallaxStageWheel(
  event: ReactWheelEvent<HTMLElement>,
  parallax: ResourceRecord,
  context: ParallaxVisualDragContext
) {
  if (!event.ctrlKey) return;
  const scaleDelta = getParallaxWheelScaleDelta(event.deltaY);
  if (scaleDelta === 0) return;
  if (context.selectedVisualTarget === "title") {
    const title = getParallaxTitleLayout(parallax);
    const nextScale = roundForInput(clampNumber(clampNumber(title.scale, 0.2, 2.4, 1) + scaleDelta, 0.2, 2.4));
    context.onChangeTitleLayout({ scale: nextScale, scale_x: nextScale, scale_y: nextScale });
  } else {
    const layer = context.layers[context.selectedLayerIndex];
    if (!layer) return;
    const nextScale = roundForInput(clampNumber(getParallaxLayerScale(layer) + scaleDelta, 0.05, 3));
    context.onChangeLayer(context.selectedLayerIndex, { scale: nextScale, scale_x: nextScale, scale_y: nextScale });
  }
  event.preventDefault();
  event.stopPropagation();
}

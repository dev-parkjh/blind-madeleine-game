import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import type { PointerPoint } from "../../editorTypes";
import { clampNumber, normalizeNumber } from "../../lib/numeric";
import { resPathToAssetUrl } from "../../lib/resourcePaths";
import type { ResourceRecord } from "../../types";
import {
  getLive2dMotionPartEntry,
  getLive2dMotionParts,
  getLive2dPoint,
  live2dMotionFrequencyDefault,
  live2dMotionSpeedDefault
} from "./live2dModel";

export function Live2dPartsPreview({
  canvasSize,
  motion = {},
  motionKey = "",
  parts,
  playing = false,
  resetToken = 0
}: {
  canvasSize: PointerPoint;
  motion?: ResourceRecord;
  motionKey?: string;
  parts: ResourceRecord[];
  playing?: boolean;
  resetToken?: number;
}) {
  const [time, setTime] = useState(0);
  const [imageSizes, setImageSizes] = useState<Record<string, PointerPoint>>({});
  const visibleParts = [...parts]
    .filter((part) => String(part.path || "").trim())
    .sort((a, b) => Number(a.z_index ?? a.order ?? 0) - Number(b.z_index ?? b.order ?? 0));
  const frameStyle = {
    aspectRatio: `${Math.max(canvasSize.x, 1)} / ${Math.max(canvasSize.y, 1)}`
  } as CSSProperties;
  const motionParts = getLive2dMotionParts(motion.parts);
  const speed = normalizeNumber(motion.speed, live2dMotionSpeedDefault, 0.1, 5);

  useEffect(() => {
    setTime(0);
  }, [motionKey, resetToken]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let cancelled = false;
    const start = performance.now();
    const initialTime = time;
    function tick(now: number) {
      if (cancelled) return;
      setTime(initialTime + ((now - start) / 1000) * speed);
      frame = window.requestAnimationFrame(tick);
    }
    frame = window.requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [playing, speed, motionKey, resetToken]);

  function rememberImageSize(path: string, image: HTMLImageElement) {
    if (!path || image.naturalWidth <= 0 || image.naturalHeight <= 0) return;
    const current = imageSizes[path];
    if (current?.x === image.naturalWidth && current?.y === image.naturalHeight) return;
    setImageSizes((sizes) => ({
      ...sizes,
      [path]: { x: image.naturalWidth, y: image.naturalHeight }
    }));
  }

  return (
    <div className="live2d-preview">
      <div className="live2d-preview-frame" style={frameStyle}>
        {visibleParts.length === 0 && <span>Live2D parts preview</span>}
        {visibleParts.map((part, index) => {
          const path = String(part.path || "");
          const position = getLive2dPoint(part.position, canvasSize.x * 0.5, canvasSize.y * 0.5);
          const anchor = getLive2dPoint(part.anchor, 0.5, 0.5);
          const scale = getLive2dPoint(part.scale, 1, 1);
          const skew = getLive2dPoint(part.skew, 0, 0);
          const partId = String(part.id || "").trim();
          const entry = getLive2dMotionPartEntry({ parts: motionParts }, partId);
          const frequency = normalizeNumber(entry.frequency, live2dMotionFrequencyDefault, 0.1, 5);
          const phase = normalizeNumber(entry.phase, 0, 0, Math.PI * 2);
          const wave = Math.sin(time * Math.PI * 2 * frequency + phase);
          const motionX = normalizeNumber(entry.x, 0, -300, 300) * wave;
          const motionY = normalizeNumber(entry.y, 0, -300, 300) * wave;
          const motionRotation = normalizeNumber(entry.rotation, 0, -45, 45) * wave;
          const motionScale = normalizeNumber(entry.scale, 0, 0, 0.5) * wave;
          const opacity = clampNumber(
            normalizeNumber(part.opacity ?? part.alpha, 1, 0, 1) + normalizeNumber(entry.opacity, 0, -1, 1) * wave,
            0,
            1,
            1
          );
          const imageSize = imageSizes[path];
          const left = `${((position.x + motionX) / Math.max(canvasSize.x, 1)) * 100}%`;
          const top = `${((position.y + motionY) / Math.max(canvasSize.y, 1)) * 100}%`;
          const transform = `translate(${-anchor.x * 100}%, ${-anchor.y * 100}%) rotate(${normalizeNumber(part.rotation, 0) + motionRotation}deg) skew(${normalizeNumber(skew.x, 0)}deg, ${normalizeNumber(skew.y, 0)}deg) scale(${Math.max(0.01, scale.x + motionScale)}, ${Math.max(0.01, scale.y + motionScale)})`;
          return (
            <img
              alt=""
              key={`${part.id || "part"}-${index}`}
              src={resPathToAssetUrl(path)}
              onLoad={(event) => rememberImageSize(path, event.currentTarget)}
              style={{
                height: imageSize ? "auto" : undefined,
                left,
                opacity,
                top,
                transform,
                width: imageSize ? `${(imageSize.x / Math.max(canvasSize.x, 1)) * 100}%` : undefined,
                zIndex: Number(part.z_index ?? part.order ?? index)
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

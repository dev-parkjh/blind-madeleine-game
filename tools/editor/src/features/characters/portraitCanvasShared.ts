export const profileCropCanvasSize = 220;
export const portraitCenterCanvasWidth = 300;
export const portraitCenterCanvasHeight = 380;
export const portraitCenterZoomDefault = 1;
export const portraitCenterZoomMin = 0.5;
export const portraitCenterZoomMax = 5;
export const portraitCenterZoomStep = 0.5;
export const portraitEditorCanvasWidth = 300;
export const portraitEditorCanvasHeight = 380;

export function setupSquareCanvas(canvas: HTMLCanvasElement, logicalSize: number) {
  const cssWidth = Math.max(1, Math.round(canvas.clientWidth || logicalSize));
  const pixelRatio = window.devicePixelRatio || 1;
  const backingSize = Math.max(1, Math.round(cssWidth * pixelRatio));
  if (canvas.width !== backingSize || canvas.height !== backingSize) {
    canvas.width = backingSize;
    canvas.height = backingSize;
  }
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context를 생성할 수 없습니다.");
  const scale = backingSize / logicalSize;
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.imageSmoothingEnabled = false;
  return context;
}

export function setupFixedCanvas(canvas: HTMLCanvasElement, logicalWidth: number, logicalHeight: number) {
  const cssWidth = Math.max(1, Math.round(canvas.clientWidth || logicalWidth));
  const cssHeight = Math.max(1, Math.round(canvas.clientHeight || cssWidth * (logicalHeight / logicalWidth)));
  const pixelRatio = window.devicePixelRatio || 1;
  const backingWidth = Math.max(1, Math.round(cssWidth * pixelRatio));
  const backingHeight = Math.max(1, Math.round(cssHeight * pixelRatio));
  if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
    canvas.width = backingWidth;
    canvas.height = backingHeight;
  }
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context를 생성할 수 없습니다.");
  context.setTransform(backingWidth / logicalWidth, 0, 0, backingHeight / logicalHeight, 0, 0);
  context.imageSmoothingEnabled = false;
  return context;
}

export function normalizeCanvasColor(value: string, fallback: string) {
  return /^#[0-9a-f]{3,8}$/i.test(String(value || "").trim()) ? String(value).trim() : fallback;
}

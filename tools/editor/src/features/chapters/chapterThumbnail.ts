import { uploadProjectFile } from "../../lib/api";
import { safeSegment } from "../../lib/files";
import { loadImageElement } from "../../lib/imageLoading";
import { clampNumber, normalizeNumber, normalizeRotationDegrees } from "../../lib/numeric";
import { asArray } from "../../lib/resourceConfig";
import { resPathToAssetUrl } from "../../lib/resourcePaths";
import type { ResourceRecord } from "../../types";
import {
  chapterThumbnailHeight,
  chapterThumbnailWidth,
  getParallaxLayerAnchor,
  getParallaxLayerDepth,
  getParallaxLayerKind,
  getParallaxLayerPath,
  getParallaxLayerPosition,
  getParallaxLayerScaleX,
  getParallaxLayerScaleY
} from "./chapterArtModel";

export type ChapterArtUploadResult = {
  relativePath?: string;
  resPath: string;
  bytes?: number;
  importStatus?: { ok: boolean; error: string };
};

export type ProjectAssetUploader = (relativePath: string, file: File) => Promise<ChapterArtUploadResult>;

export async function uploadChapterThumbnailForDraft(
  chapter: ResourceRecord,
  uploadAsset: ProjectAssetUploader = uploadProjectFile
) {
  const layers = getChapterThumbnailLayers(chapter);
  if (layers.length === 0) {
    return { skipped: true, draft: chapter, resPath: "" };
  }

  const blob = await renderChapterThumbnailBlob(layers);
  const file = new File([blob], "thumbnail.png", { type: "image/png" });
  const result = await uploadAsset(chapterThumbnailRelativePath(chapter), file);
  return {
    skipped: false,
    draft: { ...chapter, image: result.resPath },
    resPath: result.resPath,
    importStatus: result.importStatus
  };
}

function chapterThumbnailRelativePath(chapter: ResourceRecord) {
  return `assets/chapters/${safeSegment(chapter.id || "chapter", "chapter")}/thumbnail.png`;
}

function getChapterThumbnailLayers(chapter: ResourceRecord) {
  const parallax = chapter.parallax && typeof chapter.parallax === "object" ? chapter.parallax as ResourceRecord : null;
  return asArray<ResourceRecord>(parallax?.layers)
    .map((layer, index) => ({ layer, index }))
    .sort((a, b) => {
      const depthDelta = getParallaxLayerDepth(a.layer) - getParallaxLayerDepth(b.layer);
      if (Math.abs(depthDelta) > 0.0001) return depthDelta;
      const orderDelta = normalizeNumber(a.layer.order, a.index) - normalizeNumber(b.layer.order, b.index);
      return orderDelta !== 0 ? orderDelta : a.index - b.index;
    })
    .map((entry) => entry.layer);
}

async function renderChapterThumbnailBlob(layers: ResourceRecord[]) {
  const canvas = document.createElement("canvas");
  canvas.width = chapterThumbnailWidth;
  canvas.height = chapterThumbnailHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context를 생성할 수 없습니다.");

  context.clearRect(0, 0, canvas.width, canvas.height);

  for (const layer of layers) {
    const layerPath = getParallaxLayerPath(layer);
    if (layer.visible === false || layer.thumbnail_excluded === true || !layerPath) continue;
    const url = resPathToAssetUrl(layerPath);
    if (!url) continue;

    const image = await loadImageElement(url);
    const kind = getParallaxLayerKind(layer);
    const position = getParallaxLayerPosition(layer);
    const anchor = getParallaxLayerAnchor(layer);
    const px = position[0];
    const py = position[1];
    const anchorX = anchor[0];
    const anchorY = anchor[1];
    const scaleX = getParallaxLayerScaleX(layer);
    const scaleY = getParallaxLayerScaleY(layer);
    const sourceWidth = image.naturalWidth || image.width || 1;
    const sourceHeight = image.naturalHeight || image.height || 1;
    let width: number;
    let height: number;

    if (kind === "background") {
      const coverScale = Math.max(canvas.width / sourceWidth, canvas.height / sourceHeight);
      width = sourceWidth * coverScale * scaleX;
      height = sourceHeight * coverScale * scaleY;
    } else {
      height = canvas.height * scaleY;
      width = canvas.height * scaleX * (sourceWidth / sourceHeight);
    }

    context.save();
    context.globalAlpha = clampNumber(layer.opacity, 0, 1, 1);
    context.translate(canvas.width * px, canvas.height * py);
    context.rotate((kind === "background" ? 0 : normalizeRotationDegrees(layer.rotation)) * Math.PI / 180);
    context.drawImage(image, -width * anchorX, -height * anchorY, width, height);
    context.restore();
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("썸네일 이미지를 생성할 수 없습니다."));
    }, "image/png");
  });
}

import { useEffect, useState } from "react";
import { mediaPreviewStatusLabel, type AssetPreviewStatus } from "../../components/mediaPreviewStatus";
import { resPathToAssetUrl } from "../../lib/resourcePaths";

export function ItemImagePreview({ imagePath }: { imagePath: unknown }) {
  const imageUrl = resPathToAssetUrl(imagePath);
  const [status, setStatus] = useState<AssetPreviewStatus>(imageUrl ? "loading" : "idle");

  useEffect(() => {
    setStatus(imageUrl ? "loading" : "idle");
  }, [imageUrl]);

  return (
    <div className={`wide asset-preview-box square ${status === "error" ? "error" : ""}`}>
      {imageUrl && status !== "error" ? (
        <img alt="" onError={() => setStatus("error")} onLoad={() => setStatus("loaded")} src={imageUrl} />
      ) : (
        <span>{imagePath ? "이미지를 불러올 수 없습니다" : "아이템 사진 없음"}</span>
      )}
      {imageUrl && <span className={`asset-preview-status ${status}`}>{mediaPreviewStatusLabel(status, "image")}</span>}
    </div>
  );
}

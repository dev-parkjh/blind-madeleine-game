import { useEffect, useState } from "react";
import { mediaPreviewStatusLabel, type AssetPreviewStatus } from "../../components/mediaPreviewStatus";
import { resPathToAssetUrl } from "../../lib/resourcePaths";
import type { ResourceRecord } from "../../types";

export function StoryAssetMediaPreview({ asset, kind }: { asset: ResourceRecord; kind: string }) {
  const url = resPathToAssetUrl(asset.path);
  const [status, setStatus] = useState<AssetPreviewStatus>(url ? "loading" : "idle");

  useEffect(() => {
    setStatus(url ? "loading" : "idle");
  }, [url, kind]);

  return (
    <div className={`wide asset-preview-box ${status === "error" ? "error" : ""}`}>
      {!url ? (
        <span>{asset.path ? "에셋 경로 확인 필요" : "에셋 없음"}</span>
      ) : kind === "background" ? (
        status === "error" ? (
          <span>배경 이미지를 불러올 수 없습니다</span>
        ) : (
          <img alt="" onError={() => setStatus("error")} onLoad={() => setStatus("loaded")} src={url} />
        )
      ) : (
        <div className="asset-audio-preview">
          <span>{kind === "bgm" ? "BGM 미리듣기" : "SFX 미리듣기"}</span>
          <audio controls onError={() => setStatus("error")} onLoadedMetadata={() => setStatus("loaded")} preload="metadata" src={url} />
          {status === "error" && <b>오디오를 불러올 수 없습니다</b>}
        </div>
      )}
      {url && <span className={`asset-preview-status ${status}`}>{mediaPreviewStatusLabel(status, kind === "background" ? "image" : "audio")}</span>}
    </div>
  );
}

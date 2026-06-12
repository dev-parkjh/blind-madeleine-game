export type AssetPreviewStatus = "idle" | "loading" | "loaded" | "error";

export function mediaPreviewStatusLabel(status: AssetPreviewStatus, mediaType: "image" | "audio") {
  if (status === "loading") return mediaType === "image" ? "이미지 불러오는 중..." : "오디오 메타데이터 확인 중...";
  if (status === "loaded") return mediaType === "image" ? "이미지 로드됨" : "오디오 로드됨";
  if (status === "error") return mediaType === "image" ? "이미지 로드 실패" : "오디오 로드 실패";
  return "";
}

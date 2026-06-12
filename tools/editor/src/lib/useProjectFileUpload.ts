import type { MutableRefObject } from "react";
import { uploadProjectFile } from "./api";
import {
  formatGodotImportStatus,
  triggerGodotImport,
  type ProjectAssetUploadResult
} from "./godotBridge";

export function useProjectFileUpload({
  bridgeEndpoint,
  notify,
  pendingTaskRef,
  runPendingTask
}: {
  bridgeEndpoint: string;
  notify: (message: string) => void;
  pendingTaskRef: MutableRefObject<boolean>;
  runPendingTask: <T>(label: string, task: () => Promise<T>) => Promise<T>;
}) {
  async function uploadFile(relativePath: string, file: File) {
    if (pendingTaskRef.current) {
      throw new Error("다른 작업이 진행 중입니다.");
    }
    const result = await runPendingTask("업로드/import 중", async () => uploadFileAndImport(relativePath, file));
    notify(`업로드 완료: ${result.resPath} · ${formatGodotImportStatus(result.importStatus)}`);
    return result.resPath;
  }

  async function uploadFileAndImport(relativePath: string, file: File): Promise<ProjectAssetUploadResult> {
    const result = await uploadProjectFile(relativePath, file);
    const importStatus = await triggerGodotImport(bridgeEndpoint, [result.resPath]);
    return { ...result, importStatus };
  }

  return { uploadFile, uploadFileAndImport };
}

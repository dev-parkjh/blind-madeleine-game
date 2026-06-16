import type { MutableRefObject } from "react";
import type { EditorLanguage } from "../editorTypes";
import type { ResourceRecord } from "../types";
import {
  finishPlayInCurrentTab,
  finishPlayWindow,
  isMobilePlayWindowTarget,
  openPlayWindow,
  prepareFullGamePlayUrl,
  reportPlayFailure
} from "./godotBridge";

export function useGameRunner({
  bridgeEndpoint,
  bridgeRequiredMessage,
  dirty,
  jsonError,
  language,
  notify,
  pendingTaskRef,
  runPendingTask,
  saveSelectedDraft
}: {
  bridgeEndpoint: string;
  bridgeRequiredMessage: string;
  dirty: boolean;
  jsonError: unknown;
  language: EditorLanguage;
  notify: (message: string) => void;
  pendingTaskRef: MutableRefObject<boolean>;
  runPendingTask: <T>(label: string, task: () => Promise<T>) => Promise<T>;
  saveSelectedDraft: (notifySuccess?: boolean) => Promise<{ data: ResourceRecord; id: string }>;
}) {
  async function runGameFromEditor() {
    if (pendingTaskRef.current || jsonError) return;
    if (dirty) {
      const confirmed = window.confirm(language === "ko"
        ? "저장하지 않은 편집 내용이 있습니다. 저장 후 1회 빌드하여 게임을 실행할까요?"
        : "There are unsaved editor changes. Save them, build once, and run the game?");
      if (!confirmed) return;
    }
    const runInCurrentTab = isMobilePlayWindowTarget();
    const playWindow = runInCurrentTab ? null : openPlayWindow(language, notify);
    if (!runInCurrentTab && !playWindow) return;
    try {
      await runPendingTask(language === "ko" ? "저장 후 빌드 중" : "Saving and building", async () => {
        if (dirty) await saveSelectedDraft(false);
        const url = await prepareFullGamePlayUrl(bridgeEndpoint, bridgeRequiredMessage);
        if (runInCurrentTab) {
          finishPlayInCurrentTab(url);
        } else if (playWindow) {
          finishPlayWindow(playWindow, url);
          notify(language === "ko" ? "게임 창을 열었습니다." : "Opened the game window.");
        }
      });
    } catch (error) {
      if (playWindow) {
        reportPlayFailure(language, notify, playWindow, error);
      } else {
        const message = error instanceof Error ? error.message : String(error || "");
        notify(`${language === "ko" ? "실행 실패" : "Play failed"}: ${message}`);
      }
    }
  }

  return { runGameFromEditor };
}

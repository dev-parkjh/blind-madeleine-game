import { useCallback, useRef, useState } from "react";

export function usePendingTask() {
  const pendingTaskRef = useRef(false);
  const [pendingTaskLabel, setPendingTaskLabel] = useState("");
  const runPendingTask = useCallback(async <T,>(label: string, task: () => Promise<T>) => {
    if (pendingTaskRef.current) {
      throw new Error("다른 작업이 진행 중입니다.");
    }
    pendingTaskRef.current = true;
    setPendingTaskLabel(label);
    try {
      return await task();
    } finally {
      pendingTaskRef.current = false;
      setPendingTaskLabel("");
    }
  }, []);

  return {
    isPendingTask: Boolean(pendingTaskLabel),
    pendingTaskLabel,
    pendingTaskRef,
    runPendingTask
  };
}

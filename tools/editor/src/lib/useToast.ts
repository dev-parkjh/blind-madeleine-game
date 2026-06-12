import { useCallback, useState } from "react";

export function useToast(timeoutMs = 2200) {
  const [toast, setToast] = useState("");
  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast((current) => current === message ? "" : current), timeoutMs);
  }, [timeoutMs]);

  return { notify, toast };
}

import { useEffect, useRef, type MutableRefObject } from "react";
import { editorBackGuardStateKey } from "./editorPreferences";

export function useEditorNavigationGuard(dirty: boolean, pendingTaskRef: MutableRefObject<boolean>) {
  const dirtyRef = useRef(false);

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  useEffect(() => {
    function confirmLeaveEditor() {
      if (pendingTaskRef.current) {
        return window.confirm("작업이 진행 중입니다. 페이지를 나갈까요?");
      }
      if (dirtyRef.current) {
        return window.confirm("저장하지 않은 변경이 있습니다. 페이지를 나갈까요?");
      }
      return window.confirm("에디터 페이지를 나갈까요?");
    }

    const pushGuardState = () => {
      const currentState = window.history.state && typeof window.history.state === "object"
        ? window.history.state as Record<string, unknown>
        : {};
      window.history.pushState({ ...currentState, [editorBackGuardStateKey]: true }, "", window.location.href);
    };

    if (!(window.history.state && typeof window.history.state === "object" && window.history.state[editorBackGuardStateKey])) {
      pushGuardState();
    }

    const onPopState = () => {
      if (confirmLeaveEditor()) {
        window.removeEventListener("popstate", onPopState);
        window.history.back();
        return;
      }
      pushGuardState();
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current && !pendingTaskRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [pendingTaskRef]);
}

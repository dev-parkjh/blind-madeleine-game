import { useEffect, useRef, useState } from "react";
import { Icon } from "./EditorControls";

export function useMobileDragLock() {
  const manuallyChangedRef = useRef(false);
  const [available, setAvailable] = useState(false);
  const [rawLocked, setRawLocked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const query = window.matchMedia("(pointer: coarse), (max-width: 860px)");
    const sync = () => {
      setAvailable(query.matches);
      setRawLocked((current) => manuallyChangedRef.current ? current : query.matches);
    };
    sync();
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", sync);
      return () => query.removeEventListener("change", sync);
    }
    query.addListener(sync);
    return () => query.removeListener(sync);
  }, []);

  return {
    available,
    locked: available && rawLocked,
    toggle: () => {
      manuallyChangedRef.current = true;
      setRawLocked((current) => !current);
    }
  };
}

export function DragLockToggle({
  available,
  locked,
  onToggle
}: {
  available: boolean;
  locked: boolean;
  onToggle: () => void;
}) {
  if (!available) return null;
  return (
    <button
      aria-label={locked ? "드래그 이동 잠금 켜짐" : "드래그 이동 잠금 꺼짐"}
      aria-pressed={locked}
      className={`drag-lock-toggle ${locked ? "locked" : "unlocked"}`}
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <Icon name={locked ? "Lock" : "LockOpen"} />
      <span>이동 잠금</span>
    </button>
  );
}

export function DragLockHint({
  available,
  locked,
  onToggle
}: {
  available: boolean;
  locked: boolean;
  onToggle: () => void;
}) {
  if (!available || !locked) return null;
  return (
    <button
      aria-label="드래그 이동 잠금 켜짐"
      aria-pressed={true}
      className="drag-lock-hint"
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <Icon name="Lock" />
      이동 잠금
    </button>
  );
}

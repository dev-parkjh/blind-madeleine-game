import { useEffect, type MouseEvent as ReactMouseEvent } from "react";
import { focusWithoutScroll } from "./focusWithoutScroll";
import type {
  DialogueTextContextMenuState,
  DialogueTextContextTarget
} from "./dialogueTextContextTypes";

function positionContextMenu(clientX: number, clientY: number, menuWidth: number, menuHeight: number) {
  const margin = 10;
  return {
    x: Math.max(margin, Math.min(clientX, window.innerWidth - menuWidth - margin)),
    y: Math.max(margin, Math.min(clientY, window.innerHeight - menuHeight - margin))
  };
}

export function openDialogueTextContextMenu(
  event: ReactMouseEvent<HTMLTextAreaElement | HTMLInputElement>,
  target: Omit<DialogueTextContextTarget, "textarea">
) {
  event.preventDefault();
  event.stopPropagation();
  focusWithoutScroll(event.currentTarget);
  const textarea = event.currentTarget;
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const hasSelection = start !== end;
  const isEventOnlyMenu = target.kind !== "choice" && !hasSelection;
  const menuWidth = isEventOnlyMenu
    ? Math.min(320, window.innerWidth - 20)
    : Math.min(680, window.innerWidth - 20);
  const menuHeight = Math.min(window.innerHeight - 20, isEventOnlyMenu ? 360 : 520);
  const position = positionContextMenu(event.clientX, event.clientY, menuWidth, menuHeight);
  return {
    ...position,
    target: {
      ...target,
      textarea: event.currentTarget
    }
  } satisfies DialogueTextContextMenuState;
}

export function useDialogueTextContextMenuDismiss(
  menu: DialogueTextContextMenuState | null,
  onClose: () => void
) {
  useEffect(() => {
    if (!menu) return undefined;

    const closeFromPointer = (event: PointerEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest(".dialogue-bbcode-context-menu")) return;
      onClose();
    };
    const closeFromKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const closeFromScroll = (event: Event) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest(".dialogue-bbcode-context-menu")) return;
      onClose();
    };

    window.addEventListener("pointerdown", closeFromPointer);
    window.addEventListener("keydown", closeFromKey);
    window.addEventListener("scroll", closeFromScroll, true);
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("pointerdown", closeFromPointer);
      window.removeEventListener("keydown", closeFromKey);
      window.removeEventListener("scroll", closeFromScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [menu, onClose]);
}

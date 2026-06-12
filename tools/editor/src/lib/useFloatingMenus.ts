import { useEffect, type MutableRefObject } from "react";

export function useFloatingMenus(...menus: Array<MutableRefObject<HTMLDetailsElement | null>>) {
  useEffect(() => {
    function closeMenu(menu: MutableRefObject<HTMLDetailsElement | null>) {
      if (menu.current?.open) menu.current.open = false;
    }

    function closeFloatingMenus() {
      menus.forEach(closeMenu);
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      for (const menu of menus) {
        const element = menu.current;
        if (element?.open && !element.contains(target)) closeMenu(menu);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeFloatingMenus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", closeFloatingMenus, true);
    window.addEventListener("wheel", closeFloatingMenus, { capture: true, passive: true });
    window.addEventListener("touchmove", closeFloatingMenus, { capture: true, passive: true });
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", closeFloatingMenus, true);
      window.removeEventListener("wheel", closeFloatingMenus, true);
      window.removeEventListener("touchmove", closeFloatingMenus, true);
    };
  }, menus);
}

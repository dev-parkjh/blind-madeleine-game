export function focusWithoutScroll(element: HTMLElement) {
  try {
    element.focus({ preventScroll: true });
  } catch {
    element.focus();
  }
}

export function blurFocusedFieldForContainerWheel(
  container: HTMLElement,
  deltaY: number
) {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !container.contains(active)) return;

  if (active instanceof HTMLTextAreaElement && active.scrollHeight > active.clientHeight + 1) {
    const atTop = active.scrollTop <= 0;
    const atBottom = active.scrollTop + active.clientHeight >= active.scrollHeight - 1;
    if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) return;
  }

  active.blur();
}

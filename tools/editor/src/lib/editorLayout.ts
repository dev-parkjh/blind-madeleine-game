export function isMobileEditorLayout() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 860px)").matches;
}

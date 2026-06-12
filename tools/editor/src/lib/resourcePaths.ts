export function resPathToAssetUrl(value: unknown) {
  const path = String(value || "").trim();
  if (!path.startsWith("res://assets/")) return "";
  return `/repo/${path.replace(/^res:\/\//, "")}`;
}

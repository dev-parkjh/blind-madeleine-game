export function normalizeSingleId(value: unknown) {
  return String(value || "").trim();
}

export function normalizeIdList(value: unknown) {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? [value]
      : [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const raw of source) {
    const id = String(raw || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export function shortId(id: string) {
  return id.length > 10 ? `${id.slice(0, 6)}...` : id;
}

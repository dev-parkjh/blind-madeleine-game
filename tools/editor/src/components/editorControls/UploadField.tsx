import type { ChangeEvent } from "react";
import { useState } from "react";
import { useUiText } from "../../editorText";

export function UploadField({
  disabled = false,
  label,
  accept,
  onUpload
}: {
  disabled?: boolean;
  label: string;
  accept: string;
  onUpload: (file: File) => Promise<string | void>;
}) {
  const ui = useUiText();
  const [busy, setBusy] = useState(false);
  const [lastPath, setLastPath] = useState("");

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || disabled) return;

    setBusy(true);
    setLastPath("");
    try {
      const path = await onUpload(file);
      if (path) setLastPath(path);
    } catch (error) {
      setLastPath(`오류: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  const hasError = lastPath.startsWith("오류:");

  return (
    <label className={`upload-field ${disabled ? "disabled" : ""} ${busy ? "busy" : ""}`}>
      <span>{busy ? ui.common.uploading : label}</span>
      <input accept={accept} disabled={disabled || busy} onChange={handleChange} type="file" />
      {lastPath && <code className={`upload-result ${hasError ? "error" : ""}`}>{lastPath}</code>}
    </label>
  );
}

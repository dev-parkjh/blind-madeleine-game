import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { EditorLanguage, EditorThemeAccent, EditorThemeMode } from "../editorTypes";
import { useUiText } from "../editorText";
import type { ProjectSummary, ResourceType } from "../types";
import {
  defaultCustomAccent,
  normalizeEditorThemeAccent,
  sanitizeHexColor
} from "../lib/editorPreferences";
import { resourceConfig, resourceOrder } from "../lib/resourceConfig";
import { Icon, IconButton } from "./EditorControls";

export function EditorTopBar({
  canRunGame,
  canSave,
  customAccent,
  isAppBusy,
  language,
  selectedId,
  settingsMenuRef,
  summary,
  themeAccent,
  themeMode,
  type,
  onChangeType,
  onCreate,
  onDelete,
  onRefresh,
  onRunGame,
  onSave,
  setCustomAccent,
  setLanguage,
  setThemeAccent,
  setThemeMode
}: {
  canRunGame: boolean;
  canSave: boolean;
  customAccent: string;
  isAppBusy: boolean;
  language: EditorLanguage;
  selectedId: string;
  settingsMenuRef: MutableRefObject<HTMLDetailsElement | null>;
  summary: ProjectSummary | null;
  themeAccent: EditorThemeAccent;
  themeMode: EditorThemeMode;
  type: ResourceType;
  onChangeType: (nextType: ResourceType) => void;
  onCreate: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  onRunGame: () => void;
  onSave: () => void;
  setCustomAccent: Dispatch<SetStateAction<string>>;
  setLanguage: Dispatch<SetStateAction<EditorLanguage>>;
  setThemeAccent: Dispatch<SetStateAction<EditorThemeAccent>>;
  setThemeMode: Dispatch<SetStateAction<EditorThemeMode>>;
}) {
  const ui = useUiText();

  return (
    <header className="top-app-bar">
      <div className="brand-area">
        <div className="brand-mark">BM</div>
        <div className="brand-copy">
          <div className="brand-title-row">
            <strong>{ui.brandTitle}</strong>
            <button className="brand-play-button" disabled={!canRunGame} type="button" onClick={onRunGame} title={ui.toolbar.play}>
              <Icon name="PlayCircle" />
              <span>{ui.toolbar.play}</span>
            </button>
          </div>
          <span>{ui.brandSubtitle}</span>
        </div>
      </div>
      <nav className="navigation-rail" aria-label={ui.panels.resourceNav}>
        {resourceOrder.map((entry) => (
          <button
            className={`rail-item ${entry === type ? "active" : ""}`}
            key={entry}
            type="button"
            onClick={() => onChangeType(entry)}
          >
            <Icon name={resourceConfig[entry].icon} />
            <span>{ui.resources[entry]}</span>
            <small>{summary?.resources[entry]?.count ?? 0}</small>
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <div className="toolbar-actions">
          <IconButton icon="Refresh" label={ui.toolbar.refresh} onClick={onRefresh} disabled={isAppBusy} />
          <IconButton icon="Add" label={ui.toolbar.create} onClick={onCreate} disabled={isAppBusy} />
          <IconButton icon="Delete" label={ui.toolbar.delete} onClick={onDelete} disabled={isAppBusy || !selectedId} danger />
          <IconButton icon="Save" label={ui.toolbar.save} onClick={onSave} disabled={!canSave} filled />
        </div>
        <details className="settings-menu" ref={settingsMenuRef}>
          <summary aria-label={ui.settings.label}>
            <Icon name="Settings" />
            <span>{ui.settings.label}</span>
          </summary>
          <div className="settings-popover">
            <strong>{ui.settings.label}</strong>
            <div className="preference-controls" aria-label={ui.settings.label}>
              <label className="preference-field">
                <span>{ui.settings.language}</span>
                <select value={language} onChange={(event) => setLanguage(event.target.value === "en" ? "en" : "ko")}>
                  <option value="ko">{ui.settings.korean}</option>
                  <option value="en">{ui.settings.english}</option>
                </select>
              </label>
              <section className="theme-preference-group" aria-label={ui.settings.theme}>
                <span className="theme-preference-title">{ui.settings.theme}</span>
                <div className="segmented-control" role="group" aria-label={ui.settings.themeMode}>
                  <button className={themeMode === "dark" ? "active" : ""} type="button" onClick={() => setThemeMode("dark")}>
                    {ui.settings.dark}
                  </button>
                  <button className={themeMode === "light" ? "active" : ""} type="button" onClick={() => setThemeMode("light")}>
                    {ui.settings.light}
                  </button>
                </div>
                <label className="preference-field">
                  <span>{ui.settings.accent}</span>
                  <div className="accent-control-row">
                    <select value={themeAccent} onChange={(event) => setThemeAccent(normalizeEditorThemeAccent(event.target.value))}>
                      <option value="green">{ui.settings.green}</option>
                      <option value="blue">{ui.settings.blue}</option>
                      <option value="rose">{ui.settings.rose}</option>
                      <option value="amber">{ui.settings.amber}</option>
                      <option value="custom">{ui.settings.custom}</option>
                    </select>
                    {themeAccent === "custom" && (
                      <input
                        aria-label={ui.settings.customColor}
                        className="custom-color-input"
                        value={sanitizeHexColor(customAccent, defaultCustomAccent)}
                        onChange={(event) => setCustomAccent(event.target.value)}
                        title={ui.settings.customColor}
                        type="color"
                      />
                    )}
                  </div>
                </label>
              </section>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}

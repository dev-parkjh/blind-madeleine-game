import type { Dispatch, SetStateAction } from "react";
import { useContext } from "react";
import { Icon } from "./EditorControls";
import type { MobilePanel } from "../editorTypes";
import { LanguageContext, useUiText } from "../editorText";

export function MobileFabMenu({
  canSave,
  isAppBusy,
  issueCount,
  mobileFabOpen,
  mobilePanel,
  setMobileFabOpen,
  setMobilePanel,
  onCreate,
  onSave
}: {
  canSave: boolean;
  isAppBusy: boolean;
  issueCount: number;
  mobileFabOpen: boolean;
  mobilePanel: MobilePanel;
  setMobileFabOpen: Dispatch<SetStateAction<boolean>>;
  setMobilePanel: (panel: MobilePanel) => void;
  onCreate: () => void;
  onSave: () => void;
}) {
  const ui = useUiText();
  const language = useContext(LanguageContext);
  const mobileActionMenuLabel = language === "ko" ? "모바일 작업 메뉴" : "Mobile action menu";

  function runAction(action: () => void) {
    setMobileFabOpen(false);
    action();
  }

  return (
    <div className={`mobile-fab-menu ${mobileFabOpen ? "open" : ""}`}>
      <button
        className="mobile-fab-scrim"
        aria-label={language === "ko" ? "모바일 작업 메뉴 닫기" : "Close mobile action menu"}
        type="button"
        onClick={() => setMobileFabOpen(false)}
      />
      <div className="mobile-fab-actions" role="menu" aria-label={mobileActionMenuLabel}>
        <button className={mobilePanel === "library" ? "active" : ""} role="menuitem" type="button" onClick={() => runAction(() => setMobilePanel("library"))}>
          <Icon name="FolderOpen" />
          <span>{ui.mobile.library}</span>
        </button>
        <button className={mobilePanel === "workspace" ? "active" : ""} role="menuitem" type="button" onClick={() => runAction(() => setMobilePanel("workspace"))}>
          <Icon name="Edit" />
          <span>{ui.mobile.workspace}</span>
        </button>
        <button className={mobilePanel === "inspector" ? "active" : ""} role="menuitem" type="button" onClick={() => runAction(() => setMobilePanel("inspector"))}>
          <Icon name={issueCount > 0 ? "Warning" : "CheckCircle"} />
          <span>{ui.mobile.inspector}</span>
          {issueCount > 0 && <b>{issueCount}</b>}
        </button>
        <button role="menuitem" type="button" onClick={() => runAction(onCreate)} disabled={isAppBusy}>
          <Icon name="Add" />
          <span>{ui.toolbar.create}</span>
        </button>
        <button role="menuitem" type="button" onClick={() => runAction(onSave)} disabled={!canSave}>
          <Icon name="Save" />
          <span>{ui.toolbar.save}</span>
        </button>
      </div>
      <button
        className="mobile-fab-toggle"
        aria-expanded={mobileFabOpen}
        aria-label={mobileActionMenuLabel}
        type="button"
        onClick={() => setMobileFabOpen((open) => !open)}
      >
        <Icon name={mobileFabOpen ? "Close" : "DashboardCustomize"} />
      </button>
    </div>
  );
}

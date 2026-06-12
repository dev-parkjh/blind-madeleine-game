import type { Dispatch, SetStateAction } from "react";
import { Icon } from "../../components/EditorControls";
import { useUiText } from "../../editorText";
import { resourceOrder } from "../../lib/resourceConfig";
import type { ProjectSummary, ValidationIssue } from "../../types";

export function ResourceInspectorPanel({
  inspectorPanelOpen,
  language,
  setInspectorPanelOpen,
  summary,
  issues
}: {
  inspectorPanelOpen: boolean;
  language: string;
  setInspectorPanelOpen: Dispatch<SetStateAction<boolean>>;
  summary: ProjectSummary | null;
  issues: ValidationIssue[];
}) {
  const ui = useUiText();
  const collapseActionLabel = language === "ko" ? "접기" : "collapse";
  const expandActionLabel = language === "ko" ? "펼치기" : "expand";

  return (
    <aside className={`inspector-panel ${inspectorPanelOpen ? "expanded" : "collapsed"}`} aria-label={ui.panels.inspector}>
      <button
        aria-expanded={inspectorPanelOpen}
        aria-label={`${ui.panels.inspector} ${inspectorPanelOpen ? collapseActionLabel : expandActionLabel}`}
        className="side-panel-toggle"
        type="button"
        onClick={() => setInspectorPanelOpen((open) => !open)}
      >
        <Icon name={inspectorPanelOpen ? "ChevronRight" : "ChevronLeft"} />
        <span>{ui.panels.inspector}</span>
      </button>
      <div className="side-panel-content inspector-content">
        <section>
          <p className="section-label">{ui.panels.project}</p>
          <div className="metric-grid">
            {resourceOrder.map((entry) => (
              <article className="metric" key={entry}>
                <b>{summary?.resources[entry]?.count ?? 0}</b>
                <span>{ui.resources[entry]}</span>
              </article>
            ))}
          </div>
        </section>
        <section>
          <p className="section-label">{ui.panels.validation}</p>
          <div className="issue-list">
            {issues.map((issue, index) => (
              <article className={`issue ${issue.severity}`} key={`${issue.message}-${index}`}>
                <Icon name={issue.severity === "error" ? "Warning" : issue.severity === "warning" ? "Warning" : "CheckCircle"} />
                <span>{issue.message}</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

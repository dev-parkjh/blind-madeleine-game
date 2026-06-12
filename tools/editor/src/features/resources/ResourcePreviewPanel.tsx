import { useContext } from "react";
import { Icon } from "../../components/EditorControls";
import { LanguageContext, useUiText } from "../../editorText";
import { countEventTags } from "../dialogues/dialogueNodeModel";
import { describeResourceForLanguage } from "../../lib/editorPreferences";
import { asArray, titleFor } from "../../lib/resourceConfig";
import type { ResourceRecord, ResourceType, ValidationIssue } from "../../types";

export function ResourcePreviewPanel({
  draft,
  issues,
  type
}: {
  draft: ResourceRecord | null;
  issues: ValidationIssue[];
  type: ResourceType;
}) {
  const ui = useUiText();
  const language = useContext(LanguageContext);
  if (!draft) return <p className="empty-state">{ui.preview.select}</p>;

  const cards = [
    { label: ui.preview.title, value: titleFor(type, draft, draft.id || "") },
    { label: ui.preview.summary, value: describeResourceForLanguage(type, draft, language) },
    { label: "ID", value: draft.id || "-" }
  ];

  if (type === "dialogues") {
    cards.push({ label: ui.preview.eventTags, value: String(countEventTags(asArray<ResourceRecord>(draft.nodes))) });
  }
  if (type === "chapters") {
    cards.push({ label: ui.preview.parallaxLayers, value: String(asArray(draft.parallax?.layers).length) });
  }

  return (
    <div className="preview-panel">
      <div className="preview-grid">
        {cards.map((card) => (
          <article className="preview-tile" key={card.label}>
            <b>{card.label}</b>
            <span>{card.value}</span>
          </article>
        ))}
      </div>
      <div className="issue-list embedded">
        {issues.map((issue, index) => (
          <article className={`issue ${issue.severity}`} key={`${issue.message}-${index}`}>
            <Icon name={issue.severity === "info" ? "CheckCircle" : "Warning"} />
            <span>{issue.message}</span>
          </article>
        ))}
      </div>
    </div>
  );
}

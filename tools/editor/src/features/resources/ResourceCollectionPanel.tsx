import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { Icon } from "../../components/EditorControls";
import { useUiText } from "../../editorText";
import { shortId } from "../../lib/ids";
import type { ResourceSummary, ResourceType } from "../../types";
import { hasResourceChapterFilter } from "./resourceScope";

type ChapterFilterOption = {
  value: string;
  label: string;
};

export function ResourceCollectionPanel({
  collectionPanelOpen,
  filteredResources,
  language,
  resourceChapterFilterLabel,
  resourceChapterFilterOptions,
  resourceChapterFilters,
  resourceFilterMenuRef,
  search,
  selectedId,
  setCollectionPanelOpen,
  setSearch,
  type,
  onSelectResource,
  onToggleResourceChapterFilter
}: {
  collectionPanelOpen: boolean;
  filteredResources: ResourceSummary[];
  language: string;
  resourceChapterFilterLabel: string;
  resourceChapterFilterOptions: ChapterFilterOption[];
  resourceChapterFilters: string[];
  resourceFilterMenuRef: MutableRefObject<HTMLDetailsElement | null>;
  search: string;
  selectedId: string;
  setCollectionPanelOpen: Dispatch<SetStateAction<boolean>>;
  setSearch: (value: string) => void;
  type: ResourceType;
  onSelectResource: (id: string) => void;
  onToggleResourceChapterFilter: (value: string) => void;
}) {
  const ui = useUiText();
  const collapseActionLabel = language === "ko" ? "접기" : "collapse";
  const expandActionLabel = language === "ko" ? "펼치기" : "expand";

  return (
    <section className={`collection-panel ${collectionPanelOpen ? "expanded" : "collapsed"}`} aria-label={ui.panels.collection}>
      <button
        aria-expanded={collectionPanelOpen}
        aria-label={`${ui.panels.library} ${collectionPanelOpen ? collapseActionLabel : expandActionLabel}`}
        className="side-panel-toggle"
        type="button"
        onClick={() => setCollectionPanelOpen((open) => !open)}
      >
        <Icon name={collectionPanelOpen ? "ChevronLeft" : "ChevronRight"} />
        <span>{ui.panels.library}</span>
      </button>
      <div className="side-panel-content collection-content">
        <div className="panel-title">
          <div className="panel-title-copy">
            <p>{ui.panels.library}</p>
            <h1>{ui.resources[type]}</h1>
          </div>
          {hasResourceChapterFilter(type) && (
            <details className="chapter-filter-menu" ref={resourceFilterMenuRef}>
              <summary aria-label={language === "ko" ? "챕터 필터" : "Chapter filter"}>
                <Icon name="FilterList" />
                <span>{resourceChapterFilterLabel}</span>
                <Icon name="KeyboardArrowDown" />
              </summary>
              <div className="chapter-filter-popover">
                {resourceChapterFilterOptions.map((option) => (
                  <label className="chapter-filter-option" key={option.value}>
                    <input
                      checked={option.value === "all" ? resourceChapterFilters.length === 0 : resourceChapterFilters.includes(option.value)}
                      type="checkbox"
                      onChange={() => onToggleResourceChapterFilter(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </details>
          )}
        </div>
        <div className="collection-filter-row">
          <label className="search-field">
            <Icon name="Search" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={ui.common.search} type="search" />
          </label>
        </div>
        <div className="resource-list">
          {filteredResources.length === 0 && <p className="empty-state">{ui.common.emptyList}</p>}
          {filteredResources.map((resource) => (
            <button
              className={`resource-row ${resource.id === selectedId ? "active" : ""}`}
              key={resource.id}
              type="button"
              onClick={() => onSelectResource(resource.id)}
            >
              <strong>{resource.title}</strong>
              <span>{resource.subtitle}</span>
              <code>{shortId(resource.id)}</code>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

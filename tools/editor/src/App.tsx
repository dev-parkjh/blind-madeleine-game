import type { ChangeEvent, MutableRefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createResource,
  deleteResource,
  getProjectSummary,
  listResources,
  loadResource,
  saveResource
} from "./lib/api";
import {
  asArray,
  describeResource,
  formatJson,
  iconPath,
  makeUuid,
  resourceConfig,
  resourceOrder,
  titleFor
} from "./lib/resourceConfig";
import { collectValidationIssues } from "./lib/validation";
import type { ProjectSummary, ResourceRecord, ResourceSummary, ResourceType, ValidationIssue } from "./types";

type EditorTab = "form" | "nodes" | "json" | "preview";

const tagActions = [
  { label: "색상", hint: "color", open: "[color=#7ee7d8]", close: "[/color]" },
  { label: "거짓", hint: "lie", open: "[lie]", close: "[/lie]" },
  { label: "흔들림", hint: "shake", open: "[shake rate=22.0 level=6 connected=1]", close: "[/shake]" },
  { label: "물결", hint: "wave", open: "[wave amp=28.0 freq=5.0 connected=1]", close: "[/wave]" },
  { label: "느리게", hint: "speed", open: "[speed=0.6]", close: "[/speed]" },
  { label: "크기 변화", hint: "font", open: "[font_scale from=1 to=0.3]", close: "[/font_scale]" },
  { label: "BGM", hint: "bgm", insert: "[bgm id=\"\" fade=0.5]" },
  { label: "SFX", hint: "sfx", insert: "[sfx id=\"\"]" },
  { label: "배경", hint: "bg", insert: "[bg id=\"\" transition=fade duration=0.5 opacity=1 blur=3 brightness=0.75 saturate=0.8 dim=0.15]" },
  { label: "자동 넘김", hint: "auto", insert: "[auto_next delay=0.35]" }
];

const historyMilestones = [
  "대사 에디터: speaker, choices, portrait, stage_cast, statement_nodes, acquire_info, popups",
  "캐릭터 에디터: display_name, name_color, portraits, profile crop, spectrum_offset",
  "아이템/챕터 에디터: chapters scope, graph layout, chapter BGM, parallax layers",
  "스토리 에셋: bgm, sfx, background, volume, loop, fixed",
  "연출 태그: BBCode effects, bgm/sfx/bg events, auto_next, cutscene"
];

function App() {
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [type, setType] = useState<ResourceType>("dialogues");
  const [resources, setResources] = useState<ResourceSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<ResourceRecord | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<EditorTab>("form");
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);
  const [toast, setToast] = useState("");
  const nodeTextRef = useRef<HTMLTextAreaElement | null>(null);

  const issues = useMemo(
    () => collectValidationIssues(type, draft, selectedId, summary).concat(jsonError
      ? [{ severity: "error", message: jsonError } satisfies ValidationIssue]
      : []),
    [draft, jsonError, selectedId, summary, type]
  );

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return resources;
    return resources.filter((resource) => [resource.id, resource.title, resource.subtitle]
      .some((value) => String(value || "").toLowerCase().includes(query)));
  }, [resources, search]);

  const referenceResources = useMemo(() => ({
    chapters: summary?.resources.chapters.resources || [],
    dialogues: summary?.resources.dialogues.resources || [],
    characters: summary?.resources.characters.resources || [],
    items: summary?.resources.items.resources || [],
    storyAssets: summary?.resources.story_assets.resources || []
  }), [summary]);

  useEffect(() => {
    void boot();
  }, []);

  useEffect(() => {
    setSelectedNodeIndex(0);
  }, [selectedId, type]);

  async function boot() {
    try {
      await refreshSummary();
      await refreshList("dialogues", true);
      notify("프로젝트 데이터 로드 완료");
    } catch (error) {
      notify((error as Error).message);
    }
  }

  async function refreshSummary() {
    const nextSummary = await getProjectSummary();
    setSummary(nextSummary);
    return nextSummary;
  }

  async function refreshList(nextType = type, selectFirst = false) {
    const body = await listResources(nextType);
    setResources(body.resources);
    if (selectFirst && body.resources.length > 0) {
      await selectResource(nextType, body.resources[0].id, true);
    }
  }

  async function changeType(nextType: ResourceType) {
    if (nextType === type || !confirmDiscard()) return;
    setType(nextType);
    setSelectedId("");
    setDraft(null);
    setJsonText("");
    setJsonError("");
    setSearch("");
    setTab(nextType === "dialogues" ? "nodes" : "form");
    await refreshList(nextType, true);
  }

  async function selectResource(nextType: ResourceType, id: string, force = false) {
    if (!force && (id === selectedId || !confirmDiscard())) return;
    const body = await loadResource(nextType, id);
    setSelectedId(id);
    setDraft(body.data);
    setJsonText(formatJson(body.data));
    setJsonError("");
    setDirty(false);
  }

  async function refreshAll() {
    if (!confirmDiscard()) return;
    await refreshSummary();
    await refreshList(type, false);
    if (selectedId) await selectResource(type, selectedId, true);
    notify("새로고침 완료");
  }

  async function createCurrent() {
    if (!confirmDiscard()) return;
    const id = makeUuid();
    const body = await createResource(type, resourceConfig[type].empty(id));
    await refreshSummary();
    await refreshList(type, false);
    await selectResource(type, body.summary.id, true);
    notify("새 항목 생성 완료");
  }

  async function deleteCurrent() {
    if (!selectedId || !window.confirm(`${resourceConfig[type].singularLabel} ${selectedId} 파일을 삭제할까요?`)) return;
    await deleteResource(type, selectedId);
    setSelectedId("");
    setDraft(null);
    setJsonText("");
    setDirty(false);
    await refreshSummary();
    await refreshList(type, true);
    notify("삭제 완료");
  }

  async function saveCurrent() {
    if (!selectedId || !draft || jsonError) return;
    const body = await saveResource(type, selectedId, draft);
    setDraft(body.data);
    setJsonText(formatJson(body.data));
    setDirty(false);
    await refreshSummary();
    await refreshList(type, false);
    notify("저장 완료");
  }

  function confirmDiscard() {
    if (!dirty) return true;
    return window.confirm("저장하지 않은 변경이 있습니다. 계속할까요?");
  }

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast((current) => current === message ? "" : current), 2200);
  }

  function applyDraft(nextDraft: ResourceRecord) {
    setDraft(nextDraft);
    setJsonText(formatJson(nextDraft));
    setJsonError("");
    setDirty(true);
  }

  function updateField(field: string, value: unknown) {
    if (!draft) return;
    applyDraft({ ...draft, [field]: value });
  }

  function updateMetadataField(field: string, value: unknown) {
    if (!draft) return;
    const metadata = draft.metadata && typeof draft.metadata === "object" ? draft.metadata : {};
    applyDraft({ ...draft, metadata: { ...metadata, [field]: value } });
  }

  function toggleArrayField(field: string, id: string) {
    if (!draft) return;
    const current = asArray<string>(draft[field]).map(String);
    const next = current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id];
    applyDraft({ ...draft, [field]: next });
  }

  function onJsonChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const text = event.target.value;
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setDraft(parsed);
      setJsonError("");
    } catch (error) {
      setJsonError((error as Error).message);
    }
    setDirty(true);
  }

  function addDialogueNode(mode: "dialogue" | "cutscene") {
    if (!draft) return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    const nextNode = mode === "cutscene"
      ? { mode: "cutscene", cutscene: { fade_in: 0, hold: 1, fade_out: 1 } }
      : { speaker: "narrator", text: "" };
    applyDraft({ ...draft, nodes: [...nodes, nextNode] });
    setSelectedNodeIndex(nodes.length);
    setTab("nodes");
  }

  function addStatementNode() {
    if (!draft) return;
    const statementNodes = asArray<ResourceRecord>(draft.statement_nodes);
    const nextNode = {
      speaker: "narrator",
      text: "[lie]거짓[/lie]",
      statement_lies: [{ phrase: "거짓", reactions: [{ label: "제시", nodes: [] }] }]
    };
    applyDraft({ ...draft, statement_nodes: [...statementNodes, nextNode] });
    setTab("nodes");
  }

  function updateDialogueNode(index: number, nextNode: ResourceRecord) {
    if (!draft) return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    const nextNodes = nodes.map((node, nodeIndex) => nodeIndex === index ? nextNode : node);
    applyDraft({ ...draft, nodes: nextNodes });
  }

  function removeDialogueNode(index: number) {
    if (!draft) return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    applyDraft({ ...draft, nodes: nodes.filter((_, nodeIndex) => nodeIndex !== index) });
    setSelectedNodeIndex(Math.max(0, index - 1));
  }

  function insertTag(action: typeof tagActions[number]) {
    if (!draft) return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    const node = nodes[selectedNodeIndex];
    if (!node) return;

    const currentText = String(node.text || "");
    const textarea = nodeTextRef.current;
    const start = textarea?.selectionStart ?? currentText.length;
    const end = textarea?.selectionEnd ?? currentText.length;
    const selected = currentText.slice(start, end);
    const inserted = action.insert || `${action.open}${selected || "text"}${action.close}`;
    const nextText = `${currentText.slice(0, start)}${inserted}${currentText.slice(end)}`;
    updateDialogueNode(selectedNodeIndex, { ...node, text: nextText });
  }

  const canSave = Boolean(selectedId && draft && dirty && !jsonError);
  const currentTitle = titleFor(type, draft, selectedId);
  const currentDescription = describeResource(type, draft);

  return (
    <div className="app-shell">
      <header className="top-app-bar">
        <div className="brand-mark">BM</div>
        <div className="brand-copy">
          <strong>Blind Madeleine Editor</strong>
          <span>Vite React local data server</span>
        </div>
        <div className="toolbar-actions">
          <IconButton icon="Refresh" label="새로고침" onClick={refreshAll} />
          <IconButton icon="Add" label="새 항목" onClick={createCurrent} />
          <IconButton icon="Delete" label="삭제" onClick={deleteCurrent} disabled={!selectedId} danger />
          <IconButton icon="Save" label="저장" onClick={saveCurrent} disabled={!canSave} filled />
        </div>
      </header>

      <main className="editor-grid">
        <nav className="navigation-rail" aria-label="데이터 타입">
          {resourceOrder.map((entry) => (
            <button
              className={`rail-item ${entry === type ? "active" : ""}`}
              key={entry}
              type="button"
              onClick={() => void changeType(entry)}
            >
              <Icon name={resourceConfig[entry].icon} />
              <span>{resourceConfig[entry].label}</span>
              <small>{summary?.resources[entry]?.count ?? 0}</small>
            </button>
          ))}
        </nav>

        <section className="collection-panel" aria-label="데이터 목록">
          <div className="panel-title">
            <p>Library</p>
            <h1>{resourceConfig[type].label}</h1>
          </div>
          <label className="search-field">
            <Icon name="Search" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="검색" type="search" />
          </label>
          <div className="resource-list">
            {filteredResources.length === 0 && <p className="empty-state">표시할 항목이 없습니다.</p>}
            {filteredResources.map((resource) => (
              <button
                className={`resource-row ${resource.id === selectedId ? "active" : ""}`}
                key={resource.id}
                type="button"
                onClick={() => void selectResource(type, resource.id)}
              >
                <strong>{resource.title}</strong>
                <span>{resource.subtitle}</span>
                <code>{shortId(resource.id)}</code>
              </button>
            ))}
          </div>
        </section>

        <section className="workspace-panel" aria-label="편집 영역">
          <div className="workspace-header">
            <div>
              <p>{type}</p>
              <h2>{currentTitle}</h2>
              <span>{currentDescription}</span>
            </div>
            <div className={`dirty-badge ${jsonError ? "error" : dirty ? "dirty" : "clean"}`}>
              {jsonError ? "JSON 오류" : dirty ? "수정됨" : "저장됨"}
            </div>
          </div>

          <div className="tab-bar" role="tablist">
            {(["form", "nodes", "json", "preview"] as EditorTab[]).map((entry) => (
              <button className={tab === entry ? "active" : ""} key={entry} type="button" onClick={() => setTab(entry)}>
                {tabLabel(entry)}
              </button>
            ))}
          </div>

          <div className="workspace-body">
            {tab === "form" && (
              <FormPanel
                draft={draft}
                type={type}
                references={referenceResources}
                updateField={updateField}
                updateMetadataField={updateMetadataField}
                toggleArrayField={toggleArrayField}
              />
            )}
            {tab === "nodes" && (
              <DialogueNodesPanel
                draft={draft}
                references={referenceResources}
                selectedNodeIndex={selectedNodeIndex}
                nodeTextRef={nodeTextRef}
                setSelectedNodeIndex={setSelectedNodeIndex}
                addDialogueNode={addDialogueNode}
                addStatementNode={addStatementNode}
                updateDialogueNode={updateDialogueNode}
                removeDialogueNode={removeDialogueNode}
                insertTag={insertTag}
              />
            )}
            {tab === "json" && (
              <label className="json-editor">
                <span>JSON</span>
                <textarea value={jsonText} onChange={onJsonChange} spellCheck={false} placeholder="목록에서 항목을 선택하세요." />
              </label>
            )}
            {tab === "preview" && (
              <PreviewPanel draft={draft} type={type} issues={issues} />
            )}
          </div>
        </section>

        <aside className="inspector-panel" aria-label="검증 패널">
          <section>
            <p className="section-label">Project</p>
            <div className="metric-grid">
              {resourceOrder.map((entry) => (
                <article className="metric" key={entry}>
                  <b>{summary?.resources[entry]?.count ?? 0}</b>
                  <span>{resourceConfig[entry].label}</span>
                </article>
              ))}
            </div>
          </section>
          <section>
            <p className="section-label">Validation</p>
            <div className="issue-list">
              {issues.map((issue, index) => (
                <article className={`issue ${issue.severity}`} key={`${issue.message}-${index}`}>
                  <Icon name={issue.severity === "error" ? "Warning" : issue.severity === "warning" ? "Warning" : "CheckCircle"} />
                  <span>{issue.message}</span>
                </article>
              ))}
            </div>
          </section>
          <section>
            <p className="section-label">History Coverage</p>
            <div className="coverage-list">
              {historyMilestones.map((milestone) => <span key={milestone}>{milestone}</span>)}
            </div>
          </section>
        </aside>
      </main>

      <div className={`toast ${toast ? "visible" : ""}`}>{toast}</div>
    </div>
  );
}

type ReferenceResources = {
  chapters: ResourceSummary[];
  dialogues: ResourceSummary[];
  characters: ResourceSummary[];
  items: ResourceSummary[];
  storyAssets: ResourceSummary[];
};

function FormPanel({
  draft,
  type,
  references,
  updateField,
  updateMetadataField,
  toggleArrayField
}: {
  draft: ResourceRecord | null;
  type: ResourceType;
  references: ReferenceResources;
  updateField: (field: string, value: unknown) => void;
  updateMetadataField: (field: string, value: unknown) => void;
  toggleArrayField: (field: string, id: string) => void;
}) {
  if (!draft) return <p className="empty-state">편집할 항목을 선택하세요.</p>;

  if (type === "dialogues") {
    return (
      <div className="form-grid">
        <TextField label="Label" value={draft.label} onChange={(value) => updateField("label", value)} />
        <TextField label="Description" value={draft.description} onChange={(value) => updateField("description", value)} multiline />
        <CheckboxList label="Chapters" values={asArray(draft.chapters).map(String)} options={references.chapters} onToggle={(id) => toggleArrayField("chapters", id)} />
      </div>
    );
  }

  if (type === "characters") {
    const portraits = draft.portraits && typeof draft.portraits === "object" ? Object.entries(draft.portraits) : [];
    return (
      <div className="form-grid">
        <TextField label="Display name" value={draft.display_name} onChange={(value) => updateField("display_name", value)} />
        <TextField label="Name color" value={draft.name_color} onChange={(value) => updateField("name_color", value)} type="color-text" />
        <TextField label="Description" value={draft.description} onChange={(value) => updateField("description", value)} multiline />
        <TextField label="Voice profile metadata" value={draft.metadata?.voice_profile || ""} onChange={(value) => updateMetadataField("voice_profile", value)} />
        <div className="wide field-block">
          <span>Portraits</span>
          <div className="pill-list">
            {portraits.length === 0 && <em>초상 없음</em>}
            {portraits.map(([key, value]) => <code key={key}>{key}: {(value as ResourceRecord).path || "path 없음"}</code>)}
          </div>
        </div>
      </div>
    );
  }

  if (type === "chapters") {
    return (
      <div className="form-grid">
        <TextField label="Title" value={draft.title} onChange={(value) => updateField("title", value)} />
        <TextField label="Order" value={draft.order} onChange={(value) => updateField("order", Number(value) || 0)} type="number" />
        <SelectField label="Start dialogue" value={draft.start_dialogue || ""} options={references.dialogues} onChange={(value) => updateField("start_dialogue", value)} />
        <SelectField label="BGM" value={draft.bgm || ""} options={references.storyAssets} onChange={(value) => updateField("bgm", value)} />
        <TextField label="Description" value={draft.description} onChange={(value) => updateField("description", value)} multiline />
        <CheckboxList label="Dialogues" values={asArray(draft.dialogues).map(String)} options={references.dialogues} onToggle={(id) => toggleArrayField("dialogues", id)} />
      </div>
    );
  }

  if (type === "items") {
    return (
      <div className="form-grid">
        <TextField label="Name" value={draft.name} onChange={(value) => updateField("name", value)} />
        <TextField label="Image" value={draft.image} onChange={(value) => updateField("image", value)} />
        <TextField label="Description" value={draft.description} onChange={(value) => updateField("description", value)} multiline />
        <CheckboxList label="Chapters" values={asArray(draft.chapters).map(String)} options={references.chapters} onToggle={(id) => toggleArrayField("chapters", id)} />
      </div>
    );
  }

  return (
    <div className="form-grid">
      <TextField label="Display name" value={draft.display_name} onChange={(value) => updateField("display_name", value)} />
      <SelectLiteralField label="Kind" value={draft.kind || "sfx"} options={["sfx", "bgm", "background"]} onChange={(value) => updateField("kind", value)} />
      <TextField label="Path" value={draft.path} onChange={(value) => updateField("path", value)} />
      <TextField label="Volume" value={draft.volume ?? ""} onChange={(value) => updateField("volume", Number(value))} type="number" />
      <TextField label="Description" value={draft.description} onChange={(value) => updateField("description", value)} multiline />
      <CheckboxList label="Chapters" values={asArray(draft.chapters).map(String)} options={references.chapters} onToggle={(id) => toggleArrayField("chapters", id)} />
    </div>
  );
}

function DialogueNodesPanel({
  draft,
  references,
  selectedNodeIndex,
  nodeTextRef,
  setSelectedNodeIndex,
  addDialogueNode,
  addStatementNode,
  updateDialogueNode,
  removeDialogueNode,
  insertTag
}: {
  draft: ResourceRecord | null;
  references: ReferenceResources;
  selectedNodeIndex: number;
  nodeTextRef: MutableRefObject<HTMLTextAreaElement | null>;
  setSelectedNodeIndex: (index: number) => void;
  addDialogueNode: (mode: "dialogue" | "cutscene") => void;
  addStatementNode: () => void;
  updateDialogueNode: (index: number, node: ResourceRecord) => void;
  removeDialogueNode: (index: number) => void;
  insertTag: (action: typeof tagActions[number]) => void;
}) {
  if (!draft) return <p className="empty-state">편집할 대사를 선택하세요.</p>;

  const nodes = asArray<ResourceRecord>(draft.nodes);
  const statementNodes = asArray<ResourceRecord>(draft.statement_nodes);
  const selectedNode = nodes[selectedNodeIndex];

  return (
    <div className="nodes-layout">
      <div className="node-list">
        <div className="inline-actions">
          <button type="button" onClick={() => addDialogueNode("dialogue")}><Icon name="Add" />대사</button>
          <button type="button" onClick={() => addDialogueNode("cutscene")}><Icon name="Add" />컷씬</button>
          <button type="button" onClick={addStatementNode}><Icon name="Add" />진술</button>
        </div>
        {nodes.map((node, index) => (
          <button
            className={`node-row ${index === selectedNodeIndex ? "active" : ""}`}
            key={index}
            type="button"
            onClick={() => setSelectedNodeIndex(index)}
          >
            <strong>{index + 1}. {node.mode === "cutscene" ? "컷씬" : speakerLabel(node.speaker, references.characters)}</strong>
            <span>{node.mode === "cutscene" ? cutsceneSummary(node) : String(node.text || "").slice(0, 72) || "빈 대사"}</span>
          </button>
        ))}
        <div className="statement-summary">
          <b>Statement nodes</b>
          <span>{statementNodes.length}개</span>
        </div>
      </div>

      <div className="node-editor">
        {!selectedNode && <p className="empty-state">노드를 추가하거나 선택하세요.</p>}
        {selectedNode && (
          <>
            <div className="node-editor-toolbar">
              <SelectLiteralField
                label="Mode"
                value={selectedNode.mode || "dialogue"}
                options={["dialogue", "cutscene"]}
                onChange={(value) => {
                  const nextNode: ResourceRecord = { ...selectedNode, mode: value === "dialogue" ? undefined : value };
                  if (value === "cutscene" && !nextNode.cutscene) nextNode.cutscene = { fade_in: 0, hold: 1, fade_out: 1 };
                  updateDialogueNode(selectedNodeIndex, nextNode);
                }}
              />
              <button className="danger-action" type="button" onClick={() => removeDialogueNode(selectedNodeIndex)}>
                <Icon name="Delete" />삭제
              </button>
            </div>

            {selectedNode.mode === "cutscene" ? (
              <div className="form-grid compact">
                <TextField label="Fade in" value={selectedNode.cutscene?.fade_in ?? 0} type="number" onChange={(value) => updateDialogueNode(selectedNodeIndex, patchCutscene(selectedNode, "fade_in", Number(value)))} />
                <TextField label="Hold" value={selectedNode.cutscene?.hold ?? 1} type="number" onChange={(value) => updateDialogueNode(selectedNodeIndex, patchCutscene(selectedNode, "hold", Number(value)))} />
                <TextField label="Fade out" value={selectedNode.cutscene?.fade_out ?? 1} type="number" onChange={(value) => updateDialogueNode(selectedNodeIndex, patchCutscene(selectedNode, "fade_out", Number(value)))} />
                <TextField label="Image" value={selectedNode.cutscene?.image || ""} onChange={(value) => updateDialogueNode(selectedNodeIndex, patchCutscene(selectedNode, "image", value))} />
              </div>
            ) : (
              <>
                <div className="form-grid compact">
                  <SelectField
                    label="Speaker"
                    value={selectedNode.speaker || "narrator"}
                    options={[{ id: "narrator", title: "narrator", subtitle: "built-in", type: "characters" } as ResourceSummary, ...references.characters]}
                    onChange={(value) => updateDialogueNode(selectedNodeIndex, { ...selectedNode, speaker: value })}
                  />
                  <TextField label="Next" value={selectedNode.next || ""} onChange={(value) => updateDialogueNode(selectedNodeIndex, { ...selectedNode, next: value })} />
                  <TextField label="Speaker mystery" value={selectedNode.speaker_mystery ? "true" : "false"} onChange={(value) => updateDialogueNode(selectedNodeIndex, { ...selectedNode, speaker_mystery: value === "true" })} />
                </div>
                <label className="node-textarea">
                  <span>Text</span>
                  <textarea
                    ref={nodeTextRef}
                    value={selectedNode.text || ""}
                    onChange={(event) => updateDialogueNode(selectedNodeIndex, { ...selectedNode, text: event.target.value })}
                    spellCheck={false}
                  />
                </label>
                <div className="tag-palette">
                  {tagActions.map((action) => (
                    <button key={action.label} type="button" onClick={() => insertTag(action)}>
                      <b>{action.label}</b>
                      <span>{action.hint}</span>
                    </button>
                  ))}
                </div>
                <div className="stage-cast-strip">
                  <b>stage_cast</b>
                  {selectedNode.stage_cast && typeof selectedNode.stage_cast === "object"
                    ? Object.keys(selectedNode.stage_cast).map((characterId) => <code key={characterId}>{characterId}</code>)
                    : <span>없음</span>}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PreviewPanel({ draft, type, issues }: { draft: ResourceRecord | null; type: ResourceType; issues: ValidationIssue[] }) {
  if (!draft) return <p className="empty-state">미리볼 항목을 선택하세요.</p>;

  const cards = [
    { label: "Title", value: titleFor(type, draft, draft.id || "") },
    { label: "Summary", value: describeResource(type, draft) },
    { label: "ID", value: draft.id || "-" }
  ];

  if (type === "dialogues") {
    cards.push({ label: "Event tags", value: String(countEventTags(asArray<ResourceRecord>(draft.nodes))) });
  }
  if (type === "chapters") {
    cards.push({ label: "Parallax layers", value: String(asArray(draft.parallax?.layers).length) });
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

function TextField({
  label,
  value,
  onChange,
  multiline,
  type = "text"
}: {
  label: string;
  value: unknown;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: "text" | "number" | "color-text";
}) {
  const stringValue = value === undefined || value === null ? "" : String(value);
  return (
    <label className={`field-block ${multiline ? "wide" : ""}`}>
      <span>{label}</span>
      {multiline ? (
        <textarea value={stringValue} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={stringValue} onChange={(event) => onChange(event.target.value)} type={type === "number" ? "number" : "text"} />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: unknown;
  options: ResourceSummary[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="field-block">
      <span>{label}</span>
      <select value={String(value || "")} onChange={(event) => onChange(event.target.value)}>
        <option value="">미지정</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}
      </select>
    </label>
  );
}

function SelectLiteralField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: unknown;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="field-block">
      <span>{label}</span>
      <select value={String(value || "")} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function CheckboxList({
  label,
  values,
  options,
  onToggle
}: {
  label: string;
  values: string[];
  options: ResourceSummary[];
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="wide checkbox-list">
      <legend>{label}</legend>
      {options.length === 0 && <span className="muted">선택 가능한 항목이 없습니다.</span>}
      {options.map((option) => (
        <label key={option.id}>
          <input checked={values.includes(option.id)} onChange={() => onToggle(option.id)} type="checkbox" />
          <span>{option.title}</span>
        </label>
      ))}
    </fieldset>
  );
}

function IconButton({
  icon,
  label,
  onClick,
  disabled,
  filled,
  danger
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  filled?: boolean;
  danger?: boolean;
}) {
  return (
    <button className={`tool-button ${filled ? "filled" : ""} ${danger ? "danger" : ""}`} disabled={disabled} type="button" onClick={onClick}>
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  );
}

function Icon({ name }: { name: string }) {
  return <img aria-hidden="true" src={iconPath(name)} />;
}

function tabLabel(tab: EditorTab): string {
  return {
    form: "폼",
    nodes: "노드",
    json: "JSON",
    preview: "검증"
  }[tab];
}

function speakerLabel(value: unknown, characters: ResourceSummary[]) {
  const id = String(value || "narrator");
  if (id === "narrator") return "narrator";
  return characters.find((entry) => entry.id === id)?.title || id;
}

function cutsceneSummary(node: ResourceRecord) {
  const cutscene = node.cutscene || {};
  return `fade ${cutscene.fade_in ?? 0}/${cutscene.fade_out ?? 1} · hold ${cutscene.hold ?? 1}`;
}

function patchCutscene(node: ResourceRecord, field: string, value: unknown) {
  return { ...node, cutscene: { ...(node.cutscene || {}), [field]: value } };
}

function countEventTags(nodes: ResourceRecord[]) {
  return nodes.reduce((total, node) => total + (String(node.text || "").match(/\[(bgm|sfx|se|bg|auto_next)\b/gi)?.length || 0), 0);
}

function shortId(id: string) {
  return id.length > 14 ? `${id.slice(0, 8)}...` : id;
}

export default App;

import type { ChangeEvent, CSSProperties, MutableRefObject, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createResource,
  deleteResource,
  getProjectSummary,
  listResources,
  loadResource,
  saveResource,
  uploadProjectFile
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
type MobilePanel = "library" | "workspace" | "inspector";

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
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("workspace");
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);
  const [bridgeStatus, setBridgeStatus] = useState("미확인");
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
    setMobilePanel("library");
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
    setMobilePanel("workspace");
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
    setMobilePanel("workspace");
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

  function formatJsonText() {
    if (!draft) return;
    const formatted = formatJson(draft);
    setJsonText(formatted);
    setJsonError("");
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

  function updateStatementNode(index: number, nextNode: ResourceRecord) {
    if (!draft) return;
    const statementNodes = asArray<ResourceRecord>(draft.statement_nodes);
    applyDraft({
      ...draft,
      statement_nodes: statementNodes.map((node, nodeIndex) => nodeIndex === index ? nextNode : node)
    });
  }

  function removeStatementNode(index: number) {
    if (!draft) return;
    const statementNodes = asArray<ResourceRecord>(draft.statement_nodes);
    applyDraft({ ...draft, statement_nodes: statementNodes.filter((_, nodeIndex) => nodeIndex !== index) });
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

  async function uploadFile(relativePath: string, file: File) {
    const result = await uploadProjectFile(relativePath, file);
    notify(`업로드 완료: ${result.resPath} · Godot 재import 필요`);
    return result.resPath;
  }

  async function launchGodotPreview() {
    if (type !== "dialogues" || !draft || !selectedId) return;
    const nodes = asArray<ResourceRecord>(draft.nodes);
    const node = nodes[selectedNodeIndex];
    const response = await fetch("http://127.0.0.1:51234/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        dialogue_id: draft.id || selectedId,
        dialogue_file: `${draft.id || selectedId}.json`,
        dialogue_json: JSON.stringify(draft, null, 2),
        node_id: node?.id || ""
      })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body.ok) {
      throw new Error(body.error || "Godot preview bridge 호출에 실패했습니다.");
    }
    notify(`Godot preview 실행: PID ${body.pid}`);
  }

  async function checkGodotBridge() {
    try {
      const response = await fetch("http://127.0.0.1:51234/health");
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "bridge unavailable");
      }
      const godot = body.godot ? String(body.godot).split(/[\\/]/).pop() : "Godot";
      setBridgeStatus(`연결됨 · ${godot}`);
      notify("Godot preview bridge 연결됨");
    } catch (error) {
      setBridgeStatus(`오류 · ${(error as Error).message}`);
      notify("Godot preview bridge 연결 실패");
    }
  }

  const canSave = Boolean(selectedId && draft && dirty && !jsonError);
  const currentTitle = titleFor(type, draft, selectedId);
  const currentDescription = describeResource(type, draft);
  const issueCount = issues.filter((issue) => issue.severity !== "info").length;

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

      <div className="mobile-panel-switch" role="tablist" aria-label="모바일 패널">
        <button className={mobilePanel === "library" ? "active" : ""} type="button" onClick={() => setMobilePanel("library")}>
          목록
        </button>
        <button className={mobilePanel === "workspace" ? "active" : ""} type="button" onClick={() => setMobilePanel("workspace")}>
          편집
        </button>
        <button className={mobilePanel === "inspector" ? "active" : ""} type="button" onClick={() => setMobilePanel("inspector")}>
          검증 {issueCount > 0 ? issueCount : ""}
        </button>
      </div>

      <main className={`editor-grid mobile-${mobilePanel}`}>
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
                uploadFile={uploadFile}
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
                updateStatementNode={updateStatementNode}
                removeStatementNode={removeStatementNode}
                insertTag={insertTag}
                launchGodotPreview={launchGodotPreview}
                checkGodotBridge={checkGodotBridge}
                bridgeStatus={bridgeStatus}
              />
            )}
            {tab === "json" && (
              <label className="json-editor">
                <span>
                  JSON
                  <button className="inline-text-action" type="button" onClick={formatJsonText}>format</button>
                </span>
                {jsonError && <p className="json-error">{jsonError}</p>}
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
      <div className="mobile-action-bar">
        <button type="button" onClick={() => setMobilePanel("library")}><Icon name="FolderOpen" />목록</button>
        <button type="button" onClick={() => setMobilePanel("inspector")}><Icon name={issueCount > 0 ? "Warning" : "CheckCircle"} />검증</button>
        <button type="button" onClick={createCurrent}><Icon name="Add" />새 항목</button>
        <button type="button" onClick={saveCurrent} disabled={!canSave}><Icon name="Save" />저장</button>
      </div>
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
  toggleArrayField,
  uploadFile
}: {
  draft: ResourceRecord | null;
  type: ResourceType;
  references: ReferenceResources;
  updateField: (field: string, value: unknown) => void;
  updateMetadataField: (field: string, value: unknown) => void;
  toggleArrayField: (field: string, id: string) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
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
    return (
      <div className="form-grid">
        <TextField label="Display name" value={draft.display_name} onChange={(value) => updateField("display_name", value)} />
        <TextField label="Name color" value={draft.name_color} onChange={(value) => updateField("name_color", value)} type="color-text" />
        <TextField label="Description" value={draft.description} onChange={(value) => updateField("description", value)} multiline />
        <TextField label="Voice profile metadata" value={draft.metadata?.voice_profile || ""} onChange={(value) => updateMetadataField("voice_profile", value)} />
        <PortraitEditor draft={draft} updateField={updateField} uploadFile={uploadFile} />
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
        <ChapterArtEditor draft={draft} updateField={updateField} uploadFile={uploadFile} />
      </div>
    );
  }

  if (type === "items") {
    return (
      <div className="form-grid">
        <TextField label="Name" value={draft.name} onChange={(value) => updateField("name", value)} />
        <TextField label="Image" value={draft.image} onChange={(value) => updateField("image", value)} />
        <UploadField
          label="Upload item image"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onUpload={async (file) => {
            const path = await uploadFile(`assets/items/${safeSegment(draft.id || "item")}/image.${fileExtension(file)}`, file);
            updateField("image", path);
            return path;
          }}
        />
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
      <UploadField
        label="Upload asset file"
        accept="image/*,audio/*"
        onUpload={async (file) => {
          const path = await uploadFile(storyAssetUploadPath(draft, file), file);
          updateField("path", path);
          return path;
        }}
      />
      <TextField label="Volume" value={draft.volume ?? ""} onChange={(value) => updateField("volume", Number(value))} type="number" />
      <ToggleField label="Loop" checked={Boolean(draft.loop ?? draft.kind === "bgm")} onChange={(checked) => updateField("loop", checked)} />
      <ToggleField label="Fixed background" checked={Boolean(draft.fixed)} onChange={(checked) => updateField("fixed", checked)} />
      <TextField label="Description" value={draft.description} onChange={(value) => updateField("description", value)} multiline />
      <CheckboxList label="Chapters" values={asArray(draft.chapters).map(String)} options={references.chapters} onToggle={(id) => toggleArrayField("chapters", id)} />
    </div>
  );
}

function PortraitEditor({
  draft,
  updateField,
  uploadFile
}: {
  draft: ResourceRecord;
  updateField: (field: string, value: unknown) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  const portraits = draft.portraits && typeof draft.portraits === "object" ? draft.portraits as Record<string, ResourceRecord> : {};
  const entries = Object.entries(portraits);

  function setPortraits(next: Record<string, ResourceRecord>) {
    updateField("portraits", next);
  }

  function addPortrait() {
    const key = portraits.default ? `portrait_${entries.length + 1}` : "default";
    setPortraits({
      ...portraits,
      [key]: { path: "", center: [0.5, 0.5], profile: { center: [0.5, 0.5], zoom: 1 } }
    });
  }

  function renamePortrait(oldKey: string, nextKey: string) {
    const clean = safeSegment(nextKey || oldKey, "default");
    const next: Record<string, ResourceRecord> = {};
    for (const [key, value] of entries) {
      next[key === oldKey ? clean : key] = value;
    }
    setPortraits(next);
  }

  function updatePortrait(key: string, patch: ResourceRecord) {
    setPortraits({ ...portraits, [key]: { ...(portraits[key] || {}), ...patch } });
  }

  function removePortrait(key: string) {
    const next = { ...portraits };
    delete next[key];
    setPortraits(next);
  }

  return (
    <div className="wide structured-editor">
      <div className="structured-header">
        <span>Portraits</span>
        <button type="button" onClick={addPortrait}><Icon name="Add" />초상</button>
      </div>
      {entries.length === 0 && <p className="empty-state">초상 없음</p>}
      {entries.map(([key, portrait]) => {
        const center = asArray<number>(portrait.center);
        const profile = portrait.profile && typeof portrait.profile === "object" ? portrait.profile as ResourceRecord : {};
        const profileCenter = asArray<number>(profile.center);
        return (
          <article className="structured-row" key={key}>
            <TextField label="Key" value={key} onChange={(value) => renamePortrait(key, value)} />
            <TextField label="Path" value={portrait.path || ""} onChange={(value) => updatePortrait(key, { path: value })} />
            <UploadField
              label="Upload portrait"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onUpload={async (file) => {
                const path = await uploadFile(`assets/characters/${safeSegment(draft.id || "character")}/${safeSegment(key)}.${fileExtension(file)}`, file);
                updatePortrait(key, { path });
                return path;
              }}
            />
            <ImageCoordinateEditor
              label="Center"
              imagePath={portrait.path}
              x={center[0] ?? 0.5}
              y={center[1] ?? 0.5}
              onChange={(x, y) => updatePortrait(key, { center: [x, y] })}
            />
            <ImageCoordinateEditor
              label="Profile center"
              imagePath={portrait.path}
              x={profileCenter[0] ?? 0.5}
              y={profileCenter[1] ?? 0.5}
              onChange={(x, y) => updatePortrait(key, { profile: { ...profile, center: [x, y] } })}
            />
            <NumberField label="Center X" value={center[0] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => updatePortrait(key, { center: [value, center[1] ?? 0.5] })} />
            <NumberField label="Center Y" value={center[1] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => updatePortrait(key, { center: [center[0] ?? 0.5, value] })} />
            <NumberField label="Profile zoom" value={profile.zoom ?? 1} min={0.1} step={0.05} resetValue={1} onChange={(value) => updatePortrait(key, { profile: { ...profile, zoom: value } })} />
            <NumberField label="Profile X" value={profileCenter[0] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => updatePortrait(key, { profile: { ...profile, center: [value, profileCenter[1] ?? 0.5] } })} />
            <NumberField label="Profile Y" value={profileCenter[1] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => updatePortrait(key, { profile: { ...profile, center: [profileCenter[0] ?? 0.5, value] } })} />
            <button className="danger-action" type="button" onClick={() => removePortrait(key)}><Icon name="Delete" />삭제</button>
          </article>
        );
      })}
    </div>
  );
}

function ChapterArtEditor({
  draft,
  updateField,
  uploadFile
}: {
  draft: ResourceRecord;
  updateField: (field: string, value: unknown) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  const parallax = draft.parallax && typeof draft.parallax === "object" ? draft.parallax as ResourceRecord : { enabled: false, strength: 42, layers: [] };
  const layers = asArray<ResourceRecord>(parallax.layers);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const safeSelectedLayerIndex = Math.min(Math.max(selectedLayerIndex, 0), Math.max(layers.length - 1, 0));

  function updateParallax(patch: ResourceRecord) {
    updateField("parallax", { ...parallax, ...patch });
  }

  function updateLayer(index: number, patch: ResourceRecord) {
    updateParallax({
      layers: layers.map((layer, layerIndex) => layerIndex === index ? { ...layer, ...patch } : layer)
    });
  }

  function addLayer() {
    updateParallax({
      enabled: true,
      layers: [
        ...layers,
        {
          id: `sprite_${layers.length + 1}`,
          name: "새 레이어",
          kind: "sprite",
          path: "",
          position: [0.5, 0.5],
          anchor: [0.5, 0.5],
          order: layers.length,
          scale: 1,
          rotation: 0,
          depth: 0.3,
          perspective: 0,
          opacity: 1,
          floating: true,
          motion_strength: 1,
          visible: true
        }
      ]
    });
    setSelectedLayerIndex(layers.length);
  }

  function removeLayer(index: number) {
    updateParallax({ layers: layers.filter((_, layerIndex) => layerIndex !== index) });
    setSelectedLayerIndex(Math.max(0, Math.min(index - 1, layers.length - 2)));
  }

  return (
    <div className="wide structured-editor">
      <div className="structured-header">
        <span>Chapter Art / Parallax</span>
        <button type="button" onClick={addLayer}><Icon name="Add" />레이어</button>
      </div>
      <div className="form-grid compact">
        <TextField label="Thumbnail" value={draft.image || ""} onChange={(value) => updateField("image", value)} />
        <UploadField
          label="Upload thumbnail"
          accept="image/png,image/jpeg,image/webp"
          onUpload={async (file) => {
            const path = await uploadFile(`assets/chapters/${safeSegment(draft.id || "chapter")}/thumbnail.${fileExtension(file)}`, file);
            updateField("image", path);
            return path;
          }}
        />
        <NumberField label="Parallax strength" value={parallax.strength ?? 42} min={0} step={1} resetValue={42} onChange={(value) => updateParallax({ strength: value })} />
        <ToggleField label="Parallax enabled" checked={Boolean(parallax.enabled)} onChange={(checked) => updateParallax({ enabled: checked })} />
      </div>
      <ParallaxVisualEditor
        layers={layers}
        selectedLayerIndex={safeSelectedLayerIndex}
        onSelectLayer={setSelectedLayerIndex}
        onChangeLayerPosition={(index, x, y) => updateLayer(index, { position: [x, y] })}
      />
      {layers.length === 0 && <p className="empty-state">패럴랙스 레이어 없음</p>}
      {layers.map((layer, index) => {
        const position = asArray<number>(layer.position);
        const anchor = asArray<number>(layer.anchor);
        return (
          <details className={`chapter-layer-details ${index === safeSelectedLayerIndex ? "selected" : ""}`} key={`${layer.id}-${index}`} open={index === safeSelectedLayerIndex}>
            <summary onClick={(event) => {
              event.preventDefault();
              setSelectedLayerIndex(index);
            }}>
              <span>{index + 1}</span>
              <strong>{String(layer.name || layer.id || `Layer ${index + 1}`)}</strong>
              <code>{String(layer.kind || "sprite")}</code>
            </summary>
            <div className="structured-row chapter-layer-row">
              <TextField label="ID" value={layer.id || ""} onChange={(value) => updateLayer(index, { id: safeSegment(value, `layer_${index + 1}`) })} />
              <TextField label="Name" value={layer.name || ""} onChange={(value) => updateLayer(index, { name: value })} />
              <SelectLiteralField label="Kind" value={layer.kind || "sprite"} options={["background", "sprite", "overlay", "title"]} onChange={(value) => updateLayer(index, { kind: value })} />
              <TextField label="Path" value={layer.path || ""} onChange={(value) => updateLayer(index, { path: value })} />
              <UploadField
                label="Upload layer"
                accept="image/png,image/jpeg,image/webp"
                onUpload={async (file) => {
                  const path = await uploadFile(`assets/chapters/${safeSegment(draft.id || "chapter")}/${safeSegment(layer.id || `layer_${index + 1}`)}.${fileExtension(file)}`, file);
                  updateLayer(index, { path });
                  return path;
                }}
              />
              <NumberField label="X" value={position[0] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => updateLayer(index, { position: [value, position[1] ?? 0.5] })} />
              <NumberField label="Y" value={position[1] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => updateLayer(index, { position: [position[0] ?? 0.5, value] })} />
              <NumberField label="Anchor X" value={anchor[0] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => updateLayer(index, { anchor: [value, anchor[1] ?? 0.5] })} />
              <NumberField label="Anchor Y" value={anchor[1] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => updateLayer(index, { anchor: [anchor[0] ?? 0.5, value] })} />
              <NumberField label="Order" value={layer.order ?? index} step={1} resetValue={index} onChange={(value) => updateLayer(index, { order: value })} />
              <NumberField label="Scale" value={layer.scale ?? 1} min={0} step={0.05} resetValue={1} onChange={(value) => updateLayer(index, { scale: value })} />
              <NumberField label="Rotation" value={layer.rotation ?? 0} step={1} resetValue={0} onChange={(value) => updateLayer(index, { rotation: value })} />
              <NumberField label="Depth" value={layer.depth ?? 0.3} step={0.05} resetValue={0.3} onChange={(value) => updateLayer(index, { depth: value })} />
              <NumberField label="Perspective" value={layer.perspective ?? 0} step={0.05} resetValue={0} onChange={(value) => updateLayer(index, { perspective: value })} />
              <NumberField label="Opacity" value={layer.opacity ?? 1} min={0} max={1} step={0.05} resetValue={1} onChange={(value) => updateLayer(index, { opacity: value })} />
              <ToggleField label="Visible" checked={layer.visible !== false} onChange={(checked) => updateLayer(index, { visible: checked })} />
              <ToggleField label="Floating" checked={Boolean(layer.floating)} onChange={(checked) => updateLayer(index, { floating: checked })} />
              <button type="button" onClick={() => setSelectedLayerIndex(index)}><Icon name="Edit" />선택</button>
              <button className="danger-action" type="button" onClick={() => removeLayer(index)}><Icon name="Delete" />삭제</button>
            </div>
          </details>
        );
      })}
    </div>
  );
}

function ImageCoordinateEditor({
  label,
  imagePath,
  x,
  y,
  onChange
}: {
  label: string;
  imagePath: unknown;
  x: unknown;
  y: unknown;
  onChange: (x: number, y: number) => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const safeX = clamp01Number(x, 0.5);
  const safeY = clamp01Number(y, 0.5);
  const imageUrl = resPathToAssetUrl(imagePath);

  function updateFromPointer(event: ReactPointerEvent<HTMLElement>) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const nextX = roundCoordinate((event.clientX - rect.left) / rect.width);
    const nextY = roundCoordinate((event.clientY - rect.top) / rect.height);
    onChange(nextX, nextY);
  }

  return (
    <div className="coordinate-editor">
      <div className="coordinate-editor-header">
        <span>{label}</span>
        <code>{safeX.toFixed(3)}, {safeY.toFixed(3)}</code>
      </div>
      <div
        className={`coordinate-stage ${imageUrl ? "has-image" : ""}`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (event.buttons !== 1) return;
          updateFromPointer(event);
        }}
        ref={stageRef}
        style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}
      >
        <button
          aria-label={`${label} coordinate`}
          className="coordinate-marker"
          style={{ left: `${safeX * 100}%`, top: `${safeY * 100}%` }}
          type="button"
        />
      </div>
    </div>
  );
}

function ParallaxVisualEditor({
  layers,
  selectedLayerIndex,
  onSelectLayer,
  onChangeLayerPosition
}: {
  layers: ResourceRecord[];
  selectedLayerIndex: number;
  onSelectLayer: (index: number) => void;
  onChangeLayerPosition: (index: number, x: number, y: number) => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const backgroundLayer = layers.find((layer) => String(layer.kind || "") === "background" && resPathToAssetUrl(layer.path)) || layers.find((layer) => resPathToAssetUrl(layer.path));
  const backgroundUrl = resPathToAssetUrl(backgroundLayer?.path);

  function updateFromPointer(event: ReactPointerEvent<HTMLElement>, index: number) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const nextX = roundCoordinate((event.clientX - rect.left) / rect.width);
    const nextY = roundCoordinate((event.clientY - rect.top) / rect.height);
    onChangeLayerPosition(index, nextX, nextY);
  }

  return (
    <section className="parallax-visual-editor">
      <div className="coordinate-editor-header">
        <span>Layer position</span>
        <code>{layers.length} layers</code>
      </div>
      <div
        className={`parallax-stage ${backgroundUrl ? "has-image" : ""}`}
        ref={stageRef}
        style={backgroundUrl ? { backgroundImage: `url("${backgroundUrl}")` } : undefined}
      >
        {layers.map((layer, index) => {
          const position = asArray<number>(layer.position);
          const x = clamp01Number(position[0], 0.5);
          const y = clamp01Number(position[1], 0.5);
          const visible = layer.visible !== false;
          return (
            <button
              aria-label={`Layer ${index + 1} position`}
              className={`parallax-marker ${index === selectedLayerIndex ? "selected" : ""} ${visible ? "" : "hidden-layer"}`}
              key={`${layer.id || "layer"}-${index}`}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                onSelectLayer(index);
                updateFromPointer(event, index);
              }}
              onPointerMove={(event) => {
                if (event.buttons !== 1) return;
                updateFromPointer(event, index);
              }}
              style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
              type="button"
            >
              <span>{index + 1}</span>
            </button>
          );
        })}
      </div>
      {layers.length > 0 && (
        <div className="parallax-selected-summary">
          <strong>{String(layers[selectedLayerIndex]?.name || layers[selectedLayerIndex]?.id || `Layer ${selectedLayerIndex + 1}`)}</strong>
          <span>{String(layers[selectedLayerIndex]?.kind || "sprite")}</span>
        </div>
      )}
    </section>
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
  updateStatementNode,
  removeStatementNode,
  insertTag,
  launchGodotPreview,
  checkGodotBridge,
  bridgeStatus
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
  updateStatementNode: (index: number, node: ResourceRecord) => void;
  removeStatementNode: (index: number) => void;
  insertTag: (action: typeof tagActions[number]) => void;
  launchGodotPreview: () => Promise<void>;
  checkGodotBridge: () => Promise<void>;
  bridgeStatus: string;
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
          <button type="button" onClick={() => void checkGodotBridge()}><Icon name="CheckCircle" />Bridge</button>
          <button type="button" onClick={() => void launchGodotPreview()}><Icon name="SmartToy" />Godot</button>
        </div>
        <div className={`bridge-status ${bridgeStatus.startsWith("오류") ? "error" : bridgeStatus.startsWith("연결됨") ? "ok" : ""}`}>
          {bridgeStatus}
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
        <StatementNodesEditor
          statementNodes={statementNodes}
          updateStatementNode={updateStatementNode}
          removeStatementNode={removeStatementNode}
        />
      </div>

      <div className="node-editor">
        {!selectedNode && <p className="empty-state">노드를 추가하거나 선택하세요.</p>}
        {selectedNode && (
          <>
            <div className="node-editor-toolbar">
              <div className="node-stepper" aria-label="노드 이동">
                <button type="button" disabled={selectedNodeIndex <= 0} onClick={() => setSelectedNodeIndex(Math.max(0, selectedNodeIndex - 1))}>
                  이전
                </button>
                <span>{selectedNodeIndex + 1} / {nodes.length}</span>
                <button type="button" disabled={selectedNodeIndex >= nodes.length - 1} onClick={() => setSelectedNodeIndex(Math.min(nodes.length - 1, selectedNodeIndex + 1))}>
                  다음
                </button>
              </div>
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
                <EffectPreviewStrip text={selectedNode.text || ""} />
                <StageCastEditor
                  characters={references.characters}
                  nodes={nodes}
                  selectedNodeIndex={selectedNodeIndex}
                  speakerId={String(selectedNode.speaker || "")}
                  speakerMystery={Boolean(selectedNode.speaker_mystery)}
                  stageCast={selectedNode.stage_cast}
                  onChange={(stageCast) => updateDialogueNode(selectedNodeIndex, { ...selectedNode, stage_cast: stageCast })}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EffectPreviewStrip({ text }: { text: string }) {
  const tags = detectTextTags(text);
  if (tags.length === 0) {
    return <div className="effect-preview-strip"><span>BBCode / 이벤트 태그 없음</span></div>;
  }

  return (
    <div className="effect-preview-strip">
      {tags.map((tag) => (
        <span className={`effect-chip ${tag}`} key={tag}>
          {tagPreviewLabel(tag)}
        </span>
      ))}
    </div>
  );
}

function StageCastEditor({
  characters,
  nodes,
  selectedNodeIndex,
  speakerId,
  speakerMystery,
  stageCast,
  onChange
}: {
  characters: ResourceSummary[];
  nodes: ResourceRecord[];
  selectedNodeIndex: number;
  speakerId: string;
  speakerMystery: boolean;
  stageCast: unknown;
  onChange: (stageCast: Record<string, ResourceRecord>) => void;
}) {
  const cast = stageCast && typeof stageCast === "object" ? stageCast as Record<string, ResourceRecord> : {};
  const entries = Object.entries(cast);
  const castIds = entries.map(([characterId]) => characterId);
  const [characterDetails, setCharacterDetails] = useState<Record<string, ResourceRecord>>({});
  const castIdsKey = [...castIds].sort((a, b) => a.localeCompare(b)).join("|");

  useEffect(() => {
    const ids = castIds.filter((characterId) => characterId && characterId !== "mystery" && !characterDetails[characterId]);
    if (ids.length === 0) return undefined;

    let cancelled = false;
    void Promise.all(ids.map(async (characterId) => {
      try {
        const result = await loadResource("characters", characterId);
        return [characterId, result.data] as const;
      } catch {
        return [characterId, null] as const;
      }
    })).then((loaded) => {
      if (cancelled) return;
      setCharacterDetails((previous) => {
        const next = { ...previous };
        for (const [characterId, data] of loaded) {
          if (data) next[characterId] = data;
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [castIdsKey, characterDetails]);

  function updateCast(characterId: string, patch: ResourceRecord) {
    onChange({ ...cast, [characterId]: { ...(cast[characterId] || {}), ...patch } });
  }

  function removeCast(characterId: string) {
    const next = { ...cast };
    delete next[characterId];
    onChange(next);
  }

  function addCast(characterId: string) {
    if (!characterId || cast[characterId]) return;
    const isSpeaker = characterId === speakerId;
    onChange({
      ...cast,
      [characterId]: {
        portrait: "",
        portrait_position: "center",
        animation_order: entries.length + 1,
        animation_speed: isSpeaker ? 1 : 1.25,
        portrait_opacity: isSpeaker ? 1 : 0.7,
        portrait_zoom: isSpeaker ? 300 : 250,
        character_exit: false,
        mystery: isSpeaker && speakerMystery
      }
    });
  }

  function updatePosition(characterId: string, value: string) {
    const position = normalizeCastPosition(value);
    const previousOffset = parseCastOffset(cast[characterId]?.portrait_offset);
    updateCast(characterId, {
      portrait_position: position,
      portrait_offset: position === "custom" ? [previousOffset.x, previousOffset.y] : null
    });
  }

  function applyPreset(characterId: string, preset: "speaker" | "bystander") {
    updateCast(characterId, preset === "speaker"
      ? { portrait_zoom: 300, animation_speed: 1, portrait_opacity: 1 }
      : { portrait_zoom: 250, animation_speed: 1.25, portrait_opacity: 0.7 });
  }

  const stageEntries = entries.map(([characterId, value], index) => {
    const character = characterDetails[characterId];
    const inherited = findPreviousCastEntry(nodes, selectedNodeIndex, characterId);
    return {
      characterId,
      character,
      index,
      inherited,
      isSpeaker: characterId === speakerId,
      label: characterLabel(characterId, character, characters),
      portrait: resolveCastPortrait(character, value.portrait),
      position: normalizeCastPosition(value.portrait_position ?? value.position),
      offset: parseCastOffset(value.portrait_offset),
      positionOrder: normalizeNumber(value.portrait_position_order ?? value.position_order, index + 1, 1),
      animationOrder: normalizeNumber(value.animation_order ?? value.order, index + 1, 1),
      animationSpeed: normalizeNumber(value.animation_speed, characterId === speakerId ? 1 : 1.25, 0.5, 2),
      portraitOpacity: normalizeNumber(value.portrait_opacity ?? value.opacity, characterId === speakerId ? 1 : 0.7, 0, 1),
      portraitZoom: normalizeNumber(value.portrait_zoom, characterId === speakerId ? 300 : 250, 100, 500),
      flipH: Boolean(value.portrait_flip_h ?? value.flip_h ?? value.flip_x),
      characterExit: Boolean(value.character_exit ?? value.exit),
      mystery: Boolean(value.mystery ?? value.portrait_mystery ?? (characterId === speakerId && speakerMystery))
    };
  });

  return (
    <div className="stage-cast-editor">
      <div className="structured-header">
        <span>stage_cast</span>
        <select value="" onChange={(event) => addCast(event.target.value)}>
          <option value="">캐릭터 추가</option>
          <option value="mystery">mystery</option>
          {characters.map((character) => <option key={character.id} value={character.id}>{character.title}</option>)}
        </select>
      </div>
      {entries.length === 0 && <p className="empty-state">무대 캐스트 없음</p>}
      {stageEntries.length > 0 && <StageCastScenePreview entries={stageEntries} />}
      {stageEntries.map((entry) => {
        const value = cast[entry.characterId] || {};
        const portraitOptions = portraitKeys(entry.character);
        const isCustomPosition = entry.position === "custom";
        return (
          <article className="stage-cast-row" key={entry.characterId}>
            <div className="stage-cast-identity">
              <CastPortraitPreview entry={entry} />
              <div>
                <strong>{entry.label}</strong>
                <code>{entry.characterId}</code>
                <div className="stage-cast-badges">
                  {entry.isSpeaker && <span>화자</span>}
                  {entry.inherited && <span>{entry.inherited.index + 1}번 상속</span>}
                  {entry.mystery && <span>수수께끼</span>}
                  {entry.characterExit && <span>퇴장</span>}
                </div>
              </div>
            </div>
            {portraitOptions.length > 0 ? (
              <label className="field-block">
                <span>Portrait</span>
                <select value={String(value.portrait || "")} onChange={(event) => updateCast(entry.characterId, { portrait: event.target.value })}>
                  <option value="">미지정</option>
                  {portraitOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            ) : (
              <TextField label="Portrait" value={value.portrait || ""} onChange={(next) => updateCast(entry.characterId, { portrait: next })} />
            )}
            <SelectLiteralField
              label="Position"
              value={entry.position}
              options={["left", "center", "right", "far_left", "far_right", "custom"]}
              onChange={(next) => updatePosition(entry.characterId, next)}
            />
            {isCustomPosition && (
              <>
                <NumberField
                  label="Offset X"
                  value={entry.offset.x}
                  step={0.01}
                  resetValue={0}
                  onChange={(next) => updateCast(entry.characterId, { portrait_offset: [next, entry.offset.y] })}
                />
                <NumberField
                  label="Offset Y"
                  value={entry.offset.y}
                  step={0.01}
                  resetValue={0}
                  onChange={(next) => updateCast(entry.characterId, { portrait_offset: [entry.offset.x, next] })}
                />
              </>
            )}
            <NumberField label="Position order" value={entry.positionOrder} min={1} step={1} resetValue={entry.index + 1} onChange={(next) => updateCast(entry.characterId, { portrait_position_order: next })} />
            <NumberField label="Animation order" value={entry.animationOrder} min={1} step={1} resetValue={entry.index + 1} onChange={(next) => updateCast(entry.characterId, { animation_order: next })} />
            <NumberField label="Zoom" value={entry.portraitZoom} min={100} max={500} step={50} resetValue={entry.isSpeaker ? 300 : 250} onChange={(next) => updateCast(entry.characterId, { portrait_zoom: next })} />
            <NumberField label="Opacity" value={entry.portraitOpacity} min={0} max={1} step={0.1} resetValue={entry.isSpeaker ? 1 : 0.7} onChange={(next) => updateCast(entry.characterId, { portrait_opacity: next })} />
            <NumberField label="Animation speed" value={entry.animationSpeed} min={0.5} max={2} step={0.25} resetValue={entry.isSpeaker ? 1 : 1.25} onChange={(next) => updateCast(entry.characterId, { animation_speed: next })} />
            <ToggleField label="Flip X" checked={entry.flipH} onChange={(checked) => updateCast(entry.characterId, { portrait_flip_h: checked })} />
            <ToggleField label="Mystery" checked={entry.mystery} onChange={(checked) => updateCast(entry.characterId, { mystery: checked })} />
            <ToggleField label="Exit" checked={entry.characterExit} onChange={(checked) => updateCast(entry.characterId, { character_exit: checked })} />
            <div className="stage-cast-presets">
              <button type="button" onClick={() => applyPreset(entry.characterId, "speaker")}>발화자</button>
              <button type="button" onClick={() => applyPreset(entry.characterId, "bystander")}>비발화자</button>
            </div>
            <button className="danger-action" type="button" onClick={() => removeCast(entry.characterId)}><Icon name="Delete" />삭제</button>
          </article>
        );
      })}
    </div>
  );
}

type StageCastPreviewEntry = {
  characterId: string;
  character: ResourceRecord | undefined;
  index: number;
  inherited: { index: number; entry: ResourceRecord } | null;
  isSpeaker: boolean;
  label: string;
  portrait: { key: string; path: string; center: number[]; profile: ResourceRecord } | null;
  position: string;
  offset: { x: number; y: number };
  positionOrder: number;
  animationOrder: number;
  animationSpeed: number;
  portraitOpacity: number;
  portraitZoom: number;
  flipH: boolean;
  characterExit: boolean;
  mystery: boolean;
};

function StageCastScenePreview({ entries }: { entries: StageCastPreviewEntry[] }) {
  const visibleEntries = entries
    .filter((entry) => entry.portrait?.path && !entry.characterExit)
    .sort((a, b) => a.animationOrder === b.animationOrder ? a.index - b.index : a.animationOrder - b.animationOrder);

  return (
    <div className="stage-cast-scene-preview">
      <div className="stage-cast-center-line" />
      {visibleEntries.map((entry) => {
        const offset = stageCastPreviewOffset(entry, entries);
        const style = {
          "--cast-x": `${50 + offset.x * 100}%`,
          "--cast-y": `${offset.y * 100}%`,
          "--cast-scale": String(Math.max(0.45, Math.min(1.75, entry.portraitZoom / 300))),
          "--cast-opacity": String(entry.portraitOpacity)
        } as CSSProperties;
        return (
          <div className={`stage-cast-sprite ${entry.flipH ? "flipped" : ""} ${entry.mystery ? "mystery" : ""}`} key={entry.characterId} style={style}>
            <img alt="" src={resPathToAssetUrl(entry.portrait?.path)} />
            <span>{entry.label}</span>
          </div>
        );
      })}
      {visibleEntries.length === 0 && <span className="stage-cast-preview-empty">preview empty</span>}
    </div>
  );
}

function CastPortraitPreview({ entry }: { entry: StageCastPreviewEntry }) {
  const imageUrl = resPathToAssetUrl(entry.portrait?.path);
  const profileCenter = asArray<number>(entry.portrait?.profile?.center);
  const fallbackCenter = entry.portrait?.center || [];
  const centerX = clamp01Number(profileCenter[0] ?? fallbackCenter[0], 0.5);
  const centerY = clamp01Number(profileCenter[1] ?? fallbackCenter[1], 0.34);
  const profileZoom = normalizeNumber(entry.portrait?.profile?.zoom, 1, 0.4, 3);
  const style = {
    "--portrait-x": `${centerX * 100}%`,
    "--portrait-y": `${centerY * 100}%`,
    "--portrait-scale": String(profileZoom)
  } as CSSProperties;
  return (
    <div className={`cast-portrait-preview ${entry.mystery ? "mystery" : ""}`}>
      {imageUrl ? <img alt="" src={imageUrl} style={style} /> : <span>{entry.characterId === "mystery" ? "???" : "NO"}</span>}
    </div>
  );
}

function portraitKeys(character: ResourceRecord | undefined) {
  const portraits = character?.portraits && typeof character.portraits === "object"
    ? character.portraits as Record<string, ResourceRecord>
    : {};
  return Object.keys(portraits);
}

function resolveCastPortrait(character: ResourceRecord | undefined, keyOrPath: unknown): StageCastPreviewEntry["portrait"] {
  const portraits = character?.portraits && typeof character.portraits === "object"
    ? character.portraits as Record<string, ResourceRecord>
    : {};
  const key = String(keyOrPath || "");
  if (key.startsWith("res://")) {
    return { key, path: key, center: [0.5, 0.34], profile: {} };
  }

  const portraitKey = key && portraits[key] ? key : Object.keys(portraits)[0];
  const portrait = portraitKey ? portraits[portraitKey] : null;
  if (!portrait) return null;
  return {
    key: portraitKey,
    path: String(portrait.path || ""),
    center: asArray<number>(portrait.center),
    profile: portrait.profile && typeof portrait.profile === "object" ? portrait.profile as ResourceRecord : {}
  };
}

function characterLabel(characterId: string, character: ResourceRecord | undefined, summaries: ResourceSummary[]) {
  if (characterId === "mystery") return "???";
  return String(character?.display_name || summaries.find((entry) => entry.id === characterId)?.title || characterId);
}

function findPreviousCastEntry(nodes: ResourceRecord[], selectedNodeIndex: number, characterId: string) {
  for (let index = selectedNodeIndex - 1; index >= 0; index -= 1) {
    const previousCast = nodes[index]?.stage_cast;
    if (!previousCast || typeof previousCast !== "object") continue;
    const entry = (previousCast as Record<string, ResourceRecord>)[characterId];
    if (entry && typeof entry === "object") return { index, entry };
  }
  return null;
}

function normalizeCastPosition(value: unknown) {
  const text = String(value || "center").trim().toLowerCase();
  if (["left", "center", "right", "far_left", "far_right", "custom"].includes(text)) return text;
  return "center";
}

function parseCastOffset(value: unknown) {
  if (Array.isArray(value)) {
    return { x: normalizeNumber(value[0], 0), y: normalizeNumber(value[1], 0) };
  }
  if (value && typeof value === "object") {
    const record = value as ResourceRecord;
    return { x: normalizeNumber(record.x ?? record[0], 0), y: normalizeNumber(record.y ?? record[1], 0) };
  }
  return { x: 0, y: 0 };
}

function stageCastPreviewOffset(entry: StageCastPreviewEntry, allEntries: StageCastPreviewEntry[]) {
  if (entry.position === "custom") return entry.offset;
  const base = ({
    far_left: { x: -0.38, y: 0 },
    left: { x: -0.22, y: 0 },
    center: { x: 0, y: 0 },
    right: { x: 0.22, y: 0 },
    far_right: { x: 0.38, y: 0 }
  } as Record<string, { x: number; y: number }>)[entry.position] || { x: 0, y: 0 };

  const group = allEntries
    .filter((candidate) => candidate.position === entry.position && candidate.portrait && !candidate.characterExit && candidate.position !== "custom")
    .sort((a, b) => a.positionOrder === b.positionOrder ? a.index - b.index : a.positionOrder - b.positionOrder);
  if (group.length <= 1) return base;

  const stackIndex = Math.max(0, group.findIndex((candidate) => candidate.characterId === entry.characterId));
  const spread = stackIndex - (group.length - 1) * 0.5;
  return {
    x: Math.max(-0.42, Math.min(0.42, base.x + spread * 0.16)),
    y: base.y
  };
}

function StatementNodesEditor({
  statementNodes,
  updateStatementNode,
  removeStatementNode
}: {
  statementNodes: ResourceRecord[];
  updateStatementNode: (index: number, node: ResourceRecord) => void;
  removeStatementNode: (index: number) => void;
}) {
  if (statementNodes.length === 0) return null;

  return (
    <div className="statement-editor-list">
      {statementNodes.map((node, index) => {
        const lies = asArray<ResourceRecord>(node.statement_lies);
        return (
          <article className="statement-editor" key={index}>
            <div className="structured-header">
              <span>Statement {index + 1}</span>
              <button className="danger-action" type="button" onClick={() => removeStatementNode(index)}>
                <Icon name="Delete" />삭제
              </button>
            </div>
            <TextField label="Speaker" value={node.speaker || "narrator"} onChange={(value) => updateStatementNode(index, { ...node, speaker: value })} />
            <TextField label="Text" value={node.text || ""} multiline onChange={(value) => updateStatementNode(index, { ...node, text: value })} />
            <div className="reaction-list">
              {lies.length === 0 && <span className="muted">[lie] 문구 없음</span>}
              {lies.map((lie, lieIndex) => (
                <div className="reaction-row" key={lieIndex}>
                  <b>[lie] {lie.phrase || `#${lieIndex + 1}`}</b>
                  <span>{asArray(lie.reactions).length} reactions</span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextLies = lies.map((entry, entryIndex) => entryIndex === lieIndex
                        ? {
                            ...entry,
                            reactions: [
                              ...asArray<ResourceRecord>(entry.reactions),
                              { label: "제시", nodes: [] }
                            ]
                          }
                        : entry);
                      updateStatementNode(index, { ...node, statement_lies: nextLies });
                    }}
                  >
                    <Icon name="Add" />반응
                  </button>
                </div>
              ))}
            </div>
          </article>
        );
      })}
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

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  resetValue
}: {
  label: string;
  value: unknown;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  resetValue?: number;
}) {
  const numericValue = normalizeNumber(value, resetValue ?? 0, min, max);

  function commit(nextValue: number) {
    onChange(normalizeNumber(nextValue, numericValue, min, max));
  }

  return (
    <div className="field-block number-field">
      <span>{label}</span>
      <div className="number-control">
        <button aria-label={`${label} decrease`} type="button" onClick={() => commit(roundForInput(numericValue - step))}>
          <Icon name="Remove" />
        </button>
        <input
          inputMode="decimal"
          max={max}
          min={min}
          onChange={(event) => commit(Number(event.target.value))}
          step={step}
          type="number"
          value={formatNumberInput(numericValue)}
        />
        <button aria-label={`${label} increase`} type="button" onClick={() => commit(roundForInput(numericValue + step))}>
          <Icon name="Add" />
        </button>
        {resetValue !== undefined && (
          <button aria-label={`${label} reset`} className="number-reset" type="button" onClick={() => commit(resetValue)}>
            <Icon name="RestartAlt" />
          </button>
        )}
      </div>
    </div>
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

function UploadField({
  label,
  accept,
  onUpload
}: {
  label: string;
  accept: string;
  onUpload: (file: File) => Promise<string | void>;
}) {
  const [busy, setBusy] = useState(false);
  const [lastPath, setLastPath] = useState("");

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBusy(true);
    try {
      const path = await onUpload(file);
      if (path) setLastPath(path);
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="upload-field">
      <span>{label}</span>
      <input accept={accept} disabled={busy} onChange={handleChange} type="file" />
      {lastPath && <code className="upload-result">{lastPath}</code>}
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle-field">
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <span>{label}</span>
    </label>
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

function fileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  if (file.type === "audio/mpeg") return "mp3";
  if (file.type === "audio/ogg") return "ogg";
  if (file.type === "audio/wav") return "wav";
  return "bin";
}

function safeSegment(value: unknown, fallback = "asset") {
  const clean = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return clean || fallback;
}

function storyAssetUploadPath(asset: ResourceRecord, file: File) {
  const kind = String(asset.kind || "sfx");
  const folder = kind === "bgm" ? "bgm" : kind === "background" ? "background" : "sfx";
  return `assets/story_assets/${folder}/${safeSegment(asset.id || "asset")}.${fileExtension(file)}`;
}

function resPathToAssetUrl(value: unknown) {
  const path = String(value || "").trim();
  if (!path.startsWith("res://assets/")) return "";
  return `/repo/${path.replace(/^res:\/\//, "")}`;
}

function clamp01Number(value: unknown, fallback = 0.5) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(1, Math.max(0, number));
}

function normalizeNumber(value: unknown, fallback = 0, min?: number, max?: number) {
  const parsed = Number(value);
  let next = Number.isFinite(parsed) ? parsed : fallback;
  if (min !== undefined) next = Math.max(min, next);
  if (max !== undefined) next = Math.min(max, next);
  return roundForInput(next);
}

function roundCoordinate(value: number) {
  return Math.round(clamp01Number(value) * 1000) / 1000;
}

function roundForInput(value: number) {
  return Math.round(value * 1000) / 1000;
}

function formatNumberInput(value: number) {
  if (Number.isInteger(value)) return String(value);
  return String(roundForInput(value));
}

function detectTextTags(text: string) {
  const tags = new Set<string>();
  const patterns: Array<[string, RegExp]> = [
    ["lie", /\[lie\b/i],
    ["shake", /\[shake\b/i],
    ["wave", /\[wave\b/i],
    ["alpha", /\[alpha\b/i],
    ["font", /\[font_scale\b/i],
    ["speed", /\[speed\b/i],
    ["color", /\[color=/i],
    ["bgm", /\[bgm\b/i],
    ["sfx", /\[(sfx|se)\b/i],
    ["bg", /\[bg\b/i],
    ["auto", /\[auto_next\b/i]
  ];
  for (const [tag, pattern] of patterns) {
    if (pattern.test(text)) tags.add(tag);
  }
  return [...tags];
}

function tagPreviewLabel(tag: string) {
  return {
    lie: "거짓",
    shake: "흔들림",
    wave: "물결",
    alpha: "반투명",
    font: "크기 변화",
    speed: "속도",
    color: "색상",
    bgm: "BGM",
    sfx: "SFX",
    bg: "배경",
    auto: "자동"
  }[tag] || tag;
}

export default App;

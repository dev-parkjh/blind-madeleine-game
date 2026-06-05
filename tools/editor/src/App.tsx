import type { ChangeEvent, CSSProperties, MutableRefObject, PointerEvent as ReactPointerEvent, ReactNode } from "react";
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
type PointerPoint = { x: number; y: number };
type BbcodeAttributes = Record<string, string | boolean>;
type RichTextAstNode =
  | { type: "text"; text: string }
  | { type: "span"; tagName: string; attrs: BbcodeAttributes; children: RichTextAstNode[] }
  | { type: "event"; tagName: string; attrs: BbcodeAttributes; raw: string };
type RichTextTagPresentation = {
  classNames: string[];
  style: CSSProperties;
  title?: string;
  dataNote?: string;
};
type ChapterArtSnapshot = {
  chapterId: string;
  payload: ResourceRecord;
  serialized: string;
};
type ParallaxVisualDrag =
  | { mode: "position"; index: number; startX: number; startY: number; originalX: number; originalY: number }
  | { mode: "anchor"; index: number; previewRect: DOMRect }
  | { mode: "scale"; index: number; pivot: PointerPoint; startDistance: number; originalScale: number }
  | { mode: "rotation"; index: number; pivot: PointerPoint; startAngle: number; originalRotation: number };

const chapterThumbnailWidth = 1920;
const chapterThumbnailHeight = 1080;
const profileCropCanvasSize = 220;
const profileZoomDefault = 3;
const profileZoomMin = 1;
const profileZoomMax = 6;
const profileZoomStep = 0.5;
const godotPreviewEndpointStorageKey = "blind-madeleine-godot-preview-endpoint";
const godotPreviewGodotPathStorageKey = "blind-madeleine-godot-preview-godot-path";
const godotPreviewDefaultEndpoint = "http://127.0.0.1:51234";
const dialogueBbcodeTagNames = new Set([
  "b", "i", "u", "s", "code", "font", "font_size", "font_scale", "color", "bgcolor", "fgcolor",
  "outline_size", "outline_color", "shake", "wave", "tornado", "pulse", "fade",
  "rainbow", "grow", "blink", "alpha", "lie",
  "speed", "text_speed", "type_speed", "typewriter_speed",
  "sfx", "sound", "se", "bgm", "music", "bgm_stop", "music_stop", "bgm_volume", "music_volume",
  "bg", "background", "bg_clear", "background_clear", "bg_remove", "background_remove",
  "auto_next", "auto_advance", "advance", "lb", "rb"
]);
const dialogueEventTagNames = new Set([
  "sfx", "sound", "se", "bgm", "music", "bgm_stop", "music_stop", "bgm_volume", "music_volume",
  "bg", "background", "bg_clear", "background_clear", "bg_remove", "background_remove",
  "auto_next", "auto_advance", "advance"
]);

const tagActions = [
  { label: "굵게", hint: "b", open: "[b]", close: "[/b]" },
  { label: "기울임", hint: "i", open: "[i]", close: "[/i]" },
  { label: "밑줄", hint: "u", open: "[u]", close: "[/u]" },
  { label: "취소선", hint: "s", open: "[s]", close: "[/s]" },
  { label: "색상", hint: "color", open: "[color=#7ee7d8]", close: "[/color]" },
  { label: "배경 강조", hint: "bgcolor", open: "[bgcolor=#2f2438]", close: "[/bgcolor]" },
  { label: "윤곽선", hint: "outline", open: "[outline_size=2][outline_color=#000000]", close: "[/outline_color][/outline_size]" },
  { label: "거짓", hint: "lie", open: "[lie]", close: "[/lie]" },
  { label: "흔들림", hint: "shake", open: "[shake rate=22.0 level=6 connected=1]", close: "[/shake]" },
  { label: "물결", hint: "wave", open: "[wave amp=28.0 freq=5.0 connected=1]", close: "[/wave]" },
  { label: "회오리", hint: "tornado", open: "[tornado radius=10.0 freq=1.0 connected=1]", close: "[/tornado]" },
  { label: "맥박", hint: "pulse", open: "[pulse freq=1.2 color=#ffffff40 ease=-2.0]", close: "[/pulse]" },
  { label: "희미해짐", hint: "fade", open: "[fade]", close: "[/fade]" },
  { label: "무지개", hint: "rainbow", open: "[rainbow freq=1.0 sat=0.75 val=0.95 speed=0.7]", close: "[/rainbow]" },
  { label: "점점커짐", hint: "grow", open: "[grow duration=1.05 from=0.78 to=1.34]", close: "[/grow]" },
  { label: "깜빡임", hint: "blink", open: "[blink freq=3.4 min=0.14]", close: "[/blink]" },
  { label: "반투명", hint: "alpha", open: "[alpha value=0.45]", close: "[/alpha]" },
  { label: "느리게", hint: "speed", open: "[speed=0.6]", close: "[/speed]" },
  { label: "빠르게", hint: "speed", open: "[speed=1.8]", close: "[/speed]" },
  { label: "글자 배율", hint: "scale", open: "[font_scale=2]", close: "[/font_scale]" },
  { label: "글자 작아짐", hint: "1->0.3", open: "[font_scale from=1 to=0.3]", close: "[/font_scale]" },
  { label: "글자 커짐", hint: "0.3->1", open: "[font_scale from=0.3 to=1]", close: "[/font_scale]" },
  { label: "BGM", hint: "bgm", insert: "[bgm id=\"\" fade=0.5]" },
  { label: "BGM 볼륨", hint: "bgm_volume", insert: "[bgm_volume volume=0.5 fade=0.5]" },
  { label: "BGM 종료", hint: "bgm_stop", insert: "[bgm_stop fade=0.5]" },
  { label: "SFX", hint: "sfx", insert: "[sfx id=\"\"]" },
  { label: "배경", hint: "bg", insert: "[bg id=\"\" transition=fade duration=0.5 opacity=1 blur=3 brightness=0.75 saturate=0.8 dim=0.15]" },
  { label: "배경 제거", hint: "bg_clear", insert: "[bg_clear transition=fade duration=0.5]" },
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
  const [savedJsonText, setSavedJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<EditorTab>("form");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("workspace");
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);
  const [bridgeStatus, setBridgeStatus] = useState("미확인");
  const [bridgeEndpoint, setBridgeEndpoint] = useState(readGodotPreviewEndpoint);
  const [godotPath, setGodotPath] = useState(readGodotPathSetting);
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

  useEffect(() => {
    saveLocalSetting(godotPreviewEndpointStorageKey, bridgeEndpoint);
  }, [bridgeEndpoint]);

  useEffect(() => {
    saveLocalSetting(godotPreviewGodotPathStorageKey, godotPath);
  }, [godotPath]);

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
    setSavedJsonText("");
    setJsonError("");
    setSearch("");
    setTab(nextType === "dialogues" ? "nodes" : "form");
    setMobilePanel("library");
    await refreshList(nextType, true);
  }

  async function selectResource(nextType: ResourceType, id: string, force = false) {
    if (!force && (id === selectedId || !confirmDiscard())) return;
    const body = await loadResource(nextType, id);
    const formatted = formatJson(body.data);
    setSelectedId(id);
    setDraft(body.data);
    setJsonText(formatted);
    setSavedJsonText(formatted);
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
    setSavedJsonText("");
    setDirty(false);
    await refreshSummary();
    await refreshList(type, true);
    notify("삭제 완료");
  }

  async function saveCurrent() {
    if (!selectedId || !draft || jsonError) return;
    try {
      const thumbnailResult = type === "chapters" ? await uploadChapterThumbnailForDraft(draft) : null;
      const nextDraft = thumbnailResult?.draft || draft;
      const body = await saveResource(type, selectedId, nextDraft);
      const formatted = formatJson(body.data);
      setDraft(body.data);
      setJsonText(formatted);
      setSavedJsonText(formatted);
      setDirty(false);
      await refreshSummary();
      await refreshList(type, false);
      notify(thumbnailResult && !thumbnailResult.skipped ? `저장 완료 · 썸네일 ${thumbnailResult.resPath}` : "저장 완료");
    } catch (error) {
      notify(`저장 실패: ${(error as Error).message}`);
    }
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
    const formatted = formatJson(nextDraft);
    setDraft(nextDraft);
    setJsonText(formatted);
    setJsonError("");
    setDirty(formatted !== savedJsonText);
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
      setDirty(formatJson(parsed) !== savedJsonText);
    } catch (error) {
      setJsonError((error as Error).message);
      setDirty(true);
    }
  }

  function formatJsonText() {
    if (!draft) return;
    const formatted = formatJson(draft);
    setJsonText(formatted);
    setJsonError("");
    setDirty(formatted !== savedJsonText);
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
    const response = await fetch(godotPreviewUrl(bridgeEndpoint, "preview"), {
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

  async function configureGodotBridge() {
    try {
      const response = await fetch(godotPreviewUrl(bridgeEndpoint, "config"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ godot_path: godotPath.trim() })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "bridge config unavailable");
      }
      const godot = body.godot ? String(body.godot).split(/[\\/]/).pop() : "Godot";
      setBridgeStatus(`설정됨 · ${godot}`);
      notify("Godot preview bridge 설정 저장됨");
    } catch (error) {
      setBridgeStatus(`오류 · ${(error as Error).message}`);
      notify("Godot preview bridge 설정 실패");
    }
  }

  async function checkGodotBridge() {
    try {
      const response = await fetch(godotPreviewUrl(bridgeEndpoint, "health"));
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
                replaceDraft={applyDraft}
                savedJsonText={savedJsonText}
                notify={notify}
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
                configureGodotBridge={configureGodotBridge}
                bridgeStatus={bridgeStatus}
                bridgeEndpoint={bridgeEndpoint}
                godotPath={godotPath}
                setBridgeEndpoint={setBridgeEndpoint}
                setGodotPath={setGodotPath}
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
  uploadFile,
  replaceDraft,
  savedJsonText,
  notify
}: {
  draft: ResourceRecord | null;
  type: ResourceType;
  references: ReferenceResources;
  updateField: (field: string, value: unknown) => void;
  updateMetadataField: (field: string, value: unknown) => void;
  toggleArrayField: (field: string, id: string) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
  replaceDraft: (nextDraft: ResourceRecord) => void;
  savedJsonText: string;
  notify: (message: string) => void;
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
        <ChapterArtEditor
          draft={draft}
          notify={notify}
          replaceDraft={replaceDraft}
          savedJsonText={savedJsonText}
          updateField={updateField}
          uploadFile={uploadFile}
        />
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
        const profileFaceCenter = getProfileFaceCenter(profile, center);
        const profileOffset = getProfileOffset(profile);
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
              label="Profile face center"
              imagePath={portrait.path}
              x={profileFaceCenter.x}
              y={profileFaceCenter.y}
              onChange={(x, y) => updatePortrait(key, { profile: { ...profile, center: [x, y] } })}
            />
            <ProfileCropEditor
              faceCenter={profileFaceCenter}
              imagePath={portrait.path}
              profile={profile}
              onChangeProfile={(nextProfile) => updatePortrait(key, { profile: nextProfile })}
            />
            <NumberField label="Center X" value={center[0] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => updatePortrait(key, { center: [value, center[1] ?? 0.5] })} />
            <NumberField label="Center Y" value={center[1] ?? 0.5} min={0} max={1} step={0.01} resetValue={0.5} onChange={(value) => updatePortrait(key, { center: [center[0] ?? 0.5, value] })} />
            <NumberField label="Profile zoom" value={getProfileZoom(profile.zoom)} min={profileZoomMin} max={profileZoomMax} step={profileZoomStep} resetValue={profileZoomDefault} onChange={(value) => updatePortrait(key, { profile: withProfileZoom(profile, value) })} />
            <NumberField label="Profile center X" value={profileFaceCenter.x} min={0} max={1} step={0.01} resetValue={center[0] ?? 0.5} onChange={(value) => updatePortrait(key, { profile: { ...profile, center: [value, profileFaceCenter.y] } })} />
            <NumberField label="Profile center Y" value={profileFaceCenter.y} min={0} max={1} step={0.01} resetValue={center[1] ?? 0.5} onChange={(value) => updatePortrait(key, { profile: { ...profile, center: [profileFaceCenter.x, value] } })} />
            <NumberField label="Profile offset X" value={profileOffset.x} min={-1} max={1} step={0.01} resetValue={0} onChange={(value) => updatePortrait(key, { profile: withProfileOffset(profile, { x: value, y: profileOffset.y }) })} />
            <NumberField label="Profile offset Y" value={profileOffset.y} min={-1} max={1} step={0.01} resetValue={0} onChange={(value) => updatePortrait(key, { profile: withProfileOffset(profile, { x: profileOffset.x, y: value }) })} />
            <button className="danger-action" type="button" onClick={() => removePortrait(key)}><Icon name="Delete" />삭제</button>
          </article>
        );
      })}
    </div>
  );
}

function ChapterArtEditor({
  draft,
  notify,
  replaceDraft,
  savedJsonText,
  updateField,
  uploadFile
}: {
  draft: ResourceRecord;
  notify: (message: string) => void;
  replaceDraft: (nextDraft: ResourceRecord) => void;
  savedJsonText: string;
  updateField: (field: string, value: unknown) => void;
  uploadFile: (relativePath: string, file: File) => Promise<string>;
}) {
  const parallax = draft.parallax && typeof draft.parallax === "object" ? draft.parallax as ResourceRecord : { enabled: false, strength: 42, layers: [] };
  const layers = asArray<ResourceRecord>(parallax.layers);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const [snapshot, setSnapshot] = useState<ChapterArtSnapshot | null>(() => createChapterArtSnapshot(draft));
  const [thumbnailBusy, setThumbnailBusy] = useState(false);
  const [artStatus, setArtStatus] = useState("");
  const safeSelectedLayerIndex = Math.min(Math.max(selectedLayerIndex, 0), Math.max(layers.length - 1, 0));
  const hasSnapshotChanges = snapshot
    ? JSON.stringify(getChapterArtSnapshotPayload(draft)) !== snapshot.serialized
    : false;

  useEffect(() => {
    setSnapshot(createChapterArtSnapshot(draft));
    setArtStatus("");
  }, [draft.id, savedJsonText]);

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

  function restoreSnapshot() {
    if (!snapshot) return;
    replaceDraft(applyChapterArtSnapshot(draft, snapshot.payload));
    setArtStatus("챕터 아트 설정을 스냅샷으로 복원했습니다.");
  }

  async function generateThumbnail() {
    setThumbnailBusy(true);
    setArtStatus("");
    try {
      const result = await uploadChapterThumbnailForDraft(draft);
      if (result.skipped) {
        setArtStatus("썸네일로 저장할 패럴랙스 레이어가 없습니다.");
        return;
      }
      replaceDraft(result.draft);
      setArtStatus(`썸네일 생성: ${result.resPath}`);
      notify(`썸네일 생성 완료: ${result.resPath}`);
    } catch (error) {
      const message = `썸네일 생성 실패: ${(error as Error).message}`;
      setArtStatus(message);
      notify(message);
    } finally {
      setThumbnailBusy(false);
    }
  }

  return (
    <div className="wide structured-editor">
      <div className="structured-header">
        <span>Chapter Art / Parallax</span>
        <div className="chapter-art-actions">
          <button disabled={thumbnailBusy} type="button" onClick={() => void generateThumbnail()}><Icon name="AddPhotoAlternate" />썸네일</button>
          <button disabled={!hasSnapshotChanges} type="button" onClick={restoreSnapshot}><Icon name="Restore" />복원</button>
          <button type="button" onClick={addLayer}><Icon name="Add" />레이어</button>
        </div>
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
      {artStatus && <p className="art-status">{artStatus}</p>}
      <ParallaxVisualEditor
        layers={layers}
        selectedLayerIndex={safeSelectedLayerIndex}
        onSelectLayer={setSelectedLayerIndex}
        onChangeLayer={(index, patch) => updateLayer(index, patch)}
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
              <NumberField label="X" value={position[0] ?? 0.5} min={-0.5} max={1.5} step={0.01} resetValue={0.5} onChange={(value) => updateLayer(index, { position: [value, position[1] ?? 0.5] })} />
              <NumberField label="Y" value={position[1] ?? 0.5} min={-0.5} max={1.5} step={0.01} resetValue={0.5} onChange={(value) => updateLayer(index, { position: [position[0] ?? 0.5, value] })} />
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
              <ToggleField label="Thumbnail excluded" checked={Boolean(layer.thumbnail_excluded)} onChange={(checked) => updateLayer(index, { thumbnail_excluded: checked })} />
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

function ProfileCropEditor({
  faceCenter,
  imagePath,
  profile,
  onChangeProfile
}: {
  faceCenter: PointerPoint;
  imagePath: unknown;
  profile: ResourceRecord;
  onChangeProfile: (nextProfile: ResourceRecord) => void;
}) {
  return (
    <div className="profile-crop-editor">
      <div className="coordinate-editor-header">
        <span>Profile crop</span>
        <code>{profileCropSummary(profile)}</code>
      </div>
      <ProfileCropFrame
        faceCenter={faceCenter}
        imagePath={imagePath}
        profile={profile}
        onChangeProfile={onChangeProfile}
      />
      <div className="profile-crop-actions">
        <button type="button" onClick={() => onChangeProfile(withProfileZoom(profile, getProfileZoom(profile.zoom) - profileZoomStep))}><Icon name="ZoomOut" />축소</button>
        <button type="button" onClick={() => onChangeProfile(withProfileOffset(withProfileZoom(profile, profileZoomDefault), { x: 0, y: 0 }))}><Icon name="Restore" />리셋</button>
        <button type="button" onClick={() => onChangeProfile(withProfileZoom(profile, getProfileZoom(profile.zoom) + profileZoomStep))}><Icon name="ZoomIn" />확대</button>
      </div>
    </div>
  );
}

function ProfileCropFrame({
  compact,
  faceCenter,
  imagePath,
  profile,
  onChangeProfile
}: {
  compact?: boolean;
  faceCenter: PointerPoint;
  imagePath: unknown;
  profile: ResourceRecord;
  onChangeProfile?: (nextProfile: ResourceRecord) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
  const imageUrl = resPathToAssetUrl(imagePath);
  const offset = getProfileOffset(profile);
  const zoom = getProfileZoom(profile.zoom);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    function redraw() {
      if (!canvas) return;
      drawProfileCropCanvas(canvas, imageRef.current, faceCenter, { zoom, offset });
    }

    imageRef.current = null;
    redraw();

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(redraw);
      resizeObserver.observe(canvas);
    }

    if (imageUrl) {
      loadImageElement(imageUrl)
        .then((image) => {
          if (cancelled) return;
          imageRef.current = image;
          redraw();
        })
        .catch(() => {
          if (cancelled) return;
          imageRef.current = null;
          redraw();
        });
    }

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, [faceCenter.x, faceCenter.y, imageUrl, offset.x, offset.y, zoom]);

  function canvasPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (profileCropCanvasSize / rect.width),
      y: (event.clientY - rect.top) * (profileCropCanvasSize / rect.height)
    };
  }

  function updateOffset(nextOffset: PointerPoint) {
    if (!onChangeProfile) return;
    const nextProfile = withProfileOffset(profile, nextOffset);
    const canvas = canvasRef.current;
    if (canvas) {
      drawProfileCropCanvas(canvas, imageRef.current, faceCenter, {
        zoom: getProfileZoom(nextProfile.zoom),
        offset: getProfileOffset(nextProfile)
      });
    }
    onChangeProfile(nextProfile);
  }

  function stopDrag() {
    dragRef.current = null;
  }

  return (
    <div className={`profile-crop-frame ${compact ? "compact" : ""}`}>
      <canvas
        aria-label="Profile crop preview"
        className={onChangeProfile ? "editable" : ""}
        height={profileCropCanvasSize}
        onPointerCancel={stopDrag}
        onPointerDown={(event) => {
          if (!onChangeProfile || !imageRef.current) return;
          const point = canvasPoint(event);
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = {
            pointerId: event.pointerId,
            startX: point.x,
            startY: point.y,
            offsetX: offset.x,
            offsetY: offset.y
          };
          event.preventDefault();
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (!drag || drag.pointerId !== event.pointerId) return;
          const point = canvasPoint(event);
          updateOffset({
            x: round4Number(drag.offsetX + (point.x - drag.startX) / profileCropCanvasSize),
            y: round4Number(drag.offsetY + (point.y - drag.startY) / profileCropCanvasSize)
          });
          event.preventDefault();
        }}
        onPointerUp={(event) => {
          if (dragRef.current?.pointerId === event.pointerId) {
            try {
              event.currentTarget.releasePointerCapture(event.pointerId);
            } catch {
              // Pointer capture can already be released by the browser.
            }
          }
          stopDrag();
        }}
        ref={canvasRef}
        width={profileCropCanvasSize}
      />
    </div>
  );
}

function ParallaxVisualEditor({
  layers,
  selectedLayerIndex,
  onSelectLayer,
  onChangeLayer
}: {
  layers: ResourceRecord[];
  selectedLayerIndex: number;
  onSelectLayer: (index: number) => void;
  onChangeLayer: (index: number, patch: ResourceRecord) => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<ParallaxVisualDrag | null>(null);
  const backgroundLayer = layers.find((layer) => String(layer.kind || "") === "background" && resPathToAssetUrl(layer.path)) || layers.find((layer) => resPathToAssetUrl(layer.path));
  const backgroundUrl = resPathToAssetUrl(backgroundLayer?.path);

  function startPositionDrag(event: ReactPointerEvent<HTMLElement>, index: number) {
    const layer = layers[index];
    const position = asArray<number>(layer?.position);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode: "position",
      index,
      startX: event.clientX,
      startY: event.clientY,
      originalX: clampNumber(position[0], -0.5, 1.5, 0.5),
      originalY: clampNumber(position[1], -0.5, 1.5, 0.5)
    };
    onSelectLayer(index);
    event.preventDefault();
    event.stopPropagation();
  }

  function startAnchorDrag(event: ReactPointerEvent<HTMLElement>, index: number) {
    const previewRect = event.currentTarget.closest(".parallax-layer-preview")?.getBoundingClientRect();
    if (!previewRect) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { mode: "anchor", index, previewRect };
    onSelectLayer(index);
    updateAnchorFromPointer(event, index, previewRect);
    event.preventDefault();
    event.stopPropagation();
  }

  function updateAnchorFromPointer(event: ReactPointerEvent<HTMLElement>, index: number, previewRect: DOMRect) {
    if (previewRect.width === 0 || previewRect.height === 0) return;
    onChangeLayer(index, {
      anchor: [
        roundCoordinate((event.clientX - previewRect.left) / previewRect.width),
        roundCoordinate((event.clientY - previewRect.top) / previewRect.height)
      ]
    });
  }

  function startScaleDrag(event: ReactPointerEvent<HTMLElement>, index: number) {
    const stageRect = stageRef.current?.getBoundingClientRect();
    if (!stageRect) return;
    const layer = layers[index];
    const position = asArray<number>(layer?.position);
    const pivot = {
      x: stageRect.left + stageRect.width * clampNumber(position[0], -0.5, 1.5, 0.5),
      y: stageRect.top + stageRect.height * clampNumber(position[1], -0.5, 1.5, 0.5)
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode: "scale",
      index,
      pivot,
      startDistance: Math.max(1, pointerDistance(pivot, event)),
      originalScale: normalizeNumber(layer?.scale, 1, 0.05, 4)
    };
    onSelectLayer(index);
    event.preventDefault();
    event.stopPropagation();
  }

  function startRotationDrag(event: ReactPointerEvent<HTMLElement>, index: number) {
    const stageRect = stageRef.current?.getBoundingClientRect();
    if (!stageRect) return;
    const layer = layers[index];
    const position = asArray<number>(layer?.position);
    const pivot = {
      x: stageRect.left + stageRect.width * clampNumber(position[0], -0.5, 1.5, 0.5),
      y: stageRect.top + stageRect.height * clampNumber(position[1], -0.5, 1.5, 0.5)
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode: "rotation",
      index,
      pivot,
      startAngle: pointerAngle(pivot, event),
      originalRotation: normalizeRotationDegrees(layer?.rotation)
    };
    onSelectLayer(index);
    event.preventDefault();
    event.stopPropagation();
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.mode === "position") {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;
      onChangeLayer(drag.index, {
        position: [
          roundParallaxCoordinate(drag.originalX + (event.clientX - drag.startX) / rect.width),
          roundParallaxCoordinate(drag.originalY + (event.clientY - drag.startY) / rect.height)
        ]
      });
    } else if (drag.mode === "anchor") {
      updateAnchorFromPointer(event, drag.index, drag.previewRect);
    } else if (drag.mode === "scale") {
      const nextDistance = Math.max(1, pointerDistance(drag.pivot, event));
      const nextScale = roundForInput(clampNumber(drag.originalScale * (nextDistance / drag.startDistance), 0.05, 4));
      onChangeLayer(drag.index, { scale: nextScale });
    } else if (drag.mode === "rotation") {
      const nextAngle = pointerAngle(drag.pivot, event);
      const nextRotation = normalizeRotationDegrees(drag.originalRotation + nextAngle - drag.startAngle);
      onChangeLayer(drag.index, { rotation: event.shiftKey ? Math.round(nextRotation / 15) * 15 : roundForInput(nextRotation) });
    }
    event.preventDefault();
  }

  function stopDrag() {
    dragRef.current = null;
  }

  return (
    <section className="parallax-visual-editor">
      <div className="coordinate-editor-header">
        <span>Layer position</span>
        <code>{layers.length} layers</code>
      </div>
      <div
        className={`parallax-stage ${backgroundUrl ? "has-image" : ""}`}
        onPointerCancel={stopDrag}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDrag}
        ref={stageRef}
        style={backgroundUrl ? { backgroundImage: `url("${backgroundUrl}")` } : undefined}
      >
        {layers.map((layer, index) => {
          const position = asArray<number>(layer.position);
          const x = clampNumber(position[0], -0.5, 1.5, 0.5);
          const y = clampNumber(position[1], -0.5, 1.5, 0.5);
          const visible = layer.visible !== false;
          const imageUrl = resPathToAssetUrl(layer.path);
          const anchor = asArray<number>(layer.anchor);
          const anchorX = clamp01Number(anchor[0], 0.5);
          const anchorY = clamp01Number(anchor[1], 0.5);
          const scale = normalizeNumber(layer.scale, 1, 0.05, 4);
          const rotation = normalizeRotationDegrees(layer.rotation);
          const isSelected = index === selectedLayerIndex;
          const kind = String(layer.kind || "sprite");
          const previewStyle = {
            "--layer-x": `${x * 100}%`,
            "--layer-y": `${y * 100}%`,
            "--layer-anchor-x": `${anchorX * 100}%`,
            "--layer-anchor-y": `${anchorY * 100}%`,
            "--layer-translate-x": `${anchorX * -100}%`,
            "--layer-translate-y": `${anchorY * -100}%`,
            "--layer-width": `${layerPreviewWidthPercent(layer)}%`,
            "--layer-rotation": `${kind === "background" ? 0 : rotation}deg`,
            "--layer-opacity": String(clampNumber(layer.opacity, 0, 1, 1)),
            zIndex: normalizeNumber(layer.order, index, -100, 1000)
          } as CSSProperties;
          return (
            imageUrl ? (
              <div
                className={`parallax-layer-preview ${isSelected ? "selected" : ""} ${visible ? "" : "hidden-layer"}`}
                key={`${layer.id || "layer"}-${index}`}
                onPointerDown={(event) => startPositionDrag(event, index)}
                style={previewStyle}
              >
                <img alt="" src={imageUrl} />
                <button
                  aria-label={`Layer ${index + 1} position`}
                  className="parallax-marker layer-index"
                  onPointerDown={(event) => startPositionDrag(event, index)}
                  type="button"
                >
                  <span>{index + 1}</span>
                </button>
                {isSelected && (
                  <>
                    <button
                      aria-label={`Layer ${index + 1} anchor`}
                      className="parallax-anchor-handle"
                      onPointerDown={(event) => startAnchorDrag(event, index)}
                      style={{ left: `${anchorX * 100}%`, top: `${anchorY * 100}%` }}
                      type="button"
                    />
                    <button
                      aria-label={`Layer ${index + 1} scale`}
                      className="parallax-scale-handle"
                      onPointerDown={(event) => startScaleDrag(event, index)}
                      type="button"
                    />
                    {kind !== "background" && (
                      <button
                        aria-label={`Layer ${index + 1} rotation`}
                        className="parallax-rotation-handle"
                        onPointerDown={(event) => startRotationDrag(event, index)}
                        type="button"
                      />
                    )}
                  </>
                )}
              </div>
            ) : (
              <button
                aria-label={`Layer ${index + 1} position`}
                className={`parallax-marker ${isSelected ? "selected" : ""} ${visible ? "" : "hidden-layer"}`}
                key={`${layer.id || "layer"}-${index}`}
                onPointerDown={(event) => startPositionDrag(event, index)}
                style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                type="button"
              >
                <span>{index + 1}</span>
              </button>
            )
          );
        })}
      </div>
      {layers.length > 0 && (
        <div className="parallax-selected-summary">
          <strong>{String(layers[selectedLayerIndex]?.name || layers[selectedLayerIndex]?.id || `Layer ${selectedLayerIndex + 1}`)}</strong>
          <span>{String(layers[selectedLayerIndex]?.kind || "sprite")}</span>
          <code>{parallaxLayerTransformSummary(layers[selectedLayerIndex])}</code>
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
  configureGodotBridge,
  bridgeStatus,
  bridgeEndpoint,
  godotPath,
  setBridgeEndpoint,
  setGodotPath
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
  configureGodotBridge: () => Promise<void>;
  bridgeStatus: string;
  bridgeEndpoint: string;
  godotPath: string;
  setBridgeEndpoint: (value: string) => void;
  setGodotPath: (value: string) => void;
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
        <div className={`bridge-status ${bridgeStatus.startsWith("오류") ? "error" : bridgeStatus.startsWith("연결됨") || bridgeStatus.startsWith("설정됨") ? "ok" : ""}`}>
          {bridgeStatus}
        </div>
        <details className="bridge-settings">
          <summary>Godot preview 설정</summary>
          <TextField label="Bridge endpoint" value={bridgeEndpoint} onChange={setBridgeEndpoint} />
          <TextField label="Godot executable path" value={godotPath} onChange={setGodotPath} />
          <div className="inline-actions">
            <button type="button" onClick={() => void configureGodotBridge()}><Icon name="Settings" />설정</button>
            <button type="button" onClick={() => void checkGodotBridge()}><Icon name="CheckCircle" />확인</button>
          </div>
          <code>{godotBridgeCommandHint(godotPath)}</code>
        </details>
        {nodes.map((node, index) => (
          <button
            className={`node-row ${index === selectedNodeIndex ? "active" : ""}`}
            key={index}
            type="button"
            onClick={() => setSelectedNodeIndex(index)}
          >
            <strong>{index + 1}. {node.mode === "cutscene" ? "컷씬" : speakerLabel(node.speaker, references.characters)}</strong>
            <span>{node.mode === "cutscene" ? cutsceneSummary(node) : getDialogueVisiblePreviewText(node.text).slice(0, 72) || "빈 대사"}</span>
          </button>
        ))}
        <div className="statement-summary">
          <b>Statement nodes</b>
          <span>{statementNodes.length}개</span>
        </div>
        <StatementNodesEditor
          references={references}
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
                <RichTextPreview text={selectedNode.text || ""} />
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
                <AcquireInfoEditor
                  references={references}
                  value={selectedNode.acquire_info}
                  onChange={(acquireInfo) => updateDialogueNode(selectedNodeIndex, { ...selectedNode, acquire_info: acquireInfo })}
                />
                <NodePopupsEditor
                  popups={selectedNode.popups}
                  references={references}
                  onChange={(popups) => updateDialogueNode(selectedNodeIndex, { ...selectedNode, popups })}
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

function RichTextPreview({ text, compact = false }: { text: string; compact?: boolean }) {
  const nodes = useMemo(() => parseRichTextPreviewAst(text), [text]);
  const tags = detectTextTags(text);
  return (
    <section className={`rich-text-preview ${compact ? "compact" : ""}`}>
      <div className="rich-text-preview-header">
        <span>Preview</span>
        <code>{tags.length > 0 ? tags.map(tagPreviewLabel).join(" · ") : "plain"}</code>
      </div>
      <div className="rich-text-preview-body">
        {nodes.length > 0 ? renderRichTextNodes(nodes, "rich") : <span className="rich-text-empty">보이는 텍스트 없음</span>}
      </div>
    </section>
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
  const faceCenter = getProfileFaceCenter(entry.portrait?.profile, entry.portrait?.center || []);
  return (
    <div className={`cast-portrait-preview ${entry.mystery ? "mystery" : ""}`}>
      {imageUrl ? (
        <ProfileCropFrame
          compact
          faceCenter={faceCenter}
          imagePath={entry.portrait?.path}
          profile={entry.portrait?.profile || {}}
        />
      ) : <span>{entry.characterId === "mystery" ? "???" : "NO"}</span>}
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

function parseSizePoint(value: unknown, fallback: { x: number; y: number }) {
  if (Array.isArray(value)) {
    return { x: normalizeNumber(value[0], fallback.x, 1), y: normalizeNumber(value[1], fallback.y, 1) };
  }
  if (value && typeof value === "object") {
    const record = value as ResourceRecord;
    return {
      x: normalizeNumber(record.x ?? record.width ?? record[0], fallback.x, 1),
      y: normalizeNumber(record.y ?? record.height ?? record[1], fallback.y, 1)
    };
  }
  return fallback;
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

function defaultStatementReactionRecord(kind = "default"): ResourceRecord {
  return {
    kind,
    target_id: "",
    label: kind === "default" ? "잘못된 연결" : "",
    next: "",
    statement_end: false,
    nodes: []
  };
}

function defaultNestedNode(mode: "dialogue" | "cutscene"): ResourceRecord {
  return mode === "cutscene"
    ? { mode: "cutscene", cutscene: { fade_in: 0, hold: 1, fade_out: 1 } }
    : { speaker: "narrator", text: "" };
}

function syncStatementLiesForText(text: string, currentLies: ResourceRecord[]) {
  const phrases = extractStatementLiePhrases(text);
  if (phrases.length === 0) return currentLies;
  const used = new Set<number>();
  return phrases.map((phrase, index) => {
    const existingIndex = currentLies.findIndex((lie, lieIndex) => !used.has(lieIndex) && String(lie.phrase || "") === phrase);
    const fallbackIndex = existingIndex >= 0 ? existingIndex : index;
    const existing = currentLies[fallbackIndex] || {};
    used.add(fallbackIndex);
    const reactions = asArray<ResourceRecord>(existing.reactions);
    return {
      ...existing,
      id: existing.id || `lie_${index}`,
      phrase,
      reactions: reactions.length > 0 ? reactions : [defaultStatementReactionRecord()]
    };
  });
}

function extractStatementLiePhrases(text: string) {
  const phrases: string[] = [];
  const pattern = /\[lie[^\]]*\]([\s\S]*?)\[\/lie\]/gi;
  let match: RegExpExecArray | null = null;
  while ((match = pattern.exec(text)) !== null) {
    const phrase = stripInlineTags(match[1]).trim();
    if (phrase) phrases.push(phrase);
  }
  if (phrases.length > 0) return phrases;

  const bracketPattern = /\[([^\[\]]+)\]/g;
  while ((match = bracketPattern.exec(text)) !== null) {
    const body = String(match[1] || "").trim();
    if (!body || body.startsWith("/") || /[\s=]/.test(body)) continue;
    if (["lie", "color", "shake", "wave", "speed", "font_scale", "alpha", "bgm", "sfx", "se", "bg", "auto_next"].includes(body.toLowerCase())) continue;
    const phrase = stripInlineTags(body).trim();
    if (phrase) phrases.push(phrase);
  }
  return phrases;
}

function stripInlineTags(text: string) {
  return text
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\|+/g, "")
    .replace(/\s+/g, " ");
}

function StatementNodesEditor({
  references,
  statementNodes,
  updateStatementNode,
  removeStatementNode
}: {
  references: ReferenceResources;
  statementNodes: ResourceRecord[];
  updateStatementNode: (index: number, node: ResourceRecord) => void;
  removeStatementNode: (index: number) => void;
}) {
  if (statementNodes.length === 0) return null;

  return (
    <div className="statement-editor-list">
      {statementNodes.map((node, index) => {
        const lies = asArray<ResourceRecord>(node.statement_lies);
        const updateNode = (nextNode: ResourceRecord) => updateStatementNode(index, nextNode);
        const updateText = (text: string) => updateNode({ ...node, text, statement_lies: syncStatementLiesForText(text, lies) });
        const updateLie = (lieIndex: number, nextLie: ResourceRecord) => updateNode({
          ...node,
          statement_lies: lies.map((lie, entryIndex) => entryIndex === lieIndex ? nextLie : lie)
        });
        const addReaction = (lieIndex: number) => {
          const nextLies = lies.map((lie, entryIndex) => entryIndex === lieIndex
            ? { ...lie, reactions: [...asArray<ResourceRecord>(lie.reactions), defaultStatementReactionRecord("character")] }
            : lie);
          updateNode({ ...node, statement_lies: nextLies });
        };
        const removeReaction = (lieIndex: number, reactionIndex: number) => {
          const nextLies = lies.map((lie, entryIndex) => {
            if (entryIndex !== lieIndex) return lie;
            const nextReactions = asArray<ResourceRecord>(lie.reactions).filter((_, indexToRemove) => indexToRemove !== reactionIndex);
            return { ...lie, reactions: nextReactions.length > 0 ? nextReactions : [defaultStatementReactionRecord()] };
          });
          updateNode({ ...node, statement_lies: nextLies });
        };
        return (
          <article className="statement-editor" key={index}>
            <div className="structured-header">
              <span>Statement {index + 1}</span>
              <button className="danger-action" type="button" onClick={() => removeStatementNode(index)}>
                <Icon name="Delete" />삭제
              </button>
            </div>
            <div className="form-grid compact">
              <TextField label="ID" value={node.id || ""} onChange={(value) => updateNode({ ...node, id: value })} />
              <SelectField
                label="Speaker"
                value={node.speaker || "narrator"}
                options={[{ id: "narrator", title: "narrator", subtitle: "built-in", type: "characters" } as ResourceSummary, ...references.characters]}
                onChange={(value) => updateNode({ ...node, speaker: value })}
              />
              <ToggleField label="Statement end" checked={Boolean(node.statement_end)} onChange={(checked) => updateNode({ ...node, statement_end: checked })} />
            </div>
            <TextField label="Text" value={node.text || ""} multiline onChange={updateText} />
            <RichTextPreview compact text={node.text || ""} />
            <StageCastEditor
              characters={references.characters}
              nodes={statementNodes}
              selectedNodeIndex={index}
              speakerId={String(node.speaker || "")}
              speakerMystery={Boolean(node.speaker_mystery)}
              stageCast={node.stage_cast}
              onChange={(stageCast) => updateNode({ ...node, stage_cast: stageCast })}
            />
            <AcquireInfoEditor
              references={references}
              value={node.acquire_info}
              onChange={(acquireInfo) => updateNode({ ...node, acquire_info: acquireInfo })}
            />
            <NodePopupsEditor
              popups={node.popups}
              references={references}
              onChange={(popups) => updateNode({ ...node, popups })}
            />
            <div className="reaction-list">
              {lies.length === 0 && <span className="muted">[lie] 문구 없음</span>}
              {lies.map((lie, lieIndex) => (
                <details className="statement-lie-card" key={`${lie.id || "lie"}-${lieIndex}`} open>
                  <summary>
                    <b>[lie] {lie.phrase || `#${lieIndex + 1}`}</b>
                    <span>{asArray(lie.reactions).length} reactions</span>
                    <button type="button" onClick={(event) => {
                      event.preventDefault();
                      addReaction(lieIndex);
                    }}>
                      <Icon name="Add" />반응
                    </button>
                  </summary>
                  <div className="statement-reaction-stack">
                    <TextField label="Lie ID" value={lie.id || `lie_${lieIndex}`} onChange={(value) => updateLie(lieIndex, { ...lie, id: value })} />
                    <TextField label="Phrase" value={lie.phrase || ""} onChange={(value) => updateLie(lieIndex, { ...lie, phrase: value })} />
                    {asArray<ResourceRecord>(lie.reactions).map((reaction, reactionIndex) => (
                      <StatementReactionEditor
                        key={`${reaction.kind || "reaction"}-${reactionIndex}`}
                        lie={lie}
                        lieIndex={lieIndex}
                        reaction={reaction}
                        reactionIndex={reactionIndex}
                        references={references}
                        removeReaction={() => removeReaction(lieIndex, reactionIndex)}
                        updateReaction={(nextReaction) => {
                          const reactions = asArray<ResourceRecord>(lie.reactions);
                          updateLie(lieIndex, {
                            ...lie,
                            reactions: reactions.map((entry, entryIndex) => entryIndex === reactionIndex ? nextReaction : entry)
                          });
                        }}
                      />
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function StatementReactionEditor({
  lie,
  lieIndex,
  reaction,
  reactionIndex,
  references,
  updateReaction,
  removeReaction
}: {
  lie: ResourceRecord;
  lieIndex: number;
  reaction: ResourceRecord;
  reactionIndex: number;
  references: ReferenceResources;
  updateReaction: (reaction: ResourceRecord) => void;
  removeReaction: () => void;
}) {
  const kind = String(reaction.kind || "default");
  const childNodes = asArray<ResourceRecord>(reaction.nodes);
  const targetOptions = kind === "item" ? references.items : references.characters;

  function updateChildNode(childIndex: number, nextNode: ResourceRecord) {
    updateReaction({
      ...reaction,
      nodes: childNodes.map((node, index) => index === childIndex ? nextNode : node)
    });
  }

  function removeChildNode(childIndex: number) {
    updateReaction({ ...reaction, nodes: childNodes.filter((_, index) => index !== childIndex) });
  }

  function addChildNode(mode: "dialogue" | "cutscene") {
    updateReaction({ ...reaction, nodes: [...childNodes, defaultNestedNode(mode)] });
  }

  function updateKind(nextKind: string) {
    updateReaction({
      ...reaction,
      kind: nextKind,
      target_id: nextKind === "default" ? "" : reaction.target_id || "",
      label: nextKind === "default" ? reaction.label || "잘못된 연결" : reaction.label || ""
    });
  }

  return (
    <article className="statement-reaction-editor">
      <div className="structured-header">
        <span>Reaction {lieIndex + 1}-{reactionIndex + 1}</span>
        <button className="danger-action" type="button" onClick={removeReaction}><Icon name="Delete" />삭제</button>
      </div>
      <div className="form-grid compact">
        <SelectLiteralField label="Kind" value={kind} options={["default", "character", "item"]} onChange={updateKind} />
        {kind === "default" ? (
          <label className="field-block">
            <span>Target</span>
            <input disabled readOnly type="text" value="대상 없음" />
          </label>
        ) : (
          <SelectField label={kind === "item" ? "Item" : "Character"} value={reaction.target_id || ""} options={targetOptions} onChange={(value) => updateReaction({ ...reaction, target_id: value })} />
        )}
        <TextField label="Label" value={reaction.label || ""} onChange={(value) => updateReaction({ ...reaction, label: value })} />
        <TextField label="Next" value={reaction.next || ""} onChange={(value) => updateReaction({ ...reaction, next: value })} />
        <ToggleField label="Statement end" checked={Boolean(reaction.statement_end)} onChange={(checked) => updateReaction({ ...reaction, statement_end: checked })} />
      </div>
      <div className="structured-header">
        <span>Reaction nodes</span>
        <div className="inline-actions">
          <button type="button" onClick={() => addChildNode("dialogue")}><Icon name="Add" />대사</button>
          <button type="button" onClick={() => addChildNode("cutscene")}><Icon name="Add" />컷씬</button>
        </div>
      </div>
      {childNodes.length === 0 && <p className="empty-state">반응 대사 없음</p>}
      <div className="statement-child-node-list">
        {childNodes.map((childNode, childIndex) => (
          <NestedDialogueNodeEditor
            key={childIndex}
            index={childIndex}
            node={childNode}
            nodes={childNodes}
            references={references}
            removeNode={() => removeChildNode(childIndex)}
            updateNode={(nextNode) => updateChildNode(childIndex, nextNode)}
          />
        ))}
      </div>
      {childNodes.length > 0 && !reaction.statement_end && <p className="statement-reaction-return">진술로 복귀</p>}
      <span className="muted">Phrase: {lie.phrase || "미지정"}</span>
    </article>
  );
}

function NestedDialogueNodeEditor({
  index,
  node,
  nodes,
  references,
  updateNode,
  removeNode
}: {
  index: number;
  node: ResourceRecord;
  nodes: ResourceRecord[];
  references: ReferenceResources;
  updateNode: (node: ResourceRecord) => void;
  removeNode: () => void;
}) {
  const mode = String(node.mode || "dialogue");
  return (
    <details className="statement-child-node" open={index === 0}>
      <summary>
        <strong>{index + 1}. {mode === "cutscene" ? "컷씬" : speakerLabel(node.speaker, references.characters)}</strong>
        <span>{mode === "cutscene" ? cutsceneSummary(node) : getDialogueVisiblePreviewText(node.text).slice(0, 52) || "빈 대사"}</span>
      </summary>
      <div className="nested-node-grid">
        <div className="structured-header">
          <span>Nested node</span>
          <button className="danger-action" type="button" onClick={removeNode}><Icon name="Delete" />삭제</button>
        </div>
        <div className="form-grid compact">
          <TextField label="ID" value={node.id || ""} onChange={(value) => updateNode({ ...node, id: value })} />
          <SelectLiteralField
            label="Mode"
            value={mode}
            options={["dialogue", "cutscene"]}
            onChange={(value) => updateNode(value === "cutscene"
              ? { ...node, mode: "cutscene", cutscene: node.cutscene || { fade_in: 0, hold: 1, fade_out: 1 } }
              : { ...node, mode: undefined })}
          />
          {mode !== "cutscene" && (
            <SelectField
              label="Speaker"
              value={node.speaker || "narrator"}
              options={[{ id: "narrator", title: "narrator", subtitle: "built-in", type: "characters" } as ResourceSummary, ...references.characters]}
              onChange={(value) => updateNode({ ...node, speaker: value })}
            />
          )}
        </div>
        {mode === "cutscene" ? (
          <div className="form-grid compact">
            <NumberField label="Fade in" value={node.cutscene?.fade_in ?? 0} min={0} step={0.1} resetValue={0} onChange={(value) => updateNode(patchCutscene(node, "fade_in", value))} />
            <NumberField label="Hold" value={node.cutscene?.hold ?? 1} min={0} step={0.1} resetValue={1} onChange={(value) => updateNode(patchCutscene(node, "hold", value))} />
            <NumberField label="Fade out" value={node.cutscene?.fade_out ?? 1} min={0} step={0.1} resetValue={1} onChange={(value) => updateNode(patchCutscene(node, "fade_out", value))} />
            <TextField label="Image" value={node.cutscene?.image || ""} onChange={(value) => updateNode(patchCutscene(node, "image", value))} />
          </div>
        ) : (
          <>
            <div className="form-grid compact">
              <TextField label="Next" value={node.next || ""} onChange={(value) => updateNode({ ...node, next: value })} />
              <ToggleField label="Speaker mystery" checked={Boolean(node.speaker_mystery)} onChange={(checked) => updateNode({ ...node, speaker_mystery: checked })} />
            </div>
            <TextField label="Text" value={node.text || ""} multiline onChange={(value) => updateNode({ ...node, text: value })} />
            <RichTextPreview compact text={node.text || ""} />
            <StageCastEditor
              characters={references.characters}
              nodes={nodes}
              selectedNodeIndex={index}
              speakerId={String(node.speaker || "")}
              speakerMystery={Boolean(node.speaker_mystery)}
              stageCast={node.stage_cast}
              onChange={(stageCast) => updateNode({ ...node, stage_cast: stageCast })}
            />
            <AcquireInfoEditor
              references={references}
              value={node.acquire_info}
              onChange={(acquireInfo) => updateNode({ ...node, acquire_info: acquireInfo })}
            />
            <NodePopupsEditor
              popups={node.popups}
              references={references}
              onChange={(popups) => updateNode({ ...node, popups })}
            />
          </>
        )}
      </div>
    </details>
  );
}

function AcquireInfoEditor({
  value,
  references,
  onChange
}: {
  value: unknown;
  references: ReferenceResources;
  onChange: (value: ResourceRecord) => void;
}) {
  const info = value && typeof value === "object" ? value as ResourceRecord : {};
  const characters = asArray(info.characters).map(String);
  const items = asArray(info.items).map(String);
  const hasValues = characters.length > 0 || items.length > 0;

  function toggle(field: "characters" | "items", id: string) {
    const values = field === "characters" ? characters : items;
    const nextValues = values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
    onChange({ ...info, characters, items, [field]: nextValues });
  }

  return (
    <details className="node-addon-editor" open={hasValues}>
      <summary>
        <strong>Acquire info</strong>
        <span>{characters.length} characters · {items.length} items</span>
      </summary>
      <div className="form-grid">
        <CheckboxList label="Characters" values={characters} options={references.characters} onToggle={(id) => toggle("characters", id)} />
        <CheckboxList label="Items" values={items} options={references.items} onToggle={(id) => toggle("items", id)} />
      </div>
    </details>
  );
}

function NodePopupsEditor({
  popups,
  references,
  onChange
}: {
  popups: unknown;
  references: ReferenceResources;
  onChange: (popups: ResourceRecord[]) => void;
}) {
  const popupList = asArray<ResourceRecord>(popups);

  function updatePopup(index: number, patch: ResourceRecord) {
    onChange(popupList.map((popup, popupIndex) => popupIndex === index ? { ...popup, ...patch } : popup));
  }

  function addPopup() {
    onChange([
      ...popupList,
      {
        source: "character_profile",
        target_id: references.characters[0]?.id || "",
        position: "right",
        offset: [0, 0],
        size: [320, 320],
        scale: 1,
        opacity: 1,
        transition: "fade"
      }
    ]);
  }

  return (
    <details className="node-addon-editor" open={popupList.length > 0}>
      <summary>
        <strong>Popups</strong>
        <span>{popupList.length}개</span>
        <button type="button" onClick={(event) => {
          event.preventDefault();
          addPopup();
        }}>
          <Icon name="Add" />팝업
        </button>
      </summary>
      {popupList.length === 0 && <p className="empty-state">팝업 이미지 없음</p>}
      <div className="popup-editor-list">
        {popupList.map((popup, index) => {
          const source = String(popup.source || "character_profile");
          const offset = parseCastOffset(popup.offset);
          const size = parseSizePoint(popup.size, { x: 320, y: 320 });
          return (
            <article className="popup-editor-card" key={index}>
              <div className="structured-header">
                <span>Popup {index + 1}</span>
                <button className="danger-action" type="button" onClick={() => onChange(popupList.filter((_, popupIndex) => popupIndex !== index))}>
                  <Icon name="Delete" />삭제
                </button>
              </div>
              <div className="form-grid compact">
                <SelectLiteralField label="Source" value={source} options={["character_profile", "item", "image"]} onChange={(value) => updatePopup(index, { source: value, target_id: "", path: "", portrait: "" })} />
                {source === "image" ? (
                  <TextField label="Image path" value={popup.path || popup.image || ""} onChange={(value) => updatePopup(index, { path: value })} />
                ) : (
                  <SelectField label={source === "item" ? "Item" : "Character"} value={popup.target_id || ""} options={source === "item" ? references.items : references.characters} onChange={(value) => updatePopup(index, { target_id: value })} />
                )}
                {source === "character_profile" && <TextField label="Portrait" value={popup.portrait || ""} onChange={(value) => updatePopup(index, { portrait: value })} />}
                <SelectLiteralField label="Position" value={popup.position || "center"} options={["left", "center", "right", "top_left", "top_right", "custom"]} onChange={(value) => updatePopup(index, { position: value })} />
                <NumberField label="Offset X" value={offset.x} step={0.01} resetValue={0} onChange={(value) => updatePopup(index, { offset: [value, offset.y] })} />
                <NumberField label="Offset Y" value={offset.y} step={0.01} resetValue={0} onChange={(value) => updatePopup(index, { offset: [offset.x, value] })} />
                <NumberField label="Width" value={size.x} min={1} step={10} resetValue={320} onChange={(value) => updatePopup(index, { size: [value, size.y] })} />
                <NumberField label="Height" value={size.y} min={1} step={10} resetValue={320} onChange={(value) => updatePopup(index, { size: [size.x, value] })} />
                <NumberField label="Scale" value={popup.scale ?? 1} min={0.25} max={3} step={0.05} resetValue={1} onChange={(value) => updatePopup(index, { scale: value })} />
                <NumberField label="Opacity" value={popup.opacity ?? 1} min={0} max={1} step={0.05} resetValue={1} onChange={(value) => updatePopup(index, { opacity: value })} />
                <SelectLiteralField label="Transition" value={popup.transition || "fade"} options={["fade", "pop", "slide", "none"]} onChange={(value) => updatePopup(index, { transition: value })} />
              </div>
            </article>
          );
        })}
      </div>
    </details>
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

function readGodotPreviewEndpoint() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("godot_preview_endpoint")?.trim();
    if (fromUrl) {
      saveLocalSetting(godotPreviewEndpointStorageKey, fromUrl);
      return normalizeGodotPreviewEndpoint(fromUrl);
    }
    const saved = localStorage.getItem(godotPreviewEndpointStorageKey)?.trim();
    if (saved) return normalizeGodotPreviewEndpoint(saved);
  } catch {
    // Fall through to the local bridge default.
  }
  return godotPreviewDefaultEndpoint;
}

function readGodotPathSetting() {
  try {
    return localStorage.getItem(godotPreviewGodotPathStorageKey)?.trim() || "";
  } catch {
    return "";
  }
}

function saveLocalSetting(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing or blocked storage should not break editing.
  }
}

function normalizeGodotPreviewEndpoint(value: string) {
  const trimmed = String(value || "").trim();
  return (trimmed || godotPreviewDefaultEndpoint).replace(/\/+$/, "");
}

function godotPreviewUrl(endpoint: string, path: string) {
  return `${normalizeGodotPreviewEndpoint(endpoint)}/${String(path || "").replace(/^\/+/, "")}`;
}

function godotBridgeCommandHint(godotPath: string) {
  const path = godotPath.trim();
  return path
    ? `tools\\run_godot_preview_bridge.bat "${path}"`
    : "tools\\run_godot_preview_bridge.bat";
}

function getProfileZoom(value: unknown) {
  return clampNumber(value, profileZoomMin, profileZoomMax, profileZoomDefault);
}

function getProfileOffset(profile: unknown): PointerPoint {
  const raw = profile && typeof profile === "object" ? (profile as ResourceRecord).offset : null;
  if (Array.isArray(raw)) {
    return { x: round4Number(Number(raw[0]) || 0), y: round4Number(Number(raw[1]) || 0) };
  }
  if (raw && typeof raw === "object") {
    const record = raw as ResourceRecord;
    return { x: round4Number(Number(record.x ?? record[0]) || 0), y: round4Number(Number(record.y ?? record[1]) || 0) };
  }
  return { x: 0, y: 0 };
}

function getProfileFaceCenter(profile: unknown, fallbackCenter: unknown): PointerPoint {
  const profileRecord = profile && typeof profile === "object" ? profile as ResourceRecord : {};
  const profileCenter = asArray<number>(profileRecord.center);
  const fallback = asArray<number>(fallbackCenter);
  return {
    x: clamp01Number(profileCenter[0] ?? fallback[0], 0.5),
    y: clamp01Number(profileCenter[1] ?? fallback[1], 0.5)
  };
}

function withProfileZoom(profile: ResourceRecord, zoom: unknown): ResourceRecord {
  return {
    ...profile,
    zoom: getProfileZoom(zoom)
  };
}

function withProfileOffset(profile: ResourceRecord, offset: PointerPoint): ResourceRecord {
  return {
    ...profile,
    offset: [round4Number(offset.x), round4Number(offset.y)]
  };
}

function profileCropSummary(profile: ResourceRecord) {
  const offset = getProfileOffset(profile);
  return `zoom ${getProfileZoom(profile.zoom).toFixed(1)} · offset ${offset.x.toFixed(3)},${offset.y.toFixed(3)}`;
}

function drawProfileCropCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | null,
  faceCenter: PointerPoint,
  profile: { zoom: number; offset: PointerPoint }
) {
  const context = setupSquareCanvas(canvas, profileCropCanvasSize);
  context.clearRect(0, 0, profileCropCanvasSize, profileCropCanvasSize);
  drawProfileCropBackground(context);

  if (image) {
    const sourceWidth = image.naturalWidth || image.width || 1;
    const sourceHeight = image.naturalHeight || image.height || 1;
    const baseScale = Math.max(profileCropCanvasSize / sourceWidth, profileCropCanvasSize / sourceHeight);
    const scale = baseScale * getProfileZoom(profile.zoom);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    const anchor = profileCropAnchor(profile.offset);
    context.drawImage(
      image,
      Math.round(anchor.x - faceCenter.x * width),
      Math.round(anchor.y - faceCenter.y * height),
      Math.max(1, Math.round(width)),
      Math.max(1, Math.round(height))
    );
  }

  drawProfileCropGuides(context, profile.offset);
}

function setupSquareCanvas(canvas: HTMLCanvasElement, logicalSize: number) {
  const cssWidth = Math.max(1, Math.round(canvas.clientWidth || logicalSize));
  const pixelRatio = window.devicePixelRatio || 1;
  const backingSize = Math.max(1, Math.round(cssWidth * pixelRatio));
  if (canvas.width !== backingSize || canvas.height !== backingSize) {
    canvas.width = backingSize;
    canvas.height = backingSize;
  }
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context를 생성할 수 없습니다.");
  const scale = backingSize / logicalSize;
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.imageSmoothingEnabled = false;
  return context;
}

function drawProfileCropBackground(context: CanvasRenderingContext2D) {
  context.fillStyle = "#0d1115";
  context.fillRect(0, 0, profileCropCanvasSize, profileCropCanvasSize);
  context.strokeStyle = "rgba(255, 255, 255, 0.06)";
  context.lineWidth = 1;
  for (let line = 0; line <= profileCropCanvasSize; line += 20) {
    context.beginPath();
    context.moveTo(line + 0.5, 0);
    context.lineTo(line + 0.5, profileCropCanvasSize);
    context.moveTo(0, line + 0.5);
    context.lineTo(profileCropCanvasSize, line + 0.5);
    context.stroke();
  }
}

function drawProfileCropGuides(context: CanvasRenderingContext2D, offset: PointerPoint) {
  const center = profileCropCanvasSize / 2;
  const anchor = profileCropAnchor(offset);
  context.strokeStyle = "rgba(126, 231, 216, 0.36)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(center + 0.5, 0);
  context.lineTo(center + 0.5, profileCropCanvasSize);
  context.moveTo(0, center + 0.5);
  context.lineTo(profileCropCanvasSize, center + 0.5);
  context.stroke();

  context.strokeStyle = "#7ee7d8";
  context.fillStyle = "rgba(126, 231, 216, 0.22)";
  context.beginPath();
  context.arc(anchor.x, anchor.y, 7, 0, Math.PI * 2);
  context.fill();
  context.stroke();
}

function profileCropAnchor(offset: PointerPoint) {
  return {
    x: profileCropCanvasSize * 0.5 + offset.x * profileCropCanvasSize,
    y: profileCropCanvasSize * 0.5 + offset.y * profileCropCanvasSize
  };
}

function chapterThumbnailRelativePath(chapter: ResourceRecord) {
  return `assets/chapters/${safeSegment(chapter.id || "chapter", "chapter")}/thumbnail.png`;
}

async function uploadChapterThumbnailForDraft(chapter: ResourceRecord) {
  const layers = getChapterThumbnailLayers(chapter);
  if (layers.length === 0) {
    return { skipped: true, draft: chapter, resPath: "" };
  }

  const blob = await renderChapterThumbnailBlob(layers);
  const file = new File([blob], "thumbnail.png", { type: "image/png" });
  const result = await uploadProjectFile(chapterThumbnailRelativePath(chapter), file);
  return {
    skipped: false,
    draft: { ...chapter, image: result.resPath },
    resPath: result.resPath
  };
}

function getChapterThumbnailLayers(chapter: ResourceRecord) {
  const parallax = chapter.parallax && typeof chapter.parallax === "object" ? chapter.parallax as ResourceRecord : null;
  return asArray<ResourceRecord>(parallax?.layers)
    .map((layer, index) => ({ layer, index }))
    .sort((a, b) => {
      const depthDelta = getParallaxLayerDepth(a.layer) - getParallaxLayerDepth(b.layer);
      if (Math.abs(depthDelta) > 0.0001) return depthDelta;
      const orderDelta = normalizeNumber(a.layer.order, a.index) - normalizeNumber(b.layer.order, b.index);
      return orderDelta !== 0 ? orderDelta : a.index - b.index;
    })
    .map((entry) => entry.layer);
}

async function renderChapterThumbnailBlob(layers: ResourceRecord[]) {
  const canvas = document.createElement("canvas");
  canvas.width = chapterThumbnailWidth;
  canvas.height = chapterThumbnailHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context를 생성할 수 없습니다.");

  context.clearRect(0, 0, canvas.width, canvas.height);

  for (const layer of layers) {
    if (layer.visible === false || layer.thumbnail_excluded === true || !layer.path) continue;
    const url = resPathToAssetUrl(layer.path);
    if (!url) continue;

    const image = await loadImageElement(url);
    const kind = getParallaxLayerKind(layer);
    const position = asArray<number>(layer.position);
    const anchor = asArray<number>(layer.anchor);
    const defaultLayout = getParallaxLayerDefaultLayout(kind);
    const px = clampNumber(position[0], -0.5, 1.5, defaultLayout.x);
    const py = clampNumber(position[1], -0.5, 1.5, defaultLayout.y);
    const anchorX = clamp01Number(anchor[0], 0.5);
    const anchorY = clamp01Number(anchor[1], 0.5);
    const scaleX = getParallaxLayerScaleX(layer);
    const scaleY = getParallaxLayerScaleY(layer);
    const sourceWidth = image.naturalWidth || image.width || 1;
    const sourceHeight = image.naturalHeight || image.height || 1;
    let width: number;
    let height: number;

    if (kind === "background") {
      const coverScale = Math.max(canvas.width / sourceWidth, canvas.height / sourceHeight);
      width = sourceWidth * coverScale * scaleX;
      height = sourceHeight * coverScale * scaleY;
    } else {
      height = canvas.height * scaleY;
      width = canvas.height * scaleX * (sourceWidth / sourceHeight);
    }

    context.save();
    context.globalAlpha = clampNumber(layer.opacity, 0, 1, 1);
    context.translate(canvas.width * px, canvas.height * py);
    context.rotate((kind === "background" ? 0 : normalizeRotationDegrees(layer.rotation)) * Math.PI / 180);
    context.drawImage(image, -width * anchorX, -height * anchorY, width, height);
    context.restore();
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("썸네일 이미지를 생성할 수 없습니다."));
    }, "image/png");
  });
}

function loadImageElement(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`이미지를 불러올 수 없습니다: ${url}`));
    image.src = url;
  });
}

function getParallaxLayerKind(layer: ResourceRecord) {
  return String(layer.kind || "") === "background" ? "background" : "sprite";
}

function getParallaxLayerDefaultLayout(kind: string) {
  return kind === "background"
    ? { x: 0.5, y: 0.5, scale: 1.08 }
    : { x: 0.64, y: 0.58, scale: 0.72 };
}

function getParallaxLayerScale(layer: ResourceRecord) {
  return clampNumber(layer.scale, 0.05, 3, getParallaxLayerDefaultLayout(getParallaxLayerKind(layer)).scale);
}

function getParallaxLayerScaleX(layer: ResourceRecord) {
  const scale = getParallaxLayerScale(layer);
  return clampNumber(layer.scale_x ?? layer.scaleX ?? layer.width_scale ?? layer.widthScale, 0.05, 3, scale);
}

function getParallaxLayerScaleY(layer: ResourceRecord) {
  const scale = getParallaxLayerScale(layer);
  return clampNumber(layer.scale_y ?? layer.scaleY ?? layer.height_scale ?? layer.heightScale, 0.05, 3, scale);
}

function getParallaxLayerDepth(layer: ResourceRecord) {
  return clampNumber(layer.depth ?? layer.parallax, -2, 2, 0);
}

function cloneJsonValue<T>(value: T): T {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function getChapterArtSnapshotPayload(chapter: ResourceRecord) {
  const payload: ResourceRecord = {
    image: String(chapter?.image || "")
  };
  if (Object.prototype.hasOwnProperty.call(chapter, "hasParallax")) {
    payload.hasParallax = cloneJsonValue(chapter.hasParallax);
  }
  if (Object.prototype.hasOwnProperty.call(chapter, "parallax")) {
    payload.parallax = cloneJsonValue(chapter.parallax);
  }
  return payload;
}

function createChapterArtSnapshot(chapter: ResourceRecord): ChapterArtSnapshot {
  const payload = getChapterArtSnapshotPayload(chapter);
  return {
    chapterId: String(chapter.id || ""),
    payload,
    serialized: JSON.stringify(payload)
  };
}

function applyChapterArtSnapshot(chapter: ResourceRecord, payload: ResourceRecord) {
  const next: ResourceRecord = { ...chapter, image: String(payload.image || "") };
  if (Object.prototype.hasOwnProperty.call(payload, "hasParallax")) {
    next.hasParallax = cloneJsonValue(payload.hasParallax);
  } else {
    delete next.hasParallax;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "parallax")) {
    next.parallax = cloneJsonValue(payload.parallax);
  } else {
    delete next.parallax;
  }
  return next;
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

function clampNumber(value: unknown, min: number, max: number, fallback = min) {
  const parsed = Number(value);
  const next = Number.isFinite(parsed) ? parsed : fallback;
  return Math.min(max, Math.max(min, next));
}

function roundCoordinate(value: number) {
  return Math.round(clamp01Number(value) * 1000) / 1000;
}

function roundParallaxCoordinate(value: number) {
  return Math.round(clampNumber(value, -0.5, 1.5, 0.5) * 1000) / 1000;
}

function roundForInput(value: number) {
  return Math.round(value * 1000) / 1000;
}

function round4Number(value: number) {
  return Math.round(value * 10000) / 10000;
}

function normalizeRotationDegrees(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  let rotation = ((parsed + 180) % 360 + 360) % 360 - 180;
  if (Math.abs(rotation) < 0.001) rotation = 0;
  return roundForInput(rotation);
}

function pointerDistance(point: PointerPoint, event: ReactPointerEvent<HTMLElement>) {
  return Math.hypot(event.clientX - point.x, event.clientY - point.y);
}

function pointerAngle(point: PointerPoint, event: ReactPointerEvent<HTMLElement>) {
  return Math.atan2(event.clientY - point.y, event.clientX - point.x) * 180 / Math.PI;
}

function layerPreviewWidthPercent(layer: ResourceRecord) {
  const kind = String(layer.kind || "sprite");
  const scale = normalizeNumber(layer.scale, 1, 0.05, 4);
  if (kind === "background") return clampNumber(scale * 100, 20, 240, 100);
  if (kind === "overlay") return clampNumber(scale * 70, 10, 180, 70);
  if (kind === "title") return clampNumber(scale * 38, 8, 120, 38);
  return clampNumber(scale * 28, 8, 120, 28);
}

function parallaxLayerTransformSummary(layer: ResourceRecord | undefined) {
  if (!layer) return "no layer";
  const anchor = asArray<number>(layer.anchor);
  return [
    `anchor ${clamp01Number(anchor[0], 0.5).toFixed(2)},${clamp01Number(anchor[1], 0.5).toFixed(2)}`,
    `scale ${normalizeNumber(layer.scale, 1, 0.05, 4).toFixed(2)}`,
    `rot ${normalizeRotationDegrees(layer.rotation).toFixed(1)}deg`
  ].join(" · ");
}

function formatNumberInput(value: number) {
  if (Number.isInteger(value)) return String(value);
  return String(roundForInput(value));
}

function parseRichTextPreviewAst(text: string): RichTextAstNode[] {
  const root: RichTextAstNode[] = [];
  const stack: Array<{ tagName: string; children: RichTextAstNode[] }> = [{ tagName: "", children: root }];
  const raw = String(text || "");
  let buffer = "";
  let index = 0;

  const flushBuffer = () => {
    if (!buffer) return;
    const cleanText = stripDialoguePreviewPauses(buffer);
    if (cleanText) {
      stack[stack.length - 1].children.push({ type: "text", text: cleanText });
    }
    buffer = "";
  };

  while (index < raw.length) {
    const openIndex = raw.indexOf("[", index);
    if (openIndex < 0) {
      buffer += raw.slice(index);
      break;
    }

    buffer += raw.slice(index, openIndex);
    const closeIndex = raw.indexOf("]", openIndex + 1);
    if (closeIndex < 0) {
      buffer += raw.slice(openIndex);
      break;
    }

    const tagBody = raw.slice(openIndex + 1, closeIndex);
    const tagName = getBbcodeTagName(tagBody);
    const isClosing = tagBody.trim().startsWith("/");

    if (tagName === "lb" || tagName === "rb") {
      flushBuffer();
      stack[stack.length - 1].children.push({ type: "text", text: tagName === "lb" ? "[" : "]" });
      index = closeIndex + 1;
      continue;
    }

    if (dialogueEventTagNames.has(tagName)) {
      flushBuffer();
      if (!isClosing) {
        stack[stack.length - 1].children.push({
          type: "event",
          tagName,
          attrs: parseBbcodeAttributes(tagBody),
          raw: `[${tagBody}]`
        });
      }
      index = closeIndex + 1;
      continue;
    }

    if (!dialogueBbcodeTagNames.has(tagName)) {
      buffer += raw.slice(openIndex, closeIndex + 1);
      index = closeIndex + 1;
      continue;
    }

    flushBuffer();
    if (isClosing) {
      closeRichTextPreviewTag(stack, tagName);
    } else {
      const span: RichTextAstNode = {
        type: "span",
        tagName,
        attrs: parseBbcodeAttributes(tagBody),
        children: []
      };
      stack[stack.length - 1].children.push(span);
      stack.push({ tagName, children: span.children });
    }
    index = closeIndex + 1;
  }

  flushBuffer();
  return root;
}

function renderRichTextNodes(nodes: RichTextAstNode[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => renderRichTextNode(node, `${keyPrefix}-${index}`));
}

function renderRichTextNode(node: RichTextAstNode, key: string): ReactNode {
  if (node.type === "text") {
    return <span key={key}>{node.text}</span>;
  }

  if (node.type === "event") {
    return renderRichTextEventMarker(node, key);
  }

  const presentation = getRichTextTagPresentation(node.tagName, node.attrs);
  const className = ["rich-text-token", ...presentation.classNames].filter(Boolean).join(" ");
  const children = isFontScaleGradientTag(node)
    ? renderFontScaleGradientNodes(node.children, node.attrs, `${key}-gradient`)
    : renderRichTextNodes(node.children, key);

  return (
    <span
      className={className}
      data-rich-text-note={presentation.dataNote}
      key={key}
      style={presentation.style}
      title={presentation.title}
    >
      {children}
    </span>
  );
}

function renderFontScaleGradientNodes(nodes: RichTextAstNode[], attrs: BbcodeAttributes, keyPrefix: string): ReactNode[] {
  const visibleCount = countRichTextVisibleCharacters(nodes);
  const cursor = { index: 0 };
  const from = normalizeDialogueFontScale(attrs.from, 1);
  const to = normalizeDialogueFontScale(attrs.to, 0.3);
  return nodes.flatMap((node, index) => renderFontScaleGradientNode(node, `${keyPrefix}-${index}`, cursor, visibleCount, from, to));
}

function renderFontScaleGradientNode(
  node: RichTextAstNode,
  key: string,
  cursor: { index: number },
  visibleCount: number,
  from: number,
  to: number
): ReactNode[] {
  if (node.type === "event") {
    return [renderRichTextEventMarker(node, key)];
  }

  if (node.type === "text") {
    return Array.from(node.text).map((character, index) => {
      const amount = visibleCount <= 1 ? 0 : cursor.index / (visibleCount - 1);
      cursor.index += 1;
      const scale = from + (to - from) * amount;
      return (
        <span className="rich-text-font-gradient-char" key={`${key}-${index}`} style={{ fontSize: `${formatDialogueFontScale(scale)}em` }}>
          {character}
        </span>
      );
    });
  }

  const presentation = getRichTextTagPresentation(node.tagName, node.attrs);
  const className = ["rich-text-token", ...presentation.classNames].filter(Boolean).join(" ");
  return [
    <span
      className={className}
      data-rich-text-note={presentation.dataNote}
      key={key}
      style={presentation.style}
      title={presentation.title}
    >
      {renderFontScaleGradientNodesWithCursor(node.children, `${key}-nested`, cursor, visibleCount, from, to)}
    </span>
  ];
}

function renderFontScaleGradientNodesWithCursor(
  nodes: RichTextAstNode[],
  keyPrefix: string,
  cursor: { index: number },
  visibleCount: number,
  from: number,
  to: number
): ReactNode[] {
  return nodes.flatMap((node, index) => renderFontScaleGradientNode(node, `${keyPrefix}-${index}`, cursor, visibleCount, from, to));
}

function renderRichTextEventMarker(node: Extract<RichTextAstNode, { type: "event" }>, key: string) {
  const note = formatEventAttrSummary(node.attrs);
  return (
    <span className="rich-text-event-marker" key={key} title={node.raw}>
      {eventTagLabel(node.tagName)}
      {note ? <small>{note}</small> : null}
    </span>
  );
}

function getRichTextTagPresentation(tagName: string, attrs: BbcodeAttributes): RichTextTagPresentation {
  const classNames: string[] = [];
  const style: CSSProperties = {};
  const customStyle = style as CSSProperties & Record<string, string>;
  let title: string | undefined;
  let dataNote: string | undefined;

  switch (tagName) {
    case "b":
      style.fontWeight = 800;
      break;
    case "i":
      style.fontStyle = "italic";
      break;
    case "u":
      classNames.push("rich-text-underline");
      break;
    case "s":
      classNames.push("rich-text-strike");
      break;
    case "code":
      classNames.push("rich-text-code");
      break;
    case "font_size": {
      const size = clampPreviewNumber(attrs.value, 10, 96, 32);
      style.fontSize = `${size}px`;
      break;
    }
    case "font_scale":
      if (isFontScaleGradientAttrs(attrs)) {
        classNames.push("rich-text-font-gradient");
      } else {
        style.fontSize = `${formatDialogueFontScale(getDialogueFontScaleFromAttrs(attrs, 1))}em`;
      }
      break;
    case "color":
      style.color = resolveRichTextPreviewColor(attrs.value);
      break;
    case "bgcolor":
    case "fgcolor":
      style.backgroundColor = resolveRichTextPreviewColor(attrs.value);
      classNames.push("rich-text-bgcolor");
      break;
    case "outline_size": {
      classNames.push("rich-text-outline");
      const size = clampPreviewNumber(attrs.value, 1, 5, 2);
      customStyle["--rich-text-outline-size"] = `${size}px`;
      break;
    }
    case "outline_color":
      classNames.push("rich-text-outline");
      customStyle["--rich-text-outline-color"] = resolveRichTextPreviewColor(attrs.value) || "rgba(0, 0, 0, 0.9)";
      break;
    case "shake": {
      classNames.push("rich-text-motion", "rich-text-shake");
      const level = getBbcodeAttrNumber(attrs, "level", 5, 1, 12);
      const rate = getBbcodeAttrNumber(attrs, "rate", 20, 1, 40);
      customStyle["--rich-text-shake-level"] = `${level * 0.55}px`;
      style.animationDuration = `${Math.max(0.035, 1 / rate)}s`;
      break;
    }
    case "wave": {
      classNames.push("rich-text-motion", "rich-text-wave");
      const amp = getBbcodeAttrNumber(attrs, "amp", 28, 2, 60);
      const freq = getBbcodeAttrNumber(attrs, "freq", 5, 0.1, 12);
      customStyle["--rich-text-wave-amp"] = `${amp * 0.24}px`;
      style.animationDuration = `${Math.max(0.12, 1 / freq)}s`;
      break;
    }
    case "tornado": {
      classNames.push("rich-text-motion", "rich-text-tornado");
      const radius = getBbcodeAttrNumber(attrs, "radius", 10, 1, 30);
      const freq = getBbcodeAttrNumber(attrs, "freq", 1, 0.1, 6);
      customStyle["--rich-text-tornado-radius"] = `${radius * 0.45}px`;
      style.animationDuration = `${Math.max(0.12, 1 / freq)}s`;
      break;
    }
    case "pulse": {
      classNames.push("rich-text-motion", "rich-text-pulse");
      const freq = getBbcodeAttrNumber(attrs, "freq", 1, 0.1, 6);
      style.animationDuration = `${Math.max(0.2, 2 / freq)}s`;
      break;
    }
    case "fade":
      classNames.push("rich-text-fade");
      break;
    case "rainbow": {
      classNames.push("rich-text-motion", "rich-text-rainbow");
      const speed = Math.abs(getBbcodeAttrNumber(attrs, "speed", 1, -8, 8)) || 1;
      style.animationDuration = `${Math.max(0.2, 1 / speed)}s`;
      break;
    }
    case "grow": {
      classNames.push("rich-text-motion", "rich-text-grow");
      const from = getBbcodeAttrNumber(attrs, "from", 0.78, 0.2, 2);
      const to = getBbcodeAttrNumber(attrs, "to", 1.34, 0.2, 2.5);
      const duration = getBbcodeAttrNumber(attrs, "duration", 1.05, 0.1, 4);
      customStyle["--rich-text-grow-from"] = String(from);
      customStyle["--rich-text-grow-to"] = String(to);
      style.animationDuration = `${duration}s`;
      break;
    }
    case "blink": {
      classNames.push("rich-text-motion", "rich-text-blink");
      const frequency = getBbcodeAttrNumber(attrs, "freq", 3.4, 0.1, 12);
      const minAlpha = getBbcodeAttrNumber(attrs, "min", 0.14, 0, 1);
      customStyle["--rich-text-blink-min"] = String(minAlpha);
      style.animationDuration = `${Math.max(0.06, 1 / frequency)}s`;
      break;
    }
    case "alpha": {
      const alpha = getBbcodeAttrNumber(attrs, ["value", "amount"], 0.45, 0, 1);
      style.opacity = alpha;
      break;
    }
    case "lie":
      classNames.push("rich-text-lie");
      title = "[lie]";
      break;
    case "speed":
    case "text_speed":
    case "type_speed":
    case "typewriter_speed": {
      const speed = getBbcodeAttrNumber(attrs, "value", 1, 0.01, 10);
      classNames.push("rich-text-speed");
      dataNote = `x${formatDialogueFontScale(speed)}`;
      title = `typewriter speed ${dataNote}`;
      break;
    }
    default:
      break;
  }

  return { classNames, style, title, dataNote };
}

function getBbcodeTagName(rawTag: string) {
  let tag = String(rawTag || "").trim().toLowerCase();
  if (!tag) return "";
  if (tag.startsWith("/")) tag = tag.slice(1).trim();
  const separatorIndexes = [" ", "=", "\t", "\n"].map((character) => tag.indexOf(character)).filter((position) => position >= 0);
  if (separatorIndexes.length > 0) tag = tag.slice(0, Math.min(...separatorIndexes));
  return tag.replace(/[^a-z0-9_]/g, "");
}

function parseBbcodeAttributes(rawTag: string): BbcodeAttributes {
  const attrs: BbcodeAttributes = {};
  const payload = getBbcodeTagPayload(rawTag);
  if (!payload) return attrs;
  if (payload.startsWith("=")) {
    attrs.value = unquoteBbcodeValue(payload.slice(1));
    return attrs;
  }
  for (const token of tokenizeBbcodeAttributes(payload)) {
    const separatorIndex = token.indexOf("=");
    if (separatorIndex >= 0) {
      const key = token.slice(0, separatorIndex).trim().toLowerCase();
      if (key) attrs[key] = unquoteBbcodeValue(token.slice(separatorIndex + 1));
    } else if (token) {
      attrs[token.toLowerCase()] = true;
    }
  }
  return attrs;
}

function getBbcodeTagPayload(rawTag: string) {
  let body = String(rawTag || "").trim();
  if (body.startsWith("/")) body = body.slice(1).trim();
  const tagName = getBbcodeTagName(body);
  return tagName ? body.slice(tagName.length).trim() : "";
}

function tokenizeBbcodeAttributes(text: string) {
  const tokens: string[] = [];
  let current = "";
  let quote = "";
  for (const character of String(text || "")) {
    if (quote) {
      current += character;
      if (character === quote) quote = "";
      continue;
    }
    if (character === "\"" || character === "'") {
      quote = character;
      current += character;
      continue;
    }
    if (/\s/.test(character)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += character;
  }
  if (current) tokens.push(current);
  return tokens;
}

function unquoteBbcodeValue(value: unknown) {
  const clean = String(value ?? "").trim();
  if (clean.length >= 2) {
    const first = clean[0];
    const last = clean[clean.length - 1];
    if ((first === "\"" && last === "\"") || (first === "'" && last === "'")) {
      return clean.slice(1, -1);
    }
  }
  return clean;
}

function closeRichTextPreviewTag(stack: Array<{ tagName: string; children: RichTextAstNode[] }>, tagName: string) {
  for (let index = stack.length - 1; index > 0; index -= 1) {
    if (stack[index].tagName === tagName) {
      stack.length = index;
      return;
    }
  }
}

function stripDialoguePreviewPauses(text: string) {
  const raw = String(text || "");
  let out = "";
  let index = 0;
  while (index < raw.length) {
    const character = raw[index];
    if (character === "\\" && index + 1 < raw.length) {
      const next = raw[index + 1];
      if (next === "|" || next === "\\") {
        out += next;
        index += 2;
        continue;
      }
    }
    if (character === "|") {
      index += 1;
      continue;
    }
    out += character;
    index += 1;
  }
  return out;
}

function clampPreviewNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function getBbcodeAttrNumber(attrs: BbcodeAttributes, names: string | string[], fallback: number, min = -Infinity, max = Infinity) {
  const keys = Array.isArray(names) ? names : [names];
  for (const key of keys) {
    if (attrs[key] !== undefined) {
      return clampPreviewNumber(attrs[key], min, max, fallback);
    }
  }
  return fallback;
}

function normalizeDialogueFontScale(value: unknown, fallback = 1) {
  const raw = String(value ?? "").trim().replace(/^x/i, "").replace(/배$/, "");
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(4, Math.max(0.25, parsed));
}

function formatDialogueFontScale(value: number) {
  const rounded = Math.round(Number(value) * 1000) / 1000;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function getDialogueFontScaleFromAttrs(attrs: BbcodeAttributes, fallback = 1) {
  for (const key of ["value", "scale", "multiplier", "ratio", "x"]) {
    if (attrs[key] !== undefined) {
      return normalizeDialogueFontScale(attrs[key], fallback);
    }
  }
  return fallback;
}

function isFontScaleGradientTag(node: RichTextAstNode) {
  return node.type === "span" && node.tagName === "font_scale" && isFontScaleGradientAttrs(node.attrs);
}

function isFontScaleGradientAttrs(attrs: BbcodeAttributes) {
  return attrs.from !== undefined && attrs.to !== undefined;
}

function countRichTextVisibleCharacters(nodes: RichTextAstNode[]): number {
  return nodes.reduce((total, node) => {
    if (node.type === "text") return total + Array.from(node.text).length;
    if (node.type === "span") return total + countRichTextVisibleCharacters(node.children);
    return total;
  }, 0);
}

function resolveRichTextPreviewColor(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  return raw;
}

function formatEventAttrSummary(attrs: BbcodeAttributes) {
  for (const key of ["id", "path", "delay", "volume", "volume_db", "fade", "transition"]) {
    const value = attrs[key];
    if (typeof value === "string" && value.trim()) {
      return value.length > 28 ? `${value.slice(0, 27)}…` : value;
    }
  }
  return "";
}

function eventTagLabel(tagName: string) {
  return {
    sfx: "SFX",
    sound: "SFX",
    se: "SFX",
    bgm: "BGM",
    music: "BGM",
    bgm_stop: "BGM stop",
    music_stop: "BGM stop",
    bgm_volume: "BGM vol",
    music_volume: "BGM vol",
    bg: "BG",
    background: "BG",
    bg_clear: "BG clear",
    background_clear: "BG clear",
    bg_remove: "BG clear",
    background_remove: "BG clear",
    auto_next: "AUTO",
    auto_advance: "AUTO",
    advance: "AUTO"
  }[tagName] || tagName.toUpperCase();
}

function getDialogueVisiblePreviewText(text: unknown) {
  const nodes = parseRichTextPreviewAst(String(text || ""));
  return collectRichTextPlainText(nodes).replace(/\s+/g, " ").trim();
}

function collectRichTextPlainText(nodes: RichTextAstNode[]): string {
  return nodes.map((node) => {
    if (node.type === "text") return node.text;
    if (node.type === "span") return collectRichTextPlainText(node.children);
    return "";
  }).join("");
}

function detectTextTags(text: string) {
  const tags = new Set<string>();
  const patterns: Array<[string, RegExp]> = [
    ["style", /\[(b|i|u|s|code)\b/i],
    ["lie", /\[lie\b/i],
    ["shake", /\[shake\b/i],
    ["wave", /\[wave\b/i],
    ["motion", /\[(tornado|pulse|fade|rainbow|grow|blink)\b/i],
    ["alpha", /\[alpha\b/i],
    ["font", /\[font_scale\b/i],
    ["speed", /\[speed\b/i],
    ["color", /\[color=/i],
    ["color", /\[(bgcolor|fgcolor|outline_size|outline_color)\b/i],
    ["bgm", /\[bgm\b/i],
    ["bgm", /\[(bgm_stop|music_stop|bgm_volume|music_volume)\b/i],
    ["sfx", /\[(sfx|se)\b/i],
    ["bg", /\[(bg|background|bg_clear|background_clear|bg_remove|background_remove)\b/i],
    ["auto", /\[(auto_next|auto_advance|advance)\b/i]
  ];
  for (const [tag, pattern] of patterns) {
    if (pattern.test(text)) tags.add(tag);
  }
  return [...tags];
}

function tagPreviewLabel(tag: string) {
  return {
    style: "서식",
    lie: "거짓",
    shake: "흔들림",
    wave: "물결",
    motion: "움직임",
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

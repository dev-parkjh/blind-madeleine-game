import { useEffect, useMemo, useState } from "react";
import { Icon, SelectField, TextField } from "../../components/EditorControls";
import { createResource, loadResource, saveResource } from "../../lib/api";
import { describeResource, makeUuid, resourceConfig, titleFor } from "../../lib/resourceConfig";
import type { ResourceRecord, ResourceSummary } from "../../types";
import { CharacterRigForm } from "../characterRigs/CharacterRigForm";
import type { ResourceFormCommonProps } from "../resources/resourceFormTypes";
import { prepareDraftForSave } from "../resources/resourceSave";

export function CharacterRigSettings({
  disabled,
  draft,
  references,
  updateField,
  uploadFile,
  notify
}: ResourceFormCommonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [rigDraft, setRigDraft] = useState<ResourceRecord | null>(null);
  const [rigDirty, setRigDirty] = useState(false);
  const [rigBusy, setRigBusy] = useState(false);
  const [rigError, setRigError] = useState("");
  const selectedRigId = String(draft.rig_id || "");
  const selectedRigSummary = references.characterRigs.find((rig) => rig.id === selectedRigId);
  const linkedRigTitle = selectedRigId
    ? selectedRigSummary?.title || titleFor("character_rigs", rigDraft, selectedRigId)
    : "No rig linked";
  const linkedRigSubtitle = selectedRigId
    ? selectedRigSummary?.subtitle || (rigDraft ? describeResource("character_rigs", rigDraft) : "Linked rig")
    : "No rig linked";
  const rigOptions = useMemo(
    () => mergeRigOptions(references.characterRigs, selectedRigId, rigDraft),
    [references.characterRigs, rigDraft, selectedRigId]
  );

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen, rigDirty]);

  function updateRigField(field: string, value: unknown) {
    setRigDraft((current) => {
      if (!current) return current;
      setRigDirty(true);
      return { ...current, [field]: value };
    });
  }

  function updateRigMetadataField(field: string, value: unknown) {
    setRigDraft((current) => {
      if (!current) return current;
      const metadata = current.metadata && typeof current.metadata === "object" && !Array.isArray(current.metadata)
        ? current.metadata as ResourceRecord
        : {};
      setRigDirty(true);
      return { ...current, metadata: { ...metadata, [field]: value } };
    });
  }

  function replaceRigDraft(nextDraft: ResourceRecord) {
    setRigDraft(nextDraft);
    setRigDirty(true);
  }

  async function createAndOpenRig() {
    if (disabled || rigBusy) return;
    setRigBusy(true);
    setRigError("");
    try {
      const id = makeUuid();
      const base = resourceConfig.character_rigs.empty(id);
      const characterName = String(draft.display_name || draft.id || "Character").trim();
      const body = await createResource("character_rigs", {
        ...base,
        display_name: `${characterName} rig`,
        character_id: String(draft.id || "")
      });
      updateField("rig_id", body.summary.id);
      setRigDraft(body.data);
      setRigDirty(false);
      setModalOpen(true);
      notify("Character rig created.");
    } catch (error) {
      const message = (error as Error).message;
      setRigError(message);
      notify(`Character rig creation failed: ${message}`);
    } finally {
      setRigBusy(false);
    }
  }

  async function openRig() {
    if (disabled || rigBusy) return;
    if (!selectedRigId) {
      await createAndOpenRig();
      return;
    }
    setRigBusy(true);
    setRigError("");
    try {
      const body = await loadResource("character_rigs", selectedRigId);
      setRigDraft({
        ...body.data,
        character_id: body.data.character_id || draft.id || ""
      });
      setRigDirty(false);
      setModalOpen(true);
    } catch (error) {
      const message = (error as Error).message;
      setRigError(message);
      notify(`Character rig load failed: ${message}`);
    } finally {
      setRigBusy(false);
    }
  }

  async function saveRig() {
    if (!rigDraft?.id || rigBusy) return;
    setRigBusy(true);
    setRigError("");
    try {
      const id = String(rigDraft.id);
      const prepared = prepareDraftForSave("character_rigs", {
        ...rigDraft,
        character_id: String(draft.id || rigDraft.character_id || "")
      }, references);
      const body = await saveResource("character_rigs", id, prepared);
      setRigDraft(body.data);
      setRigDirty(false);
      updateField("rig_id", body.summary.id);
      notify("Character rig saved.");
    } catch (error) {
      const message = (error as Error).message;
      setRigError(message);
      notify(`Character rig save failed: ${message}`);
    } finally {
      setRigBusy(false);
    }
  }

  function requestClose() {
    if (rigDirty && !window.confirm("Discard unsaved rig changes?")) return;
    setModalOpen(false);
  }

  return (
    <section className="structured-editor character-rig-settings">
      <div className="structured-header">
        <span>Rigging</span>
        <div className="character-rig-actions">
          <button disabled={disabled || rigBusy} type="button" onClick={createAndOpenRig}><Icon name="Add" />New</button>
          <button disabled={disabled || rigBusy} type="button" onClick={openRig}><Icon name="OpenInFull" />Open</button>
        </div>
      </div>
      <SelectField label="Linked rig" value={selectedRigId} options={rigOptions} onChange={(value) => updateField("rig_id", value)} />
      <div className="rig-link-summary">
        <strong>{linkedRigTitle}</strong>
        {selectedRigId && <code>{selectedRigId}</code>}
        <span>{linkedRigSubtitle}</span>
      </div>
      {rigError && <p className="rig-error-text">{rigError}</p>}
      {modalOpen && rigDraft && (
        <div className="rig-workbench-overlay" role="dialog" aria-modal="true" aria-label="Character rig editor">
          <div className="rig-workbench-modal">
            <header className="rig-workbench-header">
              <div className="rig-workbench-title">
                <span>Character Rig</span>
                <strong>{String(draft.display_name || draft.id || "Character")}</strong>
                <code>{String(rigDraft.id || selectedRigId)}</code>
              </div>
              <TextField label="Rig name" value={rigDraft.display_name || ""} onChange={(value) => updateRigField("display_name", value)} />
              <div className="rig-workbench-actions">
                <button disabled={rigBusy || !rigDirty} type="button" onClick={saveRig}><Icon name="Save" />Save rig</button>
                <button disabled={rigBusy} type="button" onClick={requestClose}><Icon name="Close" />Close</button>
              </div>
            </header>
            <div className={`rig-workbench-body ${rigBusy ? "busy" : ""}`}>
              <CharacterRigForm
                disabled={disabled || rigBusy}
                draft={rigDraft}
                embedded
                references={references}
                updateField={updateRigField}
                updateMetadataField={updateRigMetadataField}
                uploadFile={uploadFile}
                replaceDraft={replaceRigDraft}
                savedJsonText=""
                notify={notify}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function mergeRigOptions(options: ResourceSummary[], selectedRigId: string, rigDraft: ResourceRecord | null): ResourceSummary[] {
  const byId = new Map(options.map((option) => [option.id, option]));
  if (rigDraft?.id) {
    byId.set(String(rigDraft.id), {
      id: String(rigDraft.id),
      type: "character_rigs",
      title: titleFor("character_rigs", rigDraft, String(rigDraft.id)),
      subtitle: describeResource("character_rigs", rigDraft)
    });
  }
  if (selectedRigId && !byId.has(selectedRigId)) {
    byId.set(selectedRigId, {
      id: selectedRigId,
      type: "character_rigs",
      title: selectedRigId,
      subtitle: "Linked rig"
    });
  }
  return Array.from(byId.values());
}

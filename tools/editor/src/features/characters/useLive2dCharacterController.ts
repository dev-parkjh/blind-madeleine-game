import { useContext, useEffect, useState } from "react";
import { LanguageContext } from "../../editorText";
import { safeSegment } from "../../lib/files";
import { roundForInput } from "../../lib/numeric";
import type { ResourceRecord } from "../../types";
import { live2dEditorCopy } from "./live2dEditorCopy";
import { getPortraitCenterPoint } from "./portraitModel";
import {
  applyLive2dAngleRigToEditorParts,
  getLive2dAngleParts,
  getLive2dAngleRig,
  getLive2dCanvasSize,
  getLive2dMotionParts,
  getLive2dMotions,
  getLive2dParts,
  live2dMotionSpeedDefault,
  live2dRecordForEditor
} from "./live2dModel";

export type Live2dEditorTab = "preview" | "setup" | "parts" | "angle" | "motions";

export function useLive2dCharacterController({
  draft,
  updateField
}: {
  draft: ResourceRecord;
  updateField: (field: string, value: unknown) => void;
}) {
  const language = useContext(LanguageContext);
  const copy = live2dEditorCopy(language);
  const live2d = live2dRecordForEditor(draft.live2d);
  const parts = getLive2dParts(live2d.parts);
  const motions = getLive2dMotions(live2d.motions);
  const angleRig = getLive2dAngleRig(live2d.angle_rig);
  const motionKeys = Object.keys(motions);
  const motionEntries = Object.entries(motions);
  const canvasSize = getLive2dCanvasSize(live2d.canvas_size);
  const center = getPortraitCenterPoint(live2d.center ?? live2d.face_center);
  const defaultMotionKey = String(live2d.default_motion || "").trim();
  const initialPreviewMotion = defaultMotionKey && motions[defaultMotionKey] ? defaultMotionKey : (motionKeys[0] || "");
  const motionKeysSignature = motionKeys.join("\u0000");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Live2dEditorTab>("preview");
  const [previewMotionKey, setPreviewMotionKey] = useState(initialPreviewMotion);
  const [previewAngle, setPreviewAngle] = useState(0);
  const [previewPlaying, setPreviewPlaying] = useState(true);
  const [previewResetToken, setPreviewResetToken] = useState(0);

  useEffect(() => {
    if (!settingsOpen) return;
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setSettingsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [settingsOpen]);

  useEffect(() => {
    if (!motionKeys.length) {
      if (previewMotionKey) setPreviewMotionKey("");
      return;
    }
    if (!previewMotionKey || !motions[previewMotionKey]) {
      setPreviewMotionKey(initialPreviewMotion);
    }
  }, [initialPreviewMotion, motionKeysSignature, previewMotionKey]);

  function setLive2d(next: ResourceRecord) {
    updateField("live2d", next);
  }

  function patchLive2d(patch: ResourceRecord) {
    setLive2d({ ...live2d, ...patch });
  }

  function setParts(nextParts: ResourceRecord[]) {
    setLive2d({ ...live2d, parts: nextParts });
  }

  function updatePart(index: number, patch: ResourceRecord) {
    setParts(parts.map((part, partIndex) => partIndex === index ? { ...part, ...patch } : part));
  }

  function renamePart(index: number, nextId: string) {
    const current = parts[index];
    if (!current) return;
    const oldId = String(current.id || "").trim();
    const clean = nextUniqueId(parts.map((part, partIndex) => partIndex === index ? "" : String(part.id || "")), safeSegment(nextId || oldId || "part", "part"));
    const nextParts = parts.map((part, partIndex) => partIndex === index ? { ...part, id: clean } : part);
    const nextMotions = { ...motions };
    const nextAngleRig = { ...angleRig, parts: { ...getLive2dAngleParts(angleRig.parts) } };
    if (oldId && oldId !== clean) {
      for (const [motionKey, motion] of Object.entries(nextMotions)) {
        const motionParts = getLive2dMotionParts(motion.parts);
        if (!motionParts[oldId] || motionParts[clean]) continue;
        motionParts[clean] = motionParts[oldId];
        delete motionParts[oldId];
        nextMotions[motionKey] = { ...motion, parts: motionParts };
      }
      const angleParts = getLive2dAngleParts(nextAngleRig.parts);
      if (angleParts[oldId] && !angleParts[clean]) {
        angleParts[clean] = angleParts[oldId];
        delete angleParts[oldId];
        nextAngleRig.parts = angleParts;
      }
    }
    setLive2d({ ...live2d, parts: nextParts, motions: nextMotions, angle_rig: nextAngleRig });
  }

  function addPart() {
    const partId = nextUniqueId(parts.map((part) => String(part.id || "")), "part");
    setParts([
      ...parts,
      {
        id: partId,
        path: "",
        position: [roundForInput(canvasSize.x * 0.5), roundForInput(canvasSize.y * 0.5)],
        anchor: [0.5, 0.5],
        scale: [1, 1],
        rotation: 0,
        opacity: 1,
        z_index: parts.length
      }
    ]);
  }

  function removePart(index: number) {
    const partId = String(parts[index]?.id || "").trim();
    const nextParts = parts.filter((_, partIndex) => partIndex !== index);
    const nextMotions = { ...motions };
    const nextAngleRig = { ...angleRig, parts: { ...getLive2dAngleParts(angleRig.parts) } };
    if (partId) {
      for (const [motionKey, motion] of Object.entries(nextMotions)) {
        const motionParts = getLive2dMotionParts(motion.parts);
        if (!motionParts[partId]) continue;
        delete motionParts[partId];
        nextMotions[motionKey] = { ...motion, parts: motionParts };
      }
      const angleParts = getLive2dAngleParts(nextAngleRig.parts);
      delete angleParts[partId];
      nextAngleRig.parts = angleParts;
    }
    setLive2d({ ...live2d, parts: nextParts, motions: nextMotions, angle_rig: nextAngleRig });
  }

  function setMotions(nextMotions: Record<string, ResourceRecord>) {
    setLive2d({ ...live2d, motions: nextMotions });
  }

  function addMotion() {
    const key = nextUniqueId(Object.keys(motions), "default");
    setMotions({ ...motions, [key]: { speed: live2dMotionSpeedDefault, parts: {} } });
    if (!String(live2d.default_motion || "").trim()) {
      patchLive2d({ default_motion: key, motions: { ...motions, [key]: { speed: live2dMotionSpeedDefault, parts: {} } } });
    }
  }

  function renameMotion(oldKey: string, nextKey: string) {
    const clean = nextUniqueId(Object.keys(motions).filter((key) => key !== oldKey), safeSegment(nextKey || oldKey, "default"));
    if (clean === oldKey) return;
    const nextMotions: Record<string, ResourceRecord> = {};
    for (const [key, value] of Object.entries(motions)) {
      nextMotions[key === oldKey ? clean : key] = value;
    }
    setLive2d({
      ...live2d,
      default_motion: String(live2d.default_motion || "") === oldKey ? clean : live2d.default_motion,
      motions: nextMotions
    });
  }

  function removeMotion(key: string) {
    const nextMotions = { ...motions };
    delete nextMotions[key];
    setLive2d({
      ...live2d,
      default_motion: String(live2d.default_motion || "") === key ? "" : live2d.default_motion,
      motions: nextMotions
    });
  }

  function updateMotion(key: string, patch: ResourceRecord) {
    setMotions({ ...motions, [key]: { ...motions[key], ...patch } });
  }

  function updateMotionPart(motionKey: string, partId: string, patch: ResourceRecord) {
    const motion = motions[motionKey] || {};
    const motionParts = getLive2dMotionParts(motion.parts);
    motionParts[partId] = { ...motionParts[partId], ...patch };
    updateMotion(motionKey, { parts: motionParts });
  }

  function patchAngleRig(patch: ResourceRecord) {
    setLive2d({ ...live2d, angle_rig: { ...angleRig, ...patch } });
  }

  function updateAnglePart(partId: string, patch: ResourceRecord) {
    const angleParts = getLive2dAngleParts(angleRig.parts);
    angleParts[partId] = { ...angleParts[partId], ...patch };
    patchAngleRig({ parts: angleParts });
  }

  const previewMotion = previewMotionKey ? motions[previewMotionKey] || {} : {};
  const previewParts = applyLive2dAngleRigToEditorParts(parts, angleRig, previewAngle);
  const live2dTabs: Array<{ id: Live2dEditorTab; label: string }> = [
    { id: "preview", label: copy.previewTab },
    { id: "setup", label: copy.setupTab },
    { id: "parts", label: copy.partsTab },
    { id: "angle", label: copy.angleTab },
    { id: "motions", label: copy.motionsTab }
  ];

  return {
    activeTab,
    addMotion,
    addPart,
    angleRig,
    canvasSize,
    center,
    copy,
    defaultMotionKey,
    live2d,
    live2dTabs,
    motionEntries,
    motionKeys,
    parts,
    patchAngleRig,
    patchLive2d,
    previewAngle,
    previewMotion,
    previewMotionKey,
    previewParts,
    previewPlaying,
    previewResetToken,
    removeMotion,
    removePart,
    renameMotion,
    renamePart,
    setActiveTab,
    setPreviewAngle,
    setPreviewMotionKey,
    setPreviewPlaying,
    setPreviewResetToken,
    setSettingsOpen,
    settingsOpen,
    updateAnglePart,
    updateMotion,
    updateMotionPart,
    updatePart
  };
}

function nextUniqueId(existingIds: string[], requested: string) {
  const taken = new Set(existingIds.map((id) => String(id || "").trim()).filter(Boolean));
  const base = safeSegment(requested, "item");
  if (!taken.has(base)) return base;
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base}_${index}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}_${Date.now()}`;
}

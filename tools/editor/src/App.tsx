import { useEffect, useRef, useState } from "react";
import type { EditorLanguage, EditorThemeAccent, EditorThemeMode } from "./editorTypes";
import { LanguageContext } from "./editorText";
import { EditorTopBar } from "./components/EditorTopBar";
import { MobileFabMenu } from "./components/MobileFabMenu";
import { ResourceEditorGrid } from "./features/resources/ResourceEditorGrid";
import { useResourceEditorController } from "./features/resources/useResourceEditorController";
import {
  godotPreviewEndpointStorageKey,
  readEditorCustomAccent,
  readEditorLanguage,
  readEditorThemeAccent,
  readEditorThemeMode,
  readGodotPreviewEndpoint,
  saveLocalSetting
} from "./lib/editorPreferences";
import { useEditorAppearance } from "./lib/useEditorAppearance";
import { useEditorNavigationGuard } from "./lib/useEditorNavigationGuard";
import { useFloatingMenus } from "./lib/useFloatingMenus";
import { usePendingTask } from "./lib/usePendingTask";
import { useToast } from "./lib/useToast";

function App() {
  const [language, setLanguage] = useState<EditorLanguage>(readEditorLanguage);
  const [themeMode, setThemeMode] = useState<EditorThemeMode>(readEditorThemeMode);
  const [themeAccent, setThemeAccent] = useState<EditorThemeAccent>(readEditorThemeAccent);
  const [customAccent, setCustomAccent] = useState(readEditorCustomAccent);
  const [bridgeEndpoint] = useState(readGodotPreviewEndpoint);
  const { notify, toast } = useToast();
  const settingsMenuRef = useRef<HTMLDetailsElement | null>(null);
  const {
    isPendingTask,
    pendingTaskLabel,
    pendingTaskRef,
    runPendingTask
  } = usePendingTask();

  const resourceEditor = useResourceEditorController({
    bridgeEndpoint,
    isAppBusy: isPendingTask,
    language,
    notify,
    pendingTaskLabel,
    pendingTaskRef,
    runPendingTask
  });

  useEditorNavigationGuard(resourceEditor.dirty, pendingTaskRef);
  useFloatingMenus(settingsMenuRef, resourceEditor.resourceFilterMenuRef);
  useEditorAppearance({ customAccent, language, themeAccent, themeMode });

  useEffect(() => {
    saveLocalSetting(godotPreviewEndpointStorageKey, bridgeEndpoint);
  }, [bridgeEndpoint]);

  return (
    <LanguageContext.Provider value={language}>
      <div className="app-shell">
        <EditorTopBar
          customAccent={customAccent}
          language={language}
          settingsMenuRef={settingsMenuRef}
          themeAccent={themeAccent}
          themeMode={themeMode}
          setCustomAccent={setCustomAccent}
          setLanguage={setLanguage}
          setThemeAccent={setThemeAccent}
          setThemeMode={setThemeMode}
          {...resourceEditor.topBarProps}
        />

        <ResourceEditorGrid {...resourceEditor.gridProps} />

        <div className={`toast ${toast ? "visible" : ""}`}>{toast}</div>
        <MobileFabMenu {...resourceEditor.mobileFabProps} />
      </div>
    </LanguageContext.Provider>
  );
}

export default App;

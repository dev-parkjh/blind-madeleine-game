import { useEffect, useState } from "react";
import type { EditorTab } from "../../editorTypes";
import type { ResourceType } from "../../types";
import { defaultEditorTabForResource, editorTabsForResource } from "./editorTabs";

export function useEditorTabs(type: ResourceType) {
  const [tab, setTab] = useState<EditorTab>(() => defaultEditorTabForResource("dialogues"));
  const visibleTabs = editorTabsForResource(type);
  const activeTab = visibleTabs.includes(tab) ? tab : defaultEditorTabForResource(type);

  useEffect(() => {
    if (!editorTabsForResource(type).includes(tab)) setTab(defaultEditorTabForResource(type));
  }, [tab, type]);

  return { activeTab, setTab, visibleTabs };
}

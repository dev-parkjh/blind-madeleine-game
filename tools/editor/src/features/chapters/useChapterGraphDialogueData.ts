import { useEffect, useState } from "react";
import { loadResource } from "../../lib/api";
import type { ResourceRecord } from "../../types";

export function useChapterGraphDialogueData(placedIds: string[]) {
  const [dialogueData, setDialogueData] = useState<Record<string, ResourceRecord>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (placedIds.length === 0) {
      setDialogueData({});
      setLoading(false);
      return () => { cancelled = true; };
    }

    setLoading(true);
    Promise.all(placedIds.map(async (id) => {
      try {
        const body = await loadResource("dialogues", id);
        return [id, body.data] as const;
      } catch (error) {
        return [id, { id, metadata: {}, __load_error: (error as Error).message }] as const;
      }
    })).then((entries) => {
      if (cancelled) return;
      const nextData: Record<string, ResourceRecord> = {};
      for (const [id, data] of entries) nextData[id] = data;
      setDialogueData(nextData);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [placedIds.join("|")]);

  return { dialogueData, loading, setDialogueData };
}

import type { ResourceRecord } from "../../types";

export function ChapterParallaxLayerIndex({
  layers,
  onSelectLayer,
  selectedLayerIndex
}: {
  layers: ResourceRecord[];
  onSelectLayer: (index: number) => void;
  selectedLayerIndex: number;
}) {
  if (layers.length === 0) return null;

  return (
    <div className="parallax-layer-mini-index" role="list" aria-label="parallax layer index">
      {layers.map((layer, index) => (
        <button
          className={index === selectedLayerIndex ? "active" : ""}
          key={`${layer.id || "layer"}-${index}`}
          type="button"
          onClick={() => onSelectLayer(index)}
        >
          <span>{index + 1}. {String(layer.name || layer.id || `Layer ${index + 1}`)}</span>
          <code>{String(layer.kind || "sprite")}{layer.visible === false ? " · hidden" : ""}{layer.thumbnail_excluded ? " · no-thumb" : ""}</code>
        </button>
      ))}
    </div>
  );
}

# Visual Novel Data

Story content is data-driven. Developers should add character files under `res://data/characters` and dialogue JSON files under `res://data/dialogues`.

`VisualNovelData` is an autoload singleton that reads all `.json` files from both folders at startup.

## Character Config

Create one JSON file per character in `data/characters`.

Required fields:

- `id`: unique character id used by dialogue files.

Recommended fields:

- `display_name`: name shown in dialogue UI.
- `name_color`: HTML color string for the speaker name.
- `portraits`: object mapping portrait states to asset paths.
- `voice`: object for voice-related settings.
- `metadata`: object for game-specific extension data.

Minimal shape:

```json
{
  "id": "character_id",
  "display_name": "Display Name",
  "name_color": "#ffffff",
  "portraits": {},
  "voice": {},
  "metadata": {}
}
```

## Dialogue File

Create dialogue JSON files in `data/dialogues`.

Required fields:

- `id`: unique dialogue id.
- `nodes`: array of dialogue nodes.

Recommended fields:

- `start`: first node id. If omitted, the first node becomes the start node.
- `metadata`: object for game-specific extension data.

Node fields:

- `id`: unique node id inside this dialogue.
- `speaker`: character id from `data/characters`.
- `text`: dialogue text.
- `portrait`: portrait key from the speaker's character config.
- `next`: next node id.
- `choices`: array of selectable branches.
- `metadata`: object for game-specific extension data.

Minimal shape:

```json
{
  "id": "dialogue_id",
  "start": "start",
  "nodes": [
    {
      "id": "start",
      "speaker": "character_id",
      "text": "",
      "portrait": "",
      "next": "",
      "choices": [],
      "metadata": {}
    }
  ],
  "metadata": {}
}
```

Choice shape:

```json
{
  "text": "",
  "next": "node_id",
  "conditions": [],
  "set_flags": {}
}
```

Extra fields are preserved by the loader, so future systems can add investigation flags, voice timing, camera cues, or presentation instructions without changing the base loader.

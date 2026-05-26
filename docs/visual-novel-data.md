# Visual Novel Data

Story content is data-driven. Developers should add character files under `res://data/characters`, item files under `res://data/items`, and dialogue JSON files under `res://data/dialogues`.

`VisualNovelData` is an autoload singleton that reads all `.json` files from these folders at startup.

## Dialogue Typography

Story dialogue speaker name and body text fonts are configured in `scripts/visual_novel/dialogue_typography.gd` (`DialogueTypography` constants). `weight` (100–900) applies to variable fonts such as Pretendard Variable.

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

## Item Config

Create one JSON file per item in `data/items`.

Recommended fields:

- `id`: unique item id used by inventory, dialogue metadata, or investigation systems.
- `name`: item name shown to the player.
- `description`: short item description.
- `image`: optional asset path for the item photo or icon.
- `metadata`: object for game-specific extension data.

Minimal shape:

```json
{
  "id": "item_id",
  "name": "Item Name",
  "description": "",
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
- `stage_cast`: object keyed by character id. Each entry controls that character's on-stage portrait, layout, opacity, animation order, and optional exit flag.
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
      "stage_cast": {
        "character_id": {
          "portrait": "default",
          "animation_order": 1,
          "portrait_zoom": 300,
          "animation_speed": 1,
          "portrait_opacity": 1,
          "portrait_position": "center"
        }
      },
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

## Statement Mode Extensions

Set dialogue metadata to statement mode:

```json
{
  "nodes": [],
  "statement_nodes": [
    {
      "id": "statement_start",
      "speaker": "arin",
      "text": "그날 밤 주방 근처에 [없었습니다]."
    },
    {
      "id": "statement_detail",
      "speaker": "arin",
      "text": "그리고 상자 앞에는 [먼지]가 없었어요."
    }
  ],
  "metadata": {
    "presentation_mode": "statement",
    "next_dialogue": "chapter_001_after_statement"
  }
}
```

Statement text can mark clickable shaking phrases with square brackets:

```json
{
  "text": "그날 밤 저는 주방 근처에 [없었습니다]."
}
```

Each marked phrase can define reactions. A `default` reaction is used for a wrong notebook connection. `character` and `item` reactions match the selected character or item id. Each reaction owns its own nested `nodes` list; the reaction automatically enters the first nested node, so it does not need to select a node from the regular `nodes` list.

```json
{
  "statement_lies": [
    {
      "id": "lie_0",
      "phrase": "없었습니다",
      "reactions": [
        {
          "kind": "default",
          "label": "잘못된 연결",
          "nodes": [
            {
              "speaker": "arin",
              "text": "그 연결로는 진술이 흔들리지 않아요."
            }
          ]
        },
        {
          "kind": "item",
          "target_id": "test_item1",
          "statement_end": true,
          "nodes": [
            {
              "speaker": "arin",
              "text": "맞아요. 그 물건이 있었다면 진술은 버티지 못해요."
            }
          ]
        }
      ]
    }
  ]
}
```

`statement_nodes` is only used in statement mode and is managed as a separate node list from `nodes`. These nodes are shown during the left/right statement loop: title display, statement node traversal, repeat prompt, then "yes" restarts from the first statement node. Reaction subnodes are scoped under each reaction and behave like ordinary node lists, including sequential `next`, explicit `next`, `choices`, and stage cast data. Set `statement_end: true` on the reaction when that reaction should finish the statement sequence. If the reaction does not end and the last reaction subnode has no `next`, statement mode returns to the statement node that opened the reaction.

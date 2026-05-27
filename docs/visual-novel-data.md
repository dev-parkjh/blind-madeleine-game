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
  - A portrait may be a string path or an object with `path`, `center`, and optional `profile`.
  - `center`: normalized face position `[x, y]` used by stage layout.
  - `profile`: optional profile crop override for notebook/popup portraits.
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

Portrait profile crop shape:

```json
{
  "portraits": {
    "happy": {
      "path": "res://assets/characters/arin/happy.png",
      "center": [0.5007, 0.1149],
      "profile": {
        "zoom": 3,
        "offset": [0.02, 0.04]
      }
    }
  }
}
```

`profile.zoom` is a multiplier over a square cover crop. `profile.offset` moves the face anchor inside the square profile frame, using normalized frame units. If `profile` is omitted, the game crops from the portrait `center` with the default profile zoom.

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
  - `next_dialogue`: dialogue id to start automatically after this dialogue ends.

Node fields:

- `id`: unique node id inside this dialogue.
- `speaker`: character id from `data/characters`.
- `text`: dialogue text.
- `acquire_info`: character/item info granted when this node is shown.
- `stage_cast`: object keyed by character id. Each entry controls that character's on-stage portrait, layout, opacity, animation order, optional position order, and optional exit flag.
- `popups`: array of popup images shown while this node is active.
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
      "acquire_info": {
        "characters": [],
        "items": []
      },
      "stage_cast": {
        "character_id": {
          "portrait": "default",
          "animation_order": 1,
          "portrait_zoom": 300,
          "animation_speed": 1,
          "portrait_opacity": 1,
          "portrait_position": "center",
          "portrait_position_order": 1,
          "portrait_flip_h": false
        }
      },
      "popups": [],
      "next": "",
      "choices": [],
      "metadata": {}
    }
  ],
  "metadata": {}
}
```

When two or more visible stage characters use the same `portrait_position` (`left`, `center`, or `right`), set `portrait_position_order` to arrange that group from screen-left to screen-right. The renderer spreads those characters around the shared position so their portraits do not sit directly on top of each other. `custom` positions ignore this field.

Set `portrait_flip_h` to `true` when a stage portrait should be mirrored horizontally, such as making a character face the opposite direction.

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

## Dialogue Popup Images

Use node-level `popups` to show temporary images above the stage while a line is active. Popups are cleared when the next node appears.

Character profile popup:

```json
{
  "speaker": "arin",
  "text": "이 표정을 기억해 주세요.",
  "popups": [
    {
      "source": "character_profile",
      "target_id": "arin",
      "portrait": "happy",
      "position": "right",
      "offset": [0, -0.04],
      "size": [320, 320],
      "opacity": 0.95,
      "transition": "pop"
    }
  ]
}
```

Item or direct image popup:

```json
{
  "speaker": "narrator",
  "text": "탁자 위의 사진이 눈에 들어왔다.",
  "popups": [
    {
      "source": "item",
      "target_id": "test_item1",
      "position": "left",
      "image_mode": "fit"
    },
    {
      "source": "image",
      "path": "res://assets/items/photo/image.png",
      "position": "center"
    }
  ]
}
```

Popup fields:

- `source`: `character_profile`, `item`, or `image`.
- `target_id`: character id for `character_profile`, item id for `item`.
- `portrait`: optional portrait key for character profile popups; omitted means the character profile default or `default` portrait.
- `path`: direct image path for `source: "image"`.
- `position`: `left`, `center`, `right`, `top_left`, `top_right`, or `custom`.
- `offset`: normalized screen offset `[x, y]`.
- `size`: base frame size in pixels at 1920x1080 reference scale.
- `scale`, `opacity`, `transition`: visual tuning values. `transition` supports `fade`, `pop`, `slide`, and `none`.

## Node Info Acquisition

Use node-level `acquire_info` to grant notebook info as a dialogue line appears. The acquired character/item ids become available in the statement notebook. Acquisition notices are not generated automatically; write them directly in `text` when the scene needs one.

```json
{
  "speaker": "narrator",
  "text": "이아린의 인물 정보를 획득했다.",
  "acquire_info": {
    "characters": ["arin"]
  }
}
```

The field works on narrator nodes and character-spoken nodes alike. Acquisition-only nodes are valid, but a short narrator line is usually clearer for pacing.

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

`statement_nodes` is only used in statement mode and is managed as a separate node list from `nodes`. These nodes are shown during the left/right statement flow: title display, statement node traversal, and a disabled forward control at the final statement node. Reaction subnodes are scoped under each reaction and behave like ordinary node lists, including sequential `next`, explicit `next`, `choices`, and stage cast data. Set `statement_end: true` on the reaction when that reaction should finish the statement sequence. If the reaction does not end and the last reaction subnode has no `next`, statement mode returns to the statement node that opened the reaction.

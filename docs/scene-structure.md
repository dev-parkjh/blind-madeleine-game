# Scene Structure

The project keeps visual-novel screens separated from gameplay logic. Each screen has its own scene and script, while `Main` acts as a shell that owns safe-area margins, overlays, and input-mode UI feedback.

## Main Shell

- Scene: `res://scenes/main/main.tscn`
- Script: `res://scripts/main/main.gd`
- Purpose: load one primary screen into `ScreenRoot` and optional overlays into `OverlayRoot`.

Registered screen ids:

- `main_title`
- `chapter_select`
- `story_dialogue`
- `statement`
- `backlog`
- `branch_tree`

## Screens

### Main Title

- Scene: `res://scenes/screens/main_title_screen.tscn`
- Script: `res://scripts/screens/main_title_screen.gd`
- Structure:
  - `NewGamePanel/NewGameButton`: opens chapter selection.
  - `LoadGamePanel`: save selection entry point.

### Chapter Select

- Scene: `res://scenes/screens/chapter_select_screen.tscn`
- Script: `res://scripts/screens/chapter_select_screen.gd`
- Structure:
  - `ChapterListPanel/ChapterList`
  - `Chapter001Button`: selectable `1화 - 비의 장막`.

### Story Dialogue

- Scene: `res://scenes/screens/story_dialogue_screen.tscn`
- Script: `res://scripts/screens/story_dialogue_screen.gd`
- Structure:
  - `Stage/BackgroundLayer`
  - `Stage/CharacterLayer`
  - `Stage/EffectLayer`
  - `DialoguePanel`
  - `ChoiceList`
- `skip_allowed` is `true`.

### Statement

- Scene: `res://scenes/screens/statement_screen.tscn`
- Script: `res://scripts/screens/statement_screen.gd`
- Structure:
  - `StatementPanel/StatementText`
  - `StatementNavigation/PreviousStatementButton`
  - `StatementNavigation/NextStatementButton`
- `skip_allowed` is `false`.

### Backlog

- Scene: `res://scenes/screens/backlog_screen.tscn`
- Script: `res://scripts/screens/backlog_screen.gd`
- Receives an `entries` payload from `story_dialogue_screen.gd` and renders the current dialogue log as an overlay.
- Structure:
  - `BacklogScroll/BacklogEntryList`
  - `BacklogEntryTemplate`

### Branch Tree

- Scene: `res://scenes/screens/branch_tree_screen.tscn`
- Script: `res://scripts/screens/branch_tree_screen.gd`
- Structure:
  - `BranchTreeScroll/BranchTreeCanvas`
  - `RouteColumns`
  - `BranchNodeTemplate`

## Base Screen Contract

All screen scripts extend `res://scripts/screens/screen_base.gd`.

- `screen_id`: screen identifier.
- `screen_title`: display/debug title.
- `skip_allowed`: whether the current screen type may be skipped.
- `setup(payload)`: receives future navigation/data payloads.
- `requested_screen_change(screen_id, payload)`: screen-level navigation request.
- `close_requested`: overlay close request.

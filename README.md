# Blind Madeleine

A Godot 4 detective game starter configured for PC and mobile-friendly input.

## Current Setup

- Main scene: `res://scenes/main/main.tscn`
- Input singleton: `res://scripts/input/input_router.gd`
- Visual novel data singleton: `res://scripts/visual_novel/visual_novel_data.gd`
- Screen shell: `res://scripts/main/main.gd`
- Screen scenes: `res://scenes/screens`
- First selectable chapter: `1화 - 비의 장막`
- Character configs: `res://data/characters`
- Chapter configs: `res://data/chapters`
- Item configs: `res://data/items`
- Story asset configs: `res://data/story_assets`
- Dialogue files: `res://data/dialogues`
- Responsive UI: compact phone, balanced desktop/tablet, and wide/foldable layouts (1920x1080 reference canvas)
- Controls/deployment notes: `docs/controls-and-deployment.md`
- Scene structure notes: `docs/scene-structure.md`
- Visual novel data notes: `docs/visual-novel-data.md`
- Data tools: `tools/editor`
- Web rig portrait editor: `tools/portrait-rig-editor` (auto-started by `tools/editor` by default)

## Input Devices

Gameplay should use `InputRouter` signals instead of checking mouse, touch, keyboard, or gamepad events directly.

- Mouse: point, left click, right click, Skip button click toggle/hold momentary
- Touch: tap and drag
- Keyboard: WASD/arrows, Space/Enter, Space hold auto, R statement present mode, F auto, Shift, Esc/Q, Tab/N, P
- Gamepad: sticks/D-pad focus navigation, A confirm/hold auto, RB statement present mode, B back, X auto, Select tree, Menu/Start pause, shoulder buttons

## Run

Open the project in Godot 4.6 or newer and run the main scene.

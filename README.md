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
- Dialogue files: `res://data/dialogues`
- Responsive UI: compact phone, balanced desktop/tablet, and wide/foldable layouts (1920x1080 reference canvas)
- Controls/deployment notes: `docs/controls-and-deployment.md`
- Scene structure notes: `docs/scene-structure.md`
- Visual novel data notes: `docs/visual-novel-data.md`

## Input Devices

Gameplay should use `InputRouter` signals instead of checking mouse, touch, keyboard, or gamepad events directly.

- Mouse: point, left click, right click
- Touch: tap and drag
- Keyboard: WASD/arrows, Space/Enter, Shift, Esc/Q, Tab/N, P
- Gamepad: sticks/D-pad focus navigation, A confirm, B back, X notebook, Select tree, Menu/Start pause, shoulder buttons

## Run

Open the project in Godot 4.6 or newer and run the main scene.

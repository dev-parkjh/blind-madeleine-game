# Blind Madeleine

A Godot 4 detective game starter configured for PC and mobile-friendly input.

## Current Setup

- Main scene: `res://scenes/main/main.tscn`
- Input singleton: `res://scripts/input/input_router.gd`
- Visual novel data singleton: `res://scripts/visual_novel/visual_novel_data.gd`
- Character configs: `res://data/characters`
- Dialogue files: `res://data/dialogues`
- Virtual gamepad cursor: `res://scripts/input/virtual_cursor.gd`
- Responsive UI: compact phone, balanced desktop/tablet, and wide/foldable layouts
- Controls/deployment notes: `docs/controls-and-deployment.md`
- Visual novel data notes: `docs/visual-novel-data.md`

## Input Devices

Gameplay should use `InputRouter` signals instead of checking mouse, touch, keyboard, or gamepad events directly.

- Mouse: point, left click, right click
- Touch: tap and drag
- Keyboard: WASD/arrows, Space/Enter/E, Esc/Q, Tab/N, P
- Gamepad: sticks, A, B, X, Start, shoulder buttons

## Run

Open the project in Godot 4.6 or newer and run the main scene.

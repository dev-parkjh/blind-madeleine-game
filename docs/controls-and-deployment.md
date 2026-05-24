# Controls and Deployment

## Input Model

The game uses `InputRouter` as an autoload singleton. Gameplay code should listen for semantic signals instead of checking devices directly.

- `primary_pressed(position, scheme)`: mouse click or touch tap.
- `secondary_pressed(position, scheme)`: right click.
- `action_pressed(action, scheme)`: `interact`, `back`, `notebook`, `pause`, `focus_next`, `focus_previous`.
- `pointer_moved(position, scheme)`: mouse movement or touch drag.
- `input_scheme_changed(scheme)`: `mouse_keyboard`, `touch`, or `gamepad`.
- `input_mode_changed(mode)`: `mouse`, `touch`, `keyboard`, or `gamepad`.

Default bindings are installed by `InputRouter` at runtime:

- Mouse: left click interact, right click back.
- Touch: tap interact, drag pointer.
- Keyboard: WASD/arrow movement, Space/Enter/E interact, Esc/Q back, Tab/N notebook, P pause.
- Gamepad: left or right stick/D-pad focus navigation, A interact, B back, X notebook, Start pause, shoulders focus previous/next.

## Project Settings

The project is configured for a scalable 1280x720 reference canvas:

- `display/window/size/resizable = true`
- `display/window/size/min_width = 360`
- `display/window/size/min_height = 540`
- `display/window/stretch/mode = canvas_items`
- `display/window/stretch/aspect = expand`
- renderer uses the mobile rendering path for broad desktop/mobile compatibility

## Responsive Layout

The main scene updates its layout whenever the viewport size changes.

- Compact phone-like screens stack evidence and detail panels vertically.
- Balanced desktop/tablet screens use a two-column evidence grid and a side detail panel.
- Wide or foldable-like screens use a three-column evidence grid and a wider detail panel.
- Runtime margins combine proportional spacing with mobile safe-area insets when available.

## Export Targets

Use Godot's Export window to add presets for:

- Windows Desktop
- macOS
- Linux/X11
- Android
- iOS, from macOS with Apple signing configured

For mobile builds, keep touch targets at least 64px high and test both portrait-safe and landscape-safe layouts before release. For PC builds, test keyboard-only and controller-only navigation before packaging.

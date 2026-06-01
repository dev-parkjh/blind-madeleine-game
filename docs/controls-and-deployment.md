# Controls and Deployment

## Input Model

The game uses `InputRouter` as an autoload singleton. Gameplay code should listen for semantic signals instead of checking devices directly.

- `primary_pressed(position, scheme)`: mouse click or touch tap.
- `secondary_pressed(position, scheme)`: right click.
- `action_pressed(action, scheme)`: `interact`, `skip`, `auto`, `log`, `tree`, `menu`, `back`, `connect_mode`, `notebook`, `pause`, `focus_next`, `focus_previous`.
- `pointer_moved(position, scheme)`: mouse movement or touch drag.
- `input_scheme_changed(scheme)`: `mouse_keyboard`, `touch`, or `gamepad`.
- `input_mode_changed(mode)`: `mouse`, `touch`, `keyboard`, or `gamepad`.

Default bindings are installed by `InputRouter` at runtime:

- Mouse: left click interact, right click back.
- Touch: tap interact, drag pointer.
- Keyboard: WASD/arrow movement, Space/Enter interact, Space hold auto, R statement present mode, Ctrl skip, F auto, Shift log, Tab tree, Esc menu, Q back, N notebook, P pause.
- Gamepad: left or right stick/D-pad focus navigation, A interact/hold auto, RB statement present mode, LB skip, X auto, Y log, Select tree, Menu/Start menu/pause, B back, shoulders focus previous/next.

When input comes from a different mode than the current one, that event is consumed globally as a mode switch. The next input from the same mode performs the gameplay/UI action.

Touch uses `InputEventScreenTouch` / `InputEventScreenDrag`. Real mouse uses `InputEventMouse*` with a non-emulated device id. Godot may still generate emulated mouse events for UI `Button` widgets when `emulate_mouse_from_touch` is enabled; `InputRouter` ignores those for mode switching and gameplay routing.

## Project Settings

The project is configured for a scalable 1920x1080 reference canvas:

- `display/window/size/viewport_width = 1920`
- `display/window/size/viewport_height = 1080`
- `display/window/size/resizable = true`
- `display/window/size/min_width = 540`
- `display/window/size/min_height = 810`
- `display/window/stretch/mode = canvas_items`
- `display/window/stretch/aspect = expand`
- renderer uses the mobile rendering path for broad desktop/mobile compatibility

Higher-resolution displays (including 4K) scale up from the 1080p design canvas automatically. VN backgrounds and character art should be authored at 1920x1080 or higher source resolution.

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
- Web
- Android
- iOS, from macOS with Apple signing configured

The Web preset exports to `build/web/index.html`. It uses the Compatibility renderer through the `renderer/rendering_method.web` project override, disables thread support for easier hosting, and includes runtime JSON data under `data/`.

Install Godot export templates that match the editor version before exporting. In Godot, use `Editor > Manage Export Templates`.

Command-line Web export:

```sh
mkdir -p build/web
godot --headless --path . --export-release Web build/web/index.html
```

Serve the generated `build/web` directory from a static web server. Keep the generated `.html`, `.js`, `.wasm`, `.pck`, and icon/splash files together.

Local Web server:

```sh
tools/serve_web_build.sh
```

On Windows:

```bat
tools\serve_web_build.bat
```

Use `WEB_BUILD_PORT=9000 tools/serve_web_build.sh` or `tools/serve_web_build.sh --port 9000` to change the port.

For mobile builds, keep touch targets at least 96px high and test both portrait-safe and landscape-safe layouts before release. For PC builds, test keyboard-only and controller-only navigation before packaging. On 4K displays, UI scales up from the 1080p reference canvas via `canvas_items` stretch.

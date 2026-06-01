extends Control

signal requested_screen_change(screen_id: String, payload: Dictionary)
signal requested_overlay(screen_id: String, payload: Dictionary)
signal close_requested

const INPUT_MODE_MOUSE := "mouse"
const INPUT_MODE_KEYBOARD := "keyboard"
const INPUT_MODE_GAMEPAD := "gamepad"
const MUI_ICON_DIR := "res://assets/icon/mui"

@export var screen_id := ""
@export var screen_title := ""
@export var skip_allowed := false

var setup_payload: Dictionary = {}
var _mui_icon_cache: Dictionary = {}
var _navigation_focus_enabled := false
var _preferred_focus_control: Control
var _managed_focus_modes: Dictionary = {}
var _managed_mouse_filters: Dictionary = {}
var _pointer_hover_disabled_buttons: Dictionary = {}


func _enter_tree() -> void:
	var input_router := _get_input_router()
	var callback := Callable(self, "_on_input_mode_changed")
	if input_router != null and input_router.has_signal("input_mode_changed") and not input_router.is_connected("input_mode_changed", callback):
		input_router.connect("input_mode_changed", callback)


func _exit_tree() -> void:
	var input_router := _get_input_router()
	var callback := Callable(self, "_on_input_mode_changed")
	if input_router != null and input_router.has_signal("input_mode_changed") and input_router.is_connected("input_mode_changed", callback):
		input_router.disconnect("input_mode_changed", callback)


func setup(payload: Dictionary = {}) -> void:
	setup_payload = payload


func _notification(what: int) -> void:
	if what == NOTIFICATION_READY:
		call_deferred("_suppress_native_tooltips")
		call_deferred("refresh_pointer_hover_mode")


func _input(event: InputEvent) -> void:
	if _should_ignore_gameplay_event(event):
		return

	if _is_pointer_input_event(event):
		_suppress_native_tooltips()
		set_navigation_focus_enabled(false)
	elif _is_navigation_input_event(event):
		set_navigation_focus_enabled(true)


func request_screen_change(next_screen_id: String, payload: Dictionary = {}) -> void:
	requested_screen_change.emit(next_screen_id, payload)


func request_overlay(overlay_screen_id: String, payload: Dictionary = {}) -> void:
	requested_overlay.emit(overlay_screen_id, payload)


func request_close() -> void:
	close_requested.emit()


func make_full_rect() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	size_flags_horizontal = Control.SIZE_EXPAND_FILL
	size_flags_vertical = Control.SIZE_EXPAND_FILL


func set_preferred_focus_control(control: Control) -> void:
	_preferred_focus_control = control
	if _is_navigation_input_mode_active():
		set_navigation_focus_enabled(true)
	else:
		refresh_input_focus_mode()


func refresh_input_focus_mode() -> void:
	_apply_focus_mode_to_tree(self)


func refresh_pointer_hover_mode() -> void:
	_suppress_native_tooltips()
	_apply_pointer_hover_mode_to_tree(self)


func is_pointer_hover_enabled() -> bool:
	return _get_current_input_mode() == INPUT_MODE_MOUSE


func _suppress_native_tooltips() -> void:
	_clear_tooltips_in_tree(self)


func _clear_tooltips_in_tree(node: Node) -> void:
	if node is Control:
		var control := node as Control
		if not control.tooltip_text.is_empty():
			control.tooltip_text = ""

	for child in node.get_children():
		_clear_tooltips_in_tree(child)


func set_navigation_focus_enabled(enabled: bool) -> void:
	if _navigation_focus_enabled == enabled:
		if enabled:
			_grab_navigation_focus()
		return

	_navigation_focus_enabled = enabled
	refresh_input_focus_mode()

	if _navigation_focus_enabled:
		_grab_navigation_focus()
	else:
		var focus_owner := get_viewport().gui_get_focus_owner()
		if focus_owner != null and is_ancestor_of(focus_owner):
			focus_owner.release_focus()


func _is_pointer_input_event(event: InputEvent) -> bool:
	return event is InputEventMouseMotion \
		or event is InputEventMouseButton


func _is_navigation_input_event(event: InputEvent) -> bool:
	if event is InputEventKey:
		return event.pressed and not event.echo
	if event is InputEventJoypadButton:
		return event.pressed
	if event is InputEventJoypadMotion:
		return absf(event.axis_value) > _get_gamepad_deadzone()
	return false


func _is_navigation_input_mode_active() -> bool:
	var current_mode := _get_current_input_mode()
	return current_mode == INPUT_MODE_KEYBOARD \
		or current_mode == INPUT_MODE_GAMEPAD


func _get_input_router() -> Node:
	return get_node_or_null("/root/InputRouter")


func _should_ignore_gameplay_event(event: InputEvent) -> bool:
	var input_router := _get_input_router()
	if input_router == null or not input_router.has_method("should_ignore_gameplay_event"):
		return false
	return bool(input_router.call("should_ignore_gameplay_event", event))


func _get_current_input_mode() -> String:
	var input_router := _get_input_router()
	if input_router == null:
		return ""
	return String(input_router.get("current_mode"))


func _get_gamepad_deadzone() -> float:
	var input_router := _get_input_router()
	if input_router == null:
		return 0.18
	return float(input_router.get("gamepad_deadzone"))


func _get_mui_icon(icon_name: String, target_height: int = 24, color: Color = Color.WHITE) -> Texture2D:
	if icon_name.is_empty():
		return null

	var file_name := icon_name if icon_name.ends_with(".svg") else "%s.svg" % icon_name
	var height := target_height if target_height > 0 else 24
	var color_key := color.to_html(true)
	var cache_key := "%s:%d:%s" % [file_name, height, color_key]
	if not _mui_icon_cache.has(cache_key):
		_mui_icon_cache[cache_key] = _load_mui_icon_texture(file_name, height, color)
	return _mui_icon_cache[cache_key] as Texture2D


func _load_mui_icon_texture(file_name: String, target_height: int, color: Color) -> Texture2D:
	var path := "%s/%s" % [MUI_ICON_DIR, file_name]
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return _load_imported_mui_icon_texture(path, target_height, color)

	var svg_text := _apply_svg_root_fill(file.get_as_text(), color)
	var image := Image.new()
	var scale := float(target_height) / 24.0
	var err := image.load_svg_from_string(svg_text, scale)
	if err != OK:
		return _load_imported_mui_icon_texture(path, target_height, color)

	return ImageTexture.create_from_image(image)


func _load_imported_mui_icon_texture(path: String, target_height: int, color: Color) -> Texture2D:
	var source_texture := load(path) as Texture2D
	if source_texture == null:
		return null

	var image := source_texture.get_image()
	if image == null:
		return source_texture

	image.convert(Image.FORMAT_RGBA8)
	if target_height > 0 and image.get_width() > 0 and image.get_height() > 0:
		var target_width := maxi(1, int(round(float(target_height) * float(image.get_width()) / float(image.get_height()))))
		image.resize(target_width, target_height, Image.INTERPOLATE_LANCZOS)

	for y in range(image.get_height()):
		for x in range(image.get_width()):
			var pixel := image.get_pixel(x, y)
			if pixel.a > 0.0:
				image.set_pixel(x, y, Color(color.r, color.g, color.b, pixel.a * color.a))

	return ImageTexture.create_from_image(image)


func _apply_svg_root_fill(svg_text: String, color: Color) -> String:
	var svg_tag_end := svg_text.find(">")
	if svg_tag_end < 0:
		return svg_text

	var svg_tag := svg_text.substr(0, svg_tag_end)
	if svg_tag.contains(" fill="):
		return svg_text

	var fill_color := "#%s" % color.to_html(false)
	return svg_text.replace("<svg ", '<svg fill="%s" ' % fill_color)


func _apply_focus_mode_to_tree(node: Node) -> void:
	for child in node.get_children():
		if child is Control:
			var control := child as Control
			_apply_focus_mode(control)
			_apply_focus_mode_to_tree(control)


func _apply_focus_mode(control: Control) -> void:
	if control.focus_mode == Control.FOCUS_NONE and not _managed_focus_modes.has(control.get_instance_id()):
		return

	if not _managed_focus_modes.has(control.get_instance_id()):
		_managed_focus_modes[control.get_instance_id()] = control.focus_mode
		_managed_mouse_filters[control.get_instance_id()] = control.mouse_filter

	var original_focus_mode: int = _managed_focus_modes[control.get_instance_id()]
	var original_mouse_filter: int = _managed_mouse_filters[control.get_instance_id()]
	control.focus_mode = original_focus_mode if _navigation_focus_enabled else Control.FOCUS_NONE
	control.mouse_filter = Control.MOUSE_FILTER_IGNORE if _navigation_focus_enabled else original_mouse_filter


func _apply_pointer_hover_mode_to_tree(node: Node) -> void:
	for child in node.get_children():
		if child is BaseButton:
			_apply_pointer_hover_mode(child as BaseButton)
		if child is Node:
			_apply_pointer_hover_mode_to_tree(child)


func _apply_pointer_hover_mode(button: BaseButton) -> void:
	if not is_instance_valid(button):
		return

	var button_id := button.get_instance_id()

	if is_pointer_hover_enabled():
		if _pointer_hover_disabled_buttons.has(button_id):
			button.remove_theme_stylebox_override("hover")
			button.remove_theme_color_override("font_hover")
			_pointer_hover_disabled_buttons.erase(button_id)
		return

	if _pointer_hover_disabled_buttons.has(button_id):
		return

	var normal_style := button.get_theme_stylebox("normal")
	if normal_style != null:
		button.add_theme_stylebox_override("hover", normal_style)
	button.add_theme_color_override("font_hover", button.get_theme_color("font_color"))
	_pointer_hover_disabled_buttons[button_id] = true


func _grab_navigation_focus() -> void:
	var focus_owner := get_viewport().gui_get_focus_owner()
	if _is_focus_candidate(focus_owner):
		return

	var target := _get_navigation_focus_target()
	if target != null:
		target.grab_focus()


func _get_navigation_focus_target() -> Control:
	if _is_focus_candidate(_preferred_focus_control):
		return _preferred_focus_control
	return _find_first_focus_candidate(self)


func _find_first_focus_candidate(node: Node) -> Control:
	for child in node.get_children():
		if child is Control:
			var control := child as Control
			if _is_focus_candidate(control):
				return control

			var nested := _find_first_focus_candidate(control)
			if nested != null:
				return nested
	return null


func _is_focus_candidate(control: Variant) -> bool:
	if control == null or not is_instance_valid(control):
		return false

	if not control is Control:
		return false

	var focus_control := control as Control
	if not is_ancestor_of(focus_control):
		return false
	if not focus_control.is_visible_in_tree():
		return false
	if focus_control.focus_mode == Control.FOCUS_NONE:
		return false
	if focus_control is BaseButton and (focus_control as BaseButton).disabled:
		return false
	return true


func _on_input_mode_changed(_mode: String) -> void:
	call_deferred("_sync_navigation_focus_to_input_mode")


func _sync_navigation_focus_to_input_mode() -> void:
	set_navigation_focus_enabled(_is_navigation_input_mode_active())
	refresh_pointer_hover_mode()

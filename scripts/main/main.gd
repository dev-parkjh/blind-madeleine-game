extends Control

const APP_FONT := preload("res://assets/fonts/PretendardVariable.ttf")
const INPUT_MODE_MOUSE := "mouse"
const INPUT_MODE_TOUCH := "touch"
const INPUT_MODE_KEYBOARD := "keyboard"
const INPUT_MODE_GAMEPAD := "gamepad"

const SCREEN_SCENES := {
	"main_title": preload("res://scenes/screens/main_title_screen.tscn"),
	"chapter_select": preload("res://scenes/screens/chapter_select_screen.tscn"),
	"story_dialogue": preload("res://scenes/screens/story_dialogue_screen.tscn"),
	"statement": preload("res://scenes/screens/statement_screen.tscn"),
	"backlog": preload("res://scenes/screens/backlog_screen.tscn"),
	"branch_tree": preload("res://scenes/screens/branch_tree_screen.tscn"),
}

var _safe_area: MarginContainer
var _screen_root: Control
var _overlay_root: Control
var _input_mode_toast: Label
var _input_mode_toast_tween: Tween
var _current_screen: Control


func _ready() -> void:
	_apply_app_theme()
	_build_shell()
	_connect_input_router()
	get_viewport().size_changed.connect(_apply_safe_area_margins)
	call_deferred("_apply_safe_area_margins")
	call_deferred("show_screen", "main_title")


func show_screen(screen_id: String, payload: Dictionary = {}) -> void:
	if not SCREEN_SCENES.has(screen_id):
		push_warning("Unknown screen id: %s" % screen_id)
		return

	if _current_screen != null:
		_current_screen.queue_free()
		_current_screen = null

	var scene: PackedScene = SCREEN_SCENES[screen_id]
	var instance := scene.instantiate()
	if not instance is Control:
		push_warning("Screen root must be a Control: %s" % screen_id)
		instance.queue_free()
		return

	_current_screen = instance
	_current_screen.set_anchors_preset(Control.PRESET_FULL_RECT)
	_screen_root.add_child(_current_screen)

	if _current_screen.has_method("setup"):
		_current_screen.call("setup", payload)
	if _current_screen.has_signal("requested_screen_change"):
		_current_screen.connect("requested_screen_change", Callable(self, "_on_screen_change_requested"))
	if _current_screen.has_signal("requested_overlay"):
		_current_screen.connect("requested_overlay", Callable(self, "_on_overlay_requested"))


func show_overlay(screen_id: String, payload: Dictionary = {}) -> void:
	if not SCREEN_SCENES.has(screen_id):
		push_warning("Unknown overlay id: %s" % screen_id)
		return

	clear_overlay()
	_set_current_screen_input_enabled(false)

	var scene: PackedScene = SCREEN_SCENES[screen_id]
	var instance := scene.instantiate()
	if not instance is Control:
		push_warning("Overlay root must be a Control: %s" % screen_id)
		instance.queue_free()
		return

	var overlay := instance as Control
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	_overlay_root.add_child(overlay)

	if overlay.has_method("setup"):
		overlay.call("setup", payload)
	if overlay.has_signal("close_requested"):
		overlay.connect("close_requested", Callable(self, "clear_overlay"))
	if overlay.has_signal("requested_screen_change"):
		overlay.connect("requested_screen_change", Callable(self, "_on_overlay_screen_change_requested"))
	if overlay.has_signal("requested_overlay"):
		overlay.connect("requested_overlay", Callable(self, "_on_overlay_requested"))


func clear_overlay() -> void:
	for child in _overlay_root.get_children():
		child.queue_free()
	_set_current_screen_input_enabled(true)


func _set_current_screen_input_enabled(enabled: bool) -> void:
	if _current_screen == null:
		return

	_current_screen.set_process_input(enabled)
	_current_screen.set_process_unhandled_input(enabled)


func _apply_app_theme() -> void:
	var app_theme := Theme.new()
	app_theme.set_default_font(APP_FONT)
	theme = app_theme


func _build_shell() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)

	var background := ColorRect.new()
	background.name = "Background"
	background.color = Color(0.055, 0.052, 0.047)
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	_safe_area = MarginContainer.new()
	_safe_area.name = "SafeArea"
	_safe_area.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_safe_area)

	_screen_root = Control.new()
	_screen_root.name = "ScreenRoot"
	_screen_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	_safe_area.add_child(_screen_root)

	_overlay_root = Control.new()
	_overlay_root.name = "OverlayRoot"
	_overlay_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_overlay_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_overlay_root)

	_input_mode_toast = Label.new()
	_input_mode_toast.name = "InputModeToast"
	_input_mode_toast.visible = false
	_input_mode_toast.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_input_mode_toast.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_input_mode_toast.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_input_mode_toast.add_theme_font_size_override("font_size", 27)
	_input_mode_toast.add_theme_color_override("font_color", Color(0.92, 0.9, 0.84))
	_input_mode_toast.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.8))
	_input_mode_toast.add_theme_constant_override("shadow_offset_x", 0)
	_input_mode_toast.add_theme_constant_override("shadow_offset_y", 3)
	_input_mode_toast.anchor_left = 0.0
	_input_mode_toast.anchor_right = 1.0
	_input_mode_toast.anchor_top = 0.0
	_input_mode_toast.anchor_bottom = 0.0
	_input_mode_toast.offset_left = 0.0
	_input_mode_toast.offset_right = 0.0
	_input_mode_toast.offset_top = 30.0
	_input_mode_toast.offset_bottom = 84.0
	add_child(_input_mode_toast)


func _connect_input_router() -> void:
	var input_router := get_node_or_null("/root/InputRouter")
	var callback := Callable(self, "_on_input_mode_changed")
	if input_router != null and input_router.has_signal("input_mode_changed") and not input_router.is_connected("input_mode_changed", callback):
		input_router.connect("input_mode_changed", callback)


func _apply_safe_area_margins() -> void:
	if _safe_area == null:
		return

	var viewport_size := get_viewport().get_visible_rect().size
	var compact := viewport_size.x < 1140.0 or viewport_size.x < viewport_size.y * 0.92
	var safe_margins := _get_display_safe_margins(viewport_size)
	var base_x := clampf(viewport_size.x * (0.036 if compact else 0.026), 21.0, 54.0)
	var base_y := clampf(viewport_size.y * 0.032, 18.0, 45.0)
	var extra_safe_padding := 12.0

	_safe_area.add_theme_constant_override("margin_left", int(ceil(max(base_x, safe_margins.x + extra_safe_padding))))
	_safe_area.add_theme_constant_override("margin_top", int(ceil(max(base_y, safe_margins.y + extra_safe_padding))))
	_safe_area.add_theme_constant_override("margin_right", int(ceil(max(base_x, safe_margins.z + extra_safe_padding))))
	_safe_area.add_theme_constant_override("margin_bottom", int(ceil(max(base_y, safe_margins.w + extra_safe_padding))))

	if _input_mode_toast != null:
		var top_margin := int(ceil(max(base_y, safe_margins.y + extra_safe_padding)))
		_input_mode_toast.offset_top = top_margin
		_input_mode_toast.offset_bottom = top_margin + 54.0


func _get_display_safe_margins(viewport_size: Vector2) -> Vector4:
	if not OS.has_feature("mobile"):
		return Vector4(0, 0, 0, 0)

	var window_size := DisplayServer.window_get_size()
	var safe_area := DisplayServer.get_display_safe_area()
	if window_size.x <= 0 or window_size.y <= 0 or safe_area.size.x <= 0 or safe_area.size.y <= 0:
		return Vector4(0, 0, 0, 0)

	var scale := Vector2(viewport_size.x / float(window_size.x), viewport_size.y / float(window_size.y))
	var right := float(window_size.x - safe_area.position.x - safe_area.size.x) * scale.x
	var bottom := float(window_size.y - safe_area.position.y - safe_area.size.y) * scale.y
	return Vector4(
		float(safe_area.position.x) * scale.x,
		float(safe_area.position.y) * scale.y,
		right,
		bottom
	)


func _on_input_mode_changed(mode: String) -> void:
	var toast_text := _get_input_mode_toast_text(mode)
	if toast_text.is_empty():
		return
	_show_input_mode_toast(toast_text)


func _get_input_mode_toast_text(mode: String) -> String:
	if OS.has_feature("mobile") and mode in [INPUT_MODE_TOUCH, INPUT_MODE_MOUSE]:
		return ""

	match mode:
		INPUT_MODE_MOUSE:
			return "마우스 감지됨"
		INPUT_MODE_TOUCH:
			return "터치 감지됨"
		INPUT_MODE_KEYBOARD:
			return "키보드 감지됨"
		INPUT_MODE_GAMEPAD:
			return "컨트롤러 감지됨"
		_:
			return ""


func _show_input_mode_toast(text: String) -> void:
	if _input_mode_toast_tween != null:
		_input_mode_toast_tween.kill()

	_input_mode_toast.text = text
	_input_mode_toast.visible = true
	_input_mode_toast.modulate.a = 0.0

	_input_mode_toast_tween = create_tween()
	_input_mode_toast_tween.tween_property(_input_mode_toast, "modulate:a", 1.0, 0.12)
	_input_mode_toast_tween.tween_interval(1.0)
	_input_mode_toast_tween.tween_property(_input_mode_toast, "modulate:a", 0.0, 0.22)
	_input_mode_toast_tween.tween_callback(func() -> void:
		_input_mode_toast.visible = false
	)


func _on_screen_change_requested(screen_id: String, payload: Dictionary) -> void:
	show_screen(screen_id, payload)


func _on_overlay_requested(screen_id: String, payload: Dictionary) -> void:
	show_overlay(screen_id, payload)


func _on_overlay_screen_change_requested(screen_id: String, payload: Dictionary) -> void:
	clear_overlay()
	show_screen(screen_id, payload)

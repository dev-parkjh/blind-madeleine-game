extends Control

const VirtualCursor := preload("res://scripts/input/virtual_cursor.gd")

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
var _cursor: ColorRect
var _current_screen: Control


func _ready() -> void:
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


func show_overlay(screen_id: String, payload: Dictionary = {}) -> void:
	if not SCREEN_SCENES.has(screen_id):
		push_warning("Unknown overlay id: %s" % screen_id)
		return

	clear_overlay()

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


func clear_overlay() -> void:
	for child in _overlay_root.get_children():
		child.queue_free()


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

	_cursor = VirtualCursor.new()
	_cursor.name = "VirtualCursor"
	add_child(_cursor)


func _connect_input_router() -> void:
	InputRouter.input_scheme_changed.connect(_update_cursor_visibility)
	InputRouter.pointer_moved.connect(_on_pointer_moved)
	_update_cursor_visibility(InputRouter.current_scheme)


func _apply_safe_area_margins() -> void:
	if _safe_area == null:
		return

	var viewport_size := get_viewport().get_visible_rect().size
	var compact := viewport_size.x < 760.0 or viewport_size.x < viewport_size.y * 0.92
	var safe_margins := _get_display_safe_margins(viewport_size)
	var base_x := clampf(viewport_size.x * (0.036 if compact else 0.026), 14.0, 36.0)
	var base_y := clampf(viewport_size.y * 0.032, 12.0, 30.0)
	var extra_safe_padding := 8.0

	_safe_area.add_theme_constant_override("margin_left", int(ceil(max(base_x, safe_margins.x + extra_safe_padding))))
	_safe_area.add_theme_constant_override("margin_top", int(ceil(max(base_y, safe_margins.y + extra_safe_padding))))
	_safe_area.add_theme_constant_override("margin_right", int(ceil(max(base_x, safe_margins.z + extra_safe_padding))))
	_safe_area.add_theme_constant_override("margin_bottom", int(ceil(max(base_y, safe_margins.w + extra_safe_padding))))


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


func _update_cursor_visibility(scheme: String) -> void:
	_cursor.visible = scheme == InputRouter.SCHEME_GAMEPAD
	if _cursor.visible:
		_cursor.set_cursor_position(InputRouter.pointer_position)


func _on_pointer_moved(position: Vector2, scheme: String) -> void:
	if scheme == InputRouter.SCHEME_GAMEPAD:
		_cursor.visible = true
		_cursor.set_cursor_position(position)


func _on_screen_change_requested(screen_id: String, payload: Dictionary) -> void:
	show_screen(screen_id, payload)

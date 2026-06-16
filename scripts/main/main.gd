extends Control

const APP_FONT := preload("res://assets/fonts/PretendardJPVariable.ttf")
const INPUT_MODE_MOUSE := "mouse"
const INPUT_MODE_KEYBOARD := "keyboard"
const INPUT_MODE_GAMEPAD := "gamepad"

const MobileLayout = preload("res://scripts/ui/mobile_layout.gd")
const SCROLLING_GRID_BACKGROUND_SCRIPT: Script = preload("res://scripts/visual_novel/scrolling_grid_background.gd")

const SCREEN_SCENES := {
	"main_title": preload("res://scenes/screens/main_title_screen.tscn"),
	"options": preload("res://scenes/screens/options_screen.tscn"),
	"chapter_select": preload("res://scenes/screens/chapter_select_screen.tscn"),
	"story_dialogue": preload("res://scenes/screens/story_dialogue_screen.tscn"),
	"statement": preload("res://scenes/screens/statement_screen.tscn"),
	"backlog": preload("res://scenes/screens/backlog_screen.tscn"),
	"debug_dialogue": preload("res://scenes/screens/debug_dialogue_screen.tscn"),
	"branch_tree": preload("res://scenes/screens/branch_tree_screen.tscn"),
}

const EDITOR_PREVIEW_DIALOGUE_ARGS := [
	"--editor-preview-dialogue",
	"--preview-dialogue",
]
const EDITOR_PREVIEW_NODE_ARGS := [
	"--editor-preview-node",
	"--preview-node",
]
const NEW_GAME_BLACKOUT_FADE_IN_DURATION := 0.12
const NEW_GAME_BLACKOUT_FADE_OUT_DURATION := 0.36
const NEW_GAME_BLACKOUT_READY_TIMEOUT := 1.0
const WEB_EDITOR_PREVIEW_POLL_INTERVAL := 0.18

var _story_grid_background: ScrollingGridBackground
var _screen_root: Control
var _overlay_root: Control
var _input_mode_toast: Label
var _input_mode_toast_tween: Tween
var _current_screen: Control
var _web_portrait_blocker: Control
var _web_portrait_notice_panel: PanelContainer
var _web_portrait_notice_margin: MarginContainer
var _web_portrait_notice_content: VBoxContainer
var _web_portrait_notice_title: Label
var _web_portrait_notice_body: Label
var _web_portrait_notice_fullscreen_button: Button
var _web_portrait_notice_unsupported_label: Label
var _new_game_blackout_overlay: ColorRect
var _new_game_blackout_tween: Tween
var _content_safe_rect := Rect2(Vector2.ZERO, MobileLayout.REFERENCE_VIEWPORT_SIZE)
var _web_editor_preview_last_seq := 0
var _web_editor_preview_poll_elapsed := 0.0


func _ready() -> void:
	_schedule_android_virtual_keyboard_hide()
	_apply_app_theme()
	_build_shell()
	_connect_input_router()
	get_viewport().size_changed.connect(_on_viewport_size_changed)
	call_deferred("_on_viewport_size_changed")
	if WebDisplayBridge.is_web():
		WebDisplayBridge.install_editor_preview_message_listener()
		set_process(true)
	var editor_preview_payload := _read_editor_preview_payload()
	if editor_preview_payload.is_empty():
		call_deferred("show_screen", "main_title")
	else:
		call_deferred("_show_editor_preview_payload", editor_preview_payload)


func _process(delta: float) -> void:
	if not WebDisplayBridge.is_web():
		return
	_web_editor_preview_poll_elapsed += delta
	if _web_editor_preview_poll_elapsed < WEB_EDITOR_PREVIEW_POLL_INTERVAL:
		return
	_web_editor_preview_poll_elapsed = 0.0
	_poll_web_editor_preview_message()


func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_RESUMED or what == NOTIFICATION_APPLICATION_FOCUS_IN:
		_schedule_android_virtual_keyboard_hide()


func _schedule_android_virtual_keyboard_hide() -> void:
	if not OS.has_feature("android"):
		return

	_hide_android_virtual_keyboard()
	call_deferred("_hide_android_virtual_keyboard")


func _hide_android_virtual_keyboard() -> void:
	if not OS.has_feature("android"):
		return

	var focus_owner := get_viewport().gui_get_focus_owner()
	if focus_owner is LineEdit or focus_owner is TextEdit:
		focus_owner.release_focus()
	DisplayServer.virtual_keyboard_hide()


func show_screen(screen_id: String, payload: Dictionary = {}) -> void:
	if not SCREEN_SCENES.has(screen_id):
		push_warning("Unknown screen id: %s" % screen_id)
		return

	var screen_payload := payload.duplicate()
	var use_new_game_blackout := bool(screen_payload.get("new_game_blackout", false))
	var blackout_fade_in_duration := maxf(
		0.0,
		float(screen_payload.get("new_game_blackout_fade_in_duration", NEW_GAME_BLACKOUT_FADE_IN_DURATION))
	)
	var blackout_fade_out_duration := maxf(
		0.0,
		float(screen_payload.get("new_game_blackout_fade_out_duration", NEW_GAME_BLACKOUT_FADE_OUT_DURATION))
	)
	screen_payload.erase("new_game_blackout")
	screen_payload.erase("new_game_blackout_fade_in_duration")
	screen_payload.erase("new_game_blackout_fade_out_duration")
	if use_new_game_blackout:
		await _fade_new_game_blackout_in(blackout_fade_in_duration)
		await get_tree().process_frame

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
	if _current_screen.has_method("setup"):
		_current_screen.call("setup", screen_payload)
	_screen_root.add_child(_current_screen)
	_update_story_grid_visibility(screen_id)
	if screen_id == "story_dialogue" and _current_screen.has_method("sync_story_grid_background_immediate"):
		_current_screen.call("sync_story_grid_background_immediate")

	if _current_screen.has_signal("requested_screen_change"):
		_current_screen.connect("requested_screen_change", Callable(self, "_on_screen_change_requested"))
	if _current_screen.has_signal("requested_overlay"):
		_current_screen.connect("requested_overlay", Callable(self, "_on_overlay_requested"))

	if use_new_game_blackout:
		await _wait_for_new_game_blackout_reveal_ready(_current_screen)
		_fade_new_game_blackout_out(blackout_fade_out_duration)

	_sync_current_screen_interactivity()


func show_overlay(screen_id: String, payload: Dictionary = {}) -> void:
	if not SCREEN_SCENES.has(screen_id):
		push_warning("Unknown overlay id: %s" % screen_id)
		return

	clear_overlay()
	_set_current_screen_input_enabled(false)
	_set_current_screen_overlay_obscured(true)

	var scene: PackedScene = SCREEN_SCENES[screen_id]
	var instance := scene.instantiate()
	if not instance is Control:
		push_warning("Overlay root must be a Control: %s" % screen_id)
		instance.queue_free()
		return

	var overlay := instance as Control
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	if overlay.has_method("setup"):
		overlay.call("setup", payload)
	_overlay_root.add_child(overlay)

	if overlay.has_signal("close_requested"):
		overlay.connect("close_requested", Callable(self, "clear_overlay"))
	if overlay.has_signal("requested_screen_change"):
		overlay.connect("requested_screen_change", Callable(self, "_on_overlay_screen_change_requested"))
	if overlay.has_signal("requested_overlay"):
		overlay.connect("requested_overlay", Callable(self, "_on_overlay_requested"))
	_sync_current_screen_interactivity()


func clear_overlay() -> void:
	for child in _overlay_root.get_children():
		child.queue_free()
	_sync_current_screen_interactivity()


func _set_current_screen_input_enabled(enabled: bool) -> void:
	if _current_screen == null:
		return

	_current_screen.set_process_input(enabled)
	_current_screen.set_process_unhandled_input(enabled)


func _set_current_screen_overlay_obscured(obscured: bool) -> void:
	if _current_screen == null:
		return

	if _current_screen.has_method("set_overlay_obscured"):
		_current_screen.call("set_overlay_obscured", obscured)


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

	_story_grid_background = SCROLLING_GRID_BACKGROUND_SCRIPT.new()
	_story_grid_background.name = "StoryGridBackground"
	_story_grid_background.visible = false
	_story_grid_background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_story_grid_background)

	_screen_root = Control.new()
	_screen_root.name = "ScreenRoot"
	_screen_root.set_anchors_preset(Control.PRESET_TOP_LEFT)
	_screen_root.clip_contents = true
	_screen_root.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_screen_root.size_flags_vertical = Control.SIZE_EXPAND_FILL
	add_child(_screen_root)

	_overlay_root = Control.new()
	_overlay_root.name = "OverlayRoot"
	_overlay_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_overlay_root.set_anchors_preset(Control.PRESET_TOP_LEFT)
	_overlay_root.clip_contents = true
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

	_build_new_game_blackout_overlay()
	_build_web_portrait_blocker()
	_apply_content_safe_area_layout()


func _connect_input_router() -> void:
	var input_router := get_node_or_null("/root/InputRouter")
	var callback := Callable(self, "_on_input_mode_changed")
	if input_router != null and input_router.has_signal("input_mode_changed") and not input_router.is_connected("input_mode_changed", callback):
		input_router.connect("input_mode_changed", callback)


func _on_viewport_size_changed() -> void:
	_apply_content_safe_area_layout()
	_apply_story_grid_layout()
	_update_web_portrait_blocker()


func _apply_content_safe_area_layout() -> void:
	var viewport_size := get_viewport().get_visible_rect().size
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		viewport_size = MobileLayout.REFERENCE_VIEWPORT_SIZE
	_content_safe_rect = MobileLayout.content_safe_rect(viewport_size)
	_apply_control_rect(_screen_root, _content_safe_rect)
	_apply_control_rect(_overlay_root, _content_safe_rect)


func _apply_control_rect(control: Control, rect: Rect2) -> void:
	if control == null:
		return

	control.set_anchors_preset(Control.PRESET_TOP_LEFT)
	control.offset_left = roundf(rect.position.x)
	control.offset_top = roundf(rect.position.y)
	control.offset_right = roundf(rect.position.x + rect.size.x)
	control.offset_bottom = roundf(rect.position.y + rect.size.y)


func get_story_grid_background() -> ScrollingGridBackground:
	return _story_grid_background


func _update_story_grid_visibility(screen_id: String) -> void:
	if _story_grid_background == null:
		return

	_story_grid_background.visible = screen_id == "story_dialogue"
	if _story_grid_background.visible:
		_apply_story_grid_layout()


func _apply_story_grid_layout() -> void:
	if _story_grid_background == null or not _story_grid_background.visible:
		return

	var viewport_size := get_viewport().get_visible_rect().size
	_story_grid_background.sync_stage(
		viewport_size,
		float(PortraitLayout.ZOOM_MIN),
		viewport_size * 0.5,
		float(PortraitLayout.ZOOM_MIN),
		false,
		viewport_size * 0.5,
		0.0,
		0,
		viewport_size * 0.5
	)


func _build_new_game_blackout_overlay() -> void:
	_new_game_blackout_overlay = ColorRect.new()
	_new_game_blackout_overlay.name = "NewGameBlackout"
	_new_game_blackout_overlay.color = Color.BLACK
	_new_game_blackout_overlay.visible = false
	_new_game_blackout_overlay.modulate.a = 0.0
	_new_game_blackout_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	_new_game_blackout_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_new_game_blackout_overlay)


func _fade_new_game_blackout_in(duration := NEW_GAME_BLACKOUT_FADE_IN_DURATION) -> void:
	if _new_game_blackout_overlay == null:
		return
	if _new_game_blackout_tween != null and _new_game_blackout_tween.is_valid():
		_new_game_blackout_tween.kill()

	_new_game_blackout_overlay.visible = true
	_new_game_blackout_overlay.modulate.a = 0.0
	_new_game_blackout_overlay.move_to_front()
	if _is_web_portrait_blocking():
		_web_portrait_blocker.move_to_front()
	_set_current_screen_input_enabled(false)

	if duration <= 0.0:
		_new_game_blackout_overlay.modulate.a = 1.0
		_new_game_blackout_tween = null
		return

	_new_game_blackout_tween = create_tween()
	_new_game_blackout_tween.set_ease(Tween.EASE_IN)
	_new_game_blackout_tween.set_trans(Tween.TRANS_SINE)
	_new_game_blackout_tween.tween_property(_new_game_blackout_overlay, "modulate:a", 1.0, duration)
	await _new_game_blackout_tween.finished
	_new_game_blackout_tween = null


func _fade_new_game_blackout_out(duration := NEW_GAME_BLACKOUT_FADE_OUT_DURATION) -> void:
	if _new_game_blackout_overlay == null:
		return
	if _new_game_blackout_tween != null and _new_game_blackout_tween.is_valid():
		_new_game_blackout_tween.kill()

	if duration <= 0.0:
		_new_game_blackout_overlay.modulate.a = 0.0
		_new_game_blackout_overlay.visible = false
		_new_game_blackout_tween = null
		_sync_current_screen_interactivity()
		return

	_new_game_blackout_tween = create_tween()
	_new_game_blackout_tween.set_ease(Tween.EASE_OUT)
	_new_game_blackout_tween.set_trans(Tween.TRANS_SINE)
	_new_game_blackout_tween.tween_property(_new_game_blackout_overlay, "modulate:a", 0.0, duration)
	_new_game_blackout_tween.tween_callback(func() -> void:
		_new_game_blackout_overlay.visible = false
		_new_game_blackout_tween = null
		_sync_current_screen_interactivity()
	)


func _wait_for_new_game_blackout_reveal_ready(screen: Control) -> void:
	if screen == null:
		await get_tree().process_frame
		return

	if not screen.has_method("is_chapter_display_ready"):
		await get_tree().process_frame
		return

	var timeout_msec := int(roundf(NEW_GAME_BLACKOUT_READY_TIMEOUT * 1000.0))
	var start_msec := Time.get_ticks_msec()
	while (
		is_instance_valid(screen)
		and _current_screen == screen
		and not bool(screen.call("is_chapter_display_ready"))
		and Time.get_ticks_msec() - start_msec < timeout_msec
	):
		await get_tree().process_frame

	await get_tree().process_frame


func _build_web_portrait_blocker() -> void:
	if not WebDisplayBridge.is_web():
		return

	_web_portrait_blocker = Control.new()
	_web_portrait_blocker.name = "WebPortraitBlocker"
	_web_portrait_blocker.visible = false
	_web_portrait_blocker.mouse_filter = Control.MOUSE_FILTER_STOP
	_web_portrait_blocker.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_web_portrait_blocker)

	var backdrop := ColorRect.new()
	backdrop.name = "Backdrop"
	backdrop.color = Color(0.02, 0.018, 0.015, 0.96)
	backdrop.mouse_filter = Control.MOUSE_FILTER_IGNORE
	backdrop.set_anchors_preset(Control.PRESET_FULL_RECT)
	_web_portrait_blocker.add_child(backdrop)

	var center := CenterContainer.new()
	center.name = "Center"
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	_web_portrait_blocker.add_child(center)

	var panel := PanelContainer.new()
	panel.name = "PortraitNoticePanel"
	_web_portrait_notice_panel = panel
	panel.custom_minimum_size = Vector2(960.0, 0.0)
	panel.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	panel.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	center.add_child(panel)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	_web_portrait_notice_margin = margin
	margin.add_theme_constant_override("margin_left", 48)
	margin.add_theme_constant_override("margin_top", 48)
	margin.add_theme_constant_override("margin_right", 48)
	margin.add_theme_constant_override("margin_bottom", 48)
	panel.add_child(margin)

	var content := VBoxContainer.new()
	content.name = "Content"
	_web_portrait_notice_content = content
	content.add_theme_constant_override("separation", 24)
	margin.add_child(content)

	var title := Label.new()
	title.name = "Title"
	_web_portrait_notice_title = title
	title.text = "가로 화면이 필요합니다"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	title.add_theme_font_size_override("font_size", 48)
	content.add_child(title)

	var body := Label.new()
	body.name = "Body"
	_web_portrait_notice_body = body
	body.text = "휴대폰을 가로로 돌린 뒤 계속 플레이해 주세요."
	body.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.add_theme_font_size_override("font_size", 30)
	content.add_child(body)

	if WebDisplayBridge.can_request_fullscreen_landscape():
		var fullscreen_button := Button.new()
		fullscreen_button.name = "FullscreenButton"
		_web_portrait_notice_fullscreen_button = fullscreen_button
		fullscreen_button.text = "전체화면으로 플레이"
		fullscreen_button.custom_minimum_size = Vector2(0.0, 96.0)
		fullscreen_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		fullscreen_button.add_theme_font_size_override("font_size", 30)
		fullscreen_button.pressed.connect(_on_web_fullscreen_pressed)
		content.add_child(fullscreen_button)
	else:
		var unsupported_label := Label.new()
		unsupported_label.name = "FullscreenUnsupportedNotice"
		_web_portrait_notice_unsupported_label = unsupported_label
		unsupported_label.text = "iPhone에서는 브라우저 전체화면 전환을 지원하지 않습니다."
		unsupported_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		unsupported_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		unsupported_label.add_theme_font_size_override("font_size", 24)
		unsupported_label.add_theme_color_override("font_color", Color(0.92, 0.9, 0.84, 0.72))
		content.add_child(unsupported_label)

	_apply_web_portrait_blocker_layout(get_viewport().get_visible_rect().size)


func _update_web_portrait_blocker() -> void:
	if _web_portrait_blocker == null:
		return

	var viewport_size := get_viewport().get_visible_rect().size
	var should_show: bool = WebDisplayBridge.should_block_mobile_portrait(viewport_size)
	if should_show:
		_apply_web_portrait_blocker_layout(viewport_size)
	if _web_portrait_blocker.visible == should_show:
		if should_show:
			_web_portrait_blocker.move_to_front()
		return

	_web_portrait_blocker.visible = should_show
	if should_show:
		_web_portrait_blocker.move_to_front()
	_sync_current_screen_interactivity()


func _on_web_fullscreen_pressed() -> void:
	WebDisplayBridge.request_fullscreen_landscape()


func _apply_web_portrait_blocker_layout(viewport_size: Vector2) -> void:
	if _web_portrait_notice_panel == null:
		return

	var safe_width := maxf(viewport_size.x, 1.0)
	var available_width := maxf(1.0, safe_width - maxf(64.0, safe_width * 0.08))
	var panel_width := minf(maxf(840.0, safe_width * 0.78), available_width)
	var margin_size := int(roundf(clampf(panel_width * 0.06, 48.0, 82.0)))
	var separation := int(roundf(clampf(panel_width * 0.035, 28.0, 48.0)))
	var title_size := int(roundf(clampf(panel_width * 0.075, 56.0, 86.0)))
	var body_size := int(roundf(clampf(panel_width * 0.046, 34.0, 52.0)))
	var support_size := int(roundf(clampf(panel_width * 0.038, 28.0, 42.0)))
	var button_size := int(roundf(clampf(panel_width * 0.13, 112.0, 152.0)))
	var button_font_size := int(roundf(clampf(panel_width * 0.04, 30.0, 44.0)))

	_web_portrait_notice_panel.custom_minimum_size = Vector2(panel_width, 0.0)
	if _web_portrait_notice_margin != null:
		_web_portrait_notice_margin.add_theme_constant_override("margin_left", margin_size)
		_web_portrait_notice_margin.add_theme_constant_override("margin_top", margin_size)
		_web_portrait_notice_margin.add_theme_constant_override("margin_right", margin_size)
		_web_portrait_notice_margin.add_theme_constant_override("margin_bottom", margin_size)
	if _web_portrait_notice_content != null:
		_web_portrait_notice_content.add_theme_constant_override("separation", separation)
	if _web_portrait_notice_title != null:
		_web_portrait_notice_title.add_theme_font_size_override("font_size", title_size)
	if _web_portrait_notice_body != null:
		_web_portrait_notice_body.add_theme_font_size_override("font_size", body_size)
	if _web_portrait_notice_fullscreen_button != null:
		_web_portrait_notice_fullscreen_button.custom_minimum_size = Vector2(0.0, button_size)
		_web_portrait_notice_fullscreen_button.add_theme_font_size_override("font_size", button_font_size)
	if _web_portrait_notice_unsupported_label != null:
		_web_portrait_notice_unsupported_label.add_theme_font_size_override("font_size", support_size)


func _sync_current_screen_interactivity() -> void:
	var blocked := _is_web_portrait_blocking() or _has_active_overlay() or _is_new_game_blackout_active()
	_set_current_screen_input_enabled(not blocked)
	_set_current_screen_overlay_obscured(blocked)


func _is_new_game_blackout_active() -> bool:
	return _new_game_blackout_overlay != null and _new_game_blackout_overlay.visible


func _is_web_portrait_blocking() -> bool:
	return _web_portrait_blocker != null and _web_portrait_blocker.visible


func _has_active_overlay() -> bool:
	if _overlay_root == null:
		return false

	for child in _overlay_root.get_children():
		if not child.is_queued_for_deletion():
			return true
	return false


func _on_input_mode_changed(mode: String) -> void:
	var toast_text := _get_input_mode_toast_text(mode)
	if toast_text.is_empty():
		return
	_show_input_mode_toast(toast_text)


func _get_input_mode_toast_text(mode: String) -> String:
	if OS.has_feature("mobile") and mode == INPUT_MODE_MOUSE:
		return ""

	match mode:
		INPUT_MODE_MOUSE:
			return "마우스 감지됨"
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


func _show_editor_preview_payload(payload: Dictionary) -> void:
	show_screen("story_dialogue", payload)
	WebDisplayBridge.notify_editor_preview_ready()


func _poll_web_editor_preview_message() -> void:
	var message_json := WebDisplayBridge.read_editor_preview_message_json()
	if message_json.is_empty():
		return
	var parsed: Variant = JSON.parse_string(message_json)
	if typeof(parsed) != TYPE_DICTIONARY:
		return
	var message: Dictionary = parsed
	var seq := int(message.get("seq", 0))
	if seq <= 0 or seq == _web_editor_preview_last_seq:
		return
	_web_editor_preview_last_seq = seq
	_apply_web_editor_preview_message(message)


func _apply_web_editor_preview_message(message: Dictionary) -> void:
	var payload_url := String(message.get("payload_url", "")).strip_edges()
	if payload_url.is_empty():
		return

	var payload_text := WebDisplayBridge.read_preview_payload_json(payload_url)
	if payload_text.is_empty():
		return
	var parsed: Variant = JSON.parse_string(payload_text)
	if typeof(parsed) != TYPE_DICTIONARY:
		return
	var dialogue_data: Dictionary = parsed
	var dialogue_id := String(message.get("dialogue_id", "")).strip_edges()
	if dialogue_id.is_empty():
		dialogue_id = String(dialogue_data.get("id", "")).strip_edges()
	if dialogue_id.is_empty():
		return

	VisualNovelData.apply_editor_preview_dialogue(dialogue_data, "web_editor_preview")

	var node_id := String(message.get("node_id", "")).strip_edges()
	var payload := {
		"dialogue_id": dialogue_id,
		"editor_preview": true,
		"dialogue_data": dialogue_data,
	}
	if not node_id.is_empty():
		payload["node_id"] = node_id
		payload["target_node_id"] = node_id
	_show_editor_preview_payload(payload)


func _read_editor_preview_payload() -> Dictionary:
	var args := OS.get_cmdline_user_args()
	if args.is_empty():
		args = OS.get_cmdline_args()

	var dialogue_id := _read_arg_value(args, EDITOR_PREVIEW_DIALOGUE_ARGS)
	if dialogue_id.is_empty() and WebDisplayBridge.is_web():
		dialogue_id = WebDisplayBridge.read_query_param("editor_preview_dialogue")
	if dialogue_id.is_empty() and WebDisplayBridge.is_web():
		dialogue_id = WebDisplayBridge.read_query_param("preview_dialogue")

	var web_preview_dialogue := _read_web_editor_preview_dialogue()
	if not web_preview_dialogue.is_empty():
		if dialogue_id.is_empty():
			dialogue_id = String(web_preview_dialogue.get("id", "")).strip_edges()
		VisualNovelData.apply_editor_preview_dialogue(web_preview_dialogue, "web_editor_preview")

	if dialogue_id.is_empty():
		return {}

	var node_id := _read_arg_value(args, EDITOR_PREVIEW_NODE_ARGS)
	if node_id.is_empty() and WebDisplayBridge.is_web():
		node_id = WebDisplayBridge.read_query_param("editor_preview_node")
	if node_id.is_empty() and WebDisplayBridge.is_web():
		node_id = WebDisplayBridge.read_query_param("preview_node")
	var payload := {
		"dialogue_id": dialogue_id,
		"editor_preview": true,
	}
	if not web_preview_dialogue.is_empty():
		payload["dialogue_data"] = web_preview_dialogue
	if not node_id.is_empty():
		payload["node_id"] = node_id
		payload["target_node_id"] = node_id
	return payload


func _read_web_editor_preview_dialogue() -> Dictionary:
	if not WebDisplayBridge.is_web():
		return {}

	var payload_text := WebDisplayBridge.read_preview_payload_json()
	if payload_text.is_empty():
		return {}

	var parsed: Variant = JSON.parse_string(payload_text)
	if typeof(parsed) == TYPE_DICTIONARY:
		return parsed
	return {}


func _read_arg_value(args: PackedStringArray, names: Array) -> String:
	for index in args.size():
		var arg := String(args[index]).strip_edges()
		for raw_name in names:
			var name := String(raw_name)
			if arg == name:
				if index + 1 < args.size():
					return String(args[index + 1]).strip_edges()
				return ""
			var prefix := "%s=" % name
			if arg.begins_with(prefix):
				return arg.substr(prefix.length()).strip_edges()
	return ""

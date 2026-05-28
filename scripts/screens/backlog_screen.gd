extends "res://scripts/screens/screen_base.gd"

const MorphTransitionUtil = preload("res://scripts/ui/morph_transition.gd")
const RewindTransitionOverlay = preload("res://scripts/ui/rewind_transition_overlay.gd")

const BACKDROP_COLOR := Color(0, 0, 0, 0.62)
const PANEL_COLOR := Color(0.08, 0.075, 0.068, 0.96)
const PANEL_BORDER_COLOR := Color(0.32, 0.31, 0.28, 0.92)
const ENTRY_COLOR := Color(0.115, 0.108, 0.098, 0.92)
const ENTRY_HOVER_COLOR := Color(0.15, 0.14, 0.125, 0.96)
const ENTRY_FOCUS_COLOR := Color(0.17, 0.155, 0.13, 0.98)
const ENTRY_BORDER_COLOR := Color(0.24, 0.23, 0.21, 0.78)
const ENTRY_HOVER_BORDER_COLOR := Color(0.45, 0.39, 0.28, 0.88)
const ENTRY_FOCUS_BORDER_COLOR := Color(0.72, 0.61, 0.36, 0.96)
const CHOICE_ENTRY_COLOR := Color(0.135, 0.125, 0.1, 0.94)
const TEXT_COLOR := Color(0.88, 0.86, 0.8)
const MUTED_TEXT_COLOR := Color(0.61, 0.59, 0.54)
const DEFAULT_SPEAKER_COLOR := Color(0.92, 0.9, 0.84)
const CONTENT_MARGIN := 42
const DEFAULT_PANEL_MAX_WIDTH := 1600.0
const SCROLL_CONTENT_RIGHT_GAP := 18
const ENTRY_MARGIN_LEFT := 24
const ENTRY_MARGIN_TOP := 18
const ENTRY_MARGIN_RIGHT := 24
const ENTRY_MARGIN_BOTTOM := 18
const ENTRY_INDEX_RESERVED_WIDTH := 92
const ENTRY_MIN_HEIGHT := 116
const ENTRY_FOCUS_SCROLL_PADDING := 10.0
const ENTRY_FOCUS_SCROLL_DURATION := 0.16
const CHOICE_ENTRY_OPACITY := 0.3
const CLOSE_BUTTON_ICON_HEIGHT := 30
const CLOSE_ICON_HEIGHT := 34
const SELECT_HINT_ICON_HEIGHT := 34
const SELECT_HINT_MARGIN := Vector2(24.0, 22.0)
const RETURN_CONFIRM_PANEL_WIDTH := 600.0
const RETURN_CONFIRM_BUTTON_SIZE := Vector2(190.0, 68.0)
const RETURN_BLACKOUT_DURATION := 0.28
const RETURN_REWIND_MIN_VISIBLE_DURATION := 1.3
const OPEN_MORPH_DURATION := 0.26
const KEYCAP_BACKGROUND_COLOR := Color(0.18, 0.17, 0.15, 0.94)
const KEYCAP_BORDER_COLOR := Color(0.42, 0.4, 0.35)
const INPUT_ICON_PATHS := {
	"xbox_a": "res://assets/icon/input/xbox_button_color_a_outline.png",
	"xbox_b": "res://assets/icon/input/xbox_button_color_b_outline.png",
}


class BacklogEntryItem:
	extends Control

	const INDEX_MARGIN_TOP := 18.0
	const INDEX_MARGIN_RIGHT := 24.0

	var background: PanelContainer
	var content_margin: MarginContainer
	var index_label: Label

	func _init() -> void:
		background = PanelContainer.new()
		background.name = "Background"
		background.clip_contents = true
		background.mouse_filter = Control.MOUSE_FILTER_IGNORE
		background.set_anchors_preset(Control.PRESET_FULL_RECT)
		add_child(background)

		content_margin = MarginContainer.new()
		content_margin.name = "Margin"
		content_margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
		background.add_child(content_margin)

		index_label = Label.new()
		index_label.name = "EntryIndex"
		index_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
		index_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		add_child(index_label)

	func _ready() -> void:
		sync_layout()

	func _notification(what: int) -> void:
		if what == NOTIFICATION_RESIZED:
			sync_layout()

	func _get_minimum_size() -> Vector2:
		if background == null:
			return Vector2.ZERO
		return background.get_combined_minimum_size()

	func set_entry_style(style: StyleBox) -> void:
		if background != null:
			background.add_theme_stylebox_override("panel", style)

	func sync_layout() -> void:
		if background != null:
			background.set_anchors_preset(Control.PRESET_FULL_RECT)
			background.offset_left = 0.0
			background.offset_top = 0.0
			background.offset_right = 0.0
			background.offset_bottom = 0.0
		if index_label == null:
			return
		var label_size := index_label.get_combined_minimum_size()
		index_label.position = Vector2(maxf(0.0, size.x - label_size.x - INDEX_MARGIN_RIGHT), INDEX_MARGIN_TOP)
		index_label.size = label_size


var _entries: Array = []
var _backdrop: ColorRect
var _panel: PanelContainer
var _scroll: ScrollContainer
var _scroll_content_margin: MarginContainer
var _entry_list: VBoxContainer
var _close_button: Button
var _close_hint: HBoxContainer
var _close_hint_icon: TextureRect
var _close_hint_keycap: PanelContainer
var _close_hint_key_label: Label
var _close_hint_label: Label
var _select_hint_panel: HBoxContainer
var _select_hint_icon: TextureRect
var _select_hint_keycap: PanelContainer
var _select_hint_key_label: Label
var _select_hint_label: Label
var _confirm_overlay: Control
var _confirm_yes_button: Button
var _confirm_no_button: Button
var _blackout: Control
var _input_icon_cache: Dictionary = {}
var _panel_final_rect := Rect2()
var _morph_tween: Tween
var _scroll_tween: Tween
var _blackout_tween: Tween
var _opened_frame := -1
var _focusable_entries: Array[BacklogEntryItem] = []
var _active_entry_index := -1
var _active_select_entry: BacklogEntryItem
var _pending_return_entry: Dictionary = {}
var _closing := false
var _returning_to_entry := false


func setup(payload: Dictionary = {}) -> void:
	super.setup(payload)
	_entries = _read_entries(payload)
	if is_node_ready():
		_render_entries()


func _ready() -> void:
	screen_id = "backlog"
	screen_title = "대화 로그"
	skip_allowed = false
	_opened_frame = Engine.get_process_frames()
	_entries = _read_entries(setup_payload)
	_build()
	_render_entries()
	_refresh_close_affordance()
	_play_open_morph()
	set_process(false)


func _notification(what: int) -> void:
	super._notification(what)
	if what == NOTIFICATION_RESIZED and _panel != null:
		_layout_panel(_morph_tween == null)
		_layout_select_hint()


func _build() -> void:
	make_full_rect()

	_backdrop = ColorRect.new()
	_backdrop.name = "Backdrop"
	_backdrop.color = BACKDROP_COLOR
	_backdrop.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_backdrop)

	_panel = PanelContainer.new()
	_panel.name = "BacklogPanel"
	_panel.clip_contents = true
	_panel.add_theme_stylebox_override("panel", _create_panel_style())
	add_child(_panel)
	_layout_panel(true)

	var outer_margin := MarginContainer.new()
	outer_margin.name = "OuterMargin"
	outer_margin.add_theme_constant_override("margin_left", 30)
	outer_margin.add_theme_constant_override("margin_top", 24)
	outer_margin.add_theme_constant_override("margin_right", 30)
	outer_margin.add_theme_constant_override("margin_bottom", 30)
	_panel.add_child(outer_margin)

	var layout := VBoxContainer.new()
	layout.name = "BacklogLayout"
	layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_theme_constant_override("separation", 18)
	outer_margin.add_child(layout)

	var header := HBoxContainer.new()
	header.name = "BacklogHeader"
	header.add_theme_constant_override("separation", 18)
	header.alignment = BoxContainer.ALIGNMENT_CENTER
	layout.add_child(header)

	var title := Label.new()
	title.name = "BacklogTitle"
	title.text = "대화 로그"
	title.add_theme_font_size_override("font_size", 42)
	title.add_theme_color_override("font_color", TEXT_COLOR)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title)

	_close_button = Button.new()
	_close_button.name = "CloseButton"
	_close_button.text = ""
	_close_button.icon = _get_mui_icon("CloseRounded", CLOSE_BUTTON_ICON_HEIGHT, TEXT_COLOR)
	_close_button.alignment = HORIZONTAL_ALIGNMENT_CENTER
	_close_button.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_close_button.expand_icon = false
	_close_button.focus_mode = Control.FOCUS_NONE
	_close_button.custom_minimum_size = Vector2(60, 60)
	_close_button.add_theme_font_size_override("font_size", 30)
	_close_button.add_theme_constant_override("h_separation", 0)
	_close_button.add_theme_constant_override("icon_max_width", CLOSE_BUTTON_ICON_HEIGHT)
	_close_button.pressed.connect(request_close)
	header.add_child(_close_button)

	_close_hint = _create_close_hint()
	header.add_child(_close_hint)

	_scroll = ScrollContainer.new()
	_scroll.name = "BacklogScroll"
	_scroll.focus_mode = Control.FOCUS_NONE
	_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_child(_scroll)

	_scroll_content_margin = MarginContainer.new()
	_scroll_content_margin.name = "BacklogScrollContentMargin"
	_scroll_content_margin.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_scroll_content_margin.add_theme_constant_override("margin_right", SCROLL_CONTENT_RIGHT_GAP)
	_scroll.add_child(_scroll_content_margin)

	_entry_list = VBoxContainer.new()
	_entry_list.name = "BacklogEntryList"
	_entry_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_entry_list.add_theme_constant_override("separation", 12)
	_scroll_content_margin.add_child(_entry_list)

	_build_select_hint()
	_build_return_confirm_dialog()
	_build_blackout()


func _input(event: InputEvent) -> void:
	if _should_ignore_gameplay_event(event):
		return
	if _closing or _returning_to_entry:
		get_viewport().set_input_as_handled()
		return

	super._input(event)
	if _is_return_confirm_open():
		if _is_close_action_pressed(event):
			_hide_return_confirm_dialog()
			get_viewport().set_input_as_handled()
			return
		if _handle_return_confirm_navigation_input(event):
			get_viewport().set_input_as_handled()
		return

	if _is_close_action_pressed(event):
		request_close()
		get_viewport().set_input_as_handled()
		return

	if _handle_entry_select_input(event):
		get_viewport().set_input_as_handled()
		return

	if _handle_entry_navigation_input(event):
		get_viewport().set_input_as_handled()


func _create_close_hint() -> HBoxContainer:
	var hint := HBoxContainer.new()
	hint.name = "CloseHint"
	hint.alignment = BoxContainer.ALIGNMENT_CENTER
	hint.add_theme_constant_override("separation", 8)

	_close_hint_icon = TextureRect.new()
	_close_hint_icon.name = "GamepadIcon"
	_close_hint_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_close_hint_icon.custom_minimum_size = Vector2(CLOSE_ICON_HEIGHT, CLOSE_ICON_HEIGHT)
	hint.add_child(_close_hint_icon)

	_close_hint_keycap = PanelContainer.new()
	_close_hint_keycap.name = "KeyboardKeycap"
	_close_hint_keycap.add_theme_stylebox_override("panel", _create_keycap_style())
	hint.add_child(_close_hint_keycap)

	var key_margin := MarginContainer.new()
	key_margin.name = "Margin"
	key_margin.add_theme_constant_override("margin_left", 9)
	key_margin.add_theme_constant_override("margin_top", 2)
	key_margin.add_theme_constant_override("margin_right", 9)
	key_margin.add_theme_constant_override("margin_bottom", 2)
	_close_hint_keycap.add_child(key_margin)

	_close_hint_key_label = Label.new()
	_close_hint_key_label.name = "KeyLabel"
	_close_hint_key_label.text = "Esc"
	_close_hint_key_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_close_hint_key_label.add_theme_font_size_override("font_size", 18)
	_close_hint_key_label.add_theme_color_override("font_color", TEXT_COLOR)
	key_margin.add_child(_close_hint_key_label)

	_close_hint_label = Label.new()
	_close_hint_label.name = "CloseLabel"
	_close_hint_label.text = "닫기"
	_close_hint_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_close_hint_label.add_theme_font_size_override("font_size", 22)
	_close_hint_label.add_theme_color_override("font_color", TEXT_COLOR)
	hint.add_child(_close_hint_label)

	return hint


func _build_select_hint() -> void:
	_select_hint_panel = HBoxContainer.new()
	_select_hint_panel.name = "SelectHint"
	_select_hint_panel.visible = false
	_select_hint_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_select_hint_panel.alignment = BoxContainer.ALIGNMENT_CENTER
	_select_hint_panel.add_theme_constant_override("separation", 9)
	add_child(_select_hint_panel)

	_select_hint_icon = TextureRect.new()
	_select_hint_icon.name = "GamepadIcon"
	_select_hint_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_select_hint_icon.custom_minimum_size = Vector2(SELECT_HINT_ICON_HEIGHT, SELECT_HINT_ICON_HEIGHT)
	_select_hint_panel.add_child(_select_hint_icon)

	_select_hint_keycap = PanelContainer.new()
	_select_hint_keycap.name = "KeyboardKeycap"
	_select_hint_keycap.add_theme_stylebox_override("panel", _create_keycap_style())
	_select_hint_panel.add_child(_select_hint_keycap)

	var key_margin := MarginContainer.new()
	key_margin.name = "Margin"
	key_margin.add_theme_constant_override("margin_left", 9)
	key_margin.add_theme_constant_override("margin_top", 2)
	key_margin.add_theme_constant_override("margin_right", 9)
	key_margin.add_theme_constant_override("margin_bottom", 2)
	_select_hint_keycap.add_child(key_margin)

	_select_hint_key_label = Label.new()
	_select_hint_key_label.name = "KeyLabel"
	_select_hint_key_label.text = "Space"
	_select_hint_key_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_select_hint_key_label.add_theme_font_size_override("font_size", 18)
	_select_hint_key_label.add_theme_color_override("font_color", TEXT_COLOR)
	key_margin.add_child(_select_hint_key_label)

	_select_hint_label = Label.new()
	_select_hint_label.name = "SelectLabel"
	_select_hint_label.text = "돌아가기"
	_select_hint_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_select_hint_label.add_theme_font_size_override("font_size", 22)
	_select_hint_label.add_theme_color_override("font_color", TEXT_COLOR)
	_select_hint_panel.add_child(_select_hint_label)


func _build_return_confirm_dialog() -> void:
	_confirm_overlay = Control.new()
	_confirm_overlay.name = "ReturnConfirmOverlay"
	_confirm_overlay.visible = false
	_confirm_overlay.modulate.a = 0.0
	_confirm_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	_confirm_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_confirm_overlay)

	var scrim := ColorRect.new()
	scrim.name = "Scrim"
	scrim.color = Color(0, 0, 0, 0.48)
	scrim.mouse_filter = Control.MOUSE_FILTER_STOP
	scrim.set_anchors_preset(Control.PRESET_FULL_RECT)
	_confirm_overlay.add_child(scrim)

	var center := CenterContainer.new()
	center.name = "Center"
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	_confirm_overlay.add_child(center)

	var panel := PanelContainer.new()
	panel.name = "ConfirmPanel"
	panel.custom_minimum_size = Vector2(RETURN_CONFIRM_PANEL_WIDTH, 0)
	panel.add_theme_stylebox_override("panel", _create_panel_style())
	center.add_child(panel)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 34)
	margin.add_theme_constant_override("margin_top", 30)
	margin.add_theme_constant_override("margin_right", 34)
	margin.add_theme_constant_override("margin_bottom", 30)
	panel.add_child(margin)

	var layout := VBoxContainer.new()
	layout.name = "ConfirmLayout"
	layout.add_theme_constant_override("separation", 18)
	margin.add_child(layout)

	var title := Label.new()
	title.name = "Title"
	title.text = "선택한 대화로 돌아갈까요?"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	title.add_theme_font_size_override("font_size", 32)
	title.add_theme_color_override("font_color", DEFAULT_SPEAKER_COLOR)
	layout.add_child(title)

	var body := Label.new()
	body.name = "Body"
	body.text = "선택한 대화 이후 얻은 정보가 사라질 수 있습니다."
	body.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.add_theme_font_size_override("font_size", 24)
	body.add_theme_color_override("font_color", TEXT_COLOR)
	layout.add_child(body)

	var actions := HBoxContainer.new()
	actions.name = "Actions"
	actions.alignment = BoxContainer.ALIGNMENT_CENTER
	actions.add_theme_constant_override("separation", 16)
	layout.add_child(actions)

	_confirm_yes_button = _create_return_confirm_button("ConfirmButton", "돌아가기")
	_confirm_no_button = _create_return_confirm_button("CancelButton", "취소")
	_confirm_yes_button.pressed.connect(_on_return_confirm_yes_pressed)
	_confirm_no_button.pressed.connect(_hide_return_confirm_dialog)
	actions.add_child(_confirm_yes_button)
	actions.add_child(_confirm_no_button)
	_configure_return_confirm_button_navigation()


func _create_return_confirm_button(node_name: String, text: String) -> Button:
	var button := Button.new()
	button.name = node_name
	button.text = text
	button.custom_minimum_size = RETURN_CONFIRM_BUTTON_SIZE
	button.alignment = HORIZONTAL_ALIGNMENT_CENTER
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.add_theme_font_size_override("font_size", 26)
	return button


func _configure_return_confirm_button_navigation() -> void:
	if _confirm_yes_button == null or _confirm_no_button == null:
		return
	_confirm_yes_button.focus_neighbor_right = _confirm_yes_button.get_path_to(_confirm_no_button)
	_confirm_yes_button.focus_next = _confirm_yes_button.focus_neighbor_right
	_confirm_no_button.focus_neighbor_left = _confirm_no_button.get_path_to(_confirm_yes_button)
	_confirm_no_button.focus_previous = _confirm_no_button.focus_neighbor_left


func _build_blackout() -> void:
	_blackout = RewindTransitionOverlay.new()
	_blackout.name = "ReturnBlackout"
	_blackout.visible = false
	_blackout.modulate.a = 0.0
	_blackout.mouse_filter = Control.MOUSE_FILTER_STOP
	_blackout.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_blackout)


func _refresh_close_affordance() -> void:
	var mode := _get_current_input_mode()
	var pointer_mode := mode == INPUT_MODE_MOUSE or mode == "touch"
	if _close_button != null:
		_close_button.visible = pointer_mode
		_close_button.mouse_filter = Control.MOUSE_FILTER_STOP if pointer_mode else Control.MOUSE_FILTER_IGNORE
	if _close_hint != null:
		_close_hint.visible = not pointer_mode

	if pointer_mode:
		_refresh_select_hint()
		return

	var gamepad_mode := mode == INPUT_MODE_GAMEPAD
	if _close_hint_icon != null:
		_close_hint_icon.visible = gamepad_mode
		_close_hint_icon.texture = _get_input_icon("xbox_b", CLOSE_ICON_HEIGHT) if gamepad_mode else null
	if _close_hint_keycap != null:
		_close_hint_keycap.visible = not gamepad_mode
	if _close_hint_key_label != null:
		_close_hint_key_label.text = "Esc"
	if _close_hint_label != null:
		_close_hint_label.text = "닫기"
	_apply_input_hint_order(_close_hint, _close_hint_icon, _close_hint_keycap, _close_hint_label, mode)
	_refresh_select_hint()


func request_close() -> void:
	if _closing:
		return
	_play_close_morph()


func _handle_entry_select_input(event: InputEvent) -> bool:
	if not _is_navigation_input_mode_active():
		return false
	if event is InputEventKey:
		var key_event := event as InputEventKey
		if not key_event.pressed or key_event.echo:
			return false
	elif event is InputEventJoypadButton:
		if not (event as InputEventJoypadButton).pressed:
			return false
	else:
		return false

	if not event.is_action_pressed("interact"):
		return false

	var panel := _get_active_return_entry()
	if panel == null:
		return false
	_request_return_to_entry(panel)
	return true


func _handle_entry_navigation_input(event: InputEvent) -> bool:
	if not _is_navigation_input_mode_active():
		return false

	if event is InputEventKey:
		var key_event := event as InputEventKey
		if not key_event.pressed or key_event.echo:
			return false
	elif event is InputEventJoypadButton:
		if not (event as InputEventJoypadButton).pressed:
			return false
	elif event is InputEventJoypadMotion:
		if absf((event as InputEventJoypadMotion).axis_value) <= _get_gamepad_deadzone():
			return false
	else:
		return false

	if event.is_action_pressed("move_up") or event.is_action_pressed("ui_up"):
		return _move_entry_focus(-1)
	if event.is_action_pressed("move_down") or event.is_action_pressed("ui_down"):
		return _move_entry_focus(1)
	return false


func _apply_input_hint_order(
	container: HBoxContainer,
	icon: Control,
	keycap: Control,
	label: Control,
	mode: String
) -> void:
	if container == null or label == null:
		return
	if mode == INPUT_MODE_GAMEPAD:
		if icon != null and icon.get_parent() == container:
			container.move_child(icon, 0)
		if label.get_parent() == container:
			container.move_child(label, 1)
		return
	if label.get_parent() == container:
		container.move_child(label, 0)
	if mode == INPUT_MODE_KEYBOARD and keycap != null and keycap.get_parent() == container:
		container.move_child(keycap, 1)


func _handle_return_confirm_navigation_input(event: InputEvent) -> bool:
	if not _is_navigation_input_mode_active():
		return false

	if event is InputEventKey:
		var key_event := event as InputEventKey
		if not key_event.pressed or key_event.echo:
			return false
	elif event is InputEventJoypadButton:
		if not (event as InputEventJoypadButton).pressed:
			return false
	elif event is InputEventJoypadMotion:
		if absf((event as InputEventJoypadMotion).axis_value) <= _get_gamepad_deadzone():
			return false
	else:
		return false

	if event.is_action_pressed("move_left") or event.is_action_pressed("ui_left"):
		_focus_return_confirm_button(-1)
		return true
	if event.is_action_pressed("move_right") or event.is_action_pressed("ui_right"):
		_focus_return_confirm_button(1)
		return true
	return false


func _focus_return_confirm_button(direction: int) -> void:
	var target := _confirm_yes_button if direction < 0 else _confirm_no_button
	if target == null or not is_instance_valid(target):
		return
	set_preferred_focus_control(target)
	target.grab_focus()


func _layout_panel(apply_immediate: bool) -> void:
	if _panel == null:
		return

	var viewport_size := size
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		viewport_size = get_viewport().get_visible_rect().size
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return

	var max_width := maxf(1.0, float(setup_payload.get("panel_max_width", DEFAULT_PANEL_MAX_WIDTH)))
	var available_width := maxf(1.0, viewport_size.x - CONTENT_MARGIN * 2.0)
	var panel_width := minf(max_width, available_width)
	var panel_height := maxf(1.0, viewport_size.y - CONTENT_MARGIN * 2.0)
	_panel_final_rect = Rect2(
		Vector2((viewport_size.x - panel_width) * 0.5, CONTENT_MARGIN),
		Vector2(panel_width, panel_height)
	)

	if apply_immediate:
		_apply_panel_rect(_panel_final_rect)


func _layout_select_hint() -> void:
	if _select_hint_panel == null or not is_instance_valid(_select_hint_panel):
		return
	var panel := _active_select_entry
	if panel == null or not is_instance_valid(panel):
		_select_hint_panel.visible = false
		return
	if _select_hint_panel.get_parent() != panel:
		var previous_parent := _select_hint_panel.get_parent()
		if previous_parent != null:
			previous_parent.remove_child(_select_hint_panel)
		panel.add_child(_select_hint_panel)
		_select_hint_panel.move_to_front()

	var hint_size := _select_hint_panel.get_combined_minimum_size()
	_select_hint_panel.size = hint_size
	_select_hint_panel.position = Vector2(
		maxf(0.0, panel.size.x - hint_size.x - SELECT_HINT_MARGIN.x),
		maxf(0.0, panel.size.y - hint_size.y - SELECT_HINT_MARGIN.y)
	)


func _apply_panel_rect(rect: Rect2) -> void:
	MorphTransitionUtil.apply_rect(_panel, rect)


func _play_open_morph() -> void:
	if _panel == null or _backdrop == null:
		return

	_layout_panel(true)
	var source_rect := _get_open_source_rect()
	if source_rect.size.x <= 0.0 or source_rect.size.y <= 0.0:
		return

	_apply_panel_rect(source_rect)
	_backdrop.color = Color(BACKDROP_COLOR.r, BACKDROP_COLOR.g, BACKDROP_COLOR.b, 0.0)
	_panel.modulate.a = 0.0

	_morph_tween = create_tween()
	_morph_tween.set_parallel(true)
	_morph_tween.set_ease(Tween.EASE_OUT)
	_morph_tween.set_trans(Tween.TRANS_CUBIC)
	MorphTransitionUtil.tween_rect(_morph_tween, _panel, _panel_final_rect, OPEN_MORPH_DURATION)
	_morph_tween.tween_property(_panel, "modulate:a", 1.0, OPEN_MORPH_DURATION)
	_morph_tween.tween_method(_set_backdrop_alpha, 0.0, BACKDROP_COLOR.a, OPEN_MORPH_DURATION)
	_morph_tween.finished.connect(func() -> void:
		_apply_panel_rect(_panel_final_rect)
		_backdrop.color = BACKDROP_COLOR
		_panel.modulate.a = 1.0
		_layout_select_hint()
		_morph_tween = null
	, CONNECT_ONE_SHOT)


func _play_close_morph() -> void:
	if _panel == null or _backdrop == null:
		close_requested.emit()
		return

	_closing = true
	_refresh_select_hint()
	set_process_input(false)
	set_process_unhandled_input(false)
	var focus_owner := get_viewport().gui_get_focus_owner()
	if focus_owner != null and is_ancestor_of(focus_owner):
		focus_owner.release_focus()

	if _morph_tween != null:
		_morph_tween.kill()
		_morph_tween = null

	var source_rect := _get_open_source_rect()
	if source_rect.size.x <= 0.0 or source_rect.size.y <= 0.0:
		close_requested.emit()
		return

	_morph_tween = create_tween()
	_morph_tween.set_parallel(true)
	_morph_tween.set_ease(Tween.EASE_IN)
	_morph_tween.set_trans(Tween.TRANS_CUBIC)
	MorphTransitionUtil.tween_rect(_morph_tween, _panel, source_rect, OPEN_MORPH_DURATION)
	_morph_tween.tween_property(_panel, "modulate:a", 0.0, OPEN_MORPH_DURATION)
	_morph_tween.tween_method(_set_backdrop_alpha, _backdrop.color.a, 0.0, OPEN_MORPH_DURATION)
	_morph_tween.finished.connect(func() -> void:
		_morph_tween = null
		close_requested.emit()
	, CONNECT_ONE_SHOT)


func _get_open_source_rect() -> Rect2:
	var source_rect := MorphTransitionUtil.rect_from_payload(setup_payload)
	if MorphTransitionUtil.has_usable_rect(source_rect):
		return source_rect
	return MorphTransitionUtil.fallback_corner_rect(_panel_final_rect)


func _set_backdrop_alpha(alpha: float) -> void:
	MorphTransitionUtil.set_color_rect_alpha(_backdrop, BACKDROP_COLOR, alpha)


func _read_entries(payload: Dictionary) -> Array:
	var raw_entries: Variant = payload.get("entries", [])
	if typeof(raw_entries) != TYPE_ARRAY:
		return []
	return (raw_entries as Array).duplicate(true)


func _render_entries() -> void:
	if _entry_list == null:
		return

	_focusable_entries.clear()
	_active_entry_index = -1
	_active_select_entry = null
	_detach_select_hint()
	for child in _entry_list.get_children():
		_entry_list.remove_child(child)
		child.queue_free()

	if _entries.is_empty():
		_add_empty_entry()
	else:
		for raw_entry in _entries:
			if typeof(raw_entry) == TYPE_DICTIONARY:
				_add_entry(raw_entry as Dictionary)

	_configure_entry_focus_navigation()
	refresh_input_focus_mode()
	_refresh_select_hint()
	call_deferred("_scroll_to_bottom")


func _detach_select_hint() -> void:
	if _select_hint_panel == null or not is_instance_valid(_select_hint_panel):
		return
	_select_hint_panel.visible = false
	if _select_hint_panel.get_parent() == self:
		return
	var previous_parent := _select_hint_panel.get_parent()
	if previous_parent != null:
		previous_parent.remove_child(_select_hint_panel)
	add_child(_select_hint_panel)


func _add_empty_entry() -> void:
	var placeholder := _create_entry_panel(false, false)
	placeholder.name = "BacklogEntryTemplate"
	placeholder.index_label.visible = false
	_entry_list.add_child(placeholder)

	var text := Label.new()
	text.name = "EntryText"
	text.text = "아직 기록된 대화가 없습니다."
	text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	text.add_theme_font_size_override("font_size", 27)
	text.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	placeholder.content_margin.add_child(text)


func _add_entry(entry: Dictionary) -> void:
	var is_choice := String(entry.get("kind", "")) == "choice"
	var panel := _create_entry_panel(is_choice)
	panel.name = "BacklogEntry%03d" % int(entry.get("index", _entry_list.get_child_count() + 1))
	panel.set_meta("entry", entry.duplicate(true))
	_configure_entry_index_label(panel, int(entry.get("index", _entry_list.get_child_count() + 1)))
	_entry_list.add_child(panel)
	if not is_choice:
		_focusable_entries.append(panel)

	var content := VBoxContainer.new()
	content.name = "Content"
	content.mouse_filter = Control.MOUSE_FILTER_IGNORE
	content.add_theme_constant_override("separation", 8)
	content.size_flags_vertical = Control.SIZE_EXPAND_FILL
	panel.content_margin.add_child(content)

	var speaker_name := _get_entry_speaker(entry)
	if not speaker_name.is_empty():
		var header := HBoxContainer.new()
		header.name = "EntryHeader"
		header.mouse_filter = Control.MOUSE_FILTER_IGNORE
		header.add_theme_constant_override("separation", 12)
		content.add_child(header)

		var speaker := Label.new()
		speaker.name = "Speaker"
		speaker.mouse_filter = Control.MOUSE_FILTER_IGNORE
		speaker.text = speaker_name
		speaker.add_theme_font_size_override("font_size", 22)
		speaker.add_theme_color_override("font_color", _get_entry_speaker_color(entry, is_choice))
		speaker.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		header.add_child(speaker)
	else:
		content.alignment = BoxContainer.ALIGNMENT_CENTER

	var body := Label.new()
	body.name = "EntryText"
	body.mouse_filter = Control.MOUSE_FILTER_IGNORE
	body.text = _get_entry_text(entry, is_choice)
	body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	body.add_theme_font_size_override("font_size", 29)
	body.add_theme_color_override("font_color", TEXT_COLOR)
	content.add_child(body)


func _create_entry_panel(is_choice: bool, interactive := true) -> BacklogEntryItem:
	var panel := BacklogEntryItem.new()
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel.custom_minimum_size = Vector2(0, ENTRY_MIN_HEIGHT)
	panel.focus_mode = Control.FOCUS_NONE if is_choice or not interactive else Control.FOCUS_ALL
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE if is_choice or not interactive else Control.MOUSE_FILTER_PASS
	panel.mouse_default_cursor_shape = Control.CURSOR_ARROW if is_choice or not interactive else Control.CURSOR_POINTING_HAND
	panel.set_meta("is_choice", is_choice)
	panel.set_meta("hovered", false)
	panel.set_meta("focused", false)
	panel.modulate.a = CHOICE_ENTRY_OPACITY if is_choice else 1.0
	panel.set_entry_style(_create_entry_style(is_choice))
	panel.content_margin.add_theme_constant_override("margin_left", ENTRY_MARGIN_LEFT)
	panel.content_margin.add_theme_constant_override("margin_top", ENTRY_MARGIN_TOP)
	panel.content_margin.add_theme_constant_override("margin_right", ENTRY_MARGIN_RIGHT + ENTRY_INDEX_RESERVED_WIDTH)
	panel.content_margin.add_theme_constant_override("margin_bottom", ENTRY_MARGIN_BOTTOM)
	if not is_choice and interactive:
		panel.mouse_entered.connect(_on_entry_mouse_entered.bind(panel))
		panel.mouse_exited.connect(_on_entry_mouse_exited.bind(panel))
		panel.gui_input.connect(_on_entry_gui_input.bind(panel))
		panel.focus_entered.connect(_on_entry_focus_entered.bind(panel))
		panel.focus_exited.connect(_on_entry_focus_exited.bind(panel))
	return panel


func _configure_entry_index_label(panel: BacklogEntryItem, entry_index: int) -> void:
	if panel == null or not is_instance_valid(panel):
		return
	panel.index_label.visible = true
	panel.index_label.text = "#%03d" % entry_index
	panel.index_label.add_theme_font_size_override("font_size", 18)
	panel.index_label.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	panel.sync_layout()


func _configure_entry_focus_navigation() -> void:
	for index in _focusable_entries.size():
		var panel := _focusable_entries[index]
		if panel == null or not is_instance_valid(panel):
			continue
		panel.focus_previous = panel.get_path_to(_focusable_entries[index - 1]) if index > 0 else NodePath()
		panel.focus_neighbor_top = panel.focus_previous
		panel.focus_next = panel.get_path_to(_focusable_entries[index + 1]) if index < _focusable_entries.size() - 1 else NodePath()
		panel.focus_neighbor_bottom = panel.focus_next


func _on_entry_mouse_entered(panel: BacklogEntryItem) -> void:
	if _is_choice_entry(panel):
		return
	panel.set_meta("hovered", true)
	_set_active_select_entry(panel)
	_refresh_entry_visual(panel)


func _on_entry_mouse_exited(panel: BacklogEntryItem) -> void:
	if _is_choice_entry(panel):
		return
	panel.set_meta("hovered", false)
	_clear_active_select_entry_if_inactive(panel)
	_refresh_entry_visual(panel)


func _on_entry_gui_input(event: InputEvent, panel: BacklogEntryItem) -> void:
	if _closing or _returning_to_entry or _is_return_confirm_open() or _is_choice_entry(panel):
		return
	if not (event is InputEventMouseButton):
		return
	var mouse_event := event as InputEventMouseButton
	if mouse_event.button_index != MOUSE_BUTTON_LEFT or not mouse_event.pressed:
		return
	_set_active_select_entry(panel)
	_request_return_to_entry(panel)
	panel.accept_event()


func _on_entry_focus_entered(panel: BacklogEntryItem) -> void:
	if _is_choice_entry(panel):
		return
	panel.set_meta("focused", true)
	_active_entry_index = _focusable_entries.find(panel)
	_set_active_select_entry(panel)
	_refresh_entry_visual(panel)
	_ensure_entry_visible(panel)


func _on_entry_focus_exited(panel: BacklogEntryItem) -> void:
	if _is_choice_entry(panel):
		return
	panel.set_meta("focused", false)
	_clear_active_select_entry_if_inactive(panel)
	_refresh_entry_visual(panel)


func _refresh_entry_visual(panel: BacklogEntryItem) -> void:
	if panel == null or not is_instance_valid(panel):
		return
	var is_choice := _is_choice_entry(panel)
	var hovered := bool(panel.get_meta("hovered", false)) and not _is_navigation_input_mode_active()
	var focused := bool(panel.get_meta("focused", false))
	panel.set_entry_style(_create_entry_style(is_choice, hovered, focused))
	panel.modulate.a = CHOICE_ENTRY_OPACITY if is_choice else 1.0


func _refresh_all_entry_visuals() -> void:
	for panel in _focusable_entries:
		_refresh_entry_visual(panel)


func _is_choice_entry(panel: BacklogEntryItem) -> bool:
	return panel != null and is_instance_valid(panel) and bool(panel.get_meta("is_choice", false))


func _set_active_select_entry(panel: BacklogEntryItem) -> void:
	if panel == null or not is_instance_valid(panel) or _is_choice_entry(panel):
		return
	_active_select_entry = panel
	_refresh_select_hint()


func _clear_active_select_entry_if_inactive(panel: BacklogEntryItem) -> void:
	if panel == null or panel != _active_select_entry:
		return
	if bool(panel.get_meta("hovered", false)) or bool(panel.get_meta("focused", false)):
		_refresh_select_hint()
		return
	_active_select_entry = null
	_refresh_select_hint()


func _get_active_return_entry() -> BacklogEntryItem:
	var focus_owner := get_viewport().gui_get_focus_owner()
	if focus_owner is BacklogEntryItem:
		var focused_panel := focus_owner as BacklogEntryItem
		if not _is_choice_entry(focused_panel):
			return focused_panel
	if _active_select_entry != null and is_instance_valid(_active_select_entry) and not _is_choice_entry(_active_select_entry):
		return _active_select_entry
	if _active_entry_index >= 0 and _active_entry_index < _focusable_entries.size():
		var panel := _focusable_entries[_active_entry_index]
		if panel != null and is_instance_valid(panel) and not _is_choice_entry(panel):
			return panel
	return null


func _is_entry_active_for_current_mode(panel: BacklogEntryItem) -> bool:
	if panel == null or not is_instance_valid(panel) or _is_choice_entry(panel):
		return false
	var mode := _get_current_input_mode()
	if mode == INPUT_MODE_MOUSE:
		return bool(panel.get_meta("hovered", false))
	if mode == INPUT_MODE_KEYBOARD or mode == INPUT_MODE_GAMEPAD:
		return bool(panel.get_meta("focused", false))
	return false


func _refresh_select_hint() -> void:
	if _select_hint_panel == null:
		return

	var panel := _active_select_entry
	var show_hint := panel != null \
		and is_instance_valid(panel) \
		and _is_entry_active_for_current_mode(panel) \
		and not _closing \
		and not _returning_to_entry \
		and not _is_return_confirm_open()
	_select_hint_panel.visible = show_hint
	if not show_hint:
		return

	var mode := _get_current_input_mode()
	var gamepad_mode := mode == INPUT_MODE_GAMEPAD
	var keyboard_mode := mode == INPUT_MODE_KEYBOARD
	if _select_hint_icon != null:
		_select_hint_icon.visible = gamepad_mode
		_select_hint_icon.texture = _get_input_icon("xbox_a", SELECT_HINT_ICON_HEIGHT) if gamepad_mode else null
	if _select_hint_keycap != null:
		_select_hint_keycap.visible = keyboard_mode
	if _select_hint_key_label != null:
		_select_hint_key_label.text = "Space"
	if _select_hint_label != null:
		_select_hint_label.text = "돌아가기"
	_apply_input_hint_order(_select_hint_panel, _select_hint_icon, _select_hint_keycap, _select_hint_label, mode)
	_layout_select_hint()


func _request_return_to_entry(panel: BacklogEntryItem) -> void:
	var entry := _get_entry_payload(panel)
	if entry.is_empty():
		return
	if String(entry.get("kind", "")) == "choice":
		return
	if String(entry.get("dialogue_id", "")).strip_edges().is_empty():
		return
	if String(entry.get("node_id", "")).strip_edges().is_empty():
		return
	_pending_return_entry = entry
	_show_return_confirm_dialog()


func _get_entry_payload(panel: BacklogEntryItem) -> Dictionary:
	if panel == null or not is_instance_valid(panel) or not panel.has_meta("entry"):
		return {}
	var raw_entry: Variant = panel.get_meta("entry")
	if typeof(raw_entry) != TYPE_DICTIONARY:
		return {}
	return (raw_entry as Dictionary).duplicate(true)


func _show_return_confirm_dialog() -> void:
	if _confirm_overlay == null:
		return
	_confirm_overlay.visible = true
	_confirm_overlay.modulate.a = 0.0
	_refresh_select_hint()
	var tween := create_tween()
	tween.set_ease(Tween.EASE_OUT)
	tween.set_trans(Tween.TRANS_SINE)
	tween.tween_property(_confirm_overlay, "modulate:a", 1.0, 0.12)
	if _confirm_yes_button != null and _is_navigation_input_mode_active():
		set_preferred_focus_control(_confirm_yes_button)
		_confirm_yes_button.grab_focus()


func _hide_return_confirm_dialog() -> void:
	if _confirm_overlay != null:
		_confirm_overlay.visible = false
		_confirm_overlay.modulate.a = 0.0
	_pending_return_entry.clear()
	_refresh_select_hint()
	if _active_select_entry != null and is_instance_valid(_active_select_entry) and _is_navigation_input_mode_active():
		set_preferred_focus_control(_active_select_entry)
		_active_select_entry.grab_focus()


func _is_return_confirm_open() -> bool:
	return _confirm_overlay != null and _confirm_overlay.visible


func _on_return_confirm_yes_pressed() -> void:
	if _returning_to_entry or _pending_return_entry.is_empty():
		return
	var payload := _make_rewind_payload(_pending_return_entry)
	if payload.is_empty():
		_hide_return_confirm_dialog()
		return
	_returning_to_entry = true
	_closing = true
	set_process_input(false)
	set_process_unhandled_input(false)
	_refresh_select_hint()
	_play_return_blackout(payload)


func _play_return_blackout(payload: Dictionary) -> void:
	if _blackout == null:
		request_screen_change("story_dialogue", payload)
		return
	if _blackout_tween != null:
		_blackout_tween.kill()
		_blackout_tween = null

	_blackout.visible = true
	_blackout.modulate.a = 0.0
	_blackout.move_to_front()
	if _blackout.has_method("restart"):
		_blackout.call("restart")
	_blackout_tween = create_tween()
	_blackout_tween.set_ease(Tween.EASE_IN)
	_blackout_tween.set_trans(Tween.TRANS_SINE)
	_blackout_tween.tween_property(_blackout, "modulate:a", 1.0, RETURN_BLACKOUT_DURATION)
	_blackout_tween.tween_interval(maxf(0.0, RETURN_REWIND_MIN_VISIBLE_DURATION - RETURN_BLACKOUT_DURATION))
	_blackout_tween.finished.connect(func() -> void:
		_blackout_tween = null
		request_screen_change("story_dialogue", payload)
	, CONNECT_ONE_SHOT)


func _make_rewind_payload(entry: Dictionary) -> Dictionary:
	var dialogue_id := String(entry.get("dialogue_id", setup_payload.get("dialogue_id", ""))).strip_edges()
	var node_id := String(entry.get("node_id", "")).strip_edges()
	if dialogue_id.is_empty() or node_id.is_empty():
		return {}

	var payload := {
		"dialogue_id": dialogue_id,
		"node_id": node_id,
		"target_node_id": node_id,
		"rewind_backlog_entries": _make_rewind_backlog_entries(entry),
		"rewind_acquired_info": true,
		"rewind_acquired_character_ids": _read_string_array(entry.get("acquired_character_ids", [])),
		"rewind_acquired_item_ids": _read_string_array(entry.get("acquired_item_ids", [])),
		"rewind_fade": true,
	}
	var chapter_id := String(setup_payload.get("chapter_id", "")).strip_edges()
	if not chapter_id.is_empty():
		payload["chapter_id"] = chapter_id
	var chapter_title := String(setup_payload.get("chapter_title", "")).strip_edges()
	if not chapter_title.is_empty():
		payload["chapter_title"] = chapter_title
	return payload


func _make_rewind_backlog_entries(selected_entry: Dictionary) -> Array:
	var result := []
	var selected_position := _find_rewind_entry_position(selected_entry)
	if selected_position < 0:
		return result

	for index in range(selected_position + 1):
		var raw_entry: Variant = _entries[index]
		if typeof(raw_entry) == TYPE_DICTIONARY:
			result.append((raw_entry as Dictionary).duplicate(true))
	return result


func _find_rewind_entry_position(selected_entry: Dictionary) -> int:
	var selected_index := int(selected_entry.get("index", -1))
	var selected_dialogue_id := String(selected_entry.get("dialogue_id", "")).strip_edges()
	var selected_node_id := String(selected_entry.get("node_id", "")).strip_edges()
	var selected_kind := String(selected_entry.get("kind", "")).strip_edges()
	var selected_text := String(selected_entry.get("text", "")).strip_edges()

	for index in _entries.size():
		var raw_entry: Variant = _entries[index]
		if typeof(raw_entry) != TYPE_DICTIONARY:
			continue
		var entry: Dictionary = raw_entry
		if selected_index >= 0 and int(entry.get("index", -2)) == selected_index:
			return index
		if String(entry.get("dialogue_id", "")).strip_edges() == selected_dialogue_id \
			and String(entry.get("node_id", "")).strip_edges() == selected_node_id \
			and String(entry.get("kind", "")).strip_edges() == selected_kind \
			and String(entry.get("text", "")).strip_edges() == selected_text:
			return index
	return -1


func _read_string_array(raw_value: Variant) -> Array:
	var result := []
	if typeof(raw_value) != TYPE_ARRAY:
		return result
	for raw_id in raw_value as Array:
		var id := String(raw_id).strip_edges()
		if not id.is_empty():
			result.append(id)
	return result


func _move_entry_focus(direction: int) -> bool:
	if _focusable_entries.is_empty():
		return false

	var current_index := _get_current_entry_focus_index()
	if current_index < 0 or not _is_entry_visible_in_scroll(_focusable_entries[current_index]):
		_focus_bottom_visible_entry()
		return true

	var next_index := clampi(current_index + direction, 0, _focusable_entries.size() - 1)
	_focus_entry(next_index)
	return true


func _get_current_entry_focus_index() -> int:
	var focus_owner := get_viewport().gui_get_focus_owner()
	if focus_owner is BacklogEntryItem:
		var index := _focusable_entries.find(focus_owner)
		if index >= 0:
			return index
	if _active_entry_index >= 0 and _active_entry_index < _focusable_entries.size():
		return _active_entry_index
	return -1


func _focus_entry(index: int) -> void:
	if index < 0 or index >= _focusable_entries.size():
		return
	var panel := _focusable_entries[index]
	if panel == null or not is_instance_valid(panel):
		return
	_active_entry_index = index
	set_preferred_focus_control(panel)
	panel.grab_focus()
	_ensure_entry_visible(panel)


func _focus_bottom_visible_entry() -> void:
	if _focusable_entries.is_empty() or not _is_navigation_input_mode_active():
		return
	refresh_input_focus_mode()
	var target_index := _find_bottom_visible_entry_index()
	if target_index < 0:
		target_index = _focusable_entries.size() - 1
	_focus_entry(target_index)


func _update_preferred_bottom_visible_entry() -> void:
	if _focusable_entries.is_empty():
		return
	var target_index := _find_bottom_visible_entry_index()
	if target_index < 0:
		target_index = _focusable_entries.size() - 1
	var panel := _focusable_entries[target_index]
	if panel != null and is_instance_valid(panel):
		_active_entry_index = target_index
		set_preferred_focus_control(panel)


func _find_bottom_visible_entry_index() -> int:
	if _scroll == null or not is_instance_valid(_scroll):
		return _focusable_entries.size() - 1

	var scroll_rect := _scroll.get_global_rect()
	var target_index := -1
	var target_bottom := -1.0e20
	for index in _focusable_entries.size():
		var panel := _focusable_entries[index]
		if panel == null or not is_instance_valid(panel) or not panel.is_visible_in_tree():
			continue
		var panel_rect := panel.get_global_rect()
		if not panel_rect.intersects(scroll_rect):
			continue
		var panel_bottom := panel_rect.position.y + panel_rect.size.y
		if panel_bottom > target_bottom:
			target_bottom = panel_bottom
			target_index = index
	return target_index


func _is_entry_visible_in_scroll(panel: Control) -> bool:
	if _scroll == null or not is_instance_valid(_scroll) or panel == null or not is_instance_valid(panel):
		return false
	return panel.get_global_rect().intersects(_scroll.get_global_rect())


func _focus_bottom_visible_entry_if_navigation() -> void:
	_update_preferred_bottom_visible_entry()
	if _is_navigation_input_mode_active():
		_focus_bottom_visible_entry()


func _ensure_entry_visible(panel: Control) -> void:
	if _scroll == null or not is_instance_valid(_scroll) or panel == null or not is_instance_valid(panel):
		return

	var scroll_bar := _scroll.get_v_scroll_bar()
	if scroll_bar == null:
		return
	var scroll_rect := _scroll.get_global_rect()
	var panel_rect := panel.get_global_rect()
	var max_scroll := maxf(0.0, scroll_bar.max_value - scroll_bar.page)
	var target_scroll := float(_scroll.scroll_vertical)
	if panel_rect.position.y < scroll_rect.position.y:
		target_scroll -= scroll_rect.position.y - panel_rect.position.y + ENTRY_FOCUS_SCROLL_PADDING
	elif panel_rect.position.y + panel_rect.size.y > scroll_rect.position.y + scroll_rect.size.y:
		target_scroll += (panel_rect.position.y + panel_rect.size.y) - (scroll_rect.position.y + scroll_rect.size.y) + ENTRY_FOCUS_SCROLL_PADDING

	target_scroll = clampf(target_scroll, 0.0, max_scroll)
	if is_equal_approx(target_scroll, float(_scroll.scroll_vertical)):
		return
	_animate_scroll_to(target_scroll)


func _animate_scroll_to(target_scroll: float) -> void:
	if _scroll == null or not is_instance_valid(_scroll):
		return

	if _scroll_tween != null:
		_scroll_tween.kill()
		_scroll_tween = null

	_scroll_tween = create_tween()
	_scroll_tween.set_ease(Tween.EASE_OUT)
	_scroll_tween.set_trans(Tween.TRANS_SINE)
	_scroll_tween.tween_property(_scroll, "scroll_vertical", int(roundf(target_scroll)), ENTRY_FOCUS_SCROLL_DURATION)
	_scroll_tween.finished.connect(func() -> void:
		_scroll_tween = null
	, CONNECT_ONE_SHOT)


func _get_entry_speaker(entry: Dictionary) -> String:
	var speaker := String(entry.get("speaker", "")).strip_edges()
	return speaker


func _get_entry_text(entry: Dictionary, _is_choice: bool) -> String:
	var text := String(entry.get("text", "")).strip_edges()
	return text


func _get_entry_speaker_color(entry: Dictionary, is_choice: bool) -> Color:
	if is_choice:
		return MUTED_TEXT_COLOR

	var raw_color: Variant = entry.get("speaker_color", DEFAULT_SPEAKER_COLOR)
	if raw_color is Color:
		return raw_color as Color
	if typeof(raw_color) == TYPE_STRING and Color.html_is_valid(String(raw_color)):
		return Color.html(String(raw_color))
	return DEFAULT_SPEAKER_COLOR


func _create_panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = PANEL_COLOR
	style.border_color = PANEL_BORDER_COLOR
	style.set_border_width_all(2)
	style.set_corner_radius_all(8)
	style.shadow_color = Color(0, 0, 0, 0.34)
	style.shadow_size = 18
	return style


func _create_entry_style(is_choice: bool, hovered := false, focused := false) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	if is_choice:
		style.bg_color = CHOICE_ENTRY_COLOR
		style.border_color = Color(0.34, 0.32, 0.27, 0.74)
	else:
		style.bg_color = ENTRY_FOCUS_COLOR if focused else (ENTRY_HOVER_COLOR if hovered else ENTRY_COLOR)
		style.border_color = ENTRY_FOCUS_BORDER_COLOR if focused else (ENTRY_HOVER_BORDER_COLOR if hovered else ENTRY_BORDER_COLOR)
	style.set_border_width_all(1)
	style.set_corner_radius_all(6)
	return style


func _create_keycap_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = KEYCAP_BACKGROUND_COLOR
	style.border_color = KEYCAP_BORDER_COLOR
	style.set_border_width_all(1)
	style.set_corner_radius_all(4)
	return style


func _get_input_icon(icon_key: String, target_height: int) -> Texture2D:
	if icon_key.is_empty() or not INPUT_ICON_PATHS.has(icon_key):
		return null
	var cache_key := "%s:%d" % [icon_key, target_height]
	if not _input_icon_cache.has(cache_key):
		_input_icon_cache[cache_key] = _load_scaled_texture(String(INPUT_ICON_PATHS[icon_key]), target_height)
	return _input_icon_cache[cache_key] as Texture2D


func _load_scaled_texture(path: String, target_height: int) -> Texture2D:
	var source_texture := load(path) as Texture2D
	if source_texture == null or target_height <= 0:
		return source_texture
	var source_height := source_texture.get_height()
	var source_width := source_texture.get_width()
	if source_height <= 0 or source_width <= 0:
		return source_texture

	var image := source_texture.get_image()
	if image == null:
		return source_texture
	var target_width := maxi(1, int(round(float(target_height) * float(source_width) / float(source_height))))
	image.resize(target_width, target_height, Image.INTERPOLATE_LANCZOS)
	return ImageTexture.create_from_image(image)


func _is_close_action_pressed(event: InputEvent) -> bool:
	if Engine.get_process_frames() == _opened_frame:
		return false

	if event is InputEventKey:
		var key_event := event as InputEventKey
		if not key_event.pressed or key_event.echo:
			return false
	elif event is InputEventJoypadButton:
		if not (event as InputEventJoypadButton).pressed:
			return false
	elif event is InputEventMouseButton:
		if not (event as InputEventMouseButton).pressed:
			return false
	else:
		return false

	return event.is_action_pressed("back") \
		or event.is_action_pressed("log") \
		or event.is_action_pressed("menu")


func _scroll_to_bottom() -> void:
	await get_tree().process_frame
	if _scroll == null or not is_instance_valid(_scroll):
		return
	var scroll_bar := _scroll.get_v_scroll_bar()
	if scroll_bar != null:
		_scroll.scroll_vertical = int(maxf(0.0, scroll_bar.max_value - scroll_bar.page))
	call_deferred("_focus_bottom_visible_entry_if_navigation")


func _on_input_mode_changed(mode: String) -> void:
	super._on_input_mode_changed(mode)
	_refresh_close_affordance()
	_refresh_all_entry_visuals()
	_refresh_select_hint()
	call_deferred("_focus_bottom_visible_entry_if_navigation")

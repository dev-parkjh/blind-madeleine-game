extends Control

const VirtualCursor := preload("res://scripts/input/virtual_cursor.gd")

const COMPACT_WIDTH := 760.0
const WIDE_WIDTH := 1360.0

var _safe_area: MarginContainer
var _layout: VBoxContainer
var _header: HBoxContainer
var _title_label: Label
var _status_label: Label
var _content_scroll: ScrollContainer
var _content: BoxContainer
var _clue_panel: PanelContainer
var _clue_grid: GridContainer
var _side: VBoxContainer
var _case_panel: PanelContainer
var _case_text: RichTextLabel
var _notebook_panel: PanelContainer
var _cursor: ColorRect
var _clue_buttons: Array[Button] = []
var _selected_clue := ""
var _layout_mode := ""


func _ready() -> void:
	_build_interface()
	_connect_input_router()
	get_viewport().size_changed.connect(_apply_responsive_layout)
	_update_scheme_label(InputRouter.current_scheme)
	call_deferred("_apply_responsive_layout")
	if not _clue_buttons.is_empty():
		_clue_buttons[0].grab_focus()
		_select_clue(_clue_buttons[0].text)


func _build_interface() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)

	var background := ColorRect.new()
	background.color = Color(0.055, 0.052, 0.047)
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	_safe_area = MarginContainer.new()
	_safe_area.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_safe_area)

	_layout = VBoxContainer.new()
	_layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_layout.add_theme_constant_override("separation", 18)
	_safe_area.add_child(_layout)

	_header = HBoxContainer.new()
	_header.add_theme_constant_override("separation", 16)
	_layout.add_child(_header)

	_title_label = Label.new()
	_title_label.text = "Blind Madeleine"
	_title_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	_title_label.add_theme_font_size_override("font_size", 34)
	_title_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_header.add_child(_title_label)

	_status_label = Label.new()
	_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_status_label.add_theme_font_size_override("font_size", 15)
	_header.add_child(_status_label)

	_content_scroll = ScrollContainer.new()
	_content_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_content_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_layout.add_child(_content_scroll)

	_content = BoxContainer.new()
	_content.vertical = false
	_content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_content.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_content.add_theme_constant_override("separation", 18)
	_content_scroll.add_child(_content)

	_clue_panel = PanelContainer.new()
	_clue_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_clue_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_content.add_child(_clue_panel)

	var clue_margin := MarginContainer.new()
	clue_margin.add_theme_constant_override("margin_left", 20)
	clue_margin.add_theme_constant_override("margin_top", 20)
	clue_margin.add_theme_constant_override("margin_right", 20)
	clue_margin.add_theme_constant_override("margin_bottom", 20)
	_clue_panel.add_child(clue_margin)

	_clue_grid = GridContainer.new()
	_clue_grid.columns = 2
	_clue_grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_clue_grid.add_theme_constant_override("h_separation", 12)
	_clue_grid.add_theme_constant_override("v_separation", 12)
	clue_margin.add_child(_clue_grid)

	for clue_name in ["부서진 찻잔", "라벤더 향", "잠긴 서재", "젖은 영수증", "흐린 녹음", "사라진 열쇠"]:
		var button := Button.new()
		button.text = clue_name
		button.focus_mode = Control.FOCUS_ALL
		button.custom_minimum_size = Vector2(240, 88)
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.size_flags_vertical = Control.SIZE_EXPAND_FILL
		button.pressed.connect(_select_clue.bind(clue_name))
		button.focus_entered.connect(_select_clue.bind(clue_name))
		_clue_buttons.append(button)
		_clue_grid.add_child(button)

	_side = VBoxContainer.new()
	_side.custom_minimum_size = Vector2(360, 0)
	_side.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_side.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_side.add_theme_constant_override("separation", 12)
	_content.add_child(_side)

	_case_panel = PanelContainer.new()
	_case_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_case_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_side.add_child(_case_panel)

	var case_margin := MarginContainer.new()
	case_margin.add_theme_constant_override("margin_left", 18)
	case_margin.add_theme_constant_override("margin_top", 18)
	case_margin.add_theme_constant_override("margin_right", 18)
	case_margin.add_theme_constant_override("margin_bottom", 18)
	_case_panel.add_child(case_margin)

	_case_text = RichTextLabel.new()
	_case_text.fit_content = true
	_case_text.scroll_active = false
	_case_text.bbcode_enabled = true
	_case_text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_case_text.text = "[b]증거를 선택하세요.[/b]\n\n선택한 단서는 사건 노트와 대화 선택지에 연결됩니다."
	case_margin.add_child(_case_text)

	_notebook_panel = PanelContainer.new()
	_notebook_panel.visible = false
	_notebook_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_side.add_child(_notebook_panel)

	var notebook_margin := MarginContainer.new()
	notebook_margin.add_theme_constant_override("margin_left", 18)
	notebook_margin.add_theme_constant_override("margin_top", 14)
	notebook_margin.add_theme_constant_override("margin_right", 18)
	notebook_margin.add_theme_constant_override("margin_bottom", 14)
	_notebook_panel.add_child(notebook_margin)

	var notebook_text := Label.new()
	notebook_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	notebook_text.text = "사건 노트\n- 타임라인\n- 인물별 진술\n- 모순 표시"
	notebook_margin.add_child(notebook_text)

	_cursor = VirtualCursor.new()
	add_child(_cursor)


func _connect_input_router() -> void:
	InputRouter.input_scheme_changed.connect(_update_scheme_label)
	InputRouter.pointer_moved.connect(_on_pointer_moved)
	InputRouter.primary_pressed.connect(_on_primary_pressed)
	InputRouter.action_pressed.connect(_on_action_pressed)


func _apply_responsive_layout() -> void:
	if _safe_area == null:
		return

	var viewport_size := get_viewport().get_visible_rect().size
	var compact := _is_compact_layout(viewport_size)
	var wide := viewport_size.x >= WIDE_WIDTH and viewport_size.x > viewport_size.y * 1.25
	var next_mode := "compact" if compact else ("wide" if wide else "balanced")

	_apply_safe_area_margins(viewport_size, compact)
	_content.vertical = compact
	_content.add_theme_constant_override("separation", 12 if compact else 18)
	_layout.add_theme_constant_override("separation", 12 if compact else 18)
	_clue_grid.columns = 1 if compact else (3 if wide else 2)
	_status_label.visible = viewport_size.x >= 430.0
	_title_label.add_theme_font_size_override("font_size", 24 if compact else (36 if wide else 32))

	var button_height := 76.0 if compact else (96.0 if wide else 88.0)
	for button in _clue_buttons:
		button.custom_minimum_size = Vector2(0 if compact else 220, button_height)

	if compact:
		_clue_panel.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
		_side.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
		_side.custom_minimum_size = Vector2.ZERO
		_case_panel.custom_minimum_size = Vector2(0, 150)
		_case_text.custom_minimum_size = Vector2(0, 96)
	else:
		_clue_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
		_side.size_flags_vertical = Control.SIZE_EXPAND_FILL
		_side.custom_minimum_size = Vector2(clamp(viewport_size.x * 0.30, 340.0, 460.0), 0)
		_case_panel.custom_minimum_size = Vector2.ZERO
		_case_text.custom_minimum_size = Vector2.ZERO

	_layout_mode = next_mode


func _is_compact_layout(viewport_size: Vector2) -> bool:
	return viewport_size.x < COMPACT_WIDTH or viewport_size.x < viewport_size.y * 0.92


func _apply_safe_area_margins(viewport_size: Vector2, compact: bool) -> void:
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


func _update_scheme_label(scheme: String) -> void:
	match scheme:
		InputRouter.SCHEME_TOUCH:
			_status_label.text = "Touch"
			_cursor.visible = false
		InputRouter.SCHEME_GAMEPAD:
			_status_label.text = "Gamepad"
			_cursor.visible = true
			_cursor.set_cursor_position(InputRouter.pointer_position)
		_:
			_status_label.text = "Mouse / Keyboard"
			_cursor.visible = false


func _on_pointer_moved(position: Vector2, scheme: String) -> void:
	if scheme == InputRouter.SCHEME_GAMEPAD:
		_cursor.visible = true
		_cursor.set_cursor_position(position)


func _on_primary_pressed(position: Vector2, scheme: String) -> void:
	if scheme != InputRouter.SCHEME_GAMEPAD:
		return
	for button in _clue_buttons:
		if button.get_global_rect().has_point(position):
			button.grab_focus()
			button.emit_signal("pressed")
			return


func _on_action_pressed(action: String, scheme: String) -> void:
	match action:
		"notebook":
			_notebook_panel.visible = not _notebook_panel.visible
		"back":
			_notebook_panel.visible = false
		"interact":
			if scheme != InputRouter.SCHEME_GAMEPAD:
				var focus_owner := get_viewport().gui_get_focus_owner()
				if focus_owner is Button:
					focus_owner.emit_signal("pressed")
		"focus_next":
			_focus_relative(1)
		"focus_previous":
			_focus_relative(-1)


func _focus_relative(offset: int) -> void:
	if _clue_buttons.is_empty():
		return
	var current_index := 0
	var focus_owner := get_viewport().gui_get_focus_owner()
	if focus_owner is Button:
		current_index = max(_clue_buttons.find(focus_owner), 0)
	var next_index := wrapi(current_index + offset, 0, _clue_buttons.size())
	_clue_buttons[next_index].grab_focus()


func _select_clue(clue_name: String) -> void:
	if _selected_clue == clue_name:
		return
	_selected_clue = clue_name
	_case_text.text = "[b]%s[/b]\n\n이 단서에서 새 진술, 장소, 시간 정보를 파생시킬 수 있습니다." % clue_name

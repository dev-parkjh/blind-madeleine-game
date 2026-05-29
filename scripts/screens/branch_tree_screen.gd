extends "res://scripts/screens/screen_base.gd"

const BACKDROP_COLOR := Color(0, 0, 0, 0.82)
const PANEL_COLOR := Color(0.045, 0.043, 0.04, 0.98)
const PANEL_BORDER_COLOR := Color(0.33, 0.31, 0.28, 0.82)
const SURFACE_COLOR := Color(0.072, 0.068, 0.062, 0.94)
const SURFACE_DARK_COLOR := Color(0.032, 0.031, 0.03, 0.96)
const SURFACE_BORDER_COLOR := Color(0.22, 0.21, 0.19, 0.86)
const TEXT_COLOR := Color(0.89, 0.87, 0.8)
const MUTED_TEXT_COLOR := Color(0.58, 0.56, 0.5)
const DIM_TEXT_COLOR := Color(0.36, 0.35, 0.32)
const ACCENT_COLOR := Color(0.62, 0.62, 0.58)
const CURRENT_COLOR := Color(1.0, 0.82, 0.66)
const START_COLOR := Color(0.76, 0.70, 0.58)
const LINK_COLOR := Color(0.62, 0.58, 0.50, 0.58)
const LINK_CURRENT_COLOR := Color(1.0, 0.82, 0.66, 0.86)
const GRID_MINOR_COLOR := Color(0.28, 0.30, 0.31, 0.11)
const GRID_MAJOR_COLOR := Color(0.55, 0.58, 0.58, 0.12)
const KEYCAP_BACKGROUND_COLOR := Color(0.18, 0.17, 0.15, 0.94)
const KEYCAP_BORDER_COLOR := Color(0.42, 0.4, 0.35)

const PANEL_MARGIN := 24.0
const PANEL_MAX_WIDTH := 1860.0
const CONTENT_MARGIN := 24
const NODE_SIZE := Vector2(286.0, 148.0)
const AUTO_NODE_GAP := Vector2(366.0, 52.0)
const CANVAS_MARGIN := Vector2(96.0, 90.0)
const INSPECTOR_WIDTH := 492.0
const INSPECTOR_MIN_WIDTH := 390.0
const MOVE_BUTTON_MIN_HEIGHT := 58.0
const MOVE_CONFIRM_PANEL_WIDTH := 620.0
const MOVE_CONFIRM_BUTTON_SIZE := Vector2(190.0, 68.0)
const BRANCH_TRANSITION_DURATION := 0.28
const BRANCH_TRANSITION_HOLD_DURATION := 0.08
const CLOSE_BUTTON_ICON_HEIGHT := 30
const CLOSE_ICON_HEIGHT := 34

const INPUT_ICON_PATHS := {
	"xbox_b": "res://assets/icon/input/xbox_button_color_b_outline.png",
}


class ChapterCanvasGrid:
	extends Control

	func _draw() -> void:
		if size.x <= 0.0 or size.y <= 0.0:
			return

		draw_rect(Rect2(Vector2.ZERO, size), Color(0.026, 0.027, 0.028, 0.78), true)
		var minor_step := 32
		var major_step := 160
		for x in range(0, int(size.x) + minor_step, minor_step):
			var color := GRID_MAJOR_COLOR if x % major_step == 0 else GRID_MINOR_COLOR
			draw_line(Vector2(x, 0), Vector2(x, size.y), color, 1.0)
		for y in range(0, int(size.y) + minor_step, minor_step):
			var color := GRID_MAJOR_COLOR if y % major_step == 0 else GRID_MINOR_COLOR
			draw_line(Vector2(0, y), Vector2(size.x, y), color, 1.0)

		draw_rect(Rect2(Vector2.ZERO, Vector2(size.x, 30.0)), Color(0, 0, 0, 0.22), true)
		draw_rect(Rect2(Vector2(0.0, size.y - 34.0), Vector2(size.x, 34.0)), Color(0, 0, 0, 0.22), true)
		draw_rect(Rect2(Vector2.ZERO, Vector2(30.0, size.y)), Color(0, 0, 0, 0.18), true)
		draw_rect(Rect2(Vector2(size.x - 30.0, 0.0), Vector2(30.0, size.y)), Color(0, 0, 0, 0.18), true)

		var font := ThemeDB.fallback_font
		draw_string(font, Vector2(size.x - 330.0, 54.0), "CHAPTER CANVAS", HORIZONTAL_ALIGNMENT_LEFT, -1.0, 20, Color(0.88, 0.84, 0.74, 0.055))
		draw_line(Vector2(38.0, 38.0), Vector2(130.0, 38.0), Color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b, 0.15), 2.0)
		draw_line(Vector2(38.0, 38.0), Vector2(38.0, 130.0), Color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b, 0.15), 2.0)


class ChapterConnectionLayer:
	extends Control

	var connections: Array[Dictionary] = []

	func set_connections(next_connections: Array[Dictionary]) -> void:
		connections = next_connections.duplicate(true)
		queue_redraw()

	func _draw() -> void:
		for connection in connections:
			var from: Vector2 = connection.get("from", Vector2.ZERO)
			var to: Vector2 = connection.get("to", Vector2.ZERO)
			var active := bool(connection.get("active", false))
			var color := LINK_CURRENT_COLOR if active else LINK_COLOR
			var width := 3.0 if active else 2.0
			var points := _make_curve_points(from, to)
			if points.size() < 2:
				continue
			draw_polyline(points, color, width, true)
			_draw_arrow(points[points.size() - 2], points[points.size() - 1], color, width)

	func _make_curve_points(from: Vector2, to: Vector2) -> PackedVector2Array:
		var points := PackedVector2Array()
		var control_distance := maxf(120.0, absf(to.x - from.x) * 0.48)
		var c1 := from + Vector2(control_distance, 0.0)
		var c2 := to - Vector2(control_distance, 0.0)
		if to.x < from.x:
			c1 = from + Vector2(84.0, 88.0)
			c2 = to - Vector2(84.0, -88.0)
		for index in range(28):
			var t := float(index) / 27.0
			points.append(_cubic_bezier(from, c1, c2, to, t))
		return points

	func _cubic_bezier(p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2, t: float) -> Vector2:
		var u := 1.0 - t
		return p0 * u * u * u + p1 * 3.0 * u * u * t + p2 * 3.0 * u * t * t + p3 * t * t * t

	func _draw_arrow(previous: Vector2, tip: Vector2, color: Color, width: float) -> void:
		var delta := tip - previous
		if delta.length() <= 0.0:
			return
		var direction := delta.normalized()
		var tangent := Vector2(-direction.y, direction.x)
		var arrow_length := 13.0 + width
		var arrow_width := 6.0 + width
		draw_line(tip, tip - direction * arrow_length + tangent * arrow_width, color, width, true)
		draw_line(tip, tip - direction * arrow_length - tangent * arrow_width, color, width, true)


class BranchRouteTransitionLayer:
	extends Control

	var progress := 0.0:
		set(value):
			progress = clampf(value, 0.0, 1.0)
			queue_redraw()

	func _draw() -> void:
		if size.x <= 0.0 or size.y <= 0.0:
			return
		draw_rect(Rect2(Vector2.ZERO, size), Color.BLACK, true)


var _backdrop: ColorRect
var _panel: PanelContainer
var _content_split: HBoxContainer
var _tree_panel: PanelContainer
var _tree_canvas: Control
var _grid_layer: ChapterCanvasGrid
var _connection_layer: ChapterConnectionLayer
var _node_layer: Control
var _scroll: ScrollContainer
var _inspector_panel: PanelContainer
var _file_number_label: Label
var _case_title_label: Label
var _close_button: Button
var _close_hint: HBoxContainer
var _close_hint_icon: TextureRect
var _close_hint_keycap: PanelContainer
var _close_hint_key_label: Label
var _close_hint_label: Label
var _chapter_number_label: Label
var _chapter_title_label: Label
var _cover_texture: TextureRect
var _cover_placeholder: Label
var _chapter_description_label: Label
var _chapter_stats_label: Label
var _selected_dialogue_title: Label
var _selected_dialogue_meta: Label
var _selected_dialogue_preview: Label
var _selected_dialogue_move_button: Button
var _move_confirm_overlay: Control
var _move_confirm_title_label: Label
var _move_confirm_body_label: Label
var _move_confirm_yes_button: Button
var _move_confirm_no_button: Button
var _branch_transition_overlay: Control
var _branch_transition_layer: BranchRouteTransitionLayer

var _dialogue_id := ""
var _current_dialogue_id := ""
var _chapter_id := ""
var _chapter_title := ""
var _chapter: Dictionary = {}
var _dialogue_ids: Array[String] = []
var _dialogues: Dictionary = {}
var _positions: Dictionary = {}
var _connections: Array[Dictionary] = []
var _selected_dialogue_id := ""
var _input_icon_cache: Dictionary = {}
var _panel_final_rect := Rect2()
var _branch_transition_tween: Tween
var _pending_move_dialogue_id := ""
var _opened_frame := -1
var _closing := false
var _moving_to_dialogue := false


func setup(payload: Dictionary = {}) -> void:
	super.setup(payload)
	_read_payload(payload)
	if is_node_ready():
		_rebuild_chapter_canvas()
		_render_canvas()
		_refresh_header()
		_refresh_inspector()


func _ready() -> void:
	screen_id = "branch_tree"
	screen_title = "기록 보관소"
	skip_allowed = false
	_opened_frame = Engine.get_process_frames()
	_read_payload(setup_payload)
	_build()
	_rebuild_chapter_canvas()
	_render_canvas()
	_refresh_header()
	_refresh_inspector()
	_refresh_close_affordance()


func _notification(what: int) -> void:
	super._notification(what)
	if what == NOTIFICATION_RESIZED and _panel != null:
		_layout_panel(true)
		_refresh_responsive_layout()


func _input(event: InputEvent) -> void:
	if _should_ignore_gameplay_event(event):
		return

	if _closing or _moving_to_dialogue:
		get_viewport().set_input_as_handled()
		return

	super._input(event)
	if _is_move_confirm_open():
		if _is_close_action_pressed(event):
			_hide_move_confirm_dialog()
			get_viewport().set_input_as_handled()
		return

	if _is_close_action_pressed(event):
		request_close()
		get_viewport().set_input_as_handled()


func request_close() -> void:
	if _closing or _moving_to_dialogue:
		return
	_close_screen()


func _build() -> void:
	make_full_rect()

	_backdrop = ColorRect.new()
	_backdrop.name = "Backdrop"
	_backdrop.color = BACKDROP_COLOR
	_backdrop.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_backdrop)

	_panel = PanelContainer.new()
	_panel.name = "BranchArchivePanel"
	_panel.clip_contents = true
	_panel.add_theme_stylebox_override("panel", _create_panel_style())
	add_child(_panel)
	_layout_panel(true)

	var outer_margin := MarginContainer.new()
	outer_margin.name = "OuterMargin"
	outer_margin.add_theme_constant_override("margin_left", CONTENT_MARGIN)
	outer_margin.add_theme_constant_override("margin_top", 18)
	outer_margin.add_theme_constant_override("margin_right", CONTENT_MARGIN)
	outer_margin.add_theme_constant_override("margin_bottom", CONTENT_MARGIN)
	_panel.add_child(outer_margin)

	var layout := VBoxContainer.new()
	layout.name = "BranchArchiveLayout"
	layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_theme_constant_override("separation", 16)
	outer_margin.add_child(layout)

	layout.add_child(_create_archive_header())

	_content_split = HBoxContainer.new()
	_content_split.name = "ArchiveContent"
	_content_split.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_content_split.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_content_split.add_theme_constant_override("separation", 18)
	layout.add_child(_content_split)

	_build_tree_panel(_content_split)
	_build_inspector_panel(_content_split)
	_refresh_responsive_layout()
	_build_move_confirm_dialog()
	_build_branch_transition_overlay()


func _create_archive_header() -> Control:
	var header := HBoxContainer.new()
	header.name = "ArchiveHeader"
	header.custom_minimum_size = Vector2(0.0, 64.0)
	header.alignment = BoxContainer.ALIGNMENT_CENTER
	header.add_theme_constant_override("separation", 18)

	var title := Label.new()
	title.name = "ArchiveTitle"
	title.text = "기록 보관소"
	title.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 40)
	title.add_theme_color_override("font_color", TEXT_COLOR)
	header.add_child(title)

	var divider := ColorRect.new()
	divider.name = "HeaderDivider"
	divider.color = Color(ACCENT_COLOR.r, ACCENT_COLOR.g, ACCENT_COLOR.b, 0.55)
	divider.custom_minimum_size = Vector2(2.0, 42.0)
	header.add_child(divider)

	var section := Label.new()
	section.name = "SectionTitle"
	section.text = "챕터 분기"
	section.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	section.add_theme_font_size_override("font_size", 26)
	section.add_theme_color_override("font_color", ACCENT_COLOR)
	section.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(section)

	_close_button = Button.new()
	_close_button.name = "CloseButton"
	_close_button.text = ""
	_close_button.icon = _get_mui_icon("CloseRounded", CLOSE_BUTTON_ICON_HEIGHT, TEXT_COLOR)
	_close_button.alignment = HORIZONTAL_ALIGNMENT_CENTER
	_close_button.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_close_button.expand_icon = false
	_close_button.focus_mode = Control.FOCUS_NONE
	_close_button.custom_minimum_size = Vector2(58.0, 58.0)
	_close_button.add_theme_constant_override("h_separation", 0)
	_close_button.add_theme_constant_override("icon_max_width", CLOSE_BUTTON_ICON_HEIGHT)
	_close_button.add_theme_stylebox_override("normal", _create_ghost_button_style(Color(1, 1, 1, 0.03)))
	_close_button.add_theme_stylebox_override("hover", _create_ghost_button_style(Color(1, 1, 1, 0.08)))
	_close_button.add_theme_stylebox_override("pressed", _create_ghost_button_style(Color(1, 1, 1, 0.12)))
	_close_button.pressed.connect(request_close)
	header.add_child(_close_button)

	_close_hint = _create_close_hint()
	header.add_child(_close_hint)
	return header


func _build_tree_panel(parent: Control) -> void:
	_tree_panel = PanelContainer.new()
	_tree_panel.name = "TreePanel"
	_tree_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_tree_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_tree_panel.add_theme_stylebox_override("panel", _create_surface_style(SURFACE_DARK_COLOR))
	parent.add_child(_tree_panel)

	var tree_margin := MarginContainer.new()
	tree_margin.name = "TreeMargin"
	tree_margin.add_theme_constant_override("margin_left", 18)
	tree_margin.add_theme_constant_override("margin_top", 18)
	tree_margin.add_theme_constant_override("margin_right", 18)
	tree_margin.add_theme_constant_override("margin_bottom", 18)
	_tree_panel.add_child(tree_margin)

	var tree_layout := VBoxContainer.new()
	tree_layout.name = "TreeLayout"
	tree_layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	tree_layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	tree_layout.add_theme_constant_override("separation", 14)
	tree_margin.add_child(tree_layout)

	var case_header := HBoxContainer.new()
	case_header.name = "CaseHeader"
	case_header.custom_minimum_size = Vector2(0.0, 96.0)
	case_header.add_theme_constant_override("separation", 14)
	tree_layout.add_child(case_header)

	var accent := ColorRect.new()
	accent.name = "CaseAccent"
	accent.color = ACCENT_COLOR
	accent.custom_minimum_size = Vector2(3.0, 78.0)
	case_header.add_child(accent)

	var case_text := VBoxContainer.new()
	case_text.name = "CaseText"
	case_text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	case_text.add_theme_constant_override("separation", 4)
	case_header.add_child(case_text)

	_file_number_label = Label.new()
	_file_number_label.name = "FileNumberLabel"
	_file_number_label.text = "사건 파일"
	_file_number_label.add_theme_font_size_override("font_size", 18)
	_file_number_label.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	case_text.add_child(_file_number_label)

	_case_title_label = Label.new()
	_case_title_label.name = "CaseTitleLabel"
	_case_title_label.text = "챕터 캔버스"
	_case_title_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_case_title_label.add_theme_font_size_override("font_size", 34)
	_case_title_label.add_theme_color_override("font_color", TEXT_COLOR)
	case_text.add_child(_case_title_label)

	var stamp := Label.new()
	stamp.name = "CaseStamp"
	stamp.text = "CHAPTER CANVAS"
	stamp.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	stamp.add_theme_font_size_override("font_size", 18)
	stamp.add_theme_color_override("font_color", DIM_TEXT_COLOR)
	case_header.add_child(stamp)

	_scroll = ScrollContainer.new()
	_scroll.name = "ChapterCanvasScroll"
	_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	tree_layout.add_child(_scroll)

	_tree_canvas = Control.new()
	_tree_canvas.name = "ChapterCanvas"
	_tree_canvas.custom_minimum_size = Vector2(1180.0, 680.0)
	_scroll.add_child(_tree_canvas)

	_grid_layer = ChapterCanvasGrid.new()
	_grid_layer.name = "GridLayer"
	_grid_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_grid_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	_tree_canvas.add_child(_grid_layer)

	_connection_layer = ChapterConnectionLayer.new()
	_connection_layer.name = "ConnectionLayer"
	_connection_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_connection_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	_tree_canvas.add_child(_connection_layer)

	_node_layer = Control.new()
	_node_layer.name = "DialogueNodeLayer"
	_node_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_node_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	_tree_canvas.add_child(_node_layer)


func _build_inspector_panel(parent: Control) -> void:
	_inspector_panel = PanelContainer.new()
	_inspector_panel.name = "InspectorPanel"
	_inspector_panel.custom_minimum_size = Vector2(INSPECTOR_WIDTH, 0.0)
	_inspector_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_inspector_panel.add_theme_stylebox_override("panel", _create_surface_style(SURFACE_COLOR))
	parent.add_child(_inspector_panel)

	var margin := MarginContainer.new()
	margin.name = "InspectorMargin"
	margin.add_theme_constant_override("margin_left", 22)
	margin.add_theme_constant_override("margin_top", 22)
	margin.add_theme_constant_override("margin_right", 22)
	margin.add_theme_constant_override("margin_bottom", 22)
	_inspector_panel.add_child(margin)

	var layout := VBoxContainer.new()
	layout.name = "InspectorLayout"
	layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_theme_constant_override("separation", 14)
	margin.add_child(layout)

	_chapter_number_label = Label.new()
	_chapter_number_label.name = "ChapterNumber"
	_chapter_number_label.text = "챕터"
	_chapter_number_label.add_theme_font_size_override("font_size", 18)
	_chapter_number_label.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	layout.add_child(_chapter_number_label)

	_chapter_title_label = Label.new()
	_chapter_title_label.name = "ChapterTitle"
	_chapter_title_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_chapter_title_label.add_theme_font_size_override("font_size", 30)
	_chapter_title_label.add_theme_color_override("font_color", TEXT_COLOR)
	layout.add_child(_chapter_title_label)

	var cover_panel := PanelContainer.new()
	cover_panel.name = "ChapterCoverPanel"
	cover_panel.custom_minimum_size = Vector2(0.0, 236.0)
	cover_panel.add_theme_stylebox_override("panel", _create_preview_style())
	layout.add_child(cover_panel)

	var cover_stack := Control.new()
	cover_stack.name = "CoverStack"
	cover_stack.clip_contents = true
	cover_panel.add_child(cover_stack)

	_cover_texture = TextureRect.new()
	_cover_texture.name = "CoverTexture"
	_cover_texture.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_cover_texture.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_cover_texture.set_anchors_preset(Control.PRESET_FULL_RECT)
	_cover_texture.visible = false
	cover_stack.add_child(_cover_texture)

	_cover_placeholder = Label.new()
	_cover_placeholder.name = "CoverPlaceholder"
	_cover_placeholder.text = "대표 이미지 없음"
	_cover_placeholder.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_cover_placeholder.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_cover_placeholder.set_anchors_preset(Control.PRESET_FULL_RECT)
	_cover_placeholder.add_theme_font_size_override("font_size", 20)
	_cover_placeholder.add_theme_color_override("font_color", DIM_TEXT_COLOR)
	cover_stack.add_child(_cover_placeholder)

	var description_title := Label.new()
	description_title.name = "DescriptionTitle"
	description_title.text = "챕터 설명"
	description_title.add_theme_font_size_override("font_size", 18)
	description_title.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	layout.add_child(description_title)

	_chapter_description_label = Label.new()
	_chapter_description_label.name = "ChapterDescription"
	_chapter_description_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_chapter_description_label.add_theme_font_size_override("font_size", 22)
	_chapter_description_label.add_theme_color_override("font_color", TEXT_COLOR)
	layout.add_child(_chapter_description_label)

	_chapter_stats_label = Label.new()
	_chapter_stats_label.name = "ChapterStats"
	_chapter_stats_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_chapter_stats_label.add_theme_font_size_override("font_size", 18)
	_chapter_stats_label.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	layout.add_child(_chapter_stats_label)

	var separator := ColorRect.new()
	separator.name = "InspectorSeparator"
	separator.color = Color(1, 1, 1, 0.08)
	separator.custom_minimum_size = Vector2(0.0, 1.0)
	layout.add_child(separator)

	var selected_caption := Label.new()
	selected_caption.name = "SelectedCaption"
	selected_caption.text = "선택한 대화"
	selected_caption.add_theme_font_size_override("font_size", 18)
	selected_caption.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	layout.add_child(selected_caption)

	_selected_dialogue_title = Label.new()
	_selected_dialogue_title.name = "SelectedDialogueTitle"
	_selected_dialogue_title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_selected_dialogue_title.add_theme_font_size_override("font_size", 24)
	_selected_dialogue_title.add_theme_color_override("font_color", TEXT_COLOR)
	layout.add_child(_selected_dialogue_title)

	_selected_dialogue_meta = Label.new()
	_selected_dialogue_meta.name = "SelectedDialogueMeta"
	_selected_dialogue_meta.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_selected_dialogue_meta.add_theme_font_size_override("font_size", 17)
	_selected_dialogue_meta.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	layout.add_child(_selected_dialogue_meta)

	_selected_dialogue_preview = Label.new()
	_selected_dialogue_preview.name = "SelectedDialoguePreview"
	_selected_dialogue_preview.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_selected_dialogue_preview.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_selected_dialogue_preview.add_theme_font_size_override("font_size", 19)
	_selected_dialogue_preview.add_theme_color_override("font_color", Color(0.78, 0.75, 0.68))
	layout.add_child(_selected_dialogue_preview)

	_selected_dialogue_move_button = Button.new()
	_selected_dialogue_move_button.name = "MoveToDialogueButton"
	_selected_dialogue_move_button.text = "이동"
	_selected_dialogue_move_button.icon = _get_mui_icon("ArrowForwardRounded", 24, TEXT_COLOR)
	_selected_dialogue_move_button.icon_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_selected_dialogue_move_button.expand_icon = false
	_selected_dialogue_move_button.custom_minimum_size = Vector2(0.0, MOVE_BUTTON_MIN_HEIGHT)
	_selected_dialogue_move_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_selected_dialogue_move_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	_selected_dialogue_move_button.add_theme_font_size_override("font_size", 22)
	_selected_dialogue_move_button.add_theme_constant_override("h_separation", 10)
	_selected_dialogue_move_button.add_theme_stylebox_override("normal", _create_move_button_style(Color(0.31, 0.31, 0.29, 0.98), ACCENT_COLOR))
	_selected_dialogue_move_button.add_theme_stylebox_override("hover", _create_move_button_style(Color(0.38, 0.38, 0.35, 0.98), Color(0.74, 0.74, 0.70)))
	_selected_dialogue_move_button.add_theme_stylebox_override("pressed", _create_move_button_style(Color(0.25, 0.25, 0.23, 0.98), Color(0.78, 0.78, 0.74)))
	_selected_dialogue_move_button.add_theme_stylebox_override("disabled", _create_move_button_style(Color(0.12, 0.12, 0.11, 0.78), Color(0.30, 0.30, 0.28, 0.64)))
	_selected_dialogue_move_button.pressed.connect(_on_move_to_dialogue_pressed)
	layout.add_child(_selected_dialogue_move_button)


func _build_move_confirm_dialog() -> void:
	_move_confirm_overlay = Control.new()
	_move_confirm_overlay.name = "MoveConfirmOverlay"
	_move_confirm_overlay.visible = false
	_move_confirm_overlay.modulate.a = 0.0
	_move_confirm_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	_move_confirm_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_move_confirm_overlay)

	var scrim := ColorRect.new()
	scrim.name = "Scrim"
	scrim.color = Color(0, 0, 0, 0.54)
	scrim.mouse_filter = Control.MOUSE_FILTER_STOP
	scrim.set_anchors_preset(Control.PRESET_FULL_RECT)
	_move_confirm_overlay.add_child(scrim)

	var center := CenterContainer.new()
	center.name = "Center"
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	_move_confirm_overlay.add_child(center)

	var panel := PanelContainer.new()
	panel.name = "ConfirmPanel"
	panel.custom_minimum_size = Vector2(MOVE_CONFIRM_PANEL_WIDTH, 0.0)
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

	_move_confirm_title_label = Label.new()
	_move_confirm_title_label.name = "Title"
	_move_confirm_title_label.text = "선택한 분기로 이동하시겠습니까?"
	_move_confirm_title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_move_confirm_title_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_move_confirm_title_label.add_theme_font_size_override("font_size", 32)
	_move_confirm_title_label.add_theme_color_override("font_color", TEXT_COLOR)
	layout.add_child(_move_confirm_title_label)

	_move_confirm_body_label = Label.new()
	_move_confirm_body_label.name = "Body"
	_move_confirm_body_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_move_confirm_body_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_move_confirm_body_label.add_theme_font_size_override("font_size", 23)
	_move_confirm_body_label.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	layout.add_child(_move_confirm_body_label)

	var actions := HBoxContainer.new()
	actions.name = "Actions"
	actions.alignment = BoxContainer.ALIGNMENT_CENTER
	actions.add_theme_constant_override("separation", 16)
	layout.add_child(actions)

	_move_confirm_yes_button = _create_move_confirm_button("ConfirmButton", "이동", true)
	_move_confirm_no_button = _create_move_confirm_button("CancelButton", "취소", false)
	_move_confirm_yes_button.pressed.connect(_on_move_confirm_yes_pressed)
	_move_confirm_no_button.pressed.connect(_hide_move_confirm_dialog)
	actions.add_child(_move_confirm_yes_button)
	actions.add_child(_move_confirm_no_button)
	_configure_move_confirm_button_navigation()


func _build_branch_transition_overlay() -> void:
	_branch_transition_overlay = Control.new()
	_branch_transition_overlay.name = "BranchTransitionOverlay"
	_branch_transition_overlay.visible = false
	_branch_transition_overlay.modulate.a = 0.0
	_branch_transition_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	_branch_transition_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_branch_transition_overlay)

	_branch_transition_layer = BranchRouteTransitionLayer.new()
	_branch_transition_layer.name = "RouteTransitionLayer"
	_branch_transition_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_branch_transition_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	_branch_transition_overlay.add_child(_branch_transition_layer)


func _create_move_confirm_button(node_name: String, text: String, primary: bool) -> Button:
	var button := Button.new()
	button.name = node_name
	button.text = text
	button.custom_minimum_size = MOVE_CONFIRM_BUTTON_SIZE
	button.alignment = HORIZONTAL_ALIGNMENT_CENTER
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.add_theme_font_size_override("font_size", 26)
	if primary:
		button.add_theme_stylebox_override("normal", _create_move_button_style(Color(0.31, 0.31, 0.29, 0.98), ACCENT_COLOR))
		button.add_theme_stylebox_override("hover", _create_move_button_style(Color(0.38, 0.38, 0.35, 0.98), Color(0.74, 0.74, 0.70)))
		button.add_theme_stylebox_override("pressed", _create_move_button_style(Color(0.25, 0.25, 0.23, 0.98), Color(0.78, 0.78, 0.74)))
	else:
		button.add_theme_stylebox_override("normal", _create_move_button_style(Color(0.12, 0.12, 0.11, 0.94), Color(0.30, 0.30, 0.28, 0.86)))
		button.add_theme_stylebox_override("hover", _create_move_button_style(Color(0.17, 0.17, 0.15, 0.96), Color(0.48, 0.48, 0.44, 0.92)))
		button.add_theme_stylebox_override("pressed", _create_move_button_style(Color(0.09, 0.09, 0.08, 0.96), Color(0.56, 0.56, 0.52, 0.92)))
	return button


func _configure_move_confirm_button_navigation() -> void:
	if _move_confirm_yes_button == null or _move_confirm_no_button == null:
		return
	_move_confirm_yes_button.focus_neighbor_right = _move_confirm_yes_button.get_path_to(_move_confirm_no_button)
	_move_confirm_yes_button.focus_next = _move_confirm_yes_button.focus_neighbor_right
	_move_confirm_no_button.focus_neighbor_left = _move_confirm_no_button.get_path_to(_move_confirm_yes_button)
	_move_confirm_no_button.focus_previous = _move_confirm_no_button.focus_neighbor_left


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


func _read_payload(payload: Dictionary) -> void:
	_dialogue_id = String(payload.get("dialogue_id", "")).strip_edges()
	_current_dialogue_id = _dialogue_id
	_chapter_id = String(payload.get("chapter_id", "")).strip_edges()
	_chapter_title = String(payload.get("chapter_title", "")).strip_edges()


func _rebuild_chapter_canvas() -> void:
	_chapter = _resolve_chapter()
	_chapter_id = String(_chapter.get("id", _chapter_id)).strip_edges()
	_chapter_title = String(_chapter.get("title", _chapter_title)).strip_edges()
	_dialogue_ids = _resolve_chapter_dialogue_ids()
	_dialogues.clear()
	_connections.clear()

	for dialogue_id in _dialogue_ids:
		if not VisualNovelData.has_dialogue(StringName(dialogue_id)):
			continue
		var dialogue: Dictionary = VisualNovelData.get_dialogue(StringName(dialogue_id))
		_dialogues[dialogue_id] = _make_dialogue_record(dialogue_id, dialogue)

	_dialogue_ids = _dialogue_ids.filter(func(id: String) -> bool:
		return _dialogues.has(id)
	)
	_positions = _resolve_positions()
	_connections = _resolve_connections()

	if _selected_dialogue_id.is_empty() or not _dialogues.has(_selected_dialogue_id):
		if _dialogues.has(_current_dialogue_id):
			_selected_dialogue_id = _current_dialogue_id
		elif not _dialogue_ids.is_empty():
			_selected_dialogue_id = _dialogue_ids[0]


func _resolve_chapter() -> Dictionary:
	if not _chapter_id.is_empty() and VisualNovelData.has_chapter(StringName(_chapter_id)):
		return VisualNovelData.get_chapter(StringName(_chapter_id))

	if not _dialogue_id.is_empty():
		for raw_chapter in VisualNovelData.get_all_chapters():
			if typeof(raw_chapter) != TYPE_DICTIONARY:
				continue
			var chapter: Dictionary = raw_chapter
			if _chapter_contains_dialogue(chapter, _dialogue_id):
				return chapter

	var chapters := VisualNovelData.get_all_chapters()
	if not chapters.is_empty() and typeof(chapters[0]) == TYPE_DICTIONARY:
		return chapters[0]
	return {}


func _chapter_contains_dialogue(chapter: Dictionary, dialogue_id: String) -> bool:
	if String(chapter.get("start_dialogue", "")).strip_edges() == dialogue_id:
		return true
	var raw_dialogues: Variant = chapter.get("dialogues", [])
	if typeof(raw_dialogues) != TYPE_ARRAY:
		return false
	var ids: Array = raw_dialogues
	return ids.has(dialogue_id)


func _resolve_chapter_dialogue_ids() -> Array[String]:
	var ids: Array[String] = []
	var raw_dialogues: Variant = _chapter.get("dialogues", [])
	if typeof(raw_dialogues) == TYPE_ARRAY:
		for raw_id in raw_dialogues as Array:
			_append_unique_id(ids, String(raw_id).strip_edges())

	var start_dialogue := String(_chapter.get("start_dialogue", "")).strip_edges()
	if not start_dialogue.is_empty() and not ids.has(start_dialogue):
		ids.insert(0, start_dialogue)
	if ids.is_empty() and not _dialogue_id.is_empty():
		ids.append(_dialogue_id)
	return ids


func _make_dialogue_record(dialogue_id: String, dialogue: Dictionary) -> Dictionary:
	var metadata := _get_metadata(dialogue)
	var next_dialogue := String(metadata.get("next_dialogue", "")).strip_edges()
	var source_path := String(dialogue.get("source_path", ""))
	var filename := source_path.get_file() if not source_path.is_empty() else "%s.json" % dialogue_id
	var node_count := _get_dialogue_node_count(dialogue)
	var mode := "statement" if _is_statement_dialogue(dialogue) else "normal"
	return {
		"id": dialogue_id,
		"label": String(dialogue.get("label", dialogue_id)).strip_edges(),
		"filename": filename,
		"preview": _get_dialogue_preview(dialogue),
		"node_count": node_count,
		"mode": mode,
		"next": next_dialogue,
	}


func _get_metadata(data: Dictionary) -> Dictionary:
	var raw_metadata: Variant = data.get("metadata", {})
	if typeof(raw_metadata) == TYPE_DICTIONARY:
		return raw_metadata
	return {}


func _get_dialogue_node_count(dialogue: Dictionary) -> int:
	var count := 0
	var raw_nodes: Variant = dialogue.get("nodes", [])
	if typeof(raw_nodes) == TYPE_ARRAY:
		count += (raw_nodes as Array).size()
	var raw_statement_nodes: Variant = dialogue.get("statement_nodes", [])
	if typeof(raw_statement_nodes) == TYPE_ARRAY:
		count += (raw_statement_nodes as Array).size()
	return count


func _is_statement_dialogue(dialogue: Dictionary) -> bool:
	var metadata := _get_metadata(dialogue)
	if String(metadata.get("presentation_mode", "")).strip_edges() == "statement":
		return true
	var raw_statement_nodes: Variant = dialogue.get("statement_nodes", [])
	return typeof(raw_statement_nodes) == TYPE_ARRAY and not (raw_statement_nodes as Array).is_empty()


func _get_dialogue_preview(dialogue: Dictionary) -> String:
	var node := _get_first_dialogue_node(dialogue)
	if node.is_empty():
		return "본문 없음"
	return _ellipsize(_sanitize_text(String(node.get("text", ""))), 72)


func _get_first_dialogue_node(dialogue: Dictionary) -> Dictionary:
	var raw_nodes: Variant = dialogue.get("nodes", [])
	if typeof(raw_nodes) == TYPE_ARRAY:
		var nodes: Array = raw_nodes
		for raw_node in nodes:
			if typeof(raw_node) == TYPE_DICTIONARY:
				return raw_node
	var raw_statement_nodes: Variant = dialogue.get("statement_nodes", [])
	if typeof(raw_statement_nodes) == TYPE_ARRAY:
		var statement_nodes: Array = raw_statement_nodes
		for raw_node in statement_nodes:
			if typeof(raw_node) == TYPE_DICTIONARY:
				return raw_node
	return {}


func _resolve_positions() -> Dictionary:
	var result: Dictionary = {}
	var saved_positions := _get_saved_positions()
	var ordered_ids := _get_auto_ordered_dialogue_ids()
	for index in ordered_ids.size():
		var dialogue_id: String = ordered_ids[index]
		var position := _read_saved_position(saved_positions, dialogue_id)
		if position == Vector2.INF:
			position = Vector2(120.0 + float(index) * AUTO_NODE_GAP.x, 150.0 + float(index % 2) * AUTO_NODE_GAP.y)
		result[dialogue_id] = position

	var bounds := _get_position_bounds(result)
	var offset := CANVAS_MARGIN - bounds.position
	for dialogue_id in result.keys():
		result[dialogue_id] = Vector2(result[dialogue_id]) + offset

	var canvas_size := Vector2(
		maxf(bounds.size.x + CANVAS_MARGIN.x * 2.0 + NODE_SIZE.x, 1180.0),
		maxf(bounds.size.y + CANVAS_MARGIN.y * 2.0 + NODE_SIZE.y, 680.0)
	)
	if _tree_canvas != null:
		_tree_canvas.custom_minimum_size = canvas_size
		_tree_canvas.size = canvas_size
	return result


func _get_saved_positions() -> Dictionary:
	var raw_layout: Variant = _chapter.get("layout", {})
	if typeof(raw_layout) != TYPE_DICTIONARY:
		return {}
	var layout: Dictionary = raw_layout
	var raw_positions: Variant = layout.get("positions", {})
	if typeof(raw_positions) == TYPE_DICTIONARY:
		return raw_positions
	return {}


func _read_saved_position(saved_positions: Dictionary, dialogue_id: String) -> Vector2:
	if not saved_positions.has(dialogue_id):
		return Vector2.INF
	var raw_position: Variant = saved_positions[dialogue_id]
	if typeof(raw_position) != TYPE_ARRAY:
		return Vector2.INF
	var values: Array = raw_position
	if values.size() < 2:
		return Vector2.INF
	return Vector2(float(values[0]), float(values[1]))


func _get_auto_ordered_dialogue_ids() -> Array[String]:
	var ordered: Array[String] = []
	var start_dialogue := String(_chapter.get("start_dialogue", "")).strip_edges()
	if start_dialogue.is_empty():
		start_dialogue = _dialogue_ids[0] if not _dialogue_ids.is_empty() else ""

	var seen: Dictionary = {}
	var cursor := start_dialogue
	while not cursor.is_empty() and _dialogue_ids.has(cursor) and not seen.has(cursor):
		seen[cursor] = true
		ordered.append(cursor)
		if not _dialogues.has(cursor):
			break
		var record: Dictionary = _dialogues[cursor]
		cursor = String(record.get("next", "")).strip_edges()

	for dialogue_id in _dialogue_ids:
		_append_unique_id(ordered, dialogue_id)
	return ordered


func _get_position_bounds(positions: Dictionary) -> Rect2:
	if positions.is_empty():
		return Rect2(Vector2.ZERO, Vector2.ZERO)

	var min_position := Vector2(INF, INF)
	var max_position := Vector2(-INF, -INF)
	for raw_position in positions.values():
		var position := Vector2(raw_position)
		min_position.x = minf(min_position.x, position.x)
		min_position.y = minf(min_position.y, position.y)
		max_position.x = maxf(max_position.x, position.x)
		max_position.y = maxf(max_position.y, position.y)
	return Rect2(min_position, max_position - min_position)


func _resolve_connections() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for dialogue_id in _dialogue_ids:
		if not _dialogues.has(dialogue_id):
			continue
		var record: Dictionary = _dialogues[dialogue_id]
		var next_id := String(record.get("next", "")).strip_edges()
		if next_id.is_empty() or not _dialogues.has(next_id):
			continue
		result.append({
			"from": dialogue_id,
			"to": next_id,
		})
	return result


func _render_canvas() -> void:
	if _node_layer == null or _connection_layer == null:
		return
	for child in _node_layer.get_children():
		_node_layer.remove_child(child)
		child.queue_free()

	for dialogue_id in _dialogue_ids:
		if not _dialogues.has(dialogue_id):
			continue
		var button := _create_dialogue_button(dialogue_id)
		_node_layer.add_child(button)

	_connection_layer.set_connections(_make_connection_draw_data())
	call_deferred("_scroll_selected_into_view")


func _create_dialogue_button(dialogue_id: String) -> Button:
	var record: Dictionary = _dialogues[dialogue_id]
	var button := Button.new()
	button.name = "%sDialogueNode" % _make_safe_node_name(dialogue_id)
	button.text = ""
	button.position = _positions.get(dialogue_id, Vector2.ZERO)
	button.size = NODE_SIZE
	button.custom_minimum_size = NODE_SIZE
	button.focus_mode = Control.FOCUS_ALL
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.pressed.connect(_select_dialogue.bind(dialogue_id))
	button.focus_entered.connect(_select_dialogue.bind(dialogue_id))
	_apply_dialogue_button_style(button, dialogue_id)

	var margin := MarginContainer.new()
	margin.name = "ContentMargin"
	margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 16)
	margin.add_theme_constant_override("margin_top", 13)
	margin.add_theme_constant_override("margin_right", 16)
	margin.add_theme_constant_override("margin_bottom", 12)
	button.add_child(margin)

	var content := VBoxContainer.new()
	content.name = "Content"
	content.mouse_filter = Control.MOUSE_FILTER_IGNORE
	content.add_theme_constant_override("separation", 6)
	margin.add_child(content)

	var top_line := HBoxContainer.new()
	top_line.name = "TopLine"
	top_line.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top_line.add_theme_constant_override("separation", 8)
	content.add_child(top_line)

	var title := Label.new()
	title.name = "Title"
	title.text = _ellipsize(String(record.get("label", dialogue_id)), 24)
	title.clip_text = true
	title.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	title.add_theme_font_size_override("font_size", 21)
	title.add_theme_color_override("font_color", _get_dialogue_text_color(dialogue_id))
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_line.add_child(title)

	var badge := Label.new()
	badge.name = "ModeBadge"
	badge.text = "진술" if String(record.get("mode", "")) == "statement" else "일반"
	badge.add_theme_font_size_override("font_size", 14)
	badge.add_theme_color_override("font_color", _get_dialogue_muted_color(dialogue_id))
	top_line.add_child(badge)

	var file := Label.new()
	file.name = "File"
	file.text = _ellipsize("%s · %s" % [dialogue_id, String(record.get("filename", ""))], 42)
	file.clip_text = true
	file.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	file.add_theme_font_size_override("font_size", 14)
	file.add_theme_color_override("font_color", _get_dialogue_muted_color(dialogue_id))
	content.add_child(file)

	var preview := Label.new()
	preview.name = "Preview"
	preview.text = _ellipsize(String(record.get("preview", "본문 없음")), 56)
	preview.clip_text = true
	preview.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	preview.add_theme_font_size_override("font_size", 17)
	preview.add_theme_color_override("font_color", Color(0.74, 0.71, 0.64))
	preview.size_flags_vertical = Control.SIZE_EXPAND_FILL
	content.add_child(preview)

	var footer := HBoxContainer.new()
	footer.name = "Footer"
	footer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	footer.add_theme_constant_override("separation", 8)
	content.add_child(footer)

	var next_label := Label.new()
	next_label.name = "Next"
	var next_id := String(record.get("next", "")).strip_edges()
	next_label.text = _ellipsize("next: %s" % (next_id if not next_id.is_empty() else "끝"), 28)
	next_label.clip_text = true
	next_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	next_label.add_theme_font_size_override("font_size", 13)
	next_label.add_theme_color_override("font_color", _get_dialogue_muted_color(dialogue_id))
	next_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	footer.add_child(next_label)

	var count := Label.new()
	count.name = "NodeCount"
	count.text = "%d nodes" % int(record.get("node_count", 0))
	count.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	count.add_theme_font_size_override("font_size", 13)
	count.add_theme_color_override("font_color", _get_dialogue_muted_color(dialogue_id))
	footer.add_child(count)
	return button


func _apply_dialogue_button_style(button: Button, dialogue_id: String) -> void:
	var selected := dialogue_id == _selected_dialogue_id
	button.add_theme_stylebox_override("normal", _create_dialogue_node_style(dialogue_id, selected, false))
	button.add_theme_stylebox_override("hover", _create_dialogue_node_style(dialogue_id, true, false))
	button.add_theme_stylebox_override("pressed", _create_dialogue_node_style(dialogue_id, true, true))
	button.add_theme_stylebox_override("focus", _create_dialogue_node_style(dialogue_id, true, false))


func _make_connection_draw_data() -> Array[Dictionary]:
	var draw_data: Array[Dictionary] = []
	for connection in _connections:
		var from_id := String(connection.get("from", ""))
		var to_id := String(connection.get("to", ""))
		if not _positions.has(from_id) or not _positions.has(to_id):
			continue
		var from_rect := Rect2(_positions[from_id], NODE_SIZE)
		var to_rect := Rect2(_positions[to_id], NODE_SIZE)
		draw_data.append({
			"from": from_rect.position + Vector2(NODE_SIZE.x, NODE_SIZE.y * 0.5),
			"to": to_rect.position + Vector2(0.0, NODE_SIZE.y * 0.5),
			"active": from_id == _current_dialogue_id or to_id == _current_dialogue_id,
		})
	return draw_data


func _select_dialogue(dialogue_id: String) -> void:
	if dialogue_id.is_empty() or not _dialogues.has(dialogue_id):
		return
	_selected_dialogue_id = dialogue_id
	_render_canvas()
	_refresh_inspector()


func _refresh_header() -> void:
	var chapter_order := _get_chapter_order()
	if _file_number_label != null:
		_file_number_label.text = "사건 파일 #%02d" % chapter_order
	if _case_title_label != null:
		_case_title_label.text = _chapter_title if not _chapter_title.is_empty() else "챕터 캔버스"
	if _chapter_number_label != null:
		_chapter_number_label.text = "챕터 %d" % chapter_order
	if _chapter_title_label != null:
		_chapter_title_label.text = _chapter_title if not _chapter_title.is_empty() else _chapter_id


func _refresh_inspector() -> void:
	if _chapter_description_label == null:
		return

	var cover_texture := _get_chapter_cover_texture()
	if _cover_texture != null:
		_cover_texture.texture = cover_texture
		_cover_texture.visible = cover_texture != null
	if _cover_placeholder != null:
		_cover_placeholder.visible = cover_texture == null

	var description := String(_chapter.get("description", "")).strip_edges()
	_chapter_description_label.text = description if not description.is_empty() else "챕터 설명이 아직 없습니다."
	_chapter_stats_label.text = "대화 %d개 · 연결 %d개 · 시작: %s" % [
		_dialogue_ids.size(),
		_connections.size(),
		String(_chapter.get("start_dialogue", "미지정")).strip_edges(),
	]

	if _selected_dialogue_id.is_empty() or not _dialogues.has(_selected_dialogue_id):
		_selected_dialogue_title.text = "선택된 대화 없음"
		_selected_dialogue_meta.text = ""
		_selected_dialogue_preview.text = ""
		_refresh_selected_dialogue_move_button()
		return

	var record: Dictionary = _dialogues[_selected_dialogue_id]
	var mode_text := "진술" if String(record.get("mode", "")) == "statement" else "일반"
	var next_id := String(record.get("next", "")).strip_edges()
	_selected_dialogue_title.text = String(record.get("label", _selected_dialogue_id))
	_selected_dialogue_meta.text = "%s · %s · %d nodes · next: %s" % [
		_selected_dialogue_id,
		mode_text,
		int(record.get("node_count", 0)),
		next_id if not next_id.is_empty() else "끝",
	]
	_selected_dialogue_preview.text = String(record.get("preview", "본문 없음"))
	_refresh_selected_dialogue_move_button()


func _refresh_selected_dialogue_move_button() -> void:
	if _selected_dialogue_move_button == null:
		return

	var can_move := _can_move_to_selected_dialogue()
	_selected_dialogue_move_button.disabled = not can_move
	_selected_dialogue_move_button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND if can_move else Control.CURSOR_ARROW
	if _selected_dialogue_id.is_empty() or not _dialogues.has(_selected_dialogue_id):
		_selected_dialogue_move_button.tooltip_text = "대화를 선택하세요."
	elif _selected_dialogue_id == _current_dialogue_id:
		_selected_dialogue_move_button.tooltip_text = "현재 대화입니다."
	else:
		_selected_dialogue_move_button.tooltip_text = "선택한 대화로 이동"


func _can_move_to_selected_dialogue() -> bool:
	return not _selected_dialogue_id.is_empty() \
		and _dialogues.has(_selected_dialogue_id) \
		and _selected_dialogue_id != _current_dialogue_id


func _on_move_to_dialogue_pressed() -> void:
	if not _can_move_to_selected_dialogue():
		return
	_show_move_confirm_dialog()


func _show_move_confirm_dialog() -> void:
	if _move_confirm_overlay == null or not _can_move_to_selected_dialogue():
		return

	_pending_move_dialogue_id = _selected_dialogue_id
	if _move_confirm_body_label != null:
		var record: Dictionary = _dialogues.get(_pending_move_dialogue_id, {})
		var label := String(record.get("label", _pending_move_dialogue_id)).strip_edges()
		_move_confirm_body_label.text = "%s 분기로 이동합니다." % (label if not label.is_empty() else _pending_move_dialogue_id)

	_move_confirm_overlay.visible = true
	_move_confirm_overlay.modulate.a = 0.0
	_move_confirm_overlay.move_to_front()
	var tween := create_tween()
	tween.set_ease(Tween.EASE_OUT)
	tween.set_trans(Tween.TRANS_SINE)
	tween.tween_property(_move_confirm_overlay, "modulate:a", 1.0, 0.12)
	if _move_confirm_yes_button != null and _is_navigation_input_mode_active():
		set_preferred_focus_control(_move_confirm_yes_button)
		_move_confirm_yes_button.grab_focus()


func _hide_move_confirm_dialog() -> void:
	if _move_confirm_overlay != null:
		_move_confirm_overlay.visible = false
		_move_confirm_overlay.modulate.a = 0.0
	_pending_move_dialogue_id = ""
	if _selected_dialogue_move_button != null and _is_navigation_input_mode_active():
		set_preferred_focus_control(_selected_dialogue_move_button)
		_selected_dialogue_move_button.grab_focus()


func _is_move_confirm_open() -> bool:
	return _move_confirm_overlay != null and _move_confirm_overlay.visible


func _on_move_confirm_yes_pressed() -> void:
	if _moving_to_dialogue:
		return
	var target_dialogue_id := _pending_move_dialogue_id.strip_edges()
	if target_dialogue_id.is_empty() or not _dialogues.has(target_dialogue_id) or target_dialogue_id == _current_dialogue_id:
		_hide_move_confirm_dialog()
		return

	var payload := _make_move_payload(target_dialogue_id)
	_moving_to_dialogue = true
	_pending_move_dialogue_id = ""
	if _move_confirm_overlay != null:
		_move_confirm_overlay.visible = false
		_move_confirm_overlay.modulate.a = 0.0
	set_process_input(false)
	set_process_unhandled_input(false)
	var focus_owner := get_viewport().gui_get_focus_owner()
	if focus_owner != null and is_ancestor_of(focus_owner):
		focus_owner.release_focus()
	_play_branch_transition(payload)


func _make_move_payload(target_dialogue_id: String) -> Dictionary:
	var payload := {
		"dialogue_id": target_dialogue_id,
	}
	if not _chapter_id.is_empty():
		payload["chapter_id"] = _chapter_id
	if not _chapter_title.is_empty():
		payload["chapter_title"] = _chapter_title
	return payload


func _play_branch_transition(payload: Dictionary) -> void:
	if _branch_transition_overlay == null or _branch_transition_layer == null:
		request_screen_change("story_dialogue", payload)
		return

	if _branch_transition_tween != null:
		_branch_transition_tween.kill()
		_branch_transition_tween = null

	_branch_transition_overlay.visible = true
	_branch_transition_overlay.modulate.a = 0.0
	_branch_transition_overlay.move_to_front()
	_branch_transition_layer.progress = 0.0

	_branch_transition_tween = create_tween()
	_branch_transition_tween.set_ease(Tween.EASE_IN_OUT)
	_branch_transition_tween.set_trans(Tween.TRANS_CUBIC)
	_branch_transition_tween.tween_property(_branch_transition_overlay, "modulate:a", 1.0, 0.18)
	_branch_transition_tween.parallel().tween_property(_branch_transition_layer, "progress", 1.0, BRANCH_TRANSITION_DURATION)
	_branch_transition_tween.tween_interval(BRANCH_TRANSITION_HOLD_DURATION)
	_branch_transition_tween.finished.connect(func() -> void:
		_branch_transition_tween = null
		request_screen_change("story_dialogue", payload)
	, CONNECT_ONE_SHOT)


func _get_chapter_cover_texture() -> Texture2D:
	var image_path := _get_chapter_cover_path()
	if image_path.is_empty():
		return null
	return load(image_path) as Texture2D


func _get_chapter_cover_path() -> String:
	for key in ["image", "cover_image", "representative_image", "thumbnail"]:
		var value := String(_chapter.get(key, "")).strip_edges()
		if not value.is_empty():
			return value
	var metadata := _get_metadata(_chapter)
	for key in ["image", "cover_image", "representative_image", "thumbnail"]:
		var value := String(metadata.get(key, "")).strip_edges()
		if not value.is_empty():
			return value
	return ""


func _get_chapter_order() -> int:
	return maxi(1, int(_chapter.get("order", 1)))


func _get_dialogue_text_color(dialogue_id: String) -> Color:
	if dialogue_id == _current_dialogue_id:
		return CURRENT_COLOR
	if dialogue_id == String(_chapter.get("start_dialogue", "")).strip_edges():
		return START_COLOR
	return TEXT_COLOR


func _get_dialogue_muted_color(dialogue_id: String) -> Color:
	if dialogue_id == _current_dialogue_id:
		return Color(CURRENT_COLOR.r, CURRENT_COLOR.g, CURRENT_COLOR.b, 0.82)
	if dialogue_id == String(_chapter.get("start_dialogue", "")).strip_edges():
		return Color(START_COLOR.r, START_COLOR.g, START_COLOR.b, 0.82)
	return MUTED_TEXT_COLOR


func _scroll_selected_into_view() -> void:
	await get_tree().process_frame
	if _scroll == null or _selected_dialogue_id.is_empty() or not _positions.has(_selected_dialogue_id):
		return
	var position: Vector2 = _positions[_selected_dialogue_id]
	_scroll.scroll_horizontal = maxi(0, int(position.x - _scroll.size.x * 0.35))
	_scroll.scroll_vertical = maxi(0, int(position.y - _scroll.size.y * 0.35))


func _layout_panel(apply_immediate: bool) -> void:
	if _panel == null:
		return

	var viewport_size := size
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		viewport_size = get_viewport().get_visible_rect().size
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return

	var available_width := maxf(1.0, viewport_size.x - PANEL_MARGIN * 2.0)
	var panel_width := minf(PANEL_MAX_WIDTH, available_width)
	var panel_height := maxf(1.0, viewport_size.y - PANEL_MARGIN * 2.0)
	_panel_final_rect = Rect2(
		Vector2((viewport_size.x - panel_width) * 0.5, PANEL_MARGIN),
		Vector2(panel_width, panel_height)
	)

	if apply_immediate:
		_apply_panel_rect(_panel_final_rect)


func _apply_panel_rect(rect: Rect2) -> void:
	if _panel == null:
		return
	_panel.set_anchors_preset(Control.PRESET_TOP_LEFT)
	_panel.offset_left = rect.position.x
	_panel.offset_top = rect.position.y
	_panel.offset_right = rect.position.x + rect.size.x
	_panel.offset_bottom = rect.position.y + rect.size.y


func _refresh_responsive_layout() -> void:
	if _inspector_panel == null or _content_split == null:
		return
	var available_width := _panel_final_rect.size.x - float(CONTENT_MARGIN * 2)
	var inspector_width := clampf(available_width * 0.30, INSPECTOR_MIN_WIDTH, INSPECTOR_WIDTH)
	_inspector_panel.custom_minimum_size = Vector2(inspector_width, 0.0)
	_content_split.add_theme_constant_override("separation", 14 if available_width < 1280.0 else 18)


func _close_screen() -> void:
	if _panel == null or _backdrop == null:
		close_requested.emit()
		return

	_closing = true
	set_process_input(false)
	set_process_unhandled_input(false)
	var focus_owner := get_viewport().gui_get_focus_owner()
	if focus_owner != null and is_ancestor_of(focus_owner):
		focus_owner.release_focus()

	close_requested.emit()


func _refresh_close_affordance() -> void:
	var mode := _get_current_input_mode()
	var pointer_mode := mode == INPUT_MODE_MOUSE or mode == "touch" or mode.is_empty()
	if _close_button != null:
		_close_button.visible = pointer_mode
		_close_button.mouse_filter = Control.MOUSE_FILTER_STOP if pointer_mode else Control.MOUSE_FILTER_IGNORE
	if _close_hint != null:
		_close_hint.visible = not pointer_mode

	if pointer_mode:
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
		or event.is_action_pressed("tree") \
		or event.is_action_pressed("menu")


func _create_panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = PANEL_COLOR
	style.border_color = PANEL_BORDER_COLOR
	style.set_border_width_all(2)
	style.set_corner_radius_all(6)
	style.shadow_color = Color(0, 0, 0, 0.42)
	style.shadow_size = 20
	return style


func _create_surface_style(bg_color: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = bg_color
	style.border_color = SURFACE_BORDER_COLOR
	style.set_border_width_all(1)
	style.set_corner_radius_all(6)
	style.shadow_color = Color(0, 0, 0, 0.24)
	style.shadow_size = 10
	return style


func _create_preview_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.024, 0.023, 0.022, 0.96)
	style.border_color = Color(0.33, 0.31, 0.28, 0.86)
	style.set_border_width_all(1)
	style.set_corner_radius_all(5)
	return style


func _create_dialogue_node_style(dialogue_id: String, selected: bool, pressed: bool) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	var bg := Color(0.082, 0.077, 0.069, 0.94)
	var border := Color(0.28, 0.27, 0.24, 0.88)
	if dialogue_id == _current_dialogue_id:
		bg = Color(0.15, 0.118, 0.078, 0.96)
		border = CURRENT_COLOR
	elif dialogue_id == String(_chapter.get("start_dialogue", "")).strip_edges():
		bg = Color(0.108, 0.096, 0.074, 0.96)
		border = START_COLOR
	if selected:
		bg = bg.lightened(0.07)
		border = ACCENT_COLOR if dialogue_id != _current_dialogue_id else CURRENT_COLOR
	if pressed:
		bg = bg.darkened(0.05)
	style.bg_color = bg
	style.border_color = border
	style.set_border_width_all(2 if selected else 1)
	style.set_corner_radius_all(6)
	style.content_margin_left = 0
	style.content_margin_right = 0
	style.content_margin_top = 0
	style.content_margin_bottom = 0
	style.shadow_color = Color(0, 0, 0, 0.28)
	style.shadow_size = 8 if selected else 4
	return style


func _create_move_button_style(bg_color: Color, border_color: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = bg_color
	style.border_color = border_color
	style.set_border_width_all(1)
	style.set_corner_radius_all(6)
	style.content_margin_left = 18
	style.content_margin_right = 18
	style.content_margin_top = 8
	style.content_margin_bottom = 8
	return style


func _create_ghost_button_style(bg_color: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = bg_color
	style.border_color = Color(1, 1, 1, 0.0)
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


func _sanitize_text(text: String) -> String:
	return text.replace("[", "").replace("]", "").replace("|", " ").strip_edges()


func _ellipsize(text: String, max_length: int) -> String:
	if text.length() <= max_length:
		return text
	return "%s..." % text.substr(0, max_length - 3)


func _append_unique_id(ids: Array[String], value: String) -> void:
	var clean_value := value.strip_edges()
	if clean_value.is_empty() or ids.has(clean_value):
		return
	ids.append(clean_value)


func _make_safe_node_name(text: String) -> String:
	var result := ""
	for index in text.length():
		var character := text.substr(index, 1)
		if character.is_valid_identifier() or character.is_valid_int():
			result += character
		else:
			result += "_"
	return result if not result.is_empty() else "Node"


func _on_input_mode_changed(mode: String) -> void:
	super._on_input_mode_changed(mode)
	_refresh_close_affordance()

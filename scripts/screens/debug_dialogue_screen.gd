extends "res://scripts/screens/screen_base.gd"

const BACKDROP_COLOR := Color(0, 0, 0, 0.64)
const PANEL_COLOR := Color(0.06, 0.056, 0.05, 0.97)
const PANEL_BORDER_COLOR := Color(0.36, 0.34, 0.29, 0.92)
const TEXT_COLOR := Color(0.9, 0.88, 0.82)
const MUTED_TEXT_COLOR := Color(0.62, 0.6, 0.55)
const ACCENT_COLOR := Color(0.72, 0.95, 0.86)
const PANEL_MAX_WIDTH := 1620.0
const PANEL_MAX_HEIGHT := 910.0
const PANEL_MARGIN := Vector2(48.0, 46.0)
const CLOSE_ICON_HEIGHT := 30
const MOVE_HINT_ICON_HEIGHT := 30
const KEYCAP_BACKGROUND_COLOR := Color(0.18, 0.17, 0.15, 0.94)
const KEYCAP_BORDER_COLOR := Color(0.42, 0.4, 0.35)
const INPUT_ICON_PATHS := {
	"xbox_a": "res://assets/icon/input/xbox_button_color_a_outline.png",
	"xbox_b": "res://assets/icon/input/xbox_button_color_b_outline.png",
}

var _current_dialogue_id := ""
var _current_node_id := ""
var _chapter_id := ""
var _chapter_title := ""
var _opened_frame := -1
var _moving := false

var _backdrop: ColorRect
var _panel: PanelContainer
var _tree: Tree
var _status_label: Label
var _detail_label: Label
var _move_button: Button
var _close_button: Button
var _close_hint: HBoxContainer
var _close_hint_icon: TextureRect
var _close_hint_keycap: PanelContainer
var _close_hint_key_label: Label
var _close_hint_label: Label
var _move_hint: HBoxContainer
var _move_hint_icon: TextureRect
var _move_hint_keycap: PanelContainer
var _move_hint_key_label: Label
var _move_hint_label: Label
var _input_icon_cache: Dictionary = {}
var _selected_entry: Dictionary = {}


func setup(payload: Dictionary = {}) -> void:
	super.setup(payload)
	_read_payload(payload)
	if is_node_ready():
		_reload_tree()


func _ready() -> void:
	screen_id = "debug_dialogue"
	screen_title = "디버그 대사 이동"
	skip_allowed = false
	_opened_frame = Engine.get_process_frames()
	_read_payload(setup_payload)
	VisualNovelData.reload()
	_connect_debug_mode_signal()
	_build()
	_reload_tree()
	_refresh_input_affordances()
	call_deferred("_focus_tree")


func _notification(what: int) -> void:
	super._notification(what)
	if what == NOTIFICATION_RESIZED:
		_layout_panel()


func _input(event: InputEvent) -> void:
	if _should_ignore_gameplay_event(event):
		return
	if _moving:
		get_viewport().set_input_as_handled()
		return

	super._input(event)
	if _is_close_action_pressed(event):
		request_close()
		get_viewport().set_input_as_handled()
		return
	if _is_interact_action_pressed(event):
		_move_to_selected_entry()
		get_viewport().set_input_as_handled()
		return

	if _handle_tree_navigation_input(event):
		get_viewport().set_input_as_handled()


func _build() -> void:
	make_full_rect()

	_backdrop = ColorRect.new()
	_backdrop.name = "Backdrop"
	_backdrop.color = BACKDROP_COLOR
	_backdrop.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_backdrop)

	_panel = PanelContainer.new()
	_panel.name = "DebugDialoguePanel"
	_panel.clip_contents = true
	_panel.add_theme_stylebox_override("panel", _create_panel_style())
	add_child(_panel)
	_layout_panel()

	var outer_margin := MarginContainer.new()
	outer_margin.name = "OuterMargin"
	outer_margin.add_theme_constant_override("margin_left", 28)
	outer_margin.add_theme_constant_override("margin_top", 24)
	outer_margin.add_theme_constant_override("margin_right", 28)
	outer_margin.add_theme_constant_override("margin_bottom", 26)
	_panel.add_child(outer_margin)

	var layout := VBoxContainer.new()
	layout.name = "Layout"
	layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_theme_constant_override("separation", 16)
	outer_margin.add_child(layout)

	var header := HBoxContainer.new()
	header.name = "Header"
	header.alignment = BoxContainer.ALIGNMENT_CENTER
	header.add_theme_constant_override("separation", 16)
	layout.add_child(header)

	var title_group := VBoxContainer.new()
	title_group.name = "TitleGroup"
	title_group.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	title_group.add_theme_constant_override("separation", 2)
	header.add_child(title_group)

	var title := Label.new()
	title.name = "Title"
	title.text = "디버그 대사 이동"
	title.add_theme_font_size_override("font_size", 38)
	title.add_theme_color_override("font_color", TEXT_COLOR)
	title_group.add_child(title)

	_status_label = Label.new()
	_status_label.name = "Status"
	_status_label.text = ""
	_status_label.add_theme_font_size_override("font_size", 18)
	_status_label.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	title_group.add_child(_status_label)

	_close_button = Button.new()
	_close_button.name = "CloseButton"
	_close_button.text = ""
	_close_button.icon = _get_mui_icon("CloseRounded", CLOSE_ICON_HEIGHT, TEXT_COLOR)
	_close_button.expand_icon = false
	_close_button.alignment = HORIZONTAL_ALIGNMENT_CENTER
	_close_button.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_close_button.custom_minimum_size = Vector2(60, 60)
	_close_button.focus_mode = Control.FOCUS_NONE
	_close_button.add_theme_constant_override("icon_max_width", CLOSE_ICON_HEIGHT)
	_close_button.pressed.connect(request_close)
	header.add_child(_close_button)

	_close_hint = _create_close_hint()
	header.add_child(_close_hint)

	_tree = Tree.new()
	_tree.name = "DialogueTree"
	_tree.columns = 3
	_tree.hide_root = true
	_tree.column_titles_visible = true
	_tree.set_column_title(0, "대사")
	_tree.set_column_title(1, "화자")
	_tree.set_column_title(2, "파일")
	_tree.set_column_expand(0, true)
	_tree.set_column_expand(1, false)
	_tree.set_column_expand(2, false)
	_tree.set_column_custom_minimum_width(1, 180)
	_tree.set_column_custom_minimum_width(2, 280)
	_tree.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_tree.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_tree.focus_mode = Control.FOCUS_ALL
	_tree.item_selected.connect(_on_tree_item_selected)
	_tree.item_activated.connect(_on_tree_item_activated)
	layout.add_child(_tree)

	var footer := HBoxContainer.new()
	footer.name = "Footer"
	footer.alignment = BoxContainer.ALIGNMENT_CENTER
	footer.add_theme_constant_override("separation", 14)
	layout.add_child(footer)

	_detail_label = Label.new()
	_detail_label.name = "SelectionDetail"
	_detail_label.text = "이동할 대사를 선택하세요."
	_detail_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_detail_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_detail_label.add_theme_font_size_override("font_size", 20)
	_detail_label.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	footer.add_child(_detail_label)

	_move_button = Button.new()
	_move_button.name = "MoveButton"
	_move_button.text = "이동"
	_move_button.disabled = true
	_move_button.focus_mode = Control.FOCUS_NONE
	_move_button.custom_minimum_size = Vector2(138, 56)
	_move_button.alignment = HORIZONTAL_ALIGNMENT_CENTER
	_move_button.add_theme_font_size_override("font_size", 24)
	_move_button.pressed.connect(_move_to_selected_entry)
	footer.add_child(_move_button)

	_move_hint = _create_move_hint()
	footer.add_child(_move_hint)


func _layout_panel() -> void:
	if _panel == null:
		return
	var viewport_size := get_viewport().get_visible_rect().size
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		viewport_size = Vector2(1920.0, 1080.0)

	var panel_size := Vector2(
		minf(PANEL_MAX_WIDTH, maxf(320.0, viewport_size.x - PANEL_MARGIN.x * 2.0)),
		minf(PANEL_MAX_HEIGHT, maxf(320.0, viewport_size.y - PANEL_MARGIN.y * 2.0))
	)
	var position := (viewport_size - panel_size) * 0.5
	_panel.set_anchors_preset(Control.PRESET_TOP_LEFT)
	_panel.offset_left = roundf(position.x)
	_panel.offset_top = roundf(position.y)
	_panel.offset_right = roundf(position.x + panel_size.x)
	_panel.offset_bottom = roundf(position.y + panel_size.y)


func _read_payload(payload: Dictionary) -> void:
	_current_dialogue_id = String(payload.get("dialogue_id", "")).strip_edges()
	_current_node_id = String(payload.get("current_node_id", payload.get("node_id", ""))).strip_edges()
	_chapter_id = String(payload.get("chapter_id", "")).strip_edges()
	_chapter_title = String(payload.get("chapter_title", "")).strip_edges()


func _connect_debug_mode_signal() -> void:
	var input_router := _get_input_router()
	if input_router == null or not input_router.has_signal("debug_mode_enabled_changed"):
		return
	var callback := Callable(self, "_on_debug_mode_enabled_changed")
	if not input_router.is_connected("debug_mode_enabled_changed", callback):
		input_router.connect("debug_mode_enabled_changed", callback)


func _on_debug_mode_enabled_changed(enabled: bool) -> void:
	if not enabled:
		request_close()


func _reload_tree() -> void:
	if _tree == null:
		return

	_selected_entry.clear()
	_tree.clear()
	var root := _tree.create_item()
	var dialogues := VisualNovelData.get_all_dialogues()
	dialogues.sort_custom(func(a: Variant, b: Variant) -> bool:
		if typeof(a) != TYPE_DICTIONARY or typeof(b) != TYPE_DICTIONARY:
			return false
		var dialogue_a: Dictionary = a
		var dialogue_b: Dictionary = b
		return _dialogue_sort_key(dialogue_a) < _dialogue_sort_key(dialogue_b)
	)

	var dialogue_count := 0
	var line_count := 0
	var current_item: TreeItem

	for raw_dialogue in dialogues:
		if typeof(raw_dialogue) != TYPE_DICTIONARY:
			continue
		var dialogue: Dictionary = raw_dialogue
		var dialogue_id := String(dialogue.get("id", "")).strip_edges()
		if dialogue_id.is_empty():
			continue

		dialogue_count += 1
		var dialogue_label := String(dialogue.get("label", dialogue_id)).strip_edges()
		var filename := _get_dialogue_filename(dialogue)
		var dialogue_item := _tree.create_item(root)
		dialogue_item.set_text(0, "%s  [%s]" % [dialogue_label, dialogue_id])
		dialogue_item.set_text(1, "")
		dialogue_item.set_text(2, filename)
		dialogue_item.set_selectable(0, false)
		dialogue_item.set_selectable(1, false)
		dialogue_item.set_selectable(2, false)
		dialogue_item.set_custom_color(0, ACCENT_COLOR if dialogue_id == _current_dialogue_id else TEXT_COLOR)
		dialogue_item.collapsed = false

		var nodes := _get_ordered_nodes(dialogue)
		for index in nodes.size():
			var node: Dictionary = nodes[index]
			var node_id := String(node.get("id", "")).strip_edges()
			if node_id.is_empty():
				continue

			line_count += 1
			var entry := _make_entry(dialogue, node, index + 1, filename)
			var item := _tree.create_item(dialogue_item)
			item.set_text(0, "#%03d  %s" % [int(entry.get("index", index + 1)), _ellipsize(String(entry.get("text", "")), 112)])
			item.set_text(1, String(entry.get("speaker", "")))
			item.set_text(2, filename)
			item.set_metadata(0, entry)
			item.set_custom_color(0, ACCENT_COLOR if _is_current_entry(entry) else TEXT_COLOR)
			item.set_custom_color(1, MUTED_TEXT_COLOR)
			item.set_custom_color(2, MUTED_TEXT_COLOR)
			if _is_current_entry(entry):
				current_item = item

	if _status_label != null:
		_status_label.text = "%d개 대사파일 / %d개 대사" % [dialogue_count, line_count]
	if _detail_label != null:
		_detail_label.text = "이동할 대사를 선택하세요."
	if _move_button != null:
		_move_button.disabled = true
	_refresh_move_hint()

	if current_item != null:
		_select_tree_item(current_item)
		call_deferred("_focus_tree")


func _make_entry(dialogue: Dictionary, node: Dictionary, index: int, filename: String) -> Dictionary:
	var dialogue_id := String(dialogue.get("id", "")).strip_edges()
	var node_id := String(node.get("id", "")).strip_edges()
	var speaker_id := String(node.get("speaker", "")).strip_edges()
	var text := _clean_debug_text(String(node.get("text", "")))
	var choice_preview := _get_choice_preview(node)
	if text.is_empty() and not choice_preview.is_empty():
		text = "선택지: %s" % choice_preview
	elif not choice_preview.is_empty():
		text = "%s / 선택지: %s" % [text, choice_preview]
	if text.is_empty():
		text = "(빈 대사)"

	return {
		"dialogue_id": dialogue_id,
		"dialogue_label": String(dialogue.get("label", dialogue_id)).strip_edges(),
		"node_id": node_id,
		"index": index,
		"speaker": _get_speaker_display_name(speaker_id),
		"text": text,
		"filename": filename,
	}


func _get_ordered_nodes(dialogue: Dictionary) -> Array:
	var result := []
	var seen := {}
	_append_ordered_nodes(result, seen, dialogue.get("nodes", []))
	_append_ordered_nodes(result, seen, dialogue.get("statement_nodes", []))

	var nodes_by_id: Variant = dialogue.get("_nodes_by_id", {})
	if typeof(nodes_by_id) != TYPE_DICTIONARY:
		return result

	var extra_ids := []
	for raw_id in (nodes_by_id as Dictionary).keys():
		var node_id := String(raw_id).strip_edges()
		if node_id.is_empty() or seen.has(node_id):
			continue
		extra_ids.append(node_id)
	extra_ids.sort()

	for node_id in extra_ids:
		var raw_node: Variant = (nodes_by_id as Dictionary).get(node_id, {})
		if typeof(raw_node) != TYPE_DICTIONARY:
			continue
		seen[node_id] = true
		result.append(raw_node as Dictionary)
	return result


func _append_ordered_nodes(result: Array, seen: Dictionary, raw_nodes: Variant) -> void:
	if typeof(raw_nodes) != TYPE_ARRAY:
		return

	for raw_node in raw_nodes as Array:
		if typeof(raw_node) != TYPE_DICTIONARY:
			continue
		var node: Dictionary = raw_node
		var node_id := String(node.get("id", "")).strip_edges()
		if node_id.is_empty() or seen.has(node_id):
			continue
		seen[node_id] = true
		result.append(node)


func _get_choice_preview(node: Dictionary) -> String:
	var raw_choices: Variant = node.get("choices", [])
	if typeof(raw_choices) != TYPE_ARRAY:
		return ""

	var labels: Array[String] = []
	for raw_choice in raw_choices as Array:
		if typeof(raw_choice) != TYPE_DICTIONARY:
			continue
		var choice: Dictionary = raw_choice
		var text := _clean_debug_text(String(choice.get("text", "")))
		if not text.is_empty():
			labels.append(text)
	return _join_strings(labels, ", ")


func _join_strings(values: Array[String], separator: String) -> String:
	var result := ""
	for value in values:
		if result.is_empty():
			result = value
		else:
			result += "%s%s" % [separator, value]
	return result


func _clean_debug_text(raw_text: String) -> String:
	var result := ""
	var cursor := 0
	while cursor < raw_text.length():
		var open_index := raw_text.find("[", cursor)
		if open_index < 0:
			result += raw_text.substr(cursor)
			break

		var close_index := raw_text.find("]", open_index + 1)
		if close_index < 0:
			result += raw_text.substr(cursor)
			break

		result += raw_text.substr(cursor, open_index - cursor)
		cursor = close_index + 1

	result = result.replace("\r", " ").replace("\n", " ").replace("|", "")
	while result.contains("  "):
		result = result.replace("  ", " ")
	return result.strip_edges()


func _get_speaker_display_name(speaker_id: String) -> String:
	if speaker_id.is_empty() or VisualNovelData.is_narrator_character(StringName(speaker_id)):
		return "지문"
	if VisualNovelData.has_character(StringName(speaker_id)):
		var character: Dictionary = VisualNovelData.get_character(StringName(speaker_id))
		return String(character.get("display_name", speaker_id)).strip_edges()
	return speaker_id


func _dialogue_sort_key(dialogue: Dictionary) -> String:
	var source_path := String(dialogue.get("source_path", ""))
	if not source_path.is_empty():
		return source_path
	return String(dialogue.get("label", dialogue.get("id", "")))


func _get_dialogue_filename(dialogue: Dictionary) -> String:
	var source_path := String(dialogue.get("source_path", ""))
	if not source_path.is_empty():
		return source_path.get_file()
	return "%s.json" % String(dialogue.get("id", "dialogue"))


func _is_current_entry(entry: Dictionary) -> bool:
	return String(entry.get("dialogue_id", "")).strip_edges() == _current_dialogue_id \
		and String(entry.get("node_id", "")).strip_edges() == _current_node_id


func _on_tree_item_selected() -> void:
	_selected_entry = _get_selected_entry()
	var has_entry := not _selected_entry.is_empty()
	if _move_button != null:
		_move_button.disabled = not has_entry
	if _detail_label == null:
		return
	if not has_entry:
		_detail_label.text = "이동할 대사를 선택하세요."
		_refresh_move_hint()
		return

	_detail_label.text = "%s / %s / %s" % [
		String(_selected_entry.get("dialogue_label", "")),
		String(_selected_entry.get("speaker", "")),
		_ellipsize(String(_selected_entry.get("text", "")), 92),
	]
	_refresh_move_hint()


func _on_tree_item_activated() -> void:
	_move_to_selected_entry()


func _get_selected_entry() -> Dictionary:
	if _tree == null:
		return {}
	var item := _tree.get_selected()
	if item == null:
		return {}
	var raw_entry: Variant = item.get_metadata(0)
	if typeof(raw_entry) != TYPE_DICTIONARY:
		return {}
	return (raw_entry as Dictionary).duplicate(true)


func _move_to_selected_entry() -> void:
	if _moving:
		return
	var entry := _selected_entry
	if entry.is_empty():
		entry = _get_selected_entry()
	if entry.is_empty():
		return

	var dialogue_id := String(entry.get("dialogue_id", "")).strip_edges()
	var node_id := String(entry.get("node_id", "")).strip_edges()
	if dialogue_id.is_empty() or node_id.is_empty():
		return

	_moving = true
	var payload := {
		"dialogue_id": dialogue_id,
		"node_id": node_id,
		"target_node_id": node_id,
		"debug_jump": true,
		"rewind_fade": true,
	}
	var target_chapter := _find_chapter_for_dialogue(dialogue_id)
	var target_chapter_id := String(target_chapter.get("id", "")).strip_edges()
	var target_chapter_title := String(target_chapter.get("title", "")).strip_edges()
	if target_chapter_id.is_empty():
		target_chapter_id = _chapter_id
	if target_chapter_title.is_empty():
		target_chapter_title = _chapter_title
	if not target_chapter_id.is_empty():
		payload["chapter_id"] = target_chapter_id
	if not target_chapter_title.is_empty():
		payload["chapter_title"] = target_chapter_title

	request_screen_change("story_dialogue", payload)


func _find_chapter_for_dialogue(dialogue_id: String) -> Dictionary:
	for raw_chapter in VisualNovelData.get_all_chapters():
		if typeof(raw_chapter) != TYPE_DICTIONARY:
			continue
		var chapter: Dictionary = raw_chapter
		if String(chapter.get("start_dialogue", "")).strip_edges() == dialogue_id:
			return chapter
		var raw_dialogues: Variant = chapter.get("dialogues", [])
		if typeof(raw_dialogues) == TYPE_ARRAY and (raw_dialogues as Array).has(dialogue_id):
			return chapter
	return {}


func _focus_tree() -> void:
	if _tree == null or not is_instance_valid(_tree):
		return
	set_preferred_focus_control(_tree)
	if _is_navigation_input_mode_active():
		set_navigation_focus_enabled(true)
		_tree.grab_focus()


func _handle_tree_navigation_input(event: InputEvent) -> bool:
	if not _is_navigation_input_mode_active() or _tree == null:
		return false

	if not _is_navigation_action_event(event):
		return false

	_ensure_tree_focus()

	if _is_tree_up_pressed(event):
		return _navigate_tree_vertical(-1)
	if _is_tree_down_pressed(event):
		return _navigate_tree_vertical(1)
	if _is_tree_left_pressed(event):
		return _navigate_tree_horizontal(-1)
	if _is_tree_right_pressed(event):
		return _navigate_tree_horizontal(1)
	return false


func _ensure_tree_focus() -> void:
	if _tree == null or not is_instance_valid(_tree):
		return
	if get_viewport().gui_get_focus_owner() != _tree:
		set_preferred_focus_control(_tree)
		set_navigation_focus_enabled(true)
		_tree.grab_focus()


func _is_navigation_action_event(event: InputEvent) -> bool:
	if event is InputEventKey:
		var key_event := event as InputEventKey
		return key_event.pressed and not key_event.echo
	if event is InputEventJoypadButton:
		return (event as InputEventJoypadButton).pressed
	if event is InputEventJoypadMotion:
		return absf((event as InputEventJoypadMotion).axis_value) > _get_gamepad_deadzone()
	return false


func _is_tree_up_pressed(event: InputEvent) -> bool:
	return _is_action_pressed_once(event, "move_up") or _is_action_pressed_once(event, "ui_up")


func _is_tree_down_pressed(event: InputEvent) -> bool:
	return _is_action_pressed_once(event, "move_down") or _is_action_pressed_once(event, "ui_down")


func _is_tree_left_pressed(event: InputEvent) -> bool:
	return _is_action_pressed_once(event, "move_left") or _is_action_pressed_once(event, "ui_left")


func _is_tree_right_pressed(event: InputEvent) -> bool:
	return _is_action_pressed_once(event, "move_right") or _is_action_pressed_once(event, "ui_right")


func _navigate_tree_vertical(direction: int) -> bool:
	var current := _tree.get_selected()
	if current == null:
		var first := _find_first_selectable_item()
		if first != null:
			_select_tree_item(first)
			return true
		return false

	var next := current
	while true:
		next = next.get_prev_in_tree() if direction < 0 else next.get_next_in_tree()
		if next == null:
			break
		if _is_selectable_tree_item(next):
			_select_tree_item(next)
			return true
	return false


func _navigate_tree_horizontal(direction: int) -> bool:
	var current := _tree.get_selected()
	if current == null:
		return false

	var parent := current.get_parent()
	if parent == null or _tree.get_root() == parent:
		return false

	if direction < 0:
		if not parent.collapsed:
			parent.collapsed = true
			return true
		return false

	if parent.collapsed:
		parent.collapsed = false
		return true
	return false


func _find_first_selectable_item() -> TreeItem:
	if _tree == null:
		return null
	var root := _tree.get_root()
	if root == null:
		return null
	return _find_first_selectable_in_subtree(root)


func _find_first_selectable_in_subtree(item: TreeItem) -> TreeItem:
	if item == null:
		return null
	if _is_selectable_tree_item(item):
		return item
	var child := item.get_first_child()
	while child != null:
		var found := _find_first_selectable_in_subtree(child)
		if found != null:
			return found
		child = child.get_next()
	return null


func _is_selectable_tree_item(item: TreeItem) -> bool:
	if item == null:
		return false
	return typeof(item.get_metadata(0)) == TYPE_DICTIONARY


func _select_tree_item(item: TreeItem) -> void:
	if _tree == null or item == null:
		return
	_tree.set_selected(item, 0)
	_tree.scroll_to_item(item)
	_on_tree_item_selected()


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


func _create_move_hint() -> HBoxContainer:
	var hint := HBoxContainer.new()
	hint.name = "MoveHint"
	hint.visible = false
	hint.alignment = BoxContainer.ALIGNMENT_CENTER
	hint.add_theme_constant_override("separation", 8)

	_move_hint_icon = TextureRect.new()
	_move_hint_icon.name = "GamepadIcon"
	_move_hint_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_move_hint_icon.custom_minimum_size = Vector2(MOVE_HINT_ICON_HEIGHT, MOVE_HINT_ICON_HEIGHT)
	hint.add_child(_move_hint_icon)

	_move_hint_keycap = PanelContainer.new()
	_move_hint_keycap.name = "KeyboardKeycap"
	_move_hint_keycap.add_theme_stylebox_override("panel", _create_keycap_style())
	hint.add_child(_move_hint_keycap)

	var key_margin := MarginContainer.new()
	key_margin.name = "Margin"
	key_margin.add_theme_constant_override("margin_left", 9)
	key_margin.add_theme_constant_override("margin_top", 2)
	key_margin.add_theme_constant_override("margin_right", 9)
	key_margin.add_theme_constant_override("margin_bottom", 2)
	_move_hint_keycap.add_child(key_margin)

	_move_hint_key_label = Label.new()
	_move_hint_key_label.name = "KeyLabel"
	_move_hint_key_label.text = "Space"
	_move_hint_key_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_move_hint_key_label.add_theme_font_size_override("font_size", 18)
	_move_hint_key_label.add_theme_color_override("font_color", TEXT_COLOR)
	key_margin.add_child(_move_hint_key_label)

	_move_hint_label = Label.new()
	_move_hint_label.name = "MoveLabel"
	_move_hint_label.text = "이동"
	_move_hint_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_move_hint_label.add_theme_font_size_override("font_size", 22)
	_move_hint_label.add_theme_color_override("font_color", TEXT_COLOR)
	hint.add_child(_move_hint_label)

	return hint


func _refresh_input_affordances() -> void:
	var mode := _get_current_input_mode()
	var pointer_mode := mode == INPUT_MODE_MOUSE
	if _close_button != null:
		_close_button.visible = pointer_mode
		_close_button.mouse_filter = Control.MOUSE_FILTER_STOP if pointer_mode else Control.MOUSE_FILTER_IGNORE
	if _close_hint != null:
		_close_hint.visible = not pointer_mode

	if pointer_mode:
		_refresh_move_hint()
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
	_refresh_move_hint()


func _refresh_move_hint() -> void:
	if _move_hint == null:
		return

	var show_hint := _is_navigation_input_mode_active() and not _selected_entry.is_empty()
	_move_hint.visible = show_hint
	if not show_hint:
		return

	var mode := _get_current_input_mode()
	var gamepad_mode := mode == INPUT_MODE_GAMEPAD
	var keyboard_mode := mode == INPUT_MODE_KEYBOARD
	if _move_hint_icon != null:
		_move_hint_icon.visible = gamepad_mode
		_move_hint_icon.texture = _get_input_icon("xbox_a", MOVE_HINT_ICON_HEIGHT) if gamepad_mode else null
	if _move_hint_keycap != null:
		_move_hint_keycap.visible = keyboard_mode
	if _move_hint_key_label != null:
		_move_hint_key_label.text = "Space"
	if _move_hint_label != null:
		_move_hint_label.text = "이동"
	_apply_input_hint_order(_move_hint, _move_hint_icon, _move_hint_keycap, _move_hint_label, mode)


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


func _create_keycap_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = KEYCAP_BACKGROUND_COLOR
	style.border_color = KEYCAP_BORDER_COLOR
	style.set_border_width_all(1)
	style.set_corner_radius_all(4)
	return style


func _on_input_mode_changed(mode: String) -> void:
	super._on_input_mode_changed(mode)
	_refresh_input_affordances()
	call_deferred("_focus_tree")


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


func _is_interact_action_pressed(event: InputEvent) -> bool:
	if event is InputEventKey:
		var key_event := event as InputEventKey
		if not key_event.pressed or key_event.echo:
			return false
	elif event is InputEventJoypadButton:
		if not (event as InputEventJoypadButton).pressed:
			return false
	else:
		return false

	return event.is_action_pressed("interact")


func _ellipsize(text: String, max_length: int) -> String:
	if text.length() <= max_length:
		return text
	if max_length <= 1:
		return text.left(max_length)
	return "%s..." % text.left(max_length - 3)


func _create_panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = PANEL_COLOR
	style.border_color = PANEL_BORDER_COLOR
	style.set_border_width_all(2)
	style.set_corner_radius_all(8)
	style.shadow_color = Color(0, 0, 0, 0.38)
	style.shadow_size = 20
	return style

extends "res://scripts/screens/screen_base.gd"

const MobileLayout = preload("res://scripts/ui/mobile_layout.gd")
const GeneratedUiTheme = preload("res://scripts/ui/generated_ui_theme.gd")

const TEXT_COLOR := Color(0.86, 0.86, 0.86)
const MUTED_TEXT_COLOR := Color(0.62, 0.62, 0.62)
const PANEL_COLOR := Color(0.045, 0.045, 0.045, 0.94)
const PANEL_BORDER_COLOR := Color(0.34, 0.34, 0.34, 0.78)
const BUTTON_COLOR := Color(0.086, 0.086, 0.086, 0.96)
const BUTTON_HOVER_COLOR := Color(0.14, 0.14, 0.14, 0.98)
const BUTTON_PRESSED_COLOR := Color(0.058, 0.058, 0.058, 1.0)
const BUTTON_DISABLED_COLOR := Color(0.056, 0.056, 0.056, 0.62)
const DETAIL_BACKDROP_COLOR := Color(0.0, 0.0, 0.0, 0.72)
const BUTTON_CONTENT_MARGIN := Vector2(28.0, 12.0)
const BUTTON_CONTENT_MARGIN_MOBILE := Vector2(38.0, 16.0)
const POINTER_SCROLL_DEADZONE := 12.0

var _save_list: VBoxContainer
var _title_layout: VBoxContainer
var _game_title_label: Label
var _menu_columns: BoxContainer
var _license_button: Button
var _credits_button: Button
var _options_button: Button
var _last_details_button: Button
var _details_overlay: Control
var _details_panel: PanelContainer
var _details_scroll: ScrollContainer
var _details_title_label: Label
var _details_body_label: RichTextLabel
var _details_close_button: Button
var _underlay_button_disabled_state: Dictionary = {}
var _details_pointer_scroll_active := false
var _details_pointer_scroll_start_position := Vector2.ZERO
var _details_pointer_scroll_start_vertical := 0
var _details_pointer_scroll_dragging := false


func _ready() -> void:
	screen_id = "main_title"
	screen_title = "메인 타이틀"
	skip_allowed = false
	_build()


func _notification(what: int) -> void:
	super._notification(what)
	if what == NOTIFICATION_RESIZED:
		_apply_responsive_layout()


func _input(event: InputEvent) -> void:
	super._input(event)
	if _details_overlay == null or not _details_overlay.visible:
		return

	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		_hide_details_overlay()
		return

	if _handle_details_pointer_scroll_input(event):
		get_viewport().set_input_as_handled()


func _build() -> void:
	make_full_rect()

	var layout := VBoxContainer.new()
	layout.name = "TitleLayout"
	layout.set_anchors_preset(Control.PRESET_FULL_RECT)
	layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_theme_constant_override("separation", 36)
	add_child(layout)
	_title_layout = layout

	var title := Label.new()
	title.name = "GameTitle"
	title.text = "Blind Madeleine"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 63)
	title.add_theme_color_override("font_color", TEXT_COLOR)
	layout.add_child(title)
	_game_title_label = title

	var menu := BoxContainer.new()
	menu.name = "MenuColumns"
	menu.vertical = false
	menu.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	menu.size_flags_vertical = Control.SIZE_EXPAND_FILL
	menu.add_theme_constant_override("separation", 27)
	layout.add_child(menu)
	_menu_columns = menu

	var new_game_panel := _create_panel("NewGamePanel", "새 게임", "챕터 선택")
	menu.add_child(new_game_panel)
	var new_game_list: VBoxContainer = new_game_panel.get_node("Margin/Content/List")
	_add_new_game_button(new_game_list)
	_add_web_fullscreen_button(new_game_list)

	var save_panel := _create_panel("LoadGamePanel", "불러오기", "세이브 선택")
	menu.add_child(save_panel)
	_save_list = save_panel.get_node("Margin/Content/List")
	_add_disabled_button(_save_list, "SaveSelectItem", "세이브 데이터 없음")

	var extras_panel := _create_panel("ExtrasPanel", "엑스트라", "라이선스와 크레딧")
	menu.add_child(extras_panel)
	var extras_list: VBoxContainer = extras_panel.get_node("Margin/Content/List")
	_options_button = _add_menu_button(
		extras_list,
		"OptionsButton",
		"옵션",
		Callable(self, "_on_options_pressed"),
		"SettingsRounded"
	)
	_license_button = _add_menu_button(
		extras_list,
		"LicenseButton",
		"라이선스",
		Callable(self, "_on_license_pressed"),
		"MenuBookRounded"
	)
	_credits_button = _add_menu_button(
		extras_list,
		"CreditsButton",
		"크레딧",
		Callable(self, "_on_credits_pressed"),
		"WorkspacePremiumRounded"
	)

	_build_details_overlay()
	_apply_responsive_layout()


func _create_panel(panel_name: String, heading: String, list_name: String) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.name = panel_name
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	panel.add_theme_stylebox_override("panel", _make_stylebox(PANEL_COLOR, PANEL_BORDER_COLOR, 2, 8))

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 30)
	margin.add_theme_constant_override("margin_top", 30)
	margin.add_theme_constant_override("margin_right", 30)
	margin.add_theme_constant_override("margin_bottom", 30)
	panel.add_child(margin)

	var content := VBoxContainer.new()
	content.name = "Content"
	content.add_theme_constant_override("separation", 21)
	margin.add_child(content)

	var label := Label.new()
	label.name = "Heading"
	label.text = heading
	label.add_theme_font_size_override("font_size", 36)
	label.add_theme_color_override("font_color", TEXT_COLOR)
	content.add_child(label)

	var list := VBoxContainer.new()
	list.name = "List"
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	list.size_flags_vertical = Control.SIZE_EXPAND_FILL
	list.add_theme_constant_override("separation", 12)
	content.add_child(list)

	var list_marker := Label.new()
	list_marker.name = list_name
	list_marker.text = ""
	list_marker.visible = false
	content.add_child(list_marker)

	return panel


func _add_new_game_button(parent: VBoxContainer) -> void:
	var button := _add_menu_button(
		parent,
		"NewGameButton",
		"새 게임",
		Callable(self, "_on_new_game_pressed"),
		"PlayArrowRounded",
		true
	)
	set_preferred_focus_control(button)


func _add_web_fullscreen_button(parent: VBoxContainer) -> void:
	if not WebDisplayBridge.can_request_fullscreen_landscape():
		return

	_add_menu_button(
		parent,
		"FullscreenButton",
		"전체화면으로 플레이",
		Callable(self, "_on_web_fullscreen_pressed"),
		"FullscreenRounded"
	)


func _add_disabled_button(parent: VBoxContainer, node_name: String, text: String) -> void:
	var button := _add_menu_button(parent, node_name, text, Callable(), "InfoRounded")
	button.disabled = true
	_style_button(button)


func _add_menu_button(
	parent: VBoxContainer,
	node_name: String,
	text: String,
	callback: Callable,
	icon_name: String = "",
	is_primary: bool = false
) -> Button:
	var button := Button.new()
	button.name = node_name
	button.text = text
	button.custom_minimum_size = Vector2(0, _mobile_scaled_float(108.0 if is_primary else 96.0, 150.0 if is_primary else 136.0))
	button.add_theme_font_size_override("font_size", _mobile_scaled_int(24 if is_primary else 22, 32 if is_primary else 30))
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	if not icon_name.is_empty():
		button.icon = _get_mui_icon(icon_name, 50 if is_primary else 42, Color(0.92, 0.9, 0.84))
	if callback.is_valid():
		button.pressed.connect(callback)
	_style_button(button)
	parent.add_child(button)
	return button


func _build_details_overlay() -> void:
	_details_overlay = Control.new()
	_details_overlay.name = "ExtraDetailsOverlay"
	_details_overlay.visible = false
	_details_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	_details_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(_details_overlay)

	var backdrop := ColorRect.new()
	backdrop.name = "Backdrop"
	backdrop.color = DETAIL_BACKDROP_COLOR
	backdrop.mouse_filter = Control.MOUSE_FILTER_STOP
	backdrop.set_anchors_preset(Control.PRESET_FULL_RECT)
	backdrop.gui_input.connect(_on_details_backdrop_gui_input)
	_details_overlay.add_child(backdrop)

	var center := CenterContainer.new()
	center.name = "Center"
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	_details_overlay.add_child(center)

	_details_panel = PanelContainer.new()
	_details_panel.name = "DetailsPanel"
	_details_panel.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	_details_panel.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	_details_panel.add_theme_stylebox_override("panel", _make_stylebox(PANEL_COLOR, PANEL_BORDER_COLOR, 2, 8))
	center.add_child(_details_panel)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 34)
	margin.add_theme_constant_override("margin_top", 30)
	margin.add_theme_constant_override("margin_right", 34)
	margin.add_theme_constant_override("margin_bottom", 34)
	_details_panel.add_child(margin)

	var content := VBoxContainer.new()
	content.name = "Content"
	content.add_theme_constant_override("separation", 22)
	margin.add_child(content)

	var header := HBoxContainer.new()
	header.name = "Header"
	header.add_theme_constant_override("separation", 18)
	content.add_child(header)

	_details_title_label = Label.new()
	_details_title_label.name = "Title"
	_details_title_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_details_title_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_details_title_label.add_theme_font_size_override("font_size", 38)
	_details_title_label.add_theme_color_override("font_color", TEXT_COLOR)
	header.add_child(_details_title_label)

	_details_close_button = Button.new()
	_details_close_button.name = "CloseButton"
	_details_close_button.text = "닫기"
	_details_close_button.icon = _get_mui_icon("CloseRounded", 28, Color(0.92, 0.9, 0.84))
	_details_close_button.custom_minimum_size = Vector2(126, 58)
	_details_close_button.add_theme_font_size_override("font_size", 22)
	_details_close_button.pressed.connect(_hide_details_overlay)
	_style_button(_details_close_button)
	header.add_child(_details_close_button)

	_details_scroll = ScrollContainer.new()
	_details_scroll.name = "DetailsScroll"
	_details_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_details_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_details_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_details_scroll.mouse_filter = Control.MOUSE_FILTER_STOP
	content.add_child(_details_scroll)

	_details_body_label = RichTextLabel.new()
	_details_body_label.name = "Body"
	_details_body_label.bbcode_enabled = false
	_details_body_label.fit_content = true
	_details_body_label.selection_enabled = false
	_details_body_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_details_body_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_details_body_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_details_body_label.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_details_body_label.add_theme_font_size_override("normal_font_size", 25)
	_details_body_label.add_theme_color_override("default_color", TEXT_COLOR)
	_details_scroll.add_child(_details_body_label)


func _on_new_game_pressed() -> void:
	VisualNovelData.clear_story_progression()
	request_screen_change("chapter_select", {"new_game_blackout": true})


func _on_web_fullscreen_pressed() -> void:
	WebDisplayBridge.request_fullscreen_landscape()


func _on_options_pressed() -> void:
	request_screen_change("options")


func _on_license_pressed() -> void:
	_last_details_button = _license_button
	_show_details_overlay("라이선스", _build_license_text())


func _on_credits_pressed() -> void:
	_last_details_button = _credits_button
	_show_details_overlay("크레딧", _build_credits_text())


func _show_details_overlay(title: String, body: String) -> void:
	_details_title_label.text = title
	_details_body_label.text = body
	_details_scroll.scroll_vertical = 0
	_reset_details_pointer_scroll()
	_set_title_buttons_disabled(true)
	_details_overlay.visible = true
	_details_overlay.move_to_front()
	set_preferred_focus_control(_details_close_button)
	if _is_navigation_input_mode_active():
		_details_close_button.grab_focus()


func _hide_details_overlay() -> void:
	if _details_overlay == null:
		return

	_details_overlay.visible = false
	_reset_details_pointer_scroll()
	_set_title_buttons_disabled(false)
	if is_instance_valid(_last_details_button):
		set_preferred_focus_control(_last_details_button)
		if _is_navigation_input_mode_active():
			_last_details_button.grab_focus()


func _on_details_backdrop_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		_hide_details_overlay()


func _handle_details_pointer_scroll_input(event: InputEvent) -> bool:
	if _details_scroll == null or not is_instance_valid(_details_scroll):
		return false

	if event is InputEventMouseButton:
		var mouse_event := event as InputEventMouseButton
		if mouse_event.button_index != MOUSE_BUTTON_LEFT:
			return false
		if mouse_event.pressed:
			if not _details_scroll.get_global_rect().has_point(mouse_event.position):
				return false
			_details_pointer_scroll_active = true
			_details_pointer_scroll_start_position = mouse_event.position
			_details_pointer_scroll_start_vertical = _details_scroll.scroll_vertical
			_details_pointer_scroll_dragging = false
			return false

		if not _details_pointer_scroll_active:
			return false
		var was_dragging := _details_pointer_scroll_dragging
		_reset_details_pointer_scroll()
		return was_dragging

	if event is InputEventMouseMotion:
		var motion_event := event as InputEventMouseMotion
		if not _details_pointer_scroll_active:
			return false
		if (motion_event.button_mask & MOUSE_BUTTON_MASK_LEFT) == 0:
			_reset_details_pointer_scroll()
			return false

		var delta := motion_event.position - _details_pointer_scroll_start_position
		if not _details_pointer_scroll_dragging and delta.length() < POINTER_SCROLL_DEADZONE:
			return false

		_details_pointer_scroll_dragging = true
		_details_scroll.scroll_vertical = int(roundf(clampf(
			float(_details_pointer_scroll_start_vertical) - delta.y,
			0.0,
			_get_details_scroll_vertical_max()
		)))
		return true

	return false


func _reset_details_pointer_scroll() -> void:
	_details_pointer_scroll_active = false
	_details_pointer_scroll_start_position = Vector2.ZERO
	_details_pointer_scroll_start_vertical = 0
	_details_pointer_scroll_dragging = false


func _get_details_scroll_vertical_max() -> float:
	if _details_scroll == null or not is_instance_valid(_details_scroll):
		return 0.0
	var scroll_bar := _details_scroll.get_v_scroll_bar()
	if scroll_bar == null:
		return 0.0
	return maxf(0.0, scroll_bar.max_value - scroll_bar.page)


func _set_title_buttons_disabled(disabled: bool) -> void:
	if _title_layout == null:
		return

	if disabled:
		_underlay_button_disabled_state.clear()
		_set_title_buttons_disabled_recursive(_title_layout, true)
	else:
		_set_title_buttons_disabled_recursive(_title_layout, false)
		_underlay_button_disabled_state.clear()

	refresh_input_focus_mode()
	refresh_pointer_hover_mode()


func _set_title_buttons_disabled_recursive(node: Node, disabled: bool) -> void:
	for child in node.get_children():
		if child is BaseButton:
			var button := child as BaseButton
			var button_id := button.get_instance_id()
			if disabled:
				_underlay_button_disabled_state[button_id] = button.disabled
				button.disabled = true
			else:
				button.disabled = bool(_underlay_button_disabled_state.get(button_id, button.disabled))
			if button is Button:
				_style_button(button as Button)
		_set_title_buttons_disabled_recursive(child, disabled)


func _build_credits_text() -> String:
	var lines := [
		"총괄 디렉터: PJH",
		"리드 프로그래머: 코덱스",
		"일러스트: 덕테이프",
		"시나리오 감수: 떡밥 회수반",
		"연출 보조: 화면 암전 담당자",
		"UI 감각 담당: 버튼이 눌리고 싶어지는 모임",
		"QA: 방금까진 됐는데요 위원회",
		"사운드 체크: 볼륨 7과 볼륨 8 사이의 진실",
		"빌드 관리: 저장 버튼을 믿는 사람들",
		"",
		"스페셜 땡스",
		"- 리락쿠마",
		"- 이루릴",
		"- 몽구",
	]
	return "\n".join(lines)


func _build_license_text() -> String:
	var lines := [
		"폰트 라이선스",
		"",
		"Blind Madeleine은 다음 폰트를 사용합니다.",
		"각 폰트의 저작권과 라이선스는 해당 저작권자에게 있습니다.",
		"",
		"Pretendard JP Variable",
		"- Copyright (c) 2021, Kil Hyung-jin, with Reserved Font Name Pretendard.",
		"- 라이선스: SIL Open Font License 1.1",
		"- 출처: https://github.com/orioncactus/pretendard",
		"- 전문: https://github.com/orioncactus/pretendard/blob/main/LICENSE",
		"",
		"나눔명조",
		"- Copyright (c) 2010, NAVER Corporation, with Reserved Font Name Nanum / Naver Nanum / NanumMyeongjo / Naver NanumMyeongjo.",
		"- 라이선스: 네이버 나눔글꼴 라이선스 / SIL Open Font License 1.1",
		"- 출처: https://hangeul.naver.com/fonts/search?f=nanum",
		"- 전문: https://help.naver.com/service/30016/contents/18088?osType=PC&lang=ko",
		"",
		"연지체",
		"- Copyright: NAVER / NAVER Cultural Foundation Nanum handwriting font family.",
		"- 라이선스: 네이버 나눔글꼴 라이선스 / SIL Open Font License 1.1",
		"- 출처: https://clova.ai/handwriting/list.html",
		"- 전문: https://help.naver.com/service/30016/contents/18088?osType=PC&lang=ko",
		"",
		"잉크립퀴드체",
		"- Copyright: THEFACESHOP",
		"- 라이선스: 더페이스샵 잉크립퀴드체 라이선스",
		"- 출처: https://drive.google.com/drive/folders/1t4DZdt5nv2p1hUKOYbChKcY436-zaqOC?usp=sharing",
		"- 전문: https://drive.google.com/drive/folders/1t4DZdt5nv2p1hUKOYbChKcY436-zaqOC?usp=sharing",
		"",
		"사물놀이체",
		"- Copyright: Callifont",
		"- 라이선스: 캘리폰트 라이선스",
		"- 출처: https://callifont.com/product/samulnori/",
		"- 전문: https://callifont.com/license/",
		"",
		"SIL Open Font License 1.1",
		"- 전문: https://scripts.sil.org/OFL",
	]
	return "\n".join(lines)


func _apply_responsive_layout() -> void:
	var layout_size := _get_layout_size()
	var compact := layout_size.x < 1180.0 or layout_size.y > layout_size.x
	if _title_layout != null:
		var margin_x := _mobile_scaled_float(42.0, 56.0)
		var margin_y := _mobile_scaled_float(36.0, 48.0)
		if compact:
			margin_x = _mobile_scaled_float(24.0, 34.0)
			margin_y = _mobile_scaled_float(28.0, 38.0)
		_title_layout.set_anchors_preset(Control.PRESET_FULL_RECT)
		_title_layout.offset_left = margin_x
		_title_layout.offset_top = margin_y
		_title_layout.offset_right = -margin_x
		_title_layout.offset_bottom = -margin_y
		_title_layout.add_theme_constant_override("separation", _mobile_scaled_int(26 if compact else 36, 34 if compact else 44))
	if _game_title_label != null:
		_game_title_label.add_theme_font_size_override("font_size", _mobile_scaled_int(52 if compact else 63, 66 if compact else 76))
	if _menu_columns != null:
		_menu_columns.vertical = compact
		_menu_columns.add_theme_constant_override("separation", _mobile_scaled_int(18 if compact else 27, 24 if compact else 34))

	for panel_name in ["NewGamePanel", "LoadGamePanel", "ExtrasPanel"]:
		var panel := get_node_or_null("TitleLayout/MenuColumns/%s" % panel_name) as PanelContainer
		if panel == null:
			continue
		var margin := panel.get_node_or_null("Margin") as MarginContainer
		if margin != null:
			var panel_margin := _mobile_scaled_int(20 if compact else 30, 28 if compact else 38)
			margin.add_theme_constant_override("margin_left", panel_margin)
			margin.add_theme_constant_override("margin_top", panel_margin)
			margin.add_theme_constant_override("margin_right", panel_margin)
			margin.add_theme_constant_override("margin_bottom", panel_margin)
		var content := panel.get_node_or_null("Margin/Content") as VBoxContainer
		if content != null:
			content.add_theme_constant_override("separation", _mobile_scaled_int(14 if compact else 21, 20 if compact else 26))
		var heading := panel.get_node_or_null("Margin/Content/Heading") as Label
		if heading != null:
			heading.add_theme_font_size_override("font_size", _mobile_scaled_int(28 if compact else 36, 36 if compact else 44))
		var list := panel.get_node_or_null("Margin/Content/List") as VBoxContainer
		if list != null:
			list.add_theme_constant_override("separation", _mobile_scaled_int(10 if compact else 12, 14 if compact else 18))
			for child in list.get_children():
				if child is Button:
					_apply_menu_button_metrics(child as Button, compact)

	_apply_details_overlay_layout(compact)


func _apply_details_overlay_layout(compact: bool) -> void:
	if _details_panel == null:
		return

	var layout_size := _get_layout_size()
	var outer_margin := _mobile_scaled_float(24.0 if compact else 60.0, 34.0 if compact else 86.0)
	var panel_width := maxf(320.0, minf(1000.0, layout_size.x - outer_margin * 2.0))
	var panel_height := maxf(360.0, minf(780.0, layout_size.y - outer_margin * 2.0))
	_details_panel.custom_minimum_size = Vector2(panel_width, panel_height)
	if _details_scroll != null:
		_details_scroll.custom_minimum_size = Vector2(0.0, maxf(220.0, panel_height - _mobile_scaled_float(150.0, 178.0)))
	if _details_title_label != null:
		_details_title_label.add_theme_font_size_override("font_size", _mobile_scaled_int(30 if compact else 38, 38 if compact else 46))
	if _details_body_label != null:
		_details_body_label.add_theme_font_size_override("normal_font_size", _mobile_scaled_int(20 if compact else 25, 26 if compact else 31))
	if _details_close_button != null:
		_details_close_button.custom_minimum_size = Vector2(_mobile_scaled_float(104.0, 132.0), _mobile_scaled_float(52.0, 64.0))
		_details_close_button.add_theme_font_size_override("font_size", _mobile_scaled_int(19, 24))


func _apply_menu_button_metrics(button: Button, compact: bool) -> void:
	var is_primary := button.name == "NewGameButton"
	var base_height := 86.0 if compact else (108.0 if is_primary else 96.0)
	var target_height := 118.0 if compact else (150.0 if is_primary else 136.0)
	button.custom_minimum_size = Vector2(0, _mobile_scaled_float(base_height, target_height))
	button.add_theme_font_size_override("font_size", _mobile_scaled_int(22 if is_primary else 20, 29 if is_primary else 27))
	_style_button(button)


func _style_button(button: Button) -> void:
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	button.add_theme_stylebox_override("normal", _make_button_stylebox(BUTTON_COLOR, PANEL_BORDER_COLOR, 2, 8))
	button.add_theme_stylebox_override("hover", _make_button_stylebox(BUTTON_HOVER_COLOR, Color(0.70, 0.70, 0.70, 0.78), 2, 8))
	button.add_theme_stylebox_override("focus", _make_button_stylebox(BUTTON_HOVER_COLOR, Color(0.82, 0.82, 0.78, 0.9), 2, 8))
	button.add_theme_stylebox_override("pressed", _make_button_stylebox(BUTTON_PRESSED_COLOR, Color(0.82, 0.82, 0.78, 0.86), 2, 8))
	button.add_theme_stylebox_override("disabled", _make_button_stylebox(BUTTON_DISABLED_COLOR, Color(0.25, 0.25, 0.25, 0.56), 2, 8))
	button.add_theme_constant_override("h_separation", _mobile_scaled_int(12, 16))
	button.add_theme_color_override("font_color", TEXT_COLOR)
	button.add_theme_color_override("font_hover_color", TEXT_COLOR)
	button.add_theme_color_override("font_focus_color", TEXT_COLOR)
	button.add_theme_color_override("font_pressed_color", TEXT_COLOR)
	button.add_theme_color_override("font_disabled_color", MUTED_TEXT_COLOR)


func _make_button_stylebox(fill_color: Color, border_color: Color, border_width: int, radius: int) -> StyleBoxFlat:
	return GeneratedUiTheme.button_style(
		fill_color,
		border_color,
		border_width,
		radius,
		Vector4(
			_mobile_scaled_int(int(BUTTON_CONTENT_MARGIN.x), int(BUTTON_CONTENT_MARGIN_MOBILE.x)),
			_mobile_scaled_int(int(BUTTON_CONTENT_MARGIN.y), int(BUTTON_CONTENT_MARGIN_MOBILE.y)),
			_mobile_scaled_int(int(BUTTON_CONTENT_MARGIN.x), int(BUTTON_CONTENT_MARGIN_MOBILE.x)),
			_mobile_scaled_int(int(BUTTON_CONTENT_MARGIN.y), int(BUTTON_CONTENT_MARGIN_MOBILE.y))
		)
	)


func _make_stylebox(fill_color: Color, border_color: Color, border_width: int, radius: int) -> StyleBoxFlat:
	return GeneratedUiTheme.panel_style(fill_color, border_color, border_width, radius)


func _mobile_scaled_float(base_value: float, target_value: float) -> float:
	return MobileLayout.scaled_float(base_value, target_value, _get_layout_size())


func _mobile_scaled_int(base_value: int, target_value: int) -> int:
	return MobileLayout.scaled_int(base_value, target_value, _get_layout_size())


func _get_layout_size() -> Vector2:
	if size.x > 0.0 and size.y > 0.0:
		return size
	return get_viewport().get_visible_rect().size

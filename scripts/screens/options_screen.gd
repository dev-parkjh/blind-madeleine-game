extends "res://scripts/screens/screen_base.gd"

const MobileLayout = preload("res://scripts/ui/mobile_layout.gd")
const DialogueTypewriterScript = preload("res://scripts/visual_novel/dialogue_typewriter.gd")
const DialogueSpectrumScript = preload("res://scripts/visual_novel/dialogue_spectrum.gd")
const PortraitLayout = preload("res://scripts/visual_novel/portrait_layout.gd")
const GeneratedUiTheme = preload("res://scripts/ui/generated_ui_theme.gd")

const TEXT_COLOR := Color(0.86, 0.86, 0.86)
const MUTED_TEXT_COLOR := Color(0.62, 0.62, 0.62)
const PANEL_COLOR := Color(0.045, 0.045, 0.045, 0.94)
const PANEL_BORDER_COLOR := Color(0.34, 0.34, 0.34, 0.78)
const ACCENT_COLOR := Color(0.74, 0.74, 0.74, 1.0)
const ACCENT_LIGHT_COLOR := Color(0.86, 0.86, 0.86, 1.0)
const PREVIEW_PANEL_COLOR := Color(0.095, 0.095, 0.095, 0.92)
const BUTTON_COLOR := Color(0.086, 0.086, 0.086, 0.96)
const BUTTON_HOVER_COLOR := Color(0.14, 0.14, 0.14, 0.98)
const BUTTON_PRESSED_COLOR := Color(0.058, 0.058, 0.058, 1.0)
const SLIDER_FILL_COLOR := ACCENT_COLOR
const SLIDER_TRACK_COLOR := Color(0.18, 0.18, 0.18, 1.0)
const SLIDER_GRABBER_COLOR := ACCENT_LIGHT_COLOR
const SECTION_NAMES := ["VolumePanel", "DialoguePanel", "DisplayPanel"]
const BUTTON_CONTENT_MARGIN := Vector2(22.0, 10.0)
const BUTTON_CONTENT_MARGIN_MOBILE := Vector2(30.0, 14.0)
const COMPACT_LAYOUT_WIDTH := 1180.0
const MOBILE_WIDE_COMPACT_WIDTH := 1500.0
const MOBILE_WIDE_COMPACT_FACTOR := 0.55
const DIALOGUE_TEXT_SOUND_PATH := "res://assets/sfx/dialogue_text_tick.ogg"
const DIALOGUE_TEXT_SOUND_VOLUME_DB := -4.0
const DIALOGUE_TEXT_SOUND_MOBILE_VOLUME_BOOST_DB := 6.0
const DIALOGUE_TEXT_SOUND_POOL_SIZE := 4
const DIALOGUE_TEXT_SOUND_MAX_VISIBLE_STEP := 2
const PREVIEW_DIALOGUE_TEXT := "이 정도 속도로 대사가 표시됩니다."
const IARIN_DEFAULT_PORTRAIT_PATH := "res://assets/characters/235db733-cbb2-4c89-86fc-377149f9de48/default.png"
const IARIN_DEFAULT_FACE_CENTER := Vector2(0.5063, 0.1212)
const IARIN_DEFAULT_SPECTRUM_OFFSET := Vector2(-0.0177, -0.0099)
const DISPLAY_PREVIEW_BACKGROUND_PATH := "res://assets/story_assets/background/e43a708b-7e5e-4d07-8809-6314ebff2439.png"
const DISPLAY_PREVIEW_SPECTRUM_TEXT := "화면 효과 미리보기"
const DISPLAY_PREVIEW_SPECTRUM_TOTAL := 18
const DISPLAY_PREVIEW_ZOOM_PERCENT := 300.0
const DISPLAY_PREVIEW_BACKGROUND_OVERSCAN_RATIO := 0.08
const DISPLAY_PREVIEW_BACKGROUND_OVERSCAN_MIN := 18.0
const DISPLAY_PREVIEW_SPECTRUM_WIDTH_RATIO := 0.52
const DISPLAY_PREVIEW_SPECTRUM_MAX_STAGE_RATIO := 0.54
const DISPLAY_PREVIEW_SPECTRUM_HEIGHT_SCALE := 0.42
const TOGGLE_ICON_SIZE := Vector2i(68, 38)
const TOGGLE_ICON_SIZE_MOBILE := Vector2i(82, 46)
const TOGGLE_TRACK_ON_COLOR := ACCENT_COLOR
const TOGGLE_TRACK_OFF_COLOR := Color(0.24, 0.24, 0.24, 1.0)
const TOGGLE_KNOB_COLOR := ACCENT_LIGHT_COLOR
const TOGGLE_KNOB_OFF_COLOR := Color(0.72, 0.72, 0.72, 1.0)
const SAVE_TOAST_TEXT := "옵션이 저장되었습니다"
const SAVE_TOAST_COLOR := Color(0.095, 0.095, 0.095, 0.96)
const SAVE_TOAST_BORDER_COLOR := Color(0.74, 0.74, 0.74, 0.86)

var _root_layout: VBoxContainer
var _header: HBoxContainer
var _title_label: Label
var _back_button: Button
var _save_button: Button
var _reset_button: Button
var _scroll: ScrollContainer
var _content_columns: BoxContainer
var _draft_settings: Dictionary = {}
var _value_labels: Dictionary = {}
var _sliders: Dictionary = {}
var _toggles: Dictionary = {}
var _syncing_controls := false
var _bgm_preview_button: Button
var _se_preview_button: Button
var _bgm_preview_player: AudioStreamPlayer
var _se_preview_player: AudioStreamPlayer
var _bgm_preview_stream: AudioStream
var _se_preview_stream: AudioStream
var _bgm_preview_base_volume_db := 0.0
var _se_preview_base_volume_db := 0.0
var _preview_panel: PanelContainer
var _preview_play_button: Button
var _preview_speaker_label: Label
var _preview_text: RichTextLabel
var _preview_typewriter: DialogueTypewriter
var _preview_text_sound_players: Array[AudioStreamPlayer] = []
var _preview_text_sound_stream: AudioStream
var _preview_text_sound_last_visible_count := 0
var _preview_text_sound_last_played_msec := 0
var _preview_text_sound_player_index := 0
var _display_preview_panel: PanelContainer
var _display_preview_stage: Control
var _display_preview_background: TextureRect
var _display_preview_portrait: TextureRect
var _display_preview_spectrum: DialogueSpectrum
var _display_spectrum_cycle_timer: Timer
var _display_spectrum_progress_timer: Timer
var _display_spectrum_showing := false
var _display_spectrum_progress := 0
var _toggle_icon_cache: Dictionary = {}
var _save_toast: PanelContainer
var _save_toast_label: Label
var _save_toast_tween: Tween
var _overlay_mode := false


func _ready() -> void:
	screen_id = "options"
	screen_title = "옵션"
	skip_allowed = false
	_build()
	set_process(false)


func setup(payload: Dictionary = {}) -> void:
	super.setup(payload)
	_overlay_mode = bool(payload.get("overlay_mode", false))
	_sync_back_button_mode()


func _process(delta: float) -> void:
	if _preview_typewriter == null:
		set_process(false)
		return
	if not _preview_typewriter.process(delta):
		set_process(false)


func _notification(what: int) -> void:
	super._notification(what)
	if what == NOTIFICATION_RESIZED:
		_apply_responsive_layout()


func _exit_tree() -> void:
	_stop_audio_previews()


func _input(event: InputEvent) -> void:
	super._input(event)
	if event.is_action_pressed("ui_cancel"):
		get_viewport().set_input_as_handled()
		_on_back_pressed()


func _build() -> void:
	make_full_rect()

	var background := ColorRect.new()
	background.name = "Background"
	background.color = Color(0.055, 0.055, 0.055, 1.0)
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)

	_root_layout = VBoxContainer.new()
	_root_layout.name = "OptionsLayout"
	_root_layout.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root_layout.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_root_layout.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_root_layout.add_theme_constant_override("separation", 26)
	add_child(_root_layout)

	_build_header()
	_build_content()
	_build_save_toast()
	_load_draft_from_settings()
	_sync_controls_from_draft()
	_apply_responsive_layout()
	set_preferred_focus_control(_back_button)


func _build_header() -> void:
	_header = HBoxContainer.new()
	_header.name = "Header"
	_header.add_theme_constant_override("separation", 18)
	_root_layout.add_child(_header)

	_back_button = _create_button(
		"BackButton",
		"닫기" if _overlay_mode else "뒤로",
		"CloseRounded" if _overlay_mode else "ArrowBackRounded",
		Callable(self, "_on_back_pressed")
	)
	_header.add_child(_back_button)

	_title_label = Label.new()
	_title_label.name = "Title"
	_title_label.text = "옵션"
	_title_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_title_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_title_label.add_theme_font_size_override("font_size", 48)
	_title_label.add_theme_color_override("font_color", TEXT_COLOR)
	_header.add_child(_title_label)

	_reset_button = _create_button("ResetButton", "초기화", "SettingsBackupRestoreRounded", Callable(self, "_on_reset_pressed"))
	_header.add_child(_reset_button)

	_save_button = _create_button("SaveButton", "저장", "DoneRounded", Callable(self, "_on_save_pressed"))
	_header.add_child(_save_button)


func _build_content() -> void:
	_scroll = ScrollContainer.new()
	_scroll.name = "OptionsScroll"
	_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_root_layout.add_child(_scroll)

	_content_columns = BoxContainer.new()
	_content_columns.name = "ContentColumns"
	_content_columns.vertical = false
	_content_columns.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_content_columns.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_content_columns.add_theme_constant_override("separation", 24)
	_scroll.add_child(_content_columns)

	var volume_panel := _create_section_panel("VolumePanel", "볼륨", "LibraryMusicRounded")
	_content_columns.add_child(volume_panel)
	var volume_list: VBoxContainer = volume_panel.get_node("Margin/Content/List")
	_add_slider_row(volume_list, GameSettings.BGM_VOLUME, "BGM", 0.0, 100.0, 1.0, "%d%%")
	_add_slider_row(volume_list, GameSettings.SE_VOLUME, "SE", 0.0, 100.0, 1.0, "%d%%")
	_build_audio_preview(volume_list)

	var dialogue_panel := _create_section_panel("DialoguePanel", "대사", "ChatBubbleOutlineRounded")
	_content_columns.add_child(dialogue_panel)
	var dialogue_list: VBoxContainer = dialogue_panel.get_node("Margin/Content/List")
	_add_slider_row(dialogue_list, GameSettings.DIALOGUE_TEXT_SOUND_VOLUME, "대사 효과음", 0.0, 100.0, 1.0, "%d%%")
	var speed_row := _add_slider_row(dialogue_list, GameSettings.DIALOGUE_SPEED_STEP, "스피드", 1.0, 7.0, 1.0, "%d단계")
	_add_slider_range_labels(speed_row, "느림", "빠름")
	var speed_slider := _sliders.get(GameSettings.DIALOGUE_SPEED_STEP) as HSlider
	if speed_slider != null:
		speed_slider.tick_count = 7
		speed_slider.ticks_on_borders = true
	_build_dialogue_preview(dialogue_list)

	var display_panel := _create_section_panel("DisplayPanel", "화면", "DisplaySettingsRounded")
	_content_columns.add_child(display_panel)
	var display_list: VBoxContainer = display_panel.get_node("Margin/Content/List")
	_add_toggle_row(display_list, GameSettings.BACKGROUND_IMAGE_ENABLED, "배경 이미지")
	_add_toggle_row(display_list, GameSettings.DIALOGUE_SPECTRUM_ENABLED, "음파")
	_build_display_preview(display_list)


func _build_save_toast() -> void:
	_save_toast = PanelContainer.new()
	_save_toast.name = "SaveToast"
	_save_toast.visible = false
	_save_toast.modulate.a = 0.0
	_save_toast.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_save_toast.add_theme_stylebox_override("panel", _make_stylebox(SAVE_TOAST_COLOR, SAVE_TOAST_BORDER_COLOR, 2, 8))
	add_child(_save_toast)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	margin.add_theme_constant_override("margin_left", 18)
	margin.add_theme_constant_override("margin_top", 12)
	margin.add_theme_constant_override("margin_right", 20)
	margin.add_theme_constant_override("margin_bottom", 12)
	_save_toast.add_child(margin)

	var row := HBoxContainer.new()
	row.name = "Content"
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_theme_constant_override("separation", 10)
	margin.add_child(row)

	var icon := TextureRect.new()
	icon.name = "Icon"
	icon.texture = _get_mui_icon("DoneRounded", 28, ACCENT_LIGHT_COLOR)
	icon.custom_minimum_size = Vector2(30, 30)
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_child(icon)

	_save_toast_label = Label.new()
	_save_toast_label.name = "Label"
	_save_toast_label.text = SAVE_TOAST_TEXT
	_save_toast_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_save_toast_label.add_theme_font_size_override("font_size", 22)
	_save_toast_label.add_theme_color_override("font_color", TEXT_COLOR)
	_save_toast_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_child(_save_toast_label)


func _create_section_panel(panel_name: String, heading: String, icon_name: String) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.name = panel_name
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	panel.add_theme_stylebox_override("panel", _make_stylebox(PANEL_COLOR, PANEL_BORDER_COLOR, 2, 8))

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 28)
	margin.add_theme_constant_override("margin_top", 28)
	margin.add_theme_constant_override("margin_right", 28)
	margin.add_theme_constant_override("margin_bottom", 28)
	panel.add_child(margin)

	var content := VBoxContainer.new()
	content.name = "Content"
	content.add_theme_constant_override("separation", 24)
	margin.add_child(content)

	var header := HBoxContainer.new()
	header.name = "SectionHeader"
	header.add_theme_constant_override("separation", 12)
	content.add_child(header)

	var icon := TextureRect.new()
	icon.name = "Icon"
	icon.texture = _get_mui_icon(icon_name, 34, ACCENT_LIGHT_COLOR)
	icon.custom_minimum_size = Vector2(38, 38)
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	header.add_child(icon)

	var label := Label.new()
	label.name = "Heading"
	label.text = heading
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.add_theme_font_size_override("font_size", 34)
	label.add_theme_color_override("font_color", TEXT_COLOR)
	header.add_child(label)

	var list := VBoxContainer.new()
	list.name = "List"
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	list.size_flags_vertical = Control.SIZE_EXPAND_FILL
	list.add_theme_constant_override("separation", 22)
	content.add_child(list)

	return panel


func _add_slider_row(
	parent: VBoxContainer,
	setting_key: String,
	label_text: String,
	min_value: float,
	max_value: float,
	step: float,
	value_format: String
) -> VBoxContainer:
	var row := VBoxContainer.new()
	row.name = "%sRow" % setting_key.capitalize().replace(" ", "")
	row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_theme_constant_override("separation", 8)
	parent.add_child(row)

	var header := HBoxContainer.new()
	header.name = "SliderHeader"
	header.add_theme_constant_override("separation", 12)
	row.add_child(header)

	var label := Label.new()
	label.name = "Label"
	label.text = label_text
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.add_theme_font_size_override("font_size", 25)
	label.add_theme_color_override("font_color", TEXT_COLOR)
	header.add_child(label)

	var value_label := Label.new()
	value_label.name = "Value"
	value_label.text = value_format % 100
	value_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	value_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	value_label.custom_minimum_size = Vector2(86, 0)
	value_label.add_theme_font_size_override("font_size", 22)
	value_label.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	header.add_child(value_label)
	_value_labels[setting_key] = value_label

	var slider := HSlider.new()
	slider.name = "Slider"
	slider.min_value = min_value
	slider.max_value = max_value
	slider.step = step
	slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	slider.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	slider.custom_minimum_size = Vector2(0, 42)
	slider.value_changed.connect(_on_slider_value_changed.bind(setting_key, value_format))
	_style_slider(slider)
	row.add_child(slider)
	_sliders[setting_key] = slider
	return row


func _add_slider_range_labels(parent: VBoxContainer, left_text: String, right_text: String) -> void:
	var range_labels := HBoxContainer.new()
	range_labels.name = "RangeLabels"
	range_labels.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(range_labels)

	var left := Label.new()
	left.name = "SlowLabel"
	left.text = left_text
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left.add_theme_font_size_override("font_size", 19)
	left.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	range_labels.add_child(left)

	var right := Label.new()
	right.name = "FastLabel"
	right.text = right_text
	right.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	right.add_theme_font_size_override("font_size", 19)
	right.add_theme_color_override("font_color", MUTED_TEXT_COLOR)
	range_labels.add_child(right)


func _add_toggle_row(parent: VBoxContainer, setting_key: String, label_text: String) -> void:
	var row := HBoxContainer.new()
	row.name = "%sRow" % setting_key.capitalize().replace(" ", "")
	row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_theme_constant_override("separation", 16)
	parent.add_child(row)

	var label := Label.new()
	label.name = "Label"
	label.text = label_text
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.add_theme_font_size_override("font_size", 25)
	label.add_theme_color_override("font_color", TEXT_COLOR)
	row.add_child(label)

	var toggle := CheckButton.new()
	toggle.name = "Toggle"
	toggle.focus_mode = Control.FOCUS_ALL
	toggle.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	toggle.custom_minimum_size = Vector2(132, 64)
	toggle.add_theme_font_size_override("font_size", 20)
	toggle.add_theme_color_override("font_color", TEXT_COLOR)
	toggle.add_theme_color_override("font_hover_color", TEXT_COLOR)
	toggle.add_theme_color_override("font_focus_color", TEXT_COLOR)
	_style_toggle(toggle, false)
	toggle.toggled.connect(_on_toggle_changed.bind(setting_key))
	row.add_child(toggle)
	_toggles[setting_key] = toggle


func _build_audio_preview(parent: VBoxContainer) -> void:
	var row := HBoxContainer.new()
	row.name = "AudioPreviewRow"
	row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_theme_constant_override("separation", 12)
	parent.add_child(row)

	_bgm_preview_button = _create_button("BgmPreviewButton", "BGM 재생", "PlayArrowRounded", Callable(self, "_on_bgm_preview_pressed"))
	_bgm_preview_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(_bgm_preview_button)

	_se_preview_button = _create_button("SePreviewButton", "SE 재생", "VolumeUpRounded", Callable(self, "_on_se_preview_pressed"))
	_se_preview_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(_se_preview_button)

	_bgm_preview_player = AudioStreamPlayer.new()
	_bgm_preview_player.name = "OptionsBgmPreviewPlayer"
	add_child(_bgm_preview_player)

	_se_preview_player = AudioStreamPlayer.new()
	_se_preview_player.name = "OptionsSePreviewPlayer"
	add_child(_se_preview_player)

	_refresh_audio_preview_button_state()


func _build_dialogue_preview(parent: VBoxContainer) -> void:
	_preview_panel = PanelContainer.new()
	_preview_panel.name = "DialoguePreview"
	_preview_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_preview_panel.add_theme_stylebox_override("panel", _make_stylebox(PREVIEW_PANEL_COLOR, PANEL_BORDER_COLOR, 2, 8))
	parent.add_child(_preview_panel)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 18)
	margin.add_theme_constant_override("margin_top", 16)
	margin.add_theme_constant_override("margin_right", 18)
	margin.add_theme_constant_override("margin_bottom", 18)
	_preview_panel.add_child(margin)

	var content := VBoxContainer.new()
	content.name = "Content"
	content.add_theme_constant_override("separation", 10)
	margin.add_child(content)

	var header := HBoxContainer.new()
	header.name = "Header"
	header.add_theme_constant_override("separation", 12)
	content.add_child(header)

	_preview_speaker_label = Label.new()
	_preview_speaker_label.name = "Speaker"
	_preview_speaker_label.text = "Madeleine"
	_preview_speaker_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_preview_speaker_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_preview_speaker_label.add_theme_font_size_override("font_size", 22)
	_preview_speaker_label.add_theme_color_override("font_color", ACCENT_LIGHT_COLOR)
	header.add_child(_preview_speaker_label)

	_preview_play_button = _create_button("PreviewPlayButton", "재생", "PlayArrowRounded", Callable(self, "_on_preview_play_pressed"))
	header.add_child(_preview_play_button)

	_preview_text = RichTextLabel.new()
	_preview_text.name = "PreviewText"
	_preview_text.bbcode_enabled = false
	_preview_text.fit_content = false
	_preview_text.scroll_active = false
	_preview_text.selection_enabled = false
	_preview_text.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_preview_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_preview_text.custom_minimum_size = Vector2(0, 86)
	_preview_text.add_theme_font_size_override("normal_font_size", 25)
	_preview_text.add_theme_color_override("default_color", TEXT_COLOR)
	_preview_text.text = PREVIEW_DIALOGUE_TEXT
	content.add_child(_preview_text)

	_preview_typewriter = DialogueTypewriterScript.new()
	_preview_typewriter.bind(_preview_text)
	_preview_typewriter.visible_character_changed.connect(_on_preview_visible_character_changed)
	_preview_typewriter.typewriter_finished.connect(_on_preview_typewriter_finished)

	for index in DIALOGUE_TEXT_SOUND_POOL_SIZE:
		var player := AudioStreamPlayer.new()
		player.name = "OptionsDialogueTextSoundPlayer%d" % [index + 1]
		player.volume_db = _get_preview_text_sound_volume_db()
		add_child(player)
		_preview_text_sound_players.append(player)
	_load_preview_text_sound_stream()


func _build_display_preview(parent: VBoxContainer) -> void:
	_display_preview_panel = PanelContainer.new()
	_display_preview_panel.name = "DisplayPreview"
	_display_preview_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_display_preview_panel.add_theme_stylebox_override("panel", _make_stylebox(PREVIEW_PANEL_COLOR, PANEL_BORDER_COLOR, 2, 8))
	parent.add_child(_display_preview_panel)

	var margin := MarginContainer.new()
	margin.name = "Margin"
	margin.add_theme_constant_override("margin_left", 16)
	margin.add_theme_constant_override("margin_top", 16)
	margin.add_theme_constant_override("margin_right", 16)
	margin.add_theme_constant_override("margin_bottom", 16)
	_display_preview_panel.add_child(margin)

	_display_preview_stage = Control.new()
	_display_preview_stage.name = "Stage"
	_display_preview_stage.clip_contents = true
	_display_preview_stage.custom_minimum_size = Vector2(0, 260)
	_display_preview_stage.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_display_preview_stage.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_display_preview_stage.resized.connect(_sync_display_preview_layout)
	margin.add_child(_display_preview_stage)

	var fallback := ColorRect.new()
	fallback.name = "Fallback"
	fallback.color = Color(0.07, 0.07, 0.07, 1.0)
	fallback.mouse_filter = Control.MOUSE_FILTER_IGNORE
	fallback.set_anchors_preset(Control.PRESET_FULL_RECT)
	_display_preview_stage.add_child(fallback)

	_display_preview_background = TextureRect.new()
	_display_preview_background.name = "Background"
	_display_preview_background.texture = load(DISPLAY_PREVIEW_BACKGROUND_PATH) as Texture2D
	_display_preview_background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_display_preview_background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	_display_preview_background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_display_preview_stage.add_child(_display_preview_background)

	var dim := ColorRect.new()
	dim.name = "Dim"
	dim.color = Color(0, 0, 0, 0.18)
	dim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	_display_preview_stage.add_child(dim)

	_display_preview_spectrum = DialogueSpectrumScript.new()
	_display_preview_spectrum.name = "DisplaySpectrumPreview"
	_display_preview_spectrum.visible = false
	_display_preview_spectrum.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_display_preview_stage.add_child(_display_preview_spectrum)

	_display_preview_portrait = TextureRect.new()
	_display_preview_portrait.name = "IarinDefault"
	_display_preview_portrait.texture = load(IARIN_DEFAULT_PORTRAIT_PATH) as Texture2D
	_display_preview_portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_display_preview_portrait.stretch_mode = TextureRect.STRETCH_SCALE
	_display_preview_portrait.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_display_preview_stage.add_child(_display_preview_portrait)

	_display_spectrum_cycle_timer = Timer.new()
	_display_spectrum_cycle_timer.name = "DisplaySpectrumCycleTimer"
	_display_spectrum_cycle_timer.one_shot = true
	_display_spectrum_cycle_timer.timeout.connect(_on_display_spectrum_cycle_timeout)
	add_child(_display_spectrum_cycle_timer)

	_display_spectrum_progress_timer = Timer.new()
	_display_spectrum_progress_timer.name = "DisplaySpectrumProgressTimer"
	_display_spectrum_progress_timer.wait_time = 0.11
	_display_spectrum_progress_timer.timeout.connect(_on_display_spectrum_progress_timeout)
	add_child(_display_spectrum_progress_timer)


func _load_draft_from_settings() -> void:
	_draft_settings = GameSettings.get_settings_snapshot()


func _sync_controls_from_draft() -> void:
	_syncing_controls = true
	_set_slider_value(GameSettings.BGM_VOLUME, _draft_float(GameSettings.BGM_VOLUME) * 100.0, "%d%%")
	_set_slider_value(GameSettings.SE_VOLUME, _draft_float(GameSettings.SE_VOLUME) * 100.0, "%d%%")
	_set_slider_value(GameSettings.DIALOGUE_TEXT_SOUND_VOLUME, _draft_float(GameSettings.DIALOGUE_TEXT_SOUND_VOLUME) * 100.0, "%d%%")
	_set_slider_value(GameSettings.DIALOGUE_SPEED_STEP, float(_draft_dialogue_speed_step()), "%d단계")
	_set_toggle_value(GameSettings.BACKGROUND_IMAGE_ENABLED, _draft_bool(GameSettings.BACKGROUND_IMAGE_ENABLED))
	_set_toggle_value(GameSettings.DIALOGUE_SPECTRUM_ENABLED, _draft_bool(GameSettings.DIALOGUE_SPECTRUM_ENABLED))
	_refresh_audio_preview_player_volumes()
	_refresh_preview_from_settings()
	_refresh_display_preview_from_draft()
	_syncing_controls = false


func _set_slider_value(setting_key: String, value: float, value_format: String) -> void:
	var slider := _sliders.get(setting_key) as HSlider
	if slider != null:
		slider.value = value
	_update_value_label(setting_key, value, value_format)


func _set_toggle_value(setting_key: String, enabled: bool) -> void:
	var toggle := _toggles.get(setting_key) as CheckButton
	if toggle == null:
		return
	toggle.button_pressed = enabled
	toggle.text = "On" if enabled else "Off"


func _on_slider_value_changed(value: float, setting_key: String, value_format: String) -> void:
	_update_value_label(setting_key, value, value_format)
	if _syncing_controls:
		return

	match setting_key:
		GameSettings.BGM_VOLUME:
			_set_draft_value(setting_key, value / 100.0)
			_refresh_audio_preview_player_volumes()
		GameSettings.SE_VOLUME:
			_set_draft_value(setting_key, value / 100.0)
			_refresh_audio_preview_player_volumes()
		GameSettings.DIALOGUE_TEXT_SOUND_VOLUME:
			_set_draft_value(setting_key, value / 100.0)
			_refresh_preview_text_sound_player_volumes()
			if value <= 0.0:
				_stop_preview_text_sound()
		GameSettings.DIALOGUE_SPEED_STEP:
			_set_draft_value(setting_key, int(roundf(value)))
			_refresh_preview_from_settings()


func _on_toggle_changed(enabled: bool, setting_key: String) -> void:
	var toggle := _toggles.get(setting_key) as CheckButton
	if toggle != null:
		toggle.text = "On" if enabled else "Off"
	if _syncing_controls:
		return

	match setting_key:
		GameSettings.BACKGROUND_IMAGE_ENABLED:
			_set_draft_value(setting_key, enabled)
			_refresh_display_preview_from_draft()
		GameSettings.DIALOGUE_SPECTRUM_ENABLED:
			_set_draft_value(setting_key, enabled)
			_refresh_display_preview_from_draft()


func _update_value_label(setting_key: String, value: float, value_format: String) -> void:
	var label := _value_labels.get(setting_key) as Label
	if label == null:
		return
	if setting_key == GameSettings.DIALOGUE_SPEED_STEP:
		var step := clampi(int(roundf(value)), GameSettings.DIALOGUE_SPEED_STEP_MIN, GameSettings.DIALOGUE_SPEED_STEP_MAX)
		label.text = "%d단계 · %s" % [step, GameSettings.get_dialogue_speed_label(step)]
		return
	label.text = value_format % int(roundf(value))


func _on_back_pressed() -> void:
	_stop_audio_previews()
	if _overlay_mode:
		request_close()
		return
	request_screen_change("main_title")


func _sync_back_button_mode() -> void:
	if _back_button == null:
		return
	_back_button.text = "닫기" if _overlay_mode else "뒤로"
	_back_button.icon = _get_mui_icon("CloseRounded" if _overlay_mode else "ArrowBackRounded", 32, ACCENT_LIGHT_COLOR)


func _on_reset_pressed() -> void:
	_draft_settings = GameSettings.get_default_settings()
	_sync_controls_from_draft()


func _on_save_pressed() -> void:
	GameSettings.apply_settings(_draft_settings)
	_load_draft_from_settings()
	_sync_controls_from_draft()
	_show_save_toast()


func _set_draft_value(key: String, value: Variant) -> void:
	_draft_settings[key] = value


func _draft_float(key: String) -> float:
	return float(_draft_settings.get(key, GameSettings.DEFAULTS[key]))


func _draft_bool(key: String) -> bool:
	return bool(_draft_settings.get(key, GameSettings.DEFAULTS[key]))


func _draft_dialogue_speed_step() -> int:
	return clampi(
		int(_draft_settings.get(GameSettings.DIALOGUE_SPEED_STEP, GameSettings.DEFAULTS[GameSettings.DIALOGUE_SPEED_STEP])),
		GameSettings.DIALOGUE_SPEED_STEP_MIN,
		GameSettings.DIALOGUE_SPEED_STEP_MAX
	)


func _draft_dialogue_speed_multiplier() -> float:
	return GameSettings.get_dialogue_speed_multiplier_for_step(_draft_dialogue_speed_step())


func _draft_dialogue_text_sound_interval_msec() -> int:
	return GameSettings.get_dialogue_text_sound_interval_msec_for_step(_draft_dialogue_speed_step())


func _refresh_display_preview_from_draft() -> void:
	if _display_preview_background != null:
		_display_preview_background.visible = _draft_bool(GameSettings.BACKGROUND_IMAGE_ENABLED)
	if _draft_bool(GameSettings.DIALOGUE_SPECTRUM_ENABLED):
		_start_display_spectrum_cycle()
	else:
		_stop_display_spectrum_cycle()


func _start_display_spectrum_cycle() -> void:
	if _display_preview_spectrum == null:
		return
	if _display_spectrum_cycle_timer != null and _display_spectrum_cycle_timer.is_stopped():
		_show_display_spectrum_preview()


func _stop_display_spectrum_cycle() -> void:
	if _display_spectrum_cycle_timer != null:
		_display_spectrum_cycle_timer.stop()
	if _display_spectrum_progress_timer != null:
		_display_spectrum_progress_timer.stop()
	_display_spectrum_showing = false
	if _display_preview_spectrum != null:
		_display_preview_spectrum.finish_line(true)
		_display_preview_spectrum.visible = false


func _show_display_spectrum_preview() -> void:
	if _display_preview_spectrum == null or not _draft_bool(GameSettings.DIALOGUE_SPECTRUM_ENABLED):
		_stop_display_spectrum_cycle()
		return
	_display_spectrum_showing = true
	_display_spectrum_progress = 0
	_sync_display_preview_layout()
	_display_preview_spectrum.visible = true
	_display_preview_spectrum.play_line(DISPLAY_PREVIEW_SPECTRUM_TEXT, Color("#ff4fa8"))
	_display_preview_spectrum.set_typing_progress(1, DISPLAY_PREVIEW_SPECTRUM_TOTAL)
	if _display_spectrum_progress_timer != null:
		_display_spectrum_progress_timer.start()
	if _display_spectrum_cycle_timer != null:
		_display_spectrum_cycle_timer.start(1.35)


func _hide_display_spectrum_preview() -> void:
	_display_spectrum_showing = false
	if _display_spectrum_progress_timer != null:
		_display_spectrum_progress_timer.stop()
	if _display_preview_spectrum != null:
		_display_preview_spectrum.finish_line()
	if _display_spectrum_cycle_timer != null and _draft_bool(GameSettings.DIALOGUE_SPECTRUM_ENABLED):
		_display_spectrum_cycle_timer.start(0.8)


func _on_display_spectrum_cycle_timeout() -> void:
	if not _draft_bool(GameSettings.DIALOGUE_SPECTRUM_ENABLED):
		_stop_display_spectrum_cycle()
		return
	if _display_spectrum_showing:
		_hide_display_spectrum_preview()
	else:
		_show_display_spectrum_preview()


func _on_display_spectrum_progress_timeout() -> void:
	if not _display_spectrum_showing or _display_preview_spectrum == null:
		return
	_display_spectrum_progress = (_display_spectrum_progress % DISPLAY_PREVIEW_SPECTRUM_TOTAL) + 1
	_display_preview_spectrum.set_typing_progress(_display_spectrum_progress, DISPLAY_PREVIEW_SPECTRUM_TOTAL)


func _sync_display_preview_layout() -> void:
	if _display_preview_stage == null:
		return
	var stage_size := _display_preview_stage.size
	if stage_size.x <= 1.0 or stage_size.y <= 1.0:
		return
	if _display_preview_background != null:
		_layout_display_preview_background(stage_size)
	var portrait_rect := Rect2()
	if _display_preview_portrait != null:
		var portrait_texture := _display_preview_portrait.texture
		if portrait_texture != null:
			portrait_rect = PortraitLayout.compute_display_rect_with_zoom(
				stage_size,
				Vector2(portrait_texture.get_width(), portrait_texture.get_height()),
				IARIN_DEFAULT_FACE_CENTER,
				DISPLAY_PREVIEW_ZOOM_PERCENT,
				Vector2.ZERO
			)
		_display_preview_portrait.set_anchors_preset(Control.PRESET_TOP_LEFT)
		_display_preview_portrait.position = portrait_rect.position
		_display_preview_portrait.size = portrait_rect.size
	if _display_preview_spectrum != null:
		_display_preview_spectrum.position = PortraitLayout.compute_spectrum_position(
			stage_size,
			Vector2.ZERO,
			IARIN_DEFAULT_SPECTRUM_OFFSET,
			Rect2(),
			1.0,
			DISPLAY_PREVIEW_ZOOM_PERCENT
		)
		var spectrum_width := stage_size.x * DISPLAY_PREVIEW_SPECTRUM_MAX_STAGE_RATIO
		if portrait_rect.size.x > 0.0:
			spectrum_width = minf(
				portrait_rect.size.x * DISPLAY_PREVIEW_SPECTRUM_WIDTH_RATIO,
				stage_size.x * DISPLAY_PREVIEW_SPECTRUM_MAX_STAGE_RATIO
			)
		_display_preview_spectrum.set_spectrum_layout(spectrum_width, DISPLAY_PREVIEW_SPECTRUM_HEIGHT_SCALE)
		_display_preview_spectrum.set_peak_alpha(0.92)


func _layout_display_preview_background(stage_size: Vector2) -> void:
	var overscan := maxf(
		DISPLAY_PREVIEW_BACKGROUND_OVERSCAN_MIN,
		minf(stage_size.x, stage_size.y) * DISPLAY_PREVIEW_BACKGROUND_OVERSCAN_RATIO
	)
	var bleed := Vector2(overscan, overscan)
	_display_preview_background.set_anchors_preset(Control.PRESET_TOP_LEFT)
	_display_preview_background.position = -bleed
	_display_preview_background.size = stage_size + bleed * 2.0


func _on_preview_play_pressed() -> void:
	if _preview_typewriter == null or _preview_text == null:
		return
	_reset_preview_text_sound_state()
	_preview_typewriter.playback_speed_multiplier = _draft_dialogue_speed_multiplier()
	_preview_typewriter.start_line(PREVIEW_DIALOGUE_TEXT)
	set_process(true)


func _on_preview_visible_character_changed(visible_count: int, total_count: int) -> void:
	_maybe_play_preview_text_sound(visible_count, total_count)


func _on_preview_typewriter_finished() -> void:
	set_process(false)


func _refresh_preview_from_settings() -> void:
	if _preview_typewriter != null:
		_preview_typewriter.playback_speed_multiplier = _draft_dialogue_speed_multiplier()
	_refresh_preview_text_sound_player_volumes()


func _reset_preview_text_sound_state() -> void:
	_preview_text_sound_last_visible_count = 0
	_preview_text_sound_last_played_msec = 0
	_preview_text_sound_player_index = 0
	_stop_preview_text_sound()


func _load_preview_text_sound_stream() -> bool:
	if _preview_text_sound_stream != null:
		return true
	_preview_text_sound_stream = load(DIALOGUE_TEXT_SOUND_PATH) as AudioStream
	if _preview_text_sound_stream == null:
		return false
	_set_audio_stream_loop(_preview_text_sound_stream, false)
	for player in _preview_text_sound_players:
		if player != null:
			player.stream = _preview_text_sound_stream
	return true


func _stop_preview_text_sound() -> void:
	for player in _preview_text_sound_players:
		if player != null:
			player.stop()


func _maybe_play_preview_text_sound(visible_count: int, total_count: int) -> void:
	var previous_count := _preview_text_sound_last_visible_count
	_preview_text_sound_last_visible_count = maxi(visible_count, 0)
	if _draft_float(GameSettings.DIALOGUE_TEXT_SOUND_VOLUME) <= 0.0001:
		return
	if total_count <= 0 or visible_count <= previous_count:
		return

	var visible_step := visible_count - previous_count
	if visible_step > DIALOGUE_TEXT_SOUND_MAX_VISIBLE_STEP:
		return
	if _preview_text_sound_players.is_empty() or not _load_preview_text_sound_stream():
		return

	var now_msec := Time.get_ticks_msec()
	var min_interval_msec := _draft_dialogue_text_sound_interval_msec()
	if _preview_text_sound_last_played_msec > 0 and now_msec - _preview_text_sound_last_played_msec < min_interval_msec:
		return

	_preview_text_sound_last_played_msec = now_msec
	var player := _preview_text_sound_players[_preview_text_sound_player_index % _preview_text_sound_players.size()]
	_preview_text_sound_player_index = (_preview_text_sound_player_index + 1) % _preview_text_sound_players.size()
	if player == null:
		return
	player.stream = _preview_text_sound_stream
	player.volume_db = _get_preview_text_sound_volume_db()
	player.play()


func _refresh_preview_text_sound_player_volumes() -> void:
	var volume_db := _get_preview_text_sound_volume_db()
	for player in _preview_text_sound_players:
		if player != null:
			player.volume_db = volume_db


func _get_preview_text_sound_volume_db() -> float:
	var volume_offset_db := GameSettings.linear_volume_to_db(_draft_float(GameSettings.DIALOGUE_TEXT_SOUND_VOLUME))
	if volume_offset_db <= -79.9:
		return -80.0
	return maxf(DIALOGUE_TEXT_SOUND_VOLUME_DB + _get_dialogue_text_sound_device_boost_db() + volume_offset_db, -80.0)


func _on_bgm_preview_pressed() -> void:
	if _bgm_preview_player == null:
		return
	if _bgm_preview_player.playing:
		_stop_bgm_preview()
		return
	_play_bgm_preview()


func _on_se_preview_pressed() -> void:
	if _se_preview_player == null or not _load_se_preview_stream():
		return
	_se_preview_player.stop()
	_se_preview_player.stream = _se_preview_stream
	_se_preview_player.volume_db = _get_se_preview_volume_db()
	_se_preview_player.play()


func _play_bgm_preview() -> void:
	if _bgm_preview_player == null or not _load_bgm_preview_stream():
		return
	_bgm_preview_player.stop()
	_bgm_preview_player.stream = _bgm_preview_stream
	_bgm_preview_player.volume_db = _get_bgm_preview_volume_db()
	_bgm_preview_player.play()
	_refresh_audio_preview_button_state()


func _stop_bgm_preview() -> void:
	if _bgm_preview_player != null:
		_bgm_preview_player.stop()
	_refresh_audio_preview_button_state()


func _stop_audio_previews() -> void:
	_stop_bgm_preview()
	if _se_preview_player != null:
		_se_preview_player.stop()


func _load_bgm_preview_stream() -> bool:
	if _bgm_preview_stream != null:
		return true
	var preview := _load_audio_preview_stream("bgm", true)
	if preview.is_empty():
		_refresh_audio_preview_button_state()
		return false
	_bgm_preview_stream = preview.get("stream") as AudioStream
	_bgm_preview_base_volume_db = float(preview.get("base_volume_db", 0.0))
	if _bgm_preview_player != null:
		_bgm_preview_player.stream = _bgm_preview_stream
	_refresh_audio_preview_button_state()
	return _bgm_preview_stream != null


func _load_se_preview_stream() -> bool:
	if _se_preview_stream != null:
		return true
	var preview := _load_audio_preview_stream("sfx", false)
	if preview.is_empty():
		_refresh_audio_preview_button_state()
		return false
	_se_preview_stream = preview.get("stream") as AudioStream
	_se_preview_base_volume_db = float(preview.get("base_volume_db", 0.0))
	if _se_preview_player != null:
		_se_preview_player.stream = _se_preview_stream
	_refresh_audio_preview_button_state()
	return _se_preview_stream != null


func _load_audio_preview_stream(kind: String, loop: bool) -> Dictionary:
	for asset in _get_audio_preview_assets(kind):
		var path := _normalize_resource_path(String(asset.get("path", "")))
		if path.is_empty():
			continue
		var stream := load(path) as AudioStream
		if stream == null:
			continue
		_set_audio_stream_loop(stream, loop)
		return {
			"stream": stream,
			"base_volume_db": _get_story_asset_volume_db(asset, 0.0),
		}
	return {}


func _get_audio_preview_assets(kind: String) -> Array:
	var result: Array = []
	if not VisualNovelData.has_method("get_all_story_assets"):
		return result
	var raw_assets: Variant = VisualNovelData.call("get_all_story_assets")
	if typeof(raw_assets) != TYPE_ARRAY:
		return result

	var clean_kind := kind.strip_edges().to_lower()
	for raw_asset in raw_assets as Array:
		if typeof(raw_asset) != TYPE_DICTIONARY:
			continue
		var asset: Dictionary = raw_asset
		if String(asset.get("kind", "")).strip_edges().to_lower() != clean_kind:
			continue
		if _normalize_resource_path(String(asset.get("path", ""))).is_empty():
			continue
		result.append(asset)
	return result


func _refresh_audio_preview_player_volumes() -> void:
	if _bgm_preview_player != null and _bgm_preview_stream != null:
		_bgm_preview_player.volume_db = _get_bgm_preview_volume_db()
	if _se_preview_player != null and _se_preview_stream != null:
		_se_preview_player.volume_db = _get_se_preview_volume_db()


func _refresh_audio_preview_button_state() -> void:
	if _bgm_preview_button != null:
		var bgm_playing := _bgm_preview_player != null and _bgm_preview_player.playing
		_bgm_preview_button.text = "BGM 정지" if bgm_playing else "BGM 재생"
		_bgm_preview_button.icon = _get_mui_icon("StopRounded" if bgm_playing else "PlayArrowRounded", 32, ACCENT_LIGHT_COLOR)
		_bgm_preview_button.disabled = _bgm_preview_stream == null and _get_audio_preview_assets("bgm").is_empty()
	if _se_preview_button != null:
		_se_preview_button.disabled = _se_preview_stream == null and _get_audio_preview_assets("sfx").is_empty()


func _get_bgm_preview_volume_db() -> float:
	return _apply_audio_preview_volume_db(_bgm_preview_base_volume_db, _draft_float(GameSettings.BGM_VOLUME))


func _get_se_preview_volume_db() -> float:
	return _apply_audio_preview_volume_db(_se_preview_base_volume_db, _draft_float(GameSettings.SE_VOLUME))


func _apply_audio_preview_volume_db(base_volume_db: float, volume: float) -> float:
	var volume_offset_db := GameSettings.linear_volume_to_db(volume)
	if volume_offset_db <= -79.9:
		return -80.0
	return maxf(base_volume_db + volume_offset_db, -80.0)


func _get_story_asset_volume_db(asset: Dictionary, default_value := 0.0) -> float:
	if asset.is_empty():
		return default_value
	if asset.has("volume_db"):
		return float(asset.get("volume_db", default_value))
	if asset.has("volume"):
		var volume := float(asset.get("volume", 1.0))
		if volume >= 0.0 and volume <= 1.0:
			return linear_to_db(maxf(volume, 0.0001))
		return volume
	return default_value


func _normalize_resource_path(raw_path: String) -> String:
	var path := raw_path.strip_edges()
	if path.is_empty():
		return ""
	if path.begins_with("res://") or path.begins_with("user://"):
		return path
	return "res://%s" % path.trim_prefix("/")


func _get_dialogue_text_sound_device_boost_db() -> float:
	return DIALOGUE_TEXT_SOUND_MOBILE_VOLUME_BOOST_DB if _is_mobile_audio_target() else 0.0


func _is_mobile_audio_target() -> bool:
	if (
		OS.has_feature("android")
		or OS.has_feature("ios")
		or OS.has_feature("mobile")
		or OS.has_feature("web_android")
		or OS.has_feature("web_ios")
	):
		return true
	if OS.has_feature("web"):
		return WebDisplayBridge.is_mobile_web()
	return false


func _set_audio_stream_loop(stream: AudioStream, loop: bool) -> void:
	if stream == null:
		return
	if _set_object_property_if_present(stream, "loop", loop):
		return
	_set_object_property_if_present(stream, "loop_mode", 1 if loop else 0)


func _set_object_property_if_present(object: Object, property_name: StringName, value: Variant) -> bool:
	if object == null:
		return false
	for property in object.get_property_list():
		if StringName(property.get("name", "")) != property_name:
			continue
		object.set(property_name, value)
		return true
	return false


func _apply_responsive_layout() -> void:
	var layout_size := _get_layout_size()
	var compact := _is_compact_options_layout(layout_size)
	var margin_x := _mobile_scaled_float(36.0, 52.0)
	var margin_y := _mobile_scaled_float(32.0, 46.0)
	if compact:
		margin_x = _mobile_scaled_float(24.0, 32.0)
		margin_y = _mobile_scaled_float(24.0, 34.0)

	if _root_layout != null:
		_root_layout.offset_left = margin_x
		_root_layout.offset_top = margin_y
		_root_layout.offset_right = -margin_x
		_root_layout.offset_bottom = -margin_y
		_root_layout.add_theme_constant_override("separation", _mobile_scaled_int(22 if compact else 28, 30 if compact else 36))
	if _header != null:
		_header.add_theme_constant_override("separation", _mobile_scaled_int(14 if compact else 20, 18 if compact else 26))
	if _title_label != null:
		_title_label.add_theme_font_size_override("font_size", _mobile_scaled_int(38 if compact else 50, 48 if compact else 60))
	if _content_columns != null:
		_content_columns.vertical = compact
		_content_columns.add_theme_constant_override("separation", _mobile_scaled_int(20 if compact else 26, 26 if compact else 32))

	_apply_button_metrics(_back_button, compact)
	_apply_button_metrics(_reset_button, compact)
	_apply_button_metrics(_save_button, compact)
	_apply_button_metrics(_bgm_preview_button, compact)
	_apply_button_metrics(_se_preview_button, compact)
	for panel_name in SECTION_NAMES:
		_apply_section_metrics(panel_name, compact)
	_apply_preview_metrics(compact)
	_apply_display_preview_metrics(compact)
	_layout_save_toast(compact)


func _layout_save_toast(compact: bool) -> void:
	if _save_toast == null:
		return
	var toast_width := _mobile_scaled_float(300.0 if compact else 330.0, 390.0)
	var toast_height := _mobile_scaled_float(58.0 if compact else 62.0, 72.0)
	var toast_top := _mobile_scaled_float(88.0 if compact else 104.0, 118.0)
	var layout_size := _get_layout_size()
	_save_toast.set_anchors_preset(Control.PRESET_TOP_LEFT)
	_save_toast.offset_left = (layout_size.x - toast_width) * 0.5
	_save_toast.offset_right = _save_toast.offset_left + toast_width
	_save_toast.offset_top = toast_top
	_save_toast.offset_bottom = toast_top + toast_height
	if _save_toast_label != null:
		_save_toast_label.add_theme_font_size_override("font_size", _mobile_scaled_int(21, 27))


func _show_save_toast() -> void:
	if _save_toast == null:
		return
	if _save_toast_tween != null:
		_save_toast_tween.kill()

	_save_toast.visible = true
	_save_toast.modulate.a = 0.0
	_save_toast_tween = create_tween()
	_save_toast_tween.tween_property(_save_toast, "modulate:a", 1.0, 0.12)
	_save_toast_tween.tween_interval(1.1)
	_save_toast_tween.tween_property(_save_toast, "modulate:a", 0.0, 0.22)
	_save_toast_tween.tween_callback(func() -> void:
		_save_toast.visible = false
		_save_toast_tween = null
	)


func _apply_section_metrics(panel_name: String, compact: bool) -> void:
	var panel := get_node_or_null("OptionsLayout/OptionsScroll/ContentColumns/%s" % panel_name) as PanelContainer
	if panel == null:
		return
	panel.size_flags_vertical = Control.SIZE_SHRINK_BEGIN if compact else Control.SIZE_EXPAND_FILL
	var base_height := 390.0 if compact else 438.0
	var target_height := 470.0 if compact else 520.0
	if panel_name == "VolumePanel":
		base_height = 460.0 if compact else 470.0
		target_height = 580.0 if compact else 560.0
	elif panel_name == "DialoguePanel":
		base_height = 560.0 if compact else 438.0
		target_height = 680.0 if compact else 540.0
	elif panel_name == "DisplayPanel":
		base_height = 620.0 if compact else 438.0
		target_height = 760.0 if compact else 540.0
	panel.custom_minimum_size = Vector2(0.0, _mobile_scaled_float(base_height, target_height))

	var margin := panel.get_node_or_null("Margin") as MarginContainer
	if margin != null:
		var panel_margin := _mobile_scaled_int(22 if compact else 30, 30 if compact else 38)
		margin.add_theme_constant_override("margin_left", panel_margin)
		margin.add_theme_constant_override("margin_top", panel_margin)
		margin.add_theme_constant_override("margin_right", panel_margin)
		margin.add_theme_constant_override("margin_bottom", panel_margin)

	var content := panel.get_node_or_null("Margin/Content") as VBoxContainer
	if content != null:
		content.add_theme_constant_override("separation", _mobile_scaled_int(20 if compact else 26, 26 if compact else 32))
	var heading := panel.get_node_or_null("Margin/Content/SectionHeader/Heading") as Label
	if heading != null:
		heading.add_theme_font_size_override("font_size", _mobile_scaled_int(30 if compact else 36, 38 if compact else 44))
	var list := panel.get_node_or_null("Margin/Content/List") as VBoxContainer
	if list != null:
		list.add_theme_constant_override("separation", _mobile_scaled_int(20 if compact else 24, 26 if compact else 32))
		_apply_control_text_metrics(list, compact)


func _apply_preview_metrics(compact: bool) -> void:
	if _preview_panel == null:
		return
	var margin := _preview_panel.get_node_or_null("Margin") as MarginContainer
	if margin != null:
		var preview_margin_x := _mobile_scaled_int(18 if compact else 20, 26 if compact else 28)
		var preview_margin_y := _mobile_scaled_int(16 if compact else 18, 22 if compact else 24)
		margin.add_theme_constant_override("margin_left", preview_margin_x)
		margin.add_theme_constant_override("margin_top", preview_margin_y)
		margin.add_theme_constant_override("margin_right", preview_margin_x)
		margin.add_theme_constant_override("margin_bottom", preview_margin_y)
	if _preview_speaker_label != null:
		_preview_speaker_label.add_theme_font_size_override("font_size", _mobile_scaled_int(22, 28))
	if _preview_text != null:
		_preview_text.custom_minimum_size = Vector2(0, _mobile_scaled_float(92.0, 118.0))
		_preview_text.add_theme_font_size_override("normal_font_size", _mobile_scaled_int(26, 32))
	_apply_button_metrics(_preview_play_button, compact)


func _apply_display_preview_metrics(compact: bool) -> void:
	if _display_preview_panel == null:
		return
	var margin := _display_preview_panel.get_node_or_null("Margin") as MarginContainer
	if margin != null:
		var preview_margin := _mobile_scaled_int(16 if compact else 18, 22 if compact else 24)
		margin.add_theme_constant_override("margin_left", preview_margin)
		margin.add_theme_constant_override("margin_top", preview_margin)
		margin.add_theme_constant_override("margin_right", preview_margin)
		margin.add_theme_constant_override("margin_bottom", preview_margin)
	if _display_preview_stage != null:
		_display_preview_stage.custom_minimum_size = Vector2(0, _mobile_scaled_float(250.0 if compact else 280.0, 320.0 if compact else 340.0))
	call_deferred("_sync_display_preview_layout")


func _apply_control_text_metrics(node: Node, compact: bool) -> void:
	for child in node.get_children():
		if child is Label:
			var label := child as Label
			var is_value := label.name == "Value"
			var is_range := label.name == "SlowLabel" or label.name == "FastLabel"
			if is_value:
				label.custom_minimum_size = Vector2(_mobile_scaled_float(108.0, 156.0), 0.0)
			label.add_theme_font_size_override("font_size", _mobile_scaled_int(21 if is_range else (23 if is_value else 25), 28 if is_range else (30 if is_value else 34)))
		elif child is CheckButton:
			var toggle := child as CheckButton
			toggle.custom_minimum_size = Vector2(_mobile_scaled_float(148.0, 184.0), _mobile_scaled_float(76.0, 98.0))
			toggle.add_theme_font_size_override("font_size", _mobile_scaled_int(22, 28))
			_style_toggle(toggle, compact or _get_mobile_ui_factor() >= 0.35)
		elif child is HSlider:
			var slider := child as HSlider
			slider.custom_minimum_size = Vector2(0, _mobile_scaled_float(58.0, 82.0))
			_style_slider(slider)
		elif child is HBoxContainer and child.get_node_or_null("Toggle") != null:
			var toggle_row := child as HBoxContainer
			toggle_row.custom_minimum_size = Vector2(0.0, _mobile_scaled_float(76.0, 104.0))
			toggle_row.add_theme_constant_override("separation", _mobile_scaled_int(16, 22))
		elif child is VBoxContainer and child.get_node_or_null("Slider") != null:
			var slider_row := child as VBoxContainer
			slider_row.custom_minimum_size = Vector2(0.0, _mobile_scaled_float(104.0, 134.0))
			slider_row.add_theme_constant_override("separation", _mobile_scaled_int(10, 14))
		_apply_control_text_metrics(child, compact)


func _create_button(node_name: String, text: String, icon_name: String, callback: Callable) -> Button:
	var button := Button.new()
	button.name = node_name
	button.text = text
	button.icon = _get_mui_icon(icon_name, 32, ACCENT_LIGHT_COLOR)
	button.custom_minimum_size = Vector2(138, 62)
	button.add_theme_font_size_override("font_size", 22)
	button.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	button.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	if callback.is_valid():
		button.pressed.connect(callback)
	_style_button(button)
	return button


func _apply_button_metrics(button: Button, compact: bool) -> void:
	if button == null:
		return
	button.custom_minimum_size = Vector2(
		_mobile_scaled_float(118.0 if compact else 138.0, 142.0 if compact else 170.0),
		_mobile_scaled_float(64.0 if compact else 62.0, 96.0)
	)
	button.add_theme_font_size_override("font_size", _mobile_scaled_int(21 if compact else 22, 27 if compact else 28))
	_style_button(button)


func _style_button(button: Button) -> void:
	button.add_theme_stylebox_override("normal", _make_button_stylebox(BUTTON_COLOR, PANEL_BORDER_COLOR, 2, 8))
	button.add_theme_stylebox_override("hover", _make_button_stylebox(BUTTON_HOVER_COLOR, Color(0.70, 0.70, 0.70, 0.78), 2, 8))
	button.add_theme_stylebox_override("focus", _make_button_stylebox(BUTTON_HOVER_COLOR, Color(0.82, 0.82, 0.78, 0.9), 2, 8))
	button.add_theme_stylebox_override("pressed", _make_button_stylebox(BUTTON_PRESSED_COLOR, Color(0.82, 0.82, 0.78, 0.86), 2, 8))
	button.add_theme_constant_override("h_separation", _mobile_scaled_int(10, 14))
	button.add_theme_color_override("font_color", TEXT_COLOR)
	button.add_theme_color_override("font_hover_color", TEXT_COLOR)
	button.add_theme_color_override("font_focus_color", TEXT_COLOR)
	button.add_theme_color_override("font_pressed_color", TEXT_COLOR)


func _style_slider(slider: HSlider) -> void:
	slider.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	slider.add_theme_stylebox_override("slider", _make_slider_track_style(SLIDER_TRACK_COLOR))
	slider.add_theme_stylebox_override("grabber_area", _make_slider_track_style(SLIDER_FILL_COLOR))
	slider.add_theme_stylebox_override("grabber_area_highlight", _make_slider_track_style(SLIDER_FILL_COLOR.lightened(0.08)))
	var grabber := _make_grabber_texture(SLIDER_GRABBER_COLOR, _mobile_scaled_int(20, 32))
	slider.add_theme_icon_override("grabber", grabber)
	slider.add_theme_icon_override("grabber_highlight", grabber)


func _style_toggle(toggle: CheckButton, large: bool) -> void:
	var icon_size := TOGGLE_ICON_SIZE_MOBILE if large else TOGGLE_ICON_SIZE
	toggle.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	toggle.add_theme_constant_override("h_separation", _mobile_scaled_int(12, 16))
	toggle.add_theme_constant_override("check_v_offset", 0)
	toggle.add_theme_icon_override("checked", _make_toggle_icon(true, false, icon_size))
	toggle.add_theme_icon_override("checked_hover", _make_toggle_icon(true, true, icon_size))
	toggle.add_theme_icon_override("checked_pressed", _make_toggle_icon(true, true, icon_size))
	toggle.add_theme_icon_override("unchecked", _make_toggle_icon(false, false, icon_size))
	toggle.add_theme_icon_override("unchecked_hover", _make_toggle_icon(false, true, icon_size))
	toggle.add_theme_icon_override("unchecked_pressed", _make_toggle_icon(false, true, icon_size))


func _make_toggle_icon(checked: bool, hover: bool, size: Vector2i) -> Texture2D:
	var cache_key := "%s:%s:%dx%d" % [checked, hover, size.x, size.y]
	if _toggle_icon_cache.has(cache_key):
		return _toggle_icon_cache[cache_key]

	var image := Image.create(size.x, size.y, false, Image.FORMAT_RGBA8)
	var track_color := TOGGLE_TRACK_ON_COLOR if checked else TOGGLE_TRACK_OFF_COLOR
	if hover:
		track_color = track_color.lightened(0.08)
	var knob_color := TOGGLE_KNOB_COLOR if checked else TOGGLE_KNOB_OFF_COLOR
	var center_y := float(size.y) * 0.5
	var track_radius := float(size.y) * 0.34
	var track_left := float(size.x) * 0.12
	var track_right := float(size.x) * 0.88
	var knob_radius := float(size.y) * 0.24
	var knob_x := track_right - track_radius if checked else track_left + track_radius

	for y in range(size.y):
		for x in range(size.x):
			var point := Vector2(float(x) + 0.5, float(y) + 0.5)
			var track_alpha := _capsule_alpha(point, track_left, track_right, center_y, track_radius)
			if track_alpha > 0.0:
				image.set_pixel(x, y, Color(track_color.r, track_color.g, track_color.b, track_color.a * track_alpha))
			var knob_alpha := clampf(knob_radius - point.distance_to(Vector2(knob_x, center_y)) + 1.0, 0.0, 1.0)
			if knob_alpha > 0.0:
				image.set_pixel(x, y, Color(knob_color.r, knob_color.g, knob_color.b, knob_color.a * knob_alpha))

	var texture := ImageTexture.create_from_image(image)
	_toggle_icon_cache[cache_key] = texture
	return texture


func _capsule_alpha(point: Vector2, left: float, right: float, center_y: float, radius: float) -> float:
	var closest_x := clampf(point.x, left + radius, right - radius)
	var distance := point.distance_to(Vector2(closest_x, center_y))
	return clampf(radius - distance + 1.0, 0.0, 1.0)


func _make_slider_track_style(color: Color) -> StyleBoxFlat:
	return GeneratedUiTheme.slider_track_style(color, 4, _mobile_scaled_int(4, 7), _mobile_scaled_int(4, 7))


func _make_grabber_texture(color: Color, diameter: int) -> Texture2D:
	var image := Image.create(diameter, diameter, false, Image.FORMAT_RGBA8)
	var center := Vector2(float(diameter - 1) * 0.5, float(diameter - 1) * 0.5)
	var radius := float(diameter) * 0.45
	for y in range(diameter):
		for x in range(diameter):
			var distance := Vector2(x, y).distance_to(center)
			var alpha := clampf(radius - distance, 0.0, 1.0)
			image.set_pixel(x, y, Color(color.r, color.g, color.b, alpha * color.a))
	return ImageTexture.create_from_image(image)


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


func _get_mobile_ui_factor() -> float:
	return clampf(MobileLayout.mobile_factor(_get_layout_size()), 0.0, 1.0)


func _is_compact_options_layout(layout_size: Vector2) -> bool:
	if layout_size.x < COMPACT_LAYOUT_WIDTH or layout_size.y > layout_size.x:
		return true
	var window_size := _get_responsive_window_size()
	var compact_width := window_size.x if window_size.x > 0.0 else layout_size.x
	return _get_mobile_ui_factor() >= MOBILE_WIDE_COMPACT_FACTOR and compact_width < MOBILE_WIDE_COMPACT_WIDTH


func _get_responsive_window_size() -> Vector2:
	if OS.has_feature("web"):
		var raw_size: Variant = JavaScriptBridge.eval("""
(() => {
	const width = Number(window.innerWidth || document.documentElement.clientWidth || 0);
	const height = Number(window.innerHeight || document.documentElement.clientHeight || 0);
	return width + "x" + height;
})()
""", true)
		if typeof(raw_size) == TYPE_STRING:
			var parts := String(raw_size).split("x", false)
			if parts.size() >= 2:
				return Vector2(float(parts[0]), float(parts[1]))

	var window_size := DisplayServer.window_get_size()
	if window_size.x > 0 and window_size.y > 0:
		return Vector2(window_size)
	return Vector2.ZERO


func _get_layout_size() -> Vector2:
	if size.x > 0.0 and size.y > 0.0:
		return size
	return get_viewport().get_visible_rect().size

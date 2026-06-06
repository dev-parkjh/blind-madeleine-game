class_name DialogueTypewriter
extends RefCounted

signal typewriter_finished
signal visible_character_changed(visible_count: int, total_count: int)
signal speed_range_active_changed(is_active: bool)
signal dialogue_event_reached(event: Dictionary)

const DIALOGUE_EVENT_TAG_NAMES := [
	"sfx", "sound", "se",
	"bgm", "music",
	"bgm_stop", "music_stop",
	"bgm_volume", "music_volume",
	"bg", "background",
	"bg_clear", "background_clear", "bg_remove", "background_remove",
	"auto_next", "auto_advance", "advance",
	"enter", "exit",
]
const DIALOGUE_SPEED_TAG_NAMES := [
	"speed", "text_speed", "type_speed", "typewriter_speed",
]
const STATIC_FADE_DEFAULT_END_ALPHA := 0.3

var seconds_per_character: float = 0.036
var pause_character: String = "|"
var seconds_per_pause: float = 0.2
var escape_character: String = "\\"
var default_speed_multiplier: float = 1.0
var playback_speed_multiplier: float = 1.0

var _label: RichTextLabel
var _is_typing := false
var _typing_accumulator := 0.0
var _total_characters := 0
var _last_visible_character_count := 0
var _pause_by_index: Dictionary = {}
var _events_by_index: Dictionary = {}
var _event_indexes: Array[int] = []
var _event_cursor := 0
var _speed_ranges: Array[Dictionary] = []
var _is_speed_range_active := false
var _drop_next_process_delta := false


func bind(label: RichTextLabel) -> void:
	_label = label


func start_line(text: String) -> void:
	if _label == null:
		return

	var parsed := _parse_text_with_pauses(text)
	_label.text = parsed.display_text
	_start_parsed_line(parsed.pause_by_index, [], parsed.events_by_index)


func start_bbcode_line(text: String, speed_ranges: Array[Dictionary] = []) -> void:
	if _label == null:
		return

	var parsed := _parse_rich_text_with_pauses(text)
	_label.bbcode_text = parsed.display_text
	var combined_speed_ranges: Array[Dictionary] = []
	var parsed_speed_ranges: Array = parsed.get("speed_ranges", [])
	for raw_speed_range in parsed_speed_ranges:
		if typeof(raw_speed_range) == TYPE_DICTIONARY:
			combined_speed_ranges.append((raw_speed_range as Dictionary).duplicate(true))
	combined_speed_ranges.append_array(speed_ranges.duplicate(true))
	_start_parsed_line(parsed.pause_by_index, combined_speed_ranges, parsed.events_by_index)


func prepare_static_bbcode_line(text: String, target_label: RichTextLabel = null) -> String:
	var previous_label := _label
	if target_label != null:
		_label = target_label
	var parsed := _parse_rich_text_with_pauses(text)
	_label = previous_label
	return String(parsed.get("display_text", text))


func _start_parsed_line(
	pause_by_index: Dictionary,
	speed_ranges: Array[Dictionary],
	events_by_index: Dictionary
) -> void:
	_label.visible_characters = 0
	_total_characters = _label.get_total_character_count()
	_last_visible_character_count = 0
	_pause_by_index = pause_by_index
	_events_by_index = _duplicate_events_by_index(events_by_index)
	_event_indexes = _sorted_event_indexes(_events_by_index)
	_event_cursor = 0
	_speed_ranges = speed_ranges.duplicate(true)
	_set_speed_range_active(false)
	_typing_accumulator = _base_seconds_for_next_character()
	_is_typing = _total_characters > 0
	_refresh_speed_range_active()
	_fire_events_up_to(0)
	visible_character_changed.emit(0, _total_characters)

	if not _is_typing:
		reveal_all()


func process(delta: float) -> bool:
	if not _is_typing:
		return false

	if _drop_next_process_delta:
		delta = 0.0
		_drop_next_process_delta = false

	_typing_accumulator += delta
	while _last_visible_character_count < _total_characters:
		_refresh_speed_range_active()
		var next_character_delay := _seconds_for_next_character()
		if _typing_accumulator < next_character_delay:
			break

		_typing_accumulator -= next_character_delay
		_set_visible_character_count(_last_visible_character_count + 1)

	_refresh_speed_range_active()
	if _last_visible_character_count >= _total_characters:
		_finish_typewriter()

	return _is_typing


func request_advance() -> bool:
	if _is_typing:
		reveal_all()
		return false

	return true


func reveal_all() -> void:
	if _label == null:
		return

	_set_visible_character_count(_total_characters)
	_label.visible_characters = -1
	_finish_typewriter()


func cancel() -> void:
	if not _is_typing:
		return
	_is_typing = false
	_typing_accumulator = 0.0
	_drop_next_process_delta = false
	_event_cursor = _event_indexes.size()
	_set_speed_range_active(false)


func is_typing() -> bool:
	return _is_typing


func prepare_to_resume() -> void:
	if not _is_typing:
		return
	_typing_accumulator = 0.0
	_drop_next_process_delta = true
	_refresh_speed_range_active()


func _set_visible_character_count(visible_count: int) -> void:
	var clamped_count := clampi(visible_count, 0, _total_characters)
	if clamped_count == _last_visible_character_count:
		return

	_last_visible_character_count = clamped_count
	_label.visible_characters = clamped_count
	_refresh_speed_range_active()
	_fire_events_up_to(clamped_count)
	visible_character_changed.emit(clamped_count, _total_characters)


func _finish_typewriter() -> void:
	var was_typing := _is_typing
	_is_typing = false
	_set_speed_range_active(false)
	if was_typing:
		typewriter_finished.emit()


func _seconds_for_next_character() -> float:
	var extra := float(_pause_by_index.get(_last_visible_character_count, 0.0))
	return _base_seconds_for_next_character() + extra


func _base_seconds_for_next_character() -> float:
	return seconds_per_character / maxf(_current_speed_multiplier() * playback_speed_multiplier, 0.01)


func _current_speed_multiplier() -> float:
	for speed_range in _speed_ranges:
		var start := int(speed_range.get("start", -1))
		var end := int(speed_range.get("end", -1))
		if start < 0 or end <= start:
			continue
		if _last_visible_character_count >= start and _last_visible_character_count < end:
			return float(speed_range.get("speed_multiplier", default_speed_multiplier))
		if _last_visible_character_count > 0:
			var last_visible_character_index := _last_visible_character_count - 1
			if last_visible_character_index >= start and last_visible_character_index < end:
				return float(speed_range.get("exit_speed_multiplier", speed_range.get("speed_multiplier", default_speed_multiplier)))
	return default_speed_multiplier


func _refresh_speed_range_active() -> void:
	if not _is_typing:
		_set_speed_range_active(false)
		return
	_set_speed_range_active(not is_equal_approx(_current_speed_multiplier(), default_speed_multiplier))


func _set_speed_range_active(is_active: bool) -> void:
	if _is_speed_range_active == is_active:
		return
	_is_speed_range_active = is_active
	speed_range_active_changed.emit(is_active)


func _parse_text_with_pauses(text: String) -> Dictionary:
	var display := ""
	var pauses := {}
	var events := {}
	var visible_index := 0
	var i := 0
	while i < text.length():
		var ch := text[i]

		if ch == "[":
			var event_tag := _parse_dialogue_event_tag_at(text, i)
			if not event_tag.is_empty():
				_add_dialogue_event(events, visible_index, event_tag.get("event", {}))
				i = int(event_tag.get("next_index", i + 1))
				continue

		if ch == escape_character and i + 1 < text.length():
			var next := text[i + 1]
			if next == pause_character or next == escape_character:
				display += next
				visible_index += 1
				i += 2
				continue

		if ch == pause_character:
			# Supports:
			# - "|" => default pause
			# - "||" => two default pauses
			# - "|0.2|" => custom pause seconds (float)
			var consumed := false
			var custom_pause := _parse_custom_pause_at(text, i)
			if not custom_pause.is_empty():
				var parsed := float(custom_pause.get("seconds", 0.0))
				if parsed > 0.0:
					pauses[visible_index] = float(pauses.get(visible_index, 0.0)) + parsed
				else:
					pauses[visible_index] = float(pauses.get(visible_index, 0.0)) + seconds_per_pause
				i = int(custom_pause.get("next_index", i + 1))
				consumed = true
			if not consumed:
				pauses[visible_index] = float(pauses.get(visible_index, 0.0)) + seconds_per_pause
				i += 1
			continue

		display += ch
		visible_index += 1
		i += 1
	return {
		"display_text": display,
		"pause_by_index": pauses,
		"events_by_index": events,
	}


func _parse_rich_text_with_pauses(text: String) -> Dictionary:
	text = _normalize_static_fade_tags(text)
	text = _normalize_font_scale_gradient_tags(text)

	var display := ""
	var pauses := {}
	var events := {}
	var speed_ranges: Array[Dictionary] = []
	var speed_stack: Array[Dictionary] = []
	var visible_index := 0
	var i := 0
	while i < text.length():
		var ch := text[i]

		if ch == "[":
			var close_index := text.find("]", i)
			if close_index >= 0:
				var tag_body := text.substr(i + 1, close_index - i - 1)
				var event := _parse_dialogue_event_tag(tag_body)
				if not event.is_empty():
					_add_dialogue_event(events, visible_index, event)
					i = close_index + 1
					continue

				var tag_name := _get_dialogue_event_tag_name(tag_body)
				if DIALOGUE_SPEED_TAG_NAMES.has(tag_name):
					if tag_body.strip_edges().begins_with("/"):
						_close_dialogue_speed_range(speed_stack, speed_ranges, tag_name, visible_index)
					else:
						speed_stack.append({
							"name": tag_name,
							"start": visible_index,
							"speed_multiplier": _get_dialogue_speed_multiplier(tag_body),
						})
					i = close_index + 1
					continue

				var tag := text.substr(i, close_index - i + 1)
				if tag_name == "font_scale":
					tag = _build_font_size_tag_from_scale(tag_body)
				display += tag
				if tag_name == "lb" or tag_name == "rb":
					visible_index += 1
				i = close_index + 1
				continue

		if ch == escape_character and i + 1 < text.length():
			var next := text[i + 1]
			if next == pause_character or next == escape_character:
				display += next
				visible_index += 1
				i += 2
				continue

		if ch == pause_character:
			var consumed := false
			var custom_pause := _parse_custom_pause_at(text, i)
			if not custom_pause.is_empty():
				var parsed := float(custom_pause.get("seconds", 0.0))
				pauses[visible_index] = float(pauses.get(visible_index, 0.0)) + (parsed if parsed > 0.0 else seconds_per_pause)
				i = int(custom_pause.get("next_index", i + 1))
				consumed = true
			if not consumed:
				pauses[visible_index] = float(pauses.get(visible_index, 0.0)) + seconds_per_pause
				i += 1
			continue

		display += ch
		visible_index += 1
		i += 1

	for speed_range in speed_stack:
		_append_dialogue_speed_range(
			speed_ranges,
			int(speed_range.get("start", 0)),
			visible_index,
			float(speed_range.get("speed_multiplier", default_speed_multiplier))
		)

	return {
		"display_text": display,
		"pause_by_index": pauses,
		"events_by_index": events,
		"speed_ranges": speed_ranges,
	}


func _normalize_static_fade_tags(text: String) -> String:
	var display := ""
	var cursor := 0
	while cursor < text.length():
		var open_index := text.find("[", cursor)
		if open_index < 0:
			display += text.substr(cursor)
			break

		display += text.substr(cursor, open_index - cursor)
		var close_index := text.find("]", open_index + 1)
		if close_index < 0:
			display += text.substr(open_index)
			break

		var tag_body := text.substr(open_index + 1, close_index - open_index - 1)
		if _is_static_fade_open_tag(tag_body):
			var fade_close := _find_static_fade_close(text, close_index + 1)
			if fade_close.x >= 0:
				var fade_source := text.substr(close_index + 1, fade_close.x - close_index - 1)
				display += _build_static_fade_bbcode(fade_source, tag_body)
				cursor = fade_close.y
				continue

		display += text.substr(open_index, close_index - open_index + 1)
		cursor = close_index + 1
	return display


func _normalize_font_scale_gradient_tags(text: String) -> String:
	var display := ""
	var cursor := 0
	while cursor < text.length():
		var open_index := text.find("[", cursor)
		if open_index < 0:
			display += text.substr(cursor)
			break

		display += text.substr(cursor, open_index - cursor)
		var close_index := text.find("]", open_index + 1)
		if close_index < 0:
			display += text.substr(open_index)
			break

		var tag_body := text.substr(open_index + 1, close_index - open_index - 1)
		if _is_font_scale_gradient_open_tag(tag_body):
			var gradient_close := _find_font_scale_gradient_close(text, close_index + 1)
			if gradient_close.x >= 0:
				var gradient_source := text.substr(close_index + 1, gradient_close.x - close_index - 1)
				display += _build_font_scale_gradient_bbcode(gradient_source, tag_body)
				cursor = gradient_close.y
				continue

		display += text.substr(open_index, close_index - open_index + 1)
		cursor = close_index + 1
	return display


func _is_font_scale_gradient_open_tag(tag_body: String) -> bool:
	var body := tag_body.strip_edges()
	if body.is_empty() or body.begins_with("/") or _get_dialogue_event_tag_name(body) != "font_scale":
		return false

	var attrs := _parse_font_scale_gradient_attributes(body)
	return attrs.has("from") or attrs.has("from_scale") or attrs.has("start") \
		or attrs.has("to") or attrs.has("to_scale") or attrs.has("end")


func _find_font_scale_gradient_close(text: String, start_index: int) -> Vector2i:
	var depth := 1
	var cursor := start_index
	while cursor < text.length():
		var open_index := text.find("[", cursor)
		if open_index < 0:
			break

		var close_index := text.find("]", open_index + 1)
		if close_index < 0:
			break

		var tag_body := text.substr(open_index + 1, close_index - open_index - 1)
		if _get_dialogue_event_tag_name(tag_body) == "font_scale":
			if tag_body.strip_edges().begins_with("/"):
				depth -= 1
				if depth <= 0:
					return Vector2i(open_index, close_index + 1)
			else:
				depth += 1

		cursor = close_index + 1
	return Vector2i(-1, -1)


func _build_font_scale_gradient_bbcode(source: String, tag_body: String) -> String:
	var attrs := _parse_font_scale_gradient_attributes(tag_body)
	var total_visible := _count_static_fade_visible_characters(source)
	if total_visible <= 0:
		return source

	var from_scale := clampf(_get_static_fade_float(attrs, ["from", "from_scale", "start"], 1.0), 0.25, 4.0)
	var to_scale := clampf(_get_static_fade_float(attrs, ["to", "to_scale", "end"], 0.3), 0.25, 4.0)
	var display := ""
	var visible_index := 0
	var i := 0

	while i < source.length():
		var ch := source[i]

		if ch == "[":
			var close_index := source.find("]", i + 1)
			if close_index >= 0:
				var inner_tag_body := source.substr(i + 1, close_index - i - 1)
				var tag_name := _get_dialogue_event_tag_name(inner_tag_body)
				var tag := source.substr(i, close_index - i + 1)
				if tag_name == "lb" or tag_name == "rb":
					display += _apply_font_scale_gradient_to_token(tag, visible_index, total_visible, from_scale, to_scale)
					visible_index += 1
				else:
					display += tag
				i = close_index + 1
				continue

		if ch == escape_character and i + 1 < source.length():
			var next := source[i + 1]
			if next == pause_character or next == escape_character:
				var escaped_token := source.substr(i, 2)
				display += _apply_font_scale_gradient_to_token(escaped_token, visible_index, total_visible, from_scale, to_scale)
				visible_index += 1
				i += 2
				continue

		if ch == pause_character:
			var custom_pause := _parse_custom_pause_at(source, i)
			if not custom_pause.is_empty():
				var next_index := int(custom_pause.get("next_index", i + 1))
				display += source.substr(i, next_index - i)
				i = next_index
			else:
				display += ch
				i += 1
			continue

		display += _apply_font_scale_gradient_to_token(ch, visible_index, total_visible, from_scale, to_scale)
		visible_index += 1
		i += 1
	return display


func _parse_font_scale_gradient_attributes(tag_body: String) -> Dictionary:
	var body := tag_body.strip_edges()
	var tag_name := _get_dialogue_event_tag_name(body)
	var attr_text := body.substr(mini(tag_name.length(), body.length())).strip_edges()
	return _parse_dialogue_event_attributes(attr_text)


func _apply_font_scale_gradient_to_token(
	token: String,
	visible_index: int,
	total_visible: int,
	from_scale: float,
	to_scale: float
) -> String:
	var amount := 0.0
	if total_visible > 1:
		amount = float(visible_index) / float(total_visible - 1)
	var scale := lerpf(from_scale, to_scale, clampf(amount, 0.0, 1.0))
	return "[font_scale=%.3f]%s[/font_scale]" % [scale, token]


func _is_static_fade_open_tag(tag_body: String) -> bool:
	var body := tag_body.strip_edges()
	return not body.is_empty() and not body.begins_with("/") and _get_dialogue_event_tag_name(body) == "fade"


func _find_static_fade_close(text: String, start_index: int) -> Vector2i:
	var depth := 1
	var cursor := start_index
	while cursor < text.length():
		var open_index := text.find("[", cursor)
		if open_index < 0:
			break

		var close_index := text.find("]", open_index + 1)
		if close_index < 0:
			break

		var tag_body := text.substr(open_index + 1, close_index - open_index - 1)
		if _get_dialogue_event_tag_name(tag_body) == "fade":
			if tag_body.strip_edges().begins_with("/"):
				depth -= 1
				if depth <= 0:
					return Vector2i(open_index, close_index + 1)
			else:
				depth += 1

		cursor = close_index + 1
	return Vector2i(-1, -1)


func _build_static_fade_bbcode(source: String, tag_body: String) -> String:
	var attrs := _parse_static_fade_attributes(tag_body)
	var total_visible := _count_static_fade_visible_characters(source)
	var fade_start := clampi(_get_static_fade_int(attrs, ["start", "from_index", "offset"], 0), 0, total_visible)
	var default_length := maxi(total_visible - fade_start, 0)
	var fade_length := maxi(_get_static_fade_int(attrs, ["length", "len", "count"], default_length), 0)
	var fade_end := clampi(fade_start + fade_length, fade_start, total_visible)
	var from_alpha := clampf(_get_static_fade_float(attrs, ["from", "from_alpha", "start_alpha"], 1.0), 0.0, 1.0)
	var to_alpha := clampf(
		_get_static_fade_float(attrs, ["to", "to_alpha", "end_alpha", "min"], STATIC_FADE_DEFAULT_END_ALPHA),
		0.0,
		1.0
	)
	var active_tags: Array[String] = []
	var display := ""
	var visible_index := 0
	var i := 0

	while i < source.length():
		var ch := source[i]

		if ch == "[":
			var close_index := source.find("]", i + 1)
			if close_index >= 0:
				var inner_tag_body := source.substr(i + 1, close_index - i - 1)
				var tag_name := _get_dialogue_event_tag_name(inner_tag_body)
				var tag := source.substr(i, close_index - i + 1)
				if tag_name == "lb" or tag_name == "rb":
					if visible_index >= fade_end:
						break
					display += _apply_static_fade_to_token(tag, visible_index, fade_start, fade_end, from_alpha, to_alpha)
					visible_index += 1
					i = close_index + 1
					continue

				if visible_index < fade_end or inner_tag_body.strip_edges().begins_with("/"):
					display += tag
					_track_static_fade_bbcode_tag(inner_tag_body, active_tags)
				i = close_index + 1
				continue

		if ch == escape_character and i + 1 < source.length():
			var next := source[i + 1]
			if next == pause_character or next == escape_character:
				if visible_index >= fade_end:
					break
				var escaped_token := source.substr(i, 2)
				display += _apply_static_fade_to_token(escaped_token, visible_index, fade_start, fade_end, from_alpha, to_alpha)
				visible_index += 1
				i += 2
				continue

		if ch == pause_character:
			display += ch
			i += 1
			continue

		if visible_index >= fade_end:
			break

		display += _apply_static_fade_to_token(ch, visible_index, fade_start, fade_end, from_alpha, to_alpha)
		visible_index += 1
		i += 1

	for stack_index in range(active_tags.size() - 1, -1, -1):
		display += "[/%s]" % active_tags[stack_index]
	return display


func _parse_static_fade_attributes(tag_body: String) -> Dictionary:
	var body := tag_body.strip_edges()
	var tag_name := _get_dialogue_event_tag_name(body)
	var attr_text := body.substr(mini(tag_name.length(), body.length())).strip_edges()
	return _parse_dialogue_event_attributes(attr_text)


func _count_static_fade_visible_characters(text: String) -> int:
	var count := 0
	var i := 0
	while i < text.length():
		var ch := text[i]
		if ch == "[":
			var close_index := text.find("]", i + 1)
			if close_index >= 0:
				var tag_body := text.substr(i + 1, close_index - i - 1)
				var tag_name := _get_dialogue_event_tag_name(tag_body)
				if tag_name == "lb" or tag_name == "rb":
					count += 1
				i = close_index + 1
				continue

		if ch == escape_character and i + 1 < text.length():
			var next := text[i + 1]
			if next == pause_character or next == escape_character:
				count += 1
				i += 2
				continue

		if ch == pause_character:
			i += 1
			continue

		count += 1
		i += 1
	return count


func _apply_static_fade_to_token(
	token: String,
	visible_index: int,
	fade_start: int,
	fade_end: int,
	from_alpha: float,
	to_alpha: float
) -> String:
	if visible_index < fade_start or fade_end <= fade_start:
		return token

	var fade_count := fade_end - fade_start
	var amount := 0.0
	if fade_count > 1:
		amount = float(visible_index - fade_start) / float(fade_count - 1)
	var alpha := lerpf(from_alpha, to_alpha, clampf(amount, 0.0, 1.0))
	return "[alpha value=%.3f]%s[/alpha]" % [alpha, token]


func _track_static_fade_bbcode_tag(tag_body: String, active_tags: Array[String]) -> void:
	var body := tag_body.strip_edges()
	if body.is_empty():
		return

	var tag_name := _get_dialogue_event_tag_name(body)
	if tag_name.is_empty() or tag_name == "lb" or tag_name == "rb" or DIALOGUE_EVENT_TAG_NAMES.has(tag_name):
		return

	if body.begins_with("/"):
		for index in range(active_tags.size() - 1, -1, -1):
			if active_tags[index] == tag_name:
				active_tags.remove_at(index)
				return
		return

	active_tags.append(tag_name)


func _get_static_fade_int(attrs: Dictionary, names: Array[String], default_value: int) -> int:
	for name in names:
		if not attrs.has(name):
			continue
		var value := String(attrs[name]).strip_edges()
		if _is_numeric_text(value):
			return int(round(float(value)))
	return default_value


func _get_static_fade_float(attrs: Dictionary, names: Array[String], default_value: float) -> float:
	for name in names:
		if not attrs.has(name):
			continue
		var value := String(attrs[name]).strip_edges()
		if _is_numeric_text(value):
			return float(value)
	return default_value


func _close_dialogue_speed_range(
	speed_stack: Array[Dictionary],
	speed_ranges: Array[Dictionary],
	tag_name: String,
	visible_index: int
) -> void:
	for index in range(speed_stack.size() - 1, -1, -1):
		if String(speed_stack[index].get("name", "")) == tag_name:
			var speed_range := speed_stack[index]
			speed_stack.remove_at(index)
			_append_dialogue_speed_range(
				speed_ranges,
				int(speed_range.get("start", 0)),
				visible_index,
				float(speed_range.get("speed_multiplier", default_speed_multiplier))
			)
			return

	if speed_stack.is_empty():
		return
	var fallback_range := speed_stack.pop_back() as Dictionary
	_append_dialogue_speed_range(
		speed_ranges,
		int(fallback_range.get("start", 0)),
		visible_index,
		float(fallback_range.get("speed_multiplier", default_speed_multiplier))
	)


func _append_dialogue_speed_range(
	speed_ranges: Array[Dictionary],
	start: int,
	end: int,
	speed_multiplier: float
) -> void:
	if end <= start:
		return
	speed_ranges.append({
		"start": maxi(start, 0),
		"end": maxi(end, 0),
		"speed_multiplier": clampf(speed_multiplier, 0.05, 8.0),
		"exit_speed_multiplier": default_speed_multiplier,
	})


func _get_dialogue_speed_multiplier(tag_body: String) -> float:
	var body := tag_body.strip_edges()
	if body.is_empty() or body.begins_with("/"):
		return default_speed_multiplier

	var tag_name := _get_dialogue_event_tag_name(body)
	var attr_text := body.substr(mini(tag_name.length(), body.length())).strip_edges()
	var raw_multiplier := ""
	if attr_text.begins_with("="):
		raw_multiplier = _unquote_dialogue_event_value(attr_text.substr(1).strip_edges())
	else:
		var attrs := _parse_dialogue_event_attributes(attr_text)
		for key in ["value", "multiplier", "rate", "speed", "x"]:
			if attrs.has(key):
				raw_multiplier = String(attrs[key]).strip_edges()
				break
		if raw_multiplier.is_empty() and attrs.has("slow"):
			raw_multiplier = "0.6"
		if raw_multiplier.is_empty() and attrs.has("fast"):
			raw_multiplier = "1.8"

	if raw_multiplier.is_empty() or not _is_numeric_text(raw_multiplier):
		return default_speed_multiplier
	return clampf(float(raw_multiplier), 0.05, 8.0)


func _build_font_size_tag_from_scale(tag_body: String) -> String:
	var body := tag_body.strip_edges()
	if body.begins_with("/"):
		return "[/font_size]"

	var tag_name := _get_dialogue_event_tag_name(body)
	var attr_text := body.substr(mini(tag_name.length(), body.length())).strip_edges()
	var raw_scale := ""
	if attr_text.begins_with("="):
		raw_scale = _unquote_dialogue_event_value(attr_text.substr(1).strip_edges())
	else:
		var attrs := _parse_dialogue_event_attributes(attr_text)
		for key in ["value", "scale", "multiplier", "ratio", "x"]:
			if attrs.has(key):
				raw_scale = String(attrs[key]).strip_edges()
				break

	var scale := 1.0
	if not raw_scale.is_empty() and _is_numeric_text(raw_scale):
		scale = float(raw_scale)
	scale = clampf(scale, 0.25, 4.0)

	var base_font_size := 36
	if _label != null:
		var label_font_size := _label.get_theme_font_size(&"normal_font_size")
		if label_font_size > 0:
			base_font_size = label_font_size
	return "[font_size=%d]" % maxi(1, int(roundf(float(base_font_size) * scale)))


func _parse_dialogue_event_tag_at(text: String, start_index: int) -> Dictionary:
	var close_index := text.find("]", start_index + 1)
	if close_index < 0:
		return {}

	var tag_body := text.substr(start_index + 1, close_index - start_index - 1)
	var event := _parse_dialogue_event_tag(tag_body)
	if event.is_empty():
		return {}
	return {
		"event": event,
		"next_index": close_index + 1,
	}


func _parse_dialogue_event_tag(tag_body: String) -> Dictionary:
	var body := tag_body.strip_edges()
	if body.is_empty() or body.begins_with("/"):
		return {}

	var tag_name := _get_dialogue_event_tag_name(body)
	if not DIALOGUE_EVENT_TAG_NAMES.has(tag_name):
		return {}

	var attr_text := body.substr(mini(tag_name.length(), body.length())).strip_edges()
	var attrs := _parse_dialogue_event_attributes(attr_text)
	var event := {
		"name": tag_name,
		"attributes": attrs,
		"raw": "[%s]" % tag_body,
	}
	for key in attrs.keys():
		event[key] = attrs[key]
	return event


func _get_dialogue_event_tag_name(raw_tag: String) -> String:
	var tag := raw_tag.strip_edges().to_lower()
	var end_index := tag.length()
	for separator in [" ", "=", "\t", "\n"]:
		var separator_index := tag.find(separator)
		if separator_index >= 0:
			end_index = mini(end_index, separator_index)
	tag = tag.substr(0, end_index)

	var clean_tag := ""
	for i in tag.length():
		var ch := tag[i]
		if (ch >= "a" and ch <= "z") or (ch >= "0" and ch <= "9") or ch == "_":
			clean_tag += ch
	return clean_tag


func _parse_dialogue_event_attributes(attr_text: String) -> Dictionary:
	var attrs := {}
	var text := attr_text.strip_edges()
	if text.is_empty():
		return attrs

	if text.begins_with("="):
		attrs["path"] = _unquote_dialogue_event_value(text.substr(1).strip_edges())
		return attrs

	for token in _tokenize_dialogue_event_attributes(text):
		var separator_index := token.find("=")
		if separator_index >= 0:
			var key := token.substr(0, separator_index).strip_edges().to_lower()
			var value := token.substr(separator_index + 1).strip_edges()
			if not key.is_empty():
				attrs[key] = _unquote_dialogue_event_value(value)
			continue

		var clean_token := _unquote_dialogue_event_value(token.strip_edges())
		if clean_token.is_empty():
			continue
		if not attrs.has("path") and (
			clean_token.begins_with("res://")
			or clean_token.begins_with("user://")
			or clean_token.begins_with("/")
		):
			attrs["path"] = clean_token
		else:
			attrs[clean_token.to_lower()] = true
	return attrs


func _tokenize_dialogue_event_attributes(text: String) -> Array[String]:
	var tokens: Array[String] = []
	var current := ""
	var quote := ""
	for i in text.length():
		var ch := text[i]
		if not quote.is_empty():
			current += ch
			if ch == quote:
				quote = ""
			continue
		if ch == "\"" or ch == "'":
			quote = ch
			current += ch
			continue
		if ch.strip_edges().is_empty():
			if not current.is_empty():
				tokens.append(current)
				current = ""
			continue
		current += ch
	if not current.is_empty():
		tokens.append(current)
	return tokens


func _unquote_dialogue_event_value(value: String) -> String:
	var clean_value := value.strip_edges()
	if clean_value.length() >= 2:
		var first := clean_value[0]
		var last := clean_value[clean_value.length() - 1]
		if (first == "\"" and last == "\"") or (first == "'" and last == "'"):
			return clean_value.substr(1, clean_value.length() - 2)
	return clean_value


func _is_numeric_text(text: String) -> bool:
	var clean_text := text.strip_edges()
	if clean_text.is_empty():
		return false

	var has_digit := false
	var has_decimal_point := false
	for i in clean_text.length():
		var ch := clean_text[i]
		if ch >= "0" and ch <= "9":
			has_digit = true
			continue
		if ch == "." and not has_decimal_point:
			has_decimal_point = true
			continue
		if ch == "-" and i == 0:
			continue
		return false
	return has_digit


func _add_dialogue_event(events: Dictionary, visible_index: int, event: Dictionary) -> void:
	if event.is_empty():
		return
	var key := maxi(visible_index, 0)
	if not events.has(key):
		events[key] = []
	(events[key] as Array).append(event)


func _duplicate_events_by_index(source: Dictionary) -> Dictionary:
	var out := {}
	for raw_index in source.keys():
		var events: Array = source[raw_index]
		var copied_events: Array[Dictionary] = []
		for raw_event in events:
			if typeof(raw_event) == TYPE_DICTIONARY:
				copied_events.append((raw_event as Dictionary).duplicate(true))
		if not copied_events.is_empty():
			out[int(raw_index)] = copied_events
	return out


func _sorted_event_indexes(source: Dictionary) -> Array[int]:
	var indexes: Array[int] = []
	for raw_index in source.keys():
		indexes.append(int(raw_index))
	indexes.sort()
	return indexes


func _fire_events_up_to(visible_count: int) -> void:
	while _event_cursor < _event_indexes.size() and _event_indexes[_event_cursor] <= visible_count:
		var event_index := _event_indexes[_event_cursor]
		var events: Array = _events_by_index.get(event_index, [])
		for raw_event in events:
			if typeof(raw_event) == TYPE_DICTIONARY:
				dialogue_event_reached.emit((raw_event as Dictionary).duplicate(true))
		_event_cursor += 1


func _parse_custom_pause_at(text: String, start_index: int) -> Dictionary:
	if start_index + 1 >= text.length():
		return {}

	var close_index := text.find(pause_character, start_index + 1)
	if close_index < 0:
		return {}

	var token := text.substr(start_index + 1, close_index - start_index - 1)
	if not _is_custom_pause_token(token):
		return {}

	return {
		"seconds": float(token),
		"next_index": close_index + 1,
	}


func _is_custom_pause_token(token: String) -> bool:
	if token.is_empty():
		return false

	var has_digit := false
	var has_decimal_point := false
	for i in token.length():
		var ch := token[i]
		if ch >= "0" and ch <= "9":
			has_digit = true
			continue
		if ch == "." and not has_decimal_point:
			has_decimal_point = true
			continue
		return false
	return has_digit

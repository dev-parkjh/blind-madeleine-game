extends Node

signal setting_changed(key: String)
signal settings_changed

const CONFIG_PATH := "user://settings.cfg"
const CONFIG_SECTION := "options"
const BGM_VOLUME := "bgm_volume"
const SE_VOLUME := "se_volume"
const DIALOGUE_TEXT_SOUND_ENABLED := "dialogue_text_sound_enabled"
const DIALOGUE_TEXT_SOUND_VOLUME := "dialogue_text_sound_volume"
const DIALOGUE_SPEED_STEP := "dialogue_speed_step"
const LEGACY_DIALOGUE_SPEED_MULTIPLIER := "dialogue_speed_multiplier"
const BACKGROUND_IMAGE_ENABLED := "background_image_enabled"
const DIALOGUE_SPECTRUM_ENABLED := "dialogue_spectrum_enabled"
const VOLUME_MIN := 0.0
const VOLUME_MAX := 1.0
const DIALOGUE_SPEED_STEP_MIN := 1
const DIALOGUE_SPEED_STEP_MAX := 7
const DIALOGUE_TEXT_SOUND_BASE_INTERVAL_MSEC := 100

const DIALOGUE_SPEED_MULTIPLIERS := {
	1: 0.45,
	2: 0.62,
	3: 0.80,
	4: 1.0,
	5: 1.32,
	6: 1.70,
	7: 2.20,
}

const DIALOGUE_SPEED_LABELS := {
	1: "매우 느림",
	2: "느림",
	3: "조금 느림",
	4: "보통",
	5: "조금 빠름",
	6: "빠름",
	7: "매우 빠름",
}

const DEFAULTS := {
	BGM_VOLUME: 1.0,
	SE_VOLUME: 1.0,
	DIALOGUE_TEXT_SOUND_VOLUME: 1.0,
	DIALOGUE_SPEED_STEP: 4,
	BACKGROUND_IMAGE_ENABLED: true,
	DIALOGUE_SPECTRUM_ENABLED: true,
}

var _settings: Dictionary = DEFAULTS.duplicate()
var _loaded := false


func _ready() -> void:
	load_settings()


func load_settings() -> void:
	if _loaded:
		return

	_loaded = true
	var config := ConfigFile.new()
	if config.load(CONFIG_PATH) != OK:
		return

	for key in DEFAULTS.keys():
		if not config.has_section_key(CONFIG_SECTION, key):
			continue
		_settings[key] = _normalize_value(key, config.get_value(CONFIG_SECTION, key, DEFAULTS[key]))

	if (
		not config.has_section_key(CONFIG_SECTION, DIALOGUE_TEXT_SOUND_VOLUME)
		and config.has_section_key(CONFIG_SECTION, DIALOGUE_TEXT_SOUND_ENABLED)
	):
		var legacy_enabled := _read_bool(
			config.get_value(CONFIG_SECTION, DIALOGUE_TEXT_SOUND_ENABLED, true),
			true
		)
		_settings[DIALOGUE_TEXT_SOUND_VOLUME] = DEFAULTS[DIALOGUE_TEXT_SOUND_VOLUME] if legacy_enabled else 0.0

	if (
		not config.has_section_key(CONFIG_SECTION, DIALOGUE_SPEED_STEP)
		and config.has_section_key(CONFIG_SECTION, LEGACY_DIALOGUE_SPEED_MULTIPLIER)
	):
		var legacy_multiplier := float(config.get_value(CONFIG_SECTION, LEGACY_DIALOGUE_SPEED_MULTIPLIER, 1.0))
		_settings[DIALOGUE_SPEED_STEP] = _speed_multiplier_to_step(legacy_multiplier)


func save_settings() -> void:
	load_settings()
	var config := ConfigFile.new()
	for key in DEFAULTS.keys():
		config.set_value(CONFIG_SECTION, key, _settings.get(key, DEFAULTS[key]))
	config.save(CONFIG_PATH)


func get_settings_snapshot() -> Dictionary:
	load_settings()
	return _settings.duplicate(true)


func get_default_settings() -> Dictionary:
	return DEFAULTS.duplicate(true)


func apply_settings(values: Dictionary) -> void:
	load_settings()
	var changed_keys: Array[String] = []
	for key in DEFAULTS.keys():
		var text_key := String(key)
		var normalized_value: Variant = _normalize_value(text_key, values.get(text_key, _settings.get(text_key, DEFAULTS[text_key])))
		if _values_match(_settings.get(text_key, DEFAULTS[text_key]), normalized_value):
			continue
		_settings[text_key] = normalized_value
		changed_keys.append(text_key)

	if changed_keys.is_empty():
		return

	save_settings()
	for key in changed_keys:
		setting_changed.emit(key)
	settings_changed.emit()


func reset_defaults() -> void:
	load_settings()
	apply_settings(DEFAULTS)


func get_bgm_volume() -> float:
	return _get_float(BGM_VOLUME)


func set_bgm_volume(value: float) -> void:
	_set_value(BGM_VOLUME, clampf(value, VOLUME_MIN, VOLUME_MAX))


func get_se_volume() -> float:
	return _get_float(SE_VOLUME)


func set_se_volume(value: float) -> void:
	_set_value(SE_VOLUME, clampf(value, VOLUME_MIN, VOLUME_MAX))


func get_dialogue_text_sound_volume() -> float:
	return _get_float(DIALOGUE_TEXT_SOUND_VOLUME)


func set_dialogue_text_sound_volume(value: float) -> void:
	_set_value(DIALOGUE_TEXT_SOUND_VOLUME, clampf(value, VOLUME_MIN, VOLUME_MAX))


func is_dialogue_text_sound_enabled() -> bool:
	return get_dialogue_text_sound_volume() > 0.0001


func set_dialogue_text_sound_enabled(enabled: bool) -> void:
	set_dialogue_text_sound_volume(DEFAULTS[DIALOGUE_TEXT_SOUND_VOLUME] if enabled else 0.0)


func get_dialogue_speed_step() -> int:
	load_settings()
	return int(_settings.get(DIALOGUE_SPEED_STEP, DEFAULTS[DIALOGUE_SPEED_STEP]))


func set_dialogue_speed_step(step: int) -> void:
	_set_value(DIALOGUE_SPEED_STEP, clampi(step, DIALOGUE_SPEED_STEP_MIN, DIALOGUE_SPEED_STEP_MAX))


func get_dialogue_speed_multiplier() -> float:
	return get_dialogue_speed_multiplier_for_step(get_dialogue_speed_step())


func get_dialogue_speed_multiplier_for_step(step: int) -> float:
	var resolved_step := clampi(step, DIALOGUE_SPEED_STEP_MIN, DIALOGUE_SPEED_STEP_MAX)
	return float(DIALOGUE_SPEED_MULTIPLIERS.get(resolved_step, DIALOGUE_SPEED_MULTIPLIERS[4]))


func get_dialogue_speed_label(step := -1) -> String:
	var resolved_step := get_dialogue_speed_step() if step < 0 else clampi(step, DIALOGUE_SPEED_STEP_MIN, DIALOGUE_SPEED_STEP_MAX)
	return String(DIALOGUE_SPEED_LABELS.get(resolved_step, DIALOGUE_SPEED_LABELS[4]))


func get_dialogue_text_sound_interval_msec(base_interval_msec := DIALOGUE_TEXT_SOUND_BASE_INTERVAL_MSEC) -> int:
	return get_dialogue_text_sound_interval_msec_for_step(get_dialogue_speed_step(), base_interval_msec)


func get_dialogue_text_sound_interval_msec_for_step(
	step: int,
	base_interval_msec := DIALOGUE_TEXT_SOUND_BASE_INTERVAL_MSEC
) -> int:
	var interval := float(base_interval_msec) / maxf(get_dialogue_speed_multiplier_for_step(step), 0.01)
	return maxi(25, int(roundf(interval)))


func is_background_image_enabled() -> bool:
	return _get_bool(BACKGROUND_IMAGE_ENABLED)


func set_background_image_enabled(enabled: bool) -> void:
	_set_value(BACKGROUND_IMAGE_ENABLED, enabled)


func is_dialogue_spectrum_enabled() -> bool:
	return _get_bool(DIALOGUE_SPECTRUM_ENABLED)


func set_dialogue_spectrum_enabled(enabled: bool) -> void:
	_set_value(DIALOGUE_SPECTRUM_ENABLED, enabled)


func get_bgm_volume_db_offset() -> float:
	return linear_volume_to_db(get_bgm_volume())


func get_se_volume_db_offset() -> float:
	return linear_volume_to_db(get_se_volume())


func get_dialogue_text_sound_volume_db_offset() -> float:
	return linear_volume_to_db(get_dialogue_text_sound_volume())


func linear_volume_to_db(volume: float) -> float:
	var clamped_volume := clampf(volume, VOLUME_MIN, VOLUME_MAX)
	if clamped_volume <= 0.0001:
		return -80.0
	return linear_to_db(clamped_volume)


func _get_float(key: String) -> float:
	load_settings()
	return float(_settings.get(key, DEFAULTS[key]))


func _get_bool(key: String) -> bool:
	load_settings()
	return bool(_settings.get(key, DEFAULTS[key]))


func _set_value(key: String, value: Variant) -> void:
	load_settings()
	var normalized_value: Variant = _normalize_value(key, value)
	if _values_match(_settings.get(key, DEFAULTS[key]), normalized_value):
		return

	_settings[key] = normalized_value
	save_settings()
	setting_changed.emit(key)
	settings_changed.emit()


func _normalize_value(key: String, value: Variant) -> Variant:
	match key:
		BGM_VOLUME, SE_VOLUME, DIALOGUE_TEXT_SOUND_VOLUME:
			return clampf(float(value), VOLUME_MIN, VOLUME_MAX)
		DIALOGUE_SPEED_STEP:
			return clampi(int(roundf(float(value))), DIALOGUE_SPEED_STEP_MIN, DIALOGUE_SPEED_STEP_MAX)
		BACKGROUND_IMAGE_ENABLED, DIALOGUE_SPECTRUM_ENABLED:
			return _read_bool(value, bool(DEFAULTS[key]))
	return value


func _speed_multiplier_to_step(multiplier: float) -> int:
	var closest_step := int(DEFAULTS[DIALOGUE_SPEED_STEP])
	var closest_distance := INF
	for raw_step in DIALOGUE_SPEED_MULTIPLIERS.keys():
		var step := int(raw_step)
		var distance := absf(float(DIALOGUE_SPEED_MULTIPLIERS[step]) - multiplier)
		if distance < closest_distance:
			closest_step = step
			closest_distance = distance
	return closest_step


func _read_bool(value: Variant, default_value: bool) -> bool:
	match typeof(value):
		TYPE_BOOL:
			return bool(value)
		TYPE_INT, TYPE_FLOAT:
			return float(value) != 0.0
		TYPE_STRING:
			var text := String(value).strip_edges().to_lower()
			if text in ["true", "1", "yes", "on"]:
				return true
			if text in ["false", "0", "no", "off"]:
				return false
	return default_value


func _values_match(a: Variant, b: Variant) -> bool:
	if (a is float or a is int) and (b is float or b is int):
		return is_equal_approx(float(a), float(b))
	return a == b

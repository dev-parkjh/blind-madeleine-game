extends Control
class_name DialogueSpectrum

@export_range(0.0, 0.45, 0.01) var silence_side_ratio: float = 0.1
@export_range(0.0, 0.2, 0.005) var sound_edge_fade_ratio: float = 0.1
@export_range(0.0, 0.45, 0.005) var normal_silence_side_ratio: float = 0.06
@export_range(0.0, 0.30, 0.005) var normal_sound_edge_fade_ratio: float = 0.20
@export_range(1.0, 1.5, 0.01) var normal_center_boost: float = 1.12
@export_range(2.0, 12.0, 0.5) var sample_spacing: float = 6.0
@export_range(1.0, 5.0, 0.25) var dot_radius: float = 1.25
@export_range(1.0, 6.0, 0.25) var bar_width: float = 2.4
@export_range(24.0, 420.0, 1.0) var max_bar_height: float = 288.0
@export_range(0.0, 1.0, 0.05) var idle_intensity: float = 0.04
@export_range(0.0, 1.0, 0.05) var speech_intensity: float = 0.96
@export_range(12.0, 60.0, 1.0) var redraw_fps: float = 30.0
@export_range(24.0, 60.0, 1.0) var noise_redraw_fps: float = 30.0
@export_range(0.02, 0.16, 0.005) var spectrum_step_interval: float = 0.055
@export_range(3, 14, 1) var height_steps: int = 8
@export_range(0.25, 1.8, 0.05) var lie_noise_strength: float = 1.15
@export_range(0.1, 1.0, 0.05) var lie_noise_opacity: float = 0.5
@export_range(0.25, 1.5, 0.05) var lie_noise_height_scale: float = 0.75
@export_range(1.5, 8.0, 0.25) var lie_noise_spacing: float = 2.4
@export_range(0.0, 0.2, 0.005) var lie_noise_line_gain_floor: float = 0.035
@export_range(1.0, 4.0, 0.05) var lie_noise_height_taper_power: float = 2.2
@export_range(1.0, 16.0, 0.5) var noise_fade_in_speed: float = 6.0
@export_range(1.0, 16.0, 0.5) var noise_fade_out_speed: float = 7.0
@export_range(0.05, 0.6, 0.01) var line_fade_in_duration: float = 0.18
@export_range(0.05, 0.6, 0.01) var line_fade_out_duration: float = 0.22
@export_range(0.0, 1.2, 0.05) var line_fade_out_hold: float = 0.35
@export_range(0.06, 0.6, 0.01) var silence_after_no_progress_seconds: float = 0.14
@export_range(0.0, 1.0, 0.01) var end_word_hold_seconds: float = 0.22

var _speaker_color := Color(1.0, 0.31, 0.66)
var _phase := 0.0
var _seed := 1
var _line_energy := 0.65
var _base_intensity := 0.0
var _pulse := 0.0
var _redraw_time := 0.0
var _step_time := 0.0
var _step_index := 0
var _noise_amount := 0.0
var _normal_crossover_amount := 0.0
var _is_noise_mode := false
var _is_talking := false
var _line_active := false
var _last_visible_count := 0
var _time_since_progress := 0.0
var _end_word_hold_remaining := 0.0
var _end_word_hold_total := 0.0
var _spectrum_half_width := 280.0
var _bar_height_scale := 1.0
var _peak_alpha := 1.0
var _is_fading := false
var _fade_from := 0.0
var _fade_to := 0.0
var _fade_elapsed := 0.0
var _fade_duration := 0.0
var _fade_finished_callback: Callable
var _is_holding_before_fade_out := false
var _fade_out_hold_remaining := 0.0


func set_spectrum_layout(total_width: float, height_scale: float = 1.0) -> void:
	var min_scale := float(PortraitLayout.ZOOM_MIN) / float(PortraitLayout.ZOOM_DEFAULT)
	var max_scale := float(PortraitLayout.ZOOM_MAX) / float(PortraitLayout.ZOOM_DEFAULT)
	var clamped_scale := clampf(height_scale, min_scale, max_scale)
	var min_half_width := maxf(12.0, 36.0 * clamped_scale)
	_spectrum_half_width = maxf(total_width * 0.5, min_half_width)
	_bar_height_scale = clamped_scale
	queue_redraw()


func set_spectrum_span(total_width: float) -> void:
	set_spectrum_layout(total_width, _bar_height_scale)


func set_peak_alpha(value: float) -> void:
	_peak_alpha = clampf(value, 0.0, 1.0)
	if not _line_active:
		return
	if _is_fading:
		if _fade_to >= _fade_from:
			_fade_to = _peak_alpha
		return
	if _is_holding_before_fade_out or modulate.a > 0.001:
		modulate.a = _peak_alpha
	queue_redraw()


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	clip_contents = false
	modulate = Color(1.0, 1.0, 1.0, 0.0)
	set_process(true)
	get_viewport().size_changed.connect(queue_redraw)


func play_line(text: String, speaker_color: Color) -> void:
	_cancel_fade()
	_cancel_fade_out_hold()
	_speaker_color = speaker_color
	_seed = maxi(1, absi(text.hash()))
	_line_energy = clampf(float(text.length()) / 90.0, 0.45, 1.0)
	_phase = 0.0
	_pulse = 0.55
	_step_time = 0.0
	_step_index = 0
	_base_intensity = idle_intensity
	_is_talking = false
	_line_active = true
	_last_visible_count = 0
	_time_since_progress = 0.0
	_end_word_hold_remaining = 0.0
	_end_word_hold_total = 0.0
	_redraw_time = 0.0
	visible = true
	_start_fade_in()
	queue_redraw()


func _get_end_word_hold_blend() -> float:
	if _end_word_hold_remaining <= 0.0 or _end_word_hold_total <= 0.0:
		return 0.0
	return clampf(_end_word_hold_remaining / _end_word_hold_total, 0.0, 1.0)


func set_typing_progress(visible_count: int, total_count: int) -> void:
	if total_count <= 0:
		_is_talking = false
		return

	var is_line_complete := visible_count >= total_count
	var typed_delta := maxi(0, visible_count - _last_visible_count)
	var speech_delta := typed_delta
	if is_line_complete:
		speech_delta = maxi(0, total_count - 1 - _last_visible_count)
	if speech_delta > 0:
		_time_since_progress = 0.0
		var burst := 0.07 * float(mini(speech_delta, 7))
		_pulse = clampf(_pulse + burst, 0.0, 1.0)

	# 마지막 글자 직후: 같은 시간 동안 음파를 서서히 idle로 페이드아웃한다.
	if is_line_complete and end_word_hold_seconds > 0.0:
		_end_word_hold_remaining = maxf(_end_word_hold_remaining, end_word_hold_seconds)
		_end_word_hold_total = maxf(_end_word_hold_total, end_word_hold_seconds)
		_time_since_progress = 0.0
		_pulse = maxf(_pulse, 0.18)

	_last_visible_count = visible_count
	_is_talking = (speech_delta > 0) and not is_line_complete


func finish_line(skip_hold: bool = false) -> void:
	if _is_fading and _fade_to <= 0.001:
		return
	if not _line_active and modulate.a <= 0.001 and not _is_holding_before_fade_out:
		visible = false
		return

	if skip_hold:
		_cancel_fade_out_hold()
		_is_talking = false
		_begin_fade_out_sequence()
		return

	if _is_holding_before_fade_out:
		return

	_is_talking = false
	if line_fade_out_hold <= 0.0:
		_begin_fade_out_sequence()
		return

	_is_holding_before_fade_out = true
	_fade_out_hold_remaining = line_fade_out_hold
	queue_redraw()


func set_noise_mode(is_enabled: bool) -> void:
	_is_noise_mode = is_enabled
	if is_enabled:
		var was_finishing_line := _is_holding_before_fade_out or (_is_fading and _fade_to <= _fade_from)
		if was_finishing_line:
			_cancel_fade()
			_line_active = false
			_is_talking = false
			_base_intensity = idle_intensity
			visible = true
			modulate.a = _peak_alpha
		if not _line_active:
			_cancel_fade()
			visible = true
			modulate.a = _peak_alpha
			_base_intensity = idle_intensity
		_normal_crossover_amount = 0.0
		_pulse = maxf(_pulse, 0.35)
	_redraw_time = 0.0
	queue_redraw()


func _process(delta: float) -> void:
	_update_fade_out_hold(delta)
	_update_fade(delta)

	if not _line_active and not _is_fading and not _is_drawing_noise() and not _is_holding_before_fade_out:
		return

	var end_hold_blend := _get_end_word_hold_blend()
	if _end_word_hold_remaining > 0.0:
		_end_word_hold_remaining = maxf(0.0, _end_word_hold_remaining - delta)
		_time_since_progress = 0.0

	# 글자 출력이 멈춘 상태(파이프 딜레이 등)에서는 음파도 idle로 전환한다.
	# 타이핑 진행 이벤트(set_typing_progress)가 들어올 때만 "말하는 중"으로 본다.
	if (
		_line_active
		and not _is_noise_mode
		and not _is_holding_before_fade_out
		and not _is_fading
		and end_hold_blend <= 0.0
	):
		_time_since_progress += delta
		if _time_since_progress >= silence_after_no_progress_seconds:
			_is_talking = false

	var phase_speed := 6.2 + _line_energy * 3.4
	if end_hold_blend > 0.0:
		phase_speed *= lerpf(0.35, 1.0, end_hold_blend)
	_phase += delta * phase_speed
	_step_time += delta
	while _step_time >= spectrum_step_interval:
		_step_time -= spectrum_step_interval
		_step_index += 1

	var target_intensity := speech_intensity if _is_talking else idle_intensity
	var approach_speed := 6.0 if _is_talking else 2.0
	if end_hold_blend > 0.0:
		# hold 시간은 유지하되, 말하기 강도는 끝까지 부드럽게 내려간다.
		var hold_curve := end_hold_blend * end_hold_blend
		target_intensity = lerpf(idle_intensity, speech_intensity, hold_curve)
		approach_speed = 2.2
	var was_drawing_noise := _is_drawing_noise()
	_base_intensity = move_toward(_base_intensity, target_intensity, delta * approach_speed)
	var pulse_decay_speed := 3.4
	if end_hold_blend > 0.0:
		pulse_decay_speed = lerpf(6.5, 2.8, 1.0 - end_hold_blend)
	_pulse = move_toward(_pulse, 0.0, delta * pulse_decay_speed)
	var noise_target := 1.0 if _is_noise_mode else 0.0
	var noise_speed := noise_fade_in_speed if _is_noise_mode else noise_fade_out_speed
	var noise_weight := 1.0 - exp(-delta * noise_speed)
	_noise_amount = lerpf(_noise_amount, noise_target, noise_weight)
	if not _is_noise_mode and _noise_amount < 0.006:
		_noise_amount = 0.0
	_normal_crossover_amount = 0.0 if _is_noise_mode else 1.0 - smoothstep(0.0, 0.95, clampf(_noise_amount, 0.0, 1.0))

	var is_drawing_noise := _is_drawing_noise()
	var is_visually_animating := (
		_is_holding_before_fade_out
		or _is_fading
		or _is_talking
		or end_hold_blend > 0.001
		or _is_noise_mode
		or _noise_amount > 0.001
		or _pulse > 0.001
		or absf(_base_intensity - target_intensity) > 0.001
	)
	if is_visually_animating:
		_redraw_time += delta
		var effective_redraw_fps := noise_redraw_fps if is_drawing_noise or was_drawing_noise else redraw_fps
		var redraw_interval := 1.0 / maxf(effective_redraw_fps, 1.0)
		if _redraw_time >= redraw_interval:
			_redraw_time = fmod(_redraw_time, redraw_interval)
			queue_redraw()
	if was_drawing_noise and not is_drawing_noise:
		if not _line_active and not _is_fading:
			modulate.a = 0.0
			visible = false
		queue_redraw()


func _draw() -> void:
	if modulate.a <= 0.001:
		return
	if not _line_active and not _is_drawing_noise():
		return

	var line_y := 0.0
	var half_width := _spectrum_half_width
	var sound_start_x := -half_width
	var sound_end_x := half_width
	var sound_sample_count := maxi(3, int((sound_end_x - sound_start_x) / sample_spacing))

	var activity := clampf(_base_intensity + _pulse, 0.0, 1.25)
	var should_draw_noise := _is_drawing_noise()
	if should_draw_noise:
		var normal_line_alpha := _normal_crossover_amount
		if normal_line_alpha > 0.01:
			_draw_normal_voice_bars(
				sound_start_x,
				sound_end_x,
				line_y,
				sound_sample_count,
				activity,
				normal_line_alpha
			)
		_draw_lie_noise(sound_start_x, sound_end_x, line_y)
		return

	_draw_normal_voice_bars(sound_start_x, sound_end_x, line_y, sound_sample_count, activity, 1.0)


func _is_drawing_noise() -> bool:
	return _is_noise_mode or _noise_amount > 0.006


func _start_fade_in() -> void:
	_start_fade(modulate.a, _peak_alpha, line_fade_in_duration)


func _begin_fade_out_sequence() -> void:
	_cancel_fade_out_hold()
	_start_fade_out(line_fade_out_duration, _finalize_line_finish)


func _start_fade_out(duration: float, on_finished: Callable = Callable()) -> void:
	_start_fade(modulate.a, 0.0, duration, on_finished)


func _cancel_fade_out_hold() -> void:
	_is_holding_before_fade_out = false
	_fade_out_hold_remaining = 0.0


func _update_fade_out_hold(delta: float) -> void:
	if not _is_holding_before_fade_out:
		return

	_fade_out_hold_remaining -= delta
	if _fade_out_hold_remaining > 0.0:
		return

	_begin_fade_out_sequence()


func _start_fade(from_alpha: float, to_alpha: float, duration: float, on_finished: Callable = Callable()) -> void:
	_fade_from = clampf(from_alpha, 0.0, 1.0)
	_fade_to = clampf(to_alpha, 0.0, 1.0)
	_fade_duration = maxf(duration, 0.001)
	_fade_elapsed = 0.0
	_is_fading = true
	_fade_finished_callback = on_finished
	modulate.a = _fade_from
	queue_redraw()


func _cancel_fade() -> void:
	_is_fading = false
	_fade_finished_callback = Callable()
	_cancel_fade_out_hold()


func _update_fade(delta: float) -> void:
	if not _is_fading:
		return

	_fade_elapsed += delta
	var amount := clampf(_fade_elapsed / _fade_duration, 0.0, 1.0)
	amount = amount * amount * (3.0 - 2.0 * amount)
	modulate.a = lerpf(_fade_from, _fade_to, amount)
	queue_redraw()

	if _fade_elapsed < _fade_duration:
		return

	_is_fading = false
	modulate.a = _fade_to
	var callback := _fade_finished_callback
	_fade_finished_callback = Callable()
	if callback.is_valid():
		callback.call()


func _finalize_line_finish() -> void:
	_line_active = false
	_base_intensity = 0.0
	_pulse = 0.0
	modulate.a = 0.0
	visible = false
	queue_redraw()


func _draw_normal_voice_bars(
	start_x: float,
	end_x: float,
	line_y: float,
	sample_count: int,
	activity: float,
	alpha_multiplier: float
) -> void:
	if activity < 0.16 or alpha_multiplier <= 0.01:
		return

	for i in range(sample_count):
		var ratio := float(i) / float(maxi(1, sample_count - 1))
		var sound_gain := _normal_sound_gain(ratio)
		if sound_gain <= 0.01:
			continue

		var x := lerpf(start_x, end_x, ratio)
		var center_boost := _normal_center_boost(ratio)
		var height := _bar_height(i, sound_gain, activity * center_boost)
		if height <= 0.5:
			continue

		var alpha := (0.18 + 0.82 * sound_gain) * clampf(activity, 0.0, 1.0) * alpha_multiplier

		_draw_vertical_capsule(
			Vector2(x, line_y),
			height,
			_scaled_bar_width(),
			Color(_speaker_color.r, _speaker_color.g, _speaker_color.b, alpha)
		)


func _scaled_max_bar_height() -> float:
	return max_bar_height * _bar_height_scale


func _scaled_bar_width() -> float:
	return bar_width * lerpf(1.0, _bar_height_scale, 0.4)


func _bar_height(index: int, sound_gain: float, activity: float) -> float:
	var scaled_max_height := _scaled_max_bar_height()
	var coarse_index := index / 2
	var primary := _hash01(coarse_index * 131 + _step_index * 71 + _seed)
	var secondary := _hash01(index * 47 + (_step_index / 2) * 193 + _seed * 3)
	var flicker := _hash01(index * 19 + _step_index * 17 + _seed * 7)
	var normalized := primary * 0.56 + secondary * 0.32 + flicker * 0.12
	normalized = pow(normalized, 1.35)
	normalized = floor(normalized * float(height_steps)) / float(height_steps)
	var tapered_height := scaled_max_height * sound_gain
	return clampf((5.0 + normalized * tapered_height) * activity * sound_gain, 0.0, scaled_max_height)


func _draw_lie_noise(
	start_x: float,
	end_x: float,
	line_y: float
) -> void:
	var width := end_x - start_x
	var count := maxi(4, int(width / lie_noise_spacing))
	var noise_alpha := clampf(_noise_amount * lie_noise_strength * lie_noise_opacity, 0.0, 1.0)
	var scaled_max_height := _scaled_max_bar_height()
	var capsule_width := _scaled_bar_width() * 0.78
	var capsule_radius := capsule_width * 0.5
	var bar_centers: Array[Vector2] = []
	var bar_heights: Array[float] = []
	var bar_colors: Array[Color] = []
	var glow_points := PackedVector2Array()
	var glow_colors := PackedColorArray()
	var line_points := PackedVector2Array()
	var line_glow_colors := PackedColorArray()
	var line_core_colors := PackedColorArray()
	var highlight_points: Array[Vector2] = []
	var highlight_radii: Array[float] = []
	var cap_centers: Array[Vector2] = []
	var cap_colors: Array[Color] = []
	var cap_radii: Array[float] = []

	for i in range(count):
		var ratio := float(i) / float(maxi(1, count - 1))
		var x := lerpf(start_x, end_x, ratio)
		var sound_gain := _sound_gain(ratio)
		var alpha_gain := 0.0 if sound_gain <= 0.0 else lerpf(0.55, 1.0, sound_gain)
		var envelope := _lie_noise_envelope(ratio)
		var height_envelope := envelope * sound_gain * _lie_noise_height_taper(ratio)
		var y_noise := (_hash_signed(i * 67 + _step_index * 41 + _seed) * 10.0)
		var wave_y := line_y + sin(_phase * 1.4 + ratio * TAU * 5.0) * 12.0 * height_envelope
		var center := Vector2(x, wave_y + y_noise * height_envelope * _noise_amount)
		var height := minf(_lie_noise_height(i, ratio, height_envelope) * 1.22, scaled_max_height * 1.38) * lie_noise_height_scale
		var local_alpha := noise_alpha * (0.18 + envelope * 0.82) * alpha_gain
		var bed_height := scaled_max_height * (0.035 + envelope * 0.1) * height_envelope * _noise_amount * lie_noise_height_scale
		var bed_alpha := noise_alpha * (0.04 + envelope * 0.08) * alpha_gain
		if height_envelope > 0.025 and sound_gain > 0.025:
			height = maxf(height, bed_height)
			local_alpha = maxf(local_alpha, bed_alpha)

		if sound_gain > lie_noise_line_gain_floor:
			var line_alpha_gain := smoothstep(lie_noise_line_gain_floor, 1.0, sound_gain)
			line_points.append(center)
			line_glow_colors.append(Color(_speaker_color.r, _speaker_color.g, _speaker_color.b, 0.045 * noise_alpha * line_alpha_gain))
			line_core_colors.append(Color(_speaker_color.r, _speaker_color.g, _speaker_color.b, 0.18 * noise_alpha * line_alpha_gain))

		if height > 0.5 and local_alpha > 0.01:
			var bar_color := Color(_speaker_color.r, _speaker_color.g, _speaker_color.b, local_alpha)
			var glow_color := Color(_speaker_color.r, _speaker_color.g, _speaker_color.b, local_alpha * 0.22)
			glow_points.append(Vector2(center.x, center.y - height * 0.5))
			glow_points.append(Vector2(center.x, center.y + height * 0.5))
			glow_colors.append(glow_color)
			bar_centers.append(center)
			bar_heights.append(height)
			bar_colors.append(bar_color)
			if i % 2 == 0 or height > scaled_max_height * 0.58:
				cap_centers.append(Vector2(center.x, center.y - height * 0.5))
				cap_centers.append(Vector2(center.x, center.y + height * 0.5))
				cap_colors.append(bar_color)
				cap_colors.append(bar_color)
				cap_radii.append(capsule_radius)
				cap_radii.append(capsule_radius)

		if height_envelope > 0.08 and i % 2 == 0:
			highlight_points.append(center)
			highlight_radii.append(dot_radius * (0.7 + height_envelope))

	if line_points.size() > 1:
		draw_polyline_colors(line_points, line_glow_colors, 4.0, true)
		draw_polyline_colors(line_points, line_core_colors, 1.4, true)

	if glow_points.size() > 1:
		draw_multiline_colors(glow_points, glow_colors, capsule_width * 2.25, true)

	for i in range(bar_centers.size()):
		var height: float = bar_heights[i]
		var center: Vector2 = bar_centers[i]
		draw_rect(
			Rect2(
				center.x - capsule_radius,
				center.y - height * 0.5,
				capsule_width,
				height
			),
			bar_colors[i],
			true
		)

	for i in range(cap_centers.size()):
		draw_circle(cap_centers[i], cap_radii[i], cap_colors[i])

	var bright_color := Color(_speaker_color.r, _speaker_color.g, _speaker_color.b, 0.62 * noise_alpha)
	for i in range(highlight_points.size()):
		draw_circle(highlight_points[i], highlight_radii[i], bright_color)


func _lie_noise_envelope(ratio: float) -> float:
	var left_peak := exp(-pow((ratio - 0.32) / 0.1, 2.0))
	var center_peak := exp(-pow((ratio - 0.5) / 0.2, 2.0))
	var right_peak := exp(-pow((ratio - 0.68) / 0.12, 2.0))
	var edge_taper := pow(sin(ratio * PI), 1.35)
	var wide_tail := exp(-pow((ratio - 0.5) / 0.36, 2.0)) * 0.22
	var moving_lump := 0.5 + 0.5 * sin(_phase * 0.68 + ratio * TAU * 3.0)
	var envelope := (left_peak * 0.72 + center_peak * 1.0 + right_peak * 0.66 + wide_tail + moving_lump * 0.1) * edge_taper
	return clampf(envelope, 0.0, 1.25)


func _sound_gain(ratio: float) -> float:
	var side := clampf(silence_side_ratio, 0.0, 0.49)
	return _gain_for_range(ratio, side, sound_edge_fade_ratio)


func _lie_noise_height_taper(ratio: float) -> float:
	return pow(clampf(sin(ratio * PI), 0.0, 1.0), lie_noise_height_taper_power)


func _normal_sound_gain(ratio: float) -> float:
	var side := clampf(normal_silence_side_ratio, 0.0, 0.49)
	return _gain_for_range(ratio, side, normal_sound_edge_fade_ratio)


func _gain_for_range(ratio: float, side: float, fade_ratio: float) -> float:
	var sound_start := side
	var sound_end := 1.0 - side
	if ratio < sound_start or ratio > sound_end:
		return 0.0

	var fade_width := minf(fade_ratio, (sound_end - sound_start) * 0.5)
	if fade_width <= 0.0:
		return 1.0

	var left := smoothstep(sound_start, sound_start + fade_width, ratio)
	var right := smoothstep(0.0, fade_width, sound_end - ratio)
	return left * right


func _normal_center_boost(ratio: float) -> float:
	var center_weight := pow(sin(ratio * PI), 1.65)
	return lerpf(1.0, normal_center_boost, center_weight)


func _lie_noise_height(index: int, ratio: float, envelope: float) -> float:
	var scaled_max_height := _scaled_max_bar_height()
	var spike_a := _hash01(index * 109 + _step_index * 137 + _seed * 5)
	var spike_b := _hash01(index * 271 + (_step_index / 2) * 53 + _seed * 11)
	var narrow_spike := pow(spike_a, 2.8) * 0.9
	var jitter := spike_b * 0.35
	var wave_spike := absf(sin(_phase * 2.2 + ratio * TAU * 13.0)) * 0.32
	var normalized := clampf(0.12 + narrow_spike + jitter + wave_spike, 0.0, 1.35)
	var raw_height := scaled_max_height * normalized * envelope * _noise_amount * lie_noise_strength
	return minf(raw_height, scaled_max_height * 1.25)


func _hash01(value: int) -> float:
	var hashed := sin(float(value) * 12.9898) * 43758.5453
	return fposmod(hashed, 1.0)


func _hash_signed(value: int) -> float:
	return _hash01(value) * 2.0 - 1.0


func _draw_vertical_capsule(center: Vector2, height: float, width: float, color: Color) -> void:
	if height <= 0.5 or color.a <= 0.01:
		return

	var radius := width * 0.5
	if height <= width:
		draw_circle(center, radius, color)
		return

	var rect := Rect2(center.x - radius, center.y - height * 0.5 + radius, width, height - width)
	draw_rect(rect, color, true)
	draw_circle(Vector2(center.x, center.y - height * 0.5 + radius), radius, color)
	draw_circle(Vector2(center.x, center.y + height * 0.5 - radius), radius, color)

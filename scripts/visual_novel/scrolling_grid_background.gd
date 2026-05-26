class_name ScrollingGridBackground
extends ColorRect

const PARALLAX_TARGET_EPSILON_SQ := 0.25

@export var cell_size: float = 32.0
@export var scroll_speed: Vector2 = Vector2(10.0, 8.0)
@export var line_width: float = 1.0
@export var background_color: Color = Color(0.055, 0.052, 0.047, 1.0)
@export var line_color: Color = Color(0.48, 0.48, 0.48, 0.145)
@export var face_parallax_strength: Vector2 = Vector2(0.12, 0.085)
@export_range(0.0, 80.0, 1.0) var zoom_parallax_strength: float = 18.0
@export var zoom_parallax_direction: Vector2 = Vector2(0.0, 1.0)
@export_range(0.0, 0.2, 0.001) var max_horizontal_offset_ratio: float = 0.055
@export_range(0.0, 0.2, 0.001) var max_vertical_offset_ratio: float = 0.04
@export_range(0.0, 1.0, 0.01) var multi_cast_min_strength: float = 0.52
@export_range(0.0, 0.5, 0.01) var spread_damping_start: float = 0.08
@export_range(0.0, 0.5, 0.01) var spread_damping_end: float = 0.34
@export_range(0.0, 16.0, 0.5) var parallax_dead_zone: float = 3.0
@export_range(0.05, 1.2, 0.01) var parallax_smooth_time: float = 0.36
@export_range(0.35, 1.0, 0.01) var min_zoom_grid_scale: float = 0.52
@export_range(1.0, 5.0, 0.01) var max_zoom_grid_scale: float = 5.0
@export_range(0.0, 80.0, 1.0) var min_zoom_grid_cell_boost: float = 10.0
@export_range(100.0, 500.0, 1.0) var grid_scale_boost_end_zoom: float = 300.0
@export_range(0.05, 1.2, 0.01) var zoom_smooth_time: float = 0.28
@export_range(0.0, 1.2, 0.01) var billboard_perspective_strength: float = 0.46
@export_range(0.0, 2.0, 0.01) var billboard_zoom_tilt_strength: float = 0.74
@export_range(0.0, 0.12, 0.001) var max_billboard_tilt: float = 0.034
@export_range(4, 24, 1) var projected_grid_segments: int = 10
@export var vignette_enabled: bool = true
@export_range(0.0, 0.5, 0.01) var vignette_edge_size_ratio: float = 0.14
@export_range(0.0, 1.0, 0.01) var vignette_max_alpha: float = 0.72
@export_range(0.0, 0.35, 0.01) var vignette_corner_boost: float = 0.18

## 누적 스크롤(프레임마다 wrap 하지 않음 — 그리기 시 격자 간격으로만 정렬)
var scroll_offset := Vector2.ZERO

var _target_grid_zoom_percent := float(PortraitLayout.ZOOM_MIN)
var _smoothed_grid_zoom_percent := float(PortraitLayout.ZOOM_MIN)
var _grid_zoom_velocity := 0.0
var _target_parallax_offset := Vector2.ZERO
var _smoothed_parallax_offset := Vector2.ZERO
var _parallax_velocity := Vector2.ZERO
var _last_viewport_size := Vector2.ZERO


func _ready() -> void:
	color = background_color
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	set_process(true)


func _process(delta: float) -> void:
	scroll_offset += scroll_speed * delta

	var next_zoom := _smooth_damp_float(
		_smoothed_grid_zoom_percent,
		_target_grid_zoom_percent,
		_grid_zoom_velocity,
		zoom_smooth_time,
		delta
	)
	_smoothed_grid_zoom_percent = float(next_zoom["value"])
	_grid_zoom_velocity = float(next_zoom["velocity"])

	var next_offset := _smooth_damp_vector(
		_smoothed_parallax_offset,
		_target_parallax_offset,
		_parallax_velocity,
		parallax_smooth_time,
		delta
	)
	_smoothed_parallax_offset = Vector2(next_offset["value"])
	_parallax_velocity = Vector2(next_offset["velocity"])

	queue_redraw()


func sync_stage(
	viewport_size: Vector2,
	grid_zoom_percent: float,
	focus_face_position: Vector2,
	focus_zoom_percent: float,
	parallax_enabled: bool,
	baseline_face_position: Vector2,
	stage_spread_ratio: float = 0.0,
	cast_count: int = 0
) -> void:
	_target_grid_zoom_percent = clampf(
		grid_zoom_percent,
		float(PortraitLayout.ZOOM_MIN),
		float(PortraitLayout.ZOOM_MAX)
	)
	_request_parallax_offset(
		_compute_parallax_offset(
			viewport_size,
			focus_face_position,
			baseline_face_position,
			focus_zoom_percent,
			parallax_enabled,
			stage_spread_ratio,
			cast_count
		)
	)

	if viewport_size.x > 0.0 and viewport_size.y > 0.0 and not viewport_size.is_equal_approx(_last_viewport_size):
		_last_viewport_size = viewport_size
		set_anchors_preset(Control.PRESET_TOP_LEFT)
		position = Vector2.ZERO
		size = viewport_size


func _compute_parallax_offset(
	viewport_size: Vector2,
	focus_face_position: Vector2,
	baseline_face_position: Vector2,
	focus_zoom_percent: float,
	parallax_enabled: bool,
	stage_spread_ratio: float,
	cast_count: int
) -> Vector2:
	if not parallax_enabled:
		return Vector2.ZERO

	var face_delta := _apply_dead_zone(focus_face_position - baseline_face_position)
	var zoom_delta := (
		clampf(focus_zoom_percent, float(PortraitLayout.ZOOM_MIN), float(PortraitLayout.ZOOM_MAX))
		- float(PortraitLayout.ZOOM_MIN)
	) / 100.0
	var zoom_motion_scale := _zoom_motion_scale(focus_zoom_percent)
	var spread_scale := _compute_spread_scale(stage_spread_ratio, cast_count)
	var raw_offset := (
		face_delta * face_parallax_strength * zoom_motion_scale * spread_scale
		+ _normalized_zoom_direction() * zoom_delta * zoom_parallax_strength * zoom_motion_scale * spread_scale
	)
	return _clamp_offset(raw_offset, viewport_size)


func _compute_spread_scale(stage_spread_ratio: float, cast_count: int) -> float:
	if cast_count <= 1:
		return 1.0

	var spread_amount := inverse_lerp(spread_damping_start, spread_damping_end, stage_spread_ratio)
	var count_amount := clampf(float(cast_count - 1) / 3.0, 0.0, 1.0)
	var damping := clampf(maxf(spread_amount, count_amount * 0.35), 0.0, 1.0)
	return lerpf(1.0, multi_cast_min_strength, damping)


func _apply_dead_zone(delta: Vector2) -> Vector2:
	if parallax_dead_zone <= 0.0:
		return delta

	var distance := delta.length()
	if distance <= parallax_dead_zone:
		return Vector2.ZERO

	return delta.normalized() * (distance - parallax_dead_zone)


func _normalized_zoom_direction() -> Vector2:
	if zoom_parallax_direction.length_squared() <= 0.0001:
		return Vector2.ZERO
	return zoom_parallax_direction.normalized()


func _clamp_offset(offset: Vector2, viewport_size: Vector2) -> Vector2:
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return offset

	var max_offset := Vector2(
		maxf(1.0, viewport_size.x * max_horizontal_offset_ratio),
		maxf(1.0, viewport_size.y * max_vertical_offset_ratio)
	)
	return Vector2(
		clampf(offset.x, -max_offset.x, max_offset.x),
		clampf(offset.y, -max_offset.y, max_offset.y)
	)


func _zoom_motion_scale(zoom_percent: float) -> float:
	var zoom_amount := _smootherstep01(
		inverse_lerp(float(PortraitLayout.ZOOM_MIN), float(PortraitLayout.ZOOM_MAX), zoom_percent)
	)
	return lerpf(0.56, 1.18, zoom_amount)


func _request_parallax_offset(next_offset: Vector2) -> void:
	if next_offset.distance_squared_to(_target_parallax_offset) <= PARALLAX_TARGET_EPSILON_SQ:
		return

	_target_parallax_offset = next_offset


func _smooth_damp_vector(
	current: Vector2,
	target: Vector2,
	current_velocity: Vector2,
	smooth_time: float,
	delta: float
) -> Dictionary:
	var result_x := _smooth_damp_float(current.x, target.x, current_velocity.x, smooth_time, delta)
	var result_y := _smooth_damp_float(current.y, target.y, current_velocity.y, smooth_time, delta)
	return {
		"value": Vector2(float(result_x["value"]), float(result_y["value"])),
		"velocity": Vector2(float(result_x["velocity"]), float(result_y["velocity"])),
	}


func _smooth_damp_float(
	current: float,
	target: float,
	current_velocity: float,
	smooth_time: float,
	delta: float
) -> Dictionary:
	var safe_time := maxf(0.0001, smooth_time)
	var omega := 2.0 / safe_time
	var x := omega * delta
	var exp_factor := 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x)
	var change := current - target
	var temp := (current_velocity + omega * change) * delta
	var next_velocity := (current_velocity - omega * temp) * exp_factor
	var next_value := target + (change + temp) * exp_factor
	return {
		"value": next_value,
		"velocity": next_velocity,
	}


func _draw() -> void:
	var viewport_size := size
	if viewport_size.x <= 1.0 or viewport_size.y <= 1.0:
		return

	draw_rect(Rect2(Vector2.ZERO, viewport_size), color)

	var grid_cell_size := _grid_cell_size()
	var offset := scroll_offset - _smoothed_parallax_offset
	_draw_grid(viewport_size, grid_cell_size, offset)
	if vignette_enabled:
		_draw_vignette(viewport_size)


func _grid_cell_size() -> float:
	var zoom_ratio := _smoothed_grid_zoom_percent / float(PortraitLayout.ZOOM_MIN)
	var scale := clampf(_apply_low_zoom_grid_boost(zoom_ratio), min_zoom_grid_scale, max_zoom_grid_scale)
	return maxf(24.0, cell_size * scale)


func _apply_low_zoom_grid_boost(zoom_ratio: float) -> float:
	var min_zoom := float(PortraitLayout.ZOOM_MIN)
	var boost_end_zoom := maxf(min_zoom + 1.0, grid_scale_boost_end_zoom)
	if _smoothed_grid_zoom_percent >= boost_end_zoom:
		return zoom_ratio

	var blend := _smootherstep01(inverse_lerp(min_zoom, boost_end_zoom, _smoothed_grid_zoom_percent))
	var boost_scale := min_zoom_grid_cell_boost / maxf(cell_size, 1.0)
	return zoom_ratio + boost_scale * (1.0 - blend)


func _draw_grid(viewport_size: Vector2, grid_cell_size: float, offset: Vector2) -> void:
	var x := -grid_cell_size + fposmod(offset.x, grid_cell_size)
	while x <= viewport_size.x + grid_cell_size:
		_draw_projected_grid_line(
			Vector2(_snap_line_coord(x), -grid_cell_size),
			Vector2(_snap_line_coord(x), viewport_size.y + grid_cell_size),
			viewport_size
		)
		x += grid_cell_size

	var y := -grid_cell_size + fposmod(offset.y, grid_cell_size)
	while y <= viewport_size.y + grid_cell_size:
		_draw_projected_grid_line(
			Vector2(-grid_cell_size, _snap_line_coord(y)),
			Vector2(viewport_size.x + grid_cell_size, _snap_line_coord(y)),
			viewport_size
		)
		y += grid_cell_size


func _draw_projected_grid_line(from_point: Vector2, to_point: Vector2, viewport_size: Vector2) -> void:
	var segments := maxi(projected_grid_segments, 2)
	var previous := _project_billboard_point(from_point, viewport_size)
	for index in range(1, segments + 1):
		var amount := float(index) / float(segments)
		var current := _project_billboard_point(from_point.lerp(to_point, amount), viewport_size)
		draw_line(previous, current, line_color, maxf(line_width, 1.0), true)
		previous = current


func _project_billboard_point(point: Vector2, viewport_size: Vector2) -> Vector2:
	var tilt := _billboard_tilt(viewport_size)
	if tilt == Vector2.ZERO:
		return point

	var center := viewport_size * 0.5
	var local := point - center
	var normalized := Vector2(
		local.x / maxf(viewport_size.x * 0.5, 1.0),
		local.y / maxf(viewport_size.y * 0.5, 1.0)
	)
	var depth := clampf(1.0 + normalized.dot(tilt), 0.91, 1.10)
	return center + local / depth


func _billboard_tilt(viewport_size: Vector2) -> Vector2:
	if viewport_size.x <= 1.0 or viewport_size.y <= 1.0 or billboard_perspective_strength <= 0.0:
		return Vector2.ZERO

	var normalized_offset := Vector2(
		_smoothed_parallax_offset.x / viewport_size.x,
		_smoothed_parallax_offset.y / viewport_size.y
	)
	var zoom_amount := _smootherstep01(
		inverse_lerp(
			float(PortraitLayout.ZOOM_MIN),
			float(PortraitLayout.ZOOM_MAX),
			_smoothed_grid_zoom_percent
		)
	)
	var zoom_tilt := lerpf(0.46, billboard_zoom_tilt_strength, zoom_amount)
	var tilt := normalized_offset * billboard_perspective_strength * zoom_tilt
	return Vector2(
		clampf(tilt.x, -max_billboard_tilt, max_billboard_tilt),
		clampf(tilt.y, -max_billboard_tilt, max_billboard_tilt)
	)


func _draw_vignette(viewport_size: Vector2) -> void:
	var width := viewport_size.x
	var height := viewport_size.y
	if width <= 0.0 or height <= 0.0:
		return

	var edge := minf(width, height) * vignette_edge_size_ratio
	if edge <= 1.0:
		return

	var edge_color := Color(0.0, 0.0, 0.0, vignette_max_alpha)
	var clear := Color(0.0, 0.0, 0.0, 0.0)

	draw_polygon(
		PackedVector2Array([
			Vector2.ZERO,
			Vector2(width, 0.0),
			Vector2(width, edge),
			Vector2(0.0, edge),
		]),
		PackedColorArray([edge_color, edge_color, clear, clear])
	)
	draw_polygon(
		PackedVector2Array([
			Vector2(0.0, height - edge),
			Vector2(width, height - edge),
			Vector2(width, height),
			Vector2(0.0, height),
		]),
		PackedColorArray([clear, clear, edge_color, edge_color])
	)
	draw_polygon(
		PackedVector2Array([
			Vector2.ZERO,
			Vector2(edge, 0.0),
			Vector2(edge, height),
			Vector2(0.0, height),
		]),
		PackedColorArray([edge_color, clear, clear, edge_color])
	)
	draw_polygon(
		PackedVector2Array([
			Vector2(width - edge, 0.0),
			Vector2(width, 0.0),
			Vector2(width, height),
			Vector2(width - edge, height),
		]),
		PackedColorArray([clear, edge_color, edge_color, clear])
	)

	if vignette_corner_boost <= 0.0:
		return

	var corner := edge * 1.12
	var corner_color := Color(0.0, 0.0, 0.0, clampf(vignette_max_alpha + vignette_corner_boost, 0.0, 1.0))
	draw_polygon(
		PackedVector2Array([
			Vector2.ZERO,
			Vector2(corner, 0.0),
			Vector2(0.0, corner),
		]),
		PackedColorArray([corner_color, clear, clear])
	)
	draw_polygon(
		PackedVector2Array([
			Vector2(width - corner, 0.0),
			Vector2(width, 0.0),
			Vector2(width, corner),
		]),
		PackedColorArray([clear, corner_color, clear])
	)
	draw_polygon(
		PackedVector2Array([
			Vector2(0.0, height - corner),
			Vector2(0.0, height),
			Vector2(corner, height),
		]),
		PackedColorArray([clear, corner_color, clear])
	)
	draw_polygon(
		PackedVector2Array([
			Vector2(width - corner, height),
			Vector2(width, height),
			Vector2(width, height - corner),
		]),
		PackedColorArray([clear, corner_color, clear])
	)


static func _snap_line_coord(value: float) -> float:
	return floorf(value) + 0.5


static func _smootherstep01(value: float) -> float:
	var t := clampf(value, 0.0, 1.0)
	return t * t * t * (t * (t * 6.0 - 15.0) + 10.0)

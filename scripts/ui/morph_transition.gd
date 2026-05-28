class_name MorphTransition
extends RefCounted


static func has_usable_rect(rect: Rect2) -> bool:
	return rect.size.x > 0.0 and rect.size.y > 0.0


static func rect_from_payload(payload: Dictionary, key := "source_rect") -> Rect2:
	var raw_rect: Variant = payload.get(key, Rect2())
	if raw_rect is Rect2:
		var rect := raw_rect as Rect2
		if has_usable_rect(rect):
			return rect
	return Rect2()


static func fallback_corner_rect(target_rect: Rect2, fallback_size := Vector2(84.0, 54.0)) -> Rect2:
	var size := Vector2(
		minf(fallback_size.x, maxf(1.0, target_rect.size.x)),
		minf(fallback_size.y, maxf(1.0, target_rect.size.y))
	)
	return Rect2(
		target_rect.position + Vector2(maxf(0.0, target_rect.size.x - size.x), 0.0),
		size
	)


static func apply_rect(control: Control, rect: Rect2) -> void:
	if control == null:
		return
	control.set_anchors_preset(Control.PRESET_TOP_LEFT)
	control.offset_left = rect.position.x
	control.offset_top = rect.position.y
	control.offset_right = rect.position.x + rect.size.x
	control.offset_bottom = rect.position.y + rect.size.y


static func tween_rect(tween: Tween, control: Control, target_rect: Rect2, duration: float) -> void:
	if tween == null or control == null:
		return
	tween.tween_property(control, "offset_left", target_rect.position.x, duration)
	tween.tween_property(control, "offset_top", target_rect.position.y, duration)
	tween.tween_property(control, "offset_right", target_rect.position.x + target_rect.size.x, duration)
	tween.tween_property(control, "offset_bottom", target_rect.position.y + target_rect.size.y, duration)


static func set_color_rect_alpha(color_rect: ColorRect, base_color: Color, alpha: float) -> void:
	if color_rect == null:
		return
	color_rect.color = Color(base_color.r, base_color.g, base_color.b, alpha)

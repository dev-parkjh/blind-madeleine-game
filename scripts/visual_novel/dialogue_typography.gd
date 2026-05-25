class_name DialogueTypography
extends RefCounted

const SPEAKER_FONT_PATH := "res://assets/fonts/PretendardVariable.ttf"
const SPEAKER_FONT_SIZE := 32
const SPEAKER_FONT_WEIGHT := 800
const SPEAKER_OUTLINE_SIZE := 3
const SPEAKER_GLYPH_SPACING := 5

const BODY_FONT_PATH := "res://assets/fonts/PretendardVariable.ttf"
const BODY_FONT_SIZE := 36
const BODY_FONT_WEIGHT := 500


static func speaker_font_size() -> int:
	return SPEAKER_FONT_SIZE


static func speaker_font_weight() -> int:
	return SPEAKER_FONT_WEIGHT


static func speaker_outline_size() -> int:
	return SPEAKER_OUTLINE_SIZE


static func speaker_font() -> Font:
	var font := build_font(SPEAKER_FONT_PATH, SPEAKER_FONT_WEIGHT)
	if SPEAKER_GLYPH_SPACING != 0:
		font.set_spacing(TextServer.SPACING_GLYPH, SPEAKER_GLYPH_SPACING)
	return font


static func body_font_size() -> int:
	return BODY_FONT_SIZE


static func body_font_weight() -> int:
	return BODY_FONT_WEIGHT


static func body_font() -> Font:
	return build_font(BODY_FONT_PATH, BODY_FONT_WEIGHT)


static func build_font(font_path: String, weight: int) -> Font:
	if font_path.is_empty():
		return ThemeDB.fallback_font

	var base: Variant = load(font_path)
	if base == null:
		push_warning("DialogueTypography: could not load font at %s" % font_path)
		return ThemeDB.fallback_font

	if weight <= 0:
		return base as Font

	return _font_with_weight(base as Font, weight)


static func _font_with_weight(base: Font, weight: int) -> Font:
	var wght_tag := _wght_variation_tag()
	if wght_tag == 0:
		return base

	var supported: Dictionary = base.get_supported_variation_list()
	if supported.is_empty() or not supported.has(wght_tag):
		if weight == 400:
			return base
		var simulated := FontVariation.new()
		simulated.base_font = base
		simulated.variation_embolden = clampf(float(weight - 400) / 600.0, 0.0, 1.0)
		return simulated

	var variation := FontVariation.new()
	variation.base_font = base
	variation.variation_opentype = {wght_tag: float(weight)}
	return variation


static func _wght_variation_tag() -> int:
	var text_server := TextServerManager.get_primary_interface()
	if text_server == null:
		return 0
	return text_server.name_to_tag("wght")

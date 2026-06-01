class_name WebDisplayBridge

const _IS_MOBILE_WEB_JS := """
(() => {
	const ua = navigator.userAgent || "";
	const coarsePointer = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
	const touchDevice = navigator.maxTouchPoints && navigator.maxTouchPoints > 1;
	return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(ua) || (coarsePointer && touchDevice);
})()
"""

const _IS_IPHONE_WEB_JS := """
(() => {
	const ua = navigator.userAgent || "";
	return /iPhone|iPod/i.test(ua);
})()
"""

const _REQUEST_FULLSCREEN_LANDSCAPE_JS := """
(() => {
	const canvas = document.getElementById("canvas") || document.querySelector("canvas");
	const target = canvas || document.documentElement;
	const lockLandscape = () => {
		try {
			if (screen.orientation && screen.orientation.lock) {
				const lockResult = screen.orientation.lock("landscape");
				if (lockResult && lockResult.catch) {
					lockResult.catch(() => {});
				}
			}
		} catch (error) {}
	};
	const requestFullscreen = target.requestFullscreen
		|| target.webkitRequestFullscreen
		|| target.mozRequestFullScreen
		|| target.msRequestFullscreen;
	const fullscreenElement = document.fullscreenElement
		|| document.webkitFullscreenElement
		|| document.mozFullScreenElement
		|| document.msFullscreenElement;
	if (!fullscreenElement && requestFullscreen) {
		try {
			const requestResult = requestFullscreen.call(target);
			if (requestResult && requestResult.then) {
				requestResult.then(lockLandscape).catch(lockLandscape);
			} else {
				lockLandscape();
			}
		} catch (error) {
			lockLandscape();
		}
	} else {
		lockLandscape();
	}
	if (canvas && canvas.focus) {
		canvas.focus();
	}
})()
"""


static func is_web() -> bool:
	return OS.has_feature("web")


static func is_mobile_web() -> bool:
	if not is_web():
		return false

	if OS.has_feature("web_android") or OS.has_feature("web_ios") or OS.has_feature("mobile"):
		return true

	var result: Variant = _eval_js(_IS_MOBILE_WEB_JS)
	if result is bool:
		return result
	return false


static func is_iphone_web() -> bool:
	if not is_web():
		return false

	var result: Variant = _eval_js(_IS_IPHONE_WEB_JS)
	if result is bool:
		return result
	return false


static func can_request_fullscreen_landscape() -> bool:
	return is_web() and not is_iphone_web()


static func should_block_mobile_portrait(viewport_size: Vector2) -> bool:
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return false
	return is_mobile_web() and viewport_size.y > viewport_size.x


static func request_fullscreen_landscape() -> void:
	if not can_request_fullscreen_landscape():
		return

	DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	_eval_js(_REQUEST_FULLSCREEN_LANDSCAPE_JS)


static func _eval_js(source: String) -> Variant:
	if not is_web():
		return null
	return JavaScriptBridge.eval(source, true)

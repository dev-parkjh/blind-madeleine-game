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

const _EDITOR_PREVIEW_MESSAGE_STATE_KEY := "__blindMadeleineEditorPreview"
const _INSTALL_EDITOR_PREVIEW_MESSAGE_LISTENER_JS := """
(() => {
	const key = "__blindMadeleineEditorPreview";
	const state = window[key] || { seq: 0, payload: null, installed: false };
	if (!state.installed) {
		window.addEventListener("message", (event) => {
			const data = event && event.data ? event.data : null;
			if (!data || data.type !== "blind-madeleine-editor-preview") {
				return;
			}
			state.seq = Number(state.seq || 0) + 1;
			state.payload = {
				dialogue_id: String(data.dialogueId || data.dialogue_id || ""),
				node_id: String(data.nodeId || data.node_id || ""),
				device: String(data.device || ""),
				payload_url: String(data.payloadUrl || data.payload_url || "")
			};
			window[key] = state;
		});
		state.installed = true;
		window[key] = state;
	}
	return true;
})()
"""


static func is_web() -> bool:
	return OS.has_feature("web")


static func is_mobile_web() -> bool:
	if not is_web():
		return false

	if read_editor_preview_device().begins_with("fold7"):
		return true

	if OS.has_feature("web_android") or OS.has_feature("web_ios") or OS.has_feature("mobile"):
		return true

	var result: Variant = _eval_js(_IS_MOBILE_WEB_JS)
	if result is bool:
		return result
	return false


static func install_editor_preview_message_listener() -> void:
	if not is_web():
		return
	_eval_js(_INSTALL_EDITOR_PREVIEW_MESSAGE_LISTENER_JS)


static func read_editor_preview_message_json() -> String:
	if not is_web():
		return ""

	var quoted_key := JSON.stringify(_EDITOR_PREVIEW_MESSAGE_STATE_KEY)
	var result: Variant = _eval_js("""
(() => {
	const state = window[%s];
	if (!state || !state.payload) {
		return "";
	}
	return JSON.stringify({
		seq: Number(state.seq || 0),
		dialogue_id: String(state.payload.dialogue_id || ""),
		node_id: String(state.payload.node_id || ""),
		device: String(state.payload.device || ""),
		payload_url: String(state.payload.payload_url || "")
	});
})()
""" % quoted_key)
	if result is String:
		return String(result)
	return ""


static func read_editor_preview_device() -> String:
	if not is_web():
		return ""

	var quoted_key := JSON.stringify(_EDITOR_PREVIEW_MESSAGE_STATE_KEY)
	var result: Variant = _eval_js("""
(() => {
	const state = window[%s];
	if (state && state.payload && state.payload.device) {
		return String(state.payload.device || "");
	}
	return new URLSearchParams(window.location.search).get("editor_preview_device") || "";
})()
""" % quoted_key)
	if result is String:
		return String(result)
	return ""


static func is_iphone_web() -> bool:
	if not is_web():
		return false

	var result: Variant = _eval_js(_IS_IPHONE_WEB_JS)
	if result is bool:
		return result
	return false


static func can_request_fullscreen_landscape() -> bool:
	return is_web() and not is_iphone_web()


static func should_block_mobile_portrait(_viewport_size: Vector2) -> bool:
	return false


static func request_fullscreen_landscape() -> void:
	if not can_request_fullscreen_landscape():
		return

	DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	_eval_js(_REQUEST_FULLSCREEN_LANDSCAPE_JS)


static func read_query_param(name: String) -> String:
	if not is_web():
		return ""

	var quoted_name := JSON.stringify(name)
	var result: Variant = _eval_js("""
(() => {
	const value = new URLSearchParams(window.location.search).get(%s);
	return value || "";
})()
""" % quoted_name)
	if result is String:
		return String(result)
	return ""


static func read_preview_payload_json(payload_url_override := "") -> String:
	if not is_web():
		return ""

	var payload_url := String(payload_url_override).strip_edges()
	if payload_url.is_empty():
		payload_url = read_query_param("editor_preview_payload")
	if payload_url.is_empty():
		return ""

	var quoted_url := JSON.stringify(payload_url)
	var result: Variant = _eval_js("""
(() => {
	const url = %s;
	try {
		const request = new XMLHttpRequest();
		request.open("GET", url, false);
		request.send(null);
		if (request.status >= 200 && request.status < 300) {
			return request.responseText || "";
		}
	} catch (error) {}
	return "";
})()
""" % quoted_url)
	if result is String:
		return String(result)
	return ""


static func notify_editor_preview_ready() -> void:
	if not is_web():
		return

	_eval_js("""
(() => {
	if (window.parent && window.parent !== window) {
		window.parent.postMessage({ type: "blind-madeleine-editor-preview-ready" }, "*");
	}
	return true;
})()
""")


static func _eval_js(source: String) -> Variant:
	if not is_web():
		return null
	return JavaScriptBridge.eval(source, true)

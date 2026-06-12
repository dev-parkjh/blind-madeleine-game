import { createReadStream, readFileSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import http from "node:http";
import https from "node:https";
import { networkInterfaces, platform } from "node:os";
import path from "node:path";
import {
  createResource,
  deleteResource,
  editorRoot,
  loadResource,
  listResources,
  projectSummary,
  repoRoot,
  resourceTypes,
  resolveRepoPath,
  saveResource,
  writeProjectAsset
} from "./resource-store.mjs";

const distRoot = path.join(editorRoot, "dist");
const assetsRoot = resolveRepoPath("assets");
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 5177);
const tlsCertPath = (process.env.EDITOR_HTTPS_CERT || process.env.HTTPS_CERT || "").trim();
const tlsKeyPath = (process.env.EDITOR_HTTPS_KEY || process.env.HTTPS_KEY || "").trim();
const useHttps = Boolean(tlsCertPath && tlsKeyPath);
const protocol = useHttps ? "https" : "http";
const allowedHosts = (process.env.ALLOWED_HOSTS || "editor.parkjh.co.kr")
  .split(",")
  .map((allowedHost) => allowedHost.trim())
  .filter(Boolean);
const maxBodyBytes = 20 * 1024 * 1024;
const godotPreviewProxyPrefix = "/api/godot-preview";
const godotPreviewBridgeTarget = (process.env.GODOT_PREVIEW_ENDPOINT || process.env.GODOT_PREVIEW_BRIDGE_ENDPOINT || "http://127.0.0.1:51234").replace(/\/+$/, "");
const godotPreviewBridgeAutoStart = readBooleanEnv(process.env.GODOT_PREVIEW_AUTO_START, true);
const godotPreviewAutoBuild = readBooleanEnv(process.env.GODOT_PREVIEW_AUTO_BUILD, true);
const godotPreviewAutoBuildTimeoutSeconds = readIntegerEnv(process.env.GODOT_PREVIEW_AUTO_BUILD_TIMEOUT_SECONDS, 300, 30, 900);
const godotPreviewBridgeScript = resolveRepoPath("tools", "godot_preview_bridge.py");
const isDev = process.argv.includes("--dev") || process.env.NODE_ENV === "development";
let viteServer = null;
let managedGodotPreviewBridge = null;
let godotPreviewAutoStartStatus = "not-started";
let godotPreviewAutoBuildStatus = "not-started";

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".ttf", "font/ttf"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".mp3", "audio/mpeg"],
  [".ogg", "audio/ogg"],
  [".wav", "audio/wav"]
]);

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...crossOriginIsolationHeaders()
  });
  response.end(JSON.stringify(body, null, 2));
}

function crossOriginIsolationHeaders() {
  return {
    "cross-origin-opener-policy": "same-origin",
    "cross-origin-embedder-policy": "require-corp"
  };
}

function readBooleanEnv(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return !["0", "false", "no", "off"].includes(String(value).trim().toLowerCase());
}

function readIntegerEnv(value, fallback, min, max) {
  const parsed = Number(value);
  const next = Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
  return Math.min(max, Math.max(min, next));
}

function resolveRuntimePath(value) {
  const homeDir = process.env.USERPROFILE || process.env.HOME;
  if ((value === "~" || value.startsWith("~/")) && homeDir) {
    return path.join(homeDir, value.slice(2));
  }
  return path.resolve(process.cwd(), value);
}

function readTlsOptions() {
  if (Boolean(tlsCertPath) !== Boolean(tlsKeyPath)) {
    throw new Error("Set both EDITOR_HTTPS_CERT and EDITOR_HTTPS_KEY to enable HTTPS.");
  }
  if (!useHttps) return null;
  return {
    cert: readFileSync(resolveRuntimePath(tlsCertPath)),
    key: readFileSync(resolveRuntimePath(tlsKeyPath))
  };
}

function isLoopbackHost(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["127.0.0.1", "localhost", "::1", "[::1]"].includes(normalized);
}

function sendError(response, error) {
  const statusCode = error.statusCode || 500;
  sendJson(response, statusCode, {
    error: {
      message: statusCode === 500 ? "Internal server error" : error.message,
      detail: statusCode === 500 ? error.message : undefined
    }
  });
}

function getLanUrls() {
  const urls = [];
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family !== "IPv4" || entry.internal) continue;
      urls.push(`${protocol}://${entry.address}:${port}`);
    }
  }
  return urls;
}

function getDisplayUrls() {
  const localUrl = `${protocol}://127.0.0.1:${port}`;
  if (host === "0.0.0.0" || host === "::") {
    return [localUrl, ...getLanUrls()];
  }
  return [`${protocol}://${host}:${port}`];
}

function godotPreviewTargetUrl(pathname = "/health") {
  return new URL(pathname, `${godotPreviewBridgeTarget}/`);
}

function isLocalGodotPreviewBridgeTarget() {
  try {
    const url = new URL(godotPreviewBridgeTarget);
    const hostname = url.hostname.toLowerCase();
    return url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(hostname);
  } catch {
    return false;
  }
}

async function pingGodotPreviewBridge(timeoutMs = 700) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(godotPreviewTargetUrl("/health"), { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function pythonCandidates() {
  if (platform() === "win32") {
    const candidates = [
      { command: "python", args: [] },
      { command: "py", args: ["-3"] }
    ];
    if (process.env.USERPROFILE) {
      candidates.push({
        command: path.join(process.env.USERPROFILE, ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "python.exe"),
        args: []
      });
    }
    return candidates;
  }
  return [
    { command: "python3", args: [] },
    { command: "python", args: [] }
  ];
}

function findPythonCommand() {
  for (const candidate of pythonCandidates()) {
    const result = spawnSync(candidate.command, [...candidate.args, "-c", "import sys"], { stdio: "ignore" });
    if (result.status === 0) return candidate;
  }
  return null;
}

async function waitForGodotPreviewBridge(timeoutMs = 2500) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await pingGodotPreviewBridge(300)) return true;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return false;
}

async function ensureGodotPreviewBridge() {
  if (!godotPreviewBridgeAutoStart) {
    godotPreviewAutoStartStatus = "disabled";
    return;
  }
  if (!isLocalGodotPreviewBridgeTarget()) {
    godotPreviewAutoStartStatus = "external-target";
    return;
  }
  if (await pingGodotPreviewBridge()) {
    godotPreviewAutoStartStatus = "already-running";
    return;
  }

  const python = findPythonCommand();
  if (!python) {
    godotPreviewAutoStartStatus = "python-not-found";
    console.warn("[godot-preview] Python was not found. Set GODOT_PREVIEW_AUTO_START=0 to disable bridge auto-start.");
    return;
  }

  const targetUrl = godotPreviewTargetUrl("/");
  const bridgeHost = targetUrl.hostname === "localhost" ? "127.0.0.1" : targetUrl.hostname;
  const bridgePort = targetUrl.port || "51234";
  const godotPath = (process.env.GODOT_BIN || process.env.GODOT_EXECUTABLE || "").trim();
  const args = [
    ...python.args,
    godotPreviewBridgeScript,
    "--host",
    bridgeHost,
    "--port",
    bridgePort
  ];
  if (godotPath) args.push("--godot", godotPath);

  managedGodotPreviewBridge = spawn(python.command, args, {
    cwd: repoRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });
  godotPreviewAutoStartStatus = "starting";
  managedGodotPreviewBridge.stdout?.setEncoding("utf8");
  managedGodotPreviewBridge.stderr?.setEncoding("utf8");
  managedGodotPreviewBridge.stdout?.on("data", (chunk) => process.stdout.write(`[godot-preview] ${chunk}`));
  managedGodotPreviewBridge.stderr?.on("data", (chunk) => process.stderr.write(`[godot-preview] ${chunk}`));
  managedGodotPreviewBridge.once("exit", (code, signal) => {
    if (managedGodotPreviewBridge) {
      godotPreviewAutoStartStatus = `exited:${signal || (code ?? "unknown")}`;
      managedGodotPreviewBridge = null;
    }
  });

  godotPreviewAutoStartStatus = await waitForGodotPreviewBridge() ? "started" : "start-timeout";
}

async function runGodotPreviewAutoBuild() {
  if (!godotPreviewAutoBuild) {
    godotPreviewAutoBuildStatus = "disabled";
    return;
  }

  if (!(await pingGodotPreviewBridge(1000))) {
    godotPreviewAutoBuildStatus = "bridge-unavailable";
    console.warn("[godot-preview] Web preview auto build skipped because the bridge is unavailable.");
    return;
  }

  godotPreviewAutoBuildStatus = "building";
  console.log("[godot-preview] Web preview auto build started.");
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    (godotPreviewAutoBuildTimeoutSeconds + 5) * 1000
  );

  try {
    const response = await fetch(godotPreviewTargetUrl("/web-preview/build"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ timeout_seconds: godotPreviewAutoBuildTimeoutSeconds }),
      signal: controller.signal
    });
    const responseText = await response.text();
    let body = {};
    try {
      body = responseText ? JSON.parse(responseText) : {};
    } catch {
      body = {};
    }

    if (!response.ok || body.ok === false) {
      throw new Error(String(body.error || responseText || `HTTP ${response.status}`));
    }

    godotPreviewAutoBuildStatus = "built";
    console.log("[godot-preview] Web preview auto build finished.");
  } catch (error) {
    const message = error.name === "AbortError" ? "timeout" : error.message;
    godotPreviewAutoBuildStatus = `failed:${message}`.slice(0, 220);
    console.warn(`[godot-preview] Web preview auto build failed: ${message}`);
  } finally {
    clearTimeout(timeout);
  }
}

function stopManagedGodotPreviewBridge() {
  if (!managedGodotPreviewBridge || managedGodotPreviewBridge.killed) return;
  managedGodotPreviewBridge.kill(platform() === "win32" ? undefined : "SIGTERM");
}

function safeJoin(root, requestPath) {
  const decodedPath = decodeURIComponent(requestPath);
  const normalizedPath = decodedPath.replace(/^\/+/, "");
  const resolved = path.resolve(root, normalizedPath);

  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    const error = new Error("Static path is outside the allowed root.");
    error.statusCode = 400;
    throw error;
  }

  return resolved;
}

async function readJsonBody(request) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    totalBytes += chunk.byteLength;
    if (totalBytes > maxBodyBytes) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};

  const rawBody = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(rawBody);
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

async function readRequestBodyBuffer(request) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    totalBytes += chunk.byteLength;
    if (totalBytes > maxBodyBytes) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
}

async function serveFile(response, filePath) {
  const fileStats = await stat(filePath);
  if (!fileStats.isFile()) {
    const error = new Error("Not found");
    error.statusCode = 404;
    throw error;
  }

  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "content-type": mimeTypes.get(extension) || "application/octet-stream",
    "content-length": fileStats.size,
    "cache-control": extension === ".html" ? "no-store" : "public, max-age=60",
    ...crossOriginIsolationHeaders()
  });
  createReadStream(filePath).pipe(response);
}

async function createViteMiddleware() {
  if (!isDev) return null;

  try {
    const { createServer } = await import("vite");
    return await createServer({
      root: editorRoot,
      appType: "custom",
      server: {
        middlewareMode: true,
        allowedHosts,
        hmr: { server }
      }
    });
  } catch (error) {
    error.message = `Vite development dependencies are not installed. Run npm install in tools/editor first. ${error.message}`;
    throw error;
  }
}

async function runViteMiddleware(request, response) {
  if (!viteServer) return false;

  await new Promise((resolve, reject) => {
    viteServer.middlewares(request, response, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  return response.writableEnded;
}

async function serveViteIndex(request, response, url) {
  const indexPath = path.join(editorRoot, "index.html");
  const html = await readFile(indexPath, "utf8");
  const transformed = await viteServer.transformIndexHtml(url.pathname, html);
  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    ...crossOriginIsolationHeaders()
  });
  response.end(transformed);
}

async function handleApi(request, response, url) {
  const { pathname } = url;

  if (pathname === godotPreviewProxyPrefix || pathname.startsWith(`${godotPreviewProxyPrefix}/`)) {
    await proxyGodotPreviewBridge(request, response, url);
    return true;
  }

  if (request.method === "GET" && pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      host,
      port,
      protocol,
      https: useHttps,
      platform: platform(),
      urls: getDisplayUrls(),
      godotPreviewProxyEndpoint: godotPreviewProxyPrefix,
      godotPreviewBridgeTarget,
      godotPreviewBridgeAutoStart,
      godotPreviewAutoStartStatus,
      godotPreviewAutoBuild,
      godotPreviewAutoBuildStatus,
      godotPreviewAutoBuildTimeoutSeconds,
      managedGodotPreviewBridgePid: managedGodotPreviewBridge?.pid || null,
      repoRoot,
      editorRoot
    });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/resources") {
    sendJson(response, 200, { resourceTypes });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/project/summary") {
    sendJson(response, 200, await projectSummary());
    return true;
  }

  if (request.method === "POST" && pathname === "/api/files/upload") {
    const body = await readJsonBody(request);
    sendJson(response, 201, await writeProjectAsset(body.relativePath, body.dataBase64));
    return true;
  }

  const listMatch = pathname.match(/^\/api\/resources\/([^/]+)$/);
  if (listMatch && request.method === "GET") {
    sendJson(response, 200, {
      type: listMatch[1],
      resources: await listResources(listMatch[1])
    });
    return true;
  }

  if (listMatch && request.method === "POST") {
    const body = await readJsonBody(request);
    const created = await createResource(listMatch[1], body.data || body);
    sendJson(response, 201, created);
    return true;
  }

  const resourceMatch = pathname.match(/^\/api\/resources\/([^/]+)\/([^/]+)$/);
  if (resourceMatch && request.method === "GET") {
    const [, type, id] = resourceMatch;
    sendJson(response, 200, {
      type,
      id,
      data: await loadResource(type, id)
    });
    return true;
  }

  if (resourceMatch && request.method === "PUT") {
    const [, type, id] = resourceMatch;
    const body = await readJsonBody(request);
    const data = body.data || body;
    const summary = await saveResource(type, id, data);
    sendJson(response, 200, { summary, data: await loadResource(type, summary.id) });
    return true;
  }

  if (resourceMatch && request.method === "DELETE") {
    const [, type, id] = resourceMatch;
    sendJson(response, 200, await deleteResource(type, id));
    return true;
  }

  return false;
}

async function proxyGodotPreviewBridge(request, response, url) {
  const suffix = url.pathname.slice(godotPreviewProxyPrefix.length) || "/";
  const targetUrl = new URL(`${suffix}${url.search}`, `${godotPreviewBridgeTarget}/`);
  const headers = {};
  const contentType = request.headers["content-type"];
  if (contentType) headers["content-type"] = contentType;
  const accept = request.headers.accept;
  if (accept) headers.accept = accept;

  try {
    const body = request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await readRequestBodyBuffer(request);
    const bridgeResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body
    });
    const buffer = Buffer.from(await bridgeResponse.arrayBuffer());
    const responseHeaders = {
      "cache-control": bridgeResponse.headers.get("cache-control") || "no-store",
      ...crossOriginIsolationHeaders()
    };
    const bridgeContentType = bridgeResponse.headers.get("content-type");
    if (bridgeContentType) responseHeaders["content-type"] = bridgeContentType;
    if (request.method !== "HEAD") responseHeaders["content-length"] = String(buffer.byteLength);
    response.writeHead(bridgeResponse.status, responseHeaders);
    response.end(request.method === "HEAD" ? undefined : buffer);
  } catch (error) {
    sendJson(response, 502, {
      ok: false,
      error: `Godot preview bridge에 연결할 수 없습니다. ${godotPreviewBridgeTarget}에서 bridge가 실행 중인지 확인하세요. (${error.message})`
    });
  }
}

async function handleStatic(request, response, url) {
  if (url.pathname.startsWith("/repo/assets/")) {
    const filePath = safeJoin(assetsRoot, url.pathname.slice("/repo/assets/".length));
    await serveFile(response, filePath);
    return;
  }

  if (viteServer) {
    const handled = await runViteMiddleware(request, response);
    if (handled) return;

    if (request.method === "GET" && !url.pathname.startsWith("/api/")) {
      await serveViteIndex(request, response, url);
      return;
    }
  }

  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const root = isDev ? editorRoot : distRoot;
  const filePath = safeJoin(root, requestedPath);

  try {
    await serveFile(response, filePath);
  } catch (error) {
    if (error.statusCode === 404 || error.code === "ENOENT") {
      await serveFile(response, path.join(root, "index.html"));
      return;
    }
    throw error;
  }
}

async function handleRequest(request, response) {
  try {
    response.setHeader("cross-origin-opener-policy", "same-origin");
    response.setHeader("cross-origin-embedder-policy", "require-corp");
    const url = new URL(request.url || "/", `${protocol}://${request.headers.host || `${host}:${port}`}`);

    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
        "access-control-allow-headers": "content-type"
      });
      response.end();
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      const handled = await handleApi(request, response, url);
      if (!handled) {
        sendJson(response, 404, { error: { message: "API route not found." } });
      }
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: { message: "Method not allowed." } });
      return;
    }

    await handleStatic(request, response, url);
  } catch (error) {
    if (error.code === "ENOENT") {
      error.statusCode = 404;
      error.message = "Not found";
    }
    sendError(response, error);
  }
}

const tlsOptions = readTlsOptions();
const server = tlsOptions
  ? https.createServer(tlsOptions, handleRequest)
  : http.createServer(handleRequest);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    stopManagedGodotPreviewBridge();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1000).unref();
  });
}
process.once("exit", stopManagedGodotPreviewBridge);
server.once("error", (error) => {
  stopManagedGodotPreviewBridge();
  throw error;
});

await ensureGodotPreviewBridge();
viteServer = await createViteMiddleware();

server.listen(port, host, () => {
  const mode = viteServer ? "Vite React dev" : "production";
  console.log(`Blind Madeleine editor server running (${mode}, ${protocol.toUpperCase()})`);
  console.log(`Godot preview bridge: ${godotPreviewAutoStartStatus} (${godotPreviewBridgeTarget})`);
  console.log(`Godot web preview auto build: ${godotPreviewAutoBuild ? "enabled" : "disabled"}`);
  if (!useHttps && !isLoopbackHost(host)) {
    console.log("Godot Web previews require a secure context: HTTP works for 127.0.0.1 only; use HTTPS for LAN IPs and custom hostnames.");
  }
  for (const url of getDisplayUrls()) {
    console.log(`  ${url}`);
  }
  void runGodotPreviewAutoBuild();
});

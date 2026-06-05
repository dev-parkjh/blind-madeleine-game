import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import http from "node:http";
import { networkInterfaces } from "node:os";
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
const allowedHosts = (process.env.ALLOWED_HOSTS || "editor.parkjh.co.kr")
  .split(",")
  .map((allowedHost) => allowedHost.trim())
  .filter(Boolean);
const maxBodyBytes = 20 * 1024 * 1024;
const isDev = process.argv.includes("--dev") || process.env.NODE_ENV === "development";
let viteServer = null;

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
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(body, null, 2));
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
      urls.push(`http://${entry.address}:${port}`);
    }
  }
  return urls;
}

function getDisplayUrls() {
  const localUrl = `http://127.0.0.1:${port}`;
  if (host === "0.0.0.0" || host === "::") {
    return [localUrl, ...getLanUrls()];
  }
  return [`http://${host}:${port}`];
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
    "cache-control": extension === ".html" ? "no-store" : "public, max-age=60"
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
    "cache-control": "no-store"
  });
  response.end(transformed);
}

async function handleApi(request, response, url) {
  const { pathname } = url;

  if (request.method === "GET" && pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      host,
      port,
      urls: getDisplayUrls(),
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

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);

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
});

viteServer = await createViteMiddleware();

server.listen(port, host, () => {
  const mode = viteServer ? "Vite React dev" : "production";
  console.log(`Blind Madeleine editor server running (${mode})`);
  for (const url of getDisplayUrls()) {
    console.log(`  ${url}`);
  }
});

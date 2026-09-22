#!/usr/bin/env node
/**
 * Local development server for Fast Answer.
 *
 * Production runs on Vercel (static files + `api/*` serverless functions).
 * `vercel dev` needs a Vercel login and a linked project, which is not
 * available in headless / CI-style environments, so this server reproduces
 * the pieces of the Vercel runtime the app actually relies on:
 *
 *   - static file serving from the repo root
 *   - the `vercel.json` `rewrites` (/dojo, /directions, /flow)
 *   - `/api/*` routing to the matching handler module, with the Vercel Node
 *     request/response shims the handlers expect (`req.query`, `req.body`,
 *     `res.status()`)
 *
 * It is a dev/test convenience only and is never used in production.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

// Rewrites mirrored from vercel.json.
const REWRITES = new Map([
  ["/dojo", "/dojo.html"],
  ["/dojo/", "/dojo.html"],
  ["/directions", "/directions.html"],
  ["/directions/", "/directions.html"],
  ["/flow", "/flow/index.html"],
  ["/flow/", "/flow/index.html"],
]);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => { raw += c; });
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

/** Add the Vercel Node request/response helpers the handlers assume exist. */
function decorate(req, res, url, rawBody) {
  const query = {};
  for (const [k, v] of url.searchParams.entries()) {
    if (k in query) {
      query[k] = [].concat(query[k], v);
    } else {
      query[k] = v;
    }
  }
  req.query = query;

  if (rawBody) {
    const ct = String(req.headers["content-type"] || "");
    if (ct.includes("application/json")) {
      try { req.body = JSON.parse(rawBody); }
      catch { req.body = rawBody; }
    } else {
      req.body = rawBody;
    }
  }

  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
}

function safeResolveStatic(pathname) {
  // Prevent path traversal, then resolve within ROOT.
  const decoded = decodeURIComponent(pathname);
  const rel = decoded.replace(/^\/+/, "");
  const abs = path.resolve(ROOT, rel);
  if (abs !== ROOT && !abs.startsWith(ROOT + path.sep)) return null;
  return abs;
}

function serveStatic(res, pathname) {
  let abs = safeResolveStatic(pathname);
  if (!abs) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }
  try {
    let stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      abs = path.join(abs, "index.html");
      stat = fs.statSync(abs);
    }
    const ext = path.extname(abs).toLowerCase();
    res.statusCode = 200;
    res.setHeader("content-type", MIME[ext] || "application/octet-stream");
    res.setHeader("cache-control", "no-store");
    fs.createReadStream(abs).pipe(res);
  } catch {
    res.statusCode = 404;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Not found");
  }
}

function resolveApiHandlerFile(pathname) {
  // /api/rooms -> api/rooms.js ; /api/flow/session -> api/flow/session.js
  const clean = pathname.replace(/\/+$/, "");
  const candidate = path.resolve(ROOT, "." + clean + ".js");
  if (candidate !== ROOT && candidate.startsWith(ROOT + path.sep) && fs.existsSync(candidate)) {
    return candidate;
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  let pathname = url.pathname;

  try {
    if (pathname.startsWith("/api/")) {
      const file = resolveApiHandlerFile(pathname);
      if (!file) {
        res.statusCode = 404;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ error: "not_found" }));
        return;
      }
      const rawBody = req.method === "POST" || req.method === "PUT" || req.method === "PATCH"
        ? await readRawBody(req)
        : "";
      decorate(req, res, url, rawBody);
      const mod = await import(pathToFileURL(file).href);
      const handler = mod.default || mod.handler;
      if (typeof handler !== "function") {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "no_handler" }));
        return;
      }
      await handler(req, res);
      return;
    }

    if (REWRITES.has(pathname)) {
      pathname = REWRITES.get(pathname);
    } else if (pathname === "/") {
      pathname = "/index.html";
    }
    serveStatic(res, pathname);
  } catch (err) {
    console.error(`[dev-server] ${req.method} ${pathname} failed:`, err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "server_error", message: String(err && err.message || err) }));
    } else {
      res.end();
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[dev-server] Fast Answer running at http://${HOST}:${PORT}`);
  console.log(`[dev-server] serving static files + api/* from ${ROOT}`);
});

#!/usr/bin/env node
/** Local preview: static Fast Answer plus the /api handlers. */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8080;
const HOST = "0.0.0.0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ico": "image/x-icon",
};

const REWRITE = {
  "/dojo": "/dojo.html",
  "/dojo/": "/dojo.html",
  "/directions": "/directions.html",
  "/directions/": "/directions.html",
  "/flow": "/flow/index.html",
  "/flow/": "/flow/index.html",
};

const handlers = new Map();

async function loadHandler(rel) {
  if (handlers.has(rel)) return handlers.get(rel);
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) return null;
  const mod = await import(pathToFileURL(file).href);
  const fn = mod.default;
  handlers.set(rel, fn || null);
  return fn || null;
}

function apiFile(urlPath) {
  const clean = urlPath.replace(/\/+$/, "") || "/";
  const rel = clean.replace(/^\//, "");
  if (!rel.startsWith("api/")) return null;
  const direct = path.join(ROOT, rel + ".js");
  if (fs.existsSync(direct)) return rel + ".js";
  const index = path.join(ROOT, rel, "index.js");
  if (fs.existsSync(index)) return path.posix.join(rel, "index.js");
  return null;
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", () => resolve(Buffer.alloc(0)));
  });
}

function sendFile(res, file) {
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, {
    "content-type": MIME[ext] || "application/octet-stream",
    "cache-control": ext === ".html" ? "no-cache" : "public, max-age=120",
  });
  fs.createReadStream(file).pipe(res);
}

function safeFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const rewritten = REWRITE[decoded] || decoded;
  let rel = rewritten.replace(/^\/+/, "");
  if (!rel || rel.endsWith("/")) rel += "index.html";
  if (/^tv\/[A-Za-z0-9]{2,8}$/i.test(rel)) rel = "index.html";
  const file = path.resolve(ROOT, rel);
  if (!file.startsWith(ROOT)) return null;
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  if (fs.existsSync(file + ".html")) return file + ".html";
  return null;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const apiRel = apiFile(url.pathname);
    if (apiRel) {
      const handler = await loadHandler(apiRel);
      if (!handler) {
        res.writeHead(404, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "missing" }));
        return;
      }
      const raw = await readBody(req);
      let body = {};
      if (raw.length) {
        try { body = JSON.parse(raw.toString("utf8")); } catch { body = {}; }
      }
      const query = Object.fromEntries(url.searchParams);
      const fakeReq = { method: req.method, headers: req.headers, query, body, url: req.url };
      let statusCode = 200;
      const headers = {};
      const fakeRes = {
        setHeader(k, v) { headers[k.toLowerCase()] = v; },
        status(n) { statusCode = n; return this; },
        end(payload) {
          if (!res.headersSent) res.writeHead(statusCode, headers);
          res.end(payload);
        },
        json(obj) {
          headers["content-type"] = "application/json; charset=utf-8";
          this.end(JSON.stringify(obj));
        },
      };
      await handler(fakeReq, fakeRes);
      if (!res.headersSent) {
        res.writeHead(statusCode, headers);
        res.end();
      }
      return;
    }
    const file = safeFile(url.pathname);
    if (!file) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    sendFile(res, file);
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: String(err && err.message || err) }));
    }
  }
});

server.listen(PORT, HOST);
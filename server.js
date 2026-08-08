// Local dev server with API routes for L&D Spices site + admin panel.
// Run: npm install && npm run dev   then open http://localhost:4173
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const ROOT = __dirname;
const PORT = process.env.PORT || 4173;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

function patchResponse(res) {
  res.status = function status(code) {
    this.statusCode = code;
    return this;
  };
  res.json = function json(data) {
    if (!this.headersSent) {
      this.setHeader("Content-Type", "application/json");
    }
    this.end(JSON.stringify(data));
    return this;
  };
  return res;
}

async function handleApi(req, res, pathname) {
  const apiPath = pathname.replace(/^\/api/, "");
  let handlerPath;

  if (apiPath === "/products") handlerPath = path.join(ROOT, "api", "products.js");
  else if (apiPath === "/admin/login") handlerPath = path.join(ROOT, "api", "admin", "login.js");
  else if (apiPath === "/admin/logout") handlerPath = path.join(ROOT, "api", "admin", "logout.js");
  else if (apiPath === "/admin/session") handlerPath = path.join(ROOT, "api", "admin", "session.js");
  else if (apiPath === "/admin/upload") handlerPath = path.join(ROOT, "api", "admin", "upload.js");
  else return false;

  try {
    delete require.cache[require.resolve(handlerPath)];
    const handler = require(handlerPath);
    const body = await readBody(req);
    req.body = body;
    patchResponse(res);
    await handler(req, res);
    return true;
  } catch (err) {
    console.error("API error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
    return true;
  }
}

function serveStatic(req, res, urlPath) {
  if (urlPath === "/") urlPath = "/index.html";
  if (urlPath === "/admin") urlPath = "/admin/index.html";

  const filePath = path.join(ROOT, path.normalize(urlPath));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found: " + urlPath);
      return;
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    });
    res.end(data);
  });
}

http
  .createServer(async (req, res) => {
    const parsed = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = decodeURIComponent(parsed.pathname);

    if (pathname.startsWith("/api/")) {
      const handled = await handleApi(req, res, pathname);
      if (handled) return;
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "API route not found" }));
      return;
    }

    serveStatic(req, res, pathname);
  })
  .listen(PORT, () => {
    console.log(`L&D Spices site running at http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
  });

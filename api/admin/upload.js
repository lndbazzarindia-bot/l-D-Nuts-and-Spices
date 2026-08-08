const fs = require("fs");
const path = require("path");
const { isAuthenticated } = require("../_lib/auth");

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { filename, dataUrl } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!filename || !dataUrl || !dataUrl.startsWith("data:image/")) {
      res.status(400).json({ error: "Invalid image upload" });
      return;
    }

    const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
    if (!match) {
      res.status(400).json({ error: "Invalid image data" });
      return;
    }

    const mime = match[1];
    const buffer = Buffer.from(match[2], "base64");
    const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    const safeName = `${slugify(filename)}-${Date.now()}.${ext}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const blob = await put(`products/${safeName}`, buffer, {
        access: "public",
        contentType: mime,
      });
      res.status(200).json({ url: blob.url });
      return;
    }

    const uploadDir = path.join(process.cwd(), "assets", "img", "t");
    fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, safeName);
    fs.writeFileSync(filePath, buffer);
    res.status(200).json({ url: `assets/img/t/${safeName}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
};

const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(process.cwd(), "data", "products.json");
const BLOB_PATHNAME = "ld-products-catalog.json";

async function readLocalFile() {
  const raw = fs.readFileSync(DATA_PATH, "utf8");
  return JSON.parse(raw);
}

async function readFromBlob() {
  const { list } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: BLOB_PATHNAME, limit: 1 });
  if (!blobs.length) return null;
  const res = await fetch(blobs[0].url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function getCatalog() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blobData = await readFromBlob();
      if (blobData && Array.isArray(blobData.products)) return blobData;
    } catch (err) {
      console.error("Blob read failed, falling back to local file:", err.message);
    }
  }
  return readLocalFile();
}

async function saveCatalog(data) {
  const payload = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    await put(BLOB_PATHNAME, JSON.stringify(payload), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  }

  try {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(payload, null, 2));
  } catch (err) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw err;
  }

  return payload;
}

module.exports = { getCatalog, saveCatalog };

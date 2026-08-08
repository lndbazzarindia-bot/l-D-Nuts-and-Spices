const { isAuthenticated } = require("./_lib/auth");
const { getCatalog, saveCatalog } = require("./_lib/products-store");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method === "GET") {
    try {
      const catalog = await getCatalog();
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
      res.status(200).json(catalog);
    } catch (err) {
      res.status(500).json({ error: "Could not load products" });
    }
    return;
  }

  if (req.method === "PUT") {
    if (!isAuthenticated(req)) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!body || !Array.isArray(body.products)) {
        res.status(400).json({ error: "Invalid payload" });
        return;
      }

      const cleaned = body.products.map((p) => ({
        id: String(p.id),
        name: String(p.name || "").trim(),
        pack: String(p.pack || "").trim(),
        price: Number(p.price),
        cat: String(p.cat || "nuts"),
        img: String(p.img || "").trim(),
        active: p.active !== false,
      }));

      const saved = await saveCatalog({ products: cleaned });
      res.status(200).json(saved);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Could not save products" });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};

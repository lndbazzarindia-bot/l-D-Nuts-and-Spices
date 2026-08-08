/* Category labels + product loader for L&D site */
const CATEGORY_LABELS = {
  all: "Everything",
  nuts: "Nuts",
  dryfruits: "Dry Fruits",
  spices: "Spices",
  seeds: "Seeds",
  oils: "Oils & Ghee",
  naturals: "Naturals",
  podi: "Podi & Snacks",
  gifts: "Gift Combos",
};

let PRODUCTS = [];

async function loadProducts() {
  try {
    const res = await fetch("/api/products", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      PRODUCTS = (data.products || []).filter((p) => p.active !== false);
      return;
    }
  } catch (_) {
    /* offline / static hosting without API */
  }

  try {
    const res = await fetch("/data/products.json", { cache: "no-store" });
    const data = await res.json();
    PRODUCTS = (data.products || []).filter((p) => p.active !== false);
  } catch (err) {
    console.error("Could not load products", err);
    PRODUCTS = [];
  }
}

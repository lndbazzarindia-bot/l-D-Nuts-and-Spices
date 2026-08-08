const fs = require("fs");
const path = require("path");

const legacyPath = path.join(__dirname, "../_extracted/assets/js/products.js");
const backupPath = path.join(__dirname, "../assets/js/products.legacy.js");
const currentPath = path.join(__dirname, "../assets/js/products.js");
const srcPath = fs.existsSync(legacyPath) ? legacyPath : fs.existsSync(backupPath) ? backupPath : currentPath;
const src = fs.readFileSync(srcPath, "utf8");
const IMG = "assets/img/t/";
const P = "assets/img/t/";
const match = src.match(/const PRODUCTS = (\[[\s\S]*?\]);/);
if (!match) throw new Error("Could not parse PRODUCTS array");

const products = eval(match[1]);

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const seen = new Set();
const final = products.map((p, i) => {
  let id = slugify(`${p.name}-${p.pack}`) || `product-${i}`;
  if (seen.has(id)) id = `${id}-${i}`;
  seen.add(id);
  return {
    id,
    name: p.name,
    pack: p.pack,
    price: p.price,
    cat: p.cat,
    img: p.img,
    active: true,
  };
});

const outDir = path.join(__dirname, "../data");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "products.json"),
  JSON.stringify({ products: final, updatedAt: new Date().toISOString() }, null, 2)
);
console.log(`Wrote ${final.length} products to data/products.json`);

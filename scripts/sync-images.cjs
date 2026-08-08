const fs = require("fs");
const path = require("path");
const https = require("https");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const BASE = "https://www.ldnutsandspices.in";
const CLIENT = path.join(ROOT, "..");
const ZIP = path.join(CLIENT, "..", "L-and-D-Nuts-and-Spices-deploy.zip");

function download(url, dest) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          return download(res.headers.location, dest).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          file.close();
          reject(new Error(`${url} -> ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve(dest)));
      })
      .on("error", reject);
  });
}

function copyIfExists(src, dest) {
  if (!fs.existsSync(src) || fs.statSync(src).size < 500) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log("Copied", path.basename(src), "->", path.relative(ROOT, dest));
  return true;
}

function extractZipEntry(entryPath, dest) {
  if (!fs.existsSync(ZIP)) return false;
  const ps = `Add-Type -AssemblyName System.IO.Compression.FileSystem; $z=[IO.Compression.ZipFile]::OpenRead('${ZIP.replace(/'/g, "''")}'); $e=$z.GetEntry('${entryPath}'); if($e){ $s=$e.Open(); $fs=[IO.File]::Create('${dest.replace(/'/g, "''")}'); $s.CopyTo($fs); $fs.Close(); $s.Close() }; $z.Dispose()`;
  try {
    execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "pipe" });
    if (fs.existsSync(dest) && fs.statSync(dest).size > 500) {
      console.log("Extracted", entryPath, "->", path.relative(ROOT, dest));
      return true;
    }
  } catch (_) {}
  return false;
}

async function main() {
  const products = JSON.parse(fs.readFileSync(path.join(ROOT, "data/products.json"), "utf8"));
  const urls = new Set(products.products.map((p) => p.img));

  const siteImages = [
    "assets/img/logo.jpeg",
    "assets/img/cashew.jpg",
    "assets/img/figs.jpg",
    "assets/img/cardamom.jpg",
    "assets/img/honey.jpg",
    "assets/img/walnuts.jpg",
    "assets/img/makhana.jpg",
    "assets/img/pepper.jpg",
    "assets/img/almonds.jpg",
    "assets/img/raisins.jpg",
    "assets/img/cinnamon.jpg",
    "assets/img/mixednuts.jpg",
    "assets/img/u/ghee.jpeg",
    "assets/img/u/wood-pressed-gingelly-oil.webp",
    "assets/img/poppyseeds.jpg",
    "assets/img/pumpkinseeds.jpg",
    "assets/img/sunflowerseeds.jpg",
  ];
  siteImages.forEach((u) => urls.add(u));

  let ok = 0;
  let fail = 0;
  for (const rel of urls) {
    const dest = path.join(ROOT, rel.replace(/\//g, path.sep));
    if (fs.existsSync(dest) && fs.statSync(dest).size > 500) {
      ok++;
      continue;
    }
    try {
      await download(`${BASE}/${rel}`, dest);
      if (fs.statSync(dest).size > 500) ok++;
      else {
        fs.unlinkSync(dest);
        fail++;
      }
    } catch (e) {
      fail++;
      console.warn("Skip", rel, e.message);
    }
  }

  copyIfExists(path.join(CLIENT, "fig.jpeg"), path.join(ROOT, "assets/img/figs.jpg"));
  copyIfExists(path.join(CLIENT, "fig.jpeg"), path.join(ROOT, "assets/img/t/figs.jpg"));
  copyIfExists(path.join(CLIENT, "sunflower seeds.jpeg"), path.join(ROOT, "assets/img/sunflowerseeds.jpg"));
  copyIfExists(path.join(CLIENT, "sunflower seeds.jpeg"), path.join(ROOT, "assets/img/t/sunflowerseeds.jpg"));
  copyIfExists(path.join(CLIENT, "greeen pumpkin seeds.jpeg"), path.join(ROOT, "assets/img/pumpkinseeds.jpg"));
  copyIfExists(path.join(CLIENT, "greeen pumpkin seeds.jpeg"), path.join(ROOT, "assets/img/t/pumpkinseeds.jpg"));
  copyIfExists(path.join(CLIENT, "kasa kasa(poppy seeds).jpeg"), path.join(ROOT, "assets/img/poppyseeds.jpg"));
  copyIfExists(path.join(CLIENT, "kasa kasa(poppy seeds).jpeg"), path.join(ROOT, "assets/img/t/poppyseeds.jpg"));
  copyIfExists(path.join(CLIENT, "logo.jpeg"), path.join(ROOT, "assets/img/logo.jpeg"));

  const walnutLocal = path.join(CLIENT, "walnut.jpeg");
  if (!copyIfExists(walnutLocal, path.join(ROOT, "assets/img/t/u-walnut.jpg"))) {
    extractZipEntry("assets/img/t/u-walnut.jpg", path.join(ROOT, "assets/img/t/u-walnut.jpg"));
    extractZipEntry("assets/img/t/u-walnut-premium.jpg", path.join(ROOT, "assets/img/t/u-walnut-premium.jpg"));
    extractZipEntry("assets/img/t/walnuts.jpg", path.join(ROOT, "assets/img/t/walnuts.jpg"));
    extractZipEntry("assets/img/walnuts.jpg", path.join(ROOT, "assets/img/walnuts.jpg"));
  } else {
    fs.copyFileSync(walnutLocal, path.join(ROOT, "assets/img/t/u-walnut-premium.jpg"));
    fs.copyFileSync(walnutLocal, path.join(ROOT, "assets/img/walnuts.jpg"));
    fs.copyFileSync(walnutLocal, path.join(ROOT, "assets/img/t/walnuts.jpg"));
  }

  products.products.forEach((p) => {
    if (p.name.toLowerCase().includes("kasa kasa")) p.img = "assets/img/t/poppyseeds.jpg";
    if (p.name === "Walnut" || p.name === "Walnut Premium") {
      p.img = p.name === "Walnut Premium" ? "assets/img/t/u-walnut-premium.jpg" : "assets/img/t/u-walnut.jpg";
    }
  });
  products.updatedAt = new Date().toISOString();
  fs.writeFileSync(path.join(ROOT, "data/products.json"), JSON.stringify(products, null, 2));

  console.log(`Done. ${ok} images OK, ${fail} need manual fix.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

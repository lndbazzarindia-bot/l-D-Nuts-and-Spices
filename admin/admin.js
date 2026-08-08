const CATEGORY_LABELS = {
  all: "All",
  nuts: "Nuts",
  dryfruits: "Dry Fruits",
  spices: "Spices",
  seeds: "Seeds",
  oils: "Oils & Ghee",
  naturals: "Naturals",
  podi: "Podi & Snacks",
  gifts: "Gift Combos",
};

let products = [];
let dirty = false;
let updatedAt = "";
let activeCategory = "all";

const loadingScreen = document.getElementById("loading-screen");
const loginScreen = document.getElementById("login-screen");
const adminScreen = document.getElementById("admin-screen");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const productsGrid = document.getElementById("products-grid");
const categoryPills = document.getElementById("category-pills");
const searchInput = document.getElementById("search");
const saveAllBtn = document.getElementById("save-all");
const logoutBtn = document.getElementById("logout");
const statusMsg = document.getElementById("status-msg");
const productCountEl = document.getElementById("product-count");
const dirtyCountEl = document.getElementById("dirty-count");
const lastUpdatedEl = document.getElementById("last-updated");

function showScreen(screen) {
  loadingScreen.hidden = true;
  loginScreen.hidden = screen !== "login";
  adminScreen.hidden = screen !== "admin";
}

function showStatus(text, type = "ok") {
  statusMsg.textContent = text;
  statusMsg.className = `status-banner${type === "err" ? " err" : ""}`;
  statusMsg.hidden = false;
  if (type === "ok") {
    setTimeout(() => { statusMsg.hidden = true; }, 3500);
  }
}

function setDirty(value) {
  dirty = value;
  dirtyCountEl.hidden = !dirty;
}

async function checkSession() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("/api/admin/session", { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated) {
        showScreen("admin");
        await loadProducts();
        return;
      }
    }
  } catch (_) {
    /* API unavailable — show login */
  }
  showScreen("login");
}

async function loadProducts() {
  const res = await fetch("/api/products");
  const data = await res.json();
  products = data.products || [];
  updatedAt = data.updatedAt || "";
  renderCategoryPills();
  renderGrid();
  setDirty(false);
}

function renderCategoryPills() {
  const cats = ["all", ...new Set(products.map((p) => p.cat))];
  categoryPills.innerHTML = "";
  cats.forEach((cat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `pill ${activeCategory === cat ? "pill-active" : "pill-inactive"}`;
    btn.textContent = CATEGORY_LABELS[cat] || cat;
    btn.addEventListener("click", () => {
      activeCategory = cat;
      renderCategoryPills();
      renderGrid();
    });
    categoryPills.appendChild(btn);
  });
}

function filteredProducts() {
  const q = searchInput.value.trim().toLowerCase();
  return products.filter((p) => {
    if (activeCategory !== "all" && p.cat !== activeCategory) return false;
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.pack.toLowerCase().includes(q) ||
      (CATEGORY_LABELS[p.cat] || "").toLowerCase().includes(q)
    );
  });
}

function renderGrid() {
  const rows = filteredProducts();
  productCountEl.textContent = `${rows.length} product${rows.length !== 1 ? "s" : ""}`;
  lastUpdatedEl.textContent = updatedAt
    ? `Last saved ${new Date(updatedAt).toLocaleString("en-IN")}`
    : "";

  productsGrid.innerHTML = "";

  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No products match your search.";
    productsGrid.appendChild(empty);
    return;
  }

  rows.forEach((p) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.dataset.id = p.id;
    card.innerHTML = `
      <div class="product-image-wrap">
        <img src="${p.img}" alt="${escapeHtml(p.name)}" loading="lazy">
      </div>
      <div class="product-body">
        <p class="product-name">${escapeHtml(p.name)}</p>
        <p class="product-pack">${escapeHtml(p.pack)}</p>
        <p class="product-cat">${escapeHtml(CATEGORY_LABELS[p.cat] || p.cat)}</p>
        <div class="price-row">
          <span>₹</span>
          <input type="number" class="price-input" min="0" step="1" value="${p.price}" data-field="price" aria-label="Price for ${escapeHtml(p.name)}">
        </div>
        <label class="btn btn-ghost upload-label">
          Change photo
          <input type="file" accept="image/*" data-upload="${p.id}">
        </label>
      </div>`;

    card.querySelector('[data-field="price"]').addEventListener("input", (e) => {
      const prod = products.find((x) => x.id === p.id);
      if (prod) {
        prod.price = Number(e.target.value);
        setDirty(true);
      }
    });

    card.querySelector("[data-upload]").addEventListener("change", (e) => uploadImage(p.id, e.target));
    productsGrid.appendChild(card);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function uploadImage(id, input) {
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    saveAllBtn.disabled = true;
    showStatus("Uploading photo…");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, dataUrl: reader.result }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const prod = products.find((p) => p.id === id);
      if (prod) {
        prod.img = data.url;
        setDirty(true);
        renderGrid();
        showStatus("Photo uploaded. Click Save changes to publish.");
      }
    } catch (err) {
      showStatus(err.message, "err");
    } finally {
      saveAllBtn.disabled = false;
      input.value = "";
    }
  };
  reader.readAsDataURL(file);
}

async function saveAll() {
  saveAllBtn.disabled = true;
  showStatus("Saving changes…");

  try {
    const res = await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Save failed");

    products = data.products;
    updatedAt = data.updatedAt;
    setDirty(false);
    renderGrid();
    showStatus("All changes saved. The website will show updated prices.");
  } catch (err) {
    showStatus(err.message, "err");
  } finally {
    saveAllBtn.disabled = false;
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.hidden = true;

  const password = document.getElementById("password").value;
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    loginError.textContent = "Wrong password. Try again.";
    loginError.hidden = false;
    return;
  }

  document.getElementById("password").value = "";
  showScreen("admin");
  await loadProducts();
});

logoutBtn.addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" });
  showScreen("login");
});

saveAllBtn.addEventListener("click", saveAll);
searchInput.addEventListener("input", renderGrid);

window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});

checkSession();

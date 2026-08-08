const CATEGORY_LABELS = {
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

const loginScreen = document.getElementById("login-screen");
const adminScreen = document.getElementById("admin-screen");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const productsBody = document.getElementById("products-body");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("category-filter");
const saveAllBtn = document.getElementById("save-all");
const logoutBtn = document.getElementById("logout");
const statusMsg = document.getElementById("status-msg");
const productCountEl = document.getElementById("product-count");
const dirtyCountEl = document.getElementById("dirty-count");
const lastUpdatedEl = document.getElementById("last-updated");

function showStatus(text, type = "ok") {
  statusMsg.textContent = text;
  statusMsg.className = `status-msg ${type}`;
  statusMsg.hidden = false;
  if (type === "ok") setTimeout(() => { statusMsg.hidden = true; }, 3000);
}

function setDirty(value) {
  dirty = value;
  dirtyCountEl.hidden = !dirty;
}

async function checkSession() {
  const res = await fetch("/api/admin/session");
  const data = await res.json();
  if (data.authenticated) {
    loginScreen.hidden = true;
    adminScreen.hidden = false;
    await loadProducts();
  }
}

async function loadProducts() {
  const res = await fetch("/api/products");
  const data = await res.json();
  products = data.products || [];
  updatedAt = data.updatedAt || "";
  populateCategoryFilter();
  renderTable();
  setDirty(false);
}

function populateCategoryFilter() {
  const cats = [...new Set(products.map((p) => p.cat))];
  categoryFilter.innerHTML = '<option value="">All categories</option>';
  cats.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = CATEGORY_LABELS[cat] || cat;
    categoryFilter.appendChild(opt);
  });
}

function filteredProducts() {
  const q = searchInput.value.trim().toLowerCase();
  const cat = categoryFilter.value;
  return products.filter((p) => {
    if (cat && p.cat !== cat) return false;
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.pack.toLowerCase().includes(q) ||
      (CATEGORY_LABELS[p.cat] || "").toLowerCase().includes(q)
    );
  });
}

function renderTable() {
  const rows = filteredProducts();
  productCountEl.textContent = `${rows.length} product${rows.length !== 1 ? "s" : ""}`;
  lastUpdatedEl.textContent = updatedAt
    ? `Last saved: ${new Date(updatedAt).toLocaleString("en-IN")}`
    : "";

  productsBody.innerHTML = "";
  rows.forEach((p) => {
    const tr = document.createElement("tr");
    tr.dataset.id = p.id;
    tr.innerHTML = `
      <td><img class="product-thumb" src="${p.img}" alt="" loading="lazy"></td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.pack)}</td>
      <td>${escapeHtml(CATEGORY_LABELS[p.cat] || p.cat)}</td>
      <td><input type="number" class="price-input" min="0" step="1" value="${p.price}" data-field="price"></td>
      <td>
        <div class="row-actions">
          <label class="btn btn-ghost btn-small upload-label">
            Change image
            <input type="file" accept="image/*" data-upload="${p.id}">
          </label>
        </div>
      </td>`;

    tr.querySelector('[data-field="price"]').addEventListener("input", (e) => {
      const prod = products.find((x) => x.id === p.id);
      if (prod) {
        prod.price = Number(e.target.value);
        setDirty(true);
      }
    });

    tr.querySelector("[data-upload]").addEventListener("change", (e) => uploadImage(p.id, e.target));
    productsBody.appendChild(tr);
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
    showStatus("Uploading image…", "ok");

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
        renderTable();
        showStatus("Image uploaded. Click Save changes to publish.", "ok");
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
  showStatus("Saving…", "ok");

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
    renderTable();
    showStatus("All changes saved! The website will show updated prices.", "ok");
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
    loginError.textContent = "Wrong password. Please try again.";
    loginError.hidden = false;
    return;
  }

  loginScreen.hidden = true;
  adminScreen.hidden = false;
  await loadProducts();
});

logoutBtn.addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" });
  adminScreen.hidden = true;
  loginScreen.hidden = false;
  document.getElementById("password").value = "";
});

saveAllBtn.addEventListener("click", saveAll);
searchInput.addEventListener("input", renderTable);
categoryFilter.addEventListener("change", renderTable);

window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});

checkSession();

/* L&D Nuts, Dryfruits & Spices - page behaviour
   Vanta fog background, nav search, product carousel, cart + WhatsApp ordering.

   OWNER SETUP:
   1. WHATSAPP_NUMBER: put the shop number with country code, digits only,
      e.g. "919876543210". Empty string still works: WhatsApp opens and asks
      the customer to pick the recipient.
   2. REVIEWS: paste real Google reviews as {text, name, rating} objects.
      The section stays hidden while this list is empty. */

const WHATSAPP_NUMBER = "919551922777";

/* Real Google reviews (L&D SPICES, 4.7 stars, 16 reviews) */
const REVIEWS = [
  { text: "Good quality Dry fruits and Nuts available at nominal rates", name: "Vijaian Vijay, Local Guide", rating: 5 },
  { text: "Good Quality Nuts and Dry fruits with reasonable price. Home delivery also available.", name: "Pavithra Elango", rating: 5 },
  { text: "All products r very good quality & neatly packed", name: "Sidhu Rithu", rating: 5 },
  { text: "Very good quality spices. Quality of nuts is very good", name: "Chitra Leka", rating: 5 },
  { text: "Giving priority to quality", name: "Murali RSM", rating: 5 },
  { text: "Good quality", name: "madhukeshwar talwar, Local Guide", rating: 5 }
];

async function initSite() {
await loadProducts();

gsap.registerPlugin(ScrollTrigger);

document.getElementById("year").textContent = new Date().getFullYear();

const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const rupees = n => "₹" + n.toLocaleString("en-IN");

/* ---------- vanta fog background (hero) ---------- */

if (motionOK && window.VANTA && window.VANTA.FOG) {
  VANTA.FOG({
    el: "#vanta-bg",
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200,
    minWidth: 200,
    highlightColor: 0xd9a441,
    midtoneColor: 0x14523f,
    lowlightColor: 0x0e3a2c,
    baseColor: 0x06201a,
    blurFactor: 0.55,
    speed: 1.1,
    zoom: 0.8
  });
}

/* ---------- catalogue helpers ---------- */

const CAT_ORDER = ["nuts", "dryfruits", "spices", "seeds", "oils", "naturals", "podi", "gifts"];
const keyOf = p => p.name + "|" + p.pack;
const findProduct = key => PRODUCTS.find(p => keyOf(p) === key);

/* ---------- cart ---------- */

let cart = {};
try { cart = JSON.parse(localStorage.getItem("ldcart") || "{}"); } catch { cart = {}; }

const cartFab = document.getElementById("cart-fab");
const cartDrawer = document.getElementById("cart-drawer");
const cartScrim = document.getElementById("cart-scrim");
const cartItemsEl = document.getElementById("cart-items");
const cartCountEl = document.getElementById("cart-count");
const cartSubtotalEl = document.getElementById("cart-subtotal");
const orderWaEl = document.getElementById("order-wa");

function saveCart() { localStorage.setItem("ldcart", JSON.stringify(cart)); }

function cartCount() { return Object.values(cart).reduce((s, q) => s + q, 0); }

function cartSubtotal() {
  return Object.entries(cart).reduce((s, [key, qty]) => {
    const p = findProduct(key);
    return p ? s + p.price * qty : s;
  }, 0);
}

function addToCart(key) {
  cart[key] = (cart[key] || 0) + 1;
  saveCart();
  refreshCartUI();
  if (motionOK) {
    gsap.fromTo(cartFab, { scale: 1.12 }, { scale: 1, duration: 0.35, ease: "back.out(2)" });
  }
}

function setQty(key, qty) {
  if (qty <= 0) delete cart[key];
  else cart[key] = qty;
  saveCart();
  refreshCartUI();
}

function buildOrderMessage() {
  const lines = ["Hello L&D Spices! I would like to order:", ""];
  Object.entries(cart).forEach(([key, qty]) => {
    const p = findProduct(key);
    if (!p) return;
    lines.push(`- ${p.name} (${p.pack}) x ${qty} = ${rupees(p.price * qty)}`);
  });
  lines.push("", `Subtotal: ${rupees(cartSubtotal())}`, "", "Name:", "Delivery address / pickup:");
  return lines.join("\n");
}

function refreshCartUI() {
  const n = cartCount();
  cartCountEl.textContent = n;
  cartFab.hidden = n === 0;
  if (n === 0 && !cartDrawer.hidden) closeCart();

  cartItemsEl.innerHTML = "";
  if (n === 0) {
    cartItemsEl.innerHTML = `<p class="cart-empty">Your cart is empty. Add something tasty from the shelves.</p>`;
  } else {
    Object.entries(cart).forEach(([key, qty]) => {
      const p = findProduct(key);
      if (!p) return;
      const row = document.createElement("div");
      row.className = "cart-row";
      row.innerHTML =
        `<img src="${p.img}" alt="" width="44" height="44" loading="lazy">` +
        `<div class="cart-row-info"><span class="cart-row-name">${p.name}</span><span class="cart-row-pack">${p.pack} · ${rupees(p.price)}</span></div>` +
        `<div class="cart-qty"><button aria-label="Reduce quantity">&minus;</button><span>${qty}</span><button aria-label="Increase quantity">+</button></div>` +
        `<strong class="cart-row-total">${rupees(p.price * qty)}</strong>`;
      const [minus, plus] = row.querySelectorAll(".cart-qty button");
      minus.addEventListener("click", () => setQty(key, qty - 1));
      plus.addEventListener("click", () => setQty(key, qty + 1));
      cartItemsEl.appendChild(row);
    });
  }

  cartSubtotalEl.textContent = rupees(cartSubtotal());
  const msg = encodeURIComponent(buildOrderMessage());
  orderWaEl.href = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`
    : `https://wa.me/?text=${msg}`;
}

function openCart() {
  cartDrawer.hidden = false;
  cartScrim.hidden = false;
  if (motionOK) {
    gsap.fromTo(cartDrawer, { xPercent: 100 }, { xPercent: 0, duration: 0.45, ease: "power3.out" });
    gsap.fromTo(cartScrim, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });
  }
}

function closeCart() {
  if (motionOK) {
    gsap.to(cartDrawer, { xPercent: 100, duration: 0.32, ease: "power2.in", onComplete: () => { cartDrawer.hidden = true; gsap.set(cartDrawer, { xPercent: 0 }); } });
    gsap.to(cartScrim, { autoAlpha: 0, duration: 0.25, onComplete: () => { cartScrim.hidden = true; } });
  } else {
    cartDrawer.hidden = true;
    cartScrim.hidden = true;
  }
}

cartFab.addEventListener("click", openCart);
document.getElementById("cart-close").addEventListener("click", closeCart);
cartScrim.addEventListener("click", closeCart);
document.addEventListener("keydown", e => { if (e.key === "Escape" && !cartDrawer.hidden) closeCart(); });

function addButton(key, label) {
  const b = document.createElement("button");
  b.className = "add-btn";
  b.type = "button";
  b.textContent = label || "Add to cart";
  b.addEventListener("click", () => {
    addToCart(key);
    b.textContent = "Added";
    setTimeout(() => { b.textContent = label || "Add to cart"; }, 900);
  });
  return b;
}

/* ---------- nav search: matching products appear in a panel ---------- */

const navSearch = document.getElementById("nav-search");
const searchPanel = document.getElementById("search-panel");
const searchResults = document.getElementById("search-results");
const searchHead = document.getElementById("search-panel-head");

function renderSearch() {
  const q = navSearch.value.trim().toLowerCase();
  if (!q) { searchPanel.hidden = true; return; }

  const matches = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.pack.toLowerCase().includes(q) ||
    CATEGORY_LABELS[p.cat].toLowerCase().includes(q)
  );

  searchPanel.hidden = false;
  searchResults.innerHTML = "";

  if (!matches.length) {
    searchHead.textContent = `Nothing matches "${navSearch.value.trim()}". Try a shorter word.`;
    return;
  }
  searchHead.textContent = `${matches.length} product${matches.length > 1 ? "s" : ""} found`;

  matches.forEach(p => {
    const card = document.createElement("article");
    card.className = "search-card";
    card.innerHTML =
      `<img src="${p.img}" alt="" width="72" height="72" loading="lazy">` +
      `<div class="search-card-info"><h4>${p.name}</h4><p>${CATEGORY_LABELS[p.cat]} · ${p.pack}</p><strong>${rupees(p.price)}</strong></div>`;
    card.appendChild(addButton(keyOf(p), "Add"));
    searchResults.appendChild(card);
  });
}

navSearch.addEventListener("input", renderSearch);
navSearch.addEventListener("focus", renderSearch);
document.addEventListener("keydown", e => { if (e.key === "Escape") { searchPanel.hidden = true; navSearch.blur(); } });
document.addEventListener("click", e => {
  if (!searchPanel.hidden && !searchPanel.contains(e.target) && !e.target.closest(".nav-search")) searchPanel.hidden = true;
});

/* ---------- shelves: manual navigation with (< >) controls ---------- */

function buildGifts() {
  const grid = document.querySelector(".gifts-grid");
  if (!grid) return;
  const gifts = PRODUCTS.filter((p) => p.cat === "gifts");
  if (!gifts.length) return;
  grid.innerHTML = "";
  gifts.forEach((p, i) => {
    const article = document.createElement("article");
    article.className = "gift reveal";
    article.innerHTML =
      `<h3>Combo ${i + 1}</h3>` +
      `<p>${p.pack.replace(/, /g, "<br>")}</p>` +
      `<strong>${rupees(p.price)}</strong>`;
    grid.appendChild(article);
  });
}

function shelfCard(p) {
  const card = document.createElement("article");
  card.className = "shelf-card";
  card.innerHTML =
    `<figure><img src="${p.img}" alt="${p.name}" width="200" height="150" loading="lazy"></figure>` +
    `<div class="shelf-card-body">` +
    `<h4>${p.name}</h4>` +
    `<p>${p.pack} · <strong>${rupees(p.price)}</strong></p>` +
    `</div>`;
  card.querySelector(".shelf-card-body").appendChild(addButton(keyOf(p), "Add to cart"));
  return card;
}

function buildShelves() {
  const wrap = document.getElementById("shelves");
  wrap.innerHTML = "";
  CAT_ORDER.forEach(cat => {
    const items = PRODUCTS.filter(p => p.cat === cat);
    if (!items.length) return;

    const shelf = document.createElement("div");
    shelf.className = "shelf reveal";

    const head = document.createElement("div");
    head.className = "shelf-head";
    head.innerHTML =
      `<div class="shelf-head-info">` +
      `<h3>${CATEGORY_LABELS[cat]}</h3>` +
      `<span>${items.length} items</span>` +
      `</div>` +
      `<div class="shelf-nav">` +
      `<button class="shelf-nav-btn shelf-prev" aria-label="Previous item">&lt;</button>` +
      `<button class="shelf-nav-btn shelf-next" aria-label="Next item">&gt;</button>` +
      `</div>`;
    shelf.appendChild(head);

    const viewport = document.createElement("div");
    viewport.className = "shelf-viewport";
    const track = document.createElement("div");
    track.className = "shelf-track";

    items.forEach(p => track.appendChild(shelfCard(p)));

    viewport.appendChild(track);
    shelf.appendChild(viewport);
    wrap.appendChild(shelf);

    const prevBtn = head.querySelector(".shelf-prev");
    const nextBtn = head.querySelector(".shelf-next");

    prevBtn.addEventListener("click", () => {
      viewport.scrollBy({ left: -220, behavior: "smooth" });
    });
    nextBtn.addEventListener("click", () => {
      viewport.scrollBy({ left: 220, behavior: "smooth" });
    });
  });

  ScrollTrigger.refresh();
}

buildShelves();
buildGifts();

/* ---------- reviews (real ones only; hidden while empty) ---------- */

if (REVIEWS.length) {
  const sec = document.getElementById("reviews");
  const grid = document.getElementById("reviews-grid");
  sec.hidden = false;
  REVIEWS.forEach(r => {
    const card = document.createElement("figure");
    card.className = "review reveal";
    const stars = "★".repeat(Math.max(1, Math.min(5, r.rating || 5)));
    card.innerHTML =
      `<p class="review-stars" aria-label="${r.rating || 5} out of 5 stars">${stars}</p>` +
      `<blockquote>"${r.text}"</blockquote>` +
      `<figcaption>- ${r.name}</figcaption>`;
    grid.appendChild(card);
  });
}

refreshCartUI();

/* ---------- motion ---------- */

const mm = gsap.matchMedia();

mm.add(
  {
    motion: "(prefers-reduced-motion: no-preference)",
    desktop: "(min-width: 900px)"
  },
  (context) => {
    const { motion, desktop } = context.conditions;
    if (!motion) {
      gsap.set(".reveal, .hero-title .line > span, .hero-sub, .hero-ctas, .hero-eyebrow, .hero-visual", { clearProps: "all", opacity: 1 });
      return;
    }

    gsap.defaults({ ease: "power3.out", duration: 0.9 });

    /* hero load sequence */
    const load = gsap.timeline();
    load
      .from(".nav", { yPercent: -100, duration: 0.7, ease: "power2.out" })
      .from(".hero-eyebrow", { autoAlpha: 0, y: 18 }, "-=0.25")
      .from(".hero-title .line > span", { yPercent: 110, duration: 1.1, stagger: 0.12, ease: "power4.out" }, "-=0.55")
      .from(".hero-sub", { autoAlpha: 0, y: 24 }, "-=0.6")
      .from(".hero-ctas .btn", { autoAlpha: 0, y: 20, stagger: 0.08 }, "-=0.55")
      .from(".hero-arch", { autoAlpha: 0, y: 60, scale: 0.94, duration: 1.2, ease: "power3.out" }, "-=1.0")
      .from(".hero-chip", { autoAlpha: 0, scale: 0.4, stagger: 0.1, ease: "back.out(1.7)" }, "-=0.7");

    /* hero parallax */
    gsap.to(".chip-1", { y: -70, scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } });
    gsap.to(".chip-2", { y: -110, scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } });
    gsap.to(".chip-3", { y: -45, scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 } });
    gsap.to(".hero-arch img", { yPercent: 8, scale: 1.05, scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    /* ticker ribbons */
    gsap.to(".ribbon-gold .ribbon-track", { xPercent: -50, duration: 26, ease: "none", repeat: -1 });
    gsap.fromTo(".ribbon-green .ribbon-track", { xPercent: -50 }, { xPercent: 0, duration: 32, ease: "none", repeat: -1 });

    /* hero floaters */
    gsap.utils.toArray(".floater").forEach((el, i) => {
      gsap.to(el, {
        y: gsap.utils.random(-26, 26),
        x: gsap.utils.random(-14, 14),
        rotation: gsap.utils.random(-12, 12),
        duration: gsap.utils.random(5, 9),
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });
      gsap.to(el, {
        yPercent: -60 - i * 18,
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1.2 }
      });
    });

    /* generic reveals */
    ScrollTrigger.batch(".reveal", {
      start: "top 85%",
      once: true,
      onEnter: (els) => gsap.fromTo(els,
        { autoAlpha: 0, y: 36 },
        { autoAlpha: 1, y: 0, stagger: 0.09, duration: 0.9, ease: "power3.out", overwrite: true }
      )
    });

    /* story parallax */
    gsap.to(".img-a img", { yPercent: -6, scrollTrigger: { trigger: ".story-media", start: "top bottom", end: "bottom top", scrub: 1 } });
    gsap.to(".img-b img", { yPercent: 6, scrollTrigger: { trigger: ".story-media", start: "top bottom", end: "bottom top", scrub: 1 } });

    /* counters */
    gsap.utils.toArray(".count").forEach(el => {
      const target = +el.dataset.count;
      const obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: "power2.out",
          onUpdate: () => { el.textContent = Math.round(obj.v); }
        })
      });
    });

    /* the collection walk: pinned horizontal shelf (desktop only) */
    if (desktop) {
      const track = document.querySelector(".route-track");
      const pin = document.querySelector(".route-pin");
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: ".route",
          start: "top top",
          end: () => "+=" + distance(),
          pin: pin,
          scrub: 1,
          invalidateOnRefresh: true
        }
      });
    }

    return () => {};
  }
);
}

initSite();

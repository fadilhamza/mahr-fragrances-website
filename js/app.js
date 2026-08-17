/* ============================================================
   MAHR FRAGRANCES — Shared App Logic
   ============================================================ */

const MAHR = (() => {

  const COLORWAYS = {
    arabic: { bottle: "#171310", cap: "#0E0B08", label: "#0E0B08", labelText: "#C9A45C", liquid: "#8A6A2E" },
    him:    { bottle: "#E9EEF2", cap: "#0E0B08", label: "#0F2A3D", labelText: "#E7D29A", liquid: "#274257" },
    her:    { bottle: "#F6E6E1", cap: "#0E0B08", label: "#F8F6F0", labelText: "#0F2A3D", liquid: "#D89C90" },
    unisex: { bottle: "#EEEEE9", cap: "#0E0B08", label: "#16342B", labelText: "#E7D29A", liquid: "#3E5A4C" },
    gift:   { bottle: "#F3EAD8", cap: "#0E0B08", label: "#B99A5B", labelText: "#FFFFFF", liquid: "#C9A45C" }
  };

  /* Renders a stylised MAHR bottle as inline SVG, colored per collection identity */
  function bottleSVG(colorway = "him", name = "MAHR", sub = "EAU DE PARFUM") {
    const c = COLORWAYS[colorway] || COLORWAYS.him;
    const words = name.split(" ");
    const line1 = words.slice(0, Math.ceil(words.length / 2)).join(" ");
    const line2 = words.slice(Math.ceil(words.length / 2)).join(" ");
    return `
    <svg viewBox="0 0 220 360" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="110" cy="345" rx="58" ry="9" fill="#000" opacity="0.08"/>
      <rect x="52" y="120" width="116" height="190" rx="6" fill="${c.bottle}" stroke="#00000014" stroke-width="1"/>
      <rect x="52" y="120" width="116" height="190" rx="6" fill="url(#glossGrad)" opacity="0.5"/>
      <rect x="60" y="150" width="100" height="120" fill="${c.liquid}" opacity="0.16"/>
      <rect x="70" y="176" width="80" height="92" rx="2" fill="${c.label}"/>
      <rect x="70" y="176" width="80" height="92" rx="2" fill="none" stroke="${c.labelText}" stroke-opacity="0.5" stroke-width="0.75"/>
      <text x="110" y="200" text-anchor="middle" font-family="Playfair Display, serif" font-size="10.5" font-weight="700" fill="${c.labelText}" letter-spacing="1.5">MAHR</text>
      <line x1="88" y1="208" x2="132" y2="208" stroke="${c.labelText}" stroke-width="0.5" opacity="0.6"/>
      <text x="110" y="228" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="9.5" font-weight="600" fill="${c.labelText}" letter-spacing="0.5">${escapeXml(line1)}</text>
      <text x="110" y="240" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="9.5" font-weight="600" fill="${c.labelText}" letter-spacing="0.5">${escapeXml(line2)}</text>
      <text x="110" y="256" text-anchor="middle" font-family="Inter, sans-serif" font-size="5" fill="${c.labelText}" opacity="0.75" letter-spacing="1">${escapeXml(sub)}</text>
      <rect x="52" y="120" width="10" height="190" fill="#fff" opacity="0.18"/>
      <rect x="86" y="96" width="48" height="26" rx="3" fill="${c.bottle}" stroke="#00000014"/>
      <rect x="94" y="70" width="32" height="30" rx="2" fill="${c.bottle}"/>
      <circle cx="110" cy="52" r="30" fill="${c.cap}"/>
      <circle cx="99" cy="42" r="7" fill="#ffffff" opacity="0.15"/>
      <defs>
        <linearGradient id="glossGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
          <stop offset="35%" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.08"/>
        </linearGradient>
      </defs>
    </svg>`;
  }

  function escapeXml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function money(n) {
    return "₹" + Number(n).toLocaleString("en-IN");
  }

  function starString(rating) {
    const full = Math.round(rating);
    return "★".repeat(full) + "☆".repeat(5 - full);
  }

  function getProduct(id) {
    return MAHR_PRODUCTS.find(p => p.id === id);
  }

  /* ---------------- Cart (localStorage) ---------------- */

  const CART_KEY = "mahr_cart_v1";

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  }

  function addToCart(productId, size, qty = 1) {
    const cart = getCart();
    const existing = cart.find(i => i.productId === productId && i.size === size);
    if (existing) existing.qty += qty;
    else cart.push({ productId, size, qty });
    saveCart(cart);
    renderCartDrawer();
    openCartDrawer();
    showToast("Added to bag");
  }

  function removeFromCart(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCartDrawer();
  }

  function updateQty(index, qty) {
    const cart = getCart();
    if (qty <= 0) { cart.splice(index, 1); }
    else { cart[index].qty = qty; }
    saveCart(cart);
    renderCartDrawer();
  }

  function cartTotal() {
    return getCart().reduce((sum, item) => {
      const p = getProduct(item.productId);
      if (!p) return sum;
      return sum + (p.price[item.size] || 0) * item.qty;
    }, 0);
  }

  function cartCount() {
    return getCart().reduce((sum, i) => sum + i.qty, 0);
  }

  function updateCartCount() {
    document.querySelectorAll(".cart-count").forEach(el => {
      const n = cartCount();
      el.textContent = n;
      el.style.display = n > 0 ? "flex" : "none";
    });
  }

  function showToast(msg) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.innerHTML = `<span class="gold-dot"></span><span class="toast-msg"></span>`;
      document.body.appendChild(toast);
    }
    toast.querySelector(".toast-msg").textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  /* ---------------- Layout injection ---------------- */

  function renderHeader(activePage = "") {
    const el = document.getElementById("site-header");
    if (!el) return;
    el.innerHTML = `
      <div class="announcement-bar">Complimentary Shipping Across India &nbsp;<span>·</span>&nbsp; Crafted Premium Fragrances</div>
      <header class="site-header">
        <div class="container site-header__inner">
          <button class="icon-btn mobile-menu-btn" aria-label="Menu" onclick="MAHR.toggleMobileNav(true)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <a href="index.html" class="logo">MAHR<span>FRAGRANCES</span></a>
          <nav class="main-nav">
            <a href="index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
            <a href="shop.html" class="${activePage === 'shop' ? 'active' : ''}">Shop</a>
            <a href="shop.html?collection=for-him" class="${activePage === 'him' ? 'active' : ''}">For Him</a>
            <a href="shop.html?collection=for-her" class="${activePage === 'her' ? 'active' : ''}">For Her</a>
            <a href="shop.html?collection=arabic-luxury" class="${activePage === 'arabic' ? 'active' : ''}">Arabic Luxury</a>
            <a href="about.html" class="${activePage === 'about' ? 'active' : ''}">About</a>
          </nav>
          <div class="header-actions">
            <button class="icon-btn" aria-label="Search" onclick="MAHR.toggleSearch(true)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            <a href="account.html" class="icon-btn" aria-label="Account">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
            </a>
            <button class="icon-btn" aria-label="Cart" onclick="MAHR.openCartDrawer()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg>
              <span class="cart-count" style="display:none">0</span>
            </button>
          </div>
        </div>
      </header>

      <div class="mobile-nav" id="mobile-nav">
        <div class="mobile-nav__top">
          <span class="logo" style="color:#fff">MAHR</span>
          <button class="icon-btn" style="color:#fff" onclick="MAHR.toggleMobileNav(false)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <nav>
          <a href="index.html">Home</a>
          <a href="shop.html">Shop All</a>
          <a href="shop.html?collection=for-him">For Him</a>
          <a href="shop.html?collection=for-her">For Her</a>
          <a href="shop.html?collection=unisex">Unisex</a>
          <a href="shop.html?collection=arabic-luxury">Arabic Luxury</a>
          <a href="shop.html?collection=gifts">Gifts</a>
          <a href="about.html">About Mahr</a>
          <a href="finder.html">Fragrance Finder</a>
        </nav>
      </div>

      <div class="search-overlay" id="search-overlay">
        <button class="search-overlay__close" onclick="MAHR.toggleSearch(false)">
          CLOSE
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="search-overlay__box">
          <input type="text" id="search-input" placeholder="Search fragrances, notes, collections..." autocomplete="off" oninput="MAHR.handleSearch(this.value)">
          <div class="search-overlay__trending" id="search-trending">
            <span>Trending</span>
            <button class="search-chip" onclick="MAHR.searchAndGo('Oud')">Oud</button>
            <button class="search-chip" onclick="MAHR.searchAndGo('Fresh')">Fresh</button>
            <button class="search-chip" onclick="MAHR.searchAndGo('Vanilla')">Vanilla</button>
            <button class="search-chip" onclick="MAHR.searchAndGo('Woody')">Woody</button>
          </div>
          <div class="search-results" id="search-results"></div>
        </div>
      </div>
    `;
    updateCartCount();
  }

  function toggleMobileNav(open) {
    document.getElementById("mobile-nav").classList.toggle("open", open);
  }

  function toggleSearch(open) {
    document.getElementById("search-overlay").classList.toggle("open", open);
    if (open) setTimeout(() => document.getElementById("search-input").focus(), 100);
    else { document.getElementById("search-input").value = ""; document.getElementById("search-results").innerHTML = ""; document.getElementById("search-trending").style.display = "flex"; }
  }

  function handleSearch(q) {
    const resultsEl = document.getElementById("search-results");
    const trendEl = document.getElementById("search-trending");
    if (!q) { resultsEl.innerHTML = ""; trendEl.style.display = "flex"; return; }
    trendEl.style.display = "none";
    const query = q.toLowerCase();
    const results = MAHR_PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.familyLabel.toLowerCase().includes(query) ||
      [...p.notes.top, ...p.notes.middle, ...p.notes.base].some(n => n.toLowerCase().includes(query)) ||
      p.occasion.some(o => o.toLowerCase().includes(query))
    ).slice(0, 6);
    resultsEl.innerHTML = results.length
      ? results.map(p => `<a class="search-result-item" href="product.html?id=${p.id}"><span>${p.name}</span><span>${p.familyLabel}</span></a>`).join("")
      : `<div style="color:rgba(255,255,255,0.5);padding:20px 0;">No fragrances found for "${escapeXml(q)}"</div>`;
  }

  function searchAndGo(term) {
    document.getElementById("search-input").value = term;
    handleSearch(term);
  }

  function renderFooter() {
    const el = document.getElementById("site-footer");
    if (!el) return;
    el.innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <a href="index.html" class="logo">MAHR<span>FRAGRANCES</span></a>
              <p>Premium fragrance experiences that connect people with emotions, memories, and moments. Crafted for India, inspired by the world.</p>
            </div>
            <div class="footer-col">
              <h4>Shop</h4>
              <ul>
                <li><a href="shop.html">All Fragrances</a></li>
                <li><a href="shop.html?collection=for-him">For Him</a></li>
                <li><a href="shop.html?collection=for-her">For Her</a></li>
                <li><a href="shop.html?collection=unisex">Unisex</a></li>
                <li><a href="shop.html?collection=gifts">Gift Sets</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4>Support</h4>
              <ul>
                <li><a href="contact.html">Contact Us</a></li>
                <li><a href="shipping.html">Shipping &amp; Returns</a></li>
                <li><a href="faq.html">FAQ</a></li>
                <li><a href="track-order.html">Track Order</a></li>
              </ul>
            </div>
            <div class="footer-col footer-newsletter">
              <h4>Join The Mahr Circle</h4>
              <p style="font-size:14px;color:rgba(255,255,255,0.55)">Discover new fragrances, stories, and exclusive launches.</p>
              <form onsubmit="event.preventDefault(); MAHR.showToast('Welcome to the Mahr Circle'); this.reset();">
                <input type="email" placeholder="Email address" required>
                <button type="submit">Join</button>
              </form>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© 2026 Mahr Fragrances. All rights reserved. (Mock preview site)</span>
            <div class="footer-social">
              <a href="#">Instagram</a>
              <a href="#">Facebook</a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  /* ---------------- Cart Drawer ---------------- */

  function ensureCartDrawer() {
    if (document.getElementById("cart-drawer")) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="cart-overlay" id="cart-overlay" onclick="MAHR.closeCartDrawer()"></div>
      <aside class="cart-drawer" id="cart-drawer">
        <div class="cart-drawer__head">
          <h3>Your Bag</h3>
          <button class="icon-btn" onclick="MAHR.closeCartDrawer()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="cart-drawer__items" id="cart-items"></div>
        <div class="cart-drawer__footer" id="cart-footer"></div>
      </aside>
    `;
    document.body.appendChild(wrap);
  }

  function renderCartDrawer() {
    ensureCartDrawer();
    const cart = getCart();
    const itemsEl = document.getElementById("cart-items");
    const footEl = document.getElementById("cart-footer");

    if (!cart.length) {
      itemsEl.innerHTML = `<div class="cart-empty">
        <p>Your bag is empty.</p>
        <a href="shop.html" class="btn btn-secondary mt-l">Shop Fragrances</a>
      </div>`;
      footEl.innerHTML = "";
      return;
    }

    itemsEl.innerHTML = cart.map((item, idx) => {
      const p = getProduct(item.productId);
      if (!p) return "";
      const c = COLORWAYS[p.colorway] || COLORWAYS.him;
      return `
      <div class="cart-item">
        <div class="cart-item__img" style="background:linear-gradient(155deg, ${c.bottle}22, #EFEBE022)">${bottleSVG(p.colorway, p.name)}</div>
        <div class="cart-item__info">
          <div class="flex-between">
            <a href="product.html?id=${p.id}" class="cart-item__name">${p.name}</a>
            <button class="cart-item__remove" onclick="MAHR.removeFromCart(${idx})">&times;</button>
          </div>
          <div class="small-text" style="color:var(--grey)">${item.size} · ${p.familyLabel}</div>
          <div class="flex-between mt-l" style="margin-top:12px">
            <div class="qty-stepper">
              <button onclick="MAHR.updateQty(${idx}, ${item.qty - 1})">−</button>
              <span>${item.qty}</span>
              <button onclick="MAHR.updateQty(${idx}, ${item.qty + 1})">+</button>
            </div>
            <span class="cart-item__price">${money((p.price[item.size] || 0) * item.qty)}</span>
          </div>
        </div>
      </div>`;
    }).join("");

    const total = cartTotal();
    footEl.innerHTML = `
      <div class="cart-shipping-msg">${total >= 1499 ? "✓ You've unlocked complimentary shipping" : `Add ${money(1499 - total)} more for free shipping`}</div>
      <div class="flex-between cart-total-row">
        <span>Subtotal</span>
        <span>${money(total)}</span>
      </div>
      <button class="btn btn-primary btn-block" onclick="MAHR.showToast('This is a mock store — checkout is not connected yet')">Checkout</button>
      <p class="small-text" style="text-align:center;color:var(--grey);margin-top:12px">Shipping &amp; taxes calculated at checkout</p>
    `;
  }

  function openCartDrawer() {
    ensureCartDrawer();
    renderCartDrawer();
    document.getElementById("cart-drawer").classList.add("open");
    document.getElementById("cart-overlay").classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeCartDrawer() {
    const d = document.getElementById("cart-drawer");
    const o = document.getElementById("cart-overlay");
    if (d) d.classList.remove("open");
    if (o) o.classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ---------------- Scroll reveal ---------------- */

  function initReveal() {
    const items = document.querySelectorAll(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) { items.forEach(i => i.classList.add("in")); return; }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); } });
    }, { threshold: 0.01, rootMargin: "0px 0px 200px 0px" });
    items.forEach(i => obs.observe(i));
    // Safety net: guarantee visibility even if the observer misses an element
    // (e.g. content injected after layout, or a very fast full-page capture).
    clearTimeout(window.__mahrRevealSafety);
    window.__mahrRevealSafety = setTimeout(() => {
      document.querySelectorAll(".reveal:not(.in)").forEach(el => el.classList.add("in"));
    }, 900);
  }

  /* ---------------- Product card ---------------- */

  function productCardHTML(p) {
    const badge = p.badges && p.badges.length ? `<span class="badge ${p.badges[0] === 'Signature' ? 'gold' : ''}">${p.badges[0]}</span>` : "";
    const minPrice = Math.min(...Object.values(p.price));
    return `
    <a href="product.html?id=${p.id}" class="product-card reveal">
      <div class="product-card__img bottle-art">
        ${badge ? `<div class="product-card__badge">${badge}</div>` : ""}
        <button class="wishlist-btn" onclick="event.preventDefault(); MAHR.showToast('Saved to wishlist')" aria-label="Wishlist">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21s-7-4.35-9.5-8.8C.8 8.7 2.4 5 6 5c2 0 3.5 1.2 4 2.2C10.5 6.2 12 5 14 5c3.6 0 5.2 3.7 3.5 7.2C19 16.65 12 21 12 21z"/></svg>
        </button>
        ${bottleSVG(p.colorway, p.name)}
        <button class="quick-add" onclick="event.preventDefault(); MAHR.quickAdd('${p.id}')">Quick Add</button>
      </div>
      <div class="product-card__info">
        <div class="product-card__family">${p.familyLabel}</div>
        <h4>${p.name}</h4>
        <div class="rating"><span class="stars">${starString(p.rating)}</span><span class="count">(${p.reviewCount})</span></div>
        <div class="product-card__price">From ${money(minPrice)}</div>
      </div>
    </a>`;
  }

  function quickAdd(id) {
    const p = getProduct(id);
    if (!p) return;
    const firstSize = Object.keys(p.price)[0];
    addToCart(id, firstSize, 1);
  }

  /* ---------------- Init ---------------- */

  function initLayout(activePage) {
    renderHeader(activePage);
    renderFooter();
    ensureCartDrawer();
    renderCartDrawer();
    updateCartCount();
    setTimeout(initReveal, 50);
  }

  return {
    bottleSVG, money, starString, getProduct,
    getCart, addToCart, removeFromCart, updateQty, cartTotal, cartCount,
    openCartDrawer, closeCartDrawer, renderCartDrawer,
    toggleMobileNav, toggleSearch, handleSearch, searchAndGo,
    productCardHTML, quickAdd, showToast, initLayout, initReveal,
    COLORWAYS
  };
})();

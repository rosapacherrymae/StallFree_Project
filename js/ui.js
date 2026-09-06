/* =====================================================================
   StallFree shared UI — injects the navbar + footer, renders cards,
   and keeps the cart badge in sync site-wide.
   ===================================================================== */

const NAV_LINKS = [
  { page: 'home', label: 'Home', href: 'index.html' },
  { page: 'products', label: 'Products', href: 'products.html' },
  { page: 'categories', label: 'Categories', href: 'categories.html' },
  { page: 'sellers', label: 'Sellers', href: 'sellers.html' },
  { page: 'orders', label: 'Your Order', href: 'orders.html' },
  { page: 'profile', label: 'Profile', href: 'profile.html' }
];

const CART_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';

function formatPrice(value) {
  return '\u20B1' + value.toLocaleString();
}

function sanitize(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderNav(activePage) {
  const links = NAV_LINKS.map(
    (l) =>
      `<li><a href="${l.href}" class="${l.page === activePage ? 'active' : ''}">${l.label}</a></li>`
  ).join('');

  return `
    <div class="container nav-inner">
      <a href="index.html" class="logo">
        <span class="logo-badge">S</span>
        Stall<span style="color:var(--primary)">Free</span>
      </a>
      <ul class="nav-links">
        ${links}
      </ul>
      <a href="orders.html" class="cart-link" id="nav-cart" title="Your Order">
        <span class="btn btn-outline">${CART_ICON} Cart <span class="cart-badge hidden" id="cart-badge">0</span></span>
      </a>
    </div>`;
}

function renderFooter() {
  return `
    <div class="container footer-inner">
      <span>&copy; ${new Date().getFullYear()} StallFree. Made with HTML, CSS &amp; JS.</span>
      <span>All data stays in your browser (localStorage).</span>
    </div>`;
}

function initSharedUI(activePage) {
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  if (header) header.innerHTML = renderNav(activePage);
  if (footer) footer.innerHTML = renderFooter();
  refreshCartBadge();
}

function refreshCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const count = typeof getCartCount === 'function' ? getCartCount() : 0;
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);
}

/* ================= Cards ================= */

function productImage(p) {
  return `
    <span>${sanitize(p.name.charAt(0))}</span>
    ${p.image ? `<img src="${p.image}" alt="${sanitize(p.name)}" loading="lazy"
       onload="this.classList.add('loaded')" onerror="this.remove()">` : ''}`;
}

function productCard(p, showActions = true) {
  const cat = findCategory(p.categoryId);
  const actions = showActions
    ? `<button class="btn btn-primary btn-sm" onclick="addToCart('${p.id}')">Add to Cart</button>`
    : '';
  return `
    <article class="card product-card">
      <div class="product-img" style="background:linear-gradient(135deg, ${p.img[0]}, ${p.img[1]})">
        ${productImage(p)}
      </div>
      <div class="product-body">
        <span class="chip">${sanitize(cat.name)}</span>
        <h3 class="product-name">${sanitize(p.name)}</h3>
        <p class="product-desc">${sanitize(p.description)}</p>
        <div class="rating">&#9733; ${p.rating} <span>(${p.reviews} reviews)</span></div>
        <div class="product-foot">
          <span class="price">${formatPrice(p.price)}</span>
          ${actions}
        </div>
      </div>
    </article>`;
}

function productCardRow(p) {
  const cat = findCategory(p.categoryId);
  return `
    <article class="card product-card">
      <div class="product-img" style="background:linear-gradient(135deg, ${p.img[0]}, ${p.img[1]})">
        ${productImage(p)}
      </div>
      <div class="product-body">
        <span class="chip">${sanitize(cat.name)}</span>
        <h3 class="product-name">${sanitize(p.name)}</h3>
        <p class="product-desc">${sanitize(p.description)}</p>
        <div class="rating">&#9733; ${p.rating} <span>(${p.reviews} reviews)</span></div>
        <div class="product-foot">
          <span class="price">${formatPrice(p.price)}</span>
          <button class="btn btn-primary btn-sm" onclick="addToCart('${p.id}')">Add to Cart</button>
        </div>
      </div>
    </article>`;
}

function sellerCard(s) {
  const count = sellerProductCount(s.id);
  const rating = sellerRating(s.id);
  return `
    <article class="card seller-card clickable" onclick="viewSeller('${s.id}')">
      <div class="seller-avatar" style="background:linear-gradient(135deg, ${s.img[0]}, ${s.img[1]})">
        <span>${sanitize(s.storeName.charAt(0))}</span>
      </div>
      <h3>${sanitize(s.storeName)}</h3>
      <p class="muted" style="font-size:.82rem">${sanitize(s.description)}</p>
      <div class="rating">&#9733; ${rating.toFixed(1)}</div>
      <span class="chip chip-accent">${count} product${count === 1 ? '' : 's'}</span>
    </article>`;
}

function categoryCard(c) {
  const count = categoryCount(c.id);
  const sample = productsByCategory(c.id)[0];
  const colors = sample ? sample.img : ['#94a3b8', '#64748b'];
  return `
    <article class="card category-card clickable" onclick="goToCategory('${c.id}')">
      <div class="cat-icon" style="background:linear-gradient(135deg, ${colors[0]}, ${colors[1]})">
        <span>${sanitize(c.name.charAt(0))}</span>
      </div>
      <h3>${sanitize(c.name)}</h3>
      <p class="muted" style="font-size:.82rem">${count} item${count === 1 ? '' : 's'} available</p>
    </article>`;
}

function emptyState(title, message, ctaLabel, ctaHref) {
  return `
    <div class="empty-state">
      <h3>${title}</h3>
      <p>${message}</p>
      ${ctaLabel ? `<a href="${ctaHref}" class="btn btn-primary" style="margin-top:14px">${ctaLabel}</a>` : ''}
    </div>`;
}
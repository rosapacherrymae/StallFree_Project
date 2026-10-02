/* =====================================================================
   StallFree shared UI — top bar, header with live search, footer,
   cards, toast, modal, badges, and the global click router.
   Every interactive element uses data-action so markup stays clean
   (no inline handlers, no quoting bugs).
   ===================================================================== */

const NAV_LINKS = [
  { page: 'home', label: 'Home', href: 'index.html' },
  { page: 'products', label: 'Shop', href: 'products.html' },
  { page: 'categories', label: 'Categories', href: 'categories.html' },
  { page: 'sellers', label: 'Shops', href: 'sellers.html' },
  { page: 'wishlist', label: 'Saved', href: 'wishlist.html' },
  { page: 'orders', label: 'Your order', href: 'orders.html' },
  { page: 'profile', label: 'Profile', href: 'profile.html' }
];

/* ---------------- Icons (inline SVG, stroke = currentColor) ---------------- */

const ICONS = {
  search:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>',
  cart:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.4"/><circle cx="19" cy="21" r="1.4"/><path d="M2 2h3l2.6 12.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 7H6"/></svg>',
  heart:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 20.5S3.8 15.4 3.8 9.6A4.6 4.6 0 0 1 12 6.7a4.6 4.6 0 0 1 8.2 2.9c0 5.8-8.2 10.9-8.2 10.9Z"/></svg>',
  heartOutline:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 20.5S3.8 15.4 3.8 9.6A4.6 4.6 0 0 1 12 6.7a4.6 4.6 0 0 1 8.2 2.9c0 5.8-8.2 10.9-8.2 10.9Z"/></svg>',
  user:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>',
  menu:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close:
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  truck:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/></svg>',
  shield:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/><path d="m9 12 2 2 4-4"/></svg>',
  spark:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/></svg>',
  chat:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-8 8H7l-4 3 1-5.2A8 8 0 1 1 21 12z"/></svg>',
  pin:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>',
  filter:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
  chevronLeft:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 6-6 6 6 6"/></svg>',
  chevronRight:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m10 6 6 6-6 6"/></svg>',
  bag:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg>',
  arrowUp:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>'
};

/* ---------------- Helpers ---------------- */

function formatPrice(value) {
  return '\u20B1' + Number(value || 0).toLocaleString();
}

function sanitize(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function plural(count, one, many) {
  return count === 1 ? one : many || one + 's';
}

function categoryColors(categoryId) {
  const cat = findCategory(categoryId);
  return cat && cat.colors ? cat.colors : ['#94a3b8', '#64748b'];
}

function gradient(colors) {
  return `background:linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
}

function starRow(rating) {
  const pct = Math.max(0, Math.min(100, (Number(rating) || 0) * 20));
  return `<span class="stars" aria-hidden="true"><span class="stars-layer">★★★★★</span><span class="stars-fill" style="width:${pct}%">★★★★★</span></span>`;
}

function ratingLine(rating, count, extraClass = '') {
  const value = (Number(rating) || 0).toFixed(1);
  return `<span class="rating ${extraClass}">${starRow(rating)}<b>${value}</b>${
    typeof count === 'number' ? `<span class="rating-count">(${count})</span>` : ''
  }</span>`;
}

function productHref(p) {
  return `products.html?id=${encodeURIComponent(p.id)}`;
}

function shopHref(s) {
  return `shop.html?id=${encodeURIComponent(s.id)}`;
}

/* A stall earns the badge from a strong average across a real catalogue. */
function isTopStall(sellerId) {
  return sellerRating(sellerId) >= 4.8 && sellerProductCount(sellerId) >= 3;
}

function topStallChip(sellerId) {
  return isTopStall(sellerId)
    ? `<span class="chip chip-top">${ICONS.spark} Top stall</span>`
    : '';
}

/* ---------------- Header ---------------- */

function renderTopbar() {
  const links = NAV_LINKS.map(
    (l) => `<a href="${l.href}" class="${l.page === currentPage ? 'active' : ''}">${l.label}</a>`
  ).join('');
  return `
    <div class="topbar">
      <div class="container topbar-inner">
        <p class="topbar-promo">${ICONS.spark} Free delivery over ${formatPrice(1000)} · code <b>WELCOME10</b> for 10% off</p>
        <nav class="topbar-links" aria-label="Quick links">${links}</nav>
      </div>
    </div>`;
}

function renderHeader(activePage) {
  const profile = getProfile();
  const initial = profile && profile.firstName ? profile.firstName.charAt(0).toUpperCase() : 'S';
  const accountLabel =
    profile && profile.firstName ? sanitize(profile.firstName) : 'Sign in';

  const catLinks = categories
    .map(
      (c) =>
        `<a href="products.html?cat=${encodeURIComponent(c.id)}" class="cat-link">${sanitize(c.name)}</a>`
    )
    .join('');

  return `
    <div class="header-main container">
      <button class="icon-btn nav-toggle" data-action="toggle-nav" aria-label="Toggle menu" aria-expanded="false">${ICONS.menu}</button>
      <a href="index.html" class="logo" aria-label="StallFree home">
        <span class="logo-badge">S</span>
        <span class="logo-text">Stall<em>Free</em></span>
      </a>

      <form class="search" id="site-search-form" role="search" autocomplete="off">
        <label class="sr-only" for="site-search">Search the marketplace</label>
        <input type="search" id="site-search" class="search-input" name="q"
          placeholder="Search gifts, bouquets, keychains…" aria-label="Search products, shops and categories"
          aria-expanded="false" aria-controls="search-suggest" role="combobox" />
        <button type="submit" class="search-btn" aria-label="Search">${ICONS.search}</button>
        <div class="suggest hidden" id="search-suggest" role="listbox" aria-label="Search suggestions"></div>
      </form>

      <div class="header-actions">
        <div class="account">
          <button class="icon-btn account-btn" data-action="toggle-account" aria-expanded="false" aria-haspopup="true">
            <span class="avatar">${initial}</span>
            <span class="account-label">${accountLabel}</span>
          </button>
          <div class="account-menu hidden" id="account-menu">
            <p class="account-menu-title">${profile && profile.firstName ? 'My StallFree' : 'Welcome to StallFree'}</p>
            ${
              profile && profile.firstName
                ? `<button class="btn btn-outline btn-block account-signout" data-action="signout">Sign out of ${sanitize(
                    profile.firstName
                  )}</button>`
                : `<button class="btn btn-primary btn-block account-signin" data-action="signin">Sign in or register</button>`
            }
            <a href="profile.html">${ICONS.user} Profile &amp; details</a>
            <a href="orders.html">${ICONS.bag} Your orders</a>
            <a href="wishlist.html">${ICONS.heart} Saved items</a>
            <a href="sellers.html">${ICONS.pin} Followed shops</a>
            <a href="help.html">${ICONS.shield} Help centre</a>
          </div>
        </div>

        <a href="wishlist.html" class="icon-btn" id="nav-wishlist" aria-label="Saved items">
          ${ICONS.heartOutline}
          <span class="badge hidden" id="wishlist-badge">0</span>
        </a>

        <a href="orders.html" class="icon-btn" id="nav-cart" aria-label="Your order">
          ${ICONS.cart}
          <span class="badge hidden" id="cart-badge">0</span>
        </a>
      </div>
    </div>

    <nav class="header-cats" aria-label="Shop by category">
      <div class="container cats-row" id="header-cats">
        <a href="products.html" class="cat-link ${activePage === 'products' ? 'active' : ''}">All products</a>
        ${catLinks}
        <a href="sellers.html" class="cat-link ${activePage === 'sellers' || activePage === 'shop' ? 'active' : ''}">Shops</a>
        <a href="help.html#sell" class="cat-link">Open a stall</a>
      </div>
    </nav>`;
}

/* ---------------- Footer ---------------- */

function renderFooter() {
  const year = new Date().getFullYear();
  return `
    <div class="container footer-grid">
      <div class="footer-brand">
        <a href="index.html" class="logo"><span class="logo-badge">S</span><span class="logo-text">Stall<em>Free</em></span></a>
        <p>Handmade gifts, souvenirs, and small-batch finds from independent stalls across the Philippines.</p>
        <form class="newsletter" id="newsletter-form" novalidate>
          <label class="sr-only" for="newsletter-email">Email address</label>
          <input type="email" id="newsletter-email" class="input" placeholder="you@email.com" />
          <button type="submit" class="btn btn-primary">Join</button>
        </form>
        <p class="muted small" id="newsletter-note">Get drop alerts and a 10% welcome code.</p>
      </div>

      <div>
        <h4>Shop</h4>
        <ul>
          <li><a href="categories.html">All categories</a></li>
          <li><a href="products.html?sort=rating">Best rated</a></li>
          <li><a href="products.html?free=1">Free delivery</a></li>
          <li><a href="wishlist.html">Saved items</a></li>
        </ul>
      </div>

      <div>
        <h4>Marketplace</h4>
        <ul>
          <li><a href="sellers.html">All shops</a></li>
          <li><a href="help.html#sell">Open a stall</a></li>
          <li><a href="help.html#delivery">Delivery info</a></li>
          <li><a href="help.html#returns">Returns</a></li>
        </ul>
      </div>

      <div>
        <h4>Account</h4>
        <ul>
          <li><a href="profile.html">Your details</a></li>
          <li><a href="orders.html">Order history</a></li>
          <li><a href="orders.html#cart">Checkout</a></li>
          <li><a href="help.html#faq">FAQ</a></li>
        </ul>
      </div>
    </div>

    <div class="container footer-bottom">
      <span>&copy; ${year} StallFree · Built with HTML, CSS &amp; JavaScript.</span>
      <span>All data stays in your browser (localStorage).</span>
    </div>`;
}

/* ---------------- Bootstrap ---------------- */

let currentPage = 'home';

function initSharedUI(activePage) {
  currentPage = activePage || 'home';

  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');

  if (header) {
    header.classList.add('site-header');
    header.innerHTML = renderHeader(currentPage);
    header.insertAdjacentHTML('beforebegin', renderTopbar());
  }
  if (footer) {
    footer.classList.add('site-footer');
    footer.innerHTML = renderFooter();
  }

  /* floating chrome */
  document.body.insertAdjacentHTML(
    'beforeend',
    `<div id="toast-root" class="toast-root" aria-live="polite" aria-atomic="true"></div>
     <div id="modal-root" class="modal-root hidden" role="dialog" aria-modal="true"></div>
     <button class="back-top" id="back-top" data-action="scroll-top" aria-label="Back to top">${ICONS.arrowUp}</button>`
  );

  refreshCartBadge();
  refreshWishlistBadge();
  bindSearch();
  bindChrome();
  bindGlobalRouter();
  measureHeader();
}

/* every sticky element offsets from --header-h, so it must match the real
   header height or pills/buy boxes tuck under the bar on some viewports */
function measureHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;
  const h = Math.round(header.getBoundingClientRect().height);
  if (h > 0) document.documentElement.style.setProperty('--header-h', h + 'px');
}

let measureTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(measureTimer);
  measureTimer = setTimeout(measureHeader, 120);
});

function bindChrome() {
  /* fill any static rail buttons with chevrons */
  document.querySelectorAll('.rail-btn').forEach((btn) => {
    if (btn.innerHTML.trim()) return;
    btn.innerHTML = btn.classList.contains('prev') ? ICONS.chevronLeft : ICONS.chevronRight;
  });

  const backTop = document.getElementById('back-top');
  window.addEventListener(
    'scroll',
    () => {
      if (!backTop) return;
      backTop.classList.toggle('visible', window.scrollY > 520);
    },
    { passive: true }
  );

  const newsletter = document.getElementById('newsletter-form');
  if (newsletter) {
    newsletter.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('newsletter-email');
      const note = document.getElementById('newsletter-note');
      const value = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        if (note) note.textContent = 'Please enter a valid email address.';
        input.focus();
        return;
      }
      input.value = '';
      if (note) note.textContent = 'Thanks! Your welcome code is on its way.';
      toast('You are on the list!', 'success');
    });
  }

  /* close popovers when clicking or pressing Escape elsewhere */
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.account')) closeAccountMenu();
    if (!e.target.closest('.search')) closeSuggest();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAccountMenu();
      closeSuggest();
      closeModal();
    }
  });
}

function closeAccountMenu() {
  const menu = document.getElementById('account-menu');
  const btn = document.querySelector('.account-btn');
  if (menu) menu.classList.add('hidden');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

function toggleAccountMenu() {
  const menu = document.getElementById('account-menu');
  const btn = document.querySelector('.account-btn');
  if (!menu) return;
  const willOpen = menu.classList.contains('hidden');
  menu.classList.toggle('hidden', !willOpen);
  if (btn) btn.setAttribute('aria-expanded', String(willOpen));
}

function toggleNav() {
  const cats = document.querySelector('.header-cats');
  const btn = document.querySelector('.nav-toggle');
  if (!cats) return;
  const open = cats.classList.toggle('open');
  if (btn) btn.setAttribute('aria-expanded', String(open));
}

/* ---------------- Badges ---------------- */

function refreshCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const count = typeof getCartCount === 'function' ? getCartCount() : 0;
  badge.textContent = count > 99 ? '99+' : String(count);
  badge.classList.toggle('hidden', count === 0);
}

function refreshWishlistBadge() {
  const badge = document.getElementById('wishlist-badge');
  if (!badge) return;
  const count = typeof getWishlistCount === 'function' ? getWishlistCount() : 0;
  badge.textContent = count > 99 ? '99+' : String(count);
  badge.classList.toggle('hidden', count === 0);
}

/* keep every heart on the page in sync with storage */
function paintFavButton(btn, wished) {
  btn.classList.toggle('is-wished', wished);
  btn.setAttribute('aria-pressed', String(wished));
  const icon = btn.querySelector('.fav-ico');
  const label = btn.querySelector('.fav-label');
  if (icon) icon.innerHTML = wished ? ICONS.heart : ICONS.heartOutline;
  else btn.innerHTML = wished ? ICONS.heart : ICONS.heartOutline;
  if (label) label.textContent = wished ? 'Saved' : label.dataset.off || 'Save for later';
  btn.setAttribute(
    'aria-label',
    (wished ? 'Remove ' : 'Save ') + (btn.dataset.name || 'item')
  );
}

function syncWishButtons(productId) {
  const wished = isWished(productId);
  document
    .querySelectorAll(`[data-action="fav"][data-id="${productId}"]`)
    .forEach((btn) => paintFavButton(btn, wished));
}

function syncAllWishButtons() {
  document.querySelectorAll('[data-action="fav"][data-id]').forEach((btn) => {
    paintFavButton(btn, isWished(btn.dataset.id));
  });
}

/* ---------------- Toast ---------------- */

function toast(message, type = 'success') {
  const root = document.getElementById('toast-root');
  if (!root) return;
  while (root.children.length >= 3) root.removeChild(root.firstElementChild);

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.setAttribute('role', 'status');
  el.innerHTML = `<span class="toast-icon">${
    type === 'error' ? ICONS.close : ICONS.check
  }</span><span>${sanitize(message)}</span>`;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 250);
  }, 2800);
}

/* ---------------- Modal ---------------- */

let lastFocused = null;

function openModal(html, options = {}) {
  const root = document.getElementById('modal-root');
  if (!root) return;
  lastFocused = document.activeElement;
  root.innerHTML = `
    <div class="modal-backdrop" data-action="close-modal"></div>
    <div class="modal ${options.size ? 'modal-' + options.size : ''}">
      <button class="modal-close" data-action="close-modal" aria-label="Close">${ICONS.close}</button>
      ${html}
    </div>`;
  root.classList.remove('hidden');
  document.body.classList.add('no-scroll');
  const focusable = root.querySelector('button, a, input, textarea, select');
  if (focusable) focusable.focus();
}

function closeModal() {
  const root = document.getElementById('modal-root');
  if (!root || root.classList.contains('hidden')) return;
  root.classList.add('hidden');
  root.innerHTML = '';
  document.body.classList.remove('no-scroll');
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  lastFocused = null;
}

function confirmDialog(title, message, confirmLabel, onConfirm) {
  openModal(`
    <div class="modal-pad">
      <h3>${sanitize(title)}</h3>
      <p class="muted" style="margin:8px 0 18px">${sanitize(message)}</p>
      <div class="modal-actions">
        <button class="btn btn-outline" data-action="close-modal">Cancel</button>
        <button class="btn btn-danger" id="confirm-yes">${sanitize(confirmLabel)}</button>
      </div>
    </div>`);
  const yes = document.getElementById('confirm-yes');
  if (yes) {
    yes.addEventListener('click', () => {
      closeModal();
      onConfirm();
    });
  }
}

/* ---------------- Cards ---------------- */

function badgeMarkup(p) {
  const labels = {
    bestseller: 'Bestseller',
    sale: p.compareAt ? `Save ${Math.round((1 - p.price / p.compareAt) * 100)}%` : 'On sale',
    new: 'New'
  };
  if (!p.badge || !labels[p.badge]) return '';
  return `<span class="pc-badge pc-badge-${p.badge}">${labels[p.badge]}</span>`;
}

function priceMarkup(p, size = '') {
  const sale = p.compareAt && p.compareAt > p.price;
  return `
    <div class="pc-price ${size}">
      <span class="price">${formatPrice(p.price)}</span>
      ${sale ? `<s class="price-was">${formatPrice(p.compareAt)}</s>` : ''}
    </div>`;
}

function productCard(p) {
  const shop = findSeller(p.sellerId);
  const cat = findCategory(p.categoryId);
  const wished = isWished(p.id);
  const colors = categoryColors(p.categoryId);

  return `
    <article class="card product-card" data-product="${p.id}">
      <div class="pc-media" style="${gradient(colors)}">
        <a class="pc-link" href="${productHref(p)}" aria-label="${sanitize(p.name)}">
          <span class="pc-letter" aria-hidden="true">${sanitize(p.name.charAt(0))}</span>
          <img src="${photoUrl(p.photo, 500)}" alt="${sanitize(p.name)}" loading="lazy"
               onload="this.classList.add('is-loaded')" onerror="this.remove()" />
        </a>
        ${badgeMarkup(p)}
        <button class="pc-fav ${wished ? 'is-wished' : ''}" data-action="fav" data-id="${p.id}"
          data-name="${sanitize(p.name)}" aria-pressed="${wished}" aria-label="Save ${sanitize(p.name)}">
          ${wished ? ICONS.heart : ICONS.heartOutline}
        </button>
        <button class="pc-quick" data-action="quick-view" data-id="${p.id}">Quick view</button>
      </div>
      <div class="pc-body">
        <div class="pc-shop">
          <a href="${shop ? shopHref(shop) : '#'}" class="pc-shop-link">${
            shop && isTopStall(shop.id) ? `<span class="pc-top" title="Top stall">★</span>` : ''
          }${sanitize(shop ? shop.storeName : 'StallFree')}</a>
          ${shop ? `<span class="pc-loc">${ICONS.pin}${sanitize(shop.location.split(',')[0])}</span>` : ''}
        </div>
        <h3 class="pc-title"><a href="${productHref(p)}">${sanitize(p.name)}</a></h3>
        <div class="pc-meta">${ratingLine(p.rating, p.reviews)}</div>
        <div class="pc-cat muted">${sanitize(cat ? cat.name : '')} · ${p.sales.toLocaleString()} sold</div>
        ${priceMarkup(p)}
        <p class="pc-ship ${p.freeShipping ? '' : 'muted'}">${
          p.freeShipping ? ICONS.truck + ' Free delivery' : 'Delivery calculated at checkout'
        }</p>
        <button class="btn btn-primary btn-sm pc-add" data-action="add-cart" data-id="${p.id}">
          ${ICONS.bag} Add to cart
        </button>
      </div>
    </article>`;
}

function compactCard(p) {
  const wished = isWished(p.id);
  const colors = categoryColors(p.categoryId);
  return `
    <article class="card product-card product-card-compact" data-product="${p.id}">
      <div class="pc-media" style="${gradient(colors)}">
        <a class="pc-link" href="${productHref(p)}" aria-label="${sanitize(p.name)}">
          <span class="pc-letter" aria-hidden="true">${sanitize(p.name.charAt(0))}</span>
          <img src="${photoUrl(p.photo, 360)}" alt="${sanitize(p.name)}" loading="lazy"
               onload="this.classList.add('is-loaded')" onerror="this.remove()" />
        </a>
        ${badgeMarkup(p)}
        <button class="pc-fav ${wished ? 'is-wished' : ''}" data-action="fav" data-id="${p.id}"
          data-name="${sanitize(p.name)}" aria-pressed="${wished}" aria-label="Save ${sanitize(p.name)}">
          ${wished ? ICONS.heart : ICONS.heartOutline}
        </button>
      </div>
      <div class="pc-body">
        <h3 class="pc-title"><a href="${productHref(p)}">${sanitize(p.name)}</a></h3>
        <div class="pc-meta">${ratingLine(p.rating, p.reviews)}</div>
        ${priceMarkup(p)}
      </div>
    </article>`;
}

function categoryTile(c) {
  const count = categoryCount(c.id);
  return `
    <a class="cat-tile" href="products.html?cat=${encodeURIComponent(c.id)}" style="${gradient(c.colors)}">
      <img src="${photoUrl(c.tile, 400)}" alt="" loading="lazy"
           onload="this.classList.add('is-loaded')" onerror="this.remove()" />
      <span class="cat-tile-veil"></span>
      <span class="cat-tile-text">
        <strong>${sanitize(c.name)}</strong>
        <small>${count} ${plural(count, 'item')} · shop now</small>
      </span>
    </a>`;
}

/* gift-occasion strip on the home page */
function occasionTile(o) {
  const count = occasionCount(o);
  return `
    <a class="occ-tile" href="products.html?q=${encodeURIComponent(o.query)}">
      <span class="occ-label">${sanitize(o.label)}</span>
      <span class="occ-hint">${sanitize(o.hint)}</span>
      <span class="occ-count">${count} ${plural(count, 'item')}</span>
    </a>`;
}

/* price band tiles — the Etsy "shop by price" row */
function priceBandTile(b) {
  const count = priceBandCount(b);
  return `
    <a class="price-tile" href="products.html?price=${encodeURIComponent(b.id)}">
      <strong>${sanitize(b.label)}</strong>
      <small>${sanitize(b.hint)}</small>
      <span class="price-tile-count">${count} ${plural(count, 'item')}</span>
    </a>`;
}

function shopCard(s) {
  const count = sellerProductCount(s.id);
  const rating = sellerRating(s.id);
  const following = isFollowing(s.id);
  return `
    <article class="card shop-card" data-shop="${s.id}">
      <div class="shop-cover" style="${gradient(s.colors)}">
        <img src="${photoUrl(s.cover, 480)}" alt="" loading="lazy"
             onload="this.classList.add('is-loaded')" onerror="this.remove()" />
      </div>
      <div class="shop-card-body">
        <div class="shop-avatar" style="${gradient(s.colors)}" aria-hidden="true">${sanitize(
          s.storeName.charAt(0)
        )}</div>
        <h3 class="shop-name"><a href="${shopHref(s)}">${sanitize(s.storeName)}</a></h3>
        <p class="muted small">${sanitize(s.tagline)}</p>
        <div class="shop-stats">
          ${ratingLine(rating, undefined)}
          ${topStallChip(s.id)}
          <span class="muted small">${count} ${plural(count, 'item')}</span>
        </div>
        <div class="shop-card-foot">
          <span class="muted small">${ICONS.pin} ${sanitize(s.location)}</span>
          <button class="btn btn-sm ${following ? 'btn-outline' : 'btn-primary'}" data-action="follow"
            data-id="${s.id}">${following ? 'Following' : 'Follow shop'}</button>
        </div>
      </div>
    </article>`;
}

function reviewCard(r) {
  return `
    <article class="card review-card">
      <div class="review-head">
        <span class="avatar avatar-sm">${sanitize(r.author.charAt(0).toUpperCase())}</span>
        <div>
          <strong>${sanitize(r.author)}</strong>
          <div class="review-meta">${ratingLine(r.rating)} <span class="muted">${sanitize(
            r.date
          )}</span></div>
        </div>
        ${r.mine ? '<span class="chip chip-accent">Your review</span>' : ''}
      </div>
      ${r.title ? `<h4 class="review-title">${sanitize(r.title)}</h4>` : ''}
      <p class="review-text">${sanitize(r.text)}</p>
    </article>`;
}

function emptyState(title, message, ctaLabel, ctaHref, ctaAction) {
  const cta = !ctaLabel
    ? ''
    : ctaAction
      ? `<button type="button" class="btn btn-primary" style="margin-top:16px" data-action="${sanitize(
          ctaAction
        )}">${sanitize(ctaLabel)}</button>`
      : `<a href="${sanitize(ctaHref)}" class="btn btn-primary" style="margin-top:16px">${sanitize(
          ctaLabel
        )}</a>`;
  return `
    <div class="empty-state">
      <div class="empty-icon" aria-hidden="true">${ICONS.search}</div>
      <h3>${sanitize(title)}</h3>
      <p>${sanitize(message)}</p>
      ${cta}
    </div>`;
}

function breadcrumb(parts) {
  const items = parts
    .map((part, i) => {
      const last = i === parts.length - 1;
      const node = last
        ? `<span aria-current="page">${sanitize(part.label)}</span>`
        : `<a href="${sanitize(part.href)}">${sanitize(part.label)}</a>`;
      return `<li>${node}</li>`;
    })
    .join('');
  return `<nav class="breadcrumb" aria-label="Breadcrumb"><ol>${items}</ol></nav>`;
}

/* ---------------- Quick view ---------------- */

function quickView(productId) {
  const p = findProduct(productId);
  if (!p) return;
  const shop = findSeller(p.sellerId);
  const cat = findCategory(p.categoryId);
  const wished = isWished(p.id);

  openModal(`
    <div class="qv">
      <div class="qv-media" style="${gradient(categoryColors(p.categoryId))}">
        <span class="pc-letter" aria-hidden="true">${sanitize(p.name.charAt(0))}</span>
        <img src="${photoUrl(p.photo, 640)}" alt="${sanitize(p.name)}"
             onload="this.classList.add('is-loaded')" onerror="this.remove()" />
      </div>
      <div class="qv-body">
        <p class="muted small">${sanitize(cat ? cat.name : '')}</p>
        <h3>${sanitize(p.name)}</h3>
        <div class="qv-meta">${ratingLine(p.rating, p.reviews)}</div>
        ${priceMarkup(p, 'price-lg')}
        <p class="muted">${sanitize(p.description)}</p>
        <p class="small">${ICONS.truck} ${
          p.freeShipping ? 'Free delivery' : 'Delivery fee at checkout'
        } · ${sanitize(p.processing)}</p>
        <div class="qv-actions">
          <button class="btn btn-primary" data-action="add-cart" data-id="${p.id}">${ICONS.bag} Add to cart</button>
          <button class="btn btn-outline pc-fav-inline ${wished ? 'is-wished' : ''}" data-action="fav"
            data-id="${p.id}" data-name="${sanitize(p.name)}" aria-pressed="${wished}"
            aria-label="Save ${sanitize(p.name)}">${wished ? ICONS.heart : ICONS.heartOutline}</button>
          <a class="btn btn-outline" href="${productHref(p)}">Full details</a>
        </div>
        ${
          shop
            ? `<a class="qv-shop" href="${shopHref(shop)}">
                 <span class="shop-avatar sm" style="${gradient(shop.colors)}">${sanitize(
                 shop.storeName.charAt(0)
               )}</span>
                 <span><b>${sanitize(shop.storeName)}</b><br><span class="muted small">${sanitize(
                 shop.location
               )}</span></span>
               </a>`
            : ''
        }
      </div>
    </div>`);
}

/* ---------------- Live search suggestions ---------------- */

function closeSuggest() {
  const box = document.getElementById('search-suggest');
  const input = document.getElementById('site-search');
  if (box) box.classList.add('hidden');
  if (input) input.setAttribute('aria-expanded', 'false');
}

function trendingSearches() {
  const weights = {};
  products.forEach((p) => {
    (p.tags || []).forEach((tag) => {
      weights[tag] = (weights[tag] || 0) + (p.sales || 0);
    });
  });
  return Object.keys(weights)
    .sort((a, b) => weights[b] - weights[a])
    .slice(0, 6);
}

function termChip(term) {
  return `<button type="button" class="sg-item" role="option" data-action="suggest"
    data-href="products.html?q=${encodeURIComponent(term)}">
    <span class="sg-thumb sg-thumb-term">${ICONS.search}</span>
    <span class="sg-text"><b>${sanitize(term)}</b><small>Search the catalogue</small></span>
  </button>`;
}

/* shown whenever the box is focused with nothing typed */
function renderIdleSuggest() {
  const box = document.getElementById('search-suggest');
  const input = document.getElementById('site-search');
  if (!box || !input) return;

  const recent = getRecentSearches();
  let html = '';

  if (recent.length) {
    html += `<p class="sg-title">Recent searches</p>`;
    html += recent.map(termChip).join('');
    html += `<button type="button" class="sg-clear" data-action="clear-searches">Clear recent searches</button>`;
  }

  html += `<p class="sg-title">Trending now</p>`;
  html += trendingSearches().map(termChip).join('');

  box.innerHTML = html;
  box.classList.remove('hidden');
  input.setAttribute('aria-expanded', 'true');
  highlightSuggestion(-1);
}

function renderSuggest(query) {
  const box = document.getElementById('search-suggest');
  const input = document.getElementById('site-search');
  if (!box || !input) return;

  const q = query.trim().toLowerCase();
  if (q.length < 1) {
    renderIdleSuggest();
    return;
  }

  const cats = categories.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 3);
  const shops = sellers
    .filter((s) => s.storeName.toLowerCase().includes(q) || s.tagline.toLowerCase().includes(q))
    .slice(0, 3);
  const items = searchProducts(q).slice(0, 5);

  if (!cats.length && !shops.length && !items.length) {
    box.innerHTML = `<p class="sg-empty">No matches for “${sanitize(query)}”. Try “gift”, “bouquet”, or “keychain”.</p>`;
    box.classList.remove('hidden');
    input.setAttribute('aria-expanded', 'true');
    return;
  }

  let html = '';
  if (items.length) {
    html += `<p class="sg-title">Products</p>`;
    html += items
      .map(
        (p) => `
        <button type="button" class="sg-item" role="option" data-action="suggest" data-href="${productHref(p)}">
          <span class="sg-thumb" style="${gradient(categoryColors(p.categoryId))}">${sanitize(
            p.name.charAt(0)
          )}</span>
          <span class="sg-text"><b>${sanitize(p.name)}</b><small>${sanitize(
            (findSeller(p.sellerId) || {}).storeName || ''
          )} · ${formatPrice(p.price)}</small></span>
        </button>`
      )
      .join('');
  }
  if (shops.length) {
    html += `<p class="sg-title">Shops</p>`;
    html += shops
      .map(
        (s) => `
        <button type="button" class="sg-item" role="option" data-action="suggest" data-href="${shopHref(s)}">
          <span class="sg-thumb" style="${gradient(s.colors)}">${sanitize(s.storeName.charAt(0))}</span>
          <span class="sg-text"><b>${sanitize(s.storeName)}</b><small>${sanitize(s.location)}</small></span>
        </button>`
      )
      .join('');
  }
  if (cats.length) {
    html += `<p class="sg-title">Categories</p>`;
    html += cats
      .map(
        (c) => `
        <button type="button" class="sg-item" role="option" data-action="suggest"
          data-href="products.html?cat=${encodeURIComponent(c.id)}">
          <span class="sg-thumb" style="${gradient(c.colors)}">${sanitize(c.name.charAt(0))}</span>
          <span class="sg-text"><b>${sanitize(c.name)}</b><small>${categoryCount(c.id)} items</small></span>
        </button>`
      )
      .join('');
  }

  box.innerHTML = html;
  box.classList.remove('hidden');
  input.setAttribute('aria-expanded', 'true');
  highlightSuggestion(-1);
}

function suggestionItems() {
  return Array.from(document.querySelectorAll('#search-suggest .sg-item'));
}

function highlightSuggestion(index) {
  const items = suggestionItems();
  items.forEach((el, i) => el.classList.toggle('is-active', i === index));
  if (index >= 0 && items[index]) {
    items[index].scrollIntoView({ block: 'nearest' });
    document.getElementById('site-search').setAttribute(
      'aria-activedescendant',
      items[index].id || ''
    );
  }
}

function searchBoxValue() {
  const input = document.getElementById('site-search');
  return input ? input.value.trim() : '';
}

/* preserve the active filters when the header search is used */
function currentSearchUrl(query) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);

  if (currentPage === 'products') {
    ['cat', 'price', 'min', 'max', 'rating', 'free', 'top', 'badge', 'shop', 'sort'].forEach((key) => {
      const value = new URLSearchParams(window.location.search).get(key);
      if (value) params.set(key, value);
    });
  }
  const qs = params.toString();
  return 'products.html' + (qs ? '?' + qs : '');
}

function submitSearch(query) {
  const q = String(query || '').trim();
  if (q) pushRecentSearch(q);
  window.location.href = currentSearchUrl(q);
}

function bindSearch() {
  const form = document.getElementById('site-search-form');
  const input = document.getElementById('site-search');
  if (!form || !input) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    closeSuggest();
    submitSearch(input.value);
  });

  input.addEventListener('input', () => renderSuggest(input.value));
  input.addEventListener('focus', () => renderSuggest(input.value));

  input.addEventListener('keydown', (e) => {
    const box = document.getElementById('search-suggest');
    if (!box || box.classList.contains('hidden')) {
      if (e.key === 'Escape') closeSuggest();
      return;
    }
    const items = suggestionItems();
    if (!items.length) return;
    let index = items.findIndex((el) => el.classList.contains('is-active'));

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      index = (index + 1) % items.length;
      highlightSuggestion(index);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      index = index <= 0 ? items.length - 1 : index - 1;
      highlightSuggestion(index);
    } else if (e.key === 'Enter') {
      if (index >= 0 && items[index]) {
        e.preventDefault();
        window.location.href = items[index].dataset.href;
      }
    } else if (e.key === 'Escape') {
      closeSuggest();
    }
  });
}

/* ---------------- Global click router ---------------- */

function bindGlobalRouter() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const id = el.dataset.id;

    switch (action) {
      case 'add-cart': {
        const added = addToCart(id);
        const p = findProduct(id);
        if (added) toast(`${p ? p.name : 'Item'} added to your cart`, 'success');
        else toast('That is the maximum we have in stock.', 'error');
        break;
      }
      case 'fav': {
        const wished = toggleWishlist(id);
        syncWishButtons(id);
        toast(wished ? 'Saved to your list' : 'Removed from your list', 'success');
        if (typeof onWishlistChange === 'function') onWishlistChange();
        break;
      }
      case 'quick-view':
        quickView(id);
        break;
      case 'close-modal':
        closeModal();
        break;
      case 'toggle-account':
        toggleAccountMenu();
        break;
      case 'signin':
        closeAccountMenu();
        openSigninModal();
        break;
      case 'signout':
        closeAccountMenu();
        confirmDialog(
          'Sign out?',
          'Your cart, saved items, and orders stay in this browser — only the name in the header is cleared.',
          'Sign out',
          () => {
            saveProfile(null);
            refreshAccountChrome();
            toast('Signed out', 'success');
          }
        );
        break;
      case 'clear-searches':
        clearRecentSearches();
        renderIdleSuggest();
        toast('Recent searches cleared', 'success');
        break;
      case 'toggle-nav':
        toggleNav();
        break;
      case 'suggest':
        if (el.dataset.href) window.location.href = el.dataset.href;
        break;
      case 'follow': {
        const following = toggleFollow(id);
        document
          .querySelectorAll(`[data-action="follow"][data-id="${id}"]`)
          .forEach((btn) => {
            btn.textContent = following ? 'Following' : 'Follow shop';
            btn.classList.toggle('btn-outline', following);
            btn.classList.toggle('btn-primary', !following);
          });
        if (typeof onFollowChange === 'function') onFollowChange(id, following);
        toast(following ? 'You are now following this shop' : 'Shop unfollowed', 'success');
        break;
      }
      case 'scroll-top':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'modal-message':
        openMessageModal(id);
        break;
      default:
        if (typeof handlePageAction === 'function') handlePageAction(action, el, e);
        break;
    }
  });
}

function openMessageModal(sellerId) {
  const shop = findSeller(sellerId);
  if (!shop) return;
  openModal(`
    <div class="modal-pad">
      <h3>Message ${sanitize(shop.storeName)}</h3>
      <p class="muted small" style="margin:6px 0 14px">Sellers usually reply within a few hours during business days.</p>
      <div class="form-group">
        <label for="msg-body">Your message *</label>
        <textarea id="msg-body" class="textarea" rows="4" placeholder="Hi! Is this available in other colours?"></textarea>
        <p class="field-error hidden" id="msg-error">Please write a message first.</p>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" data-action="close-modal">Cancel</button>
        <button class="btn btn-primary" id="msg-send">Send message</button>
      </div>
    </div>`);
  const send = document.getElementById('msg-send');
  if (send) {
    send.addEventListener('click', () => {
      const body = document.getElementById('msg-body');
      const error = document.getElementById('msg-error');
      if (!body.value.trim()) {
        error.classList.remove('hidden');
        body.focus();
        return;
      }
      closeModal();
      toast('Message sent to ' + shop.storeName, 'success');
    });
  }
}

/* ---------------- Sign in / out ---------------- */

function refreshAccountChrome() {
  const profile = getProfile();
  const signedIn = Boolean(profile && profile.firstName);
  const initial = signedIn ? profile.firstName.charAt(0).toUpperCase() : 'S';
  const label = signedIn ? sanitize(profile.firstName) : 'Sign in';

  const avatar = document.querySelector('.account-btn .avatar');
  const accountLabel = document.querySelector('.account-label');
  if (avatar) avatar.textContent = initial;
  if (accountLabel) accountLabel.textContent = label;

  /* rebuild the dropdown so the CTA flips between sign in / sign out */
  const menu = document.getElementById('account-menu');
  if (menu) {
    const temp = document.createElement('div');
    temp.innerHTML = renderHeader(currentPage);
    const fresh = temp.querySelector('#account-menu');
    if (fresh) menu.innerHTML = fresh.innerHTML;
  }
}

function openSigninModal() {
  const existing = getProfile();
  openModal(`
    <div class="modal-pad signin">
      <span class="signin-badge" aria-hidden="true">S</span>
      <h3>${existing && existing.firstName ? 'Update your details' : 'Welcome to StallFree'}</h3>
      <p class="muted small" style="margin:6px 0 18px">
        Sign in to get a personal greeting, a faster checkout, and your name on reviews.
        No password needed — this demo keeps everything in your browser.
      </p>
      <form id="signin-form" novalidate>
        <div class="form-group">
          <label for="si-name">First name *</label>
          <input type="text" id="si-name" class="input" placeholder="Juan" autocomplete="given-name"
            value="${sanitize((existing && existing.firstName) || '')}" />
          <p class="field-error hidden" id="si-name-error">Please enter your first name.</p>
        </div>
        <div class="form-group">
          <label for="si-email">Email (optional)</label>
          <input type="email" id="si-email" class="input" placeholder="you@email.com" autocomplete="email"
            value="${sanitize((existing && existing.email) || '')}" />
        </div>
        <button type="submit" class="btn btn-primary btn-block">${existing && existing.firstName ? 'Save details' : 'Sign in'}</button>
      </form>
      <p class="muted small signin-note">Your details never leave this browser.</p>
    </div>`);

  const nameInput = document.getElementById('si-name');
  if (nameInput) nameInput.focus();

  const form = document.getElementById('signin-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const error = document.getElementById('si-name-error');
    const first = nameInput ? nameInput.value.trim() : '';
    if (!first) {
      if (error) error.classList.remove('hidden');
      if (nameInput) nameInput.focus();
      return;
    }
    if (error) error.classList.add('hidden');

    const emailInput = document.getElementById('si-email');
    const email = emailInput ? emailInput.value.trim() : '';
    const last = (existing && existing.lastName) || '';

    saveProfile({
      firstName: first,
      lastName: last,
      fullName: [first, last].filter(Boolean).join(' '),
      email,
      phone: (existing && existing.phone) || '',
      address: (existing && existing.address) || ''
    });

    refreshAccountChrome();
    closeModal();
    toast(`Welcome, ${first}!`, 'success');
    if (typeof onProfileChange === 'function') onProfileChange();
  });
}

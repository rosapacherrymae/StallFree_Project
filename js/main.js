/* =====================================================================
   StallFree main entry — shared UI bootstrap + per-page logic.
   The active page is detected from the <body data-page="..."> attribute.
   ===================================================================== */

const page = document.body.dataset.page || 'home';
initSharedUI(page);

/* ================= Home ================= */

function initHome() {
  const greeting = document.getElementById('greeting');
  const profile = getProfile();
  if (greeting && profile && profile.firstName) {
    greeting.textContent = `Welcome back, ${sanitize(profile.firstName)}!`;
  }

  const featuredGrid = document.getElementById('featured-grid');
  if (featuredGrid) {
    const featured = [...products].sort((a, b) => b.rating - a.rating).slice(0, 8);
    featuredGrid.innerHTML = featured.map((p) => productCard(p)).join('');
  }

  const homeCats = document.getElementById('home-categories');
  if (homeCats) {
    homeCats.innerHTML = categories
      .slice(0, 6)
      .map((c) => categoryCard(c))
      .join('');
  }
}

/* ================= Products ================= */

function initProducts(filterCategory) {
  const select = document.getElementById('filter-category');
  if (select) {
    select.innerHTML =
      '<option value="all">All categories</option>' +
      categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
    select.value = filterCategory || 'all';
  }
  renderProducts();
}

function getFilterState() {
  return {
    query: (document.getElementById('search')?.value || '').trim().toLowerCase(),
    category: document.getElementById('filter-category')?.value || 'all',
    maxPrice: Number(document.getElementById('filter-price')?.value || 0),
    sort: document.getElementById('sort')?.value || 'featured'
  };
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('results-count');
  if (!grid) return;

  const f = getFilterState();

  let list = [...products];

  if (f.query) {
    list = list.filter((p) =>
      (p.name + ' ' + p.description + ' ' + findCategory(p.categoryId).name).toLowerCase().includes(f.query)
    );
  }
  if (f.category !== 'all') {
    list = list.filter((p) => p.categoryId === f.category);
  }
  if (f.maxPrice > 0) {
    list = list.filter((p) => p.price <= f.maxPrice);
  }

  switch (f.sort) {
    case 'price-asc':
      list.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      list.sort((a, b) => b.rating - a.rating);
      break;
    case 'name':
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      break;
  }

  if (countEl) countEl.textContent = `${list.length} result${list.length === 1 ? '' : 's'}`;

  grid.innerHTML = list.length
    ? list.map((p) => productCard(p)).join('')
    : emptyState('No products found', 'Try adjusting your search or filters.', 'View all products', 'products.html');
}

/* ================= Categories ================= */

function initCategories() {
  const grid = document.getElementById('categories-grid');
  if (grid) grid.innerHTML = categories.map((c) => categoryCard(c)).join('');
}

function goToCategory(categoryId) {
  window.location.href = `products.html?category=${encodeURIComponent(categoryId)}`;
}

/* ================= Sellers ================= */

function initSellers() {
  const grid = document.getElementById('sellers-grid');
  if (grid) grid.innerHTML = sellers.map((s) => sellerCard(s)).join('');
}

function viewSeller(sellerId) {
  const seller = findSeller(sellerId);
  if (!seller) return;

  const grid = document.getElementById('sellers-grid');
  grid.innerHTML = '';

  const band = document.getElementById('seller-band');
  band.classList.remove('hidden');
  band.innerHTML = `
    <div class="toolbar" style="align-items:center">
      <div class="seller-avatar" style="background:linear-gradient(135deg, ${seller.img[0]}, ${seller.img[1]})">
        <span>${sanitize(seller.storeName.charAt(0))}</span>
      </div>
      <div style="flex:1">
        <h2>${sanitize(seller.storeName)}</h2>
        <p class="muted">${sanitize(seller.description)}</p>
      </div>
      <div class="rating">&#9733; ${sellerRating(seller.id).toFixed(1)} &middot; ${sellerProductCount(seller.id)} products</div>
      <button class="btn btn-outline" onclick="window.location.reload()">All Sellers</button>
    </div>`;

  grid.innerHTML = productsBySeller(seller.id)
    .map((p) => productCard(p))
    .join('');
}

/* ================= Your Order (cart + history) ================= */

function initOrders() {
  renderCart();
  renderOrderHistory();
}

function renderCart() {
  const container = document.getElementById('cart-list');
  const summary = document.getElementById('cart-summary');
  const checkoutBtn = document.getElementById('checkout-btn');
  const checkoutForm = document.getElementById('checkout-form');
  const countLabel = document.getElementById('cart-count');
  if (!container) return;

  const entries = getCartEntries();

  if (countLabel) {
    const n = entries.reduce((s, e) => s + e.qty, 0);
    countLabel.textContent = `${n} item${n === 1 ? '' : 's'}`;
  }

  if (!entries.length) {
    container.innerHTML = emptyState(
      'Your cart is empty',
      'Add some products and they will show up here.',
      'Browse products',
      'products.html'
    );
    summary.innerHTML = '';
    checkoutForm.classList.add('hidden');
    return;
  }

  container.innerHTML = entries
    .map(
      (e) => `
      <div class="card cart-item">
        <div class="product-img" style="background:linear-gradient(135deg, ${e.product.img[0]}, ${e.product.img[1]})">
          ${productImage(e.product)}
        </div>
        <div class="cart-item-info">
          <h4>${sanitize(e.product.name)}</h4>
          <span class="price" style="font-size:.95rem">${formatPrice(e.product.price)}</span>
          <div class="qty">
            <button onclick="updateCartQty('${e.product.id}', -1)">-</button>
            <span>${e.qty}</span>
            <button onclick="updateCartQty('${e.product.id}', 1)">+</button>
            <button class="btn btn-sm btn-danger" style="margin-left:10px" onclick="removeFromCart('${e.product.id}')">Remove</button>
          </div>
        </div>
        <div class="price">${formatPrice(e.product.price * e.qty)}</div>
      </div>`
    )
    .join('');

  const subtotal = getCartSubtotal();
  const shipping = subtotal >= 1000 ? 0 : 75;

  summary.innerHTML = `
    <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
    <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? 'Free' : formatPrice(shipping)}</span></div>
    <div class="summary-total summary-row"><span>Total</span><span>${formatPrice(subtotal + shipping)}</span></div>
    <p class="muted" style="font-size:.78rem;margin-top:6px">Free shipping on orders over ${formatPrice(1000)}.</p>`;

  checkoutBtn.classList.remove('hidden');
  checkoutForm.classList.add('hidden');
}

function toggleCheckout() {
  const form = document.getElementById('checkout-form');
  form.classList.toggle('hidden');
  if (!form.classList.contains('hidden')) {
    const profile = getProfile();
    if (profile) {
      document.getElementById('co-name').value = profile.fullName || '';
      document.getElementById('co-phone').value = profile.phone || '';
      document.getElementById('co-address').value = profile.address || '';
    }
  }
}

function placeOrder() {
  const name = document.getElementById('co-name').value.trim();
  const phone = document.getElementById('co-phone').value.trim();
  const address = document.getElementById('co-address').value.trim();

  document.getElementById('co-name').nextElementSibling?.classList.add('hidden');
  document.getElementById('co-phone').nextElementSibling?.classList.add('hidden');
  document.getElementById('co-address').nextElementSibling?.classList.add('hidden');

  let ok = true;
  if (!name) { document.getElementById('err-name').classList.remove('hidden'); ok = false; }
  if (!phone) { document.getElementById('err-phone').classList.remove('hidden'); ok = false; }
  if (!address) { document.getElementById('err-address').classList.remove('hidden'); ok = false; }
  if (!ok) { document.getElementById('checkout-error').classList.remove('hidden'); return; }
  document.getElementById('checkout-error').classList.add('hidden');

  createOrder({ name, phone, address });

  const banner = document.getElementById('order-banner');
  banner.classList.remove('hidden');
  banner.textContent = 'Thank you! Your order has been placed.';

  renderCart();
  renderOrderHistory();
  refreshCartBadge();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderOrderHistory() {
  const container = document.getElementById('order-history');
  if (!container) return;

  const orders = getOrders();
  if (!orders.length) {
    container.innerHTML = emptyState('No orders yet', 'Orders you place will appear here.');
    return;
  }

  container.innerHTML = orders
    .map(
      (o) => `
      <div class="card order-item">
        <div class="order-head">
          <span class="order-id">${sanitize(o.id)}</span>
          <span class="chip status status-processing">${sanitize(o.status)}</span>
        </div>
        <div class="order-head muted" style="margin-top:-6px">
          <span class="muted">${sanitize(o.date)}</span>
        </div>
        <p class="order-items">
          ${o.items
            .map((i) => `${sanitize(i.name)} x${i.qty}`)
            .join(' &middot; ')}
        </p>
        <div class="order-head">
          <span class="chip">Deliver to: ${sanitize(o.customer.address)}</span>
          <span class="price">${formatPrice(o.total)}</span>
        </div>
      </div>`
    )
    .join('');
}

/* ================= Profile ================= */

function initProfile() {
  const profile = getProfile();
  if (profile) {
    document.getElementById('p-first').value = profile.firstName || '';
    document.getElementById('p-last').value = profile.lastName || '';
    document.getElementById('p-phone').value = profile.phone || '';
    document.getElementById('p-address').value = profile.address || '';
  }

  const stats = getOrderStats();
  document.getElementById('stat-count').textContent = stats.count;
  document.getElementById('stat-spent').textContent = formatPrice(stats.totalSpent);
  document.getElementById('stat-items').textContent = stats.itemsBought;

  renderOrderHistory();
}

function saveProfileForm() {
  const firstName = document.getElementById('p-first').value.trim();
  const lastName = document.getElementById('p-last').value.trim();

  document.getElementById('profile-error').classList.add('hidden');
  if (!firstName) {
    document.getElementById('profile-error').classList.remove('hidden');
    return;
  }

  saveProfile({
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(' '),
    phone: document.getElementById('p-phone').value.trim(),
    address: document.getElementById('p-address').value.trim()
  });

  const banner = document.getElementById('profile-banner');
  banner.classList.remove('hidden');
  banner.textContent = 'Profile saved successfully.';
  setTimeout(() => banner.classList.add('hidden'), 3000);
}

/* ================= Bootstrap by page ================= */

switch (page) {
  case 'home':
    initHome();
    break;
  case 'products': {
    const params = new URLSearchParams(window.location.search);
    initProducts(params.get('category') || 'all');
    break;
  }
  case 'categories':
    initCategories();
    break;
  case 'sellers':
    initSellers();
    break;
  case 'orders':
    initOrders();
    break;
  case 'profile':
    initProfile();
    break;
}
/* =====================================================================
   StallFree storage layer — cart, wishlist, profile, reviews, recently
   viewed, and follows live in a per-account namespace; orders live in
   one shared store tagged with their owner so the administrator can
   manage them. localStorage is the only datastore available on this
   static hosting, so treat it as demo data — not a production database.
   ===================================================================== */

const STORE_KEYS = {
  cart: 'cart',
  wishlist: 'wishlist',
  profile: 'profile',
  reviews: 'reviews',
  recent: 'recent',
  follows: 'follows',
  coupon: 'coupon',
  searches: 'searches'
};

const GLOBAL_KEYS = {
  orders: 'stallfree:orders',
  catalog: 'stallfree:catalog_overrides',
  customProducts: 'stallfree:custom_products',
  shopOverrides: 'stallfree:shop_overrides'
};

const FREE_SHIPPING_THRESHOLD = 1000;
const FLAT_SHIPPING_FEE = 75;

const SHIPPING_METHODS = [
  {
    id: 'standard',
    label: 'Standard delivery',
    fee: FLAT_SHIPPING_FEE,
    freeOver: FREE_SHIPPING_THRESHOLD,
    eta: '2–4 business days',
    etaDays: 3
  },
  {
    id: 'express',
    label: 'Express delivery',
    fee: 199,
    freeOver: 0,
    eta: '1–2 business days',
    etaDays: 1
  }
];

function findShippingMethod(methodId) {
  return SHIPPING_METHODS.find((m) => m.id === methodId) || SHIPPING_METHODS[0];
}

const ORDER_STATUSES = [
  { id: 'placed', label: 'Order placed', flow: 1, className: 'status-processing' },
  { id: 'confirmed', label: 'Confirmed', flow: 2, className: 'status-processing' },
  { id: 'preparing', label: 'Preparing / Packing', flow: 3, className: 'status-processing' },
  { id: 'shipped', label: 'Shipped / In transit', flow: 4, className: 'status-shipped' },
  { id: 'out_for_delivery', label: 'Out for delivery', flow: 5, className: 'status-shipped' },
  { id: 'delivered', label: 'Delivered', flow: 6, className: 'status-delivered' },
  { id: 'cancelled', label: 'Cancelled', flow: 0, className: 'status-cancelled' },
  { id: 'delivery_failed', label: 'Delivery failed', flow: 0, className: 'status-failed' },
  { id: 'return_requested', label: 'Return requested', flow: 0, className: 'status-failed' }
];

/* The documented order lifecycle. A status may only move along one of
   these edges, so history stays truthful and every route is reachable. */
const ORDER_TRANSITIONS = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivery_failed'],
  out_for_delivery: ['delivered', 'delivery_failed'],
  delivered: ['return_requested'],
  delivery_failed: ['return_requested'],
  return_requested: [],
  cancelled: []
};

function statusMeta(statusId) {
  return ORDER_STATUSES.find((s) => s.id === statusId) || ORDER_STATUSES[0];
}

function canTransitionOrder(currentStatus, nextStatus) {
  const from = statusMeta(currentStatus).id;
  const to = statusMeta(nextStatus).id;
  return (ORDER_TRANSITIONS[from] || []).includes(to);
}

function allowedNextStatuses(currentStatus) {
  const from = statusMeta(currentStatus).id;
  return (ORDER_TRANSITIONS[from] || []).slice();
}

const LEGACY_KEYS = {
  cart: 'stallfree_cart',
  wishlist: 'stallfree_wishlist',
  orders: 'stallfree_orders',
  profile: 'stallfree_profile',
  reviews: 'stallfree_reviews',
  recent: 'stallfree_recent',
  follows: 'stallfree_follows',
  coupon: 'stallfree_coupon',
  searches: 'stallfree_searches'
};

const SEED_STOCK = {};

/* ---------------- Namespace helpers ---------------- */


function dataScope() {
  try {
    return typeof currentUserId === 'function' ? currentUserId() : 'guest';
  } catch (e) {
    return 'guest';
  }
}

function scopedKeyFor(scope, logical) {
  return 'stallfree:' + scope + ':' + logical;
}

function scopedKey(logical) {
  return scopedKeyFor(dataScope(), logical);
}

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(scopedKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(scopedKey(key), JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

function removeStore(key) {
  try {
    localStorage.removeItem(scopedKey(key));
  } catch (e) {
    /* ignore */
  }
}

function readGlobal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeGlobal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

function readList(key) {
  const value = readStore(key, []);
  return Array.isArray(value) ? value : [];
}

/* ---------------- One-time legacy migration ---------------- */

function migrateLegacyStorage() {
  try {
    if (localStorage.getItem('stallfree_legacy_migrated')) return;
    Object.keys(LEGACY_KEYS).forEach((logical) => {
      const raw = localStorage.getItem(LEGACY_KEYS[logical]);
      if (raw === null) return;
      if (logical === 'orders') {
        let list = [];
        try {
          list = JSON.parse(raw) || [];
        } catch (e) {
          list = [];
        }
        if (Array.isArray(list)) {
          const tagged = list.map((o) => Object.assign({}, o, { userId: o.userId || 'guest' }));
          const existing = readGlobal(GLOBAL_KEYS.orders, []);
          const merged = tagged.concat(
            Array.isArray(existing) ? existing.filter((o) => !tagged.some((t) => t.id === o.id)) : []
          );
          writeGlobal(GLOBAL_KEYS.orders, merged);
        }
      } else if (localStorage.getItem(scopedKeyFor('guest', logical)) === null) {
        localStorage.setItem(scopedKeyFor('guest', logical), raw);
      }
      localStorage.removeItem(LEGACY_KEYS[logical]);
    });
    localStorage.setItem('stallfree_legacy_migrated', '1');
  } catch (e) {
    /* ignore */
  }
}

migrateLegacyStorage();

/* ---------------- Catalog overlays (admin edits) ---------------- */

/* Immutable shipped values. Admin edits are stored separately, so every
   apply starts from these and then layers the saved overrides on top.
   This makes replacing a backup (or clearing one override) deterministic. */
const SEED_PRODUCTS = {};
const SEED_SELLERS = {};
products.forEach((p) => {
  SEED_PRODUCTS[p.id] = Object.assign({}, p, {
    archived: Boolean(p.archived),
    removed: Boolean(p.removed)
  });
  SEED_STOCK[p.id] = p.stock;
});
sellers.forEach((s) => {
  SEED_SELLERS[s.id] = Object.assign({}, s);
});

function readCatalogOverrides() {
  const map = readGlobal(GLOBAL_KEYS.catalog, {});
  return map && typeof map === 'object' ? map : {};
}

function applyCatalogOverrides() {
  products.forEach((p) => {
    const base = SEED_PRODUCTS[p.id];
    if (base) Object.assign(p, base);
  });
  sellers.forEach((s) => {
    const base = SEED_SELLERS[s.id];
    if (base) Object.assign(s, base);
  });

  /* custom products must exist before overrides apply, or dashboard
     edits to them would silently vanish on the next page load */
  const custom = readGlobal(GLOBAL_KEYS.customProducts, []);
  const rows = Array.isArray(custom) ? custom.filter((p) => p && p.id) : [];
  const customIds = rows.map((p) => p.id);
  for (let i = products.length - 1; i >= 0; i -= 1) {
    if (products[i].__custom && !customIds.includes(products[i].id)) {
      products.splice(i, 1);
    }
  }
  rows.forEach((p) => {
    const existing = findProduct(p.id);
    if (existing) Object.assign(existing, p, { __custom: true });
    else products.push(Object.assign({}, p, { __custom: true }));
    SEED_STOCK[p.id] = p.stock;
  });

  const overrides = readCatalogOverrides();
  Object.keys(overrides).forEach((id) => {
    const p = findProduct(id);
    const o = overrides[id];
    if (!p || !o) return;
    if (typeof o.name === 'string' && o.name.trim()) p.name = o.name;
    if (typeof o.description === 'string') p.description = o.description;
    if (typeof o.price === 'number' && o.price >= 0) p.price = o.price;
    if (typeof o.compareAt === 'number') p.compareAt = o.compareAt;
    if (typeof o.materials === 'string') p.materials = o.materials;
    if (typeof o.photo === 'string') p.photo = o.photo;
    if (typeof o.categoryId === 'string' && findCategory(o.categoryId)) p.categoryId = o.categoryId;
    if (typeof o.sellerId === 'string' && findSeller(o.sellerId)) p.sellerId = o.sellerId;
    if (typeof o.freeShipping === 'boolean') p.freeShipping = o.freeShipping;
    p.archived = Boolean(o.archived);
    p.removed = Boolean(o.removed);
  });

  const shopMap = readGlobal(GLOBAL_KEYS.shopOverrides, {});
  if (shopMap && typeof shopMap === 'object') {
    Object.keys(shopMap).forEach((id) => {
      const s = findSeller(id);
      const o = shopMap[id];
      if (!s || !o) return;
      if (typeof o.storeName === 'string' && o.storeName.trim()) s.storeName = o.storeName;
      if (typeof o.tagline === 'string') s.tagline = o.tagline;
      if (typeof o.location === 'string') s.location = o.location;
    });
  }
}

applyCatalogOverrides();

/* ---------------- Admin catalog writes ----------------
   Every function here runs requireAdmin() first, so a non-admin
   session cannot mutate the catalogue even by calling them directly. */

function isCustomProduct(productId) {
  const list = readGlobal(GLOBAL_KEYS.customProducts, []);
  return Array.isArray(list) && list.some((p) => p && p.id === productId);
}

function saveCatalogOverride(productId, patch) {
  const guard = requireAdmin();
  if (!guard.ok) return guard;
  const p = findProduct(productId);
  if (!p) return { ok: false, error: 'Product not found.' };

  const map = readCatalogOverrides();
  const next = Object.assign({}, map[productId] || {});

  if (typeof patch.name === 'string' && patch.name.trim()) next.name = patch.name.trim().slice(0, 140);
  if (typeof patch.description === 'string') next.description = patch.description.trim().slice(0, 2000);
  if (typeof patch.materials === 'string') next.materials = patch.materials.trim().slice(0, 300);
  if (typeof patch.photo === 'string') next.photo = patch.photo.trim().slice(0, 300);
  if (typeof patch.categoryId === 'string') {
    if (!findCategory(patch.categoryId)) return { ok: false, error: 'Choose a valid category.' };
    next.categoryId = patch.categoryId;
  }
  if (typeof patch.sellerId === 'string') {
    if (!findSeller(patch.sellerId)) return { ok: false, error: 'Choose a valid shop.' };
    next.sellerId = patch.sellerId;
  }
  if (typeof patch.price === 'number' && patch.price >= 0) next.price = patch.price;
  if (typeof patch.compareAt === 'number' && patch.compareAt >= 0) next.compareAt = patch.compareAt;
  if (typeof patch.stock === 'number' && patch.stock >= 0) next.stock = Math.floor(patch.stock);
  if (typeof patch.freeShipping === 'boolean') next.freeShipping = patch.freeShipping;
  if (typeof patch.archived === 'boolean') next.archived = patch.archived;
  if (typeof patch.removed === 'boolean') next.removed = patch.removed;

  map[productId] = next;
  if (!writeGlobal(GLOBAL_KEYS.catalog, map)) {
    return { ok: false, error: 'Could not save the change in this browser.' };
  }

  applyCatalogOverrides();
  appendAudit('admin.product_edit', `${productId} updated`);
  return { ok: true, product: findProduct(productId) };
}

function addCustomProduct(input) {
  const guard = requireAdmin();
  if (!guard.ok) return guard;

  const name = String(input.name || '').trim();
  const price = Number(input.price);
  const stock = Number(input.stock);
  if (!name) return { ok: false, error: 'Give the product a name.' };
  if (!Number.isFinite(price) || price < 0) return { ok: false, error: 'Enter a valid price.' };
  if (!Number.isInteger(stock) || stock < 0) return { ok: false, error: 'Enter a valid stock quantity.' };
  if (!findCategory(input.categoryId)) return { ok: false, error: 'Choose a category.' };
  if (!findSeller(input.sellerId)) return { ok: false, error: 'Choose a shop.' };

  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'item';
  let id = slug;
  while (findProduct(id)) id = `${slug}-${randomHex(2)}`;

  const product = {
    id,
    name,
    price,
    sellerId: input.sellerId,
    categoryId: input.categoryId,
    rating: 0,
    reviews: 0,
    description: String(input.description || '').trim(),
    photo: String(input.photo || '').trim(),
    badge: 'new',
    materials: String(input.materials || '').trim(),
    processing: String(input.processing || '').trim() || '2-3 business days',
    freeShipping: Boolean(input.freeShipping),
    stock,
    sales: 0,
    tags: []
  };

  const list = readGlobal(GLOBAL_KEYS.customProducts, []);
  const next = (Array.isArray(list) ? list : []).concat([product]);
  if (!writeGlobal(GLOBAL_KEYS.customProducts, next)) {
    return { ok: false, error: 'Could not save the product in this browser.' };
  }

  if (!findProduct(product.id)) products.push(product);
  SEED_STOCK[product.id] = product.stock;
  appendAudit('admin.product_add', `${product.id} created`);
  return { ok: true, product };
}

function deleteCustomProduct(productId) {
  const guard = requireAdmin();
  if (!guard.ok) return guard;
  const list = readGlobal(GLOBAL_KEYS.customProducts, []);
  const rows = Array.isArray(list) ? list : [];
  const next = rows.filter((p) => p && p.id !== productId);
  if (next.length === rows.length) return { ok: false, error: 'Product not found.' };
  if (!writeGlobal(GLOBAL_KEYS.customProducts, next)) {
    return { ok: false, error: 'Could not save the change in this browser.' };
  }

  const index = products.findIndex((p) => p.id === productId);
  if (index >= 0) products.splice(index, 1);
  delete SEED_STOCK[productId];

  const map = readCatalogOverrides();
  delete map[productId];
  writeGlobal(GLOBAL_KEYS.catalog, map);

  appendAudit('admin.product_delete', `${productId} deleted`);
  return { ok: true };
}

/* custom listings are deleted outright; seed listings are flagged
   removed so historical orders keep resolving their snapshots */
function removeProduct(productId) {
  const guard = requireAdmin();
  if (!guard.ok) return guard;
  if (!findProduct(productId)) return { ok: false, error: 'Product not found.' };
  if (isCustomProduct(productId)) return deleteCustomProduct(productId);
  return saveCatalogOverride(productId, { removed: true });
}

function saveShopOverride(sellerId, patch) {
  const guard = requireAdmin();
  if (!guard.ok) return guard;
  const shop = findSeller(sellerId);
  if (!shop) return { ok: false, error: 'Shop not found.' };

  const raw = readGlobal(GLOBAL_KEYS.shopOverrides, {});
  const map = raw && typeof raw === 'object' ? raw : {};
  const next = Object.assign({}, map[sellerId] || {});

  if (typeof patch.storeName === 'string' && patch.storeName.trim()) {
    next.storeName = patch.storeName.trim().slice(0, 80);
  }
  if (typeof patch.tagline === 'string') next.tagline = patch.tagline.trim().slice(0, 140);
  if (typeof patch.location === 'string') next.location = patch.location.trim().slice(0, 80);

  map[sellerId] = next;
  if (!writeGlobal(GLOBAL_KEYS.shopOverrides, map)) {
    return { ok: false, error: 'Could not save the change in this browser.' };
  }

  applyCatalogOverrides();
  appendAudit('admin.shop_edit', `${sellerId} updated`);
  return { ok: true, shop: findSeller(sellerId) };
}

/* ---------------- Orders (shared, owner-tagged) ---------------- */

function readAllOrders() {
  const list = readGlobal(GLOBAL_KEYS.orders, []);
  return Array.isArray(list) ? list : [];
}

function saveAllOrders(list) {
  return writeGlobal(GLOBAL_KEYS.orders, list);
}

function getOrders() {
  const uid = dataScope();
  return readAllOrders().filter((o) => (o.userId || 'guest') === uid);
}

function getAllOrders() {
  return readAllOrders();
}

function getOrderById(orderId) {
  return readAllOrders().find((o) => o.id === orderId) || null;
}

function canViewOrder(order) {
  if (!order) return false;
  if (isAdmin()) return true;
  return (order.userId || 'guest') === dataScope();
}

/* Every status change is checked against ORDER_TRANSITIONS above. */
function canTransitionOrderStatus(currentStatus, nextStatus) {
  return canTransitionOrder(currentStatus, nextStatus);
}

function normalizeOrderStatus(order) {
  return statusMeta(order && order.status).id;
}

function formatOrderDate(date) {
  return new Date(date).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/* units still available = baseline stock minus what non-cancelled orders took */
function soldQuantity(productId) {
  return readAllOrders().reduce((sum, order) => {
    if (order.status === 'cancelled') return sum;
    return sum + (order.items || []).reduce((s, i) => (i.productId === productId ? s + i.qty : s), 0);
  }, 0);
}

function stockBaseline(productId) {
  const override = readCatalogOverrides()[productId];
  if (override && typeof override.stock === 'number' && override.stock >= 0) return override.stock;
  if (typeof SEED_STOCK[productId] === 'number') return SEED_STOCK[productId];
  const p = findProduct(productId);
  return p ? p.stock : 0;
}

function productStock(productId) {
  const p = findProduct(productId);
  if (!p) return 0;
  return Math.max(0, stockBaseline(productId) - soldQuantity(productId));
}

/* ---------------- Cart ================= */
/* cart item shape: { productId, qty } */

function getCart() {
  /* Stored data can be hand-edited or left over from older shapes. Normalise
     each line and merge repeated product ids so a corrupt quantity can never
     turn into a negative total or invent stock. */
  const merged = new Map();

  readList(STORE_KEYS.cart).forEach((item) => {
    if (!item || typeof item.productId !== 'string' || !findProduct(item.productId)) return;

    const qty = Math.floor(Number(item.qty));
    const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
    const note = cleanGiftNote(item.note);
    const existing = merged.get(item.productId);

    if (existing) {
      existing.qty += safeQty;
      if (note) existing.note = note;
      if (item.selected === false) existing.selected = false;
      return;
    }

    const clean = { productId: item.productId, qty: safeQty };
    if (note) clean.note = note;
    if (item.selected === false) clean.selected = false;
    merged.set(item.productId, clean);
  });

  return Array.from(merged.values());
}

function saveCart(cart) {
  writeStore(STORE_KEYS.cart, cart);
  refreshCartBadge();
}

function cleanGiftNote(note) {
  return String(note == null ? '' : note).trim().slice(0, 200);
}

function addToCart(productId, qty = 1, note = '') {
  const product = findProduct(productId);
  if (!product || !isListable(product)) return false;

  const cart = getCart();
  const existing = cart.find((item) => item.productId === productId);
  const inCart = existing ? existing.qty : 0;
  const wanted = Math.floor(Number(qty));
  const step = Number.isFinite(wanted) && wanted > 0 ? wanted : 1;
  const nextQty = Math.min(inCart + step, productStock(productId));

  if (nextQty === inCart) return false;

  const trimmed = cleanGiftNote(note);
  if (existing) {
    existing.qty = nextQty;
    if (trimmed) existing.note = trimmed;
  } else {
    const item = { productId, qty: nextQty };
    if (trimmed) item.note = trimmed;
    cart.push(item);
  }

  saveCart(cart);
  return true;
}

function setCartItemNote(productId, note) {
  const cart = getCart();
  const item = cart.find((i) => i.productId === productId);
  if (!item) return;
  const trimmed = cleanGiftNote(note);
  if (trimmed) item.note = trimmed;
  else delete item.note;
  saveCart(cart);
}

function removeCartItemNote(productId) {
  setCartItemNote(productId, '');
}

function setCartQty(productId, qty) {
  const product = findProduct(productId);
  if (!product) return false;
  const cart = getCart();
  const existing = cart.find((item) => item.productId === productId);
  if (!existing) return false;

  const wanted = Math.floor(Number(qty));
  if (!Number.isFinite(wanted)) return false;
  const stock = productStock(productId);
  if (stock <= 0) return false;

  const clamped = Math.max(1, Math.min(wanted, stock));
  if (clamped === existing.qty) return false;
  existing.qty = clamped;
  saveCart(cart);
  return true;
}

function updateCartQty(productId, delta) {
  const cart = getCart();
  const existing = cart.find((item) => item.productId === productId);
  if (!existing) return false;
  return setCartQty(productId, existing.qty + delta);
}

function removeFromCart(productId) {
  saveCart(getCart().filter((item) => item.productId !== productId));
}

function clearCart() {
  saveCart([]);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function getCartEntries() {
  return getCart()
    .map((item) => {
      const product = findProduct(item.productId);
      if (!product) return null;
      const stock = productStock(item.productId);
      const listable = isListable(product);
      let reason = '';
      if (!listable) reason = 'This listing is no longer available.';
      else if (stock <= 0) reason = 'This item is sold out.';
      else if (item.qty > stock) reason = `Only ${stock} left — reduce the quantity.`;
      return {
        product,
        qty: item.qty,
        note: cleanGiftNote(item.note),
        stock,
        available: listable && stock > 0 && item.qty <= stock,
        reason,
        /* anything not explicitly unticked is part of the checkout */
        selected: item.selected !== false
      };
    })
    .filter(Boolean);
}

function setCartSelected(productId, selected) {
  const cart = getCart();
  const item = cart.find((i) => i.productId === productId);
  if (!item) return false;
  if (selected) delete item.selected;
  else item.selected = false;
  saveCart(cart);
  return true;
}

function getSelectedCartEntries() {
  return getCartEntries().filter((entry) => entry.selected && entry.available);
}

function getCartSubtotal(entries) {
  const list = entries || getSelectedCartEntries();
  return list.reduce((sum, e) => sum + e.product.price * e.qty, 0);
}

/* ================= Coupon ================= */

function getAppliedCoupon() {
  const raw = readStore(STORE_KEYS.coupon, null);
  if (!raw) return null;
  const coupon = findCoupon(raw.code);
  return coupon || null;
}

function applyCoupon(code) {
  const coupon = findCoupon(code);
  if (!coupon) return { ok: false, message: 'That code is not recognised.' };
  if (coupon.min && getCartSubtotal() < coupon.min) {
    return {
      ok: false,
      message: `This code needs a subtotal of at least ${formatPrice(coupon.min)}.`
    };
  }
  writeStore(STORE_KEYS.coupon, { code: coupon.code });
  return { ok: true, coupon };
}

function clearCoupon() {
  removeStore(STORE_KEYS.coupon);
}

function couponDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  if (coupon.min && subtotal < coupon.min) return 0;
  if (coupon.type === 'percent') return Math.round((subtotal * coupon.value) / 100);
  if (coupon.type === 'fixed') return Math.min(coupon.value, subtotal);
  return 0;
}

function shippingFee(subtotal, coupon, methodId) {
  if (subtotal <= 0) return 0;
  const method = findShippingMethod(methodId);
  if (method.freeOver && subtotal >= method.freeOver) return 0;
  if (coupon && coupon.type === 'shipping') return 0;
  return method.fee;
}

function getTotals(methodId, entries) {
  const list = entries || getSelectedCartEntries();
  const subtotal = getCartSubtotal(list);
  const coupon = getAppliedCoupon();
  const discount = couponDiscount(coupon, subtotal);
  const shipping = shippingFee(subtotal - discount, coupon, methodId);
  return { subtotal, coupon, discount, shipping, total: subtotal - discount + shipping };
}

/* ================= Wishlist ================= */

function getWishlist() {
  /* de-duplicate so a hand-edited list cannot render the same card twice */
  const seen = new Set();
  return readList(STORE_KEYS.wishlist).filter((id) => {
    if (seen.has(id) || !findProduct(id)) return false;
    seen.add(id);
    return true;
  });
}

function saveWishlist(list) {
  writeStore(STORE_KEYS.wishlist, list);
  refreshWishlistBadge();
}

function isWished(productId) {
  return getWishlist().includes(productId);
}

/* returns true when the product is now wished */
function toggleWishlist(productId) {
  if (!findProduct(productId)) return false;
  const list = getWishlist();
  const index = list.indexOf(productId);
  let wished;
  if (index >= 0) {
    list.splice(index, 1);
    wished = false;
  } else {
    list.unshift(productId);
    wished = true;
  }
  saveWishlist(list);
  return wished;
}

function removeFromWishlist(productId) {
  saveWishlist(getWishlist().filter((id) => id !== productId));
}

function clearWishlist() {
  saveWishlist([]);
}

function getWishlistCount() {
  return getWishlist().length;
}

function getWishlistProducts() {
  return getWishlist()
    .map((id) => findProduct(id))
    .filter(Boolean);
}

/* ================= Orders ================= */

function nextOrderId() {
  let id;
  do {
    id = 'SF-' + Date.now().toString().slice(-8) + Math.floor(10 + Math.random() * 89);
  } while (getOrderById(id));
  return id;
}

/* Creates exactly one persistent order. Re-sending the same clientToken
   returns the order that token already produced, so a double submit can
   never create a duplicate. */
function createOrder(customer, opts = {}) {
  /* Resolve the token first: a successful submit empties the cart, so a
     retry must still return the order instead of "your cart is empty". */
  const token = opts.clientToken || '';
  if (token) {
    const existing = readAllOrders().find((o) => o.clientToken === token);
    if (existing) return { ok: true, order: existing, duplicate: true };
  }

  const allEntries = getCartEntries();
  /* only the items picked for this checkout are ordered */
  const entries = opts.productIds
    ? allEntries.filter((e) => opts.productIds.includes(e.product.id))
    : allEntries.filter((e) => e.selected);
  if (!entries.length) {
    return {
      ok: false,
      error: allEntries.length ? 'Select at least one item to check out.' : 'Your cart is empty.'
    };
  }

  const blocked = entries.find((e) => !e.available);
  if (blocked) {
    return {
      ok: false,
      error: blocked.reason || `${blocked.product.name} is not available right now.`,
      productId: blocked.product.id
    };
  }

  const shortage = entries.find((e) => e.qty > productStock(e.product.id));
  if (shortage) {
    return {
      ok: false,
      error: `${shortage.product.name} has only ${productStock(shortage.product.id)} left in stock.`,
      productId: shortage.product.id
    };
  }

  const method = findShippingMethod(customer.shippingMethod);
  const totals = getTotals(method.id, entries);
  const now = new Date();
  const payment = customer.payment || 'Cash on delivery';

  const order = {
    id: nextOrderId(),
    userId: dataScope(),
    clientToken: token || null,
    customer: {
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      note: cleanGiftNote(customer.note),
      payment
    },
    items: entries.map((e) => ({
      productId: e.product.id,
      name: e.product.name,
      price: e.product.price,
      qty: e.qty,
      photo: e.product.photo,
      categoryId: e.product.categoryId,
      sellerId: e.product.sellerId,
      note: e.note
    })),
    subtotal: totals.subtotal,
    discount: totals.discount,
    coupon: totals.coupon ? totals.coupon.code : null,
    shipping: totals.shipping,
    shippingMethod: method.id,
    total: totals.total,
    status: 'placed',
    statusHistory: [
      { status: 'placed', at: now.toISOString(), by: 'customer', note: 'Order received' }
    ],
    paymentStatus: payment === 'Cash on delivery' ? 'due_on_delivery' : 'pending',
    payment,
    tracking: null,
    date: formatOrderDate(now),
    dateISO: now.toISOString(),
    deliveryBy: new Date(now.getTime() + method.etaDays * 864e5).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  };

  const all = readAllOrders();
  all.unshift(order);
  if (!saveAllOrders(all)) return { ok: false, error: 'Could not save the order in this browser.' };

  /* items that were checked out leave the cart; the rest stay for later */
  const orderedIds = entries.map((e) => e.product.id);
  const remaining = getCart().filter((item) => !orderedIds.includes(item.productId));
  saveCart(remaining);
  if (!remaining.length) clearCoupon();
  return { ok: true, order };
}

/* customer cancellation while the order is still with the seller */
const CANCELLABLE_STATUSES = ['placed', 'confirmed', 'preparing'];

function cancelOrder(orderId) {
  const order = getOrderById(orderId);
  if (!order) return { ok: false, error: 'Order not found.' };
  if ((order.userId || 'guest') !== dataScope() && !isAdmin()) {
    return { ok: false, error: 'You can only cancel your own orders.' };
  }
  if (!CANCELLABLE_STATUSES.includes(normalizeOrderStatus(order))) {
    return { ok: false, error: 'This order has already shipped and can no longer be cancelled.' };
  }
  return applyOrderStatusChange(order, 'cancelled', { by: 'customer', note: 'Cancelled by customer' });
}

/* every status change flows through here so history is always appended */
function applyOrderStatusChange(order, status, meta = {}) {
  const valid = ORDER_STATUSES.some((s) => s.id === status);
  if (!valid) return { ok: false, error: 'Unknown order status.' };

  const current = normalizeOrderStatus(order);
  if (!canTransitionOrder(current, status)) {
    const allowed = allowedNextStatuses(current).map((id) => statusMeta(id).label);
    return {
      ok: false,
      error: allowed.length
        ? `Cannot move an order from “${statusMeta(current).label}” to “${statusMeta(status).label}”. Allowed: ${allowed.join(', ')}.`
        : `“${statusMeta(current).label}” is a final status and cannot be changed.`
    };
  }

  const all = readAllOrders();
  const index = all.findIndex((o) => o.id === order.id);
  if (index < 0) return { ok: false, error: 'Order not found.' };

  const updated = Object.assign({}, all[index]);
  updated.status = status;
  updated.statusHistory = (updated.statusHistory || []).concat([
    {
      status,
      at: new Date().toISOString(),
      by: meta.by || 'system',
      note: meta.note || ''
    }
  ]);

  if (meta.paymentStatus) updated.paymentStatus = meta.paymentStatus;
  if (meta.tracking) updated.tracking = Object.assign({}, updated.tracking || {}, meta.tracking);

  all[index] = updated;
  saveAllOrders(all);
  return { ok: true, order: updated };
}

/* administrator-only order operations — requireAdmin() runs first */
function adminUpdateOrder(orderId, patch = {}) {
  const guard = requireAdmin();
  if (!guard.ok) return guard;

  const order = getOrderById(orderId);
  if (!order) return { ok: false, error: 'Order not found.' };

  if (patch.status) {
    const result = applyOrderStatusChange(order, patch.status, {
      by: 'admin',
      note: patch.note || '',
      paymentStatus: patch.paymentStatus,
      tracking: patch.tracking
    });
    if (!result.ok) return result;
    appendAudit('admin.order_status', `${orderId} → ${patch.status}`);
    return result;
  }

  if (patch.tracking || patch.paymentStatus) {
    const all = readAllOrders();
    const index = all.findIndex((o) => o.id === orderId);
    const updated = Object.assign({}, all[index]);
    if (patch.tracking) updated.tracking = Object.assign({}, updated.tracking || {}, patch.tracking);
    if (patch.paymentStatus) updated.paymentStatus = patch.paymentStatus;
    all[index] = updated;
    saveAllOrders(all);
    appendAudit('admin.order_update', `${orderId} tracking/payment updated`);
    return { ok: true, order: updated };
  }

  return { ok: false, error: 'Nothing to update.' };
}

/* ================= Profile ================= */

function getProfile() {
  const profile = readStore(STORE_KEYS.profile, null);
  if (profile && typeof profile === 'object') return profile;

  const acct = typeof getSessionAccount === 'function' ? getSessionAccount() : null;
  if (!acct) return null;
  return {
    firstName: acct.firstName || '',
    lastName: acct.lastName || '',
    fullName: acct.name || '',
    email: acct.email || '',
    phone: '',
    address: ''
  };
}

function saveProfile(profile) {
  if (!profile) {
    removeStore(STORE_KEYS.profile);
    return true;
  }
  const saved = writeStore(STORE_KEYS.profile, profile);
  if (saved && isAuthenticated() && typeof updateOwnProfileFields === 'function') {
    updateOwnProfileFields({
      name: profile.fullName || [profile.firstName, profile.lastName].filter(Boolean).join(' '),
      firstName: profile.firstName || '',
      lastName: profile.lastName || ''
    });
  }
  return saved;
}

/* first sign-in on a device: move the guest cart, wishlist, and profile
   into the new account so nothing the visitor built up is lost */
function adoptGuestData(userId, acct) {
  if (!userId) return false;
  const targetScope = userId;
  const hasData =
    localStorage.getItem(scopedKeyFor(targetScope, STORE_KEYS.cart)) !== null ||
    localStorage.getItem(scopedKeyFor(targetScope, STORE_KEYS.profile)) !== null ||
    readAllOrders().some((o) => o.userId === targetScope);

  if (hasData) return false;

  Object.keys(STORE_KEYS).forEach((logical) => {
    const guestRaw = localStorage.getItem(scopedKeyFor('guest', logical));
    if (guestRaw !== null) {
      localStorage.setItem(scopedKeyFor(targetScope, logical), guestRaw);
      localStorage.removeItem(scopedKeyFor('guest', logical));
    }
  });

  const all = readAllOrders();
  let moved = false;
  const next = all.map((o) => {
    if ((o.userId || 'guest') === 'guest') {
      moved = true;
      return Object.assign({}, o, { userId: targetScope });
    }
    return o;
  });
  if (moved) saveAllOrders(next);

  if (localStorage.getItem(scopedKeyFor(targetScope, STORE_KEYS.profile)) === null && acct) {
    localStorage.setItem(
      scopedKeyFor(targetScope, STORE_KEYS.profile),
      JSON.stringify({
        firstName: acct.firstName || '',
        lastName: acct.lastName || '',
        fullName: acct.name || '',
        email: acct.email || '',
        phone: '',
        address: ''
      })
    );
  }
  return true;
}

/* ================= Reviews ================= */

/* Stored reviews are user-editable data in this frontend-only demo. Normalise
   them on read so a tampered or stale entry can never crash a product page or
   bypass the rating/text rules used when a review is written. */
function getStoredReviews() {
  const reviews = [];
  readList(STORE_KEYS.reviews).forEach((r) => {
    if (!r || typeof r !== 'object' || typeof r.productId !== 'string') return;
    if (!findProduct(r.productId)) return;

    const rating = Number(r.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;

    const text = String(r.text == null ? '' : r.text).trim().slice(0, 600);
    if (!text) return;

    const date = String(r.date == null ? '' : r.date).trim().slice(0, 40);
    reviews.push({
      id: typeof r.id === 'string' ? r.id : '',
      productId: r.productId,
      author:
        String(r.author == null ? '' : r.author).trim().slice(0, 60) ||
        'StallFree shopper',
      rating,
      title: String(r.title == null ? '' : r.title).trim().slice(0, 80),
      text,
      date:
        date ||
        new Date().toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
      helpful: Number.isFinite(Number(r.helpful))
        ? Math.max(0, Math.floor(Number(r.helpful)))
        : 0,
      edited: r.edited === true,
      editedAt: String(r.editedAt == null ? '' : r.editedAt).trim().slice(0, 40),
      mine: r.mine !== false
    });
  });
  return reviews;
}

/* Review policy (demo): any visitor may review any live listing; reviews are
   stored per browser scope. Text is length-bounded and rendered escaped. */
function addReview(review) {
  if (!review || typeof review !== 'object') return null;
  const product = findProduct(review.productId);
  if (!product || !isListable(product)) return null;

  const rating = Number(review.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;

  const text = String(review.text || '').trim();
  if (text.length < 10 || text.length > 600) return null;

  const author = String(review.author || 'StallFree shopper').trim().slice(0, 60) || 'StallFree shopper';
  const title = String(review.title || '').trim().slice(0, 80);

  const list = getStoredReviews();
  list.unshift({
    id: 'ur-' + Date.now().toString(36) + '-' + randomHex(2),
    productId: product.id,
    author,
    rating,
    title,
    text,
    date: new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    helpful: 0,
    mine: true
  });
  if (!writeStore(STORE_KEYS.reviews, list)) return null;
  return list[0];
}

/* Edit one of this browser scope's own reviews. Reviews are stored per
   account/guest scope, so a review id from another account is never found
   here. Validation mirrors addReview and returns a result object so the
   product page can show a useful message instead of failing silently. */
function updateReview(reviewId, patch = {}) {
  const id = String(reviewId || '');
  if (!id) return { ok: false, error: 'That review could not be found.' };

  const list = getStoredReviews();
  const index = list.findIndex((r) => r.id === id && r.mine);
  if (index === -1) {
    return { ok: false, error: 'That review could not be found in this browser.' };
  }

  const current = list[index];
  const product = findProduct(current.productId);
  if (!product || !isListable(product)) {
    return { ok: false, error: 'This listing is no longer available for reviews.' };
  }

  const rating = Number(patch.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: 'Choose a rating from 1 to 5 stars.' };
  }

  const text = String(patch.text == null ? current.text : patch.text).trim();
  if (text.length < 10 || text.length > 600) {
    return {
      ok: false,
      error:
        text.length > 600
          ? 'Keep your review to 600 characters or fewer.'
          : 'Please write at least 10 characters.'
    };
  }

  const title = String(patch.title == null ? current.title : patch.title).trim().slice(0, 80);

  const updated = Object.assign({}, current, {
    rating,
    title,
    text,
    edited: true,
    editedAt: new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  });
  list[index] = updated;

  if (!writeStore(STORE_KEYS.reviews, list)) {
    return { ok: false, error: 'Could not save your review in this browser. Try freeing space.' };
  }
  return { ok: true, review: updated };
}

function getProductReviews(productId) {
  const mine = getStoredReviews().filter((r) => r.productId === productId);
  const seeded = seedReviews.filter((r) => r.productId === productId);
  return mine.concat(seeded);
}

/* weighted rating once the shopper has added their own review */
function getProductRating(productId) {
  const product = findProduct(productId);
  if (!product) return { rating: 0, count: 0 };
  const mine = getStoredReviews().filter((r) => r.productId === productId);
  if (!mine.length) return { rating: product.rating, count: product.reviews };
  const mineAvg = mine.reduce((s, r) => s + r.rating, 0) / mine.length;
  const count = product.reviews + mine.length;
  const rating =
    (product.rating * product.reviews + mineAvg * mine.length) / count;
  return { rating: Math.round(rating * 10) / 10, count };
}

function reviewCountByProduct() {
  return getStoredReviews().length;
}

/* ================= Recently viewed ================= */

function getRecent() {
  return readList(STORE_KEYS.recent).filter((id) => Boolean(findProduct(id)));
}

function pushRecent(productId) {
  if (!findProduct(productId)) return;
  const list = getRecent().filter((id) => id !== productId);
  list.unshift(productId);
  writeStore(STORE_KEYS.recent, list.slice(0, 12));
}

/* ================= Followed shops ================= */

function getFollows() {
  return readList(STORE_KEYS.follows).filter((id) => Boolean(findSeller(id)));
}

function isFollowing(sellerId) {
  return getFollows().includes(sellerId);
}

/* returns true when the shop is now followed */
function toggleFollow(sellerId) {
  if (!findSeller(sellerId)) return false;
  const list = getFollows();
  const index = list.indexOf(sellerId);
  let following;
  if (index >= 0) {
    list.splice(index, 1);
    following = false;
  } else {
    list.push(sellerId);
    following = true;
  }
  writeStore(STORE_KEYS.follows, list);
  return following;
}

function followerCount(sellerId) {
  const seller = findSeller(sellerId);
  if (!seller) return 0;
  return seller.followers + (isFollowing(sellerId) ? 1 : 0);
}

/* ================= Search history ================= */

function getRecentSearches() {
  return readList(STORE_KEYS.searches)
    .filter((s) => typeof s === 'string' && s.trim())
    .slice(0, 6);
}

function pushRecentSearch(query) {
  const value = String(query || '').trim();
  if (!value) return;
  const list = getRecentSearches().filter((s) => s.toLowerCase() !== value.toLowerCase());
  list.unshift(value);
  writeStore(STORE_KEYS.searches, list.slice(0, 6));
}

function clearRecentSearches() {
  writeStore(STORE_KEYS.searches, []);
}

/* ================= Demo data backup (admin only) =================
   Exports only non-credential local demo records. Accounts, password
   hashes/salts, sessions and setup material are deliberately excluded:
   they cannot be safely re-imported without a real identity service. */

const DEMO_BACKUP_VERSION = 1;

function demoBackupData() {
  const guard = requireAdmin();
  if (!guard.ok) return guard;
  return {
    ok: true,
    data: {
      app: 'StallFree',
      schemaVersion: DEMO_BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      excluded: ['accounts', 'sessions', 'password hashes', 'setup material'],
      orders: readAllOrders(),
      catalogOverrides: readCatalogOverrides(),
      customProducts: readGlobal(GLOBAL_KEYS.customProducts, []),
      shopOverrides: readGlobal(GLOBAL_KEYS.shopOverrides, {})
    }
  };
}

function validateDemoBackup(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, errors: ['The file is not a StallFree backup object.'] };
  }
  if (data.app !== 'StallFree') {
    return { ok: false, errors: ['This does not look like a StallFree demo backup.'] };
  }
  if (data.schemaVersion !== DEMO_BACKUP_VERSION) {
    return {
      ok: false,
      errors: [`Unsupported backup version ${String(data.schemaVersion)} (expected ${DEMO_BACKUP_VERSION}).`]
    };
  }
  const errors = [];
  if (data.orders !== undefined && !Array.isArray(data.orders)) errors.push('orders must be a list.');
  if (data.customProducts !== undefined && !Array.isArray(data.customProducts)) {
    errors.push('customProducts must be a list.');
  }
  if (data.catalogOverrides !== undefined && (typeof data.catalogOverrides !== 'object' || Array.isArray(data.catalogOverrides))) {
    errors.push('catalogOverrides must be an object.');
  }
  if (data.shopOverrides !== undefined && (typeof data.shopOverrides !== 'object' || Array.isArray(data.shopOverrides))) {
    errors.push('shopOverrides must be an object.');
  }
  (Array.isArray(data.orders) ? data.orders : []).forEach((order, index) => {
    if (!order || typeof order !== 'object' || !order.id || !Array.isArray(order.items)) {
      errors.push(`order ${index + 1} is missing an id or item list.`);
    }
  });
  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    summary: {
      orders: (data.orders || []).length,
      products: (data.customProducts || []).length,
      catalogOverrides: Object.keys(data.catalogOverrides || {}).length,
      shops: Object.keys(data.shopOverrides || {}).length
    }
  };
}

/* Import replaces local demo orders and catalogue overlays. Accounts are never
   touched. The caller must show a warning and obtain explicit confirmation. */
function importDemoData(data) {
  const guard = requireAdmin();
  if (!guard.ok) return guard;
  const checked = validateDemoBackup(data);
  if (!checked.ok) return { ok: false, error: checked.errors.join(' ') };

  if (!writeGlobal(GLOBAL_KEYS.orders, data.orders || [])) {
    return { ok: false, error: 'Could not save imported orders in this browser.' };
  }
  if (!writeGlobal(GLOBAL_KEYS.customProducts, data.customProducts || [])) {
    return { ok: false, error: 'Could not save imported products in this browser.' };
  }
  if (!writeGlobal(GLOBAL_KEYS.catalog, data.catalogOverrides || {})) {
    return { ok: false, error: 'Could not save imported catalogue overrides.' };
  }
  if (!writeGlobal(GLOBAL_KEYS.shopOverrides, data.shopOverrides || {})) {
    return { ok: false, error: 'Could not save imported shop overrides.' };
  }

  applyCatalogOverrides();
  appendAudit('admin.demo_import', `Imported backup ${data.exportedAt || ''}`.trim());
  return { ok: true, summary: checked.summary };
}

/* ================= Stats & reset ================= */

function getOrderStats() {
  const orders = getOrders();
  return {
    count: orders.length,
    totalSpent: orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0),
    itemsBought: orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + i.qty, 0), 0)
  };
}

/* deletes the signed-in account's local records (not the account itself) */
function clearAllData() {
  const scope = dataScope();
  Object.keys(STORE_KEYS).forEach((logical) => {
    try {
      localStorage.removeItem(scopedKeyFor(scope, logical));
    } catch (e) {
      /* ignore */
    }
  });
  if (scope !== 'guest') {
    saveAllOrders(readAllOrders().filter((o) => (o.userId || 'guest') !== scope));
  }
}

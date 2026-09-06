/* =====================================================================
   StallFree storage layer — all user data (cart, orders, profile)
   lives in the browser's localStorage so the site stays fully client-side.
   ===================================================================== */

const STORE_KEYS = {
  cart: 'stallfree_cart',
  orders: 'stallfree_orders',
  profile: 'stallfree_profile'
};

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ================= Cart ================= */

function getCart() {
  const cart = readStore(STORE_KEYS.cart, []);
  return Array.isArray(cart) ? cart : [];
}

function saveCart(cart) {
  writeStore(STORE_KEYS.cart, cart);
}

/* cart item shape: { productId, qty } */
function addToCart(productId, qty = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.productId === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ productId, qty });
  }
  saveCart(cart);
  refreshCartBadge();
}

function updateCartQty(productId, delta) {
  const cart = getCart();
  const existing = cart.find((item) => item.productId === productId);
  if (!existing) return;
  existing.qty += delta;
  if (existing.qty <= 0) {
    removeFromCart(productId);
    return;
  }
  saveCart(cart);
  refreshCartBadge();
  if (window.renderCart) renderCart();
}

function removeFromCart(productId) {
  saveCart(getCart().filter((item) => item.productId !== productId));
  refreshCartBadge();
  if (window.renderCart) renderCart();
}

function clearCart() {
  saveCart([]);
  refreshCartBadge();
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function getCartEntries() {
  return getCart()
    .map((item) => ({ product: findProduct(item.productId), qty: item.qty }))
    .filter((entry) => entry.product);
}

function getCartSubtotal() {
  return getCartEntries().reduce((sum, e) => sum + e.product.price * e.qty, 0);
}

/* ================= Orders ================= */

function getOrders() {
  return readStore(STORE_KEYS.orders, []);
}

function saveOrders(orders) {
  writeStore(STORE_KEYS.orders, orders);
}

function createOrder(customer) {
  const entries = getCartEntries();
  const subtotal = getCartSubtotal();
  const shipping = subtotal >= 1000 ? 0 : 75;
  const order = {
    id: 'SF-' + Date.now().toString().slice(-8),
    customer,
    items: entries.map((e) => ({
      productId: e.product.id,
      name: e.product.name,
      price: e.product.price,
      qty: e.qty,
      img: e.product.img
    })),
    subtotal,
    shipping,
    total: subtotal + shipping,
    status: 'Processing',
    date: new Date().toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  };
  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
  clearCart();
  return order;
}

/* ================= Profile ================= */

function getProfile() {
  return readStore(STORE_KEYS.profile, null);
}

function saveProfile(profile) {
  writeStore(STORE_KEYS.profile, profile);
}

/* ================= Order stats ================= */

function getOrderStats() {
  const orders = getOrders();
  return {
    count: orders.length,
    totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
    itemsBought: orders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0),
      0
    )
  };
}
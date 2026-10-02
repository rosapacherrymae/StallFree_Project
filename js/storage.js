/* =====================================================================
   StallFree storage layer — cart, wishlist, orders, profile, reviews,
   recently viewed, and followed shops all live in localStorage so the
   site stays 100% client-side with no backend.
   ===================================================================== */

const STORE_KEYS = {
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

const FREE_SHIPPING_THRESHOLD = 1000;
const FLAT_SHIPPING_FEE = 75;

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeStore(key, value) {
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

/* ================= Cart ================= */
/* cart item shape: { productId, qty } */

function getCart() {
  return readList(STORE_KEYS.cart);
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
  if (!product) return false;

  const cart = getCart();
  const existing = cart.find((item) => item.productId === productId);
  const inCart = existing ? existing.qty : 0;
  const nextQty = Math.min(inCart + Math.max(1, qty), product.stock);

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
  if (!product) return;
  const cart = getCart();
  const existing = cart.find((item) => item.productId === productId);
  if (!existing) return;

  existing.qty = Math.max(1, Math.min(qty, product.stock));
  saveCart(cart);
}

function updateCartQty(productId, delta) {
  const cart = getCart();
  const existing = cart.find((item) => item.productId === productId);
  if (!existing) return;
  setCartQty(productId, existing.qty + delta);
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
    .map((item) => ({
      product: findProduct(item.productId),
      qty: item.qty,
      note: cleanGiftNote(item.note)
    }))
    .filter((entry) => entry.product);
}

function getCartSubtotal() {
  return getCartEntries().reduce((sum, e) => sum + e.product.price * e.qty, 0);
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
  try {
    localStorage.removeItem(STORE_KEYS.coupon);
  } catch (e) {
    /* ignore */
  }
}

function couponDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  if (coupon.min && subtotal < coupon.min) return 0;
  if (coupon.type === 'percent') return Math.round((subtotal * coupon.value) / 100);
  if (coupon.type === 'fixed') return Math.min(coupon.value, subtotal);
  return 0;
}

function shippingFee(subtotal, coupon) {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  if (coupon && coupon.type === 'shipping') return 0;
  return subtotal > 0 ? FLAT_SHIPPING_FEE : 0;
}

function getTotals() {
  const subtotal = getCartSubtotal();
  const coupon = getAppliedCoupon();
  const discount = couponDiscount(coupon, subtotal);
  const shipping = shippingFee(subtotal - discount, coupon);
  return { subtotal, coupon, discount, shipping, total: subtotal - discount + shipping };
}

/* ================= Wishlist ================= */

function getWishlist() {
  return readList(STORE_KEYS.wishlist).filter((id) => Boolean(findProduct(id)));
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

function getOrders() {
  const orders = readList(STORE_KEYS.orders);
  return orders;
}

function saveOrders(orders) {
  writeStore(STORE_KEYS.orders, orders);
}

function createOrder(customer) {
  const entries = getCartEntries();
  if (!entries.length) return null;

  const totals = getTotals();
  const order = {
    id: 'SF-' + Date.now().toString().slice(-8),
    customer,
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
    total: totals.total,
    status: 'Processing',
    payment: customer.payment || 'Cash on delivery',
    date: new Date().toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    deliveryBy: new Date(Date.now() + 3 * 864e5).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  };

  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
  clearCart();
  clearCoupon();
  return order;
}

/* ================= Profile ================= */

function getProfile() {
  const profile = readStore(STORE_KEYS.profile, null);
  return profile && typeof profile === 'object' ? profile : null;
}

function saveProfile(profile) {
  writeStore(STORE_KEYS.profile, profile);
}

/* ================= Reviews ================= */

function getStoredReviews() {
  const list = readList(STORE_KEYS.reviews);
  return list.filter((r) => r && r.productId);
}

function addReview(review) {
  const list = getStoredReviews();
  list.unshift({
    id: 'ur-' + Date.now().toString(36),
    productId: review.productId,
    author: review.author,
    rating: Math.max(1, Math.min(5, Number(review.rating) || 5)),
    title: review.title || '',
    text: review.text,
    date: new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    helpful: 0,
    mine: true
  });
  writeStore(STORE_KEYS.reviews, list);
  return list[0];
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

function clearRecent() {
  writeStore(STORE_KEYS.recent, []);
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

function removeRecentSearch(query) {
  const value = String(query || '').trim();
  writeStore(
    STORE_KEYS.searches,
    getRecentSearches().filter((s) => s.toLowerCase() !== value.toLowerCase())
  );
}

function clearRecentSearches() {
  writeStore(STORE_KEYS.searches, []);
}

/* ================= Stats & reset ================= */

function getOrderStats() {
  const orders = getOrders();
  return {
    count: orders.length,
    totalSpent: orders.reduce((sum, o) => sum + (o.total || 0), 0),
    itemsBought: orders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0),
      0
    )
  };
}

function clearAllData() {
  Object.keys(STORE_KEYS).forEach((key) => {
    try {
      localStorage.removeItem(STORE_KEYS[key]);
    } catch (e) {
      /* ignore */
    }
  });
}

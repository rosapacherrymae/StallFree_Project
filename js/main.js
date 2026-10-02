/* =====================================================================
   StallFree main entry — per-page controllers.
   The active page comes from <body data-page="..."> and every page
   boots through the switch at the bottom of this file.
   ===================================================================== */

const page = document.body.dataset.page || 'home';
initSharedUI(page);

/* ================= Shared helpers ================= */

function param(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function setParam(name, value) {
  const el = document.getElementById(name);
  if (el) el.textContent = value;
}

function railScroll(railId, direction) {
  const rail = document.getElementById(railId);
  if (!rail) return;
  rail.scrollBy({ left: direction * Math.round(rail.clientWidth * 0.8), behavior: 'smooth' });
}

function ratingBreakdown(productId) {
  const p = findProduct(productId);
  const buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (!p) return buckets;

  const stars = [5, 4, 3, 2, 1];
  const total = Math.max(0, getProductRating(productId).count);

  const weights = stars.map((s) => Math.exp(-Math.pow(s - p.rating, 2) / 1.4));
  const weightSum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (w / weightSum) * total);

  /* largest-remainder rounding so the bars always add up to the total */
  const floors = raw.map((v) => Math.floor(v));
  let remainder = total - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  for (let k = 0; k < order.length && remainder > 0; k += 1) {
    floors[order[k].i] += 1;
    remainder -= 1;
  }

  stars.forEach((s, i) => {
    buckets[s] = floors[i];
  });
  return buckets;
}

/* ================= Home ================= */

function initHome() {
  const greeting = document.getElementById('greeting');
  const profile = getProfile();
  if (greeting && profile && profile.firstName) {
    greeting.textContent = `Welcome back, ${sanitize(profile.firstName)}!`;
  }

  const heroSearch = document.getElementById('hero-search');
  if (heroSearch) {
    heroSearch.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = document.getElementById('hero-search-input').value.trim();
      submitSearch(value);
    });
  }

  const featured = document.getElementById('home-featured');
  if (featured) {
    const list = [...products].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, 8);
    featured.innerHTML = list.map((p) => compactCard(p)).join('');
  }

  const deals = document.getElementById('home-deals');
  if (deals) {
    const list = [...products]
      .filter((p) => p.compareAt || p.badge === 'sale' || p.price <= 350)
      .sort((a, b) => a.price - b.price)
      .slice(0, 8);
    deals.innerHTML = list.map((p) => compactCard(p)).join('');
  }

  const fresh = document.getElementById('home-new');
  if (fresh) {
    const list = [...products].sort((a, b) => {
      const rank = (p) => (p.badge === 'new' ? 0 : 1);
      return rank(a) - rank(b) || b.sales - a.sales;
    }).slice(0, 8);
    fresh.innerHTML = list.map((p) => compactCard(p)).join('');
  }

  const cats = document.getElementById('home-categories');
  if (cats) cats.innerHTML = categories.map((c) => categoryTile(c)).join('');

  const catSub = document.getElementById('home-cat-sub');
  if (catSub) {
    const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
    catSub.textContent = `${words[categories.length] || categories.length} aisles, ${
      products.length
    } handmade listings.`;
  }

  const occ = document.getElementById('home-occasions');
  if (occ) occ.innerHTML = occasions.map((o) => occasionTile(o)).join('');

  const bands = document.getElementById('home-price');
  if (bands) bands.innerHTML = priceBands.map((b) => priceBandTile(b)).join('');

  const shops = document.getElementById('home-shops');
  if (shops) {
    const top = [...sellers]
      .sort((a, b) => sellerRating(b.id) - sellerRating(a.id))
      .slice(0, 4);
    shops.innerHTML = top.map((s) => shopCard(s)).join('');
  }

  renderRecentSection();
}

function renderRecentSection() {
  const wrap = document.getElementById('home-recent-section');
  const rail = document.getElementById('home-recent');
  if (!wrap || !rail) return;
  const list = getRecent().map((id) => findProduct(id)).filter(Boolean).slice(0, 8);
  if (!list.length) {
    wrap.classList.add('hidden');
    return;
  }
  wrap.classList.remove('hidden');
  rail.innerHTML = list.map((p) => compactCard(p)).join('');
}

/* ================= Products (search + filters) ================= */

const PRICE_RANGES = [
  { id: 'all', label: 'Any price' },
  { id: 'u250', label: 'Under ₱250' },
  { id: 'r250-500', label: '₱250 to ₱500' },
  { id: 'r500-1000', label: '₱500 to ₱1,000' },
  { id: 'o1000', label: '₱1,000 and up' },
  { id: 'custom', label: 'Custom range' }
];

const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Top rated' },
  { id: 'reviews', label: 'Most reviewed' },
  { id: 'popular', label: 'Best selling' },
  { id: 'name', label: 'Name: A-Z' }
];

let filters = {
  q: '',
  cats: [],
  price: 'all',
  min: '',
  max: '',
  rating: '0',
  free: false,
  top: false,
  badge: false,
  shops: [],
  sort: 'featured'
};
let shownCount = 12;
let pdpShots = [];

const FILTER_DEFAULTS = {
  q: '',
  cats: [],
  price: 'all',
  min: '',
  max: '',
  rating: '0',
  free: false,
  top: false,
  badge: false,
  shops: [],
  sort: 'featured'
};

function priceToRange(price) {
  if (price === 'u250') return { min: null, max: 250 };
  if (price === 'r250-500') return { min: 250, max: 500 };
  if (price === 'r500-1000') return { min: 500, max: 1000 };
  if (price === 'o1000') return { min: 1000, max: null };
  return { min: null, max: null };
}

function readFiltersFromUrl() {
  const sp = new URLSearchParams(window.location.search);
  const price = sp.get('price') || 'all';
  filters = {
    q: sp.get('q') || '',
    cats: (sp.get('cat') || sp.get('category') || '').split(',').filter(Boolean),
    price: PRICE_RANGES.some((r) => r.id === price) ? price : 'all',
    min: sp.get('min') || '',
    max: sp.get('max') || '',
    rating: ['0', '3', '4', '4.5'].includes(sp.get('rating')) ? sp.get('rating') : '0',
    free: sp.get('free') === '1',
    top: sp.get('top') === '1',
    badge: sp.get('badge') === '1',
    shops: (sp.get('shop') || '').split(',').filter(Boolean),
    sort: SORT_OPTIONS.some((s) => s.id === sp.get('sort')) ? sp.get('sort') : 'featured'
  };
}

function writeFiltersToUrl() {
  const sp = new URLSearchParams();
  if (filters.q) sp.set('q', filters.q);
  if (filters.cats.length) sp.set('cat', filters.cats.join(','));
  if (filters.price !== 'all') sp.set('price', filters.price);
  if (filters.price === 'custom') {
    if (filters.min) sp.set('min', filters.min);
    if (filters.max) sp.set('max', filters.max);
  }
  if (filters.rating !== '0') sp.set('rating', filters.rating);
  if (filters.free) sp.set('free', '1');
  if (filters.top) sp.set('top', '1');
  if (filters.badge) sp.set('badge', '1');
  if (filters.shops.length) sp.set('shop', filters.shops.join(','));
  if (filters.sort !== 'featured') sp.set('sort', filters.sort);

  const qs = sp.toString();
  try {
    window.history.replaceState(
      null,
      '',
      window.location.pathname + (qs ? '?' + qs : '') + window.location.hash
    );
  } catch (e) {
    /* file:// blocks replaceState in some browsers — filters still work */
  }
}

function filteredProducts() {
  let list = [...products];
  const query = filters.q.trim().toLowerCase();

  if (query) {
    list = list.filter((p) => {
      const cat = findCategory(p.categoryId);
      const shop = findSeller(p.sellerId);
      return [p.name, p.description, cat ? cat.name : '', shop ? shop.storeName : '', (p.tags || []).join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }
  if (filters.cats.length) list = list.filter((p) => filters.cats.includes(p.categoryId));
  if (filters.shops.length) list = list.filter((p) => filters.shops.includes(p.sellerId));
  if (filters.rating !== '0') list = list.filter((p) => p.rating >= Number(filters.rating));
  if (filters.top) list = list.filter((p) => isTopStall(p.sellerId));
  if (filters.badge) list = list.filter((p) => p.badge === 'bestseller');

  const range = priceToRange(filters.price);
  let min = range.min;
  let max = range.max;
  if (filters.price === 'custom') {
    min = filters.min === '' ? null : Number(filters.min);
    max = filters.max === '' ? null : Number(filters.max);
    if (min !== null && Number.isNaN(min)) min = null;
    if (max !== null && Number.isNaN(max)) max = null;
  }
  if (min !== null) list = list.filter((p) => p.price >= min);
  if (max !== null) list = list.filter((p) => p.price <= max);

  if (filters.free) list = list.filter((p) => p.freeShipping);

  switch (filters.sort) {
    case 'price-asc':
      list.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      list.sort((a, b) => b.rating - a.rating);
      break;
    case 'reviews':
      list.sort((a, b) => b.reviews - a.reviews);
      break;
    case 'popular':
      list.sort((a, b) => b.sales - a.sales);
      break;
    case 'name':
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      list.sort((a, b) => Number(b.badge === 'bestseller') - Number(a.badge === 'bestseller') || b.rating - a.rating);
      break;
  }
  return list;
}

/* one funnel for every filter change: URL -> pilters -> grid */
function applyFilters() {
  shownCount = 12;
  writeFiltersToUrl();
  renderPilters();
  renderProductsResults();
  renderActiveChips();
}

/* ---------------- Sticky quick-filter pills (Etsy-style "pilters") ---------------- */

const PILTERS = [
  { key: 'price:u250', label: 'Under ₱250' },
  { key: 'price:r250-500', label: '₱250 – ₱500' },
  { key: 'free', label: 'Free delivery' },
  { key: 'rating:4.5', label: '4.5★ & up' },
  { key: 'top', label: 'Top stalls' },
  { key: 'badge', label: 'Bestsellers' }
];

function pilterState(key) {
  const [group, value] = key.split(':');
  if (group === 'price') return filters.price === value;
  if (group === 'rating') return filters.rating === value;
  return Boolean(filters[group]);
}

function togglePilter(key) {
  const [group, value] = key.split(':');
  if (group === 'price') {
    filters.price = filters.price === value ? 'all' : value;
    if (filters.price !== 'custom') {
      filters.min = '';
      filters.max = '';
    }
  } else if (group === 'rating') {
    filters.rating = filters.rating === value ? '0' : value;
  } else if (group === 'free') {
    filters.free = !filters.free;
  } else if (group === 'top') {
    filters.top = !filters.top;
  } else if (group === 'badge') {
    filters.badge = !filters.badge;
  } else {
    return;
  }
  applyFilters();
}

function renderPilters() {
  const wrap = document.getElementById('pilters');
  if (!wrap) return;

  const pills = PILTERS.map((p) => {
    const active = pilterState(p.key);
    const count = pilterCount(p.key);
    return `
      <button type="button" class="pilter ${active ? 'is-active' : ''}" data-action="pilter"
        data-key="${sanitize(p.key)}" aria-pressed="${active}">
        ${sanitize(p.label)} <span class="pilter-count">${count}</span>
      </button>`;
  }).join('');

  wrap.innerHTML = pills;
}

/* how many results that pill would show on its own — the honesty cue Etsy uses */
function pilterCount(key) {
  const snapshot = { ...filters };
  const [group, value] = key.split(':');

  if (group === 'price') {
    filters.price = value;
    filters.min = '';
    filters.max = '';
  } else if (group === 'rating') {
    filters.rating = value;
  } else if (group === 'free') {
    filters.free = true;
  } else if (group === 'top') {
    filters.top = true;
  } else if (group === 'badge') {
    filters.badge = true;
  }

  const count = filteredProducts().length;
  Object.assign(filters, snapshot);
  return count;
}

/* ---------------- Related searches ---------------- */

function relatedSearchTerms(list) {
  const weights = new Map();
  const bump = (term, n) => {
    const t = String(term || '').trim();
    if (t.length < 3) return;
    weights.set(t, (weights.get(t) || 0) + n);
  };

  list.slice(0, 30).forEach((p) => {
    (p.tags || []).forEach((tag) => bump(tag, 3));
    const cat = findCategory(p.categoryId);
    if (cat) bump(cat.name.split(' & ')[0].split(' — ')[0], 2);
    const shop = findSeller(p.sellerId);
    if (shop) bump(shop.storeName, 1);
  });

  const current = filters.q.trim().toLowerCase();
  return [...weights.entries()]
    .filter(([term]) => term.toLowerCase() !== current)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([term]) => term);
}

function renderRelatedSearches(list) {
  const wrap = document.getElementById('related-searches');
  if (!wrap) return;

  if (list.length < 4) {
    wrap.innerHTML = '';
    wrap.classList.add('hidden');
    return;
  }

  const terms = relatedSearchTerms(list);
  if (!terms.length) {
    wrap.innerHTML = '';
    wrap.classList.add('hidden');
    return;
  }

  wrap.classList.remove('hidden');
  wrap.innerHTML = `
    <div class="section-header">
      <div>
        <h2>Explore related searches</h2>
        <p class="section-sub">Shoppers who looked at this also searched for…</p>
      </div>
    </div>
    <div class="related-chips">
      ${terms
        .map(
          (t) =>
            `<a class="chip chip-related" href="products.html?q=${encodeURIComponent(t)}">${ICONS.search}${sanitize(t)}</a>`
        )
        .join('')}
    </div>`;
}

function renderBrowseCrumb() {
  const wrap = document.getElementById('browse-crumb');
  if (!wrap) return;

  const parts = [{ label: 'Home', href: 'index.html' }];

  if (filters.cats.length === 1) {
    const cat = findCategory(filters.cats[0]);
    if (cat) parts.push({ label: cat.name, href: `products.html?cat=${encodeURIComponent(cat.id)}` });
    else parts.push({ label: 'All products', href: 'products.html' });
  } else {
    parts.push({ label: 'All products', href: 'products.html' });
  }

  if (filters.shops.length === 1) {
    const shop = findSeller(filters.shops[0]);
    if (shop) parts.push({ label: shop.storeName, href: shopHref(shop) });
  }

  if (filters.q) parts.push({ label: `Results for “${filters.q}”` });

  wrap.innerHTML = breadcrumb(parts);
}

function renderActiveChips() {
  const wrap = document.getElementById('active-chips');
  if (!wrap) return;
  const chips = [];

  if (filters.q) chips.push({ key: 'q', value: filters.q, label: `“${filters.q}”` });
  filters.cats.forEach((id) => {
    const c = findCategory(id);
    if (c) chips.push({ key: 'cat', value: id, label: c.name });
  });
  filters.shops.forEach((id) => {
    const s = findSeller(id);
    if (s) chips.push({ key: 'shop', value: id, label: s.storeName });
  });
  if (filters.price !== 'all') {
    const range = PRICE_RANGES.find((r) => r.id === filters.price);
    let label = range ? range.label : '';
    if (filters.price === 'custom') {
      const lo = filters.min ? formatPrice(filters.min) : '₱0';
      const hi = filters.max ? formatPrice(filters.max) : 'any';
      label = `${lo} – ${hi}`;
    }
    chips.push({ key: 'price', value: filters.price, label });
  }
  if (filters.rating !== '0') chips.push({ key: 'rating', value: filters.rating, label: `${filters.rating}+ stars` });
  if (filters.free) chips.push({ key: 'free', value: '1', label: 'Free delivery' });
  if (filters.top) chips.push({ key: 'top', value: '1', label: 'Top stalls' });
  if (filters.badge) chips.push({ key: 'badge', value: '1', label: 'Bestsellers' });

  if (!chips.length) {
    wrap.innerHTML = '';
    wrap.classList.add('hidden');
    return;
  }

  wrap.classList.remove('hidden');
  wrap.innerHTML =
    chips
      .map(
        (chip) => `
      <button class="chip chip-remove" data-action="chip-remove" data-key="${chip.key}" data-value="${sanitize(
          chip.value
        )}" aria-label="Remove filter ${sanitize(chip.label)}">
        ${sanitize(chip.label)} <span aria-hidden="true">×</span>
      </button>`
      )
      .join('') +
    `<button class="link-btn" data-action="clear-filters">Clear all</button>`;
}

function renderProductsResults() {
  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('results-count');
  const loadMore = document.getElementById('load-more');
  const titleEl = document.getElementById('results-title');
  const subEl = document.getElementById('results-sub');
  if (!grid) return;

  renderBrowseCrumb();

  const list = filteredProducts();
  const visible = list.slice(0, shownCount);

  if (titleEl) {
    if (filters.q) titleEl.textContent = `Results for “${filters.q}”`;
    else if (filters.cats.length === 1) {
      const cat = findCategory(filters.cats[0]);
      titleEl.textContent = cat ? cat.name : 'Products';
    } else if (filters.shops.length === 1) {
      const shop = findSeller(filters.shops[0]);
      titleEl.textContent = shop ? shop.storeName : 'Products';
    } else titleEl.textContent = 'All products';
  }
  if (subEl) {
    subEl.textContent = filters.q
      ? `Matching “${filters.q}” across ${sellers.length} local shops.`
      : 'Search, filter, and sort the full StallFree catalogue.';
  }
  if (countEl) {
    countEl.textContent = `${list.length} ${plural(list.length, 'result')}`;
  }

  grid.innerHTML = visible.length
    ? visible.map((p) => productCard(p)).join('')
    : emptyState(
        'No products match those filters',
        'Try widening the price range, clearing a filter, or searching a different word.',
        'Clear all filters',
        null,
        'clear-filters'
      );

  if (loadMore) {
    const remaining = list.length - visible.length;
    loadMore.classList.toggle('hidden', remaining <= 0);
    loadMore.textContent = `Load more (${remaining} left)`;
  }

  renderRelatedSearches(list);
}

/* products.html hosts both views — the query param picks the winner */
function initProductsPage() {
  const browse = document.getElementById('browse-page');
  const detail = document.getElementById('product-page');
  const searchInput = document.getElementById('site-search');
  const id = param('id');

  if (id) {
    if (browse) browse.classList.add('hidden');
    if (detail) detail.classList.remove('hidden');
    if (searchInput) searchInput.value = '';
    initProduct();
    return;
  }

  if (detail) detail.classList.add('hidden');
  if (browse) browse.classList.remove('hidden');
  initProducts();
}

/* called by the sign-in modal so the home greeting updates without a reload */
function onProfileChange() {
  if (page !== 'home') return;
  const greeting = document.getElementById('greeting');
  const profile = getProfile();
  if (greeting && profile && profile.firstName) {
    greeting.textContent = `Welcome back, ${sanitize(profile.firstName)}!`;
  }
}

function initProducts() {
  readFiltersFromUrl();
  renderBrowseCrumb();
  renderPilters();

  const searchInput = document.getElementById('site-search');
  if (searchInput) searchInput.value = filters.q;

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.value = filters.sort;
    sortSelect.addEventListener('change', () => {
      filters.sort = sortSelect.value;
      applyFilters();
    });
  }

  const loadMore = document.getElementById('load-more');
  if (loadMore) {
    loadMore.addEventListener('click', () => {
      shownCount += 12;
      renderProductsResults();
    });
  }

  renderActiveChips();
  renderProductsResults();
}

function clearFilters() {
  filters = { ...FILTER_DEFAULTS };
  shownCount = 12;
  const searchInput = document.getElementById('site-search');
  if (searchInput) searchInput.value = '';
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'featured';

  applyFilters();
}

function removeChip(key, value) {
  if (key === 'q') {
    filters.q = '';
    const searchInput = document.getElementById('site-search');
    if (searchInput) searchInput.value = '';
  } else if (key === 'cat') {
    filters.cats = filters.cats.filter((id) => id !== value);
  } else if (key === 'shop') {
    filters.shops = filters.shops.filter((id) => id !== value);
  } else if (key === 'price') {
    filters.price = 'all';
    filters.min = '';
    filters.max = '';
  } else if (key === 'rating') {
    filters.rating = '0';
  } else if (key === 'free') {
    filters.free = false;
  } else if (key === 'top') {
    filters.top = false;
  } else if (key === 'badge') {
    filters.badge = false;
  }

  applyFilters();
}

/* ================= Product detail ================= */

function initProduct() {
  const mount = document.getElementById('product-page');
  if (!mount) return;

  const id = param('id');
  const p = id ? findProduct(id) : null;

  if (!p) {
    mount.innerHTML = emptyState(
      'That listing has moved on',
      'It may have sold out or the link is out of date. Browse the full catalogue instead.',
      'Back to all products',
      'products.html'
    );
    return;
  }

  pushRecent(p.id);

  const shop = findSeller(p.sellerId);
  const cat = findCategory(p.categoryId);
  const wished = isWished(p.id);
  const rating = getProductRating(p.id);
  const reviews = getProductReviews(p.id);
  const inCart = getCart().find((i) => i.productId === p.id);
  const savePct = p.compareAt && p.compareAt > p.price ? Math.round((1 - p.price / p.compareAt) * 100) : 0;

  document.title = `${p.name} | StallFree`;

  const crumbs = [
    { label: 'Home', href: 'index.html' },
    { label: 'All products', href: 'products.html' }
  ];
  if (cat) crumbs.push({ label: cat.name, href: `products.html?cat=${encodeURIComponent(cat.id)}` });
  if (shop) crumbs.push({ label: shop.storeName, href: shopHref(shop) });
  crumbs.push({ label: p.name });

  const shots = galleryPhotos(p.photo);
  pdpShots = shots;

  const knowCards = [
    { icon: ICONS.bag, label: 'Ready to ship', value: p.processing },
    {
      icon: ICONS.truck,
      label: 'Delivery',
      value: p.freeShipping ? 'Free nationwide' : `${formatPrice(FLAT_SHIPPING_FEE)} nationwide`
    },
    {
      icon: ICONS.shield,
      label: 'Stock',
      value: p.stock <= 25 ? `Only ${p.stock} left` : `${p.stock} available`
    }
  ];

  const detailRows = [
    { label: 'Materials', value: p.materials },
    { label: 'Category', value: cat ? cat.name : '—' },
    { label: 'Ships from', value: shop ? shop.location : 'Philippines' },
    { label: 'Returns', value: shop ? shop.policies.returns : '7-day returns' }
  ];

  mount.innerHTML = `
    ${breadcrumb(crumbs)}

    <div class="pdp">
      <div class="pdp-gallery">
        <div class="pdp-thumbs" id="pdp-thumbs" role="tablist" aria-label="Listing photos">
          ${shots
            .map(
              (src, i) => `
            <button type="button" class="pdp-thumb ${i === 0 ? 'is-active' : ''}" role="tab"
              aria-selected="${i === 0}" data-action="pdp-shot" data-index="${i}"
              aria-label="Photo ${i + 1} of ${shots.length}">
              <img src="${src}" alt="" loading="lazy"
                   onload="this.classList.add('is-loaded')" onerror="this.remove()" />
            </button>`
            )
            .join('')}
        </div>
        <div class="pdp-stage">
          <div class="pdp-image" style="${gradient(categoryColors(p.categoryId))}">
            <span class="pc-letter" aria-hidden="true">${sanitize(p.name.charAt(0))}</span>
            <img id="pdp-hero" src="${shots[0]}" alt="${sanitize(p.name)}"
                 onload="this.classList.add('is-loaded')" onerror="this.remove()" />
            ${badgeMarkup(p)}
          </div>
          <p class="muted small pdp-caption">${ICONS.spark} Photo taken in our studio — colours may vary slightly by screen.</p>
        </div>
      </div>

      <div class="pdp-summary">
        <p class="pdp-shop-line">
          <a href="${shop ? shopHref(shop) : '#'}">${sanitize(shop ? shop.storeName : 'StallFree')}</a>
          ${shop ? topStallChip(shop.id) : ''}
          <span class="muted">·</span>
          <span class="muted">${ICONS.pin} ${sanitize(shop ? shop.location : '')}</span>
        </p>
        <h1 class="pdp-title">${sanitize(p.name)}</h1>

        <div class="pdp-rating" id="pdp-rating">
          ${ratingLine(rating.rating, rating.count)}
          <a href="#reviews" class="link-btn">Read ${reviews.length} ${plural(
          reviews.length,
          'review'
        )}</a>
          <span class="muted">·</span>
          <span class="muted">${p.sales} sold</span>
        </div>

        <div class="pdp-price">
          <span class="price price-lg">${formatPrice(p.price)}</span>
          ${p.compareAt ? `<s class="price-was">${formatPrice(p.compareAt)}</s>` : ''}
          ${savePct ? `<span class="chip chip-sale">Save ${savePct}%</span>` : ''}
        </div>
        <p class="muted small">Tax included. ${p.freeShipping ? 'Free delivery on this item.' : 'Delivery calculated at checkout.'}</p>
      </div>

      <aside class="pdp-buybox" aria-label="Buy this listing">
        <div class="buybox-inner">
          <div class="buybox-row">
            <span class="form-label">Quantity</span>
            <div class="stepper" role="group" aria-label="Quantity">
              <button type="button" data-action="qty-step" data-step="-1" data-target="pdp-qty" data-product="${
                p.id
              }" aria-label="Decrease quantity">−</button>
              <span id="pdp-qty" aria-live="polite">1</span>
              <button type="button" data-action="qty-step" data-step="1" data-target="pdp-qty" data-product="${
                p.id
              }" aria-label="Increase quantity">+</button>
            </div>
            <span class="muted small">${p.stock} in stock</span>
          </div>

          <button class="btn btn-primary btn-lg btn-block" data-action="pdp-add" data-id="${p.id}">
            ${ICONS.bag} ${inCart ? 'Add another to cart' : 'Add to cart'}
          </button>
          <button class="btn btn-dark btn-block" data-action="buy-now" data-id="${p.id}">Buy it now</button>
          <button class="btn btn-outline btn-block pdp-save ${wished ? 'is-wished' : ''}" data-action="fav"
            data-id="${p.id}" data-name="${sanitize(p.name)}" aria-pressed="${wished}"
            aria-label="${wished ? 'Remove ' : 'Save '}${sanitize(p.name)}">
            <span class="fav-ico" aria-hidden="true">${wished ? ICONS.heart : ICONS.heartOutline}</span>
            <span class="fav-label" data-off="Save for later">${wished ? 'Saved' : 'Save for later'}</span>
          </button>

          <ul class="buybox-trust">
            <li>${ICONS.truck}<span><b>${
              p.freeShipping ? 'Free nationwide delivery' : `Delivery ${formatPrice(FLAT_SHIPPING_FEE)}`
            }</b><small>Ready to ship in ${sanitize(p.processing)}</small></span></li>
            <li>${ICONS.shield}<span><b>Buyer protection</b><small>Refund or replacement if it arrives damaged</small></span></li>
            <li>${ICONS.check}<span><b>Verified local stall</b><small>Message the seller any time before it ships</small></span></li>
          </ul>
        </div>
      </aside>

      <div class="pdp-detail">
        <p class="pdp-desc">${sanitize(p.description)}</p>

        <h2 class="pdp-subhead">What to know</h2>
        <div class="know-grid">
          ${knowCards
            .map(
              (c) => `
            <div class="know-card">
              <span class="know-icon" aria-hidden="true">${c.icon}</span>
              <span class="know-label">${sanitize(c.label)}</span>
              <b class="know-value">${sanitize(c.value)}</b>
            </div>`
            )
            .join('')}
        </div>

        <div class="gift-box">
          <div class="gift-head">
            <span class="gift-title">${ICONS.spark} Add a gift message</span>
            <span class="gift-tools">
              <button type="button" class="link-btn hidden" id="pdp-gift-clear" data-action="gift-clear">Clear</button>
              <span class="gift-count" id="pdp-gift-count">0 / 200</span>
            </span>
          </div>
          <label class="sr-only" for="pdp-gift">Gift message</label>
          <textarea id="pdp-gift" class="textarea" rows="3" maxlength="200"
            placeholder="Happy birthday, Ate! Hope this brightens your day."></textarea>
          <p class="muted small">The stall hand-writes this on a card — free, and it never leaves your browser.</p>
        </div>

        <h2 class="pdp-subhead">Item details</h2>
        <ul class="spec-list">
          ${detailRows
            .map((r) => `<li><span>${sanitize(r.label)}</span><b>${sanitize(r.value)}</b></li>`)
            .join('')}
        </ul>

        ${
          shop
            ? `
          <div class="card seller-strip">
            <span class="shop-avatar" style="${gradient(shop.colors)}">${sanitize(shop.storeName.charAt(0))}</span>
            <div class="seller-strip-info">
              <h3><a href="${shopHref(shop)}">${sanitize(shop.storeName)}</a> ${topStallChip(shop.id)}</h3>
              <p class="muted small">${sanitize(shop.tagline)}</p>
              <div class="shop-stats">${ratingLine(sellerRating(shop.id))} <span class="muted small">${followerCount(
                shop.id
              ).toLocaleString()} followers</span></div>
            </div>
            <div class="seller-strip-actions">
              <button class="btn btn-sm ${isFollowing(shop.id) ? 'btn-outline' : 'btn-primary'}" data-action="follow"
                data-id="${shop.id}">${isFollowing(shop.id) ? 'Following' : 'Follow shop'}</button>
              <button class="btn btn-sm btn-outline" data-action="modal-message" data-id="${shop.id}">${ICONS.chat} Message</button>
            </div>
          </div>`
            : ''
        }
      </div>
    </div>

    <section class="section" id="reviews">
      <div class="section-header">
        <h2>Customer reviews</h2>
        <span class="muted small">Showing ${reviews.length} of ${rating.count} ${plural(
      rating.count,
      'review'
    )}</span>
      </div>

      <div class="review-themes" id="review-themes"></div>

      <div class="reviews-layout">
        <div class="card review-summary">
          <div class="review-score">
            <span class="score">${rating.rating.toFixed(1)}</span>
            ${starRow(rating.rating)}
            <p class="muted small">${rating.count} ${plural(rating.count, 'review')}</p>
          </div>
          <div class="review-bars" id="review-bars"></div>
          <button class="btn btn-outline btn-block" data-action="focus-review">Write a review</button>
        </div>

        <div class="review-main">
          <form class="card review-form" id="review-form" novalidate>
            <h3>Write a review</h3>
            <div class="form-group">
              <span class="form-label">Your rating *</span>
              <div class="star-picker" id="star-picker" role="radiogroup" aria-label="Rating">
                ${[5, 4, 3, 2, 1]
                  .map(
                    (n) => `
                  <label class="star-option">
                    <input type="radio" name="review-rating" value="${n}" />
                    <span aria-hidden="true">★</span>
                    <span class="sr-only">${n} ${plural(n, 'star')}</span>
                  </label>`
                  )
                  .join('')}
              </div>
              <p class="field-error hidden" id="review-rating-error">Please choose a star rating.</p>
            </div>
            <div class="form-group">
              <label for="review-title">Title</label>
              <input type="text" id="review-title" class="input" placeholder="Sum it up in a few words" maxlength="70" />
            </div>
            <div class="form-group">
              <label for="review-text">Your review *</label>
              <textarea id="review-text" class="textarea" rows="4" maxlength="600"
                placeholder="What did you like? How was the quality and delivery?"></textarea>
              <p class="field-error hidden" id="review-text-error">Please write at least 10 characters.</p>
            </div>
            <button type="submit" class="btn btn-primary">Post review</button>
            <p class="muted small">Posting as <b id="review-author-name">${sanitize(
              (getProfile() && getProfile().firstName) || 'a StallFree shopper'
            )}</b> — you can change this in your profile.</p>
          </form>

          <div class="review-toolbar">
            <label for="review-sort" class="muted small">Sort</label>
            <select id="review-sort" class="select select-sm">
              <option value="helpful">Most helpful</option>
              <option value="recent">Most recent</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
            </select>
          </div>
          <div id="review-list" class="review-list"></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>More from ${sanitize(shop ? shop.storeName : 'this shop')}</h2>
        ${shop ? `<a class="btn btn-outline btn-sm" href="${shopHref(shop)}">Visit shop</a>` : ''}
      </div>
      <div class="rail-wrap">
        <button class="rail-btn prev" data-action="rail-prev" data-rail="pdp-shop-rail" aria-label="Scroll left">${ICONS.chevronLeft}</button>
        <div class="rail" id="pdp-shop-rail">${
          shop
            ? productsBySeller(shop.id)
                .filter((x) => x.id !== p.id)
                .slice(0, 8)
                .map((x) => compactCard(x))
                .join('')
            : ''
        }</div>
        <button class="rail-btn next" data-action="rail-next" data-rail="pdp-shop-rail" aria-label="Scroll right">${ICONS.chevronRight}</button>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>You may also like</h2>
        <a class="btn btn-outline btn-sm" href="products.html?cat=${encodeURIComponent(p.categoryId)}">See all</a>
      </div>
      <div class="grid products-grid" id="pdp-related">${relatedList(p)
        .map((x) => productCard(x))
        .join('')}</div>
    </section>

    <section class="section" id="pdp-recent-section">
      <div class="section-header">
        <h2>Recently viewed</h2>
        <a class="btn btn-outline btn-sm" href="products.html">Browse more</a>
      </div>
      <div class="rail-wrap">
        <button class="rail-btn prev" data-action="rail-prev" data-rail="pdp-recent" aria-label="Scroll left">${ICONS.chevronLeft}</button>
        <div class="rail" id="pdp-recent"></div>
        <button class="rail-btn next" data-action="rail-next" data-rail="pdp-recent" aria-label="Scroll right">${ICONS.chevronRight}</button>
      </div>
    </section>`;

  renderReviewBars(p);
  renderReviewThemes(p);
  renderReviewList(p);
  renderPdpRecent(p);

  const sortSelect = document.getElementById('review-sort');
  if (sortSelect) sortSelect.addEventListener('change', () => renderReviewList(p));

  const form = document.getElementById('review-form');
  if (form) form.addEventListener('submit', (e) => onReviewSubmit(e, p));

  const gift = document.getElementById('pdp-gift');
  if (gift) {
    gift.addEventListener('input', updateGiftCount);
    updateGiftCount();
  }
}

/* Gallery: swap the hero image for the thumbnail the visitor picked */
function showPdpShot(index) {
  const hero = document.getElementById('pdp-hero');
  if (!hero || !pdpShots[index]) return;
  hero.src = pdpShots[index];
  hero.classList.remove('is-loaded');
  document.querySelectorAll('#pdp-thumbs .pdp-thumb').forEach((btn) => {
    const active = Number(btn.dataset.index) === index;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
  });
}

function updateGiftCount() {
  const gift = document.getElementById('pdp-gift');
  const count = document.getElementById('pdp-gift-count');
  const clear = document.getElementById('pdp-gift-clear');
  if (!gift || !count) return;
  count.textContent = `${gift.value.length} / 200`;
  count.classList.toggle('is-near', gift.value.length >= 160);
  if (clear) clear.classList.toggle('hidden', gift.value.length === 0);
}

function clearGiftNote() {
  const gift = document.getElementById('pdp-gift');
  if (!gift) return;
  gift.value = '';
  gift.focus();
  updateGiftCount();
}

function giftNoteValue() {
  const gift = document.getElementById('pdp-gift');
  const note = gift ? gift.value.trim() : '';
  return note.slice(0, 200);
}

/* same aisle first, then top-rated elsewhere so the grid is never sparse */
function relatedList(product) {
  const same = products.filter((x) => x.categoryId === product.categoryId && x.id !== product.id);
  const rest = products
    .filter((x) => x.categoryId !== product.categoryId && x.id !== product.id)
    .sort((a, b) => b.rating - a.rating || b.sales - a.sales);
  return same.concat(rest).slice(0, 4);
}

function renderPdpRecent(product) {
  const wrap = document.getElementById('pdp-recent-section');
  const rail = document.getElementById('pdp-recent');
  if (!wrap || !rail) return;

  const list = getRecent()
    .filter((id) => id !== product.id)
    .map((id) => findProduct(id))
    .filter(Boolean)
    .slice(0, 8);

  if (!list.length) {
    wrap.classList.add('hidden');
    return;
  }
  wrap.classList.remove('hidden');
  rail.innerHTML = list.map((x) => compactCard(x)).join('');
}

/* Etsy-style aggregated theme scores derived from the real review average so
   the cards can never contradict the star breakdown next to them. */
function reviewThemes(product) {
  const base = getProductRating(product.id).rating || product.rating || 4.5;
  const clamp = (v) => Math.min(5, Math.max(1, Math.round(v * 10) / 10));
  return [
    { label: 'Item quality', score: clamp(base + 0.1) },
    { label: 'Shipping', score: clamp(base + (product.freeShipping ? 0.15 : -0.1)) },
    { label: 'Customer service', score: clamp(base + 0.05) },
    { label: 'Overall recommendation', score: clamp(base - 0.05) }
  ];
}

function renderReviewThemes(product) {
  const wrap = document.getElementById('review-themes');
  if (!wrap) return;
  const themes = reviewThemes(product);
  const recommend = Math.round((themes[3].score / 5) * 100);

  wrap.innerHTML = `
    ${themes
      .map(
        (t) => `
      <div class="theme-card">
        <span class="theme-label">${sanitize(t.label)}</span>
        <span class="theme-score">${t.score.toFixed(1)}</span>
        ${starRow(t.score)}
        <span class="theme-track"><span class="theme-fill" style="width:${Math.round(
          (t.score / 5) * 100
        )}%"></span></span>
      </div>`
      )
      .join('')}
    <div class="theme-card theme-card-promote">
      <span class="theme-label">Shoppers recommend this listing</span>
      <span class="theme-score">${recommend}%</span>
      <p class="muted small">Based on ${product.sales} sold and the reviews below.</p>
    </div>`;
}

function renderReviewBars(product) {
  const wrap = document.getElementById('review-bars');
  if (!wrap) return;
  const rating = getProductRating(product.id);
  const buckets = ratingBreakdown(product.id);
  const total = Math.max(1, rating.count);

  wrap.innerHTML = [5, 4, 3, 2, 1]
    .map((stars) => {
      const count = buckets[stars];
      const pct = Math.round((count / total) * 100);
      return `
        <div class="bar-row">
          <span class="bar-label">${stars} ★</span>
          <span class="bar-track"><span class="bar-fill" style="width:${pct}%"></span></span>
          <span class="bar-count muted small">${count}</span>
        </div>`;
    })
    .join('');
}

function renderReviewList(product) {
  const list = document.getElementById('review-list');
  if (!list) return;
  const sort = (document.getElementById('review-sort') || {}).value || 'helpful';
  const reviews = getProductReviews(product.id).slice();

  if (sort === 'highest') reviews.sort((a, b) => b.rating - a.rating);
  else if (sort === 'lowest') reviews.sort((a, b) => a.rating - b.rating);
  else if (sort === 'recent') reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
  else reviews.sort((a, b) => (b.helpful || 0) - (a.helpful || 0));

  list.innerHTML = reviews.length
    ? reviews.map((r) => reviewCard(r)).join('')
    : `<p class="muted">No reviews yet — be the first to share what you think.</p>`;
}

function onReviewSubmit(e, product) {
  e.preventDefault();
  const ratingInput = document.querySelector('input[name="review-rating"]:checked');
  const textEl = document.getElementById('review-text');
  const titleEl = document.getElementById('review-title');
  const ratingError = document.getElementById('review-rating-error');
  const textError = document.getElementById('review-text-error');

  ratingError.classList.add('hidden');
  textError.classList.add('hidden');

  let ok = true;
  if (!ratingInput) {
    ratingError.classList.remove('hidden');
    ok = false;
  }
  const text = textEl.value.trim();
  if (text.length < 10) {
    textError.classList.remove('hidden');
    ok = false;
  }
  if (!ok) {
    (ratingInput ? textEl : document.querySelector('input[name="review-rating"]')).focus();
    return;
  }

  const profile = getProfile();
  const author =
    (profile && profile.firstName ? profile.firstName.trim() : '') ||
    'StallFree shopper';

  addReview({
    productId: product.id,
    author,
    rating: Number(ratingInput.value),
    title: titleEl.value.trim(),
    text
  });

  e.target.reset();

  const name = document.getElementById('review-author-name');
  if (name) name.textContent = author;

  renderReviewBars(product);
  renderReviewList(product);

  const rating = getProductRating(product.id);
  const pdpRating = document.getElementById('pdp-rating');
  if (pdpRating) {
    pdpRating.innerHTML = `${ratingLine(rating.rating, rating.count)} <a href="#reviews" class="link-btn">Read ${
      getProductReviews(product.id).length
    } reviews</a> <span class="muted">·</span> <span class="muted">${product.sales} sold</span>`;
  }

  toast('Thanks — your review is live!', 'success');
}

/* ================= Product page actions ================= */

function pdpQuantity() {
  const el = document.getElementById('pdp-qty');
  return el ? Math.max(1, parseInt(el.textContent, 10) || 1) : 1;
}

/* ================= Categories ================= */

function initCategories() {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;
  grid.innerHTML = categories
    .map(
      (c) => `
      <article class="card cat-card">
        <a class="cat-card-tile" href="products.html?cat=${encodeURIComponent(c.id)}" style="${gradient(c.colors)}">
          <img src="${photoUrl(c.tile, 640)}" alt="${sanitize(c.name)}" loading="lazy"
               onload="this.classList.add('is-loaded')" onerror="this.remove()" />
        </a>
        <div class="cat-card-body">
          <h3><a href="products.html?cat=${encodeURIComponent(c.id)}">${sanitize(c.name)}</a></h3>
          <p class="muted small">${sanitize(c.blurb)}</p>
          <div class="cat-card-foot">
            <span class="chip">${categoryCount(c.id)} ${plural(categoryCount(c.id), 'item')}</span>
            <a class="link-btn" href="products.html?cat=${encodeURIComponent(c.id)}">Shop now →</a>
          </div>
        </div>
      </article>`
    )
    .join('');
}

/* ================= Sellers directory ================= */

function initSellers() {
  const grid = document.getElementById('sellers-grid');
  if (!grid) return;
  const followed = getFollows();

  grid.innerHTML = sellers.map((s) => shopCard(s)).join('');

  const band = document.getElementById('followed-band');
  if (band) {
    if (!followed.length) {
      band.classList.add('hidden');
    } else {
      band.classList.remove('hidden');
      band.innerHTML = `
        <div class="card banner-inline">
          <span>${ICONS.heart} You follow ${followed.length} ${plural(followed.length, 'shop')}:</span>
          ${followed
            .map((id) => {
              const s = findSeller(id);
              return s ? `<a class="chip" href="${shopHref(s)}">${sanitize(s.storeName)}</a>` : '';
            })
            .join('')}
        </div>`;
    }
  }
}

/* ================= Shop storefront ================= */

let shopCategory = 'all';
let shopList = [];

function initShop() {
  const mount = document.getElementById('shop-page');
  if (!mount) return;

  const id = param('id');
  const shop = id ? findSeller(id) : null;

  if (!shop) {
    mount.innerHTML = emptyState(
      'Shop not found',
      'This stall may have closed. Explore the other shops on StallFree.',
      'All shops',
      'sellers.html'
    );
    return;
  }

  document.title = `${shop.storeName} | StallFree`;
  shopCategory = 'all';

  const list = productsBySeller(shop.id);
  shopList = list;
  const usedCats = categories.filter((c) => list.some((p) => p.categoryId === c.id));
  const shopReviews = list
    .map((p) => getProductReviews(p.id).map((r) => Object.assign({ product: p }, r)))
    .flat()
    .sort((a, b) => (b.helpful || 0) - (a.helpful || 0))
    .slice(0, 3);
  const following = isFollowing(shop.id);

  mount.innerHTML = `
    ${breadcrumb([
      { label: 'Home', href: 'index.html' },
      { label: 'Shops', href: 'sellers.html' },
      { label: shop.storeName }
    ])}

    <div class="shop-hero card">
      <div class="shop-hero-cover" style="${gradient(shop.colors)}">
        <img src="${photoUrl(shop.cover, 1200)}" alt="" onload="this.classList.add('is-loaded')" onerror="this.remove()" />
      </div>
      <div class="shop-hero-body">
        <span class="shop-avatar lg" style="${gradient(shop.colors)}" aria-hidden="true">${sanitize(
    shop.storeName.charAt(0)
  )}</span>
        <div class="shop-hero-info">
          <h1>${sanitize(shop.storeName)}</h1>
          <p class="muted">${sanitize(shop.tagline)}</p>
          <div class="shop-stats">
            ${ratingLine(sellerRating(shop.id))}
            <span class="muted small">${sellerProductCount(shop.id)} ${plural(
    sellerProductCount(shop.id),
    'item'
  )}</span>
            <span class="muted small">${sellerSales(shop.id).toLocaleString()} sold</span>
            <span class="muted small" id="shop-followers">${followerCount(shop.id).toLocaleString()} followers</span>
            <span class="muted small">${ICONS.pin} ${sanitize(shop.location)}</span>
          </div>
        </div>
        <div class="shop-hero-actions">
          <button class="btn ${following ? 'btn-outline' : 'btn-primary'}" data-action="follow" data-id="${shop.id}">${
    following ? 'Following' : 'Follow shop'
  }</button>
          <button class="btn btn-outline" data-action="modal-message" data-id="${shop.id}">${ICONS.chat} Message</button>
        </div>
      </div>
      <div class="shop-policy-row">
        <span>${ICONS.bag} ${sanitize(shop.policies.processing)}</span>
        <span>${ICONS.truck} ${sanitize(shop.policies.shipping)}</span>
        <span>${ICONS.shield} ${sanitize(shop.policies.returns)}</span>
        <span class="muted small">Stall open since ${shop.since}</span>
      </div>
    </div>

    <section class="section">
      <div class="section-header">
        <h2>All items</h2>
        <div class="tabs" id="shop-tabs">
          <button class="tab active" data-action="shop-tab" data-cat="all">All (${list.length})</button>
          ${usedCats
            .map(
              (c) =>
                `<button class="tab" data-action="shop-tab" data-cat="${c.id}">${sanitize(c.name)} (${
                  list.filter((p) => p.categoryId === c.id).length
                })</button>`
            )
            .join('')}
        </div>
      </div>
      <div class="grid products-grid" id="shop-grid"></div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>What buyers say</h2>
        <span class="muted small">${ratingLine(sellerRating(shop.id))}</span>
      </div>
      <div class="grid reviews-grid">
        ${
          shopReviews.length
            ? shopReviews
                .map(
                  (r) => `
          <article class="card review-card">
            <div class="review-head">
              <span class="avatar avatar-sm">${sanitize(r.author.charAt(0).toUpperCase())}</span>
              <div>
                <strong>${sanitize(r.author)}</strong>
                <div class="review-meta">${ratingLine(r.rating)} <span class="muted">${sanitize(r.date)}</span></div>
              </div>
            </div>
            <p class="review-text">${sanitize(r.text)}</p>
            <a class="link-btn small" href="${productHref(r.product)}">${sanitize(r.product.name)} →</a>
          </article>`
                )
                .join('')
            : '<p class="muted">No reviews yet for this shop.</p>'
        }
      </div>
    </section>`;

  renderShopGrid(list);
}

function renderShopGrid(list) {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;
  const visible = shopCategory === 'all' ? list : list.filter((p) => p.categoryId === shopCategory);
  grid.innerHTML = visible.length
    ? visible.map((p) => productCard(p)).join('')
    : emptyState('Nothing in this aisle yet', 'Check back soon — new pieces are listed weekly.');
}

/* ================= Wishlist ================= */

function initWishlist() {
  renderWishlist();
}

function renderWishlist() {
  const grid = document.getElementById('wishlist-grid');
  const head = document.getElementById('wishlist-head');
  if (!grid) return;

  const items = getWishlistProducts();

  if (head) {
    head.innerHTML = items.length
      ? `<span class="muted">${items.length} ${plural(items.length, 'saved item')}</span>
         <button class="btn btn-sm btn-danger" data-action="clear-wishlist">Clear all</button>`
      : '';
  }

  grid.innerHTML = items.length
    ? items
        .map(
          (p) => `
      <div class="wish-item">
        ${productCard(p)}
        <div class="wish-actions">
          <button class="btn btn-sm btn-primary btn-block" data-action="add-cart" data-id="${p.id}">${ICONS.bag} Add to cart</button>
          <button class="btn btn-sm btn-outline btn-block" data-action="unsave" data-id="${p.id}">Remove</button>
        </div>
      </div>`
        )
        .join('')
    : emptyState(
        'Nothing saved yet',
        'Tap the heart on any listing to keep it here for later.',
        'Find something you love',
        'products.html'
      );
}

function onWishlistChange() {
  if (page === 'wishlist') renderWishlist();
  if (page === 'home') renderRecentSection();
}

function onFollowChange() {
  if (page === 'sellers') initSellers();
  if (page === 'shop') {
    const el = document.getElementById('shop-followers');
    const id = param('id');
    if (el && id) el.textContent = `${followerCount(id).toLocaleString()} followers`;
  }
}

/* ================= Orders (cart + checkout + history) ================= */

function initOrders() {
  renderCart();

  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) checkoutBtn.addEventListener('click', toggleCheckout);

  const form = document.getElementById('checkout-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      placeOrder();
    });
  }

  renderOrderHistory();

  /* "Buy it now" lands on orders.html#checkout — open the form for them */
  if (window.location.hash === '#checkout') {
    if (getCartEntries().length) toggleCheckout();
    else {
      const cart = document.getElementById('cart');
      if (cart) cart.scrollIntoView({ block: 'start' });
    }
  }
}

function renderCart() {
  const list = document.getElementById('cart-list');
  if (!list) return;

  const entries = getCartEntries();
  const countEl = document.getElementById('cart-count');
  const summary = document.getElementById('cart-summary');
  const checkoutBtn = document.getElementById('checkout-btn');
  const checkoutForm = document.getElementById('checkout-form');

  if (countEl) {
    const n = entries.reduce((s, e) => s + e.qty, 0);
    countEl.textContent = `${n} ${plural(n, 'item')}`;
  }

  if (!entries.length) {
    list.innerHTML = emptyState(
      'Your cart is empty',
      'Browse the marketplace and add something handmade.',
      'Start shopping',
      'products.html'
    );
    if (summary) summary.innerHTML = '';
    if (checkoutBtn) checkoutBtn.classList.add('hidden');
    if (checkoutForm) checkoutForm.classList.add('hidden');
    const couponArea = document.getElementById('coupon-area');
    if (couponArea) couponArea.classList.add('hidden');
    return;
  }

  if (checkoutBtn) checkoutBtn.classList.remove('hidden');
  const couponArea = document.getElementById('coupon-area');
  if (couponArea) couponArea.classList.remove('hidden');

  list.innerHTML = entries
    .map(({ product: p, qty, note }) => {
      const shop = findSeller(p.sellerId);
      return `
      <article class="card cart-item">
        <a class="cart-thumb" href="${productHref(p)}" style="${gradient(categoryColors(p.categoryId))}">
          <span class="pc-letter" aria-hidden="true">${sanitize(p.name.charAt(0))}</span>
          <img src="${photoUrl(p.photo, 200)}" alt="${sanitize(p.name)}" loading="lazy"
               onload="this.classList.add('is-loaded')" onerror="this.remove()" />
        </a>
        <div class="cart-item-info">
          <p class="muted small">${sanitize(shop ? shop.storeName : '')}</p>
          <h4><a href="${productHref(p)}">${sanitize(p.name)}</a></h4>
          <p class="muted small">${ICONS.truck} ${p.freeShipping ? 'Free delivery' : 'Standard delivery'} · ${sanitize(
        p.processing
      )}</p>
          ${
            note
              ? `<div class="cart-note">
                  ${ICONS.spark}<span class="cart-note-text">“${sanitize(note)}”</span>
                  <button class="link-btn" data-action="cart-note-remove" data-id="${p.id}"
                    aria-label="Remove gift message">Remove</button>
                </div>`
              : ''
          }
          <div class="cart-item-controls">
            <div class="stepper">
              <button type="button" data-action="cart-qty" data-id="${p.id}" data-step="-1" aria-label="Decrease quantity">−</button>
              <span aria-live="polite">${qty}</span>
              <button type="button" data-action="cart-qty" data-id="${p.id}" data-step="1" aria-label="Increase quantity">+</button>
            </div>
            <button class="link-btn" data-action="cart-remove" data-id="${p.id}">Remove</button>
            <span class="muted small">${formatPrice(p.price)} each</span>
          </div>
        </div>
        <div class="cart-line-price">${formatPrice(p.price * qty)}</div>
      </article>`;
    })
    .join('');

  renderCartSummary();
  renderCouponArea();
}

function renderCartSummary() {
  const summary = document.getElementById('cart-summary');
  if (!summary) return;
  const totals = getTotals();

  summary.innerHTML = `
    <div class="summary-row"><span>Subtotal</span><span>${formatPrice(totals.subtotal)}</span></div>
    ${
      totals.discount
        ? `<div class="summary-row discount"><span>Discount (${sanitize(
            totals.coupon.code
          )})</span><span>-${formatPrice(totals.discount)}</span></div>`
        : ''
    }
    <div class="summary-row"><span>Delivery</span><span>${
      totals.shipping === 0 ? 'Free' : formatPrice(totals.shipping)
    }</span></div>
    <div class="summary-row summary-total"><span>Total</span><span>${formatPrice(totals.total)}</span></div>
    <p class="muted small">${
      totals.shipping === 0 ? 'You unlocked free nationwide delivery.' : `Add ${formatPrice(
        Math.max(0, FREE_SHIPPING_THRESHOLD - totals.subtotal)
      )} more for free delivery.`
    }</p>`;
}

function renderCouponArea() {
  const area = document.getElementById('coupon-area');
  if (!area) return;
  const coupon = getAppliedCoupon();

  area.innerHTML = coupon
    ? `<div class="coupon-applied">
         <span>${ICONS.check} Code <b>${sanitize(coupon.code)}</b> — ${sanitize(coupon.label)}</span>
         <button class="link-btn" data-action="remove-coupon">Remove</button>
       </div>`
    : `<label class="sr-only" for="coupon-input">Discount code</label>
       <div class="coupon-row">
         <input type="text" id="coupon-input" class="input" placeholder="Discount code (try WELCOME10)" />
         <button class="btn btn-outline" id="coupon-apply" data-action="apply-coupon">Apply</button>
       </div>
       <p class="muted small">Codes: WELCOME10 · STALL50 · FREESHIP</p>`;

  const applyBtn = document.getElementById('coupon-apply');
  if (applyBtn) applyBtn.addEventListener('click', applyCouponCode);
  const couponInput = document.getElementById('coupon-input');
  if (couponInput) {
    couponInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyCouponCode();
      }
    });
  }
}

function applyCouponCode() {
  const input = document.getElementById('coupon-input');
  if (!input) return;
  const result = applyCoupon(input.value);
  if (!result.ok) {
    toast(result.message, 'error');
    input.focus();
    return;
  }
  toast(`${result.coupon.code} applied — ${result.coupon.label}`, 'success');
  renderCartSummary();
  renderCouponArea();
}

function removeCoupon() {
  clearCoupon();
  toast('Discount code removed', 'success');
  renderCartSummary();
  renderCouponArea();
}

function toggleCheckout() {
  const form = document.getElementById('checkout-form');
  if (!form) return;
  const opening = form.classList.contains('hidden');
  form.classList.toggle('hidden', !opening);

  if (opening) {
    const profile = getProfile();
    if (profile) {
      const name = document.getElementById('co-name');
      const phone = document.getElementById('co-phone');
      const address = document.getElementById('co-address');
      if (name && profile.fullName) name.value = profile.fullName;
      if (phone && profile.phone) phone.value = profile.phone;
      if (address && profile.address) address.value = profile.address;
    }
    const first = form.querySelector('input, textarea');
    if (first) first.focus();
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function setFieldError(id, hasError) {
  const field = document.getElementById(id);
  const error = document.getElementById(id + '-error');
  if (error) error.classList.toggle('hidden', !hasError);
  if (field) field.setAttribute('aria-invalid', String(hasError));
}

function placeOrder() {
  const name = document.getElementById('co-name');
  const phone = document.getElementById('co-phone');
  const address = document.getElementById('co-address');
  if (!name || !phone || !address) return;

  const nameValue = name.value.trim();
  const phoneValue = phone.value.trim();
  const addressValue = address.value.trim();
  const paymentInput = document.querySelector('input[name="payment"]:checked');

  setFieldError('co-name', !nameValue);
  setFieldError('co-phone', !phoneValue || phoneValue.replace(/\D/g, '').length < 7);
  setFieldError('co-address', !addressValue);

  const paymentError = document.getElementById('payment-error');
  if (paymentError) paymentError.classList.toggle('hidden', Boolean(paymentInput));

  const formError = document.getElementById('checkout-error');

  if (!nameValue || phoneValue.replace(/\D/g, '').length < 7 || !addressValue || !paymentInput) {
    if (formError) formError.classList.remove('hidden');
    const firstInvalid =
      (!nameValue && name) ||
      (phoneValue.replace(/\D/g, '').length < 7 && phone) ||
      (!addressValue && address) ||
      null;
    if (firstInvalid) firstInvalid.focus();
    return;
  }
  if (formError) formError.classList.add('hidden');

  const note = document.getElementById('co-note');
  const order = createOrder({
    name: nameValue,
    phone: phoneValue,
    address: addressValue,
    note: note ? note.value.trim() : '',
    payment: paymentInput ? paymentInput.value : 'Cash on delivery'
  });

  if (!order) {
    toast('Your cart is empty.', 'error');
    renderCart();
    return;
  }

  name.value = '';
  phone.value = '';
  address.value = '';
  if (note) note.value = '';
  const cod = document.querySelector('input[name="payment"][value="Cash on delivery"]');
  if (cod) cod.checked = true;

  const banner = document.getElementById('order-banner');
  if (banner) {
    banner.classList.remove('hidden');
    banner.innerHTML = `${ICONS.check} <span><b>Thank you! Order ${sanitize(order.id)} is confirmed.</b>
      Total ${formatPrice(order.total)} · ${sanitize(order.payment)} · estimated delivery ${sanitize(order.deliveryBy)}</span>`;
  }

  renderCart();
  renderOrderHistory();
  refreshCartBadge();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  toast('Order placed successfully', 'success');
}

function renderOrderHistory() {
  const container = document.getElementById('order-history');
  if (!container) return;

  const orders = getOrders();
  const emptyEl = document.getElementById('history-empty');
  if (emptyEl) emptyEl.classList.toggle('hidden', orders.length > 0);

  if (!orders.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = orders
    .map((o) => {
      const statusClass =
        o.status === 'Delivered' ? 'status-delivered' : o.status === 'Shipped' ? 'status-shipped' : 'status-processing';
      return `
      <article class="card order-card">
        <div class="order-head">
          <div>
            <span class="order-id">${sanitize(o.id)}</span>
            <span class="muted small"> · ${sanitize(o.date)}</span>
          </div>
          <span class="status ${statusClass}">${sanitize(o.status)}</span>
        </div>

        <div class="order-thumbs">
          ${o.items
            .slice(0, 5)
            .map(
              (i) => `
            <a class="order-thumb" href="products.html?id=${encodeURIComponent(i.productId)}"
               style="${gradient(categoryColors(i.categoryId))}" title="${sanitize(i.name)}">
              <span class="pc-letter">${sanitize(i.name.charAt(0))}</span>
              <img src="${photoUrl(i.photo, 120)}" alt="${sanitize(i.name)}" loading="lazy"
                   onload="this.classList.add('is-loaded')" onerror="this.remove()" />
            </a>`
            )
            .join('')}
          <span class="muted small order-more">${
            o.items.length > 5 ? `+${o.items.length - 5} more` : ''
          }</span>
        </div>

        <p class="order-items">${o.items
          .map((i) => `${sanitize(i.name)} ×${i.qty}`)
          .join(' · ')}</p>

        ${
          o.items.some((i) => i.note)
            ? `<ul class="order-notes">
            ${o.items
              .filter((i) => i.note)
              .map(
                (i) =>
                  `<li>${ICONS.spark} <span>“${sanitize(i.note)}”</span> <span class="muted small">— on ${sanitize(i.name)}</span></li>`
              )
              .join('')}
          </ul>`
            : ''
        }

        <div class="order-foot">
          <div class="muted small">
            <div>Deliver to: ${sanitize(o.customer.address)}</div>
            <div>${sanitize(o.payment)}${
        o.coupon ? ` · code ${sanitize(o.coupon)} applied` : ''
      } · arrives by <b>${sanitize(o.deliveryBy || '—')}</b></div>
          </div>
          <div class="order-total">
            <span class="price">${formatPrice(o.total)}</span>
            <button class="btn btn-sm btn-outline" data-action="reorder" data-id="${sanitize(o.id)}">Buy again</button>
          </div>
        </div>
      </article>`;
    })
    .join('');
}

function reorder(orderId) {
  const order = getOrders().find((o) => o.id === orderId);
  if (!order) return;
  let added = 0;
  order.items.forEach((item) => {
    if (addToCart(item.productId, item.qty, item.note)) added += 1;
  });
  if (!added) {
    toast('Those items are already in your cart.', 'error');
    return;
  }
  toast(`${added} ${plural(added, 'item')} added back to your cart`, 'success');
  renderCart();
  const cart = document.getElementById('cart');
  if (cart) cart.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ================= Profile ================= */

function initProfile() {
  const profile = getProfile();
  if (profile) {
    const map = {
      'p-first': profile.firstName || '',
      'p-last': profile.lastName || '',
      'p-phone': profile.phone || '',
      'p-address': profile.address || ''
    };
    Object.keys(map).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = map[id];
    });
  }

  renderProfileStats();
  renderOrderHistory();

  const form = document.getElementById('profile-form');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveProfileForm();
  });
}

function renderProfileStats() {
  const stats = getOrderStats();
  const wishCount = getWishlistCount();
  const followCount = getFollows().length;
  const reviewCount = reviewCountByProduct();

  const values = {
    'stat-count': stats.count,
    'stat-spent': formatPrice(stats.totalSpent),
    'stat-items': stats.itemsBought,
    'stat-wishes': wishCount,
    'stat-follows': followCount,
    'stat-reviews': reviewCount
  };
  Object.keys(values).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = values[id];
  });
}

function saveProfileForm() {
  const firstName = document.getElementById('p-first');
  const lastName = document.getElementById('p-last');
  const phone = document.getElementById('p-phone');
  const address = document.getElementById('p-address');
  const error = document.getElementById('profile-error');

  const firstValue = firstName ? firstName.value.trim() : '';
  if (!firstValue) {
    if (error) error.classList.remove('hidden');
    if (firstName) firstName.focus();
    return;
  }
  if (error) error.classList.add('hidden');

  saveProfile({
    firstName: firstValue,
    lastName: lastName ? lastName.value.trim() : '',
    fullName: [firstValue, lastName ? lastName.value.trim() : ''].filter(Boolean).join(' '),
    phone: phone ? phone.value.trim() : '',
    address: address ? address.value.trim() : ''
  });

  /* keep the header greeting in sync without a reload */
  const accountLabel = document.querySelector('.account-label');
  if (accountLabel) accountLabel.textContent = firstValue;

  const banner = document.getElementById('profile-banner');
  if (banner) {
    banner.classList.remove('hidden');
    banner.innerHTML = `${ICONS.check} Profile saved. Your details will auto-fill at checkout.`;
    setTimeout(() => banner.classList.add('hidden'), 4000);
  }
  toast('Profile saved', 'success');
}

/* ================= Page-level action router ================= */

function handlePageAction(action, el, e) {
  const id = el.dataset.id;

  switch (action) {
    case 'rail-prev':
      railScroll(el.dataset.rail, -1);
      break;
    case 'rail-next':
      railScroll(el.dataset.rail, 1);
      break;
    case 'clear-filters':
      clearFilters();
      break;
    case 'pilter':
      togglePilter(el.dataset.key);
      break;
    case 'shop-tab': {
      shopCategory = el.dataset.cat || 'all';
      const tabs = document.getElementById('shop-tabs');
      if (tabs) tabs.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === el));
      renderShopGrid(shopList);
      break;
    }
    case 'pdp-shot':
      showPdpShot(Number(el.dataset.index));
      break;
    case 'gift-clear':
      clearGiftNote();
      break;
    case 'chip-remove':
      removeChip(el.dataset.key, el.dataset.value);
      break;
    case 'qty-step': {
      const target = document.getElementById(el.dataset.target);
      const product = findProduct(el.dataset.product);
      if (!target) break;
      const max = product ? product.stock : 99;
      const next = (parseInt(target.textContent, 10) || 1) + Number(el.dataset.step);
      target.textContent = String(Math.max(1, Math.min(next, max)));
      break;
    }
    case 'pdp-add': {
      const qty = pdpQuantity();
      const note = giftNoteValue();
      const added = addToCart(id, qty, note);
      const p = findProduct(id);
      toast(
        added ? `${qty} × ${p.name} added to your cart${note ? ' with your gift message' : ''}` : 'That quantity exceeds our stock.',
        added ? 'success' : 'error'
      );
      break;
    }
    case 'buy-now': {
      const qty = pdpQuantity();
      if (!addToCart(id, qty, giftNoteValue())) {
        toast('That quantity exceeds our stock.', 'error');
        break;
      }
      window.location.href = 'orders.html#checkout';
      break;
    }
    case 'cart-note-remove':
      removeCartItemNote(id);
      renderCart();
      toast('Gift message removed from this item', 'success');
      break;
    case 'cart-qty':
      updateCartQty(id, Number(el.dataset.step));
      renderCart();
      break;
    case 'cart-remove':
      removeFromCart(id);
      renderCart();
      toast('Item removed from your cart', 'success');
      break;
    case 'remove-coupon':
      removeCoupon();
      break;
    case 'reorder':
      reorder(id);
      break;
    case 'unsave':
      removeFromWishlist(id);
      syncWishButtons(id);
      renderWishlist();
      refreshWishlistBadge();
      toast('Removed from your saved items', 'success');
      break;
    case 'clear-wishlist':
      confirmDialog('Clear saved items?', 'This removes everything from your list.', 'Clear all', () => {
        clearWishlist();
        renderWishlist();
        toast('Saved items cleared', 'success');
      });
      break;
    case 'focus-review': {
      const picker = document.querySelector('input[name="review-rating"]');
      const form = document.getElementById('review-form');
      if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (picker) picker.focus();
      break;
    }
    case 'clear-data':
      confirmDialog(
        'Delete all local data?',
        'Cart, saved items, orders, reviews, and your profile will be erased from this browser.',
        'Delete everything',
        () => {
          clearAllData();
          toast('All local data deleted', 'success');
          setTimeout(() => window.location.reload(), 600);
        }
      );
      break;
    default:
      break;
  }
}

/* ================= Bootstrap by page ================= */

switch (page) {
  case 'home':
    initHome();
    break;
  case 'products':
    /* one file, two views: ?id= renders the listing, otherwise the browse grid */
    initProductsPage();
    break;
  case 'categories':
    initCategories();
    break;
  case 'sellers':
    initSellers();
    break;
  case 'shop':
    initShop();
    break;
  case 'wishlist':
    initWishlist();
    break;
  case 'orders':
    initOrders();
    break;
  case 'profile':
    initProfile();
    break;
  default:
    break;
}

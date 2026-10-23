/* =====================================================================
   StallFree administrator dashboard — the single-admin console.

   Every mutating call funnels through requireAdmin() inside storage.js
   and auth.js, so a hand-crafted request from the console still fails
   for non-admin sessions. This file only renders and collects input.

   Loaded solely by admin.html (before main.js).
   ===================================================================== */

let adminTab = 'overview';
let adminProductQuery = '';
let adminProductCategory = 'all';
let adminProductStock = 'all';
let adminShowHidden = false;
let adminOrderFilter = 'all';
let adminOrderQuery = '';
let adminOrderSort = 'newest';
let adminOrderDate = 'all';
let adminCustomerQuery = '';
let adminAuditFilter = 'all';
let adminAuditDate = 'all';

const ADMIN_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders' },
  { id: 'products', label: 'Products' },
  { id: 'shops', label: 'Shops' },
  { id: 'customers', label: 'Customers' },
  { id: 'audit', label: 'Audit log' }
];

/* ---------------- Entry ---------------- */

function initAdmin() {
  const mount = document.getElementById('admin-mount');
  if (!mount) return;

  /* one-time bootstrap — closes forever once an admin exists. A signed-in
     customer must never see the setup form: sign out first so the owner
     ceremony cannot be performed from a normal shopper account. */
  if (!adminExists()) {
    if (isAuthenticated()) {
      document.title = 'Access denied | StallFree';
      mount.innerHTML = emptyState(
        'Administrator access required',
        'This account is a customer account. Sign out if you are the site owner and need to run the one-time administrator setup in this browser.',
        'Back to home',
        'index.html'
      );
      return;
    }
    document.title = 'Administrator setup | StallFree';
    mount.innerHTML = adminSetupMarkup();
    bindAdminSetup();
    return;
  }

  if (!isAuthenticated()) {
    document.title = 'Sign in required | StallFree';
    mount.innerHTML = emptyState(
      'Please sign in',
      'The dashboard is limited to the designated administrator account.',
      'Sign in',
      'login.html?next=admin.html'
    );
    return;
  }

  if (!isAdmin()) {
    document.title = 'Access denied | StallFree';
    mount.innerHTML = emptyState(
      'Administrator access required',
      'This account does not have dashboard permissions. Contact the site owner if you think this is wrong.',
      'Back to home',
      'index.html'
    );
    return;
  }

  document.title = 'Admin dashboard | StallFree';
  adminTab = 'overview';
  mount.innerHTML = adminShellMarkup();
  bindAdminTabs();
  renderAdminPanel();
}

/* ---------------- One-time setup ---------------- */

function adminSetupMarkup() {
  return `
    <div class="auth-wrap">
      <section class="card auth-card">
        <span class="auth-badge" aria-hidden="true">S</span>
        <h1 class="auth-title">Administrator setup</h1>
        <p class="muted small auth-sub">
          One-time bootstrap for this browser. Choose a demo setup passphrase, then create
          the single administrator account. The form closes permanently once that account
          exists.
        </p>
        <div class="banner demo-banner" role="note">
          <b>Demo only.</b> A frontend passphrase is not real security — anyone with access
          to this browser profile can inspect or edit local data. Never use real payment or
          contact details here.
        </div>
        <div class="banner hidden" id="admin-banner" role="alert"></div>
        <form id="admin-setup-form" novalidate>
          <div class="form-group">
            <label for="as-key">Setup passphrase (demo) *</label>
            <input type="password" id="as-key" class="input" autocomplete="off"
              placeholder="At least 10 characters" />
            <button type="button" class="link-btn pw-toggle" data-toggle-password="as-key">Show passphrase</button>
            <p class="field-error hidden" id="as-key-error"></p>
            <p class="muted small form-hint">
              Choose your own phrase. It is not compared with any value shipped in the code
              and is not shown anywhere else on the site.
            </p>
          </div>
          <div class="form-group">
            <label for="as-name">Full name *</label>
            <input type="text" id="as-name" class="input" placeholder="Site Owner" autocomplete="name" />
            <p class="field-error hidden" id="as-name-error"></p>
          </div>
          <div class="form-group">
            <label for="as-email">Email address *</label>
            <input type="email" id="as-email" class="input" placeholder="admin@example.com" autocomplete="email" />
            <p class="field-error hidden" id="as-email-error"></p>
          </div>
          <div class="form-group">
            <label for="as-password">Password *</label>
            <input type="password" id="as-password" class="input" autocomplete="new-password" />
            <button type="button" class="link-btn pw-toggle" data-toggle-password="as-password">Show</button>
            <p class="field-error hidden" id="as-password-error"></p>
            <p class="muted small form-hint">At least 8 characters, with a letter and a number.</p>
          </div>
          <div class="form-group">
            <label for="as-confirm">Confirm password *</label>
            <input type="password" id="as-confirm" class="input" autocomplete="new-password" />
            <button type="button" class="link-btn pw-toggle" data-toggle-password="as-confirm">Show</button>
            <p class="field-error hidden" id="as-confirm-error"></p>
          </div>
          <button type="submit" class="btn btn-primary btn-block" id="as-submit">Create administrator</button>
        </form>
      </section>
    </div>`;
}

function bindAdminSetup() {
  const form = document.getElementById('admin-setup-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    ['key', 'name', 'email', 'password', 'confirm'].forEach((f) =>
      setAuthFieldError('as-' + f, '')
    );
    setAuthBanner('admin-banner', '');

    const btn = document.getElementById('as-submit');
    setAuthBusy(btn, true, 'Creating…');
    try {
      const result = await adminSetup({
        key: (document.getElementById('as-key') || {}).value || '',
        name: (document.getElementById('as-name') || {}).value || '',
        email: (document.getElementById('as-email') || {}).value || '',
        password: (document.getElementById('as-password') || {}).value || '',
        confirm: (document.getElementById('as-confirm') || {}).value || ''
      });

      if (!result.ok) {
        if (result.field) setAuthFieldError('as-' + result.field, result.message);
        else setAuthBanner('admin-banner', result.message);
        return;
      }

      toast('Administrator account created — welcome!', 'success');
      initAdmin();
    } catch (err) {
      setAuthBanner('admin-banner', 'Setup failed unexpectedly. Please try again.');
    } finally {
      setAuthBusy(btn, false);
    }
  });
}

/* ---------------- Shell ---------------- */

function adminShellMarkup() {
  const acct = getSessionAccount();
  const tabs = ADMIN_TABS.map(
    (t) => `
      <button type="button" class="tab ${t.id === adminTab ? 'active' : ''}" data-tab="${t.id}"
        role="tab" aria-selected="${t.id === adminTab}">${t.label}</button>`
  ).join('');

  return `
    <div class="page-head">
      <div>
        <h1>Administrator dashboard</h1>
        <p class="tagline">Signed in as ${sanitize(acct ? acct.email : 'admin')} · single-admin build</p>
      </div>
      <a href="index.html" class="btn btn-outline">View storefront</a>
    </div>

    <div class="banner hidden" id="admin-banner" role="alert"></div>

    <div class="tabs admin-tabs" role="tablist" aria-label="Dashboard sections" id="admin-tabs">${tabs}</div>

    <div id="admin-panel" role="tabpanel"></div>`;
}

function bindAdminTabs() {
  const bar = document.getElementById('admin-tabs');
  if (!bar) return;
  bar.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      adminTab = btn.dataset.tab;
      bar.querySelectorAll('.tab').forEach((b) => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', String(on));
      });
      renderAdminPanel();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function renderAdminPanel() {
  const panel = document.getElementById('admin-panel');
  if (!panel) return;
  adminBanner('');

  switch (adminTab) {
    case 'orders':
      renderAdminOrders(panel);
      break;
    case 'products':
      renderAdminProducts(panel);
      break;
    case 'shops':
      renderAdminShops(panel);
      break;
    case 'customers':
      renderAdminCustomers(panel);
      break;
    case 'audit':
      renderAdminAudit(panel);
      break;
    default:
      renderAdminOverview(panel);
      break;
  }
}

function adminBanner(message, isError) {
  const banner = document.getElementById('admin-banner');
  if (!banner) return;
  banner.textContent = message || '';
  banner.classList.toggle('hidden', !message);
  if (isError) {
    banner.style.background = 'var(--danger-soft)';
    banner.style.color = 'var(--danger)';
  } else {
    banner.style.background = '';
    banner.style.color = '';
  }
}

/* ---------------- Overview ---------------- */

function adminLowStock() {
  return dedupeById(products)
    .filter(isListable)
    .map((p) => ({ product: p, left: productStock(p.id) }))
    .filter((row) => row.left <= 5)
    .sort((a, b) => a.left - b.left);
}

function renderAdminOverview(panel) {
  const orders = getAllOrders();
  const delivered = orders.filter((o) => normalizeOrderStatus(o) === 'delivered');
  const pending = orders.filter((o) => {
    const m = statusMeta(o.status);
    return m.flow > 0 && m.id !== 'delivered';
  });
  const revenue = delivered.reduce((sum, o) => sum + (o.total || 0), 0);
  const customers = listAccounts().filter((a) => a.role !== 'admin').length;
  const liveProducts = dedupeById(products).filter(isListable).length;
  const shops = sellers.length;
  const low = adminLowStock();
  const recent = orders.slice(0, 5);

  panel.innerHTML = `
    <div class="stats-grid">
      <div class="card stat-card">
        <div class="stat">${orders.length}</div>
        <div class="muted">Orders total</div>
      </div>
      <div class="card stat-card">
        <div class="stat">${pending.length}</div>
        <div class="muted">Awaiting delivery</div>
      </div>
      <div class="card stat-card">
        <div class="stat">${formatPrice(revenue)}</div>
        <div class="muted">Simulated delivered revenue</div>
      </div>
      <div class="card stat-card">
        <div class="stat">${liveProducts}</div>
        <div class="muted">Live products</div>
      </div>
      <div class="card stat-card">
        <div class="stat">${shops}</div>
        <div class="muted">Shops</div>
      </div>
      <div class="card stat-card">
        <div class="stat">${customers}</div>
        <div class="muted">Customer accounts</div>
      </div>
      <div class="card stat-card">
        <div class="stat">${low.length}</div>
        <div class="muted">Low-stock listings</div>
      </div>
    </div>

    <p class="muted small" style="margin: -4px 0 18px">
      Revenue counts only orders whose current status is <b>Delivered</b>. Cancelled and
      in-progress orders are excluded. Figures are derived from this browser's demo data.
    </p>

    <div class="admin-toolbar admin-quick-actions">
      <button type="button" class="btn btn-primary btn-sm" data-admin-new-product>+ Add product</button>
      <button type="button" class="btn btn-outline btn-sm" data-goto-tab="orders">Review pending orders</button>
      <button type="button" class="btn btn-outline btn-sm" data-admin-export>Export demo backup</button>
      <button type="button" class="btn btn-outline btn-sm" data-admin-import>Import demo backup</button>
      <input type="file" id="admin-import-file" accept="application/json,.json" class="hidden" />
    </div>

    <div class="admin-two-col">
      <section class="card admin-card">
        <div class="admin-card-head">
          <h3>Recent orders</h3>
          <button type="button" class="link-btn" data-goto-tab="orders">Manage all →</button>
        </div>
        ${
          recent.length
            ? recent
                .map((o) => {
                  const meta = statusMeta(o.status);
                  return `
                  <a class="admin-mini-row" href="orders.html?id=${encodeURIComponent(o.id)}">
                    <span><b>${sanitize(o.id)}</b><br /><span class="muted small">${sanitize(
                      o.customer ? o.customer.name : ''
                    )} · ${sanitize(o.date)}</span></span>
                    <span class="admin-mini-right">
                      <span class="status ${meta.className}">${meta.label}</span>
                      <b>${formatPrice(o.total)}</b>
                    </span>
                  </a>`;
                })
                .join('')
            : '<p class="muted small">No orders yet.</p>'
        }
      </section>

      <section class="card admin-card">
        <div class="admin-card-head">
          <h3>Low stock</h3>
          <button type="button" class="link-btn" data-goto-tab="products">Manage products →</button>
        </div>
        ${
          low.length
            ? low
                .map(
                  (row) => `
                  <div class="admin-mini-row">
                    <span><b>${sanitize(row.product.name)}</b><br /><span class="muted small">${
                      sanitize((findSeller(row.product.sellerId) || {}).storeName || '')
                    }</span></span>
                    <span class="stock-chip ${row.left === 0 ? 'stock-out' : 'stock-warn'}">${
                      row.left === 0 ? 'Sold out' : row.left + ' left'
                    }</span>
                  </div>`
                )
                .join('')
            : '<p class="muted small">Every listing has healthy stock.</p>'
        }
      </section>
    </div>

    <section class="card admin-card admin-backup">
      <div class="admin-card-head">
        <h3>Demo data backup</h3>
      </div>
      <p class="muted small">
        Download a JSON snapshot of local demo orders, catalogue overrides and shop edits.
        Account credentials, password hashes and sessions are never exported. Importing
        replaces those demo records only after you confirm; accounts stay untouched.
      </p>
    </section>`;

  panel.querySelectorAll('[data-goto-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.gotoTab;
      const tabBtn = document.querySelector(`#admin-tabs .tab[data-tab="${tab}"]`);
      if (tabBtn) tabBtn.click();
    });
  });

  const newProduct = panel.querySelector('[data-admin-new-product]');
  if (newProduct) newProduct.addEventListener('click', openProductCreator);

  bindDemoBackupControls(panel);
}

/* ---------------- Demo backup controls ---------------- */

function bindDemoBackupControls(panel) {
  const exportBtn = panel.querySelector('[data-admin-export]');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const result = demoBackupData();
      if (!result.ok) {
        toast(result.error, 'error');
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stallfree-demo-backup-${stamp}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Demo backup downloaded', 'success');
    });
  }

  const importBtn = panel.querySelector('[data-admin-import]');
  const fileInput = panel.querySelector('#admin-import-file');
  if (importBtn && fileInput) {
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        let parsed;
        try {
          parsed = JSON.parse(String(reader.result || ''));
        } catch (e) {
          toast('That file is not valid JSON.', 'error');
          fileInput.value = '';
          return;
        }
        const checked = validateDemoBackup(parsed);
        if (!checked.ok) {
          toast(checked.errors[0], 'error');
          fileInput.value = '';
          return;
        }
        const s = checked.summary;
        confirmDialog(
          'Replace demo data?',
          `Import ${s.orders} orders, ${s.products} custom products, ${s.catalogOverrides} catalogue edits and ${s.shops} shop edits. Existing demo orders and catalogue edits in this browser will be replaced. Accounts are not affected.`,
          'Import and reload',
          () => {
            const result = importDemoData(parsed);
            if (!result.ok) {
              toast(result.error, 'error');
              return;
            }
            toast('Demo data imported — reloading', 'success');
            setTimeout(() => window.location.reload(), 600);
          }
        );
        fileInput.value = '';
      };
      reader.onerror = () => {
        toast('Could not read that file.', 'error');
        fileInput.value = '';
      };
      reader.readAsText(file);
    });
  }
}

/* ---------------- Orders ---------------- */

function adminOrderMatches(o, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const items = (o.items || []).map((i) => i.name || '').join(' ');
  return [o.id, o.customer ? o.customer.name : '', o.customer ? o.customer.phone : '', items]
    .join(' ')
    .toLowerCase()
    .includes(q);
}

function renderAdminOrders(panel) {
  const all = getAllOrders();
  const dayWindow = adminOrderDate === '7' ? 7 : adminOrderDate === '30' ? 30 : 0;
  const cutoff = dayWindow ? Date.now() - dayWindow * 864e5 : 0;
  const orders = all
    .filter(
      (o) =>
        (adminOrderFilter === 'all' || statusMeta(o.status).id === adminOrderFilter) &&
        adminOrderMatches(o, adminOrderQuery)
    )
    .filter((o) => {
      if (!cutoff) return true;
      const stamp = Date.parse(o.dateISO || o.createdAt || o.date || '');
      return Number.isFinite(stamp) && stamp >= cutoff;
    })
    .sort((a, b) => {
      switch (adminOrderSort) {
        case 'oldest':
          return Date.parse(a.dateISO || a.date || 0) - Date.parse(b.dateISO || b.date || 0);
        case 'total-desc':
          return (b.total || 0) - (a.total || 0);
        case 'total-asc':
          return (a.total || 0) - (b.total || 0);
        case 'status': {
          const order = ORDER_STATUSES.map((s) => s.id);
          return order.indexOf(statusMeta(a.status).id) - order.indexOf(statusMeta(b.status).id);
        }
        default:
          return Date.parse(b.dateISO || b.date || 0) - Date.parse(a.dateISO || a.date || 0);
      }
    });

  const filterOptions = ['all']
    .concat(ORDER_STATUSES.map((s) => s.id))
    .map((id) => {
      const label = id === 'all' ? 'All statuses' : statusMeta(id).label;
      const count = id === 'all' ? all.length : all.filter((o) => statusMeta(o.status).id === id).length;
      return `<option value="${id}" ${id === adminOrderFilter ? 'selected' : ''}>${label} (${count})</option>`;
    })
    .join('');

  const sortOptions = [
    ['newest', 'Newest first'],
    ['oldest', 'Oldest first'],
    ['total-desc', 'Total: high to low'],
    ['total-asc', 'Total: low to high'],
    ['status', 'Status order']
  ]
    .map(
      ([id, label]) =>
        `<option value="${id}" ${id === adminOrderSort ? 'selected' : ''}>${label}</option>`
    )
    .join('');

  const dateOptions = [
    ['all', 'All dates'],
    ['7', 'Last 7 days'],
    ['30', 'Last 30 days']
  ]
    .map(
      ([id, label]) =>
        `<option value="${id}" ${id === adminOrderDate ? 'selected' : ''}>${label}</option>`
    )
    .join('');

  panel.innerHTML = `
    <div class="admin-toolbar">
      <input type="search" id="admin-order-search" class="input input-search"
        placeholder="Search order ID, customer or product…" value="${sanitize(adminOrderQuery)}" />
      <label for="admin-order-filter">Status</label>
      <select id="admin-order-filter" class="select select-sm">${filterOptions}</select>
      <label for="admin-order-date">Date</label>
      <select id="admin-order-date" class="select select-sm">${dateOptions}</select>
      <label for="admin-order-sort">Sort</label>
      <select id="admin-order-sort" class="select select-sm">${sortOptions}</select>
      <span class="muted small">${orders.length} ${plural(orders.length, 'order')} shown</span>
    </div>

    <p class="muted small" style="margin: -6px 0 16px">
      Status changes follow a fixed flow: placed → confirmed → preparing → shipped → out
      for delivery → delivered. Final statuses cannot be reopened. Tracking text is a
      non-functional demo reference; no courier is contacted.
    </p>

    ${
      orders.length
        ? orders.map(adminOrderCardMarkup).join('')
        : emptyState(
            'No orders here',
            adminOrderQuery || adminOrderDate !== 'all'
              ? 'No order matches that search and date range. Clear or widen the filters.'
              : 'Try a different status filter.'
          )
    }`;

  const search = document.getElementById('admin-order-search');
  if (search) {
    search.addEventListener('input', () => {
      adminOrderQuery = search.value;
      renderAdminOrders(panel);
      const next = document.getElementById('admin-order-search');
      if (next) {
        next.focus();
        next.setSelectionRange(next.value.length, next.value.length);
      }
    });
  }

  const filter = document.getElementById('admin-order-filter');
  if (filter) {
    filter.addEventListener('change', () => {
      adminOrderFilter = filter.value;
      renderAdminOrders(panel);
    });
  }

  const date = document.getElementById('admin-order-date');
  if (date) {
    date.addEventListener('change', () => {
      adminOrderDate = date.value;
      renderAdminOrders(panel);
    });
  }

  const sort = document.getElementById('admin-order-sort');
  if (sort) {
    sort.addEventListener('change', () => {
      adminOrderSort = sort.value;
      renderAdminOrders(panel);
    });
  }

  panel.querySelectorAll('.admin-order [data-admin-save]').forEach((btn) => {
    btn.addEventListener('click', () => saveAdminOrder(btn));
  });
}

function adminOrderCardMarkup(o) {
  const meta = statusMeta(o.status);
  const tracking = o.tracking || {};
  const items = (o.items || [])
    .map((i) => `${sanitize(i.name)} ×${i.qty}`)
    .join(' · ');

  const nextStatuses = allowedNextStatuses(meta.id);
  const statusOptions = [meta.id]
    .concat(nextStatuses)
    .map((id) => {
      const s = statusMeta(id);
      const suffix = id === meta.id ? ' (current)' : '';
      return `<option value="${s.id}" ${id === meta.id ? 'selected' : ''}>${s.label}${suffix}</option>`;
    })
    .join('');

  return `
    <article class="card admin-order" data-order="${sanitize(o.id)}">
      <div class="admin-order-head">
        <div>
          <a class="order-id" href="orders.html?id=${encodeURIComponent(o.id)}">${sanitize(o.id)}</a>
          <span class="muted small"> · ${sanitize(o.date)}</span>
          <div class="muted small">${sanitize(o.customer ? o.customer.name : '')} · ${sanitize(
    o.customer ? o.customer.phone : ''
  )} · ${sanitize(o.customer ? o.customer.address : '')}</div>
        </div>
        <div class="admin-order-head-right">
          <span class="status ${meta.className}">${meta.label}</span>
          <b>${formatPrice(o.total)}</b>
        </div>
      </div>

      <p class="muted small admin-order-items">${items}</p>

      <div class="admin-order-controls">
        <label class="sr-only" for="admin-status-${sanitize(o.id)}">New status</label>
        <select id="admin-status-${sanitize(o.id)}" class="select select-sm admin-status-select"
          ${nextStatuses.length ? '' : 'disabled'}>${statusOptions}</select>

        <label class="sr-only" for="admin-track-${sanitize(o.id)}">Tracking number</label>
        <input type="text" class="input admin-tracking" placeholder="Tracking no."
          value="${sanitize(tracking.number || '')}" />

        <label class="sr-only" for="admin-courier-${sanitize(o.id)}">Courier</label>
        <input type="text" class="input admin-courier" placeholder="Courier (e.g. J&T)"
          value="${sanitize(tracking.courier || '')}" />

        <button type="button" class="btn btn-sm btn-primary" data-admin-save>Update</button>
      </div>
    </article>`;
}

function saveAdminOrder(btn) {
  const card = btn.closest('.admin-order');
  if (!card) return;
  const orderId = card.dataset.order;
  const order = getOrderById(orderId);
  if (!order) return;

  const select = card.querySelector('.admin-status-select');
  const numberInput = card.querySelector('.admin-tracking');
  const courierInput = card.querySelector('.admin-courier');
  const number = numberInput ? numberInput.value.trim() : '';
  const courier = courierInput ? courierInput.value.trim() : '';

  const patch = {};
  if (select && select.value !== normalizeOrderStatus(order)) patch.status = select.value;
  if (number || courier || order.tracking) patch.tracking = { number, courier };

  if (!patch.status && !patch.tracking) {
    toast('Nothing to update', 'error');
    return;
  }

  btn.disabled = true;
  const result = adminUpdateOrder(orderId, patch);
  btn.disabled = false;

  if (!result.ok) {
    adminBanner(result.error, true);
    toast(result.error, 'error');
    return;
  }

  toast(`Order ${orderId} updated`, 'success');
  renderAdminPanel();
}

/* ---------------- Products ---------------- */

function renderAdminProducts(panel) {
  const catOptions = ['all']
    .concat(categories.map((c) => c.id))
    .map((id) => {
      const label = id === 'all' ? 'All categories' : (findCategory(id) || {}).name;
      return `<option value="${id}" ${id === adminProductCategory ? 'selected' : ''}>${sanitize(label)}</option>`;
    })
    .join('');

  panel.innerHTML = `
    <div class="admin-toolbar">
      <input type="search" id="admin-product-search" class="input input-search" placeholder="Search products…"
        value="${sanitize(adminProductQuery)}" />
      <label for="admin-product-category">Category</label>
      <select id="admin-product-category" class="select select-sm">${catOptions}</select>
      <label for="admin-product-stock">Stock</label>
      <select id="admin-product-stock" class="select select-sm">
        <option value="all" ${adminProductStock === 'all' ? 'selected' : ''}>Any stock</option>
        <option value="low" ${adminProductStock === 'low' ? 'selected' : ''}>Low (1–5)</option>
        <option value="out" ${adminProductStock === 'out' ? 'selected' : ''}>Sold out</option>
      </select>
      <label class="admin-check">
        <input type="checkbox" id="admin-show-hidden" ${adminShowHidden ? 'checked' : ''} />
        Show archived &amp; removed
      </label>
      <button type="button" class="btn btn-primary btn-sm" id="admin-add-product">+ Add product</button>
    </div>
    <div id="admin-product-list"></div>`;

  const search = document.getElementById('admin-product-search');
  if (search) {
    search.addEventListener('input', () => {
      adminProductQuery = search.value;
      refreshAdminProductList();
    });
  }

  const category = document.getElementById('admin-product-category');
  if (category) {
    category.addEventListener('change', () => {
      adminProductCategory = category.value;
      refreshAdminProductList();
    });
  }

  const stock = document.getElementById('admin-product-stock');
  if (stock) {
    stock.addEventListener('change', () => {
      adminProductStock = stock.value;
      refreshAdminProductList();
    });
  }

  const showHidden = document.getElementById('admin-show-hidden');
  if (showHidden) {
    showHidden.addEventListener('change', () => {
      adminShowHidden = showHidden.checked;
      refreshAdminProductList();
    });
  }

  const add = document.getElementById('admin-add-product');
  if (add) add.addEventListener('click', openProductCreator);

  refreshAdminProductList();
}

function adminProductMatches(p) {
  if (!adminShowHidden && !isListable(p)) return false;
  if (adminProductCategory !== 'all' && p.categoryId !== adminProductCategory) return false;
  const left = productStock(p.id);
  if (adminProductStock === 'out' && left > 0) return false;
  if (adminProductStock === 'low' && (left < 1 || left > 5)) return false;
  const q = adminProductQuery.trim().toLowerCase();
  if (!q) return true;
  const shop = findSeller(p.sellerId);
  const cat = findCategory(p.categoryId);
  const haystack = [p.name, p.description || '', shop ? shop.storeName : '', cat ? cat.name : '']
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

function refreshAdminProductList() {
  const list = document.getElementById('admin-product-list');
  if (!list) return;

  const rows = dedupeById(products).filter(adminProductMatches);

  list.innerHTML = rows.length
    ? rows.map(adminProductRowMarkup).join('')
    : emptyState('No products match', 'Adjust the search or show hidden listings.');

  list.querySelectorAll('[data-admin-edit]').forEach((btn) => {
    btn.addEventListener('click', () => openProductEditor(btn.dataset.adminEdit));
  });
  list.querySelectorAll('[data-admin-archive]').forEach((btn) => {
    btn.addEventListener('click', () => archiveAdminProduct(btn.dataset.adminArchive));
  });
  list.querySelectorAll('[data-admin-restore]').forEach((btn) => {
    btn.addEventListener('click', () => restoreAdminProduct(btn.dataset.adminRestore));
  });
  list.querySelectorAll('[data-admin-remove]').forEach((btn) => {
    btn.addEventListener('click', () => removeAdminProduct(btn.dataset.adminRemove));
  });
}

function adminProductRowMarkup(p) {
  const shop = findSeller(p.sellerId);
  const cat = findCategory(p.categoryId);
  const left = productStock(p.id);
  const custom = isCustomProduct(p.id);
  const stateChip = p.removed
    ? '<span class="stock-chip stock-out">Removed</span>'
    : p.archived
      ? '<span class="stock-chip stock-warn">Archived</span>'
      : '<span class="stock-chip stock-ok">Live</span>';
  const stockChip = left <= 0
    ? '<span class="stock-chip stock-out">Sold out</span>'
    : left <= 5
      ? `<span class="stock-chip stock-warn">${left} left</span>`
      : `<span class="stock-chip">${left} in stock</span>`;

  const restoreBtn =
    p.archived || p.removed
      ? `<button type="button" class="btn btn-sm btn-outline" data-admin-restore="${p.id}">Restore</button>`
      : `<button type="button" class="btn btn-sm btn-outline" data-admin-archive="${p.id}">Archive</button>`;

  const removeBtn = p.removed
    ? ''
    : `<button type="button" class="btn btn-sm btn-outline btn-danger-text" data-admin-remove="${p.id}">${
        custom ? 'Delete' : 'Remove'
      }</button>`;

  return `
    <div class="card admin-row" data-product-row="${sanitize(p.id)}">
      <span class="admin-row-thumb" style="${gradient(categoryColors(p.categoryId))}" aria-hidden="true">${sanitize(
        p.name.charAt(0).toUpperCase()
      )}</span>
      <div class="admin-row-main">
        <a href="${productHref(p)}"><b>${sanitize(p.name)}</b></a>
        <span class="muted small">${sanitize(shop ? shop.storeName : '')} · ${sanitize(
          cat ? cat.name : ''
        )} · ${formatPrice(p.price)}${p.compareAt ? ` <s>${formatPrice(p.compareAt)}</s>` : ''}</span>
      </div>
      <div class="admin-row-meta">${stateChip} ${stockChip}</div>
      <div class="admin-row-actions">
        <button type="button" class="btn btn-sm btn-outline" data-admin-edit="${p.id}">Edit</button>
        ${restoreBtn}
        ${removeBtn}
      </div>
    </div>`;
}

function adminProductOp(result, successMessage) {
  if (!result.ok) {
    adminBanner(result.error, true);
    toast(result.error, 'error');
    return false;
  }
  toast(successMessage, 'success');
  refreshAdminProductList();
  return true;
}

function archiveAdminProduct(productId) {
  confirmDialog(
    'Archive this product?',
    'It disappears from the storefront immediately. Past orders keep their snapshot, and you can restore it any time.',
    'Archive',
    () => adminProductOp(saveCatalogOverride(productId, { archived: true }), 'Product archived')
  );
}

function restoreAdminProduct(productId) {
  adminProductOp(
    saveCatalogOverride(productId, { archived: false, removed: false }),
    'Product restored to the storefront'
  );
}

function removeAdminProduct(productId) {
  const custom = isCustomProduct(productId);
  confirmDialog(
    custom ? 'Delete this product?' : 'Remove this product?',
    custom
      ? 'This listing was added in the dashboard and will be deleted permanently.'
      : 'It disappears from the storefront. Past orders keep their snapshot, and you can restore it later.',
    custom ? 'Delete permanently' : 'Remove',
    () => {
      const result = removeProduct(productId);
      adminProductOp(result, custom ? 'Product deleted' : 'Product removed');
    }
  );
}

function adminPhotoPreviewMarkup(value, name) {
  const initial = String(name || '').trim().charAt(0) || '?';
  return `<span class="pc-letter" aria-hidden="true">${sanitize(initial)}</span>${
    value
      ? `<img src="${photoUrl(value, 320)}" alt="Product photo preview" loading="lazy"
           onload="this.classList.add('is-loaded')" onerror="this.remove()" />`
      : ''
  }`;
}

function wireAdminPhotoPreview(inputId, previewId, nameId, colorsFor) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!input || !preview) return;
  const refresh = () => {
    const nameInput = nameId ? document.getElementById(nameId) : null;
    const colors = typeof colorsFor === 'function' ? colorsFor() : colorsFor;
    if (colors) preview.setAttribute('style', gradient(colors));
    preview.innerHTML = adminPhotoPreviewMarkup(
      input.value.trim(),
      nameInput ? nameInput.value : ''
    );
  };
  input.addEventListener('input', refresh);
  const nameInput = nameId ? document.getElementById(nameId) : null;
  if (nameInput) nameInput.addEventListener('input', refresh);
}

function openProductEditor(productId) {
  const p = findProduct(productId);
  if (!p) return;

  openModal(`
    <div class="modal-pad">
      <h3>Edit product</h3>
      <p class="muted small" style="margin: 4px 0 14px">${sanitize(p.name)}</p>
      <form id="pe-form" novalidate>
        <div class="form-group">
          <label for="pe-name">Name *</label>
          <input type="text" id="pe-name" class="input" value="${sanitize(p.name)}" />
          <p class="field-error hidden" id="pe-name-error"></p>
        </div>
        <div class="admin-form-row">
          <div class="form-group">
            <label for="pe-price">Price (₱) *</label>
            <input type="number" id="pe-price" class="input" min="0" step="1" value="${p.price}" />
            <p class="field-error hidden" id="pe-price-error"></p>
          </div>
          <div class="form-group">
            <label for="pe-compare">Compare-at (₱)</label>
            <input type="number" id="pe-compare" class="input" min="0" step="1" value="${
              p.compareAt || ''
            }" placeholder="Leave empty for none" />
          </div>
          <div class="form-group">
            <label for="pe-stock">Total units *</label>
            <input type="number" id="pe-stock" class="input" min="0" step="1" value="${stockBaseline(p.id)}" />
            <p class="field-error hidden" id="pe-stock-error"></p>
          </div>
        </div>
        <div class="admin-form-row">
          <div class="form-group">
            <label for="pe-category">Category *</label>
            <select id="pe-category" class="select">
              ${categories
                .map(
                  (c) =>
                    `<option value="${c.id}" ${c.id === p.categoryId ? 'selected' : ''}>${sanitize(
                      c.name
                    )}</option>`
                )
                .join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="pe-shop">Shop *</label>
            <select id="pe-shop" class="select">
              ${sellers
                .map(
                  (s) =>
                    `<option value="${s.id}" ${s.id === p.sellerId ? 'selected' : ''}>${sanitize(
                      s.storeName
                    )}</option>`
                )
                .join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="pe-photo">Photo ID or image URL</label>
          <div class="admin-photo-row">
            <div class="pc-media admin-photo-preview" id="pe-photo-preview" aria-hidden="true"
              style="${gradient(categoryColors(p.categoryId))}">
              ${adminPhotoPreviewMarkup(p.photo, p.name)}
            </div>
            <div class="admin-photo-fields">
              <input type="text" id="pe-photo" class="input" value="${sanitize(p.photo || '')}"
                placeholder="Unsplash photo ID or https://…" />
              <p class="muted small form-hint">Leave empty to show the coloured placeholder tile.</p>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label for="pe-materials">Materials</label>
          <input type="text" id="pe-materials" class="input" value="${sanitize(p.materials || '')}" />
        </div>
        <div class="form-group">
          <label for="pe-description">Description</label>
          <textarea id="pe-description" class="textarea" rows="4">${sanitize(p.description || '')}</textarea>
        </div>
        <label class="admin-check">
          <input type="checkbox" id="pe-freeship" ${p.freeShipping ? 'checked' : ''} />
          Free nationwide delivery
        </label>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn btn-primary" id="pe-save">Save changes</button>
        </div>
      </form>
    </div>`);

  const form = document.getElementById('pe-form');
  if (!form) return;

  wireAdminPhotoPreview('pe-photo', 'pe-photo-preview', 'pe-name', () =>
    categoryColors((document.getElementById('pe-category') || {}).value)
  );
  const peCategory = document.getElementById('pe-category');
  if (peCategory) {
    peCategory.addEventListener('change', () => {
      const preview = document.getElementById('pe-photo-preview');
      if (preview) preview.setAttribute('style', gradient(categoryColors(peCategory.value)));
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (document.getElementById('pe-name') || {}).value || '';
    const priceRaw = (document.getElementById('pe-price') || {}).value;
    const compareRaw = (document.getElementById('pe-compare') || {}).value;
    const stockRaw = (document.getElementById('pe-stock') || {}).value;
    const materials = (document.getElementById('pe-materials') || {}).value || '';
    const description = (document.getElementById('pe-description') || {}).value || '';
    const photo = (document.getElementById('pe-photo') || {}).value || '';
    const categoryId = (document.getElementById('pe-category') || {}).value || '';
    const sellerId = (document.getElementById('pe-shop') || {}).value || '';
    const freeShipping = Boolean((document.getElementById('pe-freeship') || {}).checked);

    const price = Number(priceRaw);
    const stock = Number(stockRaw);
    const compareAt = String(compareRaw).trim() === '' ? 0 : Number(compareRaw);

    let ok = true;
    if (setAuthFieldError('pe-name', name.trim() ? '' : 'Enter a product name.')) ok = false;
    if (setAuthFieldError('pe-price', Number.isFinite(price) && price >= 0 ? '' : 'Enter a valid price.')) ok = false;
    if (setAuthFieldError('pe-stock', Number.isInteger(stock) && stock >= 0 ? '' : 'Enter a whole number of units.')) {
      ok = false;
    }
    if (!ok) return;

    const result = saveCatalogOverride(productId, {
      name: name.trim(),
      price,
      compareAt: Number.isFinite(compareAt) && compareAt >= 0 ? compareAt : 0,
      stock,
      materials: materials.trim(),
      description: description.trim(),
      photo: photo.trim(),
      categoryId,
      sellerId,
      freeShipping
    });

    if (!result.ok) {
      setAuthBanner('admin-banner', result.error);
      toast(result.error, 'error');
      return;
    }

    closeModal();
    toast('Product updated', 'success');
    refreshAdminProductList();
  });
}

function openProductCreator() {
  const catOptions = categories
    .map((c) => `<option value="${c.id}">${sanitize(c.name)}</option>`)
    .join('');
  const shopOptions = sellers
    .map((s) => `<option value="${s.id}">${sanitize(s.storeName)}</option>`)
    .join('');

  openModal(`
    <div class="modal-pad">
      <h3>Add product</h3>
      <p class="muted small" style="margin: 4px 0 14px">
        The listing goes live on the storefront immediately.
      </p>
      <form id="pc-form" novalidate>
        <div class="form-group">
          <label for="pc-name">Name *</label>
          <input type="text" id="pc-name" class="input" placeholder="Hand-poured soy candle" />
          <p class="field-error hidden" id="pc-name-error"></p>
        </div>
        <div class="admin-form-row">
          <div class="form-group">
            <label for="pc-price">Price (₱) *</label>
            <input type="number" id="pc-price" class="input" min="0" step="1" placeholder="350" />
            <p class="field-error hidden" id="pc-price-error"></p>
          </div>
          <div class="form-group">
            <label for="pc-stock">Units *</label>
            <input type="number" id="pc-stock" class="input" min="0" step="1" placeholder="20" />
            <p class="field-error hidden" id="pc-stock-error"></p>
          </div>
        </div>
        <div class="admin-form-row">
          <div class="form-group">
            <label for="pc-category">Category *</label>
            <select id="pc-category" class="select">${catOptions}</select>
          </div>
          <div class="form-group">
            <label for="pc-shop">Shop *</label>
            <select id="pc-shop" class="select">${shopOptions}</select>
          </div>
        </div>
        <div class="form-group">
          <label for="pc-materials">Materials</label>
          <input type="text" id="pc-materials" class="input" placeholder="Soy wax, cotton wick" />
        </div>
        <div class="form-group">
          <label for="pc-processing">Processing time</label>
          <input type="text" id="pc-processing" class="input" placeholder="2-3 business days" />
        </div>
        <div class="form-group">
          <label for="pc-description">Description</label>
          <textarea id="pc-description" class="textarea" rows="3" placeholder="What makes it special."></textarea>
        </div>
        <div class="form-group">
          <label for="pc-photo">Photo ID or image URL</label>
          <div class="admin-photo-row">
            <div class="pc-media admin-photo-preview" id="pc-photo-preview" aria-hidden="true"
              style="${gradient(categoryColors(categories[0].id))}">
              ${adminPhotoPreviewMarkup('', '')}
            </div>
            <div class="admin-photo-fields">
              <input type="text" id="pc-photo" class="input" placeholder="photo-1602874801006-… or https://…" />
              <p class="muted small form-hint">Optional — the card shows a coloured tile when empty.</p>
            </div>
          </div>
        </div>
        <label class="admin-check">
          <input type="checkbox" id="pc-freeship" checked />
          Free nationwide delivery
        </label>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" data-action="close-modal">Cancel</button>
          <button type="submit" class="btn btn-primary" id="pc-save">Add product</button>
        </div>
      </form>
    </div>`);

  const form = document.getElementById('pc-form');
  if (!form) return;

  wireAdminPhotoPreview('pc-photo', 'pc-photo-preview', 'pc-name', () =>
    categoryColors((document.getElementById('pc-category') || {}).value)
  );
  const pcCategory = document.getElementById('pc-category');
  if (pcCategory) {
    pcCategory.addEventListener('change', () => {
      const preview = document.getElementById('pc-photo-preview');
      if (preview) preview.setAttribute('style', gradient(categoryColors(pcCategory.value)));
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = ((document.getElementById('pc-name') || {}).value || '').trim();
    const price = Number((document.getElementById('pc-price') || {}).value);
    const stock = Number((document.getElementById('pc-stock') || {}).value);

    let ok = true;
    if (setAuthFieldError('pc-name', name ? '' : 'Enter a product name.')) ok = false;
    if (setAuthFieldError('pc-price', Number.isFinite(price) && price >= 0 ? '' : 'Enter a valid price.')) ok = false;
    if (setAuthFieldError('pc-stock', Number.isInteger(stock) && stock >= 0 ? '' : 'Enter a whole number of units.')) {
      ok = false;
    }
    if (!ok) return;

    const result = addCustomProduct({
      name,
      price,
      stock,
      categoryId: (document.getElementById('pc-category') || {}).value || '',
      sellerId: (document.getElementById('pc-shop') || {}).value || '',
      materials: ((document.getElementById('pc-materials') || {}).value || '').trim(),
      processing: ((document.getElementById('pc-processing') || {}).value || '').trim(),
      description: ((document.getElementById('pc-description') || {}).value || '').trim(),
      photo: ((document.getElementById('pc-photo') || {}).value || '').trim(),
      freeShipping: Boolean((document.getElementById('pc-freeship') || {}).checked)
    });

    if (!result.ok) {
      toast(result.error, 'error');
      return;
    }

    closeModal();
    toast(`“${result.product.name}” added to the storefront`, 'success');
    refreshAdminProductList();
  });
}

/* ---------------- Shops ---------------- */

function renderAdminShops(panel) {
  panel.innerHTML = `
    <p class="muted small" style="margin-bottom: 16px">
      Shops in this version are catalogue records, not authenticated seller accounts.
      Edits here override the shop name, tagline, and location everywhere on the site.
    </p>
    <div class="admin-shops">
      ${sellers
        .map(
          (s) => `
        <section class="card admin-card" data-shop="${sanitize(s.id)}">
          <div class="admin-card-head">
            <h3>${sanitize(s.storeName)}</h3>
            <span class="muted small">${productsBySeller(s.id).length} live ${plural(
              productsBySeller(s.id).length,
              'listing'
            )}</span>
          </div>
          <div class="form-group">
            <label for="sh-name-${sanitize(s.id)}">Store name</label>
            <input type="text" id="sh-name-${sanitize(s.id)}" class="input admin-shop-name" value="${sanitize(
              s.storeName
            )}" />
          </div>
          <div class="form-group">
            <label for="sh-tag-${sanitize(s.id)}">Tagline</label>
            <input type="text" id="sh-tag-${sanitize(s.id)}" class="input admin-shop-tagline" value="${sanitize(
              s.tagline
            )}" />
          </div>
          <div class="form-group">
            <label for="sh-loc-${sanitize(s.id)}">Location</label>
            <input type="text" id="sh-loc-${sanitize(s.id)}" class="input admin-shop-location" value="${sanitize(
              s.location
            )}" />
          </div>
          <button type="button" class="btn btn-sm btn-primary" data-admin-shop-save>Save shop</button>
        </section>`
        )
        .join('')}
    </div>`;

  panel.querySelectorAll('[data-admin-shop-save]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('[data-shop]');
      if (!card) return;
      const name = (card.querySelector('.admin-shop-name') || {}).value || '';
      const tagline = (card.querySelector('.admin-shop-tagline') || {}).value || '';
      const location = (card.querySelector('.admin-shop-location') || {}).value || '';

      if (!name.trim()) {
        toast('Store name cannot be empty', 'error');
        return;
      }

      const result = saveShopOverride(card.dataset.shop, {
        storeName: name,
        tagline,
        location
      });
      if (!result.ok) {
        adminBanner(result.error, true);
        toast(result.error, 'error');
        return;
      }
      toast('Shop updated', 'success');
      refreshAccountChrome();
      renderAdminPanel();
    });
  });
}

/* ---------------- Customers ---------------- */

function renderAdminCustomers(panel) {
  const allAccounts = listAccounts().filter((a) => a.role !== 'admin');
  const needle = adminCustomerQuery.trim().toLowerCase();
  const accounts = needle
    ? allAccounts.filter((a) =>
        [a.name, a.email, a.firstName, a.lastName].join(' ').toLowerCase().includes(needle)
      )
    : allAccounts;
  const orders = getAllOrders();

  const rows = accounts.length
    ? accounts
        .map((a) => {
          const mine = orders.filter((o) => (o.userId || 'guest') === a.id);
          const spent = mine
            .filter((o) => o.status !== 'cancelled')
            .reduce((sum, o) => sum + (o.total || 0), 0);
          return `
          <div class="card admin-row" data-account="${sanitize(a.id)}">
            <div class="admin-row-main">
              <b>${sanitize(a.name || a.email)}</b>
              <span class="muted small">${sanitize(a.email)} · joined ${sanitize(
                String(a.createdAt || '').slice(0, 10)
              )}</span>
            </div>
            <div class="admin-row-meta">
              <span class="stock-chip ${a.suspended ? 'stock-out' : 'stock-ok'}">${
                a.suspended ? 'Suspended' : 'Active'
              }</span>
              <span class="stock-chip">${mine.length} ${plural(mine.length, 'order')} · ${formatPrice(spent)}</span>
            </div>
            <div class="admin-row-actions">
              <button type="button" class="btn btn-sm btn-outline" data-admin-suspend="${
                a.suspended ? 'off' : 'on'
              }">${a.suspended ? 'Reactivate' : 'Suspend'}</button>
              <button type="button" class="btn btn-sm btn-outline btn-danger-text" data-admin-delete>Remove</button>
            </div>
          </div>`;
        })
        .join('')
    : emptyState(
        allAccounts.length ? 'No customer matches' : 'No customer accounts yet',
        allAccounts.length
          ? 'Try a different name or email.'
          : 'Accounts appear here as soon as people register.'
      );

  panel.innerHTML = `
    <div class="admin-toolbar">
      <input type="search" id="admin-customer-search" class="input input-search"
        placeholder="Search customers by name or email…" value="${sanitize(adminCustomerQuery)}" />
      <span class="muted small">${accounts.length} of ${allAccounts.length} ${plural(
        allAccounts.length,
        'customer'
      )}</span>
    </div>
    <p class="muted small" style="margin: -6px 0 16px">
      Local prototype accounts only. The sole administrator is never listed here and cannot
      be suspended or deleted.
    </p>
    ${rows}`;

  const search = document.getElementById('admin-customer-search');
  if (search) {
    search.addEventListener('input', () => {
      adminCustomerQuery = search.value;
      renderAdminCustomers(panel);
      const next = document.getElementById('admin-customer-search');
      if (next) {
        next.focus();
        next.setSelectionRange(next.value.length, next.value.length);
      }
    });
  }

  panel.querySelectorAll('[data-account]').forEach((row) => {
    const userId = row.dataset.account;
    const suspendBtn = row.querySelector('[data-admin-suspend]');
    if (suspendBtn) {
      suspendBtn.addEventListener('click', () => {
        const suspend = suspendBtn.dataset.adminSuspend === 'on';
        const apply = () => {
          const result = setAccountSuspended(userId, suspend);
          if (!result.ok) {
            toast(result.error, 'error');
            return;
          }
          toast(suspend ? 'Account suspended' : 'Account reactivated', 'success');
          renderAdminPanel();
        };
        if (suspend) {
          confirmDialog(
            'Suspend this customer?',
            'They are signed out and cannot sign in or place orders until you reactivate the account. Past orders stay in the system.',
            'Suspend account',
            apply
          );
        } else {
          apply();
        }
      });
    }

    const deleteBtn = row.querySelector('[data-admin-delete]');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        confirmDialog(
          'Remove this account?',
          'The account can no longer sign in. Past orders stay in the system for your records.',
          'Remove account',
          () => {
            const result = deleteAccount(userId);
            if (!result.ok) {
              toast(result.error, 'error');
              return;
            }
            toast('Account removed', 'success');
            renderAdminPanel();
          }
        );
      });
    }
  });
}

/* ---------------- Audit log ---------------- */

function auditMatchesDate(entry) {
  if (adminAuditDate === 'all') return true;
  const at = new Date(entry.at).getTime();
  if (!Number.isFinite(at)) return false;
  if (adminAuditDate === 'today') {
    const then = new Date(entry.at);
    const now = new Date();
    return (
      then.getFullYear() === now.getFullYear() &&
      then.getMonth() === now.getMonth() &&
      then.getDate() === now.getDate()
    );
  }
  const days = Number(adminAuditDate);
  return Number.isFinite(days) && Date.now() - at <= days * 86400000;
}

function renderAdminAudit(panel) {
  const log = readAuditLog();
  const actions = Array.from(new Set(log.map((e) => e.action))).sort();
  const filtered = log.filter(
    (e) =>
      (adminAuditFilter === 'all' || e.action === adminAuditFilter) && auditMatchesDate(e)
  );

  const options = ['all']
    .concat(actions)
    .map(
      (action) =>
        `<option value="${sanitize(action)}" ${action === adminAuditFilter ? 'selected' : ''}>${
          action === 'all' ? 'All actions' : sanitize(action)
        }</option>`
    )
    .join('');

  const dateOptions = [
    ['all', 'All time'],
    ['today', 'Today'],
    ['7', 'Last 7 days'],
    ['30', 'Last 30 days']
  ]
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === adminAuditDate ? 'selected' : ''}>${label}</option>`
    )
    .join('');

  panel.innerHTML = `
    <div class="admin-toolbar">
      <label for="admin-audit-filter">Action</label>
      <select id="admin-audit-filter" class="select select-sm">${options}</select>
      <label for="admin-audit-date">Period</label>
      <select id="admin-audit-date" class="select select-sm">${dateOptions}</select>
      <span class="muted small">${filtered.length} of ${log.length} ${plural(log.length, 'entry', 'entries')}</span>
    </div>
    <p class="muted small" style="margin: -6px 0 16px">
      This history is stored in the browser and can be edited with developer tools. It is an
      activity aid, not a tamper-proof audit trail.
    </p>
    ${
      filtered.length
        ? `<div class="audit-list">
            ${filtered
              .map(
                (entry) => `
              <div class="audit-row">
                <span class="audit-time muted small">${formatOrderDate(entry.at)}</span>
                <span class="audit-actor">${sanitize(entry.actorLabel || entry.actor || 'system')}</span>
                <span class="audit-action"><code>${sanitize(entry.action)}</code></span>
                <span class="audit-detail">${sanitize(entry.detail)}</span>
              </div>`
              )
              .join('')}
          </div>`
        : emptyState(
            'No activity logged yet',
            log.length
              ? 'No entry matches the current filters.'
              : 'Administrator actions will appear here as they happen.'
          )
    }`;

  const filter = document.getElementById('admin-audit-filter');
  if (filter) {
    filter.addEventListener('change', () => {
      adminAuditFilter = filter.value;
      renderAdminAudit(panel);
    });
  }

  const dateFilter = document.getElementById('admin-audit-date');
  if (dateFilter) {
    dateFilter.addEventListener('change', () => {
      adminAuditDate = dateFilter.value;
      renderAdminAudit(panel);
    });
  }
}

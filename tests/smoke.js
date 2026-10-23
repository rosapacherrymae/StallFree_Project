/* StallFree smoke test — executes the real pages in jsdom and drives
   the critical flows: chrome render, registration, login wiring,
   checkout (incl. double-submit), tracking, admin bootstrap, guards. */
const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { webcrypto, randomBytes } = require('crypto');
const { TextEncoder, TextDecoder } = require('util');

const ROOT = path.resolve(__dirname, '..');
/* No setup credential ships with the tests. The first-run screen asks the
   owner to choose a demo passphrase, so each run generates fresh fake values.
   They are never compared with anything in the application source; they only
   satisfy the local setup form's length/uniqueness rules. */
const ADMIN_SETUP_PASSPHRASE = 'test-setup-' + randomBytes(12).toString('hex');
const ADMIN_SETUP_PASSPHRASE_B = 'test-setup-' + randomBytes(12).toString('hex');
const DEMO_DISCLAIMER =
  'StallFree is a frontend-only demonstration. Accounts, orders and payments are simulated and stored in this browser. No real payment or delivery is processed.';

/* jsdom treats file:// as an opaque origin, where localStorage throws.
   Serve the project over http so storage, relative URLs and resources behave
   like a real browser. */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};
const server = http.createServer((req, res) => {
  let rel;
  try {
    rel = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  } catch (e) {
    res.writeHead(400).end('bad request');
    return;
  }
  if (rel.endsWith('/')) rel += 'index.html';
  const full = path.resolve(ROOT, '.' + rel);
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  fs.readFile(full, (err, buf) => {
    if (err) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream' });
    res.end(buf);
  });
});
let BASE = null;

let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, detail) {
  if (cond) {
    passed += 1;
    console.log('  ok   ' + name);
  } else {
    failed += 1;
    failures.push(name + (detail ? ' — ' + detail : ''));
    console.log('  FAIL ' + name + (detail ? ' — ' + detail : ''));
  }
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitFor(fn, timeout = 10000, step = 60) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    let v;
    try {
      v = fn();
    } catch (e) {
      v = false;
    }
    if (v) return v;
    await wait(step);
  }
  return fn();
}

function ignoreError(msg) {
  return (
    /Not implemented: navigation/.test(msg) ||
    /Could not load/.test(msg) ||
    /Error: Not implemented/.test(msg)
  );
}

function dumpStorage(dom) {
  const out = {};
  const s = dom.window.localStorage;
  for (let i = 0; i < s.length; i += 1) out[s.key(i)] = s.getItem(s.key(i));
  return out;
}

async function openPage(file, query = '', seed = null) {
  if (!BASE) throw new Error('server not started');
  const full = path.join(ROOT, file);
  const html = fs.readFileSync(full, 'utf8');
  const url = BASE + '/' + file + (query || '');

  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', (e) => {
    if (!ignoreError(e.message)) errors.push('jsdomError: ' + e.message);
  });
  vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));
  vc.on('warn', (...a) => {
    const m = a.join(' ');
    if (m.includes('[StallFree]')) errors.push('warn: ' + m);
  });

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc,
    url,
    beforeParse(window) {
      /* browser APIs jsdom omits that the site touches */
      window.TextEncoder = TextEncoder;
      window.TextDecoder = TextDecoder;
      try {
        Object.defineProperty(window, 'crypto', {
          configurable: true,
          value: { getRandomValues: (a) => webcrypto.getRandomValues(a), subtle: webcrypto.subtle }
        });
      } catch (e) {
        /* leave jsdom's crypto.getRandomValues in place */
      }
      const noop = function () {};
      window.HTMLElement.prototype.scrollIntoView = noop;
      try {
        window.scrollTo = noop;
      } catch (e) {
        /* ignore */
      }
      if (seed) {
        Object.keys(seed).forEach((k) => window.localStorage.setItem(k, seed[k]));
      }
    }
  });

  await new Promise((resolve) => {
    if (dom.window.document.readyState === 'complete') resolve();
    else dom.window.addEventListener('load', resolve);
    setTimeout(resolve, 4000);
  });
  await wait(150);

  dom.getErrors = () => errors.slice();
  return dom;
}

function submit(doc, formId) {
  const form = doc.getElementById(formId);
  form.dispatchEvent(new doc.defaultView.Event('submit', { bubbles: true, cancelable: true }));
}

/* ---------------- 1. Static chrome on every page ---------------- */

async function testChrome() {
  console.log('\n[1] shared chrome + no duplicate render warnings');
  const pages = [
    'index.html',
    'products.html',
    'categories.html',
    'sellers.html',
    'wishlist.html',
    'orders.html',
    'profile.html',
    'help.html',
    'login.html',
    'register.html',
    'orders.html?id=missing-order',
    'admin.html',
    'shop.html?id=bloom-petals'
  ];
  for (const p of pages) {
    const [file, query] = p.split('?');
    const dom = await openPage(file, query ? '?' + query : '');
    const d = dom.window.document;
    check(
      p + ': header + footer + one topbar',
      Boolean(
        d.getElementById('site-header') &&
          d.getElementById('site-header').innerHTML.length > 100 &&
          d.getElementById('site-footer') &&
          d.querySelector('.topbar') &&
          d.querySelectorAll('.topbar').length === 1
      )
    );
    const skip = d.querySelector('a.skip-link');
    check(
      p + ': skip link targets the main landmark',
      Boolean(skip && skip.getAttribute('href') && d.querySelector(skip.getAttribute('href')))
    );
    if (file === 'help.html') {
      check('help page has payment + privacy sections', Boolean(d.getElementById('payments') && d.getElementById('privacy')));
    }
    check(p + ': no js/console errors', dom.getErrors().length === 0, dom.getErrors().join(' | '));
    dom.window.close();
  }
}

/* ---------------- 2. Home + browse render real content ---------------- */

async function testStorefront() {
  console.log('\n[2] storefront content');
  const dom = await openPage('index.html');
  const d = dom.window.document;
  check('home featured grid filled', d.querySelectorAll('#home-featured .product-card').length > 0);
  check('home shops filled', d.querySelectorAll('#home-shops .shop-card').length > 0);
  check('home duplicate audit clean', dom.window.auditDuplicateCards('home-test').length === 0);
  check('legacy migration ran', dom.window.localStorage.getItem('stallfree_legacy_migrated') === '1');
  dom.window.close();

  const dom2 = await openPage('products.html');
  check(
    'products grid filled',
    dom2.window.document.querySelectorAll('#products-grid .product-card').length > 0
  );
  check('products duplicate audit clean', dom2.window.auditDuplicateCards('products-test').length === 0);
  check(
    'newest sort option offered',
    Boolean(dom2.window.document.querySelector('#sort-select option[value="newest"]'))
  );
  check(
    'in-stock quick filter offered',
    Array.from(dom2.window.document.querySelectorAll('#pilters .pilter')).some(
      (b) => b.textContent.indexOf('In stock') !== -1
    )
  );
  dom2.window.close();

  const dom3 = await openPage('products.html', '?id=grand-yellow-rose-bouquet');
  const pdp = dom3.window.document.getElementById('product-page');
  check('PDP renders for ?id=', Boolean(pdp && pdp.innerHTML.length > 500));
  dom3.window.close();
}

/* ---------------- 3. Registration + login wiring ---------------- */

async function testAuthForms() {
  console.log('\n[3] registration and login');
  const dom = await openPage('register.html');
  const w = dom.window;
  const d = w.document;

  submit(d, 'register-form');
  await wait(200);
  check(
    'register rejects empty form inline',
    Boolean(d.getElementById('rg-name-error') && !d.getElementById('rg-name-error').classList.contains('hidden'))
  );

  d.getElementById('rg-name').value = 'Ada Lovelace';
  d.getElementById('rg-email').value = 'ada@example.com';
  d.getElementById('rg-password').value = 'secret123';
  d.getElementById('rg-confirm').value = 'secret123';
  submit(d, 'register-form');

  const accounts = await waitFor(() => {
    const raw = w.localStorage.getItem('stallfree_accounts');
    return raw ? JSON.parse(raw) : null;
  }, 15000);
  check('account created', Array.isArray(accounts) && accounts.length === 1);
  if (accounts && accounts[0]) {
    const a = accounts[0];
    check(
      'account has salted hash, no plaintext password',
      Boolean(a.salt && a.hash && a.hash !== 'secret123')
    );
    check('account role is customer', a.role === 'customer');
    check('session started after register', Boolean(w.localStorage.getItem('stallfree_session')));
    check('guest profile adopted into account', Boolean(w.localStorage.getItem('stallfree:' + a.id + ':profile')));
  }

  w.logoutAccount();
  const bad = await w.loginAccount({ email: 'ada@example.com', password: 'wrongpass' });
  check('login rejects wrong password', bad.ok === false);
  const good = await w.loginAccount({ email: 'ada@example.com', password: 'secret123' });
  check('login accepts correct password', good.ok === true && good.account.email === 'ada@example.com');
  check('failed login counted then reset', (JSON.parse(w.localStorage.getItem('stallfree_accounts'))[0].failed || 0) === 0);

  check('register page errors clean', dom.getErrors().length === 0, dom.getErrors().join(' | '));
  dom.window.close();

  const dom2 = await openPage('login.html');
  const d2 = dom2.window.document;
  submit(d2, 'login-form');
  await wait(200);
  check(
    'login form shows inline error',
    Boolean(d2.getElementById('li-email-error') && !d2.getElementById('li-email-error').classList.contains('hidden'))
  );
  check('login page errors clean', dom2.getErrors().length === 0, dom2.getErrors().join(' | '));
  dom2.window.close();
}

/* ---------------- 4. Checkout, double-submit, tracking ---------------- */

async function testCheckout() {
  console.log('\n[4] checkout + tracking');
  const dom = await openPage('orders.html');
  const w = dom.window;
  const d = w.document;

  check('add to cart works', w.addToCart('grand-yellow-rose-bouquet', 2) === true);
  w.toggleCheckout();
  check('checkout form opened', !d.getElementById('checkout-form').classList.contains('hidden'));
  check('checkout token minted', typeof w.__sfCheckoutToken === 'string' && w.__sfCheckoutToken.length > 5);

  d.getElementById('co-name').value = 'Ada Lovelace';
  d.getElementById('co-phone').value = '09171234567';
  d.getElementById('co-address').value = '12 Kalayaan Ave, QC';

  submit(d, 'checkout-form');
  submit(d, 'checkout-form');
  await wait(400);

  let orders = JSON.parse(w.localStorage.getItem('stallfree:orders') || '[]');
  check('exactly one order after double submit', orders.length === 1, 'got ' + orders.length);

  let orderId = null;
  if (orders.length === 1) {
    const o = orders[0];
    orderId = o.id;
    check('order id format', /^SF-\d{10}$/.test(o.id), o.id);
    check(
      'order snapshot has name+price+qty',
      o.items[0].name && o.items[0].price === 1450 && o.items[0].qty === 2
    );
    check('order status placed with history', o.status === 'placed' && o.statusHistory.length === 1);
    check('standard shipping stored on order', o.shippingMethod === 'standard', String(o.shippingMethod));
    check('free delivery applied over threshold', o.shipping === 0, String(o.shipping));
    check('cart cleared after order', w.getCart().length === 0);

    /* idempotency: same client token returns same order */
    w.addToCart('statement-rose-arrangement', 1);
    const again = w.createOrder({ name: 'A', phone: '09171234567', address: 'x' }, { clientToken: o.clientToken });
    check('replayed token returns original order', again.ok === true && again.duplicate === true && again.order.id === o.id);
    orders = JSON.parse(w.localStorage.getItem('stallfree:orders') || '[]');
    check('still one order after replay', orders.length === 1);
  }

  /* express shipping carries its flat fee even above the free-delivery mark */
  w.clearCart();
  w.addToCart('statement-rose-arrangement', 1);
  const expressRes = w.createOrder(
    { name: 'Express Buyer', phone: '09171112222', address: 'Express Ave', shippingMethod: 'express' },
    { clientToken: 'tok-express-test' }
  );
  check(
    'express shipping stored with flat fee',
    expressRes.ok === true && expressRes.order.shippingMethod === 'express' && expressRes.order.shipping === 199,
    expressRes.ok ? 'fee=' + expressRes.order.shipping : expressRes.error
  );

  /* stock clamp — clamps to CURRENT stock (earlier order already consumed 2 of 12) */
  w.clearCart();
  const grandStock = w.productStock('grand-yellow-rose-bouquet');
  w.addToCart('grand-yellow-rose-bouquet', 99);
  const clampEntry = w.getCart().find((i) => i.productId === 'grand-yellow-rose-bouquet');
  check(
    'stock clamps add-to-cart to available',
    Boolean(clampEntry) && clampEntry.qty === grandStock,
    `inCart=${clampEntry && clampEntry.qty} stock=${grandStock}`
  );
  check('order page errors clean', dom.getErrors().length === 0, dom.getErrors().join(' | '));

  const seed = dumpStorage(dom);
  dom.window.close();

  /* tracking page — same store, carried over */
  const dom2 = await openPage('orders.html', '?id=' + encodeURIComponent(orderId) + '&new=1', seed);
  const d2 = dom2.window.document;
  const mount = d2.getElementById('order-mount');
  check('order page renders', Boolean(mount && mount.innerHTML.length > 500));
  check('confirmation banner shown for ?new=1', Boolean(mount.querySelector('.banner-success')));
  check(
    'confirmation states the payment status',
    Boolean(mount.querySelector('.banner-success')) &&
      mount.querySelector('.banner-success').textContent.indexOf('Payment:') !== -1
  );
  check('order summary shows delivery method', mount.textContent.indexOf('Delivery · Standard') !== -1);
  check('timeline rendered with active step', Boolean(mount.querySelector('.track-step.active')));
  check('timeline has 6 flow steps', mount.querySelectorAll('.track-step').length === 6);
  check('order lines rendered', mount.querySelectorAll('.order-line').length === 1);
  check('order page errors clean', dom2.getErrors().length === 0, dom2.getErrors().join(' | '));

  const cancelRes = dom2.window.cancelOrder(orderId);
  check('customer can cancel a placed order', cancelRes.ok === true);
  dom2.window.initOrder();
  check('cancelled order shows terminal state', Boolean(d2.querySelector('.track-terminal')));
  check('cancel re-render errors clean', dom2.getErrors().length === 0, dom2.getErrors().join(' | '));
  dom2.window.close();

  /* other-account privacy */
  const dom3 = await openPage('orders.html');
  const w3 = dom3.window;
  w3.addToCart('statement-rose-arrangement', 1);
  w3.toggleCheckout();
  w3.document.getElementById('co-name').value = 'User One';
  w3.document.getElementById('co-phone').value = '09171234567';
  w3.document.getElementById('co-address').value = 'Addr';
  submit(w3.document, 'checkout-form');
  const got = await waitFor(() => {
    const l = w3.localStorage.getItem('stallfree:orders');
    return l && JSON.parse(l).length === 1;
  });
  check('privacy scenario order created', Boolean(got));
  const orderOne = JSON.parse(w3.localStorage.getItem('stallfree:orders'))[0];

  const reg1 = await w3.registerAccount({
    name: 'User One',
    email: 'one@example.com',
    password: 'password1',
    confirm: 'password1'
  });
  check('first account registers', reg1.ok === true);
  const adopted = JSON.parse(w3.localStorage.getItem('stallfree:orders'))[0];
  check('guest order adopted by first account', adopted.userId === reg1.account.id);
  check('owner can view own order', w3.canViewOrder(adopted) === true);

  w3.logoutAccount();
  const reg2 = await w3.registerAccount({
    name: 'User Two',
    email: 'two@example.com',
    password: 'password2',
    confirm: 'password2'
  });
  check('second account registers', reg2.ok === true);
  const storedForTwo = JSON.parse(w3.localStorage.getItem('stallfree:orders'))[0];
  check('second account cannot view first account order', w3.canViewOrder(storedForTwo) === false);
  check('privacy scenario errors clean', dom3.getErrors().length === 0, dom3.getErrors().join(' | '));
  dom3.window.close();
}

/* ---------------- 5. Admin: guards, bootstrap, management ---------------- */

async function testAdmin() {
  console.log('\n[5] admin guards + bootstrap + management');
  const dom = await openPage('admin.html');
  const w = dom.window;
  const d = w.document;

  check('setup form shown when no admin exists', Boolean(d.getElementById('admin-setup-form')));
  check('dashboard hidden before setup', !d.getElementById('admin-tabs'));

  const guard1 = w.saveCatalogOverride('grand-yellow-rose-bouquet', { price: 100 });
  check('guest cannot edit catalogue', guard1.ok === false);
  const guard2 = w.adminUpdateOrder('SF-0000000000', { status: 'shipped' });
  check('guest cannot update orders', guard2.ok === false);

  d.getElementById('as-key').value = 'short';
  d.getElementById('as-name').value = 'Site Owner';
  d.getElementById('as-email').value = 'owner@example.com';
  d.getElementById('as-password').value = 'adminpass1';
  d.getElementById('as-confirm').value = 'adminpass1';
  submit(d, 'admin-setup-form');
  await wait(800);
  check('setup passphrase shorter than the minimum is rejected', w.adminExists() === false);

  d.getElementById('as-key').value = 'adminpass1';
  submit(d, 'admin-setup-form');
  await wait(800);
  check('setup passphrase equal to the password is rejected', w.adminExists() === false);

  d.getElementById('as-key').value = ADMIN_SETUP_PASSPHRASE;
  submit(d, 'admin-setup-form');
  const isAdminNow = await waitFor(() => w.isAdmin(), 15000);
  check('admin created with a chosen demo passphrase', isAdminNow === true);
  check('setup form closed permanently', w.adminExists() === true);

  const secondSetup = await w.adminSetup({
    key: ADMIN_SETUP_PASSPHRASE_B,
    name: 'Second Owner',
    email: 'second-owner@example.com',
    password: 'adminpass2',
    confirm: 'adminpass2'
  });
  check('second admin setup is rejected', secondSetup.ok === false);
  check('only one admin account exists', w.listAccounts().filter((a) => a.role === 'admin').length === 1);

  const tabs = d.getElementById('admin-tabs');
  check('dashboard tabs rendered', Boolean(tabs && tabs.querySelectorAll('.tab').length === 6));
  check('overview stat cards rendered', d.querySelectorAll('#admin-panel .stat-card').length >= 4);

  const edit = w.saveCatalogOverride('grand-yellow-rose-bouquet', { price: 999, stock: 50 });
  check('admin can edit product', edit.ok === true);
  check('override applied to catalogue', w.findProduct('grand-yellow-rose-bouquet').price === 999);
  check('stock override respected', w.productStock('grand-yellow-rose-bouquet') >= 50);

  w.openProductEditor('grand-yellow-rose-bouquet');
  const photoPreview = d.getElementById('pe-photo-preview');
  const photoInput = d.getElementById('pe-photo');
  check(
    'admin product editor shows a photo preview',
    Boolean(photoPreview && photoPreview.querySelector('img'))
  );
  if (photoInput) {
    photoInput.value = 'photo-1602874801006-test-preview';
    photoInput.dispatchEvent(new w.Event('input', { bubbles: true }));
  }
  check(
    'admin photo preview updates as the URL is typed',
    Boolean(photoPreview && /photo-1602874801006-test-preview/.test(photoPreview.innerHTML))
  );
  w.closeModal();

  const auditTab = d.querySelector('#admin-tabs .tab[data-tab="audit"]');
  if (auditTab) auditTab.click();
  check('admin audit log has a date-range filter', Boolean(d.getElementById('admin-audit-date')));
  const auditDate = d.getElementById('admin-audit-date');
  check(
    'admin audit date filter offers today, 7 and 30 days',
    Boolean(auditDate) && auditDate.options.length === 4
  );

  const arch = w.saveCatalogOverride('grand-yellow-rose-bouquet', { archived: true });
  check('admin can archive', arch.ok === true && w.isListable(w.findProduct('grand-yellow-rose-bouquet')) === false);
  w.saveCatalogOverride('grand-yellow-rose-bouquet', { archived: false });

  const created = w.addCustomProduct({
    name: 'Test Candle',
    price: 250,
    stock: 10,
    categoryId: 'home',
    sellerId: 'clay-kiln',
    description: 'A candle',
    freeShipping: true
  });
  check('admin can add product', created.ok === true && Boolean(w.findProduct(created.product.id)));
  const deleted = w.removeProduct(created.product.id);
  check('custom product deletes outright', deleted.ok === true && !w.findProduct(created.product.id));

  const shopRes = w.saveShopOverride('bloom-petals', { storeName: 'Bloom & Petals Prime' });
  check('admin can edit shop', shopRes.ok === true && w.findSeller('bloom-petals').storeName === 'Bloom & Petals Prime');

  /* order status + tracking (cart lives in the admin's own scope) */
  w.addToCart('statement-rose-arrangement', 1);
  const orderRes = w.createOrder({ name: 'B', phone: '09171112222', address: 'Z' }, { clientToken: 'tok-admin-test' });
  check('order created for admin test', orderRes.ok === true);
  if (orderRes.ok) {
    const skipped = w.adminUpdateOrder(orderRes.order.id, { status: 'shipped' });
    check('admin cannot skip lifecycle steps', skipped.ok === false);

    w.adminUpdateOrder(orderRes.order.id, { status: 'confirmed' });
    w.adminUpdateOrder(orderRes.order.id, { status: 'preparing' });
    const upd = w.adminUpdateOrder(orderRes.order.id, {
      status: 'shipped',
      tracking: { number: 'JNT-12345', courier: 'J&T Express' }
    });
    check('admin updates status + tracking', upd.ok === true && upd.order.status === 'shipped');
    check('status history appended', upd.order.statusHistory.length === 4);
    check('tracking stored', upd.order.tracking.number === 'JNT-12345');
    const audit = w.readAuditLog();
    check('audit log records admin actions', audit.length > 0 && audit.some((e) => e.action.indexOf('admin.') === 0));
  }

  const accounts = w.listAccounts();
  check(
    'admin account listed, secrets stripped',
    accounts.length === 1 && !('hash' in accounts[0]) && accounts[0].role === 'admin'
  );
  const suspendGuard = w.setAccountSuspended(accounts[0].id, true);
  check('admin cannot suspend self', suspendGuard.ok === false);

  w.logoutAccount();
  const afterLogout = w.saveCatalogOverride('grand-yellow-rose-bouquet', { price: 1 });
  check('signed-out session blocked from admin ops', afterLogout.ok === false);

  check('admin page errors clean', dom.getErrors().length === 0, dom.getErrors().join(' | '));
  dom.window.close();
}

/* ---------------- 6. Stock accounting across orders ---------------- */

async function testStock() {
  console.log('\n[6] stock accounting');
  const dom = await openPage('orders.html');
  const w = dom.window;
  const id = 'garden-spill-arrangement';
  const baseline = w.productStock(id);
  w.addToCart(id, 3);
  w.toggleCheckout();
  const d = w.document;
  d.getElementById('co-name').value = 'Stock Test';
  d.getElementById('co-phone').value = '09171234567';
  d.getElementById('co-address').value = 'Addr';
  submit(d, 'checkout-form');
  const got = await waitFor(() => JSON.parse(w.localStorage.getItem('stallfree:orders') || '[]').length === 1);
  check('order placed for stock test', Boolean(got));
  check('stock drops after order', w.productStock(id) === baseline - 3, `${w.productStock(id)} vs ${baseline - 3}`);

  const o = JSON.parse(w.localStorage.getItem('stallfree:orders'))[0];
  const res = w.cancelOrder(o.id);
  check('cancelled order releases stock', res.ok === true && w.productStock(id) === baseline);
  check('stock page errors clean', dom.getErrors().length === 0, dom.getErrors().join(' | '));
  dom.window.close();
}

/* ---------------- 7. Profile persistence, prefill, per-user isolation ---------------- */

async function testProfilePersistence() {
  console.log('\n[7] profile persistence + checkout prefill + isolation');

  const dom = await openPage('profile.html');
  const w = dom.window;
  const d = w.document;
  d.getElementById('p-first').value = 'Grace';
  d.getElementById('p-last').value = 'Hopper';
  d.getElementById('p-phone').value = '09171234567';
  d.getElementById('p-address').value = '12 Kalayaan Ave, QC';
  d.getElementById('profile-form').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
  const guestProfile = await waitFor(() => {
    const raw = w.localStorage.getItem('stallfree:guest:profile');
    return raw ? JSON.parse(raw) : null;
  });
  check(
    'guest profile saves to store',
    Boolean(guestProfile) && guestProfile.firstName === 'Grace' && guestProfile.phone === '09171234567'
  );
  check('save confirmation shown', !d.getElementById('profile-banner').classList.contains('hidden'));
  check('profile page errors clean', dom.getErrors().length === 0, dom.getErrors().join(' | '));
  const seed = dumpStorage(dom);
  dom.window.close();

  const dom2 = await openPage('profile.html', '', seed);
  const d2 = dom2.window.document;
  check(
    'profile persists after reload',
    d2.getElementById('p-first').value === 'Grace' &&
      d2.getElementById('p-address').value === '12 Kalayaan Ave, QC'
  );
  dom2.window.close();

  const dom3 = await openPage('orders.html', '', seed);
  const w3 = dom3.window;
  const d3 = w3.document;
  w3.toggleCheckout();
  check(
    'checkout auto-fills from profile',
    d3.getElementById('co-name').value === 'Grace Hopper' &&
      d3.getElementById('co-phone').value === '09171234567' &&
      d3.getElementById('co-address').value === '12 Kalayaan Ave, QC'
  );
  const reg = await w3.registerAccount({
    name: 'Grace Hopper',
    email: 'grace@example.com',
    password: 'password1',
    confirm: 'password1'
  });
  check('registering adopts guest profile', reg.ok === true);
  const adopted = JSON.parse(w3.localStorage.getItem('stallfree:' + reg.account.id + ':profile'));
  check('profile moved into account scope', Boolean(adopted) && adopted.firstName === 'Grace');
  const seed2 = dumpStorage(dom3);
  check('profile page errors clean', dom3.getErrors().length === 0, dom3.getErrors().join(' | '));
  dom3.window.close();

  const dom4 = await openPage('profile.html', '', seed2);
  const w4 = dom4.window;
  check(
    'signed-in profile shows saved data',
    w4.document.getElementById('p-first').value === 'Grace'
  );

  w4.logoutAccount();
  const reg2 = await w4.registerAccount({
    name: 'Other User',
    email: 'other@example.com',
    password: 'password2',
    confirm: 'password2'
  });
  check('second account registers in same store', reg2.ok === true);
  const graceKey = 'stallfree:' + reg.account.id + ':profile';
  const otherKey = 'stallfree:' + reg2.account.id + ':profile';
  const graceRaw = w4.localStorage.getItem(graceKey);
  const otherRaw = w4.localStorage.getItem(otherKey);
  check(
    "first user's profile untouched by second registration",
    Boolean(graceRaw) && JSON.parse(graceRaw).firstName === 'Grace'
  );
  check(
    "second user's profile does not contain first user's data",
    !otherRaw || JSON.parse(otherRaw).phone !== '09171234567'
  );
  const seed3 = dumpStorage(dom4);
  check('profile isolation errors clean', dom4.getErrors().length === 0, dom4.getErrors().join(' | '));
  dom4.window.close();

  const dom5 = await openPage('profile.html', '', seed3);
  const d5 = dom5.window.document;
  check(
    "second user's page never shows first user's details",
    d5.getElementById('p-phone').value !== '09171234567' &&
      d5.getElementById('p-address').value !== '12 Kalayaan Ave, QC'
  );
  dom5.window.close();
}

/* ---------------- 8. Admin update shows up on the customer's tracking ---------------- */

async function testTrackingEndToEnd() {
  console.log('\n[8] admin update → customer tracking page');

  const dom = await openPage('orders.html');
  const w = dom.window;
  const d = w.document;
  const reg = await w.registerAccount({
    name: 'Cara Buyer',
    email: 'cara@example.com',
    password: 'password1',
    confirm: 'password1'
  });
  check('customer registers', reg.ok === true);
  w.addToCart('statement-rose-arrangement', 1);
  w.toggleCheckout();
  d.getElementById('co-name').value = 'Cara Buyer';
  d.getElementById('co-phone').value = '09170001111';
  d.getElementById('co-address').value = '45 Mabini St, Makati';
  submit(d, 'checkout-form');
  const placed = await waitFor(() => {
    const list = JSON.parse(w.localStorage.getItem('stallfree:orders') || '[]');
    return list.length === 1 ? list : null;
  });
  check('customer order placed', Boolean(placed));
  const orderId = placed[0].id;
  const customerSession = w.localStorage.getItem('stallfree_session');
  const seed = dumpStorage(dom);
  dom.window.close();

  const ownerSeed = Object.assign({}, seed);
  delete ownerSeed.stallfree_session;
  const dom2 = await openPage('admin.html', '', ownerSeed);
  const w2 = dom2.window;
  const d2 = w2.document;
  d2.getElementById('as-key').value = ADMIN_SETUP_PASSPHRASE;
  d2.getElementById('as-name').value = 'Site Owner';
  d2.getElementById('as-email').value = 'owner2@example.com';
  d2.getElementById('as-password').value = 'adminpass1';
  d2.getElementById('as-confirm').value = 'adminpass1';
  submit(d2, 'admin-setup-form');
  const isAdmin = await waitFor(() => w2.isAdmin(), 15000);
  check('admin setup completes in shared store', isAdmin === true);

  const owned = JSON.parse(w2.localStorage.getItem('stallfree:orders'))[0];
  check('customer keeps ownership of their order', owned.userId === reg.account.id);

  w2.adminUpdateOrder(orderId, { status: 'confirmed' });
  w2.adminUpdateOrder(orderId, { status: 'preparing' });
  const upd = w2.adminUpdateOrder(orderId, {
    status: 'shipped',
    tracking: { number: 'JNT-778811', courier: 'J&T Express' }
  });
  check('admin ships order with tracking', upd.ok === true);
  const seed2 = dumpStorage(dom2);
  check('admin page errors clean', dom2.getErrors().length === 0, dom2.getErrors().join(' | '));
  dom2.window.close();

  seed2['stallfree_session'] = customerSession;
  const dom3 = await openPage('orders.html', '?id=' + encodeURIComponent(orderId), seed2);
  const m = dom3.window.document.getElementById('order-mount');
  const text = m.textContent;
  check('customer sees shipped status', text.indexOf('Shipped / In transit') !== -1);
  check(
    'customer sees courier tracking details',
    text.indexOf('JNT-778811') !== -1 && text.indexOf('J&T Express') !== -1
  );
  const active = m.querySelector('.track-step.active');
  check('timeline active step moved forward', Boolean(active) && active.textContent.indexOf('Shipped') !== -1);
  check('support links present on order page', m.querySelectorAll('.order-support a').length === 2);
  check('tracking view errors clean', dom3.getErrors().length === 0, dom3.getErrors().join(' | '));
  dom3.window.close();
}

/* ---------------- 9. Refresh / re-render never duplicates cards ---------------- */

async function testRefreshIdempotence() {
  console.log('\n[9] refresh and re-render idempotence');

  const dom = await openPage('index.html');
  const w = dom.window;
  const n1 = w.document.querySelectorAll('#home-featured .product-card').length;
  w.initHome();
  w.initHome();
  const n2 = w.document.querySelectorAll('#home-featured .product-card').length;
  check('home cards stable across repeated init', n1 > 0 && n2 === n1, `${n1} → ${n2}`);
  check('home duplicate audit clean after re-init', w.auditDuplicateCards('reinit').length === 0);
  const seed = dumpStorage(dom);
  dom.window.close();

  const dom2 = await openPage('products.html', '', seed);
  const w2 = dom2.window;
  const p1 = w2.document.querySelectorAll('#products-grid .product-card').length;
  w2.renderProductsResults();
  w2.renderProductsResults();
  const p2 = w2.document.querySelectorAll('#products-grid .product-card').length;
  check('products stable across re-render', p1 > 0 && p2 === p1, `${p1} → ${p2}`);
  const seed2 = dumpStorage(dom2);
  dom2.window.close();

  const dom3 = await openPage('products.html', '', seed2);
  const p3 = dom3.window.document.querySelectorAll('#products-grid .product-card').length;
  check('products unchanged after full reload', p3 === p1, `${p1} → ${p3}`);
  check('one topbar after reload', dom3.window.document.querySelectorAll('.topbar').length === 1);
  dom3.window.close();
}

/* ---------------- 10. Search, filters, empty state, menu order, logout ---------------- */

async function testSearchFiltersAndMenu() {
  console.log('\n[10] search, filters, empty states, account menu, logout');

  const dom = await openPage('products.html', '?q=rose');
  const qCount = dom.window.document.querySelectorAll('#products-grid .product-card').length;
  check('search q=rose returns results', qCount > 0, String(qCount));
  dom.window.close();

  const dom2 = await openPage('products.html', '?cat=bouquets');
  const cCount = dom2.window.document.querySelectorAll('#products-grid .product-card').length;
  check('category filter returns results', cCount > 0, String(cCount));
  dom2.window.close();

  const dom3 = await openPage('products.html', '?q=zzzxyzzy');
  const d3 = dom3.window.document;
  const none = d3.querySelectorAll('#products-grid .product-card').length;
  check(
    'no-match search shows empty state',
    none === 0 && Boolean(d3.querySelector('#products-grid .empty-state'))
  );
  check('search page errors clean', dom3.getErrors().length === 0, dom3.getErrors().join(' | '));
  dom3.window.close();

  /* signed-in account menu order + logout keeps data */
  const dom4 = await openPage('profile.html');
  const w4 = dom4.window;
  const d4 = w4.document;
  d4.getElementById('p-first').value = 'Menu';
  d4.getElementById('p-last').value = 'Tester';
  d4.getElementById('p-phone').value = '09179998888';
  d4.getElementById('profile-form').dispatchEvent(new w4.Event('submit', { bubbles: true, cancelable: true }));
  const saved = await waitFor(() => w4.localStorage.getItem('stallfree:guest:profile'));
  check('menu scenario saves guest profile first', Boolean(saved));
  const reg = await w4.registerAccount({
    name: 'Menu Tester',
    email: 'menu@example.com',
    password: 'password1',
    confirm: 'password1'
  });
  check('menu scenario registers', reg.ok === true);
  const seed = dumpStorage(dom4);
  dom4.window.close();

  const dom5 = await openPage('profile.html', '', seed);
  const w5 = dom5.window;
  const menu = w5.document.querySelector('#account-menu');
  const anchors = Array.from(menu.querySelectorAll('a')).map((a) => a.getAttribute('href'));
  const expected = [
    'profile.html',
    'orders.html',
    'wishlist.html',
    'sellers.html',
    'profile.html#address',
    'profile.html#settings'
  ];
  check('account menu link order matches plan', JSON.stringify(anchors) === JSON.stringify(expected), anchors.join(','));
  const kids = Array.from(menu.children);
  check(
    'sign out is the last menu item',
    kids.length > 2 && kids[kids.length - 1].matches('button.account-signout'),
    kids[kids.length - 1] && kids[kids.length - 1].outerHTML.slice(0, 60)
  );
  check('sign out separated by a divider', kids[kids.length - 2].classList.contains('account-menu-sep'));

  w5.logoutAccount();
  check('logout clears the session', !w5.localStorage.getItem('stallfree_session'));
  const accts = JSON.parse(w5.localStorage.getItem('stallfree_accounts') || '[]');
  check('logout keeps the account', accts.length === 1);
  check(
    'logout keeps profile data',
    Boolean(w5.localStorage.getItem('stallfree:' + reg.account.id + ':profile'))
  );
  check('menu/logout errors clean', dom5.getErrors().length === 0, dom5.getErrors().join(' | '));
  dom5.window.close();
}

/* ---------------- 11. Navigation friendliness ---------------- */

async function testNavigation() {
  console.log('\n[11] navigation friendliness');

  const dom = await openPage('index.html');
  const d = dom.window.document;
  const labels = Array.from(d.querySelectorAll('.topbar-links a')).map((a) => a.textContent.trim());
  check(
    'topbar has clear site links',
    JSON.stringify(labels) === JSON.stringify(['Home', 'Products', 'Categories', 'Help']),
    labels.join(', ')
  );
  const shopsLinks = Array.from(d.querySelectorAll('.topbar-links a, .header-cats a')).filter(
    (a) => a.textContent.trim() === 'Shops'
  );
  check('exactly one Shops button in the navigation', shopsLinks.length === 1, String(shopsLinks.length));
  check(
    'the Shops button lives in the browse row (mobile menu too)',
    shopsLinks.length === 1 && Boolean(shopsLinks[0].closest('.header-cats'))
  );
  const catRow = Array.from(d.querySelectorAll('#header-cats a')).map((a) => a.textContent.trim());
  check(
    'browse row starts with All products + Shops',
    catRow[0] === 'All products' && catRow[1] === 'Shops',
    catRow.slice(0, 3).join(', ')
  );
  check('browse row ends with Open a stall', catRow[catRow.length - 1] === 'Open a stall');
  const cartIco = d.getElementById('nav-cart');
  check('cart icon labelled clearly', cartIco && cartIco.getAttribute('aria-label') === 'Your cart and orders');
  check('index page errors clean', dom.getErrors().length === 0, dom.getErrors().join(' | '));
  dom.window.close();

  const dom2 = await openPage('help.html');
  const active = dom2.window.document.querySelector('.topbar-links a.active');
  check('help page highlights Help in the topbar', Boolean(active) && active.textContent.trim() === 'Help');
  dom2.window.close();

  const dom3 = await openPage('sellers.html');
  const activeCat = Array.from(dom3.window.document.querySelectorAll('#header-cats a.active')).map((a) =>
    a.textContent.trim()
  );
  check(
    'shops page highlights the single Shops button',
    activeCat.length === 1 && activeCat[0] === 'Shops',
    activeCat.join(', ')
  );
  check(
    'no duplicate Shops link in the topbar',
    !Array.from(dom3.window.document.querySelectorAll('.topbar-links a')).some(
      (a) => a.textContent.trim() === 'Shops'
    )
  );
  dom3.window.close();

  const css = fs.readFileSync(path.join(ROOT, 'css', 'styles.css'), 'utf8');
  check('mobile keeps topbar quick links visible', !/\.topbar-links\s*\{[^}]*display:\s*none/s.test(css));
}

/* ---------------- 12. Followed shops get their own section ---------------- */

async function testFollowedShopsFirst() {
  console.log('\n[12] followed shops get their own section');

  const dom = await openPage('sellers.html');
  const w = dom.window;
  const d = w.document;
  const order = () =>
    Array.from(d.querySelectorAll('#sellers-grid .shop-card')).map((c) => c.dataset.shop);
  const followedOrder = () =>
    Array.from(d.querySelectorAll('#followed-grid .shop-card')).map((c) => c.dataset.shop);
  const section = d.getElementById('followed-section');

  const before = order();
  check('shops grid renders every stall', before.length === 9, String(before.length));
  check(
    'followed section hidden with no follows',
    Boolean(section) && section.classList.contains('hidden')
  );
  check('followed grid empty with no follows', followedOrder().length === 0);

  const first = before[before.length - 1];
  const second = before[before.length - 2];
  const rest = before.slice(0, before.length - 2);

  const clickFollow = (id) => {
    const btn = d.querySelector(`[data-action="follow"][data-id="${id}"]`);
    btn.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  };
  clickFollow(first);
  clickFollow(second);

  check(
    'followed shops move to the followed section',
    JSON.stringify(followedOrder()) === JSON.stringify([second, first]),
    followedOrder().join(', ')
  );
  check(
    'followed shops leave the all-shops grid',
    !order().includes(first) && !order().includes(second),
    order().join(', ')
  );
  check('followed section is visible', !section.classList.contains('hidden'));
  check(
    'the other stalls keep their seed order',
    JSON.stringify(order()) === JSON.stringify(rest)
  );
  check(
    'followed cards are highlighted',
    d.querySelectorAll('#followed-grid .shop-card.is-following').length === 2
  );
  check('sellers page errors clean', dom.getErrors().length === 0, dom.getErrors().join(' | '));

  clickFollow(second);
  check('unfollowed shop returns to the all-shops grid', order().includes(second), order().join(', '));
  check(
    'followed section shrinks back',
    followedOrder().length === 1 && followedOrder()[0] === first,
    followedOrder().join(', ')
  );
  check(
    'unfollow removes the highlight',
    !d.querySelector(`#sellers-grid [data-shop="${second}"]`).classList.contains('is-following')
  );
  check('unfollow errors clean', dom.getErrors().length === 0, dom.getErrors().join(' | '));
  dom.window.close();
}

/* ---------------- 13. Pick items to check out + saved phone number ---------------- */

async function testCheckoutSelectionAndSavedPhone() {
  console.log('\n[13] checkout item selection + saved number');
  const dom = await openPage('orders.html');
  const w = dom.window;
  const d = w.document;

  w.addToCart('grand-yellow-rose-bouquet', 1);
  w.addToCart('statement-rose-arrangement', 1);
  w.renderCart();

  const boxes = () => Array.from(d.querySelectorAll('input[data-action="cart-select"]'));
  check('every cart item gets a tick box', boxes().length === 2, String(boxes().length));
  check('items start ticked', boxes().length === 2 && boxes().every((b) => b.checked));

  /* untick one item */
  const untick = boxes().find((b) => b.dataset.id === 'statement-rose-arrangement');
  untick.checked = false;
  untick.dispatchEvent(new w.Event('change', { bubbles: true }));
  const retick = boxes().find((b) => b.dataset.id === 'statement-rose-arrangement');
  check('unticked item stays in the cart list', boxes().length === 2, String(boxes().length));
  check(
    'unticked item is dimmed',
    Boolean(retick) && retick.closest('.cart-item').classList.contains('is-unchecked')
  );
  check(
    'summary reports the partial selection',
    Boolean(d.getElementById('cart-selection-note')) &&
      d.getElementById('cart-selection-note').textContent.indexOf('1 of 2') !== -1,
    d.getElementById('cart-selection-note') ? d.getElementById('cart-selection-note').textContent : 'no note'
  );
  check('checkout button still enabled with one item picked', d.getElementById('checkout-btn').disabled === false);

  /* untick everything and the checkout button locks */
  const other = boxes().find((b) => b.dataset.id === 'grand-yellow-rose-bouquet');
  other.checked = false;
  other.dispatchEvent(new w.Event('change', { bubbles: true }));
  check('checkout button locks with nothing selected', d.getElementById('checkout-btn').disabled === true);
  const back = boxes().find((b) => b.dataset.id === 'grand-yellow-rose-bouquet');
  back.checked = true;
  back.dispatchEvent(new w.Event('change', { bubbles: true }));
  check('checkout button unlocks when re-selected', d.getElementById('checkout-btn').disabled === false);

  /* check out with only the first item ticked */
  w.toggleCheckout();
  d.getElementById('co-name').value = 'Ada Lovelace';
  d.getElementById('co-phone').value = '09171234567';
  d.getElementById('co-address').value = '12 Kalayaan Ave, QC';
  submit(d, 'checkout-form');
  await wait(400);

  const orders = JSON.parse(w.localStorage.getItem('stallfree:orders') || '[]');
  check('one order placed', orders.length === 1, 'got ' + orders.length);
  if (orders.length === 1) {
    check(
      'order holds only the ticked item',
      orders[0].items.length === 1 && orders[0].items[0].productId === 'grand-yellow-rose-bouquet',
      orders[0].items.map((i) => i.productId).join(', ')
    );
    check(
      'order totals match the ticked item only',
      orders[0].subtotal === orders[0].items[0].price,
      String(orders[0].subtotal)
    );
  }
  const left = w.getCart();
  check(
    'unticked item stays behind in the cart',
    left.length === 1 && left[0].productId === 'statement-rose-arrangement',
    left.map((i) => i.productId).join(', ')
  );
  check(
    'phone number saved after checkout',
    Boolean(w.getProfile()) && w.getProfile().phone === '09171234567',
    w.getProfile() ? w.getProfile().phone : 'no profile'
  );
  check('orders page errors clean', dom.getErrors().length === 0, dom.getErrors().join(' | '));

  const seed = dumpStorage(dom);
  dom.window.close();

  /* next visit: the saved number is offered, with a way to replace it */
  const dom2 = await openPage('orders.html', '', seed);
  const w2 = dom2.window;
  const d2 = w2.document;
  w2.toggleCheckout();
  const switcher = d2.getElementById('co-phone-switch');
  check(
    'saved number line shown at checkout',
    Boolean(switcher) && !switcher.classList.contains('hidden'),
    switcher ? switcher.className : 'missing'
  );
  check(
    'saved number offered in the field',
    d2.getElementById('co-phone').value === '09171234567',
    d2.getElementById('co-phone').value
  );
  check(
    'saved number displayed on the line',
    Boolean(d2.getElementById('co-phone-saved-num')) &&
      d2.getElementById('co-phone-saved-num').textContent === '09171234567'
  );
  const otherBtn = d2.querySelector('[data-action="co-other-phone"]');
  check('use-a-different-number button present', Boolean(otherBtn));
  if (otherBtn) {
    otherBtn.dispatchEvent(new w2.MouseEvent('click', { bubbles: true }));
    check('button clears the number', d2.getElementById('co-phone').value === '');
    check('button hides the saved line', switcher.classList.contains('hidden'));
    check('field is ready for the new number', d2.activeElement === d2.getElementById('co-phone'));
  }
  check('second page errors clean', dom2.getErrors().length === 0, dom2.getErrors().join(' | '));
  dom2.window.close();
}

/* ---------------- 14. Regression matrix: auth, shop, order, admin, data ---------------- */

async function testRegressionMatrix() {
  console.log('\n[14] regression matrix: auth, shop, order, admin, data');

  /* AUTH-02 / AUTH-07: public registration is customer-only and emails are unique */
  const authDom = await openPage('register.html');
  const w = authDom.window;
  const roleReg = await w.registerAccount({
    name: 'Edge Customer A',
    email: 'edge.a@example.com',
    password: 'password1',
    confirm: 'password1',
    role: 'admin'
  });
  check(
    'AUTH-07 submitted role is ignored on registration',
    roleReg.ok === true && roleReg.account.role === 'customer',
    roleReg.ok ? roleReg.account.role : roleReg.message
  );
  w.logoutAccount();

  const dupReg = await w.registerAccount({
    name: 'Duplicate A',
    email: '  EDGE.A@Example.COM ',
    password: 'password1',
    confirm: 'password1'
  });
  check('AUTH-02 duplicate email rejected case-insensitively', dupReg.ok === false);
  check('AUTH-02 no duplicate account created', w.listAccounts().length === 1);
  check('AUTH-02 rejected signup leaves no session', w.isAuthenticated() === false);

  const regB = await w.registerAccount({
    name: 'Edge Customer B',
    email: 'edge.b@example.com',
    password: 'password1',
    confirm: 'password1'
  });
  check('second customer registers normally', regB.ok === true && regB.account.role === 'customer');
  check('no administrator exists yet', w.adminExists() === false);
  const customerSeed = dumpStorage(authDom);
  authDom.window.close();

  /* ADMIN-05 + ADMIN-02 + DATA-02: administrator setup and guarded operations.
     First-run setup is a signed-out owner ceremony, so drop the customer
     session from the seed while keeping the registered accounts. */
  const ownerSeed = Object.assign({}, customerSeed);
  delete ownerSeed.stallfree_session;
  const adminDom = await openPage('admin.html', '', ownerSeed);
  const wa = adminDom.window;
  const da = wa.document;
  da.getElementById('as-key').value = ADMIN_SETUP_PASSPHRASE;
  da.getElementById('as-name').value = 'Edge Owner';
  da.getElementById('as-email').value = 'owner.edge@example.com';
  da.getElementById('as-password').value = 'adminpass1';
  da.getElementById('as-confirm').value = 'adminpass1';
  submit(da, 'admin-setup-form');
  check('admin setup for edge cases', (await waitFor(() => wa.isAdmin(), 15000)) === true);

  /* AUTH-06: once an admin exists, a signed-in customer sees a denial */
  const customerSessionSeed = Object.assign({}, dumpStorage(adminDom), {
    stallfree_session: customerSeed['stallfree_session']
  });
  const deniedDom = await openPage('admin.html', '', customerSessionSeed);
  const wd = deniedDom.window;
  const deniedText = (wd.document.getElementById('admin-mount') || {}).textContent || '';
  check(
    'AUTH-06 customer sees administrator denial',
    deniedText.indexOf('Administrator access required') !== -1 && !wd.document.getElementById('admin-tabs')
  );
  check(
    'AUTH-06 customer cannot mutate catalogue',
    wd.saveCatalogOverride('grand-yellow-rose-bouquet', { price: 1 }).ok === false
  );
  check('AUTH-06 customer cannot export demo data', wd.demoBackupData().ok === false);
  check('customer admin page errors clean', deniedDom.getErrors().length === 0, deniedDom.getErrors().join(' | '));
  deniedDom.window.close();

  const customerB = wa.listAccounts().find((a) => a.email === 'edge.b@example.com');
  check('customer account listed for admin', Boolean(customerB));
  if (customerB) {
    const suspended = wa.setAccountSuspended(customerB.id, true);
    const listed = wa.listAccounts().find((a) => a.id === customerB.id);
    check('ADMIN-05 admin suspends a customer', suspended.ok === true && listed.suspended === true);
    const suspendedLogin = await wa.loginAccount({
      email: 'edge.b@example.com',
      password: 'password1'
    });
    check('ADMIN-05 suspended customer cannot sign in', suspendedLogin.ok === false);
    check('ADMIN-05 administrator session survives', wa.isAdmin() === true);
  }

  wa.addToCart('statement-rose-arrangement', 1);
  const archiveOrder = wa.createOrder(
    { name: 'Archive Check', phone: '09170002222', address: '1 Demo Street' },
    { clientToken: 'edge-archive-check' }
  );
  check('order exists before archiving a product', archiveOrder.ok === true);
  const archived = wa.saveCatalogOverride('statement-rose-arrangement', { archived: true });
  check(
    'ADMIN-02 archived product is unlisted',
    archived.ok === true && wa.isListable(wa.findProduct('statement-rose-arrangement')) === false
  );
  check(
    'ADMIN-02 old order snapshot survives archiving',
    archiveOrder.ok === true &&
      wa.getOrderById(archiveOrder.order.id).items[0].productId === 'statement-rose-arrangement'
  );

  wa.saveCatalogOverride('garden-spill-arrangement', { stock: 0 });
  check('SHOP-04 zero-stock product refuses add-to-cart', wa.addToCart('garden-spill-arrangement', 1) === false);
  check('SHOP-04 zero-stock product is not in the cart', wa.getCart().length === 0);

  const backup = wa.demoBackupData();
  check('DATA-02 administrator can export demo data', backup.ok === true && backup.data.schemaVersion === 1);
  const payload = backup.ok ? JSON.stringify(backup.data) : '';
  check(
    'DATA-02 export excludes accounts and secrets',
    backup.ok &&
      backup.data.accounts === undefined &&
      !/"stallfree_accounts"/.test(payload) &&
      !/"(hash|salt|emailLower|iterations)"\s*:/.test(payload)
  );
  check(
    'DATA-02 backup validates before import',
    backup.ok && wa.validateDemoBackup(backup.data).ok === true
  );

  const ordersBeforeBadImport = JSON.stringify(wa.getAllOrders());
  const badImport = wa.importDemoData({ app: 'StallFree', schemaVersion: 99, orders: [] });
  check('DATA-02 unsupported backup version rejected', badImport.ok === false);
  check(
    'DATA-02 rejected import leaves data unchanged',
    JSON.stringify(wa.getAllOrders()) === ordersBeforeBadImport
  );
  check(
    'DATA-02 malformed backup structure rejected',
    wa.validateDemoBackup({ app: 'StallFree', schemaVersion: 1, orders: 'not-a-list' }).ok === false
  );

  const originalShopName = wa.findSeller('bloom-petals').storeName;
  wa.saveShopOverride('bloom-petals', { storeName: 'Mutated Shop Name' });
  check('backup test mutates shop data', wa.findSeller('bloom-petals').storeName === 'Mutated Shop Name');
  wa.saveCatalogOverride('garden-spill-arrangement', { archived: true });
  check(
    'backup test adds an override not in the backup',
    wa.isListable(wa.findProduct('garden-spill-arrangement')) === false
  );
  const restored = wa.importDemoData(backup.data);
  check('DATA-02 valid backup imports', restored.ok === true);
  check(
    'DATA-02 import restores shop data',
    wa.findSeller('bloom-petals').storeName === originalShopName,
    `expected ${originalShopName}, got ${wa.findSeller('bloom-petals').storeName}`
  );
  check(
    'DATA-02 import clears overrides that are not in the backup',
    wa.isListable(wa.findProduct('garden-spill-arrangement')) === true
  );
  check(
    'DATA-02 import keeps archived state and order history',
    wa.findProduct('statement-rose-arrangement').archived === true &&
      Boolean(wa.getOrderById(archiveOrder.order.id))
  );
  check('admin edge-case page errors clean', adminDom.getErrors().length === 0, adminDom.getErrors().join(' | '));
  const adminSeed = dumpStorage(adminDom);
  adminDom.window.close();

  /* ADMIN-02 public storefront + SHOP-04 sold-out card */
  const archivedSearch = await openPage('products.html', '?q=Statement', adminSeed);
  check(
    'ADMIN-02 archived product hidden from public catalogue',
    !archivedSearch.window.document.querySelector('[data-product="statement-rose-arrangement"]')
  );
  check(
    'public storefront after admin edits errors clean',
    archivedSearch.getErrors().length === 0,
    archivedSearch.getErrors().join(' | ')
  );
  archivedSearch.window.close();

  const soldOutDom = await openPage('products.html', '?q=Garden', adminSeed);
  const soldOutCard = soldOutDom.window.document.querySelector('[data-product="garden-spill-arrangement"]');
  const soldOutButton = soldOutCard ? soldOutCard.querySelector('.pc-add') : null;
  check(
    'SHOP-04 sold-out card disables purchase',
    Boolean(soldOutButton) &&
      soldOutButton.disabled === true &&
      soldOutButton.textContent.indexOf('Sold out') !== -1
  );
  check('sold-out storefront errors clean', soldOutDom.getErrors().length === 0, soldOutDom.getErrors().join(' | '));
  soldOutDom.window.close();

  /* ORDER-03: invalid checkout never creates an order */
  const badCheckoutDom = await openPage('orders.html');
  const wc = badCheckoutDom.window;
  const dc = wc.document;
  wc.addToCart('grand-yellow-rose-bouquet', 1);
  wc.toggleCheckout();
  dc.getElementById('co-phone').value = '123';
  submit(dc, 'checkout-form');
  const badOrders = JSON.parse(wc.localStorage.getItem('stallfree:orders') || '[]');
  check('ORDER-03 invalid checkout saves no order', badOrders.length === 0);
  check(
    'ORDER-03 invalid checkout shows actionable errors',
    !dc.getElementById('checkout-error').classList.contains('hidden') &&
      !dc.getElementById('co-name-error').classList.contains('hidden') &&
      !dc.getElementById('co-address-error').classList.contains('hidden')
  );
  check('invalid checkout errors clean', badCheckoutDom.getErrors().length === 0, badCheckoutDom.getErrors().join(' | '));
  badCheckoutDom.window.close();

  /* ORDER-04: a valid order survives a fresh page load in the same origin */
  const orderDom = await openPage('orders.html');
  const wo = orderDom.window;
  const doo = wo.document;
  wo.addToCart('grand-yellow-rose-bouquet', 1);
  wo.toggleCheckout();
  doo.getElementById('co-name').value = 'Reload Customer';
  doo.getElementById('co-phone').value = '09171113333';
  doo.getElementById('co-address').value = '9 Reload Road';
  submit(doo, 'checkout-form');
  const placed = await waitFor(() => {
    const list = JSON.parse(wo.localStorage.getItem('stallfree:orders') || '[]');
    return list.length === 1 ? list[0] : null;
  });
  const orderSeed = dumpStorage(orderDom);
  orderDom.window.close();
  check('ORDER-04 order placed before reload', Boolean(placed));
  const reloadDom = await openPage('orders.html', '', orderSeed);
  const reloadText = (reloadDom.window.document.getElementById('order-history') || {}).textContent || '';
  check('ORDER-04 own order persists after reload', Boolean(placed) && reloadText.indexOf(placed.id) !== -1);
  check('reloaded order page errors clean', reloadDom.getErrors().length === 0, reloadDom.getErrors().join(' | '));
  reloadDom.window.close();

  /* SHOP-03: wishlist persists and is scoped to one account */
  const wishDom = await openPage('products.html');
  const ww = wishDom.window;
  const wishA = await ww.registerAccount({
    name: 'Wishlist A',
    email: 'wish.a@example.com',
    password: 'password1',
    confirm: 'password1'
  });
  check('wishlist customer registers', wishA.ok === true);
  const wished = ww.toggleWishlist('grand-yellow-rose-bouquet');
  const wishSeed = dumpStorage(wishDom);
  check('SHOP-03 save wishlist works', wished === true && ww.isWished('grand-yellow-rose-bouquet'));
  ww.logoutAccount();
  const regWishB = await ww.registerAccount({
    name: 'Wishlist B',
    email: 'wish.b@example.com',
    password: 'password1',
    confirm: 'password1'
  });
  check('SHOP-03 second customer registers', regWishB.ok === true);
  check('SHOP-03 wishlist is account-scoped', ww.getWishlist().length === 0);
  const wishReload = await openPage('wishlist.html', '', wishSeed);
  const wr = wishReload.window;
  check(
    'SHOP-03 saved wishlist survives reload',
    wr.isWished('grand-yellow-rose-bouquet') && wr.document.querySelectorAll('#wishlist-grid .wish-item').length === 1
  );
  check('wishlist page errors clean', wishReload.getErrors().length === 0, wishReload.getErrors().join(' | '));
  wishReload.window.close();
  wishDom.window.close();

  /* DATA-01: corrupt localStorage values are ignored rather than crashing */
  const corruptSeed = {
    'stallfree:guest:cart': '{not valid json',
    'stallfree:guest:wishlist': 'also broken',
    'stallfree:orders': 'broken orders',
    'stallfree_accounts': 'broken accounts',
    'stallfree_session': 'broken session',
    'stallfree:catalog_overrides': 'broken catalogue',
    'stallfree:shop_overrides': 'broken shops',
    'stallfree_audit_log': 'broken audit'
  };
  const corruptDom = await openPage('orders.html', '', corruptSeed);
  const wx = corruptDom.window;
  check('DATA-01 corrupt cart falls back to empty', wx.getCart().length === 0);
  check('DATA-01 corrupt orders fall back to empty', wx.getOrders().length === 0);
  check('DATA-01 corrupt session falls back to signed out', wx.isAuthenticated() === false);
  check('DATA-01 corrupt accounts fall back to no admin', wx.adminExists() === false);
  check('DATA-01 corrupt store still renders', Boolean(wx.document.getElementById('order-history')));
  check('malformed localStorage errors clean', corruptDom.getErrors().length === 0, corruptDom.getErrors().join(' | '));
  corruptDom.window.close();
}

/* ---------------- 15. Demo disclaimers, toggles, editable email, availability ---------------- */

async function testImplementationPolish() {
  console.log('\n[15] disclaimers, password toggles, profile email, availability');

  const sentence = DEMO_DISCLAIMER;
  const normalize = (text) => String(text || '').replace(/\s+/g, ' ').trim();

  const helpDom = await openPage('help.html');
  const helpNote = helpDom.window.document.getElementById('help-demo-disclaimer');
  check(
    'DEMO help page shows the mandatory disclaimer',
    Boolean(helpNote) && normalize(helpNote.textContent).indexOf(sentence) !== -1
  );
  check('help page errors clean', helpDom.getErrors().length === 0, helpDom.getErrors().join(' | '));
  helpDom.window.close();

  /* password show/hide controls on sign in, registration and settings */
  const loginDom = await openPage('login.html');
  const lw = loginDom.window;
  const ld = lw.document;
  const loginToggle = ld.querySelector('[data-toggle-password="li-password"]');
  const loginPassword = ld.getElementById('li-password');
  if (loginToggle) loginToggle.click();
  check(
    'login password toggle reveals the field',
    Boolean(loginToggle && loginPassword) &&
      loginPassword.type === 'text' &&
      loginToggle.getAttribute('aria-pressed') === 'true'
  );
  if (loginToggle) loginToggle.click();
  check(
    'login password toggle hides the field again',
    Boolean(loginToggle && loginPassword) &&
      loginPassword.type === 'password' &&
      loginToggle.getAttribute('aria-pressed') === 'false'
  );
  check('login page errors clean', loginDom.getErrors().length === 0, loginDom.getErrors().join(' | '));
  loginDom.window.close();

  const regDom = await openPage('register.html');
  const rw = regDom.window;
  const rd = rw.document;
  const regToggle = rd.querySelector('[data-toggle-password="rg-confirm"]');
  const regConfirm = rd.getElementById('rg-confirm');
  if (regToggle) regToggle.click();
  check(
    'register password toggle reveals the confirmation field',
    Boolean(regToggle && regConfirm) &&
      regConfirm.type === 'text' &&
      regToggle.getAttribute('aria-pressed') === 'true'
  );
  if (regToggle) regToggle.click();
  check(
    'register password toggle restores the masked field',
    Boolean(regToggle && regConfirm) &&
      regConfirm.type === 'password' &&
      regToggle.getAttribute('aria-pressed') === 'false'
  );
  check('register page errors clean', regDom.getErrors().length === 0, regDom.getErrors().join(' | '));
  regDom.window.close();

  /* profile email is editable for a signed-in account, unique, and persistent */
  const authDom = await openPage('login.html');
  const aw = authDom.window;
  const regOne = await aw.registerAccount({
    name: 'Polish One',
    email: 'polish.one@example.com',
    password: 'password1',
    confirm: 'password1'
  });
  check('polish profile account registers', regOne.ok === true);
  aw.logoutAccount();
  const regTwo = await aw.registerAccount({
    name: 'Polish Two',
    email: 'polish.two@example.com',
    password: 'password1',
    confirm: 'password1'
  });
  check('polish duplicate-source account registers', regTwo.ok === true);
  const relog = await aw.loginAccount({ email: 'polish.one@example.com', password: 'password1' });
  check('polish account signs back in', relog.ok === true);
  const profileSeed = dumpStorage(authDom);
  authDom.window.close();

  const profileDom = await openPage('profile.html', '', profileSeed);
  const pw = profileDom.window;
  const pd = pw.document;
  const emailInput = pd.getElementById('p-email');
  const firstInput = pd.getElementById('p-first');
  check(
    'profile email is editable for signed-in accounts',
    Boolean(emailInput) && emailInput.readOnly === false && emailInput.disabled === false
  );

  const profileToggle = pd.querySelector('[data-toggle-password="pw-current"]');
  const currentPassword = pd.getElementById('pw-current');
  if (profileToggle) profileToggle.click();
  check(
    'profile password toggle reveals the current password',
    Boolean(profileToggle && currentPassword) &&
      currentPassword.type === 'text' &&
      profileToggle.getAttribute('aria-pressed') === 'true'
  );
  if (profileToggle) profileToggle.click();

  if (firstInput) firstInput.value = 'Polish One';
  if (emailInput) {
    emailInput.value = 'polish.two@example.com';
    submit(pd, 'profile-form');
  }
  const emailError = pd.getElementById('p-email-error');
  check(
    'profile rejects an email already used by another account',
    Boolean(emailError) && !emailError.classList.contains('hidden')
  );
  check(
    'profile keeps the old email after a duplicate',
    pw.getSessionAccount() && pw.getSessionAccount().email === 'polish.one@example.com'
  );

  if (emailInput) {
    emailInput.value = 'polish.renamed@example.com';
    submit(pd, 'profile-form');
  }
  check(
    'profile saves a unique new email',
    pw.getSessionAccount() && pw.getSessionAccount().email === 'polish.renamed@example.com'
  );
  const storedAccounts = JSON.parse(pw.localStorage.getItem('stallfree_accounts') || '[]');
  check(
    'profile email change persists to the account store',
    storedAccounts.some((a) => a && a.email === 'polish.renamed@example.com')
  );
  check('profile page errors clean', profileDom.getErrors().length === 0, profileDom.getErrors().join(' | '));
  profileDom.window.close();

  /* checkout + receipt carry the exact required demo sentence */
  const coDom = await openPage('orders.html');
  const cw = coDom.window;
  const cd = cw.document;
  const checkoutNote = cd.getElementById('checkout-disclaimer');
  check(
    'checkout shows the mandatory disclaimer',
    Boolean(checkoutNote) && normalize(checkoutNote.textContent).indexOf(sentence) !== -1
  );
  cw.addToCart('grand-yellow-rose-bouquet', 1);
  cw.toggleCheckout();
  cd.getElementById('co-name').value = 'Demo Buyer';
  cd.getElementById('co-phone').value = '09171234567';
  cd.getElementById('co-address').value = '1 Demo Street';
  submit(cd, 'checkout-form');
  const createdOrder = await waitFor(() => {
    const raw = cw.localStorage.getItem('stallfree:orders');
    const list = raw ? JSON.parse(raw) : [];
    return list.length ? list[0] : false;
  });
  check('disclaimer scenario order created', Boolean(createdOrder));
  check('checkout page errors clean', coDom.getErrors().length === 0, coDom.getErrors().join(' | '));
  const receiptSeed = dumpStorage(coDom);
  coDom.window.close();

  if (createdOrder && createdOrder.id) {
    const receiptDom = await openPage(
      'orders.html',
      '?id=' + encodeURIComponent(createdOrder.id),
      receiptSeed
    );
    const receiptNote = receiptDom.window.document.getElementById('order-demo-disclaimer');
    check(
      'order receipt shows the mandatory disclaimer',
      Boolean(receiptNote) && normalize(receiptNote.textContent).indexOf(sentence) !== -1
    );
    check(
      'order receipt errors clean',
      receiptDom.getErrors().length === 0,
      receiptDom.getErrors().join(' | ')
    );
    receiptDom.window.close();
  }

  /* unavailable cart lines are visible, disabled and never ordered */
  const unavailableSeed = {
    'stallfree:guest:cart': JSON.stringify([
      { productId: 'garden-spill-arrangement', qty: 1 }
    ]),
    'stallfree:catalog_overrides': JSON.stringify({
      'garden-spill-arrangement': { stock: 0 }
    })
  };
  const unDom = await openPage('orders.html', '', unavailableSeed);
  const uw = unDom.window;
  const ud = uw.document;
  const unLine = ud.querySelector('[data-cart-item="garden-spill-arrangement"]');
  const unCheckbox = unLine ? unLine.querySelector('[data-action="cart-select"]') : null;
  check(
    'unavailable cart line is marked and explained',
    Boolean(unLine) &&
      unLine.classList.contains('is-unavailable') &&
      Boolean(unLine.querySelector('.cart-unavailable'))
  );
  check('unavailable cart checkbox is disabled', Boolean(unCheckbox && unCheckbox.disabled));
  check(
    'checkout is disabled when no available line is selected',
    Boolean(ud.getElementById('checkout-btn') && ud.getElementById('checkout-btn').disabled)
  );
  check('unavailable line is excluded from checkout', uw.getSelectedCartEntries().length === 0);
  const blockedOrder = uw.createOrder(
    { name: 'Blocked Buyer', phone: '09171234567', address: '2 Demo Street' },
    { clientToken: 'blocked-unavailable-test' }
  );
  check('createOrder rejects an unavailable cart', blockedOrder.ok === false);
  check('unavailable cart errors clean', unDom.getErrors().length === 0, unDom.getErrors().join(' | '));
  unDom.window.close();

  /* archived products no longer render a product detail page */
  const archivedSeed = {
    'stallfree:catalog_overrides': JSON.stringify({
      'statement-rose-arrangement': { archived: true }
    })
  };
  const archivedPdp = await openPage(
    'products.html',
    '?id=statement-rose-arrangement',
    archivedSeed
  );
  const pdpMount = archivedPdp.window.document.getElementById('product-page');
  check(
    'archived product detail shows the not-found state',
    Boolean(pdpMount) && normalize(pdpMount.textContent).indexOf('That listing has moved on') !== -1
  );
  check(
    'archived product detail errors clean',
    archivedPdp.getErrors().length === 0,
    archivedPdp.getErrors().join(' | ')
  );
  archivedPdp.window.close();
}

/* ---------------- 16. Auth hardening: one-admin rule, spoofing, sessions, access ---------------- */

async function testAuthHardening() {
  console.log('\n[16] auth hardening: one-admin rule, role spoofing, session lifecycle, access');

  /* --- Registration UI must offer no role control, and the API must
         ignore any forged role value. --- */
  const regDom = await openPage('register.html');
  const rw = regDom.window;
  const rd = rw.document;
  const roleControls = rd.querySelectorAll(
    'select[name="role"], input[name="role"], select#rg-role, input#rg-role, [data-role]'
  );
  check('register.html exposes no role control', roleControls.length === 0);

  const spoof = await rw.registerAccount({
    name: 'Role Spoofer',
    email: 'spoof@example.com',
    password: 'password1',
    confirm: 'password1',
    role: 'admin'
  });
  check(
    'role spoofing: forged role is ignored on registration',
    spoof.ok === true && spoof.account.role === 'customer'
  );
  check('role spoofing: isAdmin() stays false', rw.isAdmin() === false);
  check('role spoofing: requireAdmin() refuses the customer', rw.requireAdmin().ok === false);

  rw.logoutAccount();
  const normLogin = await rw.loginAccount({ email: '  SPOOF@Example.COM ', password: 'password1' });
  check(
    'login normalizes email consistently',
    normLogin.ok === true && normLogin.account.email === 'spoof@example.com'
  );

  const patched = rw.updateOwnAccount({ role: 'admin', name: 'Spoofer Renamed' });
  const afterPatch = rw.getSessionAccount();
  check(
    'role spoofing: profile update cannot promote role',
    patched.ok === true && afterPatch.role === 'customer',
    afterPatch ? afterPatch.role : 'no account'
  );

  const customerSeed = dumpStorage(regDom);
  check('role spoofing errors clean', regDom.getErrors().length === 0, regDom.getErrors().join(' | '));
  regDom.window.close();

  /* --- Session expiry: cleared, one-off notice, records preserved. --- */
  const expDom = await openPage('index.html', '', customerSeed);
  const ew = expDom.window;
  check('expiry setup: signed in before expiry', ew.isAuthenticated() === true);
  const sess = JSON.parse(ew.localStorage.getItem('stallfree_session'));
  sess.expiresAt = Date.now() - 1000;
  ew.localStorage.setItem('stallfree_session', JSON.stringify(sess));
  check('expiry: currentSession() returns null', ew.currentSession() === null);
  check('expiry: isAuthenticated() false', ew.isAuthenticated() === false);
  check('expiry: session key removed', ew.localStorage.getItem('stallfree_session') === null);
  check('expiry: one-off notice recorded', ew.localStorage.getItem('stallfree_session_notice') === 'expired');
  check('expiry: notice consumed once', ew.consumeSessionNotice() === 'expired');
  check('expiry: notice not repeated', ew.consumeSessionNotice() === '');
  check('expiry: account record preserved', ew.listAccounts().length === 1);
  check('expiry page errors clean', expDom.getErrors().length === 0, expDom.getErrors().join(' | '));
  expDom.window.close();

  /* --- Suspended session: cleared with a distinct notice. --- */
  const acctList = JSON.parse(customerSeed.stallfree_accounts);
  acctList[0].suspended = true;
  const suspSeed = Object.assign({}, customerSeed, {
    stallfree_accounts: JSON.stringify(acctList)
  });
  const suspDom = await openPage('index.html', '', suspSeed);
  const sw1 = suspDom.window;
  check('suspended: session cleared', sw1.currentSession() === null);
  check('suspended: isAuthenticated() false', sw1.isAuthenticated() === false);
  check('suspended: notice recorded', sw1.localStorage.getItem('stallfree_session_notice') === 'suspended');
  check('suspended: isAdmin() false', sw1.isAdmin() === false);
  check('suspended: requireAdmin() refuses', sw1.requireAdmin().ok === false);
  check('suspended: account record preserved', sw1.listAccounts().length === 1);
  check('suspended page errors clean', suspDom.getErrors().length === 0, suspDom.getErrors().join(' | '));
  suspDom.window.close();

  /* --- Orphaned session (account deleted): cleared without a crash. --- */
  const orphanSeed = JSON.parse(JSON.stringify(customerSeed));
  const orphanSess = JSON.parse(orphanSeed.stallfree_session);
  orphanSess.userId = 'usr_does_not_exist';
  orphanSeed.stallfree_session = JSON.stringify(orphanSess);
  const orphanDom = await openPage('index.html', '', orphanSeed);
  const ow = orphanDom.window;
  check('orphaned session cleared', ow.currentSession() === null && ow.isAuthenticated() === false);
  check('orphaned session: requireAdmin() refuses', ow.requireAdmin().ok === false);
  check('orphaned page errors clean', orphanDom.getErrors().length === 0, orphanDom.getErrors().join(' | '));
  orphanDom.window.close();

  /* --- First-run setup: only when no admin exists, and never while a
         customer is signed in. No preset credential in the field. --- */
  const freshDom = await openPage('admin.html');
  const fw = freshDom.window;
  const fd = fw.document;
  check('setup form shown on a clean browser', Boolean(fd.getElementById('as-key')));
  const keyField = fd.getElementById('as-key');
  check(
    'setup passphrase is not pre-filled or displayed',
    Boolean(keyField) &&
      keyField.getAttribute('type') === 'password' &&
      keyField.value === '' &&
      keyField.getAttribute('value') === null
  );
  fd.getElementById('as-key').value = ADMIN_SETUP_PASSPHRASE;
  fd.getElementById('as-name').value = 'Owner One';
  fd.getElementById('as-email').value = 'owner.one@example.com';
  fd.getElementById('as-password').value = 'adminpass1';
  fd.getElementById('as-confirm').value = 'adminpass1';
  submit(fd, 'admin-setup-form');
  check('first admin created', (await waitFor(() => fw.isAdmin(), 15000)) === true);
  check('first admin: setup closed permanently', fw.adminExists() === true);

  /* --- Second admin is refused through the normal API. --- */
  const second = await fw.adminSetup({
    key: ADMIN_SETUP_PASSPHRASE_B,
    name: 'Owner Two',
    email: 'owner.two@example.com',
    password: 'adminpass2',
    confirm: 'adminpass2'
  });
  check('second admin refused', second.ok === false);
  check('exactly one admin after refusal', fw.listAccounts().filter((a) => a.role === 'admin').length === 1);
  check('admin requireAdmin() allows the sole admin', fw.requireAdmin().ok === true);

  /* --- Signed out with an admin present: sign-in prompt, never setup. --- */
  fw.logoutAccount();
  check('logout clears session key', fw.localStorage.getItem('stallfree_session') === null);
  check('logout keeps account records', JSON.parse(fw.localStorage.getItem('stallfree_accounts')).length === 1);
  const signedOutSeed = dumpStorage(freshDom);
  check('fresh-admin errors clean', freshDom.getErrors().length === 0, freshDom.getErrors().join(' | '));
  freshDom.window.close();

  const soDom = await openPage('admin.html', '', signedOutSeed);
  const soMount = (soDom.window.document.getElementById('admin-mount') || {}).textContent || '';
  check('signed-out dashboard shows sign-in prompt', soMount.indexOf('Please sign in') !== -1);
  check('signed-out dashboard hides setup form', !soDom.window.document.getElementById('admin-setup-form'));
  check('signed-out dashboard hides tabs', !soDom.window.document.getElementById('admin-tabs'));
  check('signed-out admin page errors clean', soDom.getErrors().length === 0, soDom.getErrors().join(' | '));
  soDom.window.close();

  /* --- Customer signed in while an admin exists: denial, no tabs. --- */
  const custWithAdminSeed = Object.assign({}, signedOutSeed, {
    stallfree_accounts: JSON.stringify(
      JSON.parse(signedOutSeed.stallfree_accounts).concat(JSON.parse(customerSeed.stallfree_accounts))
    ),
    stallfree_session: customerSeed.stallfree_session
  });
  const custDom = await openPage('admin.html', '', custWithAdminSeed);
  const custMount = (custDom.window.document.getElementById('admin-mount') || {}).textContent || '';
  check('customer direct URL shows access denied', custMount.indexOf('Administrator access required') !== -1);
  check('customer direct URL hides tabs', !custDom.window.document.getElementById('admin-tabs'));
  check('customer direct URL hides setup form', !custDom.window.document.getElementById('admin-setup-form'));
  check('customer direct URL: requireAdmin() refuses', custDom.window.requireAdmin().ok === false);
  check('customer direct access errors clean', custDom.getErrors().length === 0, custDom.getErrors().join(' | '));
  custDom.window.close();

  /* --- Signed-in customer with NO admin: setup must not be reachable. --- */
  const custOnlyDom = await openPage('admin.html', '', customerSeed);
  const custOnlyMount = (custOnlyDom.window.document.getElementById('admin-mount') || {}).textContent || '';
  check(
    'setup unreachable while a customer is signed in',
    custOnlyMount.indexOf('Administrator access required') !== -1 &&
      !custOnlyDom.window.document.getElementById('admin-setup-form')
  );
  custOnlyDom.window.close();

  /* --- Redirect safety: only local pages are ever used. --- */
  const redirOk = await openPage('login.html', '?next=products.html');
  check('login respects a local next target', redirOk.window.authNextTarget({ role: 'customer' }) === 'products.html');
  redirOk.window.close();

  const redirBad = await openPage('login.html', '?next=https%3A%2F%2Fevil.example.com');
  check('login rejects an off-site next target', redirBad.window.authNextTarget({ role: 'customer' }) === 'index.html');
  redirBad.window.close();

  const redirDot = await openPage('login.html', '?next=..%2F..%2Fevil.html');
  check('login rejects a traversal next target', redirDot.window.authNextTarget({ role: 'customer' }) === 'index.html');
  redirDot.window.close();

  const redirNone = await openPage('login.html');
  check('login falls back with no next param', redirNone.window.authNextTarget({ role: 'customer' }) === 'index.html');
  check('admin account always reaches the dashboard', redirNone.window.authNextTarget({ role: 'admin' }) === 'admin.html');
  check('redirect page errors clean', redirNone.getErrors().length === 0, redirNone.getErrors().join(' | '));
  redirNone.window.close();
}

/* ---------------- 17. Storefront discovery: catalogue, filters, PDP, shops ---------------- */

const browseCardPrices = (doc) =>
  Array.from(doc.querySelectorAll('#products-grid .product-card .pc-price .price')).map((el) =>
    Number(el.textContent.replace(/[^\d]/g, ''))
  );

async function testStorefrontDiscovery() {
  console.log('\n[17] storefront discovery: routing, filters, PDP accuracy, shop mapping');

  /* --- catalogue integrity through the shared read helpers --- */
  const browseDom = await openPage('products.html');
  const bw = browseDom.window;
  const bd = bw.document;
  const listable = bw.filteredProducts();
  check('catalogue exposes listable products', listable.length > 0);
  check(
    'every listable product maps to a real shop',
    listable.every((p) => Boolean(bw.findSeller(p.sellerId)))
  );
  check(
    'every listable product maps to a real category',
    listable.every((p) => Boolean(bw.findCategory(p.categoryId)))
  );
  check('catalogue product ids are unique', new Set(listable.map((p) => p.id)).size === listable.length);
  check(
    'browse cards link to resolvable detail pages',
    Array.from(bd.querySelectorAll('#products-grid .product-card')).every((card) => {
      const href = card.querySelector('.pc-title a').getAttribute('href');
      const id = decodeURIComponent(href.replace('products.html?id=', ''));
      const p = bw.findProduct(id);
      return Boolean(p) && bw.isListable(p) && href === 'products.html?id=' + encodeURIComponent(p.id);
    })
  );
  check(
    'prices use grouped peso formatting',
    bw.formatPrice(1450) === '\u20B11,450' && bw.formatPrice(0) === '\u20B10'
  );
  check('browse page errors clean', browseDom.getErrors().length === 0, browseDom.getErrors().join(' | '));
  browseDom.window.close();

  /* --- categories come from seed data and counts match the live catalogue --- */
  const catDom = await openPage('categories.html');
  const cw = catDom.window;
  const catCards = Array.from(catDom.window.document.querySelectorAll('#categories-grid .cat-card'));
  check('category directory renders tiles', catCards.length > 0);
  const catMismatches = catCards.filter((card) => {
    const href = card.querySelector('a.cat-card-tile').getAttribute('href');
    const id = new URL(href, cw.location.href).searchParams.get('cat');
    const expected = cw.productsByCategory(id).length;
    const chip = (card.querySelector('.chip') || {}).textContent || '';
    return !id || parseInt(chip, 10) !== expected;
  });
  check(
    'category counts match the live catalogue',
    catMismatches.length === 0,
    catMismatches.map((c) => c.textContent.trim().slice(0, 40)).join(' | ')
  );
  check(
    'category tiles link to real filtered browse pages',
    catCards.every((card) =>
      card.querySelector('a.cat-card-tile').getAttribute('href').startsWith('products.html?cat=')
    )
  );
  check('category page errors clean', catDom.getErrors().length === 0, catDom.getErrors().join(' | '));
  catDom.window.close();

  /* --- seller directory and shop storefront mapping --- */
  const sellDom = await openPage('sellers.html');
  const sw = sellDom.window;
  const shopCards = Array.from(sw.document.querySelectorAll('#sellers-grid .shop-card'));
  check('seller directory renders every stall', shopCards.length > 0);
  check(
    'every shop card links to its storefront',
    shopCards.every((card) => {
      const id = card.dataset.shop;
      const href = card.querySelector('.shop-name a').getAttribute('href');
      return Boolean(sw.findSeller(id)) && href === 'shop.html?id=' + encodeURIComponent(id);
    })
  );
  check(
    'every stall has a non-empty storefront',
    shopCards.every((card) => sw.productsBySeller(card.dataset.shop).length > 0)
  );
  const multiShopId = shopCards
    .map((card) => card.dataset.shop)
    .find((id) => new Set(sw.productsBySeller(id).map((p) => p.categoryId)).size > 1);
  const shopId = multiShopId || (shopCards[0] && shopCards[0].dataset.shop);
  const shopProducts = sw.productsBySeller(shopId);
  const shopName = sw.findSeller(shopId).storeName;
  check('seller page errors clean', sellDom.getErrors().length === 0, sellDom.getErrors().join(' | '));
  sellDom.window.close();

  const shopDom = await openPage('shop.html', '?id=' + encodeURIComponent(shopId));
  const sw2 = shopDom.window;
  const sd = shopDom.window.document;
  const shopGridCards = Array.from(sd.querySelectorAll('#shop-grid .product-card'));
  check(
    'shop page lists exactly that shop catalogue',
    shopGridCards.length === shopProducts.length,
    shopGridCards.length + ' vs ' + shopProducts.length
  );
  check(
    'shop page contains only that shop products',
    shopGridCards.every((card) => sw2.findProduct(card.dataset.product).sellerId === shopId)
  );
  check(
    'shop hero shows the mapped seller name',
    (sd.querySelector('.shop-hero-info h1') || {}).textContent === shopName
  );
  const shopTabs = Array.from(sd.querySelectorAll('#shop-tabs .tab'));
  check('shop tabs reflect the shop catalogue', shopTabs.length >= 2);
  if (shopTabs.length > 1) {
    const tab = shopTabs[1];
    const catId = tab.dataset.cat;
    const expected = shopProducts.filter((p) => p.categoryId === catId).length;
    tab.dispatchEvent(new shopDom.window.MouseEvent('click', { bubbles: true }));
    const filtered = Array.from(sd.querySelectorAll('#shop-grid .product-card'));
    check(
      'shop category tab filters the grid',
      filtered.length === expected &&
        filtered.every((card) => sw2.findProduct(card.dataset.product).categoryId === catId)
    );
    check(
      'shop category tab updates aria-selected',
      tab.getAttribute('aria-selected') === 'true' &&
        shopTabs[0].getAttribute('aria-selected') === 'false'
    );
  }
  check('shop page errors clean', shopDom.getErrors().length === 0, shopDom.getErrors().join(' | '));
  shopDom.window.close();

  /* --- search / filter / sort combinations --- */
  const ascDom = await openPage('products.html', '?sort=price-asc');
  const ascPrices = browseCardPrices(ascDom.window.document);
  const ascExpected = ascDom.window.filteredProducts().slice(0, ascPrices.length).map((p) => p.price);
  check(
    'price ascending sort is ordered',
    ascPrices.length > 1 && ascPrices.every((v, i) => i === 0 || ascPrices[i - 1] <= v)
  );
  check('price ascending sort matches the shared list', JSON.stringify(ascPrices) === JSON.stringify(ascExpected));
  ascDom.window.close();

  const descDom = await openPage('products.html', '?sort=price-desc');
  const descPrices = browseCardPrices(descDom.window.document);
  check(
    'price descending sort is ordered',
    descPrices.length > 1 && descPrices.every((v, i) => i === 0 || descPrices[i - 1] >= v)
  );
  descDom.window.close();

  const comboDom = await openPage('products.html', '?cat=bouquets&price=o1000&free=1&sort=price-asc');
  const comboW = comboDom.window;
  const comboD = comboW.document;
  const comboCards = Array.from(comboD.querySelectorAll('#products-grid .product-card'));
  check(
    'combined search filters keep every constraint',
    comboCards.length > 0 &&
      comboCards.every((card) => {
        const p = comboW.findProduct(card.dataset.product);
        return p.categoryId === 'bouquets' && p.price >= 1000 && p.freeShipping;
      })
  );
  const comboCount = parseInt((comboD.getElementById('results-count') || {}).textContent || '', 10);
  check('combined filter result count is honest', comboCount === comboW.filteredProducts().length);
  const comboPrices = browseCardPrices(comboD);
  check(
    'combined filter sort still applies',
    comboPrices.every((v, i) => i === 0 || comboPrices[i - 1] <= v)
  );
  comboDom.window.close();

  const shopFilterDom = await openPage('products.html', '?shop=' + encodeURIComponent('bloom-petals'));
  const shopFilterCards = Array.from(
    shopFilterDom.window.document.querySelectorAll('#products-grid .product-card')
  );
  check(
    'seller filter shows only that shop',
    shopFilterCards.length > 0 &&
      shopFilterCards.every(
        (card) => shopFilterDom.window.findProduct(card.dataset.product).sellerId === 'bloom-petals'
      )
  );
  check(
    'seller filter renders a shop breadcrumb',
    (() => {
      const crumb = shopFilterDom.window.document.querySelector('#browse-crumb');
      const name = shopFilterDom.window.findSeller('bloom-petals').storeName;
      return (
        Boolean(crumb) &&
        crumb.textContent.indexOf(name) !== -1 &&
        Boolean(crumb.querySelector('a[href="products.html"]'))
      );
    })()
  );
  shopFilterDom.window.close();

  const emptyDom = await openPage('products.html', '?cat=no-such-category');
  const emptyD = emptyDom.window.document;
  check(
    'unknown category shows a coherent empty state',
    Boolean(emptyD.querySelector('#products-grid .empty-state')) &&
      Boolean(emptyD.querySelector('#products-grid [data-action="clear-filters"]'))
  );
  check('unknown category result count is zero', emptyDom.window.filteredProducts().length === 0);
  check('unknown category errors clean', emptyDom.getErrors().length === 0, emptyDom.getErrors().join(' | '));
  emptyDom.window.close();

  /* --- promo override flows into the detail page --- */
  const overrideSeed = {
    'stallfree:catalog_overrides': JSON.stringify({
      'grand-yellow-rose-bouquet': { price: 999, compareAt: 1500, stock: 50 }
    })
  };
  const pdpDom = await openPage('products.html', '?id=grand-yellow-rose-bouquet', overrideSeed);
  const pw = pdpDom.window;
  const pd = pw.document;
  const pdpProduct = pw.findProduct('grand-yellow-rose-bouquet');
  const pdpShop = pw.findSeller(pdpProduct.sellerId);
  check(
    'PDP price uses the effective override',
    (pd.querySelector('.pdp-price .price') || {}).textContent === pw.formatPrice(999)
  );
  check(
    'PDP keeps the compare-at price',
    (pd.querySelector('.pdp-price .price-was') || {}).textContent === pw.formatPrice(1500)
  );
  check('PDP marks the saving', Boolean(pd.querySelector('.pdp-price .chip-sale')));
  check(
    'PDP stock matches the shared stock helper',
    ((pd.querySelector('.buybox-row .muted') || {}).textContent || '').indexOf(
      String(pw.productStock(pdpProduct.id))
    ) !== -1
  );
  check(
    'PDP names the mapped shop with a working link',
    (pd.querySelector('.pdp-shop-line a') || {}).textContent === pdpShop.storeName &&
      pd.querySelector('.pdp-shop-line a').getAttribute('href') ===
        'shop.html?id=' + encodeURIComponent(pdpShop.id)
  );
  check(
    'PDP photos fall back gracefully when a URL fails',
    (pd.querySelector('#pdp-hero') || {}).getAttribute('onerror').indexOf('this.remove()') !== -1
  );
  check(
    'PDP breadcrumbs reach home, catalogue and shop',
    Boolean(pd.querySelector('.breadcrumb a[href="index.html"]')) &&
      Boolean(pd.querySelector('.breadcrumb a[href="products.html"]')) &&
      Boolean(
        pd.querySelector('.breadcrumb a[href="shop.html?id=' + encodeURIComponent(pdpShop.id) + '"]')
      )
  );
  check('PDP errors clean', pdpDom.getErrors().length === 0, pdpDom.getErrors().join(' | '));
  pdpDom.window.close();

  /* --- sold-out availability is honest on the detail page --- */
  const soldSeed = {
    'stallfree:catalog_overrides': JSON.stringify({ 'fresh-bloom-bouquet': { stock: 0 } })
  };
  const soldDom = await openPage('products.html', '?id=fresh-bloom-bouquet', soldSeed);
  const soldD = soldDom.window.document;
  check(
    'sold-out detail disables purchasing',
    soldDom.window.productStock('fresh-bloom-bouquet') === 0 &&
      !soldD.querySelector('[data-action="pdp-add"]') &&
      !soldD.querySelector('[data-action="buy-now"]')
  );
  check(
    'sold-out detail explains availability',
    soldD.getElementById('product-page').textContent.indexOf('Sold out') !== -1
  );
  check('sold-out detail errors clean', soldDom.getErrors().length === 0, soldDom.getErrors().join(' | '));
  soldDom.window.close();

  /* --- unknown identifiers fail softly --- */
  const missingPdp = await openPage('products.html', '?id=no-such-listing');
  check(
    'unknown product id shows a reset state',
    missingPdp.window.document.getElementById('product-page').textContent.indexOf(
      'That listing has moved on'
    ) !== -1 && Boolean(missingPdp.window.document.querySelector('#product-page a[href="products.html"]'))
  );
  check(
    'unknown product id errors clean',
    missingPdp.getErrors().length === 0,
    missingPdp.getErrors().join(' | ')
  );
  missingPdp.window.close();

  const missingShop = await openPage('shop.html', '?id=no-such-shop');
  check(
    'unknown shop id shows a reset state',
    missingShop.window.document.getElementById('shop-page').textContent.indexOf('Shop not found') !==
      -1 && Boolean(missingShop.window.document.querySelector('#shop-page a[href="sellers.html"]'))
  );
  check('unknown shop id errors clean', missingShop.getErrors().length === 0, missingShop.getErrors().join(' | '));
  missingShop.window.close();

  /* --- admin-created products flow through the same read helpers --- */
  const customProduct = {
    id: 'test-custom-keychain',
    name: 'Test Custom Keychain',
    price: 275,
    sellerId: 'bloom-petals',
    categoryId: 'keychains',
    rating: 0,
    reviews: 0,
    description: 'A custom listing created through the admin dashboard.',
    photo: '',
    badge: 'new',
    materials: 'Resin',
    processing: '2 days',
    freeShipping: false,
    stock: 7,
    sales: 0,
    tags: []
  };
  const customSeed = { 'stallfree:custom_products': JSON.stringify([customProduct]) };
  const customDom = await openPage(
    'products.html',
    '?q=' + encodeURIComponent(customProduct.name),
    customSeed
  );
  const customCards = Array.from(customDom.window.document.querySelectorAll('#products-grid .product-card'));
  check(
    'custom admin product is visible in the catalogue',
    customCards.length === 1 && customCards[0].dataset.product === customProduct.id
  );
  check(
    'custom admin product card formats its price',
    (customCards[0].querySelector('.pc-price .price') || {}).textContent ===
      customDom.window.formatPrice(customProduct.price)
  );
  check(
    'custom admin product errors clean',
    customDom.getErrors().length === 0,
    customDom.getErrors().join(' | ')
  );
  customDom.window.close();

  const customPdpDom = await openPage('products.html', '?id=' + customProduct.id, customSeed);
  const customPdp = customPdpDom.window.document;
  check(
    'custom admin product detail renders honestly',
    (customPdp.querySelector('.pdp-title') || {}).textContent === customProduct.name &&
      (customPdp.querySelector('.pdp-price .price') || {}).textContent ===
        customPdpDom.window.formatPrice(customProduct.price) &&
      customPdp.getElementById('product-page').textContent.indexOf('7 in stock') !== -1
  );
  check(
    'custom admin product detail errors clean',
    customPdpDom.getErrors().length === 0,
    customPdpDom.getErrors().join(' | ')
  );
  customPdpDom.window.close();

  /* --- admin edits to shops surface in the storefront --- */
  const shopOverrideSeed = {
    'stallfree:shop_overrides': JSON.stringify({
      'bloom-petals': {
        storeName: 'Bloom Test Studio',
        tagline: 'Override tagline',
        location: 'Cebu City'
      }
    })
  };
  const renamedDom = await openPage('products.html', '?id=grand-yellow-rose-bouquet', shopOverrideSeed);
  check(
    'shop override is shown on the product detail',
    (renamedDom.window.document.querySelector('.pdp-shop-line a') || {}).textContent ===
      'Bloom Test Studio'
  );
  renamedDom.window.close();

  const renamedShopDom = await openPage('shop.html', '?id=bloom-petals', shopOverrideSeed);
  check(
    'shop override is shown on the storefront',
    (renamedShopDom.window.document.querySelector('.shop-hero-info h1') || {}).textContent ===
      'Bloom Test Studio'
  );
  renamedShopDom.window.close();

  /* --- escaped text and safe photo URLs --- */
  const xss = '<img src=x onerror="window.__sf_xss=1">';
  const xssSeed = {
    'stallfree:catalog_overrides': JSON.stringify({
      'grand-yellow-rose-bouquet': { name: xss, description: xss }
    })
  };
  const xssDom = await openPage('products.html', '?id=grand-yellow-rose-bouquet', xssSeed);
  const xw = xssDom.window;
  const xd = xw.document;
  check(
    'product names are escaped in the detail title',
    !xd.querySelector('.pdp-title img') && xd.querySelector('.pdp-title').textContent === xss
  );
  check(
    'product descriptions are escaped',
    !xd.querySelector('.pdp-desc img') && xd.querySelector('.pdp-desc').textContent.indexOf('<img') === 0
  );
  check('escaped product text cannot execute', xw.__sf_xss === undefined);
  check(
    'photo URLs cannot break out of the src attribute',
    !/[<>"']/.test(xw.photoUrl('https://example.com/a"><script>alert(1)</script>'))
  );
  check('escaped PDP errors clean', xssDom.getErrors().length === 0, xssDom.getErrors().join(' | '));
  xssDom.window.close();

  const xssBrowseDom = await openPage('products.html', '?q=large%20bouquet', xssSeed);
  const xssCard = xssBrowseDom.window.document.querySelector(
    '#products-grid [data-product="grand-yellow-rose-bouquet"]'
  );
  check(
    'product names are escaped on cards',
    Boolean(xssCard) &&
      !xssCard.querySelector('.pc-title img') &&
      xssCard.querySelector('.pc-title').textContent.trim() === xss
  );
  check(
    'escaped card errors clean',
    xssBrowseDom.getErrors().length === 0,
    xssBrowseDom.getErrors().join(' | ')
  );
  xssBrowseDom.window.close();

  /* --- controls stay native and keyboard-reachable --- */
  const filterDom = await openPage('products.html');
  const fw = filterDom.window;
  const fd = filterDom.window.document;
  const pill = Array.from(fd.querySelectorAll('#pilters .pilter')).find(
    (b) => b.textContent.indexOf('Under') !== -1
  );
  check(
    'quick filters are native buttons',
    Boolean(pill) && pill.tagName === 'BUTTON' && pill.getAttribute('type') === 'button'
  );
  if (pill) {
    pill.focus();
    check('quick filter can take keyboard focus', fd.activeElement === pill);
    pill.dispatchEvent(new fw.MouseEvent('click', { bubbles: true }));
    const filteredPrices = browseCardPrices(fd);
    check(
      'quick filter applies the price band',
      filteredPrices.length > 0 && filteredPrices.every((v) => v <= 250)
    );
    check(
      'quick filter exposes its pressed state',
      (() => {
        const active = Array.from(fd.querySelectorAll('#pilters .pilter')).find(
          (b) => b.textContent.indexOf('Under') !== -1
        );
        return Boolean(active) && active.getAttribute('aria-pressed') === 'true';
      })()
    );
    const chip = fd.querySelector('#active-chips [data-action="chip-remove"]');
    check('quick filter adds a removable chip', Boolean(chip));
    if (chip) {
      chip.dispatchEvent(new fw.MouseEvent('click', { bubbles: true }));
      const refreshed = Array.from(fd.querySelectorAll('#pilters .pilter')).find(
        (b) => b.textContent.indexOf('Under') !== -1
      );
      check(
        'removing the chip clears the quick filter',
        Boolean(refreshed) && refreshed.getAttribute('aria-pressed') === 'false'
      );
    }
  }
  const sortSelect = fd.getElementById('sort-select');
  check('sort control is a native select', Boolean(sortSelect) && sortSelect.tagName === 'SELECT');
  if (sortSelect) {
    sortSelect.value = 'price-desc';
    sortSelect.dispatchEvent(new fw.Event('change', { bubbles: true }));
    const sortedDesc = browseCardPrices(fd);
    check(
      'sort control reorders the grid',
      sortedDesc.length > 1 && sortedDesc.every((v, i) => i === 0 || sortedDesc[i - 1] >= v)
    );
    check('sort choice is reflected in the URL', fw.location.search.indexOf('sort=price-desc') !== -1);
  }
  check('browse controls errors clean', filterDom.getErrors().length === 0, filterDom.getErrors().join(' | '));
  filterDom.window.close();

  const galleryDom = await openPage('products.html', '?id=grand-yellow-rose-bouquet');
  const gw = galleryDom.window;
  const gd = gw.document;
  const thumbs = Array.from(gd.querySelectorAll('#pdp-thumbs .pdp-thumb'));
  check(
    'detail gallery offers focusable photo buttons',
    thumbs.length > 1 && thumbs.every((t) => t.tagName === 'BUTTON')
  );
  if (thumbs.length > 1) {
    const hero = gd.getElementById('pdp-hero');
    const before = hero.getAttribute('src');
    thumbs[1].focus();
    check('detail photo button can take keyboard focus', gd.activeElement === thumbs[1]);
    thumbs[1].dispatchEvent(new gw.MouseEvent('click', { bubbles: true }));
    check('detail photo button switches the hero', hero.getAttribute('src') !== before);
    check(
      'detail photo button sets aria-selected',
      thumbs[1].getAttribute('aria-selected') === 'true' &&
        thumbs[0].getAttribute('aria-selected') === 'false'
    );
  }
  check('detail gallery errors clean', galleryDom.getErrors().length === 0, galleryDom.getErrors().join(' | '));
  galleryDom.window.close();

  /* --- practical mobile-readability checks (static; jsdom has no layout) --- */
  const pages = ['index.html', 'products.html', 'categories.html', 'sellers.html', 'shop.html'];
  check(
    'storefront pages declare a mobile viewport',
    pages.every(
      (file) =>
        fs
          .readFileSync(path.join(ROOT, file), 'utf8')
          .indexOf('name="viewport" content="width=device-width, initial-scale=1.0"') !== -1
    )
  );
  const css = fs.readFileSync(path.join(ROOT, 'css', 'styles.css'), 'utf8');
  check(
    'mobile grid keeps cards at a readable width',
    /@media \(max-width: 760px\)[\s\S]*?\.products-grid\s*\{[^}]*minmax\(160px/.test(css)
  );
  check(
    'mobile PDP collapses to one column',
    /@media \(max-width: 900px\)[\s\S]*?\.pdp\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/.test(
      css
    )
  );
  check('quick filters scroll instead of clipping', /\.pilters\s*\{[^}]*overflow-x:\s*auto/.test(css));
  check(
    'shop hero adapts below tablet width',
    /@media \(max-width: 760px\)[\s\S]*?\.shop-hero-body/.test(css)
  );
}

/* ---------------- 18. cart, wishlist and demo checkout ---------------- */

async function testPurchaseSimulation() {
  console.log('\n[18] cart, wishlist and demo checkout');

  const dom = await openPage('orders.html');
  const w = dom.window;
  const d = w.document;

  /* --- cart: scoped key, duplicate merge, quantity limits, removal --- */
  w.clearCart();
  check(
    'cart persists in the scoped guest key',
    w.addToCart('grand-yellow-rose-bouquet', 2) === true &&
      Boolean(w.localStorage.getItem('stallfree:guest:cart'))
  );
  w.addToCart('grand-yellow-rose-bouquet', 3);
  let cart = w.getCart();
  check(
    'duplicate adds merge into one product line',
    cart.length === 1 && cart[0].productId === 'grand-yellow-rose-bouquet' && cart[0].qty === 5,
    JSON.stringify(cart)
  );
  check('cart count sums merged quantities', w.getCartCount() === 5);
  check(
    'quantity step up keeps one line',
    w.updateCartQty('grand-yellow-rose-bouquet', 2) === true && w.getCart()[0].qty === 7
  );
  check(
    'quantity step down keeps one line',
    w.updateCartQty('grand-yellow-rose-bouquet', -3) === true && w.getCart()[0].qty === 4
  );
  w.setCartQty('grand-yellow-rose-bouquet', 1);
  check(
    'quantity cannot fall below one',
    w.updateCartQty('grand-yellow-rose-bouquet', -1) === false && w.getCart()[0].qty === 1
  );
  const grandStock = w.productStock('grand-yellow-rose-bouquet');
  check(
    'quantity caps at effective available stock',
    w.setCartQty('grand-yellow-rose-bouquet', 999) === true && w.getCart()[0].qty === grandStock
  );
  check(
    'adding past stock is refused',
    w.addToCart('grand-yellow-rose-bouquet', 1) === false && w.getCart()[0].qty === grandStock
  );
  w.removeFromCart('grand-yellow-rose-bouquet');
  check('remove clears the product line', w.getCart().length === 0 && w.getCartCount() === 0);

  /* --- malformed stored quantities cannot corrupt totals or stock --- */
  w.localStorage.setItem(
    'stallfree:guest:cart',
    JSON.stringify([
      { productId: 'grand-yellow-rose-bouquet', qty: -3 },
      { productId: 'statement-rose-arrangement', qty: 'abc' },
      { productId: 'fresh-bloom-bouquet', qty: '2.9' },
      { productId: 'garden-spill-arrangement', qty: null },
      { productId: 'grand-yellow-rose-bouquet', qty: 2 }
    ])
  );
  w.renderCart();
  const cleanCart = w.getCart();
  const cleanQty = (id) => (cleanCart.find((i) => i.productId === id) || {}).qty;
  check(
    'malformed quantities are normalised to positive integers',
    cleanCart.length > 0 && cleanCart.every((i) => Number.isInteger(i.qty) && i.qty >= 1),
    JSON.stringify(cleanCart)
  );
  check('negative stored quantity becomes one', cleanQty('grand-yellow-rose-bouquet') === 3);
  check('non-numeric stored quantity becomes one', cleanQty('statement-rose-arrangement') === 1);
  check('decimal stored quantity is truncated', cleanQty('fresh-bloom-bouquet') === 2);
  check('missing stored quantity becomes one', cleanQty('garden-spill-arrangement') === 1);
  check(
    'duplicate stored lines merge into one',
    cleanCart.filter((i) => i.productId === 'grand-yellow-rose-bouquet').length === 1
  );
  const cleanTotals = w.getTotals('standard', w.getCartEntries());
  check(
    'malformed cart cannot produce a negative or NaN total',
    Number.isFinite(cleanTotals.subtotal) &&
      Number.isFinite(cleanTotals.total) &&
      cleanTotals.subtotal > 0 &&
      cleanTotals.total > 0,
    JSON.stringify(cleanTotals)
  );
  check(
    'cart summary renders the normalised total without NaN',
    d.getElementById('cart-summary').textContent.indexOf('NaN') === -1 &&
      d.getElementById('cart-summary').textContent.indexOf('\u20B1') !== -1
  );
  check('cart list renders no negative line price', d.getElementById('cart-list').textContent.indexOf('-\u20B1') === -1);

  /* --- checkout: validation, demo labelling, snapshots, totals --- */
  w.clearCart();
  w.addToCart('statement-rose-arrangement', 1);
  w.toggleCheckout();
  const form = d.getElementById('checkout-form');
  const paymentValues = Array.from(d.querySelectorAll('input[name="payment"]')).map((i) => i.value);
  check(
    'checkout offers demo payment choices only',
    paymentValues.length === 2 && paymentValues.every((v) => /demo|cash on delivery/i.test(v)),
    JSON.stringify(paymentValues)
  );
  check(
    'checkout requests no card or payment credentials',
    !form.querySelector('[name*="card"], [name*="cvv"], [name*="cvc"], [name*="expiry"], [name*="iban"]')
  );
  check(
    'checkout states it is a demo order',
    /demo/i.test(form.textContent) && /no real payment or shipment/i.test(form.textContent)
  );

  const orderCount = () => JSON.parse(w.localStorage.getItem('stallfree:orders') || '[]').length;
  submit(d, 'checkout-form');
  check('empty checkout creates no order', orderCount() === 0);
  check(
    'empty required fields are flagged',
    !d.getElementById('co-name-error').classList.contains('hidden') &&
      !d.getElementById('co-phone-error').classList.contains('hidden') &&
      !d.getElementById('co-address-error').classList.contains('hidden')
  );
  check(
    'checkout summarises the validation problem',
    d.getElementById('checkout-error').textContent.indexOf('complete the highlighted fields') !== -1
  );

  d.getElementById('co-name').value = 'Demo Reader';
  d.getElementById('co-address').value = '1 Demo Street';
  d.getElementById('co-phone').value = '12345';
  submit(d, 'checkout-form');
  check(
    'too-short phone is rejected',
    orderCount() === 0 && !d.getElementById('co-phone-error').classList.contains('hidden')
  );

  d.getElementById('co-phone').value = '09171234567';
  d.querySelectorAll('input[name="payment"]').forEach((input) => {
    input.checked = false;
  });
  submit(d, 'checkout-form');
  check(
    'missing payment method is rejected',
    orderCount() === 0 && !d.getElementById('payment-error').classList.contains('hidden')
  );

  d.querySelector('input[name="payment"][value="Cash on delivery"]').checked = true;
  submit(d, 'checkout-form');
  const placed = await waitFor(() => {
    const list = JSON.parse(w.localStorage.getItem('stallfree:orders') || '[]');
    return list.length === 1 ? list[0] : false;
  });
  check('valid checkout creates exactly one order', Boolean(placed) && orderCount() === 1);
  if (placed) {
    const price = w.findProduct('statement-rose-arrangement').price;
    check(
      'order snapshots item name, price and quantity',
      placed.items[0].productId === 'statement-rose-arrangement' &&
        placed.items[0].name &&
        placed.items[0].price === price &&
        placed.items[0].qty === 1
    );
    check(
      'order snapshots customer details',
      placed.customer.name === 'Demo Reader' &&
        placed.customer.phone === '09171234567' &&
        placed.customer.address === '1 Demo Street'
    );
    check(
      'order totals are recomputed from the snapshot',
      placed.subtotal === price && placed.total === price + placed.shipping
    );
    check(
      'order id is stable and retrievable',
      /^SF-\d{10}$/.test(placed.id) && w.getOrderById(placed.id).id === placed.id
    );
    check('checked-out line leaves the cart', w.getCart().length === 0);
  }

  /* --- fast retry / double submit: one token, one order --- */
  w.addToCart('grand-yellow-rose-bouquet', 1);
  const burstToken = w.newCheckoutToken();
  const burstPayload = { name: 'Burst Buyer', phone: '09171234567', address: '2 Demo Street' };
  const firstSubmit = w.createOrder(burstPayload, { clientToken: burstToken });
  const secondSubmit = w.createOrder(burstPayload, { clientToken: burstToken });
  check(
    'repeated submit with one token creates one order',
    firstSubmit.ok === true &&
      secondSubmit.ok === true &&
      secondSubmit.duplicate === true &&
      secondSubmit.order.id === firstSubmit.order.id,
    secondSubmit.error || ''
  );
  check('double-submit retry does not add a second order', orderCount() === 2);

  w.addToCart('fresh-bloom-bouquet', 1);
  const thirdSubmit = w.createOrder(
    { name: 'Third Buyer', phone: '09171234567', address: '3 Demo Street' },
    { clientToken: 'unique-id-check' }
  );
  check('a later checkout gets its own order', thirdSubmit.ok === true && orderCount() === 3);
  const allIds = JSON.parse(w.localStorage.getItem('stallfree:orders')).map((o) => o.id);
  check('order ids are unique across the store', new Set(allIds).size === allIds.length, allIds.join(','));
  check('order page errors clean', dom.getErrors().length === 0, dom.getErrors().join(' | '));

  /* --- cart survives a reload --- */
  w.addToCart('fresh-bloom-bouquet', 1);
  const reloadSeed = dumpStorage(dom);
  dom.window.close();
  const reloadDom = await openPage('orders.html', '', reloadSeed);
  const reloadText = reloadDom.window.document.getElementById('cart-list').textContent;
  check(
    'cart contents survive a reload',
    reloadDom.window.getCartCount() === 1 &&
      reloadText.indexOf('Fresh Bloom Bouquet') !== -1
  );
  check('reloaded cart errors clean', reloadDom.getErrors().length === 0, reloadDom.getErrors().join(' | '));
  reloadDom.window.close();

  /* --- stale prices: current price at checkout, frozen on the order --- */
  const stalePrice = 777;
  const staleSeed = {
    'stallfree:guest:cart': JSON.stringify([{ productId: 'grand-yellow-rose-bouquet', qty: 1 }]),
    'stallfree:catalog_overrides': JSON.stringify({
      'grand-yellow-rose-bouquet': { price: stalePrice }
    })
  };
  const staleDom = await openPage('orders.html', '', staleSeed);
  const sw = staleDom.window;
  const sd = sw.document;
  check(
    'cart uses the current effective price',
    sd.querySelector('[data-cart-item="grand-yellow-rose-bouquet"]').textContent.indexOf('\u20B1777') !== -1 &&
      sd.getElementById('cart-summary').textContent.indexOf('\u20B1777') !== -1
  );
  sw.toggleCheckout();
  sd.getElementById('co-name').value = 'Stale Price';
  sd.getElementById('co-phone').value = '09171234567';
  sd.getElementById('co-address').value = '4 Demo Street';
  submit(sd, 'checkout-form');
  const staleOrder = await waitFor(() => {
    const list = JSON.parse(sw.localStorage.getItem('stallfree:orders') || '[]');
    return list.length ? list[0] : false;
  });
  check(
    'checkout charges the current effective price',
    Boolean(staleOrder) &&
      staleOrder.items[0].price === stalePrice &&
      staleOrder.subtotal === stalePrice &&
      staleOrder.shipping === 75 &&
      staleOrder.total === stalePrice + 75,
    staleOrder ? JSON.stringify({ p: staleOrder.items[0].price, s: staleOrder.subtotal, t: staleOrder.total }) : 'no order'
  );
  const staleStore = dumpStorage(staleDom);
  staleDom.window.close();
  staleStore['stallfree:catalog_overrides'] = JSON.stringify({
    'grand-yellow-rose-bouquet': { price: 555 }
  });
  const snapshotDom = await openPage(
    'orders.html',
    '?id=' + encodeURIComponent(staleOrder.id),
    staleStore
  );
  const snapshotText = snapshotDom.window.document.getElementById('order-mount').textContent;
  check(
    'placed order keeps its price snapshot after the price changes',
    snapshotText.indexOf('\u20B1777') !== -1 && snapshotText.indexOf('\u20B1555') === -1
  );
  check(
    'order receipt labels itself a demo order',
    /demo order/i.test(snapshotText) && /no real payment/i.test(snapshotText)
  );
  check(
    'stale-price order errors clean',
    snapshotDom.getErrors().length === 0,
    snapshotDom.getErrors().join(' | ')
  );
  snapshotDom.window.close();

  /* --- stale quantity: checkout re-checks stock and never goes negative --- */
  const recheckSeed = {
    'stallfree:guest:cart': JSON.stringify([{ productId: 'grand-yellow-rose-bouquet', qty: 5 }]),
    'stallfree:catalog_overrides': JSON.stringify({
      'grand-yellow-rose-bouquet': { stock: 2 }
    })
  };
  const reDom = await openPage('orders.html', '', recheckSeed);
  const rw = reDom.window;
  const rd = rw.document;
  const staleLine = rd.querySelector('[data-cart-item="grand-yellow-rose-bouquet"]');
  check(
    'stale quantity is shown as unavailable with a reason',
    Boolean(staleLine) &&
      staleLine.classList.contains('is-unavailable') &&
      /only 2 left/i.test(staleLine.textContent)
  );
  check(
    'checkout is locked for a stale quantity',
    Boolean(rd.getElementById('checkout-btn') && rd.getElementById('checkout-btn').disabled)
  );
  const reBlocked = rw.createOrder(
    { name: 'Recheck Buyer', phone: '09171234567', address: '5 Demo Street' },
    { clientToken: 'stock-recheck-blocked' }
  );
  check(
    'checkout re-checks current stock',
    reBlocked.ok === false && /only 2 left/i.test(reBlocked.error),
    reBlocked.error
  );
  check(
    'blocked checkout writes no order and no stock',
    JSON.parse(rw.localStorage.getItem('stallfree:orders') || '[]').length === 0 &&
      rw.productStock('grand-yellow-rose-bouquet') === 2
  );
  const adjusted = rw.setCartQty('grand-yellow-rose-bouquet', 2);
  const reOk = rw.createOrder(
    { name: 'Recheck Buyer', phone: '09171234567', address: '5 Demo Street' },
    { clientToken: 'stock-recheck-ok' }
  );
  check(
    'adjusted quantity checks out at the current stock',
    adjusted === true && reOk.ok === true && reOk.order.items[0].qty === 2
  );
  check(
    'stock is consumed once and stops at zero',
    rw.productStock('grand-yellow-rose-bouquet') === 0 &&
      rw.addToCart('grand-yellow-rose-bouquet', 1) === false
  );
  check(
    'zero-stock checkout is refused',
    rw.createOrder(
      { name: 'Recheck Buyer', phone: '09171234567', address: '5 Demo Street' },
      { clientToken: 'stock-recheck-empty' }
    ).ok === false
  );
  check('stock re-check errors clean', reDom.getErrors().length === 0, reDom.getErrors().join(' | '));
  reDom.window.close();

  /* --- wishlist: dedupe, persistence, badge and removal feedback --- */
  const wishSeed = {
    'stallfree:guest:wishlist': JSON.stringify([
      'grand-yellow-rose-bouquet',
      'grand-yellow-rose-bouquet',
      'not-a-product',
      null
    ])
  };
  const wishDom = await openPage('wishlist.html', '', wishSeed);
  const ww = wishDom.window;
  const wd = ww.document;
  check(
    'malformed wishlist entries are ignored and deduplicated',
    ww.getWishlist().length === 1 &&
      wd.querySelectorAll('.wish-item').length === 1 &&
      ww.getWishlist()[0] === 'grand-yellow-rose-bouquet'
  );
  check(
    'wishlist toggle saves newest first',
    ww.toggleWishlist('statement-rose-arrangement') === true &&
      JSON.stringify(ww.getWishlist()) ===
        JSON.stringify(['statement-rose-arrangement', 'grand-yellow-rose-bouquet'])
  );
  ww.renderWishlist();
  const wishBadge = wd.getElementById('wishlist-badge');
  check(
    'wishlist badge reflects the saved count',
    Boolean(wishBadge) && wishBadge.textContent === '2' && !wishBadge.classList.contains('hidden')
  );
  check('wishlist renders both saved products', wd.querySelectorAll('.wish-item').length === 2);
  const removeWish = wd.querySelector('[data-action="unsave"][data-id="grand-yellow-rose-bouquet"]');
  if (removeWish) removeWish.dispatchEvent(new ww.MouseEvent('click', { bubbles: true }));
  check(
    'wishlist removal updates the page immediately',
    Boolean(removeWish) &&
      ww.isWished('grand-yellow-rose-bouquet') === false &&
      wd.querySelectorAll('.wish-item').length === 1 &&
      wishBadge.textContent === '1'
  );
  const wishReloadSeed = dumpStorage(wishDom);
  wishDom.window.close();
  const wishReloadDom = await openPage('wishlist.html', '', wishReloadSeed);
  check(
    'wishlist state and removal survive a reload',
    wishReloadDom.window.getWishlist().length === 1 &&
      wishReloadDom.window.getWishlist()[0] === 'statement-rose-arrangement'
  );
  check(
    'wishlist page errors clean',
    wishReloadDom.getErrors().length === 0,
    wishReloadDom.getErrors().join(' | ')
  );
  wishReloadDom.window.close();

  /* --- changing accounts keeps carts isolated --- */
  const acctDom = await openPage('orders.html');
  const aw = acctDom.window;
  aw.clearCart();
  aw.addToCart('grand-yellow-rose-bouquet', 2);
  const regA = await aw.registerAccount({
    name: 'Cart A',
    email: 'cart.a@example.com',
    password: 'password1',
    confirm: 'password1'
  });
  check(
    'first account adopts the guest cart',
    regA.ok === true &&
      aw.getCart().length === 1 &&
      aw.getCart()[0].qty === 2 &&
      Boolean(aw.localStorage.getItem('stallfree:' + regA.account.id + ':cart'))
  );
  aw.clearCart();
  aw.addToCart('statement-rose-arrangement', 1);
  aw.logoutAccount();
  check('signed-out cart scope does not show the account cart', aw.getCart().length === 0);
  aw.addToCart('fresh-bloom-bouquet', 1);
  const regB = await aw.registerAccount({
    name: 'Cart B',
    email: 'cart.b@example.com',
    password: 'password1',
    confirm: 'password1'
  });
  check(
    'second account adopts only the guest cart',
    regB.ok === true &&
      aw.getCart().length === 1 &&
      aw.getCart()[0].productId === 'fresh-bloom-bouquet'
  );
  aw.logoutAccount();
  const loginA = await aw.loginAccount({ email: 'cart.a@example.com', password: 'password1' });
  check(
    'signing back in restores the first cart',
    loginA.ok === true &&
      aw.getCart().length === 1 &&
      aw.getCart()[0].productId === 'statement-rose-arrangement'
  );
  check(
    'each account keeps its own cart key',
    JSON.parse(aw.localStorage.getItem('stallfree:' + regA.account.id + ':cart'))[0].productId ===
      'statement-rose-arrangement' &&
      JSON.parse(aw.localStorage.getItem('stallfree:' + regB.account.id + ':cart'))[0].productId ===
        'fresh-bloom-bouquet' &&
      aw.localStorage.getItem('stallfree:guest:cart') === null
  );
  check('account switching errors clean', acctDom.getErrors().length === 0, acctDom.getErrors().join(' | '));
  acctDom.window.close();

  /* --- storage write failures do not corrupt or crash --- */
  const failDom = await openPage('orders.html');
  const fw = failDom.window;
  fw.clearCart();
  fw.addToCart('grand-yellow-rose-bouquet', 1);
  const beforeRaw = fw.localStorage.getItem('stallfree:guest:cart');
  const storageProto = Object.getPrototypeOf(fw.localStorage);
  const originalSetItem = storageProto.setItem;
  let quotaThrew = null;
  try {
    storageProto.setItem = function () {
      throw new Error('QuotaExceededError');
    };
    fw.addToCart('statement-rose-arrangement', 1);
  } catch (e) {
    quotaThrew = e;
  } finally {
    storageProto.setItem = originalSetItem;
  }
  check('cart write failure does not throw', quotaThrew === null, quotaThrew && quotaThrew.message);
  check(
    'cart write failure leaves the saved cart intact',
    fw.localStorage.getItem('stallfree:guest:cart') === beforeRaw &&
      fw.getCart().length === 1 &&
      fw.getCart()[0].qty === 1
  );

  let wishThrew = null;
  try {
    storageProto.setItem = function () {
      throw new Error('QuotaExceededError');
    };
    fw.toggleWishlist('statement-rose-arrangement');
  } catch (e) {
    wishThrew = e;
  } finally {
    storageProto.setItem = originalSetItem;
  }
  check('wishlist write failure does not throw', wishThrew === null, wishThrew && wishThrew.message);
  check('failed wishlist write is not persisted', fw.isWished('statement-rose-arrangement') === false);

  let orderThrew = null;
  let failedOrder = null;
  try {
    storageProto.setItem = function () {
      throw new Error('QuotaExceededError');
    };
    failedOrder = fw.createOrder(
      { name: 'Quota Buyer', phone: '09171234567', address: '6 Demo Street' },
      { clientToken: 'quota-failure' }
    );
  } catch (e) {
    orderThrew = e;
  } finally {
    storageProto.setItem = originalSetItem;
  }
  check('checkout write failure does not throw', orderThrew === null, orderThrew && orderThrew.message);
  check(
    'checkout write failure reports an error',
    Boolean(failedOrder) && failedOrder.ok === false && /could not save/i.test(failedOrder.error)
  );
  check(
    'checkout write failure creates no order and keeps the cart',
    JSON.parse(fw.localStorage.getItem('stallfree:orders') || '[]').length === 0 &&
      fw.getCart().length === 1
  );
  check(
    'cart writes recover after storage recovers',
    fw.addToCart('statement-rose-arrangement', 1) === true && fw.getCart().length === 2
  );
  check('storage-failure page errors clean', failDom.getErrors().length === 0, failDom.getErrors().join(' | '));
  failDom.window.close();
}

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  BASE = 'http://127.0.0.1:' + server.address().port;
  try {
    await testChrome();
    await testStorefront();
    await testAuthForms();
    await testCheckout();
    await testAdmin();
    await testStock();
    await testProfilePersistence();
    await testTrackingEndToEnd();
    await testRefreshIdempotence();
    await testSearchFiltersAndMenu();
    await testNavigation();
    await testFollowedShopsFirst();
    await testCheckoutSelectionAndSavedPhone();
    await testRegressionMatrix();
    await testImplementationPolish();
    await testAuthHardening();
    await testStorefrontDiscovery();
    await testPurchaseSimulation();
    await testOrderHistoryAndAccountFeatures();
  } catch (e) {
    console.error('\nTEST RUN ABORTED:', e && e.stack ? e.stack : e);
  }
  process.exit(failed ? 1 : 0);
})();

/* ---------------- 19. Orders, reviews, profile, help ---------------- */

async function testOrderHistoryAndAccountFeatures() {
  console.log('\n[19] order history, reviews, profile and help');

  /* ---------- Order history separation, snapshots and status ---------- */

  const orderDom = await openPage('orders.html');
  const ow = orderDom.window;
  const od = ow.document;

  const regA = await ow.registerAccount({
    name: 'Amelia Cruz',
    email: 'amelia@example.com',
    password: 'password1',
    confirm: 'password1'
  });
  check('history: account A registers', regA.ok === true);

  ow.addToCart('sweetheart-hand-bouquet', 1);
  ow.toggleCheckout();
  od.getElementById('co-name').value = 'Amelia Cruz';
  od.getElementById('co-phone').value = '09171112222';
  od.getElementById('co-address').value = '22 Amor St, QC';
  submit(od, 'checkout-form');

  const orderA = await waitFor(() => {
    const list = JSON.parse(ow.localStorage.getItem('stallfree:orders') || '[]');
    return list.find((o) => o.userId === regA.account.id) || null;
  });
  check('history: account A places an order', Boolean(orderA) && Boolean(orderA.id));
  check(
    'history: order keeps an immutable item snapshot',
    orderA.items.length === 1 &&
      orderA.items[0].name === 'Sweetheart Hand Bouquet' &&
      orderA.items[0].price === 650 &&
      orderA.total === 725
  );
  const orderAId = orderA.id;
  const seedA = dumpStorage(orderDom);
  orderDom.window.close();

  /* Account A's own history */
  const histA0 = await openPage('orders.html', '', seedA);
  const histA0Text = histA0.window.document.getElementById('order-history').textContent;
  check('history: account A sees their own order', histA0Text.indexOf(orderAId) !== -1);
  check(
    'history: saved date, total and status are shown',
    histA0Text.indexOf(orderA.date) !== -1 &&
      histA0Text.indexOf(histA0.window.formatPrice(orderA.total)) !== -1 &&
      histA0Text.indexOf(histA0.window.statusMeta(orderA.status).label) !== -1
  );
  check(
    'history: empty state hidden when an order exists',
    histA0.window.document.getElementById('history-empty').classList.contains('hidden')
  );
  check('history: account A history errors clean', histA0.getErrors().length === 0, histA0.getErrors().join(' | '));
  histA0.window.close();

  /* Account B places a different order in the same browser store */
  const orderDomB = await openPage('orders.html', '', seedA);
  const owB = orderDomB.window;
  const odB = owB.document;
  owB.logoutAccount();
  const regB = await owB.registerAccount({
    name: 'Benny Ong',
    email: 'benny@example.com',
    password: 'password2',
    confirm: 'password2'
  });
  check('history: account B registers', regB.ok === true);
  owB.addToCart('mini-rose-bunch', 1);
  owB.toggleCheckout();
  odB.getElementById('co-name').value = 'Benny Ong';
  odB.getElementById('co-phone').value = '09173334444';
  odB.getElementById('co-address').value = '8 Mabini St, Makati';
  submit(odB, 'checkout-form');
  const orderB = await waitFor(() => {
    const list = JSON.parse(owB.localStorage.getItem('stallfree:orders') || '[]');
    return list.find((o) => o.userId === regB.account.id) || null;
  });
  check('history: account B places their own order', Boolean(orderB) && Boolean(orderB.id));
  const seedB = dumpStorage(orderDomB);
  orderDomB.window.close();

  const histB = await openPage('orders.html', '', seedB);
  const hdb = histB.window.document;
  const histBText = hdb.getElementById('order-history').textContent;
  check('history: account B sees only their own order', histBText.indexOf(orderB.id) !== -1);
  check(
    "history: account B never sees account A's order",
    histBText.indexOf(orderAId) === -1 && histBText.indexOf('Sweetheart Hand Bouquet') === -1
  );
  check('history: account B errors clean', histB.getErrors().length === 0, histB.getErrors().join(' | '));
  histB.window.close();

  /* Guessable URL for another account's order is refused */
  const guessDom = await openPage('orders.html', '?id=' + encodeURIComponent(orderAId), seedB);
  const guessText = guessDom.window.document.getElementById('order-mount').textContent;
  check('history: guessed other account order is blocked', /belongs to another account/i.test(guessText));
  check(
    'history: blocked order leaks no item details',
    guessText.indexOf('Sweetheart Hand Bouquet') === -1 && guessText.indexOf(orderA.date) === -1
  );
  check('history: blocked order errors clean', guessDom.getErrors().length === 0, guessDom.getErrors().join(' | '));
  guessDom.window.close();

  /* Guest scope sees neither customer's orders */
  const guestSeed = Object.assign({}, seedB);
  delete guestSeed.stallfree_session;
  const guestHist = await openPage('orders.html', '', guestSeed);
  const ghd = guestHist.window.document;
  check(
    'history: guest sees no account orders',
    ghd.getElementById('order-history').textContent.trim() === '' &&
      ghd.getElementById('order-history').textContent.indexOf(orderAId) === -1 &&
      ghd.getElementById('order-history').textContent.indexOf(orderB.id) === -1
  );
  check('history: guest empty state shown', !ghd.getElementById('history-empty').classList.contains('hidden'));
  check('history: guest history errors clean', guestHist.getErrors().length === 0, guestHist.getErrors().join(' | '));
  guestHist.window.close();

  /* Admin status changes are reflected for the customer after reload */
  const ownerSeed = Object.assign({}, seedA);
  delete ownerSeed.stallfree_session;
  const adminDom = await openPage('admin.html', '', ownerSeed);
  const aw = adminDom.window;
  const ad = adminDom.window.document;
  ad.getElementById('as-key').value = ADMIN_SETUP_PASSPHRASE;
  ad.getElementById('as-name').value = 'History Owner';
  ad.getElementById('as-email').value = 'historyowner@example.com';
  ad.getElementById('as-password').value = 'adminpass1';
  ad.getElementById('as-confirm').value = 'adminpass1';
  submit(ad, 'admin-setup-form');
  await waitFor(() => aw.isAdmin(), 15000);
  check('history: admin setup for status propagation', aw.isAdmin() === true);

  aw.adminUpdateOrder(orderAId, { status: 'confirmed' });
  aw.adminUpdateOrder(orderAId, { status: 'preparing' });
  const shipped = aw.adminUpdateOrder(orderAId, {
    status: 'shipped',
    tracking: { number: 'HIST-123', courier: 'NinjaVan' }
  });
  check('history: admin moves order to shipped', shipped.ok === true && shipped.order.status === 'shipped');
  const adminSeed = dumpStorage(adminDom);
  check('history: admin update errors clean', adminDom.getErrors().length === 0, adminDom.getErrors().join(' | '));
  adminDom.window.close();

  adminSeed.stallfree_session = seedA.stallfree_session;
  const histUpdated = await openPage('orders.html', '', adminSeed);
  const hu = histUpdated.window;
  const hud = histUpdated.window.document;
  const updatedText = hud.getElementById('order-history').textContent;
  check(
    'history: admin status appears on customer history after reload',
    updatedText.indexOf(hu.statusMeta('shipped').label) !== -1
  );
  const detailDom = await openPage('orders.html', '?id=' + encodeURIComponent(orderAId), adminSeed);
  const detailText = detailDom.window.document.getElementById('order-mount').textContent;
  check('history: admin status appears on order detail', /Shipped \/ In transit/i.test(detailText));
  check('history: admin tracking details appear on order detail', detailText.indexOf('HIST-123') !== -1);
  check('history: order detail is labelled as a demo', /demo order|no real payment/i.test(detailText));
  check('history: order detail errors clean', detailDom.getErrors().length === 0, detailDom.getErrors().join(' | '));
  detailDom.window.close();
  histUpdated.window.close();

  /* A later catalogue price edit must not rewrite a placed order */
  const snapSeed = Object.assign({}, adminSeed);
  snapSeed['stallfree:catalog_overrides'] = JSON.stringify({ 'sweetheart-hand-bouquet': { price: 9999 } });
  const snapDom = await openPage('orders.html', '?id=' + encodeURIComponent(orderAId), snapSeed);
  const snapDoc = snapDom.window.document;
  const lineTotal = snapDoc.querySelector('.order-line-total');
  const sumTotal = snapDoc.querySelector('.summary-total');
  check(
    'history: order line keeps the original price snapshot',
    Boolean(lineTotal) && lineTotal.textContent.indexOf(snapDom.window.formatPrice(650)) !== -1
  );
  check(
    'history: order total keeps the original amount snapshot',
    Boolean(sumTotal) && sumTotal.textContent.indexOf(snapDom.window.formatPrice(orderA.total)) !== -1
  );
  check(
    'history: later catalogue price change cannot rewrite the order',
    Boolean(lineTotal) && Boolean(sumTotal) && lineTotal.textContent.indexOf('9,999') === -1 && sumTotal.textContent.indexOf('9,999') === -1
  );
  check('history: snapshot errors clean', snapDom.getErrors().length === 0, snapDom.getErrors().join(' | '));
  snapDom.window.close();

  /* ---------- Reviews: write, validate, edit, isolation, safe text ---------- */

  const revBase = await openPage('products.html', '?id=sweetheart-hand-bouquet');
  const rvw = revBase.window;
  const rita = await rvw.registerAccount({
    name: 'Rita Cruz',
    email: 'rita@example.com',
    password: 'password1',
    confirm: 'password1'
  });
  check('reviews: reviewer account registers', rita.ok === true);
  const revSeed = dumpStorage(revBase);
  revBase.window.close();

  const revDom = await openPage('products.html', '?id=sweetheart-hand-bouquet', revSeed);
  const rv = revDom.window;
  const rd = revDom.window.document;
  const beforeCount = rd.querySelectorAll('#review-list .review-card').length;

  submit(rd, 'review-form');
  check('reviews: blank form adds no card', rd.querySelectorAll('#review-list .review-card').length === beforeCount);
  check('reviews: missing rating shows an error', !rd.getElementById('review-rating-error').classList.contains('hidden'));

  const star = rd.querySelector('input[name="review-rating"][value="4"]');
  if (star) star.checked = true;
  rd.getElementById('review-text').value = 'short';
  submit(rd, 'review-form');
  check('reviews: short text is rejected', !rd.getElementById('review-text-error').classList.contains('hidden'));

  const originalText = 'The eucalyptus smell was beautiful and lasted for days.';
  rd.getElementById('review-title').value = 'Lovely gift';
  rd.getElementById('review-text').value = originalText;
  submit(rd, 'review-form');
  const afterCount = await waitFor(() => {
    const count = rd.querySelectorAll('#review-list .review-card').length;
    return count > beforeCount ? count : null;
  });
  check('reviews: valid review is added and displayed', afterCount > beforeCount);
  check('reviews: review text is shown', rd.getElementById('review-list').textContent.indexOf('eucalyptus') !== -1);
  check('reviews: author name is shown', /Rita/.test(rd.getElementById('review-list').textContent));
  check('reviews: own review is marked', Boolean(rd.querySelector('#review-list .chip-accent')));
  check('reviews: own review has an edit action', Boolean(rd.querySelector('#review-list [data-action="review-edit"]')));

  const storedBefore = JSON.parse(rv.localStorage.getItem('stallfree:' + rv.getSessionAccount().id + ':reviews') || '[]');
  check('reviews: only one stored review exists after posting', storedBefore.length === 1);

  const editBtn = rd.querySelector('#review-list [data-action="review-edit"]');
  editBtn.dispatchEvent(new rv.Event('click', { bubbles: true }));
  check(
    'reviews: edit mode changes the form heading',
    rd.getElementById('review-form-title').textContent === 'Edit your review'
  );
  check(
    'reviews: edit mode prefills rating and text',
    rd.querySelector('input[name="review-rating"][value="4"]').checked === true &&
      rd.getElementById('review-text').value === originalText
  );
  check('reviews: edit mode shows a cancel action', !rd.getElementById('review-cancel').classList.contains('hidden'));

  const editedText = 'Updated after a week — still crisp and beautifully packed.';
  const lowStar = rd.querySelector('input[name="review-rating"][value="2"]');
  if (lowStar) lowStar.checked = true;
  rd.getElementById('review-text').value = editedText;
  submit(rd, 'review-form');
  await waitFor(() => rd.getElementById('review-list').textContent.indexOf('Updated after a week') !== -1);
  const listText = rd.getElementById('review-list').textContent;
  check('reviews: edit updates the existing card', listText.indexOf(editedText) !== -1);
  check('reviews: edit removes the old text without duplicating', listText.indexOf('eucalyptus smell was beautiful') === -1);
  check('reviews: edited review is marked as edited', /edited/i.test(listText));
  const storedAfter = JSON.parse(rv.localStorage.getItem('stallfree:' + rv.getSessionAccount().id + ':reviews') || '[]');
  check(
    'reviews: edit keeps one record and the new rating',
    storedAfter.length === 1 && storedAfter[0].rating === 2 && storedAfter[0].edited === true
  );

  const editAgain = rd.querySelector('#review-list [data-action="review-edit"]');
  editAgain.dispatchEvent(new rv.Event('click', { bubbles: true }));
  rd.getElementById('review-cancel').dispatchEvent(new rv.Event('click', { bubbles: true }));
  check(
    'reviews: cancel edit restores the write form',
    rd.getElementById('review-form-title').textContent === 'Write a review' &&
      rd.getElementById('review-cancel').classList.contains('hidden') &&
      rd.getElementById('review-text').value === ''
  );

  /* Another account cannot see or edit the first account's review */
  rv.logoutAccount();
  await rv.registerAccount({
    name: 'Other Reviewer',
    email: 'otherrev@example.com',
    password: 'password3',
    confirm: 'password3'
  });
  const otherSeed = dumpStorage(revDom);
  revDom.window.close();
  const otherDom = await openPage('products.html', '?id=sweetheart-hand-bouquet', otherSeed);
  const otherDoc = otherDom.window.document;
  const otherText = otherDoc.getElementById('review-list').textContent;
  check("reviews: account switch hides the other account's review", otherText.indexOf('Updated after a week') === -1);
  check(
    'reviews: no edit action is exposed for other/seed reviews',
    otherDoc.querySelectorAll('#review-list [data-action="review-edit"]').length === 0
  );

  /* Stored review text is rendered escaped, never as markup or script */
  const safe = otherDom.window.addReview({
    productId: 'sweetheart-hand-bouquet',
    author: '<b>Bad Actor</b>',
    rating: 5,
    title: '<script>window.__sf_xss=1</script>',
    text: '<img src=x onerror="window.__sf_xss=1"> safe review text here'
  });
  check('reviews: review with markup is stored as text', Boolean(safe) && Boolean(safe.id));
  otherDom.window.renderReviewList(otherDom.window.findProduct('sweetheart-hand-bouquet'));
  const safeCard = otherDoc.querySelector('#review-list .review-actions');
  const safeTextRendered = Array.from(otherDoc.querySelectorAll('#review-list .review-text')).some(
    (el) => el.textContent.indexOf('<img') !== -1
  );
  check('reviews: escaped text renders literally', safeTextRendered);
  check('reviews: injected markup is not executed', otherDom.window.__sf_xss !== 1);
  check(
    'reviews: no script or image element from review text',
    otherDoc.querySelectorAll('#review-list .review-text script, #review-list .review-text img').length === 0
  );
  check('reviews: own review edit action present', Boolean(safeCard));

  /* Storage rules for editing */
  check(
    'reviews: edit rejects an invalid rating',
    otherDom.window.updateReview(safe.id, { rating: 9, text: 'Still a valid length for editing' }).ok === false
  );
  check(
    'reviews: edit rejects text that is too short',
    otherDom.window.updateReview(safe.id, { rating: 5, text: 'short' }).ok === false
  );
  check(
    'reviews: edit rejects an unknown review id',
    otherDom.window.updateReview('does-not-exist', { rating: 5, text: 'Still a valid length for editing' }).ok === false
  );

  const storageProto = Object.getPrototypeOf(otherDom.window.localStorage);
  const originalSetItem = storageProto.setItem;
  let editThrew = null;
  let failedEdit = null;
  try {
    storageProto.setItem = function () {
      throw new Error('QuotaExceededError');
    };
    failedEdit = otherDom.window.updateReview(safe.id, {
      rating: 5,
      text: 'Attempted update that should fail in storage'
    });
  } catch (e) {
    editThrew = e;
  } finally {
    storageProto.setItem = originalSetItem;
  }
  check('reviews: edit write failure does not throw', editThrew === null, editThrew && editThrew.message);
  check(
    'reviews: edit write failure reports a useful error',
    Boolean(failedEdit) && failedEdit.ok === false && /could not save|freeing space/i.test(failedEdit.error)
  );
  check('reviews: page errors clean after editing flows', otherDom.getErrors().length === 0, otherDom.getErrors().join(' | '));
  otherDom.window.close();

  /* Malformed stored reviews are ignored/normalised instead of crashing */
  const malSeed = {
    'stallfree:guest:reviews': JSON.stringify([
      { productId: 'sweetheart-hand-bouquet' },
      { productId: 'not-a-product', rating: 5, text: 'This product does not exist anymore' },
      { productId: 'sweetheart-hand-bouquet', rating: 'bad', text: 'Rating is not a number at all' },
      { productId: 'sweetheart-hand-bouquet', rating: 5, author: '<script>alert(1)</script>', text: '<b>bold</b> and safe text review now' }
    ])
  };
  const malDom = await openPage('products.html', '?id=sweetheart-hand-bouquet', malSeed);
  const malList = malDom.window.document.getElementById('review-list');
  check('reviews: malformed stored reviews do not crash the page', malDom.getErrors().length === 0, malDom.getErrors().join(' | '));
  check(
    'reviews: only the valid stored review is treated as mine',
    Boolean(malList) &&
      malList.querySelectorAll('.chip-accent').length === 1 &&
      malList.textContent.indexOf('Rating is not a number') === -1 &&
      malList.textContent.indexOf('does not exist anymore') === -1
  );
  check('reviews: malformed review markup is escaped', Boolean(malList) && malList.querySelectorAll('script').length === 0);
  malDom.window.close();

  /* ---------- Profile: edit, allowed fields, password, isolation ---------- */

  const duoDom = await openPage('profile.html');
  const duow = duoDom.window;
  const cara = await duow.registerAccount({
    name: 'Cara Lin',
    email: 'cara@example.com',
    password: 'password1',
    confirm: 'password1'
  });
  check('profile: account A registers', cara.ok === true);
  duow.logoutAccount();
  await duow.registerAccount({
    name: 'Benny Ong',
    email: 'benny@example.com',
    password: 'password2',
    confirm: 'password2'
  });
  duow.logoutAccount();
  const duoSeed = dumpStorage(duoDom);
  duoDom.window.close();

  const loginDom = await openPage('profile.html', '', duoSeed);
  const loginCara = await loginDom.window.loginAccount({ email: 'cara@example.com', password: 'password1' });
  check('profile: account A can sign in', loginCara.ok === true);
  const profSeed = dumpStorage(loginDom);
  loginDom.window.close();

  const profDom = await openPage('profile.html', '', profSeed);
  const pw = profDom.window;
  const pd = profDom.window.document;
  check('profile: signed-in name is preloaded', pd.getElementById('p-first').value === 'Cara');

  pd.getElementById('p-first').value = 'Cara';
  pd.getElementById('p-last').value = 'Lin';
  pd.getElementById('p-email').value = 'CARA@Example.COM';
  pd.getElementById('p-phone').value = '09173334444';
  pd.getElementById('p-address').value = '44 Pasig Blvd, Pasig';
  submit(pd, 'profile-form');
  check(
    'profile: update shows a success banner',
    await waitFor(() => !pd.getElementById('profile-banner').classList.contains('hidden'))
  );
  const meCara = pw.getSessionAccount();
  const storedCara = JSON.parse(pw.localStorage.getItem('stallfree_accounts') || '[]').find(
    (a) => a.id === meCara.id
  );
  const savedProf = JSON.parse(pw.localStorage.getItem('stallfree:' + meCara.id + ':profile'));
  check(
    'profile: details persist for the account',
    Boolean(savedProf) && savedProf.phone === '09173334444' && savedProf.address === '44 Pasig Blvd, Pasig'
  );
  check('profile: role is preserved as customer', meCara.role === 'customer');
  check(
    'profile: email is normalised for uniqueness',
    Boolean(storedCara) && storedCara.emailLower === 'cara@example.com'
  );

  pd.getElementById('p-email').value = 'benny@example.com';
  submit(pd, 'profile-form');
  check(
    'profile: duplicate email is rejected with a field error',
    !pd.getElementById('p-email-error').classList.contains('hidden') &&
      /already/i.test(pd.getElementById('p-email-error').textContent)
  );
  const afterRejected = JSON.parse(pw.localStorage.getItem('stallfree_accounts') || '[]').find(
    (a) => a.id === meCara.id
  );
  check(
    'profile: rejected email is not applied',
    Boolean(afterRejected) && afterRejected.emailLower === 'cara@example.com'
  );

  pd.getElementById('p-email').value = 'cara@example.com';
  pd.getElementById('p-first').value = '   ';
  submit(pd, 'profile-form');
  check('profile: empty first name is rejected', /first name/i.test(pd.getElementById('profile-error').textContent));
  pd.getElementById('p-first').value = 'Cara';

  const pf = pd.getElementById('password-form');
  pf.classList.remove('hidden');

  pd.getElementById('pw-current').value = 'wrongpass1';
  pd.getElementById('pw-next').value = 'newpass123';
  pd.getElementById('pw-confirm').value = 'newpass123';
  submit(pd, 'password-form');
  await waitFor(() => !pd.getElementById('password-error').classList.contains('hidden'));
  check('profile: wrong current password is rejected', /incorrect/i.test(pd.getElementById('password-error').textContent));

  pd.getElementById('pw-current').value = 'password1';
  pd.getElementById('pw-next').value = 'newpass123';
  pd.getElementById('pw-confirm').value = 'different1';
  submit(pd, 'password-form');
  await waitFor(() => /match/i.test(pd.getElementById('password-error').textContent));
  check('profile: mismatched new passwords are rejected', /match/i.test(pd.getElementById('password-error').textContent));

  pd.getElementById('pw-next').value = 'pass';
  pd.getElementById('pw-confirm').value = 'pass';
  submit(pd, 'password-form');
  await waitFor(() => /character/i.test(pd.getElementById('password-error').textContent));
  check('profile: weak new password is rejected', /character/i.test(pd.getElementById('password-error').textContent));

  pd.getElementById('pw-current').value = 'password1';
  pd.getElementById('pw-next').value = 'newpass123';
  pd.getElementById('pw-confirm').value = 'newpass123';
  submit(pd, 'password-form');
  check(
    'profile: password change succeeds',
    await waitFor(() => !pd.getElementById('password-banner').classList.contains('hidden'))
  );
  check('profile: success message is specific', /changed/i.test(pd.getElementById('password-banner').textContent));

  pw.logoutAccount();
  const oldLogin = await pw.loginAccount({ email: 'cara@example.com', password: 'password1' });
  check('profile: old password no longer works', oldLogin.ok === false);
  const newLogin = await pw.loginAccount({ email: 'cara@example.com', password: 'newpass123' });
  check(
    'profile: new password works and keeps the customer role',
    newLogin.ok === true && newLogin.account.role === 'customer'
  );

  pw.logoutAccount();
  await pw.registerAccount({
    name: 'Dale Park',
    email: 'dale@example.com',
    password: 'password5',
    confirm: 'password5'
  });
  const switchSeed = dumpStorage(profDom);
  profDom.window.close();
  const switched = await openPage('profile.html', '', switchSeed);
  const sd = switched.window.document;
  check(
    "profile: account switch hides the other account's details",
    sd.getElementById('p-phone').value !== '09173334444' &&
      sd.getElementById('p-address').value !== '44 Pasig Blvd, Pasig'
  );
  check(
    "profile: other account's order history is not shown",
    sd.getElementById('order-history').textContent.indexOf(orderAId) === -1
  );
  check('profile: account switch errors clean', switched.getErrors().length === 0, switched.getErrors().join(' | '));
  switched.window.close();

  /* Guest profile rules */
  const guestProf = await openPage('profile.html');
  const gp = guestProf.window;
  const gpd = gp.document;
  check('profile: guest email is read-only with a hint', gpd.getElementById('p-email').readOnly === true);
  check('profile: password form is hidden for guests', gpd.getElementById('password-form').classList.contains('hidden'));
  submit(gpd, 'profile-form');
  check('profile: guest first name is required', /first name/i.test(gpd.getElementById('profile-error').textContent));
  gpd.getElementById('p-first').value = 'Guest Grace';
  submit(gpd, 'profile-form');
  const guestSaved = await waitFor(() => {
    const raw = gp.localStorage.getItem('stallfree:guest:profile');
    return raw ? JSON.parse(raw) : null;
  });
  check('profile: guest profile saves without an account', Boolean(guestSaved) && guestSaved.firstName === 'Guest Grace');
  check('profile: guest page errors clean', guestProf.getErrors().length === 0, guestProf.getErrors().join(' | '));
  guestProf.window.close();

  /* ---------- Help centre content, links and demo wording ---------- */

  const helpDom = await openPage('help.html');
  const hd = helpDom.window.document;
  check(
    'help: demo disclaimer is present',
    /frontend-only demonstration|no real payment or delivery/i.test(hd.getElementById('help-demo-disclaimer').textContent)
  );
  ['#delivery', '#payments', '#returns', '#privacy', '#sell', '#faq'].forEach((section) => {
    check('help: section ' + section + ' exists', Boolean(hd.querySelector(section)));
  });
  check('help: FAQ has items', hd.querySelectorAll('#faq details').length >= 6);
  const helpAnchors = Array.from(hd.querySelectorAll('a[href^="#"]'));
  const unresolvedAnchors = helpAnchors
    .filter((a) => !hd.getElementById(a.getAttribute('href').slice(1)))
    .map((a) => a.getAttribute('href'));
  check(
    'help: every in-page link resolves',
    helpAnchors.length >= 1 && unresolvedAnchors.length === 0,
    'unresolved: ' + unresolvedAnchors.join(', ')
  );
  check(
    'help: links to orders, profile and admin exist',
    Boolean(hd.querySelector('a[href="orders.html"]')) &&
      Boolean(hd.querySelector('a[href="profile.html"]')) &&
      Boolean(hd.querySelector('a[href="admin.html"]'))
  );
  check(
    'help: explains browser-local data and demo payments',
    /localStorage|browser/i.test(hd.body.textContent) && /no real|simulated|demo/i.test(hd.body.textContent)
  );
  check(
    'help: explains order status workflow',
    /placed, confirmed, preparing, shipped and delivered/i.test(hd.body.textContent) &&
      /administrator/i.test(hd.body.textContent)
  );
  check(
    'help: explains reviewing and editing a review',
    /Edit review/i.test(hd.body.textContent) && /Your review/i.test(hd.body.textContent)
  );
  check('help: page errors clean', helpDom.getErrors().length === 0, helpDom.getErrors().join(' | '));
  helpDom.window.close();
}


# StallFree — Implementation Progress Log

This is a **log, not permission to proceed**. Each part requires explicit approval
for the next numbered part only (see `StallFree_OpenCode_Step_by_Step_Plan.md`).

---

## Part 00 — Baseline and protective setup

- **Status:** COMPLETE
- **Date:** 2026-10-23
- **Changed files:** `docs/implementation-progress.md` (new; log only)
- **Code changes:** none
- **Next part:** Part 01 completed — see below

### Protective setup

- Confirmed the working tree already contains substantial uncommitted work:
  - Branch: `main`, HEAD `3b5cfe6 add changes`
  - 15 modified tracked files, 8 untracked files/directories
  - Uncommitted work was **not** overwritten, committed, stashed, or discarded.
- Created a read-only safety snapshot outside the repo (excludes `.git/` and
  `node_modules/`):
  `C:\Users\maryr\AppData\Local\Temp\opencode\StallFree_baseline_2026-10-23.zip`
- **Recommendation:** commit the current implementation on a working branch before
  Part 01 so the approved baseline is recoverable through Git. Not done here because
  Part 00 permits no code/change-management action without approval.

### Environment

| Item | Value |
|---|---|
| OS | Windows (win32) |
| Node.js | v26.5.1 |
| npm | 11.17.0 |
| Test runner | classic script: `tests/smoke.js` (jsdom, real pages over ephemeral HTTP) |
| jsdom | 30.1.3 (installed and pinned; `package-lock.json` lockfileVersion 3) |
| Test command | `cd tests && npm test` (install with `npm ci`) |

### Baseline verification

| Check | Command | Result |
|---|---|---|
| Automated regression suite | `cd tests && npm test` | **PASS — 306 passed, 0 failed** |
| JavaScript syntax | `node --check` on all 6 files in `js/` | **PASS — 6/6** |
| Internal HTML page links | static scan of `href="*.html"` across root pages | **PASS — no missing targets** |
| Admin page markup | inspected `admin.html` | **PASS — no stray literal after `</head>`; scripts load cleanly** |
| Test portability | inspected `tests/smoke.js` | **PASS — portable root via `path.resolve(__dirname, '..')`; ephemeral port** |
| Setup credential in tests | inspected test fixtures without printing values | **PASS — no shipped owner credential; only obviously fake per-run fixture passphrases** |
| Console/runtime errors | covered by suite's per-scenario "errors clean" checks | **PASS** |
| Real-browser manual walkthrough | not performed (no browser automation in this environment) | **NOT TESTED** — jsdom is the only executed UI baseline |

### Project inventory

**Root pages (12):** `index.html` (home), `products.html` (catalogue + product detail),
`categories.html`, `sellers.html` (shops list), `shop.html` (single shop), `wishlist.html`,
`orders.html` (cart, checkout, history, tracking), `profile.html`, `help.html`,
`login.html`, `register.html`, `admin.html`.

**Assets/scripts:** `css/styles.css`; `js/data.js`, `js/auth.js`, `js/storage.js`,
`js/ui.js`, `js/admin.js` (admin page only), `js/main.js`; `tests/smoke.js`,
`tests/package.json`, `tests/package-lock.json`; `README.md`.

**Script load order (every page):**
`data.js → auth.js → storage.js → ui.js → [admin.js on admin.html] → main.js`.
Classic globals, no bundler/modules. Pages identify themselves with
`<body data-page="…">`; `main.js` dispatches on that value.

**Routing/navigation:** shared header/footer built by `js/ui.js` (`NAV_LINKS`, category
rail, account menu, search, cart/wishlist badges). Internal links resolve; no page
targets are missing. `main.js` bootstraps: home, products, categories, sellers, shop,
wishlist, orders, profile, login, register, and admin (via `js/admin.js`).

**Authentication (`js/auth.js`):**
- `adminExists()` — true when any stored account has role `admin`.
- `adminSetup(input)` — one-time bootstrap; refuses if an admin exists; requires a
  locally chosen setup passphrase (≥10 chars, differing from the password); creates
  the account through `registerAccount()` then promotes that account to `admin`.
- `registerAccount(input)` — public signup; always writes `role: 'customer'`
  (forged role input is ignored); normalizes email; PBKDF2-HMAC-SHA256 (310k
  iterations, random salt); starts a session and adopts guest data.
- `loginAccount()` — timing-equalized unknown-email path, 5-attempt/5-minute lockout,
  suspended-account rejection.
- `currentSession()` / `getSessionAccount()` / `isAdmin()` / `requireAdmin()` —
  expiry + missing-account + suspension checks; `requireAdmin()` is the single
  privileged choke point.
- `logoutAccount()` clears only the session; account and scoped data remain.
- Profile/password updates and admin suspend/delete guards live here.
- Session notice key supplies a one-off "expired/suspended" reason.

**Storage (`js/storage.js`):**
- Per-scope stores (`stallfree:<userId|guest>:<name>`): `cart`, `wishlist`,
  `profile`, `reviews`, `recent`, `follows`, `coupon`, `searches`.
- Shared stores: `stallfree:orders` (tagged `userId`), `stallfree:catalog_overrides`,
  `stallfree:custom_products`, `stallfree:shop_overrides`.
- Auth stores: `stallfree_accounts`, `stallfree_session`, `stallfree_audit_log`,
  `stallfree_session_notice`, plus one-time legacy-migration flags
  (`stallfree_legacy_migrated`, `stallfree_auth_migrated`).
- Legacy keys (`stallfree_cart`, `stallfree_orders`, …) are migrated once to scoped
  keys.
- Cart: items keyed by `productId`, duplicate merge, quantity clamped to effective
  stock, unavailable/archived/sold-out reasons.
- Orders: immutable item/price/customer snapshots; `clientToken` dedupe prevents
  duplicate submits; stable `SF-…` id; status lifecycle enforced by
  `ORDER_TRANSITIONS`; cancellation frees stock because stock is derived from
  non-cancelled order quantities (`stockBaseline − soldQuantity`), not decremented
  twice.
- Demo backup export/import (`schemaVersion: 1`) excludes accounts, sessions,
  hashes/salts, and setup material.

**Admin dashboard (`js/admin.js`) — six preserved tabs:**
`Overview`, `Orders`, `Products`, `Shops`, `Customers`, `Audit log`.
Entry guard: no admin → one-time setup only when signed out; signed-out → sign-in
prompt; signed-in customer → access-denied state. Every mutation re-checks
`requireAdmin()` inside storage/auth.

**Tests (`tests/smoke.js`):** 15 labelled sections covering static chrome, storefront,
registration/login, checkout/double-submit/tracking, admin bootstrap and guards, stock
accounting, profile isolation, admin→customer status propagation, re-render duplicates,
search/filter/empty state/logout, navigation, followed shops, selective checkout,
regression matrix (auth/shop/order/admin/data), and demo disclaimers/accessibility
details.

### Prioritized defects (baseline)

**P0 — blocking:** none observed. Automated suite is green and JS parses.

**P1 — high:**
1. **All implementation work is uncommitted.** A hard reset or cleanup would erase it.
   Mitigation: external ZIP snapshot created; recommend a Git working branch/commit
   before Part 01.

**P2 — polish / documentation / inherent demo limits:**
1. **README test-count drift:** README says the suite reports `271 passed`; the
   current suite reports **306 passed**. Documentation should be corrected in a later
   approved documentation part.
2. **Client-side auth is bypassable by design:** localStorage role/session/setup data
   can be edited in devtools. This is documented and cannot be fixed without a backend;
   it must keep being stated plainly in UI/docs.
3. **Remote product photography:** images depend on external Unsplash URLs; offline or
   blocked requests show the placeholder. Already handled as a non-blocking fallback.
4. **Test fixtures contain obviously fake setup passphrases** (per-run, not shipped
   production credentials and not compared against source). Acceptable per Part 01, but
   worth keeping clearly labelled as fixtures.
5. **Browser-only verification gap:** all baseline UI checks ran in jsdom. A real
   browser/manual pass (responsive widths, keyboard, dialog focus) remains unverified.
6. **Setup passphrase is a local ceremony, not a secret check.** Any passphrase meeting
   the length/uniqueness rules is accepted; this is intentional and should not be
   misrepresented as secure.

### Observed plan-part status at baseline

The working tree already appears to contain implementations matching Parts 01–08
(portable tests, single-admin rules, storefront, cart/checkout, order history/reviews/
profile/help, six admin panels, responsive/a11y polish, demo backup, docs). Therefore
Parts 01–08 should be treated as **verify-and-fix** passes rather than greenfield work,
and each still requires separate approval and its own verification record.

### Not tested in Part 00

- Manual clicks in a real Chrome/Edge/Firefox profile (only jsdom executed).
- 320px/tablet/desktop visual inspection.
- Cross-browser storage/origin behavior.
- Real screen-reader and keyboard-only traversal.

### Checkpoint

**Part 00 complete.** No user feature was removed or rewritten; the only file added is
this progress log.

---

## Part 01 — Foundation and test reliability

- **Status:** COMPLETE
- **Date:** 2026-10-23
- **Changed files:** `tests/smoke.js`, `docs/implementation-progress.md`
- **Next part:** Part 02 completed — see below

### Work performed (plan item by item)

1. **Stray literal after `</head>` in `admin.html`** — inspected every root page by
   reading the bytes immediately after `</head>`. No stray text exists on any page
   (`admin.html` jumps straight to `<body data-page="admin">`). No change needed.
2. **Portable test root** — `tests/smoke.js` already uses
   `const ROOT = path.resolve(__dirname, '..')` and binds the ephemeral HTTP server to
   an OS-assigned port. No hardcoded Windows path or fixed port remains. No change
   needed.
3. **No owner credential in shipped tests** — the suite no longer contains reusable
   passphrase literals. Each run now generates fresh fake setup passphrases from
   `randomBytes`, with an explicit comment that they are test-only fixtures and are
   never compared with anything in application source. `crypto` import widened to
   `const { webcrypto, randomBytes } = require('crypto')`.
4. **jsdom pin** — `jsdom@30.1.3` is pinned in `tests/package.json`;
   `npm ci --dry-run` reports the lockfile is in sync (lockfileVersion 3). No change
   needed.
5. **Broken links / console errors / parsing** — full static scan of every internal
   `href` in the 12 HTML pages (files and `#anchors`, query strings ignored) plus every
   local asset referenced from `js/*.js`: **all resolve, 0 missing**. All 6 `js/*.js`
   files pass `node --check`. The suite's per-page "no js/console errors" checks are
   green. No repairs were needed.
6. **Before/after results** — suite was **306 passed / 0 failed** before the fixture
   change and **306 passed / 0 failed** after. No regressions, no known failures.

### Verification

| Check | Command | Result |
|---|---|---|
| Regression suite (before) | `cd tests && npm test` | **306 passed, 0 failed** |
| Regression suite (after edit) | `cd tests && npm test` | **306 passed, 0 failed** |
| Test syntax | `node --check tests/smoke.js` | PASS |
| Lockfile/dependency sync | `cd tests && npm ci --dry-run` | PASS — "up to date" |
| No legacy credential literals | grep for removed passphrase literals in tests | PASS — 0 matches |
| Per-run fixtures present | grep | `ADMIN_SETUP_PASSPHRASE = 'test-setup-' + randomBytes(12)` (and B variant) |
| Page head cleanliness | byte-level check after `</head>` on all 12 pages | PASS — no stray text |
| Links/anchors/assets | `linkcheck.js` over all HTML + JS | PASS — all resolve |
| JavaScript syntax | `node --check` on 6 `js/*.js` | PASS |

### Notes / honest limits

- The suite runs in jsdom over a local HTTP server; a real-browser manual pass is
  still **NOT TESTED** (deferred to Part 07/08).
- Client-side admin setup remains a local ceremony, not security — this is inherent and
  documented; Part 01 did not change the threat model.
- README's stale "271 passed" line was **not** edited: README is documentation scope
  (Part 08), not Part 01. Still tracked as a P2 defect.
- Uncommitted-work risk (P1) from Part 00 is unchanged; a Git commit/branch is still
  recommended.

### Checkpoint

**Part 01 complete.** No application code, markup, or CSS was changed; only the test
fixture handling and this log. No user feature was removed or rewritten.

---

## Part 02 — Single admin and customer authentication

- **Status:** COMPLETE
- **Date:** 2026-10-23
- **Changed files:** `tests/smoke.js` (new focused auth section), `docs/implementation-progress.md`
- **Application code changed:** none — the existing `js/auth.js`, `admin.html`, `login.html`,
  `register.html`, and `js/ui.js` already implemented the required behavior; Part 02 was a
  verify-and-harden pass.
- **Next part:** Part 03 completed — see below

### Work performed (plan item by item)

1. **Reuse existing auth logic** — audited `adminExists()`, `adminSetup()`,
   `requireAdmin()`, `registerAccount()`, `currentSession()`, `loginAccount()`,
   `logoutAccount()`, `updateOwnAccount()`, `setAccountSuspended()`, and `deleteAccount()`.
   No parallel auth path was introduced.
2. **First-run setup gating and validation** — `initAdmin()` renders the setup form only
   when `adminExists()` is false and the visitor is signed out. Name, normalized unique
   email, password/confirmation and the local demo passphrase are all validated by
   `adminSetup()`/`registerAccount()`. The passphrase is an empty password-type field with
   no prefilled value and is never displayed by the site.
3. **One admin only / customer-only registration** — `adminSetup()` refuses when an admin
   exists; the setup screen closes permanently. `registerAccount()` hardcodes
   `role: 'customer'` and ignores forged `role` input. `register.html` has no role control,
   the Customers tab has no promotion/role editor, and the only prefixed role assignment is
   the guarded bootstrap promotion.
4. **Dashboard restriction** — `initAdmin()` gives signed-in customers an
   "Administrator access required" state (no tabs, no setup form) and signed-out visitors a
   sign-in prompt when an admin exists. Mutations funnel through `requireAdmin()` in
   `storage.js`/`auth.js`, so console-crafted calls fail. `authNextTarget()` only accepts
   `[A-Za-z0-9_-]+.html` local targets; off-site, traversal, and `javascript:` values fall
   back to `index.html`; admins always go to `admin.html`.
5. **Session lifecycle** — login redirects by role and safe `next`; logout clears only the
   session key and keeps accounts/scoped data; `currentSession()` clears expired,
   suspended, or orphaned sessions and records a one-off `expired`/`suspended` notice;
   emails are normalized on registration, login, lookup and profile updates.
6. **Password handling preserved** — PBKDF2-HMAC-SHA256, 310,000 iterations, per-account
   random salt, constant-time comparison; no plaintext storage or fallback added.
   Added a focused auth test section covering first/second admin, customer registration,
   role spoofing (API + UI + profile update), login normalization, session expiry,
   suspension, orphaned sessions, direct dashboard access, signed-out/signed-in setup
   gating, logout retention, and redirect safety.

### Verification

| Check | Result |
|---|---|
| `node --check tests/smoke.js` | PASS |
| Baseline suite before Part 02 | 306 passed, 0 failed |
| Suite with new focused auth section | **358 passed, 0 failed** (+52 checks) |
| New: first admin created / second refused | PASS |
| New: role spoofing ignored (register + profile update) | PASS |
| New: expired session cleared + one-off notice | PASS |
| New: suspended session cleared + notice + guard | PASS |
| New: orphaned session cleared | PASS |
| New: customer/signed-out direct dashboard access | PASS |
| New: redirect safety (off-site/traversal rejected) | PASS |
| New: logout keeps account records | PASS |

### Honest security statement

Part 02 enforces the single-admin rule **in the normal application flow only**. Because
the entire account system lives in `localStorage`, anyone with this browser profile or
developer tools can edit role flags, sessions, account records, or setup state directly.
No client-side check can prevent that. This remains an inherent demo limitation, is stated
in the UI and README, and would require a trusted backend to fix.

### Not tested

- Real-browser manual flows (jsdom only); deferred to Part 07/08.

### Checkpoint

**Part 02 complete.** No user feature was removed or rewritten; application behavior is
unchanged except for added regression coverage.

---

## Part 03 — Catalog, product details and shop discovery

- **Status:** COMPLETE
- **Date:** 2026-10-23
- **Changed files:** `tests/smoke.js` (new storefront-discovery section), `docs/implementation-progress.md`
- **Application code changed:** none — `js/data.js`, `js/main.js`, `js/storage.js`, `js/ui.js`,
  and the storefront pages already met the plan; Part 03 was a verify-and-harden pass.
- **Next part:** Part 04 completed — see below

### Work performed (plan item by item)

1. **Routes, navigation and seller mapping** — verified the homepage featured rail, category
   directory, seller directory, product detail and shop storefront routes. Every listable
   product resolves to an existing shop and category, browse cards link to resolvable
   `products.html?id=…` pages, and every shop card links to `shop.html?id=…`. Product ids
   remain unique.
2. **Search, filters and sort combinations** — confirmed `?q=`, `?cat=`, `?shop=`,
   `?price=`, `?free=`, `?instock=`, `?rating=`, `?top=`, `?badge=`, custom price ranges and
   `?sort=` all feed one `filteredProducts()` funnel. Verified ascending/descending price
   ordering, combined constraints, result counts, active-filter chips and the no-match empty
   state (including an unknown category). Category tiles and seller filters come from the
   live seed/override catalogue, not invented lists.
3. **Product detail accuracy** — verified the effective (overridden) price, compare-at price
   and saving chip, stock from `productStock()`, mapped seller name/link, breadcrumbs,
   gallery focus/selection, image `onerror` fallback, sold-out disabling, and graceful
   states for unknown product and shop ids.
4. **Admin changes reach the storefront** — seeded catalog overrides, a custom product and
   shop overrides; each appeared through the shared read helpers in cards, search, PDP and
   the shop storefront. Admin CRUD was not modified in this part.
5. **Formatting, escaping and controls** — peso grouping is consistent (`₱1,450`), product
   names/descriptions are HTML-escaped in cards and PDP (no script execution), photo URLs
   cannot break out of `src`, and quick filters, sort, shop tabs and PDP thumbnails are
   native buttons/selects that take focus and update `aria-pressed`/`aria-selected`.
6. **Focused checks and mobile readability** — added a storefront-discovery test section.
   Practical mobile checks confirm the viewport meta on all storefront pages, a readable
   mobile product grid, a single-column PDP below 900px, horizontally scrolling quick
   filters, and the responsive shop hero.

### Verification

| Check | Result |
|---|---|
| `node --check tests/smoke.js` | PASS |
| Baseline suite before Part 03 | 358 passed, 0 failed |
| Suite with new storefront section | **440 passed, 0 failed** (+82 checks) |
| New: catalogue/shop/category mapping exhaustive | PASS |
| New: category counts match live catalogue | PASS |
| New: search/filter/sort combinations + empty states | PASS |
| New: PDP price/stock/seller/availability accuracy | PASS |
| New: custom product + catalog/shop overrides visible | PASS |
| New: escaped product text + safe photo URLs | PASS |
| New: unknown product/shop ids fail softly | PASS |
| New: native, focusable browse/gallery controls | PASS |
| New: static mobile-readability checks | PASS |

### Not tested

- Real-browser visual layout, touch targets and responsive rendering (jsdom has no layout
  engine). Static CSS/viewport checks passed; visual confirmation remains for Part 07/08.

### Checkpoint

**Part 03 complete.** No application code, markup or CSS was changed; only regression
coverage and this log were added.

**Awaiting approval for Part 04 ONLY.**

---

## Part 04 — Cart, wishlist and demo checkout

- **Status:** COMPLETE
- **Date:** 2026-10-23
- **Changed files:** `js/storage.js`, `tests/smoke.js` (new focused purchase-simulation section), `docs/implementation-progress.md`
- **Application markup/CSS changed:** none — `orders.html`, `wishlist.html`, `js/main.js` and `js/ui.js` already provided the required flows and demo labels.
- **Next part:** Part 05 — **pending user approval**

### Storage keys and guest/customer policy (traced before changes)

- **Cart:** `stallfree:<userId|guest>:cart` (one line per product id).
- **Wishlist:** `stallfree:<userId|guest>:wishlist` (product ids, newest first).
- **Orders:** one shared `stallfree:orders` list; each order is tagged with its owner
  (`userId: '<id>'` or `'guest'`). Customers read only their own owner-tagged orders;
  admins read all.
- **Guest → customer adoption:** registration/login moves the guest-scoped cart,
  wishlist, profile, reviews, recent, follows, coupon and searches to the account, and
  re-tags guest orders to that account. It only runs when the target account has no
  cart, profile or orders, so it cannot overwrite existing account data. The guest
  copies are removed after the move.
- **Account isolation:** logging out returns to the guest scope while the account's
  cart/wishlist remain under that account key. A second account does not inherit the
  first account's data. No guest data is deleted except by deliberate adoption or the
  user's own clear/remove actions.

### Work performed (plan item by item)

1. **Cart/wishlist keys and policy** — traced the scoped keys, order owner tags,
   adoption rules and logout behavior above. Kept the existing policy; no guest data was
   discarded.
2. **Cart operations** — cart actions remain product-id based. Hardened
   `getCart()` in `js/storage.js` so stored lines are normalised: non-numeric, missing,
   zero or negative quantities become `1`; decimals are truncated; repeated product
   lines are merged; unknown/removed products are dropped. `addToCart()` and
   `setCartQty()` now guard non-numeric/negative input and cap at effective stock.
   Unavailable, archived, sold-out and over-quantity lines still render with a clear
   reason, a disabled checkbox and exclusion from checkout.
3. **Wishlist** — add/remove still persists per customer. `getWishlist()` now ignores
   unknown ids and de-duplicates repeated entries so a malformed list cannot render the
   same card twice. The toggle/badge/remove UI already updated immediately; added checks
   for persistence, badge count, removal feedback and reload.
4. **Demo checkout** — required name, phone (at least 7 digits), address and payment
   method are validated with inline errors; unavailable/over-stock selections are
   blocked; totals are recomputed from current effective prices; client-token
   idempotency blocks duplicate orders; order ids stay `SF-` + stable digits; and the
   order stores immutable item/price/quantity and customer snapshots. Stock continues to
   use the existing derived semantics (`stockBaseline − soldQuantity`), so cancellation
   releases stock without double deduction.
   - **Bug fixed:** `createOrder()` checked the empty-cart condition before the
     client-token lookup. A successful submit empties the cart, so a retried submit
     returned “Your cart is empty” instead of the original order. The token lookup now
     runs first, making retries genuinely idempotent. The new test caught this.
5. **DEMO-only labelling / no real payment data** — verified checkout shows
   “Demo order - no real payment or shipment.” plus the mandatory disclaimer, and the
   receipt carries the same warning. Payment choices remain “Cash on delivery” and
   “GCash (demo)” only; the form asks for no card number, CVV, expiry, IBAN or other real
   payment credential. No payment method was added.
6. **Required edge-case tests** — added section `[18]` covering:
   - reload persistence of cart contents;
   - duplicate cart merges, quantity floor/ceiling, removal;
   - malformed stored quantities and duplicate stored lines (no negative/NaN totals);
   - stale effective price at checkout and a frozen price snapshot after later edits;
   - stale cart quantity re-checked against current stock, with no order and no negative
     stock;
   - fast repeated submit with one token (one order, same id);
   - guest→account cart adoption, logout scope, second-account isolation and re-login;
   - malformed/duplicate wishlist entries, badge count, removal and reload;
   - simulated `localStorage` write failures for cart, wishlist and checkout (no crash,
     no corruption, no partial order; checkout reports an error).

### Verification

| Check | Result |
|---|---|
| `node --check js/storage.js` / `node --check tests/smoke.js` | PASS |
| Baseline suite before Part 04 | 440 passed, 0 failed |
| Suite with new focused purchase section | **514 passed, 0 failed** (+74 checks) |
| Cart reload persistence | PASS |
| Duplicate add merge + quantity floor/stock ceiling | PASS |
| Malformed cart values cannot make negative/NaN totals | PASS |
| Current-price checkout + immutable price snapshot after edit | PASS |
| Stale quantity/out-of-stock checkout re-check | PASS — no order, stock stops at 0 |
| One-token repeated submit | PASS — one order, same id |
| Account switching cart isolation + guest adoption | PASS |
| Wishlist dedupe/persist/remove/reload | PASS |
| Simulated storage write failures | PASS — no crash/corruption; order reports save failure |
| Existing checkout/tracking/stock/privacy sections | PASS — no regressions |

### Notes / honest limits

- `writeStore()` intentionally swallows quota/storage exceptions so pages keep running.
  A failed **cart/wishlist** write therefore leaves existing data intact and does not
  crash, but the toast may still describe the attempted action; checkout does surface
  “Could not save the order in this browser.” A dedicated cart/wishlist quota message is
  not added in this part.
- As before, localStorage data (including prices/stock/roles) can be edited in developer
  tools; preventing that requires a backend and is outside this frontend-only demo.
- Real-browser visual, keyboard-only and responsive verification remains **NOT TESTED**
  in this part; jsdom is the executed UI environment.
- All implementation work is still uncommitted; the Part 00 external snapshot and P1
  recommendation are unchanged.

### Checkpoint

**Part 04 complete.** The customer flow add → cart → demo checkout → persisted order is
covered end to end, including retry idempotency and stock accounting; wishlist state
persists per scope. No feature was removed or rewritten.

**Part complete. Do you want me to continue to Part 05? (yes/no)**

---

## Part 05 — Order history, reviews, profile and help

- **Status:** COMPLETE
- **Date:** 2026-10-23
- **Changed files:** `js/storage.js`, `js/main.js`, `js/ui.js`, `css/styles.css`,
  `help.html`, `tests/smoke.js`, `docs/implementation-progress.md`
- **Next part:** Part 06 — **pending user approval**

### State found on arrival (important)

The working tree already contained an **unfinished and unparsable** section `[19]` in
`tests/smoke.js` (duplicate `histDomB` declaration plus references to an undefined
`orderB`). `node smoke.js` failed immediately with a `SyntaxError`, even though the log
recorded the Part 04 baseline as 514 passed. The broken draft was removed and replaced
with a complete, executable section `[19]`; it was never reported as a passing result.

### Work performed (plan item by item)

1. **Order history privacy and accuracy** — confirmed `getOrders()` filters the shared
   order list by the current browser scope (`userId`, or `guest`), `canViewOrder()` blocks
   another scope's order detail, and `getOrderStats()` excludes cancelled orders from
   spend/items. Tests now cover two signed-in customers, the guest scope, a guessed
   `orders.html?id=…` URL, saved dates/amounts/status labels, and the empty state.
2. **Admin status reflection** — verified the order detail and history read the shared
   saved order, so an admin transition (placed → confirmed → preparing → shipped) and
   tracking details appear for the customer after reload. No shipping progress is
   fabricated; the timeline is driven only by saved status history.
3. **Reviews: write / edit / display** — added `updateReview(reviewId, patch)` in
   `js/storage.js`. It only finds reviews in the current account/guest scope, re-validates
   rating (1–5), text (10–600 chars) and title length, preserves the review id/date, and
   returns `{ ok, review, error }` for useful messages. The product page now has an
   **Edit review** action on the viewer's own review, an edit-mode heading/submit/cancel,
   an inline form error, and an “edited” marker. Writing and editing both re-render the
   rating bars, themes, list and PDP rating; editing updates in place (no duplicate card).
   Stored reviews are still normalised and HTML-escaped on render.
4. **Profile and password** — verified name/email/phone/address validation, duplicate and
   normalised email rejection, role preservation, persisted account-scoped profile,
   password current/mismatch/policy errors, success feedback, and old-password rejection.
   Guest profiles remain local-only with a read-only email and no password form. Account
   switching hides the other account's profile and order history.
5. **Help / FAQ** — added FAQ entries explaining the demo order status workflow and how
   reviewing/editing works, alongside the existing delivery, payment, returns, privacy,
   account and reset answers. Confirmed every in-page anchor resolves, demo/no-real-payment
   wording is present, and orders/profile/admin links exist.
6. **Focused regression tests** — added section `[19]` covering two-account and guest
   history isolation, guessed-URL blocking, admin→customer status/tracking, immutable
   price/total snapshots, review validation/editing/cancel/isolation/malformed storage/
   write failure, profile edit/password/role/isolation/guest behavior, and help content
   and links.

### Verification

| Check | Result |
|---|---|
| `node --check js/storage.js` / `js/main.js` / `js/ui.js` / `tests/smoke.js` | PASS |
| Test file on arrival | **FAIL — `SyntaxError: Identifier 'histDomB' has already been declared`** (unfinished prior draft) |
| Recorded Part 04 baseline | 514 passed, 0 failed |
| Full suite after Part 05 | **617 passed, 0 failed** (+103 checks) |
| Two customers + guest history isolation | PASS |
| Guessed order URL blocked, no leakage | PASS |
| Admin status/tracking visible to customer after reload | PASS |
| Price/total snapshots survive later catalogue edits | PASS |
| Review add validation (rating, length) | PASS |
| Review edit updates in place, one stored record | PASS |
| Review cancel restores write form | PASS |
| Review isolation across accounts + escaped markup | PASS |
| Malformed stored reviews ignored safely | PASS |
| Review edit storage failure reports an error, no crash | PASS |
| Profile validation / role / email uniqueness | PASS |
| Password change rules + old password invalidated | PASS |
| Guest profile rules | PASS |
| Help sections, anchors, links and demo wording | PASS |

### Notes / honest limits

- Reviews are browser-local and scoped to the account/guest session. There is no
  moderation service, shared database, delete action, or cross-device sync; switching
  accounts hides the other scope's reviews but anyone with devtools can edit storage.
- Review edit is scoped to the review's own stored id; another scope cannot reach it
  through the normal UI or storage helpers.
- Real-browser visual/keyboard verification of the new review form and “Edit review”
  action is **NOT TESTED** (jsdom is the executed environment); deferred to Part 07/08.
- README test-count drift (still says 271) remains a documentation-scope item for Part 08.
- All implementation work is still uncommitted; the Part 00 snapshot and P1 advice are
  unchanged.

### Checkpoint

**Part 05 complete.** Customers see only their own saved orders with accurate snapshots
and admin status updates; reviews can be written, edited in place and are safely rendered;
profile/password flows and help content are verified. No feature was removed or rewritten.

**Part complete. Do you want me to continue to Part 06? (yes/no)**

---

## Part 06 — Admin dashboard and management

- **Status:** COMPLETE
- **Date:** 2026-10-23
- **Changed files:** `js/admin.js`, `js/storage.js`, `js/auth.js`, `css/styles.css`,
  `tests/smoke.js`, `docs/implementation-progress.md`
- **Next part:** not started (Part 07 awaits approval)

### Scope kept

- All six admin tabs remain: Overview, Orders, Products, Shops, Customers, Audit log.
- No new roles, authentication methods, backend, APIs or payment/shipping services.
- Every mutation still passes through `requireAdmin()` in `js/storage.js`; the admin page
  is a local-only demonstration.
- Only Part 06 was worked on. Parts 07-08 were not started or prepared.

### Work performed

1. **Overview** - figures are now calculated from the records actually stored in the
   browser (orders, local customer accounts, catalogue products, catalogue shops). Orders
   are sorted newest first before the "recent activity" list. The panel is explicitly
   marked **Local demo** / **Simulation only**, states that revenue only counts delivered
   orders, and says no real sale, payment, shipment or payout happened.
2. **Orders** - added search/filter (existing controls preserved), a **View details**
   modal showing customer, item, payment, delivery, totals and status-history snapshots,
   plus demo labelling. The status picker offers only the current status and allowed next
   statuses; stale/forced invalid transitions are refused by storage and shown in the
   banner. Cancelling or requesting a return asks for confirmation first. Status changes
   continue to release reserved stock once, and the customer's saved history shows the new
   status and demo tracking reference. Tracking number/courier are trimmed and limited to
   80 characters; failed order saves surface an error instead of silently passing.
3. **Products** - rows show archival state, stock, and the number of saved orders that
   reference the listing. Products referenced by order history offer archive/restore
   (never permanent delete); the delete action is hidden and `removeProduct()` /
   `deleteCustomProduct()` refuse it at the storage layer. Unreferenced custom products can
   still be deleted after confirmation. Create/edit forms share validation: required name,
   required numeric price and whole-number stock (blank values rejected), bounded values,
   and compare-at must be higher than the selling price. Edits keep the product ID and
   overrides, and appear on the storefront immediately. Image thumbnails fall back to the
   category gradient letter when a URL fails.
4. **Shops** - only supported fields (store name, tagline, location) can be edited, with
   length limits and a non-empty store name. Successful edits update the linked catalogue
   and storefronts; rejected input leaves the saved record unchanged and shows a banner.
5. **Customers** - searchable account list with order count/spend. Suspend and remove both
   require explicit confirmation; suspension clears that customer's session and blocks
   sign-in until reactivated. Removing an account leaves its saved demo orders intact and
   the admin can still find them. The sole administrator is never listed and cannot be
   suspended or deleted; no role changes or second admin can be created from this panel.
6. **Audit log** - admin mutations are recorded with an id, actor, action, timestamp and
   the affected record id (product, order, shop, account) where applicable. Existing
   action/period filters still work, and the panel explains the log is browser-local and
   not tamper-proof.
7. **Feedback and guards** - admin banners now distinguish success (`banner-success`) from
   errors (`banner-error`); setup errors keep their danger styling. Empty and error states
   were checked for each tab, and direct access remains guarded: signed-out visitors get a
   sign-in prompt, customers get "Administrator access required" with no tabs or setup form,
   and customer calls to catalogue mutations are refused.
8. **Focused regression tests** - added section `[20]` (81 checks) in `tests/smoke.js`
   covering overview values/demo labels, order search/detail/confirmation/lifecycle and
   customer-history propagation, stock release on cancellation, invalid transitions,
   archive/restore vs delete for referenced products, create/edit validation and storefront
   propagation, shop edits, suspend/reactivate/delete behavior, sole-admin guards, audit
   entries/filtering, and non-admin/signed-out entry points.

### Verification

| Check | Result |
|---|---|
| `node --check js/admin.js` / `js/storage.js` / `js/auth.js` / `tests/smoke.js` | PASS |
| Part 05 baseline | 617 passed, 0 failed |
| Full suite after Part 06 | **698 passed, 0 failed** (+81 checks) |
| Six admin tabs still render | PASS |
| Overview counts match stored orders, accounts, products and shops | PASS |
| Overview labels figures as local demo / simulation | PASS |
| Order search, detail snapshots, confirmation, lifecycle | PASS |
| Cancellation releases reserved stock exactly once | PASS |
| Invalid status jump is unavailable and refused with a visible error | PASS |
| Customer order history shows admin status + demo tracking | PASS |
| Referenced product -> archive/restore; delete refused at UI and storage | PASS |
| Unreferenced custom product can be deleted after confirmation | PASS |
| Product create/edit validation (name, price, stock, compare-at) | PASS |
| Product edits reach the storefront; archived PDP fails softly | PASS |
| Shop edit propagates to linked product cards; blank name rejected | PASS |
| Suspend blocks sign-in; reactivate restores access | PASS |
| Account removal keeps saved orders; sole admin cannot be suspended/deleted | PASS |
| Audit entries carry id, actor, action, timestamp, record id | PASS |
| Non-admin and signed-out visitors cannot use the admin UI or mutations | PASS |

### Notes / honest limits

- Everything remains browser-local demo data. There is no shared database, payment
  processing, courier integration, seller payout, multi-admin support, or server-side
  authorization; devtools can edit storage and the audit log.
- The audit log is an activity aid, not a tamper-proof trail.
- Real-browser visual/keyboard/mobile verification of the new admin detail modal,
  banners and thumbnails is **NOT TESTED**; jsdom is the executed environment. Deferred to
  the later polish/verification part.
- jsdom does not navigate after checkout, so the test helper re-enables the **Place order**
  button to emulate the real browser's confirmation-page reload. This affects tests only.
- Pre-existing merge-conflict marker lines in `README.md` and `products.html` were left
  untouched (outside Part 06 scope; documentation/polish risk for a later part).
- All implementation work remains uncommitted, as before.

### Checkpoint

**Part 06 complete.** The six admin panels now read real local records, validate and
confirm destructive actions, keep order-history snapshots intact, and remain inaccessible
to non-admins. No feature was removed and no new role or backend was introduced.

**Part complete. Do you want me to continue to Part 07? (yes/no)**

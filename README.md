# StallFree

StallFree is a frontend-only marketplace prototype for local, handmade, and small-shop
products. It keeps the original brand, pages, seed catalogue, and vanilla
HTML/CSS/JavaScript architecture. There is no application server, no cloud database,
and no real payment integration.

> **StallFree is a frontend-only demonstration. Accounts, orders and payments are
> simulated and stored in this browser. No real payment or delivery is processed.**

That disclaimer is also shown at checkout and on the order receipt/help pages.

---

## Quick start

Use a local HTTP server. Opening the pages through `file://` gives the browser an
opaque origin, so `localStorage`, sessions, and some asset URLs do not behave like a
normal site.

From the project root:

```bash
python -m http.server 5500
```

Then open <http://localhost:5500/>.

Any static server works, for example:

```bash
npx serve .
```

Keep one origin for your demo. `http://localhost:5500`, `http://127.0.0.1:5500`,
different ports, and `file://` each get separate browser storage on most browsers.

---

## Automated tests

The suite drives the real pages in jsdom, served from a temporary local HTTP server.
It covers page chrome, registration/login, checkout, duplicate-submit protection,
order tracking, admin setup and guards, stock accounting, profile isolation,
wishlists, storefront navigation, the six admin tabs, data export/import, malformed
storage, and the required regression scenarios.

```bash
cd tests
npm ci
npm test
```

`jsdom` is pinned to `30.1.3` in `tests/package.json`, and `tests/package-lock.json`
is committed for reproducible installs. The server binds to an ephemeral port, so
the suite does not depend on a developer-specific machine path or port.

The current suite reports `306 passed, 0 failed`.

---

## Demo workflow

### Customer

1. Browse the home page, catalogue, categories, shops, and product details.
2. Search, filter, sort, save a wishlist item, and manage the cart.
3. Register on `register.html`. Public registration always creates a **customer**;
   there is no role selector.
4. Check out with demo delivery details and a simulated payment choice.
5. Open the order receipt, then revisit `orders.html` to see history and status.
6. Edit the profile, change the password, or sign out.

### First-time administrator

1. On a clean browser origin, open `admin.html`.
2. Choose a setup passphrase of at least 10 characters. It must differ from the
   account password. The passphrase is chosen locally; no setup credential ships in
   the source or tests.
3. Create the single administrator account.
4. Sign in through `login.html`; an administrator is redirected to `admin.html`.
5. Use the six tabs: **Overview**, **Orders**, **Products**, **Shops**,
   **Customers**, and **Audit log**.

The setup form closes permanently once an administrator exists. A second admin
cannot be created through the UI, roles cannot be edited, and the sole admin cannot
be suspended or deleted.

> A frontend passphrase and role checks are UI/data-integrity rules, not security.
> Anyone with developer tools can edit this browser's storage.

---

## Features

- Home, catalogue, categories, shops, sellers, product detail, wishlist, cart,
  checkout, order tracking, profile, help, login, register, and admin pages.
- Search, category/availability/price filters, sorting, clear-filters action, and
  helpful empty states.
- Stock-aware cart quantities and sold-out/low-stock badges. Cart lines that become
  archived, sold out, or short on stock are flagged, disabled, and excluded from
  checkout. Archived products are hidden from public discovery while old order
  snapshots remain intact.
- Checkout validation, stock/price re-check, one-order-per-click token protection,
  simulated payment choices, and immutable item/price snapshots.
- Customer order history and status timeline. Customers only see their own orders;
  the administrator sees all local demo orders.
- Customer reviews with rating bounds, a length limit, and escaped output.
- Profile editing with duplicate-email checks and PBKDF2 password hashing.
- Single-admin dashboard with product/shop editing (including live photo previews),
  order search and transitions, date/status filters, customer suspension, audit
  logging with action/period filters, and demo backup export/import.
- Responsive layout, skip link, labelled controls, visible focus states, reduced
  motion support, and mobile-friendly admin toolbars.

---

## Order lifecycle

Status changes are enforced rather than free-form:

```text
placed -> confirmed -> preparing -> shipped -> out_for_delivery -> delivered
```

Allowed side routes:

- `placed`, `confirmed`, or `preparing` -> `cancelled`
- `shipped` or `out_for_delivery` -> `delivery_failed`
- `delivered` or `delivery_failed` -> `return_requested`

Terminal statuses (`cancelled`, `return_requested`) cannot be reopened. Every update
appends a timestamped history entry and an audit-log record. Cancelling an order
releases its reserved stock.

---

## Project structure

```text
.
├── index.html              Home / storefront
├── products.html           Catalogue with search, filters, sorting
├── categories.html         Category browsing
├── sellers.html            Shops listing
├── shop.html               Individual shop and product view
├── wishlist.html           Saved products
├── orders.html             Cart, checkout, history, order receipt/tracking
├── profile.html            Account details, password, local-data controls
├── help.html               FAQ and demo limitations
├── login.html              Customer/admin sign-in
├── register.html           Customer-only registration
├── admin.html              Single-admin dashboard
├── css/styles.css          Brand tokens, components, responsive rules
├── js/data.js              Seed catalogue, shops, categories, helpers
├── js/auth.js              Accounts, sessions, PBKDF2, one-admin rules
├── js/storage.js           Scoped stores, catalogue overlays, orders, backups
├── js/ui.js                Shared header/footer, cards, dialogs, actions
├── js/main.js              Page initialization and customer flows
├── js/admin.js             Six admin panels and controls
├── tests/smoke.js          jsdom regression suite
├── tests/package.json      Pinned test dependency
└── tests/package-lock.json Committed dependency lockfile
```

Scripts are classic globals loaded in a fixed order; the project is intentionally
not converted to a framework or ES-module build.

---

## Local data model

Everything is stored in this browser's `localStorage`. The exact keys are preserved
for compatibility with earlier versions, with a one-time legacy migration.

- Per-account/guest stores use the `stallfree:<user-id>:<name>` namespaces for cart,
  wishlist, profile, reviews, recently viewed, followed shops, coupon, and search
  history. The guest namespace is `guest`.
- Orders use one shared local store, `stallfree:orders`, with each order tagged by
  `userId` so customers only see their own and the admin can see all of them.
- Catalogue, custom-product, and shop edits are global local-demo overlays:
  `stallfree:catalog_overrides`, `stallfree:custom_products`, and
  `stallfree:shop_overrides`.
- Accounts, the session, and the audit log use `stallfree_accounts`,
  `stallfree_session`, and `stallfree_audit_log`.
- Account passwords are stored as salted PBKDF2 hashes; plaintext passwords are not
  stored. Sessions include an expiry timestamp.

Switching customer accounts switches the scoped cart/wishlist/profile data. Signing
out ends the session but keeps the account and its saved data.

---

## Demo backup, import, and reset

The **Overview** tab of the admin dashboard has:

- **Export demo backup** — downloads a versioned JSON snapshot containing demo
  orders, catalogue overrides, custom products, and shop edits.
- **Import demo backup** — validates the file and asks for confirmation before
  replacing those demo records.

Exports never include accounts, sessions, password hashes, salts, or setup material.
Accounts are not restored by an import; portable login across browsers is not
supported. Orders may contain the fictional demo name, phone, and address typed at
checkout, so do not use real personal data.

To reset only the current customer's cart, wishlist, profile, reviews, follows, and
own orders, use **Delete all local data** on `profile.html`.

To reset the whole demo, including the administrator and every account:

1. Export a backup first if you want to keep demo orders/catalogue edits.
2. Open the browser's developer tools -> Application/Storage -> Local Storage for
   this origin.
3. Delete the site's stored entries (or clear site data for the origin).
4. Reload the page. `admin.html` will offer first-time setup again.

Clearing browser data is destructive and cannot be undone. If the administrator
password is lost, there is no email recovery or hidden fallback account; reset the
local demo as above. Creating a second administrator to recover access is not
supported.

---

## Security and privacy limits

This project demonstrates role-dependent UI, local account flows, and password
hashing. It does **not** provide trustworthy authentication or authorization.

- No backend, central database, email verification, password reset email, real
  payment gateway, shipping integration, or cross-device sync exists.
- Anyone with access to the browser profile or developer tools can read or modify
  local data, including role flags. Client-side checks cannot prevent that.
- Do not enter real names, addresses, phone numbers, payment-card details, or
  passwords. Use fictional demo data only.
- Local storage cannot prevent overselling across simultaneous browsers; it only
  enforces stock within the current local data.
- The audit log is editable local demo history, not tamper-proof evidence.
- Product photos are the only external requests; no account or order data is
  transmitted by the application.

For a production storefront, authentication, authorization, inventory transactions,
payments, and order processing must run on a trusted server.

---

## Accessibility and responsive behavior

- Every page has one header/footer, a skip link to the main landmark, and labelled
  navigation.
- Forms use visible labels, inline errors, and focus movement to the first invalid
  field.
- Dialogs move focus inside and return it to the trigger; destructive actions use
  explicit confirmation.
- Layouts are checked at small mobile widths, tablet, laptop, and wide desktop
  sizes. Admin filters and actions wrap on narrow screens.
- Motion is reduced when the browser requests `prefers-reduced-motion`.
- Broken product images fall back to a styled placeholder instead of a broken icon.

---

## Troubleshooting

**Data disappeared after restarting the server.**  
`localStorage` is tied to the exact origin. Reuse the same protocol, hostname, and
port. Switching between `localhost` and `127.0.0.1` creates separate storage.

**The admin page asks for setup even though an admin existed.**  
The browser origin or browser profile changed, or site data was cleared. Check that
you are on the same origin and profile. There is deliberately no hidden recovery
account.

**A page looks unstyled or scripts do not run.**  
Serve over HTTP, not `file://`, and confirm `css/` and `js/` paths were not renamed.
Check the browser console for a failed resource request.

**Tests fail immediately with a missing module.**  
Run `npm ci` inside `tests/`, then `npm test` again. Do not install from a different
working directory.

**An order status cannot be changed.**  
Use the documented lifecycle from the current status. For example, `placed` must go
to `confirmed` before `preparing` and `shipped`. Final statuses cannot be reopened.

**The catalogue does not show an edited product.**  
Check whether it is archived. Archived listings are intentionally hidden from
storefront pages but remain in old order snapshots. Restore it from the admin
Products tab if needed.

**A product shows only a placeholder image.**  
The remote photo URL failed or was rejected. This is non-blocking; replace the photo
URL in the admin product editor or use the placeholder.

---

## Known limitations / out of scope

- No real payments, refunds, shipping labels, couriers, tax calculation, or email.
- No central multi-user database or cross-device account/order synchronization.
- No multi-admin or multi-vendor authenticated portals. Shops are catalogue records,
  not real seller accounts.
- No real-time stock reservation across clients.
- No server-grade security, audit integrity, or account recovery.

## Credits

Original StallFree coursework team:

- ROSAPA, CHERRY MAE
- TAN, CIARA DAWN
- GILHANG, DEBBIE MARIZ
- DERDER, IZZA MAY

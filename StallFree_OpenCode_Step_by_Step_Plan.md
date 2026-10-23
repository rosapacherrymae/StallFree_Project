# StallFree — OpenCode Step-by-Step Implementation (Approval-Gated)

> Built from the complete StallFree implementation plan and the existing `StallFree_Project.zip`. **No time limit.** The point is controlled, testable changes rather than a rushed rewrite.

## How to use in OpenCode terminal

1. Put these Markdown files inside your StallFree project, e.g. `implementation/`, or keep this combined file outside the codebase.
2. First paste the **START PROMPT** below into OpenCode. Let it complete **Part 00 only**.
3. Check the reported changes and test results. Say **yes, continue to Part 01** only if satisfied. If you want fixes, explain them; OpenCode should remain in the same part until the issue is addressed.
4. Every approval authorizes **one part**, never all remaining parts. Repeat until Part 08.
5. If OpenCode loses context/new terminal session, paste the START PROMPT again with the current `PART_XX.md` and ask it to review `docs/implementation-progress.md` first.

### START PROMPT (copy this to OpenCode)

```text
We are improving my EXISTING StallFree frontend-only website. Follow the attached StallFree OpenCode step-by-step plan exactly. Start at PART_00.md, or Part 00 of the combined Markdown document. Read the project files before editing. Implement ONLY this one part; do not preemptively implement later parts. Preserve current functionality, storage, and design. Run relevant available tests and report precise results. Write/update docs/implementation-progress.md. When Part 00 is done, summarize modified files, verified tests, unresolved items and ASK FOR MY APPROVAL to continue to Part 01. STOP after asking. Do not continue unless I explicitly approve the next part. Each later part must follow the same one-part-only approval rule.
```

### Rule for progress and resuming

Store a short entry in `docs/implementation-progress.md` after each part, including: part number, date (if available), changed files, verification performed, pass/fail/not tested, known blockers, and **next part pending approval**. The progress file is a log, NOT permission to proceed. Before work, OpenCode must inspect Git changes and avoid overwriting manual edits or previous fixes.

### Approval response example

```text
Yes, proceed with Part 01 ONLY. First review docs/implementation-progress.md and current git changes. Follow PART_01.md. Stop and ask again when Part 01 is finished.
```

### Scope overview

| Part | Topic                                        | Stop after                                                   |
| ---- | -------------------------------------------- | ------------------------------------------------------------ |
| 00   | Baseline and protective setup                | Report + request approval for Part 01                        |
| 01   | Foundation and test reliability              | Report + request approval for Part 02                        |
| 02   | Single admin and customer authentication     | Report + request approval for Part 03                        |
| 03   | Catalog, product details and shop discovery  | Report + request approval for Part 04                        |
| 04   | Cart, wishlist and demo checkout             | Report + request approval for Part 05                        |
| 05   | Order history, reviews, profile and help     | Report + request approval for Part 06                        |
| 06   | Admin dashboard and management               | Report + request approval for Part 07                        |
| 07   | Responsive UI, accessibility and demo backup | Report + request approval for Part 08                        |
| 08   | Final testing, documentation and handoff     | Report + request approval for Part 09 (optional future work) |

---

## PART 00 — Baseline and protective setup

**Goal:** Understand existing behavior and establish a reproducible safe starting point; DO NOT implement features yet.

**Relevant files:** all root HTML pages, `js/*.js`, `css/styles.css`, `tests/smoke.js`, `tests/package.json`, `README.md`.

**Do only this:**

1. Inspect project structure and existing Git status; do not overwrite uncommitted work. Recommend/create a safe backup or working branch if appropriate and permitted.
2. Map existing page routing, script load order, auth functions (`adminExists`, `adminSetup`, `requireAdmin`, customer signup), storage keys, carts, orders, and all six admin sections.
3. Identify available test commands, run baseline automated tests when possible, and manually/static inspect principal navigation flows. Record pass/fail/not tested honestly.
4. Produce `docs/implementation-progress.md` with project inventory, baseline test results, prioritized defects, and checkpoint marked **Part 00 complete**. Creating this file is permitted; no other code changes.
5. Never expose or print the known literal setup key while inspecting tests. Identify its presence and planned safe remediation without reproducing it.

**Completion checks:** baseline recorded, files/dependencies mapped, no user feature removed or rewritten; remaining known defects documented.

**End question:** Part complete. Do you want me to continue to Part 01? (yes/no)

---

## PART 01 — Foundation and test reliability

**Goal:** Repair known foundational defects and make tests portable, without touching business feature flows unnecessarily.

**Relevant files:** `admin.html`, `tests/smoke.js`, `tests/package.json`, `tests/package-lock.json` (if present), minimal affected page/scripts, `docs/implementation-progress.md`.

**Do only this:**

1. Remove accidental literal `98` after `</head>` in `admin.html` without changing layout.
2. Replace hardcoded Windows project path in `tests/smoke.js` with a portable root (e.g. `path.resolve(__dirname,'..')`); adjust any related test assumptions.
3. Eliminate embedded plaintext owner setup key from shipping tests. Use clearly documented per-run/test-only fixtures or a non-sensitive isolated fixture approach; do not silently break the admin test. Make a note that client-side admin setup is not truly secure.
4. Pin a compatible `jsdom` dependency version based on actual runtime and commit/update lockfile when appropriate.
5. Repair directly observed broken links, blocking console errors and basic parsing failures _only if safely scoped_. Handle remaining larger issues as later work or blockers.
6. Re-run baseline tests and document before/after results and any known failures.

**Completion checks:** admin page valid, tests portable and reproducible, no literal owner credential in distributed test source, no newly broken pages, progress note updated.

**End question:** Part complete. Do you want me to continue to Part 02? (yes/no)

---

## PART 02 — Single admin and customer authentication

**Goal:** Stabilize account system with exactly one demo administrator, while preserving existing password-handling architecture.

**Relevant files:** `js/auth.js`, `admin.html`, `login.html`, `register.html`, `js/ui.js` if required, `tests/smoke.js`, progress log.

**Do only this:**

1. Inspect existing `adminExists()`, `adminSetup()`, `requireAdmin()`, `register()` and session utilities; reuse instead of creating parallel auth logic.
2. First admin setup must show only when no admin account is present in this browser's stored data. Validate name, normalized unique email, password/confirmation and demo setup step. Do not display setup key to users.
3. After first admin creation, normal UI must refuse subsequent admin creation. Registration always creates `customer`, regardless of forged UI role value; remove role changing/promotions from UI if any.
4. Restrict dashboard UI and admin action entry points to active nonsuspended admin in normal application flow; customer direct URL should redirect/show access denied. Avoid unsafe redirect URLs.
5. Ensure login redirects appropriately, logout clears session but keeps records, expired/suspended sessions handle errors gracefully, and duplicate emails normalize consistently.
6. Preserve existing password hashing/salts; don't replace with plaintext. Add/update focused auth tests for first/second admin, customer registration, role spoofing, session expiry and direct access.

**Completion checks:** one-admin rule passes in normal UI, customers cannot perform admin actions through normal UI, login/signup/logout behave, tests/results documented. Clearly state localStorage/devtools bypass remains possible.

**End question:** Part complete. Do you want me to continue to Part 03? (yes/no)

---

## PART 03 — Catalog, product details and shop discovery

**Goal:** Make storefront exploration reliable without changing order/payment flows yet.

**Relevant files:** `index.html`, `products.html`, `categories.html`, `shop.html`, `sellers.html`, `js/data.js`, `js/main.js`, `js/storage.js` (read/lookup methods), `js/ui.js`, relevant CSS.

**Do only this:**

1. Ensure correct storefront routes, nav, featured products, functional product links and seller/shop mapping.
2. Search/filter/sort combinations work with coherent empty states; categories and seller filters use actual seed/override data, not invented catalogs.
3. Product details show accurate effective price, image fallback, stock, seller and availability. Handle missing/archived product links gracefully.
4. Admin-created/edited products from existing local overrides should be visible through shared catalog read methods; do not modify admin CRUD in this part.
5. Validate user-visible numeric formatting, basic safe rendering of product/shop text and keyboard/focus interactions for modified controls.
6. Add focused smoke checks and test mobile readability where practical.

**Completion checks:** visitor can navigate homepage → search/filter → details/shop with correct products; regression tests pass; progress note updated.

**End question:** Part complete. Do you want me to continue to Part 04? (yes/no)

---

## PART 04 — Cart, wishlist and demo checkout

**Goal:** Make the end-to-end customer purchase simulation correct and persistent.

**Relevant files:** `js/main.js`, `js/storage.js`, `js/ui.js`, applicable product/cart/checkout markup and styles, `tests/smoke.js`.

**Do only this:**

1. Trace cart and wishlist localStorage keys and guest/customer policy before changing. Keep customer isolation and avoid losing guest cart data without explaining a deliberate policy.
2. Cart add/update/remove operates on product IDs, merges duplicates, enforces quantity and effective available stock; reports unavailable items clearly.
3. Wishlist add/remove reflects persisted per-customer state and accurate UI feedback.
4. At checkout validate required form inputs, check stock again, recompute prices/totals, guard double submit, create stable order ID, save immutable item/price/customer snapshots, update stock according to EXISTING implementation semantics (avoid double deductions).
5. Clearly label checkout/order as **DEMO ONLY — no payment, delivery or real seller notification**. Do not request real payment information.
6. Test reload persistence, out-of-stock, stale prices, fast double click, changing accounts, malformed values and storage failures. Do not add real payment methods.

**Completion checks:** customer can add product → cart → demo checkout → persisted order, no duplicate order or negative stock; wishlist persists; updated progress note.

**End question:** Part complete. Do you want me to continue to Part 05? (yes/no)

---

## PART 05 — Order history, reviews, profile and help

**Goal:** Complete the customer post-purchase experience and account management.

**Relevant files:** `orders.html`, `profile.html`, `help.html`, `js/main.js`, `js/auth.js` (existing update methods), `js/storage.js`, `js/ui.js`, styles/tests.

**Do only this:**

1. Display signed-in customer's orders only, with correct saved order snapshots, dates, amounts and status; no other customer's orders in normal UI.
2. Reflect status updates to orders when they are later changed by admin in the same browser origin; do not infer real shipping progress.
3. Review existing review functions. Fix write/edit/display rules based on current product/user requirements, with safe text rendering and useful errors; do not invent moderation service.
4. Profile edit/password change: validate allowed fields, preserve role, confirm user state and provide success/error feedback.
5. Help/FAQ explains demo order workflow, browser-local data and no real payments/deliveries. Fix broken links and empty states.
6. Add focused account-switch and history regression tests.

**Completion checks:** two customer accounts see separated personal records via UI, order status shown correctly, profile/reviews/help usable, regression checks documented.

**End question:** Part complete. Do you want me to continue to Part 06? (yes/no)

---

## PART 06 — Admin dashboard and management

**Goal:** Improve all SIX current admin panels without adding roles or backend services.

**Relevant files:** `admin.html`, `js/admin.js`, `js/storage.js`, `js/auth.js`, `js/ui.js`, `css/styles.css`, tests.

**Do only this:**

1. **Overview:** calculate counts, local demo sales and recent order activity from actual stored records; mark all metrics as local-demo only where relevant.
2. **Orders:** search/filter/detail, valid status transitions, visible success/errors and clear effects on customer history. Preserve existing stock/cancellation semantics; do not double-restock.
3. **Products:** validate create/edit, prices/stock, image fallbacks; prefer archive/restore for products referenced by historical orders; maintain product IDs and overrides.
4. **Shops:** modify supported fields with validation; ensure linked catalog remains consistent.
5. **Customers:** searchable local customer list, safe suspend/delete confirmation, no role changes, no second admin, no self-disable/delete of sole administrator.
6. **Audit Log:** capture meaningful admin mutations with timestamps and record IDs, within limits of editable local browser data.
7. Provide explicit confirm prompts for destructive actions, guards at action entry points and empty/error states. Preserve all six tabs.
8. Add tests ensuring admin updates reflect in storefront/orders, non-admins cannot use normal admin UI, and destructive workflows don't corrupt historical data.

**Completion checks:** six admin panels functional and consistent, single-admin constraints maintained, automated/manual regressions documented.

**End question:** Part complete. Do you want me to continue to Part 07? (yes/no)

---

## PART 07 — Responsive UI, accessibility and demo backup

**Goal:** Polish the current site for presentation; add safe optional local-demo backup if feasible.

**Relevant files:** `css/styles.css`, `js/ui.js`, all HTML pages as needed, minimal related feature scripts, tests/progress.

**Do only this:**

1. Preserve StallFree’s colors and visual style; unify spacing, headings, buttons, form labels, loading/error states and feedback.
2. Test and fix 320px+ mobile, tablet and desktop layouts. Check nav overflow, form usability, dialogs and horizontal scrolling.
3. Add meaningful keyboard/focus behavior, alt text, labels, contrast improvements and reduced-motion handling where relevant.
4. Improve missing image fallbacks, invalid/missing data states, long titles and simple input safety without risky global rewrites.
5. If stable and feasible, add an **admin-only demo** JSON export/import utility with schema version, validation, confirmation and rollback. EXCLUDE credentials, password salts/hashes, sessions, setup keys and tokens; treat imported content as untrusted. If scope/risk too great, record backup as optional deferred work instead of weakening existing functionality.
6. Label checkout/status/admin statistics as simulation where users might mistake them for real transactions.
7. Check previous functionality again after UI changes.

**Completion checks:** usable responsive layouts, accessibility basics, no regression; demo backup either tested or explicitly deferred; progress log updated.

**End question:** Part complete. Do you want me to continue to Part 08? (yes/no)

---

## PART 08 — Final testing, documentation and handoff

**Goal:** Verify the whole site, document its limits, and prepare a clean presentation-ready deliverable.

**Relevant files:** `tests/*`, `README.md`, `docs/implementation-progress.md`, all functionality as needed for targeted bug fixes.

**Do only this:**

1. Run full automated checks and documented manual checks for visitor, customer A, customer B, sole admin, account isolation, cart, checkout, order status, product/shop edits and sign out.
2. Re-test against both fresh browser data and existing/migrated demo data; do NOT purge real current demo data without user authorization.
3. Fix P0/P1 blocking bugs revealed by tests, and track P2 optional polish as backlog. Re-run related tests after each fix.
4. Update README with requirements, serving via local HTTP, test commands, admin setup explanation without secret, demo workflows, localStorage/origin behavior, storage reset warning, no backend/security limitations, and what is explicitly not supported.
5. Package only source needed for handoff. Exclude `.git`, `node_modules`, secret material and local data dumps. Confirm the project can launch from a different directory; if possible, test on another clean browser/profile.
6. Final summary must distinguish tested and untested flows, include changed files and unresolved limitations; no claims of production-grade security.

**Completion checks:** all critical user journeys demonstrably work in one browser origin, docs accurate, project ready for classroom demo.

**End question:** Part 08 complete. All planned parts are finished. Would you like a separate optional enhancements plan? (yes/no)

---

## Mandatory stop instruction (repeat to OpenCode if needed)

```text
STOP HERE. Do not start, prepare edits for, or execute the next part. Ask me explicitly whether to proceed to the next numbered part. My approval applies to one part only.
```

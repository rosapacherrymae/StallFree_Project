# StallFree single-folder merge — review build

This archive contains **one** project root (no nested `StallFree_Project/` folder). It was assembled from the user-provided `StallFree_Review.zip`.

## File choices

- Kept from **outer project**: all HTML pages, `asset/`, `js/main.js`, `js/data.js`, `js/ui.js`, and `.gitignore`.
- Kept from **inner project**: `js/admin.js`, `js/auth.js`, `js/storage.js`, `css/styles.css`, `tests/` files, `README.md`, `docs/implementation-progress.md`, and `StallFree_OpenCode_Step_by_Step_Plan.md`.
- All original files are still present in the user-created `StallFree_Backup_20261023_203447` backup, assuming the backup was successfully populated.

## Validation completed

- `node --check` succeeded for the seven JavaScript files (six application files and `tests/smoke.js`).
- All local `<script src=...>` paths used by the 12 HTML pages resolve to files in this archive.

## Validation not completed

- Full browser behavior and the jsdom smoke suite have **not** been verified. Offline `npm ci` could not fetch a dependency from cache; local Node was v22.16.0, below some dependency engine requirements. **Run smoke tests on your computer before committing the folder cleanup.**

## Safely apply on Windows

1. Confirm you are inside the outer `C:\Users\maryr\OneDrive\Desktop\StallFree_Project` and `git status` is clean.
2. Keep your separate backup folder. Unzip this merged archive into a **temporary separate directory** (not inside the repository).
3. Copy the contents of the extracted single-folder project over the corresponding files in the outer repo, while **not copying or modifying `.git/`**. Review the changed files with `git diff`.
4. From the root of the outer repository, run `cd tests; npm ci; npm test; cd ..`, then manually verify browsing, login/register, orders, and admin flows in a browser.
5. Once satisfied, delete the **nested folder only**: `git rm -r -- StallFree_Project` (this removes tracked inner files, not the outer repository). Use `git status` to review the staged deletes.
6. Stage the approved merged files (`git add -A` after ensuring no unrelated files have appeared), commit, then push after checking `git status`.

If tests fail, do not commit/push the cleanup; your original repo and external backup remain available. Do not run `git init` in the extracted archive.

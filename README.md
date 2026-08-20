# 🚀 Mavix

**Mavix** is a visual editor (GUI) for JSON localization files. It allows you to manage your project's translations through a convenient web interface directly in your browser, with support for nested structures, search, and Excel integration.

---

## 📦 Installation

There are two ways to install Mavix — pick the one that fits how you plan to use it.

**Local installation (recommended)** — Mavix is added to your project's `devDependencies` and its version is locked in `package-lock.json`. Everyone on the team (and CI) gets the exact same version automatically via `npm install`, and you run it with `npx mavix`. Use this for real projects, especially team ones.

```bash
npm install mavix --save-dev
```

**Global installation** — Mavix is installed once for your whole machine and becomes available everywhere as just `mavix`, without adding it to any project's dependencies. Convenient if you just want to quickly try Mavix or use it across many personal projects, but the version isn't tied to a specific project, so teammates might end up running different versions.

```bash
npm install -g mavix
```

---

## ⚙️ Configuration

Mavix reads a **`mavix.config.json`** file from the root of your project to know where your translation files live. There are two ways to configure it, depending on how your project organizes locales.

### Option 1 — Flat folder (one file per language)

Use this when all your languages live as single files in one folder:

```
locales/
  en.json
  ru.json
  tj.json
```

```json
{
  "localesPath": "./locales"
}
```

* **localesPath**: path to the folder containing your `{lang}.json` files.
* The language code is taken from the file name (`en.json` → `en`).

### Option 2 — Per-language folder with namespace files

Use this when each language has its own folder containing multiple files (namespaces) — a common setup with `i18next`, `next-intl`, and similar libraries:

```
src/i18n/messages/
  en/
    common.json
    auth.json
    employer.json
  ru/
    common.json
    auth.json
    employer.json
  tj/
    common.json
    auth.json
    employer.json
```

```json
{
  "languages": {
    "en": "src/i18n/messages/en",
    "ru": "src/i18n/messages/ru",
    "tj": "src/i18n/messages/tj"
  }
}
```

* **languages**: an explicit map of language code → path. Each path can point to either:
  * a **folder** — Mavix scans it recursively and finds every `.json` file inside, no matter how deep. Each file becomes a "namespace" (shown in Mavix as `namespace:key.path`, e.g. `common:app.title`).
  * a **single file** — used directly as that language's translations (no namespace prefix).
* Folders are scanned on every request, so you don't need to restart Mavix after adding a new namespace file — just make sure the file exists before adding new keys to it, or add the key through Mavix itself and it will be created automatically.
* If a path in `languages` doesn't exist on disk, Mavix logs a warning and skips that language instead of crashing — useful while a translation folder is still being set up.

> ⚠️ **Only one mode is active at a time.** If `languages` is present in the config (and not empty), it takes priority and `localesPath` is ignored. Use `localesPath` only for the simple flat-file setup.

---

## 🚀 Running

After installation and configuration, start Mavix with:

```bash
# If installed locally
npx mavix

# If installed globally
mavix
```

After starting, open your browser and go to: `http://localhost:4500` (or the port shown in the console).

---

## ✨ Features

* **📝 JSON Editing:** Convenient table view for all languages at once.
* **🌳 Dot-Notation Support:** Work with keys like `user.profile.name` — Mavix automatically builds the correct nested structure.
* **📁 Flexible File Layout:** Works with a single flat folder of language files, or per-language folders split into multiple namespace files — pick whichever matches your project.
* **📊 Excel Import/Export:** Export translations for translators and import them back without data loss.
* **🔍 Global Search:** Instantly search across keys and values.
* **🌓 Dark Mode:** Built-in dark theme support.

---

## 🛠 Requirements

* **Node.js**: version 16.x or higher
* **File format**: JSON

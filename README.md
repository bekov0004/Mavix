# 🚀 Mavix

**Mavix** is a visual editor (GUI) for JSON localization files. It allows you to manage your project's translations through a convenient web interface directly in your browser, with support for nested structures, search, and Excel integration.

---

## 📦 Installation

Install the package globally or locally in your project:

```bash
# Local installation (recommended)
npm install mavix --save-dev

# Or global installation
npm install -g mavix
```

---

## ⚙️ Configuration

To use Mavix, you need to create a configuration file named **`mavix.config.json`** in the root of your project. This tells the tool where to find your translation files.

```json
{
  "localesPath": "./src/i18n/locales"
}
```

* **localesPath**: Path to the folder containing your `{lang}.json` files.
* **languages** (optional): List of supported languages.

---

## 🚀 Running

After installation and configuration, start Mavix with:

```bash
# If installed locally
npx mavix

# If installed globally
mavix
```

After starting, open your browser and go to: `http://localhost:3000` (or the port shown in the console).

---

## ✨ Features

* **📝 JSON Editing:** Convenient table view for all languages at once.
* **🌳 Dot-Notation Support:** Work with keys like `user.profile.name` — Mavix automatically builds the correct nested structure.
* **📊 Excel Import/Export:** Export translations for translators and import them back without data loss.
* **🔍 Global Search:** Instantly search across keys and values.
* **🌓 Dark Mode:** Built-in dark theme support.

---

## 🛠 Requirements

* **Node.js**: version 16.x or higher
* **File format**: JSON
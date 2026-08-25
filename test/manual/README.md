# Manual (visual) test fixtures

These are not run by `npm test` — they're ready-made mini projects you start
yourself and check by eye in the browser at `http://localhost:4500/`.

Each folder is a self-contained project with its own `mavix.config.json`,
demonstrating one of the three file layouts Mavix supports.

| Folder | Layout | Config mode |
|---|---|---|
| `case-a-flat/` | one file per language | `localesPath` |
| `case-b-language-folders/` | per-language folder, namespace files inside | `languages` |
| `case-c-namespace-folders/` | per-namespace folder, language files inside | `namespacesPath` |

## Running one

From the repo root:

```bash
npm run manual:a   # case-a-flat
npm run manual:b   # case-b-language-folders
npm run manual:c   # case-c-namespace-folders
```

Then open `http://localhost:4500/` in your browser. Stop with `Ctrl+C` before
starting a different case (they all use the same port).

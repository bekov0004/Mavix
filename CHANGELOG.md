# Changelog

All notable changes to this project are documented in this file.

## [1.2.0]

### Added
- New config mode `namespacesPath`: supports per-namespace folders with one
  file per language inside each (`locales/common/en.json`, `locales/common/ru.json`, ...) —
  the layout `react-i18next` uses by default.
- Automated test suite (`npm test`, Node's built-in test runner) covering
  config loading, file scanning, key flattening/index building, and the
  save/translations API across all three config modes.
- Manual/visual test fixtures under `test/manual/` — three ready-made sample
  projects, one per config mode. Run one with `npm run manual:a` /
  `manual:b` / `manual:c`, or all three at once with `npm run manual:all`
  (serves a landing page linking to each).
- Long translation values now truncate with an ellipsis when not focused,
  and expand vertically to fit their full content when clicked — without
  shifting the table's column widths or nearby rows.

### Fixed
- `mavix` no longer crashes when it can't auto-open a browser (e.g. no
  default browser configured in the environment) — it now logs a message
  and keeps the server running instead of exiting.
- Editing a table cell no longer shifts the row by a few pixels for short
  values (caused by the textarea's default `inline-block` baseline
  alignment) or forces a horizontal scrollbar (Actions column width).

### Changed
- Project layout: `server/` and `gui/` moved under `src/` for a more
  conventional CLI package structure.

## [1.1.0]

- Support per-language folders with namespace files (`languages` config
  mode), alongside the original flat `localesPath` mode.
- Explain local vs global install trade-offs in the README.

## [1.0.0]

- Initial release.

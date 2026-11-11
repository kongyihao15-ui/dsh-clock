# @local/dsh-clock

A complete DSH plugin bundle: the browser half draws a live session clock in the
composer dock, the Host half registers a `local_time` tool that reports the
current wall-clock time in any IANA time zone.

It has no dependencies and no build step — the manifest, the loader patch, the
two entry points, the inventory metadata, and the icon are the whole package.

## Contents

| File | Role |
|---|---|
| `package.json` | Manifest: `dsh.bundle.patch` (Host rows) and `dsh.client` (browser module), plus `exports`/`files` |
| `cordis.patch.yml` | Loader patch that inserts the `dsh-clock` row |
| `index.js` | Host entry: `apply(ctx)` registers the `local_time` tool |
| `client.js` | Browser entry: registers the composer-dock chip through `ctx.slots` |
| `locale/*.json` | `meta.title` / `meta.description` shown in Plugin Manager and Settings, in all eight shipped locales (`en`, `zh`, `ja`, `fr`, `de`, `es`, `pt`, `ru`) |
| `icon.svg` | Inventory icon (original artwork, SVG, well under the 256 KiB limit) |
| `test/host.test.mjs` | Offline checks for the tool and the config fallback |

## Install into a profile

Install by absolute package directory; `plugin_manager` performs the package
installation and bundle selection, so never edit the profile's `package.json`
or `cordis.patch.yml` by hand, and never run `pnpm` in the profile directory.

```jsonc
// plugin_manager
{ "action": "install_bundle", "target": "<absolute path to this directory>" }
```

Changes apply to every session in that profile and survive restart. Replacing an
installed package needs a restart to load a fresh JavaScript module generation;
the first installation can activate through HMR.

## What it does

- **Composer dock chip** — shows `mm:ss` (or `h:mm:ss`) since the page opened.
  Click it to toggle between elapsed time and the local wall clock. Colors come
  from `currentColor`, so the chip follows the active theme. The interval is
  cleared when the component unmounts.
- **`local_time` tool** — the model calls it with an optional `zone`
  (`Asia/Tokyo`, `Europe/Berlin`, …) and gets
  `2026-11-11 23:15:02 GMT+9 (Asia/Tokyo)` back. Omitting `zone` uses the
  `defaultZone` setting when one is set, otherwise the host system zone; an
  unknown id fails as an ordinary tool error.
- **`defaultZone` setting** — declared with schemastery, so it appears as a
  field on this plugin's row in Settings → Plugins. The schema import is probed
  at activation: a bundle linked from outside the profile that cannot resolve
  `@deepseek-ai/schemastery` drops the setting instead of failing to load.

## Tests

```powershell
node test/host.test.mjs    # 10 checks: config fallback, default zone, explicit zone, bad zone, render
```

The test runs in plain Node, where `@deepseek-ai/schemastery` is deliberately
unresolvable, so it also covers the degraded path where `Config` is absent.

## Extend it

- Add a settings field for the chip order: extend `Config` with an `order`
  number, then read it in `client.js` once the client exposes its row config.
- Add a zone picker: keep the chosen zone in component state and call the tool
  logic through a Client service instead of duplicating formatting.
- Add more locales: copy `locale/en.json`, rename it to a registered locale id
  (`ja`, `fr`, `de`, `ru`, `es`, `pt`), and translate the two values.

## Publish it to the plugin ecosystem

This package is published: the repo is
<https://github.com/kongyihao15-ui/dsh-clock> and its market index is served
from <https://kongyihao15-ui.github.io/dsh-clock/index.json>. Add that URL under
Settings → Plugins → Discover to install it elsewhere.

`../build-index.mjs` regenerates `index.json` from this package and its locales;
[`../README.md`](../README.md) documents the commit-then-index order and the
alternative npm source.

## Uninstall

`plugin_manager` with `{ "action": "remove_bundle", "target": "@local/dsh-clock" }`.

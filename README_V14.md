# UBT EMU — V14 Phase 1

V14 refines the approved V10 interface: the approved official logos, navy/burgundy/white palette, sidebar, nine pages, event dashboard, and stable partner IDs/relationships remain. Public partner fixtures are fictional; real imported records stay in a private development dataset outside the repository. This is a development build, not a production authentication system.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open the local server in your browser. First-time visitors see Arabic RTL. English LTR is available from the language button, and the preference persists. Enter a valid email-format address and choose a **demonstration** role. No email is sent or authenticated.

The root `index.html` and historical `UBT_EMU_V10_Roles_Branding/index.html` entry point use the same shared application files. Keep `data.js`, `app.js`, and `styles.css` alongside the root entry point; this application no longer consists of one self-contained HTML file. No build or package installation is needed to run it.

## Review

- Development branch: `develop-v14` (local; not pushed).
- [Partner model and private/public data boundary](docs/PARTNER_DATA_MODEL.md).
- [Overall implementation status](docs/V14_STATUS.md).
- [Preview without changing the live website](docs/PREVIEW.md).
- [Changes, validation and limitations](docs/V14_PHASE1.md).
- [Approved EMU branding update](docs/EMU_BRANDING.md).
- [Screenshot gallery](docs/SCREENSHOTS.md).
- No deployment workflow was added; this work does not publish or merge anything.

## Browser regression tests

Python and a Chromium browser are required. Install the test dependency only if it is not already provided:

```sh
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install -r requirements-dev.txt
# With a system Chromium binary:
CHROMIUM_PATH=/usr/bin/chromium python3 -m unittest discover -s tests -v
```

Alternatively, install Playwright's Chromium with `python3 -m playwright install chromium` and set `CHROMIUM_PATH` to its executable. The cloud development environment already provides Python Playwright and `/usr/bin/chromium`; these were used for verification.

The test suite starts its own HTTP server on a free loopback port and uses fresh browser contexts. It does not alter your normal browser records. Screenshot generation is opt-in:

```sh
CAPTURE_SCREENSHOTS=1 python3 -m unittest discover -s tests -v
```

No network service or AI key is required. Chromium is launched with `--no-sandbox` for this isolated cloud environment; use a suitably isolated environment when running browser automation.

## Data and recovery

Existing `emuV5` records and `emuLang` preferences are reused. The original V10 seed is retained verbatim in `data.js`; new requests acquire a persistent event link during conversion. Previous V10 conversions did not store a link and cannot reliably be inferred retrospectively.

Corrupt or structurally invalid stored data is left untouched. A visible recovery notice offers an export of the original, retry, or explicit confirmed replacement with current session records. When storage cannot be written, changes remain temporary and are reported as such. A stale tab is blocked from overwriting newer persisted records; use Retry reading to reload them. This is a browser safeguard, not a substitute for database transactions or multi-user synchronization.

The university calendar uses the current date in `Asia/Riyadh`, with a Monday–Sunday reporting week and Gregorian locale-aware display. Calendar columns run Sunday–Saturday. Official event and partner names remain as supplied; optional translations are never machine-generated.

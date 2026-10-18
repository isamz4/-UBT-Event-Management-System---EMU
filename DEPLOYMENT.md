# EMU V15 — complete GitHub Pages package

This is a standalone static deployment package based on V15 commit `6cf5de718030de4d5ab77fd9cb1091b5a6e77fec`. It includes every runtime dependency. No build, npm install, CDN, API key or Git history is needed. The historical source repository was not modified.

## Why a blank screen occurs

`index.html` requires two stylesheets, twelve scripts, four image assets and the approved public partner catalog. Missing scripts prevent application initialization. The original script paths already include their folders; uploading just `index.html`, uploading the ZIP itself, flattening the folders or placing everything inside an extra wrapper directory will cause 404s.

The deployment copy adds a relative favicon and makes approved `/assets/...` public image links resolve within the current project repository. All official logo bytes are unchanged. All other runtime files match the source commit.

## Exact folder structure

```text
(repository root — index.html must be here)
├── .nojekyll
├── index.html
├── styles.css
├── app.js
├── data.js
├── ubt-logo.png
├── login-campus-bg.png
├── assets/
│   ├── branding/
│   │   ├── EMU Logo BLUE.png
│   │   └── EMU Logo.png
│   └── data/
│       └── partners-public.json
├── vendor/
│   ├── README.md
│   ├── qrcode/
│   │   └── qrcode.js
│   └── xlsx/
│       ├── xlsx.full.min.js
│       └── LICENSE
├── v15/
│   ├── styles.css
│   ├── models.js
│   ├── services.js
│   ├── ui.js
│   ├── wizard.js
│   ├── modules.js
│   ├── access.js
│   ├── calendar.js
│   └── bootstrap.js
├── DEPLOYMENT.md
├── ASSET_MANIFEST.json
├── VALIDATION_REPORT.json
└── SHA256SUMS.txt
```

The ZIP contains these files directly, with no extra top-level folder. Keep capitalization, spaces in logo filenames and directory names exactly as supplied. Do not move library or V15 files to the root. The manifest inventories direct HTML dependencies, CSS images and dynamically rendered logos; it includes file hashes. The public JSON is retained for the public catalog interface and validation, while `data.js` supplies the initial catalog automatically.

## Manual upload — NEW repository only

1. Extract the ZIP on your computer. Confirm `index.html`, `v15`, `vendor` and `assets` are side by side.
2. Open **isamz4/UBT-Event-Management-System-V15**, the intended NEW repository. Do not edit or upload to `isamz4/-UBT-Event-Management-System`.
3. On the branch intended for Pages (for example `main`), choose **Add file → Upload files**.
4. Drag the extracted files and the complete `assets`, `vendor` and `v15` directories into the upload area. Do not upload the ZIP or an enclosing `EMU-V15` folder. Confirm preview paths include `vendor/qrcode/qrcode.js`, `vendor/xlsx/xlsx.full.min.js` and `v15/bootstrap.js`.
5. Include `.nojekyll`. If your file browser hides it, use **Add file → Create new file**, name it `.nojekyll`, leave it empty, and commit it separately.
6. Commit the uploaded files. These are manual actions for you; this package has not been pushed or deployed automatically.
7. In the NEW repository only, go to **Settings → Pages → Build and deployment**. Select **Deploy from a branch**, select the uploaded branch, select **/(root)** and save. If a pre-existing custom workflow is selected, switch to this branch source or ensure that workflow publishes this exact package root.
8. Wait for the Pages build to succeed. For the specified repository name, the expected URL is:
   `https://isamz4.github.io/UBT-Event-Management-System-V15/`
   This is the expected URL after your upload, not a claim of a live verified deployment.
9. Open that URL with its trailing slash in a private/incognito window. Hard refresh if an older deployment was cached.

## Verify the uploaded paths

These URLs must return actual CSS or JavaScript (HTTP 200), not a 404 page:

- `https://isamz4.github.io/UBT-Event-Management-System-V15/styles.css`
- `https://isamz4.github.io/UBT-Event-Management-System-V15/v15/styles.css`
- `https://isamz4.github.io/UBT-Event-Management-System-V15/vendor/qrcode/qrcode.js`
- `https://isamz4.github.io/UBT-Event-Management-System-V15/vendor/xlsx/xlsx.full.min.js`
- `https://isamz4.github.io/UBT-Event-Management-System-V15/v15/bootstrap.js`

In Chrome DevTools → Network, enable Disable cache and reload. Check all scripts, styles and images for 200 responses. If any are missing, check the actual branch and folder selected in Pages, exact filename case, and whether an extra wrapper directory was uploaded. Do not fix missing subfolders by removing their names from `index.html`.

## Local subdirectory preview

To reproduce the Pages path without touching GitHub:

1. Create a folder `preview/UBT-Event-Management-System-V15/`.
2. Put the extracted ZIP contents in that inner folder.
3. From `preview/`, run `python3 -m http.server 8015 --bind 127.0.0.1`.
4. Open `http://127.0.0.1:8015/UBT-Event-Management-System-V15/`.

Arabic RTL is the default. English can be selected from the header. Choose a role on the demo login form; its matching sanitized email fills automatically. The Director identity is `director@example.invalid`; the requester is `requester@example.invalid`. Existing requester, department, staff, viewer and technical-admin permissions remain unchanged.

Approved events do not appear on the published calendar until separate publication approval is recorded. An empty published calendar in a clean browser is expected. The 20 approved public partner records load automatically; reserved partner ID 12 has no approved public name. No private contacts are bundled.

This is a frontend prototype: identities, role checks and approvals are simulated locally. Availability and events are not synchronized between devices, and QR registration requires matching local demo data. Production authentication, private data protection and authoritative reservation enforcement require the university backend. Never place private imports, credentials, `.env` files, Git folders or old repository archives inside this deployment package.

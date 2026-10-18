# UBT EMU — V15 Complete Frontend Edition

An Arabic-first, bilingual, responsive frontend for university event management, built on the approved V14 identity. **No production backend is included.** All 16 modules have local interactive workflows; authentication, identity, institutional approvals and external delivery are explicitly simulated.

## Preview

Extract the V15 ZIP and run from its project folder:

```sh
python3 -m http.server 8015 --bind 127.0.0.1
```

Enter `http://127.0.0.1:8015` in a browser on the same computer. No build, npm install, API key or Internet connection is required. Use a valid email-format address (for example `admin@example.invalid`) and a demo role. Arabic is the default; switch to English from the header. Stop the server with Ctrl+C.

The checked-in source automatically loads 20 approved real partner names and public descriptions, with reserved ID 12 retained for relationships. No private partner contacts are bundled. See [public/private field mapping](docs/v15/PUBLIC_PARTNERS.md). V15 uses the independent localStorage key `emuV15` and IndexedDB database `emu-v15-files`; it does not modify V14's `emuV5` records. Attachments remain in this browser. Do not place private files under the public server root.

## University calendar update

[Published calendar, requester landing, availability and screenshots](docs/v15/UNIVERSITY_CALENDAR.md). Publication remains a separate approval; clean demos do not automatically publish seeded events.

## Director presentation and review

- [Arabic presentation walkthrough](docs/v15/PRESENTATION_AR.md)
- [Feature completion matrix](docs/v15/FEATURE_MATRIX.md)
- [Screenshots](docs/v15/SCREENSHOTS.md)
- [Test results and limitations](docs/v15/QA.md)
- [Applications Department handoff](docs/v15/HANDOFF.md)
- [Data models](docs/v15/DATA_MODELS.md)
- [API contracts](docs/v15/API_CONTRACTS.md)
- [GitHub update instructions — not executed](docs/v15/GITHUB_UPDATE.md)

The fastest demonstration starts with **Event Requests → New request → Fill a sanitized demo request**. Review the 14 steps, acknowledge regulations and submit. Sign in as EMU Director to record review and approval. Continue through the central event workspace. Nothing is approved automatically.

## Source organization

- `data.js`: approved public partner catalog and sanitized V14-compatible scenario; original calendar names/dates and stable partner IDs retained.
- `app.js`, `styles.css`: reused V14 visual components, accessibility, storage recovery and partner model.
- `v15/models.js`: V15 schema defaults, collections and connected sanitized scenario.
- `v15/services.js`: centralized mock workflow, validation, transactions and audit operations.
- `v15/ui.js`: bilingual components, data tables, forms, downloads and event bindings.
- `v15/wizard.js`: 14-step request wizard and repeating sections, local attachments and Excel names import.
- `v15/modules.js`: all module interfaces and central event workspace.
- `v15/bootstrap.js`: version bindings, role-aware navigation, persistence boundaries and promise-based integration facade.
- `vendor/`: locally served, pinned QR and spreadsheet dependencies with licensing information.

## Tests

The cloud workspace already has Python Playwright and `/usr/bin/chromium`. Elsewhere install the development dependency from `requirements-dev.txt` and provide Chromium. These dependencies are not needed to run the application itself.

```sh
CAPTURE_SCREENSHOTS=1 python3 -m unittest discover -s tests -p 'test_v15.py' -v
```

The tests use an isolated local server and disposable browser contexts. V14's historical suite is retained and skipped on the V15 entry point; run it from `develop-v14` to test V14. Use the V15 command above for the current release.

## Privacy and boundaries

Private partner contacts and the original CSV remain outside this repository; only the four explicitly approved public columns are bundled. The local CSV importer shows a preview and requires explicit confirmation; it never modifies source assets. Relationship status, sponsorship status, previous participation and contact person remain independent. Production authentication, shared storage, audit immutability, real identity verification, notifications and public QR URLs belong to the university backend integration.

Work is isolated on `develop-v15`. V14 remains on `develop-v14`. No branch has been merged or deployed by this work.

Review evidence: [QA coverage](docs/v15/QA.md) · [Screenshot gallery](docs/v15/SCREENSHOTS.md).

Mandatory acceptance: [Director requirements and status](docs/v15/DIRECTOR_REQUIREMENTS.md).

Final presentation: [private partner data loading](docs/v15/PRIVATE_PARTNERS.md) · [QR functionality and phone testing](docs/v15/QR_VERIFICATION.md).

Role access: [six-role permissions matrix](docs/v15/PERMISSIONS_MATRIX.md) · [security handoff](docs/v15/RBAC_SECURITY_HANDOFF.md). Use the header **Role Preview / معاينة الصلاحيات** to switch the seven sanitized identities. Default Director account: `director@example.invalid`.

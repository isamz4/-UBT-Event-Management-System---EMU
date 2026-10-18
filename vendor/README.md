# Locally served third-party frontend dependencies

No CDN or runtime Internet access is required.

| Library | Version | Source package | Use |
| --- | --- | --- | --- |
| qrcode-generator | 1.4.4 | npm `qrcode-generator@1.4.4` | Standards-based event registration QR SVG generation |
| SheetJS distribution | 0.20.3 | npm `@e965/xlsx@0.20.3` | Excel/CSV certificate import and XLSX exports |

Packages were retrieved with normal npm TLS/integrity verification. Original library files are retained. QR library copyright/license notice is in `qrcode/qrcode.js`; spreadsheet license is in `xlsx/LICENSE`. Review dependency updates and institutional security policy before production integration.

Neither library provides a backend, authentication, AI connection or contact database.

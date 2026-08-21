# My Expenses - Extended Insights

A small collection of static, browser-only tools around the
[My Expenses](https://github.com/mtotschnig/MyExpenses) Android app. There is no
build step and no backend: every page is plain HTML with ES modules, styled with
Tailwind from a CDN, and all data stays in the browser.

## Project structure

```
public_www/
├── index.html              Dashboard - lists the tools from tools.json
├── tools.json              Tool cards shown on the dashboard
├── assets/js/              Shared by every page
│   ├── dom.js              escapeHtml
│   ├── i18n.js             Supported languages, locales, tiny translator
│   └── preferences.js      Theme + language: read, persist, apply
├── insights/               Insights tool (ES modules under insights/js)
├── statement-parser/       Bank statement parser (single page)
└── differ/                 Transaction differ (single page)
```

Theme and language are stored under the `theme` and `language` keys in
`localStorage`, so a choice made in one tool applies to all of them. German,
English and Japanese are supported; the default follows the browser.

## Tools

### Dashboard (`public_www/index.html`)

The entry point. It renders one card per entry in `public_www/tools.json`, so a
new tool only needs a folder and an entry there:

```json
[
  { "name": "Insights", "emoji": "📊", "path": "insights" }
]
```

### Insights (`/insights`)

Visualises a CSV export from My Expenses: dashboard totals, expenses per
category, a timeline, a year-over-year comparison and a searchable transaction
list. Filters for year, month, currency and categories apply across all views.

Foreign-currency transactions are converted through the exchange-rate API
configured in `insights/js/config.js`. The header shows whether that API is
reachable, and a banner reports how many transactions could not be converted for
lack of a rate. The API key in that file is delivered to the browser and is
therefore public - it guards a read-only endpoint and is not a secret.

The code is split into a small store (`js/store`), services (`js/services`) and
renderers (`js/ui`). The store owns the derived data sets - converted, filtered
by period, filtered by category - and notifies the renderers.

#### CSV import settings

Export from the app with these settings so the parser recognises the columns.

**Settings** (`My Expenses > Settings > Import / Export > Export to CSV`)
-   [x] Use separate columns for each level of category hierarchy
-   [x] Use separate columns for income and expenses
-   [x] Use separate columns for date and time
-   [ ] Original amount / Equivalent Amount

**Export** (`My Expenses > Export`)
-   **Data format**: CSV
-   **Delimiter**: `,` (comma)
-   **Date format**: `dd.MM.yy`
-   **Time format**: `HH:mm`
-   **Decimal separator**: `.` (dot)
-   **Character encoding**: UTF-8

The parser needs a date column plus either an amount column or an
income/expense pair; it reports what is missing if a file does not have them.

### Statement Parser (`/statement-parser`)

Extracts transactions from a bank statement. PDF statements from Triodos Bank
and Hanseatic Bank are recognised, as are PayPay CSV exports. PDFs are read in
the browser with pdf.js.

### Differ (`/differ`)

Compares a My Expenses CSV against one or more PayPay statement CSVs and reports
matches, amount mismatches, bookings only in the app and bookings missing from
it. Points spent are reconciled separately so the effective balance can be
compared with the app balance.

## Local development

Any static file server works; ES modules cannot be loaded over `file://`.

```sh
npx http-server public_www -p 8080
```

## Deployment

Deployment is an `rsync` over SSH, driven by `deploy.sh`.

### Prerequisites

* **Windows**: use the **Windows Subsystem for Linux (WSL)**.
    1.  In **PowerShell as Administrator**: `wsl --install`
    2.  Restart, then in the **Ubuntu** terminal:
        `sudo apt update && sudo apt install rsync dos2unix`
* **Linux (Debian/Ubuntu)**: `sudo apt update && sudo apt install rsync`
* **macOS**: `rsync` is pre-installed.

### One-time setup

1.  Create an SSH key if you do not have one:
    ```sh
    ssh-keygen -t rsa -b 4096
    ```
2.  Copy it to the server for passwordless login:
    ```sh
    ssh-copy-id -p [YOUR_SFTP_PORT] [YOUR_SFTP_USER]@[YOUR_SFTP_HOST]
    ```

### Configuration

Create `deploy.env` in the project root. It is gitignored and must never be
committed.

```env
# --- SFTP Server Configuration ---
LOCAL_SOURCE_PATH="public_www"
SFTP_USER="your_username"
SFTP_HOST="your_sftp_host"
SFTP_PORT="22"
SFTP_REMOTE_PATH="/path/to/your/remote/directory"
```

### Running it

```sh
# Windows (WSL) only: normalise line endings first
dos2unix deploy.sh deploy.env

chmod +x deploy.sh
./deploy.sh
```

`deploy.bat` runs the same script from Windows through WSL.

Note that `rsync --delete` mirrors `public_www/` onto the remote path: anything
there that is not in the local folder is removed.

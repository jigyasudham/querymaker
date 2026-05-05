# Query Maker

A self-hosted, visual SQL query builder with a React frontend and Python Flask backend. Build complex SQL queries through a point-and-click GUI, save them, and optionally automate submitting them to a web portal and downloading results — no manual SQL typing required.

---

## What It Does

Query Maker lets you construct full SQL SELECT statements visually:

- Pick a schema and table from a loaded schema definition
- Choose columns, add aliases, reorder them via drag-and-drop
- Stack clauses (WHERE, JOIN, GROUP BY, HAVING, ORDER BY) through form inputs
- Add SQL functions (aggregate, window, string, math, date, conditional) via a browsable function picker
- Build CTEs (Common Table Expressions) and subqueries through dedicated nested builders
- Preview and copy the generated SQL at any time
- Save queries to a personal library and search/filter them later
- Automatically submit a query to a web data portal via browser automation, wait for it to process, and download the result as a CSV

---

## Architecture

```
Query Maker
├── SRC/                        # React frontend (Vite + Tailwind)
│   ├── main.jsx / App.jsx      # Entry point, routing between login / builder / admin
│   ├── Components/
│   │   ├── SchemaPanel.jsx     # Core query builder (~2500 lines), orchestrates everything
│   │   ├── QueryBuilder.jsx    # Renders clause editors (WHERE, JOIN, GROUP BY, etc.)
│   │   ├── CTEBuilder.jsx      # Nested CTE query builder
│   │   ├── SubqueryBuilder.jsx # WHERE IN subquery builder
│   │   ├── ColumnSelector.jsx  # Column picker with alias support
│   │   ├── AutomationPanel.jsx # Portal automation UI ("The Robot")
│   │   ├── AdminDashboard.jsx  # Admin-only: user management, batch automation
│   │   ├── LoginPage.jsx       # Login with user_access.json upload
│   │   └── ...                 # History, templates, help, modals, icons, etc.
│   └── Services/
│       ├── PythonAPI.js        # All HTTP calls to the Flask backend
│       ├── AuthService.js      # Client-side PBKDF2 password hashing
│       ├── ClauseDefinitions.js# SQL clause and function catalog
│       ├── DataService.js      # CSV parsing helpers
│       ├── StateManager.js     # localStorage persistence (30-min expiry)
│       └── QueryValidator.js   # Client-side SQL validation rules
├── Server.py                   # Flask backend — auth, storage, automation APIs
├── portal_automation.py        # Selenium robot that interacts with the data portal
└── data/                       # Per-user query files (auto-created)
    └── <email>_my_queries.json
    └── <email>_recent.json
    └── batch_history.json
```

---

## Setup & Running

### Prerequisites

- Node.js 18+
- Python 3.10+
- Chrome browser (for automation feature)

### Install dependencies

```bash
# Frontend
npm install

# Backend
pip install flask flask-cors selenium webdriver-manager
```

### Run (development)

```bash
# Terminal 1 — Python backend (required)
python Server.py

# Terminal 2 — Frontend dev server
npm run dev
```

The backend starts at `http://localhost:5000` and auto-opens a browser tab.

### Build for production / desktop use

```bash
npm run build        # Builds React into dist/
python Server.py     # Serves dist/ as static files on port 5000
```

The app can also be packaged as a standalone `.exe` via PyInstaller using the included `QueryMaker.spec`.

---

## Authentication & User Access File

The app has no hard-coded user database. Instead, it loads a `user_access.json` file at login time. This file defines who can log in, what schemas they can see, and what portals are available.

### user_access.json structure

```json
{
  "users": [
    {
      "email": "user@example.com",
      "name": "Jane Smith",
      "role": "user",
      "passwordHash": "<pbkdf2-hash>",
      "allowedSchemas": ["sales", "hr"],
      "portals": [
        {
          "id": "portal1",
          "name": "Data Warehouse",
          "url": "http://your-portal/login",
          "automationType": "type1"
        }
      ]
    },
    {
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin",
      "passwordHash": "<pbkdf2-hash>",
      "allowedSchemas": ["*"]
    }
  ],
  "schemaData": {
    "sales": {
      "orders": ["id", "customer_id", "amount", "date"],
      "customers": ["id", "name", "email", "region"]
    },
    "hr": {
      "employees": ["id", "name", "department", "salary"]
    }
  }
}
```

### Generating a password hash

Open the browser console on the login page and run:

```javascript
import('/SRC/Services/AuthService.js').then(m => m.AuthService.hashPassword('yourpassword').then(console.log))
```

Or use the Admin Dashboard's built-in "Change Password" feature which hashes and stores it automatically.

### Schema data sources

Schema data (`schemaData`) can come from two places:

1. **Embedded in user_access.json** — directly inline the schema tree
2. **CSV upload** — upload one or more CSVs with columns `schema, table, column`; the server parses them and returns the schema tree. Multiple CSVs can be combined in one step via the Admin Dashboard.

---

## Query Builder Features

### Clause Types

| Clause | Skill Level | What It Does |
|--------|-------------|--------------|
| WHERE | Beginner | Filter rows by conditions (=, !=, >, <, LIKE, IN, IS NULL, BETWEEN, etc.) |
| ORDER BY | Beginner | Sort results by one or more columns (ASC/DESC) |
| JOIN | Intermediate | INNER, LEFT, RIGHT, FULL OUTER, CROSS JOIN — auto-assigns aliases (t2, t3, …) |
| GROUP BY | Intermediate | Group rows for aggregate calculations |
| FUNCTION | Intermediate | Apply SQL functions to columns (see Functions section) |
| HAVING | Advanced | Filter groups after GROUP BY |

### SQL Functions

All functions are available through the Function Browser panel:

**String:** UPPER, LOWER, CONCAT, SUBSTRING

**Aggregate:** COUNT, SUM, AVG, STRING_AGG

**Date/Time:** CURRENT_DATE, NOW, EXTRACT, DATE_FORMAT, DATEDIFF, DATE_ADD, DATE_SUB, YEAR, MONTH, DAY

**Window:** ROW_NUMBER, RANK, DENSE_RANK, LEAD, LAG — with PARTITION BY and ORDER BY support

**Math:** ROUND, CEILING, FLOOR, ABS, POWER, SQRT

**Conditional:** CASE WHEN, IF, COALESCE, NULLIF, IFNULL

**Type Conversion:** CAST, CONVERT

### Advanced Query Constructs

**CTEs (Common Table Expressions):** The CTE Builder opens a full nested query builder where you define named subqueries. Each CTE supports all the same clauses as the main query. Multiple CTEs are supported.

**Subqueries:** The Subquery Builder constructs `WHERE column IN (SELECT ...)` clauses through a nested query interface.

**DISTINCT:** Toggle to add `SELECT DISTINCT` to the generated SQL.

**Column Aliases:** Each selected column can have an alias (rendered as `column AS alias`).

**Column Reordering:** Columns can be dragged and dropped to change their order in the SELECT list.

**Table Alias:** The main table always uses alias `t1`. JOINed tables get `t2`, `t3`, etc., assigned by the `getNextAlias` helper (never by array length, to avoid duplicates when joins are removed).

**LIMIT:** Optional row limit appended to the query.

---

## Query Management

### Saving Queries

- **My Queries:** Explicitly saved named queries, stored per user in `data/<email>_my_queries.json`
- **Recent Queries:** Last 50 auto-saved queries, stored in `data/<email>_recent.json`
- **Paste Custom Query:** Paste raw SQL and save it under a name (bypasses the builder)

### History & Search

The Enhanced Query History panel shows saved and recent queries with:
- Full-text search across query names and SQL
- Filter by date range, favorite status, tags
- Mark queries as favorites
- Add custom tags
- Re-run a query (loads it back into the builder)
- Delete individual queries
- Edit query name and SQL

### Templates

Pre-built query templates for common patterns (e.g., basic SELECT, aggregation with GROUP BY, CTEs). Selecting a template populates the builder state.

### Export / Import

Export all saved queries to a JSON backup file. Import from a backup with options to merge (skip duplicates by SQL content) or replace.

### Smart Column Suggestions

Analyzes your query history to suggest columns you commonly select together. Suggestions appear when you pick a table and are based on frequency patterns in past queries.

---

## Automation Panel ("The Robot")

The Automation Panel automates submitting a query to a web data portal and downloading the result. It uses Selenium to control a Chrome browser window.

### How it works

1. You build or paste a SQL query in the builder
2. Open the Automation Panel, enter your portal credentials and a request title
3. Click **Run Automation**
4. The backend launches Chrome, logs in to the portal, fills in the form, submits the query, monitors its status, and downloads the result CSV when it completes
5. The downloaded file appears as a link you can click to save locally

### What the Selenium robot does (portal_automation.py)

The `PortalRobot` class implements a workflow generator:

- `start_browser()` — launches Chrome with ChromeDriverManager, sets download directory
- `login(username, password)` — navigates to the portal URL, fills username/password fields, clicks submit, waits for the dashboard to load
- `submit_query(title, sql)` — clicks the configured "new request" link, fills the title field, selects the download/export request type, pastes the SQL into the query textarea, submits the form
- `wait_and_download(max_wait_minutes)` — polls the page for status (SUCCEEDED/FAILED/RUNNING), clicks the Download link when ready, waits for the file to appear in the downloads folder
- Error handling: detects portal error messages (CSS selectors for alert/card-panel elements), recovers from 404 pages, supports hard timeouts, extracts human-readable error text from the page

The robot yields status objects (`{status, step, progress}`) back to the Flask server, which stores them in memory and serves them to the frontend via polling.

### Cancellation

Any running automation (single or batch) can be cancelled mid-flight via a `CancellationToken`. The cancel button sends a POST to `/api/cancel-automation/<session_id>`, which sets the token and causes the robot to quit the browser and stop.

### Batch Automation (Admin only)

Admins can run multiple SQL queries against the portal sequentially in a batch:

- Provide a list of queries, portal credentials, a folder name, and a per-query timeout
- Each query runs as a separate full workflow (login → submit → download)
- Results are saved to a batch-specific subfolder under `downloads/`
- Batch history (last 100 batches) is saved to `data/batch_history.json`
- Failed queries can be retried individually from the batch history view
- Real-time progress shown per query and overall

---

## Admin Dashboard

Accessible to users with `role: "admin"` in the user file.

### Features

- **Upload user_access.json** — replace the current user/schema configuration live
- **Upload schema CSV(s)** — upload one or multiple CSVs to update the schema tree
- **User management** — view all users, change passwords (hashes via PBKDF2), delete users
- **Add new users** — create new user entries (hashed password generated client-side)
- **Batch automation** — run multiple queries in batch with folder naming and per-query timeout control
- **Batch history** — view past batch runs, inspect per-query success/failure, retry failed queries, download result files
- **Export/Import queries** — backup and restore all saved queries
- **Theme toggle** — dark/light mode (persisted in localStorage)

---

## Backend API Reference

All endpoints are under `http://localhost:5000/api/`.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/upload-user-file` | Load user_access.json into server memory |
| POST | `/api/verify-login` | Authenticate a user (rate-limited: 5 attempts/60s) |
| POST | `/api/upload-schema-csv` | Parse a single schema CSV |
| POST | `/api/combine-schema-csvs` | Parse and merge multiple schema CSVs |
| POST | `/api/save-query` | Append a query to a user's saved/recent list |
| GET  | `/api/load-queries` | Load a user's saved or recent queries |
| POST | `/api/update-queries` | Replace a user's entire query list |
| POST | `/api/delete-query` | Delete one query by ID |
| POST | `/api/import-queries` | Import queries from a backup (merge or replace) |
| POST | `/api/export-queries` | Retrieve queries for export |
| POST | `/api/run-automation` | Start a single portal automation session |
| GET  | `/api/automation-status/<id>` | Poll automation progress |
| POST | `/api/cancel-automation/<id>` | Cancel a running automation |
| POST | `/api/run-batch-automation` | Start a batch of automation queries |
| GET  | `/api/batch-status/<id>` | Poll batch progress |
| POST | `/api/cancel-batch/<id>` | Cancel an entire batch |
| POST | `/api/cancel-batch-query/<id>/<idx>` | Cancel a specific query in a batch |
| POST | `/api/retry-failed-batch` | Retry failed queries from a completed batch |
| GET  | `/api/batch-history` | Get all saved batch history |
| GET  | `/api/batch-details/<id>` | Get detailed results for one batch |
| POST | `/api/download-file` | Download a result file by path |
| GET  | `/api/download/<filename>` | Direct download from downloads/ folder |
| GET  | `/api/health` | Health check |

---

## Security

- Passwords are hashed with PBKDF2-SHA256 (100,000 iterations) both client-side (Web Crypto API) and server-side (Python hashlib) — they match, so the hash can be stored in user_access.json
- Login attempts are rate-limited to 5 per 60 seconds per IP
- Security events (login success/failure, rate limits) are logged to `security_events.log`
- Standard security headers set on all responses: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`
- Query files are namespaced per user email (sanitized for filesystem safety)
- localStorage keys are user-scoped to prevent data leakage between users on the same browser

---

## State Persistence

- **Query builder state** is saved to localStorage via `StateManager` with a 30-minute expiry
- **User session** is kept in React state (no server-side sessions)
- **Saved queries** persist on the server in `data/` JSON files
- **Automation credentials** can optionally be saved to localStorage (username always, password only if "Remember password" is checked — shown with a warning)

---

## Data Directory Layout

```
data/
├── batch_history.json              # Last 100 batch automation runs
├── <email>_my_queries.json         # User's explicitly saved queries
└── <email>_recent.json             # User's last 50 auto-saved queries

downloads/
└── <batch_folder>/                 # CSV files downloaded during batch automation
    └── *.csv
```

---

## Adapting the Automation to Your Portal

The `portal_automation.py` file contains placeholder selectors (e.g. `"YOUR_USERNAME_INPUT_XPATH"`, `"YOUR_DOWNLOAD_LINK_TEXT"`) that must be replaced with selectors matching your portal's HTML. To adapt it:

1. Replace the `YOUR_*` placeholder strings in `login()` and `submit_query()` with XPath/CSS/ID selectors that match your portal's login form and request form
2. Replace the `YOUR_*_LINK_TEXT` placeholders in `wait_and_download()` and `handle_404_error_page()` with the exact link labels your portal uses for Download, Refresh, and Dashboard navigation
3. Update the success/status detection strings in `wait_and_download()` (`"SUCCEEDED"`, `"FAILED"`, `"RUNNING"`, `"Request posted successfully"`) if your portal uses different wording
4. Update the error detection keywords in `_extract_portal_error()` if your portal uses different error phrasing
5. The `portal_url` is passed dynamically from the user_access.json `portals[].url` field — no hard-coding needed

---

## Keyboard Shortcuts

Shortcuts are defined in `SRC/Hooks/useKeyboardShortcuts.js` and displayed in the ShortcutHelper overlay. The exact bindings can be found in that file.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Virtual lists | react-window |
| Backend | Python Flask |
| Browser automation | Selenium + webdriver-manager |
| Packaging | PyInstaller |

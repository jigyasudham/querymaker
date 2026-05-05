# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Query Maker is a visual SQL query builder application with a React frontend and Python Flask backend. It allows users to construct SQL queries through a GUI without writing raw SQL, with features like JOIN management, CTEs, subqueries, and smart column suggestions.

## Development Commands

```bash
# Start frontend dev server (Vite)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview --port 4173

# Start Python backend server (required for full functionality)
python Server.py
```

The backend runs on `http://localhost:5000` and serves the API. The frontend dev server runs on Vite's default port.

## Architecture

### Frontend (React + Vite + Tailwind)

**Entry Point:** `SRC/main.jsx` → `SRC/App.jsx`

**Core Components:**
- `SchemaPanel.jsx` - Main query builder component (~2500 lines). Manages query state, SQL generation, and coordinates all sub-components
- `QueryBuilder.jsx` - Renders clause editors (WHERE, JOIN, GROUP BY, etc.)
- `CTEBuilder.jsx` - Common Table Expression builder with its own query state
- `SubqueryBuilder.jsx` - Subquery construction for WHERE IN clauses
- `ColumnSelector.jsx` - Column selection with alias support
- `SmartColumnSuggestions.jsx` - AI-like suggestions based on query history patterns

**Services:**
- `PythonAPI.js` - All backend API calls (`http://localhost:5000/api/*`)
- `StateManager.js` - localStorage state persistence with 30-minute expiry
- `ClauseDefinitions.js` - SQL clause and function definitions with user level restrictions
- `AuthService.js` - Client-side auth with PBKDF2 password hashing

### Backend (Python Flask)

**Entry Point:** `Server.py`

**Key Features:**
- User authentication (verifies against `user_access.json`)
- Schema file uploads (CSV processing)
- Query storage per user (saved to `data/{user}_my_queries.json` and `data/{user}_recent.json`)
- Batch automation via Selenium (`portal_automation.py`)

**Data Storage:**
- `data/` directory for user-specific query files
- OS-specific user data directory for batch history (`%LOCALAPPDATA%/QueryMaker` on Windows)

## Query State Structure

The main query object in SchemaPanel follows this structure:

```javascript
{
  schema: '',           // Selected schema name
  table: '',            // Selected table name
  tableAlias: 't1',     // Main table alias (always t1)
  columns: {            // Columns per table alias
    t1: [{name: 'col', alias: ''}],
    t2: [{name: 'col', alias: ''}]
  },
  distinct: false,
  joins: [{
    id, type, targetSchema, targetTable,
    alias,              // t2, t3, etc. - must be unique
    onLeft, onRight
  }],
  wheres: [{id, tableAlias, column, operator, value}],
  groupBys: [{id, tableAlias, column}],
  havings: [{id, column, operator, value}],
  orderBys: [{id, tableAlias, column, direction}],
  functions: [{id, func, args, alias, window}],
  ctes: [{id, name, query: {...}}],  // Nested query structure
  subqueries: [{id, type, targetColumn, query: {...}}],
  limit: ''
}
```

## Key Patterns

### JOIN Alias Generation
JOINs use `getNextAlias(joins)` helper to find first unused alias (t2, t3, etc.). Never use array length for alias calculation.

### Column Format
Columns are stored as `{name: string, alias: string}` objects, NOT as strings or Sets. Handle legacy formats in state restoration.

### SQL Generation
`generatedQuery` useMemo in SchemaPanel builds SQL from query state. CTE SQL is generated separately via `generateCTESQL()`.

### State Persistence
StateManager saves to localStorage with user-specific keys. State expires after 30 minutes. Handles Set↔Array conversion for JSON compatibility.

## Common Issues

1. **Duplicate JOIN aliases** - Always use `getNextAlias()`, not length-based calculation
2. **Column format mismatches** - Ensure columns are `{name, alias}` objects everywhere
3. **CTE columns not appearing** - CTE uses same column structure as main query
4. **Smart suggestions not working** - Check that `queryHistory` array is populated and `selectedColumns` is properly converted to Set

## File Naming

Source files use PascalCase for components (`SchemaPanel.jsx`) and camelCase for services (`useDebounce.js`). The `SRC` directory uses uppercase.

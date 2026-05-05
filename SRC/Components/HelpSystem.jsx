// HelpSystem.jsx - Comprehensive Help Modal for Query Maker Panel
import React, { useState, useEffect } from 'react';

const HelpSystem = ({ isOpen, onClose, theme }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSection, setActiveSection] = useState('getting-started');
    const [showOnStartup, setShowOnStartup] = useState(false);

    // Load show on startup preference
    useEffect(() => {
        const savedPreference = localStorage.getItem('helpShowOnStartup');
        setShowOnStartup(savedPreference === 'true');
    }, []);

    // Save show on startup preference
    const handleShowOnStartupChange = (checked) => {
        setShowOnStartup(checked);
        localStorage.setItem('helpShowOnStartup', checked.toString());
    };

    if (!isOpen) return null;

    const helpSections = [
        {
            id: 'getting-started',
            title: '🚀 Getting Started',
            icon: '🚀',
            content: `
**Welcome to Query Maker!**

Query Maker is a visual SQL query builder that helps you create complex database queries without writing SQL manually.

**Quick Start:**
1. Select a Schema and Table from the dropdowns
2. Choose columns you want to see
3. Add filters, joins, and other clauses as needed
4. View your generated SQL
5. Copy or run your query

**Navigation:**
- **Explorer Tab:** Browse database schemas and tables
- **Builder Tab:** Build your query visually
- **Saved Queries Tab:** Access premade and custom queries
- **Run Query Tab:** Execute queries manually
- **Recent Tab:** View query history

**Keyboard Shortcuts:**
- \`Ctrl + 1-4\`: Switch between tabs
- \`Ctrl + Enter\`: Go to Run Query tab
- \`Ctrl + K\`: Copy generated SQL
- \`Ctrl + /\`: Show shortcuts help
            `.trim()
        },
        {
            id: 'columns-aliases',
            title: '📊 Columns & Aliases',
            icon: '📊',
            content: `
**Selecting Columns**

1. After selecting a schema and table, available columns appear
2. Click checkboxes to select/deselect columns
3. Click "Select All" to choose all columns at once
4. Selected columns appear at the top with remove buttons

**Adding Aliases (AS Clause)**

Give columns custom names in your results:

1. Select a column
2. Find it in the "Selected Columns" section
3. Enter an alias in the text field next to the column
4. The SQL will show: \`column_name AS "your_alias"\`

**Example:**
- Column: \`customer_id\`
- Alias: \`Customer ID\`
- SQL: \`customer_id AS "Customer ID"\`

**Tips:**
✓ Use descriptive aliases for better readability
✓ Aliases are optional - leave blank to use original name
✓ Aliases with spaces must be in quotes (handled automatically)
            `.trim()
        },
        {
            id: 'joins',
            title: '🔗 Joins',
            icon: '🔗',
            content: `
**Adding Joins**

Combine data from multiple tables:

1. In "Add Query Clauses", select **JOIN** from dropdown
2. Click **Add** button
3. Choose join type:
   - **INNER JOIN**: Only matching rows from both tables
   - **LEFT JOIN**: All rows from left table, matching from right
   - **RIGHT JOIN**: All rows from right table, matching from left
   - **FULL JOIN**: All rows from both tables

4. Select target schema and table
5. Choose columns to join ON

**Example:**
Join customers with orders:
- Left Column (t1): \`customer_id\`
- Right Column (t2): \`customer_id\`
- Result: Links customer data with their orders

**Tips:**
✓ Each joined table gets an alias (t2, t3, etc.)
✓ Select columns from joined tables using their alias
✓ Multiple joins are supported
            `.trim()
        },
        {
            id: 'where-conditions',
            title: '🔍 WHERE Conditions',
            icon: '🔍',
            content: `
**Filtering Data with WHERE**

Add conditions to filter your results:

1. Select **WHERE** from clause dropdown
2. Click **Add**
3. Choose a column
4. Select an operator:
   - \`=\` Equal to
   - \`!=\` Not equal to
   - \`>\` Greater than
   - \`<\` Less than
   - \`>=\` Greater than or equal
   - \`<=\` Less than or equal
   - \`LIKE\` Pattern matching (use % wildcards)
   - \`IN\` Match multiple values

5. Enter value(s)

**Multiple Values (IN Clause):**
Enter multiple values separated by:
- Commas: \`value1, value2, value3\`
- Semicolons: \`value1; value2; value3\`
- New lines: One value per line
- Spaces: \`value1 value2 value3\`

The system automatically converts to IN clause!

**Examples:**
- Find specific ID: \`customer_id = 12345\`
- Search names: \`name LIKE '%Smith%'\`
- Multiple statuses: \`status\` IN \`active, pending, approved\`

**Tips:**
✓ Use LIKE with % for flexible searching
✓ Multiple WHERE conditions are joined with AND
✓ Text values are automatically quoted
            `.trim()
        },
        {
            id: 'functions',
            title: '⚙️ Functions',
            icon: '⚙️',
            content: `
**Using SQL Functions**

Transform and calculate data with functions:

1. Select **FUNCTION** from clause dropdown
2. Click **Add**
3. Choose a function from the dropdown
4. Enter required arguments
5. Optionally add an alias

**Common Functions:**

**String Functions:**
- \`UPPER(column)\` - Convert to uppercase
- \`LOWER(column)\` - Convert to lowercase
- \`SUBSTR(column, start, length)\` - Extract substring
- \`TRIM(column)\` - Remove whitespace
- \`LENGTH(column)\` - Get string length

**Numeric Functions:**
- \`ROUND(column, decimals)\` - Round numbers
- \`ABS(column)\` - Absolute value
- \`CEILING(column)\` - Round up
- \`FLOOR(column)\` - Round down

**Aggregate Functions:**
- \`COUNT(*)\` - Count rows
- \`SUM(column)\` - Sum values
- \`AVG(column)\` - Average
- \`MIN(column)\` - Minimum value
- \`MAX(column)\` - Maximum value

**Date Functions:**
- \`CURRENT_DATE\` - Today's date
- \`DATE(column)\` - Extract date
- \`YEAR(column)\` - Extract year
- \`MONTH(column)\` - Extract month

**Type Conversion:**
- \`CAST(column AS VARCHAR)\` - Convert to text
- \`CAST(column AS INTEGER)\` - Convert to number
- \`CAST(column AS DATE)\` - Convert to date

**Tips:**
✓ Use aggregate functions with GROUP BY
✓ Nest functions: \`UPPER(TRIM(name))\`
✓ Always add aliases to function results
            `.trim()
        },
        {
            id: 'string-concatenation',
            title: '🔗 String Concatenation',
            icon: '🔗',
            content: `
**Building String Concatenations (|| Operator)**

Combine multiple columns and text into one field.

**Two Ways to Access:**

**Method 1: Green Button (Recommended)**
1. Click green **"🔗 Concatenate Strings"** button
2. Interactive builder opens

**Method 2: Function Dropdown**
1. Add **FUNCTION** clause
2. Select **"🔗 CONCATENATE"** from dropdown

**Building Concatenations:**

**Add Parts:**
- **📊 Column**: Database column (\`t1.first_name\`)
- **📝 Text**: Literal text (quotes added automatically)
- **⚙️ Function**: SQL function (\`SUBSTR(col, 1, 3)\`)

**Each part has:**
- Type dropdown (Column/Text/Function)
- Value input field
- Remove button (×)
- Visual || separator between parts

**Examples:**

**Full Name:**
1. Column: \`t1.first_name\`
2. Text: \` \` (space)
3. Column: \`t1.last_name\`
4. Alias: \`full_name\`

Result: \`t1.first_name || ' ' || t1.last_name AS full_name\`

**Custom ID:**
1. Function: \`substr(t1.column, 1, 1)\`
2. Function: \`cast(t1.id as varchar)\`
3. Text: \`-\`
4. Column: \`t1.name\`
5. Alias: \`custom_id\`

Result: \`substr(t1.column, 1, 1) || cast(t1.id as varchar) || '-' || t1.name AS custom_id\`

**Email Generation:**
1. Function: \`LOWER(t1.firstname)\`
2. Text: \`.@\`
3. Function: \`LOWER(t1.lastname)\`
4. Text: \`@company.com\`
5. Alias: \`email\`

Result: \`LOWER(t1.firstname) || '.' || LOWER(t1.lastname) || '@company.com' AS email\`

**Tips:**
✓ Always include table alias (t1, t2, etc.) for columns
✓ Text quotes are added automatically
✓ Use CAST to convert numbers to text
✓ Preview shows complete SQL in real-time
✓ Add meaningful aliases for clarity
✓ Combine with functions for powerful transformations
            `.trim()
        },
        {
            id: 'grouping-sorting',
            title: '📈 Grouping & Sorting',
            icon: '📈',
            content: `
**GROUP BY - Aggregate Data**

Group rows with the same values:

1. Select **GROUP BY** from clause dropdown
2. Click **Add**
3. Choose column(s) to group by
4. Use aggregate functions (COUNT, SUM, AVG, etc.)

**Example:**
- Group by: \`category\`
- Select: \`category, COUNT(*) AS total\`
- Result: Count items per category

**HAVING - Filter Groups**

Filter aggregated results (like WHERE but for groups):

1. Select **HAVING** from clause dropdown
2. Enter aggregate function: \`COUNT(*)\`
3. Choose operator: \`>\`
4. Enter value: \`10\`

**Example:**
- \`HAVING COUNT(*) > 10\`
- Shows only groups with more than 10 items

**ORDER BY - Sort Results**

Control result order:

1. Select **ORDER BY** from clause dropdown
2. Choose column to sort by
3. Select direction:
   - **ASC**: Ascending (A-Z, 0-9, oldest-newest)
   - **DESC**: Descending (Z-A, 9-0, newest-oldest)

**Tips:**
✓ GROUP BY columns must be in SELECT
✓ Use HAVING for filtered aggregates
✓ Multiple ORDER BY columns are applied in order
✓ Always use aggregate functions with GROUP BY
            `.trim()
        },
        {
            id: 'ctes',
            title: '🔄 CTEs (WITH Clause)',
            icon: '🔄',
            content: `
**Common Table Expressions (CTEs)**

Create temporary named result sets for complex queries.

**What are CTEs?**
- Temporary named queries you can reference
- Make complex queries more readable
- Can reference previous CTEs
- Defined with WITH clause

**Using CTE Builder:**

1. Find **"Common Table Expressions"** section
2. Click **"▼ Show"** to expand
3. Click **"+ Add CTE"** button
4. Name your CTE (e.g., "active_customers")
5. Build the CTE query:
   - Select schema and table
   - Choose columns
   - Add WHERE conditions
   - Add other clauses as needed
6. Use the CTE name in your main query

**Example:**

**CTE 1: active_customers**
\`\`\`sql
WITH active_customers AS (
  SELECT customer_id, name, email
  FROM customers
  WHERE status = 'active'
)
\`\`\`

**CTE 2: customer_orders**
\`\`\`sql
customer_orders AS (
  SELECT customer_id, COUNT(*) as order_count
  FROM orders
  GROUP BY customer_id
)
\`\`\`

**Main Query:**
\`\`\`sql
SELECT ac.name, co.order_count
FROM active_customers ac
JOIN customer_orders co ON ac.customer_id = co.customer_id
\`\`\`

**Benefits:**
- Break complex queries into logical steps
- Reuse subqueries multiple times
- Improve query readability
- Easier to debug and maintain

**Tips:**
✓ CTEs are executed before the main query
✓ Later CTEs can reference earlier ones
✓ Name CTEs descriptively
✓ Use for repeated subqueries
✓ Maximum 10 CTEs per query
            `.trim()
        },
        {
            id: 'subqueries',
            title: '📦 Subqueries',
            icon: '📦',
            content: `
**Subqueries - Nested Queries**

Queries inside queries for complex filtering.

**Types of Subqueries:**

**WHERE IN Subquery:**
Filter based on values from another query

Example: Find customers with orders
1. Click **"+ IN Subquery"** button
2. Select column to filter: \`customer_id\`
3. Build subquery:
   - Select: \`customer_id\` from \`orders\`
   - WHERE: \`order_date > '2023-01-01'\`

Result:
\`\`\`sql
WHERE customer_id IN (
  SELECT customer_id
  FROM orders
  WHERE order_date > '2023-01-01'
)
\`\`\`

**WHERE EXISTS Subquery:**
Check if related records exist

Example: Find customers with any order
1. Click **"+ EXISTS Subquery"** button
2. Build subquery:
   - SELECT: \`1\`
   - FROM: \`orders\`
   - WHERE: \`orders.customer_id = customers.customer_id\`

Result:
\`\`\`sql
WHERE EXISTS (
  SELECT 1
  FROM orders
  WHERE orders.customer_id = customers.customer_id
)
\`\`\`

**Managing Subqueries:**
- Edit: Click **"Edit"** button
- Delete: Click **"Delete"** button
- Preview: View generated SQL in box

**Tips:**
✓ Use IN for simple value lists
✓ Use EXISTS for checking relationships
✓ Subqueries can have their own WHERE, GROUP BY
✓ Keep subqueries simple for better performance
            `.trim()
        },
        {
            id: 'templates',
            title: '📋 Query Templates',
            icon: '📋',
            content: `
**Query Templates**

Save and reuse common query patterns.

**Using Templates:**

**Load a Template:**
1. Go to **Saved Queries** tab
2. Find **"Query Templates"** section at top
3. Browse available templates
4. Click template name to expand
5. Click **"Load Template"** to use it

**Save Custom Template:**
1. Build your query in Builder tab
2. Go to **Saved Queries** tab
3. Click **"Save as Template"** button
4. Enter template name and description
5. Click **"Save"**

**Manage Templates:**
- **Edit**: Modify template name/description
- **Delete**: Remove template
- **Duplicate**: Create copy with modifications

**Built-in Templates:**
- Basic SELECT query
- JOIN with filters
- Aggregate with GROUP BY
- Date range query
- Text search query

**Custom Template Ideas:**
- Monthly reports
- Customer analysis
- Inventory checks
- Sales summaries
- User activity logs

**Tips:**
✓ Save frequently used query patterns
✓ Include helpful descriptions
✓ Use placeholders in template names
✓ Share templates with team (export feature)
✓ Templates preserve full query structure
            `.trim()
        },
        {
            id: 'keyboard-shortcuts',
            title: '⌨️ Keyboard Shortcuts',
            icon: '⌨️',
            content: `
**Keyboard Shortcuts**

Speed up your workflow with shortcuts:

**Navigation:**
- \`Ctrl + 1\`: Go to Explorer tab
- \`Ctrl + 2\`: Go to Builder tab
- \`Ctrl + 3\`: Go to Saved Queries tab
- \`Ctrl + 4\`: Go to Run Query tab

**Actions:**
- \`Ctrl + Enter\`: Generate & go to Run Query
- \`Ctrl + K\`: Copy generated SQL to clipboard
- \`Ctrl + S\`: Go to Saved Queries tab

**Query Building:**
- \`Ctrl + Shift + V\`: Validate query
- \`Ctrl + Shift + C\`: Clear all fields

**Help & Information:**
- \`Ctrl + /\`: Show keyboard shortcuts
- \`Escape\`: Close any open modal/panel

**Tips:**
✓ Shortcuts work across all tabs
✓ Press \`Ctrl + /\` anytime to see all shortcuts
✓ Use \`Escape\` to quickly close dialogs
✓ Combine shortcuts for faster workflow
            `.trim()
        },
        {
            id: 'search-feature',
            title: '🔎 Search in Saved Queries',
            icon: '🔎',
            content: `
**Searching Saved Queries**

Quickly find queries by name, SQL, or description.

**How to Search:**

1. Go to **Saved Queries** tab
2. Find search box at top of each list:
   - **Premade Queries** search box (left)
   - **My Saved Queries** search box (right)
3. Type search term
4. Results filter in real-time

**What's Searchable:**
- Query names
- SQL content
- Descriptions
- Tags (if present)

**Search Tips:**
✓ Search is case-insensitive
✓ Partial matches work (e.g., "cust" finds "customers")
✓ Shows "X of Y" count of filtered results
✓ Click ✕ to clear search
✓ Use specific SQL keywords to find queries by type

**Examples:**
- Search "JOIN" - Find all queries with joins
- Search "customer" - Find customer-related queries
- Search "GROUP BY" - Find aggregate queries
- Search "2024" - Find queries with 2024 in SQL

**Result Display:**
- Matching queries highlighted
- Non-matching queries hidden
- Result count shows at top
- Clear button appears when searching
            `.trim()
        },
        {
            id: 'smart-suggestions',
            title: '💡 Smart Suggestions',
            icon: '💡',
            content: `
**Smart Column & Join Suggestions**

AI-powered suggestions based on your query history.

**What It Does:**
Analyzes your past queries to suggest:
- Commonly used columns for selected table
- Likely joins with other tables
- Frequently paired columns

**Using Smart Suggestions:**

1. Select a schema and table in Builder
2. Click **"💡 Smart Suggestions"** button (top-right)
3. Panel shows suggestions:
   - **Suggested Columns**: Frequently used columns
   - **Suggested Joins**: Common table relationships
4. Click any suggestion to add it

**Column Suggestions:**
- Based on your query history
- Shows columns you often select together
- One-click to add to query

**Join Suggestions:**
- Suggests related tables
- Shows join conditions (ON clause)
- Based on your past joins
- One-click to add join

**Example:**
If you often query \`customers\` with \`orders\`:
- Selecting \`customers\` suggests joining \`orders\`
- Shows: \`ON customers.id = orders.customer_id\`

**Privacy:**
- Suggestions are based on YOUR queries only
- No data shared with other users
- Clear history to reset suggestions

**Tips:**
✓ More query history = better suggestions
✓ Suggestions improve over time
✓ Ignore suggestions that don't fit
✓ Build query history by running diverse queries
            `.trim()
        },
        {
            id: 'validation',
            title: '✅ Query Validation',
            icon: '✅',
            content: `
**Query Validation & Performance Hints**

Check your query for errors and optimization opportunities.

**How to Validate:**

1. Build your query in Builder tab
2. Click **"🔍 Validate"** button (purple, top-right)
3. Validation panel shows:
   - ✅ Valid query / 🚫 Errors
   - ⚠️ Warnings
   - 💡 Performance hints
   - Score (0-100)

**Validation Checks:**

**Syntax Errors:**
- Missing required clauses
- Invalid SQL syntax
- Incomplete conditions
- Mismatched parentheses

**Logic Warnings:**
- SELECT * without LIMIT
- Missing indexes (if known)
- Unused CTEs
- Circular CTE dependencies

**Performance Hints:**
- Add LIMIT for large tables
- Use indexes on WHERE columns
- Avoid SELECT * in production
- Optimize JOIN order

**Validation Status:**
- **✅ Valid**: No errors, ready to run
- **⚠️ Valid with Warnings**: Works but could be improved
- **🚫 Invalid**: Has errors, cannot run

**Performance Score:**
- **90-100**: Excellent
- **70-89**: Good
- **50-69**: Fair - consider optimization
- **0-49**: Poor - needs optimization

**Tips:**
✓ Validate before running large queries
✓ Address errors before warnings
✓ Performance hints are suggestions, not requirements
✓ Higher scores generally mean faster queries
✓ Always add LIMIT when exploring data
            `.trim()
        },
        {
            id: 'export-import',
            title: '💾 Export & Import',
            icon: '💾',
            content: `
**Export & Import Queries**

Share queries or backup your work.

**Export Queries:**

1. Go to **Saved Queries** tab
2. Click **"💾 Export/Import"** button
3. Choose what to export:
   - All queries
   - Selected queries
   - Date range
4. Click **"Export"**
5. JSON file downloads

**Import Queries:**

1. Click **"💾 Export/Import"** button
2. Click **"Import"** tab
3. Upload JSON file or paste JSON
4. Choose options:
   - Skip duplicates
   - Overwrite existing
   - Update timestamps
5. Click **"Import"**

**Import Options:**

**Skip Duplicates:**
- Ignores queries with same SQL
- Prevents duplicate entries

**Overwrite Existing:**
- Replaces queries with same name
- Useful for updating shared queries

**Update Timestamps:**
- Sets import date as save date
- Keeps original dates if unchecked

**What's Exported:**
- Query name
- SQL text
- Query state (for visual queries)
- Timestamp
- Tags and metadata

**Use Cases:**
- Share queries with team
- Backup before major changes
- Transfer between environments
- Version control
- Collaborate on query development

**Tips:**
✓ Export regularly as backup
✓ Name exports with date for versioning
✓ Review imported queries before running
✓ Export format is standard JSON
✓ Can edit JSON manually for bulk changes
            `.trim()
        },
        {
            id: 'automation',
            title: '🤖 Portal Automation',
            icon: '🤖',
            content: `
**Automated Query Execution**

Run queries automatically and download results.

**What It Does:**
- Opens data portal in background
- Logs in automatically
- Submits your query
- Monitors execution
- Downloads results when ready

**Using Automation:**

1. Build or paste your query
2. Go to **Run Query** tab
3. Find **"Portal Automation"** panel
4. Select portal to automate
5. Enter credentials (if required)
6. Click **"🤖 Run Automation"**
7. Monitor progress in real-time

**Automation Steps:**
1. ✅ Initializing browser
2. ✅ Logging in to portal
3. ✅ Navigating to query page
4. ✅ Submitting query
5. ✅ Monitoring execution
6. ✅ Downloading results
7. ✅ Complete!

**Progress Indicators:**
- Real-time status updates
- Progress bar
- Estimated time remaining
- Error alerts if something fails

**Batch Processing:**
- Run multiple queries sequentially
- Upload CSV of queries
- Monitor all executions
- Download all results

**Security:**
- Credentials stored locally only
- Encrypted connection
- Automatic cleanup
- No data sent to servers

**Tips:**
✓ Test query manually first
✓ Use automation for long-running queries
✓ Check portal access before automating
✓ Monitor first few runs
✓ Save successful automation settings
            `.trim()
        },
        {
            id: 'tips-tricks',
            title: '✨ Tips & Tricks',
            icon: '✨',
            content: `
**Pro Tips for Power Users**

**Query Building:**
- Build queries incrementally - start simple, add complexity
- Use aliases for all calculated columns
- Test with LIMIT 10 before running on full table
- Save frequently used queries as templates

**Performance:**
- Always add LIMIT for exploratory queries
- Use specific columns instead of SELECT *
- Index columns used in WHERE and JOIN
- Validate queries before running large datasets

**Organization:**
- Use descriptive query names
- Add tags to categorize queries
- Export queries regularly as backup
- Delete old test queries periodically

**Collaboration:**
- Export queries to share with team
- Use consistent naming conventions
- Document complex queries in description
- Share successful query patterns

**Workflow Efficiency:**
- Master keyboard shortcuts
- Use drag-and-drop for columns
- Enable Smart Suggestions
- Keep query history clean

**Debugging:**
- Validate query before running
- Check table aliases in complex queries
- Test joins one at a time
- Use CTE Builder for complex logic

**Advanced Techniques:**
- Combine CTEs with subqueries
- Use window functions for analytics
- Leverage string concatenation for custom IDs
- Chain multiple functions together

**Best Practices:**
- Start with schema and table selection
- Add WHERE before ORDER BY
- Group by all non-aggregate columns
- Always alias joined tables
- Use DISTINCT sparingly (impacts performance)

**Common Mistakes to Avoid:**
- Forgetting table aliases (t1, t2, etc.)
- Missing closing parentheses
- Wrong quote types (use single ' for strings)
- Running unvalidated queries on production
- Using SELECT * without LIMIT

**Time Savers:**
- Use Ctrl+Enter to generate and run
- Drag columns to WHERE/GROUP BY zones
- Click column names to add to query
- Use search in saved queries
- Template repetitive query structures

**Getting Help:**
- Check validation errors first
- Review examples in this help
- Use query history for reference
- Export problematic queries for review
- Check portal documentation for SQL dialect specifics
            `.trim()
        }
    ];

    // Filter sections based on search
    const filteredSections = helpSections.filter(section => {
        if (!searchTerm) return true;
        const lowerSearch = searchTerm.toLowerCase();
        return (
            section.title.toLowerCase().includes(lowerSearch) ||
            section.content.toLowerCase().includes(lowerSearch)
        );
    });

    const activeContent = helpSections.find(s => s.id === activeSection);

    // Format content with proper markdown-style rendering
    const formatContent = (content) => {
        const lines = content.split('\n');
        return lines.map((line, index) => {
            // Headers
            if (line.startsWith('**') && line.endsWith('**')) {
                const text = line.slice(2, -2);
                return (
                    <h3 key={index} className={`font-bold text-lg mt-4 mb-2 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
                        {text}
                    </h3>
                );
            }
            
            // Bold inline text
            if (line.includes('**')) {
                const parts = line.split('**');
                return (
                    <p key={index} className="mb-2">
                        {parts.map((part, i) => 
                            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                        )}
                    </p>
                );
            }
            
            // Bullet points
            if (line.startsWith('- ') || line.startsWith('✓ ')) {
                return (
                    <li key={index} className="ml-6 mb-1">
                        {line.substring(2)}
                    </li>
                );
            }
            
            // Code blocks
            if (line.startsWith('```')) {
                return null; // Skip markdown code fence
            }
            
            // Inline code
            if (line.includes('`')) {
                const parts = line.split('`');
                return (
                    <p key={index} className="mb-2">
                        {parts.map((part, i) => 
                            i % 2 === 1 ? (
                                <code key={i} className={`${theme === 'dark' ? 'bg-gray-700 text-green-300' : 'bg-gray-200 text-gray-900 border border-gray-300'} px-1.5 py-0.5 rounded text-sm font-mono font-semibold`}>
                                    {part}
                                </code>
                            ) : part
                        )}
                    </p>
                );
            }
            
            // Empty lines
            if (!line.trim()) {
                return <br key={index} />;
            }
            
            // Regular paragraphs
            return <p key={index} className="mb-2">{line}</p>;
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col`}>
                {/* Header */}
                <div className={`flex justify-between items-center p-6 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">📖</span>
                        <div>
                            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Query Maker Help
                            </h2>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Everything you need to know
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'} text-2xl font-bold w-10 h-10 flex items-center justify-center rounded transition`}
                    >
                        ×
                    </button>
                </div>

                {/* Search Bar */}
                <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-200'}`}>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search help topics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full p-3 pl-10 ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        <span className={`absolute left-3 top-3.5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>🔍</span>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className={`absolute right-3 top-3 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    {searchTerm && (
                        <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Found {filteredSections.length} of {helpSections.length} topics
                        </p>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className={`w-64 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'} p-4 overflow-y-auto border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
                        <div className="space-y-1">
                            {filteredSections.map(section => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full text-left p-3 rounded-lg transition ${
                                        activeSection === section.id
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : theme === 'dark'
                                                ? 'text-gray-300 hover:bg-gray-800'
                                                : 'text-gray-800 hover:bg-gray-200 border border-transparent hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{section.icon}</span>
                                        <span className="text-sm font-medium">{section.title.replace(/^.+?\s/, '')}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className={`flex-1 p-6 overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                        {activeContent && (
                            <>
                                <h2 className={`text-3xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-3`}>
                                    <span className="text-4xl">{activeContent.icon}</span>
                                    {activeContent.title.replace(/^.+?\s/, '')}
                                </h2>
                                <div className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'} leading-relaxed`}>
                                    {formatContent(activeContent.content)}
                                </div>
                            </>
                        )}
                        
                        {filteredSections.length === 0 && (
                            <div className="text-center py-12">
                                <span className="text-6xl mb-4 block">🔍</span>
                                <p className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    No help topics found for "{searchTerm}"
                                </p>
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="mt-4 text-blue-600 hover:text-blue-700 hover:underline font-medium"
                                >
                                    Clear search
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className={`flex justify-between items-center p-4 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-200'}`}>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showOnStartup}
                            onChange={(e) => handleShowOnStartupChange(e.target.checked)}
                            className="w-4 h-4 cursor-pointer"
                        />
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                            Show this help on startup
                        </span>
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md transition"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpSystem;

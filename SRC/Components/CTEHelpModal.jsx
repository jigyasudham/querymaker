import React from 'react';

const CTEHelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            📚 Common Table Expressions (CTEs) Guide
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* What are CTEs */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              What are CTEs?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Common Table Expressions (CTEs) are temporary named result sets that exist only during query execution. 
              Think of them as "temporary views" that make complex queries more readable and maintainable.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>💡 Key Benefit:</strong> Break down complex queries into logical, reusable steps instead of nested subqueries.
              </p>
            </div>
          </section>

          {/* Basic Example */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Basic Example
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Instead of writing complex nested queries, use CTEs to break them into steps:
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Without CTE */}
              <div>
                <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                  ❌ Without CTE (Nested Subquery)
                </h4>
                <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs font-mono overflow-x-auto">
{`SELECT 
  c.name,
  sq.total_orders
FROM customers c
JOIN (
  SELECT 
    customer_id,
    COUNT(*) as total_orders
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
) sq ON c.id = sq.customer_id
WHERE sq.total_orders > 10;`}
                </pre>
              </div>

              {/* With CTE */}
              <div>
                <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                  ✅ With CTE (Clear & Readable)
                </h4>
                <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs font-mono overflow-x-auto">
{`WITH customer_orders AS (
  SELECT 
    customer_id,
    COUNT(*) as total_orders
  FROM orders
  WHERE status = 'completed'
  GROUP BY customer_id
)
SELECT 
  c.name,
  co.total_orders
FROM customers c
JOIN customer_orders co 
  ON c.id = co.customer_id
WHERE co.total_orders > 10;`}
                </pre>
              </div>
            </div>
          </section>

          {/* Multiple CTEs */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Multiple CTEs (Chaining)
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              You can define multiple CTEs and reference earlier ones in later ones:
            </p>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm font-mono overflow-x-auto">
{`WITH 
  -- Step 1: Get sales per customer
  customer_sales AS (
    SELECT 
      customer_id,
      SUM(amount) as total_sales,
      COUNT(*) as order_count
    FROM orders
    WHERE order_date >= '2024-01-01'
    GROUP BY customer_id
  ),
  
  -- Step 2: Identify VIP customers
  vip_customers AS (
    SELECT customer_id, total_sales
    FROM customer_sales
    WHERE total_sales > 10000
      AND order_count >= 5
  ),
  
  -- Step 3: Get their contact info
  vip_contacts AS (
    SELECT 
      c.name,
      c.email,
      v.total_sales
    FROM vip_customers v
    JOIN customers c ON v.customer_id = c.id
  )

-- Final query uses the last CTE
SELECT * FROM vip_contacts
ORDER BY total_sales DESC;`}
            </pre>
          </section>

          {/* Common Use Cases */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Common Use Cases
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  1️⃣ Simplifying Complex Joins
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Break down multi-table joins into logical steps, making queries easier to understand and debug.
                </p>
              </div>

              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  2️⃣ Data Aggregation Pipelines
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Create step-by-step aggregations (daily → monthly → yearly totals).
                </p>
              </div>

              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  3️⃣ Filtering Before Joining
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Pre-filter large tables in a CTE before joining to improve performance.
                </p>
              </div>

              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  4️⃣ Reusing Calculations
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Calculate once in a CTE, then reference multiple times in the main query.
                </p>
              </div>
            </div>
          </section>

          {/* Best Practices */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Best Practices
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="text-green-600 dark:text-green-400 text-xl">✅</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Use descriptive CTE names
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-400">
                    Names like <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">active_customers</code> or <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">monthly_sales</code> make intent clear
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-green-600 dark:text-green-400 text-xl">✅</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Order CTEs logically
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-400">
                    Define CTEs in the order they depend on each other (dependencies first)
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-green-600 dark:text-green-400 text-xl">✅</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Keep CTEs focused
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-400">
                    Each CTE should accomplish one clear purpose
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-red-600 dark:text-red-400 text-xl">❌</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Avoid circular dependencies
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-400">
                    A CTE can't reference CTEs defined after it
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-red-600 dark:text-red-400 text-xl">❌</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Don't overuse CTEs
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-400">
                    If you have 8+ CTEs, consider breaking into multiple queries
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Performance Notes */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Performance Considerations
            </h3>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 space-y-2">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ Important:</strong> Some databases materialize CTEs (store them temporarily), which can affect performance:
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-800 dark:text-yellow-200 space-y-1 ml-4">
                <li><strong>PostgreSQL:</strong> CTEs are optimization fences (materialized by default in older versions)</li>
                <li><strong>MySQL 8.0+:</strong> CTEs are not materialized (optimized like views)</li>
                <li><strong>SQL Server:</strong> CTEs are like inline views (not materialized)</li>
              </ul>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2">
                💡 <strong>Tip:</strong> Use CTEs for readability. If performance is critical, test and compare with subqueries.
              </p>
            </div>
          </section>

          {/* Quick Reference */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Quick Reference
            </h3>
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
              <pre className="text-sm font-mono text-gray-700 dark:text-gray-300">
{`-- Basic syntax
WITH cte_name AS (
  SELECT ...
  FROM ...
)
SELECT * FROM cte_name;

-- Multiple CTEs
WITH 
  cte1 AS (SELECT ...),
  cte2 AS (SELECT ... FROM cte1),
  cte3 AS (SELECT ... FROM cte2)
SELECT * FROM cte3;

-- Using CTEs in JOINs
WITH orders_summary AS (
  SELECT customer_id, COUNT(*) as total
  FROM orders
  GROUP BY customer_id
)
SELECT c.*, os.total
FROM customers c
JOIN orders_summary os ON c.id = os.customer_id;`}
              </pre>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Got it! Let's build some CTEs
          </button>
        </div>
      </div>
    </div>
  );
};

export default CTEHelpModal;
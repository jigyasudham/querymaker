import React from 'react';

const SubqueryHelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            📊 Subqueries Guide
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
          {/* What are Subqueries */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              What are Subqueries?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              A subquery is a query nested inside another query. Think of it as a "query within a query" - 
              you use the results of one SELECT statement as input for another.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>💡 Key Concept:</strong> Subqueries are evaluated first, then their results are used 
                by the outer query. They're surrounded by parentheses: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">(SELECT ...)</code>
              </p>
            </div>
          </section>

          {/* Types of Subqueries */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Types of Subqueries
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  1️⃣ WHERE IN Subquery
                </h4>
                <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
                  Filter rows where column matches values from subquery
                </p>
                <pre className="bg-white dark:bg-gray-900 p-2 rounded text-xs font-mono">
{`WHERE customer_id IN (
  SELECT id FROM vip_customers
)`}
                </pre>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  2️⃣ WHERE EXISTS Subquery
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                  Filter rows if related records exist
                </p>
                <pre className="bg-white dark:bg-gray-900 p-2 rounded text-xs font-mono">
{`WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.customer_id = c.id
)`}
                </pre>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                  3️⃣ SELECT Subquery (Scalar)
                </h4>
                <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
                  Calculate value for each row
                </p>
                <pre className="bg-white dark:bg-gray-900 p-2 rounded text-xs font-mono">
{`SELECT
  name,
  (SELECT COUNT(*)
   FROM orders o
   WHERE o.customer_id = c.id
  ) AS order_count`}
                </pre>
              </div>

              <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-4">
                <h4 className="font-semibold text-pink-900 dark:text-pink-100 mb-2">
                  4️⃣ FROM Subquery (Derived Table)
                </h4>
                <p className="text-sm text-pink-800 dark:text-pink-200 mb-2">
                  Query results of another query
                </p>
                <pre className="bg-white dark:bg-gray-900 p-2 rounded text-xs font-mono">
{`FROM (
  SELECT * FROM orders
  WHERE status = 'completed'
) AS completed_orders`}
                </pre>
              </div>
            </div>
          </section>

          {/* Detailed Examples */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Detailed Examples
            </h3>

            {/* Example 1: IN Subquery */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Example 1: Find customers who made purchases in 2024
              </h4>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm font-mono overflow-x-auto">
{`SELECT 
  name,
  email,
  city
FROM customers
WHERE customer_id IN (
  SELECT DISTINCT customer_id
  FROM orders
  WHERE order_date >= '2024-01-01'
);`}
              </pre>
              <p className="text-sm text-gray-800 dark:text-gray-400 mt-2">
                The subquery finds all customer IDs who ordered in 2024, then the outer query 
                gets full customer details for those IDs.
              </p>
            </div>

            {/* Example 2: EXISTS Subquery */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Example 2: Find products with no sales
              </h4>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm font-mono overflow-x-auto">
{`SELECT 
  product_id,
  product_name,
  price
FROM products p
WHERE NOT EXISTS (
  SELECT 1
  FROM order_items oi
  WHERE oi.product_id = p.product_id
);`}
              </pre>
              <p className="text-sm text-gray-800 dark:text-gray-400 mt-2">
                EXISTS checks if at least one matching row exists. NOT EXISTS finds products 
                with no related order items (never sold).
              </p>
            </div>

            {/* Example 3: Scalar Subquery */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Example 3: Show customer with their total spending
              </h4>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm font-mono overflow-x-auto">
{`SELECT 
  c.name,
  c.email,
  (SELECT SUM(total)
   FROM orders o
   WHERE o.customer_id = c.customer_id
  ) AS total_spending,
  (SELECT COUNT(*)
   FROM orders o
   WHERE o.customer_id = c.customer_id
  ) AS order_count
FROM customers c;`}
              </pre>
              <p className="text-sm text-gray-800 dark:text-gray-400 mt-2">
                Scalar subqueries in SELECT calculate a single value per row. Must return exactly 
                one row and one column.
              </p>
            </div>

            {/* Example 4: FROM Subquery */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Example 4: Get top 10 customers by spending
              </h4>
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-sm font-mono overflow-x-auto">
{`SELECT 
  customer_name,
  total_spent,
  order_count
FROM (
  SELECT 
    c.name as customer_name,
    SUM(o.total) as total_spent,
    COUNT(*) as order_count
  FROM customers c
  JOIN orders o ON c.customer_id = o.customer_id
  GROUP BY c.customer_id, c.name
  ORDER BY total_spent DESC
  LIMIT 10
) AS top_customers
WHERE order_count >= 5;`}
              </pre>
              <p className="text-sm text-gray-800 dark:text-gray-400 mt-2">
                FROM subqueries (derived tables) let you query pre-aggregated results. 
                Must have an alias (AS top_customers).
              </p>
            </div>
          </section>

          {/* Subqueries vs JOINs vs CTEs */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              When to Use Subqueries vs JOINs vs CTEs
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-400 dark:border-gray-600">
                <thead className="bg-gray-100 dark:bg-gray-900">
                  <tr>
                    <th className="border border-gray-400 dark:border-gray-600 px-4 py-2 text-left text-sm font-semibold">Method</th>
                    <th className="border border-gray-400 dark:border-gray-600 px-4 py-2 text-left text-sm font-semibold">Best For</th>
                    <th className="border border-gray-400 dark:border-gray-600 px-4 py-2 text-left text-sm font-semibold">Performance</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr>
                    <td className="border border-gray-400 dark:border-gray-600 px-4 py-2 font-mono">IN Subquery</td>
                    <td className="border border-gray-400 dark:border-gray-600 px-4 py-2">
                      Filtering by list of IDs from another table
                    </td>
                    <td className="border border-gray-400 dark:border-gray-600 px-4 py-2">
                      <span className="text-yellow-600">⚠️ Can be slow</span> - consider JOIN instead
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 dark:border-gray-600 px-4 py-2 font-mono">EXISTS</td>
                    <td className="border border-gray-400 dark:border-gray-600 px-4 py-2">
                      Checking if related records exist
                    </td>
                    <td className="border border-gray-400 dark:border-gray-600 px-4 py-2">
                      <span className="text-green-600">✅ Usually fast</span> - stops at first match
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 dark:border-gray-600 px-4 py-2 font-mono">Scalar Subquery</td>
                    <td className="border border-gray-400 dark:border-gray-600 px-4 py-2">
                      One-off calculations per row
                    </td>
                    <td className="border border-gray-400 dark:border-gray-600 px-4 py-2">
                      <span className="text-red-600">❌ Can be very slow</span> - runs for each row
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 dark:border-gray-600 px-4 py-2 font-mono">JOIN</td>
                    <td className="border border-gray-400 dark:border-gray-600 px-4 py-2">
                      Combining data from multiple tables
                    </td>
                    <td className="border border-gray-400 dark:border-gray-600 px-4 py-2">
                      <span className="text-green-600">✅ Usually fastest</span> - optimized by DB
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 dark:border-gray-600 px-4 py-2 font-mono">CTE (WITH)</td>
                    <td className="border border-gray-400 dark:border-gray-600 px-4 py-2">
                      Complex queries, reused subqueries
                    </td>
                    <td className="border border-gray-400 dark:border-gray-600 px-4 py-2">
                      <span className="text-green-600">✅ Good</span> - readable & often optimized
                    </td>
                  </tr>
                </tbody>
              </table>
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
                    Use EXISTS instead of IN when possible
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-400">
                    EXISTS is faster because it stops at the first match
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-green-600 dark:text-green-400 text-xl">✅</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Add LIMIT to scalar subqueries
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-400">
                    Ensure scalar subqueries return exactly one value with LIMIT 1 or aggregates
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-green-600 dark:text-green-400 text-xl">✅</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Use SELECT 1 in EXISTS subqueries
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-400">
                    EXISTS only checks existence, not values: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">WHERE EXISTS (SELECT 1 ...)</code>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Avoid correlated subqueries when possible
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-400">
                    Subqueries that reference outer query execute for each row (slow)
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-red-600 dark:text-red-400 text-xl">❌</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Beware of NOT IN with NULLs
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-400">
                    NOT IN returns no results if subquery contains NULL. Use NOT EXISTS or LEFT JOIN instead
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-red-600 dark:text-red-400 text-xl">❌</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Don't nest subqueries too deeply
                  </p>
                  <p className="text-sm text-gray-800 dark:text-gray-400">
                    More than 2-3 levels? Use CTEs (WITH clause) for readability
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Converting Between Methods */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Converting Subqueries to JOINs
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                  ⚠️ Subquery (Slower)
                </h4>
                <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs font-mono">
{`SELECT name
FROM customers
WHERE customer_id IN (
  SELECT customer_id
  FROM orders
  WHERE total > 1000
);`}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                  ✅ JOIN (Faster)
                </h4>
                <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs font-mono">
{`SELECT DISTINCT c.name
FROM customers c
JOIN orders o 
  ON c.customer_id = o.customer_id
WHERE o.total > 1000;`}
                </pre>
              </div>
            </div>
          </section>

          {/* Quick Reference */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Quick Reference
            </h3>
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg space-y-2">
              <pre className="text-xs font-mono text-gray-700 dark:text-gray-300">
{`-- WHERE IN: Filter by list
WHERE column IN (SELECT ...)

-- WHERE EXISTS: Check existence
WHERE EXISTS (SELECT 1 FROM ... WHERE ...)

-- WHERE NOT EXISTS: Check non-existence
WHERE NOT EXISTS (SELECT 1 FROM ... WHERE ...)

-- Scalar subquery: Calculate value
SELECT (SELECT MAX(...) FROM ...) AS max_value

-- Derived table: Query results
FROM (SELECT ... FROM ...) AS alias

-- Correlated: References outer query
WHERE column = (SELECT ... WHERE outer.id = inner.id)`}
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
            Got it! Start using subqueries
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubqueryHelpModal;
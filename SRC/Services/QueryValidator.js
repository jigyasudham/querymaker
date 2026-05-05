/**
 * Query Validator Service - Enhanced with Performance Hints
 * Validates SQL queries and provides helpful error messages, warnings, and performance suggestions
 */

class QueryValidator {
    /**
     * Main validation function - returns validation result
     * @param {string} sql - The SQL query to validate
     * @param {object} queryState - The query builder state (optional, for deeper validation)
     * @param {object} schemaMetadata - Optional metadata about tables (row counts, indexes, etc.)
     * @returns {object} - { isValid, errors: [], warnings: [], suggestions: [], performanceScore: number }
     */
    static validate(sql, queryState = null, schemaMetadata = null) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            suggestions: [],
            performanceHints: [],
            performanceScore: 100 // 0-100, lower is worse
        };

        if (!sql || sql.trim() === '') {
            result.isValid = false;
            result.errors.push({
                type: 'empty',
                message: 'Query is empty',
                severity: 'error'
            });
            return result;
        }

        // Run all validation checks
        this.checkSyntaxErrors(sql, result);
        this.checkCommonMistakes(sql, result);
        this.checkPerformanceIssues(sql, result, schemaMetadata);
        this.checkSecurityIssues(sql, result);
        this.analyzeJoins(sql, result);

        // NEW: Add CTE validation
        if (sql.trim().toUpperCase().startsWith('WITH')) {
            this.validateCTEs(sql, result);
            this.analyzeCTEPerformance(sql, result);
        }

        // NEW: Add Subquery validation
        this.validateSubqueries(sql, result);
        this.analyzeSubqueryPerformance(sql, result);

        // this.estimateQueryCost(sql, result, schemaMetadata);
        
        if (queryState) {
            this.checkBuilderState(queryState, result);
        }

        // Calculate performance score
        this.calculatePerformanceScore(result, sql);

        // Set overall validity
        result.isValid = result.errors.length === 0;

        return result;
    }

    /**
     * CTE-specific validation
     */
    static validateCTEs(sql, result) {
      // Extract CTEs from WITH clause
      const withMatch = sql.match(/WITH\s+([\s\S]+?)(?=\n\s*(?:SELECT|INSERT|UPDATE|DELETE))/i);
      if (!withMatch) return;

      const cteSection = withMatch[1];
      const ctePattern = /(\w+)\s+AS\s*\(([\s\S]+?)\)(?:,|\s*$)/gi;
      const ctes = [];
      let match;

      // Parse individual CTEs
      while ((match = ctePattern.exec(cteSection)) !== null) {
        ctes.push({
          name: match[1],
          sql: match[2],
          position: match.index
        });
      }

      // Validation 1: Check for duplicate CTE names
      const cteNames = ctes.map(c => c.name.toLowerCase());
      const duplicates = cteNames.filter((name, index) =>
        cteNames.indexOf(name) !== index
      );
      if (duplicates.length > 0) {
        result.errors.push({
          type: 'CTE_DUPLICATE',
          message: `Duplicate CTE names found: ${[...new Set(duplicates)].join(', ')}`,
          severity: 'error'
        });
      }

      // Validation 2: Check for forward references (circular dependencies)
      ctes.forEach((cte, index) => {
        const laterCTENames = ctes.slice(index + 1).map(c => c.name);
        laterCTENames.forEach(laterName => {
          const refPattern = new RegExp(`\\b${laterName}\\b`, 'i');
          if (refPattern.test(cte.sql)) {
            result.errors.push({
              type: 'CTE_CIRCULAR_DEPENDENCY',
              message: `CTE "${cte.name}" references "${laterName}" which is defined later`,
              severity: 'error',
              suggestion: `Reorder CTEs so "${laterName}" comes before "${cte.name}"`
            });
          }
        });
      });

      // Validation 3: Check for unused CTEs
      const mainQuery = sql.substring(sql.lastIndexOf(')') + 1);
      ctes.forEach(cte => {
        const isUsedInMain = new RegExp(`\\bFROM\\s+${cte.name}\\b|\\bJOIN\\s+${cte.name}\\b`, 'i').test(mainQuery);
        const isUsedInOtherCTEs = ctes.some(otherCTE =>
          otherCTE.name !== cte.name &&
          new RegExp(`\\b${cte.name}\\b`, 'i').test(otherCTE.sql)
        );

        if (!isUsedInMain && !isUsedInOtherCTEs) {
          result.warnings.push({
            type: 'CTE_UNUSED',
            message: `CTE "${cte.name}" is defined but never used`,
            severity: 'warning',
            suggestion: 'Remove unused CTE or reference it in your query'
          });
        }
      });

      // Validation 4: Check for recursive CTEs
      ctes.forEach(cte => {
        if (new RegExp(`\\b${cte.name}\\b`, 'i').test(cte.sql)) {
          result.warnings.push({
            type: 'CTE_RECURSIVE',
            message: `CTE "${cte.name}" appears to be recursive. Ensure this is intended and supported.`,
            severity: 'warning',
            suggestion: 'Recursive CTEs must use UNION ALL and have a termination condition.'
          });
        }
      });
    }

    /**
     * Validate subqueries in SQL
     */
    static validateSubqueries(sql, result) {
        // Find all subqueries (text within parentheses that contains SELECT)
        const subqueryPattern = /\(([^()]*SELECT[^()]*)\)/gi;
        const subqueries = [];
        let match;

        while ((match = subqueryPattern.exec(sql)) !== null) {
            subqueries.push({
                sql: match[1],
                position: match.index,
                fullMatch: match[0]
            });
        }

        if (subqueries.length === 0) return;

        // Validation 1: Check scalar subqueries (in SELECT clause)
        const selectSubqueries = sql.match(/SELECT[^FROM]*\([^)]*SELECT[^)]*\)/gi) || [];
        selectSubqueries.forEach(subQuery => {
            // Scalar subqueries should return exactly one column and one row
            if (!subQuery.toLowerCase().includes('limit 1') && 
                !subQuery.toLowerCase().includes('max(') &&
                !subQuery.toLowerCase().includes('min(') &&
                !subQuery.toLowerCase().includes('count(') &&
                !subQuery.toLowerCase().includes('sum(') &&
                !subQuery.toLowerCase().includes('avg(')) {
                result.warnings.push({
                    type: 'SUBQUERY_SCALAR_MISSING_LIMIT',
                    message: 'Scalar subquery in SELECT should have LIMIT 1 or use aggregate function',
                    severity: 'warning',
                    suggestion: 'Add LIMIT 1 to ensure only one value is returned'
                });
            }
        });

        // Validation 2: Check IN subqueries
        const inSubqueries = sql.match(/IN\s*\([^)]*SELECT[^)]*\)/gi) || [];
        inSubqueries.forEach((subQuery, index) => {
            const innerSQL = subQuery.match(/SELECT\s+(.+?)\s+FROM/i);
            if (innerSQL) {
                const columns = innerSQL[1].trim();
                // Count commas not in functions
                const columnCount = (columns.match(/,(?![^(]*\))/g) || []).length + 1;
                
                if (columnCount > 1 && !columns.includes('*')) {
                    result.errors.push({
                        type: 'SUBQUERY_IN_MULTIPLE_COLUMNS',
                        message: `IN subquery returns ${columnCount} columns, should return only 1`,
                        severity: 'error',
                        suggestion: 'IN subqueries must return exactly one column'
                    });
                }
            }
        });

        // Validation 3: Check EXISTS subqueries
        const existsSubqueries = sql.match(/EXISTS\s*\([^)]*SELECT[^)]*\)/gi) || [];
        existsSubqueries.forEach((subQuery, index) => {
            // EXISTS is efficient with SELECT 1 or SELECT *
            const innerSQL = subQuery.toLowerCase();
            if (!innerSQL.includes('select 1') && 
                !innerSQL.includes('select *') &&
                innerSQL.match(/select\s+[\w.]+,/)) {
                result.warnings.push({
                    type: 'SUBQUERY_EXISTS_INEFFICIENT',
                    message: `EXISTS subquery can use SELECT 1 for better performance`,
                    severity: 'warning',
                    suggestion: 'EXISTS only checks for row existence, use SELECT 1 instead of specific columns'
                });
            }
        });

        // Validation 4: Check for correlated subqueries (performance warning)
        const outerTables = sql.match(/FROM\s+(\w+)(?:\s+AS\s+(\w+))?/gi) || [];
        const outerAliases = outerTables.map(t => {
            const match = t.match(/AS\s+(\w+)/i);
            return match ? match[1] : null;
        }).filter(Boolean);

        subqueries.forEach((sub, index) => {
            outerAliases.forEach(alias => {
                if (new RegExp(`\\b${alias}\\.\\w+`, 'i').test(sub.sql)) {
                    result.warnings.push({
                        type: 'SUBQUERY_CORRELATED',
                        message: `Subquery is correlated (references outer query table "${alias}")`,
                        severity: 'warning',
                        suggestion: 'Correlated subqueries can be slow. Consider using JOINs instead.'
                    });
                }
            });
        });

        // Validation 5: Check for nested subqueries (complexity warning)
        const nestedCount = (sql.match(/\([^()]*\([^()]*SELECT/gi) || []).length;
        if (nestedCount > 0) {
            result.warnings.push({
                type: 'SUBQUERY_NESTED',
                message: `Query has ${nestedCount} nested subqueries (subquery within subquery)`,
                severity: 'warning',
                suggestion: 'Consider using CTEs (WITH clause) for better readability'
            });
        }

        // Validation 6: Check subquery in WHERE without index hint
        const whereSubqueryCount = (sql.match(/WHERE[^(]*\([^)]*SELECT/gi) || []).length;
        if (whereSubqueryCount > 3) {
            result.warnings.push({
                type: 'SUBQUERY_MULTIPLE_WHERE',
                message: `Query has ${whereSubqueryCount} subqueries in WHERE clause`,
                severity: 'warning',
                suggestion: 'Multiple WHERE subqueries can impact performance. Consider using JOINs or CTEs.'
            });
        }

        // Validation 7: FROM subquery without alias
        const fromSubqueries = sql.match(/FROM\s*\([^)]*SELECT[^)]*\)(?!\s+AS\s+\w+)/gi) || [];
        if (fromSubqueries.length > 0) {
            result.errors.push({
                type: 'SUBQUERY_FROM_NO_ALIAS',
                message: 'FROM subquery (derived table) must have an alias',
                severity: 'error',
                suggestion: 'Add AS alias_name after the closing parenthesis'
            });
        }
    }

    /**
     * Check for basic SQL syntax errors
     */
    static checkSyntaxErrors(sql, result) {
        const sqlUpper = sql.toUpperCase();

        if (!sqlUpper.includes('SELECT')) {
            result.errors.push({
                type: 'missing_select',
                message: 'Query must contain SELECT keyword',
                severity: 'error'
            });
        }

        if (!sqlUpper.includes('FROM') && !sql.match(/SELECT\s+[\d']/i)) {
            result.errors.push({
                type: 'missing_from',
                message: 'Query must contain FROM clause',
                severity: 'error'
            });
        }

        const openParens = (sql.match(/\(/g) || []).length;
        const closeParens = (sql.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            result.errors.push({
                type: 'unbalanced_parens',
                message: `Unbalanced parentheses: ${openParens} opening, ${closeParens} closing`,
                severity: 'error',
                suggestion: openParens > closeParens 
                    ? 'Add missing closing parenthesis )' 
                    : 'Remove extra closing parenthesis'
            });
        }

        const singleQuotes = (sql.match(/'/g) || []).length;
        const doubleQuotes = (sql.match(/"/g) || []).length;
        if (singleQuotes % 2 !== 0) {
            result.errors.push({
                type: 'unclosed_quote',
                message: 'Unclosed single quote detected',
                severity: 'error',
                suggestion: "Add missing single quote '"
            });
        }
        if (doubleQuotes % 2 !== 0) {
            result.errors.push({
                type: 'unclosed_quote',
                message: 'Unclosed double quote detected',
                severity: 'error',
                suggestion: 'Add missing double quote "'
            });
        }

        const semicolons = (sql.match(/;/g) || []).length;
        if (semicolons > 1) {
            result.warnings.push({
                type: 'multiple_statements',
                message: 'Multiple statements detected (multiple semicolons)',
                severity: 'warning',
                suggestion: 'Remove extra semicolons - only one query allowed'
            });
        }

        const selectIdx = sqlUpper.indexOf('SELECT');
        const fromIdx = sqlUpper.indexOf('FROM');
        const whereIdx = sqlUpper.indexOf('WHERE');
        const groupIdx = sqlUpper.indexOf('GROUP BY');
        const orderIdx = sqlUpper.indexOf('ORDER BY');

        if (fromIdx > 0 && selectIdx > fromIdx) {
            result.errors.push({
                type: 'clause_order',
                message: 'SELECT must come before FROM',
                severity: 'error'
            });
        }

        if (whereIdx > 0 && fromIdx > 0 && whereIdx < fromIdx) {
            result.errors.push({
                type: 'clause_order',
                message: 'WHERE must come after FROM',
                severity: 'error'
            });
        }

        if (groupIdx > 0 && orderIdx > 0 && orderIdx < groupIdx) {
            result.warnings.push({
                type: 'clause_order',
                message: 'ORDER BY typically comes after GROUP BY',
                severity: 'warning'
            });
        }
    }

    /**
     * Check for common mistakes
     */
    static checkCommonMistakes(sql, result) {
        const sqlUpper = sql.toUpperCase();

        if (sqlUpper.includes('WHERE') && sql.match(/WHERE\s*(?:GROUP|ORDER|LIMIT|$)/i)) {
            result.errors.push({
                type: 'empty_where',
                message: 'WHERE clause is empty',
                severity: 'error',
                suggestion: 'Add a condition after WHERE or remove the WHERE clause'
            });
        }

        if (sql.match(/IN\s*\(\s*\)/i)) {
            result.errors.push({
                type: 'empty_in',
                message: 'IN clause is empty',
                severity: 'error',
                suggestion: 'Add values inside IN (...) or remove the condition'
            });
        }

        const likeMatches = sql.match(/LIKE\s+['"]([^'"]+)['"]/gi);
        if (likeMatches) {
            likeMatches.forEach(match => {
                if (!match.includes('%') && !match.includes('_')) {
                    result.warnings.push({
                        type: 'like_no_wildcard',
                        message: 'LIKE without wildcard (% or _) acts like equals',
                        severity: 'warning',
                        suggestion: 'Use = instead of LIKE, or add % wildcard'
                    });
                }
            });
        }

        if (sql.match(/JOIN\s+[\w.]+\s+AS\s+\w+\s*(?!ON)/i)) {
            result.errors.push({
                type: 'join_no_condition',
                message: 'JOIN without ON condition (will create cartesian product)',
                severity: 'error',
                suggestion: 'Add ON condition after JOIN'
            });
        }

        const hasAggregate = /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(sql);
        const hasGroupBy = sqlUpper.includes('GROUP BY');
        const hasNonAggregate = sql.match(/SELECT\s+.*?(?:,|\s+)(\w+\.\w+|\w+)(?:\s|,|FROM)/i);
        
        if (hasAggregate && hasNonAggregate && !hasGroupBy) {
            result.warnings.push({
                type: 'aggregate_no_group',
                message: 'Mixing aggregate functions with non-aggregated columns without GROUP BY',
                severity: 'warning',
                suggestion: 'Add GROUP BY clause or remove non-aggregated columns'
            });
        }

        if (sqlUpper.includes('ORDER BY')) {
            const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM/i);
            const orderMatch = sql.match(/ORDER BY\s+([\w.]+)/i);
            
            if (selectMatch && orderMatch) {
                const selectCols = selectMatch[1].toLowerCase();
                const orderCol = orderMatch[1].toLowerCase();
                
                if (!selectCols.includes(orderCol) && !selectCols.includes('*')) {
                    result.warnings.push({
                        type: 'order_not_in_select',
                        message: 'ORDER BY column not in SELECT list',
                        severity: 'warning',
                        suggestion: 'Add the ORDER BY column to your SELECT list'
                    });
                }
            }
        }
    }

    /**
     * Enhanced performance analysis
     */
    static checkPerformanceIssues(sql, result, schemaMetadata) {
        const sqlUpper = sql.toUpperCase();

        // Check for SELECT *
        if (sql.match(/SELECT\s+\*/i)) {
            result.warnings.push({
                type: 'select_star',
                message: 'Using SELECT * may retrieve unnecessary columns',
                severity: 'info',
                suggestion: 'Specify only the columns you need for better performance'
            });
        }

        // Check for missing LIMIT
        if (!sqlUpper.includes('LIMIT') && !sqlUpper.includes('TOP')) {
            result.warnings.push({
                type: 'no_limit',
                message: 'Query has no LIMIT - may return many rows',
                severity: 'info',
                suggestion: 'Add LIMIT clause for testing (e.g., LIMIT 100)'
            });
        }

        // Check for LIKE with leading wildcard
        const leadingWildcards = sql.match(/LIKE\s+['"]%/gi);
        if (leadingWildcards) {
            result.performanceHints.push({
                type: 'like_leading_wildcard',
                message: `Found ${leadingWildcards.length} LIKE pattern(s) starting with %`,
                severity: 'warning',
                impact: 'high',
                suggestion: 'Leading wildcards prevent index usage. Consider full-text search or restructure your data.'
            });
        }

        // Check for OR in WHERE
        const orCount = (sql.match(/\bOR\b/gi) || []).length;
        if (orCount > 3) {
            result.performanceHints.push({
                type: 'many_or_conditions',
                message: `Query has ${orCount} OR conditions`,
                severity: 'warning',
                impact: 'medium',
                suggestion: 'Multiple OR conditions can prevent index usage. Consider using IN clause or UNION instead.'
            });
        }

        // Check for functions on columns in WHERE
        const functionOnColumn = sql.match(/WHERE\s+[^=<>]*\w+\([^)]*\w+\.\w+[^)]*\)/i);
        if (functionOnColumn) {
            result.performanceHints.push({
                type: 'function_on_indexed_column',
                message: 'Function applied to column in WHERE clause',
                severity: 'warning',
                impact: 'high',
                suggestion: 'Functions on columns prevent index usage. Apply functions to comparison values instead (e.g., WHERE date_col > DATEADD(...) instead of WHERE DATEADD(date_col, ...) > value)'
            });
        }

        // Check for DISTINCT
        if (sqlUpper.includes('DISTINCT')) {
            result.performanceHints.push({
                type: 'distinct_usage',
                message: 'DISTINCT requires sorting and may be expensive',
                severity: 'info',
                impact: 'medium',
                suggestion: 'Ensure DISTINCT is necessary. Consider using GROUP BY or fixing data quality issues instead.'
            });
        }

        // Check for multiple JOINs
        const joinCount = (sql.match(/\bJOIN\b/gi) || []).length;
        if (joinCount >= 5) {
            result.performanceHints.push({
                type: 'many_joins',
                message: `Query has ${joinCount} JOIN operations`,
                severity: 'warning',
                impact: 'high',
                suggestion: 'Consider if all joins are necessary. Multiple joins can significantly impact performance. Review if some data can be pre-aggregated.'
            });
        }

        // Check for subqueries in SELECT
        const subqueryInSelect = sql.match(/SELECT[^FROM]+\([^)]*SELECT[^)]*\)/i);
        if (subqueryInSelect) {
            result.performanceHints.push({
                type: 'subquery_in_select',
                message: 'Subquery in SELECT clause executes for each row',
                severity: 'warning',
                impact: 'very_high',
                suggestion: 'Move subquery to JOIN or use window functions for better performance'
            });
        }
    }

    /**
     * Analyze JOIN operations
     */
    static analyzeJoins(sql, result) {
        const sqlUpper = sql.toUpperCase();
        const joins = sql.match(/\b(INNER|LEFT|RIGHT|FULL|CROSS)\s+JOIN\b/gi) || [];

        if (joins.length === 0) return;

        // Check for CROSS JOIN
        if (sqlUpper.includes('CROSS JOIN')) {
            result.warnings.push({
                type: 'cross_join',
                message: 'CROSS JOIN creates cartesian product (all combinations)',
                severity: 'warning',
                suggestion: 'Ensure CROSS JOIN is intentional - it multiplies row counts'
            });
        }

        // Analyze WHERE clauses on joined tables
        const whereMatch = sql.match(/WHERE\s+(.*?)(?:GROUP|ORDER|LIMIT|$)/is);
        if (whereMatch && joins.length > 0) {
            const whereClause = whereMatch[1];
            
            // Check if filters should be in ON clause
            joins.forEach((join, idx) => {
                if (join.toUpperCase().includes('LEFT JOIN') || join.toUpperCase().includes('RIGHT JOIN')) {
                    result.performanceHints.push({
                        type: 'where_vs_on',
                        message: `Consider moving filters on outer-joined tables to ON clause`,
                        severity: 'info',
                        impact: 'medium',
                        suggestion: 'Filters in WHERE clause are applied after joins. For outer joins, filtering the joined table in ON clause can reduce rows processed.'
                    });
                }
            });
        }

        // Suggest index hints for WHERE columns
        this.suggestIndexes(sql, result);
    }

    /**
     * Suggest indexes for WHERE clause columns
     */
    static suggestIndexes(sql, result) {
        const whereMatch = sql.match(/WHERE\s+(.*?)(?:GROUP|ORDER|LIMIT|$)/is);
        if (!whereMatch) return;

        const whereClause = whereMatch[1];
        
        // Extract columns used in WHERE conditions
        const columnMatches = whereClause.match(/(\w+)\.(\w+)\s*[=<>!]/g) || [];
        
        if (columnMatches.length > 0) {
            const columns = columnMatches.map(match => {
                const parts = match.match(/(\w+)\.(\w+)/);
                return parts ? `${parts[1]}.${parts[2]}` : null;
            }).filter(Boolean);

            if (columns.length > 0) {
                result.performanceHints.push({
                    type: 'index_suggestion',
                    message: `Consider indexes on: ${columns.join(', ')}`,
                    severity: 'info',
                    impact: 'high',
                    suggestion: `These columns are used in WHERE conditions. Adding indexes can significantly speed up query execution. Composite indexes may be beneficial for multi-column conditions.`
                });
            }
        }

        // Check for JOIN conditions
        const joinMatches = sql.match(/ON\s+(\w+\.\w+)\s*=\s*(\w+\.\w+)/gi) || [];
        if (joinMatches.length > 0) {
            const joinColumns = [];
            joinMatches.forEach(match => {
                const parts = match.match(/(\w+\.\w+)/g);
                if (parts) joinColumns.push(...parts);
            });

            if (joinColumns.length > 0) {
                result.performanceHints.push({
                    type: 'join_index_suggestion',
                    message: `Ensure indexes exist on JOIN columns: ${[...new Set(joinColumns)].join(', ')}`,
                    severity: 'info',
                    impact: 'very_high',
                    suggestion: 'JOIN operations are much faster with indexes on both sides of the condition'
                });
            }
        }
    }

    /**
     * Analyze subquery performance
     */
    static analyzeSubqueryPerformance(sql, result) {
        // Check if subqueries could be replaced with JOINs
        const inSubqueries = (sql.match(/IN\s*\([^)]*SELECT[^)]*\)/gi) || []).length;
        if (inSubqueries > 0) {
            result.performanceHints.push({
                type: 'in_subquery',
                impact: 'medium',
                message: `${inSubqueries} IN subquery/subqueries detected`,
                suggestion: 'IN subqueries can often be rewritten as JOINs for better performance'
            });
        }

        // Check for NOT IN subqueries (especially problematic)
        const notInSubqueries = (sql.match(/NOT\s+IN\s*\([^)]*SELECT[^)]*\)/gi) || []).length;
        if (notInSubqueries > 0) {
            result.performanceHints.push({
                type: 'not_in_subquery',
                impact: 'high',
                message: `${notInSubqueries} NOT IN subquery/subqueries detected`,
                suggestion: 'NOT IN with NULL values can cause unexpected results. Use NOT EXISTS or LEFT JOIN instead.'
            });
        }

        // Check for subqueries in SELECT (scalar subqueries)
        const selectSubqueries = (sql.match(/SELECT[^FROM]*\([^)]*SELECT[^)]*\)/gi) || []).length;
        if (selectSubqueries > 2) {
            result.performanceHints.push({
                type: 'scalar_subqueries',
                impact: 'high',
                message: `${selectSubqueries} scalar subqueries in SELECT clause`,
                suggestion: 'Multiple scalar subqueries execute for each row. Consider using JOINs or window functions.'
            });
        }

        // Suggest CTEs for complex subqueries
        const totalSubqueries = (sql.match(/\([^)]*SELECT[^)]*\)/gi) || []).length;
        if (totalSubqueries >= 3 && !sql.toUpperCase().includes('WITH')) {
            result.performanceHints.push({
                type: 'cte_suggestion',
                impact: 'low',
                message: `Query has ${totalSubqueries} subqueries but no CTEs`,
                suggestion: 'Consider using WITH clause (CTEs) to make complex queries more readable and potentially more efficient'
            });
        }
    }

    /**
     * Estimate query complexity/cost
     */
    // static estimateQueryCost(sql, result, schemaMetadata) {
    //     let cost = 1; // Base cost
    //     const sqlUpper = sql.toUpperCase();

    //     // Joins increase cost
    //     const joinCount = (sql.match(/\bJOIN\b/gi) || []).length;
    //     cost += joinCount * 10;

    //     // Subqueries increase cost
    //     const subqueryCount = (sql.match(/\bSELECT\b/gi) || []).length - 1;
    //     cost += subqueryCount * 15;

    //     // Aggregations increase cost
    //     const aggregateCount = (sql.match(/\b(COUNT|SUM|AVG|MIN|MAX|GROUP BY)\b/gi) || []).length;
    //     cost += aggregateCount * 5;

    //     // DISTINCT increases cost
    //     if (sqlUpper.includes('DISTINCT')) cost += 10;

    //     // ORDER BY increases cost
    //     if (sqlUpper.includes('ORDER BY')) cost += 5;

    //     // LIKE with leading wildcard significantly increases cost
    //     const leadingWildcards = (sql.match(/LIKE\s+['"]%/gi) || []).length;
    //     cost += leadingWildcards * 20;

    //     // No LIMIT increases cost
    //     if (!sqlUpper.includes('LIMIT') && !sqlUpper.includes('TOP')) {
    //         cost += 15;
    //     }

    //     // Estimate complexity level
    //     let complexity = 'Simple';
    //     if (cost >= 50) complexity = 'Complex';
    //     else if (cost >= 20) complexity = 'Moderate';

    //     result.performanceHints.push({
    //         type: 'query_complexity',
    //         message: `Query complexity: ${complexity} (cost: ${cost})`,
    //         severity: 'info',
    //         impact: complexity === 'Complex' ? 'high' : complexity === 'Moderate' ? 'medium' : 'low',
    //         suggestion: complexity === 'Complex' 
    //             ? 'Consider breaking this into smaller queries or creating materialized views'
    //             : complexity === 'Moderate'
    //                 ? 'Query is moderately complex - ensure proper indexes exist'
    //                 : 'Query is simple and should execute quickly'
    //     });
    // }

    /**
     * Calculate overall performance score
     */
    static calculatePerformanceScore(result, sql) {
        let score = 100;

        // Deduct points for issues
        result.errors.forEach(() => score -= 20);
        result.warnings.forEach(w => {
            if (w.type === 'select_star') score -= 5;
            else if (w.type === 'no_limit') score -= 10;
            else score -= 8;
        });

        result.performanceHints.forEach(hint => {
            switch (hint.impact) {
                case 'very_high': score -= 15; break;
                case 'high': score -= 10; break;
                case 'medium': score -= 5; break;
                case 'low': score -= 2; break;
                default: score -= 3;
            }
        });

        // Adjust performance score based on subqueries
        if (sql) {
            const subqueryCount = (sql.match(/\([^)]*SELECT[^)]*\)/gi) || []).length;
            if (subqueryCount > 0) {
                score -= Math.min(subqueryCount * 5, 25);
            }
        }

        // Extra penalty for correlated subqueries
        const correlatedCount = result.warnings.filter(w => w.type === 'SUBQUERY_CORRELATED').length;
        if (correlatedCount > 0) {
            score -= correlatedCount * 2; // Extra penalty on top of warning deduction
        }

        result.performanceScore = Math.max(0, Math.min(100, score));
    }

    /**
     * Check for potential security issues
     */
    static checkSecurityIssues(sql, result) {
        if (/\b(DROP|DELETE|TRUNCATE|ALTER)\b/i.test(sql)) {
            result.errors.push({
                type: 'destructive_operation',
                message: 'Destructive SQL operations are not allowed',
                severity: 'error',
                suggestion: 'Only SELECT queries are permitted'
            });
        }

        if (sql.includes(';') && sql.trim().indexOf(';') < sql.trim().length - 1) {
            result.warnings.push({
                type: 'multiple_statements',
                message: 'Multiple SQL statements detected',
                severity: 'warning',
                suggestion: 'Only single queries are allowed'
            });
        }
    }

    /**
     * Add CTE performance analysis
     */
    static analyzeCTEPerformance(sql, result) {
      // Check if CTEs are reused multiple times (good!)
      const withMatch = sql.match(/WITH\s+([\s\S]+?)(?=\n\s*(?:SELECT|INSERT|UPDATE|DELETE))/i);
      if (withMatch) {
        const ctePattern = /(\w+)\s+AS\s*\(/gi;
        const cteNames = [];
        let match;

        while ((match = ctePattern.exec(withMatch[1])) !== null) {
          cteNames.push(match[1]);
        }

        const mainQueryAndOtherCTEs = sql.substring(withMatch[0].length);
        cteNames.forEach(cteName => {
          const usageCount = (mainQueryAndOtherCTEs.match(new RegExp(`\\b${cteName}\\b`, 'gi')) || []).length;
          if (usageCount > 1) {
            result.performanceHints.push({
              impact: 'low',
              severity: 'info',
              message: `CTE "${cteName}" is referenced ${usageCount} times.`,
              suggestion: 'Reusing CTEs can improve query organization and readability. Some databases may optimize this by materializing the result.'
            });
          }
        });

        const cteCount = cteNames.length;
        if (cteCount > 5) {
            result.warnings.push({
                type: 'CTE_COMPLEXITY',
                message: `Query has ${cteCount} CTEs, which can make it hard to read and debug.`,
                severity: 'warning',
                suggestion: 'For very complex logic, consider breaking the query into multiple steps or using temporary tables.'
            });
        }
      }
    }

    /**
     * Validate builder state
     */
    static checkBuilderState(queryState, result) {
        if (queryState.columns) {
            let totalColumns = 0;
            for (const alias in queryState.columns) {
                totalColumns += queryState.columns[alias]?.size || 0;
            }
            
            if (totalColumns === 0) {
                result.errors.push({
                    type: 'no_columns',
                    message: 'No columns selected',
                    severity: 'error',
                    suggestion: 'Select at least one column'
                });
            }
        }

        if (!queryState.table || queryState.table === '') {
            result.errors.push({
                type: 'no_table',
                message: 'No table selected',
                severity: 'error',
                suggestion: 'Select a table from the schema explorer'
            });
        }

        if (queryState.joins && queryState.joins.length > 0) {
            queryState.joins.forEach((join, idx) => {
                if (!join.onLeft || !join.onRight) {
                    result.errors.push({
                        type: 'incomplete_join',
                        message: `JOIN ${idx + 1} is missing ON condition`,
                        severity: 'error',
                        suggestion: 'Specify both columns for the JOIN condition'
                    });
                }
            });
        }

        if (queryState.wheres && queryState.wheres.length > 0) {
            queryState.wheres.forEach((where, idx) => {
                if (!where.value || where.value.trim() === '') {
                    result.warnings.push({
                        type: 'empty_where_value',
                        message: `WHERE condition ${idx + 1} has no value`,
                        severity: 'warning',
                        suggestion: 'Remove empty WHERE conditions'
                    });
                }

                if (where.operator === 'IN' && !where.value.includes(',')) {
                    result.warnings.push({
                        type: 'in_single_value',
                        message: `WHERE condition ${idx + 1} uses IN with single value`,
                        severity: 'info',
                        suggestion: 'Use = instead of IN for single values'
                    });
                }
            });
        }
    }

    /**
     * Get severity color for UI display
     */
    static getSeverityColor(severity, theme = 'dark') {
        const colors = {
            error: theme === 'dark' ? 'text-red-400' : 'text-red-600',
            warning: theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600',
            info: theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
        };
        return colors[severity] || colors.info;
    }

    /**
     * Get impact color for performance hints
     */
    static getImpactColor(impact, theme = 'dark') {
        const colors = {
            very_high: theme === 'dark' ? 'text-red-400' : 'text-red-600',
            high: theme === 'dark' ? 'text-orange-400' : 'text-orange-600',
            medium: theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600',
            low: theme === 'dark' ? 'text-green-400' : 'text-green-600'
        };
        return colors[impact] || colors.medium;
    }

    /**
     * Get severity icon
     */
    static getSeverityIcon(severity) {
        const icons = {
            error: '🚫',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[severity] || '•';
    }

    /**
     * Get impact icon
     */
    static getImpactIcon(impact) {
        const icons = {
            very_high: '🔴',
            high: '🟠',
            medium: '🟡',
            low: '🟢'
        };
        return icons[impact] || '🔵';
    }
}

export default QueryValidator;
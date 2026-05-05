export const ALL_CLAUSES = [
    { name: 'WHERE', level: 'Beginner', description: 'Filters records based on specific conditions.' },
    { name: 'ORDER BY', level: 'Beginner', description: 'Sorts the result set in ascending or descending order.' },
    { name: 'JOIN', level: 'Intermediate', description: 'Combines rows from two or more tables based on a related column.' },
    { name: 'GROUP BY', level: 'Intermediate', description: 'Groups rows that have the same values into summary rows.' },
    { name: 'FUNCTION', level: 'Intermediate', description: 'Apply SQL functions (e.g., UPPER, ROUND) to columns.'},
    { name: 'HAVING', level: 'Advanced', description: 'Filters groups based on conditions after a GROUP BY.' },
];

export const ALL_FUNCTIONS = [
    { name: 'UPPER', type: 'String', args: 1, description: 'Converts a string to upper-case.'},
    { name: 'LOWER', type: 'String', args: 1, description: 'Converts a string to lower-case.'},
    { name: 'CONCAT', type: 'String', args: 2, description: 'Adds two or more strings together.'},
    { name: 'SUBSTRING', type: 'String', args: 3, special: 'substring', description: 'Extracts a substring (column, start, length).'},
    { name: 'COUNT', type: 'Aggregate', args: 1, description: 'Counts the number of rows.'},
    { name: 'SUM', type: 'Aggregate', args: 1, description: 'Calculates the sum of a set of values.'},
    { name: 'AVG', type: 'Aggregate', args: 1, description: 'Calculates the average of a set of values.'},
    { name: 'STRING_AGG', type: 'Aggregate', args: 2, special: 'string_agg', description: 'Joins strings from a group into one string with a separator.'},
    { name: 'CURRENT_DATE', type: 'Date/Time', args: 0, description: 'Returns the current date.'},
    { name: 'NOW', type: 'Date/Time', args: 0, description: 'Returns the current date and time.'},
    { name: 'EXTRACT', type: 'Date/Time', args: 2, special: 'extract', description: 'Extract a part from a date (e.g., YEAR, MONTH, DAY).'},
    { name: 'ROW_NUMBER', type: 'Window', args: 0, description: 'Assigns a unique integer to each row within a partition.'},
    { name: 'RANK', type: 'Window', args: 0, description: 'Assigns a rank to each row within a partition, with gaps for ties.'},
    { name: 'DENSE_RANK', type: 'Window', args: 0, description: 'Assigns a rank to each row within a partition, without gaps.'},
    { name: 'LEAD', type: 'Window', args: 1, description: 'Accesses data from a subsequent row in the same result set.'},
    { name: 'LAG', type: 'Window', args: 1, description: 'Accesses data from a previous row in the same result set.'},
    
    // === NEW ADVANCED FUNCTIONS - ADD THESE ===
    
    // Type Conversion
    {
        name: 'CAST',
        type: 'Conversion',
        description: 'Convert a value to a specified data type',
        args: 2, // value, target_type
        level: 'Intermediate',
        example: "CAST(price AS DECIMAL(10,2))",
        argNames: ['value', 'data_type']
    },
    {
        name: 'CONVERT',
        type: 'Conversion',
        description: 'Convert value to different data type',
        args: 2,
        level: 'Intermediate',
        example: "CONVERT(VARCHAR, order_date, 101)",
        argNames: ['data_type', 'value']
    },
    
    // Null Handling
    {
        name: 'COALESCE',
        type: 'Conditional',
        description: 'Return first non-null value',
        args: -1, // Variable arguments
        level: 'Intermediate',
        example: "COALESCE(phone, email, 'No contact')",
        argNames: ['value1', 'value2', '...']
    },
    {
        name: 'NULLIF',
        type: 'Conditional',
        description: 'Return NULL if two values are equal',
        args: 2,
        level: 'Intermediate',
        example: "NULLIF(quantity, 0)",
        argNames: ['value1', 'value2']
    },
    {
        name: 'IFNULL',
        type: 'Conditional',
        description: 'Return alternative if value is NULL',
        args: 2,
        level: 'Beginner',
        example: "IFNULL(discount, 0)",
        argNames: ['value', 'alternative']
    },
    
    // Conditional Logic
    {
        name: 'CASE',
        type: 'Conditional',
        description: 'Conditional logic (CASE WHEN THEN)',
        args: -1, // Special handling needed
        level: 'Advanced',
        example: "CASE WHEN amount > 100 THEN 'High' ELSE 'Low' END",
        argNames: ['conditions'],
        isSpecial: true
    },
    {
        name: 'IF',
        type: 'Conditional',
        description: 'Simple if-then-else',
        args: 3,
        level: 'Intermediate',
        example: "IF(quantity > 0, 'In Stock', 'Out of Stock')",
        argNames: ['condition', 'true_value', 'false_value']
    },
    
    // Math Functions
    {
        name: 'ROUND',
        type: 'Math',
        description: 'Round to specified decimal places',
        args: 2,
        level: 'Beginner',
        example: "ROUND(price, 2)",
        argNames: ['value', 'decimals']
    },
    {
        name: 'CEILING',
        type: 'Math',
        description: 'Round up to nearest integer',
        args: 1,
        level: 'Beginner',
        example: "CEILING(price)",
        argNames: ['value']
    },
    {
        name: 'FLOOR',
        type: 'Math',
        description: 'Round down to nearest integer',
        args: 1,
        level: 'Beginner',
        example: "FLOOR(price)",
        argNames: ['value']
    },
    {
        name: 'ABS',
        type: 'Math',
        description: 'Absolute value',
        args: 1,
        level: 'Beginner',
        example: "ABS(balance)",
        argNames: ['value']
    },
    {
        name: 'POWER',
        type: 'Math',
        description: 'Raise to power',
        args: 2,
        level: 'Intermediate',
        example: "POWER(base, 2)",
        argNames: ['base', 'exponent']
    },
    {
        name: 'SQRT',
        type: 'Math',
        description: 'Square root',
        args: 1,
        level: 'Intermediate',
        example: "SQRT(area)",
        argNames: ['value']
    },
    
    // Date Functions
    {
        name: 'DATE_FORMAT',
        type: 'Date',
        description: 'Format date to string',
        args: 2,
        level: 'Intermediate',
        example: "DATE_FORMAT(order_date, '%Y-%m-%d')",
        argNames: ['date', 'format']
    },
    {
        name: 'DATE_ADD',
        type: 'Date',
        description: 'Add interval to date',
        args: 2,
        level: 'Intermediate',
        example: "DATE_ADD(order_date, INTERVAL 7 DAY)",
        argNames: ['date', 'interval']
    },
    {
        name: 'DATE_DIFF',
        type: 'Date',
        description: 'Difference between dates',
        args: 2,
        level: 'Intermediate',
        example: "DATEDIFF(end_date, start_date)",
        argNames: ['date1', 'date2']
    },
    {
        name: 'YEAR',
        type: 'Date',
        description: 'Extract year from date',
        args: 1,
        level: 'Beginner',
        example: "YEAR(order_date)",
        argNames: ['date']
    },
    {
        name: 'MONTH',
        type: 'Date',
        description: 'Extract month from date',
        args: 1,
        level: 'Beginner',
        example: "MONTH(order_date)",
        argNames: ['date']
    },
    {
        name: 'DAY',
        type: 'Date',
        description: 'Extract day from date',
        args: 1,
        level: 'Beginner',
        example: "DAY(order_date)",
        argNames: ['date']
    },
    
    // Advanced Aggregate
    {
        name: 'COUNT_DISTINCT',
        type: 'Aggregate',
        description: 'Count distinct values',
        args: 1,
        level: 'Intermediate',
        example: "COUNT(DISTINCT customer_id)",
        argNames: ['column'],
        sqlFormat: 'COUNT(DISTINCT {0})'
    },
    {
        name: 'GROUP_CONCAT',
        type: 'Aggregate',
        description: 'Concatenate group values',
        args: 1,
        level: 'Advanced',
        example: "GROUP_CONCAT(product_name SEPARATOR ', ')",
        argNames: ['column']
    },
    
    // JSON Functions (if your portal supports JSON)
    {
        name: 'JSON_EXTRACT',
        type: 'JSON',
        description: 'Extract value from JSON',
        args: 2,
        level: 'Advanced',
        example: "JSON_EXTRACT(metadata, '$.price')",
        argNames: ['json_column', 'path']
    },
];

// Also update the function type filter in SchemaPanel if needed
export const FUNCTION_TYPES = [
    'String',
    'Math',
    'Date',
    'Aggregate',
    'Window',
    'Conversion',    // NEW
    'Conditional',   // NEW
    'JSON'          // NEW
];

// Advanced SQL Functions
export const advancedFunctions = {
  // ==================== CAST & TYPE CONVERSION ====================
  cast: {
    category: 'Type Conversion',
    levels: ['Intermediate', 'Advanced'],
    syntax: 'CAST(column AS type)',
    example: 'CAST(price AS INTEGER)',
    description: 'Convert a value to a specific data type',
    types: ['INTEGER', 'BIGINT', 'DECIMAL', 'NUMERIC', 'REAL', 'DOUBLE PRECISION', 
            'VARCHAR', 'TEXT', 'DATE', 'TIMESTAMP', 'BOOLEAN', 'JSON', 'JSONB'],
    template: (column, type) => `CAST(${column} AS ${type})`
  },
  
  pgCast: {
    category: 'Type Conversion',
    levels: ['Advanced'],
    syntax: 'column::type',
    example: 'price::INTEGER',
    description: 'PostgreSQL shorthand for CAST',
    types: ['INTEGER', 'BIGINT', 'TEXT', 'DATE', 'TIMESTAMP', 'JSONB'],
    template: (column, type) => `${column}::${type}`
  },

  to_number: {
    category: 'Type Conversion',
    levels: ['Intermediate', 'Advanced'],
    syntax: 'TO_NUMBER(text, format)',
    example: "TO_NUMBER('$1,234.56', '$999,999.99')",
    description: 'Convert text to number with format',
    template: (text, format = '999999.99') => `TO_NUMBER(${text}, '${format}')`
  },

  to_char: {
    category: 'Type Conversion',
    levels: ['Intermediate', 'Advanced'],
    syntax: 'TO_CHAR(value, format)',
    example: "TO_CHAR(date_column, 'YYYY-MM-DD')",
    description: 'Convert value to formatted text',
    template: (value, format = 'YYYY-MM-DD') => `TO_CHAR(${value}, '${format}')`
  },

  // ==================== ADVANCED STRING FUNCTIONS ====================
  regexp_replace: {
    category: 'String',
    levels: ['Advanced'],
    syntax: 'REGEXP_REPLACE(string, pattern, replacement)',
    example: "REGEXP_REPLACE(phone, '[^0-9]', '')",
    description: 'Replace text using regular expressions',
    template: (string, pattern, replacement = '') => 
      `REGEXP_REPLACE(${string}, '${pattern}', '${replacement}')`
  },

  regexp_match: {
    category: 'String',
    levels: ['Advanced'],
    syntax: 'REGEXP_MATCH(string, pattern)',
    example: "REGEXP_MATCH(email, '@([a-z]+\\.[a-z]+)')",
    description: 'Extract text matching a pattern',
    template: (string, pattern) => `REGEXP_MATCH(${string}, '${pattern}')`
  },

  string_agg: {
    category: 'Aggregate',
    levels: ['Advanced'],
    syntax: 'STRING_AGG(column, delimiter)',
    example: "STRING_AGG(name, ', ')",
    description: 'Concatenate strings from multiple rows',
    template: (column, delimiter = ', ') => `STRING_AGG(${column}, '${delimiter}')`
  },

  format: {
    category: 'String',
    levels: ['Advanced'],
    syntax: 'FORMAT(template, args...)',
    example: "FORMAT('Hello %s, you have %s messages', name, count)",
    description: 'Format string with placeholders',
    template: (template, ...args) => `FORMAT('${template}', ${args.join(', ')})`
  },

  split_part: {
    category: 'String',
    levels: ['Intermediate', 'Advanced'],
    syntax: 'SPLIT_PART(string, delimiter, position)',
    example: "SPLIT_PART(email, '@', 2)",
    description: 'Split string and return specific part',
    template: (string, delimiter, position) => 
      `SPLIT_PART(${string}, '${delimiter}', ${position})`
  },

  reverse: {
    category: 'String',
    levels: ['Intermediate', 'Advanced'],
    syntax: 'REVERSE(string)',
    example: 'REVERSE(name)',
    description: 'Reverse the order of characters',
    template: (string) => `REVERSE(${string})`
  },

  repeat: {
    category: 'String',
    levels: ['Intermediate', 'Advanced'],
    syntax: 'REPEAT(string, count)',
    example: "REPEAT('*', 5)",
    description: 'Repeat string N times',
    template: (string, count) => `REPEAT(${string}, ${count})`
  },

  // ==================== JSON FUNCTIONS ====================
  json_extract: {
    category: 'JSON',
    levels: ['Advanced'],
    syntax: 'JSON_EXTRACT(json_column, path)',
    example: "JSON_EXTRACT(data, '$.user.name')",
    description: 'Extract value from JSON by path',
    template: (column, path) => `JSON_EXTRACT(${column}, '${path}')`
  },

  jsonb_extract_path: {
    category: 'JSON',
    levels: ['Advanced'],
    syntax: 'JSONB_EXTRACT_PATH(jsonb_column, keys...)',
    example: "JSONB_EXTRACT_PATH(data, 'user', 'name')",
    description: 'PostgreSQL: Extract nested JSON value',
    template: (column, ...keys) => 
      `JSONB_EXTRACT_PATH(${column}, ${keys.map(k => `'${k}'`).join(', ')})`
  },

  json_arrow: {
    category: 'JSON',
    levels: ['Advanced'],
    syntax: "json_column->'key' or json_column->>'key'",
    example: "data->'user'->>'name'",
    description: 'PostgreSQL JSON operators (-> returns JSON, ->> returns text)',
    template: (column, key, asText = false) => 
      asText ? `${column}->>'${key}'` : `${column}->'${key}'`
  },

  json_array_elements: {
    category: 'JSON',
    levels: ['Advanced'],
    syntax: 'JSON_ARRAY_ELEMENTS(json_array)',
    example: 'JSON_ARRAY_ELEMENTS(tags)',
    description: 'Expand JSON array to rows',
    template: (column) => `JSON_ARRAY_ELEMENTS(${column})`
  },

  json_agg: {
    category: 'Aggregate',
    levels: ['Advanced'],
    syntax: 'JSON_AGG(column)',
    example: 'JSON_AGG(product_name)',
    description: 'Aggregate rows into JSON array',
    template: (column) => `JSON_AGG(${column})`
  },

  jsonb_build_object: {
    category: 'JSON',
    levels: ['Advanced'],
    syntax: "JSONB_BUILD_OBJECT('key', value, ...)",
    example: "JSONB_BUILD_OBJECT('id', user_id, 'name', user_name)",
    description: 'Create JSON object from key-value pairs',
    template: (...keyValuePairs) => {
      const pairs = keyValuePairs.map(kv => `'${kv.key}', ${kv.value}`).join(', ');
      return `JSONB_BUILD_OBJECT(${pairs})`;
    }
  },

  // ==================== ADVANCED DATE/TIME FUNCTIONS ====================
  date_trunc: {
    category: 'Date',
    levels: ['Intermediate', 'Advanced'],
    syntax: 'DATE_TRUNC(unit, timestamp)',
    example: "DATE_TRUNC('month', created_at)",
    description: 'Truncate date to specified precision',
    units: ['microseconds', 'milliseconds', 'second', 'minute', 'hour', 
            'day', 'week', 'month', 'quarter', 'year', 'decade', 'century'],
    template: (unit, timestamp) => `DATE_TRUNC('${unit}', ${timestamp})`
  },

  extract: {
    category: 'Date',
    levels: ['Intermediate', 'Advanced'],
    syntax: 'EXTRACT(field FROM timestamp)',
    example: "EXTRACT(YEAR FROM created_at)",
    description: 'Extract specific field from date/time',
    fields: ['YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND', 
             'DOW', 'DOY', 'WEEK', 'QUARTER', 'EPOCH'],
    template: (field, timestamp) => `EXTRACT(${field} FROM ${timestamp})`
  },

  date_part: {
    category: 'Date',
    levels: ['Intermediate', 'Advanced'],
    syntax: 'DATE_PART(field, timestamp)',
    example: "DATE_PART('year', created_at)",
    description: 'PostgreSQL: Extract date/time field',
    template: (field, timestamp) => `DATE_PART('${field}', ${timestamp})`
  },

  age: {
    category: 'Date',
    levels: ['Advanced'],
    syntax: 'AGE(timestamp1, timestamp2)',
    example: 'AGE(NOW(), birth_date)',
    description: 'Calculate interval between two timestamps',
    template: (timestamp1, timestamp2 = 'CURRENT_TIMESTAMP') => 
      `AGE(${timestamp1}, ${timestamp2})`
  },

  interval: {
    category: 'Date',
    levels: ['Intermediate', 'Advanced'],
    syntax: "INTERVAL 'quantity unit'",
    example: "created_at + INTERVAL '7 days'",
    description: 'Create time interval for date arithmetic',
    units: ['second', 'minute', 'hour', 'day', 'week', 'month', 'year'],
    template: (quantity, unit) => `INTERVAL '${quantity} ${unit}'`
  },

  make_date: {
    category: 'Date',
    levels: ['Intermediate', 'Advanced'],
    syntax: 'MAKE_DATE(year, month, day)',
    example: 'MAKE_DATE(2024, 12, 25)',
    description: 'Create date from year, month, day',
    template: (year, month, day) => `MAKE_DATE(${year}, ${month}, ${day})`
  },

  make_timestamp: {
    category: 'Date',
    levels: ['Advanced'],
    syntax: 'MAKE_TIMESTAMP(year, month, day, hour, min, sec)',
    example: 'MAKE_TIMESTAMP(2024, 12, 25, 10, 30, 0)',
    description: 'Create timestamp from components',
    template: (year, month, day, hour, min, sec) => 
      `MAKE_TIMESTAMP(${year}, ${month}, ${day}, ${hour}, ${min}, ${sec})`
  },

  // ==================== CONDITIONAL FUNCTIONS ====================
  nullif: {
    category: 'Conditional',
    levels: ['Intermediate', 'Advanced'],
    syntax: 'NULLIF(value1, value2)',
    example: "NULLIF(status, '')",
    description: 'Return NULL if values are equal, otherwise return first value',
    template: (value1, value2) => `NULLIF(${value1}, ${value2})`
  },

  greatest: {
    category: 'Conditional',
    levels: ['Intermediate', 'Advanced'],
    syntax: 'GREATEST(value1, value2, ...)',
    example: 'GREATEST(price1, price2, price3)',
    description: 'Return the largest value from a list',
    template: (...values) => `GREATEST(${values.join(', ')})`
  },

  least: {
    category: 'Conditional',
    levels: ['Intermediate', 'Advanced'],
    syntax: 'LEAST(value1, value2, ...)',
    example: 'LEAST(price1, price2, price3)',
    description: 'Return the smallest value from a list',
    template: (...values) => `LEAST(${values.join(', ')})`
  },

  case_simple: {
    category: 'Conditional',
    levels: ['Intermediate', 'Advanced'],
    syntax: 'CASE column WHEN value THEN result ... END',
    example: "CASE status WHEN 'active' THEN 1 WHEN 'inactive' THEN 0 END",
    description: 'Simple CASE expression',
    template: (column, cases, defaultValue = 'NULL') => {
      const whenClauses = cases.map(c => 
        `WHEN ${c.when} THEN ${c.then}`
      ).join(' ');
      return `CASE ${column} ${whenClauses} ELSE ${defaultValue} END`;
    }
  },

  case_searched: {
    category: 'Conditional',
    levels: ['Advanced'],
    syntax: 'CASE WHEN condition THEN result ... END',
    example: "CASE WHEN age < 18 THEN 'minor' WHEN age >= 65 THEN 'senior' ELSE 'adult' END",
    description: 'Searched CASE expression with conditions',
    template: (conditions, defaultValue = 'NULL') => {
      const whenClauses = conditions.map(c => 
        `WHEN ${c.condition} THEN ${c.result}`
      ).join(' ');
      return `CASE ${whenClauses} ELSE ${defaultValue} END`;
    }
  },

  // ==================== ARRAY & AGGREGATE FUNCTIONS ====================
  array_agg: {
    category: 'Aggregate',
    levels: ['Advanced'],
    syntax: 'ARRAY_AGG(column)',
    example: 'ARRAY_AGG(product_name ORDER BY price DESC)',
    description: 'Aggregate values into array',
    template: (column, orderBy = null) => 
      orderBy ? `ARRAY_AGG(${column} ORDER BY ${orderBy})` : `ARRAY_AGG(${column})`
  },

  array_length: {
    category: 'Array',
    levels: ['Advanced'],
    syntax: 'ARRAY_LENGTH(array, dimension)',
    example: 'ARRAY_LENGTH(tags, 1)',
    description: 'Get length of array',
    template: (array, dimension = 1) => `ARRAY_LENGTH(${array}, ${dimension})`
  },

  unnest: {
    category: 'Array',
    levels: ['Advanced'],
    syntax: 'UNNEST(array)',
    example: 'UNNEST(tags)',
    description: 'Expand array to rows',
    template: (array) => `UNNEST(${array})`
  },

  array_to_string: {
    category: 'Array',
    levels: ['Advanced'],
    syntax: 'ARRAY_TO_STRING(array, delimiter)',
    example: "ARRAY_TO_STRING(tags, ', ')",
    description: 'Convert array to delimited string',
    template: (array, delimiter = ', ') => `ARRAY_TO_STRING(${array}, '${delimiter}')`
  },

  // ==================== WINDOW FUNCTION ENHANCEMENTS ====================
  ntile: {
    category: 'Window',
    levels: ['Advanced'],
    syntax: 'NTILE(n) OVER (ORDER BY column)',
    example: 'NTILE(4) OVER (ORDER BY sales DESC)',
    description: 'Divide rows into N groups (quartiles, percentiles)',
    template: (n, orderBy) => `NTILE(${n}) OVER (ORDER BY ${orderBy})`
  },

  percent_rank: {
    category: 'Window',
    levels: ['Advanced'],
    syntax: 'PERCENT_RANK() OVER (ORDER BY column)',
    example: 'PERCENT_RANK() OVER (ORDER BY score)',
    description: 'Calculate relative rank as percentage (0 to 1)',
    template: (orderBy) => `PERCENT_RANK() OVER (ORDER BY ${orderBy})`
  },

  cume_dist: {
    category: 'Window',
    levels: ['Advanced'],
    syntax: 'CUME_DIST() OVER (ORDER BY column)',
    example: 'CUME_DIST() OVER (ORDER BY score)',
    description: 'Calculate cumulative distribution',
    template: (orderBy) => `CUME_DIST() OVER (ORDER BY ${orderBy})`
  },

  first_value: {
    category: 'Window',
    levels: ['Advanced'],
    syntax: 'FIRST_VALUE(column) OVER (PARTITION BY ... ORDER BY ...)',
    example: 'FIRST_VALUE(price) OVER (PARTITION BY category ORDER BY date)',
    description: 'Get first value in window frame',
    template: (column, partitionBy = null, orderBy = null) => {
      let sql = `FIRST_VALUE(${column}) OVER (`;
      if (partitionBy) sql += `PARTITION BY ${partitionBy} `;
      if (orderBy) sql += `ORDER BY ${orderBy}`;
      sql += ')';
      return sql;
    }
  },

  last_value: {
    category: 'Window',
    levels: ['Advanced'],
    syntax: 'LAST_VALUE(column) OVER (PARTITION BY ... ORDER BY ...)',
    example: 'LAST_VALUE(price) OVER (PARTITION BY category ORDER BY date)',
    description: 'Get last value in window frame',
    template: (column, partitionBy = null, orderBy = null) => {
      let sql = `LAST_VALUE(${column}) OVER (`;
      if (partitionBy) sql += `PARTITION BY ${partitionBy} `;
      if (orderBy) sql += `ORDER BY ${orderBy}`;
      sql += ')';
      return sql;
    }
  },

  // ==================== MATH FUNCTIONS ====================
  round_precision: {
    category: 'Math',
    levels: ['Intermediate', 'Advanced'],
    syntax: 'ROUND(number, precision)',
    example: 'ROUND(price, 2)',
    description: 'Round number to specified decimal places',
    template: (number, precision = 0) => `ROUND(${number}, ${precision})`
  },

  trunc: {
    category: 'Math',
    levels: ['Intermediate', 'Advanced'],
    syntax: 'TRUNC(number, precision)',
    example: 'TRUNC(price, 2)',
    description: 'Truncate number to specified decimal places',
    template: (number, precision = 0) => `TRUNC(${number}, ${precision})`
  },

  mod: {
    category: 'Math',
    levels: ['Intermediate', 'Advanced'],
    syntax: 'MOD(dividend, divisor)',
    example: 'MOD(value, 10)',
    description: 'Get remainder of division',
    template: (dividend, divisor) => `MOD(${dividend}, ${divisor})`
  },

  power: {
    category: 'Math',
    levels: ['Intermediate', 'Advanced'],
    syntax: 'POWER(base, exponent)',
    example: 'POWER(quantity, 2)',
    description: 'Raise number to power',
    template: (base, exponent) => `POWER(${base}, ${exponent})`
  },

  sqrt: {
    category: 'Math',
    levels: ['Intermediate', 'Advanced'],
    syntax: 'SQRT(number)',
    example: 'SQRT(area)',
    description: 'Calculate square root',
    template: (number) => `SQRT(${number})`
  },

  ln: {
    category: 'Math',
    levels: ['Advanced'],
    syntax: 'LN(number)',
    example: 'LN(value)',
    description: 'Calculate natural logarithm',
    template: (number) => `LN(${number})`
  },

  log: {
    category: 'Math',
    levels: ['Advanced'],
    syntax: 'LOG(base, number)',
    example: 'LOG(10, value)',
    description: 'Calculate logarithm with specified base',
    template: (base, number) => `LOG(${base}, ${number})`
  }
};

// Export organized by category for UI display
export const functionsByCategory = {
  'Type Conversion': ['cast', 'pgCast', 'to_number', 'to_char'],
  'String': ['regexp_replace', 'regexp_match', 'format', 'split_part', 'reverse', 'repeat'],
  'JSON': ['json_extract', 'jsonb_extract_path', 'json_arrow', 'json_array_elements', 'jsonb_build_object'],
  'Date': ['date_trunc', 'extract', 'date_part', 'age', 'interval', 'make_date', 'make_timestamp'],
  'Conditional': ['nullif', 'greatest', 'least', 'case_simple', 'case_searched'],
  'Array': ['array_length', 'unnest', 'array_to_string'],
  'Aggregate': ['string_agg', 'json_agg', 'array_agg'],
  'Window': ['ntile', 'percent_rank', 'cume_dist', 'first_value', 'last_value'],
  'Math': ['round_precision', 'trunc', 'mod', 'power', 'sqrt', 'ln', 'log']
};

// Export function count by user level
export const functionCountByLevel = {
  'Beginner': 0,
  'Intermediate': 22,
  'Advanced': 45
};

import React, { useState } from 'react';

/**
 * Draggable Column Component
 * Makes columns draggable from schema explorer
 */
export const DraggableColumn = ({ column, table, schema, children, className = '' }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);
    
    // Set drag data
    const columnData = {
      column,
      table,
      schema,
      fullName: `${table}.${column}`
    };
    
    e.dataTransfer.setData('application/json', JSON.stringify(columnData));
    e.dataTransfer.effectAllowed = 'copy';
    
    // Visual feedback
    e.dataTransfer.setDragImage(e.target, 0, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        ${className}
        ${isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab'}
        transition-opacity
      `}
      title="Drag to add to query"
    >
      {children}
    </div>
  );
};

/**
 * Drop Zone Component
 * Accepts dropped columns
 */
export const DropZone = ({ onDrop, label, className = '', emptyMessage = 'Drop columns here' }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);

    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const columnData = JSON.parse(data);
        onDrop(columnData);
      }
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        ${className}
        ${isOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-400 dark:border-gray-600'}
        border-2 border-dashed rounded-lg p-4 transition-all
      `}
    >
      {label && (
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </div>
      )}
      <div className={`text-sm ${isOver ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
        {isOver ? '📥 Drop here' : emptyMessage}
      </div>
    </div>
  );
};

/**
 * Draggable Column List Item
 * Enhanced column display with drag handle
 */
export const DraggableColumnItem = ({ column, table, schema, onAddToQuery }) => {
  return (
    <DraggableColumn
      column={column}
      table={table}
      schema={schema}
      className="group"
    >
      <div className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
        <div className="flex items-center gap-2 flex-1">
          {/* Drag Handle */}
          <span className="text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-300">
            ⋮⋮
          </span>
          
          {/* Column Name */}
          <span className="text-gray-900 dark:text-white font-mono text-sm">
            {column}
          </span>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={() => onAddToQuery({ column, table, schema, fullName: `${table}.${column}` })}
          className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-opacity"
          title="Add to SELECT"
        >
          +
        </button>
      </div>
    </DraggableColumn>
  );
};

/**
 * Drop Zone for SELECT columns
 */
export const SelectDropZone = ({ columns, onAddColumn, onRemoveColumn }) => {
  const handleDrop = (columnData) => {
    onAddColumn(columnData.fullName);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        SELECT Columns
      </label>

      {/* Existing Columns */}
      {columns && columns.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {Array.from(columns).map(col => (
            <span
              key={col}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
            >
              {col}
              <button
                onClick={() => onRemoveColumn(col)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Drop Zone */}
      <DropZone
        onDrop={handleDrop}
        emptyMessage="🎯 Drag columns here or use the + button"
        className={columns && columns.size > 0 ? 'min-h-[60px]' : 'min-h-[100px]'}
      />
    </div>
  );
};

/**
 * Drop Zone for WHERE conditions
 */
export const WhereDropZone = ({ conditions, onAddCondition }) => {
  const handleDrop = (columnData) => {
    // Add new WHERE condition with the dropped column
    onAddCondition({
      column: columnData.fullName,
      operator: '=',
      values: ''
    });
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        WHERE Conditions
      </label>

      <DropZone
        onDrop={handleDrop}
        emptyMessage="🎯 Drag columns here to create conditions"
        className="min-h-[80px]"
      />

      {conditions && conditions.length > 0 && (
        <div className="text-xs text-gray-800 dark:text-gray-400 mt-2">
          💡 Tip: Drag columns to quickly add WHERE conditions
        </div>
      )}
    </div>
  );
};

/**
 * Drop Zone for GROUP BY
 */
export const GroupByDropZone = ({ groupBy, onAddGroupBy, onRemoveGroupBy }) => {
  const handleDrop = (columnData) => {
    onAddGroupBy(columnData.fullName);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        GROUP BY
      </label>

      {groupBy && groupBy.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {groupBy.map((col, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm"
            >
              {col}
              <button
                onClick={() => onRemoveGroupBy(index)}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <DropZone
        onDrop={handleDrop}
        emptyMessage="🎯 Drag columns to group by"
        className="min-h-[60px]"
      />
    </div>
  );
};

/**
 * Drop Zone for ORDER BY
 */
export const OrderByDropZone = ({ orderBy, onAddOrderBy, onRemoveOrderBy, onToggleDirection }) => {
  const handleDrop = (columnData) => {
    onAddOrderBy({
      column: columnData.fullName,
      direction: 'ASC'
    });
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        ORDER BY
      </label>

      {orderBy && orderBy.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {orderBy.map((order, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm"
            >
              {order.column}
              <button
                onClick={() => onToggleDirection(index)}
                className="px-1 bg-green-200 dark:bg-green-800 rounded text-xs font-bold"
                title="Toggle direction"
              >
                {order.direction}
              </button>
              <button
                onClick={() => onRemoveOrderBy(index)}
                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <DropZone
        onDrop={handleDrop}
        emptyMessage="🎯 Drag columns to order by"
        className="min-h-[60px]"
      />
    </div>
  );
};

export default DraggableColumn;
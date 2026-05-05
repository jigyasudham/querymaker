import React, { useState, useMemo } from 'react';

/**
 * Enhanced Query History Component
 * Features: Search, filters, tags, favorites, sorting
 */
const EnhancedQueryHistory = ({ 
  queries = [], 
  onLoadQuery, 
  onDeleteQuery,
  onUpdateQuery,
  currentUser 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, success, failed
  const [filterDate, setFilterDate] = useState('all'); // all, today, week, month
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, name-asc
  const [selectedTags, setSelectedTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [newTag, setNewTag] = useState('');

  // Get all unique tags from queries
  const allTags = useMemo(() => {
    const tags = new Set();
    queries.forEach(q => {
      if (q.tags && Array.isArray(q.tags)) {
        q.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [queries]);

  // Filter and sort queries
  const filteredQueries = useMemo(() => {
    let filtered = [...queries];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.sql?.toLowerCase().includes(search) ||
        q.name?.toLowerCase().includes(search) ||
        q.user?.toLowerCase().includes(search) ||
        q.tags?.some(tag => tag.toLowerCase().includes(search))
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(q => {
        if (filterStatus === 'success') return q.success !== false;
        if (filterStatus === 'failed') return q.success === false;
        return true;
      });
    }

    // Date filter
    if (filterDate !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(q => {
        const queryDate = new Date(q.timestamp);
        if (filterDate === 'today') return queryDate >= today;
        if (filterDate === 'week') return queryDate >= weekAgo;
        if (filterDate === 'month') return queryDate >= monthAgo;
        return true;
      });
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(q => 
        q.tags && selectedTags.some(tag => q.tags.includes(tag))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.timestamp) - new Date(a.timestamp);
      }
      if (sortBy === 'date-asc') {
        return new Date(a.timestamp) - new Date(b.timestamp);
      }
      if (sortBy === 'name-asc') {
        return (a.name || a.sql).localeCompare(b.name || b.sql);
      }
      return 0;
    });

    return filtered;
  }, [queries, searchTerm, filterStatus, filterDate, selectedTags, sortBy]);

  // Toggle favorite
  const handleToggleFavorite = (queryId) => {
    const query = queries.find(q => q.id === queryId);
    if (query) {
      onUpdateQuery(queryId, { ...query, favorite: !query.favorite });
    }
  };

  // Add tag to query
  const handleAddTag = (queryId, tag) => {
    const query = queries.find(q => q.id === queryId);
    if (query) {
      const tags = query.tags || [];
      if (!tags.includes(tag)) {
        onUpdateQuery(queryId, { ...query, tags: [...tags, tag] });
      }
    }
    setEditingTag(null);
    setNewTag('');
  };

  // Remove tag from query
  const handleRemoveTag = (queryId, tagToRemove) => {
    const query = queries.find(q => q.id === queryId);
    if (query && query.tags) {
      const tags = query.tags.filter(t => t !== tagToRemove);
      onUpdateQuery(queryId, { ...query, tags });
    }
  };

  // Toggle tag filter
  const toggleTagFilter = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterDate('all');
    setSelectedTags([]);
    setSortBy('date-desc');
  };

  // Format date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const activeFiltersCount = 
    (searchTerm ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (filterDate !== 'all' ? 1 : 0) +
    selectedTags.length;

  return (
    <div className="space-y-4">
      {/* Header with Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center gap-3 mb-4">
          {/* Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search queries by SQL, name, user, or tags..."
              className="w-full px-4 py-2 pl-10 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded border-2 transition-colors ${
              activeFiltersCount > 0
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            🎛️ Filters
            {activeFiltersCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <div className="flex gap-2">
                {['all', 'success', 'failed'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded capitalize ${
                      filterStatus === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {status === 'all' ? 'All' : status === 'success' ? '✓ Success' : '✗ Failed'}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <div className="flex gap-2">
                {['all', 'today', 'week', 'month'].map(date => (
                  <button
                    key={date}
                    onClick={() => setFilterDate(date)}
                    className={`px-4 py-2 rounded capitalize ${
                      filterDate === date
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {date === 'all' ? 'All Time' : date === 'today' ? 'Today' : date === 'week' ? 'This Week' : 'This Month'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTagFilter(tag)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedTags.includes(tag)
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-800 dark:text-gray-400">
        {filteredQueries.length === queries.length ? (
          <span>Showing all {queries.length} queries</span>
        ) : (
          <span>Found {filteredQueries.length} of {queries.length} queries</span>
        )}
      </div>

      {/* Query List */}
      <div className="space-y-3">
        {filteredQueries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-lg text-gray-800 dark:text-gray-400">
              {queries.length === 0 ? 'No queries yet' : 'No queries match your filters'}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredQueries.map(query => (
            <div
              key={query.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-4">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Favorite Star */}
                    <button
                      onClick={() => handleToggleFavorite(query.id)}
                      className={`text-2xl ${
                        query.favorite 
                          ? 'text-yellow-500' 
                          : 'text-gray-300 dark:text-gray-800 hover:text-yellow-500'
                      }`}
                      title={query.favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {query.favorite ? '⭐' : '☆'}
                    </button>

                    {/* Query Name/Title */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {query.name || 'Unnamed Query'}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-400 mt-1">
                        <span>👤 {query.user || currentUser}</span>
                        <span>📅 {formatDate(query.timestamp)}</span>
                        {query.success === false && (
                          <span className="text-red-600 dark:text-red-400">❌ Failed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onLoadQuery(query)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(query.sql)}
                      className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => onDeleteQuery(query.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {query.tags && query.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(query.id, tag)}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  
                  {/* Add Tag */}
                  {editingTag === query.id ? (
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newTag.trim()) {
                            handleAddTag(query.id, newTag.trim());
                          }
                        }}
                        placeholder="tag name"
                        className="px-2 py-1 text-xs border border-purple-300 dark:border-purple-700 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-24"
                        autoFocus
                      />
                      <button
                        onClick={() => newTag.trim() && handleAddTag(query.id, newTag.trim())}
                        className="px-2 py-1 bg-purple-600 text-white rounded text-xs"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => {
                          setEditingTag(null);
                          setNewTag('');
                        }}
                        className="px-2 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs"
                      >
                        ✗
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingTag(query.id)}
                      className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-400 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      + Add Tag
                    </button>
                  )}
                </div>

                {/* SQL Preview */}
                <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs font-mono text-gray-800 dark:text-gray-200 overflow-x-auto max-h-32 overflow-y-auto">
                  {query.sql}
                </pre>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EnhancedQueryHistory;
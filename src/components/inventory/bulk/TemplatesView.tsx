import React from 'react';
import { useBulkAdd } from './BulkAddProvider';
import { useProductTemplates } from '../../../hooks/useProductTemplates';
import TemplatesGrid from './TemplatesGrid';
import TemplatesSearch from './TemplatesSearch';


const TemplatesView: React.FC = () => {
  const { selectedTemplates, toggleTemplate } = useBulkAdd();
  const {
    templates,
    loading,
    error,
    searchTerm,
    selectedCategory,
    selectedCategories,
    categories,
    searchTemplates,
    filterByCategory,
    toggleCategory,
    clearFilters,
    isOnline,
    templateCounts,
    searchSuggestions,
    searchHistory,
    isSearching,
    totalItems
  } = useProductTemplates();

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filters */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Browse Product Templates</h3>
            <p className="text-sm text-muted-foreground">
              Select templates to add to your spreadsheet
            </p>
          </div>
          {!isOnline && (
            <div className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full text-xs font-medium">
              Offline Mode
            </div>
          )}
        </div>
        
        <TemplatesSearch
          searchTerm={searchTerm}
          onSearchChange={searchTemplates}
          selectedCategory={selectedCategory}
          selectedCategories={selectedCategories}
          categories={categories}
          onCategoryChange={filterByCategory}
          onCategoryToggle={toggleCategory}
          onClearFilters={clearFilters}
          templatesCount={templates.length}
          templateCounts={templateCounts}
          searchSuggestions={searchSuggestions}
          searchHistory={searchHistory}
          onSearchSuggestionSelect={searchTemplates}
          isSearching={isSearching}
          totalItems={totalItems}
        />
        
      </div>
      
      {/* Templates Grid */}
      <div className="flex-1 overflow-hidden">
        <TemplatesGrid
          templates={templates}
          selectedTemplates={selectedTemplates}
          onTemplateSelect={toggleTemplate}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};

export default TemplatesView;
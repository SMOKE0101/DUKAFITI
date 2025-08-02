import React from 'react';
import { useBulkAdd } from './BulkAddProvider';
import { useProductTemplates } from '../../../hooks/useProductTemplates';
import TemplatesGrid from './TemplatesGrid';
import SimpleTemplateSearch from './SimpleTemplateSearch';
import TemplateLoadingStatus from './TemplateLoadingStatus';
import TemplateDebugPanel from './TemplateDebugPanel';
import TemplateCacheManager from './TemplateCacheManager';


const TemplatesView: React.FC = () => {
  const { selectedTemplates, toggleTemplate } = useBulkAdd();
  const {
    templates,
    loading,
    error,
    searchTerm,
    selectedCategory,
    categories,
    searchTemplates,
    filterByCategory,
    clearFilters,
    isOnline,
    totalTemplates
  } = useProductTemplates();

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filters */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Browse Product Templates</h3>
            <p className="text-sm text-muted-foreground">
              Select from {totalTemplates.toLocaleString()}+ templates to add to your spreadsheet
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <div className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full text-xs font-medium">
                Offline Mode
              </div>
            )}
            {loading && (
              <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-medium">
                Loading templates...
              </div>
            )}
          </div>
        </div>
        
        <TemplateLoadingStatus
          totalTemplates={totalTemplates}
          loading={loading}
          error={error}
          isOnline={isOnline}
          className="mb-4"
        />
        
        <SimpleTemplateSearch
          searchTerm={searchTerm}
          onSearchChange={searchTemplates}
          selectedCategory={selectedCategory}
          categories={categories}
          onCategoryChange={filterByCategory}
          onClearFilters={clearFilters}
          resultsCount={templates.length}
          totalItems={totalTemplates}
          loading={loading}
        />

        {/* Cache Manager - always show for manual control */}
        <TemplateCacheManager />

        {/* Debug Panel - for troubleshooting template loading issues */}
        {(error || totalTemplates < 7000) && (
          <TemplateDebugPanel className="mt-4" />
        )}
        
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
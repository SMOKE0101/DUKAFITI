import React, { useState, useEffect, useRef } from 'react';
import { useBulkAdd } from './BulkAddProvider';
import { useProductTemplates } from '../../../hooks/useProductTemplates';
import ResponsiveProductGrid from '../../ui/responsive-product-grid';
import SimpleTemplateSearch from './SimpleTemplateSearch';
import TemplateLoadingStatus from './TemplateLoadingStatus';
import TemplateDebugPanel from './TemplateDebugPanel';
import TemplateCacheManager from './TemplateCacheManager';
import ImageDownloadButton from './ImageDownloadButton';


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
              Select from {totalTemplates > 0 ? totalTemplates.toLocaleString() : '7,344+'} templates to add to your spreadsheet
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

        {/* Cache Manager and Image Download */}
        <div className="flex items-center gap-4 mt-4">
          <TemplateCacheManager />
          <ImageDownloadButton />
        </div>

        {/* Debug Panel - for troubleshooting template loading issues */}
        {(error || totalTemplates < 7344) && (
          <TemplateDebugPanel className="mt-4" />
        )}

        
      </div>
      
      {/* Templates Grid */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
            {Array.from({ length: 24 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-square mb-2"></div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 mb-1"></div>
                <div className="bg-gray-200 dark:bg-gray-700 rounded h-3 w-2/3"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Failed to load templates
              </div>
              <p className="text-gray-500 dark:text-gray-400">{error}</p>
            </div>
          </div>
        ) : (
          <div className="overflow-auto h-full p-4">
            <ResponsiveProductGrid
              products={templates}
              variant="template"
              selectedProducts={selectedTemplates}
              onSelect={toggleTemplate}
              gridConfig={{
                cols: { mobile: 2, tablet: 3, desktop: 5 },
                gap: 'gap-3'
              }}
              emptyStateMessage="No templates found"
              emptyStateDescription="Try adjusting your search or category filter"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatesView;
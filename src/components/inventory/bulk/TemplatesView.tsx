import React, { useState, useEffect, useRef } from 'react';
import { useBulkAdd } from './BulkAddProvider';
import { useProductTemplates } from '../../../hooks/useProductTemplates';
import ResponsiveProductGrid from '../../ui/responsive-product-grid';
import SimpleTemplateSearch from './SimpleTemplateSearch';
import TemplateLoadingStatus from './TemplateLoadingStatus';
import TemplateDebugPanel from './TemplateDebugPanel';
import TemplateCacheManager from './TemplateCacheManager';
import ImageDownloadButton from './ImageDownloadButton';
import VirtualizedTemplateGrid from './VirtualizedTemplateGrid';


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
      <div className="flex-1 overflow-auto">
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
          <div className="flex items-center justify-center h-64">
            <div className="text-center p-8">
              <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Failed to load templates
              </div>
              <p className="text-gray-500 dark:text-gray-400">{error}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
            {templates.slice(0, 100).map((template) => {
              const isSelected = selectedTemplates.some(t => t.id === template.id);
              return (
                <div
                  key={template.id}
                  onClick={() => toggleTemplate(template)}
                  className={`relative bg-card rounded-xl border transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl overflow-hidden ${
                    isSelected 
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-500/30 shadow-lg" 
                      : "border-border hover:border-purple-300 dark:hover:border-purple-600"
                  }`}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-20 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  {/* Product Image */}
                  <div className="aspect-square overflow-hidden rounded-t-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                    {template.image_url ? (
                      <img
                        src={template.image_url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                        onLoad={() => console.log('[TemplatesView] Image loaded:', template.name)}
                        onError={(e) => {
                          console.log('[TemplatesView] Image error for:', template.name, template.image_url);
                          // Show fallback
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    
                    {/* Fallback */}
                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 ${template.image_url ? 'hidden' : ''}`}>
                      <div className="w-12 h-12 bg-white/90 dark:bg-gray-800/90 rounded-2xl flex items-center justify-center shadow-lg border border-white/50 dark:border-gray-700/50 backdrop-blur-sm">
                        <span className="font-bold text-blue-700 dark:text-blue-300 text-lg">
                          {template.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Product Information */}
                  <div className="p-3 flex flex-col gap-1.5">
                    <h4 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight min-h-[2.5rem]" title={template.name}>
                      {template.name}
                    </h4>
                    {template.category && (
                      <p className="text-xs text-muted-foreground capitalize truncate">
                        {template.category}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Click to {isSelected ? 'remove' : 'select'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatesView;
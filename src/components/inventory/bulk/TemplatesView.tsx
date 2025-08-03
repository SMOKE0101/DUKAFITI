import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useBulkAdd } from './BulkAddProvider';
import { useProductTemplates } from '../../../hooks/useProductTemplates';
import { Button } from '../../ui/button';
import ResponsiveProductGrid from '../../ui/responsive-product-grid';
import SimpleTemplateSearch from './SimpleTemplateSearch';
import TemplateLoadingStatus from './TemplateLoadingStatus';
import TemplateDebugPanel from './TemplateDebugPanel';
import TemplateCacheManager from './TemplateCacheManager';
import ImageDownloadButton from './ImageDownloadButton';
import VirtualizedTemplateGrid from './VirtualizedTemplateGrid';
import TemplateImage from '../../ui/template-image';
import TemplateSelectionOverlay from './TemplateSelectionOverlay';


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
              Select from {totalTemplates && totalTemplates > 0 ? totalTemplates.toLocaleString() : '7,344+'} templates to add to your spreadsheet
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
          <PaginatedTemplateGrid templates={templates} selectedTemplates={selectedTemplates} onToggleTemplate={toggleTemplate} />
        )}
      </div>
    </div>
  );
};

// Pagination component for efficient template display
const PaginatedTemplateGrid: React.FC<{
  templates: any[];
  selectedTemplates: any[];
  onToggleTemplate: (template: any) => void;
}> = ({ templates, selectedTemplates, onToggleTemplate }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const { updateSpreadsheetData, spreadsheetData } = useBulkAdd();
  const templatesPerPage = 50; // Reduced for faster loading
  
  const totalPages = Math.ceil(templates.length / templatesPerPage);
  const startIndex = (currentPage - 1) * templatesPerPage;
  const endIndex = startIndex + templatesPerPage;
  const currentTemplates = templates.slice(startIndex, endIndex);

  const handleTemplateClick = (template: any) => {
    setSelectedTemplate(template);
    setIsOverlayVisible(true);
  };

  const handleCloseOverlay = () => {
    setIsOverlayVisible(false);
    setSelectedTemplate(null);
  };

  const handleAddToSpreadsheet = (productData: any) => {
    // Find first empty row in spreadsheet
    const emptyRowIndex = spreadsheetData.findIndex(row => !row.name.trim());
    const newSpreadsheetData = [...spreadsheetData];
    
    const newRow = {
      id: emptyRowIndex >= 0 ? spreadsheetData[emptyRowIndex].id : `template_${productData.name}_${Date.now()}`,
      name: productData.name,
      category: productData.category || '',
      costPrice: productData.cost_price,
      sellingPrice: productData.selling_price,
      currentStock: productData.current_stock,
      lowStockThreshold: productData.low_stock_threshold,
      image_url: productData.image_url || '',
      isValid: true,
      errors: []
    };
    
    if (emptyRowIndex >= 0) {
      newSpreadsheetData[emptyRowIndex] = newRow;
    } else {
      newSpreadsheetData.push(newRow);
    }
    
    updateSpreadsheetData(newSpreadsheetData);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of templates grid
    const templatesContainer = document.querySelector('.templates-grid-container');
    if (templatesContainer) {
      templatesContainer.scrollTop = 0;
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Info */}
      <div className="px-4 py-2 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, templates.length)} of {templates.length.toLocaleString()} templates
          </span>
          <span className="text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      </div>

      {/* Templates Grid Container */}
      <div className="flex-1 overflow-auto templates-grid-container">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
          {currentTemplates.map((template) => {
              const isSelected = selectedTemplates.some(t => t.id === template.id);
              return (
                <div
                  key={template.id}
                  onClick={() => handleTemplateClick(template)}
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
                    <TemplateImage 
                      src={template.image_url}
                      alt={template.name}
                      productName={template.name}
                      className="w-full h-full"
                    />
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
                       Click to configure
                     </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border bg-muted/20">
          <div className="flex items-center justify-center gap-2">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="gap-1"
            >
              ← Previous
            </Button>

            {/* Page Numbers */}
            <div className="flex gap-1">
              {currentPage > 3 && (
                <>
                  <Button
                    variant={1 === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(1)}
                    className="w-8 h-8 p-0"
                  >
                    1
                  </Button>
                  {currentPage > 4 && <span className="px-2 text-muted-foreground">...</span>}
                </>
              )}
              
              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
              
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && <span className="px-2 text-muted-foreground">...</span>}
                  <Button
                    variant={totalPages === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(totalPages)}
                    className="w-8 h-8 p-0"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>

            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              Next →
            </Button>
          </div>
          
          {/* Quick Jump */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">Jump to page:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  goToPage(page);
                }
              }}
              className="w-16 px-2 py-1 text-xs border rounded text-center"
            />
          </div>
        </div>
      )}
      
      {/* Template Selection Overlay */}
      <TemplateSelectionOverlay
        template={selectedTemplate}
        isVisible={isOverlayVisible}
        onClose={handleCloseOverlay}
        onAddToSpreadsheet={handleAddToSpreadsheet}
      />
    </div>
  );
};

export default TemplatesView;
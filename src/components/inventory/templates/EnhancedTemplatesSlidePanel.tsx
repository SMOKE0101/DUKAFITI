import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Package, RotateCcw, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Product } from '../../../types';
import TemplatesGrid from './TemplatesGrid';
import TemplatesSearch from './TemplatesSearch';
import BulkProductsSpreadsheet from './BulkProductsSpreadsheet';
import { useProductTemplates, ProductTemplate } from '../../../hooks/useProductTemplates';
import { createPortal } from 'react-dom';

interface EnhancedTemplatesSlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

const EnhancedTemplatesSlidePanel: React.FC<EnhancedTemplatesSlidePanelProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<ProductTemplate[]>([]);
  const [spreadsheetData, setSpreadsheetData] = useState<any[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
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
    isOnline
  } = useProductTemplates();

  // Hide bottom navigation on mobile when panel is open
  useEffect(() => {
    if (isOpen) {
      const bottomNav = document.querySelector('[data-bottom-nav]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = 'none';
      }
      document.body.style.overflow = 'hidden';
    }

    return () => {
      const bottomNav = document.querySelector('[data-bottom-nav]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = '';
      }
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Initialize with empty rows when opened
  useEffect(() => {
    if (isOpen && spreadsheetData.length === 0) {
      initializeSpreadsheet();
    }
  }, [isOpen]);

  const initializeSpreadsheet = useCallback(() => {
    const initialRows = Array.from({ length: 15 }, (_, index) => ({
      id: `row_${index}`,
      name: '',
      category: '',
      costPrice: '',
      sellingPrice: '',
      currentStock: '',
      lowStockThreshold: '',
      isValid: false,
      errors: [],
    }));
    setSpreadsheetData(initialRows);
  }, []);

  const handleTemplateSelect = useCallback((template: ProductTemplate) => {
    const isSelected = selectedTemplates.some(t => t.id === template.id);
    
    if (isSelected) {
      // Remove from selection
      setSelectedTemplates(prev => prev.filter(t => t.id !== template.id));
      
      // Remove from spreadsheet
      setSpreadsheetData(prev => 
        prev.map(row => 
          row.name === template.name ? { ...row, name: '', category: '', isValid: false, errors: [] } : row
        )
      );
    } else {
      // Add to selection
      setSelectedTemplates(prev => [...prev, template]);
      
      // Add to spreadsheet - find first empty row
      setSpreadsheetData(prev => {
        const emptyRowIndex = prev.findIndex(row => !row.name.trim());
        if (emptyRowIndex === -1) {
          // No empty rows, add new ones
          const newRow = {
            id: `template_${template.id}_${Date.now()}`,
            name: template.name,
            category: template.category || '',
            costPrice: '',
            sellingPrice: '',
            currentStock: '',
            lowStockThreshold: '',
            isValid: false,
            errors: ['Selling price is required and must be > 0'],
          };
          return [...prev, newRow];
        } else {
          // Fill empty row
          const updated = [...prev];
          updated[emptyRowIndex] = {
            ...updated[emptyRowIndex],
            name: template.name,
            category: template.category || '',
            isValid: false,
            errors: ['Selling price is required and must be > 0'],
          };
          return updated;
        }
      });
    }
  }, [selectedTemplates]);

  const handleSpreadsheetUpdate = useCallback((newData: any[]) => {
    setSpreadsheetData(newData);
    
    // Update selected templates based on spreadsheet data
    const templateNames = newData.filter(row => row.name.trim()).map(row => row.name);
    setSelectedTemplates(prev => 
      prev.filter(template => templateNames.includes(template.name))
    );
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedTemplates([]);
    initializeSpreadsheet();
  }, [initializeSpreadsheet]);

  const handleSave = useCallback(() => {
    const validRows = spreadsheetData.filter(row => row.isValid && row.name.trim());
    
    if (validRows.length === 0) {
      toast({
        title: "No Valid Products",
        description: "Please add valid product data with selling prices",
        variant: "destructive",
      });
      return;
    }

    const products = validRows.map(row => ({
      name: row.name.trim(),
      category: row.category || 'General',
      costPrice: row.costPrice === '' ? 0 : Number(row.costPrice),
      sellingPrice: Number(row.sellingPrice),
      currentStock: row.currentStock === '' ? -1 : Number(row.currentStock),
      lowStockThreshold: row.lowStockThreshold === '' ? 10 : Number(row.lowStockThreshold),
      sku: '',
    }));

    onSave(products);
    toast({
      title: "Products Added",
      description: `${products.length} products added to inventory`,
    });
    
    // Reset state
    setSelectedTemplates([]);
    initializeSpreadsheet();
    onClose();
  }, [spreadsheetData, onSave, toast, initializeSpreadsheet, onClose]);

  const downloadTemplate = useCallback(() => {
    const headers = ['Name', 'Category', 'Cost Price', 'Selling Price', 'Current Stock', 'Low Stock Threshold'];
    const csvContent = [
      headers.join(','),
      'Sample Product,Food & Beverages,100,150,50,10',
      'Another Product,Personal Care,50,75,100,20',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulk_products_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }, []);

  const handleClose = useCallback(() => {
    setIsExpanded(false);
    setSelectedTemplates([]);
    initializeSpreadsheet();
    onClose();
  }, [onClose, initializeSpreadsheet]);

  if (!isOpen) return null;

  const validCount = spreadsheetData.filter(row => row.isValid).length;
  const selectedCount = selectedTemplates.length;
  const totalTemplates = templates.length;

  // Portal content for mobile overlay
  const portalContent = (
    <div className="fixed inset-0 bg-black/50 z-[100] flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Spreadsheet Section - Default View */}
        <div className={cn(
          "flex-1 bg-white dark:bg-gray-900 flex flex-col transition-all duration-300",
          isExpanded ? "h-0 overflow-hidden" : "h-full"
        )}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Product Bulk Entry</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Fill in pricing and stock information
                </p>
              </div>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <BulkProductsSpreadsheet
              data={spreadsheetData}
              onDataChange={handleSpreadsheetUpdate}
              highlightedTemplates={selectedTemplates.map(t => t.name)}
            />
          </div>
        </div>

        {/* Templates Section - Expanded View */}
        {isExpanded && (
          <div className="flex-1 bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Browse Product Templates</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select products to add to your spreadsheet
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={downloadTemplate}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    CSV Template
                  </Button>
                  <Button
                    onClick={handleClose}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <TemplatesSearch
                searchTerm={searchTerm}
                onSearchChange={searchTemplates}
                selectedCategory={selectedCategory}
                categories={categories}
                onCategoryChange={filterByCategory}
                onClearFilters={clearFilters}
                templatesCount={templates.length}
              />
            </div>
            
            <div className="flex-1 overflow-hidden">
              <TemplatesGrid
                templates={templates}
                selectedTemplates={selectedTemplates}
                onTemplateSelect={handleTemplateSelect}
                loading={loading}
                error={error}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="font-mono text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
                BULK ADD
              </h2>
              <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-2">
                {selectedCount > 0 && (
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                    {selectedCount} selected
                  </span>
                )}
                {validCount > 0 && (
                  <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                    {validCount} ready
                  </span>
                )}
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-xs font-medium">
                  {totalTemplates} total{!isOnline && ' (offline)'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Button
              onClick={handleClearAll}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
          
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {isExpanded ? (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Show Spreadsheet
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Browse Templates
              </>
            )}
          </Button>
          
          {validCount > 0 && (
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
            >
              Add {validCount} Product{validCount !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  // Use portal to render the overlay
  return createPortal(portalContent, document.body);
};

export default EnhancedTemplatesSlidePanel;
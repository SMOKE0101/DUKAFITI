import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Package, RotateCcw, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Product } from '../../../types';
import TemplatesGrid from './TemplatesGrid';
import TemplatesSearch from './TemplatesSearch';
import BulkProductsSpreadsheet from './BulkProductsSpreadsheet';
import { useProductTemplates, ProductTemplate } from '../../../hooks/useProductTemplates';

interface TemplatesSlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

const TemplatesSlidePanel: React.FC<TemplatesSlidePanelProps> = ({
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

  // Initialize with empty rows when opened
  useEffect(() => {
    if (isOpen && spreadsheetData.length === 0) {
      initializeSpreadsheet();
    }
  }, [isOpen]);

  const initializeSpreadsheet = () => {
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
  };

  const handleTemplateSelect = (template: ProductTemplate) => {
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
  };

  const handleSpreadsheetUpdate = (newData: any[]) => {
    setSpreadsheetData(newData);
    
    // Update selected templates based on spreadsheet data
    const templateNames = newData.filter(row => row.name.trim()).map(row => row.name);
    setSelectedTemplates(prev => 
      prev.filter(template => templateNames.includes(template.name))
    );
  };

  const handleClearAll = () => {
    setSelectedTemplates([]);
    initializeSpreadsheet();
  };

  const handleSave = () => {
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
  };

  const downloadTemplate = () => {
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
  };

  if (!isOpen) return null;

  const validCount = spreadsheetData.filter(row => row.isValid).length;
  const selectedCount = selectedTemplates.length;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-4">
      <div
        ref={panelRef}
        className={cn(
          "w-[98vw] max-w-7xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl transition-all duration-300 ease-out",
          isExpanded ? "h-[95vh]" : "h-32"
        )}
      >
        {/* Collapsed Header */}
        <div className="h-32 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="font-mono text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
                PRODUCT TEMPLATES
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedCount > 0 && `${selectedCount} template${selectedCount > 1 ? 's' : ''} selected • `}
                {validCount > 0 && `${validCount} product${validCount > 1 ? 's' : ''} ready • `}
                {templates.length} templates available {!isOnline && '(offline)'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedCount > 0 && (
              <>
                <Button
                  onClick={handleClearAll}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={validCount === 0}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Add {validCount} Product{validCount !== 1 ? 's' : ''}
                </Button>
              </>
            )}
            
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="outline"
              size="sm"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Expand Templates
                </>
              )}
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="flex-1 flex flex-col h-[calc(95vh-8rem)] overflow-hidden">
            {/* Templates Section */}
            <div className="h-1/2 border-b border-gray-200 dark:border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Browse Product Templates</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={downloadTemplate}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      CSV Template
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

            {/* Spreadsheet Section */}
            <div className="h-1/2 flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg">Product Details</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Fill in pricing and stock information for selected templates
                </p>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <BulkProductsSpreadsheet
                  data={spreadsheetData}
                  onDataChange={handleSpreadsheetUpdate}
                  highlightedTemplates={selectedTemplates.map(t => t.name)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatesSlidePanel;
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Product } from '../../types';
import { PRODUCT_CATEGORIES, isCustomCategory } from '../../constants/categories';
import { Download, Upload, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkProductRow {
  id: string;
  name: string;
  category: string;
  costPrice: number | '';
  sellingPrice: number | '';
  currentStock: number | '';
  lowStockThreshold: number | '';
  isValid: boolean;
  errors: string[];
}

interface BulkProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

const BulkProductModal: React.FC<BulkProductModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<BulkProductRow[]>([]);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

  // Common product templates for quick filling
  const commonTemplates = [
    { name: 'Cooking Oil 1L', category: 'Food & Beverages' },
    { name: 'Rice 1kg', category: 'Food & Beverages' },
    { name: 'Sugar 1kg', category: 'Food & Beverages' },
    { name: 'Bread', category: 'Food & Beverages' },
    { name: 'Milk 500ml', category: 'Food & Beverages' },
    { name: 'Soap Bar', category: 'Personal Care' },
    { name: 'Shampoo', category: 'Personal Care' },
    { name: 'Toothpaste', category: 'Personal Care' },
    { name: 'Notebook', category: 'Stationery' },
    { name: 'Pen', category: 'Stationery' },
    { name: 'Pencil', category: 'Stationery' },
    { name: 'Detergent', category: 'Household' },
  ].sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (isOpen) {
      initializeRows();
    }
  }, [isOpen]);

  const initializeRows = () => {
    const initialRows: BulkProductRow[] = Array.from({ length: 10 }, (_, index) => ({
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
    setRows(initialRows);
    setActiveRowIndex(null);
  };

  const addMoreRows = () => {
    const newRows: BulkProductRow[] = Array.from({ length: 10 }, (_, index) => ({
      id: `row_${rows.length + index}`,
      name: '',
      category: '',
      costPrice: '',
      sellingPrice: '',
      currentStock: '',
      lowStockThreshold: '',
      isValid: false,
      errors: [],
    }));
    setRows(prev => [...prev, ...newRows]);
  };

  const validateRow = (row: BulkProductRow): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!row.name.trim()) {
      errors.push('Name is required');
    }
    
    if (!row.category.trim()) {
      errors.push('Category is required');
    }
    
    if (!row.sellingPrice || row.sellingPrice <= 0) {
      errors.push('Selling price is required and must be > 0');
    }

    return { isValid: errors.length === 0, errors };
  };

  const updateRow = (index: number, field: keyof BulkProductRow, value: any) => {
    setRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Validate the updated row
      const validation = validateRow(updated[index]);
      updated[index].isValid = validation.isValid;
      updated[index].errors = validation.errors;
      
      return updated;
    });
  };

  const applyTemplate = (template: { name: string; category: string }) => {
    if (activeRowIndex === null) return;
    
    updateRow(activeRowIndex, 'name', template.name);
    updateRow(activeRowIndex, 'category', template.category);
    
    // Move to next empty row
    const nextEmptyIndex = rows.findIndex((row, idx) => idx > activeRowIndex && !row.name.trim());
    if (nextEmptyIndex !== -1) {
      setActiveRowIndex(nextEmptyIndex);
    }
  };

  const downloadCSVTemplate = () => {
    const headers = ['Name', 'Category', 'Cost Price', 'Selling Price', 'Current Stock', 'Low Stock Threshold'];
    const csvContent = [
      headers.join(','),
      'Cooking Oil 1L,Food & Beverages,180,220,50,10',
      'Rice 1kg,Food & Beverages,120,150,100,20',
      'Soap Bar,Personal Care,25,35,200,50',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulk_products_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast({
            title: "Invalid CSV",
            description: "CSV file must have at least a header and one data row",
            variant: "destructive",
          });
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const dataLines = lines.slice(1);

        const newRows: BulkProductRow[] = dataLines.map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          const row: BulkProductRow = {
            id: `csv_row_${index}`,
            name: values[0] || '',
            category: values[1] || '',
            costPrice: values[2] ? parseFloat(values[2]) || '' : '',
            sellingPrice: values[3] ? parseFloat(values[3]) || '' : '',
            currentStock: values[4] ? parseInt(values[4]) || '' : '',
            lowStockThreshold: values[5] ? parseInt(values[5]) || '' : '',
            isValid: false,
            errors: [],
          };

          const validation = validateRow(row);
          row.isValid = validation.isValid;
          row.errors = validation.errors;

          return row;
        });

        setRows(newRows);
        toast({
          title: "CSV Imported",
          description: `${newRows.length} rows imported from CSV`,
        });
      } catch (error) {
        toast({
          title: "Import Error",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    const validRows = rows.filter(row => row.isValid && row.name.trim());
    
    if (validRows.length === 0) {
      toast({
        title: "No Valid Products",
        description: "Please add at least one valid product",
        variant: "destructive",
      });
      return;
    }

    const products = validRows.map(row => ({
      name: row.name.trim(),
      category: row.category,
      costPrice: row.costPrice === '' ? 0 : Number(row.costPrice),
      sellingPrice: Number(row.sellingPrice),
      currentStock: row.currentStock === '' ? -1 : Number(row.currentStock), // -1 for unspecified
      lowStockThreshold: row.lowStockThreshold === '' ? 0 : Number(row.lowStockThreshold),
      sku: '', // Optional
    }));

    onSave(products);
    toast({
      title: "Products Added",
      description: `${products.length} products added to inventory`,
    });
  };

  const validRowCount = rows.filter(row => row.isValid).length;
  const invalidRowCount = rows.filter(row => !row.isValid && row.name.trim()).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] h-[98vh] max-w-none max-h-none border-0 p-0 bg-white dark:bg-gray-900 shadow-2xl rounded-xl overflow-hidden flex flex-col">          
        {/* Header */}
        <div className="border-b-4 border-blue-600 bg-white dark:bg-gray-900 p-2 lg:p-6 text-center flex-shrink-0">
          <DialogTitle className="font-mono text-lg lg:text-xl font-black uppercase tracking-widest text-gray-900 dark:text-white">
            BULK ADD PRODUCTS
          </DialogTitle>
          <DialogDescription className="font-mono text-xs lg:text-sm text-gray-600 dark:text-gray-400 mt-1 lg:mt-2 uppercase tracking-wider">
            Add multiple products using spreadsheet-style table
          </DialogDescription>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Controls */}
          <div className="flex flex-wrap gap-2 lg:gap-4 p-2 lg:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Button
              onClick={downloadCSVTemplate}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download CSV Template
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload CSV
            </Button>
            <Button
              onClick={addMoreRows}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add 10 More Rows
            </Button>
            <div className="flex items-center gap-4 ml-auto text-sm">
              <span className="text-green-600 font-medium">Valid: {validRowCount}</span>
              {invalidRowCount > 0 && (
                <span className="text-red-600 font-medium">Invalid: {invalidRowCount}</span>
              )}
            </div>
          </div>

          {/* Main Content - Responsive Layout */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Table - takes 4/5 on mobile, main area on desktop */}
            <div className="flex-[4] lg:flex-1 overflow-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                  <tr>
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left font-mono text-xs uppercase tracking-wider min-w-[200px]">Name*</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left font-mono text-xs uppercase tracking-wider min-w-[150px]">Category*</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left font-mono text-xs uppercase tracking-wider min-w-[120px]">Cost Price</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left font-mono text-xs uppercase tracking-wider min-w-[120px]">Sell Price*</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left font-mono text-xs uppercase tracking-wider min-w-[100px]">Quantity</th>
                    <th className="border border-gray-300 dark:border-gray-600 p-2 text-left font-mono text-xs uppercase tracking-wider min-w-[100px]">Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr 
                      key={row.id} 
                      className={cn(
                        "hover:bg-gray-50 dark:hover:bg-gray-800",
                        !row.isValid && row.name.trim() && "bg-red-50 dark:bg-red-900/20",
                        activeRowIndex === index && "bg-blue-50 dark:bg-blue-900/20"
                      )}
                    >
                      <td className="border border-gray-300 dark:border-gray-600 p-1">
                        <Input
                          value={row.name}
                          onChange={(e) => updateRow(index, 'name', e.target.value)}
                          onFocus={() => setActiveRowIndex(index)}
                          placeholder="Product name"
                          className="border-0 h-8 text-sm focus-visible:ring-1"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-1">
                        <Select
                          value={row.category}
                          onValueChange={(value) => updateRow(index, 'category', value)}
                          onOpenChange={(open) => open && setActiveRowIndex(index)}
                        >
                          <SelectTrigger className="border-0 h-8 text-sm focus-visible:ring-1">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {PRODUCT_CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.costPrice}
                          onChange={(e) => updateRow(index, 'costPrice', e.target.value ? parseFloat(e.target.value) : '')}
                          onFocus={() => setActiveRowIndex(index)}
                          placeholder="0.00"
                          className="border-0 h-8 text-sm focus-visible:ring-1"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.sellingPrice}
                          onChange={(e) => updateRow(index, 'sellingPrice', e.target.value ? parseFloat(e.target.value) : '')}
                          onFocus={() => setActiveRowIndex(index)}
                          placeholder="0.00"
                          className="border-0 h-8 text-sm focus-visible:ring-1"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-1">
                        <Input
                          type="number"
                          min="0"
                          value={row.currentStock}
                          onChange={(e) => updateRow(index, 'currentStock', e.target.value ? parseInt(e.target.value) : '')}
                          onFocus={() => setActiveRowIndex(index)}
                          placeholder="Auto"
                          className="border-0 h-8 text-sm focus-visible:ring-1"
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-1">
                        <Input
                          type="number"
                          min="0"
                          value={row.lowStockThreshold}
                          onChange={(e) => updateRow(index, 'lowStockThreshold', e.target.value ? parseInt(e.target.value) : '')}
                          onFocus={() => setActiveRowIndex(index)}
                          placeholder="Auto"
                          className="border-0 h-8 text-sm focus-visible:ring-1"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Templates - Bottom on mobile (1/5), Right sidebar on desktop */}
            <div className="flex-[1] lg:w-64 h-40 lg:h-auto border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-2 lg:p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-mono font-bold text-xs lg:text-sm uppercase tracking-wider text-gray-900 dark:text-white">
                    Quick Templates
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Click to fill {activeRowIndex !== null ? `row ${activeRowIndex + 1}` : 'selected row'}
                  </p>
                </div>
                <div className="p-2 lg:p-4 space-y-2">
                  {commonTemplates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => applyTemplate(template)}
                      disabled={activeRowIndex === null}
                      className={cn(
                        "w-full text-left p-2 rounded-lg border text-xs transition-colors",
                        activeRowIndex !== null
                          ? "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                          : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed"
                      )}
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">{template.category}</div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 lg:p-4 flex justify-between items-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Empty quantity/threshold will use automatic values
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 border-2 border-blue-600"
                disabled={validRowCount === 0}
              >
                Save {validRowCount} Product{validRowCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleCSVUpload}
        className="hidden"
      />
    </Dialog>
  );
};

export default BulkProductModal;
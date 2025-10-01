import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Upload, Plus, Star, Download, Package, Coins, PackageCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BulkProductRow } from '../../../hooks/useBulkAddState';
import { useBulkAdd } from './BulkAddProvider';
import { PRODUCT_CATEGORIES } from '../../../constants/categories';
import ImageUpload from '@/components/ui/image-upload';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const SpreadsheetView: React.FC = () => {
  const { spreadsheetData, selectedTemplates, updateSpreadsheetData, stats } = useBulkAdd();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rowStates, setRowStates] = useState<Record<string, { profitEnabled: boolean; stockEnabled: boolean }>>({});

  // Add event listeners for the custom events
  useEffect(() => {
    const handleAddRows = () => {
      const newRows: BulkProductRow[] = Array.from({ length: 10 }, (_, index) => ({
        id: `row_${spreadsheetData.length + index}_${Date.now()}`,
        name: '',
        category: '',
        costPrice: '',
        sellingPrice: '',
        currentStock: '',
        lowStockThreshold: '',
        image_url: '',
        isValid: false,
        errors: [],
      }));
      updateSpreadsheetData([...spreadsheetData, ...newRows]);
    };

    const handleCSVUpload = () => {
      fileInputRef.current?.click();
    };

    const handleDownloadTemplate = () => {
      const headers = ['Name', 'Category', 'Cost Price', 'Selling Price', 'Current Stock', 'Low Stock Threshold', 'Image URL'];
      const csvContent = [
        headers.join(','),
        'Sample Product,Food & Beverages,100,150,50,10,',
        'Another Product,Personal Care,50,75,100,20,',
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bulk_products_template.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    };

    window.addEventListener('bulk-add-add-rows', handleAddRows);
    window.addEventListener('bulk-add-csv-upload', handleCSVUpload);
    window.addEventListener('bulk-add-download-template', handleDownloadTemplate);

    return () => {
      window.removeEventListener('bulk-add-add-rows', handleAddRows);
      window.removeEventListener('bulk-add-csv-upload', handleCSVUpload);
      window.removeEventListener('bulk-add-download-template', handleDownloadTemplate);
    };
  }, [spreadsheetData, updateSpreadsheetData]);

  const updateRow = useCallback((index: number, field: keyof BulkProductRow, value: any) => {
    const updated = [...spreadsheetData];
    updated[index] = { ...updated[index], [field]: value };
    updateSpreadsheetData(updated);
  }, [spreadsheetData, updateSpreadsheetData]);

  // Auto-expand rows when user fills them
  useEffect(() => {
    const filledRows = spreadsheetData.filter(row => row.name.trim() || row.category.trim() || row.sellingPrice).length;
    const emptyRows = spreadsheetData.length - filledRows;
    
    // Add 10 more rows when there are less than 5 empty rows and user has filled at least 10 rows
    if (emptyRows < 5 && filledRows >= 10) {
      const newRows: BulkProductRow[] = Array.from({ length: 10 }, (_, index) => ({
        id: `auto_row_${spreadsheetData.length + index}_${Date.now()}`,
        name: '',
        category: '',
        costPrice: '',
        sellingPrice: '',
        currentStock: '',
        lowStockThreshold: '',
        image_url: '',
        isValid: false,
        errors: [],
      }));
      updateSpreadsheetData([...spreadsheetData, ...newRows]);
    }
  }, [spreadsheetData, updateSpreadsheetData]);

  const handleCSVUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvContent = e.target?.result as string;
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) return;

        const dataLines = lines.slice(1);
        const newRows: BulkProductRow[] = dataLines.map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          return {
            id: `csv_row_${index}`,
            name: values[0] || '',
            category: values[1] || '',
            costPrice: values[2] ? parseFloat(values[2]) || '' : '',
            sellingPrice: values[3] ? parseFloat(values[3]) || '' : '',
            currentStock: values[4] ? parseInt(values[4]) || '' : '',
            lowStockThreshold: values[5] ? parseInt(values[5]) || '' : '',
            image_url: values[6] || '',
            isValid: false,
            errors: [],
          };
        });

        updateSpreadsheetData(newRows);
      } catch (error) {
        console.error('CSV parsing error:', error);
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [updateSpreadsheetData]);

  const isHighlighted = (rowName: string) => 
    selectedTemplates.some(template => template.name === rowName);

  // Check if profit calculation is enabled for a row
  const isProfitEnabled = (rowId: string) => {
    return rowStates[rowId]?.profitEnabled ?? true;
  };

  // Check if stock calculation is enabled for a row
  const isStockEnabled = (rowId: string) => {
    return rowStates[rowId]?.stockEnabled ?? true;
  };

  // Toggle profit calculation for a row
  const toggleProfitCalculation = (rowId: string) => {
    setRowStates(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        profitEnabled: !prev[rowId]?.profitEnabled ?? false
      }
    }));
  };

  // Toggle stock calculation for a row
  const toggleStockCalculation = (rowId: string) => {
    setRowStates(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        stockEnabled: !prev[rowId]?.stockEnabled ?? false
      }
    }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Hidden file input for CSV upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleCSVUpload}
        className="hidden"
      />

      {/* Spreadsheet with section structure */}
      <div className="flex-1 overflow-auto" style={{ 
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
      }}>
        <div className="min-w-[1200px]">
          {/* Header with sections */}
          <div className="sticky top-0 bg-muted z-20 border-b border-border">
            {/* Main headers */}
            <div className="grid grid-cols-11 gap-1 p-2 bg-muted">
              <div className="col-span-3 flex items-center">
                <Package className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wider">Product Info</span>
              </div>
              <div className="col-span-4 flex items-center">
                <Coins className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wider">Profit Calculation</span>
              </div>
              <div className="col-span-4 flex items-center">
                <PackageCheck className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wider">Stock Calculation</span>
              </div>
            </div>
            
            {/* Sub-headers */}
            <div className="grid grid-cols-11 gap-1 p-2 bg-muted/50 border-b border-border">
              <div className="col-span-3 grid grid-cols-3 gap-1">
                <div className="text-xs font-medium text-muted-foreground p-1">Name*</div>
                <div className="text-xs font-medium text-muted-foreground p-1">Category*</div>
                <div className="text-xs font-medium text-muted-foreground p-1">Image</div>
              </div>
              <div className="col-span-4 grid grid-cols-4 gap-1">
                <div className="text-xs font-medium text-muted-foreground p-1">Enable</div>
                <div className="text-xs font-medium text-muted-foreground p-1">Cost Price</div>
                <div className="text-xs font-medium text-muted-foreground p-1">Selling Price*</div>
                <div className="text-xs font-medium text-muted-foreground p-1">Profit</div>
              </div>
              <div className="col-span-4 grid grid-cols-4 gap-1">
                <div className="text-xs font-medium text-muted-foreground p-1">Enable</div>
                <div className="text-xs font-medium text-muted-foreground p-1">Current Stock</div>
                <div className="text-xs font-medium text-muted-foreground p-1">Low Stock Alert</div>
                <div className="text-xs font-medium text-muted-foreground p-1">Stock Status</div>
              </div>
            </div>
          </div>

          {/* Data rows */}
          <div className="divide-y divide-border">
            {spreadsheetData.map((row, index) => {
              const highlighted = isHighlighted(row.name);
              const profitEnabled = isProfitEnabled(row.id);
              const stockEnabled = isStockEnabled(row.id);
              
              // Calculate profit if both prices are provided
              const costPriceNum = typeof row.costPrice === 'number' ? row.costPrice : parseFloat(row.costPrice as string) || 0;
              const sellingPriceNum = typeof row.sellingPrice === 'number' ? row.sellingPrice : parseFloat(row.sellingPrice as string) || 0;
              const profit = sellingPriceNum > 0 && costPriceNum > 0 ? sellingPriceNum - costPriceNum : 0;
              const profitMargin = sellingPriceNum > 0 ? (profit / sellingPriceNum) * 100 : 0;

              return (
                <div 
                  key={row.id} 
                  className={cn(
                    "grid grid-cols-11 gap-1 p-2 hover:bg-muted/50 transition-colors",
                    !row.isValid && row.name.trim() && "bg-destructive/10",
                    highlighted && "bg-primary/10 border-l-4 border-l-primary"
                  )}
                >
                  {/* Product Info Section */}
                  <div className="col-span-3 grid grid-cols-3 gap-1">
                    <div className="relative">
                      {highlighted && (
                        <Star className="absolute left-1 top-1 w-3 h-3 text-primary fill-current z-10" />
                      )}
                      <Input
                        value={row.name}
                        onChange={(e) => updateRow(index, 'name', e.target.value)}
                        placeholder="Product name"
                        className={cn(
                          "h-8 text-sm focus-visible:ring-1",
                          highlighted && "pl-6"
                        )}
                      />
                    </div>
                    <div>
                      <Select
                        value={row.category}
                        onValueChange={(value) => updateRow(index, 'category', value)}
                      >
                        <SelectTrigger className="h-8 text-sm focus-visible:ring-1">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCT_CATEGORIES.map(category => (
                            <SelectItem key={category} value={category} className="text-sm">
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-center">
                      <ImageUpload
                        value={row.image_url}
                        onChange={(url) => updateRow(index, 'image_url', url)}
                        productId={row.id}
                        compact={true}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Profit Calculation Section */}
                  <div className="col-span-4 grid grid-cols-4 gap-1">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={profitEnabled}
                        onCheckedChange={(checked) => {
                          toggleProfitCalculation(row.id);
                          // Clear cost price if disabled
                          if (!checked) {
                            updateRow(index, 'costPrice', '');
                          }
                        }}
                        className="h-4 w-4"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.costPrice}
                        onChange={(e) => updateRow(index, 'costPrice', e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder="0.00"
                        className="h-8 text-sm focus-visible:ring-1"
                        disabled={!profitEnabled}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.sellingPrice}
                        onChange={(e) => updateRow(index, 'sellingPrice', e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder="0.00"
                        className="h-8 text-sm focus-visible:ring-1"
                        required
                      />
                    </div>
                    <div className="flex items-center">
                      {profit > 0 && (
                        <div className="text-xs text-green-600 font-medium">
                          KES {profit.toFixed(2)}
                          <div className="text-[10px] text-green-500">
                            {profitMargin.toFixed(1)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stock Calculation Section */}
                  <div className="col-span-4 grid grid-cols-4 gap-1">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={stockEnabled}
                        onCheckedChange={(checked) => {
                          toggleStockCalculation(row.id);
                          // Clear stock values if disabled
                          if (!checked) {
                            updateRow(index, 'currentStock', '');
                            updateRow(index, 'lowStockThreshold', '');
                          }
                        }}
                        className="h-4 w-4"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        min="0"
                        value={row.currentStock}
                        onChange={(e) => updateRow(index, 'currentStock', e.target.value ? parseInt(e.target.value) : '')}
                        placeholder="0"
                        className="h-8 text-sm focus-visible:ring-1"
                        disabled={!stockEnabled}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        min="0"
                        value={row.lowStockThreshold}
                        onChange={(e) => updateRow(index, 'lowStockThreshold', e.target.value ? parseInt(e.target.value) : '')}
                        placeholder="10"
                        className="h-8 text-sm focus-visible:ring-1"
                        disabled={!stockEnabled}
                      />
                    </div>
                    <div className="flex items-center">
                      {stockEnabled && row.currentStock !== '' && (
                        <div className="text-xs">
                          {typeof row.currentStock === 'number' && row.currentStock <= 0 ? (
                            <span className="text-red-500">Out of Stock</span>
                          ) : typeof row.currentStock === 'number' && row.lowStockThreshold !== '' && 
                             row.currentStock <= (typeof row.lowStockThreshold === 'number' ? row.lowStockThreshold : parseInt(row.lowStockThreshold as string) || 10) ? (
                            <span className="text-orange-500">Low Stock</span>
                          ) : (
                            <span className="text-green-500">In Stock</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetView;

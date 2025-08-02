import React, { useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Upload, Plus, Star, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BulkProductRow } from '../../../hooks/useBulkAddState';
import { useBulkAdd } from './BulkAddProvider';
import { PRODUCT_CATEGORIES } from '../../../constants/categories';

const SpreadsheetView: React.FC = () => {
  const { spreadsheetData, selectedTemplates, updateSpreadsheetData, stats } = useBulkAdd();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateRow = useCallback((index: number, field: keyof BulkProductRow, value: any) => {
    const updated = [...spreadsheetData];
    updated[index] = { ...updated[index], [field]: value };
    updateSpreadsheetData(updated);
  }, [spreadsheetData, updateSpreadsheetData]);

  const addMoreRows = useCallback(() => {
    const newRows: BulkProductRow[] = Array.from({ length: 10 }, (_, index) => ({
      id: `row_${spreadsheetData.length + index}`,
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

  const isHighlighted = (rowName: string) => 
    selectedTemplates.some(template => template.name === rowName);

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 p-3 border-b border-border bg-muted/30">
        <input
          type="file"
          accept=".csv"
          onChange={handleCSVUpload}
          ref={fileInputRef}
          className="hidden"
        />
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload CSV</span>
          <span className="sm:hidden">CSV</span>
        </Button>
        
        <Button
          onClick={downloadTemplate}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">CSV Template</span>
          <span className="sm:hidden">Template</span>
        </Button>
        
        <Button
          onClick={addMoreRows}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add 10 Rows</span>
          <span className="sm:hidden">+10</span>
        </Button>

        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
            {stats.validCount} valid
          </span>
          <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs font-medium">
            {stats.totalCount} total
          </span>
        </div>
      </div>

      {/* Spreadsheet */}
      <div className="flex-1 overflow-auto" style={{ 
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
      }}>
        <div className="min-w-[800px]">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-muted z-10">
              <tr>
                <th className="border border-border p-2 text-left text-xs font-medium uppercase tracking-wider min-w-[180px]">
                  Name*
                </th>
                <th className="border border-border p-2 text-left text-xs font-medium uppercase tracking-wider min-w-[150px]">
                  Category*
                </th>
                <th className="border border-border p-2 text-left text-xs font-medium uppercase tracking-wider min-w-[120px]">
                  Cost Price
                </th>
                <th className="border border-border p-2 text-left text-xs font-medium uppercase tracking-wider min-w-[120px]">
                  Selling Price*
                </th>
                <th className="border border-border p-2 text-left text-xs font-medium uppercase tracking-wider min-w-[100px]">
                  Stock
                </th>
                <th className="border border-border p-2 text-left text-xs font-medium uppercase tracking-wider min-w-[100px]">
                  Low Stock Alert
                </th>
                <th className="border border-border p-2 text-left text-xs font-medium uppercase tracking-wider min-w-[180px]">
                  Image URL
                </th>
              </tr>
            </thead>
            <tbody>
              {spreadsheetData.map((row, index) => {
                const highlighted = isHighlighted(row.name);
                
                return (
                  <tr 
                    key={row.id} 
                    className={cn(
                      "hover:bg-muted/50 transition-colors",
                      !row.isValid && row.name.trim() && "bg-destructive/10",
                      highlighted && "bg-primary/10 border-l-4 border-l-primary"
                    )}
                  >
                    <td className="border border-border p-1 relative">
                      {highlighted && (
                        <Star className="absolute left-1 top-1 w-3 h-3 text-primary fill-current" />
                      )}
                      <Input
                        value={row.name}
                        onChange={(e) => updateRow(index, 'name', e.target.value)}
                        placeholder="Product name"
                        className={cn(
                          "border-0 h-9 text-sm focus-visible:ring-1",
                          highlighted && "pl-6"
                        )}
                      />
                    </td>
                    <td className="border border-border p-1">
                      <Select
                        value={row.category}
                        onValueChange={(value) => updateRow(index, 'category', value)}
                      >
                        <SelectTrigger className="border-0 h-9 text-sm focus-visible:ring-1">
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
                    <td className="border border-border p-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.costPrice}
                        onChange={(e) => updateRow(index, 'costPrice', e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder="0.00"
                        className="border-0 h-9 text-sm focus-visible:ring-1"
                      />
                    </td>
                    <td className="border border-border p-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.sellingPrice}
                        onChange={(e) => updateRow(index, 'sellingPrice', e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder="0.00"
                        className="border-0 h-9 text-sm focus-visible:ring-1"
                      />
                    </td>
                    <td className="border border-border p-1">
                      <Input
                        type="number"
                        min="0"
                        value={row.currentStock}
                        onChange={(e) => updateRow(index, 'currentStock', e.target.value ? parseInt(e.target.value) : '')}
                        placeholder="Auto"
                        className="border-0 h-9 text-sm focus-visible:ring-1"
                      />
                    </td>
                    <td className="border border-border p-1">
                      <Input
                        type="number"
                        min="0"
                        value={row.lowStockThreshold}
                        onChange={(e) => updateRow(index, 'lowStockThreshold', e.target.value ? parseInt(e.target.value) : '')}
                        placeholder="10"
                        className="border-0 h-9 text-sm focus-visible:ring-1"
                      />
                    </td>
                    <td className="border border-border p-1">
                      <Input
                        type="url"
                        value={row.image_url || ''}
                        onChange={(e) => updateRow(index, 'image_url', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="border-0 h-9 text-sm focus-visible:ring-1"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetView;
import React, { useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Plus, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRODUCT_CATEGORIES } from '../../../constants/categories';

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

interface BulkProductsSpreadsheetProps {
  data: BulkProductRow[];
  onDataChange: (data: BulkProductRow[]) => void;
  highlightedTemplates: string[];
}

const BulkProductsSpreadsheet: React.FC<BulkProductsSpreadsheetProps> = ({
  data,
  onDataChange,
  highlightedTemplates
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateRow = useCallback((row: BulkProductRow): { isValid: boolean; errors: string[] } => {
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
  }, []);

  const updateRow = useCallback((index: number, field: keyof BulkProductRow, value: any) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    
    // Validate the updated row
    const validation = validateRow(updated[index]);
    updated[index].isValid = validation.isValid;
    updated[index].errors = validation.errors;
    
    onDataChange(updated);
  }, [data, onDataChange, validateRow]);

  const addMoreRows = useCallback(() => {
    const newRows: BulkProductRow[] = Array.from({ length: 10 }, (_, index) => ({
      id: `row_${data.length + index}`,
      name: '',
      category: '',
      costPrice: '',
      sellingPrice: '',
      currentStock: '',
      lowStockThreshold: '',
      isValid: false,
      errors: [],
    }));
    onDataChange([...data, ...newRows]);
  }, [data, onDataChange]);

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

        onDataChange(newRows);
      } catch (error) {
        console.error('CSV parsing error:', error);
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onDataChange, validateRow]);

  const isHighlighted = (rowName: string) => 
    highlightedTemplates.includes(rowName);

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex gap-2 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
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
          Upload CSV
        </Button>
        
        <Button
          onClick={addMoreRows}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add 10 Rows
        </Button>

        <div className="ml-auto flex items-center gap-4 text-sm">
          <span className="text-green-600 font-medium">
            Valid: {data.filter(row => row.isValid).length}
          </span>
          <span className="text-gray-500">
            Total: {data.filter(row => row.name.trim()).length}
          </span>
        </div>
      </div>

      {/* Spreadsheet */}
      <ScrollArea className="flex-1">
        <div className="min-w-full">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
              <tr>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left font-mono text-xs uppercase tracking-wider min-w-[200px]">
                  Name*
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left font-mono text-xs uppercase tracking-wider min-w-[150px]">
                  Category*
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left font-mono text-xs uppercase tracking-wider min-w-[120px]">
                  Cost Price
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left font-mono text-xs uppercase tracking-wider min-w-[120px]">
                  Sell Price*
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left font-mono text-xs uppercase tracking-wider min-w-[100px]">
                  Stock
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-left font-mono text-xs uppercase tracking-wider min-w-[100px]">
                  Threshold
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => {
                const highlighted = isHighlighted(row.name);
                
                return (
                  <tr 
                    key={row.id} 
                    className={cn(
                      "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                      !row.isValid && row.name.trim() && "bg-red-50 dark:bg-red-900/20",
                      highlighted && "bg-purple-50 dark:bg-purple-900/20 border-l-4 border-l-purple-500"
                    )}
                  >
                    <td className="border border-gray-300 dark:border-gray-600 p-1 relative">
                      {highlighted && (
                        <Star className="absolute left-1 top-1 w-3 h-3 text-purple-600 fill-current" />
                      )}
                      <Input
                        value={row.name}
                        onChange={(e) => updateRow(index, 'name', e.target.value)}
                        placeholder="Product name"
                        className={cn(
                          "border-0 h-8 text-sm focus-visible:ring-1",
                          highlighted && "pl-6"
                        )}
                      />
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 p-1">
                      <Select
                        value={row.category}
                        onValueChange={(value) => updateRow(index, 'category', value)}
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
                        placeholder="10"
                        className="border-0 h-8 text-sm focus-visible:ring-1"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  );
};

export default BulkProductsSpreadsheet;
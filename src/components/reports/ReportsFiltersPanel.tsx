
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, FileText, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReportsFiltersPanelProps {
  dateRange: { from: string; to: string };
  onDateRangeChange: (range: { from: string; to: string }) => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  filters: {
    salesType: string;
    category: string;
    customer: string;
  };
  onFiltersChange: (filters: any) => void;
}

const ReportsFiltersPanel: React.FC<ReportsFiltersPanelProps> = ({
  dateRange,
  onDateRangeChange,
  onExportCSV,
  onExportPDF,
  filters,
  onFiltersChange
}) => {
  const handleQuickDateRange = (range: string) => {
    const today = new Date();
    let from: Date;
    
    switch (range) {
      case 'today':
        from = new Date(today);
        break;
      case 'week':
        from = new Date(today.setDate(today.getDate() - 7));
        break;
      case 'month':
        from = new Date(today.setMonth(today.getMonth() - 1));
        break;
      default:
        return;
    }
    
    onDateRangeChange({
      from: from.toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Date Range Section */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Date Range</h3>
            </div>
            
            <div className="flex flex-wrap gap-3 mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickDateRange('today')}
                className="rounded-full"
              >
                Today
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickDateRange('week')}
                className="rounded-full"
              >
                This Week
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickDateRange('month')}
                className="rounded-full"
              >
                This Month
              </Button>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">From</label>
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => onDateRangeChange({ ...dateRange, from: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">To</label>
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => onDateRangeChange({ ...dateRange, to: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Sales Type</label>
                <Select 
                  value={filters.salesType} 
                  onValueChange={(value) => onFiltersChange({ ...filters, salesType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="debt">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Category</label>
                <Select 
                  value={filters.category} 
                  onValueChange={(value) => onFiltersChange({ ...filters, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="food">Food & Beverages</SelectItem>
                    <SelectItem value="beauty">Beauty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Customer</label>
                <Input
                  placeholder="Search customer..."
                  value={filters.customer}
                  onChange={(e) => onFiltersChange({ ...filters, customer: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Export Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Download className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Export</h3>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={onExportCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button 
                onClick={onExportPDF}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportsFiltersPanel;

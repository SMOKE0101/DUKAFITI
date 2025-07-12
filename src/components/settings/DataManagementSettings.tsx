
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from '../../hooks/use-toast';
import { Download, Upload, RotateCcw, Trash2 } from 'lucide-react';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { useSupabaseProducts } from '../../hooks/useSupabaseProducts';
import { useSupabaseSales } from '../../hooks/useSupabaseSales';
import { useSupabaseTransactions } from '../../hooks/useSupabaseTransactions';
import { useState } from 'react';

const DataManagementSettings = () => {
  const { exportSettings, importSettings, resetSettings } = useSettings();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportFormat, setExportFormat] = useState('json');
  
  const { customers } = useSupabaseCustomers();
  const { products } = useSupabaseProducts();
  const { sales } = useSupabaseSales();
  const { transactions } = useSupabaseTransactions();

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importSettings(file);
    }
  };

  const exportAllData = () => {
    try {
      const allData = {
        customers,
        products,
        sales,
        transactions,
        timestamp: new Date().toISOString(),
      };

      let dataStr: string;
      let mimeType: string;
      let fileExtension: string;

      switch (exportFormat) {
        case 'csv':
          // Convert to CSV format (simplified - would need proper CSV library for complex data)
          dataStr = convertToCSV(allData);
          mimeType = 'text/csv';
          fileExtension = 'csv';
          break;
        case 'excel':
          // Convert to tab-separated format (can be opened in Excel)
          dataStr = convertToTSV(allData);
          mimeType = 'text/tab-separated-values';
          fileExtension = 'tsv';
          break;
        case 'pdf':
          toast({
            title: "PDF Export",
            description: "PDF export will be implemented in a future update.",
          });
          return;
        default:
          dataStr = JSON.stringify(allData, null, 2);
          mimeType = 'application/json';
          fileExtension = 'json';
      }

      const dataBlob = new Blob([dataStr], { type: mimeType });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shop-data-backup-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Data Exported",
        description: `All shop data has been exported as ${exportFormat.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const convertToCSV = (data: any) => {
    let csv = '';
    
    // Export customers
    if (data.customers?.length > 0) {
      csv += 'CUSTOMERS\n';
      csv += 'Name,Phone,Email,Address,Outstanding Debt,Credit Limit\n';
      data.customers.forEach((customer: any) => {
        csv += `"${customer.name}","${customer.phone}","${customer.email || ''}","${customer.address || ''}","${customer.outstandingDebt || 0}","${customer.creditLimit || 0}"\n`;
      });
      csv += '\n';
    }

    // Export products
    if (data.products?.length > 0) {
      csv += 'PRODUCTS\n';
      csv += 'Name,Category,Cost Price,Selling Price,Current Stock\n';
      data.products.forEach((product: any) => {
        csv += `"${product.name}","${product.category}","${product.costPrice}","${product.sellingPrice}","${product.currentStock}"\n`;
      });
      csv += '\n';
    }

    return csv;
  };

  const convertToTSV = (data: any) => {
    let tsv = '';
    
    // Export customers
    if (data.customers?.length > 0) {
      tsv += 'CUSTOMERS\n';
      tsv += 'Name\tPhone\tEmail\tAddress\tOutstanding Debt\tCredit Limit\n';
      data.customers.forEach((customer: any) => {
        tsv += `${customer.name}\t${customer.phone}\t${customer.email || ''}\t${customer.address || ''}\t${customer.outstandingDebt || 0}\t${customer.creditLimit || 0}\n`;
      });
      tsv += '\n';
    }

    // Export products
    if (data.products?.length > 0) {
      tsv += 'PRODUCTS\n';
      tsv += 'Name\tCategory\tCost Price\tSelling Price\tCurrent Stock\n';
      data.products.forEach((product: any) => {
        tsv += `${product.name}\t${product.category}\t${product.costPrice}\t${product.sellingPrice}\t${product.currentStock}\n`;
      });
      tsv += '\n';
    }

    return tsv;
  };

  const clearAllData = async () => {
    try {
      toast({
        title: "Feature Coming Soon",
        description: "Bulk data clearing from Supabase will be implemented soon.",
      });
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Failed to clear data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Download your data for backup or migration purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="space-y-2">
              <label className="text-sm font-medium">Export Format</label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel (TSV)</SelectItem>
                  <SelectItem value="pdf">PDF (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={exportSettings} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Settings
              </Button>
              <Button onClick={exportAllData} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export All Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Data</CardTitle>
          <CardDescription>
            Import settings or data from a backup file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.tsv"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Settings
            </Button>
            <p className="text-sm text-gray-500">
              Select a JSON, CSV, or TSV file containing your exported data
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reset & Clear</CardTitle>
          <CardDescription>
            Reset settings or clear all data (cannot be undone)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Settings
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Settings</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all settings to their default values. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={resetSettings}>
                    Reset Settings
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Data</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all customers, products, sales, and transaction data. 
                    This action cannot be undone. Please export your data first if you want to keep it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAllData}>
                    Clear All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataManagementSettings;

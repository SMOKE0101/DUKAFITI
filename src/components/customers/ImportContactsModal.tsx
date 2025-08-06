import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { X, ContactRound, Search, Users, UserCheck, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContactsImport, ContactData, ImportedCustomerData } from '../../hooks/useContactsImport';
import { Customer } from '../../types';

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customers: Omit<Customer, 'id' | 'createdDate'>[]) => void;
}

// Custom DialogContent without the built-in close button
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
CustomDialogContent.displayName = "CustomDialogContent";

const ImportContactsModal: React.FC<ImportContactsModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const {
    contacts,
    loading,
    error,
    loadContacts,
    toggleContactSelection,
    selectAllContacts,
    getSelectedContacts,
    convertContactsToCustomers,
  } = useContactsImport();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'selection' | 'spreadsheet'>('selection');
  const [importedData, setImportedData] = useState<ImportedCustomerData[]>([]);

  // Load contacts when modal opens
  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen, loadContacts]);

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  const selectedCount = contacts.filter(c => c.selected).length;
  const allSelected = contacts.length > 0 && selectedCount === contacts.length;
  const someSelected = selectedCount > 0 && selectedCount < contacts.length;

  const handleSelectAll = () => {
    selectAllContacts(!allSelected);
  };

  const handleProceedToSpreadsheet = () => {
    const selectedContacts = getSelectedContacts();
    if (selectedContacts.length === 0) return;

    const converted = convertContactsToCustomers(selectedContacts);
    setImportedData(converted);
    setActiveView('spreadsheet');
  };

  const handleBackToSelection = () => {
    setActiveView('selection');
  };

  const updateImportedData = useCallback((index: number, field: keyof ImportedCustomerData, value: any) => {
    setImportedData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const handleSave = () => {
    const customersToSave = importedData.map(data => ({
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      address: data.address || '',
      totalPurchases: data.totalPurchases,
      outstandingDebt: data.outstandingDebt,
      creditLimit: data.creditLimit,
      lastPurchaseDate: null,
      riskRating: data.riskRating,
    }));

    onSave(customersToSave);
    onClose();
  };

  const handleClose = () => {
    setActiveView('selection');
    setImportedData([]);
    setSearchQuery('');
    selectAllContacts(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <CustomDialogContent className="max-w-6xl w-[95vw] max-h-[90vh] p-0 flex flex-col bg-background">
        <DialogTitle className="sr-only">Import Customers from Contacts</DialogTitle>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <ContactRound className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Import Customers from Contacts</h2>
              <p className="text-sm text-muted-foreground">
                {activeView === 'selection' 
                  ? `${selectedCount} of ${contacts.length} contacts selected`
                  : `${importedData.length} customers ready to import`
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {activeView === 'spreadsheet' && (
              <Button onClick={handleBackToSelection} variant="outline" size="sm">
                Back to Selection
              </Button>
            )}
            {activeView === 'selection' ? (
              <Button
                onClick={handleProceedToSpreadsheet}
                disabled={selectedCount === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Review Selected ({selectedCount})
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={importedData.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Import Customers ({importedData.length})
              </Button>
            )}
            <Button onClick={handleClose} variant="ghost" size="sm" className="p-2">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {activeView === 'selection' ? (
            <div className="flex flex-col h-full">
              {/* Search and Controls */}
              <div className="p-4 border-b border-border bg-muted/10 space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search contacts by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Select All */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                      Select All Contacts
                    </label>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {filteredContacts.length} contacts available
                  </div>
                </div>
              </div>

              {/* Contacts List */}
              <div className="flex-1 overflow-auto p-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading contacts...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <ContactRound className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-destructive">{error}</p>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="text-center py-8">
                    <ContactRound className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No contacts found</p>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={cn(
                          "border border-border rounded-lg p-3 cursor-pointer transition-colors",
                          contact.selected 
                            ? "bg-primary/10 border-primary" 
                            : "bg-card hover:bg-muted"
                        )}
                        onClick={() => toggleContactSelection(contact.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            checked={contact.selected}
                            onChange={() => toggleContactSelection(contact.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{contact.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{contact.phone}</p>
                            {contact.email && (
                              <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <div className="min-w-[800px]">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-muted z-10">
                    <tr>
                      <th className="border border-border p-2 text-left text-xs font-medium uppercase tracking-wider min-w-[180px]">
                        Name*
                      </th>
                      <th className="border border-border p-2 text-left text-xs font-medium uppercase tracking-wider min-w-[150px]">
                        Phone*
                      </th>
                      <th className="border border-border p-2 text-left text-xs font-medium uppercase tracking-wider min-w-[150px]">
                        Email
                      </th>
                      <th className="border border-border p-2 text-left text-xs font-medium uppercase tracking-wider min-w-[150px]">
                        Address
                      </th>
                      <th className="border border-border p-2 text-left text-xs font-medium uppercase tracking-wider min-w-[120px]">
                        Credit Limit
                      </th>
                      <th className="border border-border p-2 text-left text-xs font-medium uppercase tracking-wider min-w-[100px]">
                        Risk Rating
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {importedData.map((customer, index) => (
                      <tr key={index} className="hover:bg-muted/50 transition-colors">
                        <td className="border border-border p-1">
                          <Input
                            value={customer.name}
                            onChange={(e) => updateImportedData(index, 'name', e.target.value)}
                            className="border-0 h-9 text-sm focus-visible:ring-1"
                          />
                        </td>
                        <td className="border border-border p-1">
                          <Input
                            value={customer.phone}
                            onChange={(e) => updateImportedData(index, 'phone', e.target.value)}
                            className="border-0 h-9 text-sm focus-visible:ring-1"
                          />
                        </td>
                        <td className="border border-border p-1">
                          <Input
                            value={customer.email || ''}
                            onChange={(e) => updateImportedData(index, 'email', e.target.value)}
                            placeholder="Optional"
                            className="border-0 h-9 text-sm focus-visible:ring-1"
                          />
                        </td>
                        <td className="border border-border p-1">
                          <Input
                            value={customer.address || ''}
                            onChange={(e) => updateImportedData(index, 'address', e.target.value)}
                            placeholder="Optional"
                            className="border-0 h-9 text-sm focus-visible:ring-1"
                          />
                        </td>
                        <td className="border border-border p-1">
                          <Input
                            type="number"
                            min="0"
                            value={customer.creditLimit}
                            onChange={(e) => updateImportedData(index, 'creditLimit', parseFloat(e.target.value) || 0)}
                            className="border-0 h-9 text-sm focus-visible:ring-1"
                          />
                        </td>
                        <td className="border border-border p-1">
                          <select
                            value={customer.riskRating}
                            onChange={(e) => updateImportedData(index, 'riskRating', e.target.value as 'low' | 'medium' | 'high')}
                            className="w-full h-9 bg-background border-0 text-sm focus:ring-1 rounded"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </CustomDialogContent>
    </Dialog>
  );
};

export default ImportContactsModal;
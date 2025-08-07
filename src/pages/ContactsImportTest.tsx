import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useContactsImport, ImportedCustomerData } from '../hooks/useContactsImport';
import { Customer } from '../types';

const ContactsImportTest = () => {
  const [importedCustomers, setImportedCustomers] = useState<ImportedCustomerData[]>([]);
  const { importContactsDirectly } = useContactsImport();

  const handleImport = async () => {
    try {
      const contacts = await importContactsDirectly();
      setImportedCustomers(contacts);
      console.log('Imported customers:', contacts);
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Contact Import Test</h1>
      
      <Button onClick={handleImport} className="mb-4">
        Test Import from Contacts (Direct)
      </Button>

      {importedCustomers.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Imported Customers ({importedCustomers.length})</h2>
          <div className="grid gap-4">
            {importedCustomers.map((customer, index) => (
              <div key={index} className="border p-4 rounded-lg">
                <p><strong>Name:</strong> {customer.name}</p>
                <p><strong>Phone:</strong> {customer.phone}</p>
                <p><strong>Email:</strong> {customer.email || 'Not provided'}</p>
                <p><strong>Address:</strong> {customer.address || 'Not provided'}</p>
                <p><strong>Credit Limit:</strong> {customer.creditLimit}</p>
                <p><strong>Risk Rating:</strong> {customer.riskRating}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsImportTest;
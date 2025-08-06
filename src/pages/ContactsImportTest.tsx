import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import ImportContactsModal from '../components/customers/ImportContactsModal';
import { Customer } from '../types';

const ContactsImportTest = () => {
  const [showModal, setShowModal] = useState(false);
  const [importedCustomers, setImportedCustomers] = useState<Omit<Customer, 'id' | 'createdDate'>[]>([]);

  const handleImport = (customers: Omit<Customer, 'id' | 'createdDate'>[]) => {
    setImportedCustomers(customers);
    console.log('Imported customers:', customers);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Contact Import Test</h1>
      
      <Button onClick={() => setShowModal(true)} className="mb-4">
        Test Import from Contacts
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

      <ImportContactsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleImport}
      />
    </div>
  );
};

export default ContactsImportTest;

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Customer } from '../../types';

interface AddCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCustomer: (customer: Omit<Customer, 'id' | 'createdDate'>) => void;
  loading?: boolean;
}

const AddCustomerModal = ({ open, onOpenChange, onCreateCustomer, loading }: AddCustomerModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 1000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      return;
    }

    onCreateCustomer({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      totalPurchases: 0,
      outstandingDebt: 0,
      creditLimit: formData.creditLimit,
      riskRating: 'low',
      lastPurchaseDate: null,
    });

    // Reset form
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      creditLimit: 1000,
    });
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add New Customer</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Customer name"
                required
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone *
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Phone number"
                required
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Email address (optional)"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="address" className="text-sm font-medium">
                Address
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Address (optional)"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="creditLimit" className="text-sm font-medium">
                Credit Limit (KES)
              </Label>
              <Input
                id="creditLimit"
                type="number"
                value={formData.creditLimit}
                onChange={(e) => handleChange('creditLimit', Number(e.target.value))}
                placeholder="1000"
                min="0"
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !formData.name.trim() || !formData.phone.trim()}
            >
              {loading ? 'Adding...' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomerModal;

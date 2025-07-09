
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Customer } from '../../types';
import { useSupabaseCustomers } from '../../hooks/useSupabaseCustomers';
import { useToast } from '../../hooks/use-toast';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  onClose,
  customer
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    outstandingDebt: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const { updateCustomer } = useSupabaseCustomers();
  const { toast } = useToast();

  useEffect(() => {
    if (customer && isOpen) {
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        outstandingDebt: customer.outstandingDebt.toString()
      });
      setErrors({});
    }
  }, [customer, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (formData.outstandingDebt && isNaN(parseFloat(formData.outstandingDebt))) {
      newErrors.outstandingDebt = 'Valid balance is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!customer || !validateForm()) return;

    setLoading(true);

    try {
      const updatedCustomer = {
        ...customer,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        outstandingDebt: parseFloat(formData.outstandingDebt) || 0
      };

      await updateCustomer(customer.id, updatedCustomer);
      
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });

      onClose();
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setErrors({});
    onClose();
  };

  const isFormValid = formData.name && formData.phone;

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Edit Customer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={errors.name ? 'border-red-500' : ''}
              placeholder="Customer name"
              disabled={loading}
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone *
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className={errors.phone ? 'border-red-500' : ''}
              placeholder="0712345678"
              disabled={loading}
            />
            {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="customer@example.com"
              disabled={loading}
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Address
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Customer address"
              disabled={loading}
            />
          </div>

          {/* Outstanding Balance */}
          <div className="space-y-2">
            <Label htmlFor="outstandingDebt" className="text-sm font-medium">
              Outstanding Balance (KES)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                KES
              </span>
              <Input
                id="outstandingDebt"
                type="number"
                step="0.01"
                value={formData.outstandingDebt}
                onChange={(e) => setFormData(prev => ({ ...prev, outstandingDebt: e.target.value }))}
                className={`pl-12 ${errors.outstandingDebt ? 'border-red-500' : ''}`}
                placeholder="0.00"
                disabled={loading}
              />
            </div>
            {errors.outstandingDebt && <p className="text-red-500 text-sm">{errors.outstandingDebt}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isFormValid || loading}
              className="flex-1 bg-purple-600 hover:bg-purple-500"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditCustomerModal;

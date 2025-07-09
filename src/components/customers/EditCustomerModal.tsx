
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    outstandingDebt: '',
    creditLimit: 1000
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
        outstandingDebt: customer.outstandingDebt.toString(),
        creditLimit: customer.creditLimit || 1000
      });
      setErrors({});
    }
  }, [customer, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    
    // Email validation if provided
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    if (formData.outstandingDebt && isNaN(parseFloat(formData.outstandingDebt))) {
      newErrors.outstandingDebt = 'Valid balance is required';
    }

    if (formData.creditLimit < 0) {
      newErrors.creditLimit = 'Credit limit must be positive';
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
        outstandingDebt: parseFloat(formData.outstandingDebt) || 0,
        creditLimit: formData.creditLimit
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Edit Customer
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Customer name"
                disabled={loading}
                required
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone *
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className={`mt-1 ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="Phone number"
                disabled={loading}
                required
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Email address (optional)"
                disabled={loading}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address" className="text-sm font-medium">
                Address
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="mt-1 resize-none"
                placeholder="Address (optional)"
                disabled={loading}
                rows={3}
              />
            </div>

            {/* Outstanding Balance */}
            <div>
              <Label htmlFor="outstandingDebt" className="text-sm font-medium">
                Outstanding Balance (KES)
              </Label>
              <Input
                id="outstandingDebt"
                type="number"
                step="0.01"
                value={formData.outstandingDebt}
                onChange={(e) => setFormData(prev => ({ ...prev, outstandingDebt: e.target.value }))}
                className={`mt-1 ${errors.outstandingDebt ? 'border-red-500' : ''}`}
                placeholder="0.00"
                disabled={loading}
              />
              {errors.outstandingDebt && <p className="text-red-500 text-sm mt-1">{errors.outstandingDebt}</p>}
            </div>

            {/* Credit Limit */}
            <div>
              <Label htmlFor="creditLimit" className="text-sm font-medium">
                Credit Limit (KES)
              </Label>
              <Input
                id="creditLimit"
                type="number"
                value={formData.creditLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: Number(e.target.value) }))}
                className={`mt-1 ${errors.creditLimit ? 'border-red-500' : ''}`}
                placeholder="1000"
                min="0"
                disabled={loading}
              />
              {errors.creditLimit && <p className="text-red-500 text-sm mt-1">{errors.creditLimit}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCustomerModal;

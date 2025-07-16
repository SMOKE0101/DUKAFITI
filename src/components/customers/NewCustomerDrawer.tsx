
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { X, UserPlus } from 'lucide-react';
import { Customer } from '../../types';

interface NewCustomerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'created_date' | 'updated_at'>) => void;
}

const NewCustomerDrawer: React.FC<NewCustomerDrawerProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    credit_limit: 1000,
    risk_rating: 'low' as 'low' | 'medium' | 'high'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        user_id: '', // This will be set by the parent component
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        credit_limit: formData.credit_limit,
        outstanding_debt: 0,
        total_purchases: 0,
        risk_rating: formData.risk_rating
      });
      
      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        credit_limit: 1000,
        risk_rating: 'low'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      credit_limit: 1000,
      risk_rating: 'low'
    });
    onClose();
  };

  const isFormValid = formData.name.trim() && formData.phone.trim();

  const content = (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-display font-semibold">Add New Customer</h3>
        <p className="text-muted-foreground mt-2">Create a new customer record</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Customer Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter customer name"
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Enter phone number"
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email (Optional)</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email address"
          />
        </div>

        <div>
          <Label htmlFor="address">Address (Optional)</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Enter customer address"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="creditLimit">Credit Limit (KES)</Label>
            <Input
              id="creditLimit"
              type="number"
              min="0"
              step="100"
              value={formData.credit_limit}
              onChange={(e) => setFormData({ ...formData, credit_limit: parseInt(e.target.value) || 0 })}
              placeholder="1000"
            />
          </div>

          <div>
            <Label htmlFor="riskRating">Risk Rating</Label>
            <Select 
              value={formData.risk_rating} 
              onValueChange={(value: 'low' | 'medium' | 'high') => 
                setFormData({ ...formData, risk_rating: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          variant="ghost"
          onClick={handleClose}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!isFormValid || isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? 'Creating...' : 'Create Customer'}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleClose}>
        <DrawerContent className="px-6 pb-6">
          <DrawerHeader className="text-center pb-0">
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-4 p-2"
                onClick={handleClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </DrawerClose>
            <DrawerTitle className="sr-only">Add New Customer</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="sr-only">Add New Customer</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute right-4 top-4 p-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default NewCustomerDrawer;

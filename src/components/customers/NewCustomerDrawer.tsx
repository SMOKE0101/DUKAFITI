
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { Customer } from '../../types';
import { User, Phone, Mail, MapPin } from 'lucide-react';

interface NewCustomerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const NewCustomerDrawer: React.FC<NewCustomerDrawerProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    outstandingDebt: 0,
    creditLimit: 1000
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and phone are required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        outstandingDebt: formData.outstandingDebt,
        creditLimit: formData.creditLimit,
        totalPurchases: 0,
        riskRating: 'low',
        createdDate: new Date().toISOString(),
        lastPurchaseDate: undefined
      });

      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        outstandingDebt: 0,
        creditLimit: 1000
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to create customer:', error);
      toast({
        title: "Error",
        description: "Failed to create customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      outstandingDebt: 0,
      creditLimit: 1000
    });
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <SheetTitle className="font-mono text-xl font-black uppercase tracking-wider text-gray-900 dark:text-white">
            ADD NEW CUSTOMER
          </SheetTitle>
        </SheetHeader>

        <div className="py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="font-mono text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                CUSTOMER NAME *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="pl-10 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  placeholder="Enter customer name"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-mono text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                PHONE NUMBER *
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="pl-10 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  placeholder="Enter phone number"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-mono text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                EMAIL (OPTIONAL)
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  placeholder="Enter email address"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="font-mono text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                ADDRESS (OPTIONAL)
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="pl-10 min-h-[80px] border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none"
                  placeholder="Enter customer address"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Credit Limit */}
            <div className="space-y-2">
              <Label htmlFor="creditLimit" className="font-mono text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                CREDIT LIMIT (KES)
              </Label>
              <Input
                id="creditLimit"
                type="number"
                min="0"
                step="0.01"
                value={formData.creditLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: parseFloat(e.target.value) || 0 }))}
                className="h-12 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:border-green-500 focus:ring-2 focus:ring-green-200"
                placeholder="1000.00"
                disabled={isSubmitting}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-full font-mono font-bold uppercase tracking-wide"
              >
                CANCEL
              </Button>
              <Button
                type="submit"
                disabled={!formData.name.trim() || !formData.phone.trim() || isSubmitting}
                className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full font-mono font-bold uppercase tracking-wide"
              >
                {isSubmitting ? 'CREATING...' : 'CREATE CUSTOMER'}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NewCustomerDrawer;

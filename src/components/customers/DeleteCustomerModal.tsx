
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Customer } from '../../types';
import { AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface DeleteCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onDelete: (id: string) => Promise<void>;
  isDeleting?: boolean;
}

const DeleteCustomerModal: React.FC<DeleteCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onDelete,
  isDeleting = false
}) => {
  const handleDelete = async () => {
    if (!customer) return;
    
    try {
      await onDelete(customer.id);
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Delete Customer
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                This action cannot be undone
              </p>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Customer Details */}
          <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
            <h3 className="font-semibold text-red-900 mb-2">Customer to Delete</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span>{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.outstandingDebt && customer.outstandingDebt > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Outstanding Debt:</span>
                  <span className="text-red-600 font-semibold">
                    {formatCurrency(customer.outstandingDebt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Warning Message */}
          <div className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
            <p className="text-sm text-yellow-800 text-center">
              <strong>Warning:</strong> This will permanently remove <strong>{customer.name}</strong> from your customer database. All purchase history and debt records will be lost.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete Customer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCustomerModal;

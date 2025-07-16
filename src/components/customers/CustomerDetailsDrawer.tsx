
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { User, Phone, Mail, MapPin, Calendar, DollarSign, TrendingUp, CreditCard, Edit, Trash2 } from 'lucide-react';
import EditCustomerModal from './EditCustomerModal';
import DeleteCustomerModal from './DeleteCustomerModal';

interface CustomerDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onEdit?: (id: string, updates: Partial<Customer>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const CustomerDetailsDrawer: React.FC<CustomerDetailsDrawerProps> = ({
  isOpen,
  onClose,
  customer,
  onEdit,
  onDelete
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!customer) return null;

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleEditSave = async (id: string, updates: Partial<Customer>) => {
    if (onEdit) {
      await onEdit(id, updates);
    }
    setShowEditModal(false);
  };

  const handleDeleteConfirm = async (id: string) => {
    if (onDelete) {
      await onDelete(id);
    }
    setShowDeleteModal(false);
    onClose();
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
          <SheetHeader className="border-b border-gray-200 dark:border-gray-700 pb-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-mono text-xl font-black uppercase tracking-wider text-gray-900 dark:text-white">
                CUSTOMER DETAILS
              </SheetTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditClick}
                  className="border-2 border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-mono text-xs font-bold uppercase"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  EDIT
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteClick}
                  className="border-2 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-mono text-xs font-bold uppercase"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  DELETE
                </Button>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 overflow-hidden">
            <div className="py-6 space-y-6 px-1">
            {/* Basic Info */}
            <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white mb-4">
                BASIC INFORMATION
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{customer.phone}</p>
                  </div>
                </div>

                {customer.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{customer.email}</p>
                    </div>
                  </div>
                )}

                {customer.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{customer.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Info */}
            <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white mb-4">
                FINANCIAL DETAILS
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Outstanding Debt:</span>
                  </div>
                  <Badge variant={customer.outstanding_debt > 0 ? "destructive" : "default"} className="rounded-full">
                    {formatCurrency(customer.outstanding_debt)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Credit Limit:</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(customer.credit_limit || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Purchases:</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(customer.total_purchases || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Risk Rating:</span>
                  <Badge variant={
                    customer.risk_rating === 'high' ? 'destructive' : 
                    customer.risk_rating === 'medium' ? 'secondary' : 'default'
                  } className="rounded-full">
                    {customer.risk_rating?.toUpperCase() || 'LOW'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Timeline Info */}
            <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-transparent">
              <h3 className="font-mono text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white mb-4">
                TIMELINE
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Customer Since:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {customer.created_date ? new Date(customer.created_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {customer.last_purchase_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Last Purchase:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(customer.last_purchase_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

              {/* Action Button */}
              <div className="pt-4">
                <Button
                  onClick={onClose}
                  className="w-full h-12 bg-gray-600 hover:bg-gray-700 text-white rounded-full font-mono font-bold uppercase tracking-wide"
                >
                  CLOSE
                </Button>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Edit Modal */}
      {showEditModal && customer && (
        <EditCustomerModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          customer={customer}
          onSave={handleEditSave}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && customer && (
        <DeleteCustomerModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          customer={customer}
          onDelete={handleDeleteConfirm}
        />
      )}
    </>
  );
};

export default CustomerDetailsDrawer;

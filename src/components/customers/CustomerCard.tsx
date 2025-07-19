
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Edit, Trash2, CreditCard, Phone, Mail, MapPin } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Customer } from '../../types';

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onRecordPayment: (customer: Customer) => void;
  isDeleting?: boolean;
  isRecordingPayment?: boolean;
}

const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onEdit,
  onDelete,
  onRecordPayment,
  isDeleting = false,
  isRecordingPayment = false
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRiskBadgeColor = (rating: string) => {
    switch (rating) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBalanceColor = (debt: number) => {
    if (debt === 0) return 'bg-green-100 text-green-800';
    if (debt <= 1000) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card className={`relative transition-all duration-200 hover:shadow-lg ${
      isDeleting || isRecordingPayment ? 'opacity-50' : ''
    }`}>
      {/* Loading overlay */}
      {(isDeleting || isRecordingPayment) && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{customer.name}</CardTitle>
              <Badge className={`text-xs ${getRiskBadgeColor(customer.riskRating)}`}>
                {customer.riskRating} risk
              </Badge>
            </div>
          </div>
          <Badge className={`${getBalanceColor(customer.outstandingDebt || 0)}`}>
            {formatCurrency(customer.outstandingDebt || 0)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Contact Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span>{customer.phone}</span>
          </div>
          
          {customer.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span className="truncate">{customer.email}</span>
            </div>
          )}
          
          {customer.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{customer.address}</span>
            </div>
          )}
        </div>

        {/* Financial Info */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Purchases:</span>
            <span className="font-medium text-green-600">
              {formatCurrency(customer.totalPurchases || 0)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Credit Limit:</span>
            <span className="font-medium">
              {formatCurrency(customer.creditLimit || 1000)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRecordPayment(customer)}
            disabled={(customer.outstandingDebt || 0) === 0}
            className="flex-1"
          >
            <CreditCard className="w-4 h-4 mr-1" />
            Payment
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(customer)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(customer)}
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerCard;

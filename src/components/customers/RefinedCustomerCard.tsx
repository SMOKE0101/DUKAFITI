
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { History, Edit, Trash2, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { Customer } from '../../types';

interface RefinedCustomerCardProps {
  customer: Customer;
  onViewHistory: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onRecordRepayment: (customer: Customer) => void;
  isUpdating?: boolean;
}

const RefinedCustomerCard: React.FC<RefinedCustomerCardProps> = ({
  customer,
  onViewHistory,
  onEdit,
  onDelete,
  onRecordRepayment,
  isUpdating = false
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBalanceStatus = () => {
    if (customer.outstandingDebt === 0) {
      return { color: 'bg-green-100 text-green-800', avatarColor: 'bg-green-100 text-green-600' };
    } else if (customer.outstandingDebt <= 1000) {
      return { color: 'bg-yellow-100 text-yellow-800', avatarColor: 'bg-yellow-100 text-yellow-600' };
    } else {
      return { color: 'bg-red-100 text-red-800', avatarColor: 'bg-red-100 text-red-600' };
    }
  };

  const balanceStatus = getBalanceStatus();

  return (
    <Card className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-200 relative ${
      isUpdating ? 'opacity-75' : ''
    }`}>
      <CardContent className="p-0">
        {/* Loading overlay */}
        {isUpdating && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Top Row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Avatar className={`w-12 h-12 ${balanceStatus.avatarColor} flex-shrink-0`}>
              <AvatarFallback className="font-semibold">
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-display font-semibold text-foreground truncate">{customer.name}</h3>
              <p className="text-sm text-gray-500">{customer.phone}</p>
              
              {/* Email Field */}
              <p className="text-sm text-gray-600 mt-1">
                {customer.email ? (
                  <span className="truncate block">{customer.email}</span>
                ) : (
                  <span className="italic">No email provided</span>
                )}
              </p>
              
              {/* Address Field */}
              <p className="text-sm text-gray-600 mt-1">
                {customer.address ? (
                  <span className="line-clamp-2 leading-tight">{customer.address}</span>
                ) : (
                  <span className="italic">No address provided</span>
                )}
              </p>
            </div>
          </div>

          {/* Balance Badge - Fixed positioning */}
          <div className="flex-shrink-0 ml-2">
            <Badge className={`px-3 py-1 rounded-full text-sm ${balanceStatus.color}`}>
              {formatCurrency(customer.outstandingDebt)}
            </Badge>
          </div>
        </div>

        {/* Action Row - Icon Only Buttons */}
        <div className="flex gap-3 justify-end mt-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => onViewHistory(customer)}
                className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-all duration-200 hover:scale-110 active:scale-95 p-0"
                aria-label="View history"
              >
                <History className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View history</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => onRecordRepayment(customer)}
                disabled={customer.outstandingDebt === 0}
                className="w-10 h-10 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full hover:bg-green-200 dark:hover:bg-green-900/40 transition-all duration-200 hover:scale-110 active:scale-95 p-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                aria-label="Record payment"
              >
                <CreditCard className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Record payment</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => onEdit(customer)}
                className="w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-110 active:scale-95 p-0"
                aria-label="Edit customer"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit customer</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => onDelete(customer)}
                className="w-10 h-10 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200 hover:scale-110 active:scale-95 p-0"
                aria-label="Delete customer"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete customer</TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
};

export default RefinedCustomerCard;

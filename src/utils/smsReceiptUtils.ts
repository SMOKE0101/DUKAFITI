import { formatCurrency } from './currency';
import { CartItem, SplitPaymentData } from '../types/cart';
import { Customer } from '../types';

interface ReceiptData {
  shopName: string;
  customer?: Customer | null;
  cart: CartItem[];
  total: number;
  paymentMethod: 'cash' | 'mpesa' | 'debt' | 'split';
  splitPaymentData?: SplitPaymentData | null;
  salesReference?: string;
  timestamp: Date;
}

export const generateSMSReceipt = (data: ReceiptData): string => {
  const {
    shopName,
    customer,
    cart,
    total,
    paymentMethod,
    splitPaymentData,
    salesReference,
    timestamp
  } = data;

  // Format date and time
  const dateStr = timestamp.toLocaleDateString('en-KE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  const timeStr = timestamp.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // Start building the receipt
  let receipt = `_receipt from ${shopName}_\n`;
  receipt += `${dateStr} ${timeStr}\n`;
  
  if (customer?.name) {
    receipt += `Customer: ${customer.name}\n`;
  }
  
  receipt += '\n';

  // Add itemized list
  cart.forEach(item => {
    const itemTotal = item.sellingPrice * item.quantity;
    receipt += `${item.name}\n`;
    receipt += `  ${item.quantity} x ${formatCurrency(item.sellingPrice)} = ${formatCurrency(itemTotal)}\n`;
  });
  
  receipt += '\n';

  // Add payment details
  if (paymentMethod === 'split' && splitPaymentData) {
    receipt += 'Payment Methods:\n';
    if (splitPaymentData.methods.cash) {
      receipt += `Cash: ${formatCurrency(splitPaymentData.methods.cash.amount)}\n`;
    }
    if (splitPaymentData.methods.mpesa) {
      receipt += `M-Pesa: ${formatCurrency(splitPaymentData.methods.mpesa.amount)}\n`;
    }
    if (splitPaymentData.methods.debt) {
      receipt += `Debt: ${formatCurrency(splitPaymentData.methods.debt.amount)}\n`;
    }
    if (splitPaymentData.methods.discount) {
      receipt += `Discount: -${formatCurrency(splitPaymentData.methods.discount.amount)}\n`;
    }
  } else {
    const methodNames = {
      cash: 'Cash',
      mpesa: 'M-Pesa',
      debt: 'Debt'
    };
    receipt += `Payment: ${methodNames[paymentMethod]}\n`;
  }
  
  receipt += `Total: ${formatCurrency(total)}\n`;
  
  if (salesReference) {
    receipt += `Ref: ${salesReference}\n`;
  }
  
  receipt += `\nThank you for shopping with ${shopName}!`;

  return receipt;
};

// Validate phone number format
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return false;
  }
  
  // Remove all non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid Kenyan phone number (starts with 07, 01, or +2547, +2541)
  const kenyanPhoneRegex = /^(07|01|\+2547|\+2541)\d{8}$/;
  return kenyanPhoneRegex.test(cleanNumber);
};

// Format phone number for SMS sending
export const formatPhoneNumberForSMS = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Format for international format
  if (cleanNumber.startsWith('0')) {
    return `+254${cleanNumber.substring(1)}`;
  } else if (cleanNumber.startsWith('254')) {
    return `+${cleanNumber}`;
  }
  
  return phoneNumber;
};

import { Product } from './index';

export interface CartItem extends Product {
  quantity: number;
  customPrice?: number;
}

export interface PaymentDetails {
  cashAmount: number;
  mpesaAmount: number;
  debtAmount: number;
  mpesaReference?: string;
  tillNumber?: string;
}

export interface SplitPaymentData {
  methods: {
    cash?: { amount: number; percentage: number };
    mpesa?: { amount: number; percentage: number; reference?: string };
    debt?: { amount: number; percentage: number; customerId?: string };
  };
  total: number;
  isValid: boolean;
}
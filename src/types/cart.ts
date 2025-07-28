import { Product } from './index';

export interface CartItem extends Product {
  quantity: number;
  customPrice?: number;
}
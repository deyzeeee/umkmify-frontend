export interface Product {
  id: string;
  name: string;
  category: 'Minuman' | 'Makanan' | 'Sembako' | 'Lainnya';
  price: number;
  costPrice?: number;
  stock: number;
  minStock: number;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'Selesai' | 'Pending';
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  storeName: string;
  email: string;
}

export interface DailySales {
  day: string;
  amount: number;
}

export interface TopProduct {
  id: string;
  name: string;
  sold: number;
  price: number;
}
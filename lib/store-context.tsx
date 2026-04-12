'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Product, CartItem, Transaction, User, DailySales, TopProduct } from './types';

// Initial mock data
const initialProducts: Product[] = [
  { id: '1', name: 'Kopi Susu Gula Aren', category: 'Minuman', price: 25000, stock: 45, minStock: 10, updatedAt: '2024-01-15' },
  { id: '2', name: 'Es Teh Manis', category: 'Minuman', price: 8000, stock: 100, minStock: 20, updatedAt: '2024-01-15' },
  { id: '3', name: 'Nasi Goreng Spesial', category: 'Makanan', price: 28000, stock: 30, minStock: 10, updatedAt: '2024-01-14' },
  { id: '4', name: 'Mie Goreng', category: 'Makanan', price: 22000, stock: 25, minStock: 10, updatedAt: '2024-01-14' },
  { id: '5', name: 'Beras Premium 5kg', category: 'Sembako', price: 75000, stock: 4, minStock: 5, updatedAt: '2024-01-13' },
  { id: '6', name: 'Minyak Goreng 2L', category: 'Sembako', price: 32000, stock: 3, minStock: 5, updatedAt: '2024-01-13' },
  { id: '7', name: 'Gula Pasir 1kg', category: 'Sembako', price: 15000, stock: 20, minStock: 10, updatedAt: '2024-01-12' },
  { id: '8', name: 'Americano', category: 'Minuman', price: 20000, stock: 50, minStock: 15, updatedAt: '2024-01-12' },
  { id: '9', name: 'Matcha Latte', category: 'Minuman', price: 28000, stock: 0, minStock: 10, updatedAt: '2024-01-11' },
  { id: '10', name: 'Ayam Geprek', category: 'Makanan', price: 25000, stock: 15, minStock: 8, updatedAt: '2024-01-11' },
];

const initialTransactions: Transaction[] = [
  { id: 'TRX001', items: [], subtotal: 75000, tax: 7500, total: 82500, status: 'Selesai', createdAt: '2024-01-15 14:30' },
  { id: 'TRX002', items: [], subtotal: 125000, tax: 12500, total: 137500, status: 'Selesai', createdAt: '2024-01-15 13:15' },
  { id: 'TRX003', items: [], subtotal: 45000, tax: 4500, total: 49500, status: 'Selesai', createdAt: '2024-01-15 11:45' },
  { id: 'TRX004', items: [], subtotal: 200000, tax: 20000, total: 220000, status: 'Selesai', createdAt: '2024-01-14 16:20' },
  { id: 'TRX005', items: [], subtotal: 88000, tax: 8800, total: 96800, status: 'Selesai', createdAt: '2024-01-14 10:00' },
];

const dailySalesData: DailySales[] = [
  { day: 'Sen', amount: 5200000 },
  { day: 'Sel', amount: 4800000 },
  { day: 'Rab', amount: 6100000 },
  { day: 'Kam', amount: 5500000 },
  { day: 'Jum', amount: 7200000 },
  { day: 'Sab', amount: 8100000 },
  { day: 'Min', amount: 6800000 },
];

const topProductsData: TopProduct[] = [
  { id: '1', name: 'Kopi Susu Gula Aren', sold: 156, price: 25000 },
  { id: '2', name: 'Nasi Goreng Spesial', sold: 98, price: 28000 },
  { id: '3', name: 'Es Teh Manis', sold: 87, price: 8000 },
  { id: '4', name: 'Ayam Geprek', sold: 72, price: 25000 },
  { id: '5', name: 'Mie Goreng', sold: 65, price: 22000 },
];

interface StoreContextType {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { name: string; storeName: string; email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Cart
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Transactions
  transactions: Transaction[];
  processTransaction: () => Transaction | null;
  
  // Dashboard data
  dailySales: DailySales[];
  topProducts: TopProduct[];
  
  // Metrics
  todaySales: number;
  totalTransactions: number;
  lowStockCount: number;
  profitMargin: number;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  
  const isAuthenticated = user !== null;
  
  // Auth functions
  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      id: '1',
      name: 'Ahmad Fauzi',
      storeName: 'Warung Berkah',
      email: email,
    });
    return true;
  }, []);
  
  const register = useCallback(async (data: { name: string; storeName: string; email: string; password: string }): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      id: '1',
      name: data.name,
      storeName: data.storeName,
      email: data.email,
    });
    return true;
  }, []);
  
  const logout = useCallback(() => {
    setUser(null);
    setCart([]);
  }, []);
  
  // Product functions
  const addProduct = useCallback((product: Omit<Product, 'id' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setProducts(prev => [...prev, newProduct]);
  }, []);
  
  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : p
    ));
  }, []);
  
  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);
  
  // Cart functions
  const addToCart = useCallback((product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);
  
  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);
  
  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    ));
  }, [removeFromCart]);
  
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);
  
  // Transaction functions
  const processTransaction = useCallback((): Transaction | null => {
    if (cart.length === 0) return null;
    
    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    
    const transaction: Transaction = {
      id: `TRX${String(transactions.length + 1).padStart(3, '0')}`,
      items: [...cart],
      subtotal,
      tax,
      total,
      status: 'Selesai',
      createdAt: new Date().toLocaleString('id-ID'),
    };
    
    // Update stock
    setProducts(prev => prev.map(product => {
      const cartItem = cart.find(item => item.product.id === product.id);
      if (cartItem) {
        return { ...product, stock: product.stock - cartItem.quantity };
      }
      return product;
    }));
    
    setTransactions(prev => [transaction, ...prev]);
    setCart([]);
    
    return transaction;
  }, [cart, transactions.length]);
  
  // Computed metrics
  const todaySales = 6800000;
  const totalTransactions = 342;
  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
  const profitMargin = 28;
  
  const value: StoreContextType = {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    transactions,
    processTransaction,
    dailySales: dailySalesData,
    topProducts: topProductsData,
    todaySales,
    totalTransactions,
    lowStockCount,
    profitMargin,
  };
  
  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

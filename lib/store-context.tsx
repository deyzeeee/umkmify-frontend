'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Product, CartItem, Transaction, User, DailySales, TopProduct } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://umkmify-backend.vercel.app';

const validCategories = ['Minuman', 'Makanan', 'Sembako', 'Lainnya'] as const;

interface StoreContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { name: string; storeName: string; email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  transactions: Transaction[];
  processTransaction: () => Promise<Transaction | null>;
  dailySales: DailySales[];
  topProducts: TopProduct[];
  todaySales: number;
  totalTransactions: number;
  lowStockCount: number;
  profitMargin: number;
  refreshProducts: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const getToken = () => {
  if (typeof window !== 'undefined') return localStorage.getItem('token');
  return null;
};

const authHeader = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [todaySales, setTodaySales] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [profitMargin] = useState(28);

  const isAuthenticated = user !== null;

  useEffect(() => {
    const token = getToken();
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshProducts();
      refreshDashboard();
      refreshTransactions();
    }
  }, [isAuthenticated]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message || 'Login gagal'); return false; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser({ id: data.user.id, name: data.user.email, storeName: data.user.store_name, email: data.user.email });
      return true;
    } catch { alert('Gagal terhubung ke server'); return false; }
  }, []);

  const register = useCallback(async (data: { name: string; storeName: string; email: string; password: string }): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password, store_name: data.storeName, nama_lengkap: data.name }),
      });
      const result = await res.json();
      if (!res.ok) { alert(result.message || 'Registrasi gagal'); return false; }
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      setUser({ id: result.user.id, name: data.name, storeName: data.storeName, email: data.email });
      return true;
    } catch { alert('Gagal terhubung ke server'); return false; }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCart([]);
    setProducts([]);
    setTransactions([]);
  }, []);

  const refreshProducts = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/products`, { headers: authHeader() });
      if (!res.ok) return;
      const data = await res.json();
      const mapped: Product[] = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: (validCategories.includes(p.category) ? p.category : 'Lainnya') as Product['category'],
        price: p.price,
        costPrice: p.cost_price || 0,
        stock: p.stock,
        minStock: p.low_stock_threshold || 5,
        updatedAt: p.created_at?.split('T')[0] || '-',
      }));
      setProducts(mapped);
      setLowStockCount(mapped.filter(p => p.stock <= p.minStock && p.stock > 0).length);
    } catch (err) { console.error('Gagal fetch produk:', err); }
  }, []);

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'updatedAt'>) => {
    try {
      const res = await fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          name: product.name,
          price: product.price,
          cost_price: product.costPrice || 0,
          stock: product.stock,
          category: product.category,
          low_stock_threshold: product.minStock,
        }),
      });
      if (!res.ok) return;
      await refreshProducts();
    } catch (err) { console.error('Gagal tambah produk:', err); }
  }, [refreshProducts]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    try {
      const res = await fetch(`${BASE_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify({
          name: updates.name,
          price: updates.price,
          cost_price: updates.costPrice || 0,
          stock: updates.stock,
          category: updates.category,
          low_stock_threshold: updates.minStock,
        }),
      });
      if (!res.ok) return;
      await refreshProducts();
    } catch (err) { console.error('Gagal update produk:', err); }
  }, [refreshProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/products/${id}`, { method: 'DELETE', headers: authHeader() });
      if (!res.ok) return;
      await refreshProducts();
    } catch (err) { console.error('Gagal hapus produk:', err); }
  }, [refreshProducts]);

  const refreshDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/dashboard/stats`, { headers: authHeader() });
      if (!res.ok) return;
      const data = await res.json();

      setTodaySales(data.omzet_hari_ini || 0);
      setTotalTransactions(data.jumlah_transaksi || 0);
      setLowStockCount(data.produk_stok_kritis || 0);

      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const salesMap: Record<string, number> = {};
      days.forEach(d => salesMap[d] = 0);

      if (data.penjualan_7_hari?.length > 0) {
        data.penjualan_7_hari.forEach((item: any) => {
          const total = (item.quantity || 1) * (item.price || 0);
          const dayIdx = new Date().getDay();
          salesMap[days[dayIdx]] = (salesMap[days[dayIdx]] || 0) + total;
        });
      }

      const salesArray: DailySales[] = days.map(day => ({
        day,
        amount: salesMap[day] || 0,
      }));
      setDailySales(salesArray);

      if (data.stok_kritis?.length > 0) {
        setTopProducts(data.stok_kritis.slice(0, 5).map((p: any) => ({
          id: p.id, name: p.name,
          sold: Math.floor(Math.random() * 100) + 50,
          price: p.price,
        })));
      }
    } catch (err) { console.error('Gagal fetch dashboard:', err); }
  }, []);

  const refreshTransactions = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/transactions`, { headers: authHeader() });
      if (!res.ok) return;
      const data = await res.json();
      const mapped: Transaction[] = data.map((t: any) => ({
        id: t.id,
        items: t.transaction_items?.map((item: any) => ({
          product: {
            id: item.product_id,
            name: item.product_name,
            price: item.price,
            stock: 0,
            category: 'Lainnya' as Product['category'],
            minStock: 0,
            updatedAt: '',
          },
          quantity: item.quantity,
        })) || [],
        subtotal: Math.round(t.total / 1.1),
        tax: t.total - Math.round(t.total / 1.1),
        total: t.total,
        status: 'Selesai' as const,
        createdAt: new Date(t.created_at).toLocaleString('id-ID'),
      }));
      setTransactions(mapped);
      setTotalTransactions(mapped.length);
    } catch (err) { console.error('Gagal fetch transaksi:', err); }
  }, []);

  const processTransaction = useCallback(async (): Promise<Transaction | null> => {
    if (cart.length === 0) return null;
    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    try {
      const res = await fetch(`${BASE_URL}/api/transactions`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          total: Math.round(total),
          items: cart.map(item => ({
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          })),
        }),
      });
      if (!res.ok) { alert('Gagal memproses transaksi'); return null; }
      const transaction: Transaction = {
        id: `TRX-${Date.now()}`,
        items: [...cart],
        subtotal,
        tax,
        total: Math.round(total),
        status: 'Selesai',
        createdAt: new Date().toLocaleString('id-ID'),
      };
      await refreshProducts();
      await refreshDashboard();
      await refreshTransactions();
      setCart([]);
      return transaction;
    } catch (err) { console.error('Gagal proses transaksi:', err); alert('Gagal terhubung ke server'); return null; }
  }, [cart, refreshProducts, refreshDashboard, refreshTransactions]);

  const addToCart = useCallback((product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
  }, [removeFromCart]);

  const clearCart = useCallback(() => setCart([]), []);

  const value: StoreContextType = {
    user, isAuthenticated, isLoading,
    login, register, logout,
    products, addProduct, updateProduct, deleteProduct,
    cart, addToCart, removeFromCart, updateCartQuantity, clearCart,
    transactions, processTransaction,
    dailySales, topProducts,
    todaySales, totalTransactions, lowStockCount, profitMargin,
    refreshProducts, refreshDashboard,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error('useStore must be used within a StoreProvider');
  return context;
}
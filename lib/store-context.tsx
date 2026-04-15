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

  // Cek token dan user saat pertama kali load
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

  // Fetch data kalau sudah login
  useEffect(() => {
    if (isAuthenticated) {
      refreshProducts();
      refreshTransactions();
    }
  }, [isAuthenticated]);

  // ==========================================
  // LOGIKA PENGHITUNGAN DASHBOARD DINAMIS
  // ==========================================
  // Efek ini akan otomatis berjalan SETIAP KALI ada transaksi baru,
  // sehingga Dashboard akan selalu akurat tanpa bergantung pada API eksternal!
  useEffect(() => {
    if (transactions.length === 0) return;

    setTotalTransactions(transactions.length);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let calcTodaySales = 0;
    const daysLabel = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const salesMap: Record<string, number> = {};
    daysLabel.forEach(d => salesMap[d] = 0);

    const pSales: Record<string, TopProduct> = {};

    transactions.forEach(trx => {
      // Parsing tanggal transaksi dari format id-ID (DD/MM/YYYY)
      const [datePart] = trx.createdAt.split(',');
      const parts = datePart.split(/[-/]/);
      let trxDate = new Date();
      if (parts.length === 3) {
        trxDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
      trxDate.setHours(0, 0, 0, 0);

      // Hitung Penjualan Hari Ini
      if (trxDate.getTime() === today.getTime()) {
        calcTodaySales += trx.total;
      }

      // Hitung Penjualan 7 Hari Terakhir untuk Grafik
      const diffTime = today.getTime() - trxDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        const dayName = daysLabel[trxDate.getDay()];
        salesMap[dayName] += trx.total;
      }

      // Hitung Produk Terlaris
      trx.items.forEach(item => {
        if (!pSales[item.product.id]) {
          pSales[item.product.id] = { id: item.product.id, name: item.product.name, sold: 0, price: item.product.price };
        }
        pSales[item.product.id].sold += item.quantity;
      });
    });

    setTodaySales(calcTodaySales);

    // Susun data grafik secara berurutan
    const chartData: DailySales[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayName = daysLabel[d.getDay()];
      chartData.push({ day: dayName, amount: salesMap[dayName] });
    }
    setDailySales(chartData);

    // Ambil 5 produk paling laris
    setTopProducts(Object.values(pSales).sort((a, b) => b.sold - a.sold).slice(0, 5));
  }, [transactions]);

  // Update Stok Menipis otomatis
  useEffect(() => {
    setLowStockCount(products.filter(p => p.stock <= p.minStock && p.stock > 0).length);
  }, [products]);


  // ==========================================
  // FUNGSI AUTH & CRUD
  // ==========================================
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
    } catch (err) { console.error('Gagal fetch produk:', err); }
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
    } catch (err) { console.error('Gagal fetch transaksi:', err); }
  }, []);

  // Dashboard di-refresh otomatis dengan menarik ulang data transaksi terbaru
  const refreshDashboard = useCallback(async () => {
    await refreshTransactions();
  }, [refreshTransactions]);

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
      await refreshTransactions(); // Ini otomatis mengupdate Dashboard!
      setCart([]);
      return transaction;
    } catch (err) { console.error('Gagal proses transaksi:', err); alert('Gagal terhubung ke server'); return null; }
  }, [cart, refreshProducts, refreshTransactions]);

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
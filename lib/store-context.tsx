'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Product, CartItem, Transaction, User, DailySales, TopProduct } from './types';

// ==========================================
// DATA DUMMY (KHUSUS UNTUK GRAFIK DASHBOARD BIAR GAK BLANK)
// ==========================================
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
  fetchProducts: () => Promise<void>; // Tambahan baru buat refresh data

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

// URL BACKEND DARI VERCEL (.env)
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]); // Mulai dengan kosong, akan diisi dari API
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const isAuthenticated = user !== null;

  // Fungsi helper buat ngambil Token JWT (biar aman nembak API)
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // ==========================================
  // FETCH PRODUK DARI BACKEND
  // ==========================================
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/produk`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data); // Simpan data dari database ke state frontend
      }
    } catch (error) {
      console.error("Gagal mengambil data produk:", error);
    }
  }, []);

  // Pas website pertama kali dibuka, cek user login dan ambil produk
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchProducts();
    }
  }, [fetchProducts]);

  // ==========================================
  // FUNGSI AUTHENTICATION (LOGIN & REGISTER)
  // ==========================================
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        // Simpan token dari backend
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        fetchProducts(); // Ambil produk setelah berhasil login
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login Error:", error);
      return false;
    }
  }, [fetchProducts]);

  const register = useCallback(async (data: { name: string; storeName: string; email: string; password: string }): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      return res.ok;
    } catch (error) {
      console.error("Register Error:", error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setCart([]);
    setProducts([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  // ==========================================
  // FUNGSI MANAJEMEN PRODUK (CRUD)
  // ==========================================
  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'updatedAt'>) => {
    try {
      const res = await fetch(`${API_URL}/api/produk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(product)
      });
      if (res.ok) fetchProducts(); // Refresh tabel setelah nambah
    } catch (error) {
      console.error("Gagal tambah produk:", error);
    }
  }, [fetchProducts]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    try {
      const res = await fetch(`${API_URL}/api/produk/${id}`, {
        method: 'PUT', // Sesuaikan jika backend kamu pakai PATCH
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });
      if (res.ok) fetchProducts(); // Refresh tabel
    } catch (error) {
      console.error("Gagal update produk:", error);
    }
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/produk/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) fetchProducts(); // Refresh tabel
    } catch (error) {
      console.error("Gagal hapus produk:", error);
    }
  }, [fetchProducts]);

  // ==========================================
  // FUNGSI KERANJANG (CART) - Tetap di lokal biar cepat
  // ==========================================
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

  // ==========================================
  // FUNGSI TRANSAKSI (CHECKOUT KASIR)
  // ==========================================
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

    // Secara lokal kurangi stok biar UI cepet
    setProducts(prev => prev.map(product => {
      const cartItem = cart.find(item => item.product.id === product.id);
      if (cartItem) {
        return { ...product, stock: product.stock - cartItem.quantity };
      }
      return product;
    }));

    setTransactions(prev => [transaction, ...prev]);
    setCart([]);

    // NOTE: Kalau backend kamu punya API khusus buat Transaksi/Checkout,
    // Temenmu bisa nambahin blok fetch POST ke /api/transaksi di bagian sini.

    return transaction;
  }, [cart, transactions.length]);

  // Computed metrics (Masih dummy untuk dashboard)
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
    fetchProducts,
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
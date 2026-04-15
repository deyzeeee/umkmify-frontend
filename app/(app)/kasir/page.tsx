'use client';

import { useState } from 'react';
import { Search, ShoppingCart, X, Minus, Plus, Trash2, CheckCircle, Printer, RefreshCw, Store, Music } from 'lucide-react';
import { useStore } from '@/lib/store-context';
import { formatRupiah } from '@/lib/format';
import type { Product, Transaction } from '@/lib/types';

const categories = ['Semua', 'Minuman', 'Makanan', 'Sembako', 'Lainnya'] as const;

export default function KasirPage() {
  const { products, cart, addToCart, removeFromCart, updateCartQuantity, processTransaction } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [showCart, setShowCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State untuk Tema Struk
  const [receiptTheme, setReceiptTheme] = useState<'minimarket' | 'spotify'>('minimarket');

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Semua' || product.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleProcessPayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const transaction = await processTransaction();
      if (transaction) {
        setLastTransaction(transaction);
        setShowSuccess(true);
        setShowCart(false);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewTransaction = () => {
    setShowSuccess(false);
    setLastTransaction(null);
  };

  const handleProductClick = (product: Product) => {
    if (product.stock > 0) addToCart(product);
  };

  // JURUS ULTIMATE: Print di Window Baru biar gak Blank!
  const printReceipt = () => {
    const printContent = document.getElementById('receipt-content');
    if (!printContent) return;

    // Buka tab/jendela kecil baru
    const printWindow = window.open('', '', 'width=800,height=900');
    if (!printWindow) {
      alert("Pop-up diblokir oleh browser! Izinkan pop-up untuk mencetak struk.");
      return;
    }

    // Tulis ulang HTML khusus untuk print dengan Tailwind CDN
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Struk - UMKMify</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important; 
                background-color: white !important;
              }
              @page { margin: 0; }
            }
            body { 
              display: flex; 
              justify-content: center; 
              align-items: flex-start; 
              padding-top: 2rem;
              background-color: #f3f4f6;
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
          <script>
            // Tunggu 1 detik biar Tailwind CDN beres ke-load, baru print otomatis
            setTimeout(() => {
              window.print();
              window.close();
            }, 1000);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const CartFooter = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`p-4 border-t border-border bg-card ${isMobile ? 'pb-24' : ''}`}>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground">{formatRupiah(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Biaya Layanan (10%)</span>
          <span className="text-foreground">{formatRupiah(tax)}</span>
        </div>
        <div className="border-t border-border pt-2">
          <div className="flex justify-between">
            <span className="font-bold text-foreground">Total</span>
            <span className="font-bold text-lg text-foreground">{formatRupiah(total)}</span>
          </div>
        </div>
      </div>
      <button
        onClick={handleProcessPayment}
        disabled={cart.length === 0 || isProcessing}
        className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? 'Memproses...' : 'Proses Pembayaran'}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Product Area */}
      <div className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
        <header className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Kasir</h1>
          <p className="text-sm text-muted-foreground mt-1">Pilih produk untuk ditambahkan ke keranjang</p>
        </header>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock === 0;
            const isLowStock = product.stock > 0 && product.stock <= 5;
            return (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                disabled={isOutOfStock}
                className={`bg-card rounded-xl shadow-sm p-3 md:p-4 text-left transition-all border ${
                  isOutOfStock ? 'opacity-50 cursor-not-allowed border-transparent' : 'hover:border-primary border-transparent cursor-pointer'
                }`}
              >
                <p className="font-medium text-foreground text-sm truncate">{product.name}</p>
                <p className="text-primary font-bold mt-1">{formatRupiah(product.price)}</p>
                <p className="text-xs text-muted-foreground mt-1">Stok: {product.stock}</p>
                {isLowStock && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Stok Menipis</span>
                )}
                {isOutOfStock && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Habis</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cart Panel Desktop */}
      <div className="hidden md:flex flex-col w-[340px] bg-card border-l border-border sticky top-0 h-screen">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-lg text-foreground">Keranjang</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Belum ada produk</p>
              <p className="text-xs text-muted-foreground mt-1">Klik produk untuk menambahkan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{item.product.name}</p>
                    <p className="text-primary font-semibold text-sm">{formatRupiah(item.product.price * item.quantity)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-card border border-border hover:bg-secondary">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= item.product.stock} className="w-8 h-8 flex items-center justify-center rounded-lg bg-card border border-border hover:bg-secondary disabled:opacity-50">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)} className="w-8 h-8 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <CartFooter />
      </div>

      {/* Mobile Cart Bottom Sheet (Kode sebelumnya) */}
      {/* ... (disingkat biar rapi, aslinya ttp ada) ... */}

      {/* SUCCESS MODAL & PREVIEW STRUK */}
      {showSuccess && lastTransaction && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleNewTransaction} />
          
          <div className="relative w-full max-w-lg bg-secondary rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
            
            {/* Header Modal */}
            <div className="p-4 bg-card border-b border-border flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <h3 className="font-bold text-foreground">Transaksi Sukses!</h3>
              </div>
              <button onClick={handleNewTransaction} className="p-2 bg-secondary rounded-full hover:bg-secondary/80">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pilihan Tema */}
            <div className="p-4 flex gap-2 justify-center bg-card">
              <button 
                onClick={() => setReceiptTheme('minimarket')}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${receiptTheme === 'minimarket' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
              >
                <Store className="w-4 h-4" /> Ala Minimarket
              </button>
              <button 
                onClick={() => setReceiptTheme('spotify')}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${receiptTheme === 'spotify' ? 'bg-[#1DB954] text-white shadow-md' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
              >
                <Music className="w-4 h-4" /> Ala Spotify
              </button>
            </div>

            {/* Scrollable Receipt Area */}
            <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-zinc-200/50">
              
              {/* TEMA 1: MINIMARKET (Kertas Thermal) */}
              {receiptTheme === 'minimarket' && (
                <div id="receipt-content" className="bg-white text-black p-6 w-full max-w-[320px] mx-auto shadow-md border border-gray-200" style={{ fontFamily: 'monospace' }}>
                  <div className="text-center mb-4">
                    <h2 className="font-bold text-2xl uppercase tracking-widest">UMKMify</h2>
                    <p className="text-xs mt-1 text-gray-600">INNOVATION CUP 2026</p>
                    <p className="text-xs text-gray-600">Jl. Setiabudhi No. 229, Bandung</p>
                  </div>
                  
                  <div className="border-b-2 border-dashed border-gray-400 mb-4"></div>
                  
                  <div className="text-xs mb-4 text-gray-700">
                    <p>Waktu: {lastTransaction.createdAt}</p>
                    <p>TRX ID: {lastTransaction.id}</p>
                  </div>

                  <div className="border-b-2 border-dashed border-gray-400 mb-4"></div>

                  <div className="space-y-3 mb-4 text-sm">
                    {lastTransaction.items.map((item, index) => (
                      <div key={index}>
                        <p className="font-bold uppercase">{item.product.name}</p>
                        <div className="flex justify-between text-gray-700">
                          <span>{item.quantity} x {formatRupiah(item.product.price)}</span>
                          <span>{formatRupiah(item.product.price * item.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-b-2 border-dashed border-gray-400 mb-4"></div>

                  <div className="space-y-1 text-sm mb-4">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatRupiah(lastTransaction.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Pajak (10%)</span>
                      <span>{formatRupiah(lastTransaction.tax)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-gray-300">
                      <span>TOTAL</span>
                      <span>{formatRupiah(lastTransaction.total)}</span>
                    </div>
                  </div>

                  <div className="text-center mt-8 text-xs text-gray-600">
                    <p>Barang yang sudah dibeli</p>
                    <p>tidak dapat dikembalikan.</p>
                    <p className="mt-2 font-bold uppercase">-- Terima Kasih --</p>
                  </div>
                </div>
              )}

              {/* TEMA 2: SPOTIFY (Dark Modern) */}
              {receiptTheme === 'spotify' && (
                <div id="receipt-content" className="bg-[#121212] text-[#B3B3B3] p-8 w-full max-w-[340px] mx-auto shadow-2xl" style={{ fontFamily: 'sans-serif' }}>
                  <div className="text-center mb-8">
                    <h2 className="font-black text-4xl uppercase tracking-tighter text-white mb-2">UMKMify</h2>
                    <p className="text-xs font-bold tracking-[0.2em] uppercase">Receiptify • {lastTransaction.createdAt.split(',')[0]}</p>
                  </div>
                  
                  <table className="w-full text-sm mb-8">
                    <thead>
                      <tr className="border-b border-[#282828] text-[#1DB954] font-bold text-xs">
                        <th className="text-left pb-2 w-8">QTY</th>
                        <th className="text-left pb-2">ITEM</th>
                        <th className="text-right pb-2">AMT</th>
                      </tr>
                    </thead>
                    <tbody className="text-white">
                      {lastTransaction.items.map((item, index) => (
                        <tr key={index} className="border-b border-[#282828]/50">
                          <td className="py-3 font-medium align-top">{item.quantity}</td>
                          <td className="py-3 pr-2">
                            <p className="font-bold truncate max-w-[140px]">{item.product.name}</p>
                            <p className="text-xs text-[#B3B3B3] mt-0.5">{formatRupiah(item.product.price)}</p>
                          </td>
                          <td className="py-3 text-right font-medium align-top">{formatRupiah(item.product.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="border-t-2 border-white pt-4 flex justify-between font-black text-xl text-white mb-8">
                    <span>TOTAL</span>
                    <span>{formatRupiah(lastTransaction.total)}</span>
                  </div>

                  <div className="text-center opacity-50">
                    <p className="text-4xl tracking-widest font-light mt-4" style={{ fontFamily: 'monospace' }}>
                      |||||||||||||||
                    </p>
                    <p className="text-[10px] tracking-widest mt-2 uppercase font-bold">UMKMIFY-TIC-2026</p>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Aksi */}
            <div className="p-4 bg-card border-t border-border flex gap-3 z-10">
              <button
                onClick={printReceipt}
                className="flex-1 h-12 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
              >
                <Printer className="w-5 h-5" /> Cetak Struk ({receiptTheme === 'spotify' ? 'Spotify' : 'Minimarket'})
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
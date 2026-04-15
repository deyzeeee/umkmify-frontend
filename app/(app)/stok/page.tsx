'use client';

import { useState } from 'react';
import { Search, Plus, FileSpreadsheet, AlertTriangle, Edit2, Trash2, X } from 'lucide-react';
import { useStore } from '@/lib/store-context';
import { formatRupiah } from '@/lib/format';
import type { Product } from '@/lib/types';

const categories = ['Semua', 'Minuman', 'Makanan', 'Sembako', 'Lainnya'] as const;
type CategoryType = 'Minuman' | 'Makanan' | 'Sembako' | 'Lainnya';

const categoryColors: Record<CategoryType, string> = {
  Minuman: 'bg-blue-100 text-blue-700',
  Makanan: 'bg-orange-100 text-orange-700',
  Sembako: 'bg-emerald-100 text-emerald-700',
  Lainnya: 'bg-purple-100 text-purple-700',
};

export default function StokPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<CategoryType>('Minuman');
  const [formPrice, setFormPrice] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formMinStock, setFormMinStock] = useState('');

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Semua' || product.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.stock > 0);
  const totalStockValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  // FIX: Menggunakan rumus persentase keuntungan dari modal (Markup)
  const getMargin = (price: number, costPrice?: number) => {
    if (!costPrice || costPrice <= 0 || !price || price <= 0) return null;
    return Math.round(((price - costPrice) / costPrice) * 100);
  };

  const handleExportExcel = () => {
    const headers = ['Nama Produk', 'Kategori', 'Stok', 'Min Stok', 'Harga Modal', 'Harga Jual', 'Margin (%)', 'Update'];
    const rows = filteredProducts.map(p => [
      p.name,
      p.category,
      p.stock,
      p.minStock,
      p.costPrice || 0,
      p.price,
      getMargin(p.price, p.costPrice) ?? '-',
      p.updatedAt,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stok-umkmify.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Minuman');
    setFormPrice('');
    setFormCostPrice('');
    setFormStock('');
    setFormMinStock('');
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormPrice(String(product.price));
    setFormCostPrice(String(product.costPrice || ''));
    setFormStock(String(product.stock));
    setFormMinStock(String(product.minStock));
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: formName,
      category: formCategory,
      price: Number(formPrice),
      costPrice: formCostPrice ? Number(formCostPrice) : undefined,
      stock: Number(formStock),
      minStock: Number(formMinStock),
    };
    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
    } else {
      addProduct(productData);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      deleteProduct(id);
    }
  };

  const previewMargin = formPrice && formCostPrice && Number(formCostPrice) > 0
    ? getMargin(Number(formPrice), Number(formCostPrice))
    : null;

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Manajemen Stok</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola inventaris produk Anda</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            className="hidden md:flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={openAddModal}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </button>
        </div>
      </header>

      {lowStockProducts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
          <p className="text-sm text-orange-800">
            <span className="font-semibold">{lowStockProducts.length} Produk</span> Stok Menipis — periksa dan lakukan restocking
          </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Desktop */}
      <div className="hidden md:block bg-card rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-[25%]">Nama Produk</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-[12%]">Kategori</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-[8%]">Stok</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-[8%]">Min.</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-[12%]">Harga Modal</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-[12%]">Harga Jual</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-[8%]">Margin</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-[10%]">Update</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-[5%]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredProducts.map((product) => {
              const isLowStock = product.stock <= product.minStock;
              const margin = getMargin(product.price, product.costPrice);
              return (
                <tr key={product.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{product.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[product.category]}`}>
                      {product.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-foreground'}`}>
                        {product.stock}
                      </span>
                      {isLowStock && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{product.minStock}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {product.costPrice && product.costPrice > 0
                      ? formatRupiah(product.costPrice)
                      : <span className="text-muted-foreground/50">-</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-foreground font-medium">{formatRupiah(product.price)}</td>
                  <td className="px-4 py-3">
                    {margin !== null ? (
                      <span className={`font-medium ${margin >= 20 ? 'text-emerald-600' : margin >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                        {margin}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{product.updatedAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(product)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-border flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            Menampilkan {filteredProducts.length} dari {products.length} produk
          </span>
          <span className="font-medium text-foreground">
            Total Nilai Stok: {formatRupiah(totalStockValue)}
          </span>
        </div>
      </div>

      {/* Card Mobile */}
      <div className="md:hidden space-y-3">
        {filteredProducts.map((product) => {
          const isLowStock = product.stock <= product.minStock;
          const margin = getMargin(product.price, product.costPrice);
          return (
            <div key={product.id} className="bg-card rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[product.category]}`}>
                    {product.category}
                  </span>
                </div>
                {margin !== null && (
                  <span className={`text-sm font-bold ${margin >= 20 ? 'text-emerald-600' : margin >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                    {margin}% margin
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Stok:</span>
                  <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-foreground'}`}>{product.stock}</span>
                  {isLowStock && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                </div>
                <div>
                  <span className="text-muted-foreground">Min: </span>
                  <span>{product.minStock}</span>
                </div>
                {product.costPrice && product.costPrice > 0 && (
                  <div>
                    <span className="text-muted-foreground">Modal: </span>
                    <span>{formatRupiah(product.costPrice)}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Jual: </span>
                  <span className="font-medium text-foreground">{formatRupiah(product.price)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(product)}
                  className="flex-1 h-10 flex items-center justify-center gap-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 h-10 flex items-center justify-center gap-2 text-sm font-medium text-destructive border border-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />Hapus
                </button>
              </div>
            </div>
          );
        })}
        <div className="text-sm text-center py-3">
          <p className="text-muted-foreground mb-1">Menampilkan {filteredProducts.length} dari {products.length} produk</p>
          <p className="font-medium text-foreground">Total Nilai Stok: {formatRupiah(totalStockValue)}</p>
        </div>

        {/* Mobile Export */}
        <button
          onClick={handleExportExcel}
          className="w-full flex items-center justify-center gap-2 h-12 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />Export Excel
        </button>
      </div>

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-card w-full md:max-w-md md:rounded-2xl rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="md:hidden flex justify-center py-3">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>
            <div className="px-6 pb-2 pt-4 md:pt-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nama Produk</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Masukkan nama produk"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Kategori</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as CategoryType)}
                  className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="Minuman">Minuman</option>
                  <option value="Makanan">Makanan</option>
                  <option value="Sembako">Sembako</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Harga Modal</label>
                  <input
                    type="number"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Harga Jual</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {/* Preview margin real-time */}
              {previewMargin !== null && (
                <div className={`rounded-lg px-4 py-3 ${
                  previewMargin >= 20
                    ? 'bg-emerald-50 border border-emerald-200'
                    : previewMargin >= 10
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    previewMargin >= 20 ? 'text-emerald-700'
                    : previewMargin >= 10 ? 'text-amber-700'
                    : 'text-red-700'
                  }`}>
                    Margin profit: {previewMargin}%
                    {' '}— untung {formatRupiah(Number(formPrice) - Number(formCostPrice))} per unit
                    {previewMargin < 10 && ' ⚠️ Margin terlalu kecil'}
                    {previewMargin >= 20 && ' ✓ Margin sehat'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Stok</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Min. Stok</label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-12 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
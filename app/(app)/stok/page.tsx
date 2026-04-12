'use client';

import { useState } from 'react';
import { Search, Plus, FileSpreadsheet, AlertTriangle, Edit2, Trash2, X } from 'lucide-react';
import { useStore } from '@/lib/store-context';
import { formatRupiah } from '@/lib/format';
import type { Product } from '@/lib/types';

const categories = ['Semua', 'Minuman', 'Makanan', 'Sembako', 'Lainnya'] as const;

type CategoryType = 'Minuman' | 'Makanan' | 'Sembako';

const categoryColors: Record<CategoryType, string> = {
  Minuman: 'bg-blue-100 text-blue-700',
  Makanan: 'bg-orange-100 text-orange-700',
  Sembako: 'bg-emerald-100 text-emerald-700',
};

export default function StokPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<CategoryType>('Minuman');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formMinStock, setFormMinStock] = useState('');

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Semua' || product.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.stock > 0);
  const totalStockValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Minuman');
    setFormPrice('');
    setFormStock('');
    setFormMinStock('');
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormPrice(String(product.price));
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

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Manajemen Stok</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola inventaris produk Anda</p>
        </div>
        <div className="flex gap-2">
          <button className="hidden md:flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary">
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={openAddModal}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </button>
        </div>
      </header>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
          <p className="text-sm text-orange-800">
            <span className="font-semibold">{lowStockProducts.length} Produk</span> Stok Menipis — periksa dan lakukan restocking
          </p>
        </div>
      )}

      {/* Toolbar */}
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
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Table (Desktop) */}
      <div className="hidden md:block bg-card rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-[30%]">Nama Produk</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-[15%]">Kategori</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-[10%]">Stok</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-[10%]">Min. Stok</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-[15%]">Harga</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-[12%]">Update</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-[8%]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredProducts.map((product) => {
              const isLowStock = product.stock <= product.minStock;

              return (
                <tr key={product.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">{product.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[product.category]}`}>
                      {product.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-foreground'}`}>
                        {product.stock}
                      </span>
                      {isLowStock && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{product.minStock}</td>
                  <td className="px-4 py-3 text-foreground">{formatRupiah(product.price)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{product.updatedAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(product)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10"
                        aria-label="Edit produk"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
                        aria-label="Hapus produk"
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

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            Menampilkan {filteredProducts.length} dari {products.length} produk
          </span>
          <span className="font-medium text-foreground">
            Total Nilai Stok: {formatRupiah(totalStockValue)}
          </span>
        </div>
      </div>

      {/* Card List (Mobile) */}
      <div className="md:hidden space-y-3">
        {filteredProducts.map((product) => {
          const isLowStock = product.stock <= product.minStock;

          return (
            <div key={product.id} className="bg-card rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[product.category]}`}>
                    {product.category}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm mb-3">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Stok:</span>
                  <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-foreground'}`}>
                    {product.stock}
                  </span>
                  {isLowStock && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                </div>
                <span className="text-muted-foreground">Min: {product.minStock}</span>
                <span className="text-foreground font-medium">{formatRupiah(product.price)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(product)}
                  className="flex-1 h-10 flex items-center justify-center gap-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/10"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 h-10 flex items-center justify-center gap-2 text-sm font-medium text-destructive border border-destructive rounded-lg hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </button>
              </div>
            </div>
          );
        })}

        {/* Mobile Footer */}
        <div className="text-sm text-center py-3">
          <p className="text-muted-foreground mb-1">
            Menampilkan {filteredProducts.length} dari {products.length} produk
          </p>
          <p className="font-medium text-foreground">
            Total Nilai Stok: {formatRupiah(totalStockValue)}
          </p>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-card w-full md:max-w-md md:rounded-2xl rounded-t-2xl shadow-xl">
            {/* Handle (Mobile) */}
            <div className="md:hidden flex justify-center py-3">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            <div className="px-6 pb-2 pt-4 md:pt-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-secondary rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
              <div>
                <label htmlFor="product-name" className="block text-sm font-medium text-foreground mb-1.5">
                  Nama Produk
                </label>
                <input
                  id="product-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="Masukkan nama produk"
                  required
                />
              </div>

              <div>
                <label htmlFor="product-category" className="block text-sm font-medium text-foreground mb-1.5">
                  Kategori
                </label>
                <select
                  id="product-category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as CategoryType)}
                  className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="Minuman">Minuman</option>
                  <option value="Makanan">Makanan</option>
                  <option value="Sembako">Sembako</option>
                </select>
              </div>

              <div>
                <label htmlFor="product-price" className="block text-sm font-medium text-foreground mb-1.5">
                  Harga
                </label>
                <input
                  id="product-price"
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="0"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="product-stock" className="block text-sm font-medium text-foreground mb-1.5">
                    Stok
                  </label>
                  <input
                    id="product-stock"
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="product-min-stock" className="block text-sm font-medium text-foreground mb-1.5">
                    Min. Stok
                  </label>
                  <input
                    id="product-min-stock"
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-input bg-card text-foreground text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-12 border border-border text-foreground rounded-lg font-medium hover:bg-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
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

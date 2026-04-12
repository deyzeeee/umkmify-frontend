'use client';

import { DollarSign, ShoppingCart, Package, TrendingUp, Zap } from 'lucide-react';
import { useStore } from '@/lib/store-context';
import { formatRupiahShort, formatRupiah, formatNumber } from '@/lib/format';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { TopProductsList } from '@/components/dashboard/top-products';

export default function DashboardPage() {
  const { todaySales, totalTransactions, lowStockCount, profitMargin, products } = useStore();
  
  // Find the product with lowest stock for AI insight
  const lowStockProduct = products.find(p => p.stock <= p.minStock && p.stock > 0);
  
  const metrics = [
    {
      label: 'Penjualan Hari Ini',
      value: formatRupiahShort(todaySales),
      change: '+12%',
      changeType: 'positive' as const,
      icon: DollarSign,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Total Transaksi',
      value: formatNumber(totalTransactions),
      change: '+8%',
      changeType: 'positive' as const,
      icon: ShoppingCart,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Stok Menipis',
      value: String(lowStockCount),
      change: '-',
      changeType: 'negative' as const,
      icon: Package,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      label: 'Margin Profit',
      value: `${profitMargin}%`,
      change: '+15%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
    },
  ];
  
  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Pantau performa bisnis Anda</p>
      </header>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-card rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4 md:p-5"
          >
            <div className={`w-10 h-10 ${metric.iconBg} rounded-full flex items-center justify-center mb-3`}>
              <metric.icon className={`w-5 h-5 ${metric.iconColor}`} />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mb-1">{metric.label}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg md:text-xl font-bold text-foreground">{metric.value}</span>
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  metric.changeType === 'positive'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Charts Row */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 mb-6">
        {/* Sales Chart */}
        <div className="flex-[1.4] bg-card rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4 md:p-5">
          <h3 className="font-semibold text-foreground mb-4">Penjualan 7 Hari Terakhir</h3>
          <div className="h-[200px] md:h-[280px]">
            <SalesChart />
          </div>
        </div>
        
        {/* Top Products */}
        <div className="flex-1 bg-card rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4 md:p-5">
          <h3 className="font-semibold text-foreground mb-4">Produk Terlaris</h3>
          <TopProductsList />
        </div>
      </div>
      
      {/* AI Insight Card */}
      {lowStockProduct && (
        <div className="bg-accent border border-blue-200 rounded-xl p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm md:text-base">
                  Prediksi AI: Stok {lowStockProduct.name}
                </h4>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Berdasarkan tren penjualan, stok produk ini diprediksi akan habis dalam 3 hari. 
                  Segera lakukan restocking untuk menghindari kehabisan stok.
                </p>
                <button className="mt-3 px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors">
                  Lihat Rekomendasi
                </button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground md:text-right shrink-0">
              Data 7 hari terakhir
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

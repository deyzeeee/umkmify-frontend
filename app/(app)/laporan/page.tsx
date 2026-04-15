'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileText, FileSpreadsheet, TrendingUp, Receipt, DollarSign, ChevronDown } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '@/lib/store-context';
import { formatRupiah, formatRupiahShort, formatNumber } from '@/lib/format';

const dateRanges = ['Hari Ini', 'Minggu Ini', 'Bulan Ini', 'Tahun Ini'] as const;

export default function LaporanPage() {
  const { transactions } = useStore();
  const [selectedRange, setSelectedRange] = useState<string>('Minggu Ini');
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);

  // Filter transaksi berdasarkan range
  const filteredTransactions = useMemo(() => {
  const now = new Date();
  return transactions.filter(trx => {
    // Parse format Indonesia: "14/4/2026, 13.49.06"
    let trxDate: Date;
    try {
      // Ganti titik jadi titik dua untuk waktu, slash jadi format yang bisa diparsed
      const cleaned = trx.createdAt
        .replace(/(\d+)\.(\d+)\.(\d+)$/, '$1:$2:$3') // 13.49.06 → 13:49:06
        .replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$2-$1');  // 14/4/2026 → 2026-4-14
      trxDate = new Date(cleaned);
      if (isNaN(trxDate.getTime())) trxDate = new Date(trx.createdAt);
    } catch {
      return true;
    }
    if (isNaN(trxDate.getTime())) return true;

    switch (selectedRange) {
      case 'Hari Ini':
        return trxDate.toDateString() === now.toDateString();
      case 'Minggu Ini': {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return trxDate >= weekAgo;
      }
      case 'Bulan Ini':
        return trxDate.getMonth() === now.getMonth() &&
          trxDate.getFullYear() === now.getFullYear();
      case 'Tahun Ini':
        return trxDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });
}, [transactions, selectedRange]);

  // Hitung metrik dari transaksi yang sudah difilter
  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalTrx = filteredTransactions.length;
  const avgTrx = totalTrx > 0 ? totalRevenue / totalTrx : 0;

  // Bangun data grafik 7 hari dari transaksi real
  const chartData = useMemo(() => {
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const map: Record<string, number> = {};
  days.forEach(d => map[d] = 0);
  
  filteredTransactions.forEach(trx => {
    try {
      const cleaned = trx.createdAt
        .replace(/(\d+)\.(\d+)\.(\d+)$/, '$1:$2:$3')
        .replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$2-$1');
      const d = new Date(cleaned);
      if (!isNaN(d.getTime())) {
        const dayName = days[d.getDay()];
        map[dayName] = (map[dayName] || 0) + trx.total;
      }
    } catch {}
  });
  return days.map(day => ({ day, amount: map[day] }));
} , [filteredTransactions]);

  const formatYAxis = (value: number) => {
    if (value === 0) return 'Rp 0';
    return `Rp ${(value / 1000000).toFixed(1)}jt`;
  };

  // Export PDF
  const handleExportPDF = () => {
    const content = `
      LAPORAN KEUANGAN - UMKMify
      Periode: ${selectedRange}
      ================================
      Total Pendapatan : ${formatRupiah(totalRevenue)}
      Total Transaksi  : ${totalTrx} transaksi
      Rata-rata        : ${formatRupiah(avgTrx)}
      
      RIWAYAT TRANSAKSI:
      ${filteredTransactions.map((t, i) =>
        `${i + 1}. ${t.createdAt} | ${t.items.length} item | ${formatRupiah(t.total)} | ${t.status}`
      ).join('\n')}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-bisnisku-${selectedRange.replace(' ', '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Excel (CSV)
  const handleExportExcel = () => {
    const headers = ['No', 'Waktu', 'Jumlah Item', 'Subtotal', 'Pajak', 'Total', 'Status'];
    const rows = filteredTransactions.map((t, i) => [
      i + 1,
      t.createdAt,
      t.items.length,
      t.subtotal,
      t.tax,
      t.total,
      t.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-bisnisku-${selectedRange.replace(' ', '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summaryCards = [
    {
      label: 'Total Pendapatan',
      value: formatRupiahShort(totalRevenue),
      subtext: `periode: ${selectedRange}`,
      icon: DollarSign,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Total Transaksi',
      value: formatNumber(totalTrx),
      subtext: 'transaksi',
      icon: Receipt,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Rata-rata per Transaksi',
      value: formatRupiahShort(avgTrx),
      subtext: 'per transaksi',
      icon: TrendingUp,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Laporan Keuangan</h1>
          <p className="text-sm text-muted-foreground mt-1">Analisis pendapatan dan transaksi</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <button
              onClick={() => setShowRangeDropdown(!showRangeDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-secondary"
            >
              <span className="text-sm">{selectedRange}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showRangeDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowRangeDropdown(false)} />
                <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-lg shadow-lg z-50">
                  {dateRanges.map((range) => (
                    <button
                      key={range}
                      onClick={() => { setSelectedRange(range); setShowRangeDropdown(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary first:rounded-t-lg last:rounded-b-lg ${
                        selectedRange === range ? 'text-primary font-medium' : 'text-foreground'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="hidden md:flex gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="flex md:grid md:grid-cols-3 gap-4 mb-6 overflow-x-auto pb-2 md:pb-0 snap-x snap-mandatory">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="min-w-[280px] md:min-w-0 bg-card rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4 md:p-5 snap-start"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${card.iconBg} rounded-full flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              <span className="text-sm text-muted-foreground">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.subtext}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4 md:p-5 mb-6">
        <h3 className="font-semibold text-foreground mb-4">Pendapatan Harian</h3>
        <div className="h-[200px] md:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis tickFormatter={formatYAxis} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} width={70} />
              <Tooltip
                formatter={(value: number) => [formatRupiah(value), 'Pendapatan']}
                contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
              />
              <Bar dataKey="amount" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabel Transaksi */}
      <div className="bg-card rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-4 md:px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Riwayat Transaksi</h3>
          <span className="text-sm text-muted-foreground">{filteredTransactions.length} transaksi</span>
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                {['No', 'Waktu', 'Produk', 'Total', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Tidak ada transaksi untuk periode ini
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx, index) => (
                  <tr key={trx.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                    <td className="px-4 py-3 text-foreground">{trx.createdAt}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {trx.items.length > 0 ? `${trx.items.length} item` : 'Produk campuran'}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{formatRupiah(trx.total)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                        {trx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-border">
          {filteredTransactions.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">Tidak ada transaksi untuk periode ini</div>
          ) : (
            filteredTransactions.map((trx, index) => (
              <div key={trx.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">#{index + 1} - {trx.createdAt}</span>
                  <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">{trx.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {trx.items.length > 0 ? `${trx.items.length} item` : 'Produk campuran'}
                  </span>
                  <span className="font-semibold text-foreground">{formatRupiah(trx.total)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile Export */}
      <div className="md:hidden flex gap-3 mt-6">
        <button onClick={handleExportPDF} className="flex-1 flex items-center justify-center gap-2 h-12 border border-border rounded-lg text-foreground hover:bg-secondary">
          <FileText className="w-4 h-4" />Export PDF
        </button>
        <button onClick={handleExportExcel} className="flex-1 flex items-center justify-center gap-2 h-12 border border-border rounded-lg text-foreground hover:bg-secondary">
          <FileSpreadsheet className="w-4 h-4" />Export Excel
        </button>
      </div>
    </div>
  );
}
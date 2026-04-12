'use client';

import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useStore } from '@/lib/store-context';

export function SalesChart() {
  const { dailySales } = useStore();
  
  const formatYAxis = (value: number) => {
    return `Rp ${(value / 1000000).toFixed(1)}jt`;
  };
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={dailySales} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="day" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748B', fontSize: 12 }}
        />
        <YAxis 
          tickFormatter={formatYAxis}
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748B', fontSize: 12 }}
          width={70}
        />
        <Tooltip 
          formatter={(value: number) => [`Rp ${(value / 1000000).toFixed(1)}jt`, 'Penjualan']}
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#2563EB"
          strokeWidth={2}
          fill="url(#colorAmount)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

'use client';

import { useStore } from '@/lib/store-context';
import { formatRupiah } from '@/lib/format';

export function TopProductsList() {
  const { topProducts } = useStore();
  
  return (
    <ul className="space-y-0">
      {topProducts.map((product, index) => (
        <li
          key={product.id}
          className={`flex items-center gap-3 py-3 ${
            index !== topProducts.length - 1 ? 'border-b border-border' : ''
          }`}
        >
          <div className="w-7 h-7 bg-accent rounded-full flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
            <p className="text-xs text-muted-foreground">{product.sold} terjual</p>
          </div>
          <span className="text-sm font-semibold text-foreground shrink-0">
            {formatRupiah(product.price)}
          </span>
        </li>
      ))}
    </ul>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, LayoutDashboard, ShoppingCart, Package, BarChart3, LogOut } from 'lucide-react';
import { useStore } from '@/lib/store-context';

const menuItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/kasir', icon: ShoppingCart, label: 'Kasir' },
  { href: '/stok', icon: Package, label: 'Stok' },
  { href: '/laporan', icon: BarChart3, label: 'Laporan' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useStore();
  
  return (
    <aside className="hidden md:flex flex-col w-60 bg-card border-r border-border h-screen sticky top-0">
      {/* Logo & Store Name */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-sm">{user?.storeName || 'Toko Anda'}</h2>
            <p className="text-xs text-muted-foreground">UMKMify</p>
          </div>
        </div>
      </div>
      
      {/* Menu Items */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-accent text-primary border-l-[3px] border-primary -ml-[3px] pl-[19px]'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Logout Button */}
      <div className="p-3 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Keluar</span>
        </button>
      </div>
    </aside>
  );
}

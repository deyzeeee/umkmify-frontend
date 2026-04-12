'use client';

import { StoreProvider } from '@/lib/store-context';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      {children}
    </StoreProvider>
  );
}

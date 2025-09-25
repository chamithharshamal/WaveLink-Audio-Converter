'use client';

import { AppRouterCacheProvider as MuiAppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ReactNode } from 'react';

export default function AppRouterCacheProvider({ children }: { children: ReactNode }) {
  return <MuiAppRouterCacheProvider>{children}</MuiAppRouterCacheProvider>;
}
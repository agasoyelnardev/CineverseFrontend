import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import toast, { Toaster } from 'react-hot-toast';
import App from './App';
import { GlobalLoadingIndicator } from './components/GlobalLoadingIndicator';
import './index.css';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Don't show toast if query explicitly disabled global error toasts
      if (query?.meta?.suppressToast) return;

      const customMsg = query?.meta?.errorMessage as string | undefined;
      const message = customMsg || (error instanceof Error ? error.message : 'Sorğu icra olunarkən xəta baş verdi');
      toast.error(message, {
        id: query.queryHash, // Prevent duplicate toast popups for same query
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation?.meta?.suppressToast) return;

      const customMsg = mutation?.meta?.errorMessage as string | undefined;
      const message = customMsg || (error instanceof Error ? error.message : 'Əməliyyat icra olunarkən xəta baş verdi');
      toast.error(message);
    },
    onSuccess: (_data, _variables, _context, mutation) => {
      const successMsg = mutation?.meta?.successMessage as string | undefined;
      if (successMsg) {
        toast.success(successMsg);
      }
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes cache stale time
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <GlobalLoadingIndicator />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#0f172a',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#0f172a',
            },
          },
        }}
      />
      <App />
    </QueryClientProvider>
  </StrictMode>,
);



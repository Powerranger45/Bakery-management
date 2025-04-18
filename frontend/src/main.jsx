import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Global styles
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Optional: For API state management
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Optional: Devtools for debugging

// Create a QueryClient instance (optional)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevent unnecessary refetching when switching tabs
      retry: 1, // Retry failed queries only once
    },
  },
});

// Root Rendering
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Wrap the app with QueryClientProvider (optional) */}
    <QueryClientProvider client={queryClient}>
      <App />
      {/* Include React Query Devtools in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);

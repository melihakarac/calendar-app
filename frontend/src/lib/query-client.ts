import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      console.error(error.message || 'An error occurred');
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      console.error(error.message || 'An error occurred');
    },
  }),
});

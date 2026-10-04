import { QueryCache, QueryClient, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { MaybeRefOrGetter } from 'vue'
import { toast } from 'vue-sonner'
import { fetchApi } from './api'

/**
 * Single app-wide cache. Data fetched on one page is reused by every other page,
 * so navigating back and forth no longer re-downloads everything or shows a spinner.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // Centralised error toast (replaces the try/catch + toast in every page).
    // Queries can opt out with `meta: { silent: true }`.
    onError: (error, query) => {
      if (query.meta?.silent) return
      toast.error((query.meta?.errorMessage as string) || 'Gagal mengambil data', {
        description: error.message,
      })
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000, // data is considered fresh for 30s -> no refetch on page switch
      gcTime: 10 * 60_000, // keep unused data in memory for 10 minutes
      retry: 1,
      refetchOnWindowFocus: true, // refresh stale data when the cashier comes back to the tab
    },
  },
})

export const queryKeys = {
  products: ['products'] as const,
  categories: ['categories'] as const,
  units: ['units'] as const,
  users: ['users'] as const,
  sales: ['sales'] as const,
  stockMovements: ['stock-movements'] as const,
}

type QueryKeyName = keyof typeof queryKeys

type ListOptions = {
  enabled?: MaybeRefOrGetter<boolean>
  /** Don't show an error toast (e.g. cashier without access to /users). */
  silent?: boolean
}

function useListQuery<T>(
  key: QueryKeyName,
  endpoint: string,
  errorMessage: string,
  staleTime: number | undefined,
  options: ListOptions = {},
) {
  return useQuery({
    queryKey: queryKeys[key],
    queryFn: async () => ((await fetchApi(endpoint)) ?? []) as T[],
    enabled: options.enabled ?? true,
    staleTime,
    meta: { silent: options.silent, errorMessage },
  })
}

// Frequently changing data (stock / transactions): default 30s freshness.
export const useProducts = <T = any>(o?: ListOptions) =>
  useListQuery<T>('products', '/products', 'Gagal mengambil data produk', undefined, o)
export const useSales = <T = any>(o?: ListOptions) =>
  useListQuery<T>('sales', '/sales', 'Gagal mengambil data penjualan', undefined, o)
export const useStockMovements = <T = any>(o?: ListOptions) =>
  useListQuery<T>('stockMovements', '/stock-movements', 'Gagal mengambil data pergerakan stok', undefined, o)

// Rarely changing master data: fresh for 5 minutes.
const MASTER_STALE = 5 * 60_000
export const useCategories = <T = any>(o?: ListOptions) =>
  useListQuery<T>('categories', '/categories', 'Gagal mengambil data kategori', MASTER_STALE, o)
export const useUnits = <T = any>(o?: ListOptions) =>
  useListQuery<T>('units', '/units', 'Gagal mengambil data satuan', MASTER_STALE, o)
export const useUsers = <T = any>(o?: ListOptions) =>
  useListQuery<T>('users', '/users', 'Gagal mengambil data pengguna', MASTER_STALE, o)

/**
 * Returns a function that marks the given caches as outdated and refetches them
 * if they're currently on screen. Call it after any create/update/delete.
 */
export function useInvalidate() {
  const client = useQueryClient()
  return (...keys: QueryKeyName[]) =>
    Promise.all(keys.map((k) => client.invalidateQueries({ queryKey: queryKeys[k] })))
}

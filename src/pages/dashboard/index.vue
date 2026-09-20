<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Package, ShoppingCart, TrendingUp, Activity, DollarSign, ArrowUpRight, PackageOpen } from 'lucide-vue-next'
import { fetchApi } from '@/lib/api'

const isLoading = ref(true)
const stats = ref({
  totalProducts: 0,
  totalCategories: 0,
  totalRevenue: 0,
  todayRevenue: 0,
  lowStockCount: 0,
})

const recentSales = ref<any[]>([])
const chartData = ref<{ date: string; sales: number; height: string }[]>([])
const username = ref(localStorage.getItem('username') || 'Admin')

const fetchData = async () => {
  isLoading.value = true
  try {
    const role = localStorage.getItem('role')
    const isCashier = role === 'CASHIER'

    // Cashiers might not have access to categories, so we handle fetch errors gracefully
    const [products, categoriesRes, sales] = await Promise.all([
      fetchApi('/products').catch(() => []),
      isCashier ? Promise.resolve([]) : fetchApi('/categories').catch(() => []),
      fetchApi('/sales').catch(() => [])
    ])

    const completedSales = (sales || []).filter((s: any) => s.status !== 'CANCELED')
    
    // Calculate basic stats
    stats.value.totalProducts = products?.length || 0
    stats.value.totalCategories = categoriesRes?.length || 0
    stats.value.lowStockCount = (products || []).filter((p: any) => p.stock > 0 && p.stock <= 10).length
    
    // Calculate revenues
    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    let totalRev = 0
    let todayRev = 0
    
    const salesDataByDate: Record<string, number> = {}

    completedSales.forEach((sale: any) => {
      const amount = Number(sale.totalAmount) || 0
      totalRev += amount
      
      const dateObj = new Date(sale.createdAt)
      const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      const chartDateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      
      if (dateStr === todayStr) {
        todayRev += amount
      }
      
      salesDataByDate[chartDateStr] = (salesDataByDate[chartDateStr] || 0) + amount
    })

    stats.value.totalRevenue = totalRev
    stats.value.todayRevenue = todayRev

    // Prepare chart data (Last 7 days)
    const rawChartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const chartDateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      return { 
        date: chartDateStr, 
        sales: salesDataByDate[chartDateStr] || 0 
      }
    })

    const maxSale = Math.max(...rawChartData.map(d => d.sales), 1) // prevent div by zero
    chartData.value = rawChartData.map(d => ({
      ...d,
      height: `${Math.max((d.sales / maxSale) * 100, 4)}%` // min 4% height for visibility
    }))

    // Recent 5 sales
    recentSales.value = completedSales
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)

  } catch (error) {
    console.error("Dashboard fetch error", error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}
</script>

<template>
  <div class="flex flex-col w-full max-w-[1600px] mx-auto pb-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    
    <!-- Header Greeting -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
      <div class="flex flex-col">
        <h1 class="text-4xl font-extrabold tracking-tight text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-primary to-green-600">
          Selamat Datang, {{ username }}! 👋
        </h1>
        <p class="text-muted-foreground mt-1 text-lg">Inilah ringkasan performa toko obat Anda hari ini.</p>
      </div>
      <div v-if="!isLoading" class="flex items-center gap-2 bg-white/60 backdrop-blur-md border px-4 py-2 rounded-full shadow-sm">
        <Activity class="h-5 w-5 text-green-500 animate-pulse" />
        <span class="text-sm font-medium text-gray-700">Sistem Berjalan Normal</span>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-gray-100/50 hover:shadow-lg hover:border-primary/20 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-gray-500 font-medium text-sm tracking-wide uppercase">Pendapatan Hari Ini</h3>
          <div class="p-2.5 bg-green-50 text-green-600 rounded-xl">
            <DollarSign class="h-5 w-5" />
          </div>
        </div>
        <div v-if="isLoading" class="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
        <div v-else class="text-3xl font-bold text-gray-900">{{ formatCurrency(stats.todayRevenue) }}</div>
      </div>

      <div class="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-gray-100/50 hover:shadow-lg hover:border-blue-500/20 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-gray-500 font-medium text-sm tracking-wide uppercase">Total Penjualan</h3>
          <div class="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp class="h-5 w-5" />
          </div>
        </div>
        <div v-if="isLoading" class="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
        <div v-else class="text-3xl font-bold text-gray-900">{{ formatCurrency(stats.totalRevenue) }}</div>
      </div>

      <div class="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-gray-100/50 hover:shadow-lg hover:border-orange-500/20 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-gray-500 font-medium text-sm tracking-wide uppercase">Total Produk</h3>
          <div class="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
            <Package class="h-5 w-5" />
          </div>
        </div>
        <div v-if="isLoading" class="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
        <div v-else class="text-3xl font-bold text-gray-900">{{ stats.totalProducts }}</div>
        <p class="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <span class="text-orange-500 font-medium">{{ stats.totalCategories }} Kategori</span> terdaftar
        </p>
      </div>

      <div class="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-gray-100/50 hover:shadow-lg hover:border-red-500/20 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-gray-500 font-medium text-sm tracking-wide uppercase">Peringatan Stok</h3>
          <div class="p-2.5 bg-red-50 text-red-600 rounded-xl">
            <PackageOpen class="h-5 w-5" />
          </div>
        </div>
        <div v-if="isLoading" class="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
        <div v-else class="text-3xl font-bold text-gray-900">{{ stats.lowStockCount }}</div>
        <p class="text-xs text-muted-foreground mt-2">
          Produk dengan stok menipis (<=10)
        </p>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
      
      <!-- Chart Section -->
      <div class="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-gray-100/50 p-6 rounded-3xl shadow-sm flex flex-col">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h3 class="text-lg font-bold text-gray-900">Statistik Penjualan</h3>
            <p class="text-sm text-muted-foreground">Performa pendapatan 7 hari terakhir</p>
          </div>
        </div>
        
        <div v-if="isLoading" class="flex-1 min-h-[250px] flex items-end justify-between gap-2 px-2 pb-6">
          <div v-for="i in 7" :key="i" class="w-full bg-gray-100 rounded-t-md animate-pulse" :style="{ height: `${Math.random() * 60 + 20}%` }"></div>
        </div>
        
        <div v-else class="flex-1 min-h-[250px] flex items-end justify-between gap-3 px-2 pb-6 relative">
          <!-- Horizontal Grid Lines -->
          <div class="absolute inset-0 flex flex-col justify-between pb-6 pointer-events-none opacity-20">
            <div class="border-t border-gray-300 w-full"></div>
            <div class="border-t border-gray-300 w-full"></div>
            <div class="border-t border-gray-300 w-full"></div>
            <div class="border-t border-gray-300 w-full"></div>
            <div class="border-t border-gray-300 w-full"></div>
          </div>
          
          <!-- Bars -->
          <div 
            v-for="(point, i) in chartData" 
            :key="i"
            class="group relative flex flex-col items-center w-full justify-end h-full z-10"
          >
            <!-- Tooltip on hover -->
            <div class="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-20">
              {{ formatCurrency(point.sales) }}
              <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
            </div>
            
            <div 
              class="w-full max-w-[3rem] bg-gradient-to-t from-primary/80 to-primary/40 rounded-t-xl transition-all duration-700 ease-out group-hover:from-primary group-hover:to-primary/60 group-hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]"
              :style="{ height: point.height }"
            ></div>
            <span class="mt-4 text-xs font-medium text-gray-500 absolute -bottom-6">{{ point.date.split(' ')[0] }}</span>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="bg-white/80 backdrop-blur-xl border border-gray-100/50 p-6 rounded-3xl shadow-sm flex flex-col">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-bold text-gray-900">Transaksi Terakhir</h3>
          <RouterLink to="/reports/sales" class="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1">
            Lihat Semua <ArrowUpRight class="h-4 w-4" />
          </RouterLink>
        </div>

        <div v-if="isLoading" class="space-y-4">
          <div v-for="i in 5" :key="i" class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gray-100 rounded-full animate-pulse"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
              <div class="h-3 w-16 bg-gray-100 rounded animate-pulse"></div>
            </div>
            <div class="h-4 w-20 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>

        <div v-else-if="recentSales.length === 0" class="flex-1 flex flex-col items-center justify-center text-center opacity-60">
          <ShoppingCart class="h-12 w-12 text-gray-300 mb-3" />
          <p class="text-sm text-gray-500">Belum ada transaksi</p>
        </div>

        <div v-else class="flex flex-col gap-4">
          <div v-for="sale in recentSales" :key="sale.id" class="flex items-center justify-between group p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-default">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <ShoppingCart class="h-4 w-4" />
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-semibold text-gray-900">{{ sale.invoiceNumber }}</span>
                <span class="text-xs text-gray-500">{{ new Date(sale.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }} • {{ sale.buyerName || 'Umum' }}</span>
              </div>
            </div>
            <div class="text-sm font-bold text-primary">
              +{{ formatCurrency(Number(sale.totalAmount)) }}
            </div>
          </div>
        </div>

        <!-- Quick Action Button -->
        <RouterLink to="/sales" class="mt-auto pt-6">
          <button class="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group">
            <ShoppingCart class="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Kasir Baru
          </button>
        </RouterLink>
      </div>

    </div>
  </div>
</template>


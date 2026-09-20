<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Home,
  ShoppingCart,
  Package,
  Tags,
  Award,
  Scale,
  LineChart,
  ClipboardList,
  Users,
  Settings,
  Leaf,
  LogOut
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

// Get role from localStorage or pinia store (mocked for now based on previous Next.js behavior)
const userRole = computed(() => localStorage.getItem('role') || '')

const isCashier = computed(() => userRole.value === 'CASHIER')

const menuUtama = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Kasir", url: "/sales", icon: ShoppingCart },
  { title: "Produk", url: "/products", icon: Package },
  { title: "Kategori", url: "/categories", icon: Tags },
  { title: "Satuan", url: "/units", icon: Scale },
]

const laporan = [
  { title: "Penjualan", url: "/reports/sales", icon: LineChart },
  { title: "Pergerakan Stok", url: "/stock-movements", icon: ClipboardList },
]

const pengaturan = [
  { title: "Pengguna", url: "/users", icon: Users },
  { title: "Pengaturan", url: "/settings", icon: Settings },
]

const filteredLaporan = computed(() => {
  return laporan.filter(item => {
    if (isCashier.value) {
      return item.title === 'Penjualan'
    }
    return true
  })
})

const handleLogout = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("role")
  router.push("/login")
}
</script>

<template>
  <aside class="w-64 border-r border-border/40 bg-white flex flex-col flex-shrink-0 z-10 transition-all duration-300">
    <div class="h-20 flex flex-row items-center gap-3 px-6 border-b border-transparent flex-shrink-0">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
        <Leaf class="h-6 w-6" />
      </div>
      <div class="flex mt-2 flex-col">
        <h4 class="text-lg font-bold leading-tight">Berkah Rezeki Tani</h4>
        <span class="text-xs text-muted-foreground">Admin Panel</span>
      </div>
    </div>
    
    <div class="flex-1 px-3 gap-6 py-4 bg-white overflow-y-auto">
      <!-- Menu Utama -->
      <div class="mb-6">
        <h3 class="text-xs font-semibold text-muted-foreground tracking-wider mb-2 px-2">MENU UTAMA</h3>
        <ul class="space-y-1">
          <li v-for="item in menuUtama" :key="item.title">
            <RouterLink 
              :to="item.url" 
              class="flex items-center gap-3 px-3 py-2 h-10 rounded-md transition-colors text-sm"
              :class="route.path === item.url ? 'bg-green-100 text-primary font-medium' : 'hover:bg-accent hover:text-accent-foreground'"
            >
              <component :is="item.icon" class="h-5 w-5" />
              <span>{{ item.title }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>

      <!-- Laporan -->
      <div class="mb-6">
        <h3 class="text-xs font-semibold text-muted-foreground tracking-wider mb-2 px-2">LAPORAN</h3>
        <ul class="space-y-1">
          <li v-for="item in filteredLaporan" :key="item.title">
            <RouterLink 
              :to="item.url" 
              class="flex items-center gap-3 px-3 py-2 h-10 rounded-md transition-colors text-sm"
              :class="route.path === item.url ? 'bg-green-100 text-primary font-medium' : 'hover:bg-accent hover:text-accent-foreground'"
            >
              <component :is="item.icon" class="h-5 w-5" />
              <span>{{ item.title }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>

      <!-- Pengaturan -->
      <div v-if="!isCashier" class="mb-6">
        <h3 class="text-xs font-semibold text-muted-foreground tracking-wider mb-2 px-2">PENGATURAN</h3>
        <ul class="space-y-1">
          <li v-for="item in pengaturan" :key="item.title">
            <RouterLink 
              :to="item.url" 
              class="flex items-center gap-3 px-3 py-2 h-10 rounded-md transition-colors text-sm"
              :class="route.path === item.url ? 'bg-green-100 text-primary font-medium' : 'hover:bg-accent hover:text-accent-foreground'"
            >
              <component :is="item.icon" class="h-5 w-5" />
              <span>{{ item.title }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>

    <div class="p-4 bg-white flex-shrink-0">
      <button 
        @click="handleLogout"
        class="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
      >
        <LogOut class="h-5 w-5" />
        <span>Keluar</span>
      </button>
    </div>
  </aside>
</template>

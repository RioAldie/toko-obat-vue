<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Menu, Leaf } from 'lucide-vue-next'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const route = useRoute()
const isSidebarOpen = ref(false)

// Close the drawer after navigating (otherwise it stays open over the new page)
watch(() => route.fullPath, () => {
  isSidebarOpen.value = false
})

const pageTitles: Record<string, string> = {
  home: 'Dashboard',
  sales: 'Kasir',
  products: 'Produk',
  categories: 'Kategori',
  units: 'Satuan',
  brands: 'Merek',
  'reports-sales': 'Laporan Penjualan',
  'stock-movements': 'Pergerakan Stok',
  users: 'Pengguna',
  settings: 'Pengaturan',
}
const pageTitle = computed(() => pageTitles[String(route.name)] ?? '')
</script>

<template>
  <div class="flex h-screen h-[100dvh] overflow-hidden bg-gray-50/40 print:h-auto print:bg-white print:block print:overflow-visible">
    <!-- Desktop Sidebar (lg+): always visible -->
    <div class="hidden lg:flex w-64 flex-shrink-0 print:hidden">
      <AppSidebar />
    </div>

    <!-- Main Column -->
    <div class="flex-1 min-w-0 flex flex-col overflow-hidden relative print:block print:overflow-visible print:h-auto">
      <!-- Top bar (mobile + tablet): opens the sidebar as a drawer -->
      <header
        class="lg:hidden print:hidden sticky top-0 z-30 flex h-14 flex-shrink-0 items-center gap-3 border-b border-border/60 bg-white/80 px-3 sm:px-4 backdrop-blur-md"
      >
        <Sheet v-model:open="isSidebarOpen">
          <SheetTrigger asChild>
            <Button
              id="sidebar-toggle"
              variant="ghost"
              size="icon"
              class="h-10 w-10"
              aria-label="Buka menu navigasi"
            >
              <Menu class="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" class="p-0 w-72 sm:max-w-72">
            <SheetTitle class="sr-only">Menu navigasi</SheetTitle>
            <AppSidebar />
          </SheetContent>
        </Sheet>

        <div class="flex items-center gap-2 min-w-0">
          <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Leaf class="h-4 w-4" />
          </div>
          <span class="font-semibold text-gray-900 truncate">Berkah Rezeki Tani</span>
        </div>

        <span
          v-if="pageTitle"
          class="ml-auto hidden sm:inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
        >
          {{ pageTitle }}
        </span>
      </header>

      <main class="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-8 relative print:p-0 print:overflow-visible print:block print:h-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>

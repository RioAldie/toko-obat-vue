<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-vue-next'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const isMobileSidebarOpen = ref(false)
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-gray-50/40 print:h-auto print:bg-white print:block">
    <!-- Desktop Sidebar -->
    <div class="hidden md:flex print:hidden">
      <AppSidebar />
    </div>

    <!-- Mobile Sidebar -->
    <div class="md:hidden print:hidden">
      <Sheet v-model:open="isMobileSidebarOpen">
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" class="fixed top-4 left-4 z-40 md:hidden">
            <Menu class="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" class="p-0 w-72">
          <AppSidebar />
        </SheetContent>
      </Sheet>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden relative print:block print:overflow-visible print:h-auto">
      <main class="flex-1 overflow-y-auto p-4 md:p-8 pt-16 md:pt-8 relative print:p-0 print:overflow-visible print:block print:h-auto">
        <!-- Overlay for mobile if needed, usually handled by Sheet -->
        <RouterView />
      </main>
    </div>
  </div>
</template>

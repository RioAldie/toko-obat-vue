<script setup lang="ts">
import { Plus, Construction } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
</script>

<template>
  <div class="flex flex-col w-full max-w-[1600px] mx-auto pb-10">
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-1">
        <h2 class="text-3xl font-bold tracking-tight text-gray-900">Merek</h2>
        <p class="text-muted-foreground text-sm">Kelola merek produk yang dijual di toko Anda.</p>
      </div>
      <Button class="bg-primary text-white hover:bg-primary/90 rounded-lg shadow-sm">
        <Plus class="mr-2 h-4 w-4" /> Tambah Merek
      </Button>
    </div>
    
    <div class="mt-6 flex flex-col items-center justify-center p-12 border rounded-xl bg-gray-50/50 border-dashed">
      <Construction class="h-12 w-12 text-muted-foreground mb-4" />
      <h3 class="text-lg font-semibold text-gray-900">Modul Belum Tersedia</h3>
      <p class="text-muted-foreground text-sm max-w-sm text-center mt-1">Backend API untuk modul merek belum diimplementasikan. Halaman ini masih dalam tahap konstruksi.</p>
    </div>
  </div>
</template>

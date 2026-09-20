<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'

const isSaving = ref(false)

const saveSettings = () => {
  isSaving.value = true
  setTimeout(() => {
    isSaving.value = false
  }, 1000)
}
</script>

<template>
  <div class="flex flex-col w-full max-w-4xl mx-auto pb-10">
    <div class="flex flex-col gap-1 mb-8">
      <h2 class="text-3xl font-bold tracking-tight text-gray-900">Pengaturan</h2>
      <p class="text-muted-foreground text-sm">Kelola pengaturan toko dan preferensi aplikasi.</p>
    </div>

    <div class="bg-white p-8 rounded-2xl border shadow-sm">
      <div class="flex flex-col items-center justify-center py-20 text-center">
        <h3 class="text-xl font-semibold mb-2">Halaman Sedang Dalam Pengembangan</h3>
        <p class="text-muted-foreground mb-6">Fitur pengaturan akan segera hadir di pembaruan berikutnya.</p>
        <Button :disabled="isSaving" @click="saveSettings">
          {{ isSaving ? 'Menyimpan...' : 'Simpan Pengaturan' }}
        </Button>
      </div>
    </div>
  </div>
</template>

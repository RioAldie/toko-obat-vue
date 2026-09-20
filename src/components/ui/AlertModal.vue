<script setup lang="ts">
import { ref } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2 } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}>(), {
  confirmText: 'OK',
  cancelText: 'Batal',
  variant: 'default'
})

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
  (e: 'confirm'): void
  (e: 'close'): void
}>()

const isProcessing = ref(false)

const handleClose = () => {
  if (!isProcessing.value) {
    emit('update:isOpen', false)
    emit('close')
  }
}

const handleConfirm = async () => {
  isProcessing.value = true
  try {
    emit('confirm')
  } finally {
    // If the parent component manages the loading state, it can override this
    // For now, we rely on the parent to close the modal upon successful confirmation.
  }
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="(val) => !val && handleClose()">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <div class="flex items-center gap-2">
          <AlertCircle v-if="variant === 'destructive'" class="h-5 w-5 text-red-500" />
          <DialogTitle>{{ title }}</DialogTitle>
        </div>
        <DialogDescription class="pt-2">
          {{ description }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="mt-4">
        <Button variant="outline" @click="handleClose" :disabled="isProcessing">
          {{ cancelText }}
        </Button>
        <Button 
          :variant="variant" 
          @click="handleConfirm"
          :disabled="isProcessing"
        >
          <Loader2 v-if="isProcessing" class="mr-2 h-4 w-4 animate-spin" />
          {{ isProcessing ? 'Memproses...' : confirmText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

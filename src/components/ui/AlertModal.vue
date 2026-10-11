<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'success'
  isLoading?: boolean
  showConfirm?: boolean
}>(), {
  confirmText: 'OK',
  cancelText: 'Batal',
  variant: 'default',
  isLoading: false,
  showConfirm: true
})

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void
  (e: 'confirm'): void
  (e: 'close'): void
}>()

const isProcessing = ref(false)

watch(() => [props.isOpen, props.isLoading, props.showConfirm], ([newOpen, newLoading, newShowConfirm]) => {
  if (!newOpen || !newLoading || !newShowConfirm) {
    isProcessing.value = false
  }
})

const handleClose = () => {
  if (!isProcessing.value && !props.isLoading) {
    emit('update:isOpen', false)
    emit('close')
  }
}

const handleConfirm = async () => {
  isProcessing.value = true
  try {
    emit('confirm')
  } finally {
    // If parent handles loading, it sets isLoading
  }
}
</script>

<template>
  <Dialog :open="isOpen" @update:open="(val) => !val && handleClose()">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <div class="flex items-center gap-2">
          <AlertCircle v-if="variant === 'destructive'" class="h-5 w-5 text-red-500 shrink-0" />
          <CheckCircle2 v-else-if="variant === 'success'" class="h-5 w-5 text-emerald-600 shrink-0" />
          <DialogTitle>{{ title }}</DialogTitle>
        </div>
        <DialogDescription class="pt-2">
          {{ description }}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="mt-4">
        <Button 
          :variant="showConfirm ? 'outline' : 'default'" 
          @click="handleClose" 
          :disabled="isProcessing || isLoading"
          :class="[!showConfirm && variant === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : '']"
        >
          {{ cancelText }}
        </Button>
        <Button 
          v-if="showConfirm"
          :variant="variant === 'success' ? 'default' : variant" 
          @click="handleConfirm"
          :disabled="isProcessing || isLoading"
        >
          <Loader2 v-if="isProcessing || isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ (isProcessing || isLoading) ? 'Memproses...' : confirmText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

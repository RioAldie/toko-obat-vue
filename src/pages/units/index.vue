<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'vue-sonner'
import DataTable from '@/components/ui/DataTable.vue'
import AlertModal from '@/components/ui/AlertModal.vue'
import { fetchApi } from '@/lib/api'

type Unit = {
  id: string
  name: string
  description?: string
}

const units = ref<Unit[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const isOpen = ref(false)

const formName = ref('')
const formDescription = ref('')

// Delete State
const isDeleteDialogOpen = ref(false)
const unitToDelete = ref<Unit | null>(null)
const isDeleting = ref(false)

// We mock user role for now
const userRole = localStorage.getItem('role') || ''
const isCashier = userRole === 'CASHIER'

const fetchUnits = async () => {
  isLoading.value = true
  try {
    const data = await fetchApi('/units')
    units.value = data || []
  } catch (error: any) {
    toast.error('Gagal mengambil data satuan', { description: error.message })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchUnits()
})

const onSubmit = async () => {
  if (!formName.value) return
  isSubmitting.value = true
  try {
    await fetchApi('/units', {
      method: 'POST',
      body: JSON.stringify({
        name: formName.value,
        description: formDescription.value,
      }),
    })
    toast.success('Satuan berhasil ditambahkan!')
    isOpen.value = false
    formName.value = ''
    formDescription.value = ''
    fetchUnits()
  } catch (error: any) {
    toast.error('Gagal menambahkan satuan', { description: error.message })
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (unit: Unit) => {
  unitToDelete.value = unit
  isDeleteDialogOpen.value = true
}

const executeDelete = async () => {
  if (!unitToDelete.value) return
  isDeleting.value = true
  try {
    await fetchApi(`/units/${unitToDelete.value.id}`, {
      method: 'DELETE',
    })
    toast.success('Satuan berhasil dihapus!')
    isDeleteDialogOpen.value = false
    fetchUnits()
  } catch (error: any) {
    toast.error('Gagal menghapus satuan', { description: error.message })
  } finally {
    isDeleting.value = false
    unitToDelete.value = null
  }
}

const columns = [
  {
    accessorKey: 'name',
    header: 'Nama Satuan',
    cell: ({ row }: any) => h('div', { class: 'font-semibold text-gray-900' }, row.getValue('name')),
  },
  {
    accessorKey: 'description',
    header: 'Deskripsi',
    cell: ({ row }: any) => h('div', { class: 'text-gray-600' }, row.getValue('description') || '-'),
  },
  ...(isCashier
    ? []
    : [
        {
          id: 'actions',
          cell: ({ row }: any) => {
            const unit = row.original
            return h('div', { class: 'flex items-center gap-2' }, [
              h(
                Button,
                {
                  variant: 'ghost',
                  size: 'icon',
                  class: 'h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50',
                },
                () => h(Edit, { class: 'h-4 w-4' })
              ),
              h(
                Button,
                {
                  variant: 'ghost',
                  size: 'icon',
                  class: 'h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50',
                  onClick: () => confirmDelete(unit),
                },
                () => h(Trash2, { class: 'h-4 w-4' })
              ),
            ])
          },
        },
      ]),
]
</script>

<template>
  <div class="flex flex-col w-full max-w-[1600px] mx-auto pb-10">
    <div class="flex items-center justify-between mb-6">
      <div class="flex flex-col gap-1">
        <h2 class="text-3xl font-bold tracking-tight text-gray-900">Satuan</h2>
        <p class="text-muted-foreground text-sm">Kelola satuan untuk mengukur stok produk (misal: Liter, Kg, Botol).</p>
      </div>
      
      <Dialog v-if="!isCashier" v-model:open="isOpen">
        <DialogTrigger asChild>
          <Button class="bg-primary text-white hover:bg-primary/90 rounded-lg shadow-sm">
            <Plus class="mr-2 h-4 w-4" /> Tambah Satuan
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Satuan Baru</DialogTitle>
          </DialogHeader>
          <form @submit.prevent="onSubmit" class="space-y-6 mt-6">
            <div class="space-y-3">
              <Label for="name" class="text-sm font-semibold text-foreground/90">Nama Satuan</Label>
              <Input 
                id="name" 
                v-model="formName" 
                placeholder="Misal: Pcs, Kg, Box" 
                required 
                class="bg-muted/20 border-border/50 focus-visible:ring-primary/20 shadow-inner" 
              />
            </div>
            <div class="space-y-3">
              <Label for="description" class="text-sm font-semibold text-foreground/90">Deskripsi (Opsional)</Label>
              <Input 
                id="description" 
                v-model="formDescription" 
                placeholder="Deskripsi singkat" 
                class="bg-muted/20 border-border/50 focus-visible:ring-primary/20 shadow-inner" 
              />
            </div>
            <div class="flex justify-end pt-4">
              <Button 
                type="submit" 
                :disabled="isSubmitting" 
                class="w-full sm:w-auto bg-gradient-to-b from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-primary-foreground shadow-md transition-all rounded-xl h-10 px-8 font-medium"
              >
                <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
                Simpan Satuan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>

    <!-- Alert Modal for Delete -->
    <AlertModal
      v-model:isOpen="isDeleteDialogOpen"
      title="Konfirmasi Hapus"
      :description="`Apakah Anda yakin ingin menghapus satuan ${unitToDelete?.name}? Tindakan ini tidak dapat dibatalkan.`"
      variant="destructive"
      confirmText="Hapus Satuan"
      @confirm="executeDelete"
    />

    <div v-if="isLoading" class="flex justify-center p-10">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
    <DataTable v-else :columns="columns" :data="units" searchKey="name" />
  </div>
</template>

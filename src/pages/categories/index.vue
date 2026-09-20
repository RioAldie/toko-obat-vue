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

type Category = {
  id: string
  name: string
  description?: string
}

const categories = ref<Category[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const isOpen = ref(false)

const formName = ref('')
const formDescription = ref('')

// Delete State
const isDeleteDialogOpen = ref(false)
const categoryToDelete = ref<Category | null>(null)
const isDeleting = ref(false)

// We mock user role for now
const userRole = localStorage.getItem('role') || ''
const isCashier = userRole === 'CASHIER'

const fetchCategories = async () => {
  isLoading.value = true
  try {
    const data = await fetchApi('/categories')
    categories.value = data || []
  } catch (error: any) {
    toast.error('Gagal mengambil data kategori', { description: error.message })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchCategories()
})

const onSubmit = async () => {
  if (!formName.value) return
  isSubmitting.value = true
  try {
    await fetchApi('/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: formName.value,
        description: formDescription.value,
      }),
    })
    toast.success('Kategori berhasil ditambahkan!')
    isOpen.value = false
    formName.value = ''
    formDescription.value = ''
    fetchCategories()
  } catch (error: any) {
    toast.error('Gagal menambahkan kategori', { description: error.message })
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (category: Category) => {
  categoryToDelete.value = category
  isDeleteDialogOpen.value = true
}

const executeDelete = async () => {
  if (!categoryToDelete.value) return
  isDeleting.value = true
  try {
    await fetchApi(`/categories/${categoryToDelete.value.id}`, {
      method: 'DELETE',
    })
    toast.success('Kategori berhasil dihapus!')
    isDeleteDialogOpen.value = false
    fetchCategories()
  } catch (error: any) {
    toast.error('Gagal menghapus kategori', { description: error.message })
  } finally {
    isDeleting.value = false
    categoryToDelete.value = null
  }
}

const columns = [
  {
    accessorKey: 'name',
    header: 'Nama Kategori',
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
            const category = row.original
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
                  onClick: () => confirmDelete(category),
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
        <h2 class="text-3xl font-bold tracking-tight text-gray-900">Kategori</h2>
        <p class="text-muted-foreground text-sm">Kelola kategori produk untuk memudahkan pengelompokan obat.</p>
      </div>
      
      <Dialog v-if="!isCashier" v-model:open="isOpen">
        <DialogTrigger asChild>
          <Button class="bg-primary text-white hover:bg-primary/90 rounded-lg shadow-sm">
            <Plus class="mr-2 h-4 w-4" /> Tambah Kategori
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kategori Baru</DialogTitle>
          </DialogHeader>
          <form @submit.prevent="onSubmit" class="space-y-6 mt-6">
            <div class="space-y-3">
              <Label for="name" class="text-sm font-semibold text-foreground/90">Nama Kategori</Label>
              <Input 
                id="name" 
                v-model="formName" 
                placeholder="Misal: Obat Sirup" 
                required 
                class="bg-muted/20 border-border/50 focus-visible:ring-primary/20 shadow-inner" 
              />
            </div>
            <div class="space-y-3">
              <Label for="description" class="text-sm font-semibold text-foreground/90">Deskripsi (Opsional)</Label>
              <Input 
                id="description" 
                v-model="formDescription" 
                placeholder="Deskripsi singkat tentang kategori ini" 
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
                Simpan Kategori
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
      :description="`Apakah Anda yakin ingin menghapus kategori ${categoryToDelete?.name}? Tindakan ini tidak dapat dibatalkan.`"
      variant="destructive"
      confirmText="Hapus Kategori"
      @confirm="executeDelete"
    />

    <div v-if="isLoading" class="flex justify-center p-10">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
    <DataTable v-else :columns="columns" :data="categories" searchKey="name" />
  </div>
</template>

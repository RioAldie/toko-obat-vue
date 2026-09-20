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

type Product = {
  id: string
  sku: string
  name: string
  costPrice: number
  price: number
  stock: number
  categoryId: string
  unitId: string
  category?: { name: string }
  unit?: { name: string }
  description?: string
}

type Category = { id: string, name: string }
type Unit = { id: string, name: string }
type User = { id: string, username: string }

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const units = ref<Unit[]>([])
const users = ref<User[]>([])

const isLoading = ref(true)
const isSubmitting = ref(false)

// Modals State
const isAddOpen = ref(false)
const isEditOpen = ref(false)
const isHistoryOpen = ref(false)

// Edit State
const editingProduct = ref<Product | null>(null)
const editPending = ref(false)

// Delete State
const isDeleteDialogOpen = ref(false)
const productToDelete = ref<Product | null>(null)
const isDeleting = ref(false)

// History State
const historyData = ref<any[]>([])
const historyLoading = ref(false)

// We mock user role for now
const userRole = localStorage.getItem('role') || ''
const isCashier = userRole === 'CASHIER'
const userId = localStorage.getItem('userId') || ''

// Form Data for Add
const addForm = ref({
  sku: '',
  name: '',
  description: '',
  categoryId: '',
  unitId: '',
  costPrice: 0,
  price: 0,
  stock: 0,
  userId: userId
})

// Form Data for Edit
const editForm = ref({
  sku: '',
  name: '',
  description: '',
  categoryId: '',
  unitId: '',
  costPrice: 0,
  price: 0,
})

const fetchData = async () => {
  isLoading.value = true
  try {
    if (isCashier) {
      // Cashier only needs products
      const productsRes = await fetchApi('/products')
      products.value = productsRes || []
    } else {
      // Admins/Managers need everything for the Add/Edit forms
      const [productsRes, categoriesRes, unitsRes, usersRes] = await Promise.all([
        fetchApi('/products'),
        fetchApi('/categories'),
        fetchApi('/units'),
        fetchApi('/users')
      ])
      products.value = productsRes || []
      categories.value = categoriesRes || []
      units.value = unitsRes || []
      users.value = usersRes || []
    }
  } catch (error: any) {
    toast.error('Gagal mengambil data', { description: error.message })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const onAddSubmit = async () => {
  if (!addForm.value.name || !addForm.value.sku || !addForm.value.categoryId || !addForm.value.unitId) return
  isSubmitting.value = true
  try {
    await fetchApi('/products', {
      method: 'POST',
      body: JSON.stringify(addForm.value),
    })
    toast.success('Produk berhasil ditambahkan!')
    isAddOpen.value = false
    // reset
    addForm.value = { sku: '', name: '', description: '', categoryId: '', unitId: '', costPrice: 0, price: 0, stock: 0, userId }
    fetchData()
  } catch (error: any) {
    toast.error('Gagal menambahkan produk', { description: error.message })
  } finally {
    isSubmitting.value = false
  }
}

const handleEdit = (product: Product) => {
  editingProduct.value = product
  editForm.value = {
    sku: product.sku,
    name: product.name,
    description: product.description || '',
    categoryId: product.categoryId,
    unitId: product.unitId,
    costPrice: product.costPrice,
    price: product.price,
  }
  isEditOpen.value = true
}

const onEditSubmit = async () => {
  if (!editingProduct.value) return
  editPending.value = true
  try {
    await fetchApi(`/products/${editingProduct.value.id}`, {
      method: 'PUT',
      body: JSON.stringify(editForm.value),
    })
    toast.success('Produk berhasil diperbarui!')
    isEditOpen.value = false
    editingProduct.value = null
    fetchData()
  } catch (error: any) {
    toast.error('Gagal memperbarui produk', { description: error.message })
  } finally {
    editPending.value = false
  }
}

const confirmDelete = (product: Product) => {
  productToDelete.value = product
  isDeleteDialogOpen.value = true
}

const executeDelete = async () => {
  if (!productToDelete.value) return
  isDeleting.value = true
  try {
    await fetchApi(`/products/${productToDelete.value.id}`, {
      method: 'DELETE',
    })
    toast.success('Produk berhasil dihapus!')
    isDeleteDialogOpen.value = false
    fetchData()
  } catch (error: any) {
    toast.error('Gagal menghapus produk', { description: error.message })
  } finally {
    isDeleting.value = false
    productToDelete.value = null
  }
}

const handleViewHistory = async (id: string) => {
  isHistoryOpen.value = true
  historyLoading.value = true
  try {
    const res = await fetchApi(`/products/${id}/price-history`)
    historyData.value = res || []
    if (historyData.value.length === 0) {
      toast.info("Data riwayat kosong dari server")
    }
  } catch (e: any) {
    toast.error("Gagal memuat riwayat harga", { description: e.message })
  } finally {
    historyLoading.value = false
  }
}

const columns = [
  {
    id: "no",
    header: "No.",
    cell: ({ row }: any) => h('div', { class: 'text-center text-gray-500 w-8' }, row.index + 1),
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }: any) => h('div', { class: 'font-medium text-gray-900' }, row.getValue("sku")),
  },
  {
    accessorKey: "name",
    header: "Nama Produk",
    cell: ({ row }: any) => h('div', { class: 'font-semibold text-gray-800' }, row.getValue("name")),
  },
  {
    accessorKey: "category.name",
    header: "Kategori",
    cell: ({ row }: any) => h('div', { class: 'text-gray-600' }, row.original.category?.name || "-"),
  },
  {
    accessorKey: "price",
    header: "Harga Jual",
    cell: ({ row }: any) => {
      const price = parseFloat(row.getValue("price"))
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
      }).format(price)
      return h('div', { class: 'font-medium text-gray-900' }, formatted)
    },
  },
  ...(isCashier ? [] : [
    {
      accessorKey: "costPrice",
      header: "Harga Modal",
      cell: ({ row }: any) => {
        const costPrice = parseFloat(row.getValue("costPrice") || "0")
        const formatted = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0
        }).format(costPrice)
        return h('div', { class: 'text-gray-600' }, formatted)
      },
    },
    {
      id: "margin",
      header: "Margin",
      cell: ({ row }: any) => {
        const price = parseFloat(row.getValue("price"))
        const costPrice = parseFloat(row.getValue("costPrice") || "0")
        const margin = price - costPrice
        const formatted = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0
        }).format(margin)
        
        return h('div', { class: `font-medium ${margin < 0 ? 'text-red-600' : 'text-green-600'}` }, formatted)
      },
    }
  ]),
  {
    accessorKey: "stock",
    header: "Stok",
    cell: ({ row }: any) => {
      const stock = parseInt(row.getValue("stock")) || 0
      return h('div', { class: `font-medium ${stock <= 10 ? 'text-red-600' : 'text-gray-900'}` }, stock)
    },
  },
  ...(isCashier ? [] : [{
    id: "actions",
    cell: ({ row }: any) => {
      const product = row.original

      return h('div', { class: 'flex items-center gap-2' }, [
        h(Button, {
          variant: "ghost",
          size: "sm",
          onClick: () => handleViewHistory(product.id),
          class: "h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
        }, () => "Riwayat"),
        h(Button, {
          variant: "ghost",
          size: "icon",
          onClick: () => handleEdit(product),
          class: "h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        }, () => h(Edit, { class: "h-4 w-4" })),
        h(Button, {
          variant: "ghost",
          size: "icon",
          onClick: () => confirmDelete(product),
          class: "h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
        }, () => h(Trash2, { class: "h-4 w-4" }))
      ])
    },
  }])
]
</script>

<template>
  <div class="flex flex-col w-full max-w-[1600px] mx-auto pb-10">
    <div class="flex items-center justify-between mb-6">
      <div class="flex flex-col gap-1">
        <h2 class="text-3xl font-bold tracking-tight text-gray-900">Produk</h2>
        <p class="text-muted-foreground text-sm">Kelola daftar produk, stok, dan harga obat di toko Anda.</p>
      </div>
      
      <Dialog v-if="!isCashier" v-model:open="isAddOpen">
        <DialogTrigger asChild>
          <Button class="bg-primary text-white hover:bg-primary/90 rounded-lg shadow-sm">
            <Plus class="mr-2 h-4 w-4" /> Tambah Produk
          </Button>
        </DialogTrigger>
        <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Produk Baru</DialogTitle>
          </DialogHeader>
          <form @submit.prevent="onAddSubmit" class="space-y-6 mt-6">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-3">
                <Label for="sku" class="text-sm font-semibold text-foreground/90">SKU (Kode Produk)</Label>
                <Input id="sku" v-model="addForm.sku" placeholder="Misal: OB-001" required class="bg-muted/20 border-border/50 focus-visible:ring-primary/20 shadow-inner" />
              </div>
              <div class="space-y-3">
                <Label for="name" class="text-sm font-semibold text-foreground/90">Nama Produk</Label>
                <Input id="name" v-model="addForm.name" placeholder="Misal: Paracetamol 500mg" required class="bg-muted/20 border-border/50 focus-visible:ring-primary/20 shadow-inner" />
              </div>
            </div>

            <div class="space-y-3">
              <Label for="description" class="text-sm font-semibold text-foreground/90">Deskripsi (Opsional)</Label>
              <Input id="description" v-model="addForm.description" placeholder="Deskripsi obat..." class="bg-muted/20 border-border/50 focus-visible:ring-primary/20 shadow-inner" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-3">
                <Label for="categoryId" class="text-sm font-semibold text-foreground/90">Kategori</Label>
                <select 
                  id="categoryId" 
                  v-model="addForm.categoryId"
                  required 
                  class="flex h-10 w-full items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm shadow-inner transition-all ring-offset-background placeholder:text-muted-foreground focus:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20"
                >
                  <option value="" disabled>Pilih Kategori...</option>
                  <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div class="space-y-3">
                <Label for="unitId" class="text-sm font-semibold text-foreground/90">Satuan</Label>
                <select 
                  id="unitId" 
                  v-model="addForm.unitId"
                  required 
                  class="flex h-10 w-full items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm shadow-inner transition-all ring-offset-background placeholder:text-muted-foreground focus:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20"
                >
                  <option value="" disabled>Pilih Satuan...</option>
                  <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-3">
                <Label for="costPrice" class="text-sm font-semibold text-foreground/90">Harga Modal (Rp)</Label>
                <Input id="costPrice" v-model.number="addForm.costPrice" type="number" min="0" placeholder="0" required class="bg-muted/20 border-border/50 focus-visible:ring-primary/20 shadow-inner" />
              </div>
              <div class="space-y-3">
                <Label for="price" class="text-sm font-semibold text-foreground/90">Harga Jual (Rp)</Label>
                <Input id="price" v-model.number="addForm.price" type="number" min="0" placeholder="0" required class="bg-muted/20 border-border/50 focus-visible:ring-primary/20 shadow-inner" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 border-t border-border/50 pt-4 mt-2">
              <div class="space-y-3">
                <Label for="stock" class="text-sm font-semibold text-foreground/90">Stok Awal (Opsional)</Label>
                <Input id="stock" v-model.number="addForm.stock" type="number" min="0" placeholder="0" class="bg-muted/20 border-border/50 focus-visible:ring-primary/20 shadow-inner" />
              </div>
              <div class="space-y-3">
                <Label for="userId" class="text-sm font-semibold text-foreground/90">Penanggung Jawab Stok Awal</Label>
                <select 
                  id="userId" 
                  v-model="addForm.userId"
                  class="flex h-10 w-full items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm shadow-inner transition-all ring-offset-background placeholder:text-muted-foreground focus:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20"
                >
                  <option value="" disabled>Pilih PIC...</option>
                  <option v-for="u in users" :key="u.id" :value="u.id">{{ u.username }}</option>
                </select>
              </div>
            </div>

            <div class="flex justify-end pt-4">
              <Button type="submit" :disabled="isSubmitting" class="w-full sm:w-auto bg-gradient-to-b from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-primary-foreground shadow-md transition-all rounded-xl h-10 px-8 font-medium">
                <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
                Simpan Produk
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>

    <!-- Edit Modal -->
    <Dialog v-model:open="isEditOpen">
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Produk</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="onEditSubmit" class="space-y-6 mt-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-3">
              <Label for="edit-sku" class="text-sm font-semibold text-foreground/90">SKU (Kode Produk)</Label>
              <Input id="edit-sku" v-model="editForm.sku" required class="bg-muted/20 border-border/50 focus-visible:ring-primary/20 shadow-inner" />
            </div>
            <div class="space-y-3">
              <Label for="edit-name" class="text-sm font-semibold text-foreground/90">Nama Produk</Label>
              <Input id="edit-name" v-model="editForm.name" required class="bg-muted/20 border-border/50 focus-visible:ring-primary/20 shadow-inner" />
            </div>
          </div>

          <div class="space-y-3">
            <Label for="edit-description" class="text-sm font-semibold text-foreground/90">Deskripsi (Opsional)</Label>
            <Input id="edit-description" v-model="editForm.description" class="bg-muted/20 border-border/50 focus-visible:ring-primary/20 shadow-inner" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-3">
              <Label for="edit-categoryId" class="text-sm font-semibold text-foreground/90">Kategori</Label>
              <select 
                id="edit-categoryId" 
                v-model="editForm.categoryId"
                required 
                class="flex h-10 w-full items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm shadow-inner transition-all ring-offset-background placeholder:text-muted-foreground focus:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="space-y-3">
              <Label for="edit-unitId" class="text-sm font-semibold text-foreground/90">Satuan</Label>
              <select 
                id="edit-unitId" 
                v-model="editForm.unitId"
                required 
                class="flex h-10 w-full items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm shadow-inner transition-all ring-offset-background placeholder:text-muted-foreground focus:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-3">
              <Label for="edit-costPrice" class="text-sm font-semibold text-foreground/90">Harga Modal (Rp)</Label>
              <Input id="edit-costPrice" v-model.number="editForm.costPrice" type="number" min="0" required class="bg-muted/20 border-border/50 focus-visible:ring-primary/20 shadow-inner" />
            </div>
            <div class="space-y-3">
              <Label for="edit-price" class="text-sm font-semibold text-foreground/90">Harga Jual (Rp)</Label>
              <Input id="edit-price" v-model.number="editForm.price" type="number" min="0" required class="bg-muted/20 border-border/50 focus-visible:ring-primary/20 shadow-inner" />
            </div>
          </div>

          <div class="flex justify-end pt-4 gap-2">
            <Button type="button" variant="outline" @click="isEditOpen = false" class="rounded-xl">Batal</Button>
            <Button type="submit" :disabled="editPending" class="bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transition-all rounded-xl h-10 px-8 font-medium">
              <Loader2 v-if="editPending" class="mr-2 h-4 w-4 animate-spin" />
              Perbarui Produk
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    <!-- History Modal -->
    <Dialog v-model:open="isHistoryOpen">
      <DialogContent class="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Riwayat Perubahan Harga</DialogTitle>
        </DialogHeader>
        <div v-if="historyLoading" class="flex justify-center p-8">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
        </div>
        <div v-else-if="historyData.length === 0" class="text-center p-8 text-muted-foreground">
          Belum ada riwayat perubahan harga untuk produk ini.
        </div>
        <div v-else class="mt-4 border rounded-lg overflow-x-auto overflow-y-auto flex-1 min-h-0">
          <table class="w-full text-sm text-left min-w-[800px]">
            <thead class="bg-gray-50 text-gray-700">
              <tr>
                <th class="px-4 py-3 font-medium">Tanggal</th>
                <th class="px-4 py-3 font-medium">Harga Modal Lama</th>
                <th class="px-4 py-3 font-medium">Harga Modal Baru</th>
                <th class="px-4 py-3 font-medium">Harga Jual Lama</th>
                <th class="px-4 py-3 font-medium">Harga Jual Baru</th>
                <th class="px-4 py-3 font-medium">Diubah Oleh</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="history in historyData" :key="history.id" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {{ new Date(history.createdAt).toLocaleString('id-ID') }}
                </td>
                <td class="px-4 py-3 text-gray-500">
                  {{ history.oldCostPrice ? `Rp ${Number(history.oldCostPrice).toLocaleString('id-ID')}` : '-' }}
                </td>
                <td class="px-4 py-3 font-medium text-gray-900">
                  Rp {{ Number(history.newCostPrice).toLocaleString('id-ID') }}
                </td>
                <td class="px-4 py-3 text-gray-500">
                  {{ history.oldPrice ? `Rp ${Number(history.oldPrice).toLocaleString('id-ID')}` : '-' }}
                </td>
                <td class="px-4 py-3 font-medium text-primary">
                  Rp {{ Number(history.newPrice).toLocaleString('id-ID') }}
                </td>
                <td class="px-4 py-3 text-gray-700 capitalize">
                  {{ history.user?.username || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex justify-end pt-4">
          <Button variant="outline" @click="isHistoryOpen = false">Tutup</Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Alert Modal for Delete -->
    <AlertModal
      v-model:isOpen="isDeleteDialogOpen"
      title="Konfirmasi Hapus"
      :description="`Apakah Anda yakin ingin menghapus produk ${productToDelete?.name}? Tindakan ini tidak dapat dibatalkan.`"
      variant="destructive"
      confirmText="Ya, Hapus"
      :isLoading="isDeleting"
      @confirm="executeDelete"
    />

    <div v-if="isLoading" class="flex justify-center p-10">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
    <DataTable v-else :columns="columns" :data="products" searchKey="name" />
  </div>
</template>

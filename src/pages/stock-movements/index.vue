<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { Plus, Loader2, ArrowDownRight, ArrowUpRight, RefreshCcw } from 'lucide-vue-next'
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
import { fetchApi } from '@/lib/api'

type StockMovement = {
  id: string
  productId: string
  userId: string
  type: "IN" | "OUT" | "ADJUSTMENT"
  quantity: number
  reason?: string
  createdAt: string
  product?: { name: string, sku: string }
  user?: { id: string, username: string }
}

type Product = { id: string, name: string, sku: string }
type User = { id: string, username: string }

const stockMovements = ref<StockMovement[]>([])
const products = ref<Product[]>([])
const users = ref<User[]>([])

const isLoading = ref(true)
const isSubmitting = ref(false)
const isOpen = ref(false)

const userId = localStorage.getItem('userId') || ''
const form = ref({
  productId: '',
  type: 'IN',
  quantity: 0,
  userId: userId,
  reason: ''
})

const fetchData = async () => {
  isLoading.value = true
  try {
    const [movementsRes, productsRes, usersRes] = await Promise.all([
      fetchApi('/stock-movements'),
      fetchApi('/products'),
      fetchApi('/users')
    ])
    stockMovements.value = movementsRes || []
    products.value = productsRes || []
    users.value = usersRes || []
    
    if (!form.value.userId && users.value.length > 0) {
      form.value.userId = users.value[0].id
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

const onSubmit = async () => {
  if (!form.value.productId || !form.value.userId || !form.value.quantity) return
  isSubmitting.value = true
  try {
    await fetchApi('/stock-movements', {
      method: 'POST',
      body: JSON.stringify(form.value),
    })
    toast.success('Pergerakan stok berhasil dicatat!')
    isOpen.value = false
    form.value = { productId: '', type: 'IN', quantity: 0, userId: form.value.userId, reason: '' }
    fetchData()
  } catch (error: any) {
    toast.error('Gagal mencatat pergerakan stok', { description: error.message })
  } finally {
    isSubmitting.value = false
  }
}

const columns = [
  {
    id: "no",
    header: "No.",
    cell: ({ row }: any) => h('div', { class: 'text-center text-gray-500 w-8' }, row.index + 1),
  },
  {
    accessorKey: "createdAt",
    header: "Tanggal",
    cell: ({ row }: any) => {
      const dateStr = row.getValue("createdAt") as string
      return h('div', { class: 'text-gray-600' }, new Date(dateStr).toLocaleString('id-ID'))
    }
  },
  {
    accessorKey: "product.name",
    header: "Produk",
    cell: ({ row }: any) => {
      const p = row.original.product
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-semibold text-gray-800' }, p?.name || "-"),
        h('span', { class: 'text-xs text-gray-500' }, p?.sku || "-")
      ])
    }
  },
  {
    accessorKey: "type",
    header: "Tipe",
    cell: ({ row }: any) => {
      const type = row.getValue("type") as string
      if (type === "IN") {
        return h('span', { class: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800' }, [
          h(ArrowDownRight, { class: 'h-3 w-3' }),
          "Masuk (IN)"
        ])
      } else if (type === "OUT") {
        return h('span', { class: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800' }, [
          h(ArrowUpRight, { class: 'h-3 w-3' }),
          "Keluar (OUT)"
        ])
      } else {
        return h('span', { class: 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800' }, [
          h(RefreshCcw, { class: 'h-3 w-3' }),
          "Penyesuaian"
        ])
      }
    }
  },
  {
    accessorKey: "quantity",
    header: "Jumlah",
    cell: ({ row }: any) => {
      const type = row.original.type
      const qty = row.getValue("quantity") as number
      const prefix = type === "IN" ? "+" : type === "OUT" ? "-" : ""
      const color = type === "IN" ? "text-green-600" : type === "OUT" ? "text-red-600" : "text-blue-600"
      return h('div', { class: `font-bold ${color}` }, `${prefix}${qty}`)
    },
  },
  {
    accessorKey: "reason",
    header: "Alasan",
    cell: ({ row }: any) => h('div', { class: 'text-gray-600 max-w-[200px] truncate' }, row.getValue("reason") || "-"),
  },
  {
    accessorKey: "user.username",
    header: "Kasir/User",
    cell: ({ row }: any) => h('div', { class: 'text-gray-600 capitalize' }, row.original.user?.username || "-")
  },
]
</script>

<template>
  <div class="flex flex-col w-full max-w-[1600px] mx-auto pb-10">
    <div class="flex items-center justify-between mb-6">
      <div class="flex flex-col gap-1">
        <h2 class="text-3xl font-bold tracking-tight text-gray-900">Pergerakan Stok</h2>
        <p class="text-muted-foreground text-sm">Lihat laporan keluar masuk stok barang (Stock in/out).</p>
      </div>
      
      <Dialog v-model:open="isOpen">
        <DialogTrigger asChild>
          <Button class="bg-primary text-white hover:bg-primary/90 rounded-lg shadow-sm">
            <Plus class="mr-2 h-4 w-4" /> Tambah Pergerakan
          </Button>
        </DialogTrigger>
        <DialogContent class="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Pergerakan Stok</DialogTitle>
          </DialogHeader>
          <form @submit.prevent="onSubmit" class="space-y-6 mt-4">
            
            <div class="space-y-3">
              <Label for="productId" class="text-sm font-semibold text-foreground/90">Produk</Label>
              <select 
                id="productId" 
                v-model="form.productId"
                required 
                class="flex h-10 w-full items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm shadow-inner transition-all ring-offset-background placeholder:text-muted-foreground focus:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                <option value="" disabled>Pilih Produk...</option>
                <option v-for="p in products" :key="p.id" :value="p.id">[{{ p.sku }}] {{ p.name }}</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-3">
                <Label for="type" class="text-sm font-semibold text-foreground/90">Tipe</Label>
                <select 
                  id="type" 
                  v-model="form.type"
                  required 
                  class="flex h-10 w-full items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm shadow-inner transition-all ring-offset-background placeholder:text-muted-foreground focus:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20"
                >
                  <option value="IN">Masuk (IN)</option>
                  <option value="OUT">Keluar (OUT)</option>
                  <option value="ADJUSTMENT">Penyesuaian (ADJUSTMENT)</option>
                </select>
              </div>

              <div class="space-y-3">
                <Label for="quantity" class="text-sm font-semibold text-foreground/90">Jumlah</Label>
                <Input 
                  id="quantity" 
                  v-model.number="form.quantity"
                  type="number" 
                  placeholder="Contoh: 10 atau -5" 
                  required 
                  class="bg-muted/20 border-border/50 focus-visible:ring-primary/20 shadow-inner" 
                />
              </div>
            </div>

            <div class="space-y-3">
              <Label for="userId" class="text-sm font-semibold text-foreground/90">PIC / Kasir</Label>
              <select 
                id="userId" 
                v-model="form.userId"
                required 
                class="flex h-10 w-full items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm shadow-inner transition-all ring-offset-background placeholder:text-muted-foreground focus:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                <option value="" disabled>Pilih PIC...</option>
                <option v-for="u in users" :key="u.id" :value="u.id">{{ u.username }}</option>
              </select>
            </div>

            <div class="space-y-3">
              <Label for="reason" class="text-sm font-semibold text-foreground/90">Alasan / Catatan (Opsional)</Label>
              <Input 
                id="reason" 
                v-model="form.reason"
                placeholder="Misal: Stok awal, Barang rusak..." 
                class="bg-muted/20 border-border/50 focus-visible:ring-primary/20 shadow-inner" 
              />
            </div>

            <div class="flex justify-end pt-4 gap-2">
              <Button type="button" variant="outline" @click="isOpen = false" class="rounded-xl">Batal</Button>
              <Button type="submit" :disabled="isSubmitting" class="bg-gradient-to-b from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-primary-foreground shadow-md transition-all rounded-xl h-10 px-8 font-medium">
                <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
                Simpan Data
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>

    <div v-if="isLoading" class="flex justify-center p-10">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
    <DataTable v-else :columns="columns" :data="stockMovements" searchKey="reason" />
  </div>
</template>

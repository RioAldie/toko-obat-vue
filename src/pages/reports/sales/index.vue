<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { Eye, FileText, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'vue-sonner'
import DataTable from '@/components/ui/DataTable.vue'
import AlertModal from '@/components/ui/AlertModal.vue'
import ReceiptPrinter from '@/components/ReceiptPrinter.vue'
import { fetchApi } from '@/lib/api'

type Sale = {
  id: string
  invoiceNumber: string
  totalAmount: string | number
  status: string
  createdAt: string
  user: {
    id: string
    username: string
  }
  _count?: {
    saleDetails: number
  }
}

const getTodayString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const sales = ref<Sale[]>([])
const isLoadingPage = ref(true)

const isDetailOpen = ref(false)
const selectedSale = ref<any | null>(null)
const isLoading = ref(false)

const userRole = localStorage.getItem('role') || ''
const isCashier = userRole === 'CASHIER'

const startDate = ref(getTodayString())
const endDate = ref(getTodayString())

const isAlertOpen = ref(false)
const alertConfig = ref({
  title: '',
  description: '',
  variant: 'default' as 'default' | 'destructive',
  onConfirm: undefined as (() => void) | undefined
})

const fetchData = async () => {
  isLoadingPage.value = true
  try {
    const res = await fetchApi('/sales')
    sales.value = res || []
  } catch (error: any) {
    toast.error('Gagal mengambil data', { description: error.message })
  } finally {
    isLoadingPage.value = false
  }
}

onMounted(() => {
  fetchData()
})

const filteredData = computed(() => {
  return sales.value.filter(sale => {
    if (!startDate.value && !endDate.value) return true
    
    const saleDate = new Date(sale.createdAt).getTime()
    
    const start = startDate.value ? new Date(startDate.value) : null
    if (start) start.setHours(0, 0, 0, 0)
    
    const end = endDate.value ? new Date(endDate.value) : null
    if (end) end.setHours(23, 59, 59, 999)

    if (start && end) {
      return saleDate >= start.getTime() && saleDate <= end.getTime()
    } else if (start) {
      return saleDate >= start.getTime()
    } else if (end) {
      return saleDate <= end.getTime()
    }
    return true
  })
})

const handleViewDetails = async (id: string) => {
  isLoading.value = true
  isDetailOpen.value = true
  try {
    const res = await fetchApi(`/sales/${id}`)
    selectedSale.value = res
  } catch (error: any) {
    toast.error('Gagal mengambil detail penjualan', { description: error.message })
  } finally {
    isLoading.value = false
  }
}

const printReceipt = () => {
  window.print()
}

const receiptProps = computed(() => {
  if (!selectedSale.value) return null
  
  return {
    invoiceNumber: selectedSale.value.invoiceNumber,
    date: selectedSale.value.createdAt,
    cashierName: selectedSale.value.user?.username || 'Kasir',
    buyerName: selectedSale.value.buyerName,
    items: selectedSale.value.saleDetails.map((item: any) => ({
      name: item.productName || item.product?.name || "Item Manual",
      qty: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
      price: Number(item.price)
    })),
    total: Number(selectedSale.value.totalAmount)
  }
})

const handleCancelSale = (id: string) => {
  alertConfig.value = {
    title: "Batalkan Transaksi",
    description: "Apakah Anda yakin ingin membatalkan transaksi ini? Total penjualan akan dikurangi, tetapi riwayat tetap disimpan.",
    variant: "destructive",
    onConfirm: async () => {
      isAlertOpen.value = false
      isLoading.value = true
      try {
        await fetchApi(`/sales/${id}/cancel`, { method: "PUT" })
        toast.success('Transaksi berhasil dibatalkan')
        isDetailOpen.value = false
        fetchData()
      } catch (error: any) {
        toast.error('Gagal membatalkan transaksi', { description: error.message })
      } finally {
        isLoading.value = false
      }
    }
  }
  isAlertOpen.value = true
}

const columns = [
  {
    id: "no",
    header: "No.",
    cell: ({ row }: any) => h('div', { class: 'text-center text-gray-500 w-8' }, row.index + 1),
  },
  {
    accessorKey: "invoiceNumber",
    header: "No. Invoice",
    cell: ({ row }: any) => h('div', { class: 'font-semibold font-mono text-primary' }, row.getValue("invoiceNumber")),
  },
  {
    accessorKey: "createdAt",
    header: "Tanggal Transaksi",
    cell: ({ row }: any) => {
      const date = new Date(row.getValue("createdAt"))
      return h('div', { class: 'text-gray-600' }, date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
    },
  },
  {
    accessorKey: "user.username",
    header: "Kasir",
    cell: ({ row }: any) => h('div', { class: 'text-gray-600 capitalize' }, row.original.user?.username || '-'),
  },
  {
    accessorKey: "itemsCount",
    header: "Jumlah Item",
    cell: ({ row }: any) => h('div', { class: 'text-gray-600' }, `${row.original._count?.saleDetails || 0} Item`),
  },
  {
    accessorKey: "totalAmount",
    header: "Total Belanja",
    cell: ({ row }: any) => h('div', { class: 'font-bold text-gray-900' }, `Rp ${Number(row.getValue("totalAmount")).toLocaleString('id-ID')}`),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: any) => {
      const status = row.original.status || "COMPLETED"
      const bg = status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      return h('span', { class: `px-2 py-1 rounded-full text-[10px] font-bold ${bg}` }, status)
    },
  },
  {
    id: "actions",
    cell: ({ row }: any) => {
      const id = row.original.id
      return h('div', { class: 'flex items-center gap-2' }, [
        h(Button, {
          variant: "outline",
          size: "sm",
          onClick: () => handleViewDetails(id),
          class: "gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
        }, () => [
          h(Eye, { class: 'h-4 w-4' }),
          "Detail"
        ])
      ])
    },
  },
]
</script>

<template>
  <div class="flex flex-col w-full max-w-[1600px] mx-auto pb-10 print:hidden">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div class="flex flex-col gap-1">
        <h2 class="text-3xl font-bold tracking-tight text-gray-900">Riwayat Penjualan</h2>
        <p class="text-muted-foreground text-sm">Lihat semua transaksi penjualan yang telah berhasil dilakukan.</p>
      </div>
      <div class="flex flex-col md:flex-row items-center gap-2 bg-white p-3 rounded-xl border shadow-sm w-full md:w-auto">
        <div class="flex items-center justify-between w-full md:w-auto gap-2">
          <span class="text-sm text-muted-foreground font-medium pl-2 md:pl-2 shrink-0">Dari</span>
          <Input 
            type="date" 
            v-model="startDate"
            class="h-9 border-0 bg-gray-50 focus-visible:ring-1 flex-1 md:w-auto"
          />
        </div>
        <span class="text-muted-foreground font-bold hidden md:block">-</span>
        <div class="flex items-center justify-between w-full md:w-auto gap-2">
          <span class="text-sm text-muted-foreground font-medium pl-2 md:pl-0 shrink-0 md:hidden">Sampai</span>
          <Input 
            type="date" 
            v-model="endDate"
            class="h-9 border-0 bg-gray-50 focus-visible:ring-1 flex-1 md:w-auto"
          />
        </div>
        <div class="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 justify-end">
          <Button v-if="startDate || endDate" variant="ghost" size="sm" @click="startDate = ''; endDate = ''" class="text-muted-foreground hover:text-red-500 font-semibold text-xs h-9">
            Reset
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            @click="startDate = getTodayString(); endDate = getTodayString();" 
            class="h-9 font-medium"
          >
            Hari Ini
          </Button>
        </div>
      </div>
    </div>

    <div v-if="isLoadingPage" class="flex justify-center p-10">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
    <DataTable v-else :columns="columns" :data="filteredData" searchKey="invoiceNumber" />

    <Dialog v-model:open="isDetailOpen">
      <DialogContent class="max-w-2xl print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none print:bg-transparent">
        <div class="print:hidden space-y-6">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-xl">
            <FileText class="h-5 w-5 text-primary" />
            Detail Transaksi
          </DialogTitle>
        </DialogHeader>
        
        <div v-if="isLoading" class="flex justify-center py-10">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <div v-else-if="selectedSale" class="space-y-6 mt-4">
          <!-- Header Info -->
          <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border">
            <div>
              <p class="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">No. Invoice</p>
              <p class="font-bold font-mono text-gray-900">{{ selectedSale.invoiceNumber }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Tanggal</p>
              <p class="font-semibold text-gray-900">
                {{ new Date(selectedSale.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Kasir</p>
              <p class="font-semibold text-gray-900 capitalize">{{ selectedSale.user?.username }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Nama Pembeli</p>
              <p class="font-semibold text-gray-900 capitalize">{{ selectedSale.buyerName || "-" }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Catatan</p>
              <p class="font-semibold text-gray-900">{{ selectedSale.note || "-" }}</p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Status</p>
              <span :class="`px-2 py-1 rounded-full text-[10px] font-bold ${selectedSale.status === 'CANCELED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`">
                {{ selectedSale.status || "COMPLETED" }}
              </span>
            </div>
            <div>
              <p class="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Total</p>
              <p class="font-bold text-primary text-lg">Rp {{ Number(selectedSale.totalAmount).toLocaleString('id-ID') }}</p>
            </div>
          </div>

          <!-- Items List -->
          <div>
            <h4 class="font-semibold text-gray-900 mb-3 border-b pb-2">Daftar Item</h4>
            <div class="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              <div v-for="item in selectedSale.saleDetails" :key="item.id" class="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                <div class="flex flex-col">
                  <span class="font-semibold text-gray-900">{{ item.productName || item.product?.name || "Item Manual" }}</span>
                  <span class="text-sm text-muted-foreground font-mono">{{ item.product?.sku || "MANUAL" }}</span>
                </div>
                <div class="flex items-center gap-6">
                  <div class="text-right">
                    <span class="text-xs text-muted-foreground block">Harga</span>
                    <span class="font-medium">Rp {{ Number(item.price).toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="text-right w-12">
                    <span class="text-xs text-muted-foreground block">Qty</span>
                    <span class="font-medium">x{{ item.quantity }}</span>
                  </div>
                  <div class="text-right w-24">
                    <span class="text-xs text-muted-foreground block">Subtotal</span>
                    <span class="font-bold text-primary">Rp {{ Number(item.subtotal).toLocaleString('id-ID') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-between items-center pt-4 border-t mt-6">
            <Button variant="outline" @click="printReceipt" class="gap-2 border-gray-300">
              <FileText class="h-4 w-4" />
              Cetak Ulang Struk
            </Button>
            <Button v-if="selectedSale.status !== 'CANCELED' && !isCashier" variant="destructive" @click="handleCancelSale(selectedSale.id)">
              Batalkan Transaksi
            </Button>
          </div>
        </div>
        <div v-else class="text-center py-10 text-muted-foreground">Data tidak ditemukan.</div>
        </div>
        
        <ReceiptPrinter v-if="receiptProps && !isLoading" v-bind="receiptProps" />
      </DialogContent>
    </Dialog>

    <AlertModal 
      v-model:isOpen="isAlertOpen"
      :title="alertConfig.title"
      :description="alertConfig.description"
      :variant="alertConfig.variant"
      @confirm="alertConfig.onConfirm"
      :confirmText="alertConfig.onConfirm ? 'Ya, Proses' : 'OK'"
      cancelText="Batal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { Eye, FileText, Loader2, Calendar, X, Trash2, RotateCcw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useSales, useInvalidate } from '@/lib/queries'
import XLSX from 'xlsx-js-style'

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

const salesQuery = useSales<Sale>()
const sales = computed(() => salesQuery.data.value ?? [])
const isLoadingPage = salesQuery.isLoading
const invalidate = useInvalidate()

const isDetailOpen = ref(false)
const selectedSale = ref<any | null>(null)
const isLoading = ref(false)

const userRole = localStorage.getItem('role') || ''
const isAdmin = userRole === 'ADMIN'

// Single date filter: empty by default so all transaction history is shown
const selectedDate = ref('')

const formattedSelectedDate = computed(() => {
  if (!selectedDate.value) return ''
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
})

const isAlertOpen = ref(false)
const alertConfig = ref({
  title: '',
  description: '',
  variant: 'default' as 'default' | 'destructive' | 'success',
  confirmText: 'Ya, Proses',
  cancelText: 'Batal',
  showConfirm: true,
  isLoading: false,
  onConfirm: undefined as (() => void) | undefined
})

const actionLoadingId = ref<string | null>(null)
const actionLoadingType = ref<'cancel' | 'delete' | null>(null)

// Cancelling a sale restores stock, so refresh those caches too
const fetchData = () => invalidate('sales', 'products', 'stockMovements')

const filteredData = computed(() => {
  if (!selectedDate.value) return sales.value
  
  return sales.value.filter(sale => {
    if (!sale.createdAt) return false
    const saleDate = new Date(sale.createdAt)
    if (isNaN(saleDate.getTime())) return false
    const yyyy = saleDate.getFullYear()
    const mm = String(saleDate.getMonth() + 1).padStart(2, '0')
    const dd = String(saleDate.getDate()).padStart(2, '0')
    const saleDateStr = `${yyyy}-${mm}-${dd}`
    return saleDateStr === selectedDate.value
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
      price: Number(item.price),
      unit: item.product?.unit?.name || ''
    })),
    total: Number(selectedSale.value.totalAmount),
    paymentAmount: Number(selectedSale.value.totalAmount),
    changeAmount: 0
  }
})

const handleCancelSale = (saleOrId: any) => {
  const sale = typeof saleOrId === 'object' && saleOrId !== null
    ? saleOrId
    : (sales.value.find(s => s.id === saleOrId) || (selectedSale.value?.id === saleOrId ? selectedSale.value : { id: saleOrId }))
  const invoice = sale.invoiceNumber ? ` (${sale.invoiceNumber})` : ''

  alertConfig.value = {
    title: "Batalkan Transaksi",
    description: `Apakah Anda yakin ingin membatalkan transaksi${invoice}? Total penjualan akan dikurangi, status diubah ke CANCELED, dan stok barang akan dikembalikan ke inventaris.`,
    variant: "destructive",
    confirmText: "Ya, Batalkan",
    cancelText: "Batal",
    showConfirm: true,
    isLoading: false,
    onConfirm: async () => {
      alertConfig.value.isLoading = true
      actionLoadingId.value = sale.id
      actionLoadingType.value = 'cancel'
      try {
        await fetchApi(`/sales/${sale.id}/cancel`, { method: "PUT" })
        toast.success('Transaksi berhasil dibatalkan')
        fetchData()
        if (selectedSale.value && selectedSale.value.id === sale.id) {
          selectedSale.value.status = 'CANCELED'
        }
        // Tampilkan modal alert sukses
        alertConfig.value = {
          title: "Transaksi Berhasil Dibatalkan",
          description: `Transaksi${invoice} telah berhasil dibatalkan. Stok produk telah dikembalikan ke inventaris toko.`,
          variant: "success",
          confirmText: "OK",
          cancelText: "Tutup",
          showConfirm: false,
          isLoading: false,
          onConfirm: undefined
        }
        isAlertOpen.value = true
      } catch (error: any) {
        toast.error('Gagal membatalkan transaksi', { description: error.message })
        alertConfig.value = {
          title: "Gagal Membatalkan",
          description: error.message || "Terjadi kesalahan saat membatalkan transaksi.",
          variant: "destructive",
          confirmText: "OK",
          cancelText: "Tutup",
          showConfirm: false,
          isLoading: false,
          onConfirm: undefined
        }
        isAlertOpen.value = true
      } finally {
        actionLoadingId.value = null
        actionLoadingType.value = null
      }
    }
  }
  isAlertOpen.value = true
}

const handleDeleteSale = (saleOrId: any) => {
  const sale = typeof saleOrId === 'object' && saleOrId !== null
    ? saleOrId
    : (sales.value.find(s => s.id === saleOrId) || (selectedSale.value?.id === saleOrId ? selectedSale.value : { id: saleOrId }))
  const invoice = sale.invoiceNumber ? ` (${sale.invoiceNumber})` : ''

  alertConfig.value = {
    title: "Hapus Transaksi",
    description: `Apakah Anda yakin ingin menghapus permanen transaksi${invoice}? Transaksi akan dihapus permanen dari riwayat${sale.status !== 'CANCELED' ? ' dan stok barang akan dikembalikan' : ''}.`,
    variant: "destructive",
    confirmText: "Ya, Hapus Permanen",
    cancelText: "Batal",
    showConfirm: true,
    isLoading: false,
    onConfirm: async () => {
      alertConfig.value.isLoading = true
      actionLoadingId.value = sale.id
      actionLoadingType.value = 'delete'
      try {
        await fetchApi(`/sales/${sale.id}`, { method: "DELETE" })
        toast.success('Transaksi berhasil dihapus')
        fetchData()
        if (selectedSale.value && selectedSale.value.id === sale.id) {
          isDetailOpen.value = false
          selectedSale.value = null
        }
        // Tampilkan modal alert sukses
        alertConfig.value = {
          title: "Transaksi Berhasil Dihapus",
          description: `Transaksi${invoice} telah berhasil dihapus secara permanen dari sistem.`,
          variant: "success",
          confirmText: "OK",
          cancelText: "Tutup",
          showConfirm: false,
          isLoading: false,
          onConfirm: undefined
        }
        isAlertOpen.value = true
      } catch (error: any) {
        toast.error('Gagal menghapus transaksi', { description: error.message })
        alertConfig.value = {
          title: "Gagal Menghapus Transaksi",
          description: error.message || "Terjadi kesalahan saat menghapus transaksi.",
          variant: "destructive",
          confirmText: "OK",
          cancelText: "Tutup",
          showConfirm: false,
          isLoading: false,
          onConfirm: undefined
        }
        isAlertOpen.value = true
      } finally {
        actionLoadingId.value = null
        actionLoadingType.value = null
      }
    }
  }
  isAlertOpen.value = true
}

const isExportMonthOpen = ref(false)
const exportMonth = ref('')

const openExportDialog = () => {
  const today = new Date()
  exportMonth.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  isExportMonthOpen.value = true
}

const exportMonthlyToExcel = async () => {
  if (!exportMonth.value) return
  
  const [year, month] = exportMonth.value.split('-')
  
  const monthlyData = sales.value.filter(sale => {
    const d = new Date(sale.createdAt)
    return d.getFullYear() === parseInt(year) && (d.getMonth() + 1) === parseInt(month)
  })

  if (monthlyData.length === 0) {
    toast.error('Tidak ada data penjualan pada bulan tersebut')
    return
  }

  toast.info('Menyiapkan data laporan...')
  
  try {
    // Fetch detailed sales to get actual product names since findAll doesn't include them
    const fullSales = await Promise.all(
      monthlyData.map((s: any) => fetchApi(`/sales/${s.id}`))
    )

    const exportData = fullSales.map((sale: any, index: number) => {
      const itemsList = sale.saleDetails?.map((detail: any) => {
        const name = detail.product?.name || detail.productName || "Item Manual"
        const qtyFormatted = parseFloat(detail.quantity) || 0
        const unitStr = detail.product?.unit?.name ? ` ${detail.product.unit.name}` : ''
        return `${name} (x${qtyFormatted}${unitStr})`
      }).join(', ') || '-'

      return {
        'No.': index + 1,
        'No. Invoice': sale.invoiceNumber,
        'Tanggal Transaksi': new Date(sale.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        'Nama Pembeli': sale.buyerName || '-',
        'Kasir': sale.user?.username || '-',
        'Daftar Produk': itemsList,
        'Total Belanja': Number(sale.totalAmount),
        'Status': sale.status || 'COMPLETED'
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    
    // Apply Styling
    const borderAll = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    }

    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F46E5" } }, // Indigo
      alignment: { horizontal: "center", vertical: "center" },
      border: borderAll
    }

    const cellStyle = {
      border: borderAll,
      alignment: { vertical: "center" }
    }

    const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1:G1")
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        if (!worksheet[cellAddress]) continue
        
        if (R === 0) {
          worksheet[cellAddress].s = headerStyle
        } else {
          worksheet[cellAddress].s = cellStyle
        }
      }
    }

    // Adjust column widths
    worksheet['!cols'] = [
      { wch: 5 },  // No
      { wch: 18 }, // Invoice
      { wch: 25 }, // Tanggal
      { wch: 20 }, // Nama Pembeli
      { wch: 15 }, // Kasir
      { wch: 40 }, // Daftar Produk
      { wch: 18 }, // Total
      { wch: 15 }, // Status
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, `Penjualan`)
    
    const fileName = `Laporan_Penjualan_${exportMonth.value}.xlsx`
    XLSX.writeFile(workbook, fileName)
    isExportMonthOpen.value = false
  } catch (error) {
    toast.error('Gagal membuat laporan')
  }
}

const columns = computed(() => [
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
    id: "itemsList",
    header: "Daftar Produk",
    cell: ({ row }: any) => {
      const itemsList = row.original.saleDetails?.map((detail: any) => {
        const name = detail.product?.name || detail.productName || "Item Manual"
        const qtyFormatted = parseFloat(detail.quantity) || 0
        const unitStr = detail.product?.unit?.name ? ` ${detail.product.unit.name}` : ''
        return `${name} (x${qtyFormatted}${unitStr})`
      }).join(', ') || '-'
      return h('div', { class: 'text-gray-600 max-w-[250px] truncate', title: itemsList }, itemsList)
    },
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
      const sale = row.original
      const isRowLoading = actionLoadingId.value === sale.id
      const isCancelling = isRowLoading && actionLoadingType.value === 'cancel'
      const isDeleting = isRowLoading && actionLoadingType.value === 'delete'

      const buttons = [
        h(Button, {
          variant: "outline",
          size: "sm",
          disabled: isRowLoading,
          onClick: () => handleViewDetails(sale.id),
          class: "gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 h-8"
        }, () => [
          h(Eye, { class: 'h-3.5 w-3.5' }),
          "Detail"
        ])
      ]

      if (sale.status !== 'CANCELED') {
        buttons.push(
          h(Button, {
            variant: "outline",
            size: "sm",
            disabled: isRowLoading,
            onClick: () => handleCancelSale(sale),
            class: "gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 h-8",
            title: "Batalkan Transaksi"
          }, () => [
            isCancelling ? h(Loader2, { class: 'h-3.5 w-3.5 animate-spin' }) : h(RotateCcw, { class: 'h-3.5 w-3.5' }),
            isCancelling ? "Membatalkan..." : "Batal"
          ])
        )
      }

      if (isAdmin) {
        buttons.push(
          h(Button, {
            variant: "outline",
            size: "sm",
            disabled: isRowLoading,
            onClick: () => handleDeleteSale(sale),
            class: "gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-8",
            title: "Hapus Transaksi (Khusus Admin)"
          }, () => [
            isDeleting ? h(Loader2, { class: 'h-3.5 w-3.5 animate-spin' }) : h(Trash2, { class: 'h-3.5 w-3.5' }),
            isDeleting ? "Menghapus..." : "Hapus"
          ])
        )
      }

      return h('div', { class: 'flex items-center gap-1.5' }, buttons)
    },
  },
])
</script>

<template>
  <div class="flex flex-col w-full max-w-[1600px] mx-auto pb-10 print:h-auto print:block print:overflow-visible">
    <div class="print:hidden">
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div class="flex flex-col gap-1">
        <h2 class="text-3xl font-bold tracking-tight text-gray-900">Riwayat Penjualan</h2>
        <p class="text-muted-foreground text-sm">Lihat semua transaksi penjualan yang telah berhasil dilakukan.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-xl border shadow-sm w-full md:w-auto">
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <div class="flex items-center gap-1.5 text-xs font-medium text-gray-600 pl-1 shrink-0">
            <Calendar class="h-4 w-4 text-primary" />
            <span>Filter Tanggal:</span>
          </div>
          <Input 
            type="date" 
            v-model="selectedDate"
            class="h-9 border bg-gray-50 focus-visible:ring-1 w-full sm:w-44 text-sm"
          />
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button 
            v-if="selectedDate" 
            variant="ghost" 
            size="sm" 
            @click="selectedDate = ''" 
            class="text-muted-foreground hover:text-red-600 font-semibold text-xs h-9 gap-1 px-2.5"
            title="Reset ke semua riwayat transaksi"
          >
            <X class="h-3.5 w-3.5" />
            Reset (Semua)
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            @click="selectedDate = getTodayString()" 
            :class="['h-9 text-xs font-medium', selectedDate === getTodayString() ? 'bg-primary/10 text-primary border-primary/30' : '']"
          >
            Hari Ini
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            @click="openExportDialog" 
            class="h-9 text-xs font-medium bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
          >
            Export Excel
          </Button>
        </div>
      </div>
    </div>

    <!-- Active filter notification pill -->
    <div v-if="selectedDate" class="mb-4 flex items-center gap-2 text-xs">
      <span class="text-muted-foreground">Filter aktif:</span>
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        {{ formattedSelectedDate }} ({{ filteredData.length }} transaksi)
        <button type="button" @click="selectedDate = ''" class="hover:text-emerald-900 ml-1">
          <X class="h-3 w-3" />
        </button>
      </span>
    </div>

      <div v-if="isLoadingPage" class="flex justify-center p-10">
        <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
      <DataTable v-else :columns="columns" :data="filteredData" searchKey="invoiceNumber" />
    </div>

    <Dialog v-model:open="isDetailOpen">
      <DialogContent class="max-w-2xl max-h-[90vh] max-h-[90dvh] overflow-y-auto print:hidden">
        <div class="space-y-4">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-lg">
            <FileText class="h-5 w-5 text-primary" />
            Detail Transaksi
          </DialogTitle>
        </DialogHeader>
        
        <div v-if="isLoading" class="flex justify-center py-10">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <div v-else-if="selectedSale" class="space-y-4 mt-2">
          <!-- Header Info -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-gray-50 p-3 rounded-xl border text-xs">
            <div>
              <p class="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">No. Invoice</p>
              <p class="font-bold font-mono text-gray-900 truncate">{{ selectedSale.invoiceNumber }}</p>
            </div>
            <div>
              <p class="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Tanggal</p>
              <p class="font-semibold text-gray-900 truncate">
                {{ new Date(selectedSale.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
              </p>
            </div>
            <div>
              <p class="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Kasir</p>
              <p class="font-semibold text-gray-900 capitalize truncate">{{ selectedSale.user?.username }}</p>
            </div>
            <div>
              <p class="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Nama Pembeli</p>
              <p class="font-semibold text-gray-900 capitalize truncate">{{ selectedSale.buyerName || "-" }}</p>
            </div>
            <div>
              <p class="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Status</p>
              <span :class="`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${selectedSale.status === 'CANCELED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`">
                {{ selectedSale.status || "COMPLETED" }}
              </span>
            </div>
            <div>
              <p class="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Total</p>
              <p class="font-bold text-primary text-base">Rp {{ Number(selectedSale.totalAmount).toLocaleString('id-ID') }}</p>
            </div>
            <div v-if="selectedSale.note" class="col-span-2 sm:col-span-3 pt-1 border-t border-gray-200/60">
              <span class="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Catatan: </span>
              <span class="font-medium text-gray-800">{{ selectedSale.note }}</span>
            </div>
          </div>

          <!-- Items List -->
          <div>
            <div class="flex items-center justify-between mb-2 border-b pb-1.5">
              <h4 class="font-semibold text-gray-900 text-sm">Daftar Item</h4>
              <span class="text-xs text-muted-foreground font-medium">{{ selectedSale.saleDetails?.length || 0 }} item</span>
            </div>
            <div class="space-y-2 max-h-[170px] overflow-y-auto pr-1.5">
              <div v-for="item in selectedSale.saleDetails" :key="item.id" class="flex items-center justify-between p-2.5 border rounded-lg bg-white shadow-sm text-sm">
                <div class="flex flex-col min-w-0 pr-2">
                  <span class="font-semibold text-gray-900 text-xs sm:text-sm truncate">{{ item.productName || item.product?.name || "Item Manual" }}</span>
                  <span class="text-[11px] text-muted-foreground font-mono">{{ item.product?.sku || "MANUAL" }}</span>
                </div>
                <div class="flex items-center gap-3 sm:gap-6 shrink-0 text-xs sm:text-sm">
                  <div class="text-right">
                    <span class="text-[10px] text-muted-foreground block">Harga</span>
                    <span class="font-medium">Rp {{ Number(item.price).toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="text-right min-w-[45px] sm:w-16">
                    <span class="text-[10px] text-muted-foreground block">Qty</span>
                    <span class="font-medium">x{{ item.quantity }} {{ item.product?.unit?.name || '' }}</span>
                  </div>
                  <div class="text-right min-w-[70px] sm:w-24">
                    <span class="text-[10px] text-muted-foreground block">Subtotal</span>
                    <span class="font-bold text-primary">Rp {{ Number(item.subtotal).toLocaleString('id-ID') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap justify-between items-center gap-2 pt-3 border-t mt-4">
            <Button variant="outline" @click="printReceipt" class="gap-2 border-gray-300 h-9 text-xs">
              <FileText class="h-4 w-4" />
              Cetak Ulang Struk
            </Button>
            <div class="flex items-center gap-2">
              <Button 
                v-if="selectedSale.status !== 'CANCELED'" 
                variant="outline" 
                class="text-orange-600 border-orange-200 hover:bg-orange-50 h-9 text-xs gap-1.5" 
                :disabled="actionLoadingId === selectedSale.id"
                @click="handleCancelSale(selectedSale)"
              >
                <Loader2 v-if="actionLoadingId === selectedSale.id && actionLoadingType === 'cancel'" class="h-3.5 w-3.5 animate-spin" />
                <RotateCcw v-else class="h-3.5 w-3.5" />
                {{ actionLoadingId === selectedSale.id && actionLoadingType === 'cancel' ? 'Membatalkan...' : 'Batalkan Transaksi' }}
              </Button>
              <Button 
                v-if="isAdmin" 
                variant="destructive" 
                class="gap-1.5 h-9 text-xs" 
                :disabled="actionLoadingId === selectedSale.id"
                @click="handleDeleteSale(selectedSale)"
              >
                <Loader2 v-if="actionLoadingId === selectedSale.id && actionLoadingType === 'delete'" class="h-3.5 w-3.5 animate-spin" />
                <Trash2 v-else class="h-3.5 w-3.5" />
                {{ actionLoadingId === selectedSale.id && actionLoadingType === 'delete' ? 'Menghapus...' : 'Hapus Transaksi' }}
              </Button>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-10 text-muted-foreground">Data tidak ditemukan.</div>
        </div>
      </DialogContent>
    </Dialog>

    <AlertModal 
      v-model:isOpen="isAlertOpen"
      :title="alertConfig.title"
      :description="alertConfig.description"
      :variant="alertConfig.variant"
      :confirmText="alertConfig.confirmText"
      :cancelText="alertConfig.cancelText"
      :showConfirm="alertConfig.showConfirm"
      :isLoading="alertConfig.isLoading"
      @confirm="alertConfig.onConfirm ? alertConfig.onConfirm() : undefined"
    />

    <Dialog v-model:open="isExportMonthOpen">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle>Export Laporan Bulanan</DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="export-month">Pilih Bulan & Tahun</Label>
            <Input id="export-month" type="month" v-model="exportMonth" class="w-full" />
          </div>
          <Button @click="exportMonthlyToExcel" class="w-full bg-green-600 hover:bg-green-700 text-white" :disabled="!exportMonth">
            <FileText class="mr-2 h-4 w-4" />
            Download Excel
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Receipt printer placed in document root outside any modal dialog for clean continuous printing -->
    <ReceiptPrinter v-if="receiptProps && !isLoading" v-bind="receiptProps" />
  </div>
</template>

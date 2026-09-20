<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Minus, Trash2, ShoppingCart, CheckCircle2, Search, Printer } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'vue-sonner'
import AlertModal from '@/components/ui/AlertModal.vue'
import ReceiptPrinter from '@/components/ReceiptPrinter.vue'
import { fetchApi } from '@/lib/api'

type Product = {
  id: string
  name: string
  price: string | number
  stock: number
  sku: string
  category?: any
}

type User = {
  id: string
  username: string
}

type CartItem = {
  product: Product
  quantity: number | string
}

const products = ref<Product[]>([])
const users = ref<User[]>([])
const cart = ref<CartItem[]>([])

const isLoadingPage = ref(true)
const isLoading = ref(false)
const success = ref(false)
const completedTransaction = ref<any>(null)

const selectedUserId = ref<string>('')
const buyerName = ref('')
const note = ref('')
const searchQuery = ref('')
const paymentAmount = ref<number | ''>('')

const isCustomModalOpen = ref(false)
const customName = ref('')
const customPrice = ref('')
const customQuantity = ref('1')

const isAlertOpen = ref(false)
const alertConfig = ref({
  title: '',
  description: '',
  variant: 'default' as 'default' | 'destructive',
  isConfirmAction: false,
})

const fetchData = async () => {
  isLoadingPage.value = true
  try {
    const [productsRes, usersRes] = await Promise.all([
      fetchApi('/products'),
      fetchApi('/users').catch(() => [])
    ])
    products.value = productsRes || []
    
    let fetchedUsers = usersRes || []
    if (fetchedUsers.length === 0) {
      const currentUserId = localStorage.getItem('userId')
      const currentUsername = localStorage.getItem('username') || 'Kasir'
      if (currentUserId) {
        fetchedUsers = [{ id: currentUserId, username: currentUsername }]
      }
    }
    users.value = fetchedUsers

    if (users.value.length > 0) {
      const currentUserId = localStorage.getItem('userId')
      if (currentUserId && users.value.some(u => String(u.id) === String(currentUserId))) {
        selectedUserId.value = currentUserId
      } else {
        selectedUserId.value = String(users.value[0].id)
      }
    }
  } catch (error: any) {
    toast.error('Gagal mengambil data', { description: error.message })
  } finally {
    isLoadingPage.value = false
  }
}

onMounted(() => {
  fetchData()
})

const filteredProducts = computed(() => {
  return products.value.filter(p => 
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const subtotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + (Number(item.product.price) * Number(item.quantity)), 0)
})

const changeAmount = computed(() => {
  if (paymentAmount.value === '' || paymentAmount.value < subtotal.value) return 0
  return paymentAmount.value - subtotal.value
})

const handleCloseSuccess = () => {
  success.value = false
  completedTransaction.value = null
  cart.value = []
  buyerName.value = ''
  note.value = ''
  paymentAmount.value = ''
  fetchData()
}

const showAlert = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
  alertConfig.value = { title, description, variant, isConfirmAction: false }
  isAlertOpen.value = true
}

const addToCart = (product: Product) => {
  if (product.stock <= 0) {
    showAlert('Peringatan', 'Stok produk habis!', 'destructive')
    return
  }

  const existing = cart.value.find(item => item.product.id === product.id)
  if (existing) {
    if (Number(existing.quantity) >= product.stock) {
      showAlert('Peringatan', 'Jumlah melebihi stok yang tersedia!', 'destructive')
      return
    }
    existing.quantity = Number(existing.quantity) + 1
  } else {
    cart.value.push({ product, quantity: 1 })
  }
}

const addCustomToCart = () => {
  if (!customName.value || !customPrice.value || !customQuantity.value) return

  const newProduct: Product = {
    id: `custom-${Date.now()}`,
    name: customName.value,
    price: Number(customPrice.value),
    stock: 0,
    sku: "MANUAL",
  }

  cart.value.push({ product: newProduct, quantity: Number(customQuantity.value) })
  isCustomModalOpen.value = false
  customName.value = ''
  customPrice.value = ''
  customQuantity.value = '1'
}

const updateQuantity = (productId: string, delta: number) => {
  const item = cart.value.find(i => i.product.id === productId)
  if (item) {
    const currentQty = typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity
    let newQty = Math.max(0.01, currentQty + delta)
    if (newQty > item.product.stock && !item.product.id.startsWith('custom-')) {
      showAlert('Peringatan', 'Jumlah melebihi stok yang tersedia!', 'destructive')
      newQty = item.product.stock
    }
    item.quantity = newQty
  }
}

const setQuantityDirect = (productId: string, value: string) => {
  const item = cart.value.find(i => i.product.id === productId)
  if (item) {
    let newQty = parseFloat(value) || 0
    if (newQty > item.product.stock && !item.product.id.startsWith('custom-')) {
      showAlert('Peringatan', 'Jumlah melebihi stok yang tersedia!', 'destructive')
      newQty = item.product.stock
    }
    item.quantity = newQty || value
  }
}

const removeFromCart = (productId: string) => {
  cart.value = cart.value.filter(item => item.product.id !== productId)
}

const initiateCheckout = () => {
  if (cart.value.length === 0) return
  if (!selectedUserId.value) {
    showAlert('Perhatian', 'Pilih kasir terlebih dahulu!', 'destructive')
    return
  }
  
  alertConfig.value = {
    title: 'Konfirmasi Transaksi',
    description: 'Apakah Anda yakin ingin memproses transaksi ini?',
    variant: 'default',
    isConfirmAction: true
  }
  isAlertOpen.value = true
}

const executeCheckout = async () => {
  isAlertOpen.value = false
  isLoading.value = true
  
  const payload = {
    userId: selectedUserId.value,
    buyerName: buyerName.value || undefined,
    note: note.value || undefined,
    items: cart.value.map(item => {
      if (item.product.id.startsWith('custom-')) {
        return {
          productName: item.product.name,
          price: Number(item.product.price),
          quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity
        }
      }
      return {
        productId: item.product.id,
        quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity
      }
    })
  }

  try {
    const res = await fetchApi('/sales', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    
    const cashierName = users.value.find(u => u.id === selectedUserId.value)?.username || "Kasir"
    completedTransaction.value = {
      invoiceNumber: res?.invoiceNumber || `INV-${Date.now()}`,
      date: res?.createdAt || new Date().toISOString(),
      cashierName,
      buyerName: buyerName.value,
      items: cart.value.map(item => ({
        name: item.product.name,
        qty: typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity,
        price: Number(item.product.price)
      })),
      total: subtotal.value,
      paymentAmount: paymentAmount.value || 0,
      changeAmount: changeAmount.value
    }
    success.value = true
  } catch (error: any) {
    showAlert('Gagal', 'Gagal melakukan transaksi: ' + error.message, 'destructive')
  } finally {
    isLoading.value = false
  }
}

const printReceipt = () => {
  window.print()
}
</script>

<template>
  <div class="flex flex-col w-full h-[calc(100vh-8rem)] print:h-auto print:block">
    <div class="flex flex-col gap-1 mb-4 print:hidden">
      <h2 class="text-3xl font-bold tracking-tight text-gray-900">Penjualan (Kasir)</h2>
      <p class="text-muted-foreground text-sm">Pilih produk dan catat transaksi dengan mudah.</p>
    </div>

    <div v-if="isLoadingPage" class="flex justify-center p-10 h-full items-center">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </div>
    
    <div v-else class="flex-1 min-h-0 print:block">
      <div class="flex flex-col md:flex-row gap-6 pb-6 h-auto md:h-[calc(100vh-140px)] print:hidden">
        <!-- Left: Product Grid -->
        <div class="w-full md:w-2/3 flex flex-col h-[65vh] md:h-full bg-white/50 backdrop-blur-xl border rounded-2xl shadow-sm overflow-hidden">
          <div class="p-4 border-b bg-white/80 sticky top-0 z-10 backdrop-blur-md flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-lg">Daftar Produk</h3>
              <Button variant="outline" size="sm" @click="isCustomModalOpen = true" class="gap-2">
                <Plus class="h-4 w-4" /> Tambah Manual
              </Button>
            </div>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari nama produk atau SKU..." 
                v-model="searchQuery"
                class="pl-9 bg-white"
              />
            </div>
          </div>
          <div class="p-4 overflow-y-auto grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 content-start">
            <div 
              v-for="product in filteredProducts" 
              :key="product.id" 
              @click="addToCart(product)"
              class="group relative flex flex-col p-4 border border-gray-100 rounded-2xl cursor-pointer transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 bg-white overflow-hidden min-h-[140px]"
            >
              <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div class="flex justify-between items-start mb-2">
                <span class="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500 ring-1 ring-inset ring-gray-500/10 font-mono">
                  {{ product.sku }}
                </span>
                <span :class="['inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset', 
                  product.stock > 10 ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                  product.stock > 0 ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' : 
                  'bg-red-50 text-red-700 ring-red-600/10']">
                  {{ product.stock > 0 ? `Stok: ${product.stock}` : 'Habis' }}
                </span>
              </div>
              <h4 class="font-semibold text-gray-900 text-sm mb-3 line-clamp-2 leading-tight flex-1">
                {{ product.name }}
              </h4>
              <div class="mt-auto flex items-center justify-between pt-2 border-t border-gray-50">
                <div class="flex flex-col">
                  <span class="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Harga</span>
                  <span class="text-primary font-bold">
                    Rp {{ Number(product.price).toLocaleString('id-ID') }}
                  </span>
                </div>
                <div class="bg-primary/5 p-2 rounded-full text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                  <Plus class="h-4 w-4" />
                </div>
              </div>
            </div>
            <div v-if="filteredProducts.length === 0" class="col-span-full flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Search class="h-8 w-8 mb-2 opacity-50" />
              <span>Tidak ada produk yang sesuai.</span>
            </div>
          </div>
        </div>

        <!-- Right: Cart -->
        <div class="w-full md:w-1/3 flex flex-col h-auto md:h-full bg-white/80 backdrop-blur-xl border rounded-2xl shadow-lg overflow-hidden relative">
          <div class="p-5 border-b bg-gradient-to-r from-gray-50 to-white">
            <h3 class="font-bold text-xl flex items-center gap-2">
              <ShoppingCart class="h-5 w-5 text-primary" />
              Keranjang
            </h3>
          </div>

          <div class="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            <div v-if="cart.length === 0" class="flex flex-col items-center justify-center h-full text-muted-foreground opacity-70">
              <ShoppingCart class="h-12 w-12 mb-3 text-gray-300" />
              <p>Keranjang masih kosong</p>
            </div>
            
            <div v-for="item in cart" :key="item.product.id" class="flex flex-col gap-2 p-3 border rounded-xl bg-white shadow-sm">
              <div class="flex justify-between items-start">
                <div class="font-semibold text-sm pr-2 leading-tight">{{ item.product.name }}</div>
                <button @click="removeFromCart(item.product.id)" class="text-red-400 hover:text-red-600 p-1">
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
              <div class="flex items-center justify-between mt-1">
                <div class="text-primary font-medium text-sm">
                  Rp {{ (Number(item.product.price) * (typeof item.quantity === 'string' ? parseFloat(item.quantity) || 0 : item.quantity)).toLocaleString('id-ID') }}
                </div>
                <Input 
                  v-if="item.product.category?.name?.toLowerCase().includes('mesh')"
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  v-model="item.quantity"
                  @change="setQuantityDirect(item.product.id, ($event.target as HTMLInputElement).value)"
                  class="w-24 h-8 text-center px-2 py-1 text-sm bg-gray-50 border-gray-200"
                />
                <div v-else class="flex items-center gap-2 bg-gray-50 border rounded-lg p-1">
                  <button 
                    @click="updateQuantity(item.product.id, -1)"
                    :disabled="Number(item.quantity) <= 1"
                    class="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                  >
                    <Minus class="h-3 w-3" />
                  </button>
                  <span class="text-sm font-medium w-6 text-center">{{ item.quantity }}</span>
                  <button 
                    @click="updateQuantity(item.product.id, 1)"
                    class="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                  >
                    <Plus class="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Cart Footer -->
          <div class="p-5 bg-gray-50 border-t flex flex-col gap-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1">
                <label class="text-xs font-medium text-gray-500 uppercase tracking-wider">Pembeli</label>
                <Input 
                  placeholder="Misal: Budi"
                  v-model="buyerName"
                  class="bg-white"
                />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-medium text-gray-500 uppercase tracking-wider">Catatan</label>
                <Input 
                  placeholder="Misal: Utang"
                  v-model="note"
                  class="bg-white"
                />
              </div>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-gray-500 uppercase tracking-wider">Kasir</label>
              <select 
                v-model="selectedUserId"
                class="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-lg hover:border-primary focus:ring-primary focus:border-primary flex items-center justify-between p-2.5 shadow-sm transition-colors"
              >
                <option value="" disabled>Pilih Kasir</option>
                <option v-for="u in users" :key="u.id" :value="u.id">{{ u.username }}</option>
              </select>
            </div>

            <div class="flex items-center justify-between py-2 border-b border-gray-100">
              <span class="text-gray-600 font-medium">Total Tagihan</span>
              <span class="text-xl font-bold text-gray-900">Rp {{ subtotal.toLocaleString('id-ID') }}</span>
            </div>

            <div class="flex items-center justify-between py-2 border-b border-gray-100">
              <span class="text-gray-600 font-medium">Jumlah Bayar</span>
              <div class="relative w-[140px]">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">Rp</span>
                <Input 
                  type="number"
                  v-model="paymentAmount"
                  class="pl-8 text-right font-semibold bg-white border-primary/20 focus-visible:ring-primary/30 h-9"
                  placeholder="0"
                />
              </div>
            </div>

            <div class="flex items-center justify-between py-2">
              <span class="text-gray-600 font-medium">Kembalian</span>
              <span class="text-xl font-bold" :class="paymentAmount !== '' && paymentAmount >= subtotal ? 'text-green-600' : 'text-gray-400'">
                Rp {{ changeAmount.toLocaleString('id-ID') }}
              </span>
            </div>

            <Button 
              @click="initiateCheckout" 
              :disabled="cart.length === 0 || isLoading"
              class="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl shadow-md transition-all duration-200"
            >
              <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
              {{ isLoading ? "Memproses..." : "Simpan Transaksi" }}
            </Button>
          </div>

          <!-- Success Overlay -->
          <div v-if="success" class="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
            <CheckCircle2 class="h-16 w-16 text-green-500 mb-4" />
            <h3 class="text-2xl font-bold text-gray-900 mb-2">Transaksi Berhasil!</h3>
            <p class="text-gray-500 mb-6">Data penjualan telah disimpan ke dalam sistem.</p>
            
            <div class="flex gap-4 w-full max-w-xs">
              <Button 
                @click="printReceipt"
                class="flex-1 gap-2"
              >
                <Printer class="h-4 w-4" />
                Cetak Struk
              </Button>
              <Button 
                variant="outline" 
                @click="handleCloseSuccess"
                class="flex-1"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>

        <Dialog v-model:open="isCustomModalOpen">
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Item Manual</DialogTitle>
            </DialogHeader>
            <div class="space-y-4 py-4">
              <div class="space-y-2">
                <Label>Nama Produk / Item</Label>
                <Input 
                  v-model="customName" 
                  placeholder="Misal: Biaya Layanan" 
                />
              </div>
              <div class="space-y-2">
                <Label>Harga (Rp)</Label>
                <Input 
                  type="number" 
                  v-model="customPrice" 
                  placeholder="0" 
                />
              </div>
              <div class="space-y-2">
                <Label>Jumlah</Label>
                <Input 
                  type="number" 
                  min="1"
                  v-model="customQuantity" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" @click="isCustomModalOpen = false">Batal</Button>
              <Button @click="addCustomToCart" :disabled="!customName || !customPrice || !customQuantity">Tambah ke Keranjang</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertModal 
          v-model:isOpen="isAlertOpen"
          :title="alertConfig.title"
          :description="alertConfig.description"
          :variant="alertConfig.variant"
          @confirm="alertConfig.isConfirmAction ? executeCheckout() : undefined"
          :confirmText="alertConfig.isConfirmAction ? 'Ya, Proses' : 'OK'"
          cancelText="Batal"
        />
      </div>

      <ReceiptPrinter v-if="completedTransaction" v-bind="completedTransaction" />
    </div>
  </div>
</template>

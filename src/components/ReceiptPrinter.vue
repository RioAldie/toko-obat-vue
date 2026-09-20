<script setup lang="ts">
export type ReceiptItem = {
  name: string
  qty: number
  price: number
}

const props = defineProps<{
  invoiceNumber: string
  date: string | Date
  cashierName: string
  buyerName?: string
  items: ReceiptItem[]
  total: number
  paymentAmount?: number
  changeAmount?: number
}>()

const formattedDate = new Date(props.date).toLocaleString('id-ID', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
</script>

<template>
  <div class="hidden print:block text-black bg-white font-mono text-xs w-full max-w-[80mm] mx-auto pb-4">
    <div class="text-center mb-4 border-b border-black pb-2 border-dashed">
      <h2 class="font-bold text-base mb-1">Berkah Rezeki Tani</h2>
      <p>Punden Banaran Ke-Barat 200 meter</p>
      <p>RT/RW 05/02, Dusun Banaran, Desa Banaran Kulon</p>
      <p>Telp: +6281331055566</p>
    </div>

    <div class="mb-3 space-y-0.5">
      <div class="flex justify-between">
        <span>No:</span>
        <span class="font-semibold">{{ invoiceNumber }}</span>
      </div>
      <div class="flex justify-between">
        <span>Tgl:</span>
        <span>{{ formattedDate }}</span>
      </div>
      <div class="flex justify-between">
        <span>Kasir:</span>
        <span>{{ cashierName }}</span>
      </div>
      <div v-if="buyerName" class="flex justify-between">
        <span>Pembeli:</span>
        <span>{{ buyerName }}</span>
      </div>
    </div>

    <div class="border-t border-b border-black border-dashed py-2 mb-3 space-y-2">
      <div v-for="(item, index) in items" :key="index">
        <div class="font-semibold break-words">{{ item.name }}</div>
        <div class="flex justify-between">
          <span>{{ item.qty }} x {{ item.price.toLocaleString('id-ID') }}</span>
          <span>{{ (item.qty * item.price).toLocaleString('id-ID') }}</span>
        </div>
      </div>
    </div>

    <div class="flex justify-between font-bold text-sm mb-1">
      <span>TOTAL</span>
      <span>Rp {{ total.toLocaleString('id-ID') }}</span>
    </div>

    <div v-if="paymentAmount" class="flex justify-between text-sm mb-1">
      <span>Tunai</span>
      <span>Rp {{ paymentAmount.toLocaleString('id-ID') }}</span>
    </div>
    <div v-if="changeAmount !== undefined && paymentAmount" class="flex justify-between text-sm mb-4">
      <span>Kembali</span>
      <span>Rp {{ changeAmount.toLocaleString('id-ID') }}</span>
    </div>
    <div v-else class="mb-4"></div>

    <div class="text-center mt-6 text-[10px]">
      <p>Terima Kasih</p>
      <p>Barang yang dibeli tidak dapat ditukar</p>
    </div>
    
    <!-- Page break after receipt to ensure printer cuts correctly
    <div class="break-after-page"></div> -->
  </div>
</template>

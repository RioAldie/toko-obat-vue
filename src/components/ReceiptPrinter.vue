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
  <div class="receipt-print-wrapper hidden print:block text-black bg-white font-mono w-full max-w-[80mm] mx-auto text-xs">
    <!-- Store Header -->
    <div class="text-center mb-3 border-b-2 border-black pb-2 border-dashed flex flex-col items-center">
      <img 
        src="/brt-icon.png" 
        alt="Logo Berkah Rezeki Tani" 
        class="h-12 w-12 object-contain mx-auto mb-1.5 filter grayscale contrast-125"
      />
      <h2 class="font-bold text-lg leading-tight mb-1">Berkah Rezeki Tani</h2>
      <p class="text-xs leading-normal">Punden Banaran Ke-Barat 200m</p>
      <p class="text-xs leading-normal">RT/RW 05/02, Dusun Banaran</p>
      <p class="text-xs leading-normal">Desa Banaran Kulon</p>
      <p class="text-xs font-semibold leading-normal mt-0.5">Telp: 0813-3105-5566</p>
    </div>

    <!-- Metadata Info -->
    <div class="mb-3 space-y-1 text-xs">
      <div class="flex justify-between">
        <span class="text-gray-800 font-medium">No. Inv:</span>
        <span class="font-bold font-mono">{{ invoiceNumber }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-800 font-medium">Tanggal:</span>
        <span class="font-medium">{{ formattedDate }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-800 font-medium">Kasir:</span>
        <span class="font-medium capitalize">{{ cashierName }}</span>
      </div>
      <div v-if="buyerName" class="flex justify-between">
        <span class="text-gray-800 font-medium">Pembeli:</span>
        <span class="font-medium capitalize">{{ buyerName }}</span>
      </div>
    </div>

    <!-- Items List -->
    <div class="border-t-2 border-b-2 border-black border-dashed py-2 mb-3 space-y-2.5">
      <div v-for="(item, index) in items" :key="index" class="break-inside-avoid">
        <div class="font-bold text-sm text-black break-words leading-tight">
          {{ item.name }}
        </div>
        <div class="flex justify-between items-center text-xs mt-0.5 font-medium">
          <span>{{ item.qty }} x Rp {{ Number(item.price).toLocaleString('id-ID') }}</span>
          <span class="font-bold text-sm">Rp {{ (item.qty * item.price).toLocaleString('id-ID') }}</span>
        </div>
      </div>
    </div>

    <!-- Totals & Payment -->
    <div class="space-y-1.5 pt-1">
      <div class="flex justify-between items-center font-extrabold text-base border-b border-black/30 pb-1.5">
        <span>TOTAL</span>
        <span class="text-lg">Rp {{ Number(total).toLocaleString('id-ID') }}</span>
      </div>

      <div v-if="paymentAmount" class="flex justify-between items-center text-xs font-semibold pt-1">
        <span>Tunai / Bayar</span>
        <span class="text-sm">Rp {{ Number(paymentAmount).toLocaleString('id-ID') }}</span>
      </div>
      <div v-if="changeAmount !== undefined && paymentAmount" class="flex justify-between items-center text-xs font-semibold">
        <span>Kembalian</span>
        <span class="text-sm">Rp {{ Number(changeAmount).toLocaleString('id-ID') }}</span>
      </div>
    </div>

    <!-- Footer Greetings -->
    <div class="text-center mt-5 pt-2 border-t border-dashed border-black/30 text-xs space-y-1">
      <p class="font-bold">*** TERIMA KASIH ***</p>
      <p class="text-[11px] text-gray-800">Barang yang sudah dibeli</p>
      <p class="text-[11px] text-gray-800">tidak dapat ditukar/dikembalikan</p>
    </div>
    
    <!-- Generous Feed / Space Margin for Thermal Cutter -->
    <!-- Prevents physical printer blade from cutting through invoice text -->
    <div class="h-24 print:h-32 w-full" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
@media print {
  @page {
    margin: 0;
    size: auto;
  }
  .receipt-print-wrapper {
    display: block !important;
    width: 100% !important;
    max-width: 80mm !important;
    margin: 0 auto !important;
    padding-top: 4mm !important;
    padding-left: 2mm !important;
    padding-right: 2mm !important;
    padding-bottom: 25mm !important;
    background: white !important;
    color: black !important;
  }
}
</style>

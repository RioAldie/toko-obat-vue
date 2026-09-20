<script setup lang="ts" generic="TData, TValue">
import type { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/vue-table'
import {
  FlexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { ref } from 'vue'
import { Search } from 'lucide-vue-next'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
}>()

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])

const table = useVueTable({
  get data() { return props.data },
  get columns() { return props.columns },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
  },
  onSortingChange: updaterOrValue => {
    sorting.value =
      typeof updaterOrValue === 'function'
        ? updaterOrValue(sorting.value)
        : updaterOrValue
  },
  onColumnFiltersChange: updaterOrValue => {
    columnFilters.value =
      typeof updaterOrValue === 'function'
        ? updaterOrValue(columnFilters.value)
        : updaterOrValue
  },
})
</script>

<template>
  <div>
    <div v-if="searchKey" class="flex items-center pb-4">
      <div class="relative w-full max-w-sm">
        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
          <Search class="h-4 w-4" />
        </div>
        <input
          :placeholder="`Cari ${searchKey}...`"
          :value="(table.getColumn(searchKey as string)?.getFilterValue() as string) ?? ''"
          @input="event => table.getColumn(searchKey as string)?.setFilterValue((event.target as HTMLInputElement).value)"
          class="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </div>
    
    <div class="rounded-xl border bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader class="bg-gray-50/50">
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id" class="border-b-gray-100">
            <TableHead v-for="header in headerGroup.headers" :key="header.id" class="text-xs font-semibold text-gray-500 uppercase tracking-wider py-4">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() ? 'selected' : undefined"
              class="hover:bg-green-50/30 border-b-gray-100"
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" class="py-3">
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <TableRow>
              <TableCell :colspan="columns.length" class="h-24 text-center text-muted-foreground">
                Tidak ada data ditemukan.
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>
    
    <!-- Pagination Controls -->
    <div class="flex items-center justify-between space-x-2 py-4">
      <div class="text-sm text-muted-foreground">
        Halaman {{ table.getState().pagination.pageIndex + 1 }} dari {{ table.getPageCount() || 1 }}
      </div>
      <div class="space-x-2">
        <Button
          variant="outline"
          size="sm"
          @click="table.previousPage()"
          :disabled="!table.getCanPreviousPage()"
          class="border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          Sebelumnya
        </Button>
        <Button
          variant="outline"
          size="sm"
          @click="table.nextPage()"
          :disabled="!table.getCanNextPage()"
          class="border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          Selanjutnya
        </Button>
      </div>
    </div>
  </div>
</template>

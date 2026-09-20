<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { Plus, Trash2, Loader2, Edit } from 'lucide-vue-next'
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

type User = {
  id: string
  username: string
  role: string
  isActive: boolean
}

const users = ref<User[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)

const isOpen = ref(false)
const isAlertOpen = ref(false)
const userToDelete = ref<string | null>(null)

const form = ref({
  username: '',
  password: '',
  role: 'CASHIER',
  isActive: 'true'
})

const fetchData = async () => {
  isLoading.value = true
  try {
    const res = await fetchApi('/users')
    users.value = res || []
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
  if (!form.value.username || !form.value.password || !form.value.role) return
  isSubmitting.value = true
  try {
    const payload = {
      ...form.value,
      isActive: form.value.isActive === 'true'
    }
    await fetchApi('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    toast.success('Pengguna berhasil ditambahkan!')
    isOpen.value = false
    form.value = { username: '', password: '', role: 'CASHIER', isActive: 'true' }
    fetchData()
  } catch (error: any) {
    toast.error('Gagal menambahkan pengguna', { description: error.message })
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (id: string) => {
  userToDelete.value = id
  isAlertOpen.value = true
}

const executeDelete = async () => {
  if (!userToDelete.value) return
  isAlertOpen.value = false
  try {
    await fetchApi(`/users/${userToDelete.value}`, {
      method: 'DELETE',
    })
    toast.success('Pengguna berhasil dihapus!')
    fetchData()
  } catch (error: any) {
    toast.error('Gagal menghapus pengguna', { description: error.message })
  } finally {
    userToDelete.value = null
  }
}

const columns = [
  {
    accessorKey: "username",
    header: "Username",
    cell: ({ row }: any) => h('div', { class: 'font-semibold text-gray-900' }, row.getValue("username")),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }: any) => h('div', { class: 'font-medium text-gray-700' }, row.getValue("role")),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }: any) => {
      const isActive = row.getValue("isActive")
      const bg = isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      const text = isActive ? 'Aktif' : 'Non-aktif'
      return h('span', { class: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${bg}` }, text)
    },
  },
  {
    id: "actions",
    cell: ({ row }: any) => {
      const id = row.original.id
      const role = row.original.role
      
      return h('div', { class: 'flex items-center gap-2' }, [
        h(Button, {
          variant: "ghost",
          size: "icon",
          class: "h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        }, () => h(Edit, { class: 'h-4 w-4' })),
        h(Button, {
          variant: "ghost",
          size: "icon",
          disabled: role === 'ADMIN',
          onClick: () => confirmDelete(id),
          class: "h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-red-600",
          title: role === 'ADMIN' ? "Admin tidak dapat dihapus" : "Hapus Pengguna"
        }, () => h(Trash2, { class: 'h-4 w-4' }))
      ])
    },
  },
]
</script>

<template>
  <div class="flex flex-col w-full max-w-[1600px] mx-auto pb-10">
    <div class="flex items-center justify-between mb-6">
      <div class="flex flex-col gap-1">
        <h2 class="text-3xl font-bold tracking-tight text-gray-900">Pengguna</h2>
        <p class="text-muted-foreground text-sm">Kelola akses staf dan peran di sistem.</p>
      </div>
      
      <Dialog v-model:open="isOpen">
        <DialogTrigger asChild>
          <Button class="bg-primary text-white hover:bg-primary/90 rounded-lg shadow-sm">
            <Plus class="mr-2 h-4 w-4" /> Tambah Pengguna
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
          </DialogHeader>
          <form @submit.prevent="onSubmit" class="space-y-6 mt-6">
            <div class="space-y-3">
              <Label for="username" class="text-sm font-semibold text-foreground/90">Username</Label>
              <Input id="username" v-model="form.username" required class="bg-muted/20 border-border/50 focus-visible:ring-primary/20 shadow-inner" />
            </div>
            <div class="space-y-3">
              <Label for="password" class="text-sm font-semibold text-foreground/90">Password</Label>
              <Input id="password" v-model="form.password" type="password" required class="bg-muted/20 border-border/50 focus-visible:ring-primary/20 shadow-inner" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-3">
                <Label for="role" class="text-sm font-semibold text-foreground/90">Role</Label>
                <select 
                  id="role" 
                  v-model="form.role"
                  required 
                  class="flex h-10 w-full items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm shadow-inner transition-all ring-offset-background placeholder:text-muted-foreground focus:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20"
                >
                  <option value="CASHIER">Kasir (Cashier)</option>
                  <option value="MANAGER">Manajer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div class="space-y-3">
                <Label for="isActive" class="text-sm font-semibold text-foreground/90">Status Aktif</Label>
                <select 
                  id="isActive" 
                  v-model="form.isActive"
                  required 
                  class="flex h-10 w-full items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm shadow-inner transition-all ring-offset-background placeholder:text-muted-foreground focus:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Non-aktif</option>
                </select>
              </div>
            </div>
            <div class="flex justify-end pt-4">
              <Button type="submit" :disabled="isSubmitting" class="w-full sm:w-auto bg-gradient-to-b from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-primary-foreground shadow-md transition-all rounded-xl h-10 px-8 font-medium">
                <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
                Simpan Pengguna
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>

    <div v-if="isLoading" class="flex justify-center p-10">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
    <DataTable v-else :columns="columns" :data="users" searchKey="username" />

    <AlertModal 
      v-model:isOpen="isAlertOpen"
      title="Konfirmasi Hapus"
      description="Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan."
      variant="destructive"
      confirmText="Ya, Hapus"
      @confirm="executeDelete"
    />
  </div>
</template>

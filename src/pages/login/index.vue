<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'

const username = ref('')
const password = ref('')
const errorMsg = ref('')
const isLoading = ref(false)
const router = useRouter()

const API_URL = import.meta.env.VITE_API_URL || 'https://toko-obat-server-five.vercel.app'

const handleLogin = async () => {
  if (!username.value || !password.value) return
  
  isLoading.value = true
  errorMsg.value = ''

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        username: username.value, 
        password: password.value 
      }),
    })

    if (res.ok) {
      const data = await res.json()
      localStorage.setItem("token", data.access_token)
      localStorage.setItem("role", data.user.role)
      localStorage.setItem("userId", data.user.id)
      localStorage.setItem("username", data.user.username)
      
      // Navigate to dashboard
      router.push("/")
    } else {
      errorMsg.value = "Invalid credentials"
    }
  } catch (err) {
    errorMsg.value = "An error occurred during login. Make sure the backend is running."
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen w-full items-center justify-center bg-zinc-50 p-4">
    <Card class="w-full max-w-md shadow-lg border-0 bg-white/70 backdrop-blur-xl">
      <CardHeader class="space-y-3 pb-6">
        <div class="flex justify-center mb-4">
          <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/5 p-2 shadow-sm border border-primary/10">
            <img src="/brt-icon.png" alt="Berkah Rezeki Tani" class="h-full w-full object-contain drop-shadow-sm" />
          </div>
        </div>
        <CardTitle class="text-3xl text-center font-bold tracking-tight">Berkah Rezeki Tani</CardTitle>
        <CardDescription class="text-center text-sm px-2">
          Punden Banaran Ke-Barat 200 meter, RT/RW 05/02, Dusun Banaran, Desa Banaran Kulon
        </CardDescription>
      </CardHeader>
      <form @submit.prevent="handleLogin">
        <CardContent class="space-y-5">
          <div class="space-y-2">
            <Label for="username" class="text-sm font-medium">Username</Label>
            <Input 
              id="username" 
              type="text" 
              placeholder="admin"
              required 
              v-model="username"
              class="h-11"
            />
          </div>
          <div class="space-y-2">
            <Label for="password" class="text-sm font-medium">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              required 
              v-model="password"
              class="h-11"
            />
          </div>
          <div v-if="errorMsg" class="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-100">
            {{ errorMsg }}
          </div>
        </CardContent>
        <CardFooter class="pt-2 pb-6">
          <Button type="submit" class="w-full h-11 text-base shadow-sm" :disabled="isLoading">
            {{ isLoading ? "Signing in..." : "Sign in" }}
          </Button>
        </CardFooter>
      </form>
    </Card>
  </div>
</template>

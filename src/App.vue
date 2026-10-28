<script setup>
import { computed, reactive, ref } from 'vue'
import './style.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.MODE === 'test' ? 'http://localhost:8080' : '')
const mode = ref('signup')
const isSignup = computed(() => mode.value === 'signup')
const loading = ref(false)
const message = ref('')
const error = ref(false)
const form = reactive({
  name: '',
  username: '',
  password: '',
})

function setMode(nextMode) {
  mode.value = nextMode
  message.value = ''
}

async function submitForm() {
  if (loading.value) return

  const requestMode = mode.value
  const payload = {
    username: form.username.trim(),
    password: form.password,
  }

  if (requestMode === 'signup') {
    payload.name = form.name.trim()
  }

  loading.value = true
  message.value = ''
  error.value = false

  try {
    const endpoint = requestMode === 'signup' ? '/users/signup' : '/users/login'
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const responseText = await response.text()
    let responseData = responseText

    if (responseText) {
      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = responseText
      }
    } else {
      responseData = null
    }

    if (!response.ok) {
      let serverMessage =
        typeof responseData === 'object' && responseData !== null
          ? responseData.message || responseData.error
          : responseData
      if (!serverMessage || typeof serverMessage !== 'string' || !serverMessage.trim()) {
        if (response.status === 401 || response.status === 403) {
          serverMessage = requestMode === 'login' ? 'Invalid username or password.' : 'Access denied.'
        } else if (response.status === 409) {
          serverMessage = 'Username already exists.'
        } else {
          serverMessage = `Request failed with status ${response.status}.`
        }
      }
      throw new Error(serverMessage)
    }

    message.value =
      typeof responseData === 'object' && responseData !== null && responseData.message
        ? responseData.message
        : typeof responseData === 'string' && responseData.trim()
          ? responseData
          : requestMode === 'signup'
          ? 'Account created successfully.'
          : 'Logged in successfully.'
  } catch (requestError) {
    error.value = true
    message.value =
      requestError instanceof Error
        ? requestError.message
        : 'Unable to connect to the server. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="page">
    <section class="card">
      <h1>{{ isSignup ? 'Create account' : 'Log in' }}</h1>
      <p class="intro">
        {{ isSignup ? 'Create an account to get started.' : 'Enter your account details.' }}
      </p>

      <div class="mode-switch">
        <button type="button" :class="{ active: isSignup }" @click="setMode('signup')">
          Sign up
        </button>
        <button type="button" :class="{ active: !isSignup }" @click="setMode('login')">
          Log in
        </button>
      </div>

      <form @submit.prevent="submitForm">
        <label v-if="isSignup">
          Name
          <input v-model="form.name" name="name" autocomplete="name" required />
        </label>

        <label>
          Username
          <input
            v-model="form.username"
            name="username"
            autocomplete="username"
            required
          />
        </label>

        <label>
          Password
          <input
            v-model="form.password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
          />
        </label>

        <button class="submit-button" type="submit" :disabled="loading">
          {{ loading ? 'Please wait...' : isSignup ? 'Create account' : 'Log in' }}
        </button>
      </form>

      <p v-if="message" class="message" :class="{ error }" role="status">{{ message }}</p>
    </section>
  </main>
</template>

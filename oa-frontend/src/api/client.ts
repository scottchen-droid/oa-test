import axios, { type AxiosInstance } from 'axios'
import { ElMessage } from 'element-plus'

const client: AxiosInstance = axios.create({
  baseURL: '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let pendingRequests: Array<(token: string) => void> = []

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh_token')

      if (!refreshToken) {
        redirectToLogin()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(client(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const resp = await axios.post('/api/auth/refresh', { refreshToken })
        const newToken = resp.data.data.accessToken
        localStorage.setItem('access_token', newToken)
        pendingRequests.forEach((cb) => cb(newToken))
        pendingRequests = []
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return client(originalRequest)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        redirectToLogin()
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    const message = error.response?.data?.message || error.message || 'An error occurred'
    if (error.response?.status !== 401) {
      ElMessage.error(message)
    }

    return Promise.reject(error)
  },
)

function redirectToLogin() {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

export default client

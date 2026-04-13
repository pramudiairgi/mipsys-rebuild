import axios from "axios"

const api = axios.create({
  baseURL: "http://192.168.0.113:3000/api/v1/auth/login", // Ganti dengan URL backend asli
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor: Otomatis tempelkan token di setiap request jika ada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
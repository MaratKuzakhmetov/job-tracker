export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  runtimeConfig: {
    upstashRedisRestUrl: '',
    upstashRedisRestToken: '',
    adminPassword: '',
    sessionSecret: '',
  },
})

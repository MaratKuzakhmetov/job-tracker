export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
      wrangler: { name: 'job-tracker' },
    },
  },
  runtimeConfig: {
    upstashRedisRestUrl: '',
    upstashRedisRestToken: '',
    adminPassword: '',
    sessionSecret: '',
    mcpToken: '',
  },
})

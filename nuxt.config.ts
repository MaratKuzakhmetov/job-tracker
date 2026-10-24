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
      wrangler: {
        name: 'job-tracker',
        routes: [{ pattern: 'job-tracker.markgp.com', custom_domain: true }],
        workers_dev: false,
        preview_urls: false,
        r2_buckets: [{ binding: 'CV', bucket_name: 'job-tracker-cv' }],
      },
    },
    // CV PDFs: Cloudflare R2 in production, plain files in .data/cv while developing
    storage: { cv: { driver: 'cloudflare-r2-binding', binding: 'CV' } },
    devStorage: { cv: { driver: 'fs', base: './.data/cv' } },
  },
  runtimeConfig: {
    upstashRedisRestUrl: '',
    upstashRedisRestToken: '',
    adminPassword: '',
    sessionSecret: '',
    mcpToken: '',
  },
})

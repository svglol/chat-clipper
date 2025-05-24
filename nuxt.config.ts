// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/test-utils/module',
    '@nuxt/devtools',
    '@nuxt/fonts',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@vue-macros/nuxt',
    '@nuxt/eslint',
    'nuxt-auth-utils',
  ],
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2025-05-20',
  eslint: {
    config: {
      standalone: false,
    },
  },
  devtools: { enabled: true },
  typescript: {
    typeCheck: true,
    strict: true,
  },
  ui: {
    theme: {
      colors: ['primary', 'secondary', 'tertiary', 'info', 'success', 'warning', 'error'],
    },
  },
  css: ['~/assets/css/main.css'],
  nitro: {
    storage: {
      data: {
        driver: 'cloudflare-kv-binding',
        binding: 'DATA',
      },
      cache: {
        driver: 'cloudflare-kv-binding',
        binding: 'CACHE',
      },
    },
    devStorage: {
      data: {
        driver: 'fs',
        base: './.data/',
      },
      cache: {
        driver: 'fs',
        base: './.cache/',
      },
    },
  },
  runtimeConfig: {
    public: {
      baseUrl: 'http://localhost:3000',
    },
  },

  colorMode: {
    preference: 'dark',
    fallback: 'dark',
    classSuffix: '',
  },
  app: {
    head: {
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/favicon.svg',
        },
      ],
    },
  },
})

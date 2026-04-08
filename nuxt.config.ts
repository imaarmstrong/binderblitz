// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', 'nuxt-svgo', '@vite-pwa/nuxt'],
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },
  runtimeConfig: {
    // These should be set via environment variables in .env
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    resendApiKey: process.env.RESEND_API_KEY,
    resendFromEmail: process.env.RESEND_FROM_EMAIL,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripePriceId: process.env.STRIPE_PRICE_ID,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripeSuccessUrl: process.env.STRIPE_SUCCESS_URL,
    stripeCancelUrl: process.env.STRIPE_CANCEL_URL,
    stripePortalReturnUrl: process.env.STRIPE_PORTAL_RETURN_URL,
  },
  vite:{
    optimizeDeps: {
      include: [
        '@tcgdex/sdk',
      ]
    }
  },
  app: {
    head: {
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
      meta: [
        { name: 'theme-color', content: '#020617' },
      ],
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    devOptions: {
      enabled: true,
      type: 'module',
    },
    manifest: {
      name: 'BinderBlitz',
      short_name: 'BinderBlitz',
      description: 'BinderBlitz – manage and explore your card binders',
      theme_color: '#020617',
      background_color: '#020617',
      display: 'standalone',
      start_url: '/',
      icons: [
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
    },
    client: {
      installPrompt: true,
    },
  },
})
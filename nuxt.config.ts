export default defineNuxtConfig({
  css: ["~/assets/main.css"],
  modules: ["@pinia/nuxt"],
  runtimeConfig: {
    wcBase: process.env.WC_BASE || process.env.NUXT_PUBLIC_API_BASE || "https://smileyapi.mrqzstudio.com",
    wcReadKey: process.env.WC_READ_KEY || "",
    wcReadSecret: process.env.WC_READ_SECRET || "",
    wcWriteKey: process.env.WC_WRITE_KEY || "",
    wcWriteSecret: process.env.WC_WRITE_SECRET || "",
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "https://smileyapi.mrqzstudio.com"
    }
  }
});

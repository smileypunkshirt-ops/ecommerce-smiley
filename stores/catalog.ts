import { defineStore } from "pinia";
import type { CatalogProduct } from "~/types/product";

interface CatalogState {
  items: CatalogProduct[];
  loading: boolean;
  error: string | null;
}

export const useCatalogStore = defineStore("catalog", {
  state: (): CatalogState => ({
    items: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchProducts() {
      if (this.items.length) {
        return this.items;
      }

      this.loading = true;
      this.error = null;

      try {
        const data = await $fetch<{ items: CatalogProduct[] }>("/api/catalog/products");
        this.items = data.items;
        return this.items;
      } catch (error) {
        this.error = error instanceof Error ? error.message : "Failed to load products";
        return [];
      } finally {
        this.loading = false;
      }
    }
  }
});

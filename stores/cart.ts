import { defineStore } from "pinia";
import { useCartToast } from "~/composables/useCartToast";

type CartPayload = Record<string, unknown> & {
  items?: unknown[];
  cart_items?: unknown[];
  item_count?: number;
  cart_key?: string;
  cartKey?: string;
};

interface CartState {
  cart: CartPayload | null;
  items: unknown[];
  itemCount: number;
  cartKey: string | null;
  loading: boolean;
  error: string | null;
}

const CART_KEY_STORAGE = "smiley_cart_key";

const readCartKey = () => {
  if (!process.client) return null;
  try {
    return window.localStorage.getItem(CART_KEY_STORAGE);
  } catch {
    return null;
  }
};

const writeCartKey = (key: string | null) => {
  if (!process.client) return;
  try {
    if (key) {
      window.localStorage.setItem(CART_KEY_STORAGE, key);
    } else {
      window.localStorage.removeItem(CART_KEY_STORAGE);
    }
  } catch {
    // Ignore storage errors to keep cart functional.
  }
};

const resolveItems = (payload: CartPayload | null) => {
  if (!payload) return [];
  const raw = payload.items || payload.cart_items;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as unknown[];
  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>).map(([key, value]) => {
      if (value && typeof value === "object") {
        return { key, ...(value as Record<string, unknown>) };
      }
      return { key, value };
    });
  }
  return [];
};

const getTotalQuantity = (items: unknown[]) => {
  if (!items.length) return 0;
  return items.reduce((total, item) => {
    if (!item || typeof item !== "object") return total + 1;
    const raw = (item as Record<string, unknown>).quantity ?? (item as Record<string, unknown>).qty ?? 1;
    const parsed = Number(raw);
    return total + (Number.isFinite(parsed) && parsed > 0 ? parsed : 1);
  }, 0);
};

const isCartResponse = (payload: CartPayload | null) => {
  if (!payload) return false;
  return (
    "items" in payload ||
    "cart_items" in payload ||
    "item_count" in payload ||
    "totals" in payload
  );
};

export const useCartStore = defineStore("cart", {
  state: (): CartState => ({
    cart: null,
    items: [],
    itemCount: 0,
    cartKey: null,
    loading: false,
    error: null
  }),
  actions: {
    async fetchCart() {
      return await this.requestCart("/cart", "GET");
    },
    async addItem(
      productId: number,
      quantity = 1,
      variationId?: number,
      variation?: Record<string, unknown>
    ) {
      const data = await this.requestCart("/cart/add-item", "POST", {
        id: productId,
        product_id: productId,
        quantity,
        variation_id: variationId,
        variation,
        return_cart: true
      });
      if (!isCartResponse(data)) {
        await this.fetchCart();
      }
      if (data && process.client) {
        const { open } = useCartToast();
        open();
      }
      return data;
    },
    async updateItem(key: string, quantity: number) {
      const firstAttempt = await this.requestCart(`/cart/item/${encodeURIComponent(key)}`, "POST", {
        quantity,
        return_cart: true
      });
      if (firstAttempt) {
        if (!isCartResponse(firstAttempt)) {
          await this.fetchCart();
        }
        return firstAttempt;
      }

      const fallback = await this.requestCart("/cart/item", "POST", {
        key,
        item_key: key,
        cart_item_key: key,
        quantity,
        return_cart: true
      });
      if (!isCartResponse(fallback)) {
        await this.fetchCart();
      }
      return fallback;
    },
    async removeItem(key: string) {
      const data = await this.requestCart(`/cart/item/${encodeURIComponent(key)}`, "DELETE");
      if (!isCartResponse(data)) {
        await this.fetchCart();
      }
      return data;
    },
    async requestCart(path: string, method: "GET" | "POST" | "DELETE", body?: Record<string, unknown>) {
      this.loading = true;
      this.error = null;

      const config = useRuntimeConfig();
      const base = config.public.apiBase;

      try {
        if (!this.cartKey) {
          this.cartKey = readCartKey();
        }

        const url = new URL(`${base}/wp-json/cocart/v2${path}`);
        if (this.cartKey) {
          url.searchParams.set("cart_key", this.cartKey);
        }

        const mergedBody =
          method === "GET"
            ? undefined
            : {
                ...(body || {}),
                ...(this.cartKey && !("cart_key" in (body || {})) ? { cart_key: this.cartKey } : {})
              };

        const payload =
          mergedBody && method !== "GET"
            ? new URLSearchParams(
                Object.entries(mergedBody).reduce<Record<string, string>>((acc, [key, value]) => {
                  if (value === undefined || value === null) return acc;
                  acc[key] = String(value);
                  return acc;
                }, {})
              )
            : undefined;

        const data = await $fetch<CartPayload>(url.toString(), {
          method,
          body: payload,
          credentials: "include",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
          }
        });

        if (isCartResponse(data)) {
          this.cart = data;
          this.items = resolveItems(data);
          const totalQuantity = getTotalQuantity(this.items);
          const itemCountRaw = Number(data.item_count);
          this.itemCount = totalQuantity || (Number.isFinite(itemCountRaw) ? itemCountRaw : this.items.length);
        }
        const responseKey =
          typeof data.cart_key === "string"
            ? data.cart_key
            : typeof data.cartKey === "string"
              ? data.cartKey
              : null;
        if (responseKey) {
          this.cartKey = responseKey;
          writeCartKey(responseKey);
        }

        return data;
      } catch (error) {
        const message =
          typeof (error as { data?: { message?: string } })?.data?.message === "string"
            ? (error as { data?: { message?: string } }).data?.message
            : error instanceof Error
              ? error.message
              : "Cart request failed";
        this.error = message;
        return null;
      } finally {
        this.loading = false;
      }
    }
  }
});

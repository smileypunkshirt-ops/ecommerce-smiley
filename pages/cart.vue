<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useCartStore } from "~/stores/cart";

useHead({
  title: "Carrito | Smiley Punk"
});

const cart = useCartStore();
const { cart: cartPayload, items, loading, error, itemCount } = storeToRefs(cart);

useAsyncData("cart", () => cart.fetchCart(), { server: false });

const quantities = reactive<Record<string, number>>({});

const resolveQuantity = (value: unknown, fallback = 1) => {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidates = [record.value, record.qty, record.quantity];
    for (const candidate of candidates) {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return fallback;
};

const cartItems = computed(() => {
  return (items.value as Array<Record<string, unknown>>).map((item, index) => {
    const resolveProductLink = (value: Record<string, unknown>) => {
      const rawSlug = value.slug || value.product_slug;
      if (typeof rawSlug === "string" && rawSlug.trim()) {
        return `/products/${rawSlug}`;
      }

      const permalink = value.permalink || value.url || value.link;
      if (typeof permalink === "string" && permalink.trim()) {
        try {
          const url = new URL(permalink);
          const parts = url.pathname.split("/").filter(Boolean);
          const slug = parts[parts.length - 1];
          if (slug) {
            return `/products/${slug}`;
          }
        } catch {
          // Ignore invalid URLs.
        }
      }

      return undefined;
    };

    const resolveImage = (value: Record<string, unknown>) => {
      const image = value.image;
      if (typeof image === "string") return image;
      if (image && typeof image === "object") {
        const src = (image as Record<string, unknown>).src;
        const url = (image as Record<string, unknown>).url;
        if (typeof src === "string") return src;
        if (typeof url === "string") return url;
      }

      const featured = value.featured_image;
      if (typeof featured === "string") return featured;
      if (featured && typeof featured === "object") {
        const src = (featured as Record<string, unknown>).src;
        if (typeof src === "string") return src;
      }

      const images = value.images;
      if (Array.isArray(images) && images.length > 0) {
        const first = images[0];
        if (typeof first === "string") return first;
        if (first && typeof first === "object") {
          const src = (first as Record<string, unknown>).src;
          if (typeof src === "string") return src;
        }
      }

      const thumbnail = value.thumbnail;
      if (typeof thumbnail === "string") return thumbnail;
      if (thumbnail && typeof thumbnail === "object") {
        const src = (thumbnail as Record<string, unknown>).src;
        if (typeof src === "string") return src;
      }

      const imageUrl = value.image_url;
      if (typeof imageUrl === "string") return imageUrl;

      return undefined;
    };

    const key = String(
      item.key || item.item_key || item.cart_item_key || item.id || item.product_id || index
    );
    const name = String(item.name || item.title || "Producto");
    const quantity = resolveQuantity(item.quantity ?? item.qty ?? 1, 1);
    const price = (item.price || item.totals?.subtotal || item.line_subtotal) as string | number | undefined;
    const lineTotal = (item.totals?.total || item.line_total || item.line_total_raw) as
      | string
      | number
      | undefined;
    const image = resolveImage(item);

    const rawProductId = item.product_id ?? item.productId ?? item.id;
    const rawVariationId = item.variation_id ?? item.variationId;
    const productId = Number(rawProductId);
    const variationId = Number(rawVariationId);
    const variation = (item.variation || item.attributes) as Record<string, unknown> | undefined;

    return {
      key,
      name,
      quantity,
      price,
      lineTotal,
      image,
      productId: Number.isFinite(productId) ? productId : null,
      variationId: Number.isFinite(variationId) ? variationId : null,
      variation,
      link: resolveProductLink(item)
    };
  });
});

watch(
  cartItems,
  (nextItems) => {
    nextItems.forEach((item) => {
      quantities[item.key] = resolveQuantity(item.quantity, 1);
    });
  },
  { immediate: true }
);

const currencySymbol = computed(() => {
  return (
    (cartPayload.value as Record<string, unknown>)?.currency_symbol ||
    (cartPayload.value as Record<string, unknown>)?.currency?.symbol ||
    "$"
  );
});

const currencyMeta = computed(() => {
  const payload = (cartPayload.value as Record<string, unknown>) || {};
  const currency = (payload.currency as Record<string, unknown>) || {};
  const minorUnit = Number(currency.currency_minor_unit ?? currency.decimals ?? 2);

  return {
    symbol: String(payload.currency_symbol || currency.symbol || "$"),
    decimalSeparator: String(currency.decimal_separator || "."),
    thousandSeparator: String(currency.thousand_separator || ","),
    symbolPosition: String(currency.currency_symbol_position || currency.symbol_position || "left"),
    minorUnit: Number.isFinite(minorUnit) ? minorUnit : 2
  };
});

const useMinorUnits = computed(() => {
  const payload = (cartPayload.value as Record<string, unknown>) || {};
  const totals = payload.totals as Record<string, unknown> | undefined;
  if (!totals) return false;
  const values = Object.values(totals).filter(
    (value) => typeof value === "string" || typeof value === "number"
  );
  if (values.length === 0) return false;
  const { decimalSeparator } = currencyMeta.value;

  return !values.some((value) => {
    if (typeof value === "number") return !Number.isInteger(value);
    const text = value.trim();
    return text.includes(decimalSeparator) || text.includes(".");
  });
});

const parseAmount = (amount?: string | number | null) => {
  if (amount === undefined || amount === null) return null;
  if (typeof amount === "number") return amount;
  const text = amount.trim();
  if (!text) return null;

  const { decimalSeparator, thousandSeparator, minorUnit } = currencyMeta.value;
  const escapedDecimal = decimalSeparator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedThousand = thousandSeparator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const allowed = new RegExp(`[^0-9\\-\\${escapedDecimal}\\${escapedThousand}]`, "g");
  let cleaned = text.replace(allowed, "");

  if (thousandSeparator) {
    cleaned = cleaned.replace(new RegExp(escapedThousand, "g"), "");
  }
  if (decimalSeparator && decimalSeparator !== ".") {
    cleaned = cleaned.replace(new RegExp(escapedDecimal, "g"), ".");
  }

  const hasDecimal = cleaned.includes(".");
  const numeric = Number(cleaned);
  if (!Number.isFinite(numeric)) return null;

  if (!hasDecimal && useMinorUnits.value && minorUnit > 0) {
    return numeric / Math.pow(10, minorUnit);
  }

  return numeric;
};

const formatMoney = (amount?: string | number | null) => {
  const meta = currencyMeta.value;
  const parsed = parseAmount(amount);
  if (parsed === null) return `${meta.symbol}0.00`;

  const isNegative = parsed < 0;
  const absolute = Math.abs(parsed);
  const fixed = absolute.toFixed(meta.minorUnit);
  const [integerPart, decimalPart] = fixed.split(".");
  const withThousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, meta.thousandSeparator);
  const formattedNumber =
    meta.minorUnit > 0 ? `${withThousands}${meta.decimalSeparator}${decimalPart}` : withThousands;
  const withSymbol =
    meta.symbolPosition === "right" ? `${formattedNumber}${meta.symbol}` : `${meta.symbol}${formattedNumber}`;

  return isNegative ? `-${withSymbol}` : withSymbol;
};

const subtotal = computed(() => {
  return (
    (cartPayload.value as Record<string, unknown>)?.totals?.subtotal ||
    (cartPayload.value as Record<string, unknown>)?.subtotal ||
    0
  );
});

const taxTotal = computed(() => {
  return (
    (cartPayload.value as Record<string, unknown>)?.totals?.total_tax ||
    (cartPayload.value as Record<string, unknown>)?.total_tax ||
    0
  );
});

const shippingTotal = computed(() => {
  return (
    (cartPayload.value as Record<string, unknown>)?.totals?.shipping_total ||
    (cartPayload.value as Record<string, unknown>)?.shipping_total ||
    0
  );
});

const discountTotal = computed(() => {
  return (
    (cartPayload.value as Record<string, unknown>)?.totals?.discount_total ||
    (cartPayload.value as Record<string, unknown>)?.discount_total ||
    0
  );
});

const orderTotal = computed(() => {
  return (
    (cartPayload.value as Record<string, unknown>)?.totals?.total ||
    (cartPayload.value as Record<string, unknown>)?.total ||
    0
  );
});

const updateQuantity = async (key: string) => {
  const quantity = Number(quantities[key]);
  if (!quantity || quantity < 1) {
    quantities[key] = 1;
    return;
  }
  await cart.updateItem(key, quantity);
};

const getQuantity = (key: string, fallback: number) => {
  const value = Number(quantities[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const changeQuantity = async (
  item: {
    key: string;
    quantity: number;
    productId: number | null;
    variationId: number | null;
    variation?: Record<string, unknown>;
  },
  delta: number
) => {
  const current = Number(quantities[item.key]);
  const safeCurrent = Number.isFinite(current) && current > 0 ? current : 1;
  const next = Math.max(1, safeCurrent + delta);
  quantities[item.key] = next;

  if (delta > 0 && item.productId) {
    await cart.addItem(item.productId, delta, item.variationId ?? undefined, item.variation);
    return;
  }

  await cart.updateItem(item.key, next);
};

const removeItem = async (key: string) => {
  await cart.removeItem(key);
};
</script>

<template>
  <div class="page">
    <div class="container">
      <AppHeader :item-count="itemCount" cart-label="Items" :cart-link="null" />

      <div class="cart-back-row">
        <NuxtLink class="pdp-back" to="/">Regresar al catalogo</NuxtLink>
      </div>

      <div class="cart-title-row">
        <h1 class="hero-title">Carrito</h1>
      </div>

      <div class="cart-layout">
        <section class="cart-items">
          <p v-if="loading">Cargando carrito...</p>
          <p v-if="error" class="hero-subtitle">{{ error }}</p>
          <div v-if="!loading && cartItems.length === 0" class="cart-empty">
            <p>Tu carrito esta vacio.</p>
            <NuxtLink class="btn btn-primary" to="/">Ver catalogo</NuxtLink>
          </div>
          <div v-else-if="!loading" class="cart-list">
            <article v-for="item in cartItems" :key="item.key" class="cart-item">
              <div class="cart-item-media">
                <div class="cart-item-image">
                  <img v-if="item.image" :src="item.image" :alt="item.name" />
                  <span v-else>Sin imagen</span>
                </div>
              </div>
              <div class="cart-item-body">
                <div class="cart-item-header">
                  <strong>{{ item.name }}</strong>
                  <button
                    class="btn-link"
                    type="button"
                    :disabled="loading"
                    @click="removeItem(item.key)"
                  >
                    Quitar
                  </button>
                </div>
                <p class="hero-subtitle">Precio: {{ formatMoney(item.price) }}</p>
                <div class="cart-item-controls">
                  <div class="qty">
                    <span>Cantidad</span>
                    <div class="qty-controls">
                      <button
                        class="qty-btn"
                        type="button"
                        :disabled="loading || getQuantity(item.key, item.quantity) <= 1"
                        @click="changeQuantity(item, -1)"
                      >
                        -
                      </button>
                      <span class="qty-value">{{ getQuantity(item.key, item.quantity) }}</span>
                      <button
                        class="qty-btn"
                        type="button"
                        :disabled="loading"
                        @click="changeQuantity(item, 1)"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="cart-item-total">
                <span>Total</span>
                <strong>{{ formatMoney(item.lineTotal || item.price) }}</strong>
              </div>
            </article>
          </div>
        </section>

        <aside class="cart-summary">
          <h2 class="section-title">Resumen</h2>
          <div class="summary-row">
            <span>Subtotal</span>
            <span>{{ formatMoney(subtotal) }}</span>
          </div>
          <div class="summary-row">
            <span>Descuento</span>
            <span>- {{ formatMoney(discountTotal) }}</span>
          </div>
          <div class="summary-row">
            <span>Envio</span>
            <span>{{ formatMoney(shippingTotal) }}</span>
          </div>
          <div class="summary-row">
            <span>Impuestos</span>
            <span>{{ formatMoney(taxTotal) }}</span>
          </div>
          <div class="summary-total">
            <span>Total</span>
            <strong>{{ formatMoney(orderTotal) }}</strong>
          </div>
          <NuxtLink
            v-if="!loading && cartItems.length > 0"
            class="btn btn-primary"
            to="/checkout"
          >
            Ir a checkout
          </NuxtLink>
          <button v-else class="btn btn-primary" type="button" disabled>Ir a checkout</button>
          <p class="hero-subtitle">Checkout se conecta con WooCommerce via BFF.</p>
        </aside>
      </div>
    </div>
  </div>
</template>

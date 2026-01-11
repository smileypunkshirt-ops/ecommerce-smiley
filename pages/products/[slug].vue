<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useCartStore } from "~/stores/cart";
import type { CatalogProduct } from "~/types/product";

const route = useRoute();
const cart = useCartStore();
const { itemCount, loading: cartLoading, error: cartError, items: cartItems } = storeToRefs(cart);

const slug = computed(() => String(route.params.slug || ""));

const { data: product, pending, error } = await useAsyncData(
  "product-detail",
  () => $fetch<CatalogProduct>(`/api/catalog/products/${slug.value}`),
  { watch: [slug] }
);

onMounted(() => {
  cart.fetchCart();
});

const displayPrice = computed(() => {
  if (!product.value) return "";
  return product.value.salePrice || product.value.price || product.value.regularPrice;
});

const addToCart = async () => {
  if (!product.value) return;
  await cart.addItem(product.value.id, 1);
};

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

const cartEntry = computed(() => {
  if (!product.value) return null;
  const productId = product.value.id;
  const list = cartItems.value as Array<Record<string, unknown>>;
  for (const item of list) {
    const rawProductId = item.product_id ?? item.productId ?? item.id;
    const id = Number(rawProductId);
    if (!Number.isFinite(id) || id !== productId) continue;
    const key = String(item.key || item.item_key || item.cart_item_key || item.id || item.product_id);
    const quantity = resolveQuantity(item.quantity ?? item.qty ?? item.count ?? 1, 1);
    return { key, quantity };
  }
  return null;
});

const removeFromCart = async () => {
  if (!cartEntry.value?.key) return;
  await cart.removeItem(cartEntry.value.key);
};

useHead(() => ({
  title: product.value ? `${product.value.name} | Smiley Punk` : "Producto"
}));
</script>

<template>
  <div class="page">
    <div class="container">
      <AppHeader :item-count="itemCount" />

      <section class="pdp-layout">
        <div class="pdp-back-row">
          <NuxtLink class="pdp-back" to="/">Regresar al catalogo</NuxtLink>
        </div>
        <div class="pdp-media">
          <div class="pdp-image">
            <img v-if="product?.image" :src="product.image" :alt="product.imageAlt" />
            <span v-else>Sin imagen</span>
          </div>
        </div>
        <div class="pdp-info">
          <p v-if="pending">Cargando producto...</p>
          <p v-else-if="error">No se pudo cargar el producto.</p>
          <div v-else-if="product">
            <span class="badge">Playera Smiley</span>
            <h1 class="hero-title">{{ product.name }}</h1>
            <p class="pdp-price">$ {{ displayPrice }}</p>
            <p class="hero-subtitle">
              {{ product.shortDescription || "Playera clasica con corte regular." }}
            </p>
            <div class="pdp-actions">
              <button class="btn btn-primary" type="button" :disabled="cartLoading" @click="addToCart">
                Agregar al carrito
              </button>
              <button
                v-if="cartEntry"
                class="icon-btn"
                type="button"
                :disabled="cartLoading"
                aria-label="Eliminar del carrito"
                @click="removeFromCart"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9z"
                  />
                </svg>
              </button>
            </div>
            <p v-if="cartError" class="hero-subtitle">{{ cartError }}</p>
          </div>
        </div>
      </section>

      <section v-if="product" class="pdp-details">
        <h2 class="section-title">Descripcion</h2>
        <p class="hero-subtitle">
          {{ product.description || "Sin descripcion adicional por ahora." }}
        </p>
      </section>
    </div>
  </div>
</template>

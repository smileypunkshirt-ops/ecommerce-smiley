<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useCatalogStore } from "~/stores/catalog";
import { useCartStore } from "~/stores/cart";

useHead({
  title: "Smiley Punk | Playeras"
});

const catalog = useCatalogStore();
const cart = useCartStore();
const { items, loading, error } = storeToRefs(catalog);
const { itemCount, loading: cartLoading, error: cartError, items: cartItems } = storeToRefs(cart);

await useAsyncData("catalog-products", () => catalog.fetchProducts());

onMounted(() => {
  cart.fetchCart();
});

const addToCart = async (productId: number) => {
  await cart.addItem(productId, 1);
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

const cartLookup = computed(() => {
  const map = new Map<
    number,
    { quantity: number; key?: string; variationId?: number; variation?: Record<string, unknown> }
  >();
  (cartItems.value as Array<Record<string, unknown>>).forEach((item, index) => {
    const rawProductId = item.product_id ?? item.productId ?? item.id;
    const productId = Number(rawProductId);
    if (!Number.isFinite(productId)) return;

    const quantity = resolveQuantity(item.quantity ?? item.qty ?? item.count ?? 1, 1);
    const key = String(
      item.key || item.item_key || item.cart_item_key || item.id || item.product_id || index
    );
    const rawVariationId = item.variation_id ?? item.variationId;
    const variationId = Number(rawVariationId);
    const variation = (item.variation || item.attributes) as Record<string, unknown> | undefined;

    const entry = map.get(productId);
    if (entry) {
      entry.quantity += quantity;
    } else {
      map.set(productId, {
        quantity,
        key,
        variationId: Number.isFinite(variationId) ? variationId : undefined,
        variation
      });
    }
  });
  return map;
});

const getCartEntry = (productId: number) => cartLookup.value.get(productId);

const changeQuantity = async (
  productId: number,
  entry: { quantity: number; key?: string; variationId?: number; variation?: Record<string, unknown> } | undefined,
  delta: number
) => {
  if (!entry) return;
  if (delta > 0) {
    await cart.addItem(productId, delta, entry.variationId, entry.variation);
    return;
  }

  const next = Math.max(0, entry.quantity + delta);
  if (next < 1) {
    if (entry.key) {
      await cart.removeItem(entry.key);
    }
    return;
  }

  if (entry.key) {
    await cart.updateItem(entry.key, next);
  }
};

const removeFromCart = async (productId: number) => {
  const entry = getCartEntry(productId);
  if (!entry?.key) return;
  await cart.removeItem(entry.key);
};
</script>

<template>
  <div class="page">
    <div class="container">
      <AppHeader :item-count="itemCount" />

      <section class="hero">
        <div>
          <span class="badge">Nuevos drops</span>
          <h1 class="hero-title">Playeras que hablan fuerte</h1>
          <p class="hero-subtitle">
            Coleccion corta, tonos clasicos y acabados limpios. Compra rapido y agrega al carrito sin salirte.
          </p>
          <div class="hero-actions">
            <button class="btn btn-primary" type="button">Ver coleccion</button>
            <button class="btn btn-secondary" type="button">Como funciona</button>
          </div>
        </div>
        <div class="hero-panel">
          <h3>Lo esencial en un vistazo</h3>
          <ul>
            <li>Stock real directo de WooCommerce</li>
            <li>Carrito persistente con CoCart</li>
            <li>Checkout listo para integrar</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 class="section-title">Playeras destacadas</h2>
        <p v-if="loading">Cargando catalogo...</p>
        <p v-else-if="error">No se pudo cargar el catalogo.</p>
        <div v-else class="products-grid">
          <article
            v-for="(product, index) in items"
            :key="product.id"
            class="card"
            :style="{ animationDelay: `${index * 80}ms` }"
          >
            <NuxtLink class="card-image" :to="`/products/${product.slug}`">
              <img v-if="product.image" :src="product.image" :alt="product.imageAlt" />
              <span v-else>Sin imagen</span>
            </NuxtLink>
            <div class="card-body">
              <NuxtLink :to="`/products/${product.slug}`">
                <strong>{{ product.name }}</strong>
              </NuxtLink>
              <span class="price">
                <span v-if="product.salePrice">$ {{ product.salePrice }}</span>
                <span v-else>$ {{ product.price || product.regularPrice }}</span>
              </span>
              <p class="hero-subtitle">{{ product.shortDescription || "Playera clasica, lista para combinar." }}</p>
              <div v-if="getCartEntry(product.id)" class="card-qty">
                <span class="qty-label">Cantidad</span>
                <div class="card-qty-row">
                  <div class="qty-controls">
                    <button
                      class="qty-btn"
                      type="button"
                      :disabled="cartLoading || getCartEntry(product.id).quantity <= 1"
                      @click="changeQuantity(product.id, getCartEntry(product.id), -1)"
                    >
                      -
                    </button>
                    <span class="qty-value">{{ getCartEntry(product.id).quantity }}</span>
                    <button
                      class="qty-btn"
                      type="button"
                      :disabled="cartLoading"
                      @click="changeQuantity(product.id, getCartEntry(product.id), 1)"
                    >
                      +
                    </button>
                  </div>
                  <button
                    class="icon-btn"
                    type="button"
                    :disabled="cartLoading"
                    aria-label="Eliminar del carrito"
                    @click="removeFromCart(product.id)"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <button
                v-else
                class="btn btn-primary"
                type="button"
                :disabled="cartLoading"
                @click="addToCart(product.id)"
              >
                Agregar al carrito
              </button>
              <p v-if="cartError" class="hero-subtitle">{{ cartError }}</p>
            </div>
          </article>
        </div>
      </section>

      <section class="benefits">
        <div class="benefit">
          <strong>Envio rapido</strong>
          <p class="hero-subtitle">Entrega nacional con seguimiento incluido.</p>
        </div>
        <div class="benefit">
          <strong>Calidad premium</strong>
          <p class="hero-subtitle">Algodon suave y acabado resistente.</p>
        </div>
        <div class="benefit">
          <strong>Pago seguro</strong>
          <p class="hero-subtitle">Checkout directo con WooCommerce.</p>
        </div>
      </section>

      <section class="footer-cta">
        <div>
          <h2 class="section-title">Listo para armar tu outfit?</h2>
          <p class="hero-subtitle">Explora la coleccion completa y arma tu carrito.</p>
        </div>
        <button class="btn btn-primary" type="button">Explorar playeras</button>
      </section>
    </div>
  </div>
</template>

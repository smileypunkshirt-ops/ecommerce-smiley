import { u as useCartStore, a as useAsyncData, _ as _sfc_main$1 } from './cart-CIWDZvlP.mjs';
import { d as defineStore, s as storeToRefs, a as __nuxt_component_0$1 } from './server.mjs';
import { defineComponent, withAsyncContext, computed, mergeProps, unref, withCtx, createBlock, openBlock, createVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrRenderStyle, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { u as useHead } from './v3-yXZ6HgMk.mjs';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';
import 'perfect-debounce';
import 'vue-router';

const useCatalogStore = defineStore("catalog", {
  state: () => ({
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
        const data = await $fetch("/api/catalog/products");
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
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    useHead({
      title: "Smiley Punk | Playeras"
    });
    const catalog = useCatalogStore();
    const cart = useCartStore();
    const { items, loading, error } = storeToRefs(catalog);
    const { itemCount, loading: cartLoading, error: cartError, items: cartItems } = storeToRefs(cart);
    [__temp, __restore] = withAsyncContext(() => useAsyncData("catalog-products", () => catalog.fetchProducts())), await __temp, __restore();
    const resolveQuantity = (value, fallback = 1) => {
      if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : fallback;
      if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
      }
      if (value && typeof value === "object") {
        const record = value;
        const candidates = [record.value, record.qty, record.quantity];
        for (const candidate of candidates) {
          const parsed = Number(candidate);
          if (Number.isFinite(parsed) && parsed > 0) return parsed;
        }
      }
      return fallback;
    };
    const cartLookup = computed(() => {
      const map = /* @__PURE__ */ new Map();
      cartItems.value.forEach((item, index) => {
        var _a, _b, _c, _d, _e, _f;
        const rawProductId = (_b = (_a = item.product_id) != null ? _a : item.productId) != null ? _b : item.id;
        const productId = Number(rawProductId);
        if (!Number.isFinite(productId)) return;
        const quantity = resolveQuantity((_e = (_d = (_c = item.quantity) != null ? _c : item.qty) != null ? _d : item.count) != null ? _e : 1, 1);
        const key = String(
          item.key || item.item_key || item.cart_item_key || item.id || item.product_id || index
        );
        const rawVariationId = (_f = item.variation_id) != null ? _f : item.variationId;
        const variationId = Number(rawVariationId);
        const variation = item.variation || item.attributes;
        const entry = map.get(productId);
        if (entry) {
          entry.quantity += quantity;
        } else {
          map.set(productId, {
            quantity,
            key,
            variationId: Number.isFinite(variationId) ? variationId : void 0,
            variation
          });
        }
      });
      return map;
    });
    const getCartEntry = (productId) => cartLookup.value.get(productId);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppHeader = _sfc_main$1;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "page" }, _attrs))}><div class="container">`);
      _push(ssrRenderComponent(_component_AppHeader, { "item-count": unref(itemCount) }, null, _parent));
      _push(`<section class="hero"><div><span class="badge">Nuevos drops</span><h1 class="hero-title">Playeras que hablan fuerte</h1><p class="hero-subtitle"> Coleccion corta, tonos clasicos y acabados limpios. Compra rapido y agrega al carrito sin salirte. </p><div class="hero-actions"><button class="btn btn-primary" type="button">Ver coleccion</button><button class="btn btn-secondary" type="button">Como funciona</button></div></div><div class="hero-panel"><h3>Lo esencial en un vistazo</h3><ul><li>Stock real directo de WooCommerce</li><li>Carrito persistente con CoCart</li><li>Checkout listo para integrar</li></ul></div></section><section><h2 class="section-title">Playeras destacadas</h2>`);
      if (unref(loading)) {
        _push(`<p>Cargando catalogo...</p>`);
      } else if (unref(error)) {
        _push(`<p>No se pudo cargar el catalogo.</p>`);
      } else {
        _push(`<div class="products-grid"><!--[-->`);
        ssrRenderList(unref(items), (product, index) => {
          _push(`<article class="card" style="${ssrRenderStyle({ animationDelay: `${index * 80}ms` })}">`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            class: "card-image",
            to: `/products/${product.slug}`
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                if (product.image) {
                  _push2(`<img${ssrRenderAttr("src", product.image)}${ssrRenderAttr("alt", product.imageAlt)}${_scopeId}>`);
                } else {
                  _push2(`<span${_scopeId}>Sin imagen</span>`);
                }
              } else {
                return [
                  product.image ? (openBlock(), createBlock("img", {
                    key: 0,
                    src: product.image,
                    alt: product.imageAlt
                  }, null, 8, ["src", "alt"])) : (openBlock(), createBlock("span", { key: 1 }, "Sin imagen"))
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`<div class="card-body">`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/products/${product.slug}`
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<strong${_scopeId}>${ssrInterpolate(product.name)}</strong>`);
              } else {
                return [
                  createVNode("strong", null, toDisplayString(product.name), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
          _push(`<span class="price">`);
          if (product.salePrice) {
            _push(`<span>$ ${ssrInterpolate(product.salePrice)}</span>`);
          } else {
            _push(`<span>$ ${ssrInterpolate(product.price || product.regularPrice)}</span>`);
          }
          _push(`</span><p class="hero-subtitle">${ssrInterpolate(product.shortDescription || "Playera clasica, lista para combinar.")}</p>`);
          if (getCartEntry(product.id)) {
            _push(`<div class="card-qty"><span class="qty-label">Cantidad</span><div class="card-qty-row"><div class="qty-controls"><button class="qty-btn" type="button"${ssrIncludeBooleanAttr(unref(cartLoading) || getCartEntry(product.id).quantity <= 1) ? " disabled" : ""}> - </button><span class="qty-value">${ssrInterpolate(getCartEntry(product.id).quantity)}</span><button class="qty-btn" type="button"${ssrIncludeBooleanAttr(unref(cartLoading)) ? " disabled" : ""}> + </button></div><button class="icon-btn" type="button"${ssrIncludeBooleanAttr(unref(cartLoading)) ? " disabled" : ""} aria-label="Eliminar del carrito"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9z"></path></svg></button></div></div>`);
          } else {
            _push(`<button class="btn btn-primary" type="button"${ssrIncludeBooleanAttr(unref(cartLoading)) ? " disabled" : ""}> Agregar al carrito </button>`);
          }
          if (unref(cartError)) {
            _push(`<p class="hero-subtitle">${ssrInterpolate(unref(cartError))}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></article>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</section><section class="benefits"><div class="benefit"><strong>Envio rapido</strong><p class="hero-subtitle">Entrega nacional con seguimiento incluido.</p></div><div class="benefit"><strong>Calidad premium</strong><p class="hero-subtitle">Algodon suave y acabado resistente.</p></div><div class="benefit"><strong>Pago seguro</strong><p class="hero-subtitle">Checkout directo con WooCommerce.</p></div></section><section class="footer-cta"><div><h2 class="section-title">Listo para armar tu outfit?</h2><p class="hero-subtitle">Explora la coleccion completa y arma tu carrito.</p></div><button class="btn btn-primary" type="button">Explorar playeras</button></section></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-Clekhttl.mjs.map

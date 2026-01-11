import { u as useCartStore, a as useAsyncData, _ as _sfc_main$1 } from "./cart-CIWDZvlP.js";
import { s as storeToRefs, a as __nuxt_component_0 } from "../server.mjs";
import { defineComponent, reactive, computed, watch, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr } from "vue/server-renderer";
import { u as useHead } from "./v3-yXZ6HgMk.js";
import "/home/guillermo/Documentos/Proyectos/Smiley/ecommerce-smiley/node_modules/perfect-debounce/dist/index.mjs";
import "/home/guillermo/Documentos/Proyectos/Smiley/ecommerce-smiley/node_modules/ofetch/dist/node.mjs";
import "#internal/nuxt/paths";
import "/home/guillermo/Documentos/Proyectos/Smiley/ecommerce-smiley/node_modules/hookable/dist/index.mjs";
import "/home/guillermo/Documentos/Proyectos/Smiley/ecommerce-smiley/node_modules/unctx/dist/index.mjs";
import "/home/guillermo/Documentos/Proyectos/Smiley/ecommerce-smiley/node_modules/h3/dist/index.mjs";
import "vue-router";
import "/home/guillermo/Documentos/Proyectos/Smiley/ecommerce-smiley/node_modules/radix3/dist/index.mjs";
import "/home/guillermo/Documentos/Proyectos/Smiley/ecommerce-smiley/node_modules/defu/dist/defu.mjs";
import "/home/guillermo/Documentos/Proyectos/Smiley/ecommerce-smiley/node_modules/ufo/dist/index.mjs";
import "/home/guillermo/Documentos/Proyectos/Smiley/ecommerce-smiley/node_modules/klona/dist/index.mjs";
import "/home/guillermo/Documentos/Proyectos/Smiley/ecommerce-smiley/node_modules/@unhead/vue/dist/index.mjs";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "cart",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Carrito | Smiley Punk"
    });
    const cart = useCartStore();
    const { cart: cartPayload, items, loading, error, itemCount } = storeToRefs(cart);
    useAsyncData("cart", () => cart.fetchCart(), { server: false });
    const quantities = reactive({});
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
    const cartItems = computed(() => {
      return items.value.map((item, index) => {
        const resolveProductLink = (value) => {
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
            }
          }
          return void 0;
        };
        const resolveImage = (value) => {
          const image2 = value.image;
          if (typeof image2 === "string") return image2;
          if (image2 && typeof image2 === "object") {
            const src = image2.src;
            const url = image2.url;
            if (typeof src === "string") return src;
            if (typeof url === "string") return url;
          }
          const featured = value.featured_image;
          if (typeof featured === "string") return featured;
          if (featured && typeof featured === "object") {
            const src = featured.src;
            if (typeof src === "string") return src;
          }
          const images = value.images;
          if (Array.isArray(images) && images.length > 0) {
            const first = images[0];
            if (typeof first === "string") return first;
            if (first && typeof first === "object") {
              const src = first.src;
              if (typeof src === "string") return src;
            }
          }
          const thumbnail = value.thumbnail;
          if (typeof thumbnail === "string") return thumbnail;
          if (thumbnail && typeof thumbnail === "object") {
            const src = thumbnail.src;
            if (typeof src === "string") return src;
          }
          const imageUrl = value.image_url;
          if (typeof imageUrl === "string") return imageUrl;
          return void 0;
        };
        const key = String(
          item.key || item.item_key || item.cart_item_key || item.id || item.product_id || index
        );
        const name = String(item.name || item.title || "Producto");
        const quantity = resolveQuantity(item.quantity ?? item.qty ?? 1, 1);
        const price = item.price || item.totals?.subtotal || item.line_subtotal;
        const lineTotal = item.totals?.total || item.line_total || item.line_total_raw;
        const image = resolveImage(item);
        const rawProductId = item.product_id ?? item.productId ?? item.id;
        const rawVariationId = item.variation_id ?? item.variationId;
        const productId = Number(rawProductId);
        const variationId = Number(rawVariationId);
        const variation = item.variation || item.attributes;
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
    computed(() => {
      return cartPayload.value?.currency_symbol || cartPayload.value?.currency?.symbol || "$";
    });
    const currencyMeta = computed(() => {
      const payload = cartPayload.value || {};
      const currency = payload.currency || {};
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
      const payload = cartPayload.value || {};
      const totals = payload.totals;
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
    const parseAmount = (amount) => {
      if (amount === void 0 || amount === null) return null;
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
    const formatMoney = (amount) => {
      const meta = currencyMeta.value;
      const parsed = parseAmount(amount);
      if (parsed === null) return `${meta.symbol}0.00`;
      const isNegative = parsed < 0;
      const absolute = Math.abs(parsed);
      const fixed = absolute.toFixed(meta.minorUnit);
      const [integerPart, decimalPart] = fixed.split(".");
      const withThousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, meta.thousandSeparator);
      const formattedNumber = meta.minorUnit > 0 ? `${withThousands}${meta.decimalSeparator}${decimalPart}` : withThousands;
      const withSymbol = meta.symbolPosition === "right" ? `${formattedNumber}${meta.symbol}` : `${meta.symbol}${formattedNumber}`;
      return isNegative ? `-${withSymbol}` : withSymbol;
    };
    const subtotal = computed(() => {
      return cartPayload.value?.totals?.subtotal || cartPayload.value?.subtotal || 0;
    });
    const taxTotal = computed(() => {
      return cartPayload.value?.totals?.total_tax || cartPayload.value?.total_tax || 0;
    });
    const shippingTotal = computed(() => {
      return cartPayload.value?.totals?.shipping_total || cartPayload.value?.shipping_total || 0;
    });
    const discountTotal = computed(() => {
      return cartPayload.value?.totals?.discount_total || cartPayload.value?.discount_total || 0;
    });
    const orderTotal = computed(() => {
      return cartPayload.value?.totals?.total || cartPayload.value?.total || 0;
    });
    const getQuantity = (key, fallback) => {
      const value = Number(quantities[key]);
      return Number.isFinite(value) && value > 0 ? value : fallback;
    };
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppHeader = _sfc_main$1;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "page" }, _attrs))}><div class="container">`);
      _push(ssrRenderComponent(_component_AppHeader, {
        "item-count": unref(itemCount),
        "cart-label": "Items",
        "cart-link": null
      }, null, _parent));
      _push(`<div class="cart-back-row">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        class: "pdp-back",
        to: "/"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Regresar al catalogo`);
          } else {
            return [
              createTextVNode("Regresar al catalogo")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="cart-title-row"><h1 class="hero-title">Carrito</h1></div><div class="cart-layout"><section class="cart-items">`);
      if (unref(loading)) {
        _push(`<p>Cargando carrito...</p>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(error)) {
        _push(`<p class="hero-subtitle">${ssrInterpolate(unref(error))}</p>`);
      } else {
        _push(`<!---->`);
      }
      if (!unref(loading) && unref(cartItems).length === 0) {
        _push(`<div class="cart-empty"><p>Tu carrito esta vacio.</p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          class: "btn btn-primary",
          to: "/"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Ver catalogo`);
            } else {
              return [
                createTextVNode("Ver catalogo")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else if (!unref(loading)) {
        _push(`<div class="cart-list"><!--[-->`);
        ssrRenderList(unref(cartItems), (item) => {
          _push(`<article class="cart-item"><div class="cart-item-media"><div class="cart-item-image">`);
          if (item.image) {
            _push(`<img${ssrRenderAttr("src", item.image)}${ssrRenderAttr("alt", item.name)}>`);
          } else {
            _push(`<span>Sin imagen</span>`);
          }
          _push(`</div></div><div class="cart-item-body"><div class="cart-item-header"><strong>${ssrInterpolate(item.name)}</strong><button class="btn-link" type="button"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""}> Quitar </button></div><p class="hero-subtitle">Precio: ${ssrInterpolate(formatMoney(item.price))}</p><div class="cart-item-controls"><div class="qty"><span>Cantidad</span><div class="qty-controls"><button class="qty-btn" type="button"${ssrIncludeBooleanAttr(unref(loading) || getQuantity(item.key, item.quantity) <= 1) ? " disabled" : ""}> - </button><span class="qty-value">${ssrInterpolate(getQuantity(item.key, item.quantity))}</span><button class="qty-btn" type="button"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""}> + </button></div></div></div></div><div class="cart-item-total"><span>Total</span><strong>${ssrInterpolate(formatMoney(item.lineTotal || item.price))}</strong></div></article>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</section><aside class="cart-summary"><h2 class="section-title">Resumen</h2><div class="summary-row"><span>Subtotal</span><span>${ssrInterpolate(formatMoney(unref(subtotal)))}</span></div><div class="summary-row"><span>Descuento</span><span>- ${ssrInterpolate(formatMoney(unref(discountTotal)))}</span></div><div class="summary-row"><span>Envio</span><span>${ssrInterpolate(formatMoney(unref(shippingTotal)))}</span></div><div class="summary-row"><span>Impuestos</span><span>${ssrInterpolate(formatMoney(unref(taxTotal)))}</span></div><div class="summary-total"><span>Total</span><strong>${ssrInterpolate(formatMoney(unref(orderTotal)))}</strong></div>`);
      if (!unref(loading) && unref(cartItems).length > 0) {
        _push(ssrRenderComponent(_component_NuxtLink, {
          class: "btn btn-primary",
          to: "/checkout"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Ir a checkout `);
            } else {
              return [
                createTextVNode(" Ir a checkout ")
              ];
            }
          }),
          _: 1
        }, _parent));
      } else {
        _push(`<button class="btn btn-primary" type="button" disabled>Ir a checkout</button>`);
      }
      _push(`<p class="hero-subtitle">Checkout se conecta con WooCommerce via BFF.</p></aside></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/cart.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=cart-DoTHzb8_.js.map

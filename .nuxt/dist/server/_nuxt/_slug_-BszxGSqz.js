import { u as useCartStore, a as useAsyncData, _ as _sfc_main$1 } from "./cart-CIWDZvlP.js";
import { u as useRoute, s as storeToRefs, a as __nuxt_component_0 } from "../server.mjs";
import { defineComponent, computed, withAsyncContext, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr } from "vue/server-renderer";
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
  __name: "[slug]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const cart = useCartStore();
    const { itemCount, loading: cartLoading, error: cartError, items: cartItems } = storeToRefs(cart);
    const slug = computed(() => String(route.params.slug || ""));
    const { data: product, pending, error } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "product-detail",
      () => $fetch(`/api/catalog/products/${slug.value}`),
      { watch: [slug] }
    )), __temp = await __temp, __restore(), __temp);
    const displayPrice = computed(() => {
      if (!product.value) return "";
      return product.value.salePrice || product.value.price || product.value.regularPrice;
    });
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
    const cartEntry = computed(() => {
      if (!product.value) return null;
      const productId = product.value.id;
      const list = cartItems.value;
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
    useHead(() => ({
      title: product.value ? `${product.value.name} | Smiley Punk` : "Producto"
    }));
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppHeader = _sfc_main$1;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "page" }, _attrs))}><div class="container">`);
      _push(ssrRenderComponent(_component_AppHeader, { "item-count": unref(itemCount) }, null, _parent));
      _push(`<section class="pdp-layout"><div class="pdp-back-row">`);
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
      _push(`</div><div class="pdp-media"><div class="pdp-image">`);
      if (unref(product)?.image) {
        _push(`<img${ssrRenderAttr("src", unref(product).image)}${ssrRenderAttr("alt", unref(product).imageAlt)}>`);
      } else {
        _push(`<span>Sin imagen</span>`);
      }
      _push(`</div></div><div class="pdp-info">`);
      if (unref(pending)) {
        _push(`<p>Cargando producto...</p>`);
      } else if (unref(error)) {
        _push(`<p>No se pudo cargar el producto.</p>`);
      } else if (unref(product)) {
        _push(`<div><span class="badge">Playera Smiley</span><h1 class="hero-title">${ssrInterpolate(unref(product).name)}</h1><p class="pdp-price">$ ${ssrInterpolate(unref(displayPrice))}</p><p class="hero-subtitle">${ssrInterpolate(unref(product).shortDescription || "Playera clasica con corte regular.")}</p><div class="pdp-actions"><button class="btn btn-primary" type="button"${ssrIncludeBooleanAttr(unref(cartLoading)) ? " disabled" : ""}> Agregar al carrito </button>`);
        if (unref(cartEntry)) {
          _push(`<button class="icon-btn" type="button"${ssrIncludeBooleanAttr(unref(cartLoading)) ? " disabled" : ""} aria-label="Eliminar del carrito"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9z"></path></svg></button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (unref(cartError)) {
          _push(`<p class="hero-subtitle">${ssrInterpolate(unref(cartError))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></section>`);
      if (unref(product)) {
        _push(`<section class="pdp-details"><h2 class="section-title">Descripcion</h2><p class="hero-subtitle">${ssrInterpolate(unref(product).description || "Sin descripcion adicional por ahora.")}</p></section>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/products/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
export {
  _sfc_main as default
};
//# sourceMappingURL=_slug_-BszxGSqz.js.map

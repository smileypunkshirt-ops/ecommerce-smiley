import { u as useCartStore, a as useAsyncData, _ as _sfc_main$1 } from './cart-CIWDZvlP.mjs';
import { s as storeToRefs, a as __nuxt_component_0$1 } from './server.mjs';
import { defineComponent, ref, reactive, computed, watch, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderAttr, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';
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

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "checkout",
  __ssrInlineRender: true,
  setup(__props) {
    useHead({
      title: "Checkout | Smiley Punk"
    });
    const cart = useCartStore();
    const { cart: cartPayload, items, loading, error, itemCount } = storeToRefs(cart);
    useAsyncData("checkout-cart", () => cart.fetchCart(), { server: false });
    const showLoader = ref(true);
    const activePanel = ref("shipping");
    const form = reactive({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Mexico"
    });
    const payment = reactive({
      method: "card",
      cardName: "",
      cardNumber: "",
      cardExpiry: "",
      cardCvc: ""
    });
    const orderLoading = ref(false);
    const orderError = ref("");
    const orderSuccess = ref("");
    const orderCompleted = ref(false);
    const orderNumber = ref(null);
    const isShippingComplete = computed(() => {
      return form.firstName.trim() && form.lastName.trim() && form.email.trim().includes("@") && form.phone.trim() && form.address.trim() && form.city.trim() && form.state.trim() && form.postalCode.trim() && form.country.trim();
    });
    const isPaymentComplete = computed(() => {
      if (payment.method !== "card") return true;
      return payment.cardName.trim() && payment.cardNumber.trim() && payment.cardExpiry.trim() && payment.cardCvc.trim();
    });
    const canShowPayment = computed(() => Boolean(isShippingComplete.value));
    const canShowReview = computed(() => Boolean(isShippingComplete.value && isPaymentComplete.value));
    watch([canShowPayment, canShowReview], () => {
      if (activePanel.value === "review" && !canShowReview.value) {
        activePanel.value = canShowPayment.value ? "payment" : "shipping";
        return;
      }
      if (activePanel.value === "payment" && !canShowPayment.value) {
        activePanel.value = "shipping";
      }
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
    const lineItems = computed(() => {
      return items.value.map((item, index) => {
        var _a, _b, _c;
        const key = String(
          item.key || item.item_key || item.cart_item_key || item.id || item.product_id || index
        );
        const name = String(item.name || item.title || "Producto");
        const quantity = resolveQuantity((_b = (_a = item.quantity) != null ? _a : item.qty) != null ? _b : 1, 1);
        const lineTotal = ((_c = item.totals) == null ? void 0 : _c.total) || item.line_total || item.line_total_raw || item.price;
        return { key, name, quantity, lineTotal };
      });
    });
    computed(() => {
      return items.value.map((item, index) => {
        var _a, _b, _c, _d, _e;
        const rawProductId = (_b = (_a = item.product_id) != null ? _a : item.productId) != null ? _b : item.id;
        const rawVariationId = (_c = item.variation_id) != null ? _c : item.variationId;
        const productId = Number(rawProductId);
        const variationId = Number(rawVariationId);
        const quantity = resolveQuantity((_e = (_d = item.quantity) != null ? _d : item.qty) != null ? _e : 1, 1);
        if (!Number.isFinite(productId)) return null;
        return {
          product_id: productId,
          variation_id: Number.isFinite(variationId) ? variationId : void 0,
          quantity
        };
      }).filter(Boolean);
    });
    const currencyMeta = computed(() => {
      var _a, _b;
      const payload = cartPayload.value || {};
      const currency = payload.currency || {};
      const minorUnit = Number((_b = (_a = currency.currency_minor_unit) != null ? _a : currency.decimals) != null ? _b : 2);
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
      var _a, _b, _c;
      return ((_b = (_a = cartPayload.value) == null ? void 0 : _a.totals) == null ? void 0 : _b.subtotal) || ((_c = cartPayload.value) == null ? void 0 : _c.subtotal) || 0;
    });
    const taxTotal = computed(() => {
      var _a, _b, _c;
      return ((_b = (_a = cartPayload.value) == null ? void 0 : _a.totals) == null ? void 0 : _b.total_tax) || ((_c = cartPayload.value) == null ? void 0 : _c.total_tax) || 0;
    });
    const shippingTotal = computed(() => {
      var _a, _b, _c;
      return ((_b = (_a = cartPayload.value) == null ? void 0 : _a.totals) == null ? void 0 : _b.shipping_total) || ((_c = cartPayload.value) == null ? void 0 : _c.shipping_total) || 0;
    });
    const discountTotal = computed(() => {
      var _a, _b, _c;
      return ((_b = (_a = cartPayload.value) == null ? void 0 : _a.totals) == null ? void 0 : _b.discount_total) || ((_c = cartPayload.value) == null ? void 0 : _c.discount_total) || 0;
    });
    const orderTotal = computed(() => {
      var _a, _b, _c;
      return ((_b = (_a = cartPayload.value) == null ? void 0 : _a.totals) == null ? void 0 : _b.total) || ((_c = cartPayload.value) == null ? void 0 : _c.total) || 0;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppHeader = _sfc_main$1;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "page" }, _attrs))}><div class="container">`);
      if (unref(showLoader)) {
        _push(`<div class="checkout-loader" aria-live="polite"><div class="loader-spinner"></div><p class="hero-subtitle">Preparando checkout...</p></div>`);
      } else {
        _push(`<!---->`);
      }
      if (!unref(showLoader)) {
        _push(`<div class="checkout-content">`);
        _push(ssrRenderComponent(_component_AppHeader, { centered: "" }, null, _parent));
        _push(`<div class="checkout-back-row">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          class: "pdp-back",
          to: "/cart"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Regresar al carrito`);
            } else {
              return [
                createTextVNode("Regresar al carrito")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div><div class="checkout-title-row"><h1 class="hero-title">Checkout</h1></div>`);
        if (unref(orderCompleted)) {
          _push(`<div class="order-complete"><div class="order-complete-card"><span class="badge">Pedido confirmado</span><h2 class="hero-title">Gracias por tu compra</h2><p class="hero-subtitle">${ssrInterpolate(unref(orderNumber) ? `Tu folio es #${unref(orderNumber)}.` : "Tu pedido fue creado exitosamente.")}</p><div class="order-complete-actions">`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            class: "btn btn-primary",
            to: "/"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`Seguir comprando`);
              } else {
                return [
                  createTextVNode("Seguir comprando")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(ssrRenderComponent(_component_NuxtLink, {
            class: "btn btn-secondary",
            to: "/cart"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`Ver carrito`);
              } else {
                return [
                  createTextVNode("Ver carrito")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</div></div><aside class="checkout-summary"><h2 class="section-title">Resumen</h2>`);
          if (unref(lineItems).length) {
            _push(`<div class="summary-items"><!--[-->`);
            ssrRenderList(unref(lineItems), (item) => {
              _push(`<div class="summary-item"><div><strong>${ssrInterpolate(item.name)}</strong><p class="hero-subtitle">Cantidad: ${ssrInterpolate(item.quantity)}</p></div><span>${ssrInterpolate(formatMoney(item.lineTotal))}</span></div>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="summary-row"><span>Subtotal</span><span>${ssrInterpolate(formatMoney(unref(subtotal)))}</span></div><div class="summary-row"><span>Descuento</span><span>- ${ssrInterpolate(formatMoney(unref(discountTotal)))}</span></div><div class="summary-row"><span>Envio</span><span>${ssrInterpolate(formatMoney(unref(shippingTotal)))}</span></div><div class="summary-row"><span>Impuestos</span><span>${ssrInterpolate(formatMoney(unref(taxTotal)))}</span></div><div class="summary-total"><span>Total</span><strong>${ssrInterpolate(formatMoney(unref(orderTotal)))}</strong></div></aside></div>`);
        } else {
          _push(`<div class="checkout-layout"><section class="checkout-accordion"><div class="${ssrRenderClass([{ open: unref(activePanel) === "shipping" }, "accordion-item"])}"><button class="accordion-header" type="button"${ssrRenderAttr("aria-expanded", unref(activePanel) === "shipping")}> 1. Datos de envio </button>`);
          if (unref(activePanel) === "shipping") {
            _push(`<div class="accordion-panel"><div class="form-grid"><label class="form-field"> Nombre <input${ssrRenderAttr("value", unref(form).firstName)} type="text" placeholder="Andrea"></label><label class="form-field"> Apellido <input${ssrRenderAttr("value", unref(form).lastName)} type="text" placeholder="Lopez"></label><label class="form-field"> Email <input${ssrRenderAttr("value", unref(form).email)} type="email" placeholder="hola@correo.com"></label><label class="form-field"> Telefono <input${ssrRenderAttr("value", unref(form).phone)} type="tel" placeholder="55 1234 5678"></label><label class="form-field form-field-full"> Direccion <input${ssrRenderAttr("value", unref(form).address)} type="text" placeholder="Calle 123, Colonia"></label><label class="form-field"> Ciudad <input${ssrRenderAttr("value", unref(form).city)} type="text" placeholder="CDMX"></label><label class="form-field"> Estado <input${ssrRenderAttr("value", unref(form).state)} type="text" placeholder="Ciudad de Mexico"></label><label class="form-field"> Codigo postal <input${ssrRenderAttr("value", unref(form).postalCode)} type="text" placeholder="01000"></label><label class="form-field"> Pais <select><option${ssrIncludeBooleanAttr(Array.isArray(unref(form).country) ? ssrLooseContain(unref(form).country, null) : ssrLooseEqual(unref(form).country, null)) ? " selected" : ""}>Mexico</option><option${ssrIncludeBooleanAttr(Array.isArray(unref(form).country) ? ssrLooseContain(unref(form).country, null) : ssrLooseEqual(unref(form).country, null)) ? " selected" : ""}>Estados Unidos</option><option${ssrIncludeBooleanAttr(Array.isArray(unref(form).country) ? ssrLooseContain(unref(form).country, null) : ssrLooseEqual(unref(form).country, null)) ? " selected" : ""}>Canada</option></select></label></div><div class="accordion-actions"><button class="btn btn-secondary" type="button"> Continuar a pago </button></div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
          if (unref(canShowPayment)) {
            _push(`<div class="${ssrRenderClass([{ open: unref(activePanel) === "payment" }, "accordion-item"])}"><button class="accordion-header" type="button"${ssrRenderAttr("aria-expanded", unref(activePanel) === "payment")}> 2. Metodo de pago </button>`);
            if (unref(activePanel) === "payment") {
              _push(`<div class="accordion-panel"><div class="form-grid"><label class="form-field form-field-full"> Metodo <select><option value="card"${ssrIncludeBooleanAttr(Array.isArray(unref(payment).method) ? ssrLooseContain(unref(payment).method, "card") : ssrLooseEqual(unref(payment).method, "card")) ? " selected" : ""}>Tarjeta</option><option value="transfer"${ssrIncludeBooleanAttr(Array.isArray(unref(payment).method) ? ssrLooseContain(unref(payment).method, "transfer") : ssrLooseEqual(unref(payment).method, "transfer")) ? " selected" : ""}>Transferencia</option><option value="cash"${ssrIncludeBooleanAttr(Array.isArray(unref(payment).method) ? ssrLooseContain(unref(payment).method, "cash") : ssrLooseEqual(unref(payment).method, "cash")) ? " selected" : ""}>Pago en efectivo</option></select></label><label class="form-field form-field-full"> Nombre en tarjeta <input${ssrRenderAttr("value", unref(payment).cardName)} type="text" placeholder="Andrea Lopez"></label><label class="form-field form-field-full"> Numero de tarjeta <input${ssrRenderAttr("value", unref(payment).cardNumber)} type="text" inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242"></label><label class="form-field"> Expiracion <input${ssrRenderAttr("value", unref(payment).cardExpiry)} type="text" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA"></label><label class="form-field"> CVC <input${ssrRenderAttr("value", unref(payment).cardCvc)} type="text" placeholder="123"></label></div><div class="accordion-actions"><button class="btn btn-secondary" type="button"> Revisar pedido </button></div></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(canShowReview)) {
            _push(`<div class="${ssrRenderClass([{ open: unref(activePanel) === "review" }, "accordion-item"])}"><button class="accordion-header" type="button"${ssrRenderAttr("aria-expanded", unref(activePanel) === "review")}> 3. Confirmacion </button>`);
            if (unref(activePanel) === "review") {
              _push(`<div class="accordion-panel"><p class="hero-subtitle"> Revisa tu informacion y confirma el pedido. El checkout final se conectara con WooCommerce. </p><div class="accordion-actions"><button class="btn btn-primary" type="button"${ssrIncludeBooleanAttr(unref(loading) || unref(orderLoading) || unref(lineItems).length === 0) ? " disabled" : ""}>${ssrInterpolate(unref(orderLoading) ? "Procesando..." : "Realizar pedido")}</button></div>`);
              if (unref(orderError)) {
                _push(`<p class="hero-subtitle">${ssrInterpolate(unref(orderError))}</p>`);
              } else {
                _push(`<!---->`);
              }
              if (unref(orderSuccess)) {
                _push(`<p class="hero-subtitle">${ssrInterpolate(unref(orderSuccess))}</p>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</section><aside class="checkout-summary"><h2 class="section-title">Resumen</h2>`);
          if (unref(loading)) {
            _push(`<p>Cargando resumen...</p>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(error)) {
            _push(`<p class="hero-subtitle">${ssrInterpolate(unref(error))}</p>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(lineItems).length) {
            _push(`<div class="summary-items"><!--[-->`);
            ssrRenderList(unref(lineItems), (item) => {
              _push(`<div class="summary-item"><div><strong>${ssrInterpolate(item.name)}</strong><p class="hero-subtitle">Cantidad: ${ssrInterpolate(item.quantity)}</p></div><span>${ssrInterpolate(formatMoney(item.lineTotal))}</span></div>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<div class="cart-empty">Tu carrito esta vacio.</div>`);
          }
          _push(`<div class="summary-row"><span>Subtotal</span><span>${ssrInterpolate(formatMoney(unref(subtotal)))}</span></div><div class="summary-row"><span>Descuento</span><span>- ${ssrInterpolate(formatMoney(unref(discountTotal)))}</span></div><div class="summary-row"><span>Envio</span><span>${ssrInterpolate(formatMoney(unref(shippingTotal)))}</span></div><div class="summary-row"><span>Impuestos</span><span>${ssrInterpolate(formatMoney(unref(taxTotal)))}</span></div><div class="summary-total"><span>Total</span><strong>${ssrInterpolate(formatMoney(unref(orderTotal)))}</strong></div></aside></div>`);
        }
        _push(`</div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/checkout.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=checkout-XTKX7fNf.mjs.map

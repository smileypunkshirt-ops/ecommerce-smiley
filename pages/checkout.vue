<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useCartStore } from "~/stores/cart";

useHead({
  title: "Checkout | Smiley Punk"
});

const cart = useCartStore();
const { cart: cartPayload, items, loading, error, itemCount } = storeToRefs(cart);

useAsyncData("checkout-cart", () => cart.fetchCart(), { server: false });

const showLoader = ref(true);

onMounted(() => {
  setTimeout(() => {
    showLoader.value = false;
  }, 2000);
});

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
const orderNumber = ref<number | null>(null);

const formatCardNumber = (value: string) => {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
};

const formatCardExpiry = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const onCardNumberInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  if (!target) return;
  payment.cardNumber = formatCardNumber(target.value);
};

const onCardExpiryInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  if (!target) return;
  payment.cardExpiry = formatCardExpiry(target.value);
};

const isShippingComplete = computed(() => {
  return (
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim().includes("@") &&
    form.phone.trim() &&
    form.address.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.postalCode.trim() &&
    form.country.trim()
  );
});

const isPaymentComplete = computed(() => {
  if (payment.method !== "card") return true;
  return (
    payment.cardName.trim() &&
    payment.cardNumber.trim() &&
    payment.cardExpiry.trim() &&
    payment.cardCvc.trim()
  );
});

const canShowPayment = computed(() => Boolean(isShippingComplete.value));
const canShowReview = computed(() => Boolean(isShippingComplete.value && isPaymentComplete.value));

const resolvePanel = (panel: string) => {
  if (panel === "payment" && !canShowPayment.value) return "shipping";
  if (panel === "review" && !canShowReview.value) {
    return canShowPayment.value ? "payment" : "shipping";
  }
  return panel;
};

const togglePanel = (panel: string) => {
  const target = resolvePanel(panel);
  activePanel.value = activePanel.value === target ? "" : target;
};

const openPanel = (panel: string) => {
  activePanel.value = resolvePanel(panel);
};

watch([canShowPayment, canShowReview], () => {
  if (activePanel.value === "review" && !canShowReview.value) {
    activePanel.value = canShowPayment.value ? "payment" : "shipping";
    return;
  }
  if (activePanel.value === "payment" && !canShowPayment.value) {
    activePanel.value = "shipping";
  }
});

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

const lineItems = computed(() => {
  return (items.value as Array<Record<string, unknown>>).map((item, index) => {
    const key = String(
      item.key || item.item_key || item.cart_item_key || item.id || item.product_id || index
    );
    const name = String(item.name || item.title || "Producto");
    const quantity = resolveQuantity(item.quantity ?? item.qty ?? 1, 1);
    const lineTotal = (item.totals?.total || item.line_total || item.line_total_raw || item.price) as
      | string
      | number
      | undefined;

    return { key, name, quantity, lineTotal };
  });
});

const orderLineItems = computed(() => {
  return (items.value as Array<Record<string, unknown>>)
    .map((item, index) => {
      const rawProductId = item.product_id ?? item.productId ?? item.id;
      const rawVariationId = item.variation_id ?? item.variationId;
      const productId = Number(rawProductId);
      const variationId = Number(rawVariationId);
      const quantity = resolveQuantity(item.quantity ?? item.qty ?? 1, 1);

      if (!Number.isFinite(productId)) return null;

      return {
        product_id: productId,
        variation_id: Number.isFinite(variationId) ? variationId : undefined,
        quantity
      };
    })
    .filter(Boolean) as Array<{ product_id: number; variation_id?: number; quantity: number }>;
});

const resolveCountryCode = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "mexico" || normalized === "méxico") return "MX";
  if (normalized === "estados unidos" || normalized === "usa" || normalized === "us") return "US";
  if (normalized === "canada" || normalized === "canadá") return "CA";
  return value;
};

const placeOrder = async () => {
  orderError.value = "";
  orderSuccess.value = "";

  if (!isShippingComplete.value) {
    orderError.value = "Completa los datos de envio para continuar.";
    activePanel.value = "shipping";
    return;
  }

  if (!isPaymentComplete.value) {
    orderError.value = "Completa los datos de pago para continuar.";
    activePanel.value = "payment";
    return;
  }

  if (!orderLineItems.value.length) {
    orderError.value = "Tu carrito esta vacio.";
    return;
  }

  orderLoading.value = true;
  try {
    const country = resolveCountryCode(form.country);
    const payload = {
      payment_method: payment.method,
      payment_method_title: payment.method === "card" ? "Tarjeta" : "Pago",
      set_paid: false,
      billing: {
        first_name: form.firstName,
        last_name: form.lastName,
        address_1: form.address,
        city: form.city,
        state: form.state,
        postcode: form.postalCode,
        country,
        email: form.email,
        phone: form.phone
      },
      shipping: {
        first_name: form.firstName,
        last_name: form.lastName,
        address_1: form.address,
        city: form.city,
        state: form.state,
        postcode: form.postalCode,
        country
      },
      line_items: orderLineItems.value
    };

    const response = await $fetch<{ id?: number }>("/api/checkout/order", {
      method: "POST",
      body: payload
    });

    orderNumber.value = response?.id ?? null;
    orderSuccess.value = response?.id
      ? `Pedido creado con folio #${response.id}.`
      : "Pedido creado correctamente.";
    orderCompleted.value = true;
  } catch (err) {
    orderError.value = err instanceof Error ? err.message : "No se pudo crear el pedido.";
  } finally {
    orderLoading.value = false;
  }
};

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
</script>

<template>
  <div class="page">
    <div class="container">
      <div v-if="showLoader" class="checkout-loader" aria-live="polite">
        <div class="loader-spinner" />
        <p class="hero-subtitle">Preparando checkout...</p>
      </div>
      <Transition name="checkout-fade">
        <div v-if="!showLoader" class="checkout-content">
          <AppHeader centered />

          <div class="checkout-back-row">
            <NuxtLink class="pdp-back" to="/cart">Regresar al carrito</NuxtLink>
          </div>

          <div class="checkout-title-row">
            <h1 class="hero-title">Checkout</h1>
          </div>

          <div v-if="orderCompleted" class="order-complete">
            <div class="order-complete-card">
              <span class="badge">Pedido confirmado</span>
              <h2 class="hero-title">Gracias por tu compra</h2>
              <p class="hero-subtitle">
                {{ orderNumber ? `Tu folio es #${orderNumber}.` : "Tu pedido fue creado exitosamente." }}
              </p>
              <div class="order-complete-actions">
                <NuxtLink class="btn btn-primary" to="/">Seguir comprando</NuxtLink>
                <NuxtLink class="btn btn-secondary" to="/cart">Ver carrito</NuxtLink>
              </div>
            </div>
            <aside class="checkout-summary">
              <h2 class="section-title">Resumen</h2>
              <div v-if="lineItems.length" class="summary-items">
                <div v-for="item in lineItems" :key="item.key" class="summary-item">
                  <div>
                    <strong>{{ item.name }}</strong>
                    <p class="hero-subtitle">Cantidad: {{ item.quantity }}</p>
                  </div>
                  <span>{{ formatMoney(item.lineTotal) }}</span>
                </div>
              </div>
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
            </aside>
          </div>

          <div v-else class="checkout-layout">
            <section class="checkout-accordion">
              <div class="accordion-item" :class="{ open: activePanel === 'shipping' }">
                <button
                  class="accordion-header"
                  type="button"
                  :aria-expanded="activePanel === 'shipping'"
                  @click="togglePanel('shipping')"
                >
                  1. Datos de envio
                </button>
                <Transition name="accordion">
                  <div v-if="activePanel === 'shipping'" class="accordion-panel">
                    <div class="form-grid">
                      <label class="form-field">
                        Nombre
                        <input v-model="form.firstName" type="text" placeholder="Andrea" />
                      </label>
                      <label class="form-field">
                        Apellido
                        <input v-model="form.lastName" type="text" placeholder="Lopez" />
                      </label>
                      <label class="form-field">
                        Email
                        <input v-model="form.email" type="email" placeholder="hola@correo.com" />
                      </label>
                      <label class="form-field">
                        Telefono
                        <input v-model="form.phone" type="tel" placeholder="55 1234 5678" />
                      </label>
                      <label class="form-field form-field-full">
                        Direccion
                        <input v-model="form.address" type="text" placeholder="Calle 123, Colonia" />
                      </label>
                      <label class="form-field">
                        Ciudad
                        <input v-model="form.city" type="text" placeholder="CDMX" />
                      </label>
                      <label class="form-field">
                        Estado
                        <input v-model="form.state" type="text" placeholder="Ciudad de Mexico" />
                      </label>
                      <label class="form-field">
                        Codigo postal
                        <input v-model="form.postalCode" type="text" placeholder="01000" />
                      </label>
                      <label class="form-field">
                        Pais
                        <select v-model="form.country">
                          <option>Mexico</option>
                          <option>Estados Unidos</option>
                          <option>Canada</option>
                        </select>
                      </label>
                    </div>
                    <div class="accordion-actions">
                      <button class="btn btn-secondary" type="button" @click="openPanel('payment')">
                        Continuar a pago
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>

              <div
                v-if="canShowPayment"
                class="accordion-item"
                :class="{ open: activePanel === 'payment' }"
              >
                <button
                  class="accordion-header"
                  type="button"
                  :aria-expanded="activePanel === 'payment'"
                  @click="togglePanel('payment')"
                >
                  2. Metodo de pago
                </button>
                <Transition name="accordion">
                  <div v-if="activePanel === 'payment'" class="accordion-panel">
                    <div class="form-grid">
                      <label class="form-field form-field-full">
                        Metodo
                        <select v-model="payment.method">
                          <option value="card">Tarjeta</option>
                          <option value="transfer">Transferencia</option>
                          <option value="cash">Pago en efectivo</option>
                        </select>
                      </label>
                      <label class="form-field form-field-full">
                        Nombre en tarjeta
                        <input v-model="payment.cardName" type="text" placeholder="Andrea Lopez" />
                      </label>
                      <label class="form-field form-field-full">
                        Numero de tarjeta
                        <input
                          :value="payment.cardNumber"
                          type="text"
                          inputmode="numeric"
                          autocomplete="cc-number"
                          placeholder="4242 4242 4242 4242"
                          @input="onCardNumberInput"
                        />
                      </label>
                    <label class="form-field">
                      Expiracion
                      <input
                        :value="payment.cardExpiry"
                        type="text"
                        inputmode="numeric"
                        autocomplete="cc-exp"
                        placeholder="MM/AA"
                        @input="onCardExpiryInput"
                      />
                    </label>
                      <label class="form-field">
                        CVC
                        <input v-model="payment.cardCvc" type="text" placeholder="123" />
                      </label>
                    </div>
                    <div class="accordion-actions">
                      <button class="btn btn-secondary" type="button" @click="openPanel('review')">
                        Revisar pedido
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>

              <div v-if="canShowReview" class="accordion-item" :class="{ open: activePanel === 'review' }">
                <button
                  class="accordion-header"
                  type="button"
                  :aria-expanded="activePanel === 'review'"
                  @click="togglePanel('review')"
                >
                  3. Confirmacion
                </button>
                <Transition name="accordion">
                  <div v-if="activePanel === 'review'" class="accordion-panel">
                    <p class="hero-subtitle">
                      Revisa tu informacion y confirma el pedido. El checkout final se conectara con WooCommerce.
                    </p>
                    <div class="accordion-actions">
                      <button
                        class="btn btn-primary"
                        type="button"
                        :disabled="loading || orderLoading || lineItems.length === 0"
                        @click="placeOrder"
                      >
                        {{ orderLoading ? "Procesando..." : "Realizar pedido" }}
                      </button>
                    </div>
                    <p v-if="orderError" class="hero-subtitle">{{ orderError }}</p>
                    <p v-if="orderSuccess" class="hero-subtitle">{{ orderSuccess }}</p>
                  </div>
                </Transition>
              </div>
            </section>

            <aside class="checkout-summary">
              <h2 class="section-title">Resumen</h2>
              <p v-if="loading">Cargando resumen...</p>
              <p v-if="error" class="hero-subtitle">{{ error }}</p>
              <div v-if="lineItems.length" class="summary-items">
                <div v-for="item in lineItems" :key="item.key" class="summary-item">
                  <div>
                    <strong>{{ item.name }}</strong>
                    <p class="hero-subtitle">Cantidad: {{ item.quantity }}</p>
                  </div>
                  <span>{{ formatMoney(item.lineTotal) }}</span>
                </div>
              </div>
              <div v-else class="cart-empty">Tu carrito esta vacio.</div>
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
            </aside>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

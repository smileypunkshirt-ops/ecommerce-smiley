import { computed, toValue, getCurrentInstance, onServerPrefetch, ref, shallowRef, toRef, nextTick, unref, defineComponent, mergeProps, withCtx, createVNode, toDisplayString, useSSRContext } from "vue";
import { debounce } from "/home/guillermo/Documentos/Proyectos/Smiley/ecommerce-smiley/node_modules/perfect-debounce/dist/index.mjs";
import { b as useNuxtApp, c as asyncDataDefaults, e as createError, a as __nuxt_component_0, d as defineStore, f as useRuntimeConfig } from "../server.mjs";
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrInterpolate } from "vue/server-renderer";
const isDefer = (dedupe) => dedupe === "defer" || dedupe === false;
function useAsyncData(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (_isAutoKeyNeeded(args[0], args[1])) {
    args.unshift(autoKey);
  }
  let [_key, _handler, options = {}] = args;
  const key = computed(() => toValue(_key));
  if (typeof key.value !== "string") {
    throw new TypeError("[nuxt] [useAsyncData] key must be a string.");
  }
  if (typeof _handler !== "function") {
    throw new TypeError("[nuxt] [useAsyncData] handler must be a function.");
  }
  const nuxtApp = useNuxtApp();
  options.server ??= true;
  options.default ??= getDefault;
  options.getCachedData ??= getDefaultCachedData;
  options.lazy ??= false;
  options.immediate ??= true;
  options.deep ??= asyncDataDefaults.deep;
  options.dedupe ??= "cancel";
  options._functionName || "useAsyncData";
  nuxtApp._asyncData[key.value];
  function createInitialFetch() {
    const initialFetchOptions = { cause: "initial", dedupe: options.dedupe };
    if (!nuxtApp._asyncData[key.value]?._init) {
      initialFetchOptions.cachedData = options.getCachedData(key.value, nuxtApp, { cause: "initial" });
      nuxtApp._asyncData[key.value] = createAsyncData(nuxtApp, key.value, _handler, options, initialFetchOptions.cachedData);
    }
    return () => nuxtApp._asyncData[key.value].execute(initialFetchOptions);
  }
  const initialFetch = createInitialFetch();
  const asyncData = nuxtApp._asyncData[key.value];
  asyncData._deps++;
  const fetchOnServer = options.server !== false && nuxtApp.payload.serverRendered;
  if (fetchOnServer && options.immediate) {
    const promise = initialFetch();
    if (getCurrentInstance()) {
      onServerPrefetch(() => promise);
    } else {
      nuxtApp.hook("app:created", async () => {
        await promise;
      });
    }
  }
  const asyncReturn = {
    data: writableComputedRef(() => nuxtApp._asyncData[key.value]?.data),
    pending: writableComputedRef(() => nuxtApp._asyncData[key.value]?.pending),
    status: writableComputedRef(() => nuxtApp._asyncData[key.value]?.status),
    error: writableComputedRef(() => nuxtApp._asyncData[key.value]?.error),
    refresh: (...args2) => {
      if (!nuxtApp._asyncData[key.value]?._init) {
        const initialFetch2 = createInitialFetch();
        return initialFetch2();
      }
      return nuxtApp._asyncData[key.value].execute(...args2);
    },
    execute: (...args2) => asyncReturn.refresh(...args2),
    clear: () => {
      const entry = nuxtApp._asyncData[key.value];
      if (entry?._abortController) {
        try {
          entry._abortController.abort(new DOMException("AsyncData aborted by user.", "AbortError"));
        } finally {
          entry._abortController = void 0;
        }
      }
      clearNuxtDataByKey(nuxtApp, key.value);
    }
  };
  const asyncDataPromise = Promise.resolve(nuxtApp._asyncDataPromises[key.value]).then(() => asyncReturn);
  Object.assign(asyncDataPromise, asyncReturn);
  return asyncDataPromise;
}
function writableComputedRef(getter) {
  return computed({
    get() {
      return getter()?.value;
    },
    set(value) {
      const ref2 = getter();
      if (ref2) {
        ref2.value = value;
      }
    }
  });
}
function _isAutoKeyNeeded(keyOrFetcher, fetcher) {
  if (typeof keyOrFetcher === "string") {
    return false;
  }
  if (typeof keyOrFetcher === "object" && keyOrFetcher !== null) {
    return false;
  }
  if (typeof keyOrFetcher === "function" && typeof fetcher === "function") {
    return false;
  }
  return true;
}
function clearNuxtDataByKey(nuxtApp, key) {
  if (key in nuxtApp.payload.data) {
    nuxtApp.payload.data[key] = void 0;
  }
  if (key in nuxtApp.payload._errors) {
    nuxtApp.payload._errors[key] = asyncDataDefaults.errorValue;
  }
  if (nuxtApp._asyncData[key]) {
    nuxtApp._asyncData[key].data.value = void 0;
    nuxtApp._asyncData[key].error.value = asyncDataDefaults.errorValue;
    {
      nuxtApp._asyncData[key].pending.value = false;
    }
    nuxtApp._asyncData[key].status.value = "idle";
  }
  if (key in nuxtApp._asyncDataPromises) {
    nuxtApp._asyncDataPromises[key] = void 0;
  }
}
function pick(obj, keys) {
  const newObj = {};
  for (const key of keys) {
    newObj[key] = obj[key];
  }
  return newObj;
}
function createAsyncData(nuxtApp, key, _handler, options, initialCachedData) {
  nuxtApp.payload._errors[key] ??= asyncDataDefaults.errorValue;
  const hasCustomGetCachedData = options.getCachedData !== getDefaultCachedData;
  const handler = !import.meta.prerender || !nuxtApp.ssrContext?._sharedPrerenderCache ? _handler : (nuxtApp2, options2) => {
    const value = nuxtApp2.ssrContext._sharedPrerenderCache.get(key);
    if (value) {
      return value;
    }
    const promise = Promise.resolve().then(() => nuxtApp2.runWithContext(() => _handler(nuxtApp2, options2)));
    nuxtApp2.ssrContext._sharedPrerenderCache.set(key, promise);
    return promise;
  };
  const _ref = options.deep ? ref : shallowRef;
  const hasCachedData = initialCachedData != null;
  const unsubRefreshAsyncData = nuxtApp.hook("app:data:refresh", async (keys) => {
    if (!keys || keys.includes(key)) {
      await asyncData.execute({ cause: "refresh:hook" });
    }
  });
  const asyncData = {
    data: _ref(hasCachedData ? initialCachedData : options.default()),
    pending: shallowRef(!hasCachedData),
    error: toRef(nuxtApp.payload._errors, key),
    status: shallowRef("idle"),
    execute: (...args) => {
      const [_opts, newValue = void 0] = args;
      const opts = _opts && newValue === void 0 && typeof _opts === "object" ? _opts : {};
      if (nuxtApp._asyncDataPromises[key]) {
        if (isDefer(opts.dedupe ?? options.dedupe)) {
          return nuxtApp._asyncDataPromises[key];
        }
      }
      if (opts.cause === "initial" || nuxtApp.isHydrating) {
        const cachedData = "cachedData" in opts ? opts.cachedData : options.getCachedData(key, nuxtApp, { cause: opts.cause ?? "refresh:manual" });
        if (cachedData != null) {
          nuxtApp.payload.data[key] = asyncData.data.value = cachedData;
          asyncData.error.value = asyncDataDefaults.errorValue;
          asyncData.status.value = "success";
          return Promise.resolve(cachedData);
        }
      }
      {
        asyncData.pending.value = true;
      }
      if (asyncData._abortController) {
        asyncData._abortController.abort(new DOMException("AsyncData request cancelled by deduplication", "AbortError"));
      }
      asyncData._abortController = new AbortController();
      asyncData.status.value = "pending";
      const cleanupController = new AbortController();
      const promise = new Promise(
        (resolve, reject) => {
          try {
            const timeout = opts.timeout ?? options.timeout;
            const mergedSignal = mergeAbortSignals([asyncData._abortController?.signal, opts?.signal], cleanupController.signal, timeout);
            if (mergedSignal.aborted) {
              const reason = mergedSignal.reason;
              reject(reason instanceof Error ? reason : new DOMException(String(reason ?? "Aborted"), "AbortError"));
              return;
            }
            mergedSignal.addEventListener("abort", () => {
              const reason = mergedSignal.reason;
              reject(reason instanceof Error ? reason : new DOMException(String(reason ?? "Aborted"), "AbortError"));
            }, { once: true, signal: cleanupController.signal });
            return Promise.resolve(handler(nuxtApp, { signal: mergedSignal })).then(resolve, reject);
          } catch (err) {
            reject(err);
          }
        }
      ).then(async (_result) => {
        let result = _result;
        if (options.transform) {
          result = await options.transform(_result);
        }
        if (options.pick) {
          result = pick(result, options.pick);
        }
        nuxtApp.payload.data[key] = result;
        asyncData.data.value = result;
        asyncData.error.value = asyncDataDefaults.errorValue;
        asyncData.status.value = "success";
      }).catch((error) => {
        if (nuxtApp._asyncDataPromises[key] && nuxtApp._asyncDataPromises[key] !== promise) {
          return nuxtApp._asyncDataPromises[key];
        }
        if (asyncData._abortController?.signal.aborted) {
          return nuxtApp._asyncDataPromises[key];
        }
        if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") {
          asyncData.status.value = "idle";
          return nuxtApp._asyncDataPromises[key];
        }
        asyncData.error.value = createError(error);
        asyncData.data.value = unref(options.default());
        asyncData.status.value = "error";
      }).finally(() => {
        {
          asyncData.pending.value = false;
        }
        cleanupController.abort();
        delete nuxtApp._asyncDataPromises[key];
      });
      nuxtApp._asyncDataPromises[key] = promise;
      return nuxtApp._asyncDataPromises[key];
    },
    _execute: debounce((...args) => asyncData.execute(...args), 0, { leading: true }),
    _default: options.default,
    _deps: 0,
    _init: true,
    _hash: void 0,
    _off: () => {
      unsubRefreshAsyncData();
      if (nuxtApp._asyncData[key]?._init) {
        nuxtApp._asyncData[key]._init = false;
      }
      if (!hasCustomGetCachedData) {
        nextTick(() => {
          if (!nuxtApp._asyncData[key]?._init) {
            clearNuxtDataByKey(nuxtApp, key);
            asyncData.execute = () => Promise.resolve();
            asyncData.data.value = asyncDataDefaults.value;
          }
        });
      }
    }
  };
  return asyncData;
}
const getDefault = () => asyncDataDefaults.value;
const getDefaultCachedData = (key, nuxtApp, ctx) => {
  if (nuxtApp.isHydrating) {
    return nuxtApp.payload.data[key];
  }
  if (ctx.cause !== "refresh:manual" && ctx.cause !== "refresh:hook") {
    return nuxtApp.static.data[key];
  }
};
function mergeAbortSignals(signals, cleanupSignal, timeout) {
  const list = signals.filter((s) => !!s);
  if (typeof timeout === "number" && timeout >= 0) {
    const timeoutSignal = AbortSignal.timeout?.(timeout);
    if (timeoutSignal) {
      list.push(timeoutSignal);
    }
  }
  if (AbortSignal.any) {
    return AbortSignal.any(list);
  }
  const controller = new AbortController();
  for (const sig of list) {
    if (sig.aborted) {
      const reason = sig.reason ?? new DOMException("Aborted", "AbortError");
      try {
        controller.abort(reason);
      } catch {
        controller.abort();
      }
      return controller.signal;
    }
  }
  const onAbort = () => {
    const abortedSignal = list.find((s) => s.aborted);
    const reason = abortedSignal?.reason ?? new DOMException("Aborted", "AbortError");
    try {
      controller.abort(reason);
    } catch {
      controller.abort();
    }
  };
  for (const sig of list) {
    sig.addEventListener?.("abort", onAbort, { once: true, signal: cleanupSignal });
  }
  return controller.signal;
}
const logoUrl = "" + __buildAssetsURL("smileypunk_logo.DkBNFv78.png");
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "AppHeader",
  __ssrInlineRender: true,
  props: {
    itemCount: {},
    cartLabel: { default: "Carrito" },
    cartLink: { default: "/cart" },
    centered: { type: Boolean, default: false }
  },
  setup(__props) {
    const props = __props;
    const showCart = computed(() => !props.centered && typeof props.itemCount === "number");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<header${ssrRenderAttrs(mergeProps({
        class: ["topbar app-header", { "is-centered": __props.centered }]
      }, _attrs))}>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        class: "brand",
        to: "/"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<img class="brand-logo"${ssrRenderAttr("src", unref(logoUrl))} alt="Smiley Punk"${_scopeId}>`);
          } else {
            return [
              createVNode("img", {
                class: "brand-logo",
                src: unref(logoUrl),
                alt: "Smiley Punk"
              }, null, 8, ["src"])
            ];
          }
        }),
        _: 1
      }, _parent));
      if (unref(showCart) && __props.cartLink) {
        _push(ssrRenderComponent(_component_NuxtLink, {
          class: "cart-pill",
          to: __props.cartLink
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span${_scopeId}>${ssrInterpolate(__props.cartLabel)}</span><strong${_scopeId}>${ssrInterpolate(__props.itemCount)}</strong>`);
            } else {
              return [
                createVNode("span", null, toDisplayString(__props.cartLabel), 1),
                createVNode("strong", null, toDisplayString(__props.itemCount), 1)
              ];
            }
          }),
          _: 1
        }, _parent));
      } else if (unref(showCart)) {
        _push(`<div class="cart-pill"><span>${ssrInterpolate(__props.cartLabel)}</span><strong>${ssrInterpolate(__props.itemCount)}</strong></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</header>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AppHeader.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const readCartKey = () => {
  return null;
};
const writeCartKey = (key) => {
  return;
};
const resolveItems = (payload) => {
  if (!payload) return [];
  const raw = payload.items || payload.cart_items;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object") {
    return Object.entries(raw).map(([key, value]) => {
      if (value && typeof value === "object") {
        return { key, ...value };
      }
      return { key, value };
    });
  }
  return [];
};
const getTotalQuantity = (items) => {
  if (!items.length) return 0;
  return items.reduce((total, item) => {
    if (!item || typeof item !== "object") return total + 1;
    const raw = item.quantity ?? item.qty ?? 1;
    const parsed = Number(raw);
    return total + (Number.isFinite(parsed) && parsed > 0 ? parsed : 1);
  }, 0);
};
const isCartResponse = (payload) => {
  if (!payload) return false;
  return "items" in payload || "cart_items" in payload || "item_count" in payload || "totals" in payload;
};
const useCartStore = defineStore("cart", {
  state: () => ({
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
    async addItem(productId, quantity = 1, variationId, variation) {
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
      return data;
    },
    async updateItem(key, quantity) {
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
    async removeItem(key) {
      const data = await this.requestCart(`/cart/item/${encodeURIComponent(key)}`, "DELETE");
      if (!isCartResponse(data)) {
        await this.fetchCart();
      }
      return data;
    },
    async requestCart(path, method, body) {
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
        const mergedBody = method === "GET" ? void 0 : {
          ...body || {},
          ...this.cartKey && !("cart_key" in (body || {})) ? { cart_key: this.cartKey } : {}
        };
        const payload = mergedBody && method !== "GET" ? new URLSearchParams(
          Object.entries(mergedBody).reduce((acc, [key, value]) => {
            if (value === void 0 || value === null) return acc;
            acc[key] = String(value);
            return acc;
          }, {})
        ) : void 0;
        const data = await $fetch(url.toString(), {
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
        const responseKey = typeof data.cart_key === "string" ? data.cart_key : typeof data.cartKey === "string" ? data.cartKey : null;
        if (responseKey) {
          this.cartKey = responseKey;
          writeCartKey(responseKey);
        }
        return data;
      } catch (error) {
        const message = typeof error?.data?.message === "string" ? error.data?.message : error instanceof Error ? error.message : "Cart request failed";
        this.error = message;
        return null;
      } finally {
        this.loading = false;
      }
    }
  }
});
export {
  _sfc_main as _,
  useAsyncData as a,
  useCartStore as u
};
//# sourceMappingURL=cart-CIWDZvlP.js.map

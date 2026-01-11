import { a as buildAssetsURL } from '../routes/renderer.mjs';
import { defineComponent, computed, toValue, getCurrentInstance, onServerPrefetch, mergeProps, withCtx, unref, createVNode, toDisplayString, ref, shallowRef, toRef, nextTick, useSSRContext } from 'vue';
import { debounce } from 'perfect-debounce';
import { d as defineStore, f as useRuntimeConfig, b as useNuxtApp, c as asyncDataDefaults, a as __nuxt_component_0$1, e as createError } from './server.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrInterpolate } from 'vue/server-renderer';

const isDefer = (dedupe) => dedupe === "defer" || dedupe === false;
function useAsyncData(...args) {
  var _a, _b, _c, _d, _e, _f, _g;
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
  (_a = options.server) != null ? _a : options.server = true;
  (_b = options.default) != null ? _b : options.default = getDefault;
  (_c = options.getCachedData) != null ? _c : options.getCachedData = getDefaultCachedData;
  (_d = options.lazy) != null ? _d : options.lazy = false;
  (_e = options.immediate) != null ? _e : options.immediate = true;
  (_f = options.deep) != null ? _f : options.deep = asyncDataDefaults.deep;
  (_g = options.dedupe) != null ? _g : options.dedupe = "cancel";
  options._functionName || "useAsyncData";
  nuxtApp._asyncData[key.value];
  function createInitialFetch() {
    var _a2;
    const initialFetchOptions = { cause: "initial", dedupe: options.dedupe };
    if (!((_a2 = nuxtApp._asyncData[key.value]) == null ? void 0 : _a2._init)) {
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
    data: writableComputedRef(() => {
      var _a2;
      return (_a2 = nuxtApp._asyncData[key.value]) == null ? void 0 : _a2.data;
    }),
    pending: writableComputedRef(() => {
      var _a2;
      return (_a2 = nuxtApp._asyncData[key.value]) == null ? void 0 : _a2.pending;
    }),
    status: writableComputedRef(() => {
      var _a2;
      return (_a2 = nuxtApp._asyncData[key.value]) == null ? void 0 : _a2.status;
    }),
    error: writableComputedRef(() => {
      var _a2;
      return (_a2 = nuxtApp._asyncData[key.value]) == null ? void 0 : _a2.error;
    }),
    refresh: (...args2) => {
      var _a2;
      if (!((_a2 = nuxtApp._asyncData[key.value]) == null ? void 0 : _a2._init)) {
        const initialFetch2 = createInitialFetch();
        return initialFetch2();
      }
      return nuxtApp._asyncData[key.value].execute(...args2);
    },
    execute: (...args2) => asyncReturn.refresh(...args2),
    clear: () => {
      const entry = nuxtApp._asyncData[key.value];
      if (entry == null ? void 0 : entry._abortController) {
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
      var _a;
      return (_a = getter()) == null ? void 0 : _a.value;
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
  var _a, _b;
  (_b = (_a = nuxtApp.payload._errors)[key]) != null ? _b : _a[key] = asyncDataDefaults.errorValue;
  const hasCustomGetCachedData = options.getCachedData !== getDefaultCachedData;
  const handler = _handler ;
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
      var _a2, _b2;
      const [_opts, newValue = void 0] = args;
      const opts = _opts && newValue === void 0 && typeof _opts === "object" ? _opts : {};
      if (nuxtApp._asyncDataPromises[key]) {
        if (isDefer((_a2 = opts.dedupe) != null ? _a2 : options.dedupe)) {
          return nuxtApp._asyncDataPromises[key];
        }
      }
      if (opts.cause === "initial" || nuxtApp.isHydrating) {
        const cachedData = "cachedData" in opts ? opts.cachedData : options.getCachedData(key, nuxtApp, { cause: (_b2 = opts.cause) != null ? _b2 : "refresh:manual" });
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
          var _a3, _b3;
          try {
            const timeout = (_a3 = opts.timeout) != null ? _a3 : options.timeout;
            const mergedSignal = mergeAbortSignals([(_b3 = asyncData._abortController) == null ? void 0 : _b3.signal, opts == null ? void 0 : opts.signal], cleanupController.signal, timeout);
            if (mergedSignal.aborted) {
              const reason = mergedSignal.reason;
              reject(reason instanceof Error ? reason : new DOMException(String(reason != null ? reason : "Aborted"), "AbortError"));
              return;
            }
            mergedSignal.addEventListener("abort", () => {
              const reason = mergedSignal.reason;
              reject(reason instanceof Error ? reason : new DOMException(String(reason != null ? reason : "Aborted"), "AbortError"));
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
        var _a3;
        if (nuxtApp._asyncDataPromises[key] && nuxtApp._asyncDataPromises[key] !== promise) {
          return nuxtApp._asyncDataPromises[key];
        }
        if ((_a3 = asyncData._abortController) == null ? void 0 : _a3.signal.aborted) {
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
      var _a2;
      unsubRefreshAsyncData();
      if ((_a2 = nuxtApp._asyncData[key]) == null ? void 0 : _a2._init) {
        nuxtApp._asyncData[key]._init = false;
      }
      if (!hasCustomGetCachedData) {
        nextTick(() => {
          var _a3;
          if (!((_a3 = nuxtApp._asyncData[key]) == null ? void 0 : _a3._init)) {
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
  var _a, _b, _c;
  const list = signals.filter((s) => !!s);
  if (typeof timeout === "number" && timeout >= 0) {
    const timeoutSignal = (_a = AbortSignal.timeout) == null ? void 0 : _a.call(AbortSignal, timeout);
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
      const reason = (_b = sig.reason) != null ? _b : new DOMException("Aborted", "AbortError");
      try {
        controller.abort(reason);
      } catch {
        controller.abort();
      }
      return controller.signal;
    }
  }
  const onAbort = () => {
    var _a2;
    const abortedSignal = list.find((s) => s.aborted);
    const reason = (_a2 = abortedSignal == null ? void 0 : abortedSignal.reason) != null ? _a2 : new DOMException("Aborted", "AbortError");
    try {
      controller.abort(reason);
    } catch {
      controller.abort();
    }
  };
  for (const sig of list) {
    (_c = sig.addEventListener) == null ? void 0 : _c.call(sig, "abort", onAbort, { once: true, signal: cleanupSignal });
  }
  return controller.signal;
}
const logoUrl = "" + buildAssetsURL("smileypunk_logo.DkBNFv78.png");
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
      const _component_NuxtLink = __nuxt_component_0$1;
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
    var _a, _b;
    if (!item || typeof item !== "object") return total + 1;
    const raw = (_b = (_a = item.quantity) != null ? _a : item.qty) != null ? _b : 1;
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
      var _a, _b;
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
        const message = typeof ((_a = error == null ? void 0 : error.data) == null ? void 0 : _a.message) === "string" ? (_b = error.data) == null ? void 0 : _b.message : error instanceof Error ? error.message : "Cart request failed";
        this.error = message;
        return null;
      } finally {
        this.loading = false;
      }
    }
  }
});

export { _sfc_main as _, useAsyncData as a, useCartStore as u };
//# sourceMappingURL=cart-CIWDZvlP.mjs.map

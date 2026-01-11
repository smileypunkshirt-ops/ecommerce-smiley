import { u as useRuntimeConfig, c as createError, w as withQuery } from '../nitro/nitro.mjs';

const DEFAULT_BASE = "https://smileyapi.mrqzstudio.com";
const buildAuthHeader = (key, secret) => {
  const token = Buffer.from(`${key}:${secret}`).toString("base64");
  return {
    Authorization: `Basic ${token}`
  };
};
const wooRequest = async ({
  path,
  method = "GET",
  query,
  body,
  auth = "read"
}) => {
  const config = useRuntimeConfig();
  const base = config.wcBase || DEFAULT_BASE;
  const key = auth === "write" ? config.wcWriteKey : config.wcReadKey;
  const secret = auth === "write" ? config.wcWriteSecret : config.wcReadSecret;
  if (!key || !secret) {
    throw createError({
      statusCode: 500,
      statusMessage: "WooCommerce API keys missing"
    });
  }
  const url = withQuery(`${base}/wp-json/wc/v3${path}`, query || {});
  return await $fetch(url, {
    method,
    headers: buildAuthHeader(key, secret),
    body
  });
};

export { wooRequest as w };
//# sourceMappingURL=woocommerce.mjs.map

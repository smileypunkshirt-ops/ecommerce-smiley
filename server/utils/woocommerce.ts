import { createError } from "h3";
import { withQuery } from "ufo";

const DEFAULT_BASE = "https://smileyapi.mrqzstudio.com";

type WooAuthMode = "read" | "write";

interface WooRequestOptions<TBody> {
  path: string;
  method?: "GET" | "POST";
  query?: Record<string, string | number | undefined>;
  body?: TBody;
  auth?: WooAuthMode;
}

const buildAuthHeader = (key: string, secret: string) => {
  const token = Buffer.from(`${key}:${secret}`).toString("base64");
  return {
    Authorization: `Basic ${token}`
  };
};

export const wooRequest = async <TResponse, TBody = unknown>({
  path,
  method = "GET",
  query,
  body,
  auth = "read"
}: WooRequestOptions<TBody>): Promise<TResponse> => {
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

  return await $fetch<TResponse>(url, {
    method,
    headers: buildAuthHeader(key, secret),
    body
  });
};

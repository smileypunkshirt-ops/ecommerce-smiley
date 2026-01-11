import { d as defineEventHandler, g as getQuery } from '../../../nitro/nitro.mjs';
import { w as wooRequest } from '../../../_/woocommerce.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const stripHtml = (value = "") => value.replace(/<[^>]*>/g, "").trim();
const normalizeProduct = (product) => {
  var _a;
  const image = (_a = product.images) == null ? void 0 : _a[0];
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    regularPrice: product.regular_price,
    salePrice: product.sale_price,
    image: (image == null ? void 0 : image.src) || null,
    imageAlt: (image == null ? void 0 : image.alt) || product.name,
    shortDescription: stripHtml(product.short_description),
    description: stripHtml(product.description)
  };
};
const products_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const perPage = Number(query.per_page) || 8;
  const page = Number(query.page) || 1;
  const products = await wooRequest({
    path: "/products",
    query: {
      per_page: perPage,
      page,
      status: "publish",
      orderby: "date",
      order: "desc"
    },
    auth: "read"
  });
  return {
    items: products.map(normalizeProduct),
    page,
    perPage
  };
});

export { products_get as default };
//# sourceMappingURL=products.get.mjs.map

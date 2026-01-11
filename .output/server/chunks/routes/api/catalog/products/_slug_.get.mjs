import { d as defineEventHandler, c as createError } from '../../../../nitro/nitro.mjs';
import { w as wooRequest } from '../../../../_/woocommerce.mjs';
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
const _slug__get = defineEventHandler(async (event) => {
  var _a;
  const slug = (_a = event.context.params) == null ? void 0 : _a.slug;
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "Product slug required" });
  }
  const products = await wooRequest({
    path: "/products",
    query: {
      slug
    },
    auth: "read"
  });
  const product = products[0];
  if (!product) {
    throw createError({ statusCode: 404, statusMessage: "Product not found" });
  }
  return normalizeProduct(product);
});

export { _slug__get as default };
//# sourceMappingURL=_slug_.get.mjs.map

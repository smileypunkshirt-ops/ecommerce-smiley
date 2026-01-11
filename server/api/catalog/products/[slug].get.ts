import { createError } from "h3";
import { wooRequest } from "~/server/utils/woocommerce";
import type { CatalogProduct, WooProduct } from "~/types/product";

const stripHtml = (value = "") => value.replace(/<[^>]*>/g, "").trim();

const normalizeProduct = (product: WooProduct): CatalogProduct => {
  const image = product.images?.[0];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    regularPrice: product.regular_price,
    salePrice: product.sale_price,
    image: image?.src || null,
    imageAlt: image?.alt || product.name,
    shortDescription: stripHtml(product.short_description),
    description: stripHtml(product.description)
  };
};

export default defineEventHandler(async (event) => {
  const slug = event.context.params?.slug;

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "Product slug required" });
  }

  const products = await wooRequest<WooProduct[]>({
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

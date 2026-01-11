import { createError, readBody } from "h3";
import { wooRequest } from "~/server/utils/woocommerce";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body?.line_items || !Array.isArray(body.line_items) || body.line_items.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "line_items are required to create an order"
    });
  }

  const order = await wooRequest({
    path: "/orders",
    method: "POST",
    body,
    auth: "write"
  });

  return order;
});

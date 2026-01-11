import { d as defineEventHandler, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
import { w as wooRequest } from '../../../_/woocommerce.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const order_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!(body == null ? void 0 : body.line_items) || !Array.isArray(body.line_items) || body.line_items.length === 0) {
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

export { order_post as default };
//# sourceMappingURL=order.post.mjs.map

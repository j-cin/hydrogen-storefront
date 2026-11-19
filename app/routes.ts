import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("products/:handle", "routes/product.tsx"),
  route("collections", "routes/collections.tsx"),
  // Static segment outranks :handle; the store has no "all" collection.
  route("collections/all", "routes/all-products.tsx"),
  route("collections/:handle", "routes/collection.tsx"),
  route("cart", "routes/cart.tsx"),
  route("search", "routes/search.tsx"),
  route("pages/:handle", "routes/page.tsx"),
  route("blogs/:blogHandle", "routes/blog.tsx"),
  route("blogs/:blogHandle/:articleHandle", "routes/article.tsx"),
  route("producers/:handle", "routes/producer.tsx"),
  route("brew", "routes/brew.tsx"),
  route("account", "routes/account.tsx"),
  route("account/orders", "routes/account-orders.tsx"),
  route("account/addresses", "routes/account-addresses.tsx"),
  route("*", "routes/catchall.tsx"),
] satisfies RouteConfig;

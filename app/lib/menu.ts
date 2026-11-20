// Shopify menus (Online Store > Navigation) for the header, mobile nav and footer.
// The Storefront API returns absolute URLs on the shop's own domain, so links to
// the shop become app-relative paths and anything else stays an external link.

export type NavItem = {
  id: string;
  title: string;
  /** App-relative path for shop links, absolute URL for external links. */
  to: string;
  external: boolean;
  items: NavItem[];
};

type MenuItemData = {
  id: string;
  title: string;
  url?: string | null;
  type?: string;
  items?: readonly MenuItemData[];
};

function isShopHost(host: string, shopHosts: readonly string[]) {
  return host.endsWith(".myshopify.com") || shopHosts.includes(host);
}

export function toNavTarget(
  url: string | null | undefined,
  shopUrls: readonly string[],
): { to: string; external: boolean } {
  if (!url) return { to: "/", external: false };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Already relative.
    return { to: url, external: false };
  }

  const shopHosts = shopUrls.flatMap((shopUrl) => {
    try {
      return [new URL(shopUrl).host];
    } catch {
      return [];
    }
  });

  if (!isShopHost(parsed.host, shopHosts)) return { to: url, external: true };
  return { to: `${parsed.pathname}${parsed.search}${parsed.hash}`, external: false };
}

export function normalizeMenu(
  items: readonly MenuItemData[] | null | undefined,
  shopUrls: readonly string[],
): NavItem[] {
  return (items ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    ...toNavTarget(item.url, shopUrls),
    items: normalizeMenu(item.items, shopUrls),
  }));
}

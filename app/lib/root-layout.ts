import { gql, type StorefrontApi, type StorefrontClient } from "@shopify/hydrogen";

import { normalizeMenu, type NavItem } from "~/lib/menu";
import { getNextRoastDate } from "~/lib/roast-date";
import { normalizeStorefrontShop, type StorefrontShop } from "~/lib/storefront-shop";

export const ROOT_LAYOUT_QUERY = gql(`
  query RootLayout($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    shop {
      id
      name
      brand {
        logo {
          alt
          image {
            url
            altText
            width
            height
          }
        }
      }
      paymentSettings {
        acceptedCardBrands
        supportedDigitalWallets
      }
      primaryDomain {
        url
      }
      # Optional override for the computed Monday roast (a date metafield with
      # Storefront access). Null when the definition doesn't exist.
      nextRoastDate: metafield(namespace: "custom", key: "next_roast_date") {
        value
      }
      privacyPolicy {
        title
        handle
      }
      refundPolicy {
        title
        handle
      }
      shippingPolicy {
        title
        handle
      }
      termsOfService {
        title
        handle
      }
    }
    mainMenu: menu(handle: "main-menu") {
      items {
        id
        title
        url
        type
        items {
          id
          title
          url
          type
        }
      }
    }
    # Top-level items are column headings (Shop, Learn, Company); their
    # children are the column links.
    footerMenu: menu(handle: "footer") {
      items {
        id
        title
        url
        type
        items {
          id
          title
          url
          type
        }
      }
    }
    localization {
      country {
        currency {
          isoCode
        }
      }
    }
  }
`);

export type RootLayoutQueryResult = StorefrontApi.ResultOf<typeof ROOT_LAYOUT_QUERY>;

type RootLayoutLoaderData = {
  shopId: string;
  shopInfo: StorefrontShop;
  // Browse events carry no price, so shopify.js reads their currency from
  // window.Shopify.currency.active. The cart tracker only sets that once a cart exists,
  // so the bootstrap needs it up front.
  currency: string;
  mainMenu: NavItem[];
  footerMenu: NavItem[];
  /** ISO date (YYYY-MM-DD) of the next weekly roast. */
  nextRoastDate: string;
  /** Store policies that exist, in footer order. */
  policies: PolicyLink[];
};

export type PolicyLink = { title: string; to: string };

export async function loadRootLayout(
  storefrontClient: Pick<StorefrontClient, "graphql">,
): Promise<RootLayoutLoaderData> {
  const layoutResult = await storefrontClient.graphql(ROOT_LAYOUT_QUERY);

  if (layoutResult.errors) {
    console.error(
      `Root layout query failed: ${layoutResult.errors.map(({ message }) => message).join("\n")}`,
    );
  }

  // Upstream error details are logged above, not exposed through the boundary.
  if (!layoutResult.data) throw new Error("Root layout data is unavailable.");

  const { shop, localization, mainMenu, footerMenu } = layoutResult.data;
  const storeHosts = [shop.primaryDomain.url];
  return {
    shopId: shop.id,
    shopInfo: normalizeStorefrontShop(shop),
    currency: localization.country.currency.isoCode,
    mainMenu: normalizeMenu(mainMenu?.items, storeHosts),
    footerMenu: normalizeMenu(footerMenu?.items, storeHosts),
    nextRoastDate: getNextRoastDate(new Date(), shop.nextRoastDate?.value),
    policies: [
      shop.shippingPolicy,
      shop.refundPolicy,
      shop.privacyPolicy,
      shop.termsOfService,
    ].flatMap((policy) =>
      policy ? [{ title: policy.title, to: `/policies/${policy.handle}` }] : [],
    ),
  };
}

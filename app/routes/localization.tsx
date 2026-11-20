import { gql } from "@shopify/hydrogen";
import { redirect } from "react-router";

import { cartHandlers } from "~/lib/cart-handlers";
import { findMarket, safeRedirectPath, serializeMarketCookie } from "~/lib/market";
import { storefrontClientContext } from "~/lib/storefront";

import type { Route } from "./+types/localization";

// Moves an existing cart into the new market so checkout prices in its currency.
const CART_BUYER_COUNTRY_MUTATION = gql(`
  mutation CartBuyerCountry($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      userErrors {
        message
      }
    }
  }
`);

// Footer country selector. A plain form POST, so it works before hydration.
export async function action({ context, request }: Route.ActionArgs) {
  const form = await request.formData();
  const market = findMarket(form.get("country")?.toString());
  const redirectTo = safeRedirectPath(form.get("redirectTo"));
  if (!market) return redirect(redirectTo);

  const storefrontClient = context.get(storefrontClientContext);
  const { cart } = (await cartHandlers.get({ storefrontClient, request })).data;
  if (cart?.id) {
    const { data, errors } = await storefrontClient.graphql(CART_BUYER_COUNTRY_MUTATION, {
      variables: { cartId: cart.id, buyerIdentity: { countryCode: market.country } },
    });
    const userErrors = data?.cartBuyerIdentityUpdate?.userErrors ?? [];
    if (errors || userErrors.length > 0) {
      console.error("Cart country update failed", errors ?? userErrors);
    }
  }

  const secure = new URL(request.url).protocol === "https:";
  return redirect(redirectTo, {
    headers: { "Set-Cookie": serializeMarketCookie(market, secure) },
  });
}

export function loader() {
  return redirect("/");
}

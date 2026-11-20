import { gql } from "@shopify/hydrogen";

import { Breadcrumb } from "~/components/Breadcrumb";
import { storefrontClientContext } from "~/lib/storefront";
import { formatPageTitle, getShopNameFromRootMatch } from "~/lib/storefront-shop";

import type { Route } from "./+types/policy";

// Store policies from Settings > Policies, linked from the footer's bottom row.
const POLICIES_QUERY = gql(`
  query Policies($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    shop {
      privacyPolicy {
        ...Policy
      }
      refundPolicy {
        ...Policy
      }
      shippingPolicy {
        ...Policy
      }
      termsOfService {
        ...Policy
      }
    }
  }
  fragment Policy on ShopPolicy {
    title
    handle
    body
  }
`);

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const { data } = await storefrontClient.graphql(POLICIES_QUERY);
  const shop = data?.shop;
  const policy = [
    shop?.privacyPolicy,
    shop?.refundPolicy,
    shop?.shippingPolicy,
    shop?.termsOfService,
  ].find((candidate) => candidate?.handle === params.handle);
  if (!policy) throw new Response("Policy not found", { status: 404 });

  return { policy, origin: new URL(request.url).origin };
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  return [{ title: formatPageTitle(loaderData?.policy.title ?? "Policy not found", shopName) }];
}

export default function PolicyRoute({ loaderData }: Route.ComponentProps) {
  const { policy, origin } = loaderData;
  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      <div className="max-w-page px-margin mx-auto w-full py-8 md:py-12">
        <Breadcrumb
          crumbs={[{ label: policy.title, to: `/policies/${policy.handle}` }]}
          origin={origin}
        />
        <article className="max-w-prose">
          <h1 className="type-display text-on-surface mb-8">{policy.title}</h1>
          {/* Merchant-authored HTML from the Shopify admin. */}
          <div className="richtext type-body" dangerouslySetInnerHTML={{ __html: policy.body }} />
        </article>
      </div>
    </main>
  );
}

import { gql } from "@shopify/hydrogen";

import { Breadcrumb } from "~/components/Breadcrumb";
import { storefrontClientContext } from "~/lib/storefront";
import { formatPageTitle, getShopNameFromRootMatch } from "~/lib/storefront-shop";

import type { Route } from "./+types/page";

// Shopify Online Store pages: Our Story, Subscribe, FAQ, Wholesale and so on.
const PAGE_QUERY = gql(`
  query Page($handle: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    page(handle: $handle) {
      id
      handle
      title
      body
      seo {
        title
        description
      }
    }
  }
`);

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const { data } = await storefrontClient.graphql(PAGE_QUERY, {
    variables: { handle: params.handle },
  });
  if (!data?.page) throw new Response("Page not found", { status: 404 });

  return { page: data.page, origin: new URL(request.url).origin };
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  const page = loaderData?.page;
  if (!page) return [{ title: formatPageTitle("Page not found", shopName) }];
  return [
    { title: formatPageTitle(page.seo?.title || page.title, shopName) },
    ...(page.seo?.description ? [{ name: "description", content: page.seo.description }] : []),
  ];
}

export default function PageRoute({ loaderData }: Route.ComponentProps) {
  const { page, origin } = loaderData;
  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      <div className="max-w-page px-margin mx-auto w-full py-8 md:py-12">
        <Breadcrumb crumbs={[{ label: page.title, to: `/pages/${page.handle}` }]} origin={origin} />
        <article className="max-w-prose">
          <h1 className="type-display text-on-surface mb-8">{page.title}</h1>
          {/* Merchant-authored HTML from the Shopify admin. */}
          <div className="richtext type-body" dangerouslySetInnerHTML={{ __html: page.body }} />
        </article>
      </div>
    </main>
  );
}

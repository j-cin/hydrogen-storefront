import { gql } from "@shopify/hydrogen";

import { Breadcrumb } from "~/components/Breadcrumb";
import { RichText } from "~/components/RichText";
import { storefrontClientContext } from "~/lib/storefront";
import { formatPageTitle, getShopNameFromRootMatch } from "~/lib/storefront-shop";

import type { Route } from "./+types/faq";

// /pages/faq renders `faq_item` metaobjects (question · answer (rich text) ·
// category) grouped by category. The Online Store "faq" page still supplies the
// title and SEO, and its body is the fallback when there are no FAQ entries yet.
const FAQ_QUERY = gql(`
  query Faq($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    page(handle: "faq") {
      title
      body
      seo {
        title
        description
      }
    }
    faqItems: metaobjects(type: "faq_item", first: 100) {
      nodes {
        id
        handle
        question: field(key: "question") {
          value
        }
        answer: field(key: "answer") {
          value
        }
        category: field(key: "category") {
          value
        }
      }
    }
  }
`);

// Matches the category choices on the faq_item definition; unknown ones sort last.
const CATEGORY_ORDER = ["Shipping", "Subscriptions", "Orders", "Brewing"];

export async function loader({ context, request }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const { data } = await storefrontClient.graphql(FAQ_QUERY);

  const groups = new Map<string, { id: string; handle: string; question: string; answer: string | null }[]>();
  for (const item of data?.faqItems.nodes ?? []) {
    if (!item.question?.value) continue;
    const category = item.category?.value || "General";
    const list = groups.get(category) ?? [];
    list.push({
      id: item.id,
      handle: item.handle,
      question: item.question.value,
      answer: item.answer?.value ?? null,
    });
    groups.set(category, list);
  }

  const rank = (category: string) => {
    const index = CATEGORY_ORDER.indexOf(category);
    return index === -1 ? CATEGORY_ORDER.length : index;
  };
  const categories = [...groups.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([name, items]) => ({ name, items }));

  return {
    title: data?.page?.title ?? "FAQ",
    seo: data?.page?.seo ?? null,
    fallbackBody: categories.length === 0 ? (data?.page?.body ?? null) : null,
    categories,
    origin: new URL(request.url).origin,
  };
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  return [
    { title: formatPageTitle(loaderData?.seo?.title || loaderData?.title || "FAQ", shopName) },
    {
      name: "description",
      content:
        loaderData?.seo?.description ||
        "Answers about roasting, shipping, subscriptions and brewing.",
    },
  ];
}

export default function FaqRoute({ loaderData }: Route.ComponentProps) {
  const { title, categories, fallbackBody, origin } = loaderData;

  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      <div className="max-w-page px-margin mx-auto w-full py-8 md:py-12">
        <Breadcrumb crumbs={[{ label: title, to: "/pages/faq" }]} origin={origin} />
        <div className="max-w-prose">
          <h1 className="type-display text-on-surface mb-8">{title}</h1>
          {fallbackBody ? (
            // Merchant-authored HTML from the Shopify admin.
            <div className="richtext type-body" dangerouslySetInnerHTML={{ __html: fallbackBody }} />
          ) : (
            categories.map((category) => (
              <section
                key={category.name}
                aria-labelledby={`faq-${category.name}`}
                className="mb-10"
              >
                <h2 id={`faq-${category.name}`} className="type-heading-lg text-on-surface mb-2">
                  {category.name}
                </h2>
                <div className="border-border border-t">
                  {category.items.map((item) => (
                    <details key={item.id} id={item.handle} className="group border-border border-b">
                      <summary className="marker-hidden text-on-surface hover:text-on-surface-secondary flex cursor-pointer items-center justify-between gap-4 px-1 py-4 font-semibold">
                        <span>{item.question}</span>
                        <img
                          src="/icons/icon-chevron-down.svg"
                          alt=""
                          aria-hidden="true"
                          className="size-4 shrink-0 group-open:rotate-180 motion-safe:transition-transform motion-safe:duration-200"
                        />
                      </summary>
                      <RichText
                        value={item.answer}
                        className="richtext type-body text-on-surface-secondary px-1 pb-4"
                      />
                    </details>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

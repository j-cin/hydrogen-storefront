import { gql } from "@shopify/hydrogen";
import { Link } from "react-router";

import { RichText } from "~/components/RichText";
import { formatPrice } from "~/lib/money";
import { storefrontClientContext } from "~/lib/storefront";
import { formatPageTitle, getShopNameFromRootMatch } from "~/lib/storefront-shop";

import type { Route } from "./+types/subscribe";

// /pages/subscribe: how subscriptions work, a frequency explainer, the
// Roaster's Choice feature and the Subscriptions FAQ (faq_item metaobjects with
// category "Subscriptions"). The Online Store "subscribe" page supplies the SEO.
const SUBSCRIBE_QUERY = gql(`
  query SubscribePage($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    page(handle: "subscribe") {
      seo {
        title
        description
      }
    }
    roastersChoice: product(handle: "roasters-choice") {
      handle
      title
      descriptionHtml
      featuredImage {
        url
        altText
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
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

export async function loader({ context }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const { data } = await storefrontClient.graphql(SUBSCRIBE_QUERY);

  const faqs = (data?.faqItems.nodes ?? [])
    .filter((item) => item.category?.value === "Subscriptions" && item.question?.value)
    .map((item) => ({
      id: item.id,
      handle: item.handle,
      question: item.question!.value!,
      answer: item.answer?.value ?? null,
    }));

  return { seo: data?.page?.seo ?? null, roastersChoice: data?.roastersChoice ?? null, faqs };
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  return [
    { title: formatPageTitle(loaderData?.seo?.title || "Coffee subscriptions", shopName) },
    {
      name: "description",
      content:
        loaderData?.seo?.description ||
        "Fresh coffee every 2 or 4 weeks. Save 10% on every bag, skip or cancel any time.",
    },
  ];
}

const sectionHeadingClass = "type-heading-xl text-on-surface";
const primaryButtonClass =
  "rounded-button button-primary focus-visible:outline-apricot inline-flex h-12 w-fit shrink-0 items-center justify-center px-7 text-base font-semibold no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:active:scale-[0.97]";

function Overline({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <p className={`type-overline mb-2 ${light ? "text-surface/75" : "text-on-surface-secondary"}`}>
      {children}
    </p>
  );
}

const STEPS = [
  {
    title: "Pick a coffee",
    body: "Any bag in the shop, or let us choose with Roaster's Choice.",
  },
  {
    title: "Choose how often",
    body: "Every 2 or 4 weeks. Change it whenever your habits do.",
  },
  {
    title: "It arrives fresh",
    body: "We roast on Monday and ship within 72 hours. Shipping is always free.",
  },
] as const;

// 250 g makes about 16 cups at 15 g a cup.
const FREQUENCIES = [
  {
    every: "Every 2 weeks",
    who: "One cup a day",
    detail: "A 250 g bag lasts about two weeks at one cup a day. Pick a 1 kg bag for a household or an office.",
  },
  {
    every: "Every 4 weeks",
    who: "A cup most days, or weekends",
    detail: "A 250 g bag every four weeks suits a lighter habit. Two cups a day? Choose a 1 kg bag on this schedule.",
  },
] as const;

const PERKS = ["10% off every bag", "Free shipping, always", "Skip, swap or cancel any time"];

export default function SubscribeRoute({ loaderData }: Route.ComponentProps) {
  const { roastersChoice, faqs } = loaderData;

  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      {/* Intro */}
      <section className="bg-on-surface text-surface w-full" aria-labelledby="subscribe-heading">
        <div className="max-w-page px-margin mx-auto grid gap-10 py-20 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-end md:py-28">
          <div>
            <Overline light>Subscriptions</Overline>
            <h1 id="subscribe-heading" className="type-display max-w-2xl">
              Fresh coffee that just shows up.
            </h1>
            <p className="type-body-lg text-surface/80 mt-5 max-w-lg">
              Pick a coffee, pick how often, and we'll ship it the week it's roasted. Save 10%,
              skip or cancel anytime.
            </p>
            <Link to="/collections/coffee" prefetch="intent" className={`${primaryButtonClass} mt-9`}>
              Choose your coffee
            </Link>
          </div>
          <ul role="list" className="border-surface/20 space-y-3 border-t pt-6 md:border-t-0 md:border-s md:ps-10 md:pt-0">
            {PERKS.map((perk) => (
              <li key={perk} className="type-heading-sm flex items-center gap-3">
                <span className="text-apricot" aria-hidden="true">
                  ✓
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full py-16 md:py-20" aria-labelledby="how-heading">
        <div className="max-w-page px-margin mx-auto">
          <Overline>Three steps</Overline>
          <h2 id="how-heading" className={`${sectionHeadingClass} mb-10`}>
            How subscriptions work
          </h2>
          <ol role="list" className="grid gap-8 md:grid-cols-3 md:gap-10">
            {STEPS.map((step, index) => (
              <li key={step.title} className="border-border flex gap-4 border-t pt-6">
                <span className="type-stamp text-on-surface-secondary shrink-0 pt-1" aria-hidden="true">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="type-heading-sm text-on-surface mb-2">{step.title}</h3>
                  <p className="type-body text-on-surface-secondary">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Frequency explainer */}
      <section className="bg-surface-secondary w-full py-16 md:py-20" aria-labelledby="frequency-heading">
        <div className="max-w-page px-margin mx-auto">
          <Overline>How often?</Overline>
          <h2 id="frequency-heading" className={`${sectionHeadingClass} mb-3`}>
            Find your rhythm
          </h2>
          <p className="type-body text-on-surface-secondary mb-10 max-w-prose">
            A 250 g bag makes about 16 cups. Here's how that works out.
          </p>
          <ul role="list" className="grid gap-4 md:grid-cols-2 md:gap-6">
            {FREQUENCIES.map((frequency) => (
              <li
                key={frequency.every}
                className="rounded-card bg-paper border-border flex h-full flex-col border p-6 md:p-8"
              >
                <p className="type-stamp text-on-surface-secondary mb-3">{frequency.every}</p>
                <h3 className="type-heading-lg text-on-surface mb-3">{frequency.who}</h3>
                <p className="type-body text-on-surface-secondary">{frequency.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Roaster's Choice */}
      {roastersChoice ? (
        <section className="w-full py-16 md:py-20" aria-labelledby="roasters-choice-heading">
          <div className="max-w-page px-margin mx-auto">
            <div className="rounded-card border-border bg-paper grid overflow-hidden border md:grid-cols-2">
              <div className="bg-surface-secondary aspect-[4/3] md:aspect-auto">
                {roastersChoice.featuredImage ? (
                  <img
                    src={roastersChoice.featuredImage.url}
                    alt={roastersChoice.featuredImage.altText ?? ""}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex flex-col justify-center p-6 md:p-12">
                <Overline>Can't decide?</Overline>
                <h2 id="roasters-choice-heading" className={`${sectionHeadingClass} mb-4`}>
                  {roastersChoice.title}
                </h2>
                {roastersChoice.descriptionHtml ? (
                  <div
                    className="richtext type-body text-on-surface-secondary mb-4 max-w-md"
                    // Merchant-authored HTML from the Shopify admin.
                    dangerouslySetInnerHTML={{ __html: roastersChoice.descriptionHtml }}
                  />
                ) : (
                  <p className="type-body text-on-surface-secondary mb-4 max-w-md">
                    Ines picks a different coffee for every delivery, so you get to taste the whole
                    menu.
                  </p>
                )}
                <p className="text-on-surface mb-8 font-semibold">
                  From {formatPrice(roastersChoice.priceRange.minVariantPrice)} a delivery
                </p>
                <Link
                  to={`/products/${roastersChoice.handle}`}
                  prefetch="intent"
                  className={primaryButtonClass}
                >
                  Start Roaster's Choice
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      {faqs.length > 0 ? (
        <section className="w-full pb-20" aria-labelledby="subscribe-faq-heading">
          <div className="max-w-page px-margin mx-auto grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-16">
            <div>
              <Overline>Questions</Overline>
              <h2 id="subscribe-faq-heading" className={sectionHeadingClass}>
                Subscription FAQ
              </h2>
              <Link
                to="/pages/faq"
                prefetch="intent"
                className="text-on-surface mt-4 inline-flex min-h-touch-target items-center gap-1 text-sm font-semibold no-underline hover:underline"
              >
                All FAQs <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="border-border border-t">
              {faqs.map((item) => (
                <details key={item.id} id={item.handle} className="group border-border border-b">
                  <summary className="marker-hidden text-on-surface hover:text-on-surface-secondary flex cursor-pointer items-center justify-between gap-4 px-1 py-5 font-semibold">
                    <span>{item.question}</span>
                    <img
                      src="/icons/icon-chevron-down.svg"
                      alt=""
                      aria-hidden="true"
                      className="size-4 shrink-0 group-open:rotate-180 motion-safe:transition-transform motion-safe:duration-200"
                    />
                  </summary>
                  <RichText value={item.answer} className="richtext type-body text-on-surface-secondary px-1 pb-5" />
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

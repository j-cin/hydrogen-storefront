import { gql } from "@shopify/hydrogen";
import { Link } from "react-router";

import { referencedImage } from "~/lib/metaobject";
import { storefrontClientContext } from "~/lib/storefront";
import { formatPageTitle, getShopNameFromRootMatch } from "~/lib/storefront-shop";

import type { Route } from "./+types/our-story";

// /pages/our-story: the founding story (the Online Store "our-story" page body,
// editable in admin), a roastery photo (page metafield custom.image) and the
// three promises. Until a photo is uploaded, the fallback product image is used.
const OUR_STORY_QUERY = gql(`
  query OurStory($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    page(handle: "our-story") {
      title
      body
      seo {
        title
        description
      }
      image: metafield(namespace: "custom", key: "image") {
        reference {
          ... on MediaImage {
            image {
              url
              altText
            }
          }
        }
      }
    }
    fallbackImageProduct: product(handle: "ceramic-dripper") {
      featuredImage {
        url
        altText
      }
    }
    producers: metaobjects(type: "producer", first: 50) {
      nodes {
        id
      }
    }
  }
`);

export async function loader({ context }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const { data } = await storefrontClient.graphql(OUR_STORY_QUERY);
  if (!data?.page) throw new Response("Page not found", { status: 404 });

  return {
    title: data.page.title,
    body: data.page.body,
    seo: data.page.seo,
    image: referencedImage(data.page.image) ?? data.fallbackImageProduct?.featuredImage ?? null,
    producerCount: data.producers.nodes.length,
  };
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  return [
    { title: formatPageTitle(loaderData?.seo?.title || loaderData?.title || "Our story", shopName) },
    {
      name: "description",
      content:
        loaderData?.seo?.description ||
        "Morrow roasts once a week, ships within 72 hours and tells you exactly who grew your coffee.",
    },
  ];
}

const PROMISES = [
  {
    title: "Fresh",
    body: "We roast every Monday and ship within 72 hours. The roast date is stamped on every bag, so you never have to guess.",
  },
  {
    title: "Traceable",
    body: "Every bag names the farm or washing station that grew it. Click through and you'll find the people, the altitude and the process.",
  },
  {
    title: "Fair",
    body: "We buy from the same producers year after year and pay well above the commodity price. Good coffee should be good business for the people who grow it.",
  },
] as const;

function Overline({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <p className={`type-overline mb-2 ${light ? "text-surface/75" : "text-on-surface-secondary"}`}>
      {children}
    </p>
  );
}

export default function OurStoryRoute({ loaderData }: Route.ComponentProps) {
  const { title, body, image, producerCount } = loaderData;

  const facts = [
    { value: "2019", label: "Roasting since" },
    { value: "72 h", label: "Roast to dispatch" },
    ...(producerCount > 0 ? [{ value: String(producerCount), label: "Producers we buy from" }] : []),
  ];

  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      {/* Split intro: story left, roastery photo bleeding right */}
      <section className="bg-on-surface text-surface grid w-full md:grid-cols-2" aria-labelledby="story-heading">
        <div className="bg-surface-secondary relative aspect-[4/3] overflow-hidden md:order-2 md:aspect-auto md:min-h-[36rem]">
          {image ? (
            <img
              src={image.url}
              alt={image.altText ?? "Inside the Morrow roastery"}
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
          ) : null}
        </div>
        <div className="px-margin flex flex-col justify-center py-16 md:py-24 md:ps-[max(var(--spacing-margin),calc((100vw-var(--spacing-page))/2+var(--spacing-margin)))] md:pe-12">
          <Overline light>{title}</Overline>
          <h1 id="story-heading" className="type-display max-w-xl">
            One roast a week, since 2019.
          </h1>
          <p className="type-body-lg text-surface/80 mt-5 max-w-md">
            Started in a converted tram depot workshop by a roaster who wanted to do one thing well.
          </p>
        </div>
      </section>

      {/* Founding story (page body from admin) */}
      <section className="w-full py-16 md:py-24" aria-labelledby="founding-heading">
        <div className="max-w-page px-margin mx-auto grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-16">
          <div>
            <Overline>How it started</Overline>
            <h2 id="founding-heading" className="type-heading-xl text-on-surface">
              The founding story
            </h2>
          </div>
          <div>
            {/* Merchant-authored HTML from the Shopify admin. */}
            <div
              className="richtext type-body-lg text-on-surface max-w-prose"
              dangerouslySetInnerHTML={{ __html: body }}
            />
            <dl className="border-border mt-12 grid grid-cols-3 gap-6 border-t pt-8">
              {facts.map((fact) => (
                <div key={fact.label} className="flex flex-col-reverse gap-1">
                  <dt className="text-on-surface-secondary text-sm">{fact.label}</dt>
                  <dd className="type-heading-xl text-on-surface">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Three promises */}
      <section className="bg-surface-secondary w-full py-16 md:py-24" aria-labelledby="promises-heading">
        <div className="max-w-page px-margin mx-auto">
          <Overline>What we promise</Overline>
          <h2 id="promises-heading" className="type-heading-xl text-on-surface mb-10">
            Fresh, traceable, fair.
          </h2>
          <ol role="list" className="grid gap-4 md:grid-cols-3 md:gap-6">
            {PROMISES.map((promise, index) => (
              <li key={promise.title} className="rounded-card bg-paper border-border flex flex-col border p-6 md:p-8">
                <span className="type-stamp text-on-surface-secondary mb-6" aria-hidden="true">
                  0{index + 1}
                </span>
                <h3 className="type-heading-lg text-on-surface mb-3">{promise.title}</h3>
                <p className="type-body text-on-surface-secondary">{promise.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Next steps */}
      <section className="w-full py-16 md:py-24" aria-labelledby="next-heading">
        <div className="max-w-page px-margin mx-auto flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Overline>Taste it for yourself</Overline>
            <h2 id="next-heading" className="type-heading-xl text-on-surface max-w-xl">
              Meet the people who grow it, then put the kettle on.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/producers"
              prefetch="intent"
              className="rounded-button button-outline focus-visible:outline-accent inline-flex h-12 items-center justify-center px-7 text-base font-semibold no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Meet the producers
            </Link>
            <Link
              to="/collections/coffee"
              prefetch="intent"
              className="rounded-button button-primary focus-visible:outline-accent inline-flex h-12 items-center justify-center px-7 text-base font-semibold no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Shop coffee
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

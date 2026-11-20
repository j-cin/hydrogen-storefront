import { gql } from "@shopify/hydrogen";
import { useRef } from "react";
import { Link } from "react-router";

import { HomeHero } from "~/components/HomeHero";
import {
  ProductCard,
  PRODUCT_CARD_FRAGMENT,
  PRODUCT_CARD_QUICK_ADD_FRAGMENT,
} from "~/components/ProductCard";
import { Testimonials, TESTIMONIAL_FRAGMENT } from "~/components/Testimonials";
import { articleDateFormat } from "~/lib/dates";
import {
  FALLBACK_IMAGE_PRODUCT_HANDLE,
  HOME_HERO_HANDLE,
  selectHomeHero,
} from "~/lib/home-hero";
import { referencedImage } from "~/lib/metaobject";
import { storefrontClientContext } from "~/lib/storefront";
import { formatPageTitle, getShopNameFromRootMatch } from "~/lib/storefront-shop";

import type { Route } from "./+types/home";

// Homepage sections, top to bottom: hero (home_hero metaobject), how it works,
// bestsellers (collection "bestsellers"), find your coffee (collections
// "espresso" and "filter"), subscription pitch, producers (producer
// metaobjects), testimonials (testimonial metaobjects), journal (blog "journal").
const HOME_QUERY = gql(
  `
    query Home(
      $heroHandle: String!
      $fallbackImageProductHandle: String!
      $country: CountryCode
      $language: LanguageCode
    ) @inContext(country: $country, language: $language) {
      hero: metaobject(handle: { type: "home_hero", handle: $heroHandle }) {
        heading: field(key: "heading") {
          value
        }
        subheading: field(key: "subheading") {
          value
        }
        ctaLabel: field(key: "cta_label") {
          value
        }
        ctaLink: field(key: "cta_link") {
          value
        }
        image: field(key: "image") {
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
      fallbackImageProduct: product(handle: $fallbackImageProductHandle) {
        featuredImage {
          url
          altText
        }
      }
      bestsellers: collection(handle: "bestsellers") {
        handle
        products(first: 12, sortKey: COLLECTION_DEFAULT) {
          nodes {
            ...ProductCard
            ...ProductCardQuickAdd
          }
        }
      }
      espresso: collection(handle: "espresso") {
        ...BrewTile
      }
      filter: collection(handle: "filter") {
        ...BrewTile
      }
      producers: metaobjects(type: "producer", first: 3) {
        nodes {
          handle
          name: field(key: "name") {
            value
          }
          region: field(key: "region") {
            value
          }
          country: field(key: "country") {
            value
          }
          photo: field(key: "photo") {
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
      }
      testimonials: metaobjects(type: "testimonial", first: 4) {
        nodes {
          ...Testimonial
        }
      }
      journal: blog(handle: "journal") {
        handle
        articles(first: 3, sortKey: PUBLISHED_AT, reverse: true) {
          nodes {
            handle
            title
            publishedAt
            excerpt
            tags
            image {
              url
              altText
            }
          }
        }
      }
    }
    fragment BrewTile on Collection {
      handle
      title
      image {
        url
        altText
      }
      products(first: 1) {
        nodes {
          featuredImage {
            url
            altText
          }
        }
      }
    }
  `,
  [PRODUCT_CARD_FRAGMENT, PRODUCT_CARD_QUICK_ADD_FRAGMENT, TESTIMONIAL_FRAGMENT],
);

export function meta({ matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  return [
    { title: formatPageTitle("Fresh specialty coffee, roasted every Monday", shopName) },
    {
      name: "description",
      content:
        "Specialty coffee roasted every Monday and shipped within 72 hours. Every bag tells you who grew it.",
    },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const { data } = await storefrontClient.graphql(HOME_QUERY, {
    variables: {
      heroHandle: HOME_HERO_HANDLE,
      fallbackImageProductHandle: FALLBACK_IMAGE_PRODUCT_HANDLE,
    },
  });

  const brewTile = (
    collection: NonNullable<typeof data>["espresso"],
    fallbackHandle: string,
    label: string,
  ) => ({
    label,
    to: `/collections/${collection?.handle ?? fallbackHandle}`,
    image: collection?.image ?? collection?.products.nodes[0]?.featuredImage ?? null,
  });

  return {
    hero: selectHomeHero(data?.hero ?? null, data?.fallbackImageProduct?.featuredImage ?? null),
    bestsellers: data?.bestsellers?.products.nodes ?? [],
    brewTiles: [
      brewTile(data?.espresso ?? null, "espresso", "I brew espresso"),
      brewTile(data?.filter ?? null, "filter", "I brew filter"),
    ],
    producers: (data?.producers.nodes ?? []).map((producer) => ({
      handle: producer.handle,
      name: producer.name?.value ?? producer.handle,
      place: [producer.region?.value, producer.country?.value].filter(Boolean).join(", "),
      image: referencedImage(producer.photo),
    })),
    testimonials: data?.testimonials.nodes ?? [],
    journal: {
      handle: data?.journal?.handle ?? "journal",
      articles: data?.journal?.articles.nodes ?? [],
    },
  };
}

type LoaderData = Route.ComponentProps["loaderData"];

const sectionHeadingClass = "type-heading-xl text-on-surface";
const textLinkClass =
  "min-h-touch-target text-on-surface focus-visible:outline-accent inline-flex items-center gap-1 rounded-sm text-sm font-semibold no-underline hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
const primaryButtonClass =
  "rounded-button button-primary focus-visible:outline-accent inline-flex h-12 shrink-0 items-center justify-center px-7 text-base font-semibold no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:active:scale-[0.97]";

function SectionHeader({
  id,
  title,
  link,
}: {
  id: string;
  title: string;
  link?: { to: string; label: string };
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <h2 id={id} className={sectionHeadingClass}>
        {title}
      </h2>
      {link ? (
        <Link to={link.to} className={textLinkClass} prefetch="intent">
          {link.label}
          <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </div>
  );
}

const STEPS = [
  { title: "Pick your coffee", body: "Single origins, blends and decaf, each with a producer's name on the bag." },
  { title: "We roast it Monday", body: "One roast a week, in small batches, to order." },
  { title: "It's at your door by Thursday", body: "Shipped within 72 hours of roasting, so it arrives at its best." },
] as const;

function HowItWorks() {
  return (
    <section className="w-full py-16 md:py-20" aria-labelledby="how-heading">
      <div className="max-w-page px-margin mx-auto">
        <h2 id="how-heading" className={`${sectionHeadingClass} mb-10`}>
          How it works
        </h2>
        <ol role="list" className="grid gap-8 md:grid-cols-3 md:gap-10">
          {STEPS.map((step, index) => (
            <li key={step.title} className="border-border flex gap-4 border-t pt-6">
              <span
                className="type-stamp text-on-surface-secondary shrink-0 pt-1"
                aria-hidden="true"
              >
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
  );
}

function Bestsellers({ products }: { products: LoaderData["bestsellers"] }) {
  const trackRef = useRef<HTMLUListElement>(null);
  if (products.length === 0) return null;

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const arrowClass =
    "button-icon button-outline rounded-button focus-visible:outline-accent cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

  return (
    <section
      className="bg-surface-secondary w-full py-16 md:py-20"
      aria-labelledby="bestsellers-heading"
      aria-roledescription="carousel"
    >
      <div className="max-w-page px-margin mx-auto">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 id="bestsellers-heading" className={sectionHeadingClass}>
            Bestsellers
          </h2>
          <div className="flex items-center gap-2">
            <Link to="/collections/bestsellers" className={`${textLinkClass} me-2`} prefetch="intent">
              Shop all <span aria-hidden="true">→</span>
            </Link>
            <button
              type="button"
              className={`${arrowClass} hidden md:inline-flex`}
              aria-label="Previous bestsellers"
              aria-controls="bestsellers-track"
              onClick={() => scrollByPage(-1)}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              className={`${arrowClass} hidden md:inline-flex`}
              aria-label="Next bestsellers"
              aria-controls="bestsellers-track"
              onClick={() => scrollByPage(1)}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
        <ul
          ref={trackRef}
          id="bestsellers-track"
          role="list"
          className="bleed-full bleed-inset flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:gap-6"
        >
          {products.map((product, index) => (
            <li
              key={product.handle}
              className="flex w-[70%] shrink-0 snap-start sm:w-[42%] md:w-[30%] lg:w-[23%]"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${products.length}`}
            >
              <ProductCard product={product} quickAdd={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FindYourCoffee({ tiles }: { tiles: LoaderData["brewTiles"] }) {
  return (
    <section className="w-full py-16 md:py-20" aria-labelledby="find-heading">
      <div className="max-w-page px-margin mx-auto">
        <h2 id="find-heading" className={`${sectionHeadingClass} mb-8`}>
          Find your coffee
        </h2>
        <ul role="list" className="grid gap-4 md:grid-cols-2 md:gap-6">
          {tiles.map((tile) => (
            <li key={tile.to}>
              <Link
                to={tile.to}
                prefetch="intent"
                className="group rounded-card bg-surface-secondary focus-visible:outline-accent relative flex aspect-[4/3] items-end overflow-hidden no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 md:aspect-[5/4]"
              >
                {tile.image ? (
                  <>
                    <img
                      src={tile.image.url}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="overlay-hero pointer-events-none absolute inset-0" aria-hidden="true" />
                  </>
                ) : null}
                <span
                  className={`type-heading-lg relative z-10 flex w-full items-center justify-between gap-4 p-6 md:p-8 ${tile.image ? "text-on-image" : "text-on-surface"}`}
                >
                  {tile.label}
                  <span aria-hidden="true">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SubscriptionPitch() {
  return (
    <section className="px-margin w-full" aria-labelledby="subscribe-heading">
      <div className="max-w-page bg-on-surface text-surface rounded-card mx-auto flex flex-col items-start gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between md:px-12 md:py-16">
        <div>
          <p className="type-overline text-surface/75 mb-3">Subscriptions</p>
          <h2 id="subscribe-heading" className="type-heading-xl max-w-xl">
            Never run out. Save 10%, skip or cancel anytime.
          </h2>
        </div>
        <Link to="/pages/subscribe" prefetch="intent" className={primaryButtonClass}>
          Start a subscription
        </Link>
      </div>
    </section>
  );
}

function MeetTheProducers({ producers }: { producers: LoaderData["producers"] }) {
  if (producers.length === 0) return null;
  return (
    <section className="w-full py-16 md:py-20" aria-labelledby="producers-heading">
      <div className="max-w-page px-margin mx-auto">
        <SectionHeader
          id="producers-heading"
          title="Meet the producers"
          link={{ to: "/producers", label: "All producers" }}
        />
        <ul role="list" className="grid gap-6 md:grid-cols-3">
          {producers.map((producer) => (
            <li key={producer.handle}>
              <Link
                to={`/producers/${producer.handle}`}
                prefetch="intent"
                className="group rounded-card bg-paper border-border focus-visible:outline-accent flex h-full flex-col overflow-hidden border no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                <div className="bg-surface-secondary aspect-[4/3] overflow-hidden">
                  {producer.image ? (
                    <img
                      src={producer.image.url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover motion-safe:transition-transform group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div
                      className="text-on-surface-secondary/40 flex h-full items-center justify-center"
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 48 48" className="size-16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M8 34c6-10 14-14 16-14s10 4 16 14" />
                        <circle cx="24" cy="14" r="5" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="type-heading-sm text-on-surface group-hover:underline">
                    {producer.name}
                  </h3>
                  {producer.place ? (
                    <p className="text-on-surface-secondary mt-1 text-sm">{producer.place}</p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FromTheJournal({ journal }: { journal: LoaderData["journal"] }) {
  if (journal.articles.length === 0) return null;
  return (
    <section className="w-full py-16 md:py-20" aria-labelledby="journal-heading">
      <div className="max-w-page px-margin mx-auto">
        <SectionHeader
          id="journal-heading"
          title="From the journal"
          link={{ to: `/blogs/${journal.handle}`, label: "Read the journal" }}
        />
        <ul role="list" className="grid gap-8 md:grid-cols-3 md:gap-6">
          {journal.articles.map((article) => (
            <li key={article.handle}>
              <article className="group relative flex h-full flex-col">
                <div className="bg-surface-secondary rounded-card mb-4 aspect-[3/2] overflow-hidden">
                  {article.image ? (
                    <img
                      src={article.image.url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                {article.tags[0] ? (
                  <p className="type-overline text-on-surface-secondary mb-2">{article.tags[0]}</p>
                ) : null}
                <h3 className="type-heading-sm text-on-surface mb-2">
                  <Link
                    to={`/blogs/${journal.handle}/${article.handle}`}
                    prefetch="intent"
                    className="text-on-surface focus-visible:outline-accent rounded-sm no-underline group-hover:underline after:absolute after:inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                  >
                    {article.title}
                  </Link>
                </h3>
                {article.excerpt ? (
                  <p className="type-body text-on-surface-secondary line-clamp-3">{article.excerpt}</p>
                ) : null}
                <time dateTime={article.publishedAt} className="type-stamp text-on-surface-secondary mt-3">
                  {articleDateFormat.format(new Date(article.publishedAt))}
                </time>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      <HomeHero hero={loaderData.hero} />
      <HowItWorks />
      <Bestsellers products={loaderData.bestsellers} />
      <FindYourCoffee tiles={loaderData.brewTiles} />
      <SubscriptionPitch />
      <MeetTheProducers producers={loaderData.producers} />
      <Testimonials testimonials={loaderData.testimonials} />
      <FromTheJournal journal={loaderData.journal} />
    </main>
  );
}

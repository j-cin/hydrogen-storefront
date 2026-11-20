import { gql } from "@shopify/hydrogen";
import { Link } from "react-router";

import { Breadcrumb } from "~/components/Breadcrumb";
import { storefrontClientContext } from "~/lib/storefront";
import { formatPageTitle, getShopNameFromRootMatch } from "~/lib/storefront-shop";

import type { Route } from "./+types/producers";

// Every `producer` metaobject, linked to its /producers/:handle page.
const PRODUCERS_QUERY = gql(`
  query Producers($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    producers: metaobjects(type: "producer", first: 50) {
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
                width
                height
              }
            }
          }
        }
      }
    }
  }
`);

export async function loader({ context, request }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const { data } = await storefrontClient.graphql(PRODUCERS_QUERY);

  const producers = (data?.producers.nodes ?? []).map((producer) => ({
    handle: producer.handle,
    name: producer.name?.value ?? producer.handle,
    place: [producer.region?.value, producer.country?.value].filter(Boolean).join(", "),
    image:
      producer.photo?.reference && "image" in producer.photo.reference
        ? (producer.photo.reference.image ?? null)
        : null,
  }));

  return { producers, origin: new URL(request.url).origin };
}

export function meta({ matches }: Route.MetaArgs) {
  return [
    { title: formatPageTitle("Producers", getShopNameFromRootMatch(matches[0])) },
    { name: "description", content: "The farms and washing stations behind every Morrow coffee." },
  ];
}

export default function ProducersRoute({ loaderData }: Route.ComponentProps) {
  const { producers, origin } = loaderData;
  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      <div className="max-w-page px-margin mx-auto w-full py-8 md:py-12">
        <Breadcrumb crumbs={[{ label: "Producers", to: "/producers" }]} origin={origin} />
        <h1 className="type-display text-on-surface mb-3">Producers</h1>
        <p className="type-body text-on-surface-secondary mb-10 max-w-prose">
          Every bag carries the name of the person who grew it. Here's who we buy from.
        </p>
        {producers.length === 0 ? (
          <p className="type-body text-on-surface-secondary">No producers yet.</p>
        ) : (
          <ul role="list" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {producers.map((producer) => (
              <li key={producer.handle}>
                <Link
                  to={`/producers/${producer.handle}`}
                  prefetch="intent"
                  className="group focus-visible:outline-accent block rounded-sm no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                >
                  <div className="bg-surface-secondary rounded-card mb-4 aspect-[4/3] overflow-hidden">
                    {producer.image ? (
                      <img
                        src={producer.image.url}
                        alt=""
                        width={producer.image.width ?? undefined}
                        height={producer.image.height ?? undefined}
                        loading="lazy"
                        className="h-full w-full object-cover motion-safe:transition-transform group-hover:scale-[1.02]"
                      />
                    ) : null}
                  </div>
                  <h2 className="type-heading-sm text-on-surface group-hover:underline">
                    {producer.name}
                  </h2>
                  {producer.place ? (
                    <p className="text-on-surface-secondary text-sm">{producer.place}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

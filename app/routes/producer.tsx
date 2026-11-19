import { gql } from "@shopify/hydrogen";

import { Breadcrumb } from "~/components/Breadcrumb";
import { toParagraphs } from "~/lib/metaobject";
import { storefrontClientContext } from "~/lib/storefront";
import { formatPageTitle, getShopNameFromRootMatch } from "~/lib/storefront-shop";

import type { Route } from "./+types/producer";

// Reads a `producer` metaobject (Settings > Custom data > Metaobjects) with
// Storefront API access enabled. Expected fields:
//   name (single line text, display name) · country · region (single line text)
//   altitude (single line text, e.g. "1,850 m") · varieties (single line text)
//   story (multi-line text) · image (file reference, image)
const PRODUCER_QUERY = gql(`
  query Producer($handle: String!, $country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    producer: metaobject(handle: { type: "producer", handle: $handle }) {
      id
      handle
      name: field(key: "name") {
        value
      }
      country: field(key: "country") {
        value
      }
      region: field(key: "region") {
        value
      }
      altitude: field(key: "altitude") {
        value
      }
      varieties: field(key: "varieties") {
        value
      }
      story: field(key: "story") {
        value
      }
      image: field(key: "image") {
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
`);

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const { data } = await storefrontClient.graphql(PRODUCER_QUERY, {
    variables: { handle: params.handle },
  });
  const producer = data?.producer;
  if (!producer) throw new Response("Producer not found", { status: 404 });

  const image =
    producer.image?.reference && "image" in producer.image.reference
      ? producer.image.reference.image
      : null;

  return {
    producer: {
      handle: producer.handle,
      name: producer.name?.value ?? producer.handle,
      facts: [
        { label: "Country", value: producer.country?.value },
        { label: "Region", value: producer.region?.value },
        { label: "Altitude", value: producer.altitude?.value },
        { label: "Varieties", value: producer.varieties?.value },
      ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value)),
      story: toParagraphs(producer.story?.value),
      image: image ?? null,
    },
    origin: new URL(request.url).origin,
  };
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  const producer = loaderData?.producer;
  if (!producer) return [{ title: formatPageTitle("Producer not found", shopName) }];
  return [
    { title: formatPageTitle(producer.name, shopName) },
    ...(producer.story[0] ? [{ name: "description", content: producer.story[0] }] : []),
  ];
}

export default function ProducerRoute({ loaderData }: Route.ComponentProps) {
  const { producer, origin } = loaderData;

  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      <div className="max-w-page px-margin mx-auto w-full py-8 md:py-12">
        <Breadcrumb
          crumbs={[
            { label: "Producers" },
            { label: producer.name, to: `/producers/${producer.handle}` },
          ]}
          origin={origin}
        />
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          {producer.image ? (
            <div className="bg-surface-secondary rounded-card overflow-hidden">
              <img
                src={producer.image.url}
                alt={producer.image.altText ?? ""}
                width={producer.image.width ?? undefined}
                height={producer.image.height ?? undefined}
                loading="eager"
                fetchPriority="high"
                className="h-auto w-full"
              />
            </div>
          ) : null}
          <div>
            <p className="type-overline text-on-surface-secondary mb-2">Grown by</p>
            <h1 className="type-display text-on-surface mb-6">{producer.name}</h1>
            {producer.facts.length > 0 ? (
              <dl className="border-border mb-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y py-6">
                {producer.facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-on-surface-secondary text-sm">{fact.label}</dt>
                    <dd className="text-on-surface font-medium">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <div className="richtext type-body">
              {producer.story.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

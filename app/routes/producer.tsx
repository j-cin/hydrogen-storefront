import { gql } from "@shopify/hydrogen";

import { Breadcrumb } from "~/components/Breadcrumb";
import { RichText, richTextToPlainText } from "~/components/RichText";
import { toParagraphs } from "~/lib/metaobject";
import { storefrontClientContext } from "~/lib/storefront";
import { formatPageTitle, getShopNameFromRootMatch } from "~/lib/storefront-shop";

import type { Route } from "./+types/producer";

// Reads a `producer` metaobject (Settings > Custom data > Metaobjects) with
// Storefront API access enabled. Fields:
//   name · farm_or_station · region · country · altitude (single line text)
//   story (rich text; plain multi-line text also works) · photo (file reference, image)
//   working_with_since (integer year)
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
      farmOrStation: field(key: "farm_or_station") {
        value
      }
      workingWithSince: field(key: "working_with_since") {
        value
      }
      story: field(key: "story") {
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
`);

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const { data } = await storefrontClient.graphql(PRODUCER_QUERY, {
    variables: { handle: params.handle },
  });
  const producer = data?.producer;
  if (!producer) throw new Response("Producer not found", { status: 404 });

  const image =
    producer.photo?.reference && "image" in producer.photo.reference
      ? producer.photo.reference.image
      : null;

  // `story` is a rich_text_field (JSON). Older entries may still be plain
  // multi-line text, so fall back to splitting that into paragraphs.
  const storyValue = producer.story?.value ?? null;
  const storyPlainText = richTextToPlainText(storyValue);
  const isRichText = storyPlainText.length > 0;

  return {
    producer: {
      handle: producer.handle,
      name: producer.name?.value ?? producer.handle,
      facts: [
        // Skipped when it only repeats the producer's name (e.g. a washing station).
        {
          label: "Farm or station",
          value:
            producer.farmOrStation?.value !== producer.name?.value
              ? producer.farmOrStation?.value
              : null,
        },
        { label: "Region", value: producer.region?.value },
        { label: "Country", value: producer.country?.value },
        { label: "Altitude", value: producer.altitude?.value },
        { label: "Working with Morrow since", value: producer.workingWithSince?.value },
      ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value)),
      storyRichText: isRichText ? storyValue : null,
      storyParagraphs: isRichText ? [] : toParagraphs(storyValue),
      summary: isRichText ? storyPlainText : (toParagraphs(storyValue)[0] ?? ""),
      image: image ?? null,
    },
    origin: new URL(request.url).origin,
  };
}

function truncate(text: string, max: number) {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  const producer = loaderData?.producer;
  if (!producer) return [{ title: formatPageTitle("Producer not found", shopName) }];
  return [
    { title: formatPageTitle(producer.name, shopName) },
    ...(producer.summary
      ? [{ name: "description", content: truncate(producer.summary, 160) }]
      : []),
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
            {producer.storyRichText ? (
              <RichText value={producer.storyRichText} className="richtext type-body" />
            ) : (
              <div className="richtext type-body">
                {producer.storyParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

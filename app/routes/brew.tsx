import { gql } from "@shopify/hydrogen";

import { Breadcrumb } from "~/components/Breadcrumb";
import { toLines } from "~/lib/metaobject";
import { storefrontClientContext } from "~/lib/storefront";
import { formatPageTitle, getShopNameFromRootMatch } from "~/lib/storefront-shop";

import type { Route } from "./+types/brew";

// Lists `brew_guide` metaobjects with Storefront API access enabled. Expected fields:
//   name (single line text, display name) · method (single line text, e.g. "Pour-over")
//   dose · water · grind · time (single line text, e.g. "15 g", "250 g at 94°C")
//   steps (multi-line text, one step per line)
const BREW_GUIDES_QUERY = gql(`
  query BrewGuides($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    metaobjects(type: "brew_guide", first: 50, sortKey: "display_name") {
      nodes {
        id
        handle
        name: field(key: "name") {
          value
        }
        method: field(key: "method") {
          value
        }
        dose: field(key: "dose") {
          value
        }
        water: field(key: "water") {
          value
        }
        grind: field(key: "grind") {
          value
        }
        time: field(key: "time") {
          value
        }
        steps: field(key: "steps") {
          value
        }
      }
    }
  }
`);

export async function loader({ context, request }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const { data } = await storefrontClient.graphql(BREW_GUIDES_QUERY);

  const guides = (data?.metaobjects.nodes ?? []).map((guide) => ({
    id: guide.id,
    handle: guide.handle,
    name: guide.name?.value ?? guide.handle,
    method: guide.method?.value ?? null,
    recipe: [
      { label: "Coffee", value: guide.dose?.value },
      { label: "Water", value: guide.water?.value },
      { label: "Grind", value: guide.grind?.value },
      { label: "Time", value: guide.time?.value },
    ].filter((item): item is { label: string; value: string } => Boolean(item.value)),
    steps: toLines(guide.steps?.value),
  }));

  return { guides, origin: new URL(request.url).origin };
}

export function meta({ matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  return [
    { title: formatPageTitle("Brew guides", shopName) },
    {
      name: "description",
      content: "Simple recipes for pour-over, plunger, espresso and more.",
    },
  ];
}

export default function BrewRoute({ loaderData }: Route.ComponentProps) {
  const { guides, origin } = loaderData;

  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      <div className="max-w-page px-margin mx-auto w-full py-8 md:py-12">
        <Breadcrumb crumbs={[{ label: "Brew guides", to: "/brew" }]} origin={origin} />
        <h1 className="type-display text-on-surface mb-3">Brew guides</h1>
        <p className="text-on-surface-secondary type-body-lg mb-10 max-w-2xl">
          Good coffee at home, without the homework. Pick your brewer and follow along.
        </p>

        {guides.length === 0 ? (
          <p className="text-on-surface-secondary">Brew guides are on their way.</p>
        ) : (
          <ul role="list" className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {guides.map((guide) => (
              <li key={guide.id}>
                <article
                  id={guide.handle}
                  aria-labelledby={`${guide.handle}-title`}
                  className="border-border bg-surface-raised rounded-card h-full scroll-mt-24 border p-6"
                >
                  {guide.method ? (
                    <p className="type-overline text-on-surface-secondary mb-1">{guide.method}</p>
                  ) : null}
                  <h2 id={`${guide.handle}-title`} className="type-heading-md text-on-surface mb-4">
                    {guide.name}
                  </h2>
                  {guide.recipe.length > 0 ? (
                    <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                      {guide.recipe.map((item) => (
                        <div key={item.label}>
                          <dt className="text-on-surface-secondary text-sm">{item.label}</dt>
                          <dd className="text-on-surface type-stamp">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  {guide.steps.length > 0 ? (
                    <ol className="text-on-surface type-body list-decimal space-y-2 ps-5">
                      {guide.steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  ) : null}
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

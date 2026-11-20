import { gql } from "@shopify/hydrogen";

import { Breadcrumb } from "~/components/Breadcrumb";
import { RichText } from "~/components/RichText";
import { storefrontClientContext } from "~/lib/storefront";
import { formatPageTitle, getShopNameFromRootMatch } from "~/lib/storefront-shop";

import type { Route } from "./+types/brew";

// Lists `brew_recipe` metaobjects with Storefront API access enabled. Fields:
//   method (single line text, display name, e.g. "Pour-over")
//   dose_g · water_g (integer grams) · grind · brew_time (single line text)
//   steps (rich text, usually an ordered list)
const BREW_RECIPES_QUERY = gql(`
  query BrewRecipes($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    metaobjects(type: "brew_recipe", first: 50, sortKey: "display_name") {
      nodes {
        id
        handle
        method: field(key: "method") {
          value
        }
        doseG: field(key: "dose_g") {
          value
        }
        waterG: field(key: "water_g") {
          value
        }
        grind: field(key: "grind") {
          value
        }
        brewTime: field(key: "brew_time") {
          value
        }
        steps: field(key: "steps") {
          value
        }
      }
    }
  }
`);

function ratio(dose: string | null | undefined, water: string | null | undefined) {
  const d = Number(dose);
  const w = Number(water);
  if (!d || !w) return null;
  const r = w / d;
  return `1:${Number.isInteger(r) ? r : r.toFixed(1)}`;
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const { data } = await storefrontClient.graphql(BREW_RECIPES_QUERY);

  const guides = (data?.metaobjects.nodes ?? []).map((recipe) => ({
    id: recipe.id,
    handle: recipe.handle,
    name: recipe.method?.value ?? recipe.handle,
    recipe: [
      { label: "Coffee", value: recipe.doseG?.value ? `${recipe.doseG.value} g` : null },
      { label: "Water", value: recipe.waterG?.value ? `${recipe.waterG.value} g` : null },
      { label: "Ratio", value: ratio(recipe.doseG?.value, recipe.waterG?.value) },
      { label: "Grind", value: recipe.grind?.value },
      { label: "Time", value: recipe.brewTime?.value },
    ].filter((item): item is { label: string; value: string } => Boolean(item.value)),
    steps: recipe.steps?.value ?? null,
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
                  <h2 id={`${guide.handle}-title`} className="type-heading-md text-on-surface mb-4">
                    {guide.name}
                  </h2>
                  {guide.recipe.length > 0 ? (
                    <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                      {guide.recipe.map((item) => (
                        <div key={item.label}>
                          <dt className="text-on-surface-secondary text-sm">{item.label}</dt>
                          <dd className="text-on-surface type-stamp">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  <RichText
                    value={guide.steps}
                    className="richtext text-on-surface type-body [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:ps-5"
                  />
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

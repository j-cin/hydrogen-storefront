import { Link } from "react-router";

import { formatPrice } from "~/lib/money";

// Extra sections for /collections/gifts: a gift-led intro with "shop by budget"
// shortcuts (price filter links) and, after the grid, ways to gift without
// picking a product (subscription, gift card) plus the gift-note reminder.

export const GIFTS_COLLECTION_HANDLE = "gifts";

// Budget bands in the shopper's currency. Each maps to the Storefront API price
// filter params the collection page already reads.
const BUDGETS = [
  { label: "Under", max: 40 },
  { label: "Between", min: 40, max: 80 },
  { label: "Treat them", min: 80 },
] as const;

function money(amount: number, currencyCode: string) {
  // Whole amounts read better on a budget tile ("A$40" not "A$40.00").
  return formatPrice({ amount: String(amount), currencyCode } as Parameters<typeof formatPrice>[0]).replace(
    /\.00$/,
    "",
  );
}

function budgetHref(collectionPath: string, budget: (typeof BUDGETS)[number]) {
  const params = new URLSearchParams();
  if ("min" in budget) params.set("filter.v.price.gte", String(budget.min));
  if ("max" in budget) params.set("filter.v.price.lte", String(budget.max));
  return `${collectionPath}?${params.toString()}`;
}

function budgetLabel(budget: (typeof BUDGETS)[number], currencyCode: string) {
  if (!("min" in budget)) return `Under ${money(budget.max, currencyCode)}`;
  if (!("max" in budget)) return `${money(budget.min, currencyCode)} and up`;
  return `${money(budget.min, currencyCode)} to ${money(budget.max, currencyCode)}`;
}

const BUDGET_NOTES = ["Stocking fillers", "The sweet spot", "Go all out"];

export function GiftsIntro({
  title,
  description,
  collectionPath,
  currencyCode,
}: {
  title: string;
  description: string;
  collectionPath: string;
  currencyCode: string;
}) {
  return (
    <section
      className="bleed-full bg-on-surface text-surface mb-10 md:mb-14"
      aria-labelledby="gifts-heading"
    >
      <div className="max-w-page px-margin mx-auto grid gap-10 py-14 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-end md:py-20">
        <div>
          <p className="type-overline text-surface/75 mb-2">Gift guide</p>
          <h1 id="gifts-heading" className="type-display max-w-xl">
            {title}
          </h1>
          <p className="type-body-lg text-surface/80 mt-5 max-w-md">
            {description || "For the coffee person in your life, or the one who should be."}
          </p>
          <p className="text-surface/75 mt-4 text-sm">
            Add a gift message to your order in the cart.
          </p>
        </div>
        <nav aria-label="Shop gifts by budget">
          <p className="type-overline text-surface/75 mb-3">Shop by budget</p>
          <ul role="list" className="grid gap-3 sm:grid-cols-3">
            {BUDGETS.map((budget, index) => (
              <li key={budget.label}>
                <Link
                  to={budgetHref(collectionPath, budget)}
                  preventScrollReset
                  className="group rounded-card border-surface/25 hover:bg-surface/10 focus-visible:outline-apricot flex h-full flex-col justify-between gap-6 border p-5 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:transition-colors"
                >
                  <span className="text-surface/75 text-sm">{BUDGET_NOTES[index]}</span>
                  <span className="type-heading-md text-surface flex items-center justify-between gap-2">
                    {budgetLabel(budget, currencyCode)}
                    <span aria-hidden="true" className="motion-safe:transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}

const GIFT_OPTIONS = [
  {
    overline: "The gift that keeps arriving",
    title: "Gift a subscription",
    body: "Roaster's Choice sends a different fresh coffee every 2 or 4 weeks. They'll think of you every Monday.",
    cta: "Start Roaster's Choice",
    to: "/products/roasters-choice",
  },
  {
    overline: "Can't choose?",
    title: "Send a gift card",
    body: "Delivered by email, from A$25. They pick the coffee, you pick the amount.",
    cta: "Buy a gift card",
    to: "/products/gift-card",
  },
] as const;

export function GiftsOptions() {
  return (
    <section className="mt-16 md:mt-24" aria-labelledby="gift-options-heading">
      <h2 id="gift-options-heading" className="sr-only">
        More ways to gift
      </h2>
      <ul role="list" className="grid gap-4 md:grid-cols-2 md:gap-6">
        {GIFT_OPTIONS.map((option) => (
          <li
            key={option.title}
            className="rounded-card bg-paper border-border flex h-full flex-col items-start border p-6 md:p-10"
          >
            <p className="type-overline text-on-surface-secondary mb-2">{option.overline}</p>
            <h3 className="type-heading-xl text-on-surface mb-3">{option.title}</h3>
            <p className="type-body text-on-surface-secondary mb-8 max-w-md flex-1">{option.body}</p>
            <Link
              to={option.to}
              prefetch="intent"
              className="rounded-button button-primary focus-visible:outline-accent inline-flex h-12 items-center justify-center px-7 text-base font-semibold no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {option.cta}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

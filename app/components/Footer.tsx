import { useId } from "react";
import { Link, useFetcher, useLocation } from "react-router";

import type { Market } from "~/lib/market";
import type { NavItem } from "~/lib/menu";
import type { PolicyLink } from "~/lib/root-layout";
import type { NewsletterActionData } from "~/routes/newsletter";

import { Logo } from "./Logo";
import { NavLink } from "./NavLink";

// Espresso band: cream text at 75% stays well above 4.5:1 on espresso.
const linkClass =
  "min-h-touch-target text-surface/75 hover:text-surface focus-visible:outline-apricot inline-flex items-center font-normal no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const fieldClass =
  "rounded-input border-surface/40 bg-on-surface text-surface placeholder:text-surface/60 focus-visible:outline-apricot min-h-touch-target w-full border px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export function Footer({
  menu,
  policies,
  markets,
  currentMarket,
}: {
  menu: NavItem[];
  policies: PolicyLink[];
  markets: readonly Market[];
  currentMarket: Market;
}) {
  // Columns come from the "footer" menu: each top-level item is a heading and
  // its children are the links. Items without children have nowhere to go.
  const columns = menu.filter((item) => item.items.length > 0);

  return (
    <footer className="bg-on-surface text-surface w-full">
      <div className="max-w-page px-margin mx-auto pt-16 pb-10 text-sm">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.5fr)]">
          {columns.map((column) => (
            <FooterColumn key={column.id} column={column} />
          ))}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <NewsletterForm />
          </div>
        </div>

        <div className="border-surface/20 mt-14 flex flex-col gap-6 border-t pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              to="/"
              aria-label="Morrow Coffee Roasters home"
              className="focus-visible:outline-apricot rounded-sm text-surface no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              <Logo className="text-[1.75rem]" />
            </Link>
            <CountrySelector markets={markets} currentMarket={currentMarket} />
          </div>
          {policies.length > 0 ? (
            <nav aria-label="Policies">
              <ul role="list" className="flex flex-wrap gap-x-6">
                {policies.map((policy) => (
                  <li key={policy.to}>
                    <Link to={policy.to} className={linkClass}>
                      {policy.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ column }: { column: NavItem }) {
  const headingId = useId();
  return (
    <nav aria-labelledby={headingId}>
      <h2 id={headingId} className="type-overline text-surface mb-3 font-semibold">
        {column.title}
      </h2>
      <ul role="list" className="flex flex-col">
        {column.items.map((item) => (
          <li key={item.id}>
            <NavLink item={item} className={linkClass} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function NewsletterForm() {
  const fetcher = useFetcher<NewsletterActionData>();
  const inputId = useId();
  const messageId = useId();
  const submitting = fetcher.state !== "idle";
  const result = fetcher.data;

  return (
    <section aria-labelledby={`${inputId}-heading`}>
      <h2 id={`${inputId}-heading`} className="type-overline text-surface mb-3 font-semibold">
        Newsletter
      </h2>
      <p className="text-surface/75 type-body mb-4 max-w-sm">
        One email a fortnight. New coffees, no spam.
      </p>
      {result?.ok ? (
        <p role="status" className="text-surface type-body">
          You're on the list. See you in a fortnight.
        </p>
      ) : (
        <fetcher.Form method="post" action="/newsletter" className="flex max-w-md gap-2">
          <label htmlFor={inputId} className="sr-only">
            Email address
          </label>
          <input
            id={inputId}
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={result && !result.ok ? true : undefined}
            aria-describedby={result && !result.ok ? messageId : undefined}
            className={fieldClass}
          />
          <button
            type="submit"
            disabled={submitting}
            className="button-primary min-h-touch-target rounded-button shrink-0 cursor-pointer px-5 font-semibold disabled:opacity-60"
          >
            {submitting ? "Signing up…" : "Sign up"}
          </button>
        </fetcher.Form>
      )}
      {result && !result.ok ? (
        <p id={messageId} role="alert" className="text-apricot mt-2 text-sm">
          {result.error}
        </p>
      ) : null}
    </section>
  );
}

function CountrySelector({
  markets,
  currentMarket,
}: {
  markets: readonly Market[];
  currentMarket: Market;
}) {
  const location = useLocation();
  const selectId = useId();

  return (
    <form method="post" action="/localization" className="flex items-center gap-2">
      <input
        type="hidden"
        name="redirectTo"
        value={`${location.pathname}${location.search}`}
      />
      <label htmlFor={selectId} className="text-surface/75">
        Country
      </label>
      <select
        id={selectId}
        name="country"
        defaultValue={currentMarket.country}
        className={`${fieldClass} w-auto cursor-pointer`}
      >
        {markets.map((market) => (
          <option key={market.country} value={market.country}>
            {market.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="border-surface/40 hover:bg-surface/10 focus-visible:outline-apricot min-h-touch-target rounded-button cursor-pointer border px-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Update
      </button>
    </form>
  );
}

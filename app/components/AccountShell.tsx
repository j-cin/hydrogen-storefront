import type { ReactNode } from "react";
import { NavLink } from "react-router";

import { buttonClass } from "~/components/Breadcrumb";

const tabs = [
  { to: "/account", label: "Overview", end: true },
  { to: "/account/orders", label: "Orders", end: false },
  { to: "/account/addresses", label: "Addresses", end: false },
];

/** Shared heading and section nav for the signed-in /account pages. */
export function AccountShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="max-w-page px-margin mx-auto w-full flex-1 py-12"
    >
      <h1 className="type-display text-on-surface mb-6">{title}</h1>
      <nav aria-label="Account" className="border-border mb-10 border-b">
        <ul role="list" className="flex gap-6">
          {tabs.map((tab) => (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `min-h-touch-target -mb-px inline-flex items-center border-b-2 text-sm no-underline ${
                    isActive
                      ? "border-on-surface text-on-surface font-medium"
                      : "text-on-surface-secondary hover:text-on-surface border-transparent"
                  }`
                }
              >
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </main>
  );
}

/** Signed-out and unavailable states shared by every /account route. */
export function AccountGate({
  status,
  loginFailed = false,
}: {
  status: "unavailable" | "signed-out";
  loginFailed?: boolean;
}) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="max-w-page px-margin mx-auto w-full flex-1 py-12"
    >
      <h1 className="type-display text-on-surface mb-8">Account</h1>
      {status === "unavailable" ? (
        <section className="border-border rounded border p-8" aria-labelledby="unavailable-heading">
          <h2 id="unavailable-heading" className="type-heading-md text-on-surface mb-3">
            Customer Accounts aren&apos;t set up
          </h2>
          <p className="text-on-surface-secondary max-w-xl">
            Customer Accounts need a real store, <code>SHOP_ID</code>,{" "}
            <code>PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID</code>, <code>SESSION_SECRET</code>, and
            HTTPS (use <code>npm run dev:https</code> locally).
          </p>
        </section>
      ) : (
        <section className="border-border rounded border p-8" aria-labelledby="sign-in-heading">
          <h2 id="sign-in-heading" className="type-heading-md text-on-surface mb-3">
            Sign in
          </h2>
          <p className="text-on-surface-secondary mb-6 max-w-xl">
            Sign in to see your orders, addresses and subscriptions.
          </p>
          {loginFailed ? (
            <p role="alert" className="border-border bg-surface-secondary mb-6 rounded border p-4">
              We couldn&apos;t sign you in. Try again.
            </p>
          ) : null}
          {/* A plain <a>: the OAuth redirect needs a full page navigation. */}
          <a href="/account/login" className={`button-primary ${buttonClass}`}>
            Sign in
          </a>
        </section>
      )}
    </main>
  );
}

export function LogoutForm() {
  // A plain <form>: the logout redirect needs a full page navigation.
  return (
    <form method="post" action="/account/logout" className="mt-6">
      <button type="submit" className={`button-outline cursor-pointer ${buttonClass}`}>
        Log out
      </button>
    </form>
  );
}

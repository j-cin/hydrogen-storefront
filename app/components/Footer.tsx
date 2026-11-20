import { Link } from "react-router";

import type { NavItem } from "~/lib/menu";
import type { StorefrontShop } from "~/lib/storefront-shop";

import { Logo } from "./Logo";
import { NavLink } from "./NavLink";
import { PaymentMethodIcon } from "./PaymentMethodIcon";

// Espresso band: cream text at 75% stays well above 4.5:1 on espresso.
const linkClass =
  "min-h-touch-target text-surface/75 hover:text-surface focus-visible:outline-apricot inline-flex items-center font-normal no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export function Footer({ shopInfo, menu }: { shopInfo: StorefrontShop; menu: NavItem[] }) {
  return (
    <footer className="bg-on-surface text-surface w-full">
      <div
        className={`max-w-page px-margin mx-auto grid grid-cols-1 gap-10 pt-16 pb-12 text-sm md:grid-cols-2 ${shopInfo.paymentMethods.length > 0 ? "lg:grid-cols-3" : ""}`}
      >
        <div className="min-w-0 wrap-anywhere">
          <h2 className="mb-4">
            <Logo className="text-[2.25rem]" />
          </h2>
          <p className="text-surface/75 type-body max-w-xs">
            Roasted on Monday. In your cup by Thursday.
          </p>
        </div>
        <nav aria-labelledby="footer-customer-care-heading">
          <h2
            className="type-overline text-surface mb-3 font-semibold"
            id="footer-customer-care-heading"
          >
            Customer care
          </h2>
          <ul role="list" className="flex flex-col">
            {menu
              .filter((item) => item.to !== "/search" && item.to !== "/account")
              .map((item) => (
                <li key={item.id}>
                  <NavLink item={item} className={linkClass} />
                </li>
              ))}
            <li>
              <Link to="/search" className={linkClass}>
                Search
              </Link>
            </li>
            <li>
              <Link to="/account" className={linkClass}>
                Account
              </Link>
            </li>
          </ul>
        </nav>
        {shopInfo.paymentMethods.length > 0 ? (
          <div>
            <h2
              id="footer-payment-methods-heading"
              className="type-overline text-surface mb-4 font-semibold"
            >
              Payment methods
            </h2>
            <ul
              role="list"
              aria-labelledby="footer-payment-methods-heading"
              className="flex flex-wrap items-center gap-2"
            >
              {shopInfo.paymentMethods.map((method) => (
                <li key={method} className="max-w-full">
                  <PaymentMethodIcon method={method} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </footer>
  );
}

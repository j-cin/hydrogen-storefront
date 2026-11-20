import { gql } from "@shopify/hydrogen/customer-account";
import { Link } from "react-router";

import { AccountGate, AccountShell, LogoutForm } from "~/components/AccountShell";
import { buttonClass } from "~/components/Breadcrumb";
import { formatOrderStatus, getAccountAccess, orderDateFormat } from "~/lib/account";
import { formatPrice } from "~/lib/money";

import type { Route } from "./+types/account";

const ACCOUNT_QUERY = gql(`
  query AccountOverview {
    customer {
      firstName
      lastName
      emailAddress {
        emailAddress
      }
      defaultAddress {
        formatted
      }
      orders(first: 3, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          id
          name
          processedAt
          financialStatus
          statusPageUrl
          totalPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
`);

export function meta({}: Route.MetaArgs) {
  return [{ title: "Account" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const access = await getAccountAccess(context, request);
  if (access.status !== "signed-in") return access;

  try {
    const { data, errors } = await access.client.graphql(ACCOUNT_QUERY, {
      accessToken: access.accessToken,
    });
    if (errors || !data?.customer) {
      return { status: "error", message: errors?.[0]?.message ?? "Customer not found." } as const;
    }
    return { status: "ready", customer: data.customer } as const;
  } catch {
    return {
      status: "error",
      message: "We couldn't load your account. Try again later.",
    } as const;
  }
}

export default function AccountRoute({ loaderData }: Route.ComponentProps) {
  if (loaderData.status === "unavailable") return <AccountGate status="unavailable" />;
  if (loaderData.status === "signed-out") {
    return <AccountGate status="signed-out" loginFailed={loaderData.loginFailed} />;
  }
  if (loaderData.status === "error") {
    return (
      <AccountShell title="Account">
        <p role="alert" className="border-border bg-surface-secondary rounded border p-4">
          {loaderData.message}
        </p>
        <LogoutForm />
      </AccountShell>
    );
  }

  const { customer } = loaderData;
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ");

  return (
    <AccountShell title={customer.firstName ? `Hi, ${customer.firstName}` : "Account"}>
      <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
        <section aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="type-heading-md text-on-surface mb-3">
            {name || "Your details"}
          </h2>
          {customer.emailAddress?.emailAddress ? (
            <p className="text-on-surface-secondary">{customer.emailAddress.emailAddress}</p>
          ) : null}
          <h3 className="type-heading-sm text-on-surface mt-8 mb-2">Default address</h3>
          {customer.defaultAddress ? (
            <address className="text-on-surface-secondary not-italic">
              {customer.defaultAddress.formatted.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          ) : (
            <p className="text-on-surface-secondary">No address saved yet.</p>
          )}
          <Link to="/account/addresses" className="text-on-surface mt-2 inline-block text-sm">
            Manage addresses
          </Link>
          <LogoutForm />
        </section>

        <section aria-labelledby="recent-orders-heading">
          <h2 id="recent-orders-heading" className="type-heading-md text-on-surface mb-4">
            Recent orders
          </h2>
          {customer.orders.nodes.length === 0 ? (
            <div>
              <p className="text-on-surface font-medium">You haven&apos;t placed any orders yet.</p>
              <Link to="/collections/all" className={`button-primary mt-6 ${buttonClass}`}>
                Find my coffee
              </Link>
            </div>
          ) : (
            <>
              <ul role="list" className="divide-border divide-y">
                {customer.orders.nodes.map((order) => (
                  <li key={order.id} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 py-4">
                    <a
                      href={order.statusPageUrl}
                      className="text-on-surface font-medium underline-offset-4 hover:underline"
                    >
                      Order {order.name}
                    </a>
                    <time dateTime={order.processedAt} className="text-on-surface-secondary text-sm">
                      {orderDateFormat.format(new Date(order.processedAt))}
                    </time>
                    <span className="text-on-surface-secondary text-sm">
                      {formatOrderStatus(order.financialStatus)}
                    </span>
                    <span className="text-on-surface ms-auto font-medium">
                      {formatPrice(order.totalPrice)}
                    </span>
                  </li>
                ))}
              </ul>
              <Link to="/account/orders" className={`button-outline mt-6 ${buttonClass}`}>
                View all orders
              </Link>
            </>
          )}
        </section>
      </div>
    </AccountShell>
  );
}

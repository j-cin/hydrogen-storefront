import { gql } from "@shopify/hydrogen/customer-account";
import { Link, useNavigation } from "react-router";

import { AccountGate, AccountShell, LogoutForm } from "~/components/AccountShell";
import { buttonClass } from "~/components/Breadcrumb";
import { formatOrderStatus, getAccountAccess, orderDateFormat } from "~/lib/account";
import { formatPrice } from "~/lib/money";

import type { Route } from "./+types/account-orders";

const ORDERS_PAGE_SIZE = 10;

const ORDERS_QUERY = gql(`
  query AccountOrders($first: Int, $after: String, $last: Int, $before: String) {
    customer {
      orders(
        first: $first
        after: $after
        last: $last
        before: $before
        sortKey: PROCESSED_AT
        reverse: true
      ) {
        nodes {
          id
          name
          processedAt
          financialStatus
          fulfillmentStatus
          statusPageUrl
          totalPrice {
            amount
            currencyCode
          }
          lineItems(first: 3) {
            nodes {
              id
              title
              quantity
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
`);

export function meta({}: Route.MetaArgs) {
  return [{ title: "Orders" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const access = await getAccountAccess(context, request);
  if (access.status !== "signed-in") return access;

  const searchParams = new URL(request.url).searchParams;
  const before = searchParams.get("before");
  const variables = before
    ? { last: ORDERS_PAGE_SIZE, before }
    : { first: ORDERS_PAGE_SIZE, after: searchParams.get("after") };

  try {
    const { data, errors } = await access.client.graphql(ORDERS_QUERY, {
      accessToken: access.accessToken,
      variables,
    });
    if (errors || !data?.customer) {
      return { status: "error", message: errors?.[0]?.message ?? "Customer not found." } as const;
    }
    return { status: "ready", orders: data.customer.orders } as const;
  } catch {
    return { status: "error", message: "We couldn't load your orders. Try again later." } as const;
  }
}

export default function AccountOrdersRoute({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation();

  if (loaderData.status === "unavailable") return <AccountGate status="unavailable" />;
  if (loaderData.status === "signed-out") {
    return <AccountGate status="signed-out" loginFailed={loaderData.loginFailed} />;
  }
  if (loaderData.status === "error") {
    return (
      <AccountShell title="Orders">
        <p role="alert" className="border-border bg-surface-secondary rounded border p-4">
          {loaderData.message}
        </p>
        <LogoutForm />
      </AccountShell>
    );
  }

  const { orders } = loaderData;
  const { pageInfo } = orders;
  const isPaging =
    navigation.state === "loading" && navigation.location?.pathname === "/account/orders";

  return (
    <AccountShell title="Orders">
      {orders.nodes.length === 0 ? (
        <div>
          <p className="text-on-surface font-medium">You haven&apos;t placed any orders yet.</p>
          <Link to="/collections/all" className={`button-primary mt-6 ${buttonClass}`}>
            Find my coffee
          </Link>
        </div>
      ) : (
        <ul
          role="list"
          aria-busy={isPaging}
          className={`divide-border divide-y ${isPaging ? "opacity-50" : ""}`}
        >
          {orders.nodes.map((order) => (
            <li key={order.id} className="grid gap-2 py-5 sm:grid-cols-[1fr_auto]">
              <div>
                <a
                  href={order.statusPageUrl}
                  className="text-on-surface font-medium underline-offset-4 hover:underline"
                >
                  Order {order.name}
                </a>
                <p className="text-on-surface-secondary mt-1 text-sm">
                  <time dateTime={order.processedAt}>
                    {orderDateFormat.format(new Date(order.processedAt))}
                  </time>
                  {order.financialStatus ? <> · {formatOrderStatus(order.financialStatus)}</> : null}
                  {order.fulfillmentStatus ? (
                    <> · {formatOrderStatus(order.fulfillmentStatus)}</>
                  ) : null}
                </p>
                <p className="text-on-surface-secondary mt-1 text-sm">
                  {order.lineItems.nodes
                    .map((item) => `${item.quantity} × ${item.title}`)
                    .join(", ")}
                </p>
              </div>
              <span className="text-on-surface font-medium sm:text-end">
                {formatPrice(order.totalPrice)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {pageInfo.hasPreviousPage || pageInfo.hasNextPage ? (
        <nav aria-label="Orders pagination" className="mt-6 flex justify-between gap-4">
          {pageInfo.hasPreviousPage && pageInfo.startCursor ? (
            <Link
              to={`?before=${encodeURIComponent(pageInfo.startCursor)}`}
              preventScrollReset
              className={`button-outline ${buttonClass}`}
            >
              Newer orders
            </Link>
          ) : (
            <span />
          )}
          {pageInfo.hasNextPage && pageInfo.endCursor ? (
            <Link
              to={`?after=${encodeURIComponent(pageInfo.endCursor)}`}
              preventScrollReset
              className={`button-outline ${buttonClass}`}
            >
              Older orders
            </Link>
          ) : null}
        </nav>
      ) : null}
    </AccountShell>
  );
}

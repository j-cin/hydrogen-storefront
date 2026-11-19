import type { RouterContextProvider } from "react-router";

import { customerAccountContext, type CustomerAccount } from "~/lib/customer-account";

export type AccountAccess =
  | { status: "unavailable" }
  | { status: "signed-out"; loginFailed: boolean }
  | { status: "signed-in"; client: CustomerAccount["client"]; accessToken: string };

/**
 * Resolves the signed-in customer's access token for /account routes. Reading the
 * token marks the response as personalized, so it is never cached.
 */
export async function getAccountAccess(
  context: Readonly<RouterContextProvider>,
  request: Request,
): Promise<AccountAccess> {
  const customerAccount = context.get(customerAccountContext);
  if (!customerAccount) return { status: "unavailable" };

  const { client, session, sessionManager, requestContext } = customerAccount;
  const accessToken = await session.getOrRefreshAccessToken(sessionManager, requestContext);
  if (!accessToken) {
    const loginFailed = new URL(request.url).searchParams.get("login") === "failed";
    return { status: "signed-out", loginFailed };
  }
  return { status: "signed-in", client, accessToken };
}

export function formatOrderStatus(status: string | null | undefined) {
  if (!status) return "";
  const text = status.toLowerCase().replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const orderDateFormat = new Intl.DateTimeFormat("en-AU", {
  dateStyle: "medium",
  timeZone: "UTC",
});

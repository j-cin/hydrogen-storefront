import { gql } from "@shopify/hydrogen";
import { data, redirect } from "react-router";

import { storefrontClientContext } from "~/lib/storefront";

import type { Route } from "./+types/newsletter";

// Headless stores have no newsletter endpoint, so a signup creates a customer
// who accepts email marketing. The password is random and never shown; the
// customer signs in through Customer Accounts (email code) if they ever shop.
const NEWSLETTER_SIGNUP_MUTATION = gql(`
  mutation NewsletterSignup($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
      }
      customerUserErrors {
        code
        message
      }
    }
  }
`);

export type NewsletterActionData = { ok: true } | { ok: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function randomPassword() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export async function action({ context, request }: Route.ActionArgs) {
  const form = await request.formData();
  const email = form.get("email")?.toString().trim() ?? "";
  if (!EMAIL_PATTERN.test(email)) {
    return data<NewsletterActionData>(
      { ok: false, error: "That email doesn't look right. Check it and try again." },
      { status: 400 },
    );
  }

  const storefrontClient = context.get(storefrontClientContext);
  const { data: result, errors } = await storefrontClient.graphql(NEWSLETTER_SIGNUP_MUTATION, {
    variables: { input: { email, password: randomPassword(), acceptsMarketing: true } },
  });

  const userErrors = result?.customerCreate?.customerUserErrors ?? [];
  // An existing customer is already on the list (or can opt in from their account).
  const alreadyExists = userErrors.some((error) => error.code === "TAKEN");

  if (errors || (userErrors.length > 0 && !alreadyExists)) {
    console.error("Newsletter signup failed", errors ?? userErrors);
    return data<NewsletterActionData>(
      { ok: false, error: "We couldn't sign you up just now. Try again in a minute." },
      { status: 502 },
    );
  }

  return data<NewsletterActionData>({ ok: true });
}

export function loader() {
  return redirect("/");
}

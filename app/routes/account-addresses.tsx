import { gql } from "@shopify/hydrogen/customer-account";
import type { CountryCode } from "@shopify/hydrogen/customer-account-api-types";
import { Form, useActionData, useNavigation } from "react-router";

import { AccountGate, AccountShell, LogoutForm } from "~/components/AccountShell";
import { buttonClass } from "~/components/Breadcrumb";
import { getAccountAccess } from "~/lib/account";

import type { Route } from "./+types/account-addresses";

const ADDRESSES_QUERY = gql(`
  query AccountAddresses {
    customer {
      defaultAddress {
        id
      }
      addresses(first: 20) {
        nodes {
          id
          firstName
          lastName
          company
          address1
          address2
          city
          zoneCode
          countryCode
          zip
          phoneNumber
          formatted
        }
      }
    }
  }
`);

const CREATE_ADDRESS = gql(`
  mutation CreateAddress($address: CustomerAddressInput!, $defaultAddress: Boolean) {
    customerAddressCreate(address: $address, defaultAddress: $defaultAddress) {
      customerAddress {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`);

const UPDATE_ADDRESS = gql(`
  mutation UpdateAddress(
    $addressId: ID!
    $address: CustomerAddressInput
    $defaultAddress: Boolean
  ) {
    customerAddressUpdate(
      addressId: $addressId
      address: $address
      defaultAddress: $defaultAddress
    ) {
      customerAddress {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`);

const DELETE_ADDRESS = gql(`
  mutation DeleteAddress($addressId: ID!) {
    customerAddressDelete(addressId: $addressId) {
      deletedAddressId
      userErrors {
        field
        message
      }
    }
  }
`);

export function meta({}: Route.MetaArgs) {
  return [{ title: "Addresses" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const access = await getAccountAccess(context, request);
  if (access.status !== "signed-in") return access;

  try {
    const { data, errors } = await access.client.graphql(ADDRESSES_QUERY, {
      accessToken: access.accessToken,
    });
    if (errors || !data?.customer) {
      return { status: "error", message: errors?.[0]?.message ?? "Customer not found." } as const;
    }
    return {
      status: "ready",
      addresses: data.customer.addresses.nodes,
      defaultAddressId: data.customer.defaultAddress?.id ?? null,
    } as const;
  } catch {
    return {
      status: "error",
      message: "We couldn't load your addresses. Try again later.",
    } as const;
  }
}

const TEXT_FIELDS = [
  "firstName",
  "lastName",
  "company",
  "address1",
  "address2",
  "city",
  "zoneCode",
  "zip",
  "phoneNumber",
] as const;

function readAddressInput(formData: FormData) {
  const address: Partial<Record<(typeof TEXT_FIELDS)[number], string>> & {
    countryCode?: CountryCode;
  } = {};
  for (const field of TEXT_FIELDS) {
    const value = formData.get(field);
    if (typeof value === "string") address[field] = value.trim();
  }
  const countryCode = formData.get("countryCode");
  // Two-letter ISO code; Shopify rejects unknown codes with a user error.
  if (typeof countryCode === "string" && /^[a-z]{2}$/i.test(countryCode.trim())) {
    address.countryCode = countryCode.trim().toUpperCase() as CountryCode;
  }
  return address;
}

type ActionResult = { ok: true; intent: string } | { ok: false; intent: string; error: string };

export async function action({ context, request }: Route.ActionArgs): Promise<ActionResult> {
  const access = await getAccountAccess(context, request);
  if (access.status !== "signed-in") {
    return { ok: false, intent: "auth", error: "Your session has ended. Sign in again." };
  }

  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const addressId = String(formData.get("addressId") ?? "");
  const defaultAddress = formData.get("defaultAddress") === "on";
  const { client, accessToken } = access;

  try {
    let userErrors: readonly { message: string }[] = [];
    let errors: readonly { message: string }[] | undefined;

    if (intent === "create") {
      const result = await client.graphql(CREATE_ADDRESS, {
        accessToken,
        // Required fields are enforced by the form and validated again by Shopify.
        variables: { address: readAddressInput(formData), defaultAddress },
      });
      errors = result.errors;
      userErrors = result.data?.customerAddressCreate?.userErrors ?? [];
    } else if (intent === "update" && addressId) {
      const result = await client.graphql(UPDATE_ADDRESS, {
        accessToken,
        variables: { addressId, address: readAddressInput(formData), defaultAddress },
      });
      errors = result.errors;
      userErrors = result.data?.customerAddressUpdate?.userErrors ?? [];
    } else if (intent === "make-default" && addressId) {
      const result = await client.graphql(UPDATE_ADDRESS, {
        accessToken,
        variables: { addressId, defaultAddress: true },
      });
      errors = result.errors;
      userErrors = result.data?.customerAddressUpdate?.userErrors ?? [];
    } else if (intent === "delete" && addressId) {
      const result = await client.graphql(DELETE_ADDRESS, {
        accessToken,
        variables: { addressId },
      });
      errors = result.errors;
      userErrors = result.data?.customerAddressDelete?.userErrors ?? [];
    } else {
      return { ok: false, intent, error: "Unknown address action." };
    }

    const message = errors?.[0]?.message ?? userErrors[0]?.message;
    return message ? { ok: false, intent, error: message } : { ok: true, intent };
  } catch {
    return { ok: false, intent, error: "We couldn't save that. Try again." };
  }
}

type Address = Extract<
  Route.ComponentProps["loaderData"],
  { status: "ready" }
>["addresses"][number];

const inputClass = "h-11 w-full";

function AddressFields({ address }: { address?: Address }) {
  const idPrefix = address?.id ?? "new";
  const field = (
    name: keyof Address & string,
    label: string,
    options: { required?: boolean; autoComplete?: string; className?: string } = {},
  ) => (
    <div className={options.className}>
      <label htmlFor={`${idPrefix}-${name}`} className="text-on-surface mb-1.5 block text-sm">
        {label}
        {options.required ? null : (
          <span className="text-on-surface-secondary"> (optional)</span>
        )}
      </label>
      <input
        id={`${idPrefix}-${name}`}
        name={name}
        defaultValue={(address?.[name] as string | null | undefined) ?? ""}
        required={options.required}
        autoComplete={options.autoComplete}
        className={inputClass}
      />
    </div>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {field("firstName", "First name", { required: true, autoComplete: "given-name" })}
      {field("lastName", "Last name", { required: true, autoComplete: "family-name" })}
      {field("company", "Company", { autoComplete: "organization", className: "sm:col-span-2" })}
      {field("address1", "Address", {
        required: true,
        autoComplete: "address-line1",
        className: "sm:col-span-2",
      })}
      {field("address2", "Apartment, suite, etc.", {
        autoComplete: "address-line2",
        className: "sm:col-span-2",
      })}
      {field("city", "Suburb or city", { required: true, autoComplete: "address-level2" })}
      {field("zoneCode", "State (e.g. VIC)", { autoComplete: "address-level1" })}
      {field("zip", "Postcode", { required: true, autoComplete: "postal-code" })}
      {field("countryCode", "Country code (e.g. AU)", { required: true, autoComplete: "country" })}
      {field("phoneNumber", "Phone", { autoComplete: "tel", className: "sm:col-span-2" })}
    </div>
  );
}

function DefaultCheckbox({ id, checked }: { id: string; checked: boolean }) {
  return (
    <label htmlFor={id} className="text-on-surface mt-4 flex items-center gap-2 text-sm">
      <input id={id} type="checkbox" name="defaultAddress" defaultChecked={checked} />
      Use as my default address
    </label>
  );
}

export default function AccountAddressesRoute({ loaderData }: Route.ComponentProps) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const pendingIntent =
    navigation.state === "submitting" ? navigation.formData?.get("intent") : null;

  if (loaderData.status === "unavailable") return <AccountGate status="unavailable" />;
  if (loaderData.status === "signed-out") {
    return <AccountGate status="signed-out" loginFailed={loaderData.loginFailed} />;
  }
  if (loaderData.status === "error") {
    return (
      <AccountShell title="Addresses">
        <p role="alert" className="border-border bg-surface-secondary rounded border p-4">
          {loaderData.message}
        </p>
        <LogoutForm />
      </AccountShell>
    );
  }

  const { addresses, defaultAddressId } = loaderData;

  return (
    <AccountShell title="Addresses">
      {actionData && !actionData.ok ? (
        <p role="alert" className="border-border bg-surface-secondary mb-6 rounded border p-4">
          {actionData.error}
        </p>
      ) : null}
      <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
        <section aria-labelledby="saved-heading">
          <h2 id="saved-heading" className="type-heading-md text-on-surface mb-4">
            Saved addresses
          </h2>
          {addresses.length === 0 ? (
            <p className="text-on-surface-secondary">No addresses saved yet.</p>
          ) : (
            <ul role="list" className="grid gap-4">
              {addresses.map((address) => {
                const isDefault = address.id === defaultAddressId;
                return (
                  <li key={address.id} className="border-border rounded-card border p-5">
                    {isDefault ? <p className="badge-success mb-3 inline-block">Default</p> : null}
                    <address className="text-on-surface not-italic">
                      {address.formatted.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </address>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {isDefault ? null : (
                        <Form method="post">
                          <input type="hidden" name="intent" value="make-default" />
                          <input type="hidden" name="addressId" value={address.id} />
                          <button type="submit" className={`button-ghost ${buttonClass}`}>
                            Make default
                          </button>
                        </Form>
                      )}
                      <Form
                        method="post"
                        onSubmit={(event) => {
                          if (!confirm("Delete this address?")) event.preventDefault();
                        }}
                      >
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="addressId" value={address.id} />
                        <button type="submit" className={`button-ghost ${buttonClass}`}>
                          Delete
                        </button>
                      </Form>
                    </div>
                    <details className="mt-4">
                      <summary className="text-on-surface cursor-pointer text-sm font-medium">
                        Edit address
                      </summary>
                      <Form method="post" className="mt-4">
                        <input type="hidden" name="intent" value="update" />
                        <input type="hidden" name="addressId" value={address.id} />
                        <AddressFields address={address} />
                        <DefaultCheckbox id={`${address.id}-default`} checked={isDefault} />
                        <button
                          type="submit"
                          className={`button-primary mt-6 ${buttonClass}`}
                          disabled={pendingIntent === "update"}
                        >
                          Save address
                        </button>
                      </Form>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="new-heading">
          <h2 id="new-heading" className="type-heading-md text-on-surface mb-4">
            Add an address
          </h2>
          <Form
            method="post"
            // Clear the form after a successful create.
            key={actionData?.ok && actionData.intent === "create" ? addresses.length : "new"}
          >
            <input type="hidden" name="intent" value="create" />
            <AddressFields />
            <DefaultCheckbox id="new-default" checked={addresses.length === 0} />
            <button
              type="submit"
              className={`button-primary mt-6 ${buttonClass}`}
              disabled={pendingIntent === "create"}
            >
              {pendingIntent === "create" ? "Saving…" : "Add address"}
            </button>
          </Form>
        </section>
      </div>
    </AccountShell>
  );
}

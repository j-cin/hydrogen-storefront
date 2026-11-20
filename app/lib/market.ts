// Market selection. Morrow sells in AUD by default, with USD and NZD markets
// (Settings > Markets). The buyer's explicit choice from the footer country
// selector is kept in a cookie; URLs stay the same for every market.

export type Market = {
  country: "AU" | "US" | "NZ";
  language: "EN";
  /** Selector label, e.g. "Australia (AUD $)". */
  label: string;
};

export const MARKETS = [
  { country: "AU", language: "EN", label: "Australia (AUD $)" },
  { country: "US", language: "EN", label: "United States (USD $)" },
  { country: "NZ", language: "EN", label: "New Zealand (NZD $)" },
] as const satisfies readonly Market[];

export const DEFAULT_MARKET: Market = MARKETS[0];

export const MARKET_COOKIE = "morrow_market";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function findMarket(country: string | null | undefined): Market | undefined {
  const code = country?.trim().toUpperCase();
  return MARKETS.find((market) => market.country === code);
}

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export function getMarketFromRequest(request: Request): Market {
  return findMarket(readCookie(request.headers.get("cookie"), MARKET_COOKIE)) ?? DEFAULT_MARKET;
}

export function serializeMarketCookie(market: Market, secure: boolean): string {
  return [
    `${MARKET_COOKIE}=${market.country}`,
    "Path=/",
    `Max-Age=${ONE_YEAR_SECONDS}`,
    "SameSite=Lax",
    secure ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");
}

/** Keeps a post-switch redirect on this site: a same-origin path or "/". */
export function safeRedirectPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

import {
  AnalyticsEvent,
  buildProductSelectionSearchParams,
  canAddToCart,
  getSelectedProductOptions,
  gql,
  type SelectedOption,
} from "@shopify/hydrogen";
import { ShopPayButton } from "@shopify/hydrogen/react";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate, useRouteLoaderData } from "react-router";

import { ProductCard, PRODUCT_CARD_FRAGMENT } from "~/components/ProductCard";
import { RichText } from "~/components/RichText";
import { openCartDrawer } from "~/lib/cart-drawer";
import { formatPrice, salePercent } from "~/lib/money";
import { ProductProvider, useProductForm } from "~/lib/product";
import { formatRoastDate } from "~/lib/roast-date";
import { storefrontClientContext } from "~/lib/storefront";
import { formatPageTitle, getShopNameFromRootMatch } from "~/lib/storefront-shop";

import type { Route } from "./+types/product";

const PRODUCT_VARIANT_FRAGMENT = gql(`
  fragment ProductVariantFields on ProductVariant {
    id
    title
    availableForSale
    quantityAvailable
    selectedOptions {
      name
      value
    }
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    image {
      id
      url
      altText
      width
      height
    }
    product {
      title
      handle
    }
    sku
  }
`);

const PRODUCT_QUERY = gql(
  `
    query ProductPage($handle: String!, $selectedOptions: [SelectedOptionInput!]!) {
      product(handle: $handle) {
        id
        handle
        title
        vendor
        description
        descriptionHtml
        requiresSellingPlan
        # Morrow coffee profile (custom.* product metafields, Storefront access enabled).
        tastingNotes: metafield(namespace: "custom", key: "tasting_notes") {
          value
        }
        roastLevel: metafield(namespace: "custom", key: "roast_level") {
          value
        }
        process: metafield(namespace: "custom", key: "process") {
          value
        }
        altitude: metafield(namespace: "custom", key: "altitude") {
          value
        }
        varietals: metafield(namespace: "custom", key: "varietals") {
          value
        }
        producer: metafield(namespace: "custom", key: "producer") {
          reference {
            ... on Metaobject {
              handle
              name: field(key: "name") {
                value
              }
              farmOrStation: field(key: "farm_or_station") {
                value
              }
              region: field(key: "region") {
                value
              }
              country: field(key: "country") {
                value
              }
              workingWithSince: field(key: "working_with_since") {
                value
              }
              photo: field(key: "photo") {
                reference {
                  ... on MediaImage {
                    image {
                      url
                      altText
                      width
                      height
                    }
                  }
                }
              }
            }
          }
        }
        brewRecipes: metafield(namespace: "custom", key: "brew_recipes") {
          references(first: 6) {
            nodes {
              ... on Metaobject {
                handle
                method: field(key: "method") {
                  value
                }
                doseG: field(key: "dose_g") {
                  value
                }
                waterG: field(key: "water_g") {
                  value
                }
                grind: field(key: "grind") {
                  value
                }
                brewTime: field(key: "brew_time") {
                  value
                }
                steps: field(key: "steps") {
                  value
                }
              }
            }
          }
        }
        pairsWith: metafield(namespace: "custom", key: "pairs_with") {
          references(first: 4) {
            nodes {
              ... on Product {
                ...ProductCard
              }
            }
          }
        }
        sellingPlanGroups(first: 4) {
          nodes {
            name
            sellingPlans(first: 6) {
              nodes {
                id
                name
                options {
                  name
                  value
                }
                priceAdjustments {
                  adjustmentValue {
                    ... on SellingPlanPercentagePriceAdjustment {
                      adjustmentPercentage
                    }
                  }
                }
              }
            }
          }
        }
        encodedVariantExistence
        encodedVariantAvailability
        featuredImage {
          id
          url
          altText
          width
          height
        }
        images(first: 8) {
          nodes {
            id
            url
            altText
            width
            height
          }
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        options {
          name
          optionValues {
            name
            firstSelectableVariant {
              ...ProductVariantFields
            }
            swatch {
              color
              image {
                previewImage {
                  url
                }
              }
            }
          }
        }
        selectedOrFirstAvailableVariant(
          selectedOptions: $selectedOptions
          ignoreUnknownOptions: true
          caseInsensitiveMatch: true
        ) {
          ...ProductVariantFields
        }
        adjacentVariants(
          selectedOptions: $selectedOptions
          ignoreUnknownOptions: true
          caseInsensitiveMatch: true
        ) {
          ...ProductVariantFields
        }
      }
      products(first: 5) {
        nodes {
          ...ProductCard
        }
      }
    }
  `,
  [PRODUCT_VARIANT_FRAGMENT, PRODUCT_CARD_FRAGMENT],
);

export function meta({ matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  return [
    { title: formatPageTitle("Product", shopName) },
    {
      name: "description",
      content: `Shop the ${shopName} product detail page.`,
    },
  ];
}

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const handle = params.handle;
  if (!handle) throw new Response("Not Found", { status: 404 });

  const storefrontClient = context.get(storefrontClientContext);
  const selectedOptions = getSelectedProductOptions({
    searchParams: new URL(request.url).searchParams,
  });
  const { data } = await storefrontClient.graphql(PRODUCT_QUERY, {
    variables: { handle, selectedOptions },
  });

  if (!data?.product) throw new Response("Not Found", { status: 404 });

  return {
    product: data.product,
    relatedProducts: data.products.nodes
      .filter((product) => product.handle !== data.product?.handle)
      .slice(0, 4),
  };
}

type ProductData = Route.ComponentProps["loaderData"]["product"];
type ProductVariant = NonNullable<ProductData["selectedOrFirstAvailableVariant"]>;
type RelatedProduct = Route.ComponentProps["loaderData"]["relatedProducts"][number];

type ProductImage = {
  id?: string | null;
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

type SwatchValue = {
  color?: string | null;
  imageUrl?: string | null;
};

function toRouterLocation(url: string) {
  return url;
}

function variantUrl(
  product: { handle: string; options: Array<{ name: string }> },
  selectedOptions: SelectedOption[],
  handle = product.handle,
  base: URLSearchParams = new URLSearchParams(),
) {
  const params = buildProductSelectionSearchParams({
    selectedOptions,
    optionNames: product.options.map((option) => option.name),
    base,
  });
  const query = params.toString();
  return `/products/${handle}${query ? `?${query}` : ""}`;
}

function buildSwatchLookup(product: ProductData) {
  const lookup = new Map<string, SwatchValue>();
  for (const option of product.options) {
    for (const value of option.optionValues) {
      const swatch = value.swatch;
      lookup.set(`${option.name}:${value.name}`, {
        color: swatch?.color ?? null,
        imageUrl: swatch?.image?.previewImage?.url ?? null,
      });
    }
  }
  return lookup;
}

function hasSwatchData(product: ProductData, optionName: string) {
  const option = product.options.find((candidate) => candidate.name === optionName);
  return Boolean(
    option?.optionValues.some(
      (value) => value.swatch?.color || value.swatch?.image?.previewImage?.url,
    ),
  );
}

function ProductViewedTracker({ product }: { product: ProductData }) {
  useEffect(() => {
    const selectedVariant = product.selectedOrFirstAvailableVariant;
    window.Shopify?.analytics?.publish(AnalyticsEvent.PRODUCT_VIEWED, {
      products: [
        {
          id: product.id,
          title: product.title,
          price: selectedVariant?.price ?? product.priceRange.minVariantPrice,
          vendor: product.vendor ?? "",
          variantId: selectedVariant?.id ?? product.id,
          variantTitle: selectedVariant?.title ?? product.title,
          quantity: 1,
          sku: selectedVariant?.sku,
        },
      ],
    });
  }, [product]);

  return null;
}

function useGalleryImages(product: ProductData, selectedVariant: ProductVariant | null) {
  return useMemo(() => {
    const images: ProductImage[] = [];
    const seen = new Set<string>();
    const addImage = (image: ProductImage | null | undefined) => {
      if (!image?.url || seen.has(image.url)) return;
      seen.add(image.url);
      images.push(image);
    };

    addImage(selectedVariant?.image ?? product.featuredImage ?? product.images.nodes[0]);
    for (const image of product.images.nodes) addImage(image);
    return images;
  }, [product, selectedVariant]);
}

function galleryDotClass(active: boolean) {
  if (active) return "bg-on-surface size-2 rounded-full";
  return "bg-on-surface/30 size-2 rounded-full";
}

function isWide(image: { width?: number | null; height?: number | null }) {
  return Boolean(image.width && image.height && image.width / image.height > 1.2);
}

function ProductGallery({
  product,
  selectedVariant,
}: {
  product: ProductData;
  selectedVariant: ProductVariant | null;
}) {
  const images = useGalleryImages(product, selectedVariant);
  const primaryImageUrl = images[0]?.url;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => setActiveIndex(0), [primaryImageUrl]);

  return (
    <div data-testid="product-gallery">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={product.title}
        className="relative grid"
      >
        <div
          data-product-gallery-track
          className="flex snap-x snap-mandatory overflow-x-auto md:grid md:grid-cols-2 md:gap-2 md:overflow-visible"
          style={{ scrollbarWidth: "none" }}
          tabIndex={0}
          onScroll={(event) => {
            const track = event.currentTarget;
            if (track.clientWidth > 0) {
              setActiveIndex(Math.round(track.scrollLeft / track.clientWidth));
            }
          }}
        >
          {images.map((image, index) => (
            <div
              key={image.url}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${images.length}`}
              // The lead image spans the whole gallery; extra images sit two-up below it.
              className={`w-full shrink-0 snap-center contain-paint md:w-auto md:shrink ${index === 0 ? "md:col-span-2" : ""}`}
            >
              <div className="bg-surface-secondary aspect-square overflow-hidden md:rounded-card">
                <img
                  src={image.url}
                  alt={image.altText ?? product.title}
                  width={image.width ?? undefined}
                  height={image.height ?? undefined}
                  // Wide photos would lose their edges in the square frame, so fit them instead.
                  className={`h-full w-full ${isWide(image) ? "object-contain" : "object-cover"}`}
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  data-testid={index === 0 ? "product-gallery-image" : undefined}
                />
              </div>
            </div>
          ))}
        </div>
        {images.length > 1 ? (
          <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-3 md:hidden">
            <div
              data-slideshow-dots
              role="group"
              aria-label="Slideshow pagination"
              className="flex items-center justify-center gap-2"
            >
              {images.map((image, index) => (
                <span key={image.url} className={galleryDotClass(index === activeIndex)} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type SellingPlanOption = {
  id: string;
  groupName: string;
  label: string;
  percentOff: number;
};

function getSellingPlans(product: ProductData): SellingPlanOption[] {
  return product.sellingPlanGroups.nodes.flatMap((group) =>
    group.sellingPlans.nodes.map((plan) => {
      const adjustment = plan.priceAdjustments[0]?.adjustmentValue;
      const percentOff =
        adjustment && "adjustmentPercentage" in adjustment ? adjustment.adjustmentPercentage : 0;
      return {
        id: plan.id,
        groupName: group.name,
        label: plan.options[0]?.value ? `Every ${plan.options[0].value}` : plan.name,
        percentOff,
      };
    }),
  );
}

function discounted<T extends { amount: string }>(price: T, percentOff: number): T {
  if (!percentOff) return price;
  return { ...price, amount: (Number(price.amount) * (1 - percentOff / 100)).toFixed(2) };
}

function PriceBlock({
  product,
  selectedVariant,
  sellingPlan,
}: {
  product: ProductData;
  selectedVariant: ProductVariant | null;
  sellingPlan: SellingPlanOption | null;
}) {
  const basePrice = selectedVariant?.price ?? product.priceRange.minVariantPrice;
  // A subscription discount shows like a sale: the plan price against the one-time price.
  const price = sellingPlan ? discounted(basePrice, sellingPlan.percentOff) : basePrice;
  const compareAt = sellingPlan?.percentOff ? basePrice : selectedVariant?.compareAtPrice;
  const percent = salePercent(price, compareAt);

  return (
    <div className="mt-4" data-product-price>
      <div className="inline-flex flex-wrap items-baseline gap-2">
        {compareAt && percent ? (
          <>
            <span className="text-on-surface font-semibold">
              <span className="sr-only">Sale price: </span>
              {formatPrice(price)}
            </span>
            <s className="text-compare text-sm">
              <span className="sr-only">Regular price: </span>
              {formatPrice(compareAt)}
            </s>
            <span className="text-on-surface text-sm font-semibold" aria-label={`Save ${percent}%`}>
              (-{percent}%)
            </span>
          </>
        ) : (
          <span className="text-on-surface font-medium">
            <span className="sr-only">Price: </span>
            {formatPrice(price)}
          </span>
        )}
      </div>
    </div>
  );
}

function InventoryHint({ selectedVariant }: { selectedVariant: ProductVariant | null }) {
  if (!selectedVariant) return null;
  if (!selectedVariant.availableForSale) {
    return (
      <div className="mt-3">
        <div className="flex items-center gap-2 text-sm" data-product-inventory>
          <span
            className="bg-critical inline-block h-2 w-2 shrink-0 rounded-full"
            aria-hidden="true"
          />
          <span className="text-critical font-medium">Out of stock</span>
        </div>
      </div>
    );
  }

  const quantity = selectedVariant.quantityAvailable;
  if (quantity == null || quantity > 5) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 text-sm" data-product-inventory>
        <span
          className="bg-warning inline-block h-2 w-2 shrink-0 rounded-full"
          aria-hidden="true"
        />
        <span className="text-warning font-medium">Only {quantity} left in stock</span>
      </div>
    </div>
  );
}

// Mirrors React Router's own Link guard: a modified or non-primary click belongs to
// the browser (new tab, new window), so the href must stay in charge of it.
function isPlainActivation(event: MouseEvent<HTMLAnchorElement>) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    (!event.currentTarget.target || event.currentTarget.target === "_self")
  );
}

function VariantOptions({ product }: { product: ProductData }) {
  const { options, register } = useProductForm();
  const swatches = useMemo(() => buildSwatchLookup(product), [product]);
  const location = useLocation();
  const baseParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  // Single-variant products only have Shopify's placeholder "Title: Default Title".
  const isSingleVariant =
    options.length === 1 && options[0]?.values.length === 1 && options[0].name === "Title";
  if (isSingleVariant) return null;

  return (
    <div className="swatch-buttons space-y-4">
      {options.map((option) => {
        const selectedValue = option.values.find((value) => value.selected)?.name;
        const renderSwatches = hasSwatchData(product, option.name);
        const isColorOption = option.name.toLowerCase().includes("color");

        return (
          <fieldset key={option.name} className="space-y-2">
            <legend className="text-on-surface text-sm font-medium">
              {option.name}
              {selectedValue ? `: ${selectedValue}` : ""}
            </legend>
            <div className="flex flex-wrap gap-2" role="group" aria-label={option.name}>
              {option.values.map((variantOption) => {
                const valueName = variantOption.name;
                const registered = register("optionValue", {
                  optionName: option.name,
                  value: valueName,
                });
                const isCrossProduct = variantOption.handle !== product.handle;
                const linkTarget = variantUrl(
                  product,
                  variantOption.selectedOptions,
                  variantOption.handle,
                  baseParams,
                );
                const soldOut = !variantOption.available;
                const testId = isColorOption ? "color-swatch" : undefined;
                const swatch = renderSwatches ? swatches.get(`${option.name}:${valueName}`) : null;
                const swatchStyle = swatch?.imageUrl
                  ? { backgroundImage: `url("${swatch.imageUrl}")` }
                  : { backgroundColor: swatch?.color ?? undefined };

                const className = renderSwatches
                  ? `min-h-touch-target min-w-touch-target relative inline-flex cursor-pointer items-center justify-center motion-safe:transition-transform motion-safe:active:scale-[0.93] ${soldOut ? "opacity-50" : ""}`
                  : `option-pill focus-visible:outline-accent motion-safe:transition-[color,background-color,border-color,transform] motion-safe:active:scale-[0.97] ${variantOption.selected ? "is-selected" : ""} ${soldOut ? "opacity-50" : ""}`;
                const content = renderSwatches ? (
                  <>
                    <span
                      className={`swatch-md border-border relative inline-flex items-center justify-center overflow-hidden rounded-full border-2 ring-offset-2 ${variantOption.selected ? "border-interactive" : ""}`}
                      style={swatchStyle}
                    >
                      {variantOption.selected ? (
                        <span className="swatch-scrim absolute inset-0" />
                      ) : null}
                      {soldOut ? (
                        <svg
                          className="absolute inset-0 h-full w-full"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          aria-hidden="true"
                        >
                          <line x1="4" y1="4" x2="20" y2="20" />
                        </svg>
                      ) : null}
                    </span>
                    <span className="sr-only">
                      {valueName}
                      {soldOut ? " (Sold out)" : ""}
                    </span>
                  </>
                ) : (
                  `${valueName}${soldOut ? " (Sold out)" : ""}`
                );

                if (!isCrossProduct && !variantOption.exists) {
                  return (
                    <button
                      key={valueName}
                      type="button"
                      disabled
                      className={className}
                      aria-label={renderSwatches ? valueName : undefined}
                      aria-pressed={variantOption.selected}
                      data-testid={testId}
                    >
                      {content}
                    </button>
                  );
                }

                // Every selectable value is an <a> whichever product it belongs to. The
                // activated value flips from cross-product to same-product after the
                // navigation, and a change of element type there would remount the
                // focused control and drop focus to <body>.
                return (
                  <Link
                    key={valueName}
                    to={toRouterLocation(linkTarget)}
                    replace={!isCrossProduct}
                    preventScrollReset
                    className={className}
                    aria-label={renderSwatches ? valueName : undefined}
                    aria-current={variantOption.selected ? "true" : undefined}
                    data-testid={testId}
                    onClick={
                      isCrossProduct
                        ? undefined
                        : (event) => {
                            if (!isPlainActivation(event)) return;
                            registered.onClick();
                            // onSelect has already navigated with the provider's replace
                            // and revalidation settings. Letting Link navigate too would
                            // refetch the loader that a resolved selection just skipped.
                            event.preventDefault();
                          }
                    }
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

function QuantitySelector({
  quantity,
  setQuantity,
}: {
  quantity: number;
  setQuantity: (quantity: number) => void;
}) {
  const { register } = useProductForm();
  const clamp = (value: number) => Math.min(99, Math.max(1, value));

  return (
    <div className="shrink-0">
      <label className="text-on-surface mb-2 block text-sm font-medium" htmlFor="quantity">
        Quantity
      </label>
      <div
        className="quantity-selector-outlined rounded-input inline-flex items-center"
        data-testid="quantity-stepper"
      >
        <button
          type="button"
          className="text-on-surface-secondary hover:text-on-surface inline-flex size-11 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-[color,transform] motion-safe:active:scale-[0.90]"
          aria-label="Decrease quantity"
          onClick={() => setQuantity(clamp(quantity - 1))}
          disabled={quantity <= 1}
        >
          <img src="/icons/icon-minus.svg" alt="" className="size-4" aria-hidden="true" />
        </button>
        <input
          type="number"
          id="quantity"
          {...register("quantity", { value: quantity })}
          min={1}
          max={99}
          step={1}
          className="number-reset text-on-surface h-11 w-12 rounded-none border-0 bg-transparent p-0 text-center text-sm"
          aria-label="Quantity"
          onChange={(event) =>
            setQuantity(clamp(Number.parseInt(event.currentTarget.value, 10) || 1))
          }
        />
        <button
          type="button"
          className="text-on-surface-secondary hover:text-on-surface inline-flex size-11 items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-[color,transform] motion-safe:active:scale-[0.90]"
          aria-label="Increase quantity"
          onClick={() => setQuantity(clamp(quantity + 1))}
          disabled={quantity >= 99}
        >
          <img src="/icons/icon-plus.svg" alt="" className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function PurchaseOptions({
  product,
  plans,
  selectedPlanId,
  setSelectedPlanId,
}: {
  product: ProductData;
  plans: SellingPlanOption[];
  selectedPlanId: string;
  setSelectedPlanId: (id: string) => void;
}) {
  if (plans.length === 0) return null;
  const bestSaving = Math.max(...plans.map((plan) => plan.percentOff));
  const subscribeLabel = bestSaving > 0 ? `Subscribe & save ${bestSaving}%` : "Subscribe";

  // The cart reads `sellingPlanId` from the form data; an empty value means a one-time purchase.
  return (
    <fieldset className="mt-6 space-y-2">
      <legend className="text-on-surface mb-2 text-sm font-medium">Purchase options</legend>
      {product.requiresSellingPlan ? null : (
        <label className="border-border flex cursor-pointer items-center gap-3 rounded-input border p-3 text-sm">
          <input
            type="radio"
            name="sellingPlanId"
            value=""
            checked={selectedPlanId === ""}
            onChange={() => setSelectedPlanId("")}
            className="accent-apricot size-4"
          />
          <span className="text-on-surface font-semibold">One-time purchase</span>
        </label>
      )}
      <div className="border-border rounded-input border p-3 text-sm">
        <p className="text-on-surface mb-2 font-semibold">{subscribeLabel}</p>
        <p className="text-on-surface-secondary mb-3">Ships free. Skip or cancel any time.</p>
        <div className="flex flex-wrap gap-2">
          {plans.map((plan) => (
            <label
              key={plan.id}
              className={`option-pill focus-within:outline-accent cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 ${selectedPlanId === plan.id ? "is-selected" : ""}`}
            >
              <input
                type="radio"
                name="sellingPlanId"
                value={plan.id}
                checked={selectedPlanId === plan.id}
                onChange={() => setSelectedPlanId(plan.id)}
                className="sr-only"
              />
              {plan.label}
            </label>
          ))}
        </div>
      </div>
    </fieldset>
  );
}

function AddToCart({
  product,
  quantity,
  setQuantity,
  selectedVariant,
  plans,
  selectedPlanId,
  setSelectedPlanId,
}: {
  product: ProductData;
  quantity: number;
  setQuantity: (quantity: number) => void;
  selectedVariant: ProductVariant | null;
  plans: SellingPlanOption[];
  selectedPlanId: string;
  setSelectedPlanId: (id: string) => void;
}) {
  const { options, register, formProps, errors, pending } = useProductForm();
  // canAddToCart() always refuses products that require a selling plan, so those
  // become addable once the variant is in stock and a plan is chosen.
  const addable = product.requiresSellingPlan
    ? Boolean(selectedVariant?.availableForSale && selectedPlanId)
    : canAddToCart(product, options);
  const buttonText = !addable
    ? selectedVariant?.availableForSale === false
      ? "Sold out"
      : selectedVariant
        ? "Choose a delivery"
        : "Select options"
    : selectedPlanId
      ? "Start subscription"
      : "Add to cart";

  return (
    <>
      <form {...formProps({ afterSubmit: openCartDrawer })}>
        <PurchaseOptions
          product={product}
          plans={plans}
          selectedPlanId={selectedPlanId}
          setSelectedPlanId={setSelectedPlanId}
        />
        <div className="mt-6 mb-10 flex items-center gap-4">
          <QuantitySelector quantity={quantity} setQuantity={setQuantity} />
        </div>
        <input type="hidden" {...register("merchandiseId", {})} />
        <button
          {...register("addToCart", {})}
          className="rounded-button button-primary focus-visible:outline-accent inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-[color,background-color,border-color,transform] motion-safe:active:scale-[0.97]"
          disabled={!addable || pending}
          data-testid="add-to-cart"
        >
          {buttonText}
        </button>
      </form>
      {/* Shop Pay's express button can't carry a selling plan, so it's one-time only. */}
      {selectedVariant && !selectedPlanId ? (
        <div className="mt-3">
          <ShopPayButton
            variants={[{ id: selectedVariant.id, quantity }]}
            disabled={!addable || pending}
            width="100%"
            borderRadius="8px"
          />
        </div>
      ) : null}
      {[...errors.userErrors, ...errors.warnings, ...errors.networkErrors].length ? (
        <div className="mt-3 grid gap-1 text-sm" role="alert">
          {errors.userErrors.map((error) => (
            <p key={error.message} className="text-critical">
              {error.message}
            </p>
          ))}
          {errors.warnings.map((warning) => (
            <p key={warning.message} className="text-warning">
              {warning.message}
            </p>
          ))}
          {errors.networkErrors.map((error) => (
            <p key={error.message} className="text-critical">
              {error.message}
            </p>
          ))}
        </div>
      ) : null}
    </>
  );
}

function ProductInfo({
  product,
  selectedVariant,
}: {
  product: ProductData;
  selectedVariant: ProductVariant | null;
}) {
  const [quantity, setQuantity] = useState(1);
  const plans = useMemo(() => getSellingPlans(product), [product]);
  // Subscription-only products start on their first plan; everything else starts one-time.
  const [selectedPlanId, setSelectedPlanId] = useState(() =>
    product.requiresSellingPlan ? (plans[0]?.id ?? "") : "",
  );
  const sellingPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null;

  return (
    <div className="flex flex-col gap-6 md:sticky md:top-8 md:self-start">
      <div className="pt-4 md:pt-8">
        {product.vendor ? (
          <p className="type-body-sm text-on-surface-secondary mb-4 tracking-wide uppercase">
            {product.vendor}
          </p>
        ) : null}
        <h1 className="type-display text-on-surface">{product.title}</h1>
        <TastingNotes product={product} />
        <PriceBlock product={product} selectedVariant={selectedVariant} sellingPlan={sellingPlan} />
        <InventoryHint selectedVariant={selectedVariant} />
      </div>

      <span className="sr-only" aria-live="polite" id="inventory-status" />

      <CoffeeProfile product={product} />

      <div data-product-form>
        <span className="sr-only" aria-live="polite" data-add-to-cart-status />
        <VariantOptions product={product} />
        <AddToCart
          product={product}
          quantity={quantity}
          setQuantity={setQuantity}
          selectedVariant={selectedVariant}
          plans={plans}
          selectedPlanId={selectedPlanId}
          setSelectedPlanId={setSelectedPlanId}
        />
      </div>

      <h2 className="sr-only">Product details</h2>
      <details className="group border-border border-t border-b" name="product-details" open>
        <summary className="marker-hidden text-on-surface hover:text-on-surface-secondary flex cursor-pointer items-center justify-between px-1 py-4 text-sm font-medium">
          <span className="text-sm font-medium">Description</span>
          <span
            className="ms-4 size-4 shrink-0 group-open:rotate-180 motion-safe:transition-transform motion-safe:duration-200"
            aria-hidden="true"
          >
            <img src="/icons/icon-chevron-down.svg" alt="" className="size-4" />
          </span>
        </summary>
        <div className="richtext text-on-surface-secondary px-1 pb-4 text-sm">
          {product.descriptionHtml ? (
            <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
          ) : (
            <p>{product.description}</p>
          )}
        </div>
      </details>
    </div>
  );
}

// custom.roast_level is an integer from 1 (light) to 5 (dark).
const ROAST_LABELS = ["Extra light", "Light", "Medium", "Medium-dark", "Dark"];

function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseRoastLevel(value: string | null | undefined): number | null {
  const level = Number.parseInt(value ?? "", 10);
  return level >= 1 && level <= 5 ? level : null;
}

function TastingNotes({ product }: { product: ProductData }) {
  const notes = parseList(product.tastingNotes?.value);
  if (notes.length === 0) return null;

  return (
    // Plain descriptive text, not pills: bordered chips read as tappable controls
    // next to the variant options and buttons below.
    <div className="mt-3">
      <h2 className="sr-only">Tasting notes</h2>
      <ul role="list" className="type-body-lg text-on-surface-secondary flex flex-wrap items-center">
        {notes.map((note, index) => (
          <li key={note} className="inline-flex items-center">
            {index > 0 ? (
              <span className="bg-apricot mx-3 size-1.5 rounded-full" aria-hidden="true" />
            ) : null}
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoastMeter({ level }: { level: number }) {
  const label = ROAST_LABELS[level - 1];
  return (
    <div>
      <dt className="text-on-surface-secondary">Roast</dt>
      <dd className="text-on-surface font-semibold">
        <span>{label}</span>
        <span className="sr-only">, {level} out of 5</span>
        <span className="mt-1.5 flex gap-1.5" aria-hidden="true">
          {ROAST_LABELS.map((step, index) => (
            <span
              key={step}
              className={`size-2.5 rounded-full ${index < level ? "bg-roast" : "bg-fog"}`}
            />
          ))}
        </span>
      </dd>
    </div>
  );
}

type Producer = Extract<
  NonNullable<NonNullable<ProductData["producer"]>["reference"]>,
  { handle: string }
>;

function ProducerCard({ producer }: { producer: Producer }) {
  const photo = producer.photo?.reference && "image" in producer.photo.reference
    ? producer.photo.reference.image
    : null;
  const name = producer.name?.value ?? producer.handle;
  const place = [producer.region?.value, producer.country?.value].filter(Boolean).join(", ");
  const since = producer.workingWithSince?.value;
  const farm = producer.farmOrStation?.value;

  return (
    <section
      aria-labelledby="producer-card-heading"
      className="bg-paper rounded-card border-border flex gap-4 border p-4"
    >
      {photo ? (
        <img
          src={photo.url}
          alt={photo.altText ?? ""}
          width={photo.width ?? undefined}
          height={photo.height ?? undefined}
          className="size-20 shrink-0 rounded-full object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="flex min-w-0 flex-col gap-1 text-sm">
        <p className="type-overline text-on-surface-secondary">Grown by</p>
        <h2 id="producer-card-heading" className="type-heading-sm text-on-surface">
          {name}
        </h2>
        {farm && farm !== name ? <p className="text-on-surface">{farm}</p> : null}
        {place ? <p className="text-on-surface-secondary">{place}</p> : null}
        {since ? (
          <p className="text-on-surface-secondary">Working with Morrow since {since}</p>
        ) : null}
        <Link
          to={`/producers/${producer.handle}`}
          className="text-on-surface decoration-apricot mt-1 self-start font-semibold underline decoration-2 underline-offset-4 hover:decoration-current"
        >
          Meet the producer
        </Link>
      </div>
    </section>
  );
}

function CoffeeProfile({ product }: { product: ProductData }) {
  const rootData = useRouteLoaderData<{ nextRoastDate?: string }>("root");
  const roastLevel = parseRoastLevel(product.roastLevel?.value);
  const varietals = parseList(product.varietals?.value);
  const producer =
    product.producer?.reference && "handle" in product.producer.reference
      ? product.producer.reference
      : null;
  const specs = [
    { label: "Process", value: product.process?.value },
    // masl: metres above sea level. Higher farms grow slower, sweeter coffee.
    { label: "Altitude", value: product.altitude?.value },
    { label: "Varietals", value: varietals.join(", ") || null },
  ].filter((spec): spec is { label: string; value: string } => Boolean(spec.value));

  // Gear and merch have no coffee profile.
  if (!roastLevel && specs.length === 0 && !producer) return null;

  return (
    <div className="border-border flex flex-col gap-5 border-y py-6">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
        {roastLevel ? <RoastMeter level={roastLevel} /> : null}
        {specs.map((spec) => (
          <div key={spec.label}>
            <dt className="text-on-surface-secondary">{spec.label}</dt>
            <dd className="text-on-surface font-semibold">{spec.value}</dd>
          </div>
        ))}
      </dl>
      {producer ? <ProducerCard producer={producer} /> : null}
      {rootData?.nextRoastDate ? (
        <p className="type-stamp text-on-surface-secondary">
          Next roast {formatRoastDate(rootData.nextRoastDate)}
        </p>
      ) : null}
    </div>
  );
}

type BrewRecipe = {
  handle: string;
  method: string;
  doseG: string | null;
  waterG: string | null;
  grind: string | null;
  brewTime: string | null;
  steps: string | null;
};

function getBrewRecipes(product: ProductData): BrewRecipe[] {
  return (product.brewRecipes?.references?.nodes ?? []).flatMap((node) =>
    "handle" in node && node.method?.value
      ? [
          {
            handle: node.handle,
            method: node.method.value,
            doseG: node.doseG?.value ?? null,
            waterG: node.waterG?.value ?? null,
            grind: node.grind?.value ?? null,
            brewTime: node.brewTime?.value ?? null,
            steps: node.steps?.value ?? null,
          },
        ]
      : [],
  );
}

function brewRatio(recipe: BrewRecipe) {
  const dose = Number(recipe.doseG);
  const water = Number(recipe.waterG);
  if (!dose || !water) return null;
  const ratio = water / dose;
  return `1:${Number.isInteger(ratio) ? ratio : ratio.toFixed(1)}`;
}

// WAI-ARIA tabs: arrow keys move between tabs, and only the active tab is in the tab order.
function BrewRecipes({ product }: { product: ProductData }) {
  const recipes = getBrewRecipes(product);
  const [active, setActive] = useState(0);
  if (recipes.length === 0) return null;
  const current = recipes[Math.min(active, recipes.length - 1)]!;

  const focusTab = (index: number) => {
    const next = (index + recipes.length) % recipes.length;
    setActive(next);
    document.getElementById(`recipe-tab-${recipes[next]!.handle}`)?.focus();
  };

  const stats = [
    { label: "Coffee", value: current.doseG ? `${current.doseG} g` : null },
    { label: "Water", value: current.waterG ? `${current.waterG} g` : null },
    { label: "Ratio", value: brewRatio(current) },
    { label: "Grind", value: current.grind },
    { label: "Time", value: current.brewTime },
  ].filter((stat): stat is { label: string; value: string } => Boolean(stat.value));

  return (
    <section
      aria-labelledby="brew-recipes-heading"
      className="max-w-page px-margin mx-auto mb-16 w-full"
    >
      <h2 id="brew-recipes-heading" className="type-heading-xl mb-6">
        How to brew it
      </h2>
      <div role="tablist" aria-label="Brew methods" className="border-border mb-6 flex gap-2 border-b">
        {recipes.map((recipe, index) => {
          const selected = recipe.handle === current.handle;
          return (
            <button
              key={recipe.handle}
              id={`recipe-tab-${recipe.handle}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`recipe-panel-${recipe.handle}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") focusTab(index + 1);
                else if (event.key === "ArrowLeft") focusTab(index - 1);
                else if (event.key === "Home") focusTab(0);
                else if (event.key === "End") focusTab(recipes.length - 1);
                else return;
                event.preventDefault();
              }}
              className={`min-h-touch-target -mb-px border-b-2 px-3 text-sm font-semibold focus-visible:outline-accent ${selected ? "border-apricot text-on-surface" : "text-on-surface-secondary hover:text-on-surface border-transparent"}`}
            >
              {recipe.method}
            </button>
          );
        })}
      </div>
      <div
        id={`recipe-panel-${current.handle}`}
        role="tabpanel"
        aria-labelledby={`recipe-tab-${current.handle}`}
        tabIndex={0}
        className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
      >
        <dl className="bg-paper rounded-card border-border grid grid-cols-2 gap-4 self-start border p-5 text-sm">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-on-surface-secondary">{stat.label}</dt>
              <dd className="text-on-surface font-semibold">{stat.value}</dd>
            </div>
          ))}
        </dl>
        <RichText
          value={current.steps}
          className="richtext text-on-surface [&_ol]:list-decimal [&_ol]:space-y-3 [&_ol]:ps-5"
        />
      </div>
    </section>
  );
}

function BrewItWith({ product }: { product: ProductData }) {
  const products = (product.pairsWith?.references?.nodes ?? []).filter(
    (node): node is RelatedProduct => "handle" in node,
  );
  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="brew-it-with-heading"
      className="max-w-page px-margin mx-auto mb-16 w-full"
    >
      <h2 id="brew-it-with-heading" className="type-heading-xl mb-6">
        Brew it with
      </h2>
      <ul role="list" className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
        {products.map((pairing) => (
          <li key={pairing.handle}>
            <ProductCard product={pairing} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProductPageContent({ product }: { product: ProductData }) {
  const { selectedVariant } = useProductForm();

  return (
    <section className="max-w-page px-margin mx-auto w-full pb-4">
      <div className="product-grid mb-16 grid grid-cols-1 gap-6 md:gap-12">
        <ProductGallery product={product} selectedVariant={selectedVariant} />
        {/* Keyed so quantity and plan choice reset when navigating to another product. */}
        <ProductInfo key={product.id} product={product} selectedVariant={selectedVariant} />
      </div>
    </section>
  );
}

function ProductExtras({ product }: { product: ProductData }) {
  return (
    <>
      <BrewRecipes product={product} />
      <BrewItWith product={product} />
    </>
  );
}

function RelatedProducts({ products }: { products: RelatedProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="py-4" aria-labelledby="related-products-heading">
      <div className="border-border border-t pt-12">
        <h2
          id="related-products-heading"
          className="type-heading-xl max-w-page px-margin mx-auto mb-8"
        >
          More products
        </h2>
        <div className="max-w-page px-margin mx-auto contain-paint">
          <ul
            role="list"
            className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12 lg:grid-cols-4"
          >
            {products.map((product) => (
              <li key={product.handle}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function ProductRoute({ loaderData }: Route.ComponentProps) {
  const { product, relatedProducts } = loaderData;
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <ProductProvider
      product={product}
      onSelect={(result) => {
        const url = toRouterLocation(
          variantUrl(
            product,
            result.selectedOptions,
            result.selectedVariant?.product?.handle,
            new URLSearchParams(location.search),
          ),
        );
        void navigate(url, {
          replace: true,
          preventScrollReset: true,
          ...(result.status === "resolved" ? { defaultShouldRevalidate: false } : {}),
        });
      }}
    >
      <ProductViewedTracker product={product} />
      <main className="flex-1" id="main-content" tabIndex={-1}>
        <ProductPageContent product={product} />
        <ProductExtras product={product} />
        <RelatedProducts products={relatedProducts} />
      </main>
    </ProductProvider>
  );
}

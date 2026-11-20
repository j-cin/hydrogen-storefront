import { gql, type StorefrontApi } from "@shopify/hydrogen";
import { Link } from "react-router";

import { useCartForm } from "~/lib/cart";
import { openCartDrawer } from "~/lib/cart-drawer";
import { compareMoney, formatPrice, salePercent } from "~/lib/money";

export const PRODUCT_CARD_FRAGMENT = gql(`
  fragment ProductCard on Product {
    handle
    title
    featuredImage {
      url
      altText
      width
      height
    }
    images(first: 2) {
      nodes {
        url
        altText
      }
    }
    availableForSale
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
  }
`);

// Kept out of the shared card fragment so heavy queries (the product page) stay
// within TypeScript's type depth. Spread it beside ...ProductCard to enable quick add.
export const PRODUCT_CARD_QUICK_ADD_FRAGMENT = gql(`
  fragment ProductCardQuickAdd on Product {
    selectedOrFirstAvailableVariant {
      id
      title
      availableForSale
    }
  }
`);

const PRODUCT_CARD_QUICK_ADD_SHAPE_QUERY = gql(
  `query ProductCardQuickAddShape { products(first: 1) { nodes { ...ProductCardQuickAdd } } }`,
  [PRODUCT_CARD_QUICK_ADD_FRAGMENT],
);

export type ProductCardQuickAddData = StorefrontApi.ResultOf<
  typeof PRODUCT_CARD_QUICK_ADD_SHAPE_QUERY
>["products"]["nodes"][number];

const PRODUCT_CARD_SHAPE_QUERY = gql(
  `query ProductCardShape { products(first: 1) { nodes { ...ProductCard } } }`,
  [PRODUCT_CARD_FRAGMENT],
);

export type ProductCardData = StorefrontApi.ResultOf<
  typeof PRODUCT_CARD_SHAPE_QUERY
>["products"]["nodes"][number];

type ProductCardProps = {
  product: ProductCardData;
  priority?: boolean;
  /** Data from ProductCardQuickAdd: shows a one-tap button for the default variant. */
  quickAdd?: ProductCardQuickAddData;
};

export function ProductCard({ product, priority = false, quickAdd }: ProductCardProps) {
  const primaryImage = product.featuredImage ?? product.images.nodes[0] ?? null;
  const hoverImage = product.images.nodes[1] ?? null;
  const price = product.priceRange.minVariantPrice;
  const compareAt = product.compareAtPriceRange.minVariantPrice;
  const onSale = compareMoney(compareAt, price) > 0;
  const percentOff = onSale ? salePercent(price, compareAt) : null;
  const badge = !product.availableForSale
    ? "Sold out"
    : onSale
      ? percentOff
        ? `Save ${percentOff}%`
        : "Sale"
      : null;
  const badgeClass = !product.availableForSale ? "badge-soldout" : "badge-sale";

  return (
    <article
      className="group card flex flex-col gap-3"
      aria-label={product.title}
      data-testid="product-card"
    >
      <div className="product-tile relative block aspect-square overflow-hidden">
        {primaryImage ? (
          <div className="h-full w-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.04]">
            <img
              src={primaryImage.url}
              alt={primaryImage.altText ?? product.title}
              className="h-full w-full object-cover"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
            />
          </div>
        ) : null}
        {hoverImage ? (
          <div className="pointer-events-none absolute inset-0 opacity-0 motion-safe:transition-opacity motion-safe:duration-300 motion-safe:group-hover:opacity-100">
            <img
              src={hoverImage.url}
              alt={hoverImage.altText ?? ""}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}
        {badge ? (
          <span
            className={`${badgeClass} absolute start-2 top-2 inline-flex items-center rounded-full font-medium`}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-0.5 text-left">
        <h3 className="type-body text-on-surface line-clamp-2 leading-snug font-semibold">
          <Link to={`/products/${product.handle}`} className="card-link text-on-surface">
            {product.title}
          </Link>
        </h3>
        <div className="inline-flex flex-wrap items-baseline gap-2 text-sm">
          {onSale ? (
            <>
              <span className="text-on-surface font-semibold">
                <span className="sr-only">Sale price: </span>
                {formatPrice(price)}
              </span>
              <s className="text-compare text-sm">
                <span className="sr-only">Regular price: </span>
                {formatPrice(compareAt)}
              </s>
            </>
          ) : (
            <span className="text-on-surface-secondary">
              <span className="sr-only">Price: </span>
              {formatPrice(price)}
            </span>
          )}
        </div>
      </div>
      {quickAdd ? <QuickAdd title={product.title} data={quickAdd} /> : null}
    </article>
  );
}

function QuickAdd({ title, data }: { title: string; data: ProductCardQuickAddData }) {
  const { formProps, register } = useCartForm();
  const variant = data.selectedOrFirstAvailableVariant;
  const available = Boolean(variant?.availableForSale);
  const variantLabel =
    variant && variant.title !== "Default Title" ? ` (${variant.title})` : "";

  return (
    <form {...formProps({ afterSubmit: openCartDrawer })} className="relative z-10 mt-auto">
      {variant ? <input type="hidden" {...register("merchandiseId", { value: variant.id })} /> : null}
      <button
        {...register("add")}
        disabled={!available}
        aria-label={available ? `Add ${title}${variantLabel} to cart` : undefined}
        className="rounded-button button-outline focus-visible:outline-accent inline-flex h-11 w-full cursor-pointer items-center justify-center px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[0.97]"
      >
        {available ? "Quick add" : "Sold out"}
      </button>
    </form>
  );
}

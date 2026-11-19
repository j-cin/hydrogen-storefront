import { getSortByValue } from "@shopify/hydrogen";
import { CollectionProvider } from "@shopify/hydrogen/react";
import { useLocation, useNavigate, useNavigation, useSearchParams } from "react-router";

import { Breadcrumb } from "~/components/Breadcrumb";
import {
  ActiveFilterChips,
  FacetForm,
  FilterDrawer,
  LoadMore,
  type SortOption,
  Toolbar,
  useLoadMore,
} from "~/components/CollectionBrowse";
import { ProductCard } from "~/components/ProductCard";
import { loadAllProductsPage } from "~/lib/search";
import { storefrontClientContext } from "~/lib/storefront";
import { formatPageTitle, getShopNameFromRootMatch } from "~/lib/storefront-shop";

import type { Route } from "./+types/all-products";

const ALL_PATH = "/collections/all";

// Search supports relevance and price sorting only.
const ALL_PRODUCTS_SORT_OPTIONS: SortOption[] = [
  { label: "Featured", value: getSortByValue("RELEVANCE", false) },
  { label: "Price, low to high", value: getSortByValue("PRICE", false) },
  { label: "Price, high to low", value: getSortByValue("PRICE", true) },
];

export function meta({ matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  return [
    { title: formatPageTitle("Shop all", shopName) },
    { name: "description", content: `Every coffee, brewer and bag of beans from ${shopName}.` },
  ];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  return loadAllProductsPage({ storefrontClient, request });
}

type LoaderData = Route.ComponentProps["loaderData"];

function Results({ loaderData }: { loaderData: LoaderData }) {
  const location = useLocation();
  const navigation = useNavigation();
  const isUpdating =
    navigation.state === "loading" &&
    navigation.location?.pathname === location.pathname &&
    navigation.location.search !== location.search;
  const { nodes, pageInfo, isLoading, loadMore } = useLoadMore(
    loaderData.products,
    loaderData.pageInfo,
    loaderData.dataSearch,
  );

  return (
    <>
      <Toolbar
        countText={`${loaderData.totalCount} products`}
        sortOptions={ALL_PRODUCTS_SORT_OPTIONS}
        defaultSortValue={getSortByValue("RELEVANCE", false)}
      />
      <ActiveFilterChips
        basePath={ALL_PATH}
        clearAllTo={ALL_PATH}
        currencyCode={loaderData.currencyCode}
      />
      <h2 className="sr-only">Products</h2>
      <div
        aria-busy={isUpdating}
        className={`motion-safe:transition-opacity motion-safe:duration-150 ${isUpdating ? "opacity-60" : "opacity-100"}`}
      >
        {nodes.length > 0 ? (
          <div className="px-1 contain-paint">
            <ul
              id="product-grid"
              data-testid="product-grid"
              role="list"
              className="grid grid-cols-2 gap-x-1 gap-y-10 lg:grid-cols-3"
            >
              {nodes.map((product, index) => (
                <li key={`${product.handle}-${index}`}>
                  <ProductCard product={product} priority={index < 3} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-on-surface-secondary">
            Nothing matches those filters. Try removing one.
          </p>
        )}
      </div>
      <LoadMore
        pageInfo={pageInfo}
        loadedCount={nodes.length}
        countLabel={`Showing ${nodes.length} of ${loaderData.totalCount} products`}
        isLoading={isLoading}
        onLoad={loadMore}
      />
      <FilterDrawer
        availableFilters={loaderData.availableFilters}
        currencyCode={loaderData.currencyCode}
      />
    </>
  );
}

export default function AllProductsRoute({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return (
    <CollectionProvider
      data={{ handle: "all", dataSearch: loaderData.dataSearch }}
      urlSearch={searchParams.toString()}
      onChange={(search) => {
        const nextParams = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
        nextParams.delete("after");
        const nextSearch = nextParams.toString();
        void navigate(
          { search: nextSearch ? `?${nextSearch}` : "" },
          { replace: searchParams.size > 0, preventScrollReset: true },
        );
      }}
    >
      <main className="flex-1" id="main-content" tabIndex={-1}>
        <div className="max-w-page px-margin mx-auto w-full py-8 md:py-12">
          <Breadcrumb
            crumbs={[
              { label: "Collections", to: "/collections" },
              { label: "Shop all", to: ALL_PATH },
            ]}
            origin={loaderData.origin}
          />
          <h1 className="type-display text-on-surface mb-8">Shop all</h1>
          <div className="lg:grid lg:grid-cols-[15rem_1fr] lg:gap-10">
            <aside className="hidden lg:block" aria-label="Filters">
              <div className="sticky top-8">
                <h2 className="type-heading-sm text-on-surface mb-2">Filters</h2>
                <FacetForm
                  availableFilters={loaderData.availableFilters}
                  currencyCode={loaderData.currencyCode}
                />
              </div>
            </aside>
            <div>
              <Results loaderData={loaderData} />
            </div>
          </div>
        </div>
      </main>
    </CollectionProvider>
  );
}

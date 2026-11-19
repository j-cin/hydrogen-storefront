import { gql } from "@shopify/hydrogen";
import { Link } from "react-router";

import { Breadcrumb, buttonClass } from "~/components/Breadcrumb";
import { articleDateFormat } from "~/lib/dates";
import { storefrontClientContext } from "~/lib/storefront";
import { formatPageTitle, getShopNameFromRootMatch } from "~/lib/storefront-shop";

import type { Route } from "./+types/blog";

const ARTICLES_PAGE_SIZE = 12;

// Any blog works; Morrow's journal lives at /blogs/journal.
const BLOG_QUERY = gql(`
  query Blog(
    $handle: String!
    $first: Int!
    $after: String
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    blog(handle: $handle) {
      id
      handle
      title
      seo {
        title
        description
      }
      articles(first: $first, after: $after, sortKey: PUBLISHED_AT, reverse: true) {
        nodes {
          id
          handle
          title
          excerpt
          publishedAt
          image {
            url
            altText
            width
            height
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`);

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const storefrontClient = context.get(storefrontClientContext);
  const { data } = await storefrontClient.graphql(BLOG_QUERY, {
    variables: {
      handle: params.blogHandle,
      first: ARTICLES_PAGE_SIZE,
      after: url.searchParams.get("after") || undefined,
    },
  });
  if (!data?.blog) throw new Response("Blog not found", { status: 404 });

  return { blog: data.blog, origin: url.origin };
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  const blog = loaderData?.blog;
  if (!blog) return [{ title: formatPageTitle("Blog not found", shopName) }];
  return [
    { title: formatPageTitle(blog.seo?.title || blog.title, shopName) },
    ...(blog.seo?.description ? [{ name: "description", content: blog.seo.description }] : []),
  ];
}

export default function BlogRoute({ loaderData }: Route.ComponentProps) {
  const { blog, origin } = loaderData;
  const articles = blog.articles.nodes;

  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      <div className="max-w-page px-margin mx-auto w-full py-8 md:py-12">
        <Breadcrumb crumbs={[{ label: blog.title, to: `/blogs/${blog.handle}` }]} origin={origin} />
        <h1 className="type-display text-on-surface mb-8">{blog.title}</h1>

        {articles.length === 0 ? (
          <p className="text-on-surface-secondary">Nothing here yet. Check back after Monday.</p>
        ) : (
          <ul role="list" className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, index) => (
              <li key={article.id}>
                <Link
                  to={`/blogs/${blog.handle}/${article.handle}`}
                  className="group focus-visible:outline-accent block rounded-sm no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                  prefetch="intent"
                >
                  {article.image ? (
                    <div className="bg-surface-secondary aspect-landscape rounded-card mb-4 overflow-hidden">
                      <img
                        src={article.image.url}
                        alt={article.image.altText ?? ""}
                        width={article.image.width ?? undefined}
                        height={article.image.height ?? undefined}
                        loading={index < 3 ? "eager" : "lazy"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <h2 className="type-heading-sm text-on-surface group-hover:underline">
                    {article.title}
                  </h2>
                  <time
                    dateTime={article.publishedAt}
                    className="text-on-surface-secondary mt-1 block text-sm"
                  >
                    {articleDateFormat.format(new Date(article.publishedAt))}
                  </time>
                  {article.excerpt ? (
                    <p className="text-on-surface-secondary type-body-sm mt-2 line-clamp-3">
                      {article.excerpt}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {blog.articles.pageInfo.hasNextPage && blog.articles.pageInfo.endCursor ? (
          <div className="mt-12 flex justify-center">
            <Link
              to={`?after=${encodeURIComponent(blog.articles.pageInfo.endCursor)}`}
              className={`button-outline ${buttonClass}`}
            >
              Older posts
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}

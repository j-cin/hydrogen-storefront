import { gql } from "@shopify/hydrogen";

import { Breadcrumb } from "~/components/Breadcrumb";
import { articleDateFormat } from "~/lib/dates";
import { storefrontClientContext } from "~/lib/storefront";
import { formatPageTitle, getShopNameFromRootMatch } from "~/lib/storefront-shop";

import type { Route } from "./+types/article";

const ARTICLE_QUERY = gql(`
  query Article(
    $blogHandle: String!
    $articleHandle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    blog(handle: $blogHandle) {
      handle
      title
      articleByHandle(handle: $articleHandle) {
        id
        handle
        title
        contentHtml
        publishedAt
        tags
        authorV2 {
          name
        }
        image {
          url
          altText
          width
          height
        }
        seo {
          title
          description
        }
      }
    }
  }
`);

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const { data } = await storefrontClient.graphql(ARTICLE_QUERY, {
    variables: { blogHandle: params.blogHandle, articleHandle: params.articleHandle },
  });
  const article = data?.blog?.articleByHandle;
  if (!data?.blog || !article) throw new Response("Article not found", { status: 404 });

  return {
    blog: { handle: data.blog.handle, title: data.blog.title },
    article,
    origin: new URL(request.url).origin,
  };
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const shopName = getShopNameFromRootMatch(matches[0]);
  const article = loaderData?.article;
  if (!article) return [{ title: formatPageTitle("Article not found", shopName) }];
  return [
    { title: formatPageTitle(article.seo?.title || article.title, shopName) },
    ...(article.seo?.description
      ? [{ name: "description", content: article.seo.description }]
      : []),
  ];
}

export default function ArticleRoute({ loaderData }: Route.ComponentProps) {
  const { blog, article, origin } = loaderData;

  return (
    <main className="flex-1" id="main-content" tabIndex={-1}>
      <div className="max-w-page px-margin mx-auto w-full py-8 md:py-12">
        <Breadcrumb
          crumbs={[
            { label: blog.title, to: `/blogs/${blog.handle}` },
            { label: article.title, to: `/blogs/${blog.handle}/${article.handle}` },
          ]}
          origin={origin}
        />
        <article className="mx-auto max-w-prose">
          <header className="mb-8">
            <h1 className="type-display text-on-surface">{article.title}</h1>
            <p className="text-on-surface-secondary mt-3 text-sm">
              <time dateTime={article.publishedAt}>
                {articleDateFormat.format(new Date(article.publishedAt))}
              </time>
              {article.authorV2?.name ? <> · {article.authorV2.name}</> : null}
            </p>
          </header>
          {article.image ? (
            <div className="bg-surface-secondary rounded-card mb-8 overflow-hidden">
              <img
                src={article.image.url}
                alt={article.image.altText ?? ""}
                width={article.image.width ?? undefined}
                height={article.image.height ?? undefined}
                loading="eager"
                fetchPriority="high"
                className="h-auto w-full"
              />
            </div>
          ) : null}
          {/* Merchant-authored HTML from the Shopify admin. */}
          <div
            className="richtext type-body"
            dangerouslySetInnerHTML={{ __html: article.contentHtml }}
          />
          {article.tags.length > 0 ? (
            <ul role="list" aria-label="Tags" className="mt-10 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <li key={tag} className="badge-default">
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      </div>
    </main>
  );
}

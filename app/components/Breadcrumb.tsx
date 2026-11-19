import { Link } from "react-router";

export type Crumb = { label: string; to?: string };

const linkClass =
  "hover:text-on-surface rounded-sm py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current motion-safe:transition-colors";

/** Visible breadcrumb plus BreadcrumbList JSON-LD. The last crumb is the current page. */
export function Breadcrumb({ crumbs, origin }: { crumbs: Crumb[]; origin: string }) {
  const all: Crumb[] = [{ label: "Home", to: "/" }, ...crumbs];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      ...(crumb.to ? { item: `${origin}${crumb.to}` } : {}),
    })),
  };

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="text-on-surface-secondary flex flex-wrap items-center gap-1.5 text-sm">
          {all.map((crumb, index) => {
            const isLast = index === all.length - 1;
            return (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                {isLast || !crumb.to ? (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className="text-on-surface font-medium"
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link to={crumb.to} className={linkClass}>
                    {crumb.label}
                  </Link>
                )}
                {isLast ? null : <span aria-hidden="true">/</span>}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

export const buttonClass =
  "rounded-button focus-visible:outline-accent inline-flex h-11 items-center justify-center px-5 text-sm font-medium no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:transition-[color,background-color,border-color,transform] motion-safe:active:scale-[0.97]";

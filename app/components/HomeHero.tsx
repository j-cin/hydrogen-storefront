import { useState } from "react";
import { Link } from "react-router";

import type { HomeHeroData } from "~/lib/home-hero";

/**
 * Split hero: an espresso text panel on the left, the image bleeding to the
 * right edge. Stacks (image first) on small screens.
 */
export function HomeHero({ hero }: { hero: HomeHeroData }) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const image = hero.image && hero.image.url !== failedImageUrl ? hero.image : null;

  return (
    <section
      className="bg-on-surface text-surface grid w-full md:min-h-[min(48rem,calc(100svh-7rem))] md:grid-cols-2"
      aria-labelledby="hero-heading"
    >
      <div className="bg-surface-secondary relative aspect-[4/3] overflow-hidden md:order-2 md:aspect-auto">
        {image ? (
          <img
            src={image.url}
            alt={image.altText ?? ""}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
            // An SSR image can fail before hydration attaches onError, so also check on mount.
            ref={(img) => {
              if (img?.complete && img.naturalWidth === 0) setFailedImageUrl(image.url);
            }}
            onError={() => setFailedImageUrl(image.url)}
          />
        ) : null}
      </div>
      <div className="px-margin flex flex-col justify-center py-14 md:py-20 md:ps-[max(var(--spacing-margin),calc((100vw-var(--spacing-page))/2+var(--spacing-margin)))] md:pe-12">
        <p className="type-overline text-surface/75 mb-5">Roasted every Monday</p>
        <h1 id="hero-heading" className="type-display max-w-xl wrap-anywhere">
          {hero.heading}
        </h1>
        {hero.description ? (
          <p className="type-body-lg text-surface/80 mt-5 max-w-md wrap-anywhere whitespace-pre-line">
            {hero.description}
          </p>
        ) : null}
        <Link
          to={hero.to}
          className="rounded-button button-primary focus-visible:outline-apricot mt-9 inline-flex h-12 w-fit shrink-0 items-center justify-center gap-2 px-7 text-base font-semibold no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:active:scale-[0.97]"
        >
          {hero.cta}
        </Link>
      </div>
    </section>
  );
}

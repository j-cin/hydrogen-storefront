type HeroImage = { url: string; altText: string | null };

export type HomeHeroData = {
  heading: string;
  description: string | null;
  image: HeroImage | null;
  to: string;
  cta: string;
};

/**
 * Pinned homepage hero. Edit these values to change the hero; it no longer
 * follows whichever collection was updated most recently.
 *
 * - `collectionHandle`: where the button goes. Give that collection an image in
 *   Shopify admin and it replaces the fallback image below.
 * - `imageProductHandle`: the product whose featured image is used when the
 *   collection has no image of its own.
 */
export const HOME_HERO = {
  collectionHandle: "coffee",
  imageProductHandle: "ceramic-dripper",
  heading: "Roasted on Monday. In your cup by Thursday.",
  description:
    "We roast once a week and ship within 72 hours. Every bag tells you who grew it.",
  cta: "Shop coffee",
} as const;

type PinnedHeroSources = {
  collection: { handle: string; image: HeroImage | null } | null;
  product: { featuredImage: HeroImage | null } | null;
};

export function selectHomeHero({ collection, product }: PinnedHeroSources): HomeHeroData {
  return {
    heading: HOME_HERO.heading,
    description: HOME_HERO.description,
    image: collection?.image ?? product?.featuredImage ?? null,
    // If the pinned collection is missing or unpublished, fall back to shop all.
    to: collection ? `/collections/${collection.handle}` : "/collections/all",
    cta: collection ? HOME_HERO.cta : "Shop all",
  };
}

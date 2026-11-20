import { referencedImage } from "~/lib/metaobject";

type HeroImage = { url: string; altText: string | null };

export type HomeHeroData = {
  heading: string;
  description: string | null;
  image: HeroImage | null;
  to: string;
  cta: string;
};

/**
 * The homepage hero reads the `home_hero` metaobject with handle "main"
 * (Content > Metaobjects > Home hero). Fields: heading · subheading · image ·
 * cta_label · cta_link. Until an image is uploaded there, the featured image of
 * `FALLBACK_IMAGE_PRODUCT_HANDLE` is used.
 */
export const HOME_HERO_HANDLE = "main";
export const FALLBACK_IMAGE_PRODUCT_HANDLE = "ceramic-dripper";

const DEFAULT_HERO: HomeHeroData = {
  heading: "Coffee that's never more than a week old.",
  description: "Roasted every Monday, shipped within 72 hours, traceable to the farm.",
  image: null,
  to: "/collections/coffee",
  cta: "Shop coffee",
};

type HeroField = { value: string | null } | null | undefined;

export type HomeHeroSource = {
  heading?: HeroField;
  subheading?: HeroField;
  ctaLabel?: HeroField;
  ctaLink?: HeroField;
  image?: { reference?: object | null } | null;
} | null;

function text(field: HeroField): string | null {
  const value = field?.value?.trim();
  return value ? value : null;
}

/** Only same-site paths are allowed as the button link. */
function safeLink(value: string | null): string | null {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

export function selectHomeHero(
  metaobject: HomeHeroSource,
  fallbackImage: HeroImage | null,
): HomeHeroData {
  const image = referencedImage(metaobject?.image);
  return {
    heading: text(metaobject?.heading) ?? DEFAULT_HERO.heading,
    description: text(metaobject?.subheading) ?? DEFAULT_HERO.description,
    image: image ?? fallbackImage,
    to: safeLink(text(metaobject?.ctaLink)) ?? DEFAULT_HERO.to,
    cta: text(metaobject?.ctaLabel) ?? DEFAULT_HERO.cta,
  };
}

import { gql, type StorefrontApi } from "@shopify/hydrogen";

// Reads `testimonial` metaobjects: quote · name · city · rating (integer 1 to 5).
export const TESTIMONIAL_FRAGMENT = gql(`
  fragment Testimonial on Metaobject {
    id
    quote: field(key: "quote") {
      value
    }
    name: field(key: "name") {
      value
    }
    city: field(key: "city") {
      value
    }
    rating: field(key: "rating") {
      value
    }
  }
`);

const TESTIMONIAL_SHAPE_QUERY = gql(
  `query TestimonialShape { metaobjects(type: "testimonial", first: 1) { nodes { ...Testimonial } } }`,
  [TESTIMONIAL_FRAGMENT],
);

export type TestimonialData = StorefrontApi.ResultOf<
  typeof TESTIMONIAL_SHAPE_QUERY
>["metaobjects"]["nodes"][number];

function Stars({ rating }: { rating: number }) {
  return (
    <p className="text-apricot-deep flex gap-0.5" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          key={index}
          viewBox="0 0 20 20"
          className="size-4"
          fill={index < rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M10 1.8l2.5 5.2 5.7.8-4.1 4 1 5.6L10 14.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z" />
        </svg>
      ))}
    </p>
  );
}

export function Testimonials({ testimonials }: { testimonials: readonly TestimonialData[] }) {
  const items = testimonials.filter((item) => item.quote?.value && item.name?.value);
  if (items.length === 0) return null;

  return (
    <section className="bg-surface-secondary w-full py-16" aria-labelledby="testimonials-heading">
      <div className="max-w-page px-margin mx-auto">
        <h2 id="testimonials-heading" className="type-heading-xl mb-8">
          From people who drink it
        </h2>
        <ul role="list" className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
          {items.map((item) => {
            const rating = Number.parseInt(item.rating?.value ?? "", 10);
            return (
              <li key={item.id}>
                <figure className="bg-paper rounded-card border-border flex h-full flex-col gap-4 border p-5">
                  {rating >= 1 && rating <= 5 ? <Stars rating={rating} /> : null}
                  <blockquote className="type-body text-on-surface flex-1">
                    <p>“{item.quote!.value}”</p>
                  </blockquote>
                  <figcaption className="text-on-surface-secondary text-sm">
                    <span className="text-on-surface font-semibold">{item.name!.value}</span>
                    {item.city?.value ? `, ${item.city.value}` : null}
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

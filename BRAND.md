# Morrow Coffee Roasters: brand guide

The source of truth for all design, copy and UI work in this storefront.

## Brand at a glance

Morrow is a fictional small-batch specialty coffee roaster. It sells beans, subscriptions, brew gear and a little merch online. Almost every product needs variants, custom data and a subscription option.

| | |
| --- | --- |
| Name | Morrow Coffee Roasters |
| Domain (fictional) | morrowcoffee.example |
| Tagline | Roasted on Monday. In your cup by Thursday. |
| Founded (story) | 2019, in a converted tram depot workshop |
| Founders (fictional) | Ines Morrow (head roaster) and Theo Vance (operations) |
| Price point | Mid-premium: 250 g bags from A$22, gear A$18 to A$349 |
| Currency | AUD primary, with USD and NZD markets for practice |

**Story.** Ines spent ten years roasting for cafes before starting Morrow. The idea is simple: roast once a week, ship within 72 hours, and tell you exactly who grew the coffee. Every bag carries a roast date and the producer's name.

**Audience.** The site has to serve two groups:

- **The home enthusiast (28 to 45):** owns a grinder and a pour-over or espresso setup. They want tasting notes, origin detail and brew recipes.
- **The convenience buyer:** wants good coffee without the homework. They want a quiz, a bestseller and a subscription that just shows up.

**Positioning.** Fresher than the supermarket, friendlier than the third-wave snobs. Morrow explains things without talking down.

## Brand identity

The look is warm and early-morning: cream paper, deep espresso brown and one bright apricot accent for calls to action.

### Voice

Warm, plain and a little dry. Short sentences. Explain jargon the first time it appears.

- Say "Bright and juicy, like a ripe nectarine", not "Exhibits complex malic acidity".
- Say "Your next bag ships Monday", not "Your subscription order has been queued".
- Buttons are verbs: "Add to cart", "Start subscription", "Find my coffee".

### Colour palette

Map these to Tailwind theme tokens.

| Token | Hex | Use |
| --- | --- | --- |
| `cream` | `#F6F1E7` | Page background |
| `paper` | `#FFFDF8` | Cards, drawers, modals |
| `espresso` | `#2B1E16` | Body text, header, footer |
| `roast` | `#6B4A35` | Secondary text, borders |
| `apricot` | `#E8834A` | Primary buttons, sale badges, focus rings |
| `sage` | `#8A9A7B` | Decaf and organic badges, success states |
| `fog` | `#D9D2C5` | Dividers, disabled states |

**Contrast:** apricot buttons use espresso text, not white, to pass WCAG AA. Check contrast before shipping.

### Typography (Google Fonts)

- **Headings:** Fraunces, weight 600, tight letter-spacing.
- **Body and UI:** Inter, weights 400 and 600, 16 px base.
- **Roast dates and SKUs:** JetBrains Mono at 13 px, for a stamped-label feel.

### Logo

A wordmark "morrow" in lowercase Fraunces, with a half-risen sun sitting on the second "o". Build it as an inline SVG component that inherits `currentColor`.

### Imagery

Top-down shots on linen, morning window light, hands in frame. Use free stock (Unsplash or Pexels: "coffee beans bag", "pour over", "coffee farm") while learning. Product shots sit on a plain cream background so the grid looks consistent.

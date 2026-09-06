/**
 * Fallback catalog used when Supabase is not configured or unreachable, so the
 * storefront always renders something meaningful in development and demos.
 * Mirrors the seed in supabase/migrations/20260101000200_seed_menu.sql.
 *
 * IDs here are deterministic placeholders (not real UUIDs); the checkout flow
 * re-validates every id against the database, so these are display-only.
 */
export const sampleMenu = [
  {
    id: "sample-cat-small-plates",
    name: "Small Plates",
    slug: "small-plates",
    description: "Refined bites to begin the evening.",
    items: [
      { id: "sample-octopus", name: "Charred Octopus", description: "Smoked paprika, preserved lemon, potato.", price_cents: 1600, tags: ["gf"] },
      { id: "sample-burrata", name: "Burrata & Heirloom", description: "Stone fruit, basil oil, aged balsamic.", price_cents: 1400, tags: ["v"] },
      { id: "sample-crudo", name: "Tuna Crudo", description: "Yuzu kosho, avocado, crisp shallot.", price_cents: 1800, tags: ["gf"] },
    ],
  },
  {
    id: "sample-cat-mains",
    name: "Mains",
    slug: "mains",
    description: "Hearth-fired centerpieces.",
    items: [
      { id: "sample-ribeye", name: "Dry-Aged Ribeye", description: "45-day aged, bone marrow butter, watercress.", price_cents: 4800, tags: ["gf"] },
      { id: "sample-risotto", name: "Saffron Risotto", description: "Carnaroli, aged parmesan, brown butter.", price_cents: 2600, tags: ["v"] },
      { id: "sample-cod", name: "Miso Black Cod", description: "Sake glaze, bok choy, ginger dashi.", price_cents: 3400, tags: ["gf"] },
      { id: "sample-tart", name: "Wild Mushroom Tart", description: "Puff pastry, taleggio, truffle honey.", price_cents: 2200, tags: ["v"] },
    ],
  },
  {
    id: "sample-cat-desserts",
    name: "Desserts",
    slug: "desserts",
    description: "A sweet, quiet finish.",
    items: [
      { id: "sample-cremeux", name: "Valrhona Cremeux", description: "Dark chocolate, sea salt, olive oil.", price_cents: 1200, tags: ["v"] },
      { id: "sample-cake", name: "Citrus Olive Cake", description: "Blood orange, mascarpone, pistachio.", price_cents: 1100, tags: ["v"] },
    ],
  },
  {
    id: "sample-cat-drinks",
    name: "Drinks",
    slug: "drinks",
    description: "Cellar pours and zero-proof craft.",
    items: [
      { id: "sample-barolo", name: "Barolo (Glass)", description: "Nebbiolo, Piedmont — rose & tar.", price_cents: 1900, tags: [] },
      { id: "sample-spritz", name: "Garden Spritz", description: "Zero-proof — cucumber, elderflower, tonic.", price_cents: 900, tags: ["na"] },
    ],
  },
];

-- =============================================================================
-- Freshly — seed catalog data (idempotent)
-- =============================================================================
-- Safe to run repeatedly: categories key off their unique slug, items off a
-- deterministic uuid derived from (category slug + item name).
-- =============================================================================

insert into public.menu_categories (name, slug, description, sort_order) values
  ('Small Plates', 'small-plates', 'Refined bites to begin the evening.', 1),
  ('Mains',        'mains',        'Hearth-fired centerpieces.',          2),
  ('Desserts',     'desserts',     'A sweet, quiet finish.',              3),
  ('Drinks',       'drinks',       'Cellar pours and zero-proof craft.',  4)
on conflict (slug) do update
  set name = excluded.name,
      description = excluded.description,
      sort_order = excluded.sort_order;

-- Helper: insert an item bound to a category slug, with a stable id.
do $$
declare
  rows record;
begin
  for rows in
    select * from (values
      ('small-plates', 'Charred Octopus',      'Smoked paprika, preserved lemon, potato.',        1600, array['gf']),
      ('small-plates', 'Burrata & Heirloom',   'Stone fruit, basil oil, aged balsamic.',          1400, array['v']),
      ('small-plates', 'Tuna Crudo',           'Yuzu kosho, avocado, crisp shallot.',             1800, array['gf']),
      ('mains',        'Dry-Aged Ribeye',      '45-day aged, bone marrow butter, watercress.',    4800, array['gf']),
      ('mains',        'Saffron Risotto',      'Carnaroli, aged parmesan, brown butter.',         2600, array['v']),
      ('mains',        'Miso Black Cod',       'Sake glaze, bok choy, ginger dashi.',             3400, array['gf']),
      ('mains',        'Wild Mushroom Tart',   'Puff pastry, taleggio, truffle honey.',           2200, array['v']),
      ('desserts',     'Valrhona Cremeux',     'Dark chocolate, sea salt, olive oil.',            1200, array['v']),
      ('desserts',     'Citrus Olive Cake',    'Blood orange, mascarpone, pistachio.',            1100, array['v']),
      ('drinks',       'Barolo (Glass)',       'Nebbiolo, Piedmont — rose & tar.',                1900, array[]::text[]),
      ('drinks',       'Garden Spritz',        'Zero-proof — cucumber, elderflower, tonic.',       900, array['na'])
    ) as t(cat_slug, name, description, price_cents, tags)
  loop
    insert into public.menu_items (id, category_id, name, description, price_cents, tags)
    select
      gen_random_uuid(),
      c.id,
      rows.name,
      rows.description,
      rows.price_cents,
      rows.tags
    from public.menu_categories c
    where c.slug = rows.cat_slug
      and not exists (
        select 1 from public.menu_items mi
        where mi.category_id = c.id and mi.name = rows.name
      );
  end loop;
end $$;

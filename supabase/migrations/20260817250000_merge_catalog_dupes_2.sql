-- Second dedup pass: 6 specific pairs the user selected out of the 106
-- lower-confidence review list. Same pattern as the first pass -- generic
-- entry merged into the more specific/branded one, survivor updated,
-- redundant row deleted.

update public.catalog_items
  set name = 'Gino/Derica Tomato Paste 400g', suggested_price = 2.49
  where id = '10fd98bb-c854-49c7-b1d5-d888c104b048';
delete from public.catalog_items where id = '681c6742-daee-4d6f-bb55-5b553f479384'; -- Gino tomato paste

update public.catalog_items
  set name = 'D&G Kola Champagne 591ml', suggested_price = 1.99
  where id = 'e9949500-9d92-414e-866a-781a266475b4';
delete from public.catalog_items where id = 'd08638f6-81c6-4d07-a326-674c278f1c92'; -- D&G Kola Champagne soda

update public.catalog_items
  set name = 'Titus Sardines (in Tomato) 125g', suggested_price = 2.50
  where id = '54312f2c-4f62-44fb-a0a8-c68a37ad3870';
delete from public.catalog_items where id = '0c924049-ab68-4e5f-96f8-0e9681768679'; -- Titus sardines (in tomato)

update public.catalog_items
  set name = 'Knorr Bouillon Cubes Chicken 69g', suggested_price = 2.99
  where id = '53d113dd-5332-461b-9e70-d9afbbb83231';
delete from public.catalog_items where id = 'baa94363-168e-4027-84fa-0704ad56b2d8'; -- Knorr chicken cubes

update public.catalog_items
  set name = 'Peak Powdered Milk 400g', suggested_price = 19.99
  where id = 'ff7f50ed-7219-4362-99e7-b9d1c633fedf';
delete from public.catalog_items where id = '330c87a8-7ba3-4dfa-9b08-1b9ee15cfcff'; -- Peak evaporated/powdered milk (ambiguous generic)

update public.catalog_items
  set name = 'Zobo / Sorrel (Dried Hibiscus) Leaves', suggested_price = 6.99
  where id = '004b58d6-1fba-4b37-9abb-1551e369309a';
delete from public.catalog_items where id = '55cf08de-9083-4a8a-ab65-e24d93354769'; -- Zobo / sorrel (dried hibiscus) drink leaves

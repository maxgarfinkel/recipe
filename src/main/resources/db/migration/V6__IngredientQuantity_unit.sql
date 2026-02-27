-- Move unit ownership from Ingredient to IngredientQuantity.
-- Ingredient.unit becomes a default/suggestion; the authoritative unit for each
-- recipe use is stored on ingredient_quantity itself.

-- 1. Rename ingredient.unit → ingredient.default_unit to clarify its role.
ALTER TABLE ingredient RENAME COLUMN unit TO default_unit;

-- 2. Add unit column to ingredient_quantity.
ALTER TABLE ingredient_quantity ADD COLUMN unit_id BIGINT REFERENCES unit(id);

-- 3. Backfill from the ingredient's default_unit (preserves all existing data).
UPDATE ingredient_quantity iq
    SET unit_id = (SELECT i.default_unit FROM ingredient i WHERE i.id = iq.ingredient_id);

-- 4. Enforce NOT NULL now that backfill is complete.
ALTER TABLE ingredient_quantity ALTER COLUMN unit_id SET NOT NULL;

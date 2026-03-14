-- Step 1: Trim whitespace from all ingredient names
UPDATE ingredient SET name = trim(name);

-- Step 2: Reassign ingredient_quantity FKs from duplicate ingredients to the canonical (lowest-id) row
UPDATE ingredient_quantity iq
SET ingredient_id = canonical.id
FROM (
    SELECT DISTINCT ON (lower(trim(name))) id, lower(trim(name)) AS norm
    FROM ingredient
    ORDER BY lower(trim(name)), id ASC
) canonical
JOIN ingredient dup ON lower(trim(dup.name)) = canonical.norm AND dup.id != canonical.id
WHERE iq.ingredient_id = dup.id;

-- Step 3: Delete ingredient_alias rows for non-canonical duplicate ingredients
DELETE FROM ingredient_alias
WHERE ingredient_id IN (
    SELECT dup.id
    FROM ingredient dup
    WHERE EXISTS (
        SELECT 1 FROM ingredient canon
        WHERE lower(trim(canon.name)) = lower(trim(dup.name))
          AND canon.id < dup.id
    )
);

-- Step 4: Delete non-canonical duplicate ingredient rows
DELETE FROM ingredient
WHERE id IN (
    SELECT dup.id
    FROM ingredient dup
    WHERE EXISTS (
        SELECT 1 FROM ingredient canon
        WHERE lower(trim(canon.name)) = lower(trim(dup.name))
          AND canon.id < dup.id
    )
);

-- Step 5: Add a case-insensitive unique index
CREATE UNIQUE INDEX uq_ingredient_name ON ingredient (lower(trim(name)));

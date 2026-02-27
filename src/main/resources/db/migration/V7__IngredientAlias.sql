-- Store user-defined mappings from raw ingredient text to a resolved ingredient + unit.
-- Used by the import pipeline to auto-resolve ingredient lines on future imports.
CREATE TABLE ingredient_alias (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    alias_text  VARCHAR(512) NOT NULL UNIQUE,
    ingredient_id BIGINT NOT NULL REFERENCES ingredient(id),
    unit_id       BIGINT NOT NULL REFERENCES unit(id)
);

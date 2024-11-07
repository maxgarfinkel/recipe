CREATE SEQUENCE IF NOT EXISTS recipe_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE IF NOT EXISTS ingredient_quantity_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE recipe
(
    id   BIGINT NOT NULL,
    name VARCHAR(255),
    method TEXT,
    CONSTRAINT pk_recipe PRIMARY KEY (id)
);

CREATE TABLE ingredient_quantity
(
    id   BIGINT NOT NULL,
    quantity DECIMAL,
    recipe_id  BIGINT REFERENCES recipe (id),
    ingredient_id BIGINT REFERENCES ingredient (id),
    CONSTRAINT pk_ingredientquantity PRIMARY KEY (id)
);


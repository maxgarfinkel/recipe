CREATE TABLE unit
(
    id   BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(16),
    base BIGINT REFERENCES unit(id),
    basefactor DECIMAL NOT NULL,
    CONSTRAINT pk_units PRIMARY KEY (id)
);

INSERT INTO unit values(1, 'Gram','g',null,1);
INSERT INTO unit values(2, 'Kilogram','kg',1, 1000);
INSERT INTO unit values(3, 'Ounce','oz',1,28.349523125);
INSERT INTO unit values(4, 'Pound','lb',1,453.59237);

INSERT INTO unit values(5, 'Millilitres','ml',null, 1);
INSERT INTO unit values(6, 'Centilitres','cl',5, 10);
INSERT INTO unit values(7, 'Litres','l',5, 1000);
INSERT INTO unit values(8, 'Teaspoon','tsp',5,5.91939);
INSERT INTO unit values(9, 'Tablespoon','tbsp',5,17.7582);
INSERT INTO unit values(10, 'Cup','c',5,284.131);
INSERT INTO unit values(11, 'Pint','pt',5,568.261);
INSERT INTO unit values(12, 'US Cup','c',5, 240);
INSERT INTO unit values(13, 'US Pint','pt',5,473.176);
INSERT INTO unit values(14, 'US Fluid Ounces','fl oz',5,29.5735);
INSERT INTO unit values(15, 'Pinch','pch',5,0.369961875);
INSERT INTO unit values(16, 'Handful','hfl',null, 1);
INSERT INTO unit values(17, 'Dash','dsh',5,0.1849809375);
INSERT INTO unit values(18, 'Drop','drp',5,0.098656467013889);
INSERT INTO unit values(19, 'Unit','',null, 1);

CREATE SEQUENCE IF NOT EXISTS ingredient_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE ingredient
(
    id   BIGINT NOT NULL,
    name VARCHAR(255),
    unit BIGINT REFERENCES unit (id),
    CONSTRAINT pk_ingredient PRIMARY KEY (id)
);
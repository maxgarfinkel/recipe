package com.maxgarfinkel.recipes.unit;

import lombok.Data;

@Data
public class UnitDto {

    private final Long id;
    private final String name;
    private final String abbreviation;
    private final UnitDto base;
    private final Double baseFactor;

}

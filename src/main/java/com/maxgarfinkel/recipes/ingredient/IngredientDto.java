package com.maxgarfinkel.recipes.ingredient;

import com.maxgarfinkel.recipes.unit.UnitDto;
import lombok.Data;

@Data
public class IngredientDto {

    private final String name;
    private final Long id;
    private final UnitDto unit;

    public Long getUnitId() {
        return unit != null ? unit.getId() : null;
    }

}

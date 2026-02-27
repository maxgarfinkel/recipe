package com.maxgarfinkel.recipes.ingredient;

import com.maxgarfinkel.recipes.unit.UnitDto;
import lombok.Data;

@Data
public class IngredientDto {

    private final String name;
    private final Long id;
    private final UnitDto defaultUnit;

    public Long getUnitId() {
        return defaultUnit != null ? defaultUnit.getId() : null;
    }

}

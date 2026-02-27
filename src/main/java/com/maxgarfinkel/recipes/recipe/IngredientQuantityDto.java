package com.maxgarfinkel.recipes.recipe;

import com.maxgarfinkel.recipes.ingredient.IngredientDto;
import com.maxgarfinkel.recipes.unit.UnitDto;
import lombok.Data;

@Data
public class IngredientQuantityDto {
    private final Long id;
    private final Double quantity;
    private final IngredientDto ingredient;
    private final UnitDto unit;
}

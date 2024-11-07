package com.maxgarfinkel.recipes.recipe;

import com.maxgarfinkel.recipes.ingredient.IngredientDto;
import lombok.Data;

@Data
public class IngredientQuantityDto {
    private final Long id;
    private final Double quantity;
    private final IngredientDto ingredient;
}

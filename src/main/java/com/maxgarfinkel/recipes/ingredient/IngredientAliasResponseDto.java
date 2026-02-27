package com.maxgarfinkel.recipes.ingredient;

import lombok.Data;

@Data
public class IngredientAliasResponseDto {
    private final Long id;
    private final String aliasText;
    private final Long ingredientId;
    private final Long unitId;
}

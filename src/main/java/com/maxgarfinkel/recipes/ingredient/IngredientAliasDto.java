package com.maxgarfinkel.recipes.ingredient;

import lombok.Data;

@Data
public class IngredientAliasDto {
    private final String aliasText;
    private final Long ingredientId;
    private final Long unitId;
}

package com.maxgarfinkel.recipes.recipe;

import lombok.Data;

import java.util.List;

@Data
public class RecipeDto {
    private final Long id;
    private final String name;
    private final String method;
    private final Integer servings;
    private final List<IngredientQuantityDto> ingredientQuantities;

}

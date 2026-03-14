package com.maxgarfinkel.recipes.ingredient;

public class DuplicateIngredientException extends RuntimeException {

    private final String ingredientName;

    public DuplicateIngredientException(String ingredientName) {
        super("An ingredient with the name '" + ingredientName + "' already exists");
        this.ingredientName = ingredientName;
    }

    public String getIngredientName() {
        return ingredientName;
    }
}

package com.maxgarfinkel.recipes.recipe;

import com.maxgarfinkel.recipes.ingredient.Ingredient;
import jakarta.persistence.*;

@Entity
public class IngredientQuantity {

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne()
    @JoinColumn(name = "recipe_id")
    private Recipe recipe;

    @ManyToOne()
    @JoinColumn(name = "ingredient_id")
    private Ingredient ingredient;

    private double quantity;

    public IngredientQuantity(Recipe recipe, Ingredient ingredient, double quantity) {
        this.recipe = recipe;
        this.ingredient = ingredient;
        this.quantity = quantity;
    }

    public IngredientQuantity() {

    }

    public IngredientQuantityDto toDto() {
        return new IngredientQuantityDto(id, quantity, ingredient.toDto());
    }
}

package com.maxgarfinkel.recipes.recipe;

import com.maxgarfinkel.recipes.ingredient.Ingredient;
import com.maxgarfinkel.recipes.unit.Unit;
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

    @ManyToOne()
    @JoinColumn(name = "unit_id")
    private Unit unit;

    private double quantity;

    public IngredientQuantity(Recipe recipe, Ingredient ingredient, Unit unit, double quantity) {
        this.recipe = recipe;
        this.ingredient = ingredient;
        this.unit = unit;
        this.quantity = quantity;
    }

    public IngredientQuantity() {

    }

    public IngredientQuantityDto toDto() {
        return new IngredientQuantityDto(id, quantity, ingredient.toDto(), unit != null ? unit.toDto() : null);
    }
}

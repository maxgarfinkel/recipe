package com.maxgarfinkel.recipes.recipe;

import com.maxgarfinkel.recipes.ingredient.Ingredient;
import com.maxgarfinkel.recipes.unit.Unit;
import jakarta.persistence.*;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Entity
public class Recipe {

    @Id
    @GeneratedValue
    private Long id;

    @Setter
    private String name;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "recipe_id")
    @Setter
    private List<IngredientQuantity> ingredientQuantities;

    @Setter
    private String method;

    private Integer servings;

    @Setter
    @Column(name = "source_url", length = 2048)
    private String sourceUrl;

    public Recipe() {}

    Recipe(RecipeDto recipeDto, List<Ingredient> ingredients, Map<Long, Unit> unitMap) {
        this.name = recipeDto.getName();
        this.method = recipeDto.getMethod();
        this.servings = recipeDto.getServings();
        this.sourceUrl = recipeDto.getSourceUrl();
        setAllIngredientQuantities(recipeDto, ingredients, unitMap);
    }

    public void update(RecipeDto recipeDto, List<Ingredient> ingredients, Map<Long, Unit> unitMap) {
        this.name = recipeDto.getName();
        this.method = recipeDto.getMethod();
        this.servings = recipeDto.getServings();
        setAllIngredientQuantities(recipeDto, ingredients, unitMap);
    }

    private void setAllIngredientQuantities(RecipeDto recipeDto, List<Ingredient> ingredients, Map<Long, Unit> unitMap) {
        if(ingredientQuantities != null) {
            this.ingredientQuantities.clear();
        }
        Map<Long, Ingredient> ingredientMap = ingredients.stream()
                .collect(Collectors.toMap(Ingredient::getId, Function.identity()));

        recipeDto.getIngredientQuantities()
                .forEach(iqDto -> {
                    var ingredient = ingredientMap.get(iqDto.getIngredient().getId());
                    Unit unit = iqDto.getUnit() != null
                            ? unitMap.get(iqDto.getUnit().getId())
                            : ingredient.getDefaultUnit();
                    this.setIngredientQuantity(ingredient, unit, iqDto.getQuantity());
                });
    }

    void setIngredientQuantity(Ingredient ingredient, Unit unit, Double quantity) {
        if(ingredientQuantities == null) {
            ingredientQuantities = new ArrayList<>();
        }

        ingredientQuantities.add(new IngredientQuantity(this, ingredient, unit, quantity));
    }

    public RecipeDto toDto() {
        List<IngredientQuantityDto> quantityDtos = ingredientQuantities.stream()
                .map(IngredientQuantity::toDto).toList();
        return new RecipeDto(id, name, method, servings, quantityDtos, sourceUrl);
    }
}

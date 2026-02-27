package com.maxgarfinkel.recipes.recipe;

import com.maxgarfinkel.recipes.ingredient.Ingredient;
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

    Recipe(RecipeDto recipeDto, List<Ingredient> ingredients) {
        this.name = recipeDto.getName();
        this.method = recipeDto.getMethod();
        this.servings = recipeDto.getServings();
        this.sourceUrl = recipeDto.getSourceUrl();
        setAllIngredientQuantities(recipeDto, ingredients);
    }

    public void update(RecipeDto recipeDto, List<Ingredient> ingredients) {
        this.name = recipeDto.getName();
        this.method = recipeDto.getMethod();
        this.servings = recipeDto.getServings();
        setAllIngredientQuantities(recipeDto, ingredients);
    }

    private void setAllIngredientQuantities(RecipeDto recipeDto, List<Ingredient> ingredients) {
        if(ingredientQuantities != null) {
            this.ingredientQuantities.clear();
        }
        Map<Long, Ingredient> ingredientMap = ingredients.stream()
                .collect(Collectors.toMap(Ingredient::getId, Function.identity()));

        recipeDto.getIngredientQuantities()
                .forEach(ingredientQuantity -> {
                    var i = ingredientMap.get(ingredientQuantity.getIngredient().getId());
                    this.setIngredientQuantity(i, ingredientQuantity.getQuantity());
                });
    }

    void setIngredientQuantity(Ingredient ingredient, Double quantity) {
        if(ingredientQuantities == null) {
            ingredientQuantities = new ArrayList<>();
        }

        ingredientQuantities.add(new IngredientQuantity(this, ingredient, quantity));
    }

    public RecipeDto toDto() {
        List<IngredientQuantityDto> quantityDtos = ingredientQuantities.stream()
                .map(IngredientQuantity::toDto).toList();
        return new RecipeDto(id, name, method, servings, quantityDtos, sourceUrl);
    }
}

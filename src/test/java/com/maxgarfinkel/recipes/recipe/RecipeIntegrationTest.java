package com.maxgarfinkel.recipes.recipe;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.maxgarfinkel.recipes.SpringTestBase;
import com.maxgarfinkel.recipes.ingredient.IngredientDto;
import com.maxgarfinkel.recipes.unit.UnitDto;
import org.junit.jupiter.api.Test;
import org.springframework.core.ParameterizedTypeReference;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class RecipeIntegrationTest extends SpringTestBase {

    @Test
    public void canCrudRecipe() throws JsonProcessingException {
        //Create
        var ingredient = saveIngredient("basil");

        var ingredientQuantityDto = new IngredientQuantityDto(
                null, 1d, ingredient);

        var recipeDto = new RecipeDto(null,
                "aRecipe",
                "do some stuff", 1, List.of(ingredientQuantityDto), null);

        recipeDto = restClient.post()
                .uri("/api/v1/recipe/")
                .body(objectMapper.writeValueAsString(recipeDto))
                .retrieve()
                .body(RecipeDto.class);

        assertThat(recipeDto).isNotNull();
        assertThat(recipeDto.getId()).isNotNull();
        assertThat(recipeDto.getName()).isEqualTo("aRecipe");
        assertThat(recipeDto.getMethod()).isEqualTo("do some stuff");
        assertThat(recipeDto.getServings()).isEqualTo(1);
        var ingredientQty = recipeDto.getIngredientQuantities().getFirst();
        assertThat(ingredientQty.getQuantity()).isEqualTo(1d);
        assertThat(ingredientQty.getIngredient().getName()).isEqualTo("basil");
        assertThat(ingredientQty.getIngredient().getUnit().getName()).isEqualTo("Gram");

        //Read
        var readRecipeDto = restClient.get()
                .uri("api/v1/recipe/{id}", recipeDto.getId())
                .retrieve()
                .body(RecipeDto.class);
        assertThat(readRecipeDto).isEqualTo(recipeDto);

        //Update
        var newIngredient = saveIngredient("cheese");
        var newIngredientQuantityDto = new IngredientQuantityDto(null, 1d, newIngredient);
        var ingredientQtys = recipeDto.getIngredientQuantities();
        ingredientQtys.add(newIngredientQuantityDto);
        recipeDto = new RecipeDto(recipeDto.getId(),
                "updated name", recipeDto.getMethod(), 2,
                ingredientQtys, null);

        recipeDto = restClient.put()
                .uri("/api/v1/recipe/"+recipeDto.getId())
                .body(objectMapper.writeValueAsString(recipeDto))
                .retrieve()
                .body(RecipeDto.class);

        assertThat(recipeDto).isNotNull();
        assertThat(recipeDto.getName()).isEqualTo("updated name");
        assertThat(recipeDto.getServings()).isEqualTo(2);
        assertThat(recipeDto.getIngredientQuantities().size()).isEqualTo(2);

        //Delete
        restClient.delete()
                .uri("/api/v1/recipe/"+recipeDto.getId())
                .retrieve()
                .toBodilessEntity();

        var recipies = restClient.get()
                .uri("/api/v1/recipe/")
                .retrieve()
                .body(new ParameterizedTypeReference<List<RecipeDto>>() {});
        assertThat(recipies).hasSize(0);
    }

    @Test
    public void sourceUrlIsPersistedAndPreservedOnUpdate() throws JsonProcessingException {
        var ingredient = saveIngredient("basil");
        var ingredientQuantityDto = new IngredientQuantityDto(null, 1d, ingredient);
        var recipeDto = new RecipeDto(null, "sourced recipe", "do stuff", 2,
                List.of(ingredientQuantityDto), "https://example.com/recipe");

        recipeDto = restClient.post()
                .uri("/api/v1/recipe/")
                .body(objectMapper.writeValueAsString(recipeDto))
                .retrieve()
                .body(RecipeDto.class);

        assertThat(recipeDto).isNotNull();
        assertThat(recipeDto.getSourceUrl()).isEqualTo("https://example.com/recipe");

        // Update without sourceUrl — existing value should be preserved
        var updateDto = new RecipeDto(recipeDto.getId(), "updated name", recipeDto.getMethod(),
                recipeDto.getServings(), recipeDto.getIngredientQuantities(), null);

        var updated = restClient.put()
                .uri("/api/v1/recipe/" + recipeDto.getId())
                .body(objectMapper.writeValueAsString(updateDto))
                .retrieve()
                .body(RecipeDto.class);

        assertThat(updated).isNotNull();
        assertThat(updated.getSourceUrl()).isEqualTo("https://example.com/recipe");
    }

    private IngredientDto saveIngredient(String name) throws JsonProcessingException {
        var unit = new UnitDto(1L, "Gram", "g", null, 1.0);
        var ingredient = new IngredientDto(name, null, unit);
        String createJson = objectMapper.writeValueAsString(ingredient);
        ingredient = restClient.post()
                .uri("/api/v1/ingredient/")
                .body(createJson)
                .retrieve()
                .body(IngredientDto.class);
        return ingredient;
    }

}
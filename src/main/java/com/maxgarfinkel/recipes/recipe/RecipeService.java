package com.maxgarfinkel.recipes.recipe;

import com.maxgarfinkel.recipes.ItemNotFound;
import com.maxgarfinkel.recipes.ingredient.Ingredient;
import com.maxgarfinkel.recipes.ingredient.IngredientService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final IngredientService ingredientService;

    RecipeDto getRecipe(Long id) {
        return recipeRepository.getReferenceById(id).toDto();
    }

    List<RecipeDto> getRecipes() {
        return recipeRepository.findAll()
                .stream()
                .map(Recipe::toDto)
                .toList();
    }

    @Transactional
    RecipeDto createRecipe(RecipeDto recipeDto) {

        List<Ingredient> ingredients = getIngredients(recipeDto);

        Recipe recipe = new Recipe(recipeDto, ingredients);

        return recipeRepository.save(recipe).toDto();
    }

    @Transactional
    RecipeDto updateRecipe(Long id, RecipeDto recipeDto) {
        var recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new ItemNotFound(
                        recipeDto.getId(),
                        "recipe",
                        "Recipe with Id: " + recipeDto.getId() + " not found"));

        var ingredients = getIngredients(recipeDto);
        recipe.update(recipeDto, ingredients);
        if (recipeDto.getSourceUrl() != null) {
            recipe.setSourceUrl(recipeDto.getSourceUrl());
        }
        return recipeRepository.save(recipe).toDto();
    }

    @Transactional
    void deleteRecipe(Long id) {
        recipeRepository.deleteById(id);
    }

    private List<Ingredient> getIngredients(RecipeDto recipeDto) {
        List<Long> ingredientIds = recipeDto.getIngredientQuantities().stream()
                .map(i -> i.getIngredient().getId())
                .toList();

        return ingredientService.findAllById(ingredientIds);
    }
}

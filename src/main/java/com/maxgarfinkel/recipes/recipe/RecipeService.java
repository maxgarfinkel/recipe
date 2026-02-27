package com.maxgarfinkel.recipes.recipe;

import com.maxgarfinkel.recipes.ItemNotFound;
import com.maxgarfinkel.recipes.ingredient.Ingredient;
import com.maxgarfinkel.recipes.ingredient.IngredientService;
import com.maxgarfinkel.recipes.unit.Unit;
import com.maxgarfinkel.recipes.unit.UnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final IngredientService ingredientService;
    private final UnitService unitService;

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
        Map<Long, Unit> unitMap = getUnits(recipeDto);
        Recipe recipe = new Recipe(recipeDto, ingredients, unitMap);
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
        var unitMap = getUnits(recipeDto);
        recipe.update(recipeDto, ingredients, unitMap);
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

    private Map<Long, Unit> getUnits(RecipeDto recipeDto) {
        List<Long> unitIds = recipeDto.getIngredientQuantities().stream()
                .filter(iq -> iq.getUnit() != null && iq.getUnit().getId() != null)
                .map(iq -> iq.getUnit().getId())
                .distinct()
                .toList();
        if (unitIds.isEmpty()) return Map.of();
        return unitService.findAllById(unitIds).stream()
                .collect(Collectors.toMap(Unit::getId, Function.identity()));
    }
}

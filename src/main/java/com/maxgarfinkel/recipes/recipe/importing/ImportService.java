package com.maxgarfinkel.recipes.recipe.importing;

import com.maxgarfinkel.recipes.ingredient.IngredientDto;
import com.maxgarfinkel.recipes.ingredient.IngredientService;
import com.maxgarfinkel.recipes.unit.UnitDto;
import com.maxgarfinkel.recipes.unit.UnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ImportService {

    private final UrlFetcher urlFetcher;
    private final CompositeRecipeExtractor recipeExtractor;
    private final UnitService unitService;
    private final IngredientService ingredientService;

    public RecipeImportDraft importFromUrl(String url) {
        String html = urlFetcher.fetch(url);
        RecipeImportDraft draft = recipeExtractor.extract(html, url)
                .orElseThrow(() -> new RecipeImportException("Could not extract recipe from: " + url));
        resolveEntities(draft);
        return draft;
    }

    private void resolveEntities(RecipeImportDraft draft) {
        List<UnitDto> allUnits = unitService.getUnitsAsDtos();
        List<IngredientDto> allIngredients = ingredientService.getAllAsDto();

        if (draft.getIngredientLines() == null) return;

        for (RecipeImportDraft.ImportedIngredientLine line : draft.getIngredientLines()) {
            if (line.getQuantity() == null) continue;
            if (line.getUnitNameHint() == null || line.getIngredientNameHint() == null) continue;

            UnitDto resolvedUnit = resolveUnit(line.getUnitNameHint(), allUnits);
            IngredientDto resolvedIngredient = resolveIngredient(line.getIngredientNameHint(), allIngredients);

            if (resolvedUnit != null && resolvedIngredient != null) {
                line.setResolvedUnit(resolvedUnit);
                line.setResolvedIngredient(resolvedIngredient);
            }
        }
    }

    private UnitDto resolveUnit(String hint, List<UnitDto> allUnits) {
        String lowerHint = hint.toLowerCase();
        return allUnits.stream()
                .filter(u -> u.getName().equalsIgnoreCase(lowerHint)
                        || u.getAbbreviation().equalsIgnoreCase(lowerHint))
                .findFirst()
                .orElse(null);
    }

    private IngredientDto resolveIngredient(String hint, List<IngredientDto> allIngredients) {
        return allIngredients.stream()
                .filter(i -> i.getName().equalsIgnoreCase(hint))
                .findFirst()
                .orElse(null);
    }
}

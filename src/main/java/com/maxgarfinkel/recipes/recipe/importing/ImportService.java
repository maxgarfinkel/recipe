package com.maxgarfinkel.recipes.recipe.importing;

import com.maxgarfinkel.recipes.ingredient.IngredientAlias;
import com.maxgarfinkel.recipes.ingredient.IngredientAliasService;
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
    private final VisionRecipeExtractor visionRecipeExtractor;
    private final UnitService unitService;
    private final IngredientService ingredientService;
    private final IngredientAliasService ingredientAliasService;

    public RecipeImportDraft importFromImage(byte[] imageBytes, String mediaType) {
        RecipeImportDraft draft = visionRecipeExtractor.extract(imageBytes, mediaType)
                .orElseThrow(() -> new RecipeImportException("Could not extract recipe from image"));
        resolveEntities(draft);
        return draft;
    }

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
        List<IngredientAlias> allAliases = ingredientAliasService.findAll();

        if (draft.getIngredientLines() == null) return;

        for (RecipeImportDraft.ImportedIngredientLine line : draft.getIngredientLines()) {
            if (line.getQuantity() == null) continue;
            if (line.getUnitNameHint() == null || line.getIngredientNameHint() == null) continue;

            UnitDto resolvedUnit = resolveUnit(line.getUnitNameHint(), allUnits);
            IngredientDto resolvedIngredient = resolveIngredient(line.getIngredientNameHint(), allIngredients);

            if (resolvedUnit == null || resolvedIngredient == null) {
                IngredientAlias alias = resolveAlias(line.getIngredientNameHint(), allAliases);
                if (alias != null) {
                    resolvedIngredient = alias.getIngredient().toDto();
                    resolvedUnit = alias.getUnit().toDto();
                }
            }

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

    private IngredientAlias resolveAlias(String hint, List<IngredientAlias> allAliases) {
        String normalised = IngredientAliasService.normalise(hint);
        return allAliases.stream()
                .filter(a -> a.getAliasText().equals(normalised))
                .findFirst()
                .orElse(null);
    }
}

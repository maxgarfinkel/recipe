package com.maxgarfinkel.recipes.recipe.importing;

import com.maxgarfinkel.recipes.ingredient.IngredientDto;
import com.maxgarfinkel.recipes.ingredient.IngredientService;
import com.maxgarfinkel.recipes.unit.UnitDto;
import com.maxgarfinkel.recipes.unit.UnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ImportService {

    private static final Pattern INGREDIENT_PATTERN =
            Pattern.compile("^(\\d+\\.?\\d*)\\s+(\\w+)\\s+(.+)$");

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
            // For schema.org path where no hints were extracted, try regex parse of rawText
            if (line.getUnitNameHint() == null && line.getIngredientNameHint() == null
                    && line.getRawText() != null) {
                tryParseRawText(line);
            }

            if (line.getUnitNameHint() != null) {
                line.setResolvedUnit(resolveUnit(line.getUnitNameHint(), allUnits));
            }
            if (line.getIngredientNameHint() != null) {
                line.setResolvedIngredient(resolveIngredient(line.getIngredientNameHint(), allIngredients));
            }
        }
    }

    private void tryParseRawText(RecipeImportDraft.ImportedIngredientLine line) {
        Matcher matcher = INGREDIENT_PATTERN.matcher(line.getRawText().trim());
        if (matcher.matches()) {
            try {
                line.setQuantity(Double.parseDouble(matcher.group(1)));
            } catch (NumberFormatException ignored) {}
            line.setUnitNameHint(matcher.group(2));
            line.setIngredientNameHint(matcher.group(3));
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

package com.maxgarfinkel.recipes.recipe.importing;

import com.maxgarfinkel.recipes.ingredient.IngredientDto;
import com.maxgarfinkel.recipes.unit.UnitDto;
import lombok.Data;

import java.util.List;

@Data
public class RecipeImportDraft {

    private String name;
    private Integer servings;
    private String method;
    private String sourceUrl;
    private String extractionSource;
    private List<ImportedIngredientLine> ingredientLines;

    @Data
    public static class ImportedIngredientLine {
        private String rawText;
        private Double quantity;
        private String ingredientNameHint;
        private String unitNameHint;
        private IngredientDto resolvedIngredient;
        private UnitDto resolvedUnit;
    }
}

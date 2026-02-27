package com.maxgarfinkel.recipes.recipe.importing;

import java.util.Optional;

public interface RecipeExtractor {
    Optional<RecipeImportDraft> extract(String html, String sourceUrl);
}

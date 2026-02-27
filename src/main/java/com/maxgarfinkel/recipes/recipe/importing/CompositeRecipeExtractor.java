package com.maxgarfinkel.recipes.recipe.importing;

import java.util.List;
import java.util.Optional;

public class CompositeRecipeExtractor implements RecipeExtractor {

    private final List<RecipeExtractor> extractors;

    public CompositeRecipeExtractor(List<RecipeExtractor> extractors) {
        this.extractors = extractors;
    }

    @Override
    public Optional<RecipeImportDraft> extract(String html, String sourceUrl) {
        for (RecipeExtractor extractor : extractors) {
            Optional<RecipeImportDraft> result = extractor.extract(html, sourceUrl);
            if (result.isPresent()) {
                return result;
            }
        }
        return Optional.empty();
    }
}

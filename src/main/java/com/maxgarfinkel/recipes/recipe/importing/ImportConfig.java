package com.maxgarfinkel.recipes.recipe.importing;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class ImportConfig {

    @Bean
    public CompositeRecipeExtractor compositeRecipeExtractor(
            SchemaOrgExtractor schemaOrgExtractor,
            LlmExtractor llmExtractor) {
        return new CompositeRecipeExtractor(List.of(schemaOrgExtractor, llmExtractor));
    }
}

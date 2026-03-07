package com.maxgarfinkel.recipes.recipe.importing;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Configuration
public class AnthropicPromptConfig {

    @Bean("llmExtractionPrompt")
    public String llmExtractionPrompt(
            @Value("${anthropic.prompts.llm-extraction}") Resource resource) throws IOException {
        return resource.getContentAsString(StandardCharsets.UTF_8);
    }

    @Bean("visionExtractionPrompt")
    public String visionExtractionPrompt(
            @Value("${anthropic.prompts.vision-extraction}") Resource resource) throws IOException {
        return resource.getContentAsString(StandardCharsets.UTF_8);
    }

    @Bean("ingredientRefinementPrompt")
    public String ingredientRefinementPrompt(
            @Value("${anthropic.prompts.ingredient-refinement}") Resource resource) throws IOException {
        return resource.getContentAsString(StandardCharsets.UTF_8);
    }
}

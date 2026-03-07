package com.maxgarfinkel.recipes.recipe.importing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@Slf4j
public class LlmIngredientRefiner {

    private final AnthropicClient anthropicClient;
    private final ObjectMapper objectMapper;
    private final PromptBuilder promptBuilder;
    private final String model;
    private final String promptTemplate;

    public LlmIngredientRefiner(AnthropicClient anthropicClient,
                                ObjectMapper objectMapper,
                                PromptBuilder promptBuilder,
                                @Value("${anthropic.llm-model:claude-haiku-4-5-20251001}") String model,
                                @Qualifier("ingredientRefinementPrompt") String promptTemplate) {
        this.anthropicClient = anthropicClient;
        this.objectMapper = objectMapper;
        this.promptBuilder = promptBuilder;
        this.model = model;
        this.promptTemplate = promptTemplate;
    }

    /**
     * Asks the LLM to parse a list of raw ingredient strings into structured lines.
     * Returns {@code Optional.empty()} if the LLM is not configured, the list is empty,
     * or any error occurs — callers should fall back to {@link IngredientLineParser}.
     */
    public Optional<List<RecipeImportDraft.ImportedIngredientLine>> refine(List<String> rawIngredients) {
        if (!anthropicClient.isConfigured() || rawIngredients.isEmpty()) {
            return Optional.empty();
        }

        try {
            String ingredientsJson = objectMapper.writeValueAsString(rawIngredients);
            String prompt = promptBuilder.buildIngredientPrompt(promptTemplate, ingredientsJson);
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "max_tokens", 1024,
                    "messages", List.of(Map.of("role", "user", "content", prompt))
            );

            String content = anthropicClient.sendMessages(requestBody)
                    .path("content").path(0).path("text").asText();
            if (content.isBlank()) {
                log.warn("Ingredient refinement returned empty content from LLM.");
                return Optional.empty();
            }

            JsonNode array = objectMapper.readTree(stripMarkdownFences(content));
            if (!array.isArray()) {
                log.warn("Ingredient refinement response was not a JSON array.");
                return Optional.empty();
            }
            if (array.size() != rawIngredients.size()) {
                log.warn("Ingredient refinement returned {} items for {} inputs — ignoring.",
                        array.size(), rawIngredients.size());
                return Optional.empty();
            }

            List<RecipeImportDraft.ImportedIngredientLine> lines = new ArrayList<>();
            for (JsonNode item : array) {
                RecipeImportDraft.ImportedIngredientLine line = new RecipeImportDraft.ImportedIngredientLine();
                line.setRawText(item.path("rawText").asText(null));
                JsonNode qty = item.path("quantity");
                line.setQuantity(qty.isNull() || qty.isMissingNode() ? null : qty.asDouble());
                JsonNode unit = item.path("unitName");
                line.setUnitNameHint(unit.isNull() || unit.isMissingNode() ? null : unit.asText(null));
                JsonNode name = item.path("ingredientName");
                line.setIngredientNameHint(name.isNull() || name.isMissingNode() ? null : name.asText(null));
                lines.add(line);
            }
            return Optional.of(lines);

        } catch (AnthropicApiException e) {
            log.warn("Ingredient refinement failed: {}", e.getMessage());
            return Optional.empty();
        } catch (Exception e) {
            log.warn("Ingredient refinement failed due to unexpected error: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private static String stripMarkdownFences(String text) {
        String trimmed = text.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            if (firstNewline != -1) {
                trimmed = trimmed.substring(firstNewline + 1);
            }
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.lastIndexOf("```")).trim();
            }
        }
        return trimmed;
    }
}

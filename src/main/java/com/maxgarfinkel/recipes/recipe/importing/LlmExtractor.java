package com.maxgarfinkel.recipes.recipe.importing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@Order(2)
@Slf4j
public class LlmExtractor implements RecipeExtractor {

    private static final String ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
    private static final int MAX_TEXT_LENGTH = 8000;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;

    public LlmExtractor(RestClient.Builder restClientBuilder, ObjectMapper objectMapper,
                        @Value("${anthropic.api-key:}") String apiKey) {
        this.restClient = restClientBuilder.build();
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
    }

    @Override
    public Optional<RecipeImportDraft> extract(String html, String sourceUrl) {
        if (apiKey == null || apiKey.isBlank()) {
            return Optional.empty();
        }

        try {
            String text = extractReadableText(html);
            String prompt = buildPrompt(text);

            Map<String, Object> requestBody = Map.of(
                    "model", "claude-haiku-4-5-20251001",
                    "max_tokens", 2048,
                    "messages", List.of(Map.of("role", "user", "content", prompt))
            );

            String responseBody = restClient.post()
                    .uri(ANTHROPIC_API_URL)
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .header("content-type", "application/json")
                    .body(objectMapper.writeValueAsString(requestBody))
                    .retrieve()
                    .body(String.class);

            JsonNode response = objectMapper.readTree(responseBody);
            String content = response.path("content").path(0).path("text").asText();
            content = stripMarkdownFences(content);

            return Optional.of(parseLlmResponse(content, sourceUrl));
        } catch (Exception e) {
            log.debug("LLM extraction failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private String extractReadableText(String html) {
        String text = Jsoup.parse(html).text();
        if (text.length() > MAX_TEXT_LENGTH) {
            return text.substring(0, MAX_TEXT_LENGTH);
        }
        return text;
    }

    private String buildPrompt(String text) {
        return """
                Extract the recipe from the following text and return ONLY a JSON object with no prose or markdown fences.
                The JSON must have this exact structure:
                {"name":"...","servings":4,"method":"...","ingredients":[{"rawText":"2 cups flour","quantity":2,"unitName":"cup","ingredientName":"flour"}]}

                Text:
                """ + text;
    }

    private String stripMarkdownFences(String text) {
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

    private RecipeImportDraft parseLlmResponse(String json, String sourceUrl) throws Exception {
        JsonNode root = objectMapper.readTree(json);

        RecipeImportDraft draft = new RecipeImportDraft();
        draft.setSourceUrl(sourceUrl);
        draft.setExtractionSource("LLM");
        draft.setName(root.path("name").asText(null));

        JsonNode servingsNode = root.path("servings");
        if (!servingsNode.isMissingNode() && !servingsNode.isNull()) {
            draft.setServings(servingsNode.asInt());
        }

        draft.setMethod(root.path("method").asText(null));

        List<RecipeImportDraft.ImportedIngredientLine> lines = new ArrayList<>();
        JsonNode ingredients = root.path("ingredients");
        if (ingredients.isArray()) {
            for (JsonNode item : ingredients) {
                RecipeImportDraft.ImportedIngredientLine line = new RecipeImportDraft.ImportedIngredientLine();
                line.setRawText(item.path("rawText").asText(null));
                JsonNode quantityNode = item.path("quantity");
                if (!quantityNode.isMissingNode() && !quantityNode.isNull()) {
                    line.setQuantity(quantityNode.asDouble());
                }
                line.setUnitNameHint(item.path("unitName").asText(null));
                line.setIngredientNameHint(item.path("ingredientName").asText(null));
                lines.add(line);
            }
        }
        draft.setIngredientLines(lines);

        return draft;
    }
}

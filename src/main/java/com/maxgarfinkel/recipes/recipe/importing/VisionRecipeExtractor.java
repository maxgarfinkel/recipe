package com.maxgarfinkel.recipes.recipe.importing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@Slf4j
public class VisionRecipeExtractor {

    private static final String ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
    private static final String EXTRACTION_PROMPT = """
            Extract the recipe from this image of a recipe book page and return ONLY a JSON object with no prose or markdown fences.
            The JSON must have this exact structure:
            {"name":"...","servings":4,"method":"...","ingredients":[{"rawText":"2 cups flour","quantity":2,"unitName":"cup","ingredientName":"flour"}]}
            """;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final RecipeImportDraftParser parser;
    private final String apiKey;

    public VisionRecipeExtractor(RestClient.Builder restClientBuilder, ObjectMapper objectMapper,
                                 RecipeImportDraftParser parser,
                                 @Value("${anthropic.api-key:}") String apiKey) {
        this.restClient = restClientBuilder.build();
        this.objectMapper = objectMapper;
        this.parser = parser;
        this.apiKey = apiKey;
    }

    public Optional<RecipeImportDraft> extract(byte[] imageBytes, String mediaType) {
        if (apiKey == null || apiKey.isBlank()) {
            return Optional.empty();
        }

        try {
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            Map<String, Object> imageContent = Map.of(
                    "type", "image",
                    "source", Map.of(
                            "type", "base64",
                            "media_type", mediaType,
                            "data", base64Image
                    )
            );
            Map<String, Object> textContent = Map.of(
                    "type", "text",
                    "text", EXTRACTION_PROMPT
            );

            Map<String, Object> requestBody = Map.of(
                    "model", "claude-sonnet-4-6",
                    "max_tokens", 2048,
                    "messages", List.of(Map.of(
                            "role", "user",
                            "content", List.of(imageContent, textContent)
                    ))
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

            return Optional.of(parser.parse(content, null, "VISION"));
        } catch (Exception e) {
            log.debug("Vision extraction failed: {}", e.getMessage());
            return Optional.empty();
        }
    }
}

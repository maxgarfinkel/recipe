package com.maxgarfinkel.recipes.recipe.importing;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@Slf4j
public class VisionRecipeExtractor {

    private final AnthropicClient anthropicClient;
    private final RecipeImportDraftParser parser;
    private final String model;
    private final String extractionPrompt;

    public VisionRecipeExtractor(AnthropicClient anthropicClient,
                                 RecipeImportDraftParser parser,
                                 @Value("${anthropic.vision-model:claude-sonnet-4-6}") String model,
                                 @Qualifier("visionExtractionPrompt") String extractionPrompt) {
        this.anthropicClient = anthropicClient;
        this.parser = parser;
        this.model = model;
        this.extractionPrompt = extractionPrompt;
    }

    public Optional<RecipeImportDraft> extract(byte[] imageBytes, String mediaType) {
        if (!anthropicClient.isConfigured()) {
            return Optional.empty();
        }
        if (mediaType == null || mediaType.isBlank()) {
            log.warn("Vision extraction skipped: image content type is missing.");
            return Optional.empty();
        }

        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "max_tokens", 2048,
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", List.of(
                                Map.of("type", "image", "source", Map.of(
                                        "type", "base64",
                                        "media_type", mediaType,
                                        "data", base64Image
                                )),
                                Map.of("type", "text", "text", extractionPrompt)
                        )
                ))
        );

        try {
            String content = anthropicClient.sendMessages(requestBody)
                    .path("content").path(0).path("text").asText();
            if (content.isBlank()) {
                log.warn("Anthropic returned empty content for vision extraction.");
                return Optional.empty();
            }
            return Optional.of(parser.parse(content, null, "VISION"));
        } catch (AnthropicApiException e) {
            log.warn("Vision extraction failed: {}", e.getMessage());
            return Optional.empty();
        } catch (Exception e) {
            log.warn("Vision extraction failed due to unexpected error: {}", e.getMessage());
            return Optional.empty();
        }
    }
}

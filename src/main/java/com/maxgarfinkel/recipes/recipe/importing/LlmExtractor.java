package com.maxgarfinkel.recipes.recipe.importing;

import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@Order(2)
@Slf4j
public class LlmExtractor implements RecipeExtractor {

    private static final int MAX_TEXT_LENGTH = 8000;

    private final AnthropicClient anthropicClient;
    private final RecipeImportDraftParser parser;
    private final PromptBuilder promptBuilder;
    private final String model;
    private final String promptTemplate;

    public LlmExtractor(AnthropicClient anthropicClient,
                        RecipeImportDraftParser parser,
                        PromptBuilder promptBuilder,
                        @Value("${anthropic.llm-model:claude-haiku-4-5-20251001}") String model,
                        @Qualifier("llmExtractionPrompt") String promptTemplate) {
        this.anthropicClient = anthropicClient;
        this.parser = parser;
        this.promptBuilder = promptBuilder;
        this.model = model;
        this.promptTemplate = promptTemplate;
    }

    @Override
    public Optional<RecipeImportDraft> extract(String html, String sourceUrl) {
        if (!anthropicClient.isConfigured()) {
            return Optional.empty();
        }

        try {
            String text = extractReadableText(html);
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "max_tokens", 2048,
                    "messages", List.of(Map.of("role", "user", "content", promptBuilder.buildTextPrompt(promptTemplate, text)))
            );
            String content = anthropicClient.sendMessages(requestBody)
                    .path("content").path(0).path("text").asText();
            return Optional.of(parser.parse(content, sourceUrl, "LLM"));
        } catch (RecipeSchemaValidationException e) {
            return Optional.empty(); // already logged by parser
        } catch (AnthropicApiException e) {
            log.warn("LLM extraction failed: {}", e.getMessage());
            return Optional.empty();
        } catch (Exception e) {
            log.warn("LLM extraction failed due to unexpected error: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private String extractReadableText(String html) {
        String text = Jsoup.parse(html).text();
        return text.length() > MAX_TEXT_LENGTH ? text.substring(0, MAX_TEXT_LENGTH) : text;
    }


}

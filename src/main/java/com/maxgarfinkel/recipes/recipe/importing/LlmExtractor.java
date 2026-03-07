package com.maxgarfinkel.recipes.recipe.importing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

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
    private final RecipeImportDraftParser parser;
    private final String apiKey;
    private final String promptTemplate;

    public LlmExtractor(RestClient.Builder restClientBuilder, ObjectMapper objectMapper,
                        RecipeImportDraftParser parser,
                        @Value("${anthropic.api-key:}") String apiKey,
                        @Qualifier("llmExtractionPrompt") String promptTemplate) {
        this.restClient = restClientBuilder.build();
        this.objectMapper = objectMapper;
        this.parser = parser;
        this.apiKey = apiKey;
        this.promptTemplate = promptTemplate;
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
            return Optional.of(parser.parse(content, sourceUrl, "LLM"));
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
        return promptTemplate.replace("{text}", text);
    }

}

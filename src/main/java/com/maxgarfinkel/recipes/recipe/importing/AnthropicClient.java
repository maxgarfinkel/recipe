package com.maxgarfinkel.recipes.recipe.importing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Component
@Slf4j
public class AnthropicClient {

    private static final String MESSAGES_URL = "https://api.anthropic.com/v1/messages";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;

    public AnthropicClient(RestClient.Builder restClientBuilder,
                           ObjectMapper objectMapper,
                           @Value("${anthropic.api-key:}") String apiKey) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(30));
        this.restClient = restClientBuilder
                .requestFactory(factory)
                .build();
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public JsonNode sendMessages(Object requestBody) {
        try {
            String json = objectMapper.writeValueAsString(requestBody);
            String responseBody = restClient.post()
                    .uri(MESSAGES_URL)
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .header("content-type", "application/json")
                    .body(json)
                    .retrieve()
                    .onStatus(
                            status -> status.value() == 401 || status.value() == 403,
                            (req, res) -> {
                                log.error("Anthropic authentication failed ({}). Check ANTHROPIC_API_KEY.", res.getStatusCode());
                                throw new AnthropicApiException("Authentication failed: " + res.getStatusCode());
                            })
                    .onStatus(
                            status -> status.value() == 429,
                            (req, res) -> {
                                log.warn("Anthropic rate limit exceeded.");
                                throw new AnthropicApiException("Rate limit exceeded");
                            })
                    .onStatus(
                            HttpStatusCode::is5xxServerError,
                            (req, res) -> {
                                log.warn("Anthropic server error: {}", res.getStatusCode());
                                throw new AnthropicApiException("Server error: " + res.getStatusCode());
                            })
                    .body(String.class);
            return objectMapper.readTree(responseBody);
        } catch (AnthropicApiException e) {
            throw e;
        } catch (Exception e) {
            throw new AnthropicApiException("Anthropic API call failed: " + e.getMessage(), e);
        }
    }
}

package com.maxgarfinkel.recipes.recipe.importing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LlmIngredientRefinerTest {

    private static final String TEST_PROMPT_TEMPLATE =
            "Parse ingredients and return JSON.\n{context}\nIngredients:\n{ingredients}";

    private AnthropicClient anthropicClient;
    private LlmIngredientRefiner refiner;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        anthropicClient = mock(AnthropicClient.class);
        PromptBuilder promptBuilder = mock(PromptBuilder.class);
        when(promptBuilder.buildIngredientPrompt(any(), any()))
                .thenAnswer(inv -> ((String) inv.getArgument(0))
                        .replace("{ingredients}", inv.getArgument(1))
                        .replace("{context}", ""));
        refiner = new LlmIngredientRefiner(anthropicClient, objectMapper, promptBuilder,
                "claude-haiku-4-5-20251001", TEST_PROMPT_TEMPLATE);
        when(anthropicClient.isConfigured()).thenReturn(true);
    }

    private JsonNode llmResponse(String content) throws Exception {
        String escaped = content.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
        return objectMapper.readTree("{\"content\": [{\"type\": \"text\", \"text\": \"" + escaped + "\"}]}");
    }

    @Test
    void notConfigured_returnsEmpty() {
        when(anthropicClient.isConfigured()).thenReturn(false);

        var result = refiner.refine(List.of("200g flour"));

        assertThat(result).isEmpty();
        verify(anthropicClient, never()).sendMessages(any());
    }

    @Test
    void emptyList_returnsEmpty() {
        var result = refiner.refine(List.of());

        assertThat(result).isEmpty();
        verify(anthropicClient, never()).sendMessages(any());
    }

    @Test
    void successfulResponse_parsesLines() throws Exception {
        String json = "[{\"rawText\":\"2 finely chopped onions\",\"quantity\":2,\"unitName\":\"unit\",\"ingredientName\":\"onion\"}]";
        when(anthropicClient.sendMessages(any())).thenReturn(llmResponse(json));

        var result = refiner.refine(List.of("2 finely chopped onions"));

        assertThat(result).isPresent();
        var lines = result.get();
        assertThat(lines).hasSize(1);
        assertThat(lines.getFirst().getRawText()).isEqualTo("2 finely chopped onions");
        assertThat(lines.getFirst().getQuantity()).isEqualTo(2.0);
        assertThat(lines.getFirst().getUnitNameHint()).isEqualTo("unit");
        assertThat(lines.getFirst().getIngredientNameHint()).isEqualTo("onion");
    }

    @Test
    void nullQuantityAndUnit_parsedCorrectly() throws Exception {
        String json = "[{\"rawText\":\"salt to taste\",\"quantity\":null,\"unitName\":null,\"ingredientName\":\"salt\"}]";
        when(anthropicClient.sendMessages(any())).thenReturn(llmResponse(json));

        var result = refiner.refine(List.of("salt to taste"));

        assertThat(result).isPresent();
        var line = result.get().getFirst();
        assertThat(line.getQuantity()).isNull();
        assertThat(line.getUnitNameHint()).isNull();
        assertThat(line.getIngredientNameHint()).isEqualTo("salt");
    }

    @Test
    void responseWrappedInMarkdownFences_stillParsed() throws Exception {
        String fenced = "```json\n[{\"rawText\":\"1 egg\",\"quantity\":1,\"unitName\":\"unit\",\"ingredientName\":\"egg\"}]\n```";
        when(anthropicClient.sendMessages(any())).thenReturn(llmResponse(fenced));

        var result = refiner.refine(List.of("1 egg"));

        assertThat(result).isPresent();
        assertThat(result.get().getFirst().getIngredientNameHint()).isEqualTo("egg");
    }

    @Test
    void mismatchedArraySize_returnsEmpty() throws Exception {
        // LLM returns 2 items for 1 input
        String json = "[{\"rawText\":\"1 egg\",\"quantity\":1,\"unitName\":\"unit\",\"ingredientName\":\"egg\"}," +
                "{\"rawText\":\"extra\",\"quantity\":null,\"unitName\":null,\"ingredientName\":\"extra\"}]";
        when(anthropicClient.sendMessages(any())).thenReturn(llmResponse(json));

        var result = refiner.refine(List.of("1 egg"));

        assertThat(result).isEmpty();
    }

    @Test
    void apiThrowsException_returnsEmpty() {
        when(anthropicClient.sendMessages(any())).thenThrow(new AnthropicApiException("Server error: 500"));

        var result = refiner.refine(List.of("200g flour"));

        assertThat(result).isEmpty();
    }

    @Test
    void malformedJsonResponse_returnsEmpty() throws Exception {
        when(anthropicClient.sendMessages(any())).thenReturn(
                objectMapper.readTree("{\"content\": [{\"type\": \"text\", \"text\": \"{not an array}\"}]}"));

        var result = refiner.refine(List.of("200g flour"));

        assertThat(result).isEmpty();
    }
}

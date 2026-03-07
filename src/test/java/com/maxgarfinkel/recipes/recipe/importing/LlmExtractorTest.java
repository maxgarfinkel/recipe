package com.maxgarfinkel.recipes.recipe.importing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LlmExtractorTest {

    private static final String TEST_PROMPT_TEMPLATE =
            "Extract the recipe and return ONLY JSON.\n\nText:\n{text}";

    private AnthropicClient anthropicClient;
    private LlmExtractor extractor;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        RecipeImportDraftParser parser = new RecipeImportDraftParser(objectMapper);
        anthropicClient = mock(AnthropicClient.class);
        PromptBuilder promptBuilder = mock(PromptBuilder.class);
        when(promptBuilder.buildTextPrompt(any(), any()))
                .thenAnswer(inv -> ((String) inv.getArgument(0)).replace("{text}", inv.getArgument(1)));
        extractor = new LlmExtractor(anthropicClient, parser, promptBuilder, "claude-haiku-4-5-20251001", TEST_PROMPT_TEMPLATE);
        when(anthropicClient.isConfigured()).thenReturn(true);
    }

    /**
     * Wraps a JSON content string as an Anthropic API response JsonNode.
     */
    private JsonNode anthropicResponse(String content) throws Exception {
        String escaped = content.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
        String json = "{\"content\": [{\"type\": \"text\", \"text\": \"" + escaped + "\"}]}";
        return objectMapper.readTree(json);
    }

    @Test
    void notConfigured_returnsEmptyWithNoApiCalls() {
        when(anthropicClient.isConfigured()).thenReturn(false);

        var result = extractor.extract("<html/>", "https://example.com");

        assertThat(result).isEmpty();
        verify(anthropicClient, never()).sendMessages(any());
    }

    @Test
    void successfulApiResponse_populatesDraft() throws Exception {
        String json = "{\"name\":\"Cake\",\"servings\":4,\"method\":\"Mix and bake.\",\"ingredients\":[{\"rawText\":\"2 cups flour\",\"quantity\":2,\"unitName\":\"cup\",\"ingredientName\":\"flour\"}]}";
        when(anthropicClient.sendMessages(any())).thenReturn(anthropicResponse(json));

        var result = extractor.extract("<html><body>Cake recipe: 2 cups flour, mix and bake.</body></html>", "https://example.com");

        assertThat(result).isPresent();
        var draft = result.get();
        assertThat(draft.getName()).isEqualTo("Cake");
        assertThat(draft.getServings()).isEqualTo(4);
        assertThat(draft.getMethod()).isEqualTo("Mix and bake.");
        assertThat(draft.getExtractionSource()).isEqualTo("LLM");
        assertThat(draft.getIngredientLines()).hasSize(1);
        assertThat(draft.getIngredientLines().getFirst().getUnitNameHint()).isEqualTo("cup");
        assertThat(draft.getIngredientLines().getFirst().getIngredientNameHint()).isEqualTo("flour");
    }

    @Test
    void apiThrowsAnthropicApiException_returnsEmpty() {
        when(anthropicClient.sendMessages(any())).thenThrow(new AnthropicApiException("Server error: 500"));

        var result = extractor.extract("<html><body>A recipe</body></html>", "https://example.com");

        assertThat(result).isEmpty();
    }

    @Test
    void malformedJsonResponse_returnsEmpty() throws Exception {
        when(anthropicClient.sendMessages(any())).thenReturn(
                objectMapper.readTree("{\"content\": [{\"type\": \"text\", \"text\": \"{not valid json}\"}]}"));

        var result = extractor.extract("<html><body>A recipe</body></html>", "https://example.com");

        assertThat(result).isEmpty();
    }

    @Test
    void responseWrappedInMarkdownFences_stillParsedCorrectly() throws Exception {
        String fencedContent = "```json\n{\"name\":\"Soup\",\"servings\":2,\"method\":\"Boil.\",\"ingredients\":[]}\n```";
        when(anthropicClient.sendMessages(any())).thenReturn(anthropicResponse(fencedContent));

        var result = extractor.extract("<html><body>Soup recipe</body></html>", "https://example.com");

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Soup");
    }

    @Test
    void responseFailsSchemaValidation_returnsEmpty() throws Exception {
        // Valid JSON but missing required "name" and "ingredients" fields
        when(anthropicClient.sendMessages(any())).thenReturn(
                objectMapper.readTree("{\"content\": [{\"type\": \"text\", \"text\": \"{\\\"foo\\\": \\\"bar\\\"}\"}]}"));

        var result = extractor.extract("<html><body>A recipe</body></html>", "https://example.com");

        assertThat(result).isEmpty();
    }

    @Test
    void sendMessages_calledWithCorrectModel() throws Exception {
        String json = "{\"name\":\"Cake\",\"servings\":1,\"method\":\"Bake.\",\"ingredients\":[]}";
        when(anthropicClient.sendMessages(any())).thenReturn(anthropicResponse(json));

        extractor.extract("<html><body>Cake</body></html>", "https://example.com");

        verify(anthropicClient).sendMessages(argThat(body -> body.toString().contains("claude-haiku-4-5-20251001")));
    }
}

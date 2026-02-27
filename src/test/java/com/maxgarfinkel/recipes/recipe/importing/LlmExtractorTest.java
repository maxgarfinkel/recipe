package com.maxgarfinkel.recipes.recipe.importing;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class LlmExtractorTest {

    private static final String ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

    private MockRestServiceServer mockServer;
    private LlmExtractor extractor;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        RestClient.Builder builder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(builder).build();
        extractor = new LlmExtractor(builder, objectMapper, "test-api-key");
    }

    /**
     * Wraps a JSON content string as an Anthropic API response body.
     * The content is JSON-encoded (quotes and newlines escaped) for embedding in the outer JSON.
     */
    private String anthropicResponse(String content) {
        String escaped = content.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
        return "{\"content\": [{\"type\": \"text\", \"text\": \"" + escaped + "\"}]}";
    }

    @Test
    void emptyApiKey_returnsEmptyWithNoHttpCalls() {
        LlmExtractor noKeyExtractor = new LlmExtractor(RestClient.builder(), objectMapper, "");

        var result = noKeyExtractor.extract("<html/>", "https://example.com");

        assertThat(result).isEmpty();
        mockServer.verify(); // no calls recorded
    }

    @Test
    void successfulApiResponse_populatesDraft() {
        String json = "{\"name\":\"Cake\",\"servings\":4,\"method\":\"Mix and bake.\",\"ingredients\":[{\"rawText\":\"2 cups flour\",\"quantity\":2,\"unitName\":\"cup\",\"ingredientName\":\"flour\"}]}";
        mockServer.expect(requestTo(ANTHROPIC_API_URL))
                .andRespond(withSuccess(anthropicResponse(json), MediaType.APPLICATION_JSON));

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
    void apiReturns500_returnsEmpty() {
        mockServer.expect(requestTo(ANTHROPIC_API_URL))
                .andRespond(withServerError());

        var result = extractor.extract("<html><body>A recipe</body></html>", "https://example.com");

        assertThat(result).isEmpty();
    }

    @Test
    void malformedJsonResponse_returnsEmpty() {
        mockServer.expect(requestTo(ANTHROPIC_API_URL))
                .andRespond(withSuccess(
                        "{\"content\": [{\"type\": \"text\", \"text\": \"{not valid json}\"}]}",
                        MediaType.APPLICATION_JSON));

        var result = extractor.extract("<html><body>A recipe</body></html>", "https://example.com");

        assertThat(result).isEmpty();
    }

    @Test
    void responseWrappedInMarkdownFences_stillParsedCorrectly() {
        String fencedContent = "```json\n{\"name\":\"Soup\",\"servings\":2,\"method\":\"Boil.\",\"ingredients\":[]}\n```";
        mockServer.expect(requestTo(ANTHROPIC_API_URL))
                .andRespond(withSuccess(anthropicResponse(fencedContent), MediaType.APPLICATION_JSON));

        var result = extractor.extract("<html><body>Soup recipe</body></html>", "https://example.com");

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Soup");
    }
}

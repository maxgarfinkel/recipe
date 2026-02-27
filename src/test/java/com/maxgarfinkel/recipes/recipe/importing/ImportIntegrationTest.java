package com.maxgarfinkel.recipes.recipe.importing;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.maxgarfinkel.recipes.SpringTestBase;
import com.maxgarfinkel.recipes.ingredient.IngredientDto;
import com.maxgarfinkel.recipes.unit.UnitDto;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.client.HttpClientErrorException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

class ImportIntegrationTest extends SpringTestBase {

    static final String RECIPE_HTML = """
            <html><head>
            <script type="application/ld+json">
            {
              "@type": "Recipe",
              "name": "Simple Pasta",
              "recipeYield": "2",
              "recipeIngredient": ["300 g pasta"],
              "recipeInstructions": [{"@type": "HowToStep", "text": "Boil the pasta."}]
            }
            </script>
            </head><body></body></html>
            """;

    @MockBean
    private UrlFetcher urlFetcher;

    @Test
    void fullRoundTrip_extractsAndResolvesDraft() throws JsonProcessingException {
        when(urlFetcher.fetch("https://test-recipe.example.com")).thenReturn(RECIPE_HTML);

        // Save an ingredient that the draft can resolve
        var unit = new UnitDto(1L, "Gram", "g", null, 1.0);
        var ingredient = new IngredientDto("pasta", null, unit);
        restClient.post()
                .uri("/api/v1/ingredient/")
                .body(objectMapper.writeValueAsString(ingredient))
                .retrieve()
                .body(IngredientDto.class);

        var result = restClient.post()
                .uri("/api/v1/recipe/import/preview")
                .body(objectMapper.writeValueAsString(Map.of("url", "https://test-recipe.example.com")))
                .retrieve()
                .body(RecipeImportDraft.class);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Simple Pasta");
        assertThat(result.getServings()).isEqualTo(2);
        assertThat(result.getMethod()).contains("Boil the pasta.");
        assertThat(result.getExtractionSource()).isEqualTo("SCHEMA_ORG");
        assertThat(result.getIngredientLines()).hasSize(1);

        var line = result.getIngredientLines().getFirst();
        assertThat(line.getRawText()).isEqualTo("300 g pasta");
        assertThat(line.getResolvedIngredient()).isNotNull();
        assertThat(line.getResolvedIngredient().getName()).isEqualTo("pasta");
        assertThat(line.getResolvedUnit()).isNotNull();
        assertThat(line.getResolvedUnit().getAbbreviation()).isEqualTo("g");
    }

    @Test
    void missingUrl_returns400() {
        assertThatThrownBy(() ->
                restClient.post()
                        .uri("/api/v1/recipe/import/preview")
                        .body("{}")
                        .retrieve()
                        .toBodilessEntity()
        ).isInstanceOf(HttpClientErrorException.class)
                .satisfies(e -> assertThat(((HttpClientErrorException) e).getStatusCode())
                        .isEqualTo(HttpStatusCode.valueOf(400)));
    }
}

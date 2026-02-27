package com.maxgarfinkel.recipes.recipe.importing;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SchemaOrgExtractorTest {

    private SchemaOrgExtractor extractor;

    @BeforeEach
    void setUp() {
        extractor = new SchemaOrgExtractor(new ObjectMapper());
    }

    private String htmlWithJsonLd(String jsonLd) {
        return "<html><head><script type=\"application/ld+json\">" + jsonLd + "</script></head><body></body></html>";
    }

    @Test
    void happyPath_extractsAllFields() {
        String html = htmlWithJsonLd("""
                {
                  "@type": "Recipe",
                  "name": "Chocolate Cake",
                  "recipeYield": "8",
                  "recipeIngredient": ["200g flour", "100g sugar"],
                  "recipeInstructions": [
                    {"@type": "HowToStep", "text": "Mix ingredients."},
                    {"@type": "HowToStep", "text": "Bake at 180C."}
                  ]
                }
                """);

        var result = extractor.extract(html, "https://example.com");

        assertThat(result).isPresent();
        var draft = result.get();
        assertThat(draft.getName()).isEqualTo("Chocolate Cake");
        assertThat(draft.getServings()).isEqualTo(8);
        assertThat(draft.getIngredientLines()).hasSize(2);
        assertThat(draft.getIngredientLines().getFirst().getRawText()).isEqualTo("200g flour");
        assertThat(draft.getMethod()).contains("Mix ingredients.");
        assertThat(draft.getMethod()).contains("Bake at 180C.");
        assertThat(draft.getSourceUrl()).isEqualTo("https://example.com");
        assertThat(draft.getExtractionSource()).isEqualTo("SCHEMA_ORG");
    }

    @Test
    void graphWrapper_recipeNestedInsideGraph() {
        String html = htmlWithJsonLd("""
                {
                  "@context": "https://schema.org",
                  "@graph": [
                    {"@type": "WebPage", "name": "A Page"},
                    {
                      "@type": "Recipe",
                      "name": "Pasta",
                      "recipeIngredient": ["300g pasta"],
                      "recipeInstructions": "Boil the pasta."
                    }
                  ]
                }
                """);

        var result = extractor.extract(html, "https://example.com");

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Pasta");
    }

    @Test
    void recipeYieldAsString_parsesLeadingInteger() {
        String html = htmlWithJsonLd("""
                {
                  "@type": "Recipe",
                  "name": "Soup",
                  "recipeYield": "4 servings",
                  "recipeIngredient": [],
                  "recipeInstructions": []
                }
                """);

        var result = extractor.extract(html, "https://example.com");

        assertThat(result).isPresent();
        assertThat(result.get().getServings()).isEqualTo(4);
    }

    @Test
    void plainStringInstructions_parsedCorrectly() {
        String html = htmlWithJsonLd("""
                {
                  "@type": "Recipe",
                  "name": "Simple",
                  "recipeIngredient": [],
                  "recipeInstructions": ["Step 1", "Step 2"]
                }
                """);

        var result = extractor.extract(html, "https://example.com");

        assertThat(result).isPresent();
        assertThat(result.get().getMethod()).contains("Step 1");
        assertThat(result.get().getMethod()).contains("Step 2");
    }

    @Test
    void missingOptionalFields_returnsNullServings() {
        String html = htmlWithJsonLd("""
                {
                  "@type": "Recipe",
                  "name": "Minimal",
                  "recipeIngredient": [],
                  "recipeInstructions": []
                }
                """);

        var result = extractor.extract(html, "https://example.com");

        assertThat(result).isPresent();
        assertThat(result.get().getServings()).isNull();
    }

    @Test
    void invalidJsonLd_returnsEmpty() {
        String html = htmlWithJsonLd("{not valid json}");

        var result = extractor.extract(html, "https://example.com");

        assertThat(result).isEmpty();
    }

    @Test
    void noJsonLdPresent_returnsEmpty() {
        String html = "<html><body><p>No structured data here</p></body></html>";

        var result = extractor.extract(html, "https://example.com");

        assertThat(result).isEmpty();
    }

    @Test
    void multipleScriptTags_firstNonRecipeThenRecipe() {
        String html = "<html><head>" +
                "<script type=\"application/ld+json\">{\"@type\": \"WebSite\", \"name\": \"MySite\"}</script>" +
                "<script type=\"application/ld+json\">{\"@type\": \"Recipe\", \"name\": \"Cookies\", \"recipeIngredient\": [], \"recipeInstructions\": []}</script>" +
                "</head></html>";

        var result = extractor.extract(html, "https://example.com");

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Cookies");
    }
}

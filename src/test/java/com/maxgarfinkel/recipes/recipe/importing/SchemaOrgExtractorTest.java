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
    void ingredientLines_parsedHintsPopulated() {
        String html = htmlWithJsonLd("""
                {
                  "@type": "Recipe",
                  "name": "Cake",
                  "recipeIngredient": ["200g plain flour", "2 cups sugar", "salt to taste"],
                  "recipeInstructions": []
                }
                """);

        var result = extractor.extract(html, "https://example.com");

        assertThat(result).isPresent();
        var lines = result.get().getIngredientLines();

        // "200g plain flour" — glued quantity+unit
        assertThat(lines.getFirst().getQuantity()).isEqualTo(200.0);
        assertThat(lines.getFirst().getUnitNameHint()).isEqualTo("g");
        assertThat(lines.getFirst().getIngredientNameHint()).isEqualTo("plain flour");

        // "2 cups sugar" — space-separated, plural canonicalised
        assertThat(lines.get(1).getQuantity()).isEqualTo(2.0);
        assertThat(lines.get(1).getUnitNameHint()).isEqualTo("cup");
        assertThat(lines.get(1).getIngredientNameHint()).isEqualTo("sugar");

        // "salt to taste" — no quantity, entire text becomes name hint
        assertThat(lines.get(2).getQuantity()).isNull();
        assertThat(lines.get(2).getUnitNameHint()).isNull();
        assertThat(lines.get(2).getIngredientNameHint()).isEqualTo("salt to taste");
    }

    @Test
    void ingredientLine_fractionQuantity_parsedCorrectly() {
        String html = htmlWithJsonLd("""
                {
                  "@type": "Recipe",
                  "name": "Soup",
                  "recipeIngredient": ["1/2 tsp black pepper"],
                  "recipeInstructions": []
                }
                """);

        var result = extractor.extract(html, "https://example.com");

        assertThat(result).isPresent();
        var line = result.get().getIngredientLines().getFirst();
        assertThat(line.getQuantity()).isCloseTo(0.5, org.assertj.core.data.Offset.offset(0.001));
        assertThat(line.getUnitNameHint()).isEqualTo("tsp");
        assertThat(line.getIngredientNameHint()).isEqualTo("black pepper");
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

package com.maxgarfinkel.recipes.recipe.importing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Component
@Order(1)
@RequiredArgsConstructor
public class SchemaOrgExtractor implements RecipeExtractor {

    private final ObjectMapper objectMapper;

    @Override
    public Optional<RecipeImportDraft> extract(String html, String sourceUrl) {
        try {
            Document doc = Jsoup.parse(html);
            Elements scripts = doc.select("script[type=application/ld+json]");

            for (var script : scripts) {
                JsonNode root = objectMapper.readTree(script.data());
                Optional<RecipeImportDraft> draft = findRecipeNode(root, sourceUrl);
                if (draft.isPresent()) {
                    return draft;
                }
            }
            return Optional.empty();
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private Optional<RecipeImportDraft> findRecipeNode(JsonNode node, String sourceUrl) {
        if (node.isArray()) {
            for (JsonNode item : node) {
                Optional<RecipeImportDraft> result = findRecipeNode(item, sourceUrl);
                if (result.isPresent()) return result;
            }
            return Optional.empty();
        }

        String type = node.path("@type").asText("");
        if ("Recipe".equals(type)) {
            return Optional.of(parseRecipe(node, sourceUrl));
        }

        // Handle @graph wrapper
        JsonNode graph = node.path("@graph");
        if (!graph.isMissingNode() && graph.isArray()) {
            for (JsonNode item : graph) {
                String itemType = item.path("@type").asText("");
                if ("Recipe".equals(itemType)) {
                    return Optional.of(parseRecipe(item, sourceUrl));
                }
            }
        }

        return Optional.empty();
    }

    private RecipeImportDraft parseRecipe(JsonNode node, String sourceUrl) {
        RecipeImportDraft draft = new RecipeImportDraft();
        draft.setSourceUrl(sourceUrl);
        draft.setExtractionSource("SCHEMA_ORG");

        draft.setName(node.path("name").asText(null));
        draft.setMethod(parseInstructions(node.path("recipeInstructions")));
        draft.setServings(parseServings(node.path("recipeYield")));

        List<RecipeImportDraft.ImportedIngredientLine> lines = new ArrayList<>();
        JsonNode ingredients = node.path("recipeIngredient");
        if (ingredients.isArray()) {
            for (JsonNode ingredient : ingredients) {
                RecipeImportDraft.ImportedIngredientLine line = new RecipeImportDraft.ImportedIngredientLine();
                line.setRawText(ingredient.asText());
                lines.add(line);
            }
        }
        draft.setIngredientLines(lines);

        return draft;
    }

    private Integer parseServings(JsonNode yieldNode) {
        if (yieldNode.isMissingNode()) return null;
        String text = yieldNode.isArray()
                ? yieldNode.path(0).asText("")
                : yieldNode.asText("");
        if (text.isEmpty()) return null;
        try {
            // Parse leading integer e.g. "4 servings" → 4
            String[] parts = text.trim().split("\\s+", 2);
            return Integer.parseInt(parts[0]);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String parseInstructions(JsonNode instructionsNode) {
        if (instructionsNode.isMissingNode()) return null;
        if (instructionsNode.isArray()) {
            return StreamSupport.stream(instructionsNode.spliterator(), false)
                    .map(item -> {
                        if (item.isTextual()) return item.asText();
                        return item.path("text").asText(item.asText());
                    })
                    .collect(Collectors.joining("\n\n"));
        }
        return instructionsNode.asText(null);
    }
}

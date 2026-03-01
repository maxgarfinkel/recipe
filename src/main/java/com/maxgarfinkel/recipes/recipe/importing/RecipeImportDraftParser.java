package com.maxgarfinkel.recipes.recipe.importing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class RecipeImportDraftParser {

    private final ObjectMapper objectMapper;

    public RecipeImportDraft parse(String json, String sourceUrl, String extractionSource) throws Exception {
        String cleaned = stripMarkdownFences(json);
        JsonNode root = objectMapper.readTree(cleaned);

        RecipeImportDraft draft = new RecipeImportDraft();
        draft.setSourceUrl(sourceUrl);
        draft.setExtractionSource(extractionSource);
        draft.setName(root.path("name").asText(null));

        JsonNode servingsNode = root.path("servings");
        if (!servingsNode.isMissingNode() && !servingsNode.isNull()) {
            draft.setServings(servingsNode.asInt());
        }

        draft.setMethod(root.path("method").asText(null));

        List<RecipeImportDraft.ImportedIngredientLine> lines = new ArrayList<>();
        JsonNode ingredients = root.path("ingredients");
        if (ingredients.isArray()) {
            for (JsonNode item : ingredients) {
                RecipeImportDraft.ImportedIngredientLine line = new RecipeImportDraft.ImportedIngredientLine();
                line.setRawText(item.path("rawText").asText(null));
                JsonNode quantityNode = item.path("quantity");
                if (!quantityNode.isMissingNode() && !quantityNode.isNull()) {
                    line.setQuantity(quantityNode.asDouble());
                }
                line.setUnitNameHint(item.path("unitName").asText(null));
                line.setIngredientNameHint(item.path("ingredientName").asText(null));
                lines.add(line);
            }
        }
        draft.setIngredientLines(lines);

        return draft;
    }

    public String stripMarkdownFences(String text) {
        String trimmed = text.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            if (firstNewline != -1) {
                trimmed = trimmed.substring(firstNewline + 1);
            }
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.lastIndexOf("```")).trim();
            }
        }
        return trimmed;
    }
}

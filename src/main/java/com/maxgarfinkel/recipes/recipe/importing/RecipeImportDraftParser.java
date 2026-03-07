package com.maxgarfinkel.recipes.recipe.importing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@Slf4j
public class RecipeImportDraftParser {

    private final ObjectMapper objectMapper;
    private final JsonSchema schema;

    public RecipeImportDraftParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        try (InputStream stream = getClass().getResourceAsStream("/schema/recipe-extraction-schema.json")) {
            this.schema = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V7).getSchema(stream);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load recipe extraction JSON schema", e);
        }
    }

    public RecipeImportDraft parse(String json, String sourceUrl, String extractionSource) throws Exception {
        String cleaned = stripMarkdownFences(json);
        JsonNode root = objectMapper.readTree(cleaned);

        Set<ValidationMessage> errors = schema.validate(root);
        if (!errors.isEmpty()) {
            String details = errors.stream()
                    .map(ValidationMessage::getMessage)
                    .collect(Collectors.joining(", "));
            log.warn("Recipe extraction response failed schema validation: {}", details);
            throw new RecipeSchemaValidationException("Schema validation failed: " + details);
        }

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

package com.maxgarfinkel.recipes.recipe.importing;

import com.maxgarfinkel.recipes.ingredient.IngredientDto;
import com.maxgarfinkel.recipes.ingredient.IngredientService;
import com.maxgarfinkel.recipes.unit.UnitDto;
import com.maxgarfinkel.recipes.unit.UnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PromptBuilder {

    private final UnitService unitService;
    private final IngredientService ingredientService;

    /** For the LLM flow: substitutes {context} and {text}. */
    public String buildTextPrompt(String template, String text) {
        return template
                .replace("{context}", buildContext())
                .replace("{text}", text);
    }

    /** For the vision flow: substitutes {context} only. */
    public String buildImagePrompt(String template) {
        return template.replace("{context}", buildContext());
    }

    private String buildContext() {
        StringBuilder context = new StringBuilder();

        String units = buildUnitsLine();
        if (!units.isEmpty()) {
            context.append("\nKnown units in this application — use one of these exact strings for \"unitName\" where the unit matches:\n");
            context.append(units).append("\n");
        }

        String ingredients = buildIngredientsLine();
        if (!ingredients.isEmpty()) {
            context.append("\nKnown ingredients already in this application — use one of these exact strings for \"ingredientName\" where the ingredient matches (do not invent alternative spellings):\n");
            context.append(ingredients).append("\n");
        }

        return context.toString();
    }

    private String buildUnitsLine() {
        List<UnitDto> units = unitService.getUnitsAsDtos();
        return units.stream()
                .map(u -> (u.getAbbreviation() != null && !u.getAbbreviation().isBlank())
                        ? u.getAbbreviation() : u.getName())
                .collect(Collectors.joining(", "));
    }

    private String buildIngredientsLine() {
        List<IngredientDto> ingredients = ingredientService.getAllAsDto();
        if (ingredients.isEmpty()) return "";
        return ingredients.stream()
                .map(IngredientDto::getName)
                .collect(Collectors.joining(", "));
    }
}

package com.maxgarfinkel.recipes.recipe.importing;

import com.maxgarfinkel.recipes.ingredient.IngredientAliasService;
import com.maxgarfinkel.recipes.ingredient.IngredientDto;
import com.maxgarfinkel.recipes.ingredient.IngredientService;
import com.maxgarfinkel.recipes.unit.UnitDto;
import com.maxgarfinkel.recipes.unit.UnitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class ImportServiceTest {

    private CompositeRecipeExtractor recipeExtractor;
    private ImportService importService;

    private final UnitDto gramUnit = new UnitDto(1L, "Gram", "g", null, 1.0);
    private final UnitDto cupUnit = new UnitDto(2L, "Cup", "cup", null, 1.0);
    private final IngredientDto flourIngredient = new IngredientDto("flour", 1L, gramUnit);

    @BeforeEach
    void setUp() {
        UrlFetcher urlFetcher = mock(UrlFetcher.class);
        recipeExtractor = mock(CompositeRecipeExtractor.class);
        UnitService unitService = mock(UnitService.class);
        IngredientService ingredientService = mock(IngredientService.class);
        IngredientAliasService ingredientAliasService = mock(IngredientAliasService.class);
        importService = new ImportService(urlFetcher, recipeExtractor, unitService, ingredientService, ingredientAliasService);

        when(urlFetcher.fetch(anyString())).thenReturn("<html/>");
        when(unitService.getUnitsAsDtos()).thenReturn(List.of(gramUnit, cupUnit));
        when(ingredientService.getAllAsDto()).thenReturn(List.of(flourIngredient));
        when(ingredientAliasService.findAll()).thenReturn(List.of());
    }

    private RecipeImportDraft draftWithLine(String rawText, Double quantity, String unitHint, String ingredientHint) {
        RecipeImportDraft draft = new RecipeImportDraft();
        draft.setName("Test");
        List<RecipeImportDraft.ImportedIngredientLine> lines = new ArrayList<>();
        RecipeImportDraft.ImportedIngredientLine line = new RecipeImportDraft.ImportedIngredientLine();
        line.setRawText(rawText);
        line.setQuantity(quantity);
        line.setUnitNameHint(unitHint);
        line.setIngredientNameHint(ingredientHint);
        lines.add(line);
        draft.setIngredientLines(lines);
        return draft;
    }

    @Test
    void throwsWhenExtractorReturnsEmpty() {
        when(recipeExtractor.extract(anyString(), anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> importService.importFromUrl("https://example.com"))
                .isInstanceOf(RecipeImportException.class);
    }

    @Test
    void resolvesUnitByName() {
        var draft = draftWithLine("100 Gram flour", 100.0, "Gram", "flour");
        when(recipeExtractor.extract(anyString(), anyString())).thenReturn(Optional.of(draft));

        var result = importService.importFromUrl("https://example.com");

        assertThat(result.getIngredientLines().getFirst().getResolvedUnit()).isEqualTo(gramUnit);
    }

    @Test
    void resolvesUnitByAbbreviation() {
        var draft = draftWithLine("100 g flour", 100.0, "g", "flour");
        when(recipeExtractor.extract(anyString(), anyString())).thenReturn(Optional.of(draft));

        var result = importService.importFromUrl("https://example.com");

        assertThat(result.getIngredientLines().getFirst().getResolvedUnit()).isEqualTo(gramUnit);
    }

    @Test
    void resolvesUnitCaseInsensitive() {
        var draft = draftWithLine("1 cup flour", 1.0, "CUP", "flour");
        when(recipeExtractor.extract(anyString(), anyString())).thenReturn(Optional.of(draft));

        var result = importService.importFromUrl("https://example.com");

        assertThat(result.getIngredientLines().getFirst().getResolvedUnit()).isEqualTo(cupUnit);
    }

    @Test
    void resolvesIngredientByName() {
        var draft = draftWithLine("100g flour", 100.0, "g", "flour");
        when(recipeExtractor.extract(anyString(), anyString())).thenReturn(Optional.of(draft));

        var result = importService.importFromUrl("https://example.com");

        assertThat(result.getIngredientLines().getFirst().getResolvedIngredient()).isEqualTo(flourIngredient);
    }

    @Test
    void resolvesIngredientCaseInsensitive() {
        var draft = draftWithLine("100g FLOUR", 100.0, "g", "FLOUR");
        when(recipeExtractor.extract(anyString(), anyString())).thenReturn(Optional.of(draft));

        var result = importService.importFromUrl("https://example.com");

        assertThat(result.getIngredientLines().getFirst().getResolvedIngredient()).isEqualTo(flourIngredient);
    }

    @Test
    void noMatchForUnit_leavesLineUnresolved() {
        var draft = draftWithLine("100 tablespoon flour", 100.0, "tablespoon", "flour");
        when(recipeExtractor.extract(anyString(), anyString())).thenReturn(Optional.of(draft));

        var result = importService.importFromUrl("https://example.com");
        var line = result.getIngredientLines().getFirst();

        assertThat(line.getResolvedUnit()).isNull();
        assertThat(line.getResolvedIngredient()).isNull();
    }

    @Test
    void noMatchForIngredient_leavesLineUnresolved() {
        var draft = draftWithLine("100g butter", 100.0, "g", "butter");
        when(recipeExtractor.extract(anyString(), anyString())).thenReturn(Optional.of(draft));

        var result = importService.importFromUrl("https://example.com");
        var line = result.getIngredientLines().getFirst();

        assertThat(line.getResolvedIngredient()).isNull();
        assertThat(line.getResolvedUnit()).isNull();
    }

    @Test
    void noQuantity_leavesLineUnresolved() {
        var draft = draftWithLine("flour", null, "g", "flour");
        when(recipeExtractor.extract(anyString(), anyString())).thenReturn(Optional.of(draft));

        var result = importService.importFromUrl("https://example.com");
        var line = result.getIngredientLines().getFirst();

        assertThat(line.getResolvedIngredient()).isNull();
        assertThat(line.getResolvedUnit()).isNull();
    }

}

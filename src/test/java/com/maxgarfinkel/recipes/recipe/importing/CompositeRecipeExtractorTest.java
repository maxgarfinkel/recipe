package com.maxgarfinkel.recipes.recipe.importing;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class CompositeRecipeExtractorTest {

    private final RecipeExtractor first = mock(RecipeExtractor.class);
    private final RecipeExtractor second = mock(RecipeExtractor.class);
    private final CompositeRecipeExtractor composite = new CompositeRecipeExtractor(List.of(first, second));

    @Test
    void returnsFirstSuccessfulResult() {
        var draft = new RecipeImportDraft();
        draft.setName("Test Recipe");
        when(first.extract(anyString(), anyString())).thenReturn(Optional.of(draft));

        var result = composite.extract("<html/>", "https://example.com");

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Test Recipe");
    }

    @Test
    void shortCircuitsOnFirstSuccess() {
        var draft = new RecipeImportDraft();
        when(first.extract(anyString(), anyString())).thenReturn(Optional.of(draft));

        composite.extract("<html/>", "https://example.com");

        verify(second, never()).extract(anyString(), anyString());
    }

    @Test
    void fallsBackToSecondWhenFirstReturnsEmpty() {
        var draft = new RecipeImportDraft();
        draft.setName("LLM Recipe");
        when(first.extract(anyString(), anyString())).thenReturn(Optional.empty());
        when(second.extract(anyString(), anyString())).thenReturn(Optional.of(draft));

        var result = composite.extract("<html/>", "https://example.com");

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("LLM Recipe");
    }

    @Test
    void returnsEmptyWhenAllExtractorsReturnEmpty() {
        when(first.extract(anyString(), anyString())).thenReturn(Optional.empty());
        when(second.extract(anyString(), anyString())).thenReturn(Optional.empty());

        var result = composite.extract("<html/>", "https://example.com");

        assertThat(result).isEmpty();
    }
}

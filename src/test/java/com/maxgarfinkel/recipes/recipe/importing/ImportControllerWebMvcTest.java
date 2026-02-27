package com.maxgarfinkel.recipes.recipe.importing;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ImportController.class)
class ImportControllerWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ImportService importService;

    @Test
    void returns200WithDraftOnSuccess() throws Exception {
        RecipeImportDraft draft = new RecipeImportDraft();
        draft.setName("Pasta");
        draft.setServings(4);
        draft.setIngredientLines(List.of());
        given(importService.importFromUrl(anyString())).willReturn(draft);

        mockMvc.perform(post("/api/v1/recipe/import/preview")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("url", "https://example.com"))))
                .andExpectAll(
                        status().isOk(),
                        jsonPath("$.name").value("Pasta"),
                        jsonPath("$.servings").value(4)
                );
    }

    @Test
    void returns400WhenUrlIsMissing() throws Exception {
        mockMvc.perform(post("/api/v1/recipe/import/preview")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void returns400WhenUrlIsBlank() throws Exception {
        mockMvc.perform(post("/api/v1/recipe/import/preview")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("url", "   "))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void returns422WhenExtractionFails() throws Exception {
        given(importService.importFromUrl(anyString()))
                .willThrow(new RecipeImportException("Could not extract recipe"));

        mockMvc.perform(post("/api/v1/recipe/import/preview")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("url", "https://example.com"))))
                .andExpectAll(
                        status().isUnprocessableEntity(),
                        jsonPath("$.detail").value("Could not extract recipe")
                );
    }
}

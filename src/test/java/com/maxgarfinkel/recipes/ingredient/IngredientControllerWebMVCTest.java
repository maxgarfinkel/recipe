package com.maxgarfinkel.recipes.ingredient;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.maxgarfinkel.recipes.ItemNotFound;
import com.maxgarfinkel.recipes.PageResponse;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(IngredientController.class)
class IngredientControllerWebMVCTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private IngredientService ingredientService;

    @MockBean
    private IngredientAliasService ingredientAliasService;

    @Test
    void shouldGetIngredients() throws Exception {

        var ingredient = new IngredientDto("basil", 1L, null);

        given(ingredientService.getAllAsDto())
                .willReturn(List.of(ingredient));

        mockMvc.perform(get("/api/v1/ingredient/"))
            .andExpectAll(
                status().isOk(),
                content().contentType(APPLICATION_JSON),
                jsonPath("$[0].name", Matchers.equalToIgnoringCase("basil")),
                jsonPath("$[0].id", Matchers.equalTo(1))
            );
    }

    @Test
    void shouldReturnPagedIngredients() throws Exception {

        var ingredient = new IngredientDto("basil", 1L, null);
        var page = new PageResponse<>(List.of(ingredient), 0, 20, 1L, 1);

        given(ingredientService.getPageAsDto(0, 20)).willReturn(page);

        mockMvc.perform(get("/api/v1/ingredient/page"))
                .andExpectAll(
                        status().isOk(),
                        content().contentType(APPLICATION_JSON),
                        jsonPath("$.content[0].name", Matchers.equalToIgnoringCase("basil")),
                        jsonPath("$.totalElements", Matchers.equalTo(1)),
                        jsonPath("$.totalPages", Matchers.equalTo(1))
                );
    }

    @Test
    void shouldSaveIngredient() throws Exception {

        var ingredient = new IngredientDto("basil", 1L, null);

        given(ingredientService.create("basil", null))
                .willReturn(ingredient);

        mockMvc.perform(post("/api/v1/ingredient/")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ingredient)))
                .andExpectAll(
                        status().isOk(),
                        content().contentType(APPLICATION_JSON),
                        jsonPath("$.name", Matchers.equalToIgnoringCase("basil")),
                        jsonPath("$.id", Matchers.equalTo(1))
                );
    }

    @Test
    void shouldUpdateIngredient() throws Exception {

        var ingredient = new IngredientDto("oregano", 1L, null);

        given(ingredientService.update(1L, "oregano", null))
                .willReturn(ingredient);

        mockMvc.perform(put("/api/v1/ingredient/1")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ingredient)))
                .andExpectAll(
                        status().isOk(),
                        content().contentType(APPLICATION_JSON),
                        jsonPath("$.name", Matchers.equalToIgnoringCase("oregano")),
                        jsonPath("$.id", Matchers.equalTo(1))
                );
    }

    @Test
    void shouldNotUpdateIngredientWhenItDoesntExist() throws Exception {
        var ingredient = new IngredientDto("oregano", 1L, null);

        given(ingredientService.update(1L, "oregano", null))
                .willThrow(new ItemNotFound(1, "Ingredient",
                        "Unable to update Ingredient with id: 1 because it does not exist."));

        mockMvc.perform(put("/api/v1/ingredient/1")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ingredient)))
                .andExpectAll(
                        status().isNotFound(),
                        jsonPath("$.title", Matchers.equalTo("Not Found")),
                        jsonPath("$.detail", Matchers.equalTo("Ingredient with id: 1 not found"))
                );
    }

    @Test
    void shouldReturnAliasesForIngredient() throws Exception {
        var alias = new IngredientAliasResponseDto(1L, "basilico", 1L, 1L);

        given(ingredientAliasService.findByIngredientId(1L))
                .willReturn(List.of(alias));

        mockMvc.perform(get("/api/v1/ingredient/1/alias"))
                .andExpectAll(
                        status().isOk(),
                        content().contentType(APPLICATION_JSON),
                        jsonPath("$[0].aliasText", Matchers.equalTo("basilico")),
                        jsonPath("$[0].id", Matchers.equalTo(1))
                );
    }

    @Test
    void shouldReturn404ForAliasesWhenIngredientNotFound() throws Exception {
        given(ingredientAliasService.findByIngredientId(99L))
                .willThrow(new ItemNotFound(99, "Ingredient",
                        "Unable to find ingredient with id 99"));

        mockMvc.perform(get("/api/v1/ingredient/99/alias"))
                .andExpectAll(
                        status().isNotFound(),
                        jsonPath("$.detail", Matchers.equalTo("Ingredient with id: 99 not found"))
                );
    }
}

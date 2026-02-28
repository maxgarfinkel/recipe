package com.maxgarfinkel.recipes.ingredient;

import com.maxgarfinkel.recipes.ItemNotFound;
import com.maxgarfinkel.recipes.SecurityConfig;
import com.maxgarfinkel.recipes.user.AppUserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.hamcrest.Matchers;

@WebMvcTest(IngredientAliasController.class)
@Import(SecurityConfig.class)
@WithMockUser
class IngredientAliasControllerWebMVCTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private IngredientAliasService ingredientAliasService;

    @MockBean
    private JwtDecoder jwtDecoder;

    @MockBean
    private AppUserService appUserService;

    @Test
    void shouldDeleteAlias() throws Exception {
        mockMvc.perform(delete("/api/v1/ingredient-alias/1"))
                .andExpect(status().isNoContent());

        verify(ingredientAliasService).delete(1L);
    }

    @Test
    void shouldReturn404WhenDeletingNonExistentAlias() throws Exception {
        doThrow(new ItemNotFound(99, "IngredientAlias",
                "Unable to find ingredient alias with id 99"))
                .when(ingredientAliasService).delete(99L);

        mockMvc.perform(delete("/api/v1/ingredient-alias/99"))
                .andExpectAll(
                        status().isNotFound(),
                        jsonPath("$.detail", Matchers.equalTo("IngredientAlias with id: 99 not found"))
                );
    }
}

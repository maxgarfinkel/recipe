package com.maxgarfinkel.recipes.ingredient;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.maxgarfinkel.recipes.PageResponse;
import com.maxgarfinkel.recipes.SpringTestBase;
import com.maxgarfinkel.recipes.unit.UnitDto;
import org.junit.jupiter.api.Test;
import org.springframework.core.ParameterizedTypeReference;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

public class IngredientIntegrationTest extends SpringTestBase {

    @Test
    public void canCrudIngredient() throws JsonProcessingException {

        //Create
        var unit = new UnitDto(1L, "gram", "g", null, 1.0);
        var ingredientDto = new IngredientDto("basil", null, unit);
        String createJson = objectMapper.writeValueAsString(ingredientDto);
        ingredientDto = restClient.post()
                .uri("/api/v1/ingredient/")
                .body(createJson)
                .retrieve()
                .body(IngredientDto.class);
        assertThat(ingredientDto).isNotNull();
        assertThat(ingredientDto.getName()).isEqualTo("basil");
        assertThat(ingredientDto.getDefaultUnit().getName()).isEqualTo("Gram");

        //Retrieve
        List<IngredientDto> allIngredients = restClient.get()
                .uri("/api/v1/ingredient/")
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });

        assertThat(allIngredients).hasSize(1);

        //Update
        String updateJson = objectMapper.writeValueAsString(
                new IngredientDto("oregano", ingredientDto.getId(), unit));
        var updateIngredient = restClient.put()
                .uri("/api/v1/ingredient/"+ingredientDto.getId())
                .body(updateJson)
                .retrieve()
                .body(IngredientDto.class);

        assertThat(updateIngredient).isNotNull();
        assertThat(updateIngredient.getName()).isEqualTo("oregano");
        assertThat(updateIngredient.getId()).isEqualTo(ingredientDto.getId());

        //Delete
        var response = restClient.delete()
                .uri("/api/v1/ingredient/"+ingredientDto.getId())
                .retrieve()
                .toBodilessEntity();
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    public void canUpdateIngredientDefaultUnit() throws JsonProcessingException {
        // Create ingredient without a unit
        var ingredientDto = new IngredientDto("thyme", null, null);
        String createJson = objectMapper.writeValueAsString(ingredientDto);
        ingredientDto = restClient.post()
                .uri("/api/v1/ingredient/")
                .body(createJson)
                .retrieve()
                .body(IngredientDto.class);
        assertThat(ingredientDto).isNotNull();
        assertThat(ingredientDto.getDefaultUnit()).isNull();

        // Update with a unit (gram = id 1)
        var unit = new UnitDto(1L, "Gram", "g", null, 1.0);
        String updateJson = objectMapper.writeValueAsString(
                new IngredientDto("thyme", ingredientDto.getId(), unit));
        var updated = restClient.put()
                .uri("/api/v1/ingredient/" + ingredientDto.getId())
                .body(updateJson)
                .retrieve()
                .body(IngredientDto.class);

        assertThat(updated).isNotNull();
        assertThat(updated.getName()).isEqualTo("thyme");
        assertThat(updated.getDefaultUnit()).isNotNull();
        assertThat(updated.getDefaultUnit().getName()).isEqualTo("Gram");
    }

    @Test
    public void canPaginateIngredients() throws JsonProcessingException {
        // Create 3 ingredients
        for (String name : List.of("basil", "oregano", "thyme")) {
            String json = objectMapper.writeValueAsString(new IngredientDto(name, null, null));
            restClient.post().uri("/api/v1/ingredient/").body(json).retrieve().toBodilessEntity();
        }

        // Get page 0, size 2
        PageResponse<IngredientDto> page = restClient.get()
                .uri("/api/v1/ingredient/page?page=0&size=2")
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});

        assertThat(page).isNotNull();
        assertThat(page.content()).hasSize(2);
        assertThat(page.totalElements()).isEqualTo(3);
        assertThat(page.totalPages()).isEqualTo(2);
        // Results are ordered alphabetically
        assertThat(page.content().get(0).getName()).isEqualTo("basil");
        assertThat(page.content().get(1).getName()).isEqualTo("oregano");
    }

    @Test
    public void canListAndDeleteAliases() throws JsonProcessingException {
        // Create ingredient and alias
        var unit = new UnitDto(1L, "Gram", "g", null, 1.0);
        String ingredientJson = objectMapper.writeValueAsString(new IngredientDto("basil", null, unit));
        IngredientDto ingredient = restClient.post()
                .uri("/api/v1/ingredient/")
                .body(ingredientJson)
                .retrieve()
                .body(IngredientDto.class);
        assertThat(ingredient).isNotNull();

        // Save alias
        var aliasDto = new IngredientAliasDto("basilico", ingredient.getId(), 1L);
        String aliasJson = objectMapper.writeValueAsString(aliasDto);
        restClient.post().uri("/api/v1/ingredient-alias/").body(aliasJson).retrieve().toBodilessEntity();

        // GET aliases for ingredient
        List<IngredientAliasResponseDto> aliases = restClient.get()
                .uri("/api/v1/ingredient/" + ingredient.getId() + "/alias")
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});

        assertThat(aliases).hasSize(1);
        assertThat(aliases.getFirst().getAliasText()).isEqualTo("basilico");
        Long aliasId = aliases.getFirst().getId();

        // DELETE alias
        restClient.delete()
                .uri("/api/v1/ingredient-alias/" + aliasId)
                .retrieve()
                .toBodilessEntity();

        // GET aliases again — should be empty
        List<IngredientAliasResponseDto> afterDelete = restClient.get()
                .uri("/api/v1/ingredient/" + ingredient.getId() + "/alias")
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});

        assertThat(afterDelete).isEmpty();
    }
}

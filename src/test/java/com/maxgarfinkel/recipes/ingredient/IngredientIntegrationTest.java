package com.maxgarfinkel.recipes.ingredient;

import com.fasterxml.jackson.core.JsonProcessingException;
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
}

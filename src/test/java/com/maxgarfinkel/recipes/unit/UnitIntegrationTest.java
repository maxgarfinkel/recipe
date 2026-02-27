package com.maxgarfinkel.recipes.unit;

import com.maxgarfinkel.recipes.SpringTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.core.ParameterizedTypeReference;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class UnitIntegrationTest extends SpringTestBase {

    @Test
    public void canGetUnits() {
        //Retrieve
        List<UnitDto> allUnits = restClient.get()
                .uri("/api/v1/unit/")
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });

        assertThat(allUnits).hasSize(23);
        UnitDto gram = new UnitDto(1L, "Gram", "g", null, 1.0);
        UnitDto kilogram = new UnitDto(2L, "Kilogram", "kg", gram, 1000.0);
        assertThat(allUnits).contains(gram, kilogram);
    }

}
package com.maxgarfinkel.recipes;

import com.maxgarfinkel.recipes.ingredient.IngredientController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class RecipesApplicationTests {

    @Autowired
    private IngredientController ingredientController;

    @Test
    void contextLoads() {
        assertThat(ingredientController).isNotNull();
    }

}

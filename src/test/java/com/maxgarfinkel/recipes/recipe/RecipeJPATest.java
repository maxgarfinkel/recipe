package com.maxgarfinkel.recipes.recipe;

import com.maxgarfinkel.recipes.ingredient.Ingredient;
import com.maxgarfinkel.recipes.ingredient.IngredientRepository;
import com.maxgarfinkel.recipes.unit.Unit;
import com.maxgarfinkel.recipes.unit.UnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import static java.util.Collections.emptyList;
import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest()
@AutoConfigureTestDatabase(replace= AutoConfigureTestDatabase.Replace.NONE)
class RecipeJPATest {

    @Autowired
    RecipeRepository recipeRepository;

    @Autowired
    IngredientRepository ingredientRepository;

    @Autowired
    UnitRepository unitRepository;

    @Autowired
    protected JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("TRUNCATE TABLE ingredient_alias, ingredient, ingredient_quantity, recipe");
        jdbcTemplate.execute("ALTER SEQUENCE ingredient_alias_id_seq RESTART WITH 1");
        jdbcTemplate.execute("ALTER SEQUENCE ingredient_seq RESTART WITH 1");
        jdbcTemplate.execute("ALTER SEQUENCE ingredient_quantity_seq RESTART WITH 1");
        jdbcTemplate.execute("ALTER SEQUENCE recipe_seq RESTART WITH 1");
    }

    @Test
    void canInsertRecipe() {
        insertRecipe();
        assertThat(recipeRepository.findAll()).hasSize(1);
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void shouldRemoveOrphanedIngredientQuantity() {
        insertRecipe();
        var recipe = recipeRepository.findAll().getFirst();
        recipe.setIngredientQuantities(emptyList());
        recipeRepository.save(recipe);
        assertThat(recipeRepository.findAll()).hasSize(1);
        assertThat(
                jdbcTemplate.queryForList("select * from ingredient_quantity")
        ).hasSize(0);
    }

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void shouldCascadeDeleteOfRecipeToIngredientQuantity() {
        var recipe = insertRecipe();
        recipeRepository.delete(recipe);
        assertThat(
                jdbcTemplate.queryForList("select * from ingredient_quantity")
        ).hasSize(0);
    }

    private Recipe insertRecipe() {
        Ingredient ingredient = new Ingredient();
        ingredient.setName("basil");
        ingredient = ingredientRepository.save(ingredient);

        Unit gramUnit = unitRepository.findById(1L).orElseThrow();

        Recipe recipe = new Recipe();
        recipe.setName("a recipe");

        recipe.setIngredientQuantity(ingredient, gramUnit, 1d);

        return recipeRepository.save(recipe);
    }

}
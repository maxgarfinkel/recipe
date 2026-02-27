package com.maxgarfinkel.recipes.recipe.importing;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class IngredientLineParserTest {

    // -------------------------------------------------------------------------
    // Null / blank
    // -------------------------------------------------------------------------

    @Test
    void nullInput_returnsAllNulls() {
        var result = IngredientLineParser.parse(null);
        assertThat(result.quantity()).isNull();
        assertThat(result.unitNameHint()).isNull();
        assertThat(result.ingredientNameHint()).isNull();
    }

    @Test
    void blankInput_returnsAllNulls() {
        var result = IngredientLineParser.parse("   ");
        assertThat(result.quantity()).isNull();
        assertThat(result.unitNameHint()).isNull();
        assertThat(result.ingredientNameHint()).isNull();
    }

    // -------------------------------------------------------------------------
    // No quantity – entire text becomes the name hint
    // -------------------------------------------------------------------------

    @Test
    void noQuantity_entireTextBecomesNameHint() {
        var result = IngredientLineParser.parse("salt and pepper to taste");
        assertThat(result.quantity()).isNull();
        assertThat(result.unitNameHint()).isNull();
        assertThat(result.ingredientNameHint()).isEqualTo("salt and pepper to taste");
    }

    @Test
    void singleWord_noQuantity_becomesNameHint() {
        var result = IngredientLineParser.parse("flour");
        assertThat(result.quantity()).isNull();
        assertThat(result.ingredientNameHint()).isEqualTo("flour");
    }

    // -------------------------------------------------------------------------
    // Simple integer / decimal
    // -------------------------------------------------------------------------

    @Test
    void integerQuantity_withAbbreviationUnit_andName() {
        var result = IngredientLineParser.parse("2 tbsp olive oil");
        assertThat(result.quantity()).isEqualTo(2.0);
        assertThat(result.unitNameHint()).isEqualTo("tbsp");
        assertThat(result.ingredientNameHint()).isEqualTo("olive oil");
    }

    @Test
    void decimalQuantity_withUnit_andName() {
        var result = IngredientLineParser.parse("1.5 kg chicken");
        assertThat(result.quantity()).isEqualTo(1.5);
        assertThat(result.unitNameHint()).isEqualTo("kg");
        assertThat(result.ingredientNameHint()).isEqualTo("chicken");
    }

    // -------------------------------------------------------------------------
    // Fraction
    // -------------------------------------------------------------------------

    @Test
    void fractionQuantity_withUnit_andName() {
        var result = IngredientLineParser.parse("1/2 tsp salt");
        assertThat(result.quantity()).isCloseTo(0.5, within(0.001));
        assertThat(result.unitNameHint()).isEqualTo("tsp");
        assertThat(result.ingredientNameHint()).isEqualTo("salt");
    }

    @Test
    void fractionQuantity_withNoUnit_andName() {
        var result = IngredientLineParser.parse("3/4 avocado");
        assertThat(result.quantity()).isCloseTo(0.75, within(0.001));
        assertThat(result.unitNameHint()).isNull();
        assertThat(result.ingredientNameHint()).isEqualTo("avocado");
    }

    // -------------------------------------------------------------------------
    // Unicode fractions
    // -------------------------------------------------------------------------

    @Test
    void unicodeFraction_halfCup() {
        var result = IngredientLineParser.parse("½ cup sugar");
        assertThat(result.quantity()).isCloseTo(0.5, within(0.001));
        assertThat(result.unitNameHint()).isEqualTo("cup");
        assertThat(result.ingredientNameHint()).isEqualTo("sugar");
    }

    @Test
    void unicodeFraction_quarterTsp() {
        var result = IngredientLineParser.parse("¼ tsp vanilla");
        assertThat(result.quantity()).isCloseTo(0.25, within(0.001));
        assertThat(result.unitNameHint()).isEqualTo("tsp");
        assertThat(result.ingredientNameHint()).isEqualTo("vanilla");
    }

    // -------------------------------------------------------------------------
    // Mixed numbers (whole + fraction)
    // -------------------------------------------------------------------------

    @Test
    void mixedNumber_spaceDelimited() {
        var result = IngredientLineParser.parse("1 1/2 cups flour");
        assertThat(result.quantity()).isCloseTo(1.5, within(0.001));
        assertThat(result.unitNameHint()).isEqualTo("cup");
        assertThat(result.ingredientNameHint()).isEqualTo("flour");
    }

    @Test
    void mixedNumber_unicodeGlued_to_integer() {
        // "1½" normalises to "1 1/2"
        var result = IngredientLineParser.parse("1½ cups flour");
        assertThat(result.quantity()).isCloseTo(1.5, within(0.001));
        assertThat(result.unitNameHint()).isEqualTo("cup");
        assertThat(result.ingredientNameHint()).isEqualTo("flour");
    }

    // -------------------------------------------------------------------------
    // Glued quantity + unit (no whitespace between them)
    // -------------------------------------------------------------------------

    @Test
    void gluedDecimalUnit_integer() {
        var result = IngredientLineParser.parse("200g plain flour");
        assertThat(result.quantity()).isEqualTo(200.0);
        assertThat(result.unitNameHint()).isEqualTo("g");
        assertThat(result.ingredientNameHint()).isEqualTo("plain flour");
    }

    @Test
    void gluedDecimalUnit_decimal() {
        var result = IngredientLineParser.parse("1.5kg potatoes");
        assertThat(result.quantity()).isEqualTo(1.5);
        assertThat(result.unitNameHint()).isEqualTo("kg");
        assertThat(result.ingredientNameHint()).isEqualTo("potatoes");
    }

    @Test
    void gluedFractionUnit() {
        // "1/2tsp" — fraction glued directly to unit abbreviation
        var result = IngredientLineParser.parse("1/2tsp baking powder");
        assertThat(result.quantity()).isCloseTo(0.5, within(0.001));
        assertThat(result.unitNameHint()).isEqualTo("tsp");
        assertThat(result.ingredientNameHint()).isEqualTo("baking powder");
    }

    @Test
    void gluedUnit_unknownAbbreviation_unitHintIsNull() {
        // "200xyz" — 200 parsed as quantity; "xyz" not in synonym table
        var result = IngredientLineParser.parse("200xyz flour");
        assertThat(result.quantity()).isEqualTo(200.0);
        assertThat(result.unitNameHint()).isNull();
        assertThat(result.ingredientNameHint()).isEqualTo("flour");
    }

    // -------------------------------------------------------------------------
    // Range (take lower bound)
    // -------------------------------------------------------------------------

    @Test
    void range_hyphenSeparated() {
        var result = IngredientLineParser.parse("2-3 tbsp cream");
        assertThat(result.quantity()).isEqualTo(2.0);
        assertThat(result.unitNameHint()).isEqualTo("tbsp");
        assertThat(result.ingredientNameHint()).isEqualTo("cream");
    }

    // -------------------------------------------------------------------------
    // Plural / alias canonicalisation
    // -------------------------------------------------------------------------

    @Test
    void pluralUnit_canonicalisedToSingularHint() {
        var result = IngredientLineParser.parse("3 teaspoons vanilla extract");
        assertThat(result.quantity()).isEqualTo(3.0);
        assertThat(result.unitNameHint()).isEqualTo("tsp");   // canonical form
        assertThat(result.ingredientNameHint()).isEqualTo("vanilla extract");
    }

    @Test
    void pluralCup_canonicalisedToSingular() {
        var result = IngredientLineParser.parse("2 cups sugar");
        assertThat(result.unitNameHint()).isEqualTo("cup");
    }

    @Test
    void abbreviation_c_resolvesToCup() {
        var result = IngredientLineParser.parse("1 c milk");
        assertThat(result.unitNameHint()).isEqualTo("cup");
    }

    // -------------------------------------------------------------------------
    // Two-token unit
    // -------------------------------------------------------------------------

    @Test
    void twoTokenUnit_flOz() {
        var result = IngredientLineParser.parse("2 fl oz cream");
        assertThat(result.quantity()).isEqualTo(2.0);
        assertThat(result.unitNameHint()).isEqualTo("fl oz");
        assertThat(result.ingredientNameHint()).isEqualTo("cream");
    }

    @Test
    void twoTokenUnit_fluidOunces() {
        var result = IngredientLineParser.parse("4 fluid ounces milk");
        assertThat(result.quantity()).isEqualTo(4.0);
        assertThat(result.unitNameHint()).isEqualTo("fl oz");
        assertThat(result.ingredientNameHint()).isEqualTo("milk");
    }

    // -------------------------------------------------------------------------
    // No unit – number followed directly by name
    // -------------------------------------------------------------------------

    @Test
    void noUnit_numberPlusName() {
        var result = IngredientLineParser.parse("2 large eggs");
        assertThat(result.quantity()).isEqualTo(2.0);
        assertThat(result.unitNameHint()).isNull();
        assertThat(result.ingredientNameHint()).isEqualTo("large eggs");
    }

    @Test
    void quantity_withNoRemainingName_nameHintIsNull() {
        var result = IngredientLineParser.parse("200g");
        assertThat(result.quantity()).isEqualTo(200.0);
        assertThat(result.unitNameHint()).isEqualTo("g");
        assertThat(result.ingredientNameHint()).isNull();
    }

    // -------------------------------------------------------------------------
    // Case insensitivity in unit matching
    // -------------------------------------------------------------------------

    @Test
    void unitMatchingIsCaseInsensitive() {
        var result = IngredientLineParser.parse("2 TBSP olive oil");
        assertThat(result.unitNameHint()).isEqualTo("tbsp");
    }

    // -------------------------------------------------------------------------
    // Multi-word ingredient names preserved
    // -------------------------------------------------------------------------

    @Test
    void multiWordIngredientName_preservedInFull() {
        var result = IngredientLineParser.parse("100 g self-raising flour");
        assertThat(result.quantity()).isEqualTo(100.0);
        assertThat(result.unitNameHint()).isEqualTo("g");
        assertThat(result.ingredientNameHint()).isEqualTo("self-raising flour");
    }
}

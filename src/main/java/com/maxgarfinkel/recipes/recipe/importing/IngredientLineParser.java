package com.maxgarfinkel.recipes.recipe.importing;

import java.util.Arrays;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parses a raw ingredient line string into its constituent parts: quantity, unit hint, and
 * ingredient name hint. This is a pure utility class with no Spring dependencies.
 *
 * <p>Parsing proceeds in three sequential stages:</p>
 * <ol>
 *   <li><b>Normalise</b> – replaces Unicode fraction characters with ASCII equivalents.</li>
 *   <li><b>Quantity</b> – consumes the leading token(s) if they represent a number
 *       (integer, decimal, fraction, range, or number glued to a unit abbreviation).</li>
 *   <li><b>Unit</b> – if a quantity was found, checks the next one or two tokens against
 *       a synonym table of known culinary units.</li>
 *   <li><b>Name</b> – all remaining tokens joined as the ingredient name hint. If no
 *       quantity was found, the entire normalised text becomes the name hint.</li>
 * </ol>
 *
 * <p>Any field in the returned {@link ParsedLine} may be {@code null} if not found.</p>
 */
class IngredientLineParser {

    record ParsedLine(Double quantity, String unitNameHint, String ingredientNameHint) {}

    // -------------------------------------------------------------------------
    // Unicode fraction normalisation
    // -------------------------------------------------------------------------

    private static final Map<Character, String> UNICODE_FRACTIONS = Map.of(
            '½', "1/2",
            '⅓', "1/3",
            '⅔', "2/3",
            '¼', "1/4",
            '¾', "3/4",
            '⅕', "1/5",
            '⅖', "2/5",
            '⅗', "3/5",
            '⅘', "4/5",
            '⅙', "1/6"
    );

    // -------------------------------------------------------------------------
    // Quantity patterns
    // -------------------------------------------------------------------------

    /** Plain integer or decimal, e.g. "2", "1.5". */
    private static final Pattern DECIMAL = Pattern.compile("^\\d+(\\.\\d+)?$");

    /** Fraction, e.g. "1/2". */
    private static final Pattern FRACTION = Pattern.compile("^(\\d+)/(\\d+)$");

    /** Numeric range – take the lower bound, e.g. "2-3" or "2–3". */
    private static final Pattern RANGE = Pattern.compile("^(\\d+\\.?\\d*)[-–](\\d+\\.?\\d*)$");

    /** Number glued directly to letters, e.g. "200g", "1.5kg". */
    private static final Pattern GLUED_DECIMAL = Pattern.compile("^(\\d+\\.?\\d*)([a-zA-Z].*)$");

    /** Fraction glued directly to letters, e.g. "1/2tsp". */
    private static final Pattern GLUED_FRACTION = Pattern.compile("^(\\d+)/(\\d+)([a-zA-Z].*)$");

    // -------------------------------------------------------------------------
    // Unit synonym table
    // -------------------------------------------------------------------------

    /**
     * Maps lowercase unit aliases to the canonical hint string used by
     * {@code ImportService} for database resolution (matched case-insensitively
     * against unit name and abbreviation).
     */
    private static final Map<String, String> UNIT_SYNONYMS = Map.ofEntries(
            // Gram  (abbreviation 'g')
            Map.entry("g",              "g"),
            Map.entry("gram",           "g"),
            Map.entry("grams",          "g"),
            // Kilogram  (abbreviation 'kg')
            Map.entry("kg",             "kg"),
            Map.entry("kilogram",       "kg"),
            Map.entry("kilograms",      "kg"),
            // Ounce  (abbreviation 'oz')
            Map.entry("oz",             "oz"),
            Map.entry("ounce",          "oz"),
            Map.entry("ounces",         "oz"),
            // Pound  (abbreviation 'lb')
            Map.entry("lb",             "lb"),
            Map.entry("lbs",            "lb"),
            Map.entry("pound",          "lb"),
            Map.entry("pounds",         "lb"),
            // Millilitres  (abbreviation 'ml')
            Map.entry("ml",             "ml"),
            Map.entry("millilitre",     "ml"),
            Map.entry("millilitres",    "ml"),
            Map.entry("milliliter",     "ml"),
            Map.entry("milliliters",    "ml"),
            // Centilitres  (abbreviation 'cl')
            Map.entry("cl",             "cl"),
            Map.entry("centilitre",     "cl"),
            Map.entry("centilitres",    "cl"),
            Map.entry("centiliter",     "cl"),
            Map.entry("centiliters",    "cl"),
            // Litres  (abbreviation 'l')
            Map.entry("l",              "l"),
            Map.entry("litre",          "l"),
            Map.entry("litres",         "l"),
            Map.entry("liter",          "l"),
            Map.entry("liters",         "l"),
            // Teaspoon  (abbreviation 'tsp')
            Map.entry("tsp",            "tsp"),
            Map.entry("teaspoon",       "tsp"),
            Map.entry("teaspoons",      "tsp"),
            // Tablespoon  (abbreviation 'tbsp')
            Map.entry("tbsp",           "tbsp"),
            Map.entry("tbs",            "tbsp"),
            Map.entry("tablespoon",     "tbsp"),
            Map.entry("tablespoons",    "tbsp"),
            // Cup  (name 'Cup', abbreviation 'c')
            Map.entry("c",              "cup"),
            Map.entry("cup",            "cup"),
            Map.entry("cups",           "cup"),
            // Pint  (abbreviation 'pt')
            Map.entry("pt",             "pt"),
            Map.entry("pint",           "pt"),
            Map.entry("pints",          "pt"),
            // Pinch  (name 'Pinch', abbreviation 'pch')
            Map.entry("pch",            "pch"),
            Map.entry("pinch",          "pinch"),
            Map.entry("pinches",        "pinch"),
            // Handful  (name 'Handful', abbreviation 'hfl')
            Map.entry("hfl",            "hfl"),
            Map.entry("handful",        "handful"),
            Map.entry("handfuls",       "handful"),
            // Dash  (name 'Dash', abbreviation 'dsh')
            Map.entry("dsh",            "dsh"),
            Map.entry("dash",           "dash"),
            Map.entry("dashes",         "dash"),
            // Drop  (name 'Drop', abbreviation 'drp')
            Map.entry("drp",            "drp"),
            Map.entry("drop",           "drop"),
            Map.entry("drops",          "drop"),
            // US Fluid Ounces  (abbreviation 'fl oz') – two-token, matched separately
            Map.entry("fl oz",          "fl oz"),
            Map.entry("fluid ounce",    "fl oz"),
            Map.entry("fluid ounces",   "fl oz"),
            // Inch  (abbreviation 'in')
            Map.entry("in",             "in"),
            Map.entry("inch",           "in"),
            Map.entry("inches",         "in"),
            // Centimeter  (abbreviation 'cm')
            Map.entry("cm",             "cm"),
            Map.entry("centimeter",     "cm"),
            Map.entry("centimeters",    "cm"),
            Map.entry("centimetre",     "cm"),
            Map.entry("centimetres",    "cm"),
            // Millimeter  (abbreviation 'mm')
            Map.entry("mm",             "mm"),
            Map.entry("millimeter",     "mm"),
            Map.entry("millimeters",    "mm"),
            Map.entry("millimetre",     "mm"),
            Map.entry("millimetres",    "mm")
    );

    private IngredientLineParser() {}

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Parse {@code rawText} into a {@link ParsedLine}. Any field may be {@code null}.
     */
    static ParsedLine parse(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return new ParsedLine(null, null, null);
        }

        String[] tokens = normalise(rawText.trim()).split("\\s+");
        int cursor = 0;
        Double quantity = null;
        String gluedUnit = null;

        // ------------------------------------------------------------------
        // Stage 1: quantity
        // ------------------------------------------------------------------
        if (cursor < tokens.length) {
            String t = tokens[cursor];

            Matcher gluedFrac = GLUED_FRACTION.matcher(t);
            Matcher gluedDec  = GLUED_DECIMAL.matcher(t);
            Matcher frac      = FRACTION.matcher(t);
            Matcher range     = RANGE.matcher(t);

            if (gluedFrac.matches()) {
                // e.g. "1/2tsp"
                quantity = Double.parseDouble(gluedFrac.group(1)) / Double.parseDouble(gluedFrac.group(2));
                gluedUnit = gluedFrac.group(3);
                cursor++;
            } else if (gluedDec.matches()) {
                // e.g. "200g", "1.5kg"
                quantity = Double.parseDouble(gluedDec.group(1));
                gluedUnit = gluedDec.group(2);
                cursor++;
            } else if (DECIMAL.matcher(t).matches()) {
                quantity = Double.parseDouble(t);
                cursor++;
                // Check for trailing fraction forming a mixed number, e.g. "1 1/2"
                if (cursor < tokens.length) {
                    Matcher nextFrac = FRACTION.matcher(tokens[cursor]);
                    if (nextFrac.matches()) {
                        quantity += Double.parseDouble(nextFrac.group(1)) / Double.parseDouble(nextFrac.group(2));
                        cursor++;
                    }
                }
            } else if (frac.matches()) {
                // e.g. "1/2"
                quantity = Double.parseDouble(frac.group(1)) / Double.parseDouble(frac.group(2));
                cursor++;
            } else if (range.matches()) {
                // e.g. "2-3" → take lower bound
                quantity = Double.parseDouble(range.group(1));
                cursor++;
            }
        }

        // ------------------------------------------------------------------
        // Stage 2 + 3: unit and name (only when a quantity was found)
        // ------------------------------------------------------------------
        if (quantity == null) {
            // No leading number — treat the whole text as the ingredient name hint
            String name = String.join(" ", tokens).trim();
            return new ParsedLine(null, null, name.isEmpty() ? null : name);
        }

        String unitHint = null;

        if (gluedUnit != null) {
            // Unit was glued to the quantity token; may or may not be in the synonym table
            unitHint = UNIT_SYNONYMS.get(gluedUnit.toLowerCase());
        } else if (cursor < tokens.length) {
            // Try two-token unit first ("fl oz", "fluid ounce", "fluid ounces")
            if (cursor + 1 < tokens.length) {
                String twoToken = (tokens[cursor] + " " + tokens[cursor + 1]).toLowerCase();
                if (UNIT_SYNONYMS.containsKey(twoToken)) {
                    unitHint = UNIT_SYNONYMS.get(twoToken);
                    cursor += 2;
                }
            }
            // Then single-token unit
            if (unitHint == null) {
                String oneToken = tokens[cursor].toLowerCase();
                if (UNIT_SYNONYMS.containsKey(oneToken)) {
                    unitHint = UNIT_SYNONYMS.get(oneToken);
                    cursor++;
                }
            }
        }

        String nameHint = null;
        if (cursor < tokens.length) {
            String joined = String.join(" ", Arrays.copyOfRange(tokens, cursor, tokens.length)).trim();
            if (!joined.isEmpty()) {
                nameHint = joined;
            }
        }

        return new ParsedLine(quantity, unitHint, nameHint);
    }

    // -------------------------------------------------------------------------
    // Normalisation
    // -------------------------------------------------------------------------

    private static String normalise(String text) {
        StringBuilder sb = new StringBuilder(text.length() + 8);
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            String frac = UNICODE_FRACTIONS.get(c);
            if (frac != null) {
                // Insert a space before the fraction when immediately preceded by a digit
                // so that "1½" becomes "1 1/2" and tokenises as a mixed number.
                if (!sb.isEmpty() && Character.isDigit(sb.charAt(sb.length() - 1))) {
                    sb.append(' ');
                }
                sb.append(frac);
            } else {
                sb.append(c);
            }
        }
        return sb.toString().replaceAll("\\s+", " ").trim();
    }
}

package com.maxgarfinkel.recipes.ingredient;

import com.maxgarfinkel.recipes.unit.Unit;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "ingredient_alias")
public class IngredientAlias {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;

    @Column(name = "alias_text", nullable = false, unique = true, length = 512)
    @Getter
    @Setter
    private String aliasText;

    @ManyToOne
    @JoinColumn(name = "ingredient_id", nullable = false)
    @Getter
    @Setter
    private Ingredient ingredient;

    @ManyToOne
    @JoinColumn(name = "unit_id", nullable = false)
    @Getter
    @Setter
    private Unit unit;
}

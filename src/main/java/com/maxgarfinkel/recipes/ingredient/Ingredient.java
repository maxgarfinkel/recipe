package com.maxgarfinkel.recipes.ingredient;

import com.maxgarfinkel.recipes.unit.Unit;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Getter
    private Long id;

    @Setter
    private String name;

    @ManyToOne()
    @JoinColumn(name = "default_unit")
    @Getter
    @Setter
    private Unit defaultUnit;

    public IngredientDto toDto() {
        return new IngredientDto(name, id, defaultUnit != null ? defaultUnit.toDto() : null);
    }
}

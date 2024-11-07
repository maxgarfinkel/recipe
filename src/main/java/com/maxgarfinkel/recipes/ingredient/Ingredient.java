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
    @JoinColumn(name = "unit")
    @Setter
    private Unit unit;

    public IngredientDto toDto() {
        return new IngredientDto(name, id, unit.toDto());
    }
}

package com.maxgarfinkel.recipes.unit;

import jakarta.persistence.*;
import lombok.Getter;

@Entity
public class Unit {

    @Id
    @Getter
    private Long id;
    private String name;
    private String abbreviation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "base")
    private Unit base;

    @Column(name = "basefactor")
    private Double baseFactor;

    public UnitDto toDto() {
        if(base == null) {
            return new UnitDto(id, name, abbreviation, null, baseFactor);
        }
        return new UnitDto(id, name, abbreviation, base.toDto(), baseFactor);
    }
}

package com.maxgarfinkel.recipes.ingredient;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {
    Page<Ingredient> findAllByOrderByNameAsc(Pageable pageable);
}

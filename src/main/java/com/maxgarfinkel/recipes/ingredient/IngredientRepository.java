package com.maxgarfinkel.recipes.ingredient;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {
    Page<Ingredient> findAllByOrderByNameAsc(Pageable pageable);

    @Query("SELECT i FROM Ingredient i WHERE lower(trim(i.name)) = :normalisedName")
    Optional<Ingredient> findByNormalisedName(@Param("normalisedName") String normalisedName);
}

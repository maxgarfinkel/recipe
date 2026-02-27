package com.maxgarfinkel.recipes.ingredient;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IngredientAliasRepository extends JpaRepository<IngredientAlias, Long> {
    Optional<IngredientAlias> findByAliasText(String aliasText);
}

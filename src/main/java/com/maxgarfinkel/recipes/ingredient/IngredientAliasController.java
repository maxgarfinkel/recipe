package com.maxgarfinkel.recipes.ingredient;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/ingredient-alias")
public class IngredientAliasController {

    private final IngredientAliasService ingredientAliasService;

    @PostMapping("/")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void save(@RequestBody IngredientAliasDto dto) {
        ingredientAliasService.save(dto.getAliasText(), dto.getIngredientId(), dto.getUnitId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long id) {
        ingredientAliasService.delete(id);
    }
}

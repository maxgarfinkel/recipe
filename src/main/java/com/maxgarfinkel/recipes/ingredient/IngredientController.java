package com.maxgarfinkel.recipes.ingredient;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/ingredient")
public class IngredientController {

    private final IngredientService ingredientService;

    @GetMapping("/")
    List<IngredientDto> all() {
        return ingredientService.getAllAsDto();
    }

    @PostMapping("/")
    IngredientDto add(@RequestBody IngredientDto ingredientDto) {
        return ingredientService.create(ingredientDto.getName(),
                ingredientDto.getUnitId());
    }

    @PutMapping("/{id}")
    IngredientDto update(@PathVariable Long id, @RequestBody IngredientDto ingredientDto) {
        return ingredientService.update(id, ingredientDto.getName());
    }

    @DeleteMapping("/{id}")
    void delete(@PathVariable Long id) {
        ingredientService.delete(id);
    }
}


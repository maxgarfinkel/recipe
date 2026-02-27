package com.maxgarfinkel.recipes.ingredient;

import com.maxgarfinkel.recipes.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/ingredient")
public class IngredientController {

    private final IngredientService ingredientService;
    private final IngredientAliasService ingredientAliasService;

    @GetMapping("/")
    List<IngredientDto> all() {
        return ingredientService.getAllAsDto();
    }

    @GetMapping("/page")
    PageResponse<IngredientDto> page(@RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "20") int size) {
        return ingredientService.getPageAsDto(page, size);
    }

    @PostMapping("/")
    IngredientDto add(@RequestBody IngredientDto ingredientDto) {
        return ingredientService.create(ingredientDto.getName(),
                ingredientDto.getUnitId());
    }

    @PutMapping("/{id}")
    IngredientDto update(@PathVariable Long id, @RequestBody IngredientDto ingredientDto) {
        return ingredientService.update(id, ingredientDto.getName(), ingredientDto.getUnitId());
    }

    @GetMapping("/{id}/alias")
    List<IngredientAliasResponseDto> aliases(@PathVariable Long id) {
        return ingredientAliasService.findByIngredientId(id);
    }

    @DeleteMapping("/{id}")
    void delete(@PathVariable Long id) {
        ingredientService.delete(id);
    }
}

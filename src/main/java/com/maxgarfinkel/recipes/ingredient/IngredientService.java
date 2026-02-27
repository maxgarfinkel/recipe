package com.maxgarfinkel.recipes.ingredient;

import com.maxgarfinkel.recipes.ItemNotFound;
import com.maxgarfinkel.recipes.PageResponse;
import com.maxgarfinkel.recipes.unit.UnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IngredientService {

    private final IngredientRepository ingredientRepository;
    private final UnitService unitService;

    public List<IngredientDto> getAllAsDto() {
        return ingredientRepository.findAll()
                .stream()
                .map(Ingredient::toDto)
                .toList();
    }

    public PageResponse<IngredientDto> getPageAsDto(int page, int size) {
        return PageResponse.of(
                ingredientRepository.findAllByOrderByNameAsc(PageRequest.of(page, size))
                        .map(Ingredient::toDto)
        );
    }

    public IngredientDto create(String ingredientName, Long unitId) {
        var ingredient = new Ingredient();
        ingredient.setName(ingredientName);
        if(unitId != null) {
            ingredient.setDefaultUnit(unitService.getEntityById(unitId));
        }
        return ingredientRepository.save(ingredient).toDto();
    }

    public IngredientDto update(Long id, String name, Long unitId) {
        return ingredientRepository.findById(id)
                .map(i -> {
                    i.setName(name);
                    i.setDefaultUnit(unitId != null ? unitService.getEntityById(unitId) : null);
                    return ingredientRepository.save(i).toDto();
                })
                .orElseThrow(() -> new ItemNotFound(id, "Ingredient",
                        "Unable to update ingredient with id " + id));
    }

    public void delete(Long id) {
        ingredientRepository.deleteById(id);
    }

    public List<Ingredient> findAllById(List<Long> ingredientIds) {
        return ingredientRepository.findAllById(ingredientIds);
    }
}

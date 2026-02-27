package com.maxgarfinkel.recipes.ingredient;

import com.maxgarfinkel.recipes.unit.UnitService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IngredientAliasService {

    private final IngredientAliasRepository repository;
    private final IngredientRepository ingredientRepository;
    private final UnitService unitService;

    /**
     * Save or update an alias mapping. If the normalised alias text already exists the
     * existing record is updated with the new ingredient and unit (the user's most recent
     * resolution wins).
     */
    public void save(String rawAliasText, Long ingredientId, Long unitId) {
        String normalised = normalise(rawAliasText);
        repository.findByAliasText(normalised).ifPresentOrElse(
            existing -> {
                existing.setIngredient(ingredientRepository.getReferenceById(ingredientId));
                existing.setUnit(unitService.getEntityById(unitId));
                repository.save(existing);
            },
            () -> {
                IngredientAlias alias = new IngredientAlias();
                alias.setAliasText(normalised);
                alias.setIngredient(ingredientRepository.getReferenceById(ingredientId));
                alias.setUnit(unitService.getEntityById(unitId));
                repository.save(alias);
            }
        );
    }

    public List<IngredientAlias> findAll() {
        return repository.findAll();
    }

    public static String normalise(String text) {
        return text == null ? null : text.toLowerCase().trim();
    }
}

package com.maxgarfinkel.recipes.unit;

import com.maxgarfinkel.recipes.ItemNotFound;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class UnitService {

    private final UnitRepository unitRepository;

    public List<UnitDto> getUnitsAsDtos() {
        return unitRepository.findAll()
                .stream()
                .map(Unit::toDto)
                .toList();
    }

    public Unit getEntityById(Long unitId) {
        return unitRepository.findById(unitId).orElseThrow(
                () ->  new ItemNotFound(unitId, "unit", "Unable to find unit with id: " + unitId)
        );
    }

    public List<Unit> findAllById(List<Long> ids) {
        return unitRepository.findAllById(ids);
    }
}

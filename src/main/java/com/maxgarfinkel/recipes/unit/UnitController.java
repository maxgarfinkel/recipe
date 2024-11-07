package com.maxgarfinkel.recipes.unit;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/unit")
public class UnitController {

    private final UnitService unitService;

    @GetMapping("/")
    public List<UnitDto> getAllUnits() {
        return unitService.getUnitsAsDtos();
    }
}
